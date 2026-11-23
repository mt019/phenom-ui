#!/usr/bin/env python3
"""打字機字體全量補字（2026-11-23）：Radio Newsman 與 Erikas Farbband 兩個字重。

重跑（環境見 index.md「重跑環境」）：
    .venv/bin/python build_full.py
產物：
    build/RadioNewsmanPhenom.ttf、build/ErikasFarbbandPhenom.ttf、build/ErikasFarbbandPhenom-Bold.ttf（完整檔，不進版控）
    ../../fonts/RadioNewsman-subset.woff2、ErikasFarbband-subset.woff2、ErikasFarbband-Bold-subset.woff2
    added-codepoints.tsv（每個補入碼位、字型、組法）

做法：從原檔讀，所有新字形的輪廓都由該字型既有字形經縮放、旋轉、平移、裁切（skia-pathops 交集）
與聯集而來，不手畫座標曲線。附加符號參數沿用樣張站主核可值（dot_scale 1.00、dot_half_gap 160）。
"""
import math
import os
import subprocess
import sys
import unicodedata

import pathops
from fontTools.pens.cu2quPen import Cu2QuPen
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.ttGlyphPen import TTGlyphPen
from fontTools.ttLib import TTFont
from fontTools.ttLib.tables._g_l_y_f import Glyph, GlyphComponent

SRC = "/Users/iw/Documents/NTU/1142/Translation/_Assets/fonts/categories/typewriter-latin/"
HERE = os.path.dirname(os.path.abspath(__file__)) + "/"
BUILD = HERE + "build/"
FONTS = os.path.abspath(HERE + "../../fonts") + "/"

# ---- Radio Newsman 參數（1/1000 em；x 高 636、大寫高約 832–849、升部約 842）----
RN = dict(
    lc_base=700,        # 小寫附加符號底緣
    uc_base=900,        # 大寫與升部字母的附加符號底緣
    tall=770,           # 基字外框頂高於此即視為大寫或升部字母，符號改放 uc_base
    dot_scale=1.00,     # 分音符每點相對 period 的縮放（站主 11-23 選定）
    dot_half_gap=160,   # 兩點中心距基字中線（站主 11-23 選定）
    acute_scale=0.60, acute_rot=-22,
    grave_scale=0.60, grave_rot=22,
    macron_sx=0.95, macron_sy=0.62,
    circ_sx=0.70, circ_sy=0.48,  # asciicircum 縮放（橫、縱）
    ring_scale=0.36,    # o 縮放成圈
    tilde_w=400, tilde_h=115,
    breve_scale=0.50,
    dbl_acute_gap=95,
    emdash_target=1100, emdash_adv=1160,   # 樣張 900 看起來像短橫，加長
    endash_target=560, endash_adv=620,
    apos_dy=680,        # ’：comma 上移
    win_ascent_pad=20,  # winAscent 取所有字形頂再加這個量
)
# 補字範圍：Latin-1 補充、擴充 A、常用標點，加上 ASCII 原缺的 < > ` ~。
TARGET = (list(range(0x00A0, 0x0100)) + list(range(0x0100, 0x0180))
          + [0x2013, 0x2014, 0x2018, 0x2019, 0x201A, 0x201C, 0x201D, 0x201E, 0x2026,
             0x2022, 0x2039, 0x203A, 0x3C, 0x3E, 0x60, 0x7E])

IDENT = (1, 0, 0, 1, 0, 0)
ERIKAS_RANGES = [(0x20, 0x24F), (0x2000, 0x206F), (0x20A0, 0x20BF)]


def mul(m, n):
    """先 m 後 n。"""
    a, b, c, d, e, f = m
    A, B, C, D, E, F = n
    return (a * A + b * C, a * B + b * D, c * A + d * C, c * B + d * D, e * A + f * C + E, e * B + f * D + F)


def affine(sx=1.0, sy=1.0, rot=0.0):
    c, s = math.cos(math.radians(rot)), math.sin(math.radians(rot))
    return (c * sx, s * sx, -s * sy, c * sy, 0, 0)


def move(dx, dy):
    return (1, 0, 0, 1, dx, dy)


class Shapes:
    """一支字型的字形 → skia 路徑，以及裁切、聯集、擺放。"""

    def __init__(self, font):
        self.f = font
        self.gs = font.getGlyphSet()
        self.cmap = font.getBestCmap()
        self.cw = self.path("o").clockwise

    def name(self, ch):
        return self.cmap[ord(ch)] if isinstance(ch, str) and len(ch) == 1 else ch

    def path(self, ch, m=IDENT):
        p = pathops.Path()
        self.gs[self.name(ch)].draw(TransformPen(p.getPen(), m))
        return p

    def adv(self, ch):
        return self.f["hmtx"][self.name(ch)][0]

    @staticmethod
    def tf(p, m):
        q = pathops.Path()
        p.draw(TransformPen(q.getPen(), m))
        return q

    def op(self, a, b, kind):
        return pathops.op(a, b, kind, clockwise=self.cw)

    def union(self, *ps):
        out = ps[0]
        for p in ps[1:]:
            out = self.op(out, p, pathops.PathOp.UNION)
        return out

    @staticmethod
    def rect(x0, y0, x1, y1):
        p = pathops.Path()
        pen = p.getPen()
        pen.moveTo((x0, y0)); pen.lineTo((x1, y0)); pen.lineTo((x1, y1)); pen.lineTo((x0, y1)); pen.closePath()
        return p

    def crop(self, p, x0=-2000, y0=-2000, x1=4000, y1=4000):
        return self.op(p, self.rect(x0, y0, x1, y1), pathops.PathOp.INTERSECTION)

    def cut(self, p, x0, y0, x1, y1):
        return self.op(p, self.rect(x0, y0, x1, y1), pathops.PathOp.DIFFERENCE)

    @staticmethod
    def center(p):
        x0, y0, x1, y1 = p.bounds
        return (x0 + x1) / 2, (y0 + y1) / 2

    def at(self, p, cx=None, bottom=None, top=None, cy=None, left=None, right=None):
        """平移 p，使外框中線、底、頂或左右緣落到指定位置。"""
        x0, y0, x1, y1 = p.bounds
        dx = dy = 0
        if cx is not None: dx = cx - (x0 + x1) / 2
        if left is not None: dx = left - x0
        if right is not None: dx = right - x1
        if bottom is not None: dy = bottom - y0
        if top is not None: dy = top - y1
        if cy is not None: dy = cy - (y0 + y1) / 2
        return self.tf(p, move(dx, dy))

    def runs(self, ch, y):
        """字形在高度 y 的水平橫切面上的黑色區段 [(x0, x1)]，由左到右。"""
        sl = self.crop(self.path(ch), -2000, y - 2, 4000, y + 2)
        out = []
        for c in sl.contours:
            x0, _, x1, _ = c.bounds
            out.append((x0, x1))
        return sorted(out)


def write_glyph(font, gname, path, adv, cps, cw):
    """把 skia 路徑寫成 TrueType 簡單字形並對應碼位。"""
    path = pathops.simplify(path, clockwise=cw)
    pen = TTGlyphPen(None)
    path.draw(Cu2QuPen(pen, 1.0, reverse_direction=False))
    g = pen.glyph()
    order = font.getGlyphOrder()
    if gname not in order:
        font.setGlyphOrder(order + [gname])
    font["glyf"][gname] = g
    g.recalcBounds(font["glyf"])
    font["hmtx"][gname] = (int(round(adv)), getattr(g, "xMin", 0))
    map_cps(font, gname, cps)


def map_cps(font, gname, cps):
    for t in font["cmap"].tables:
        if t.isUnicode():
            for cp in cps:
                if cp <= 0xFFFF or t.format == 12:
                    t.cmap[cp] = gname


def gname_for(cp):
    n = unicodedata.name(chr(cp), "")
    return "uni%04X" % cp if not n else "uni%04X" % cp


def rename(font, family, style):
    psname = family.replace(" ", "") + "-" + style.replace(" ", "")
    full = family + ("" if style == "Regular" else " " + style)
    for rec in font["name"].names:
        if rec.nameID in (1, 16):
            rec.string = family
        elif rec.nameID == 4:
            rec.string = full
        elif rec.nameID == 6:
            rec.string = psname
        elif rec.nameID == 3:
            rec.string = "Phenom glyph extension 20261123 : " + full
    font["name"].setName(
        "Modified 2026-11-23 for phenomcanvas: added Latin-1 Supplement, Latin Extended-A and punctuation "
        "glyphs composed from the font's own outlines. Family renamed; original author credited in the "
        "copyright and designer fields.", 10, 3, 1, 0x409)


# ------------------------------------------------------------------ Radio Newsman

def build_radio(log):
    p = RN
    f = TTFont(SRC + "radio-newsman.ttf", recalcTimestamp=False)
    S = Shapes(f)
    cw = S.cw
    have = set(S.cmap)

    # ---- 附加符號（外框底緣在 y=0、中線在 x=0）----
    def norm(q):
        return S.at(q, cx=0, bottom=0)

    period = S.path("period")
    ds = p["dot_scale"]
    dot = norm(S.tf(period, affine(ds, ds)))
    marks = {}
    marks["dieresis"] = S.union(S.at(dot, cx=-p["dot_half_gap"], bottom=0), S.at(dot, cx=p["dot_half_gap"], bottom=0))
    marks["dotaccent"] = dot
    marks["acute"] = norm(S.path("quotesingle", affine(p["acute_scale"], p["acute_scale"], p["acute_rot"])))
    marks["grave"] = norm(S.path("quotesingle", affine(p["grave_scale"], p["grave_scale"], p["grave_rot"])))
    marks["macron"] = norm(S.path("hyphen", affine(p["macron_sx"], p["macron_sy"])))
    marks["circumflex"] = norm(S.path("asciicircum", affine(p["circ_sx"], p["circ_sy"])))
    marks["caron"] = norm(S.path("asciicircum", affine(p["circ_sx"], p["circ_sy"], 180)))
    marks["ring"] = norm(S.path("o", affine(p["ring_scale"], p["ring_scale"])))
    # 短音：o 縮小後取下半圈
    o_small = S.path("o", affine(p["breve_scale"], p["breve_scale"] * 0.9))
    cx_, cy_ = S.center(o_small)
    marks["breve"] = norm(S.crop(o_small, y1=cy_))
    # 波浪：s 轉 90 度後壓扁成橫向的波
    s_rot = S.path("s", affine(1, 1, 90))
    b = s_rot.bounds
    marks["tilde"] = norm(S.tf(s_rot, affine(p["tilde_w"] / (b[2] - b[0]), p["tilde_h"] / (b[3] - b[1]))))
    marks["hungarumlaut"] = S.union(S.at(marks["acute"], cx=-p["dbl_acute_gap"], bottom=0),
                                    S.at(marks["acute"], cx=p["dbl_acute_gap"], bottom=0))
    comma = S.path("comma")
    # 下加符號：外框頂在 y=0
    def normtop(q):
        return S.at(q, cx=0, top=0)
    marks["cedilla"] = normtop(S.tf(comma, affine(-0.75, 0.75)))       # comma 左右翻轉縮小
    marks["ogonek"] = normtop(S.tf(comma, affine(-0.80, 0.80)))
    marks["commabelow"] = normtop(S.tf(comma, affine(0.62, 0.62)))
    marks["commaturned"] = norm(S.tf(comma, affine(0.80, 0.80, 180)))
    quoteright = S.tf(comma, move(20, p["apos_dy"]))

    # ---- 基字 ----
    dotlessi = S.crop(S.path("i"), y1=690)
    dotlessj = S.crop(S.path("j"), y1=690)
    base_paths = {"ı": dotlessi, "ȷ": dotlessj}

    def base(ch):
        return base_paths[ch] if ch in base_paths else S.path(ch)

    def base_adv(ch):
        return S.adv({"ı": "i", "ȷ": "j"}.get(ch, ch))

    added = []

    def put(cp, path, adv, how):
        write_glyph(f, gname_for(cp), path, adv, [cp], cw)
        added.append((cp, how))

    MARK_OF = {"0300": "grave", "0301": "acute", "0302": "circumflex", "0303": "tilde", "0304": "macron",
               "0306": "breve", "0307": "dotaccent", "0308": "dieresis", "030A": "ring", "030B": "hungarumlaut",
               "030C": "caron", "0327": "cedilla", "0328": "ogonek"}
    COMMA_BELOW = set("ĢĶĻŅŖķļņŗ")
    APOS_CARON = set("ďľĽť")

    def compose(cp):
        ch = chr(cp)
        d = unicodedata.decomposition(ch).split()
        if len(d) != 2 or d[1] not in MARK_OF:
            return False
        bch = chr(int(d[0], 16))
        mk = MARK_OF[d[1]]
        if bch == "i" and mk not in ("cedilla", "ogonek"):
            bch = "ı"
        if bch == "j":
            bch = "ȷ"
        if not (bch in base_paths or ord(bch) in have):
            return False
        bp = base(bch)
        x0, y0, x1, y1 = bp.bounds
        cx = (x0 + x1) / 2
        if ch == "ģ":
            m = S.at(marks["commaturned"], cx=cx, bottom=p["lc_base"])
            how = f"{bch} + comma 轉 180 度置上"
        elif ch in COMMA_BELOW:
            m = S.at(marks["commabelow"], cx=cx, top=-30)
            how = f"{bch} + comma 縮 0.62 置下"
        elif ch in APOS_CARON:
            m = S.tf(quoteright, affine(0.8, 0.8))
            m = S.at(m, left=x1 + 10, top=y1 + 10)
            how = f"{bch} + ’ 縮 0.80 置右上（捷克、斯洛伐克字形慣例）"
            adv = base_adv(bch) + (m.bounds[2] - m.bounds[0]) + 20
            put(cp, S.union(bp, m), adv, how)
            return True
        elif mk == "cedilla":
            m = S.at(marks["cedilla"], cx=cx, top=40)
            how = f"{bch} + comma 翻轉縮 0.75 置下（下加符）"
        elif mk == "ogonek":
            m = S.at(marks["ogonek"], right=x1 - 40, top=40)
            how = f"{bch} + comma 翻轉縮 0.80 置右下（反尾符）"
        else:
            yb = p["uc_base"] if y1 > p["tall"] else p["lc_base"]
            m = S.at(marks[mk], cx=cx, bottom=yb)
            how = f"{bch} + {mk}"
        put(cp, S.union(bp, m), base_adv(bch), how)
        return True

    hy = S.path("hyphen")

    def bar(w, h, cx, cy, rot=0):
        q = S.tf(hy, affine(1, 1, 0))
        b = q.bounds
        q = S.tf(q, affine(w / (b[2] - b[0]), h / (b[3] - b[1]), rot))
        return S.at(q, cx=cx, cy=cy)

    def stem_center(ch, y, which=0):
        r = S.runs(ch, y)
        return (r[which][0] + r[which][1]) / 2

    def stem_w(ch, y, which=0):
        r = S.runs(ch, y)
        return r[which][1] - r[which][0]

    OVER = 130  # 橫槓、斜槓伸出字幹兩側各這麼多

    special = {}

    def sp(cp, fn):
        special[cp] = fn

    # 橫槓、斜槓類
    sp(0x0110, lambda: (S.union(S.path("D"), bar(stem_w("D", 420) + 2 * OVER, 95, stem_center("D", 420), 420)), S.adv("D"), "D + hyphen 橫槓"))
    sp(0x00D0, lambda: (S.union(S.path("D"), bar(stem_w("D", 420) + 2 * OVER, 95, stem_center("D", 420), 420)), S.adv("D"), "D + hyphen 橫槓（同 Đ）"))
    sp(0x0111, lambda: (S.union(S.path("d"), bar(stem_w("d", 740, -1) + 2 * OVER, 85, stem_center("d", 740, -1), 740)), S.adv("d"), "d + hyphen 橫槓置升部"))
    sp(0x0126, lambda: (S.union(S.path("H"), bar(S.path("H").bounds[2] - S.path("H").bounds[0] - 40, 85, S.center(S.path("H"))[0], 650)), S.adv("H"), "H + hyphen 橫槓"))
    sp(0x0127, lambda: (S.union(S.path("h"), bar(stem_w("h", 740) + 2 * OVER, 85, stem_center("h", 740), 740)), S.adv("h"), "h + hyphen 橫槓置升部"))
    sp(0x0166, lambda: (S.union(S.path("T"), bar(stem_w("T", 400) + 2 * OVER, 95, stem_center("T", 400), 400)), S.adv("T"), "T + hyphen 橫槓"))
    sp(0x0167, lambda: (S.union(S.path("t"), bar(stem_w("t", 300) + 2 * OVER, 85, stem_center("t", 300), 300)), S.adv("t"), "t + hyphen 橫槓"))
    sp(0x0141, lambda: (S.union(S.path("L"), bar(stem_w("L", 420) + 2 * OVER + 60, 95, stem_center("L", 420), 420, 30)), S.adv("L"), "L + hyphen 轉 30 度斜槓"))
    sp(0x0142, lambda: (S.union(S.path("l"), bar(stem_w("l", 440) + 2 * OVER + 60, 90, stem_center("l", 440), 440, 30)), S.adv("l"), "l + hyphen 轉 30 度斜槓"))

    def slashed(ch, sy):
        o = S.path(ch)
        sl = S.path("slash")
        b = sl.bounds
        ob = o.bounds
        k = (ob[3] - ob[1]) * sy / (b[3] - b[1])
        sl = S.tf(sl, affine(k * 0.95, k))
        sl = S.at(sl, cx=S.center(o)[0], cy=S.center(o)[1])
        return S.union(o, sl)
    sp(0x00D8, lambda: (slashed("O", 1.12), S.adv("O"), "O + slash 依 O 高放大"))
    sp(0x00F8, lambda: (slashed("o", 1.15), S.adv("o"), "o + slash 依 o 高放大"))

    def middot_after(ch, y):
        b = S.path(ch).bounds
        d = S.at(dot, left=b[2] + 10, cy=y)
        return S.union(S.path(ch), d), b[2] + 10 + (d.bounds[2] - d.bounds[0]) + 40
    sp(0x013F, lambda: (*middot_after("L", 420), "L + period 置中高"))
    sp(0x0140, lambda: (*middot_after("l", 420), "l + period 置中高"))

    def pair(a, bpath, badv, gap=-30):
        pa = a if not isinstance(a, str) else S.path(a)
        aadv = S.adv(a) if isinstance(a, str) else 0
        return S.union(pa, S.tf(bpath, move(aadv + gap, 0))), aadv + gap + badv
    sp(0x0132, lambda: (*pair("I", S.path("J"), S.adv("J")), "I + J 併排"))
    sp(0x0133, lambda: (*pair("i", S.path("j"), S.adv("j"), -60), "i + j 併排"))
    sp(0x0149, lambda: (S.union(S.at(quoteright, left=10), S.tf(S.path("n"), move(200, 0))), 200 + S.adv("n"), "’ + n"))
    sp(0x0131, lambda: (dotlessi, S.adv("i"), "i 去點（裁去 y 690 以上）"))

    # 小型大寫 ĸ：K 壓到 x 高
    def kra():
        k = S.path("K")
        b = k.bounds
        return S.tf(k, affine(0.88, 640 / (b[3] - b[1]))), S.adv("K") * 0.88
    sp(0x0138, lambda: (*kra(), "K 橫 0.88、壓到 x 高"))

    # 長 s：f 去掉橫筆（只留字幹、上鉤與底部襯線）
    def long_s():
        fp = S.path("f")
        stem = S.runs("f", 300)[0]
        top = S.crop(fp, y0=690)
        mid = S.crop(fp, stem[0] - 5, 0, stem[1] + 5, 700)
        foot = S.crop(fp, y1=110)
        return S.union(top, mid, foot), S.adv("f")
    sp(0x017F, lambda: (*long_s(), "f 去橫筆：留上鉤、字幹、底襯線"))

    # ß：長 s（f 去橫筆）的字幹與上鉤，接 B 右半的兩個碗
    def eszett():
        ls, _ = long_s()
        fst = S.runs("f", 300)[0]
        B = S.path("B")
        bst = S.runs("B", 300)[0]
        bowls = S.crop(B, x0=bst[1] - 30, y1=640)
        bowls = S.tf(bowls, affine(0.85, 0.95))
        bowls = S.at(bowls, left=fst[1] - 40, bottom=-10)
        g = S.union(ls, bowls)
        return g, g.bounds[2] + 50
    sp(0x00DF, lambda: (*eszett(), "長 s（f 去橫筆）+ B 右半裁到 y 640 以下（橫 0.85、縱 0.95），上方由長 s 的鉤接"))

    # æ Æ œ Œ：前字裁去右側，與後字疊接
    def lig(a, b_, cut_frac, overlap):
        pa = S.path(a)
        ab = pa.bounds
        xcut = ab[0] + (ab[2] - ab[0]) * cut_frac
        left = S.crop(pa, x1=xcut)
        pb = S.path(b_)
        bb = pb.bounds
        right = S.tf(pb, move(xcut - overlap - bb[0], 0))
        g = S.union(left, right)
        return g, g.bounds[2] + (S.adv(b_) - bb[2])
    sp(0x00E6, lambda: (*lig("a", "e", 0.78, 60), "a 裁右 22% + e"))
    sp(0x00C6, lambda: (*lig("A", "E", 0.62, 150), "A 裁右 38% + E"))
    sp(0x0153, lambda: (*lig("o", "e", 0.80, 90), "o 裁右 20% + e"))
    sp(0x0152, lambda: (*lig("O", "E", 0.70, 170), "O 裁右 30% + E"))

    # ð：6 左右翻轉，上段加斜槓
    def eth():
        six = S.path("six")
        b = six.bounds
        g = S.tf(six, affine(-0.92, 0.92))
        g = S.at(g, left=b[0] + 20, bottom=-10)
        gb = g.bounds
        g = S.union(g, bar(320, 100, gb[2] - 150, gb[3] - 210, 20))
        return g, S.adv("six")
    sp(0x00F0, lambda: (*eth(), "six 左右翻轉縮 0.92 + hyphen 斜槓"))

    # þ：p 加 l 的升部
    def thorn_l():
        pp = S.path("p")
        pst = S.runs("p", 300)[0]
        l = S.path("l")
        lst = S.runs("l", 420)[0]
        asc = S.crop(l, y0=500, x1=lst[1] + 2)
        asc = S.tf(asc, move(pst[1] - lst[1], 0))
        return S.union(pp, asc), S.adv("p")
    sp(0x00FE, lambda: (*thorn_l(), "p + l 的升部（含上襯線）"))

    # Þ：P 的字幹與上下襯線保留全高，碗縮到中段
    def thorn_u():
        P = S.path("P")
        st = S.runs("P", 200)[0]
        stem = S.crop(P, x1=st[1] + 5)
        bowl = S.crop(P, x0=st[1] - 20, y0=380)
        bb = bowl.bounds
        bowl = S.tf(bowl, affine(0.95, 0.85))
        bowl = S.at(bowl, left=st[1] - 20, top=640)
        return S.union(stem, bowl), S.adv("P")
    sp(0x00DE, lambda: (*thorn_u(), "P 字幹全高 + P 的碗縮 0.85 置中段"))

    # ŋ Ŋ：n 或 N 的右腳接 j 的下鉤
    def eng(ch):
        n = S.path(ch)
        nr = S.runs(ch, 200)[-1]
        j = S.path("j")
        jr = S.runs("j", 200)[0]
        hook = S.crop(j, y1=200)
        hook = S.tf(hook, move((nr[0] + nr[1]) / 2 - (jr[0] + jr[1]) / 2, 0))
        body = S.cut(n, nr[0] - 40, -2000, 4000, 110)  # 去掉右腳底襯線
        body = S.union(body, S.crop(n, nr[0], 0, nr[1], 120))
        return S.union(body, hook), S.adv(ch)
    sp(0x014B, lambda: (*eng("n"), "n 去右腳底襯線 + j 的下鉤（j 裁 y<200，對齊右腳中線）"))
    sp(0x014A, lambda: (*eng("N"), "N 去右腳底襯線 + j 的下鉤（j 裁 y<200，對齊右腳中線）"))

    # µ：u 的左腳往下接 p 的降部
    def micro():
        u = S.path("u")
        ur = S.runs("u", 300)[0]
        pp = S.path("p")
        pr = S.runs("p", 300)[0]
        desc = S.crop(pp, x1=pr[1] + 60, y1=40)
        desc = S.tf(desc, move((ur[0] + ur[1]) / 2 - (pr[0] + pr[1]) / 2, 0))
        return S.union(u, desc), S.adv("u")
    sp(0x00B5, lambda: (*micro(), "u + p 的降部"))

    # ---- 符號 ----
    xh_mid = 318
    def sym(cp, path, adv, how):
        sp(cp, lambda: (path() if callable(path) else path, adv, how))

    sp(0x00A1, lambda: (S.at(S.path("exclam", affine(1, 1, 180)), left=S.path("exclam").bounds[0], bottom=-230), S.adv("exclam"), "! 轉 180 度"))
    sp(0x00BF, lambda: (S.at(S.path("question", affine(1, 1, 180)), left=S.path("question").bounds[0], bottom=-240), S.adv("question"), "? 轉 180 度"))
    def cent():
        c = S.path("c")
        b = c.bounds
        st = S.crop(S.path("bar"), y0=-120, y1=760)
        st = S.tf(st, affine(0.8, 1))
        st = S.at(st, cx=(b[0] + b[2]) / 2, cy=(b[1] + b[3]) / 2)
        return S.union(c, st), S.adv("c")
    sp(0x00A2, lambda: (*cent(), "c + bar 截段"))
    def pound():
        fp = S.path("f")
        L = S.path("L")
        base_ = S.crop(L, y1=170)
        lb = base_.bounds
        fb = fp.bounds
        base_ = S.at(base_, left=fb[0], bottom=-10)
        return S.union(fp, base_), max(S.adv("f"), base_.bounds[2] + 40)
    sp(0x00A3, lambda: (*pound(), "f + L 的底筆"))
    def currency():
        o = S.path("o", affine(0.55, 0.55))
        o = S.at(o, cx=330, cy=380)
        parts = [o]
        for ang, dx, dy in [(45, -1, 1), (-45, 1, 1), (-45, -1, -1), (45, 1, -1)]:
            parts.append(bar(150, 75, 330 + dx * 165, 380 + dy * 165, ang))
        return S.union(*parts), 660
    sp(0x00A4, lambda: (*currency(), "o 縮 0.55 + 四段 hyphen 斜筆"))
    def yen():
        Y = S.path("Y")
        b = Y.bounds
        cx = (b[0] + b[2]) / 2
        return S.union(Y, bar(380, 60, cx, 330), bar(380, 60, cx, 190)), S.adv("Y")
    sp(0x00A5, lambda: (*yen(), "Y + 兩道 hyphen"))
    def brokenbar():
        bb = S.path("bar")
        return S.union(S.crop(bb, y1=320), S.crop(bb, y0=440)), S.adv("bar")
    sp(0x00A6, lambda: (*brokenbar(), "bar 中段截去"))
    def section():
        s1 = S.path("s", affine(0.72, 0.72))
        s2 = S.at(s1, bottom=-60)
        s1 = S.at(s1, bottom=330)
        return S.union(s1, s2), S.adv("s") * 0.85
    sp(0x00A7, lambda: (*section(), "兩個 s 縮 0.72 上下疊"))
    sp(0x00A8, lambda: (S.at(marks["dieresis"], cx=230, bottom=p["lc_base"]), 460, "分音符單獨"))
    def circled(inner, how):
        O = S.path("O")
        b = O.bounds
        i = S.path(inner, affine(0.42, 0.42))
        i = S.at(i, cx=(b[0] + b[2]) / 2, cy=(b[1] + b[3]) / 2)
        return S.union(O, i), S.adv("O"), how
    sp(0x00A9, lambda: circled("C", "O + C 縮 0.42 置中"))
    sp(0x00AE, lambda: circled("R", "O + R 縮 0.42 置中"))
    def ordinal(ch):
        g = S.path(ch, affine(0.55, 0.55))
        g = S.at(g, left=20, bottom=470)
        gb = g.bounds
        u = bar(gb[2] - gb[0], 55, (gb[0] + gb[2]) / 2, 400)
        return S.union(g, u), gb[2] + 60
    sp(0x00AA, lambda: (*ordinal("a"), "a 縮 0.55 上標 + hyphen 底線"))
    sp(0x00BA, lambda: (*ordinal("o"), "o 縮 0.55 上標 + hyphen 底線"))
    def chevron(n, rot):
        v = S.path("v", affine(0.55, 0.62, rot))
        v = S.at(v, left=30, cy=xh_mid)
        parts = [v]
        w = v.bounds[2] - v.bounds[0]
        for k in range(1, n):
            parts.append(S.tf(v, move(k * (w * 0.75), 0)))
        g = S.union(*parts)
        return g, g.bounds[2] + 40
    sp(0x00AB, lambda: (*chevron(2, -90), "v 轉 -90 度縮小，兩個併排"))
    sp(0x00BB, lambda: (*chevron(2, 90), "v 轉 90 度縮小，兩個併排"))
    sp(0x2039, lambda: (*chevron(1, -90), "v 轉 -90 度縮小"))
    sp(0x203A, lambda: (*chevron(1, 90), "v 轉 90 度縮小"))
    sp(0x003C, lambda: (S.at(S.path("v", affine(0.70, 0.80, -90)), left=40, cy=xh_mid + 50), 620, "v 轉 -90 度"))
    sp(0x003E, lambda: (S.at(S.path("v", affine(0.70, 0.80, 90)), left=40, cy=xh_mid + 50), 620, "v 轉 90 度"))
    def notsign():
        h = S.path("hyphen")
        hb = h.bounds
        h = S.at(S.tf(h, affine(1.4, 1)), left=40, cy=420)
        hbb = h.bounds
        v = bar(170, hbb[3] - hbb[1], hbb[2] - 50, hbb[1] - 60, 90)
        return S.union(h, v), hbb[2] + 50
    sp(0x00AC, lambda: (*notsign(), "hyphen 拉長 + hyphen 轉 90 度"))
    sp(0x00AD, lambda: (S.path("hyphen"), S.adv("hyphen"), "同 hyphen"))
    sp(0x00AF, lambda: (S.at(marks["macron"], left=20, bottom=p["lc_base"] + 50), S.adv("hyphen"), "長音符單獨"))
    sp(0x00B0, lambda: (S.at(marks["ring"], left=40, bottom=560), 360, "o 縮 0.36"))
    def plusminus():
        pl = S.path("plus")
        pb = pl.bounds
        pl = S.tf(pl, move(0, 120))
        m = bar(pb[2] - pb[0], 90, (pb[0] + pb[2]) / 2, 150)
        return S.union(pl, m), S.adv("plus")
    sp(0x00B1, lambda: (*plusminus(), "plus 上移 + hyphen"))
    def sup(ch):
        g = S.path(ch, affine(0.55, 0.55))
        g = S.at(g, left=20, bottom=430)
        return g, g.bounds[2] + 50
    sp(0x00B2, lambda: (*sup("two"), "two 縮 0.55 上標"))
    sp(0x00B3, lambda: (*sup("three"), "three 縮 0.55 上標"))
    sp(0x00B9, lambda: (*sup("one"), "one 縮 0.55 上標"))
    sp(0x00B4, lambda: (S.at(marks["acute"], left=40, bottom=p["lc_base"]), 300, "尖音符單獨"))
    def pilcrow():
        blob = S.tf(period, affine(1.6, 2.3))
        blob = S.at(blob, left=30, top=820)
        b = blob.bounds
        st = S.tf(S.crop(S.path("bar"), y0=-150, y1=830), affine(0.6, 1))
        s1 = S.at(st, left=b[2] - 40, top=840)
        s2 = S.at(st, left=b[2] + 90, top=840)
        top = bar(s2.bounds[2] - b[0], 70, (b[0] + s2.bounds[2]) / 2, 800)
        g = S.union(blob, s1, s2, top)
        return g, g.bounds[2] + 50
    sp(0x00B6, lambda: (*pilcrow(), "period 放大 + bar 截段兩支 + hyphen"))
    sp(0x00B7, lambda: (S.at(S.tf(period, affine(0.8, 0.8)), left=30, cy=380), 250, "period 縮 0.80 置中高"))
    sp(0x00B8, lambda: (S.at(marks["cedilla"], left=40, top=40), 260, "下加符單獨"))
    def frac(a, b_):
        n1 = S.path(a, affine(0.45, 0.45))
        n1 = S.at(n1, left=20, bottom=400)
        n2 = S.path(b_, affine(0.45, 0.45))
        sl = S.path("slash", affine(0.85, 0.85))
        sl = S.at(sl, left=n1.bounds[2] - 60, bottom=-80)
        n2 = S.at(n2, left=sl.bounds[2] - 70, bottom=-10)
        g = S.union(n1, sl, n2)
        return g, g.bounds[2] + 50
    sp(0x00BC, lambda: (*frac("one", "four"), "one、four 縮 0.45 + slash"))
    sp(0x00BD, lambda: (*frac("one", "two"), "one、two 縮 0.45 + slash"))
    sp(0x00BE, lambda: (*frac("three", "four"), "three、four 縮 0.45 + slash"))
    def times():
        pl = S.path("plus", affine(0.85, 0.85, 45))
        return S.at(pl, left=40, cy=450), S.adv("plus")
    sp(0x00D7, lambda: (*times(), "plus 轉 45 度縮 0.85"))
    def divide():
        h = S.path("hyphen")
        hb = h.bounds
        h = S.at(S.tf(h, affine(1.2, 0.8)), left=30, cy=440)
        b = h.bounds
        cx = (b[0] + b[2]) / 2
        d = S.tf(period, affine(0.6, 0.6))
        return S.union(h, S.at(d, cx=cx, bottom=b[3] + 40), S.at(d, cx=cx, top=b[1] - 40)), b[2] + 40
    sp(0x00F7, lambda: (*divide(), "hyphen + 兩個 period 縮 0.6"))
    sp(0x00A0, None)  # 原字型已有

    # ---- 一般標點 ----
    sp(0x2019, lambda: (S.at(quoteright, left=20), S.adv("quotesingle") + 20, "comma 上移 680"))
    sp(0x2018, lambda: (S.at(S.tf(comma, affine(1, 1, 180)), left=30, bottom=quoteright.bounds[1]), S.adv("quotesingle") + 20, "comma 轉 180 度上移"))
    sp(0x201A, lambda: (S.at(comma, left=20), S.adv("comma"), "同 comma"))
    def dbl(src, bottom):
        a = S.at(src, left=20, bottom=bottom)
        w = a.bounds[2] - a.bounds[0]
        g = S.union(a, S.tf(a, move(w + 50, 0)))
        return g, g.bounds[2] + 40
    sp(0x201C, lambda: (*dbl(S.tf(comma, affine(1, 1, 180)), quoteright.bounds[1]), "兩個 comma 轉 180 度上移"))
    sp(0x201D, lambda: (*dbl(quoteright, quoteright.bounds[1]), "兩個 comma 上移"))
    sp(0x201E, lambda: (*dbl(comma, comma.bounds[1]), "兩個 comma"))
    def ellipsis():
        d = S.tf(period, affine(0.85, 0.85))
        w = d.bounds[2] - d.bounds[0]
        parts = [S.at(d, left=40 + k * (w + 90), bottom=0) for k in range(3)]
        g = S.union(*parts)
        return g, g.bounds[2] + 40
    sp(0x2026, lambda: (*ellipsis(), "三個 period 縮 0.85"))
    sp(0x2022, lambda: (S.at(S.tf(period, affine(1.2, 1.2)), left=40, cy=380), 360, "period 放大 1.2 置中高"))
    sp(0x0060, lambda: (S.at(marks["grave"], left=60, bottom=p["lc_base"]), 330, "抑音符單獨"))
    sp(0x007E, lambda: (S.at(marks["tilde"], left=40, cy=420), 460, "s 轉 90 度壓扁"))

    def dash(target):
        hb = hy.bounds
        xa, xb = hb[0] + 90, hb[2] - 90
        k = (target - (hb[2] - hb[0])) / (xb - xa) + 1
        shift = (xb - xa) * (k - 1)

        class Stretch:
            def __init__(self, pen): self.pen = pen
            def _t(self, pt):
                x, y = pt
                nx = x if x <= xa else (xa + (x - xa) * k if x < xb else x + shift)
                return (nx + 40, y)
            def moveTo(self, pt): self.pen.moveTo(self._t(pt))
            def lineTo(self, pt): self.pen.lineTo(self._t(pt))
            def qCurveTo(self, *pts): self.pen.qCurveTo(*[self._t(q) if q is not None else None for q in pts])
            def curveTo(self, *pts): self.pen.curveTo(*[self._t(q) for q in pts])
            def closePath(self): self.pen.closePath()
            def endPath(self): self.pen.endPath()
        q = pathops.Path()
        S.gs["hyphen"].draw(Stretch(q.getPen()))
        return q
    sp(0x2014, lambda: (dash(p["emdash_target"]), p["emdash_adv"], f"hyphen 兩端各 90 不動、中段拉長到總寬 {p['emdash_target']}"))
    sp(0x2013, lambda: (dash(p["endash_target"]), p["endash_adv"], f"hyphen 兩端各 90 不動、中段拉長到總寬 {p['endash_target']}"))

    # ---- 依序產生 ----
    for cp in TARGET:
        if cp in have:
            continue
        if cp in special and special[cp] is not None:
            path, adv, how = special[cp]()
            put(cp, path, adv, how)
        elif not compose(cp):
            log.append(f"Radio Newsman 未補 U+{cp:04X} {chr(cp)}")

    # 行距：hhea 與 typo 不動（行框不變）；winAscent／winDescent 放到涵蓋所有字形，免 Windows GDI 裁切
    ymax = max(getattr(f["glyf"][n], "yMax", 0) for n in f.getGlyphOrder())
    ymin = min(getattr(f["glyf"][n], "yMin", 0) for n in f.getGlyphOrder())
    os2 = f["OS/2"]
    os2.usWinAscent = max(os2.usWinAscent, int(ymax + p["win_ascent_pad"]))
    os2.usWinDescent = max(os2.usWinDescent, int(-ymin + p["win_ascent_pad"]))
    for t in ("DSIG", "hdmx", "LTSH", "VDMX", "FFTM"):
        if t in f:
            del f[t]
    rename(f, "Radio Newsman Phenom", "Regular")
    f["maxp"].numGlyphs = len(f.getGlyphOrder())
    f["head"].recalcBBoxes = True
    f.save(BUILD + "RadioNewsmanPhenom.ttf")
    return added, (ymax, ymin, os2.usWinAscent, os2.usWinDescent)


# ------------------------------------------------------------------ Erikas Farbband

def contours_of(glyf, name):
    g = glyf[name]
    coords, ends, flags = g.getCoordinates(glyf)
    out, s = [], 0
    for e in ends:
        out.append((list(coords[s:e + 1]), list(flags[s:e + 1])))
        s = e + 1
    return out


def build_erikas(fn, family_style, out_name, log):
    f = TTFont(SRC + fn, recalcTimestamp=False)
    glyf = f["glyf"]
    S = Shapes(f)
    cm = S.cmap
    added = []

    def append_simple(newname, pieces, adv, cps, how):
        """pieces: [(coords, flags)] 直接串接為一個簡單字形（同向輪廓疊合，nonzero 填色不相消）。"""
        from fontTools.ttLib.tables._g_l_y_f import GlyphCoordinates
        from fontTools.ttLib.tables import ttProgram
        coords, flags, ends = [], [], []
        for c, fl in pieces:
            coords += c
            flags += fl
            ends.append(len(coords) - 1)
        ng = Glyph()
        ng.numberOfContours = len(ends)
        ng.coordinates = GlyphCoordinates(coords)
        ng.flags = bytearray(flags)
        ng.endPtsOfContours = ends
        ng.program = ttProgram.Program()
        ng.program.fromBytecode(b"")
        f.setGlyphOrder(f.getGlyphOrder() + [newname])
        glyf[newname] = ng
        ng.recalcBounds(glyf)
        f["hmtx"][newname] = (adv, ng.xMin)
        map_cps(f, newname, cps)
        for cp in cps:
            added.append((cp, how))

    def path_pieces(path):
        """skia 路徑 → [(coords, flags)]（二次曲線）。"""
        pen = TTGlyphPen(None)
        pathops.simplify(path, clockwise=S.cw).draw(Cu2QuPen(pen, 1.0, reverse_direction=False))
        g = pen.glyph()
        if g.numberOfContours <= 0:
            return []
        c, e, fl = g.coordinates, g.endPtsOfContours, g.flags
        out, s = [], 0
        for end in e:
            out.append(([tuple(x) for x in c[s:end + 1]], list(fl[s:end + 1])))
            s = end + 1
        return out

    adv = f["hmtx"]["e"][0]  # 等寬
    # ē：ō 的長音筆形疊到 e 上（ō 減 o 的那幾條輪廓），網點用 e 自己的
    e_name, o_name, om_name = cm[0x65], cm[0x6F], cm[0x14D]
    e_c = contours_of(glyf, e_name)
    o_c = contours_of(glyf, o_name)
    om_c = contours_of(glyf, om_name)
    o_set = {tuple(map(tuple, c)) for c, _ in o_c}
    macron = [(c, fl) for c, fl in om_c if tuple(map(tuple, c)) not in o_set and min(y for _, y in c) >= 470 and len(c) > 8]
    if not macron:
        log.append(f"{fn}：ō 裡找不到長音輪廓")
    be, bo = S.path(e_name).bounds, S.path(o_name).bounds
    dx = round(((be[0] + be[2]) - (bo[0] + bo[2])) / 2)
    macron = [([(x + dx, y) for x, y in c], fl) for c, fl in macron]
    append_simple("emacron", e_c + macron, adv, [0x113], f"e + ō 的長音輪廓（{len(macron)} 條），網點用 e 的")

    # ŋ Ŋ：n／N 去右腳底襯線，接 j 的下鉤（取 j 的主輪廓裁 y<40）
    def eng(base_cp, newname, cp):
        bname = cm[base_cp]
        bpath = S.path(bname)
        r = S.runs(bname, 200)
        rr = r[-1]
        jname = cm[0x6A]
        jmain = max(contours_of(glyf, jname), key=lambda t: len(t[0]))
        jp = pathops.Path()
        pen = jp.getPen()
        pts = jmain[0]
        # 以 TTGlyphPen 重建 j 主輪廓的路徑
        tmp = Glyph()
        from fontTools.ttLib.tables._g_l_y_f import GlyphCoordinates
        tmp.numberOfContours = 1
        tmp.coordinates = GlyphCoordinates(pts)
        tmp.flags = bytearray(jmain[1])
        tmp.endPtsOfContours = [len(pts) - 1]
        tmp.draw(pen, glyf)
        jr = S.runs(jname, 200)
        jstem = max(jr, key=lambda t: t[1] - t[0])
        hook = S.crop(jp, y1=40)
        hook = S.tf(hook, move(rr[1] - jstem[1], 0))
        # 基字：去掉右腳 y<110 的部分（底襯線），保留右腳本身
        body = S.cut(bpath, rr[0] - 40, -2000, 4000, 110)
        keep = S.crop(bpath, rr[0], -2000, rr[1], 120)
        main = path_pieces(S.union(body, keep, hook))
        append_simple(newname, main, adv, [cp], f"{chr(base_cp)} 去右腳底襯線 + j 下鉤（j 主輪廓裁 y<40）")
    eng(0x6E, "eng", 0x14B)
    eng(0x4E, "Eng", 0x14A)

    # U+00A0：對應 space
    if 0xA0 not in cm:
        map_cps(f, cm[0x20], [0xA0])
        added.append((0xA0, "對應 space 字形"))

    for t in ("DSIG", "hdmx", "LTSH", "VDMX", "FFTM"):
        if t in f:
            del f[t]
    rename(f, "Erikas Farbband Phenom", family_style)
    f["maxp"].numGlyphs = len(f.getGlyphOrder())
    f.save(BUILD + out_name)
    return added


def subset(ttf, woff2, ranges, added):
    """子集 = 完整檔落在 ranges 內的碼位 ∪ 本次補入的碼位。範圍與補字前的子集相同，
    不因改作版而多收原字型其他區塊（Erikas 的製表符、私用區等），免得別站 font-accent 的字面跟著變。"""
    f = TTFont(ttf)
    cps = sorted({c for c in f.getBestCmap() if any(lo <= c <= hi for lo, hi in ranges)} | {cp for cp, _ in added})
    unis = ",".join("%04X" % c for c in cps)
    subprocess.run([sys.executable, "-m", "fontTools.subset", ttf, f"--unicodes={unis}", "--flavor=woff2",
                    "--layout-features=*", "--name-IDs=*", "--name-legacy", "--name-languages=*",
                    "--notdef-outline", f"--output-file={woff2}"], check=True)


if __name__ == "__main__":
    os.makedirs(BUILD, exist_ok=True)
    log = []
    rn_added, metrics = build_radio(log)
    er_added = build_erikas("erikas-farbband.ttf", "Regular", "ErikasFarbbandPhenom.ttf", log)
    eb_added = build_erikas("erikas-farbband-bold.ttf", "Bold", "ErikasFarbbandPhenom-Bold.ttf", log)
    subset(BUILD + "RadioNewsmanPhenom.ttf", FONTS + "RadioNewsman-subset.woff2", [(0x20, 0x7E), (0xA0, 0x17F), (0x2000, 0x206F)], rn_added)
    # Erikas：補字前的子集是原檔在 U+0020–024F、2000–206F、20A0–20BF 的全部碼位（340 個），範圍照舊再加補入的碼位
    subset(BUILD + "ErikasFarbbandPhenom.ttf", FONTS + "ErikasFarbband-subset.woff2", ERIKAS_RANGES, er_added)
    subset(BUILD + "ErikasFarbbandPhenom-Bold.ttf", FONTS + "ErikasFarbband-Bold-subset.woff2", ERIKAS_RANGES, eb_added)
    with open(HERE + "added-codepoints.tsv", "w") as fh:
        fh.write("字型\t碼位\t字\t組法\n")
        for font, rows in (("Radio Newsman Phenom", rn_added), ("Erikas Farbband Phenom Regular", er_added),
                           ("Erikas Farbband Phenom Bold", eb_added)):
            for cp, how in sorted(rows):
                fh.write(f"{font}\tU+{cp:04X}\t{chr(cp) if cp != 0xA0 else '(NBSP)'}\t{how}\n")
    print("Radio Newsman 補入", len(rn_added), "；Erikas regular", len(er_added), "；bold", len(eb_added))
    print("Radio Newsman 字形頂 %d、底 %d；winAscent %d、winDescent %d" % metrics)
    for line in log:
        print("注意：", line)
