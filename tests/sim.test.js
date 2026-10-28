import { test } from "node:test";
import assert from "node:assert/strict";
import { RULES } from "../rules-config.js";
import { runGame, summarise, withOverrides } from "../sim.js";
import { evolve } from "../evolve.js";

const snapshot = (crystals, units, livesLost = 0) => ({
  players: crystals.map((c, p) => ({ crystals: c, worth: c, units: units[p], destroyed: 0 })),
  livesLost,
});

test("a simulated game records one snapshot per round and replays exactly", () => {
  const a = runGame({ seed: 5 });
  const b = runGame({ seed: 5 });
  assert.ok(a.result);
  assert.equal(a.rounds.length, Math.min(a.result.round, RULES.roundCap));
  assert.deepEqual(a, b);
});

test("the summary counts stalls and comebacks", () => {
  const behindWins = {
    firstPlayer: 0, result: { winner: 0, reason: "noUnits" },
    rounds: [snapshot([10, 50], [3, 3]), snapshot([10, 50], [3, 3]), snapshot([90, 0], [3, 0])],
  };
  const aheadWins = {
    firstPlayer: 1, result: { winner: 1, reason: "noUnits" },
    rounds: [snapshot([10, 50], [3, 3]), snapshot([10, 50], [3, 3])],
  };
  const stalled = {
    firstPlayer: 0, result: { winner: null, reason: "roundCap" },
    rounds: Array.from({ length: 4 }, () => snapshot([40, 40], [2, 2])),
  };
  const s = summarise([behindWins, aheadWins, stalled], { quietRounds: 4 });
  assert.equal(s.roundCap, "33.3%");
  assert.equal(s.comebackCrystals.rate, "50.0%");
  assert.equal(s.comebackCrystals.games, 2);
  assert.equal(s.firstPlayerWins, "100.0%");
  assert.equal(s.quietStretch, "33.3%");
});

test("rule overrides change a copy and reject unknown rules", () => {
  const rules = withOverrides(RULES, ["crystals.growthPerTurn=10", "fog.revealRange=null"]);
  assert.equal(rules.crystals.growthPerTurn, 10);
  assert.equal(rules.fog.revealRange, null);
  assert.equal(RULES.crystals.growthPerTurn, 5);
  assert.throws(() => withOverrides(RULES, ["crystals.spawnRate=2"]));
});

test("a tiny evolution run completes and ranks its personalities", () => {
  const result = evolve({ generations: 1, population: 4, games: 1, seed: 3, benchmarkGames: 2,
    keep: 2 });
  assert.equal(result.history.length, 1);
  assert.equal(result.best.length, 2);
  for (const b of result.best) assert.ok(b.winRateVsDefault >= 0 && b.winRateVsDefault <= 1);
});
