#!/usr/bin/env python3
"""Gera o logo circular "Produtos do Sítio" (40 mm) em vetor.

Saídas (em logo/):
  produtos-do-sitio-cmyk.pdf  -> vetor, cores 100% CMYK, texto em curvas (uso em gráfica)
  produtos-do-sitio.svg       -> vetor, mesma arte (SVG só aceita RGB; cores aproximadas)

Todo texto é convertido em curvas: não depende de fontes instaladas.
Unidade interna: 1 un = 0,1 mm  (logo = 400 x 400 un = 40 x 40 mm), origem no centro.

Para definir o endereço depois, basta preencher ADDRESS abaixo e rodar de novo.
"""
import math, os
from fontTools.ttLib import TTFont
from fontTools.pens.basePen import BasePen
from fontTools.pens.transformPen import TransformPen
from reportlab.pdfgen import canvas
from reportlab.lib.colors import CMYKColor

OUT = os.path.dirname(os.path.abspath(__file__))
ADDRESS = ""            # ex.: "Rod. AM-352, km 22 · Vila Vale"  (vazio = sem endereço)

# ---- Paleta CMYK terrosa (0..1) e aproximação RGB só para o SVG/preview ----
PAL = {
    "brown":  (0.45, 0.65, 0.85, 0.50),   # marrom-café (texto e anel)
    "terra":  (0.10, 0.75, 0.90, 0.12),   # terracota (caju, detalhes)
    "mustard":(0.05, 0.35, 0.95, 0.00),   # mostarda (sol)
    "olive":  (0.50, 0.38, 1.00, 0.42),   # oliva escuro
    "olivel": (0.30, 0.22, 0.85, 0.20),   # oliva claro
    "sand":   (0.07, 0.18, 0.42, 0.00),   # areia (sulcos)
    "cream":  (0.03, 0.05, 0.20, 0.00),   # creme (fundo)
}
def rgb_hex(c):
    C, M, Y, K = c
    f = lambda v: round(255 * (1 - v) * (1 - K))
    return "#%02x%02x%02x" % (f(C), f(M), f(Y))

# ---- Fontes (viram curvas) ----
FD = "/usr/share/fonts/truetype/crosextra/"
RING_FONT = FD + "Caladea-Bold.ttf"
TITLE_FONT = FD + "Caladea-Bold.ttf"
TITLE_IT = FD + "Caladea-BoldItalic.ttf"
SMALL_FONT = FD + "Caladea-Regular.ttf"

class RecPen(BasePen):
    def __init__(self, gs):
        super().__init__(gs); self.ops = []
    def _moveTo(self, p): self.ops.append(("M", p))
    def _lineTo(self, p): self.ops.append(("L", p))
    def _curveToOne(self, a, b, c): self.ops.append(("C", a, b, c))
    def _closePath(self): self.ops.append(("Z",))
    def _endPath(self): self.ops.append(("Z",))

class Font:
    def __init__(self, path):
        self.f = TTFont(path); self.gs = self.f.getGlyphSet()
        self.cmap = self.f.getBestCmap(); self.upm = self.f["head"].unitsPerEm
    def adv(self, ch, size): return self.gs[self.cmap[ord(ch)]].width * size / self.upm
    def glyph(self, ch, size, tf):
        """tf(x,y)->(x',y') em unidades do logo; x,y já em un (escala aplicada)."""
        rec = RecPen(self.gs); s = size / self.upm
        pen = TransformPen(rec, (s, 0, 0, s, 0, 0))
        self.gs[self.cmap[ord(ch)]].draw(pen)
        out = []
        for op in rec.ops:
            out.append((op[0],) + tuple(tf(*p) for p in op[1:]))
        return out

shapes = []   # (ops, color)  preenchimentos
def fill(ops, color): shapes.append(("fill", ops, color))
def stroke(ops, color, w, cap="round"): shapes.append(("stroke", ops, color, w, cap))

def circle_ops(cx, cy, r):
    k = 0.5522847498 * r
    return [("M", (cx + r, cy)), ("C", (cx + r, cy + k), (cx + k, cy + r), (cx, cy + r)),
            ("C", (cx - k, cy + r), (cx - r, cy + k), (cx - r, cy)),
            ("C", (cx - r, cy - k), (cx - k, cy - r), (cx, cy - r)),
            ("C", (cx + k, cy - r), (cx + r, cy - k), (cx + r, cy)), ("Z",)]

def rot(a):  # a em rad
    return math.cos(a), math.sin(a)

# ---- Texto reto, centralizado em x, baseline y ----
def text_line(font, s, size, cx, y, color, tracking=0.0):
    w = sum(font.adv(c, size) for c in s) + tracking * (len(s) - 1)
    x = cx - w / 2
    for c in s:
        if c != " ":
            fill(font.glyph(c, size, lambda px, py, x=x: (px + x, py + y)), color)
        x += font.adv(c, size) + tracking

# ---- Texto em arco ----
def text_arc(font, s, size, R, center_deg, top, tracking, colors=None):
    """top=True: lê no sentido horário pelo topo (letras para fora);
    top=False: lê da esquerda p/ direita pela base (letras para dentro)."""
    advs = [font.adv(c, size) + tracking for c in s]
    total = sum(advs) - tracking
    s0 = -total / 2
    for c, a in zip(s, advs):
        mid = s0 + (a - tracking) / 2      # centro do glifo ao longo do arco
        s0 += a
        if c == " ":
            continue
        ang = mid / R                        # rad desde o centro do texto
        th = math.radians(center_deg) + (-ang if top else ang)
        rotation = th - math.pi / 2 if top else th + math.pi / 2
        cs, sn = math.cos(rotation), math.sin(rotation)
        px, py = R * math.cos(th), R * math.sin(th)
        h = font.adv(c, size) / 2
        def tf(x, y, cs=cs, sn=sn, px=px, py=py, h=h):
            x -= h
            return (px + x * cs - y * sn, py + x * sn + y * cs)
        col = (colors or {}).get(c, "brown")
        fill(font.glyph(c, size, tf), col)

ring = Font(RING_FONT); title = Font(TITLE_FONT); title_it = Font(TITLE_IT); small = Font(SMALL_FONT)

def polyline(pts, close=False):
    ops = [("M", pts[0])] + [("L", p) for p in pts[1:]]
    return ops + ([("Z",)] if close else [])

# 1) Fundo creme + anéis
fill(circle_ops(0, 0, 200), "cream")
stroke(circle_ops(0, 0, 197.5), "brown", 5)
stroke(circle_ops(0, 0, 189), "terra", 1.6)
stroke(circle_ops(0, 0, 153), "terra", 1.6)

# 2) Texto do anel (serifado)
SZ = 21
text_arc(ring, "PROJETO MISSIONÁRIO RENOVO", SZ, 164.5, 90, True, 3.0)
text_arc(ring, "EDUCAÇÃO · TRABALHO · RENDA", SZ, 178.5, 270, False, 3.0, colors={"·": "terra"})
for deg in (0, 180):
    x, y = 171 * math.cos(math.radians(deg)), 171 * math.sin(math.radians(deg))
    fill(circle_ops(x, y, 3.6), "mustard")

# 3) Sol
SX, SY, SR = 0, 120, 12
for i in range(16):
    a = math.radians(i * 22.5)
    c, s_ = math.cos(a), math.sin(a)
    r0, r1 = SR + 5, SR + (13 if i % 2 == 0 else 9)
    stroke([("M", (SX + c * r0, SY + s_ * r0)), ("L", (SX + c * r1, SY + s_ * r1))], "mustard", 2.6)
fill(circle_ops(SX, SY, SR), "mustard")

# 4) Nome
text_line(title, "Produtos", 44, 0, 60, "brown", tracking=0.8)
text_line(title_it, "do Sítio", 58, 0, 6, "terra", tracking=0.4)

# 5) Paisagem: colinas, sulcos de plantio, árvores e caju
OFF = 6
X0 = 120
bot = lambda x: -58 - 30 * (1 - (x / X0) ** 2) + OFF
wt = lambda x: max(0.0, 1 - (x / X0) ** 2) ** 0.5
hB = lambda x: -38 + 13 * math.cos((x + 50) * math.pi / 90) + OFF
hF = lambda x: -52 + 14 * math.cos((x - 45) * math.pi / 100) + OFF
topB = lambda x: bot(x) + (hB(x) - bot(x)) * wt(x)
topF = lambda x: bot(x) + (hF(x) - bot(x)) * wt(x)
xs = [-X0 + i * 3 for i in range(int(2 * X0 / 3) + 1)]
def silhouette(top):
    return polyline([(x, top(x)) for x in xs] + [(x, bot(x)) for x in reversed(xs)], True)
fill(silhouette(topB), "olivel")
fill(silhouette(topF), "olive")
for k in (1, 2, 3):                       # sulcos (linhas de plantio) na colina da frente
    run = []
    for x in xs:
        y = topF(x) - 7.5 * k
        if y > bot(x) + 5 and abs(x) < X0 - 6 and topF(x) > topB(x) - 1:
            run.append((x, y))
        elif len(run) > 3:
            stroke(polyline(run), "sand", 2.0); run = []
        else:
            run = []
    if len(run) > 3: stroke(polyline(run), "sand", 2.0)

def tree(x, top, s):
    y0 = top(x) - 1.5
    fill([("M", (x - 1.2 * s, y0)), ("L", (x + 1.2 * s, y0)), ("L", (x + 1.0 * s, y0 + 7 * s)), ("L", (x - 1.0 * s, y0 + 7 * s)), ("Z",)], "brown")
    fill(circle_ops(x, y0 + 11 * s, 6.5 * s), "olive" if top is topB else "olivel")
    fill(circle_ops(x - 3.2 * s, y0 + 9.5 * s, 4.2 * s), "olive" if top is topB else "olivel")
    fill(circle_ops(x + 3.2 * s, y0 + 9.5 * s, 4.2 * s), "olive" if top is topB else "olivel")
tree(-72, topB, 1.25)
tree(-93, topB, 0.85)
tree(78, topF, 1.1)
tree(98, topF, 0.8)

def caju(cx, base, s):
    def T(p): return (cx + p[0] * s, base + p[1] * s)
    def poly(ops): return [(o[0],) + tuple(T(p) for p in o[1:]) for o in ops]
    fruit = [("M", (0, 5.5)), ("C", (7, 5.5), (10, 11), (9, 16)), ("C", (8.5, 20), (6, 23), (5, 27)),
             ("L", (-5, 27)), ("C", (-6, 23), (-8.5, 20), (-9, 16)), ("C", (-10, 11), (-7, 5.5), (0, 5.5)), ("Z",)]
    nut = [("M", (-4, 6.5)), ("C", (-5, 0), (1, -3), (7, -1.5)), ("C", (11, -0.5), (11, 3.5), (8, 4)),
           ("C", (5, 4.5), (3, 4.2), (0, 6.5)), ("Z",)]
    leaf = [("M", (0, 27)), ("C", (2, 33), (8, 34), (11, 32)), ("C", (8, 28), (4, 26), (0, 27)), ("Z",)]
    fill(poly(nut), "brown"); fill(poly(fruit), "terra")
    fill(poly([("M", (-3.5, 11)), ("C", (-4, 15), (-3, 19), (-2, 21)), ("C", (-1.6, 18), (-2, 14), (-3.5, 11)), ("Z",)]), "mustard")
    fill(poly(leaf), "olive")
caju(-4, topB(-4) - 3.5, 1.0)

# 6) Endereço (opcional) e "Desde 2020"
if ADDRESS:
    text_line(small, ADDRESS, 12, 0, -97, "brown", tracking=0.3)
text_line(ring, "DESDE 2020", 17, 0, -121 if ADDRESS else -112, "brown", tracking=3.0)
yl = (-121 if ADDRESS else -112) + 6
for sgn in (-1, 1):
    stroke([("M", (sgn * 62, yl)), ("L", (sgn * 86, yl))], "terra", 1.6)

# ================= Saída =================
def svg_d(ops):
    d = []
    for op in ops:
        if op[0] == "Z": d.append("Z")
        else:
            pts = " ".join("%.2f %.2f" % (p[0], -p[1]) for p in op[1:])
            d.append(op[0] + pts)
    return "".join(d)

svg = ['<svg xmlns="http://www.w3.org/2000/svg" viewBox="-200 -200 400 400" width="40mm" height="40mm">',
       "<title>Produtos do Sítio</title>"]
for sh in shapes:
    if sh[0] == "fill":
        svg.append('<path fill="%s" d="%s"/>' % (rgb_hex(PAL[sh[2]]), svg_d(sh[1])))
    else:
        svg.append('<path fill="none" stroke="%s" stroke-width="%s" stroke-linecap="%s" d="%s"/>'
                   % (rgb_hex(PAL[sh[2]]), sh[3], sh[4], svg_d(sh[1])))
svg.append("</svg>")
open(os.path.join(OUT, "produtos-do-sitio.svg"), "w").write("\n".join(svg))

MM = 72 / 25.4
c = canvas.Canvas(os.path.join(OUT, "produtos-do-sitio-cmyk.pdf"), pagesize=(40 * MM, 40 * MM))
c.setTitle("Produtos do Sítio — logo"); c.setAuthor("Projeto Missionário Renovo")
c.translate(20 * MM, 20 * MM); c.scale(MM / 10, MM / 10)
for sh in shapes:
    col = CMYKColor(*PAL[sh[2]])
    p = c.beginPath()
    for op in sh[1]:
        if op[0] == "M": p.moveTo(*op[1])
        elif op[0] == "L": p.lineTo(*op[1])
        elif op[0] == "C": p.curveTo(*op[1], *op[2], *op[3])
        else: p.close()
    if sh[0] == "fill":
        c.setFillColor(col); c.drawPath(p, fill=1, stroke=0, fillMode=1)
    else:
        c.setStrokeColor(col); c.setLineWidth(sh[3]); c.setLineCap(1); c.setLineJoin(1)
        c.drawPath(p, fill=0, stroke=1)
c.showPage(); c.save()
print("ok")
