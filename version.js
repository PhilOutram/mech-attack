export const VERSION = "v0.02";

// Newest first. Bump VERSION and prepend an entry on EVERY publish, so the live
// app always shows exactly what shipped. Dates are YYYY-MM-DD.
export const CHANGELOG = [
  {
    version: "v0.02",
    date: "2026-10-28",
    notes: [
      "Play against the AI on a fixed map built from Phil's tiles and unit art.",
      "Tap a unit for its orders; reachable hexes and targets are outlined.",
      "Fog of war, crystals that spawn and grow, harvesting and building.",
      "Games save automatically; Resume picks up where you left off.",
    ],
  },
  {
    version: "v0.01",
    date: "2026-10-26",
    notes: ["Opening splash screen.", "Units screen with all 21 units from the unit table."],
  },
];
