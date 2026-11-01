// The team campaigns (Phil, 1 November 2026): one campaign each for 2, 3 and 4 players, ten
// missions each, played at the same time on one team against AI factions with their own
// leaders. They replace the co-op campaign "Red Dust: Together". Learning the game is the
// solo campaign's job; these are about playing together, harder as they go, with missions
// built to need particular units, allies that change sides, and a story with twists.
//
// A mission (team-campaign-2.js, -3.js, -4.js) sets its sides, map and rules, and has a
// script and an objective that are checked after every action (missionTick). The script can
// turn an ally into an enemy, bring in units or crystals, or wake old factories. The game
// ends when the mission says so (rules.scriptedEnd), not when one team is left.
//
// Mission fields:
// - title, story, objective, failText (shown if failed() ends it).
// - map: { seed, shape (optional), slots (optional: the ring slot of each side's home, humans
//   first), reshape(map, rules) (optional: changes to the map, returning named sites) }.
// - humans: one human() each (team-scenario.js), or one for all; ais: faction() sides.
// - rules (optional): rule changes.
// - script (optional): [{ id, when(state, ctx), act(state, ctx), note, repeat }], run in
//   order after every action. Each step happens once (every round while when holds, with
//   repeat); note is told to everyone when it happens.
// - steps (optional): [{ text, done(state, ctx) }], ticked off in the panel. The objective is
//   met when all are done at once, or with sameRound when all were done in the same round.
// - done(state, ctx) (optional, instead of steps): the objective is met. With neither, the
//   team wins by knocking out every side not on it.
// - failed(state, ctx) (optional): the mission is lost. It is always lost if every human is
//   knocked out.
import { RULES } from "./rules-config.js?v=0.85";
import { mapById, shapesForSides } from "./maps.js?v=0.85";
import { HUMAN_TEAM, FACTIONS, arrangeHomes } from "./team-scenario.js?v=0.85";
import { DUO_CAMPAIGN } from "./team-campaign-2.js?v=0.85";
import { TRIO_CAMPAIGN } from "./team-campaign-3.js?v=0.85";
import { QUARTET_CAMPAIGN } from "./team-campaign-4.js?v=0.85";

const PROGRESS_KEY = "mech-attack.team-campaigns";

// Each campaign: { id, name, players, intro, missions }.
export const TEAM_CAMPAIGNS = [DUO_CAMPAIGN, TRIO_CAMPAIGN, QUARTET_CAMPAIGN];

export function campaignById(id) {
  return TEAM_CAMPAIGNS.find((c) => c.id === id);
}

export function teamMissionOf(state) {
  const team = state && state.team;
  return team ? campaignById(team.campaign).missions[team.mission] : null;
}

const humansOfMission = (campaign, m) => (Array.isArray(m.humans) ? m.humans
  : Array.from({ length: campaign.players }, () => m.humans));

// Everything needed to start a mission: seats (the humans not yet told where they play),
// sides and teams, phases (the humans together, then the AI sides), the starting setup, the
// map with its named sites, the rules, and what the game keeps about the mission (team).
export function teamPlan(campaignId, index) {
  const campaign = campaignById(campaignId);
  const m = campaign.missions[index];
  const humans = humansOfMission(campaign, m);
  const sides = [...humans, ...m.ais];
  const count = sides.length;
  const rules = { ...structuredClone({ ...RULES, ...(m.rules || {}) }), scriptedEnd: true };
  const shape = m.map.shape || shapesForSides(count)[0];
  const map = structuredClone(mapById(`map-${m.map.seed}-${shape}-${count}p`, rules));
  arrangeHomes(map, m.map.slots || sides.map((_, p) => p));
  const sites = (m.map.reshape && m.map.reshape(map, rules)) || {};
  const humanCount = humans.length;
  const aiPlayers = m.ais.map((_, i) => humanCount + i);
  return {
    seats: sides.map((side, p) => (p < humanCount ? { kind: "human" }
      : { kind: "ai", level: side.level, aiMix: side.aiMix, faction: side.faction })),
    sides: sides.map((side, p) => ({ team: p < humanCount ? HUMAN_TEAM : side.team })),
    phases: [humans.map((_, p) => p), aiPlayers],
    setup: {
      units: sides.map((s) => s.units),
      crystals: sides.map((s) => s.crystals),
      upgrades: sides.map((s) => s.upgrades),
      kits: sides.map((s) => s.kit || null),
      noHome: sides.map((s) => Boolean(s.noHome)),
    },
    map,
    rules,
    team: {
      campaign: campaignId, mission: index,
      humans: humans.map((_, p) => p),
      factions: sides.map((s) => s.faction || null),
      sites,
      memo: { fired: {}, since: [] },
    },
  };
}

// What a mission's checks and script are given (see team-scenario.js).
export function contextOf(state) {
  const team = state.team;
  return {
    humans: team.humans,
    side: (faction) => {
      const p = team.factions.indexOf(faction);
      return p < 0 ? undefined : p;
    },
    sides: (faction) => team.factions.map((f, p) => (f === faction ? p : -1))
      .filter((p) => p >= 0),
    sites: team.sites,
    fired: (id) => team.memo.fired[id],
    round: state.round,
  };
}

// The players on the humans' team, AI allies included, and every other player.
export function teamSides(state) {
  const players = state.players.map((_, p) => p);
  const friends = players.filter((p) => state.players[p].team === HUMAN_TEAM);
  return { friends, foes: players.filter((p) => !friends.includes(p)) };
}

// How far each step of the mission is done.
export function missionSteps(state) {
  const m = teamMissionOf(state);
  if (!m || !m.steps) return null;
  const ctx = contextOf(state);
  return m.steps.map((step) => Boolean(step.done(state, ctx)));
}

function texts(value, state, ctx) {
  return typeof value === "function" ? value(state, ctx) : value;
}

// Runs the mission's script and checks its objective, after any action (and once before the
// first). Returns the new state (with state.result set if the mission is over) and the notes
// to tell the players: [{ title, text }].
export function missionTick(state) {
  const m = teamMissionOf(state);
  if (!m || state.result) return { state, notes: [] };
  const notes = [];
  let s = state;
  const fired = { ...s.team.memo.fired };
  const remember = () => {
    s = { ...s, team: { ...s.team, memo: { ...s.team.memo, fired: { ...fired } } } };
  };
  for (const item of m.script || []) {
    if (s.result) break;
    const last = fired[item.id];
    if (last !== undefined && (!item.repeat || last === s.round)) continue;
    if (!item.when(s, contextOf(s))) continue;
    if (item.act) s = item.act(s, contextOf(s)) || s;
    fired[item.id] = s.round;
    remember();
    const text = item.note && texts(item.note, s, contextOf(s));
    if (text) notes.push({ title: item.title || m.title, text });
  }
  remember();
  if (s.result) return { state: s, notes };

  const ctx = contextOf(s);
  const met = (m.steps || []).map((step) => Boolean(step.done(s, ctx)));
  const before = s.team.memo.since || [];
  const since = met.map((on, i) => (on ? (before[i] ?? s.round) : null));
  s = { ...s, team: { ...s.team, memo: { ...s.team.memo, since } } };

  const { friends, foes } = teamSides(s);
  const live = (p) => !s.players[p].out;
  let won;
  if (m.done) won = m.done(s, ctx);
  else if (m.steps) won = met.every(Boolean) && (!m.sameRound || new Set(since).size === 1);
  // With every enemy beaten and nothing more to come in the story, there is nothing left to
  // do, whatever the objective.
  const pending = (m.script || []).some((item) => !item.repeat && fired[item.id] === undefined);
  won = won || (!foes.some(live) && !pending);
  // Met is checked first: a VIP who reaches a factory goes into it and leaves the board,
  // which must count as arriving, not falling.
  const lost = !won && (!ctx.humans.some(live) || Boolean(m.failed && m.failed(s, ctx)));
  if (lost || won) {
    const winners = lost ? foes.filter(live) : friends.filter(live);
    const result = { winner: winners.length ? winners[0] : null, winners,
      reason: lost ? "missionFailed" : "objective", round: s.round };
    s = { ...s, result, events: [...s.events, { type: "gameOver", ...result }] };
  }
  return { state: s, notes };
}

// The name of an AI side in messages and briefings, by its faction, if it has one.
export function factionOf(state, p) {
  const id = state.team && state.team.factions[p];
  return id ? FACTIONS[id] : null;
}

// ---------------------------------------------------------------------------------------
// Progress: how many missions of each campaign this device has won (they unlock in order).

function readProgress() {
  try {
    const progress = JSON.parse(localStorage.getItem(PROGRESS_KEY) || "{}");
    return progress && typeof progress === "object" ? progress : {};
  } catch {
    return {};
  }
}

export function teamMissionsDone(campaignId) {
  const done = Number(readProgress()[campaignId]);
  const total = campaignById(campaignId).missions.length;
  return Number.isInteger(done) && done >= 0 ? Math.min(done, total) : 0;
}

export function markTeamMissionDone(campaignId, index) {
  try {
    const progress = readProgress();
    if (index + 1 > (progress[campaignId] || 0)) progress[campaignId] = index + 1;
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
  } catch {
    // Not remembered; the mission still counts as won this time.
  }
}
