// Writes camera/board.json: the board description the vision service needs for Fixed map 1.
// Run from the repo root: node tools/camera-board.mjs
//
// Anchors: five hexes spread across the map (the four extremes and one near the middle).
// For the calibration photo, put anchor disc 0 to 4 on these hexes, take the photo, then
// lift them off. flatToFlat_mm is provisional until the real tiles are measured.

import { writeFileSync } from "node:fs";
import { buildMap, FIXED_MAP_1 } from "../maps.js";
import { parseKey, toPixel } from "../hex.js";

const FLAT_TO_FLAT_MM = 38; // provisional: measure one hex on the printed tiles

const map = buildMap(FIXED_MAP_1);
const cells = Object.keys(map.hexes).sort();
const at = (k) => toPixel(...parseKey(k), 1);

const best = (score) => cells.reduce((a, b) => (score(at(b)) > score(at(a)) ? b : a));
const mean = cells.map(at).reduce(([sx, sy], [x, y]) => [sx + x, sy + y], [0, 0])
  .map((v) => v / cells.length);
const middle = best(([x, y]) => -Math.hypot(x - mean[0], y - mean[1]));

const anchors = [
  best(([x, y]) => -x - y), // top left
  best(([x, y]) => x - y), // top right
  best(([x, y]) => x + y), // bottom right
  best(([x, y]) => -x + y), // bottom left
  middle,
];
if (new Set(anchors).size !== anchors.length) throw new Error("Anchor hexes are not distinct");

const board = {
  game: "mech-attack",
  map: map.id,
  grid: { type: "hex-flat", flatToFlat_mm: FLAT_TO_FLAT_MM, provisional: true },
  cells,
  anchors: Object.fromEntries(anchors.map((k, i) => [String(i), k])),
  zones: {},
};

writeFileSync("camera/board.json", `${JSON.stringify(board, null, 2)}\n`);
console.log(`camera/board.json: ${cells.length} cells, anchors ${anchors.join("  ")}`);

// camera/anchor-map.svg: Fixed map 1 as laid out on the table, home factories marked, with
// the five anchor hexes numbered, so the anchor discs can be put on the right hexes.
const FILL = { plain: "#c8463c", rocky: "#a8382f", mountain: "#6e2a22", chasm: "#3a1410" };
const R = 40;
const corners = (k) => {
  const [cx, cy] = toPixel(...parseKey(k), R);
  return Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 3) * i;
    return `${(cx + R * Math.cos(a)).toFixed(1)},${(cy + R * Math.sin(a)).toFixed(1)}`;
  }).join(" ");
};
const xs = cells.map((k) => toPixel(...parseKey(k), R)[0]);
const ys = cells.map((k) => toPixel(...parseKey(k), R)[1]);
const pad = 60;
const [x0, y0] = [Math.min(...xs) - R - pad, Math.min(...ys) - R - pad];
const [w, h] = [Math.max(...xs) - x0 + R + pad, Math.max(...ys) - y0 + R + pad + 40];
let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${x0} ${y0} ${w} ${h}" ` +
  `font-family="sans-serif" text-anchor="middle">\n` +
  `<rect x="${x0}" y="${y0}" width="${w}" height="${h}" fill="#1b1b1f"/>\n`;
for (const k of cells) {
  svg += `<polygon points="${corners(k)}" fill="${FILL[map.hexes[k].terrain]}" ` +
    `stroke="#333" stroke-width="3"/>\n`;
}
map.factories.forEach((k, p) => {
  const [cx, cy] = toPixel(...parseKey(k), R);
  svg += `<text x="${cx}" y="${cy + 5}" font-size="14" fill="#fff">${p ? "Green" : "Blue"} home</text>\n`;
});
anchors.forEach((k, i) => {
  const [cx, cy] = toPixel(...parseKey(k), R);
  svg += `<circle cx="${cx}" cy="${cy}" r="24" fill="#fff" stroke="#000" stroke-width="3"/>\n` +
    `<text x="${cx}" y="${cy + 9}" font-size="26" font-weight="700">${i}</text>\n`;
});
svg += `<text x="${x0 + w / 2}" y="${y0 + h - 20}" font-size="18" fill="#ddd">` +
  `Fixed map 1: put anchor disc 0 to 4 on the numbered hexes for the calibration photo</text>\n`;
svg += "</svg>\n";
writeFileSync("camera/anchor-map.svg", svg);
console.log("camera/anchor-map.svg written");
