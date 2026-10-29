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
Units can drive onto or over crystals, and doing so destroys them (`crystals.crushedByMovement`). A unit takes a route that keeps off crystals whenever one fits within its move, even a longer one (Phil, 28 October 2026). Hexes it can only reach by driving over crystals show with a yellow dashed outline. Crystals you cannot see are destroyed without warning. Before this rule, crystal piles blocked movement and the simulator showed spawned piles walling off the middle of the map by round 30–40.

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

### Ground and air
Settled with Phil, 28 October 2026: the rules are the same for every unit, and units differ by their stats. The one extra rule:
- A unit is ground or air. Air units fly: every hex costs 1, they pass over mountains, chasms, other units and crystals (without crushing them), can stop on any hex without another unit, and get no cover from rocky ground.
- Every attack hits ground units, air units, or both (the Sonic Tank and the Scout Bike). An air unit can only be hit by an attack that hits air. Return fire follows the same rule.
- The Scout Bike hits air as well as ground (Phil, 28 October 2026), so a cheap unit can answer the Attack Helicopter.

### Spotter Drone
Cost 30, move 5, defence 5, no attack, sight 5. An air unit, so only the Anti-Aircraft Jeep, the Fighter, the Sonic Tank and the Scout Bike can hit it. Like the other air units it needs an Airfield (provisional). It turns over the blocks next to it, like every unit, but can split its move: move, look, and move again until its 5 move points are used.

### Units added on 28 October 2026
Stats start from the full unit table, with costs scaled to the Game 2 prices. The numbers are provisional; the abilities were confirmed by Phil.

| Unit | Ground or air | Hits | Cost | Move | Defence | Attack | Range | Ability |
|---|---|---|---|---|---|---|---|---|
| Blast Cannon | ground | ground | 90 | 3 | 10 | 40 | 2–4 | Cluster bomb: enemy units next to the target take half the attack. Fires every other turn. |
| Sonic Tank | ground | ground and air | 80 | 4 | 20 | 15 | 1–5 | Sonic boom: hits every enemy on one of the six straight lines up to range 5. |
| Anti-Aircraft Jeep | ground | air | 40 | 5 | 15 | 30 | 1–3 | |
| Attack Helicopter | air | ground | 60 | 5 | 10 | 20 | 1–2 | |
| Fighter | air | air | 80 | 7 | 15 | 30 | 1–4 | |

Provisional details: the cluster bomb hits only enemy units; a mountain stops a sonic boom; only the unit aimed at fires back.

### Factory upgrades
Settled with Phil, 28 October 2026: a factory starts out building light ground units only. Two upgrades, bought separately for each factory:

| Upgrade | Cost (provisional) | Unlocks |
|---|---|---|
| Heavy works | 100 | Heavy Cannon, Blast Cannon, Sonic Tank |
| Airfield | 100 | Attack Helicopter, Fighter, Spotter Drone (provisional) |

A unit's `needs` stat names the upgrade it needs (`factoryUpgrades` in the config). Buying an upgrade is not a unit's action and can happen any time in your turn. The factory shows H and A for its upgrades.

### Unused factories, Infantry and the Transporter
Settled with Phil, 28 October 2026: bigger maps have unused factories, and only Infantry can capture them. Troops are weak and vulnerable and need looking after; a Transporter can carry them, for more money.

- An unused factory belongs to nobody. It cannot be attacked.
- Infantry capture a factory by moving into it. The troops are used up, and the factory becomes theirs, with its damage and upgrades. It builds and takes unloaded crystals like a home factory.
- A captured factory can be captured back the same way.
- Infantry board their own Transporter by moving onto it. The Transporter drops its passengers one at a time onto a free hex next to it, or straight into a factory next to it to capture it. A dropped unit has finished for the turn; the Transporter can still move if it has not. Passengers are lost if the Transporter is destroyed.

| Unit | Cost | Move | Defence | Attack | Range | Sight | Ability |
|---|---|---|---|---|---|---|---|
| Infantry | 20 | 3 | 5 | 10 | 1 | 2 | Captures factories; rides in a Transporter |
| Transporter | 50 | 6 | 25 | – | – | 3 | Carries 2 Infantry |

All the numbers are provisional, as is everything not listed as Phil's.

### Winning
You win by destroying the enemy's home factory. A player with no units who cannot afford the cheapest unit also loses. Phil: whether losing your home factory loses the game while you still hold a captured one depends on the win condition or the scenario, so it is a setting (`winCondition`):
- `"homeFactory"` (default): you lose when your home factory is destroyed or captured.
- `"allFactories"`: you lose only when you have no factory left.

Home factories cannot be captured for now (`capture.homeFactories`, provisional).

Options for testing, all off: `capture.guarded` (a factory with one of its owner's units next to it cannot be captured), `capture.mustStartNextTo` (infantry capture only from a hex they started their turn on) and `capture.incomePerTurn` (crystals each captured factory pays its owner every turn). See the balance experiments in `docs/simulation.md`.

### Map
Fixed map 1 has 12 seven-hex clusters (84 hexes), with the factories in opposite corners 11 moves apart. The two halves have the same mountain counts and pile distances but different layouts, so exploring one side tells you nothing exact about the other. Generated maps follow the same pattern (see Maps).

### Colours
You play blue, the AI plays green. Purple, pink or dark grey may replace them later.

### Rocky ground
Hexes with dense rocks are rocky; hexes with scattered rocks are plain. Phil is drawing a new rocky tile so the two read differently.

## Provisional

| Rule | Current setting | Config |
|---|---|---|
| Factories | Each player starts with a home factory. A factory builds units on free hexes next to it, cannot move, has defence 100 and sight 4 (the Factory row of the full unit table) and two lives like any unit. | `units.factory` |
| Starting position | Factory, Light Harvester, Scout Bike, Tank and 50 crystals. Whoever moves second gets 40 more (settled with Phil, 28 October 2026), to make up for the first player's first shot in round 2. | `start` |
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
- Sizes and shapes (Phil, 28 October 2026): Classic, the 12 block positions of fixed map 1, or rows of blocks from top to bottom.
  - Small: Classic (12 blocks), 3-4-4-3 (14)
  - Medium: 3-5-5-3 (16), 4-5-5-4 (18)
  - Large: 5-6-6-5 (22), 4-5-6-5-4 (24)
- "Map 17 (3-4-4-3)" has the id `map-17-3-4-4-3`. The picker's "Any" shape picks one of the chosen size.
- Start positions vary (Phil, 28 October 2026): the two home blocks are a pair of opposite blocks, chosen per map from the pairs at least 75% as far apart as the widest pair (`HOME_SPREAD_SHARE` in `maps.js`), either way round. So blue may start in any corner or edge, not just the bottom left.
- Bigger shapes get an extra pair of crystal piles for every 2 blocks over 12, where they fit, and unused factories: one pair on 3-4-4-3 and 3-5-5-3, two pairs on the others. One factory of each pair is nearer each side (at least 4 moves from home, at most half way), and the two mirror each other's distances, like the piles. Piles may sit next to an unused factory.
- Classic maps follow the same pattern as fixed map 1, with the factories in opposite corners. Opposite blocks get the same number of mountains in different places; the cracked chasm sits in one of the two middle blocks, and the other gets a single-hex chasm and a mountain.
- Every map must pass `mapProblems` in `maps.js`: every open hex reachable, at least 4 free hexes round each factory (unused ones too), each pair of starting piles and of unused factories the same path distance from its own and the enemy factory, and the middle pile the same distance from both. Layouts that fail are redrawn.
- The simulator shows these checks are not enough on their own (see `docs/simulation.md`).

## Quitting, surrender and undo

- **Demand surrender** (once per game; Phil, 28 October 2026): the AI plays the game on from the current position 20 times (`surrenderPlayouts`) with slightly varied personalities, seeing the whole board, and surrenders if it wins less than 20% of them (`surrenderBelow`). An unfinished playout counts by its share of what both sides own. Otherwise it says how it rates its chances.
- **Quit** ends the game as a loss for the player who quits (the engine's `resign` action, never chosen by the AI). It counts as a loss on that map.
- **Undo** (game screen only): take back your last action this turn; press again to go further back. 5 undos per game (`undosPerGame`). Ending the turn closes the turn's actions off. Anything an undone action revealed stays revealed: you cannot un-see a block you have turned over. Crystals the undone move drove over come back.

## Open questions

- The unit table's Transport (A3) is an air unit. Should the Transporter fly? It is a ground unit for now; flying would be one stat (`air: true`), and it would then need an Airfield.
- Capturing is instant and cheap, so in the simulator factories change hands a lot (about 4 captures a game on 3-4-4-3). Should capturing take longer, for example infantry must start their turn next to the factory, or a factory with a unit next to it cannot be captured?
- Should the damaged side of a tile change a unit's stats? Currently it does not.
- Is the "firing" token art with the muzzle flash the same as the damaged side of the physical tile?
