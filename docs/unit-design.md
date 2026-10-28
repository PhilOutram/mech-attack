# Unit design: stat profiles, and ground or air

Second draft, 28 October 2026. Built in v0.11 with Phil's changes: the Heavy Tank is left out (too close to the Heavy Cannon); the Anti-Air Gun became the Anti-Aircraft Jeep; the Blast Cannon (cluster bomb, fires every other turn) and Sonic Tank (sonic boom, hits ground and air) were added with their abilities; the Attack Helicopter's attack is 20. The current rules are in `docs/rules.md`.

## Principles (Phil, 28 October 2026)

- The rules stay the same for every unit. No per-unit special cases such as damage bonuses or terrain exceptions.
- Units differ by their stats: some move well, some defend well, some attack well, and few are good at everything.
- One extra rule, easy to remember: a unit is either ground or air, and each attack either hits ground units or hits air units.

## The air rule

- **Air units** fly: every hex costs 1, they pass over terrain, units and crystals, and they get no cover from rocky ground. (The Spotter Drone already works this way.)
- **Every attack hits either ground or air, never both.** Most units hit ground. Anti-air units hit air only, and are useless against ground units.
- So an air unit can only be shot by an anti-air unit. Return fire follows the same rule: a unit can only fire back at an attacker it is able to hit.

That gives one clear choice for both players: build air units, and the opponent must build anti-air to answer them; build anti-air, and it does nothing against a ground army.

Change from now: at the moment any unit can shoot the Spotter Drone. Under this rule only anti-air units could.

## Stat profiles

Proposed numbers. Existing units keep their Game 2 stats; new units take their starting figures from the full unit table where it has them. The simulator will tune the costs.

| Unit | Ground or air | Hits | Cost | Move | Defence | Attack | Range | Good at | Weak at |
|---|---|---|---|---|---|---|---|---|---|
| Scout Bike | ground | ground | 30 | **6** | 10 | 15 | 1 | movement | attack, defence |
| Tank | ground | ground | 70 | 4 | 25 | 25 | 1–2 | all-round | nothing stands out |
| Heavy Cannon | ground | ground | 110 | 2 | **40** | **40** | 1–3 | attack and defence | movement, cost |
| Heavy Tank (new) | ground | ground | 80 | 3 | **50** | 15 | 1 | defence: holds ground | attack |
| Artillery | ground | ground | 70 | 2 | 10 | **30** | **2–5** | attack at range | defence, movement |
| Anti-Air Gun (new) | ground | **air** | 40 | 3 | 20 | **30** | 1–3 | stopping air units | useless against ground |
| Light Harvester | ground | – | 50 | 6 | 15 | – | – | carrying crystals (90) | fighting |
| Light Medic | ground | – | 40 | 5 | 15 | – | 1 | repair (25) | fighting |
| Spotter Drone | **air** | – | 30 | 5 | 5 | – | – | scouting, flying | fighting |
| Attack Helicopter (new) | **air** | ground | 60 | **5** | 10 | 20 | 1–2 | fast raids nothing on the ground can answer | anti-air |
| Fighter (new) | **air** | **air** | 80 | **7** | 15 | 30 | 1–3 | hunting air units | useless against ground |

How the choices fit together:
- **Ground armies** trade off movement (Scout Bike), defence (Heavy Tank), attack (Artillery) and all-round strength (Tank, and the expensive, slow Heavy Cannon).
- **Air** is a separate front. An Attack Helicopter can raid harvesters and Artillery freely until the opponent builds an Anti-Air Gun or a Fighter. Building those spends crystals that do nothing against tanks.
- **Spotter Drones** can only be stopped by anti-air too, which makes them reliable scouts at a price.

## Art needed

- Heavy Tank: "Heavy Tank 2" SVGs already exist in four colours.
- Anti-Air Gun, Attack Helicopter, Fighter: new token art.

## How it is built

- Each unit in `rules-config.js` gains `air: true` (if it flies) and `hits: "ground"` or `hits: "air"` (if it attacks).
- The engine checks one thing when offering targets and return fire: can this attack hit this target's layer?
- The game screen marks air units (for example a shadow under the token) so it is clear what can hit them.

## How we test it

- The simulator: fairness by seat and colour, game length and how games end.
- Which units the AI builds and which units make kills; later, which units the learning AI chooses.

## Questions for Phil

1. Is the unit list right, or should some be left out to start with (for example add the Anti-Air Gun and Attack Helicopter first, the Fighter later)?
2. Can an Attack Helicopter land on, or fly over, a mountain? (Proposed: yes, like the drone.)
3. Should air units be able to carry or harvest crystals? (Proposed: no.)
