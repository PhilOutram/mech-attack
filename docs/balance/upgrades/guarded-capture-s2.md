# Evolved AI personalities

Produced by `node evolve.js --generations 20 --population 16 --games 8 --seed 2 --set capture.guarded=true`. Each generation every personality plays games against others on fixed map 1 and generated maps; the best quarter survive and the rest are mixed and mutated copies of them. Games over 60 rounds count as draws.

## Progress

| Generation | Best win rate | Mean win rate | Best personality favours |
|---|---|---|---|
| 1 | 90% | 49% | Sonic Tank 15%, Light Medic 13%, Fighter 13% |
| 2 | 86% | 50% | Sonic Tank 15%, Tank 15%, Fighter 13% |
| 3 | 93% | 50% | Light Medic 20%, Sonic Tank 18%, Tank 15% |
| 4 | 68% | 49% | Tank 20%, Sonic Tank 17%, Light Medic 15% |
| 5 | 82% | 50% | Light Medic 19%, Tank 14%, Sonic Tank 12% |
| 6 | 78% | 50% | Light Medic 18%, Sonic Tank 15%, Blast Cannon 14% |
| 7 | 79% | 51% | Sonic Tank 19%, Light Medic 19%, Tank 18% |
| 8 | 79% | 49% | Sonic Tank 19%, Light Medic 19%, Heavy Cannon 15% |
| 9 | 88% | 51% | Sonic Tank 19%, Light Medic 18%, Tank 18% |
| 10 | 69% | 51% | Light Medic 17%, Tank 15%, Sonic Tank 15% |
| 11 | 75% | 50% | Light Medic 17%, Sonic Tank 17%, Tank 16% |
| 12 | 75% | 50% | Tank 20%, Sonic Tank 20%, Light Medic 19% |
| 13 | 74% | 50% | Tank 17%, Sonic Tank 17%, Light Medic 16% |
| 14 | 80% | 50% | Light Medic 20%, Sonic Tank 20%, Tank 18% |
| 15 | 73% | 51% | Light Medic 22%, Sonic Tank 20%, Tank 19% |
| 16 | 75% | 49% | Light Medic 19%, Sonic Tank 17%, Tank 17% |
| 17 | 69% | 51% | Light Medic 22%, Blast Cannon 21%, Tank 19% |
| 18 | 73% | 50% | Tank 21%, Light Medic 20%, Blast Cannon 18% |
| 19 | 69% | 49% | Tank 20%, Light Medic 20%, Heavy Cannon 16% |
| 20 | 76% | 49% | Tank 21%, Light Medic 21%, Heavy Cannon 16% |

## The best personalities against the hand-tuned AI

60 games each, seats and maps mixed.

| Personality | Wins against the default AI | Units it built (share) | Upgrades and captures per game |
|---|---|---|---|
| Tank and Light Medic | 95% | Scout Bike 38%, Light Medic 38%, Tank 22%, Anti-Aircraft Jeep 1% | captures 0.0 |
| Tank and Light Medic | 95% | Scout Bike 39%, Light Medic 36%, Tank 23%, Anti-Aircraft Jeep 2%, Light Harvester 0% | captures 0.0 |
| Light Medic and Tank | 86% | Scout Bike 36%, Light Medic 34%, Artillery 14%, Tank 14%, Anti-Aircraft Jeep 1%, Light Harvester 0% | captures 0.0 |

## Genes of the best personality

```json
{
  "mix": {
    "tank": 1,
    "heavyCannon": 0.77,
    "artillery": 0,
    "blastCannon": 0.56,
    "sonicTank": 0.72,
    "scoutBike": 0.48,
    "spotterDrone": 0.03,
    "attackHelicopter": 0.19,
    "fighter": 0,
    "antiAircraftJeep": 0,
    "lightMedic": 1
  },
  "harvestersEarly": 1,
  "harvestersMax": 1,
  "antiAirPerEnemyAir": 1.57,
  "factoryLifeValue": 167.81,
  "killBonusShare": 0.26,
  "returnFireCaution": 1.08,
  "homeDefenceRadius": 4,
  "standOff": 3,
  "harvesterDangerRadius": 0,
  "dangerPenalty": 7.97,
  "scoutWatchDistance": 2,
  "armySizeForMedic": 1,
  "patience": 0.31,
  "captureFactories": 0,
  "transportInfantry": 0.88
}
```
