# Open issues and backlog

One page to check at any time: problems not yet solved, decisions waiting for Phil, and work agreed but not started. Each item links to where the detail lives. Move an item out when it is settled, and note the version it was settled in.

## Unresolved problems

- **Units still attack from out of sight.** v0.88 cut the share of shots from an attacker the victim could not see from 28% to 20%, but 45% of each attacker's first shots still come out of the dark: move plus range (Tank 3 + 2) still beats sight 3. Mountains blocking sight now matter more. Next steps if it still feels wrong in play: sight 4 for ground units, or shorter ranges. Battle Isle 2 had fighting units see about half as far as they move (`docs/battle-isle.md`).
- **The first player's share of wins swung** from 40% to 55% of decided games on fixed map 1 with v0.88's move and sight (hand-tuned AI both sides), and to 62.5% once moves stop when an enemy comes into view (v0.89). Before that the second player won most games on map 1. Look at `start.secondPlayerCrystals` once the AI is re-evolved for the new figures.
- **Games are longer** with v0.88: mean 25 rounds on fixed map 1 (was 17), with a long tail (90th percentile 44, one game in 200 hit the round limit).
- **The Infantry rush is the strongest strategy.** Evolved AIs build Infantry for about half their units and win about 80% of games against the hand-tuned AI. It survived Infantry moving 2: re-evolved for v0.88's figures, the best two-player AIs still build Infantry for 43-49% of their units and win 78-82%.
- **The AI personalities were evolved for the old move and sight.** Re-evolved on 21 November 2026 for v0.88's figures, but before moves stopped when an enemy comes into view (v0.89); worth evolving again once that rule is settled.

## Decisions waiting for Phil

- **Retiring units and rules:** Twin Turret, Transporter and Chinook (with boarding and drop-off), Fighter, Blast Cannon, Sonic Tank. Evidence in `docs/balance/unit-use.md`. Left as they are while Phil plays games out (1 November 2026).
- **Tank:** leave it, or defence 20 (halves its value as an answer; see the ideas log).
- **Stopping when an enemy comes into view** (v0.89, provisional details): an ally's units and factories do not stop a move (`docs/rules.md`, fog).
- **Move and sight details** (v0.88, provisional): Artillery and the Sonic Tank keep their move while every other unit loses 1; the Heavy Cannon drops to move 1; air units see 5, including the Spotter Drone and the Chinook (`docs/rules.md`, "Move and sight").
- **Capture cutaway** (v0.88): a placeholder drawn in code. Phil to draw the layers (factory wall, door, infantryman, doorway glow) if he wants his own art. The torch and the clang are now recorded CC0 clips from freesound (credited in `CREDITS.md`); the door's groan is still made in code. Levels are a first guess from measured loudness: Phil to say if the weld or clang is too loud or too quiet.
- **Supply depot** upgrade for sending crystals straight to an ally: Phil is unsure.
- **Capturing:** should overrunning a factory take longer than one move?
- **Transporter:** should it fly, as the unit table's A3 Transport does?
- **Turret overwatch details** (v0.84, provisional): it fires automatically, once at each unit between phases (twice for the Twin Turret, at different units); the unit carries on if it survives and does not fire back; it needs the Turret's owner to have turned over the ground. Units that arrive by script, are built or are dropped off are not fired on.
- **Role kit contents** (v0.84, provisional): which units and upgrades each of Vanguard, Bastion, Skywing and Foundry gets (`docs/rules.md`).
- **Orange and white players** (v0.84, provisional), made by the recolour tools from the blue art, not drawn. Phil may want to draw his own. Team missions with six sides use orange.
- **Map variety in the team campaigns:** every mission has its own generated layout, but only two outlines: the 24-block 4-5-6-5-4 for 3 or 4 sides and the 37-block hexagon for 5 or 6. All ten 4-player missions are on the hexagon.
- **Team missions after v0.89:** in the AI trials The Long Night and Breach went from about half won to 5 of 5, and The Overseer's Code from 4 of 4 won to stalling every game (`docs/campaigns.md`). Play these first; ease or tighten them if people find the same.
- **Team campaign difficulty:** every mission needs playing by people. The AI trials cannot judge missions that need a plan (strikes in the same round, waiting by an ally's factory, leaving a camp standing).

## Backlog: agreed, not started

- **Riding an ally's transport** (approved for the co-op campaigns, 31 October 2026; left on the backlog 1 November 2026).
- **Up to 8 sides,** once the new colours are drawn. Since v0.84 there are 7 colours (white waits for a map that takes 7 sides); games have at most 6 sides.
- **Ruin art** to replace the placeholder.
- **Refresh `Unit Table.xlsx`** from the current stats (back it up first).
- **Engineers building scout posts** that give sight round them (idea, Phil, 1 November 2026; in the ideas log with the other Engineer ideas).
- **An AI that knows a mission's objective**, so `tools/team-trials.mjs` can judge the missions that need a plan, and so AI allies help with the objective rather than just fighting.

## On hold

- **Event cards with a forecast** (idea 8 in the ideas log). Phil: wait.

## Where else to look

- `docs/ideas-backlog.md`: every idea, the measurements behind it and the parked ideas.
- `docs/rules.md`: the rules, with every provisional choice marked.
- `docs/multiplayer.md`: multiplayer rules still to decide, at the end.
