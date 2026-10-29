// Difficulty levels: each sets a playable start, and the Insane rank gives Green its head start.
import { test } from "node:test";
import assert from "node:assert/strict";
import { RULES } from "../rules-config.js";
import { mapById } from "../maps.js";
import { newGame, unitsOf } from "../engine.js";
import { LEVELS, levelById, levelSetup, missionSetup } from "../difficulty.js";
import { MISSIONS } from "../campaign.js";

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

test("Major plays each campaign mission as designed", () => {
  for (const m of MISSIONS) assert.deepEqual(missionSetup(levelById("major"), m.setup), m.setup);
});

test("harder ranks give Green more in each mission, easier ones give you more", () => {
  const m = MISSIONS.find((mission) => mission.title === "First Contact");
  const cadet = missionSetup(levelById("cadet"), m.setup);
  const insane = missionSetup(levelById("insane"), m.setup);
  assert.ok(cadet.crystals[BLUE] > m.setup.crystals[BLUE]);
  assert.ok(cadet.crystals[GREEN] < m.setup.crystals[GREEN]);
  assert.equal(insane.crystals[GREEN], m.setup.crystals[GREEN] + 120);
  assert.equal(insane.units[GREEN].length, m.setup.units[GREEN].length + 2);
});

test("Green gets no extra units in a mission where it has none, and crystals never go below 0",
  () => {
    const landfall = MISSIONS[0];
    for (const level of LEVELS) {
      const setup = missionSetup(level, landfall.setup);
      assert.deepEqual(setup.units[GREEN], [], level.id);
      assert.ok(setup.crystals.every((c) => c >= 0), level.id);
    }
  });
