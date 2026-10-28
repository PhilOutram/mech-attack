// Balance numbers and rule switches for the digital game and the simulator.
// The engine reads everything tunable from here, so balance changes never touch engine code.
// Values marked "provisional" are not settled with Phil yet; each one is listed in
// docs/rules.md. Unit stats are the playtested "Game 2" set from Unit Table.xlsx.

export const RULES = {
  // Each unit tile has two sides: undamaged, and damaged (explosion).
  lives: 2,

  units: {
    scoutBike: {
      name: "Scout Bike", cost: 30, move: 6, defence: 10, attack: 15,
      range: [1, 1], storage: 30, healing: 0, sight: 4,
    },
    tank: {
      name: "Tank", cost: 70, move: 4, defence: 25, attack: 25,
      range: [1, 2], storage: 0, healing: 0, sight: 3,
    },
    heavyCannon: {
      name: "Heavy Cannon", cost: 110, move: 2, defence: 40, attack: 40,
      range: [1, 3], storage: 0, healing: 0, sight: 3,
    },
    artillery: {
      name: "Artillery", cost: 70, move: 2, defence: 10, attack: 30,
      range: [2, 5], storage: 0, healing: 0, sight: 3,
      needsSetup: true,
    },
    lightHarvester: {
      name: "Light Harvester", cost: 50, move: 6, defence: 15, attack: 0,
      range: null, storage: 90, healing: 0, sight: 2,
    },
    lightMedic: {
      name: "Light Medic", cost: 40, move: 5, defence: 15, attack: 0,
      range: null, storage: 0, healing: 25, healRange: 1, sight: 3,
    },
    // Headquarters factory: builds units and is the target for winning. Defence and sight
    // come from the Factory row of the full unit table (provisional for Game 2).
    factory: {
      name: "Factory", cost: null, move: 0, defence: 100, attack: 0,
      range: null, storage: 0, healing: 0, sight: 4,
      isFactory: true,
    },
  },

  combat: {
    // Lives lost when the attack total on a target in one turn reaches these multiples
    // of its defence. Attacks by several units in the same turn add together.
    loseOneLifeAt: 1,
    loseTwoLivesAt: 2,
    // Provisional: a unit with maximum range up to this value, attacked from an adjacent
    // hex and still alive, hits back once at its full attack.
    returnFireMaxRange: 3,
  },

  // moveCost null = cannot be entered. defenceBonus is added to a unit's defence on that hex.
  terrain: {
    plain: { moveCost: 1, defenceBonus: 0, blocksSight: false },
    rocky: { moveCost: 2, defenceBonus: 5, blocksSight: false }, // provisional
    mountain: { moveCost: null, defenceBonus: 0, blocksSight: true }, // provisional
    chasm: { moveCost: null, defenceBonus: 0, blocksSight: false }, // provisional
  },

  crystals: {
    harvestFrom: "adjacent", // stop next to crystals to harvest them
    crushedByMovement: true, // units can drive over crystals, which destroys them
    startAmount: 50, // each of the map's starting piles
    spawnPerRound: 1, // provisional
    spawnAmount: 10,
    growthPerRound: 10, // every pile, each round it is not harvested
    explodeAt: 80, // a pile that grows to this explodes and its crystals are lost
    spawnMinDistanceFromFactory: 3, // provisional
  },

  start: {
    crystals: 50, // provisional
    units: ["lightHarvester", "scoutBike", "tank"], // provisional
  },

  // "tiles": as on the table, a seven-hex block is turned over for both players as soon as
  // any unit can see one of its hexes, and everything on it stays visible.
  // "sight": each player sees only what their units can see now.
  // revealRange (tiles mode only): how close a unit must be to a block to turn it over.
  // null = within the unit's sight range; 1 = only blocks it is on or next to (Phil's choice,
  // 28 October 2026).
  fog: { mode: "tiles", revealRange: 1 },

  // Provisional: a game reaching this round ends with no winner.
  roundCap: 100,
};
