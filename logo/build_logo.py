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

# ---- Paleta CMYK (0..1) e aproximação RGB só para o SVG/preview ----
PAL = {
    "blue":   (1.00, 0.85, 0.00, 0.10),
    "green":  (0.75, 0.00, 1.00, 0.05),
    "dgreen": (0.85, 0.30, 1.00, 0.20),
    "yellow": (0.00, 0.18, 1.00, 0.00),
}
def rgb_hex(c):
    C, M, Y, K = c
    f = lambda v: round(255 * (1 - v) * (1 - K) * 0.93 + 0)  # aproximação conservadora
    return "#%02x%02x%02x" % (f(C), f(M), f(Y))

# ---- Fontes (viram curvas) ----
RING_FONT = "/usr/share/fonts/truetype/crosextra/Carlito-Bold.ttf"
TITLE_FONT = "/usr/share/fonts/opentype/inter/Inter-ExtraBold.otf"
SMALL_FONT = "/usr/share/fonts/opentype/inter/Inter-SemiBold.otf"

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
        col = (colors or {}).get(c, "blue")
        fill(font.glyph(c, size, tf), col)

ring = Font(RING_FONT); title = Font(TITLE_FONT); small = Font(SMALL_FONT)

# 1) Anel externo (verde) — borda externa em r = 200 (= 40 mm)
RING_W = 6
stroke(circle_ops(0, 0, 200 - RING_W / 2), "green", RING_W)

# 2) Texto do anel
SZ = 25
text_arc(ring, "PROJETO MISSIONÁRIO RENOVO", SZ, 164, 90, True, 3.2)
text_arc(ring, "EDUCAÇÃO • TRABALHO • RENDA".replace("•", "·"), SZ, 183, 270, False, 3.2,
         colors={"·": "green"})
for deg in (0, 180):    # pontos de separação laterais
    x, y = 173.5 * math.cos(math.radians(deg)), 173.5 * math.sin(math.radians(deg))
    fill(circle_ops(x, y, 4.2), "green")

# 3) Sol
SX, SY, SR = 0, 120, 19
fill(circle_ops(SX, SY, SR), "yellow")
for i in range(12):
    a = math.radians(90 + i * 30)
    c, s = math.cos(a), math.sin(a)
    stroke([("M", (SX + c * (SR + 6), SY + s * (SR + 6))), ("L", (SX + c * (SR + 15), SY + s * (SR + 15)))],
           "yellow", 4.2)

# 4) Nome
text_line(title, "Produtos", 47, 0, 48, "blue", tracking=-0.5)
text_line(title, "do Sítio", 55, 0, -4, "blue", tracking=-0.5)

# 5) Colinas + árvore
hill = [("M", (-108, -46)), ("C", (-72, -26), (-34, -26), (0, -40)),
        ("C", (32, -54), (72, -56), (108, -46)),
        ("C", (70, -76), (-70, -76), (-108, -46)), ("Z",)]
fill(hill, "green")
fill([("M", (66.2, -50)), ("L", (69.8, -50)), ("L", (69.8, -38)), ("L", (66.2, -38)), ("Z",)], "blue")  # tronco
fill(circle_ops(68, -33, 10.5), "dgreen")                    # copa

# 6) Endereço (opcional) e "Desde 2020"
y = -77
if ADDRESS:
    text_line(small, ADDRESS, 13, 0, -80, "blue", tracking=0.3)
    y = -112
text_line(ring, "DESDE 2020", 21, 0, -100 if not ADDRESS else y, "blue", tracking=2.2)

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
