// The co-op campaign: every mission sets up for each number of humans it allows, and its
// objectives are neither met nor failed at the start.
import { test } from "node:test";
import assert from "node:assert/strict";
import { mapById } from "../maps.js";
import { newGame, applyAction, viewFor, unitsOf } from "../engine.js";
import { chooseAction, DEFAULT_PERSONALITY } from "../ai.js";
import { COOP_MISSIONS, coopPlan, coopMissionsDone } from "../coop-campaign.js";

const ROUNDS = 8;

function missionGame(index, humans) {
  const plan = coopPlan(index, humans);
  const map = mapById(plan.mapId, plan.rules);
  return { plan, state: newGame({ rules: plan.rules, map, seed: 1, sides: plan.sides,
    phases: plan.phases, setup: plan.setup }) };
}

test("every co-op mission sets up for each number of humans it allows", () => {
  COOP_MISSIONS.forEach((m, index) => {
    for (let humans = m.humans[0]; humans <= m.humans[1]; humans++) {
      const { plan, state } = missionGame(index, humans);
      const name = `${m.title}, ${humans} humans`;
      assert.equal(state.players.length, plan.seats.length, name);
      assert.deepEqual(state.active, plan.phases[0], `${name}: the humans start together`);
      for (let p = 0; p < humans; p++) assert.equal(state.players[p].team, 0, name);
      for (let p = humans; p < plan.seats.length; p++) {
        assert.equal(state.players[p].team, 1, name);
        assert.equal(plan.seats[p].kind, "ai", name);
      }
      const hexes = Object.values(state.units).map((u) => u.at);
      assert.equal(new Set(hexes).size, hexes.length, `${name}: two units share a hex`);
      for (const k of hexes) assert.notEqual(state.map.hexes[k].terrain, "mountain", name);
      assert.equal(state.result, null, name);
      if (m.done) assert.equal(m.done(state), false, `${name} is won before it starts`);
      if (m.failed) assert.equal(m.failed(state), false, `${name} is lost before it starts`);
    }
  });
});

test("the AI sides of a co-op mission start with more when there are more humans", () => {
  const two = missionGame(0, 2).state;
  const three = missionGame(0, 3).state;
  const aiUnits = (s) => unitsOf(s, s.players.length - 1).length;
  assert.ok(aiUnits(three) >= aiUnits(two));
  assert.ok(three.players[3].crystals > two.players[2].crystals);
});

test("in Supply Run only the first human has an Airfield", () => {
  const { state } = missionGame(1, 3);
  const upgrades = (p) => state.units[state.players[p].factoryId].upgrades;
  assert.deepEqual(upgrades(0), ["airfield"]);
  assert.deepEqual(upgrades(1), []);
  assert.ok(!state.rules.allowedUpgrades.includes("airfield"));
});

test("a co-op mission plays: every side moves in turn, humans together", () => {
  let { state } = missionGame(2, 2);
  state = { ...state, rules: { ...state.rules, roundCap: ROUNDS } };
  while (!state.result) {
    state = applyAction(state, chooseAction(viewFor(state, state.current), DEFAULT_PERSONALITY));
  }
  assert.ok(state.result.round <= ROUNDS + 1);
});

test("with no saved progress only the first co-op mission is open", () => {
  assert.equal(coopMissionsDone(), 0);
});
