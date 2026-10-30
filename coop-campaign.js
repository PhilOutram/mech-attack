// The co-op campaign (Phil, 29 and 30 October 2026): missions for 2 or 3 humans playing at the
// same time, on one team against one or more AI sides. Each human has their own home and
// crystals; the team wins or loses together, and a human who is knocked out keeps watching.
// The host can start any mission their device has unlocked; a win is recorded on every
// player's device, so anyone can host the next one.
import { RULES } from "./rules-config.js?v=0.66";
import { shapesForSides } from "./maps.js?v=0.66";

const PROGRESS_KEY = "mech-attack.coop-campaign";
const HUMAN_TEAM = 0;
const AI_TEAM = 1;

export const COOP_CAMPAIGN_NAME = "Red Dust: Together";

// Targets and counts, kept next to the text that names them.
const TWO_FRONTS_ROUNDS = 12;
const LAST_STAND_ROUNDS = 15;
const BANK_PER_HUMAN = 150;
// Each mission is played on the same generated map every time (for its number of sides).
const MAP_SEEDS = [31, 47, 58, 73, 89];
// An AI side facing this many humans or more starts with a Crystal lab.
const HUMANS_PER_AI_FOR_LAB = 2;

// Mission fields:
// - title, story, objective, failText (shown if failed() ends it).
// - humans: [fewest, most] humans who can play it.
// - ais(humans): the AI sides, each { level, units, crystals, upgrades, aiMix }.
// - start(humans, i) (optional): human i's starting { units, crystals, upgrades }.
// - rules: rule changes.
// - steps (optional): the objective in parts, [{ text, done(state) }], ticked off in the panel.
// - done(state): the objective is met; null: win by beating every AI side.
// - failed(state) (optional): the mission is lost.

const humansOf = (state) =>
  state.players.map((_, p) => p).filter((p) => state.players[p].team === HUMAN_TEAM);
const aisOf = (state) =>
  state.players.map((_, p) => p).filter((p) => state.players[p].team === AI_TEAM);
// Every human still holds their own home factory.
const homesHeld = (state) => humansOf(state).every((p) =>
  state.units[state.players[p].factoryId]?.owner === p);
const aiLost = (state, type) => aisOf(state)
  .reduce((n, p) => n + (state.players[p].lost[type] || 0), 0);
const teamCrystals = (state) => humansOf(state)
  .reduce((n, p) => n + state.players[p].crystals, 0);

// An AI side scaled to the humans it faces: the usual start (with the second player's extra
// crystals, as it moves after the humans) times the humans per AI side, a Crystal lab when
// that is 2 or more, plus any extra units for the mission.
function scaledAi(level, humans, aiCount, { extra = [], upgrades = [], aiMix = null } = {}) {
  const { crystals, units, secondPlayerCrystals } = RULES.start;
  const scale = Math.max(1, Math.round(humans / aiCount));
  return {
    level,
    units: [...Array.from({ length: scale }, () => units).flat(), ...extra],
    crystals: (crystals + (secondPlayerCrystals || 0)) * scale,
    upgrades: [...upgrades, ...(scale >= HUMANS_PER_AI_FOR_LAB ? ["lab"] : [])],
    aiMix,
  };
}

export const COOP_MISSIONS = [
  {
    title: "Two Fronts",
    humans: [2, 3],
    story: "The Consortium has found your new bases and is striking at all of them at once. " +
      "Hold your own ground and send help where it is needed. Buy Comms in your factories " +
      "and you will see what your partners see.",
    objective: `Hold every one of your home factories for ${TWO_FRONTS_ROUNDS} rounds.`,
    failText: "One of your factories was overrun.",
    ais: (humans) => [scaledAi("major", humans, 1, {
      extra: ["tank", "infantry", "infantry"],
      aiMix: { tank: 0.4, infantry: 0.3, scoutBike: 0.3 } })],
    rules: {},
    done: (state) => homesHeld(state) && state.round > TWO_FRONTS_ROUNDS,
    failed: (state) => !homesHeld(state),
  },
  {
    title: "Supply Run",
    humans: [2, 3],
    story: "Only Blue's factory has an Airfield, and a Chinook to go with it. The others sit " +
      "on rich crystal fields with nothing to fly. Work together: ferry units where they are " +
      "needed and keep the harvesters safe.",
    objective: `Bank ${BANK_PER_HUMAN} crystals for each player between you.`,
    failText: "One of you was knocked out.",
    start: (humans, i) => (i === 0
      ? { units: ["lightHarvester", "tank", "chinook"], crystals: RULES.start.crystals,
        upgrades: ["airfield"] }
      : { units: ["lightHarvester", "lightHarvester", "scoutBike"],
        crystals: RULES.start.crystals * 2, upgrades: [] }),
    ais: (humans) => [scaledAi("major", humans, 1)],
    rules: { allowedUpgrades: ["heavyWorks", "lab", "comms"] },
    done: (state) => teamCrystals(state) >= BANK_PER_HUMAN * humansOf(state).length,
    failed: (state) => humansOf(state).some((p) => state.players[p].out),
  },
  {
    title: "Pincer",
    humans: [2, 3],
    story: "The Consortium's forward base sits between your homes, guarded by a Heavy " +
      "Cannon. Squeeze it from every side at once, so the cannon cannot turn on any one " +
      "of you.",
    objective: "Destroy the Consortium's Heavy Cannon and overrun its home factory.",
    steps: [
      { text: "Destroy the Heavy Cannon", done: (state) => aiLost(state, "heavyCannon") > 0 },
      { text: "Overrun the Consortium's home factory", done: () => false },
    ],
    ais: (humans) => [scaledAi("major", humans, 1, { extra: ["heavyCannon", "turret"],
      upgrades: ["heavyWorks"] })],
    rules: {},
    done: null,
  },
  {
    title: "Last Stand",
    humans: [2, 3],
    story: "Two Consortium armies are converging on your colony. There is nowhere to fall " +
      "back to. Every factory must hold until help arrives.",
    objective: `Hold every one of your home factories for ${LAST_STAND_ROUNDS} rounds ` +
      "against two armies.",
    failText: "One of your factories was overrun.",
    ais: (humans) => [0, 1].map(() => scaledAi("major", humans, 2, {
      extra: ["tank", "infantry"] })),
    rules: {},
    done: (state) => homesHeld(state) && state.round > LAST_STAND_ROUNDS,
    failed: (state) => !homesHeld(state),
  },
  {
    title: "Kharon Rising",
    humans: [2, 3],
    story: "The Consortium's last two strongholds stand between you and Kharon. Their best " +
      "commanders lead them, with Turrets round their factories. Take them both.",
    objective: "Overrun both Consortium home factories.",
    ais: (humans) => [0, 1].map(() => scaledAi("marshal", humans, 2, {
      extra: ["heavyCannon", "turret", "turret"], upgrades: ["heavyWorks"] })),
    rules: {},
    done: null,
  },
];

// Everything needed to start a mission for this many humans: seats (humans not yet told where
// they play), sides and teams, phases (the humans together, then the AI sides), the starting
// setup, the map and the rules.
export function coopPlan(index, humans) {
  const mission = COOP_MISSIONS[index];
  const ais = mission.ais(humans);
  const count = humans + ais.length;
  const humanStart = (i) => (mission.start ? mission.start(humans, i)
    : { units: [...RULES.start.units], crystals: RULES.start.crystals, upgrades: [] });
  const starts = [...Array.from({ length: humans }, (_, i) => humanStart(i)), ...ais];
  const shape = shapesForSides(count)[0];
  return {
    seats: [...Array.from({ length: humans }, () => ({ kind: "human" })),
      ...ais.map((ai) => ({ kind: "ai", level: ai.level, aiMix: ai.aiMix }))],
    sides: starts.map((_, p) => ({ team: p < humans ? HUMAN_TEAM : AI_TEAM })),
    phases: [Array.from({ length: humans }, (_, p) => p), ais.map((_, i) => humans + i)],
    setup: {
      units: starts.map((s) => s.units),
      crystals: starts.map((s) => s.crystals),
      upgrades: starts.map((s) => s.upgrades),
    },
    mapId: `map-${MAP_SEEDS[index]}-${shape}-${count}p`,
    rules: { ...structuredClone(RULES), ...mission.rules },
    coop: { mission: index },
  };
}

// How many co-op missions this device has won (they unlock in order).
export function coopMissionsDone() {
  try {
    const done = Number(localStorage.getItem(PROGRESS_KEY));
    return Number.isInteger(done) && done >= 0 ? Math.min(done, COOP_MISSIONS.length) : 0;
  } catch {
    return 0;
  }
}

export function markCoopMissionDone(index) {
  try {
    if (index + 1 > coopMissionsDone()) localStorage.setItem(PROGRESS_KEY, String(index + 1));
  } catch {
    // Not remembered; the mission still counts as won this time.
  }
}
