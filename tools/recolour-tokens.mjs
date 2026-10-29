// Makes yellow and purple unit tokens from the blue and green ones.
// For each units/<unit>-blue.svg it finds the team colours by comparing the file with
// units/<unit>-green.svg: any colour used in the blue file but never in the green file belongs
// to the team. Each team colour is mapped to the same shade of the new base hue, keeping its
// lightness and saturation relative to the reference blue, so dark and light shades stay dark
// and light. Embedded PNG images (e.g. the Turret) are recoloured pixel by pixel wherever the
// blue and green images differ. Black, greys and outlines are left alone.
// Usage: node tools/recolour-tokens.mjs
import { readFileSync, readdirSync, writeFileSync, existsSync } from "node:fs";
import { inflateSync, deflateSync, crc32 } from "node:zlib";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const UNITS_DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "units");

// Phil's main team blue. Every blue shade is mapped relative to this one.
const REFERENCE_BLUE = "#0066cc";

// New player colours: the base colour each takes the place of REFERENCE_BLUE.
const TARGETS = {
  yellow: { base: "#e0b000", word: "YELLOW", title: "Yellow" },
  purple: { base: "#8a3ccf", word: "PURPLE", title: "Purple" },
};

const PNG_SIGNATURE   = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
const PNG_RGB         = 2;
const PNG_RGBA        = 6;
const PNG_BIT_DEPTH   = 8;
const PNG_ZLIB_LEVEL  = 9;
const HUE_TURN        = 360;

// Colour values in fill, stroke and gradient attributes, style attributes and <style> blocks.
const COLOUR_PROP  = /(?:fill|stroke|stop-color|flood-color|lighting-color|color)\s*[:=]\s*["']?/;
const COLOUR_VALUE = /#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b|rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)/;
const COLOUR_RE    = new RegExp(`(${COLOUR_PROP.source})(${COLOUR_VALUE.source})`, "g");
// Parts of the file that must never be edited as text: metadata and embedded images.
const PROTECTED_RE = /(<metadata>[\s\S]*?<\/metadata>|data:image\/\w+;base64,[\w+/=]+)/g;
const DATA_URI_RE  = /data:image\/png;base64,([A-Za-z0-9+/=]+)/g;

const clamp01 = (v) => Math.min(1, Math.max(0, v));

function parseColour(text) {
  const t = text.trim().toLowerCase();
  if (t.startsWith("rgb")) return t.match(/\d+/g).map(Number);
  const h = t.length === 4 ? [...t.slice(1)].map((c) => c + c).join("") : t.slice(1);
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
}

const toHex = (rgb) => "#" + rgb.map((v) => v.toString(16).padStart(2, "0")).join("");
const normalise = (text) => toHex(parseColour(text));

function rgbToHsl([r, g, b]) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h;
  if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  return [(h * HUE_TURN) / 6, s, l];
}

function hslToRgb([h, s, l]) {
  const k = (n) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1));
  return [f(0), f(8), f(4)].map((v) => Math.round(clamp01(v) * 255));
}

// Maps one blue shade to the same shade of the target hue. Hue keeps its small offset from the
// reference, saturation scales with the reference, and lightness is piecewise linear so that
// black stays black, the reference becomes the target and white stays white.
function makeMapper(baseHex) {
  const [rh, rs, rl] = rgbToHsl(parseColour(REFERENCE_BLUE));
  const [th, ts, tl] = rgbToHsl(parseColour(baseHex));
  return (rgb) => {
    const [h, s, l] = rgbToHsl(rgb);
    const hue = (((th + h - rh) % HUE_TURN) + HUE_TURN) % HUE_TURN;
    const sat = clamp01((s * ts) / rs);
    const light = l <= rl ? (l / rl) * tl : tl + ((l - rl) / (1 - rl)) * (1 - tl);
    return hslToRgb([hue, sat, clamp01(light)]);
  };
}

function coloursIn(text) {
  const found = new Set();
  for (const m of text.matchAll(COLOUR_RE)) found.add(normalise(m[2]));
  return found;
}

// Applies fn to the editable parts of the SVG, leaving protected parts untouched.
function editText(svg, fn) {
  return svg.split(PROTECTED_RE).map((part, i) => (i % 2 ? part : fn(part))).join("");
}

// ---- Minimal PNG reader and writer (8-bit RGB or RGBA, not interlaced) ----

function readPng(buf) {
  if (!buf.subarray(0, 8).equals(PNG_SIGNATURE)) throw new Error("not a PNG");
  const chunks = [];
  for (let p = 8; p < buf.length;) {
    const len = buf.readUInt32BE(p);
    const type = buf.toString("latin1", p + 4, p + 8);
    chunks.push({ type, data: buf.subarray(p + 8, p + 8 + len) });
    p += len + 12;
  }
  const ihdr = chunks[0].data;
  const width = ihdr.readUInt32BE(0), height = ihdr.readUInt32BE(4);
  const depth = ihdr[8], type = ihdr[9], interlace = ihdr[12];
  if (depth !== PNG_BIT_DEPTH || (type !== PNG_RGB && type !== PNG_RGBA) || interlace) {
    throw new Error(`unsupported PNG (depth ${depth}, type ${type}, interlace ${interlace})`);
  }
  const bpp = type === PNG_RGBA ? 4 : 3;
  const idat = chunks.filter((c) => c.type === "IDAT").map((c) => c.data);
  const raw = inflateSync(Buffer.concat(idat));
  const stride = width * bpp, px = Buffer.alloc(stride * height);
  for (let y = 0; y < height; y++) {
    const filter = raw[y * (stride + 1)], src = y * (stride + 1) + 1, row = y * stride;
    for (let x = 0; x < stride; x++) {
      const a = x >= bpp ? px[row + x - bpp] : 0;
      const b = y ? px[row - stride + x] : 0;
      const c = x >= bpp && y ? px[row - stride + x - bpp] : 0;
      let v = raw[src + x];
      if (filter === 1) v += a;
      else if (filter === 2) v += b;
      else if (filter === 3) v += (a + b) >> 1;
      else if (filter === 4) {
        const pa = Math.abs(b - c), pb = Math.abs(a - c), pc = Math.abs(a + b - 2 * c);
        v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
      }
      px[row + x] = v & 0xff;
    }
  }
  return { chunks, width, height, bpp, px };
}

function paeth(a, b, c) {
  const pa = Math.abs(b - c), pb = Math.abs(a - c), pc = Math.abs(a + b - 2 * c);
  return pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
}

// Re-encodes the pixels, choosing per row the filter with the smallest sum of residuals.
function writePng({ chunks, width, height, bpp, px }) {
  const stride = width * bpp, trial = Buffer.alloc(stride);
  const out = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    const row = y * stride;
    let best = null, bestScore = Infinity;
    for (let f = 0; f <= 4; f++) {
      let score = 0;
      for (let x = 0; x < stride; x++) {
        const a = x >= bpp ? px[row + x - bpp] : 0;
        const b = y ? px[row - stride + x] : 0;
        const c = x >= bpp && y ? px[row - stride + x - bpp] : 0;
        const pred = [0, a, b, (a + b) >> 1, paeth(a, b, c)][f];
        trial[x] = (px[row + x] - pred) & 0xff;
        score += trial[x] < 128 ? trial[x] : 256 - trial[x];
      }
      if (score >= bestScore) continue;
      bestScore = score;
      best = f;
      trial.copy(out, y * (stride + 1) + 1);
    }
    out[y * (stride + 1)] = best;
  }
  const chunk = (type, data) => {
    const head = Buffer.alloc(8);
    head.writeUInt32BE(data.length, 0);
    head.write(type, 4, "latin1");
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(Buffer.concat([head.subarray(4), data])) >>> 0, 0);
    return Buffer.concat([head, data, crc]);
  };
  const parts = [PNG_SIGNATURE];
  let wroteData = false;
  for (const c of chunks) {
    if (c.type === "IDAT") {
      if (!wroteData) parts.push(chunk("IDAT", deflateSync(out, { level: PNG_ZLIB_LEVEL })));
      wroteData = true;
    } else parts.push(chunk(c.type, c.data));
  }
  return Buffer.concat(parts);
}

// Recolours every pixel that differs between the blue and green versions of an image.
function recolourPng(blueB64, greenB64, mapper) {
  const blue = readPng(Buffer.from(blueB64, "base64"));
  const green = readPng(Buffer.from(greenB64, "base64"));
  if (blue.width !== green.width || blue.height !== green.height || blue.bpp !== green.bpp) {
    throw new Error("blue and green images differ in size");
  }
  let changed = 0;
  for (let i = 0; i < blue.px.length; i += blue.bpp) {
    if (blue.px[i] === green.px[i] && blue.px[i + 1] === green.px[i + 1] &&
        blue.px[i + 2] === green.px[i + 2]) continue;
    const rgb = mapper([blue.px[i], blue.px[i + 1], blue.px[i + 2]]);
    blue.px[i] = rgb[0]; blue.px[i + 1] = rgb[1]; blue.px[i + 2] = rgb[2];
    changed++;
  }
  return { b64: writePng(blue).toString("base64"), changed };
}

// ---- Main ----

const files = readdirSync(UNITS_DIR).filter((f) => f.endsWith("-blue.svg")).sort();
let written = 0;
for (const blueName of files) {
  const unit = blueName.slice(0, -"-blue.svg".length);
  const greenPath = join(UNITS_DIR, `${unit}-green.svg`);
  if (!existsSync(greenPath)) {
    console.warn(`${unit}: no green version, skipped`);
    continue;
  }
  const blueSvg = readFileSync(join(UNITS_DIR, blueName), "utf8");
  const greenSvg = readFileSync(greenPath, "utf8");

  const greenColours = coloursIn(greenSvg.replace(PROTECTED_RE, ""));
  const blueColours = coloursIn(blueSvg.replace(PROTECTED_RE, ""));
  const team = [...blueColours].filter((c) => !greenColours.has(c));
  const blueImages = [...blueSvg.matchAll(DATA_URI_RE)].map((m) => m[1]);
  const greenImages = [...greenSvg.matchAll(DATA_URI_RE)].map((m) => m[1]);

  for (const [name, target] of Object.entries(TARGETS)) {
    const mapper = makeMapper(target.base);
    const map = new Map(team.map((c) => [c, toHex(mapper(parseColour(c)))]));
    let svg = editText(blueSvg, (text) => text
      .replace(COLOUR_RE, (all, prefix, value) => {
        const to = map.get(normalise(value));
        return to ? prefix + to : all;
      })
      .replace(/\bBLUE\b/g, target.word)
      .replace(/\bBlue\b/g, target.title));

    const notes = [...map].map(([from, to]) => `${from}->${to}`);
    blueImages.forEach((b64, i) => {
      if (b64 === greenImages[i]) return;
      if (greenImages[i] === undefined) {
        console.warn(`${unit}: image ${i} has no green pair`);
        return;
      }
      const { b64: out, changed } = recolourPng(b64, greenImages[i], mapper);
      svg = svg.replace(b64, out);
      notes.push(`image ${i}: ${changed} px`);
    });
    if (!notes.length) console.warn(`${unit}: no team colours found`);
    writeFileSync(join(UNITS_DIR, `${unit}-${name}.svg`), svg);
    written++;
    console.log(`${unit}-${name}.svg  ${notes.join(", ")}`);
  }
}
console.log(`${written} files written`);
