"""Finds ArUco markers in a photo and places each one on a cell or zone of the board.

Calibration: a photo with the anchor markers (IDs 0 to 9) sitting on the hexes the board
names for them. Their centres fix a homography from photo pixels to table millimetres, so
nothing on the table needs measuring. While the camera stays put, that calibration holds
for every later photo. If a later photo shows four or more anchors, it is recalibrated from
that photo instead.
"""

from __future__ import annotations

from dataclasses import dataclass, field

import cv2
import numpy as np

from . import hexgrid

DICTIONARY = cv2.aruco.DICT_4X4_250
ANCHOR_IDS = range(0, 10)
MIN_ANCHORS = 4


class CalibrationError(ValueError):
    """The photo does not show enough anchors to fix the board's position."""


@dataclass
class Board:
    """A game pack's board description: grid, cells, anchor hexes and zones."""

    size_mm: float  # hex corner-to-centre radius
    cells: set[str]
    anchors: dict[int, str]  # anchor marker ID -> hex key it sits on in the calibration photo
    zones: dict[str, np.ndarray] = field(default_factory=dict)  # name -> polygon in mm

    @classmethod
    def from_json(cls, data: dict) -> Board:
        grid = data["grid"]
        if grid.get("type") != "hex-flat":
            raise ValueError(f"Unsupported grid type: {grid.get('type')}")
        return cls(
            size_mm=hexgrid.size_from_flat_to_flat(float(grid["flatToFlat_mm"])),
            cells=set(data["cells"]),
            anchors={int(k): v for k, v in data["anchors"].items()},
            zones={
                name: np.array(points, dtype=np.float32)
                for name, points in data.get("zones", {}).items()
            },
        )

    def cell_mm(self, k: str) -> tuple[float, float]:
        q, r = hexgrid.parse_key(k)
        return hexgrid.to_mm(q, r, self.size_mm)


@dataclass
class Marker:
    id: int
    centre: np.ndarray  # pixels, shape (2,)
    corners: np.ndarray  # pixels, shape (4, 2)


def _detector() -> cv2.aruco.ArucoDetector:
    params = cv2.aruco.DetectorParameters()
    # Tokens are small in a whole-table photo: accept markers down to about 1% of the
    # image's longer side, and refine corners for sub-pixel centres.
    params.minMarkerPerimeterRate = 0.01
    params.cornerRefinementMethod = cv2.aruco.CORNER_REFINE_SUBPIX
    return cv2.aruco.ArucoDetector(cv2.aruco.getPredefinedDictionary(DICTIONARY), params)


def find_markers(image: np.ndarray) -> list[Marker]:
    grey = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY) if image.ndim == 3 else image
    corners, ids, _ = _detector().detectMarkers(grey)
    if ids is None:
        return []
    found = []
    for quad, marker_id in zip(corners, ids.flatten(), strict=True):
        points = quad.reshape(4, 2)
        found.append(Marker(int(marker_id), points.mean(axis=0), points))
    return sorted(found, key=lambda m: m.id)


def decode_image(data: bytes) -> np.ndarray:
    image = cv2.imdecode(np.frombuffer(data, np.uint8), cv2.IMREAD_COLOR)
    if image is None:
        raise ValueError("Could not read the image")
    return image


def calibrate(image: np.ndarray, board: Board, markers: list[Marker] | None = None) -> dict:
    """Fits the photo-to-table homography from the anchors. Returns a JSON-ready dict."""
    markers = find_markers(image) if markers is None else markers
    seen = {m.id: m for m in markers if m.id in board.anchors}
    missing = sorted(set(board.anchors) - set(seen))
    if len(seen) < MIN_ANCHORS:
        raise CalibrationError(
            f"Found {len(seen)} of the {len(board.anchors)} anchors; at least {MIN_ANCHORS} "
            f"must be visible. Missing: {missing}"
        )
    ids = sorted(seen)
    src = np.array([seen[i].centre for i in ids], dtype=np.float64)
    dst = np.array([board.cell_mm(board.anchors[i]) for i in ids], dtype=np.float64)
    homography, _ = cv2.findHomography(src, dst, 0)
    if homography is None:
        raise CalibrationError("The anchors do not fix the board: are three in a line?")
    # Four points fit exactly, so the error only means something with five or more.
    error = None
    if len(ids) > MIN_ANCHORS:
        fitted = cv2.perspectiveTransform(src.reshape(-1, 1, 2), homography).reshape(-1, 2)
        error = float(np.sqrt(np.mean(np.sum((fitted - dst) ** 2, axis=1))))
    return {
        "homography": homography.tolist(),
        "anchorsFound": ids,
        "anchorsMissing": missing,
        "error_mm": None if error is None else round(error, 2),
        "imageSize": [int(image.shape[1]), int(image.shape[0])],
    }


def observe(image: np.ndarray, board: Board, calibration: dict | None = None) -> dict:
    """Places every token marker in the photo. Returns the platform's observation JSON."""
    markers = find_markers(image)
    anchors_seen = [m for m in markers if m.id in board.anchors]
    calibration_source = "stored"
    if len(anchors_seen) >= MIN_ANCHORS:
        calibration = calibrate(image, board, markers)
        calibration_source = "fresh"
    if calibration is None:
        raise CalibrationError("No calibration: take a calibration photo with the anchors first")
    homography = np.array(calibration["homography"], dtype=np.float64)

    tokens = [m for m in markers if m.id not in ANCHOR_IDS]
    counts: dict[int, int] = {}
    for m in tokens:
        counts[m.id] = counts.get(m.id, 0) + 1

    pieces, unplaced = [], []
    for m in tokens:
        point = m.centre.reshape(1, 1, 2).astype(np.float64)
        x, y = cv2.perspectiveTransform(point, homography)[0, 0]
        place, offset = _place(board, float(x), float(y))
        if place is None:
            unplaced.append(m.id)
            continue
        piece = {"marker": m.id, "place": place, "at_mm": [round(float(x), 1), round(float(y), 1)]}
        if offset is not None:
            piece["offset_mm"] = round(offset, 1)
        pieces.append(piece)

    return {
        "boardFound": True,
        "calibration": calibration_source,
        "error_mm": calibration["error_mm"],
        "pieces": pieces,
        "unplaced": sorted(unplaced),
        "duplicates": sorted(i for i, n in counts.items() if n > 1),
        "source": "markers",
    }


def _place(board: Board, x: float, y: float) -> tuple[dict | None, float | None]:
    q, r = hexgrid.from_mm(x, y, board.size_mm)
    k = hexgrid.key(q, r)
    if k in board.cells:
        cx, cy = hexgrid.to_mm(q, r, board.size_mm)
        return {"cell": k}, float(np.hypot(x - cx, y - cy))
    for name, polygon in board.zones.items():
        if cv2.pointPolygonTest(polygon, (x, y), False) >= 0:
            return {"zone": name}, None
    return None, None
