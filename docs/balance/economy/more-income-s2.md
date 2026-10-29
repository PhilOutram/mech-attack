# Evolved AI personalities

Produced by `node evolve.js --generations 20 --population 16 --games 8 --seed 2 --set start.crystals=100 --set crystals.spawnChoices=[1] --set crystals.spawnAmount=20`. Each generation every personality plays games against others on fixed map 1 and generated maps; the best quarter survive and the rest are mixed and mutated copies of them. Games over 60 rounds count as draws.

## Progress

| Generation | Best win rate | Mean win rate | Best personality favours |
|---|---|---|---|
| 1 | 89% | 51% | Artillery 17%, Scout Bike 17%, Spotter Drone 14% |
| 2 | 67% | 50% | Artillery 16%, Scout Bike 14%, Sonic Tank 14% |
| 3 | 69% | 51% | Artillery 17%, Scout Bike 15%, Light Medic 13% |
| 4 | 73% | 50% | Scout Bike 17%, Light Medic 15%, Tank 13% |
| 5 | 72% | 50% | Artillery 18%, Scout Bike 16%, Spotter Drone 15% |
| 6 | 92% | 50% | Artillery 20%, Scout Bike 18%, Spotter Drone 14% |
| 7 | 71% | 50% | Artillery 19%, Scout Bike 19%, Spotter Drone 16% |
| 8 | 69% | 49% | Artillery 19%, Scout Bike 19%, Spotter Drone 16% |
| 9 | 73% | 51% | Artillery 19%, Scout Bike 17%, Fighter 16% |
| 10 | 67% | 49% | Artillery 18%, Scout Bike 16%, Spotter Drone 14% |
| 11 | 75% | 50% | Artillery 19%, Spotter Drone 17%, Scout Bike 15% |
| 12 | 88% | 50% | Artillery 21%, Scout Bike 18%, Spotter Drone 16% |
| 13 | 67% | 50% | Artillery 19%, Scout Bike 17%, Spotter Drone 15% |
| 14 | 77% | 50% | Artillery 22%, Scout Bike 18%, Fighter 14% |
| 15 | 60% | 51% | Artillery 20%, Spotter Drone 15%, Scout Bike 15% |
| 16 | 74% | 51% | Artillery 21%, Spotter Drone 20%, Fighter 12% |
| 17 | 74% | 50% | Scout Bike 21%, Artillery 18%, Spotter Drone 13% |
| 18 | 74% | 50% | Artillery 18%, Scout Bike 17%, Spotter Drone 12% |
| 19 | 70% | 50% | Artillery 18%, Scout Bike 17%, Spotter Drone 12% |
| 20 | 65% | 49% | Spotter Drone 22%, Artillery 17%, Fighter 13% |

## The best personalities against the hand-tuned AI

60 games each, seats and maps mixed.

| Personality | Wins against the default AI | Units it built (share) | Upgrades and captures per game |
|---|---|---|---|
| Spotter Drone and Artillery | 87% | Scout Bike 25%, Infantry 20%, Artillery 17%, Anti-Aircraft Jeep 13%, Light Medic 9%, Tank 9%, Light Harvester 6% | captures 2.4 |
| Artillery and Scout Bike | 86% | Scout Bike 29%, Infantry 19%, Artillery 17%, Anti-Aircraft Jeep 12%, Tank 9%, Light Medic 8%, Light Harvester 6% | captures 2.4 |
| Spotter Drone and Artillery | 93% | Infantry 23%, Scout Bike 23%, Artillery 17%, Anti-Aircraft Jeep 13%, Light Medic 8%, Tank 8%, Light Harvester 7% | captures 2.4 |

## Genes of the best personality

```json
{
  "mix": {
    "tank": 0.39,
    "heavyCannon": 0.32,
    "artillery": 0.74,
    "blastCannon": 0,
    "sonicTank": 0,
    "scoutBike": 0.57,
    "spotterDrone": 0.97,
    "attackHelicopter": 0.41,
    "fighter": 0.58,
    "antiAircraftJeep": 0.29,
    "lightMedic": 0.1
  },
  "harvestersEarly": 2,
  "harvestersMax": 2,
  "antiAirPerEnemyAir": 1.6,
  "factoryLifeValue": 398.43,
  "killBonusShare": 0.34,
  "returnFireCaution": 1.69,
  "homeDefenceRadius": 7,
  "standOff": 2,
  "harvesterDangerRadius": 1,
  "dangerPenalty": 7.73,
  "scoutWatchDistance": 5,
  "armySizeForMedic": 1,
  "patience": 0.43,
  "captureFactories": 1,
  "transportInfantry": 0.2
}
```
