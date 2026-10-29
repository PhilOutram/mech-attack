# Unit trials

Produced by `node tools/unit-trials.mjs --games 40 --seed 1`. For each unit, one side plays the strongest evolved personality changed to build that unit above all else (Infantry: keep three; Transporter and Chinook: carry infantry in it); the other side plays the same personality unchanged. Maps of every shape; games over 60 rounds are draws.

A win rate well above 50% means leaning on the unit beats the evolved mix; well below means it is a poor unit to lean on (it may still be useful in small numbers). Kills count shots by that unit type that finished off an enemy unit.

| Unit | Cost | Win rate (decided) | Built per game | Kills per unit built | Lost per unit built |
|---|---|---|---|---|---|
| Tank | 70 | 46% (37/40) | 1.9 | 3.2 | 1.0 |
| Light Medic | 40 | 31% (35/40) | 1.4 | 0.0 | 0.4 |
| Heavy Cannon | 80 | 29% (35/40) | 0.9 | 8.4 | 0.3 |
| Scout Bike | 30 | 28% (39/40) | 4.7 | 0.3 | 1.0 |
| Artillery | 50 | 26% (38/40) | 2.5 | 1.7 | 0.6 |
| Infantry | 20 | 26% (38/40) | 14.1 | 0.2 | 0.8 |
| Blast Cannon | 65 | 25% (36/40) | 1.5 | 2.1 | 0.6 |
| Sonic Tank | 60 | 24% (37/40) | 1.2 | 2.2 | 0.5 |
| Transporter | 35 | 23% (35/40) | 1.7 | 0.0 | 0.8 |
| Anti-Aircraft Jeep | 30 | 23% (35/40) | 3.4 | 0.1 | 0.5 |
| Turret | 50 | 18% (34/40) | 1.6 | 5.0 | 0.4 |
| Spotter Drone | 15 | 13% (38/40) | 3.3 | 0.0 | 0.9 |
| Attack Helicopter | 45 | 10% (39/40) | 1.6 | 0.8 | 0.9 |
| Fighter | 60 | 5% (39/40) | 1.1 | 0.0 | 0.9 |
| Chinook | 55 | 3% (38/40) | 1.3 | 0.0 | 1.0 |
