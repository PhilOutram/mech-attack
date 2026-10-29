# Evolved AI personalities

Produced by `node evolve.js --generations 20 --population 16 --games 8 --seed 2 --set units.heavyCannon.attack=50 --set units.heavyCannon.defence=50 --set units.blastCannon.attack=50 --set units.blastCannon.defence=15 --set units.sonicTank.attack=20 --set units.sonicTank.defence=25`. Each generation every personality plays games against others on fixed map 1 and generated maps; the best quarter survive and the rest are mixed and mutated copies of them. Games over 60 rounds count as draws.

## Progress

| Generation | Best win rate | Mean win rate | Best personality favours |
|---|---|---|---|
| 1 | 90% | 49% | Sonic Tank 15%, Light Medic 13%, Fighter 13% |
| 2 | 86% | 50% | Sonic Tank 15%, Tank 15%, Fighter 13% |
| 3 | 75% | 50% | Light Medic 17%, Fighter 15%, Scout Bike 15% |
| 4 | 69% | 50% | Light Medic 17%, Fighter 15%, Scout Bike 15% |
| 5 | 78% | 49% | Artillery 18%, Light Medic 18%, Sonic Tank 14% |
| 6 | 65% | 50% | Light Medic 25%, Sonic Tank 19%, Heavy Cannon 16% |
| 7 | 77% | 50% | Light Medic 19%, Fighter 16%, Blast Cannon 13% |
| 8 | 88% | 51% | Light Medic 18%, Fighter 17%, Spotter Drone 12% |
| 9 | 63% | 50% | Spotter Drone 16%, Fighter 15%, Light Medic 15% |
| 10 | 73% | 50% | Spotter Drone 17%, Light Medic 16%, Fighter 14% |
| 11 | 79% | 51% | Light Medic 19%, Fighter 16%, Blast Cannon 15% |
| 12 | 73% | 51% | Light Medic 16%, Sonic Tank 15%, Spotter Drone 14% |
| 13 | 69% | 50% | Fighter 15%, Light Medic 15%, Blast Cannon 13% |
| 14 | 63% | 49% | Light Medic 15%, Sonic Tank 15%, Fighter 14% |
| 15 | 75% | 50% | Light Medic 15%, Sonic Tank 15%, Fighter 14% |
| 16 | 78% | 50% | Light Medic 14%, Sonic Tank 14%, Fighter 13% |
| 17 | 74% | 50% | Spotter Drone 15%, Sonic Tank 14%, Fighter 13% |
| 18 | 74% | 50% | Spotter Drone 16%, Sonic Tank 15%, Fighter 14% |
| 19 | 73% | 50% | Spotter Drone 15%, Fighter 14%, Scout Bike 14% |
| 20 | 73% | 50% | Fighter 16%, Sonic Tank 14%, Spotter Drone 14% |

## The best personalities against the hand-tuned AI

60 games each, seats and maps mixed.

| Personality | Wins against the default AI | Units it built (share) | Upgrades and captures per game |
|---|---|---|---|
| Fighter and Sonic Tank | 91% | Scout Bike 44%, Light Medic 24%, Artillery 13%, Tank 10%, Light Harvester 9% | captures 0.0 |
| Spotter Drone and Scout Bike | 82% | Scout Bike 46%, Light Medic 23%, Light Harvester 12%, Artillery 11%, Tank 9% | captures 0.0 |
| Spotter Drone and Sonic Tank | 77% | Scout Bike 55%, Light Medic 25%, Tank 11%, Light Harvester 9% | captures 0.0 |

## Genes of the best personality

```json
{
  "mix": {
    "tank": 0.28,
    "heavyCannon": 0.63,
    "artillery": 0.14,
    "blastCannon": 0.54,
    "sonicTank": 0.9,
    "scoutBike": 0.88,
    "spotterDrone": 0.89,
    "attackHelicopter": 0.23,
    "fighter": 1,
    "antiAircraftJeep": 0,
    "lightMedic": 0.83
  },
  "harvestersEarly": 2,
  "harvestersMax": 2,
  "antiAirPerEnemyAir": 0.16,
  "factoryLifeValue": 82.73,
  "killBonusShare": 0.51,
  "returnFireCaution": 0.95,
  "homeDefenceRadius": 3,
  "standOff": 3,
  "harvesterDangerRadius": 1,
  "dangerPenalty": 7.13,
  "scoutWatchDistance": 2,
  "armySizeForMedic": 2,
  "patience": 0,
  "captureFactories": 0,
  "transportInfantry": 0.68
}
```
