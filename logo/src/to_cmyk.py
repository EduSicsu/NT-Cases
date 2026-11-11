#!/usr/bin/env python3
"""Converte os PDFs vetoriais (RGB) em PDFs CMYK para a gráfica, em 40 mm.
Uso: python3 to_cmyk.py entrada.pdf saida.pdf [tamanho_mm=40]
- cores principais: tabela CMYK escolhida à mão (sem preto rico em texto fino);
- demais cores (tons de suavização do Modelo 1): conversão genérica com limite de tinta 300%;
- página recortada no contorno do selo e escalada para 40 mm (vetor: pode ampliar sem perda)."""
import sys, pikepdf
from pikepdf import Operator, Name

src, dst = sys.argv[1], sys.argv[2]
SIZE_MM = float(sys.argv[3]) if len(sys.argv) > 3 else 40.0

# (C, M, Y, K) em %
TABLE = {
    "f4e9b7": (4, 7, 32, 0), "f3e8b7": (4, 7, 32, 0),     # creme do fundo
    "f9eec4": (3, 5, 24, 0),                               # creme claro (contornos)
    "40270d": (40, 62, 80, 78), "301b06": (45, 65, 85, 88), # marrom escuro (anel, texto, fita)
    "4a3112": (50, 68, 88, 72),
    "a64722": (18, 82, 96, 8), "93451f": (24, 82, 100, 16), "9e4a24": (22, 80, 100, 14), "9e5932": (28, 70, 90, 16),  # terracota
    "bd8a1f": (14, 44, 100, 6), "b68724": (14, 44, 100, 6), "c08d1a": (13, 42, 100, 5),                            # mostarda
    "7e7140": (50, 46, 92, 28),                            # oliva
}
def convert(r, g, b):
    h = "%02x%02x%02x" % (round(r * 255), round(g * 255), round(b * 255))
    if h in TABLE: return [v / 100 for v in TABLE[h]]
    c, m, y = 1 - r, 1 - g, 1 - b
    k = min(c, m, y) * 0.8
    c, m, y = [(v - k) / (1 - k) if k < 1 else 0 for v in (c, m, y)]
    tot = c + m + y + k
    if tot > 3.0: c, m, y, k = [v * 3.0 / tot for v in (c, m, y, k)]
    return [round(v, 3) for v in (c, m, y, k)]

pdf = pikepdf.open(src)
page = pdf.pages[0]
out = []
n_rgb = 0
for operands, op in pikepdf.parse_content_stream(page):
    o = str(op)
    if o in ("rg", "RG"):
        out.append(([float(v) for v in convert(*[float(x) for x in operands])], Operator("k" if o == "rg" else "K"))); n_rgb += 1
    elif o in ("g", "G"):
        out.append(([0, 0, 0, round(1 - float(operands[0]), 3)], Operator("k" if o == "g" else "K")))
    else:
        out.append((operands, op))

# recorte no selo (px do SVG 1024) e escala para SIZE_MM
CX, CY, R = 511.6, 490.4, 441.5
x0, x1, y0, y1 = CX - R, CX + R, CY - R, CY + R
pt = 0.75
llx, lly = x0 * pt, (1024 - y1) * pt
side = (x1 - x0) * pt
S = (SIZE_MM / 25.4 * 72) / side
head = f"q {S:.6f} 0 0 {S:.6f} {-llx * S:.4f} {-lly * S:.4f} cm\n".encode()
body = pikepdf.unparse_content_stream(out)
page.Contents = pdf.make_stream(head + body + b"\nQ\n")
box = [0, 0, round(SIZE_MM / 25.4 * 72, 4), round(SIZE_MM / 25.4 * 72, 4)]
page.MediaBox = box; page.TrimBox = box; page.BleedBox = box; page.CropBox = box
pdf.docinfo["/Title"] = "Produtos do Sítio — CMYK %g mm" % SIZE_MM
pdf.save(dst)
print(dst, "| cores convertidas:", n_rgb, "| tamanho: %g x %g mm" % (SIZE_MM, SIZE_MM))
