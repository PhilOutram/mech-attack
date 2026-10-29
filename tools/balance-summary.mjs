// Tabulates a balance experiment written by tools/balance.sh: for each rule variant, how the
// best evolved personalities (both seeds) did against the hand-tuned AI, what they built, and
// whether they bought upgrades or captured factories.
// Usage (from the project folder): node tools/balance-summary.mjs upgrades|economy
import { readFileSync, readdirSync } from "node:fs";
import { RULES } from "../rules-config.js";

const DIR = `docs/balance/${process.argv[2] || "economy"}`;
const PERCENT = 100;
const TOP_UNITS = 4;
const DECIMALS = 1;

const runs = readdirSync(DIR).filter((f) => f.endsWith(".json")).map((f) => ({
  variant: f.replace(/-s\d+\.json$/, ""),
  ...JSON.parse(readFileSync(`${DIR}/${f}`, "utf8")),
}));

const variants = [...new Set(runs.map((r) => r.variant))];
const rows = variants.map((variant) => {
  const best = runs.filter((r) => r.variant === variant).flatMap((r) =>
    r.best.map((b) => ({ ...b, games: r.benchmarkGames })));
  const games = best.reduce((n, b) => n + b.games, 0);
  const sum = (pick) => best.reduce((n, b) => n + pick(b), 0);
  const units = {};
  for (const b of best) {
    for (const [type, n] of Object.entries(b.built.units)) units[type] = (units[type] || 0) + n;
  }
  const totalUnits = Object.values(units).reduce((n, v) => n + v, 0) || 1;
  const perGame = (n) => (n / games).toFixed(DECIMALS);
  const upgrade = (name) => perGame(sum((b) => b.built.upgrades[name] || 0));
  const gene = (name) => (sum((b) => b.personality[name]) / best.length).toFixed(DECIMALS);
  return {
    variant,
    wins: `${(sum((b) => b.winRateVsDefault) / best.length * PERCENT).toFixed(0)}%`,
    heavyWorks: upgrade("heavyWorks"),
    airfield: upgrade("airfield"),
    captures: perGame(sum((b) => b.built.captures)),
    patience: gene("patience"),
    captureFactories: gene("captureFactories"),
    built: Object.entries(units).sort((a, b) => b[1] - a[1]).slice(0, TOP_UNITS)
      .map(([type, n]) => `${RULES.units[type].name} ${(n / totalUnits * PERCENT).toFixed(0)}%`)
      .join(", "),
  };
});

console.log("| Variant | Wins vs default AI | Heavy works / game | Airfield / game | " +
  "Captures / game | Patience | Capture gene | Most built |");
console.log("|---|---|---|---|---|---|---|---|");
for (const r of rows) {
  console.log(`| ${r.variant} | ${r.wins} | ${r.heavyWorks} | ${r.airfield} | ${r.captures} | ` +
    `${r.patience} | ${r.captureFactories} | ${r.built} |`);
}
