// Helper popups for new players (Phil, 29 October 2026). Each tip shows once, the first time
// the player meets that part of the game; "Hide tips" turns them all off and Help on the main
// menu turns them back on. What has been seen is remembered on this device. Tips come one at a
// time: one asked for while another is showing waits its turn.

const SEEN_KEY = "mech-attack.tips-seen";
const OFF_KEY = "mech-attack.tips-off";

// The tips. Numbers come from the rules, so the text stays right when the rules change.
const TIPS = {
  welcome: () => ({
    title: "Welcome to Mech Attack",
    text: "You are blue. Win by destroying Green's home factory. Tap one of your units to " +
      "see what it can do, tap a highlighted hex to act, then press End turn. The map is " +
      "face down: blocks turn over as your units move next to them.",
  }),
  harvester: () => ({
    title: "Harvesting crystals",
    text: "Move a harvester next to a crystal pile and choose Harvest to collect crystals, up " +
      "to what it can carry. Then bring it back next to one of your factories: it unloads " +
      "into your crystal store, which pays for new units.",
  }),
  factory: (rules) => ({
    title: "Your factory",
    text: "Tap a unit to build it on a free hex next to the factory; it can act from your " +
      "next turn. A factory builds light units only until you add Heavy works " +
      `(${rules.factoryUpgrades.heavyWorks.cost}) for heavy units or an Airfield ` +
      `(${rules.factoryUpgrades.airfield.cost}) for air units.`,
  }),
  combat: (rules) => ({
    title: "Firing",
    text: "Red hexes are targets in range. A unit hit by attacks totalling its defence in one " +
      "turn loses a life (its tile flips); twice its defence destroys it. Attacks by " +
      "several units in the same turn add up. A unit attacked from next door fires back if " +
      `its range is ${rules.combat.returnFireMaxRange} or less.`,
  }),
  crystals: (rules) => ({
    title: "Driving over crystals",
    text: "Driving onto or over crystals destroys them. Units go round piles when they can; " +
      "moves shown in yellow can only be made by crushing crystals. Piles grow every turn " +
      `and explode at ${rules.crystals.explodeAt}, so harvest them in time.`,
  }),
  rough: (rules) => ({
    title: "Rough ground",
    text: `Rough ground (rocky hexes) costs ${rules.terrain.rocky.moveCost} move points to ` +
      `cross, but a ground unit standing on it gets +${rules.terrain.rocky.defenceBonus} ` +
      "defence.",
  }),
  infantry: (rules) => ({
    title: "Infantry",
    text: "Infantry are weak, but they are the only unit that can capture a factory: move " +
      `them into it. A captured factory builds for you and pays ${rules.capture.incomePerTurn} ` +
      "crystals every turn. Infantry can also shoot at air units and ride in a Transporter.",
  }),
  transporter: () => ({
    title: "Transporter",
    text: "Move infantry onto the Transporter to board it. Drive it where you want, then " +
      "choose Drop off to put them on a hex next to it, or straight into a factory to " +
      "capture it. Infantry inside are lost if the Transporter is destroyed.",
  }),
  unusedFactory: (rules) => ({
    title: "Unused factory",
    text: "Nobody owns this factory yet. Move infantry into it to capture it: it will build " +
      `units for you and pay ${rules.capture.incomePerTurn} crystals every turn.`,
  }),
  air: () => ({
    title: "Air units",
    text: "Air units fly over mountains, chasms, units and crystals without crushing them. " +
      "Only attacks that hit air can touch them: Infantry, the Anti-Aircraft Jeep, the " +
      "Fighter and the Sonic Tank.",
  }),
  artillery: () => ({
    title: "Artillery",
    text: "Artillery must Set up before it can fire, which takes its action for the turn. " +
      "Once set up it cannot move until it packs up again.",
  }),
  medic: () => ({
    title: "Repairs",
    text: "Move the medic next to a damaged unit and choose Repair to give it back a life.",
  }),
  explosion: (rules) => ({
    title: "Crystal explosion",
    text: `A crystal pile reached ${rules.crystals.explodeAt} and exploded: its crystals are ` +
      "lost. A pile's number turns red when it will explode at the end of the turn.",
  }),
};

const queue = [];
let showing = false;

function seenList() {
  try {
    return JSON.parse(localStorage.getItem(SEEN_KEY)) || [];
  } catch {
    return [];
  }
}

function tipsOff() {
  try {
    return localStorage.getItem(OFF_KEY) === "true";
  } catch {
    return false;
  }
}

function store(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Not remembered; tips may show again next time.
  }
}

// Shows the tip with this id, unless it has been seen or tips are off.
export function showTip(id, rules) {
  if (!TIPS[id] || tipsOff() || seenList().includes(id) || queue.includes(id)) return;
  queue.push(id);
  if (!showing) next(rules);
}

// Help on the main menu: every tip will show again.
export function resetTips() {
  store(SEEN_KEY, "[]");
  store(OFF_KEY, "false");
}

function next(rules) {
  const id = queue.shift();
  if (!id) {
    showing = false;
    return;
  }
  showing = true;
  store(SEEN_KEY, JSON.stringify([...seenList(), id]));
  const { title, text } = TIPS[id](rules);
  const overlay = document.getElementById("tip-dialog");
  const ok = document.getElementById("tip-ok");
  const hide = document.getElementById("tip-hide");
  document.getElementById("tip-title").textContent = title;
  document.getElementById("tip-text").textContent = text;
  overlay.hidden = false;
  ok.focus();

  const close = (hideAll) => {
    overlay.hidden = true;
    ok.removeEventListener("click", onOk);
    hide.removeEventListener("click", onHide);
    overlay.removeEventListener("click", onBackdrop);
    document.removeEventListener("keydown", onKey);
    if (hideAll) {
      store(OFF_KEY, "true");
      queue.length = 0;
    }
    next(rules);
  };
  const onOk = () => close(false);
  const onHide = () => close(true);
  const onBackdrop = (e) => {
    if (e.target === overlay) close(false);
  };
  const onKey = (e) => {
    if (e.key === "Escape" || e.key === "Enter") close(false);
  };
  ok.addEventListener("click", onOk);
  hide.addEventListener("click", onHide);
  overlay.addEventListener("click", onBackdrop);
  document.addEventListener("keydown", onKey);
}
