"""Synthetic table photos for tests: markers drawn on a flat table, then tilted, blurred,
noised and JPEG-compressed the way a phone over a table would see them."""

from __future__ import annotations

import math

import cv2
import numpy as np

from tabletop_vision import hexgrid
from tabletop_vision.detect import DICTIONARY

PX_PER_MM = 6.0
MARGIN_MM = 60.0


def small_board(radius: int = 3, flat_to_flat: float = 38.0) -> dict:
    cells = [
        hexgrid.key(q, r)
        for q in range(-radius, radius + 1)
        for r in range(-radius, radius + 1)
        if abs(q + r) <= radius
    ]
    return {
        "grid": {"type": "hex-flat", "flatToFlat_mm": flat_to_flat},
        "cells": sorted(cells),
        "anchors": {
            "0": f"{-radius},0",
            "1": f"0,{-radius}",
            "2": f"{radius},0",
            "3": f"0,{radius}",
            "4": "0,0",
        },
        "zones": {"store-blue": [[-200, 200], [-140, 200], [-140, 240], [-200, 240]]},
    }


class Table:
    """A flat top-down canvas over the board's area, in millimetres."""

    def __init__(self, board: dict, extra_mm: tuple[float, float] | None = None):
        size = hexgrid.size_from_flat_to_flat(board["grid"]["flatToFlat_mm"])
        points = [hexgrid.to_mm(*hexgrid.parse_key(k), size) for k in board["cells"]]
        for polygon in board.get("zones", {}).values():
            points.extend(polygon)
        if extra_mm:
            points.append(extra_mm)
        xs, ys = zip(*points, strict=True)
        self.x0, self.y0 = min(xs) - MARGIN_MM, min(ys) - MARGIN_MM
        w = (max(xs) - self.x0 + MARGIN_MM) * PX_PER_MM
        h = (max(ys) - self.y0 + MARGIN_MM) * PX_PER_MM
        self.size = size
        self.image = np.full((int(h), int(w), 3), (205, 215, 230), np.uint8)

    def px(self, x_mm: float, y_mm: float) -> tuple[float, float]:
        return (x_mm - self.x0) * PX_PER_MM, (y_mm - self.y0) * PX_PER_MM

    def cell_mm(self, k: str) -> tuple[float, float]:
        return hexgrid.to_mm(*hexgrid.parse_key(k), self.size)

    def draw(
        self,
        marker_id: int,
        x_mm: float,
        y_mm: float,
        side_mm: float,
        angle_deg: float = 0.0,
        disc_mm: float = 25.0,
    ):
        """A token: a white disc with the marker printed in the middle, turned by angle."""
        cx, cy = self.px(x_mm, y_mm)
        cv2.circle(
            self.image,
            (round(cx), round(cy)),
            round(disc_mm / 2 * PX_PER_MM),
            (250, 250, 250),
            -1,
            cv2.LINE_AA,
        )
        side = int(round(side_mm * PX_PER_MM))
        marker = cv2.aruco.generateImageMarker(
            cv2.aruco.getPredefinedDictionary(DICTIONARY), marker_id, 120, borderBits=1
        )
        marker = cv2.cvtColor(marker, cv2.COLOR_GRAY2BGR)
        a, half = math.radians(angle_deg), side / 2
        corners = [(-half, -half), (half, -half), (half, half), (-half, half)]
        dst = np.float32(
            [
                (cx + u * math.cos(a) - v * math.sin(a), cy + u * math.sin(a) + v * math.cos(a))
                for u, v in corners
            ]
        )
        src = np.float32([(0, 0), (120, 0), (120, 120), (0, 120)])
        h, w = self.image.shape[:2]
        warp = cv2.getPerspectiveTransform(src, dst)
        drawn = cv2.warpPerspective(marker, warp, (w, h), flags=cv2.INTER_AREA)
        mask = cv2.warpPerspective(np.full((120, 120), 255, np.uint8), warp, (w, h))
        self.image[mask > 127] = drawn[mask > 127]


def camera_warp(table: Table, rng: np.random.Generator, tilt: float = 0.08):
    """A random fixed camera: the same homography for every photo, like a tripod."""
    h, w = table.image.shape[:2]
    src = np.float32([(0, 0), (w, 0), (w, h), (0, h)])
    jitter = rng.uniform(-tilt, tilt, (4, 2)) * np.float32([w, h])
    dst = src + jitter
    dst -= dst.min(axis=0)
    out = (int(dst[:, 0].max()), int(dst[:, 1].max()))
    return cv2.getPerspectiveTransform(src, dst.astype(np.float32)), out


def photograph(table: Table, camera, rng: np.random.Generator) -> np.ndarray:
    warp, out = camera
    photo = cv2.warpPerspective(
        table.image, warp, out, borderValue=(60, 60, 60), flags=cv2.INTER_AREA
    )
    photo = cv2.GaussianBlur(photo, (3, 3), 0.8)
    noise = rng.normal(0, 5, photo.shape)
    photo = np.clip(photo.astype(np.float32) + noise, 0, 255).astype(np.uint8)
    ok, jpeg = cv2.imencode(".jpg", photo, [cv2.IMWRITE_JPEG_QUALITY, 85])
    assert ok
    return cv2.imdecode(jpeg, cv2.IMREAD_COLOR)


def with_anchors(board: dict, extra_mm=None) -> Table:
    table = Table(board, extra_mm)
    for marker_id, k in board["anchors"].items():
        table.draw(int(marker_id), *table.cell_mm(k), side_mm=14)
    return table
