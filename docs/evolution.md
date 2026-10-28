# Evolved AI personalities

Produced by `node evolve.js --generations 40 --population 20 --games 10 --seed 1`. Each generation every personality plays games against others on fixed map 1 and generated maps; the best quarter survive and the rest are mixed and mutated copies of them. Games over 60 rounds count as draws.

## Progress

| Generation | Best win rate | Mean win rate | Best personality favours |
|---|---|---|---|
| 1 | 75% | 50% | Blast Cannon 14%, Spotter Drone 14%, Light Medic 13% |
| 2 | 74% | 50% | Blast Cannon 23%, Scout Bike 16%, Sonic Tank 15% |
| 3 | 85% | 50% | Blast Cannon 24%, Scout Bike 17%, Sonic Tank 15% |
| 4 | 66% | 49% | Blast Cannon 24%, Scout Bike 17%, Sonic Tank 15% |
| 5 | 69% | 50% | Blast Cannon 22%, Scout Bike 16%, Light Medic 13% |
| 6 | 76% | 50% | Scout Bike 19%, Blast Cannon 17%, Sonic Tank 16% |
| 7 | 82% | 50% | Heavy Cannon 16%, Blast Cannon 16%, Scout Bike 15% |
| 8 | 88% | 50% | Blast Cannon 18%, Tank 17%, Scout Bike 13% |
| 9 | 76% | 50% | Blast Cannon 18%, Tank 17%, Scout Bike 13% |
| 10 | 70% | 50% | Blast Cannon 19%, Scout Bike 17%, Tank 14% |
| 11 | 69% | 50% | Tank 18%, Blast Cannon 17%, Heavy Cannon 13% |
| 12 | 71% | 50% | Tank 18%, Blast Cannon 17%, Heavy Cannon 13% |
| 13 | 67% | 50% | Tank 18%, Blast Cannon 15%, Scout Bike 13% |
| 14 | 71% | 50% | Tank 18%, Blast Cannon 15%, Scout Bike 13% |
| 15 | 68% | 50% | Heavy Cannon 17%, Tank 14%, Blast Cannon 14% |
| 16 | 73% | 51% | Tank 18%, Blast Cannon 15%, Scout Bike 14% |
| 17 | 62% | 50% | Heavy Cannon 17%, Tank 15%, Blast Cannon 15% |
| 18 | 75% | 50% | Heavy Cannon 17%, Scout Bike 15%, Blast Cannon 14% |
| 19 | 81% | 50% | Heavy Cannon 17%, Tank 14%, Blast Cannon 14% |
| 20 | 80% | 50% | Heavy Cannon 17%, Tank 14%, Blast Cannon 14% |
| 21 | 72% | 50% | Heavy Cannon 17%, Tank 14%, Blast Cannon 14% |
| 22 | 87% | 50% | Heavy Cannon 15%, Scout Bike 15%, Tank 14% |
| 23 | 71% | 49% | Heavy Cannon 17%, Tank 14%, Scout Bike 14% |
| 24 | 73% | 51% | Heavy Cannon 17%, Blast Cannon 15%, Tank 15% |
| 25 | 75% | 50% | Heavy Cannon 17%, Tank 14%, Scout Bike 14% |
| 26 | 67% | 50% | Heavy Cannon 16%, Scout Bike 15%, Tank 14% |
| 27 | 76% | 50% | Heavy Cannon 17%, Tank 15%, Scout Bike 14% |
| 28 | 65% | 50% | Heavy Cannon 16%, Blast Cannon 14%, Sonic Tank 13% |
| 29 | 85% | 50% | Heavy Cannon 16%, Scout Bike 16%, Tank 14% |
| 30 | 70% | 50% | Heavy Cannon 17%, Scout Bike 16%, Tank 14% |
| 31 | 68% | 50% | Scout Bike 16%, Tank 14%, Heavy Cannon 14% |
| 32 | 75% | 50% | Heavy Cannon 15%, Scout Bike 14%, Tank 13% |
| 33 | 75% | 49% | Heavy Cannon 15%, Scout Bike 14%, Tank 13% |
| 34 | 73% | 50% | Scout Bike 16%, Heavy Cannon 13%, Light Medic 13% |
| 35 | 81% | 50% | Heavy Cannon 16%, Tank 16%, Light Medic 14% |
| 36 | 81% | 50% | Heavy Cannon 18%, Tank 16%, Scout Bike 14% |
| 37 | 69% | 50% | Heavy Cannon 16%, Scout Bike 15%, Tank 14% |
| 38 | 75% | 50% | Heavy Cannon 15%, Tank 15%, Light Medic 13% |
| 39 | 74% | 50% | Heavy Cannon 15%, Tank 15%, Light Medic 13% |
| 40 | 78% | 50% | Heavy Cannon 17%, Tank 16%, Scout Bike 14% |

## The best personalities against the hand-tuned AI

100 games each, seats and maps mixed.

| Personality | Wins against the default AI | Units it built (share) |
|---|---|---|
| Heavy Cannon and Tank | 62% | Scout Bike 31%, Heavy Cannon 24%, Anti-Aircraft Jeep 17%, Tank 8%, Light Harvester 7%, Sonic Tank 5%, Light Medic 4%, Blast Cannon 3%, Attack Helicopter 2%, Spotter Drone 1% |
| Heavy Cannon and Tank | 70% | Heavy Cannon 25%, Scout Bike 23%, Anti-Aircraft Jeep 16%, Light Medic 15%, Tank 12%, Light Harvester 6%, Sonic Tank 2%, Blast Cannon 1%, Attack Helicopter 0%, Spotter Drone 0% |
| Heavy Cannon and Scout Bike | 76% | Scout Bike 36%, Heavy Cannon 24%, Anti-Aircraft Jeep 18%, Tank 7%, Light Harvester 6%, Sonic Tank 5%, Light Medic 2%, Attack Helicopter 1%, Blast Cannon 1%, Spotter Drone 1% |
| Tank and Heavy Cannon | 66% | Scout Bike 27%, Heavy Cannon 22%, Anti-Aircraft Jeep 16%, Light Medic 12%, Tank 12%, Light Harvester 5%, Sonic Tank 3%, Attack Helicopter 2%, Blast Cannon 1%, Spotter Drone 1%, Artillery 1% |
| Heavy Cannon and Tank | 70% | Scout Bike 24%, Heavy Cannon 23%, Light Medic 17%, Anti-Aircraft Jeep 15%, Tank 9%, Sonic Tank 4%, Light Harvester 4%, Attack Helicopter 2%, Blast Cannon 1%, Artillery 0%, Spotter Drone 0% |

## Genes of the best personality

```json
{
  "mix": {
    "tank": 0.95,
    "heavyCannon": 0.99,
    "artillery": 0,
    "blastCannon": 0.46,
    "sonicTank": 0.77,
    "scoutBike": 0.79,
    "spotterDrone": 0.42,
    "attackHelicopter": 0.57,
    "fighter": 0.12,
    "antiAircraftJeep": 0.13,
    "lightMedic": 0.62
  },
  "harvestersEarly": 1,
  "harvestersMax": 1,
  "antiAirPerEnemyAir": 1.12,
  "factoryLifeValue": 335.84,
  "killBonusShare": 0,
  "returnFireCaution": 1.42,
  "homeDefenceRadius": 2,
  "standOff": 2,
  "harvesterDangerRadius": 3,
  "dangerPenalty": 4.19,
  "scoutWatchDistance": 3,
  "armySizeForMedic": 3,
  "patience": 1
}
```
