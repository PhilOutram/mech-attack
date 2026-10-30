// Game screen: you against the AI, or a multiplayer game (Phil, 29 October 2026). Renders the
// engine's view of the game for one player (me) and turns taps into engine actions. No rules
// here; every option shown comes from the engine.
//
// Multiplayer: state.seats says who plays each side (see seatsOf). Several humans can share
// this device, which is passed between them; humans on other devices are linked through
// net.js, with this device holding the game (host). A device that joined someone else's game
// (client) holds only its own player's view, sends its actions to the host and shows the
// updates it gets back.
import { RULES } from "./rules-config.js?v=0.70";
import { mapById, seededRandom } from "./maps.js?v=0.70";
import {
  newGame, applyAction, viewFor, reachableHexes, attackTargets, healTargets, harvestTargets,
  canSetUp, canPackUp, buildSites, buildableTypes, unitStats, livesAfterHit,
  firesBack, dropSites, factoryBuilds, upgradeOptions, crushingMoves, refreshKnowledge,
  defenceOf, darkTargets, canCapture, allied, crystalTargets, canResumeTurn,
  STATE_FORMAT,
} from "./engine.js?v=0.70";
import { chooseAction, playout, DEFAULT_PERSONALITY } from "./ai.js?v=0.70";
import { EVOLVED_PERSONALITIES } from "./ai-personalities.js?v=0.70";
import { MULTI_SIDE_PERSONALITIES } from "./ai-personalities-multi.js?v=0.70";
import { distance } from "./hex.js?v=0.70";
import {
  renderBoard, boardBounds, loadTiles, preloadArt, unitImage, facingAngle, PLAYER_COLOURS,
  upgradeImage, factoryImage, tokenSize, hexCentre, DAMAGE_BADGE, UNIT_LABEL_DY, unitLabel,
} from "./board.js?v=0.70";
import { confirmDialog } from "./dialog.js?v=0.70";
import { playSound, unlockSound, soundOn, setSoundOn } from "./sound.js?v=0.70";
import { showTip, showNote } from "./tips.js?v=0.70";
import {
  MISSIONS, missionRules, missionMap, markMissionDone, UNIT_ROLES, UPGRADE_ROLES,
} from "./campaign.js?v=0.70";
import { levelById, levelSetup, missionSetup } from "./difficulty.js?v=0.70";
import { COOP_MISSIONS, markCoopMissionDone } from "./coop-campaign.js?v=0.70";
import { joinGame as joinRemote } from "./net.js?v=0.70";

// In single-player games and the campaign you are player 0 and the AI player 1.
const HUMAN = 0;
const AI_PLAYER = 1;
const SAVE_KEY = "mech-attack.save";
// How the saved game links to other devices (see savedLink).
const LINK_KEY = "mech-attack.link";
// A device that lost the host tries to rejoin this often, this far apart.
const REJOIN_ATTEMPTS = 10;
const REJOIN_DELAY_MS = 3000;
const RECENT_KEY = "mech-attack.recent-maps";
// Per-game extras kept beside the save: undos left and whether surrender was demanded.
const EXTRAS_KEY = "mech-attack.game-extras";
const RECENT_LIMIT = 8;
// Generated maps are numbered from 1 up to this when picked at random.
const NEW_MAP_RANGE = 99999;
const ASSET_VERSION = "0.70";
// Pause between AI actions you can see, and how long an explosion stays on screen.
const AI_STEP_MS = 450;
// A move is shown by gliding the unit along its route in this long, about the length of the
// movement sounds, each step taking an equal share (Phil, 29 October 2026).
const MOVE_MS = 1500;
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
const MESSAGE_LINES = 6;
// Demand surrender: the AI plays the game on until this much time has gone (at least
// MIN_PLAYOUTS games, at most rules.surrenderPlayouts), so a game with many sides cannot keep
// the screen waiting; with more than two sides each game runs this many rounds.
const SURRENDER_THINK_MS = 8000;
const MIN_PLAYOUTS = 4;
const MULTI_SIDE_PLAYOUT_ROUNDS = 15;
const PERCENT = 100;

// Sounds (Phil, 29 October 2026). Air units fly with the helicopter clip, the Spotter Drone
// at half volume; Infantry march; other vehicles rumble like a tank. Small guns use the
// infantry burst, everything else the tank shot.
const DRONE_VOLUME = 0.5;
// How long a sonic boom's wave takes to cross each hex.
const BOOM_STEP_MS = 180;
// How long newly turned-over ground flashes (styles.css .reveal-flash: three 0.4 s flashes).
const REVEAL_FLASH_MS = 1200;
const SMALL_GUNS = ["infantry", "scoutBike", "antiAircraftJeep"];

// The sound a unit type makes moving, as [clip, volume].
function moveSound(type) {
  if (RULES.units[type].air) return ["flying", type === "spotterDrone" ? DRONE_VOLUME : 1];
  return [type === "infantry" ? "footsteps" : "tankMoving", 1];
}

function fireSound(type) {
  if (RULES.units[type]?.line) return ["sonicBoom", 1];
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
// The player whose view this screen shows: you, or on a shared device the human whose turn
// it is.
let me = HUMAN;
// The link to other devices for a game played on several (net.js), or null.
let link = null;
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
// The AI's personality for this game, or for each AI side in a multiplayer game.
let aiPersonality = DEFAULT_PERSONALITY;
let aiPersonalities = {};
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

// The game last played is the one Resume brings back, whatever kind it is. A game hosted
// here saves the whole game and its code and seats, so it can be hosted again and the others
// can rejoin; a game joined on another device lives there, so this device keeps only how to
// get back to it.
function save() {
  try {
    if (state.result) {
      localStorage.removeItem(SAVE_KEY);
      localStorage.removeItem(LINK_KEY);
      return;
    }
    localStorage.setItem(SAVE_KEY, JSON.stringify(isClient()
      ? { format: STATE_FORMAT, joined: true } : state));
    if (!link) localStorage.removeItem(LINK_KEY);
    else {
      localStorage.setItem(LINK_KEY, JSON.stringify(link.role === "host"
        ? { role: "host", code: link.code, owners: link.owners(),
          remoteSeats: seatsOf(state).map((seat, p) => (seat.remote ? p : -1))
            .filter((p) => p >= 0) }
        : { role: "client", code: link.code }));
    }
  } catch {
    // Storage can be full or blocked; the game carries on without saving.
  }
}

// How the saved game links to other devices: { role: "host", code, owners, remoteSeats } for
// a game hosted here, { role: "client", code } for one joined elsewhere, or null.
export function savedLink() {
  try {
    const saved = JSON.parse(localStorage.getItem(LINK_KEY));
    return saved && hasSavedGame() ? saved : null;
  } catch {
    return null;
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
    if (result.winner === me) entry.wins += 1;
    else if (result.winner !== null) entry.losses += 1;
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
  const level = levelById(s.level);
  const kind = m ? level.campaign.ai || m.ai : level.ai;
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

// ---------------------------------------------------------------------------------------
// Seats: who plays each side

// { kind: "human" | "ai", level (an AI's rank, see difficulty.js), remote (a human on another
// device) } for each player. Single-player games: you, then the AI.
function seatsOf(s) {
  return s.seats || [{ kind: "human" }, { kind: "ai" }];
}

function isAiSeat(p) {
  return seatsOf(state)[p]?.kind === "ai";
}

// A human playing on this device.
function isLocalHuman(p) {
  const seat = seatsOf(state)[p];
  return Boolean(seat) && seat.kind === "human" && !seat.remote;
}

function isMultiplayer() {
  return Boolean(state && state.seats);
}

function isClient() {
  return Boolean(link) && link.role === "client";
}

// A player's name in messages: their colour, or in a single-player game the AI's commander.
function playerName(p) {
  if (!isMultiplayer() && p === AI_PLAYER) return opponentName();
  return PLAYER_COLOURS[p].name;
}

// "Green", "Green and Yellow", "Green, Yellow and Purple".
function namesOf(players) {
  const names = players.map(playerName);
  return names.length < 2 ? names.join("")
    : `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}

// The AI's personality for a multiplayer AI side: from its rank, as in a single-player game.
// With more than two sides, the evolved ones come from those bred for such games, if any.
function seatPersonality(p) {
  const kind = levelById(seatsOf(state)[p].level).ai;
  const bred = state.players.length > 2 && MULTI_SIDE_PERSONALITIES.length
    ? MULTI_SIDE_PERSONALITIES : EVOLVED_PERSONALITIES;
  if (kind === "default" || !bred.length) {
    const mix = seatsOf(state)[p].aiMix;
    return mix ? { ...DEFAULT_PERSONALITY, mix: { ...mix } } : DEFAULT_PERSONALITY;
  }
  const index = kind === "best" ? 0 : (state.seed + p) % bred.length;
  const personality = { ...DEFAULT_PERSONALITY, ...bred[index].personality };
  // A co-op mission can set what an AI side builds.
  const mix = seatsOf(state)[p].aiMix;
  return mix ? { ...personality, mix: { ...mix } } : personality;
}

function personalityOf(p) {
  if (!isMultiplayer()) return aiPersonality;
  aiPersonalities[p] ||= seatPersonality(p);
  return aiPersonalities[p];
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
// multiplayer: { seats, sides, phases, mapId, setup, rules, coop } for a multiplayer game on
// this device (see multiplayer.js; coop: { mission } for a co-op campaign mission), and
// linkTo the link to other devices when some seats are remote.
export async function openGame({
  resume = false, mapId = "fixed-1", mission = null, level = null, multiplayer = null,
  linkTo = null, onLeave,
}) {
  els = els || findElements();
  if (!wired) wire(onLeave);
  state = resume ? loadSave() : null;
  link = linkTo;
  let briefing = false;
  let coopBriefing = false;
  if (!state && multiplayer) {
    const seed = Math.floor(Math.random() * MAX_SEED);
    const rules = multiplayer.rules || RULES;
    const map = mapById(multiplayer.mapId, rules);
    state = { ...newGame({ rules, map, seed, sides: multiplayer.sides,
      phases: multiplayer.phases, setup: multiplayer.setup || null }), seats: multiplayer.seats };
    if (multiplayer.coop) state.coop = multiplayer.coop;
    coopBriefing = Boolean(multiplayer.coop);
    save();
  }
  if (!state) {
    const seed = Math.floor(Math.random() * MAX_SEED);
    if (mission !== null) {
      const m = MISSIONS[mission];
      const rules = missionRules(m, RULES);
      const map = missionMap(m, mapById(m.mapId, rules), rules);
      // The rank you play at adjusts the mission (see missionSetup in difficulty.js).
      const chosen = levelById(level);
      const game = newGame({ rules, map, seed, firstPlayer: HUMAN,
        setup: missionSetup(chosen, m.setup) });
      state = { ...game, campaign: { mission }, level: chosen.id };
      briefing = true;
    } else {
      const map = mapById(mapId, RULES);
      const chosen = levelById(level);
      const game = newGame({ rules: RULES, map, seed, firstPlayer: chosen.firstPlayer || HUMAN,
        setup: levelSetup(chosen, RULES) });
      state = { ...game, level: chosen.id };
      noteMap(map);
    }
    save();
  }
  const m = missionOf(state);
  aiPersonality = isMultiplayer() ? DEFAULT_PERSONALITY : opponentPersonality(state);
  aiPersonalities = {};
  me = isMultiplayer() ? firstLocalHuman() : HUMAN;
  els.objective.hidden = !m && !coopMissionOf(state);
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
  if (!m && !resume && !isMultiplayer()) {
    const chosen = levelById(state.level);
    showBanner(`${chosen.rank}: you face ${chosen.opponent}`, OPPONENT_BANNER_MS);
  }
  if (link) {
    link.onMessage(onLinkMessage);
    sayGameCode();
  }
  if (link && link.role === "host") {
    sendStart();
    link.onRejoin = (seat) => sendStart(seat);
  }
  if (coopBriefing) await showCoopBriefing();
  render();
  nextTurn(false);
}

// The first human on this device whose turn it is, or failing that the first on this
// device at all (whose view is shown while others play).
function firstLocalHuman() {
  const seats = seatsOf(state);
  const playing = state.active.find(isLocalHuman);
  if (playing !== undefined) return playing;
  const local = seats.findIndex((seat, p) => isLocalHuman(p));
  return local >= 0 ? local : HUMAN;
}

// Opens the game screen on a device that joined a game hosted elsewhere: start is the host's
// first message, { seat, seats, view }.
export async function joinGame({ linkTo, start, onLeave }) {
  els = els || findElements();
  if (!wired) wire(onLeave);
  link = linkTo;
  me = start.seat;
  state = clientState(start.view, start.seats, { coop: start.coop, coopSteps: start.steps });
  aiPersonality = DEFAULT_PERSONALITY;
  Object.assign(ui, { selectedId: null, mode: null, buildType: null, busy: false,
    effects: [], messages: ["Tap one of your units to give it orders."], moving: null,
    briefing: false });
  facing = {};
  flashedRound = null;
  pendingTips = [];
  history = [];
  undosLeft = 0;
  els.objective.hidden = !coopMissionOf(state);
  els.screen.hidden = false;
  els.over.hidden = true;
  preloadArt();
  await loadTiles(ASSET_VERSION);
  fitBoard();
  link.onMessage(onLinkMessage);
  save();
  sayGameCode();
  tip("welcome");
  if (coopMissionOf(state)) await showCoopBriefing();
  render();
  nextTurn(false);
}

// A client's copy of the game: its own view, with the seats as seen from this device (every
// other human is remote), and for a co-op mission which one and how far its steps are done
// (worked out by the host, which has the whole game).
function clientState(view, seats, { coop = null, coopSteps = null } = {}) {
  return { ...view, seats: seats.map((seat, p) => ({ ...seat, remote: p !== me })),
    coop, coopSteps };
}

// ---------------------------------------------------------------------------------------
// Campaign

function missionOf(s) {
  return s && s.campaign ? MISSIONS[s.campaign.mission] : null;
}

// ---------------------------------------------------------------------------------------
// Co-op campaign missions (coop-campaign.js)

function coopMissionOf(s) {
  return s && s.coop ? COOP_MISSIONS[s.coop.mission] : null;
}

const humanTeam = () => state.players.map((_, p) => p).filter((p) => !isAiSeat(p));
const aiTeam = () => state.players.map((_, p) => p).filter(isAiSeat);

// How far each step of a co-op mission is done: worked out from the whole game on the device
// holding it, and passed on to the others.
function coopSteps() {
  const m = coopMissionOf(state);
  if (!m || !m.steps) return null;
  if (isClient()) return state.coopSteps || m.steps.map(() => false);
  return m.steps.map((step) => step.done(state));
}

// The mission's story and objective, and who is playing, before it starts.
function showCoopBriefing() {
  const m = coopMissionOf(state);
  const index = state.coop.mission;
  const humans = humanTeam().map((p) => (p === me ? `${playerName(p)} (you)` : playerName(p)));
  return confirmDialog({
    title: `Co-op mission ${index + 1}: ${m.title}`,
    text: `${m.story}\n\nObjective: ${m.objective}\n\nYour team: ${humans.join(", ")}. ` +
      `Against you: ${namesOf(aiTeam())}.`,
    confirm: "Start",
    cancel: null,
  });
}

// The mission's story and objective before it starts, with the units it brings in (the first
// mission's are your first units). Resolves false if the player goes back.
function showBriefing(m, index) {
  const heading = index === 0 ? "Your units" : "New this mission";
  const level = levelById(state.level);
  return confirmDialog({
    title: `Mission ${index + 1}: ${m.title}`,
    text: `${m.story}\n\nObjective: ${m.objective}\n\nYour rank: ${level.rank}. ` +
      level.campaign.note,
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
    ...units.map((type) => card(unitImage(type, me), RULES.units[type].name,
      UNIT_ROLES[type])),
    ...upgrades.map((upgrade) => card(upgradeImage(upgrade),
      RULES.factoryUpgrades[upgrade].name, UPGRADE_ROLES[upgrade])),
  ];
  return `<h3 class="unlock-heading">${heading}</h3><ul class="unlocks">${cards.join("")}</ul>`;
}

// ---------------------------------------------------------------------------------------
// Turns: the AI's, and handing a shared device to the next human

// After every change of turn: the AI sides in the current phase play, then the device goes
// to the next human on it whose turn it is (on a shared device, through the hand-over
// screen), or waits for players on other devices. announce: show the round banner.
async function nextTurn(announce = true) {
  if (!state) return;
  if (state.result) {
    render();
    showGameOver();
    return;
  }
  if (!isClient() && isAiSeat(state.current)) {
    runAiTurn();
    return;
  }
  const local = state.active.filter(isLocalHuman);
  if (local.length && !local.includes(me)) await handOver(local[0]);
  render();
  if (!myTurn()) {
    const waiting = state.active.filter((p) => !isLocalHuman(p));
    if (waiting.length && isMultiplayer()) {
      say(`Waiting for ${namesOf(waiting)}.` +
        (mayResume() ? " Tap Turn ended to take your turn back." : ""));
    }
    render();
    return;
  }
  if (!announce) return;
  say(`Round ${state.round}: your turn.`);
  render();
  if (factoryUnderThreat()) {
    showBanner(`Round ${state.round}: enemy Infantry at your factory!`);
  } else {
    showBanner(`Round ${state.round}`, ROUND_BANNER_MS);
  }
}

// How many humans share this device.
function localHumanCount() {
  return seatsOf(state).filter((seat, p) => isLocalHuman(p)).length;
}

// The device passes to player p. With more than one human on it, the board is covered until
// they take it, so nobody sees another player's fog of war.
async function handOver(p) {
  const shared = localHumanCount() > 1;
  me = p;
  history = [];
  Object.assign(ui, { selectedId: null, mode: null, buildType: null });
  if (!shared) return;
  els.pass.hidden = false;
  els.passTitle.textContent = `${playerName(p)}'s turn`;
  els.passTitle.style.color = PLAYER_COLOURS[p].ring;
  els.passText.textContent = `Pass the device to ${playerName(p)}. Everyone else, look away.`;
  els.passGo.textContent = `I'm ${playerName(p)}: start`;
  await new Promise((resolve) => {
    els.passGo.addEventListener("click", resolve, { once: true });
  });
  els.pass.hidden = true;
  ui.messages = [`${playerName(p)}: your turn. Tap one of your units to give it orders.`];
}

// A mission whose objective is met is won at once; one that can fail is lost at once. In a
// co-op mission the whole team wins or loses together.
function checkObjective() {
  const coop = coopMissionOf(state);
  if (coop && !state.result && !isClient()) {
    const ended = (winners, reason) => {
      state = { ...state, result: { winner: winners[0], winners, reason, round: state.round } };
    };
    if (coop.failed && coop.failed(state)) ended(aiTeam(), "missionFailed");
    else if (coop.done && coop.done(state)) ended(humanTeam(), "objective");
    return;
  }
  const m = missionOf(state);
  if (!m || state.result) return;
  // Done is checked first: the VIP who reaches the far factory goes into it and leaves the
  // board, which must count as arriving, not falling.
  if (m.done && m.done(state)) {
    state = { ...state, result: { winner: HUMAN, reason: "objective", round: state.round } };
  } else if (m.failed && m.failed(state)) {
    state = { ...state, result: { winner: AI_PLAYER, reason: "missionFailed",
      round: state.round } };
  }
}

// The Objective button: the mission's story and objective, with its steps ticked off.
function showObjective() {
  const coop = coopMissionOf(state);
  if (coop) {
    const done = coopSteps();
    const steps = coop.steps ? `\n\n${coop.steps.map((step, i) =>
      `${done[i] ? "\u2714" : "\u2022"} ${step.text}`).join("\n")}` : "";
    confirmDialog({
      title: `Co-op mission ${state.coop.mission + 1}: ${coop.title}`,
      text: `Objective: ${coop.objective}${steps}\n\n${coop.story}`,
      confirm: "OK",
      cancel: null,
    });
    return;
  }
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
    pass: $("pass-device"), passTitle: $("pass-title"), passText: $("pass-text"),
    passGo: $("pass-go"),
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
    els.pass.hidden = true;
    if (link) link.close();
    link = null;
    onLeave();
  };
  leaveGame = leave;
  els.home.addEventListener("click", leave);
  els.toTitle.addEventListener("click", leave);
  // In the campaign: retry the mission, or go on to the next one.
  els.again.addEventListener("click", () => openGame(state.campaign
    ? { mission: state.campaign.mission, level: state.level, onLeave }
    : { mapId: state.map.id, level: state.level, onLeave }));
  els.newMap.addEventListener("click", () => openGame(state.campaign
    ? { mission: state.campaign.mission + 1, level: state.level, onLeave }
    : { mapId: newMapId(shapeOf(state.map.id)), level: state.level, onLeave }));
  els.objective.addEventListener("click", showObjective);
  // End turn; in a phase shared with other players, tapping it again takes the turn back
  // while they are still playing.
  els.endTurn.addEventListener("click", async () => {
    if (mayResume()) {
      await act({ type: "resumeTurn" });
      return;
    }
    if (!myTurn()) return;
    if (await act({ type: "endTurn" }) && !isClient()) nextTurn();
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
  return Boolean(state) && !state.result && !ui.busy && state.active.includes(me) &&
    isLocalHuman(me);
}

// Whether you have ended your turn while others in your phase play on, so can take it back.
function mayResume() {
  return Boolean(state) && !ui.busy && isLocalHuman(me) && canResumeTurn(state, me);
}

// ---------------------------------------------------------------------------------------
// Acting

async function act(request) {
  const action = { ...request, player: me };
  if (isClient()) return sendToHost(action);
  const before = viewFor(state, me);
  const previous = state;
  try {
    state = applyAction(state, action);
  } catch (error) {
    say(error.message.replace(/^Illegal action: /, "Not allowed: "));
    render();
    return false;
  }
  checkObjective();
  sendUpdates();
  // Undo can step back through this turn's actions; ending the turn (or taking it back)
  // closes them off.
  if (action.type === "endTurn" || action.type === "resumeTurn") history = [];
  else history.push(previous);
  const after = viewFor(state, me);
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
  const view = viewFor(state, me);
  if (!view.units[ui.selectedId]) ui.selectedId = null;
  ui.mode = ui.selectedId ? defaultMode(view, view.units[ui.selectedId]) : null;
}

// Takes back your last action this turn. What it revealed stays revealed: you cannot un-see
// a block you have turned over, just as on the table. Crystals the action drove over come
// back.
function undo() {
  if (!myTurn() || !history.length || undosLeft <= 0 || link) return;
  const previous = history.pop();
  const knew = state.players[me];
  state = {
    ...previous,
    players: previous.players.map((player, p) => (p !== me ? player : {
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
// The AI players who would surrender: in a single-player game the AI; in a multiplayer
// game with two teams, one of them all AI and you on the other (Phil, 29 October 2026: it is
// still just two teams, and an AI losing badly should be able to finish early), that team.
// Empty when Demand surrender does not apply.
function surrenderingSide() {
  if (!isMultiplayer()) return [AI_PLAYER];
  if (isClient()) return [];
  const players = state.players.map((_, p) => p).filter((p) => !state.players[p].out);
  const enemies = players.filter((p) => !allied(state, p, me));
  const teams = new Set(enemies.map((p) => state.players[p].team));
  return teams.size === 1 && enemies.every(isAiSeat) ? enemies : [];
}

async function demandSurrender() {
  const m = missionOf(state);
  const side = surrenderingSide();
  if (!myTurn() || (m && m.noSurrender) || !side.length) return;
  const who = isMultiplayer() ? namesOf(side) : opponentName();
  if (surrenderUsed) {
    await confirmDialog({
      title: "Surrender already demanded",
      text: "You can demand surrender only once a game. It is there to end a game early " +
        `when ${who} ${side.length > 1 ? "have" : "has"} no chance of winning.`,
      confirm: "OK",
      cancel: null,
    });
    return;
  }
  surrenderUsed = true;
  saveExtras();
  ui.busy = true;
  say(`${who} ${side.length > 1 ? "are" : "is"} considering your demand…`);
  render();
  const random = seededRandom(state.seed + state.round);
  // Every side is played by an AI in the playouts: humans with the hand-tuned one.
  const personalities = state.players.map((_, p) =>
    (isAiSeat(p) ? personalityOf(p) : DEFAULT_PERSONALITY));
  const rounds = state.players.length > 2 ? MULTI_SIDE_PLAYOUT_ROUNDS : undefined;
  const started = performance.now();
  let total = 0;
  let games = 0;
  while (games < RULES.surrenderPlayouts &&
    (games < MIN_PLAYOUTS || performance.now() - started < SURRENDER_THINK_MS)) {
    total += playout(state, side[0], personalities, random, rounds);
    games += 1;
    await sleep(0); // let the screen breathe between playouts
  }
  ui.busy = false;
  const chance = total / games;
  if (chance < RULES.surrenderBelow) {
    for (const p of side) {
      if (!state.result) state = applyAction(state, { type: "resign", player: p });
    }
    history = [];
    sendUpdates();
    save();
    render();
    showGameOver();
    return;
  }
  say(`${who} ${side.length > 1 ? "refuse" : "refuses"}: rates their chances at ` +
    `${Math.round(chance * PERCENT)}%.`);
  render();
}

// Quit: asks first, then ends the game as a loss for you.
// In a multiplayer game the player whose view is shown quits; the others play on if they can.
async function quitGame() {
  if (!state || state.result) return;
  const sure = await confirmDialog({
    title: "Quit this game?",
    text: isMultiplayer() ? `${playerName(me)} will be out of the game.`
      : "Quitting counts as a loss on this map.",
    confirm: "Quit",
    cancel: "Keep playing",
  });
  if (!sure || !state || state.result) return;
  if (isClient()) {
    sendToHost({ type: "resign", player: me });
    return;
  }
  state = applyAction(state, { type: "resign", player: me });
  history = [];
  sendUpdates();
  save();
  render();
  nextTurn();
}

async function runAiTurn() {
  if (!state || state.result || !isAiSeat(state.current)) return;
  ui.busy = true;
  ui.selectedId = null;
  ui.mode = null;
  say(`${playerName(state.current)} is moving…`);
  render();
  // A fault in the AI or in showing its moves must never leave its turn stuck: an AI action
  // that fails ends its turn, and a display fault is logged and skipped.
  while (!state.result && isAiSeat(state.current)) {
    const before = viewFor(state, me);
    const p = state.current;
    try {
      state = applyAction(state, chooseAction(viewFor(state, p), personalityOf(p)));
    } catch (error) {
      console.error(error);
      state = applyAction(state, { type: "endTurn", player: p });
    }
    checkObjective();
    sendUpdates();
    let seen = false;
    try {
      const after = viewFor(state, me);
      seen = showEvents(state.events, before, after);
      await showMoves(state.events, before, after);
      if (seen) render();
    } catch (error) {
      console.error(error);
    }
    // The pause lets you follow the AI's moves; nobody is watching a hidden page.
    if (seen && !document.hidden) await sleep(ui.attackShown ? ATTACK_READ_MS : AI_STEP_MS);
  }
  ui.busy = false;
  save();
  nextTurn();
}

// Whether enemy infantry stand next to one of your factories, able to overrun it next turn.
function factoryUnderThreat() {
  const view = viewFor(state, me);
  const factories = Object.values(view.units).filter((u) =>
    u.owner === me && unitStats(view, u).isFactory);
  return Object.values(view.units).some((u) => isEnemyOf(view, u.owner) &&
    factories.some((f) => distance(u.at, f.at) === 1 && canCapture(view, u, f)));
}

// Whether a unit's owner is an enemy of the player whose view is shown.
function isEnemyOf(view, owner) {
  return owner !== null && !allied(view, owner, me);
}

// Shows each move hex by hex along its route, turning the unit to face the way it goes. A
// Green unit is drawn only on hexes you can see.
async function showMoves(events, before, after) {
  const seen = (k) => before.visible[k] || after.visible[k];
  for (const e of events) {
    if (e.type !== "move" || !e.path.length) continue;
    const unit = before.units[e.unitId] || after.units[e.unitId];
    if (!unit || !(seen(e.from) || e.path.some(seen))) continue;
    const route = [e.from, ...e.path];
    facing[unit.id] = facingAngle(route[route.length - 2], route[route.length - 1]);
    if (prefersReducedMotion()) continue;
    // The board still shows the unit where it started, with nothing redrawn since the action,
    // so the move starts with its sound. The token there is hidden, and a copy of it floats
    // over the board, moved by the phone's graphics hardware like pan and zoom, until the
    // board is drawn again at the end.
    const parked = els.root.querySelector(`[data-unit="${unit.id}"]`);
    if (parked) parked.style.visibility = "hidden";
    const token = floatingToken(unit);
    token.place(...hexCentre(e.from), facingAngle(route[0], route[1]));
    // A Green unit shows only on hexes you can see.
    const shown = (k) => unit.owner === me || seen(k);
    token.img.style.visibility = shown(e.from) ? "visible" : "hidden";
    await glide(route, MOVE_MS / e.path.length, (x, y, angle, k) => {
      token.place(x, y, angle);
      token.img.style.visibility = shown(k) ? "visible" : "hidden";
    });
    token.img.remove();
  }
}

// A copy of a unit's token over the board, positioned with a CSS transform, with its damage
// badge and the label under it (crystals carried, passengers) as on the board: place(x, y,
// angle) puts its centre on board point (x, y) and turns the token (not the badge or label)
// by angle. img is the whole copy.
function floatingToken(unit) {
  const wrap = els.svg.parentElement;
  // Board points to positions in the frame, for the current view.
  const { scale, dx, dy } = layoutOf(viewBox);
  const size = tokenSize() * scale;
  const holder = document.createElement("div");
  holder.className = "moving-token";
  holder.style.width = `${size}px`;
  holder.style.height = `${size}px`;
  const token = document.createElement("img");
  token.src = unitImage(unit.type, unit.owner);
  token.alt = "";
  holder.appendChild(token);
  // Positions inside the copy are from its top-left corner, in screen pixels.
  const fromCentre = (dx, dy) => [size / 2 + dx * scale, size / 2 + dy * scale];
  if (unit.lives < state.rules.lives) {
    const badge = document.createElement("img");
    badge.src = "units/explosion.svg";
    badge.alt = "";
    badge.className = "moving-badge";
    const badgeSize = DAMAGE_BADGE.size * scale;
    const [bx, by] = fromCentre(DAMAGE_BADGE.dx, DAMAGE_BADGE.dy);
    Object.assign(badge.style, { width: `${badgeSize}px`, height: `${badgeSize}px`,
      left: `${bx - badgeSize / 2}px`, top: `${by - badgeSize / 2}px` });
    holder.appendChild(badge);
  }
  const below = unitLabel(unit);
  if (below) {
    const text = document.createElement("span");
    text.className = `moving-label ${below.style}`;
    text.textContent = below.text;
    const [lx, ly] = fromCentre(0, UNIT_LABEL_DY);
    Object.assign(text.style, { left: `${lx}px`, top: `${ly}px` });
    holder.appendChild(text);
  }
  wrap.appendChild(holder);
  const place = (x, y, angle) => {
    const left = dx + (x - viewBox.x) * scale;
    const top = dy + (y - viewBox.y) * scale;
    holder.style.transform = `translate(${left - size / 2}px, ${top - size / 2}px)`;
    token.style.transform = `rotate(${angle}deg)`;
  };
  return { img: holder, place };
}

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

// Runs once per screen frame until the route is done: draw(x, y, angle, hex) with the token's
// position, interpolated in a straight line between hex centres, each step taking stepMs, and
// the way it faces on that step; hex is the hex it is nearer. A page that is hidden (a phone
// locked or in another app) or not being drawn gets no frames, and the game must not wait
// for them, above all on a device hosting other players: it jumps to the end at once when
// hidden, and in any case once the move's time and GLIDE_GRACE_MS have passed.
const GLIDE_GRACE_MS = 500;

function glide(route, stepMs, draw) {
  const steps = route.length - 1;
  const total = stepMs * steps;
  return new Promise((resolve) => {
    let start = null;
    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      clearTimeout(fallback);
      const [from, to] = route.slice(-2);
      draw(...hexCentre(to), facingAngle(from, to), to);
      resolve();
    };
    const frame = (now) => {
      if (finished) return;
      start ??= now;
      const t = Math.min(now - start, total);
      const step = Math.min(steps - 1, Math.floor(t / stepMs));
      const share = t / stepMs - step;
      const [from, to] = [route[step], route[step + 1]];
      const [ax, ay] = hexCentre(from);
      const [bx, by] = hexCentre(to);
      draw(ax + (bx - ax) * share, ay + (by - ay) * share, facingAngle(from, to),
        share < 0.5 ? from : to);
      if (t < total) requestAnimationFrame(frame);
      else finish();
    };
    const fallback = setTimeout(finish, total + GLIDE_GRACE_MS);
    if (document.hidden) finish();
    else requestAnimationFrame(frame);
  });
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ---------------------------------------------------------------------------------------
// Events: messages and explosions for what blue can see

// "Your", "Green", "Unused": whose a unit is, in messages.
function ownerWord(owner) {
  if (owner === me) return "Your";
  return owner === null || owner === undefined ? "Unused" : PLAYER_COLOURS[owner].name;
}

function unitName(view, unitId, fallbackType, owner) {
  const unit = view.units[unitId];
  const type = unit ? unit.type : fallbackType;
  const who = ownerWord(unit ? unit.owner : owner);
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
  const knockedOut = [];
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
    } else if (e.type === "boom") {
      // A sonic boom: a shock wave running along its whole line.
      if (e.path.length && (seen(e.from) || e.path.some(seen))) {
        any = true;
        effects.push({ kind: "boom", from: e.from, at: e.at, path: e.path,
          ms: e.path.length * BOOM_STEP_MS });
      }
    } else if (e.type === "fireBlind" && e.seen) {
      // A sonic boom aimed at a hex with no target in sight.
      any = true;
      shooter = typeOf(e.unitId);
      sound(fireSound(typeOf(e.unitId)));
      lines.push(`${unitName(before, e.unitId)} fired a sonic boom.`);
    } else if (e.type === "fireBlind") {
      if (after.units[e.unitId]?.owner !== me && before.units[e.unitId]?.owner !== me) {
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
      if (mover && mover.owner === me && !unitStats(before, mover).air &&
        e.path.some((k) => after.map.hexes[k].terrain === "rocky")) tip("rough");
      // Only your own units say so; a Green unit stopped out of sight is not in your view.
      if (e.stoppedBy === "unit" && after.units[e.unitId]?.owner === me) {
        lines.push("Something hidden blocked the way.");
      }
      if (e.stoppedBy === "revealed" && after.units[e.unitId]?.owner === me) {
        // Only offer the rest of the move if it reaches somewhere (rough ground costs 2).
        const onward = Object.keys(reachableHexes(after, e.unitId)).length > 0;
        lines.push(onward ? `New ground turned over. ${e.moveLeft} move point` +
          `${e.moveLeft === 1 ? "" : "s"} left: tap where to go next.`
          : "New ground turned over. Not enough move left to go further this turn.");
        tip("newGround");
      }
    } else if (e.type === "crushed" && seen(e.at)) {
      lines.push(`${e.amount} crystals crushed.`);
    } else if (e.type === "blast" && seen(e.at)) {
      any = true;
      sound(fireSound(typeOf(e.unitId)));
      effects.push({ at: e.at, size: 0.9 });
      lines.push(`${unitName(before, e.unitId)} blew up ${e.amount} crystals.`);
    } else if (e.type === "crystalsExploded" && seen(e.at)) {
      tip("explosion");
      any = true;
      effects.push({ at: e.at, size: 0.9 });
      lines.push(`A crystal pile reached ${e.amount} and exploded.`);
    } else if (e.type === "harvest" || e.type === "unload") {
      const harvester = after.units[e.unitId];
      if (seen(harvester?.at)) sound(["harvest", 1]);
      if (harvester?.owner !== me) continue;
      if (e.type === "harvest") {
        lines.push(`Harvested ${e.amount} crystals.`);
      } else {
        lines.push(`Unloaded ${e.amount} crystals${e.automatic ? " at the factory" : ""}.`);
        unloaded += e.amount;
      }
    } else if (e.type === "build" && (after.units[e.unitId]?.owner === me || seen(e.at))) {
      any = true;
      lines.push(`${unitName(after, e.unitId)} built.`);
      if (after.units[e.unitId]?.owner === me) tip(`built:${e.unitType}`);
    } else if (e.type === "heal" && seen(after.units[e.unitId]?.at)) {
      lines.push(`${unitName(after, e.targetId)} repaired.`);
    } else if (e.type === "capture" && (seen(e.at) || e.from === me)) {
      any = true;
      sound(["capture", 1]);
      const whose = e.from === null ? "an unused"
        : e.from === me ? "your" : `${PLAYER_COLOURS[e.from].name}'s`;
      lines.push(`${e.owner === me ? "Your" : `${PLAYER_COLOURS[e.owner].name}'s`} infantry ` +
        "overran " +
        `${whose} factory${e.owner === me && e.crystals ? `: ${e.crystals} crystals ` +
          "in its store" : ""}.`);
    } else if (e.type === "board" && seen(e.at)) {
      any = true;
      lines.push(`${unitName(before, e.unitId)} boarded ` +
        `${unitName(after, e.transporterId).toLowerCase()}.`);
    } else if (e.type === "drop" && seen(e.at)) {
      any = true;
      lines.push(`${unitName(after, e.transporterId)} dropped off ` +
        `${RULES.units[after.units[e.unitId]?.type || "infantry"].name}.`);
    } else if (e.type === "resumeTurn" && e.player !== me) {
      lines.push(`${playerName(e.player)} took their turn back and is playing on.`);
    } else if (e.type === "labIncome" && e.player === me) {
      lines.push(`Crystal labs made ${e.amount} crystals.`);
    } else if (e.type === "knockedOut") {
      any = true;
      const who = e.player === me ? "You are" : `${PLAYER_COLOURS[e.player].name} is`;
      lines.push(`${who} out of the game: ${REASONS[e.reason]}.`);
      knockedOut.push(e.player);
    } else if (e.type === "upgrade" && seen(e.at)) {
      any = true;
      const upgrade = RULES.factoryUpgrades[e.upgrade].name;
      lines.push(`${unitName(after, e.factoryId)} added ${upgrade}.`);
    }
  }
  // Ground turned over by these events flashes as it appears.
  const turned = Object.keys(after.map.hexes).filter((k) =>
    after.map.hexes[k].terrain && !before.map.hexes[k].terrain);
  if (turned.length) {
    any = true;
    effects.push({ kind: "reveal", hexes: turned, ms: REVEAL_FLASH_MS });
  }
  for (const line of lines) say(line);
  waitForBoom(effects);
  if (effects.length) flash(effects);
  for (const [clip, volume] of sounds) playSound(clip, volume);
  if (unloaded) showBanner(`${unloaded} crystals unloaded`);
  if (knockedOut.length) showBanner(`${namesOf(knockedOut)} out of the game`);
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
  const view = viewFor(state, me);
  const army = Object.values(view.units).filter((u) =>
    u.owner === me && !unitStats(view, u).isFactory);
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

// A blast on a sonic boom's line waits until the wave gets there.
function waitForBoom(effects) {
  for (const boom of effects.filter((effect) => effect.kind === "boom")) {
    for (const effect of effects) {
      const step = boom.path.indexOf(effect.at);
      if (effect.kind || step < 0) continue;
      effect.delay = (step + 1) * BOOM_STEP_MS;
      effect.ms = effect.delay + EFFECT_MS;
    }
  }
}

// Shows the effects until the longest is over. Each remembers when it started, so a redraw
// part-way through carries on where it was instead of starting again.
function flash(effects) {
  const start = performance.now();
  for (const effect of effects) effect.start = start;
  ui.effects = effects;
  setTimeout(() => {
    if (ui.effects === effects) {
      ui.effects = [];
      render();
    }
  }, Math.max(EFFECT_MS, ...effects.map((effect) => effect.ms || 0)));
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
      ...crystalTargets(view, unitId), ...darkTargets(view, unitId)];
  }
  if (mode === "harvest") return harvestTargets(view, unitId);
  if (mode === "heal") return healTargets(view, unitId).map((id) => view.units[id].at);
  if (mode === "drop") return dropSites(view, unitId);
  if (mode === "build") {
    // Next to the selected factory only.
    const factory = view.units[unitId];
    return buildSites(view, me, ui.buildType).filter((k) => distance(k, factory.at) === 1);
  }
  return [];
}

// The order a unit is ready for. Firing blind into the dark is never the default.
function defaultMode(view, unit) {
  if (!unit || unit.owner !== me || !state.active.includes(me)) return null;
  return Object.keys(MODES).find((m) => (m === "fire" ? attackTargets(view, unit.id)
    : targetsFor(view, m, unit.id)).length) || null;
}

function actionFor(view, mode, unitId, k) {
  const unitOn = Object.values(view.units).find((u) => u.at === k);
  if (mode === "move") return { type: "move", unitId, to: k };
  if (mode === "fire") {
    const targetId = attackTargets(view, unitId).find((id) => view.units[id].at === k);
    if (targetId) return { type: "attack", unitId, targetId };
    if (crystalTargets(view, unitId).includes(k)) return { type: "blast", unitId, at: k };
    return { type: "attack", unitId, at: k };
  }
  if (mode === "harvest") return { type: "harvest", unitId, at: k };
  if (mode === "heal") return { type: "heal", unitId, targetId: unitOn.id };
  if (mode === "drop") return { type: "drop", unitId, at: k };
  if (mode === "build") return { type: "build", unitType: ui.buildType, at: k };
  return null;
}

async function onHexTap(k) {
  if (!state || ui.busy) return;
  const view = viewFor(state, me);
  if (myTurn() && ui.mode && targetsFor(view, ui.mode, ui.selectedId).includes(k)) {
    if (ui.mode === "fire" && !view.visible[k]) tip("blindFire");
    const unitId = ui.selectedId;
    if (ui.mode === "move" && crushingMoves(view, unitId).includes(k) &&
      !(await confirmCrush(view, unitId))) return;
    if (ui.mode === "move" && wrongFactoryForVip(view, unitId, k)) {
      await confirmDialog({
        title: "Not this factory",
        text: "Commander Jeanne must reach the far factory, marked in gold. Going into any " +
          "other factory would end her march here.",
        confirm: "OK",
        cancel: null,
      });
      return;
    }
    if (ui.mode === "fire" && crystalTargets(view, unitId).includes(k) &&
      !(await confirmBlast(view.crystals[k].amount))) return;
    act(actionFor(view, ui.mode, unitId, k));
    return;
  }
  const unit = Object.values(view.units).find((u) => u.at === k);
  ui.selectedId = unit ? unit.id : null;
  ui.mode = unit ? defaultMode(view, unit) : null;
  ui.buildType = null;
  render();
}

// Whether a move would take a mission's VIP into a factory other than the mission's target
// (The Maid's March): she would go into it and leave the board.
function wrongFactoryForVip(view, unitId, k) {
  const m = missionOf(state);
  if (!m || !m.target || view.units[unitId].type !== "vip") return false;
  const there = Object.values(view.units).find((u) => u.at === k);
  return Boolean(there && unitStats(view, there).isFactory) && k !== m.target(state.map);
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

// Firing on a crystal pile blows all of it up; ask first.
function confirmBlast(amount) {
  return confirmDialog({
    title: "Blow up the crystals?",
    text: `Crystals are unstable: a shot destroys the whole pile of ${amount}, and uses this ` +
      "unit's attack for the turn. Worth it to keep them from your enemy; a waste if you " +
      "could harvest them.",
    confirm: "Blow them up",
    cancel: "Cancel",
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
    if (unit.owner === me) {
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
  if (ui.mode === "fire" && crystalTargets(view, ui.selectedId).length) tip("blastCrystals");
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
    factories.some((f) => (f.owner === me) === mine && distance(u.at, f.at) === 1 &&
      canCapture(view, u, f)));
  if (besieging(me, false)) tip("siege");
  if (view.players.some((_, p) => isEnemyOf(view, p) && besieging(p, true))) tip("defend");
}

function onPanelClick(event) {
  const button = event.target.closest("button[data-order]");
  if (!button || button.disabled || !myTurn()) return;
  const { order, type } = button.dataset;
  const unitId = ui.selectedId;
  // With only one pile in reach there is nothing to choose, so Harvest acts at once.
  const view = viewFor(state, me);
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
  const view = viewFor(state, me);
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
      // Hexes out of sight can be fired into blind; they show fainter. Crystal piles that can
      // be blown up show yellow, like moves that would crush crystals.
      const blind = darkTargets(view, ui.selectedId);
      const piles = crystalTargets(view, ui.selectedId);
      overlays.push({ hexes: blind, style: "fireBlind" }, { hexes: piles, style: "crush" });
      targets = targets.filter((k) => !blind.includes(k) && !piles.includes(k));
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
  const coop = coopMissionOf(state);
  const name = m ? `Mission ${state.campaign.mission + 1}: ${m.title}`
    : coop ? `Co-op ${state.coop.mission + 1}: ${coop.title}` : view.map.name;
  els.round.innerHTML = `<span class="map-name">${name} · </span>Round ${view.round}`;
  const others = view.active.filter((p) => p !== me);
  const mine = view.active.includes(me);
  els.turn.textContent = mine ? (others.length ? `Your turn, with ${namesOf(others)}`
    : "Your turn") : `${namesOf(others)}'s turn`;
  els.turn.className = `turn-${PLAYER_COLOURS[mine ? me : others[0]].file}`;
  // Crystals in store, and what Crystal labs add at the end of each of your turns.
  const lab = view.rules.factoryUpgrades.lab;
  const labs = Object.values(view.units).filter((u) => u.owner === me &&
    (u.upgrades || []).includes("lab")).length;
  els.crystals.innerHTML = `${view.players[me].crystals}` +
    (labs ? `<small class="crystal-income">+${labs * lab.income}/turn</small>` : "");
  const resumable = mayResume();
  els.endTurn.disabled = !myTurn() && !resumable;
  els.endTurn.textContent = resumable ? "Turn ended" : "End turn";
  els.endTurn.classList.toggle("ended", resumable);
  els.endTurn.setAttribute("aria-pressed", String(resumable));
  els.endTurn.title = resumable ? "Tap to take your turn back" : "";
}

const HITS = { ground: "ground", air: "air only", both: "ground and air" };

// Attack and defence, the numbers that decide fights, in large type above the other stats.
// Defence shows any bonus from the ground the unit stands on.
function keyStats(view, unit) {
  const stats = unitStats(view, unit);
  return keyStatsOf(stats, defenceOf(view, unit) - stats.defence);
}

function keyStatsOf(stats, bonus = 0) {
  const shots = stats.shots > 1 ? ` \u00d7 ${stats.shots}` : "";
  const attack = stats.attack ? `<span>Attack ${stats.attack}${shots}</span>` : "";
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
  els.buildInfo.innerHTML = `<img src="${unitImage(type, me)}" alt="">` +
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
  if (stats.shots > 1) parts.push(`Fires ${stats.shots} times a turn, at different targets`);
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
  const { income, sharesVision } = RULES.factoryUpgrades[upgrade];
  if (income) return `+${income} crystals every turn`;
  if (sharesVision) return "Share sight with allies who have Comms too";
  return `Builds ${buildableTypes(state).filter((t) => RULES.units[t].needs === upgrade)
    .map((t) => RULES.units[t].name).join(", ")}`;
}

// A factory's panel: its upgrades, then the units it can build. Unused and enemy factories
// show only what they are.
function factoryPanel(view, unit, head) {
  if (unit.owner !== me) {
    const store = unit.store ? ` Its store holds ${unit.store} crystals.` : "";
    const hint = unit.owner === null
      ? `Infantry next to it at the start of your turn can move in and capture it.${store}`
      : "";
    els.panel.innerHTML = `${head}<p class="panel-hint">${hint}</p>`;
    return;
  }
  const crystals = view.players[me].crystals;
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
      const label = `<img src="${unitImage(type, me)}" alt="">` +
        `${view.rules.units[type].name}<span class="cost">${cost}</span>`;
      const sites = buildSites(view, me, type).some((k) => distance(k, unit.at) === 1);
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
    const m = missionOf(state) || coopMissionOf(state);
    let objective = m ? `<p class="panel-objective">Objective: ${m.objective}</p>` : "";
    if (m && m.steps) {
      const done = coopMissionOf(state) ? coopSteps() : m.steps.map((step) => step.done(state));
      objective += `<ol class="mission-steps">${m.steps.map((step, i) =>
        `<li${done[i] ? ' class="done"' : ""}>${step.text}</li>`).join("")}</ol>`;
    }
    const factory = view.players[me].factoryId !== null ? ", or your factory to build" : "";
    const others = state.active.filter((p) => p !== me);
    const hint = myTurn()
      ? `Tap a unit to see its orders${factory}. Drag to pan, pinch or scroll to zoom.`
      : `${namesOf(others)} ${others.length > 1 ? "are" : "is"} taking their turn.`;
    const undo = history.length ? undoButton() : "";
    // Some campaign missions (Green has nothing to surrender), and multiplayer games, leave
    // the button out.
    const surrender = (m && m.noSurrender) || !surrenderingSide().length ? ""
      : orderButton("surrender", surrenderUsed ? "Surrender demanded" : "Demand surrender",
        myTurn());
    els.panel.innerHTML = `${objective}<p class="panel-hint">${hint}</p>` +
      `<div class="orders">${undo}${surrender}</div>`;
    return;
  }
  const stats = unitStats(view, unit);
  const mine = unit.owner === me;
  const status = [unit.lives < view.rules.lives ? "Damaged" : "Undamaged"];
  let name = `${ownerWord(unit.owner)} ${stats.name}`;
  if (stats.isFactory) {
    const home = view.players.some((p) => p.factoryId === unit.id);
    name = `${ownerWord(unit.owner)} ${home ? "home factory" : "factory"}`;
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
  const shotsLeft = (stats.shots || 1) - (unit.shotsFired || 0);
  if (mine && stats.shots > 1 && unit.shotsFired && !unit.acted) {
    status.push(`${shotsLeft} shot${shotsLeft === 1 ? "" : "s"} left`);
  }
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

// A multiplayer game's end: who won, or that it was a draw. Only Main menu is offered.
function showMultiplayerOver() {
  const { winner, reason, round } = state.result;
  const winners = state.result.winners || (winner === null ? [] : [winner]);
  const locals = seatsOf(state).map((_, p) => p).filter(isLocalHuman);
  const mineWon = localHumanCount() === 1 && winners.includes(locals[0]);
  if (!winners.length) els.overTitle.textContent = "Draw";
  else if (mineWon) els.overTitle.textContent = winners.length > 1 ? "Your team wins" : "You win";
  else els.overTitle.textContent = `${namesOf(winners)} ${winners.length > 1 ? "win" : "wins"}`;
  els.overText.textContent = `The last of the others: ${REASONS[reason]} (round ${round}).`;
  // A co-op mission: won or failed together, and a win recorded on every player's device.
  const coop = coopMissionOf(state);
  if (coop) {
    const won = winners.some((p) => !isAiSeat(p));
    els.overTitle.textContent = won ? "Mission complete" : "Mission failed";
    if (won) markCoopMissionDone(state.coop.mission);
    els.overText.textContent = won
      ? `Objective met (round ${round}).${state.coop.mission + 1 < COOP_MISSIONS.length
        ? " The next co-op mission is unlocked." : " Kharon is yours."}`
      : `${reason === "missionFailed" ? coop.failText : `Your team was beaten: ` +
        `${REASONS[reason]}.`} (round ${round})`;
  }
  els.again.hidden = true;
  els.newMap.hidden = true;
  els.overUnlocks.hidden = true;
  els.over.hidden = false;
}

function showGameOver() {
  // Shown once: several paths can reach the end of a game.
  if (!els.over.hidden) return;
  if (isMultiplayer()) {
    showMultiplayerOver();
    return;
  }
  els.again.hidden = false;
  const { winner, reason } = state.result;
  const m = missionOf(state);
  if (!m) noteMap(state.map, state.result);
  els.overTitle.textContent =
    winner === me ? "You win" : winner === AI_PLAYER ? "Green wins" : "Draw";
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
    const won = winner === me;
    if (won) markMissionDone(index, state.level);
    els.overTitle.textContent = won ? "Mission complete" : "Mission failed";
    if (won && reason === "objective") text = `Objective met ${round}.`;
    if (won) text += ` Won at the rank of ${levelById(state.level).rank}.`;
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
// Games on several devices (the link itself is in net.js)

// Host: each remote human (or just only, one who has rejoined) gets the start of the game:
// their seat, the seats and their view.
function sendStart(only = null) {
  seatsOf(state).forEach((seat, p) => {
    if (seat.remote && (only === null || only === p)) {
      link.send(p, { type: "start", seat: p, seats: seatsOf(state), view: viewFor(state, p),
        coop: state.coop || null, steps: coopSteps() });
    }
  });
}

// Host: after every change, each remote human gets their new view and the events of it they
// could see (so a device never learns what its player cannot see). ref: the request a
// remote player's action answered, sent back to them.
function sendUpdates(ref = null, from = null) {
  if (!link || link.role !== "host") return;
  seatsOf(state).forEach((seat, p) => {
    if (!seat.remote) return;
    const view = viewFor(state, p);
    link.send(p, { type: "update", view, events: visibleEvents(state.events, view),
      ref: p === from ? ref : null, steps: coopSteps() });
  });
}

// Events every player hears about, wherever they happen.
const EVENTS_FOR_ALL = ["endTurn", "resumeTurn", "newRound", "knockedOut", "gameOver"];

// The events a player could see: those on hexes they can see, or about their own units.
function visibleEvents(events, view) {
  const hexes = (e) => [e.at, e.from, e.to, ...(e.path || [])].filter(Boolean);
  const theirs = (id) => view.units[id] && view.units[id].owner === view.viewer;
  return events.filter((e) => e.player === view.viewer || theirs(e.unitId) ||
    theirs(e.targetId) || hexes(e).some((k) => view.visible[k]) ||
    EVENTS_FOR_ALL.includes(e.type) || (e.unitId && view.units[e.unitId]) ||
    (e.targetId && view.units[e.targetId]));
}

// Host: one change at a time, so actions from several devices never overlap.
let hostQueue = Promise.resolve();

function onLinkMessage(message, from) {
  if (link.role === "host") {
    hostQueue = hostQueue.then(() => hostReceive(message, from)).catch(console.error);
  } else {
    clientReceive(message);
  }
}

// Host: an action from a remote player is applied in the order it arrived; one that is no
// longer possible (someone got there first) is refused.
async function hostReceive(message, from) {
  if (message.type !== "act" || state.result) return;
  const action = { ...message.action, player: from };
  const before = viewFor(state, me);
  const wasMine = state.active.includes(me);
  try {
    state = applyAction(state, action);
  } catch (error) {
    link.send(from, { type: "refused", ref: message.ref,
      text: error.message.replace(/^Illegal action: /, "Not allowed: ") });
    return;
  }
  checkObjective();
  sendUpdates(message.ref, from);
  const after = viewFor(state, me);
  showEvents(state.events, before, after);
  save();
  await showMoves(state.events, before, after);
  render();
  if (action.type === "endTurn" || action.type === "resign" || state.result) {
    nextTurn(!wasMine && state.active.includes(me));
  }
}

// Client: actions go to the host; the answer is an update (or a refusal) carrying the
// request's ref.
let nextRef = 1;
const waiting = new Map();

function sendToHost(action) {
  // A dropped connection loses the action: reconnect, and the player taps again.
  if (!link.isOpen()) {
    rejoin();
    return Promise.resolve(false);
  }
  const ref = nextRef++;
  ui.busy = true;
  render();
  link.send(null, { type: "act", action, ref });
  return new Promise((resolve) => waiting.set(ref, resolve));
}

async function clientReceive(message) {
  if (message.type === "refused") {
    say(message.text);
    ui.busy = false;
    render();
    waiting.get(message.ref)?.(false);
    waiting.delete(message.ref);
  } else if (message.type === "update") {
    const before = state;
    state = clientState(message.view, seatsOf(state),
      { coop: state.coop, coopSteps: message.steps });
    save();
    showEvents(message.events, before, state);
    ui.busy = true;
    await showMoves(message.events, before, state);
    ui.busy = false;
    const answered = waiting.get(message.ref);
    if (answered) {
      waiting.delete(message.ref);
      afterAction(message.events.find((e) => e.type === "endTurn") ? { type: "endTurn" }
        : { type: "update" });
      answered(true);
    } else if (ui.selectedId && !state.units[ui.selectedId]) {
      ui.selectedId = null;
      ui.mode = null;
    }
    render();
    if (state.result) showGameOver();
    else if (answered) nudgeEndTurn();
    if (message.events.some((e) => e.type === "endTurn" || e.type === "newRound")) {
      nextTurn(!before.active.includes(me) && state.active.includes(me));
    }
  } else if (message.type === "start") {
    // Back after a dropped connection: the host sends the whole game again. Anything sent
    // while the connection was down was lost.
    state = clientState(message.view, message.seats,
      { coop: message.coop, coopSteps: message.steps });
    for (const answer of waiting.values()) answer(false);
    waiting.clear();
    ui.busy = false;
    say("Reconnected to the host.");
    render();
    nextTurn(false);
  } else if (message.type === "closed") {
    rejoin();
  }
}

// The game's code in the log, for a device that drops out and has to join again by hand.
function sayGameCode() {
  say(`Game code ${link.code}. A device that drops out comes back with Resume.`);
}

// Client: after the connection to the host drops (a phone gone to sleep, a weak signal),
// joins again with the same code until the host answers; the host gives this device its
// seat back and sends the game again.
let rejoining = false;

async function rejoin() {
  if (rejoining || !isClient()) return;
  rejoining = true;
  const code = link.code;
  say("Lost the host. Reconnecting…");
  ui.busy = true;
  render();
  for (let attempt = 0; attempt < REJOIN_ATTEMPTS; attempt++) {
    if (attempt) await new Promise((resolve) => setTimeout(resolve, REJOIN_DELAY_MS));
    if (!isClient() || link.code !== code) break;
    try {
      const joined = await joinRemote(code);
      if (!isClient() || link.code !== code) {
        joined.link.close();
        break;
      }
      link.close();
      link = joined.link;
      link.onMessage(onLinkMessage);
      rejoining = false;
      return;
    } catch {
      // The host is not back yet: try again.
    }
  }
  rejoining = false;
  if (isClient()) {
    say(`Could not reach the host. Once it is back, choose Resume (or Join a game, code ` +
      `${code}).`);
    render();
  }
}

// A phone coming back to the app finds out its connection dropped while it was away.
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible" && isClient() && !link.isOpen()) rejoin();
});

// ---------------------------------------------------------------------------------------
// Pan, zoom and taps

// viewBox is where the player has panned and zoomed to. The SVG always holds the whole map
// (drawn, the area the board's frame shows with the map fitted to it), drawn at the current
// zoom (drawnScale, screen pixels per board unit), so it can be bigger than the frame. A pan
// only slides it with a CSS transform: the phone moves the picture it has already drawn and
// nothing is redrawn, so no part of the map is missing as it slides in. A pinch or wheel zoom
// scales the picture the same way, and the map is drawn again, sharp at the new zoom, when
// the zoom ends. Touch points are turned into board coordinates from the frame's box measured
// when the board is fitted, so no layout is forced mid-gesture.
let drawn = null;
let drawnScale = null;
let boardBox = null;
let frameRequest = null;
let wheelTimer = null;
// After the last wheel step, the zoom is committed (redrawn sharp) after this pause.
const WHEEL_COMMIT_MS = 150;
// Zooms closer than this ratio count as the same zoom (no redraw needed).
const SAME_ZOOM = 1e-6;

function fitBoard() {
  fitBox = boardBounds(state.map);
  viewBox = { ...fitBox };
  commitView();
}

// Draws the whole map at the current zoom (sharp) and places it for the current view.
function commitView() {
  clearTimeout(wheelTimer);
  cancelAnimationFrame(frameRequest);
  frameRequest = null;
  boardBox = els.svg.parentElement.getBoundingClientRect();
  const fit = layoutOf(fitBox);
  drawn = { x: fitBox.x - fit.dx / fit.scale, y: fitBox.y - fit.dy / fit.scale,
    width: boardBox.width / fit.scale, height: boardBox.height / fit.scale };
  drawnScale = layoutOf(viewBox).scale;
  els.svg.setAttribute("viewBox", `${drawn.x} ${drawn.y} ${drawn.width} ${drawn.height}`);
  els.svg.style.width = `${drawn.width * drawnScale}px`;
  els.svg.style.height = `${drawn.height * drawnScale}px`;
  els.svg.style.transform = viewTransform();
}

// After a gesture: draws the map again only if the zoom changed (a pan needs no redraw).
function settleView() {
  if (Math.abs(layoutOf(viewBox).scale / drawnScale - 1) > SAME_ZOOM) commitView();
}

// How a box of board coordinates is laid out in the board's frame when it is fitted to it
// (as preserveAspectRatio xMidYMid meet would): screen pixels per board unit, and where the
// box starts inside the frame.
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

// The CSS transform that shows the current view from the map as drawn.
function viewTransform() {
  const to = layoutOf(viewBox);
  const k = to.scale / drawnScale;
  const tx = to.dx + to.scale * (drawn.x - viewBox.x);
  const ty = to.dy + to.scale * (drawn.y - viewBox.y);
  return `translate(${tx}px, ${ty}px) scale(${k})`;
}

// Shows the current view on the next frame.
function showView() {
  if (frameRequest) return;
  frameRequest = requestAnimationFrame(() => {
    frameRequest = null;
    els.svg.style.transform = viewTransform();
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
    if (!pointers.size) settleView();
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
    // The last finger up ends the gesture: after a zoom, draw the board sharp straight away.
    if (!pointers.size && dragged) settleView();
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
    wheelTimer = setTimeout(settleView, WHEEL_COMMIT_MS);
  }, { passive: false });
}

function pinchState(pointers) {
  const [a, b] = [...pointers.values()];
  return { distance: Math.hypot(a.x - b.x, a.y - b.y) || 1,
    midX: (a.x + b.x) / 2, midY: (a.y + b.y) / 2 };
}
