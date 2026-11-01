"""Flat-topped hexes in axial coordinates (q, r), matching Mech Attack's hex.js.

Positions are in millimetres on the table, with hex 0,0's centre at the origin, x to the
right and y down the board (r increases towards the bottom, as on screen). `size` is the
corner-to-centre radius, so a hex measures size * sqrt(3) flat to flat.
"""

import math

SQRT3 = math.sqrt(3)


def size_from_flat_to_flat(flat_to_flat_mm: float) -> float:
    return flat_to_flat_mm / SQRT3


def key(q: int, r: int) -> str:
    return f"{q},{r}"


def parse_key(k: str) -> tuple[int, int]:
    q, r = k.split(",")
    return int(q), int(r)


def to_mm(q: float, r: float, size: float) -> tuple[float, float]:
    """Centre of hex q, r. The same formula as toPixel in hex.js."""
    return size * 1.5 * q, size * SQRT3 * (r + q / 2)


def from_mm(x: float, y: float, size: float) -> tuple[int, int]:
    """The hex containing the point x, y."""
    qf = x / (1.5 * size)
    rf = y / (SQRT3 * size) - qf / 2
    return _cube_round(qf, rf)


def _cube_round(qf: float, rf: float) -> tuple[int, int]:
    sf = -qf - rf
    q, r, s = round(qf), round(rf), round(sf)
    dq, dr, ds = abs(q - qf), abs(r - rf), abs(s - sf)
    if dq > dr and dq > ds:
        q = -r - s
    elif dr > ds:
        r = -q - s
    return int(q), int(r)
