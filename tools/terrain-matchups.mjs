// Counters on different ground (Phil, 31 October 2026): the battles of tools/matchups.mjs (an
// equal value of two unit types, played out by the AI) on the classic maps as they are, and
// on the same maps reshaped as open plain, as rocky ground everywhere, and with a mountain
// ridge across the middle broken by one narrow pass (as in the mission The Pass). For each
// ground it lists the rings of three units that beat each other (A beats B, B beats C,
// C beats A), counting a matchup as a win at a score of at least BEATS.
// Writes docs/balance/terrain-counters.json and prints the rings.
// Usage (from the project folder): node tools/terrain-matchups.mjs [--games 4]
import { writeFileSync, existsSync, readFileSync } from "node:fs";
import { cheapestPaths } from "../hex.js?v=0.80";
import { RULES } from "../rules-config.js?v=0.80";
import { MISSIONS } from "../campaign.js?v=0.80";
import { measureCounters } from "./matchups.mjs?v=0.80";
import { findCycles, duelUnits } from "./duels.mjs?v=0.80";

const DEFAULT_GAMES = 4;
// A matchup score at or above this counts as the answering unit beating the enemy.
const BEATS = 0.25;
const PASS_MISSION = "The Pass";
// The rough band: open hexes whose path costs from the two homes differ by at most this much.
const ROUGH_BAND = 4;
const OUT_FILE = "docs/balance/terrain-counters.json";

// Path costs over terrain from a hex.
function pathCosts(map, rules, from) {
  const costOf = (k) => (map.hexes[k] ? rules.terrain[map.hexes[k].terrain].moveCost : null);
  const paths = cheapestPaths(from, costOf);
  const costs = {};
  for (const k in paths) costs[k] = paths[k].cost;
  return costs;
}

const passTerrain = MISSIONS.find((m) => m.title === PASS_MISSION).terrain;

const GROUNDS = {
  classic: { name: "Classic maps (some mountains, rocky ground and chasms)", reshape: null },
  open: {
    name: "Open plain (no mountains, rocky ground or chasms)",
    reshape: (map) => {
      for (const k in map.hexes) map.hexes[k] = { ...map.hexes[k], terrain: "plain" };
    },
  },
  rocky: {
    name: "Rocky everywhere (move cost 2, defence +5), mountains kept",
    reshape: (map) => {
      for (const k in map.hexes) {
        if (map.hexes[k].terrain !== "plain") continue;
        map.hexes[k] = { ...map.hexes[k], terrain: "rocky" };
      }
    },
  },
  pass: {
    name: "A mountain ridge with one narrow pass between the two sides",
    reshape: passTerrain,
  },
  roughMiddle: {
    name: "A band of rough ground across the middle, open ground behind each side",
    reshape: (map, rules) => {
      const [a, b] = map.factories.map((f) => pathCosts(map, rules, f));
      for (const k in map.hexes) {
        if (map.hexes[k].terrain === "mountain" || a[k] === undefined) continue;
        const middle = Math.abs(a[k] - b[k]) <= ROUGH_BAND;
        map.hexes[k] = { ...map.hexes[k], terrain: middle ? "rocky" : "plain" };
      }
    },
  },
};

const games = Number(process.argv[process.argv.indexOf("--games") + 1]) || DEFAULT_GAMES;
// --grounds open,pass measures only those; the others keep their last results.
const only = process.argv.includes("--grounds")
  ? process.argv[process.argv.indexOf("--grounds") + 1].split(",") : null;
const name = (t) => RULES.units[t].name;
const result = existsSync(OUT_FILE) && only ? JSON.parse(readFileSync(OUT_FILE, "utf8"))
  : { beats: BEATS, games, grounds: {} };
for (const [ground, { name: label, reshape }] of Object.entries(GROUNDS)) {
  if (only && !only.includes(ground)) continue;
  const table = measureCounters({ games, rules: RULES, reshape });
  // table[enemy][unit]: how well unit does against enemy. Only units that can attack can win.
  const fighters = duelUnits(RULES).filter((t) => RULES.units[t].attack > 0);
  const beats = (a, b) => (table[b]?.[a] ?? 0) >= BEATS;
  const rings = findCycles(fighters, beats).map((ring) => ring.map(name));
  result.grounds[ground] = { name: label, table, rings };
  console.log(`${label}: ${rings.length} rings`);
  for (const ring of rings) console.log(`  ${ring.join(" > ")} > ${ring[0]}`);
}
writeFileSync(OUT_FILE, JSON.stringify(result, null, 1));
