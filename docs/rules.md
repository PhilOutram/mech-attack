# Mech Attack rules for the digital game

The rules the engine (`engine.js`) plays by. Numbers live in `rules-config.js`; this page says what they mean and which ones are settled. Anything marked **provisional** was picked to keep development moving and still needs Phil's decision.

The app uses normal alternating turns: one player moves all their units, then the other. Simultaneous moves are for the physical game and are not modelled yet.

## Settled with Phil (28 October 2026)

### Units have two lives
Each unit tile has two sides: undamaged, and damaged (with an explosion). In one turn, attacks on a unit add together:
- total attack at least the unit's defence: it loses a life (the tile is flipped)
- total attack at least twice its defence: it loses both lives and is destroyed

A damaged unit is destroyed by any attack total that reaches its defence. Totals reset at the end of each turn.

### Harvesting
A unit with storage (Light Harvester, Scout Bike) stops next to crystals and harvests them, then drives back next to its factory to unload. Crystals only count once unloaded.

In the physical game, two or more harvesters next to the same pile would split it evenly, rounded down to the nearest 5. The app takes turns, so the first player to harvest takes their share and the split never comes up. Phil also suggested harvesting by landing on the crystals instead; `crystals.harvestFrom` is set to `"adjacent"` for now.

### Driving over crystals
Units can drive onto or over crystals, and doing so destroys them (`crystals.crushedByMovement`). Of two equally short routes, a unit takes the one that spares the crystals. Crystals you cannot see are destroyed without warning. Before this rule, crystal piles blocked movement and the simulator showed spawned piles walling off the middle of the map by round 30–40.

### Crystal piles grow and explode
- Each map starts with crystal piles of 50 (`crystals.startAmount`): 4 fair pairs, one pile of each pair per side, plus one pile equally far from both factories. The old Crystals / Crystal Base / Crystal Cave deposits (180, 500, 560) are gone.
- Crystals change between goes, never during them, so neither player gets an advantage (Phil, 28 October 2026). After every turn, yours and the AI's:
  - every pile not harvested during that turn grows by 5 (`crystals.growthPerTurn`), so 10 a round;
  - a pile that reaches 80 (`crystals.explodeAt`) explodes and its crystals are lost;
  - new piles of 10 spawn on random empty hexes. How many is drawn once at the start of each round from `crystals.spawnChoices` (provisional: 0 or 1), and that same number appears after both players' turns, so each player gets the same number of new piles before their turn.
- A starting pile left alone explodes after three rounds (50, 55, ... 80). A pile's number turns red when it will explode at the end of the current turn.
- A harvest takes as much as the unit can carry.

Options for later, not built yet:
- Explosion damage to units on the hexes round the pile, counted like an attack.
- Scattering the crystals when a pile explodes: one small pile on a random neighbouring hex, or a small pile on every neighbouring hex.
- Linking the two: damage only on the hexes that crystals scatter onto.

### Winning
You win by destroying the enemy factory. A player with no units who cannot afford the cheapest unit also loses.

### Map
Fixed map 1 has 12 seven-hex clusters (84 hexes), with the factories in opposite corners 11 moves apart. The two halves have the same mountain counts and pile distances but different layouts, so exploring one side tells you nothing exact about the other. Generated maps follow the same pattern (see Maps).

### Colours
You play blue, the AI plays green. Purple, pink or dark grey may replace them later.

### Rocky ground
Hexes with dense rocks are rocky; hexes with scattered rocks are plain. Phil is drawing a new rocky tile so the two read differently.

## Provisional

| Rule | Current setting | Config |
|---|---|---|
| Headquarters | Each player starts with a factory (headquarters). It builds units on free hexes next to it, cannot move, has defence 100 and sight 4 (the Factory row of the full unit table) and two lives like any unit. Claiming unused factories on the map is a possible later addition. | `units.factory` |
| Starting position | Factory, Light Harvester, Scout Bike, Tank and 50 crystals | `start` |
| Building | Any number of units per turn, limited by crystals and free hexes next to the factory. A new unit cannot move or act until its owner's next turn. | |
| Turn order for a unit | Move once, then take one action (attack, heal, harvest, unload, set up or pack up). Acting ends the unit's turn. | |
| Return fire | A unit with a maximum range of 3 or less that is attacked from an adjacent hex hits back once at its full attack, **even if the attack destroys it** (settled with Phil, 28 October 2026: otherwise whoever starts an even fight gets a free killing shot). Artillery (minimum range 2), harvesters, medics and factories never return fire. Still provisional: the range limit of 3. | `combat.returnFireMaxRange` |
| Artillery set-up | Setting up takes the unit's action, so it fires from the next turn. Set-up artillery cannot move; packing up also takes an action and it moves again from the next turn. | `needsSetup` |
| Healing | A medic restores one life to an adjacent damaged unit whose defence is at or below the medic's healing value. A medic cannot heal itself or a factory. | `healing`, `healRange` |
| Rocky ground | Costs 2 movement and adds 5 to defence | `terrain.rocky` |
| Mountains | Cannot be entered; block line of sight | `terrain.mountain` |
| Chasms | Cannot be entered; do not block line of sight | `terrain.chasm` |
| Crystal spawns | 0 or 1 new piles of 10 after each turn (the same number after both turns of a round), on a random empty open hex at least 3 hexes from both factories | `crystals.spawnChoices`, `spawnMinDistanceFromFactory` |
| Round limit | A game reaching round 100 ends with no winner | `roundCap` |
| Carried crystals | Lost when the carrying unit is destroyed | |

## Fog of war

### Map blocks, as on the table (default: `fog.mode` = `"tiles"`)
Settled with Phil (28 October 2026): fog of war exposes a whole block at once, because on the table the only way to explore is to turn a seven-hex block over.

- All blocks start face down.
- When any unit (or a factory) is on a hex of a block or right next to one, the whole block is turned over (`fog.revealRange` 1, Phil's choice). Each side starts with about 3 blocks face up: its home block and the blocks its starting units stand next to.
- Turned-over blocks are private: a block your units turn over is face up for you only, and everything on it (units, crystals) stays visible to you from then on. You never see the blocks the opponent has turned over, or anything on them, until your own units turn them over (Phil, 28 October 2026).
- A moving unit turns over the blocks it passes next to along its route, not just where it stops.
- `fog.revealRange` `null` turns blocks over anywhere within a unit's sight range instead; that leaves 11 of the 12 blocks face up after round 1.

### Line of sight (`fog.mode` = `"sight"`, kept for comparison)
- You see only hexes within sight range of your units, with a clear line of sight.
- Explored hexes keep their terrain; crystals out of sight show as last seen; enemy units show only while in sight; the enemy factory stays marked once seen.
- Units can fire at any enemy one of your units can see (spotting). Unexplored hexes between attacker and target do not block the shot.
- Moves are planned on what you know. A hidden enemy unit in the way stops the move on the last free hex before it.

## Maps

- Fixed map 1, or a generated map. "Map 17" is always the same map: the number is the seed.
- Generated maps use the same 12 block positions as fixed map 1, with the factories in opposite corners. Opposite blocks get the same number of mountains in different places; the cracked chasm sits in one of the two middle blocks, and the other gets a single-hex chasm and a mountain.
- Every map must pass `mapProblems` in `maps.js`: every open hex reachable, at least 4 free hexes round each factory, each pair of starting piles the same path distance from its own and the enemy factory, and the middle pile the same distance from both. Layouts that fail are redrawn.
- The simulator shows these checks are not enough on their own (see `docs/simulation.md`).

## Open questions

- Factory claiming: start with a headquarters factory (current), or start near unused factories and claim one?
- Should the damaged side of a tile change a unit's stats? Currently it does not.
- Is the "firing" token art with the muzzle flash the same as the damaged side of the physical tile?
