// Co-op mission trials: plays a co-op mission AI against AI (the default AI on the human
// team too) for a given number of humans, and reports how often the human team wins, how
// often the AI does, and how many stall at the round cap. A rough guide to whether a mission
// is fair for that many players, not a measure of how people play it.
//   node tools/coop-trials.mjs --mission 2 --humans 3 --games 20
import { mapById } from "../maps.js?v=0.74";
import { newGame, applyAction, viewFor } from "../engine.js?v=0.74";
import { chooseAction, DEFAULT_PERSONALITY } from "../ai.js?v=0.74";
import { COOP_MISSIONS, coopPlan } from "../coop-campaign.js?v=0.74";

const DEFAULT_GAMES = 20;
const ROUND_CAP = 40;
const MAX_ACTIONS = 200000;
const HUMAN_TEAM = 0;

function option(name, fallback) {
  const at = process.argv.indexOf(`--${name}`);
  return at >= 0 ? Number(process.argv[at + 1]) : fallback;
}

const index = option("mission", 0);
const mission = COOP_MISSIONS[index];
const humans = option("humans", mission.humans);
const games = option("games", DEFAULT_GAMES);

const tally = { humans: 0, ai: 0, stalled: 0 };
const rounds = [];
for (let seed = 1; seed <= games; seed++) {
  const plan = coopPlan(index, humans);
  const rules = { ...plan.rules, roundCap: ROUND_CAP };
  let state = newGame({ rules, map: mapById(plan.mapId, rules), seed, sides: plan.sides,
    phases: plan.phases, setup: plan.setup });
  for (let n = 0; !state.result && n < MAX_ACTIONS; n++) {
    state = applyAction(state, chooseAction(viewFor(state, state.current), DEFAULT_PERSONALITY));
    if (mission.done && mission.done(state)) break;
    if (mission.failed && mission.failed(state)) break;
  }
  const won = mission.done ? mission.done(state)
    : state.result?.winner !== null && state.players[state.result.winner]?.team === HUMAN_TEAM;
  const lost = (mission.failed && mission.failed(state)) ||
    (state.result?.winner !== null && state.result?.winner !== undefined && !won);
  if (won) tally.humans++;
  else if (lost) tally.ai++;
  else tally.stalled++;
  rounds.push(state.round);
}
const average = rounds.reduce((a, b) => a + b, 0) / rounds.length;
console.log(`${mission.title}, ${humans} humans, ${games} games: humans won ${tally.humans}, ` +
  `AI won ${tally.ai}, stalled ${tally.stalled}; average ${average.toFixed(1)} rounds`);
