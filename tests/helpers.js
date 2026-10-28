// Builds small custom positions for engine tests.
import { RULES } from "../rules-config.js";
import { newGame, refreshKnowledge } from "../engine.js";
import { key } from "../hex.js";

export const TEST_RADIUS = 6;

// A hexagonal all-plain board of radius TEST_RADIUS with factories at the top and bottom.
export function testMap(terrain = {}) {
  const hexes = {};
  for (let q = -TEST_RADIUS; q <= TEST_RADIUS; q++) {
    for (let r = -TEST_RADIUS; r <= TEST_RADIUS; r++) {
      if (Math.abs(q + r) > TEST_RADIUS) continue;
      const k = key(q, r);
      hexes[k] = { terrain: terrain[k] || "plain", cluster: null };
    }
  }
  return {
    id: "test",
    name: "Test board",
    hexes,
    factories: [key(0, TEST_RADIUS), key(0, -TEST_RADIUS)],
    starts: [[], []],
    deposits: [],
  };
}

export function testRules(overrides = {}) {
  const rules = structuredClone(RULES);
  rules.start.units = [];
  rules.crystals.spawnPerRound = 0;
  for (const section in overrides) Object.assign(rules[section], overrides[section]);
  return rules;
}

// units: [{ id, type, owner, at, ...extra }]. crystals: { key: pile fields }.
// Everything is explored for both players unless explored is false.
// Players start with 100 crystals so that a side with no units has not already lost.
export function scenario({
  terrain = {}, units = [], crystals = {}, rules = {}, playerCrystals = [100, 100],
  explored = true, seed = 1,
} = {}) {
  const state = newGame({ rules: testRules(rules), map: testMap(terrain), seed });
  for (const u of units) {
    state.units[u.id] = {
      lives: state.rules.lives, moved: false, acted: false, setUp: false, carrying: 0, ...u,
    };
  }
  for (const k in crystals) {
    state.crystals[k] = { kind: "spawn", perHarvest: null, harvestedThisRound: false,
      ...crystals[k] };
  }
  state.players.forEach((player, p) => {
    player.crystals = playerCrystals[p];
    if (explored) for (const k in state.map.hexes) player.explored[k] = true;
  });
  refreshKnowledge(state);
  return state;
}
