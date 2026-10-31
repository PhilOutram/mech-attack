// Counters on different ground (Phil, 31 October 2026): the battles of tools/matchups.mjs (an
// equal value of two unit types, played out by the AI) on the classic maps as they are, and
// on the same maps reshaped as open plain, as rocky ground everywhere, and with a mountain
// ridge across the middle broken by one narrow pass (as in the mission The Pass). For each
// ground it lists the rings of three units that beat each other (A beats B, B beats C,
// C beats A), counting a matchup as a win at a score of at least BEATS.
// Writes docs/balance/terrain-counters.json and prints the rings.
// Usage (from the project folder): node tools/terrain-matchups.mjs [--games 4]
import { writeFileSync } from "node:fs";
import { RULES } from "../rules-config.js?v=0.77";
import { MISSIONS } from "../campaign.js?v=0.77";
import { measureCounters } from "./matchups.mjs?v=0.77";
import { findCycles, duelUnits } from "./duels.mjs?v=0.77";

const DEFAULT_GAMES = 4;
// A matchup score at or above this counts as the answering unit beating the enemy.
const BEATS = 0.25;
const PASS_MISSION = "The Pass";

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
};

const games = Number(process.argv[process.argv.indexOf("--games") + 1]) || DEFAULT_GAMES;
const name = (t) => RULES.units[t].name;
const result = { beats: BEATS, games, grounds: {} };
for (const [ground, { name: label, reshape }] of Object.entries(GROUNDS)) {
  const table = measureCounters({ games, rules: RULES, reshape });
  // table[enemy][unit]: how well unit does against enemy. Only units that can attack can win.
  const fighters = duelUnits(RULES).filter((t) => RULES.units[t].attack > 0);
  const beats = (a, b) => (table[b]?.[a] ?? 0) >= BEATS;
  const rings = findCycles(fighters, beats).map((ring) => ring.map(name));
  result.grounds[ground] = { name: label, table, rings };
  console.log(`${label}: ${rings.length} rings`);
  for (const ring of rings) console.log(`  ${ring.join(" > ")} > ${ring[0]}`);
}
writeFileSync("docs/balance/terrain-counters.json", JSON.stringify(result, null, 1));
