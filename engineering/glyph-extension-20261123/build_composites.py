#!/opt/homebrew/bin/python3.13
"""以字型自己的字形組附加符號，產生樣張字型（2026-11-23）。

重跑：/opt/homebrew/bin/python3.13 build_composites.py
需要 fontTools（核實時為 4.63.0）與 Pillow（12.3.0）；見 index.md。
從原檔讀，不手改二進位；每個新字形的輪廓都由原字型既有字形經縮放、旋轉、平移而來。
Radio Newsman：點、尖音、抑音、長音、撇號、破折號由 period、quotesingle、hyphen、comma 組。
Erikas Bold：ē 取 ō 的長音輪廓（ō 減去 o 的輪廓）疊到 e 上，網點與原字型同格。
"""
import math
import os
import sys

from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.ttGlyphPen import TTGlyphPen
from fontTools.ttLib import TTFont
from fontTools.ttLib.tables import ttProgram
from fontTools.ttLib.tables._g_l_y_f import Glyph, GlyphCoordinates

SRC = "/Users/iw/Documents/NTU/1142/Translation/_Assets/fonts/categories/typewriter-latin/"
OUT = os.path.dirname(os.path.abspath(__file__)) + "/"

# ---- Radio Newsman 參數（單位：1/1000 em；x 高 636、大寫高約 855）----
RN = dict(
    lc_base=700,      # 小寫附加符號底緣
    uc_base=900,      # 大寫附加符號底緣
    dot_scale=1.00,   # 分音符每點相對 period 的縮放
    dot_half_gap=160, # 兩點中心距基字中線
    acute_scale=0.60, acute_rot=-22,   # 尖音：quotesingle 縮放，順時針 22 度
    grave_scale=0.60, grave_rot=22,
    macron_sx=0.95, macron_sy=0.62,
    emdash_target=900,  # 破折號總寬
    emdash_adv=1000,
    apos_dy=680,        # 撇號：comma 上移
)


def bounds(gs, name):
    bp = BoundsPen(gs)
    gs[name].draw(bp)
    return bp.bounds


def affine(sx=1.0, sy=1.0, rot=0.0, dx=0.0, dy=0.0):
    c, s = math.cos(math.radians(rot)), math.sin(math.radians(rot))
    # 先縮放，再旋轉（逆時針為正），再平移
    return (c * sx, s * sx, -s * sy, c * sy, dx, dy)


def mul(m, n):
    """先 m 後 n。"""
    a, b, c, d, e, f = m
    A, B, C, D, E, F = n
    return (a * A + b * C, a * B + b * D, c * A + d * C, c * B + d * D, e * A + f * C + E, e * B + f * D + F)


def place(gs, name, cx, y_bottom, sx=1.0, sy=1.0, rot=0.0):
    """把 name 的外框中心移到 (cx, y_bottom+旋轉後半高)；回傳 matrix。"""
    x0, y0, x1, y1 = bounds(gs, name)
    mx, my = (x0 + x1) / 2, (y0 + y1) / 2
    m = mul((1, 0, 0, 1, -mx, -my), affine(sx, sy, rot))
    # 旋轉縮放後的外框
    pts = [(x0, y0), (x1, y0), (x0, y1), (x1, y1)]
    ys = []
    for px, py in pts:
        ys.append(m[1] * (px) + m[3] * (py) + m[5] + 0)
    # m 已含平移 -mx,-my；重算
    ys = [(m[1] * px + m[3] * py + m[5]) for px, py in pts]
    ybot = min(ys)
    return mul(m, (1, 0, 0, 1, cx, y_bottom - ybot))


def draw_into(pen, gs, name, m):
    gs[name].draw(TransformPen(pen, m))


def add_glyph(font, newname, adv, parts, cps):
    """parts: [(源字形名, matrix)]，全部畫進一個新的簡單字形。"""
    gs = font.getGlyphSet()
    pen = TTGlyphPen(gs)
    for src, m in parts:
        draw_into(pen, gs, src, m)
    g = pen.glyph()
    order = font.getGlyphOrder()
    if newname not in order:
        order.append(newname)
        font.setGlyphOrder(order)
    font["glyf"][newname] = g
    g.recalcBounds(font["glyf"])
    lsb = getattr(g, "xMin", 0)
    font["hmtx"][newname] = (adv, lsb)
    for t in font["cmap"].tables:
        if t.isUnicode():
            for cp in cps:
                if cp <= 0xFFFF or t.format == 12:
                    t.cmap[cp] = newname


def rename(font, family):
    for rec in font["name"].names:
        s = rec.toUnicode()
        if rec.nameID in (1, 16):
            rec.string = family
        elif rec.nameID == 4:
            rec.string = family + (" Bold" if s.endswith("Bold") else "")
        elif rec.nameID == 6:
            rec.string = family.replace(" ", "") + ("-Bold" if s.endswith("Bold") else "-Regular")
        elif rec.nameID == 3:
            rec.string = "Phenom glyph extension 20261123 : " + family


def build_radio():
    p = RN
    f = TTFont(SRC + "radio-newsman.ttf")
    gs = f.getGlyphSet()
    cm = f.getBestCmap()
    adv = lambda n: f["hmtx"][n][0]

    def cx_of(n):
        b = bounds(gs, n)
        return (b[0] + b[2]) / 2

    def dia(base, new, cp, cap=False):
        cx = cx_of(base)
        yb = p["uc_base"] if cap else p["lc_base"]
        s = p["dot_scale"]
        parts = [(base, (1, 0, 0, 1, 0, 0)),
                 ("period", place(gs, "period", cx - p["dot_half_gap"], yb, s, s)),
                 ("period", place(gs, "period", cx + p["dot_half_gap"], yb, s, s))]
        add_glyph(f, new, adv(base), parts, [cp])

    def acc(base, new, cp, kind):
        cx = cx_of(base)
        if kind == "acute":
            m = place(gs, "quotesingle", cx, p["lc_base"], p["acute_scale"], p["acute_scale"], p["acute_rot"])
        elif kind == "grave":
            m = place(gs, "quotesingle", cx, p["lc_base"], p["grave_scale"], p["grave_scale"], p["grave_rot"])
        else:
            m = place(gs, "hyphen", cx, p["lc_base"], p["macron_sx"], p["macron_sy"])
        src = "hyphen" if kind == "macron" else "quotesingle"
        add_glyph(f, new, adv(base), [(base, (1, 0, 0, 1, 0, 0)), (src, m)], [cp])

    dia("u", "udieresis", 0xFC)
    dia("U", "Udieresis", 0xDC, cap=True)
    dia("o", "odieresis", 0xF6)
    dia("a", "adieresis", 0xE4)
    acc("e", "eacute", 0xE9, "acute")
    acc("e", "egrave", 0xE8, "grave")
    acc("a", "amacron", 0x101, "macron")
    acc("o", "omacron", 0x14D, "macron")

    # 撇號 ’：comma 上移
    add_glyph(f, "quoteright", adv("quotesingle") + 20,
              [("comma", (1, 0, 0, 1, 20, p["apos_dy"]))], [0x2019])

    # 破折號：hyphen 中段拉長，兩端筆形不動
    hb = bounds(gs, "hyphen")
    xa, xb = hb[0] + 90, hb[2] - 90
    k = (p["emdash_target"] - (hb[2] - hb[0])) / (xb - xa) + 1
    shift = (xb - xa) * (k - 1)
    pen = TTGlyphPen(gs)

    class Stretch:
        """把 x 落在 (xa, xb) 的點按 k 拉長，xb 之後平移。"""
        def __init__(self, pen):
            self.pen = pen
        def _t(self, pt):
            x, y = pt
            if x <= xa:
                nx = x
            elif x < xb:
                nx = xa + (x - xa) * k
            else:
                nx = x + shift
            return (nx + 40, y + 0)
        def moveTo(self, pt): self.pen.moveTo(self._t(pt))
        def lineTo(self, pt): self.pen.lineTo(self._t(pt))
        def qCurveTo(self, *pts): self.pen.qCurveTo(*[self._t(q) if q is not None else None for q in pts])
        def curveTo(self, *pts): self.pen.curveTo(*[self._t(q) for q in pts])
        def closePath(self): self.pen.closePath()
        def endPath(self): self.pen.endPath()
        def addComponent(self, *a, **kw): raise NotImplementedError

    gs["hyphen"].draw(Stretch(pen))
    g = pen.glyph()
    order = f.getGlyphOrder() + ["emdash"]
    f.setGlyphOrder(order)
    f["glyf"]["emdash"] = g
    g.recalcBounds(f["glyf"])
    f["hmtx"]["emdash"] = (p["emdash_adv"], g.xMin)
    for t in f["cmap"].tables:
        if t.isUnicode():
            t.cmap[0x2014] = "emdash"

    for t in ("DSIG", "hdmx", "LTSH", "VDMX"):
        if t in f:
            del f[t]
    rename(f, "Radio Newsman Phenom")
    f["maxp"].numGlyphs = len(f.getGlyphOrder())
    f.save(OUT + "RadioNewsmanPhenom-sample.ttf")
    return f


def build_erikas_bold():
    """ē = e + ō 的長音筆形。ō 裡的長音是 >8 點、底緣在 y>=480 的輪廓（含一粒 13 點的墨斑）；
    網點在 ō 裡已與長音合併，e 保留自己完整的網格，疊上去同為順時針，不會相消。"""
    f = TTFont(SRC + "erikas-farbband-bold.ttf")
    glyf = f["glyf"]
    gs = f.getGlyphSet()
    ge, go = glyf["e"], glyf["omacron"]
    ge.expand(glyf)
    go.expand(glyf)
    be, bo = bounds(gs, "e"), bounds(gs, "o")
    dx = round(((be[0] + be[2]) - (bo[0] + bo[2])) / 2)
    coords, flags, ends = list(ge.coordinates), list(ge.flags), list(ge.endPtsOfContours)
    cgo, fgo = list(go.coordinates), list(go.flags)
    start, taken = 0, 0
    for e in go.endPtsOfContours:
        pts = cgo[start:e + 1]
        if len(pts) > 8 and min(y for _, y in pts) >= 480:
            for (x, y), fl in zip(pts, fgo[start:e + 1]):
                coords.append((x + dx, y))
                flags.append(fl)
            ends.append(len(coords) - 1)
            taken += 1
        start = e + 1
    ng = Glyph()
    ng.numberOfContours = len(ends)
    ng.coordinates = GlyphCoordinates(coords)
    ng.flags = bytearray(flags)
    ng.endPtsOfContours = ends
    ng.program = ttProgram.Program()
    ng.program.fromBytecode(b"")
    f.setGlyphOrder(f.getGlyphOrder() + ["emacron"])
    glyf["emacron"] = ng
    ng.recalcBounds(glyf)
    f["hmtx"]["emacron"] = (f["hmtx"]["e"][0], ng.xMin)
    for t in f["cmap"].tables:
        if t.isUnicode():
            t.cmap[0x113] = "emacron"
    if "DSIG" in f:
        del f["DSIG"]
    rename(f, "Erikas Farbband Phenom")
    f["maxp"].numGlyphs = len(f.getGlyphOrder())
    f.save(OUT + "ErikasFarbbandPhenom-Bold-sample.ttf")
    return taken, dx


if __name__ == "__main__":
    build_radio()
    n, dx = build_erikas_bold()
    print("Erikas Bold 長音輪廓數", n, "x 位移", dx)
    print("ok")
