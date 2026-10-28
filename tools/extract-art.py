"""Extract Mech Attack hex tiles and unit SVGs from Phil's original art.

Reads the originals on OneDrive (read only: nothing there is ever written) and writes:
- tiles/*.png and tiles/tiles.json: flat-topped hex tiles, 192 x 166 px, transparent outside
  the hex, cut on the middle of the dark border so neighbouring tiles join edge to edge
- units/*.svg: byte-for-byte copies of the BLUE and GREEN unit SVGs plus factory, crystals
  and explosion, with a self-containment check printed for each

Run from the repo root:  python tools/extract-art.py
Needs Pillow and numpy. Do not run Python with -I (it hides the user site-packages).

How the hex grid is found
- The hex borders are flat dark grey (51, 51, 51). Every neutral grey pixel is marked as
  border and the regions between borders are labelled as connected components.
- A component the size and shape of one hex interior gives that hex's centre: the middle of
  its bounding box (left and right vertices, top and bottom edges).
- The spacing between neighbouring centres gives the cell radius R (centre to the middle of
  the border): horizontal step = 1.5 R, vertical step = sqrt(3) R.
- Each tile is the cell hexagon of radius R around its centre, so half of each shared border
  lands in each tile and tiles drawn side by side show one full-width border between them.

Cleaning the map page copies
- Every outer ring hex on the map pages is crossed by its cluster's cutting guide: a 50 %
  grey band about 15 px wide with a darker centre line, laid over the art. Clusters also
  overlap a little, so the outer border of a ring hex can be covered by the next cluster.
- Each piece of art is repeated many times, so the copy with the least cutting line is
  used, then cleaned against a model of the bare ground (red gradient and border): the
  per-pixel median of every non-mountain copy, leaving out pixels near rocks.
- The line is found with a Hough transform on pixels that match the band over bare ground,
  refined by least-squares fits. Along it, pixels away from rocks are set to the ground
  model; near rocks the band is undone by inverting the blend (pixel = A(d) * art + B(d),
  with d the distance from the line and A, B measured where the ground is known).
- The hex's own border, and border grey from a neighbouring cluster inside it, are set to
  the ground model.
"""

import json
import math
import os
import shutil
import sys
import xml.etree.ElementTree as ET

import numpy as np
from PIL import Image

# ---------------------------------------------------------------------------------------------
# Paths

ART_ROOT    = r"C:\Users\phil_\OneDrive\SHARED - FamilyO - LOCAL\Games\MechAttack"
MAP_DIR     = os.path.join(ART_ROOT, "Map Tiles")
SVG_DIR     = os.path.join(ART_ROOT, "Units", "SVG", "Units")
REPO_ROOT   = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TILES_DIR   = os.path.join(REPO_ROOT, "tiles")
UNITS_DIR   = os.path.join(REPO_ROOT, "units")
MAP_PAGES   = ["Mech Attack - Map Page %d.png" % n for n in range(1, 8)]
CHASM_SHEET = "Mech Attack Tiles v3 - smaller for printing.png"

# ---------------------------------------------------------------------------------------------
# Output tile

TILE_W             = 192
TILE_H             = 166
MASK_SUPERSAMPLE   = 8      # sub-samples per pixel side for the anti-aliased hex mask
MASK_GROW_PX       = 0.5    # grow the mask so neighbouring tiles overlap on the border
MAX_LOSSLESS_BYTES = 45000  # switch to a palette PNG if a lossless PNG is bigger than this
PALETTE_SIZE       = 256
EDGE_ALPHA_LEVELS  = 15     # palette entries kept for the part-transparent hex edge

# ---------------------------------------------------------------------------------------------
# Detection

BORDER_MAX_SPREAD   = 22      # max - min channel for a pixel to count as neutral grey
BORDER_MIN_LEVEL    = 28      # darker than this is black ink (rock outlines), not border
BORDER_MAX_LEVEL    = 160     # lighter than this is not border
INTERIOR_MIN_W      = 340     # width window for one map hex interior, source pixels
INTERIOR_MAX_W      = 380
HEX_RATIO_TOL       = 0.02    # interior width / height must be within this of 2 / sqrt(3)
NEIGHBOUR_MIN_DIST  = 300     # centre-to-centre distance window for neighbours
NEIGHBOUR_MAX_DIST  = 350
SAME_COLUMN_TOL     = 5       # dx below this means the neighbour is straight N or S
CLUSTER_RING_SIZE   = 6
ALPHA_OPAQUE        = 128
CHASM_CLUSTER_MIN_W = 800     # the chasm cluster outline is about 5 R wide
CHASM_CLUSTER_MAX_W = 1100
CENTRE_AGREE_TOL    = 3.0     # px: detected ring hexes must agree on the cluster centre
RING_MATCH_SHARE    = 0.25    # a closed hex within this share of R of a ring slot fills it
SINGLE_HEX_MIN_W    = 1000    # interior width window for the large single chasm hex
SINGLE_HEX_MAX_W    = 1600
CROP_MARGIN_PX      = 12      # source pixels kept beyond the cell for the resampling filter

# ---------------------------------------------------------------------------------------------
# Grouping and classification

ANALYSIS_R          = 170     # radius of the inner area used for art analysis, source px
INK_MAX_MEAN        = 25      # mean of R, G, B below this is black ink
MATCH_DILATE_PX     = 2       # shift tolerance when matching ink masks
MATCH_MIN_COVER     = 0.9     # share of ink that must match in both directions
PEACH_MIN_R         = 200     # mountain highlights are light peach
PEACH_MIN_G         = 110
MOUNTAIN_MIN_PEACH  = 0.03    # share of inner pixels that are peach for a mountain
ROCKY_MIN_INK       = 0.026   # share of inner pixels that are rock ink for rocky ground
BORDERLINE_INK      = 0.005   # flag plain / rocky calls this close to ROCKY_MIN_INK
MAX_PER_TYPE        = 4

# ---------------------------------------------------------------------------------------------
# Cutting line removal

CUT_BAND_GREY       = 52.5    # band pixel = 0.5 * ground + this
CUT_BAND_TOL        = 14      # max channel error for a pixel to match the band
CUT_BAND_MIN_DIFF   = 20      # and it must differ from the ground by more than this
CUT_CHECK_GROW_PX   = 3       # count band pixels a little beyond the cell edge
CUT_FIT_GROW_PX     = 6       # work this far beyond the cell edge (still on its own border)
HOUGH_ANGLES        = 720     # 0.25 degree steps
LINE_MIN_POINTS     = 200
LINE_MAX_COUNT      = 4
LINE_FIT_WINDOWS    = (12, 9, 9)  # successive half-widths for the least-squares refits
LINE_CLEAR_PX       = 11      # remove points this close to a found line before the next
LINE_END_PAD_PX     = 12      # extend each line segment past its last band pixel
PROFILE_HALF_PX     = 10.0    # restore pixels this close to a line
PROFILE_BIN_PX      = 0.125
PROFILE_MIN_PX      = 30      # pixels needed in a distance bin to fit A and B
PROFILE_FIT_PASSES  = 3
PROFILE_REJECT      = 10      # drop pixels further than this from the fit (rocks)
PROFILE_IDENT_A     = 0.03    # treat a bin as untouched when A and B are this close to 1, 0
PROFILE_IDENT_B     = 4
PROFILE_MIN_A       = 0.15    # never divide by less than this
BAND_FLANK_PX       = (2.5, 5.5)  # |d| range of the plain 50 % band either side of the centre
BAND_FLANK_A        = (0.4, 0.6)  # A must be in this range there, or the line is rejected
STRIPE_GAP_PX       = 1.5     # sample the band this far beyond the dark centre line
ART_GUARD_PX        = 10      # pixels this close to rock ink keep their restored values
INK_EDGE_MARGIN_PX  = 8       # do not look for rock ink in restored pixels this near the edge
BORDER_MARGIN_PX    = 2.5     # the border zone starts this far outside the interior edge
FOREIGN_MIN_DIFF    = 30      # border grey this far from the ground inside a hex is foreign
GROUND_SHIFT_PX     = 2       # search this many whole pixels to line the ground model up
GROUND_ERR_CAP      = 40      # cap per-pixel error so rocks and the line do not dominate
GROUND_ART_GUARD_PX = 12      # leave out pixels this close to rock ink from the ground model
GROUND_CHUNK_ROWS   = 40      # rows per step when building the ground model (memory)

DIRECTION_OFFSETS = {  # cluster ring offsets in units of (1.5 R, sqrt(3) R / 2)
    "C": (0, 0), "N": (0, -2), "NE": (1, -1), "SE": (1, 1), "S": (0, 2), "SW": (-1, 1),
    "NW": (-1, -1)}
CHASM_PIECES = [("chasm-n.png", "N"), ("chasm-centre.png", "C"), ("chasm-sw.png", "SW")]
EXTRA_RING = ("NW", "NE", "SE", "S")  # chasm-free ring hexes of the chasm cluster

UNIT_NAMES = ["Scout Bike", "Tank", "Heavy Cannon", "Artillery", "Light Harvester", "Light Medic"]
UNIT_COLOURS = ["BLUE", "GREEN"]
UNIT_EXTRAS = ["Factory", "Crystals", "Explosion"]


def rel_source(path):
    return os.path.relpath(path, ART_ROOT).replace("\\", "/")


def load_rgba(path):
    with Image.open(path) as im:
        return np.asarray(im.convert("RGBA"))


# ---------------------------------------------------------------------------------------------
# Hex detection

def components(mask):
    """Label connected True regions of a 2-D mask. Returns [area, x0, x1, y0, y1] per region."""
    parent = []

    def find(a):
        while parent[a] != a:
            parent[a] = parent[parent[a]]
            a = parent[a]
        return a

    runs = []
    prev = []
    for y in range(mask.shape[0]):
        edges = np.diff(np.concatenate(([0], mask[y].astype(np.int8), [0])))
        cur = []
        for s, e in zip(np.where(edges == 1)[0], np.where(edges == -1)[0]):
            lab = len(parent)
            parent.append(lab)
            for ps, pe, pl in prev:
                if ps < e and s < pe:
                    a, b = find(lab), find(pl)
                    if a != b:
                        parent[max(a, b)] = min(a, b)
            cur.append((s, e, lab))
            runs.append((y, s, e, lab))
        prev = cur
    out = {}
    for y, s, e, lab in runs:
        root = find(lab)
        box = out.get(root)
        if box is None:
            out[root] = [e - s, s, e - 1, y, y]
        else:
            box[0] += e - s
            box[1] = min(box[1], s)
            box[2] = max(box[2], e - 1)
            box[3] = min(box[3], y)
            box[4] = max(box[4], y)
    return list(out.values())


def box_centre(box):
    return ((box[1] + box[2]) / 2.0, (box[3] + box[4]) / 2.0)


def border_grey(rgb):
    """Pixels that are the neutral grey of a hex border (not black ink, not white page)."""
    rgb = rgb.astype(np.int16)
    hi = rgb.max(2)
    lo = rgb.min(2)
    return (hi - lo < BORDER_MAX_SPREAD) & (lo > BORDER_MIN_LEVEL) & (hi < BORDER_MAX_LEVEL)


def find_hex_interiors(rgba, min_w=INTERIOR_MIN_W, max_w=INTERIOR_MAX_W):
    """Interiors of hexes whose border is closed. Returns (cx, cy, w, h) per hex."""
    found = []
    for box in components(~border_grey(rgba[..., :3])):
        w = box[2] - box[1] + 1
        h = box[4] - box[3] + 1
        if min_w <= w <= max_w and abs(w / float(h) - 2 / math.sqrt(3)) < HEX_RATIO_TOL:
            cx, cy = box_centre(box)
            found.append((cx, cy, w, h))
    return found


def cell_radius(hexes_by_page):
    """Cell radius R from the spacing of neighbouring centres on every page."""
    estimates = []
    for hexes in hexes_by_page:
        for a in hexes:
            for b in hexes:
                dx = b[0] - a[0]
                dy = b[1] - a[1]
                if not NEIGHBOUR_MIN_DIST < math.hypot(dx, dy) < NEIGHBOUR_MAX_DIST:
                    continue
                if abs(dx) < SAME_COLUMN_TOL:
                    estimates.append(abs(dy) / math.sqrt(3))
                elif dx > 0:
                    estimates.append(dx / 1.5)
    return float(np.median(estimates)), len(estimates)


def cluster_positions(hexes):
    """Label each hex C (cluster centre) or by its direction from the centre."""
    labels = {}
    for i, a in enumerate(hexes):
        ring = [j for j, b in enumerate(hexes) if j != i and
                NEIGHBOUR_MIN_DIST < math.hypot(b[0] - a[0], b[1] - a[1]) < NEIGHBOUR_MAX_DIST]
        if len(ring) != CLUSTER_RING_SIZE:
            continue
        labels[i] = "C"
        for j in ring:
            dx = hexes[j][0] - a[0]
            dy = hexes[j][1] - a[1]
            vert = "N" if dy < 0 else "S"
            labels[j] = vert if abs(dx) < SAME_COLUMN_TOL else vert + ("E" if dx > 0 else "W")
    return labels


# ---------------------------------------------------------------------------------------------
# Crops and art features

def hex_mask(shape, cx, cy, radius):
    """Flat-topped hex of the given circumradius on an array of shape (h, w)."""
    yy, xx = np.mgrid[0:shape[0], 0:shape[1]]
    x = np.abs(xx + 0.5 - cx)
    y = np.abs(yy + 0.5 - cy)
    apothem = radius * math.sqrt(3) / 2
    return (y <= apothem) & (x * math.sqrt(3) / 2 + y / 2 <= apothem)


def crop_around(rgba, cx, cy, half):
    """RGB crop of size 2*half centred on (cx, cy), padded with white, and the crop centre."""
    x0 = int(math.floor(cx)) - half
    y0 = int(math.floor(cy)) - half
    out = np.full((2 * half, 2 * half, 3), 255, np.uint8)
    sx0, sy0 = max(0, x0), max(0, y0)
    sx1, sy1 = min(rgba.shape[1], x0 + 2 * half), min(rgba.shape[0], y0 + 2 * half)
    out[sy0 - y0:sy1 - y0, sx0 - x0:sx1 - x0] = rgba[sy0:sy1, sx0:sx1, :3]
    return out, cx - x0, cy - y0


def dilate(mask, px):
    """Dilate a boolean mask by a square of half-width px (done as rows, then columns)."""
    rows = mask.copy()
    for d in range(1, px + 1):
        rows[:, d:] |= mask[:, :-d]
        rows[:, :-d] |= mask[:, d:]
    out = rows.copy()
    for d in range(1, px + 1):
        out[d:, :] |= rows[:-d, :]
        out[:-d, :] |= rows[d:, :]
    return out


def make_item(source, rgba, cx, cy, pos, half):
    crop, ccx, ccy = crop_around(rgba, cx, cy, half)
    inner = hex_mask(crop.shape[:2], ccx, ccy, ANALYSIS_R)
    c = crop.astype(np.int16)
    ink = (c.mean(2) < INK_MAX_MEAN) & inner
    peach = (c[..., 0] > PEACH_MIN_R) & (c[..., 1] > PEACH_MIN_G) & inner
    area = float(inner.sum())
    return dict(source=source, cx=cx, cy=cy, pos=pos, crop=crop, ccx=ccx, ccy=ccy, ink=ink,
                ink_wide=dilate(ink, MATCH_DILATE_PX), ink_share=ink.sum() / area,
                peach_share=peach.sum() / area)


def same_art(a, b):
    """True when two items' rock and mountain ink matches, allowing a small shift."""
    na, nb = a["ink"].sum(), b["ink"].sum()
    if na == 0 or nb == 0:
        return na == nb
    cover_a = (a["ink"] & b["ink_wide"]).sum() / float(na)
    cover_b = (b["ink"] & a["ink_wide"]).sum() / float(nb)
    return min(cover_a, cover_b) >= MATCH_MIN_COVER


def terrain_of(item):
    if item["peach_share"] >= MOUNTAIN_MIN_PEACH:
        return "mountain"
    return "rocky" if item["ink_share"] >= ROCKY_MIN_INK else "plain"


# ---------------------------------------------------------------------------------------------
# Cutting line

def ground_model(items):
    """Bare ground (red gradient and border): per pixel, the median of every copy that has no
    mountain and no rock near that pixel."""
    usable = [it for it in items if terrain_of(it) != "mountain"]
    rows = usable[0]["crop"].shape[0]
    ground = np.zeros(usable[0]["crop"].shape, np.float32)
    away = [~dilate(it["ink"], GROUND_ART_GUARD_PX) for it in usable]
    for y0 in range(0, rows, GROUND_CHUNK_ROWS):
        y1 = min(rows, y0 + GROUND_CHUNK_ROWS)
        stack = np.stack([it["crop"][y0:y1] for it in usable]).astype(np.float32)
        keep = np.stack([a[y0:y1] for a in away])
        stack[~keep] = np.nan
        with np.errstate(all="ignore"):
            part = np.nanmedian(stack, axis=0)
        fallback = np.median(np.stack([it["crop"][y0:y1] for it in usable]), axis=0)
        ground[y0:y1] = np.where(np.isnan(part), fallback, part)
    return ground


def band_pixels(crop, ground):
    c = crop.astype(np.float32)
    return ((np.abs(c - (0.5 * ground + CUT_BAND_GREY)).max(2) < CUT_BAND_TOL) &
            (np.abs(c - ground).max(2) > CUT_BAND_MIN_DIFF))


def cut_line_count(item, ground, radius):
    cell = hex_mask(item["crop"].shape[:2], item["ccx"], item["ccy"], radius + CUT_CHECK_GROW_PX)
    return int((band_pixels(item["crop"], ground) & cell).sum())


def hough_peak(px, py):
    theta = np.arange(HOUGH_ANGLES) * np.pi / HOUGH_ANGLES
    rho = np.outer(px, np.cos(theta)) + np.outer(py, np.sin(theta))
    low = rho.min()
    idx = np.round(rho - low).astype(int)
    acc = np.zeros((idx.max() + 1, HOUGH_ANGLES), np.int32)
    for k in range(HOUGH_ANGLES):
        acc[:, k] = np.bincount(idx[:, k], minlength=acc.shape[0])
    r, k = np.unravel_index(acc.argmax(), acc.shape)
    return math.cos(theta[k]), math.sin(theta[k]), r + low


def fit_line(px, py):
    mx, my = px.mean(), py.mean()
    _, vecs = np.linalg.eigh(np.cov(np.vstack([px - mx, py - my])))
    nx, ny = vecs[:, 0]
    return nx, ny, mx * nx + my * ny, mx, my


def find_cut_lines(band):
    py, px = np.nonzero(band)
    px = px.astype(float)
    py = py.astype(float)
    lines = []
    while len(px) > LINE_MIN_POINTS and len(lines) < LINE_MAX_COUNT:
        nx, ny, rho = hough_peak(px, py)
        for win in LINE_FIT_WINDOWS:
            near = np.abs(px * nx + py * ny - rho) < win
            if near.sum() < LINE_MIN_POINTS:
                return lines
            nx, ny, rho, mx, my = fit_line(px[near], py[near])
        t = (px[near] - mx) * -ny + (py[near] - my) * nx
        lines.append(dict(nx=nx, ny=ny, rho=rho, mx=mx, my=my, t0=t.min(), t1=t.max()))
        keep = np.abs(px * nx + py * ny - rho) >= LINE_CLEAR_PX
        px, py = px[keep], py[keep]
    return lines


def fit_profile(c, ground, dist, region):
    """Per distance bin, least-squares A, B with c = A * ground + B, rejecting art pixels.
    Returns the bin centres and A, B at each."""
    nbins = int(round(2 * PROFILE_HALF_PX / PROFILE_BIN_PX)) + 1
    bins = np.clip(np.round((dist + PROFILE_HALF_PX) / PROFILE_BIN_PX).astype(int), 0, nbins - 1)
    a_fit = np.ones(nbins)
    b_fit = np.zeros(nbins)
    fitted = np.zeros(nbins, bool)
    for b in range(nbins):
        m = region & (bins == b)
        if m.sum() < PROFILE_MIN_PX:
            continue
        x_all = ground[m].reshape(-1)
        y_all = c[m].reshape(-1)
        a, off = 1.0, 0.0
        for n in range(PROFILE_FIT_PASSES):
            if n == 0:
                keep = np.ones(len(x_all), bool)
            else:
                keep = np.abs(y_all - (a * x_all + off)) < PROFILE_REJECT
            if keep.sum() < PROFILE_MIN_PX:
                break
            design = np.vstack([x_all[keep], np.ones(keep.sum())]).T
            (a, off), *_ = np.linalg.lstsq(design, y_all[keep], rcond=None)
        a_fit[b], b_fit[b] = a, off
        fitted[b] = True
    # The band is symmetric: a bin with too few pixels (off the cell) uses its mirror bin.
    mirrored = fitted.copy()
    for b in range(nbins):
        if not fitted[b] and fitted[nbins - 1 - b]:
            a_fit[b], b_fit[b] = a_fit[nbins - 1 - b], b_fit[nbins - 1 - b]
            mirrored[b] = True
    # Bins left empty between fitted ones (pixel centres sit on a lattice of distances for a
    # slanted line) are interpolated; the two ends are untouched ground.
    mirrored[0] = mirrored[-1] = True
    a_fit[0] = a_fit[-1] = 1.0
    b_fit[0] = b_fit[-1] = 0.0
    centres = np.arange(nbins) * PROFILE_BIN_PX - PROFILE_HALF_PX
    a_fit = np.interp(centres, centres[mirrored], a_fit[mirrored])
    b_fit = np.interp(centres, centres[mirrored], b_fit[mirrored])
    return centres, a_fit, b_fit


def align_ground(c, ground, work):
    """Shift the ground model by whole pixels to line up with this copy's border. The hex
    centres are found to half a pixel, so a crop can sit a pixel off the median."""
    best = None
    for dy in range(-GROUND_SHIFT_PX, GROUND_SHIFT_PX + 1):
        for dx in range(-GROUND_SHIFT_PX, GROUND_SHIFT_PX + 1):
            moved = np.roll(np.roll(ground, dy, 0), dx, 1)
            err = float(np.mean(np.minimum(np.abs(c - moved).max(2)[work], GROUND_ERR_CAP)))
            if best is None or err < best[0]:
                best = (err, moved)
    return best[1]


def clean_copy(item, ground, radius, inner_radius):
    """Return a copy of the item's crop with anything that is not this hex's own art removed,
    the number of cutting lines removed and the number of foreign border pixels replaced.
    Only the cell and its own border are worked on: beyond that the ground model does not
    hold (neighbouring art, the page or the backing card).

    - The hex's own border holds no art, so it is set to the ground border outright. On the
      outside of a cluster this border can be overlapped by the next cluster on the page.
    - Border grey inside the hex is part of a neighbouring cluster's border lying over the
      edge of this hex, so it is set to ground too.
    - Along a cutting line, pixels away from any rock are bare ground, so they are set to the
      ground model.
    - Near a rock the 50 % band is undone by inverting the blend. The dark centre line is too
      thin and uneven to invert cleanly, so across it pixels are interpolated between the
      restored band pixels on either side.
    """
    c = item["crop"].astype(np.float32)
    shape = c.shape[:2]
    work = hex_mask(shape, item["ccx"], item["ccy"], radius + CUT_FIT_GROW_PX)
    ground = align_ground(c, ground, work)
    inside = hex_mask(shape, item["ccx"], item["ccy"], inner_radius + BORDER_MARGIN_PX)
    interior = hex_mask(shape, item["ccx"], item["ccy"], inner_radius - INK_EDGE_MARGIN_PX)
    border = work & ~inside
    foreign = inside & border_grey(item["crop"]) & (np.abs(c - ground).max(2) > FOREIGN_MIN_DIFF)
    c[border | foreign] = ground[border | foreign]
    lines = find_cut_lines(band_pixels(np.round(c).astype(np.uint8), ground) & work)
    yy, xx = np.mgrid[0:shape[0], 0:shape[1]].astype(np.float32)
    out = c.copy()
    removed = 0
    for ln in lines:
        dist = xx * ln["nx"] + yy * ln["ny"] - ln["rho"]
        along = (xx - ln["mx"]) * -ln["ny"] + (yy - ln["my"]) * ln["nx"]
        region = ((np.abs(dist) <= PROFILE_HALF_PX) & (along >= ln["t0"] - LINE_END_PAD_PX) &
                  (along <= ln["t1"] + LINE_END_PAD_PX) & work)
        centres, a_fit, b_fit = fit_profile(c, ground, dist, region)
        flank = (np.abs(centres) >= BAND_FLANK_PX[0]) & (np.abs(centres) <= BAND_FLANK_PX[1])
        if not BAND_FLANK_A[0] <= float(np.median(a_fit[flank])) <= BAND_FLANK_A[1]:
            continue
        a_pix = np.interp(dist, centres, a_fit)
        b_pix = np.interp(dist, centres, b_fit)
        touched = (np.abs(a_pix - 1) > PROFILE_IDENT_A) | (np.abs(b_pix) > PROFILE_IDENT_B)
        use = region & touched & (a_pix > PROFILE_MIN_A)
        out[use] = (c[use] - b_pix[use][:, None]) / a_pix[use][:, None]

        dark = (a_fit < BAND_FLANK_A[0]) & (np.abs(centres) < BAND_FLANK_PX[0] + 1)
        stripe_half = float(np.abs(centres[dark]).max()) + PROFILE_BIN_PX if dark.any() else 0
        stripe = region & (np.abs(dist) <= stripe_half)
        reach = stripe_half + STRIPE_GAP_PX
        ends = []
        for sign in (-1, 1):
            # Step from each pixel across the line to the band on one side.
            sx = np.clip(np.round(xx + (sign * reach - dist) * ln["nx"]), 0, shape[1] - 1)
            sy = np.clip(np.round(yy + (sign * reach - dist) * ln["ny"]), 0, shape[0] - 1)
            ends.append(out[sy.astype(int), sx.astype(int)])
        weight = ((dist + reach) / (2 * reach))[..., None]
        across = ends[0] * (1 - weight) + ends[1] * weight
        out[stripe] = across[stripe]

        # Rock ink: unchanged pixels off the line, plus band pixels whose inverted value is
        # ink, away from the border edge (where the ground model is least exact).
        ink = (c.mean(2) < INK_MAX_MEAN) & ~region
        flank_px = region & interior & (a_pix > BAND_FLANK_A[0]) & (np.abs(dist) > reach)
        ink |= (np.clip(out, 0, 255).mean(2) < INK_MAX_MEAN) & flank_px
        near_art = dilate(ink, ART_GUARD_PX)
        # Band pixels can be lost where the line meets the border, so bare ground is put back
        # along the whole line, not just the stretch the band was measured on.
        bare = (np.abs(dist) <= PROFILE_HALF_PX) & work & ~near_art
        out[bare] = ground[bare]
        removed += 1

    out[border] = ground[border]
    restored = np.clip(np.round(out), 0, 255).astype(np.uint8)
    return restored, removed, int(foreign.sum())


# ---------------------------------------------------------------------------------------------
# Tile output

def tile_alpha():
    """Anti-aliased flat-topped hex filling the tile, grown slightly to hide seams."""
    ss = MASK_SUPERSAMPLE
    yy, xx = np.mgrid[0:TILE_H * ss, 0:TILE_W * ss]
    x = np.abs((xx + 0.5) / ss - TILE_W / 2.0)
    y = np.abs((yy + 0.5) / ss - TILE_H / 2.0)
    half_h = TILE_H / 2.0
    quarter_w = TILE_W / 4.0
    # Slanted edge through (TILE_W / 2, 0) and (TILE_W / 4, half_h), measured from the centre.
    norm = math.hypot(half_h, quarter_w)
    slant = (half_h * x + quarter_w * y - half_h * TILE_W / 2.0) / norm
    inside = (y <= half_h + MASK_GROW_PX) & (slant <= MASK_GROW_PX)
    cover = inside.reshape(TILE_H, ss, TILE_W, ss).mean(axis=(1, 3))
    return np.round(cover * 255).astype(np.uint8)


ALPHA_MASK = tile_alpha()


def render_tile(rgb, cx, cy, radius):
    """Resample the cell hexagon of the given radius around (cx, cy) into an RGBA array."""
    apothem = radius * math.sqrt(3) / 2
    box = (cx - radius, cy - apothem, cx + radius, cy + apothem)
    tile = np.asarray(Image.fromarray(rgb).resize((TILE_W, TILE_H), Image.LANCZOS, box=box))
    out = np.zeros((TILE_H, TILE_W, 4), np.uint8)
    out[..., :3] = tile
    out[..., 3] = ALPHA_MASK
    out[ALPHA_MASK == 0, :3] = 0
    return out


def palette_png(rgba):
    """Palette image: quantised colours plus a few entries for the part-transparent edge."""
    alpha = rgba[..., 3]
    n_colours = PALETTE_SIZE - 1 - EDGE_ALPHA_LEVELS
    quant = Image.fromarray(rgba[..., :3]).quantize(
        n_colours, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.FLOYDSTEINBERG)
    idx = np.asarray(quant).copy()
    palette = quant.getpalette()[:3 * n_colours]
    palette += [0] * (3 * n_colours - len(palette))
    edge = (alpha > 0) & (alpha < 255)
    edge_rgb = [int(v) for v in np.round(rgba[edge, :3].mean(0))] if edge.any() else [0, 0, 0]
    palette += [0, 0, 0] + edge_rgb * EDGE_ALPHA_LEVELS
    level = np.clip(np.round(alpha / 255.0 * (EDGE_ALPHA_LEVELS + 1)), 1, EDGE_ALPHA_LEVELS)
    idx[alpha == 0] = n_colours
    idx[edge] = (n_colours + level[edge]).astype(np.uint8)
    trns = [255] * n_colours + [0] + [int(round(k * 255.0 / (EDGE_ALPHA_LEVELS + 1)))
                                       for k in range(1, EDGE_ALPHA_LEVELS + 1)]
    out = Image.fromarray(idx, "P")
    out.putpalette(palette)
    return out, bytes(trns)


def save_tile(rgba, name):
    path = os.path.join(TILES_DIR, name)
    Image.fromarray(rgba, "RGBA").save(path, optimize=True)
    if os.path.getsize(path) > MAX_LOSSLESS_BYTES:
        img, trns = palette_png(rgba)
        img.save(path, optimize=True, transparency=trns)
        return os.path.getsize(path), "palette"
    return os.path.getsize(path), "lossless"


# ---------------------------------------------------------------------------------------------
# Chasm sheet

def chasm_cluster(rgba, radius):
    """Centre of the seven-hex chasm cluster, from its outline and its closed ring hexes."""
    opaque = rgba[..., 3] >= ALPHA_OPAQUE
    outline = [b for b in components(opaque)
               if CHASM_CLUSTER_MIN_W <= b[2] - b[1] + 1 <= CHASM_CLUSTER_MAX_W]
    if len(outline) != 1:
        sys.exit("Chasm cluster outline not found (%d candidates)" % len(outline))
    gx, gy = box_centre(outline[0])
    step_x = 1.5 * radius
    step_y = math.sqrt(3) / 2 * radius
    votes = []
    match_tol = RING_MATCH_SHARE * radius
    for cx, cy, w, h in find_hex_interiors(rgba):
        for d, (ox, oy) in DIRECTION_OFFSETS.items():
            if math.hypot(cx - gx - ox * step_x, cy - gy - oy * step_y) < match_tol:
                votes.append((d, cx - ox * step_x, cy - oy * step_y))
    if not votes:
        sys.exit("No closed ring hex found in the chasm cluster")
    ccx = float(np.mean([v[1] for v in votes]))
    ccy = float(np.mean([v[2] for v in votes]))
    spread = max(math.hypot(v[1] - ccx, v[2] - ccy) for v in votes)
    if spread > CENTRE_AGREE_TOL:
        sys.exit("Chasm ring hexes disagree on the cluster centre by %.1f px" % spread)
    return ccx, ccy, [v[0] for v in votes], spread


def single_chasm_hex(rgba):
    found = find_hex_interiors(rgba, SINGLE_HEX_MIN_W, SINGLE_HEX_MAX_W)
    if len(found) != 1:
        sys.exit("Large single chasm hex not found (%d candidates)" % len(found))
    return found[0]


# ---------------------------------------------------------------------------------------------
# Unit SVGs

XLINK_HREF = "{http://www.w3.org/1999/xlink}href"


def check_svg(path):
    """Return (viewBox, width, height, filter count, problems, notes) for one SVG."""
    with open(path, "rb") as f:
        data = f.read()
    root = ET.fromstring(data)
    problems = []
    notes = []
    tags = [el.tag.split("}")[-1] for el in root.iter()]
    embedded = 0
    for el in root.iter():
        for attr in ("href", XLINK_HREF):
            ref = el.get(attr)
            if ref is None:
                continue
            if ref.startswith("data:"):
                embedded += 1
            elif not ref.startswith("#"):
                problems.append("external %s: %s" % (el.tag.split("}")[-1], ref[:60]))
        for attr, value in el.attrib.items():
            if "url(" in value and "url(#" not in value.replace(" ", ""):
                problems.append("external url() in %s" % attr)
    text = data.decode("utf-8", "replace")
    if "@import" in text or "@font-face" in text:
        problems.append("CSS @import or @font-face")
    if "text" in tags or "tspan" in tags:
        notes.append("text elements (font dependent)")
    if embedded:
        notes.append("%d embedded data: PNG" % embedded)
    if "manifest" in tags:
        notes.append("C2PA manifest in metadata")
    return (root.get("viewBox"), root.get("width"), root.get("height"), tags.count("filter"),
            problems, notes)


def copy_units():
    pairs = []
    for unit in UNIT_NAMES:
        for colour in UNIT_COLOURS:
            web = "%s-%s.svg" % (unit.lower().replace(" ", "-"), colour.lower())
            pairs.append(("%s - %s.svg" % (unit, colour), web))
    for extra in UNIT_EXTRAS:
        pairs.append(("%s.svg" % extra, "%s.svg" % extra.lower()))
    for src_name, web in pairs:
        src = os.path.join(SVG_DIR, src_name)
        dst = os.path.join(UNITS_DIR, web)
        shutil.copyfile(src, dst)
        with open(src, "rb") as a, open(dst, "rb") as b:
            if a.read() != b.read():
                sys.exit("Copy of %s is not byte-identical" % src_name)
        vb, w, h, filters, problems, notes = check_svg(dst)
        print("  %-26s %7d B  viewBox=%s  %sx%s  filters=%d  %s%s" % (
            web, os.path.getsize(dst), vb, w, h, filters, "; ".join(notes),
            ("  PROBLEMS: " + "; ".join(problems)) if problems else ""))


# ---------------------------------------------------------------------------------------------

def main():
    os.makedirs(TILES_DIR, exist_ok=True)

    pages = []
    for name in MAP_PAGES:
        rgba = load_rgba(os.path.join(MAP_DIR, name))
        hexes = find_hex_interiors(rgba)
        pages.append((name, rgba, hexes))
        print("%s: %d hexes" % (name, len(hexes)))
    radius, n_pairs = cell_radius([p[2] for p in pages])
    inner_h = float(np.median([h[3] for p in pages for h in p[2]]))
    inner_ratio = (inner_h / 2.0) / (radius * math.sqrt(3) / 2)
    print("Cell radius R = %.2f px from %d neighbour pairs; border %.1f px wide" % (
        radius, n_pairs, 2 * (radius * math.sqrt(3) / 2 - inner_h / 2.0)))

    # Group every map hex by its art.
    half = int(math.ceil(radius)) + CROP_MARGIN_PX
    groups = []
    for name, rgba, hexes in pages:
        labels = cluster_positions(hexes)
        for i, (cx, cy, w, h) in enumerate(hexes):
            item = make_item(os.path.join(MAP_DIR, name), rgba, cx, cy, labels.get(i, "?"), half)
            for g in groups:
                if same_art(g[0], item):
                    g.append(item)
                    break
            else:
                groups.append([item])
    print("Distinct map art: %d groups" % len(groups))

    ground = ground_model([it for g in groups for it in g])

    candidates = []
    for g in groups:
        scored = sorted(((cut_line_count(it, ground, radius), k) for k, it in enumerate(g)))
        best = g[scored[0][1]]
        candidates.append(dict(item=best, copies=len(g), cut_px=scored[0][0],
                               positions=sorted(set(it["pos"] for it in g))))

    # The chasm-free ring hexes of the chasm cluster, in case they hold new art.
    sheet_path = os.path.join(MAP_DIR, CHASM_SHEET)
    sheet = load_rgba(sheet_path)
    ccx, ccy, voters, spread = chasm_cluster(sheet, radius)
    print("Chasm cluster centre (%.1f, %.1f) from ring hexes %s, spread %.1f px" % (
        ccx, ccy, ",".join(voters), spread))
    step_x = 1.5 * radius
    step_y = math.sqrt(3) / 2 * radius
    for d in EXTRA_RING:
        ox, oy = DIRECTION_OFFSETS[d]
        item = make_item(sheet_path, sheet, ccx + ox * step_x, ccy + oy * step_y, d, half)
        twin = [c for c in candidates if same_art(c["item"], item)]
        if twin:
            twin[0]["copies"] += 1
            print("  chasm sheet %s matches existing art" % d)
        else:
            cut_px = cut_line_count(item, ground, radius)
            candidates.append(dict(item=item, copies=1, cut_px=cut_px, positions=[d]))

    entries = []
    for terrain in ("plain", "rocky", "mountain"):
        chosen = sorted((c for c in candidates if terrain_of(c["item"]) == terrain),
                        key=lambda c: c["item"]["ink_share"])[:MAX_PER_TYPE]
        for n, c in enumerate(chosen, 1):
            it = c["item"]
            crop, lines, foreign = clean_copy(it, ground, radius, radius * inner_ratio)
            residual = cut_line_count(dict(it, crop=crop), ground, radius)
            name = "%s-%d.png" % (terrain, n)
            size, kind = save_tile(render_tile(crop, it["ccx"], it["ccy"], radius), name)
            entry = dict(
                file=name, terrain=terrain, source=rel_source(it["source"]),
                centre=[round(it["cx"], 2), round(it["cy"], 2)], radius=round(radius, 2),
                clusterPosition=it["pos"], copiesInSources=c["copies"],
                positionsInClusters=c["positions"], rockInkShare=round(it["ink_share"], 4),
                peachShare=round(it["peach_share"], 4), cutLinePixels=c["cut_px"],
                cutLinesRemoved=lines, cutLinePixelsAfter=residual,
                foreignBorderPixels=foreign, bytes=size, png=kind)
            if terrain != "mountain" and abs(it["ink_share"] - ROCKY_MIN_INK) < BORDERLINE_INK:
                entry["note"] = ("Borderline plain or rocky: rock ink covers %.1f %% of the hex, "
                                 "the rocky threshold is %.1f %%."
                                 % (100 * it["ink_share"], 100 * ROCKY_MIN_INK))
            entries.append(entry)

    sheet_rgb = np.ascontiguousarray(sheet[..., :3])
    for name, d in CHASM_PIECES:
        ox, oy = DIRECTION_OFFSETS[d]
        cx, cy = ccx + ox * step_x, ccy + oy * step_y
        size, kind = save_tile(render_tile(sheet_rgb, cx, cy, radius), name)
        entries.append(dict(file=name, terrain="chasm", source=rel_source(sheet_path),
                            centre=[round(cx, 2), round(cy, 2)], radius=round(radius, 2),
                            clusterPosition=d, bytes=size, png=kind))

    # The large single hex has a thicker border. Scale it so its inner border edge lands where
    # the map tiles' inner border edge does, so the visible border width matches.
    sx, sy, sw, sh = single_chasm_hex(sheet)
    single_r = (sh / 2.0) / inner_ratio / (math.sqrt(3) / 2)
    size, kind = save_tile(render_tile(sheet_rgb, sx, sy, single_r), "chasm-single.png")
    entries.append(dict(file="chasm-single.png", terrain="chasm", source=rel_source(sheet_path),
                        centre=[round(sx, 2), round(sy, 2)], radius=round(single_r, 2),
                        clusterPosition="single", bytes=size, png=kind))

    manifest = dict(
        note="Hex tiles made by tools/extract-art.py from Phil's map art. Flat-topped, "
             "%d x %d px, cut on the middle of the dark border. 'centre' and 'radius' are in "
             "source pixels. Change 'terrain' here to correct a classification."
             % (TILE_W, TILE_H),
        tileWidth=TILE_W, tileHeight=TILE_H, tiles=entries)
    with open(os.path.join(TILES_DIR, "tiles.json"), "w", encoding="utf-8", newline="\n") as f:
        json.dump(manifest, f, indent=2)
        f.write("\n")

    print("Tiles:")
    for e in entries:
        print("  %-17s %-8s %6d B %-8s %s (%.1f, %.1f) %s ink=%s peach=%s cut %s -> %s" % (
            e["file"], e["terrain"], e["bytes"], e["png"], e["source"].split("/")[-1],
            e["centre"][0], e["centre"][1], e["clusterPosition"], e.get("rockInkShare"),
            e.get("peachShare"), e.get("cutLinePixels"), e.get("cutLinePixelsAfter")))

    print("Unit SVGs:")
    copy_units()


if __name__ == "__main__":
    main()
