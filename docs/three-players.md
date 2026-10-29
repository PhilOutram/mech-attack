# You against two AIs

Phil asked (29 October 2026) what it would take to play against two AI opponents: a three-way map with one human and two AIs first, and later four players (two humans and two AIs, on the table only). This note sets out what changes and what to decide. Nothing here is built yet.

## What the code assumes today

The engine, AI and screens are written for two players, but less of it is hard-wired than it looks:
- The state already holds `players` as a list, a turn `order` list and `current`, and every unit has an `owner`. Turns already walk through `order`, so a third entry would take its turn.
- The two-player assumptions are few and easy to find: `1 - player` in seven places (the second player in `newGame`, the winner on resigning and on a loss, and the AI's idea of "the enemy" and "the enemy factory"), plus the two colours in `PLAYER_COLOURS`, `HUMAN`/`AI_PLAYER` on the game screen, and maps that hold exactly two factory sites.
- Fog of war is already per player (each player's turned-over blocks), so it works for any number.

## Changes needed

1. **Engine.** `newGame` takes a player count. "Enemy" becomes "anyone else" (it mostly is already: `isEnemy` compares owners). A player who loses is knocked out: their turns are skipped and their units removed (or left as wrecks). The game ends when one player is left. Resigning hands nothing to anyone in particular.
2. **Maps.** A three-way map needs three home blocks spread evenly, with fair crystal piles and unused factories for each side. The current fairness checks compare blue's and green's path costs; they would compare all three. A triangular layout of blocks (rows such as 3-4-5-4-3 with homes at three corners) is the natural start. Four players would use the four corners of a square layout.
3. **AI.** The AI picks one target: the nearest threat, or the weakest opponent, or whoever is winning. That choice is a new gene, so evolution can find out which pays. It also has to defend against two directions at once. Without this the two AIs would mostly fight each other, which is not much of a game for the human, or both pile onto the human, which is too hard.
4. **Screens.** A third colour (yellow, from the token sheets), turn and round banners naming whose go it is, and game-over text for being knocked out while the others play on (or being told who won).
5. **Simulator and evolution.** Free-for-all games score by finishing place, not win or loss.

## Questions for Phil

- Can AIs ally against the human, or is it every player for themselves? Every player for themselves is simpler and is the board game's rule as far as we know.
- When a player is knocked out, do their factories become unused (for anyone's infantry to take) or are they removed?
- Should the human get a head start against two AIs, like the difficulty levels (more crystals, an extra unit)?

## Suggested order

Three-player engine and a triangular map first, played AI against AI in the simulator to check it is fair and ends. Then the game screen for one human against two AIs. Four players with two humans needs pass-and-play turns or the table-side tools, so it comes last.
