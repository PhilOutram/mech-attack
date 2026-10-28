export const VERSION = "v0.06";

// Newest first. Bump VERSION and prepend an entry on EVERY publish, so the live
// app always shows exactly what shipped. Dates are YYYY-MM-DD.
export const CHANGELOG = [
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
