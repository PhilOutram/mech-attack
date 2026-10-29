# Art brief: factory upgrade badges

For the chat that prepares Mech Attack's tile and token images. Phil wants a factory's upgrades to be obvious at a glance on the board (29 October 2026).

## What is needed

Three badges, drawn on top of the factory token when the factory has that upgrade:

| Upgrade | What it does | Idea from Phil | File |
|---|---|---|---|
| Airfield | Builds air units | A helipad | `units/upgrade-airfield.svg` |
| Heavy works | Builds heavy units | Something chunky for heavy weapons | `units/upgrade-heavy-works.svg` |
| Crystal lab | Makes crystals every turn | A crystal greenhouse or bubble | `units/upgrade-lab.svg` |

The files in the repo now are simple placeholders drawn by `tools/placeholder-tokens.mjs` (a helipad, a gear with a warning triangle, and a glass dome over blue crystals). Replace them with Phil's art.

## Format

- Square image, transparent background, the badge filling most of the square. The game draws each badge at about 42% of the hex's height, so it must read at about 40 pixels across on a phone: bold shapes, thick dark outlines, no fine detail.
- One version for both players (the factory already has a blue or green ring).
- SVG is best. A PNG works too, at 200 x 200 pixels and well under 50 KB; if it is a PNG, change the file name in `UPGRADE_BADGES` in `board.js` and in the `ASSETS` list in `sw.js`.
- Style to match Phil's token art: top-down, flat colours, dark outlines, the same light direction as the factory token (`units/factory.svg`).

## Where the badges sit

On the factory hex (`UPGRADE_BADGES` in `board.js`, as shares of the hex): Airfield top right, Heavy works top left, Crystal lab bottom centre. A factory can have any of the three, so each must look right on its own and alongside the others.

## Alternative

Instead of badges, three (or more) whole factory tiles with the upgrades built in. That reads better but needs a tile for every combination (up to 8), so badges are the simpler start.
