// Evolves AI personalities by self-play in the simulator.
// Usage: node evolve.js [--generations 30] [--population 16] [--games 8] [--seed 1]
//   --generations  rounds of selection (default 30)
//   --population   personalities per generation (default 16)
//   --games        games each personality plays per generation (default 8)
//   --seed         seed for the whole run, so a run can be repeated exactly (default 1)
//   --out          module the evolved personalities are written to (default ai-personalities.js)
//   --report       Markdown report (default docs/evolution.md)
//   --set          rule change, e.g. --set factoryUpgrades.airfield.cost=50 (repeatable)
//   --benchmark    games each of the best plays against the hand-tuned AI (default 100)
//   --keep         how many of the best are kept (default 5)
//   --json         also write the results as JSON to this file
//   --sides        sides in each game, e.g. 3,4 for free-for-alls of 3 or 4 (default 2); a
//                  game with more sides scores each player by finishing place
//   --export       name of the list in --out (default EVOLVED_PERSONALITIES)
// Each generation every personality plays games against others from the population on fixed
// map 1 and generated maps, with seats and the first player mixed. The best quarter survive;
// the rest are replaced by mixed and mutated copies of the survivors. At the end the best few
// play the hand-tuned AI, and they are written out for the game to use.
import { writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { RULES } from "./rules-config.js?v=0.70";
import { mapById, seededRandom, MAP_SHAPES, shapesForSides } from "./maps.js?v=0.70";
import {
  DEFAULT_PERSONALITY, randomPersonality, mutatePersonality, crossPersonalities,
  favouriteUnits,
} from "./ai.js?v=0.70";
import { runGame, withOverrides, placeScores } from "./sim.js?v=0.70";

const DEFAULTS = { generations: 30, population: 16, games: 8, seed: 1 };
// Generated maps in the pool (map-1 .. map-N of every shape), alongside fixed map 1.
const MAP_POOL = 50;
const SHAPES = Object.keys(MAP_SHAPES);
// Games still going after this many rounds count as draws, to keep evolution quick.
const ROUND_CAP = 60;
const ELITE_SHARE = 0.25;
const MUTATION_RATE = 0.3;
const KEEP = 5;
const BENCHMARK_GAMES = 100;
const MAX_SEED = 2 ** 31;
const PERCENT = 100;

export function evolve({
  generations, population, games, seed, benchmarkGames = BENCHMARK_GAMES, keep = KEEP,
  rules = RULES, log = () => {}, sides = [2],
}) {
  const random = seededRandom(seed);
  const maps = new Map();
  const mapFor = (id) => {
    if (!maps.has(id)) maps.set(id, mapById(id, rules));
    return maps.get(id);
  };
  const randomMap = (count = 2) => {
    if (count > 2) {
      const shapes = shapesForSides(count);
      const shape = shapes[Math.floor(random() * shapes.length)];
      return mapFor(`map-${1 + Math.floor(random() * MAP_POOL)}-${shape}-${count}p`);
    }
    const n = Math.floor(random() * (MAP_POOL + 1));
    const shape = SHAPES[Math.floor(random() * SHAPES.length)];
    if (n === 0) return mapFor("fixed-1");
    return mapFor(shape === "classic" ? `map-${n}` : `map-${n}-${shape}`);
  };

  // One game between personalities a and b, with seats and first player chosen at random.
  // Returns a's points: 1 for a win, 0.5 for a draw, 0 for a loss.
  const play = (a, b, builtBy) => {
    const seatOfA = random() < 0.5 ? 0 : 1;
    const personalities = seatOfA === 0 ? [a, b] : [b, a];
    const record = runGame({
      rules, map: randomMap(), seed: Math.floor(random() * MAX_SEED),
      firstPlayer: random() < 0.5 ? 0 : 1, personalities, roundCap: ROUND_CAP,
    });
    if (builtBy) {
      for (const [type, n] of Object.entries(record.built[seatOfA])) {
        builtBy.units[type] = (builtBy.units[type] || 0) + n;
      }
      for (const [upgrade, n] of Object.entries(record.upgrades[seatOfA])) {
        builtBy.upgrades[upgrade] = (builtBy.upgrades[upgrade] || 0) + n;
      }
      builtBy.captures += record.captures[seatOfA];
    }
    const { winner } = record.result;
    return winner === null ? 0.5 : winner === seatOfA ? 1 : 0;
  };

  // A free-for-all of players.length sides, seats and first player at random. Returns each
  // player's finishing-place score (see placeScores), in the order given; builtBy collects
  // what the first player built.
  const playMany = (players, builtBy) => {
    const count = players.length;
    const seats = players.map((_, i) => i);
    for (let i = count - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [seats[i], seats[j]] = [seats[j], seats[i]];
    }
    const personalities = [];
    players.forEach((p, i) => { personalities[seats[i]] = p; });
    const record = runGame({
      rules, map: randomMap(count), seed: Math.floor(random() * MAX_SEED),
      firstPlayer: Math.floor(random() * count), personalities, roundCap: ROUND_CAP,
    });
    if (builtBy) {
      for (const [type, n] of Object.entries(record.built[seats[0]])) {
        builtBy.units[type] = (builtBy.units[type] || 0) + n;
      }
      for (const [upgrade, n] of Object.entries(record.upgrades[seats[0]])) {
        builtBy.upgrades[upgrade] = (builtBy.upgrades[upgrade] || 0) + n;
      }
      builtBy.captures += record.captures[seats[0]];
      builtBy.wins += record.result.winner === seats[0] ? 1 : 0;
    }
    const scores = placeScores(record, count);
    return seats.map((seat) => scores[seat]);
  };
  const sideCount = () => sides[Math.floor(random() * sides.length)];

  let pool = [DEFAULT_PERSONALITY];
  while (pool.length < population) pool.push(randomPersonality(random));
  const history = [];
  let ranked = [];

  for (let gen = 1; gen <= generations; gen++) {
    const points = pool.map(() => 0);
    const played = pool.map(() => 0);
    for (let i = 0; i < pool.length; i++) {
      for (let g = 0; g < games; g++) {
        const count = sideCount();
        if (count === 2) {
          let j = Math.floor(random() * (pool.length - 1));
          if (j >= i) j += 1;
          const score = play(pool[i], pool[j]);
          points[i] += score;
          points[j] += 1 - score;
          played[i] += 1;
          played[j] += 1;
          continue;
        }
        // Opponents: others from the pool, all different.
        const others = pool.map((_, k) => k).filter((k) => k !== i);
        const chosen = [i];
        while (chosen.length < count) {
          chosen.push(others.splice(Math.floor(random() * others.length), 1)[0]);
        }
        const scores = playMany(chosen.map((k) => pool[k]));
        chosen.forEach((k, n) => {
          points[k] += scores[n];
          played[k] += 1;
        });
      }
    }
    ranked = pool
      .map((personality, i) => ({ personality, rate: points[i] / played[i] }))
      .sort((x, y) => y.rate - x.rate);
    const mean = ranked.reduce((s, r) => s + r.rate, 0) / ranked.length;
    const best = ranked[0];
    history.push({ gen, best: best.rate, mean, favourites: favouriteUnits(best.personality) });
    log(`Generation ${gen}: best ${(best.rate * PERCENT).toFixed(0)}%, ` +
      `mean ${(mean * PERCENT).toFixed(0)}%, favours ` +
      favouriteUnits(best.personality).map(([t, s]) => `${t} ${(s * PERCENT).toFixed(0)}%`)
        .join(", "));

    const elites = ranked.slice(0, Math.max(2, Math.ceil(population * ELITE_SHARE)))
      .map((r) => r.personality);
    const next = [...elites];
    while (next.length < population) {
      const a = elites[Math.floor(random() * elites.length)];
      const b = elites[Math.floor(random() * elites.length)];
      next.push(mutatePersonality(crossPersonalities(a, b, random), random, MUTATION_RATE));
    }
    pool = next;
  }

  // The best few against the hand-tuned AI: one of it in a two-sided game, or one on every
  // other side of a free-for-all. With more sides the score is the finishing-place score
  // (0.5 means as good as the default AI), and wins counts outright wins.
  const best = ranked.slice(0, keep).map(({ personality }) => {
    const builtBy = { units: {}, upgrades: {}, captures: 0, wins: 0 };
    let score = 0;
    for (let g = 0; g < benchmarkGames; g++) {
      const count = sideCount();
      score += count === 2 ? play(personality, DEFAULT_PERSONALITY, builtBy)
        : playMany([personality, ...Array(count - 1).fill(DEFAULT_PERSONALITY)], builtBy)[0];
    }
    log(`Benchmark: ${(score / benchmarkGames * PERCENT).toFixed(0)}% against the default AI` +
      (sides.some((n) => n > 2) ? `, ${builtBy.wins} outright wins` : ""));
    return { personality, winRateVsDefault: score / benchmarkGames, built: builtBy };
  });
  return { history, best, benchmarkGames, sides };
}

// ---------------------------------------------------------------------------------------
// Output

function unitName(type) {
  return RULES.units[type] ? RULES.units[type].name : type;
}

// A personality's name: the two units it built most in its benchmark games (harvesters
// aside), or, before it has played them, its two strongest build preferences.
function personalityName(personality, built = null) {
  const made = built ? Object.entries(built.units).filter(([type]) => type !== "lightHarvester")
    .sort((x, y) => y[1] - x[1]).slice(0, 2).map(([type]) => type) : [];
  const types = made.length ? made : favouriteUnits(personality, 2).map(([type]) => type);
  return types.map(unitName).join(" and ");
}

// A build preference counts as strong at this share of the mix, and as hardly built below
// this share of the units actually built.
const STRONG_PREFERENCE = 0.1;
const HARDLY_BUILT = 0.02;

// Units a personality strongly prefers but hardly ever built: a sign that another gene (such
// as patience) or a rule keeps the preference from ever reaching the board, so evolution
// cannot judge it.
function unbuiltPreferences(personality, built) {
  const total = Object.values(built.units).reduce((sum, n) => sum + n, 0) || 1;
  return favouriteUnits(personality, Object.keys(personality.mix).length)
    .filter(([type, share]) => share >= STRONG_PREFERENCE &&
      (built.units[type] || 0) / total < HARDLY_BUILT)
    .map(([type, share]) => `${unitName(type)} (${Math.round(share * PERCENT)}% wanted)`);
}

function round(value) {
  return Math.round(value * PERCENT) / PERCENT;
}

function writeModule(path, best, settings, exportName = "EVOLVED_PERSONALITIES") {
  const list = best.map(({ personality, winRateVsDefault, built }) => ({
    name: personalityName(personality, built),
    winRateVsDefault: round(winRateVsDefault),
    personality: {
      ...Object.fromEntries(Object.entries(personality).filter(([k]) => k !== "mix")
        .map(([k, v]) => [k, round(v)])),
      mix: Object.fromEntries(Object.entries(personality.mix).map(([k, v]) => [k, round(v)])),
    },
  }));
  const text =
    "// AI personalities bred by evolve.js; the game picks one at random each game.\n" +
    "// Each entry: a name from its favourite units, its win rate against the default AI, and\n" +
    "// its genes (see DEFAULT_PERSONALITY in ai.js).\n" +
    `// Run: node evolve.js ${settings}\n` +
    "// Do not edit by hand; run evolve.js again instead.\n" +
    `export const ${exportName} = ${JSON.stringify(list, null, 2)};\n`;
  writeFileSync(path, text);
}

function share(n, total) {
  return total ? `${((n / total) * PERCENT).toFixed(0)}%` : "-";
}

function writeReport(path, { history, best, benchmarkGames, sides = [2] }, settings) {
  const many = sides.some((n) => n > 2);
  const lines = [
    "# Evolved AI personalities",
    "",
    ...(many ? [`For games with ${sides.join(" or ")} sides, each a free-for-all. A game's ` +
      "score is its finishing place: 1 for a win, 0 for being out first, shared when " +
      "players finish level (still in at the round limit, or out together). The win " +
      "rates below are average scores; 50% means as good as the opponents.", ""] : []),
    `Produced by \`node evolve.js ${settings}\`. Each generation every personality plays ` +
      "games against others on fixed map 1 and generated maps; the best quarter survive and " +
      "the rest are mixed and mutated copies of them. Games over " +
      `${ROUND_CAP} rounds count as draws.`,
    "",
    "## Progress",
    "",
    "| Generation | Best win rate | Mean win rate | Best personality favours |",
    "|---|---|---|---|",
    ...history.map((h) => `| ${h.gen} | ${share(h.best, 1)} | ${share(h.mean, 1)} | ` +
      h.favourites.map(([t, s]) => `${unitName(t)} ${share(s, 1)}`).join(", ") + " |"),
    "",
    "## The best personalities against the hand-tuned AI",
    "",
    `${benchmarkGames} games each, seats and maps mixed.`,
    "",
    "| Personality | Wins against the default AI | Units it built (share) | " +
      "Upgrades and captures per game | Wanted but hardly built |",
    "|---|---|---|---|---|",
    ...best.map((b) => {
      const total = Object.values(b.built.units).reduce((s, n) => s + n, 0);
      const units = Object.entries(b.built.units).sort((x, y) => y[1] - x[1])
        .map(([t, n]) => `${unitName(t)} ${share(n, total)}`).join(", ");
      const perGame = (n) => (n / benchmarkGames).toFixed(1);
      const extras = [
        ...Object.entries(b.built.upgrades).map(([u, n]) =>
          `${RULES.factoryUpgrades[u].name} ${perGame(n)}`),
        `captures ${perGame(b.built.captures)}`,
      ].join(", ");
      const unbuilt = unbuiltPreferences(b.personality, b.built).join(", ") || "-";
      return `| ${personalityName(b.personality, b.built)} | ` +
        `${share(b.winRateVsDefault, 1)} | ${units} | ${extras} | ${unbuilt} |`;
    }),
    "",
    "## Genes of the best personality",
    "",
    "```json",
    JSON.stringify(best[0].personality, (k, v) => (typeof v === "number" ? round(v) : v), 2),
    "```",
    "",
  ];
  writeFileSync(path, lines.join("\n"));
}

function parseArgs(argv) {
  const args = { set: [] };
  for (let i = 0; i < argv.length; i += 2) {
    const name = argv[i].replace(/^--/, "");
    if (name === "set") args.set.push(argv[i + 1]);
    else args[name] = argv[i + 1];
  }
  return {
    set: args.set,
    benchmarkGames: Number(args.benchmark || BENCHMARK_GAMES),
    keep: Number(args.keep || KEEP),
    generations: Number(args.generations || DEFAULTS.generations),
    population: Number(args.population || DEFAULTS.population),
    games: Number(args.games || DEFAULTS.games),
    seed: Number(args.seed || DEFAULTS.seed),
    out: args.out || "ai-personalities.js",
    json: args.json || null,
    report: args.report || "docs/evolution.md",
    sides: (args.sides || "2").split(",").map(Number),
    exportName: args.export || "EVOLVED_PERSONALITIES",
  };
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  const settings = `--generations ${options.generations} --population ${options.population} ` +
    `--games ${options.games} --seed ${options.seed}` +
    (options.sides.join(",") !== "2" ? ` --sides ${options.sides.join(",")}` : "") +
    (options.exportName !== "EVOLVED_PERSONALITIES" ? ` --export ${options.exportName}` : "") +
    options.set.map((s) => ` --set ${s}`).join("");
  const rules = withOverrides(RULES, options.set);
  const started = performance.now();
  const result = evolve({ ...options, rules, log: (line) => console.log(line) });
  writeModule(options.out, result.best, settings, options.exportName);
  writeReport(options.report, result, settings);
  if (options.json) writeFileSync(options.json, JSON.stringify({ settings, ...result }, null, 2));
  console.log(`Done in ${((performance.now() - started) / 1000 / 60).toFixed(1)} min; wrote ` +
    `${options.out} and ${options.report}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
