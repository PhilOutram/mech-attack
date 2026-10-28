import { test } from "node:test";
import assert from "node:assert/strict";
import {
  FIXED_MAP_1, buildMap, generateMap, mapProblems, mapById, MAP_SHAPES,
} from "../maps.js";
import { RULES } from "../rules-config.js";
import { distance } from "../hex.js";

const START_UNITS = RULES.start.units.length;
const GENERATED_TO_CHECK = 40;
const map = buildMap(FIXED_MAP_1);

function checkLayout(m) {
  const used = [...m.factories, ...m.neutralFactories.map((f) => f.at), ...m.starts.flat(),
    ...m.deposits.map((d) => d.at)];
  assert.equal(new Set(used).size, used.length, `${m.id}: two things share a hex`);
  for (const k of used) {
    const terrain = m.hexes[k] && m.hexes[k].terrain;
    assert.ok(terrain === "plain" || terrain === "rocky", `${m.id}: ${k} is ${terrain}`);
  }
  for (const p of [0, 1]) {
    assert.equal(m.starts[p].length, START_UNITS);
    for (const k of m.starts[p]) assert.equal(distance(k, m.factories[p]), 1);
  }
}

test("fixed map 1 has 12 clusters and 84 distinct hexes", () => {
  assert.equal(FIXED_MAP_1.clusters.length, 12);
  assert.equal(Object.keys(map.hexes).length, 12 * 7);
});

test("fixed map 1 passes the fairness checks", () => {
  assert.deepEqual(mapProblems(map, RULES.terrain), []);
  checkLayout(map);
});

test("the two halves of fixed map 1 are not copies of each other", () => {
  // Rotating a cluster's ring by half a turn maps N to S, NE to SW and so on.
  const opposite = { N: "S", NE: "SW", SE: "NW", S: "N", SW: "NE", NW: "SE" };
  const byId = Object.fromEntries(FIXED_MAP_1.clusters.map((c) => [c.id, c]));
  const pairs = [["A", "L"], ["B", "K"], ["C", "J"], ["D", "I"], ["F", "G"]];
  for (const [a, b] of pairs) {
    const rotated = Object.fromEntries(
      Object.entries(byId[a].ring).map(([dir, t]) => [opposite[dir], t]));
    assert.notDeepEqual(rotated, byId[b].ring, `${a} and ${b} are mirror copies`);
  }
});

test("the fairness checks catch an unfair map", () => {
  const unfair = structuredClone(map);
  unfair.deposits = unfair.deposits.map((d) =>
    d.pair === null ? { ...d, at: unfair.starts[0][0] } : d);
  const problems = mapProblems(unfair, RULES.terrain);
  assert.ok(problems.some((p) => p.endsWith("is nearer one side")), problems.join("; "));
});

test("generated maps are fair, playable and the same every time for a seed", () => {
  for (let seed = 1; seed <= GENERATED_TO_CHECK; seed++) {
    const m = generateMap(seed, RULES.terrain, START_UNITS);
    assert.deepEqual(mapProblems(m, RULES.terrain), [], `map ${seed}`);
    assert.equal(Object.keys(m.hexes).length, 12 * 7);
    checkLayout(m);
    assert.deepEqual(generateMap(seed, RULES.terrain, START_UNITS), m);
  }
});

test("different seeds give different maps", () => {
  const terrains = (m) => Object.values(m.hexes).map((h) => h.terrain).join();
  const a = generateMap(1, RULES.terrain, START_UNITS);
  const b = generateMap(2, RULES.terrain, START_UNITS);
  assert.notEqual(terrains(a), terrains(b));
});

test("maps can be looked up by id", () => {
  assert.equal(mapById("fixed-1", RULES).id, "fixed-1");
  assert.equal(mapById("map-17", RULES).name, "Map 17");
  assert.throws(() => mapById("map-0", RULES));
});

test("every map shape gives fair maps with its pairs of unused factories", () => {
  const SHAPED_TO_CHECK = 10;
  for (const shape in MAP_SHAPES) {
    const blocks = MAP_SHAPES[shape].rows
      ? MAP_SHAPES[shape].rows.reduce((sum, n) => sum + n, 0) : 12;
    for (let seed = 1; seed <= SHAPED_TO_CHECK; seed++) {
      const m = generateMap(seed, RULES.terrain, START_UNITS, shape);
      assert.deepEqual(mapProblems(m, RULES.terrain), [], `${m.id}`);
      assert.equal(Object.keys(m.hexes).length, blocks * 7, m.id);
      assert.equal(m.neutralFactories.length, 2 * MAP_SHAPES[shape].factoryPairs, m.id);
      checkLayout(m);
    }
  }
});

test("shaped maps are looked up by id and are the same every time", () => {
  const m = mapById("map-17-3-5-5-3", RULES);
  assert.equal(m.name, "Map 17 (3-5-5-3)");
  assert.deepEqual(mapById("map-17-3-5-5-3", RULES), m);
  assert.throws(() => mapById("map-17-2-2", RULES));
});

test("the fairness checks catch an unfair pair of unused factories", () => {
  const m = structuredClone(generateMap(1, RULES.terrain, START_UNITS, "3-4-4-3"));
  m.neutralFactories[1] = { ...m.neutralFactories[1], at: m.starts[0][0] };
  const problems = mapProblems(m, RULES.terrain);
  assert.ok(problems.some((p) => p.startsWith("unused factory pair")), problems.join("; "));
});
