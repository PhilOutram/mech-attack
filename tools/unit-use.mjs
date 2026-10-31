// Unit use: which units and rules earn their keep (Phil, 31 October 2026: retire what does
// not). Evolved personalities play each other, AI against AI, on fixed map 1 and generated
// maps, and for every unit type it counts how often it is built, how many crystals' worth of
// enemy units it destroys for each crystal spent on it, and how often the winner built it.
// It also counts how often the optional rules come into play: upgrades, captures, ruins,
// transport, set-up, planting, giving crystals, blasting and crushing piles, repairs.
// Usage: node tools/unit-use.mjs [--games 200] [--seed 1]
import { RULES } from "../rules-config.js?v=0.81";
import { mapById } from "../maps.js?v=0.81";
import { newGame, applyAction, viewFor } from "../engine.js?v=0.81";
import { chooseAction, DEFAULT_PERSONALITY } from "../ai.js?v=0.81";
import { EVOLVED_PERSONALITIES } from "../ai-personalities.js?v=0.81";

const DEFAULT_GAMES = 200;
const MAX_ACTIONS = 200000;
// Every other game is on fixed map 1; the rest on generated maps, numbered from here.
const FIRST_GENERATED_MAP = 1;
const DECIMALS = 2;
const PERCENT = 100;
// Events where a unit fires; the hits that follow are its.
const SHOTS = ["fire", "fireBlind", "returnFire", "lineHit", "splash", "boom"];

const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`);
  return i < 0 ? fallback : process.argv[i + 1];
};
const games = Number(arg("games", DEFAULT_GAMES));
const firstSeed = Number(arg("seed", 1));
const pool = EVOLVED_PERSONALITIES.length
  ? EVOLVED_PERSONALITIES.map((e) => ({ ...DEFAULT_PERSONALITY, ...e.personality }))
  : [DEFAULT_PERSONALITY];

const units = {};
// fielded: built, or there from the start (each side starts with a few units).
const stat = (type) => (units[type] ||= { built: 0, fielded: 0, games: 0, byWinner: 0,
  byLoser: 0, destroyedValue: 0, lost: 0 });
const rules = {};
const count = (name, n = 1) => { rules[name] = (rules[name] || 0) + n; };
let decided = 0;

for (let g = 0; g < games; g++) {
  const seed = firstSeed + g;
  const map = mapById(g % 2 ? `map-${FIRST_GENERATED_MAP + g}` : "map-1", RULES);
  const personalities = [pool[g % pool.length], pool[(g * 3 + 1) % pool.length]];
  let state = newGame({ rules: RULES, map, seed, firstPlayer: g % 2, recordActions: false });
  const builtBy = [{}, {}];
  const lastHitBy = {};
  for (const unit of Object.values(state.units)) {
    if (unit.type !== "factory") stat(unit.type).fielded += 1;
  }
  for (let i = 0; i < MAX_ACTIONS && !state.result; i++) {
    const before = state;
    const action = chooseAction(viewFor(state, state.current), personalities[state.current]);
    state = applyAction(state, action);
    let shooter = null;
    for (const e of state.events) {
      if (SHOTS.includes(e.type)) {
        shooter = (before.units[e.unitId] || state.units[e.unitId])?.type;
      }
      if (e.type === "hit" && shooter) lastHitBy[e.unitId] = shooter;
      if (e.type === "build") {
        stat(e.unitType).built += 1;
        stat(e.unitType).fielded += 1;
        builtBy[state.units[e.unitId].owner][e.unitType] = true;
      }
      if (e.type === "destroyed" && e.unitType !== "factory") {
        stat(e.unitType).lost += 1;
        const killer = lastHitBy[e.unitId];
        if (killer) stat(killer).destroyedValue += RULES.units[e.unitType].cost;
      }
      if (e.type === "upgrade") count(`upgrade: ${RULES.factoryUpgrades[e.upgrade].name}`);
      if (e.type === "capture") count("factory captured");
      if (e.type === "search") count(`ruin searched (${e.outcome})`);
      if (e.type === "board") count("boarded a transport");
      if (e.type === "setUp") count("set up");
      if (e.type === "plant") count("crystals planted", e.amount);
      if (e.type === "unload" && e.to !== undefined) count("crystals given", e.amount);
      if (e.type === "blast") count("pile blasted");
      if (e.type === "crushed") count("pile crushed");
      if (e.type === "heal") count("repair");
      if (e.type === "crystalsExploded") count("pile exploded");
      if (e.type === "labIncome") count("lab crystals", e.amount);
    }
  }
  const winner = state.result?.winner;
  for (const [p, types] of builtBy.entries()) {
    for (const type in types) {
      stat(type).games += 1;
      if (winner === p) stat(type).byWinner += 1;
      else if (winner !== null && winner !== undefined) stat(type).byLoser += 1;
    }
  }
  if (winner !== null && winner !== undefined) decided += 1;
}

const share = (n, total) => (total ? `${((n / total) * PERCENT).toFixed(0)}%` : "-");
console.log(`${games} games, ${pool.length} personalities, ${decided} decided\n`);
console.log("Destroyed per crystal: enemy value it finished off, over the value of all of it " +
  "fielded (starting units included).");
console.log("");
console.log("| Unit | Built per game | Sides that build it | Destroyed per crystal spent | " +
  "Built by winner : loser |");
console.log("|---|---|---|---|---|");
const types = Object.keys(RULES.units).filter((t) => RULES.units[t].cost && t !== "factory");
for (const type of types.sort((a, b) => stat(b).built - stat(a).built)) {
  const s = stat(type);
  const spent = s.fielded * RULES.units[type].cost;
  console.log(`| ${RULES.units[type].name} | ${(s.built / games).toFixed(DECIMALS)} | ` +
    `${share(s.games, games * 2)} | ` +
    `${spent ? (s.destroyedValue / spent).toFixed(DECIMALS) : "-"} | ` +
    `${s.byWinner} : ${s.byLoser} |`);
}
console.log("\n| Rule | Per game |\n|---|---|");
for (const name of Object.keys(rules).sort()) {
  console.log(`| ${name} | ${(rules[name] / games).toFixed(DECIMALS)} |`);
}
