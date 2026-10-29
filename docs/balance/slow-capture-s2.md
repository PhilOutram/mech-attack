# Evolved AI personalities

Produced by `node evolve.js --generations 20 --population 16 --games 8 --seed 2 --set capture.mustStartNextTo=true`. Each generation every personality plays games against others on fixed map 1 and generated maps; the best quarter survive and the rest are mixed and mutated copies of them. Games over 60 rounds count as draws.

## Progress

| Generation | Best win rate | Mean win rate | Best personality favours |
|---|---|---|---|
| 1 | 83% | 49% | Sonic Tank 15%, Light Medic 13%, Fighter 13% |
| 2 | 81% | 50% | Sonic Tank 15%, Tank 15%, Fighter 13% |
| 3 | 83% | 49% | Heavy Cannon 17%, Sonic Tank 16%, Attack Helicopter 15% |
| 4 | 70% | 49% | Heavy Cannon 17%, Tank 15%, Sonic Tank 15% |
| 5 | 72% | 49% | Heavy Cannon 16%, Scout Bike 14%, Sonic Tank 14% |
| 6 | 69% | 49% | Heavy Cannon 18%, Attack Helicopter 16%, Artillery 15% |
| 7 | 77% | 50% | Heavy Cannon 15%, Scout Bike 15%, Sonic Tank 12% |
| 8 | 72% | 49% | Tank 18%, Heavy Cannon 18%, Attack Helicopter 15% |
| 9 | 79% | 50% | Tank 14%, Attack Helicopter 14%, Artillery 14% |
| 10 | 69% | 50% | Tank 16%, Attack Helicopter 15%, Artillery 15% |
| 11 | 73% | 51% | Heavy Cannon 16%, Tank 13%, Attack Helicopter 13% |
| 12 | 75% | 49% | Heavy Cannon 16%, Tank 13%, Attack Helicopter 12% |
| 13 | 77% | 50% | Heavy Cannon 19%, Tank 15%, Attack Helicopter 14% |
| 14 | 64% | 50% | Heavy Cannon 18%, Attack Helicopter 13%, Tank 12% |
| 15 | 80% | 52% | Heavy Cannon 20%, Tank 17%, Artillery 12% |
| 16 | 67% | 50% | Heavy Cannon 20%, Attack Helicopter 15%, Tank 13% |
| 17 | 69% | 51% | Heavy Cannon 22%, Attack Helicopter 16%, Tank 14% |
| 18 | 70% | 50% | Heavy Cannon 19%, Attack Helicopter 16%, Tank 15% |
| 19 | 66% | 49% | Heavy Cannon 20%, Attack Helicopter 15%, Tank 14% |
| 20 | 77% | 51% | Heavy Cannon 20%, Attack Helicopter 14%, Tank 13% |

## The best personalities against the hand-tuned AI

60 games each, seats and maps mixed.

| Personality | Wins against the default AI | Units it built (share) | Upgrades and captures per game |
|---|---|---|---|
| Heavy Cannon and Attack Helicopter | 89% | Scout Bike 29%, Light Medic 18%, Artillery 17%, Anti-Aircraft Jeep 13%, Tank 13%, Light Harvester 10% | captures 0.0 |
| Heavy Cannon and Tank | 84% | Scout Bike 31%, Light Medic 17%, Artillery 15%, Light Harvester 12%, Anti-Aircraft Jeep 12%, Tank 12% | captures 0.0 |
| Heavy Cannon and Artillery | 58% | Light Harvester 24%, Anti-Aircraft Jeep 20%, Scout Bike 18%, Artillery 18%, Light Medic 14%, Tank 7% | captures 0.0 |

## Genes of the best personality

```json
{
  "mix": {
    "tank": 0.67,
    "heavyCannon": 1,
    "artillery": 0.45,
    "blastCannon": 0.44,
    "sonicTank": 0.45,
    "scoutBike": 0.55,
    "spotterDrone": 0.26,
    "attackHelicopter": 0.71,
    "fighter": 0,
    "antiAircraftJeep": 0.15,
    "lightMedic": 0.42
  },
  "harvestersEarly": 2,
  "harvestersMax": 2,
  "antiAirPerEnemyAir": 2,
  "factoryLifeValue": 197.88,
  "killBonusShare": 0.31,
  "returnFireCaution": 1.76,
  "homeDefenceRadius": 3,
  "standOff": 2,
  "harvesterDangerRadius": 0,
  "dangerPenalty": 6.36,
  "scoutWatchDistance": 2,
  "armySizeForMedic": 1,
  "patience": 0.15,
  "captureFactories": 0,
  "transportInfantry": 0.85
}
```
