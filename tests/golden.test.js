// Two-player play is unchanged: the recorded AI games replay move for move (see
// tests/golden/games.mjs).
import { test } from "node:test";
import assert from "node:assert/strict";
import { GAMES, playGame, loadRecording } from "./golden/games.mjs";

const recording = loadRecording();

test("the recording covers every game", () => {
  assert.equal(recording.games.length, GAMES.length);
});

GAMES.forEach((game, i) => {
  test(`recorded game ${i + 1} (${game.mapId || game.mission}, seed ${game.seed}) replays ` +
    "exactly", () => {
    const now = playGame(game, recording.personality);
    const then = recording.games[i];
    assert.deepEqual(now.end, then.end);
    assert.equal(now.actions, then.actions);
    assert.equal(now.actionsHash, then.actionsHash);
  });
});
