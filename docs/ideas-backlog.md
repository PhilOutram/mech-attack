# Mech Attack — ideas backlog

Captured 19 October 2026, updated 28 October 2026. Phil's ideas first, then existing assets, then open design questions raised while capturing them.

## Keep the core simple (Phil, 31 October 2026)

The core game has proven fun because it is simple. Getting that core right comes first. There is a limit to how many units and rules the game can carry; campaigns help new players learn, but they do not raise that limit. Every new idea goes into the ideas log below first and earns its place by testing, not by sounding good.

How an idea gets tested:
- **Balance:** the simulator plays the AI against itself with a rule changed, so two versions can be compared side by side, e.g. `node sim.js --games 500 --seed 1 --set units.attackHelicopter.cost=55` against the same run without `--set`. `tools/matchups.mjs`, `tools/duels.mjs` and `tools/terrain-matchups.mjs` show how the counters and rings move.
- **Fun:** the simulator cannot measure that. An idea that passes the balance check gets played by people before it goes into the main game, ideally first as an optional rule or a single campaign mission.

### Ideas log

Core tuning (changes numbers only, no new rules):
- Twin Tank: cost 65, move 4, so it is a fast escort rather than a worse Heavy Cannon. Awaiting Phil.
- Attack Helicopter: cost 55; it is the best answer to 7 of 18 enemy types. Awaiting Phil.

Parked for testing, or for a sequel:
- Separate attack and defence against ground and against air. Would shift the rings a lot, but doubles the numbers on every unit. Sequel.
- Factory upgrades that change units: Optics (+1 sight), Armour plating (+5 defence, -1 move), Long barrels (+1 range, -5 attack). Flat boosts were rejected because they steepen the cost ladder.
- Crystal transfer between allies: harvesters unloading at an ally's factory, and a Supply depot upgrade for direct transfers.
- Engineer: lays anti-tank spikes (vehicles cannot cross; Infantry and air can) and clears rough ground. The rough-band test showed that terrain which only slows units makes no new rings; terrain has to block to make them.
- Engineers that rebuild ruins or build outposts.
- Event cards (idea 8). Phil: wait.

Approved earlier for the co-op campaigns (31 October); to be checked against this principle before building: crystal gifting, allied transport, role kits, turret deployer with overwatch, same-round objectives. Separate 2-, 3- and 4-player campaigns, and up to 8 players once the new colours are drawn.

## Phil's ideas

### 1. New units from existing art styles
Create new units using AI image generation, matched to the unit styles already developed.

### 2. Mechanics for the new units and terrain
Design mechanics around the new units, including terrain. Mars-based, so terrain options are limited to levels of rockiness (see existing map tiles).

### 3. Simulation
Simulate the game mechanics to check they produce a fun game.

### 4. AI opponent with camera and tablet
- All human players move at the same time (continuous play).
- A camera on a tripod photographs the board. The AI reconstructs the board state and checks that every human turn was legal and makes sense.
- The AI calculates its own moves and shows them on a tablet or second phone in a form that is very easy to follow; humans move the AI's pieces.
- The AI photographs the board again to verify, then the next turn starts.
- Turn-based underneath, but it feels continuous.

### 5. Ruins revealed by fog of war
Ruins appear as fog of war clears and tiles are explored (reuse the Myths of Time thinking on ruins). Simpler here because crystals are currently the only resource. Possible later extension: coloured crystals needed for particular units, e.g. green for defensive units.

### 6. Crystals that spawn and grow
Problem from early play: limited resources made the game one-dimensional and predictable, and it stalled into stalemate quickly.
Idea: crystals spring up at random as 10 units and grow by 10 units every turn they are not harvested.

### 6c. Crystals explode at 80 (added 28 October)
- Built in v0.03: every pile, starting piles included, grows by 10 a round when not harvested and explodes at 80; the crystals are lost. Starting piles hold 50, and maps have more of them (4 pairs plus one in the middle).
- Options for later: explosion damage to units on neighbouring hexes; scattering the crystals into one random neighbouring hex or into all of them; damage only on the hexes the crystals scatter onto.
- Side effect: it caps how big a pile can get, which also answers the "very large fields decide the game" risk under Open design questions.

### 6a. Escalation to stop growing crystals making the game longer
- Risk: growing crystals could make the game last longer and become more attritional, not less.
- Answer: exponentially larger units, so the real pace of play stays the same but the game feels like it is speeding up towards a conclusion.
- It should feel like a race to bigger units.

### 6b. Crystal lab (added 28 October)
- Save up to build a crystal lab that spawns crystals within a 2-tile radius each turn.
- Phil then suggested a mobile crystal lab unit might be even better than a fixed building.
- App feature: a "spawn crystal" screen showing the lab in the middle and the 18 tiles around it. Pressing spawn makes a baby crystal (10) materialise on a random one of those tiles.
- Depletion rule: tiles that have been harvested are depleted and can't be used to respawn crystals. It's an extra rule, but it stops players parking the lab.

### 7. Feedback loops and comebacks
- A losing player should be able to play recklessly and still have a chance of getting back in.
- Avoid a game of attrition; vary the flow without feeling random or annoying.
- Not "roll a 6 for an unfair advantage". Instead, a risk that everyone understands: high upside, high downside, chosen deliberately.

### 8. Event cards with a forecast
- The next event is always visible one turn ahead.
- Researching or building a radar shows events two turns ahead.
- Examples: Mars weather (no effect); electrical storm (no ranged attacks that turn); dust storm (movement halved).
- The app background shows an animation of the brewing event, the way weather apps show current conditions.

### 9. An AI that learns rather than being taught (added 28 October)
- Instead of hand-writing more AI rules (such as how to scout for a hidden enemy), give the AI's strategy random elements, run lots of games and let it learn what works.
- It feels formulaic, especially with few units: mix up how the AI plays.
- Context: in the camera version (idea 4) the AI sees the board from a photo after each turn and shows its moves and explosions on screen, so the AI working only from what it can see is right.
- Built (v0.12): the AI's choices are driven by a personality of tunable genes; `evolve.js` breeds personalities by self-play and the game picks one of the best each game. Results in `docs/evolution.md`.

### 10. Where is the strategy? (added 28 October)
- Units improve in a straight line (bigger costs more and does more). There should be more asymmetric units with real strengths and weaknesses.
- Built: the ground/air rule and five new units (v0.11); factory upgrades that unlock heavy and air units, so buying a tier is a choice against buying units now (v0.12, a first step towards escalation 6a).

### 11. Map shapes, unused factories and upgrades (added 28 October)
- Map shapes with rows of blocks: 3-4-4-3, 4-5-5-4, 3-5-5-3.
- Bigger maps with unused factories that only Infantry can capture. Troops are weak and vulnerable, so need looking after; they can ride in a Transporter, which costs more.
- Factory upgrades to unlock air and heavy units: the Attack Helicopter was too strong when it could be bought from the start. A common unit should be able to hit air: the Scout Bike now does.
- Built in v0.12. Still open: whether the Transporter should fly (the unit table's A3 Transport is an air unit), and whether capturing should take longer than one move.

## Companion app
- Live at https://philoutram.github.io/mech-attack/ (repo philoutram/mech-attack).
- As of v0.01 (26 October 2026): a static installable web app with a splash screen and a units reference screen listing all 21 units from the unit table (units.js), with art for six units. No build step; plain HTML, CSS and JavaScript modules.
- Planned additions: playable game against an AI opponent plus a balance simulator (in progress), crystal spawn screen (6b), event forecast with animated background (8), later the AI opponent screens for the physical game (4).

## Existing assets (OneDrive: Games\MechAttack)

### Map Tiles folder
- Hex tiles: red Mars ground, dark grey borders. Terrain seen so far: plain ground with scattered rocks (varying density), mountains/ridges, and a chasm (a crack spanning several hexes, with a single-hex version).
- Map pages 1–7: seven-hex clusters (one centre hex plus a ring of six) on A4 print sheets, with mountains placed on some outer hexes.
- "Mech Attack Tiles v3 - smaller for printing.png" is the latest print sheet (April 2024). Draft chasm images in Draft Images.

### Units folder
- Top-down vehicle tokens in four player colours (red, blue, green, yellow), each with a "firing" variant showing a muzzle flash. All token art is Phil's own, drawn in Fireworks. Laid out as print sheets on sand-textured and red circular backgrounds in "Units - Mars.pptx" (April 2024). The sheets also include cyan crystal tokens and grey storage/silo tokens.
- "Individual Vehicles - Web" and the saved Roll20 page are reference material only.
- "Unit Cards.pptx" (July 2024, newest file): AI-generated hero art of blue-lit tanks on a red Mars landscape with the MECH ATTACK title, plus stat tables.
- "Crystals.png": crystal art in four colours (red, purple, green, blue), which already suits the coloured-crystal idea in 5.
- "Unit Table.xlsx": unit stats and rules (summarised below).

### Unit Table summary
Stats per unit: cost, move, defence, attack, range, storage, healing, sight. Full roster: Tank, Heavy Cannon, Artillery, Blast Cannon (cluster bomb), Sonic Tank (sonic boom line attack), Fighter, Attack Helicopter, Transport, Fort, Turret, Light Factory, Factory, Light/Heavy Harvester, Light/Heavy Medic, Scout Bike, Spotter Drone. Air units are only partly filled in.

The playtested "Game 2" set is smaller:

| Unit | Cost | Move | Defence | Attack | Range | Storage | Healing | Sight |
|---|---|---|---|---|---|---|---|---|
| Scout Bike | 30 | 6 | 10 | 15 | 1 | 30 | - | 4 |
| Tank | 70 | 4 | 25 | 25 | 2 | - | - | 3 |
| Heavy Cannon | 110 | 2 | 40 | 40 | 3 | - | - | 3 |
| Artillery | 70 | 2 | 10 | 30 | 2–5 | - | - | 3 |
| Light Harvester | 50 | 6 | 15 | - | - | 90 | - | 2 |
| Light Medic | 40 | 5 | 15 | - | 1 | - | 25 | 3 |

Game 2 crystal sources: Crystals 180, Crystal Base 500, Crystal Cave 560 (1,240 in total). The spreadsheet also lists a cost and a defence figure against each source (Crystals 30/6, Crystal Base 50/10, Crystal Cave 70/8); their meaning needs confirming with Phil.

Rules noted: multiple attackers add their scores; units with range up to 3 return fire on adjacent attackers; light factory builds light units only; medics heal units whose defence is at or below their healing value; forts, turrets and factories must be constructed and then cannot move; artillery takes one attack turn to set up for firing.
Open question already noted there: does a unit retaliate once per attacker when several players attack it in their turns?

Card ideas noted: force opponent to roll to win a battle; sell a unit back for crystals; reveal a new map tile; blast ammo (radius 1, half damage around the target); booby trap (15 damage).

## Open design questions

- **Simultaneous moves (idea 4).** If humans all move at once, the rules need to say how conflicts resolve: two units entering the same tile, attacks on a unit that has just moved, and who resolves combat first. This needs settling before the camera pipeline, because it defines what "legal" means when the AI checks the photo. It also answers the retaliation question from the unit table.
- **Crystal growth balance (idea 6).** Each spawn grows linearly, but spawns accumulate, so total crystals on the map grow roughly with the square of the turn number. That is the income curve escalation (6a) has to absorb. Other risks: the leader controlling more map collects most spawns, and very large fields decide the game. Options: a growth cap, spawn rules that favour neutral or contested tiles, or spawning only in unexplored fog. Game 2 had 1,240 crystals in total on the map, which helps explain the early stalemate.
- **Fixed or mobile crystal lab (idea 6b).**
  - A fixed lab tends to get built in the safest corner of your base, so it rewards turtling and helps whoever is already ahead. That works against the stalemate fix.
  - A mobile lab can be pushed into neutral ground, so the economy and the fighting move around the map with it. It is also a high-value target to escort or hunt, and driving it deep into contested ground is a natural comeback gamble (idea 7).
  - Suggested rules for a mobile lab: heavy, slow (move 2), low defence; must deploy for a turn before it spawns (like artillery set-up) and cannot move while deployed; spawns one baby crystal per owner turn while deployed.
  - Because crystals land at random within 2 tiles, some will land closer to an enemy than to you. That makes the "harvest now or let it grow" choice tense rather than free money.
  - Other rules to decide: one lab per player or more; cost (it pays 10 per turn plus growth, so the simulator can work out the payback time); whether it is a tier unlock in the escalation race (6a).
- **Depletion rule (idea 6b).**
  - Effect: each deployment has a limited life of at most 18 harvests, fewer once mountains, chasms and occupied tiles are excluded. Labs work like nomadic miners: deploy, harvest out, move on. This keeps the economy moving round the map.
  - Enemies harvesting your lab's crystals deplete those tiles too, so raiding a lab both steals income and shortens its deployment.
  - Tracking without board clutter: pair it with a redeploy rule that a lab must move at least 5 tiles before deploying again. Two radius-2 areas only overlap when their centres are 4 or fewer tiles apart, so at 5 the new area never contains old depleted tiles. The app can then track depleted tiles for the current deployment only and reset when the lab redeploys; no depletion markers are needed on the board.
  - Decide what counts as harvested: any harvest from the tile, or only when the pile is fully cleared. A Light Harvester carries only 15 in the full unit table (90 in Game 2) and piles grow by 10 a turn, so "fully cleared" might rarely happen. "Any harvest depletes the tile" is simpler and harder to game.
  - Decide whether depletion also applies to naturally spawned crystals (idea 6) or only to lab spawns.
- **Crystal spawn screen in the app (idea 6b).**
  - Hex layout: lab in the centre, ring 1 (6 tiles) and ring 2 (12 tiles), 18 in total.
  - Orientation: the screen and the board need the same "up". A direction arrow printed on the lab token, matched by an arrow on the screen, solves this.
  - Tile states: available, blocked (mountain, chasm, board edge, occupied: tap to grey out before spawning), has crystals, depleted (tap to mark when harvested). The app only spawns onto available tiles.
  - If the chosen tile already has crystals: add 10 to that pile rather than re-rolling.
  - "Redeploy" button clears the screen for a new deployment. When no available tiles remain, the screen says the deployment is exhausted.
  - Show the result with a short "materialise" animation on the chosen hex, so everyone at the table sees where it landed.
  - One screen per lab if more than one lab per player is allowed.
- **Escalation design (idea 6a).**
  - Unit tiers with costs rising steeply (e.g. roughly doubling per tier), so the number of units on the board stays about constant while their power rises. This also keeps the physical board and the camera's job manageable.
  - Attack should grow faster than defence at higher tiers. Fights then get more decisive as the game goes on; that is what makes it feel like it is speeding up rather than just getting bigger.
  - Unlocking a tier costs something (factory upgrade or research), creating a real choice between spending on units now and investing to reach the next tier first. That is the race.
  - Rushing a top tier can double as the comeback gamble in idea 7: a trailing player stakes everything on getting there first.
  - Old small units need a way off the board: scrap them for crystals (already a card idea), upgrade them, or give them upkeep.
  - A known end point would help, e.g. the event deck acts as a game clock and the last card ends the game, which the forecast makes visible.
- **Comeback mechanics (idea 7).** The gamble should be open to everyone but only rational for the trailing player, e.g. the payoff scales with how far behind you are, or the downside matters less when you have little to lose. Candidate gambles: overcharging a mech (double attack, chance it is destroyed), deep exploration of a ruin (big reward or lose the unit), staking crystals on an uncertain return, rushing a top-tier unit, driving a mobile crystal lab into contested ground.
- **Radar and information (idea 8).** Forecasting is a clean upgrade because it rewards planning rather than luck. Check that two turns of warning does not let one player always dodge every event.
- **Terrain effects (idea 2).** Current terrain types: plain, rocky (varying density), mountain, chasm. Provisional suggestions: rocks cost extra movement and give a defence bonus; mountains block movement and line of sight but give range and sight bonuses to units on them if passable; chasms block ground units but not air or sonic attacks.
- **Simulation scope (idea 3).** A simple simulator with scripted AI players can measure game length, stalemate rate and how often the trailing player wins. It should also track units on the board per turn and units destroyed per turn, which show whether escalation is working, and the payback time and typical deployment length of a crystal lab. That directly tests ideas 6, 6a, 6b, 7 and 8 before any art or camera work. The unit table gives enough stats to start.
- **Art for new units (idea 1).** Two styles exist: Phil's own top-down Fireworks tokens for the board and painted AI hero art for the cards. New units need both. Image models tend to drift from a flat, outlined token style, so the most reliable route is likely feeding existing tokens in as style references, or generating a concept and then redrawing it in Fireworks. Higher tiers could be visibly bigger tokens (e.g. spanning more of the hex) so escalation reads at a glance. The mobile crystal lab is a good first new unit to draw, with a direction arrow for the spawn screen.
- **Camera recognition (idea 4).** Tokens are distinguished mainly by colour and small silhouette differences. A fiducial marker on each token (or base) would make photo recognition much more reliable.

## Suggested order
1. Core rules, including simultaneous-move resolution and the crystal, crystal lab, escalation, comeback and event mechanics.
2. Simulator to tune them, built into the app as a playable game against an AI opponent.
3. New units and terrain effects, with art.
4. App features: crystal spawn screen, then event forecast.
5. Camera and tablet AI opponent.
