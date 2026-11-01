"""Printable A4 marker sheets at true size (300 dpi). Print at 100%, not "fit to page".

Page 1: five anchor markers (IDs 0 to 4) at 14 mm, each inside a 25 mm circle to cut out
and stick on a spare disc, plus a size-test strip (IDs 245 to 249 at 8 to 12 mm) and a
50 mm scale bar to check the printer kept true size.
Pages 2 and 3: token markers at 10 mm in pairs, one sticker for each side of a two-sided
token. Pair n is IDs 10 + 2n (side A) and 11 + 2n (side B), so IDs 10 to 243 give 117 pairs.
"""

from __future__ import annotations

import cv2
import numpy as np
from PIL import Image

from .detect import DICTIONARY

DPI = 300
PX_PER_MM = DPI / 25.4
PAGE_MM = (210, 297)
INK = 0
GUIDE = 170
LABEL = 90

FIRST_TOKEN_ID = 10
LAST_TOKEN_ID = 243
ANCHOR_MM = 14  # with a 1.5 mm white border, a 17 mm square: 24 mm corner to corner, inside 25
SIZE_TEST = [(245, 8), (246, 9), (247, 10), (248, 11), (249, 12)]


def _px(mm: float) -> int:
    return int(round(mm * PX_PER_MM))


def _page() -> np.ndarray:
    w, h = PAGE_MM
    return np.full((_px(h), _px(w)), 255, np.uint8)


def _marker(page: np.ndarray, marker_id: int, cx_mm: float, cy_mm: float, side_mm: float):
    side = _px(side_mm)
    image = cv2.aruco.generateImageMarker(
        cv2.aruco.getPredefinedDictionary(DICTIONARY), marker_id, side, borderBits=1
    )
    x0, y0 = _px(cx_mm) - side // 2, _px(cy_mm) - side // 2
    page[y0 : y0 + side, x0 : x0 + side] = image


def _text(
    page, words: str, x_mm: float, y_mm: float, scale: float = 0.9, centred=True, shade=LABEL
):
    font = cv2.FONT_HERSHEY_SIMPLEX
    (w, _), _ = cv2.getTextSize(words, font, scale, 2)
    x = _px(x_mm) - (w // 2 if centred else 0)
    cv2.putText(page, words, (x, _px(y_mm)), font, scale, shade, 2, cv2.LINE_AA)


def _square_guide(page, cx_mm, cy_mm, side_mm):
    half = side_mm / 2
    cv2.rectangle(
        page,
        (_px(cx_mm - half), _px(cy_mm - half)),
        (_px(cx_mm + half), _px(cy_mm + half)),
        GUIDE,
        2,
    )


def anchor_page() -> np.ndarray:
    page = _page()
    _text(
        page,
        "Anchor markers: print at 100% (actual size). DICT_4X4_250.",
        15,
        18,
        1.0,
        centred=False,
        shade=INK,
    )
    _text(
        page,
        "Cut on the grey circle and stick each on a spare 25 mm disc.",
        15,
        25,
        0.9,
        centred=False,
    )
    for i in range(5):
        cx, cy = 30 + i * 37.5, 55
        cv2.circle(page, (_px(cx), _px(cy)), _px(12.5), GUIDE, 2)
        _marker(page, i, cx, cy, ANCHOR_MM)
        _text(page, f"Anchor {i}", cx, cy + 20)

    _text(
        page,
        "Size test: which of these does your camera read? (IDs 245 to 249)",
        15,
        100,
        0.9,
        centred=False,
        shade=INK,
    )
    for i, (marker_id, side) in enumerate(SIZE_TEST):
        cx = 30 + i * 37.5
        _square_guide(page, cx, 125, side + 4)
        _marker(page, marker_id, cx, 125, side)
        _text(page, f"{side} mm", cx, 145)

    _text(
        page, "Scale check: this bar should measure 50 mm.", 15, 170, 0.9, centred=False, shade=INK
    )
    cv2.rectangle(page, (_px(15), _px(176)), (_px(65), _px(180)), INK, -1)
    return page


def token_pages() -> list[np.ndarray]:
    pairs = [(a, a + 1) for a in range(FIRST_TOKEN_ID, LAST_TOKEN_ID, 2)]
    per_row, rows = 5, 11
    per_page = per_row * rows
    pages = []
    for start in range(0, len(pairs), per_page):
        page = _page()
        last = min(start + per_page, len(pairs))
        _text(
            page,
            f"Token markers, 10 mm, pairs {start + 1} to {last}: side A left, side B "
            "right. Cut on the grey squares (14 mm).",
            12,
            14,
            0.85,
            centred=False,
            shade=INK,
        )
        for n, (a, b) in enumerate(pairs[start:last]):
            row, col = divmod(n, per_row)
            x0, y0 = 14 + col * 37, 30 + row * 22
            _text(page, f"Pair {start + n + 1}: {a} / {b}", x0 + 16, y0, 0.7)
            for i, marker_id in enumerate((a, b)):
                cx, cy = x0 + 8 + i * 16, y0 + 11
                _square_guide(page, cx, cy, 14)
                _marker(page, marker_id, cx, cy, 10)
        pages.append(page)
    return pages


def write_pdf(path: str) -> int:
    """Writes all sheets to one PDF. Returns the number of pages."""
    pages = [anchor_page(), *token_pages()]
    images = [Image.fromarray(p).convert("L") for p in pages]
    images[0].save(path, save_all=True, append_images=images[1:], resolution=DPI)
    return len(images)
