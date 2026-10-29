# Evolved AI personalities

Produced by `node evolve.js --generations 20 --population 16 --games 8 --seed 2 --set units.scoutBike.attack=10`. Each generation every personality plays games against others on fixed map 1 and generated maps; the best quarter survive and the rest are mixed and mutated copies of them. Games over 60 rounds count as draws.

## Progress

| Generation | Best win rate | Mean win rate | Best personality favours |
|---|---|---|---|
| 1 | 93% | 50% | Sonic Tank 15%, Light Medic 13%, Fighter 13% |
| 2 | 75% | 50% | Sonic Tank 15%, Tank 15%, Fighter 13% |
| 3 | 68% | 50% | Sonic Tank 14%, Light Medic 12%, Heavy Cannon 12% |
| 4 | 86% | 50% | Tank 16%, Fighter 14%, Light Medic 13% |
| 5 | 65% | 50% | Tank 16%, Sonic Tank 16%, Light Medic 13% |
| 6 | 67% | 49% | Tank 16%, Sonic Tank 15%, Fighter 14% |
| 7 | 71% | 50% | Tank 15%, Sonic Tank 15%, Fighter 14% |
| 8 | 66% | 50% | Sonic Tank 15%, Tank 15%, Light Medic 14% |
| 9 | 70% | 50% | Fighter 18%, Tank 16%, Sonic Tank 15% |
| 10 | 69% | 49% | Tank 17%, Sonic Tank 17%, Scout Bike 15% |
| 11 | 69% | 49% | Fighter 18%, Tank 16%, Sonic Tank 15% |
| 12 | 76% | 50% | Fighter 18%, Sonic Tank 16%, Tank 14% |
| 13 | 84% | 50% | Fighter 18%, Sonic Tank 16%, Tank 16% |
| 14 | 71% | 51% | Sonic Tank 17%, Tank 17%, Fighter 15% |
| 15 | 75% | 50% | Tank 17%, Fighter 16%, Sonic Tank 15% |
| 16 | 74% | 50% | Fighter 17%, Tank 15%, Sonic Tank 14% |
| 17 | 65% | 51% | Tank 17%, Fighter 16%, Sonic Tank 15% |
| 18 | 68% | 50% | Fighter 17%, Sonic Tank 15%, Tank 13% |
| 19 | 71% | 50% | Tank 16%, Fighter 15%, Sonic Tank 14% |
| 20 | 70% | 51% | Tank 19%, Fighter 17%, Light Medic 14% |

## The best personalities against the hand-tuned AI

60 games each, seats and maps mixed.

| Personality | Wins against the default AI | Units it built (share) | Upgrades and captures per game |
|---|---|---|---|
| Tank and Fighter | 88% | Scout Bike 35%, Light Medic 31%, Tank 23%, Light Harvester 10%, Anti-Aircraft Jeep 1% | captures 0.0 |
| Tank and Fighter | 93% | Scout Bike 35%, Light Medic 30%, Tank 24%, Light Harvester 8%, Anti-Aircraft Jeep 2% | captures 0.0 |
| Tank and Fighter | 93% | Scout Bike 36%, Light Medic 30%, Tank 22%, Light Harvester 10%, Anti-Aircraft Jeep 1% | captures 0.0 |

## Genes of the best personality

```json
{
  "mix": {
    "tank": 1,
    "heavyCannon": 0.28,
    "artillery": 0,
    "blastCannon": 0.44,
    "sonicTank": 0.7,
    "scoutBike": 0.51,
    "spotterDrone": 0.4,
    "attackHelicopter": 0.34,
    "fighter": 0.91,
    "antiAircraftJeep": 0,
    "lightMedic": 0.75
  },
  "harvestersEarly": 2,
  "harvestersMax": 2,
  "antiAirPerEnemyAir": 1.74,
  "factoryLifeValue": 141.56,
  "killBonusShare": 0.19,
  "returnFireCaution": 2,
  "homeDefenceRadius": 5,
  "standOff": 2,
  "harvesterDangerRadius": 1,
  "dangerPenalty": 3.07,
  "scoutWatchDistance": 2,
  "armySizeForMedic": 1,
  "patience": 0.18,
  "captureFactories": 0,
  "transportInfantry": 0
}
```
