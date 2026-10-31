// Duels: one unit against one, worked out from the rules rather than played (Phil, 31 October
// 2026), to show at a glance where each unit is weak and where three units beat each other in
// a ring (A beats B, B beats C, C beats A).
//
// How a duel runs. The two units take turns, the first striker going first, for up to
// MAX_ROUNDS rounds. On its turn a unit fires if its attack can hit the other (ground or air);
// a unit that can move picks the distance it fires from: out of reach of return fire when
// its range allows (2 or more), otherwise next to the target. Turrets cannot move, and
// Artillery is taken to be set up already, so neither can move: they fire only when the other
// unit is within their range, and a unit that can move keeps out of their range when its own
// range allows. A unit can only aim as far as it can see unless a spotter (a Spotter Drone or
// another unit) shows it more: duels are worked out both ways. Damage follows the game: each
// turn's hits add up, one life is lost at the unit's defence and both at twice it; return
// fire answers each shot from next door; a Blast Cannon fires every other turn. Movement
// costs, terrain other than the defence bonus, splash and sonic lines (one target here) are
// left out, so this shows the units' raw strengths; tools/matchups.mjs plays real battles.
//
// Usage (from the project folder): node tools/duels.mjs
import { writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { RULES } from "../rules-config.js?v=0.77";

const MAX_ROUNDS = 30;
const RETURN_FIRE_DISTANCE = 1;

function canHit(a, b) {
  const hits = a.hits || "ground";
  const layer = b.air ? "air" : "ground";
  return a.attack > 0 && Boolean(a.range) && (hits === "both" || hits === layer);
}

// The furthest a unit can aim: its range, or as far as it can see without a spotter.
function reach(u, spotter) {
  return spotter ? u.range[1] : Math.min(u.range[1], u.sight);
}

function firesBack(attacker, target, distance, rules, cooldown) {
  return distance === RETURN_FIRE_DISTANCE && cooldown === 0 && canHit(target, attacker) &&
    target.range[0] <= RETURN_FIRE_DISTANCE &&
    target.range[1] <= rules.combat.returnFireMaxRange;
}

const fixedInPlace = (u) => u.move === 0 || Boolean(u.needsSetup);

// The distance a unit fires from, or null if it cannot fire this turn. current is null
// before the first shot: then even a unit fixed in place fires from where it likes, as the
// other unit has come to it.
function firingDistance(shooter, target, current, rules, spotter) {
  const near = shooter.range[0];
  const far = reach(shooter, spotter);
  if (near > far) return null;
  if (fixedInPlace(shooter) && current !== null) {
    return current >= near && current <= far ? current : null;
  }
  const choices = [];
  for (let d = near; d <= far; d++) choices.push(d);
  // Best: out of the target's own range if it cannot move; next best, out of reach of
  // return fire; otherwise next door.
  const targetReach = canHit(target, shooter) ? [target.range[0], reach(target, spotter)] : null;
  const safe = (d) => !targetReach || d < targetReach[0] || d > targetReach[1];
  if (fixedInPlace(target)) {
    const out = choices.find(safe);
    if (out !== undefined) return out;
  }
  const noReply = choices.find((d) => d > RETURN_FIRE_DISTANCE);
  return noReply !== undefined ? noReply : choices[0];
}

function livesLost(total, defence, rules) {
  if (total >= rules.combat.loseTwoLivesAt * defence) return 2;
  if (total >= rules.combat.loseOneLifeAt * defence) return 1;
  return 0;
}

// One duel with first striking first. Returns { winner: "first" | "second" | null, lives }.
export function duel(rules, firstType, secondType, { defenceBonus = 0, spotter = false } = {}) {
  const make = (type) => {
    const stats = rules.units[type];
    return { stats, lives: rules.lives, cooldown: 0,
      defence: stats.defence + (stats.air ? 0 : defenceBonus) };
  };
  const sides = [make(firstType), make(secondType)];
  // Before the first shot the units are apart: the first striker chooses where to fire from.
  let distance = null;
  for (let turn = 0; turn < MAX_ROUNDS * 2; turn++) {
    const me = sides[turn % 2];
    const them = sides[(turn + 1) % 2];
    if (me.cooldown > 0) me.cooldown -= 1;
    if (!canHit(me.stats, them.stats) || me.cooldown > 0) continue;
    const from = firingDistance(me.stats, them.stats, distance, rules, spotter);
    if (from === null) continue;
    distance = from;
    // This turn's hits on each side.
    let onThem = 0;
    let onMe = 0;
    const startLives = [me.lives, them.lives];
    for (let shot = 0; shot < (me.stats.shots || 1); shot++) {
      onThem += me.stats.attack;
      them.lives = Math.max(0, startLives[1] - livesLost(onThem, them.defence, rules));
      if (firesBack(me.stats, them.stats, distance, rules, them.cooldown)) {
        onMe += them.stats.attack;
        me.lives = Math.max(0, startLives[0] - livesLost(onMe, me.defence, rules));
      }
      if (them.lives === 0 || me.lives === 0) break;
    }
    if (me.stats.reload) me.cooldown = me.stats.reload + 1;
    if (them.lives === 0 || me.lives === 0) break;
  }
  const [first, second] = sides;
  if (first.lives > 0 && second.lives === 0) return { winner: "first", lives: first.lives };
  if (second.lives > 0 && first.lives === 0) return { winner: "second", lives: second.lives };
  return { winner: null, lives: 0 };
}

// The units that fight, in the unit table's order: ground first, then air, each by cost.
export function duelUnits(rules) {
  return Object.keys(rules.units)
    .filter((t) => rules.units[t].cost !== null && !rules.units[t].isFactory)
    .sort((a, b) => {
      const [ua, ub] = [rules.units[a], rules.units[b]];
      return Number(Boolean(ua.air)) - Number(Boolean(ub.air)) || ua.cost - ub.cost;
    });
}

// DUELS[row][column]: the row unit strikes first. +2/+1: the row unit wins with that many
// lives left; -2/-1: the column unit wins with that many left; 0: neither can destroy the other.
export function duelTable(rules, options = {}) {
  const units = duelUnits(rules);
  const table = {};
  for (const a of units) {
    table[a] = {};
    for (const b of units) {
      const { winner, lives } = duel(rules, a, b, options);
      table[a][b] = winner === "first" ? lives : winner === "second" ? -lives : 0;
    }
  }
  return table;
}

// Whether a beats b whoever strikes first.
export function beatsInDuel(table, a, b) {
  return table[a][b] > 0 && table[b][a] < 0;
}

// Rings of three: a beats b, b beats c, c beats a, by the beats(a, b) test. Each ring is
// listed once, starting from its first unit in the list (beats never holds both ways, so a
// ring cannot also run the other way round).
export function findCycles(units, beats) {
  const rings = [];
  units.forEach((a, i) => {
    const later = units.slice(i + 1);
    for (const b of later) {
      if (!beats(a, b)) continue;
      for (const c of later) {
        if (c !== b && beats(b, c) && beats(c, a)) rings.push([a, b, c]);
      }
    }
  });
  return rings;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const name = (t) => RULES.units[t].name;
  const units = duelUnits(RULES);
  const variants = {
    open: duelTable(RULES),
    spotter: duelTable(RULES, { spotter: true }),
    rocky: duelTable(RULES, { defenceBonus: RULES.terrain.rocky.defenceBonus }),
  };
  const result = { units, names: units.map(name), variants, cycles: {} };
  for (const [variant, table] of Object.entries(variants)) {
    result.cycles[variant] = findCycles(units, (a, b) => beatsInDuel(table, a, b))
      .map((ring) => ring.map(name));
    console.log(`${variant}: ${result.cycles[variant].length} rings`);
    for (const ring of result.cycles[variant]) console.log(`  ${ring.join(" > ")} > ${ring[0]}`);
  }
  writeFileSync(process.argv[2] || "docs/balance/duels.json", JSON.stringify(result, null, 1));
}
