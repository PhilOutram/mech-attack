# Evolved AI personalities

Produced by `node evolve.js --generations 20 --population 16 --games 8 --seed 1 --set units.scoutBike.cost=45`. Each generation every personality plays games against others on fixed map 1 and generated maps; the best quarter survive and the rest are mixed and mutated copies of them. Games over 60 rounds count as draws.

## Progress

| Generation | Best win rate | Mean win rate | Best personality favours |
|---|---|---|---|
| 1 | 83% | 50% | Light Medic 15%, Anti-Aircraft Jeep 15%, Tank 14% |
| 2 | 80% | 49% | Tank 21%, Attack Helicopter 12%, Scout Bike 11% |
| 3 | 79% | 50% | Sonic Tank 21%, Heavy Cannon 21%, Scout Bike 20% |
| 4 | 78% | 50% | Tank 21%, Scout Bike 11%, Artillery 10% |
| 5 | 71% | 50% | Tank 22%, Artillery 13%, Scout Bike 12% |
| 6 | 69% | 50% | Tank 22%, Artillery 15%, Scout Bike 13% |
| 7 | 83% | 50% | Scout Bike 24%, Tank 16%, Light Medic 14% |
| 8 | 77% | 49% | Fighter 25%, Tank 21%, Artillery 13% |
| 9 | 69% | 50% | Tank 26%, Heavy Cannon 25%, Fighter 16% |
| 10 | 75% | 50% | Heavy Cannon 33%, Tank 29%, Scout Bike 12% |
| 11 | 74% | 49% | Heavy Cannon 28%, Tank 27%, Artillery 13% |
| 12 | 66% | 50% | Heavy Cannon 31%, Light Medic 22%, Tank 19% |
| 13 | 67% | 50% | Heavy Cannon 30%, Light Medic 16%, Tank 14% |
| 14 | 78% | 51% | Heavy Cannon 31%, Light Medic 22%, Tank 19% |
| 15 | 68% | 50% | Heavy Cannon 29%, Tank 27%, Light Medic 21% |
| 16 | 73% | 51% | Heavy Cannon 29%, Tank 18%, Light Medic 17% |
| 17 | 77% | 50% | Heavy Cannon 28%, Tank 17%, Light Medic 16% |
| 18 | 79% | 49% | Blast Cannon 23%, Tank 21%, Light Medic 14% |
| 19 | 88% | 49% | Blast Cannon 23%, Tank 21%, Light Medic 14% |
| 20 | 83% | 51% | Blast Cannon 31%, Tank 17%, Heavy Cannon 14% |

## The best personalities against the hand-tuned AI

60 games each, seats and maps mixed.

| Personality | Wins against the default AI | Units it built (share) | Upgrades and captures per game |
|---|---|---|---|
| Blast Cannon and Tank | 88% | Scout Bike 39%, Light Medic 34%, Tank 25%, Anti-Aircraft Jeep 2% | captures 0.0 |
| Blast Cannon and Tank | 81% | Scout Bike 35%, Light Medic 33%, Tank 30%, Anti-Aircraft Jeep 2% | captures 0.0 |
| Blast Cannon and Tank | 78% | Scout Bike 37%, Tank 35%, Light Medic 27%, Anti-Aircraft Jeep 1%, Light Harvester 0% | captures 0.0 |

## Genes of the best personality

```json
{
  "mix": {
    "tank": 0.37,
    "heavyCannon": 0.31,
    "artillery": 0,
    "blastCannon": 0.67,
    "sonicTank": 0.13,
    "scoutBike": 0.13,
    "spotterDrone": 0.04,
    "attackHelicopter": 0.18,
    "fighter": 0.21,
    "antiAircraftJeep": 0,
    "lightMedic": 0.14
  },
  "harvestersEarly": 1,
  "harvestersMax": 1,
  "antiAirPerEnemyAir": 1.06,
  "factoryLifeValue": 313.49,
  "killBonusShare": 0.69,
  "returnFireCaution": 1.4,
  "homeDefenceRadius": 2,
  "standOff": 1,
  "harvesterDangerRadius": 1,
  "dangerPenalty": 4.72,
  "scoutWatchDistance": 3,
  "armySizeForMedic": 2,
  "patience": 0.4,
  "captureFactories": 0,
  "transportInfantry": 0.3
}
```
