# Counters

Produced by `node tools/matchups.mjs --games 4`. For each enemy unit and each unit that can attack, 4 staged battles: each side gets 200 crystals' worth (at most 10 units), no factory, and the hand-tuned AI fights until one side is wiped out or 30 rounds pass. Score: the share of its value the answering side kept, less the share the enemy kept (+1 a clean win, -1 a clean loss). The AI reads the full table from `counters.js`.

| Enemy unit | Best answers (score) | Worst answer (score) |
|---|---|---|
| Scout Bike | Tank (1), Heavy Cannon (1), Heavy Tank (1) | Infantry (-0.43) |
| Tank | Heavy Cannon (0.92), Attack Helicopter (0.92), Turret (0.85) | Scout Bike (-1) |
| Heavy Cannon | Attack Helicopter (0.92), Turret (0.6), Heavy Cannon (0.17) | Scout Bike (-1) |
| Artillery | Attack Helicopter (1), Heavy Cannon (0.83), Artillery (0.63) | Scout Bike (-0.81) |
| Light Harvester | Scout Bike (1), Attack Helicopter (1), Tank (0.94) | Twin Turret (0) |
| Spotter Drone | Infantry (1), Sonic Tank (1), Anti-Aircraft Jeep (0.95) | Scout Bike (0) |
| Infantry | Tank (1), Heavy Cannon (1), Turret (1) | Fighter (-1) |
| Transporter | Attack Helicopter (1), Tank (0.96), Scout Bike (0.92) | Turret (0) |
| Chinook | Infantry (0.88), Scout Bike (0), Tank (0) | Scout Bike (0) |
| Turret | Attack Helicopter (1), Turret (0), Twin Turret (0) | Tank (-1) |
| Heavy Tank | Heavy Cannon (1), Turret (1), Attack Helicopter (1) | Infantry (-1) |
| Twin Turret | Attack Helicopter (1), Tank (0.92), Heavy Cannon (0.25) | Infantry (-1) |
| Blast Cannon | Attack Helicopter (1), Heavy Cannon (0.83), Tank (0.42) | Scout Bike (-0.83) |
| Sonic Tank | Heavy Cannon (1), Heavy Tank (1), Tank (0.92) | Scout Bike (-0.93) |
| Anti-Aircraft Jeep | Heavy Tank (1), Tank (0.93), Infantry (0.93) | Attack Helicopter (-0.68) |
| Attack Helicopter | Fighter (0.88), Anti-Aircraft Jeep (0.79), Attack Helicopter (0) | Artillery (-1) |
| Fighter | Infantry (1), Scout Bike (0), Tank (0) | Attack Helicopter (-1) |
| Light Medic | Scout Bike (1), Tank (1), Attack Helicopter (1) | Turret (0) |
