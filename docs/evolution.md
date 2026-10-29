# Evolved AI personalities

Produced by `node evolve.js --generations 40 --population 20 --games 10 --seed 1`. Each generation every personality plays games against others on fixed map 1 and generated maps; the best quarter survive and the rest are mixed and mutated copies of them. Games over 60 rounds count as draws.

## Progress

| Generation | Best win rate | Mean win rate | Best personality favours |
|---|---|---|---|
| 1 | 78% | 50% | Light Medic 13%, Fighter 13%, Sonic Tank 13% |
| 2 | 68% | 50% | Anti-Aircraft Jeep 13%, Attack Helicopter 13%, Fighter 12% |
| 3 | 66% | 50% | Fighter 17%, Artillery 15%, Tank 15% |
| 4 | 64% | 49% | Scout Bike 17%, Tank 17%, Blast Cannon 14% |
| 5 | 71% | 50% | Tank 17%, Attack Helicopter 17%, Blast Cannon 14% |
| 6 | 68% | 50% | Tank 17%, Attack Helicopter 17%, Fighter 15% |
| 7 | 70% | 50% | Tank 19%, Attack Helicopter 19%, Fighter 13% |
| 8 | 65% | 50% | Attack Helicopter 17%, Fighter 14%, Anti-Aircraft Jeep 13% |
| 9 | 71% | 50% | Fighter 14%, Attack Helicopter 14%, Anti-Aircraft Jeep 13% |
| 10 | 63% | 50% | Attack Helicopter 14%, Blast Cannon 13%, Fighter 12% |
| 11 | 67% | 49% | Tank 17%, Attack Helicopter 16%, Blast Cannon 13% |
| 12 | 81% | 50% | Attack Helicopter 16%, Scout Bike 14%, Anti-Aircraft Jeep 13% |
| 13 | 63% | 51% | Attack Helicopter 16%, Scout Bike 14%, Blast Cannon 14% |
| 14 | 66% | 50% | Attack Helicopter 16%, Anti-Aircraft Jeep 14%, Scout Bike 13% |
| 15 | 69% | 51% | Anti-Aircraft Jeep 15%, Attack Helicopter 14%, Blast Cannon 13% |
| 16 | 71% | 50% | Anti-Aircraft Jeep 15%, Attack Helicopter 14%, Blast Cannon 13% |
| 17 | 68% | 51% | Anti-Aircraft Jeep 14%, Attack Helicopter 14%, Blast Cannon 12% |
| 18 | 72% | 50% | Attack Helicopter 16%, Anti-Aircraft Jeep 14%, Blast Cannon 13% |
| 19 | 82% | 50% | Attack Helicopter 16%, Anti-Aircraft Jeep 14%, Fighter 13% |
| 20 | 69% | 50% | Anti-Aircraft Jeep 16%, Blast Cannon 14%, Fighter 13% |
| 21 | 71% | 50% | Anti-Aircraft Jeep 16%, Attack Helicopter 13%, Fighter 13% |
| 22 | 68% | 51% | Attack Helicopter 15%, Blast Cannon 15%, Anti-Aircraft Jeep 13% |
| 23 | 77% | 50% | Attack Helicopter 16%, Anti-Aircraft Jeep 14%, Blast Cannon 13% |
| 24 | 75% | 50% | Attack Helicopter 15%, Anti-Aircraft Jeep 13%, Blast Cannon 13% |
| 25 | 65% | 50% | Anti-Aircraft Jeep 13%, Attack Helicopter 13%, Scout Bike 12% |
| 26 | 68% | 50% | Attack Helicopter 16%, Anti-Aircraft Jeep 16%, Blast Cannon 13% |
| 27 | 75% | 50% | Anti-Aircraft Jeep 16%, Scout Bike 15%, Blast Cannon 14% |
| 28 | 75% | 50% | Attack Helicopter 16%, Anti-Aircraft Jeep 16%, Heavy Cannon 13% |
| 29 | 65% | 50% | Anti-Aircraft Jeep 16%, Scout Bike 14%, Attack Helicopter 14% |
| 30 | 66% | 50% | Attack Helicopter 16%, Anti-Aircraft Jeep 15%, Blast Cannon 14% |
| 31 | 71% | 50% | Attack Helicopter 15%, Anti-Aircraft Jeep 15%, Scout Bike 14% |
| 32 | 77% | 49% | Anti-Aircraft Jeep 16%, Heavy Cannon 15%, Blast Cannon 14% |
| 33 | 70% | 50% | Attack Helicopter 16%, Anti-Aircraft Jeep 15%, Scout Bike 13% |
| 34 | 79% | 51% | Anti-Aircraft Jeep 15%, Scout Bike 15%, Artillery 14% |
| 35 | 64% | 50% | Artillery 16%, Anti-Aircraft Jeep 15%, Scout Bike 15% |
| 36 | 64% | 49% | Scout Bike 16%, Anti-Aircraft Jeep 16%, Attack Helicopter 11% |
| 37 | 63% | 50% | Scout Bike 15%, Anti-Aircraft Jeep 15%, Attack Helicopter 12% |
| 38 | 66% | 50% | Scout Bike 15%, Anti-Aircraft Jeep 15%, Attack Helicopter 12% |
| 39 | 69% | 50% | Scout Bike 14%, Anti-Aircraft Jeep 14%, Attack Helicopter 11% |
| 40 | 75% | 50% | Artillery 17%, Scout Bike 17%, Anti-Aircraft Jeep 14% |

## The best personalities against the hand-tuned AI

100 games each, seats and maps mixed.

| Personality | Wins against the default AI | Units it built (share) | Upgrades and captures per game | Wanted but hardly built |
|---|---|---|---|---|
| Infantry and Scout Bike | 59% | Infantry 49%, Scout Bike 20%, Attack Helicopter 9%, Light Harvester 8%, Anti-Aircraft Jeep 7%, Artillery 4%, Fighter 1%, Light Medic 1%, Tank 1%, Turret 1% | Crystal lab 1.0, Airfield 0.8, Heavy works 0.0, captures 2.4 | Tank (12% wanted) |
| Infantry and Scout Bike | 59% | Infantry 49%, Scout Bike 20%, Attack Helicopter 10%, Light Harvester 9%, Anti-Aircraft Jeep 8%, Light Medic 1%, Artillery 1%, Fighter 1%, Blast Cannon 1%, Turret 0%, Tank 0% | Crystal lab 1.0, Airfield 0.9, Heavy works 0.2, captures 2.5 | Blast Cannon (10% wanted) |
| Infantry and Scout Bike | 74% | Infantry 47%, Scout Bike 19%, Attack Helicopter 11%, Anti-Aircraft Jeep 8%, Light Harvester 8%, Artillery 4%, Light Medic 1%, Fighter 1%, Turret 0%, Heavy Cannon 0%, Tank 0% | Crystal lab 1.0, Airfield 0.9, Heavy works 0.3, captures 2.7 | Heavy Cannon (11% wanted), Tank (11% wanted) |
| Infantry and Scout Bike | 70% | Infantry 44%, Scout Bike 20%, Anti-Aircraft Jeep 9%, Attack Helicopter 9%, Light Harvester 8%, Artillery 3%, Light Medic 3%, Fighter 1%, Turret 1%, Heavy Cannon 1%, Blast Cannon 0%, Tank 0%, Sonic Tank 0% | Crystal lab 1.0, Airfield 0.9, Heavy works 0.3, captures 2.8 | Heavy Cannon (10% wanted) |
| Infantry and Scout Bike | 68% | Infantry 46%, Scout Bike 19%, Attack Helicopter 10%, Anti-Aircraft Jeep 9%, Light Harvester 8%, Artillery 4%, Light Medic 2%, Fighter 1%, Turret 1%, Blast Cannon 0%, Tank 0%, Heavy Cannon 0% | Crystal lab 0.9, Airfield 0.9, Heavy works 0.1, captures 2.7 | Blast Cannon (12% wanted) |

## Genes of the best personality

```json
{
  "mix": {
    "tank": 0.71,
    "heavyCannon": 0.34,
    "artillery": 1,
    "blastCannon": 0.4,
    "sonicTank": 0.15,
    "scoutBike": 1,
    "spotterDrone": 0,
    "attackHelicopter": 0.68,
    "fighter": 0.46,
    "antiAircraftJeep": 0.84,
    "lightMedic": 0.41,
    "turret": 0.03
  },
  "harvestersEarly": 2,
  "harvestersMax": 2,
  "counterWeight": 1.23,
  "factoryLifeValue": 318.15,
  "killBonusShare": 0.05,
  "returnFireCaution": 0.93,
  "homeDefenceRadius": 2,
  "standOff": 3,
  "harvesterDangerRadius": 1,
  "dangerPenalty": 6.25,
  "scoutWatchDistance": 2,
  "armySizeForMedic": 5,
  "patience": 0,
  "captureFactories": 2,
  "transportInfantry": 0.04,
  "labs": 1,
  "wreckPiles": 0.52,
  "targetNearness": 1.21,
  "targetWeakness": -0.97,
  "targetThreat": 1.2
}
```
