import sys
from PIL import Image, ImageDraw, ImageFilter
S = 1024; SS = 3
out = sys.argv[1]
H = [0.52, 0.34, 0.20, 0.34, 0.52]
def gradient(c1, c2, size):
    g = Image.new('RGB', (size, size)); px = g.load()
    for y in range(size):
        for x in range(size):
            t = (x + y) / (2 * size - 2); px[x, y] = tuple(int(c1[i] + (c2[i] - c1[i]) * t) for i in range(3))
    return g
def bars(draw, size, fill):
    bw, gap = size * 0.092, size * 0.056; total = 5 * bw + 4 * gap; x0 = (size - total) / 2
    for i, h in enumerate(H):
        hh = size * h; x = x0 + i * (bw + gap); cy = size * 0.5
        draw.rounded_rectangle([x, cy - hh / 2, x + bw, cy + hh / 2], radius=bw / 2, fill=fill)
    d = size * 0.075; cx = x0 + 2 * (bw + gap) + bw / 2; cy = size * 0.5 - size * H[2] / 2 - size * 0.075
    draw.ellipse([cx - d / 2, cy - d / 2, cx + d / 2, cy + d / 2], fill=fill)
def make(name, c1, c2, fg, tinted=False):
    n = S * SS
    base = gradient(c1, c2, n // 4).resize((n, n), Image.BICUBIC) if not tinted else Image.new('RGB', (n, n), (0, 0, 0))
    layer = Image.new('RGBA', (n, n), (0, 0, 0, 0)); bars(ImageDraw.Draw(layer), n, fg)
    shadow = layer.filter(ImageFilter.GaussianBlur(n * 0.012)); sh = Image.new('RGBA', (n, n), (0, 0, 0, 0)); sh.putalpha(shadow.split()[3].point(lambda v: int(v * 0.35)))
    img = base.convert('RGBA'); img.alpha_composite(sh, (0, int(n * 0.008))); img.alpha_composite(layer)
    img.convert('RGB').resize((S, S), Image.LANCZOS).save(f'{out}/{name}.png')
make('icon-light', (255, 70, 96), (150, 40, 220), (255, 255, 255, 255))
make('icon-dark', (60, 18, 40), (28, 14, 70), (255, 92, 118, 255))
make('icon-tinted', (0, 0, 0), (0, 0, 0), (255, 255, 255, 255), tinted=True)
print('icons written')
