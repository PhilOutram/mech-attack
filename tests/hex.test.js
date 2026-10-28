import { test } from "node:test";
import assert from "node:assert/strict";
import {
  key, distance, neighbours, line, lineOfSight, cheapestPaths, pathTo, clusterCentre,
  clusterHexes,
} from "../hex.js";

test("distance counts hex steps", () => {
  assert.equal(distance([0, 0], [0, 0]), 0);
  assert.equal(distance([0, 0], [3, 0]), 3);
  assert.equal(distance([0, 0], [2, -3]), 3);
  assert.equal(distance("1,1", "-2,3"), 3);
});

test("every neighbour is one step away", () => {
  for (const n of neighbours(2, -1)) assert.equal(distance([2, -1], n), 1);
});

test("a line runs through one hex per step", () => {
  const hexes = line([0, 0], [3, -1]);
  assert.equal(hexes.length, 4);
  hexes.slice(1).forEach((h, i) => assert.equal(distance(hexes[i], h), 1));
});

test("line of sight is blocked only by hexes between the two ends", () => {
  const wall = new Set([key(0, -1)]);
  const blocks = (k) => wall.has(k);
  assert.equal(lineOfSight([0, 0], [0, -2], blocks), false);
  assert.equal(lineOfSight([0, 0], [0, -1], blocks), true);
  assert.equal(lineOfSight([0, -1], [0, -3], blocks), true);
});

test("cheapest paths add up entry costs and stop at the limit", () => {
  const costOf = (k) => (k === key(1, 0) ? 3 : k === key(0, 1) ? null : 1);
  const paths = cheapestPaths(key(0, 0), costOf, 2);
  assert.equal(paths[key(1, -1)].cost, 1);
  assert.equal(paths[key(1, 0)], undefined);
  assert.equal(paths[key(0, 1)], undefined);
  assert.deepEqual(pathTo(paths, key(2, -2)), [key(1, -1), key(2, -2)]);
});

test("seven-hex clusters tile the plane with no gaps or overlaps", () => {
  const owner = {};
  for (let i = -4; i <= 4; i++) {
    for (let j = -4; j <= 4; j++) {
      for (const [q, r] of clusterHexes(clusterCentre(i, j))) {
        const k = key(q, r);
        assert.equal(owner[k], undefined, `hex ${k} is in two clusters`);
        owner[k] = `${i},${j}`;
      }
    }
  }
  for (let q = -3; q <= 3; q++) {
    for (let r = -3; r <= 3; r++) assert.ok(owner[key(q, r)], `hex ${q},${r} is in no cluster`);
  }
});
