// Role kits: a player with a kit builds and buys only what the kit allows, even from a
// factory they capture.
import { test } from "node:test";
import assert from "node:assert/strict";
import { RULES } from "../rules-config.js";
import {
  newGame, applyAction, legalActions, buildableTypes, upgradeOptions, viewFor, kitOf,
} from "../engine.js";
import { testMap, testRules } from "./helpers.js";

const BLUE = 0;
const GREEN = 1;
const RICH = 1000;

function kitGame(kits) {
  const rules = testRules();
  const setup = { units: [[], []], crystals: [RICH, RICH], kits };
  return newGame({ rules, map: testMap(), seed: 1, setup });
}

test("every kit names units and upgrades that exist", () => {
  for (const [id, kit] of Object.entries(RULES.roleKits)) {
    for (const type of kit.builds) assert.ok(RULES.units[type], `${id}: ${type}`);
    for (const upgrade of kit.upgrades) {
      assert.ok(RULES.factoryUpgrades[upgrade], `${id}: ${upgrade}`);
    }
    assert.ok(kit.builds.includes("lightHarvester"), `${id} can harvest`);
  }
});

test("a player with a kit can build only its units", () => {
  const state = kitGame(["skywing", null]);
  assert.equal(kitOf(state, BLUE).name, "Skywing");
  assert.equal(kitOf(state, GREEN), null);
  const built = (p) => new Set(legalActions(state, p).filter((a) => a.type === "build")
    .map((a) => a.unitType));
  for (const type of built(BLUE)) assert.ok(RULES.roleKits.skywing.builds.includes(type));
  assert.ok(!built(BLUE).has("tank"));
  assert.ok(buildableTypes(viewFor(state, GREEN)).includes("tank"), "no kit, no limit");
  assert.throws(() => applyAction(state, { type: "build", unitType: "infantry",
    at: buildSiteOf(state, BLUE) }));
});

test("a kit limits the factory upgrades on offer", () => {
  const state = kitGame(["skywing", "bastion"]);
  const offered = (p) => upgradeOptions(state, state.players[p].factoryId);
  assert.deepEqual(offered(BLUE), ["airfield"], "Comms only with allies");
  assert.deepEqual(offered(GREEN), ["heavyWorks"]);
});

test("a kit follows its player into a captured factory", () => {
  const state = kitGame(["vanguard", null]);
  const greenFactory = state.units[state.players[GREEN].factoryId];
  greenFactory.owner = BLUE;
  greenFactory.upgrades = ["heavyWorks"];
  const types = new Set(legalActions(state, BLUE).filter((a) => a.type === "build")
    .map((a) => a.unitType));
  assert.ok(!types.has("heavyCannon"), "Heavy works, but not in the Vanguard kit");
  assert.ok(types.has("infantry"));
});

function buildSiteOf(state, p) {
  return legalActions(state, p).find((a) => a.type === "build").at;
}
