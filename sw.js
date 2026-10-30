// Minimal offline-first service worker.
// Bump the version in CACHE whenever you change the cached files, and keep ASSETS
// in sync with the files the app needs to work offline.
const CACHE = "mech-attack-v0.69";
const UNIT_TYPES = [
  "scout-bike", "tank", "heavy-cannon", "artillery", "light-harvester", "light-medic",
];
// Unit tokens in each player's colour (the Spotter Drone has no older PNG).
const TOKEN_TYPES = [
  ...UNIT_TYPES, "spotter-drone", "blast-cannon", "sonic-tank", "anti-aircraft-jeep",
  "attack-helicopter", "fighter", "infantry", "transporter", "chinook", "turret", "vip",
  "heavy-tank", "twin-turret",
];
// Player colours (more than two in multiplayer games).
const COLOURS = ["blue", "green", "yellow", "purple", "pink"];
const TILES = [
  "plain-1", "plain-2", "plain-3", "plain-4", "plain-5", "rocky-1", "rocky-2", "mountain-1",
  "chasm-n", "chasm-centre", "chasm-sw", "chasm-single",
];
const SOUND_FILES = [
  "tank-moving", "helicopter", "infantry-firing", "tank-firing", "capture-beep", "footsteps",
  "sonic-boom", "harvest",
];
const ASSETS = [
  ".",
  "index.html",
  "styles.css?v=0.69",
  "app.js?v=0.69",
  "version.js?v=0.69",
  "units.js?v=0.69",
  "game.js?v=0.69",
  "dialog.js?v=0.69",
  "board.js?v=0.69",
  "engine.js?v=0.69",
  "ai.js?v=0.69",
  "hex.js?v=0.69",
  "maps.js?v=0.69",
  "ai-personalities.js?v=0.69",
  "ai-personalities-multi.js?v=0.69",
  "rules-config.js?v=0.69",
  "sound.js?v=0.69",
  "tips.js?v=0.69",
  "campaign.js?v=0.69",
  "coop-campaign.js?v=0.69",
  "counters.js?v=0.69",
  "difficulty.js?v=0.69",
  "multiplayer.js?v=0.69",
  "net.js?v=0.69",
  "manifest.webmanifest",
  "icon.png",
  "favicon.png",
  "icon-maskable.png",
  "apple-touch-icon.png",
  "splash.jpg",
  "tiles/tiles.json?v=0.69",
  ...TILES.map((t) => `tiles/${t}.png`),
  ...UNIT_TYPES.map((u) => `units/${u}.png`),
  ...TOKEN_TYPES.flatMap((u) => COLOURS.map((colour) => `units/${u}-${colour}.svg`)),
  // Factory tiles: every combination of upgrades, for each player and for an unused factory.
  ...[...COLOURS, "neutral"].flatMap((colour) =>
    ["", "-lab", "-airfield", "-airfield-lab", "-heavy", "-heavy-lab", "-heavy-airfield",
      "-heavy-airfield-lab"].map((parts) => `units/factory${parts}-${colour}.webp`)),
  "units/crystals.svg",
  "units/explosion.svg",
  "units/sonic-boom.png",
  "units/upgrade-airfield.svg",
  "units/upgrade-heavy-works.svg",
  "units/upgrade-lab.svg",
  "units/upgrade-comms.svg",
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
