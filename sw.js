// Minimal offline-first service worker.
// Bump the version in CACHE whenever you change the cached files, and keep ASSETS
// in sync with the files the app needs to work offline.
const CACHE = "mech-attack-v0.10";
const UNIT_TYPES = [
  "scout-bike", "tank", "heavy-cannon", "artillery", "light-harvester", "light-medic",
];
// Unit tokens in each player's colour (the Spotter Drone has no older PNG).
const TOKEN_TYPES = [...UNIT_TYPES, "spotter-drone"];
const TILES = [
  "plain-1", "plain-2", "rocky-1", "rocky-2", "rocky-3", "mountain-1",
  "chasm-n", "chasm-centre", "chasm-sw", "chasm-single",
];
const ASSETS = [
  ".",
  "index.html",
  "styles.css?v=0.10",
  "app.js?v=0.10",
  "version.js?v=0.10",
  "units.js?v=0.10",
  "game.js?v=0.10",
  "dialog.js?v=0.10",
  "board.js?v=0.10",
  "engine.js?v=0.10",
  "ai.js?v=0.10",
  "hex.js?v=0.10",
  "maps.js?v=0.10",
  "rules-config.js?v=0.10",
  "manifest.webmanifest",
  "icon.png",
  "favicon.png",
  "icon-maskable.png",
  "apple-touch-icon.png",
  "splash.jpg",
  "tiles/tiles.json?v=0.10",
  ...TILES.map((t) => `tiles/${t}.png`),
  ...UNIT_TYPES.map((u) => `units/${u}.png`),
  ...TOKEN_TYPES.flatMap((u) => [`units/${u}-blue.svg`, `units/${u}-green.svg`]),
  "units/factory.svg",
  "units/crystals.svg",
  "units/explosion.svg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
      )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    caches.match(event.request).then((hit) => hit || fetch(event.request))
  );
});
