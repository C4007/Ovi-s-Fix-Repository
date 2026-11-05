"""Ovi's Fix — draws the HD homepage background: images/hero-bg-hd.webp (dark theme) and images/hero-bg-hd-light.webp (light theme), 3200 x 1356.
A dark circuit-board scene: a glowing processor with gold and blue traces running out of it.
The left side stays calm and dark so the hero text is easy to read.
Needs:  pip install pillow numpy      Run:  python3 scripts/make-hero-bg.py
"""
import os
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

W, H, SS = 3200, 1356, 2            # final size and supersampling for smooth lines
IMG = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "images")
OUT = os.path.join(IMG, "hero-bg-hd.webp")
OUT_LIGHT = os.path.join(IMG, "hero-bg-hd-light.webp")
rng = np.random.default_rng(11)
CX, CY = 2330, 690                  # the chip sits on the right, text lives on the left
GOLD, BLUE, SOFT = (255, 188, 82), (86, 140, 255), (255, 232, 196)

# ---------- 1. base: deep black-navy with warm and cool light pools
yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
base = np.zeros((H, W, 3), np.float32)
base[:] = (6, 8, 13)
base += (xx[..., None] / W) * np.array([4, 5, 9], np.float32)
def pool(cx, cy, rx, ry, color, strength):
    d = ((xx - cx) / rx) ** 2 + ((yy - cy) / ry) ** 2
    return np.exp(-d * 2.2)[..., None] * np.array(color, np.float32) * strength
base += pool(CX + 80, -120, 900, 520, (255, 190, 90), 0.20)      # warm light from above (like a studio spotlight)
base += pool(CX - 120, CY + 60, 1100, 640, (40, 90, 220), 0.17)  # cool glow around the chip
base += pool(CX + 700, H + 80, 900, 380, (255, 150, 60), 0.12)

# faint grid on the calm left side, like the old banner
grid = np.zeros((H, W), np.float32)
grid[::72, :] = 1; grid[:, ::72] = 1
fade_left = np.clip(1 - np.abs(xx - 900) / 1100, 0, 1) * np.clip(1 - np.abs(yy - 700) / 800, 0, 1)
base += (grid * fade_left * 5.5)[..., None] * np.array([1.0, 0.9, 0.7], np.float32)

# ---------- 2. traces (drawn at 2x for clean edges)
S = lambda v: int(v * SS)
lines = Image.new("RGBA", (W * SS, H * SS), (0, 0, 0, 0))
d = ImageDraw.Draw(lines)
DIE = 270                            # half-size of the chip footprint

def route(x, y, dx, dy):
    """Manhattan route with 45-degree jogs, leaving the chip in direction (dx, dy)."""
    pts = [(x, y)]
    ax = (dx, dy)
    for _ in range(int(rng.integers(3, 6))):
        L = float(rng.integers(120, 420))
        x, y = x + ax[0] * L, y + ax[1] * L
        pts.append((x, y))
        j = float(rng.integers(60, 220))
        side = rng.choice([-1, 1])
        if ax[0] == 0: x, y = x + side * j, y + ax[1] * j          # jog sideways at 45 degrees
        else: x, y = x + ax[0] * j, y + side * j
        pts.append((x, y))
        if x < -50 or x > W + 50 or y < -50 or y > H + 50: break
    return pts

bundles = []
for (dx, dy) in [(0, -1), (0, 1), (-1, 0), (1, 0)]:
    for _ in range(int(rng.integers(3, 5))):
        n = int(rng.integers(3, 7))
        gap = 20
        along = float(rng.integers(-DIE + 60, DIE - 60 - n * gap))
        color = GOLD if rng.random() < 0.62 else (BLUE if rng.random() < 0.6 else SOFT)
        base_pts = route(0, 0, dx, dy)
        for k in range(n):
            o = along + k * gap
            if dx == 0: ox, oy = o, dy * DIE
            else: ox, oy = dx * DIE, o
            pts = [(CX + ox + px, CY + oy + py) for px, py in base_pts]
            bundles.append((pts, color))

for pts, color in bundles:
    sp = [(S(x), S(y)) for x, y in pts]
    d.line(sp, fill=color + (255,), width=S(3.2), joint="curve")
    for (x, y) in (sp[0], sp[-1]):
        r = S(7)
        d.ellipse([x - r, y - r, x + r, y + r], outline=color + (255,), width=S(2.6), fill=(8, 10, 16, 255))
# extra decorative rings and bus lines around the chip
for r, a in [(360, 120), (470, 70)]:
    d.ellipse([S(CX - r), S(CY - r), S(CX + r), S(CY + r)], outline=GOLD + (a,), width=S(2))
lines = lines.resize((W, H), Image.LANCZOS)

# fade the traces with distance from the chip and toward the left (keeps the text area calm)
la = np.asarray(lines).astype(np.float32) / 255.0
dist = np.sqrt(((xx - CX) / 1500) ** 2 + ((yy - CY) / 900) ** 2)
mask = np.clip(1.15 - dist, 0, 1) ** 1.2 * np.clip((xx - 900) / 900, 0, 1)
la[..., 3] *= mask
core = la[..., :3] * la[..., 3:4]
glows = np.zeros_like(core)
for radius, gain in [(6, 0.9), (18, 0.8), (46, 0.7)]:
    layer = Image.fromarray((np.clip(core, 0, 1) * 255).astype(np.uint8), "RGB").filter(ImageFilter.GaussianBlur(radius))
    glows += np.asarray(layer).astype(np.float32) / 255.0 * gain
light = np.clip(core * 1.0 + glows * 0.9, 0, 1.6) * 255.0

# ---------- 3. the chip: dark glossy package with a glowing gold edge
chip = Image.new("RGBA", (W, H), (0, 0, 0, 0))
cd = ImageDraw.Draw(chip)
cd.rounded_rectangle([CX - DIE, CY - DIE, CX + DIE, CY + DIE], 38, fill=(14, 18, 28, 255), outline=GOLD + (255,), width=5)
cd.rounded_rectangle([CX - DIE + 38, CY - DIE + 38, CX + DIE - 38, CY + DIE - 38], 22, fill=(20, 26, 40, 255), outline=(120, 140, 175, 200), width=3)
cd.rounded_rectangle([CX - 150, CY - 150, CX + 150, CY + 150], 14, fill=(26, 34, 52, 255), outline=BLUE + (255,), width=4)
for i in range(-3, 4):
    cd.line([CX - 100, CY + i * 36, CX + 100, CY + i * 36], fill=BLUE + (150,), width=3)
cd.polygon([(CX - DIE, CY - DIE + 70), (CX - DIE + 70, CY - DIE), (CX - DIE, CY - DIE)], fill=GOLD + (255,))
for i in range(28):  # pin rows
    t = -DIE + 52 + i * ((2 * DIE - 104) / 27)
    for (px, py, w_, h_) in [(CX + t, CY - DIE - 16, 8, 16), (CX + t, CY + DIE, 8, 16), (CX - DIE - 16, CY + t, 16, 8), (CX + DIE, CY + t, 16, 8)]:
        cd.rectangle([px, py, px + w_, py + h_], fill=GOLD + (230,))
chip_np = np.asarray(chip).astype(np.float32)
chip_glow = Image.fromarray(np.asarray(chip.filter(ImageFilter.GaussianBlur(40)))[..., :3], "RGB")
cg = np.asarray(chip_glow).astype(np.float32) * 0.0
edge = Image.new("L", (W, H), 0); ed = ImageDraw.Draw(edge)
ed.rounded_rectangle([CX - DIE, CY - DIE, CX + DIE, CY + DIE], 38, outline=255, width=10)
edge_glow = np.asarray(edge.filter(ImageFilter.GaussianBlur(26))).astype(np.float32)[..., None] / 255.0 * np.array(GOLD, np.float32) * 0.9

# ---------- 4. combine
img = base + light + edge_glow
a = chip_np[..., 3:4] / 255.0
img = img * (1 - a) + chip_np[..., :3] * a
# calm, dark left side for the text
shade = np.clip((xx - 250) / 1350, 0, 1) ** 0.9
img *= (0.42 + 0.58 * shade)[..., None]
# soft vignette + a touch of grain so the dark gradients never band
vig = 1 - 0.38 * np.clip((((xx - W / 2) / (W / 1.5)) ** 2 + ((yy - H / 2) / (H / 1.3)) ** 2), 0, 1)
img *= vig[..., None]
img += rng.normal(0, 1.1, img.shape).astype(np.float32)
Image.fromarray(np.clip(img, 0, 255).astype(np.uint8), "RGB").save(OUT, "WEBP", quality=90, method=6)
print("wrote", os.path.normpath(OUT), os.path.getsize(OUT) // 1024, "KB")


# ---------- 5. light-theme version: pale paper, blue and amber traces, same layout
rng2 = np.random.default_rng(11)
lbase = np.zeros((H, W, 3), np.float32)
lbase[:] = (246, 248, 252)
lbase -= (xx[..., None] / W) * np.array([10, 8, 4], np.float32)
lbase += pool(CX - 120, CY + 60, 1100, 640, (47, 111, 237), 0.10) * -0.0 + 0
lbase -= pool(CX - 100, CY + 40, 1000, 600, (70, 20, 0), 0.0)
tint = pool(CX - 80, CY + 40, 1150, 660, (47, 111, 237), 0.16)          # soft blue wash behind the chip
warm = pool(CX + 80, -140, 900, 500, (255, 170, 60), 0.14)              # warm corner light
lbase = lbase - tint * np.array([0.9, 0.55, 0.0], np.float32) + warm * np.array([0.0, 0.0, -0.4], np.float32) * 0
lbase -= (grid * fade_left * 9.0)[..., None] * np.array([0.5, 0.6, 0.8], np.float32)
LGOLD, LBLUE, LSOFT = (214, 128, 20), (47, 111, 237), (110, 130, 175)
remap = {GOLD: LGOLD, BLUE: LBLUE, SOFT: LSOFT}
lay = Image.new("RGBA", (W * SS, H * SS), (0, 0, 0, 0))
ld = ImageDraw.Draw(lay)
for pts, color in bundles:
    c = remap[color]
    sp = [(S(x), S(y)) for x, y in pts]
    ld.line(sp, fill=c + (255,), width=S(3.0), joint="curve")
    for (x, y) in (sp[0], sp[-1]):
        r = S(7)
        ld.ellipse([x - r, y - r, x + r, y + r], outline=c + (255,), width=S(2.6), fill=(255, 255, 255, 255))
for r, a in [(360, 110), (470, 60)]:
    ld.ellipse([S(CX - r), S(CY - r), S(CX + r), S(CY + r)], outline=LGOLD + (a,), width=S(2))
lay = np.asarray(lay.resize((W, H), Image.LANCZOS)).astype(np.float32) / 255.0
lay[..., 3] *= mask
cov = lay[..., 3:4]
glow_cov = np.asarray(Image.fromarray((cov[..., 0] * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(22))).astype(np.float32)[..., None] / 255.0
limg = lbase * (1 - glow_cov * 0.18) + np.array(LBLUE, np.float32) * glow_cov * 0.18
limg = limg * (1 - cov) + lay[..., :3] * 255.0 * cov
lchip = Image.new("RGBA", (W, H), (0, 0, 0, 0))
lc = ImageDraw.Draw(lchip)
lc.rounded_rectangle([CX - DIE, CY - DIE, CX + DIE, CY + DIE], 38, fill=(255, 255, 255, 255), outline=LGOLD + (255,), width=5)
lc.rounded_rectangle([CX - DIE + 38, CY - DIE + 38, CX + DIE - 38, CY + DIE - 38], 22, fill=(236, 241, 250, 255), outline=(150, 165, 195, 255), width=3)
lc.rounded_rectangle([CX - 150, CY - 150, CX + 150, CY + 150], 14, fill=(255, 255, 255, 255), outline=LBLUE + (255,), width=4)
for i in range(-3, 4):
    lc.line([CX - 100, CY + i * 36, CX + 100, CY + i * 36], fill=LBLUE + (170,), width=3)
lc.polygon([(CX - DIE, CY - DIE + 70), (CX - DIE + 70, CY - DIE), (CX - DIE, CY - DIE)], fill=LGOLD + (255,))
for i in range(28):
    t = -DIE + 52 + i * ((2 * DIE - 104) / 27)
    for (px, py, w_, h_) in [(CX + t, CY - DIE - 16, 8, 16), (CX + t, CY + DIE, 8, 16), (CX - DIE - 16, CY + t, 16, 8), (CX + DIE, CY + t, 16, 8)]:
        lc.rectangle([px, py, px + w_, py + h_], fill=LGOLD + (235,))
shadow = np.asarray(lchip.filter(ImageFilter.GaussianBlur(30)))[..., 3:4].astype(np.float32) / 255.0
limg = limg * (1 - shadow * 0.16)
ca = np.asarray(lchip).astype(np.float32)
limg = limg * (1 - ca[..., 3:4] / 255.0) + ca[..., :3] * (ca[..., 3:4] / 255.0)
limg += rng2.normal(0, 0.9, limg.shape).astype(np.float32)
Image.fromarray(np.clip(limg, 0, 255).astype(np.uint8), "RGB").save(OUT_LIGHT, "WEBP", quality=90, method=6)
print("wrote", os.path.normpath(OUT_LIGHT), os.path.getsize(OUT_LIGHT) // 1024, "KB")
