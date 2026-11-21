# Evolved AI personalities

For games with 3 or 4 sides, each a free-for-all. A game's score is its finishing place: 1 for a win, 0 for being out first, shared when players finish level (still in at the round limit, or out together). The win rates below are average scores; 50% means as good as the opponents.

Produced by `node evolve.js --generations 20 --population 16 --games 3 --seed 1 --sides 3,4 --export MULTI_SIDE_PERSONALITIES`. Each generation every personality plays games against others on fixed map 1 and generated maps; the best quarter survive and the rest are mixed and mutated copies of them. Games over 60 rounds count as draws.

## Progress

| Generation | Best win rate | Mean win rate | Best personality favours |
|---|---|---|---|
| 1 | 67% | 50% | Blast Cannon 16%, Turret 10%, Scout Bike 10% |
| 2 | 69% | 51% | Attack Helicopter 18%, Fighter 12%, Blast Cannon 12% |
| 3 | 60% | 50% | Turret 13%, Attack Helicopter 12%, Light Medic 12% |
| 4 | 66% | 50% | Artillery 19%, Heavy Cannon 15%, Fighter 11% |
| 5 | 65% | 50% | Artillery 15%, Turret 15%, Heavy Cannon 15% |
| 6 | 60% | 50% | Artillery 16%, Turret 15%, Tank 14% |
| 7 | 57% | 50% | Heavy Cannon 17%, Turret 15%, Artillery 13% |
| 8 | 62% | 51% | Turret 14%, Light Medic 13%, Twin Turret 13% |
| 9 | 56% | 50% | Heavy Cannon 15%, Turret 13%, Light Medic 12% |
| 10 | 58% | 50% | Heavy Cannon 16%, Artillery 15%, Turret 13% |
| 11 | 64% | 50% | Turret 15%, Light Medic 13%, Twin Turret 13% |
| 12 | 61% | 50% | Artillery 17%, Turret 16%, Light Medic 15% |
| 13 | 68% | 50% | Artillery 19%, Turret 17%, Light Medic 16% |
| 14 | 61% | 50% | Artillery 18%, Turret 16%, Light Medic 16% |
| 15 | 68% | 50% | Artillery 19%, Light Medic 18%, Turret 17% |
| 16 | 69% | 51% | Artillery 19%, Light Medic 18%, Turret 17% |
| 17 | 61% | 50% | Turret 18%, Light Medic 17%, Artillery 16% |
| 18 | 68% | 50% | Light Medic 19%, Turret 17%, Artillery 12% |
| 19 | 65% | 50% | Light Medic 16%, Artillery 14%, Turret 14% |
| 20 | 68% | 50% | Turret 15%, Light Medic 15%, Artillery 13% |

## The best personalities against the hand-tuned AI

40 games each, seats and maps mixed.

| Personality | Wins against the default AI | Units it built (share) | Upgrades and captures per game | Wanted but hardly built |
|---|---|---|---|---|
| Infantry and Scout Bike | 66% | Infantry 33%, Scout Bike 14%, Light Harvester 8%, Artillery 6%, Light Medic 6%, Transporter 5%, Twin Tank 5%, Turret 5%, Spotter Drone 4%, Fighter 4%, Twin Turret 2%, Sonic Tank 2%, Heavy Cannon 2%, Tank 2%, Anti-Aircraft Jeep 1% | Crystal lab 2.0, Heavy works 0.9, Airfield 0.7, captures 3.5 | - |
| Infantry and Scout Bike | 68% | Infantry 30%, Scout Bike 10%, Light Medic 9%, Light Harvester 8%, Artillery 7%, Twin Tank 6%, Transporter 6%, Turret 5%, Fighter 4%, Spotter Drone 4%, Twin Turret 3%, Tank 2%, Anti-Aircraft Jeep 2%, Sonic Tank 2%, Attack Helicopter 1%, Heavy Cannon 1% | Crystal lab 1.9, Heavy works 0.9, Airfield 0.6, captures 3.9 | - |
| Infantry and Scout Bike | 68% | Infantry 36%, Scout Bike 12%, Light Harvester 10%, Light Medic 10%, Transporter 6%, Artillery 5%, Twin Tank 4%, Turret 4%, Spotter Drone 4%, Fighter 3%, Twin Turret 2%, Sonic Tank 2%, Tank 2%, Heavy Cannon 1%, Anti-Aircraft Jeep 0% | Crystal lab 2.0, Airfield 0.8, Heavy works 0.6, captures 3.5 | - |
| Scout Bike and Artillery | 50% | Scout Bike 19%, Light Harvester 15%, Artillery 14%, Light Medic 12%, Twin Tank 8%, Turret 8%, Spotter Drone 7%, Fighter 5%, Twin Turret 4%, Tank 3%, Heavy Cannon 3%, Anti-Aircraft Jeep 1%, Sonic Tank 0% | Crystal lab 1.0, Heavy works 0.9, Airfield 0.7, captures 0.0 | - |
| Infantry and Scout Bike | 70% | Infantry 36%, Scout Bike 14%, Light Medic 8%, Light Harvester 6%, Artillery 6%, Transporter 6%, Turret 5%, Fighter 4%, Twin Tank 4%, Spotter Drone 3%, Heavy Cannon 2%, Tank 2%, Attack Helicopter 2%, Anti-Aircraft Jeep 2%, Sonic Tank 1%, Blast Cannon 0% | Crystal lab 1.9, Airfield 0.6, Heavy works 0.6, captures 3.5 | - |

## Genes of the best personality

```json
{
  "mix": {
    "tank": 0.35,
    "heavyCannon": 0.38,
    "artillery": 0.74,
    "blastCannon": 0.04,
    "sonicTank": 0.34,
    "scoutBike": 0,
    "spotterDrone": 0.36,
    "attackHelicopter": 0,
    "fighter": 0.59,
    "antiAircraftJeep": 0.09,
    "lightMedic": 0.84,
    "turret": 0.86,
    "heavyTank": 0.63,
    "twinTurret": 0.46
  },
  "harvestersEarly": 1,
  "harvestersMax": 2,
  "counterWeight": 0,
  "counterPriority": 1,
  "capturePriority": 0.95,
  "armyPriority": 0.9,
  "seedPriority": 1,
  "factoryLifeValue": 227.49,
  "killBonusShare": 0,
  "returnFireCaution": 1.28,
  "homeDefenceRadius": 5,
  "standOff": 1,
  "harvesterDangerRadius": 1,
  "dangerPenalty": 6.71,
  "scoutWatchDistance": 3,
  "armySizeForMedic": 4,
  "patience": 0.8,
  "captureFactories": 1,
  "transportInfantry": 0.92,
  "labs": 2,
  "seeders": 0,
  "wreckPiles": 0.01,
  "targetNearness": 0.62,
  "targetWeakness": 0.23,
  "targetThreat": 2
}
```
