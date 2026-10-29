# Evolved AI personalities

Produced by `node evolve.js --generations 20 --population 16 --games 8 --seed 1 --set capture.incomePerTurn=10`. Each generation every personality plays games against others on fixed map 1 and generated maps; the best quarter survive and the rest are mixed and mutated copies of them. Games over 60 rounds count as draws.

## Progress

| Generation | Best win rate | Mean win rate | Best personality favours |
|---|---|---|---|
| 1 | 77% | 50% | Light Medic 15%, Anti-Aircraft Jeep 15%, Tank 14% |
| 2 | 81% | 49% | Heavy Cannon 31%, Artillery 22%, Tank 14% |
| 3 | 86% | 50% | Heavy Cannon 31%, Artillery 23%, Tank 14% |
| 4 | 81% | 50% | Tank 25%, Artillery 23%, Blast Cannon 15% |
| 5 | 76% | 50% | Tank 26%, Artillery 20%, Blast Cannon 16% |
| 6 | 79% | 50% | Tank 24%, Scout Bike 16%, Blast Cannon 15% |
| 7 | 94% | 51% | Heavy Cannon 36%, Tank 17%, Scout Bike 16% |
| 8 | 77% | 50% | Artillery 23%, Tank 20%, Blast Cannon 13% |
| 9 | 81% | 51% | Tank 20%, Scout Bike 16%, Artillery 15% |
| 10 | 86% | 50% | Heavy Cannon 36%, Tank 17%, Scout Bike 16% |
| 11 | 84% | 49% | Tank 26%, Scout Bike 24%, Artillery 23% |
| 12 | 69% | 50% | Artillery 22%, Tank 19%, Attack Helicopter 16% |
| 13 | 81% | 48% | Scout Bike 22%, Attack Helicopter 20%, Tank 18% |
| 14 | 70% | 51% | Tank 30%, Artillery 27%, Blast Cannon 18% |
| 15 | 75% | 50% | Spotter Drone 21%, Tank 20%, Attack Helicopter 18% |
| 16 | 61% | 50% | Tank 23%, Artillery 21%, Blast Cannon 16% |
| 17 | 74% | 50% | Tank 28%, Artillery 25%, Blast Cannon 17% |
| 18 | 73% | 50% | Tank 27%, Blast Cannon 27%, Scout Bike 22% |
| 19 | 70% | 49% | Tank 39%, Blast Cannon 23%, Scout Bike 16% |
| 20 | 86% | 51% | Blast Cannon 30%, Tank 25%, Artillery 17% |

## The best personalities against the hand-tuned AI

60 games each, seats and maps mixed.

| Personality | Wins against the default AI | Units it built (share) | Upgrades and captures per game |
|---|---|---|---|
| Blast Cannon and Tank | 78% | Infantry 39%, Scout Bike 35%, Light Medic 11%, Tank 9%, Artillery 6% | captures 2.8 |
| Spotter Drone and Blast Cannon | 68% | Scout Bike 36%, Infantry 35%, Light Medic 14%, Tank 7%, Artillery 4%, Light Harvester 4% | captures 2.7 |
| Tank and Spotter Drone | 83% | Scout Bike 54%, Infantry 31%, Tank 9%, Artillery 4%, Anti-Aircraft Jeep 1%, Light Harvester 0% | captures 3.0 |

## Genes of the best personality

```json
{
  "mix": {
    "tank": 0.4,
    "heavyCannon": 0,
    "artillery": 0.27,
    "blastCannon": 0.48,
    "sonicTank": 0,
    "scoutBike": 0.06,
    "spotterDrone": 0,
    "attackHelicopter": 0.14,
    "fighter": 0.16,
    "antiAircraftJeep": 0,
    "lightMedic": 0.08
  },
  "harvestersEarly": 1,
  "harvestersMax": 1,
  "antiAirPerEnemyAir": 0.33,
  "factoryLifeValue": 232.53,
  "killBonusShare": 0.65,
  "returnFireCaution": 0.46,
  "homeDefenceRadius": 3,
  "standOff": 2,
  "harvesterDangerRadius": 2,
  "dangerPenalty": 7.02,
  "scoutWatchDistance": 4,
  "armySizeForMedic": 6,
  "patience": 0.32,
  "captureFactories": 2,
  "transportInfantry": 0.2
}
```
