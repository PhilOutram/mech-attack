# Simulator results

`node sim.js --games 1000 --seed 1` plays the AI against itself on fixed map 1, alternating who moves first. Override any rule for a run with `--set`, for example `--set fog.revealRange=1`. Results below are from 28 October 2026, AI and rules as committed that day.

## Current rules (block fog, crystals destroyed when driven over)

| Measure | Result |
|---|---|
| Game length | mean 9.1 rounds, median 9, 10th–90th percentile 8–11 |
| Games that stall (reach round 100) | 0% |
| Games with 20+ rounds and no life lost | 0% |
| How games end | all 1,000 by "no units and cannot afford one" |
| Blue wins | 1.9% |
| First player wins | 51.3% |
| Player behind at mid-game (banked + carried crystals) who wins | 22.6% |
| Player behind at mid-game (crystals + army value) who wins | 2.1% |
| Units on the board, both players | 8.0 per round |
| Units destroyed, both players | 0.87 per round |

1,000 games take about a minute.

## Fog and map variants (400 games each unless marked)

| Variant | Median length | Blue wins | First player wins |
|---|---|---|---|
| Block fog, blocks turned over within sight (current) | 9 | 1.9%\* | 51.3%\* |
| Block fog, only blocks a unit is on or next to | 13 | 11.6% | 51.4% |
| Block fog, blocks within 2 hexes | 12 | 72.9% | 76.9% |
| Line-of-sight fog | 11 | 40.4%\* | 17.8%\* |
| Exact mirror-image map, block fog within sight | 10 | 50.0% | 100% |
| Exact mirror-image map, only blocks next to a unit | 14 | 54.7% | 20.2% |

\* from a 1,000-game run.

## Why the first player wins (v0.06 rules, 28 October 2026)

300 AI games on fixed map 1, first player alternating:

- The first player wins 76%.
- The first player fires the first shot in 100% of games, always in round 2, and makes the first kill in 100%. Whoever fires first wins 76%.
- The second player loses twice as many Light Harvesters (812 against 391) and harvests about 30% fewer crystals.

Cause: with alternating turns, both sides move into range of each other in round 1, and the first player acts first in round 2. It gets the first shot, usually at a harvester near the middle piles, and the second player never recovers.

Fixes tried (all in `rules-config.js`, off by default):

| Option | First player wins |
|---|---|
| None | 76% |
| `turnOrder: "alternate"` (A B, B A, A B ...) | 11%: the player who moves last in a round moves twice in a row and gets the first shot instead |
| `combat.returnFire: "inRange"` (fire back at any attacker in range) | 86%: makes striking first worth even more |
| `start.secondPlayerCrystals: 30` | 67% |
| `start.secondPlayerCrystals: 40` | 67% fixed map 1; 46–51% on maps 2, 6 and 17 |
| `start.secondPlayerCrystals: 50` | 59% fixed map 1; 39–46% on maps 2, 6 and 17 |
| `start.secondPlayerCrystals: 60` | 43% fixed map 1 |

Starting the second player with about 40–50 extra crystals evens it out. Phil chose 40, now the default: over 1,000 games on fixed map 1 the first player wins 61.6% (down from 76%) and blue 50.5%. Fixed map 1 is the hardest of the maps tried for the second player. Fixes that would change the game more and are not built: reaction (opportunity) fire, where a unit that did not fire on its own turn may fire at an enemy that moves into its range; or resolving all attacks at the end of a round, closer to the simultaneous moves of the table game.

## With the new units (v0.11, 300 games, fixed map 1)

- 15 of 300 games ended with a factory destroyed (almost none before): Attack Helicopters can only be hit by anti-air, so they can wear a factory down.
- The rule-based AI mostly builds the cheaper new units: 253 Attack Helicopters and 164 Anti-Aircraft Jeeps, but 1 Blast Cannon and no Sonic Tanks. It seldom saves up for expensive units, so the splash and line attacks were barely tested. The learning AI (idea 9) is the better way to find out what each unit is worth.
- The first player now wins 37.5% and blue 30.9%: the 40-crystal bonus was tuned before these units existed and needs rechecking.

## Overrun rules (v0.37: factories overrun, not fired on; siege turn; Crystal lab)

Evolved again for these rules (`docs/evolution.md`). The five best beat the hand-tuned AI 73–84% of the time. 100 games between them, every map shape:

- 70% of games end with a home factory overrun, 26% with a side out of units, 4% at the round limit. Median length 19 rounds.
- Units built per game, both sides together: Infantry 24.3, Scout Bike 7.0, Anti-Aircraft Jeep 4.7, Light Harvester 3.1, Light Medic 2.6, Tank 2.6, Artillery 2.5, Turret 1.3, Spotter Drone 1.1, Fighter 0.2, Attack Helicopter 0.
- Every personality buys one Crystal lab; almost none buys Heavy works or an Airfield.
- The first player wins only 35% of decided games: the second player's 40 extra crystals now buy two more Infantry.

The unit trials (`docs/balance/unit-trials.md`, 40 games a unit) make one side lean on one unit against the evolved mix. Every unit loses that match-up, because time and crystals spent on it are not spent on the Infantry rush. Per unit built, though, the Heavy Cannon finishes off 8.4 enemy units and is lost 0.3 times, and the Turret 5.0 and 0.4: both are strong once on the board, but too slow to get (Heavy works plus saving up) against a rush. The air units do almost nothing, because there is little in the air to shoot and the AI uses the Chinook only to carry Infantry.

Infantry rushes decide these games. Options to test, for Phil to choose from: dearer Infantry (30), `capture.guarded` (a factory with one of its owner's units next to it cannot be overrun), and a smaller second-player bonus (20).

## Evolved personalities for v0.24 costs (cheaper unused units, drone 15)

Same settings (`node evolve.js --generations 40 --population 20 --games 10 --seed 1`, 69 minutes); tables in `docs/evolution.md`.

- The five best beat the hand-tuned AI in 74–85% of 100 games each, and capture 2.5–3.1 factories a game.
- The cheaper units now get bought: Artillery 10–15% of builds, Anti-Aircraft Jeep about 10% in three of the five, Spotter Drone up to 4%, Light Medic 11–14%. Infantry (28–39%) and Scout Bikes (20–33%) are still the core; Tanks about 7–9%.
- The Airfield is bought about once in ten games; Heavy works still never. The Heavy Cannon, Blast Cannon and Sonic Tank stay unused, as do the Transporter, Fighter and Attack Helicopter. The 100-crystal upgrade on top of the unit is still the barrier.

## Evolved personalities for v0.19 (captured factories pay 10 a turn; Infantry, not Scout Bikes, hit air)

Same settings as before (`node evolve.js --generations 40 --population 20 --games 10 --seed 1`); full tables in `docs/evolution.md`.

- The five best beat the hand-tuned AI in 81–89% of 100 games each.
- They capture about 3 factories a game, and infantry are about a third of what they build (27–35%). Capturing is now central to how the AI plays.
- Scout Bikes are still half their army (38–59%), with Tanks about 13%. Even without hitting air, the bike is the cheap crystal carrier and skirmisher.
- They still never buy an upgrade. Their personalities' names (from their unit mix, e.g. "Tank and Heavy Cannon") describe what they would like, not what they build when they buy what they can afford.

## Factory upgrades and unused factories (v0.12, hand-tuned AI)

Fixed map 1, 200 games: the first player wins 57.3% (blue 26.6%); 41 games end with a home factory destroyed, 158 with a player out of units. The 40-crystal bonus still roughly holds for the first player, but blue's seat on fixed map 1 is weak with this AI.

30 games on each shape (maps 1–30, default AI both sides):

| Shape | Captures per game | Infantry built per game | Upgrades bought (30 games) |
|---|---|---|---|
| Classic | – (no unused factories) | 0 | Airfield 26, Heavy works 6 |
| 3-4-4-3 | 4.0 | 10 | Airfield 20, Heavy works 3 |
| 4-5-5-4 | 5.9 | 21 | Airfield 20, Heavy works 6 |

Capturing is cheap and instant, so factories change hands back and forth: a captured factory can be retaken by one 20-crystal infantry walking in, and the AI keeps sending more. Options if this feels wrong in play: capturing takes a turn (infantry must start their turn next to the factory), or a factory with a defender next to it cannot be captured.

## Evolved personalities (v0.12 rules, `node evolve.js --generations 40 --population 20 --games 10 --seed 1`)

Full tables in `docs/evolution.md`. Games were played on fixed map 1 and generated maps of every shape.

- The five best personalities beat the hand-tuned AI in 86–93% of 100 games each (the run under the v0.11 rules managed 62–76%).
- All five are impatient (`patience` 0): they buy the best unit they can afford now rather than saving. In practice they build Scout Bikes (34–39%), Tanks (26–30%), Light Medics (16–22%) and harvesters, and almost no anti-air.
- None of them ever buys a factory upgrade or captures a factory (`captureFactories` 0). Their mix still rates the Heavy Cannon highly (hence the names), but at 110 plus a 100 upgrade it is never affordable on their terms.
- What this says about the rules: a fast swarm of cheap light units, kept alive by medics, beats everything behind an upgrade, and spending on infantry and capture does not pay off yet. If upgrades and captures are meant to matter, the levers are cheaper upgrades, stronger heavy units, more income from a captured factory, or capture that is harder to undo (so it is worth the cost). Each can be tested in the simulator before changing the game.

## Balance experiment: what makes upgrades and captures worth it? (v0.14 rules)

`sh tools/balance.sh upgrades` evolves personalities under each rule variant (20 generations, 16 personalities, 8 games each, seeds 1 and 2, all map shapes); `node tools/balance-summary.mjs upgrades` gives the table. Each row covers the best 3 of each seed, benchmarked over 60 games against the hand-tuned AI. Reports per run are in `docs/balance/upgrades/`.

Variants:
- **cheap-upgrades**: Heavy works and Airfield cost 50 instead of 100.
- **strong-heavy**: Heavy Cannon 50 attack and 50 defence; Blast Cannon 50 attack and 15 defence; Sonic Tank 20 attack and 25 defence.
- **slow-capture**: infantry must start their turn next to a factory to capture it (`capture.mustStartNextTo`).
- **guarded-capture**: a factory with one of its owner's units next to it cannot be captured (`capture.guarded`).
- **combined**: cheap upgrades, strong heavy units and slow capture together.

| Variant | Wins vs default AI | Heavy works / game | Airfield / game | Captures / game | Patience | Capture gene | Most built |
|---|---|---|---|---|---|---|---|
| baseline | 81% | 0.0 | 0.0 | 0.7 | 0.1 | 0.5 | Scout Bike 37%, Light Medic 18%, Infantry 12%, Light Harvester 11% |
| cheap-upgrades | 72% | 0.0 | 0.3 | 1.1 | 0.2 | 1.2 | Scout Bike 24%, Infantry 20%, Light Medic 16%, Anti-Aircraft Jeep 10% |
| combined | 84% | 0.0 | 0.5 | 0.0 | 0.2 | 0.0 | Scout Bike 36%, Light Medic 20%, Tank 10%, Attack Helicopter 9% |
| guarded-capture | 82% | 0.0 | 0.0 | 1.0 | 0.3 | 1.3 | Scout Bike 27%, Infantry 25%, Light Medic 18%, Tank 13% |
| slow-capture | 79% | 0.0 | 0.0 | 0.0 | 0.2 | 0.0 | Light Medic 25%, Artillery 21%, Scout Bike 17%, Tank 16% |
| strong-heavy | 87% | 0.0 | 0.0 | 0.0 | 0.1 | 0.0 | Scout Bike 42%, Light Medic 22%, Tank 12%, Light Harvester 11% |

What it shows:
- **Heavy works never pays** in any variant, even at half price with stronger heavy units. The Airfield is bought only when cheap, about once every 2–3 games.
- **Impatience wins everywhere** (patience 0.1–0.3): buy what you can afford now. The winning army is the same each time: Scout Bikes (cheap, fast, hit ground and air), Light Medics to keep them alive, Tanks.
- **Capturing pays a little** at the current rules (0.7 captures a game, infantry 12% of builds), more with cheap upgrades or guarded capture (about 1 a game, infantry 20–25%). Making infantry start next to the factory (slow-capture) kills capturing entirely: in the AI's hands the infantry die first.
- So upgrade costs and heavy-unit stats are not the bottleneck. Games are short (most end around round 20 with one side out of units) and income is low, so anything costing 200 crystals all in arrives too late. Scout Bike plus Light Medic is the efficient core.
- Levers worth testing next: a weaker or dearer Scout Bike or Light Medic; more income (bigger starting piles, faster growth or bigger harvesters); or an income bonus from a captured factory, which would make capturing worth fighting over.
- Caveats: two seeds and 20 generations per variant, so differences of a few percent are noise; the AI's use of heavy units is simple, so a human may get more from them than it does.

## Balance experiment: economy, Scout Bike and Light Medic (v0.16 rules)

`sh tools/balance.sh economy`, same settings as the upgrades experiment; reports in `docs/balance/economy/`, table from `node tools/balance-summary.mjs economy`.

Variants:
- **dear-scout**: Scout Bike costs 45 instead of 30.
- **weak-scout**: Scout Bike attack 10 instead of 15.
- **dear-medic**: Light Medic costs 60 instead of 40.
- **more-income**: 100 starting crystals, a new pile after every turn (not 0 or 1), new piles of 20.
- **capture-income**: each captured factory pays its owner 10 crystals at the end of their turn (`capture.incomePerTurn`, a new option, off by default).
- **combined**: dear Scout Bike, dear Light Medic and capture income together.

| Variant | Wins vs default AI | Heavy works / game | Airfield / game | Captures / game | Patience | Capture gene | Most built |
|---|---|---|---|---|---|---|---|
| baseline | 92% | 0.0 | 0.0 | 0.0 | 0.3 | 0.0 | Scout Bike 45%, Light Medic 27%, Tank 21%, Light Harvester 6% |
| capture-income | 81% | 0.0 | 0.0 | 3.1 | 0.2 | 2.0 | Infantry 32%, Scout Bike 31%, Light Medic 13%, Anti-Aircraft Jeep 9% |
| combined | 72% | 0.3 | 0.3 | 3.0 | 0.3 | 2.0 | Infantry 49%, Scout Bike 15%, Tank 12%, Spotter Drone 5% |
| dear-medic | 74% | 0.0 | 0.0 | 1.2 | 0.1 | 0.8 | Scout Bike 45%, Infantry 20%, Tank 16%, Light Harvester 9% |
| dear-scout | 81% | 0.0 | 0.0 | 0.0 | 0.3 | 0.0 | Scout Bike 34%, Light Medic 30%, Tank 22%, Artillery 10% |
| more-income | 87% | 0.0 | 0.0 | 1.2 | 0.3 | 0.5 | Scout Bike 31%, Artillery 16%, Infantry 13%, Tank 13% |
| weak-scout | 89% | 0.0 | 0.0 | 0.0 | 0.1 | 0.0 | Scout Bike 33%, Light Medic 32%, Tank 20%, Artillery 7% |

What it shows:
- **Income from captured factories is the lever that makes capturing matter.** At 10 crystals a turn, the best AIs capture about 3 factories a game and infantry become a third to a half of what they build. In the combined variant they also start buying both upgrades (about once every 3 games), the first time Heavy works has been bought at all.
- **The Scout Bike is hard to dislodge.** At 45 crystals or attack 10 it is still the most built unit. It is cheap, fast, carries crystals and hits air, so it does too many jobs; the medic share rises to fill the gap.
- **A dearer Light Medic** pushes armies away from bike-and-medic towards infantry and tanks, and brings some capturing (1.2 a game).
- **More income** widens the army (artillery appears) and brings some capturing, but still no upgrades.
- **Heavy works stays almost unused** everywhere: heavy units at 80–110 plus a 100 upgrade do not pay back within these short games.
- Noise check: the current-rules baseline captured 0.7 a game in the first experiment and 0 here, so differences under about 1 capture a game, or 10% in win rate, are not reliable.

## Generated maps (100 games each, current rules, `--map`)

After return fire became simultaneous and the fixed map's Crystal Cave moved back to the one hex 7 moves from both factories:

| Map | Blue wins | First player wins |
|---|---|---|
| Fixed map 1 | 77.8% | 68.7% |
| Map 1 | 82.0% | 48.0% |
| Map 2 | 60.8% | 61.9% |
| Map 3 | 49.5% | 99.0% |
| Map 4 | 57.0% | 91.0% |
| Map 5 | 63.3% | 87.8% |
| Map 6 | 48.5% | 14.4% |
| Map 7 | 27.6% | 64.3% |
| Map 8 | 43.0% | 93.0% |
| Map 17 | 15.2% | 65.7% |

Every generated map passes the same checks (all hexes reachable, factories not hemmed in, deposits the same path distance from both sides), yet the results range from 15% to 82% for blue. Equal distances are not enough to make a map fair: what matters is which side can threaten the other's harvesters first. The simulator can screen maps (for example, keep only those within 40–60% on both measures) before they are offered.

## Crystal rule variants (200 games each, line-of-sight fog)

| Crystals rule | Median length | Stalled | First player wins |
|---|---|---|---|
| Piles block movement | 16 | 7.5% | 54.1% |
| Piles can be driven over, not destroyed | 12 | 0% | 98.5% |
| Driven over and destroyed (current) | 11 | 0% | 17.8% |

With piles blocking movement, spawned crystals walled off the middle of the map by round 30–40 and armies could not reach each other. That stall is gone with the current rule.

## What the numbers say

- **Fixed map 1 is not fair between the two sides.** The deposits are the same path distance from each factory, but the hexes next to them are not equally exposed. With block fog, everything is visible from round 1 and the side that can reach firing range of the other's harvester first wins: green wins 98% of AI games. On an exact mirror-image map the colour bias disappears (50–55%), so the cause is the layout, not the AI. Fair varied maps need checking with the simulator before use.
- **Block fog with full sight range turns over almost the whole map at once.** 11 of 12 blocks are face up after round 1 on a 12-block map, mostly because the factory sees 4 hexes. Turning over only blocks next to a unit leaves half the map to explore.
- **Who moves first still matters too much.** On the mirror map, with the same AI on both sides, one seat wins 100% or 20% of games depending on the fog rule. Part of that is the AI making the same choices every time; part is the opening race for the central deposits.
- **Games end by elimination, not by destroying the factory.** A factory has defence 100, so it takes 100 damage in a single turn to cost it a life. Games end when one side has lost every unit and cannot afford a 30-crystal Scout Bike.
- **Comebacks are rare.** The player behind on crystals plus army value at mid-game wins about 2–6% of games.
- **Harvesters are the soft target.** With defence 15 and no attack, they are usually the first units lost.

These results come from a simple rule-based AI that makes the same choice every time in the same position. A stronger AI may change them, especially the first-player figures.
