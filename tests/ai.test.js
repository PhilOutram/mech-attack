import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { RULES } from "../rules-config.js";
import { FIXED_MAP_1, buildMap, mapById, seededRandom } from "../maps.js";
import { newGame, applyAction, legalActions, viewFor } from "../engine.js";
import {
  chooseAction, playTurn, playout, randomPersonality, mutatePersonality, crossPersonalities,
  DEFAULT_PERSONALITY, PERSONALITY_RANGES,
} from "../ai.js";
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

describe("AI and factories", () => {
  test("infantry move into an unused factory they can reach", () => {
    const s = scenario({
      units: [unit("n", "factory", null, "0,0", { upgrades: [] }),
        unit("i", "infantry", BLUE, "0,2")],
      playerCrystals: [0, 100],
    });
    assert.deepEqual(choose(s), { type: "move", unitId: "i", to: "0,0" });
  });

  test("it buys the factory upgrade its wanted unit needs", () => {
    const personality = {
      ...DEFAULT_PERSONALITY, harvestersEarly: 1,
      mix: Object.fromEntries(Object.keys(DEFAULT_PERSONALITY.mix).map((type) =>
        [type, type === "heavyCannon" ? 1 : 0])),
    };
    const s = scenario({
      units: [unit("h", "lightHarvester", BLUE, "3,0")], playerCrystals: [250, 100],
    });
    assert.deepEqual(chooseAction(viewFor(s, BLUE), personality), {
      type: "upgrade", factoryId: s.players[BLUE].factoryId, upgrade: "heavyWorks",
    });
  });

  test("every action it picks is legal on a map with unused factories", () => {
    const map = mapById("map-3-3-4-4-3", RULES);
    let s = newGame({ rules: RULES, map, seed: 3, recordActions: false });
    while (!s.result) {
      const action = choose(s);
      const legal = legalActions(s).some((a) => JSON.stringify(a) === JSON.stringify(action));
      assert.ok(legal, `${JSON.stringify(action)} is not a legal action`);
      s = applyAction(s, action);
    }
  });
});

describe("personalities", () => {
  const inRange = (p) => {
    for (const gene in PERSONALITY_RANGES) {
      const [low, high, whole] = PERSONALITY_RANGES[gene];
      assert.ok(p[gene] >= low && p[gene] <= high, `${gene} ${p[gene]}`);
      if (whole) assert.equal(p[gene], Math.round(p[gene]));
    }
    for (const type in p.mix) assert.ok(p.mix[type] >= 0 && p.mix[type] <= 1);
    assert.ok(p.harvestersMax >= p.harvestersEarly);
  };

  test("random, mutated and crossed personalities keep every gene in range", () => {
    const random = seededRandom(9);
    for (let i = 0; i < 20; i++) {
      const a = randomPersonality(random);
      const b = mutatePersonality(a, random, 1);
      inRange(a);
      inRange(b);
      inRange(crossPersonalities(a, b, random));
    }
  });

  test("a playout scores the position between 0 and 1", () => {
    const s = newGame({ rules: RULES, map: buildMap(FIXED_MAP_1), seed: 4 });
    const score = playout(s, GREEN, [DEFAULT_PERSONALITY, DEFAULT_PERSONALITY], seededRandom(2));
    assert.ok(score >= 0 && score <= 1);
  });
});
