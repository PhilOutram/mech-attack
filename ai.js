// Simple rule-based AI opponent. It sees only the fog-of-war view of its own player and picks
// one action at a time through the engine's public functions; call it repeatedly until it
// returns endTurn. Priorities, in order: profitable attacks, healing, unloading, harvesting,
// building, artillery set-up, then moving each unit towards its current goal.
import {
  reachableHexes, attackTargets, healTargets, harvestTargets, canUnload, canSetUp, canPackUp,
  buildSites, unitStats, unitsOf, defenceOf, applyAction, viewFor,
} from "./engine.js?v=0.02";
import { neighbourKeys, distance } from "./hex.js?v=0.02";

// Worth of one life of the enemy factory, compared with unit costs in crystals.
const FACTORY_LIFE_VALUE = 200;
// Extra worth of destroying a unit outright, as a share of its cost.
const KILL_BONUS_SHARE = 0.5;
// Score for an attack that costs no life now but sets up a combined attack this turn.
const SETUP_ATTACK_SCORE = 1;
// Harvesters wanted early on, and the most wanted once crystals are plentiful.
const HARVESTERS_EARLY = 2;
const HARVESTERS_MAX = 3;
const KNOWN_PILES_FOR_EXTRA_HARVESTER = 3;
// Target share of each combat unit type in the army.
const ARMY_MIX = { tank: 0.4, heavyCannon: 0.2, artillery: 0.2, scoutBike: 0.1, lightMedic: 0.1 };
// Medics are only bought once the army has this many combat units.
const ARMY_SIZE_FOR_MEDIC = 3;
// Enemy units this close to the AI's factory are dealt with first.
const HOME_DEFENCE_RADIUS = 5;
// Harvesters steer clear of hexes this close to visible enemy fighters.
const HARVESTER_DANGER_RADIUS = 2;
const DANGER_PENALTY = 4;
// Preferred closest firing distance for units with longer range, to avoid return fire.
const STAND_OFF_DISTANCE = 2;
// Units with nothing to unload are pushed off the hexes next to their own factory, which
// are needed for unloading and building.
const FACTORY_CLEAR_PENALTY = 3;
// Stopping on crystals destroys them, so the AI avoids it unless nothing else gets closer.
const CRUSH_PENALTY = 2;
// Once the map is explored, scouts watch the enemy factory from this far away so that
// artillery and other units can see it.
const SCOUT_WATCH_DISTANCE = 3;

export function chooseAction(view) {
  const ctx = context(view);
  return (
    bestAttack(ctx) ||
    firstHeal(ctx) ||
    firstUnload(ctx) ||
    bestHarvest(ctx) ||
    bestBuild(ctx) ||
    artilleryDrill(ctx) ||
    bestMove(ctx) ||
    { type: "endTurn" }
  );
}

// Plays a whole turn for the current player: repeatedly asks for an action and applies it.
export function playTurn(state, maxActions = 500) {
  const player = state.current;
  for (let i = 0; i < maxActions; i++) {
    const action = chooseAction(viewFor(state, player));
    state = applyAction(state, action);
    if (action.type === "endTurn" || state.result) return state;
  }
  throw new Error(`AI did not finish its turn within ${maxActions} actions`);
}

function context(view) {
  const me = view.viewer;
  const mine = unitsOf(view, me);
  const enemies = unitsOf(view, 1 - me);
  const isFighter = (u) => unitStats(view, u).attack > 0;
  return {
    view,
    me,
    mine,
    army: mine.filter((u) => !unitStats(view, u).isFactory),
    enemies,
    enemyFighters: enemies.filter(isFighter),
    myFactory: view.units[view.players[me].factoryId],
    enemyFactorySite: view.map.factories[1 - me],
  };
}

// ---------------------------------------------------------------------------------------
// Attacks

function lifeValue(view, unit) {
  const stats = unitStats(view, unit);
  return stats.isFactory ? FACTORY_LIFE_VALUE : stats.cost / view.rules.lives;
}

// Lives the target would have after taking extra damage this turn.
function livesAfter(view, target, extra) {
  const record = view.hits[target.id] || { total: 0, livesAtStart: target.lives };
  const total = record.total + extra;
  const defence = defenceOf(view, target);
  const { loseOneLifeAt, loseTwoLivesAt } = view.rules.combat;
  let lost = 0;
  if (total >= loseTwoLivesAt * defence) lost = 2;
  else if (total >= loseOneLifeAt * defence) lost = 1;
  return { lives: Math.min(target.lives, Math.max(0, record.livesAtStart - lost)), total };
}

function returnFireLoss(view, attacker, target) {
  const stats = unitStats(view, target);
  const returns = distance(attacker.at, target.at) === 1 && stats.attack > 0 && stats.range &&
    stats.range[0] <= 1 && stats.range[1] <= view.rules.combat.returnFireMaxRange;
  if (!returns) return 0;
  const after = livesAfter(view, attacker, stats.attack);
  return (attacker.lives - after.lives) * lifeValue(view, attacker);
}

function bestAttack({ view, mine }) {
  const options = [];
  const ready = {};
  for (const unit of mine) {
    for (const targetId of attackTargets(view, unit.id)) {
      options.push({ unit, target: view.units[targetId] });
      ready[targetId] = (ready[targetId] || 0) + unitStats(view, unit).attack;
    }
  }
  let best = null;
  let bestScore = 0;
  for (const { unit, target } of options) {
    const attack = unitStats(view, unit).attack;
    const after = livesAfter(view, target, attack);
    const livesLost = target.lives - after.lives;
    let score = livesLost * lifeValue(view, target);
    if (after.lives === 0 && !unitStats(view, target).isFactory) {
      score += KILL_BONUS_SHARE * unitStats(view, target).cost;
    }
    if (livesLost === 0) {
      // Worth starting only if everything ready to fire at it this turn can take a life.
      const combined = livesAfter(view, target, ready[target.id]);
      if (combined.lives < target.lives) score = SETUP_ATTACK_SCORE;
    }
    if (after.lives > 0) score -= returnFireLoss(view, unit, target);
    if (score > bestScore) {
      bestScore = score;
      best = { type: "attack", unitId: unit.id, targetId: target.id };
    }
  }
  return best;
}

// ---------------------------------------------------------------------------------------
// Healing, unloading, harvesting

function firstHeal({ view, mine }) {
  for (const unit of mine) {
    const targets = healTargets(view, unit.id);
    if (targets.length) return { type: "heal", unitId: unit.id, targetId: targets[0] };
  }
  return null;
}

function firstUnload({ view, mine }) {
  const unit = mine.find((u) => canUnload(view, u.id));
  return unit ? { type: "unload", unitId: unit.id } : null;
}

function isHarvester(view, unit) {
  return unit.type === "lightHarvester";
}

// Scouts only gather crystals when there is no harvester to do it.
function gatherers({ view, army }) {
  const harvesters = army.filter((u) => isHarvester(view, u));
  return harvesters.length ? harvesters : army.filter((u) => unitStats(view, u).storage > 0);
}

function bestHarvest(ctx) {
  const { view } = ctx;
  for (const unit of gatherers(ctx)) {
    const piles = harvestTargets(view, unit.id);
    if (!piles.length) continue;
    const at = piles.reduce((a, b) => (view.crystals[b].amount > view.crystals[a].amount ? b : a));
    return { type: "harvest", unitId: unit.id, at };
  }
  return null;
}

// ---------------------------------------------------------------------------------------
// Building

function wantedUnitType({ view, me, army }) {
  const harvesters = army.filter((u) => isHarvester(view, u)).length;
  const knownPiles = Object.keys(view.crystals).length;
  const harvestersWanted =
    knownPiles >= KNOWN_PILES_FOR_EXTRA_HARVESTER ? HARVESTERS_MAX : HARVESTERS_EARLY;
  if (harvesters < harvestersWanted) {
    // With no income at all, buy the cheapest unit that can carry crystals rather than
    // saving for a harvester that may never be affordable.
    const crystals = view.players[me].crystals;
    const canGather = army.some((u) => unitStats(view, u).storage > 0);
    const harvesterCost = view.rules.units.lightHarvester.cost;
    if (!canGather && crystals < harvesterCost) return cheapestGatherer(view, crystals);
    return "lightHarvester";
  }

  const fighters = army.filter((u) => ARMY_MIX[u.type] !== undefined);
  let best = null;
  let bestGap = -Infinity;
  for (const type in ARMY_MIX) {
    if (type === "lightMedic" && fighters.length < ARMY_SIZE_FOR_MEDIC) continue;
    const share = fighters.filter((u) => u.type === type).length / (fighters.length || 1);
    const gap = ARMY_MIX[type] - share;
    if (gap > bestGap) {
      bestGap = gap;
      best = type;
    }
  }
  return best;
}

function cheapestGatherer(view, crystals) {
  const types = Object.keys(view.rules.units).filter((type) => {
    const stats = view.rules.units[type];
    return stats.storage > 0 && stats.cost !== null && stats.cost <= crystals;
  });
  return types.sort((a, b) => view.rules.units[a].cost - view.rules.units[b].cost)[0] || null;
}

function bestBuild(ctx) {
  const { view, me, myFactory, enemyFactorySite } = ctx;
  if (!myFactory) return null;
  const type = wantedUnitType(ctx);
  if (!type || view.rules.units[type].cost > view.players[me].crystals) return null;
  const sites = buildSites(view, me);
  if (!sites.length) return null;
  const towards = type === "lightHarvester" ? nearestPile(view, myFactory.at) : enemyFactorySite;
  const at = towards
    ? sites.reduce((a, b) => (distance(b, towards) < distance(a, towards) ? b : a))
    : sites[0];
  return { type: "build", unitType: type, at };
}

function nearestPile(view, from) {
  let best = null;
  for (const k in view.crystals) if (!best || distance(from, k) < distance(from, best)) best = k;
  return best;
}

// ---------------------------------------------------------------------------------------
// Artillery

// Artillery sets up when it can see a target in range, and packs up to move on when it
// cannot or when an enemy fighter is next to it.
function artilleryDrill(ctx) {
  const { view, mine } = ctx;
  for (const unit of mine) {
    const stats = unitStats(view, unit);
    if (!stats.needsSetup) continue;
    const [minRange, maxRange] = stats.range;
    const inRange = ctx.enemies.some((e) => {
      const d = distance(unit.at, e.at);
      return view.visible[e.at] && d >= minRange && d <= maxRange;
    });
    const threatened = ctx.enemyFighters.some((e) => distance(unit.at, e.at) <= 1);
    if (canSetUp(view, unit.id) && inRange && !threatened) {
      return { type: "setUp", unitId: unit.id };
    }
    if (canPackUp(view, unit.id) && (!inRange || threatened)) {
      return { type: "packUp", unitId: unit.id };
    }
  }
  return null;
}

// ---------------------------------------------------------------------------------------
// Movement

// Cost of entering each hex as the AI knows it. Unexplored hexes count as plain.
function entryCost(view, k) {
  if (!view.map.hexes[k]) return null;
  const terrain = view.map.hexes[k].terrain || "plain";
  return view.rules.terrain[terrain].moveCost;
}

// Movement cost from every hex to the nearest goal hex, ignoring units.
function distanceField(view, goals) {
  const field = {};
  const open = [];
  for (const g of goals) {
    if (entryCost(view, g) === null || field[g] === 0) continue;
    field[g] = 0;
    open.push(g);
  }
  while (open.length) {
    let best = 0;
    for (let i = 1; i < open.length; i++) if (field[open[i]] < field[open[best]]) best = i;
    const current = open.splice(best, 1)[0];
    const step = entryCost(view, current);
    for (const next of neighbourKeys(current)) {
      if (entryCost(view, next) === null) continue;
      const cost = field[current] + step;
      if (field[next] !== undefined && field[next] <= cost) continue;
      if (field[next] === undefined) open.push(next);
      field[next] = cost;
    }
  }
  return field;
}

function hexesAround(view, centre, minDistance, maxDistance) {
  return Object.keys(view.map.hexes).filter((k) => {
    const d = distance(centre, k);
    return d >= minDistance && d <= maxDistance;
  });
}

function dangerAt(ctx, k) {
  const close = ctx.enemyFighters.some((e) => distance(e.at, k) <= HARVESTER_DANGER_RADIUS);
  return close ? DANGER_PENALTY : 0;
}

// Goal hexes for a unit this turn, or null to stay put.
function goalsFor(ctx, unit, claimedPiles) {
  const { view, myFactory } = ctx;
  const stats = unitStats(view, unit);

  if (stats.storage > 0 && gatherers(ctx).includes(unit)) {
    const full = unit.carrying >= stats.storage;
    const pile = full ? null : choosePile(ctx, unit, claimedPiles);
    if (pile) {
      claimedPiles.add(pile);
      return neighbourKeys(pile);
    }
    if (unit.carrying > 0 && myFactory) return neighbourKeys(myFactory.at);
  }

  if (unit.type === "scoutBike") {
    const unexplored = Object.keys(view.map.hexes).filter((k) => !view.map.hexes[k].terrain);
    if (unexplored.length) return unexplored;
    return hexesAround(view, ctx.enemyFactorySite, SCOUT_WATCH_DISTANCE, SCOUT_WATCH_DISTANCE);
  }

  if (stats.healing) {
    const hurt = ctx.army.filter((u) => u.lives < view.rules.lives &&
      unitStats(view, u).defence <= stats.healing && u.id !== unit.id);
    if (hurt.length) return hurt.flatMap((u) => neighbourKeys(u.at));
    const escort = ctx.army.filter((u) => ARMY_MIX[u.type] && u.type !== "lightMedic");
    return escort.flatMap((u) => neighbourKeys(u.at));
  }

  if (stats.attack > 0 && stats.range) return attackGoals(ctx, unit, stats);
  return null;
}

function choosePile({ view, enemyFighters }, unit, claimedPiles) {
  let best = null;
  let bestScore = 0;
  const free = unitStats(view, unit).storage - unit.carrying;
  for (const k in view.crystals) {
    if (claimedPiles.has(k)) continue;
    if (enemyFighters.some((e) => distance(e.at, k) <= HARVESTER_DANGER_RADIUS)) continue;
    const pile = view.crystals[k];
    const take = Math.min(free, pile.amount, pile.perHarvest || Infinity);
    const score = take / (distance(unit.at, k) + 1);
    if (score > bestScore) {
      bestScore = score;
      best = k;
    }
  }
  return best;
}

// Hexes from which the unit could fire at its chosen target: enemies near home first, then
// the weakest visible enemy, then the enemy factory.
function attackGoals(ctx, unit, stats) {
  const { view, myFactory, enemies, enemyFactorySite } = ctx;
  const [minRange, maxRange] = stats.range;
  const nearHome = myFactory
    ? enemies.filter((e) => distance(e.at, myFactory.at) <= HOME_DEFENCE_RADIUS)
    : [];
  const pool = nearHome.length ? nearHome : enemies.filter((e) => !unitStats(view, e).isFactory);
  let target = null;
  let bestScore = -Infinity;
  for (const enemy of pool) {
    const toughness = defenceOf(view, enemy) * enemy.lives;
    const score = lifeValue(view, enemy) / toughness - distance(unit.at, enemy.at) / 10;
    if (score > bestScore) {
      bestScore = score;
      target = enemy.at;
    }
  }
  target = target || enemyFactorySite;
  const closest = maxRange >= STAND_OFF_DISTANCE ? Math.max(minRange, STAND_OFF_DISTANCE) : minRange;
  return hexesAround(view, target, closest, maxRange);
}

function bestMove(ctx) {
  const { view } = ctx;
  const claimedPiles = new Set();
  // Gatherers first so they claim piles in a stable order, then everyone else.
  const order = [...ctx.army].sort((a, b) =>
    Number(!gatherers(ctx).includes(a)) - Number(!gatherers(ctx).includes(b)));
  for (const unit of order) {
    const goals = goalsFor(ctx, unit, claimedPiles);
    if (!goals || !goals.length) continue;
    const reach = reachableHexes(view, unit.id);
    if (!Object.keys(reach).length) continue;
    const field = distanceField(view, goals);
    const careful = gatherers(ctx).includes(unit);
    const unloading = careful && unit.carrying > 0;
    const factoryAt = ctx.myFactory && ctx.myFactory.at;
    const crowding = (k) =>
      !unloading && factoryAt && distance(k, factoryAt) === 1 ? FACTORY_CLEAR_PENALTY : 0;
    const crushing = (k) => (view.crystals[k] ? CRUSH_PENALTY : 0);
    const score = (k) => (field[k] === undefined ? Infinity : field[k]) +
      (careful ? dangerAt(ctx, k) : 0) + crowding(k) + crushing(k);
    let best = null;
    let bestScore = score(unit.at);
    for (const k in reach) {
      const s = score(k);
      if (s < bestScore) {
        bestScore = s;
        best = k;
      }
    }
    if (best) return { type: "move", unitId: unit.id, to: best };
  }
  return null;
}
