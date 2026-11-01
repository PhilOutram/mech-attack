# Open issues and backlog

One page to check at any time: problems not yet solved, decisions waiting for Phil, and work agreed but not started. Each item links to where the detail lives. Move an item out when it is settled, and note the version it was settled in.

## Unresolved problems

- **Sight stops at the edge of explored ground** (Phil, 1 November 2026). A block turns over only when a unit is on it or next to it (`fog.revealRange` 1), so a unit with sight 4 parked at the edge cannot see into the face-down block beside it. An enemy can wait there unseen and attack next turn. Options measured on map 1 (`docs/ideas-backlog.md`, "Measured 1 November 2026"):
  - turn over every block in sight: captures rose from 175 to 226 games and the first player went from winning 12% of decided games to 77%;
  - turn over blocks within 2 hexes: not yet measured;
  - keep the tiles as they are but show enemy units on face-down ground a unit can see: not yet measured.
- **The second player wins most games on map 1** (first player 12 to 19% of decided games). Probably tied to how fast each side explores (see the sight problem above). Look at `start.secondPlayerCrystals` and at other maps.
- **The Infantry rush is the strongest strategy.** Evolved AIs build Infantry for about half their units and win about 80% of games against the hand-tuned AI. Infantry move 2 cuts captures by about a third but lengthens games and caused some stalls. Phil is playing games out before deciding.

## Decisions waiting for Phil

- **Retiring units and rules:** Twin Turret, Transporter and Chinook (with boarding and drop-off), Fighter, Blast Cannon, Sonic Tank. Evidence in `docs/balance/unit-use.md`. Left as they are while Phil plays games out (1 November 2026).
- **Tank:** leave it, or defence 20 (halves its value as an answer; see the ideas log).
- **Supply depot** upgrade for sending crystals straight to an ally: Phil is unsure.
- **Capturing:** should overrunning a factory take longer than one move?
- **Transporter:** should it fly, as the unit table's A3 Transport does?
- **Turret overwatch details** (v0.84, provisional): it fires automatically, once at each unit between phases (twice for the Twin Turret, at different units); the unit carries on if it survives and does not fire back; it needs the Turret's owner to have turned over the ground. Units that arrive by script, are built or are dropped off are not fired on.
- **Role kit contents** (v0.84, provisional): which units and upgrades each of Vanguard, Bastion, Skywing and Foundry gets (`docs/rules.md`).
- **Orange and white players** (v0.84, provisional), made by the recolour tools from the blue art, not drawn. Phil may want to draw his own. Team missions with six sides use orange.
- **Scripted effects with no rule behind them** (v0.85): old factories waking for the Lattice (What Sleeps Below), crater walls opening when relays fall in the same round (Ashfall, Echo), relays going dark (The Lamplighters), and units or crystals simply arriving. Phil, 1 November 2026: stick to the game's own mechanics; tunnelling has gone, these are waiting for his word.
- **Map variety in the team campaigns:** every mission has its own generated layout, but only two outlines: the 24-block 4-5-6-5-4 for 3 or 4 sides and the 37-block hexagon for 5 or 6. All ten 4-player missions are on the hexagon.
- **Team campaign difficulty:** every mission needs playing by people. The AI trials cannot judge missions that need a plan (strikes in the same round, waiting by an ally's factory, leaving a camp standing).

## Backlog: agreed, not started

- **Riding an ally's transport** (approved for the co-op campaigns, 31 October 2026; left on the backlog 1 November 2026).
- **Up to 8 sides,** once the new colours are drawn. Since v0.84 there are 7 colours (white waits for a map that takes 7 sides); games have at most 6 sides.
- **Ruin art** to replace the placeholder.
- **Refresh `Unit Table.xlsx`** from the current stats (back it up first).
- **An AI that knows a mission's objective**, so `tools/team-trials.mjs` can judge the missions that need a plan, and so AI allies help with the objective rather than just fighting.

## On hold

- **Event cards with a forecast** (idea 8 in the ideas log). Phil: wait.

## Where else to look

- `docs/ideas-backlog.md`: every idea, the measurements behind it and the parked ideas.
- `docs/rules.md`: the rules, with every provisional choice marked.
- `docs/multiplayer.md`: multiplayer rules still to decide, at the end.
