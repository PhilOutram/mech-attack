// Mech Attack rules engine.
// Pure rules shared by the game screen, the AI and the simulator: no DOM, no window, no
// timers. applyAction takes a state and an action and returns a new state; the input state
// is never changed. The state is plain JSON (save it, replay it, log it). Randomness comes
// from a seeded generator held in the state, so a seed plus the action list replays a game.
//
// Fog of war: viewFor(state, player) is everything that player knows. Every option offered
// to a player (moves, targets, crystals) is worked out from their view, so neither the AI
// nor the UI can learn hidden information from the engine.
import { neighbourKeys, distance, lineOfSight, cheapestPaths, pathTo } from "./hex.js?v=0.02";

export const STATE_FORMAT = 1;
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
      seenFactory: null,
    })),
    units: {},
    nextUnitId: 1,
    crystals: {},
    hits: {},
    result: null,
    events: [],
    actions: recordActions ? [] : null,
  };

  state.players.forEach((player, p) => {
    const factory = addUnit(state, "factory", p, map.factories[p]);
    player.factoryId = factory.id;
    rules.start.units.forEach((type, i) => addUnit(state, type, p, map.starts[p][i]));
  });
  for (const deposit of map.deposits) {
    const def = rules.deposits[deposit.kind];
    state.crystals[deposit.at] = {
      kind: deposit.kind,
      amount: def.amount,
      perHarvest: def.perHarvest,
      harvestedThisRound: false,
    };
  }
  refreshKnowledge(state);
  return state;
}

function addUnit(state, type, owner, at) {
  const id = `u${state.nextUnitId++}`;
  const unit = {
    id, type, owner, at,
    lives: state.rules.lives,
    moved: false,
    acted: false,
    setUp: false,
    carrying: 0,
  };
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

function terrainOf(state, k) {
  const hex = state.map.hexes[k];
  return hex ? hex.terrain : undefined;
}

// Terrain rules for a hex. Unexplored hexes in a view (terrain null) are treated as plain.
function terrainRules(state, k) {
  const terrain = terrainOf(state, k);
  return state.rules.terrain[terrain || "plain"];
}

export function defenceOf(state, unit) {
  return unitStats(state, unit).defence + terrainRules(state, unit.at).defenceBonus;
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

// Hexes the player can currently see: within sight range of one of their units, with a
// clear line of sight.
export function visibleHexes(state, player) {
  const seen = {};
  for (const unit of unitsOf(state, player)) {
    for (const k of hexesInSight(state, unit.at, unitStats(state, unit).sight)) seen[k] = true;
  }
  return seen;
}

// Updates what each player has explored and seen. applyAction calls it after every action;
// call it directly after building a custom position (tests, puzzles).
export function refreshKnowledge(state) {
  state.players.forEach((player, p) => {
    const seen = visibleHexes(state, p);
    for (const k in seen) {
      player.explored[k] = true;
      const pile = state.crystals[k];
      if (pile) player.seenCrystals[k] = { kind: pile.kind, amount: pile.amount };
      else delete player.seenCrystals[k];
    }
    const enemyFactory = state.units[state.players[1 - p].factoryId];
    if (enemyFactory && seen[enemyFactory.at]) {
      player.seenFactory = { id: enemyFactory.id, at: enemyFactory.at };
    }
  });
}

// ---------------------------------------------------------------------------------------
// Fog of war

// Everything the player knows: own units, enemy units in sight, the enemy factory once seen,
// terrain of explored hexes (null elsewhere) and crystals as last seen.
export function viewFor(state, player) {
  const visible = visibleHexes(state, player);
  const me = state.players[player];

  const hexes = {};
  for (const k in state.map.hexes) {
    hexes[k] = me.explored[k] ? state.map.hexes[k] : { terrain: null, cluster: null };
  }

  const units = {};
  for (const id in state.units) {
    const unit = state.units[id];
    if (unit.owner === player || visible[unit.at]) units[id] = unit;
  }
  const factory = me.seenFactory;
  if (factory && !units[factory.id] && state.units[factory.id]) {
    // Last known position of the enemy factory; it cannot move. Damage shows only in sight.
    units[factory.id] = { ...state.units[factory.id], lives: state.rules.lives };
  }

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
    map: { id: state.map.id, name: state.map.name, hexes, factories: state.map.factories },
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

function moveCostFor(state, unit, byHex = occupancy(state)) {
  return (k) => {
    if (!state.map.hexes[k]) return null;
    const cost = terrainRules(state, k).moveCost;
    if (cost === null) return null;
    const other = byHex[k];
    if (other && other.owner !== unit.owner) return null;
    return cost * PATH_SCALE + (state.crystals[k] ? 1 : 0);
  };
}

function plannedPaths(state, unit, byHex, move = Infinity) {
  const maxCost = move === Infinity ? Infinity : move * PATH_SCALE + PATH_SCALE - 1;
  return cheapestPaths(unit.at, moveCostFor(state, unit, byHex), maxCost);
}

function canMove(state, unit) {
  const stats = unitStats(state, unit);
  return !unit.moved && !unit.acted && !unit.setUp && stats.move > 0;
}

// Destination hexes and their movement cost. Friendly units can be passed through but not
// stopped on.
export function reachableHexes(view, unitId) {
  const unit = view.units[unitId];
  if (!unit || !canMove(view, unit)) return {};
  const byHex = occupancy(view);
  const paths = plannedPaths(view, unit, byHex, unitStats(view, unit).move);
  const out = {};
  for (const k in paths) {
    if (k !== unit.at && !byHex[k]) out[k] = Math.floor(paths[k].cost / PATH_SCALE);
  }
  return out;
}

export function attackTargets(view, unitId) {
  const unit = view.units[unitId];
  if (!unit || unit.acted) return [];
  const stats = unitStats(view, unit);
  if (!stats.attack || !stats.range) return [];
  if (stats.needsSetup && !unit.setUp) return [];
  const [minRange, maxRange] = stats.range;
  const blocks = blocksSight(view);
  return Object.values(view.units)
    .filter((t) => t.owner !== unit.owner && view.visible[t.at])
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

export function canUnload(view, unitId) {
  const unit = view.units[unitId];
  if (!unit || unit.acted || unit.carrying <= 0) return false;
  const factory = view.units[view.players[unit.owner].factoryId];
  return Boolean(factory) && distance(unit.at, factory.at) === 1;
}

export function canSetUp(view, unitId) {
  const unit = view.units[unitId];
  return Boolean(unit) && !unit.acted && !unit.setUp && Boolean(unitStats(view, unit).needsSetup);
}

export function canPackUp(view, unitId) {
  const unit = view.units[unitId];
  return Boolean(unit) && !unit.acted && unit.setUp;
}

// Free hexes next to the player's factory where a new unit can be placed.
export function buildSites(view, player) {
  const factory = view.units[view.players[player].factoryId];
  if (!factory) return [];
  return neighbourKeys(factory.at).filter((k) =>
    view.map.hexes[k] &&
    terrainRules(view, k).moveCost !== null &&
    !unitAt(view, k) &&
    !view.crystals[k]);
}

export function buildableTypes(state) {
  return Object.keys(state.rules.units).filter((type) => state.rules.units[type].cost !== null);
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
  }
  const crystals = view.players[player].crystals;
  const sites = buildSites(view, player);
  for (const unitType of buildableTypes(view)) {
    if (view.rules.units[unitType].cost > crystals) continue;
    for (const at of sites) actions.push({ type: "build", unitType, at });
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
  build: applyBuild,
  endTurn: applyEndTurn,
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
// and logged actions, remembered crystal records and events are replaced rather than edited,
// so those are shared. A new state field that actions change must be copied here too; the
// tests check that applying actions never changes the input state.
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
    seenCrystals: { ...player.seenCrystals },
    seenFactory: player.seenFactory && { ...player.seenFactory },
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

// The path is planned on what the player knows. Walking it on the real board, the unit stops
// early at anything hidden in the way: an enemy unit, crystals or impassable ground.
function applyMove(state, { unitId, to }) {
  const unit = ownUnit(state, unitId);
  const view = viewFor(state, state.current);
  const destinations = reachableHexes(view, unitId);
  if (!(to in destinations)) illegal(`${unitId} cannot reach ${to}`);

  const planned = pathTo(plannedPaths(view, unit, occupancy(view)), to);
  const byHex = occupancy(state);
  const allowance = unitStats(state, unit).move;
  const from = unit.at;
  const walked = [];
  let spent = 0;
  let stoppedBy = null;
  for (const k of planned) {
    const cost = terrainRules(state, k).moveCost;
    const other = byHex[k];
    if (other && other.owner !== unit.owner) {
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
  // Never finish on a hex a friendly unit is passing through.
  while (walked.length && byHex[walked[walked.length - 1]]) walked.pop();

  unit.at = walked.length ? walked[walked.length - 1] : from;
  unit.moved = true;
  state.events.push({ type: "move", unitId, from, to: unit.at, path: walked, stoppedBy });

  // Driving onto or over crystals destroys them.
  if (state.rules.crystals.crushedByMovement) {
    for (const k of walked) {
      const pile = state.crystals[k];
      if (!pile) continue;
      delete state.crystals[k];
      state.events.push({ type: "crushed", unitId, at: k, amount: pile.amount });
    }
  }
}

function applyAttack(state, { unitId, targetId }) {
  const unit = ownUnit(state, unitId);
  const view = viewFor(state, state.current);
  if (!attackTargets(view, unitId).includes(targetId)) illegal(`${unitId} cannot attack`);
  const target = state.units[targetId];
  const attack = unitStats(state, unit).attack;
  finishAction(unit);
  state.events.push({ type: "fire", unitId, targetId, attack });
  hit(state, target, attack);

  // Return fire: a surviving target with a short range hits back at an adjacent attacker.
  const targetStats = unitStats(state, target);
  const returns =
    state.units[targetId] &&
    distance(unit.at, target.at) === 1 &&
    targetStats.attack > 0 &&
    targetStats.range &&
    targetStats.range[0] <= 1 &&
    targetStats.range[1] <= state.rules.combat.returnFireMaxRange &&
    (!targetStats.needsSetup || target.setUp);
  if (returns) {
    state.events.push({ type: "returnFire", unitId: targetId, targetId: unitId,
      attack: targetStats.attack });
    hit(state, unit, targetStats.attack);
  }
}

// Attacks on one unit within a turn add up. The total decides how many lives it has lost
// this turn: one at its defence, both at twice its defence.
function hit(state, target, amount) {
  const record = state.hits[target.id] || { total: 0, livesAtStart: target.lives };
  record.total += amount;
  state.hits[target.id] = record;

  const defence = defenceOf(state, target);
  const { loseOneLifeAt, loseTwoLivesAt } = state.rules.combat;
  let lost = 0;
  if (record.total >= loseTwoLivesAt * defence) lost = 2;
  else if (record.total >= loseOneLifeAt * defence) lost = 1;
  const lives = Math.min(target.lives, Math.max(0, record.livesAtStart - lost));
  state.events.push({ type: "hit", unitId: target.id, amount, total: record.total, defence,
    livesBefore: target.lives, livesAfter: lives });
  target.lives = lives;
  if (lives === 0) {
    delete state.units[target.id];
    delete state.hits[target.id];
    state.events.push({ type: "destroyed", unitId: target.id, unitType: target.type,
      owner: target.owner, at: target.at });
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
  const amount = Math.min(free, pile.amount, pile.perHarvest || Infinity);
  pile.amount -= amount;
  pile.harvestedThisRound = true;
  if (pile.amount <= 0) delete state.crystals[at];
  unit.carrying += amount;
  finishAction(unit);
  state.events.push({ type: "harvest", unitId, at, amount });
}

function applyUnload(state, { unitId }) {
  const unit = ownUnit(state, unitId);
  if (!canUnload(viewFor(state, state.current), unitId)) illegal(`${unitId} cannot unload`);
  state.players[unit.owner].crystals += unit.carrying;
  state.events.push({ type: "unload", unitId, amount: unit.carrying });
  unit.carrying = 0;
  finishAction(unit);
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
  if (!buildSites(state, player).includes(at)) illegal(`cannot build at ${at}`);
  state.players[player].crystals -= stats.cost;
  const unit = addUnit(state, unitType, player, at);
  finishAction(unit);
  state.events.push({ type: "build", unitId: unit.id, unitType, at });
}

function applyEndTurn(state) {
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
    unit.acted = false;
  }
}

// ---------------------------------------------------------------------------------------
// End of round: crystals grow and spawn

function endRound(state) {
  const rules = state.rules.crystals;
  for (const k in state.crystals) {
    const pile = state.crystals[k];
    if (pile.kind === "spawn" && !pile.harvestedThisRound) {
      pile.amount += rules.growthPerRound;
      if (rules.maxPile !== null) pile.amount = Math.min(pile.amount, rules.maxPile);
    }
    pile.harvestedThisRound = false;
  }
  for (let i = 0; i < rules.spawnPerRound; i++) spawnCrystals(state);

  state.round += 1;
  state.events.push({ type: "newRound", round: state.round });
  if (state.round > state.rules.roundCap) {
    state.result = { winner: null, reason: "roundCap", round: state.round };
  }
}

export function spawnSites(state) {
  const rules = state.rules.crystals;
  const factories = state.map.factories;
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
  state.crystals[at] = { kind: "spawn", amount, perHarvest: null, harvestedThisRound: false };
  state.events.push({ type: "spawn", at, amount });
}

// ---------------------------------------------------------------------------------------
// Winning

// A player loses when their factory is destroyed, or when they have no units left and cannot
// afford to build one.
function checkResult(state) {
  if (state.result) return;
  const cheapest = Math.min(
    ...buildableTypes(state).map((type) => state.rules.units[type].cost));
  const losers = state.players
    .map((player, p) => {
      if (!state.units[player.factoryId]) return { p, reason: "factoryDestroyed" };
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
