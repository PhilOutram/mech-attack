// AI personalities bred by evolve.js; the game picks one at random each game.
// Each entry: a name from its favourite units, its win rate against the default AI, and
// its genes (see DEFAULT_PERSONALITY in ai.js).
// Run: node evolve.js --generations 40 --population 20 --games 10 --seed 1
// Do not edit by hand; run evolve.js again instead.
export const EVOLVED_PERSONALITIES = [
  {
    "name": "Heavy Cannon and Tank",
    "winRateVsDefault": 0.84,
    "personality": {
      "harvestersEarly": 2,
      "harvestersMax": 2,
      "antiAirPerEnemyAir": 0.93,
      "factoryLifeValue": 179.63,
      "killBonusShare": 0.45,
      "returnFireCaution": 1,
      "homeDefenceRadius": 4,
      "standOff": 2,
      "harvesterDangerRadius": 1,
      "dangerPenalty": 7.28,
      "scoutWatchDistance": 4,
      "armySizeForMedic": 2,
      "patience": 0,
      "captureFactories": 2,
      "transportInfantry": 0,
      "labs": 1,
      "mix": {
        "tank": 0.76,
        "heavyCannon": 1,
        "artillery": 0.61,
        "blastCannon": 0.06,
        "sonicTank": 0.01,
        "scoutBike": 0.13,
        "spotterDrone": 0.45,
        "attackHelicopter": 0.22,
        "fighter": 0.72,
        "antiAircraftJeep": 0.55,
        "lightMedic": 0.56,
        "turret": 0.31
      }
    }
  },
  {
    "name": "Heavy Cannon and Tank",
    "winRateVsDefault": 0.73,
    "personality": {
      "harvestersEarly": 2,
      "harvestersMax": 2,
      "antiAirPerEnemyAir": 1.03,
      "factoryLifeValue": 179.63,
      "killBonusShare": 0.55,
      "returnFireCaution": 1.06,
      "homeDefenceRadius": 4,
      "standOff": 2,
      "harvesterDangerRadius": 1,
      "dangerPenalty": 7.28,
      "scoutWatchDistance": 4,
      "armySizeForMedic": 2,
      "patience": 0,
      "captureFactories": 2,
      "transportInfantry": 0,
      "labs": 1,
      "mix": {
        "tank": 0.86,
        "heavyCannon": 0.95,
        "artillery": 0.61,
        "blastCannon": 0,
        "sonicTank": 0.1,
        "scoutBike": 0.29,
        "spotterDrone": 0.62,
        "attackHelicopter": 0.05,
        "fighter": 0.78,
        "antiAircraftJeep": 0.8,
        "lightMedic": 0.38,
        "turret": 0.45
      }
    }
  },
  {
    "name": "Tank and Heavy Cannon",
    "winRateVsDefault": 0.8,
    "personality": {
      "harvestersEarly": 2,
      "harvestersMax": 2,
      "antiAirPerEnemyAir": 1.03,
      "factoryLifeValue": 153.58,
      "killBonusShare": 0.53,
      "returnFireCaution": 0.95,
      "homeDefenceRadius": 4,
      "standOff": 2,
      "harvesterDangerRadius": 2,
      "dangerPenalty": 6.42,
      "scoutWatchDistance": 4,
      "armySizeForMedic": 2,
      "patience": 0,
      "captureFactories": 2,
      "transportInfantry": 0.25,
      "labs": 1,
      "mix": {
        "tank": 0.9,
        "heavyCannon": 0.84,
        "artillery": 0.61,
        "blastCannon": 0.06,
        "sonicTank": 0.18,
        "scoutBike": 0.22,
        "spotterDrone": 0.5,
        "attackHelicopter": 0.11,
        "fighter": 0.72,
        "antiAircraftJeep": 0.72,
        "lightMedic": 0.45,
        "turret": 0.4
      }
    }
  },
  {
    "name": "Heavy Cannon and Tank",
    "winRateVsDefault": 0.75,
    "personality": {
      "harvestersEarly": 2,
      "harvestersMax": 2,
      "antiAirPerEnemyAir": 0.93,
      "factoryLifeValue": 179.63,
      "killBonusShare": 0.45,
      "returnFireCaution": 1,
      "homeDefenceRadius": 4,
      "standOff": 2,
      "harvesterDangerRadius": 1,
      "dangerPenalty": 7.28,
      "scoutWatchDistance": 4,
      "armySizeForMedic": 3,
      "patience": 0,
      "captureFactories": 2,
      "transportInfantry": 0,
      "labs": 1,
      "mix": {
        "tank": 0.76,
        "heavyCannon": 1,
        "artillery": 0.61,
        "blastCannon": 0.13,
        "sonicTank": 0.01,
        "scoutBike": 0.13,
        "spotterDrone": 0.41,
        "attackHelicopter": 0.22,
        "fighter": 0.72,
        "antiAircraftJeep": 0.55,
        "lightMedic": 0.56,
        "turret": 0.14
      }
    }
  },
  {
    "name": "Heavy Cannon and Tank",
    "winRateVsDefault": 0.79,
    "personality": {
      "harvestersEarly": 2,
      "harvestersMax": 2,
      "antiAirPerEnemyAir": 0.79,
      "factoryLifeValue": 179.63,
      "killBonusShare": 0.45,
      "returnFireCaution": 0.95,
      "homeDefenceRadius": 4,
      "standOff": 2,
      "harvesterDangerRadius": 1,
      "dangerPenalty": 7.28,
      "scoutWatchDistance": 4,
      "armySizeForMedic": 2,
      "patience": 0.13,
      "captureFactories": 2,
      "transportInfantry": 0.25,
      "labs": 1,
      "mix": {
        "tank": 0.76,
        "heavyCannon": 0.88,
        "artillery": 0.61,
        "blastCannon": 0.16,
        "sonicTank": 0.01,
        "scoutBike": 0.22,
        "spotterDrone": 0.45,
        "attackHelicopter": 0.22,
        "fighter": 0.59,
        "antiAircraftJeep": 0.72,
        "lightMedic": 0.56,
        "turret": 0.31
      }
    }
  }
];
