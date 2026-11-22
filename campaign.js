// The campaign "Red Dust" (Phil, 29 October 2026): missions that introduce the game, each
// built round a unit or tactic the player has to use, on bigger maps as it goes on. A mission
// sets the map (and may reshape its terrain), the starting units and crystals, any rule
// changes, how the AI plays, and its objective; finishing one unlocks the next. Progress is
// remembered on this device.
import { RULES } from "./rules-config.js?v=0.90";
import { unitsOf, factoriesOf } from "./engine.js?v=0.90";
import { distance, cheapestPaths } from "./hex.js?v=0.90";
import { LEVELS } from "./difficulty.js?v=0.90";

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
// - training (optional): one of the first missions, which teach the game (Phil, 22 November
//   2026). They play the same at every rank, every shot gets a combat report that stays up
//   until it is read (reports), and lessons come up one at a time as they are needed:
//   lessons are { title, text, when(c), covers } where c is { state, view, selected, mode,
//   me } and covers lists the usual tips the lesson stands in for.
// - done(state): the objective is met (the mission is won). null: win the usual way, by
//   overrunning Green's home factory. steps (optional): the objective in parts, ticked off in
//   the panel as they are done.
// - failed(state) (optional): the mission is lost, with failText saying why.
// - boss (optional): a heavy unit Green starts with, leading its army, which the player must
//   destroy as well as meet the objective (Phil, 29 October 2026); goal names the objective
//   as the second step. Across the campaign Green starts with every kind of unit, so the
//   player meets them all.
// Targets and counts are kept here, next to the text that names them.
const BANK_TARGET = 100;
const SUPPLY_CRYSTALS = 40;
const GUARDS = 2;
const DUG_IN_TANKS = 2;
const DUG_IN_CRYSTALS = [60, 40];
const BUILD_CRYSTALS = 160;
// First Shots on map-1: your squad lands six hexes from the guards, out of their sight, with
// the Infantry behind the Scout Bikes; the guards stand next to the outpost.
const FIRST_SHOTS_STARTS = ["-3,2", "-3,3", "-4,3"];
const FIRST_SHOTS_GUARDS = ["3,2", "3,3"];
// Build an Army on map-4: a short ridge across the middle to steer round.
const BUILD_RIDGE = ["1,-1", "1,0", "1,1"];
// Dug In: rocky ground this far round Green's home factory.
const DUG_IN_RADIUS = 2;
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
  crystalSeeder: "Plants new crystal piles from your store.",
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
const greenHomeTaken = (state) =>
  state.units[state.players[AI_PLAYER].factoryId]?.owner === HUMAN;

// ---------------------------------------------------------------------------------------
// The training missions' lessons (Phil, 22 November 2026)

const STATS = RULES.units;
const TWICE = RULES.combat.loseTwoLivesAt;
const ROCKY = RULES.terrain.rocky.defenceBonus;
const ownUnits = (c) => Object.values(c.view.units).filter((u) => u.owner === c.me &&
  !STATS[u.type].isFactory);
const enemyUnits = (c) => Object.values(c.view.units).filter((u) => u.owner !== null &&
  u.owner !== c.me && !STATS[u.type].isFactory);
const always = () => true;
const selectedOwn = (c) => Boolean(c.selected) && c.selected.owner === c.me &&
  !STATS[c.selected.type].isFactory;
const movedOne = (c) => ownUnits(c).some((u) => u.moved);
const enemyInSight = (type) => (c) => enemyUnits(c).some((u) => !type || u.type === type);
const firing = (c) => c.mode === "fire";
const damaged = (c) => ownUnits(c).some((u) => u.lives < RULES.lives);
const enemyOnRocky = (c) => enemyUnits(c).some((u) =>
  c.view.map.hexes[u.at]?.terrain === "rocky");

const FIRST_SHOTS_LESSONS = [
  {
    title: "Your squad",
    text: "You are Blue. Your two Scout Bikes are fast fighters. Your Infantry are slow and " +
      "weak, but only Infantry can take a factory, so keep them safe. Tap a Scout Bike to " +
      "select it.",
    when: always,
    // Harvesting waits for Supply Lines, which has its own lesson on it.
    covers: ["welcome", "harvester"],
  },
  {
    title: "Moving",
    text: `A Scout Bike moves up to ${STATS.scoutBike.move} hexes a turn: the lit hexes ` +
      "show where it can go. Tap one to move there. The map starts face down and blocks " +
      "turn over as your units come near. A move stops when new ground turns over or an " +
      "enemy comes into view, and the unit keeps the rest of its move: tap again to go on.",
    when: selectedOwn,
    covers: ["newGround"],
  },
  {
    title: "Ending your turn",
    text: "Move your other units too. When they have done what they can, press End turn " +
      "and Green moves. Keep your Infantry behind the Scout Bikes for now.",
    when: movedOne,
  },
  {
    title: "Enemy in sight",
    text: "Green Infantry guard the outpost. Every unit has two lives. A shot whose attack " +
      "reaches the target's defence takes one life, and the tile flips over to its damaged " +
      `side. An attack of ${TWICE === 2 ? "twice" : `${TWICE} times`} the defence or more ` +
      `takes both lives at once. Your Scout Bike's attack is ${STATS.scoutBike.attack} and ` +
      `an Infantry's defence is ${STATS.infantry.defence}: ${STATS.scoutBike.attack} is at ` +
      `least ${TWICE * STATS.infantry.defence}, so one shot destroys it.`,
    when: enemyInSight(),
  },
  {
    title: "Firing",
    text: `Red hexes are targets in range. A Scout Bike has range ${STATS.scoutBike.range[1]}` +
      ", so it fires from the hex next to its target. Tap a red hex to fire. Watch out: a " +
      "unit fired on from next door fires back at the same time. After each shot a report " +
      "says what happened and why.",
    when: firing,
    covers: ["combat"],
  },
  {
    title: "A damaged unit",
    text: "One of your units has lost a life, and its tile has flipped to the damaged side. " +
      "Another hit that reaches its defence in one turn will destroy it, so think about " +
      "pulling it back. Damage that took no life is cleared at the end of each turn; lost " +
      "lives stay lost.",
    when: damaged,
  },
  {
    title: "Take the outpost",
    text: "The guards are down. Move your Infantry next to the factory. Infantry must start " +
      "a turn next to a factory before they can break in: next turn, tap them, then tap the " +
      "factory to move in and take it.",
    when: (c) => greenLost(c.state, "infantry") >= GUARDS,
    covers: ["infantry", "siege"],
  },
];

const BUILD_LESSONS = [
  {
    title: "Your factory",
    text: "Tap your factory to see what it can build and what each unit costs. Pick a unit, " +
      "then tap a lit hex next to the factory to put it there. New units can act from your " +
      "next turn, so build early.",
    when: always,
    covers: ["welcome", "factory"],
  },
  {
    title: "Tanks",
    text: `A Tank has attack ${STATS.tank.attack}, defence ${STATS.tank.defence} and range ` +
      `${STATS.tank.range[0]} to ${STATS.tank.range[1]}: it can fire from two hexes away. ` +
      "Only units right next to their attacker fire back, so a Tank firing from two hexes " +
      "takes no return fire.",
    when: (c) => ownUnits(c).some((u) => u.type === "tank"),
    covers: ["built:tank"],
  },
  {
    title: "Defence",
    text: `Green's Scout Bike has attack ${STATS.scoutBike.attack}, less than a Tank's ` +
      `defence of ${STATS.tank.defence}: on its own it cannot hurt a Tank at all. Its ` +
      `Infantry (attack ${STATS.infantry.attack}) cannot either. Your Infantry are another ` +
      `matter: defence ${STATS.infantry.defence}.`,
    when: enemyInSight("scoutBike"),
  },
];

const SUPPLY_LESSONS = [
  {
    title: "Crystals",
    text: "Crystals pay for new units. Drive the Light Harvester next to a crystal pile and " +
      `tap Harvest: it carries up to ${STATS.lightHarvester.storage}. Bring it back next to ` +
      "your factory and it unloads into your store by itself. A Scout Bike can carry " +
      `${STATS.scoutBike.storage} too.`,
    when: always,
    covers: ["welcome", "harvester"],
  },
  {
    title: "Spend them",
    text: `You can afford a Tank (${STATS.tank.cost} crystals). Tap your factory to build ` +
      "one, and Infantry to overrun Green's factory.",
    when: (c) => c.view.players[c.me].crystals >= STATS.tank.cost,
  },
];

const DUG_IN_LESSONS = [
  {
    title: "Fire together",
    text: "Attacks on the same unit in one turn add up. A Tank's defence is " +
      `${STATS.tank.defence}: one Tank's shot (${STATS.tank.attack}) takes one life, and ` +
      `two Tanks firing in the same turn make ${2 * STATS.tank.attack}, twice its defence, ` +
      "which destroys it. Fire one unit at a time: the total carries on until the end of " +
      "the turn, then starts again from nothing.",
    when: always,
    covers: ["welcome"],
  },
  {
    title: "Dug in",
    text: `A ground unit on rocky ground gets +${ROCKY} defence. A Tank there has defence ` +
      `${STATS.tank.defence + ROCKY}, so one Tank's ${STATS.tank.attack} does nothing at ` +
      `all, two Tanks (${2 * STATS.tank.attack}) take one life, and it takes ` +
      `${TWICE * (STATS.tank.defence + ROCKY)} to destroy it: add a Scout Bike ` +
      `(${STATS.scoutBike.attack}) or Infantry (${STATS.infantry.attack}) to the same ` +
      "turn's fire.",
    when: enemyOnRocky,
    covers: ["rough"],
  },
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

// A clean field for the first missions: plain ground everywhere, with only the features
// given ({ mountain: [hexes], rocky: [hexes] }), and no crystals, unused factories or ruins
// to distract.
function trainingGround(features) {
  return (map) => {
    for (const k in map.hexes) map.hexes[k] = { ...map.hexes[k], terrain: "plain" };
    for (const [terrain, hexes] of Object.entries(features)) {
      for (const k of hexes) map.hexes[k] = { ...map.hexes[k], terrain };
    }
    map.deposits = [];
    map.neutralFactories = [];
    map.ruins = [];
  };
}

// Dug In: rocky ground round Green's home factory, where its Tanks start, and no unused
// factories or ruins.
function dugIn(map, rules) {
  const home = map.factories[AI_PLAYER];
  const ring = Object.keys(map.hexes).filter((k) => k !== home &&
    distance(k, home) <= DUG_IN_RADIUS && rules.terrain[map.hexes[k].terrain].moveCost !== null);
  for (const k of ring) map.hexes[k] = { ...map.hexes[k], terrain: "rocky" };
  map.deposits = map.deposits.filter((d) => !ring.includes(d.at));
  map.neutralFactories = [];
  map.ruins = [];
}

// ---------------------------------------------------------------------------------------
// The missions

const MISSION_LIST = [
  {
    title: "First Shots",
    mapId: "map-1",
    terrain: trainingGround({}),
    training: true,
    reports: true,
    lessons: FIRST_SHOTS_LESSONS,
    story: "The Blue Expedition has reached Kharon, a red world rich in power crystals. Your " +
      "drop ship has set down two Scout Bikes and a squad of Infantry near a Green " +
      "Consortium outpost. Two Green Infantry guard it. Clear them out, then take the " +
      "outpost: it will be your first base.",
    objective: "Destroy the two Green Infantry, then take the outpost with your Infantry. " +
      "If your Infantry fall, the mission fails.",
    steps: [
      { text: "Destroy the two Green Infantry guards",
        done: (state) => greenLost(state, "infantry") >= GUARDS },
      { text: "Take the outpost with your Infantry", done: greenHomeTaken },
    ],
    setup: { units: [["scoutBike", "scoutBike", "infantry"], Array(GUARDS).fill("infantry")],
      crystals: [0, 0], noHome: [true, false],
      starts: [FIRST_SHOTS_STARTS, FIRST_SHOTS_GUARDS] },
    newUnits: ["infantry", "scoutBike"],
    // The outpost has nothing to build with, so it is not lost when its guards are.
    rules: { loseWithNoUnits: false },
    noSurrender: true,
    ai: "default",
    done: null,
    failed: (state) => !owns(state, "infantry") && !greenHomeTaken(state),
    failText: "Your Infantry have fallen: there is nobody left to take the outpost.",
  },
  {
    title: "Build an Army",
    mapId: "map-4",
    terrain: trainingGround({ mountain: BUILD_RIDGE }),
    training: true,
    reports: true,
    lessons: BUILD_LESSONS,
    story: "The outpost is yours, and its store holds " + `${BUILD_CRYSTALS} crystals. ` +
      "Command has sent the plans for the Tank, the workhorse of the expedition. Across " +
      "the plain, Green holds a second outpost with a Scout Bike and two Infantry. They " +
      "have nothing left to build with. Build an army and take it.",
    objective: "Build Tanks and Infantry at your factory, then overrun Green's outpost.",
    steps: [
      { text: "Build a Tank", done: (state) => owns(state, "tank") },
      { text: "Build Infantry", done: (state) => owns(state, "infantry") },
      { text: "Overrun Green's outpost with your Infantry", done: greenHomeTaken },
    ],
    setup: { units: [["scoutBike"], ["scoutBike", "infantry", "infantry"]],
      crystals: [BUILD_CRYSTALS, 0] },
    newUnits: ["tank"],
    rules: { loseWithNoUnits: false },
    noSurrender: true,
    ai: "default",
    done: null,
  },
  {
    title: "Supply Lines",
    mapId: "map-8",
    training: true,
    reports: true,
    lessons: SUPPLY_LESSONS,
    story: "The outposts hum again, but their stores are nearly empty. Command has sent a " +
      "Light Harvester, and the plans for a Crystal lab, which grows crystals inside a " +
      "factory every turn, and a Crystal Seeder, which plants new piles. Green has a base " +
      "across the hills and is after the same crystals. Harvest, build, and take Green's " +
      "base.",
    objective: `Harvest crystals until you have ${BANK_TARGET} in your store, build a ` +
      "Tank, then overrun Green's home factory.",
    steps: [
      { text: `Have ${BANK_TARGET} crystals in your store`,
        done: (state) => state.players[HUMAN].crystals >= BANK_TARGET },
      { text: "Build a Tank", done: (state) => owns(state, "tank") },
      { text: "Overrun Green's home factory", done: greenHomeTaken },
    ],
    setup: { units: [["lightHarvester", "scoutBike"], ["lightHarvester", "scoutBike"]],
      crystals: [SUPPLY_CRYSTALS, SUPPLY_CRYSTALS] },
    // The Light Medic waits for First Contact, where there is fighting to repair (Phil, 31
    // October 2026).
    newUnits: ["lightHarvester", "crystalSeeder"],
    newUpgrades: ["lab"],
    ai: "default",
    // Green races for crystals here; it does not send Infantry at your factory yet.
    aiGenes: { captureFactories: 0 },
    done: null,
  },
  {
    title: "Dug In",
    mapId: "map-13-3-4-4-3",
    terrain: dugIn,
    training: true,
    reports: true,
    lessons: DUG_IN_LESSONS,
    story: "Green has dug in round its base, on rocky ground that shields its units. Its " +
      "two Tanks are tougher than anything you have met, and no single shot of yours can " +
      "stop one. Fire together: attacks on the same unit in one turn add up.",
    objective: `Destroy Green's ${DUG_IN_TANKS} Tanks, then overrun its home factory.`,
    steps: [
      { text: `Destroy Green's ${DUG_IN_TANKS} Tanks`,
        done: (state) => greenLost(state, "tank") >= DUG_IN_TANKS },
      { text: "Overrun Green's home factory", done: greenHomeTaken },
    ],
    setup: { units: [
      ["lightHarvester", "tank", "tank", "scoutBike", "infantry", "infantry"],
      ["lightHarvester", ...Array(DUG_IN_TANKS).fill("tank"), "infantry"]],
    crystals: [DUG_IN_CRYSTALS[HUMAN], DUG_IN_CRYSTALS[AI_PLAYER]] },
    ai: "default",
    done: null,
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
    newUnits: ["artillery", "lightMedic"],
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

// Which of a mission's steps are done: each one ticked once it has been done, even if it is
// undone later (state.campaign.ticked, kept by the game screen).
export function stepsDone(mission, state) {
  const ticked = (state.campaign && state.campaign.ticked) || [];
  return (mission.steps || []).map((step, i) => Boolean(ticked[i]) || step.done(state));
}

// Progress saved before the training missions (v0.90) counted the old list, which began with
// Landfall and Supply Lines. Landfall's lessons are now the first two missions and Supply
// Lines is the third; after that every mission is two places on, and Dug In counts as done
// for anyone who had got past Supply Lines.
const LAYOUT_KEY = "mech-attack.campaign-layout";
const LAYOUT = "training";
const OLD_SUPPLY_LINES = 1;
const MISSIONS_ADDED = 2;

function movedOn(index) {
  return index <= OLD_SUPPLY_LINES ? index + 1 : index + MISSIONS_ADDED;
}

function upgradeProgress() {
  if (localStorage.getItem(LAYOUT_KEY) === LAYOUT) return;
  const done = Number(localStorage.getItem(PROGRESS_KEY));
  if (Number.isInteger(done) && done > 0) {
    localStorage.setItem(PROGRESS_KEY, String(done > OLD_SUPPLY_LINES ? done + MISSIONS_ADDED
      : done + 1));
  }
  const ranks = JSON.parse(localStorage.getItem(RANKS_KEY) || "null");
  if (ranks && typeof ranks === "object") {
    const moved = {};
    for (const [index, rank] of Object.entries(ranks)) moved[movedOn(Number(index))] = rank;
    localStorage.setItem(RANKS_KEY, JSON.stringify(moved));
  }
  localStorage.setItem(LAYOUT_KEY, LAYOUT);
}

// How many missions are finished (they are played in order).
export function missionsDone() {
  try {
    upgradeProgress();
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
    upgradeProgress();
    const ranks = JSON.parse(localStorage.getItem(RANKS_KEY));
    return ranks && typeof ranks === "object" ? ranks : {};
  } catch {
    return {};
  }
}
