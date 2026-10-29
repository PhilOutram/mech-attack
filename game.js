// Game screen: you (blue) against the AI (green). Renders the engine's view of the game and
// turns taps into engine actions. No rules here; every option shown comes from the engine.
import { RULES } from "./rules-config.js?v=0.48";
import { mapById, seededRandom } from "./maps.js?v=0.48";
import {
  newGame, applyAction, viewFor, reachableHexes, attackTargets, healTargets, harvestTargets,
  canSetUp, canPackUp, buildSites, buildableTypes, unitStats, livesAfterHit,
  firesBack, dropSites, factoryBuilds, upgradeOptions, crushingMoves, refreshKnowledge,
  defenceOf, darkTargets, canCapture,
  STATE_FORMAT,
} from "./engine.js?v=0.48";
import { chooseAction, playout, DEFAULT_PERSONALITY } from "./ai.js?v=0.48";
import { EVOLVED_PERSONALITIES } from "./ai-personalities.js?v=0.48";
import { distance } from "./hex.js?v=0.48";
import {
  renderBoard, boardBounds, loadTiles, preloadArt, unitImage, facingAngle, PLAYER_COLOURS,
  upgradeImage, factoryImage,
} from "./board.js?v=0.48";
import { confirmDialog } from "./dialog.js?v=0.48";
import { playSound, unlockSound, soundOn, setSoundOn } from "./sound.js?v=0.48";
import { showTip, showNote } from "./tips.js?v=0.48";
import {
  MISSIONS, missionRules, missionMap, markMissionDone, UNIT_ROLES, UPGRADE_ROLES,
} from "./campaign.js?v=0.48";
import { levelById, levelSetup } from "./difficulty.js?v=0.48";

const HUMAN = 0;
const AI_PLAYER = 1;
const SAVE_KEY = "mech-attack.save";
const RECENT_KEY = "mech-attack.recent-maps";
// Per-game extras kept beside the save: undos left and whether surrender was demanded.
const EXTRAS_KEY = "mech-attack.game-extras";
const RECENT_LIMIT = 8;
// Generated maps are numbered from 1 up to this when picked at random.
const NEW_MAP_RANGE = 99999;
const ASSET_VERSION = "0.48";
// Pause between AI actions you can see, and how long an explosion stays on screen.
const AI_STEP_MS = 450;
// A moving unit hops one hex at a time along its route, this long per hex.
const HOP_MS = 90;
// How long a banner such as "60 crystals unloaded" stays over the board (a tap anywhere
// clears it sooner), the "Round 5" banner at the start of your turn, and the one naming your
// opponent at the start of a game.
const BANNER_MS = 3500;
// How long the sum behind an attack ("Tank ATT 25 vs Scout Bike DEF 10 -> DESTROYED") stays
// up, and how long Green's turn pauses after one so it can be read (Phil, 29 October 2026).
const ATTACK_BANNER_MS = 3000;
const ATTACK_READ_MS = 1500;
const ROUND_BANNER_MS = 2000;
const OPPONENT_BANNER_MS = 3500;
// How long End turn flashes once every unit has done all it can this turn (styles.css flashes
// it for the same time).
const END_TURN_FLASH_MS = 6000;
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
  factoryCaptured: "the home factory was overrun",
  noFactories: "no factories left",
  noUnits: "no units left and not enough crystals to build one",
  roundCap: "the round limit was reached",
  resigned: "quit the game",
  objective: "the mission objective was met",
  missionFailed: "the mission failed",
};

let state = null;
// moving: a unit part way along its route while its move is shown, { unit, at, hidden }.
// briefing: a campaign mission's briefing is open (tips wait for it).
const ui = { selectedId: null, mode: null, buildType: null, busy: false, effects: [],
  messages: [], moving: null, briefing: false };
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

// The AI's personality for a game: set by the campaign mission, or by the difficulty level.
// A mission's aiMix replaces the units it builds and its aiGenes change other genes.
function opponentPersonality(s) {
  const m = missionOf(s);
  const kind = m ? m.ai : levelById(s.level).ai;
  let personality = DEFAULT_PERSONALITY;
  if (kind === "best" && EVOLVED_PERSONALITIES.length) {
    personality = { ...DEFAULT_PERSONALITY, ...EVOLVED_PERSONALITIES[0].personality };
  } else if (kind !== "default") {
    personality = personalityFor(s.seed);
  }
  if (!m) return personality;
  return { ...personality, ...(m.aiGenes || {}), mix: { ...(m.aiMix || personality.mix) } };
}

// Who you are playing: Green in the campaign, otherwise the level's commander.
function opponentName() {
  return missionOf(state) ? "Green" : levelById(state.level).opponent;
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
// level: the difficulty level's id (see difficulty.js), for a game that is not a mission.
export async function openGame({
  resume = false, mapId = "fixed-1", mission = null, level = null, onLeave,
}) {
  els = els || findElements();
  if (!wired) wire(onLeave);
  state = resume ? loadSave() : null;
  let briefing = false;
  if (!state) {
    const seed = Math.floor(Math.random() * MAX_SEED);
    if (mission !== null) {
      const m = MISSIONS[mission];
      const rules = missionRules(m, RULES);
      const map = missionMap(m, mapById(m.mapId, rules), rules);
      const game = newGame({ rules, map, seed, firstPlayer: HUMAN, setup: m.setup });
      state = { ...game, campaign: { mission } };
      briefing = true;
    } else {
      const map = mapById(mapId, RULES);
      const chosen = levelById(level);
      const game = newGame({ rules: RULES, map, seed, firstPlayer: HUMAN,
        setup: levelSetup(chosen, RULES) });
      state = { ...game, level: chosen.id };
      noteMap(map);
    }
    save();
  }
  const m = missionOf(state);
  aiPersonality = opponentPersonality(state);
  els.objective.hidden = !m;
  Object.assign(ui, { selectedId: null, mode: null, buildType: null, busy: false,
    effects: [], messages: ["Tap one of your units to give it orders."], moving: null });
  facing = {};
  flashedRound = null;
  pendingTips = [];
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
  // Tips wait until the mission briefing has been read; the mission's top tip comes first,
  // then the welcome, then tips for what is on the board.
  ui.briefing = briefing;
  tip("welcome");
  render();
  if (briefing && !(await showBriefing(m, state.campaign.mission))) {
    ui.briefing = false;
    leaveGame();
    return;
  }
  ui.briefing = false;
  if (briefing && m.tip) showNote(m.tip, RULES);
  if (!m && !resume) {
    const chosen = levelById(state.level);
    showBanner(`${chosen.rank}: you face ${chosen.opponent}`, OPPONENT_BANNER_MS);
  }
  render();
  if (state.current === AI_PLAYER) runAiTurn();
}

// ---------------------------------------------------------------------------------------
// Campaign

function missionOf(s) {
  return s && s.campaign ? MISSIONS[s.campaign.mission] : null;
}

// The mission's story and objective before it starts, with the units it brings in (the first
// mission's are your first units). Resolves false if the player goes back.
function showBriefing(m, index) {
  const heading = index === 0 ? "Your units" : "New this mission";
  return confirmDialog({
    title: `Mission ${index + 1}: ${m.title}`,
    text: `${m.story}\n\nObjective: ${m.objective}`,
    confirm: "Start",
    cancel: "Back",
    extra: unlockCards(heading, m.newUnits, m.newUpgrades),
  });
}

// Cards for units and factory upgrades a mission unlocks: picture, name and what it is for.
// Empty when there are none.
function unlockCards(heading, units, upgrades) {
  if (!units.length && !upgrades.length) return "";
  const card = (image, name, role) => `<li class="unlock"><img src="${image}" alt="">` +
    `<div><b>${name}</b><span>${role}</span></div></li>`;
  const cards = [
    ...units.map((type) => card(unitImage(type, HUMAN), RULES.units[type].name,
      UNIT_ROLES[type])),
    ...upgrades.map((upgrade) => card(upgradeImage(upgrade),
      RULES.factoryUpgrades[upgrade].name, UPGRADE_ROLES[upgrade])),
  ];
  return `<h3 class="unlock-heading">${heading}</h3><ul class="unlocks">${cards.join("")}</ul>`;
}

// A mission whose objective is met is won at once; one that can fail is lost at once.
function checkObjective() {
  const m = missionOf(state);
  if (!m || state.result) return;
  if (m.failed && m.failed(state)) {
    state = { ...state, result: { winner: AI_PLAYER, reason: "missionFailed",
      round: state.round } };
  } else if (m.done && m.done(state)) {
    state = { ...state, result: { winner: HUMAN, reason: "objective", round: state.round } };
  }
}

// The Objective button: the mission's story and objective, with its steps ticked off.
function showObjective() {
  const m = missionOf(state);
  if (!m) return;
  const steps = m.steps ? `\n\n${m.steps.map((step) =>
    `${step.done(state) ? "\u2714" : "\u2022"} ${step.text}`).join("\n")}` : "";
  confirmDialog({
    title: `Mission ${state.campaign.mission + 1}: ${m.title}`,
    text: `Objective: ${m.objective}${steps}\n\n${m.story}`,
    confirm: "OK",
    cancel: null,
  });
}

function findElements() {
  const $ = (id) => document.getElementById(id);
  return {
    screen: $("game"), svg: $("board"), root: $("board-root"), round: $("game-round"),
    banner: $("game-banner"),
    turn: $("game-turn"), crystals: $("game-crystals"), endTurn: $("end-turn"),
    home: $("game-home"), message: $("game-message"), panel: $("unit-panel"),
    over: $("game-over"), overTitle: $("game-over-title"), overText: $("game-over-text"),
    overUnlocks: $("game-over-unlocks"),
    again: $("play-again"), newMap: $("play-new-map"), toTitle: $("game-over-home"),
    quit: $("quit-game"), sound: $("sound-toggle"), objective: $("objective-btn"),
    buildInfo: $("build-info"),
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
    ? { mission: state.campaign.mission, onLeave }
    : { mapId: state.map.id, level: state.level, onLeave }));
  els.newMap.addEventListener("click", () => openGame(state.campaign
    ? { mission: state.campaign.mission + 1, onLeave }
    : { mapId: newMapId(shapeOf(state.map.id)), level: state.level, onLeave }));
  els.objective.addEventListener("click", showObjective);
  els.endTurn.addEventListener("click", async () => {
    if (!myTurn()) return;
    await act({ type: "endTurn" });
    runAiTurn();
  });
  els.quit.addEventListener("click", quitGame);
  // Phones play sound only after a tap, so the first tap anywhere starts it. A tap anywhere
  // also clears a banner.
  document.addEventListener("pointerdown", unlockSound, { passive: true });
  document.addEventListener("pointerdown", hideBanner, { passive: true });
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
  else nudgeEndTurn();
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
  const m = missionOf(state);
  if (!myTurn() || (m && m.noSurrender)) return;
  if (surrenderUsed) {
    await confirmDialog({
      title: "Surrender already demanded",
      text: "You can demand surrender only once a game. It is there to end a game early " +
        "when Green has no chance of winning.",
      confirm: "OK",
      cancel: null,
    });
    return;
  }
  surrenderUsed = true;
  saveExtras();
  ui.busy = true;
  say(`${opponentName()} is considering your demand…`);
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
  say(`${opponentName()} refuses: rates their chances at ${Math.round(chance * PERCENT)}%.`);
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
  say(`${opponentName()} is moving…`);
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
    if (seen) await sleep(ui.attackShown ? ATTACK_READ_MS : AI_STEP_MS);
  }
  ui.busy = false;
  save();
  if (!state.result) say(`Round ${state.round}: your turn.`);
  render();
  if (state.result) {
    showGameOver();
  } else if (factoryUnderThreat()) {
    showBanner(`Round ${state.round}: enemy Infantry at your factory!`);
  } else {
    showBanner(`Round ${state.round}`, ROUND_BANNER_MS);
  }
}

// Whether enemy infantry stand next to one of your factories, able to overrun it next turn.
function factoryUnderThreat() {
  const view = viewFor(state, HUMAN);
  const factories = Object.values(view.units).filter((u) =>
    u.owner === HUMAN && unitStats(view, u).isFactory);
  return Object.values(view.units).some((u) => u.owner === AI_PLAYER &&
    factories.some((f) => distance(u.at, f.at) === 1 && canCapture(view, u, f)));
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
  // The sum behind each hit blue can see, and the type of the unit whose shot is landing.
  const sums = [];
  let shooter = null;
  // Hexes your units fired into blind, so what is destroyed there can be reported.
  const blindShots = new Set();
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
      shooter = typeOf(e.unitId);
      if (e.type === "fire" || e.type === "returnFire") sound(fireSound(typeOf(e.unitId)));
      if (from && seen(from)) effects.push({ at: from, size: 0.42 });
      if (to && seen(to)) effects.push({ at: to, size: 0.75 });
      const verb = { fire: "fired on", returnFire: "returned fire on",
        splash: "caught in the blast:", lineHit: "also hit by the sonic boom:" }[e.type];
      lines.push(e.type === "splash" || e.type === "lineHit"
        ? `${unitName(before, e.targetId)} ${verb} ${e.attack}.`
        : `${unitName(before, e.unitId)} ${verb} ${unitName(before, e.targetId)} ` +
          `(${e.attack}).`);
    } else if (e.type === "hit" && shooter && before.units[e.unitId] &&
      seen(before.units[e.unitId].at)) {
      sums.push(attackSum(shooter, before.units[e.unitId].type, e));
      if (e.livesAfter === 0) continue;
      lines.push(e.livesAfter < e.livesBefore
        ? `${unitName(before, e.unitId)} lost a life.`
        : `${unitName(before, e.unitId)}: ${e.total} of ${e.defence} this turn, ` +
          "more fire this turn adds to it.");
    } else if (e.type === "hit" && e.livesAfter > 0) {
      const unit = before.units[e.unitId];
      if (!unit || !seen(unit.at)) continue;
      lines.push(e.livesAfter < e.livesBefore
        ? `${unitName(before, e.unitId)} lost a life.`
        : `${unitName(before, e.unitId)}: ${e.total} of ${e.defence} this turn, ` +
          "more fire this turn adds to it.");
    } else if (e.type === "fireBlind") {
      if (after.units[e.unitId]?.owner !== HUMAN && before.units[e.unitId]?.owner !== HUMAN) {
        continue;
      }
      any = true;
      blindShots.add(e.at);
      sound(fireSound(typeOf(e.unitId)));
      effects.push({ at: e.at, size: e.hit ? 0.75 : 0.4 });
      lines.push(`${unitName(before, e.unitId)} fired blind: ` +
        `${e.hit ? "hit something!" : "nothing there."}`);
    } else if (e.type === "destroyed" && !seen(e.at) && blindShots.has(e.at)) {
      lines.push("Something out there was destroyed.");
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
      if (e.stoppedBy === "revealed" && after.units[e.unitId]?.owner === HUMAN) {
        lines.push(`New ground turned over. ${e.moveLeft} move point` +
          `${e.moveLeft === 1 ? "" : "s"} left: tap where to go next.`);
        tip("newGround");
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
      if (after.units[e.unitId]?.owner === HUMAN) tip(`built:${e.unitType}`);
    } else if (e.type === "heal" && seen(after.units[e.unitId]?.at)) {
      lines.push(`${unitName(after, e.targetId)} repaired.`);
    } else if (e.type === "capture" && (seen(e.at) || e.from === HUMAN)) {
      any = true;
      sound(["capture", 1]);
      const whose = e.from === null ? "an unused" : e.from === HUMAN ? "your" : "Green's";
      lines.push(`${e.owner === HUMAN ? "Your infantry" : "Green's infantry"} overran ` +
        `${whose} factory${e.owner === HUMAN && e.crystals ? `: ${e.crystals} crystals ` +
          "in its store" : ""}.`);
    } else if (e.type === "board" && seen(e.at)) {
      any = true;
      lines.push(`${unitName(before, e.unitId)} boarded ` +
        `${unitName(after, e.transporterId).toLowerCase()}.`);
    } else if (e.type === "drop" && seen(e.at)) {
      any = true;
      lines.push(`${unitName(after, e.transporterId)} dropped off ` +
        `${RULES.units[after.units[e.unitId]?.type || "infantry"].name}.`);
    } else if (e.type === "labIncome" && e.player === HUMAN) {
      lines.push(`Crystal labs made ${e.amount} crystals.`);
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
  if (sums.length) showBanner(sums.join("\n"), ATTACK_BANNER_MS);
  ui.attackShown = sums.length > 0;
  return any;
}

// The sum behind a hit, for players learning how attacks work: attack against defence and
// what it does. Attacks on one unit in a turn add up: reaching its defence costs it a life,
// twice its defence destroys it.
function attackSum(attackerType, targetType, hit) {
  const { amount, total, defence, livesBefore, livesAfter } = hit;
  const twice = RULES.combat.loseTwoLivesAt * defence;
  const attack = total === amount ? `ATT ${amount}` : `ATT ${amount} (${total} this turn)`;
  let result;
  if (livesAfter === 0) {
    result = total >= twice ? `DESTROYED (${total} ≥ 2 × ${defence})`
      : `DESTROYED (${total} ≥ ${defence}, already damaged)`;
  } else if (livesAfter < livesBefore) {
    result = `1 HIT (${total} ≥ ${defence}): now damaged`;
  } else if (total >= defence) {
    result = `no more damage: ${twice - total} more this turn destroys it`;
  } else {
    result = `NO HIT (${total} < ${defence}): ${defence - total} more this turn`;
  }
  return `${RULES.units[attackerType].name} ${attack} vs ${RULES.units[targetType].name} ` +
    `DEF ${defence} → ${result}`;
}

// Once every one of your units has done all it can this turn, End turn flashes (once a turn).
let flashedRound = null;

function nudgeEndTurn() {
  if (!myTurn() || flashedRound === state.round) return;
  const view = viewFor(state, HUMAN);
  const army = Object.values(view.units).filter((u) =>
    u.owner === HUMAN && !unitStats(view, u).isFactory);
  const busy = (u) => Object.keys(reachableHexes(view, u.id)).length ||
    attackTargets(view, u.id).length || harvestTargets(view, u.id).length ||
    healTargets(view, u.id).length || dropSites(view, u.id).length ||
    canSetUp(view, u.id) || canPackUp(view, u.id);
  if (!army.length || army.some(busy)) return;
  flashedRound = state.round;
  els.endTurn.classList.add("flash");
  setTimeout(() => els.endTurn.classList.remove("flash"), END_TURN_FLASH_MS);
}

// A short message over the board, gone after BANNER_MS or at the next tap.
let bannerTimer = null;
// A tap that comes in this soon after a banner appears is the one that caused it.
const BANNER_TAP_GRACE_MS = 300;
let bannerShownAt = 0;

function hideBanner() {
  if (!els || performance.now() - bannerShownAt < BANNER_TAP_GRACE_MS) return;
  clearTimeout(bannerTimer);
  els.banner.hidden = true;
}

function showBanner(text, ms = BANNER_MS) {
  bannerShownAt = performance.now();
  els.banner.textContent = text;
  els.banner.hidden = false;
  // Restart the fade-in when banners come one after another.
  els.banner.classList.remove("show");
  void els.banner.offsetWidth;
  els.banner.classList.add("show");
  clearTimeout(bannerTimer);
  bannerTimer = setTimeout(() => { els.banner.hidden = true; }, ms);
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
  if (mode === "fire") {
    return [...attackTargets(view, unitId).map((id) => view.units[id].at),
      ...darkTargets(view, unitId)];
  }
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

// The order a unit is ready for. Firing blind into the dark is never the default.
function defaultMode(view, unit) {
  if (!unit || unit.owner !== HUMAN || state.current !== HUMAN) return null;
  return Object.keys(MODES).find((m) => (m === "fire" ? attackTargets(view, unit.id)
    : targetsFor(view, m, unit.id)).length) || null;
}

function actionFor(view, mode, unitId, k) {
  const unitOn = Object.values(view.units).find((u) => u.at === k);
  if (mode === "move") return { type: "move", unitId, to: k };
  if (mode === "fire") {
    const targetId = attackTargets(view, unitId).find((id) => view.units[id].at === k);
    return targetId ? { type: "attack", unitId, targetId } : { type: "attack", unitId, at: k };
  }
  if (mode === "harvest") return { type: "harvest", unitId, at: k };
  if (mode === "heal") return { type: "heal", unitId, targetId: unitOn.id };
  if (mode === "drop") return { type: "drop", unitId, at: k };
  if (mode === "build") return { type: "build", unitType: ui.buildType, at: k };
  return null;
}

async function onHexTap(k) {
  if (!state || ui.busy) return;
  const view = viewFor(state, HUMAN);
  if (myTurn() && ui.mode && targetsFor(view, ui.mode, ui.selectedId).includes(k)) {
    if (ui.mode === "fire" && !view.visible[k]) tip("blindFire");
    const unitId = ui.selectedId;
    if (ui.mode === "move" && crushingMoves(view, unitId).includes(k) &&
      !(await confirmCrush(view, unitId))) return;
    act(actionFor(view, ui.mode, unitId, k));
    return;
  }
  const unit = Object.values(view.units).find((u) => u.at === k);
  ui.selectedId = unit ? unit.id : null;
  ui.mode = unit ? defaultMode(view, unit) : null;
  ui.buildType = null;
  render();
}

// A move that drives over crystals destroys them; ask first, and say how to harvest instead.
function confirmCrush(view, unitId) {
  const harvests = unitStats(view, view.units[unitId]).storage > 0;
  return confirmDialog({
    title: "Crush the crystals?",
    text: "This move drives over crystals, which destroys them." +
      (harvests ? " To harvest them instead, stop on a hex next to the pile, then tap " +
        "Harvest (and the pile, if there are several)." : "") +
      "\n\nDo you really want to crush them?",
    confirm: "Crush them",
    cancel: "Cancel move",
  });
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
  if (!myTurn() || ui.briefing) return;
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
  if (ui.mode === "fire" && darkTargets(view, ui.selectedId).length) tip("blindFire");
  if (ui.mode === "move" && crushingMoves(view, ui.selectedId).length) tip("crystals");
  terrainTips(view);
  siegeTips(view);
  const ids = pendingTips;
  pendingTips = [];
  for (const id of ids) showTip(id, RULES);
}

// Tips for mountains and rough ground, the first time you see them.
function terrainTips(view) {
  const seen = new Set(Object.keys(view.visible).map((k) => view.map.hexes[k].terrain));
  if (seen.has("mountain") || seen.has("chasm")) tip("mountain");
  if (seen.has("rocky")) tip("rough");
}

// Tips for infantry next to a factory: yours, able to break in next turn, or the enemy's,
// about to overrun yours.
function siegeTips(view) {
  const factories = Object.values(view.units).filter((u) => unitStats(view, u).isFactory);
  const besieging = (owner, mine) => Object.values(view.units).some((u) =>
    u.owner === owner && unitStats(view, u).captures &&
    factories.some((f) => (f.owner === HUMAN) === mine && distance(u.at, f.at) === 1 &&
      canCapture(view, u, f)));
  if (besieging(HUMAN, false)) tip("siege");
  if (besieging(AI_PLAYER, true)) tip("defend");
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
    if (ui.mode === "fire") {
      // Hexes out of sight can be fired into blind; they show fainter.
      const blind = darkTargets(view, ui.selectedId);
      overlays.push({ hexes: blind, style: "fireBlind" });
      targets = targets.filter((k) => !blind.includes(k));
    }
    if (ui.mode === "move") {
      // Moves that can only be made by driving over crystals (destroying them) show yellow.
      const crushing = crushingMoves(view, ui.selectedId);
      overlays.push({ hexes: crushing, style: "crush" });
      targets = targets.filter((k) => !crushing.includes(k));
    }
    overlays.push({ hexes: targets, style });
  }
  // A mission's destination (The Maid's March) is always marked.
  const m = missionOf(state);
  if (m && m.target) overlays.unshift({ hexes: [m.target(state.map)], style: "objective" });
  renderBoard(els.root, {
    view, selectedId: ui.selectedId, overlays, effects: ui.effects, notes, facing,
    moving: ui.moving,
  });
  renderBar(view);
  renderPanel(view);
  renderBuildInfo(view);
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
  els.turn.textContent = view.current === HUMAN ? "Your turn" : `${opponentName()}'s turn`;
  els.turn.className = view.current === HUMAN ? "turn-blue" : "turn-green";
  // Crystals in store, and what Crystal labs add at the end of each of your turns.
  const lab = view.rules.factoryUpgrades.lab;
  const labs = Object.values(view.units).filter((u) => u.owner === HUMAN &&
    (u.upgrades || []).includes("lab")).length;
  els.crystals.innerHTML = `${view.players[HUMAN].crystals}` +
    (labs ? `<small class="crystal-income">+${labs * lab.income}/turn</small>` : "");
  els.endTurn.disabled = !myTurn();
}

const HITS = { ground: "ground", air: "air only", both: "ground and air" };

// Attack and defence, the numbers that decide fights, in large type above the other stats.
// Defence shows any bonus from the ground the unit stands on.
function keyStats(view, unit) {
  const stats = unitStats(view, unit);
  return keyStatsOf(stats, defenceOf(view, unit) - stats.defence);
}

function keyStatsOf(stats, bonus = 0) {
  const attack = stats.attack ? `<span>Attack ${stats.attack}</span>` : "";
  const extra = bonus ? ` <small>+${bonus} rough ground</small>` : "";
  return `<p class="key-stats">${attack}<span>Defence ${stats.defence}${extra}</span></p>`;
}

// While choosing where to build, what the chosen unit is, over the foot of the board, so the
// build buttons stay where they are.
function renderBuildInfo(view) {
  const type = ui.mode === "build" ? ui.buildType : null;
  els.buildInfo.hidden = !type;
  if (!type) return;
  const stats = view.rules.units[type];
  els.buildInfo.innerHTML = `<img src="${unitImage(type, HUMAN)}" alt="">` +
    `<div><h3>${stats.name}<span class="cost">${stats.cost}</span></h3>` +
    `${keyStatsOf(stats)}<p class="unit-stats">${statLine(stats)}</p>` +
    `<p class="panel-hint">Tap a yellow hex next to the factory to build it.</p></div>`;
}

function statLine(stats) {
  const range = stats.range ? stats.range.join("–").replace(/^(\d)–\1$/, "$1") : "-";
  const parts = [];
  if (stats.air) parts.push("Flies");
  if (!stats.isFactory) parts.push(stats.move ? `Move ${stats.move}` : "Never moves");
  if (stats.attack) parts.push(`Range ${range}`, `Hits ${HITS[stats.hits || "ground"]}`);
  if (stats.splash) parts.push("Cluster bomb");
  if (stats.line) parts.push("Sonic boom");
  if (stats.reload) parts.push("Fires every other turn");
  if (stats.storage) parts.push(`Storage ${stats.storage}`);
  if (stats.healing) parts.push(`Repair ${stats.healing}`);
  if (stats.captures) parts.push("Overruns factories");
  if (stats.carries) {
    parts.push(stats.loads === "ground" ? "Carries 2 Infantry or 1 vehicle"
      : `Carries ${stats.carries} Infantry`);
  }
  parts.push(`Sight ${stats.sight}`);
  return parts.join(" · ");
}

// What a factory upgrade does, e.g. "Builds Heavy Cannon, Blast Cannon, Sonic Tank", for the
// units this game allows.
function upgradeEffect(upgrade) {
  const { income } = RULES.factoryUpgrades[upgrade];
  if (income) return `+${income} crystals every turn`;
  return `Builds ${buildableTypes(state).filter((t) => RULES.units[t].needs === upgrade)
    .map((t) => RULES.units[t].name).join(", ")}`;
}

// A factory's panel: its upgrades, then the units it can build. Unused and enemy factories
// show only what they are.
function factoryPanel(view, unit, head) {
  if (unit.owner !== HUMAN) {
    const store = unit.store ? ` Its store holds ${unit.store} crystals.` : "";
    const hint = unit.owner === null
      ? `Infantry next to it at the start of your turn can move in and capture it.${store}`
      : "";
    els.panel.innerHTML = `${head}<p class="panel-hint">${hint}</p>`;
    return;
  }
  const crystals = view.players[HUMAN].crystals;
  const upgradeOrders = upgradeOptions(view, unit.id).map((upgrade) => {
    const { name: upgradeName, cost } = RULES.factoryUpgrades[upgrade];
    const label = `<img src="${upgradeImage(upgrade)}" alt="">Add ${upgradeName}` +
      `<small class="upgrade-effect">${upgradeEffect(upgrade)}</small>` +
      `<span class="cost">${cost}</span>`;
    return orderButton("upgrade", label, myTurn() && cost <= crystals, false,
      ` data-type="${upgrade}"`);
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
    const factory = view.players[HUMAN].factoryId !== null ? ", or your factory to build" : "";
    const hint = myTurn()
      ? `Tap a unit to see its orders${factory}. Drag to pan, pinch or scroll to zoom.`
      : `${opponentName()} is taking their turn.`;
    const undo = history.length ? undoButton() : "";
    // Some campaign missions (Green has nothing to surrender) leave the button out.
    const surrender = m && m.noSurrender ? "" : orderButton("surrender",
      surrenderUsed ? "Surrender demanded" : "Demand surrender", myTurn());
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
    const upgrades = unit.upgrades.map((u) => u === "lab"
      ? `Crystal lab: +${RULES.factoryUpgrades.lab.income} crystals a turn`
      : RULES.factoryUpgrades[u].name);
    status.push(upgrades.length ? upgrades.join(" · ") : "Light units only");
  }
  if (stats.storage) status.push(`Carrying ${unit.carrying}/${stats.storage}`);
  if (stats.carries) {
    const aboard = unit.cargo.map((c) => RULES.units[c.type].name).join(", ");
    status.push(`On board: ${aboard || "nobody"}`);
  }
  if (unit.continues && mine) status.push("Can move on");
  if (unit.setUp) status.push("Set up");
  if (unit.cooldown > 0) status.push("Reloading");
  const image = stats.isFactory ? factoryImage(unit.upgrades, unit.owner)
    : unitImage(unit.type, unit.owner);
  // The stats run full width under the name, so they stay on a line or two on a phone.
  const head = `<div class="panel-head"><img src="${image}" alt="">` +
    `<div><h2>${name}</h2><p>${status.join(" · ")}</p></div></div>` +
    keyStats(view, unit) + `<p class="unit-stats">${statLine(stats)}</p>`;

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
    text = winner === AI_PLAYER ? `You quit ${round}.`
      : `${opponentName()} surrendered ${round}.`;
  }
  if (reason === "missionFailed") text = `${m.failText} ${round}`;
  els.again.textContent = m ? "Retry mission" : "Replay this map";
  els.newMap.textContent = m ? "Next mission" : "New game";
  els.newMap.hidden = false;
  els.overUnlocks.hidden = true;
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
    // What winning unlocks: the units new in the next mission.
    const next = MISSIONS[index + 1];
    const cards = won && next ? unlockCards(`Unlocked for mission ${index + 2}`,
      next.newUnits, next.newUpgrades) : "";
    els.overUnlocks.innerHTML = cards;
    els.overUnlocks.hidden = !cards;
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
