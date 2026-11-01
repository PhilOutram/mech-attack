"""Experiment: can the camera tell a token's type and colour from its art, with no marker?

A virtual table: the board's hexes in reds, tokens (25 mm discs with the game's art) at
random angles and slightly off centre, and a reference strip beside the board with one
token of each type and one of each colour. The table is photographed (tilt, blur, noise,
JPEG, optionally a warm colour cast and uneven light), then each token is identified only
from the photo, by comparison with the reference strip.

  python experiments/appearance.py ART_DIR BOARD_JSON [--trials 2]

ART_DIR holds one PNG per type and colour, named <type>-<colour>.png. Synthetic photos of
digital art flatter the method: printed tokens will do worse. Use this to find which types
and colours are hard, then test with real photos.
"""

from __future__ import annotations

import argparse
import json
import math
from collections import Counter, defaultdict
from pathlib import Path

import cv2
import numpy as np

from tabletop_vision import hexgrid

HI = 10.0  # px per mm for the drawn table
DISC_MM = 25.0
DISC_RGB = (232, 226, 216)
TILE_REDS = [(200, 70, 60), (168, 56, 47), (110, 42, 34), (185, 64, 55)]
N = 64  # crop size for matching
WHITE_BODY_FRACTION = 0.095  # fewer coloured pixels than this: a white unit


def load_art(art_dir: Path):
    art = {}
    for path in sorted(art_dir.glob("*.png")):
        stem = path.stem
        kind, colour = stem.rsplit("-", 1)
        image = cv2.imread(str(path), cv2.IMREAD_UNCHANGED)
        art[(kind, colour)] = image
    kinds = sorted({k for k, _ in art})
    colours = sorted({c for _, c in art})
    return art, kinds, colours


class VirtualTable:
    def __init__(self, board: dict, strip_slots: int, rng):
        self.size = hexgrid.size_from_flat_to_flat(board["grid"]["flatToFlat_mm"])
        self.cells = sorted(board["cells"])
        centres = np.array([self.cell(k) for k in self.cells])
        x0, y0 = centres.min(axis=0) - 40
        x1, y1 = centres.max(axis=0) + 40
        per_row = max(1, int((x1 - x0 - 20) // 30))
        rows = math.ceil(strip_slots / per_row)
        self.strip = [
            (x0 + 25 + 30 * (i % per_row), y1 + 10 + 30 * (i // per_row))
            for i in range(strip_slots)
        ]
        self.origin = (x0, y0)
        h_mm = y1 + 30 * rows + 20 - y0
        self.image = np.full((int(h_mm * HI), int((x1 - x0) * HI), 3), (70, 70, 74), np.uint8)
        for k in self.cells:
            corners = [
                self.px(
                    cx + self.size * math.cos(math.pi / 3 * i),
                    cy + self.size * math.sin(math.pi / 3 * i),
                )
                for cx, cy in [self.cell(k)]
                for i in range(6)
            ]
            colour = TILE_REDS[rng.integers(len(TILE_REDS))]
            cv2.fillPoly(self.image, [np.int32(corners)], colour, cv2.LINE_AA)
            cv2.polylines(self.image, [np.int32(corners)], True, (51, 51, 51), 4, cv2.LINE_AA)
        # A little texture, so the tiles are not flat colour.
        noise = rng.normal(0, 6, self.image.shape[:2])[..., None]
        self.image = np.clip(self.image + noise, 0, 255).astype(np.uint8)

    def cell(self, k):
        return hexgrid.to_mm(*hexgrid.parse_key(k), self.size)

    def px(self, x, y):
        return ((x - self.origin[0]) * HI, (y - self.origin[1]) * HI)

    def draw_token(self, art_rgba, x, y, angle):
        d = int(DISC_MM * HI)
        art = cv2.resize(art_rgba, (d, d), interpolation=cv2.INTER_AREA)
        rot = cv2.getRotationMatrix2D((d / 2, d / 2), angle, 1.0)
        art = cv2.warpAffine(art, rot, (d, d), flags=cv2.INTER_LINEAR, borderValue=(0, 0, 0, 0))
        token = np.zeros((d, d, 3), np.float32)
        token[:] = DISC_RGB
        alpha = art[..., 3:4].astype(np.float32) / 255
        rgb = art[..., 2::-1].astype(np.float32)  # BGRA from disk -> RGB
        token = token * (1 - alpha) + rgb * alpha
        mask = np.zeros((d, d), np.uint8)
        cv2.circle(mask, (d // 2, d // 2), d // 2 - 1, 255, -1, cv2.LINE_AA)
        cx, cy = self.px(x, y)
        x0, y0 = int(round(cx - d / 2)), int(round(cy - d / 2))
        region = self.image[y0 : y0 + d, x0 : x0 + d].astype(np.float32)
        m = (mask.astype(np.float32) / 255)[..., None]
        self.image[y0 : y0 + d, x0 : x0 + d] = (region * (1 - m) + token * m).astype(np.uint8)


def photograph(table: VirtualTable, ppm: float, cast: bool, rng):
    """Returns the photo (BGR) and the homography from table mm to photo pixels."""
    h, w = table.image.shape[:2]
    scale = ppm / HI
    src = np.float32([(0, 0), (w, 0), (w, h), (0, h)])
    dst = src * scale + rng.uniform(-0.06, 0.06, (4, 2)).astype(np.float32) * [w * scale, h * scale]
    dst -= dst.min(axis=0)
    warp = cv2.getPerspectiveTransform(src, dst.astype(np.float32))
    out = (int(dst[:, 0].max()), int(dst[:, 1].max()))
    photo = cv2.warpPerspective(
        table.image, warp, out, flags=cv2.INTER_AREA, borderValue=(60, 60, 60)
    ).astype(np.float32)
    if cast:
        photo *= np.float32([1.10, 1.0, 0.80])  # warm indoor light, RGB
        ramp = np.linspace(0.75, 1.10, out[0], dtype=np.float32)[None, :, None]
        photo *= ramp
    photo = cv2.GaussianBlur(photo, (0, 0), 0.8)
    photo += rng.normal(0, 4, photo.shape)
    photo = np.clip(photo, 0, 255).astype(np.uint8)
    ok, jpeg = cv2.imencode(
        ".jpg", cv2.cvtColor(photo, cv2.COLOR_RGB2BGR), [cv2.IMWRITE_JPEG_QUALITY, 85]
    )
    photo = cv2.imdecode(jpeg, cv2.IMREAD_COLOR)
    mm_to_table = np.float64(
        [[HI, 0, -table.origin[0] * HI], [0, HI, -table.origin[1] * HI], [0, 0, 1]]
    )
    return photo, warp @ mm_to_table


def crop(photo_bgr, mm_to_photo, x, y):
    """The token at x, y mm, rectified to an N x N top-down crop (RGB float)."""
    half = DISC_MM / 2
    src = np.float64(
        [[x - half, y - half], [x + half, y - half], [x + half, y + half], [x - half, y + half]]
    ).reshape(-1, 1, 2)
    pts = cv2.perspectiveTransform(src, mm_to_photo).reshape(-1, 2).astype(np.float32)
    dst = np.float32([(0, 0), (N, 0), (N, N), (0, N)])
    warp = cv2.getPerspectiveTransform(pts, dst)
    out = cv2.warpPerspective(photo_bgr, warp, (N, N), flags=cv2.INTER_AREA)
    return cv2.cvtColor(out, cv2.COLOR_BGR2RGB)


def find_disc(photo_bgr, mm_to_photo, x, y):
    """Refines a token's centre: the cream disc on a red tile, searched near x, y."""
    search = 18.0
    best, best_score = (x, y), -1.0
    ppm = 2.0
    size = int(2 * search * ppm)
    src = np.float64(
        [
            [x - search, y - search],
            [x + search, y - search],
            [x + search, y + search],
            [x - search, y + search],
        ]
    ).reshape(-1, 1, 2)
    pts = cv2.perspectiveTransform(src, mm_to_photo).reshape(-1, 2).astype(np.float32)
    warp = cv2.getPerspectiveTransform(
        pts, np.float32([(0, 0), (size, 0), (size, size), (0, size)])
    )
    patch = cv2.warpPerspective(photo_bgr, warp, (size, size), flags=cv2.INTER_AREA)
    hsv = cv2.cvtColor(patch, cv2.COLOR_BGR2HSV).astype(np.float32)
    # Red tiles: high saturation, red hue. Anything else counts as token.
    red = ((hsv[..., 0] < 12) | (hsv[..., 0] > 170)) & (hsv[..., 1] > 90)
    token = (~red).astype(np.float32)
    r = int(DISC_MM / 2 * ppm)
    kernel = np.zeros((2 * r + 1, 2 * r + 1), np.float32)
    cv2.circle(kernel, (r, r), r, 1.0, -1)
    kernel /= kernel.sum()
    score = cv2.filter2D(token, -1, kernel, borderType=cv2.BORDER_CONSTANT)
    _, best_score, _, loc = cv2.minMaxLoc(score)
    best = (x - search + loc[0] / ppm, y - search + loc[1] / ppm)
    return best, best_score


def disc_mask(radius=N / 2 - 3):
    m = np.zeros((N, N), np.float32)
    cv2.circle(m, (N // 2, N // 2), int(radius), 1.0, -1)
    return m


MASK = disc_mask()


def colour_feature(rgb):
    # White balance on the token's own cream disc: light multiplies each channel, so
    # dividing by the disc's colour removes the cast and the local brightness.
    ring = disc_mask(N / 2 - 2) - disc_mask(N / 2 - 6)
    bg = np.median(rgb[ring > 0], axis=0)
    balanced = np.clip(rgb / np.maximum(bg, 1) * 210, 0, 255).astype(np.uint8)
    lab = cv2.cvtColor(balanced, cv2.COLOR_RGB2LAB).astype(np.float32)
    rel = lab - np.float32([210 * 100 / 255, 128, 128])
    chroma = np.hypot(rel[..., 1], rel[..., 2])
    body = (chroma > 14) & (MASK > 0)
    frac = body.mean() / MASK.mean()
    if body.sum() < 10:
        return np.array([0.0, 0.0, 0.0, frac])
    # The body colour: the most common hue among coloured pixels, not the mean, so a
    # small yellow star or purple crystal does not drag it.
    angles = np.degrees(np.arctan2(rel[..., 2][body], rel[..., 1][body])) % 360
    hist, edges = np.histogram(angles, bins=36, range=(0, 360))
    peak = (edges[hist.argmax()] + 5) % 360
    near = np.abs(((angles - peak) + 180) % 360 - 180) < 25
    a = np.median(rel[..., 1][body][near])
    b = np.median(rel[..., 2][body][near])
    lum = np.median(rel[..., 0][body][near])
    return np.array([a, b, lum, frac])


def shape_feature(rgb):
    """Dark ink (outlines, tracks, barrels) is the same in every colour of a type."""
    grey = cv2.cvtColor(rgb.astype(np.uint8), cv2.COLOR_RGB2GRAY).astype(np.float32)
    ring = disc_mask(N / 2 - 2) - disc_mask(N / 2 - 6)
    bg = np.median(grey[ring > 0])
    ink = np.clip((bg - grey) / max(bg, 1), 0, 1)
    gx = cv2.Sobel(grey / max(bg, 1), cv2.CV_32F, 1, 0)
    gy = cv2.Sobel(grey / max(bg, 1), cv2.CV_32F, 0, 1)
    edges = np.hypot(gx, gy)
    feature = np.concatenate(
        [
            cv2.GaussianBlur(ink, (0, 0), 1.2).ravel(),
            cv2.GaussianBlur(edges, (0, 0), 1.2).ravel() * 0.5,
        ]
    )
    return feature


def rotations(rgb, step=10):
    out = []
    for angle in range(0, 360, step):
        rot = cv2.getRotationMatrix2D((N / 2, N / 2), angle, 1.0)
        out.append(cv2.warpAffine(rgb, rot, (N, N), borderMode=cv2.BORDER_REPLICATE))
    return out


def unit(v):
    m = np.concatenate([MASK.ravel(), MASK.ravel()])
    v = v * m
    v = v - v[m > 0].mean() * m
    return v / (np.linalg.norm(v) + 1e-9)


def art_crop(art_rgba):
    """The digital art on a cream disc, as an N x N crop like one from a photo."""
    a = cv2.resize(art_rgba, (N, N), interpolation=cv2.INTER_AREA).astype(np.float32)
    alpha = a[..., 3:4] / 255
    rgb = np.float32(DISC_RGB) * (1 - alpha) + a[..., 2::-1] * alpha
    return rgb


def run(art_dir, board_path, trials, ppm, cast, seed=0, by_art=True):
    art, kinds, colours = load_art(art_dir)
    art_colour = {key: colour_feature(art_crop(image)) for key, image in art.items()}
    board = json.loads(Path(board_path).read_text())
    ref_colour_kind = "tank"
    ref_kind_colour = "blue"
    strip = [(k, ref_kind_colour) for k in kinds] + [
        (ref_colour_kind, c) for c in colours if c != ref_kind_colour
    ]
    type_confusion, colour_confusion = Counter(), Counter()
    found = total = 0
    body_fractions = {True: [], False: []}
    run.failures = Counter()
    run.false_tokens = run.empty_hexes = 0
    for trial in range(trials):
        rng = np.random.default_rng(seed * 100 + trial)
        table = VirtualTable(board, len(strip), rng)
        truth = []
        empty = []
        for k in table.cells:
            if rng.random() < 0.4:
                empty.append(k)
                continue
            kind = kinds[rng.integers(len(kinds))]
            colour = colours[rng.integers(len(colours))]
            x, y = table.cell(k)
            dx, dy = rng.uniform(-4, 4, 2)
            table.draw_token(art[(kind, colour)], x + dx, y + dy, rng.uniform(0, 360))
            truth.append((k, kind, colour))
        for (kind, colour), (x, y) in zip(strip, table.strip, strict=True):
            table.draw_token(art[(kind, colour)], x, y, 0)
        photo, h = photograph(table, ppm, cast, rng)

        # References, read from the strip in the same photo.
        ref_shape, ref_shape_kind = [], []
        ref_colour, ref_colour_name = [], []
        for (kind, colour), (x, y) in zip(strip, table.strip, strict=True):
            rgb = crop(photo, h, x, y).astype(np.float32)
            if colour == ref_kind_colour:
                for r in rotations(rgb):
                    ref_shape.append(unit(shape_feature(r)))
                    ref_shape_kind.append(kind)
            if kind == ref_colour_kind:
                ref_colour.append(colour_feature(rgb))
                ref_colour_name.append(colour)
        ref_shape = np.array(ref_shape)
        ref_colour = np.array(ref_colour)

        for k in empty:
            x, y = table.cell(k)
            if find_disc(photo, h, x, y)[1] >= 0.6:
                run.false_tokens += 1
        run.empty_hexes += len(empty)
        for k, kind, colour in truth:
            x, y = table.cell(k)
            (cx, cy), score = find_disc(photo, h, x, y)
            total += 1
            if score < 0.6:
                continue
            found += 1
            rgb = crop(photo, h, cx, cy).astype(np.float32)
            sims = ref_shape @ unit(shape_feature(rgb))
            per_kind = defaultdict(float)
            for s, kk in zip(sims, ref_shape_kind, strict=True):
                per_kind[kk] = max(per_kind[kk], s)
            guess_kind = max(per_kind, key=per_kind.get)
            type_confusion[(kind, guess_kind)] += 1

            f = colour_feature(rgb)
            if f[3] < WHITE_BODY_FRACTION:
                guess_colour = "white"
            elif by_art:
                # Compare with this type's own art in each colour.
                d = {
                    c: np.hypot(f[0] - r[0], f[1] - r[1]) + 0.3 * abs(f[2] - r[2])
                    for (kk, c), r in art_colour.items()
                    if kk == guess_kind and c != "white"
                }
                guess_colour = min(d, key=d.get)
            else:
                d = [
                    np.hypot(f[0] - r[0], f[1] - r[1]) + 0.3 * abs(f[2] - r[2])
                    if c != "white"
                    else 1e9
                    for r, c in zip(ref_colour, ref_colour_name, strict=True)
                ]
                guess_colour = ref_colour_name[int(np.argmin(d))]
            body_fractions[colour == "white"].append(f[3])
            colour_confusion[(colour, guess_colour)] += 1
            if colour != guess_colour:
                run.failures[(kind, colour, guess_colour)] += 1
    run.body_fractions = body_fractions
    return found, total, type_confusion, colour_confusion


def summary(type_confusion, colour_confusion):
    n = sum(type_confusion.values())
    type_ok = sum(v for (a, b), v in type_confusion.items() if a == b)
    colour_ok = sum(v for (a, b), v in colour_confusion.items() if a == b)
    type_errors = Counter({k: v for k, v in type_confusion.items() if k[0] != k[1]})
    colour_errors = Counter({k: v for k, v in colour_confusion.items() if k[0] != k[1]})
    return n, type_ok, colour_ok, type_errors, colour_errors


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("art", type=Path)
    parser.add_argument("board", type=Path)
    parser.add_argument("--trials", type=int, default=2)
    args = parser.parse_args()
    for ppm in (6.0, 4.0, 3.0):
        for cast in (False, True):
            found, total, tc, cc = run(args.art, args.board, args.trials, ppm, cast)
            n, tok, cok, terr, cerr = summary(tc, cc)
            light = "warm, uneven" if cast else "even"
            print(
                f"{ppm:.0f} px/mm ({DISC_MM * ppm:.0f} px disc), {light} light: "
                f"found {found}/{total}, type {tok}/{n} ({100 * tok / n:.0f}%), "
                f"colour {cok}/{n} ({100 * cok / n:.0f}%), "
                f"empty hexes read as tokens {run.false_tokens}/{run.empty_hexes}"
            )
            if terr:
                print(
                    "   type mix-ups:",
                    ", ".join(f"{a}->{b} x{v}" for (a, b), v in terr.most_common(6)),
                )
            bf = run.body_fractions
            print(
                f"   coloured pixels: white units max {max(bf[True]):.3f}, "
                f"other units min {min(bf[False]):.3f}"
            )
            if run.failures:
                print(
                    "   colour failures by unit:",
                    ", ".join(f"{k} {a}->{b} x{v}" for (k, a, b), v in run.failures.most_common(5)),
                )
            if cerr:
                print(
                    "   colour mix-ups:",
                    ", ".join(f"{a}->{b} x{v}" for (a, b), v in cerr.most_common(6)),
                )


if __name__ == "__main__":
    main()
