# Rings of three: where units beat each other in a circle

Phil, 31 October 2026: the best strategy comes from three-way counters, where A beats B, B beats C and C beats A, so a player has to bring the right answer to each fight. This note records where such rings exist with the unit stats of v0.77 (Attack Helicopter hits air; Fighter costs 45; Blast Cannon defence 15).

Two measures:

- **Duels** (`node tools/duels.mjs`, `duels.json`): one unit against one, worked out from the rules, on open ground, with a spotter, and on rocky ground. A ring counts only if each unit wins whoever fires first.
- **Equal-value battles** (`node tools/terrain-matchups.mjs`, `terrain-counters.json`): 200 crystals' worth of one type against 200 of another, played out by the AI 4 times a pairing on four kinds of ground. A unit beats another when it scores 0.25 or more (+1 is a clean win). Four games a pairing is few, so a ring near the threshold can come and go between runs.

## What the numbers say

Unit against unit, the ground units form a ladder: the bigger, dearer unit wins almost every duel (Heavy Cannon beats everything on the ground). Rings come from three places only.

1. **The air layer.** Almost every ring is the same shape: the Anti-Aircraft Jeep beats the Attack Helicopter, the helicopter beats a ground unit, and that ground unit (it cannot be hit by the Jeep, which only hits air) beats the Jeep. Infantry and Scout Bikes close the ring cheaply; Tanks, Heavy Tanks, Heavy Cannons, Blast Cannons and Sonic Tanks close it on most ground. The Fighter makes a second air ring: Infantry beat Fighters (which cannot hit ground), Fighters beat helicopters, helicopters beat Infantry.
2. **Range against units that cannot move.** With a spotter, a Tank kills a Turret's neighbour from out of reach: Turret beats Tank, Tank beats Blast Cannon, Blast Cannon (range 4 with a spotter, outside the Turret's 3) beats Turret.
3. **Ground.** Rings among ground units alone appear only on particular ground:
   - Open plain: Infantry beat Artillery (they close in under its minimum range of 2), Artillery beats Scout Bikes, Scout Bikes beat Infantry.
   - A mountain ridge with one pass: Artillery beats the Blast Cannon, the Blast Cannon beats the Sonic Tank and the Heavy Tank, and both of those beat Artillery. In the pass the defenders' ranged fire meets the attackers one at a time.
   - Rocky ground (defence +5) adds the Sonic Tank > Attack Helicopter > Blast Cannon ring in duels.

## Gaps

- There is no ring among the cheap and middle ground units on most ground: Scout Bike, Tank, Artillery, Sonic Tank and Blast Cannon line up by cost. Units with a real weakness to a cheaper unit would make more rings (for example a unit that cannot fire next door, like Artillery, but tougher).
- Rings that need a spotter or a pass come from the map, which is good: the same army can be right in one place and wrong in another. Campaign missions could be built round each one (see `docs/campaigns.md`).
