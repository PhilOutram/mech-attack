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
