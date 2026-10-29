# Evolved AI personalities

Produced by `node evolve.js --generations 20 --population 16 --games 8 --seed 1 --set units.scoutBike.cost=45 --set units.lightMedic.cost=60 --set capture.incomePerTurn=10`. Each generation every personality plays games against others on fixed map 1 and generated maps; the best quarter survive and the rest are mixed and mutated copies of them. Games over 60 rounds count as draws.

## Progress

| Generation | Best win rate | Mean win rate | Best personality favours |
|---|---|---|---|
| 1 | 83% | 50% | Tank 15%, Light Medic 13%, Fighter 13% |
| 2 | 76% | 50% | Heavy Cannon 28%, Artillery 21%, Scout Bike 13% |
| 3 | 75% | 51% | Heavy Cannon 22%, Artillery 21%, Tank 17% |
| 4 | 64% | 50% | Heavy Cannon 27%, Sonic Tank 19%, Artillery 17% |
| 5 | 88% | 51% | Tank 38%, Heavy Cannon 23%, Spotter Drone 14% |
| 6 | 71% | 50% | Tank 39%, Heavy Cannon 23%, Spotter Drone 14% |
| 7 | 77% | 51% | Tank 32%, Heavy Cannon 30%, Sonic Tank 19% |
| 8 | 71% | 50% | Tank 41%, Heavy Cannon 22%, Attack Helicopter 11% |
| 9 | 69% | 51% | Tank 32%, Heavy Cannon 28%, Sonic Tank 13% |
| 10 | 78% | 49% | Tank 30%, Heavy Cannon 28%, Spotter Drone 14% |
| 11 | 71% | 50% | Heavy Cannon 31%, Tank 30%, Spotter Drone 14% |
| 12 | 68% | 49% | Heavy Cannon 31%, Tank 30%, Spotter Drone 14% |
| 13 | 88% | 49% | Tank 32%, Heavy Cannon 29%, Spotter Drone 13% |
| 14 | 82% | 51% | Tank 33%, Heavy Cannon 30%, Spotter Drone 13% |
| 15 | 82% | 49% | Heavy Cannon 36%, Tank 31%, Spotter Drone 13% |
| 16 | 71% | 50% | Tank 26%, Heavy Cannon 25%, Spotter Drone 19% |
| 17 | 77% | 51% | Tank 24%, Heavy Cannon 24%, Spotter Drone 17% |
| 18 | 82% | 50% | Tank 27%, Heavy Cannon 26%, Attack Helicopter 18% |
| 19 | 77% | 50% | Tank 27%, Heavy Cannon 26%, Spotter Drone 16% |
| 20 | 75% | 52% | Heavy Cannon 27%, Tank 26%, Spotter Drone 13% |

## The best personalities against the hand-tuned AI

60 games each, seats and maps mixed.

| Personality | Wins against the default AI | Units it built (share) | Upgrades and captures per game |
|---|---|---|---|
| Heavy Cannon and Tank | 80% | Infantry 42%, Scout Bike 26%, Tank 14%, Spotter Drone 9%, Light Medic 5%, Attack Helicopter 2%, Fighter 1%, Light Harvester 1% | Airfield 0.3, captures 3.2 |
| Tank and Heavy Cannon | 76% | Infantry 31%, Scout Bike 31%, Tank 18%, Spotter Drone 10%, Light Medic 5%, Attack Helicopter 4%, Light Harvester 1% | Airfield 0.2, captures 2.1 |
| Tank and Heavy Cannon | 78% | Infantry 37%, Scout Bike 32%, Tank 16%, Light Medic 7%, Spotter Drone 6%, Attack Helicopter 1%, Light Harvester 1%, Fighter 0% | Airfield 0.2, captures 3.0 |

## Genes of the best personality

```json
{
  "mix": {
    "tank": 0.87,
    "heavyCannon": 0.89,
    "artillery": 0,
    "blastCannon": 0.08,
    "sonicTank": 0.29,
    "scoutBike": 0.11,
    "spotterDrone": 0.45,
    "attackHelicopter": 0.21,
    "fighter": 0.23,
    "antiAircraftJeep": 0,
    "lightMedic": 0.19
  },
  "harvestersEarly": 1,
  "harvestersMax": 1,
  "antiAirPerEnemyAir": 0.24,
  "factoryLifeValue": 195.54,
  "killBonusShare": 0.86,
  "returnFireCaution": 0.55,
  "homeDefenceRadius": 4,
  "standOff": 2,
  "harvesterDangerRadius": 1,
  "dangerPenalty": 1.14,
  "scoutWatchDistance": 3,
  "armySizeForMedic": 6,
  "patience": 0.11,
  "captureFactories": 3,
  "transportInfantry": 0.17
}
```
