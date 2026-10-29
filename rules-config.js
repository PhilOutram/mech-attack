// Balance numbers and rule switches for the digital game and the simulator.
// The engine reads everything tunable from here, so balance changes never touch engine code.
// Values marked "provisional" are not settled with Phil yet; each one is listed in
// docs/rules.md. Unit stats are the playtested "Game 2" set from Unit Table.xlsx.

export const RULES = {
  // Each unit tile has two sides: undamaged, and damaged (explosion).
  lives: 2,

  // Costs of units the evolved AI never bought were cut by about a quarter (the Spotter Drone
  // to 15, Phil's figure), 29 October 2026. All provisional.
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
      name: "Heavy Cannon", cost: 80, move: 2, defence: 40, attack: 40,
      range: [1, 3], storage: 0, healing: 0, sight: 3,
      needs: "heavyWorks",
    },
    artillery: {
      name: "Artillery", cost: 50, move: 2, defence: 10, attack: 30,
      range: [2, 5], storage: 0, healing: 0, sight: 3,
      needsSetup: true,
    },
    lightHarvester: {
      name: "Light Harvester", cost: 50, move: 6, defence: 15, attack: 0,
      range: null, storage: 90, healing: 0, sight: 2,
    },
    // Air unit: flies over terrain, units and crystals; only attacks that hit air can hit it
    // (Phil, 28 October 2026). splitMove: it can move, look, and move again until its 5 move
    // points are used.
    spotterDrone: {
      name: "Spotter Drone", cost: 15, move: 5, defence: 5, attack: 0,
      range: null, storage: 0, healing: 0, sight: 5,
      air: true, splitMove: true, needs: "airfield",
    },
    // Infantry (Phil, 28 October 2026): weak and slow, but the only unit that can capture a
    // factory, by moving into it (the troops are used up). "rides": it can board a
    // Transporter. Their guns hit air as well as ground, the cheap answer to the Attack
    // Helicopter (Phil, 29 October 2026; the Scout Bike did this before). Stats provisional.
    infantry: {
      name: "Infantry", cost: 20, move: 3, defence: 5, attack: 10,
      range: [1, 1], storage: 0, healing: 0, sight: 2,
      captures: true, rides: true, hits: "both", size: 1,
    },
    // Transporter: carries "carries" places of passengers, which board by moving onto it and
    // are dropped off next to it. "loads": "infantry" carries only units that ride (Infantry,
    // 1 place each); "ground" carries any ground unit (Infantry 1 place, vehicles 2).
    // Passengers are lost with it. Stats provisional.
    transporter: {
      name: "Transporter", cost: 35, move: 6, defence: 25, attack: 0,
      range: null, storage: 0, healing: 0, sight: 3,
      carries: 2, loads: "infantry",
    },
    // Chinook (Phil, 29 October 2026): a flying transporter. It lifts one vehicle or two
    // Infantry over mountains and chasms. Stats provisional, from the "Transport" row of the
    // full unit table.
    chinook: {
      name: "Chinook", cost: 55, move: 5, defence: 15, attack: 0,
      range: null, storage: 0, healing: 0, sight: 3,
      air: true, carries: 2, loads: "ground", needs: "airfield",
    },
    // Turret (Phil, 29 October 2026): a gun emplacement built next to a factory. It never
    // moves. Stats provisional, scaled down from the "Turret (constructed)" row.
    turret: {
      name: "Turret", cost: 50, move: 0, defence: 35, attack: 25,
      range: [1, 3], storage: 0, healing: 0, sight: 3,
    },
    // The VIP of the campaign mission "The Maid's March": tougher Infantry who can never be
    // built.
    vip: {
      name: "Commander Jeanne", cost: null, move: 3, defence: 10, attack: 10,
      range: [1, 1], storage: 0, healing: 0, sight: 3,
      captures: true, rides: true, hits: "both", size: 1,
    },
    // New units, 28 October 2026. Stats start from the full unit table, costs scaled to the
    // Game 2 prices; all provisional. "hits": what the attack can hit (ground if not given).
    // "needs": the factory upgrade a factory must have to build the unit.
    // Blast Cannon: cluster bomb (enemies next to the target take splash x attack) and it
    // fires every other turn (reload 1).
    blastCannon: {
      name: "Blast Cannon", cost: 65, move: 3, defence: 10, attack: 40,
      range: [2, 4], storage: 0, healing: 0, sight: 3,
      splash: 0.5, reload: 1, needs: "heavyWorks",
    },
    // Sonic Tank: sonic boom hits every enemy on a straight line up to range 5, ground and air.
    sonicTank: {
      name: "Sonic Tank", cost: 60, move: 4, defence: 20, attack: 15,
      range: [1, 5], storage: 0, healing: 0, sight: 4,
      hits: "both", line: true, needs: "heavyWorks",
    },
    antiAircraftJeep: {
      name: "Anti-Aircraft Jeep", cost: 30, move: 5, defence: 15, attack: 30,
      range: [1, 3], storage: 0, healing: 0, sight: 3,
      hits: "air",
    },
    attackHelicopter: {
      name: "Attack Helicopter", cost: 45, move: 5, defence: 10, attack: 20,
      range: [1, 2], storage: 0, healing: 0, sight: 3,
      air: true, needs: "airfield",
    },
    fighter: {
      name: "Fighter", cost: 60, move: 7, defence: 15, attack: 30,
      range: [1, 4], storage: 0, healing: 0, sight: 4,
      air: true, hits: "air", needs: "airfield",
    },
    lightMedic: {
      name: "Light Medic", cost: 40, move: 5, defence: 15, attack: 0,
      range: null, storage: 0, healing: 25, healRange: 1, sight: 3,
    },
    // Factory: builds units. Each player starts with a home factory; bigger maps also have
    // unused factories for infantry to capture. Defence and sight come from the Factory row of
    // the full unit table (provisional for Game 2).
    factory: {
      name: "Factory", cost: null, move: 0, defence: 100, attack: 0,
      range: null, storage: 0, healing: 0, sight: 4,
      isFactory: true,
    },
  },

  // A factory starts out building light ground units only. Each upgrade, bought for one
  // factory, unlocks the units that need it (Phil, 28 October 2026; costs provisional).
  // Crystal lab (Phil, 29 October 2026): the factory makes "income" crystals at the end of
  // each of its owner's turns (cost and income provisional). Heavy works and Airfield cut from
  // 100 to 60 (Phil, 29 October 2026): at 100 the evolved AI hardly ever bought them.
  factoryUpgrades: {
    heavyWorks: { name: "Heavy works", cost: 60 },
    airfield: { name: "Airfield", cost: 60 },
    lab: { name: "Crystal lab", cost: 60, income: 10 },
    // Comms (Phil, 29 October 2026): two allies who both have it in one of their factories
    // see everything either of them sees. Only offered to players with allies.
    comms: { name: "Comms", cost: 30, sharesVision: true },
  },

  // Capturing ("overrunning") factories with infantry (Phil, 29 October 2026):
  // - homeFactories: a player's home factory can be overrun too, which wins the game.
  // - mustStartNextTo: infantry must start their turn next to a factory to break into it, so
  //   the defender gets a turn to deal with them (and a transporter cannot drop them in).
  // - guarded (option for testing): not while one of the owner's units stands next to it.
  // - unusedFactoryCrystals: crystals in an unused factory's store, paid to the first player
  //   to capture it (replaces income from captured factories; provisional).
  capture: { homeFactories: true, guarded: false, mustStartNextTo: true,
    unusedFactoryCrystals: 25 },

  // How a player loses besides running out of units: "homeFactory" when their home factory
  // is destroyed (or captured), "allFactories" only when they have no factory left. Phil:
  // depends on the scenario (28 October 2026).
  winCondition: "homeFactory",
  // A player with no units who cannot afford the cheapest one loses (off in the first campaign
  // mission, where Green has nothing).
  loseWithNoUnits: true,
  // The units and factory upgrades that can be bought in a game; null = all. Campaign missions
  // set them to bring units in a few at a time.
  allowedUnits: null,
  allowedUpgrades: null,

  combat: {
    // Lives lost when the attack total on a target in one turn reaches these multiples
    // of its defence. Attacks by several units in the same turn add together.
    loseOneLifeAt: 1,
    loseTwoLivesAt: 2,
    // Provisional: a unit with maximum range up to this value, attacked from an adjacent
    // hex and still alive, hits back once at its full attack.
    returnFireMaxRange: 3,
    // Which attackers are fired back at: "adjacent" (only one on a neighbouring hex), or
    // "inRange" (any attacker within the target's own firing range). Option for testing.
    returnFire: "adjacent",
    // How many times a unit can fire back in one turn; null = every time it is attacked.
    // Option for testing (Phil, 29 October 2026: should a swarm of small units be able to
    // take on a Tank?).
    returnFirePerTurn: null,
    // Factories cannot be fired on: they are only overrun by infantry (Phil, 29 October
    // 2026).
    factoriesTakeFire: false,
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
    // After each turn, every pile not harvested during that turn grows by growthPerTurn.
    growthPerTurn: 5,
    // How many new piles spawn after each turn: one of these, drawn at the start of each
    // round, so the same number appears before both players' turns (provisional).
    spawnChoices: [0, 1],
    spawnAmount: 10,
    // A pile that grows to explodeAt stops growing and stays for holdTurns more turns (one
    // for each player, Phil 29 October 2026), then explodes and its crystals are lost.
    explodeAt: 80,
    holdTurns: 2,
    spawnMinDistanceFromFactory: 3, // provisional
  },

  start: {
    crystals: 50, // provisional
    units: ["lightHarvester", "scoutBike", "tank"], // provisional
    // Extra starting crystals for whoever moves second, to make up for the first player's
    // first shot in round 2 (Phil, 28 October 2026: 40; cut to 30 on 29 October; see
    // docs/simulation.md).
    secondPlayerCrystals: 30,
  },

  // "fixed": the same player moves first every round. "alternate": the order flips each round
  // (A B, B A, A B ...), so whoever moved last in a round moves first in the next. Option for
  // testing the first player's advantage.
  turnOrder: "fixed",

  // "tiles": a seven-hex block is turned over, for that player only, when one of their units
  // comes within revealRange of it; everything on it then stays visible to them.
  // "sight": each player sees only what their units can see now.
  // revealRange (tiles mode only): how close a unit must be to a block to turn it over.
  // null = within the unit's sight range; 1 = only blocks it is on or next to (Phil's choice,
  // 28 October 2026).
  // stopOnReveal: a move that turns over new blocks stops there, before going on into ground
  // that was face down when it was planned; the unit keeps its unused move points (Phil, 29
  // October 2026).
  fog: { mode: "tiles", revealRange: 1, stopOnReveal: true },

  // Undos per game for the player on the game screen (the engine does not use this).
  undosPerGame: 5,
  // Demand surrender (game screen, once per game): the AI plays the game on from the current
  // position this many times and surrenders if it wins less than this share (Phil, 28 October
  // 2026).
  surrenderPlayouts: 20,
  surrenderBelow: 0.2,

  // Provisional: a game reaching this round ends with no winner.
  roundCap: 100,
};
