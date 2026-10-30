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
  neighbourKeys, distance, lineOfSight, cheapestPaths, pathTo, ray,
} from "./hex.js?v=0.73";

// Factories, infantry and transporters (format 7):
// - Every factory is a unit. Each player owns a home factory (players[p].factoryId, null for
//   a player who starts without one); bigger maps also have unused factories (owner null).
//   Factories are not fired on unless rules.combat.factoriesTakeFire is set.
// - Infantry capture ("overrun") a factory that is not their owner's by moving into it; the
//   troops are used up. Home factories can be captured if rules.capture.homeFactories is set.
//   An unused factory's store of crystals (unit.store) goes to whoever captures it.
// - A transporter carries passengers in unit.cargo; they board by moving onto it and are
//   dropped off on a free hex next to it, or straight into a factory to capture it.
// - Factory upgrades (unit.upgrades) unlock the unit types that need them (stat "needs"); a
//   Crystal lab makes crystals every turn.
// - A move cut short by turning over new ground (stoppedBy "revealed") leaves the unit able
//   to use the rest of its move (unit.continues).
// - players[p].lost counts that player's destroyed units by type.
//
// Sides, teams and turns (format 8):
// - A game has 2 to 5 sides (players[p]), each with a colour and a team. Players on the same
//   team are allies: they cannot fire on or overrun each other. A player whose factories all
//   have no Comms keeps their view to themselves; two allies who both have Comms in one of
//   their factories see everything either of them sees.
// - Turns run in phases (state.phases, lists of players). Everyone in a phase acts at the
//   same time and the phase ends when all of them have ended their turn; state.active holds
//   those still to finish. An action may name its player (action.player); without one it is
//   for state.current, the first player still active. Two-player games have one player a
//   phase, as before.
// - A player who loses while others play on is knocked out (players[p].out): their units go,
//   their factories become unused and share out their crystals, and their turns are skipped.
//   The game ends when only one team is left.

// Saved games in any other format are not loaded.
export const STATE_FORMAT = 8;
export const PLAYER_COLOURS = ["blue", "green", "yellow", "purple", "pink"];

// ---------------------------------------------------------------------------------------
// Setting up

// setup (campaign missions and difficulty levels): { units: [blue types, green types],
// crystals: [blue, green], unclaimedHome: [blue?, green?], noHome: [blue?, green?],
// upgrades: [blue's, green's] } replaces the starting units and crystals in rules.start for
// that game. A player whose home is unclaimed starts with their home factory unused and must
// capture it with infantry first; a player with noHome has no factory at all. upgrades are
// already fitted to the player's home factory.
//
// sides: one entry per player, { team } (default: two sides, each its own team); the map
// needs a factory site for each. phases: who acts together, as lists of players (default:
// one player at a time, firstPlayer first, then round the table). Players not in the first
// phase get extra crystals (rules.start.secondPlayerCrystals, shared out by how late their
// phase comes), to make up for moving later.
export function newGame({
  rules, map, seed = 1, firstPlayer = 0, recordActions = true, setup = null,
  sides = null, phases = null,
}) {
  const teams = (sides || [{ team: 0 }, { team: 1 }]).map((side, p) => side.team ?? p);
  const count = teams.length;
  const order = phases || Array.from({ length: count }, (_, i) => [(firstPlayer + i) % count]);
  const state = {
    format: STATE_FORMAT,
    rules,
    map,
    seed,
    rng: seed >>> 0,
    round: 1,
    phases: order.map((phase) => [...phase]),
    phaseIndex: 0,
    active: [...order[0]],
    current: order[0][0],
    players: teams.map((team, p) => ({
      colour: PLAYER_COLOURS[p],
      team,
      out: false,
      crystals: rules.start.crystals,
      factoryId: null,
      explored: {},
      seenCrystals: {},
      // Other players' and unused factories as last seen, by id.
      seenFactories: {},
      // Map blocks this player has turned over (fog mode "tiles").
      revealed: {},
      lost: {},
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

  const factorySites = [...map.factories, ...(map.neutralFactories || []).map((f) => f.at)];
  const taken = new Set([...factorySites, ...map.deposits.map((d) => d.at)]);
  state.players.forEach((player, p) => {
    const unclaimed = Boolean(setup && setup.unclaimedHome && setup.unclaimedHome[p]);
    if (!(setup && setup.noHome && setup.noHome[p])) {
      const factory = addUnit(state, "factory", unclaimed ? null : p, map.factories[p]);
      factory.upgrades = [...((setup && setup.upgrades && setup.upgrades[p]) || [])];
      player.factoryId = factory.id;
    }
    const types = setup ? setup.units[p] : rules.start.units;
    types.forEach((type, i) => {
      const at = startSite(state, p, map.starts[p][i], taken);
      taken.add(at);
      addUnit(state, type, p, at);
    });
  });
  for (const site of map.neutralFactories || []) {
    addUnit(state, "factory", null, site.at).store = rules.capture.unusedFactoryCrystals || 0;
  }
  if (setup) {
    state.players.forEach((player, p) => { player.crystals = setup.crystals[p]; });
  } else if (order.length > 1) {
    order.forEach((phase, i) => {
      const extra = Math.round((rules.start.secondPlayerCrystals || 0) * i / (order.length - 1));
      for (const p of phase) state.players[p].crystals += extra;
    });
  }
  for (const deposit of map.deposits) {
    const amount = rules.crystals.startAmount;
    state.crystals[deposit.at] = { amount, harvestedThisTurn: false };
  }
  state.spawnsPerTurn = drawSpawnsPerTurn(state);
  refreshKnowledge(state);
  return state;
}

// Where a starting unit goes: the map's starting hex for it if free and open, otherwise the
// nearest free open hex to the player's factory site.
function startSite(state, player, preferred, taken) {
  const open = (k) => !taken.has(k) &&
    state.rules.terrain[state.map.hexes[k].terrain].moveCost !== null;
  if (preferred && state.map.hexes[preferred] && open(preferred)) return preferred;
  const home = state.map.factories[player];
  const sites = Object.keys(state.map.hexes).filter(open);
  return sites.sort((a, b) => distance(home, a) - distance(home, b) || a.localeCompare(b))[0];
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

// A player's team; players on the same team are allies. Works on a view too.
export function teamOf(state, player) {
  return state.players[player].team ?? player;
}

// Whether two players are on the same team (a player is their own ally).
export function allied(state, a, b) {
  return a === b || teamOf(state, a) === teamOf(state, b);
}

// The other players on a player's team.
export function alliesOf(state, player) {
  return state.players.map((_, p) => p).filter((p) => p !== player && allied(state, p, player));
}

// Units that can be attacked: those of players on another team. Unused factories belong to
// nobody.
function isEnemy(state, unit, other) {
  return other.owner !== null && !allied(state, unit.owner, other.owner);
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

// Hexes the player sees with their own units: in fog mode "sight", the hexes in sight of
// their units; in fog mode "tiles", every hex of a block they have turned over, or with
// rules.fog.liveSight only those of them a unit can see now.
function ownVisibleHexes(state, player) {
  if (!tilesFog(state)) return hexesSeenBy(state, player);
  const visible = {};
  const revealed = state.players[player].revealed;
  const inSight = state.rules.fog.liveSight ? hexesSeenBy(state, player) : null;
  for (const k in state.map.hexes) {
    if (revealed[blockOf(state, k)] && (!inSight || inSight[k])) visible[k] = true;
  }
  return visible;
}

// Whether a player has an upgrade that shares vision (Comms) in one of their factories.
function hasComms(state, player) {
  const shares = Object.keys(state.rules.factoryUpgrades)
    .filter((u) => state.rules.factoryUpgrades[u].sharesVision);
  return factoriesOf(state, player).some((f) => f.upgrades.some((u) => shares.includes(u)));
}

// Allies whose view the player shares: both of them have Comms (Phil, 29 October 2026).
function sharingAllies(state, player) {
  if (!hasComms(state, player)) return [];
  return alliesOf(state, player).filter((a) => !state.players[a].out && hasComms(state, a));
}

// Hexes the player can see now: their own, and those of allies they share a view with.
export function visibleHexes(state, player) {
  const visible = ownVisibleHexes(state, player);
  for (const ally of sharingAllies(state, player)) {
    Object.assign(visible, ownVisibleHexes(state, ally));
  }
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
    // A block turned over shows everything on it at that moment, as on the table, even
    // where no unit can see it now (fog liveSight).
    if (tilesFog(state)) {
      for (const k in state.map.hexes) {
        if (!player.explored[k] && player.revealed[blockOf(state, k)]) seen[k] = true;
      }
    }
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
// terrain of explored hexes (null elsewhere) and crystals as last seen. Given that player's
// view (a device in a game hosted elsewhere holds only its own), it returns it unchanged.
export function viewFor(state, player) {
  if (state.isView) {
    if (state.viewer !== player) throw new Error("A view shows only its own player");
    return state;
  }
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
    phases: state.phases,
    phaseIndex: state.phaseIndex,
    active: state.active,
    current: state.current,
    players: state.players.map((pl, p) => (p === player ? pl
      : { colour: pl.colour, factoryId: pl.factoryId, team: pl.team, out: pl.out })),
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
// So can a unit whose last move stopped to turn over new ground (unit.continues).
function moveLeft(state, unit) {
  const stats = unitStats(state, unit);
  if (unit.acted || unit.setUp || stats.move <= 0) return 0;
  if (stats.splitMove || unit.continues) return stats.move - (unit.moveUsed || 0);
  return unit.moved ? 0 : stats.move;
}

// Infantry can capture a factory that is not their owner's by moving into it. With
// rules.capture.guarded, not while one of the factory owner's units is next to it. Works on a
// view too.
export function canCapture(state, unit, factory) {
  if (!factory || !unitStats(state, unit).captures || factory.owner === unit.owner) return false;
  if (!unitStats(state, factory).isFactory) return false;
  // Allies' factories cannot be overrun.
  if (factory.owner !== null && allied(state, factory.owner, unit.owner)) return false;
  // A player's home can be taken only if the rules allow it, or while nobody holds it.
  if (isHomeFactory(state, factory) && factory.owner !== null &&
    !state.rules.capture.homeFactories) return false;
  return !state.rules.capture.guarded || factory.owner === null ||
    !unitsOf(state, factory.owner).some((u) => distance(u.at, factory.at) === 1);
}

// Places a passenger takes in a transporter: its stat "size", 2 for a vehicle if not given.
const VEHICLE_SIZE = 2;

function sizeOf(state, unit) {
  return unitStats(state, unit).size || VEHICLE_SIZE;
}

// A ground unit can board its owner's transporter by moving onto it, if the transporter
// loads its kind (only units that ride, or any ground unit) and has room for it.
export function canBoard(state, unit, transporter) {
  if (!transporter || transporter.owner !== unit.owner || transporter.id === unit.id) {
    return false;
  }
  const carrier = unitStats(state, transporter);
  const stats = unitStats(state, unit);
  if (!carrier.carries || stats.air || stats.isFactory || stats.carries) return false;
  if (carrier.loads === "infantry" && !stats.rides) return false;
  const used = (transporter.cargo || []).reduce((sum, c) => sum + sizeOf(state, c), 0);
  return used + sizeOf(state, unit) <= carrier.carries;
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

// Whether a unit can fire on another: an enemy its attack can hit, and not a factory unless
// factories take fire. Works on a view too.
function canTarget(state, unit, target) {
  return isEnemy(state, unit, target) && canHit(state, unit, target) &&
    (state.rules.combat.factoriesTakeFire || !unitStats(state, target).isFactory);
}

// Whether the unit can fire now, and if so a test for the hexes it can fire at: in range,
// along a straight line for a line attack, otherwise with a clear line of sight. Unknown
// terrain does not block. null if it cannot fire.
function firingReach(view, unit) {
  if (unit.acted || unit.cooldown > 0) return null;
  const stats = unitStats(view, unit);
  if (!stats.attack || !stats.range) return null;
  if (stats.needsSetup && !unit.setUp) return null;
  const [minRange, maxRange] = stats.range;
  if (stats.line) {
    // A sonic boom can be aimed at any hex in range that it reaches before a mountain.
    return (k) => {
      const d = distance(unit.at, k);
      return d >= minRange && d <= maxRange && boomHexes(view, unit.at, k, d).includes(k);
    };
  }
  // Indirect fire (Artillery) goes over mountains.
  const blocks = stats.indirect ? () => false : blocksSight(view);
  return (k) => {
    const d = distance(unit.at, k);
    return d >= minRange && d <= maxRange && lineOfSight(unit.at, k, blocks);
  };
}

// Enemy units the unit can fire at: ids of targets in sight (and, for a unit with several
// shots, not already fired at this turn).
export function attackTargets(view, unitId) {
  const unit = view.units[unitId];
  const reach = unit && firingReach(view, unit);
  if (!reach) return [];
  const done = unit.shotAt || [];
  return Object.values(view.units)
    .filter((t) => view.visible[t.at] && canTarget(view, unit, t) && reach(t.at) &&
      !done.includes(t.id))
    .map((t) => t.id);
}

// Crystal piles the unit can blow up (Phil, 29 October 2026): piles in sight and in range of
// a unit whose attack hits ground units. Crystals are unstable, so a shot destroys the whole
// pile, and it takes the unit's attack for the turn. A cluster bomb's splash also destroys
// piles next to where it lands; a sonic boom passing over a pile leaves it alone; only piles
// the player can see now can be aimed at.
export function crystalTargets(view, unitId) {
  const unit = view.units[unitId];
  const reach = unit && firingReach(view, unit);
  if (!reach || !view.rules.crystals.blastable) return [];
  const hits = unitStats(view, unit).hits || "ground";
  if (hits === "air") return [];
  return Object.keys(view.crystals).filter((k) => view.visible[k] && reach(k));
}

// Hexes the unit can fire into blind (Phil, 29 October 2026): hexes in range that the player
// cannot see. Whatever is there, if anything, is hit.
// A sonic boom can also be aimed at any hex in range, seen or not, without a target there:
// it runs on along the line and hits whatever enemies are on it.
export function darkTargets(view, unitId) {
  const unit = view.units[unitId];
  const reach = unit && firingReach(view, unit);
  if (!reach) return [];
  if (unitStats(view, unit).line) {
    const targets = new Set(attackTargets(view, unitId).map((id) => view.units[id].at));
    return Object.keys(view.map.hexes).filter((k) => reach(k) && !targets.has(k));
  }
  return Object.keys(view.map.hexes).filter((k) => !view.visible[k] && reach(k));
}

// The hexes a sonic boom crosses, aimed from one hex at another (Phil, 30 October 2026): the
// straight line from the unit through the aimed hex and on, out to range, one hex a step
// (the hex the line runs through most). It stops before terrain that blocks sight and at the
// edge of the map. Works on a view too.
export function boomHexes(state, from, toward, range) {
  const blocks = blocksSight(state);
  const out = [];
  for (const k of ray(from, toward, range)) {
    if (!state.map.hexes[k] || blocks(k)) break;
    out.push(k);
  }
  return out;
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

// Hexes a transporter can drop its next passenger on: a free open hex next to it, or a
// factory next to it that the passenger can capture (unless capture.mustStartNextTo).
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
  return unitAllowed(state, type) &&
    (!stats.needs || factory.upgrades.includes(stats.needs));
}

// Whether a unit type can be built in this game: it has a cost, and the game's list of
// allowed units (rules.allowedUnits, set by campaign missions; null = all) includes it.
export function unitAllowed(state, type) {
  const allowed = state.rules.allowedUnits;
  return state.rules.units[type].cost !== null && (!allowed || allowed.includes(type));
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

// Every unit type that can be built in this game, cheapest first.
export function buildableTypes(state) {
  return Object.keys(state.rules.units).filter((type) => unitAllowed(state, type))
    .sort((a, b) => state.rules.units[a].cost - state.rules.units[b].cost);
}

// The upgrades a factory has not bought yet, of those allowed in this game
// (rules.allowedUpgrades; null = all). Comms is offered only to a player with allies.
export function upgradeOptions(state, factoryId) {
  const factory = state.units[factoryId];
  if (!factory || !factory.upgrades) return [];
  const allowed = state.rules.allowedUpgrades;
  const lonely = factory.owner === null || !alliesOf(state, factory.owner).length;
  return Object.keys(state.rules.factoryUpgrades).filter((u) =>
    !factory.upgrades.includes(u) && (!allowed || allowed.includes(u)) &&
    !(lonely && state.rules.factoryUpgrades[u].sharesVision));
}

// ---------------------------------------------------------------------------------------
// Legal actions

// The actions a player can take now (by default state.current). An action for a player in a
// phase with others names its player.
export function legalActions(state, player = state.current) {
  if (state.result || !state.active.includes(player)) return [];
  const view = state.isView ? state : viewFor(state, player);
  const actions = [];
  for (const unit of unitsOf(view, player)) {
    const id = unit.id;
    for (const to in reachableHexes(view, id)) actions.push({ type: "move", unitId: id, to });
    for (const targetId of attackTargets(view, id)) {
      actions.push({ type: "attack", unitId: id, targetId });
    }
    for (const at of darkTargets(view, id)) actions.push({ type: "attack", unitId: id, at });
    for (const at of crystalTargets(view, id)) actions.push({ type: "blast", unitId: id, at });
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
  return player === state.current ? actions : actions.map((a) => ({ ...a, player }));
}

// ---------------------------------------------------------------------------------------
// Applying actions

const HANDLERS = {
  move: applyMove,
  attack: applyAttack,
  blast: applyBlast,
  heal: applyHeal,
  harvest: applyHarvest,
  unload: applyUnload,
  setUp: applySetUp,
  packUp: applyPackUp,
  drop: applyDrop,
  build: applyBuild,
  upgrade: applyUpgrade,
  endTurn: applyEndTurn,
  resumeTurn: applyResumeTurn,
  resign: applyResign,
};

export function applyAction(state, action) {
  if (state.isView) throw new Error("Actions apply to the full game state, not a view");
  if (state.result) throw new Error("The game is over");
  const handler = HANDLERS[action.type];
  if (!handler) throw new Error(`Unknown action: ${action.type}`);
  // Resigning can happen at any time, and taking back an ended turn after it has ended;
  // everything else only in the player's own turn.
  const actor = action.player ?? state.current;
  if (!["resign", "resumeTurn"].includes(action.type) && !state.active.includes(actor)) {
    illegal("not your turn");
  }

  const next = cloneState(state);
  next.events = [];
  handler(next, action, actor);
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
    lost: { ...player.lost },
  }));
  return {
    ...state,
    phases: state.phases.map((phase) => [...phase]),
    active: [...state.active],
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
function ownUnit(state, unitId, actor) {
  const unit = state.units[unitId];
  if (!unit || unit.owner !== actor) illegal(`no unit ${unitId} for this player`);
  return unit;
}

function finishAction(unit) {
  unit.acted = true;
  unit.moved = true;
}

// A shot: most units fire once and are done; a unit with stat "shots" keeps firing, each
// time at a different target (unit.shotAt), until it has used them all. It cannot move once
// it has fired.
function spendShot(unit, stats, targetId = null) {
  unit.moved = true;
  unit.continues = false;
  unit.shotsFired = (unit.shotsFired || 0) + 1;
  if (targetId) unit.shotAt = [...(unit.shotAt || []), targetId];
  if (unit.shotsFired >= (stats.shots || 1)) unit.acted = true;
}

// The path is planned on what the player knows. Walking it on the real board, a ground unit
// stops early at anything hidden in the way: an enemy unit or impassable ground. A flying unit
// passes over everything but cannot stop on a hex that turns out to be occupied. With
// rules.fog.stopOnReveal, a move that turns over a new block stops there, unless it has
// arrived, so the player always sees what turned over next to the unit (Phil, 30 October
// 2026); the unit can use the rest of its move afterwards. A move into a factory captures it;
// a move onto a transporter boards it.
function applyMove(state, { unitId, to }, actor) {
  const unit = ownUnit(state, unitId, actor);
  const view = viewFor(state, actor);
  const route = routes(view, view.units[unitId])[to];
  if (!route) illegal(`${unitId} cannot reach ${to}`);

  const byHex = occupancy(state);
  const entering = (k) => k === to &&
    (canCapture(state, unit, byHex[k]) || canBoard(state, unit, byHex[k]));
  const allowance = moveLeft(state, unit);
  const flies = Boolean(unitStats(state, unit).air);
  const player = state.players[unit.owner];
  const stopOnReveal = tilesFog(state) && state.rules.fog.stopOnReveal;
  const from = unit.at;
  // Each hex walked, with the move points it took.
  const walked = [];
  let stoppedBy = null;
  let spent = 0;
  for (let i = 0; i < route.path.length; i++) {
    const k = route.path[i];
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
    walked.push({ k, cost });
    // Blocks come into sight along the way, not just at the end of the move.
    if (!tilesFog(state)) continue;
    const before = Object.keys(player.revealed).length;
    revealFrom(state, unit.owner, k, revealRangeOf(state, unit));
    const turned = Object.keys(player.revealed).length > before;
    if (stopOnReveal && turned && i < route.path.length - 1) {
      stoppedBy = "revealed";
      break;
    }
  }
  // Never finish on a hex another unit is on, unless entering it.
  while (walked.length) {
    const last = walked[walked.length - 1].k;
    if (!byHex[last] || entering(last)) break;
    walked.pop();
  }

  const path = walked.map((step) => step.k);
  const used = walked.reduce((sum, step) => sum + step.cost, 0);
  unit.at = path.length ? path[path.length - 1] : from;
  unit.moved = true;
  // A move that gets nowhere (something hidden in the way) uses up the rest of the unit's
  // move, so a unit that splits its move cannot keep trying it.
  unit.moveUsed = path.length ? (unit.moveUsed || 0) + used : unitStats(state, unit).move;
  unit.continues = stoppedBy === "revealed" && used > 0 && unit.at !== to;
  state.events.push({ type: "move", unitId, from, to: unit.at, path, stoppedBy,
    moveLeft: unit.continues ? moveLeft(state, unit) : 0 });

  // Driving onto or over crystals destroys them; flying over them does not.
  if (state.rules.crystals.crushedByMovement && !flies) {
    for (const k of path) {
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
// Crystals in an unused factory's store go to its new owner.
function capture(state, unit, factory) {
  removeUnit(state, unit);
  const crystals = factory.store || 0;
  state.players[unit.owner].crystals += crystals;
  state.events.push({ type: "capture", unitId: unit.id, factoryId: factory.id,
    from: factory.owner, owner: unit.owner, at: factory.at, crystals });
  factory.owner = unit.owner;
  factory.store = 0;
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
function applyDrop(state, { unitId, at }, actor) {
  const transporter = ownUnit(state, unitId, actor);
  if (!dropSites(viewFor(state, actor), unitId).includes(at)) {
    illegal(`${unitId} cannot drop off at ${at}`);
  }
  const [passenger, ...rest] = transporter.cargo;
  transporter.cargo = rest;
  const unit = { ...passenger, at, continues: false };
  finishAction(unit);
  const there = unitAt(state, at);
  state.units[unit.id] = unit;
  state.events.push({ type: "drop", unitId: unit.id, transporterId: unitId, at });
  if (there) capture(state, unit, there);
}

// An attack at a unit in sight (targetId), or blind into a hex the player cannot see (at),
// which hits whatever enemy is there, if any.
function applyAttack(state, { unitId, targetId, at }, actor) {
  const unit = ownUnit(state, unitId, actor);
  const view = viewFor(state, actor);
  const blind = targetId === undefined;
  if (blind ? !darkTargets(view, unitId).includes(at)
    : !attackTargets(view, unitId).includes(targetId)) illegal(`${unitId} cannot attack`);
  const stats = unitStats(state, unit);
  const attack = stats.attack;
  const where = blind ? at : state.units[targetId].at;
  const found = unitAt(state, where);
  const target = found && canTarget(state, unit, found) ? found : null;
  spendShot(unit, stats, target ? target.id : null);
  if (stats.reload) unit.cooldown = stats.reload + 1;
  if (blind) {
    state.events.push({ type: "fireBlind", unitId, at: where, attack, hit: Boolean(target),
      targetId: target ? target.id : null, seen: Boolean(view.visible[where]) });
  } else {
    state.events.push({ type: "fire", unitId, targetId, attack });
  }
  if (target) hit(state, target, attack);

  // Sonic boom: every other enemy along its line, up to range, is hit too.
  if (stats.line) {
    const path = boomHexes(state, unit.at, where, stats.range[1]);
    state.events.push({ type: "boom", unitId, from: unit.at, at: where, path });
    for (const k of path) {
      const other = unitAt(state, k);
      if (!other || other === target || !canTarget(state, unit, other)) continue;
      state.events.push({ type: "lineHit", unitId, targetId: other.id, attack });
      hit(state, other, attack);
    }
  }

  if (stats.splash) clusterBomb(state, unit, where);

  // Return fire is simultaneous: the target hits back even if this attack destroys it, so
  // starting an even fight gives no free shot. A unit fired on blind does not know who fired.
  if (target && !blind && firesBack(state, unit, target)) {
    const attackBack = unitStats(state, target).attack;
    state.events.push({ type: "returnFire", unitId: target.id, targetId: unitId,
      attack: attackBack });
    if (state.hits[target.id]) {
      state.hits[target.id] = { ...state.hits[target.id],
        firedBack: (state.hits[target.id].firedBack || 0) + 1 };
    }
    hit(state, unit, attackBack);
  }
}

// Cluster bomb: enemy units next to where it lands take a share of the attack, and crystal
// piles next to it are destroyed (Phil, 29 October 2026).
function clusterBomb(state, unit, where) {
  const amount = Math.floor(unitStats(state, unit).attack * unitStats(state, unit).splash);
  for (const k of neighbourKeys(where)) {
    if (state.crystals[k] && state.rules.crystals.blastable) blowUp(state, unit, k);
    const other = unitAt(state, k);
    if (!other || !canTarget(state, unit, other)) continue;
    state.events.push({ type: "splash", unitId: unit.id, targetId: other.id, attack: amount });
    hit(state, other, amount);
  }
}

function blowUp(state, unit, at) {
  const pile = state.crystals[at];
  delete state.crystals[at];
  state.events.push({ type: "blast", unitId: unit.id, at, amount: pile.amount });
}

// A shot at a crystal pile: the whole pile is destroyed, and the shot is spent. A cluster
// bomb also hits what is next to the pile.
function applyBlast(state, { unitId, at }, actor) {
  const unit = ownUnit(state, unitId, actor);
  if (!crystalTargets(viewFor(state, actor), unitId).includes(at)) {
    illegal(`${unitId} cannot blow up crystals at ${at}`);
  }
  const stats = unitStats(state, unit);
  spendShot(unit, stats);
  if (stats.reload) unit.cooldown = stats.reload + 1;
  blowUp(state, unit, at);
  if (stats.splash) clusterBomb(state, unit, at);
}

// Return fire: a target with a short range attacked from an adjacent hex hits back once,
// whether or not the attack destroys it, if its own attack can hit the attacker (ground or
// air), and if it has not already fired back as often this turn as combat.returnFirePerTurn
// allows. Works on a view too.
export function firesBack(state, attacker, target) {
  const stats = unitStats(state, target);
  const d = distance(attacker.at, target.at);
  if (!canHit(state, target, attacker) || target.cooldown > 0) return false;
  const limit = state.rules.combat.returnFirePerTurn;
  const firedBack = (state.hits[target.id] || {}).firedBack || 0;
  if (limit !== null && limit !== undefined && firedBack >= limit) return false;
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
    ...state.hits[target.id],
    total, livesAtStart: (state.hits[target.id] || { livesAtStart: target.lives }).livesAtStart,
  };
  state.events.push({ type: "hit", unitId: target.id, amount, total, defence,
    livesBefore: target.lives, livesAfter: lives });
  target.lives = lives;
  if (lives === 0) {
    removeUnit(state, target);
    // Passengers inside a transporter are lost with it.
    for (const unit of [target, ...(target.cargo || [])]) {
      const lost = state.players[unit.owner].lost;
      lost[unit.type] = (lost[unit.type] || 0) + 1;
      state.events.push({ type: "destroyed", unitId: unit.id, unitType: unit.type,
        owner: unit.owner, at: target.at });
    }
  }
}

function applyHeal(state, { unitId, targetId }, actor) {
  const unit = ownUnit(state, unitId, actor);
  if (!healTargets(viewFor(state, actor), unitId).includes(targetId)) {
    illegal(`${unitId} cannot heal ${targetId}`);
  }
  const target = state.units[targetId];
  target.lives += 1;
  delete state.hits[targetId];
  finishAction(unit);
  state.events.push({ type: "heal", unitId, targetId });
}

function applyHarvest(state, { unitId, at }, actor) {
  const unit = ownUnit(state, unitId, actor);
  if (!harvestTargets(viewFor(state, actor), unitId).includes(at)) {
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

function applyUnload(state, { unitId }, actor) {
  const unit = ownUnit(state, unitId, actor);
  if (!canUnload(viewFor(state, actor), unitId)) illegal(`${unitId} cannot unload`);
  unload(state, unit, false);
  finishAction(unit);
}

function unload(state, unit, automatic) {
  state.players[unit.owner].crystals += unit.carrying;
  state.events.push({ type: "unload", unitId: unit.id, amount: unit.carrying, automatic });
  unit.carrying = 0;
}

// Setting up takes the unit's action for the turn, so it can fire from the next turn.
function applySetUp(state, { unitId }, actor) {
  const unit = ownUnit(state, unitId, actor);
  if (!canSetUp(state, unitId)) illegal(`${unitId} cannot set up`);
  unit.setUp = true;
  finishAction(unit);
  state.events.push({ type: "setUp", unitId });
}

// Packing up also takes the action, so the unit can move again from the next turn.
function applyPackUp(state, { unitId }, actor) {
  const unit = ownUnit(state, unitId, actor);
  if (!canPackUp(state, unitId)) illegal(`${unitId} cannot pack up`);
  unit.setUp = false;
  finishAction(unit);
  state.events.push({ type: "packUp", unitId });
}

function applyBuild(state, { unitType, at }, actor) {
  const player = actor;
  const stats = state.rules.units[unitType];
  if (!stats || stats.cost === null) illegal(`${unitType} cannot be built`);
  if (stats.cost > state.players[player].crystals) illegal(`not enough crystals`);
  if (!buildSites(state, player, unitType).includes(at)) illegal(`cannot build at ${at}`);
  state.players[player].crystals -= stats.cost;
  const unit = addUnit(state, unitType, player, at);
  finishAction(unit);
  state.events.push({ type: "build", unitId: unit.id, unitType, at });
}

function applyUpgrade(state, { factoryId, upgrade }, actor) {
  const factory = ownUnit(state, factoryId, actor);
  if (!upgradeOptions(state, factoryId).includes(upgrade)) {
    illegal(`${factoryId} cannot add ${upgrade}`);
  }
  const { cost } = state.rules.factoryUpgrades[upgrade];
  if (cost > state.players[actor].crystals) illegal(`not enough crystals`);
  state.players[actor].crystals -= cost;
  factory.upgrades = [...factory.upgrades, upgrade];
  state.events.push({ type: "upgrade", factoryId, upgrade, at: factory.at });
}

// A player gives up (the Quit button). With two sides the other wins; with more, the player
// is knocked out and the others play on. Not offered by legalActions, so the AI and the
// simulator never choose it.
function applyResign(state, { player = state.current }) {
  if (!state.players[player] || state.players[player].out) illegal(`no player ${player}`);
  settle(state, [{ p: player, reason: "resigned" }]);
}

// A player ends their turn. Once everyone in the phase has ended their turn, their units next
// to a factory unload, their Crystal labs pay out, crystals grow and the next phase begins.
// Until then a player who has ended can take it back (resumeTurn), so nothing of theirs
// happens before the phase ends.
function applyEndTurn(state, action, actor) {
  state.active = state.active.filter((p) => p !== actor);
  if (state.active.length) {
    state.current = state.active[0];
    state.events.push({ type: "endTurn", player: actor });
    return;
  }
  for (const p of phasePlayers(state)) {
    unloadAtFactory(state, p);
    labIncome(state, p);
  }
  crystalsBetweenTurns(state);
  state.hits = {};
  state.events.push({ type: "endTurn", player: actor });
  nextPhase(state);
}

// The players of the current phase still in the game.
function phasePlayers(state) {
  return state.phases[state.phaseIndex].filter((p) => !state.players[p].out);
}

// Whether a player has ended their turn while others in the same phase play on, so can still
// take it back (Phil, 30 October 2026).
export function canResumeTurn(state, player) {
  return !state.result && state.active.length > 0 && !state.active.includes(player) &&
    phasePlayers(state).includes(player);
}

// A player takes back their ended turn and plays on with the others in the phase. Not
// offered by legalActions, so the AI and the simulator never choose it.
function applyResumeTurn(state, action, actor) {
  if (!canResumeTurn(state, actor)) illegal("your turn is not waiting on anyone");
  state.active = phasePlayers(state).filter((p) => p === actor || state.active.includes(p));
  state.current = state.active[0];
  state.events.push({ type: "resumeTurn", player: actor });
}

// Starts the next phase that has a player still in the game, turning the round when the
// phases come round again. Its players' units are ready to move and act.
function nextPhase(state) {
  for (let step = 0; step < state.phases.length * 2 && !state.result; step++) {
    state.phaseIndex += 1;
    if (state.phaseIndex >= state.phases.length) {
      state.phaseIndex = 0;
      endRound(state);
    }
    const players = state.phases[state.phaseIndex].filter((p) => !state.players[p].out);
    if (!players.length) continue;
    state.active = players;
    state.current = players[0];
    for (const unit of Object.values(state.units)) {
      if (!players.includes(unit.owner)) continue;
      unit.moved = false;
      unit.moveUsed = 0;
      unit.continues = false;
      unit.acted = false;
      unit.shotsFired = 0;
      unit.shotAt = [];
      if (unit.cooldown > 0) unit.cooldown -= 1;
    }
    return;
  }
}

// Each of the player's factories with a Crystal lab makes crystals at the end of their turn.
function labIncome(state, player) {
  const lab = state.rules.factoryUpgrades.lab;
  if (!lab) return;
  const labs = factoriesOf(state, player).filter((f) => f.upgrades.includes("lab")).length;
  if (!labs) return;
  state.players[player].crystals += labs * lab.income;
  state.events.push({ type: "labIncome", player, amount: labs * lab.income });
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

// After every turn, each pile not harvested during that turn grows, up to the explode level.
// A pile at the explode level stays there for holdTurns turns (pile.held counts them), then
// explodes and its crystals are lost. Then new piles spawn. Doing this after every turn, not
// once a round, means neither player gets the growth or the new piles first.
function crystalsBetweenTurns(state) {
  const rules = state.rules.crystals;
  for (const k in state.crystals) {
    const pile = state.crystals[k];
    if (pile.amount >= rules.explodeAt) {
      pile.held = (pile.held || 0) + 1;
    } else {
      pile.held = 0;
      if (!pile.harvestedThisTurn) {
        pile.amount = Math.min(rules.explodeAt, pile.amount + rules.growthPerTurn);
      }
    }
    pile.harvestedThisTurn = false;
    if (pile.amount >= rules.explodeAt && pile.held >= (rules.holdTurns || 0)) {
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
  if (state.rules.turnOrder === "alternate") state.phases = [...state.phases].reverse();
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
      if (player.out) return null;
      if (state.rules.winCondition === "allFactories") {
        if (!factoriesOf(state, p).length) return { p, reason: "noFactories" };
      } else if (player.factoryId !== null) {
        const home = state.units[player.factoryId];
        if (!home) return { p, reason: "factoryDestroyed" };
        // An unclaimed home (campaign) is not lost until the enemy takes it.
        if (home.owner !== p && home.owner !== null) return { p, reason: "factoryCaptured" };
      }
      const army = unitsOf(state, p).filter((u) => !unitStats(state, u).isFactory);
      if (state.rules.loseWithNoUnits && !army.length && player.crystals < cheapest) {
        return { p, reason: "noUnits" };
      }
      return null;
    })
    .filter(Boolean);
  if (losers.length) settle(state, losers);
}

// Deals with players who have lost. If only one team is left (or none), the game is over:
// the winner is the player left (with two sides, the other player), or the first of the
// winning team, listed in full in winners. Otherwise the losers are knocked out.
function settle(state, losers) {
  const lost = losers.map((l) => l.p);
  const left = state.players.map((_, p) => p)
    .filter((p) => !state.players[p].out && !lost.includes(p));
  const teams = new Set(left.map((p) => teamOf(state, p)));
  if (teams.size <= 1) {
    state.result = { winner: left.length ? left[0] : null, reason: losers[0].reason,
      round: state.round };
    if (left.length > 1) state.result.winners = left;
    state.events.push({ type: "gameOver", ...state.result });
    return;
  }
  for (const { p, reason } of losers) knockOut(state, p, reason);
  if (!state.active.length) nextPhase(state);
}

// A knocked-out player's units are removed (with anything they carry), their factories
// become unused, and their crystals are shared among those factories' stores (Phil, 29
// October 2026); with no factory left, they go to whoever overran their home (provisional).
function knockOut(state, p, reason) {
  const player = state.players[p];
  player.out = true;
  state.events.push({ type: "knockedOut", player: p, reason });
  for (const unit of unitsOf(state, p)) {
    if (!unitStats(state, unit).isFactory) removeUnit(state, unit);
  }
  const factories = factoriesOf(state, p);
  if (factories.length) {
    const share = Math.floor(player.crystals / factories.length);
    factories.forEach((factory, i) => {
      factory.owner = null;
      factory.store = (factory.store || 0) + share +
        (i === 0 ? player.crystals - share * factories.length : 0);
    });
  } else {
    const home = state.units[player.factoryId];
    if (home && home.owner !== null) state.players[home.owner].crystals += player.crystals;
  }
  player.crystals = 0;
  state.active = state.active.filter((x) => x !== p);
  if (state.current === p && state.active.length) state.current = state.active[0];
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
