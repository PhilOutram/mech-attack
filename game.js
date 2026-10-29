// Game screen: you (blue) against the AI (green). Renders the engine's view of the game and
// turns taps into engine actions. No rules here; every option shown comes from the engine.
import { RULES } from "./rules-config.js?v=0.29";
import { mapById, seededRandom } from "./maps.js?v=0.29";
import {
  newGame, applyAction, viewFor, reachableHexes, attackTargets, healTargets, harvestTargets,
  canSetUp, canPackUp, buildSites, buildableTypes, unitStats, livesAfterHit,
  firesBack, dropSites, factoryBuilds, upgradeOptions, crushingMoves, refreshKnowledge,
  STATE_FORMAT,
} from "./engine.js?v=0.29";
import { chooseAction, playout, DEFAULT_PERSONALITY } from "./ai.js?v=0.29";
import { EVOLVED_PERSONALITIES } from "./ai-personalities.js?v=0.29";
import { distance } from "./hex.js?v=0.29";
import {
  renderBoard, boardBounds, loadTiles, preloadArt, unitImage, facingAngle, PLAYER_COLOURS,
} from "./board.js?v=0.29";
import { confirmDialog } from "./dialog.js?v=0.29";
import { playSound, unlockSound, soundOn, setSoundOn } from "./sound.js?v=0.29";
import { showTip } from "./tips.js?v=0.29";
import { MISSIONS, missionRules, markMissionDone } from "./campaign.js?v=0.29";

const HUMAN = 0;
const AI_PLAYER = 1;
const SAVE_KEY = "mech-attack.save";
const RECENT_KEY = "mech-attack.recent-maps";
// Per-game extras kept beside the save: undos left and whether surrender was demanded.
const EXTRAS_KEY = "mech-attack.game-extras";
const RECENT_LIMIT = 8;
// Generated maps are numbered from 1 up to this when picked at random.
const NEW_MAP_RANGE = 99999;
const ASSET_VERSION = "0.29";
// Pause between AI actions you can see, and how long an explosion stays on screen.
const AI_STEP_MS = 450;
// A moving unit hops one hex at a time along its route, this long per hex.
const HOP_MS = 90;
// How long a banner such as "60 crystals unloaded" stays over the board.
const BANNER_MS = 1000;
const EFFECT_MS = 500;
// A pointer that moves further than this is panning the board, not tapping it.
const DRAG_THRESHOLD_PX = 8;
const MAX_ZOOM = 4;
const WHEEL_ZOOM_RATE = 0.0015;
const MAX_SEED = 2 ** 31;
const MESSAGE_LINES = 2;
const PERCENT = 100;

// Sounds (Phil, 29 October 2026). Air units fly with the helicopter clip, the Spotter Drone
// at half volume; Infantry march; other vehicles rumble like a tank. Small guns use the
// infantry burst, everything else the tank shot.
const DRONE_VOLUME = 0.5;
const SMALL_GUNS = ["infantry", "scoutBike", "antiAircraftJeep"];

// The sound a unit type makes moving, as [clip, volume].
function moveSound(type) {
  if (RULES.units[type].air) return ["flying", type === "spotterDrone" ? DRONE_VOLUME : 1];
  return [type === "infantry" ? "footsteps" : "tankMoving", 1];
}

function fireSound(type) {
  return [SMALL_GUNS.includes(type) ? "infantryFiring" : "tankFiring", 1];
}

const REASONS = {
  factoryDestroyed: "the home factory was destroyed",
  factoryCaptured: "the home factory was captured",
  noFactories: "no factories left",
  noUnits: "no units left and not enough crystals to build one",
  roundCap: "the round limit was reached",
  resigned: "quit the game",
  objective: "the mission objective was met",
};

let state = null;
// moving: a unit part way along its route while its move is shown, { unit, at, hidden }.
const ui = { selectedId: null, mode: null, buildType: null, busy: false, effects: [],
  messages: [], moving: null };
// Which way each unit faces (unitId -> angle), from its last move; display only.
let facing = {};
// Undo: states before each of your actions this turn, and how many undos the game has left.
let history = [];
let undosLeft = 0;
// Demand surrender can be used once per game.
let surrenderUsed = false;
// The AI's personality for this game.
let aiPersonality = DEFAULT_PERSONALITY;
let fitBox = null;
let viewBox = null;
let els = null;
let wired = false;
let leaveGame = null;

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

// Undos left in the current game, kept with an id for the game so a new game starts afresh.
function gameId() {
  return `${state.map.id}:${state.seed}`;
}

// Undos left and whether surrender was demanded, for the current game; a new game starts
// afresh.
function loadExtras() {
  try {
    const saved = JSON.parse(localStorage.getItem(EXTRAS_KEY));
    if (saved && saved.game === gameId()) {
      undosLeft = saved.undosLeft;
      surrenderUsed = saved.surrenderUsed;
      return;
    }
  } catch {
    // Unreadable: fall through to a fresh start.
  }
  undosLeft = RULES.undosPerGame;
  surrenderUsed = false;
}

function saveExtras() {
  try {
    localStorage.setItem(EXTRAS_KEY,
      JSON.stringify({ game: gameId(), undosLeft, surrenderUsed }));
  } catch {
    // Storage can be full or blocked; the game carries on until the page is closed.
  }
}

// Maps played recently, newest first: [{ id, name, wins, losses }].
export function recentMaps() {
  try {
    const list = JSON.parse(localStorage.getItem(RECENT_KEY));
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

function noteMap(map, result = null) {
  const list = recentMaps();
  const entry = list.find((m) => m.id === map.id) || { id: map.id, name: map.name,
    wins: 0, losses: 0 };
  if (result) {
    if (result.winner === HUMAN) entry.wins += 1;
    else if (result.winner === AI_PLAYER) entry.losses += 1;
  }
  const rest = list.filter((m) => m.id !== map.id);
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify([entry, ...rest].slice(0, RECENT_LIMIT)));
  } catch {
    // Storage can be full or blocked; the list is only a convenience.
  }
}

// The AI's personality for a game: one of the evolved ones, picked by the game's seed so a
// resumed game keeps the same opponent. Genes an evolved personality lacks (bred before the
// gene existed) come from the default.
function personalityFor(seed) {
  const list = EVOLVED_PERSONALITIES;
  if (!list.length) return DEFAULT_PERSONALITY;
  return { ...DEFAULT_PERSONALITY, ...list[seed % list.length].personality };
}

// A new random map id of the given shape ("classic" or e.g. "3-4-4-3").
export function newMapId(shape = "classic") {
  const number = 1 + Math.floor(Math.random() * NEW_MAP_RANGE);
  return shape === "classic" ? `map-${number}` : `map-${number}-${shape}`;
}

// The shape of a map id, so New game keeps the shape just played.
function shapeOf(mapId) {
  const match = /^map-\d+-(.+)$/.exec(mapId);
  return match ? match[1] : "classic";
}

// ---------------------------------------------------------------------------------------
// Starting and leaving

// Opens the game screen: the saved game when resume is set, otherwise a new game on mapId.
// Opens the game screen: the saved game when resume is set, otherwise a new game on mapId, or
// campaign mission number mission (0-based).
export async function openGame({ resume = false, mapId = "fixed-1", mission = null, onLeave }) {
  els = els || findElements();
  if (!wired) wire(onLeave);
  state = resume ? loadSave() : null;
  let briefing = false;
  if (!state) {
    const seed = Math.floor(Math.random() * MAX_SEED);
    if (mission !== null) {
      const m = MISSIONS[mission];
      const rules = missionRules(m, RULES);
      const game = newGame({ rules, map: mapById(m.mapId, rules), seed, firstPlayer: HUMAN,
        setup: m.setup });
      state = { ...game, campaign: { mission } };
      briefing = true;
    } else {
      const map = mapById(mapId, RULES);
      state = newGame({ rules: RULES, map, seed, firstPlayer: HUMAN });
      noteMap(map);
    }
    save();
  }
  const m = missionOf(state);
  aiPersonality = m && m.ai === "default" ? DEFAULT_PERSONALITY : personalityFor(state.seed);
  Object.assign(ui, { selectedId: null, mode: null, buildType: null, busy: false,
    effects: [], messages: ["Tap one of your units to give it orders."], moving: null });
  facing = {};
  history = [];
  if (resume) {
    loadExtras();
  } else {
    undosLeft = RULES.undosPerGame;
    surrenderUsed = false;
  }
  saveExtras();
  els.screen.hidden = false;
  els.over.hidden = true;
  preloadArt();
  await loadTiles(ASSET_VERSION);
  fitBoard();
  render();
  if (briefing && !(await showBriefing(m, state.campaign.mission))) {
    leaveGame();
    return;
  }
  tip("welcome");
  render();
  if (state.current === AI_PLAYER) runAiTurn();
}

// ---------------------------------------------------------------------------------------
// Campaign

function missionOf(s) {
  return s && s.campaign ? MISSIONS[s.campaign.mission] : null;
}

// The mission's story and objective before it starts. Resolves false if the player goes back.
function showBriefing(m, index) {
  return confirmDialog({
    title: `Mission ${index + 1}: ${m.title}`,
    text: `${m.story}

Objective: ${m.objective}`,
    confirm: "Start",
    cancel: "Back",
  });
}

// A mission whose objective is met is won at once.
function checkObjective() {
  const m = missionOf(state);
  if (!m || !m.done || state.result || !m.done(state)) return;
  state = { ...state, result: { winner: HUMAN, reason: "objective", round: state.round } };
}

function findElements() {
  const $ = (id) => document.getElementById(id);
  return {
    screen: $("game"), svg: $("board"), root: $("board-root"), round: $("game-round"),
    banner: $("game-banner"),
    turn: $("game-turn"), crystals: $("game-crystals"), endTurn: $("end-turn"),
    home: $("game-home"), message: $("game-message"), panel: $("unit-panel"),
    over: $("game-over"), overTitle: $("game-over-title"), overText: $("game-over-text"),
    again: $("play-again"), newMap: $("play-new-map"), toTitle: $("game-over-home"),
    quit: $("quit-game"), sound: $("sound-toggle"),
  };
}

function wire(onLeave) {
  wired = true;
  const leave = () => {
    els.screen.hidden = true;
    onLeave();
  };
  leaveGame = leave;
  els.home.addEventListener("click", leave);
  els.toTitle.addEventListener("click", leave);
  // In the campaign: retry the mission, or go on to the next one.
  els.again.addEventListener("click", () => openGame(state.campaign
    ? { mission: state.campaign.mission, onLeave } : { mapId: state.map.id, onLeave }));
  els.newMap.addEventListener("click", () => openGame(state.campaign
    ? { mission: state.campaign.mission + 1, onLeave }
    : { mapId: newMapId(shapeOf(state.map.id)), onLeave }));
  els.endTurn.addEventListener("click", async () => {
    if (!myTurn()) return;
    await act({ type: "endTurn" });
    runAiTurn();
  });
  els.quit.addEventListener("click", quitGame);
  // Phones play sound only after a tap, so the first tap anywhere starts it.
  document.addEventListener("pointerdown", unlockSound, { passive: true });
  els.sound.addEventListener("click", () => {
    setSoundOn(!soundOn());
    renderSoundButton();
  });
  renderSoundButton();
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

async function act(action) {
  const before = viewFor(state, HUMAN);
  const previous = state;
  try {
    state = applyAction(state, action);
  } catch (error) {
    say(error.message.replace(/^Illegal action: /, "Not allowed: "));
    render();
    return false;
  }
  checkObjective();
  // Undo can step back through this turn's actions; ending the turn closes them off.
  if (action.type === "endTurn") history = [];
  else history.push(previous);
  const after = viewFor(state, HUMAN);
  showEvents(state.events, before, after);
  save();
  ui.busy = true;
  await showMoves(state.events, before, after);
  ui.busy = false;
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

// Takes back your last action this turn. What it revealed stays revealed: you cannot un-see
// a block you have turned over, just as on the table. Crystals the action drove over come
// back.
function undo() {
  if (!myTurn() || !history.length || undosLeft <= 0) return;
  const previous = history.pop();
  const knew = state.players[HUMAN];
  state = {
    ...previous,
    players: previous.players.map((player, p) => (p !== HUMAN ? player : {
      ...player,
      revealed: { ...knew.revealed },
      explored: { ...knew.explored },
      seenCrystals: { ...knew.seenCrystals },
      seenFactories: { ...knew.seenFactories },
    })),
    events: [],
  };
  // What you see now comes from the restored board, so squashed crystals reappear.
  refreshKnowledge(state);
  undosLeft -= 1;
  saveExtras();
  save();
  ui.selectedId = null;
  ui.mode = null;
  ui.buildType = null;
  say(`Undone. ${undosLeft} undo${undosLeft === 1 ? "" : "s"} left this game.`);
  render();
}

// Demand surrender (once per game): the AI plays the game on from here several times and
// surrenders if it wins too few of them.
async function demandSurrender() {
  if (!myTurn() || surrenderUsed) return;
  surrenderUsed = true;
  saveExtras();
  ui.busy = true;
  say("Green is considering your demand…");
  render();
  const random = seededRandom(state.seed + state.round);
  const personalities = [];
  personalities[HUMAN] = DEFAULT_PERSONALITY;
  personalities[AI_PLAYER] = aiPersonality;
  let total = 0;
  for (let i = 0; i < RULES.surrenderPlayouts; i++) {
    total += playout(state, AI_PLAYER, personalities, random);
    await sleep(0); // let the screen breathe between playouts
  }
  ui.busy = false;
  const chance = total / RULES.surrenderPlayouts;
  if (chance < RULES.surrenderBelow) {
    state = applyAction(state, { type: "resign", player: AI_PLAYER });
    history = [];
    save();
    render();
    showGameOver();
    return;
  }
  say(`Green refuses: it rates its chances at ${Math.round(chance * PERCENT)}%.`);
  render();
}

// Quit: asks first, then ends the game as a loss for you.
async function quitGame() {
  if (!state || state.result) return;
  const sure = await confirmDialog({
    title: "Quit this game?",
    text: "Quitting counts as a loss on this map.",
    confirm: "Quit",
    cancel: "Keep playing",
  });
  if (!sure || !state || state.result) return;
  state = applyAction(state, { type: "resign", player: HUMAN });
  history = [];
  save();
  render();
  showGameOver();
}

async function runAiTurn() {
  if (!state || state.result || state.current !== AI_PLAYER) return;
  ui.busy = true;
  ui.selectedId = null;
  ui.mode = null;
  say("Green is moving…");
  render();
  // A fault in the AI or in showing its moves must never leave Green's turn stuck: an AI
  // action that fails ends its turn, and a display fault is logged and skipped.
  while (!state.result && state.current === AI_PLAYER) {
    const before = viewFor(state, HUMAN);
    try {
      state = applyAction(state, chooseAction(viewFor(state, AI_PLAYER), aiPersonality));
    } catch (error) {
      console.error(error);
      state = applyAction(state, { type: "endTurn" });
    }
    checkObjective();
    let seen = false;
    try {
      const after = viewFor(state, HUMAN);
      seen = showEvents(state.events, before, after);
      await showMoves(state.events, before, after);
      if (seen) render();
    } catch (error) {
      console.error(error);
    }
    if (seen) await sleep(AI_STEP_MS);
  }
  ui.busy = false;
  save();
  if (!state.result) say(`Round ${state.round}: your turn.`);
  render();
  if (state.result) showGameOver();
}

// Shows each move hex by hex along its route, turning the unit to face the way it goes. A
// Green unit is drawn only on hexes you can see.
async function showMoves(events, before, after) {
  const seen = (k) => before.visible[k] || after.visible[k];
  for (const e of events) {
    if (e.type !== "move" || !e.path.length) continue;
    const unit = before.units[e.unitId] || after.units[e.unitId];
    if (!unit || !(seen(e.from) || e.path.some(seen))) continue;
    let from = e.from;
    for (const k of e.path) {
      facing[unit.id] = facingAngle(from, k);
      ui.moving = { unit, at: k, hidden: unit.owner !== HUMAN && !seen(k) };
      render();
      await sleep(HOP_MS);
      from = k;
    }
    ui.moving = null;
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ---------------------------------------------------------------------------------------
// Events: messages and explosions for what blue can see

const OWNER_WORDS = { [HUMAN]: "Your", [AI_PLAYER]: "Green", null: "Unused" };

function unitName(view, unitId, fallbackType, owner) {
  const unit = view.units[unitId];
  const type = unit ? unit.type : fallbackType;
  const who = OWNER_WORDS[unit ? unit.owner : owner];
  return `${who} ${type ? RULES.units[type].name : "unit"}`;
}

// Returns true if blue could see any of it. Plays the sounds of what blue saw, each clip once.
function showEvents(events, before, after) {
  const seen = (k) => before.visible[k] || after.visible[k];
  const typeOf = (unitId) => (before.units[unitId] || after.units[unitId] || {}).type;
  const effects = [];
  const lines = [];
  const sounds = new Map();
  let unloaded = 0;
  const sound = (clip) => {
    if (clip) sounds.set(clip[0], Math.max(clip[1], sounds.get(clip[0]) || 0));
  };
  let any = false;
  for (const e of events) {
    if (["fire", "returnFire", "splash", "lineHit"].includes(e.type)) {
      const from = (before.units[e.unitId] || after.units[e.unitId] || {}).at;
      const to = (before.units[e.targetId] || after.units[e.targetId] || {}).at;
      if (!seen(from) && !seen(to)) continue;
      any = true;
      if (e.type === "fire" || e.type === "returnFire") sound(fireSound(typeOf(e.unitId)));
      if (from && seen(from)) effects.push({ at: from, size: 0.42 });
      if (to && seen(to)) effects.push({ at: to, size: 0.75 });
      const verb = { fire: "fired on", returnFire: "returned fire on",
        splash: "caught in the blast:", lineHit: "also hit by the sonic boom:" }[e.type];
      lines.push(e.type === "splash" || e.type === "lineHit"
        ? `${unitName(before, e.targetId)} ${verb} ${e.attack}.`
        : `${unitName(before, e.unitId)} ${verb} ${unitName(before, e.targetId)} ` +
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
      if (e.path.some(seen) || seen(e.from)) {
        any = true;
        if (e.path.length) sound(moveSound(typeOf(e.unitId)));
      }
      const mover = before.units[e.unitId];
      if (mover && mover.owner === HUMAN && !unitStats(before, mover).air &&
        e.path.some((k) => after.map.hexes[k].terrain === "rocky")) tip("rough");
      // Only your own units say so; a Green unit stopped out of sight is not in your view.
      if (e.stoppedBy === "unit" && after.units[e.unitId]?.owner === HUMAN) {
        lines.push("Something hidden blocked the way.");
      }
    } else if (e.type === "crushed" && seen(e.at)) {
      lines.push(`${e.amount} crystals crushed.`);
    } else if (e.type === "crystalsExploded" && seen(e.at)) {
      tip("explosion");
      any = true;
      effects.push({ at: e.at, size: 0.9 });
      lines.push(`A crystal pile reached ${e.amount} and exploded.`);
    } else if (e.type === "harvest" && after.units[e.unitId]?.owner === HUMAN) {
      lines.push(`Harvested ${e.amount} crystals.`);
    } else if (e.type === "unload" && after.units[e.unitId]?.owner === HUMAN) {
      lines.push(`Unloaded ${e.amount} crystals${e.automatic ? " at the factory" : ""}.`);
      unloaded += e.amount;
    } else if (e.type === "build" && (after.units[e.unitId]?.owner === HUMAN || seen(e.at))) {
      any = true;
      lines.push(`${unitName(after, e.unitId)} built.`);
    } else if (e.type === "heal" && seen(after.units[e.unitId]?.at)) {
      lines.push(`${unitName(after, e.targetId)} repaired.`);
    } else if (e.type === "capture" && (seen(e.at) || e.from === HUMAN)) {
      any = true;
      sound(["capture", 1]);
      const whose = e.from === null ? "an unused" : e.from === HUMAN ? "your" : "Green's";
      lines.push(`${e.owner === HUMAN ? "Your infantry" : "Green's infantry"} captured ` +
        `${whose} factory.`);
    } else if (e.type === "board" && seen(e.at)) {
      any = true;
      lines.push(`Infantry boarded ${unitName(after, e.transporterId).toLowerCase()}.`);
    } else if (e.type === "drop" && seen(e.at)) {
      any = true;
      lines.push(`${unitName(after, e.transporterId)} dropped off infantry.`);
    } else if (e.type === "factoryIncome" && e.player === HUMAN) {
      lines.push(`Captured factories paid ${e.amount} crystals.`);
    } else if (e.type === "upgrade" && seen(e.at)) {
      any = true;
      const upgrade = RULES.factoryUpgrades[e.upgrade].name;
      lines.push(`${unitName(after, e.factoryId)} added ${upgrade}.`);
    }
  }
  for (const line of lines) say(line);
  if (effects.length) flash(effects);
  for (const [clip, volume] of sounds) playSound(clip, volume);
  if (unloaded) showBanner(`${unloaded} crystals unloaded`);
  return any;
}

// A short message over the board, gone after BANNER_MS.
let bannerTimer = null;

function showBanner(text) {
  els.banner.textContent = text;
  els.banner.hidden = false;
  // Restart the fade-in when banners come one after another.
  els.banner.classList.remove("show");
  void els.banner.offsetWidth;
  els.banner.classList.add("show");
  clearTimeout(bannerTimer);
  bannerTimer = setTimeout(() => { els.banner.hidden = true; }, BANNER_MS);
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
  drop: { label: "Drop off", style: "move" },
};

function targetsFor(view, mode, unitId) {
  if (mode === "move") return Object.keys(reachableHexes(view, unitId));
  if (mode === "fire") return attackTargets(view, unitId).map((id) => view.units[id].at);
  if (mode === "harvest") return harvestTargets(view, unitId);
  if (mode === "heal") return healTargets(view, unitId).map((id) => view.units[id].at);
  if (mode === "drop") return dropSites(view, unitId);
  if (mode === "build") {
    // Next to the selected factory only.
    const factory = view.units[unitId];
    return buildSites(view, HUMAN, ui.buildType).filter((k) => distance(k, factory.at) === 1);
  }
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
  if (mode === "drop") return { type: "drop", unitId, at: k };
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

// ---------------------------------------------------------------------------------------
// Helper popups: each shows once, the first time the player meets that part of the game.
// Tips noticed during Green's turn wait for yours.

let pendingTips = [];

function tip(id) {
  pendingTips.push(id);
}

// The tips for what is selected and shown now, plus any waiting; called after each render.
function offerTips(view) {
  if (!myTurn()) return;
  const unit = view.units[ui.selectedId];
  if (unit) {
    const stats = unitStats(view, unit);
    if (unit.owner === null) tip("unusedFactory");
    if (unit.owner === HUMAN) {
      if (stats.isFactory) tip("factory");
      if (stats.storage) tip("harvester");
      if (stats.captures) tip("infantry");
      if (stats.carries) tip("transporter");
      if (stats.needsSetup) tip("artillery");
      if (stats.healing) tip("medic");
      if (stats.air) tip("air");
    }
  }
  if (ui.mode === "fire") tip("combat");
  if (ui.mode === "move" && crushingMoves(view, ui.selectedId).length) tip("crystals");
  const ids = pendingTips;
  pendingTips = [];
  for (const id of ids) showTip(id, RULES);
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
  } else if (order === "setUp" || order === "packUp") {
    act({ type: order, unitId });
  } else if (order === "upgrade") {
    act({ type: "upgrade", factoryId: unitId, upgrade: type });
  } else if (order === "undo") {
    undo();
  } else if (order === "surrender") {
    demandSurrender();
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
    let targets = targetsFor(view, ui.mode, ui.selectedId);
    if (ui.mode === "move") {
      // Moves that can only be made by driving over crystals (destroying them) show yellow.
      const crushing = crushingMoves(view, ui.selectedId);
      overlays.push({ hexes: crushing, style: "crush" });
      targets = targets.filter((k) => !crushing.includes(k));
    }
    overlays.push({ hexes: targets, style });
  }
  renderBoard(els.root, {
    view, selectedId: ui.selectedId, overlays, effects: ui.effects, notes, facing,
    moving: ui.moving,
  });
  renderBar(view);
  renderPanel(view);
  els.message.innerHTML = ui.messages.map((m) => `<span>${m}</span>`).join("");
  offerTips(view);
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
    const stats = unitStats(view, unit);
    if (stats.splash) text += " + blast";
    if (stats.line) text += " + line";
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

// A speaker icon, crossed out when sound is off.
const SPEAKER = '<path d="M3 9h4l5-4v14l-5-4H3z" fill="currentColor"/>';
const SOUND_WAVES = '<path d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" ' +
  'fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>';
const SOUND_CROSS = '<path d="M16 9l6 6M22 9l-6 6" stroke="currentColor" stroke-width="2" ' +
  'stroke-linecap="round"/>';

function renderSoundButton() {
  const on = soundOn();
  els.sound.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true">${SPEAKER}` +
    `${on ? SOUND_WAVES : SOUND_CROSS}</svg>`;
  els.sound.setAttribute("aria-pressed", String(on));
  els.sound.setAttribute("aria-label", on ? "Sound on" : "Sound off");
  els.sound.title = on ? "Sound on (tap to turn off)" : "Sound off (tap to turn on)";
}

function renderBar(view) {
  const m = missionOf(state);
  const name = m ? `Mission ${state.campaign.mission + 1}: ${m.title}` : view.map.name;
  els.round.innerHTML = `<span class="map-name">${name} · </span>Round ${view.round}`;
  els.turn.textContent = view.current === HUMAN ? "Your turn" : "Green's turn";
  els.turn.className = view.current === HUMAN ? "turn-blue" : "turn-green";
  els.crystals.textContent = view.players[HUMAN].crystals;
  els.endTurn.disabled = !myTurn();
}

const HITS = { ground: "ground", air: "air only", both: "ground and air" };

function statLine(stats) {
  const range = stats.range ? stats.range.join("–").replace(/^(\d)–\1$/, "$1") : "-";
  const parts = [];
  if (stats.air) parts.push("Flies");
  parts.push(`Move ${stats.move}`, `Defence ${stats.defence}`);
  if (stats.attack) {
    const hits = HITS[stats.hits || "ground"];
    parts.push(`Attack ${stats.attack}`, `Range ${range}`, `Hits ${hits}`);
  }
  if (stats.splash) parts.push("Cluster bomb");
  if (stats.line) parts.push("Sonic boom");
  if (stats.reload) parts.push("Fires every other turn");
  if (stats.storage) parts.push(`Storage ${stats.storage}`);
  if (stats.healing) parts.push(`Repair ${stats.healing}`);
  if (stats.captures) parts.push("Captures factories");
  if (stats.carries) parts.push(`Carries ${stats.carries} infantry`);
  parts.push(`Sight ${stats.sight}`);
  return parts.join(" · ");
}

// What a factory upgrade unlocks, e.g. "Heavy Cannon, Blast Cannon, Sonic Tank".
function unlocks(upgrade) {
  return Object.values(RULES.units).filter((s) => s.needs === upgrade).map((s) => s.name)
    .join(", ");
}

// A factory's panel: its upgrades, then the units it can build. Unused and enemy factories
// show only what they are.
function factoryPanel(view, unit, head) {
  if (unit.owner !== HUMAN) {
    const hint = unit.owner === null ? "Move infantry into it to capture it." : "";
    els.panel.innerHTML = `${head}<p class="panel-hint">${hint}</p>`;
    return;
  }
  const crystals = view.players[HUMAN].crystals;
  const upgradeOrders = upgradeOptions(view, unit.id).map((upgrade) => {
    const { name: upgradeName, cost } = RULES.factoryUpgrades[upgrade];
    const label = `Add ${upgradeName}<span class="cost">${cost}</span>`;
    return orderButton("upgrade", label, myTurn() && cost <= crystals, false,
      ` data-type="${upgrade}" title="Unlocks ${unlocks(upgrade)}"`);
  }).join("");
  const buildOrders = buildableTypes(view).filter((type) => factoryBuilds(view, unit, type))
    .map((type) => {
      const cost = view.rules.units[type].cost;
      const label = `<img src="${unitImage(type, HUMAN)}" alt="">` +
        `${view.rules.units[type].name}<span class="cost">${cost}</span>`;
      const sites = buildSites(view, HUMAN, type).some((k) => distance(k, unit.at) === 1);
      const active = ui.mode === "build" && ui.buildType === type;
      const air = view.rules.units[type].air ? " data-air" : "";
      return orderButton("build", label, myTurn() && sites && cost <= crystals, active,
        ` data-type="${type}"${air}`);
    }).join("");
  els.panel.innerHTML = `${head}<div class="orders build-orders">${upgradeOrders}` +
    `${buildOrders}</div><div class="orders">${undoButton()}</div>`;
}

function orderButton(order, label, enabled, active = false, extra = "") {
  return `<button type="button" class="order${active ? " active" : ""}" data-order="${order}"` +
    `${extra}${enabled ? "" : " disabled"}>${label}</button>`;
}

// Undo sits with the orders; it shows how many undos the game has left.
function undoButton() {
  const enabled = myTurn() && history.length > 0 && undosLeft > 0;
  return orderButton("undo", `Undo (${undosLeft})`, enabled);
}

function renderPanel(view) {
  const unit = view.units[ui.selectedId];
  if (!unit) {
    const m = missionOf(state);
    let objective = m ? `<p class="panel-objective">Objective: ${m.objective}</p>` : "";
    if (m && m.steps) {
      objective += `<ol class="mission-steps">${m.steps.map((step) =>
        `<li${step.done(state) ? ' class="done"' : ""}>${step.text}</li>`).join("")}</ol>`;
    }
    const hint = myTurn()
      ? "Tap a unit to see its orders, or your factory to build. Drag to pan, pinch or " +
        "scroll to zoom."
      : "Green is taking its turn.";
    const undo = history.length ? undoButton() : "";
    const surrender = orderButton("surrender",
      surrenderUsed ? "Surrender demanded" : "Demand surrender", myTurn() && !surrenderUsed);
    els.panel.innerHTML = `${objective}<p class="panel-hint">${hint}</p>` +
      `<div class="orders">${undo}${surrender}</div>`;
    return;
  }
  const stats = unitStats(view, unit);
  const mine = unit.owner === HUMAN;
  const status = [unit.lives < view.rules.lives ? "Damaged" : "Undamaged"];
  let name = `${OWNER_WORDS[unit.owner]} ${stats.name}`;
  if (stats.isFactory) {
    const home = view.players.some((p) => p.factoryId === unit.id);
    name = `${OWNER_WORDS[unit.owner]} ${home ? "home factory" : "factory"}`;
    const upgrades = unit.upgrades.map((u) => RULES.factoryUpgrades[u].name);
    status.push(upgrades.length ? upgrades.join(" · ") : "Light units only");
    const income = view.rules.capture.incomePerTurn;
    if (!home && unit.owner !== null && income) status.push(`Pays ${income} a turn`);
  }
  if (stats.storage) status.push(`Carrying ${unit.carrying}/${stats.storage}`);
  if (stats.carries) status.push(`Infantry on board ${unit.cargo.length}/${stats.carries}`);
  if (unit.setUp) status.push("Set up");
  if (unit.cooldown > 0) status.push("Reloading");
  const image = stats.isFactory ? "units/factory.svg" : unitImage(unit.type, unit.owner);
  // The stats run full width under the name, so they stay on a line or two on a phone.
  const head = `<div class="panel-head"><img src="${image}" alt="">` +
    `<div><h2>${name}</h2><p>${status.join(" · ")}</p></div></div>` +
    `<p class="unit-stats">${statLine(stats)}</p>`;

  if (stats.isFactory) {
    factoryPanel(view, unit, head);
    return;
  }
  if (!mine) {
    els.panel.innerHTML = head;
    return;
  }

  let orders = "";
  for (const mode in MODES) {
    if (mode === "harvest" && !stats.storage) continue;
    if (mode === "heal" && !stats.healing) continue;
    if (mode === "fire" && !stats.attack) continue;
    if (mode === "drop" && !stats.carries) continue;
    const enabled = myTurn() && targetsFor(view, mode, unit.id).length > 0;
    orders += orderButton(mode, MODES[mode].label, enabled, ui.mode === mode);
  }
  if (stats.needsSetup) {
    orders += unit.setUp
      ? orderButton("packUp", "Pack up", myTurn() && canPackUp(view, unit.id))
      : orderButton("setUp", "Set up", myTurn() && canSetUp(view, unit.id));
  }
  orders += undoButton();
  const finished = `<p class="panel-hint">Finished for this turn.</p>`;
  const done = unit.moved && unit.acted ? finished : "";
  els.panel.innerHTML = `${head}<div class="orders">${orders}</div>${done}`;
}

function showGameOver() {
  const { winner, reason } = state.result;
  const m = missionOf(state);
  if (!m) noteMap(state.map, state.result);
  els.overTitle.textContent =
    winner === HUMAN ? "You win" : winner === AI_PLAYER ? "Green wins" : "Draw";
  const round = `(round ${state.result.round})`;
  const loser = winner === null ? "" : `${PLAYER_COLOURS[1 - winner].name}: `;
  let text = `${loser}${REASONS[reason]} ${round}.`;
  if (reason === "resigned") {
    text = winner === AI_PLAYER ? `You quit ${round}.` : `Green surrendered ${round}.`;
  }
  els.again.textContent = m ? "Retry mission" : "Replay this map";
  els.newMap.textContent = m ? "Next mission" : "New game";
  els.newMap.hidden = false;
  if (m) {
    const index = state.campaign.mission;
    const last = index === MISSIONS.length - 1;
    const won = winner === HUMAN;
    if (won) markMissionDone(index);
    els.overTitle.textContent = won ? "Mission complete" : "Mission failed";
    if (won && reason === "objective") text = `Objective met ${round}.`;
    if (won) {
      text += last ? " The Consortium is beaten: Kharon's crystals are yours."
        : " The next mission is unlocked.";
    }
    els.newMap.hidden = !won || last;
  }
  els.overText.textContent = text;
  els.over.hidden = false;
}

// ---------------------------------------------------------------------------------------
// Pan, zoom and taps

// viewBox is where the player has panned and zoomed to; shown is the viewBox last written to
// the SVG. Writing the viewBox makes the browser redraw every tile and token at the new scale,
// which is slow on a phone, so during a drag or pinch only a CSS transform on the SVG changes
// (the phone slides and scales the picture it has already drawn, once per frame) and the
// viewBox is written when the gesture ends. Touch points are turned into board coordinates
// from the SVG's box measured when the gesture starts, so no layout is forced mid-gesture.
let shown = null;
let boardBox = null;
let frameRequest = null;
let wheelTimer = null;
// After the last wheel step, the zoom is committed (redrawn sharp) after this pause.
const WHEEL_COMMIT_MS = 150;

function fitBoard() {
  fitBox = boardBounds(state.map);
  viewBox = { ...fitBox };
  commitView();
}

// Writes the viewBox (the board redraws sharp) and drops the gesture transform.
function commitView() {
  clearTimeout(wheelTimer);
  cancelAnimationFrame(frameRequest);
  frameRequest = null;
  shown = { ...viewBox };
  els.svg.setAttribute("viewBox", `${shown.x} ${shown.y} ${shown.width} ${shown.height}`);
  els.svg.style.transform = "";
  boardBox = els.svg.getBoundingClientRect();
}

// How the browser lays a viewBox out in the SVG's box (preserveAspectRatio xMidYMid meet):
// screen pixels per board unit, and where the drawing starts inside the box.
function layoutOf(box) {
  const scale = Math.min(boardBox.width / box.width, boardBox.height / box.height);
  return { scale, dx: (boardBox.width - box.width * scale) / 2,
    dy: (boardBox.height - box.height * scale) / 2 };
}

// A point on the screen in board coordinates, for the current view.
function toBoard(clientX, clientY) {
  const { scale, dx, dy } = layoutOf(viewBox);
  return [viewBox.x + (clientX - boardBox.left - dx) / scale,
    viewBox.y + (clientY - boardBox.top - dy) / scale];
}

// Shows the current view as a transform of what was last drawn, on the next frame.
function showView() {
  if (frameRequest) return;
  frameRequest = requestAnimationFrame(() => {
    frameRequest = null;
    const from = layoutOf(shown);
    const to = layoutOf(viewBox);
    const k = to.scale / from.scale;
    const tx = to.dx - k * from.dx + to.scale * (shown.x - viewBox.x);
    const ty = to.dy - k * from.dy + to.scale * (shown.y - viewBox.y);
    els.svg.style.transform = `translate(${tx}px, ${ty}px) scale(${k})`;
  });
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
  showView();
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
    if (!pointers.size) commitView();
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
      showView();
    }
    p.x = e.clientX;
    p.y = e.clientY;
  });

  const release = (e) => {
    const p = pointers.get(e.pointerId);
    pointers.delete(e.pointerId);
    if (pointers.size < 2) pinchStart = null;
    // The last finger up ends the gesture: draw the board sharp at its new view straight away.
    if (!pointers.size && dragged) commitView();
    if (!p || dragged || e.type === "pointercancel") return;
    const hex = p.target.closest && p.target.closest("[data-hex]");
    if (hex) onHexTap(hex.dataset.hex);
  };
  svg.addEventListener("pointerup", release);
  svg.addEventListener("pointercancel", release);

  svg.addEventListener("wheel", (e) => {
    e.preventDefault();
    zoomAt(Math.exp(e.deltaY * WHEEL_ZOOM_RATE), toBoard(e.clientX, e.clientY));
    clearTimeout(wheelTimer);
    wheelTimer = setTimeout(commitView, WHEEL_COMMIT_MS);
  }, { passive: false });
}

function pinchState(pointers) {
  const [a, b] = [...pointers.values()];
  return { distance: Math.hypot(a.x - b.x, a.y - b.y) || 1,
    midX: (a.x + b.x) / 2, midY: (a.y + b.y) / 2 };
}
