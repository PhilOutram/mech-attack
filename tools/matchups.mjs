// Matchups: measures which units beat which (Phil, 29 October 2026), so the AI can build
// counters to what it sees instead of hoping evolution finds them. For every enemy unit type
// and every unit type that can attack, it stages small battles of equal value: each side gets
// its units worth BUDGET crystals, no factory and no crystals, and the hand-tuned AI fights it
// out on a few classic maps until one side is wiped out or ROUND_CAP is reached. Seats and the
// first player alternate.
// A matchup's score is the share of its own value the countering side kept, less the share
// the enemy kept: +1 is a clean win, -1 a clean loss, 0 even (or nobody could hurt anybody).
// Writes counters.js (the table the AI reads) and docs/balance/counters.md.
// Usage (from the project folder): node tools/matchups.mjs [--games 4] [--set rule=value ...]
import { writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { RULES } from "../rules-config.js?v=0.49";
import { mapById } from "../maps.js?v=0.49";
import { newGame, applyAction, viewFor, unitsOf } from "../engine.js?v=0.49";
import { chooseAction, DEFAULT_PERSONALITY } from "../ai.js?v=0.49";
import { withOverrides } from "../sim.js?v=0.49";

const DEFAULT_GAMES = 4;
// Crystals' worth of units on each side, and the most units of one kind on the board.
const BUDGET = 200;
const MAX_UNITS = 10;
const ROUND_CAP = 30;
const MAX_ACTIONS_PER_TURN = 500;
// Classic maps: no unused factories, so Infantry fight instead of going off to capture.
const MAPS = ["map-1", "map-2", "map-3", "map-4"];
const DECIMALS = 2;
// Counters listed for each enemy unit in the report.
const REPORT_COUNTERS = 3;

function parseArgs(argv) {
  const options = { games: DEFAULT_GAMES, set: [] };
  for (let i = 0; i < argv.length; i += 2) {
    const name = argv[i].replace(/^--/, "");
    if (name === "set") options.set.push(argv[i + 1]);
    else options[name] = Number(argv[i + 1]);
  }
  return options;
}

// How many units of a type make up the budget.
function squad(rules, type) {
  return Math.max(1, Math.min(MAX_UNITS, Math.round(BUDGET / rules.units[type].cost)));
}

// The value a player has left on the board, as a share of what it started with.
function valueLeft(state, player, start) {
  const left = unitsOf(state, player).reduce((sum, u) => sum + state.rules.units[u.type].cost +
    (u.cargo || []).reduce((s, c) => s + state.rules.units[c.type].cost, 0), 0);
  return left / start;
}

// One staged battle: player 0 has the counter type, player 1 the enemy type.
function battle(rules, map, counter, enemy, seed, firstPlayer) {
  const units = [Array(squad(rules, counter)).fill(counter),
    Array(squad(rules, enemy)).fill(enemy)];
  const start = units.map((list) => list.reduce((sum, t) => sum + rules.units[t].cost, 0));
  let state = newGame({ rules, map, seed, firstPlayer, recordActions: false,
    setup: { units, crystals: [0, 0], noHome: [true, true] } });
  let actions = 0;
  while (!state.result) {
    const action = chooseAction(viewFor(state, state.current), DEFAULT_PERSONALITY);
    state = applyAction(state, action);
    actions = action.type === "endTurn" ? 0 : actions + 1;
    if (actions > MAX_ACTIONS_PER_TURN) throw new Error(`${counter} v ${enemy}: AI stuck`);
  }
  return valueLeft(state, 0, start[0]) - valueLeft(state, 1, start[1]);
}

export function measureCounters({ games = DEFAULT_GAMES, rules = RULES, log = () => {} }) {
  const battleRules = { ...rules, roundCap: ROUND_CAP, loseWithNoUnits: true,
    crystals: { ...rules.crystals, spawnChoices: [0] } };
  const maps = MAPS.map((id) => mapById(id, battleRules));
  const buildable = Object.keys(rules.units).filter((t) => rules.units[t].cost !== null);
  const fighters = buildable.filter((t) => rules.units[t].attack > 0);
  const table = {};
  for (const enemy of buildable) {
    table[enemy] = {};
    for (const counter of fighters) {
      let total = 0;
      for (let g = 0; g < games; g++) {
        total += battle(battleRules, maps[g % maps.length], counter, enemy, g + 1, g % 2);
      }
      table[enemy][counter] = Number((total / games).toFixed(DECIMALS));
    }
    log(`${rules.units[enemy].name}: best answer ` +
      `${rules.units[bestCounters(table[enemy], 1)[0][0]].name}`);
  }
  return table;
}

function bestCounters(row, count) {
  return Object.entries(row).sort((a, b) => b[1] - a[1]).slice(0, count);
}

function writeModule(table, options) {
  const out = "// Which units beat which, measured by tools/matchups.mjs " +
    `(--games ${options.games}).\n` +
    "// COUNTERS[enemy][unit]: how well unit does against an equal value of enemy, from -1\n" +
    "// (always loses) to +1 (always wins cleanly). The AI builds counters to what it sees.\n" +
    "// Do not edit by hand; run tools/matchups.mjs again after changing unit stats.\n" +
    `export const COUNTERS = ${JSON.stringify(table, null, 2)};\n`;
  writeFileSync("counters.js", out);
}

function writeReport(table, rules, options) {
  const name = (t) => rules.units[t].name;
  const lines = [
    "# Counters",
    "",
    `Produced by \`node tools/matchups.mjs --games ${options.games}\`. For each enemy unit and ` +
      `each unit that can attack, ${options.games} staged battles: each side gets ${BUDGET} ` +
      `crystals' worth (at most ${MAX_UNITS} units), no factory, and the hand-tuned AI fights ` +
      `until one side is wiped out or ${ROUND_CAP} rounds pass. Score: the share of its value ` +
      "the answering side kept, less the share the enemy kept (+1 a clean win, -1 a clean " +
      "loss). The AI reads the full table from `counters.js`.",
    "",
    "| Enemy unit | Best answers (score) | Worst answer (score) |",
    "|---|---|---|",
    ...Object.entries(table).map(([enemy, row]) => {
      const best = bestCounters(row, REPORT_COUNTERS)
        .map(([t, s]) => `${name(t)} (${s})`).join(", ");
      const [worst, score] = Object.entries(row).sort((a, b) => a[1] - b[1])[0];
      return `| ${name(enemy)} | ${best} | ${name(worst)} (${score}) |`;
    }),
    "",
  ];
  writeFileSync("docs/balance/counters.md", lines.join("\n"));
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const options = parseArgs(process.argv.slice(2));
  const rules = withOverrides(RULES, options.set);
  const table = measureCounters({ ...options, rules, log: (line) => console.log(line) });
  writeModule(table, options);
  writeReport(table, rules, options);
  console.log("Written counters.js and docs/balance/counters.md");
}
