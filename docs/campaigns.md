# Campaigns and strategies

What each campaign mission sets up, which units it leans on and which strategy it is built round, followed by every strategy we can think of for Mech Attack and where (if anywhere) a mission already asks for it. Written 31 October 2026 (v0.76). Mission details live in `campaign.js` (solo) and `team-campaign-2.js`, `-3.js` and `-4.js` (team); all figures are provisional.

## Solo campaign: Red Dust (11 missions)

You are Blue; the AI is Green. "Starts with" lists units, crystals and factory upgrades.

| # | Mission | Map | You start with | Green starts with | Objective | Leans on | Strategy |
|---|---|---|---|---|---|---|---|
| 1 | Landfall | Map 3 (classic) | 1 Infantry two hexes from an unclaimed home factory, 75 crystals | Nothing (no units) | Take the factory, build a Scout Bike, harvest, build a Tank | Infantry, Scout Bike, Light Harvester | Tutorial: capture and economy basics |
| 2 | Supply Lines | Map 8 (classic) | Harvester, Scout Bike, 60 | Harvester, Scout Bike, 50 | Bank 200 crystals | Light Harvester, Crystal lab, Crystal Seeder | Economy race; the Crystal lab as an investment |
| 3 | First Contact | Map 5 (3-4-4-3) | Harvester, Scout Bike, 2 Tanks, 2 Infantry, 80 | **Artillery (boss)**, Harvester, Scout Bike, Tank, Light Medic, 60 | Destroy the Artillery; overrun Green's home factory | Infantry with a Tank escort; the Light Medic is new here | Assault: get Infantry to a factory alive |
| 4 | Hold the Line | Map 14 (3-5-5-3) | Harvester, Tank, 2 Sonic Tanks, Twin Turret, 120 | **Sonic Tank (boss)**, Harvester, 2 Tanks, 2 Scout Bikes, 2 Infantry, Transporter, 120; builds Tanks, Scout Bikes, Infantry | Hold your home factory for 12 rounds; destroy the Sonic Tank | Turret, Twin Turret, Sonic Tank | Survive the early rush, then build |
| 5 | Over the Mountains | Map 11 (3-5-5-3); your home ringed by mountains | Harvester, Tank, Infantry, Chinook, 150, Airfield | **Blast Cannon (boss)**, Harvester, Scout Bike, Tank, Infantry, Spotter Drone, AA Jeep, 100, Airfield | Destroy the Blast Cannon; overrun Green's home factory | Chinook, Attack Helicopter, AA Jeep | Airlift out of a sealed base; air against anti-air |
| 6 | Storm the Works | Map 12 (4-5-5-4) with unused factories | Harvester, Tank, 2 Infantry, Transporter, 100 | **Heavy Cannon (boss)**, Harvester, Scout Bike, Tank, Infantry, Transporter, 80 | Capture 3 factories; destroy the Heavy Cannon | Transporter, Infantry | Capture race for neutral factories |
| 7 | Swarm | Map 6 (3-4-4-3) | Harvester, Blast Cannon, Tank, 100, Heavy works | **Heavy Cannon (boss)**, Harvester, 5 Scout Bikes, 150; builds only Scout Bikes | Destroy 8 Scout Bikes; destroy the Heavy Cannon | Blast Cannon (splash), Twin Tank | Splash against a swarm of cheap units |
| 8 | Sky Hunters | Map 9 (4-5-5-4) | Harvester, AA Jeep, Tank, Infantry, 120 | **Fighter (boss)**, Harvester, Tank, 3 Attack Helicopters, Spotter Drone, 150, Airfield; builds mostly helicopters | Shoot down 5 Attack Helicopters; destroy the Fighter | AA Jeep, Fighter, Infantry | Ground against air |
| 9 | The Pass | Map 7 (4-5-5-4); a ridge with one pass | Harvester, Sonic Tank, Tank, 120, Heavy works | **Blast Cannon (boss)**, Harvester, 3 Tanks, 150; builds only Tanks | Destroy 5 Tanks; destroy the Blast Cannon | Sonic Tank | Choke point: line the boom up with the pass |
| 10 | The Maid's March | Map 10 (5-6-6-5) | Commander Jeanne (VIP), 2 Tanks, Scout Bike, Light Medic; no factory, no crystals | Harvester, 2 Tanks, 2 Scout Bikes, AA Jeep, Attack Helicopter, 150 | Get Jeanne into the far factory; fails if she falls | Light Medic, Tanks as escort | Escort with no economy |
| 11 | The Crystal War | Map 21 (4-5-6-5-4) | Harvester, Scout Bike, 2 Tanks, Artillery, 2 Infantry, 200 | **Heavy Cannon (boss)**, 2 Harvesters, Scout Bike, Tank, Twin Tank, Infantry, Turret, Twin Turret, Artillery, Chinook, Fighter, 200, Lab + Heavy works + Airfield; evolved AI | Overrun Green's home factory, ringed by Turrets | Artillery, everything | Siege of a fortified base |

## Team campaigns (Phil, 1 November 2026)

One campaign each for 2, 3 and 4 players, ten missions each, all players at the same time on one team against Kharon's factions. They replace the co-op campaign "Red Dust: Together". Learning the game is the solo campaign's job; these are about playing together, harder as they go, with missions built to need particular units, AI sides that change sides, and a story with twists. Each human has their own home, crystals and factory; the humans move together, then every AI side. A mission ends when its objective is met or it fails, not when one team is left (`rules.scriptedEnd`).

Code: the missions are in `team-campaign-2.js`, `team-campaign-3.js` and `team-campaign-4.js`, the framework (plans, the per-action script and objective check, progress) in `team-campaigns.js`, and the building blocks (factions, map reshaping, checks, script changes) in `team-scenario.js`. `node tools/team-trials.mjs` plays them AI against AI. All figures are provisional.

### The factions

| Faction | Leader | Character | Builds mostly |
|---|---|---|---|
| The Consortium | General Kaldra | The army that lost the Crystal War. Fights by the book, keeps her word and never forgives a broken one. Enemy, then ally of necessity, then honest rival. | Tanks, Artillery, Infantry, Heavy Cannons |
| The Varr Syndicate | Director Ilse Varr | Crystal brokers: generous, charming and always paid in the end. Stakes you, moves in beside you, sells you out. | Infantry, Transporters, Turrets, Twin Tanks |
| The Ashborn | Mother Sable | Descendants of the lost first colony, living in its ruins. Raiders who trust nobody, until you protect them. | Scout Bikes, Infantry, Blast Cannons, Sonic Tanks |
| Corran's Ashborn | Corran, Sable's son | Wants the first colony brought back whatever it costs. Sells his people to the Lattice, then learns what Echo wants. | Scout Bikes, Infantry, Sonic Tanks, AA Jeeps |
| The Lattice | Echo | The first colony's mining machines, buried for a century and awake again. Wakes old factories, tunnels into bases, rules the air. | Attack Helicopters, Fighters, Spotter Drones, Heavy Cannons, Twin Turrets |

### 2 players: The Varr Contract

| # | Mission | Other sides | Objective | Leans on | Twist |
|---|---|---|---|---|---|
| 1 | Dry Landing | Varr (ally), Kaldra | Destroy 8 Consortium units and have a Tank each at the same time; keep your homes | Harvesting under raids; Infantry against Scout Bikes | You land with no crystals; Varr's convoy pays 15 each a round while her factory stands |
| 2 | Two Beacons | Varr (ally), Kaldra | Overrun both beacons in the same round | Infantry and Transporters; Artillery against Turret overwatch | A beacon taken alone brings two Tanks to the other |
| 3 | Guests | Varr (ally), Kaldra | Overrun both of Varr's forward posts; keep your homes | Twin Tanks and Twin Turrets against Infantry inside your base | Varr turns at round 6, with a Turret and Infantry already beside each of your factories |
| 4 | Sable's Valley | Ashborn (at war with everyone), Varr | Overrun Varr's home; the Ashborn home must not fall, to Varr or to you | Restraint: defending a side that fires on you | Sable joins you at round 7 if her home still stands |
| 5 | High Road | Ashborn (ally), Varr | Destroy Varr's two Heavy Cannons and every Syndicate Turret | Role kits: Skywing (Blue), Foundry (Green). Artillery with Spotter Drones over a mountain wall; helicopters, which Turrets cannot hit | The only pass is under Varr's guns |
| 6 | Kaldra's Word | Kaldra (ally, besieged), Varr | Overrun both siege camps in the same round; Kaldra's garrison must hold | A relief force timed to strike together | The old enemy asks for help |
| 7 | What Sleeps Below | Kaldra (ally), Lattice | Hold 3 of the 4 old factories at the start of round 11 | Infantry spread fast; AA against helicopters | Old factories wake for the Lattice at rounds 3, 5, 7 and 9 unless you hold them |
| 8 | The Director's Last Deal | Varr (ally), Kaldra (ally), Lattice | Overrun the Lattice's home, then Varr's in the same round | Infantry waiting beside an ally's factory | Varr runs the moment the Lattice's factory falls |
| 9 | The Long Night | Kaldra (ally), Ashborn (ally), Lattice | Hold your homes and Kaldra's until round 15 | Turret overwatch, Twin Turrets, AA Jeeps | Lattice waves every 3 rounds; Ashborn Sonic Tanks arrive at round 8 |
| 10 | The Heart of Kharon | Kaldra (ally), Ashborn (ally), Lattice | Overrun three relays, then the Lattice's home in a crater ringed by mountains | Everything | Echo's last words |

### 3 players: Ashfall

| # | Mission | Other sides | Objective | Leans on | Twist |
|---|---|---|---|---|---|
| 1 | Strangers in the Ruins | Ashborn | Search 5 ruins between you; keep your homes | Infantry and Scout Bikes exploring under raids | A terminal in the ruins wakes: "ECHO ONLINE" |
| 2 | Water Rights | Ashborn (ally), Kaldra | Destroy 10 Consortium units; the Ashborn home stands at round 12 | Defending an ally's Crystal Seeders | Sable shares 30 crystals each at round 6 |
| 3 | Three Gates | Kaldra | Overrun all three gates in the same round | One gate each; Artillery against Turret overwatch | Gates left untaken when a round starts fill with Tanks |
| 4 | Redwater | Ashborn (ally), Kaldra, Varr | Keep Redwater and your homes until round 12 | Role kits: Vanguard, Bastion, Skywing. An empty factory beside Redwater for whoever takes it | Varr sells Kaldra Transporters full of Infantry |
| 5 | Corran's Choice | Sable (ally), Corran (ally), Lattice | Overrun Corran's three posts; keep your homes | Twin Tanks against posts inside your bases | Corran turns at round 5 and joins the Lattice |
| 6 | Sable's March | Corran, Lattice | Get Mother Sable (Blue's VIP) into the archive's factory | Escort; Light Medic; clearing the way | Blue has no factory |
| 7 | The Broker | Kaldra (ally), Varr (at war with everyone), Corran | Destroy 3 Syndicate Crystal Seeders; bank 300 crystals between you | Crystal denial, harvester raids, economy | Kaldra offers a truce |
| 8 | Sky Burial | Kaldra (ally), Lattice | Shoot down 12 Lattice aircraft; keep your homes | Role kits: Skywing, Bastion, Foundry. Fighters and AA Jeeps | Two helicopters arrive every 3 rounds |
| 9 | Embers | Corran, Lattice, Ashborn (ally) | Overrun both Lattice relays | Restraint again: leave Corran's camp standing | Echo turns on Corran at round 4; he joins you at round 6 if his camp stands |
| 10 | Ashfall | Sable (ally), Corran (ally), Lattice | Take three relays in the same round to open the crater wall, then the Lattice's home | Everything; a Chinook can drop Infantry over the wall | Mother and son ride together |

### 4 players: The Kharon Accord

| # | Mission | Other sides | Objective | Leans on | Twist |
|---|---|---|---|---|---|
| 1 | Four Corners | Kaldra | Destroy 12 Consortium units; hold every home until round 10 | Comms; sending help between colonies | Four fronts at once |
| 2 | The Lamplighters | Ashborn | Overrun all four relays in the same round | Timing: one relay each | Relays held when a round starts without the rest go dark again |
| 3 | Division of Labour | Kaldra | Overrun Kaldra's home, in a crater with two ways in | Role kits: all four. Artillery outranging Turret overwatch | None of you can do it alone |
| 4 | Gifts | Varr (ally), Lattice | Hold all four gift factories, and your homes, once the truth comes out | Twin Tanks and Turrets at home | At round 6 every gift factory goes over to the Lattice, and Varr with it |
| 5 | Ghost Signal | Kaldra (ally), Lattice | Overrun four hidden drone nests | Scouting: Spotter Drones, Scout Bikes; AA | Find them first |
| 6 | The Crossing | Lattice | Overrun two Lattice foundries beyond a mountain wall | Chinook airlift (you each start with an Airfield) | Only aircraft cross the wall, both ways |
| 7 | Kaldra's Price | Kaldra (ally), Lattice | Destroy Kaldra's two Heavy Cannons; hold your homes until round 14 | Repositioning before the truce ends | Kaldra warns at round 3 and ends the truce at round 5, to your face |
| 8 | Breach | Lattice, Ashborn (ally) | Destroy 20 Lattice units; hold your homes until round 14 | Twin Turrets, Twin Tanks and overwatch at home | Lattice units tunnel up inside a base every other round; the Ashborn arrive at round 7 |
| 9 | The Overseer's Code | Kaldra (ally), Lattice | Keep Kaldra's home standing; overrun the Lattice's citadel | Defending an ally | The Consortium's war computer runs on Echo's code: at round 4 Kaldra's units near her factory defect to the Lattice |
| 10 | Echo | Kaldra (ally), Lattice | Take four relays in the same round to open the crater, then the Lattice's home | Everything | "I only ever did what I was built for." |

### New rules the team campaigns brought in

- **Turret overwatch** (`docs/rules.md`).
- **Role kits** (`rules.roleKits`): Vanguard, Bastion, Skywing and Foundry, each limiting what its player can build and buy.
- **Objectives met in the same round** (`sameRound` steps, and factories remembering the round they were taken).
- **Scripted changes** between actions (engine.js, Scenario changes): a side changing team, units or crystals arriving, units and factories changing hands, terrain opening.
- **Six sides in one game:** missions with six sides use orange, added in v0.84 alongside white.

### How the missions play AI against AI

`node tools/team-trials.mjs --games 5` (v0.84), the hand-tuned AI on the human seats. The AI does not know the objectives: it cannot plan a strike in the same round, wait by an ally's factory or leave a camp standing on purpose, so a mission it never wins is not shown to be too hard for people. The trials catch broken missions (an ally collapsing in two rounds, a mission won before it starts) and show which fights are lopsided.

Won, lost and stalled (reached the 40-round limit) out of 5 games (4 for the 4-player campaign, 6 for The Long Night), with the average length in rounds. "Needs a plan" marks missions the AI cannot win without knowing the objective.

| Campaign | # | Mission | Won | Lost | Stalled | Rounds | Note |
|---|---|---|---|---|---|---|---|
| The Varr Contract | 1 | Dry Landing | 5 | 0 | 0 | 11.4 | Opening mission |
| | 2 | Two Beacons | 0 | 0 | 5 | 41.0 | Needs a plan (same round) |
| | 3 | Guests | 1 | 2 | 2 | 31.8 | After giving you a Twin Tank |
| | 4 | Sable's Valley | 2 | 3 | 0 | 13.8 | |
| | 5 | High Road | 0 | 2 | 3 | 32.6 | Role kits; the AI does not use the pass well |
| | 6 | Kaldra's Word | 1 | 3 | 1 | 23.6 | Needs a plan (same round); Kaldra once fell in 2 rounds, now fixed |
| | 7 | What Sleeps Below | 0 | 5 | 0 | 11.0 | The AI does not race for the old factories |
| | 8 | The Director's Last Deal | 0 | 5 | 0 | 21.6 | Needs a plan (Infantry waiting by Varr's factory) |
| | 9 | The Long Night | 2 | 4 | 0 | 13.0 | Waves tuned from 5 wins to none and back to 2 of 6 |
| | 10 | The Heart of Kharon | 0 | 0 | 5 | 41.0 | Finale; the AI does not break the crater |
| Ashfall | 1 | Strangers in the Ruins | 3 | 0 | 2 | 21.4 | |
| | 2 | Water Rights | 5 | 0 | 0 | 13.0 | The Ashborn got a Crystal lab after collapsing in 5 rounds |
| | 3 | Three Gates | 0 | 0 | 5 | 41.0 | Needs a plan (same round) |
| | 4 | Redwater | 4 | 1 | 0 | 12.2 | Kaldra strengthened after 5 wins of 5 |
| | 5 | Corran's Choice | 3 | 2 | 0 | 20.8 | Corran's posts reinforced when he turns |
| | 6 | Sable's March | 4 | 1 | 0 | 9.0 | |
| | 7 | The Broker | 3 | 0 | 2 | 31.2 | |
| | 8 | Sky Burial | 2 | 3 | 0 | 22.2 | Role kits |
| | 9 | Embers | 0 | 2 | 3 | 37.8 | Needs a plan (leave Corran's camp standing) |
| | 10 | Ashfall | 0 | 0 | 5 | 41.0 | Needs a plan (same round) |
| The Kharon Accord | 1 | Four Corners | 4 | 0 | 0 | 17.8 | Opening mission |
| | 2 | The Lamplighters | 0 | 0 | 4 | 41.0 | Needs a plan (same round) |
| | 3 | Division of Labour | 0 | 0 | 4 | 41.0 | Role kits: the AI cannot capture without the Vanguard leading |
| | 4 | Gifts | 0 | 3 | 1 | 30.0 | |
| | 5 | Ghost Signal | 1 | 0 | 3 | 40.0 | The AI rarely finds the nests |
| | 6 | The Crossing | 0 | 0 | 4 | 41.0 | Needs a plan (Chinook airlift) |
| | 7 | Kaldra's Price | 2 | 0 | 2 | 35.5 | |
| | 8 | Breach | 1 | 4 | 0 | 12.2 | Tunnelling parties enlarged after 4 wins of 4 |
| | 9 | The Overseer's Code | 3 | 0 | 1 | 35.5 | |
| | 10 | Echo | 0 | 0 | 4 | 41.0 | Needs a plan (same round) |

## Strategies, and where the campaigns use them

| Strategy | How it works in Mech Attack | Built into |
|---|---|---|
| Rush with no economy | Start with an army (or crystals) but no harvesting, against an AI that starts small but can build up: win before its economy turns | Dry Landing starts you with no crystals, staked by an ally; a true rush is not built |
| Survive the early rush | Weather a big early attack with turrets and strong defenders, then build your army | Hold the Line; Four Corners, The Long Night, Breach |
| Ground against air | Anti-Aircraft Jeeps, Fighters, Infantry and Sonic Tanks (the units that hit air) against helicopters | Sky Hunters |
| Air against ground | You have the air power and the AI is all ground: helicopters pick off units that cannot hit back | High Road (Turrets cannot hit air) |
| Airlift and flanking | Chinook and Transporter move units past terrain or behind lines | Over the Mountains (Chinook), Storm the Works (Transporter); The Crossing (Chinook only) |
| Choke point for the Sonic Tank | Funnel enemies into a straight line so one boom hits them all | The Pass |
| Artillery over mountains with a spotter | Artillery fires over mountains at anything its side can see; Spotter Drones give the sight, and need Fighters or AA Jeeps to keep them alive | High Road (a mountain wall with one pass; Foundry Artillery and Skywing Spotter Drones) |
| Splash against a swarm | Blast Cannon cluster bombs and Sonic Tank lines punish units bunched together | Swarm |
| Fortified siege | Artillery outranges Turrets; Heavy units soak the return fire | The Crystal War; Division of Labour, The Heart of Kharon, Ashfall, Echo |
| Turtling with turrets | Turrets and Twin Turrets hold ground cheaply but cannot move | Hold the Line; The Long Night and Breach, where overwatch helps |
| Capture race | Infantry overrun unused factories for their crystals and a second base | Storm the Works; What Sleeps Below |
| Escort | Keep a weak, vital unit alive across the map (medics, screens) | The Maid's March; Sable's March |
| Economy race and tech timing | Harvest versus build versus upgrade; the Crystal lab pays back over time | Supply Lines; Dry Landing, The Broker |
| Crystal denial | Blow up crystal piles (or let them reach 80 and explode) so the enemy cannot harvest; raid loaded harvesters | The Broker (destroy Crystal Seeders) |
| Harvester raiding | A full harvester carries up to 90 crystals, lost if it is destroyed: fast units hunt them | Dry Landing and The Broker, not as an objective |
| Concentrated fire | Hits add up within a turn, so several units together can take down a unit none could alone; Twin Tanks and Twin Turrets fire twice | Every combat mission, but none teaches it directly |
| Boss hunting | Find and destroy one key enemy unit | Most solo missions from 3 on |
| Scouting and ambush | Fog hides units out of sight; Spotter Drones see far; units can fire blind into the dark | Ghost Signal |
| Firing across chasms | Chasms cannot be crossed but do not block sight, so ranged units can fire over them unanswered | Not built |
| Defending on rocky ground | Rocky ground costs double to cross but adds 5 defence | Not built as a focus |
| Out-ranging return fire | Units fire back only when the attacker is next to them, so range-2+ units can strike without reply | Implicit everywhere; not taught |
| Repair and sustain | Light Medics repair damaged units between fights | The Maid's March (one medic); not a focus |
| Multiple fronts (co-op) | Split the team to defend or attack in several places | Four Corners, The Long Night, Breach, Guests |
| Role specialisation (co-op) | Players start with different kits or upgrades and need each other | Role kits: High Road, Redwater, Sky Burial, Division of Labour |
| Shared sight (co-op) | Comms lets allies see what each other sees | Four Corners (suggested in the story) |
| Strikes in the same round (team) | Several targets must fall in one round, so players plan and move together | Two Beacons, Kaldra's Word, Three Gates, The Lamplighters, The Director's Last Deal, Ashfall, Echo |
| The enemy within (team) | An ally already inside your base turns on you: units next to your factories that must be cleared at once | Guests, Corran's Choice, Gifts, Breach, The Overseer's Code |
| Protecting a third party (team) | Keep another side's home standing, even one that fires on you | Sable's Valley, Water Rights, Redwater, Kaldra's Word, The Overseer's Code |
| Getting past overwatch (team) | Turrets fire at anything moving into range: Artillery outranges them, aircraft pass over them, and a cheap unit can draw the shot first | Two Beacons, Three Gates, Division of Labour |

Ideas for strategies that need new rules, from the plan for the team campaigns: giving crystals to an ally (built in v0.79), turret overwatch, role kits and objectives met in the same round (built in v0.84), ruins revealed by exploring (built), riding an ally's transport (on the backlog, `docs/open-issues.md`) and event cards with a forecast (on hold).
