// The campaign "Red Dust" (Phil, 29 October 2026): five missions that introduce the game, each
// on a bigger map with more to do. A mission sets the map, the starting units and crystals,
// any rule changes, how the AI plays, and its objective; finishing one unlocks the next.
// Progress is remembered on this device.
import { unitsOf, factoriesOf } from "./engine.js?v=0.28";

const PROGRESS_KEY = "mech-attack.campaign";
const HUMAN = 0;

export const CAMPAIGN_NAME = "Red Dust";

// done(state): the objective is met (the mission is won). null: win the usual way, by
// destroying Green's home factory. ai: "default" is the gentler hand-tuned AI, "evolved" the
// strongest. Crystal targets and counts are kept here, next to the text that names them.
const BANK_TARGET = 200;
const FACTORIES_TO_CAPTURE = 3;

export const MISSIONS = [
  {
    title: "Landfall",
    mapId: "map-3",
    story: "The Blue Expedition has landed on Kharon, a red world rich in power crystals. " +
      "Your drop ship came down beside an old factory. All you have is one Scout Bike, but " +
      "crystals glitter in the dust nearby, and the factory can still build.",
    objective: "Harvest crystals with your Scout Bike, bring them back to the factory and " +
      "build a Tank.",
    setup: { units: [["scoutBike"], []], crystals: [20, 0] },
    rules: { loseWithNoUnits: false },
    ai: "default",
    done: (state) => unitsOf(state, HUMAN).some((u) => u.type === "tank"),
  },
  {
    title: "Supply Lines",
    mapId: "map-8",
    story: "The factory hums again, and a proper Light Harvester has joined you. But you are " +
      "not alone: Green Consortium scouts have been seen in the hills, and they want these " +
      "crystals too.",
    objective: `Bank ${BANK_TARGET} crystals in your store. Protect your harvester.`,
    setup: { units: [["lightHarvester", "scoutBike"], ["lightHarvester", "scoutBike"]],
      crystals: [60, 50] },
    rules: {},
    ai: "default",
    done: (state) => state.players[HUMAN].crystals >= BANK_TARGET,
  },
  {
    title: "First Contact",
    mapId: "map-5-3-4-4-3",
    story: "The Consortium has built a factory across the plateau and its tanks are rolling. " +
      "Command has sent you two Tanks. Strike before Green grows too strong.",
    objective: "Destroy Green's home factory. Fire with several units at once to break " +
      "tough targets.",
    setup: { units: [["lightHarvester", "scoutBike", "tank", "tank"],
      ["lightHarvester", "scoutBike", "tank"]], crystals: [80, 60] },
    rules: {},
    ai: "default",
    done: null,
  },
  {
    title: "Storm the Works",
    mapId: "map-12-4-5-5-4",
    story: "Between the two bases stand abandoned mining factories, still able to build and " +
      "worth crystals every turn to whoever holds them. Your Infantry can take them, but " +
      "they are weak: carry them in the Transporter and keep them covered. The nearest two " +
      "are easy; the third means storming Green's side of the map.",
    objective: `Capture ${FACTORIES_TO_CAPTURE} factories with your Infantry.`,
    setup: { units: [["lightHarvester", "tank", "infantry", "infantry", "transporter"],
      ["lightHarvester", "scoutBike", "tank", "infantry"]], crystals: [100, 80] },
    rules: {},
    ai: "default",
    done: (state) => factoriesOf(state, HUMAN)
      .filter((f) => f.id !== state.players[HUMAN].factoryId).length >= FACTORIES_TO_CAPTURE,
  },
  {
    title: "The Crystal War",
    mapId: "map-21-4-5-6-5-4",
    story: "The Consortium has brought its main army to Kharon. Its commanders are the best " +
      "it has, and they start stronger than you. Build up, upgrade your factories for heavy " +
      "and air units, and finish this.",
    objective: "Destroy Green's home factory.",
    setup: { units: [["lightHarvester", "scoutBike", "tank", "infantry"],
      ["lightHarvester", "lightHarvester", "scoutBike", "tank", "tank", "infantry"]],
    crystals: [150, 200] },
    rules: {},
    ai: "evolved",
    done: null,
  },
];

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

export function markMissionDone(index) {
  if (index + 1 <= missionsDone()) return;
  try {
    localStorage.setItem(PROGRESS_KEY, String(index + 1));
  } catch {
    // Not remembered; the mission still counts as won this time.
  }
}
