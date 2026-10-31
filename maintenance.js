// Phil's master switch (31 October 2026): maintenance.json in the repo says whether the game is
// down. While it is, a screen covering everything says so, until the file says otherwise.
// The file is fetched fresh, never from the offline cache. The last answer is remembered on
// the device, so going offline does not bring the game back.

const SWITCH_FILE = "maintenance.json";
const STORE_KEY = "mech-attack.maintenance";
// How often the switch is checked again while the app is open.
const CHECK_EVERY_MS = 2 * 60 * 1000;

const screen = document.getElementById("maintenance");

function remembered() {
  try {
    return localStorage.getItem(STORE_KEY) === "down";
  } catch {
    return false;
  }
}

function remember(down) {
  try {
    localStorage.setItem(STORE_KEY, down ? "down" : "up");
  } catch {
    // Not remembered; the screen still follows the switch while online.
  }
}

function show(down) {
  screen.hidden = !down;
  document.body.classList.toggle("is-down", down);
}

async function check() {
  try {
    // A new address each time, so neither the browser, GitHub's servers nor the service
    // worker hand back an old copy.
    const response = await fetch(`${SWITCH_FILE}?t=${Date.now()}`, { cache: "no-store" });
    if (!response.ok) return;
    const { down } = await response.json();
    remember(Boolean(down));
    show(Boolean(down));
  } catch {
    // Offline or unreadable: keep the last answer.
  }
}

export function watchMaintenance() {
  show(remembered());
  check();
  setInterval(check, CHECK_EVERY_MS);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") check();
  });
}
