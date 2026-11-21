# Evolved AI personalities

Produced by `node evolve.js --generations 40 --population 20 --games 10 --seed 1`. Each generation every personality plays games against others on fixed map 1 and generated maps; the best quarter survive and the rest are mixed and mutated copies of them. Games over 60 rounds count as draws.

## Progress

| Generation | Best win rate | Mean win rate | Best personality favours |
|---|---|---|---|
| 1 | 77% | 50% | Light Medic 19%, Tank 15%, Artillery 11% |
| 2 | 82% | 50% | Twin Tank 21%, Blast Cannon 16%, Fighter 10% |
| 3 | 69% | 50% | Blast Cannon 18%, Artillery 17%, Fighter 10% |
| 4 | 66% | 50% | Blast Cannon 18%, Artillery 17%, Fighter 10% |
| 5 | 78% | 50% | Artillery 21%, Fighter 13%, Attack Helicopter 12% |
| 6 | 77% | 50% | Artillery 24%, Fighter 14%, Attack Helicopter 14% |
| 7 | 68% | 50% | Artillery 24%, Fighter 14%, Attack Helicopter 14% |
| 8 | 75% | 50% | Artillery 23%, Attack Helicopter 13%, Fighter 11% |
| 9 | 74% | 50% | Artillery 23%, Turret 14%, Fighter 14% |
| 10 | 78% | 50% | Artillery 21%, Turret 13%, Fighter 12% |
| 11 | 81% | 50% | Artillery 26%, Attack Helicopter 16%, Fighter 14% |
| 12 | 71% | 50% | Artillery 18%, Fighter 13%, Scout Bike 11% |
| 13 | 70% | 50% | Artillery 21%, Turret 14%, Fighter 13% |
| 14 | 67% | 50% | Artillery 18%, Turret 14%, Fighter 12% |
| 15 | 70% | 49% | Artillery 19%, Attack Helicopter 14%, Sonic Tank 14% |
| 16 | 72% | 50% | Artillery 17%, Attack Helicopter 15%, Spotter Drone 12% |
| 17 | 79% | 51% | Artillery 20%, Attack Helicopter 14%, Turret 13% |
| 18 | 70% | 50% | Artillery 17%, Turret 15%, Attack Helicopter 11% |
| 19 | 69% | 50% | Artillery 18%, Turret 15%, Fighter 12% |
| 20 | 72% | 50% | Artillery 21%, Light Medic 15%, Turret 13% |
| 21 | 66% | 50% | Artillery 19%, Turret 15%, Attack Helicopter 12% |
| 22 | 71% | 50% | Turret 18%, Artillery 17%, Fighter 15% |
| 23 | 64% | 50% | Turret 19%, Artillery 18%, Fighter 12% |
| 24 | 69% | 50% | Turret 19%, Artillery 18%, Attack Helicopter 15% |
| 25 | 77% | 50% | Artillery 20%, Turret 18%, Fighter 18% |
| 26 | 67% | 50% | Artillery 21%, Turret 14%, Attack Helicopter 12% |
| 27 | 71% | 50% | Artillery 18%, Turret 17%, Fighter 13% |
| 28 | 63% | 49% | Artillery 18%, Turret 15%, Fighter 13% |
| 29 | 73% | 51% | Artillery 21%, Turret 13%, Attack Helicopter 12% |
| 30 | 78% | 50% | Artillery 20%, Turret 15%, Fighter 13% |
| 31 | 73% | 49% | Artillery 19%, Fighter 14%, Turret 12% |
| 32 | 65% | 49% | Artillery 19%, Turret 18%, Fighter 13% |
| 33 | 68% | 50% | Turret 15%, Artillery 14%, Light Medic 13% |
| 34 | 74% | 50% | Turret 21%, Artillery 16%, Attack Helicopter 15% |
| 35 | 73% | 50% | Artillery 19%, Turret 16%, Attack Helicopter 16% |
| 36 | 67% | 50% | Artillery 19%, Turret 15%, Fighter 12% |
| 37 | 67% | 50% | Artillery 20%, Turret 20%, Attack Helicopter 14% |
| 38 | 67% | 49% | Turret 19%, Artillery 18%, Fighter 13% |
| 39 | 66% | 50% | Artillery 19%, Turret 16%, Attack Helicopter 16% |
| 40 | 68% | 50% | Artillery 17%, Turret 14%, Fighter 14% |

## The best personalities against the hand-tuned AI

100 games each, seats and maps mixed.

| Personality | Wins against the default AI | Units it built (share) | Upgrades and captures per game | Wanted but hardly built |
|---|---|---|---|---|
| Infantry and Artillery | 80% | Infantry 49%, Light Harvester 9%, Artillery 9%, Turret 6%, Fighter 5%, Light Medic 5%, Attack Helicopter 4%, Spotter Drone 4%, Scout Bike 3%, Anti-Aircraft Jeep 2%, Tank 2%, Sonic Tank 1%, Heavy Cannon 0%, Twin Turret 0% | Crystal lab 1.0, Airfield 0.9, Heavy works 0.3, captures 2.6 | - |
| Infantry and Artillery | 82% | Infantry 47%, Artillery 9%, Light Harvester 8%, Attack Helicopter 6%, Turret 6%, Scout Bike 5%, Light Medic 5%, Spotter Drone 5%, Fighter 4%, Anti-Aircraft Jeep 2%, Tank 2%, Heavy Cannon 1%, Twin Turret 0% | Crystal lab 1.0, Airfield 0.9, Heavy works 0.2, captures 2.6 | - |
| Infantry and Artillery | 82% | Infantry 43%, Light Harvester 9%, Artillery 9%, Turret 8%, Attack Helicopter 6%, Fighter 6%, Scout Bike 6%, Light Medic 5%, Spotter Drone 3%, Anti-Aircraft Jeep 3%, Tank 2%, Twin Turret 1%, Twin Tank 0%, Heavy Cannon 0%, Blast Cannon 0% | Crystal lab 1.0, Airfield 0.9, Heavy works 0.1, captures 2.7 | - |
| Infantry and Artillery | 78% | Infantry 44%, Light Harvester 10%, Artillery 8%, Scout Bike 7%, Turret 6%, Attack Helicopter 5%, Fighter 5%, Spotter Drone 4%, Light Medic 3%, Tank 3%, Anti-Aircraft Jeep 3%, Twin Tank 1%, Twin Turret 0%, Heavy Cannon 0%, Blast Cannon 0% | Crystal lab 1.0, Airfield 0.8, Heavy works 0.2, captures 2.7 | - |
| Infantry and Artillery | 79% | Infantry 45%, Artillery 10%, Light Harvester 9%, Turret 6%, Scout Bike 6%, Fighter 5%, Attack Helicopter 5%, Tank 4%, Light Medic 3%, Anti-Aircraft Jeep 3%, Spotter Drone 3%, Blast Cannon 1%, Twin Turret 0%, Heavy Cannon 0% | Crystal lab 1.0, Airfield 0.9, Heavy works 0.3, captures 2.4 | - |

## Genes of the best personality

```json
{
  "mix": {
    "tank": 0.37,
    "heavyCannon": 0.18,
    "artillery": 0.76,
    "blastCannon": 0,
    "sonicTank": 0.19,
    "scoutBike": 0,
    "spotterDrone": 0.35,
    "attackHelicopter": 0.41,
    "fighter": 0.65,
    "antiAircraftJeep": 0.3,
    "lightMedic": 0.51,
    "turret": 0.65,
    "heavyTank": 0,
    "twinTurret": 0.17
  },
  "harvestersEarly": 2,
  "harvestersMax": 2,
  "counterWeight": 0.69,
  "counterPriority": 0.78,
  "capturePriority": 1,
  "armyPriority": 0.87,
  "seedPriority": 0.91,
  "factoryLifeValue": 132.59,
  "killBonusShare": 0.41,
  "returnFireCaution": 0.29,
  "homeDefenceRadius": 8,
  "standOff": 1,
  "harvesterDangerRadius": 3,
  "dangerPenalty": 4.36,
  "scoutWatchDistance": 3,
  "armySizeForMedic": 3,
  "patience": 1,
  "captureFactories": 2,
  "transportInfantry": 0.16,
  "labs": 1,
  "seeders": 0,
  "wreckPiles": 0.26,
  "targetNearness": 0.95,
  "targetWeakness": 1.53,
  "targetThreat": 2
}
```
