// AI personalities bred by evolve.js; the game picks one at random each game.
// Each entry: a name from its favourite units, its win rate against the default AI, and
// its genes (see DEFAULT_PERSONALITY in ai.js).
// Run: node evolve.js --generations 40 --population 20 --games 10 --seed 1
// Do not edit by hand; run evolve.js again instead.
export const EVOLVED_PERSONALITIES = [
  {
    "name": "Tank and Heavy Cannon",
    "winRateVsDefault": 0.93,
    "personality": {
      "harvestersEarly": 2,
      "harvestersMax": 2,
      "antiAirPerEnemyAir": 1.28,
      "factoryLifeValue": 106.53,
      "killBonusShare": 0.54,
      "returnFireCaution": 1.05,
      "homeDefenceRadius": 2,
      "standOff": 1,
      "harvesterDangerRadius": 0,
      "dangerPenalty": 1.56,
      "scoutWatchDistance": 5,
      "armySizeForMedic": 2,
      "patience": 0,
      "captureFactories": 0,
      "transportInfantry": 0,
      "mix": {
        "tank": 0.99,
        "heavyCannon": 0.48,
        "artillery": 0,
        "blastCannon": 0.1,
        "sonicTank": 0,
        "scoutBike": 0.23,
        "spotterDrone": 0.1,
        "attackHelicopter": 0.09,
        "fighter": 0.01,
        "antiAircraftJeep": 0,
        "lightMedic": 0.05
      }
    }
  },
  {
    "name": "Tank and Heavy Cannon",
    "winRateVsDefault": 0.91,
    "personality": {
      "harvestersEarly": 2,
      "harvestersMax": 2,
      "antiAirPerEnemyAir": 1.64,
      "factoryLifeValue": 106.53,
      "killBonusShare": 0.71,
      "returnFireCaution": 1.05,
      "homeDefenceRadius": 2,
      "standOff": 1,
      "harvesterDangerRadius": 0,
      "dangerPenalty": 2.92,
      "scoutWatchDistance": 5,
      "armySizeForMedic": 3,
      "patience": 0.07,
      "captureFactories": 0,
      "transportInfantry": 0.02,
      "mix": {
        "tank": 0.91,
        "heavyCannon": 0.48,
        "artillery": 0,
        "blastCannon": 0.13,
        "sonicTank": 0,
        "scoutBike": 0.23,
        "spotterDrone": 0.06,
        "attackHelicopter": 0,
        "fighter": 0.01,
        "antiAircraftJeep": 0,
        "lightMedic": 0.05
      }
    }
  },
  {
    "name": "Tank and Heavy Cannon",
    "winRateVsDefault": 0.86,
    "personality": {
      "harvestersEarly": 2,
      "harvestersMax": 2,
      "antiAirPerEnemyAir": 1.11,
      "factoryLifeValue": 73.82,
      "killBonusShare": 0.55,
      "returnFireCaution": 0.45,
      "homeDefenceRadius": 2,
      "standOff": 1,
      "harvesterDangerRadius": 0,
      "dangerPenalty": 1.44,
      "scoutWatchDistance": 5,
      "armySizeForMedic": 2,
      "patience": 0.14,
      "captureFactories": 0,
      "transportInfantry": 0.02,
      "mix": {
        "tank": 1,
        "heavyCannon": 0.48,
        "artillery": 0,
        "blastCannon": 0,
        "sonicTank": 0.2,
        "scoutBike": 0.2,
        "spotterDrone": 0,
        "attackHelicopter": 0.31,
        "fighter": 0,
        "antiAircraftJeep": 0,
        "lightMedic": 0.16
      }
    }
  },
  {
    "name": "Tank and Heavy Cannon",
    "winRateVsDefault": 0.91,
    "personality": {
      "harvestersEarly": 2,
      "harvestersMax": 2,
      "antiAirPerEnemyAir": 1.11,
      "factoryLifeValue": 73.82,
      "killBonusShare": 0.55,
      "returnFireCaution": 0.61,
      "homeDefenceRadius": 2,
      "standOff": 1,
      "harvesterDangerRadius": 0,
      "dangerPenalty": 0,
      "scoutWatchDistance": 5,
      "armySizeForMedic": 3,
      "patience": 0.03,
      "captureFactories": 0,
      "transportInfantry": 0.13,
      "mix": {
        "tank": 0.97,
        "heavyCannon": 0.48,
        "artillery": 0,
        "blastCannon": 0,
        "sonicTank": 0.16,
        "scoutBike": 0.17,
        "spotterDrone": 0,
        "attackHelicopter": 0.31,
        "fighter": 0.03,
        "antiAircraftJeep": 0,
        "lightMedic": 0.2
      }
    }
  },
  {
    "name": "Tank and Heavy Cannon",
    "winRateVsDefault": 0.92,
    "personality": {
      "harvestersEarly": 2,
      "harvestersMax": 2,
      "antiAirPerEnemyAir": 1.23,
      "factoryLifeValue": 133.02,
      "killBonusShare": 0.68,
      "returnFireCaution": 0.68,
      "homeDefenceRadius": 2,
      "standOff": 1,
      "harvesterDangerRadius": 0,
      "dangerPenalty": 1.56,
      "scoutWatchDistance": 5,
      "armySizeForMedic": 1,
      "patience": 0,
      "captureFactories": 0,
      "transportInfantry": 0.05,
      "mix": {
        "tank": 0.99,
        "heavyCannon": 0.43,
        "artillery": 0,
        "blastCannon": 0.26,
        "sonicTank": 0.16,
        "scoutBike": 0.23,
        "spotterDrone": 0.1,
        "attackHelicopter": 0,
        "fighter": 0,
        "antiAircraftJeep": 0,
        "lightMedic": 0.05
      }
    }
  }
];
