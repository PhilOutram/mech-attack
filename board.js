// Draws the game board as SVG from one player's view of the game, plus what the UI wants
// highlighted. No rules here: everything shown comes from the engine's view.
import { parseKey, toPixel } from "./hex.js?v=0.19";
import { unitStats, defenceOf } from "./engine.js?v=0.19";

// Hex corner radius in SVG units. Tiles are drawn 2 x HEX_SIZE wide.
export const HEX_SIZE = 50;
const HEX_HEIGHT = Math.sqrt(3) * HEX_SIZE;
// Overlay outlines sit a little inside the hex so neighbouring dashes do not touch.
const OVERLAY_INSET = 0.86;
const SELECTED_INSET = 0.92;
// Token size as a share of the hex height.
const UNIT_SCALE = 0.86;
const FACTORY_SCALE = 0.95;
const DAMAGE_BADGE_SCALE = 0.36;
// Crystal art grows with the pile towards its explode level, between these shares of the hex
// height.
const CRYSTAL_MIN_SCALE = 0.42;
const CRYSTAL_MAX_SCALE = 0.85;
// Opacity of units that have finished for the turn.
const DONE_OPACITY = 0.55;
const FONT_SIZE = 15;

export const PLAYER_COLOURS = {
  0: { name: "Blue", file: "blue", ring: "#3b8cff" },
  1: { name: "Green", file: "green", ring: "#42c25a" },
};
// Ring round an unused factory, which belongs to nobody.
const NEUTRAL_RING = "#b9b2a8";
// Factory upgrade letters shown on the factory: H = Heavy works, A = Airfield.
const UPGRADE_LETTERS = { heavyWorks: "H", airfield: "A" };

// Plain fills used when no tile image is available.
const TERRAIN_FILL = {
  plain: "#c8463c", rocky: "#a8382f", mountain: "#6e2a22", chasm: "#3a1410",
};

// Bold enough to read on a phone in daylight.
export const OVERLAY_STYLES = {
  move: { stroke: "#7ae4ff", fill: "rgba(90, 216, 255, 0.22)" },
  fire: { stroke: "#ff7a66", fill: "rgba(255, 90, 74, 0.3)" },
  range: { stroke: "rgba(255, 90, 74, 0.5)", fill: "rgba(255, 90, 74, 0.06)" },
  harvest: { stroke: "#9ff7ff", fill: "rgba(127, 243, 255, 0.26)" },
  heal: { stroke: "#9dffa8", fill: "rgba(125, 255, 138, 0.24)" },
  build: { stroke: "#ffe066", fill: "rgba(255, 216, 74, 0.24)" },
  // A move that drives over crystals and destroys them.
  crush: { stroke: "#fff04a", fill: "rgba(255, 240, 74, 0.3)" },
};
const OVERLAY_WIDTH = 5;
const OVERLAY_DASH = "12 6";
// Face-down hexes: dark, with an outline light enough to show the size of the map.
const UNEXPLORED_FILL = "#140806";
const UNEXPLORED_STROKE = "#6e3c30";
const UNEXPLORED_WIDTH = 3;

const UNIT_FILES = {
  scoutBike: "scout-bike",
  tank: "tank",
  heavyCannon: "heavy-cannon",
  artillery: "artillery",
  lightHarvester: "light-harvester",
  lightMedic: "light-medic",
  spotterDrone: "spotter-drone",
  blastCannon: "blast-cannon",
  sonicTank: "sonic-tank",
  antiAircraftJeep: "anti-aircraft-jeep",
  attackHelicopter: "attack-helicopter",
  fighter: "fighter",
  infantry: "infantry",
  transporter: "transporter",
};

export function unitImage(type, owner) {
  return `units/${UNIT_FILES[type]}-${PLAYER_COLOURS[owner].file}.svg`;
}

export function hexCentre(k) {
  const [q, r] = parseKey(k);
  return toPixel(q, r, HEX_SIZE);
}

function corners(k, scale = 1) {
  const [x, y] = hexCentre(k);
  const out = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i;
    out.push(`${(x + HEX_SIZE * scale * Math.cos(angle)).toFixed(1)},` +
      `${(y + HEX_SIZE * scale * Math.sin(angle)).toFixed(1)}`);
  }
  return out.join(" ");
}

// Extent of the map in SVG units, with a margin of half a hex.
export function boardBounds(map) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const k in map.hexes) {
    const [x, y] = hexCentre(k);
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  }
  const margin = HEX_SIZE * 1.5;
  return { x: minX - margin, y: minY - margin,
    width: maxX - minX + 2 * margin, height: maxY - minY + 2 * margin };
}

// ---------------------------------------------------------------------------------------
// Tile art. tiles/tiles.json lists the tile images and their terrain; without it the board
// falls back to flat colours.

let tileSet = null;

export async function loadTiles(version) {
  try {
    const response = await fetch(`tiles/tiles.json?v=${version}`);
    if (!response.ok) return;
    const data = await response.json();
    const entries = Array.isArray(data) ? data : data.tiles || [];
    const byTerrain = {};
    const byName = {};
    for (const entry of entries) {
      const file = entry.file.replace(/^.*[\\/]/, "");
      (byTerrain[entry.terrain] ||= []).push(file);
      byName[file.replace(/\.png$/, "")] = file;
    }
    tileSet = { byTerrain, byName };
  } catch {
    tileSet = null;
  }
}

// Chasm hexes from the cracked cluster use the matching piece of the crack.
const CHASM_PIECES = { N: "chasm-n", centre: "chasm-centre", SW: "chasm-sw" };

function tileFor(k, hex) {
  if (!tileSet || !hex.terrain) return null;
  if (hex.terrain === "chasm") {
    const piece = tileSet.byName[CHASM_PIECES[hex.slot]] || tileSet.byName["chasm-single"];
    if (piece) return piece;
  }
  const options = tileSet.byTerrain[hex.terrain];
  if (!options || !options.length) return null;
  // The same hex always gets the same variant.
  const [q, r] = parseKey(k);
  const pick = Math.abs(q * 7 + r * 13) % options.length;
  return options[pick];
}

// ---------------------------------------------------------------------------------------
// Drawing

function polygon(k, { scale = 1, fill = "none", stroke = "none", width = 0, dash = "",
  extra = "" }) {
  const dashAttr = dash ? ` stroke-dasharray="${dash}"` : "";
  return `<polygon points="${corners(k, scale)}" fill="${fill}" stroke="${stroke}" ` +
    `stroke-width="${width}"${dashAttr} ${extra}/>`;
}

function image(href, cx, cy, w, h, extra = "") {
  return `<image href="${href}" x="${(cx - w / 2).toFixed(1)}" y="${(cy - h / 2).toFixed(1)}" ` +
    `width="${w.toFixed(1)}" height="${h.toFixed(1)}" ${extra}/>`;
}

function label(text, x, y, cls = "board-label") {
  return `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" class="${cls}" ` +
    `font-size="${FONT_SIZE}" text-anchor="middle">${text}</text>`;
}

function drawTerrain(view) {
  let out = "";
  for (const k in view.map.hexes) {
    const hex = view.map.hexes[k];
    if (!hex.terrain) {
      out += polygon(k, { fill: UNEXPLORED_FILL, stroke: UNEXPLORED_STROKE,
        width: UNEXPLORED_WIDTH });
      continue;
    }
    const tile = tileFor(k, hex);
    const [x, y] = hexCentre(k);
    if (tile) out += image(`tiles/${tile}`, x, y, HEX_SIZE * 2, HEX_HEIGHT);
    else out += polygon(k, { fill: TERRAIN_FILL[hex.terrain], stroke: "#333", width: 4 });
  }
  return out;
}

function drawFog(view) {
  let out = "";
  for (const k in view.map.hexes) {
    if (view.map.hexes[k].terrain && !view.visible[k]) {
      out += polygon(k, { fill: "rgba(12, 4, 3, 0.55)" });
    }
  }
  return out;
}

function drawCrystals(view) {
  let out = "";
  for (const k in view.crystals) {
    const pile = view.crystals[k];
    const [x, y] = hexCentre(k);
    const { explodeAt, growthPerTurn } = view.rules.crystals;
    const share = Math.min(1, pile.amount / explodeAt);
    const scale = CRYSTAL_MIN_SCALE + (CRYSTAL_MAX_SCALE - CRYSTAL_MIN_SCALE) * share;
    const size = HEX_HEIGHT * scale;
    out += image("units/crystals.svg", x, y - HEX_HEIGHT * 0.06, size, size);
    // Red when the pile will explode at the end of this turn unless someone harvests it.
    const warn = pile.amount + growthPerTurn >= explodeAt ? " crystal-warning" : "";
    out += label(pile.amount, x, y + HEX_HEIGHT * 0.38, `board-label crystal-label${warn}`);
  }
  return out;
}

function drawUnits(view, selectedId) {
  let out = "";
  for (const id in view.units) {
    const unit = view.units[id];
    const stats = unitStats(view, unit);
    const [x, y] = hexCentre(unit.at);
    const ring = unit.owner === null ? NEUTRAL_RING : PLAYER_COLOURS[unit.owner].ring;
    const done = unit.owner === view.viewer && view.current === view.viewer &&
      unit.moved && unit.acted && !stats.isFactory;
    const opacity = done ? ` opacity="${DONE_OPACITY}"` : "";
    if (id === selectedId) {
      out += polygon(unit.at, { scale: SELECTED_INSET, stroke: "#fff", width: 4,
        fill: "rgba(255, 255, 255, 0.12)" });
    }
    if (stats.isFactory) {
      // The factory art is square; it is clipped to the hex and ringed in the owner's colour.
      const size = HEX_SIZE * 2 * FACTORY_SCALE;
      out += image("units/factory.svg", x, y, size, size, 'clip-path="url(#hex-clip)"');
      out += polygon(unit.at, { scale: SELECTED_INSET, stroke: ring, width: 6 });
      const letters = (unit.upgrades || []).map((u) => UPGRADE_LETTERS[u]).join(" ");
      if (letters) out += label(letters, x, y + HEX_HEIGHT * 0.36, "board-label upgrade-label");
    } else {
      const size = HEX_HEIGHT * UNIT_SCALE;
      // Green's tokens face down the board, towards blue.
      const turn = unit.owner === 1 ? ` transform="rotate(180 ${x} ${y})"` : "";
      out += image(unitImage(unit.type, unit.owner), x, y, size, size, `${turn}${opacity}`);
      if (unit.setUp) out += label("SET", x, y - HEX_HEIGHT * 0.36, "board-label setup-label");
      if (unit.carrying > 0) {
        out += label(unit.carrying, x, y + HEX_HEIGHT * 0.42, "board-label crystal-label");
      }
      // Infantry on board a transporter.
      if (unit.cargo && unit.cargo.length) {
        out += label(`+${unit.cargo.length}`, x, y + HEX_HEIGHT * 0.42,
          "board-label cargo-label");
      }
    }
    if (unit.lives < view.rules.lives) {
      const badge = HEX_HEIGHT * DAMAGE_BADGE_SCALE;
      out += image("units/explosion.svg", x + HEX_SIZE * 0.45, y - HEX_HEIGHT * 0.28, badge,
        badge);
    }
    // Damage taken so far this turn against its defence: further shots this turn add to it.
    const hits = view.hits[id];
    if (hits) {
      out += label(`${hits.total}/${defenceOf(view, unit)}`, x, y - HEX_HEIGHT * 0.36,
        "board-label hit-label");
    }
  }
  return out;
}

function drawOverlays(overlays) {
  let out = "";
  for (const { hexes, style } of overlays) {
    const s = OVERLAY_STYLES[style];
    for (const k of hexes) {
      out += polygon(k, { scale: OVERLAY_INSET, fill: s.fill, stroke: s.stroke,
        width: OVERLAY_WIDTH, dash: OVERLAY_DASH });
    }
  }
  return out;
}

// Short-lived explosions: a muzzle flash at the attacker and a blast at the target.
function drawEffects(effects) {
  let out = "";
  for (const effect of effects) {
    const [x, y] = hexCentre(effect.at);
    const size = HEX_HEIGHT * (effect.size || 0.7);
    out += image("units/explosion.svg", x, y, size, size, 'class="effect"');
  }
  return out;
}

function drawHitTargets(view) {
  let out = "";
  for (const k in view.map.hexes) {
    out += polygon(k, { fill: "transparent", extra: `data-hex="${k}" class="hit"` });
  }
  return out;
}

// A flat-topped hex filling the width of a square image, for clipping square art.
const HEX_CLIP = `<defs><clipPath id="hex-clip" clipPathUnits="objectBoundingBox">` +
  `<polygon points="0.25,0.067 0.75,0.067 1,0.5 0.75,0.933 0.25,0.933 0,0.5"/>` +
  `</clipPath></defs>`;

// Loads every token image once, so tokens do not flicker in when the board is redrawn.
const preloaded = [];

export function preloadArt() {
  if (preloaded.length) return;
  const files = ["units/factory.svg", "units/crystals.svg", "units/explosion.svg"];
  for (const type in UNIT_FILES) {
    for (const owner in PLAYER_COLOURS) files.push(unitImage(type, owner));
  }
  for (const file of files) {
    const img = new Image();
    img.src = file;
    preloaded.push(img);
  }
}

// Notes on hexes, such as what a shot at that target would do: [{ at, text }].
function drawNotes(notes) {
  return notes.map(({ at, text }) => {
    const [x, y] = hexCentre(at);
    return label(text, x, y + HEX_HEIGHT * 0.42, "board-label shot-label");
  }).join("");
}

export function renderBoard(group, {
  view, selectedId = null, overlays = [], effects = [], notes = [],
}) {
  group.innerHTML = HEX_CLIP +
    `<g class="terrain">${drawTerrain(view)}</g>` +
    `<g class="fog">${drawFog(view)}</g>` +
    `<g class="crystals">${drawCrystals(view)}</g>` +
    `<g class="overlays">${drawOverlays(overlays)}</g>` +
    `<g class="units">${drawUnits(view, selectedId)}</g>` +
    `<g class="effects">${drawEffects(effects)}</g>` +
    `<g class="notes">${drawNotes(notes)}</g>` +
    `<g class="hits">${drawHitTargets(view)}</g>`;
}
