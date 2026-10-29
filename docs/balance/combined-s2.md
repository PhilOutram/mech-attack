# Evolved AI personalities

Produced by `node evolve.js --generations 20 --population 16 --games 8 --seed 2 --set factoryUpgrades.heavyWorks.cost=50 --set factoryUpgrades.airfield.cost=50 --set units.heavyCannon.attack=50 --set units.heavyCannon.defence=50 --set units.blastCannon.attack=50 --set units.blastCannon.defence=15 --set units.sonicTank.attack=20 --set units.sonicTank.defence=25 --set capture.mustStartNextTo=true`. Each generation every personality plays games against others on fixed map 1 and generated maps; the best quarter survive and the rest are mixed and mutated copies of them. Games over 60 rounds count as draws.

## Progress

| Generation | Best win rate | Mean win rate | Best personality favours |
|---|---|---|---|
| 1 | 77% | 49% | Sonic Tank 15%, Light Medic 13%, Fighter 13% |
| 2 | 75% | 50% | Sonic Tank 15%, Tank 15%, Fighter 13% |
| 3 | 72% | 50% | Scout Bike 24%, Heavy Cannon 23%, Artillery 17% |
| 4 | 84% | 49% | Tank 22%, Scout Bike 21%, Light Medic 17% |
| 5 | 64% | 50% | Sonic Tank 18%, Tank 17%, Light Medic 15% |
| 6 | 69% | 51% | Sonic Tank 14%, Tank 14%, Light Medic 14% |
| 7 | 70% | 51% | Tank 21%, Light Medic 17%, Scout Bike 14% |
| 8 | 71% | 50% | Sonic Tank 19%, Tank 19%, Light Medic 15% |
| 9 | 88% | 50% | Sonic Tank 19%, Tank 18%, Light Medic 13% |
| 10 | 71% | 51% | Tank 23%, Light Medic 22%, Scout Bike 17% |
| 11 | 69% | 50% | Light Medic 20%, Tank 18%, Blast Cannon 16% |
| 12 | 86% | 50% | Light Medic 20%, Tank 18%, Scout Bike 17% |
| 13 | 71% | 50% | Tank 17%, Light Medic 17%, Blast Cannon 14% |
| 14 | 69% | 50% | Light Medic 21%, Tank 20%, Scout Bike 17% |
| 15 | 75% | 51% | Light Medic 20%, Tank 20%, Scout Bike 16% |
| 16 | 67% | 49% | Light Medic 20%, Tank 20%, Scout Bike 16% |
| 17 | 92% | 51% | Light Medic 19%, Tank 17%, Heavy Cannon 13% |
| 18 | 77% | 51% | Tank 19%, Light Medic 17%, Blast Cannon 13% |
| 19 | 73% | 49% | Tank 20%, Blast Cannon 16%, Attack Helicopter 15% |
| 20 | 75% | 50% | Tank 20%, Blast Cannon 16%, Attack Helicopter 15% |

## The best personalities against the hand-tuned AI

60 games each, seats and maps mixed.

| Personality | Wins against the default AI | Units it built (share) | Upgrades and captures per game |
|---|---|---|---|
| Tank and Blast Cannon | 82% | Scout Bike 26%, Light Medic 14%, Artillery 13%, Light Harvester 12%, Attack Helicopter 11%, Tank 10%, Spotter Drone 9%, Anti-Aircraft Jeep 5% | Airfield 0.6, captures 0.0 |
| Tank and Scout Bike | 79% | Scout Bike 31%, Light Medic 18%, Light Harvester 13%, Anti-Aircraft Jeep 12%, Artillery 10%, Tank 6%, Spotter Drone 5%, Attack Helicopter 4%, Fighter 1% | Airfield 0.3, captures 0.0 |
| Tank and Blast Cannon | 70% | Scout Bike 38%, Light Medic 17%, Spotter Drone 13%, Light Harvester 11%, Attack Helicopter 10%, Tank 6%, Artillery 3%, Anti-Aircraft Jeep 2% | Airfield 0.7, captures 0.0 |

## Genes of the best personality

```json
{
  "mix": {
    "tank": 0.84,
    "heavyCannon": 0.31,
    "artillery": 0.42,
    "blastCannon": 0.65,
    "sonicTank": 0,
    "scoutBike": 0.6,
    "spotterDrone": 0.39,
    "attackHelicopter": 0.61,
    "fighter": 0,
    "antiAircraftJeep": 0,
    "lightMedic": 0.35
  },
  "harvestersEarly": 1,
  "harvestersMax": 2,
  "antiAirPerEnemyAir": 1.52,
  "factoryLifeValue": 113.27,
  "killBonusShare": 0.25,
  "returnFireCaution": 0.99,
  "homeDefenceRadius": 5,
  "standOff": 3,
  "harvesterDangerRadius": 0,
  "dangerPenalty": 7.38,
  "scoutWatchDistance": 3,
  "armySizeForMedic": 1,
  "patience": 0.19,
  "captureFactories": 0,
  "transportInfantry": 0.65
}
```
