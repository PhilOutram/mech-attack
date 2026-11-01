// The team campaigns: every mission sets up for its campaign's number of players, its
// script and objective work, and the rules they lean on (allies changing sides, units
// arriving, factories taken in the same round) behave.
import { test } from "node:test";
import assert from "node:assert/strict";
import { newGame, applyAction, viewFor, changeTeam, addUnits, handOver } from "../engine.js";
import { chooseAction, DEFAULT_PERSONALITY } from "../ai.js";
import {
  TEAM_CAMPAIGNS, teamPlan, missionTick, missionSteps, contextOf,
} from "../team-campaigns.js";
import { HUMAN_TEAM, ENEMY_TEAM, factoryAt } from "../team-scenario.js";
import { scenario } from "./helpers.js";

const MISSIONS_EACH = 10;
const ROUNDS = 6;

function missionGame(campaignId, index, seed = 1) {
  const plan = teamPlan(campaignId, index);
  const state = { ...newGame({ rules: plan.rules, map: plan.map, seed, sides: plan.sides,
    phases: plan.phases, setup: plan.setup }), seats: plan.seats, team: plan.team };
  return { plan, state: missionTick(state).state };
}

test("there are campaigns for 2, 3 and 4 players, ten missions each", () => {
  assert.deepEqual(TEAM_CAMPAIGNS.map((c) => c.players), [2, 3, 4]);
  for (const c of TEAM_CAMPAIGNS) assert.equal(c.missions.length, MISSIONS_EACH, c.name);
});

test("every team mission sets up, and is neither won nor lost at the start", () => {
  for (const c of TEAM_CAMPAIGNS) {
    c.missions.forEach((m, index) => {
      const { plan, state } = missionGame(c.id, index);
      const name = `${c.name} ${index + 1}: ${m.title}`;
      assert.ok(state.players.length <= 6, `${name}: one colour per side`);
      assert.deepEqual(state.active, plan.phases[0], `${name}: the humans start together`);
      for (let p = 0; p < c.players; p++) {
        assert.equal(plan.seats[p].kind, "human", name);
        assert.equal(state.players[p].team, HUMAN_TEAM, name);
      }
      for (let p = c.players; p < plan.seats.length; p++) {
        assert.equal(plan.seats[p].kind, "ai", name);
        assert.ok(plan.seats[p].faction, `${name}: every AI side is a faction`);
      }
      const hexes = Object.values(state.units).map((u) => u.at);
      assert.equal(new Set(hexes).size, hexes.length, `${name}: two units share a hex`);
      for (const k of hexes) assert.notEqual(state.map.hexes[k].terrain, "mountain", name);
      for (const [site, at] of Object.entries(plan.team.sites)) {
        assert.ok(state.map.hexes[at], `${name}: site ${site} is on the map`);
      }
      assert.equal(state.result, null, `${name} is over before it starts`);
      assert.ok(m.story && m.objective, name);
    });
  }
});

test("a team mission plays: the humans together, then the AI sides", () => {
  let { state } = missionGame("duo", 0);
  state = { ...state, rules: { ...state.rules, roundCap: ROUNDS } };
  const seen = new Set();
  for (let n = 0; !state.result && n < 20000; n++) {
    seen.add(state.phaseIndex);
    state = missionTick(applyAction(state,
      chooseAction(viewFor(state, state.current), DEFAULT_PERSONALITY))).state;
  }
  assert.deepEqual([...seen].sort(), [0, 1]);
});

test("the opening script runs before anyone plays", () => {
  const { state } = missionGame("duo", 2);
  const ctx = contextOf(state);
  for (const name of ["postBlue", "postGreen"]) {
    assert.equal(factoryAt(state, ctx.sites[name]).owner, ctx.side("syndicate"), name);
  }
});

test("an ally who turns on the humans becomes an enemy at the round set", () => {
  let { state } = missionGame("duo", 2);
  const varr = contextOf(state).side("syndicate");
  assert.equal(state.players[varr].team, HUMAN_TEAM);
  // Jump to the start of the round when Varr turns: the script fires once, with a note.
  state = { ...state, round: 6, phaseIndex: 0 };
  const { state: after, notes } = missionTick(state);
  assert.equal(after.players[varr].team, ENEMY_TEAM);
  assert.equal(notes.length, 1);
  assert.ok(after.events.some((e) => e.type === "teamChange" && e.player === varr));
  assert.equal(missionTick(after).notes.length, 0, "it happens once");
});

test("a same-round objective needs every step done in one round", () => {
  const { state } = missionGame("duo", 1);
  const ctx = contextOf(state);
  const take = (s, at) => handOver(s, [factoryAt(s, at).id], ctx.humans[0]);
  // West taken in round 3, east in round 4: not the same round.
  let s = missionTick(take({ ...state, round: 3 }, ctx.sites.west)).state;
  s = missionTick(take({ ...s, round: 4 }, ctx.sites.east)).state;
  assert.deepEqual(missionSteps(s), [true, true]);
  assert.equal(s.result, null);
  // Both in the same round: won.
  let t = missionTick(take({ ...state, round: 3 }, ctx.sites.west)).state;
  t = missionTick(take(t, ctx.sites.east)).state;
  assert.equal(t.result.reason, "objective");
});

test("scenario changes: teams, arriving units and handing over", () => {
  const state = scenario({ units: [{ id: "k", type: "tank", owner: 0, at: "0,4" }] });
  const turned = changeTeam(state, 1, 0);
  assert.equal(turned.players[1].team, 0);
  assert.equal(state.players[1].team, 1, "the input state is unchanged");
  const arrived = addUnits(state, 1, ["tank", "infantry"], "0,0");
  const newcomers = Object.values(arrived.units).filter((u) => u.owner === 1 &&
    u.type !== "factory");
  assert.equal(newcomers.length, 2);
  assert.ok(newcomers.every((u) => u.moved && u.acted), "they act from the next turn");
  const handed = handOver(state, ["k"], 1);
  assert.equal(handed.units.k.owner, 1);
});

test("with rules.scriptedEnd the game goes on when one team is left", () => {
  const state = scenario({
    rules: { scriptedEnd: true },
    playerCrystals: [100, 0],
    units: [
      { id: "k", type: "tank", owner: 0, at: "0,1" },
      { id: "i", type: "infantry", owner: 1, at: "0,0" },
    ],
  });
  const after = applyAction(state, { type: "attack", unitId: "k", targetId: "i" });
  assert.equal(after.players[1].out, true, "Green has nothing left");
  assert.equal(after.result, null, "the mission decides when it ends");
});

test("every team campaign has an intro and an epilogue", () => {
  for (const c of TEAM_CAMPAIGNS) assert.ok(c.intro && c.epilogue, c.name);
});
