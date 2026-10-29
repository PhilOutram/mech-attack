// Writes simple placeholder tokens for units that have no artwork yet (Infantry, Transporter,
// Chinook and Commander Jeanne), in each player's colour. Replace them with the real art when
// it is drawn. The Turret has Phil's art (units/turret-*.svg), so it is not drawn here.
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

const TOKENS = [["infantry", infantry], ["transporter", transporter], ["chinook", chinook],
  ["vip", vip]];

for (const [colour, [fill, dark]] of Object.entries(COLOURS)) {
  for (const [name, draw] of TOKENS) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" ` +
      `viewBox="0 0 200 200">${draw(fill, dark)}</svg>\n`;
    writeFileSync(`units/${name}-${colour}.svg`, svg);
  }
}
