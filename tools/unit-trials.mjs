// Unit trials: makes the AI build one kind of unit in earnest, so every unit gets used in
// play, and measures how it does (Phil, 29 October 2026). For each unit type, one side plays
// the strongest evolved personality changed to favour that unit; the other side plays the
// same personality unchanged. Seats, first player and maps (every shape) vary from game to
// game.
// Usage (from the project folder): node tools/unit-trials.mjs [--games 40] [--seed 1]
//   [--out docs/balance/unit-trials.md] [--set rule=value ...]
// Reported for each unit: the favouring side's win rate, how many of the unit it built a
// game, enemy units each one destroyed (shots that finished a unit off), and how many of
// those built were lost.
import { writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { RULES } from "../rules-config.js?v=0.39";
import { mapById, MAP_SHAPES, seededRandom } from "../maps.js?v=0.39";
import { newGame, applyAction, viewFor } from "../engine.js?v=0.39";
import { chooseAction, DEFAULT_PERSONALITY } from "../ai.js?v=0.39";
import { EVOLVED_PERSONALITIES } from "../ai-personalities.js?v=0.39";
import { withOverrides } from "../sim.js?v=0.39";

const DEFAULT_GAMES = 40;
const DEFAULT_SEED = 1;
const DEFAULT_OUT = "docs/balance/unit-trials.md";
// Generated maps used, map-1 .. map-N of every shape.
const MAP_POOL = 30;
const ROUND_CAP = 60;
const MAX_ACTIONS_PER_TURN = 500;
// The favoured unit's share of the build mix; the rest keep a little of their usual share so
// the side still has harvesters and some support.
const FAVOURED_SHARE = 1;
const OTHERS_SCALE = 0.2;
// Infantry and carriers are not in the build mix: they are favoured through their genes.
const MANY_INFANTRY = 3;
const ALWAYS_TRANSPORT = 1;
const PERCENT = 100;
const MAX_SEED = 2 ** 31;
// Shots whose events name an attacker and a target.
const SHOTS = ["fire", "fireBlind", "returnFire", "lineHit", "splash"];

function parseArgs(argv) {
  const options = { games: DEFAULT_GAMES, seed: DEFAULT_SEED, out: DEFAULT_OUT, set: [] };
  for (let i = 0; i < argv.length; i += 2) {
    const name = argv[i].replace(/^--/, "");
    if (name === "set") options.set.push(argv[i + 1]);
    else options[name] = name === "out" ? argv[i + 1] : Number(argv[i + 1]);
  }
  return options;
}

const base = { ...DEFAULT_PERSONALITY, ...(EVOLVED_PERSONALITIES[0]?.personality || {}) };

// The base personality changed to build as much of type as it can, saving up for it (and for
// any factory upgrade it needs) rather than buying something cheaper.
function favouring(type) {
  const mix = {};
  for (const t in base.mix) mix[t] = base.mix[t] * OTHERS_SCALE;
  const p = { ...base, mix, patience: 1 };
  if (type === "infantry") return { ...p, captureFactories: MANY_INFANTRY };
  if (RULES.units[type].carries) {
    return { ...p, transportType: type, transportInfantry: ALWAYS_TRANSPORT,
      captureFactories: Math.max(p.captureFactories, 2) };
  }
  mix[type] = FAVOURED_SHARE;
  return p;
}

// Plays one game; returns the winner and, for the favoured side, what it built and what its
// units of the favoured type did.
function play({ rules, map, seed, firstPlayer, personalities, favouredSeat, type }) {
  let state = newGame({ rules: { ...rules, roundCap: ROUND_CAP }, map, seed, firstPlayer,
    recordActions: false });
  const typeOf = {};
  const record = { built: 0, kills: 0, lost: 0 };
  let actions = 0;
  while (!state.result) {
    const mover = state.current;
    const action = chooseAction(viewFor(state, mover), personalities[mover]);
    for (const u of Object.values(state.units)) typeOf[u.id] = [u.type, u.owner];
    state = applyAction(state, action);
    for (const u of Object.values(state.units)) typeOf[u.id] = [u.type, u.owner];
    actions = action.type === "endTurn" ? 0 : actions + 1;
    if (actions > MAX_ACTIONS_PER_TURN) throw new Error(`Seed ${seed}: AI stuck in a turn`);
    const lastShooter = {};
    for (const e of state.events) {
      if (SHOTS.includes(e.type) && e.targetId) lastShooter[e.targetId] = e.unitId;
      if (e.type === "build" && mover === favouredSeat && e.unitType === type) record.built += 1;
      if (e.type === "upgrade" || e.type === "build") continue;
      if (e.type === "destroyed") {
        if (e.owner === favouredSeat && e.unitType === type) record.lost += 1;
        const shooter = typeOf[lastShooter[e.unitId]];
        if (shooter && shooter[1] === favouredSeat && shooter[0] === type &&
          e.owner !== favouredSeat) record.kills += 1;
      }
    }
  }
  return { winner: state.result.winner, ...record };
}

export function unitTrials({ games, seed, rules = RULES, log = () => {} }) {
  const random = seededRandom(seed);
  const shapes = Object.keys(MAP_SHAPES);
  const maps = new Map();
  const randomMap = () => {
    const shape = shapes[Math.floor(random() * shapes.length)];
    const n = 1 + Math.floor(random() * MAP_POOL);
    const id = shape === "classic" ? `map-${n}` : `map-${n}-${shape}`;
    if (!maps.has(id)) maps.set(id, mapById(id, rules));
    return maps.get(id);
  };
  const types = Object.keys(rules.units).filter((t) =>
    rules.units[t].cost !== null && t !== "lightHarvester");
  const rows = [];
  for (const type of types) {
    const totals = { wins: 0, decided: 0, built: 0, kills: 0, lost: 0 };
    for (let g = 0; g < games; g++) {
      const favouredSeat = g % 2;
      const personalities = [];
      personalities[favouredSeat] = favouring(type);
      personalities[1 - favouredSeat] = base;
      const r = play({ rules, map: randomMap(), seed: Math.floor(random() * MAX_SEED),
        firstPlayer: Math.floor(g / 2) % 2, personalities, favouredSeat, type });
      if (r.winner !== null) {
        totals.decided += 1;
        if (r.winner === favouredSeat) totals.wins += 1;
      }
      totals.built += r.built;
      totals.kills += r.kills;
      totals.lost += r.lost;
    }
    const row = { type, name: rules.units[type].name, games, ...totals };
    rows.push(row);
    log(`${row.name}: won ${totals.wins} of ${totals.decided} decided, built ${totals.built}`);
  }
  return rows;
}

function report(rows, options) {
  const pct = (a, b) => (b ? `${Math.round((a / b) * PERCENT)}%` : "-");
  const each = (a, b) => (b ? (a / b).toFixed(1) : "-");
  const lines = [
    "# Unit trials",
    "",
    `Produced by \`node tools/unit-trials.mjs --games ${options.games} --seed ${options.seed}\`` +
      ". For each unit, one side plays the strongest evolved personality changed to build " +
      "that unit above all else (Infantry: keep three; Transporter and Chinook: carry " +
      "infantry in it); the other side plays the same personality unchanged. Maps of " +
      `every shape; games over ${ROUND_CAP} rounds are draws.`,
    "",
    "A win rate well above 50% means leaning on the unit beats the evolved mix; well below " +
      "means it is a poor unit to lean on (it may still be useful in small numbers). Kills " +
      "count shots by that unit type that finished off an enemy unit.",
    "",
    "| Unit | Cost | Win rate (decided) | Built per game | Kills per unit built | " +
      "Lost per unit built |",
    "|---|---|---|---|---|---|",
    ...[...rows].sort((a, b) => b.wins / (b.decided || 1) - a.wins / (a.decided || 1))
      .map((r) => `| ${r.name} | ${RULES.units[r.type].cost} | ${pct(r.wins, r.decided)} ` +
        `(${r.decided}/${r.games}) | ${each(r.built, r.games)} | ${each(r.kills, r.built)} | ` +
        `${each(r.lost, r.built)} |`),
    "",
  ];
  return lines.join("\n");
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const options = parseArgs(process.argv.slice(2));
  const rules = withOverrides(RULES, options.set);
  const rows = unitTrials({ ...options, rules, log: (line) => console.log(line) });
  writeFileSync(options.out, report(rows, options));
  console.log(`Written to ${options.out}`);
}
