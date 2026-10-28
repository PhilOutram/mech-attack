// Writes simple placeholder tokens for units that have no artwork yet (Infantry and
// Transporter), in each player's colour. Replace them with the real art when it is drawn.
// Usage: node tools/placeholder-tokens.mjs
import { writeFileSync } from "node:fs";

const COLOURS = { blue: ["#3b8cff", "#1d4f99"], green: ["#42c25a", "#1f6e30"] };

// Three troopers seen from above: helmet, shoulders and rifle.
function infantry(fill, dark) {
  const trooper = (x, y) =>
    `<rect x="${x - 28}" y="${y - 10}" width="56" height="32" rx="16" fill="${dark}"` +
    ` stroke="#111" stroke-width="3"/>` +
    `<rect x="${x + 16}" y="${y - 48}" width="8" height="48" rx="3" fill="#2a2a2a"/>` +
    `<circle cx="${x}" cy="${y}" r="20" fill="${fill}" stroke="#111" stroke-width="3"/>`;
  return trooper(100, 62) + trooper(58, 140) + trooper(142, 140);
}

// A wheeled personnel carrier seen from above, nose up.
function transporter(fill, dark) {
  const wheels = [55, 100, 145].map((y) =>
    `<rect x="44" y="${y - 14}" width="16" height="28" rx="5" fill="#222"/>` +
    `<rect x="140" y="${y - 14}" width="16" height="28" rx="5" fill="#222"/>`).join("");
  return wheels +
    `<path d="M62 40 L100 22 L138 40 L138 172 L62 172 Z" fill="${fill}" stroke="#111"` +
    ` stroke-width="3"/>` +
    `<rect x="76" y="70" width="48" height="80" rx="6" fill="${dark}"/>` +
    `<rect x="84" y="40" width="32" height="16" rx="4" fill="#cfe8ff" opacity="0.8"/>`;
}

for (const [colour, [fill, dark]] of Object.entries(COLOURS)) {
  for (const [name, draw] of [["infantry", infantry], ["transporter", transporter]]) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" ` +
      `viewBox="0 0 200 200">${draw(fill, dark)}</svg>\n`;
    writeFileSync(`units/${name}-${colour}.svg`, svg);
  }
}
