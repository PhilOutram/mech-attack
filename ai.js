// Rule-based AI opponent driven by a personality. It sees only the fog-of-war view of its own
// player and picks one action at a time through the engine's public functions; call it
// repeatedly until it returns endTurn. Priorities, in order: profitable attacks, healing,
// unloading, harvesting, building, artillery set-up, then moving each unit towards its goal.
//
// A personality is a set of numbers ("genes") that tune those decisions: what to build, how
// many harvesters to keep, how cautious to be, how far to defend home. DEFAULT_PERSONALITY is
// the hand-tuned AI. randomPersonality and mutatePersonality make new ones within
// PERSONALITY_RANGES, so evolve.js can breed personalities that win more often.
import {
  reachableHexes, attackTargets, healTargets, harvestTargets, canUnload, canSetUp, canPackUp,
  buildSites, unitStats, unitsOf, defenceOf, livesAfterHit, firesBack, canHit, applyAction,
  viewFor, factoriesOf, factoryBuilds, upgradeOptions, canCapture, dropSites, unitAllowed,
  canBoard, allied, crystalTargets, boomHexes,
} from "./engine.js?v=0.64";
import { neighbourKeys, distance } from "./hex.js?v=0.64";
import { COUNTERS } from "./counters.js?v=0.64";

// Harvesters wanted once this many crystal piles are known.
const KNOWN_PILES_FOR_EXTRA_HARVESTER = 3;
// Units with nothing to unload are pushed off the hexes next to their own factory, which
// are needed for unloading and building; units that cannot capture are pushed off the hexes
// next to a factory their side means to overrun, which its Infantry need.
const FACTORY_CLEAR_PENALTY = 3;
// Stopping on crystals destroys them, so the AI avoids it unless nothing else gets closer.
const CRUSH_PENALTY = 2;
// Units that explore the map, then watch the enemy factory. A scout that can fight turns to
// enemies it can see within this many hexes.
const SCOUT_TYPES = ["scoutBike", "spotterDrone"];
const SCOUT_ENGAGE_RANGE = 6;
// A counter is built only if it scores at least this against what the enemy fields (the
// measured table in counters.js runs from -1 to +1).
const COUNTER_MIN_SCORE = 0.3;
// Patience below this means: if the wanted unit is too dear, buy the best affordable one.
const PATIENCE_THRESHOLD = 0.5;
// How far a mutation moves a gene, as a share of its range.
const MUTATION_SCALE = 0.2;
// transportInfantry above this means: carry infantry in a transporter rather than walk.
const TRANSPORT_THRESHOLD = 0.5;
// Infantry this close to their target factory walk there even when a transporter is about.
const INFANTRY_WALK_DISTANCE = 4;
const INFANTRY_TYPE = "infantry";
const TRANSPORTER_TYPE = "transporter";
const LAB_UPGRADE = "lab";

// The army units a personality chooses between, with the hand-tuned build shares.
export const DEFAULT_PERSONALITY = {
  mix: {
    tank: 0.25, heavyCannon: 0.1, artillery: 0.1, blastCannon: 0.1, sonicTank: 0.1,
    scoutBike: 0.1, spotterDrone: 0.05, attackHelicopter: 0.15, fighter: 0,
    antiAircraftJeep: 0, lightMedic: 0.05, turret: 0.05, heavyTank: 0.05,
    twinTurret: 0.05,
  },
  harvestersEarly: 2,
  harvestersMax: 3,
  // Value of counters it keeps against the enemy units it can see, as a share of their value.
  // Counters come from the measured table in counters.js (tools/matchups.mjs).
  counterWeight: 1,
  // How strongly each kind of want competes when choosing what to build: an answer to what
  // it sees, Infantry for capturing, its own army mix. These defaults keep that order.
  counterPriority: 0.7,
  capturePriority: 0.6,
  armyPriority: 0.5,
  // Worth of one life of the enemy factory, in crystals (when factories take fire), and of
  // killing infantry about to overrun one of its own factories.
  factoryLifeValue: 200,
  killBonusShare: 0.5, // extra worth of destroying a unit outright, as a share of its cost
  returnFireCaution: 1, // how much expected return-fire losses count against an attack
  homeDefenceRadius: 5, // enemy units this close to the factory are dealt with first
  standOff: 2, // preferred closest firing distance for longer-range units
  harvesterDangerRadius: 2, // harvesters keep this far from visible enemy fighters
  dangerPenalty: 4,
  scoutWatchDistance: 3, // scouts watch the enemy factory from this far away
  armySizeForMedic: 3, // medics only once the army has this many fighting units
  patience: 1, // 1 = save up for the wanted unit; 0 = buy something affordable now
  captureFactories: 1, // infantry kept while there are factories to capture
  transportInfantry: 0.3, // above TRANSPORT_THRESHOLD, infantry ride in a transporter
  labs: 1, // factories it fits with a Crystal lab, once its first harvesters are out
  wreckPiles: 0.5, // keenness to blow up crystal piles on the enemy's side of the map
  // With more than one opponent, which to go for (its home factory is the army's goal):
  // how much nearness, weakness (what it has been seen to own; below 0, the AI goes for the
  // strongest instead, to stop it running away with the game) and threat (its fighters near
  // the AI's factories) count.
  targetNearness: 1,
  targetWeakness: 1,
  targetThreat: 1,
};

// Allowed range of each gene: [lowest, highest, whole number?]. Every mix share is 0 to 1.
export const PERSONALITY_RANGES = {
  harvestersEarly: [1, 3, true],
  harvestersMax: [1, 5, true],
  counterWeight: [0, 2, false],
  counterPriority: [0, 1, false],
  capturePriority: [0, 1, false],
  armyPriority: [0, 1, false],
  factoryLifeValue: [50, 400, false],
  killBonusShare: [0, 1, false],
  returnFireCaution: [0, 2, false],
  homeDefenceRadius: [2, 8, true],
  standOff: [1, 3, true],
  harvesterDangerRadius: [0, 4, true],
  dangerPenalty: [0, 8, false],
  scoutWatchDistance: [2, 5, true],
  armySizeForMedic: [1, 6, true],
  patience: [0, 1, false],
  captureFactories: [0, 3, true],
  transportInfantry: [0, 1, false],
  labs: [0, 2, true],
  wreckPiles: [0, 1, false],
  targetNearness: [0, 2, false],
  targetWeakness: [-1, 2, false],
  targetThreat: [0, 2, false],
};
const MIX_RANGE = [0, 1, false];

function clampGene([low, high, whole], value) {
  const v = Math.min(high, Math.max(low, value));
  return whole ? Math.round(v) : v;
}

function randomGene([low, high, whole], random) {
  return clampGene([low, high, whole], low + random() * (high - low));
}

// A personality may also name transportType: the unit it carries infantry in (the
// Transporter if not given; the simulator's unit trials set the Chinook).

// A personality with every gene drawn at random within its range.
export function randomPersonality(random) {
  const p = { mix: {} };
  for (const type in DEFAULT_PERSONALITY.mix) p.mix[type] = randomGene(MIX_RANGE, random);
  for (const gene in PERSONALITY_RANGES) p[gene] = randomGene(PERSONALITY_RANGES[gene], random);
  p.harvestersMax = Math.max(p.harvestersMax, p.harvestersEarly);
  return p;
}

// A copy of a personality with some genes nudged: each gene changes with chance rate, by up
// to MUTATION_SCALE of its range either way.
export function mutatePersonality(parent, random, rate) {
  const nudge = (range, value) =>
    random() < rate ? clampGene(range, value + (random() * 2 - 1) * MUTATION_SCALE *
      (range[1] - range[0])) : value;
  const p = { mix: {} };
  for (const type in parent.mix) p.mix[type] = nudge(MIX_RANGE, parent.mix[type]);
  for (const gene in PERSONALITY_RANGES) {
    p[gene] = nudge(PERSONALITY_RANGES[gene], parent[gene] ?? DEFAULT_PERSONALITY[gene]);
  }
  p.harvestersMax = Math.max(p.harvestersMax, p.harvestersEarly);
  if (parent.transportType) p.transportType = parent.transportType;
  return p;
}

// A child taking each gene from one parent or the other.
export function crossPersonalities(a, b, random) {
  const pickOne = (x, y) => (random() < 0.5 ? x : y);
  const p = { mix: {} };
  for (const type in a.mix) p.mix[type] = pickOne(a.mix[type], b.mix[type]);
  for (const gene in PERSONALITY_RANGES) {
    p[gene] = pickOne(a[gene] ?? DEFAULT_PERSONALITY[gene], b[gene] ?? DEFAULT_PERSONALITY[gene]);
  }
  p.harvestersMax = Math.max(p.harvestersMax, p.harvestersEarly);
  return p;
}

// The units a personality builds most, as shares of its army, highest first.
export function favouriteUnits(personality, count = 3) {
  const total = Object.values(personality.mix).reduce((s, w) => s + w, 0) || 1;
  return Object.entries(personality.mix)
    .map(([type, w]) => [type, w / total])
    .sort((x, y) => y[1] - x[1])
    .slice(0, count);
}

// counters: the table of which units beat which (counters.js); tests can pass their own.
export function chooseAction(view, personality = DEFAULT_PERSONALITY, counters = COUNTERS) {
  const ctx = context(view, personality, counters);
  return (
    bestAttack(ctx) ||
    firstHeal(ctx) ||
    firstUnload(ctx) ||
    captureDrop(ctx) ||
    bestHarvest(ctx) ||
    wreckPile(ctx) ||
    labUpgrade(ctx) ||
    bestBuild(ctx) ||
    artilleryDrill(ctx) ||
    bestMove(ctx) ||
    { type: "endTurn" }
  );
}

// Plays a whole turn for the current player: repeatedly asks for an action and applies it.
export function playTurn(state, personality = DEFAULT_PERSONALITY, maxActions = 500) {
  const player = state.current;
  for (let i = 0; i < maxActions; i++) {
    const action = chooseAction(viewFor(state, player), personality);
    state = applyAction(state, action);
    if (action.type === "endTurn" || state.result) return state;
  }
  throw new Error(`AI did not finish its turn within ${maxActions} actions`);
}

// ---------------------------------------------------------------------------------------
// Judging its chances (for Demand surrender)

// Extra rounds a playout runs before it is judged on what each side owns.
const PLAYOUT_ROUNDS = 30;
// How much each playout varies the players' personalities, so playouts differ.
const PLAYOUT_VARIATION = 0.3;

// What a side owns: crystals, crystals being carried, the cost of its units (and of any
// infantry they carry) and of its factory upgrades.
function worth(state, player) {
  const cost = (u) => unitStats(state, u).cost;
  const upgrades = factoriesOf(state, player).flatMap((f) => f.upgrades)
    .reduce((sum, u) => sum + state.rules.factoryUpgrades[u].cost, 0);
  const army = unitsOf(state, player).filter((u) => !unitStats(state, u).isFactory);
  return state.players[player].crystals + upgrades + army.reduce((sum, u) =>
    sum + u.carrying + cost(u) + (u.cargo || []).reduce((s, c) => s + cost(c), 0), 0);
}

// Plays the game on from the current position once and scores it for player: 1 for a win,
// 0 for a loss, and an unfinished game by player's share of what both sides own. It uses the
// whole board, not just what the player can see. personalities: one for each player; random
// varies them a little each time and drives new crystal spawns. rounds: how many rounds it
// runs before it is judged.
export function playout(state, player, personalities, random, rounds = PLAYOUT_ROUNDS) {
  const vary = (p) => mutatePersonality(p, random, PLAYOUT_VARIATION);
  const players = personalities.map(vary);
  let s = {
    ...state,
    rng: Math.floor(random() * 2 ** 31),
    actions: null,
    rules: { ...state.rules, roundCap: state.round + rounds },
  };
  while (!s.result) s = applyAction(s, chooseAction(viewFor(s, s.current), players[s.current]));
  const { winner } = s.result;
  if (winner !== null) return allied(s, winner, player) ? 1 : 0;
  const sides = s.players.map((_, p) => p);
  const mine = sides.filter((p) => allied(s, p, player)).reduce((t, p) => t + worth(s, p), 0);
  const theirs = sides.filter((p) => !allied(s, p, player)).reduce((t, p) => t + worth(s, p), 0);
  return mine + theirs > 0 ? mine / (mine + theirs) : 0.5;
}

// How far apart two homes are, and how much a seen army is worth, in the units the target
// score adds up (so one step of distance or this many crystals counts as much as one enemy
// fighter near home).
const TARGET_DISTANCE_SCALE = 5;
const TARGET_WORTH_SCALE = 100;

// The opponent to go for, of those still in the game: by nearness of its home, weakness
// (the cost of its units the AI can see) and the threat its fighters pose to the AI's
// factories, weighed by the personality. With one opponent, that one.
function targetOpponent(view, me, enemies, myFactories, p) {
  const opponents = view.players.map((_, o) => o)
    .filter((o) => !allied(view, o, me) && !view.players[o].out);
  if (opponents.length <= 1) return opponents[0] ?? null;
  const home = view.map.factories[me];
  const score = (o) => {
    const theirs = enemies.filter((u) => u.owner === o && !unitStats(view, u).isFactory);
    const worthSeen = theirs.reduce((t, u) => t + unitStats(view, u).cost, 0);
    const threat = theirs.filter((u) => unitStats(view, u).attack > 0 && myFactories
      .some((f) => distance(f.at, u.at) <= p.homeDefenceRadius)).length;
    return p.targetThreat * threat -
      p.targetNearness * distance(home, view.map.factories[o]) / TARGET_DISTANCE_SCALE -
      p.targetWeakness * worthSeen / TARGET_WORTH_SCALE;
  };
  return opponents.reduce((best, o) => (score(o) > score(best) ? o : best));
}

function context(view, personality, counters = COUNTERS) {
  const me = view.viewer;
  const mine = unitsOf(view, me);
  // Everyone not on the AI's team is an enemy.
  const enemies = Object.values(view.units).filter((u) =>
    u.owner !== null && !allied(view, u.owner, me));
  const isFighter = (u) => unitStats(view, u).attack > 0;
  const myFactories = factoriesOf(view, me);
  const target = targetOpponent(view, me, enemies, myFactories, personality);
  return {
    view,
    p: personality,
    counters,
    me,
    mine,
    army: mine.filter((u) => !unitStats(view, u).isFactory),
    enemies,
    enemyFighters: enemies.filter(isFighter),
    myFactory: view.units[view.players[me].factoryId],
    myFactories,
    enemyFactorySite: target === null ? null : view.map.factories[target],
  };
}

// Hexes of factories infantry could capture: unused factory sites not yet ours, and other
// factories the AI knows of that infantry may enter.
function captureSites(ctx) {
  const { view, me } = ctx;
  const sites = new Set(view.map.neutralFactories.map((f) => f.at));
  for (const unit of Object.values(view.units)) {
    if (!unitStats(view, unit).isFactory) continue;
    if (unit.owner === me) sites.delete(unit.at);
    else if (canCapture(view, { type: INFANTRY_TYPE, owner: me }, unit)) sites.add(unit.at);
  }
  return [...sites];
}

// Infantry on the board and inside transporters.
function infantryCount(ctx) {
  return ctx.army.reduce((n, u) => n + (u.type === INFANTRY_TYPE ? 1 : 0) +
    (u.cargo || []).filter((c) => c.type === INFANTRY_TYPE).length, 0);
}

function isCarrier(view, unit) {
  return Boolean(unitStats(view, unit).carries);
}

function isCombatUnit(p, unit) {
  return p.mix[unit.type] !== undefined;
}

// ---------------------------------------------------------------------------------------
// Attacks

function lifeValue(ctx, unit) {
  const stats = unitStats(ctx.view, unit);
  return stats.isFactory ? ctx.p.factoryLifeValue : stats.cost / ctx.view.rules.lives;
}

// What a hit of amount on target is worth: the lives it takes, plus a bonus for destroying it
// (more for Infantry about to overrun one of the AI's factories), plus the crystals it is
// carrying, which are lost with it.
function hitValue(ctx, target, amount) {
  const { view, p } = ctx;
  const after = livesAfterHit(view, target, amount);
  let value = (target.lives - after.lives) * lifeValue(ctx, target);
  if (after.lives === 0 && !unitStats(view, target).isFactory) {
    value += p.killBonusShare * unitStats(view, target).cost + (target.carrying || 0);
    if (threatensFactory(ctx, target)) value += p.factoryLifeValue;
  }
  return value;
}

// Other enemies an attack on target would hit, with how hard: next to the target for a
// cluster bomb, along the same line for a sonic boom.
function alsoHit(ctx, unit, target) {
  const { view } = ctx;
  const stats = unitStats(view, unit);
  const hit = (other) => other.id !== target.id && canHit(view, unit, other) &&
    !unitStats(view, other).isFactory;
  if (stats.splash) {
    const amount = Math.floor(stats.attack * stats.splash);
    return ctx.enemies.filter((e) => distance(e.at, target.at) === 1 && hit(e))
      .map((e) => [e, amount]);
  }
  if (stats.line) {
    const path = new Set(boomHexes(view, unit.at, target.at, stats.range[1]));
    return ctx.enemies.filter((e) => hit(e) && path.has(e.at)).map((e) => [e, stats.attack]);
  }
  return [];
}

function threatensFactory(ctx, unit) {
  return Boolean(unitStats(ctx.view, unit).captures) &&
    ctx.myFactories.some((f) => distance(f.at, unit.at) === 1);
}

// What a combined attack on target is expected to lose to return fire: every shooter it fires
// back at, which may be only the first few when combat.returnFirePerTurn limits it.
function combinedReturnFireLoss(ctx, shooters, target) {
  const losses = shooters.map((s) => returnFireLoss(ctx, s, target)).sort((a, b) => b - a);
  const limit = ctx.view.rules.combat.returnFirePerTurn;
  const firedBack = (ctx.view.hits[target.id] || {}).firedBack || 0;
  const count = limit === null || limit === undefined ? losses.length
    : Math.max(0, limit - firedBack);
  return losses.slice(0, count).reduce((sum, loss) => sum + loss, 0);
}

function returnFireLoss(ctx, attacker, target) {
  if (!firesBack(ctx.view, attacker, target)) return 0;
  const after = livesAfterHit(ctx.view, attacker, unitStats(ctx.view, target).attack);
  return (attacker.lives - after.lives) * lifeValue(ctx, attacker) * ctx.p.returnFireCaution;
}

function bestAttack(ctx) {
  const { view, mine } = ctx;
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
    let score = hitValue(ctx, target, attack);
    // A cluster bomb or sonic boom also hits other enemies.
    for (const [other, amount] of alsoHit(ctx, unit, target)) {
      score += hitValue(ctx, other, amount);
    }
    if (score > 0) {
      score -= returnFireLoss(ctx, unit, target);
    } else {
      // A shot that does nothing on its own can start a combined attack: worth it if what
      // every unit ready to fire at the target does together outweighs all they would lose to
      // return fire. Each shot of the plan carries an equal share of its worth.
      const shooters = options.filter((o) => o.target.id === target.id).map((o) => o.unit);
      score = (hitValue(ctx, target, ready[target.id]) -
        combinedReturnFireLoss(ctx, shooters, target)) / shooters.length;
    }
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

// A transporter next to a factory its infantry can capture drops them straight into it, or
// next to it when they may not go straight in. With nothing left to capture, passengers get
// out to fight.
function captureDrop(ctx) {
  const { view, mine } = ctx;
  const targets = captureSites(ctx);
  for (const unit of mine) {
    const sites = dropSites(view, unit.id);
    const at = sites.find((k) => targets.includes(k)) ||
      sites.find((k) => targets.some((t) => distance(t, k) === 1)) ||
      (!targets.length && sites[0]);
    if (at) return { type: "drop", unitId: unit.id, at };
  }
  return null;
}

function isHarvester(unit) {
  return unit.type === "lightHarvester";
}

// Scouts only gather crystals when there is no harvester to do it.
function gatherers({ view, army }) {
  const harvesters = army.filter(isHarvester);
  return harvesters.length ? harvesters : army.filter((u) => unitStats(view, u).storage > 0);
}

function bestHarvest(ctx) {
  const { view } = ctx;
  for (const unit of gatherers(ctx)) {
    const piles = harvestTargets(view, unit.id);
    if (!piles.length) continue;
    const amount = (k) => view.crystals[k].amount;
    const at = piles.reduce((a, b) => (amount(b) > amount(a) ? b : a));
    return { type: "harvest", unitId: unit.id, at };
  }
  return null;
}

// ---------------------------------------------------------------------------------------
// Starving the enemy

// A pile is blown up only if its crystals, weighted by the wreckPiles gene, come to more
// than this.
const WRECK_MIN_SCORE = 10;

// Blows up a crystal pile on the enemy's side of the map (nearer an enemy home factory than
// any of its own factories), so the enemy cannot harvest it: the biggest such pile in reach of
// a unit that does not gather crystals itself. Attacks on units come first.
function wreckPile(ctx) {
  const { view, me, mine, p, myFactories } = ctx;
  if (!p.wreckPiles) return null;
  const enemyHomes = view.players.map((_, q) => q)
    .filter((q) => !allied(view, q, me) && !view.players[q].out)
    .map((q) => view.map.factories[q]).filter(Boolean);
  if (!enemyHomes.length) return null;
  const nearest = (k, sites) => Math.min(...sites.map((site) => distance(k, site)));
  const own = myFactories.map((f) => f.at);
  let best = null;
  let bestScore = WRECK_MIN_SCORE;
  for (const unit of mine) {
    if (unitStats(view, unit).storage) continue;
    for (const k of crystalTargets(view, unit.id)) {
      if (own.length && nearest(k, own) <= nearest(k, enemyHomes)) continue;
      const score = view.crystals[k].amount * p.wreckPiles;
      if (score > bestScore) {
        bestScore = score;
        best = { type: "blast", unitId: unit.id, at: k };
      }
    }
  }
  return best;
}

// ---------------------------------------------------------------------------------------
// Building

// The unit to build next. With maxCost set, only units costing up to that are considered.
function wantedUnitType(ctx, maxCost = Infinity) {
  const { view, me, army, p } = ctx;
  const cost = (type) => view.rules.units[type].cost;
  // A unit fits if this game allows it and it, with any upgrade it needs, costs no more than
  // maxCost.
  const fits = (type) => {
    if (!unitAllowed(view, type)) return false;
    const price = cost(type) + upgradeNeeded(ctx, type).cost;
    return Number.isFinite(price) && price <= maxCost;
  };
  const harvesters = army.filter(isHarvester).length;
  const knownPiles = Object.keys(view.crystals).length;
  const harvestersWanted =
    knownPiles >= KNOWN_PILES_FOR_EXTRA_HARVESTER ? p.harvestersMax : p.harvestersEarly;
  if (harvesters < harvestersWanted && fits("lightHarvester")) {
    // With no income at all, buy the cheapest unit that can carry crystals rather than
    // saving for a harvester that may never be affordable.
    const crystals = view.players[me].crystals;
    const canGather = army.some((u) => unitStats(view, u).storage > 0);
    if (!canGather && crystals < cost("lightHarvester")) return cheapestGatherer(view, crystals);
    return "lightHarvester";
  }

  // Three wants compete, each with the priority its gene gives it (Phil, 29 October 2026:
  // so evolution, not a fixed order, decides whether Tanks and heavy units get built): an
  // answer to the enemy units it sees, Infantry (and a carrier) for capturing, and the unit
  // its own army is shortest of.
  const wants = [];
  const counter = counterWanted(ctx, fits);
  if (counter) wants.push([counter, p.counterPriority]);
  if (captureSites(ctx).length) {
    const carrierType = p.transportType || TRANSPORTER_TYPE;
    const carriers = army.filter((u) => isCarrier(view, u)).length;
    const infantry = infantryCount(ctx);
    if (p.transportInfantry > TRANSPORT_THRESHOLD && infantry > 0 && !carriers &&
      fits(carrierType)) wants.push([carrierType, p.capturePriority]);
    else if (infantry < p.captureFactories && fits(INFANTRY_TYPE)) {
      wants.push([INFANTRY_TYPE, p.capturePriority]);
    }
  }
  const own = armyWanted(ctx, fits);
  if (own) wants.push([own, p.armyPriority]);
  // The highest priority wins; on a tie, the earlier want.
  return wants.reduce((best, want) => (want[1] > best[1] ? want : best), [null, -Infinity])[0];
}

// The unit its own army is shortest of, against the shares of its build mix.
function armyWanted(ctx, fits) {
  const { army, p } = ctx;
  const fighters = army.filter((u) => isCombatUnit(p, u));
  const total = Object.values(p.mix).reduce((s, w) => s + w, 0) || 1;
  let best = null;
  let bestGap = -Infinity;
  for (const type in p.mix) {
    if (p.mix[type] <= 0 || !fits(type)) continue;
    if (type === "lightMedic" && fighters.length < p.armySizeForMedic) continue;
    const share = fighters.filter((u) => u.type === type).length / (fighters.length || 1);
    const gap = p.mix[type] / total - share;
    if (gap > bestGap) {
      bestGap = gap;
      best = type;
    }
  }
  return best;
}

// The best answer to the enemy units it can see, if its army does not already hold enough
// answers: the unit that scores best against them in the counters table, weighted by what
// each enemy unit is worth. null if it has enough, or nothing that fits scores well enough.
function counterWanted(ctx, fits) {
  const { view, army, p, counters } = ctx;
  const cost = (type) => view.rules.units[type].cost;
  const threats = ctx.enemies.filter((e) => {
    const stats = unitStats(view, e);
    return !stats.isFactory && (stats.attack > 0 || stats.captures || stats.carries);
  });
  const threatValue = threats.reduce((sum, e) => sum + cost(e.type), 0);
  if (!threatValue) return null;
  const score = (type) => threats.reduce((sum, e) =>
    sum + cost(e.type) * ((counters[e.type] || {})[type] || 0), 0) / threatValue;
  const answers = army.reduce((sum, u) => sum + cost(u.type) * Math.max(0, score(u.type)), 0);
  if (answers >= p.counterWeight * threatValue) return null;
  let best = null;
  let bestScore = COUNTER_MIN_SCORE;
  for (const type of Object.keys(view.rules.units)) {
    if (!view.rules.units[type].attack || !fits(type)) continue;
    const s = score(type);
    if (s > bestScore) {
      bestScore = s;
      best = type;
    }
  }
  return best;
}

function cheapestGatherer(view, crystals) {
  const types = Object.keys(view.rules.units).filter((type) => {
    const stats = view.rules.units[type];
    return stats.storage > 0 && unitAllowed(view, type) && stats.cost <= crystals;
  });
  return types.sort((a, b) => view.rules.units[a].cost - view.rules.units[b].cost)[0] || null;
}

// Builds the wanted unit, or first buys the factory upgrade it needs. An impatient
// personality buys something affordable now instead of saving.
function bestBuild(ctx) {
  const { view, me, myFactories, enemyFactorySite, p } = ctx;
  if (!myFactories.length) return null;
  const crystals = view.players[me].crystals;
  let type = wantedUnitType(ctx);
  // The factory upgrade the wanted unit needs is bought as soon as it is affordable, whatever
  // the personality's patience, so a liking for heavy or air units is not lost to always
  // buying something cheaper while saving for unit and upgrade together.
  const needed = type && upgradeNeeded(ctx, type);
  if (needed && needed.factoryId && needed.cost <= crystals) {
    return { type: "upgrade", factoryId: needed.factoryId, upgrade: needed.name };
  }
  const price = (t) => view.rules.units[t].cost + upgradeNeeded(ctx, t).cost;
  if (type && price(type) > crystals && p.patience < PATIENCE_THRESHOLD) {
    type = wantedUnitType(ctx, crystals);
  }
  if (!type || price(type) > crystals) return null;
  const upgrade = upgradeNeeded(ctx, type);
  if (upgrade.factoryId) {
    return { type: "upgrade", factoryId: upgrade.factoryId, upgrade: upgrade.name };
  }
  const sites = buildSites(view, me, type);
  if (!sites.length) return null;
  const from = (ctx.myFactory || myFactories[0]).at;
  const towards = type === "lightHarvester" ? nearestPile(view, from) : enemyFactorySite;
  const at = towards
    ? sites.reduce((a, b) => (distance(b, towards) < distance(a, towards) ? b : a))
    : sites[0];
  return { type: "build", unitType: type, at };
}

// A Crystal lab for one more factory, while it has fewer than the personality wants and its
// first harvesters are out.
function labUpgrade(ctx) {
  const { view, me, myFactories, army, p } = ctx;
  const lab = view.rules.factoryUpgrades[LAB_UPGRADE];
  if (!lab || !p.labs || view.players[me].crystals < lab.cost) return null;
  if (army.filter(isHarvester).length < p.harvestersEarly) return null;
  const fitted = myFactories.filter((f) => f.upgrades.includes(LAB_UPGRADE)).length;
  if (fitted >= p.labs) return null;
  const factory = myFactories.find((f) => upgradeOptions(view, f.id).includes(LAB_UPGRADE));
  return factory ? { type: "upgrade", factoryId: factory.id, upgrade: LAB_UPGRADE } : null;
}

// The upgrade to buy before a unit type can be built: none (cost 0) if one of the AI's
// factories can build it already, otherwise the upgrade for its home factory (or another).
function upgradeNeeded(ctx, type) {
  const { view, myFactories } = ctx;
  const name = view.rules.units[type].needs;
  if (!name || myFactories.some((f) => factoryBuilds(view, f, type))) {
    return { cost: 0, factoryId: null, name: null };
  }
  const factory = [ctx.myFactory, ...myFactories].find((f) =>
    f && upgradeOptions(view, f.id).includes(name));
  if (!factory) return { cost: Infinity, factoryId: null, name };
  return { cost: view.rules.factoryUpgrades[name].cost, factoryId: factory.id, name };
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
  const radius = ctx.p.harvesterDangerRadius;
  const close = ctx.enemyFighters.some((e) => distance(e.at, k) <= radius);
  return close ? ctx.p.dangerPenalty : 0;
}

// Goal hexes for a unit this turn, or null to stay put.
function goalsFor(ctx, unit, claimedPiles) {
  const { view, myFactories } = ctx;
  const stats = unitStats(view, unit);

  if (stats.storage > 0 && gatherers(ctx).includes(unit)) {
    const full = unit.carrying >= stats.storage;
    const pile = full ? null : choosePile(ctx, unit, claimedPiles);
    if (pile) {
      claimedPiles.add(pile);
      return neighbourKeys(pile);
    }
    if (unit.carrying > 0 && myFactories.length) {
      return myFactories.flatMap((f) => neighbourKeys(f.at));
    }
  }

  const captureGoals = infantryGoals(ctx, unit);
  if (captureGoals) return captureGoals;

  // Scouts explore, then watch the enemy factory; a scout that can fight takes on enemies it
  // can see close by first.
  const engage = stats.attack > 0 && ctx.enemies.some((e) => view.visible[e.at] &&
    canHit(view, unit, e) && distance(e.at, unit.at) <= SCOUT_ENGAGE_RANGE);
  if (SCOUT_TYPES.includes(unit.type) && !engage) {
    const unexplored = Object.keys(view.map.hexes).filter((k) => !view.map.hexes[k].terrain);
    if (unexplored.length) return unexplored;
    const watch = ctx.p.scoutWatchDistance;
    return hexesAround(view, ctx.enemyFactorySite, watch, watch);
  }

  if (stats.healing) {
    const hurt = ctx.army.filter((u) => u.lives < view.rules.lives &&
      unitStats(view, u).defence <= stats.healing && u.id !== unit.id);
    if (hurt.length) return hurt.flatMap((u) => neighbourKeys(u.at));
    return escortGoals(ctx, unit);
  }

  if (stats.attack > 0 && stats.range) return attackGoals(ctx, unit, stats);
  return null;
}

// Infantry head for the nearest factory they can capture: on foot when close, otherwise to a
// transporter to board it if the personality uses them. A transporter carrying infantry
// heads next to the factory to drop them in; an empty one goes to collect infantry. null when
// the unit has no part in capturing.
function infantryGoals(ctx, unit) {
  const sites = captureSites(ctx);
  if (!sites.length) return null;
  const nearest = (from) =>
    sites.reduce((a, b) => (distance(from, b) < distance(from, a) ? b : a));
  const transporters = ctx.army.filter((u) => canBoard(ctx.view, unit, u));
  if (unit.type === INFANTRY_TYPE) {
    const target = nearest(unit.at);
    const ride = ctx.p.transportInfantry > TRANSPORT_THRESHOLD && transporters.length &&
      distance(unit.at, target) > INFANTRY_WALK_DISTANCE;
    return ride ? transporters.map((u) => u.at) : [target];
  }
  if (isCarrier(ctx.view, unit)) {
    if (unit.cargo.length) return neighbourKeys(nearest(unit.at));
    const walking = ctx.army.filter((u) => u.type === INFANTRY_TYPE);
    return walking.length ? walking.flatMap((u) => neighbourKeys(u.at)) : null;
  }
  return null;
}

function choosePile(ctx, unit, claimedPiles) {
  const { view, enemyFighters } = ctx;
  let best = null;
  let bestScore = 0;
  const free = unitStats(view, unit).storage - unit.carrying;
  for (const k in view.crystals) {
    if (claimedPiles.has(k)) continue;
    if (enemyFighters.some((e) => distance(e.at, k) <= ctx.p.harvesterDangerRadius)) continue;
    const pile = view.crystals[k];
    const take = Math.min(free, pile.amount);
    const score = take / (distance(unit.at, k) + 1);
    if (score > bestScore) {
      bestScore = score;
      best = k;
    }
  }
  return best;
}

// Hexes next to the army's fighting units, for medics and idle anti-air.
function escortGoals(ctx, unit) {
  const escort = ctx.army.filter((u) => u.id !== unit.id && isCombatUnit(ctx.p, u) &&
    unitStats(ctx.view, u).attack > 0 && unitStats(ctx.view, u).hits !== "air");
  return escort.flatMap((u) => neighbourKeys(u.at));
}

// Hexes from which the unit could fire at its chosen target: enemies near home first, then
// the weakest visible enemy, then the enemy factory.
function attackGoals(ctx, unit, stats) {
  const { view, myFactory, enemies, enemyFactorySite, p } = ctx;
  const [minRange, maxRange] = stats.range;
  const nearHome = myFactory
    ? enemies.filter((e) => distance(e.at, myFactory.at) <= p.homeDefenceRadius)
    : [];
  // Only targets this unit's attack can hit (ground or air).
  const hittable = enemies.filter((e) => canHit(view, unit, e));
  const close = nearHome.filter((e) => canHit(view, unit, e));
  const pool = close.length ? close : hittable.filter((e) => !unitStats(view, e).isFactory);
  // Anti-air with nothing to shoot at stays with the army.
  if (!pool.length && stats.hits === "air") return escortGoals(ctx, unit);
  let target = null;
  let bestScore = -Infinity;
  for (const enemy of pool) {
    const toughness = defenceOf(view, enemy) * enemy.lives;
    const score = lifeValue(ctx, enemy) / toughness - distance(unit.at, enemy.at) / 10;
    if (score > bestScore) {
      bestScore = score;
      target = enemy.at;
    }
  }
  target = target || enemyFactorySite;
  const standOff = Math.max(minRange, p.standOff);
  const closest = maxRange >= p.standOff ? standOff : minRange;
  return hexesAround(view, target, closest, maxRange);
}

function bestMove(ctx) {
  const { view } = ctx;
  const claimedPiles = new Set();
  // The hexes next to factories it means to overrun are kept free for its Infantry.
  const siegeHexes = new Set(captureSites(ctx).flatMap((k) => neighbourKeys(k)));
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
    const crowding = (k) => !unloading &&
      ctx.myFactories.some((f) => distance(k, f.at) === 1) ? FACTORY_CLEAR_PENALTY : 0;
    const crushing = (k) => (view.crystals[k] ? CRUSH_PENALTY : 0);
    const captures = Boolean(unitStats(view, unit).captures);
    const blocking = (k) => (!captures && siegeHexes.has(k) ? FACTORY_CLEAR_PENALTY : 0);
    const score = (k) => (field[k] === undefined ? Infinity : field[k]) +
      (careful ? dangerAt(ctx, k) : 0) + crowding(k) + crushing(k) + blocking(k);
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
