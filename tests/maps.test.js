import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import {
  FIXED_MAP_1, buildMap, generateMap, mapProblems, mapById, MAP_SHAPES, MULTI_SIDE_SHAPES,
  shapesForSides,
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
  for (const p of m.factories.keys()) {
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

test("players start in different places on different maps", () => {
  const SEEDS = 20;
  const starts = new Set();
  for (let seed = 1; seed <= SEEDS; seed++) {
    starts.add(generateMap(seed, RULES.terrain, START_UNITS, "4-5-5-4").factories.join(" "));
  }
  assert.ok(starts.size > 2, `only ${starts.size} start positions`);
});

// SHA-256 of the JSON of two-sided maps, taken before maps for more sides were added.
const TWO_SIDED_HASHES = {
  "map-7": "7acd5defa8274850b2d66125f9be7471f90a617aa442ca3211f00371a462417b",
  "map-5-3-4-4-3": "d1deebc1671f6637a1bb0920e9bac8623f5da975e20f530b37776a8309f07fb9",
  "map-12-4-5-5-4": "e476c5e3f7c9eed5670e2cab708e69b3ec4cdc13a0646aed1f70d60b4cecd79f",
  "map-9-5-6-6-5": "456e2a902482f25b9786c2cf2f3d56a879a55df6310945e8dbb0b83360bbed49",
};

test("two-sided maps are unchanged", () => {
  for (const id in TWO_SIDED_HASHES) {
    const json = JSON.stringify(mapById(id, RULES));
    assert.equal(createHash("sha256").update(json).digest("hex"), TWO_SIDED_HASHES[id], id);
  }
});

test("shapes are offered for the sides they have room for", () => {
  assert.deepEqual(shapesForSides(2), Object.keys(MAP_SHAPES));
  assert.deepEqual(shapesForSides(3), ["4-5-6-5-4", "4-5-6-7-6-5-4"]);
  assert.deepEqual(shapesForSides(4), ["4-5-6-5-4", "4-5-6-7-6-5-4"]);
  assert.deepEqual(shapesForSides(5), ["4-5-6-7-6-5-4"]);
  assert.deepEqual(shapesForSides(6), ["4-5-6-7-6-5-4"]);
  assert.deepEqual(shapesForSides(7), []);
  for (const shape in MULTI_SIDE_SHAPES) assert.ok(!MAP_SHAPES[shape], shape);
});

// Groups items by their pair number and returns the sizes of the groups.
function setSizes(items) {
  const sizes = {};
  for (const item of items) {
    if (item.pair !== null) sizes[item.pair] = (sizes[item.pair] || 0) + 1;
  }
  return Object.values(sizes);
}

test("maps for 3 to 6 sides are fair, playable and the same every time for a seed", () => {
  const SEEDS = 5;
  const MIN_PILE_SETS = 4;
  for (const sides of [3, 4, 5, 6]) {
    for (const shape of shapesForSides(sides)) {
      for (let seed = 1; seed <= SEEDS; seed++) {
        const m = generateMap(seed, RULES.terrain, START_UNITS, shape, sides);
        assert.equal(m.id, `map-${seed}-${shape}-${sides}p`);
        assert.deepEqual(mapProblems(m, RULES.terrain), [], m.id);
        assert.equal(m.factories.length, sides, m.id);
        assert.equal(new Set(m.factories).size, sides, m.id);
        assert.equal(m.starts.length, sides, m.id);
        checkLayout(m);
        assert.ok(m.neutralFactories.length > 0, m.id);
        for (const size of setSizes(m.neutralFactories)) assert.equal(size, sides, m.id);
        const pileSets = setSizes(m.deposits);
        assert.ok(pileSets.length >= MIN_PILE_SETS, m.id);
        for (const size of pileSets) assert.equal(size, sides, m.id);
        if (seed === 1) {
          assert.deepEqual(generateMap(seed, RULES.terrain, START_UNITS, shape, sides), m);
        }
      }
    }
  }
});

test("maps for more sides are looked up by id", () => {
  const m = mapById("map-17-4-5-6-5-4-3p", RULES);
  assert.equal(m.name, "Map 17 (4-5-6-5-4, 3 sides)");
  assert.equal(m.factories.length, 3);
  assert.deepEqual(mapById("map-17-4-5-6-5-4-3p", RULES), m);
  assert.equal(mapById("map-2-4-5-6-7-6-5-4-6p", RULES).factories.length, 6);
  assert.equal(mapById("map-17-4-5-6-5-4", RULES).factories.length, 2);
  for (const id of ["map-17-3p", "map-17-3-4-4-3-3p", "map-17-4-5-6-5-4-5p",
    "map-17-4-5-6-7-6-5-4", "map-17-4-5-6-7-6-5-4-7p", "map-17-4-5-6-5-4-2p"]) {
    assert.throws(() => mapById(id, RULES), id);
  }
});

test("homes on maps for more sides are not always in the same places", () => {
  const SEEDS = 10;
  const homes = new Set();
  for (let seed = 1; seed <= SEEDS; seed++) {
    const m = generateMap(seed, RULES.terrain, START_UNITS, "4-5-6-5-4", 3);
    homes.add([...m.factories].sort().join(" "));
  }
  assert.ok(homes.size > 2, `only ${homes.size} sets of homes`);
});

test("the fairness checks catch an unfair set on a map for more sides", () => {
  const m = structuredClone(generateMap(1, RULES.terrain, START_UNITS, "4-5-6-5-4", 4));
  const first = m.deposits.findIndex((d) => d.pair === 0);
  m.deposits[first] = { ...m.deposits[first], at: m.starts[1][0] };
  let problems = mapProblems(m, RULES.terrain);
  assert.ok(problems.includes("pile set 0 is unfair"), problems.join("; "));

  const hemmed = structuredClone(generateMap(1, RULES.terrain, START_UNITS, "4-5-6-5-4", 4));
  for (const k of hemmed.starts[2]) hemmed.hexes[k].terrain = "mountain";
  problems = mapProblems(hemmed, RULES.terrain);
  assert.ok(problems.some((p) => p.endsWith("is hemmed in")), problems.join("; "));
});
