from pathlib import Path
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from playwright.sync_api import sync_playwright
import json
R=Path(__file__).resolve().parent
F=R.parent/'qualifi-investor-deck/brand/fonts'
if not F.exists():F=R.parent/'investor-deck-v1/brand/fonts'
fonts={}
for n,f in [('bold','Manrope-700.ttf'),('body','DM-Sans-400.ttf')]:
 t=TTFont(F/f);fonts[n]=(t,t.getGlyphSet(),t.getBestCmap(),t['head'].unitsPerEm)
def text(s,x,y,size=30,color='#203B30',font='body'):
 f,g,cm,up=fonts[font];out=[]
 for ch in s:
  name=cm[ord(ch)];p=SVGPathPen(g);g[name].draw(p);scale=size/up
  out.append(f'<path d="{p.getCommands()}" transform="translate({x:.5f} {y}) scale({scale:.7f} {-scale:.7f})" fill="{color}"/>');x+=f['hmtx'][name][0]*scale
 return ''.join(out)
def start(w,h):return f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}">'
def rect(x,y,w,h,c,stroke=None):return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="22" fill="{c}"'+(f' stroke="{stroke}"' if stroke else '')+'/>'
m=json.loads((R/'financial-model.json').read_text());v=m['summary'];baseline=v['baseline_annual_total_cost_try'];reserve=v['reserve_try']
budgets=[('12 aylık çekirdek operasyon',baseline),('Muhasebe / ERP entegrasyonları',200000),('Veri güvenliği ve yedekleme',100000),('B2B pilotları ve işlem akışları',150000),('Rezerv ve beklenmeyen giderler',reserve)]
assert round(sum(b for _,b in budgets))==1500000
fund=start(1680,500)+rect(0,0,1680,500,'#F6F7F2')+rect(0,16,610,398,'#EAF0DF')
fund+=text('ÖNERİLEN YATIRIM',34,70,23,color='#637362',font='bold')+text('1,5 milyon TL',34,165,69,font='bold')+text('12 aylık plan',38,225,34,font='bold')
fund+=text('Ürün, entegrasyonlar ve',38,300,28,color='#637362')+text('kurumsal pilotlar için.',38,342,28,color='#637362')
detail=['Ekip, temel geliştirme ve günlük operasyon','API bağlantısı, veri eşleme ve uçtan uca test','Bulut, şifreli yedekleme ve geri yükleme testleri','Kurumsal onboarding, pilot müşteriler ve iş akışları','Gecikmeler ve öngörülmeyen giderler']
for i,(label,amount) in enumerate(budgets):
 y=55+i*77;fund+=text(label,680,y,29,font='bold')+text(f'{round(amount/1000):,}'.replace(',','.')+' bin TL',1450,y,29,font='bold')
 fund+=text(detail[i],680,y+32,19,color='#637362')
 fund+=f'<path d="M680 {y+50}H1660" stroke="#DCE3D4" stroke-width="1.5"/>'
fund+=text('Plan varsayımıdır; kapsam ve tedarikçi teklifleriyle netleştirilecek. Gelir tahmini yatırım tutarından düşülmedi.',0,480,21,color='#637362')+'</svg>'
(R/'funding-use.svg').write_text(fund,encoding='utf-8')
footer=start(1680,52)+rect(0,0,1680,52,'#F6F7F2')
footer+=text('Kaynak: KOSGEB 2026, TÜİK 2024; Tablo 3, s. 11 (PDF 20). SAM, J+M sektörlerinin toplamına dayalı ön tahmindir.',0,18,18,color='#637362')
footer+=text('Teknoloji olgunluğu ve satın alma isteği ölçülmedi. 900, ilk ay erişim hedefidir; ücretli müşteri sayısı değildir.',0,43,18,color='#637362')+'</svg>'
(R/'market-source-footer.svg').write_text(footer,encoding='utf-8')
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
 for name,w,h in [('funding-use',1680,500),('market-source-footer',1680,52)]:
  page=b.new_page(viewport={'width':w,'height':h},device_scale_factor=1);page.set_content('<body style="margin:0">'+(R/(name+'.svg')).read_text()+'</body>');page.locator('svg').screenshot(path=str(R/(name+'.png')));page.close()
 b.close()
(R/'funding-budget.json').write_text(json.dumps({'proposed_raise_try':1500000,'horizon_months':12,'funding_uses':[{'label':a,'amount_try':b,'display_thousand_try':round(b/1000)} for a,b in budgets],'expected_revenue_not_deducted':True,'rounding':'Display uses rounded thousand TRY, exact amounts remain in model.','infrastructure':'Managed cloud, backups, recovery testing and security; not physical data-center construction.'},ensure_ascii=False,indent=2),encoding='utf-8')
print('Funding-use page and market source footer ready')
