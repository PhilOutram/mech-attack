// More than two sides: turns in phases, players acting at the same time, teams, Comms and
// knock-outs.
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  applyAction, legalActions, viewFor, attackTargets, reachableHexes, upgradeOptions,
  harvestTargets, canResumeTurn,
} from "../engine.js";
import { chooseAction, DEFAULT_PERSONALITY } from "../ai.js";
import { scenario, MORE_FACTORIES } from "./helpers.js";

const BLUE = 0;
const GREEN = 1;
const YELLOW = 2;
const PURPLE = 3;
const END = { type: "endTurn" };
const COMMS_COST = 30;

const play = (state, ...actions) => actions.reduce((s, a) => applyAction(s, a), state);
const unit = (id, type, owner, at, extra = {}) => ({ id, type, owner, at, ...extra });
const as = (player, action) => ({ ...action, player });
const free = (n) => Array.from({ length: n }, (_, p) => ({ team: p }));
const homeOf = (s, p) => s.players[p].factoryId;

describe("turns with more than two sides", () => {
  test("three sides take turns in order, and the round turns after the last", () => {
    let s = scenario({ sides: free(3) });
    assert.deepEqual([s.current, s.round], [BLUE, 1]);
    s = play(s, END);
    assert.equal(s.current, GREEN);
    s = play(s, END);
    assert.equal(s.current, YELLOW);
    s = play(s, END);
    assert.deepEqual([s.current, s.round], [BLUE, 2]);
  });

  test("players in the same phase act at the same time; it ends when all have ended", () => {
    const sides = [{ team: 0 }, { team: 0 }, { team: 1 }];
    let s = scenario({
      sides, phases: [[BLUE, GREEN], [YELLOW]],
      units: [unit("b", "tank", BLUE, "1,2"), unit("g", "tank", GREEN, "-1,-2")],
    });
    assert.deepEqual(s.active, [BLUE, GREEN]);
    s = play(s, as(GREEN, { type: "move", unitId: "g", to: "-1,-1" }));
    s = play(s, as(BLUE, { type: "move", unitId: "b", to: "1,1" }));
    assert.equal(s.units.g.at, "-1,-1");
    s = play(s, as(GREEN, END));
    assert.deepEqual(s.active, [BLUE], "blue is still playing");
    assert.throws(() => play(s, as(GREEN, { type: "move", unitId: "g", to: "-1,0" })),
      /not your turn/);
    s = play(s, as(BLUE, END));
    assert.equal(s.current, YELLOW);
  });

  test("a player who has ended can take it back while others in the phase play on", () => {
    const sides = [{ team: 0 }, { team: 0 }, { team: 1 }];
    let s = scenario({
      sides, phases: [[BLUE, GREEN], [YELLOW]],
      units: [unit("b", "tank", BLUE, "1,2"), unit("g", "tank", GREEN, "-1,-2")],
    });
    s = play(s, as(GREEN, END));
    assert.ok(canResumeTurn(s, GREEN));
    s = play(s, as(GREEN, { type: "resumeTurn" }));
    assert.deepEqual(s.active, [BLUE, GREEN], "green plays on, in phase order");
    s = play(s, as(GREEN, { type: "move", unitId: "g", to: "-1,-1" }));
    assert.equal(s.units.g.at, "-1,-1");
    // Blue has not ended, so has nothing to take back; once everyone has, the phase is over.
    assert.throws(() => play(s, as(BLUE, { type: "resumeTurn" })), /not waiting/);
    s = play(s, as(GREEN, END), as(BLUE, END));
    assert.equal(s.current, YELLOW);
    assert.throws(() => play(s, as(GREEN, { type: "resumeTurn" })), /not waiting/);
  });

  test("units unload and labs pay out when the whole phase ends, not at each end turn", () => {
    const sides = [{ team: 0 }, { team: 0 }, { team: 1 }];
    let s = scenario({
      sides, phases: [[BLUE, GREEN], [YELLOW]],
      units: [unit("h", "lightHarvester", GREEN, "0,-5", { carrying: 40 }),
        unit("b", "tank", BLUE, "1,2")],
    });
    const start = s.players[GREEN].crystals;
    s = play(s, as(GREEN, END));
    assert.equal(s.units.h.carrying, 40, "nothing happens until the phase ends");
    s = play(s, as(BLUE, END));
    assert.equal(s.units.h.carrying, 0);
    assert.equal(s.players[GREEN].crystals, start + 40);
  });

  test("first come, first served: the later of two clashing moves is refused", () => {
    let s = scenario({
      sides: [{ team: 0 }, { team: 0 }, { team: 1 }], phases: [[BLUE, GREEN], [YELLOW]],
      units: [unit("hb", "lightHarvester", BLUE, "0,1"),
        unit("hg", "lightHarvester", GREEN, "1,-1")],
      crystals: { "1,0": { amount: 50 } },
    });
    s = play(s, as(GREEN, { type: "harvest", unitId: "hg", at: "1,0" }));
    assert.equal(harvestTargets(viewFor(s, BLUE), "hb").length, 0, "the pile is gone");
    assert.throws(() => play(s, as(BLUE, { type: "harvest", unitId: "hb", at: "1,0" })),
      /cannot harvest/);
  });

  test("a player in a shared phase gets legal actions that name them", () => {
    const s = scenario({
      sides: [{ team: 0 }, { team: 0 }, { team: 1 }], phases: [[BLUE, GREEN], [YELLOW]],
      units: [unit("g", "tank", GREEN, "0,0")],
    });
    const actions = legalActions(s, GREEN);
    assert.ok(actions.length > 1);
    assert.ok(actions.every((a) => a.player === GREEN));
    assert.deepEqual(legalActions(s, YELLOW), [], "yellow is not playing yet");
  });
});

describe("teams", () => {
  const sides = [{ team: 0 }, { team: 0 }, { team: 1 }];

  test("allies cannot fire on each other", () => {
    const s = scenario({
      sides, units: [unit("b", "tank", BLUE, "0,0"), unit("g", "tank", GREEN, "0,-1"),
        unit("y", "tank", YELLOW, "1,-1")],
    });
    assert.deepEqual(attackTargets(viewFor(s, BLUE), "b"), ["y"]);
  });

  test("allies cannot overrun each other's factories", () => {
    const s = scenario({ sides, units: [unit("i", "infantry", BLUE, "0,-5")] });
    assert.ok(!("0,-6" in reachableHexes(viewFor(s, BLUE), "i")));
  });

  test("the game ends when one team is left, with every player of it listed", () => {
    let s = scenario({ sides, units: [unit("i", "infantry", BLUE, "5,0"),
      unit("g", "tank", GREEN, "0,0")] });
    s = play(s, { type: "move", unitId: "i", to: MORE_FACTORIES[0] });
    assert.equal(s.result.reason, "factoryCaptured");
    assert.deepEqual(s.result.winners, [BLUE, GREEN]);
  });
});

describe("Comms", () => {
  const sides = [{ team: 0 }, { team: 0 }, { team: 1 }];
  const setUp = () => scenario({
    sides, explored: false, playerCrystals: [100, 100, 100],
    units: [unit("b", "scoutBike", BLUE, "0,3"), unit("g", "scoutBike", GREEN, "0,-3")],
  });
  const fit = (s, p) => {
    const f = s.units[homeOf(s, p)];
    s.units[f.id] = { ...f, upgrades: [...f.upgrades, "comms"] };
    return s;
  };

  test("is offered only to players with allies", () => {
    const s = setUp();
    assert.ok(upgradeOptions(s, homeOf(s, BLUE)).includes("comms"));
    assert.ok(!upgradeOptions(s, homeOf(s, YELLOW)).includes("comms"));
    const two = scenario();
    assert.ok(!upgradeOptions(two, homeOf(two, BLUE)).includes("comms"));
  });

  test("costs 30 and is bought in a factory", () => {
    let s = setUp();
    s = play(s, { type: "upgrade", factoryId: homeOf(s, BLUE), upgrade: "comms" });
    assert.equal(s.players[BLUE].crystals, 100 - COMMS_COST);
  });

  test("allies see each other's ground and units only when both have it", () => {
    const s = setUp();
    assert.equal(viewFor(s, BLUE).units.g, undefined);
    fit(s, BLUE);
    const one = play(s, END);
    assert.equal(viewFor(one, BLUE).units.g, undefined, "green has no Comms yet");
    fit(s, GREEN);
    const both = play(s, END);
    assert.ok(viewFor(both, BLUE).units.g, "blue sees green's scout");
    assert.equal(viewFor(both, BLUE).map.hexes["0,-3"].terrain, "plain");
  });
});

describe("knock-outs", () => {
  test("a beaten player is knocked out and the others play on", () => {
    let s = scenario({
      sides: free(3),
      units: [unit("i", "infantry", BLUE, "5,0"), unit("y", "tank", YELLOW, "3,-3"),
        unit("g", "tank", GREEN, "0,0")],
      playerCrystals: [100, 100, 90],
    });
    const yellowHome = homeOf(s, YELLOW);
    s = play(s, { type: "move", unitId: "i", to: MORE_FACTORIES[0] });
    assert.equal(s.result, null);
    assert.equal(s.players[YELLOW].out, true);
    assert.equal(s.units.y, undefined, "yellow's units are gone");
    assert.equal(s.units[yellowHome].owner, BLUE, "blue holds yellow's home");
    assert.equal(s.players[BLUE].crystals, 100 + 90, "yellow's crystals went to blue");
    s = play(s, END, END);
    assert.deepEqual([s.current, s.round], [BLUE, 2], "yellow's turn is skipped");
  });

  test("a knocked-out player's other factories become unused, sharing their crystals", () => {
    let s = scenario({
      sides: free(3),
      units: [unit("i", "infantry", BLUE, "5,0"), unit("y", "tank", YELLOW, "3,-3"),
        unit("n", "factory", YELLOW, "3,0", { upgrades: [] }), unit("g", "tank", GREEN, "0,0")],
      playerCrystals: [100, 100, 90],
    });
    s = play(s, { type: "move", unitId: "i", to: MORE_FACTORIES[0] });
    assert.equal(s.units.n.owner, null);
    assert.equal(s.units.n.store, 90);
  });

  test("with two sides, a lost home still ends the game at once", () => {
    let s = scenario({ units: [unit("i", "infantry", BLUE, "0,-5"),
      unit("g", "tank", GREEN, "3,-3")] });
    s = play(s, { type: "move", unitId: "i", to: "0,-6" });
    assert.deepEqual(s.result, { winner: BLUE, reason: "factoryCaptured", round: 1 });
  });

  test("resigning knocks a player out of a three-sided game", () => {
    let s = scenario({ sides: free(3), units: [unit("g", "tank", GREEN, "0,0"),
      unit("y", "tank", YELLOW, "3,-3"), unit("b", "tank", BLUE, "0,3")] });
    s = play(s, { type: "resign", player: GREEN });
    assert.equal(s.result, null);
    assert.equal(s.players[GREEN].out, true);
  });
});

describe("four sides", () => {
  test("four sides can play, each its own team", () => {
    let s = scenario({ sides: free(4) });
    for (const p of [BLUE, GREEN, YELLOW, PURPLE]) {
      assert.equal(s.current, p);
      s = play(s, END);
    }
    assert.equal(s.round, 2);
  });
});

describe("the AI with more than two sides", () => {
  const ROUNDS = 25;

  test("plays a three-sided game: every move legal, and the game goes on or ends", () => {
    let s = scenario({
      sides: free(3), rules: { roundCap: ROUNDS },
      units: [unit("bt", "tank", BLUE, "0,4"), unit("bh", "lightHarvester", BLUE, "1,4"),
        unit("gt", "tank", GREEN, "0,-4"), unit("gh", "lightHarvester", GREEN, "-1,-4"),
        unit("yt", "tank", YELLOW, "4,0"), unit("yh", "lightHarvester", YELLOW, "4,-1")],
      crystals: { "0,0": { amount: 50 }, "2,2": { amount: 50 }, "-2,-2": { amount: 50 } },
    });
    while (!s.result) {
      const action = chooseAction(viewFor(s, s.current), DEFAULT_PERSONALITY);
      const legal = legalActions(s).some((a) => JSON.stringify(a) === JSON.stringify(action));
      assert.ok(legal, `${JSON.stringify(action)} is not legal`);
      s = applyAction(s, action);
    }
    assert.ok(s.result.round <= ROUNDS + 1);
  });

  test("goes for the weaker opponent when weakness counts", () => {
    const weakFirst = { ...DEFAULT_PERSONALITY, targetWeakness: 2, targetNearness: 0,
      targetThreat: 0, captureFactories: 0, harvestersEarly: 0, harvestersMax: 0 };
    // Green is strong, yellow weak; blue's tank heads for yellow's side.
    const s = scenario({
      sides: free(3),
      units: [unit("b", "tank", BLUE, "0,2"), unit("g1", "heavyCannon", GREEN, "-1,-3"),
        unit("g2", "heavyCannon", GREEN, "1,-4"), unit("y", "scoutBike", YELLOW, "4,0")],
      playerCrystals: [0, 100, 100],
    });
    const action = chooseAction(viewFor(s, BLUE), weakFirst);
    assert.equal(action.type, "move");
    assert.ok(action.to.split(",")[0] > 0, `moved to ${action.to}, not towards yellow`);
  });
});
