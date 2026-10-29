// Map definitions. A map is a list of seven-hex clusters, as on the printed map pages, plus
// the factory sites, starting hexes and starting crystal piles (deposits). buildMap turns a
// definition into the plain-data map the engine stores in the game state; generateMap builds
// a fair random map from a seed, so "Map 17" is always the same map.
import {
  key, parseKey, clusterCentre, clusterHexes, DIRECTION_NAMES, cheapestPaths, distance,
  neighbourKeys, toPixel,
} from "./hex.js?v=0.53";

// Fixed map 1: 12 clusters, 84 hexes, about 11 hexes wide and 11 tall.
// Paired clusters (point-reflected through the middle of the map) have the same number of
// mountains but in different places, so one side cannot be read off from the other. The
// middle pair differs: the chasm cluster blocks three hexes and its partner two.
// Cluster fields: at = [i, j] cluster lattice position, centre = terrain of the centre hex,
// ring = terrain of ring hexes by direction (anything not listed is plain).
export const FIXED_MAP_1 = {
  id: "fixed-1",
  name: "Fixed map 1",
  clusters: [
    // Green home (top right) and blue home (bottom left).
    { id: "A", at: [1, -2], centre: "plain", ring: { NE: "mountain", SE: "mountain" } },
    { id: "L", at: [0, 2], centre: "plain", ring: { S: "mountain", SW: "mountain" } },
    { id: "B", at: [0, -1], centre: "rocky",
      ring: { N: "mountain", NW: "mountain", SW: "mountain" } },
    { id: "K", at: [1, 1], centre: "rocky",
      ring: { S: "mountain", SE: "mountain", SW: "mountain" } },
    { id: "C", at: [-1, 0], centre: "rocky", ring: { NW: "mountain", SW: "mountain" } },
    { id: "J", at: [2, 0], centre: "rocky", ring: { SE: "mountain", S: "mountain" } },
    { id: "D", at: [1, -1], centre: "rocky", ring: { SE: "mountain" } },
    { id: "I", at: [0, 1], centre: "rocky", ring: { N: "mountain" } },
    { id: "F", at: [-1, 1], centre: "rocky",
      ring: { NW: "mountain", SW: "mountain", S: "mountain" } },
    { id: "G", at: [2, -1], centre: "rocky",
      ring: { NE: "mountain", SE: "mountain", S: "mountain" } },
    // Middle pair: the chasm cluster from the tile sheet (crack through N, centre and SW),
    // and a rocky cluster with a mountain and the single-hex chasm.
    { id: "E", at: [0, 0], centre: "chasm", ring: { N: "chasm", SW: "chasm" } },
    { id: "H", at: [1, 0], centre: "rocky", ring: { N: "mountain", SE: "chasm" } },
  ],
  // Player 0 (blue) and player 1 (green): factory on the centre of the home cluster.
  factories: ["L", "A"],
  // Starting hexes in the order of RULES.start.units.
  starts: [
    ["-2,5", "-1,5", "-1,6"],
    ["4,-4", "3,-4", "3,-5"],
  ],
  // Starting crystal piles. Each pair is the same path cost from its own factory and from the
  // enemy's (own / enemy): pair 0 2/9, pair 1 3/8, pair 2 4/7, pair 3 7/9. The middle pile is
  // 7 from both. Checked by mapProblems.
  deposits: [
    { at: "-1,4", pair: 0 }, { at: "3,-3", pair: 0 },
    { at: "1,3", pair: 1 }, { at: "1,-2", pair: 1 },
    { at: "0,2", pair: 2 }, { at: "2,-1", pair: 2 },
    { at: "5,1", pair: 3 }, { at: "5,-2", pair: 3 },
    { at: "4,0", pair: null },
  ],
};

export function buildMap(def) {
  const hexes = {};
  const centres = {};
  for (const cluster of def.clusters) {
    const centre = clusterCentre(...cluster.at);
    centres[cluster.id] = key(...centre);
    clusterHexes(centre).forEach(([q, r], index) => {
      // slot: where the hex sits in its cluster, so a crack drawn across several hexes
      // can be pieced together.
      const slot = index === 0 ? "centre" : DIRECTION_NAMES[index - 1];
      const terrain = index === 0 ? cluster.centre : cluster.ring[slot] || "plain";
      hexes[key(q, r)] = { terrain, cluster: cluster.id, slot };
    });
  }
  return {
    id: def.id,
    name: def.name,
    hexes,
    factories: def.factories.map((clusterId) => centres[clusterId]),
    // Unused factories, in pairs like the deposits: [{ at, pair }].
    neutralFactories: def.neutralFactories || [],
    starts: def.starts,
    deposits: def.deposits,
  };
}

// ---------------------------------------------------------------------------------------
// Fairness checks

// Units need this many free hexes round the factory to start on and build into.
const MIN_FREE_FACTORY_NEIGHBOURS = 4;

function pathCosts(map, terrainRules, from) {
  const costOf = (k) => (map.hexes[k] ? terrainRules[map.hexes[k].terrain].moveCost : null);
  const paths = cheapestPaths(from, costOf);
  const costs = {};
  for (const k in paths) costs[k] = paths[k].cost;
  return costs;
}

function isOpen(map, terrainRules, k) {
  return Boolean(map.hexes[k]) && terrainRules[map.hexes[k].terrain].moveCost !== null;
}

// Problems that make a map unfair or unplayable; an empty list means it is fine. Distances
// are path costs over terrain (units can drive over crystals, so deposits do not block).
export function mapProblems(map, terrainRules) {
  if (map.factories.length > 2) return multiSideProblems(map, terrainRules);
  const problems = [];
  const [blue, green] = map.factories.map((f) => pathCosts(map, terrainRules, f));
  for (const k in map.hexes) {
    if (isOpen(map, terrainRules, k) && blue[k] === undefined) {
      problems.push(`${k} cannot be reached`);
    }
  }
  const neutral = map.neutralFactories || [];
  [...map.factories, ...neutral.map((f) => f.at)].forEach((f) => {
    const free = neighbourKeys(f).filter((k) => isOpen(map, terrainRules, k));
    if (free.length < MIN_FREE_FACTORY_NEIGHBOURS) problems.push(`factory at ${f} is hemmed in`);
  });
  if (blue[map.factories[1]] !== green[map.factories[0]]) problems.push("factories differ");
  // Each pair of unused factories: one nearer each side, mirroring each other's distances.
  const factoryPairs = {};
  for (const f of neutral) (factoryPairs[f.pair] ||= []).push(f.at);
  for (const id in factoryPairs) {
    const [a, b] = factoryPairs[id];
    const fair = factoryPairs[id].length === 2 && blue[a] === green[b] && green[a] === blue[b];
    if (!fair) problems.push(`unused factory pair ${id} is unfair`);
  }

  // Paired piles (same pair number) must mirror each other's distances; an unpaired pile
  // must be equally far from both factories.
  const pairs = {};
  for (const d of map.deposits) {
    if (d.pair === null) {
      if (blue[d.at] !== green[d.at]) problems.push(`pile at ${d.at} is nearer one side`);
    } else {
      (pairs[d.pair] ||= []).push(d.at);
    }
  }
  for (const id in pairs) {
    const [a, b] = pairs[id];
    const fair = pairs[id].length === 2 && blue[a] === green[b] && green[a] === blue[b];
    if (!fair) problems.push(`pile pair ${id} is unfair`);
  }
  return problems;
}

// Maps for more than two sides cannot be mirrored, so they are checked against limits.
// Home factories: random mountains make exactly equal path costs between every two homes
// almost impossible (four homes round a rectangle are not even equally far apart in a
// straight line), so each side's path costs to the other homes, sorted, are compared rank by
// rank: nearest rival with nearest rival, and so on. At each rank they may differ by at most
// HOME_COST_SPREAD.
const HOME_COST_SPREAD = 2;
// Each set of piles or unused factories has one per side, nearer its own factory than any
// other. Across the set, the path costs from the owners' factories may differ by at most
// SET_OWN_SPREAD, and the costs from the nearest other factory by at most SET_RIVAL_SPREAD.
// Sets are drawn with equal costs where they fit; with four or more sides there is seldom room
// for exactly equal sets, so a difference of 1 is allowed.
const SET_OWN_SPREAD = 1;
const SET_RIVAL_SPREAD = 1;
// The pile that belongs to no side: its path costs from the factories differ by at most this.
const MIDDLE_PILE_SPREAD = 1;

const spreadOf = (values) => Math.max(...values) - Math.min(...values);

// The side whose factory is strictly nearest hex k, or -1 when two are equally near.
function ownerOf(costs, k) {
  const sorted = costs.map((c, side) => ({ side, cost: c[k] })).sort((a, b) => a.cost - b.cost);
  return sorted[0].cost < sorted[1].cost ? sorted[0].side : -1;
}

// Path cost from the nearest factory other than side's.
function rivalCost(costs, side, k) {
  return Math.min(...costs.filter((c, other) => other !== side).map((c) => c[k]));
}

// Whether sites (one per side, any order) are a fair set for the given costs.
function fairSet(costs, sites) {
  const owners = sites.map((k) => ownerOf(costs, k));
  if (sites.length !== costs.length || new Set(owners).size !== sites.length ||
    owners.includes(-1)) return false;
  const own = sites.map((k, i) => costs[owners[i]][k]);
  const rival = sites.map((k, i) => rivalCost(costs, owners[i], k));
  return spreadOf(own) <= SET_OWN_SPREAD && spreadOf(rival) <= SET_RIVAL_SPREAD;
}

function multiSideProblems(map, terrainRules,
  costs = map.factories.map((f) => pathCosts(map, terrainRules, f))) {
  const problems = [];
  for (const k in map.hexes) {
    if (isOpen(map, terrainRules, k) && costs.some((c) => c[k] === undefined)) {
      problems.push(`${k} cannot be reached`);
    }
  }
  const neutral = map.neutralFactories || [];
  [...map.factories, ...neutral.map((f) => f.at)].forEach((f) => {
    const free = neighbourKeys(f).filter((k) => isOpen(map, terrainRules, k));
    if (free.length < MIN_FREE_FACTORY_NEIGHBOURS) problems.push(`factory at ${f} is hemmed in`);
  });
  if (problems.length) return problems;
  const profiles = costs.map((c, side) => map.factories.filter((f, other) => other !== side)
    .map((f) => c[f]).sort((a, b) => a - b));
  for (let rank = 0; rank < map.factories.length - 1; rank++) {
    if (spreadOf(profiles.map((p) => p[rank])) > HOME_COST_SPREAD) {
      problems.push("factories differ");
      break;
    }
  }
  const sets = (list, what) => {
    const byPair = {};
    for (const item of list) if (item.pair !== null) (byPair[item.pair] ||= []).push(item.at);
    for (const id in byPair) {
      if (!fairSet(costs, byPair[id])) problems.push(`${what} ${id} is unfair`);
    }
  };
  sets(neutral, "unused factory set");
  sets(map.deposits, "pile set");
  for (const d of map.deposits) {
    if (d.pair === null && spreadOf(costs.map((c) => c[d.at])) > MIDDLE_PILE_SPREAD) {
      problems.push(`pile at ${d.at} is nearer one side`);
    }
  }
  return problems;
}

// ---------------------------------------------------------------------------------------
// Generated maps

// Map shapes (Phil, 28 October 2026): the classic 12-block layout of fixed map 1, or rows of
// blocks from top to bottom, in three sizes. The bigger shapes have pairs of unused
// factories for infantry to capture, one of each pair nearer each side (with more sides,
// factoryPairs is the number of sets of them, one per side in each set). maxSides: the most
// sides the shape has room for.
export const MAP_SIZES = { small: "Small", medium: "Medium", large: "Large" };
export const MAP_SHAPES = {
  classic: { name: "Classic", size: "small", rows: null, factoryPairs: 0, maxSides: 2 },
  "3-4-4-3": { name: "3-4-4-3", size: "small", rows: [3, 4, 4, 3], factoryPairs: 1,
    maxSides: 2 },
  "3-5-5-3": { name: "3-5-5-3", size: "medium", rows: [3, 5, 5, 3], factoryPairs: 1,
    maxSides: 2 },
  "4-5-5-4": { name: "4-5-5-4", size: "medium", rows: [4, 5, 5, 4], factoryPairs: 2,
    maxSides: 2 },
  "5-6-6-5": { name: "5-6-6-5", size: "large", rows: [5, 6, 6, 5], factoryPairs: 2,
    maxSides: 2 },
  "4-5-6-5-4": { name: "4-5-6-5-4", size: "large", rows: [4, 5, 6, 5, 4], factoryPairs: 2,
    maxSides: 4 },
};
// Shapes only for more than two sides. They are kept out of MAP_SHAPES so the two-player
// shape picker, its "Any" choice and the AI's evolution pool stay as they are. The 37-block
// hexagon is the smallest layout with room for five or six homes spaced round it.
export const MULTI_SIDE_SHAPES = {
  "4-5-6-7-6-5-4": { name: "4-5-6-7-6-5-4", size: "large", rows: [4, 5, 6, 7, 6, 5, 4],
    factoryPairs: 2, minSides: 3, maxSides: 6 },
};
const MIN_SIDES = 2;

function shapeInfo(shape) {
  return Object.hasOwn(MAP_SHAPES, shape) ? MAP_SHAPES[shape]
    : Object.hasOwn(MULTI_SIDE_SHAPES, shape) ? MULTI_SIDE_SHAPES[shape] : null;
}

function shapeAllows(shape, sides) {
  const info = shapeInfo(shape);
  return Boolean(info) && sides >= (info.minSides || MIN_SIDES) && sides <= info.maxSides;
}

// The shapes that have maps for the given number of sides.
export function shapesForSides(sides) {
  return [...Object.keys(MAP_SHAPES), ...Object.keys(MULTI_SIDE_SHAPES)]
    .filter((shape) => shapeAllows(shape, sides));
}

// A layout: block positions on the cluster lattice, and the blocks in pairs, each pair
// point-reflected (or nearly) through the middle of the map. middle is the pair nearest the
// middle, which holds the chasm; the home factories go in one of the other pairs.

// The classic layout: the same 12 block positions as fixed map 1.
const CLASSIC_POSITIONS = {
  A: [1, -2], L: [0, 2], B: [0, -1], K: [1, 1], C: [-1, 0], J: [2, 0],
  D: [1, -1], I: [0, 1], F: [-1, 1], G: [2, -1], E: [0, 0], H: [1, 0],
};
const CLASSIC_PAIRS = [["L", "A"], ["K", "B"], ["C", "J"], ["I", "D"], ["F", "G"]];

// Home factories go in a pair of blocks at least this share of the widest pair's distance
// apart, so players start far from each other but not always in the same corners.
const HOME_SPREAD_SHARE = 0.75;

function blockPoint(at) {
  return toPixel(...clusterCentre(...at), 1);
}

// The pairs with how far apart their two blocks are.
function spreadPairs(blocks, pairs) {
  return pairs.map((ids) => {
    const [[ax, ay], [bx, by]] = ids.map((id) => blockPoint(blocks[id]));
    return { ids, spread: Math.hypot(ax - bx, ay - by) };
  });
}

function classicLayout() {
  return { blocks: CLASSIC_POSITIONS, middle: ["E", "H"],
    pairs: spreadPairs(CLASSIC_POSITIONS, CLASSIC_PAIRS) };
}

// Lattice positions searched when laying out rows of blocks.
const LAYOUT_SPAN = 8;
// Cluster centres along a row are this lattice step apart (about 11 degrees off horizontal).
const ROW_STEP = [3, -2];
const ROW_TOLERANCE = 0.01;
const LETTER_A = 65;
const LETTERS = 26;

// A layout of rows of blocks, e.g. [3, 4, 4, 3]. The clusters tile on a slanted grid, so the
// lattice is turned until rows run left to right, and each row takes the blocks nearest the
// middle. Each block is paired with the block opposite it through the middle of the map.
function rowsLayout(rows) {
  const [wx, wy] = toPixel(ROW_STEP[0], ROW_STEP[1], 1);
  const angle = -Math.atan2(wy, wx);
  const points = [];
  for (let i = -LAYOUT_SPAN; i <= LAYOUT_SPAN; i++) {
    for (let j = -LAYOUT_SPAN; j <= LAYOUT_SPAN; j++) {
      const [x, y] = toPixel(...clusterCentre(i, j), 1);
      points.push({ at: [i, j], x: x * Math.cos(angle) - y * Math.sin(angle),
        y: x * Math.sin(angle) + y * Math.cos(angle) });
    }
  }
  const rowYs = [...new Set(points.map((pt) => Math.round(pt.y / ROW_TOLERANCE)))]
    .sort((a, b) => a - b).map((y) => y * ROW_TOLERANCE);
  const middleRow = rowYs.reduce((best, y, i) =>
    (Math.abs(y) < Math.abs(rowYs[best]) ? i : best), 0);
  const first = middleRow - Math.floor(rows.length / 2);
  const chosen = [];
  rows.forEach((count, r) => {
    const inRow = points.filter((pt) => Math.abs(pt.y - rowYs[first + r]) < ROW_TOLERANCE)
      .sort((a, b) => Math.abs(a.x) - Math.abs(b.x) || a.x - b.x)
      .slice(0, count)
      .sort((a, b) => a.x - b.x);
    chosen.push(...inRow.map((pt) => ({ ...pt, row: r })));
  });

  const blocks = {};
  // Blocks are lettered A to Z, then AA, AB and so on.
  chosen.forEach((pt, n) => {
    pt.id = n < LETTERS ? String.fromCharCode(LETTER_A + n)
      : String.fromCharCode(LETTER_A) + String.fromCharCode(LETTER_A + n - LETTERS);
    blocks[pt.id] = pt.at;
  });
  // Pair each block with the one nearest its reflection through the middle.
  const cx = chosen.reduce((sum, pt) => sum + pt.x, 0) / chosen.length;
  const cy = chosen.reduce((sum, pt) => sum + pt.y, 0) / chosen.length;
  const free = [...chosen];
  const pairs = [];
  while (free.length > 1) {
    const a = free.shift();
    const tx = 2 * cx - a.x;
    const ty = 2 * cy - a.y;
    let best = 0;
    free.forEach((pt, i) => {
      if (Math.hypot(pt.x - tx, pt.y - ty) < Math.hypot(free[best].x - tx, free[best].y - ty)) {
        best = i;
      }
    });
    const b = free.splice(best, 1)[0];
    pairs.push([a.id, b.id]);
  }
  const spread = spreadPairs(blocks, pairs).sort((a, b) => a.spread - b.spread);
  return { blocks, middle: spread[0].ids, pairs: spread.slice(1) };
}

const layouts = {};

function layoutFor(shape) {
  if (!layouts[shape]) {
    const rows = shapeInfo(shape).rows;
    layouts[shape] = rows ? rowsLayout(rows) : classicLayout();
  }
  return layouts[shape];
}

// How many blocks a map of the given shape has.
export function shapeBlocks(shape) {
  return Object.keys(layoutFor(shape).blocks).length;
}

// Picks the home pair for a map: one of the pairs far enough apart, either way round (blue's
// block first). Returns { home, pairs } with the other non-middle pairs.
function chooseHome(random, layout) {
  const widest = Math.max(...layout.pairs.map((pr) => pr.spread));
  const options = layout.pairs.filter((pr) => pr.spread >= HOME_SPREAD_SHARE * widest);
  const choice = pick(random, options);
  const home = random() < 0.5 ? choice.ids : [...choice.ids].reverse();
  const pairs = layout.pairs.filter((pr) => pr !== choice).map((pr) => pr.ids);
  return { home, pairs };
}
// Mountains per block, drawn for each pair (both blocks get the same number). The home blocks
// keep enough room round the factory.
const HOME_MOUNTAINS = [0, 1, 2];
const OUTER_MOUNTAINS = [0, 1, 2, 2, 3, 3, 4];
// The cracked chasm cluster from the tile sheet: crack through N, centre and SW.
const CHASM_CLUSTER = { centre: "chasm", ring: { N: "chasm", SW: "chasm" } };
const MAX_ATTEMPTS = 500;
// Unused factories come in pairs like the piles: path cost from the nearer home factory at
// least this far (and at most half way), the other home at least margin further. Factories
// are kept FACTORY_SPACING apart.
const FACTORY_PAIR_BAND = { distance: [4, Infinity], margin: 1 };
const FACTORY_SPACING = 4;
// Starting crystal piles come in pairs, one per side, plus one equally far from both. For each
// pair: its path cost from the owner's factory, and how much further the enemy's must be.
const PILE_PAIR_BANDS = [
  { distance: [2, 3], margin: 4 },
  { distance: [3, 5], margin: 3 },
  { distance: [4, 6], margin: 2 },
  { distance: [5, 7], margin: 1 },
];
const PILE_SPACING = 2;
// Bigger maps get an extra pair of piles for every this many blocks over the classic 12, at
// any distance from home up to half way, a little nearer the owner, where they fit.
const CLASSIC_BLOCKS = 12;
const BLOCKS_PER_EXTRA_PAIR = 2;
const EXTRA_PAIR_BAND = { distance: [3, Infinity], margin: 1 };

export function seededRandom(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick(random, list) {
  return list[Math.floor(random() * list.length)];
}

function shuffled(random, list) {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function mountainRing(random, count) {
  const ring = {};
  for (const dir of shuffled(random, DIRECTION_NAMES).slice(0, count)) ring[dir] = "mountain";
  return ring;
}

function randomClusters(random, layout, { home, pairs }) {
  const clusters = {};
  const homeMountains = pick(random, HOME_MOUNTAINS);
  for (const id of home) {
    clusters[id] = { centre: "plain", ring: mountainRing(random, homeMountains) };
  }
  for (const pair of pairs) {
    const count = pick(random, OUTER_MOUNTAINS);
    for (const id of pair) clusters[id] = { centre: "rocky", ring: mountainRing(random, count) };
  }
  // One middle block holds the cracked chasm; its partner gets a single-hex chasm and a
  // mountain, so both block three hexes.
  const [chasmBlock, partner] = random() < 0.5 ? layout.middle : [...layout.middle].reverse();
  clusters[chasmBlock] = structuredClone(CHASM_CLUSTER);
  const [chasmDir, mountainDir] = shuffled(random, DIRECTION_NAMES);
  const ring = { [chasmDir]: "chasm", [mountainDir]: "mountain" };
  clusters[partner] = { centre: "rocky", ring };
  return Object.entries(layout.blocks).map(([id, at]) => ({ id, at, ...clusters[id] }));
}

// A pair of sites, one per side, with matching distances: own distance in range and the enemy
// at least margin further. Sites are at least spacing from taken hexes and each other, and
// must pass allowed. null if there is none.
function pilePair(random, costs, taken, { distance: [nearest, furthest], margin },
  { spacing = PILE_SPACING, allowed = () => true } = {}) {
  const [blue, green] = costs;
  const free = (k) => allowed(k) && !taken.some((t) => distance(t, k) < spacing);
  const options = [];
  for (const a in blue) {
    if (blue[a] < nearest || blue[a] > furthest || green[a] < blue[a] + margin || !free(a)) {
      continue;
    }
    for (const b in green) {
      if (b !== a && green[b] === blue[a] && blue[b] === green[a] &&
        distance(a, b) >= spacing && free(b)) options.push([a, b]);
    }
  }
  return options.length ? pick(random, options) : null;
}

// Starting piles for a map: one pair per band, then one in the middle. null if they will not
// fit; an extra pair that does not fit is left out. A pile may sit next to an unused factory
// but not on it. Exported so fixed maps can be given piles the same way.
export function placeStartPiles(random, map, terrainRules, extraPairs = 0) {
  const costs = map.factories.map((f) => pathCosts(map, terrainRules, f));
  // Keep the factories' surroundings clear for starting units and building.
  const taken = map.factories.flatMap((f) => [f, ...neighbourKeys(f)]);
  const piles = [];
  const halfWay = Math.ceil(costs[0][map.factories[1]] / 2);
  const extra = { ...EXTRA_PAIR_BAND, distance: [EXTRA_PAIR_BAND.distance[0], halfWay] };
  const bands = [...PILE_PAIR_BANDS, ...Array.from({ length: extraPairs }, () => extra)];
  const unused = (map.neutralFactories || []).map((f) => f.at);
  const allowed = (k) => !unused.includes(k);
  for (const [pair, band] of bands.entries()) {
    const sites = pilePair(random, costs, taken, band, { allowed });
    if (!sites && band === extra) continue;
    if (!sites) return null;
    taken.push(...sites);
    piles.push({ at: sites[0], pair }, { at: sites[1], pair });
  }
  const [blue, green] = costs;
  const middle = Object.keys(blue).filter((k) => blue[k] === green[k] && allowed(k) &&
    !taken.some((t) => distance(t, k) < PILE_SPACING));
  if (!middle.length) return null;
  piles.push({ at: pick(random, middle), pair: null });
  return piles;
}

// Unused factory sites: count pairs of open hexes with room round them, one nearer each side
// and mirroring each other's distances from the home factories. null if they will not fit.
function placeNeutralFactories(random, map, terrainRules, count) {
  const costs = map.factories.map((f) => pathCosts(map, terrainRules, f));
  const halfWay = Math.ceil(costs[0][map.factories[1]] / 2);
  const band = { ...FACTORY_PAIR_BAND, distance: [FACTORY_PAIR_BAND.distance[0], halfWay] };
  const roomy = (k) => isOpen(map, terrainRules, k) &&
    neighbourKeys(k).filter((n) => isOpen(map, terrainRules, n)).length >=
      MIN_FREE_FACTORY_NEIGHBOURS;
  const taken = [...map.factories];
  const out = [];
  for (let pair = 0; pair < count; pair++) {
    const sites = pilePair(random, costs, taken, band,
      { spacing: FACTORY_SPACING, allowed: roomy });
    if (!sites) return null;
    taken.push(...sites);
    out.push({ at: sites[0], pair }, { at: sites[1], pair });
  }
  return out;
}

// Starting hexes: the free neighbours of each factory nearest the enemy.
function startHexes(map, terrainRules, count) {
  return map.factories.map((f, p) => {
    const enemy = map.factories[1 - p];
    return neighbourKeys(f)
      .filter((k) => isOpen(map, terrainRules, k))
      .sort((a, b) => distance(a, enemy) - distance(b, enemy) || a.localeCompare(b))
      .slice(0, count);
  });
}

// A fair random map of the given shape for 2 to 6 sides (see shapesForSides). The same seed,
// shape and sides always give the same map. Layouts that fail the checks in mapProblems are
// thrown away and redrawn.
export function generateMap(seed, terrainRules, startUnits, shape = "classic", sides = 2) {
  if (!shapeAllows(shape, sides)) {
    throw new Error(`No ${sides}-sided maps of shape ${shape}`);
  }
  if (sides !== 2) return generateMultiSideMap(seed, terrainRules, startUnits, shape, sides);
  const random = seededRandom(seed);
  const layout = layoutFor(shape);
  const classic = shape === "classic";
  const id = classic ? `map-${seed}` : `map-${seed}-${shape}`;
  const name = classic ? `Map ${seed}` : `Map ${seed} (${MAP_SHAPES[shape].name})`;
  const blockCount = Object.keys(layout.blocks).length;
  const extraPairs = Math.max(0,
    Math.round((blockCount - CLASSIC_BLOCKS) / BLOCKS_PER_EXTRA_PAIR));
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const sides = chooseHome(random, layout);
    const map = buildMap({
      id, name, clusters: randomClusters(random, layout, sides),
      factories: sides.home, starts: [[], []], deposits: [],
    });
    const neutral =
      placeNeutralFactories(random, map, terrainRules, MAP_SHAPES[shape].factoryPairs);
    if (!neutral) continue;
    map.neutralFactories = neutral;
    const deposits = placeStartPiles(random, map, terrainRules, extraPairs);
    if (!deposits) continue;
    map.deposits = deposits;
    map.starts = startHexes(map, terrainRules, startUnits);
    if (!mapProblems(map, terrainRules).length) return map;
  }
  throw new Error(`No fair map found for seed ${seed}`);
}

// ---------------------------------------------------------------------------------------
// Generated maps for more than two sides
//
// The homes are spread round the edge of the layout. Nothing can be mirrored, so each map is
// drawn at random and kept only if multiSideProblems finds it fair.

// Home blocks: sets of blocks on the edge of the layout (none in the middle pair) whose
// closest two are at least this share of the furthest apart that any set's closest two can be,
const MULTI_HOME_SPREAD_SHARE = 0.9;
// and in which every home sees the others at much the same straight-line distances: at each
// rank of a home's sorted distances to the others, the homes differ by at most this share of
// the set's closest two. Where no set is that even (five homes cannot be spaced evenly round
// a hexagonal layout), the evenest sets are used.
const MULTI_HOME_EVENNESS = 0.15;
const EVENNESS_ROUNDING = 1e-9;
// Two blocks side by side are this far apart (in hex radii), and a block inside the layout has
// this many such neighbours.
const BLOCK_STEP = Math.sqrt(21);
const BLOCK_NEIGHBOURS = 6;

function combinations(list, n) {
  if (n === 0) return [[]];
  return list.flatMap((x, i) => combinations(list.slice(i + 1), n - 1).map((c) => [x, ...c]));
}

const homeSetCache = {};

// The sets of home blocks for a shape and number of sides, each set in order round the map.
function homeSets(shape, sides) {
  const cacheKey = `${shape}/${sides}`;
  if (homeSetCache[cacheKey]) return homeSetCache[cacheKey];
  const layout = layoutFor(shape);
  const points = {};
  for (const id in layout.blocks) points[id] = blockPoint(layout.blocks[id]);
  const ids = Object.keys(points);
  const cx = ids.reduce((sum, id) => sum + points[id][0], 0) / ids.length;
  const cy = ids.reduce((sum, id) => sum + points[id][1], 0) / ids.length;
  const apart = (a, b) => Math.hypot(points[a][0] - points[b][0], points[a][1] - points[b][1]);
  const touching = (a, b) => a !== b && apart(a, b) < BLOCK_STEP + ROW_TOLERANCE;
  const edge = ids.filter((a) => !layout.middle.includes(a) &&
    ids.filter((b) => touching(a, b)).length < BLOCK_NEIGHBOURS);
  const sets = combinations(edge, sides).map((set) => {
    const profiles = set.map((a) => set.filter((b) => b !== a).map((b) => apart(a, b))
      .sort((x, y) => x - y));
    const closest = Math.min(...profiles.map((p) => p[0]));
    const ranks = profiles[0].map((d, rank) => spreadOf(profiles.map((p) => p[rank])));
    return { set, closest, unevenness: Math.max(...ranks) / closest };
  });
  const best = sets.reduce((most, c) => Math.max(most, c.closest), 0);
  const far = sets.filter((c) => c.closest >= MULTI_HOME_SPREAD_SHARE * best);
  const evenest = far.reduce((least, c) => Math.min(least, c.unevenness), Infinity);
  const limit = Math.max(MULTI_HOME_EVENNESS, evenest) + EVENNESS_ROUNDING;
  const angle = (id) => Math.atan2(points[id][1] - cy, points[id][0] - cx);
  homeSetCache[cacheKey] = far.filter((c) => c.unevenness <= limit)
    .map((c) => [...c.set].sort((a, b) => angle(a) - angle(b)));
  return homeSetCache[cacheKey];
}

// Picks the home blocks for a map: one of the sets, with side 0 at any of them. Returns
// { home, pairs } for randomClusters, where pairs are the groups of other blocks (outside the
// middle) that draw the same number of mountains.
function chooseHomes(random, layout, shape, sides) {
  const set = pick(random, homeSets(shape, sides));
  const first = Math.floor(random() * sides);
  const home = [...set.slice(first), ...set.slice(0, first)];
  const others = Object.keys(layout.blocks)
    .filter((id) => !home.includes(id) && !layout.middle.includes(id));
  return { home, pairs: turnGroups(layout, set, others) };
}

// Blocks that a turn of the map about its middle carries onto each other, where the turn also
// carries the homes onto each other (for six homes round a hexagon, the six blocks one turn of
// 60 degrees apart). Each group draws one number of mountains, as each pair does on a two-sided
// map, so every side has much the same ground round it. A block no turn moves is on its own.
function turnGroups(layout, homes, ids) {
  const points = {};
  for (const id in layout.blocks) points[id] = blockPoint(layout.blocks[id]);
  const all = Object.keys(points);
  const cx = all.reduce((sum, id) => sum + points[id][0], 0) / all.length;
  const cy = all.reduce((sum, id) => sum + points[id][1], 0) / all.length;
  const blockAt = (x, y) => all.find((id) =>
    Math.hypot(points[id][0] - x, points[id][1] - y) < ROW_TOLERANCE);
  const turn = (id, angle) => {
    const [x, y] = [points[id][0] - cx, points[id][1] - cy];
    return blockAt(cx + x * Math.cos(angle) - y * Math.sin(angle),
      cy + x * Math.sin(angle) + y * Math.cos(angle));
  };
  const turns = [];
  for (let step = 1; step < homes.length; step++) {
    const angle = (2 * Math.PI * step) / homes.length;
    const moved = all.map((id) => turn(id, angle));
    if (moved.every(Boolean) && homes.every((id) => homes.includes(turn(id, angle)))) {
      turns.push(angle);
    }
  }
  const groups = [];
  const placed = new Set();
  for (const id of ids) {
    if (placed.has(id)) continue;
    const group = [...new Set([id, ...turns.map((angle) => turn(id, angle))])]
      .filter((other) => ids.includes(other) && !placed.has(other));
    group.forEach((other) => placed.add(other));
    groups.push(group);
  }
  return groups;
}

// A set of sites, one per side in side order: each at a path cost from its own factory in
// range, every other factory at least margin further, and (for fairness) much the same own
// cost and nearest-rival cost for every side, as fairSet checks. Sites are at least spacing
// from taken hexes and each other, and must pass allowed. null if there is none.
function siteSet(random, costs, taken, { distance: [nearest, furthest], margin },
  { spacing = PILE_SPACING, allowed = () => true } = {}) {
  const free = (k) => allowed(k) && !taken.some((t) => distance(t, k) < spacing);
  const bySide = costs.map((own, side) => {
    const out = [];
    for (const k in own) {
      if (own[k] < nearest || own[k] > furthest || !free(k)) continue;
      const rival = rivalCost(costs, side, k);
      if (rival >= own[k] + margin) out.push({ k, own: own[k], rival });
    }
    return out;
  });
  // Exactly equal costs if possible, then within the spreads the checks allow. A window is
  // the lowest own cost and nearest-rival cost a set may have.
  const windows = [...new Set(bySide.flat().map((c) => `${c.own},${c.rival}`))].sort()
    .map((w) => w.split(",").map(Number));
  for (let ownSpread = 0; ownSpread <= SET_OWN_SPREAD; ownSpread++) {
    for (let rivalSpread = 0; rivalSpread <= SET_RIVAL_SPREAD; rivalSpread++) {
      for (const [own, rival] of shuffled(random, windows)) {
        const fits = (c) => c.own >= own && c.own <= own + ownSpread && c.rival >= rival &&
          c.rival <= rival + rivalSpread;
        const lists = bySide.map((options) => options.filter(fits).map((c) => c.k));
        if (lists.some((list) => !list.length)) continue;
        const sites = spacedChoice(random, lists, spacing);
        if (sites) return sites;
      }
    }
  }
  return null;
}

// Searching for spaced sites gives up after this many tries, so a crowded map is soon redrawn.
const MAX_SET_SEARCH = 2000;

// One hex from each list, all at least spacing apart, chosen at random; null if none found.
function spacedChoice(random, lists, spacing) {
  const options = lists.map((list) => shuffled(random, list));
  const chosen = [];
  let tries = 0;
  const search = (side) => {
    if (side === options.length) return true;
    for (const k of options[side]) {
      if (++tries > MAX_SET_SEARCH) return false;
      if (!chosen.every((s) => distance(s, k) >= spacing)) continue;
      chosen.push(k);
      if (search(side + 1)) return true;
      chosen.pop();
    }
    return false;
  };
  return search(0) ? chosen : null;
}

// Half the path cost between the two nearest home factories, rounded up.
function halfWayCost(map, costs) {
  return Math.ceil(Math.min(...map.factories.flatMap((f, side) =>
    map.factories.filter((g, other) => other !== side).map((g) => costs[side][g]))) / 2);
}

// Unused factory sites: count sets of open hexes with room round them, one per side. Unlike
// a two-sided map they may be anywhere nearer their own home, not only up to half way, as the
// homes are closer together. null if they will not fit.
function placeNeutralSets(random, map, terrainRules, costs, count) {
  const roomy = (k) => isOpen(map, terrainRules, k) &&
    neighbourKeys(k).filter((n) => isOpen(map, terrainRules, n)).length >=
      MIN_FREE_FACTORY_NEIGHBOURS;
  const taken = [...map.factories];
  const out = [];
  for (let pair = 0; pair < count; pair++) {
    const sites = siteSet(random, costs, taken, FACTORY_PAIR_BAND,
      { spacing: FACTORY_SPACING, allowed: roomy });
    if (!sites) return null;
    taken.push(...sites);
    out.push(...sites.map((at) => ({ at, pair })));
  }
  return out;
}

// Starting piles: one set per band, extra sets where they fit, then one pile about equally far
// from every factory if one fits. null if a band's set will not fit.
function placeMultiSidePiles(random, map, costs, extraSets) {
  const taken = map.factories.flatMap((f) => [f, ...neighbourKeys(f)]);
  const extra = { ...EXTRA_PAIR_BAND,
    distance: [EXTRA_PAIR_BAND.distance[0], halfWayCost(map, costs)] };
  const bands = [...PILE_PAIR_BANDS, ...Array.from({ length: extraSets }, () => extra)];
  const unused = (map.neutralFactories || []).map((f) => f.at);
  const allowed = (k) => !unused.includes(k);
  const piles = [];
  for (const [pair, band] of bands.entries()) {
    const sites = siteSet(random, costs, taken, band, { allowed });
    if (!sites && band === extra) continue;
    if (!sites) return null;
    taken.push(...sites);
    piles.push(...sites.map((at) => ({ at, pair })));
  }
  const spreads = {};
  for (const k in costs[0]) {
    if (!allowed(k) || taken.some((t) => distance(t, k) < PILE_SPACING)) continue;
    const spread = spreadOf(costs.map((c) => c[k]));
    if (spread <= MIDDLE_PILE_SPREAD) (spreads[spread] ||= []).push(k);
  }
  const evenest = Object.keys(spreads).map(Number).sort((x, y) => x - y)[0];
  if (evenest !== undefined) piles.push({ at: pick(random, spreads[evenest]), pair: null });
  return piles;
}

// Starting hexes: the free neighbours of each factory nearest the middle of the map.
function middleStartHexes(map, terrainRules, layout, count) {
  const points = Object.values(layout.blocks).map(blockPoint);
  const cx = points.reduce((sum, [x]) => sum + x, 0) / points.length;
  const cy = points.reduce((sum, [, y]) => sum + y, 0) / points.length;
  const fromMiddle = (k) => {
    const [x, y] = toPixel(...parseKey(k), 1);
    return Math.hypot(x - cx, y - cy);
  };
  return map.factories.map((f) => neighbourKeys(f)
    .filter((k) => isOpen(map, terrainRules, k))
    .sort((a, b) => fromMiddle(a) - fromMiddle(b) || a.localeCompare(b))
    .slice(0, count));
}

// Sets of unused factories (one per side in each set) for each number of sides, at most; with
// more sides there is less room round each home.
const MAX_FACTORY_SETS = { 3: 2, 4: 1, 5: 1, 6: 1 };

function generateMultiSideMap(seed, terrainRules, startUnits, shape, sides) {
  const random = seededRandom(seed);
  const layout = layoutFor(shape);
  const id = `map-${seed}-${shape}-${sides}p`;
  const name = `Map ${seed} (${shapeInfo(shape).name}, ${sides} sides)`;
  const blockCount = Object.keys(layout.blocks).length;
  // As many piles in all as a two-sided map of this size would have, shared out in sets.
  const twoSidedPiles = 2 * (PILE_PAIR_BANDS.length +
    Math.max(0, Math.round((blockCount - CLASSIC_BLOCKS) / BLOCKS_PER_EXTRA_PAIR)));
  const extraSets = Math.max(0, Math.round(twoSidedPiles / sides) - PILE_PAIR_BANDS.length);
  const factorySets = Math.min(shapeInfo(shape).factoryPairs, MAX_FACTORY_SETS[sides]);
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const homes = chooseHomes(random, layout, shape, sides);
    const map = buildMap({
      id, name, clusters: randomClusters(random, layout, homes),
      factories: homes.home, starts: homes.home.map(() => []), deposits: [],
    });
    // Path costs do not change once the terrain is drawn (units drive over piles), so they are
    // worked out once, and a map whose homes are unfair is redrawn before anything is placed.
    const costs = map.factories.map((f) => pathCosts(map, terrainRules, f));
    if (multiSideProblems(map, terrainRules, costs).length) continue;
    const neutral = placeNeutralSets(random, map, terrainRules, costs, factorySets);
    if (!neutral) continue;
    map.neutralFactories = neutral;
    const deposits = placeMultiSidePiles(random, map, costs, extraSets);
    if (!deposits) continue;
    map.deposits = deposits;
    map.starts = middleStartHexes(map, terrainRules, layout, startUnits);
    if (!multiSideProblems(map, terrainRules, costs).length) return map;
  }
  throw new Error(`No fair ${sides}-sided map found for seed ${seed}`);
}

// The map for an id: "fixed-1", "map-<seed>" for a classic generated map,
// "map-<seed>-<shape>" (e.g. "map-17-3-4-4-3") for another shape, or
// "map-<seed>-<shape>-<n>p" (e.g. "map-17-4-5-6-5-4-3p") for a map for 3 to 6 sides.
export function mapById(id, rules) {
  if (id === FIXED_MAP_1.id) return buildMap(FIXED_MAP_1);
  const match = /^map-(\d+)(?:-(.+?))?(?:-([3-6])p)?$/.exec(String(id));
  const seed = match ? Number(match[1]) : NaN;
  const shape = (match && match[2]) || "classic";
  const sides = match && match[3] ? Number(match[3]) : 2;
  if (!Number.isInteger(seed) || seed < 1 || !shapeAllows(shape, sides)) {
    throw new Error(`Unknown map: ${id}`);
  }
  return generateMap(seed, rules.terrain, rules.start.units.length, shape, sides);
}
