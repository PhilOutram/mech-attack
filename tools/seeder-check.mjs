// How the AI uses the Crystal Seeder: games played AI against AI, counting Seeders built,
// crystals loaded and planted, and planted piles later harvested.
// Usage: node tools/seeder-check.mjs [--games 100] [--seed 1] [--map map-1]
import { RULES } from "../rules-config.js?v=0.80";
import { newGame, applyAction, viewFor } from "../engine.js?v=0.80";
import { chooseAction } from "../ai.js?v=0.80";
import { mapById } from "../maps.js?v=0.80";

const DEFAULT_GAMES = 100;
const MAX_ACTIONS   = 200000;

const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`);
  return i < 0 ? fallback : process.argv[i + 1];
};
const games = Number(arg("games", DEFAULT_GAMES));
const firstSeed = Number(arg("seed", 1));
const map = mapById(arg("map", "map-1"), RULES);

const totals = { games: 0, withSeeder: 0, seeders: 0, loaded: 0, planted: 0, fromPlanted: 0,
  seedersLost: 0 };
for (let g = 0; g < games; g++) {
  let state = newGame({ rules: RULES, map, seed: firstSeed + g, recordActions: false });
  const planted = new Set();
  let built = 0;
  for (let i = 0; i < MAX_ACTIONS && !state.result; i++) {
    state = applyAction(state, chooseAction(viewFor(state, state.current)));
    for (const e of state.events) {
      if (e.type === "build" && e.unitType === "crystalSeeder") built += 1;
      if (e.type === "loadSeeds") totals.loaded += e.amount;
      if (e.type === "plant") {
        totals.planted += e.amount;
        planted.add(e.at);
      }
      if (e.type === "harvest" && planted.has(e.at)) totals.fromPlanted += e.amount;
      if (e.type === "destroyed" && e.unitType === "crystalSeeder") totals.seedersLost += 1;
    }
  }
  totals.games += 1;
  totals.seeders += built;
  if (built) totals.withSeeder += 1;
}
console.log(totals);
