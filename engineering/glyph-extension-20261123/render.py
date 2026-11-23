#!/opt/homebrew/bin/python3.13
"""用 headless Chrome 以實際字型渲染對照圖（缺字會落到系統明體，與站上落到汇文明體同一類狀況）。"""
import os, subprocess, sys
H = os.path.dirname(os.path.abspath(__file__)) + "/"
SRC = "file:///Users/iw/Documents/NTU/1142/Translation/_Assets/fonts/categories/typewriter-latin/"
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
html = f"""<meta charset=utf-8><style>
@font-face{{font-family:RNo;src:url({SRC}radio-newsman.ttf)}}
@font-face{{font-family:RNp;src:url(file://{H}RadioNewsmanPhenom-sample.ttf)}}
@font-face{{font-family:EBo;src:url({SRC}erikas-farbband-bold.ttf)}}
@font-face{{font-family:EBp;src:url(file://{H}ErikasFarbbandPhenom-Bold-sample.ttf)}}
body{{margin:24px;background:#fbf8f1;color:#1c1a17;font-family:'Songti TC',serif;width:1400px}}
.l{{font:14px sans-serif;color:#777;margin:14px 0 2px}}
.r{{font-size:84px;line-height:1.35;white-space:nowrap}}
.s{{font-size:56px;line-height:1.4;white-space:nowrap}}
</style>
<div class=l>Radio Newsman 原字型（缺字落到明體）</div><div class=r style="font-family:RNo,'Songti TC'">Günter Wohlfart</div><div class=s style="font-family:RNo,'Songti TC'">Möbius · Café · Ōno — it’s ä Ü ā ō è</div>
<div class=l>Radio Newsman Phenom 樣張</div><div class=r style="font-family:RNp,'Songti TC'">Günter Wohlfart</div><div class=s style="font-family:RNp,'Songti TC'">Möbius · Café · Ōno — it’s ä Ü ā ō è</div>
<div class=l>Erikas Farbband Bold 原字型 ē</div><div class=r style="font-family:EBo,'Songti TC'">Ēō Rēne mēta</div>
<div class=l>Erikas Farbband Phenom Bold 樣張 ē</div><div class=r style="font-family:EBp,'Songti TC'">Ēō Rēne mēta</div>"""
open(H+"compare.html","w").write(html)
def shot(page, out, w, h):
    subprocess.run([CHROME,"--headless=new","--disable-gpu","--hide-scrollbars",f"--window-size={w},{h}","--force-device-scale-factor=1",f"--screenshot={out}",f"file://{H}{page}"],check=True,capture_output=True)
shot("compare.html", H+"compare.png", 1450, 1250)
zoom = f"""<meta charset=utf-8><style>
@font-face{{font-family:RNp;src:url(file://{H}RadioNewsmanPhenom-sample.ttf)}}
body{{margin:30px;background:#fbf8f1;color:#1c1a17;font-family:RNp;font-size:300px;line-height:1.2;white-space:nowrap}}
</style>ü u . : ö<br><span style="font-size:170px">ä é è ā ō Ü ’ — Ü·u</span>"""
open(H+"zoom.html","w").write(zoom)
shot("zoom.html", H+"zoom-u.png", 1500, 820)
