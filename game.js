// Game screen: you (blue) against the AI (green). Renders the engine's view of the game and
// turns taps into engine actions. No rules here; every option shown comes from the engine.
import { RULES } from "./rules-config.js?v=0.02";
import { FIXED_MAP_1, buildMap } from "./maps.js?v=0.02";
import {
  newGame, applyAction, viewFor, reachableHexes, attackTargets, healTargets, harvestTargets,
  canUnload, canSetUp, canPackUp, buildSites, buildableTypes, unitStats, livesAfterHit,
  firesBack, STATE_FORMAT,
} from "./engine.js?v=0.02";
import { chooseAction } from "./ai.js?v=0.02";
import { distance } from "./hex.js?v=0.02";
import {
  renderBoard, boardBounds, loadTiles, preloadArt, unitImage, PLAYER_COLOURS,
} from "./board.js?v=0.02";

const HUMAN = 0;
const AI_PLAYER = 1;
const SAVE_KEY = "mech-attack.save";
const ASSET_VERSION = "0.02";
// Pause between AI actions you can see, and how long an explosion stays on screen.
const AI_STEP_MS = 450;
const EFFECT_MS = 500;
// A pointer that moves further than this is panning the board, not tapping it.
const DRAG_THRESHOLD_PX = 8;
const MAX_ZOOM = 4;
const WHEEL_ZOOM_RATE = 0.0015;
const MAX_SEED = 2 ** 31;
const MESSAGE_LINES = 2;

const REASONS = {
  factoryDestroyed: "the factory was destroyed",
  noUnits: "no units left and not enough crystals to build one",
  roundCap: "the round limit was reached",
};

let state = null;
const ui = { selectedId: null, mode: null, buildType: null, busy: false, effects: [],
  messages: [] };
let fitBox = null;
let viewBox = null;
let els = null;
let wired = false;

// ---------------------------------------------------------------------------------------
// Saving

export function hasSavedGame() {
  return Boolean(loadSave());
}

function loadSave() {
  try {
    const saved = JSON.parse(localStorage.getItem(SAVE_KEY));
    return saved && saved.format === STATE_FORMAT && !saved.result ? saved : null;
  } catch {
    return null;
  }
}

function save() {
  try {
    if (state.result) localStorage.removeItem(SAVE_KEY);
    else localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  } catch {
    // Storage can be full or blocked; the game carries on without saving.
  }
}

// ---------------------------------------------------------------------------------------
// Starting and leaving

export async function openGame({ resume = false, onLeave }) {
  els = els || findElements();
  if (!wired) wire(onLeave);
  state = resume ? loadSave() : null;
  if (!state) {
    const seed = Math.floor(Math.random() * MAX_SEED);
    state = newGame({ rules: RULES, map: buildMap(FIXED_MAP_1), seed, firstPlayer: HUMAN });
    save();
  }
  Object.assign(ui, { selectedId: null, mode: null, buildType: null, busy: false,
    effects: [], messages: ["Tap one of your units to give it orders."] });
  els.screen.hidden = false;
  els.over.hidden = true;
  preloadArt();
  await loadTiles(ASSET_VERSION);
  fitBoard();
  render();
  if (state.current === AI_PLAYER) runAiTurn();
}

function findElements() {
  const $ = (id) => document.getElementById(id);
  return {
    screen: $("game"), svg: $("board"), root: $("board-root"), round: $("game-round"),
    turn: $("game-turn"), crystals: $("game-crystals"), endTurn: $("end-turn"),
    home: $("game-home"), message: $("game-message"), panel: $("unit-panel"),
    over: $("game-over"), overTitle: $("game-over-title"), overText: $("game-over-text"),
    again: $("play-again"), toTitle: $("game-over-home"),
  };
}

function wire(onLeave) {
  wired = true;
  const leave = () => {
    els.screen.hidden = true;
    onLeave();
  };
  els.home.addEventListener("click", leave);
  els.toTitle.addEventListener("click", leave);
  els.again.addEventListener("click", () => openGame({ onLeave }));
  els.endTurn.addEventListener("click", () => {
    if (!myTurn()) return;
    act({ type: "endTurn" });
    runAiTurn();
  });
  els.panel.addEventListener("click", onPanelClick);
  wireBoardInput();
  window.addEventListener("resize", () => {
    if (!els.screen.hidden) fitBoard();
  });
}

function myTurn() {
  return state && !state.result && !ui.busy && state.current === HUMAN;
}

// ---------------------------------------------------------------------------------------
// Acting

function act(action) {
  const before = viewFor(state, HUMAN);
  try {
    state = applyAction(state, action);
  } catch (error) {
    say(error.message.replace(/^Illegal action: /, "Not allowed: "));
    render();
    return false;
  }
  showEvents(state.events, before, viewFor(state, HUMAN));
  save();
  afterAction(action);
  render();
  if (state.result) showGameOver();
  return true;
}

// Keeps the unit selected and offers its next useful order.
function afterAction(action) {
  ui.buildType = null;
  if (action.type === "endTurn" || action.type === "build") {
    ui.selectedId = null;
    ui.mode = null;
    return;
  }
  const view = viewFor(state, HUMAN);
  if (!view.units[ui.selectedId]) ui.selectedId = null;
  ui.mode = ui.selectedId ? defaultMode(view, view.units[ui.selectedId]) : null;
}

async function runAiTurn() {
  if (!state || state.result || state.current !== AI_PLAYER) return;
  ui.busy = true;
  ui.selectedId = null;
  ui.mode = null;
  say("Green is moving…");
  render();
  while (!state.result && state.current === AI_PLAYER) {
    const before = viewFor(state, HUMAN);
    state = applyAction(state, chooseAction(viewFor(state, AI_PLAYER)));
    const after = viewFor(state, HUMAN);
    const seen = showEvents(state.events, before, after);
    if (seen) {
      render();
      await sleep(AI_STEP_MS);
    }
  }
  ui.busy = false;
  save();
  if (!state.result) say(`Round ${state.round}: your turn.`);
  render();
  if (state.result) showGameOver();
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ---------------------------------------------------------------------------------------
// Events: messages and explosions for what blue can see

function unitName(view, unitId, fallbackType, owner) {
  const unit = view.units[unitId];
  const type = unit ? unit.type : fallbackType;
  const who = (unit ? unit.owner : owner) === HUMAN ? "Your" : "Green";
  return `${who} ${type ? RULES.units[type].name : "unit"}`;
}

// Returns true if blue could see any of it.
function showEvents(events, before, after) {
  const seen = (k) => before.visible[k] || after.visible[k];
  const effects = [];
  const lines = [];
  let any = false;
  for (const e of events) {
    if (e.type === "fire" || e.type === "returnFire") {
      const from = (before.units[e.unitId] || after.units[e.unitId] || {}).at;
      const to = (before.units[e.targetId] || after.units[e.targetId] || {}).at;
      if (!seen(from) && !seen(to)) continue;
      any = true;
      if (from && seen(from)) effects.push({ at: from, size: 0.42 });
      if (to && seen(to)) effects.push({ at: to, size: 0.75 });
      const verb = e.type === "returnFire" ? "returned fire on" : "fired on";
      lines.push(`${unitName(before, e.unitId)} ${verb} ${unitName(before, e.targetId)} ` +
        `(${e.attack}).`);
    } else if (e.type === "hit" && e.livesAfter > 0) {
      const unit = before.units[e.unitId];
      if (!unit || !seen(unit.at)) continue;
      lines.push(e.livesAfter < e.livesBefore
        ? `${unitName(before, e.unitId)} lost a life.`
        : `${unitName(before, e.unitId)}: ${e.total} of ${e.defence} this turn, ` +
          "more fire this turn adds to it.");
    } else if (e.type === "destroyed" && seen(e.at)) {
      any = true;
      effects.push({ at: e.at, size: 1 });
      lines.push(`${unitName(before, e.unitId, e.unitType, e.owner)} destroyed.`);
    } else if (e.type === "move") {
      if (e.path.some(seen) || seen(e.from)) any = true;
      if (e.stoppedBy === "unit" && after.units[e.unitId].owner === HUMAN) {
        lines.push("Something hidden blocked the way.");
      }
    } else if (e.type === "crushed" && seen(e.at)) {
      lines.push(`${e.amount} crystals crushed.`);
    } else if (e.type === "harvest" && after.units[e.unitId]?.owner === HUMAN) {
      lines.push(`Harvested ${e.amount} crystals.`);
    } else if (e.type === "unload" && after.units[e.unitId]?.owner === HUMAN) {
      lines.push(`Unloaded ${e.amount} crystals${e.automatic ? " at the factory" : ""}.`);
    } else if (e.type === "build" && (after.units[e.unitId]?.owner === HUMAN || seen(e.at))) {
      any = true;
      lines.push(`${unitName(after, e.unitId)} built.`);
    } else if (e.type === "heal" && seen(after.units[e.unitId]?.at)) {
      lines.push(`${unitName(after, e.targetId)} repaired.`);
    }
  }
  for (const line of lines) say(line);
  if (effects.length) flash(effects);
  return any;
}

function flash(effects) {
  ui.effects = effects;
  setTimeout(() => {
    if (ui.effects === effects) {
      ui.effects = [];
      render();
    }
  }, EFFECT_MS);
}

function say(line) {
  ui.messages = [...ui.messages, line].slice(-MESSAGE_LINES);
}

// ---------------------------------------------------------------------------------------
// Selection and orders

const MODES = {
  move: { label: "Move", style: "move" },
  fire: { label: "Fire", style: "fire" },
  harvest: { label: "Harvest", style: "harvest" },
  heal: { label: "Repair", style: "heal" },
};

function targetsFor(view, mode, unitId) {
  if (mode === "move") return Object.keys(reachableHexes(view, unitId));
  if (mode === "fire") return attackTargets(view, unitId).map((id) => view.units[id].at);
  if (mode === "harvest") return harvestTargets(view, unitId);
  if (mode === "heal") return healTargets(view, unitId).map((id) => view.units[id].at);
  if (mode === "build") return buildSites(view, HUMAN);
  return [];
}

function defaultMode(view, unit) {
  if (!unit || unit.owner !== HUMAN || state.current !== HUMAN) return null;
  return Object.keys(MODES).find((m) => targetsFor(view, m, unit.id).length) || null;
}

function actionFor(view, mode, unitId, k) {
  const unitOn = Object.values(view.units).find((u) => u.at === k);
  if (mode === "move") return { type: "move", unitId, to: k };
  if (mode === "fire") return { type: "attack", unitId, targetId: unitOn.id };
  if (mode === "harvest") return { type: "harvest", unitId, at: k };
  if (mode === "heal") return { type: "heal", unitId, targetId: unitOn.id };
  if (mode === "build") return { type: "build", unitType: ui.buildType, at: k };
  return null;
}

function onHexTap(k) {
  if (!state || ui.busy) return;
  const view = viewFor(state, HUMAN);
  if (myTurn() && ui.mode && targetsFor(view, ui.mode, ui.selectedId).includes(k)) {
    act(actionFor(view, ui.mode, ui.selectedId, k));
    return;
  }
  const unit = Object.values(view.units).find((u) => u.at === k);
  ui.selectedId = unit ? unit.id : null;
  ui.mode = unit ? defaultMode(view, unit) : null;
  ui.buildType = null;
  render();
}

function onPanelClick(event) {
  const button = event.target.closest("button[data-order]");
  if (!button || button.disabled || !myTurn()) return;
  const { order, type } = button.dataset;
  const unitId = ui.selectedId;
  // With only one pile in reach there is nothing to choose, so Harvest acts at once.
  const view = viewFor(state, HUMAN);
  const piles = order === "harvest" ? targetsFor(view, "harvest", unitId) : [];
  if (piles.length === 1) {
    act(actionFor(view, "harvest", unitId, piles[0]));
  } else if (MODES[order]) {
    ui.mode = order;
    render();
  } else if (order === "build") {
    ui.mode = "build";
    ui.buildType = type;
    render();
  } else if (order === "unload" || order === "setUp" || order === "packUp") {
    act({ type: order, unitId });
  }
}

// ---------------------------------------------------------------------------------------
// Rendering

function render() {
  if (!state) return;
  const view = viewFor(state, HUMAN);
  const overlays = [];
  let notes = [];
  if (ui.mode && (ui.selectedId || ui.mode === "build")) {
    if (ui.mode === "fire") {
      overlays.push({ hexes: rangeHexes(view), style: "range" });
      notes = shotPreviews(view);
    }
    const style = ui.mode === "build" ? "build" : MODES[ui.mode].style;
    overlays.push({ hexes: targetsFor(view, ui.mode, ui.selectedId), style });
  }
  renderBoard(els.root, {
    view, selectedId: ui.selectedId, overlays, effects: ui.effects, notes,
  });
  renderBar(view);
  renderPanel(view);
  els.message.innerHTML = ui.messages.map((m) => `<span>${m}</span>`).join("");
}

// What firing at each target would do, adding to any damage it has taken this turn: flip it,
// destroy it, or bring the total to "total/defence" for another unit to finish.
function shotPreviews(view) {
  const unit = view.units[ui.selectedId];
  const attack = unitStats(view, unit).attack;
  return attackTargets(view, unit.id).map((id) => {
    const target = view.units[id];
    const { total, defence, lives } = livesAfterHit(view, target, attack);
    let text = lives === 0 ? "Destroy" : lives < target.lives ? "Flip" : `${total}/${defence}`;
    if (firesBack(view, unit, target)) text += " (fires back)";
    return { at: target.at, text };
  });
}

// Hexes within the selected unit's firing range, shown faintly behind the targets.
function rangeHexes(view) {
  const unit = view.units[ui.selectedId];
  const stats = unit && unitStats(view, unit);
  if (!stats || !stats.range) return [];
  const [minRange, maxRange] = stats.range;
  return Object.keys(view.map.hexes).filter((k) => {
    const d = distance(unit.at, k);
    return d >= minRange && d <= maxRange;
  });
}

function renderBar(view) {
  els.round.textContent = `Round ${view.round}`;
  els.turn.textContent = view.current === HUMAN ? "Your turn" : "Green's turn";
  els.turn.className = view.current === HUMAN ? "turn-blue" : "turn-green";
  els.crystals.textContent = view.players[HUMAN].crystals;
  els.endTurn.disabled = !myTurn();
}

function statLine(stats) {
  const range = stats.range ? stats.range.join("–").replace(/^(\d)–\1$/, "$1") : "-";
  const parts = [`Move ${stats.move}`, `Defence ${stats.defence}`];
  if (stats.attack) parts.push(`Attack ${stats.attack}`, `Range ${range}`);
  if (stats.storage) parts.push(`Storage ${stats.storage}`);
  if (stats.healing) parts.push(`Repair ${stats.healing}`);
  parts.push(`Sight ${stats.sight}`);
  return parts.join(" · ");
}

function orderButton(order, label, enabled, active = false, extra = "") {
  return `<button type="button" class="order${active ? " active" : ""}" data-order="${order}"` +
    `${extra}${enabled ? "" : " disabled"}>${label}</button>`;
}

function renderPanel(view) {
  const unit = view.units[ui.selectedId];
  if (!unit) {
    els.panel.innerHTML = `<p class="panel-hint">${myTurn()
      ? "Tap a unit to see its orders, or your factory to build. Drag to pan, pinch or " +
        "scroll to zoom."
      : "Green is taking its turn."}</p>`;
    return;
  }
  const stats = unitStats(view, unit);
  const mine = unit.owner === HUMAN;
  const lives = unit.lives < view.rules.lives ? "Damaged" : "Undamaged";
  const carrying = stats.storage ? ` · Carrying ${unit.carrying}/${stats.storage}` : "";
  const setUp = unit.setUp ? " · Set up" : "";
  const head = `<div class="panel-head">` +
    (stats.isFactory ? `<img src="units/factory.svg" alt="">`
      : `<img src="${unitImage(unit.type, unit.owner)}" alt="">`) +
    `<div><h2>${mine ? "Your" : "Green"} ${stats.name}</h2>` +
    `<p>${lives}${carrying}${setUp}</p><p class="stats">${statLine(stats)}</p></div></div>`;

  if (!mine) {
    els.panel.innerHTML = head;
    return;
  }

  let orders = "";
  if (stats.isFactory) {
    const crystals = view.players[HUMAN].crystals;
    const sites = buildSites(view, HUMAN).length > 0;
    orders = buildableTypes(view).map((type) => {
      const cost = view.rules.units[type].cost;
      const label = `<img src="${unitImage(type, HUMAN)}" alt="">${view.rules.units[type].name}` +
        `<span class="cost">${cost}</span>`;
      const active = ui.mode === "build" && ui.buildType === type;
      return orderButton("build", label, myTurn() && sites && cost <= crystals, active,
        ` data-type="${type}"`);
    }).join("");
    els.panel.innerHTML = `${head}<div class="orders build-orders">${orders}</div>`;
    return;
  }

  for (const mode in MODES) {
    if (mode === "harvest" && !stats.storage) continue;
    if (mode === "heal" && !stats.healing) continue;
    if (mode === "fire" && !stats.attack) continue;
    const enabled = myTurn() && targetsFor(view, mode, unit.id).length > 0;
    orders += orderButton(mode, MODES[mode].label, enabled, ui.mode === mode);
  }
  if (stats.storage) {
    orders += orderButton("unload", "Unload", myTurn() && canUnload(view, unit.id));
  }
  if (stats.needsSetup) {
    orders += unit.setUp
      ? orderButton("packUp", "Pack up", myTurn() && canPackUp(view, unit.id))
      : orderButton("setUp", "Set up", myTurn() && canSetUp(view, unit.id));
  }
  const finished = `<p class="panel-hint">Finished for this turn.</p>`;
  const done = unit.moved && unit.acted ? finished : "";
  els.panel.innerHTML = `${head}<div class="orders">${orders}</div>${done}`;
}

function showGameOver() {
  const { winner, reason } = state.result;
  els.overTitle.textContent =
    winner === HUMAN ? "You win" : winner === AI_PLAYER ? "Green wins" : "Draw";
  const loser = winner === null ? "" : `${PLAYER_COLOURS[1 - winner].name}: `;
  els.overText.textContent = `${loser}${REASONS[reason]} (round ${state.result.round}).`;
  els.over.hidden = false;
}

// ---------------------------------------------------------------------------------------
// Pan, zoom and taps

function fitBoard() {
  fitBox = boardBounds(state.map);
  viewBox = { ...fitBox };
  applyViewBox();
}

function applyViewBox() {
  const { x, y, width, height } = viewBox;
  els.svg.setAttribute("viewBox", `${x} ${y} ${width} ${height}`);
}

function toBoard(clientX, clientY) {
  const point = new DOMPoint(clientX, clientY).matrixTransform(
    els.svg.getScreenCTM().inverse());
  return [point.x, point.y];
}

// Zooms by factor around a board point, keeping that point under the finger or cursor.
function zoomAt(factor, [px, py]) {
  const width = Math.min(fitBox.width, Math.max(fitBox.width / MAX_ZOOM, viewBox.width * factor));
  const scale = width / viewBox.width;
  viewBox = {
    x: px - (px - viewBox.x) * scale,
    y: py - (py - viewBox.y) * scale,
    width,
    height: viewBox.height * scale,
  };
  clampView();
  applyViewBox();
}

function clampView() {
  const maxX = fitBox.x + fitBox.width - viewBox.width;
  const maxY = fitBox.y + fitBox.height - viewBox.height;
  viewBox.x = Math.min(Math.max(viewBox.x, Math.min(fitBox.x, maxX)), Math.max(fitBox.x, maxX));
  viewBox.y = Math.min(Math.max(viewBox.y, Math.min(fitBox.y, maxY)), Math.max(fitBox.y, maxY));
}

function wireBoardInput() {
  const svg = els.svg;
  const pointers = new Map();
  let dragged = false;
  let pinchStart = null;

  svg.addEventListener("pointerdown", (e) => {
    svg.setPointerCapture(e.pointerId);
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY, startX: e.clientX,
      startY: e.clientY, target: e.target });
    if (pointers.size === 1) dragged = false;
    if (pointers.size === 2) pinchStart = pinchState(pointers);
  });

  svg.addEventListener("pointermove", (e) => {
    const p = pointers.get(e.pointerId);
    if (!p) return;
    if (pointers.size === 2 && pinchStart) {
      p.x = e.clientX;
      p.y = e.clientY;
      const now = pinchState(pointers);
      zoomAt(pinchStart.distance / now.distance, toBoard(now.midX, now.midY));
      pinchStart = now;
      dragged = true;
      return;
    }
    const moved = Math.hypot(e.clientX - p.startX, e.clientY - p.startY);
    if (moved > DRAG_THRESHOLD_PX) dragged = true;
    if (dragged) {
      const [ax, ay] = toBoard(p.x, p.y);
      const [bx, by] = toBoard(e.clientX, e.clientY);
      viewBox.x -= bx - ax;
      viewBox.y -= by - ay;
      clampView();
      applyViewBox();
    }
    p.x = e.clientX;
    p.y = e.clientY;
  });

  const release = (e) => {
    const p = pointers.get(e.pointerId);
    pointers.delete(e.pointerId);
    if (pointers.size < 2) pinchStart = null;
    if (!p || dragged || e.type === "pointercancel") return;
    const hex = p.target.closest && p.target.closest("[data-hex]");
    if (hex) onHexTap(hex.dataset.hex);
  };
  svg.addEventListener("pointerup", release);
  svg.addEventListener("pointercancel", release);

  svg.addEventListener("wheel", (e) => {
    e.preventDefault();
    zoomAt(Math.exp(e.deltaY * WHEEL_ZOOM_RATE), toBoard(e.clientX, e.clientY));
  }, { passive: false });
}

function pinchState(pointers) {
  const [a, b] = [...pointers.values()];
  return { distance: Math.hypot(a.x - b.x, a.y - b.y) || 1,
    midX: (a.x + b.x) / 2, midY: (a.y + b.y) / 2 };
}
