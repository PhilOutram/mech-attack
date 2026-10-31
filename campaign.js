// The campaign "Red Dust" (Phil, 29 October 2026): missions that introduce the game, each
// built round a unit or tactic the player has to use, on bigger maps as it goes on. A mission
// sets the map (and may reshape its terrain), the starting units and crystals, any rule
// changes, how the AI plays, and its objective; finishing one unlocks the next. Progress is
// remembered on this device.
import { RULES } from "./rules-config.js?v=0.79";
import { unitsOf, factoriesOf } from "./engine.js?v=0.79";
import { distance, cheapestPaths } from "./hex.js?v=0.79";
import { LEVELS } from "./difficulty.js?v=0.79";

const PROGRESS_KEY = "mech-attack.campaign";
// The highest rank each mission has been won at: { mission index: rank id }.
const RANKS_KEY = "mech-attack.campaign-ranks";
const HUMAN = 0;
const AI_PLAYER = 1;

export const CAMPAIGN_NAME = "Red Dust";

// Mission fields:
// - mapId, and terrain(map, rules) (optional): changes made to the generated map.
// - setup: starting units, crystals and factory upgrades (see newGame in engine.js).
// - newUnits, newUpgrades: what the mission unlocks (Phil, 29 October 2026). Once unlocked,
//   a unit or upgrade can be built in every later mission, by both sides.
// - rules: other rule changes.
// - ai: "default" is the gentler hand-tuned AI, "evolved" one of the strongest; aiMix
//   (optional) replaces the units it builds, and aiGenes (optional) changes other genes.
// - tip (optional): a top tip shown when the mission starts. noSurrender: no Demand surrender.
// - done(state): the objective is met (the mission is won). null: win the usual way, by
//   overrunning Green's home factory. steps (optional): the objective in parts, ticked off in
//   the panel as they are done.
// - failed(state) (optional): the mission is lost, with failText saying why.
// - boss (optional): a heavy unit Green starts with, leading its army, which the player must
//   destroy as well as meet the objective (Phil, 29 October 2026); goal names the objective
//   as the second step. Across the campaign Green starts with every kind of unit, so the
//   player meets them all.
// Targets and counts are kept here, next to the text that names them.
const BANK_TARGET = 200;
const LANDFALL_INFANTRY = 1;
const LANDFALL_CRYSTALS = 75;
const FACTORIES_TO_CAPTURE = 3;
const HOLD_ROUNDS = 12;
const SCOUTS_TO_DESTROY = 8;
const HELICOPTERS_TO_DESTROY = 5;
const TANKS_TO_DESTROY = 5;

// What each unit and upgrade is for, in a line, for the cards that show what a mission
// unlocks.
export const UNIT_ROLES = {
  infantry: "Overruns factories. Cheap, and shoots down aircraft.",
  scoutBike: "Fast scout that can carry crystals home.",
  tank: "Your workhorse: tough, and hits hard.",
  lightHarvester: "Carries 90 crystals home in one trip.",
  lightMedic: "Repairs damaged units.",
  artillery: "Long range, once set up.",
  turret: "A fixed gun to guard your factory.",
  twinTurret: "A fixed twin gun: two close-range shots a turn.",
  heavyTank: "Two guns, two targets a turn: shreds Infantry.",
  chinook: "Flies a vehicle or two Infantry over anything.",
  attackHelicopter: "Flies over everything to strike ground and air units.",
  antiAircraftJeep: "Shoots down aircraft.",
  transporter: "Carries two Infantry fast.",
  blastCannon: "Cluster bomb: hits everything round its target.",
  fighter: "Hunts enemy aircraft.",
  spotterDrone: "A flying eye that sees far.",
  sonicTank: "Sonic boom: hits every enemy in a line.",
  heavyCannon: "The toughest gun on Kharon.",
};
export const UPGRADE_ROLES = {
  lab: "A factory upgrade that makes crystals every turn.",
  airfield: "A factory upgrade for building air units.",
  heavyWorks: "A factory upgrade for building heavy units.",
};

const owns = (state, type) => unitsOf(state, HUMAN).some((u) => u.type === type);
const holdsHome = (state) => state.units[state.players[HUMAN].factoryId]?.owner === HUMAN;
const greenLost = (state, type) => state.players[AI_PLAYER].lost[type] || 0;

const LANDFALL_STEPS = [
  { text: "Capture the factory with your Infantry", done: holdsHome },
  { text: "Build a Scout Bike", done: (state) => holdsHome(state) && owns(state, "scoutBike") },
  { text: "Harvest crystals and build a Tank", done: (state) => owns(state, "tank") },
];

// ---------------------------------------------------------------------------------------
// Reshaping a map

// Paths over terrain from a hex, as move costs.
function pathCosts(map, rules, from) {
  const costOf = (k) => (map.hexes[k] ? rules.terrain[map.hexes[k].terrain].moveCost : null);
  const paths = cheapestPaths(from, costOf);
  const costs = {};
  for (const k in paths) costs[k] = paths[k].cost;
  return costs;
}

// Turns hexes to mountain, removing any crystal pile or unused factory on them.
function raiseMountains(map, hexes) {
  const raised = new Set(hexes);
  for (const k of raised) map.hexes[k] = { ...map.hexes[k], terrain: "mountain" };
  map.deposits = map.deposits.filter((d) => !raised.has(d.at));
  map.neutralFactories = (map.neutralFactories || []).filter((f) => !raised.has(f.at));
}

// A ring of mountains round blue's home at RING_RADIUS, with a crystal pile inside it.
const RING_RADIUS = 3;
const RING_PILE_DISTANCE = 2;

function mountainRing(map, rules) {
  const home = map.factories[HUMAN];
  raiseMountains(map, Object.keys(map.hexes).filter((k) => distance(k, home) === RING_RADIUS));
  const open = (k) => rules.terrain[map.hexes[k].terrain].moveCost !== null;
  const inside = Object.keys(map.hexes).filter((k) =>
    distance(k, home) === RING_PILE_DISTANCE && open(k) && !map.starts[HUMAN].includes(k));
  if (inside.length && !map.deposits.some((d) => distance(d.at, home) < RING_RADIUS)) {
    map.deposits.push({ at: inside.sort()[0], pair: null });
  }
}

// A ridge of mountains across the middle of the map, along the hexes about as far from one
// home factory as the other, with a narrow pass in the middle. The ridge is widened until
// the only way through is the pass.
const PASS_RADIUS = 1;
const MAX_RIDGE_WIDTH = 4;

function ridgeWithPass(map, rules) {
  const [blue, green] = map.factories.map((f) => pathCosts(map, rules, f));
  const sites = Object.keys(map.hexes).filter((k) => blue[k] !== undefined);
  // The pass: round the hex most nearly half way, on the shortest route between the homes.
  const gap = (k) => Math.abs(blue[k] - green[k]);
  const middle = [...sites].sort((a, b) =>
    gap(a) - gap(b) || blue[a] + green[a] - blue[b] - green[b] || a.localeCompare(b))[0];
  const pass = sites.filter((k) => distance(k, middle) <= PASS_RADIUS);
  for (let width = 1; width <= MAX_RIDGE_WIDTH; width++) {
    const ridge = sites.filter((k) => Math.abs(blue[k] - green[k]) <= width &&
      !pass.includes(k));
    const trial = structuredClone(map);
    raiseMountains(trial, ridge);
    const blocked = { ...trial, hexes: { ...trial.hexes } };
    for (const k of pass) blocked.hexes[k] = { ...blocked.hexes[k], terrain: "mountain" };
    if (pathCosts(blocked, rules, map.factories[HUMAN])[map.factories[AI_PLAYER]] === undefined) {
      Object.assign(map, trial);
      for (const k of pass) map.hexes[k] = { ...map.hexes[k], terrain: "plain" };
      return;
    }
  }
}

// The unused factory furthest from blue's home site: where the VIP must go.
function farFactory(map) {
  const home = map.factories[HUMAN];
  return (map.neutralFactories || []).map((f) => f.at)
    .reduce((a, b) => (distance(home, b) > distance(home, a) ? b : a));
}

const factoryAt = (state, at) => Object.values(state.units).find((u) => u.at === at);
const vipAlive = (state) => Object.values(state.units).some((u) =>
  u.type === "vip" || (u.cargo || []).some((c) => c.type === "vip"));

// ---------------------------------------------------------------------------------------
// The missions

const MISSION_LIST = [
  {
    title: "Landfall",
    mapId: "map-3",
    story: "The Blue Expedition has reached Kharon, a red world rich in power crystals. Your " +
      "drop ship has set a squad of Infantry down near an abandoned factory. Its store " +
      `still holds ${LANDFALL_CRYSTALS} crystals, and crystals glitter in the dust nearby.`,
    tip: { title: "Top tip", text: "Tap your Infantry to select them, then tap a hex next to " +
      "the factory. Infantry must spend a turn next to a factory before they can break in, " +
      "so next turn tap the factory to move them into it and take it over." },
    objective: "Take the factory, build a Scout Bike, then harvest and build a Tank.",
    steps: LANDFALL_STEPS,
    setup: { units: [Array(LANDFALL_INFANTRY).fill("infantry"), []],
      crystals: [LANDFALL_CRYSTALS, 0], unclaimedHome: [true, false] },
    newUnits: ["infantry", "scoutBike", "tank"],
    rules: { loseWithNoUnits: false },
    noSurrender: true,
    ai: "default",
    done: (state) => LANDFALL_STEPS.every((step) => step.done(state)),
  },
  {
    title: "Supply Lines",
    mapId: "map-8",
    story: "The factory hums again. Command has sent the plans for a Crystal lab, which " +
      "grows crystals inside a factory every turn, and for a Crystal Seeder, which plants " +
      "new ones. But you are not alone: Green Consortium scouts have been seen in the hills, " +
      "and they want these crystals too.",
    objective: `Bank ${BANK_TARGET} crystals in your store. Harvest, protect your harvester, ` +
      "and think about building a Crystal lab.",
    setup: { units: [["lightHarvester", "scoutBike"], ["lightHarvester", "scoutBike"]],
      crystals: [60, 50] },
    newUnits: ["lightHarvester", "lightMedic", "crystalSeeder"],
    newUpgrades: ["lab"],
    ai: "default",
    // Green races for crystals here; it does not send Infantry at your factory yet.
    aiGenes: { captureFactories: 0 },
    done: (state) => state.players[HUMAN].crystals >= BANK_TARGET,
  },
  {
    title: "First Contact",
    mapId: "map-5-3-4-4-3",
    story: "The Consortium has built a factory across the plateau. A factory cannot be " +
      "blown up: it has to be overrun. Infantry must reach it, wait a turn outside while they " +
      "break in, then storm it. Green will try to pick them off, so cover them with Tanks.",
    objective: "Overrun Green's home factory with your Infantry.",
    boss: "artillery",
    goal: "Overrun Green's home factory",
    setup: { units: [["lightHarvester", "scoutBike", "tank", "tank", "infantry", "infantry"],
      ["lightHarvester", "scoutBike", "tank", "lightMedic"]], crystals: [80, 60] },
    newUnits: ["artillery"],
    ai: "default",
    done: null,
  },
  {
    title: "Hold the Line",
    mapId: "map-14-3-5-5-3",
    story: "A Consortium strike force is heading for your factory, and it is bigger than " +
      "anything you can field. Your engineers have built a Twin Turret beside the factory, a " +
      "fixed gun that fires twice at anything right next to it, and Command has sent two " +
      "Sonic Tanks: a sonic boom hits every enemy along a straight line, so catch them " +
      "coming up the straight. Build Turrets if you need them, and keep Green's Infantry out.",
    objective: `Hold your home factory for ${HOLD_ROUNDS} rounds.`,
    boss: "sonicTank",
    goal: `Hold your home factory for ${HOLD_ROUNDS} rounds`,
    setup: { units: [["lightHarvester", "tank", "sonicTank", "sonicTank", "twinTurret"],
      ["lightHarvester", "tank", "tank", "scoutBike", "scoutBike", "infantry", "infantry",
        "transporter"]], crystals: [120, 120] },
    newUnits: ["turret", "twinTurret"],
    ai: "default",
    aiMix: { tank: 0.5, scoutBike: 0.3, infantry: 0.2 },
    done: (state) => holdsHome(state) && state.round > HOLD_ROUNDS,
  },
  {
    title: "Over the Mountains",
    mapId: "map-11-3-5-5-3",
    terrain: mountainRing,
    story: "Your new base sits in a crater ringed by mountains: safe, but your Tanks cannot " +
      "drive out. The factory has an Airfield, and a Chinook has flown in. It lifts one " +
      "vehicle or two Infantry over anything, and the Airfield can build Attack Helicopters " +
      "too. Green has an Airfield as well, so watch the skies: Anti-Aircraft Jeeps and " +
      "Infantry can shoot its helicopters down. Fly your army out and take the fight to Green.",
    tip: { title: "Top tip", text: "Move a Tank or Infantry onto the Chinook to board it. " +
      "Fly the Chinook over the mountains, then tap Drop off and a hex next to it." },
    objective: "Overrun Green's home factory. Only the air can get you out of the crater.",
    boss: "blastCannon",
    goal: "Overrun Green's home factory",
    setup: { units: [["lightHarvester", "tank", "infantry", "chinook"],
      ["lightHarvester", "scoutBike", "tank", "infantry", "spotterDrone", "antiAircraftJeep"]],
    crystals: [150, 100],
    upgrades: [["airfield"], ["airfield"]] },
    // Both factories start with an Airfield, so both sides can build the air units.
    newUnits: ["chinook", "attackHelicopter", "antiAircraftJeep"],
    newUpgrades: ["airfield"],
    ai: "default",
    done: null,
  },
  {
    title: "Storm the Works",
    mapId: "map-12-4-5-5-4",
    story: "Between the two bases stand abandoned mining factories, still able to build, " +
      "each with crystals left in its store. Your Infantry can take them, but they are " +
      "weak: carry them in the Transporter and keep them covered while they break in.",
    objective: `Capture ${FACTORIES_TO_CAPTURE} factories with your Infantry.`,
    boss: "heavyCannon",
    goal: `Capture ${FACTORIES_TO_CAPTURE} factories`,
    setup: { units: [["lightHarvester", "tank", "infantry", "infantry", "transporter"],
      ["lightHarvester", "scoutBike", "tank", "infantry", "transporter"]],
    crystals: [100, 80] },
    newUnits: ["transporter"],
    ai: "default",
    done: (state) => factoriesOf(state, HUMAN)
      .filter((f) => f.id !== state.players[HUMAN].factoryId).length >= FACTORIES_TO_CAPTURE,
  },
  {
    title: "Swarm",
    mapId: "map-6-3-4-4-3",
    story: "The Consortium has switched to swarms of cheap, fast Scout Bikes. One at a time " +
      "they are easy prey, but there are a lot of them. Your factory has Heavy works and a " +
      "Blast Cannon: its cluster bomb hits the target and every enemy next to it.",
    tip: { title: "Top tip", text: "Fire the Blast Cannon at a Scout Bike with others " +
      "beside it: they all take half its attack. It fires every other turn, so keep it " +
      "behind your Tanks." },
    objective: `Destroy ${SCOUTS_TO_DESTROY} of Green's Scout Bikes.`,
    boss: "heavyCannon",
    goal: `Destroy ${SCOUTS_TO_DESTROY} Scout Bikes`,
    setup: { units: [["lightHarvester", "blastCannon", "tank"],
      ["lightHarvester", "scoutBike", "scoutBike", "scoutBike", "scoutBike", "scoutBike"]],
    crystals: [100, 150], upgrades: [["heavyWorks"], []] },
    newUnits: ["blastCannon", "heavyTank"],
    newUpgrades: ["heavyWorks"],
    ai: "default",
    aiMix: { scoutBike: 1 },
    done: (state) => greenLost(state, "scoutBike") >= SCOUTS_TO_DESTROY,
  },
  {
    title: "Sky Hunters",
    mapId: "map-9-4-5-5-4",
    story: "Green has an Airfield, and its Attack Helicopters are already in the air. Tanks " +
      "cannot hit them. You need anti-aircraft fast: Anti-Aircraft Jeeps, Infantry, or " +
      "Fighters if you build an Airfield of your own.",
    objective: `Shoot down ${HELICOPTERS_TO_DESTROY} Attack Helicopters.`,
    boss: "fighter",
    goal: `Shoot down ${HELICOPTERS_TO_DESTROY} Attack Helicopters`,
    setup: { units: [["lightHarvester", "antiAircraftJeep", "tank", "infantry"],
      ["lightHarvester", "tank", "attackHelicopter", "attackHelicopter", "attackHelicopter",
        "spotterDrone"]],
    crystals: [120, 150], upgrades: [[], ["airfield"]] },
    newUnits: ["fighter", "spotterDrone"],
    ai: "default",
    aiMix: { attackHelicopter: 0.8, tank: 0.2 },
    done: (state) => greenLost(state, "attackHelicopter") >= HELICOPTERS_TO_DESTROY,
  },
  {
    title: "The Pass",
    mapId: "map-7-4-5-5-4",
    terrain: ridgeWithPass,
    story: "A mountain ridge splits the valley, with one narrow pass through it, and Green's " +
      "tank column is heading for it. The Sonic Tank's boom hits every enemy in a straight " +
      "line: wait at the far end of the pass and catch them as they file through.",
    tip: { title: "Top tip", text: "Line the Sonic Tank up with the pass. Every enemy on " +
      "that line, up to its range, is hit by the same shot." },
    objective: `Destroy ${TANKS_TO_DESTROY} of Green's Tanks.`,
    boss: "blastCannon",
    goal: `Destroy ${TANKS_TO_DESTROY} Tanks`,
    setup: { units: [["lightHarvester", "sonicTank", "tank"],
      ["lightHarvester", "tank", "tank", "tank"]], crystals: [120, 150],
    upgrades: [["heavyWorks"], []] },
    newUnits: ["sonicTank"],
    ai: "default",
    aiMix: { tank: 1 },
    done: (state) => greenLost(state, "tank") >= TANKS_TO_DESTROY,
  },
  {
    title: "The Maid's March",
    mapId: "map-10-5-6-6-5",
    story: "Commander Jeanne, the leader the colonists will follow, has landed far from any " +
      "Blue base. You have no factory and cannot build: only her escort stands between her " +
      "and Green. Bring her to the old factory on the far side of the valley.",
    objective: "Get Commander Jeanne into the far factory. If she falls, the mission fails.",
    target: farFactory,
    setup: { units: [["vip", "tank", "tank", "scoutBike", "lightMedic"],
      ["lightHarvester", "tank", "tank", "scoutBike", "scoutBike", "antiAircraftJeep",
        "attackHelicopter"]],
    crystals: [0, 150], noHome: [true, false] },
    noSurrender: true,
    ai: "default",
    done: (state) => factoryAt(state, farFactory(state.map))?.owner === HUMAN,
    failed: (state) => !vipAlive(state),
    failText: "Commander Jeanne has fallen.",
  },
  {
    title: "The Crystal War",
    mapId: "map-21-4-5-6-5-4",
    story: "The Consortium has brought its main army to Kharon, and its best commander. Its " +
      "factory is ringed by Turrets and fitted with a Crystal lab. Artillery outranges a " +
      "Turret; everything else is yours to choose. Finish this.",
    objective: "Overrun Green's home factory.",
    boss: "heavyCannon",
    goal: "Overrun Green's home factory",
    setup: { units: [
      ["lightHarvester", "scoutBike", "tank", "tank", "artillery", "infantry", "infantry"],
      ["lightHarvester", "lightHarvester", "scoutBike", "tank", "heavyTank", "infantry",
        "turret", "twinTurret", "artillery", "chinook", "fighter", "crystalSeeder"]],
    crystals: [200, 200],
    upgrades: [[], ["lab", "heavyWorks", "airfield"]] },
    newUnits: ["heavyCannon"],
    ai: "evolved",
    done: null,
  },
];

// A mission with a boss: Green starts with it, and destroying it is the first step of the
// objective. A mission won the usual way (done null) is still won by overrunning Green's
// home, which ends the game whether or not the boss is down.
function withBoss(mission) {
  if (!mission.boss) return mission;
  const name = RULES.units[mission.boss].name;
  const steps = [
    { text: `Destroy Green's ${name}`, done: (state) => greenLost(state, mission.boss) > 0 },
    { text: mission.goal, done: mission.done || (() => false) },
  ];
  const [blue, green] = mission.setup.units;
  return {
    ...mission,
    objective: `${mission.objective} Green's ${name} leads its army: destroy it.`,
    steps,
    setup: { ...mission.setup, units: [blue, [mission.boss, ...green]] },
    done: mission.done ? (state) => steps.every((step) => step.done(state)) : null,
  };
}

// What each mission lets both sides build: everything unlocked so far.
function withUnlocks(missions) {
  let units = [];
  let upgrades = [];
  return missions.map((mission) => {
    units = [...units, ...(mission.newUnits || [])];
    upgrades = [...upgrades, ...(mission.newUpgrades || [])];
    return { ...mission, newUnits: mission.newUnits || [], newUpgrades: mission.newUpgrades || [],
      rules: { ...mission.rules, allowedUnits: units, allowedUpgrades: upgrades } };
  });
}

export const MISSIONS = withUnlocks(MISSION_LIST.map(withBoss));

// The map for a mission: the generated map with the mission's terrain changes.
export function missionMap(mission, map, rules) {
  if (mission.terrain) mission.terrain(map, rules);
  return map;
}

// The rules for a mission: the game's rules with the mission's changes.
export function missionRules(mission, rules) {
  return { ...structuredClone(rules), ...mission.rules };
}

// How many missions are finished (they are played in order).
export function missionsDone() {
  try {
    const done = Number(localStorage.getItem(PROGRESS_KEY));
    return Number.isInteger(done) && done >= 0 ? Math.min(done, MISSIONS.length) : 0;
  } catch {
    return 0;
  }
}

// A mission won, at the rank (difficulty level id) it was played at.
export function markMissionDone(index, rank = null) {
  try {
    if (index + 1 > missionsDone()) localStorage.setItem(PROGRESS_KEY, String(index + 1));
    if (!rank) return;
    const ranks = missionRanks();
    const order = (id) => LEVELS.findIndex((level) => level.id === id);
    if (order(rank) > order(ranks[index])) {
      localStorage.setItem(RANKS_KEY, JSON.stringify({ ...ranks, [index]: rank }));
    }
  } catch {
    // Not remembered; the mission still counts as won this time.
  }
}

// The highest rank each mission has been won at, by mission index.
export function missionRanks() {
  try {
    const ranks = JSON.parse(localStorage.getItem(RANKS_KEY));
    return ranks && typeof ranks === "object" ? ranks : {};
  } catch {
    return {};
  }
}
