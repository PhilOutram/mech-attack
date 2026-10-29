# Evolved AI personalities

For games with 3 or 4 sides, each a free-for-all. A game's score is its finishing place: 1 for a win, 0 for being out first, shared when players finish level (still in at the round limit, or out together). The win rates below are average scores; 50% means as good as the opponents.

Produced by `node evolve.js --generations 20 --population 16 --games 3 --seed 1 --sides 3,4 --export MULTI_SIDE_PERSONALITIES`. Each generation every personality plays games against others on fixed map 1 and generated maps; the best quarter survive and the rest are mixed and mutated copies of them. Games over 60 rounds count as draws.

## Progress

| Generation | Best win rate | Mean win rate | Best personality favours |
|---|---|---|---|
| 1 | 65% | 48% | Scout Bike 18%, Turret 15%, Tank 14% |
| 2 | 79% | 50% | Scout Bike 17%, Light Medic 15%, Turret 14% |
| 3 | 83% | 51% | Anti-Aircraft Jeep 18%, Turret 14%, Fighter 12% |
| 4 | 73% | 50% | Anti-Aircraft Jeep 18%, Turret 13%, Fighter 12% |
| 5 | 86% | 50% | Anti-Aircraft Jeep 17%, Turret 14%, Fighter 14% |
| 6 | 73% | 49% | Anti-Aircraft Jeep 19%, Turret 16%, Fighter 14% |
| 7 | 79% | 51% | Anti-Aircraft Jeep 16%, Turret 14%, Tank 14% |
| 8 | 67% | 52% | Turret 16%, Heavy Cannon 14%, Fighter 13% |
| 9 | 88% | 49% | Tank 15%, Anti-Aircraft Jeep 15%, Turret 14% |
| 10 | 71% | 50% | Anti-Aircraft Jeep 17%, Tank 13%, Turret 12% |
| 11 | 88% | 50% | Turret 16%, Anti-Aircraft Jeep 16%, Fighter 13% |
| 12 | 78% | 51% | Heavy Cannon 14%, Anti-Aircraft Jeep 14%, Turret 13% |
| 13 | 64% | 49% | Heavy Cannon 15%, Anti-Aircraft Jeep 13%, Turret 13% |
| 14 | 75% | 50% | Heavy Cannon 15%, Anti-Aircraft Jeep 15%, Turret 13% |
| 15 | 69% | 49% | Heavy Cannon 15%, Anti-Aircraft Jeep 13%, Turret 13% |
| 16 | 76% | 49% | Turret 16%, Fighter 14%, Heavy Cannon 13% |
| 17 | 67% | 51% | Turret 16%, Fighter 14%, Heavy Cannon 13% |
| 18 | 76% | 51% | Anti-Aircraft Jeep 16%, Turret 14%, Heavy Cannon 13% |
| 19 | 63% | 49% | Turret 16%, Heavy Cannon 16%, Anti-Aircraft Jeep 16% |
| 20 | 76% | 51% | Turret 15%, Heavy Cannon 15%, Fighter 13% |

## The best personalities against the hand-tuned AI

40 games each, seats and maps mixed.

| Personality | Wins against the default AI | Units it built (share) | Upgrades and captures per game | Wanted but hardly built |
|---|---|---|---|---|
| Infantry and Attack Helicopter | 59% | Infantry 44%, Light Harvester 15%, Attack Helicopter 12%, Scout Bike 9%, Fighter 5%, Transporter 4%, Turret 4%, Heavy Cannon 2%, Anti-Aircraft Jeep 2%, Artillery 2%, Blast Cannon 1%, Light Medic 1%, Tank 0% | Crystal lab 1.9, Airfield 1.0, Heavy works 0.6, captures 3.9 | Anti-Aircraft Jeep (12% wanted), Artillery (11% wanted) |
| Infantry and Attack Helicopter | 61% | Infantry 43%, Light Harvester 14%, Attack Helicopter 11%, Scout Bike 8%, Transporter 5%, Fighter 4%, Turret 4%, Anti-Aircraft Jeep 3%, Heavy Cannon 3%, Artillery 2%, Tank 1%, Light Medic 1%, Blast Cannon 1%, Sonic Tank 0% | Crystal lab 1.9, Airfield 0.9, Heavy works 0.5, captures 4.0 | - |
| Infantry and Scout Bike | 65% | Infantry 36%, Light Harvester 17%, Scout Bike 12%, Attack Helicopter 10%, Fighter 6%, Transporter 4%, Turret 4%, Heavy Cannon 3%, Anti-Aircraft Jeep 2%, Artillery 2%, Light Medic 2%, Blast Cannon 1%, Tank 1%, Sonic Tank 0% | Crystal lab 1.7, Airfield 0.8, Heavy works 0.4, captures 3.5 | - |
| Infantry and Scout Bike | 48% | Infantry 38%, Light Harvester 21%, Scout Bike 14%, Attack Helicopter 8%, Transporter 5%, Fighter 5%, Turret 3%, Heavy Cannon 2%, Anti-Aircraft Jeep 1%, Artillery 1%, Tank 1%, Blast Cannon 1%, Light Medic 0%, Sonic Tank 0% | Crystal lab 1.7, Airfield 0.8, Heavy works 0.4, captures 3.1 | Anti-Aircraft Jeep (12% wanted), Artillery (10% wanted) |
| Infantry and Scout Bike | 53% | Infantry 43%, Light Harvester 16%, Scout Bike 10%, Attack Helicopter 10%, Transporter 5%, Fighter 5%, Turret 4%, Heavy Cannon 2%, Anti-Aircraft Jeep 2%, Artillery 1%, Tank 1%, Light Medic 1%, Blast Cannon 0%, Sonic Tank 0% | Crystal lab 2.0, Airfield 1.0, Heavy works 0.3, captures 3.8 | Anti-Aircraft Jeep (17% wanted) |

## Genes of the best personality

```json
{
  "mix": {
    "tank": 0.37,
    "heavyCannon": 0.95,
    "artillery": 0.69,
    "blastCannon": 0.54,
    "sonicTank": 0.16,
    "scoutBike": 0.04,
    "spotterDrone": 0,
    "attackHelicopter": 0.63,
    "fighter": 0.85,
    "antiAircraftJeep": 0.79,
    "lightMedic": 0.46,
    "turret": 0.98
  },
  "harvestersEarly": 2,
  "harvestersMax": 2,
  "counterWeight": 0.87,
  "factoryLifeValue": 50,
  "killBonusShare": 0.92,
  "returnFireCaution": 1.45,
  "homeDefenceRadius": 4,
  "standOff": 3,
  "harvesterDangerRadius": 0,
  "dangerPenalty": 2.8,
  "scoutWatchDistance": 3,
  "armySizeForMedic": 4,
  "patience": 0.97,
  "captureFactories": 3,
  "transportInfantry": 0.78,
  "labs": 2,
  "wreckPiles": 0,
  "targetNearness": 1.6,
  "targetWeakness": 1.41,
  "targetThreat": 1.19
}
```
