// Map definitions. A map is a list of seven-hex clusters, as on the printed map pages, plus
// the factory sites, starting hexes and starting crystal piles (deposits). buildMap turns a
// definition into the plain-data map the engine stores in the game state; generateMap builds
// a fair random map from a seed, so "Map 17" is always the same map.
import {
  key, clusterCentre, clusterHexes, DIRECTION_NAMES, cheapestPaths, distance, neighbourKeys,
  toPixel,
} from "./hex.js?v=0.39";

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

// ---------------------------------------------------------------------------------------
// Generated maps

// Map shapes (Phil, 28 October 2026): the classic 12-block layout of fixed map 1, or rows of
// blocks from top to bottom, in three sizes. The bigger shapes have pairs of unused
// factories for infantry to capture, one of each pair nearer each side.
export const MAP_SIZES = { small: "Small", medium: "Medium", large: "Large" };
export const MAP_SHAPES = {
  classic: { name: "Classic", size: "small", rows: null, factoryPairs: 0 },
  "3-4-4-3": { name: "3-4-4-3", size: "small", rows: [3, 4, 4, 3], factoryPairs: 1 },
  "3-5-5-3": { name: "3-5-5-3", size: "medium", rows: [3, 5, 5, 3], factoryPairs: 1 },
  "4-5-5-4": { name: "4-5-5-4", size: "medium", rows: [4, 5, 5, 4], factoryPairs: 2 },
  "5-6-6-5": { name: "5-6-6-5", size: "large", rows: [5, 6, 6, 5], factoryPairs: 2 },
  "4-5-6-5-4": { name: "4-5-6-5-4", size: "large", rows: [4, 5, 6, 5, 4], factoryPairs: 2 },
};

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
  chosen.forEach((pt, n) => {
    pt.id = String.fromCharCode(65 + n);
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
    const rows = MAP_SHAPES[shape].rows;
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

// A fair random map of the given shape. The same seed and shape always give the same map.
// Layouts that fail the checks in mapProblems are thrown away and redrawn.
export function generateMap(seed, terrainRules, startUnits, shape = "classic") {
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

// The map for an id: "fixed-1", "map-<seed>" for a classic generated map, or
// "map-<seed>-<shape>" (e.g. "map-17-3-4-4-3") for another shape.
export function mapById(id, rules) {
  if (id === FIXED_MAP_1.id) return buildMap(FIXED_MAP_1);
  const match = /^map-(\d+)(?:-(.+))?$/.exec(String(id));
  const seed = match ? Number(match[1]) : NaN;
  const shape = (match && match[2]) || "classic";
  if (!Number.isInteger(seed) || seed < 1 || !MAP_SHAPES[shape]) {
    throw new Error(`Unknown map: ${id}`);
  }
  return generateMap(seed, rules.terrain, rules.start.units.length, shape);
}
