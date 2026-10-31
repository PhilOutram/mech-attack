# Counters

Produced by `node tools/matchups.mjs --games 4`. For each enemy unit and each unit that can attack, 4 staged battles: each side gets 200 crystals' worth (at most 10 units), no factory, and the hand-tuned AI fights until one side is wiped out or 30 rounds pass. Score: the share of its value the answering side kept, less the share the enemy kept (+1 a clean win, -1 a clean loss). The AI reads the full table from `counters.js`.

| Enemy unit | Best answers (score) | Worst answer (score) |
|---|---|---|
| Scout Bike | Tank (1), Heavy Cannon (1), Blast Cannon (1) | Infantry (-0.43) |
| Tank | Heavy Cannon (0.92), Attack Helicopter (0.92), Turret (0.85) | Scout Bike (-1) |
| Heavy Cannon | Attack Helicopter (0.92), Turret (0.6), Heavy Cannon (0.17) | Scout Bike (-1) |
| Artillery | Attack Helicopter (1), Twin Tank (0.92), Heavy Cannon (0.83) | Scout Bike (-0.81) |
| Light Harvester | Scout Bike (1), Twin Tank (1), Attack Helicopter (1) | Twin Turret (0) |
| Spotter Drone | Sonic Tank (1), Infantry (0.97), Anti-Aircraft Jeep (0.95) | Scout Bike (0) |
| Infantry | Tank (1), Heavy Cannon (1), Twin Tank (1) | Fighter (-0.96) |
| Transporter | Attack Helicopter (1), Tank (0.96), Scout Bike (0.92) | Turret (0) |
| Chinook | Attack Helicopter (1), Infantry (0.89), Scout Bike (0) | Scout Bike (0) |
| Turret | Attack Helicopter (1), Turret (0), Twin Turret (0) | Tank (-1) |
| Twin Tank | Heavy Cannon (1), Turret (1), Attack Helicopter (1) | Infantry (-1) |
| Twin Turret | Attack Helicopter (1), Tank (0.92), Twin Tank (0.33) | Infantry (-0.96) |
| Blast Cannon | Attack Helicopter (1), Heavy Cannon (0.83), Twin Tank (0.58) | Scout Bike (-0.83) |
| Sonic Tank | Heavy Cannon (1), Twin Tank (1), Tank (0.92) | Scout Bike (-0.93) |
| Anti-Aircraft Jeep | Twin Tank (1), Infantry (0.94), Tank (0.93) | Attack Helicopter (-0.68) |
| Attack Helicopter | Anti-Aircraft Jeep (0.79), Fighter (0.44), Attack Helicopter (-0.06) | Artillery (-1) |
| Fighter | Infantry (0.89), Scout Bike (0), Tank (0) | Attack Helicopter (-0.56) |
| Crystal Seeder | Infantry (1.01), Scout Bike (1), Tank (1) | Artillery (0) |
| Light Medic | Scout Bike (1), Tank (1), Attack Helicopter (1) | Turret (0) |
