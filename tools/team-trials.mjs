// Team campaign trials: plays a team mission AI against AI (the hand-tuned AI on the human
// seats) and reports how often the humans' side wins, how often the mission is lost, and how
// many games stall at the round cap. A rough guide to whether a mission can be won and is
// not a walkover; people play it differently.
//   node tools/team-trials.mjs --campaign duo --mission 3 --games 10
//   node tools/team-trials.mjs --campaign duo --games 4        (every mission)
import { newGame, applyAction, viewFor } from "../engine.js?v=0.86";
import { chooseAction, DEFAULT_PERSONALITY } from "../ai.js?v=0.86";
import { EVOLVED_PERSONALITIES } from "../ai-personalities.js?v=0.86";
import { MULTI_SIDE_PERSONALITIES } from "../ai-personalities-multi.js?v=0.86";
import { levelById } from "../difficulty.js?v=0.86";
import { TEAM_CAMPAIGNS, campaignById, teamPlan, missionTick } from "../team-campaigns.js?v=0.86";

const DEFAULT_GAMES = 10;
const ROUND_CAP = 40;
const MAX_ACTIONS = 300000;
const DECIMALS = 1;

function option(name, fallback) {
  const at = process.argv.indexOf(`--${name}`);
  return at >= 0 ? process.argv[at + 1] : fallback;
}

// As the game screen picks it (seatPersonality in game.js).
function personalityFor(state, seat) {
  if (seat.kind === "human") return DEFAULT_PERSONALITY;
  const kind = levelById(seat.level).ai;
  const bred = MULTI_SIDE_PERSONALITIES.length ? MULTI_SIDE_PERSONALITIES
    : EVOLVED_PERSONALITIES;
  const base = kind === "default" || !bred.length ? DEFAULT_PERSONALITY
    : { ...DEFAULT_PERSONALITY, ...bred[kind === "best" ? 0 : state.seed % bred.length]
      .personality };
  return seat.aiMix ? { ...base, mix: { ...seat.aiMix } } : base;
}

function play(campaignId, index, seed) {
  const plan = teamPlan(campaignId, index);
  const rules = { ...plan.rules, roundCap: ROUND_CAP };
  let state = { ...newGame({ rules, map: plan.map, seed, sides: plan.sides,
    phases: plan.phases, setup: plan.setup }), seats: plan.seats, team: plan.team };
  const personalities = plan.seats.map((seat) => personalityFor(state, seat));
  state = missionTick(state).state;
  for (let n = 0; !state.result && n < MAX_ACTIONS; n++) {
    const action = chooseAction(viewFor(state, state.current), personalities[state.current]);
    state = missionTick(applyAction(state, action)).state;
  }
  return state;
}

function trial(campaignId, index, games) {
  const m = campaignById(campaignId).missions[index];
  const tally = { won: 0, lost: 0, stalled: 0 };
  const rounds = [];
  const started = Date.now();
  for (let seed = 1; seed <= games; seed++) {
    const state = play(campaignId, index, seed);
    const reason = state.result && state.result.reason;
    if (reason === "objective") tally.won++;
    else if (reason === "missionFailed") tally.lost++;
    else tally.stalled++;
    rounds.push(state.round);
  }
  const average = rounds.reduce((a, b) => a + b, 0) / rounds.length;
  const seconds = (Date.now() - started) / 1000;
  console.log(`${campaignId} ${index + 1} ${m.title}: won ${tally.won}, lost ${tally.lost}, ` +
    `stalled ${tally.stalled} of ${games}; ${average.toFixed(DECIMALS)} rounds ` +
    `(${seconds.toFixed(DECIMALS)} s)`);
}

const games = Number(option("games", DEFAULT_GAMES));
const campaigns = option("campaign", null) ? [option("campaign")]
  : TEAM_CAMPAIGNS.map((c) => c.id);
const mission = option("mission", null);
for (const id of campaigns) {
  const indices = mission ? [Number(mission) - 1]
    : campaignById(id).missions.map((_, i) => i);
  for (const index of indices) trial(id, index, games);
}
