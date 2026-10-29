# Evolved AI personalities

Produced by `node evolve.js --generations 20 --population 16 --games 8 --seed 1 --set capture.mustStartNextTo=true`. Each generation every personality plays games against others on fixed map 1 and generated maps; the best quarter survive and the rest are mixed and mutated copies of them. Games over 60 rounds count as draws.

## Progress

| Generation | Best win rate | Mean win rate | Best personality favours |
|---|---|---|---|
| 1 | 78% | 50% | Sonic Tank 17%, Scout Bike 17%, Heavy Cannon 17% |
| 2 | 65% | 50% | Artillery 44%, Tank 13%, Attack Helicopter 11% |
| 3 | 75% | 51% | Tank 37%, Sonic Tank 23%, Fighter 21% |
| 4 | 69% | 50% | Fighter 29%, Tank 29%, Spotter Drone 13% |
| 5 | 76% | 50% | Tank 23%, Sonic Tank 20%, Fighter 18% |
| 6 | 71% | 50% | Fighter 28%, Tank 28%, Spotter Drone 11% |
| 7 | 74% | 49% | Fighter 22%, Tank 21%, Artillery 17% |
| 8 | 70% | 49% | Fighter 22%, Tank 21%, Artillery 17% |
| 9 | 68% | 50% | Tank 32%, Fighter 23%, Artillery 13% |
| 10 | 68% | 50% | Tank 29%, Fighter 22%, Attack Helicopter 19% |
| 11 | 73% | 50% | Tank 24%, Attack Helicopter 19%, Fighter 16% |
| 12 | 76% | 50% | Tank 24%, Attack Helicopter 19%, Fighter 16% |
| 13 | 77% | 50% | Tank 29%, Attack Helicopter 19%, Blast Cannon 17% |
| 14 | 71% | 50% | Fighter 28%, Tank 19%, Spotter Drone 15% |
| 15 | 67% | 50% | Fighter 23%, Tank 20%, Spotter Drone 16% |
| 16 | 66% | 50% | Tank 24%, Fighter 21%, Blast Cannon 17% |
| 17 | 71% | 50% | Fighter 23%, Tank 20%, Spotter Drone 16% |
| 18 | 61% | 49% | Fighter 23%, Tank 20%, Spotter Drone 16% |
| 19 | 68% | 50% | Tank 26%, Fighter 23%, Blast Cannon 16% |
| 20 | 79% | 51% | Tank 26%, Fighter 23%, Blast Cannon 16% |

## The best personalities against the hand-tuned AI

60 games each, seats and maps mixed.

| Personality | Wins against the default AI | Units it built (share) | Upgrades and captures per game |
|---|---|---|---|
| Tank and Fighter | 84% | Light Medic 40%, Artillery 29%, Tank 29%, Anti-Aircraft Jeep 1%, Light Harvester 1%, Scout Bike 1% | captures 0.0 |
| Tank and Fighter | 81% | Light Medic 45%, Artillery 27%, Tank 26%, Anti-Aircraft Jeep 1%, Scout Bike 1%, Light Harvester 1% | captures 0.0 |
| Tank and Fighter | 78% | Light Medic 31%, Artillery 26%, Anti-Aircraft Jeep 20%, Tank 19%, Scout Bike 2%, Light Harvester 1% | captures 0.0 |

## Genes of the best personality

```json
{
  "mix": {
    "tank": 0.76,
    "heavyCannon": 0.01,
    "artillery": 0.34,
    "blastCannon": 0.47,
    "sonicTank": 0,
    "scoutBike": 0,
    "spotterDrone": 0.42,
    "attackHelicopter": 0.21,
    "fighter": 0.67,
    "antiAircraftJeep": 0,
    "lightMedic": 0.07
  },
  "harvestersEarly": 1,
  "harvestersMax": 1,
  "antiAirPerEnemyAir": 0.87,
  "factoryLifeValue": 50,
  "killBonusShare": 0.49,
  "returnFireCaution": 0.46,
  "homeDefenceRadius": 6,
  "standOff": 2,
  "harvesterDangerRadius": 1,
  "dangerPenalty": 1.56,
  "scoutWatchDistance": 4,
  "armySizeForMedic": 2,
  "patience": 0.22,
  "captureFactories": 0,
  "transportInfantry": 0.35
}
```
