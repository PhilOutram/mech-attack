// Minimal offline-first service worker.
// Bump the version in CACHE whenever you change the cached files, and keep ASSETS
// in sync with the files the app needs to work offline.
const CACHE = "mech-attack-v0.31";
const UNIT_TYPES = [
  "scout-bike", "tank", "heavy-cannon", "artillery", "light-harvester", "light-medic",
];
// Unit tokens in each player's colour (the Spotter Drone has no older PNG).
const TOKEN_TYPES = [
  ...UNIT_TYPES, "spotter-drone", "blast-cannon", "sonic-tank", "anti-aircraft-jeep",
  "attack-helicopter", "fighter", "infantry", "transporter",
];
const TILES = [
  "plain-1", "plain-2", "plain-3", "plain-4", "plain-5", "rocky-1", "rocky-2", "mountain-1",
  "chasm-n", "chasm-centre", "chasm-sw", "chasm-single",
];
const SOUND_FILES = [
  "tank-moving", "helicopter", "infantry-firing", "tank-firing", "capture-beep", "footsteps",
];
const ASSETS = [
  ".",
  "index.html",
  "styles.css?v=0.31",
  "app.js?v=0.31",
  "version.js?v=0.31",
  "units.js?v=0.31",
  "game.js?v=0.31",
  "dialog.js?v=0.31",
  "board.js?v=0.31",
  "engine.js?v=0.31",
  "ai.js?v=0.31",
  "hex.js?v=0.31",
  "maps.js?v=0.31",
  "ai-personalities.js?v=0.31",
  "rules-config.js?v=0.31",
  "sound.js?v=0.31",
  "tips.js?v=0.31",
  "campaign.js?v=0.31",
  "manifest.webmanifest",
  "icon.png",
  "favicon.png",
  "icon-maskable.png",
  "apple-touch-icon.png",
  "splash.jpg",
  "tiles/tiles.json?v=0.31",
  ...TILES.map((t) => `tiles/${t}.png`),
  ...UNIT_TYPES.map((u) => `units/${u}.png`),
  ...TOKEN_TYPES.flatMap((u) => [`units/${u}-blue.svg`, `units/${u}-green.svg`]),
  "units/factory.svg",
  "units/crystals.svg",
  "units/explosion.svg",
  ...SOUND_FILES.map((f) => `audio/${f}.mp3`),
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

// The page itself comes from the network when online (checking with the server, not the
// browser's own cache), so a new version shows on the first open after publishing; offline,
// the cached copy is used. Everything else is cache-first: its URLs carry ?v= and change with
// each version.
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request, { cache: "no-cache" })
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE).then((cache) => cache.put("index.html", copy));
          }
          return response;
        })
        .catch(() => caches.match("index.html"))
    );
    return;
  }
  event.respondWith(
    caches.match(event.request).then((hit) => hit || fetch(event.request))
  );
});
