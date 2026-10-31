// The Crystal Seeder and unloading at an ally's factory (Phil, 31 October 2026).
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  applyAction, legalActions, viewFor, seedLoads, plantSites, unloadFactories, canUnload,
} from "../engine.js";
import { chooseAction, DEFAULT_PERSONALITY } from "../ai.js";
import { distance } from "../hex.js";
import { scenario } from "./helpers.js";

const BLUE = 0;
const GREEN = 1;
const YELLOW = 2;
const END = { type: "endTurn" };
const SEEDS = 30;
const SEED_AMOUNT = 10;
// A hex next to blue's factory (0,6), and one in the middle of the board.
const BY_BLUE_FACTORY = "0,5";
const MIDDLE = "0,0";

const play = (state, ...actions) => actions.reduce((s, a) => applyAction(s, a), state);
const unit = (id, type, owner, at, extra = {}) => ({ id, type, owner, at, ...extra });
const as = (player, action) => ({ ...action, player });
const seeder = (at, seeds) => unit("c", "crystalSeeder", BLUE, at, { seeds });

describe("the Crystal Seeder", () => {
  test("it is built empty", () => {
    let s = scenario({ playerCrystals: [200, 100] });
    s = play(s, { type: "build", unitType: "crystalSeeder", at: BY_BLUE_FACTORY });
    const built = Object.values(s.units).find((u) => u.type === "crystalSeeder");
    assert.equal(built.seeds, 0);
  });

  test("next to its own factory it loads crystals from the store, without using its turn", () => {
    let s = scenario({ units: [seeder(BY_BLUE_FACTORY, 0)] });
    assert.deepEqual(seedLoads(viewFor(s, BLUE), "c"), [10, 20, 30]);
    s = play(s, { type: "loadSeeds", unitId: "c", amount: SEEDS });
    assert.equal(s.players[BLUE].crystals, 100 - SEEDS);
    assert.equal(s.units.c.seeds, SEEDS);
    assert.equal(s.units.c.acted, false);
    assert.equal(s.units.c.moved, false, "it can still move");
  });

  test("what it can load is limited by its space and by the store", () => {
    const part = scenario({ units: [seeder(BY_BLUE_FACTORY, 20)] });
    assert.deepEqual(seedLoads(viewFor(part, BLUE), "c"), [10]);
    const poor = scenario({ units: [seeder(BY_BLUE_FACTORY, 0)], playerCrystals: [25, 100] });
    assert.deepEqual(seedLoads(viewFor(poor, BLUE), "c"), [10, 20]);
    const away = scenario({ units: [seeder(MIDDLE, 0)] });
    assert.deepEqual(seedLoads(viewFor(away, BLUE), "c"), []);
    assert.throws(() => play(away, { type: "loadSeeds", unitId: "c", amount: SEED_AMOUNT }),
      /cannot load/);
  });

  test("it plants a pile next to it, which uses its action", () => {
    let s = scenario({ units: [seeder(MIDDLE, SEEDS)] });
    assert.equal(plantSites(viewFor(s, BLUE), "c").length, 6);
    s = play(s, { type: "plant", unitId: "c", at: "1,0" });
    assert.equal(s.crystals["1,0"].amount, SEED_AMOUNT);
    assert.equal(s.units.c.seeds, SEEDS - SEED_AMOUNT);
    assert.equal(s.units.c.acted, true);
    assert.deepEqual(plantSites(viewFor(s, BLUE), "c"), [], "one pile a turn");
  });

  test("it plants anywhere next to it that is open and free of units", () => {
    const s = scenario({
      units: [seeder("0,4", SEEDS), unit("t", "tank", BLUE, "1,3")],
      crystals: { "-1,4": { amount: 20 }, "-1,5": { amount: 75 } },
    });
    const sites = plantSites(viewFor(s, BLUE), "c");
    assert.ok(sites.includes("0,5"), "next to blue's factory");
    assert.ok(sites.includes("-1,4"), "a pile with room for 10 more");
    assert.ok(!sites.includes("-1,5"), "no room below the explode level");
    assert.ok(!sites.includes("1,3"), "a unit is there");
  });

  test("planting on a pile adds to it", () => {
    let s = scenario({ units: [seeder(MIDDLE, SEEDS)], crystals: { "1,0": { amount: 20 } } });
    s = play(s, { type: "plant", unitId: "c", at: "1,0" });
    assert.equal(s.crystals["1,0"].amount, 20 + SEED_AMOUNT);
  });

  test("an empty Seeder cannot plant", () => {
    const s = scenario({ units: [seeder(MIDDLE, 0)] });
    assert.deepEqual(plantSites(viewFor(s, BLUE), "c"), []);
  });

  test("a planted pile first grows after the next turn", () => {
    let s = scenario({ units: [seeder(MIDDLE, SEEDS)] });
    s = play(s, { type: "plant", unitId: "c", at: "1,0" }, END);
    assert.equal(s.crystals["1,0"].amount, SEED_AMOUNT);
    s = play(s, END);
    assert.equal(s.crystals["1,0"].amount, SEED_AMOUNT + s.rules.crystals.growthPerTurn);
  });

  test("the AI fills an empty Seeder at home and plants with a full one", () => {
    const home = scenario({ units: [seeder(BY_BLUE_FACTORY, 0)] });
    assert.deepEqual(chooseAction(viewFor(home, BLUE), DEFAULT_PERSONALITY),
      { type: "loadSeeds", unitId: "c", amount: SEEDS });
    const out = scenario({ units: [seeder(MIDDLE, SEEDS)] });
    const action = chooseAction(viewFor(out, BLUE), DEFAULT_PERSONALITY);
    assert.equal(action.type, "plant");
  });

  test("the AI does not plant next to its own factory, where a pile would block building", () => {
    const s = scenario({ units: [seeder(BY_BLUE_FACTORY, SEEDS)] });
    const action = chooseAction(viewFor(s, BLUE), DEFAULT_PERSONALITY);
    assert.equal(action.type, "plant");
    assert.ok(distance(action.at, "0,6") > 1);
  });
});

describe("unloading at an ally's factory", () => {
  // Blue and green are allies against yellow. Green's factory is at 0,-6, yellow's at 6,0.
  const sides = [{ team: 0 }, { team: 0 }, { team: 1 }];
  const phases = [[BLUE, GREEN], [YELLOW]];
  const allied = (at) => scenario({
    sides, phases, units: [unit("h", "lightHarvester", BLUE, at, { carrying: 40 })],
  });

  test("the crystals go to the ally", () => {
    let s = allied("0,-5");
    const greenFactory = s.players[GREEN].factoryId;
    assert.deepEqual(unloadFactories(viewFor(s, BLUE), "h"), [greenFactory]);
    assert.equal(canUnload(viewFor(s, BLUE), "h"), false, "not at its own factory");
    assert.ok(legalActions(s, BLUE).some((a) => a.type === "unload" &&
      a.factoryId === greenFactory));
    const before = s.players.map((p) => p.crystals);
    s = play(s, as(BLUE, { type: "unload", unitId: "h", factoryId: greenFactory }));
    assert.equal(s.players[GREEN].crystals, before[GREEN] + 40);
    assert.equal(s.players[BLUE].crystals, before[BLUE]);
    assert.equal(s.units.h.carrying, 0);
    assert.equal(s.units.h.acted, true, "giving uses the unit's action");
  });

  test("it never happens by itself", () => {
    let s = allied("0,-5");
    s = play(s, as(BLUE, END), as(GREEN, END));
    assert.equal(s.units.h.carrying, 40);
  });

  test("not at an enemy's factory", () => {
    const s = allied("5,0");
    assert.deepEqual(unloadFactories(viewFor(s, BLUE), "h"), []);
  });
});
