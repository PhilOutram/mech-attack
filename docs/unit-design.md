# Unit design: counters and terrain

Draft, 28 October 2026. Not built yet; for Phil to decide.

## The problem

The Game 2 units scale in a straight line. Per crystal, the Tank and the Heavy Cannon are identical (0.36 attack and 0.36 defence each); the Heavy Cannon is a bigger, slower Tank. Nothing counters anything, so the only real choice is how much to spend, and games end when one side runs out of units: in 1,000 simulated games the factory was destroyed once.

## The idea: a loop of counters

Each fighting unit is good against one other and bad against another, so the right army depends on what the opponent builds:

**Scout Bike → Artillery → Heavy Cannon → Tank → Scout Bike**

- Scout Bikes raid: they catch Artillery and harvesters.
- Artillery breaks Heavy Cannons from a distance.
- Heavy Cannons shrug off light fire, beat Tanks and knock down factories.
- Tanks hunt Scout Bikes and are the only units quick over rocky ground.

## Proposed changes

| Unit | Role | New strength | New weakness | Terrain |
|---|---|---|---|---|
| Scout Bike | Raider | Double damage against harvesters, medics and Artillery (30: destroys a harvester or Artillery in one shot) | Cannot hurt a Heavy Cannon (its 15 is below the armour) | Wheels: rocky costs 2 |
| Tank | Line and hunter | Tracks: rocky ground costs 1, so it is the fastest unit over rough ground | Loses to a Heavy Cannon one on one | Tracks: rocky costs 1 |
| Heavy Cannon | Siege | Armour 20: any single shot below 20 does nothing. Double damage against factories (80) | Slow (move 2); Artillery does double damage to it | Too heavy for rocky ground: cannot enter it |
| Artillery | Long-range support | Double damage against Heavy Cannons (60) | Cannot hit drones; fragile (defence 10); set-up turn | Wheels: rocky costs 2 |
| Light Harvester | Economy | unchanged | Prime raiding target | Wheels: rocky costs 2 |
| Light Medic | Repair | unchanged | | Wheels: rocky costs 2 |
| Spotter Drone | Scout | unchanged (flies) | Artillery cannot hit it; anyone else can | Flies |

Costs stay as they are for now; the simulator will show whether any unit is too strong or too weak at its price.

### How the loop plays out (with the two-lives rule)

| Attacker → target | Attack | Target defence | Result |
|---|---|---|---|
| Scout Bike → Light Harvester | 15 × 2 = 30 | 15 | destroyed |
| Scout Bike → Artillery | 15 × 2 = 30 | 10 | destroyed |
| Artillery → Heavy Cannon | 30 × 2 = 60 | 40 | loses a life; with a Tank's 25 the same turn (85) it is destroyed |
| Heavy Cannon → Tank | 40 | 25 | loses a life |
| Tank → Heavy Cannon | 25 | 40 | nothing alone; counts towards a combined attack |
| Scout Bike → Heavy Cannon | 15 | 40, armour 20 | nothing, and it does not count towards a combined attack |
| Tank → Scout Bike | 25 | 10 | destroyed |
| Heavy Cannon → Factory | 40 × 2 = 80 | 100 | nothing alone; with one Tank (105) the factory loses a life |

### Terrain

Rocky ground stops being the same for everyone:
- Tracked (Tank): costs 1, and gives +5 defence as now.
- Wheeled (Scout Bike, Artillery, Light Harvester, Light Medic): costs 2, as now.
- Heavy Cannon: cannot enter.
- Flying (Spotter Drone): costs 1, no defence bonus.

Mountains and chasms stay impassable for ground units.

## How it is built

All of it is data on each unit in `rules-config.js`, so any part can be switched off or retuned without engine changes:
- `armour`: shots below this value are ignored.
- `damageVs`: attack multipliers by target type, e.g. `{ support: 2, artillery: 2 }`.
- `cannotTarget`: e.g. `["air"]`.
- `moveCosts`: per-unit terrain costs, e.g. `{ rocky: 1 }` or `{ rocky: null }`.
- Unit types for targeting: `light`, `heavy`, `air`, `support`, `factory`.

## How we test it

- The simulator: win rates by seat and colour, game length, and how games end (factory destruction should become a real way to win).
- Which units the AI builds and which units make kills. Once the learning AI exists, which units evolved AIs choose shows what is too strong or too weak.
- The game screen shows the multiplier in the shot preview (for example "×2 Flip") so the counters are visible while playing.

## Questions for Phil

1. Does the loop feel right for Mech Attack, or should some roles be different?
2. Heavy Cannon on rocky ground: forbidden, or just slow (costs 3)?
3. Should the factory be easier to destroy in other ways too, or is the Heavy Cannon's siege bonus enough?
