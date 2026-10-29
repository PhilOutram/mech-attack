# Evolved AI personalities

Produced by `node evolve.js --generations 20 --population 16 --games 8 --seed 1`. Each generation every personality plays games against others on fixed map 1 and generated maps; the best quarter survive and the rest are mixed and mutated copies of them. Games over 60 rounds count as draws.

## Progress

| Generation | Best win rate | Mean win rate | Best personality favours |
|---|---|---|---|
| 1 | 88% | 50% | Tank 25%, Attack Helicopter 15%, Heavy Cannon 10% |
| 2 | 73% | 50% | Sonic Tank 17%, Scout Bike 17%, Heavy Cannon 17% |
| 3 | 74% | 50% | Sonic Tank 18%, Heavy Cannon 14%, Scout Bike 14% |
| 4 | 81% | 51% | Sonic Tank 21%, Heavy Cannon 17%, Scout Bike 16% |
| 5 | 75% | 51% | Sonic Tank 17%, Heavy Cannon 17%, Attack Helicopter 15% |
| 6 | 86% | 48% | Sonic Tank 22%, Tank 17%, Attack Helicopter 17% |
| 7 | 82% | 50% | Sonic Tank 22%, Tank 16%, Scout Bike 15% |
| 8 | 73% | 50% | Sonic Tank 32%, Tank 21%, Artillery 17% |
| 9 | 72% | 50% | Sonic Tank 32%, Tank 21%, Artillery 17% |
| 10 | 74% | 50% | Sonic Tank 22%, Attack Helicopter 21%, Tank 17% |
| 11 | 70% | 49% | Sonic Tank 22%, Tank 17%, Attack Helicopter 16% |
| 12 | 73% | 50% | Sonic Tank 22%, Attack Helicopter 20%, Tank 17% |
| 13 | 80% | 50% | Sonic Tank 21%, Attack Helicopter 19%, Tank 16% |
| 14 | 73% | 50% | Sonic Tank 21%, Attack Helicopter 19%, Tank 16% |
| 15 | 70% | 49% | Sonic Tank 21%, Tank 20%, Attack Helicopter 19% |
| 16 | 75% | 50% | Sonic Tank 24%, Attack Helicopter 21%, Tank 16% |
| 17 | 71% | 51% | Sonic Tank 23%, Attack Helicopter 21%, Tank 17% |
| 18 | 75% | 50% | Sonic Tank 23%, Attack Helicopter 22%, Tank 17% |
| 19 | 80% | 49% | Sonic Tank 22%, Attack Helicopter 22%, Tank 18% |
| 20 | 64% | 51% | Sonic Tank 22%, Attack Helicopter 22%, Spotter Drone 16% |

## The best personalities against the hand-tuned AI

60 games each, seats and maps mixed.

| Personality | Wins against the default AI | Units it built (share) | Upgrades and captures per game |
|---|---|---|---|
| Sonic Tank and Attack Helicopter | 74% | Infantry 31%, Scout Bike 26%, Light Harvester 13%, Artillery 11%, Tank 9%, Light Medic 9%, Anti-Aircraft Jeep 1% | captures 1.5 |
| Sonic Tank and Attack Helicopter | 79% | Infantry 27%, Scout Bike 21%, Light Harvester 14%, Artillery 13%, Light Medic 12%, Tank 11%, Anti-Aircraft Jeep 2% | captures 1.3 |
| Sonic Tank and Attack Helicopter | 82% | Infantry 24%, Scout Bike 22%, Light Harvester 12%, Artillery 12%, Light Medic 11%, Tank 10%, Anti-Aircraft Jeep 8% | captures 1.6 |

## Genes of the best personality

```json
{
  "mix": {
    "tank": 0.63,
    "heavyCannon": 0.02,
    "artillery": 0.28,
    "blastCannon": 0.26,
    "sonicTank": 0.87,
    "scoutBike": 0.16,
    "spotterDrone": 0.63,
    "attackHelicopter": 0.86,
    "fighter": 0.09,
    "antiAircraftJeep": 0,
    "lightMedic": 0.16
  },
  "harvestersEarly": 2,
  "harvestersMax": 2,
  "antiAirPerEnemyAir": 1.68,
  "factoryLifeValue": 224.62,
  "killBonusShare": 0.43,
  "returnFireCaution": 0.92,
  "homeDefenceRadius": 2,
  "standOff": 2,
  "harvesterDangerRadius": 0,
  "dangerPenalty": 6.62,
  "scoutWatchDistance": 3,
  "armySizeForMedic": 3,
  "patience": 0.16,
  "captureFactories": 1,
  "transportInfantry": 0.26
}
```
