#!/usr/bin/env python3
"""D 版下加符號（j 的下鉤）三種尺寸對照，只渲染，不動 fonts/ 的出貨子集與 TAILS 的選定值。

    .venv/bin/python tails_d_sizes.py      （環境同 build_full.py，另需 Chrome）
產物：tails-d-sizes.png；暫存字型 build/tails-d-*.ttf（不進版控）。
"""
import shutil
import subprocess

import build_full as bf

H = bf.HERE
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
SIZES = [("D 原樣", 0.42, 0.55), ("D 縱 0.70", 0.42, 0.70), ("D 橫 0.52、縱 0.70", 0.52, 0.70)]
LINE = "Çç Ąą Ęę Įį Ųų Şş Ţţ"
WORDS = "Jean-François · Garçon · Şişli"

keep = bf.TAILS["variant"]
base = dict(bf.TAILS["variants"]["D"])
fonts = []
for i, (label, sx, sy) in enumerate(SIZES):
    bf.TAILS["variants"]["_tmp"] = dict(base, sx=sx, sy=sy)
    bf.TAILS["variant"] = "_tmp"
    bf.build_radio([])
    dst = f"{bf.BUILD}tails-d-{i}.ttf"
    shutil.copy(bf.BUILD + "RadioNewsmanPhenom.ttf", dst)
    fonts.append((label, sx, sy, dst))
del bf.TAILS["variants"]["_tmp"]
bf.TAILS["variant"] = keep
bf.build_radio([])  # build/ 的完整檔回到選定版本

faces = "".join(f"@font-face{{font-family:S{i};src:url(file://{p})}}" for i, (_, _, _, p) in enumerate(fonts))
rows = []
for i, (label, sx, sy, _) in enumerate(fonts):
    rows.append(f'<div class="l">{label}：j 的下鉤，橫 {sx}、縱 {sy}，與基字間距 {base["gap"]}</div>'
                f'<div class="t" style="font-family:S{i}">{LINE}</div><div class="w" style="font-family:S{i}">{WORDS}</div>')
rows.append('<div class="l">放大：ç ą ş</div><div class="zg">' + "".join(
    f'<div><div class="l">{label}</div><div class="z" style="font-family:S{i}">çąş</div></div>'
    for i, (label, _, _, _) in enumerate(fonts)) + "</div>")
html = f"""<!doctype html><meta charset=utf-8><style>{faces}
body{{margin:28px;background:#fbf8f1;color:#1c1a17;width:1800px}}
.l{{font:15px -apple-system,sans-serif;color:#5c564d;margin:22px 0 2px}}
.t{{font-size:72px;line-height:1.45;white-space:nowrap}} .w{{font-size:48px;line-height:1.4;white-space:nowrap}}
.zg{{display:grid;grid-template-columns:repeat(3,1fr);column-gap:40px}} .z{{font-size:170px;line-height:1.3;white-space:nowrap}}</style>{''.join(rows)}"""
open(H + "tails-d-sizes.html", "w", encoding="utf-8").write(html)
subprocess.run([CHROME, "--headless=new", "--disable-gpu", "--hide-scrollbars", "--window-size=1860,1320",
                "--force-device-scale-factor=1", "--virtual-time-budget=4000",
                f"--screenshot={H}tails-d-sizes.png", f"file://{H}tails-d-sizes.html"], check=True, capture_output=True)
print("ok", H + "tails-d-sizes.png")
