// Writes vision/tests/fixtures/hex-golden.json: hex centres from hex.js, which the vision
// service's Python hex maths is tested against, so the two languages always agree.
// Run from the repo root: node tools/hex-golden.mjs

import { writeFileSync } from "node:fs";
import { toPixel } from "../hex.js";

const cases = [];
for (const size of [1, 21.9393, 50]) {
  for (let q = -7; q <= 7; q++) {
    for (let r = -7; r <= 7; r++) cases.push({ q, r, size, at: toPixel(q, r, size) });
  }
}
writeFileSync("vision/tests/fixtures/hex-golden.json", `${JSON.stringify(cases)}\n`);
console.log(`vision/tests/fixtures/hex-golden.json: ${cases.length} cases`);
