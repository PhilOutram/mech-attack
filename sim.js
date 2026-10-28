// Headless balance simulator: the AI plays itself on fixed map 1 and the results are summed up.
// Usage: node sim.js --games 1000 --seed 1 [--quiet 20] [--json results.json] [--set ...]
//   --games  number of games (default 100)
//   --seed   first game seed; game i uses seed + i (default 1)
//   --quiet  rounds without a life lost that count as a stalled stretch (default 20)
//   --json   also write every game's record to this file
//   --map    map to play: fixed-1 (default) or map-<number> for a generated map
//   --set    override a rule for this run, e.g. --set crystals.growthPerTurn=10 (repeatable;
//            the value is read as JSON, so numbers, true/false and null work)
// The first player alternates between games so neither colour always moves first.
import { writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { RULES } from "./rules-config.js?v=0.07";
import { FIXED_MAP_1, buildMap, mapById } from "./maps.js?v=0.07";
import { newGame, applyAction, viewFor, unitStats } from "./engine.js?v=0.07";
import { chooseAction } from "./ai.js?v=0.07";

const DEFAULT_GAMES = 100;
const DEFAULT_SEED = 1;
const DEFAULT_QUIET_ROUNDS = 20;
// A turn with more actions than this means the AI is stuck in a loop.
const MAX_ACTIONS_PER_TURN = 500;
// Rounds shown in the per-round tables.
const REPORT_ROUNDS = [1, 5, 10, 15, 20, 30, 40, 50, 60, 80, 100];
const PERCENT = 100;

// Plays one game and records a snapshot of both players at the end of every round.
export function runGame({ rules = RULES, map = buildMap(FIXED_MAP_1), seed, firstPlayer = 0 }) {
  let state = newGame({ rules, map, seed, firstPlayer, recordActions: false });
  const rounds = [];
  let destroyed = [0, 0];
  let livesLost = 0;
  let actionsThisTurn = 0;

  while (!state.result) {
    const action = chooseAction(viewFor(state, state.current));
    state = applyAction(state, action);
    actionsThisTurn = action.type === "endTurn" ? 0 : actionsThisTurn + 1;
    if (actionsThisTurn > MAX_ACTIONS_PER_TURN) {
      throw new Error(`Seed ${seed}: AI exceeded ${MAX_ACTIONS_PER_TURN} actions in a turn`);
    }
    for (const event of state.events) {
      if (event.type === "destroyed") destroyed[event.owner] += 1;
      if (event.type === "hit") livesLost += event.livesBefore - event.livesAfter;
      if (event.type === "newRound" || event.type === "gameOver") {
        rounds.push(snapshot(state, destroyed, livesLost));
        destroyed = [0, 0];
        livesLost = 0;
      }
    }
  }
  return { seed, firstPlayer, result: state.result, rounds };
}

function snapshot(state, destroyed, livesLost) {
  return {
    players: state.players.map((player, p) => {
      const army = Object.values(state.units).filter((u) =>
        u.owner === p && !unitStats(state, u).isFactory);
      const carried = army.reduce((sum, u) => sum + u.carrying, 0);
      const armyValue = army.reduce((sum, u) => sum + unitStats(state, u).cost, 0);
      return {
        crystals: player.crystals + carried,
        worth: player.crystals + carried + armyValue,
        units: army.length,
        destroyed: destroyed[p],
      };
    }),
    livesLost,
  };
}

export function runSimulation({ games = DEFAULT_GAMES, seed = DEFAULT_SEED, ...options } = {}) {
  const records = [];
  for (let i = 0; i < games; i++) {
    records.push(runGame({ ...options, seed: seed + i, firstPlayer: i % 2 }));
  }
  return records;
}

// ---------------------------------------------------------------------------------------
// Metrics

function longestQuietStretch(record) {
  let longest = 0;
  let run = 0;
  for (const round of record.rounds) {
    run = round.livesLost === 0 ? run + 1 : 0;
    longest = Math.max(longest, run);
  }
  return longest;
}

// Did the player behind on this measure at mid-game go on to win? null if level or no winner.
function comeback(record, measure) {
  const { winner } = record.result;
  if (winner === null) return null;
  const mid = record.rounds[Math.max(0, Math.floor(record.rounds.length / 2) - 1)];
  const [a, b] = mid.players.map((p) => p[measure]);
  if (a === b) return null;
  const behind = a < b ? 0 : 1;
  return winner === behind;
}

function share(count, total) {
  return total ? `${((count / total) * PERCENT).toFixed(1)}%` : "-";
}

function percentile(sorted, fraction) {
  return sorted[Math.min(sorted.length - 1, Math.floor(fraction * sorted.length))];
}

export function summarise(records, { quietRounds = DEFAULT_QUIET_ROUNDS } = {}) {
  const n = records.length;
  const lengths = records.map((r) => r.rounds.length).sort((a, b) => a - b);
  const decisive = records.filter((r) => r.result.winner !== null);
  const reasons = {};
  for (const r of records) reasons[r.result.reason] = (reasons[r.result.reason] || 0) + 1;

  const comebackRate = (measure) => {
    const cases = records.map((r) => comeback(r, measure)).filter((c) => c !== null);
    return { rate: share(cases.filter(Boolean).length, cases.length), games: cases.length };
  };

  const perRound = REPORT_ROUNDS.map((round) => {
    const live = records.filter((r) => r.rounds.length >= round);
    const at = live.map((r) => r.rounds[round - 1]);
    const mean = (f) => (at.length ? at.reduce((s, x) => s + f(x), 0) / at.length : NaN);
    return {
      round,
      games: live.length,
      units: mean((x) => x.players[0].units + x.players[1].units),
      destroyed: mean((x) => x.players[0].destroyed + x.players[1].destroyed),
    };
  });
  const allRounds = records.flatMap((r) => r.rounds);
  const meanOver = (f) => allRounds.reduce((s, x) => s + f(x), 0) / (allRounds.length || 1);

  return {
    games: n,
    length: {
      mean: lengths.reduce((s, x) => s + x, 0) / n,
      median: percentile(lengths, 0.5),
      p10: percentile(lengths, 0.1),
      p90: percentile(lengths, 0.9),
    },
    roundCap: share(reasons.roundCap || 0, n),
    quietStretch: share(records.filter((r) => longestQuietStretch(r) >= quietRounds).length, n),
    quietRounds,
    reasons,
    blueWins: share(decisive.filter((r) => r.result.winner === 0).length, decisive.length),
    firstPlayerWins: share(
      decisive.filter((r) => r.result.winner === r.firstPlayer).length, decisive.length),
    comebackCrystals: comebackRate("crystals"),
    comebackWorth: comebackRate("worth"),
    unitsPerRound: meanOver((x) => x.players[0].units + x.players[1].units),
    destroyedPerRound: meanOver((x) => x.players[0].destroyed + x.players[1].destroyed),
    perRound,
  };
}

export function formatSummary(s) {
  const lines = [
    `Games: ${s.games}`,
    `Game length (rounds): mean ${s.length.mean.toFixed(1)}, median ${s.length.median}, ` +
      `10th-90th percentile ${s.length.p10}-${s.length.p90}`,
    `Stalled (reached the round limit): ${s.roundCap}`,
    `Had a stretch of ${s.quietRounds}+ rounds with no life lost: ${s.quietStretch}`,
    `End reasons: ${Object.entries(s.reasons).map(([k, v]) => `${k} ${v}`).join(", ")}`,
    `Blue wins (of decided games): ${s.blueWins}; first player wins: ${s.firstPlayerWins}`,
    `Player behind at mid-game who won, by banked + carried crystals: ` +
      `${s.comebackCrystals.rate} of ${s.comebackCrystals.games} games`,
    `Player behind at mid-game who won, by crystals + army value: ` +
      `${s.comebackWorth.rate} of ${s.comebackWorth.games} games`,
    `Units on the board (both players, per round): mean ${s.unitsPerRound.toFixed(1)}`,
    `Units destroyed (both players, per round): mean ${s.destroyedPerRound.toFixed(2)}`,
    "",
    "Round  Games still running  Units on board  Destroyed that round",
    ...s.perRound.map((r) =>
      `${String(r.round).padStart(5)}  ${String(r.games).padStart(19)}  ` +
      `${(Number.isNaN(r.units) ? "-" : r.units.toFixed(1)).padStart(14)}  ` +
      `${(Number.isNaN(r.destroyed) ? "-" : r.destroyed.toFixed(2)).padStart(20)}`),
  ];
  return lines.join("\n");
}

// ---------------------------------------------------------------------------------------
// Command line

// A copy of the rules with "a.b.c=value" overrides applied.
export function withOverrides(rules, overrides) {
  const copy = structuredClone(rules);
  for (const override of overrides) {
    const [path, raw] = override.split("=");
    const keys = path.split(".");
    let target = copy;
    for (const k of keys.slice(0, -1)) {
      if (!(k in target)) throw new Error(`Unknown rule: ${path}`);
      target = target[k];
    }
    const last = keys[keys.length - 1];
    if (!(last in target)) throw new Error(`Unknown rule: ${path}`);
    target[last] = JSON.parse(raw);
  }
  return copy;
}

function parseArgs(argv) {
  const args = { set: [] };
  for (let i = 0; i < argv.length; i += 2) {
    const name = argv[i].replace(/^--/, "");
    if (name === "set") args.set.push(argv[i + 1]);
    else args[name] = argv[i + 1];
  }
  return {
    games: Number(args.games || DEFAULT_GAMES),
    seed: Number(args.seed || DEFAULT_SEED),
    quietRounds: Number(args.quiet || DEFAULT_QUIET_ROUNDS),
    json: args.json,
    mapId: args.map || FIXED_MAP_1.id,
    overrides: args.set,
  };
}

function main() {
  const { overrides, mapId, ...options } = parseArgs(process.argv.slice(2));
  const rules = withOverrides(RULES, overrides);
  const map = mapById(mapId, rules);
  const started = performance.now();
  const records = runSimulation({ ...options, rules, map });
  console.log(`Map: ${map.name}`);
  const seconds = (performance.now() - started) / 1000;
  if (overrides.length) console.log(`Rule changes: ${overrides.join(", ")}\n`);
  console.log(formatSummary(summarise(records, options)));
  console.log(`\n${options.games} games in ${seconds.toFixed(1)} s`);
  if (options.json) writeFileSync(options.json, JSON.stringify(records));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
