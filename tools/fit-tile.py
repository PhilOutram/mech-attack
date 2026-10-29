"""Turn a hex tile exported from Affinity into an app tile: 192 x 166, flat-topped,
cut on the middle of the dark border, transparent outside the hex."""
import sys
from PIL import Image, ImageDraw, ImageChops

def fit(src_path, out_path, W=192, H=166):
    im = Image.open(src_path).convert('RGBA')
    a = im.getchannel('A')
    x0, y0, x1, y1 = a.point(lambda v: 255 if v > 128 else 0).getbbox()
    cx = (x0 + x1) // 2
    # border thickness measured down the centre column from the top edge
    t = 0
    for y in range(y0, y1):
        r, g, b, al = im.getpixel((cx, y))
        if al > 128 and max(r, g, b) < 80 and abs(r - g) < 20:
            t += 1
        elif t:
            break
    inset_v = t / 2
    inset_h = inset_v / 0.8660254
    box = (x0 + inset_h, y0 + inset_v, x1 - inset_h, y1 - inset_v)
    tile = im.resize((W, H), Image.LANCZOS, box=box)
    S = 8
    m = Image.new('L', (W * S, H * S), 0)
    ImageDraw.Draw(m).polygon([(0, H * S / 2), (W * S / 4, 0), (W * S * 3 / 4, 0), (W * S, H * S / 2),
                               (W * S * 3 / 4, H * S), (W * S / 4, H * S)], fill=255)
    tile.putalpha(ImageChops.multiply(tile.getchannel('A'), m.resize((W, H), Image.LANCZOS)))
    tile.save(out_path, optimize=True)
    ratio = (box[2] - box[0]) / (box[3] - box[1])
    return dict(src=im.size, hex=(x0, y0, x1, y1), border=t, ratio=round(ratio, 4))

if __name__ == '__main__':
    print(fit(sys.argv[1], sys.argv[2]))
