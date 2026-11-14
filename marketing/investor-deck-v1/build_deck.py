"""Create a light, editable QualiFi investor deck and matching vector PDF.
Requires python-pptx, reportlab and Pillow. No generated company metrics.
"""
from pathlib import Path
import json, math, shutil
from PIL import ImageFont
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE, MSO_CONNECTOR
from pptx.enum.text import PP_ALIGN
from pptx.oxml.xmlchemy import OxmlElement
from reportlab.pdfgen import canvas as pdfcanvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.utils import ImageReader

R=Path(__file__).resolve().parent
F=R/'brand/fonts'
W,H=1920,1080
C={'forest':'203B30','lime':'D8EEA6','paper':'F6F7F2','muted':'637362','soft':'EAF0DF','line':'DCE3D4','white':'FFFFFF','accent':'7D9E4E'}
for name,file in [('heading','Manrope-700.ttf'),('medium','Manrope-600.ttf'),('body','DM-Sans-400.ttf'),('bold','DM-Sans-700.ttf')]:
    pdfmetrics.registerFont(TTFont(name,str(F/file)))
FONTS={name:ImageFont.truetype(str(F/file),40) for name,file in [('heading','Manrope-700.ttf'),('medium','Manrope-600.ttf'),('body','DM-Sans-400.ttf'),('bold','DM-Sans-700.ttf')]}
MANIFEST=[]
def rgb(color):return tuple(bytes.fromhex(C.get(color,color).lstrip('#')))
def unit(px):return Inches(px/96)

class Deck:
    def __init__(self,name):
        self.name=name;self.p=Presentation();self.p.slide_width=unit(W);self.p.slide_height=unit(H)
        self.p.core_properties.author='QualiFi';self.p.core_properties.title=name
        self.pdf=pdfcanvas.Canvas(str(R/(name+'.pdf')),pagesize=(W,H));self.pages=[]
    def slide(self,section,title,notes='',blank=False,tag='YATIRIMCI SUNUMU'):
        c=Slide(self,section,title,notes,blank,tag);self.pages.append(c);return c
    def save(self):
        self.pdf.save();self.p.save(R/(self.name+'.pptx'))
        return {'name':self.name,'slides':len(self.pages),'pages':[p.record for p in self.pages]}

class Slide:
    def __init__(self,deck,section,title,notes,blank,tag):
        if deck.pages:deck.pdf.showPage()
        self.d=deck;self.s=deck.p.slides.add_slide(deck.p.slide_layouts[6]);self.s.background.fill.solid();self.s.background.fill.fore_color.rgb=RGBColor(*rgb('paper'))
        self.record={'section':section,'title':title,'notes':notes,'blank_by_user_request':blank,'text_boxes':[]}
        self.s.notes_slide.notes_text_frame.text=notes
        self.rect(0,0,W,H,'paper')
        self.image(R/'brand/QualiFi-Wordmark.png',120,60,275,86)
        self.text(tag,1300,95,500,20,'muted',font='bold',align='right')
        self.line(120,171,1800,171,'line',2)
        self.text(section.translate(str.maketrans({'i':'İ','ı':'I'})).upper(),120,212,1690,22,'muted',font='bold')
        if title:self.text(title,120,270,1675,68,'forest',font='heading',leading=1.12)
        self.line(120,978,1800,978,'line',2)
        self.text('QualiFi · qualifilab.com',120,1004,1200,20,'muted')
        self.text(f'{len(deck.pages)+1:02}',1680,1004,120,20,'muted',font='bold',align='right')
    def color(self,color):
        a=rgb(color);self.d.pdf.setFillColorRGB(*(v/255 for v in a));self.d.pdf.setStrokeColorRGB(*(v/255 for v in a))
    def rect(self,x,y,w,h,fill='white',stroke=None,r=0):
        self.color(fill)
        if stroke:self.d.pdf.setStrokeColorRGB(*(v/255 for v in rgb(stroke)))
        self.d.pdf.setLineWidth(1.5)
        if r:self.d.pdf.roundRect(x,H-y-h,w,h,r,fill=1,stroke=int(bool(stroke)))
        else:self.d.pdf.rect(x,H-y-h,w,h,fill=1,stroke=int(bool(stroke)))
        sh=self.s.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE if r else MSO_SHAPE.RECTANGLE,unit(x),unit(y),unit(w),unit(h))
        sh.fill.solid();sh.fill.fore_color.rgb=RGBColor(*rgb(fill))
        if r:
            try:sh.adjustments[0]=min(.4,r/min(w,h))
            except Exception:pass
        if stroke:sh.line.color.rgb=RGBColor(*rgb(stroke));sh.line.width=Pt(1.125)
        else:sh.line.fill.background()
        sh._element.spPr.append(OxmlElement('a:effectLst'))
    def circle(self,x,y,d,fill='lime'):
        self.color(fill);self.d.pdf.circle(x+d/2,H-y-d/2,d/2,stroke=0,fill=1)
        sh=self.s.shapes.add_shape(MSO_SHAPE.OVAL,unit(x),unit(y),unit(d),unit(d));sh.fill.solid();sh.fill.fore_color.rgb=RGBColor(*rgb(fill));sh.line.fill.background()
    def line(self,x,y,xx,yy,color='line',width=2):
        self.color(color);self.d.pdf.setLineWidth(width);self.d.pdf.line(x,H-y,xx,H-yy)
        sh=self.s.shapes.add_connector(MSO_CONNECTOR.STRAIGHT,unit(x),unit(y),unit(xx),unit(yy));sh.line.color.rgb=RGBColor(*rgb(color));sh.line.width=Pt(width*.75)
    def image(self,path,x,y,w,h):
        self.d.pdf.drawImage(ImageReader(str(path)),x,H-y-h,w,h,mask='auto')
        self.s.shapes.add_picture(str(path),unit(x),unit(y),unit(w),unit(h))
    def text(self,value,x,y,w,size=34,color='forest',font='body',leading=1.25,align='left'):
        ft=FONTS[font].font_variant(size=size);lines=[]
        for row in value.split('\n'):
            cur=''
            for word in row.split():
                trial=(cur+' '+word).strip()
                if cur and ft.getlength(trial)>w:lines.append(cur);cur=word
                else:cur=trial
            lines.append(cur)
        h=len(lines)*size*leading
        assert x+w<=W+1 and y+h<=H+1,(value,y,h)
        self.record['text_boxes'].append({'text':value,'x':x,'y':y,'width':w,'height':h,'font_px':size,'line_count':len(lines)})
        self.color(color);self.d.pdf.setFont(font,size)
        asc=pdfmetrics.getAscent(font)*size/1000
        for i,line in enumerate(lines):
            dy=H-y-asc-i*size*leading
            if align=='right':self.d.pdf.drawRightString(x+w,dy,line)
            elif align=='center':self.d.pdf.drawCentredString(x+w/2,dy,line)
            else:self.d.pdf.drawString(x,dy,line)
        box=self.s.shapes.add_textbox(unit(x),unit(y),unit(w+min(20,W-x-w)),unit(h+size*.45));tf=box.text_frame;tf.clear();tf.margin_top=tf.margin_bottom=tf.margin_left=tf.margin_right=0;tf.word_wrap=False
        for i,line in enumerate(lines):
            p=tf.paragraphs[0] if i==0 else tf.add_paragraph();p.text=line;p.font.name='Manrope' if font in ['heading','medium'] else 'DM Sans';p.font.size=Pt(size*.75);p.font.bold=font in ['heading','bold'];p.font.color.rgb=RGBColor(*rgb(color));p.line_spacing=Pt(size*leading*.75);p.space_before=p.space_after=Pt(0)
            if align=='right':p.alignment=PP_ALIGN.RIGHT
            if align=='center':p.alignment=PP_ALIGN.CENTER
        return h
    def tag(self,label,x,y,w):
        self.rect(x,y,w,48,'soft',r=16);self.text(label,x+18,y+11,w-36,20,'forest',font='bold')
    def card(self,num,title,body,x,y,w=520,h=300):
        self.rect(x,y,w,h,'white','line',r=24)
        self.circle(x+28,y+28,54);self.text(num,x+28,y+43,54,20,'forest',font='bold',align='center')
        self.text(title,x+28,y+112,w-56,38,font='heading',leading=1.15)
        self.text(body,x+28,y+185,w-56,29,'muted',leading=1.26)

def make():
    d=Deck('QualiFi-Yatirimci-Sunumu-TR')
    s=d.slide('01 / Giriş ve çapa cümlesi','',notes='QualiFi, işletmelerin sözleşme ve iş iletişimlerinden nakit öngörüsü ve ödeme takibi oluşturmayı amaçlayan yapay zekâ destekli bir ürün geliştiriyor. Ana anlatı küçük ve orta ölçekli işletmeler. Bankalar sonraki büyüme alanı. Bugün çalışan bir finans ajanı ya da tahsilat garantisi sunduğumuzu söylemeyin.')
    s.text('Siz işinizi büyütün.\nNakit akışınızı\nQualiFi ile yönetin.',120,300,1120,88,font='heading',leading=1.13)
    s.text('Küçük ve orta ölçekli işletmeler için\nyapay zekâ destekli nakit öngörüsü\nve ödeme takibi.',125,665,1040,36,'muted')
    s.tag('ERKEN AŞAMA · ÜRÜN GELİŞTİRME',125,840,515)
    for i,(a,b) in enumerate([('Sözleşme','Tutar ve ödeme koşulları'),('İş iletişimi','Taahhüt ve değişiklikler'),('Nakit öngörüsü','Takip ve bir sonraki karar')]):
        y=315+i*176;s.rect(1320,y,470,140,'white','line',r=24);s.circle(1350,y+39,60);s.text(str(i+1),1350,y+57,60,22,font='bold',align='center');s.text(a,1438,y+24,330,31,font='heading');s.text(b,1438,y+76,320,23,'muted')

    s=d.slide('02 / Problem tanımı','Finansal bilgiler dağınık.\nNakit akışını planlamak zor.',notes='Bu bir problem hipotezidir; doğrulanmış müşteri yüzdesi veya görüşme sayısı verilmedi. Muhasebe, ERP ve Excel kullanan işletmelerin mevcut araçlarını değiştirmeden, sözleşme ve iletişim bağlamını nasıl birleştirebileceğimizi araştırıyoruz. Geçen bir vade, ödemenin gerçekleşmediğini tek başına kanıtlamaz.')
    s.text('Sözleşmeler, yazışmalar ve finansal kayıtlar\naynı işletmenin farklı parçalarını anlatıyor.',120,495,720,38,'muted')
    for i,(a,b) in enumerate([('Bilgiler parçalı','Tutar, vade ve son ödeme taahhüdü farklı yerlerde.'),('Zamanlama belirsiz','Planlanan ödeme ile gerçekleşen tahsilat değişebiliyor.'),('Takip kişilere bağlı','Kontrol, hatırlatma ve güncelleme sürekli emek istiyor.')]):
        y=490+i*145;s.circle(980,y,52);s.text(f'0{i+1}',980,y+14,52,21,font='bold',align='center');s.text(a,1062,y-2,720,37,font='heading');s.line(1062,y+56,1790,y+56);s.text(b,1062,y+76,725,27,'muted')

    s=d.slide('03 / Çözüm önerisi','Öngörün. Takip edin.\nStratejiye odaklanın.',notes='Çözüm vizyonumuz: sözleşme koşulları, izinli iş iletişimi, geçmiş ödeme ve sektör bağlamını bir araya getirerek kullanılabilir bir nakit öngörüsü sunmak. Bu slayttaki ajan ve öngörü özellikleri geliştirme hedefidir; bugün çalışan özellik gibi anlatılmamalıdır.')
    s.tag('HEDEFLENEN ÇÖZÜM · GELİŞTİRME AŞAMASI',120,443,760)
    s.card('01','Nakit öngörüsü','Beklenen tutar ve tarihleri, varsayımlarıyla birlikte görün.',120,500)
    s.card('02','Ödeme takibi','Gecikmeleri ve kullanıcı onayı gerektiren takipleri yönetin.',700,500)
    s.card('03','Karar desteği','Senaryoları karşılaştırın; ayrıntıyı gerektiğinde inceleyin.',1280,500)
    s.text('Sözleşmeler + izinli iş iletişimi + finansal kayıtlar → tek konuşma arayüzü',120,873,1680,31,'muted',font='medium')

    s=d.slide('04 / Ürün ve deneyim akışı','Hedefinizi söyleyin.\nAjanlar arka planda çalışsın.',notes='Tasarlanan deneyim üç adımdır: kullanıcı hedefini belirtir, kendi seçtiği belge ve iş verisiyle bağlamı ekler, öngörü ve takip önerilerini görür. Örnek ekran kavramsaldır. Gmail, WhatsApp ve ERP bağlantıları henüz canlı değildir. Banka hesabı erişimiyle başlamak zorunlu değildir; gerçekleşen tahsilat ayrıca doğrulanmalıdır.')
    for i,(a,b) in enumerate([('Hedefi seçin','Nakit öngörüsü veya ödeme takibi.'),('Bağlamı ekleyin','Sözleşme, iş yazışması ve mevcut kayıtlar.'),('Sonucu konuşun','Özet, senaryo ve onayınıza sunulan aksiyon.')]):
        y=500+i*130;s.text(f'0{i+1}',120,y,100,34,'muted',font='bold');s.text(a,240,y,590,36,font='heading');s.text(b,240,y+56,600,27,'muted')
    s.rect(1020,493,780,402,'white','line',r=24);s.tag('TASARLANAN DENEYİM · ÖRNEK',1050,520,460)
    s.rect(1270,607,490,83,'soft',r=20);s.text('Gelecek ay nakit akışım nasıl?',1298,630,436,28,font='medium')
    s.image(R/'brand/QualiFi-Mark.png',1050,718,64,64);s.text('Beklenen ödemeleri ve belirsiz\ntarihleri birlikte değerlendirelim.\nİstersen ayrıntıyı da açabilirim.',1145,719,602,31,leading=1.3)

    s=d.slide('05 / Pazar ve hedefleme','Geniş bir pazar.\nOdaklı bir başlangıç.',notes='KOSGEB 2026 göstergeler raporu, TÜİK 2024 verisi: sanayi ve hizmet kapsamındaki KOBİ sayısı 3.928.385. Yuvarlak sayı 3,93 milyondur. Bu toplam doğrudan yazılım talebi, erişilebilir pazar ya da müşteri sayısı değildir. Başlangıç segmenti önerisi proje ve vadeli ödemelerle çalışan hizmet işletmeleridir. SAM/SOM ve ücretli talep henüz ölçülmedi; sayı uydurulmadı.')
    s.rect(120,500,690,330,'soft',r=28);s.text('3,93 milyon',158,548,620,92,font='heading');s.text('Türkiye’de KOBİ niteliğindeki girişim\nSanayi ve hizmetler · 2024',158,687,620,29,'muted')
    s.text('BAŞLANGIÇ ODAĞI ÖNERİSİ',920,505,850,23,'muted',font='bold');s.text('Proje ve vadeli ödemelerle\nçalışan hizmet işletmeleri',920,565,850,45,font='heading',leading=1.2)
    s.text('Karar verici: işletme sahibi / CEO / CFO\nBüyüme alanı: daha geniş işletme segmentleri',920,730,850,29,'muted')
    s.text('Kaynak: KOSGEB 2026, TÜİK 2024 verileri, s. 8 (PDF 17). Pazar tabanı; SAM/SOM hesabı değildir.',120,900,1680,22,'muted')

    s=d.slide('06 / İş modeli','Tekrarlayan değere,\nabonelik temelli model.',notes='Bu sayfa bir iş modeli taslağıdır. Kullanıcı önceki konuşmalarda seçili sayfalarda fiyatlandırmayı araştırmak istedi; TR fiyatları gizli kalacak. Burada fiyat, dönüşüm, ARR veya gelir rakamı sunulmuyor. Abonelik ve kullanım düzeyiyle büyüyen planlar pilot geri bildirimiyle doğrulanmalı. Banka kurumsal pilotları sonraki ürünleşme alanıdır.')
    s.card('01','Abonelik','İşletmelere yönelik sürekli nakit öngörüsü ve takip hizmeti.',120,500)
    s.card('02','Kullanım kapsamı','Belge, ajan görevi ve entegrasyon ihtiyacına göre planlama.',700,500)
    s.card('03','Kurumsal model','İlerleyen aşamada bankalara özel pilot ve kurum anlaşmaları.',1280,500)
    s.tag('İŞ MODELİ TASLAĞI · FİYATLANDIRMA DOĞRULANACAK',120,865,890)

    s=d.slide('07 / İlerleme ve kanıtlar','Talep toplama yayında.\nÜrün doğrulaması sırada.',notes='qualifilab.com canlı site olarak kontrol edildi. Pilot, görüşme ve bekleme listesi akışları sitede yer alıyor. Kullanıcı önceki konuşmada test başvurularını admin/leads panelinde gördüğünü doğruladı; bu ücretli talep veya müşteri kazanımı kanıtı değildir. Başvuru adedi, müşteri sayısı, gelir ve performans oranı verilmediği için eklenmedi. AI ve entegrasyonlar halen geliştirme aşamasında.')
    s.text('BUGÜN',120,490,800,23,'muted',font='bold')
    for i,(a,b) in enumerate([('Canlı web sitesi','Türkçe / İngilizce segment sayfaları'),('Başvuru akışları','Pilot, görüşme ve bekleme listesi'),('Yönetici paneli','Başvuru kayıtlarına erişim')]):
        y=551+i*102;s.circle(120,y+4,20,'accent');s.text(a,167,y,660,34,font='heading');s.text(b,167,y+49,680,26,'muted')
    s.rect(1000,493,800,350,'soft',r=24);s.text('SONRAKİ DOĞRULAMA',1040,535,710,23,'muted',font='bold');s.text('Gerçek ihtiyaç\nVeri ve tahmin kalitesi\nÖdeme isteği',1040,600,710,43,font='heading',leading=1.55)
    s.text('Canlı AI analizi ve Gmail / WhatsApp entegrasyonları henüz sunulmuyor.',120,900,1680,25,'muted')

    s=d.slide('08 / Rekabet ve farklılaşma','Hedef farkımız:\nsözleşme + iletişim + aksiyon.',notes='Paraşüt kamuya açık belgelerinde nakit akışı, tahsilat ve vade takibini sunuyor. Chaser kamuya açık belgelerinde alacak otomasyonu ve davranışa dayalı tahsilat/nakit tahmini sunuyor. Bunların rakiplerde olmadığı söylenmiyor. QualiFi farkı henüz doğrulanmış üstünlük değil; sözleşme ve izinli iş iletişimi bağlamını çoklu ajan ve tek konuşma deneyimine bağlayan ürün hipotezidir. Kaynaklar ekte.')
    for x,name,body,tag in [(120,'Paraşüt','Finansal kayıtlar,\nnakit akışı ve\ntahsilat takibi.','MEVCUT ÜRÜN'),(700,'Chaser','Alacak otomasyonu,\nödeme davranışına dayalı\nnakit öngörüsü.','MEVCUT ÜRÜN'),(1280,'QualiFi','Sözleşme ve iş iletişimini\najan görevlerine bağlayan\nkonuşma deneyimi.','HEDEFLENEN YAKLAŞIM')]:
        s.rect(x,500,520,330,'soft' if name=='QualiFi' else 'white','line',r=24);s.text(tag,x+28,530,465,20,'muted',font='bold');s.text(name,x+28,584,465,45,font='heading');s.text(body,x+28,672,465,29,'muted',leading=1.4)
    s.text('Kamuya açık kapsam özeti; performans veya üstünlük karşılaştırması değildir. Kaynaklar ekte.',120,900,1680,23,'muted')

    d.slide('09 / Ekip tanıtımı','Ekip',notes='Kullanıcının açık talebiyle boş bırakıldı. Üye adı, görev, geçmiş deneyim, danışman veya destekçi eklenmedi. Gösterim öncesi doğrulanmış ekip bilgileriyle doldurulabilir.',blank=True)
    d.slide('10 / Finansal öngörüler','Finansal öngörüler',notes='Kullanıcının açık talebiyle boş bırakıldı. Gelir, maliyet, kârlılık, kullanıcı sayısı, CAC/LTV, büyüme veya zaman hedefi uydurulmadı.',blank=True)

    s=d.slide('11 / Yol haritası','İşletme pilotundan\nkurumsal ölçeğe.',notes='Bu sıra önerilen geliştirme yoludur; takvim ve tamamlanma taahhüdü değildir. Önce sözleşme ve veri kalitesi; ardından CSV/Excel ve seçili muhasebe/ERP bağlantıları ile Gmail ve yetkilendirilmiş WhatsApp Business erişimi doğrulanmalı. Tahsilat kaynağı doğrulanmadan müşteriye otomatik gecikme mesajı gönderilmemeli. Banka risk ürünü sonraki büyüme alanı; ayrı veri izni ve tarihsel performans doğrulaması gerektirir.')
    stages=[('01','İşletme pilotu','Sözleşme ve ödeme koşulları\nCSV / Excel aktarımı\nKullanıcı kontrollü takip'),('02','Entegrasyonlar','Seçili ERP / ön muhasebe\nGmail ve WhatsApp Business\nÖngörünün güncellenmesi'),('03','Bankalar','İzinli kurumsal veri\nGeri ödeme sinyalleri\nGeçmiş örneklerle doğrulama')]
    for i,(num,a,b) in enumerate(stages):
        x=120+i*580;s.card(num,a,b,x,500,h=340)
    s.text('Önerilen geliştirme sırası · Canlı entegrasyon veya kesin takvim taahhüdü değildir.',120,900,1680,24,'muted')

    d.slide('12 / Yatırım talebi ve kullanım alanı','Yatırım talebi ve kullanım alanı',notes='Kullanıcının açık talebiyle boş bırakıldı. Tutar, para birimi, değerleme, hisse oranı, kullanım yüzdesi ve fonun yeteceği süre belirtilmedi.',blank=True)

    s=d.slide('13 / Kapanış ve çağrı','Nakit akışına netlik.\nBüyümeye daha fazla odak.',notes='Kapanışta tek çağrı: bir sonraki görüşmeyi başlatmak. Muhammed Talha Güler ve talha.guler@ozu.edu.tr kullanıcı tarafından daha önce açıkça paylaşılmıştır. Domain e-postasının aktif olduğu teyit edilmediği için yeni adres uydurulmadı. Gerekirse kısa demoyla amaçlanan deneyim konuşulabilir.')
    s.text('İşletmelerin finansal takibini birlikte\ndaha sade ve öngörülebilir hale getirelim.',120,510,1390,43,'muted')
    s.rect(120,707,940,108,'lime',r=22);s.text('Bir sonraki adımı konuşalım.',155,738,860,38,font='heading')
    s.text('Muhammed Talha Güler',120,863,900,30,font='bold');s.text('talha.guler@ozu.edu.tr · qualifilab.com',120,913,1350,27,'muted')
    s.image(R/'brand/QualiFi-Mark.png',1450,642,325,325)

    s=d.slide('Ek A / Çoklu ajan yaklaşımı','Tek sohbet.\nBeş uzman görev alanı.',notes='Beş görev alanı kullanıcının ürün vizyonundan alındı. Mimari tasarımdır; canlı ajan aktivasyonu, model doğruluk oranı veya hazır hesap erişimi anlamına gelmez. Tüm çıktılar için veri kaynağı, belirsizlik ve kullanıcı onayı sınırları tanımlanmalı.',tag='ÜRÜN EKİ · KAVRAMSAL TASARIM')
    for i,(a,b) in enumerate([('Sözleşme','Tutar, vade ve\nödeme koşulları'),('Bağlam','Sektör ve geçmiş\ngecikme bilgileri'),('İletişim','İzinli iş yazışmaları\nve ödeme taahhütleri'),('Takip','Kullanıcı kontrollü\nhatırlatma akışı'),('Öngörü','Tarihli nakit\nsenaryoları')]):
        x=120+i*340;s.rect(x,515,320,270,'white','line',r=24);s.text(f'0{i+1}',x+25,546,270,24,'muted',font='bold');s.text(a,x+25,605,270,36,font='heading');s.text(b,x+25,680,270,25,'muted',leading=1.35)
    s.rect(120,842,1680,70,'soft',r=18);s.text('Kullanıcı ön planda hedefini konuşur; ayrıntıyı ve dashboardları istediğinde açar.',150,863,1620,29,font='medium')

    s=d.slide('Ek B / Entegrasyon yaklaşımı','Aynı bilgiyi\nyeniden girdirmeden.',notes='Bu sayfa kullanıcıya gelen ERP/ön muhasebe geri bildirimini ele alır. Entegrasyonlar tamamlanmış değildir. Sözleşme beklenen yükümlülüğü, tahsilat kaydı gerçekleşeni gösterir. Excel/CSV ilk geçiş çözümü olarak önerilir; sonrasında hedef kitlenin seçtiği muhasebe/ERP API bağlantısı. Banka hesabı bilgisi istemeden başlangıç yapılabilir, ama ödeme yapıldı/yapılmadı bilgisi ERP, kayıt veya kullanıcı teyidiyle doğrulanmalıdır.',tag='ÜRÜN EKİ · PLANLANAN YAKLAŞIM')
    s.card('01','Mevcut kayıtlar','Excel / CSV veya seçili ERP ve ön muhasebe bağlantısı.',120,500)
    s.card('02','İş bağlamı','Sözleşme, kullanıcı girdisi ve izinli müşteri iletişimi.',700,500)
    s.card('03','Uzlaştırma','Beklenen ödeme ile gerçekleşen tahsilatın karşılaştırılması.',1280,500)
    s.text('Tahsilat bilgisi doğrulanır → kullanıcı onayıyla takip başlatılır → öngörü güncellenir.',120,880,1680,29,'muted',font='medium')

    s=d.slide('Ek C / Bankalar için büyüme alanı','Ödeme davranışını anlayın.\nRiski öngörün.',notes='Bankalar ana başlangıç segmenti değildir; kullanıcının belirttiği büyüme alanıdır. Amaç, izinli sözleşme ve iş iletişimi ile sektör bilgileri üzerinden geri ödeme değerlendirmesine ek sinyal araştırmaktır. Henüz canlı risk skoru, kredi kararı, doğrulanmış temerrüt tahmini veya bankayla iş birliği yok. Tarihsel örnekler, uzman değerlendirmesi ve mevcut yaklaşımla karşılaştırma planlanmalı.',tag='BÜYÜME EKİ · KURUMSAL PİLOT VİZYONU')
    s.text('Bankaların geri ödeme değerlendirmesine\nek iş bağlamı sağlayan kurumsal pilot yaklaşımı.',120,505,1640,38,'muted')
    for i,(a,b) in enumerate([('İzinli veriler','Sözleşme, iş iletişimi ve sektör bilgisi.'),('Değerlendirme','Geçmiş örnekler ve mevcut yaklaşımla karşılaştırma.'),('Uzman incelemesi','Açıklanabilir sinyaller ve kurum içi değerlendirme.')]):
        x=120+i*580;s.rect(x,675,520,210,'soft',r=20);s.text(a,x+28,707,464,34,font='heading');s.text(b,x+28,779,464,27,'muted')
    s.text('Geliştirme hedefi; bu aşamada canlı risk skoru veya otomatik kredi kararı sunulmuyor.',120,923,1680,23,'muted')

    s=d.slide('Ek D / Kaynaklar ve kanıt sınırı','Kaynaklar ve ürün durumu',notes='Tüm kaynaklar 15 Kasım 2026 tarihinde kontrol edildi. Eğitim dokümanı anlatı ve düzen referansı olarak kullanıldı; içindeki ikas, Fazla veya Experinn verileri QualiFi verisi olarak aktarılmadı. Gerçek şirket metrikleri uydurulmadı. İstenen üç bilgi sayfası boş bırakıldı.',tag='KAYNAKÇA · 15 KASIM 2026')
    rows=[('Anlatı rehberi','Experinn — Sunum Eğitimi, s. 6–7; kullanıcı tarafından yüklendi.'),('Marka ve ürün','QualiFi marka MD dosyası, canlı site ve bu görüşmedeki kurucu anlatısı.'),('Pazar zemini','KOSGEB 2026 göstergeler raporu, TÜİK 2024; PDF s. 17.'),('Rekabet kapsamı','Paraşüt: nakit akışı / tahsilat kılavuzu. Chaser: cash-flow forecast.'),('Durum sınırı','Canlı talep toplama; ajanlar ve entegrasyonlar geliştirme hedefi.')]
    for i,(a,b) in enumerate(rows):
        y=420+i*100;s.text(a,120,y,400,28,font='bold');s.text(b,570,y,1210,27,'muted');s.line(120,y+69,1800,y+69)
    s.text('Tam bağlantılar, kaynak notları ve sayfa bazlı konuşmacı notları teslim paketindedir.',120,929,1680,23,'muted')
    manifest=d.save();MANIFEST.append(manifest)

    b=Deck('QualiFi-Logo-ve-Marka-v2')
    s=b.slide('Logo / Optik düzenleme','Tanıdık işaret. Daha dengeli kullanım.',notes='Mevcut q ve nokta korunur; q Manrope çizgisine alınır, SVG dış font bağımlılığından kurtarılır. Sunum ve logo dosyaları yenidir. Canlı site veya eski Canva tasarımları değiştirilmedi.',tag='QUALIFI · MARKA SİSTEMİ V2')
    s.image(R/'brand/QualiFi-Mark.png',120,420,400,400);s.image(R/'brand/QualiFi-Wordmark.png',690,445,1080,338)
    s.text('Sembol · q + bağımsız nokta',120,863,520,27,'muted');s.text('Açık zeminde koyu wordmark · Manrope',690,863,1080,27,'muted')
    s=b.slide('Renk / Tipografi','Açık zemin. Koyu ve net metin.',notes='Renk ve fontlar önceki marka dosyasından korunur. Lime küçük metin rengi olarak kullanılmaz; forest ile kontrastlandırılır.',tag='QUALIFI · MARKA SİSTEMİ V2')
    for i,(key,label) in enumerate([('forest','Forest'),('lime','Lime'),('paper','Paper'),('muted','Sage')]):
        x=120+i*430;s.rect(x,445,390,200,key,'line',r=24);s.text(label,x,681,390,34,font='heading');s.text('#'+C[key],x,740,390,27,'muted')
    s.text('Manrope 600–700 / Başlık',120,857,800,35,font='heading');s.text('DM Sans 400–500 / Gövde',990,857,800,35)
    MANIFEST.append(b.save())
    (R/'deck-manifest.json').write_text(json.dumps(MANIFEST,ensure_ascii=False,indent=2),encoding='utf-8')
    notes=['# QualiFi yatırımcı sunumu — konuşmacı notları','Ana anlatı KOBİ / orta ölçekli işletmeler. Bankalar büyüme alanı.\n']
    for i,p in enumerate(manifest['pages'],1):notes+=['## '+str(i)+' · '+p['section'],p['title'],p['notes'],'']
    (R/'konusmaci-notlari.md').write_text('\n\n'.join(notes).rstrip()+'\n',encoding='utf-8')
    print('Decks ready:',[(m['name'],m['slides']) for m in MANIFEST])

if __name__=='__main__':make()
