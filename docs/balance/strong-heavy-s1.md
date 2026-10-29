# Evolved AI personalities

Produced by `node evolve.js --generations 20 --population 16 --games 8 --seed 1 --set units.heavyCannon.attack=50 --set units.heavyCannon.defence=50 --set units.blastCannon.attack=50 --set units.blastCannon.defence=15 --set units.sonicTank.attack=20 --set units.sonicTank.defence=25`. Each generation every personality plays games against others on fixed map 1 and generated maps; the best quarter survive and the rest are mixed and mutated copies of them. Games over 60 rounds count as draws.

## Progress

| Generation | Best win rate | Mean win rate | Best personality favours |
|---|---|---|---|
| 1 | 88% | 50% | Tank 25%, Attack Helicopter 15%, Heavy Cannon 10% |
| 2 | 73% | 50% | Sonic Tank 17%, Scout Bike 17%, Heavy Cannon 17% |
| 3 | 74% | 50% | Sonic Tank 18%, Heavy Cannon 14%, Scout Bike 14% |
| 4 | 70% | 51% | Sonic Tank 17%, Heavy Cannon 16%, Scout Bike 15% |
| 5 | 82% | 50% | Sonic Tank 18%, Heavy Cannon 18%, Attack Helicopter 16% |
| 6 | 69% | 50% | Sonic Tank 17%, Heavy Cannon 17%, Attack Helicopter 15% |
| 7 | 75% | 51% | Sonic Tank 17%, Heavy Cannon 17%, Attack Helicopter 16% |
| 8 | 71% | 49% | Sonic Tank 20%, Heavy Cannon 18%, Attack Helicopter 17% |
| 9 | 66% | 50% | Heavy Cannon 18%, Sonic Tank 17%, Tank 15% |
| 10 | 72% | 50% | Heavy Cannon 19%, Tank 15%, Attack Helicopter 15% |
| 11 | 73% | 49% | Heavy Cannon 19%, Tank 15%, Attack Helicopter 15% |
| 12 | 82% | 49% | Heavy Cannon 21%, Tank 15%, Attack Helicopter 15% |
| 13 | 72% | 50% | Heavy Cannon 21%, Tank 15%, Attack Helicopter 15% |
| 14 | 70% | 50% | Attack Helicopter 19%, Heavy Cannon 17%, Sonic Tank 15% |
| 15 | 72% | 49% | Heavy Cannon 17%, Attack Helicopter 14%, Sonic Tank 13% |
| 16 | 86% | 49% | Heavy Cannon 18%, Tank 13%, Scout Bike 13% |
| 17 | 70% | 48% | Heavy Cannon 18%, Tank 13%, Scout Bike 13% |
| 18 | 78% | 50% | Heavy Cannon 18%, Tank 13%, Scout Bike 12% |
| 19 | 74% | 51% | Sonic Tank 15%, Tank 14%, Heavy Cannon 14% |
| 20 | 68% | 50% | Sonic Tank 14%, Tank 13%, Heavy Cannon 13% |

## The best personalities against the hand-tuned AI

60 games each, seats and maps mixed.

| Personality | Wins against the default AI | Units it built (share) | Upgrades and captures per game |
|---|---|---|---|
| Sonic Tank and Tank | 86% | Scout Bike 30%, Light Medic 18%, Light Harvester 14%, Anti-Aircraft Jeep 14%, Artillery 13%, Tank 11% | captures 0.0 |
| Heavy Cannon and Sonic Tank | 92% | Scout Bike 32%, Artillery 19%, Light Medic 18%, Tank 15%, Light Harvester 14%, Anti-Aircraft Jeep 2% | captures 0.0 |
| Sonic Tank and Tank | 93% | Scout Bike 35%, Light Medic 19%, Artillery 17%, Tank 15%, Light Harvester 12%, Anti-Aircraft Jeep 2% | captures 0.0 |

## Genes of the best personality

```json
{
  "mix": {
    "tank": 0.61,
    "heavyCannon": 0.59,
    "artillery": 0.45,
    "blastCannon": 0.39,
    "sonicTank": 0.65,
    "scoutBike": 0.52,
    "spotterDrone": 0.22,
    "attackHelicopter": 0.41,
    "fighter": 0.2,
    "antiAircraftJeep": 0.08,
    "lightMedic": 0.46
  },
  "harvestersEarly": 2,
  "harvestersMax": 2,
  "antiAirPerEnemyAir": 1.89,
  "factoryLifeValue": 246.78,
  "killBonusShare": 0.01,
  "returnFireCaution": 1.06,
  "homeDefenceRadius": 3,
  "standOff": 2,
  "harvesterDangerRadius": 0,
  "dangerPenalty": 4.6,
  "scoutWatchDistance": 3,
  "armySizeForMedic": 1,
  "patience": 0.3,
  "captureFactories": 0,
  "transportInfantry": 0.2
}
```
