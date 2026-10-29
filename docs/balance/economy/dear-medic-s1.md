# Evolved AI personalities

Produced by `node evolve.js --generations 20 --population 16 --games 8 --seed 1 --set units.lightMedic.cost=60`. Each generation every personality plays games against others on fixed map 1 and generated maps; the best quarter survive and the rest are mixed and mutated copies of them. Games over 60 rounds count as draws.

## Progress

| Generation | Best win rate | Mean win rate | Best personality favours |
|---|---|---|---|
| 1 | 87% | 50% | Light Medic 15%, Anti-Aircraft Jeep 15%, Tank 14% |
| 2 | 74% | 49% | Fighter 21%, Heavy Cannon 20%, Artillery 18% |
| 3 | 86% | 50% | Artillery 29%, Heavy Cannon 19%, Sonic Tank 15% |
| 4 | 66% | 50% | Artillery 22%, Tank 17%, Spotter Drone 16% |
| 5 | 76% | 50% | Artillery 22%, Tank 17%, Spotter Drone 16% |
| 6 | 68% | 50% | Heavy Cannon 22%, Artillery 21%, Sonic Tank 17% |
| 7 | 79% | 50% | Heavy Cannon 18%, Artillery 18%, Sonic Tank 14% |
| 8 | 77% | 52% | Tank 23%, Artillery 22%, Heavy Cannon 17% |
| 9 | 81% | 52% | Heavy Cannon 27%, Tank 19%, Artillery 15% |
| 10 | 75% | 50% | Tank 23%, Spotter Drone 19%, Heavy Cannon 15% |
| 11 | 69% | 49% | Tank 23%, Spotter Drone 19%, Heavy Cannon 15% |
| 12 | 64% | 50% | Tank 19%, Heavy Cannon 17%, Spotter Drone 14% |
| 13 | 82% | 50% | Heavy Cannon 21%, Tank 18%, Blast Cannon 17% |
| 14 | 68% | 51% | Heavy Cannon 21%, Tank 17%, Blast Cannon 16% |
| 15 | 71% | 50% | Heavy Cannon 21%, Spotter Drone 17%, Tank 16% |
| 16 | 85% | 50% | Heavy Cannon 18%, Spotter Drone 18%, Tank 14% |
| 17 | 65% | 49% | Heavy Cannon 24%, Tank 18%, Artillery 15% |
| 18 | 81% | 50% | Heavy Cannon 23%, Tank 18%, Artillery 14% |
| 19 | 85% | 51% | Heavy Cannon 18%, Spotter Drone 15%, Tank 13% |
| 20 | 73% | 50% | Heavy Cannon 19%, Spotter Drone 17%, Tank 14% |

## The best personalities against the hand-tuned AI

60 games each, seats and maps mixed.

| Personality | Wins against the default AI | Units it built (share) | Upgrades and captures per game |
|---|---|---|---|
| Heavy Cannon and Spotter Drone | 80% | Scout Bike 52%, Artillery 24%, Tank 24%, Light Harvester 0% | captures 0.0 |
| Heavy Cannon and Blast Cannon | 71% | Scout Bike 52%, Tank 24%, Artillery 24%, Light Harvester 0% | captures 0.0 |
| Blast Cannon and Heavy Cannon | 70% | Scout Bike 51%, Tank 20%, Artillery 17%, Light Harvester 12% | captures 0.0 |

## Genes of the best personality

```json
{
  "mix": {
    "tank": 0.7,
    "heavyCannon": 0.93,
    "artillery": 0.68,
    "blastCannon": 0.41,
    "sonicTank": 0.13,
    "scoutBike": 0.03,
    "spotterDrone": 0.82,
    "attackHelicopter": 0.52,
    "fighter": 0.64,
    "antiAircraftJeep": 0,
    "lightMedic": 0
  },
  "harvestersEarly": 1,
  "harvestersMax": 1,
  "antiAirPerEnemyAir": 0,
  "factoryLifeValue": 89.4,
  "killBonusShare": 0.56,
  "returnFireCaution": 0.82,
  "homeDefenceRadius": 2,
  "standOff": 1,
  "harvesterDangerRadius": 2,
  "dangerPenalty": 6.14,
  "scoutWatchDistance": 3,
  "armySizeForMedic": 5,
  "patience": 0.04,
  "captureFactories": 0,
  "transportInfantry": 0.16
}
```
