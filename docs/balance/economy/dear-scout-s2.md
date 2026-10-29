# Evolved AI personalities

Produced by `node evolve.js --generations 20 --population 16 --games 8 --seed 2 --set units.scoutBike.cost=45`. Each generation every personality plays games against others on fixed map 1 and generated maps; the best quarter survive and the rest are mixed and mutated copies of them. Games over 60 rounds count as draws.

## Progress

| Generation | Best win rate | Mean win rate | Best personality favours |
|---|---|---|---|
| 1 | 90% | 50% | Sonic Tank 15%, Light Medic 13%, Fighter 13% |
| 2 | 78% | 50% | Sonic Tank 15%, Tank 15%, Fighter 13% |
| 3 | 72% | 50% | Sonic Tank 15%, Light Medic 13%, Fighter 13% |
| 4 | 72% | 49% | Sonic Tank 14%, Light Medic 13%, Fighter 13% |
| 5 | 80% | 49% | Sonic Tank 14%, Tank 14%, Light Medic 13% |
| 6 | 73% | 50% | Sonic Tank 15%, Light Medic 13%, Heavy Cannon 13% |
| 7 | 83% | 50% | Sonic Tank 15%, Tank 14%, Light Medic 13% |
| 8 | 68% | 49% | Sonic Tank 16%, Tank 14%, Light Medic 12% |
| 9 | 76% | 50% | Sonic Tank 16%, Tank 15%, Light Medic 12% |
| 10 | 67% | 50% | Light Medic 15%, Sonic Tank 14%, Fighter 12% |
| 11 | 75% | 50% | Tank 16%, Sonic Tank 16%, Light Medic 15% |
| 12 | 86% | 49% | Tank 16%, Sonic Tank 16%, Light Medic 15% |
| 13 | 71% | 49% | Sonic Tank 15%, Light Medic 14%, Tank 13% |
| 14 | 69% | 51% | Tank 16%, Sonic Tank 16%, Light Medic 15% |
| 15 | 73% | 51% | Tank 15%, Light Medic 15%, Sonic Tank 14% |
| 16 | 67% | 51% | Tank 15%, Light Medic 15%, Sonic Tank 14% |
| 17 | 70% | 49% | Sonic Tank 16%, Light Medic 16%, Tank 15% |
| 18 | 71% | 50% | Sonic Tank 17%, Tank 16%, Heavy Cannon 12% |
| 19 | 81% | 51% | Tank 17%, Sonic Tank 16%, Fighter 14% |
| 20 | 77% | 50% | Tank 16%, Sonic Tank 16%, Heavy Cannon 15% |

## The best personalities against the hand-tuned AI

60 games each, seats and maps mixed.

| Personality | Wins against the default AI | Units it built (share) | Upgrades and captures per game |
|---|---|---|---|
| Tank and Sonic Tank | 77% | Scout Bike 33%, Light Medic 30%, Artillery 17%, Tank 17%, Anti-Aircraft Jeep 4% | captures 0.0 |
| Sonic Tank and Tank | 80% | Light Medic 28%, Scout Bike 23%, Artillery 20%, Tank 17%, Light Harvester 8%, Anti-Aircraft Jeep 3% | captures 0.0 |
| Tank and Sonic Tank | 80% | Scout Bike 40%, Light Medic 28%, Artillery 16%, Tank 16%, Anti-Aircraft Jeep 1% | captures 0.0 |

## Genes of the best personality

```json
{
  "mix": {
    "tank": 1,
    "heavyCannon": 0.89,
    "artillery": 0.27,
    "blastCannon": 0.63,
    "sonicTank": 0.98,
    "scoutBike": 0.54,
    "spotterDrone": 0.21,
    "attackHelicopter": 0.19,
    "fighter": 0.64,
    "antiAircraftJeep": 0,
    "lightMedic": 0.77
  },
  "harvestersEarly": 1,
  "harvestersMax": 1,
  "antiAirPerEnemyAir": 1.69,
  "factoryLifeValue": 253.46,
  "killBonusShare": 0.13,
  "returnFireCaution": 1.37,
  "homeDefenceRadius": 4,
  "standOff": 2,
  "harvesterDangerRadius": 0,
  "dangerPenalty": 5.54,
  "scoutWatchDistance": 2,
  "armySizeForMedic": 2,
  "patience": 0.38,
  "captureFactories": 0,
  "transportInfantry": 0.12
}
```
