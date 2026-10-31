// Setting up a multiplayer game (Phil, 29 October 2026): who plays each side, then either
// starting on this device or hosting it for other devices, and joining someone else's game.
// Two kinds of game:
// - Take turns: 2 to 4 sides, each a human (on this device or another) or the AI, in teams
//   chosen here; one side moves at a time.
// - Same time (co-op): 2 to 4 humans, one device each, on one team against one or two AI sides.
//   The humans play at the same time; then the AI team takes its turn. The AI starts with more
//   for each human it faces (see coopSetup).
import { shapesForSides, MAP_SHAPES, MULTI_SIDE_SHAPES } from "./maps.js?v=0.81";
import { LEVELS, DEFAULT_LEVEL } from "./difficulty.js?v=0.81";
import { hostGame, joinGame as joinRemote } from "./net.js?v=0.81";
import { openGame, joinGame as openJoinedGame } from "./game.js?v=0.81";
import { PLAYER_COLOURS } from "./board.js?v=0.81";
import { RULES } from "./rules-config.js?v=0.81";
import { COOP_MISSIONS, coopPlan } from "./coop-campaign.js?v=0.81";

const MIN_SIDES = 2;
const MAX_TURN_SIDES = 4;
const MIN_COOP_HUMANS = 2;
const MAX_COOP_HUMANS = 4;
// Sides a game can have: one per player colour.
const MAX_SIDES = 5;
const MAX_COOP_AIS = 2;
// An AI side facing this many humans or more for each AI also starts with a Crystal lab.
const HUMANS_PER_AI_FOR_LAB = 2;
// Generated maps are numbered from 1 up to this when picked at random.
const NEW_MAP_RANGE = 99999;
const TEAM_NAMES = ["A", "B", "C", "D"];
// What a side can be: a human here, a human on another device, or the AI at a rank.
const HERE = "here";
const REMOTE = "remote";

const setup = {
  mode: "turns",
  // Take turns: { kind, team } for each side; kind is HERE, REMOTE or an AI rank's id.
  sides: [{ kind: HERE, team: 0 }, { kind: DEFAULT_LEVEL, team: 1 }],
  // Same time: where each human plays, and the AI's rank.
  humans: [HERE, REMOTE],
  aiLevel: DEFAULT_LEVEL,
  aiCount: 1,
};

let hooks = null;
let host = null;
const $ = (id) => document.getElementById(id);

// Wires up the menus: show(screen) hides the main menu, back() returns to it.
export function wireMultiplayer({ leaveTo }) {
  hooks = { leaveTo };
  $("menu-multi").addEventListener("click", showSetup);
  $("menu-join").addEventListener("click", showJoin);
  $("mp-cancel").addEventListener("click", () => { $("mp-setup").hidden = true; });
  $("mp-start").addEventListener("click", start);
  $("mp-setup").addEventListener("change", onChange);
  $("mp-setup").addEventListener("click", onClick);
  $("mp-lobby-cancel").addEventListener("click", cancelLobby);
  $("mp-lobby-start").addEventListener("click", startHosted);
  $("mp-join-cancel").addEventListener("click", cancelJoin);
  $("mp-join-form").addEventListener("submit", (e) => {
    e.preventDefault();
    join($("mp-code").value);
  });
  $("coop-cancel").addEventListener("click", () => { $("coop-setup").hidden = true; });
  $("coop-start").addEventListener("click", startCoop);
  $("coop-setup").addEventListener("change", (e) => {
    const { human } = e.target.dataset;
    if (human !== undefined) coop.where[human] = e.target.value;
    renderCoop();
  });
}

// ---------------------------------------------------------------------------------------
// A co-op campaign mission: where each of its humans plays (the mission sets how many)

const coop = { mission: 0, where: [HERE, REMOTE] };

export function showCoopSetup(mission) {
  coop.mission = mission;
  coop.where = [HERE, ...Array.from({ length: COOP_MISSIONS[mission].humans - 1 },
    () => REMOTE)];
  renderCoop();
  $("coop-setup").hidden = false;
}

function renderCoop() {
  const m = COOP_MISSIONS[coop.mission];
  const plan = coopPlan(coop.mission, coop.where.length);
  $("coop-title").textContent = `Co-op mission ${coop.mission + 1}: ${m.title}`;
  $("coop-objective").textContent = `${m.objective} Against you: ` +
    `${plan.seats.length - coop.where.length} AI side` +
    `${plan.seats.length - coop.where.length > 1 ? "s" : ""}.`;
  $("coop-players").innerHTML = coop.where.map((where, p) => `<li>${colourChip(p)}` +
    `<select data-human="${p}">${kindOptions(where, true)}</select></li>`).join("");
  const here = coop.where.includes(HERE);
  $("coop-problem").textContent = here ? "" : "At least one player must be on this device.";
  $("coop-start").disabled = !here;
  $("coop-start").textContent = coop.where.includes(REMOTE) ? "Host game" : "Start";
}

function startCoop() {
  const plan = coopPlan(coop.mission, coop.where.length);
  plan.seats = plan.seats.map((seat, p) => (p < coop.where.length
    ? { kind: "human", remote: coop.where[p] === REMOTE } : seat));
  chosen = plan;
  $("coop-setup").hidden = true;
  const remoteSeats = plan.seats.map((seat, s) => (seat.remote ? s : null))
    .filter((s) => s !== null);
  if (!remoteSeats.length) {
    hooks.leaveTo(false);
    openGame({ multiplayer: chosen, onLeave: () => hooks.leaveTo(true) });
    return;
  }
  showLobby(remoteSeats);
}

// ---------------------------------------------------------------------------------------
// The setup screen

function showSetup() {
  renderSetup();
  $("mp-setup").hidden = false;
}

// The seats, teams and phases for newGame and the game screen, from the choices made.
function plan() {
  if (setup.mode === "coop") {
    const humans = setup.humans.map((where) => ({ kind: "human", remote: where === REMOTE }));
    const ais = Array.from({ length: setup.aiCount },
      () => ({ kind: "ai", level: setup.aiLevel }));
    const seats = [...humans, ...ais];
    const sides = seats.map((seat) => ({ team: seat.kind === "ai" ? 1 : 0 }));
    const aiSeats = ais.map((_, i) => humans.length + i);
    return { seats, sides, phases: [humans.map((_, p) => p), aiSeats],
      setup: coopSetup(humans.length, aiSeats) };
  }
  const seats = setup.sides.map((side) => (side.kind === HERE ? { kind: "human" }
    : side.kind === REMOTE ? { kind: "human", remote: true } : { kind: "ai", level: side.kind }));
  const sides = setup.sides.map((side) => ({ team: side.team }));
  return { seats, sides, phases: seats.map((_, p) => [p]) };
}

// The start of a co-op game (provisional): humans start as usual; the AI team is scaled to the
// number of humans it faces. Each AI side starts with the usual crystals and units (and the
// second player's extra crystals, as it moves after the humans) times the number of humans
// per AI side, rounded, and with a Crystal lab when that is 2 or more.
function coopSetup(humanCount, aiSeats) {
  const { crystals, units, secondPlayerCrystals } = RULES.start;
  const scale = Math.max(1, Math.round(humanCount / aiSeats.length));
  const count = humanCount + aiSeats.length;
  const ai = (p) => aiSeats.includes(p);
  return {
    units: Array.from({ length: count }, (_, p) =>
      (ai(p) ? Array.from({ length: scale }, () => units).flat() : [...units])),
    crystals: Array.from({ length: count }, (_, p) =>
      (ai(p) ? (crystals + (secondPlayerCrystals || 0)) * scale : crystals)),
    upgrades: Array.from({ length: count }, (_, p) =>
      (ai(p) && scale >= HUMANS_PER_AI_FOR_LAB ? ["lab"] : [])),
  };
}

// What is wrong with the choices, or "" if the game can start.
function problem({ seats, sides }) {
  if (!seats.some((seat) => seat.kind === "human" && !seat.remote)) {
    return "At least one human must play on this device.";
  }
  if (new Set(sides.map((side) => side.team)).size < 2) return "There must be two teams.";
  if (!shapesForSides(seats.length).length) return `No maps for ${seats.length} sides yet.`;
  return "";
}

function colourChip(p) {
  return `<span class="mp-colour" style="background:${PLAYER_COLOURS[p].ring}"></span>` +
    `${PLAYER_COLOURS[p].name}`;
}

function kindOptions(selected, humansOnly = false) {
  const options = [[HERE, "Human, this device"], [REMOTE, "Human, another device"]];
  if (!humansOnly) {
    for (const level of LEVELS) options.push([level.id, `AI: ${level.rank} (${level.level})`]);
  }
  return options.map(([value, text]) =>
    `<option value="${value}"${value === selected ? " selected" : ""}>${text}</option>`)
    .join("");
}

function renderSetup() {
  for (const button of document.querySelectorAll("[data-mp-mode]")) {
    button.classList.toggle("active", button.dataset.mpMode === setup.mode);
  }
  let rows = "";
  if (setup.mode === "coop") {
    rows = setup.humans.map((where, p) => `<li>${colourChip(p)}<select data-human="${p}">` +
      `${kindOptions(where, true)}</select></li>`).join("");
    setup.aiCount = Math.min(setup.aiCount, MAX_SIDES - setup.humans.length);
    const ais = Array.from({ length: setup.aiCount }, (_, i) => setup.humans.length + i);
    rows += ais.map((ai) => `<li>${colourChip(ai)}<select data-ai-level>${LEVELS.map((level) =>
      `<option value="${level.id}"${level.id === setup.aiLevel ? " selected" : ""}>` +
      `AI: ${level.rank} (${level.level})</option>`).join("")}</select></li>`).join("");
    const room = Math.min(MAX_COOP_AIS, MAX_SIDES - setup.humans.length);
    rows += `<li><label class="mp-team">AI sides <select data-ai-count>${[1, 2]
      .filter((n) => n <= room).map((n) => `<option value="${n}"` +
        `${n === setup.aiCount ? " selected" : ""}>${n}</option>`).join("")}</select>` +
      "</label></li>";
  } else {
    rows = setup.sides.map((side, p) => `<li>${colourChip(p)}<select data-side="${p}">` +
      `${kindOptions(side.kind)}</select><label class="mp-team">Team <select ` +
      `data-team="${p}">${TEAM_NAMES.slice(0, setup.sides.length).map((name, t) =>
        `<option value="${t}"${t === side.team ? " selected" : ""}>${name}</option>`)
        .join("")}</select></label></li>`).join("");
  }
  $("mp-sides").innerHTML = rows;
  const count = setup.mode === "coop" ? setup.humans.length : setup.sides.length;
  const min = setup.mode === "coop" ? MIN_COOP_HUMANS : MIN_SIDES;
  const max = setup.mode === "coop" ? MAX_COOP_HUMANS : MAX_TURN_SIDES;
  $("mp-fewer").disabled = count <= min;
  $("mp-more").disabled = count >= max;
  $("mp-more").textContent = setup.mode === "coop" ? "Add a human" : "Add a side";
  const p = plan();
  const shapes = shapesForSides(p.seats.length);
  const shape = $("mp-shape").value;
  $("mp-shape").innerHTML = shapes.map((s) => {
    const info = MAP_SHAPES[s] || MULTI_SIDE_SHAPES[s];
    return `<option value="${s}"${s === shape ? " selected" : ""}>${info.name}</option>`;
  }).join("");
  const wrong = problem(p);
  const remote = p.seats.some((seat) => seat.remote);
  $("mp-problem").textContent = wrong;
  $("mp-start").disabled = Boolean(wrong);
  $("mp-start").textContent = remote ? "Host game" : "Start";
  $("mp-explain").textContent = setup.mode === "coop"
    ? "Everyone plays at the same time, one device each, against the AI, which starts with " +
      "more for each human it faces. Whoever gets somewhere first gets there."
    : "One side moves at a time. Humans can share this device (it is passed round) or " +
      "play on their own.";
}

function onClick(e) {
  const mode = e.target.closest("[data-mp-mode]");
  if (mode) {
    setup.mode = mode.dataset.mpMode;
    renderSetup();
    return;
  }
  if (e.target.id === "mp-more") {
    if (setup.mode === "coop") setup.humans.push(REMOTE);
    else setup.sides.push({ kind: DEFAULT_LEVEL, team: setup.sides.length });
    renderSetup();
  } else if (e.target.id === "mp-fewer") {
    if (setup.mode === "coop") setup.humans.pop();
    else setup.sides.pop();
    for (const side of setup.sides) side.team = Math.min(side.team, setup.sides.length - 1);
    renderSetup();
  }
}

function onChange(e) {
  const { side, team, human } = e.target.dataset;
  if (side !== undefined) setup.sides[side].kind = e.target.value;
  if (team !== undefined) setup.sides[team].team = Number(e.target.value);
  if (human !== undefined) setup.humans[human] = e.target.value;
  if (e.target.dataset.aiLevel !== undefined) setup.aiLevel = e.target.value;
  if (e.target.dataset.aiCount !== undefined) setup.aiCount = Number(e.target.value);
  renderSetup();
}

function mapIdFor(count, shape) {
  const number = 1 + Math.floor(Math.random() * NEW_MAP_RANGE);
  const base = shape === "classic" ? `map-${number}` : `map-${number}-${shape}`;
  return count > 2 ? `${base}-${count}p` : base;
}

let chosen = null;

async function start() {
  const p = plan();
  if (problem(p)) return;
  chosen = { ...p, mapId: mapIdFor(p.seats.length, $("mp-shape").value) };
  $("mp-setup").hidden = true;
  const remoteSeats = p.seats.map((seat, s) => (seat.remote ? s : null))
    .filter((s) => s !== null);
  if (!remoteSeats.length) {
    hooks.leaveTo(false);
    openGame({ multiplayer: chosen, onLeave: () => hooks.leaveTo(true) });
    return;
  }
  showLobby(remoteSeats);
}

// ---------------------------------------------------------------------------------------
// Hosting: wait for the other devices, then start

async function showLobby(remoteSeats) {
  $("mp-lobby").hidden = false;
  $("mp-lobby-code").textContent = "…";
  $("mp-lobby-start").disabled = true;
  const list = (joined) => remoteSeats.map((s) =>
    `<li>${colourChip(s)}<span class="muted">${joined.includes(s) ? "joined" : "waiting…"}` +
    "</span></li>").join("");
  $("mp-lobby-players").innerHTML = list([]);
  $("mp-lobby-status").textContent = "Setting up the game…";
  try {
    host = await hostGame({ remoteSeats, onPlayers: (joined) => {
      $("mp-lobby-players").innerHTML = list(joined);
      $("mp-lobby-start").disabled = !remoteSeats.every((s) => joined.includes(s));
    } });
  } catch (error) {
    $("mp-lobby-status").textContent = error.message;
    return;
  }
  $("mp-lobby-code").textContent = host.code;
  $("mp-lobby-status").textContent = "On each other device, open Mech Attack, choose Join " +
    "game and enter this code.";
}

function cancelLobby() {
  if (host) host.close();
  host = null;
  $("mp-lobby").hidden = true;
}

function startHosted() {
  $("mp-lobby").hidden = true;
  hooks.leaveTo(false);
  const linkTo = host;
  host = null;
  openGame({ multiplayer: chosen, linkTo, onLeave: () => hooks.leaveTo(true) });
}

// ---------------------------------------------------------------------------------------
// Joining someone else's game

let joining = null;

// Resume for a game this device joined: joins it again with its code.
export function rejoinGame(code) {
  showJoin();
  $("mp-code").value = code;
  join(code);
}

// Resume for a game hosted on this device: hosts it again under its old code, so the others
// rejoin with Resume (or Join a game) and get their seats back.
export async function resumeHosted(saved) {
  $("mp-lobby").hidden = false;
  $("mp-lobby-code").textContent = saved.code;
  $("mp-lobby-players").innerHTML = "";
  $("mp-lobby-start").disabled = true;
  $("mp-lobby-status").textContent = "Opening the game again…";
  try {
    host = await hostGame({ remoteSeats: saved.remoteSeats, code: saved.code,
      owners: saved.owners });
  } catch (error) {
    $("mp-lobby-status").textContent = error.message;
    return;
  }
  $("mp-lobby").hidden = true;
  hooks.leaveTo(false);
  const linkTo = host;
  host = null;
  openGame({ resume: true, linkTo, onLeave: () => hooks.leaveTo(true) });
}

function showJoin() {
  $("mp-join").hidden = false;
  $("mp-join-status").textContent = "Enter the code shown on the host's device.";
  $("mp-code").value = "";
  $("mp-code").focus();
}

async function join(code) {
  if (!code.trim()) return;
  $("mp-join-status").textContent = "Joining…";
  try {
    joining = await joinRemote(code);
  } catch (error) {
    $("mp-join-status").textContent = error.message;
    return;
  }
  const { link, seat } = joining;
  $("mp-join-status").textContent = `You are ${PLAYER_COLOURS[seat].name}. Waiting for the ` +
    "host to start…";
  link.onMessage((message) => {
    if (message.type === "start") {
      $("mp-join").hidden = true;
      joining = null;
      hooks.leaveTo(false);
      openJoinedGame({ linkTo: link, start: message, onLeave: () => hooks.leaveTo(true) });
    } else if (message.type === "closed") {
      $("mp-join-status").textContent = "The host closed the game.";
    }
  });
}

function cancelJoin() {
  if (joining) joining.link.close();
  joining = null;
  $("mp-join").hidden = true;
}
