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

### Deposits
The unit table's figures for deposits are crystals per harvest × number of harvests:

| Deposit | Total | Per harvest | Harvests |
|---|---|---|---|
| Crystals | 180 | 30 | 6 |
| Crystal Base | 500 | 50 | 10 |
| Crystal Cave | 560 | 70 | 8 |

Deposits never grow. Spawned crystals appear at 10 and grow by 10 at the end of each round in which they are not harvested; a harvest from a spawned pile takes as much as the unit can carry.

### Winning
You win by destroying the enemy factory. A player with no units who cannot afford the cheapest unit also loses.

### Map
Fixed map 1 has 12 seven-hex clusters (84 hexes), with the factories in opposite corners 11 moves apart. The two halves have the same mountain counts and deposit distances but different layouts, so exploring one side tells you nothing exact about the other. Random maps come later, with the same fairness checks.

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
| Return fire | A unit with a maximum range of 3 or less that is attacked from an adjacent hex and survives hits back once at its full attack. Artillery (minimum range 2), harvesters, medics and factories never return fire. | `combat.returnFireMaxRange` |
| Artillery set-up | Setting up takes the unit's action, so it fires from the next turn. Set-up artillery cannot move; packing up also takes an action and it moves again from the next turn. | `needsSetup` |
| Healing | A medic restores one life to an adjacent damaged unit whose defence is at or below the medic's healing value. A medic cannot heal itself or a factory. | `healing`, `healRange` |
| Rocky ground | Costs 2 movement and adds 5 to defence | `terrain.rocky` |
| Mountains | Cannot be entered; block line of sight | `terrain.mountain` |
| Chasms | Cannot be entered; do not block line of sight | `terrain.chasm` |
| Crystal spawns | One new pile of 10 per round, on a random empty open hex at least 3 hexes from both factories | `crystals.spawnPerRound`, `spawnMinDistanceFromFactory` |
| Pile cap | None | `crystals.maxPile` |
| Round limit | A game reaching round 100 ends with no winner | `roundCap` |
| Carried crystals | Lost when the carrying unit is destroyed | |

## Fog of war

- You see every hex within sight range of one of your units (or your factory) that has a clear line of sight. Mountains block sight.
- Explored hexes show their terrain from then on; unexplored hexes are blank.
- Crystals out of sight show as you last saw them.
- Enemy units show only while in sight. The enemy factory stays marked once you have seen it, because it cannot move.
- **Provisional:** units can fire at any enemy that one of your units can see (spotting), which lets artillery use its full range. Unexplored hexes between attacker and target do not block the shot.
- Moves are planned on what you know. If a hidden enemy unit or hidden crystals are in the way, the unit stops on the last free hex before them.

## Open questions

- Factory claiming: start with a headquarters factory (current), or start near unused factories and claim one?
- Should the damaged side of a tile change a unit's stats? Currently it does not.
- Is the "firing" token art with the muzzle flash the same as the damaged side of the physical tile?
