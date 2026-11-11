#!/usr/bin/env python3
"""Modelo 1 — cópia literal vetorizada do símbolo (raster -> SVG).
Uso: python3 trace_literal.py entrada.webp saida.svg [work_dir]
Passos: fundo kraft removido -> upscale 2x -> K-means em Lab (paleta enxuta)
-> suavização por votos -> vtracer (camadas empilhadas, curvas bézier)."""
import sys, os, re
import numpy as np, cv2, vtracer
from PIL import Image

src, dst = sys.argv[1], sys.argv[2]
work = sys.argv[3] if len(sys.argv) > 3 else os.path.dirname(os.path.abspath(dst))
K = int(os.environ.get("K", 16))
S = 2  # fator de upscale

im = np.array(Image.open(src).convert("RGB"))
h, w = im.shape[:2]
big = cv2.resize(im, (w * S, h * S), interpolation=cv2.INTER_LANCZOS4)
big = cv2.bilateralFilter(big, 9, 28, 7)           # tira ruído de compressão, preserva bordas
H, W = big.shape[:2]

# --- máscara do selo: o que NÃO é fundo kraft ligado às bordas da imagem ---
lab = cv2.cvtColor(big, cv2.COLOR_RGB2LAB).astype(np.float32)
corner = np.concatenate([lab[:40, :40].reshape(-1, 3), lab[:40, -40:].reshape(-1, 3),
                         lab[-40:, :40].reshape(-1, 3), lab[-40:, -40:].reshape(-1, 3)])
kraft = np.median(corner, 0)
dist = np.linalg.norm(lab - kraft, axis=2)
cand = (dist < float(os.environ.get("BGTHR", 34))).astype(np.uint8)
n, cc = cv2.connectedComponents(cand)
bg = np.zeros_like(cand)
for lbl in set(cc[0, :]) | set(cc[-1, :]) | set(cc[:, 0]) | set(cc[:, -1]):
    if lbl: bg |= (cc == lbl).astype(np.uint8)
badge = 1 - bg
# maior componente + preencher buracos + suavizar contorno
n, cc, st, _ = cv2.connectedComponentsWithStats(badge)
badge = (cc == 1 + np.argmax(st[1:, cv2.CC_STAT_AREA])).astype(np.uint8)
cnts, _ = cv2.findContours(badge, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
badge = np.zeros_like(badge); cv2.drawContours(badge, cnts, -1, 1, -1)
badge = cv2.morphologyEx(badge, cv2.MORPH_OPEN, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (9, 9)))
badge = cv2.GaussianBlur(badge.astype(np.float32), (0, 0), 2.0) > 0.5

# --- opcional: apaga o texto do anel superior (será refeito em curvas por finalize_literal.py) ---
if os.environ.get("ERASE_TOP"):
    yy, xx = np.mgrid[0:H, 0:W]
    rr = np.hypot(xx - 2 * 511.6, yy - 2 * 490.4) / 2
    ang = np.degrees(np.arctan2(yy - 2 * 490.4, xx - 2 * 511.6))
    sector = (rr > 343) & (rr < 404) & (ang > -160) & (ang < -19.5)
    big[sector] = np.array([244, 233, 183], np.uint8)
    lab = cv2.cvtColor(big, cv2.COLOR_RGB2LAB).astype(np.float32)

# --- paleta ---
pix = lab[badge]
rng = np.random.default_rng(1)
sub = pix[rng.choice(len(pix), min(120000, len(pix)), replace=False)]
cv2.setRNGSeed(3)
_, _, centers = cv2.kmeans(sub, K, None, (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 60, 0.1), 4, cv2.KMEANS_PP_CENTERS)
d = np.stack([np.linalg.norm(lab - c, axis=2) for c in centers], 0)
label = np.argmin(d, 0)
# suavização por votos (bordas limpas, sem serrilhado nem manchas)
votes = np.stack([cv2.GaussianBlur((label == i).astype(np.float32), (0, 0), 1.6) for i in range(K)], 0)
label = np.argmax(votes, 0)
pal = cv2.cvtColor(centers.astype(np.uint8).reshape(1, -1, 3), cv2.COLOR_LAB2RGB).reshape(-1, 3)
q = pal[label]
MAG = np.array([255, 0, 255], np.uint8)
q[~badge] = MAG
Image.fromarray(q).save(os.path.join(work, "quantized.png"))

vtracer.convert_image_to_svg_py(
    os.path.join(work, "quantized.png"), dst,
    colormode="color", hierarchical="stacked", mode="spline",
    filter_speckle=int(os.environ.get("SPECKLE", 6)), color_precision=8, layer_difference=4,
    corner_threshold=60, length_threshold=4.0, max_iterations=10, splice_threshold=45, path_precision=2)

# --- pós-processo: troca a camada de fundo pelo contorno exato do selo ---
s = open(dst).read()
paths = re.findall(r'<path[^>]*/>', s)
def fill_of(p): return re.search(r'fill="(#[0-9A-Fa-f]{6})"', p).group(1)
def is_mag(hexc):
    r, g, b = int(hexc[1:3], 16), int(hexc[3:5], 16), int(hexc[5:7], 16)
    return r > 230 and g < 40 and b > 230
base, mag = paths[0], paths[1]
assert is_mag(fill_of(mag)), "camada magenta não encontrada"
d_mag = re.search(r' d="([^"]*)"', mag).group(1)
hole = d_mag.split("Z", 1)[1].strip()          # 2º subcaminho = contorno do selo
head = s[:s.index("<path")]
body = ['<path id="fundo-creme" d="%s" fill="%s"/>' % (hole, fill_of(base))]
# encaixa cada cor na paleta exata (vtracer faz médias)
palhex = ["#%02x%02x%02x" % tuple(c) for c in pal]
palarr = np.array([[int(h[i:i+2], 16) for i in (1, 3, 5)] for h in palhex])
def snap(hexc):
    v = np.array([int(hexc[i:i+2], 16) for i in (1, 3, 5)])
    return palhex[int(np.argmin(((palarr - v) ** 2).sum(1)))]
for p in paths[2:]:
    c = fill_of(p)
    if is_mag(c): continue
    body.append(p.replace(c, snap(c)).replace(' transform="translate(0,0)"', ''))
open(dst, "w").write(head.replace('width="%d" height="%d"' % (W, H), 'width="%d" height="%d" viewBox="0 0 %d %d"' % (W // S, H // S, W, H))
                     + "\n".join(body) + "\n</svg>\n")
print("paleta:", palhex)
print("paths:", len(body))
