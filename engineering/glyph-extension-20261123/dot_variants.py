"""分音符點大小對照：以 build_composites.build_radio() 依不同 dot_scale 各出一份字型，渲染成 dot-variants.png。

用法：/usr/local/bin/python3.13 dot_variants.py（或 index.md 所記的 python3.13）
產物：dot-<scale>.ttf 為對照用暫存，渲染完即刪；只留 dot-variants.png。
"""
import os
import shutil
import subprocess
import tempfile

import build_composites as bc

H = bc.OUT
# (dot_scale, dot_half_gap)：點放大時兩點中心距同步加寬，避免點相碰。
VARIANTS = [(0.70, 140), (0.85, 150), (1.00, 160), (1.15, 170)]

fonts = []
for s, g in VARIANTS:
    bc.RN["dot_scale"], bc.RN["dot_half_gap"] = s, g
    bc.build_radio()
    dst = f"{H}dot-{s:.2f}.ttf"
    shutil.move(H + "RadioNewsmanPhenom-sample.ttf", dst)
    fonts.append((s, dst))
# 恢復樣張字型為原參數
bc.RN["dot_scale"], bc.RN["dot_half_gap"] = 1.00, 160
bc.build_radio()

faces = "".join(f"@font-face{{font-family:D{i};src:url(file://{p})}}" for i, (_, p) in enumerate(fonts))
rows = "".join(
    f'<div class="lab">dot_scale {s:.2f}</div><div class="t" style="font-family:D{i}">Günter Wohlfart · Möbius · Ü Ä Ö</div>'
    for i, (s, _) in enumerate(fonts)
)
html = f"""<!doctype html><meta charset="utf-8"><style>{faces}
body{{margin:24px;background:#fbf8f2;color:#1c1a18}}
.lab{{font:13px sans-serif;color:#666;margin-top:14px}}.t{{font-size:64px;line-height:1.25}}</style>{rows}"""
tmp = tempfile.NamedTemporaryFile("w", suffix=".html", delete=False, dir=H)
tmp.write(html)
tmp.close()
chrome = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
subprocess.run([chrome, "--headless=new", "--disable-gpu", "--hide-scrollbars", "--window-size=1500,760",
                f"--screenshot={H}dot-variants.png", f"file://{tmp.name}"], check=True,
               stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
os.remove(tmp.name)
for _, p in fonts:
    os.remove(p)
print("ok", H + "dot-variants.png")
