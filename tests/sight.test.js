// Move, sight and turning over the next blocks (Phil, 21 November 2026).
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { RULES } from "../rules-config.js";
import { applyAction, reachableHexes, refreshKnowledge, viewFor } from "../engine.js";
import { distance, key, neighbourKeys } from "../hex.js";
import { scenario, testRules } from "./helpers.js";

const BLUE = 0;
const GROUND_SIGHT = 3;
const AIR_SIGHT = 5;
// Units whose move was left alone when every other unit lost 1.
const MOVE_KEPT = { artillery: 2, sonicTank: 4 };

describe("move and sight", () => {
  const mobile = Object.keys(RULES.units).filter((t) => t !== "factory" && RULES.units[t].move);

  test("every ground unit sees 3 and every air unit 5", () => {
    for (const type of mobile) {
      const stats = RULES.units[type];
      assert.equal(stats.sight, stats.air ? AIR_SIGHT : GROUND_SIGHT, type);
    }
  });

  test("every unit moves 1 less than in the tests' figures, but Artillery and Sonic Tank", () => {
    const before = testRules().units;
    for (const type of mobile) {
      const expected = MOVE_KEPT[type] ?? before[type].move - 1;
      assert.equal(RULES.units[type].move, expected, type);
    }
  });
});

describe("turning over the next blocks (fog.revealRange nextBlocks)", () => {
  const NEXT = { fog: { revealRange: "nextBlocks" } };
  // Factories see nothing here, so only the test units turn blocks over.
  const blind = (extra = {}) => {
    const units = { ...testRules().units };
    units.factory = { ...units.factory, sight: 0 };
    for (const type in extra) units[type] = { ...units[type], ...extra[type] };
    return { ...NEXT, units };
  };
  const blockAt = (s, k) => s.map.hexes[k].cluster;
  const nextTo = (s, block) => {
    const near = new Set([block]);
    for (const k in s.map.hexes) {
      if (blockAt(s, k) !== block) continue;
      for (const n of neighbourKeys(k)) if (s.map.hexes[n]) near.add(blockAt(s, n));
    }
    return near;
  };
  // Blocks the units turned over, leaving out those the factories are on (a factory always
  // turns over its own block, even with sight 0).
  const revealedAfter = (s) => {
    refreshKnowledge(s);
    const factoryBlocks = s.map.factories.map((k) => blockAt(s, k) || k);
    return new Set(Object.keys(s.players[BLUE].revealed)
      .filter((b) => !factoryBlocks.includes(b)));
  };

  test("a unit turns over its own block and every block next to it in sight", () => {
    const s = scenario({ units: [{ id: "f", type: "fighter", owner: BLUE, at: "0,0" }],
      explored: false, rules: blind() });
    const near = nextTo(s, blockAt(s, "0,0"));
    assert.deepEqual(revealedAfter(s), near);
  });

  test("however long its sight, a block further away stays face down", () => {
    const LONG_SIGHT = 8;
    const s = scenario({ units: [{ id: "f", type: "fighter", owner: BLUE, at: "0,0" }],
      explored: false, rules: blind({ fighter: { sight: LONG_SIGHT } }) });
    const near = nextTo(s, blockAt(s, "0,0"));
    const further = Object.keys(s.map.hexes).filter((k) =>
      !near.has(blockAt(s, k)) && distance(k, "0,0") <= LONG_SIGHT &&
      !s.map.factories.some((at) => blockAt(s, at) === blockAt(s, k)));
    assert.ok(further.length > 0, "some blocks further away are within its sight");
    for (const k of further) assert.ok(!revealedAfter(s).has(blockAt(s, k)), k);
  });

  test("a next block out of sight is not turned over", () => {
    const SHORT_SIGHT = 0;
    const s = scenario({ units: [{ id: "t", type: "tank", owner: BLUE, at: "0,0" }],
      explored: false, rules: blind({ tank: { sight: SHORT_SIGHT } }) });
    assert.deepEqual(revealedAfter(s), new Set([blockAt(s, "0,0")]));
  });

  test("a next block hidden behind mountains is not turned over", () => {
    // A tank on the centre hex of its block, with every hex of its ring a mountain: it sees
    // its own ring but nothing past it.
    const ring = neighbourKeys("0,0");
    const terrain = Object.fromEntries(ring.map((k) => [k, "mountain"]));
    const s = scenario({ units: [{ id: "t", type: "tank", owner: BLUE, at: "0,0" }],
      explored: false, rules: blind(), terrain });
    assert.ok(ring.every((k) => blockAt(s, k) === blockAt(s, "0,0")), "the ring is its block");
    assert.deepEqual(revealedAfter(s), new Set([blockAt(s, "0,0")]));
  });

  test("on a board without blocks it turns over the hexes next to it", () => {
    const s = scenario({ units: [{ id: "t", type: "tank", owner: BLUE, at: key(0, 0) }],
      explored: false, rules: blind() });
    s.map.hexes = Object.fromEntries(Object.entries(s.map.hexes)
      .map(([k, hex]) => [k, { ...hex, cluster: null }]));
    s.players[BLUE].revealed = {};
    const revealed = revealedAfter(s);
    assert.deepEqual(revealed, new Set([key(0, 0), ...neighbourKeys(key(0, 0))]));
  });
});

describe("stopping when an enemy unit comes into view (fog.stopOnSighting)", () => {
  const GREEN = 1;
  const play = (state, ...actions) => actions.reduce((s, a) => applyAction(s, a), state);
  // Every block face up, so only units coming into sight can stop the move. The Green tank
  // starts out of the Blue tank's sight, straight ahead along its route.
  const SIGHTING = { fog: { liveSight: true, stopOnSighting: true } };
  const TANK = testRules().units.tank;
  const ENEMY_AT = key(0, -(TANK.move + TANK.sight - 1));
  const TARGET = key(0, -TANK.move);
  const start = (rules = SIGHTING, more = [], sides = null) => scenario({ rules, sides,
    units: [{ id: "t", type: "tank", owner: BLUE, at: key(0, 0) },
      { id: "e", type: "tank", owner: GREEN, at: ENEMY_AT }, ...more] });
  const moveEvent = (s) => s.events.find((e) => e.type === "move");

  test("the move stops where the enemy comes into view, with the rest of the move left", () => {
    const s = start();
    assert.equal(viewFor(s, BLUE).units.e, undefined, "the enemy starts out of sight");
    const after = play(s, { type: "move", unitId: "t", to: TARGET });
    const move = moveEvent(after);
    assert.equal(move.stoppedBy, "sighted");
    assert.equal(distance(after.units.t.at, ENEMY_AT), TANK.sight);
    assert.ok(after.units.t.continues);
    assert.equal(move.moveLeft, TANK.move - after.units.t.moveUsed);
    assert.ok(viewFor(after, BLUE).units.e, "the enemy is now in view");
    assert.ok(Object.keys(reachableHexes(viewFor(after, BLUE), "t")).length > 0);
  });

  test("arriving where the enemy comes into view leaves the rest of the move too", () => {
    const stop = play(start(), { type: "move", unitId: "t", to: TARGET }).units.t.at;
    const after = play(start(), { type: "move", unitId: "t", to: stop });
    const move = moveEvent(after);
    assert.equal(move.stoppedBy, null);
    assert.ok(move.sighted);
    assert.ok(after.units.t.continues);
  });

  test("an enemy already in view does not stop the move", () => {
    const watcher = { id: "w", type: "spotterDrone", owner: BLUE, at: key(0, -TANK.move) };
    const s = start(SIGHTING, [watcher]);
    assert.ok(viewFor(s, BLUE).units.e, "the drone already sees the enemy");
    const after = play(s, { type: "move", unitId: "t", to: key(1, -TANK.move) });
    assert.equal(moveEvent(after).stoppedBy, null);
    assert.ok(!after.units.t.continues);
  });

  test("with the rule off the move goes on", () => {
    const off = { fog: { liveSight: true, stopOnSighting: false } };
    const after = play(start(off), { type: "move", unitId: "t", to: TARGET });
    assert.equal(after.units.t.at, TARGET);
    assert.equal(moveEvent(after).stoppedBy, null);
  });

  test("an ally's unit coming into view does not stop the move", () => {
    const YELLOW = 2;
    const sides = [{ team: 0 }, { team: 1 }, { team: 0 }];
    const s = scenario({ rules: SIGHTING, sides, units: [
      { id: "t", type: "tank", owner: BLUE, at: key(0, 0) },
      { id: "y", type: "tank", owner: YELLOW, at: ENEMY_AT }] });
    const after = play(s, { type: "move", unitId: "t", to: TARGET });
    assert.equal(after.units.t.at, TARGET);
    assert.equal(moveEvent(after).stoppedBy, null);
  });
});
