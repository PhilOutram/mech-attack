# Evolved AI personalities

Produced by `node evolve.js --generations 20 --population 16 --games 8 --seed 1 --set capture.guarded=true`. Each generation every personality plays games against others on fixed map 1 and generated maps; the best quarter survive and the rest are mixed and mutated copies of them. Games over 60 rounds count as draws.

## Progress

| Generation | Best win rate | Mean win rate | Best personality favours |
|---|---|---|---|
| 1 | 91% | 50% | Tank 25%, Attack Helicopter 15%, Heavy Cannon 10% |
| 2 | 73% | 50% | Sonic Tank 17%, Scout Bike 17%, Heavy Cannon 17% |
| 3 | 69% | 51% | Sonic Tank 17%, Scout Bike 17%, Heavy Cannon 17% |
| 4 | 89% | 51% | Sonic Tank 30%, Tank 19%, Artillery 13% |
| 5 | 79% | 50% | Sonic Tank 26%, Artillery 20%, Tank 18% |
| 6 | 71% | 50% | Sonic Tank 27%, Tank 19%, Artillery 17% |
| 7 | 75% | 50% | Sonic Tank 25%, Tank 18%, Artillery 16% |
| 8 | 70% | 50% | Sonic Tank 26%, Tank 21%, Artillery 12% |
| 9 | 69% | 50% | Sonic Tank 26%, Tank 21%, Artillery 12% |
| 10 | 68% | 50% | Sonic Tank 26%, Tank 21%, Heavy Cannon 13% |
| 11 | 74% | 49% | Sonic Tank 26%, Tank 20%, Heavy Cannon 13% |
| 12 | 73% | 50% | Sonic Tank 26%, Tank 21%, Heavy Cannon 14% |
| 13 | 71% | 50% | Sonic Tank 24%, Tank 18%, Blast Cannon 16% |
| 14 | 93% | 50% | Sonic Tank 24%, Tank 19%, Blast Cannon 16% |
| 15 | 77% | 49% | Sonic Tank 26%, Tank 20%, Blast Cannon 17% |
| 16 | 97% | 51% | Sonic Tank 20%, Tank 17%, Blast Cannon 17% |
| 17 | 80% | 51% | Sonic Tank 24%, Tank 18%, Light Medic 14% |
| 18 | 75% | 50% | Sonic Tank 25%, Tank 18%, Blast Cannon 15% |
| 19 | 73% | 50% | Sonic Tank 21%, Tank 17%, Blast Cannon 15% |
| 20 | 84% | 50% | Sonic Tank 21%, Tank 18%, Blast Cannon 16% |

## The best personalities against the hand-tuned AI

60 games each, seats and maps mixed.

| Personality | Wins against the default AI | Units it built (share) | Upgrades and captures per game |
|---|---|---|---|
| Sonic Tank and Tank | 84% | Infantry 38%, Scout Bike 25%, Light Harvester 12%, Artillery 10%, Tank 8%, Light Medic 7%, Anti-Aircraft Jeep 0% | captures 2.1 |
| Sonic Tank and Tank | 59% | Infantry 47%, Scout Bike 16%, Light Harvester 11%, Tank 8%, Artillery 7%, Anti-Aircraft Jeep 6%, Light Medic 5% | captures 1.9 |
| Sonic Tank and Tank | 75% | Infantry 39%, Scout Bike 20%, Light Harvester 11%, Artillery 9%, Anti-Aircraft Jeep 8%, Tank 8%, Light Medic 5% | captures 2.0 |

## Genes of the best personality

```json
{
  "mix": {
    "tank": 0.76,
    "heavyCannon": 0.45,
    "artillery": 0.44,
    "blastCannon": 0.7,
    "sonicTank": 0.9,
    "scoutBike": 0.33,
    "spotterDrone": 0,
    "attackHelicopter": 0.34,
    "fighter": 0,
    "antiAircraftJeep": 0,
    "lightMedic": 0.35
  },
  "harvestersEarly": 2,
  "harvestersMax": 2,
  "antiAirPerEnemyAir": 1.35,
  "factoryLifeValue": 124.25,
  "killBonusShare": 0.13,
  "returnFireCaution": 1.13,
  "homeDefenceRadius": 2,
  "standOff": 2,
  "harvesterDangerRadius": 1,
  "dangerPenalty": 0.6,
  "scoutWatchDistance": 2,
  "armySizeForMedic": 4,
  "patience": 0.4,
  "captureFactories": 2,
  "transportInfantry": 0.19
}
```
