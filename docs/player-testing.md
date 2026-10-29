# Learning from players

The plan for learning from people who play the app (agreed with Phil, 29 October 2026).

## What Phil wants
Store every game whose player agrees to share it, with enough around it to see how people
use the app: what they play, how long games and visits last, whether they come back, which
missions and maps they play, wins and losses, and when they turn help off. Use the stored
games to find tactics the AI lacks, starting with wins at the top rank.

Phil's decisions (29 October 2026):
- No watched play sessions. Phil tests tactics in his own games.
- Opt-in players' games are all stored, not just ones they choose to send.
- The whole app moves to Vercel.
- Data goes into Postgres, with an export that writes a log file per player.

## Facts from the code that shape the plan
- A game is a complete record already: the state holds `rules`, `map`, `seed`, the setup and
  `actions` (every move by both sides). Replaying the actions rebuilds every position, and
  `viewFor` gives what the human could see at each decision.
- It is small: about 15 KB of JSON, about 3 KB gzipped, measured on AI-v-AI games on fixed
  map 1 (10-14 rounds, 124-175 actions).
- Any change to engine logic can stop an old record replaying. Each record carries
  `VERSION`, each publish gets a git tag, and the replay tool loads `engine.js` from that tag.
- Undo rewinds the state, so undone moves vanish from `actions`; undos are recorded as
  events instead.
- The ranks are cadet, major and marshal (`difficulty.js`). Marshal wins are the first
  games to study.

## Hosting: move the app to Vercel
GitHub Pages cannot receive data, so the collector needs Vercel either way.

| | Whole app on Vercel | App stays on GitHub Pages, collector on Vercel |
|---|---|---|
| Collector | `api/` in the same repo and site; same origin, no CORS | A second project; cross-origin calls need CORS headers |
| Publishing | Push to `main` deploys both | Two places to deploy |
| Old URL | `philoutram.github.io/mech-attack` stops being the home; it becomes a page that links (or redirects with a meta refresh) to the new address | Unchanged |
| Players' saves | A new address is a new origin: saved games, campaign progress, tips and settings on the old address do not carry over | Unchanged |
| Conventions | Still no build step: Vercel serves the static files as they are, and functions in `api/` run in Node. Paths are already relative, so the site works at the root | Unchanged |

Decision (Phil): move the whole app, before the LinkedIn post, while few people have
progress to lose. Link the existing public repo to a new Vercel project rather than using
`new-vercel-app` (that skill creates a new private repo). Address: `mech-attack.vercel.app`
or a custom domain (provisional, Phil to choose). The old Pages site becomes one page
pointing to the new address, and its service worker is replaced by one that unregisters
itself so installed copies pick up the notice.

## Storage: log per player
Vercel functions have no lasting disk, so they cannot append to a log file on the server.
Three ways to get the same result:

| Option | How | For | Against |
|---|---|---|---|
| Postgres (Neon, through the Vercel marketplace) | An `events` table and a `games` table, each row tagged with the player id; JSON columns hold the details | Questions across all players ("wins per mission", "round people leave at") are one query; free tier holds well over 100,000 games | Needs a small export step to get files |
| Redis (Upstash) list per player | Each event is appended to `player:<id>`: literally a log per player | Closest to "a log file per player" | Questions across players mean dumping every list first |
| Blob storage | One JSON file per game or per batch of events, under `players/<id>/` | Plain files | Cannot append; many small files; write operations are rationed on the free plan |

Decision (Phil): Postgres, plus `tools/players.mjs export`, which writes
`data/players/<id>.jsonl` (one line per event, game records included) on Phil's machine.
That gives Phil a log file per player, and the database answers the cross-player questions.
`data/` is git-ignored: player data never goes in the public repo.

## Privacy and consent (UK and EU)
Not legal advice; check the ICO's current guidance before launch.

- Storing anything on a player's device that they did not ask for (a cookie, or an id in
  `localStorage`) needs consent under PECR in the UK and the ePrivacy rules in the EU. Saves
  and settings are fine: the player asked for them. The UK's Data (Use and Access) Act 2025
  relaxes this for basic analytics, but the EU has not, and LinkedIn reaches EU contacts, so
  design to the EU rule.
- Nothing is sent until the player says yes. One card on first launch, before the first
  game: "Help Phil improve Mech Attack? Share anonymous records of your games and how you
  use the app. No names, no email, nothing about you. [Yes, share] [No thanks]". The same
  switch in Settings, and a link to the privacy note.
- Anonymous: a random player id made on the device after a yes. No names, emails or
  accounts. IP addresses are not stored (Vercel's own request logs keep them briefly, and
  the note says so). The id is shown in Settings so a player can ask for deletion; turning
  sharing off deletes the id.
- Privacy note: one short page in the app. Who collects (Phil), what, why (to improve the
  game and its AI), where it is stored, how long (provisional: 12 months, then deleted),
  how to turn it off and ask for deletion. No third parties, nothing sold, no other use.
- Phil is the data controller even as a hobbyist, because the app is public. Check the ICO's
  fee self-assessment; non-commercial hobby use is usually exempt.

## What to record
Every event carries the player id, app version, a time stamp, a visit id, and for game events
a game key (map id plus seed), so one game's events link up.

| Event | Fields |
|---|---|
| Visit started | Installed or in a browser; phone, tablet or desktop; first visit's source (e.g. LinkedIn, from the link's `?from=` tag) |
| Visit ended | Seconds on the app, sent with `sendBeacon` when the page is hidden |
| Game started | Campaign mission or skirmish; rank; map; new or resumed |
| Game finished | Win, loss or surrender; rounds; minutes played; undos used; surrender demanded and its outcome |
| Game left unfinished | Round and mission when the visit ended mid-game (a later resume shows they came back) |
| Turn | Seconds the human's turn took |
| Undo | Round, and the move undone |
| Help | Tips turned off (with how many games and minutes in), Help reopened |
| Campaign | Mission unlocked, mission picked |
| Error | Message, file and line |
| Game record | `VERSION`, rules, map, seed, setup, first player, actions; sent when the game ends, or with "game left unfinished" |

Events queue in `localStorage` while offline and are sent in batches when online. The
collector caps request size and rate per id, and the tools ignore records that do not replay.

## The report
`tools/players.mjs report` prints, from the database:
- Players, visits, and how many came back on a later day (after 1, 7 and 30 days).
- Time on the app per visit; games per visit.
- Games by mode, mission, rank and map; win rate for each; game length in rounds and minutes.
- Campaign drop-off: how many players reached, won and gave up at each mission.
- Where unfinished games stop: round and mission.
- Undo and surrender use; when help gets turned off.
- Errors by version.

## Teaching the AI from the records
1. **Find the games worth studying.** The report lists wins at marshal (and any higher rank
   added later), and campaign missions the AI loses more often than expected. A step-through
   replay viewer opens any record. Phil only looks at those, not at every game.
2. **Measure a suspected tactic** (30-100 games). A tool replays records and counts features
   of each human choice: how full the harvesters they attack are, how near their harvesting
   is to the enemy's factory, how many enemies each sonic boom hits. It compares winning
   humans with the AI.
3. **New genes, tuned by evolution.** Each confirmed tactic becomes a gene in the AI's
   scoring (a target's worth including the crystals it carries; a weight on harvesting near
   the enemy; a weight on lining enemies up for a sonic boom). `evolve.js` finds the right
   strength by self-play. Humans supply the idea; the simulator supplies the tuning.
4. **Later, fitting genes to human choices** (100-300 games). Adjust the genes so the action
   a winning human chose ranks highest. Full imitation learning needs many thousands of games
   and is not worth it at this audience size.

Honest volume check: a LinkedIn post might bring a few hundred visitors, of whom a fraction
finish a game and opt in. Expect tens of records at first. The report is useful from the
first player; steps 2 to 4 need the numbers above.

## Stages
1. **Move to Vercel**: link the repo, add the redirect page on GitHub Pages, tag publishes.
2. **Collector**: the opt-in card, privacy note, Settings switch, `telemetry.js` (queue and
   send; called from the game screen and the menus, no rules logic), `api/collect.js`,
   Postgres tables, deletion by id.
3. **Tools**: `tools/players.mjs export` and `report`, the replay check, the replay viewer.
4. **Analysis**: the measuring tool, then new genes, tuned by `evolve.js`.

## Open questions for Phil
1. Address: `mech-attack.vercel.app` or a custom domain?
2. How long to keep the data (provisional 12 months)?

Settled since (Phil, 29 October 2026), both handed to the AI and rules work:
- Units should be able to blow up crystal piles, so starving the enemy is a real tactic.
  The details (what it costs, whether a pile is destroyed outright or loses some crystals)
  are still to be decided.
- An "insane" rank above marshal, so wins there are rarer and more telling.
