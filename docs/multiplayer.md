# Multiplayer

How Mech Attack plays with more than one human and more than two sides (Phil, 29 October 2026). Built on the `multiplayer` branch; decisions marked Phil's are settled, anything marked provisional still needs his word.

## The two modes

| | Turn-based | Simultaneous (co-op) |
|---|---|---|
| Players | 2, 3 or 4 sides; each side a human or the AI | 2 to 4 humans on one team against the AI |
| Turns | Each side in turn, as now | Both humans act at the same time, then the AI takes its turn |
| Devices | One device passed round, or one device each | One device each (over the LAN) |
| Teams | Free for all, or teams set up before the game | Always one human team against the AI |
| Clashes | None: one side moves at a time | First come, first served: whichever move reaches the host first happens; the later one is refused ("someone got there first") |

Phil's decisions:
- Simultaneous play is always cooperative, for up to 4 humans at least.
- Co-op partners see each other's turned-over ground and units only once both have bought Comms (30) in one of their factories.
- Turn-based play can be on one device or one device each, and teams can be set up front.
- The AI plays to maximise its chance of winning: it targets the weaker player, or spreads its attack, according to the map and what each player is doing.
- A knocked-out player's factories stay on the board, with whatever crystals that player had, and anyone's Infantry can capture them.

## How it works: one device holds the real game

One device is the host. It holds the full game, runs the engine and the AI, and checks every move. The other devices send their moves to the host, which applies them in the order they arrive and sends each player their own view of the game (the engine's `viewFor`). No device but the host ever holds hidden information, so fog of war cannot be cheated.

For turn-based play on one device, the same device is host and every player; a "pass the device" screen hides the board between players so nobody sees another's fog.

## What changes

### 1. The engine: more players, teams and shared turns
- `newGame` takes a list of sides: colour, human or AI, and team.
- "Enemy" means any player on another team. Allies cannot fire on each other.
- Turns run in phases. A phase holds one side (turn-based) or a whole team (simultaneous). Each player in the phase presses End turn, and the phase ends when all have. Every move names the player making it.
- Crystals grow and spawn, and the per-turn damage totals reset, after each phase.
- A knocked-out player's turns are skipped. Their factories become unused, each holding that player's crystals in its store (shared between their factories if they had several; provisional).
- The game ends when only one team is left.
- Today the engine assumes one player moves at a time in 18 places, and that there are exactly two players in 7 places across the engine, AI and maps.

### 2. Maps for 3 and 4 sides
- Three or four home positions spread evenly: homes at three corners of a triangular layout, or four corners of a square one.
- The fairness checks compare every side's distances to piles and unused factories, not just blue's and green's.
- New colours: yellow, purple and pink (red would be lost on the red ground), made from the blue art by `tools/recolour-tokens.mjs` and `tools/recolour-factories.py`.

### 3. The AI
- It picks a target opponent each turn: the weakest, the most dangerous, or the nearest, weighed by new genes, so evolution can find what wins.
- It defends against attacks from more than one direction.
- With allies it does not fire on them, and avoids blocking them.

### 4. Screens
- A new game screen to set up sides: how many, human or AI, teams, and for the AI its rank.
- A "pass the device" screen for turn-based play on one device.
- For simultaneous play: your partner's moves appear as they happen, each player has their own End turn, and a marker shows who is ready.
- Game-over text for a player knocked out while the others play on.
- Undo: your own last move only, and only if nothing has happened since that depends on it (provisional). Demand surrender: not in multiplayer (provisional).

### 5. Playing on separate devices
A lobby to host or join a game with a short code, sending moves and views between devices, and reconnecting a phone that goes to sleep. The connection is written so it can be swapped:

| Option | How it works | For | Against |
|---|---|---|---|
| Direct link (WebRTC, via the free PeerJS service) | The devices find each other through PeerJS, then talk directly over the wifi | Keeps the same GitHub Pages app; nothing to run | Needs the internet for the first handshake; relies on a free third-party service |
| A small server on the PC | `node server.js` serves the game and relays moves; phones open `http://<PC address>:8000` | Private, works without internet | The PC must be on; a different address from the usual one |
| A hosted relay (e.g. on Vercel) | A server online relays the moves | Works from anywhere | An account and more to look after |

Start with the direct link; keep the PC server as the fallback.

## Order of work, each step publishable on its own

1. **Recorded test games.** Record complete AI games from fixed seeds before touching the engine. After every engine change, the two-player games must replay move for move identically, which proves the single-player game and the campaign are unchanged.
2. **Engine:** sides, teams, phases, knock-outs. No screen changes yet.
3. **Turn-based on one device:** the setup screen, pass-the-device, 3- and 4-side maps, colours, the AI's choice of target. Re-evolve the AI with more than two sides.
4. **Separate devices:** the lobby and connection, first for turn-based play.
5. **Simultaneous co-op:** shared phases over the LAN, first come first served, live updates of your partner's moves.

The existing single-player screens and campaign stay the default and are untouched apart from the engine underneath. Saved games in progress are lost once, when the saved-game format changes.

## Balancing co-op against the AI

Built in v0.51 (provisional): co-op set-up offers one or two AI sides, and each AI side starts with the usual crystals and units (including the second player's extra crystals, as it moves after the humans) times the number of humans per AI side, rounded, plus a Crystal lab when that is 2 or more. One AI with one factory can only build a few units a turn, so it cannot spend unlimited extra crystals; that is why two AI sides is the better fight for three or four humans.

Demand surrender is offered in any multiplayer game where the other side is one team of AIs. The AI plays the game on for up to 8 seconds before answering, with shorter games when there are more than two sides.

## The AI in games with more sides

v0.54: AI sides in games with 3 or more sides use personalities evolved in 3- and 4-sided free-for-alls (`ai-personalities-multi.js`; report in `docs/evolution-multi.md`), scored by finishing place. Against the hand-tuned AI on every other side, the best five score 48% to 65% (50% means as good) and win outright 9 to 16 times in 40 games, against about 12 by chance. All five go for the nearest and weakest opponent (targetNearness about 1.5, targetWeakness 1.1 to 1.6), with some weight on whoever threatens their factories (targetThreat 0.7 to 1.2); none chose to gang up on the strongest. They build mostly Infantry (about 4 factory captures a game), Attack Helicopters and Crystal labs. Co-op games against an AI team use the same personalities; they were not bred for that, so co-op balance needs watching.

## Co-op campaigns (Phil, 29 and 30 October 2026)

Built in v0.57 as `coop-campaign.js`: "Red Dust: Together", five missions for 2 humans at the same time against the AI, on the Multi-player tab of the Campaign menu. Each mission sets how many humans play it (Phil, 30 October 2026: the number is not chosen). The host picks a mission (any their device has unlocked) and who plays where; the others join with the code. Each mission sets its AI sides (scaled to the number of humans, as co-op games are), any special starting units or upgrades, and its objective; the team wins or loses together, and a win is recorded on every player's device. Each mission is played on the same generated map every time for its number of sides.

The plan it was built from:
- A co-op campaign is its own list of missions, with its own progress, started from the Campaign menu. The host picks a mission; the others join with the code, as for any co-op game.
- Each mission names its sides: the humans (each with a home and starting units), and one or more AI sides with their own homes, units, upgrades and build mix, like the solo missions' `setup`, `aiMix` and `boss`. Maps come from the 3- to 6-sided generator, reshaped where a mission needs it (as Over the Mountains and The Pass are).
- A mission can be written for 2 humans and also allow 3; with 3, it adds starting units for the AI by the same scaling as co-op games, or adds a second AI side.
- Objectives are shared: the mission is won when the team meets it, and lost when the team is beaten (each human can be knocked out while the others carry on).

Mission ideas, each built round working together:
1. **Two Fronts** (2 humans, 1 AI): Green attacks both homes at once; each human must hold while sending help to the other. Teaches Comms: buy it to see where the attack is coming.
2. **Supply Run** (2 humans): one player has the only factory with an Airfield, the other the crystals; Chinooks ferry units and harvested crystals between them.
3. **Pincer** (2 humans, 1 AI): the AI's base sits between the humans' homes; overrun it from two sides before its boss (a Heavy Cannon) can turn on either.
4. **Last Stand** (3 humans, 2 AIs): hold three factories for 15 rounds against two AI armies; any one factory lost loses the mission.
5. **Kharon Rising** (2 humans, 2 AIs): the finale, all units, the two strongest AI personalities.

Settled with Phil (30 October 2026):
- Each human always has their own home and crystals.
- A human who is knocked out keeps watching (and can advise) until the mission ends.

- The host can start any mission their device has unlocked, the others join whatever their own progress, and a win is recorded on every player's device, so anyone can host the next mission.

## Still to decide (provisional for now)

- Co-op partners: one factory and crystal store each, or shared? Provisional: each has their own factory and crystals; Infantry overrun only enemy factories.
- Can allies in turn-based team games unload crystals at each other's factories? Provisional: no.
