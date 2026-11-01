import json
import math
import random
from pathlib import Path

import pytest

from tabletop_vision import hexgrid

GOLDEN = json.loads((Path(__file__).parent / "fixtures" / "hex-golden.json").read_text())


@pytest.mark.parametrize("case", GOLDEN[::7])
def test_centres_match_hex_js(case):
    x, y = hexgrid.to_mm(case["q"], case["r"], case["size"])
    assert x == pytest.approx(case["at"][0], abs=1e-9)
    assert y == pytest.approx(case["at"][1], abs=1e-9)


def test_every_golden_centre_maps_back_to_its_hex():
    for case in GOLDEN:
        assert hexgrid.from_mm(*case["at"], case["size"]) == (case["q"], case["r"])


def test_points_inside_a_hex_land_in_it():
    rng = random.Random(1)
    size = hexgrid.size_from_flat_to_flat(38)
    inradius = 19
    for _ in range(2000):
        q, r = rng.randint(-6, 6), rng.randint(-6, 6)
        cx, cy = hexgrid.to_mm(q, r, size)
        angle, distance = rng.uniform(0, 2 * math.pi), rng.uniform(0, inradius * 0.97)
        point = (cx + distance * math.cos(angle), cy + distance * math.sin(angle))
        assert hexgrid.from_mm(*point, size) == (q, r)


def test_keys_match_the_engine_format():
    assert hexgrid.key(-2, 6) == "-2,6"
    assert hexgrid.parse_key("-2,6") == (-2, 6)
    assert hexgrid.key(*hexgrid.from_mm(-0.1, 0.1, 20)) == "0,0"
