# Evolved AI personalities

Produced by `node evolve.js --generations 20 --population 16 --games 8 --seed 1 --set factoryUpgrades.heavyWorks.cost=50 --set factoryUpgrades.airfield.cost=50`. Each generation every personality plays games against others on fixed map 1 and generated maps; the best quarter survive and the rest are mixed and mutated copies of them. Games over 60 rounds count as draws.

## Progress

| Generation | Best win rate | Mean win rate | Best personality favours |
|---|---|---|---|
| 1 | 81% | 50% | Tank 25%, Attack Helicopter 15%, Heavy Cannon 10% |
| 2 | 67% | 49% | Sonic Tank 17%, Scout Bike 17%, Heavy Cannon 17% |
| 3 | 69% | 51% | Sonic Tank 17%, Scout Bike 17%, Heavy Cannon 17% |
| 4 | 70% | 50% | Scout Bike 20%, Heavy Cannon 18%, Sonic Tank 17% |
| 5 | 77% | 50% | Heavy Cannon 25%, Tank 18%, Scout Bike 15% |
| 6 | 76% | 49% | Sonic Tank 17%, Blast Cannon 17%, Fighter 15% |
| 7 | 71% | 50% | Heavy Cannon 17%, Blast Cannon 17%, Sonic Tank 17% |
| 8 | 71% | 49% | Heavy Cannon 22%, Scout Bike 21%, Sonic Tank 19% |
| 9 | 72% | 50% | Blast Cannon 18%, Sonic Tank 17%, Heavy Cannon 16% |
| 10 | 68% | 49% | Blast Cannon 17%, Fighter 17%, Heavy Cannon 15% |
| 11 | 75% | 49% | Heavy Cannon 20%, Scout Bike 20%, Sonic Tank 18% |
| 12 | 75% | 50% | Heavy Cannon 21%, Sonic Tank 21%, Tank 18% |
| 13 | 69% | 50% | Heavy Cannon 20%, Sonic Tank 18%, Tank 17% |
| 14 | 80% | 50% | Blast Cannon 17%, Heavy Cannon 15%, Tank 13% |
| 15 | 70% | 51% | Heavy Cannon 18%, Sonic Tank 17%, Scout Bike 16% |
| 16 | 83% | 50% | Blast Cannon 16%, Scout Bike 15%, Heavy Cannon 14% |
| 17 | 69% | 50% | Blast Cannon 17%, Sonic Tank 16%, Heavy Cannon 15% |
| 18 | 69% | 51% | Blast Cannon 17%, Scout Bike 15%, Sonic Tank 14% |
| 19 | 67% | 50% | Blast Cannon 17%, Scout Bike 15%, Sonic Tank 14% |
| 20 | 72% | 49% | Sonic Tank 21%, Heavy Cannon 20%, Scout Bike 18% |

## The best personalities against the hand-tuned AI

60 games each, seats and maps mixed.

| Personality | Wins against the default AI | Units it built (share) | Upgrades and captures per game |
|---|---|---|---|
| Sonic Tank and Heavy Cannon | 78% | Infantry 37%, Scout Bike 26%, Light Medic 15%, Light Harvester 10%, Tank 8%, Anti-Aircraft Jeep 2%, Attack Helicopter 2% | Airfield 0.1, captures 2.2 |
| Blast Cannon and Sonic Tank | 46% | Infantry 32%, Scout Bike 20%, Light Harvester 12%, Anti-Aircraft Jeep 12%, Transporter 7%, Light Medic 6%, Tank 6%, Attack Helicopter 3%, Spotter Drone 2%, Fighter 1% | Airfield 0.2, captures 2.2 |
| Heavy Cannon and Blast Cannon | 66% | Infantry 39%, Scout Bike 17%, Light Harvester 10%, Light Medic 10%, Anti-Aircraft Jeep 9%, Spotter Drone 5%, Attack Helicopter 4%, Tank 4%, Artillery 2%, Fighter 0% | Airfield 0.4, captures 1.9 |

## Genes of the best personality

```json
{
  "mix": {
    "tank": 0.74,
    "heavyCannon": 0.88,
    "artillery": 0,
    "blastCannon": 0,
    "sonicTank": 0.94,
    "scoutBike": 0.8,
    "spotterDrone": 0,
    "attackHelicopter": 0.7,
    "fighter": 0,
    "antiAircraftJeep": 0,
    "lightMedic": 0.34
  },
  "harvestersEarly": 2,
  "harvestersMax": 2,
  "antiAirPerEnemyAir": 1.65,
  "factoryLifeValue": 70.83,
  "killBonusShare": 0.51,
  "returnFireCaution": 0.87,
  "homeDefenceRadius": 4,
  "standOff": 2,
  "harvesterDangerRadius": 1,
  "dangerPenalty": 1.86,
  "scoutWatchDistance": 3,
  "armySizeForMedic": 2,
  "patience": 0,
  "captureFactories": 2,
  "transportInfantry": 0.41
}
```
