# Battle Isle (1991) for comparison with Mech Attack

Research notes on Blue Byte's Battle Isle (Amiga and PC, 1991), gathered in November 2026 from
manuals, fan wikis, magazine reviews and gameplay videos. Facts carry a source tag such as [S1];
the full list is at the end. Material from the data disks and from Battle Isle 2 is labelled as
such and kept apart from the original game.

Where a value was not found, the cell is blank or marked "not found". No figure here is guessed.

## The game in brief

- Turn-based, hex-grid tactics. Developed by Blue Byte, published by Ubi Soft in 1991 for Amiga
  and MS-DOS; an Atari ST version was advertised but never released [S17].
- Story: the Drull of the planet Chromos fight Skynet Titan (TitanNet); the player is recruited
  as their strategist [S9][S8].
- 32 maps: 16 against the computer and 16 for two players, plus two bonus two-player maps
  (STORM and EUROP) unlocked by winning the last solo mission [S1][S9][S4].
- StrategyWiki says its design was heavily influenced by Nectaris on the PC Engine [S8].
- The engine was reused for Data Disk 1 (1992), Battle Isle '93 / The Moon of Chromos (1993,
  also called Data Disk 2) and History Line 1914-1918 [S8][S17].

## Units: Battle Isle (1991)

### How Battle Isle describes a unit

- The in-game info screen shows five values: fire power and attack range against land targets,
  against air targets and against sea targets; "radius of action over best terrain" (movement);
  and armour [S1][S2].
- Fire power is written as strength/range, for example 32/1 means strength 32 at range 1.
  0/0 means the unit cannot attack that kind of target [S4][S9].
- A unit is a group of up to six vehicles or troops shown as one counter [S2 glossary][S10 AF].
  Losses remove vehicles; a unit with fewer vehicles has less fire power [S9][S10].
- Sight is not a unit value in Battle Isle 1: there is no fog of war (see "Sight and fog of
  war" below).
- Cost is in energy units. Only three costs were found (StrategyWiki); the rest are listed as
  "?" there [S4]. The manual says 50 energy builds "about four" new units [S1].

### Unit table

Columns: Land, Air and Sea are strength/range. Move is the radius over best terrain. "First map"
is the solo campaign map where the unit first appears. Source for each row is StrategyWiki
[S4][S5][S6] unless a second source is shown; Tygre's Amiga Wiki [S9] covers every unit except
the W-1 Fortress and agrees with StrategyWiki except where both figures are given.

| Unit (battle name) | Type | Move | Land | Air | Sea | Armour | Cost | First map |
|---|---|---|---|---|---|---|---|---|
| R-1 Demon (Mechfusiliers) | Land, infantry | 4 | 32/1 | 0/0 | 32/1 | 25 | 7 | Conra |
| T-3 Scorpion (Arm. Vehicles) | Land, light tank | 7 | 40/1 | 0/0 | 40/1 | 45 | 10 | Conra |
| T-4 Gladiator (Tank Platoon) | Land, tank | 6 | 52/1 | 0/0 | 52/1 | 50 | 14 | Conra |
| T-7 Crusader (Battle Tanks) | Land, heavy tank | 4 | 60/1 | 15/1 | 60/1 | 65 | not found | Vesuv |
| SC-T Provider (Support Reg.) | Land, infantry transport | 7 | 15/1 | 8/1 | 15/1 | 25 | not found | Phase |
| FAV Buster (Recon Squad) | Land, fast attack | 8 | 35/2 | 12/1 | 35/2 | 25 | not found | Phase |
| HG-12 Angel (Hvy. Artillery) | Land, artillery | 4 | 45/6 [S9]; 45/1 [S4] | 0/0 | 45/6 [S9]; 45/1 [S4] | 25 | not found | Mount |
| AD-5 Blitz (Air Defence) | Land, anti-aircraft | 5 | 25/1 | 40/1 | 25/1 | 30 | not found | Fight |
| AD-9 Sphinx (Miss. Air Def.) | Land, SAM | 5 | 0/0 | 48/6 | 0/0 | 30 | not found | Fight |
| TLAV Invader (Beach Boys) | Land, amphibious transport | 7 | 40/1 | 10/1 | 40/1 | 30 | not found | Fifth |
| SC-P Merlin (Pioneers) | Land, depot builder | 5 | 0/0 | 0/0 | 0/0 | 30 | not found | Vesuv |
| XF-7 Mosquito (Fighter Wing) | Air, fighter | 10 | 0/0 | 45/1 | 0/0 | 25 | not found | Rusty |
| CAS Firebird (Air Cavalry) | Air, ground attack | 7 | 35/1 | 10/1 | 35/1 | 30 | not found | Rusty |
| XA-7 Raven (Hvy. Wing) | Air, heavy attack | 9 | 50/1 | 25/1 | 50/1 | 25 | not found | Testy |
| G-2 Giant (Trans Wing) | Air, transport | 9 | 0/0 | 0/0 | 0/0 | 20 | not found | Magic |
| CV Amazon (Convoy) | Sea, transport | 9 [S5]; 8 [S9] | 0/0 | 0/0 | 0/0 | 70 | not found | Terra |
| MB-A Buccaneer (Sea Horses) | Sea, gunboat | 7 | 15/1 [S5]; 45/1 [S9] | 45/1 [S5]; 15/1 [S9] | 45/1 [S5]; 38/1 [S9] | 70 | not found | Terra |
| TB-X Marauder (Power Boats) | Sea, attack boat | 10 | 0/0 | 15/1 | 60/3 | 60 [S5]; 65 [S9] | not found | Terra |
| Z-1 Pegasus (Carrier) | Sea, aircraft carrier | 9 | 0/0 | 50/4 | 0/0 | 90 | not found | Slave |
| U-7C Barracuda (Wolfsrudel) | Sea, submarine | 9 | 0/0 | 0/0 | 100/4 | 85 | not found | Slave |
| M-17 Brick (Blocker) | Sea, blocker | 0 | 0/0 | 0/0 | 0/0 | 80 | not found | Slave |
| W-1 Fortress (Cruiser) | Sea, cruiser | 0 as listed [S5] | 75/7 | 25/2 | 72/7 | 80 | not found | Giant |

Notes on the table:
- The HG-12 Angel is described by both sources as long-range artillery that cannot fire at an
  adjacent hex [S4][S9], so StrategyWiki's 45/1 (in the 2016 copy read here) looks like a typo
  for 45/6.
- StrategyWiki gives the W-1 Fortress speed 0, which is odd for a cruiser that "can't traverse
  shallow water" and "needs free hexes to turn" [S5]. Treat it as unconfirmed.
- The CU Amiga review counts "twenty-two different types of weapons, vehicles etc" [S10 CU]. The
  table has 22 rows.

### What each unit can carry, and special abilities

| Unit | Carries / special ability | Source |
|---|---|---|
| R-1 Demon | Only unit that can occupy (capture) buildings; crosses rough terrain; the only unit that can cross mountains | [S4][S1][S10 CU] |
| SC-T Provider | Carries infantry only; weak attack against all target types | [S4] |
| FAV Buster | Range 2 against land and sea, so targets at range 2 cannot fire back; cannot enter rough terrain | [S4] |
| HG-12 Angel | Must stand still for one movement phase before firing; cannot attack an adjacent unit, so it never returns fire | [S4][S9] |
| AD-9 Sphinx | Same set-up rule as the Angel; minimum range 2; air targets only | [S4][S9] |
| AD-5 Blitz | Crosses rough terrain | [S4] |
| TLAV Invader | Carries all other land units; crosses shallow water and rivers but not rough terrain; can act as a one-unit bridge for unloading from a Convoy | [S4][S9] |
| SC-P Merlin | Builds a depot on four flat hexes by "attacking" the empty ground; one Merlin builds half a depot per turn, two together build one in a turn; refilled by repairing it in a factory or HQ | [S1][S2][S4][S9] |
| G-2 Giant | Carries most land units; unarmed | [S6] |
| CV Amazon | Carries most land units; two hexes long, needs room to turn; cannot enter shallow water | [S5][S9] |
| MB-A Buccaneer | Can pick up a Blocker by moving over it, starting next to it; cannot carry other units | [S5][S9] |
| Z-1 Pegasus | Carries air units only; repairs itself and the aircraft aboard by one strength per phase; two hexes long | [S5] |
| U-7C Barracuda | Invisible to the opponent; self-repairing; two hexes long. It can be found when a ship is refused entry to its hex | [S5][S9] |
| M-17 Brick | Cannot move or attack; moved only by a Buccaneer | [S5] |
| W-1 Fortress | Self-repairing; two hexes long | [S5] |

Transport rules: a unit can only board a transporter that has not moved this turn, but a
transporter can unload after moving [S1][S9]. A transport plane can fire back when attacked but
cannot attack [S1].

## Game mechanics: Battle Isle (1991)

### Turn structure: one player moves while the other attacks

- Two alternating phases, movement and action. Player 1 starts in the movement phase while
  player 2 starts in the action phase; the phases swap each turn [S1][S2].
- Both players give orders at the same time on a split screen, left half for player 1 and right
  half for player 2. Each half scrolls on its own [S1][S10 AF].
- Orders are planned, not carried out at once. Nothing happens until both players ask for the
  phase change [S1][S2]. Tygre's wiki says the game then resolves the combats first, then the
  moves [S9], and the manual warns that a moving unit "may never arrive" if it is destroyed
  first [S1].
- In the action phase a player can attack, repair units in buildings and build new units in
  factories [S1][S2 glossary].
- Each unit can be given one order per phase; given units turn black on the overview map [S1].
- A unit next to an enemy cannot simply walk away (Tygre: "unit touching enemy units cannot run
  away immediately") [S9].
- Units leaving a building have a reduced move [S1].
- Battle Isle 2 changed this: each player takes a whole turn and units fire straight after
  moving [S11][S12].

### Terrain: types known, no movement cost figures found

The manual describes terrain only in words. No table of movement costs or defence modifiers
for Battle Isle 1 was found in the manual, the German manual or the fan sites.

| Terrain | Movement | Combat effect | Source |
|---|---|---|---|
| Road | Fastest for land units | Units on roads are easier targets | [S1][S2] |
| Clear, flat ground | Fast | Open ground: stronger attack, weak defence ("Be careful of streets and flat, open ground") | [S2] |
| Woods / forest | Slows most units; can be impassable for some | Units in woods are harder to hit | [S1][S10 CU] |
| Mountains | Impassable to all but the Demon infantry | The higher unit usually has the advantage | [S1][S10 CU] |
| Rough terrain | Demon and Blitz can cross; Buster and Invader cannot | not found | [S4] |
| Marsh | Slows units | not found | [S10 CU] |
| River | Invader can cross | not found | [S4] |
| Shallow water (light blue) | Invader can enter; large ships cannot | not found | [S4][S5] |
| Deep water | Light boats cannot go out to open sea (German manual) | not found | [S3] |

General rules from the manual: the heavier a unit, the shorter its move and the less likely it
can cross mountains; the game works out each unit's reach over each terrain [S1][S3]. The glossary
defines "radius of action" as the distance a unit covers over ideal terrain [S2].

### Combat: firepower, numbers, position, experience and chance

No formula was published for Battle Isle 1. What the sources say:

- The result depends on armament, fire power, range, number of vehicles left and experience
  [S9], plus terrain and height [S1].
- Each vehicle in a unit fires once per attack, so a two-tank unit facing six tanks is heavily
  outgunned [S10 AP].
- Attacks at range 2 or more cannot be answered [S4]. Adjacent attacks are answered.
- A unit can be attacked by several of the enemy in one action phase [S1][S10 CU].
- **Surrounding ("Klemmen" in the German manual).** Every extra unit around the defender that
  could also attack it raises the attacker's value. A unit directly behind the defender doubles
  the attack; units on the flanks add less. It only applies to attacks between adjacent hexes,
  not to long-range fire [S3][S2].
- **Blocking.** Each friendly unit next to both the defender and the attacker raises the
  defender's value by a quarter of its base value. It does not work against long-range fire
  [S3][S2].
- **Chance.** Reviews stress the luck element: Amiga Power found combat "almost totally random"
  and gave the example of three strong units losing eleven of eighteen tanks for one enemy loss
  [S10 AP]. Amiga Format said even "massive superiority in experience or armour is no guarantee
  of success" [S10 AF].
- **Experience.** A unit gains one point when it fights and damages the enemy, and two extra
  points if it wipes out a whole unit [S1][S3]. Experience improves both accuracy and dodging
  [S1][S3]. It is shown as stars on the status line [S2]. Battle Isle 2's manual says its scale
  was raised "from six to twelve" [S12], which implies six points in Battle Isle 1. Tygre's wiki
  describes seven steps from none up to an Iron Cross-style symbol [S9]. The manual advises not
  attacking strong units with weak ones early on, since that only feeds the enemy experience [S1].
- **Damage.** Units are worn down a vehicle at a time and can be rebuilt to six in a building
  while keeping their experience [S10 AF][S1].

### Sight and fog of war: none in Battle Isle 1

- Battle Isle 1 has no fog of war. When Battle Isle 2 came out, Game Bytes listed as a "major
  change" that "the map is initially black ... You have to explore" [S11].
- The manual's overview map shows "your present situation as well as that of your opponent" [S1].
  Amiga Format's review of Battle Isle '93 says knowing what to do depends partly on "watching
  your opponent's screen as they move" [S10 AF48].
- The exceptions are small: the Barracuda submarine is invisible [S5]; the "Hide shops" setting
  stops each player looking inside the other's buildings [S1]; asking for details of an enemy
  unit gives "ACCESS DENIED" [S1].
- So in Battle Isle 1 every unit in effect sees the whole map, far more than it can move.

Battle Isle 2 (1993-94), for contrast:
- Each unit has a reconnaissance range ("sight is radar") and an anti-sight (jamming) value
  [S11][S13]. Terrain once seen stays on the map in a darker shade, but enemy units show only
  while in sight [S12].
- Units that blunder next to unseen enemies are fired on at once [S11].
- See "Units: Battle Isle 2" below for move against sight.

### Buildings: HQ, factories and depots

- Three building types: headquarters, factories and depots [S1].
- **Capture.** Only infantry can occupy buildings. A building is taken by moving infantry onto
  its entrance hex; a neutral factory (both domes grey) is taken by infantry landing on its top
  hex [S1]. Everything inside a factory or depot when it is captured goes to the captor [S1].
- **HQ.** Occupying the enemy HQ with infantry wins the game. The manual advises keeping at least
  two units near your HQ on large maps [S1]. All units can be repaired at the HQ [S2].
- **Factories** build new units and repair. Building takes the action phase; the new unit can
  leave in the next movement phase. Some maps forbid some units even when energy allows [S1].
- **Depots** repair but do not build. They can be captured or built by the Merlin; a built depot
  belongs to its builder at once and comes with some energy [S1].
- **Energy** stands for all raw materials. Buildings start each map with a stock. Repairing a
  unit costs 3 energy whatever the damage, except for depot builders [S1].
- **Income** comes only from energy crystals carried to a building in a transport unit. Each
  crystal is worth 50 energy, enough for about four new units [S1]. The crystals are usually in
  hard-to-reach places [S1]. The manual mentions no per-turn income [S1].
- The computer opponent in Battle Isle 1 "does not seem to build anything in factories" [S9].

### Supply and ammunition: none in Battle Isle 1

No fuel or ammunition rules were found for Battle Isle 1. Battle Isle 2 added fuel, ammunition,
tanker and ammunition transporters, and separate energy and material stocks [S12][S13].

### Victory and the campaign

- Win by occupying the enemy HQ or by destroying all enemy units [S1][S17].
- Optional turn limits of 4, 8 or 16 turns: the player with most units at the end wins [S1].
- A score per map, based on the defence values of all units on the map, with bonuses for
  destroying all enemy units, playing with hidden inventories and finishing in few orders;
  maximum 32,500 [S1][S2].
- The solo campaign is 16 maps unlocked by map codes: Conra, Phase, Exoty, Mount, Fight, Rusty,
  Fifth, Vesuv, Magic, Space, Valey, Testy, Terra, Slave, Never, River [S4][S9]. New units appear
  map by map [S10 AF][S4].
- Two-player maps: First, Ghost, Gamma, Marss, Eagle, Metan, Foton, Polar, Tiger, Snake, Zenit,
  Donna, Vesta, Oxxid, Demon, Giant; bonus maps Storm and Europ [S4].
- Maps can take several hours; the manual provides save slots 0-9 [S1].

## The factory capture animation

### What it shows

- Every capture of a building plays the same short scene: "troops torch-blowing their way into
  the building and the door falling down" [S9]. Amiga Format: "a short cartoon trooper blasts
  through a solid metal door" [S10 AF].
- During a battle or capture one half of the split screen shows where it happens and the other
  half plays the scene [S1].

### Where to see it

From YouTube's storyboard thumbnails (one frame per second for the short clip, one per ten
seconds for the longplay), so the longplay times are within about 10 seconds:

- **Best link:** "Battle Isle 1 gameplay capture (putting the red light on)", DOS version, map
  NEVER, 1 min 46 s [S19]:
  https://www.youtube.com/watch?v=UFc1kTU9tqg&t=62s
  - About 1:04 to 1:08: the closed door in the building's wall, with a spark at the lock.
  - About 1:09 to 1:11: the door is gone and a dark figure stands in the lit doorway.
  - About 1:12: fade to black. The video's description says the AI lost by losing its HQ.
  - About 1:19 to 1:26: an explosion scene, then about 1:28 to 1:37 the end-of-game graphs, then
    the high-score name entry.
- **Amiga version:** "Battle Isle Amiga (1991) Longplay", map MAGIC, about two hours [S20]. The
  capture scene appears several times, for example:
  - https://www.youtube.com/watch?v=HlW9rzzMHMg&t=1222s (about 20:25 to 20:45, right half)
  - https://www.youtube.com/watch?v=HlW9rzzMHMg&t=2025s (about 33:45 to 34:05, left half)
  - Also about 23:30, 29:30 and 38:50.
- Shorter overviews: Squakenet's DOS intro and opening level [S22], RetroGamer.biz [S24], and a
  second Amiga longplay [S21]. Battle Isle '93 on PC: [S23].

### Other animations

- **Battle scenes.** Each fight plays a short animation in one half of the screen: the two units
  on their own terrain (for example mountains or bridges), firing at each other, with vehicles
  exploding as they are lost [S9][S10]. Amiga Format's '93 review describes them as "little
  blokes" seen "from an overhead view" [S10 AF48]. In [S19] battle scenes play in one half at several
  points between about 0:20 and 1:03.
- **Movement.** Units are shown driving from hex to hex, so each player can follow the other's
  moves [S9].
- **End of game.** Destroying the enemy brings "a calm display of hardware"; storming a base while
  the battle is raging gives a "mopping-up sequence" [S10 AF].
- **Intro and ending.** An intro sequence and, after the last solo map, an ending that follows on
  from the intro story [S9][S10].

## The data disks: Battle Isle Data Disk 1 and The Moon of Chromos

### Data Disk 1 (1992): new maps, same units

- 34 new maps (25 solo, 9 two-player), some larger than the original's [S10 AP18]. Amiga
  Format: "no new features or surprises; even the vehicles and aeroplanes are the same", with a
  new set of futuristic scenery [S10 AF37].
- Its 25 solo maps are listed on StrategyWiki: Block, Watch, Lagun, Birma, Serpt, Rambo, Yukon,
  Point, Frogs, Italy, Lines, Varus, Sound, Tweak, Nipon, Flair, Arrow, Korso, Nouth, Fjord, Donor,
  Leyes, Jumpy, Werft, Winit [S7].

### Battle Isle '93 / The Moon of Chromos (1993): new terrain, units rebalanced

- Set on Chromos's volcanic moon; same interface; 24 maps [S10 AF48][S10 CU93].
- New terrain: unscalable cliffs, lava flows, craters [S10 CU93].
- All old units were rebalanced; troop carriers gained guns; the FAV Buster lost strength but
  gained range. New units include the Virus, an invisible mine, and the T-100 Zeus, a heavy tank
  two hexes long [S10 CU93][S10 Joker 04-93]. The Joker review counts 26 unit types [S10].
- Crystals give 30 energy (not 50) to factories, depots and HQs [S14].
- Combat: experience as in Battle Isle 1 (one point per fight, two for a kill); ranged attacks
  cannot be answered; fully experienced units at full strength usually wipe out a similar enemy
  unit with few losses [S16].

Partial unit list. The GameFAQs pages could not be opened by the research tools; these rows come
from search-engine extracts of the units page [S15] and should be checked against it. Attack is
written "land - air" as strength:range.

| Unit (battle name) | Move | Attack (land - air) | Armour | Cost | Special |
|---|---|---|---|---|---|
| Demon (Mechfusiliers) | 4 | 30:1 - none | 30 | 9 | Capture |
| Demon, second listing (Mechfusiliers) | 3 | not found | 30 | 12 | Capture |
| Scorpion (Arm. Vehicles) | not found | 40:1 - none | 40 | 12 | |
| Python (Arm. Vehicles) | 8 | 35:1 - 8:1 | 30 | 13 | Transport |
| Buster (Recon Squad) | 8 | 30:3 | 27 | 12 | |
| Blade (Tank Platoon) | 6 | 57:1 - none | 50 | 15 | |
| Zeus (Fortress) | 2 | 74:2 - 20:1 | 100 | none listed | |
| Virus (Killer Bees) | 2 | 90:1 - none | 5 | 8 | Invisible |

Terrain movement costs in Battle Isle '93 (from the GameFAQs guide [S14]):

| Terrain | Cost in move points | Restrictions |
|---|---|---|
| Road | 1 | none |
| Moon surface | 2 | |
| Lava sea | 1 | Closed to land units except hovercraft |
| Chasm | impassable | Land units cannot cross |
| Cliff face | 3 for infantry | Infantry and air units only |
| Rough ground, craters | 2 | Closed to hovercraft, recon and pioneer units |
| Jungle | 2 | Closed to hovercraft, recon and pioneers |
| Red desert | 3 for land and hovercraft units | Python cannot enter; other transporters pay 1 |
| Any terrain, air units | 1 | |

## Units: Battle Isle 2 (1993-94), for sight against move

Battle Isle 2 is the first game in the series with fog of war, and its Weapons Systems Manual
prints both a movement value and a reconnaissance range for every unit [S13]. The manual's key:
K "maximum range of movement (on roads)", L armour, M attack initiation value, N reconnaissance
range [S13 p.2]. The values below were read from the archive.org text layer of the scan and
checked by eye against the page images for the Demon, Troll, Samurai-2, Orion, Genom and Pulsar.
Values are printed with decimals in the manual (for example 2,25).

| Unit | Role | Move (roads) | Sight (recon) | Armour | Initiative |
|---|---|---|---|---|---|
| Demon I31 | Light battle robot (infantry), can capture | 4 | 2.25 | 150 | 80 |
| Troll I42 | Elite battle robot, can capture | 3.25 | 2 | 200 | 200 |
| Ranger | Recon patrol | 10 | 5.5 | 130 | 600 |
| Buggy | Recon vehicle | 10 | 5.5 | 125 | 530 |
| Planum 5 | Engineer (roads, rails) | 4 | 1 | 100 | 72 |
| Regio | Engineer (fortifications) | 4 | 1 | 100 | 71 |
| Snake | Armoured transport | 8.5 | 3.5 | 285 | 510 |
| Technotrax | Light tank | 7.25 | 3 | 320 | 425 |
| Sting | Rocket tank | 8.25 | 3.25 | 268 | 480 |
| Comet FP-42 | Flak | 8 | 3.5 | 305 | 815 |
| Pulsar A3 | Artillery (range 2-5) | 2 | 1 | 110 | 950 |
| Archimedes | Rocket artillery | 4 | 2 | 135 | 910 |
| Samurai-2 | Main battle tank | 5 | 2 | 450 | 420 |
| Nashorn | Assault gun | 6 | 3 | 550 | 500 |
| Spring 1 | Armoured transport | 4.5 | 1 | 600 | 78 |
| Sinus | Field repair unit | 4 | 1 | 110 | 68 |
| Orion OR-3 | Radar vehicle | 5.5 | 8 | 200 | 70 |
| Atlas | Cheap transport | 7.25 | 1 | 60 | 90 |
| Algol | Fuel transport | 7.5 | 1 | 85 | 78 |
| Alcor | Ammunition transport | 5.5 | 1 | 400 | 64 |
| Rune | Radar station | 1.25 | 10 | 300 | 0 |
| Medusa | SAM launcher | 2.25 | 4 | 160 | 990 |
| Skull | Bunker | 1.25 | 3 | 600 | 502 |
| Ionstar | Fixed gun | 0 | 3 | 580 | 478 |
| Super Virus | Mine | 3.5 | 1 | 450 | 0 |
| U.H.U. R-51 | Radar plane | 13 | 9 | 200 | 700 |
| Ghost FB-3 | Stealth fighter | 17 | 4 | 220 | 860 |
| Stormbringer | High-altitude bomber | 11 | 4 | 200 | 700 |
| Genom J1 | Fighter | 17 | 3.5 | 190 | 850 |
| Exterminator | Fighter-bomber | 16 | 4.5 | 215 | 810 |
| Sperber TB-4 | Submarine hunter | 15 | 5.25 | 220 | 760 |
| Spectrum | Fuel transport plane | 10 | 4 | 185 | 690 |
| Crux | Transport plane | 10 | 3.25 | 185 | 650 |
| Dragon H1 | Attack helicopter | 10 | 3 | 200 | 650 |
| Guppi H2 | Transport helicopter | 8 | 3 | 260 | 600 |
| Möwe SX-1 | Fast boat | 10 | 7 | 190 | 820 |
| Patrix | Patrol boat | 8 | 6 | 210 | 700 |
| Hydra | Torpedo boat | 7 | 6 | 320 | 750 |
| Polar C-6 | Cruiser | 6 | 5 | 580 | 820 |
| Zenit MBS-19 | Battleship | 5 | 4 | 750 | 851 |
| Titan N2 | Carrier | 5 | 4 | 440 | 815 |
| Orca U7 | Submarine | 6 | 3 | 315 | 860 |

The trains (Dolmen, Anaconda, Excalibur, Menhir, Monolith) and the Vader, Rex and Shell craft are
also in the manual [S13] and left out here. Roles are from the Game Bytes list [S11] and the
manual's card titles [S13].

## Gaps

- **Battle Isle 1 Weapons Handbook.** The manual refers to a separate Weapons Handbook with each
  unit's description [S2]. No scan or transcription was found, so most unit costs, any weights or
  transport capacities in numbers, and any terrain cost table for Battle Isle 1 are missing.
- **Terrain movement costs and defence bonuses for Battle Isle 1.** Only qualitative rules found.
- **Combat formula.** Only the surrounding (x2 from behind) and blocking (+25% each) figures
  were found [S3]; the base formula, the random range and the size of the experience bonus were
  not.
- **Experience scale.** Six points is implied by Battle Isle 2's manual [S12]; seven displayed
  levels per Tygre [S9]. Not settled.
- **Battle Isle '93 unit list.** Only eight rows, from search extracts [S15]. The DJ OldGames
  copy of the Data Disk 2 Weapons Manual exists but refused automated download.
- **Sites that refused automated access:** StrategyWiki (live), Tygre's Amiga Wiki (live),
  Lemon Amiga (live), GameFAQs, MobyGames, Hall of Light and DJ OldGames. Archived copies on the
  Wayback Machine were used where they existed. MobyGames and Hall of Light were not read at all.
- **Animation timings** come from YouTube storyboard thumbnails, not from watching the videos;
  check them in the player.

## Compared with Mech Attack

The Mech Attack figures below are as they were before v0.88 (21 November 2026). v0.88 took 1
off every unit's move except Artillery's and the Sonic Tank's, set sight to 3 for every ground
unit and 5 for every air unit, and turns over the blocks next to the one a unit is on
(`fog.revealRange` `"nextBlocks"`); see `docs/rules.md`.

Mech Attack figures are from `rules-config.js` (`units`, `terrain`, `fog`). The scales differ:
Battle Isle attack and armour run up to about 100, Mech Attack's up to about 40, so compare
the shape of the numbers rather than the size. Battle Isle 1 has no sight value because it has
no fog; where a Battle Isle 2 unit fits better, its sight is given and it is marked BI2.

| Mech Attack unit | MA move | MA sight | MA attack | MA defence | MA range | Nearest Battle Isle unit | BI move | BI sight | BI attack (land / air) | BI armour | BI range |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Infantry | 3 | 2 | 10, ground and air | 5 | 1 | R-1 Demon (BI1); Demon I31 (BI2) | 4; BI2 4 | whole map; BI2 2.25 | 32 / none | 25 | 1 |
| Commander Jeanne | 3 | 3 | 10 | 10 | 1 | none (Demon is nearest) | | | | | |
| Scout Bike | 6 | 4 | 15 | 10 | 1 | FAV Buster (BI1); Ranger (BI2) | 8; BI2 10 | whole map; BI2 5.5 | 35 / 12 | 25 | 2 land, 1 air |
| Tank | 4 | 3 | 25 | 25 | 1-2 | T-4 Gladiator | 6 | whole map | 52 / none | 50 | 1 |
| Twin Tank | 4 | 3 | 20 x 2 | 35 | 1 | T-7 Crusader | 4 | whole map | 60 / 15 | 65 | 1 |
| Heavy Cannon | 2 | 3 | 40 | 40 | 1-3 | Zeus (Battle Isle '93) | 2 | whole map | 74 / 20 | 100 | 2 land, 1 air |
| Artillery | 2 | 3 | 30 | 10 | 2-5, indirect, set-up | HG-12 Angel | 4 | whole map | 45 / none | 25 | 2-6, set-up |
| Blast Cannon | 3 | 3 | 40, splash | 15 | 2-4 | HG-12 Angel (no splash in BI) | 4 | whole map | 45 / none | 25 | 2-6 |
| Sonic Tank | 4 | 4 | 15, line, ground and air | 20 | 1-4 | none | | | | | |
| Anti-Aircraft Jeep | 5 | 3 | 30, air only | 15 | 1-3 | AD-5 Blitz; AD-9 Sphinx | 5 | whole map | Blitz 25 / 40; Sphinx none / 48 | 30 | Blitz 1; Sphinx 2-6 |
| Fighter | 7 | 4 | 30, air only | 15 | 1-4 | XF-7 Mosquito | 10 | whole map | none / 45 | 25 | 1 |
| Attack Helicopter | 5 | 3 | 15, ground and air | 10 | 1-2 | CAS Firebird | 7 | whole map | 35 / 10 | 30 | 1 |
| Spotter Drone | 5 (split) | 5 | none | 5 | | none in BI1; U.H.U. R-51 radar plane (BI2) | BI2 13 | BI2 9 | none | BI2 200 | |
| Transporter | 6 | 3 | none | 25 | | SC-T Provider (infantry only) | 7 | whole map | 15 / 8 | 25 | 1 |
| Chinook | 5 | 3 | none | 15 | | G-2 Giant | 9 | whole map | none | 20 | |
| Light Harvester | 6 | 2 | none | 15 | | transports carrying crystals (Provider, Invader) | 7 | whole map | | 25-30 | |
| Crystal Seeder | 6 | 3 | none | 5 | | none | | | | | |
| Light Medic | 5 | 3 | none, heals 25 | 15 | heal 1 | none in BI1 (repair only in buildings); Sinus (BI2) | BI2 4 | BI2 1 | | BI2 110 | |
| Turret | 0 | 3 | 25, overwatch | 35 | 1-3 | none in BI1; Skull bunker (BI2) | BI2 1.25 | BI2 3 | | BI2 600 | |
| Twin Turret | 0 | 3 | 20 x 2, overwatch | 30 | 1 | none in BI1; Skull bunker (BI2) | BI2 1.25 | BI2 3 | | BI2 600 | |
| Factory | 0 | 4 | none | 100 | | Factory (building) | | whole map | | | |

Mech Attack has no counterpart for Battle Isle's naval units, the SC-P Merlin depot builder or
the invisible Barracuda.

### Sight against move

Battle Isle 1 settles the question by having no fog at all: every unit sees the whole board,
and players even watch each other's half of the screen [S11][S1][S10]. Surprise comes only
from the hidden submarine, hidden building contents and the delay between giving orders and
seeing them carried out.

Battle Isle 2, which added fog, went the other way from Phil's instinct. Its fighting units see
roughly half as far as they move on roads: Demon 2.25 against 4, Technotrax 3 against 7.25,
Samurai-2 2 against 5, Ranger 5.5 against 10, Genom fighter 3.5 against 17 [S13]. Only the
ground radar units see further than they move (Orion 8 against 5.5, Rune 10 against 1.25); even
the U.H.U. radar plane sees 9 against a move of 13 [S13]. The move figure is on roads and shrinks on
rough ground [S13 p.2], so cross-country the gap is smaller, but it is still a game where you
often move into ground you cannot see and get ambushed: hidden units next to a unit that stops
fire on it at once [S11]. Scouting is a separate job for specialist units.

Mech Attack sits between the two. Sight is close to move for slow units (Heavy Cannon and
Artillery see 3 and move 2; Tank 3 against 4), but the fast units still move further than they
see: Scout Bike 4 against 6, Fighter 4 against 7, Transporter 3 against 6, Light Harvester 2
against 6. On top of that, fog mode "tiles" with `revealRange: 1` only turns a seven-hex block
over when a unit is on or next to it, whatever the unit's sight, and `stopOnReveal` halts a move
that turns one over. Sight then only decides which hexes on turned-over blocks show enemy units
(`liveSight`). New ground therefore appears a block at a time close to the unit, often well
short of where its move could take it. If the aim is that sight should exceed move, the fast units (Scout Bike, Fighter,
Transporter, Harvester, Seeder) are where Mech Attack is furthest from it.

### Turn structure and timing

Battle Isle 1 splits each turn into a movement phase for one player and an action phase for the
other, played at the same time on a split screen, with orders resolved together at the phase
change [S1]. A unit moves in one phase and fires in a later one, and it can be shot before its
move happens. Mech Attack gives each player a whole turn of moving and firing, like Battle Isle 2
[S11]. Battle Isle's scheme removes waiting in two-player games and makes every move a
prediction, but it does not suit a solo board game well without a second player.

### Combat: random groups against fixed thresholds

Battle Isle units are groups of six that lose vehicles one by one, fire back with what is left,
gain experience and are resolved with a random element that reviewers found strong [S10][S9].
Mech Attack units have two lives, attack totals in a turn are compared with fixed multiples of
defence, and there is no experience. Both games reward ganging up: Mech Attack adds attacks
together, Battle Isle multiplies an adjacent attack by up to two for a unit behind the target and
gives the defender +25% for each blocking friend [S3]. Both stop ranged attacks being answered
(Battle Isle at range 2 or more [S4]; Mech Attack only adjacent attackers draw return fire).

### Economy and capture

Battle Isle 1 has no income: buildings start with energy, and the only top-up is a crystal (50
energy) carried in by a transport unit [S1]. Repair is cheap (3 energy) and keeps experience, so
pulling damaged veterans back to a building is the core loop [S1][S10]. Mech Attack's crystals
grow, spawn and explode on the board and are harvested by a dedicated unit, so the economy is a
much bigger part of the game. Capture works alike in spirit (only infantry, by entering the
building), but in Battle Isle the units stored inside go to the captor and the HQ capture ends
the game at once [S1]; in Mech Attack the infantry are used up and must start their turn next to
the factory. Battle Isle 1 has no repair units in the field (only the carrier and some large
ships repair themselves or what they carry [S5]), so the Light Medic has no counterpart.

## Sources

- [S1] Battle Isle manual, Amiga, English, transcribed on Lemon Amiga. Read via the Wayback
  Machine copy of 12 February 2025:
  https://web.archive.org/web/20250212073234/https://www.lemonamiga.com/games/docs.php?id=163
- [S2] Battle Isle manual, Amiga, English, scan (includes "Combat Formations", "General
  Strategy" and the glossary missing from S1):
  https://archive.org/download/retrokit-manuals/amiga/amiga-original.zip/Battle%20Isle%20%28en%29.pdf
- [S3] Battle Isle Handbuch, Amiga, German, scan ("Die Kampfstellung", "Das Klemmen", "Das
  Blocken", "Die Landschaft"):
  https://archive.org/download/retrokit-manuals/amiga/amiga-original.zip/Battle%20Isle%20%28de%29.pdf
- [S4] StrategyWiki, Battle Isle/Ground Units (Wayback copy, 23 April 2016):
  https://web.archive.org/web/20160423024812/http://strategywiki.org/wiki/Battle_Isle/Ground_Units
- [S5] StrategyWiki, Battle Isle/Sea Units (Wayback copy, 2016):
  https://web.archive.org/web/20160827170049/http://strategywiki.org:80/wiki/Battle_Isle/Sea_Units
- [S6] StrategyWiki, Battle Isle/Air Units (Wayback copy, 2016):
  https://web.archive.org/web/20160827162356/http://strategywiki.org:80/wiki/Battle_Isle/Air_Units
- [S7] StrategyWiki, Battle Isle/Data Disk 1 (Wayback copy, 2015):
  https://web.archive.org/web/20150731003456/http://strategywiki.org:80/wiki/Battle_Isle/Data_Disk_1
- [S8] StrategyWiki, Battle Isle main page (Wayback copy, 6 February 2026):
  https://web.archive.org/web/20260206053335/https://strategywiki.org/wiki/Battle_Isle
- [S9] Tygre's Amiga Wiki, Battle Isle (Wayback copy, 10 July 2026); live page
  https://www.chingu.asia/wiki/index.php?title=Battle+Isle :
  https://web.archive.org/web/20260710152819/http://www.chingu.asia/wiki/index.php?title=Battle%20Isle
- [S10] Amiga Reviews, Battle Isle, Scenario Disk 1 & 2, collected magazine reviews:
  https://www.amigareviews.leveluphost.com/battleis.htm
  - AF: Trenton Webb, Amiga Format 29, December 1991, pp. 68-70
  - AP: Stuart Campbell, Amiga Power 9, January 1992, pp. 32-33
  - CU: Mat Broomfield, CU Amiga, December 1991, pp. 102-103
  - AF37: Neil Jackson, Amiga Format 37, August 1992 (Data Disk 1)
  - AP18: Mark Ramshaw, Amiga Power 18, October 1992 (Data Disk 1)
  - AF48: Trenton Webb, Amiga Format 48, July 1993 (Battle Isle '93)
  - Joker 04-93: Carsten Borgmeier, Amiga Joker 04-93 (Battle Isle '93)
  - CU93: Mat Broomfield, CU Amiga, July 1993 (The Moon of Chromos)
- [S11] Andreas Toenne, "Battle Isle II" preview, Game Bytes issue 18, 1993:
  http://www.ibiblio.org/GameBytes/issue18/flooks/bi2.html
- [S12] Battle Isle 2 manual, English, archive.org text:
  https://archive.org/stream/Accolade_Battle_Isle_2200_MSDOS_1994/Battle_Isle%202_Manual_djvu.txt
- [S13] Battle Isle 2 Weapons Systems Manual, PC, scan with text layer:
  https://archive.org/download/extras_msdos_Battle_Isle_2_1993/Battle_Isle_2_-_Weapons_Systems_Manual_-_PC.pdf
- [S14] GameFAQs, Battle Isle '93 guide by ianclark78, "Move phase" (read through search
  extracts only):
  https://gamefaqs.gamespot.com/pc/213945-battle-isle-93-the-moon-of-chromos/faqs/78497/move-phase
- [S15] GameFAQs, same guide, "Units" (search extracts only):
  https://gamefaqs.gamespot.com/pc/213945-battle-isle-93-the-moon-of-chromos/faqs/78497/units
- [S16] GameFAQs, same guide, "Attack Phase" (search extracts only):
  https://gamefaqs.gamespot.com/pc/213945-battle-isle-93-the-moon-of-chromos/faqs/78497/attack-phase
- [S17] Wikipedia, Battle Isle (video game): https://en.wikipedia.org/wiki/Battle_Isle_(video_game)
- [S18] Wikipedia, Battle Isle (series): https://en.wikipedia.org/wiki/Battle_Isle
- [S19] YouTube, Falcoix, "Battle Isle 1 gameplay capture (putting the red light on)":
  https://www.youtube.com/watch?v=UFc1kTU9tqg
- [S20] YouTube, TsepesiHentai, "Battle Isle Amiga (1991) Longplay":
  https://www.youtube.com/watch?v=HlW9rzzMHMg
- [S21] YouTube, Pixel Party, "Battle Isle Amiga Longplay 1991":
  https://www.youtube.com/watch?v=3iCMlfPE2SY
- [S22] YouTube, Squakenet, "Battle Isle gameplay (PC Game, 1991)":
  https://www.youtube.com/watch?v=73N6s0V_3lU
- [S23] YouTube, Squakenet, "Battle Isle 93 - The Moon of Chromos gameplay (PC Game, 1993)":
  https://www.youtube.com/watch?v=o-bknU4XY8s
- [S24] YouTube, RetroGamer.biz, "Battle Isle (1991, Blue Byte Software)":
  https://www.youtube.com/watch?v=orRQ_kkwjyA
- [S25] Jan Wedekind, "Battle Isle" (embeds S19): http://wedesoft.de/game/2010/10/23/battleisle/
