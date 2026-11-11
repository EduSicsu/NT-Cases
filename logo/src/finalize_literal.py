#!/usr/bin/env python3
"""Pós-processo do Modelo 1 (literal): põe em curvas o texto novo do anel superior
("PROJETO RENOVO MISSIONÁRIO") e a linha de endereço corrigida ("Ramal Vale de Bençãos").
Uso: python3 finalize_literal.py literal.svg saida.svg"""
import sys, os, math
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen

SRC, DST = sys.argv[1], sys.argv[2]
FD = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "fontes")
BROWN, CREAM2 = "#40270d", "#f9eec4"
CX, CY = 511.6, 490.4

class F:
    def __init__(self, fn):
        self.f = TTFont(os.path.join(FD, fn)); self.gs = self.f.getGlyphSet()
        self.cmap = self.f.getBestCmap(); self.upm = self.f["head"].unitsPerEm
    def adv(self, c, size): return self.gs[self.cmap[ord(c)]].width * size / self.upm
    def width(self, s, size, ls=0): return sum(self.adv(c, size) for c in s) + ls * (len(s) - 1)
    def outline(self, c, size, P, tvec, uvec, adv):
        """Contorno do glifo c: origem do glifo em P (centrado em adv/2), direção de leitura tvec, 'para cima' uvec (tela, y p/ baixo)."""
        pen = SVGPathPen(self.gs, ntos=lambda v: "%.2f" % v)
        s = size / self.upm
        tp = TransformPen(pen, (s * tvec[0], s * tvec[1], s * uvec[0], s * uvec[1],
                                P[0] - (adv / 2) * tvec[0], P[1] - (adv / 2) * tvec[1]))
        self.gs[self.cmap[ord(c)]].draw(tp)
        return pen.getCommands()

domine, rcond = F("Domine-Bold.ttf"), F("RobotoCondensed-Bold.ttf")

def arc_text(font, txt, size, R, top, ls):
    """Texto em arco, centrado no topo (top=True) ou na base (top=False)."""
    total = font.width(txt, size, ls)
    pos, out = -total / 2, []
    for c in txt:
        a = font.adv(c, size)
        mid = pos + a / 2; pos += a + ls
        if c == " ": continue
        t = mid / R
        if top:
            ang = math.radians(270) + t
            tv, uv = (-math.sin(ang), math.cos(ang)), (math.cos(ang), math.sin(ang))
        else:
            ang = math.radians(90) - t
            tv, uv = (math.sin(ang), -math.cos(ang)), (-math.cos(ang), -math.sin(ang))
        P = (CX + R * math.cos(ang), CY + R * math.sin(ang))
        out.append(font.outline(c, size, P, tv, uv, a))
    return out

def line_text(font, txt, size, cx, y):
    x, out = cx - font.width(txt, size) / 2, []
    for c in txt:
        a = font.adv(c, size)
        if c != " ": out.append(font.outline(c, size, (x + a / 2, y), (1, 0), (0, -1), a))
        x += a
    return out

# --- dados idênticos ao Modelo 2 ---
CAP = 33.0
size_ring = CAP / (domine.f["OS/2"].sCapHeight / domine.upm)
TOP = "PROJETO RENOVO MISSIONÁRIO"
R_TOP, SPAN_TOP = 351.0, 135.1
ls_top = (math.radians(SPAN_TOP) * R_TOP - domine.width(TOP, size_ring)) / (len(TOP) - 1)
ring_paths = arc_text(domine, TOP, size_ring, R_TOP, True, ls_top)

ADDR = "Ramal Vale de Bençãos"
size_addr = 364.0 / rcond.width(ADDR, 1.0)
addr_paths = line_text(rcond, ADDR, size_addr, 515, 737)

d_addr = " ".join(addr_paths); d_ring = " ".join(ring_paths)
over = f'''<g id="texto-novo" transform="scale(2)">
<path id="endereco-linha2-contorno" d="{d_addr}" fill="{CREAM2}" stroke="{CREAM2}" stroke-width="19" stroke-linejoin="round"/>
<path id="endereco-linha2" d="{d_addr}" fill="{BROWN}"/>
<path id="anel-topo-projeto-renovo-missionario" d="{d_ring}" fill="{BROWN}"/>
</g>
'''
s = open(SRC).read()
s = s.replace("</svg>", over + "</svg>")
open(DST, "w").write(s)
print("ok", DST, "ring size %.1f ls %.2f addr size %.1f" % (size_ring, ls_top, size_addr))
