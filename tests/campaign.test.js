// The campaign missions: each one sets up a playable game, and objectives are not met at the
// start.
import { test } from "node:test";
import assert from "node:assert/strict";
import { RULES } from "../rules-config.js";
import { mapById } from "../maps.js";
import {
  newGame, applyAction, unitsOf, legalActions, reachableHexes, viewFor, factoryBuilds,
} from "../engine.js";
import { MISSIONS, missionRules, missionsDone, missionMap, stepsDone } from "../campaign.js";
import { cheapestPaths, distance } from "../hex.js";
import { scenario } from "./helpers.js";

const BLUE = 0;
const GREEN = 1;

function missionGame(m) {
  const rules = missionRules(m, RULES);
  const map = missionMap(m, mapById(m.mapId, rules), rules);
  return newGame({ rules, map, seed: 1, setup: m.setup });
}

const missionNamed = (title) => MISSIONS.find((m) => m.title === title);

// Whether ground units can drive from one hex to another over the map's terrain.
function groundRoute(s, from, to) {
  const costOf = (k) => (s.map.hexes[k] ? s.rules.terrain[s.map.hexes[k].terrain].moveCost
    : null);
  return Boolean(cheapestPaths(from, costOf)[to]);
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

test("in First Shots your squad has no factory and lands out of sight of the two guards", () => {
  const m = missionNamed("First Shots");
  const s = missionGame(m);
  assert.equal(s.players[BLUE].factoryId, null);
  const home = s.units[s.players[GREEN].factoryId];
  for (const guard of unitsOf(s, GREEN).filter((u) => u.type === "infantry")) {
    assert.equal(distance(guard.at, home.at), 1, "the guards stand at the outpost");
    for (const unit of unitsOf(s, BLUE)) {
      assert.ok(distance(unit.at, guard.at) > RULES.units.infantry.sight, unit.type);
    }
  }
  // The training ground is plain, with nothing to harvest.
  assert.ok(Object.values(s.map.hexes).every((h) => h.terrain === "plain"));
  assert.deepEqual(Object.keys(s.crystals), []);
});

test("in First Shots Green is not out when its guards fall, and taking the outpost wins", () => {
  const m = missionNamed("First Shots");
  let s = missionGame(m);
  for (const guard of unitsOf(s, GREEN).filter((u) => u.type === "infantry")) {
    delete s.units[guard.id];
  }
  s.players[GREEN].lost.infantry = 2;
  s = applyAction(s, { type: "endTurn" });
  s = applyAction(s, { type: "endTurn" });
  assert.equal(s.result, null);
  assert.ok(m.steps[0].done(s) && !m.steps[1].done(s));
  const home = s.units[s.players[GREEN].factoryId];
  const infantry = unitsOf(s, BLUE).find((u) => u.type === "infantry");
  const beside = Object.keys(s.map.hexes).find((k) => distance(k, home.at) === 1 &&
    !Object.values(s.units).some((u) => u.at === k));
  s.units[infantry.id].at = beside;
  s = applyAction(s, { type: "endTurn" });
  s = applyAction(s, { type: "endTurn" });
  s = applyAction(s, { type: "move", unitId: infantry.id, to: home.at });
  assert.equal(s.result.winner, BLUE);
  assert.ok(m.steps[1].done(s));
  assert.ok(!m.failed(s), "the Infantry used up taking the outpost do not fail it");
});

test("First Shots fails when your Infantry fall", () => {
  const m = missionNamed("First Shots");
  const s = missionGame(m);
  assert.ok(!m.failed(s));
  delete s.units[unitsOf(s, BLUE).find((u) => u.type === "infantry").id];
  assert.ok(m.failed(s));
});

test("a Scout Bike destroys an Infantry in one shot, and the Infantry's return fire takes " +
  "a life", () => {
  // First Shots' lessons say so: 15 is at least twice 5, and 10 reaches a Scout Bike's 10.
  let s = scenario({ units: [
    { id: "b", type: "scoutBike", owner: BLUE, at: "0,0" },
    { id: "i", type: "infantry", owner: GREEN, at: "1,0" }] });
  s = applyAction(s, { type: "attack", unitId: "b", targetId: "i" });
  assert.equal(s.units.i, undefined);
  assert.equal(s.units.b.lives, 1);
});

test("on rocky ground one Tank cannot hurt a Tank, two take a life and a third shot " +
  "destroys it", () => {
  // Dug In's lessons: defence 25 + 5; 25 does nothing, 50 takes a life, 60 destroys it.
  let s = scenario({ terrain: { "1,0": "rocky" }, units: [
    { id: "t1", type: "tank", owner: BLUE, at: "-1,0" },
    { id: "t2", type: "tank", owner: BLUE, at: "-1,1" },
    { id: "b", type: "scoutBike", owner: BLUE, at: "0,0" },
    { id: "g", type: "tank", owner: GREEN, at: "1,0" }] });
  s = applyAction(s, { type: "attack", unitId: "t1", targetId: "g" });
  assert.equal(s.units.g.lives, 2);
  s = applyAction(s, { type: "attack", unitId: "t2", targetId: "g" });
  assert.equal(s.units.g.lives, 1);
  s = applyAction(s, { type: "attack", unitId: "b", targetId: "g" });
  assert.equal(s.units.g, undefined);
});

test("the training missions come first, with lessons and combat reports", () => {
  const training = MISSIONS.filter((m) => m.training);
  assert.deepEqual(training.map((m) => m.title),
    ["First Shots", "Build an Army", "Supply Lines", "Dug In"]);
  MISSIONS.slice(0, training.length).forEach((m) => assert.ok(m.training, m.title));
  for (const m of training) {
    assert.ok(m.reports, m.title);
    assert.ok(m.lessons.length, m.title);
    for (const lesson of m.lessons) {
      assert.ok(lesson.title && lesson.text && typeof lesson.when === "function", m.title);
    }
  }
});

test("in Dug In Green's Tanks start on rocky ground", () => {
  const s = missionGame(missionNamed("Dug In"));
  const tanks = unitsOf(s, GREEN).filter((u) => u.type === "tank");
  assert.equal(tanks.length, 2);
  for (const tank of tanks) assert.equal(s.map.hexes[tank.at].terrain, "rocky");
  assert.deepEqual(s.map.neutralFactories, []);
});

test("a mission step once done stays ticked", () => {
  const m = missionNamed("Supply Lines");
  const s = missionGame(m);
  assert.deepEqual(stepsDone(m, s), [false, false, false]);
  s.players[BLUE].crystals = 100;
  const ticked = stepsDone(m, s);
  assert.deepEqual(ticked, [true, false, false]);
  s.players[BLUE].crystals = 0;
  s.campaign = { ticked };
  assert.deepEqual(stepsDone(m, s), [true, false, false]);
});

test("with no saved progress only the first mission is open", () => {
  assert.equal(missionsDone(), 0);
});

test("in Over the Mountains blue's home is cut off from Green by ground", () => {
  const s = missionGame(missionNamed("Over the Mountains"));
  assert.equal(groundRoute(s, s.map.factories[BLUE], s.map.factories[GREEN]), false);
  assert.ok(unitsOf(s, BLUE).some((u) => u.type === "chinook"));
  for (const p of [BLUE, GREEN]) {
    assert.deepEqual(s.units[s.players[p].factoryId].upgrades, ["airfield"]);
  }
  for (const p of [BLUE, GREEN]) {
    const factory = s.units[s.players[p].factoryId];
    assert.ok(factoryBuilds(s, factory, "attackHelicopter"), `player ${p} builds helicopters`);
    assert.ok(factoryBuilds(s, factory, "chinook"), `player ${p} builds Chinooks`);
    assert.ok(factoryBuilds(s, factory, "antiAircraftJeep"), `player ${p} builds AA Jeeps`);
  }
});

test("in The Pass the only way through the ridge is the pass", () => {
  const s = missionGame(missionNamed("The Pass"));
  assert.ok(groundRoute(s, s.map.factories[BLUE], s.map.factories[GREEN]));
});

test("mission objectives that count Green's losses", () => {
  for (const [title, type, count] of [["Swarm", "scoutBike", 8],
    ["Sky Hunters", "attackHelicopter", 5], ["The Pass", "tank", 5]]) {
    const m = missionNamed(title);
    const s = missionGame(m);
    assert.equal(m.done(s), false, title);
    s.players[GREEN].lost[type] = count;
    assert.equal(m.done(s), false, `${title}: the boss is still there`);
    s.players[GREEN].lost[m.boss] = (s.players[GREEN].lost[m.boss] || 0) + 1;
    assert.ok(m.done(s), title);
  }
});

test("a mission's boss starts in Green's army and is the first step", () => {
  for (const m of MISSIONS.filter((mission) => mission.boss)) {
    const s = missionGame(m);
    assert.ok(unitsOf(s, GREEN).some((u) => u.type === m.boss), m.title);
    assert.equal(m.steps[0].done(s), false, m.title);
    s.players[GREEN].lost[m.boss] = 1;
    assert.ok(m.steps[0].done(s), m.title);
  }
});

test("across the campaign Green starts with every kind of unit that can be built", () => {
  const started = new Set(MISSIONS.flatMap((m) => m.setup.units[GREEN]));
  const buildable = Object.keys(RULES.units).filter((type) => RULES.units[type].cost !== null);
  assert.deepEqual(buildable.filter((type) => !started.has(type)), []);
});

test("in The Maid's March blue has no factory, and losing the VIP fails the mission", () => {
  const m = missionNamed("The Maid's March");
  const s = missionGame(m);
  assert.equal(s.players[BLUE].factoryId, null);
  assert.equal(m.failed(s), false);
  assert.ok(m.target(s.map));
  const vip = unitsOf(s, BLUE).find((u) => u.type === "vip");
  delete s.units[vip.id];
  assert.ok(m.failed(s));
  const after = applyAction(missionGame(m), { type: "endTurn" });
  assert.equal(after.result, null, "having no factory does not lose the game");
});

test("units once unlocked stay available, and the campaign unlocks every unit", () => {
  assert.deepEqual(MISSIONS[0].newUnits, ["infantry", "scoutBike"]);
  MISSIONS.forEach((m, i) => {
    for (const type of m.newUnits) assert.ok(m.rules.allowedUnits.includes(type), m.title);
    if (i > 0) {
      const before = MISSIONS[i - 1].rules;
      for (const type of before.allowedUnits) assert.ok(m.rules.allowedUnits.includes(type));
      for (const up of before.allowedUpgrades) assert.ok(m.rules.allowedUpgrades.includes(up));
    }
  });
  const last = MISSIONS[MISSIONS.length - 1].rules;
  const buildable = Object.keys(RULES.units).filter((type) => RULES.units[type].cost !== null);
  assert.deepEqual([...last.allowedUnits].sort(), buildable.sort());
  // Comms is for games with allies, which the campaign does not have.
  const solo = Object.keys(RULES.factoryUpgrades)
    .filter((u) => !RULES.factoryUpgrades[u].sharesVision);
  assert.deepEqual([...last.allowedUpgrades].sort(), solo.sort());
});

test("in The Maid's March, the VIP going into the far factory wins the mission", () => {
  const m = missionNamed("The Maid's March");
  const s = missionGame(m);
  const target = m.target(s.map);
  const vip = unitsOf(s, BLUE).find((u) => u.type === "vip");
  // Put her next to the far factory at the start of a turn, with nothing else in the way.
  const next = Object.keys(s.map.hexes).find((k) => {
    const [q, r] = k.split(",").map(Number);
    const [tq, tr] = target.split(",").map(Number);
    return Math.max(Math.abs(q - tq), Math.abs(r - tr), Math.abs(q + r - tq - tr)) === 1 &&
      s.rules.terrain[s.map.hexes[k].terrain].moveCost !== null &&
      !Object.values(s.units).some((u) => u.at === k) && !s.crystals[k];
  });
  vip.at = next;
  const after = applyAction(s, { type: "move", unitId: vip.id, to: target });
  assert.ok(m.done(after), "the far factory is hers");
  assert.ok(m.failed(after), "she has left the board, so the done check must come first");
});
