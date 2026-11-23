"""Crop founder photos to their slide frame ratio (no stretching) and round the corners."""
import sys

sys.path.insert(0, sys.argv[1])
from PIL import Image, ImageDraw, ImageOps

A = sys.argv[2]
DPI = 300
RADIUS_IN = 0.16

# name: (source, frame width in, frame height in, horizontal focus 0..1, vertical focus 0..1, optional pre-crop box)
FRAMES = {
    # three-photo grid: tall portrait left, two equal photos stacked right (0.15" gutters)
    "f_portre.png": ("p02_4.jpeg", 3.0, 4.9, 0.55, 0.5, None),
    "f_aiesec.png": ("aiesec.jpeg", 3.6, 2.375, 0.45, 0.32, None),
    "f_calisma.png": ("p02_1.jpeg", 3.6, 2.375, 0.42, 0.5, None),
}

for out, (src, w_in, h_in, fx, fy, box) in FRAMES.items():
    im = ImageOps.exif_transpose(Image.open(f"{A}/{src}")).convert("RGB")
    if box:
        im = im.crop(box)
    target = (round(w_in * DPI), round(h_in * DPI))
    im = ImageOps.fit(im, target, Image.LANCZOS, centering=(fx, fy))
    mask = Image.new("L", target, 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, target[0] - 1, target[1] - 1), radius=round(RADIUS_IN * DPI), fill=255)
    im.putalpha(mask)
    im.save(f"{A}/{out}")
    print(out, target, "from", src)
