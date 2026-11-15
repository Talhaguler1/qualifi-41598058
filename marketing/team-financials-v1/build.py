from pathlib import Path
import json, math, re, csv, os, tempfile
os.environ.setdefault('MPLCONFIGDIR',str(Path(tempfile.gettempdir())/'qualifi-matplotlib'))
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
import matplotlib
matplotlib.use('Agg')
from matplotlib import pyplot as plt, font_manager
from matplotlib.ticker import FuncFormatter
from openpyxl import Workbook
from openpyxl.styles import Font,PatternFill,Alignment
from playwright.sync_api import sync_playwright
R=Path(__file__).resolve().parent
F=R.parent/'qualifi-investor-deck/brand/fonts'
if not F.exists():F=R.parent/'investor-deck-v1/brand/fonts'
FOREST='#203B30';PAPER='#F6F7F2';LIME='#D8EEA6';SAGE='#637362';LINE='#DCE3D4';SOFT='#EAF0DF'
fonts={}
for name,file in [('bold','Manrope-700.ttf'),('body','DM-Sans-400.ttf')]:
 f=TTFont(F/file);fonts[name]=(f,f.getGlyphSet(),f.getBestCmap(),f['head'].unitsPerEm)

def text(value,x,y,size=32,color=FOREST,font='body'):
 f,g,cm,up=fonts[font];out=[]
 for c in value:
  name=cm.get(ord(c))
  if name is None:raise ValueError(c)
  pen=SVGPathPen(g);g[name].draw(pen);s=size/up
  out.append(f'<path d="{pen.getCommands()}" transform="translate({x:.5f} {y}) scale({s:.7f} {-s:.7f})" fill="{color}"/>')
  x+=f['hmtx'][name][0]*s
 return ''.join(out)

def svg_start(w,h):return f'<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="{w}" height="{h}" viewBox="0 0 {w} {h}">'
def rect(x,y,w,h,fill=PAPER,stroke=None,rx=20):return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{rx}" fill="{fill}"'+(f' stroke="{stroke}"' if stroke else '')+'/>'

team_copy='Özyeğin Üniversitesi’nde Yönetim Bilişim Sistemleri\nve Bilgisayar Mühendisliği çift anadal öğrencisi.\n\nemlyon’da dijital pazarlama değişim eğitimi.\n\nSOMFY senaryolu Digital Night Challenge’da\nkazanan ekip üyesi.'
team=svg_start(1680,740)+text('Ekip',0,68,68,font='bold')+text('Muhammed Talha Güler',640,205,56,font='bold')+text('Kurucu',644,265,34,color=SAGE)
team+=f'<rect x="644" y="300" width="100" height="7" rx="3.5" fill="{LIME}"/>'
team+=text('Kaynak: LinkedIn · kullanıcı tarafından doğrulanan profil',644,720,21,color=SAGE)+'</svg>'
(R/'team-titles.svg').write_text(team,encoding='utf-8')
(R/'team-copy.txt').write_text('Muhammed Talha Güler\nKurucu\n\n'+team_copy+'\n',encoding='utf-8')

# User-authorized illustrative scenario; NONE of these inputs are actual results.
A={'arpa_try':1500,'variable_direct_cost_per_account_try':450,'fixed_direct_infrastructure_monthly_try':3000,'monthly_churn':.03,'founder_total_monthly_cost_try':40000,'external_product_development_monthly_try':10000,'internal_tools_monthly_try':2000,'admin_accounting_monthly_try':3000,'marketing_monthly_try':5000,'founder_sales_allocation':.25,'opening_paid_accounts':0,'new_paid_accounts_by_month':[0,0,2,3,4,4,5,5,6,6,7,8],'vat_taxes_financing_capex_working_capital':'excluded','revenue_timing':'Month-end active accounts billed for the full month; simplified, not prorated.'}
rows=[];active=0
for i,new in enumerate(A['new_paid_accounts_by_month'],1):
 opening=active;churn=opening*A['monthly_churn'];active=opening-churn+new;revenue=active*A['arpa_try'];variable=active*A['variable_direct_cost_per_account_try'];cogs=variable+A['fixed_direct_infrastructure_monthly_try'];gross=revenue-cogs;opex=sum(A[k] for k in ['founder_total_monthly_cost_try','external_product_development_monthly_try','internal_tools_monthly_try','admin_accounting_monthly_try','marketing_monthly_try']);result=gross-opex
 rows.append({'month':i,'opening_paid_accounts':opening,'new_paid_accounts':new,'churned_accounts':churn,'closing_paid_accounts':active,'revenue_try':revenue,'variable_direct_cost_try':variable,'fixed_direct_infrastructure_try':3000,'cogs_try':cogs,'gross_profit_try':gross,'opex_try':opex,'total_cost_try':cogs+opex,'operating_result_try':result})
rev=sum(x['revenue_try'] for x in rows);cogs=sum(x['cogs_try'] for x in rows);result=sum(x['operating_result_try'] for x in rows);acq=(A['marketing_monthly_try']+A['founder_total_monthly_cost_try']*A['founder_sales_allocation'])*12
summary={'annual_revenue_try':rev,'month12_mrr_try':rows[-1]['revenue_try'],'annual_operating_result_try':result,'annual_cogs_try':cogs,'annual_gross_margin':(rev-cogs)/rev if rev>0 else None,'month12_gross_margin':rows[-1]['gross_profit_try']/rows[-1]['revenue_try'] if rows[-1]['revenue_try']>0 else None,'annual_new_paid_accounts':sum(A['new_paid_accounts_by_month']),'month12_active_paid_accounts':active,'acquisition_cost_budget_try':acq,'modeled_cac_try':acq/sum(A['new_paid_accounts_by_month']) if sum(A['new_paid_accounts_by_month'])>0 else None,'ltv':'Not estimated; no observed paid retention cohorts.','break_even_active_accounts':(rows[-1]['opex_try']+A['fixed_direct_infrastructure_monthly_try'])/(A['arpa_try']-A['variable_direct_cost_per_account_try']) if A['arpa_try']>A['variable_direct_cost_per_account_try'] else None}
(R/'financial-model.json').write_text(json.dumps({'status':'illustrative assumptions, not actuals, guidance or a guaranteed forecast','assumptions':A,'monthly':rows,'summary':summary},ensure_ascii=False,indent=2),encoding='utf-8')
with (R/'financial-model.csv').open('w',encoding='utf-8-sig',newline='') as f:
 w=csv.DictWriter(f,fieldnames=list(rows[0]));w.writeheader();w.writerows(rows)

# Editable workbook: actual Excel formulas; calc.json supplies independent evaluated output.
wb=Workbook();a=wb.active;a.title='Varsayımlar'
inputs=[('Müşteri başına aylık gelir',1500),('Müşteri başına değişken doğrudan maliyet',450),('Aylık sabit doğrudan altyapı',3000),('Aylık müşteri kaybı',.03),('Kurucu aylık toplam maliyet',40000),('Dış ürün geliştirme / ay',10000),('İç araçlar / ay',2000),('İdari / muhasebe / ay',3000),('Pazarlama / ay',5000),('Kurucu zamanının satışa ayrılan payı',.25),('Başlangıç ücretli müşteri',0)]
a.append(['12 AYLIK ÖRNEK SENARYO','TÜM GİRDİLER VARSAYIMDIR'])
for name,val in inputs:a.append([name,val])
a['B5'].number_format='0%';a['B11'].number_format='0%'
a.append(['KDV, vergi, finansman, başlangıç yatırımı, işletme sermayesi','Dahil değil'])
a.append(['Gelir tanıma','Dönem sonu aktif hesap × tam aylık gelir; basitleştirilmiş'])
a.append(['Not','Gerçekleşmiş müşteri, satış veya maliyet verisi içermez.'])
s=wb.create_sheet('Aylık model');headers=['Ay','Yeni müşteri (varsayım)','Dönem başı aktif','Kaybedilen','Dönem sonu aktif','Gelir','Değişken doğrudan maliyet','Sabit doğrudan altyapı','Satışların maliyeti','Brüt kâr','Faaliyet gideri','Toplam gider','Faaliyet sonucu','Brüt marj']
s.append(headers)
for i,new in enumerate(A['new_paid_accounts_by_month'],2):
 s.cell(i,1,i-1);s.cell(i,2,new);s.cell(i,3,"='Varsayımlar'!B12" if i==2 else f'=E{i-1}');s.cell(i,4,f"=C{i}*'Varsayımlar'!B5");s.cell(i,5,f'=C{i}-D{i}+B{i}');s.cell(i,6,f"=E{i}*'Varsayımlar'!B2");s.cell(i,7,f"=E{i}*'Varsayımlar'!B3");s.cell(i,8,"='Varsayımlar'!B4");s.cell(i,9,f'=G{i}+H{i}');s.cell(i,10,f'=F{i}-I{i}');s.cell(i,11,"=SUM('Varsayımlar'!B6:B10)");s.cell(i,12,f'=I{i}+K{i}');s.cell(i,13,f'=F{i}-L{i}');s.cell(i,14,f'=IF(F{i}>0,J{i}/F{i},"")')
s.cell(15,1,'Toplam')
for c in [2,6,7,8,9,10,11,12,13]:s.cell(15,c,f'=SUM({chr(64+c)}2:{chr(64+c)}13)')
s.cell(15,14,'=IF(F15>0,J15/F15,"")')
k=wb.create_sheet('Birim ekonomi');k.append(['Gösterge','Formül / sonuç']);k.append(['CAC edinim bütçesi',"=('Varsayımlar'!B10+'Varsayımlar'!B6*'Varsayımlar'!B11)*12"]);k.append(['Brüt yeni müşteri',"=SUM('Aylık model'!B2:B13)"]);k.append(['Senaryo CAC','=IF(B3>0,B2/B3,"Hesaplanamaz")']);k.append(['Yıllık brüt marj',"=IF('Aylık model'!F15>0,'Aylık model'!J15/'Aylık model'!F15,\"\")"]);k.append(['12. ay aktif',"='Aylık model'!E13"]);k.append(['12. ay MRR',"='Aylık model'!F13"]);k.append(['Başabaş aktif müşteri',"=(SUM('Varsayımlar'!B6:B10)+'Varsayımlar'!B4)/('Varsayımlar'!B2-'Varsayımlar'!B3)"]);k.append(['LTV','Ücretli kohort verisiyle ölçülecek; senaryo churnünden LTV uydurulmadı.'])
for sh in wb:
 sh.freeze_panes='B2'
 for cell in sh[1]:cell.font=Font(name='Calibri',bold=True,color='FFFFFF');cell.fill=PatternFill('solid',fgColor='203B30')
 sh.column_dimensions['A'].width=48
 for col in range(2,sh.max_column+1):sh.column_dimensions[__import__('openpyxl').utils.get_column_letter(col)].width=25
 for row in sh.iter_rows(min_row=2):
  for c in row:c.alignment=Alignment(vertical='top',wrap_text=True)
for rnum in range(2,14):
 for col in range(3,15):s.cell(rnum,col).number_format='0.0%' if col==14 else '#,##0.0'
money='#,##0" TL"'
for i in [2,3,4,6,7,8,9,10]:a.cell(i,2).number_format=money
for i in range(2,13):a.cell(i,2).fill=PatternFill('solid',fgColor='EAF0DF')
for i in range(2,14):
 s.cell(i,2).fill=PatternFill('solid',fgColor='EAF0DF')
 for col in range(6,14):s.cell(i,col).number_format=money
for col in range(6,14):s.cell(15,col).number_format=money
for cell in ['B2','B4','B7']:k[cell].number_format=money
k['B5'].number_format='0.0%';k['B6'].number_format='0.0';k['B8'].number_format='0.0'
from openpyxl.workbook.properties import CalcProperties
wb.calculation=CalcProperties(calcMode='auto',fullCalcOnLoad=True,forceFullCalc=True)
wb.save(R/'QualiFi-12-Aylik-Ornek-Senaryo.xlsx')

# Scientific/financial chart drawn with a standard plotting tool, not image synthesis.
font_manager.fontManager.addfont(str(F/'DM-Sans-400.ttf'));plt.rcParams['font.family']='DM Sans';plt.rcParams['svg.fonttype']='path'
fig,ax=plt.subplots(figsize=(9.4,2.7));fig.patch.set_facecolor(PAPER);ax.set_facecolor(PAPER)
x=list(range(1,13));ax.plot(x,[r['revenue_try']/1000 for r in rows],color=FOREST,lw=2.6,label='Gelir');ax.plot(x,[r['total_cost_try']/1000 for r in rows],color='#7D9E4E',lw=2.4,label='Toplam gider');ax.plot(x,[r['operating_result_try']/1000 for r in rows],color=SAGE,lw=2.2,ls='--',label='Faaliyet sonucu')
ax.axhline(0,color=LINE,lw=1);ax.set_xticks([1,3,6,9,12],['1. ay','3. ay','6. ay','9. ay','12. ay']);ax.set_ylabel('bin TL',fontsize=9,color=SAGE);ax.tick_params(colors=SAGE,labelsize=9);ax.grid(axis='y',color=LINE,lw=.7);ax.spines[['top','right','left','bottom']].set_visible(False);ax.legend(loc='upper left',fontsize=9,frameon=False,ncol=3);fig.tight_layout(pad=.8);fig.savefig(R/'financial-chart.svg',format='svg');plt.close(fig)
chart=(R/'financial-chart.svg').read_text();inner=chart[chart.index('>',chart.index('<svg'))+1:chart.rfind('</svg>')];inner=re.sub(r'<metadata>.*?</metadata>','',inner,flags=re.S)
# Matplotlib's SVG size is 676.8 ×194.4 points; scale it into the composed page.
def trfmt(n,decimals=0):
 return f'{n:,.{decimals}f}'.replace(',','~').replace('.',',').replace('~','.')
finance=svg_start(1680,650)+rect(0,0,1680,650,PAPER,rx=0)
finance+=text('12 AYLIK ÖRNEK SENARYO · TÜM GİRDİLER VARSAYIMDIR',0,24,24,color=SAGE,font='bold')
for xx,label,value in [(0,'12 AYLIK GELİR',trfmt(rev/1000)+' bin TL'),(580,'12. AY MRR',trfmt(rows[-1]['revenue_try']/1000,1)+' bin TL'),(1160,'12 AYLIK FAALİYET SONUCU',('−' if result<0 else '')+trfmt(abs(result)/1000)+' bin TL')]:
 finance+=rect(xx,50,520,140,'#FFFFFF',LINE)+text(label,xx+28,86,20,color=SAGE,font='bold')+text(value,xx+28,156,50,font='bold')
finance+='<g transform="translate(0 220) scale(1.48)">'+inner+'</g>'
finance+=rect(1060,220,620,290,SOFT)
finance+=text('Senaryo girdileri',1090,258,28,font='bold')
for yy,label in [(304,'Gelir / müşteri / ay: '+trfmt(A['arpa_try'])+' TL'),(348,'Değişken maliyet / müşteri / ay: '+trfmt(A['variable_direct_cost_per_account_try'])+' TL'),(392,'Toplam sabit gider / ay: '+trfmt(rows[-1]['opex_try']+A['fixed_direct_infrastructure_monthly_try'])+' TL'),(436,'Brüt yeni müşteri: '+str(summary['annual_new_paid_accounts'])+' · aylık kayıp: %'+trfmt(A['monthly_churn']*100))]:finance+=text(label,1090,yy,24,color=SAGE)
finance+=rect(0,540,1680,72,SOFT)
for xx,label,value in [(24,'YILLIK BRÜT MARJ','%'+trfmt(summary['annual_gross_margin']*100,1) if summary['annual_gross_margin'] is not None else 'Hesaplanamaz'),(450,'SENARYO CAC',trfmt(summary['modeled_cac_try'])+' TL' if summary['modeled_cac_try'] is not None else 'Hesaplanamaz'),(890,'LTV','Kohortla ölçülecek')]:finance+=text(label,xx,566,17,color=SAGE,font='bold')+text(value,xx,596,25,font='bold')
finance+=text('KDV, vergi, finansman, başlangıç yatırımı ve işletme sermayesi hariçtir. Resmî fiyat veya gerçekleşmiş sonuç değildir.',0,642,18,color=SAGE)+'</svg>'
(R/'financial-composition.svg').write_text(finance,encoding='utf-8')
with sync_playwright() as pw:
 b=pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
 for name,w,h in [('team-titles',1680,740),('financial-composition',1680,650)]:
  pg=b.new_page(viewport={'width':w,'height':h},device_scale_factor=1);pg.set_content('<body style="margin:0">'+(R/(name+'.svg')).read_text()+'</body>');pg.locator('svg').screenshot(path=str(R/(name+'.png')),omit_background=name=='team-titles');pg.close()
 b.close()
print(json.dumps(summary,ensure_ascii=False,indent=2))
