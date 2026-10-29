# Evolved AI personalities

Produced by `node evolve.js --generations 20 --population 16 --games 8 --seed 2`. Each generation every personality plays games against others on fixed map 1 and generated maps; the best quarter survive and the rest are mixed and mutated copies of them. Games over 60 rounds count as draws.

## Progress

| Generation | Best win rate | Mean win rate | Best personality favours |
|---|---|---|---|
| 1 | 90% | 50% | Sonic Tank 15%, Light Medic 13%, Fighter 13% |
| 2 | 83% | 50% | Sonic Tank 15%, Tank 15%, Fighter 13% |
| 3 | 60% | 50% | Sonic Tank 15%, Tank 15%, Fighter 13% |
| 4 | 68% | 50% | Scout Bike 16%, Tank 15%, Light Medic 15% |
| 5 | 86% | 51% | Scout Bike 16%, Tank 15%, Light Medic 15% |
| 6 | 77% | 50% | Tank 15%, Sonic Tank 15%, Fighter 14% |
| 7 | 69% | 50% | Light Medic 16%, Sonic Tank 15%, Tank 15% |
| 8 | 71% | 49% | Sonic Tank 16%, Tank 15%, Fighter 14% |
| 9 | 71% | 50% | Light Medic 16%, Spotter Drone 14%, Tank 14% |
| 10 | 74% | 50% | Sonic Tank 16%, Tank 15%, Light Medic 15% |
| 11 | 74% | 50% | Tank 16%, Light Medic 16%, Fighter 16% |
| 12 | 71% | 50% | Tank 17%, Sonic Tank 16%, Light Medic 15% |
| 13 | 74% | 49% | Tank 16%, Light Medic 16%, Fighter 16% |
| 14 | 69% | 49% | Tank 17%, Light Medic 17%, Sonic Tank 16% |
| 15 | 75% | 51% | Sonic Tank 17%, Tank 15%, Fighter 14% |
| 16 | 68% | 50% | Tank 17%, Sonic Tank 15%, Spotter Drone 14% |
| 17 | 69% | 50% | Spotter Drone 17%, Sonic Tank 16%, Tank 15% |
| 18 | 75% | 50% | Tank 16%, Sonic Tank 16%, Spotter Drone 14% |
| 19 | 73% | 50% | Tank 16%, Sonic Tank 16%, Spotter Drone 15% |
| 20 | 70% | 50% | Tank 16%, Sonic Tank 16%, Spotter Drone 16% |

## The best personalities against the hand-tuned AI

60 games each, seats and maps mixed.

| Personality | Wins against the default AI | Units it built (share) | Upgrades and captures per game |
|---|---|---|---|
| Tank and Sonic Tank | 88% | Scout Bike 42%, Light Medic 26%, Tank 20%, Light Harvester 10%, Anti-Aircraft Jeep 1% | captures 0.0 |
| Tank and Sonic Tank | 88% | Scout Bike 34%, Light Medic 32%, Tank 22%, Light Harvester 12%, Anti-Aircraft Jeep 1% | captures 0.0 |
| Tank and Sonic Tank | 95% | Scout Bike 41%, Light Medic 26%, Tank 22%, Light Harvester 9%, Anti-Aircraft Jeep 1% | captures 0.0 |

## Genes of the best personality

```json
{
  "mix": {
    "tank": 1,
    "heavyCannon": 0.39,
    "artillery": 0,
    "blastCannon": 0.57,
    "sonicTank": 1,
    "scoutBike": 0.83,
    "spotterDrone": 1,
    "attackHelicopter": 0.12,
    "fighter": 0.68,
    "antiAircraftJeep": 0,
    "lightMedic": 0.68
  },
  "harvestersEarly": 2,
  "harvestersMax": 2,
  "antiAirPerEnemyAir": 1.31,
  "factoryLifeValue": 219.66,
  "killBonusShare": 0.25,
  "returnFireCaution": 1.67,
  "homeDefenceRadius": 2,
  "standOff": 3,
  "harvesterDangerRadius": 0,
  "dangerPenalty": 8,
  "scoutWatchDistance": 3,
  "armySizeForMedic": 2,
  "patience": 0.27,
  "captureFactories": 0,
  "transportInfantry": 0.22
}
```
