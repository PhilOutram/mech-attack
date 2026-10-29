// Factories: upgrades, unused factories, capture by infantry, transporters and the win
// conditions that depend on factories.
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  applyAction, legalActions, viewFor, reachableHexes, attackTargets, buildSites, canUnload,
  dropSites, buildableTypes, newGame,
} from "../engine.js";
import { RULES } from "../rules-config.js";
import { distance } from "../hex.js";
import { scenario, testMap, testRules, TEST_RADIUS } from "./helpers.js";

const BLUE = 0;
const GREEN = 1;
const BLUE_FACTORY_HEX = "0,6";
const GREEN_FACTORY_HEX = "0,-6";
const MIDDLE = "0,0";
const UPGRADE_COST = RULES.factoryUpgrades.heavyWorks.cost;
const LAB_INCOME = RULES.factoryUpgrades.lab.income;
const STORE = RULES.capture.unusedFactoryCrystals;
// Infantry may go straight into a factory, without a turn next to it first.
const STRAIGHT_IN = { capture: { mustStartNextTo: false } };

const play = (state, ...actions) => actions.reduce((s, a) => applyAction(s, a), state);
const END = { type: "endTurn" };
const move = (unitId, to) => ({ type: "move", unitId, to });
const unit = (id, type, owner, at, extra = {}) => ({ id, type, owner, at, ...extra });
// An unused factory in the middle of the test board.
const unusedFactory = (at = MIDDLE, store = 0) =>
  unit("n", "factory", null, at, { upgrades: [], store });
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
    const airfield = RULES.factoryUpgrades.airfield.cost;
    let s = scenario({ playerCrystals: [airfield + UPGRADE_COST - 1, 100] });
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

describe("allowed units and upgrades", () => {
  test("only allowed units can be built and only allowed upgrades bought", () => {
    const s = scenario({
      playerCrystals: [300, 100],
      rules: { allowedUnits: ["scoutBike", "tank"], allowedUpgrades: ["heavyWorks"] },
    });
    const legal = legalActions(s);
    const built = new Set(legal.filter((a) => a.type === "build").map((a) => a.unitType));
    assert.deepEqual([...built].sort(), ["scoutBike", "tank"]);
    const upgrades = legal.filter((a) => a.type === "upgrade").map((a) => a.upgrade);
    assert.deepEqual(upgrades, ["heavyWorks"]);
    assert.throws(() => play(s, { type: "build", unitType: "lightHarvester", at: "0,5" }));
  });

  test("the units on offer are listed cheapest first", () => {
    const s = scenario();
    const costs = buildableTypes(s).map((type) => s.rules.units[type].cost);
    assert.deepEqual(costs, [...costs].sort((a, b) => a - b));
  });
});

describe("capturing factories", () => {
  test("infantry capture an unused factory by moving into it, and are used up", () => {
    let s = scenario({
      units: [unusedFactory(), unit("i", "infantry", BLUE, "0,2")], rules: STRAIGHT_IN,
    });
    assert.ok(MIDDLE in reachableHexes(viewFor(s, BLUE), "i"));
    s = play(s, move("i", MIDDLE));
    assert.equal(s.units.n.owner, BLUE);
    assert.equal(s.units.i, undefined);
    assert.ok(s.events.some((e) => e.type === "capture" && e.from === null && e.owner === BLUE));
  });

  test("an unused factory's store of crystals goes to whoever captures it", () => {
    let s = scenario({
      units: [unusedFactory(MIDDLE, STORE), unit("i", "infantry", BLUE, "0,1")],
    });
    s = play(s, move("i", MIDDLE));
    assert.equal(s.players[BLUE].crystals, 100 + STORE);
    assert.equal(s.units.n.store, 0);
  });

  test("unused factories on a map start with crystals in store", () => {
    const map = { ...testMap(), neutralFactories: [{ at: MIDDLE, pair: 0 }] };
    const s = newGame({ rules: testRules(), map });
    const factory = Object.values(s.units).find((u) => u.at === MIDDLE);
    assert.equal(factory.store, STORE);
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

  test("overrunning the enemy's home factory wins, if the rules allow it", () => {
    const units = [unit("i", "infantry", BLUE, "0,-5")];
    let s = scenario({ units, rules: { capture: { homeFactories: false } } });
    assert.ok(!(GREEN_FACTORY_HEX in reachableHexes(viewFor(s, BLUE), "i")));

    s = scenario({ units });
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

  test("infantry must start a turn next to a factory to break into it", () => {
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

  test("captured factories pay nothing each turn; a Crystal lab does", () => {
    let s = scenario({ units: [unusedFactory()] });
    s.units.n.owner = BLUE;
    s = play(s, END, END);
    assert.equal(s.players[BLUE].crystals, 100);
    s = play(s, { type: "upgrade", factoryId: "n", upgrade: "lab" });
    const paid = 100 - RULES.factoryUpgrades.lab.cost;
    assert.equal(s.players[BLUE].crystals, paid);
    s = play(s, END);
    assert.equal(s.players[BLUE].crystals, paid + LAB_INCOME);
    assert.ok(s.events.some((e) => e.type === "labIncome" && e.amount === LAB_INCOME));
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
      rules: STRAIGHT_IN,
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

describe("Chinook", () => {
  // A ridge of mountains right across the middle of the board.
  const ridge = {};
  for (let q = -TEST_RADIUS; q <= TEST_RADIUS; q++) ridge[`${q},0`] = "mountain";

  test("the Transporter carries only Infantry; the Chinook lifts a vehicle", () => {
    const s = scenario({
      units: [unit("t", "transporter", BLUE, "0,2", { cargo: [] }),
        unit("c", "chinook", BLUE, "2,2", { cargo: [] }), unit("k", "tank", BLUE, "1,2")],
    });
    const reach = reachableHexes(viewFor(s, BLUE), "k");
    assert.ok(!("0,2" in reach), "a tank cannot board the Transporter");
    assert.ok("2,2" in reach, "a tank can board the Chinook");
  });

  test("a Chinook carrying a vehicle has no room for Infantry", () => {
    const tank = unit("k", "tank", BLUE, null);
    const s = scenario({
      units: [unit("c", "chinook", BLUE, "2,2", { cargo: [tank] }),
        unit("i", "infantry", BLUE, "1,2")],
    });
    assert.ok(!("2,2" in reachableHexes(viewFor(s, BLUE), "i")));
  });

  test("a Chinook flies a tank over mountains and drops it off", () => {
    let s = scenario({
      terrain: ridge,
      units: [unit("c", "chinook", BLUE, "0,2", { cargo: [] }), unit("k", "tank", BLUE, "0,3")],
    });
    assert.ok(!("0,-2" in reachableHexes(viewFor(s, BLUE), "k")), "the ridge blocks the tank");
    s = play(s, move("k", "0,2"), move("c", "0,-2"));
    const sites = dropSites(viewFor(s, BLUE), "c");
    assert.ok(sites.length > 0);
    s = play(s, { type: "drop", unitId: "c", at: sites[0] });
    assert.equal(s.units.k.at, sites[0]);
    assert.ok(distance(sites[0], "0,-2") === 1);
  });
});

describe("Turret", () => {
  test("a turret is built next to a factory and never moves", () => {
    let s = scenario({ playerCrystals: [300, 100] });
    s = play(s, { type: "build", unitType: "turret", at: "0,5" });
    s = play(s, END, END);
    const turret = Object.values(s.units).find((u) => u.type === "turret");
    assert.deepEqual(reachableHexes(viewFor(s, BLUE), turret.id), {});
  });
});

describe("win conditions", () => {
  test("a player who starts without a factory is not beaten for having none", () => {
    const rules = testRules();
    const s = newGame({ rules, map: testMap(), setup: { units: [["tank"], ["tank"]],
      crystals: [0, 0], noHome: [true, false] } });
    assert.equal(s.players[BLUE].factoryId, null);
    const after = applyAction(s, END);
    assert.equal(after.result, null);
  });

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

describe("hitting air units", () => {
  test("Infantry hit air units as well as ground units; the Scout Bike hits ground only", () => {
    const s = scenario({
      units: [unit("i", "infantry", BLUE, "0,0"), unit("b", "scoutBike", BLUE, "1,0"),
        unit("h", "attackHelicopter", GREEN, "0,-1")],
    });
    assert.deepEqual(attackTargets(viewFor(s, BLUE), "i"), ["h"]);
    assert.deepEqual(attackTargets(viewFor(s, BLUE), "b"), []);
  });
});
