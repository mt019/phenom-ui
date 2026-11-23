#!/usr/bin/env python3
"""補字前後同一標題的行框高度（headless Chrome，getBoundingClientRect）。

    python3 measure_line_box.py
原字型取 Translation 倉的 radio-newsman.ttf，補字版取本倉 fonts/RadioNewsman-subset.woff2。
三種行高：1.25（PageIdentity 的 leading-tight）、normal、1.375（leading-snug）。
"""
import os
import re
import subprocess

H = os.path.dirname(os.path.abspath(__file__)) + "/"
FONTS = os.path.abspath(H + "../../fonts") + "/"
SRC = "/Users/iw/Documents/NTU/1142/Translation/_Assets/fonts/categories/typewriter-latin/"
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
T = "我的博士導師、歐洲道家─Günter Wohlfart"
rows = "".join(
    f'<h1 style="line-height:{lh};font-family:{fam},\'Songti TC\'" data-k="{lh} {fam}">{T}</h1>'
    for lh in ("1.25", "normal", "1.375") for fam in ("RNo", "RNp"))
html = f"""<meta charset=utf-8><style>
@font-face{{font-family:RNo;src:url(file://{SRC}radio-newsman.ttf)}}
@font-face{{font-family:RNp;src:url(file://{FONTS}RadioNewsman-subset.woff2)}}
h1{{font-size:30px;margin:0;font-weight:400}}</style>{rows}<pre id=o></pre><script>
document.fonts.ready.then(()=>{{document.getElementById('o').textContent='RESULT '+[...document.querySelectorAll('h1')]
.map(h=>h.dataset.k+'='+h.getBoundingClientRect().height.toFixed(2)).join(' | ')}})</script>"""
open(H + "line-box.html", "w", encoding="utf-8").write(html)
out = subprocess.run([CHROME, "--headless=new", "--disable-gpu", "--virtual-time-budget=3000", "--dump-dom",
                      f"file://{H}line-box.html"], capture_output=True, text=True).stdout
print(re.search(r"RESULT [^<]*", out).group(0))
