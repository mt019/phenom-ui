"""把汇文明朝体的 U+3008、U+3009 兩個字裁出來，字寬由半形改成全形。

由 scripts/build-angle-bracket-face.mjs 呼叫，不單獨執行。
用法：<python> angle_bracket_face.py <來源 ttf> <輸出 woff2>

汇文明朝体把這兩個碼位畫成半形（advance 512，em 1024），同一支字型的《》「」（）
都是全形。半形的角括號沒有兩側留白，排在漢字之間會貼著相鄰的筆畫。這支程式只改
advance 與位移，字形的輪廓一個點都不動。

置中而不靠邊：汇文自己的《》外框 267–756、「」外框 296–727，兩組都是置中，新的
〈〉照同一個作法。位移量由實際外框算出來，不寫死。

layout 表（GSUB、GPOS）整個丟掉。留著的話，字型自己的 halt／palt 之類特性會在改過
的 advance 之上再調一次，兩層疊起來的結果沒有人驗得了。
"""
import sys

from fontTools.subset import Options, Subsetter
from fontTools.ttLib import TTFont

CODEPOINTS = [0x3008, 0x3009]


def main(src_path: str, out_path: str) -> int:
    font = TTFont(src_path)
    upm = font["head"].unitsPerEm

    options = Options()
    options.layout_features = []
    options.drop_tables += ["GSUB", "GPOS", "GDEF"]
    options.notdef_outline = True
    options.recalc_bounds = True
    subsetter = Subsetter(options=options)
    subsetter.populate(unicodes=CODEPOINTS)
    subsetter.subset(font)

    cmap = font.getBestCmap()
    glyf = font["glyf"]
    hmtx = font["hmtx"]
    report = []
    for codepoint in CODEPOINTS:
        name = cmap.get(codepoint)
        if name is None:
            print(f"來源字型沒有 U+{codepoint:04X}：{src_path}", file=sys.stderr)
            return 1
        glyph = glyf[name]
        if glyph.isComposite():
            print(f"U+{codepoint:04X} 是複合字形，這支程式只處理單純字形", file=sys.stderr)
            return 1
        glyph.recalcBounds(glyf)
        before_advance, before_lsb = hmtx[name]
        ink = glyph.xMax - glyph.xMin
        if ink > upm:
            print(f"U+{codepoint:04X} 的字形寬 {ink} 超過 em {upm}，置中會溢出", file=sys.stderr)
            return 1
        dx = round((upm - ink) / 2) - glyph.xMin
        glyph.coordinates.translate((dx, 0))
        glyph.recalcBounds(glyf)
        hmtx[name] = (upm, glyph.xMin)
        report.append(
            f"  U+{codepoint:04X} {name}：advance {before_advance} → {upm}，"
            f"lsb {before_lsb} → {glyph.xMin}，字形寬 {ink}，位移 {dx:+}"
        )

    # 兩個字都變寬了，整體的 advanceWidthMax 要跟著；不改的話 hhea 與 hmtx 對不上。
    font["hhea"].advanceWidthMax = max(hmtx[name][0] for name in font.getGlyphOrder())

    font.flavor = "woff2"
    font.save(out_path)
    print("\n".join(report))
    return 0


if __name__ == "__main__":
    if len(sys.argv) != 3:
        print(__doc__, file=sys.stderr)
        raise SystemExit(2)
    raise SystemExit(main(sys.argv[1], sys.argv[2]))
