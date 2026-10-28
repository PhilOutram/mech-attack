// Mech Attack - splash screen with a menu: play against the AI, or the units reference.
import { VERSION, CHANGELOG } from "./version.js?v=0.02";
import { GROUPS, STATS, UNITS, NOTES } from "./units.js?v=0.02";
import { openGame, hasSavedGame } from "./game.js?v=0.02";

// Register the service worker so the app is installable and works offline.
// The relative path resolves correctly on the GitHub Pages /<slug>/ subpath.
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch((err) => {
      console.warn("Service worker registration failed:", err);
    });
  });
}

const SIZE_NAMES = { L: "Light", H: "Heavy" };

const splash = document.getElementById("splash");
const units = document.getElementById("units");

renderUnits();
renderVersionBadge();

const resume = document.getElementById("menu-resume");
refreshMenu();

document.getElementById("menu-play").addEventListener("click", () => {
  const replace = !hasSavedGame() || confirm("Start a new game? Your saved game will be lost.");
  if (replace) play(false);
});
resume.addEventListener("click", () => play(true));
document.getElementById("menu-units").addEventListener("click", showUnits);
document.getElementById("home").addEventListener("click", showSplash);

function refreshMenu() {
  resume.hidden = !hasSavedGame();
}

function play(fromSave) {
  splash.hidden = true;
  openGame({ resume: fromSave, onLeave: showSplash });
}

function showUnits() {
  splash.hidden = true;
  units.hidden = false;
  window.scrollTo(0, 0);
}

function showSplash() {
  units.hidden = true;
  splash.hidden = false;
  refreshMenu();
}

function renderUnits() {
  const list = document.getElementById("unit-list");
  list.innerHTML = GROUPS.map((g) => {
    const members = UNITS.filter((unit) => unit.code.startsWith(g.prefix));
    return (
      `<section class="group"><h2>${g.name}</h2>` +
      `<div class="cards">${members.map(unitCard).join("")}</div></section>`
    );
  }).join("");

  document.getElementById("notes-list").innerHTML =
    NOTES.map((n) => `<li>${n}</li>`).join("");
}

function unitCard(unit) {
  const art = unit.icon
    ? `<img src="units/${unit.icon}" alt="" loading="lazy" />`
    : `<span class="placeholder">${unit.code}</span>`;
  const stats = STATS.map(
    (s) => `<div class="stat"><dt>${s.label}</dt><dd>${statText(unit[s.key])}</dd></div>`
  ).join("");
  const abilities = unit.abilities ? `<p class="abilities">${unit.abilities}</p>` : "";

  return (
    `<article class="card">` +
    `<div class="art">${art}</div>` +
    `<div class="info">` +
    `<h3><span class="code">${unit.code}</span>${unit.name}</h3>` +
    `<p class="tags">${unit.type} &middot; ${SIZE_NAMES[unit.size]}</p>` +
    `<dl class="stats">${stats}</dl>${abilities}` +
    `</div></article>`
  );
}

// Zero and undecided values show as a dash, as on the printed unit table.
function statText(value) {
  return value ? value : "-";
}

// Version badge: shows the current version; click to see the changelog.
function renderVersionBadge() {
  const badge = document.createElement("button");
  badge.className = "version-badge";
  badge.textContent = VERSION;
  badge.title = "Changelog";
  badge.addEventListener("click", (e) => {
    e.stopPropagation();
    showChangelog();
  });
  document.body.appendChild(badge);
}

function showChangelog() {
  const overlay = document.createElement("div");
  overlay.className = "changelog-overlay";
  overlay.addEventListener("click", () => overlay.remove());

  const panel = document.createElement("div");
  panel.className = "changelog";
  panel.addEventListener("click", (e) => e.stopPropagation());
  panel.innerHTML =
    "<h2>Changelog</h2>" +
    CHANGELOG.map(
      (e) =>
        `<section><h3>${e.version} <span class="muted">${e.date}</span></h3>` +
        `<ul>${e.notes.map((n) => `<li>${n}</li>`).join("")}</ul></section>`
    ).join("");
  overlay.appendChild(panel);
  document.body.appendChild(overlay);
}
