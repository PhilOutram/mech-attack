// Recorded two-player games: complete AI-against-AI games from fixed seeds, kept so that
// reworking the engine for more players can be shown not to change two-player play. Each
// game is replayed by the AI from its start, and its moves and final position must match the
// recording exactly.
// Re-record (only when two-player play is meant to change): node tests/golden/games.mjs
import { createHash } from "node:crypto";
import { writeFileSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { RULES } from "../../rules-config.js";
import { mapById } from "../../maps.js";
import { newGame, applyAction, viewFor } from "../../engine.js";
import { chooseAction, DEFAULT_PERSONALITY } from "../../ai.js";
import { EVOLVED_PERSONALITIES } from "../../ai-personalities.js";
import { MISSIONS, missionRules, missionMap } from "../../campaign.js";
import { withOverrides } from "../../sim.js";

const RECORDING = fileURLToPath(new URL("./two-player.json", import.meta.url));
const ROUND_CAP = 40;
const MAX_ACTIONS = 20000;

// The games: map, seed, who moves first, each side's personality ("default", or "evolved"
// for the personality frozen in the recording), and any rule changes or campaign mission.
export const GAMES = [
  { mapId: "fixed-1", seed: 1, firstPlayer: 0, sides: ["default", "default"] },
  { mapId: "map-5-3-4-4-3", seed: 2, firstPlayer: 0, sides: ["evolved", "default"] },
  { mapId: "map-12-4-5-5-4", seed: 3, firstPlayer: 1, sides: ["evolved", "evolved"] },
  { mapId: "map-21-4-5-6-5-4", seed: 4, firstPlayer: 0, sides: ["default", "evolved"] },
  { mission: "Over the Mountains", seed: 5, firstPlayer: 0, sides: ["default", "default"] },
  { mission: "The Maid's March", seed: 6, firstPlayer: 0, sides: ["evolved", "default"] },
  { mapId: "map-7", seed: 7, firstPlayer: 1, sides: ["evolved", "evolved"],
    set: ["turnOrder=\"alternate\""] },
  { mapId: "map-9-5-6-6-5", seed: 8, firstPlayer: 0, sides: ["default", "evolved"],
    set: ["fog.mode=\"sight\""] },
];

// The position at the end, without bookkeeping that may change shape: units, crystal piles,
// each side's crystals, the round and the result.
function projection(state) {
  return {
    round: state.round,
    result: state.result,
    crystals: state.players.map((p) => p.crystals),
    units: Object.values(state.units)
      .map((u) => `${u.id} ${u.type} ${u.owner} ${u.at} ${u.lives}`).sort(),
    piles: Object.entries(state.crystals).map(([k, p]) => `${k} ${p.amount}`).sort(),
  };
}

// Plays one game; personality is the frozen evolved personality.
export function playGame(game, personality) {
  let rules = { ...RULES, roundCap: ROUND_CAP };
  let map;
  let setup = null;
  if (game.mission) {
    const m = MISSIONS.find((x) => x.title === game.mission);
    rules = { ...missionRules(m, RULES), roundCap: ROUND_CAP };
    map = missionMap(m, mapById(m.mapId, rules), rules);
    setup = m.setup;
  } else {
    rules = withOverrides(rules, game.set || []);
    map = mapById(game.mapId, rules);
  }
  const players = game.sides.map((side) =>
    (side === "evolved" ? personality : DEFAULT_PERSONALITY));
  let state = newGame({ rules, map, seed: game.seed, firstPlayer: game.firstPlayer, setup,
    recordActions: false });
  const actions = [];
  while (!state.result && actions.length < MAX_ACTIONS) {
    const action = chooseAction(viewFor(state, state.current), players[state.current]);
    actions.push(action);
    state = applyAction(state, action);
  }
  return {
    actions: actions.length,
    actionsHash: createHash("sha1").update(JSON.stringify(actions)).digest("hex"),
    end: projection(state),
  };
}

export function loadRecording() {
  return JSON.parse(readFileSync(RECORDING, "utf8"));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const personality = { ...DEFAULT_PERSONALITY, ...EVOLVED_PERSONALITIES[0].personality };
  const games = GAMES.map((game) => ({ game, ...playGame(game, personality) }));
  writeFileSync(RECORDING, `${JSON.stringify({ personality, games }, null, 1)}\n`);
  for (const g of games) {
    console.log(`${g.game.mapId || g.game.mission} seed ${g.game.seed}: ${g.actions} ` +
      `actions, ${g.end.result ? g.end.result.reason : "unfinished"} in round ${g.end.round}`);
  }
}
