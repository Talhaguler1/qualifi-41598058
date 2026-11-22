"""Put app screenshots into a phone mockup: dark bezel, rounded screen, Dynamic Island, status bar, soft shadow."""
import sys

sys.path.insert(0, sys.argv[1])
from PIL import Image, ImageDraw, ImageFilter, ImageFont

A, FONT = sys.argv[2], sys.argv[3]
SCREEN_W = 900
BEZEL = 30
R_OUT = 150
R_IN = R_OUT - BEZEL
STATUS_H = 96
PAD = 90  # room for the shadow

for name in (sys.argv[4:] or ["p05", "p06", "p08", "p10"]):
    shot = Image.open(f"{A}/phone_{name}.png").convert("RGB")
    sh = round(shot.height * SCREEN_W / shot.width)
    shot = shot.resize((SCREEN_W, sh), Image.LANCZOS)
    screen_h = STATUS_H + sh
    # status bar in the screenshot's own top colour so it blends
    top = shot.getpixel((SCREEN_W // 2, 4))
    screen = Image.new("RGB", (SCREEN_W, screen_h), top)
    screen.paste(shot, (0, STATUS_H))
    d = ImageDraw.Draw(screen)
    dark = sum(top) / 3 < 128
    ink = (255, 255, 255) if dark else (22, 48, 42)
    f = ImageFont.truetype(FONT, 34)
    d.text((70, STATUS_H // 2), "09:41", font=f, fill=ink, anchor="lm")
    # signal bars, wifi-ish dot, battery
    x = SCREEN_W - 190
    for i, h in enumerate((10, 15, 20, 25)):
        d.rounded_rectangle((x + i * 11, STATUS_H // 2 + 12 - h, x + i * 11 + 7, STATUS_H // 2 + 12), radius=2, fill=ink)
    d.rounded_rectangle((SCREEN_W - 110, STATUS_H // 2 - 12, SCREEN_W - 60, STATUS_H // 2 + 12), radius=6, outline=ink, width=3)
    d.rounded_rectangle((SCREEN_W - 105, STATUS_H // 2 - 7, SCREEN_W - 72, STATUS_H // 2 + 7), radius=3, fill=ink)
    d.rounded_rectangle((SCREEN_W - 57, STATUS_H // 2 - 5, SCREEN_W - 53, STATUS_H // 2 + 5), radius=2, fill=ink)
    # Dynamic Island
    d.rounded_rectangle((SCREEN_W // 2 - 125, 22, SCREEN_W // 2 + 125, 22 + 62), radius=31, fill=(10, 10, 12))

    fw, fh = SCREEN_W + 2 * BEZEL, screen_h + 2 * BEZEL
    W, H = fw + 2 * PAD, fh + 2 * PAD
    canvas = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    # shadow
    shadow = Image.new("L", (W, H), 0)
    ImageDraw.Draw(shadow).rounded_rectangle((PAD + 10, PAD + 34, PAD + fw - 10, PAD + fh + 20), radius=R_OUT, fill=95)
    shadow = shadow.filter(ImageFilter.GaussianBlur(34))
    canvas.paste(Image.new("RGBA", (W, H), (16, 36, 30, 255)), (0, 0), shadow)
    # body + side buttons
    body = ImageDraw.Draw(canvas)
    btn = (38, 42, 44, 255)
    body.rounded_rectangle((PAD - 7, PAD + 330, PAD + 4, PAD + 420), radius=4, fill=btn)
    body.rounded_rectangle((PAD - 7, PAD + 460, PAD + 4, PAD + 610), radius=4, fill=btn)
    body.rounded_rectangle((PAD + fw - 4, PAD + 420, PAD + fw + 7, PAD + 620), radius=4, fill=btn)
    body.rounded_rectangle((PAD, PAD, PAD + fw, PAD + fh), radius=R_OUT, fill=(28, 30, 32, 255))
    body.rounded_rectangle((PAD + 4, PAD + 4, PAD + fw - 4, PAD + fh - 4), radius=R_OUT - 4, outline=(70, 74, 78, 255), width=3)
    # screen
    mask = Image.new("L", (SCREEN_W, screen_h), 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, SCREEN_W - 1, screen_h - 1), radius=R_IN, fill=255)
    canvas.paste(screen, (PAD + BEZEL, PAD + BEZEL), mask)
    out = f"{A}/telefon_{name}.png"
    canvas.save(out)
    print(out, canvas.size, "phone box", (PAD, PAD, fw, fh))
