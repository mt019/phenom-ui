import sys
from fontTools.ttLib import TTFont
from fontTools.pens.basePen import BasePen
from PIL import Image, ImageDraw, ImageChops
class Poly(BasePen):
    def __init__(s,gs): super().__init__(gs); s.polys=[]; s.cur=[]
    def _moveTo(s,p): s.cur=[p]
    def _lineTo(s,p): s.cur.append(p)
    def _curveToOne(s,a,b,c):
        x0,y0=s.cur[-1]
        for i in range(1,9):
            t=i/8; mt=1-t
            s.cur.append((mt**3*x0+3*mt*mt*t*a[0]+3*mt*t*t*b[0]+t**3*c[0], mt**3*y0+3*mt*mt*t*a[1]+3*mt*t*t*b[1]+t**3*c[1]))
    def _qCurveToOne(s,a,b):
        x0,y0=s.cur[-1]
        for i in range(1,7):
            t=i/6; mt=1-t
            s.cur.append((mt*mt*x0+2*mt*t*a[0]+t*t*b[0], mt*mt*y0+2*mt*t*a[1]+t*t*b[1]))
    def _closePath(s): s.polys.append(s.cur); s.cur=[]
def sheet(fontpath, names, out, cols=6, sc=0.3):
    f=TTFont(fontpath); gs=f.getGlyphSet(); cm=f.getBestCmap()
    W=int(1300*sc); H=int(1500*sc)
    rows=(len(names)+cols-1)//cols
    im=Image.new("L",(W*cols,H*rows),255); d=ImageDraw.Draw(im)
    for k,n in enumerate(names):
        if isinstance(n,int): n=cm.get(n,'.notdef')
        ox=(k%cols)*W+int(100*sc); oy=(k//cols)*H+int(1100*sc)
        for v in range(-300,1101,100):
            d.line([(ox-int(100*sc),oy-v*sc),(ox+W-int(110*sc),oy-v*sc)],fill=225 if v else 150)
        for u in range(0,1201,100):
            d.line([(ox+u*sc,oy-1100*sc),(ox+u*sc,oy+300*sc)],fill=225 if u else 150)
        p=Poly(gs); gs[n].draw(p)
        # even-odd approximation via xor layers
        lay=Image.new("1",im.size,0); 
        for poly in p.polys:
            if len(poly)<3: continue
            m=Image.new("1",im.size,0); ImageDraw.Draw(m).polygon([(ox+x*sc,oy-y*sc) for x,y in poly],fill=1)
            lay=ImageChops.logical_xor(lay,m)
        im.paste(0,mask=lay)
        aw=f['hmtx'][n][0]; d.line([(ox+aw*sc,oy-1100*sc),(ox+aw*sc,oy+300*sc)],fill=100)
        d.text((ox-int(90*sc),oy-int(1090*sc)),n,fill=0)
    im.save(out)
if __name__=="__main__":
    sheet(sys.argv[1], [int(x[2:],16) if x.startswith("U+") else x for x in sys.argv[3:]], sys.argv[2])
