// Difficulty levels for a game against the AI (Phil, 29 October 2026). The player picks the
// rank they play at; each rank faces its own Consortium commander, who plays in their own way
// and starts with more or less than you. Campaign missions set their own opponent instead.
import { RULES } from "./rules-config.js?v=0.78";

const LEVEL_KEY = "mech-attack.level";

// ai: "default" is the hand-tuned AI, "evolved" one of the evolved personalities (picked by
// the game's seed), "best" the strongest of them. Extra crystals and units are on top of the
// usual start (rules.start) for each side; upgrades are fitted to each home factory at the
// start; firstPlayer: who moves first (blue unless given). The second player's usual extra
// crystals go to whoever moves second.
export const LEVELS = [
  {
    id: "cadet",
    rank: "Cadet",
    level: "Beginner",
    opponent: "Sergeant Brack",
    persona: "A by-the-book drill sergeant. Builds slowly, never takes a risk, and gives a " +
      "new officer room to learn. You start with extra crystals.",
    ai: "default",
    extraCrystals: [30, -RULES.start.secondPlayerCrystals],
    extraUnits: [[], []],
    campaign: { note: "Easier: you start with 30 more crystals and Green with 30 fewer, " +
      "against its gentlest commander.", extraCrystals: [30, -30], extraUnits: [[], []],
    ai: "default" },
  },
  {
    id: "major",
    rank: "Major",
    level: "Intermediate",
    opponent: "Colonel Rane",
    persona: "A seasoned field officer who plays the whole board. A fair fight.",
    ai: "evolved",
    extraCrystals: [0, 0],
    extraUnits: [[], []],
    campaign: { note: "Each mission as designed.", extraCrystals: [0, 0],
      extraUnits: [[], []], ai: null },
  },
  {
    id: "marshal",
    rank: "Field Marshal",
    level: "Master",
    opponent: "General Kaldra",
    persona: "The Consortium's iron general, at the head of its best army. Starts with more " +
      "crystals and an extra Tank.",
    ai: "best",
    extraCrystals: [0, 60],
    extraUnits: [[], ["tank"]],
    campaign: { note: "Harder: Green has 60 more crystals, an extra Tank and a sharper " +
      "commander.", extraCrystals: [0, 60], extraUnits: [[], ["tank"]], ai: "evolved" },
  },
  // Insane (Phil, 29 October 2026): so hard that a human win is rare and worth studying.
  // Provisional: Green moves first with a big head start, and you get no second player's
  // crystals.
  {
    id: "insane",
    rank: "Supreme Commander",
    level: "Insane",
    opponent: "The Overseer",
    persona: "The Consortium's war computer. It moves first, starts with 120 more crystals, " +
      "two extra Tanks and Heavy works already built. Beat it and you have beaten the best.",
    ai: "best",
    firstPlayer: 1,
    extraCrystals: [-RULES.start.secondPlayerCrystals, 120],
    extraUnits: [[], ["tank", "tank"]],
    upgrades: [[], ["heavyWorks"]],
    campaign: { note: "Brutal: Green has 120 more crystals, two extra Tanks and the " +
      "Consortium's best commander.", extraCrystals: [0, 120],
    extraUnits: [[], ["tank", "tank"]], ai: "best" },
  },
];

export const DEFAULT_LEVEL = "major";

export function levelById(id) {
  return LEVELS.find((level) => level.id === id) || levelById(DEFAULT_LEVEL);
}

// A rank also adjusts each campaign mission on top of its own design (Phil, 29 October 2026;
// figures provisional): campaign.extraCrystals and extraUnits are added to the mission's start
// (Green's extra units only where it already has an army), and campaign.ai, when set, replaces
// the mission's AI ("default", "evolved" or "best"). Major plays each mission as designed.
export function missionSetup(level, setup) {
  const { extraCrystals, extraUnits } = level.campaign;
  return {
    ...setup,
    crystals: setup.crystals.map((c, p) => Math.max(0, c + extraCrystals[p])),
    units: setup.units.map((units, p) => (units.length ? [...units, ...extraUnits[p]] : units)),
  };
}

// The starting setup for a game at this level (see newGame in engine.js): the usual start
// plus the level's extras.
export function levelSetup(level, rules) {
  const { crystals, units, secondPlayerCrystals } = rules.start;
  const second = 1 - (level.firstPlayer || 0);
  return {
    units: level.extraUnits.map((extra) => [...units, ...extra]),
    crystals: level.extraCrystals.map((extra, p) =>
      crystals + (p === second ? secondPlayerCrystals : 0) + extra),
    upgrades: level.upgrades || [[], []],
  };
}

// The level last chosen on this device.
export function storedLevel() {
  try {
    return levelById(localStorage.getItem(LEVEL_KEY)).id;
  } catch {
    return DEFAULT_LEVEL;
  }
}

export function storeLevel(id) {
  try {
    localStorage.setItem(LEVEL_KEY, id);
  } catch {
    // Not remembered; the picker still works.
  }
}
