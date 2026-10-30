// Draws the game board as SVG from one player's view of the game, plus what the UI wants
// highlighted. No rules here: everything shown comes from the engine's view.
import { parseKey, toPixel, distance } from "./hex.js?v=0.66";
import { unitStats, defenceOf } from "./engine.js?v=0.66";

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
  2: { name: "Yellow", file: "yellow", ring: "#f2c230" },
  3: { name: "Purple", file: "purple", ring: "#a35ce0" },
  4: { name: "Pink", file: "pink", ring: "#ff6fb5" },
};
// Ring round an unused factory, which belongs to nobody.
const NEUTRAL_RING = "#b9b2a8";
// Badges for factory upgrades, used in menus and unlock cards. On the board the factory tile
// itself shows its upgrades.
const UPGRADE_BADGES = {
  airfield: "upgrade-airfield",
  heavyWorks: "upgrade-heavy-works",
  lab: "upgrade-lab",
  comms: "upgrade-comms",
};
// Comms is not part of the factory tiles, so a factory with it carries its badge on the
// board, at this share of the hex height, in its top right corner.
const COMMS_BADGE_SCALE = 0.4;

// The badge image for a factory upgrade.
export function upgradeImage(upgrade) {
  return `units/${UPGRADE_BADGES[upgrade]}.svg`;
}

// Factory tiles: one per combination of upgrades, in each owner's colour, e.g.
// units/factory-heavy-lab-blue.webp. The parts always come in this order.
const FACTORY_PARTS = [["heavyWorks", "heavy"], ["airfield", "airfield"], ["lab", "lab"]];

export function factoryImage(upgrades = [], owner = null) {
  const parts = FACTORY_PARTS.filter(([u]) => upgrades.includes(u)).map(([, p]) => `-${p}`);
  const colour = owner === null ? "neutral" : PLAYER_COLOURS[owner].file;
  return `units/factory${parts.join("")}-${colour}.webp`;
}

// Plain fills used when no tile image is available.
const TERRAIN_FILL = {
  plain: "#c8463c", rocky: "#a8382f", mountain: "#6e2a22", chasm: "#3a1410",
};

// Bold enough to read on a phone in daylight.
export const OVERLAY_STYLES = {
  move: { stroke: "#7ae4ff", fill: "rgba(90, 216, 255, 0.22)" },
  fire: { stroke: "#ff7a66", fill: "rgba(255, 90, 74, 0.3)" },
  // A hex out of sight that can be fired into blind.
  fireBlind: { stroke: "rgba(255, 122, 102, 0.75)", fill: "rgba(255, 90, 74, 0.14)" },
  // A campaign mission's destination.
  objective: { stroke: "#ffd23f", fill: "rgba(255, 210, 63, 0.12)" },
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
  chinook: "chinook",
  turret: "turret",
  vip: "vip",
  heavyTank: "heavy-tank",
  twinTurret: "twin-turret",
};

export function unitImage(type, owner) {
  return `units/${UNIT_FILES[type]}-${PLAYER_COLOURS[owner].file}.svg`;
}

// The way a unit faces moving from one hex to the next: degrees clockwise from facing up the
// board, which is how the token art is drawn.
const DEGREES_PER_RADIAN = 180 / Math.PI;
const GREEN_FACING = 180;

// Which way a player's units face before they move: with two sides, blue up the board and
// green down it; with more, from their home towards the middle of the map.
function startFacing(view, owner) {
  const homes = view.map.factories;
  if (homes.length <= 2) return owner === 1 ? GREEN_FACING : 0;
  const points = homes.map(hexCentre);
  const mx = points.reduce((t, [x]) => t + x, 0) / points.length;
  const my = points.reduce((t, [, y]) => t + y, 0) / points.length;
  const [hx, hy] = points[owner];
  return Math.atan2(mx - hx, hy - my) * DEGREES_PER_RADIAN;
}

export function facingAngle(from, to) {
  const [ax, ay] = hexCentre(from);
  const [bx, by] = hexCentre(to);
  return Math.atan2(bx - ax, ay - by) * DEGREES_PER_RADIAN;
}

// A unit token's width and height in board units, for showing a move: the game screen glides
// a copy of the token over the board instead of redrawing the board for every step.
export function tokenSize() {
  return HEX_HEIGHT * UNIT_SCALE;
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

// Explored ground no unit can see now: a thin fog over it (units there are hidden).
const FOG_FILL = "rgba(12, 4, 3, 0.4)";

function drawFog(view) {
  let out = "";
  for (const k in view.map.hexes) {
    if (view.map.hexes[k].terrain && !view.visible[k]) out += polygon(k, { fill: FOG_FILL });
  }
  return out;
}

function drawCrystals(view) {
  let out = "";
  for (const k in view.crystals) {
    const pile = view.crystals[k];
    const [x, y] = hexCentre(k);
    const { explodeAt, growthPerTurn, holdTurns = 0 } = view.rules.crystals;
    const share = Math.min(1, pile.amount / explodeAt);
    const scale = CRYSTAL_MIN_SCALE + (CRYSTAL_MAX_SCALE - CRYSTAL_MIN_SCALE) * share;
    const size = HEX_HEIGHT * scale;
    out += image("units/crystals.svg", x, y - HEX_HEIGHT * 0.06, size, size);
    // Red when the pile will explode at the end of this turn unless someone harvests it; amber
    // when it is at (or reaches) the explode level with a turn to spare.
    const full = pile.amount >= explodeAt;
    const held = pile.held || 0;
    let warn = "";
    if (full ? held + 1 >= holdTurns : !holdTurns && pile.amount + growthPerTurn >= explodeAt) {
      warn = " crystal-warning";
    } else if (full || pile.amount + growthPerTurn >= explodeAt) {
      warn = " crystal-full";
    }
    out += label(pile.amount, x, y + HEX_HEIGHT * 0.38, `board-label crystal-label${warn}`);
  }
  return out;
}

// facing: unitId -> angle for units that have moved (others face the enemy's side). moving: a
// unit part way along its route, { unit, at, hidden }, drawn there instead of where it ended.
function drawUnits(view, selectedId, facing, moving) {
  let out = "";
  const units = Object.values(view.units).filter((u) => !moving || u.id !== moving.unit.id);
  if (moving && !moving.hidden) units.push({ ...moving.unit, at: moving.at });
  for (const unit of units) {
    const id = unit.id;
    const stats = unitStats(view, unit);
    const [x, y] = hexCentre(unit.at);
    const ring = unit.owner === null ? NEUTRAL_RING : PLAYER_COLOURS[unit.owner].ring;
    const myTurn = view.active ? view.active.includes(view.viewer) : view.current === view.viewer;
    const done = unit.owner === view.viewer && myTurn && unit.moved && unit.acted &&
      !stats.isFactory;
    const opacity = done ? ` opacity="${DONE_OPACITY}"` : "";
    if (id === selectedId) {
      out += polygon(unit.at, { scale: SELECTED_INSET, stroke: "#fff", width: 4,
        fill: "rgba(255, 255, 255, 0.12)" });
    }
    // Everything drawn for the unit is grouped, so a move can hide all of it at once.
    out += `<g data-unit="${id}">`;
    if (stats.isFactory) {
      // The factory art is square, in the owner's colour and showing its upgrades; it is
      // clipped to the hex and ringed in the owner's colour.
      const size = HEX_SIZE * 2 * FACTORY_SCALE;
      out += image(factoryImage(unit.upgrades, unit.owner), x, y, size, size,
        'clip-path="url(#hex-clip)"');
      out += polygon(unit.at, { scale: SELECTED_INSET, stroke: ring, width: 6 });
      if ((unit.upgrades || []).includes("comms")) {
        const badge = HEX_HEIGHT * COMMS_BADGE_SCALE;
        out += image(upgradeImage("comms"), x + HEX_SIZE * 0.45, y - HEX_HEIGHT * 0.28, badge,
          badge);
      }
    } else {
      const size = HEX_HEIGHT * UNIT_SCALE;
      // Units face the way they last moved; before that, towards the enemy.
      const angle = facing[id] ?? startFacing(view, unit.owner);
      const turn = angle ? ` transform="rotate(${angle.toFixed(1)} ${x} ${y})"` : "";
      out += image(unitImage(unit.type, unit.owner), x, y, size, size, `${turn}${opacity}`);
      if (unit.setUp) out += label("SET", x, y - HEX_HEIGHT * 0.36, "board-label setup-label");
      const below = unitLabel(unit);
      if (below) out += label(below.text, x, y + UNIT_LABEL_DY, `board-label ${below.style}`);
    }
    if (unit.lives < view.rules.lives) {
      const { dx, dy, size } = DAMAGE_BADGE;
      out += image("units/explosion.svg", x + dx, y + dy, size, size);
    }
    // Damage taken so far this turn against its defence: further shots this turn add to it.
    const hits = view.hits[id];
    if (hits) {
      out += label(`${hits.total}/${defenceOf(view, unit)}`, x, y - HEX_HEIGHT * 0.36,
        "board-label hit-label");
    }
    out += "</g>";
  }
  return out;
}

// The damage badge on a damaged unit, relative to the unit's centre, in board units.
export const DAMAGE_BADGE = { dx: HEX_SIZE * 0.45, dy: -HEX_HEIGHT * 0.28,
  size: HEX_HEIGHT * DAMAGE_BADGE_SCALE };
// The label under a unit (crystals carried, passengers aboard), this far below its centre.
export const UNIT_LABEL_DY = HEX_HEIGHT * 0.42;

// The label under a unit, { text, style }, or null: crystals it carries, or passengers.
export function unitLabel(unit) {
  if (unit.carrying > 0) return { text: unit.carrying, style: "crystal-label" };
  if (unit.cargo && unit.cargo.length) {
    return { text: `+${unit.cargo.length}`, style: "cargo-label" };
  }
  return null;
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
// A sonic boom: Phil's sound-wave art runs from the Sonic Tank straight through the centre
// of the aimed hex and on to the end of its line, over a pale band along the line.
const BOOM_WIDTH = HEX_SIZE * 0.55;
const BOOM_ART = { width: HEX_HEIGHT * 0.67, height: HEX_HEIGHT * 0.8 };

// The CSS that starts an effect's animation part-way through when the board is redrawn
// after the effect began.
function effectTiming(effect, ms) {
  const late = effect.start ? performance.now() - effect.start : 0;
  return `animation-delay:${Math.round((effect.delay || 0) - late)}ms;` +
    (ms ? `animation-duration:${ms}ms;` : "");
}

function drawBoom(effect) {
  const { from, at, path } = effect;
  const [ax, ay] = hexCentre(from);
  const [tx, ty] = hexCentre(at);
  // The line runs exactly through the aimed hex's centre: the wave stops after as many hexes
  // as it crossed (fewer when a mountain stops it).
  const reach = path.length / distance(from, at);
  const bx = ax + (tx - ax) * reach;
  const by = ay + (ty - ay) * reach;
  // The art's waves face up the board, as token art does.
  const turn = facingAngle(from, at);
  const timing = effectTiming(effect, effect.ms);
  const { width, height } = BOOM_ART;
  return `<line x1="${ax.toFixed(1)}" y1="${ay.toFixed(1)}" x2="${bx.toFixed(1)}" ` +
    `y2="${by.toFixed(1)}" class="boom-wave" stroke-width="${BOOM_WIDTH}" ` +
    `style="${timing}"/>` +
    `<g class="boom" style="--ax:${ax.toFixed(1)}px;--ay:${ay.toFixed(1)}px;` +
    `--bx:${bx.toFixed(1)}px;--by:${by.toFixed(1)}px;--turn:${turn.toFixed(1)}deg;${timing}">` +
    image("units/sonic-boom.png", 0, 0, width, height) + "</g>";
}

function drawEffects(effects) {
  let out = "";
  for (const effect of effects) {
    if (effect.kind === "boom") {
      out += drawBoom(effect);
      continue;
    }
    const [x, y] = hexCentre(effect.at);
    const size = HEX_HEIGHT * (effect.size || 0.7);
    const style = effect.delay ? "effect late" : "effect";
    out += image("units/explosion.svg", x, y, size, size,
      `class="${style}" style="${effectTiming(effect)}"`);
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
  const files = ["units/crystals.svg", "units/explosion.svg", "units/sonic-boom.png",
    ...Object.keys(UPGRADE_BADGES).map(upgradeImage)];
  // Every combination of factory upgrades, for each owner and for nobody.
  const combos = [[]];
  for (const [upgrade] of FACTORY_PARTS) combos.push(...combos.map((c) => [...c, upgrade]));
  for (const owner of [null, ...Object.keys(PLAYER_COLOURS).map(Number)]) {
    for (const combo of combos) files.push(factoryImage(combo, owner));
  }
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
  view, selectedId = null, overlays = [], effects = [], notes = [], facing = {}, moving = null,
}) {
  group.innerHTML = HEX_CLIP +
    `<g class="terrain">${drawTerrain(view)}</g>` +
    `<g class="fog">${drawFog(view)}</g>` +
    `<g class="crystals">${drawCrystals(view)}</g>` +
    `<g class="overlays">${drawOverlays(overlays)}</g>` +
    `<g class="units">${drawUnits(view, selectedId, facing, moving)}</g>` +
    `<g class="effects">${drawEffects(effects)}</g>` +
    `<g class="notes">${drawNotes(notes)}</g>` +
    `<g class="hits">${drawHitTargets(view)}</g>`;
}
