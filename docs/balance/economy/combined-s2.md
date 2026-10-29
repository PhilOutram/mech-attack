# Evolved AI personalities

Produced by `node evolve.js --generations 20 --population 16 --games 8 --seed 2 --set units.scoutBike.cost=45 --set units.lightMedic.cost=60 --set capture.incomePerTurn=10`. Each generation every personality plays games against others on fixed map 1 and generated maps; the best quarter survive and the rest are mixed and mutated copies of them. Games over 60 rounds count as draws.

## Progress

| Generation | Best win rate | Mean win rate | Best personality favours |
|---|---|---|---|
| 1 | 68% | 49% | Tank 16%, Artillery 15%, Anti-Aircraft Jeep 13% |
| 2 | 81% | 50% | Tank 17%, Artillery 14%, Anti-Aircraft Jeep 13% |
| 3 | 77% | 50% | Tank 18%, Artillery 17%, Blast Cannon 16% |
| 4 | 72% | 49% | Artillery 17%, Tank 16%, Sonic Tank 14% |
| 5 | 72% | 50% | Tank 17%, Artillery 16%, Anti-Aircraft Jeep 16% |
| 6 | 79% | 50% | Artillery 19%, Tank 18%, Sonic Tank 14% |
| 7 | 73% | 51% | Artillery 17%, Tank 14%, Sonic Tank 14% |
| 8 | 75% | 49% | Tank 19%, Artillery 18%, Blast Cannon 17% |
| 9 | 81% | 51% | Tank 19%, Artillery 18%, Blast Cannon 17% |
| 10 | 71% | 50% | Artillery 19%, Tank 18%, Blast Cannon 17% |
| 11 | 72% | 49% | Tank 17%, Artillery 17%, Blast Cannon 16% |
| 12 | 68% | 50% | Tank 17%, Artillery 17%, Blast Cannon 16% |
| 13 | 77% | 50% | Tank 17%, Artillery 16%, Blast Cannon 16% |
| 14 | 65% | 50% | Tank 18%, Artillery 17%, Blast Cannon 16% |
| 15 | 74% | 50% | Tank 17%, Artillery 16%, Blast Cannon 16% |
| 16 | 75% | 52% | Tank 16%, Artillery 16%, Blast Cannon 15% |
| 17 | 84% | 50% | Tank 18%, Artillery 16%, Blast Cannon 16% |
| 18 | 67% | 49% | Tank 19%, Artillery 19%, Anti-Aircraft Jeep 16% |
| 19 | 69% | 51% | Tank 19%, Artillery 19%, Anti-Aircraft Jeep 14% |
| 20 | 83% | 49% | Tank 18%, Artillery 16%, Blast Cannon 16% |

## The best personalities against the hand-tuned AI

60 games each, seats and maps mixed.

| Personality | Wins against the default AI | Units it built (share) | Upgrades and captures per game |
|---|---|---|---|
| Tank and Artillery | 66% | Infantry 66%, Artillery 8%, Tank 7%, Light Harvester 5%, Blast Cannon 4%, Spotter Drone 3%, Anti-Aircraft Jeep 3%, Sonic Tank 2%, Attack Helicopter 1%, Scout Bike 0%, Heavy Cannon 0% | Heavy works 0.7, Airfield 0.5, captures 3.3 |
| Tank and Artillery | 63% | Infantry 55%, Tank 9%, Artillery 9%, Anti-Aircraft Jeep 7%, Light Harvester 7%, Blast Cannon 5%, Sonic Tank 3%, Attack Helicopter 2%, Spotter Drone 2%, Scout Bike 1%, Fighter 0%, Light Medic 0% | Heavy works 0.5, Airfield 0.3, captures 2.9 |
| Tank and Artillery | 68% | Infantry 58%, Artillery 9%, Tank 7%, Light Harvester 6%, Anti-Aircraft Jeep 6%, Scout Bike 3%, Blast Cannon 3%, Spotter Drone 3%, Sonic Tank 2%, Attack Helicopter 2%, Fighter 0%, Light Medic 0% | Heavy works 0.5, Airfield 0.4, captures 3.4 |

## Genes of the best personality

```json
{
  "mix": {
    "tank": 1,
    "heavyCannon": 0.13,
    "artillery": 0.88,
    "blastCannon": 0.88,
    "sonicTank": 0.6,
    "scoutBike": 0.15,
    "spotterDrone": 0.87,
    "attackHelicopter": 0.27,
    "fighter": 0,
    "antiAircraftJeep": 0.76,
    "lightMedic": 0
  },
  "harvestersEarly": 1,
  "harvestersMax": 2,
  "antiAirPerEnemyAir": 0.22,
  "factoryLifeValue": 196.7,
  "killBonusShare": 0.73,
  "returnFireCaution": 1.62,
  "homeDefenceRadius": 4,
  "standOff": 1,
  "harvesterDangerRadius": 2,
  "dangerPenalty": 4.98,
  "scoutWatchDistance": 5,
  "armySizeForMedic": 2,
  "patience": 0.55,
  "captureFactories": 2,
  "transportInfantry": 0
}
```
