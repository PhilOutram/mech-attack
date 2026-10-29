// AI personalities bred by evolve.js; the game picks one at random each game.
// Each entry: a name from its favourite units, its win rate against the default AI, and
// its genes (see DEFAULT_PERSONALITY in ai.js).
// Run: node evolve.js --generations 40 --population 20 --games 10 --seed 1
// Do not edit by hand; run evolve.js again instead.
export const EVOLVED_PERSONALITIES = [
  {
    "name": "Fighter and Tank",
    "winRateVsDefault": 0.81,
    "personality": {
      "harvestersEarly": 1,
      "harvestersMax": 1,
      "antiAirPerEnemyAir": 1.34,
      "factoryLifeValue": 52.56,
      "killBonusShare": 0.17,
      "returnFireCaution": 1.25,
      "homeDefenceRadius": 7,
      "standOff": 1,
      "harvesterDangerRadius": 4,
      "dangerPenalty": 3.05,
      "scoutWatchDistance": 4,
      "armySizeForMedic": 2,
      "patience": 0.08,
      "captureFactories": 2,
      "transportInfantry": 0.15,
      "mix": {
        "tank": 0.83,
        "heavyCannon": 0.79,
        "artillery": 0,
        "blastCannon": 0.11,
        "sonicTank": 0.74,
        "scoutBike": 0.57,
        "spotterDrone": 0.08,
        "attackHelicopter": 0,
        "fighter": 0.84,
        "antiAircraftJeep": 0,
        "lightMedic": 0
      }
    }
  },
  {
    "name": "Tank and Heavy Cannon",
    "winRateVsDefault": 0.86,
    "personality": {
      "harvestersEarly": 1,
      "harvestersMax": 1,
      "antiAirPerEnemyAir": 1.22,
      "factoryLifeValue": 106.47,
      "killBonusShare": 0.17,
      "returnFireCaution": 0.85,
      "homeDefenceRadius": 6,
      "standOff": 1,
      "harvesterDangerRadius": 4,
      "dangerPenalty": 1.7,
      "scoutWatchDistance": 2,
      "armySizeForMedic": 3,
      "patience": 0.08,
      "captureFactories": 2,
      "transportInfantry": 0.18,
      "mix": {
        "tank": 0.91,
        "heavyCannon": 0.88,
        "artillery": 0,
        "blastCannon": 0.08,
        "sonicTank": 0.74,
        "scoutBike": 0.57,
        "spotterDrone": 0.03,
        "attackHelicopter": 0,
        "fighter": 0.84,
        "antiAircraftJeep": 0,
        "lightMedic": 0
      }
    }
  },
  {
    "name": "Tank and Heavy Cannon",
    "winRateVsDefault": 0.85,
    "personality": {
      "harvestersEarly": 1,
      "harvestersMax": 1,
      "antiAirPerEnemyAir": 1.15,
      "factoryLifeValue": 106.47,
      "killBonusShare": 0.19,
      "returnFireCaution": 1.22,
      "homeDefenceRadius": 5,
      "standOff": 1,
      "harvesterDangerRadius": 4,
      "dangerPenalty": 1.13,
      "scoutWatchDistance": 4,
      "armySizeForMedic": 4,
      "patience": 0.11,
      "captureFactories": 2,
      "transportInfantry": 0.2,
      "mix": {
        "tank": 1,
        "heavyCannon": 0.93,
        "artillery": 0,
        "blastCannon": 0.08,
        "sonicTank": 0.59,
        "scoutBike": 0.34,
        "spotterDrone": 0.01,
        "attackHelicopter": 0.3,
        "fighter": 0.87,
        "antiAircraftJeep": 0,
        "lightMedic": 0.15
      }
    }
  },
  {
    "name": "Tank and Heavy Cannon",
    "winRateVsDefault": 0.89,
    "personality": {
      "harvestersEarly": 1,
      "harvestersMax": 1,
      "antiAirPerEnemyAir": 1.15,
      "factoryLifeValue": 106.47,
      "killBonusShare": 0.19,
      "returnFireCaution": 1.06,
      "homeDefenceRadius": 5,
      "standOff": 1,
      "harvesterDangerRadius": 3,
      "dangerPenalty": 2.57,
      "scoutWatchDistance": 4,
      "armySizeForMedic": 1,
      "patience": 0.01,
      "captureFactories": 2,
      "transportInfantry": 0.15,
      "mix": {
        "tank": 1,
        "heavyCannon": 0.79,
        "artillery": 0,
        "blastCannon": 0.08,
        "sonicTank": 0.63,
        "scoutBike": 0.49,
        "spotterDrone": 0.01,
        "attackHelicopter": 0.3,
        "fighter": 0.76,
        "antiAircraftJeep": 0,
        "lightMedic": 0
      }
    }
  },
  {
    "name": "Tank and Fighter",
    "winRateVsDefault": 0.87,
    "personality": {
      "harvestersEarly": 1,
      "harvestersMax": 1,
      "antiAirPerEnemyAir": 1.08,
      "factoryLifeValue": 52.56,
      "killBonusShare": 0.17,
      "returnFireCaution": 1.25,
      "homeDefenceRadius": 6,
      "standOff": 1,
      "harvesterDangerRadius": 3,
      "dangerPenalty": 1.04,
      "scoutWatchDistance": 4,
      "armySizeForMedic": 1,
      "patience": 0.01,
      "captureFactories": 2,
      "transportInfantry": 0.15,
      "mix": {
        "tank": 1,
        "heavyCannon": 0.79,
        "artillery": 0,
        "blastCannon": 0.18,
        "sonicTank": 0.74,
        "scoutBike": 0.49,
        "spotterDrone": 0.03,
        "attackHelicopter": 0,
        "fighter": 0.84,
        "antiAircraftJeep": 0,
        "lightMedic": 0
      }
    }
  }
];
