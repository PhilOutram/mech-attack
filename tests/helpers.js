// Builds small custom positions for engine tests.
import { RULES } from "../rules-config.js";
import { newGame, refreshKnowledge } from "../engine.js";
import { key, clusterCentre, clusterHexes } from "../hex.js";

export const TEST_RADIUS = 6;
// Far enough out to cover every hex of the test board with clusters.
const CLUSTER_SPAN = TEST_RADIUS;

// A hexagonal all-plain board of radius TEST_RADIUS with factories at the top and bottom.
// Hexes are grouped into seven-hex clusters (blocks) named "i,j" as on a real map.
export function testMap(terrain = {}) {
  const hexes = {};
  for (let q = -TEST_RADIUS; q <= TEST_RADIUS; q++) {
    for (let r = -TEST_RADIUS; r <= TEST_RADIUS; r++) {
      if (Math.abs(q + r) > TEST_RADIUS) continue;
      const k = key(q, r);
      hexes[k] = { terrain: terrain[k] || "plain", cluster: null, slot: null };
    }
  }
  for (let i = -CLUSTER_SPAN; i <= CLUSTER_SPAN; i++) {
    for (let j = -CLUSTER_SPAN; j <= CLUSTER_SPAN; j++) {
      for (const [q, r] of clusterHexes(clusterCentre(i, j))) {
        if (hexes[key(q, r)]) hexes[key(q, r)].cluster = `${i},${j}`;
      }
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
  rules.crystals.spawnChoices = [0];
  for (const section in overrides) {
    const value = overrides[section];
    // Sections that are objects are merged; anything else (values, lists) is replaced.
    const merge = value && typeof value === "object" && !Array.isArray(value) &&
      rules[section] && typeof rules[section] === "object";
    if (merge) Object.assign(rules[section], value);
    else rules[section] = value;
  }
  return rules;
}

// units: [{ id, type, owner, at, ...extra }]. crystals: { key: pile fields }.
// Everything is explored (every block turned over) unless explored is false.
// Players start with 100 crystals so that a side with no units has not already lost.
export function scenario({
  terrain = {}, units = [], crystals = {}, rules = {}, playerCrystals = [100, 100],
  explored = true, seed = 1,
} = {}) {
  const state = newGame({ rules: testRules(rules), map: testMap(terrain), seed });
  // newGame has already turned over the blocks round the factories; start from scratch.
  state.players.forEach((player) => {
    player.revealed = {};
    player.explored = {};
    player.seenCrystals = {};
    player.seenFactories = {};
  });
  for (const u of units) {
    state.units[u.id] = {
      lives: state.rules.lives, moved: false, acted: false, setUp: false, carrying: 0, ...u,
    };
  }
  for (const k in crystals) {
    state.crystals[k] = { harvestedThisTurn: false, ...crystals[k] };
  }
  state.players.forEach((player, p) => {
    player.crystals = playerCrystals[p];
    if (!explored) return;
    for (const k in state.map.hexes) {
      player.explored[k] = true;
      player.revealed[state.map.hexes[k].cluster] = true;
    }
  });
  refreshKnowledge(state);
  return state;
}
