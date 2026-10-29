// AI personalities bred by evolve.js; the game picks one at random each game.
// Each entry: a name from its favourite units, its win rate against the default AI, and
// its genes (see DEFAULT_PERSONALITY in ai.js).
// Run: node evolve.js --generations 40 --population 20 --games 10 --seed 1
// Do not edit by hand; run evolve.js again instead.
export const EVOLVED_PERSONALITIES = [
  {
    "name": "Tank and Heavy Cannon",
    "winRateVsDefault": 0.79,
    "personality": {
      "harvestersEarly": 1,
      "harvestersMax": 1,
      "antiAirPerEnemyAir": 0.03,
      "factoryLifeValue": 241.6,
      "killBonusShare": 0.1,
      "returnFireCaution": 1.04,
      "homeDefenceRadius": 4,
      "standOff": 2,
      "harvesterDangerRadius": 3,
      "dangerPenalty": 4.36,
      "scoutWatchDistance": 3,
      "armySizeForMedic": 2,
      "patience": 0,
      "captureFactories": 2,
      "transportInfantry": 0,
      "mix": {
        "tank": 0.95,
        "heavyCannon": 0.93,
        "artillery": 0.6,
        "blastCannon": 0.35,
        "sonicTank": 0,
        "scoutBike": 0.76,
        "spotterDrone": 0.38,
        "attackHelicopter": 0.15,
        "fighter": 0.64,
        "antiAircraftJeep": 0.18,
        "lightMedic": 0.36
      }
    }
  },
  {
    "name": "Heavy Cannon and Tank",
    "winRateVsDefault": 0.85,
    "personality": {
      "harvestersEarly": 1,
      "harvestersMax": 1,
      "antiAirPerEnemyAir": 0.14,
      "factoryLifeValue": 187.69,
      "killBonusShare": 0.43,
      "returnFireCaution": 0.78,
      "homeDefenceRadius": 4,
      "standOff": 2,
      "harvesterDangerRadius": 3,
      "dangerPenalty": 4.5,
      "scoutWatchDistance": 3,
      "armySizeForMedic": 1,
      "patience": 0.01,
      "captureFactories": 1,
      "transportInfantry": 0.05,
      "mix": {
        "tank": 0.78,
        "heavyCannon": 0.9,
        "artillery": 0.67,
        "blastCannon": 0.55,
        "sonicTank": 0.03,
        "scoutBike": 0.76,
        "spotterDrone": 0.67,
        "attackHelicopter": 0.08,
        "fighter": 0.34,
        "antiAircraftJeep": 0,
        "lightMedic": 0.18
      }
    }
  },
  {
    "name": "Tank and Heavy Cannon",
    "winRateVsDefault": 0.82,
    "personality": {
      "harvestersEarly": 1,
      "harvestersMax": 1,
      "antiAirPerEnemyAir": 0.14,
      "factoryLifeValue": 284.49,
      "killBonusShare": 0.18,
      "returnFireCaution": 1.84,
      "homeDefenceRadius": 5,
      "standOff": 2,
      "harvesterDangerRadius": 3,
      "dangerPenalty": 4.48,
      "scoutWatchDistance": 3,
      "armySizeForMedic": 2,
      "patience": 0,
      "captureFactories": 2,
      "transportInfantry": 0,
      "mix": {
        "tank": 0.95,
        "heavyCannon": 0.93,
        "artillery": 0.66,
        "blastCannon": 0.35,
        "sonicTank": 0,
        "scoutBike": 0.76,
        "spotterDrone": 0.92,
        "attackHelicopter": 0.15,
        "fighter": 0.64,
        "antiAircraftJeep": 0.18,
        "lightMedic": 0.36
      }
    }
  },
  {
    "name": "Heavy Cannon and Spotter Drone",
    "winRateVsDefault": 0.74,
    "personality": {
      "harvestersEarly": 1,
      "harvestersMax": 1,
      "antiAirPerEnemyAir": 0,
      "factoryLifeValue": 127.29,
      "killBonusShare": 0.18,
      "returnFireCaution": 1.82,
      "homeDefenceRadius": 4,
      "standOff": 2,
      "harvesterDangerRadius": 3,
      "dangerPenalty": 3.9,
      "scoutWatchDistance": 3,
      "armySizeForMedic": 2,
      "patience": 0.03,
      "captureFactories": 2,
      "transportInfantry": 0.1,
      "mix": {
        "tank": 0.81,
        "heavyCannon": 0.95,
        "artillery": 0.66,
        "blastCannon": 0.18,
        "sonicTank": 0.19,
        "scoutBike": 0.48,
        "spotterDrone": 0.92,
        "attackHelicopter": 0.41,
        "fighter": 0.55,
        "antiAircraftJeep": 0,
        "lightMedic": 0.23
      }
    }
  },
  {
    "name": "Tank and Heavy Cannon",
    "winRateVsDefault": 0.74,
    "personality": {
      "harvestersEarly": 1,
      "harvestersMax": 1,
      "antiAirPerEnemyAir": 0.23,
      "factoryLifeValue": 187.69,
      "killBonusShare": 0.3,
      "returnFireCaution": 1.29,
      "homeDefenceRadius": 3,
      "standOff": 2,
      "harvesterDangerRadius": 3,
      "dangerPenalty": 4.2,
      "scoutWatchDistance": 3,
      "armySizeForMedic": 2,
      "patience": 0.04,
      "captureFactories": 2,
      "transportInfantry": 0.12,
      "mix": {
        "tank": 0.97,
        "heavyCannon": 0.95,
        "artillery": 0.49,
        "blastCannon": 0.55,
        "sonicTank": 0,
        "scoutBike": 0.73,
        "spotterDrone": 0.67,
        "attackHelicopter": 0.11,
        "fighter": 0.49,
        "antiAircraftJeep": 0,
        "lightMedic": 0.18
      }
    }
  }
];
