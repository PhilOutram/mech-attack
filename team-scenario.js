// Building blocks for the team campaigns (team-campaign-2.js, -3.js and -4.js): the AI
// factions and their leaders, reshaping a mission's map, what a mission checks, and what its
// script can change. Pure functions of the map or the game state, no DOM, so the game screen,
// the tests and tools/team-trials.mjs all run missions the same way.
import { RULES } from "./rules-config.js?v=0.86";
import {
  changeTeam, giveCrystals, addUnits, handOver, changeTerrain, unitsOf, factoriesOf, unitStats,
} from "./engine.js?v=0.86";
import { distance, parseKey, toPixel, key } from "./hex.js?v=0.86";

export const HUMAN_TEAM = 0;
export const ENEMY_TEAM = 1;
// A third party, at war with everyone.
export const THIRD_TEAM = 2;

// The AI factions (Phil, 1 November 2026: up to four, each with its own character). word is
// how their units are named in messages ("Syndicate Turret").
export const FACTIONS = {
  consortium: {
    name: "The Consortium", word: "Consortium", leader: "General Kaldra",
    about: "The corporate army that lost the Crystal War. Kaldra fights by the book, keeps " +
      "her word and never forgives a broken one.",
  },
  syndicate: {
    name: "The Varr Syndicate", word: "Syndicate", leader: "Director Ilse Varr",
    about: "Crystal brokers. Varr is generous, charming and always paid in the end.",
  },
  ashborn: {
    name: "The Ashborn", word: "Ashborn", leader: "Mother Sable",
    about: "Descendants of the lost first colony, living in its ruins. Sable trusts nobody " +
      "who digs up her land.",
  },
  splinter: {
    name: "Corran's Ashborn", word: "Corran's", leader: "Corran",
    about: "Sable's son and the young Ashborn who follow him. He wants the first colony back, " +
      "whatever it costs.",
  },
  lattice: {
    name: "The Lattice", word: "Lattice", leader: "Echo",
    about: "The first colony's mining machines, buried for a century and now awake. It " +
      "speaks through a voice that calls itself Echo.",
  },
};

// How a faction's AI plays, by what it builds most (aiMix shares, see ai.js).
export const MIXES = {
  consortium: { tank: 0.35, artillery: 0.2, infantry: 0.25, heavyCannon: 0.1, lightMedic: 0.1 },
  syndicate: { infantry: 0.35, transporter: 0.15, turret: 0.15, scoutBike: 0.2,
    heavyTank: 0.15 },
  ashborn: { scoutBike: 0.35, infantry: 0.3, blastCannon: 0.15, sonicTank: 0.2 },
  splinter: { scoutBike: 0.3, infantry: 0.35, sonicTank: 0.2, antiAircraftJeep: 0.15 },
  lattice: { spotterDrone: 0.15, attackHelicopter: 0.3, fighter: 0.1, heavyCannon: 0.2,
    twinTurret: 0.1, infantry: 0.15 },
};

// ---------------------------------------------------------------------------------------
// Maps

const HEX_SIZE = 1;
const TURN = 2 * Math.PI;

function angleOf(k) {
  const [x, y] = toPixel(...parseKey(k), HEX_SIZE);
  return (Math.atan2(y, x) + TURN) % TURN;
}

// The map's home sites in order round the map, so neighbouring slots are neighbouring homes.
// Side p gets the home in slot slots[p]; its starting hexes go with it.
export function arrangeHomes(map, slots) {
  const order = map.factories.map((at, i) => i).sort((a, b) =>
    angleOf(map.factories[a]) - angleOf(map.factories[b]));
  const factories = slots.map((slot) => map.factories[order[slot]]);
  const starts = slots.map((slot) => map.starts[order[slot]]);
  map.factories = factories;
  map.starts = starts;
}

const open = (map, rules, k) =>
  Boolean(map.hexes[k]) && rules.terrain[map.hexes[k].terrain].moveCost !== null;

function taken(map) {
  return new Set([...map.factories, ...(map.neutralFactories || []).map((f) => f.at),
    ...map.deposits.map((d) => d.at), ...map.starts.flat()]);
}

// An open, empty hex d steps from a hex, the nearest to toward (another hex), or null.
export function siteNear(map, rules, from, d, toward = "0,0") {
  const used = taken(map);
  const sites = Object.keys(map.hexes).filter((k) => distance(from, k) === d &&
    open(map, rules, k) && !used.has(k));
  sites.sort((a, b) => distance(a, toward) - distance(b, toward) || a.localeCompare(b));
  return sites[0] || null;
}

// The open hex nearest the middle of the map, or of the given hex, that has nothing on it.
export function freeHexNear(map, rules, at = "0,0") {
  const used = taken(map);
  return Object.keys(map.hexes).filter((k) => open(map, rules, k) && !used.has(k))
    .sort((a, b) => distance(a, at) - distance(b, at) || a.localeCompare(b))[0];
}

// An unused factory on a hex (any pile there goes).
export function addFactory(map, at) {
  map.deposits = map.deposits.filter((d) => d.at !== at);
  map.neutralFactories = [...(map.neutralFactories || []), { at, pair: null }];
  map.hexes[at] = { ...map.hexes[at], terrain: "plain" };
  return at;
}

export function addRuin(map, at) {
  map.ruins = [...(map.ruins || []), { at, pair: null }];
  map.hexes[at] = { ...map.hexes[at], terrain: "plain" };
  return at;
}

// Ruins on open, empty hexes, each as far as it can be from the homes and the other ruins,
// none within clearance of a home.
export function spreadRuins(map, rules, count, clearance) {
  const used = taken(map);
  const candidates = Object.keys(map.hexes).filter((k) => open(map, rules, k) &&
    !used.has(k) && map.factories.every((f) => distance(f, k) > clearance));
  while ((map.ruins || []).length < count && candidates.length) {
    const marks = [...map.factories, ...(map.ruins || []).map((r) => r.at)];
    const room = (k) => Math.min(...marks.map((m) => distance(m, k)));
    candidates.sort((a, b) => room(b) - room(a) || a.localeCompare(b));
    addRuin(map, candidates.shift());
  }
}

// The hex opposite through the middle of the map.
export function mirror(k) {
  const [q, r] = parseKey(k);
  return key(-q, -r);
}

export function addPile(map, at) {
  if (!map.deposits.some((d) => d.at === at)) map.deposits.push({ at, pair: null });
  map.hexes[at] = { ...map.hexes[at], terrain: "plain" };
  return at;
}

export function setTerrain(map, hexes, terrain) {
  for (const k of hexes) if (map.hexes[k]) map.hexes[k] = { ...map.hexes[k], terrain };
}

// Every hex within a distance of a hex (on the map).
export function hexesWithin(map, at, from, to = from) {
  return Object.keys(map.hexes).filter((k) => distance(at, k) >= from && distance(at, k) <= to);
}

// Flattens the ground round a home, so it can be reached from every side.
export function exposeHome(map, p, radius) {
  setTerrain(map, hexesWithin(map, map.factories[p], 1, radius), "plain");
}

// Mountains in a ring round a hex, leaving gaps on the hexes nearest the given ones, and
// nothing else on the ring: piles, factories and starting hexes there move inside it.
export function ringOfMountains(map, at, radius, gapsToward = []) {
  const ring = hexesWithin(map, at, radius);
  const gaps = new Set(gapsToward.map((toward) =>
    [...ring].sort((a, b) => distance(a, toward) - distance(b, toward) ||
      a.localeCompare(b))[0]));
  const raised = ring.filter((k) => !gaps.has(k) && !map.factories.includes(k));
  map.deposits = map.deposits.filter((d) => !raised.includes(d.at));
  map.neutralFactories = (map.neutralFactories || []).filter((f) => !raised.includes(f.at));
  map.starts = map.starts.map((hexes) => hexes.filter((k) => !raised.includes(k)));
  setTerrain(map, raised, "mountain");
}

// A wall of mountains across the map, on the hexes about as far from one hex as from
// another, with a pass of open ground (radius passRadius) at its middle; null for no pass.
export function wallBetween(map, a, b, passRadius = null) {
  const gap = (k) => Math.abs(distance(k, a) - distance(k, b));
  const wall = Object.keys(map.hexes).filter((k) => gap(k) <= 1);
  const middle = [...wall].sort((x, y) => (distance(x, a) + distance(x, b)) -
    (distance(y, a) + distance(y, b)) || x.localeCompare(y))[0];
  const pass = passRadius === null ? [] : hexesWithin(map, middle, 0, passRadius);
  const raised = wall.filter((k) => !pass.includes(k) && !map.factories.includes(k));
  map.deposits = map.deposits.filter((d) => !raised.includes(d.at));
  map.neutralFactories = (map.neutralFactories || []).filter((f) => !raised.includes(f.at));
  map.starts = map.starts.map((hexes) => hexes.filter((k) => !raised.includes(k)));
  setTerrain(map, raised, "mountain");
  setTerrain(map, pass, "plain");
  return middle;
}

// ---------------------------------------------------------------------------------------
// What a mission checks. ctx (see contextOf in team-campaigns.js): humans (player numbers),
// side(faction) (the player playing it), sites (named hexes), fired(id) (the round a script
// step happened, or undefined).

export function factoryAt(state, at) {
  return Object.values(state.units).find((u) => u.at === at && unitStats(state, u).isFactory);
}

// Who owns the factory on a site (null if unused or gone).
export function ownerAt(state, at) {
  const factory = factoryAt(state, at);
  return factory ? factory.owner : null;
}

export function humansHold(state, ctx, at) {
  return ctx.humans.includes(ownerAt(state, at));
}

// Whether the factory on a site belongs to the humans or one of their AI allies.
export function teamHolds(state, at) {
  const owner = ownerAt(state, at);
  return owner !== null && state.players[owner].team === HUMAN_TEAM;
}

export function homeHeld(state, p) {
  return state.units[state.players[p].factoryId]?.owner === p;
}

export function homesHeld(state, ctx) {
  return ctx.humans.every((p) => state.players[p].out || homeHeld(state, p));
}

export function isOut(state, p) {
  return p === undefined || state.players[p].out;
}

export function lostCount(state, p, types = null) {
  const lost = state.players[p].lost;
  return Object.keys(lost).filter((t) => !types || types.includes(t))
    .reduce((n, t) => n + lost[t], 0);
}

export function lostByTeam(state, players, types = null) {
  return players.reduce((n, p) => n + lostCount(state, p, types), 0);
}

// A player's units (not factories) within a distance of a hex.
export function unitsNear(state, p, at, radius) {
  return unitsOf(state, p).filter((u) => !unitStats(state, u).isFactory &&
    distance(u.at, at) <= radius);
}

export function armyOf(state, p) {
  return unitsOf(state, p).filter((u) => !unitStats(state, u).isFactory);
}

export function hasUnit(state, p, type) {
  return unitsOf(state, p).some((u) => u.type === type);
}

// Ruins searched by any of the players.
export function ruinsSearchedBy(state, players) {
  return Object.values(state.searched || {}).filter((s) => players.includes(s.by)).length;
}

// Whether a unit type is on the board or riding in a transporter.
export function unitAlive(state, type) {
  return Object.values(state.units).some((u) => u.type === type ||
    (u.cargo || []).some((c) => c.type === type));
}

// Whether the action just taken started a new round (the humans' turn is about to begin).
export function roundStarted(state) {
  return state.events.some((e) => e.type === "newRound");
}

// Whether the humans took the factory on a site this round.
export function takenThisRound(state, ctx, at) {
  const factory = factoryAt(state, at);
  return Boolean(factory) && ctx.humans.includes(factory.owner) &&
    factory.capturedRound === state.round;
}

export function teamCrystals(state, ctx) {
  return ctx.humans.reduce((n, p) => n + state.players[p].crystals, 0);
}

export function factoryCount(state, p) {
  return factoriesOf(state, p).length;
}

// Whether a player still has any factory or unit.
export function standing(state, p) {
  return p !== undefined && !state.players[p].out && unitsOf(state, p).length > 0;
}

// ---------------------------------------------------------------------------------------
// What a mission's script can change (see the Scenario changes in engine.js)

// A side never changes team without warning (Phil, 1 November 2026: betrayals are unsettling
// if they come out of nowhere): a note this many rounds before, at the start of the humans'
// turn.
export const TURN_WARNING_ROUNDS = 2;

export function warning(id, round, note) {
  return { id, note,
    when: (state) => state.phaseIndex === 0 && state.round >= round - TURN_WARNING_ROUNDS };
}

export const betray = (state, p, team) => changeTeam(state, p, team);
export const reinforce = (state, p, types, near) =>
  (state.players[p].out ? state : addUnits(state, p, types, near));

// How far from their target airdropping Chinooks arrive: more than a Chinook's move, so they
// need a turn in the air before they can drop, and the defenders get two turns to shoot them
// down.
export const AIRDROP_DISTANCE = 7;

// Chinooks arrive loaded with Infantry, on the far side of a target hex from the middle of the
// map. The AI flies loaded Chinooks to the nearest factory it can take and drops the Infantry
// straight in (Phil, 1 November 2026: arrivals use the game's own units and rules).
export function airdrop(state, p, chinooks, passengers, target) {
  if (state.players[p].out) return state;
  const sites = Object.keys(state.map.hexes).filter((k) =>
    distance(k, target) === AIRDROP_DISTANCE &&
    state.rules.terrain[state.map.hexes[k].terrain].moveCost !== null);
  sites.sort((a, b) => distance(b, "0,0") - distance(a, "0,0") || a.localeCompare(b));
  return addUnits(state, p, Array(chinooks).fill("chinook"), sites[0] || target, passengers);
}
export const gift = (state, p, amount) => giveCrystals(state, p, amount);
export const openGround = (state, hexes) => changeTerrain(state, hexes, "plain");

// Each human gets amount crystals.
export function giftEach(state, ctx, amount) {
  return ctx.humans.filter((p) => !state.players[p].out)
    .reduce((s, p) => giveCrystals(s, p, amount), state);
}

// The factory on a site goes to a player (if it is still there and unused, or always when
// taken is set), with units arriving round it.
export function takeFactory(state, at, p, units = [], { evenIfOwned = false } = {}) {
  const factory = factoryAt(state, at);
  if (!factory || state.players[p].out || (factory.owner !== null && !evenIfOwned)) {
    return state;
  }
  const handed = handOver(state, [factory.id], p);
  return units.length ? addUnits(handed, p, units, at) : handed;
}

// Every unit (not factory) of one player near a hex goes over to another (a garrison
// changing sides).
export function defect(state, from, to, at, radius) {
  const ids = unitsOf(state, from).filter((u) => !unitStats(state, u).isFactory &&
    distance(u.at, at) <= radius).map((u) => u.id);
  return ids.length ? handOver(state, ids, to) : state;
}

// ---------------------------------------------------------------------------------------
// Sides

// A human side: the usual start unless the mission changes it.
export function human({ units = RULES.start.units, crystals = RULES.start.crystals,
  upgrades = [], kit = null, noHome = false } = {}) {
  return { units: [...units], crystals, upgrades: [...upgrades], kit, noHome };
}

// An AI faction's side. team: HUMAN_TEAM for an ally. level: its rank (difficulty.js).
export function faction(id, { team = ENEMY_TEAM, level = "major", units = RULES.start.units,
  crystals = RULES.start.crystals + RULES.start.secondPlayerCrystals, upgrades = [],
  aiMix = MIXES[id], noHome = false } = {}) {
  return { faction: id, team, level, units: [...units], crystals, upgrades: [...upgrades],
    aiMix, noHome };
}
