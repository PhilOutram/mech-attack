// The combat report: every shot explained from the engine's events, with the defence made up
// of the unit's own and the ground's bonus, attacks in a turn adding up, and return fire.
import { test } from "node:test";
import assert from "node:assert/strict";
import { applyAction } from "../engine.js";
import { combatReports, attackSum } from "../combat-report.js";
import { scenario } from "./helpers.js";

const BLUE = 0;
const GREEN = 1;

function reportsFor(state, before) {
  const names = { [BLUE]: "Your", [GREEN]: "Green" };
  return combatReports(state.events, {
    name: (id) => {
      const unit = before.units[id];
      return `${names[unit.owner]} ${state.rules.units[unit.type].name}`;
    },
    typeOf: (id) => before.units[id].type,
    shown: () => true,
    rules: state.rules,
  });
}

function fire(state, unitId, targetId) {
  const after = applyAction(state, { type: "attack", unitId, targetId });
  return { after, reports: reportsFor(after, state) };
}

test("the engine's hit says how the defence is made up and the lives at the turn's start",
  () => {
    const s = scenario({ terrain: { "1,0": "rocky" }, units: [
      { id: "t", type: "tank", owner: BLUE, at: "-1,0" },
      { id: "g", type: "tank", owner: GREEN, at: "1,0" }] });
    const hit = applyAction(s, { type: "attack", unitId: "t", targetId: "g" }).events
      .find((e) => e.type === "hit");
    assert.equal(hit.base, s.rules.units.tank.defence);
    assert.equal(hit.cover, s.rules.terrain.rocky.defenceBonus);
    assert.equal(hit.defence, hit.base + hit.cover);
    assert.equal(hit.terrain, "rocky");
    assert.equal(hit.livesAtStart, s.rules.lives);
  });

test("a shot that destroys outright, with the return fire that takes a life", () => {
  const s = scenario({ units: [
    { id: "b", type: "scoutBike", owner: BLUE, at: "0,0" },
    { id: "i", type: "infantry", owner: GREEN, at: "1,0" }] });
  const { reports } = fire(s, "b", "i");
  assert.equal(reports.length, 1);
  const [report] = reports;
  assert.equal(report.title, "Your Scout Bike fires on Green Infantry");
  assert.equal(report.paragraphs.length, 2);
  // The title names the shot, so its paragraph starts at the sum.
  assert.match(report.paragraphs[0], /^Attack 15 against defence 5\./);
  assert.match(report.paragraphs[0], /twice its defence \(10\): both lives lost\. Destroyed/);
  assert.match(report.paragraphs[1], /^Green Infantry fires back at the same time: attack 10 /);
  assert.match(report.paragraphs[1], /one life lost, and its tile flips over/);
  assert.deepEqual(report.lines, ["Your Scout Bike 15 vs Green Infantry 5: destroyed.",
    "Green Infantry 10 vs your Scout Bike 10: 1 life lost."]);
});

test("rocky ground's bonus is shown, and a second shot in the turn adds to the first", () => {
  let s = scenario({ terrain: { "1,0": "rocky" }, units: [
    { id: "t1", type: "tank", owner: BLUE, at: "-1,0" },
    { id: "t2", type: "tank", owner: BLUE, at: "-1,1" },
    { id: "g", type: "tank", owner: GREEN, at: "1,0" }] });
  const first = fire(s, "t1", "g");
  const [shot] = first.reports[0].paragraphs;
  assert.match(shot, /defence 30 \(Tank 25, \+5 for rocky ground\)\./);
  assert.match(shot, /25 is less than its defence \(30\): no life lost\. 5 more this turn/);
  s = first.after;
  const second = fire(s, "t2", "g");
  const [added] = second.reports[0].paragraphs;
  assert.match(added, /With 25 already this turn, that makes 50\./);
  assert.match(added, /50 reaches its defence \(30\) but not twice it \(60\): one life lost/);
  assert.equal(second.reports[0].paragraphs.length, 1, "no return fire from two hexes away");
});

test("a damaged unit hit again in a later turn loses its last life", () => {
  let s = scenario({ units: [
    { id: "t", type: "tank", owner: BLUE, at: "-1,0" },
    { id: "g", type: "tank", owner: GREEN, at: "1,0", lives: 1 }] });
  const { reports } = fire(s, "t", "g");
  assert.match(reports[0].paragraphs[0], /already damaged: its last life is lost\. Destroyed/);
});

test("a unit that lost a life this turn and is hit to twice its defence is destroyed", () => {
  let s = scenario({ units: [
    { id: "t1", type: "tank", owner: BLUE, at: "-1,0" },
    { id: "t2", type: "tank", owner: BLUE, at: "-1,1" },
    { id: "g", type: "tank", owner: GREEN, at: "1,0" }] });
  s = fire(s, "t1", "g").after;
  const { reports } = fire(s, "t2", "g");
  assert.match(reports[0].paragraphs[0], /already lost a life this turn\. 50 reaches twice/);
});

test("shots you did not see are left out", () => {
  const s = scenario({ units: [
    { id: "b", type: "scoutBike", owner: BLUE, at: "0,0" },
    { id: "i", type: "infantry", owner: GREEN, at: "1,0" }] });
  const after = applyAction(s, { type: "attack", unitId: "b", targetId: "i" });
  const reports = combatReports(after.events, { name: () => "x", typeOf: () => "infantry",
    shown: () => false, rules: s.rules });
  assert.deepEqual(reports, []);
});

test("the banner's sum shows the ground's bonus", () => {
  const s = scenario({ terrain: { "1,0": "rocky" }, units: [
    { id: "t", type: "tank", owner: BLUE, at: "-1,0" },
    { id: "g", type: "tank", owner: GREEN, at: "1,0" }] });
  const hit = applyAction(s, { type: "attack", unitId: "t", targetId: "g" }).events
    .find((e) => e.type === "hit");
  assert.equal(attackSum("tank", "tank", hit, s.rules),
    "Tank ATT 25 vs Tank DEF 30 (25 + 5 rocky) → NO HIT (25 < 30): 5 more this turn");
});
