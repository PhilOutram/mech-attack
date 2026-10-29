// The campaign missions: each one sets up a playable game, and objectives are not met at the
// start.
import { test } from "node:test";
import assert from "node:assert/strict";
import { RULES } from "../rules-config.js";
import { mapById } from "../maps.js";
import {
  newGame, applyAction, unitsOf, legalActions, reachableHexes, viewFor,
} from "../engine.js";
import { MISSIONS, missionRules, missionsDone } from "../campaign.js";
import { scenario } from "./helpers.js";

const BLUE = 0;
const GREEN = 1;

function missionGame(m) {
  const rules = missionRules(m, RULES);
  return newGame({ rules, map: mapById(m.mapId, rules), seed: 1, setup: m.setup });
}

test("every mission starts with its own units and crystals, on distinct open hexes", () => {
  for (const m of MISSIONS) {
    const s = missionGame(m);
    for (const p of [BLUE, GREEN]) {
      const army = unitsOf(s, p).filter((u) => u.type !== "factory").map((u) => u.type);
      assert.deepEqual(army.sort(), [...m.setup.units[p]].sort(), m.title);
      assert.equal(s.players[p].crystals, m.setup.crystals[p], m.title);
    }
    const hexes = Object.values(s.units).map((u) => u.at);
    assert.equal(new Set(hexes).size, hexes.length, `${m.title}: two units share a hex`);
    for (const k of hexes) assert.notEqual(s.map.hexes[k].terrain, "mountain", m.title);
    assert.equal(s.result, null, m.title);
    if (m.done) assert.equal(m.done(s), false, `${m.title} is won before it starts`);
  }
});

test("in the first mission Green has nothing but does not lose for it", () => {
  let s = missionGame(MISSIONS[0]);
  s = applyAction(s, { type: "endTurn" });
  assert.equal(s.result, null);
  assert.ok(legalActions(s).some((a) => a.type === "endTurn"));
});

test("in the first mission the infantry capture their own unclaimed home factory", () => {
  const m = MISSIONS[0];
  let s = missionGame(m);
  const home = s.units[s.players[BLUE].factoryId];
  assert.equal(home.owner, null);
  const infantry = unitsOf(s, BLUE).find((u) => u.type === "infantry");
  assert.ok(home.at in reachableHexes(viewFor(s, BLUE), infantry.id));
  s = applyAction(s, { type: "move", unitId: infantry.id, to: home.at });
  assert.equal(s.units[home.id].owner, BLUE);
  assert.equal(s.result, null);
  assert.ok(m.steps[0].done(s) && !m.steps[1].done(s));
});

test("the first mission is won once the factory is held and a Scout Bike and Tank built", () => {
  const m = MISSIONS[0];
  const s = scenario({ units: [{ id: "t", type: "tank", owner: BLUE, at: "0,0" },
    { id: "b", type: "scoutBike", owner: BLUE, at: "1,0" }] });
  assert.ok(m.done(s));
});

test("with no saved progress only the first mission is open", () => {
  assert.equal(missionsDone(), 0);
});
