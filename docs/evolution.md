# Evolved AI personalities

Produced by `node evolve.js --generations 40 --population 20 --games 10 --seed 1`. Each generation every personality plays games against others on fixed map 1 and generated maps; the best quarter survive and the rest are mixed and mutated copies of them. Games over 60 rounds count as draws.

## Progress

| Generation | Best win rate | Mean win rate | Best personality favours |
|---|---|---|---|
| 1 | 75% | 50% | Tank 19%, Turret 17%, Anti-Aircraft Jeep 16% |
| 2 | 71% | 50% | Tank 14%, Turret 13%, Sonic Tank 12% |
| 3 | 74% | 50% | Tank 14%, Turret 13%, Sonic Tank 12% |
| 4 | 75% | 49% | Tank 17%, Heavy Cannon 17%, Scout Bike 12% |
| 5 | 67% | 50% | Heavy Cannon 16%, Anti-Aircraft Jeep 13%, Scout Bike 13% |
| 6 | 79% | 51% | Tank 18%, Anti-Aircraft Jeep 14%, Fighter 14% |
| 7 | 75% | 51% | Tank 17%, Heavy Cannon 17%, Anti-Aircraft Jeep 11% |
| 8 | 77% | 50% | Heavy Cannon 16%, Tank 15%, Anti-Aircraft Jeep 15% |
| 9 | 69% | 50% | Tank 17%, Anti-Aircraft Jeep 17%, Light Medic 10% |
| 10 | 69% | 51% | Tank 17%, Heavy Cannon 16%, Anti-Aircraft Jeep 14% |
| 11 | 67% | 49% | Heavy Cannon 16%, Tank 14%, Anti-Aircraft Jeep 14% |
| 12 | 65% | 50% | Tank 17%, Heavy Cannon 17%, Anti-Aircraft Jeep 15% |
| 13 | 75% | 50% | Tank 16%, Heavy Cannon 15%, Anti-Aircraft Jeep 13% |
| 14 | 73% | 50% | Tank 16%, Heavy Cannon 16%, Anti-Aircraft Jeep 14% |
| 15 | 70% | 50% | Tank 18%, Heavy Cannon 17%, Anti-Aircraft Jeep 15% |
| 16 | 69% | 49% | Tank 16%, Heavy Cannon 15%, Anti-Aircraft Jeep 13% |
| 17 | 74% | 50% | Heavy Cannon 18%, Anti-Aircraft Jeep 15%, Tank 14% |
| 18 | 64% | 50% | Tank 17%, Heavy Cannon 16%, Anti-Aircraft Jeep 14% |
| 19 | 64% | 50% | Heavy Cannon 16%, Anti-Aircraft Jeep 16%, Tank 15% |
| 20 | 71% | 50% | Heavy Cannon 18%, Anti-Aircraft Jeep 15%, Tank 14% |
| 21 | 73% | 50% | Tank 17%, Heavy Cannon 17%, Anti-Aircraft Jeep 17% |
| 22 | 79% | 51% | Heavy Cannon 17%, Fighter 14%, Anti-Aircraft Jeep 14% |
| 23 | 78% | 51% | Heavy Cannon 17%, Fighter 14%, Anti-Aircraft Jeep 14% |
| 24 | 69% | 50% | Heavy Cannon 18%, Tank 16%, Anti-Aircraft Jeep 15% |
| 25 | 64% | 50% | Heavy Cannon 16%, Fighter 14%, Anti-Aircraft Jeep 13% |
| 26 | 69% | 50% | Heavy Cannon 15%, Tank 13%, Fighter 13% |
| 27 | 79% | 50% | Heavy Cannon 18%, Fighter 15%, Tank 13% |
| 28 | 72% | 50% | Heavy Cannon 19%, Tank 16%, Fighter 16% |
| 29 | 65% | 50% | Tank 16%, Fighter 16%, Artillery 15% |
| 30 | 72% | 50% | Tank 15%, Fighter 13%, Heavy Cannon 13% |
| 31 | 68% | 50% | Heavy Cannon 20%, Tank 15%, Fighter 14% |
| 32 | 75% | 50% | Heavy Cannon 19%, Anti-Aircraft Jeep 15%, Tank 11% |
| 33 | 68% | 50% | Heavy Cannon 17%, Anti-Aircraft Jeep 16%, Fighter 15% |
| 34 | 71% | 50% | Heavy Cannon 19%, Tank 18%, Fighter 14% |
| 35 | 71% | 50% | Heavy Cannon 19%, Tank 16%, Fighter 15% |
| 36 | 68% | 50% | Tank 15%, Heavy Cannon 15%, Fighter 15% |
| 37 | 62% | 50% | Heavy Cannon 19%, Tank 14%, Fighter 13% |
| 38 | 72% | 50% | Heavy Cannon 18%, Tank 16%, Artillery 12% |
| 39 | 71% | 50% | Heavy Cannon 19%, Tank 14%, Fighter 13% |
| 40 | 65% | 49% | Heavy Cannon 19%, Tank 14%, Fighter 13% |

## The best personalities against the hand-tuned AI

100 games each, seats and maps mixed.

| Personality | Wins against the default AI | Units it built (share) | Upgrades and captures per game |
|---|---|---|---|
| Heavy Cannon and Tank | 84% | Infantry 46%, Scout Bike 11%, Anti-Aircraft Jeep 10%, Artillery 7%, Light Medic 7%, Light Harvester 6%, Tank 5%, Turret 4%, Spotter Drone 3%, Fighter 0%, Attack Helicopter 0% | Crystal lab 1.0, Airfield 0.1, captures 3.1 |
| Heavy Cannon and Tank | 73% | Infantry 43%, Scout Bike 12%, Anti-Aircraft Jeep 12%, Light Harvester 7%, Artillery 7%, Tank 5%, Light Medic 5%, Spotter Drone 4%, Turret 4%, Fighter 1%, Attack Helicopter 0% | Crystal lab 1.0, Airfield 0.1, captures 2.6 |
| Tank and Heavy Cannon | 80% | Infantry 47%, Scout Bike 12%, Anti-Aircraft Jeep 11%, Light Harvester 6%, Artillery 6%, Light Medic 5%, Tank 5%, Spotter Drone 4%, Turret 3%, Fighter 0% | Crystal lab 1.0, Airfield 0.1, captures 2.9 |
| Heavy Cannon and Tank | 75% | Infantry 49%, Scout Bike 12%, Anti-Aircraft Jeep 10%, Light Harvester 8%, Artillery 7%, Light Medic 6%, Tank 5%, Turret 3%, Spotter Drone 1%, Fighter 0%, Attack Helicopter 0% | Crystal lab 1.0, Airfield 0.0, captures 2.9 |
| Heavy Cannon and Tank | 79% | Infantry 46%, Anti-Aircraft Jeep 12%, Scout Bike 12%, Light Harvester 7%, Artillery 7%, Light Medic 6%, Tank 5%, Turret 4%, Spotter Drone 2%, Fighter 0%, Attack Helicopter 0% | Crystal lab 1.0, Airfield 0.1, captures 2.6 |

## Genes of the best personality

```json
{
  "mix": {
    "tank": 0.76,
    "heavyCannon": 1,
    "artillery": 0.61,
    "blastCannon": 0.06,
    "sonicTank": 0.01,
    "scoutBike": 0.13,
    "spotterDrone": 0.45,
    "attackHelicopter": 0.22,
    "fighter": 0.72,
    "antiAircraftJeep": 0.55,
    "lightMedic": 0.56,
    "turret": 0.31
  },
  "harvestersEarly": 2,
  "harvestersMax": 2,
  "antiAirPerEnemyAir": 0.93,
  "factoryLifeValue": 179.63,
  "killBonusShare": 0.45,
  "returnFireCaution": 1,
  "homeDefenceRadius": 4,
  "standOff": 2,
  "harvesterDangerRadius": 1,
  "dangerPenalty": 7.28,
  "scoutWatchDistance": 4,
  "armySizeForMedic": 2,
  "patience": 0,
  "captureFactories": 2,
  "transportInfantry": 0,
  "labs": 1
}
```
