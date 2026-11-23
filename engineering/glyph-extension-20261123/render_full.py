#!/usr/bin/env python3
"""全量樣張：以 headless Chrome 用實際字型檔渲染。

    python3 render_full.py          （只用標準庫；需要 /Applications/Google Chrome.app）
產物：specimen-full.png（所有補入字形與實際集名，上排原字型、下排補字版）、zoom-full.png（ß ø æ œ ł 放大）。
原字型取 Translation 倉的來源 ttf（缺字落到明體，與站上落到汇文明體同一類狀況）；補字版取
本倉 fonts/ 底下實際出貨的 woff2 子集。
"""
import os
import subprocess

H = os.path.dirname(os.path.abspath(__file__)) + "/"
FONTS = os.path.abspath(H + "../../fonts") + "/"
SRC = "/Users/iw/Documents/NTU/1142/Translation/_Assets/fonts/categories/typewriter-latin/"
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

ADDED = []
for line in open(H + "added-codepoints.tsv", encoding="utf-8").read().splitlines()[1:]:
    font, cp, ch, _ = line.split("\t", 3)
    ADDED.append((font, int(cp[2:], 16)))
rn = [chr(cp) for f, cp in ADDED if f.startswith("Radio") and cp != 0xA0]
er = sorted({chr(cp) for f, cp in ADDED if f.startswith("Erikas") and cp != 0xA0})

TITLES = [
    "我的博士導師、歐洲道家─Günter Wohlfart",
    "獨特性的秘密：吾師Jean-François Marquet",
    "家鄉味：煎餅（Bánh Xèo）",
    "Hegel’s “Logik” — Möbius · Café · Ōno…",
    "Straße · Dvořák · Łódź · Œuvres · Ærø",
]
CHUNK = 24

css = f"""
@font-face{{font-family:RNo;src:url(file://{SRC}radio-newsman.ttf)}}
@font-face{{font-family:RNp;src:url(file://{FONTS}RadioNewsman-subset.woff2)}}
@font-face{{font-family:ERo;src:url(file://{SRC}erikas-farbband.ttf)}}
@font-face{{font-family:ERp;src:url(file://{FONTS}ErikasFarbband-subset.woff2)}}
@font-face{{font-family:EBo;src:url(file://{SRC}erikas-farbband-bold.ttf);font-weight:700}}
@font-face{{font-family:EBp;src:url(file://{FONTS}ErikasFarbband-Bold-subset.woff2);font-weight:700}}
body{{margin:28px;background:#fbf8f1;color:#1c1a17;font-family:'Songti TC',serif;width:1640px}}
h2{{font:600 17px -apple-system,sans-serif;margin:26px 0 6px}}
.l{{font:13px -apple-system,sans-serif;color:#6b655c;margin:8px 0 0}}
.o,.p{{font-size:46px;line-height:1.5;white-space:nowrap;letter-spacing:.04em}}
.o{{font-family:RNo,'Songti TC'}} .p{{font-family:RNp,'Songti TC';border-bottom:1px solid #d8d0c2;padding-bottom:6px}}
.t{{font-size:40px;line-height:1.35;white-space:nowrap}}
"""
rows = []
rows.append(f"<h2>Radio Newsman：補入 {len(rn)} 個字形（每組上排原字型、下排 Radio Newsman Phenom）</h2>")
for i in range(0, len(rn), CHUNK):
    seg = "".join(rn[i:i + CHUNK])
    rows.append(f'<div class="o">{seg}</div><div class="p">{seg}</div>')
rows.append("<h2>實際集名與講者名（上排原字型、下排補字版）</h2>")
for t in TITLES:
    rows.append(f'<div class="l">原字型</div><div class="t" style="font-family:RNo,\'Songti TC\'">{t}</div>'
                f'<div class="l">Radio Newsman Phenom</div><div class="t" style="font-family:RNp,\'Songti TC\'">{t}</div>')
sample = "".join(er) + " Rēne · Ŋaŋ · mēta"
rows.append("<h2>Erikas Farbband：補入 ē Ŋ ŋ（regular 與 bold，上排原字型、下排補字版）</h2>")
rows.append(f'<div class="t" style="font-family:ERo,\'Songti TC\'">{sample}</div>'
            f'<div class="t" style="font-family:ERp,\'Songti TC\'">{sample}</div>'
            f'<div class="t" style="font-family:EBo,\'Songti TC\';font-weight:700">{sample}</div>'
            f'<div class="t" style="font-family:EBp,\'Songti TC\';font-weight:700">{sample}</div>')
open(H + "specimen-full.html", "w", encoding="utf-8").write(f"<meta charset=utf-8><style>{css}</style>" + "".join(rows))

zoom = f"""<meta charset=utf-8><style>{css}
.z{{font-family:RNp;font-size:230px;line-height:1.15;white-space:nowrap}}
.zo{{font-family:RNo,'Songti TC';font-size:110px;line-height:1.2}}</style>
<div class="l">Radio Newsman Phenom，另畫字形放大，旁列字型原有的 u、B、o、l、f 作筆畫對照</div>
<div class="z">ß ø æ œ ł</div><div class="z" style="font-size:140px">Œ Æ Ø Ł Ŋ ŋ ð þ ſ</div>
<div class="z" style="font-size:170px">u B o l f e ü ö</div>"""
open(H + "zoom-full.html", "w", encoding="utf-8").write(zoom)


def shot(page, out, w, h):
    subprocess.run([CHROME, "--headless=new", "--disable-gpu", "--hide-scrollbars", f"--window-size={w},{h}",
                    "--force-device-scale-factor=1", "--virtual-time-budget=4000", f"--screenshot={out}",
                    f"file://{H}{page}"], check=True, capture_output=True)


nrows = (len(rn) + CHUNK - 1) // CHUNK
shot("specimen-full.html", H + "specimen-full.png", 1700, 260 + nrows * 150 + len(TITLES) * 140 + 330)
shot("zoom-full.html", H + "zoom-full.png", 1900, 720)
print("ok", H + "specimen-full.png", H + "zoom-full.png")
