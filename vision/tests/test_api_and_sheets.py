import json

import cv2
import numpy as np
from fastapi.testclient import TestClient
from synth import Table, camera_warp, photograph, small_board, with_anchors

from tabletop_vision import sheets
from tabletop_vision.api import app
from tabletop_vision.detect import find_markers

client = TestClient(app)


def jpeg(image) -> bytes:
    ok, data = cv2.imencode(".jpg", image)
    assert ok
    return data.tobytes()


def test_health():
    assert client.get("/health").json()["ok"] is True


def test_calibrate_then_observe_over_http():
    rng = np.random.default_rng(3)
    board = small_board()
    table = with_anchors(board)
    camera = camera_warp(table, rng)
    response = client.post(
        "/tables/kitchen/calibrate",
        files={"image": ("cal.jpg", jpeg(photograph(table, camera, rng)), "image/jpeg")},
        data={"board": json.dumps(board)},
    )
    assert response.status_code == 200, response.text
    assert response.json()["anchorsFound"] == [0, 1, 2, 3, 4]

    play = Table(board)
    play.draw(42, *play.cell_mm("2,-1"), side_mm=10)
    response = client.post(
        "/tables/kitchen/observe",
        files={"image": ("play.jpg", jpeg(photograph(play, camera, rng)), "image/jpeg")},
    )
    assert response.status_code == 200, response.text
    assert response.json()["pieces"][0]["place"] == {"cell": "2,-1"}


def test_observe_before_calibrating_says_so():
    response = client.post(
        "/tables/nowhere/observe", files={"image": ("x.jpg", jpeg(np.zeros((10, 10, 3), np.uint8)))}
    )
    assert response.status_code == 404


def test_a_bad_board_description_is_refused():
    response = client.post(
        "/tables/t/calibrate",
        files={"image": ("x.jpg", jpeg(np.zeros((10, 10, 3), np.uint8)))},
        data={"board": '{"grid": {}}'},
    )
    assert response.status_code == 400


def test_printed_sheets_carry_the_markers_they_promise():
    found = {m.id for m in find_markers(sheets.anchor_page())}
    assert found == {0, 1, 2, 3, 4, 245, 246, 247, 248, 249}
    token_ids = set()
    for page in sheets.token_pages():
        token_ids |= {m.id for m in find_markers(page)}
    assert token_ids == set(range(sheets.FIRST_TOKEN_ID, sheets.LAST_TOKEN_ID + 1))
