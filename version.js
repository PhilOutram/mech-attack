export const VERSION = "v0.46";

// Newest first. Bump VERSION and prepend an entry on EVERY publish, so the live
// app always shows exactly what shipped. Dates are YYYY-MM-DD.
export const CHANGELOG = [
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
