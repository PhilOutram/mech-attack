// The combat report (Phil, 22 November 2026): what each shot did, worked out from the
// engine's events, in words a new player can follow. For every shot: who fired on whom, its
// attack against the target's defence (with the ground's bonus shown), what earlier shots
// this turn added, and how many lives that cost. Return fire, overwatch, blast and sonic-boom
// hits are reported with the shot that caused them. No DOM here, so it can be tested in Node.

// Events that are an attack on one unit; each is followed by a "hit" on its target when the
// shot lands.
const ATTACKS = ["fire", "returnFire", "overwatch", "splash", "lineHit"];
// Attacks that start a new report; the others belong to the shot before them.
const STARTS_REPORT = ["fire", "overwatch"];

export const ADD_UP_NOTE = "Attacks on the same unit in one turn add up. Lives lost stay " +
  "lost, but damage that took no life is cleared at the end of the turn.";

// "Your Scout Bike" in the middle of a sentence is "your Scout Bike".
const midSentence = (name) => name.replace(/^Your /, "your ");

// The target's defence, with the ground's bonus where there is one: "defence 30 (Tank 25,
// +5 for rocky ground)".
function defenceText(hit, rules, targetType) {
  if (!hit.cover) return `defence ${hit.defence}`;
  return `defence ${hit.defence} (${rules.units[targetType].name} ${hit.base}, ` +
    `+${hit.cover} for ${hit.terrain} ground)`;
}

// What the hit did, as a sentence.
function outcomeText(hit, rules) {
  const { total, defence, livesAtStart, livesBefore, livesAfter } = hit;
  const twice = rules.combat.loseTwoLivesAt * defence;
  const once = rules.combat.loseOneLifeAt * defence;
  if (livesAfter === 0 && livesAtStart === 1) {
    return `${total} reaches its defence (${once}), and it was already damaged: its last ` +
      "life is lost. Destroyed.";
  }
  if (livesAfter === 0 && livesBefore < livesAtStart) {
    return `It had already lost a life this turn. ${total} reaches twice its defence ` +
      `(${twice}): its second life is lost too. Destroyed.`;
  }
  if (livesAfter === 0) {
    return `${total} is at least twice its defence (${twice}): both lives lost. Destroyed.`;
  }
  if (livesAfter < livesBefore) {
    return `${total} reaches its defence (${once}) but not twice it (${twice}): one life ` +
      "lost, and its tile flips over to the damaged side.";
  }
  if (total < once) {
    return `${total} is less than its defence (${once}): no life lost. ${once - total} ` +
      "more this turn would take a life.";
  }
  return `It already lost a life this turn. ${twice - total} more this turn (${twice} in ` +
    "all) would destroy it.";
}

// One shot's paragraph: "Green Infantry fires back at the same time: attack 10 against
// defence 10. 10 reaches its defence (10) ...". The report's own shot, named in its title,
// starts at "Attack 15 against defence 5." (titled).
function shotText(attack, hit, name, typeOf, rules, titled) {
  const target = name(attack.targetId);
  const verb = {
    fire: `${name(attack.unitId)} fires on ${midSentence(target)}`,
    overwatch: `${name(attack.unitId)}, on overwatch, fires on ${midSentence(target)}`,
    returnFire: `${name(attack.unitId)} fires back at the same time`,
    splash: `${target} is caught in the blast`,
    lineHit: `${target} is also hit by the sonic boom`,
  }[attack.type];
  const earlier = hit.total - hit.amount;
  const sum = earlier ? ` With ${earlier} already this turn, that makes ${hit.total}.` : "";
  const against = `attack ${hit.amount} against ` +
    `${defenceText(hit, rules, typeOf(attack.targetId))}.${sum} ${outcomeText(hit, rules)}`;
  return titled ? `A${against.slice(1)}` : `${verb}: ${against}`;
}

// A one-line summary for the log: "Your Scout Bike 15 vs Green Infantry 5: destroyed."
function shortText(attack, hit, name) {
  const who = attack.type === "splash" ? "Blast" : attack.type === "lineHit" ? "Sonic boom"
    : name(attack.unitId);
  const earlier = hit.total - hit.amount;
  const amount = earlier ? `${hit.amount} (${hit.total} this turn)` : `${hit.amount}`;
  const lost = hit.livesBefore - hit.livesAfter;
  const result = hit.livesAfter === 0 ? "destroyed"
    : lost ? "1 life lost" : "no life lost";
  return `${who} ${amount} vs ${midSentence(name(attack.targetId))} ${hit.defence}: ${result}.`;
}

// The reports for a list of events. name(unitId) gives "Your Scout Bike" or "Green
// Infantry"; typeOf(unitId) the unit's type; shown(attack) whether you saw that attack.
// Each report: { title, paragraphs, lines } where lines are the log's short versions.
export function combatReports(events, { name, typeOf, shown, rules }) {
  const reports = [];
  let current = null;
  events.forEach((e, i) => {
    if (!ATTACKS.includes(e.type)) return;
    // The hit this attack caused: the next hit on its target before the next attack.
    let hit = null;
    for (let j = i + 1; j < events.length && !ATTACKS.includes(events[j].type); j++) {
      if (events[j].type === "hit" && events[j].unitId === e.targetId) {
        hit = events[j];
        break;
      }
    }
    if (STARTS_REPORT.includes(e.type) || !current) {
      current = null;
      if (!shown(e) || !hit) return;
      current = { title: `${name(e.unitId)} fires on ${midSentence(name(e.targetId))}`,
        paragraphs: [], lines: [] };
      reports.push(current);
    }
    if (!hit || !shown(e)) return;
    const titled = !current.paragraphs.length && STARTS_REPORT.includes(e.type);
    current.paragraphs.push(shotText(e, hit, name, typeOf, rules, titled));
    current.lines.push(shortText(e, hit, name));
  });
  return reports;
}

// The banner's sum behind a hit: attack against defence and what it does, e.g. "Tank ATT 25
// vs Tank DEF 30 (25 + 5 rocky) -> NO HIT (25 < 30): 5 more this turn".
export function attackSum(attackerType, targetType, hit, rules) {
  const { amount, total, defence, livesBefore, livesAfter } = hit;
  const twice = rules.combat.loseTwoLivesAt * defence;
  const attack = total === amount ? `ATT ${amount}` : `ATT ${amount} (${total} this turn)`;
  const ground = hit.cover ? ` (${hit.base} + ${hit.cover} ${hit.terrain})` : "";
  let result;
  if (livesAfter === 0) {
    result = total >= twice ? `DESTROYED (${total} ≥ 2 × ${defence})`
      : `DESTROYED (${total} ≥ ${defence}, already damaged)`;
  } else if (livesAfter < livesBefore) {
    result = `1 HIT (${total} ≥ ${defence}): now damaged`;
  } else if (total >= defence) {
    result = `no more damage: ${twice - total} more this turn destroys it`;
  } else {
    result = `NO HIT (${total} < ${defence}): ${defence - total} more this turn`;
  }
  return `${rules.units[attackerType].name} ${attack} vs ${rules.units[targetType].name} ` +
    `DEF ${defence}${ground} → ${result}`;
}
