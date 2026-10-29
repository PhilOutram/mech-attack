// Difficulty levels: each sets a playable start, and the Insane rank gives Green its head start.
import { test } from "node:test";
import assert from "node:assert/strict";
import { RULES } from "../rules-config.js";
import { mapById } from "../maps.js";
import { newGame, unitsOf } from "../engine.js";
import { LEVELS, levelById, levelSetup } from "../difficulty.js";

const BLUE = 0;
const GREEN = 1;

function levelGame(level) {
  return newGame({ rules: RULES, map: mapById("map-3", RULES), seed: 1,
    firstPlayer: level.firstPlayer || BLUE, setup: levelSetup(level, RULES) });
}

test("every level starts a game with the usual units plus its extras", () => {
  for (const level of LEVELS) {
    const s = levelGame(level);
    for (const p of [BLUE, GREEN]) {
      const army = unitsOf(s, p).filter((u) => u.type !== "factory").length;
      assert.equal(army, RULES.start.units.length + level.extraUnits[p].length, level.id);
    }
    assert.equal(s.result, null, level.id);
  }
});

test("on Insane, Green moves first with more crystals, two extra Tanks and Heavy works", () => {
  const insane = levelById("insane");
  const s = levelGame(insane);
  assert.equal(s.current, GREEN);
  const { crystals } = RULES.start;
  assert.equal(s.players[GREEN].crystals, crystals + 120);
  assert.equal(s.players[BLUE].crystals, crystals, "blue gets no second player's crystals");
  assert.deepEqual(s.units[s.players[GREEN].factoryId].upgrades, ["heavyWorks"]);
  assert.equal(unitsOf(s, GREEN).filter((u) => u.type === "tank").length,
    RULES.start.units.filter((t) => t === "tank").length + 2);
});

test("whoever moves second gets the second player's crystals", () => {
  const major = levelSetup(levelById("major"), RULES);
  assert.equal(major.crystals[GREEN] - major.crystals[BLUE], RULES.start.secondPlayerCrystals);
});
