# Evolved AI personalities

Produced by `node evolve.js --generations 20 --population 16 --games 8 --seed 2 --set factoryUpgrades.heavyWorks.cost=50 --set factoryUpgrades.airfield.cost=50`. Each generation every personality plays games against others on fixed map 1 and generated maps; the best quarter survive and the rest are mixed and mutated copies of them. Games over 60 rounds count as draws.

## Progress

| Generation | Best win rate | Mean win rate | Best personality favours |
|---|---|---|---|
| 1 | 83% | 50% | Sonic Tank 15%, Light Medic 13%, Fighter 13% |
| 2 | 70% | 49% | Heavy Cannon 15%, Scout Bike 15%, Sonic Tank 12% |
| 3 | 82% | 50% | Heavy Cannon 13%, Sonic Tank 12%, Light Medic 11% |
| 4 | 82% | 49% | Sonic Tank 15%, Light Medic 14%, Tank 13% |
| 5 | 71% | 49% | Heavy Cannon 14%, Light Medic 13%, Tank 12% |
| 6 | 75% | 50% | Fighter 16%, Tank 14%, Sonic Tank 13% |
| 7 | 77% | 51% | Fighter 17%, Light Medic 17%, Tank 13% |
| 8 | 69% | 49% | Fighter 17%, Light Medic 17%, Tank 13% |
| 9 | 85% | 51% | Light Medic 17%, Fighter 16%, Tank 13% |
| 10 | 68% | 50% | Fighter 16%, Light Medic 16%, Tank 12% |
| 11 | 70% | 49% | Fighter 18%, Light Medic 17%, Sonic Tank 14% |
| 12 | 64% | 50% | Fighter 18%, Light Medic 17%, Scout Bike 15% |
| 13 | 69% | 50% | Fighter 16%, Light Medic 16%, Sonic Tank 12% |
| 14 | 72% | 49% | Fighter 15%, Light Medic 14%, Tank 14% |
| 15 | 76% | 50% | Light Medic 15%, Fighter 15%, Tank 12% |
| 16 | 75% | 50% | Tank 14%, Light Medic 14%, Fighter 14% |
| 17 | 68% | 51% | Light Medic 15%, Fighter 15%, Tank 14% |
| 18 | 80% | 51% | Fighter 15%, Tank 13%, Light Medic 12% |
| 19 | 84% | 50% | Fighter 16%, Light Medic 15%, Blast Cannon 15% |
| 20 | 69% | 50% | Fighter 17%, Blast Cannon 16%, Light Medic 11% |

## The best personalities against the hand-tuned AI

60 games each, seats and maps mixed.

| Personality | Wins against the default AI | Units it built (share) | Upgrades and captures per game |
|---|---|---|---|
| Fighter and Blast Cannon | 79% | Scout Bike 24%, Light Medic 23%, Anti-Aircraft Jeep 13%, Artillery 13%, Fighter 9%, Spotter Drone 8%, Tank 6%, Attack Helicopter 4%, Light Harvester 0% | Airfield 0.4, captures 0.0 |
| Fighter and Blast Cannon | 76% | Scout Bike 31%, Light Medic 20%, Anti-Aircraft Jeep 13%, Fighter 9%, Artillery 9%, Spotter Drone 8%, Attack Helicopter 6%, Tank 4%, Light Harvester 0% | Airfield 0.5, captures 0.0 |
| Fighter and Tank | 84% | Scout Bike 29%, Light Medic 25%, Anti-Aircraft Jeep 16%, Artillery 11%, Spotter Drone 5%, Fighter 5%, Tank 5%, Attack Helicopter 4%, Light Harvester 0% | Airfield 0.3, captures 0.0 |

## Genes of the best personality

```json
{
  "mix": {
    "tank": 0.48,
    "heavyCannon": 0.51,
    "artillery": 0.4,
    "blastCannon": 0.97,
    "sonicTank": 0.62,
    "scoutBike": 0.38,
    "spotterDrone": 0.31,
    "attackHelicopter": 0.25,
    "fighter": 1,
    "antiAircraftJeep": 0.35,
    "lightMedic": 0.68
  },
  "harvestersEarly": 1,
  "harvestersMax": 1,
  "antiAirPerEnemyAir": 0.88,
  "factoryLifeValue": 246.04,
  "killBonusShare": 0.34,
  "returnFireCaution": 0.89,
  "homeDefenceRadius": 7,
  "standOff": 2,
  "harvesterDangerRadius": 1,
  "dangerPenalty": 6.07,
  "scoutWatchDistance": 2,
  "armySizeForMedic": 2,
  "patience": 0.44,
  "captureFactories": 0,
  "transportInfantry": 0.22
}
```
