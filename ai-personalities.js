// AI personalities bred by evolve.js; the game picks one at random each game.
// Each entry: a name from its favourite units, its win rate against the default AI, and
// its genes (see DEFAULT_PERSONALITY in ai.js).
// Run: node evolve.js --generations 40 --population 20 --games 10 --seed 1
// Do not edit by hand; run evolve.js again instead.
export const EVOLVED_PERSONALITIES = [
  {
    "name": "Heavy Cannon and Tank",
    "winRateVsDefault": 0.62,
    "personality": {
      "harvestersEarly": 1,
      "harvestersMax": 1,
      "antiAirPerEnemyAir": 1.12,
      "factoryLifeValue": 335.84,
      "killBonusShare": 0,
      "returnFireCaution": 1.42,
      "homeDefenceRadius": 2,
      "standOff": 2,
      "harvesterDangerRadius": 3,
      "dangerPenalty": 4.19,
      "scoutWatchDistance": 3,
      "armySizeForMedic": 3,
      "patience": 1,
      "mix": {
        "tank": 0.95,
        "heavyCannon": 0.99,
        "artillery": 0,
        "blastCannon": 0.46,
        "sonicTank": 0.77,
        "scoutBike": 0.79,
        "spotterDrone": 0.42,
        "attackHelicopter": 0.57,
        "fighter": 0.12,
        "antiAircraftJeep": 0.13,
        "lightMedic": 0.62
      }
    }
  },
  {
    "name": "Heavy Cannon and Tank",
    "winRateVsDefault": 0.7,
    "personality": {
      "harvestersEarly": 1,
      "harvestersMax": 1,
      "antiAirPerEnemyAir": 0.84,
      "factoryLifeValue": 304.81,
      "killBonusShare": 0,
      "returnFireCaution": 1.42,
      "homeDefenceRadius": 2,
      "standOff": 2,
      "harvesterDangerRadius": 3,
      "dangerPenalty": 4.19,
      "scoutWatchDistance": 3,
      "armySizeForMedic": 3,
      "patience": 0.67,
      "mix": {
        "tank": 0.95,
        "heavyCannon": 0.99,
        "artillery": 0.23,
        "blastCannon": 0.67,
        "sonicTank": 0.7,
        "scoutBike": 0.79,
        "spotterDrone": 0.42,
        "attackHelicopter": 0.57,
        "fighter": 0.12,
        "antiAircraftJeep": 0.13,
        "lightMedic": 0.85
      }
    }
  },
  {
    "name": "Heavy Cannon and Scout Bike",
    "winRateVsDefault": 0.76,
    "personality": {
      "harvestersEarly": 1,
      "harvestersMax": 1,
      "antiAirPerEnemyAir": 1.29,
      "factoryLifeValue": 269.73,
      "killBonusShare": 0,
      "returnFireCaution": 1.23,
      "homeDefenceRadius": 4,
      "standOff": 2,
      "harvesterDangerRadius": 2,
      "dangerPenalty": 5.36,
      "scoutWatchDistance": 3,
      "armySizeForMedic": 2,
      "patience": 0.67,
      "mix": {
        "tank": 0.86,
        "heavyCannon": 1,
        "artillery": 0.25,
        "blastCannon": 0.63,
        "sonicTank": 0.8,
        "scoutBike": 0.9,
        "spotterDrone": 0.4,
        "attackHelicopter": 0.68,
        "fighter": 0.13,
        "antiAircraftJeep": 0.13,
        "lightMedic": 0.79
      }
    }
  },
  {
    "name": "Tank and Heavy Cannon",
    "winRateVsDefault": 0.66,
    "personality": {
      "harvestersEarly": 1,
      "harvestersMax": 1,
      "antiAirPerEnemyAir": 1.16,
      "factoryLifeValue": 304.81,
      "killBonusShare": 0,
      "returnFireCaution": 1.23,
      "homeDefenceRadius": 4,
      "standOff": 2,
      "harvesterDangerRadius": 2,
      "dangerPenalty": 6.45,
      "scoutWatchDistance": 3,
      "armySizeForMedic": 2,
      "patience": 0.67,
      "mix": {
        "tank": 0.95,
        "heavyCannon": 0.92,
        "artillery": 0.25,
        "blastCannon": 0.67,
        "sonicTank": 0.7,
        "scoutBike": 0.79,
        "spotterDrone": 0.4,
        "attackHelicopter": 0.68,
        "fighter": 0.1,
        "antiAircraftJeep": 0.13,
        "lightMedic": 0.75
      }
    }
  },
  {
    "name": "Heavy Cannon and Tank",
    "winRateVsDefault": 0.7,
    "personality": {
      "harvestersEarly": 1,
      "harvestersMax": 1,
      "antiAirPerEnemyAir": 0.84,
      "factoryLifeValue": 269.73,
      "killBonusShare": 0,
      "returnFireCaution": 1.23,
      "homeDefenceRadius": 2,
      "standOff": 2,
      "harvesterDangerRadius": 2,
      "dangerPenalty": 5.36,
      "scoutWatchDistance": 3,
      "armySizeForMedic": 2,
      "patience": 0.67,
      "mix": {
        "tank": 0.95,
        "heavyCannon": 0.99,
        "artillery": 0.25,
        "blastCannon": 0.67,
        "sonicTank": 0.7,
        "scoutBike": 0.79,
        "spotterDrone": 0.21,
        "attackHelicopter": 0.68,
        "fighter": 0.13,
        "antiAircraftJeep": 0.13,
        "lightMedic": 0.81
      }
    }
  }
];
