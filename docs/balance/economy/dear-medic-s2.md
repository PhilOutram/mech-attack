# Evolved AI personalities

Produced by `node evolve.js --generations 20 --population 16 --games 8 --seed 2 --set units.lightMedic.cost=60`. Each generation every personality plays games against others on fixed map 1 and generated maps; the best quarter survive and the rest are mixed and mutated copies of them. Games over 60 rounds count as draws.

## Progress

| Generation | Best win rate | Mean win rate | Best personality favours |
|---|---|---|---|
| 1 | 82% | 50% | Artillery 17%, Scout Bike 17%, Spotter Drone 14% |
| 2 | 89% | 50% | Attack Helicopter 33%, Tank 16%, Sonic Tank 15% |
| 3 | 88% | 51% | Artillery 23%, Scout Bike 22%, Fighter 16% |
| 4 | 71% | 50% | Tank 34%, Artillery 15%, Attack Helicopter 15% |
| 5 | 73% | 50% | Tank 34%, Artillery 15%, Attack Helicopter 15% |
| 6 | 69% | 50% | Fighter 26%, Tank 25%, Artillery 11% |
| 7 | 67% | 50% | Spotter Drone 25%, Fighter 19%, Tank 18% |
| 8 | 75% | 49% | Spotter Drone 25%, Fighter 19%, Tank 18% |
| 9 | 63% | 50% | Spotter Drone 22%, Fighter 22%, Tank 17% |
| 10 | 71% | 50% | Spotter Drone 23%, Fighter 18%, Scout Bike 15% |
| 11 | 71% | 49% | Spotter Drone 22%, Scout Bike 19%, Fighter 17% |
| 12 | 75% | 50% | Scout Bike 22%, Spotter Drone 21%, Fighter 17% |
| 13 | 71% | 50% | Spotter Drone 22%, Scout Bike 19%, Fighter 17% |
| 14 | 91% | 50% | Spotter Drone 25%, Fighter 20%, Scout Bike 18% |
| 15 | 80% | 51% | Spotter Drone 23%, Scout Bike 21%, Fighter 19% |
| 16 | 67% | 50% | Scout Bike 23%, Spotter Drone 23%, Fighter 19% |
| 17 | 69% | 51% | Fighter 25%, Scout Bike 24%, Spotter Drone 21% |
| 18 | 73% | 51% | Spotter Drone 25%, Fighter 24%, Scout Bike 18% |
| 19 | 75% | 50% | Spotter Drone 27%, Fighter 22%, Scout Bike 19% |
| 20 | 76% | 48% | Spotter Drone 28%, Fighter 27%, Scout Bike 20% |

## The best personalities against the hand-tuned AI

60 games each, seats and maps mixed.

| Personality | Wins against the default AI | Units it built (share) | Upgrades and captures per game |
|---|---|---|---|
| Spotter Drone and Fighter | 70% | Scout Bike 39%, Infantry 37%, Tank 12%, Light Harvester 11%, Anti-Aircraft Jeep 1% | captures 2.9 |
| Spotter Drone and Fighter | 75% | Scout Bike 43%, Infantry 31%, Tank 15%, Light Harvester 11%, Anti-Aircraft Jeep 1% | captures 2.4 |
| Spotter Drone and Fighter | 76% | Scout Bike 41%, Infantry 27%, Light Medic 11%, Tank 11%, Light Harvester 10%, Anti-Aircraft Jeep 0% | captures 1.9 |

## Genes of the best personality

```json
{
  "mix": {
    "tank": 0.7,
    "heavyCannon": 0.15,
    "artillery": 0,
    "blastCannon": 0,
    "sonicTank": 0.02,
    "scoutBike": 0.71,
    "spotterDrone": 1,
    "attackHelicopter": 0,
    "fighter": 0.96,
    "antiAircraftJeep": 0,
    "lightMedic": 0
  },
  "harvestersEarly": 2,
  "harvestersMax": 2,
  "antiAirPerEnemyAir": 1.2,
  "factoryLifeValue": 257.78,
  "killBonusShare": 0,
  "returnFireCaution": 1.08,
  "homeDefenceRadius": 6,
  "standOff": 2,
  "harvesterDangerRadius": 0,
  "dangerPenalty": 5.4,
  "scoutWatchDistance": 3,
  "armySizeForMedic": 3,
  "patience": 0.13,
  "captureFactories": 2,
  "transportInfantry": 0.11
}
```
