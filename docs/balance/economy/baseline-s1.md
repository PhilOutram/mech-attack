# Evolved AI personalities

Produced by `node evolve.js --generations 20 --population 16 --games 8 --seed 1`. Each generation every personality plays games against others on fixed map 1 and generated maps; the best quarter survive and the rest are mixed and mutated copies of them. Games over 60 rounds count as draws.

## Progress

| Generation | Best win rate | Mean win rate | Best personality favours |
|---|---|---|---|
| 1 | 87% | 51% | Light Medic 15%, Anti-Aircraft Jeep 15%, Tank 14% |
| 2 | 79% | 50% | Tank 19%, Fighter 17%, Heavy Cannon 16% |
| 3 | 74% | 50% | Tank 17%, Spotter Drone 17%, Light Medic 15% |
| 4 | 78% | 50% | Scout Bike 20%, Tank 16%, Fighter 15% |
| 5 | 72% | 50% | Heavy Cannon 16%, Tank 15%, Artillery 15% |
| 6 | 83% | 51% | Scout Bike 24%, Fighter 14%, Tank 13% |
| 7 | 79% | 51% | Scout Bike 22%, Tank 16%, Heavy Cannon 15% |
| 8 | 86% | 51% | Scout Bike 24%, Heavy Cannon 17%, Tank 15% |
| 9 | 72% | 50% | Scout Bike 24%, Heavy Cannon 17%, Tank 15% |
| 10 | 65% | 50% | Scout Bike 23%, Tank 17%, Heavy Cannon 16% |
| 11 | 77% | 50% | Scout Bike 23%, Tank 17%, Heavy Cannon 15% |
| 12 | 73% | 50% | Scout Bike 24%, Heavy Cannon 17%, Tank 15% |
| 13 | 71% | 50% | Scout Bike 26%, Heavy Cannon 18%, Tank 16% |
| 14 | 87% | 50% | Scout Bike 25%, Heavy Cannon 18%, Tank 16% |
| 15 | 76% | 50% | Scout Bike 25%, Heavy Cannon 18%, Tank 16% |
| 16 | 68% | 50% | Scout Bike 27%, Heavy Cannon 19%, Spotter Drone 17% |
| 17 | 81% | 51% | Scout Bike 24%, Tank 21%, Heavy Cannon 15% |
| 18 | 78% | 50% | Scout Bike 24%, Tank 20%, Heavy Cannon 14% |
| 19 | 62% | 49% | Scout Bike 25%, Tank 20%, Spotter Drone 15% |
| 20 | 80% | 52% | Scout Bike 21%, Tank 19%, Heavy Cannon 15% |

## The best personalities against the hand-tuned AI

60 games each, seats and maps mixed.

| Personality | Wins against the default AI | Units it built (share) | Upgrades and captures per game |
|---|---|---|---|
| Scout Bike and Tank | 95% | Scout Bike 54%, Light Medic 23%, Tank 19%, Anti-Aircraft Jeep 3% | captures 0.0 |
| Scout Bike and Tank | 93% | Scout Bike 51%, Light Medic 27%, Tank 19%, Anti-Aircraft Jeep 2% | captures 0.0 |
| Tank and Scout Bike | 94% | Scout Bike 48%, Light Medic 27%, Tank 23%, Anti-Aircraft Jeep 2% | captures 0.0 |

## Genes of the best personality

```json
{
  "mix": {
    "tank": 0.87,
    "heavyCannon": 0.69,
    "artillery": 0,
    "blastCannon": 0.38,
    "sonicTank": 0.25,
    "scoutBike": 0.95,
    "spotterDrone": 0.59,
    "attackHelicopter": 0.32,
    "fighter": 0.24,
    "antiAircraftJeep": 0,
    "lightMedic": 0.2
  },
  "harvestersEarly": 1,
  "harvestersMax": 1,
  "antiAirPerEnemyAir": 1.61,
  "factoryLifeValue": 146.88,
  "killBonusShare": 0.56,
  "returnFireCaution": 1.86,
  "homeDefenceRadius": 2,
  "standOff": 2,
  "harvesterDangerRadius": 1,
  "dangerPenalty": 6.84,
  "scoutWatchDistance": 3,
  "armySizeForMedic": 1,
  "patience": 0.27,
  "captureFactories": 0,
  "transportInfantry": 0
}
```
