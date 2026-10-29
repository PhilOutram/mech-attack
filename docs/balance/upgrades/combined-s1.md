# Evolved AI personalities

Produced by `node evolve.js --generations 20 --population 16 --games 8 --seed 1 --set factoryUpgrades.heavyWorks.cost=50 --set factoryUpgrades.airfield.cost=50 --set units.heavyCannon.attack=50 --set units.heavyCannon.defence=50 --set units.blastCannon.attack=50 --set units.blastCannon.defence=15 --set units.sonicTank.attack=20 --set units.sonicTank.defence=25 --set capture.mustStartNextTo=true`. Each generation every personality plays games against others on fixed map 1 and generated maps; the best quarter survive and the rest are mixed and mutated copies of them. Games over 60 rounds count as draws.

## Progress

| Generation | Best win rate | Mean win rate | Best personality favours |
|---|---|---|---|
| 1 | 81% | 49% | Tank 25%, Attack Helicopter 15%, Heavy Cannon 10% |
| 2 | 82% | 48% | Sonic Tank 30%, Scout Bike 29%, Attack Helicopter 12% |
| 3 | 81% | 50% | Heavy Cannon 24%, Tank 19%, Scout Bike 18% |
| 4 | 73% | 50% | Heavy Cannon 25%, Sonic Tank 24%, Tank 16% |
| 5 | 82% | 50% | Heavy Cannon 25%, Sonic Tank 24%, Tank 16% |
| 6 | 75% | 50% | Heavy Cannon 26%, Sonic Tank 22%, Tank 17% |
| 7 | 69% | 50% | Heavy Cannon 27%, Sonic Tank 27%, Tank 19% |
| 8 | 67% | 50% | Heavy Cannon 25%, Sonic Tank 24%, Tank 17% |
| 9 | 84% | 50% | Heavy Cannon 26%, Tank 16%, Sonic Tank 15% |
| 10 | 71% | 50% | Heavy Cannon 24%, Sonic Tank 23%, Tank 16% |
| 11 | 66% | 49% | Heavy Cannon 26%, Tank 16%, Scout Bike 13% |
| 12 | 77% | 49% | Heavy Cannon 24%, Sonic Tank 23%, Tank 16% |
| 13 | 74% | 49% | Heavy Cannon 24%, Sonic Tank 22%, Tank 16% |
| 14 | 73% | 50% | Heavy Cannon 26%, Sonic Tank 21%, Tank 17% |
| 15 | 80% | 50% | Heavy Cannon 26%, Sonic Tank 17%, Tank 17% |
| 16 | 76% | 49% | Heavy Cannon 24%, Sonic Tank 18%, Scout Bike 16% |
| 17 | 88% | 50% | Sonic Tank 24%, Heavy Cannon 22%, Tank 17% |
| 18 | 82% | 49% | Heavy Cannon 21%, Sonic Tank 20%, Tank 18% |
| 19 | 85% | 51% | Heavy Cannon 21%, Sonic Tank 21%, Blast Cannon 15% |
| 20 | 79% | 53% | Sonic Tank 21%, Heavy Cannon 21%, Blast Cannon 15% |

## The best personalities against the hand-tuned AI

60 games each, seats and maps mixed.

| Personality | Wins against the default AI | Units it built (share) | Upgrades and captures per game |
|---|---|---|---|
| Sonic Tank and Heavy Cannon | 90% | Scout Bike 42%, Light Medic 25%, Anti-Aircraft Jeep 18%, Tank 9%, Attack Helicopter 4%, Fighter 2% | Airfield 0.2, captures 0.0 |
| Heavy Cannon and Sonic Tank | 86% | Scout Bike 41%, Light Medic 23%, Tank 15%, Attack Helicopter 12%, Anti-Aircraft Jeep 5%, Fighter 4% | Airfield 0.5, captures 0.0 |
| Heavy Cannon and Sonic Tank | 97% | Scout Bike 39%, Light Medic 24%, Attack Helicopter 15%, Tank 15%, Fighter 5%, Anti-Aircraft Jeep 2% | Airfield 0.6, captures 0.0 |

## Genes of the best personality

```json
{
  "mix": {
    "tank": 0.59,
    "heavyCannon": 0.98,
    "artillery": 0,
    "blastCannon": 0.74,
    "sonicTank": 1,
    "scoutBike": 0.7,
    "spotterDrone": 0,
    "attackHelicopter": 0.44,
    "fighter": 0.14,
    "antiAircraftJeep": 0.01,
    "lightMedic": 0.19
  },
  "harvestersEarly": 1,
  "harvestersMax": 1,
  "antiAirPerEnemyAir": 1.87,
  "factoryLifeValue": 163.9,
  "killBonusShare": 0.47,
  "returnFireCaution": 0.38,
  "homeDefenceRadius": 3,
  "standOff": 2,
  "harvesterDangerRadius": 3,
  "dangerPenalty": 1.47,
  "scoutWatchDistance": 3,
  "armySizeForMedic": 2,
  "patience": 0.27,
  "captureFactories": 0,
  "transportInfantry": 0.67
}
```
