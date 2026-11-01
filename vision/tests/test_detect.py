import json
from pathlib import Path

import numpy as np
import pytest
from synth import camera_warp, photograph, small_board, with_anchors

from tabletop_vision.detect import Board, CalibrationError, calibrate, observe

MECH_ATTACK_BOARD = Path(__file__).parents[2] / "camera" / "board.json"


def calibrated(board_json, rng, camera=None):
    table = with_anchors(board_json)
    camera = camera or camera_warp(table, rng)
    board = Board.from_json(board_json)
    return board, camera, calibrate(photograph(table, camera, rng), board)


@pytest.mark.parametrize("seed", range(6))
def test_tokens_land_on_the_right_hexes(seed):
    rng = np.random.default_rng(seed)
    board_json = small_board()
    board, camera, calibration = calibrated(board_json, rng)
    assert calibration["anchorsFound"] == [0, 1, 2, 3, 4]
    assert calibration["error_mm"] < 1.0

    from synth import Table

    play = Table(board_json)
    cells = rng.choice(sorted(board_json["cells"]), size=20, replace=False)
    truth = {}
    for i, k in enumerate(cells):
        marker = 10 + i
        x, y = play.cell_mm(k)
        # Tokens are never placed exactly: up to 6 mm off centre, at any angle.
        dx, dy = rng.uniform(-6, 6, 2)
        play.draw(marker, x + dx, y + dy, side_mm=10, angle_deg=rng.uniform(0, 360))
        truth[marker] = k
    result = observe(photograph(play, camera, rng), board, calibration)

    assert result["calibration"] == "stored"
    seen = {p["marker"]: p["place"]["cell"] for p in result["pieces"]}
    assert seen == truth
    assert all(p["offset_mm"] < 10 for p in result["pieces"])
    assert result["unplaced"] == [] and result["duplicates"] == []


def test_a_token_off_the_board_is_unplaced_and_one_in_a_zone_is_placed_there():
    rng = np.random.default_rng(10)
    board_json = small_board()
    from synth import Table

    off_board = (180.0, -150.0)
    table = with_anchors(board_json, extra_mm=off_board)
    camera = camera_warp(table, rng)
    board = Board.from_json(board_json)
    calibration = calibrate(photograph(table, camera, rng), board)

    play = Table(board_json, extra_mm=off_board)
    play.draw(50, *off_board, side_mm=10)
    play.draw(51, -170, 220, side_mm=10)
    result = observe(photograph(play, camera, rng), board, calibration)
    assert result["unplaced"] == [50]
    assert result["pieces"][0]["marker"] == 51
    assert result["pieces"][0]["place"] == {"zone": "store-blue"}


def test_anchors_left_in_a_play_photo_recalibrate_it():
    rng = np.random.default_rng(11)
    board_json = small_board()
    table = with_anchors(board_json)
    table.draw(20, *table.cell_mm("1,-1"), side_mm=10)
    board = Board.from_json(board_json)
    result = observe(photograph(table, camera_warp(table, rng), rng), board, None)
    assert result["calibration"] == "fresh"
    assert result["pieces"][0]["place"] == {"cell": "1,-1"}


def test_a_duplicate_marker_is_reported():
    rng = np.random.default_rng(12)
    board_json = small_board()
    table = with_anchors(board_json)
    table.draw(30, *table.cell_mm("1,0"), side_mm=10)
    table.draw(30, *table.cell_mm("-1,1"), side_mm=10)
    result = observe(
        photograph(table, camera_warp(table, rng), rng), Board.from_json(board_json), None
    )
    assert result["duplicates"] == [30]


def test_too_few_anchors_is_a_clear_error():
    rng = np.random.default_rng(13)
    board_json = small_board()
    from synth import Table

    table = Table(board_json)
    for marker_id in ("0", "1", "2"):
        table.draw(int(marker_id), *table.cell_mm(board_json["anchors"][marker_id]), 14)
    with pytest.raises(CalibrationError, match="Found 3 of the 5 anchors"):
        calibrate(photograph(table, camera_warp(table, rng), rng), Board.from_json(board_json))


def test_no_calibration_and_no_anchors_is_a_clear_error():
    from synth import Table

    rng = np.random.default_rng(14)
    table = Table(small_board())
    with pytest.raises(CalibrationError, match="No calibration"):
        observe(
            photograph(table, camera_warp(table, rng), rng), Board.from_json(small_board()), None
        )


@pytest.mark.skipif(not MECH_ATTACK_BOARD.exists(), reason="Mech Attack board not present")
def test_the_mech_attack_board_reads_every_cell():
    """Fixed map 1 at full size: a token on every one of its hexes."""
    rng = np.random.default_rng(20)
    board_json = json.loads(MECH_ATTACK_BOARD.read_text())
    board, camera, calibration = calibrated(board_json, rng)
    assert calibration["error_mm"] < 1.0

    from synth import Table

    cells = sorted(board_json["cells"])
    play = Table(board_json)
    for i, k in enumerate(cells):
        x, y = play.cell_mm(k)
        play.draw(10 + i, x, y, side_mm=10, angle_deg=float(rng.uniform(0, 360)))
    result = observe(photograph(play, camera, rng), board, calibration)
    seen = {p["marker"]: p["place"]["cell"] for p in result["pieces"]}
    assert seen == {10 + i: k for i, k in enumerate(cells)}


def test_anchors_placed_a_little_off_centre_still_give_the_right_hexes():
    """Anchor discs are put down by hand, so each may be a few mm off its hex centre."""
    from synth import Table

    rng = np.random.default_rng(30)
    board_json = small_board()
    table = Table(board_json)
    for marker_id, k in board_json["anchors"].items():
        x, y = table.cell_mm(k)
        dx, dy = rng.uniform(-4, 4, 2)
        table.draw(int(marker_id), x + dx, y + dy, side_mm=14)
    camera = camera_warp(table, rng)
    board = Board.from_json(board_json)
    calibration = calibrate(photograph(table, camera, rng), board)
    assert 0.5 < calibration["error_mm"] < 6

    play = Table(board_json)
    truth = {}
    for i, k in enumerate(sorted(board_json["cells"])):
        dx, dy = rng.uniform(-5, 5, 2)
        x, y = play.cell_mm(k)
        play.draw(10 + i, x + dx, y + dy, side_mm=10, angle_deg=float(rng.uniform(0, 360)))
        truth[10 + i] = k
    result = observe(photograph(play, camera, rng), board, calibration)
    assert {p["marker"]: p["place"]["cell"] for p in result["pieces"]} == truth
