import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { RULES } from "../rules-config.js";
import { FIXED_MAP_1, buildMap } from "../maps.js";
import {
  newGame, applyAction, legalActions, viewFor, reachableHexes, attackTargets, healTargets,
  harvestTargets, defenceOf,
} from "../engine.js";
import { distance } from "../hex.js";
import { scenario } from "./helpers.js";

const BLUE = 0;
const GREEN = 1;
const BLUE_FACTORY_HEX = "0,6";
// Line-of-sight fog, where units out of sight are hidden.
const SIGHT_FOG = { fog: { mode: "sight" } };

const play = (state, ...actions) => actions.reduce((s, a) => applyAction(s, a), state);
const END = { type: "endTurn" };
const attack = (unitId, targetId) => ({ type: "attack", unitId, targetId });
const unit = (id, type, owner, at, extra = {}) => ({ id, type, owner, at, ...extra });

describe("setting up a game", () => {
  const map = buildMap(FIXED_MAP_1);
  const state = newGame({ rules: RULES, map, seed: 7 });

  test("each player has a factory, the starting units and starting crystals", () => {
    for (const p of [BLUE, GREEN]) {
      const own = Object.values(state.units).filter((u) => u.owner === p);
      const types = own.map((u) => u.type).sort();
      assert.deepEqual(types, ["factory", ...RULES.start.units].sort());
      assert.equal(state.players[p].crystals, RULES.start.crystals);
      assert.equal(state.units[state.players[p].factoryId].at, map.factories[p]);
    }
  });

  test("the map's starting piles hold the starting amount", () => {
    for (const deposit of map.deposits) {
      assert.equal(state.crystals[deposit.at].amount, RULES.crystals.startAmount);
    }
  });

  test("blue moves first unless told otherwise", () => {
    assert.equal(state.current, BLUE);
    assert.equal(newGame({ rules: RULES, map, firstPlayer: GREEN }).current, GREEN);
  });

  test("the state survives a JSON round trip unchanged", () => {
    const copy = JSON.parse(JSON.stringify(state));
    assert.deepEqual(legalActions(copy), legalActions(state));
    const next = (s) => applyAction(s, END);
    assert.deepEqual(JSON.stringify(next(copy)), JSON.stringify(next(state)));
  });

  test("applying an action leaves the input state unchanged", () => {
    const before = JSON.stringify(state);
    const move = legalActions(state).find((a) => a.type === "move");
    applyAction(state, move);
    assert.equal(JSON.stringify(state), before);
  });

  test("the same seed and actions replay exactly; another seed differs", () => {
    const run = (seed) => {
      let s = newGame({ rules: RULES, map, seed });
      for (let i = 0; i < 10; i++) s = applyAction(s, END);
      return s;
    };
    assert.equal(JSON.stringify(run(3)), JSON.stringify(run(3)));
    assert.notDeepEqual(run(3).crystals, run(4).crystals);
  });
});

describe("random play", () => {
  const RANDOM_ACTIONS = 2000;
  const END_TURN_BIAS = 0.15;

  test("thousands of random legal actions never break the board's invariants", () => {
    const map = buildMap(FIXED_MAP_1);
    let s = newGame({ rules: RULES, map, seed: 11 });
    let seed = 12345;
    const rand = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
    for (let i = 0; i < RANDOM_ACTIONS && !s.result; i++) {
      const actions = legalActions(s);
      const pick = rand() < END_TURN_BIAS ? actions[actions.length - 1]
        : actions[Math.floor(rand() * actions.length)];
      const before = JSON.stringify(s);
      const previous = s;
      s = applyAction(s, pick);
      assert.equal(JSON.stringify(previous), before, `${pick.type} changed its input state`);

      const occupied = Object.values(s.units).map((u) => u.at);
      assert.equal(new Set(occupied).size, occupied.length, "two units share a hex");
      for (const u of Object.values(s.units)) {
        const terrain = s.map.hexes[u.at].terrain;
        assert.ok(RULES.terrain[terrain].moveCost !== null, `${u.id} is on ${terrain}`);
        assert.ok(u.lives >= 1 && u.lives <= RULES.lives);
        assert.ok(u.carrying >= 0 && u.carrying <= (RULES.units[u.type].storage || 0));
        assert.ok(!s.crystals[u.at], `${u.id} is on crystals`);
      }
      for (const pile of Object.values(s.crystals)) assert.ok(pile.amount > 0);
      for (const p of s.players) assert.ok(p.crystals >= 0);
    }
  });
});

describe("turns and rounds", () => {
  test("end turn passes play over and a round ends after both players", () => {
    let s = scenario({
      units: [unit("a", "tank", BLUE, "0,0"), unit("b", "tank", GREEN, "3,-3")],
    });
    s = play(s, { type: "move", unitId: "a", to: "0,-1" });
    s = play(s, END);
    assert.equal(s.current, GREEN);
    assert.equal(s.round, 1);
    s = play(s, END);
    assert.equal(s.current, BLUE);
    assert.equal(s.round, 2);
    assert.equal(s.units.a.moved, false, "flags reset at the start of the owner's turn");
  });
});

describe("movement", () => {
  const tank = unit("a", "tank", BLUE, "0,0");

  test("plain hexes cost 1 and a unit moves up to its move value", () => {
    const view = viewFor(scenario({ units: [tank] }), BLUE);
    const reach = reachableHexes(view, "a");
    assert.equal(reach["0,-4"], 4);
    assert.equal(reach["0,-5"], undefined);
  });

  test("rocky hexes cost 2", () => {
    const view = viewFor(scenario({ units: [tank], terrain: { "0,-1": "rocky" } }), BLUE);
    assert.equal(reachableHexes(view, "a")["0,-1"], 2);
  });

  test("mountains and chasms cannot be entered", () => {
    const terrain = { "0,-1": "mountain", "1,-1": "chasm" };
    const reach = reachableHexes(viewFor(scenario({ units: [tank], terrain }), BLUE), "a");
    assert.equal(reach["0,-1"], undefined);
    assert.equal(reach["1,-1"], undefined);
  });

  test("friendly units can be passed through but not stopped on", () => {
    const s = scenario({ units: [tank, unit("f", "scoutBike", BLUE, "0,-1")] });
    const reach = reachableHexes(viewFor(s, BLUE), "a");
    assert.equal(reach["0,-1"], undefined);
    assert.equal(reach["0,-2"], 2);
  });

  test("enemy units block movement", () => {
    const withEnemy = scenario({ units: [tank, unit("e", "scoutBike", GREEN, "0,-1")] });
    assert.equal(reachableHexes(viewFor(withEnemy, BLUE), "a")["0,-2"], 3);
  });

  test("driving onto or over crystals destroys them", () => {
    let s = scenario({ units: [tank], crystals: { "0,-1": { amount: 30 } } });
    assert.equal(reachableHexes(viewFor(s, BLUE), "a")["0,-2"], 2);
    s = play(s, { type: "move", unitId: "a", to: "0,-2" });
    assert.equal(s.crystals["0,-1"], undefined);
    assert.ok(s.events.some((e) => e.type === "crushed" && e.at === "0,-1" && e.amount === 30));
  });

  test("of two equally short routes, the one that spares the crystals is taken", () => {
    let s = scenario({ units: [tank], crystals: { "0,-1": { amount: 30 } } });
    s = play(s, { type: "move", unitId: "a", to: "1,-2" });
    assert.equal(s.units.a.at, "1,-2");
    assert.equal(s.crystals["0,-1"].amount, 30);
  });

  test("a unit moves once a turn and cannot move after acting", () => {
    let s = scenario({ units: [tank, unit("e", "tank", GREEN, "0,-2")] });
    s = play(s, { type: "move", unitId: "a", to: "1,0" });
    assert.deepEqual(reachableHexes(viewFor(s, BLUE), "a"), {});
    let t = scenario({ units: [tank, unit("e", "heavyCannon", GREEN, "0,-2")] });
    t = play(t, attack("a", "e"));
    assert.deepEqual(reachableHexes(viewFor(t, BLUE), "a"), {});
  });

  test("a hidden enemy in the way stops the move short", () => {
    const s = scenario({
      units: [unit("h", "lightHarvester", BLUE, "0,0"), unit("e", "tank", GREEN, "0,-3")],
      rules: SIGHT_FOG,
    });
    assert.equal(viewFor(s, BLUE).units.e, undefined, "the enemy starts out of sight");
    const next = play(s, { type: "move", unitId: "h", to: "0,-4" });
    assert.equal(next.units.h.at, "0,-2");
    assert.equal(next.events[0].stoppedBy, "unit");
  });
});

describe("combat", () => {
  test("an attack below defence costs no life", () => {
    let s = scenario({
      units: [unit("a", "tank", BLUE, "0,0"), unit("e", "heavyCannon", GREEN, "0,-2")],
    });
    s = play(s, attack("a", "e"));
    assert.equal(s.units.e.lives, 2);
  });

  test("an attack reaching defence costs one life and flips the tile", () => {
    let s = scenario({
      units: [unit("a", "tank", BLUE, "0,0"), unit("e", "tank", GREEN, "0,-2")],
    });
    s = play(s, attack("a", "e"));
    assert.equal(s.units.e.lives, 1);
  });

  test("an attack reaching twice defence destroys the unit", () => {
    let s = scenario({
      units: [unit("a", "heavyCannon", BLUE, "0,0"), unit("e", "scoutBike", GREEN, "0,-2"),
        unit("g", "tank", GREEN, "3,-6")],
    });
    s = play(s, attack("a", "e"));
    assert.equal(s.units.e, undefined);
    assert.ok(s.events.some((e) => e.type === "destroyed" && e.unitId === "e"));
  });

  test("attacks by several units in one turn add up", () => {
    let s = scenario({
      units: [
        unit("a", "tank", BLUE, "0,0"), unit("b", "tank", BLUE, "1,-1"),
        unit("c", "tank", BLUE, "-1,0"), unit("e", "heavyCannon", GREEN, "0,-2"),
      ],
    });
    s = play(s, attack("a", "e"));
    assert.equal(s.units.e.lives, 2, "25 is below 40");
    s = play(s, attack("b", "e"));
    assert.equal(s.units.e.lives, 1, "50 reaches 40");
    s = play(s, attack("c", "e"));
    assert.equal(s.units.e.lives, 1, "75 is below 80");
  });

  test("artillery and a scout bike combine against a heavy cannon", () => {
    const units = (lives) => [
      unit("r", "artillery", BLUE, "0,2", { setUp: true }), unit("s", "scoutBike", BLUE, "1,-1"),
      unit("e", "heavyCannon", GREEN, "0,-1", { lives }), unit("g", "tank", GREEN, "3,-6"),
    ];
    // 30 + 15 = 45 reaches its defence of 40: one life lost, the tile flips.
    let s = play(scenario({ units: units(2) }), attack("r", "e"), attack("s", "e"));
    assert.equal(s.units.e.lives, 1);
    // Already damaged, the same 45 destroys it.
    s = play(scenario({ units: units(1) }), attack("r", "e"), attack("s", "e"));
    assert.equal(s.units.e, undefined);
  });

  test("attack totals do not carry over to the next turn", () => {
    let s = scenario({
      units: [unit("a", "tank", BLUE, "0,0"), unit("e", "heavyCannon", GREEN, "0,-2")],
    });
    s = play(s, attack("a", "e"), END, END, attack("a", "e"));
    assert.equal(s.units.e.lives, 2);
  });

  test("a damaged unit is destroyed by a later attack reaching its defence", () => {
    let s = scenario({
      units: [unit("a", "tank", BLUE, "0,0"), unit("e", "tank", GREEN, "0,-2", { lives: 1 })],
    });
    s = play(s, attack("a", "e"));
    assert.equal(s.units.e, undefined);
  });

  test("rocky ground adds to defence", () => {
    const s = scenario({
      units: [unit("a", "tank", BLUE, "0,0"), unit("e", "tank", GREEN, "0,-2")],
      terrain: { "0,-2": "rocky" },
    });
    assert.equal(defenceOf(s, s.units.e), 30);
    assert.equal(play(s, attack("a", "e")).units.e.lives, 2);
  });

  test("targets must be within the unit's minimum and maximum range", () => {
    const s = scenario({
      units: [
        unit("a", "tank", BLUE, "0,0"), unit("r", "artillery", BLUE, "2,0", { setUp: true }),
        unit("e", "tank", GREEN, "0,-3"), unit("f", "scoutBike", GREEN, "3,0"),
      ],
    });
    const view = viewFor(s, BLUE);
    assert.deepEqual(attackTargets(view, "a"), [], "tank range is 2");
    assert.equal(attackTargets(view, "r").includes("f"), false, "artillery cannot fire at 1");
    assert.equal(attackTargets(view, "r").includes("e"), true);
  });

  test("a mountain between attacker and target blocks the shot", () => {
    const s = scenario({
      units: [
        unit("a", "tank", BLUE, "0,0"), unit("s", "scoutBike", BLUE, "1,-2"),
        unit("e", "tank", GREEN, "0,-2"),
      ],
      terrain: { "0,-1": "mountain" },
    });
    const view = viewFor(s, BLUE);
    assert.ok(view.units.e, "the scout can see the target");
    assert.deepEqual(attackTargets(view, "a"), []);
  });

  test("units out of sight cannot be targeted until something spots them", () => {
    const art = unit("r", "artillery", BLUE, "0,0", { setUp: true });
    const target = unit("e", "scoutBike", GREEN, "0,-5");
    const alone = scenario({ units: [art, target], rules: SIGHT_FOG });
    assert.deepEqual(attackTargets(viewFor(alone, BLUE), "r"), []);
    assert.equal(legalActions(alone).some((a) => a.type === "attack"), false);
    const spotted = scenario({
      units: [art, target, unit("s", "scoutBike", BLUE, "0,-3")], rules: SIGHT_FOG,
    });
    assert.deepEqual(attackTargets(viewFor(spotted, BLUE), "r"), ["e"]);
  });
});

describe("return fire", () => {
  test("a surviving target hits back at an adjacent attacker", () => {
    let s = scenario({
      units: [unit("a", "scoutBike", BLUE, "0,0"), unit("b", "tank", BLUE, "2,2"),
        unit("e", "tank", GREEN, "0,-1")],
    });
    s = play(s, attack("a", "e"));
    assert.equal(s.units.e.lives, 2);
    assert.equal(s.units.a, undefined, "25 is at least twice the scout's 10");
  });

  test("no return fire against an attack from two hexes away", () => {
    let s = scenario({
      units: [unit("a", "tank", BLUE, "0,0"), unit("e", "tank", GREEN, "0,-2")],
    });
    s = play(s, attack("a", "e"));
    assert.equal(s.units.a.lives, 2);
  });

  test("a target destroyed by the attack still fires back", () => {
    let s = scenario({
      units: [unit("a", "tank", BLUE, "0,0"), unit("e", "tank", GREEN, "0,-1", { lives: 1 }),
        unit("g", "tank", GREEN, "3,-6")],
    });
    s = play(s, attack("a", "e"));
    assert.equal(s.units.e, undefined);
    assert.equal(s.units.a.lives, 1, "the destroyed tank's 25 reaches the attacker's defence");
  });

  test("units without a short-range attack do not hit back", () => {
    let s = scenario({
      units: [
        unit("a", "scoutBike", BLUE, "0,0"), unit("e", "artillery", GREEN, "0,-1"),
        unit("t", "tank", BLUE, "3,0"), unit("h", "lightHarvester", GREEN, "4,-1"),
      ],
    });
    s = play(s, attack("a", "e"), attack("t", "h"));
    assert.equal(s.units.e.lives, 1);
    assert.equal(s.units.h.lives, 1);
    assert.equal(s.units.a.lives, 2);
    assert.equal(s.units.t.lives, 2);
  });
});

describe("artillery set-up", () => {
  const scene = () => scenario({
    units: [unit("r", "artillery", BLUE, "0,0"), unit("e", "tank", GREEN, "0,-3")],
  });

  test("artillery cannot fire until it has set up, and setting up takes the turn", () => {
    let s = scene();
    assert.deepEqual(attackTargets(viewFor(s, BLUE), "r"), []);
    s = play(s, { type: "setUp", unitId: "r" });
    assert.deepEqual(attackTargets(viewFor(s, BLUE), "r"), []);
    s = play(s, END, END);
    assert.deepEqual(attackTargets(viewFor(s, BLUE), "r"), ["e"]);
  });

  test("set-up artillery cannot move until it packs up, which also takes a turn", () => {
    let s = play(scene(), { type: "setUp", unitId: "r" }, END, END);
    assert.deepEqual(reachableHexes(viewFor(s, BLUE), "r"), {});
    s = play(s, { type: "packUp", unitId: "r" });
    assert.deepEqual(reachableHexes(viewFor(s, BLUE), "r"), {});
    s = play(s, END, END);
    assert.ok(Object.keys(reachableHexes(viewFor(s, BLUE), "r")).length > 0);
  });
});

describe("healing", () => {
  const base = [unit("m", "lightMedic", BLUE, "0,0"), unit("g", "tank", GREEN, "3,-6")];

  test("a medic restores a life to an adjacent unit with defence up to its healing", () => {
    let s = scenario({ units: [...base, unit("t", "tank", BLUE, "0,-1", { lives: 1 })] });
    assert.deepEqual(healTargets(viewFor(s, BLUE), "m"), ["t"]);
    s = play(s, { type: "heal", unitId: "m", targetId: "t" });
    assert.equal(s.units.t.lives, 2);
  });

  test("a medic cannot heal stronger units, distant units, undamaged units or itself", () => {
    const s = scenario({
      units: [
        unit("m", "lightMedic", BLUE, "0,0", { lives: 1 }), unit("g", "tank", GREEN, "3,-6"),
        unit("h", "heavyCannon", BLUE, "0,-1", { lives: 1 }),
        unit("far", "tank", BLUE, "0,-2", { lives: 1 }), unit("ok", "tank", BLUE, "1,0"),
      ],
    });
    assert.deepEqual(healTargets(viewFor(s, BLUE), "m"), []);
  });
});

describe("crystals", () => {
  const harvester = unit("h", "lightHarvester", BLUE, "0,0");

  test("a harvest takes as much as the unit can carry", () => {
    let s = scenario({ units: [harvester], crystals: { "0,-1": { amount: 120 } } });
    s = play(s, { type: "harvest", unitId: "h", at: "0,-1" });
    assert.equal(s.units.h.carrying, 90);
    assert.equal(s.crystals["0,-1"].amount, 30);
  });

  test("an emptied pile disappears", () => {
    let s = scenario({ units: [harvester], crystals: { "0,-1": { amount: 20 } } });
    s = play(s, { type: "harvest", unitId: "h", at: "0,-1" });
    assert.equal(s.crystals["0,-1"], undefined);
  });

  test("harvesting needs an adjacent pile and free storage", () => {
    const far = scenario({ units: [harvester], crystals: { "0,-2": { amount: 20 } } });
    assert.deepEqual(harvestTargets(viewFor(far, BLUE), "h"), []);
    const full = scenario({
      units: [{ ...harvester, carrying: 90 }], crystals: { "0,-1": { amount: 20 } },
    });
    assert.deepEqual(harvestTargets(viewFor(full, BLUE), "h"), []);
  });

  test("a unit that ends its turn next to its factory unloads automatically", () => {
    let s = scenario({
      units: [
        unit("h", "lightHarvester", BLUE, "0,5", { carrying: 60 }),
        unit("far", "lightHarvester", BLUE, "0,2", { carrying: 40 }),
      ],
    });
    s = play(s, END);
    assert.equal(s.players[BLUE].crystals, 160);
    assert.equal(s.units.h.carrying, 0);
    assert.equal(s.units.far.carrying, 40, "a unit away from the factory keeps its load");
  });

  test("unloading next to the factory banks the load", () => {
    let s = scenario({ units: [unit("h", "lightHarvester", BLUE, "0,5", { carrying: 60 })] });
    s = play(s, { type: "unload", unitId: "h" });
    assert.equal(s.players[BLUE].crystals, 160);
    assert.equal(s.units.h.carrying, 0);
  });

  test("every pile grows by 5 after each player's turn", () => {
    let s = scenario({
      units: [harvester],
      crystals: { "3,-3": { amount: 10 }, "-3,0": { amount: 50 } },
    });
    s = play(s, END);
    assert.equal(s.crystals["3,-3"].amount, 15, "after blue's turn");
    s = play(s, END);
    assert.equal(s.crystals["3,-3"].amount, 20, "after green's turn");
    assert.equal(s.crystals["-3,0"].amount, 60);
  });

  test("a pile harvested during a turn does not grow at the end of that turn", () => {
    let s = scenario({ units: [harvester], crystals: { "0,-1": { amount: 100 } } });
    s = play(s, { type: "harvest", unitId: "h", at: "0,-1" }, END);
    assert.equal(s.crystals["0,-1"].amount, 10);
    s = play(s, END);
    assert.equal(s.crystals["0,-1"].amount, 15, "it grows again after the next turn");
  });

  test("a pile that grows to the explode level explodes and is lost", () => {
    let s = scenario({ units: [harvester], crystals: { "3,-3": { amount: 70 } } });
    s = play(s, END, END);
    assert.equal(s.crystals["3,-3"], undefined);
    assert.ok(s.events.some((e) => e.type === "crystalsExploded" && e.at === "3,-3" &&
      e.amount === RULES.crystals.explodeAt));
  });

  test("a starting pile left alone explodes after three rounds", () => {
    let s = scenario({
      units: [harvester], crystals: { "3,-3": { amount: RULES.crystals.startAmount } },
    });
    s = play(s, END, END, END, END);
    assert.equal(s.crystals["3,-3"].amount, 70);
    s = play(s, END, END);
    assert.equal(s.crystals["3,-3"], undefined);
  });

  test("the same number of new piles spawns after each player's turn", () => {
    let s = scenario({ units: [harvester], rules: { crystals: { spawnChoices: [1] } } });
    s = play(s, END);
    assert.equal(Object.keys(s.crystals).length, 1, "one before green's turn");
    s = play(s, END);
    assert.equal(Object.keys(s.crystals).length, 2, "one before blue's next turn");
    for (const [at, pile] of Object.entries(s.crystals)) {
      assert.ok(pile.amount >= RULES.crystals.spawnAmount);
      for (const f of s.map.factories) {
        assert.ok(distance(at, f) >= RULES.crystals.spawnMinDistanceFromFactory);
      }
    }
  });

  test("the spawn count is drawn once a round and used after both turns", () => {
    const map = buildMap(FIXED_MAP_1);
    let s = newGame({ rules: RULES, map, seed: 3, recordActions: false });
    for (let round = 0; round < 20; round++) {
      const count = s.spawnsPerTurn;
      assert.ok(RULES.crystals.spawnChoices.includes(count));
      for (let turn = 0; turn < 2; turn++) {
        s = applyAction(s, END);
        const spawned = s.events.filter((e) => e.type === "spawn").length;
        assert.equal(spawned, count, `round ${round + 1}, turn ${turn + 1}`);
      }
    }
  });
});

describe("building", () => {
  test("a unit is built next to the factory, paid for, and waits a turn", () => {
    let s = scenario({ units: [unit("g", "tank", GREEN, "3,-6")] });
    s = play(s, { type: "build", unitType: "tank", at: "0,5" });
    const built = Object.values(s.units).find((u) => u.type === "tank" && u.owner === BLUE);
    assert.equal(built.at, "0,5");
    assert.equal(s.players[BLUE].crystals, 30);
    assert.deepEqual(reachableHexes(viewFor(s, BLUE), built.id), {});
  });

  test("building needs enough crystals and a free hex next to the factory", () => {
    const s = scenario({ units: [unit("b", "scoutBike", BLUE, "0,5")], playerCrystals: [60, 0] });
    assert.throws(() => applyAction(s, { type: "build", unitType: "tank", at: "1,5" }));
    assert.throws(() => applyAction(s, { type: "build", unitType: "scoutBike", at: "0,5" }));
    assert.throws(() => applyAction(s, { type: "build", unitType: "scoutBike", at: "0,3" }));
    assert.ok(applyAction(s, { type: "build", unitType: "scoutBike", at: "1,5" }));
  });
});

describe("fog of war by line of sight", () => {
  test("enemy units out of sight are hidden and unexplored terrain is unknown", () => {
    const s = scenario({
      units: [unit("a", "tank", BLUE, "0,2"), unit("e", "tank", GREEN, "0,-4")],
      terrain: { "0,-3": "rocky" }, explored: false, rules: SIGHT_FOG,
    });
    const view = viewFor(s, BLUE);
    assert.equal(view.units.e, undefined);
    assert.equal(view.map.hexes["0,-3"].terrain, null);
    assert.equal(view.map.hexes["0,0"].terrain, "plain");
  });

  test("crystals out of sight show as last seen", () => {
    let s = scenario({
      units: [unit("s", "scoutBike", BLUE, "0,0"), unit("g", "tank", GREEN, "3,-6")],
      crystals: { "0,-3": { amount: 10 } }, rules: SIGHT_FOG,
    });
    s = play(s, { type: "move", unitId: "s", to: "0,5" }, END, END);
    assert.equal(s.crystals["0,-3"].amount, 20);
    assert.equal(viewFor(s, BLUE).crystals["0,-3"].amount, 10);
  });

  test("the enemy factory stays known once seen", () => {
    let s = scenario({
      units: [unit("s", "scoutBike", BLUE, "0,-2"), unit("g", "tank", GREEN, "3,-6")],
      rules: SIGHT_FOG,
    });
    const factoryId = s.players[GREEN].factoryId;
    assert.ok(viewFor(s, BLUE).units[factoryId]);
    s = play(s, { type: "move", unitId: "s", to: "0,3" });
    assert.ok(viewFor(s, BLUE).units[factoryId]);
  });
});

describe("fog of war by map blocks", () => {
  // Factories see nothing beyond their own hex here, so only the test units turn blocks over.
  const blindFactory = { ...RULES.units.factory, sight: 0 };
  // Sight-range reveal, so these tests show blocks turning over from a distance.
  const blindFactories = {
    units: { ...RULES.units, factory: blindFactory }, fog: { revealRange: null },
  };
  const blockOf = (s, k) =>
    Object.keys(s.map.hexes).filter((h) => s.map.hexes[h].cluster === s.map.hexes[k].cluster);

  test("seeing any hex of a block turns the whole block over", () => {
    const s = scenario({
      units: [unit("h", "lightHarvester", BLUE, "0,0")], explored: false, rules: blindFactories,
    });
    const view = viewFor(s, BLUE);
    const block = blockOf(s, "0,-2");
    assert.ok(block.some((k) => distance(k, "0,0") > RULES.units.lightHarvester.sight));
    for (const k of block) assert.equal(view.map.hexes[k].terrain, "plain", `${k} is face down`);
    assert.equal(view.map.hexes["-5,1"].terrain, null, "a block out of sight stays face down");
  });

  test("with reveal range 1, only blocks a unit is on or next to turn over", () => {
    const s = scenario({
      units: [unit("h", "lightHarvester", BLUE, "0,0")], explored: false,
      rules: { units: blindFactories.units, fog: { revealRange: 1 } },
    });
    const view = viewFor(s, BLUE);
    assert.equal(view.map.hexes["0,-1"].terrain, "plain", "the next hex's block is face up");
    assert.equal(view.map.hexes["0,-2"].terrain, null, "a block two hexes away is face down");
  });

  test("a block one player turns over stays face down for the other", () => {
    const s = scenario({
      units: [unit("h", "lightHarvester", BLUE, "0,0")], explored: false, rules: blindFactories,
    });
    assert.equal(viewFor(s, BLUE).map.hexes["0,-2"].terrain, "plain");
    assert.equal(viewFor(s, GREEN).map.hexes["0,-2"].terrain, null);
  });

  test("units on the other player's turned-over blocks stay hidden", () => {
    const s = scenario({
      units: [unit("h", "lightHarvester", BLUE, "0,3"), unit("e", "tank", GREEN, "0,-4")],
      explored: false, rules: blindFactories,
    });
    assert.ok(viewFor(s, GREEN).units.e, "green sees its own tank and block");
    assert.equal(viewFor(s, BLUE).units.e, undefined);
    assert.equal(viewFor(s, BLUE).map.hexes["0,-4"].terrain, null);
  });

  test("everything on a turned-over block stays visible", () => {
    let s = scenario({
      units: [unit("s", "scoutBike", BLUE, "0,0"), unit("e", "tank", GREEN, "0,-3")],
      explored: false, rules: blindFactories,
    });
    s = play(s, { type: "move", unitId: "s", to: "0,5" });
    assert.ok(distance(s.units.s.at, "0,-3") > RULES.units.scoutBike.sight);
    assert.ok(viewFor(s, BLUE).units.e, "the tank is still on a face-up block");
  });

  test("a moving unit turns over the blocks it sees along the way", () => {
    let s = scenario({
      units: [unit("h", "lightHarvester", BLUE, "-3,0")], explored: false, rules: blindFactories,
    });
    const sight = RULES.units.lightHarvester.sight;
    const block = blockOf(s, "0,2");
    assert.ok(block.every((k) => distance(k, "-3,0") > sight && distance(k, "3,0") > sight));
    assert.equal(viewFor(s, BLUE).map.hexes["0,2"].terrain, null);
    s = play(s, { type: "move", unitId: "h", to: "3,0" });
    assert.equal(viewFor(s, BLUE).map.hexes["0,2"].terrain, "plain");
  });
});

describe("winning", () => {
  test("destroying the enemy factory wins", () => {
    let s = scenario({
      units: [unit("a", "heavyCannon", BLUE, "0,-3"), unit("g", "tank", GREEN, "3,-3")],
      rules: { units: { ...RULES.units, factory: { ...RULES.units.factory, defence: 20 } } },
    });
    s = play(s, attack("a", s.players[GREEN].factoryId));
    assert.deepEqual(s.result, { winner: BLUE, reason: "factoryDestroyed", round: 1 });
    assert.deepEqual(legalActions(s), []);
  });

  test("a player with no units who cannot afford one loses", () => {
    let s = scenario({
      units: [unit("a", "heavyCannon", BLUE, "0,0"), unit("e", "scoutBike", GREEN, "0,-2")],
      playerCrystals: [0, 20],
    });
    s = play(s, attack("a", "e"));
    assert.equal(s.result.winner, BLUE);
    assert.equal(s.result.reason, "noUnits");
  });

  test("reaching the round cap ends the game with no winner", () => {
    let s = scenario({
      units: [unit("a", "tank", BLUE, "0,0"), unit("e", "tank", GREEN, "3,-6")],
    });
    s = { ...s, rules: { ...s.rules, roundCap: 1 } };
    s = play(s, END, END);
    assert.deepEqual(s.result, { winner: null, reason: "roundCap", round: 2 });
  });
});
