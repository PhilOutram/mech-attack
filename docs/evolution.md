# Evolved AI personalities

Produced by `node evolve.js --generations 40 --population 20 --games 10 --seed 1`. Each generation every personality plays games against others on fixed map 1 and generated maps; the best quarter survive and the rest are mixed and mutated copies of them. Games over 60 rounds count as draws.

## Progress

| Generation | Best win rate | Mean win rate | Best personality favours |
|---|---|---|---|
| 1 | 76% | 49% | Sonic Tank 17%, Scout Bike 17%, Heavy Cannon 17% |
| 2 | 81% | 50% | Tank 20%, Fighter 17%, Heavy Cannon 16% |
| 3 | 67% | 50% | Sonic Tank 17%, Scout Bike 17%, Heavy Cannon 17% |
| 4 | 72% | 49% | Sonic Tank 17%, Scout Bike 17%, Heavy Cannon 17% |
| 5 | 81% | 50% | Tank 20%, Spotter Drone 16%, Heavy Cannon 15% |
| 6 | 71% | 49% | Scout Bike 20%, Heavy Cannon 18%, Fighter 17% |
| 7 | 75% | 51% | Heavy Cannon 21%, Scout Bike 18%, Fighter 17% |
| 8 | 73% | 51% | Heavy Cannon 19%, Scout Bike 18%, Fighter 17% |
| 9 | 79% | 50% | Heavy Cannon 20%, Scout Bike 18%, Fighter 15% |
| 10 | 66% | 50% | Heavy Cannon 19%, Fighter 18%, Scout Bike 14% |
| 11 | 77% | 50% | Heavy Cannon 21%, Tank 20%, Fighter 15% |
| 12 | 72% | 50% | Tank 21%, Heavy Cannon 16%, Fighter 16% |
| 13 | 95% | 49% | Tank 21%, Fighter 20%, Scout Bike 17% |
| 14 | 83% | 49% | Tank 22%, Scout Bike 17%, Fighter 17% |
| 15 | 69% | 49% | Fighter 21%, Tank 19%, Scout Bike 17% |
| 16 | 71% | 50% | Tank 22%, Scout Bike 17%, Fighter 17% |
| 17 | 73% | 51% | Tank 21%, Scout Bike 17%, Fighter 15% |
| 18 | 73% | 50% | Tank 22%, Scout Bike 17%, Fighter 17% |
| 19 | 74% | 50% | Tank 21%, Heavy Cannon 19%, Fighter 16% |
| 20 | 73% | 49% | Tank 20%, Fighter 18%, Scout Bike 17% |
| 21 | 75% | 50% | Tank 22%, Fighter 16%, Sonic Tank 15% |
| 22 | 65% | 49% | Tank 24%, Fighter 18%, Sonic Tank 15% |
| 23 | 69% | 50% | Tank 22%, Fighter 16%, Sonic Tank 15% |
| 24 | 79% | 49% | Tank 24%, Sonic Tank 18%, Scout Bike 15% |
| 25 | 69% | 50% | Tank 24%, Sonic Tank 18%, Scout Bike 15% |
| 26 | 80% | 49% | Tank 20%, Fighter 19%, Sonic Tank 18% |
| 27 | 74% | 51% | Tank 23%, Sonic Tank 17%, Fighter 16% |
| 28 | 76% | 50% | Tank 21%, Sonic Tank 18%, Heavy Cannon 17% |
| 29 | 79% | 50% | Tank 22%, Sonic Tank 18%, Heavy Cannon 17% |
| 30 | 78% | 50% | Tank 22%, Sonic Tank 19%, Heavy Cannon 17% |
| 31 | 80% | 50% | Tank 27%, Fighter 19%, Sonic Tank 16% |
| 32 | 73% | 50% | Tank 27%, Fighter 19%, Sonic Tank 16% |
| 33 | 80% | 50% | Tank 26%, Heavy Cannon 19%, Fighter 17% |
| 34 | 81% | 50% | Sonic Tank 21%, Heavy Cannon 21%, Fighter 14% |
| 35 | 82% | 50% | Tank 29%, Heavy Cannon 22%, Fighter 19% |
| 36 | 67% | 50% | Tank 27%, Heavy Cannon 22%, Fighter 19% |
| 37 | 80% | 51% | Tank 27%, Heavy Cannon 23%, Fighter 18% |
| 38 | 76% | 50% | Tank 23%, Heavy Cannon 22%, Fighter 20% |
| 39 | 74% | 50% | Tank 23%, Heavy Cannon 22%, Fighter 20% |
| 40 | 77% | 49% | Fighter 21%, Tank 21%, Heavy Cannon 20% |

## The best personalities against the hand-tuned AI

100 games each, seats and maps mixed.

| Personality | Wins against the default AI | Units it built (share) | Upgrades and captures per game |
|---|---|---|---|
| Fighter and Tank | 81% | Scout Bike 50%, Infantry 35%, Tank 13%, Anti-Aircraft Jeep 1%, Light Harvester 0% | captures 2.5 |
| Tank and Heavy Cannon | 86% | Scout Bike 54%, Infantry 34%, Tank 12%, Anti-Aircraft Jeep 1%, Light Harvester 0% | captures 3.1 |
| Tank and Heavy Cannon | 85% | Scout Bike 38%, Infantry 33%, Light Medic 15%, Tank 13%, Anti-Aircraft Jeep 1%, Light Harvester 0% | captures 3.1 |
| Tank and Heavy Cannon | 89% | Scout Bike 59%, Infantry 27%, Tank 13%, Anti-Aircraft Jeep 1% | captures 2.9 |
| Tank and Fighter | 87% | Scout Bike 55%, Infantry 31%, Tank 13%, Anti-Aircraft Jeep 1%, Light Harvester 0% | captures 3.0 |

## Genes of the best personality

```json
{
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
  },
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
  "transportInfantry": 0.15
}
```
