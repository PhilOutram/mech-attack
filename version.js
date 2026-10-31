export const VERSION = "v0.82";

// Newest first. Bump VERSION and prepend an entry on EVERY publish, so the live
// app always shows exactly what shipped. Dates are YYYY-MM-DD.
export const CHANGELOG = [
  {
    version: "v0.82",
    date: "2026-10-31",
    notes: [
      "New AI personalities, evolved on the current rules.",
    ],
  },
  {
    version: "v0.81",
    date: "2026-10-31",
    notes: [
      "A switch for taking the game down for maintenance, and back again.",
    ],
  },
  {
    version: "v0.80",
    date: "2026-10-31",
    notes: [
      "Crystal Seeder costs 50 and plants anywhere, piles too. Helicopter defence 5, attack 15.",
      "The log folds to one line: tap it to open it over the map. Taller orders panel on phones.",
      "A unit that turns over new ground keeps its leftover move. Crystals show once seen.",
    ],
  },
  {
    version: "v0.79",
    date: "2026-10-31",
    notes: [
      "New unit: the Crystal Seeder plants new crystal piles (loads at home, plants 10 a turn)",
      "Give crystals: a unit can unload at an ally's factory, giving the ally its crystals",
      "Twin Tank now costs 65 with move 4 (was 90, move 3); Attack Helicopter costs 55 (was 45)",
    ],
  },
  {
    version: "v0.78",
    date: "2026-10-31",
    notes: [
      "Ruins on the map: Infantry can search one for crystals or a unit, or find an enemy.",
      "The Heavy Tank is now called the Twin Tank.",
    ],
  },
  {
    version: "v0.77",
    date: "2026-10-31",
    notes: [
      "Attack Helicopters hit air units too; the Fighter costs 45 (was 60).",
      "The Help unit table shows a token for each unit.",
    ],
  },
  {
    version: "v0.76",
    date: "2026-10-31",
    notes: [
      "Help: a unit table with every unit on one row, ground units blue and air green.",
    ],
  },
  {
    version: "v0.75",
    date: "2026-10-31",
    notes: [
      "Blast Cannon defence 15 (was 10), so one Tank shot no longer destroys it.",
    ],
  },
  {
    version: "v0.74",
    date: "2026-10-30",
    notes: [
      "Co-op: Pincer and Kharon Rising are now 3-player missions.",
      "The campaign menu keeps the same size and place on both tabs.",
    ],
  },
  {
    version: "v0.73",
    date: "2026-10-30",
    notes: [
      "Campaign menu: Solo and Multi-player tabs instead of one long list.",
      "Co-op missions are for 2 players; the number of players is no longer chosen.",
    ],
  },
  {
    version: "v0.72",
    date: "2026-10-30",
    notes: [
      "New ground gets a green edge that flashes for 3 seconds, in place of a white flash.",
    ],
  },
  {
    version: "v0.71",
    date: "2026-10-30",
    notes: [
      "Units move at a steady 0.3 s a hex, and the sound starts just before they set off.",
      "Fixed a moving unit showing up at its destination before it got there.",
      "Unloading at a factory sounds once the unit has arrived, not as it sets off.",
    ],
  },
  {
    version: "v0.70",
    date: "2026-10-30",
    notes: [
      "Resume brings back the last game played, including games with other devices.",
      "A device that drops out reconnects by itself; a host that restarts keeps its code.",
      "The game code is shown in the log.",
    ],
  },
  {
    version: "v0.69",
    date: "2026-10-30",
    notes: [
      "Co-op: tap Turn ended to take your turn back while the others are still playing.",
      "Harvesters unload and labs pay out once everyone in the phase has ended.",
    ],
  },
  {
    version: "v0.68",
    date: "2026-10-30",
    notes: [
      "Panning never shows black: the whole map is drawn, and a pan just slides it.",
      "The board redraws only what changed, so the terrain is not redrawn on every tap.",
      "Newly turned-over ground flashes three times as it appears.",
    ],
  },
  {
    version: "v0.67",
    date: "2026-10-30",
    notes: [
      "Landscape: the map gets nearly all the screen, in a raised frame with cut-off corners.",
      "The side column is narrow, with the bar, orders and log in boxes of their own.",
      "Objective is a trophy button.",
    ],
  },
  {
    version: "v0.66",
    date: "2026-10-30",
    notes: [
      "Sonic booms use Phil's sound-wave art, running along the line, with their own sound.",
      "Units on the line blow up as the wave reaches them.",
      "Harvesting and unloading crystals have a sound (Phil's).",
    ],
  },
  {
    version: "v0.65",
    date: "2026-10-30",
    notes: [
      "Commander Jeanne now wins The Maid's March by entering the far factory (it said failed).",
      "She can no longer walk into the wrong factory.",
      "Fixed the AI getting stuck retrying a move blocked by something hidden.",
    ],
  },
  {
    version: "v0.64",
    date: "2026-10-30",
    notes: [
      "The Turret has one fat barrel, so it is easy to tell from the Twin Turret.",
    ],
  },
  {
    version: "v0.63",
    date: "2026-10-30",
    notes: [
      "The Sonic Tank aims at any hex within 4 (was 5, along six lines only): its boom hits " +
        "every enemy on the line through that hex and on to range 4, shown as a shock wave.",
      "A moving unit takes its damage badge and labels with it; a move pauses at every new " +
        "block it turns over, and only offers the rest of the move if it can go somewhere.",
      "Hold the Line: you start with two Sonic Tanks and a Twin Turret.",
    ],
  },
  {
    version: "v0.62",
    date: "2026-10-30",
    notes: [
      "The Turret and Twin Turret have bold black outlines, so they read clearly at board " +
        "size, and sharper art at twice the resolution.",
    ],
  },
  {
    version: "v0.61",
    date: "2026-10-30",
    notes: [
      "Live sight: only what your units can see now is clear. The rest of the ground you " +
        "have explored is under a thin fog that hides enemy units.",
      "Artillery fires over mountains at anything your units can see, or blind.",
      "Briefings and tips use the width of a computer or a phone on its side, and open at " +
        "the top.",
    ],
  },
  {
    version: "v0.60",
    date: "2026-10-30",
    notes: [
      "The Twin Turret has Phil's art, in every player's colour.",
      "The Heavy Tank has yellow, purple and pink tokens. They were missing, which stopped the " +
        "app installing for offline play.",
    ],
  },
  {
    version: "v0.59",
    date: "2026-10-30",
    notes: [
      "Co-op campaign, Red Dust: Together: five missions for 2 or 3 players at the same " +
        "time against the AI, in the Campaign menu. The host can play any mission they " +
        "have unlocked, and a win counts on every player's device.",
    ],
  },
  {
    version: "v0.58",
    date: "2026-10-30",
    notes: [
      "Simpler main menu: Campaign, Skirmish, Join a game and Help. Skirmish offers a game " +
        "against the AI or with other players; Help has Units, tips and About.",
    ],
  },
  {
    version: "v0.57",
    date: "2026-10-30",
    notes: [
      "New units: the Twin Turret and the Heavy Tank fire twice a turn at the hexes next to " +
        "them, an answer to Infantry swarms.",
      "Hold the Line is winnable: you start with a Sonic Tank and a Twin Turret, Green has " +
        "fewer crystals, and its boss is a Sonic Tank (the Heavy Cannon moves to Storm the " +
        "Works).",
      "Help opens a menu with Units and Show tips again; the Units page has a Back button; " +
        "tapping outside a menu closes it.",
    ],
  },
  {
    version: "v0.56",
    date: "2026-10-29",
    notes: [
      "The AI is re-evolved for blowing up crystals, cheaper upgrades and the counter table: " +
        "it builds Airfields, helicopters and anti-aircraft, and fewer Infantry.",
    ],
  },
  {
    version: "v0.55",
    date: "2026-10-29",
    notes: [
      "Moves start with their sound and glide smoothly on phones: the moving unit floats " +
        "over the board instead of the board being redrawn.",
      "No more grey square flashing over a hex when you tap the board on a phone.",
    ],
  },
  {
    version: "v0.54",
    date: "2026-10-29",
    notes: [
      "AI sides in games with 3 or more sides play personalities evolved for free-for-alls: " +
        "they go for the nearest, weakest opponent and whoever threatens their factories.",
    ],
  },
  {
    version: "v0.53",
    date: "2026-10-29",
    notes: [
      "Smoother moves on phones: the unit glides along its route in about 1.5 seconds, as " +
        "long as its sound, instead of the whole board being redrawn for every hex.",
    ],
  },
  {
    version: "v0.52",
    date: "2026-10-29",
    notes: [
      "Choose your rank for the campaign too: it makes each mission easier or harder, and " +
        "the mission list shows the highest rank you have won each one at.",
      "A Blast Cannon's splash also destroys crystal piles next to its target.",
    ],
  },
  {
    version: "v0.51",
    date: "2026-10-29",
    notes: [
      "Co-op: Demand surrender against an AI team, one or two AI sides, and the AI starts " +
        "with more for each human it faces.",
      "The simulator and evolution play 3- and 4-sided free-for-alls, ready for AI tuned " +
        "to games with more sides.",
    ],
  },
  {
    version: "v0.50",
    date: "2026-10-29",
    notes: [
      "Units that can hit ground units can blow up a crystal pile in range: the whole pile " +
        "goes, and it uses the unit's attack. The AI blows up piles on your side.",
      "New rank: Supreme Commander (Insane) against The Overseer, which moves first with a " +
        "big head start.",
    ],
  },
  {
    version: "v0.49",
    date: "2026-10-29",
    notes: [
      "Multiplayer: take turns with 2 to 4 sides (humans on one device or their own, or the " +
        "AI, in teams), or play at the same time in co-op, 2 to 4 humans against the AI, " +
        "one device each, joined with a code.",
      "New colours yellow, purple and pink; maps for 3 to 6 sides; Comms (30) lets allies " +
        "who both have it see what the other sees; beaten players are knocked out while " +
        "the others play on.",
    ],
  },
  {
    version: "v0.48",
    date: "2026-10-29",
    notes: [
      "Every attack you can see shows its sum for 3 seconds, e.g. \"Tank ATT 25 vs Scout " +
        "Bike DEF 10 → DESTROYED\".",
      "The AI plans combined attacks as a whole, and its Scout Bikes fight nearby enemies " +
        "instead of always exploring.",
    ],
  },
  {
    version: "v0.47",
    date: "2026-10-29",
    notes: [
      "The AI builds measured counters to the units it sees (a table from staged battles), " +
        "buys the upgrades its favourite units need, values full harvesters, and keeps the " +
        "hexes round a besieged factory free for its Infantry.",
    ],
  },
  {
    version: "v0.46",
    date: "2026-10-29",
    notes: [
      "Factories show their upgrades in the art: a helipad for an Airfield, a crystal bubble " +
        "for a Crystal lab, and armoured pods on the hangar for Heavy works. Each tile is in " +
        "the owner's colour, built on Phil's original factory token.",
      "The upgrade badges no longer sit on the board; they stay in the factory menu.",
    ],
  },
  {
    version: "v0.45",
    date: "2026-10-29",
    notes: [
      "The Turret has Phil's art.",
    ],
  },
  {
    version: "v0.44",
    date: "2026-10-29",
    notes: [
      "Heavy works and Airfield cost 60 (were 100); the second player's extra crystals are " +
        "30 (were 40).",
      "The AI counts a Blast Cannon's cluster bomb and a Sonic Tank's line when choosing a " +
        "target, and builds Blast Cannons against swarms of Infantry.",
    ],
  },
  {
    version: "v0.43",
    date: "2026-10-29",
    notes: [
      "The AI is re-evolved for overrunning factories, Crystal labs and the new units.",
    ],
  },
  {
    version: "v0.42",
    date: "2026-10-29",
    notes: [
      "New factory upgrade badges: a helipad for the Airfield, a ribbed hangar in a gear for Heavy works and a bubble of crystals for the Crystal lab.",
    ],
  },
  {
    version: "v0.41",
    date: "2026-10-29",
    notes: [
      "Campaign: units unlock mission by mission and stay unlocked. Each briefing shows the " +
        "new units, and winning a mission shows what the next one unlocks.",
      "Factory upgrades show as badges on the factory (placeholder art), the upgrade " +
        "buttons say what each does, and the crystal count shows Crystal lab income.",
    ],
  },
  {
    version: "v0.40",
    date: "2026-10-29",
    notes: [
      "Over the Mountains: Anti-Aircraft Jeeps can be built too.",
    ],
  },
  {
    version: "v0.39",
    date: "2026-10-29",
    notes: [
      "Over the Mountains: Green starts with an Airfield too, so both sides can build " +
        "Attack Helicopters and Chinooks.",
    ],
  },
  {
    version: "v0.38",
    date: "2026-10-29",
    notes: [
      "Over the Mountains: your Airfield can build Attack Helicopters as well as Chinooks.",
    ],
  },
  {
    version: "v0.37",
    date: "2026-10-29",
    notes: [
      "Factories are overrun, not destroyed: Infantry must wait a turn next to one before " +
        "breaking in. Unused factories hold 25 crystals; a new Crystal lab upgrade makes 10 " +
        "a turn.",
      "Moves stop at newly turned-over ground with the rest of their move left; units can " +
        "fire blind into hexes they cannot see.",
      "New units: Chinook (flying transporter) and Turret. Three ranks to play at, each " +
        "with its own opponent.",
      "The campaign grows to eleven missions with Green bosses, an Objective button, unit " +
        "info while building, longer banners and End turn flash, crystals that wait a turn " +
        "at 80, and tips for mountains and rough ground.",
    ],
  },
  {
    version: "v0.36",
    date: "2026-10-29",
    notes: [
      "Moving onto crystals asks first, and explains how to harvest them instead.",
      "A second Demand surrender explains the one-try rule.",
      "Attack and Defence (with any rough-ground bonus) stand out in the unit panel.",
    ],
  },
  {
    version: "v0.35",
    date: "2026-10-29",
    notes: [
      "No Demand surrender in mission 1.",
    ],
  },
  {
    version: "v0.34",
    date: "2026-10-29",
    notes: [
      "Mission briefings come first: tips wait until you press Start.",
    ],
  },
  {
    version: "v0.33",
    date: "2026-10-29",
    notes: [
      "The AI is re-evolved for the cheaper units: it now uses Artillery, Anti-Aircraft " +
        "Jeeps, Light Medics and Spotter Drones as well.",
    ],
  },
  {
    version: "v0.32",
    date: "2026-10-29",
    notes: [
      "The first time you build each kind of unit, a pop-up says what it can do.",
      "A \"Round N\" banner shows for two seconds when your turn starts.",
    ],
  },
  {
    version: "v0.31",
    date: "2026-10-29",
    notes: [
      "Mission 1 starts with one Infantry and a top tip on taking the factory.",
      "End turn flashes once every unit has done all it can.",
    ],
  },
  {
    version: "v0.30",
    date: "2026-10-29",
    notes: [
      "Campaign missions bring units and factory upgrades in a few at a time.",
      "The factory lists units cheapest first.",
    ],
  },
  {
    version: "v0.29",
    date: "2026-10-29",
    notes: [
      "Mission 1 reworked: your Infantry take an abandoned factory, then build a Scout Bike " +
        "and a Tank. The steps tick off in the panel.",
      "Campaign list: mission names in the title lettering, with Play and Replay buttons.",
    ],
  },
  {
    version: "v0.28",
    date: "2026-10-29",
    notes: [
      "A banner shows how many crystals were unloaded at a factory.",
      "Units move a little faster.",
    ],
  },
  {
    version: "v0.27",
    date: "2026-10-29",
    notes: [
      "Campaign: Red Dust, five missions on Kharon that teach the game step by step.",
    ],
  },
  {
    version: "v0.26",
    date: "2026-10-29",
    notes: [
      "Smoother pan and zoom on phones: the board slides as one picture during a gesture and " +
        "redraws sharp when you let go.",
    ],
  },
  {
    version: "v0.25",
    date: "2026-10-29",
    notes: [
      "New app icon: a blue Heavy Cannon on a plain map tile.",
    ],
  },
  {
    version: "v0.24",
    date: "2026-10-29",
    notes: [
      "Units hop hex by hex along their route and turn to face the way they go.",
      "Tips for new players pop up as you meet each part of the game. Help turns them back on.",
      "Cheaper units: Spotter Drone 15, and the units nobody bought cost about a quarter less.",
    ],
  },
  {
    version: "v0.23",
    date: "2026-10-29",
    notes: [
      "A second rough terrain tile drawn by Phil, so rough ground varies across the map.",
    ],
  },
  {
    version: "v0.22",
    date: "2026-10-29",
    notes: [
      "The original plain tiles are back as extra plain variants, so plain ground has five " +
        "looks.",
    ],
  },
  {
    version: "v0.21",
    date: "2026-10-29",
    notes: [
      "New plain and rough terrain art redrawn by Phil, so rough ground stands out clearly " +
        "from plain ground.",
    ],
  },
  {
    version: "v0.20",
    date: "2026-10-29",
    notes: [
      "Infantry march with footsteps.",
    ],
  },
  {
    version: "v0.19",
    date: "2026-10-29",
    notes: [
      "Each captured factory pays you 10 crystals a turn.",
      "Infantry can hit air units; the Scout Bike now hits ground only.",
      "The AI plays personalities evolved for these rules.",
      "Sound: units rumble, fly and fire, and capturing a factory beeps. Speaker button to mute.",
    ],
  },
  {
    version: "v0.18",
    date: "2026-10-29",
    notes: [
      "Units unload crystals as soon as they arrive next to one of your factories.",
      "Brighter outlines on unexplored hexes and on move and target hexes.",
      "Unit stats run full width, so the orders stay on screen on a phone.",
    ],
  },
  {
    version: "v0.17",
    date: "2026-10-29",
    notes: [
      "No change to play: new rule options for testing capture in the simulator.",
    ],
  },
  {
    version: "v0.16",
    date: "2026-10-29",
    notes: [
      "Fixed Green's turn freezing when one of its units, out of your sight, ran into yours.",
    ],
  },
  {
    version: "v0.15",
    date: "2026-10-29",
    notes: [
      "New versions show the first time you open the app, instead of a visit later.",
    ],
  },
  {
    version: "v0.14",
    date: "2026-10-28",
    notes: [
      "Choose small, medium or large maps; two new large shapes.",
      "You start in different places on different maps.",
      "Units drive round crystals when they can; moves that crush crystals show yellow.",
      "Undo brings back crystals a move drove over. Air units and the Airfield are green.",
    ],
  },
  {
    version: "v0.13",
    date: "2026-10-28",
    notes: [
      "The AI plays personalities bred under the v0.12 rules; they beat the old AI 9 in 10.",
    ],
  },
  {
    version: "v0.12",
    date: "2026-10-28",
    notes: [
      "Factory upgrades: Heavy works unlocks heavy units, Airfield unlocks air units.",
      "Bigger map shapes with unused factories for Infantry to capture.",
      "New units: Infantry, and a Transporter to carry them.",
      "Demand surrender once a game; the Scout Bike now hits air units too.",
      "The AI plays with evolved personalities.",
    ],
  },
  {
    version: "v0.11",
    date: "2026-10-28",
    notes: [
      "Ground and air: air units fly over everything; only anti-air attacks can hit them.",
      "New units: Blast Cannon, Sonic Tank, Anti-Aircraft Jeep, Attack Helicopter, Fighter.",
      "Shot previews mention the Blast Cannon's blast and the Sonic Tank's line.",
      "The Undo button is grey, so it stands apart from the unit's orders.",
    ],
  },
  {
    version: "v0.10",
    date: "2026-10-28",
    notes: [
      "New unit: the Spotter Drone (30). It flies over everything and can split its move.",
      "The AI builds drones too and sends them exploring.",
    ],
  },
  {
    version: "v0.09",
    date: "2026-10-28",
    notes: ["Whoever moves second starts with 40 extra crystals, to even out the first move."],
  },
  {
    version: "v0.08",
    date: "2026-10-28",
    notes: ["Game over: New map is now New game, and Title screen is now Main menu."],
  },
  {
    version: "v0.07",
    date: "2026-10-28",
    notes: [
      "Quit button: ends the game as a loss, after asking.",
      "Undo: take back your last actions this turn, 5 times per game.",
      "Questions now appear in the app's own style instead of a browser box.",
    ],
  },
  {
    version: "v0.06",
    date: "2026-10-28",
    notes: [
      "Crystals grow by 5 after every turn, yours and the AI's, instead of 10 a round.",
      "New piles appear between goes, the same number before each player's turn.",
    ],
  },
  {
    version: "v0.05",
    date: "2026-10-28",
    notes: ["Fog of war: you only see the map blocks your own units have turned over."],
  },
  {
    version: "v0.04",
    date: "2026-10-28",
    notes: ["Landscape screens: the map gets a square on the right, orders down the left."],
  },
  {
    version: "v0.03",
    date: "2026-10-28",
    notes: [
      "Fog of war: a map block turns over only when a unit is on it or next to it.",
      "Crystal piles grow every round they are not harvested and explode at 80.",
      "Maps start with more crystal piles of 50: four fair pairs and one in the middle.",
      "Return fire is simultaneous, and shot previews show what each shot would do.",
    ],
  },
  {
    version: "v0.02",
    date: "2026-10-28",
    notes: [
      "Play against the AI on a fixed map built from Phil's tiles and unit art.",
      "Tap a unit for its orders; reachable hexes and targets are outlined.",
      "Fog of war, crystals that spawn and grow, harvesting and building.",
      "Games save automatically; Resume picks up where you left off.",
      "Choose a map: a new one, fixed map 1, a map by number, or one you played before.",
    ],
  },
  {
    version: "v0.01",
    date: "2026-10-26",
    notes: ["Opening splash screen.", "Units screen with all 21 units from the unit table."],
  },
];
