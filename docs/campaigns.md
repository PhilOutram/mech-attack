# Campaigns and strategies

What each campaign mission sets up, which units it leans on and which strategy it is built round, followed by every strategy we can think of for Mech Attack and where (if anywhere) a mission already asks for it. Written 31 October 2026 (v0.76). Mission details live in `campaign.js` (solo) and `coop-campaign.js` (co-op); all figures are provisional.

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

## Co-op campaign: Red Dust: Together (5 missions)

All humans play at the same time against one or two AI sides. AI sides are scaled to the humans they face. The plan agreed on 31 October 2026 replaces this with separate campaigns for 2, 3 and 4 players.

| # | Mission | Players | AI sides | Set-up | Objective | Strategy |
|---|---|---|---|---|---|---|
| 1 | Two Fronts | 2 | 1 (Major), extra Tank and 2 Infantry; builds Tanks, Infantry, Scout Bikes | Usual starts | Hold every home factory for 12 rounds | Defend several fronts; send help where it is needed (Comms) |
| 2 | Supply Run | 2 | 1 (Major) | Only Blue has an Airfield and a Chinook; the others start with two harvesters and double crystals | Bank 150 crystals per player between you | Role split: one player ferries, the others farm |
| 3 | Pincer | 3 | 1 (Major), extra Heavy Cannon (boss) and Turret, Heavy works | Usual starts | Destroy the Heavy Cannon; overrun the AI's home factory | Attack one base from several sides at once |
| 4 | Last Stand | 2 | 2 (Major), each with an extra Tank and Infantry | Usual starts | Hold every home factory for 15 rounds | Defend against two converging armies |
| 5 | Kharon Rising | 3 | 2 (Field Marshal), each with Heavy Cannon, 2 Turrets, Heavy works | Usual starts | Overrun both AI home factories | Two sieges at once |

## Strategies, and where the campaigns use them

| Strategy | How it works in Mech Attack | Built into |
|---|---|---|
| Rush with no economy | Start with an army (or crystals) but no harvesting, against an AI that starts small but can build up: win before its economy turns | Not built. The Maid's March has no factory, but it is an escort, not a race |
| Survive the early rush | Weather a big early attack with turrets and strong defenders, then build your army | Hold the Line; co-op Two Fronts and Last Stand |
| Ground against air | Anti-Aircraft Jeeps, Fighters, Infantry and Sonic Tanks (the units that hit air) against helicopters | Sky Hunters |
| Air against ground | You have the air power and the AI is all ground: helicopters pick off units that cannot hit back | Not built |
| Airlift and flanking | Chinook and Transporter move units past terrain or behind lines | Over the Mountains (Chinook), Storm the Works (Transporter) |
| Choke point for the Sonic Tank | Funnel enemies into a straight line so one boom hits them all | The Pass |
| Artillery over mountains with a spotter | Artillery fires over mountains at anything its side can see; Spotter Drones give the sight, and need Fighters or AA Jeeps to keep them alive | Not built. A snaking pass through mountains, with Artillery and drones on the far side, would be the mission |
| Splash against a swarm | Blast Cannon cluster bombs and Sonic Tank lines punish units bunched together | Swarm |
| Fortified siege | Artillery outranges Turrets; Heavy units soak the return fire | The Crystal War; co-op Pincer and Kharon Rising |
| Turtling with turrets | Turrets and Twin Turrets hold ground cheaply but cannot move | Hold the Line |
| Capture race | Infantry overrun unused factories for their crystals and a second base | Storm the Works |
| Escort | Keep a weak, vital unit alive across the map (medics, screens) | The Maid's March |
| Economy race and tech timing | Harvest versus build versus upgrade; the Crystal lab pays back over time | Supply Lines; co-op Supply Run |
| Crystal denial | Blow up crystal piles (or let them reach 80 and explode) so the enemy cannot harvest; raid loaded harvesters | Not built as an objective |
| Harvester raiding | A full harvester carries up to 90 crystals, lost if it is destroyed: fast units hunt them | Not built as an objective |
| Concentrated fire | Hits add up within a turn, so several units together can take down a unit none could alone; Twin Tanks and Twin Turrets fire twice | Every combat mission, but none teaches it directly |
| Boss hunting | Find and destroy one key enemy unit | Most solo missions from 3 on |
| Scouting and ambush | Fog hides units out of sight; Spotter Drones see far; units can fire blind into the dark | Not built as a focus |
| Firing across chasms | Chasms cannot be crossed but do not block sight, so ranged units can fire over them unanswered | Not built |
| Defending on rocky ground | Rocky ground costs double to cross but adds 5 defence | Not built as a focus |
| Out-ranging return fire | Units fire back only when the attacker is next to them, so range-2+ units can strike without reply | Implicit everywhere; not taught |
| Repair and sustain | Light Medics repair damaged units between fights | The Maid's March (one medic); not a focus |
| Multiple fronts (co-op) | Split the team to defend or attack in several places | Co-op Two Fronts, Last Stand, Kharon Rising |
| Role specialisation (co-op) | Players start with different kits or upgrades and need each other | Co-op Supply Run (Airfield for one player only) |
| Shared sight (co-op) | Comms lets allies see what each other sees | Co-op Two Fronts (suggested in the story) |

Ideas for strategies that need new rules (from the plan for the 2-, 3- and 4-player campaigns): giving crystals to an ally, riding an ally's transport, turret overwatch (a free shot at anything coming into range), event cards with a forecast (an electrical storm that stops ranged fire), objectives that must be met in the same round, and ruins revealed by exploring.
