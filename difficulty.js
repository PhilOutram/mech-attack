// Difficulty levels for a game against the AI (Phil, 29 October 2026). The player picks the
// rank they play at; each rank faces its own Consortium commander, who plays in their own way
// and starts with more or less than you. Campaign missions set their own opponent instead.
import { RULES } from "./rules-config.js?v=0.41";

const LEVEL_KEY = "mech-attack.level";

// ai: "default" is the hand-tuned AI, "evolved" one of the evolved personalities (picked by
// the game's seed), "best" the strongest of them. Extra crystals and units are on top of the
// usual start (rules.start) for each side.
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
  },
];

export const DEFAULT_LEVEL = "major";

export function levelById(id) {
  return LEVELS.find((level) => level.id === id) || levelById(DEFAULT_LEVEL);
}

// The starting setup for a game at this level (see newGame in engine.js), with blue moving
// first: the usual start plus the level's extras.
export function levelSetup(level, rules) {
  const { crystals, units, secondPlayerCrystals } = rules.start;
  return {
    units: level.extraUnits.map((extra) => [...units, ...extra]),
    crystals: level.extraCrystals.map((extra, p) =>
      crystals + (p === 1 ? secondPlayerCrystals : 0) + extra),
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
