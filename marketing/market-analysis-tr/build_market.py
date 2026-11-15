from pathlib import Path
import sys,json,importlib.util
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parent
INVESTOR=ROOT.parent/'qualifi-investor-deck'
if not INVESTOR.exists():INVESTOR=ROOT.parent/'investor-deck-v1'
BRAND=INVESTOR/'brand'
font=TTFont(BRAND/'fonts/Manrope-700.ttf');glyphs=font.getGlyphSet();cmap=font.getBestCmap();upem=font['head'].unitsPerEm

def outlined(text,cx,baseline,size,color):
 advance=sum(font['hmtx'][cmap[ord(c)]][0] for c in text)*size/upem
 x=cx-advance/2;items=[]
 for c in text:
  name=cmap[ord(c)];pen=SVGPathPen(glyphs);glyphs[name].draw(pen);s=size/upem
  items.append(f'<path d="{pen.getCommands()}" transform="translate({x:.5f} {baseline}) scale({s:.6f} {-s:.6f})" fill="{color}"/>')
  x+=font['hmtx'][name][0]*s
 return ''.join(items)
svg='<svg xmlns="http://www.w3.org/2000/svg" width="690" height="440" viewBox="0 0 690 440"><rect width="690" height="440" fill="#F6F7F2"/><circle cx="345" cy="220" r="205" fill="#203B30"/><circle cx="385" cy="254" r="145" fill="#D8EEA6"/><circle cx="420" cy="282" r="80" fill="#F6F7F2"/>'+outlined('TAM',345,94,42,'#F6F7F2')+outlined('SAM',385,178,38,'#203B30')+outlined('SOM',420,295,32,'#203B30')+'</svg>'
(ROOT/'market-rings.svg').write_text(svg,encoding='utf-8')
with sync_playwright() as pw:
 b=pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
 page=b.new_page(viewport={'width':690,'height':440},device_scale_factor=2)
 page.set_content('<html><body style="margin:0">'+svg+'</body></html>');page.locator('svg').screenshot(path=str(ROOT/'market-rings.png'));b.close()
# Standalone editable slide; no changes to other pages of the investor deck.
spec=importlib.util.spec_from_file_location('deck',str(INVESTOR/'build_deck.py'));m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
m.R=ROOT; m.F=BRAND/'fonts'
(ROOT/'brand').mkdir(exist_ok=True)
import shutil
shutil.copy2(BRAND/'QualiFi-Wordmark.png',ROOT/'brand/QualiFi-Wordmark.png')
d=m.Deck('QualiFi-Pazar-TAM-SAM-SOM-TR')
s=d.slide('05 / Pazar ve hedefleme','Geniş pazar.\nOdaklı başlangıç.',tag='YATIRIMCI SUNUMU',notes='Türkiye scope; enterprise counts, not revenue. Source: KOSGEB 2026 statistics based on TÜİK 2024, Table3, printedp11/PDFp20. TAM3,928,385 SMEs in covered industry/services. SAM sector-based proxy65,699 J +312,028 M=377,727; includes micro/small/medium SMEs. Product fit, collection workflow, permissions, integration readiness and willingness to pay remain unvalidated. SOM requires a stated time horizon and bottom-up sales capacity; no customer target invented. Banks are not included in this initial sector proxy. Rings schematic, not proportional.')
s.image(ROOT/'market-rings.png',120,470,690,440)
s.text('Şema ölçekli değildir',220,895,490,20,'muted',align='center')
s.text('TAM · 3,93 milyon',930,480,850,56,font='heading')
s.text('Türkiye’de sanayi ve hizmetlerdeki KOBİ’ler.\nResmî sayı: 3.928.385 · 2024',930,556,850,27,'muted',leading=1.25)
s.text('SAM* · 377.727',930,658,850,52,font='heading')
s.text('Öncelikli sektör tahmini: bilgi-iletişim +\nmesleki, bilimsel ve teknik faaliyetler (J + M).',930,732,850,27,'muted',leading=1.25)
s.text('SOM · Doğrulanacak',930,838,850,40,font='heading')
s.text('Aylık nitelikli fırsat × ay × ücretli dönüşüm',930,898,850,23,'muted')
s.text('Kaynak: KOSGEB (2026), TÜİK 2024 verileri · Tablo 3, s. 11 (PDF s. 20).\n*SAM sektör temelli ön tahmindir; ürün uyumu ve satın alma isteği doğrulanmadı. İşletme sayısıdır.',120,937,1700,18,'muted',leading=1.12)
report=d.save();(ROOT/'market-slide.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
audit={'scope':'Türkiye','year_of_data':2024,'source_publisher':'KOSGEB; underlying TÜİK data','source_report_year':2026,'table':'Table 3','printed_page':11,'pdf_page':20,'tam_enterprises':3928385,'sam_j_information_communication_smes':65699,'sam_m_professional_scientific_technical_smes':312028,'sam_sector_proxy_enterprises':65699+312028,'sam_tam_ratio':(65699+312028)/3928385,'som':None,'som_status':'To validate. No sales capacity or time horizon supplied.','exclusions':['Banks not counted in initial SAM','No revenue TAM without validated pricing','No claim of measured purchase intent'],'visual':'Nested rings schematic; not to scale'}
(ROOT/'market-calculation.json').write_text(json.dumps(audit,indent=2),encoding='utf-8')
print(json.dumps(audit,indent=2))
