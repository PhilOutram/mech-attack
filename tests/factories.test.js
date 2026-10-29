// Factories: upgrades, unused factories, capture by infantry, transporters and the win
// conditions that depend on factories.
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  applyAction, legalActions, viewFor, reachableHexes, attackTargets, buildSites, canUnload,
  dropSites,
} from "../engine.js";
import { distance } from "../hex.js";
import { scenario } from "./helpers.js";

const BLUE = 0;
const GREEN = 1;
const BLUE_FACTORY_HEX = "0,6";
const GREEN_FACTORY_HEX = "0,-6";
const MIDDLE = "0,0";
const UPGRADE_COST = 100;

const play = (state, ...actions) => actions.reduce((s, a) => applyAction(s, a), state);
const END = { type: "endTurn" };
const move = (unitId, to) => ({ type: "move", unitId, to });
const unit = (id, type, owner, at, extra = {}) => ({ id, type, owner, at, ...extra });
// An unused factory in the middle of the test board.
const unusedFactory = (at = MIDDLE) => unit("n", "factory", null, at, { upgrades: [] });
const homeOf = (s, player) => s.players[player].factoryId;

describe("factory upgrades", () => {
  test("a unit that needs an upgrade cannot be built until a factory has it", () => {
    let s = scenario({ playerCrystals: [300, 100] });
    const builds = (state) => legalActions(state).filter((a) => a.type === "build");
    assert.ok(builds(s).some((a) => a.unitType === "tank"));
    assert.ok(!builds(s).some((a) => a.unitType === "heavyCannon"));
    assert.ok(!builds(s).some((a) => a.unitType === "attackHelicopter"));

    s = play(s, { type: "upgrade", factoryId: homeOf(s, BLUE), upgrade: "heavyWorks" });
    assert.equal(s.players[BLUE].crystals, 300 - UPGRADE_COST);
    assert.deepEqual(s.units[homeOf(s, BLUE)].upgrades, ["heavyWorks"]);
    assert.ok(builds(s).some((a) => a.unitType === "heavyCannon"));
    assert.ok(!builds(s).some((a) => a.unitType === "attackHelicopter"));
  });

  test("an upgrade cannot be bought twice or without the crystals", () => {
    let s = scenario({ playerCrystals: [150, 100] });
    const upgrade = { type: "upgrade", factoryId: homeOf(s, BLUE), upgrade: "airfield" };
    s = play(s, upgrade);
    assert.throws(() => play(s, upgrade), /Illegal/);
    assert.throws(() => play(s, { ...upgrade, upgrade: "heavyWorks" }), /not enough/);
  });

  test("each factory is upgraded on its own", () => {
    let s = scenario({ units: [unusedFactory()], playerCrystals: [300, 100] });
    s.units.n.owner = BLUE;
    s = play(s, { type: "upgrade", factoryId: homeOf(s, BLUE), upgrade: "heavyWorks" });
    const sites = buildSites(viewFor(s, BLUE), BLUE, "heavyCannon");
    assert.ok(sites.length > 0);
    assert.ok(sites.every((k) => distance(k, BLUE_FACTORY_HEX) === 1));
    const tankSites = buildSites(viewFor(s, BLUE), BLUE, "tank");
    assert.ok(tankSites.some((k) => distance(k, MIDDLE) === 1));
  });
});

describe("capturing factories", () => {
  test("infantry capture an unused factory by moving into it, and are used up", () => {
    let s = scenario({ units: [unusedFactory(), unit("i", "infantry", BLUE, "0,2")] });
    assert.ok(MIDDLE in reachableHexes(viewFor(s, BLUE), "i"));
    s = play(s, move("i", MIDDLE));
    assert.equal(s.units.n.owner, BLUE);
    assert.equal(s.units.i, undefined);
    assert.ok(s.events.some((e) => e.type === "capture" && e.from === null && e.owner === BLUE));
  });

  test("only infantry can capture", () => {
    const s = scenario({ units: [unusedFactory(), unit("t", "tank", BLUE, "0,1")] });
    assert.ok(!(MIDDLE in reachableHexes(viewFor(s, BLUE), "t")));
  });

  test("unused factories cannot be attacked", () => {
    const s = scenario({ units: [unusedFactory(), unit("t", "tank", BLUE, "0,1")] });
    assert.deepEqual(attackTargets(viewFor(s, BLUE), "t"), []);
  });

  test("a captured factory can be captured back", () => {
    let s = scenario({
      units: [unusedFactory(), unit("i", "infantry", BLUE, "0,1"),
        unit("g", "infantry", GREEN, "0,-1")],
    });
    s = play(s, move("i", MIDDLE), END, move("g", MIDDLE));
    assert.equal(s.units.n.owner, GREEN);
  });

  test("home factories can be captured only if the rules allow it; that wins", () => {
    const units = [unit("i", "infantry", BLUE, "0,-5")];
    let s = scenario({ units });
    assert.ok(!(GREEN_FACTORY_HEX in reachableHexes(viewFor(s, BLUE), "i")));

    s = scenario({ units, rules: { capture: { homeFactories: true } } });
    s = play(s, move("i", GREEN_FACTORY_HEX));
    assert.equal(s.result.winner, BLUE);
    assert.equal(s.result.reason, "factoryCaptured");
  });

  test("with capture.guarded, a defender next to a factory stops its capture", () => {
    const rules = { capture: { guarded: true } };
    const units = [unusedFactory(), unit("i", "infantry", GREEN, "0,-1")];
    let s = scenario({ units: [...units, unit("d", "tank", BLUE, "1,0")], rules });
    s.units.n.owner = BLUE;
    s = play(s, END);
    assert.ok(!(MIDDLE in reachableHexes(viewFor(s, GREEN), "i")));
    s = scenario({ units, rules });
    s.units.n.owner = BLUE;
    s = play(s, END);
    assert.ok(MIDDLE in reachableHexes(viewFor(s, GREEN), "i"));
  });

  test("with capture.mustStartNextTo, infantry capture only from where they started", () => {
    const rules = { capture: { mustStartNextTo: true } };
    let s = scenario({ units: [unusedFactory(), unit("i", "infantry", BLUE, "0,2")], rules });
    assert.ok(!(MIDDLE in reachableHexes(viewFor(s, BLUE), "i")));
    s = play(s, move("i", "0,1"), END, END);
    assert.ok(MIDDLE in reachableHexes(viewFor(s, BLUE), "i"));
    const passenger = unit("p", "infantry", BLUE, null);
    s = scenario({
      units: [unusedFactory(), unit("t", "transporter", BLUE, "0,1", { cargo: [passenger] })],
      rules,
    });
    assert.ok(!dropSites(viewFor(s, BLUE), "t").includes(MIDDLE));
  });

  test("with capture.incomePerTurn, each captured factory pays its owner every turn", () => {
    let s = scenario({ units: [unusedFactory()], rules: { capture: { incomePerTurn: 10 } } });
    s = play(s, END);
    assert.equal(s.players[BLUE].crystals, 100);
    s.units.n.owner = BLUE;
    s = play(s, END, END);
    assert.equal(s.players[BLUE].crystals, 100 + 10);
  });

  test("crystals can be unloaded at a captured factory", () => {
    let s = scenario({
      units: [unusedFactory(), unit("h", "lightHarvester", BLUE, "0,1", { carrying: 30 })],
    });
    s.units.n.owner = BLUE;
    assert.ok(canUnload(viewFor(s, BLUE), "h"));
    s = play(s, END);
    assert.equal(s.players[BLUE].crystals, 100 + 30);
  });
});

describe("transporters", () => {
  test("infantry board by moving onto a transporter, then are dropped off next to it", () => {
    let s = scenario({
      units: [unit("t", "transporter", BLUE, "0,3", { cargo: [] }),
        unit("i", "infantry", BLUE, "0,4")],
    });
    s = play(s, move("i", "0,3"));
    assert.equal(s.units.i, undefined);
    assert.deepEqual(s.units.t.cargo.map((c) => c.id), ["i"]);
    s = play(s, move("t", "1,0"));
    const sites = dropSites(viewFor(s, BLUE), "t");
    assert.ok(sites.length > 0 && sites.every((k) => distance(k, "1,0") === 1));
    s = play(s, { type: "drop", unitId: "t", at: sites[0] });
    assert.equal(s.units.i.at, sites[0]);
    assert.equal(s.units.t.cargo.length, 0);
    assert.ok(s.units.i.moved && s.units.i.acted);
  });

  test("a transporter can drop infantry straight into a factory to capture it", () => {
    const passenger = unit("i", "infantry", BLUE, null, { moved: false, acted: false });
    let s = scenario({
      units: [unusedFactory(), unit("t", "transporter", BLUE, "0,1", { cargo: [passenger] })],
    });
    assert.ok(dropSites(viewFor(s, BLUE), "t").includes(MIDDLE));
    s = play(s, { type: "drop", unitId: "t", at: MIDDLE });
    assert.equal(s.units.n.owner, BLUE);
    assert.equal(s.units.i, undefined);
  });

  test("a full transporter cannot be boarded", () => {
    const full = [unit("a", "infantry", BLUE, null), unit("b", "infantry", BLUE, null)];
    const s = scenario({
      units: [unit("t", "transporter", BLUE, "0,3", { cargo: full }),
        unit("i", "infantry", BLUE, "0,4")],
    });
    assert.ok(!("0,3" in reachableHexes(viewFor(s, BLUE), "i")));
  });

  test("infantry inside a destroyed transporter are lost with it", () => {
    const passenger = unit("i", "infantry", BLUE, null);
    let s = scenario({
      units: [unit("t", "transporter", GREEN, "0,-2", { cargo: [passenger], lives: 1 }),
        unit("h", "heavyCannon", BLUE, "0,0")],
    });
    s = play(s, { type: "attack", unitId: "h", targetId: "t" });
    const lost = s.events.filter((e) => e.type === "destroyed").map((e) => e.unitId);
    assert.deepEqual(lost.sort(), ["i", "t"]);
  });
});

describe("win conditions", () => {
  const withoutBlueHome = (rules) => {
    const s = scenario({ units: [unusedFactory(), unit("b", "tank", BLUE, "1,1")], rules });
    s.units.n.owner = BLUE;
    delete s.units[homeOf(s, BLUE)];
    return play(s, END);
  };

  test("by default, losing the home factory loses the game", () => {
    const s = withoutBlueHome({});
    assert.equal(s.result.winner, GREEN);
    assert.equal(s.result.reason, "factoryDestroyed");
  });

  test("with win condition allFactories, a captured factory keeps a player in the game", () => {
    const s = withoutBlueHome({ winCondition: "allFactories" });
    assert.equal(s.result, null);
  });
});

describe("the Scout Bike", () => {
  test("hits air units as well as ground units", () => {
    const s = scenario({
      units: [unit("b", "scoutBike", BLUE, "0,0"), unit("h", "attackHelicopter", GREEN, "0,-1")],
    });
    assert.deepEqual(attackTargets(viewFor(s, BLUE), "b"), ["h"]);
  });
});
