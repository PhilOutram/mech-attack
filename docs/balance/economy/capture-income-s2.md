# Evolved AI personalities

Produced by `node evolve.js --generations 20 --population 16 --games 8 --seed 2 --set capture.incomePerTurn=10`. Each generation every personality plays games against others on fixed map 1 and generated maps; the best quarter survive and the rest are mixed and mutated copies of them. Games over 60 rounds count as draws.

## Progress

| Generation | Best win rate | Mean win rate | Best personality favours |
|---|---|---|---|
| 1 | 71% | 50% | Artillery 17%, Scout Bike 17%, Spotter Drone 14% |
| 2 | 89% | 51% | Tank 13%, Blast Cannon 13%, Fighter 13% |
| 3 | 79% | 50% | Artillery 19%, Scout Bike 17%, Spotter Drone 14% |
| 4 | 89% | 51% | Blast Cannon 17%, Light Medic 17%, Tank 16% |
| 5 | 80% | 50% | Scout Bike 17%, Light Medic 15%, Tank 14% |
| 6 | 73% | 50% | Tank 21%, Spotter Drone 19%, Scout Bike 11% |
| 7 | 67% | 50% | Anti-Aircraft Jeep 18%, Scout Bike 16%, Light Medic 15% |
| 8 | 71% | 50% | Light Medic 22%, Tank 21%, Anti-Aircraft Jeep 20% |
| 9 | 68% | 50% | Light Medic 19%, Scout Bike 17%, Anti-Aircraft Jeep 15% |
| 10 | 86% | 49% | Light Medic 16%, Blast Cannon 15%, Anti-Aircraft Jeep 15% |
| 11 | 81% | 50% | Light Medic 23%, Anti-Aircraft Jeep 21%, Tank 18% |
| 12 | 68% | 50% | Light Medic 23%, Anti-Aircraft Jeep 20%, Tank 18% |
| 13 | 70% | 50% | Light Medic 16%, Anti-Aircraft Jeep 15%, Tank 12% |
| 14 | 68% | 50% | Light Medic 21%, Anti-Aircraft Jeep 20%, Tank 14% |
| 15 | 67% | 51% | Light Medic 16%, Anti-Aircraft Jeep 15%, Tank 14% |
| 16 | 92% | 50% | Light Medic 16%, Tank 14%, Anti-Aircraft Jeep 14% |
| 17 | 75% | 49% | Tank 17%, Light Medic 15%, Anti-Aircraft Jeep 14% |
| 18 | 68% | 50% | Light Medic 15%, Tank 14%, Anti-Aircraft Jeep 14% |
| 19 | 66% | 50% | Light Medic 19%, Tank 15%, Anti-Aircraft Jeep 13% |
| 20 | 68% | 49% | Tank 19%, Anti-Aircraft Jeep 18%, Light Medic 15% |

## The best personalities against the hand-tuned AI

60 games each, seats and maps mixed.

| Personality | Wins against the default AI | Units it built (share) | Upgrades and captures per game |
|---|---|---|---|
| Tank and Anti-Aircraft Jeep | 81% | Infantry 31%, Scout Bike 20%, Anti-Aircraft Jeep 18%, Light Medic 15%, Tank 7%, Light Harvester 5%, Artillery 4% | captures 3.7 |
| Light Medic and Tank | 86% | Infantry 29%, Scout Bike 21%, Light Medic 19%, Anti-Aircraft Jeep 15%, Tank 6%, Artillery 6%, Light Harvester 4% | captures 3.0 |
| Light Medic and Tank | 91% | Infantry 30%, Scout Bike 21%, Light Medic 19%, Anti-Aircraft Jeep 16%, Artillery 5%, Tank 5%, Light Harvester 5% | Airfield 0.0, captures 3.2 |

## Genes of the best personality

```json
{
  "mix": {
    "tank": 0.78,
    "heavyCannon": 0.25,
    "artillery": 0.31,
    "blastCannon": 0.16,
    "sonicTank": 0.13,
    "scoutBike": 0.25,
    "spotterDrone": 0.32,
    "attackHelicopter": 0.42,
    "fighter": 0.13,
    "antiAircraftJeep": 0.73,
    "lightMedic": 0.59
  },
  "harvestersEarly": 2,
  "harvestersMax": 2,
  "antiAirPerEnemyAir": 1.17,
  "factoryLifeValue": 349.64,
  "killBonusShare": 0.49,
  "returnFireCaution": 1.19,
  "homeDefenceRadius": 5,
  "standOff": 3,
  "harvesterDangerRadius": 0,
  "dangerPenalty": 5.89,
  "scoutWatchDistance": 5,
  "armySizeForMedic": 3,
  "patience": 0.08,
  "captureFactories": 2,
  "transportInfantry": 0.35
}
```
