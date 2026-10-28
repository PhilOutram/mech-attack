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
