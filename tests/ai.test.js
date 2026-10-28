import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { RULES } from "../rules-config.js";
import { FIXED_MAP_1, buildMap } from "../maps.js";
import { newGame, applyAction, legalActions, viewFor } from "../engine.js";
import { chooseAction, playTurn } from "../ai.js";
import { scenario } from "./helpers.js";

const BLUE = 0;
const GREEN = 1;
const GAMES_TO_CHECK = 4;
const unit = (id, type, owner, at, extra = {}) => ({ id, type, owner, at, ...extra });
const choose = (state) => chooseAction(viewFor(state, state.current));

describe("AI against itself", () => {
  test("every action it picks is legal and every game finishes", () => {
    const map = buildMap(FIXED_MAP_1);
    for (let seed = 1; seed <= GAMES_TO_CHECK; seed++) {
      let s = newGame({ rules: RULES, map, seed, firstPlayer: seed % 2, recordActions: false });
      while (!s.result) {
        const action = choose(s);
        const legal = legalActions(s).some((a) => JSON.stringify(a) === JSON.stringify(action));
        assert.ok(legal, `seed ${seed}: ${JSON.stringify(action)} is not a legal action`);
        s = applyAction(s, action);
      }
    }
  });

  test("playTurn ends the turn", () => {
    const s = newGame({ rules: RULES, map: buildMap(FIXED_MAP_1), seed: 1 });
    assert.equal(playTurn(s).current, GREEN);
  });
});

describe("AI choices", () => {
  test("it takes a kill when one is on offer", () => {
    const s = scenario({
      units: [unit("a", "heavyCannon", BLUE, "0,0"), unit("e", "scoutBike", GREEN, "0,-2")],
    });
    assert.deepEqual(choose(s), { type: "attack", unitId: "a", targetId: "e" });
  });

  test("it does not make an attack that only gets its own unit destroyed", () => {
    const s = scenario({
      units: [unit("a", "scoutBike", BLUE, "0,0"), unit("e", "tank", GREEN, "0,-1")],
    });
    assert.notEqual(choose(s).type, "attack");
  });

  test("it starts a combined attack that only works with a second unit", () => {
    const s = scenario({
      units: [
        unit("a", "tank", BLUE, "0,0"), unit("b", "tank", BLUE, "1,-1"),
        unit("e", "heavyCannon", GREEN, "0,-2"),
      ],
    });
    let next = applyAction(s, choose(s));
    assert.equal(next.events[0].type, "fire");
    next = applyAction(next, choose(next));
    assert.equal(next.units.e.lives, 1);
  });

  test("it harvests a pile next to a harvester", () => {
    const s = scenario({
      units: [unit("h", "lightHarvester", BLUE, "0,0")], crystals: { "0,-1": { amount: 40 } },
    });
    assert.deepEqual(choose(s), { type: "harvest", unitId: "h", at: "0,-1" });
  });

  test("it unloads a carrying harvester next to its factory", () => {
    const s = scenario({ units: [unit("h", "lightHarvester", BLUE, "0,5", { carrying: 60 })] });
    assert.deepEqual(choose(s), { type: "unload", unitId: "h" });
  });

  test("it builds a harvester first when it has none", () => {
    const s = scenario({ units: [unit("t", "tank", BLUE, "0,0")], playerCrystals: [100, 100] });
    const action = choose(s);
    assert.equal(action.type, "build");
    assert.equal(action.unitType, "lightHarvester");
  });

  test("with no units and no income it buys the cheapest unit that can carry crystals", () => {
    const s = scenario({ units: [unit("e", "tank", GREEN, "0,-3")], playerCrystals: [30, 0] });
    const action = choose(s);
    assert.equal(action.type, "build");
    assert.equal(action.unitType, "scoutBike");
  });

  test("artillery sets up when it can see a target in range", () => {
    const s = scenario({
      units: [
        unit("r", "artillery", BLUE, "0,0"), unit("s", "scoutBike", BLUE, "0,-2"),
        unit("e", "tank", GREEN, "0,-4"),
      ],
      playerCrystals: [0, 0],
    });
    assert.deepEqual(choose(s), { type: "setUp", unitId: "r" });
  });

  test("it plays the same whether or not a hidden enemy is there", () => {
    const own = [unit("t", "tank", BLUE, "0,2"), unit("h", "lightHarvester", BLUE, "1,3")];
    const sightFog = { fog: { mode: "sight" } };
    const withHidden = scenario({
      units: [...own, unit("e", "scoutBike", GREEN, "0,-4")], rules: sightFog,
    });
    const without = scenario({ units: own, rules: sightFog });
    assert.equal(viewFor(withHidden, BLUE).units.e, undefined);
    assert.deepEqual(choose(withHidden), choose(without));
  });
});
