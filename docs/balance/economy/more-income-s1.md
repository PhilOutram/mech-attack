# Evolved AI personalities

Produced by `node evolve.js --generations 20 --population 16 --games 8 --seed 1 --set start.crystals=100 --set crystals.spawnChoices=[1] --set crystals.spawnAmount=20`. Each generation every personality plays games against others on fixed map 1 and generated maps; the best quarter survive and the rest are mixed and mutated copies of them. Games over 60 rounds count as draws.

## Progress

| Generation | Best win rate | Mean win rate | Best personality favours |
|---|---|---|---|
| 1 | 97% | 50% | Tank 15%, Light Medic 13%, Fighter 13% |
| 2 | 69% | 50% | Sonic Tank 16%, Scout Bike 15%, Tank 12% |
| 3 | 83% | 50% | Anti-Aircraft Jeep 17%, Sonic Tank 15%, Tank 11% |
| 4 | 81% | 50% | Tank 21%, Light Medic 21%, Heavy Cannon 16% |
| 5 | 88% | 49% | Tank 21%, Light Medic 21%, Heavy Cannon 16% |
| 6 | 86% | 50% | Tank 22%, Light Medic 22%, Heavy Cannon 17% |
| 7 | 72% | 51% | Tank 24%, Light Medic 24%, Heavy Cannon 19% |
| 8 | 65% | 49% | Tank 22%, Light Medic 22%, Heavy Cannon 17% |
| 9 | 71% | 51% | Tank 19%, Light Medic 19%, Heavy Cannon 15% |
| 10 | 78% | 49% | Light Medic 22%, Tank 19%, Heavy Cannon 17% |
| 11 | 77% | 50% | Light Medic 20%, Heavy Cannon 18%, Tank 16% |
| 12 | 74% | 50% | Light Medic 20%, Heavy Cannon 18%, Tank 16% |
| 13 | 75% | 50% | Light Medic 20%, Heavy Cannon 17%, Tank 13% |
| 14 | 71% | 51% | Heavy Cannon 18%, Light Medic 18%, Tank 13% |
| 15 | 85% | 50% | Heavy Cannon 18%, Light Medic 18%, Attack Helicopter 14% |
| 16 | 85% | 50% | Heavy Cannon 18%, Light Medic 18%, Attack Helicopter 14% |
| 17 | 64% | 48% | Heavy Cannon 18%, Light Medic 18%, Attack Helicopter 14% |
| 18 | 69% | 49% | Heavy Cannon 18%, Light Medic 18%, Attack Helicopter 16% |
| 19 | 68% | 49% | Heavy Cannon 18%, Light Medic 18%, Attack Helicopter 14% |
| 20 | 93% | 52% | Heavy Cannon 19%, Light Medic 19%, Attack Helicopter 15% |

## The best personalities against the hand-tuned AI

60 games each, seats and maps mixed.

| Personality | Wins against the default AI | Units it built (share) | Upgrades and captures per game |
|---|---|---|---|
| Heavy Cannon and Light Medic | 81% | Scout Bike 42%, Tank 20%, Light Medic 16%, Artillery 14%, Anti-Aircraft Jeep 8%, Light Harvester 0% | captures 0.0 |
| Heavy Cannon and Light Medic | 88% | Scout Bike 37%, Tank 20%, Light Medic 18%, Artillery 16%, Anti-Aircraft Jeep 8%, Light Harvester 0% | captures 0.0 |
| Heavy Cannon and Light Medic | 86% | Scout Bike 38%, Tank 21%, Light Medic 17%, Artillery 17%, Anti-Aircraft Jeep 7% | captures 0.0 |

## Genes of the best personality

```json
{
  "mix": {
    "tank": 0.67,
    "heavyCannon": 1,
    "artillery": 0.25,
    "blastCannon": 0.09,
    "sonicTank": 0.36,
    "scoutBike": 0.32,
    "spotterDrone": 0.12,
    "attackHelicopter": 0.78,
    "fighter": 0.63,
    "antiAircraftJeep": 0,
    "lightMedic": 1
  },
  "harvestersEarly": 1,
  "harvestersMax": 1,
  "antiAirPerEnemyAir": 1.83,
  "factoryLifeValue": 50,
  "killBonusShare": 0.67,
  "returnFireCaution": 1.45,
  "homeDefenceRadius": 2,
  "standOff": 2,
  "harvesterDangerRadius": 2,
  "dangerPenalty": 3.83,
  "scoutWatchDistance": 3,
  "armySizeForMedic": 6,
  "patience": 0.18,
  "captureFactories": 0,
  "transportInfantry": 0
}
```
