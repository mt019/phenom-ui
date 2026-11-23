#!/usr/bin/env python3
"""下加符號（¸ ˛ 與下逗號）版本對照：依 build_full.TAILS 的各版本各產一份 Radio Newsman，
與原字型（ç 落到明體）並排放大，出 tails-variants.png 交站主挑。

    .venv/bin/python tails_variants.py      （環境同 build_full.py，另需 Chrome）
暫存字型寫在 build/tails-*.ttf（不進版控）；不動 fonts/ 底下的出貨子集。
"""
import os
import shutil
import subprocess

import build_full as bf

H = bf.HERE
SRC = bf.SRC
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
TEXT = "Çç Ąą Ęę Įį Ųų Şş Ţţ Ģģ Ķķ Ļļ Ņņ Ŗŗ ¸"
WORDS = "Jean-François · Garçon · Łódź Ąžuolas · Ķegums Ļaudona · Şişli"

os.makedirs(bf.BUILD, exist_ok=True)
keep = bf.TAILS["variant"]
fonts = []
for name in bf.TAILS["variants"]:
    bf.TAILS["variant"] = name
    bf.build_radio([])
    dst = f"{bf.BUILD}tails-{name}.ttf"
    shutil.copy(bf.BUILD + "RadioNewsmanPhenom.ttf", dst)
    fonts.append((name, dst))
bf.TAILS["variant"] = keep
bf.build_radio([])  # build/ 的完整檔回到 TAILS 目前選定的版本

# 第一版取 799254c 出貨的子集：全量重產之前 fonts/ 底下就是那一版
FIRST = os.path.abspath(H + "../../fonts/RadioNewsman-subset.woff2")
faces = f"@font-face{{font-family:O;src:url(file://{SRC}radio-newsman.ttf)}}@font-face{{font-family:F;src:url(file://{FIRST})}}" + "".join(
    f"@font-face{{font-family:V{n};src:url(file://{p})}}" for n, p in fonts)
def desc(n):
    v = bf.TAILS["variants"][n]
    src = {"comma": "整個 comma", "commatail": f"comma 裁去頭、只留 y<{v.get('tail_cut')} 的尾巴", "jhook": "j 的下鉤"}[v["shape"]]
    return (f"版本 {n}：下加符與反尾符取{src}，橫 {v['sx']}、縱 {v['sy']}，與基字間距 {v['gap']}"
            f"{'（疊入，細點相連）' if v['gap'] < 0 else ''}；下逗號縮 {v['cb_scale']}、留白 {v['cb_gap']}")
rows = ['<div class="l">原字型 Radio Newsman（缺字落到明體）</div>'
        f'<div class="t" style="font-family:O,\'Songti TC\'">{TEXT}</div>'
        f'<div class="w" style="font-family:O,\'Songti TC\'">{WORDS}</div>']
rows.append('<div class="l">第一版（站主 11-23 退回）：comma 等比 0.75、0.80，黏在基字上</div>'
            f'<div class="t" style="font-family:F">{TEXT}</div>')
for n, _ in fonts:
    rows.append(f'<div class="l">{desc(n)}</div><div class="t" style="font-family:V{n}">{TEXT}</div>'
                f'<div class="w" style="font-family:V{n}">{WORDS}</div>')
rows.append('<div class="l">放大：ç ą ņ，依序為原字型、第一版、' + '、'.join(n for n, _ in fonts) + '</div>')
zoom = [("原字型", "O,'Songti TC'"), ("第一版", "F")] + [(n, f"V{n}") for n, _ in fonts]
rows.append('<div class="zg">' + "".join(
    f'<div><div class="l">{lab}</div><div class="z" style="font-family:{fam}">çąņ</div></div>' for lab, fam in zoom) + "</div>")
html = f"""<!doctype html><meta charset=utf-8><style>{faces}
body{{margin:28px;background:#fbf8f1;color:#1c1a17;width:1800px}}
.l{{font:15px -apple-system,sans-serif;color:#5c564d;margin:22px 0 2px}}
.t{{font-size:64px;line-height:1.45;white-space:nowrap}} .w{{font-size:40px;line-height:1.4;white-space:nowrap}}
.z{{font-size:150px;line-height:1.25;white-space:nowrap}} .zg{{display:grid;grid-template-columns:repeat(3,1fr);column-gap:40px}}</style>{''.join(rows)}"""
open(H + "tails-variants.html", "w", encoding="utf-8").write(html)
subprocess.run([CHROME, "--headless=new", "--disable-gpu", "--hide-scrollbars", "--window-size=1860,2050",
                "--force-device-scale-factor=1", "--virtual-time-budget=4000",
                f"--screenshot={H}tails-variants.png", f"file://{H}tails-variants.html"], check=True, capture_output=True)
print("ok", H + "tails-variants.png")
