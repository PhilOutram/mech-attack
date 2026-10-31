# Unit and rule use

Produced by `node tools/unit-use.mjs --games 300` on v0.81, with the personalities evolved on the v0.80 rules (`docs/evolution.md`). The evolved AIs play each other on fixed map 1 and generated maps. It measures what the AI uses, so a unit the AI plays badly looks weaker than it is.

300 games, 5 personalities, 299 decided

Destroyed per crystal: enemy value it finished off, over the value of all of it fielded (starting units included).

| Unit | Built per game | Sides that build it | Destroyed per crystal spent | Built by winner : loser |
|---|---|---|---|---|
| Light Harvester | 3.18 | 100% | 0.00 | 299 : 299 |
| Infantry | 2.53 | 37% | 0.15 | 201 : 21 |
| Scout Bike | 2.24 | 61% | 0.53 | 195 : 172 |
| Artillery | 1.16 | 54% | 1.05 | 242 : 80 |
| Heavy Cannon | 0.56 | 28% | 1.17 | 159 : 7 |
| Spotter Drone | 0.42 | 21% | 0.00 | 113 : 11 |
| Tank | 0.09 | 4% | 1.46 | 6 : 18 |
| Attack Helicopter | 0.06 | 3% | 0.57 | 14 : 2 |
| Twin Tank | 0.05 | 2% | 0.16 | 14 : 0 |
| Light Medic | 0.05 | 3% | 0.00 | 15 : 0 |
| Blast Cannon | 0.01 | 0% | 0.00 | 2 : 0 |
| Sonic Tank | 0.00 | 0% | 1.17 | 1 : 0 |
| Transporter | 0.00 | 0% | - | 0 : 0 |
| Chinook | 0.00 | 0% | - | 0 : 0 |
| Turret | 0.00 | 0% | - | 0 : 0 |
| Twin Turret | 0.00 | 0% | - | 0 : 0 |
| Anti-Aircraft Jeep | 0.00 | 0% | - | 0 : 0 |
| Fighter | 0.00 | 0% | - | 0 : 0 |
| Crystal Seeder | 0.00 | 0% | - | 0 : 0 |

| Rule | Per game |
|---|---|
| factory captured | 0.41 |
| lab crystals | 124.80 |
| pile blasted | 2.22 |
| pile crushed | 1.38 |
| pile exploded | 1.10 |
| repair | 0.03 |
| ruin searched (crystals) | 0.12 |
| ruin searched (enemy) | 0.05 |
| ruin searched (nothing) | 0.00 |
| ruin searched (unit) | 0.09 |
| set up | 1.69 |
| upgrade: Airfield | 0.52 |
| upgrade: Crystal lab | 1.47 |
| upgrade: Heavy works | 1.03 |
