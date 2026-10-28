# Evolved AI personalities

Produced by `node evolve.js --generations 40 --population 20 --games 10 --seed 1`. Each generation every personality plays games against others on fixed map 1 and generated maps; the best quarter survive and the rest are mixed and mutated copies of them. Games over 60 rounds count as draws.

## Progress

| Generation | Best win rate | Mean win rate | Best personality favours |
|---|---|---|---|
| 1 | 80% | 50% | Sonic Tank 17%, Scout Bike 17%, Heavy Cannon 17% |
| 2 | 88% | 50% | Tank 17%, Light Medic 17%, Spotter Drone 14% |
| 3 | 80% | 50% | Tank 25%, Heavy Cannon 16%, Spotter Drone 11% |
| 4 | 75% | 49% | Tank 28%, Heavy Cannon 16%, Spotter Drone 11% |
| 5 | 71% | 50% | Tank 24%, Fighter 21%, Heavy Cannon 19% |
| 6 | 74% | 49% | Scout Bike 24%, Tank 20%, Fighter 15% |
| 7 | 86% | 50% | Tank 24%, Fighter 22%, Heavy Cannon 15% |
| 8 | 78% | 50% | Tank 28%, Fighter 20%, Heavy Cannon 16% |
| 9 | 78% | 49% | Tank 24%, Fighter 22%, Heavy Cannon 15% |
| 10 | 86% | 50% | Tank 26%, Heavy Cannon 20%, Fighter 15% |
| 11 | 76% | 51% | Tank 26%, Heavy Cannon 20%, Fighter 15% |
| 12 | 66% | 50% | Heavy Cannon 23%, Fighter 18%, Tank 15% |
| 13 | 82% | 50% | Tank 23%, Fighter 22%, Heavy Cannon 15% |
| 14 | 81% | 51% | Tank 35%, Fighter 17%, Sonic Tank 13% |
| 15 | 75% | 50% | Fighter 23%, Heavy Cannon 20%, Tank 19% |
| 16 | 70% | 50% | Tank 35%, Fighter 17%, Sonic Tank 13% |
| 17 | 76% | 51% | Tank 27%, Heavy Cannon 19%, Light Medic 14% |
| 18 | 72% | 50% | Tank 31%, Light Medic 17%, Fighter 15% |
| 19 | 78% | 50% | Light Medic 24%, Fighter 21%, Tank 18% |
| 20 | 68% | 50% | Tank 28%, Heavy Cannon 24%, Light Medic 15% |
| 21 | 69% | 49% | Tank 27%, Heavy Cannon 23%, Light Medic 14% |
| 22 | 73% | 50% | Tank 27%, Heavy Cannon 23%, Light Medic 14% |
| 23 | 71% | 50% | Tank 28%, Heavy Cannon 19%, Light Medic 15% |
| 24 | 67% | 50% | Tank 31%, Heavy Cannon 22%, Fighter 15% |
| 25 | 75% | 50% | Tank 35%, Heavy Cannon 26%, Light Medic 13% |
| 26 | 68% | 50% | Tank 36%, Heavy Cannon 24%, Blast Cannon 15% |
| 27 | 88% | 51% | Tank 36%, Heavy Cannon 24%, Blast Cannon 15% |
| 28 | 68% | 50% | Tank 37%, Heavy Cannon 24%, Blast Cannon 15% |
| 29 | 66% | 50% | Tank 33%, Heavy Cannon 22%, Fighter 20% |
| 30 | 72% | 50% | Tank 43%, Heavy Cannon 29%, Scout Bike 10% |
| 31 | 76% | 50% | Tank 33%, Heavy Cannon 25%, Fighter 21% |
| 32 | 68% | 49% | Tank 40%, Heavy Cannon 31%, Attack Helicopter 17% |
| 33 | 70% | 50% | Tank 39%, Heavy Cannon 19%, Blast Cannon 15% |
| 34 | 75% | 50% | Tank 54%, Heavy Cannon 26%, Scout Bike 15% |
| 35 | 68% | 50% | Tank 41%, Heavy Cannon 30%, Attack Helicopter 11% |
| 36 | 73% | 50% | Tank 55%, Heavy Cannon 26%, Scout Bike 8% |
| 37 | 73% | 50% | Tank 57%, Heavy Cannon 16%, Blast Cannon 15% |
| 38 | 83% | 51% | Tank 51%, Heavy Cannon 24%, Scout Bike 10% |
| 39 | 79% | 50% | Tank 37%, Heavy Cannon 22%, Attack Helicopter 14% |
| 40 | 71% | 50% | Tank 48%, Heavy Cannon 23%, Scout Bike 11% |

## The best personalities against the hand-tuned AI

100 games each, seats and maps mixed.

| Personality | Wins against the default AI | Units it built (share) | Upgrades and captures per game |
|---|---|---|---|
| Tank and Heavy Cannon | 93% | Scout Bike 35%, Tank 29%, Light Medic 22%, Light Harvester 12%, Anti-Aircraft Jeep 1% | captures 0.0 |
| Tank and Heavy Cannon | 91% | Scout Bike 39%, Tank 30%, Light Medic 16%, Light Harvester 14%, Anti-Aircraft Jeep 1% | captures 0.0 |
| Tank and Heavy Cannon | 86% | Scout Bike 39%, Tank 26%, Light Medic 21%, Light Harvester 13%, Anti-Aircraft Jeep 0% | captures 0.0 |
| Tank and Heavy Cannon | 91% | Scout Bike 34%, Tank 29%, Light Medic 22%, Light Harvester 14%, Anti-Aircraft Jeep 1% | captures 0.0 |
| Tank and Heavy Cannon | 92% | Scout Bike 39%, Tank 27%, Light Medic 20%, Light Harvester 13%, Anti-Aircraft Jeep 1% | captures 0.0 |

## Genes of the best personality

```json
{
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
  },
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
  "transportInfantry": 0
}
```
