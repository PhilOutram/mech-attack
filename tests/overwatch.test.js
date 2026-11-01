// Turret overwatch: a Turret fires at an enemy that moves into its range, outside its own
// turn, once at each unit between phases (see fireOverwatch in engine.js).
import { test } from "node:test";
import assert from "node:assert/strict";
import { applyAction, overwatchLosses, viewFor } from "../engine.js";
import { scenario } from "./helpers.js";

const BLUE = 0;
const GREEN = 1;
const END = { type: "endTurn" };
const TURRET_HEX = "0,0";

const move = (unitId, to) => ({ type: "move", unitId, to });
const watchShots = (state) => state.events.filter((e) => e.type === "overwatch");

test("a Turret fires at an enemy that moves into its range", () => {
  const state = scenario({ units: [
    { id: "t", type: "turret", owner: GREEN, at: TURRET_HEX },
    { id: "k", type: "tank", owner: BLUE, at: "0,5" },
  ] });
  const after = applyAction(state, move("k", "0,2"));
  assert.deepEqual(watchShots(after).map((e) => [e.unitId, e.targetId, e.at]),
    [["t", "k", "0,3"]]);
  assert.equal(after.units.k.lives, state.rules.lives - 1, "attack 25 on defence 25");
  assert.equal(after.units.k.at, "0,2", "a unit that survives carries on with its move");
  assert.equal(after.units.t.acted, false, "overwatch does not use the Turret's own shot");
  const told = after.events.map((e) => e.type);
  assert.ok(told.indexOf("move") < told.indexOf("overwatch"), "the move is told first");
});

test("a unit destroyed by overwatch stops where it was hit", () => {
  const state = scenario({ units: [
    { id: "t", type: "turret", owner: GREEN, at: TURRET_HEX },
    { id: "i", type: "infantry", owner: BLUE, at: "0,5" },
  ] });
  const after = applyAction(state, move("i", "0,2"));
  assert.equal(after.units.i, undefined);
  const moved = after.events.find((e) => e.type === "move");
  assert.equal(moved.to, "0,3");
  assert.equal(moved.stoppedBy, "destroyed");
  assert.ok(after.events.some((e) => e.type === "destroyed" && e.unitId === "i"));
});

test("overwatch fires once at each unit between phases", () => {
  const state = scenario({ units: [
    { id: "t", type: "turret", owner: GREEN, at: TURRET_HEX },
    { id: "k", type: "tank", owner: BLUE, at: "0,4" },
    { id: "h", type: "tank", owner: BLUE, at: "1,4" },
  ] });
  const first = applyAction(state, move("k", "0,3"));
  assert.equal(watchShots(first).length, 1);
  // Its one shot is spent: the second tank comes into range unharmed.
  const second = applyAction(first, move("h", "1,2"));
  assert.equal(watchShots(second).length, 0);
  assert.equal(second.units.h.lives, state.rules.lives);
  // Green's turn, then Blue's again: the Turret is ready again.
  const later = [END, END].reduce((s, a) => applyAction(s, a), second);
  assert.equal(later.current, BLUE);
  const again = applyAction(later, move("h", "1,1"));
  assert.equal(watchShots(again).length, 1);
});

test("a Twin Turret has two overwatch shots, at different units", () => {
  const state = scenario({ units: [
    { id: "t", type: "twinTurret", owner: GREEN, at: TURRET_HEX },
    { id: "k", type: "tank", owner: BLUE, at: "0,3" },
    { id: "h", type: "tank", owner: BLUE, at: "1,2" },
  ] });
  const first = applyAction(state, move("k", "0,1"));
  assert.equal(watchShots(first).length, 1);
  const second = applyAction(first, move("h", "1,0"));
  assert.equal(watchShots(second).length, 1);
});

test("overwatch never fires at allies, air units or out of sight", () => {
  const allies = scenario({
    sides: [{ team: 0 }, { team: 0 }, { team: 1 }],
    phases: [[BLUE], [GREEN], [2]],
    units: [
      { id: "t", type: "turret", owner: GREEN, at: TURRET_HEX },
      { id: "k", type: "tank", owner: BLUE, at: "0,4" },
    ],
  });
  assert.equal(watchShots(applyAction(allies, move("k", "0,2"))).length, 0, "an ally");
  const air = scenario({ units: [
    { id: "t", type: "turret", owner: GREEN, at: TURRET_HEX },
    { id: "a", type: "attackHelicopter", owner: BLUE, at: "0,5" },
  ] });
  assert.equal(watchShots(applyAction(air, move("a", "0,2"))).length, 0, "an air unit");
  const hidden = scenario({
    terrain: { "0,1": "mountain", "-1,1": "mountain", "1,0": "mountain" },
    units: [
      { id: "t", type: "turret", owner: GREEN, at: TURRET_HEX },
      { id: "k", type: "tank", owner: BLUE, at: "0,5" },
    ],
  });
  const behind = applyAction(hidden, move("k", "0,3"));
  assert.equal(behind.units.k.at, "0,3");
  assert.equal(watchShots(behind).length, 0, "behind a mountain");
});

test("the AI can see the overwatch fire a move would draw", () => {
  const state = scenario({ units: [
    { id: "t", type: "turret", owner: GREEN, at: TURRET_HEX },
    { id: "i", type: "infantry", owner: BLUE, at: "0,5" },
  ] });
  const losses = overwatchLosses(viewFor(state, BLUE), "i");
  assert.equal(losses["0,4"], 0, "out of range");
  assert.equal(losses["0,3"], state.rules.lives, "25 on defence 5 takes both lives");
});
