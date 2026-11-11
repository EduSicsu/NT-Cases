#!/usr/bin/env python3
"""Modelo 2 — versão EDITÁVEL do símbolo "Produtos do Sítio".

* Textos são texto vivo (<text>/<textPath>) com fontes parecidas com as do símbolo.
* Anéis, sol, raios, arcos, campos e demais elementos são formas vetoriais separadas,
  agrupadas em camadas nomeadas (ids em português) para abrir no Affinity.
* Árvores e fita foram vetorizadas da imagem original (curvas bézier).

Uso: python3 build_editable.py <imagem-original> <saida.svg>
Fontes (instalar antes de abrir o SVG): Lobster, Domine Bold, Roboto Condensed Bold.
"""
import sys, os, re, math, tempfile
import numpy as np, cv2, vtracer
from PIL import Image
from fontTools.ttLib import TTFont

SRC, DST = sys.argv[1], sys.argv[2]
FONTS = os.environ.get("FONTS_DIR", os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "fontes"))

# ------------------------------------------------------------------ paleta
CREAM, CREAM2 = "#f4e9b7", "#f9eec4"
BROWN, BROWN_D = "#40270d", "#301b06"
TERRA, TERRA_D = "#a64722", "#93451f"
MUSTARD = "#bd8a1f"
OLIVE, OLIVE_D = "#7e7140", "#4a3112"
RUST = "#9e4a24"

# ------------------------------------------------------------------ geometria medida na imagem (1024 x 1024)
CX, CY = 511.6, 490.4
R_OUT_BROWN, W_OUT_BROWN = 434.0, 15.0        # anel externo marrom (linha central / espessura)
R_THIN, W_THIN = 413.8, 5.8                   # filete terracota externo
IN_C, R_IN, W_IN = (510.8, 487.0), 322.4, 7.6 # filete terracota interno
R_SIDE, W_SIDE = 366.5, 7.0                   # arcos mostarda laterais
SUN_C, SUN_R = (513.0, 370.0), 121.5
RAY_IN, RAY_W = 133.0, 8.5
RAY_L = [58, 59, 65, 75, 90, 110, 136]        # comprimento dos raios do centro (k=0) até a horizontal (k=6)
RAY_STEP = 13.8

# ------------------------------------------------------------------ utilidades de fonte
def load_font(fn):
    f = TTFont(os.path.join(FONTS, fn)); return f
def adv_width(font, s, size, ls=0.0):
    cmap = font.getBestCmap(); hm = font["hmtx"]; upm = font["head"].unitsPerEm
    return sum(hm[cmap[ord(c)]][0] for c in s) * size / upm + ls * (len(s) - 1)
def cap_ratio(font):
    return font["OS/2"].sCapHeight / font["head"].unitsPerEm

domine = load_font("Domine-Bold.ttf")
lobster = load_font("Lobster-Regular.ttf")
rcond = load_font("RobotoCondensed-Bold.ttf")

# ------------------------------------------------------------------ vetorização de máscaras (árvores, fita)
src = np.array(Image.open(SRC).convert("RGB")).astype(int)
Rr, Gg, Bb = src[..., 0], src[..., 1], src[..., 2]
dark = (Rr + Gg + Bb) < 215

def trace_mask(mask, box, scale=4):
    """Máscara booleana (coords da imagem) -> 'd' de caminho bézier (coords da imagem)."""
    x0, y0, x1, y1 = box
    m = mask[y0:y1, x0:x1].astype(np.float32)
    m = cv2.resize(m, None, fx=scale, fy=scale, interpolation=cv2.INTER_CUBIC)
    m = cv2.GaussianBlur(m, (0, 0), scale * 0.45) > 0.5
    img = np.where(m, 0, 255).astype(np.uint8)
    tmp = tempfile.mkdtemp()
    pi, po = os.path.join(tmp, "m.png"), os.path.join(tmp, "m.svg")
    Image.fromarray(img).save(pi)
    vtracer.convert_image_to_svg_py(pi, po, colormode="binary", mode="spline", filter_speckle=8,
                                    corner_threshold=60, length_threshold=4.0, splice_threshold=45, path_precision=2)
    s = open(po).read()
    out = []
    for p in re.findall(r"<path[^>]*/>", s):
        d = re.search(r' d="([^"]*)"', p).group(1)
        tr = re.search(r"translate\(([-\d.]+),([-\d.]+)\)", p)
        tx, ty = (float(tr.group(1)), float(tr.group(2))) if tr else (0.0, 0.0)
        def conv(mo):
            return "%.1f %.1f" % ((float(mo.group(1)) + tx) / scale + x0, (float(mo.group(2)) + ty) / scale + y0)
        out.append(re.sub(r"(-?\d+\.?\d*) (-?\d+\.?\d*)", conv, d))
    return " ".join(out)

def fill_holes(m, max_area=4000):
    """Preenche só buracos pequenos (ex.: letras de "DESDE 2020"); preserva dobras abertas."""
    m8 = m.astype(np.uint8)
    cnts, hier = cv2.findContours(m8, cv2.RETR_CCOMP, cv2.CHAIN_APPROX_SIMPLE)
    for c, h in zip(cnts, hier[0]):
        if h[3] != -1 and cv2.contourArea(c) < max_area:
            cv2.drawContours(m8, [c], -1, 1, -1)
    return m8.astype(bool)

def largest(m, min_area=0):
    n, lab, st, _ = cv2.connectedComponentsWithStats(m.astype(np.uint8))
    keep = np.zeros(m.shape, bool)
    for i in range(1, n):
        if st[i, 4] >= min_area: keep |= lab == i
    return keep

# fita (faixa "DESDE 2020" + abas)
box = (300, 738, 730, 832)
rib = np.zeros(dark.shape, bool); rib[box[1]:box[3], box[0]:box[2]] = dark[box[1]:box[3], box[0]:box[2]]
rib = largest(rib, 600); rib = fill_holes(rib)
D_RIBBON = trace_mask(rib, box)
# árvores
tl = np.zeros(dark.shape, bool); tl[536:604, 212:292] = dark[536:604, 212:292]; tl = largest(tl, 300)
tr_ = np.zeros(dark.shape, bool); tr_[526:622, 738:812] = dark[526:622, 738:812]; tr_ = largest(tr_, 300)
D_TREE_L = trace_mask(tl, (212, 536, 292, 604))
D_TREE_R = trace_mask(tr_, (738, 526, 812, 622))

# ------------------------------------------------------------------ construção do SVG
def circle_path(cx, cy, r):
    return "M%.2f %.2f a%.2f %.2f 0 1 0 %.2f 0 a%.2f %.2f 0 1 0 %.2f 0 Z" % (cx - r, cy, r, r, 2 * r, r, r, -2 * r)

def arc_text_path(cx, cy, r, top):
    """Caminho do texto em arco. top=True: horário pelo topo; top=False: esquerda->direita pela base."""
    if top:   # da esquerda (180°) até a direita (0°) passando por cima, sentido horário
        return "M%.2f %.2f A%.2f %.2f 0 0 1 %.2f %.2f" % (cx - r, cy, r, r, cx + r, cy)
    return "M%.2f %.2f A%.2f %.2f 0 0 0 %.2f %.2f" % (cx - r, cy, r, r, cx + r, cy)

# --- texto do anel: calcula tamanho (pela altura de maiúscula) e espaçamento (pelo arco medido)
CAP = 33.0
RING_SIZE = CAP / cap_ratio(domine)
TOP_TXT = "PROJETO MISSIONÁRIO RENOVO"
BOT_TXT = "EDUCAÇÃO · TRABALHO · RENDA"
R_TOP_BASE = 351.0     # linha de base do texto de cima (letras crescem para fora)
R_BOT_BASE = 389.0     # linha de base do texto de baixo (letras crescem para dentro)
SPAN_TOP, SPAN_BOT = 135.1, 114.7
def fit_ls(txt, base_r, span_deg):
    L = math.radians(span_deg) * base_r
    nat = adv_width(domine, txt, RING_SIZE)
    return (L - nat) / (len(txt) - 1)
LS_TOP, LS_BOT = fit_ls(TOP_TXT, R_TOP_BASE, SPAN_TOP), fit_ls(BOT_TXT, R_BOT_BASE, SPAN_BOT)

def fit_width(font, txt, target_w):
    return target_w / adv_width(font, txt, 1.0)

TITLE1_SIZE = fit_width(lobster, "Produtos", 572)
TITLE2_SIZE = fit_width(lobster, "do Sítio", 514)
ADDR_SIZE = fit_width(rcond, "Rod. AM 352 - KM 25", 363)
ADDR2_SIZE = fit_width(rcond, "Ramal Vale da Benção", 364)

def ray(k, side):
    a = math.radians(-90 + side * k * RAY_STEP)
    r0, r1 = RAY_IN, RAY_IN + RAY_L[k]
    x0, y0 = SUN_C[0] + r0 * math.cos(a), SUN_C[1] + r0 * math.sin(a)
    x1, y1 = SUN_C[0] + r1 * math.cos(a), SUN_C[1] + r1 * math.sin(a)
    return "M%.1f %.1f L%.1f %.1f" % (x0, y0, x1, y1)

def arc_seg(r, a0, a1):
    p0 = (CX + r * math.cos(math.radians(a0)), CY + r * math.sin(math.radians(a0)))
    p1 = (CX + r * math.cos(math.radians(a1)), CY + r * math.sin(math.radians(a1)))
    large = 1 if abs(a1 - a0) > 180 else 0
    sweep = 1 if a1 > a0 else 0
    return "M%.1f %.1f A%.1f %.1f 0 %d %d %.1f %.1f" % (p0[0], p0[1], r, r, large, sweep, p1[0], p1[1])

# --- campos de cultivo (procedural): linhas em "U", metade oliva / metade terracota
def furrows():
    pitch, A, y0 = 15.0, 84.0, 596.0
    xs = np.linspace(200, 830, 64)
    lines = []
    for k in range(0, 15):
        pts = []
        for x in xs:
            u = (x - 512.0) / 300.0
            pts.append((x, y0 + pitch * k + A * (1 - u * u)))
        lines.append("M" + " L".join("%.1f %.1f" % p for p in pts))
    return lines
FITA_Y = 792.0
F_LINES = furrows()
def top_curve(x0, x1, n=40):
    out = []
    for x in np.linspace(x0, x1, n):
        u = (x - 512.0) / 300.0
        out.append((x, 596.0 + 84.0 * (1 - u * u) - 9))
    return out
def poly(pts): return "M" + " L".join("%.1f %.1f" % p for p in pts) + " Z"
SPLIT = poly(top_curve(190, 478) + [(494, 900), (190, 900)])      # lado esquerdo (oliva)
SPLIT_R = poly(top_curve(478, 835) + [(835, 900), (494, 900)])    # lado direito (terracota)

svg = f'''<?xml version="1.0" encoding="UTF-8"?>
<!-- Produtos do Sítio — MODELO 2 (editável). Fontes: Lobster · Domine Bold · Roboto Condensed Bold -->
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="1024" height="1024" viewBox="0 0 1024 1024">
<defs>
  <clipPath id="clip-campos"><circle cx="{IN_C[0]}" cy="{IN_C[1]}" r="{R_IN - 2}"/></clipPath>
  <path id="guia-arco-topo" d="{arc_text_path(CX, CY, R_TOP_BASE, True)}"/>
  <path id="guia-arco-base" d="{arc_text_path(CX, CY, R_BOT_BASE, False)}"/>
  <path id="guia-fita" d="M{512-150:.1f} {FITA_Y - (420-math.sqrt(420**2-150**2)):.1f} A420 420 0 0 0 {512+150:.1f} {FITA_Y - (420-math.sqrt(420**2-150**2)):.1f}"/>
</defs>

<g id="fundo">
  <circle id="fundo-creme" cx="{CX}" cy="{CY}" r="{R_OUT_BROWN}" fill="{CREAM}"/>
</g>

<g id="aneis">
  <circle id="anel-externo-marrom" cx="{CX}" cy="{CY}" r="{R_OUT_BROWN}" fill="none" stroke="{BROWN}" stroke-width="{W_OUT_BROWN}"/>
  <circle id="filete-terracota-externo" cx="{CX}" cy="{CY}" r="{R_THIN}" fill="none" stroke="{TERRA_D}" stroke-width="{W_THIN}"/>
  <circle id="filete-terracota-interno" cx="{IN_C[0]}" cy="{IN_C[1]}" r="{R_IN}" fill="none" stroke="{TERRA_D}" stroke-width="{W_IN}"/>
  <path id="arco-mostarda-esquerdo" d="{arc_seg(R_SIDE, 196.8, 152.3)}" fill="none" stroke="{MUSTARD}" stroke-width="{W_SIDE}" stroke-linecap="round"/>
  <path id="arco-mostarda-direito" d="{arc_seg(R_SIDE, -16.8, 27.7)}" fill="none" stroke="{MUSTARD}" stroke-width="{W_SIDE}" stroke-linecap="round"/>
</g>

<g id="sol">
  <g id="raios" fill="none" stroke="{MUSTARD}" stroke-width="{RAY_W}" stroke-linecap="round">
    {chr(10).join('<path d="%s"/>' % ray(k, s) for k in range(7) for s in ((1,) if k == 0 else (-1, 1)))}
  </g>
  <circle id="sol-disco" cx="{SUN_C[0]}" cy="{SUN_C[1]}" r="{SUN_R}" fill="{MUSTARD}"/>
</g>

<g id="campos" clip-path="url(#clip-campos)">
  <path id="campo-oliva" d="{SPLIT}" fill="{OLIVE}"/>
  <path id="campo-terracota" d="{SPLIT_R}" fill="{RUST}"/>
  <g id="sulcos" fill="none" stroke="{OLIVE_D}" stroke-width="6.5" stroke-linecap="round">
    {chr(10).join('<path d="%s"/>' % d for d in F_LINES)}
  </g>
</g>

<g id="arvores" fill="{BROWN}">
  <path id="arvore-esquerda" d="{D_TREE_L}" fill-rule="evenodd"/>
  <path id="arvore-direita" d="{D_TREE_R}" fill-rule="evenodd"/>
</g>

<g id="fita">
  <path id="fita-marrom" d="{D_RIBBON}" fill="{BROWN}" fill-rule="evenodd"/>
</g>

<g id="textos">
  <g id="texto-anel" font-family="Domine" font-weight="700" font-size="{RING_SIZE:.2f}" fill="{BROWN}">
    <text id="anel-topo" letter-spacing="{LS_TOP:.2f}" text-anchor="middle"><textPath xlink:href="#guia-arco-topo" href="#guia-arco-topo" startOffset="50%">{TOP_TXT}</textPath></text>
    <text id="anel-base" letter-spacing="{LS_BOT:.2f}" text-anchor="middle"><textPath xlink:href="#guia-arco-base" href="#guia-arco-base" startOffset="50%">EDUCAÇÃO <tspan fill="{TERRA}">·</tspan> TRABALHO <tspan fill="{TERRA}">·</tspan> RENDA</textPath></text>
  </g>

  <g id="titulo" font-family="Lobster" text-anchor="middle" word-spacing="-22">
    <g id="titulo-contorno" fill="{CREAM2}" stroke="{CREAM2}" stroke-width="22" stroke-linejoin="round">
      <text x="511" y="503" font-size="{TITLE1_SIZE:.1f}">Produtos</text>
      <text x="511" y="646" font-size="{TITLE2_SIZE:.1f}">do Sítio</text>
    </g>
    <g id="titulo-cor" fill="{TERRA}" stroke="{TERRA}" stroke-width="3.5" stroke-linejoin="round">
      <text id="titulo-linha1" x="511" y="503" font-size="{TITLE1_SIZE:.1f}">Produtos</text>
      <text id="titulo-linha2" x="511" y="646" font-size="{TITLE2_SIZE:.1f}">do Sítio</text>
    </g>
  </g>

  <g id="endereco" font-family="Roboto Condensed" font-weight="700" text-anchor="middle">
    <g id="endereco-contorno" fill="{CREAM2}" stroke="{CREAM2}" stroke-width="9" stroke-linejoin="round">
      <text x="514" y="693" font-size="{ADDR_SIZE:.1f}">Rod. AM 352 - KM 25</text>
      <text x="515" y="737" font-size="{ADDR2_SIZE:.1f}">Ramal Vale da Benção</text>
    </g>
    <g id="endereco-cor" fill="{BROWN}">
      <text id="endereco-linha1" x="514" y="693" font-size="{ADDR_SIZE:.1f}">Rod. AM 352 - KM 25</text>
      <text id="endereco-linha2" x="515" y="737" font-size="{ADDR2_SIZE:.1f}">Ramal Vale da Benção</text>
    </g>
  </g>

  <text id="desde" font-family="Roboto Condensed" font-weight="700" font-size="38" letter-spacing="4" fill="{CREAM2}" text-anchor="middle"><textPath xlink:href="#guia-fita" href="#guia-fita" startOffset="50%">DESDE 2020</textPath></text>
</g>
</svg>
'''
open(DST, "w").write(svg)
print("ok", DST, "| ring size %.1f ls top %.2f bot %.2f | title %.1f/%.1f addr %.1f/%.1f" % (RING_SIZE, LS_TOP, LS_BOT, TITLE1_SIZE, TITLE2_SIZE, ADDR_SIZE, ADDR2_SIZE))
