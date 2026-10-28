import { test } from "node:test";
import assert from "node:assert/strict";
import { FIXED_MAP_1, buildMap } from "../maps.js";
import { RULES } from "../rules-config.js";
import { cheapestPaths, distance } from "../hex.js";

const map = buildMap(FIXED_MAP_1);
const [BLUE_FACTORY, GREEN_FACTORY] = map.factories;
const depositAt = new Set(map.deposits.map((d) => d.at));

function costOf(k) {
  if (!map.hexes[k] || depositAt.has(k)) return null;
  return RULES.terrain[map.hexes[k].terrain].moveCost;
}

// Path cost from a factory to a hex; deposits block movement, so measure to a neighbour.
function costTo(from, target) {
  const paths = cheapestPaths(from, costOf);
  if (paths[target]) return paths[target].cost;
  const costs = Object.keys(paths)
    .filter((k) => distance(k, target) === 1)
    .map((k) => paths[k].cost);
  return Math.min(...costs) + 1;
}

test("fixed map 1 has 12 clusters and 84 distinct hexes", () => {
  assert.equal(FIXED_MAP_1.clusters.length, 12);
  assert.equal(Object.keys(map.hexes).length, 12 * 7);
});

test("every open hex can be reached from both factories", () => {
  for (const factory of map.factories) {
    const paths = cheapestPaths(factory, costOf);
    for (const k in map.hexes) {
      if (costOf(k) !== null) assert.ok(paths[k], `${k} cannot be reached from ${factory}`);
    }
  }
});

test("factories, starts and deposits are on open, separate hexes", () => {
  const used = [...map.factories, ...map.starts.flat(), ...depositAt];
  assert.equal(new Set(used).size, used.length);
  for (const k of used) {
    const terrain = map.hexes[k] && map.hexes[k].terrain;
    assert.ok(terrain === "plain" || terrain === "rocky", `${k} is ${terrain}`);
  }
  for (const p of [0, 1]) {
    assert.equal(map.starts[p].length, RULES.start.units.length);
    for (const k of map.starts[p]) assert.equal(distance(k, map.factories[p]), 1);
  }
});

test("both sides are the same distance from their own deposits and the enemy's", () => {
  const blue = (k) => costTo(BLUE_FACTORY, k);
  const green = (k) => costTo(GREEN_FACTORY, k);
  assert.equal(blue(GREEN_FACTORY), green(BLUE_FACTORY));
  for (const kind of ["crystals", "crystalBase"]) {
    const [a, b] = map.deposits.filter((d) => d.kind === kind).map((d) => d.at);
    assert.equal(blue(a), green(b), `${kind}: own distance differs`);
    assert.equal(green(a), blue(b), `${kind}: enemy distance differs`);
  }
  const cave = map.deposits.find((d) => d.kind === "crystalCave").at;
  assert.equal(blue(cave), green(cave));
});

test("the two halves are not copies of each other", () => {
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
