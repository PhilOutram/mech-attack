// Map definitions. A map is a list of seven-hex clusters, as on the printed map pages, plus
// the factory sites, starting hexes and crystal deposits. buildMap turns a definition into the
// plain-data map the engine stores in the game state; generateMap builds a fair random map
// from a seed, so "Map 17" is always the same map.
import {
  key, clusterCentre, clusterHexes, DIRECTION_NAMES, cheapestPaths, distance, neighbourKeys,
} from "./hex.js?v=0.02";

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
  // Paired deposits are the same path cost from their own factory and from the enemy's, and
  // the Crystal Cave is the same distance from both (checked by mapProblems).
  deposits: [
    { at: "1,3", kind: "crystals" },
    { at: "1,-2", kind: "crystals" },
    { at: "0,2", kind: "crystalBase" },
    { at: "2,-1", kind: "crystalBase" },
    { at: "4,0", kind: "crystalCave" },
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
  map.factories.forEach((f, p) => {
    const free = neighbourKeys(f).filter((k) => isOpen(map, terrainRules, k));
    if (free.length < MIN_FREE_FACTORY_NEIGHBOURS) problems.push(`factory ${p} is hemmed in`);
  });
  if (blue[map.factories[1]] !== green[map.factories[0]]) problems.push("factories differ");

  const byKind = {};
  for (const d of map.deposits) (byKind[d.kind] ||= []).push(d.at);
  for (const kind in byKind) {
    const sites = byKind[kind];
    if (sites.length === 2) {
      const [a, b] = sites;
      if (blue[a] !== green[b] || green[a] !== blue[b]) problems.push(`${kind} pair is unfair`);
    } else if (sites.length === 1 && blue[sites[0]] !== green[sites[0]]) {
      problems.push(`${kind} is nearer one side`);
    }
  }
  return problems;
}

// ---------------------------------------------------------------------------------------
// Generated maps

// The same 12 block positions as fixed map 1. Each pair is point-reflected through the middle
// of the map, blue's side first; the first pair are the home blocks.
const BLOCKS = {
  A: [1, -2], L: [0, 2], B: [0, -1], K: [1, 1], C: [-1, 0], J: [2, 0],
  D: [1, -1], I: [0, 1], F: [-1, 1], G: [2, -1], E: [0, 0], H: [1, 0],
};
const HOME_PAIR = ["L", "A"];
const OUTER_PAIRS = [["K", "B"], ["C", "J"], ["I", "D"], ["F", "G"]];
const MIDDLE_PAIR = ["E", "H"];
// Mountains per block, drawn for each pair (both blocks get the same number). The home blocks
// keep enough room round the factory.
const HOME_MOUNTAINS = [0, 1, 2];
const OUTER_MOUNTAINS = [0, 1, 2, 2, 3, 3, 4];
// The cracked chasm cluster from the tile sheet: crack through N, centre and SW.
const CHASM_CLUSTER = { centre: "chasm", ring: { N: "chasm", SW: "chasm" } };
const MAX_ATTEMPTS = 500;
// Deposit distances (path cost from the owner's factory) and how much further the enemy must be.
const CRYSTALS_DISTANCE = [3, 4];
const CRYSTALS_ENEMY_MARGIN = 4;
const BASE_DISTANCE = [4, 6];
const BASE_ENEMY_MARGIN = 2;
const DEPOSIT_SPACING = 2;

function seededRandom(seed) {
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

function randomClusters(random) {
  const clusters = {};
  const home = pick(random, HOME_MOUNTAINS);
  for (const id of HOME_PAIR) {
    clusters[id] = { centre: "plain", ring: mountainRing(random, home) };
  }
  for (const pair of OUTER_PAIRS) {
    const count = pick(random, OUTER_MOUNTAINS);
    for (const id of pair) clusters[id] = { centre: "rocky", ring: mountainRing(random, count) };
  }
  // One middle block holds the cracked chasm; its partner gets a single-hex chasm and a
  // mountain, so both block three hexes.
  const [chasmBlock, partner] = random() < 0.5 ? MIDDLE_PAIR : [...MIDDLE_PAIR].reverse();
  clusters[chasmBlock] = structuredClone(CHASM_CLUSTER);
  const [chasmDir, mountainDir] = shuffled(random, DIRECTION_NAMES);
  const ring = { [chasmDir]: "chasm", [mountainDir]: "mountain" };
  clusters[partner] = { centre: "rocky", ring };
  return Object.entries(BLOCKS).map(([id, at]) => ({ id, at, ...clusters[id] }));
}

// A pair of deposit sites, one per side, with matching distances: own distance in range and
// the enemy at least margin further. null if there is none.
function depositPair(random, map, costs, taken, [nearest, furthest], margin) {
  const [blue, green] = costs;
  const free = (k) => !taken.some((t) => distance(t, k) < DEPOSIT_SPACING);
  const options = [];
  for (const a in blue) {
    if (!free(a) || blue[a] < nearest || blue[a] > furthest || green[a] < blue[a] + margin) {
      continue;
    }
    for (const b in green) {
      if (b !== a && free(b) && green[b] === blue[a] && blue[b] === green[a] &&
        distance(a, b) >= DEPOSIT_SPACING) options.push([a, b]);
    }
  }
  return options.length ? pick(random, options) : null;
}

function placeDeposits(random, map, terrainRules) {
  const costs = map.factories.map((f) => pathCosts(map, terrainRules, f));
  // Keep the factories' surroundings clear for starting units and building.
  const taken = map.factories.flatMap((f) => [f, ...neighbourKeys(f)]);
  const crystals = depositPair(random, map, costs, taken, CRYSTALS_DISTANCE,
    CRYSTALS_ENEMY_MARGIN);
  if (!crystals) return null;
  taken.push(...crystals);
  const base = depositPair(random, map, costs, taken, BASE_DISTANCE, BASE_ENEMY_MARGIN);
  if (!base) return null;
  taken.push(...base);
  const [blue, green] = costs;
  const caves = Object.keys(blue).filter((k) =>
    blue[k] === green[k] && !taken.some((t) => distance(t, k) < DEPOSIT_SPACING));
  if (!caves.length) return null;
  return [
    { at: crystals[0], kind: "crystals" }, { at: crystals[1], kind: "crystals" },
    { at: base[0], kind: "crystalBase" }, { at: base[1], kind: "crystalBase" },
    { at: pick(random, caves), kind: "crystalCave" },
  ];
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

// A fair random map. The same seed always gives the same map. Layouts that fail the checks
// in mapProblems are thrown away and redrawn.
export function generateMap(seed, terrainRules, startUnits) {
  const random = seededRandom(seed);
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const map = buildMap({
      id: `map-${seed}`, name: `Map ${seed}`, clusters: randomClusters(random),
      factories: HOME_PAIR, starts: [[], []], deposits: [],
    });
    const deposits = placeDeposits(random, map, terrainRules);
    if (!deposits) continue;
    map.deposits = deposits;
    map.starts = startHexes(map, terrainRules, startUnits);
    if (!mapProblems(map, terrainRules).length) return map;
  }
  throw new Error(`No fair map found for seed ${seed}`);
}

// The map for an id: "fixed-1", or "map-<seed>" for a generated map.
export function mapById(id, rules) {
  if (id === FIXED_MAP_1.id) return buildMap(FIXED_MAP_1);
  const seed = Number(String(id).replace(/^map-/, ""));
  if (!Number.isInteger(seed) || seed < 1) throw new Error(`Unknown map: ${id}`);
  return generateMap(seed, rules.terrain, rules.start.units.length);
}
