# Unit trials

Produced by `node tools/unit-trials.mjs --games 40 --seed 1`. For each unit, one side plays the strongest evolved personality changed to build that unit above all else (Infantry: keep three; Transporter and Chinook: carry infantry in it); the other side plays the same personality unchanged. Maps of every shape; games over 60 rounds are draws.

A win rate well above 50% means leaning on the unit beats the evolved mix; well below means it is a poor unit to lean on (it may still be useful in small numbers). Kills count shots by that unit type that finished off an enemy unit.

| Unit | Cost | Win rate (decided) | Built per game | Kills per unit built | Lost per unit built |
|---|---|---|---|---|---|
| Tank | 70 | 60% (40/40) | 1.0 | 5.2 | 0.9 |
| Scout Bike | 30 | 59% (39/40) | 4.2 | 0.6 | 0.8 |
| Sonic Tank | 60 | 51% (37/40) | 1.1 | 0.8 | 0.2 |
| Light Medic | 40 | 47% (36/40) | 1.1 | 0.0 | 0.1 |
| Spotter Drone | 15 | 46% (37/40) | 3.2 | 0.0 | 0.3 |
| Infantry | 20 | 45% (40/40) | 4.0 | 0.1 | 0.4 |
| Anti-Aircraft Jeep | 30 | 45% (38/40) | 2.8 | 0.2 | 0.2 |
| Turret | 50 | 44% (39/40) | 1.4 | 1.5 | 0.2 |
| Artillery | 50 | 43% (40/40) | 1.5 | 1.0 | 0.2 |
| Fighter | 60 | 43% (40/40) | 1.1 | 0.3 | 0.1 |
| Heavy Cannon | 80 | 42% (38/40) | 1.0 | 3.2 | 0.3 |
| Chinook | 55 | 42% (38/40) | 0.8 | 0.0 | 0.5 |
| Attack Helicopter | 45 | 31% (39/40) | 2.0 | 1.5 | 0.6 |
| Blast Cannon | 65 | 25% (40/40) | 0.5 | 1.0 | 0.3 |
| Transporter | 35 | 18% (39/40) | 0.5 | 0.0 | 0.6 |
