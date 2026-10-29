// Writes simple placeholder tokens for units that have no artwork yet (Infantry, Transporter,
// Chinook, Turret and Commander Jeanne), in each player's colour. Replace them with the real
// art when it is drawn.
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

// A twin-rotor helicopter seen from above, nose up: long body, a rotor disc at each end.
function chinook(fill, dark) {
  const rotor = (y) =>
    `<circle cx="100" cy="${y}" r="46" fill="#ffffff" opacity="0.18" stroke="#111"` +
    ` stroke-width="2"/>` +
    `<rect x="54" y="${y - 4}" width="92" height="8" rx="3" fill="#2a2a2a"` +
    ` transform="rotate(30 100 ${y})"/>` +
    `<rect x="54" y="${y - 4}" width="92" height="8" rx="3" fill="#2a2a2a"` +
    ` transform="rotate(-60 100 ${y})"/>`;
  return `<rect x="76" y="40" width="48" height="128" rx="22" fill="${fill}" stroke="#111"` +
    ` stroke-width="3"/>` +
    `<rect x="88" y="78" width="24" height="52" rx="6" fill="${dark}"/>` +
    `<rect x="86" y="46" width="28" height="12" rx="4" fill="#cfe8ff" opacity="0.8"/>` +
    rotor(52) + rotor(156);
}

// A gun emplacement seen from above: armoured base, round turret, long barrel pointing up.
function turret(fill, dark) {
  return `<polygon points="100,30 160,65 160,135 100,170 40,135 40,65" fill="${dark}"` +
    ` stroke="#111" stroke-width="3"/>` +
    `<rect x="92" y="18" width="16" height="78" rx="4" fill="#2a2a2a" stroke="#111"` +
    ` stroke-width="2"/>` +
    `<circle cx="100" cy="104" r="36" fill="${fill}" stroke="#111" stroke-width="3"/>` +
    `<circle cx="100" cy="104" r="12" fill="${dark}"/>`;
}

// A single trooper with a gold star: the campaign's VIP, Commander Jeanne.
function vip(fill, dark) {
  const star = [0, 1, 2, 3, 4].map((i) => {
    const outer = (Math.PI * 2 * i) / 5 - Math.PI / 2;
    const inner = outer + Math.PI / 5;
    return `${100 + 30 * Math.cos(outer)},${150 + 30 * Math.sin(outer)} ` +
      `${100 + 12 * Math.cos(inner)},${150 + 12 * Math.sin(inner)}`;
  }).join(" ");
  return `<rect x="56" y="70" width="88" height="48" rx="24" fill="${dark}" stroke="#111"` +
    ` stroke-width="3"/>` +
    `<rect x="126" y="20" width="10" height="64" rx="3" fill="#2a2a2a"/>` +
    `<circle cx="100" cy="80" r="30" fill="${fill}" stroke="#111" stroke-width="3"/>` +
    `<polygon points="${star}" fill="#ffd23f" stroke="#111" stroke-width="2"/>`;
}

// Factory upgrade badges, drawn on the factory tile (one colour for both players):
// a helipad for the Airfield, a crane and gear for Heavy works, a crystal dome for the
// Crystal lab. Placeholders until Phil's art is ready (docs/art-brief-factory-upgrades.md).
function airfieldBadge() {
  return `<circle cx="100" cy="100" r="84" fill="#2b2f36" stroke="#111" stroke-width="6"/>` +
    `<circle cx="100" cy="100" r="66" fill="none" stroke="#ffd23f" stroke-width="8"` +
    ` stroke-dasharray="18 10"/>` +
    `<path d="M70 58 V142 M130 58 V142 M70 100 H130" stroke="#ffffff" stroke-width="18"` +
    ` stroke-linecap="square" fill="none"/>`;
}

function heavyWorksBadge() {
  const teeth = Array.from({ length: 8 }, (_, i) =>
    `<rect x="90" y="18" width="20" height="30" rx="3" fill="#8a8f98" stroke="#111"` +
    ` stroke-width="4" transform="rotate(${i * 45} 100 100)"/>`).join("");
  return teeth +
    `<circle cx="100" cy="100" r="62" fill="#8a8f98" stroke="#111" stroke-width="6"/>` +
    `<circle cx="100" cy="100" r="22" fill="#2b2f36" stroke="#111" stroke-width="4"/>` +
    `<path d="M64 120 L100 72 L136 120 Z" fill="#ff9a3c" stroke="#111" stroke-width="5"` +
    ` stroke-linejoin="round"/>`;
}

function labBadge() {
  return `<rect x="22" y="128" width="156" height="34" rx="8" fill="#2b2f36" stroke="#111"` +
    ` stroke-width="6"/>` +
    `<path d="M30 130 A70 70 0 0 1 170 130 Z" fill="#7dffb0" fill-opacity="0.35"` +
    ` stroke="#d8fff0" stroke-width="6"/>` +
    `<polygon points="80,128 92,74 104,128" fill="#5ad8ff" stroke="#111" stroke-width="4"/>` +
    `<polygon points="100,128 116,58 132,128" fill="#5ad8ff" stroke="#111" stroke-width="4"/>` +
    `<polygon points="60,128 68,96 78,128" fill="#5ad8ff" stroke="#111" stroke-width="4"/>` +
    `<path d="M58 72 Q80 50 104 52" stroke="#ffffff" stroke-width="6" fill="none"` +
    ` stroke-linecap="round" opacity="0.8"/>`;
}

const BADGES = [["airfield", airfieldBadge], ["heavy-works", heavyWorksBadge],
  ["lab", labBadge]];

for (const [name, draw] of BADGES) {
  writeFileSync(`units/upgrade-${name}.svg`, `<svg xmlns="http://www.w3.org/2000/svg" ` +
    `width="200" height="200" viewBox="0 0 200 200">${draw()}</svg>\n`);
}

const TOKENS = [["infantry", infantry], ["transporter", transporter], ["chinook", chinook],
  ["turret", turret], ["vip", vip]];

for (const [colour, [fill, dark]] of Object.entries(COLOURS)) {
  for (const [name, draw] of TOKENS) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" ` +
      `viewBox="0 0 200 200">${draw(fill, dark)}</svg>\n`;
    writeFileSync(`units/${name}-${colour}.svg`, svg);
  }
}
