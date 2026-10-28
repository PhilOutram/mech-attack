// Times legalActions + applyAction over seeded random play on fixed map 1.
// Usage: node tools/bench.js [actions]
import { RULES } from "../rules-config.js";
import { FIXED_MAP_1, buildMap } from "../maps.js";
import { newGame, applyAction, legalActions } from "../engine.js";

const ACTIONS = Number(process.argv[2] || 3000);
const END_TURN_BIAS = 0.05;
const map = buildMap(FIXED_MAP_1);
let seed = 12345;
const rand = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;

let s = newGame({ rules: RULES, map, seed: 11, recordActions: false });
let legalMs = 0;
let applyMs = 0;
let n = 0;
for (; n < ACTIONS; n++) {
  if (s.result) s = newGame({ rules: RULES, map, seed: n, recordActions: false });
  let t = performance.now();
  const actions = legalActions(s);
  legalMs += performance.now() - t;
  const pick = rand() < END_TURN_BIAS ? actions[actions.length - 1]
    : actions[Math.floor(rand() * actions.length)];
  t = performance.now();
  s = applyAction(s, pick);
  applyMs += performance.now() - t;
}
console.log(`${n} actions: legalActions ${(legalMs / n).toFixed(3)} ms, ` +
  `applyAction ${(applyMs / n).toFixed(3)} ms per action`);
