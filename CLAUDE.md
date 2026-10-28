# Mech Attack

Mech Attack is Phil's hex-based strategy board game set on Mars, inspired by Battle Isles. It is a physical game with printed tiles and tokens. This repo is its companion web app, published on GitHub Pages at https://philoutram.github.io/mech-attack/.

The app is growing from a unit reference into:
1. a playable digital version against an AI opponent, using Phil's own tile and token art
2. a headless simulator for testing game balance
3. later, table-side tools for the physical game (crystal spawn screen, event forecast, camera-based AI opponent)

The design ideas, existing assets and open questions are in `docs/ideas-backlog.md`. Read it before any game-design or rules work.

## Working with Phil
- Windows 11, PowerShell. Give commands in PowerShell syntax.
- British English in all text, comments and UI.
- Keep explanations concise and technically precise, and be honest about trade-offs.
- No "AI speak" in docs, UI text or commit messages. Headings state the point plainly. Avoid paired double-clause constructions such as "Two stories, and they point opposite ways".
- When a rule is undecided, ask Phil rather than inventing it silently. If you have to pick something to keep going, put it in the rules config, mark it provisional and list it in `docs/rules.md`.

## App conventions (already in the code)
- Plain HTML, CSS and JavaScript ES modules. No build step, no framework, no bundler. Keep it that way unless Phil agrees otherwise.
- Hosted on a GitHub Pages subpath (`/mech-attack/`), so all paths must be relative. Never start a path with `/`.
- Installable PWA with an offline service worker (`sw.js`).
- Mobile first: it must work on a phone and a tablet held in portrait, as well as a desktop browser.
- Dark Mars theme: colour tokens are on `:root` in `styles.css`; the title font is Orbitron.
- `units.js` holds unit stats copied from `Unit Table.xlsx`. `null` means not yet decided.

## Every publish
1. Bump `VERSION` in `version.js` and prepend a `CHANGELOG` entry (newest first, date as YYYY-MM-DD).
2. Update every `?v=` cache-busting number to match: the `<link>` and `<script>` tags in `index.html`, the `import` lines in each JS module, and the `ASSETS` list in `sw.js`.
3. Update `CACHE` in `sw.js` to the new version.
4. Add every new file the app needs offline to `ASSETS` in `sw.js`. A file missing from that list breaks offline play.

## Art sources
Phil drew all the token art himself in Fireworks. The originals live on OneDrive:
- Map tiles: `C:\Users\phil_\OneDrive\SHARED - FamilyO - LOCAL\Games\MechAttack\Map Tiles`
- Units: `C:\Users\phil_\OneDrive\SHARED - FamilyO - LOCAL\Games\MechAttack\Units`

Rules for using it:
- Never modify, move or delete anything in those folders. Read only.
- Copy what the app needs into the repo, downscaled for the web. The source PNGs are 10–14 MB each; aim for well under 200 KB per tile or token image.
- Put tiles in `tiles/` and tokens in `units/` (six unit images already exist there).

What is where:
- `Map Tiles\Mech Attack Tiles v3 - smaller for printing.png` is the latest tile sheet. Terrain types: plain ground, rocky ground (sparse to dense rocks), mountain, chasm (a crack across several hexes, plus a single-hex version). Hexes are red with dark grey borders.
- `Map Tiles\Mech Attack - Map Page 1.png` to `Page 7.png`: seven-hex clusters (a centre hex plus a ring of six).
- `Units\Units - Mars.pptx`: print sheets of top-down tokens in red, blue, green and yellow, each with a "firing" variant showing a muzzle flash, plus crystal and storage tokens. The images can be pulled out of the pptx's `ppt/media` folder.
- `Units\Crystals.png`: crystal art in red, purple, green and blue.
- `Units\Unit Cards.pptx`: painted card art (AI-generated hero images, not Phil's token style).
- `Units\Unit Table.xlsx`: stats, rule notes, a playtested "Game 2" unit set and card ideas.

## Architecture for the game and simulator
The rules must be written once and shared:
- `engine.js`: pure game rules. No DOM, no `window`, no timers. Takes a state and an action and returns a new state. Uses a seeded random number generator passed in through the state, so any game can be replayed exactly.
- `rules-config.js`: all balance numbers (costs, growth rates, spawn chances, radii) as data, separate from the logic, so tuning never means editing engine code.
- `ai.js`: picks moves using only the engine's public functions. Start simple (greedy, rule-based); more advanced search can come later.
- Game UI: renders state and turns taps into actions. No rules logic in the UI.
- `sim.js`: runs AI against AI headless in Node, e.g. `node sim.js --games 1000 --seed 1`, and prints balance metrics.

Game state must be plain JSON so it can be saved to `localStorage`, replayed and logged.

## Testing
- Engine tests use Node's built-in runner: `node --test`. Every rule gets a test.
- Run the simulator after any rules change and report how the metrics moved.
- Check UI changes in a real browser at phone and desktop widths. Serve locally with `python -m http.server 8000` (or `npx serve`), because ES modules do not load from `file://`.
