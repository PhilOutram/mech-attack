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
Units can drive onto or over crystals, and doing so destroys them (`crystals.crushedByMovement`). A unit takes a route that keeps off crystals whenever one fits within its move, even a longer one (Phil, 28 October 2026). Hexes it can only reach by driving over crystals show with a yellow dashed outline, and the game asks before such a move. Only crystals you can see count: a face-down hex shows yellow only when the route to it crosses a pile you can see (Phil, 29 October 2026). Crystals you cannot see are destroyed without warning. Before this rule, crystal piles blocked movement and the simulator showed spawned piles walling off the middle of the map by round 30–40.

### Crystal piles grow and explode
- Each map starts with crystal piles of 50 (`crystals.startAmount`): 4 fair pairs, one pile of each pair per side, plus one pile equally far from both factories. The old Crystals / Crystal Base / Crystal Cave deposits (180, 500, 560) are gone.
- Crystals change between goes, never during them, so neither player gets an advantage (Phil, 28 October 2026). After every turn, yours and the AI's:
  - every pile not harvested during that turn grows by 5 (`crystals.growthPerTurn`), so 10 a round;
  - a pile stops growing at 80 (`crystals.explodeAt`) and stays there for one more turn by each player (`crystals.holdTurns` 2; Phil, 29 October 2026), then explodes and its crystals are lost;
  - new piles of 10 spawn on random empty hexes. How many is drawn once at the start of each round from `crystals.spawnChoices` (provisional: 0 or 1), and that same number appears after both players' turns, so each player gets the same number of new piles before their turn.
- A starting pile left alone reaches 80 after three rounds (50, 55, ... 80) and explodes a round later. A pile's number turns amber at 80 and red when it will explode at the end of the current turn.
- A harvest takes as much as the unit can carry.

Options for later, not built yet:
- Explosion damage to units on the hexes round the pile, counted like an attack.
- Scattering the crystals when a pile explodes: one small pile on a random neighbouring hex, or a small pile on every neighbouring hex.
- Linking the two: damage only on the hexes that crystals scatter onto.

### Ground and air
Settled with Phil, 28 October 2026: the rules are the same for every unit, and units differ by their stats. The one extra rule:
- A unit is ground or air. Air units fly: every hex costs 1, they pass over mountains, chasms, other units and crystals (without crushing them), can stop on any hex without another unit, and get no cover from rocky ground.
- Every attack hits ground units, air units, or both (the Sonic Tank and Infantry). An air unit can only be hit by an attack that hits air. Return fire follows the same rule.
- Infantry hit air as well as ground (Phil, 29 October 2026), so a cheap unit can answer the Attack Helicopter. The Scout Bike did this from 28 October and went back to ground only: it was doing too many jobs.

### Spotter Drone
Cost 15 (was 30), move 5, defence 5, no attack, sight 5. An air unit, so only the Anti-Aircraft Jeep, the Fighter, the Sonic Tank and Infantry can hit it. Like the other air units it needs an Airfield (provisional). It turns over the blocks next to it, like every unit, but can split its move: move, look, and move again until its 5 move points are used.

### Units added on 28 October 2026
Stats start from the full unit table, with costs scaled to the Game 2 prices. The numbers are provisional; the abilities were confirmed by Phil.

| Unit | Ground or air | Hits | Cost | Move | Defence | Attack | Range | Ability |
|---|---|---|---|---|---|---|---|---|
| Blast Cannon | ground | ground | 65 | 3 | 10 | 40 | 2–4 | Cluster bomb: enemy units next to the target take half the attack. Fires every other turn. |
| Sonic Tank | ground | ground and air | 60 | 4 | 20 | 15 | 1–5 | Sonic boom: hits every enemy on one of the six straight lines up to range 5. |
| Anti-Aircraft Jeep | ground | air | 30 | 5 | 15 | 30 | 1–3 | |
| Attack Helicopter | air | ground | 45 | 5 | 10 | 20 | 1–2 | |
| Fighter | air | air | 60 | 7 | 15 | 30 | 1–4 | |

Provisional details: the cluster bomb hits only enemy units; a mountain stops a sonic boom; only the unit aimed at fires back.

### Cheaper unused units (Phil, 29 October 2026)
The evolved AI never bought most units, so their costs were cut by about a quarter: Spotter Drone 30 → 15 (Phil's figure), Transporter 50 → 35, Anti-Aircraft Jeep 40 → 30, Artillery 70 → 50, Heavy Cannon 110 → 80, Blast Cannon 90 → 65, Sonic Tank 80 → 60, Attack Helicopter 60 → 45, Fighter 80 → 60. Provisional; the tables on this page show the new costs.

### Factory upgrades
Settled with Phil, 28 October 2026: a factory starts out building light ground units only. Two upgrades, bought separately for each factory:

| Upgrade | Cost (provisional) | Unlocks |
|---|---|---|
| Heavy works | 60 (was 100; Phil, 29 October 2026) | Heavy Cannon, Blast Cannon, Sonic Tank |
| Airfield | 60 (was 100; Phil, 29 October 2026) | Attack Helicopter, Fighter, Spotter Drone, Chinook (provisional) |
| Crystal lab | 60 | Makes 10 crystals at the end of each of its owner's turns (Phil, 29 October 2026; cost and income provisional) |
| Comms | 30 | Multiplayer only: two allies who both have Comms in one of their factories see everything either of them sees (Phil, 29 October 2026) |

A unit's `needs` stat names the upgrade it needs (`factoryUpgrades` in the config). Buying an upgrade is not a unit's action and can happen any time in your turn. A factory shows each upgrade as a badge on its tile: a helipad (Airfield), a gear (Heavy works) and a crystal dome (Crystal lab); placeholders until Phil's art is ready (`docs/art-brief-factory-upgrades.md`). The crystal count shows what Crystal labs add each turn.

### Factories are overrun, not destroyed
Settled with Phil, 28 and 29 October 2026: bigger maps have unused factories, and only Infantry can capture ("overrun") a factory. Troops are weak and vulnerable and need looking after; a Transporter or Chinook can carry them, for more money.

- Factories cannot be fired on (`combat.factoriesTakeFire` false; Phil, 29 October 2026: "you can't destroy a base, you can only overrun it").
- Infantry overrun a factory by moving into it. The troops are used up, and the factory becomes theirs, with its upgrades. It builds and takes unloaded crystals like a home factory.
- Infantry must start their turn next to a factory to break in (`capture.mustStartNextTo`; Phil, 29 October 2026). The turn they spend outside is the defender's chance to pick them off, and a Transporter cannot drop them straight in.
- A player's home factory can be overrun too (`capture.homeFactories`), and that wins the game.
- An unused factory holds 25 crystals in its store (`capture.unusedFactoryCrystals`, provisional), paid to whoever captures it first. Captured factories no longer pay crystals every turn (Phil, 29 October 2026): a Crystal lab does that instead.
- A captured factory can be captured back the same way.
- Infantry board their own Transporter by moving onto it. The Transporter drops its passengers one at a time onto a free hex next to it. A dropped unit has finished for the turn; the Transporter can still move if it has not. Passengers are lost if the Transporter is destroyed.

### Chinook and Turret (Phil, 29 October 2026)
- The Chinook is a flying transporter. It carries 2 places of passengers: Infantry take 1, any ground vehicle 2 (unit stat `size`), so one vehicle or two Infantry. The Transporter carries Infantry only (`loads`). Like the other air units it needs an Airfield.
- The Turret is a gun emplacement, built next to a factory like any unit, that never moves.

| Unit | Cost | Move | Defence | Attack | Range | Sight | Ability |
|---|---|---|---|---|---|---|---|
| Infantry | 20 | 3 | 5 | 10 | 1 | 2 | Overruns factories; rides in a Transporter or Chinook; hits ground and air |
| Transporter | 35 | 6 | 25 | – | – | 3 | Carries 2 Infantry |
| Chinook | 55 | 5 | 15 | – | – | 3 | Flies; carries 1 vehicle or 2 Infantry |
| Turret | 50 | 0 | 35 | 25 | 1–3 | 3 | Never moves |

All the numbers are provisional, as is everything not listed as Phil's. The Turret's stats are scaled down from the "Turret (constructed)" row of the full unit table, and the Chinook's come from its "Transport" row.

### Moving into face-down ground
A move that turns over new blocks stops there if the rest of its route runs onto ground that was face down when you planned it (`fog.stopOnReveal`; Phil, 29 October 2026). The unit keeps the move points it has not used, so you can see what is there and then carry on, fire, or stop. So you can tap a face-down hex far away and the unit goes as far as the edge first.

### Firing blind
A unit can fire into any hex in range that its player cannot see (Phil, 29 October 2026). An enemy there is hit as normal; an empty hex wastes the shot. You are told whether you hit something, not what. A unit fired on blind does not fire back. The AI does not fire blind.

### Difficulty levels
Games against the AI are played at a rank (Phil, 29 October 2026), each with its own opponent (`difficulty.js`). Provisional:

| Rank | Level | Opponent | AI | Start |
|---|---|---|---|---|
| Cadet | Beginner | Sergeant Brack | hand-tuned | You get 30 extra crystals; Green does not get the second player's 30 |
| Major | Intermediate | Colonel Rane | an evolved personality | The usual start |
| Field Marshal | Master | General Kaldra | the strongest evolved personality | Green gets 60 extra crystals and an extra Tank |

All the numbers are provisional, as is everything not listed as Phil's.

### Winning
You win by overrunning the enemy's home factory with Infantry. A player with no units who cannot afford the cheapest unit also loses. Phil: whether losing your home factory loses the game while you still hold a captured one depends on the win condition or the scenario, so it is a setting (`winCondition`):
- `"homeFactory"` (default): you lose when your home factory is overrun (or destroyed, if factories take fire).
- `"allFactories"`: you lose only when you have no factory left.

A player who starts with no factory at all (a campaign mission) does not lose for having none.

Option for testing, off: `capture.guarded` (a factory with one of its owner's units next to it cannot be captured).

### Map
Fixed map 1 has 12 seven-hex clusters (84 hexes), with the factories in opposite corners 11 moves apart. The two halves have the same mountain counts and pile distances but different layouts, so exploring one side tells you nothing exact about the other. Generated maps follow the same pattern (see Maps).

### Colours
In a single-player game you play blue and the AI plays green. Multiplayer games add yellow, purple and pink (provisional; red would be lost on the red ground, and grey looks like an unused factory).

### Multiplayer
Settled with Phil, 29 October 2026; the plan and what is still open are in `docs/multiplayer.md`.
- Take turns: 2 to 4 sides, each a human or the AI, on one device passed round (a hand-over screen hides the board between players) or one device each. Teams are chosen before the game; allies cannot fire on or overrun each other.
- Same time (co-op): 2 to 4 humans, one device each, on one team against the AI. All the humans play at once, then the AI takes its turn. When two moves clash, whichever reaches the host first happens and the other is refused.
- A player who loses while others play on is knocked out: their units go, their factories become unused with their crystals in store (shared between them; provisional: with no factory left, the crystals go to whoever overran their home), and their turns are skipped. The game ends when one team is left.
- Players who move later than the first get extra crystals: the second-player bonus shared out by how late their turn comes (provisional).
- Comms (see Factory upgrades) is the only way to see an ally's ground and units.
- Undo is only for games on one device; Demand surrender is not offered in multiplayer (provisional).

### Rocky ground
Hexes with dense rocks are rocky; hexes with scattered rocks are plain. Phil is drawing a new rocky tile so the two read differently.

## Provisional

| Rule | Current setting | Config |
|---|---|---|
| Factories | Each player starts with a home factory. A factory builds units on free hexes next to it, cannot move, has defence 100 and sight 4 (the Factory row of the full unit table) and two lives like any unit. | `units.factory` |
| Starting position | Factory, Light Harvester, Scout Bike, Tank and 50 crystals. Whoever moves second gets 30 more (Phil: 40 on 28 October 2026, cut to 30 on 29 October when the first player was winning only 35% of evolved-AI games), to make up for the first player's first shot in round 2. | `start` |
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

## Campaign: Red Dust

Eleven missions (Phil, 29 October 2026), defined in `campaign.js`. Each is built round a unit or tactic the player has to use. Each sets its map (and may reshape its terrain), both sides' starting units, crystals and factory upgrades (`setup` in `newGame`), any rule changes, how the AI plays, and its objective. Finishing a mission unlocks the next; progress is saved on the device.

Most missions give Green a boss: a heavy unit leading its army that the player must destroy as well as meet the objective (Phil, 29 October 2026). Across the campaign Green starts with every kind of unit, so the player meets them all. In a mission won by overrunning Green's home factory, the overrun still ends the game whether or not the boss is down.

| # | Mission | Map | Teaches | Green's boss | Objective |
|---|---|---|---|---|---|
| 1 | Landfall | Map 3 (classic) | Infantry, Scout Bike, harvesting | – | Capture the factory, build a Scout Bike, harvest and build a Tank |
| 2 | Supply Lines | Map 8 (classic) | Harvesting, the Crystal lab | – | Bank 200 crystals |
| 3 | First Contact | Map 5 (3-4-4-3) | Overrunning a factory | Artillery | Overrun Green's home factory |
| 4 | Hold the Line | Map 14 (3-5-5-3) | Turrets | Heavy Cannon | Hold your home factory for 12 rounds |
| 5 | Over the Mountains | Map 11 (3-5-5-3), home ringed by mountains | Chinook airlift and Attack Helicopters (both sides have an Airfield); Anti-Aircraft Jeeps | Blast Cannon | Overrun Green's home factory |
| 6 | Storm the Works | Map 12 (4-5-5-4) | Transporter, capturing factories | Sonic Tank | Capture 3 factories |
| 7 | Swarm | Map 6 (3-4-4-3) | Blast Cannon against a Scout Bike swarm | Heavy Cannon | Destroy 8 Scout Bikes |
| 8 | Sky Hunters | Map 9 (4-5-5-4), Green starts with an Airfield and helicopters | Anti-aircraft | Fighter | Shoot down 5 Attack Helicopters |
| 9 | The Pass | Map 7 (4-5-5-4), a ridge with one pass | Sonic Tank at a choke point | Blast Cannon | Destroy 5 Tanks |
| 10 | The Maid's March | Map 10 (5-6-6-5) | Escort: no factory, a VIP (Commander Jeanne) | – | Bring the VIP into the far factory; the mission fails if she falls |
| 11 | The Crystal War | Map 21 (4-5-6-5-4) | Everything; Artillery against Turrets | Heavy Cannon | Overrun Green's home factory, ringed by Turrets |

Units and upgrades come in a few at a time (`allowedUnits`, `allowedUpgrades` in the mission's rules; both sides alike), and a mission can fit factory upgrades at the start (`setup.upgrades`). A mission can also change what the AI builds (`aiMix`), for the Scout Bike swarm, the helicopters and the tank column. Missions 1 to 10 play the hand-tuned AI; mission 11 plays an evolved personality. A home factory that starts unclaimed belongs to nobody until its player's infantry capture it. All figures are provisional.

## Fog of war

### Map blocks, as on the table (default: `fog.mode` = `"tiles"`)
Settled with Phil (28 October 2026): fog of war exposes a whole block at once, because on the table the only way to explore is to turn a seven-hex block over.

- All blocks start face down.
- When any unit (or a factory) is on a hex of a block or right next to one, the whole block is turned over (`fog.revealRange` 1, Phil's choice). Each side starts with about 3 blocks face up: its home block and the blocks its starting units stand next to.
- Turned-over blocks are private: a block your units turn over is face up for you only, and everything on it (units, crystals) stays visible to you from then on. You never see the blocks the opponent has turned over, or anything on them, until your own units turn them over (Phil, 28 October 2026).
- A moving unit turns over the blocks it passes next to along its route, not just where it stops, and stops where new ground turns over (see Moving into face-down ground).
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

- With home factories open to Infantry, most simulated games now end with an overrun. Is that the game Phil wants, or should the home factory be harder to break into (for example `capture.guarded`)?
- Should the damaged side of a tile change a unit's stats? Currently it does not.
- Is the "firing" token art with the muzzle flash the same as the damaged side of the physical tile?
