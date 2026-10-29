// Mech Attack rules engine.
// Pure rules shared by the game screen, the AI and the simulator: no DOM, no window, no
// timers. applyAction takes a state and an action and returns a new state; the input state
// is never changed. The state is plain JSON (save it, replay it, log it). Randomness comes
// from a seeded generator held in the state, so a seed plus the action list replays a game.
//
// Fog of war: viewFor(state, player) is everything that player knows. Every option offered
// to a player (moves, targets, crystals) is worked out from their view, so neither the AI
// nor the UI can learn hidden information from the engine. Two fog modes (rules.fog.mode):
// - "tiles": map blocks (seven-hex clusters) start face down. When one of a player's units
//   comes close enough to a block, the whole block is turned over for that player only, and
//   everything on it stays visible to them from then on. The opponent's turned-over blocks
//   stay hidden.
// - "sight": each player sees only what their units can see now, and remembers terrain and
//   crystals they have seen before.
import {
  neighbourKeys, distance, lineOfSight, cheapestPaths, pathTo, parseKey, key, DIRECTIONS,
} from "./hex.js?v=0.18";

// Factories, infantry and transporters (format 6):
// - Every factory is a unit. Each player owns a home factory (players[p].factoryId); bigger
//   maps also have unused factories (owner null), which nobody can attack.
// - Infantry capture a factory that is not their owner's by moving into it; the troops are
//   used up. Home factories can be captured only if rules.capture.homeFactories is set.
// - A transporter carries infantry in unit.cargo; they board by moving onto it and are dropped
//   off on a free hex next to it, or straight into a factory to capture it.
// - Factory upgrades (unit.upgrades) unlock the unit types that need them (stat "needs").

// Saved games in any other format are not loaded.
export const STATE_FORMAT = 6;
export const PLAYER_COLOURS = ["blue", "green"];

// ---------------------------------------------------------------------------------------
// Setting up

export function newGame({ rules, map, seed = 1, firstPlayer = 0, recordActions = true }) {
  const otherPlayer = 1 - firstPlayer;
  const state = {
    format: STATE_FORMAT,
    rules,
    map,
    seed,
    rng: seed >>> 0,
    round: 1,
    order: [firstPlayer, otherPlayer],
    turnIndex: 0,
    current: firstPlayer,
    players: PLAYER_COLOURS.map((colour) => ({
      colour,
      crystals: rules.start.crystals,
      factoryId: null,
      explored: {},
      seenCrystals: {},
      // Other players' and unused factories as last seen, by id.
      seenFactories: {},
      // Map blocks this player has turned over (fog mode "tiles").
      revealed: {},
    })),
    units: {},
    nextUnitId: 1,
    crystals: {},
    hits: {},
    // New piles that spawn after each turn this round (drawn at the start of the round).
    spawnsPerTurn: 0,
    result: null,
    events: [],
    actions: recordActions ? [] : null,
  };

  state.players.forEach((player, p) => {
    const factory = addUnit(state, "factory", p, map.factories[p]);
    player.factoryId = factory.id;
    rules.start.units.forEach((type, i) => addUnit(state, type, p, map.starts[p][i]));
  });
  for (const site of map.neutralFactories || []) addUnit(state, "factory", null, site.at);
  state.players[otherPlayer].crystals += rules.start.secondPlayerCrystals || 0;
  for (const deposit of map.deposits) {
    const amount = rules.crystals.startAmount;
    state.crystals[deposit.at] = { amount, harvestedThisTurn: false };
  }
  state.spawnsPerTurn = drawSpawnsPerTurn(state);
  refreshKnowledge(state);
  return state;
}

function addUnit(state, type, owner, at) {
  const id = `u${state.nextUnitId++}`;
  const unit = {
    id, type, owner, at,
    lives: state.rules.lives,
    moved: false,
    moveUsed: 0,
    acted: false,
    // Turns before the unit can fire again (units with a reload, such as the Blast Cannon).
    cooldown: 0,
    setUp: false,
    carrying: 0,
  };
  const stats = state.rules.units[type];
  // Arrays are replaced, never changed in place, so cloneState can share them.
  if (stats.isFactory) unit.upgrades = [];
  if (stats.carries) unit.cargo = [];
  state.units[id] = unit;
  return unit;
}

// ---------------------------------------------------------------------------------------
// Lookups (work on a full state or on a view)

export function unitStats(state, unit) {
  return state.rules.units[unit.type];
}

export function unitAt(state, k) {
  for (const id in state.units) if (state.units[id].at === k) return state.units[id];
  return null;
}

export function unitsOf(state, player) {
  return Object.values(state.units).filter((u) => u.owner === player);
}

export function factoriesOf(state, player) {
  return unitsOf(state, player).filter((u) => unitStats(state, u).isFactory);
}

// Units that can be attacked: the other player's. Unused factories belong to nobody.
function isEnemy(unit, other) {
  return other.owner !== null && other.owner !== unit.owner;
}

function isHomeFactory(state, unit) {
  return state.players.some((player) => player.factoryId === unit.id);
}

function terrainOf(state, k) {
  const hex = state.map.hexes[k];
  return hex ? hex.terrain : undefined;
}

// Terrain rules for a hex. Unexplored hexes in a view (terrain null) are treated as plain.
function terrainRules(state, k) {
  const terrain = terrainOf(state, k);
  return state.rules.terrain[terrain || "plain"];
}

// Air units get no cover from the ground below them.
export function defenceOf(state, unit) {
  const stats = unitStats(state, unit);
  return stats.defence + (stats.air ? 0 : terrainRules(state, unit.at).defenceBonus);
}

function blocksSight(state) {
  return (k) => {
    const terrain = terrainOf(state, k);
    return Boolean(terrain && state.rules.terrain[terrain].blocksSight);
  };
}

// Terrain never changes during a game, so the hexes visible from a hex at a given sight range
// are worked out once per map and remembered. Keyed by the map's hexes object, so a map loaded
// from a save gets its own entry and old maps are released.
const sightCache = new WeakMap();

function hexesInSight(state, at, sight) {
  let cache = sightCache.get(state.map.hexes);
  if (!cache) {
    cache = {};
    sightCache.set(state.map.hexes, cache);
  }
  const id = `${at}|${sight}`;
  if (!cache[id]) {
    const blocks = blocksSight(state);
    cache[id] = Object.keys(state.map.hexes).filter((k) =>
      distance(at, k) <= sight && lineOfSight(at, k, blocks));
  }
  return cache[id];
}

// Hexes within sight range of one of the player's units, with a clear line of sight.
function hexesSeenBy(state, player) {
  const seen = {};
  for (const unit of unitsOf(state, player)) {
    for (const k of hexesInSight(state, unit.at, unitStats(state, unit).sight)) seen[k] = true;
  }
  return seen;
}

function tilesFog(state) {
  return state.rules.fog.mode === "tiles";
}

// The block a hex belongs to: its seven-hex cluster, or the hex itself on a map without
// clusters.
function blockOf(state, k) {
  return state.map.hexes[k].cluster || k;
}

// A unit turns over every block with a hex within this range: its sight, or the fixed
// rules.fog.revealRange when one is set (1 = only blocks it is on or next to).
function revealRangeOf(state, unit) {
  const fixed = state.rules.fog.revealRange;
  return fixed === null || fixed === undefined ? unitStats(state, unit).sight : fixed;
}

function revealFrom(state, player, at, range) {
  const revealed = state.players[player].revealed;
  for (const k of hexesInSight(state, at, range)) revealed[blockOf(state, k)] = true;
}

// Hexes the player can see now: every hex of a turned-over block in fog mode "tiles", or the
// hexes in sight of their units in fog mode "sight".
export function visibleHexes(state, player) {
  if (!tilesFog(state)) return hexesSeenBy(state, player);
  const visible = {};
  const revealed = state.players[player].revealed;
  for (const k in state.map.hexes) if (revealed[blockOf(state, k)]) visible[k] = true;
  return visible;
}

// Updates what each player has explored and seen. applyAction calls it after every action;
// call it directly after building a custom position (tests, puzzles).
export function refreshKnowledge(state) {
  if (tilesFog(state)) {
    for (const unit of Object.values(state.units)) {
      if (unit.owner === null) continue;
      revealFrom(state, unit.owner, unit.at, revealRangeOf(state, unit));
    }
  }
  state.players.forEach((player, p) => {
    const seen = visibleHexes(state, p);
    for (const k in seen) {
      player.explored[k] = true;
      const pile = state.crystals[k];
      if (pile) player.seenCrystals[k] = { amount: pile.amount };
      else delete player.seenCrystals[k];
    }
    // Factories cannot move, so one seen is remembered as it was (undamaged as far as the
    // player knows) until it is seen again. One seen to be gone or now theirs is forgotten.
    for (const id in player.seenFactories) {
      const remembered = player.seenFactories[id];
      const factory = state.units[id];
      if (seen[remembered.at] && (!factory || factory.owner === p)) {
        delete player.seenFactories[id];
      }
    }
    for (const unit of Object.values(state.units)) {
      if (unit.owner === p || !seen[unit.at] || !unitStats(state, unit).isFactory) continue;
      player.seenFactories[unit.id] = { ...unit, lives: state.rules.lives };
    }
  });
}

// ---------------------------------------------------------------------------------------
// Fog of war

// Everything the player knows: own units, other units in sight, other factories as last seen,
// terrain of explored hexes (null elsewhere) and crystals as last seen.
export function viewFor(state, player) {
  const visible = visibleHexes(state, player);
  const me = state.players[player];

  const hexes = {};
  for (const k in state.map.hexes) {
    hexes[k] = me.explored[k] ? state.map.hexes[k] : { terrain: null, cluster: null, slot: null };
  }

  const units = {};
  for (const id in state.units) {
    const unit = state.units[id];
    if (unit.owner === player || visible[unit.at]) units[id] = unit;
  }
  for (const id in me.seenFactories) units[id] ||= me.seenFactories[id];

  const crystals = {};
  for (const k in me.seenCrystals) {
    crystals[k] = visible[k] ? state.crystals[k] : me.seenCrystals[k];
  }

  const hits = {};
  for (const id in state.hits) if (units[id]) hits[id] = state.hits[id];

  return {
    isView: true,
    viewer: player,
    format: state.format,
    rules: state.rules,
    // Factory sites are public, like setting up across the table. Deposit sites are not.
    map: { id: state.map.id, name: state.map.name, hexes, factories: state.map.factories,
      neutralFactories: state.map.neutralFactories || [] },
    round: state.round,
    order: state.order,
    turnIndex: state.turnIndex,
    current: state.current,
    players: state.players.map((pl, p) =>
      p === player ? pl : { colour: pl.colour, factoryId: pl.factoryId }),
    units,
    crystals,
    hits,
    visible,
    result: state.result,
  };
}

// ---------------------------------------------------------------------------------------
// Options for a unit, worked out from what its owner knows

// Units by the hex they stand on.
function occupancy(state) {
  const byHex = {};
  for (const id in state.units) byHex[state.units[id].at] = state.units[id];
  return byHex;
}

// Path costs are movement points times PATH_SCALE plus one for each crystal pile driven over,
// so of two equally short routes the one that crushes fewer crystals wins.
const PATH_SCALE = 1000;

// With avoidCrystals, a ground unit treats crystal piles as impassable.
function moveCostFor(state, unit, byHex = occupancy(state), avoidCrystals = false) {
  // Flying units cross any hex for 1, over terrain, units and crystals.
  if (unitStats(state, unit).air) return (k) => (state.map.hexes[k] ? PATH_SCALE : null);
  return (k) => {
    if (!state.map.hexes[k] || (avoidCrystals && state.crystals[k])) return null;
    const cost = terrainRules(state, k).moveCost;
    if (cost === null) return null;
    const other = byHex[k];
    if (other && other.owner !== unit.owner) return null;
    return cost * PATH_SCALE + (state.crystals[k] ? 1 : 0);
  };
}

function plannedPaths(state, unit, byHex, move = Infinity, avoidCrystals = false) {
  const maxCost = move === Infinity ? Infinity : move * PATH_SCALE + PATH_SCALE - 1;
  return cheapestPaths(unit.at, moveCostFor(state, unit, byHex, avoidCrystals), maxCost);
}

// Movement points the unit has left this turn. Most units move once; a unit that splits its
// move (splitMove) can keep moving, looking around between moves, until it has used them all.
function moveLeft(state, unit) {
  const stats = unitStats(state, unit);
  if (unit.acted || unit.setUp || stats.move <= 0) return 0;
  if (stats.splitMove) return stats.move - (unit.moveUsed || 0);
  return unit.moved ? 0 : stats.move;
}

// Infantry can capture a factory that is not their owner's by moving into it. With
// rules.capture.guarded, not while one of the factory owner's units is next to it. Works on a
// view too.
export function canCapture(state, unit, factory) {
  if (!factory || !unitStats(state, unit).captures || factory.owner === unit.owner) return false;
  if (!unitStats(state, factory).isFactory) return false;
  if (isHomeFactory(state, factory) && !state.rules.capture.homeFactories) return false;
  return !state.rules.capture.guarded || factory.owner === null ||
    !unitsOf(state, factory.owner).some((u) => distance(u.at, factory.at) === 1);
}

// A unit that rides can board its owner's transporter, if there is room, by moving onto it.
export function canBoard(state, unit, transporter) {
  if (!transporter || !unitStats(state, unit).rides || transporter.owner !== unit.owner) {
    return false;
  }
  return (transporter.cargo || []).length < (unitStats(state, transporter).carries || 0);
}

// Where a unit can move this turn: { hex: { cost, path, crushes } }. A ground unit takes a
// route that keeps off crystals wherever it can, even a longer one within its move; crushes
// marks hexes it can only reach by driving over crystals. Friendly units can be passed
// through but not stopped on, except to board a transporter. Infantry can also end a move by
// entering a factory to capture it.
function routes(state, unit, byHex = occupancy(state)) {
  const left = moveLeft(state, unit);
  if (left <= 0) return {};
  const flies = Boolean(unitStats(state, unit).air);
  const crushing = plannedPaths(state, unit, byHex, left);
  const clear = plannedPaths(state, unit, byHex, left, true);
  const route = (k, extra = null) => {
    const paths = clear[k] ? clear : crushing;
    const path = pathTo(paths, k);
    if (extra) path.push(extra.at);
    const cost = Math.floor(paths[k].cost / PATH_SCALE) + (extra ? extra.step : 0);
    return { cost, path, crushes: !flies && path.some((h) => Boolean(state.crystals[h])) };
  };
  const out = {};
  for (const k in crushing) {
    if (k === unit.at || (byHex[k] && !canBoard(state, unit, byHex[k]))) continue;
    out[k] = route(k);
  }
  // A factory hex is entered from a neighbouring hex the unit can get to (with
  // capture.mustStartNextTo, only from where it started its turn).
  const fromStart = state.rules.capture.mustStartNextTo;
  for (const factory of Object.values(byHex)) {
    if (!canCapture(state, unit, factory) || (fromStart && unit.moved)) continue;
    const step = terrainRules(state, factory.at).moveCost;
    for (const k of neighbourKeys(factory.at)) {
      if (!crushing[k] || step === null || (fromStart && k !== unit.at)) continue;
      const option = route(k, { at: factory.at, step });
      const current = out[factory.at];
      const better = !current || current.crushes > option.crushes ||
        (current.crushes === option.crushes && option.cost < current.cost);
      if (option.cost <= left && better) out[factory.at] = option;
    }
  }
  return out;
}

// Destination hexes the unit can only reach by driving over crystals (and destroying them).
export function crushingMoves(view, unitId) {
  const unit = view.units[unitId];
  if (!unit) return [];
  const options = routes(view, unit);
  return Object.keys(options).filter((k) => options[k].crushes);
}

// Destination hexes and their movement cost.
export function reachableHexes(view, unitId) {
  const unit = view.units[unitId];
  if (!unit) return {};
  const out = {};
  const options = routes(view, unit);
  for (const k in options) out[k] = options[k].cost;
  return out;
}

// Ground or air: an attack hits ground units, air units or both (unit stat "hits"; ground if
// not given). Air units can only be hit by attacks that hit air. Works on a view too.
export function canHit(state, attacker, target) {
  const hits = unitStats(state, attacker).hits || "ground";
  const layer = unitStats(state, target).air ? "air" : "ground";
  return hits === "both" || hits === layer;
}

// The hexes along one of the six straight lines from a hex, up to range, stopping before
// terrain that blocks sight (a mountain stops a sonic boom).
function lineHexes(state, from, direction, range) {
  const [q, r] = parseKey(from);
  const [dq, dr] = direction;
  const blocks = blocksSight(state);
  const out = [];
  for (let step = 1; step <= range; step++) {
    const k = key(q + dq * step, r + dr * step);
    if (!state.map.hexes[k] || blocks(k)) break;
    out.push(k);
  }
  return out;
}

// The straight-line direction from one hex to another, or null if they are not in line.
function lineDirection(from, to) {
  const [fq, fr] = parseKey(from);
  const [tq, tr] = parseKey(to);
  const n = distance(from, to);
  if (!n) return null;
  return DIRECTIONS.find(([dq, dr]) => fq + dq * n === tq && fr + dr * n === tr) || null;
}

export function attackTargets(view, unitId) {
  const unit = view.units[unitId];
  if (!unit || unit.acted || unit.cooldown > 0) return [];
  const stats = unitStats(view, unit);
  if (!stats.attack || !stats.range) return [];
  if (stats.needsSetup && !unit.setUp) return [];
  const [minRange, maxRange] = stats.range;
  const enemies = Object.values(view.units).filter((t) =>
    isEnemy(unit, t) && view.visible[t.at] && canHit(view, unit, t));
  if (stats.line) {
    // A line attack can be aimed at any enemy on one of the six straight lines within range.
    const reach = new Set(DIRECTIONS.flatMap((d) => lineHexes(view, unit.at, d, maxRange)));
    return enemies
      .filter((t) => reach.has(t.at) && distance(unit.at, t.at) >= minRange)
      .map((t) => t.id);
  }
  const blocks = blocksSight(view);
  return enemies
    .filter((t) => {
      const d = distance(unit.at, t.at);
      return d >= minRange && d <= maxRange && lineOfSight(unit.at, t.at, blocks);
    })
    .map((t) => t.id);
}

export function healTargets(view, unitId) {
  const unit = view.units[unitId];
  if (!unit || unit.acted) return [];
  const stats = unitStats(view, unit);
  if (!stats.healing) return [];
  return Object.values(view.units)
    .filter((t) => t.owner === unit.owner && t.id !== unit.id)
    .filter((t) => !unitStats(view, t).isFactory && t.lives < view.rules.lives)
    .filter((t) => unitStats(view, t).defence <= stats.healing)
    .filter((t) => distance(unit.at, t.at) <= stats.healRange)
    .map((t) => t.id);
}

export function harvestTargets(view, unitId) {
  const unit = view.units[unitId];
  if (!unit || unit.acted) return [];
  const stats = unitStats(view, unit);
  if (!stats.storage || unit.carrying >= stats.storage) return [];
  const onTop = view.rules.crystals.harvestFrom === "on";
  return Object.keys(view.crystals).filter((k) =>
    onTop ? k === unit.at : distance(unit.at, k) === 1);
}

// Crystals are unloaded at any of the owner's factories.
function nextToOwnFactory(state, unit) {
  return factoriesOf(state, unit.owner).some((f) => distance(unit.at, f.at) === 1);
}

export function canUnload(view, unitId) {
  const unit = view.units[unitId];
  if (!unit || unit.acted || unit.carrying <= 0) return false;
  return nextToOwnFactory(view, unit);
}

// Hexes a transporter can drop its next passenger on: a free hex next to it, or a factory
// next to it that the passenger can capture (unless capture.mustStartNextTo).
export function dropSites(view, unitId) {
  const unit = view.units[unitId];
  if (!unit || !unit.cargo || !unit.cargo.length) return [];
  const passenger = { ...unit.cargo[0], at: unit.at };
  return neighbourKeys(unit.at).filter((k) => {
    if (!view.map.hexes[k]) return false;
    const other = unitAt(view, k);
    if (other) return !view.rules.capture.mustStartNextTo && canCapture(view, passenger, other);
    return terrainRules(view, k).moveCost !== null && !view.crystals[k];
  });
}

export function canSetUp(view, unitId) {
  const unit = view.units[unitId];
  return Boolean(unit) && !unit.acted && !unit.setUp && Boolean(unitStats(view, unit).needsSetup);
}

export function canPackUp(view, unitId) {
  const unit = view.units[unitId];
  return Boolean(unit) && !unit.acted && unit.setUp;
}

// Whether a factory can build a unit type: a unit that needs an upgrade only from a factory
// that has it.
export function factoryBuilds(state, factory, type) {
  const stats = state.rules.units[type];
  return stats.cost !== null && (!stats.needs || factory.upgrades.includes(stats.needs));
}

// Free hexes next to the player's factories where a new unit can be placed. With unitType,
// only next to factories that can build it.
export function buildSites(view, player, unitType = null) {
  const sites = new Set();
  for (const factory of factoriesOf(view, player)) {
    if (unitType && !factoryBuilds(view, factory, unitType)) continue;
    for (const k of neighbourKeys(factory.at)) {
      if (view.map.hexes[k] && terrainRules(view, k).moveCost !== null && !unitAt(view, k) &&
        !view.crystals[k]) sites.add(k);
    }
  }
  return [...sites];
}

// Every unit type that can be built somewhere.
export function buildableTypes(state) {
  return Object.keys(state.rules.units).filter((type) => state.rules.units[type].cost !== null);
}

// The upgrades a factory has not bought yet.
export function upgradeOptions(state, factoryId) {
  const factory = state.units[factoryId];
  if (!factory || !factory.upgrades) return [];
  return Object.keys(state.rules.factoryUpgrades).filter((u) => !factory.upgrades.includes(u));
}

// ---------------------------------------------------------------------------------------
// Legal actions

export function legalActions(state) {
  if (state.result) return [];
  const player = state.current;
  const view = state.isView ? state : viewFor(state, player);
  const actions = [];
  for (const unit of unitsOf(view, player)) {
    const id = unit.id;
    for (const to in reachableHexes(view, id)) actions.push({ type: "move", unitId: id, to });
    for (const targetId of attackTargets(view, id)) {
      actions.push({ type: "attack", unitId: id, targetId });
    }
    for (const targetId of healTargets(view, id)) {
      actions.push({ type: "heal", unitId: id, targetId });
    }
    for (const at of harvestTargets(view, id)) actions.push({ type: "harvest", unitId: id, at });
    if (canUnload(view, id)) actions.push({ type: "unload", unitId: id });
    if (canSetUp(view, id)) actions.push({ type: "setUp", unitId: id });
    if (canPackUp(view, id)) actions.push({ type: "packUp", unitId: id });
    for (const at of dropSites(view, id)) actions.push({ type: "drop", unitId: id, at });
  }
  const crystals = view.players[player].crystals;
  for (const unitType of buildableTypes(view)) {
    if (view.rules.units[unitType].cost > crystals) continue;
    for (const at of buildSites(view, player, unitType)) {
      actions.push({ type: "build", unitType, at });
    }
  }
  for (const factory of factoriesOf(view, player)) {
    for (const upgrade of upgradeOptions(view, factory.id)) {
      if (view.rules.factoryUpgrades[upgrade].cost > crystals) continue;
      actions.push({ type: "upgrade", factoryId: factory.id, upgrade });
    }
  }
  actions.push({ type: "endTurn" });
  return actions;
}

// ---------------------------------------------------------------------------------------
// Applying actions

const HANDLERS = {
  move: applyMove,
  attack: applyAttack,
  heal: applyHeal,
  harvest: applyHarvest,
  unload: applyUnload,
  setUp: applySetUp,
  packUp: applyPackUp,
  drop: applyDrop,
  build: applyBuild,
  upgrade: applyUpgrade,
  endTurn: applyEndTurn,
  resign: applyResign,
};

export function applyAction(state, action) {
  if (state.isView) throw new Error("Actions apply to the full game state, not a view");
  if (state.result) throw new Error("The game is over");
  const handler = HANDLERS[action.type];
  if (!handler) throw new Error(`Unknown action: ${action.type}`);

  const next = cloneState(state);
  next.events = [];
  handler(next, action);
  refreshKnowledge(next);
  checkResult(next);
  if (next.actions) next.actions.push(action);
  return next;
}

// Copies everything an action can change. The map and rules never change during a game,
// and logged actions, remembered crystal and factory records, events and the arrays inside
// units (upgrades, cargo) are replaced rather than edited, so those are shared. A new state
// field that actions change must be copied here too; the tests check that applying actions
// never changes the input state.
function cloneState(state) {
  const units = {};
  for (const id in state.units) units[id] = { ...state.units[id] };
  const crystals = {};
  for (const k in state.crystals) crystals[k] = { ...state.crystals[k] };
  const hits = {};
  for (const id in state.hits) hits[id] = { ...state.hits[id] };
  const players = state.players.map((player) => ({
    ...player,
    explored: { ...player.explored },
    revealed: { ...player.revealed },
    seenCrystals: { ...player.seenCrystals },
    seenFactories: { ...player.seenFactories },
  }));
  return {
    ...state,
    order: [...state.order],
    players,
    units,
    crystals,
    hits,
    result: state.result && { ...state.result },
    actions: state.actions ? [...state.actions] : null,
  };
}

function illegal(message) {
  throw new Error(`Illegal action: ${message}`);
}

// The acting player's own unit, from the full state.
function ownUnit(state, unitId) {
  const unit = state.units[unitId];
  if (!unit || unit.owner !== state.current) illegal(`no unit ${unitId} for this player`);
  return unit;
}

function finishAction(unit) {
  unit.acted = true;
  unit.moved = true;
}

// The path is planned on what the player knows. Walking it on the real board, a ground unit
// stops early at anything hidden in the way: an enemy unit or impassable ground. A flying unit
// passes over everything but cannot stop on a hex that turns out to be occupied. A move into
// a factory captures it; a move onto a transporter boards it.
function applyMove(state, { unitId, to }) {
  const unit = ownUnit(state, unitId);
  const view = viewFor(state, state.current);
  const route = routes(view, view.units[unitId])[to];
  if (!route) illegal(`${unitId} cannot reach ${to}`);

  const byHex = occupancy(state);
  const entering = (k) => k === to &&
    (canCapture(state, unit, byHex[k]) || canBoard(state, unit, byHex[k]));
  const allowance = moveLeft(state, unit);
  const flies = Boolean(unitStats(state, unit).air);
  const from = unit.at;
  const walked = [];
  let spent = 0;
  let stoppedBy = null;
  for (const k of route.path) {
    const cost = flies ? 1 : terrainRules(state, k).moveCost;
    const other = byHex[k];
    if (!flies && other && other.owner !== unit.owner && !entering(k)) {
      stoppedBy = "unit";
      break;
    }
    if (cost === null || spent + cost > allowance) {
      stoppedBy = "terrain";
      break;
    }
    spent += cost;
    walked.push(k);
  }
  // Never finish on a hex another unit is on, unless entering it.
  while (walked.length) {
    const last = walked[walked.length - 1];
    if (!byHex[last] || entering(last)) break;
    walked.pop();
  }

  unit.at = walked.length ? walked[walked.length - 1] : from;
  unit.moved = true;
  unit.moveUsed = (unit.moveUsed || 0) + spent;
  state.events.push({ type: "move", unitId, from, to: unit.at, path: walked, stoppedBy });

  // Blocks come into sight along the way, not just at the end of the move.
  if (tilesFog(state)) {
    for (const k of walked) revealFrom(state, unit.owner, k, revealRangeOf(state, unit));
  }

  // Driving onto or over crystals destroys them; flying over them does not.
  if (state.rules.crystals.crushedByMovement && !flies) {
    for (const k of walked) {
      const pile = state.crystals[k];
      if (!pile) continue;
      delete state.crystals[k];
      state.events.push({ type: "crushed", unitId, at: k, amount: pile.amount });
    }
  }

  const there = byHex[unit.at];
  if (there && there !== unit) {
    if (canCapture(state, unit, there)) capture(state, unit, there);
    else board(state, unit, there);
  } else if (unit.carrying > 0 && nextToOwnFactory(state, unit)) {
    // Arriving next to one of its factories, a unit unloads at once, without using its
    // action (Phil, 29 October 2026).
    unload(state, unit, true);
  }
}

// The troops go into the factory and are used up; the factory keeps its damage and upgrades.
function capture(state, unit, factory) {
  removeUnit(state, unit);
  state.events.push({ type: "capture", unitId: unit.id, factoryId: factory.id,
    from: factory.owner, owner: unit.owner, at: factory.at });
  factory.owner = unit.owner;
}

function board(state, unit, transporter) {
  removeUnit(state, unit);
  transporter.cargo = [...transporter.cargo, { ...unit, at: null }];
  state.events.push({ type: "board", unitId: unit.id, transporterId: transporter.id,
    at: transporter.at });
}

function removeUnit(state, unit) {
  delete state.units[unit.id];
  delete state.hits[unit.id];
}

// Drops the transporter's first passenger next to it, or into a factory to capture it. The
// passenger has finished for the turn; the transporter can still move if it has not.
function applyDrop(state, { unitId, at }) {
  const transporter = ownUnit(state, unitId);
  if (!dropSites(viewFor(state, state.current), unitId).includes(at)) {
    illegal(`${unitId} cannot drop off at ${at}`);
  }
  const [passenger, ...rest] = transporter.cargo;
  transporter.cargo = rest;
  const unit = { ...passenger, at };
  finishAction(unit);
  const there = unitAt(state, at);
  state.units[unit.id] = unit;
  state.events.push({ type: "drop", unitId: unit.id, transporterId: unitId, at });
  if (there) capture(state, unit, there);
}

function applyAttack(state, { unitId, targetId }) {
  const unit = ownUnit(state, unitId);
  const view = viewFor(state, state.current);
  if (!attackTargets(view, unitId).includes(targetId)) illegal(`${unitId} cannot attack`);
  const target = state.units[targetId];
  const stats = unitStats(state, unit);
  const attack = stats.attack;
  finishAction(unit);
  if (stats.reload) unit.cooldown = stats.reload + 1;
  state.events.push({ type: "fire", unitId, targetId, attack });
  hit(state, target, attack);

  // Sonic boom: every other enemy along the same line, up to range, is hit too.
  if (stats.line) {
    const direction = lineDirection(unit.at, target.at);
    for (const k of lineHexes(state, unit.at, direction, stats.range[1])) {
      const other = unitAt(state, k);
      if (!other || other === target || !isEnemy(unit, other)) continue;
      if (!canHit(state, unit, other)) continue;
      state.events.push({ type: "lineHit", unitId, targetId: other.id, attack });
      hit(state, other, attack);
    }
  }

  // Cluster bomb: enemy units next to the target take a share of the attack.
  if (stats.splash) {
    const amount = Math.floor(attack * stats.splash);
    for (const k of neighbourKeys(target.at)) {
      const other = unitAt(state, k);
      if (!other || !isEnemy(unit, other) || !canHit(state, unit, other)) continue;
      state.events.push({ type: "splash", unitId, targetId: other.id, attack: amount });
      hit(state, other, amount);
    }
  }

  // Return fire is simultaneous: the target hits back even if this attack destroys it, so
  // starting an even fight gives no free shot.
  if (firesBack(state, unit, target)) {
    const attackBack = unitStats(state, target).attack;
    state.events.push({ type: "returnFire", unitId: targetId, targetId: unitId,
      attack: attackBack });
    hit(state, unit, attackBack);
  }
}

// Return fire: a target with a short range attacked from an adjacent hex hits back once,
// whether or not the attack destroys it, if its own attack can hit the attacker (ground or
// air). Works on a view too.
export function firesBack(state, attacker, target) {
  const stats = unitStats(state, target);
  const d = distance(attacker.at, target.at);
  if (!canHit(state, target, attacker) || target.cooldown > 0) return false;
  if (state.rules.combat.returnFire === "inRange") {
    return stats.attack > 0 && Boolean(stats.range) && d >= stats.range[0] &&
      d <= stats.range[1] && (!stats.needsSetup || target.setUp);
  }
  return d === 1 &&
    stats.attack > 0 &&
    Boolean(stats.range) &&
    stats.range[0] <= 1 &&
    stats.range[1] <= state.rules.combat.returnFireMaxRange &&
    (!stats.needsSetup || target.setUp);
}

// Attacks on one unit within a turn add up. The total decides how many lives it has lost
// this turn: one at its defence, both at twice its defence. Returns the total so far this
// turn (including amount), the target's defence and the lives it would have left. Works on a
// view too, so the AI and the game screen can preview a shot.
export function livesAfterHit(state, target, amount) {
  const record = state.hits[target.id] || { total: 0, livesAtStart: target.lives };
  const total = record.total + amount;
  const defence = defenceOf(state, target);
  const { loseOneLifeAt, loseTwoLivesAt } = state.rules.combat;
  let lost = 0;
  if (total >= loseTwoLivesAt * defence) lost = 2;
  else if (total >= loseOneLifeAt * defence) lost = 1;
  const lives = Math.min(target.lives, Math.max(0, record.livesAtStart - lost));
  return { total, defence, lives };
}

function hit(state, target, amount) {
  const { total, defence, lives } = livesAfterHit(state, target, amount);
  state.hits[target.id] = {
    total, livesAtStart: (state.hits[target.id] || { livesAtStart: target.lives }).livesAtStart,
  };
  state.events.push({ type: "hit", unitId: target.id, amount, total, defence,
    livesBefore: target.lives, livesAfter: lives });
  target.lives = lives;
  if (lives === 0) {
    removeUnit(state, target);
    // Infantry inside a transporter are lost with it.
    for (const unit of [target, ...(target.cargo || [])]) {
      state.events.push({ type: "destroyed", unitId: unit.id, unitType: unit.type,
        owner: unit.owner, at: target.at });
    }
  }
}

function applyHeal(state, { unitId, targetId }) {
  const unit = ownUnit(state, unitId);
  if (!healTargets(viewFor(state, state.current), unitId).includes(targetId)) {
    illegal(`${unitId} cannot heal ${targetId}`);
  }
  const target = state.units[targetId];
  target.lives += 1;
  delete state.hits[targetId];
  finishAction(unit);
  state.events.push({ type: "heal", unitId, targetId });
}

function applyHarvest(state, { unitId, at }) {
  const unit = ownUnit(state, unitId);
  if (!harvestTargets(viewFor(state, state.current), unitId).includes(at)) {
    illegal(`${unitId} cannot harvest at ${at}`);
  }
  const pile = state.crystals[at];
  const free = unitStats(state, unit).storage - unit.carrying;
  const amount = Math.min(free, pile.amount);
  pile.amount -= amount;
  pile.harvestedThisTurn = true;
  if (pile.amount <= 0) delete state.crystals[at];
  unit.carrying += amount;
  finishAction(unit);
  state.events.push({ type: "harvest", unitId, at, amount });
}

function applyUnload(state, { unitId }) {
  const unit = ownUnit(state, unitId);
  if (!canUnload(viewFor(state, state.current), unitId)) illegal(`${unitId} cannot unload`);
  unload(state, unit, false);
  finishAction(unit);
}

function unload(state, unit, automatic) {
  state.players[unit.owner].crystals += unit.carrying;
  state.events.push({ type: "unload", unitId: unit.id, amount: unit.carrying, automatic });
  unit.carrying = 0;
}

// Setting up takes the unit's action for the turn, so it can fire from the next turn.
function applySetUp(state, { unitId }) {
  const unit = ownUnit(state, unitId);
  if (!canSetUp(state, unitId)) illegal(`${unitId} cannot set up`);
  unit.setUp = true;
  finishAction(unit);
  state.events.push({ type: "setUp", unitId });
}

// Packing up also takes the action, so the unit can move again from the next turn.
function applyPackUp(state, { unitId }) {
  const unit = ownUnit(state, unitId);
  if (!canPackUp(state, unitId)) illegal(`${unitId} cannot pack up`);
  unit.setUp = false;
  finishAction(unit);
  state.events.push({ type: "packUp", unitId });
}

function applyBuild(state, { unitType, at }) {
  const player = state.current;
  const stats = state.rules.units[unitType];
  if (!stats || stats.cost === null) illegal(`${unitType} cannot be built`);
  if (stats.cost > state.players[player].crystals) illegal(`not enough crystals`);
  if (!buildSites(state, player, unitType).includes(at)) illegal(`cannot build at ${at}`);
  state.players[player].crystals -= stats.cost;
  const unit = addUnit(state, unitType, player, at);
  finishAction(unit);
  state.events.push({ type: "build", unitId: unit.id, unitType, at });
}

function applyUpgrade(state, { factoryId, upgrade }) {
  const factory = ownUnit(state, factoryId);
  if (!upgradeOptions(state, factoryId).includes(upgrade)) {
    illegal(`${factoryId} cannot add ${upgrade}`);
  }
  const { cost } = state.rules.factoryUpgrades[upgrade];
  if (cost > state.players[state.current].crystals) illegal(`not enough crystals`);
  state.players[state.current].crystals -= cost;
  factory.upgrades = [...factory.upgrades, upgrade];
  state.events.push({ type: "upgrade", factoryId, upgrade, at: factory.at });
}

// A player gives up (the Quit button): the other player wins. Not offered by legalActions,
// so the AI and the simulator never choose it.
function applyResign(state, { player = state.current }) {
  if (player !== 0 && player !== 1) illegal(`no player ${player}`);
  state.result = { winner: 1 - player, reason: "resigned", round: state.round };
  state.events.push({ type: "gameOver", ...state.result });
}

function applyEndTurn(state) {
  unloadAtFactory(state, state.current);
  factoryIncome(state, state.current);
  crystalsBetweenTurns(state);
  state.hits = {};
  state.events.push({ type: "endTurn", player: state.current });
  state.turnIndex += 1;
  if (state.turnIndex >= state.order.length) {
    state.turnIndex = 0;
    endRound(state);
  }
  state.current = state.order[state.turnIndex];
  for (const unit of unitsOf(state, state.current)) {
    unit.moved = false;
    unit.moveUsed = 0;
    unit.acted = false;
    if (unit.cooldown > 0) unit.cooldown -= 1;
  }
}

// Each factory the player holds besides a home factory pays capture.incomePerTurn crystals at
// the end of their turn.
function factoryIncome(state, player) {
  const income = state.rules.capture.incomePerTurn;
  if (!income) return;
  const count = factoriesOf(state, player).filter((f) => !isHomeFactory(state, f)).length;
  if (!count) return;
  state.players[player].crystals += count * income;
  state.events.push({ type: "factoryIncome", player, amount: count * income });
}

// Units that end their owner's turn next to one of its factories unload what they carry,
// without needing the Unload action.
function unloadAtFactory(state, player) {
  for (const unit of unitsOf(state, player)) {
    if (unit.carrying > 0 && nextToOwnFactory(state, unit)) unload(state, unit, true);
  }
}

// ---------------------------------------------------------------------------------------
// Between turns: crystals grow, explode and spawn

// After every turn, each pile not harvested during that turn grows; one that reaches the
// explode level explodes and its crystals are lost. Then new piles spawn. Doing this after
// every turn, not once a round, means neither player gets the growth or the new piles first.
function crystalsBetweenTurns(state) {
  const rules = state.rules.crystals;
  for (const k in state.crystals) {
    const pile = state.crystals[k];
    if (!pile.harvestedThisTurn) pile.amount += rules.growthPerTurn;
    pile.harvestedThisTurn = false;
    if (pile.amount >= rules.explodeAt) {
      delete state.crystals[k];
      state.events.push({ type: "crystalsExploded", at: k, amount: pile.amount });
    }
  }
  for (let i = 0; i < state.spawnsPerTurn; i++) spawnCrystals(state);
}

// How many piles spawn after each turn this round. Drawn once a round, so both players see
// the same number appear before their turn.
function drawSpawnsPerTurn(state) {
  const choices = state.rules.crystals.spawnChoices;
  return choices[Math.floor(random(state) * choices.length)];
}

function endRound(state) {
  state.round += 1;
  if (state.rules.turnOrder === "alternate") state.order = [...state.order].reverse();
  state.spawnsPerTurn = drawSpawnsPerTurn(state);
  state.events.push({ type: "newRound", round: state.round });
  if (state.round > state.rules.roundCap) {
    state.result = { winner: null, reason: "roundCap", round: state.round };
  }
}

export function spawnSites(state) {
  const rules = state.rules.crystals;
  const factories = [...state.map.factories,
    ...(state.map.neutralFactories || []).map((f) => f.at)];
  return Object.keys(state.map.hexes).filter((k) =>
    terrainRules(state, k).moveCost !== null &&
    !state.crystals[k] &&
    !unitAt(state, k) &&
    factories.every((f) => distance(f, k) >= rules.spawnMinDistanceFromFactory));
}

function spawnCrystals(state) {
  const sites = spawnSites(state);
  if (!sites.length) return;
  const at = sites[Math.floor(random(state) * sites.length)];
  const amount = state.rules.crystals.spawnAmount;
  state.crystals[at] = { amount, harvestedThisTurn: false };
  state.events.push({ type: "spawn", at, amount });
}

// ---------------------------------------------------------------------------------------
// Winning

// A player loses when their home factory is destroyed or captured (win condition
// "homeFactory") or when they have no factory left ("allFactories"), or when they have no
// units left and cannot afford to build one.
function checkResult(state) {
  if (state.result) return;
  const cheapest = Math.min(
    ...buildableTypes(state).map((type) => state.rules.units[type].cost));
  const losers = state.players
    .map((player, p) => {
      if (state.rules.winCondition === "allFactories") {
        if (!factoriesOf(state, p).length) return { p, reason: "noFactories" };
      } else {
        const home = state.units[player.factoryId];
        if (!home) return { p, reason: "factoryDestroyed" };
        if (home.owner !== p) return { p, reason: "factoryCaptured" };
      }
      const army = unitsOf(state, p).filter((u) => !unitStats(state, u).isFactory);
      if (!army.length && player.crystals < cheapest) return { p, reason: "noUnits" };
      return null;
    })
    .filter(Boolean);
  if (!losers.length) return;
  const winner = losers.length === 1 ? 1 - losers[0].p : null;
  state.result = { winner, reason: losers[0].reason, round: state.round };
  state.events.push({ type: "gameOver", ...state.result });
}

// ---------------------------------------------------------------------------------------
// Seeded random numbers (mulberry32). The generator state lives in state.rng.

function random(state) {
  state.rng = (state.rng + 0x6d2b79f5) >>> 0;
  let t = state.rng;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
