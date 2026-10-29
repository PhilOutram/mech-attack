// Minimal offline-first service worker.
// Bump the version in CACHE whenever you change the cached files, and keep ASSETS
// in sync with the files the app needs to work offline.
const CACHE = "mech-attack-v0.48";
const UNIT_TYPES = [
  "scout-bike", "tank", "heavy-cannon", "artillery", "light-harvester", "light-medic",
];
// Unit tokens in each player's colour (the Spotter Drone has no older PNG).
const TOKEN_TYPES = [
  ...UNIT_TYPES, "spotter-drone", "blast-cannon", "sonic-tank", "anti-aircraft-jeep",
  "attack-helicopter", "fighter", "infantry", "transporter", "chinook", "turret", "vip",
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
  "styles.css?v=0.48",
  "app.js?v=0.48",
  "version.js?v=0.48",
  "units.js?v=0.48",
  "game.js?v=0.48",
  "dialog.js?v=0.48",
  "board.js?v=0.48",
  "engine.js?v=0.48",
  "ai.js?v=0.48",
  "hex.js?v=0.48",
  "maps.js?v=0.48",
  "ai-personalities.js?v=0.48",
  "rules-config.js?v=0.48",
  "sound.js?v=0.48",
  "tips.js?v=0.48",
  "campaign.js?v=0.48",
  "counters.js?v=0.48",
  "difficulty.js?v=0.48",
  "manifest.webmanifest",
  "icon.png",
  "favicon.png",
  "icon-maskable.png",
  "apple-touch-icon.png",
  "splash.jpg",
  "tiles/tiles.json?v=0.48",
  ...TILES.map((t) => `tiles/${t}.png`),
  ...UNIT_TYPES.map((u) => `units/${u}.png`),
  ...TOKEN_TYPES.flatMap((u) => [`units/${u}-blue.svg`, `units/${u}-green.svg`]),
  // Factory tiles: every combination of upgrades, for each player and for an unused factory.
  ...["blue", "green", "neutral"].flatMap((colour) =>
    ["", "-lab", "-airfield", "-airfield-lab", "-heavy", "-heavy-lab", "-heavy-airfield",
      "-heavy-airfield-lab"].map((parts) => `units/factory${parts}-${colour}.webp`)),
  "units/crystals.svg",
  "units/explosion.svg",
  "units/upgrade-airfield.svg",
  "units/upgrade-heavy-works.svg",
  "units/upgrade-lab.svg",
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
