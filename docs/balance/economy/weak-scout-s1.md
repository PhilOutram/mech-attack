# Evolved AI personalities

Produced by `node evolve.js --generations 20 --population 16 --games 8 --seed 1 --set units.scoutBike.attack=10`. Each generation every personality plays games against others on fixed map 1 and generated maps; the best quarter survive and the rest are mixed and mutated copies of them. Games over 60 rounds count as draws.

## Progress

| Generation | Best win rate | Mean win rate | Best personality favours |
|---|---|---|---|
| 1 | 87% | 50% | Light Medic 15%, Anti-Aircraft Jeep 15%, Tank 14% |
| 2 | 76% | 49% | Fighter 21%, Heavy Cannon 20%, Artillery 18% |
| 3 | 93% | 51% | Tank 25%, Light Medic 25%, Artillery 14% |
| 4 | 69% | 50% | Tank 22%, Light Medic 22%, Artillery 17% |
| 5 | 84% | 50% | Tank 35%, Artillery 22%, Fighter 17% |
| 6 | 73% | 51% | Tank 30%, Artillery 19%, Heavy Cannon 16% |
| 7 | 75% | 51% | Tank 23%, Light Medic 22%, Artillery 19% |
| 8 | 77% | 50% | Tank 24%, Light Medic 24%, Artillery 15% |
| 9 | 81% | 50% | Tank 37%, Artillery 31%, Sonic Tank 14% |
| 10 | 63% | 50% | Tank 27%, Light Medic 27%, Attack Helicopter 12% |
| 11 | 78% | 50% | Tank 23%, Light Medic 23%, Artillery 18% |
| 12 | 82% | 51% | Tank 26%, Light Medic 21%, Attack Helicopter 15% |
| 13 | 67% | 50% | Tank 23%, Light Medic 23%, Artillery 18% |
| 14 | 71% | 51% | Tank 22%, Light Medic 22%, Artillery 18% |
| 15 | 73% | 50% | Tank 27%, Light Medic 27%, Attack Helicopter 14% |
| 16 | 69% | 50% | Light Medic 29%, Tank 27%, Attack Helicopter 15% |
| 17 | 71% | 50% | Light Medic 29%, Tank 28%, Attack Helicopter 15% |
| 18 | 73% | 51% | Light Medic 27%, Tank 23%, Artillery 13% |
| 19 | 74% | 49% | Light Medic 26%, Tank 26%, Attack Helicopter 14% |
| 20 | 76% | 51% | Light Medic 26%, Tank 24%, Artillery 13% |

## The best personalities against the hand-tuned AI

60 games each, seats and maps mixed.

| Personality | Wins against the default AI | Units it built (share) | Upgrades and captures per game |
|---|---|---|---|
| Light Medic and Tank | 93% | Light Medic 36%, Scout Bike 31%, Artillery 19%, Tank 11%, Anti-Aircraft Jeep 2%, Light Harvester 0% | captures 0.0 |
| Light Medic and Tank | 89% | Light Medic 36%, Scout Bike 30%, Artillery 19%, Tank 14%, Anti-Aircraft Jeep 2% | captures 0.0 |
| Tank and Light Medic | 79% | Scout Bike 30%, Light Medic 28%, Artillery 21%, Tank 20%, Anti-Aircraft Jeep 2% | captures 0.0 |

## Genes of the best personality

```json
{
  "mix": {
    "tank": 0.8,
    "heavyCannon": 0.1,
    "artillery": 0.44,
    "blastCannon": 0,
    "sonicTank": 0.32,
    "scoutBike": 0.07,
    "spotterDrone": 0.19,
    "attackHelicopter": 0.36,
    "fighter": 0.2,
    "antiAircraftJeep": 0,
    "lightMedic": 0.86
  },
  "harvestersEarly": 1,
  "harvestersMax": 1,
  "antiAirPerEnemyAir": 0.72,
  "factoryLifeValue": 135.01,
  "killBonusShare": 0.21,
  "returnFireCaution": 1.55,
  "homeDefenceRadius": 2,
  "standOff": 2,
  "harvesterDangerRadius": 0,
  "dangerPenalty": 2.33,
  "scoutWatchDistance": 3,
  "armySizeForMedic": 2,
  "patience": 0.14,
  "captureFactories": 0,
  "transportInfantry": 0
}
```
