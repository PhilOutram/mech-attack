# Evolved AI personalities

Produced by `node evolve.js --generations 40 --population 20 --games 10 --seed 1`. Each generation every personality plays games against others on fixed map 1 and generated maps; the best quarter survive and the rest are mixed and mutated copies of them. Games over 60 rounds count as draws.

## Progress

| Generation | Best win rate | Mean win rate | Best personality favours |
|---|---|---|---|
| 1 | 70% | 50% | Artillery 16%, Blast Cannon 15%, Scout Bike 14% |
| 2 | 82% | 51% | Artillery 16%, Scout Bike 13%, Turret 11% |
| 3 | 77% | 50% | Turret 13%, Scout Bike 12%, Spotter Drone 11% |
| 4 | 70% | 50% | Scout Bike 16%, Attack Helicopter 15%, Artillery 14% |
| 5 | 80% | 50% | Turret 13%, Artillery 12%, Scout Bike 12% |
| 6 | 78% | 50% | Artillery 14%, Turret 13%, Attack Helicopter 13% |
| 7 | 69% | 50% | Scout Bike 16%, Artillery 16%, Light Medic 11% |
| 8 | 74% | 50% | Artillery 15%, Scout Bike 15%, Spotter Drone 14% |
| 9 | 61% | 50% | Scout Bike 14%, Artillery 13%, Spotter Drone 12% |
| 10 | 68% | 50% | Scout Bike 14%, Artillery 13%, Blast Cannon 11% |
| 11 | 85% | 51% | Artillery 15%, Scout Bike 14%, Attack Helicopter 12% |
| 12 | 69% | 50% | Artillery 16%, Scout Bike 15%, Attack Helicopter 13% |
| 13 | 75% | 50% | Artillery 16%, Scout Bike 15%, Attack Helicopter 13% |
| 14 | 71% | 50% | Artillery 15%, Scout Bike 15%, Attack Helicopter 13% |
| 15 | 79% | 50% | Scout Bike 25%, Artillery 16%, Light Medic 14% |
| 16 | 71% | 50% | Scout Bike 19%, Artillery 16%, Attack Helicopter 14% |
| 17 | 73% | 50% | Artillery 18%, Scout Bike 15%, Light Medic 11% |
| 18 | 68% | 51% | Scout Bike 16%, Artillery 15%, Light Medic 12% |
| 19 | 67% | 50% | Artillery 18%, Scout Bike 15%, Light Medic 11% |
| 20 | 73% | 51% | Scout Bike 19%, Artillery 19%, Heavy Cannon 12% |
| 21 | 70% | 50% | Scout Bike 21%, Artillery 18%, Light Medic 11% |
| 22 | 75% | 51% | Scout Bike 19%, Artillery 19%, Spotter Drone 13% |
| 23 | 75% | 50% | Scout Bike 19%, Artillery 15%, Heavy Cannon 12% |
| 24 | 67% | 50% | Artillery 17%, Scout Bike 17%, Spotter Drone 15% |
| 25 | 80% | 50% | Scout Bike 17%, Artillery 17%, Spotter Drone 12% |
| 26 | 77% | 49% | Scout Bike 21%, Artillery 16%, Spotter Drone 13% |
| 27 | 76% | 50% | Scout Bike 21%, Artillery 16%, Spotter Drone 13% |
| 28 | 65% | 50% | Scout Bike 20%, Artillery 15%, Spotter Drone 13% |
| 29 | 71% | 50% | Artillery 18%, Spotter Drone 16%, Scout Bike 15% |
| 30 | 70% | 50% | Scout Bike 18%, Artillery 17%, Spotter Drone 15% |
| 31 | 68% | 50% | Scout Bike 21%, Artillery 20%, Spotter Drone 19% |
| 32 | 80% | 50% | Scout Bike 19%, Artillery 17%, Spotter Drone 17% |
| 33 | 79% | 51% | Artillery 18%, Scout Bike 17%, Light Medic 15% |
| 34 | 70% | 49% | Scout Bike 19%, Artillery 17%, Spotter Drone 16% |
| 35 | 69% | 50% | Scout Bike 18%, Artillery 18%, Light Medic 15% |
| 36 | 67% | 50% | Artillery 18%, Scout Bike 18%, Light Medic 15% |
| 37 | 65% | 50% | Scout Bike 18%, Artillery 17%, Light Medic 13% |
| 38 | 71% | 49% | Scout Bike 16%, Artillery 16%, Light Medic 12% |
| 39 | 71% | 50% | Scout Bike 16%, Artillery 16%, Light Medic 12% |
| 40 | 79% | 50% | Artillery 19%, Light Medic 14%, Scout Bike 14% |

## The best personalities against the hand-tuned AI

100 games each, seats and maps mixed.

| Personality | Wins against the default AI | Units it built (share) | Upgrades and captures per game | Wanted but hardly built |
|---|---|---|---|---|
| Infantry and Scout Bike | 80% | Infantry 57%, Scout Bike 16%, Light Harvester 10%, Artillery 6%, Heavy Cannon 3%, Spotter Drone 3%, Light Medic 2%, Twin Tank 1%, Attack Helicopter 1%, Blast Cannon 0%, Sonic Tank 0%, Twin Turret 0%, Fighter 0%, Tank 0% | Crystal lab 1.8, Heavy works 0.7, Airfield 0.5, captures 3.2 | Light Medic (14% wanted) |
| Infantry and Scout Bike | 77% | Infantry 50%, Scout Bike 15%, Light Harvester 13%, Artillery 5%, Spotter Drone 5%, Heavy Cannon 4%, Attack Helicopter 4%, Light Medic 1%, Tank 1%, Sonic Tank 1%, Twin Tank 0%, Twin Turret 0%, Anti-Aircraft Jeep 0% | Crystal lab 1.8, Heavy works 0.8, Airfield 0.7, captures 2.8 | Light Medic (12% wanted) |
| Infantry and Scout Bike | 82% | Infantry 52%, Scout Bike 12%, Light Harvester 12%, Artillery 7%, Spotter Drone 5%, Heavy Cannon 4%, Attack Helicopter 4%, Light Medic 3%, Twin Tank 1%, Sonic Tank 1%, Tank 1%, Twin Turret 0%, Anti-Aircraft Jeep 0% | Crystal lab 1.8, Airfield 0.8, Heavy works 0.8, captures 2.9 | - |
| Infantry and Scout Bike | 73% | Infantry 54%, Light Harvester 15%, Scout Bike 10%, Artillery 6%, Heavy Cannon 4%, Spotter Drone 3%, Attack Helicopter 2%, Twin Tank 2%, Blast Cannon 1%, Light Medic 1%, Sonic Tank 1%, Tank 1%, Anti-Aircraft Jeep 0% | Crystal lab 1.7, Heavy works 0.9, Airfield 0.6, captures 2.8 | Light Medic (11% wanted) |
| Infantry and Scout Bike | 76% | Infantry 53%, Scout Bike 15%, Light Harvester 14%, Artillery 6%, Spotter Drone 5%, Heavy Cannon 2%, Attack Helicopter 2%, Light Medic 1%, Twin Tank 1%, Tank 0%, Sonic Tank 0%, Turret 0%, Twin Turret 0% | Crystal lab 1.7, Airfield 0.7, Heavy works 0.7, captures 2.7 | Light Medic (14% wanted) |

## Genes of the best personality

```json
{
  "mix": {
    "tank": 0.16,
    "heavyCannon": 0.66,
    "artillery": 0.98,
    "blastCannon": 0.29,
    "sonicTank": 0.19,
    "scoutBike": 0.72,
    "spotterDrone": 0.63,
    "attackHelicopter": 0.33,
    "fighter": 0.05,
    "antiAircraftJeep": 0,
    "lightMedic": 0.76,
    "turret": 0,
    "heavyTank": 0.45,
    "twinTurret": 0.08
  },
  "harvestersEarly": 2,
  "harvestersMax": 2,
  "counterWeight": 0,
  "counterPriority": 0.38,
  "capturePriority": 0.27,
  "armyPriority": 0,
  "seedPriority": 0.65,
  "factoryLifeValue": 285.92,
  "killBonusShare": 0,
  "returnFireCaution": 1.23,
  "homeDefenceRadius": 6,
  "standOff": 2,
  "harvesterDangerRadius": 1,
  "dangerPenalty": 7.09,
  "scoutWatchDistance": 5,
  "armySizeForMedic": 5,
  "patience": 1,
  "captureFactories": 3,
  "transportInfantry": 0.13,
  "labs": 2,
  "seeders": 0,
  "wreckPiles": 0.74,
  "targetNearness": 0.66,
  "targetWeakness": -0.41,
  "targetThreat": 1.62
}
```
