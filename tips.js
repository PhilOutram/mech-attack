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
    text: "You are blue. Win by overrunning Green's home factory with Infantry, or by wiping " +
      "out Green's army. Tap one of your units to see what it can do, tap a highlighted hex " +
      "to act, then press End turn. The map is face down: blocks turn over as your units " +
      "move next to them.",
  }),
  harvester: () => ({
    title: "Harvesting crystals",
    text: "Move a harvester (or a Scout Bike) next to a crystal pile and choose Harvest to " +
      "collect crystals, up to what it can carry. Then bring it back next to one of your " +
      "factories: it unloads into your crystal store, which pays for new units.",
  }),
  factory: (rules) => ({
    title: "Your factory",
    text: "Tap a unit to build it on a free hex next to the factory; it can act from your " +
      "next turn. A factory builds light units only until you add Heavy works " +
      `(${rules.factoryUpgrades.heavyWorks.cost}) for heavy units or an Airfield ` +
      `(${rules.factoryUpgrades.airfield.cost}) for air units. A Crystal lab ` +
      `(${rules.factoryUpgrades.lab.cost}) makes ${rules.factoryUpgrades.lab.income} crystals ` +
      "every turn. Factories cannot be fired on: they can only be overrun by Infantry.",
  }),
  combat: (rules) => ({
    title: "Firing",
    text: "Red hexes are targets in range. A unit hit by attacks totalling its defence in one " +
      "turn loses a life (its tile flips); twice its defence destroys it. Attacks by " +
      "several units in the same turn add up. A unit attacked from next door fires back if " +
      `its range is ${rules.combat.returnFireMaxRange} or less.`,
  }),
  blastCrystals: () => ({
    title: "Blowing up crystals",
    text: "Crystal piles in range show yellow. Crystals are unstable: one shot destroys the " +
      "whole pile and uses the unit's attack for the turn. Use it to starve your enemy of " +
      "piles near their side; harvest the ones near yours.",
  }),
  blindFire: () => ({
    title: "Firing blind",
    text: "The faint red hexes are in range but out of sight. You can fire into them blind: " +
      "if an enemy is there it is hit, and you will hear whether you hit something. Empty " +
      "hexes waste the shot.",
  }),
  crystals: (rules) => ({
    title: "Driving over crystals",
    text: "Driving onto or over crystals destroys them. Units go round piles when they can; " +
      "moves shown in yellow can only be made by crushing crystals. Piles grow every turn " +
      `up to ${rules.crystals.explodeAt}, wait there a turn for each player, then explode, ` +
      "so harvest them in time.",
  }),
  rough: (rules) => ({
    title: "Rough ground",
    text: "Rocky hexes are rough ground. Crossing one costs " +
      `${rules.terrain.rocky.moveCost} move points instead of 1, but a ground unit standing ` +
      `on it gets +${rules.terrain.rocky.defenceBonus} defence: a good place to hold.`,
  }),
  mountain: () => ({
    title: "Mountains and chasms",
    text: "Ground units cannot enter mountains or chasms. Mountains also block line of sight: " +
      "most units cannot see or fire past them, and a sonic boom stops at them. Artillery " +
      "fires over them, at anything one of your units can see. Air units fly over both.",
  }),
  newGround: () => ({
    title: "New ground",
    text: "A move stops when it turns over face-down blocks, so you can see what is there " +
      "before going on. The unit keeps the rest of its move: tap where to go next, or " +
      "give it another order.",
  }),
  infantry: () => ({
    title: "Infantry",
    text: "Infantry are weak, but they are the only unit that can overrun a factory. They " +
      "must start a turn next to it to break in, then move into it. That is a turn in which " +
      "the enemy can pick them off, so keep them covered. Infantry can also shoot at air " +
      "units and ride in a Transporter.",
  }),
  siege: () => ({
    title: "Breaking in",
    text: "Your Infantry are next to a factory. Next turn, if they are still there, tap " +
      "them, then tap the factory to overrun it.",
  }),
  defend: () => ({
    title: "Your factory is in danger",
    text: "Enemy Infantry are next to your factory. If they are still there at the start of " +
      "Green's next turn, they can overrun it. Destroy them now: Infantry have very little " +
      "defence.",
  }),
  transporter: () => ({
    title: "Transporter",
    text: "Move infantry onto the Transporter to board it. Drive it where you want, then " +
      "choose Drop off to put them on a hex next to it. Passengers are lost if their " +
      "Transporter is destroyed.",
  }),
  unusedFactory: (rules) => ({
    title: "Unused factory",
    text: "Nobody owns this factory yet. Infantry that start a turn next to it can move in " +
      `and capture it, with the ${rules.capture.unusedFactoryCrystals} crystals in its store. ` +
      "It will then build units for you.",
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
  ruins: (rules) => ({
    title: "Ruins",
    text: "A ruined factory. Infantry next to it can search it once, which uses their " +
      "turn: there may be a stash of crystals (up to " + `${rules.ruins.crystals[1]}), a ` +
      `unit to join you (worth up to ${rules.ruins.unitMaxCost}), or an enemy unit hiding ` +
      "in the rubble. After that it is just rubble.",
  }),
  explosion: (rules) => ({
    title: "Crystal explosion",
    text: `A crystal pile sat at ${rules.crystals.explodeAt} too long and exploded: its ` +
      "crystals are lost. A pile's number turns amber when it reaches the explode level and " +
      "red when it will explode at the end of the turn.",
  }),
};

// "built:<unit type>": shown the first time you build that type. What it can do, from its
// stats in the rules.
const HITS = { ground: "ground units", air: "air units only", both: "ground and air units" };
const BUILT_PREFIX = "built:";

function builtTip(type, rules) {
  const s = rules.units[type];
  const [near, far] = s.range || [];
  const range = near === far ? `${near}` : `${near} to ${far}`;
  const parts = [`Move ${s.move}, defence ${s.defence}.`];
  if (s.attack) {
    parts.push(`Attack ${s.attack} at range ${range}, hitting ${HITS[s.hits || "ground"]}.`);
  }
  if (s.air) parts.push("It flies over everything; only attacks that hit air can touch it.");
  if (s.storage) {
    parts.push(`It carries up to ${s.storage} crystals: drive next to a pile and tap Harvest ` +
      "(then the pile, if there are several). Next turn, bring it back next to one of your " +
      "factories and it unloads.");
  }
  if (s.healing) {
    parts.push("Move it next to a damaged unit and tap Repair to restore a life.");
  }
  if (s.move === 0) parts.push("It never moves, so place it where it can guard.");
  if (s.captures) {
    parts.push("Start a turn next to a factory, then move into it to overrun it.");
  }
  if (s.carries) {
    parts.push(s.loads === "ground"
      ? "It carries one vehicle or two Infantry: move them onto it to board, then fly and " +
        "tap Drop off."
      : `It carries up to ${s.carries} Infantry: move them onto it to board.`);
  }
  if (s.needsSetup) parts.push("It must Set up before it can fire.");
  if (s.splash) parts.push("Its blast also hits enemies next to the target.");
  if (s.line) parts.push("Its sonic boom hits every enemy along a straight line.");
  if (s.reload) parts.push("It fires every other turn.");
  if (s.shots > 1) {
    parts.push(`It fires ${s.shots} times a turn, each at a different target, but only at ` +
      "the hexes next to it: tap Fire again after the first shot.");
  }
  parts.push("New units can act from your next turn.");
  return { title: `New unit: ${s.name}`, text: parts.join(" ") };
}

function tipFor(id) {
  if (TIPS[id]) return TIPS[id];
  if (!id.startsWith(BUILT_PREFIX)) return null;
  return (rules) => builtTip(id.slice(BUILT_PREFIX.length), rules);
}

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
  if (!tipFor(id) || tipsOff() || seenList().includes(id) || queue.includes(id)) return;
  queue.push(id);
  if (!showing) next(rules);
}

// A one-off note in the same popup, such as a campaign mission's top tip: { title, text }. It
// shows every time it is asked for.
export function showNote(note, rules) {
  queue.push(note);
  if (!showing) next(rules);
}

// Help on the main menu: every tip will show again.
export function resetTips() {
  store(SEEN_KEY, "[]");
  store(OFF_KEY, "false");
}

function next(rules) {
  const item = queue.shift();
  if (!item) {
    showing = false;
    return;
  }
  showing = true;
  if (typeof item === "string") store(SEEN_KEY, JSON.stringify([...seenList(), item]));
  const { title, text } = typeof item === "string" ? tipFor(item)(rules) : item;
  const overlay = document.getElementById("tip-dialog");
  const ok = document.getElementById("tip-ok");
  const hide = document.getElementById("tip-hide");
  document.getElementById("tip-title").textContent = title;
  document.getElementById("tip-text").textContent = text;
  overlay.hidden = false;
  overlay.querySelector(".map-picker-card").scrollTop = 0;
  ok.focus({ preventScroll: true });

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
