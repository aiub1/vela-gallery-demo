"""Gera as fotos de exemplo do demo: paisagens procedurais, sem pessoas e sem
direitos de terceiros. Uma atmosfera por sessão. Saída em public/demo/photos/
(thumb 480 px, web 1600 px, WebP) e lib/demo/seed.json.

    python3 scripts/generate-photos.py
"""
import json, math, os, random
import numpy as np
from PIL import Image, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "public", "demo", "photos")
os.makedirs(OUT, exist_ok=True)

SESSIONS = [
    # id, nome, quantidade, céu (topo, horizonte), sol, montanhas (perto, longe), extra
    ("i", "Sessão I", 16, ((40, 52, 110), (250, 170, 140)), (255, 226, 190), ((44, 30, 58), (150, 110, 140)), "dawn"),
    ("ii", "Sessão II", 14, ((60, 130, 210), (190, 225, 245)), (255, 252, 235), ((30, 70, 60), (120, 160, 175)), "day"),
    ("iii", "Sessão III", 15, ((70, 40, 100), (255, 140, 70)), (255, 200, 120), ((35, 20, 35), (140, 70, 80)), "dusk"),
    ("iv", "Sessão IV", 12, ((5, 8, 25), (25, 40, 80)), (235, 235, 220), ((5, 8, 15), (30, 40, 65)), "night"),
    ("v", "Sessão V", 13, ((6, 18, 30), (20, 70, 80)), (220, 255, 240), ((4, 12, 16), (25, 60, 65)), "aurora"),
]
SHAPES = [(1600, 1067), (1067, 1600), (1600, 1200), (1600, 1067), (1200, 1600), (1600, 900)]


def ridge(w, base, amp, rng, smooth):
    y = np.cumsum(rng.normal(0, 1, w))
    y = np.convolve(y, np.ones(smooth) / smooth, mode="same")
    y = (y - y.min()) / (np.ptp(y) + 1e-6)
    return base - y * amp


def lerp(a, b, t):
    return np.asarray(a, float) * (1 - t) + np.asarray(b, float) * t


def landscape(w, h, sky, sun, mountains, mood, rng):
    t = np.linspace(0, 1, h)[:, None, None] ** 1.3
    img = np.broadcast_to(lerp(sky[0], sky[1], t), (h, w, 3)).copy()
    yy, xx = np.mgrid[0:h, 0:w]

    if mood in ("night", "aurora"):
        n = int(w * h / 900)
        sx, sy = rng.integers(0, w, n), rng.integers(0, int(h * 0.65), n)
        img[sy, sx] = np.clip(img[sy, sx] + rng.uniform(80, 230, (n, 1)), 0, 255)
    if mood == "aurora":
        for _ in range(3):
            cx = rng.uniform(0.1, 0.9) * w
            band = np.exp(-((yy - (h * rng.uniform(0.18, 0.4) + 60 * np.sin(xx / rng.uniform(90, 200)))) ** 2) / (2 * rng.uniform(30, 70) ** 2))
            band *= np.exp(-((xx - cx) ** 2) / (2 * (w * 0.35) ** 2))
            img += band[..., None] * np.array([40, 230, 150]) * rng.uniform(0.5, 0.9)

    # sol ou lua
    cx, cy = rng.uniform(0.2, 0.8) * w, rng.uniform(0.25, 0.55) * h
    r = min(w, h) * rng.uniform(0.04, 0.08)
    d = np.sqrt((xx - cx) ** 2 + (yy - cy) ** 2)
    glow = np.exp(-(d / (r * 5)) ** 2) * (0.35 if mood in ("night", "aurora") else 0.6)
    img = lerp(img, np.broadcast_to(np.asarray(sun, float), img.shape), glow[..., None])
    img[d < r] = sun

    # cordilheiras, da mais distante para a mais próxima
    layers = rng.integers(3, 6)
    for i in range(layers):
        k = i / (layers - 1)
        base = h * (0.55 + 0.32 * k) + rng.uniform(-0.03, 0.03) * h
        y = ridge(w, base, h * rng.uniform(0.12, 0.3) * (1 - 0.4 * k), rng, rng.integers(25, 90))
        color = lerp(mountains[1], mountains[0], k)
        mask = yy >= y[None, :]
        haze = (1 - k) * 0.35
        shaded = lerp(color, sky[1], haze) * (1 - 0.15 * ((yy - y[None, :]) / h).clip(0, 1))[..., None]
        img = np.where(mask[..., None], shaded, img)

    # névoa baixa e grão de filme
    fog = np.exp(-((yy - h * 0.72) / (h * 0.12)) ** 2) * (0.18 if mood != "night" else 0.08)
    img = lerp(img, np.broadcast_to(np.asarray(sky[1], float), img.shape), fog[..., None])
    img += rng.normal(0, 4.5, img.shape)
    vign = 1 - 0.28 * (((xx - w / 2) / (w / 2)) ** 2 + ((yy - h / 2) / (h / 2)) ** 2) / 2
    img *= vign[..., None]
    return Image.fromarray(np.clip(img, 0, 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.6))


def main():
    rng = np.random.default_rng(2026)
    seed = {"sessions": [], "photos": []}
    n = 0
    for sid, name, count, sky, sun, mountains, mood in SESSIONS:
        seed["sessions"].append({"id": sid, "name": name})
        for j in range(count):
            w, h = SHAPES[(n + j) % len(SHAPES)]
            # variação de cor por foto
            jitter = lambda c: tuple(int(np.clip(v + rng.integers(-18, 18), 0, 255)) for v in c)
            img = landscape(w, h, (jitter(sky[0]), jitter(sky[1])), sun, mountains, mood, rng)
            pid = f"{sid}-{j + 1:02d}"
            img.save(os.path.join(OUT, f"{pid}-web.webp"), quality=78, method=6)
            thumb = img.copy()
            thumb.thumbnail((480, 480))
            thumb.save(os.path.join(OUT, f"{pid}-thumb.webp"), quality=72, method=6)
            seed["photos"].append({"id": pid, "sessionId": sid, "width": w, "height": h})
            n += 1
    with open(os.path.join(ROOT, "lib", "demo", "seed.json"), "w") as fh:
        json.dump(seed, fh, ensure_ascii=False, indent=1)
    print(n, "fotos")


if __name__ == "__main__":
    main()
