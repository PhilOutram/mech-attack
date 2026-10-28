// Minimal offline-first service worker.
// Bump the version in CACHE whenever you change the cached files, and keep ASSETS
// in sync with the files the app needs to work offline.
const CACHE = "mech-attack-v0.08";
const UNIT_TYPES = [
  "scout-bike", "tank", "heavy-cannon", "artillery", "light-harvester", "light-medic",
];
const TILES = [
  "plain-1", "plain-2", "rocky-1", "rocky-2", "rocky-3", "mountain-1",
  "chasm-n", "chasm-centre", "chasm-sw", "chasm-single",
];
const ASSETS = [
  ".",
  "index.html",
  "styles.css?v=0.08",
  "app.js?v=0.08",
  "version.js?v=0.08",
  "units.js?v=0.08",
  "game.js?v=0.08",
  "dialog.js?v=0.08",
  "board.js?v=0.08",
  "engine.js?v=0.08",
  "ai.js?v=0.08",
  "hex.js?v=0.08",
  "maps.js?v=0.08",
  "rules-config.js?v=0.08",
  "manifest.webmanifest",
  "icon.png",
  "favicon.png",
  "icon-maskable.png",
  "apple-touch-icon.png",
  "splash.jpg",
  "tiles/tiles.json?v=0.08",
  ...TILES.map((t) => `tiles/${t}.png`),
  ...UNIT_TYPES.map((u) => `units/${u}.png`),
  ...UNIT_TYPES.flatMap((u) => [`units/${u}-blue.svg`, `units/${u}-green.svg`]),
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
