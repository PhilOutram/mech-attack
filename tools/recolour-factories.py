# Makes yellow and purple factory pictures from the blue ones.
# The team colour in units/factory*-blue.webp is the blue on the roller bands. A pixel counts as
# team-coloured where the blue and green pictures differ by more than the WebP compression noise
# and the blue pixel is actually blue. Those pixels are mapped to the same shade of the new hue
# with the same lightness rules as tools/recolour-tokens.mjs; pixels near the noise threshold are
# blended so edges stay soft. Everything else is copied from the blue picture.
# Needs Pillow. Usage: python tools/recolour-factories.py
import colorsys
from pathlib import Path

from PIL import Image

UNITS_DIR = Path(__file__).resolve().parent.parent / "units"

REFERENCE_BLUE = "#0066cc"
TARGETS        = {"yellow": "#e0b000", "purple": "#8a3ccf"}

DIFF_NOISE     = 12     # blue-green channel difference treated as compression noise
DIFF_FULL      = 40     # difference at which a pixel is fully team-coloured
BLUE_HUE_MIN   = 170    # degrees: hue range a team pixel must have in the blue picture
BLUE_HUE_MAX   = 260
MIN_SATURATION = 0.12   # greyer pixels than this are left alone
WEBP_QUALITY   = 86     # matches the sizes of the existing pictures
WEBP_METHOD    = 6      # slowest, smallest encoder setting
HUE_TURN       = 360.0


def hex_rgb(text):
    return tuple(int(text[i:i + 2], 16) / 255 for i in (1, 3, 5))


def make_mapper(base_hex):
    rh, rl, rs = colorsys.rgb_to_hls(*hex_rgb(REFERENCE_BLUE))
    th, tl, ts = colorsys.rgb_to_hls(*hex_rgb(base_hex))

    def mapper(r, g, b):
        h, l, s = colorsys.rgb_to_hls(r, g, b)
        hue = (th + h - rh) % 1.0
        sat = min(1.0, s * ts / rs)
        light = l / rl * tl if l <= rl else tl + (l - rl) / (1 - rl) * (1 - tl)
        return colorsys.hls_to_rgb(hue, min(1.0, max(0.0, light)), sat)

    return mapper


def team_weight(blue_px, green_px):
    diff = max(abs(a - b) for a, b in zip(blue_px, green_px))
    if diff <= DIFF_NOISE:
        return 0.0
    h, _, s = colorsys.rgb_to_hls(*(v / 255 for v in blue_px))
    if s < MIN_SATURATION or not BLUE_HUE_MIN <= h * HUE_TURN <= BLUE_HUE_MAX:
        return 0.0
    return min(1.0, (diff - DIFF_NOISE) / (DIFF_FULL - DIFF_NOISE))


def recolour(blue, green, mapper):
    out = []
    changed = 0
    for bp, gp in zip(blue.get_flattened_data(), green.get_flattened_data()):
        w = team_weight(bp, gp)
        if w == 0.0:
            out.append(bp)
            continue
        changed += 1
        new = mapper(*(v / 255 for v in bp))
        out.append(tuple(round(o + (n * 255 - o) * w) for o, n in zip(bp, new)))
    img = Image.new("RGB", blue.size)
    img.putdata(out)
    return img, changed


def main():
    written = 0
    for blue_path in sorted(UNITS_DIR.glob("factory*-blue.webp")):
        stem = blue_path.name[: -len("-blue.webp")]
        green_path = UNITS_DIR / f"{stem}-green.webp"
        if not green_path.exists():
            print(f"{stem}: no green version, skipped")
            continue
        blue = Image.open(blue_path).convert("RGB")
        green = Image.open(green_path).convert("RGB")
        if blue.size != green.size:
            print(f"{stem}: blue and green sizes differ, skipped")
            continue
        for name, base in TARGETS.items():
            img, changed = recolour(blue, green, make_mapper(base))
            out_path = UNITS_DIR / f"{stem}-{name}.webp"
            img.save(out_path, "WEBP", quality=WEBP_QUALITY, method=WEBP_METHOD)
            written += 1
            size = out_path.stat().st_size
            print(f"{out_path.name}: {changed} px recoloured, {size} bytes "
                  f"(blue {blue_path.stat().st_size})")
    print(f"{written} files written")


if __name__ == "__main__":
    main()
