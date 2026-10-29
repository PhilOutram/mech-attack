// Mech Attack - splash screen with a menu: play against the AI, or the units reference.
import { VERSION, CHANGELOG } from "./version.js?v=0.21";
import { GROUPS, STATS, UNITS, NOTES } from "./units.js?v=0.21";
import { openGame, hasSavedGame, recentMaps, newMapId } from "./game.js?v=0.21";
import { confirmDialog } from "./dialog.js?v=0.21";
import { MAP_SIZES, MAP_SHAPES, shapeBlocks } from "./maps.js?v=0.21";

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

// Sound effects from freesound.org, all Creative Commons 0 (see CREDITS.md).
const SOUND_CREDITS = [
  ["S20-48 A squad firing 37mm anti tank guns", "craigsmith", 675587],
  ["tracks moving", "christerljung", 849062],
  ["Autocannon Three Shot Burst", "qubodup", 854186],
  ["Sea-king Helicopter", "Sandermotions", 333505],
  ["weird cowbell 1", "patchytherat", 532806],
  ["Footsteps_Mountain_Boots_Wet_Sand_Sequence_Mono", "Nox_Sound", 564893],
];

const splash = document.getElementById("splash");
const units = document.getElementById("units");

renderUnits();
renderVersionBadge();

const resume = document.getElementById("menu-resume");
refreshMenu();

const picker = document.getElementById("map-picker");

document.getElementById("menu-play").addEventListener("click", async () => {
  const replace = !hasSavedGame() || await confirmDialog({
    title: "New game?",
    text: "You have a game in progress. Starting a new one ends it.",
    confirm: "New game",
    cancel: "Keep it",
  });
  if (replace) showMapPicker();
});
resume.addEventListener("click", () => play({ resume: true }));
document.getElementById("menu-units").addEventListener("click", showUnits);
document.getElementById("home").addEventListener("click", showSplash);

// The size and shape chosen in the picker apply to New map and to a map typed by number.
// "Any" shape picks one of that size: at random for a new map, by number for a typed one.
const SIZE_KEY = "mech-attack.map-size";
const sizeSelect = document.getElementById("map-size");
const shapeSelect = document.getElementById("map-shape");
const MAP_SHAPE_COUNT = Object.keys(MAP_SHAPES).length;
const shapesOfSize = (size) => Object.keys(MAP_SHAPES).filter((s) => MAP_SHAPES[s].size === size);
sizeSelect.innerHTML = Object.entries(MAP_SIZES)
  .map(([size, name]) => `<option value="${size}">${name}</option>`).join("");
sizeSelect.value = storedSize();
fillShapes();
sizeSelect.addEventListener("change", () => {
  fillShapes();
  try {
    localStorage.setItem(SIZE_KEY, sizeSelect.value);
  } catch {
    // Not remembered; the picker still works.
  }
});

function storedSize() {
  try {
    const size = localStorage.getItem(SIZE_KEY);
    return MAP_SIZES[size] ? size : "small";
  } catch {
    return "small";
  }
}

function fillShapes() {
  shapeSelect.innerHTML = `<option value="any">Any</option>` +
    shapesOfSize(sizeSelect.value).map((shape) => {
      const label = `${MAP_SHAPES[shape].name} (${shapeBlocks(shape)} blocks)`;
      return `<option value="${shape}">${label}</option>`;
    }).join("");
}

// The chosen shape; for "Any", the one at index (wrapping round) among shapes of the size.
function chosenShape(index) {
  if (shapeSelect.value !== "any") return shapeSelect.value;
  const shapes = shapesOfSize(sizeSelect.value);
  return shapes[index % shapes.length];
}

const shapedId = (number) => {
  const shape = chosenShape(number);
  return shape === "classic" ? `map-${number}` : `map-${number}-${shape}`;
};
document.getElementById("map-new").addEventListener("click", () =>
  play({ mapId: newMapId(chosenShape(Math.floor(Math.random() * MAP_SHAPE_COUNT))) }));
document.getElementById("map-fixed").addEventListener("click", () => play({ mapId: "fixed-1" }));
document.getElementById("map-cancel").addEventListener("click", () => {
  picker.hidden = true;
});
document.getElementById("map-number-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const number = Number(document.getElementById("map-number").value);
  if (Number.isInteger(number) && number >= 1) play({ mapId: shapedId(number) });
});
document.getElementById("map-recent").addEventListener("click", (e) => {
  const button = e.target.closest("button[data-map]");
  if (button) play({ mapId: button.dataset.map });
});

function refreshMenu() {
  resume.hidden = !hasSavedGame();
}

// Pick a map: a new one, the fixed map, one by number, or one played before.
function showMapPicker() {
  const list = recentMaps();
  document.getElementById("map-recent").innerHTML = list.length
    ? list.map((m) => `<li><button type="button" class="recent-map" data-map="${m.id}">` +
        `<span>${m.name}</span><span class="muted">won ${m.wins} · lost ${m.losses}</span>` +
        `</button></li>`).join("")
    : `<li class="muted">None yet.</li>`;
  picker.hidden = false;
}

function play(options) {
  picker.hidden = true;
  splash.hidden = true;
  openGame({ ...options, onLeave: showSplash });
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
    ).join("") +
    "<h2>Sound credits</h2><p class=\"muted\">From freesound.org, Creative Commons 0. " +
    "Thank you!</p><ul>" +
    SOUND_CREDITS.map(([title, author, id]) =>
      `<li><a href="https://freesound.org/people/${author}/sounds/${id}/" target="_blank" ` +
      `rel="noopener">${title}</a> by ${author}</li>`).join("") +
    "</ul>";
  overlay.appendChild(panel);
  document.body.appendChild(overlay);
}
