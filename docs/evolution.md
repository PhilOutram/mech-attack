# Evolved AI personalities

Produced by `node evolve.js --generations 40 --population 20 --games 10 --seed 1`. Each generation every personality plays games against others on fixed map 1 and generated maps; the best quarter survive and the rest are mixed and mutated copies of them. Games over 60 rounds count as draws.

## Progress

| Generation | Best win rate | Mean win rate | Best personality favours |
|---|---|---|---|
| 1 | 79% | 49% | Tank 15%, Light Medic 13%, Fighter 13% |
| 2 | 76% | 50% | Blast Cannon 15%, Sonic Tank 12%, Scout Bike 12% |
| 3 | 68% | 50% | Heavy Cannon 17%, Scout Bike 15%, Tank 15% |
| 4 | 67% | 50% | Sonic Tank 19%, Scout Bike 15%, Light Medic 15% |
| 5 | 68% | 50% | Sonic Tank 18%, Heavy Cannon 17%, Fighter 12% |
| 6 | 81% | 50% | Heavy Cannon 18%, Scout Bike 16%, Fighter 15% |
| 7 | 68% | 51% | Heavy Cannon 14%, Scout Bike 14%, Fighter 13% |
| 8 | 72% | 51% | Heavy Cannon 15%, Scout Bike 14%, Fighter 14% |
| 9 | 76% | 50% | Fighter 17%, Heavy Cannon 14%, Scout Bike 13% |
| 10 | 70% | 50% | Heavy Cannon 16%, Scout Bike 15%, Artillery 12% |
| 11 | 87% | 50% | Artillery 16%, Tank 15%, Heavy Cannon 13% |
| 12 | 74% | 50% | Heavy Cannon 20%, Scout Bike 18%, Spotter Drone 12% |
| 13 | 70% | 51% | Tank 18%, Heavy Cannon 17%, Spotter Drone 13% |
| 14 | 76% | 50% | Tank 20%, Heavy Cannon 17%, Spotter Drone 14% |
| 15 | 78% | 50% | Heavy Cannon 18%, Tank 16%, Artillery 14% |
| 16 | 79% | 50% | Tank 17%, Heavy Cannon 16%, Spotter Drone 13% |
| 17 | 75% | 50% | Tank 17%, Heavy Cannon 16%, Spotter Drone 13% |
| 18 | 69% | 51% | Heavy Cannon 20%, Tank 14%, Artillery 12% |
| 19 | 73% | 50% | Tank 16%, Heavy Cannon 16%, Spotter Drone 13% |
| 20 | 75% | 50% | Tank 23%, Heavy Cannon 16%, Spotter Drone 13% |
| 21 | 76% | 50% | Heavy Cannon 17%, Tank 14%, Spotter Drone 11% |
| 22 | 71% | 50% | Heavy Cannon 19%, Tank 13%, Spotter Drone 12% |
| 23 | 68% | 50% | Heavy Cannon 21%, Tank 13%, Spotter Drone 12% |
| 24 | 74% | 50% | Tank 15%, Scout Bike 14%, Spotter Drone 13% |
| 25 | 75% | 51% | Heavy Cannon 22%, Tank 13%, Spotter Drone 12% |
| 26 | 75% | 50% | Heavy Cannon 22%, Scout Bike 11%, Tank 11% |
| 27 | 68% | 50% | Heavy Cannon 20%, Tank 14%, Artillery 13% |
| 28 | 63% | 50% | Heavy Cannon 21%, Tank 14%, Light Medic 11% |
| 29 | 70% | 50% | Heavy Cannon 19%, Tank 17%, Artillery 12% |
| 30 | 80% | 50% | Heavy Cannon 16%, Tank 13%, Spotter Drone 13% |
| 31 | 70% | 50% | Heavy Cannon 18%, Tank 16%, Scout Bike 12% |
| 32 | 74% | 51% | Heavy Cannon 19%, Tank 17%, Artillery 12% |
| 33 | 73% | 50% | Tank 16%, Spotter Drone 15%, Heavy Cannon 13% |
| 34 | 72% | 50% | Tank 16%, Spotter Drone 15%, Heavy Cannon 13% |
| 35 | 73% | 50% | Heavy Cannon 18%, Artillery 15%, Tank 14% |
| 36 | 64% | 51% | Heavy Cannon 18%, Artillery 15%, Tank 14% |
| 37 | 77% | 50% | Heavy Cannon 20%, Tank 16%, Spotter Drone 15% |
| 38 | 69% | 50% | Heavy Cannon 18%, Spotter Drone 17%, Tank 15% |
| 39 | 82% | 50% | Heavy Cannon 19%, Tank 16%, Scout Bike 14% |
| 40 | 64% | 50% | Tank 18%, Heavy Cannon 17%, Scout Bike 14% |

## The best personalities against the hand-tuned AI

100 games each, seats and maps mixed.

| Personality | Wins against the default AI | Units it built (share) | Upgrades and captures per game |
|---|---|---|---|
| Tank and Heavy Cannon | 79% | Infantry 39%, Scout Bike 20%, Light Medic 11%, Artillery 10%, Anti-Aircraft Jeep 10%, Tank 7%, Spotter Drone 3%, Fighter 0%, Light Harvester 0%, Attack Helicopter 0% | Airfield 0.1, captures 2.5 |
| Heavy Cannon and Tank | 85% | Scout Bike 33%, Infantry 28%, Light Medic 14%, Artillery 12%, Tank 9%, Spotter Drone 4%, Fighter 0%, Attack Helicopter 0%, Light Harvester 0% | Airfield 0.1, captures 2.7 |
| Tank and Heavy Cannon | 82% | Infantry 38%, Scout Bike 21%, Light Medic 11%, Artillery 10%, Anti-Aircraft Jeep 9%, Tank 7%, Spotter Drone 4%, Attack Helicopter 1%, Fighter 0%, Light Harvester 0% | Airfield 0.1, captures 3.1 |
| Heavy Cannon and Spotter Drone | 74% | Infantry 36%, Scout Bike 25%, Artillery 15%, Light Medic 12%, Tank 7%, Spotter Drone 4%, Attack Helicopter 1%, Fighter 0%, Light Harvester 0% | Airfield 0.1, captures 3.0 |
| Tank and Heavy Cannon | 74% | Infantry 39%, Scout Bike 27%, Artillery 13%, Light Medic 12%, Tank 7%, Spotter Drone 1%, Fighter 0%, Light Harvester 0%, Attack Helicopter 0% | Airfield 0.0, captures 2.9 |

## Genes of the best personality

```json
{
  "mix": {
    "tank": 0.95,
    "heavyCannon": 0.93,
    "artillery": 0.6,
    "blastCannon": 0.35,
    "sonicTank": 0,
    "scoutBike": 0.76,
    "spotterDrone": 0.38,
    "attackHelicopter": 0.15,
    "fighter": 0.64,
    "antiAircraftJeep": 0.18,
    "lightMedic": 0.36
  },
  "harvestersEarly": 1,
  "harvestersMax": 1,
  "antiAirPerEnemyAir": 0.03,
  "factoryLifeValue": 241.6,
  "killBonusShare": 0.1,
  "returnFireCaution": 1.04,
  "homeDefenceRadius": 4,
  "standOff": 2,
  "harvesterDangerRadius": 3,
  "dangerPenalty": 4.36,
  "scoutWatchDistance": 3,
  "armySizeForMedic": 2,
  "patience": 0,
  "captureFactories": 2,
  "transportInfantry": 0
}
```
