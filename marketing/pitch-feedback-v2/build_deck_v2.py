from pathlib import Path
import importlib.util,json,shutil,sys
sys.dont_write_bytecode=True
from PIL import Image

R=Path(__file__).resolve().parent
BASE=R.parent/'investor-deck-v1'
if not BASE.exists(): BASE=Path('/workspace/work/qualifi-live/marketing/investor-deck-v1')
FIN=R.parent/'deck-13-final-v1'
if not FIN.exists(): FIN=R.parent/'qualifi-13-final'
spec=importlib.util.spec_from_file_location('deckbase',BASE/'build_deck.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);m.R=R
(R/'brand').mkdir(exist_ok=True);shutil.copy2(BASE/'brand/QualiFi-Wordmark.png',R/'brand/QualiFi-Wordmark.png')
d=m.Deck('QualiFi-Gorusme-Bulgulari-Sunum-v2')
source='Kaynak: kurucunun aktardığı ilk görüşmeler. Nitel bulgular; örneklem büyüklüğü ve yaygınlık ölçümü paylaşılmadı.'
notes=[]
def slide(section,title,speech,notes_extra=''):
 s=d.slide(section,title,notes=speech+'\n\n'+notes_extra);notes.append((section,title,speech,notes_extra));return s
def label(s,t,x,y,w=1500,size=25):s.text(t,x,y,w,size,'muted',font='bold')
def stage(s,n,x,y):s.circle(x,y,48);s.text(str(n),x,y+12,48,22,font='bold',align='center')

s=slide('01 / Giriş','', 'İşi teslim ettiniz. Ödeme cuma gelecekti; yeni tarih bir mesajda kaldı. Peki gelecek ay yeni bir projeyi üstlenebilir misiniz? QualiFi’yi proje ve vadeli tahsilatla çalışan KOBİ’lerin bu soruya daha az elle takip yaparak cevap verebilmesi için geliştiriyorum. Bu açılış örnektir; müşteri alıntısı değildir.','Ana kullanıcı işletme sahibi ve finans sorumlusu. Bankalar sonraki büyüme alanı. Henüz çalışan otonom ajan veya tahsilat garantisi iddiası yok.')
s.text('İş bitti.\nÖdeme takibi bitmedi.',120,315,1680,100,font='heading',leading=1.14)
s.text('Proje ve vadeli tahsilatla çalışan KOBİ’ler için\nsözleşme, iş iletişimi ve mevcut kayıtlardan nakit planı.',120,640,1640,38,'muted')
label(s,'İLK ODAK: TEKNOLOJİ VE HİZMET İŞLETMELERİ',120,805,size=24)
s.tag('GELİŞTİRME AŞAMASINDA',120,880,500)

s=slide('02 / Görüşmelerden problem','Kayıtlar var.\nBirleşik nakit resmi yok.','İlk görüşmelerden üç ihtiyaç aktarıldı. Birincisi, veriler birden fazla yerden alınıyor ve farklı yerlere gidiyor. İkincisi, nakit akışı otomatik görülemiyor. Üçüncüsü, olası yeni projelerin etkisi karşılaştırılamıyor. Bunlar nitel bulgular; görüşme sayısı veya tüm pazarın görüşü gibi sunmuyorum.',source)
s.text('İlk görüşmelerde dile getirilen ihtiyaçlar.',120,490,1580,32,'muted')
problems=[('Veri farklı kaynak ve sistemler arasında','Birden çok noktadan çekilip farklı yerlere aktarılıyor.'),('Nakit akışı otomatik görünmüyor','Girdiler değiştikçe güncellenen bir görünüm isteniyor.'),('Yeni projenin etkisi görülemiyor','Olası işin tahsilat ve gider senaryosu karşılaştırılamıyor.')]
for i,(a,b) in enumerate(problems):
 y=570+i*118;stage(s,i+1,120,y);s.text(a,200,y-3,1530,37,font='heading');s.text(b,200,y+48,1500,29,'muted');s.line(200,y+100,1800,y+100)
s.text('Kurucunun aktardığı nitel görüşme bulguları · Henüz yaygınlık veya ödeme isteği ölçümü değil.',120,938,1680,22,'muted')

s=slide('03 / Ürün ve AI katmanı','Beş görev arka planda.\nSiz sonucu ve gerekçesini sorun.','Sözleşme ajanı tutar ve vadeyi, iletişim ajanı son taahhütleri çıkarır. Bağlam ajanı geçmiş ödeme ve uygun sektör verisine bakar. Takip ajanı, ödeme durumu doğrulandıktan sonra mesajı kullanıcı onayına hazırlar. Planlama ajanı beklenen nakdi ve proje senaryosunu günceller. Kullanıcı beş ayrı sistem yönetmez; tek konuşma ekranından sonucu ve dayanağını sorar.','Tasarlanan özellik setidir. Kaynak gösterme, belirsizlik, yetki ve kullanıcı onayı ürün gereksinimidir; canlı ürün başarısı değildir. Banka şifresi istenmeden belgeyle başlanabilir; gerçekleşen ödeme ERP/CSV veya kullanıcı teyidiyle doğrulanmalı.')
agents=[('Sözleşme','Tutar · vade · koşul','Belgeden yükümlülük\nçıkarır; kaynağını gösterir.'),('İş iletişimi','Son ödeme taahhüdü','İzinli yazışmadaki tarih\nve değişiklikleri ayırır.'),('Bağlam','Geçmiş + sektör','Ödeme geçmişi ve uygun\nsektör verisini inceler.'),('Takip','Onaylı aksiyon','Ödeme teyidinden sonra\nmesajı onaya hazırlar.'),('Nakit planı','Senaryo + gerekçe','Beklenen nakdi günceller;\nyeni proje etkisini kıyaslar.')]
for i,(a,b,c) in enumerate(agents):
 x=120+i*342;s.rect(x,520,70,7,'lime');label(s,f'0{i+1}',x,562,315,24);s.text(a,x,625,315,35,font='heading');s.text(b,x,690,315,24,font='bold');s.text(c,x,749,315,25,'muted',leading=1.3)
s.line(120,850,1800,850)
s.text('GİRDİ: ERP / Excel + sözleşme + izinli iş iletişimi → ORTAK VERİ MODELİ → nakit planı / takip / aktarım',120,874,1680,24,font='bold')
s.text('Tasarlanan ürün · Ödeme teyidi gerekir; vadenin geçmesi tek başına yeterli değildir. Ayrıntı ve gerekçe isteğe bağlıdır.',120,932,1680,22,'muted')

s=slide('04 / Temsilî ürün deneyimi','Bu projeyi alırsam\nbu ay nakdim ne olur?','Temsilî bir örnek alalım. Başlangıç nakdi 40 bin, mevcut tahsilatlar 60 bin ve ödemeler 70 bin: dönem sonu 30 bin TL. Yeni 80 bin TL’lik projenin bu ay 20 bin TL avansı, 35 bin TL ek maliyeti varsa dönem sonu nakdi 15 bine iner. Kalan tahsilat sonraki dönemdir. QualiFi’nin hedefi, sonucu dayanağıyla göstermek ve avans veya vade görüşmesi gibi seçenekleri incelemektir.','Tüm tutarlar varsayımsal ve tek dönemlidir. Yeni projenin kalan 60 bin TL tahsilatı bu döneme dahil değildir. Gerçek vergi, çalışma sermayesi ve riskler örnek kapsamı dışındadır. Bu çalışan bir ürün gösterimi değildir.')
example=[('Mevcut plan','40 bin başlangıç + 60 bin tahsilat − 70 bin ödeme = 30 bin TL'),('Yeni proje varsayımı','80 bin TL iş: bu ay 20 bin avans, 35 bin maliyet; kalan sonra.'),('Senaryoları karşılaştır','Proje alınmazsa 30 bin TL / alınırsa 15 bin TL dönem sonu.'),('Gerekçeyi ve seçeneği sor','Nakit bu ay 15 bin TL azalır. Avans veya maliyet vadesi görüşülebilir.')]
for i,(a,b) in enumerate(example):
 y=490+i*108;stage(s,i+1,120,y);s.text(a,195,y-1,920,30,font='heading');s.text(b,195,y+42,900,25,'muted');s.line(195,y+94,1080,y+94)
s.rect(1160,490,640,395,'white','line',r=20);label(s,'TEK KONUŞMA ARAYÜZÜ · KAVRAMSAL',1190,519,580,20)
s.text('Bu proje nakdimi nasıl etkiler?',1190,570,560,30,font='heading');s.rect(1190,642,580,112,'soft',r=14)
s.text('Dönem sonu: 15 bin TL\nMevcut plana göre: −15 bin TL',1215,663,530,28,font='bold');s.text('Neden?\nMaliyet, kalan tahsilattan önce çıkıyor.\nKaynak: proje girdileri ve mevcut plan.',1190,785,565,24,'muted',leading=1.25)
s.text('Temsilî senaryo · Tüm tutarlar varsayımsaldır. Arayüz ve ajanlar geliştirme hedefidir.',120,939,1680,22,'muted')

s=slide('05 / Pazar ve hedefleme','Geniş pazar.\nOdaklı başlangıç.','TAM için 3,93 milyon sanayi ve hizmet KOBİ’si var. SAM için bilgi-iletişim ile mesleki, bilimsel ve teknik faaliyetlerdeki 377.727 işletmeyi sektör havuzu olarak kullanıyorum. Bu nitelikli müşteri veya satın alma isteği değildir. İlk ay teknoloji odaklı 900 işletmeye ulaşmak bir erişim hedefi; ücretli müşteri SOM’u değil.','Kaynak: KOSGEB 2026 / TÜİK 2024, Tablo 3, basılı s.11 / PDF s.20. J: 65.699 + M: 312.028 = 377.727. SOM pilot verisiyle doğrulanacak.')
s.circle(155,510,400,'forest');s.circle(225,600,275,'lime');s.circle(286,684,153,'paper');s.text('TAM',155,552,400,42,'paper',font='heading',align='center');s.text('SAM',225,642,275,37,font='heading',align='center');s.text('SOM',286,735,153,28,font='heading',align='center')
for y,a,b in [(500,'TAM 3,93 milyon','Türkiye’de sanayi ve hizmetlerdeki KOBİ’ler'),(650,'SAM* 377.727','Bilgi-iletişim ile mesleki, bilimsel ve teknik faaliyetler (J + M)'),(800,'SOM · Doğrulanacak','İlk ay erişim hedefi: 900 teknoloji odaklı işletme')]:
 s.text(a,790,y,1000,45,font='heading');s.text(b,790,y+65,1000,27,'muted')
s.text('KOSGEB 2026 / TÜİK 2024, Tablo 3, basılı s.11 / PDF s.20 · SAM sektör temelli ön tahmindir.',120,930,1680,21,'muted')

s=slide('06 / İş modeli','KOBİ aboneliğiyle başla.\nBanka pilotuyla genişle.','İlk gelir modeli, işletme sahibinin veya finans ekibinin kullandığı abonelik. Veri kaynağı, belge ve iş hacmi plan kapsamını belirleyecek. Kurumsal banka tarafı ise ihtiyaç ve sonuç doğrulandıktan sonra pilot ve lisans görüşmesidir. Kesin fiyat ve ödeme isteği henüz doğrulanmış değil.','TR fiyatları yayımlanmıyor. Finansal örnekteki fiyat yalnız varsayımdır. Banka geliri finansal senaryoya dahil değildir.')
for x,n,a,b,c in [(120,'01','İŞLETME','Aylık abonelik','Beklenen nakit, proje senaryosu ve\nkullanıcı onaylı takip akışı.'),(1010,'02','BANKA · SONRAKİ AŞAMA','Pilot → kurumsal lisans','İzinli işletme özeti ve uzman incelemesi.\nKapsam, pilot sonucuyla belirlenecek.')]:
 s.line(x,510,x+760,510,'forest',3);label(s,n+' / '+a,x,545,760,24);s.text(b,x,610,760,45,font='heading');s.text(c,x,695,760,31,'muted');s.text('Kapsam: veri kaynağı, belge ve iş hacmi' if n=='01' else 'Önkoşul: veri izni ve ölçülmüş ek değer',x,835,760,25,font='bold')
s.text('İş modeli hipotezi · Paket, fiyat ve satın alma isteği işletme pilotuyla doğrulanacak.',120,936,1680,22,'muted')

s=slide('07 / Görüşmelerden ürün kararına','Bu bulgular, ilk sürümün\nkapsamını belirliyor.','Görüşmelerden gelen ihtiyaçları ürün kararına çevirdim. Çoklu kaynak ihtiyacı veri akışını, otomatik görünüm ihtiyacı beklenen nakit güncellemesini, yeni iş ihtiyacı proje senaryosunu öne aldı. Önceki ERP geri bildirimi de mükerrer veri girişinden kaçınmamız gerektiğini söyledi. Bugün canlı olan, site ve başvuru akışları. Sıradaki doğrulama gerçek iş akışında bir pilot.','Ürün kararları tamamlanmış uygulama veya kanıtlanmış fayda değildir. Görüşme sayısı, ücretli müşteri sayısı, gelir ve dönüşüm oranı verilmedi. '+source)
label(s,'GÖRÜŞMEDE DİLE GETİRİLEN İHTİYAÇ',120,500,770,23);label(s,'PLANLANAN ÜRÜN KARŞILIĞI',1010,500,770,23)
rows=[('Farklı kaynaklardan al, farklı yerlere aktar.','Mevcut kaynakları ortak veri modeline bağla.'),('Nakit akışını otomatik göremiyorum.','Yeni veri geldikçe beklenen nakit planını güncelle.'),('Olası proje senaryolarını göremiyorum.','İş alınırsa / alınmazsa tahsilat ve gideri kıyasla.')]
for i,(a,b) in enumerate(rows):
 y=565+i*100;s.text(str(i+1),120,y,60,31,font='heading');s.text(a,195,y,720,29);s.text('→',930,y,60,32);s.text(b,1010,y,770,29);s.line(195,y+80,1800,y+80)
s.rect(120,872,1680,52,'soft',r=8);s.text('BUGÜN: site + başvuru akışları.  SIRADA: veri kalitesi, fayda ve ödeme isteğini gerçek iş akışında sınamak.',140,886,1640,23,font='bold')
s.text('Kurucunun aktardığı nitel görüşme bulguları · Tırnak içi doğrudan alıntı veya yaygınlık ölçümü değildir.',120,943,1680,20,'muted')

s=slide('08 / Rekabet ve farklılaşma','Farkı, kullandığımız veride\nve iş akışında arıyoruz.','Paraşüt nakit ve tahsilat takibi sunuyor. QNB Dijital Köprü ön muhasebe ve entegre iş çözümlerine erişim sağlıyor. Dolayısıyla rakiplerde entegrasyon veya nakit takibi yok diyemeyiz. QualiFi’nin test edeceği yaklaşım, izinli sözleşme ve iletişimi mevcut kayda bağlayıp gerekçeli nakit ve proje senaryosu sunmak.','Resmî kaynaklar 17Kasım2026: https://www.parasut.com/kullanim-kilavuzu/nakit-akisi-tahsilat-ve-odeme-takibi ; https://www.qnb.com.tr/dijitalkopru/dijital-cozumlerimiz/kolaybi . QualiFi üstünlüğü doğrulanmış değil.')
for x,a,b,c in [(120,'MEVCUT ÜRÜN','Paraşüt','Finansal kayıt, nakit akışı,\ntahsilat ve ödeme takibi.'),(700,'MEVCUT PLATFORMLAR','QNB Dijital Köprü','Ön muhasebe, e-dönüşüm ve\nentegre iş çözümlerine erişim.'),(1280,'HEDEFLENEN YAKLAŞIM','QualiFi','Sözleşme + izinli iletişim +\nmevcut kayıtla gerekçeli\nnakit ve proje senaryosu.')]:
 s.rect(x,510,520,7,'lime' if b=='QualiFi' else 'line');label(s,a,x,556,520,23);s.text(b,x,620,520,40,font='heading');s.text(c,x,713,520,29,'muted')
s.text('Kaynak: Paraşüt kullanım kılavuzu; QNB Dijital Köprü / KolayBi ürün sayfası · 17 Kasım 2026',120,926,1680,21,'muted')

s=slide('09 / Banka için değer hipotezi','Banka pilotu:\nişletmenin nakit ihtiyacını anlamak.','Bankaya önerim ham mesajları göstermek değil, işletmenin izin verdiği veriden kaynaklı bir iş özeti üretmek. Nakit ihtiyacı görüşmesine hazırlığı, geri ödeme değerlendirmesine ek bağlamı ve daha ilgili hizmet görüşmelerini pilotta sınamak istiyorum. Kazanım yüzdesi veya risk azalması iddia etmiyorum.','Bankayla canlı ortaklık yok. Ham yazışma varsayılan paylaşılmaz. Kredi kararı bankada; otomatik skor ya da onay mekanizması sunulmuyor. Bu bir gelecek pilotu önerisi.')
for x,t,w in [(120,'İŞLETME SİNYALİ',500),(700,'BANKA İÇİN HİPOTEZ',600),(1380,'PİLOT ÖLÇÜMÜ',420)]:label(s,t,x,500,w,23)
bank=[('Tahsilat ve yaklaşan ödeme farkı','Nakit ihtiyacı görüşmesine hazırlık','Hazırlık süresi / kullanılabilirlik'),('Vade ve son taahhütteki değişim','Değerlendirmeye kaynaklı ek bağlam','Uyarı isabeti / yanlış alarm'),('Proje ve finansman senaryosu','İlgili hizmeti uygun bağlamda görüşmek','Kullanım / görüşmeye dönüşüm')]
for i,row in enumerate(bank):
 y=575+i*105
 for t,x,w in zip(row,[120,700,1380],[510,600,420]):s.text(t,x,y,w,29)
 s.line(120,y+85,1800,y+85)
s.text('Önerilen pilot: izinli türetilmiş özet. Ham yazışma varsayılan paylaşılmaz; kredi kararı bankada kalır.',120,938,1680,22,'muted')

s=slide('10 / Ürün ve bankacılık yol haritası','İşletme ajanından\nbankada değerlendirilebilir bağlama.','Önce veriyi güvenilir birleştirmek, sonra ajan önerisini ölçmek gerekiyor. Üçüncü aşama, işletmenin izin verdiği özetlerle banka pilotunun kapsamını sınırlandırmak. Ancak ölçülmüş ek değer ve uygunluk varsa kurum içi API, yetki ve izlenebilirlikle ölçekleme düşünülebilir. Banka ürünü yalnızca AI etiketi değil; bu geçiş ölçütlerine bağlı bir araştırma ve ürünleşme yolu.','1–12ay önerilen yatırım dönemi. 12ay sonrası bu yatırım planının dışında. Erişim izinleri, güvenlik, veri kalitesi, yanlış alarm ve insan değerlendirmesi geçiş ölçütüdür. WhatsApp Business erişimi fizibiliteye bağlıdır.')
road=[('1–3 AY','Veriyi birleştir','Sözleşme + CSV / Excel\nTutar, vade ve tahsilat eşleme','Alan doğruluğu / veri kalitesi'),('4–6 AY','Ajanı doğrula','Seçili ERP / Gmail bağlantısı\nKaynaklı öneri ve kullanıcı onayı','Hatalı takip / senaryo hatası'),('7–12 AY','Banka pilotu','İzinli özet + uzman incelemesi\nGeçmiş veride değerlendirme','Ek değer / yanlış alarm analizi'),('12 AY SONRASI','Kanıt varsa ölçekle','API, kurum içi rol ve yetki\nİzlenebilirlik / güvenlik testleri','Teknik ve ticari uygunluk')]
for i,(period,title,body,gate) in enumerate(road):
 x=120+i*428;s.rect(x,510,395,7,'lime' if i<3 else 'line');label(s,f'0{i+1}  /  '+period,x,560,395,22);s.text(title,x,632,395,33,font='heading');s.text(body,x,705,395,24,'muted');s.line(x,825,x+385,825);label(s,'GEÇİŞ ÖLÇÜTÜ',x,849,395,20);s.text(gate,x,891,395,22)
s.text('Önerilen plan · İzin, veri kalitesi ve pilot sonuçlarına bağlıdır. 12 ay sonrası mevcut yatırım döneminin dışındadır.',120,943,1680,20,'muted')

s=slide('11 / Finansal örnek senaryo','12 aylık örnek senaryo','Bu grafik gerçek gelir veya müşteri verisi değil; önceki onaylanan varsayımlı model. Yıllık gelir yaklaşık 314 bin TL, 12. ay MRR 67,6 bin TL, faaliyet sonucu yaklaşık eksi 986 bin TL. Entegrasyon, veri ve B2B için 450 bin TL ek kapsam modelde var. Bu senaryo kesin fiyat veya kesin büyüme taahhüdü değil; yatırım planının hangi varsayımlara dayandığını görünür kılıyor.','Varsayımlar önceki modelle aynıdır. 1.500TL/hesap/ay,450TLdeğişkenmaliyet,%3aylık kayıp,50brütyenihesap. KDV/vergi/finansman/ilk yatırım/işletme sermayesi hariç. Banka geliri eklenmedi. LTV bilinmiyor. Model: QualiFi-12-Aylik-Yatirim-Senaryosu.xlsx')
s.rect(100,345,1720,620,'paper');s.image(FIN/'financial-composition.png',120,350,1680,610)

s=slide('12 / Yatırım talebi ve kullanım','Bu yatırımla hedef:\nçalışan ürün ve kurumsal pilot.','Önerdiğim 1,5 milyon TL, 12 aylık bir planlama senaryosu. Çekirdek operasyon850 bin; muhasebeERP200 bin; veri güvenliği ve yedekleme100 bin; B2B pilotları150 bin; rezerv200 binTL. Amacım entegrasyonları, ajan davranışını ve işletme pilotunu doğrulamak; uygun koşullar oluşursa banka pilotunun kapsamını çalışmak. Bunlar tedarikçi teklifleriyle netleşecek bütçeler.','Tutarlar plan varsayımıdır. Fiziksel veri merkezi kurma, ödeme kuruluşu faaliyeti, değerleme ve hisse oranı varsayılmadı. Gelir yatırım ihtiyacından düşülmedi. 12ay çalışma garantisi değildir.')
s.image(FIN/'funding-use.png',120,430,1680,500)
s.text('Pilot ve yatırım görüşmesi: talha.guler@ozu.edu.tr · qualifilab.com',120,943,1680,22,font='bold')

s=slide('13 / Kurucu ve kapanış','Muhammed Talha Güler','Ben Talha. Özyeğin’de Yönetim Bilişim Sistemleri ve Bilgisayar Mühendisliği çift anadal öğrencisiyim; emlyon’da dijital pazarlama değişim eğitimi aldım. Porsuk, Endgame Arena, QualifiLab ve OzU Ventures çalışmalarındaki deneyimimi bu projeye taşıyorum. QualiFi’yi işletmelerle başlayıp ölçülebilir bir banka pilotuna doğru geliştirmek için görüşmeye açığım.','Fotoğrafın tam çözünürlüklü Canva varlığı mevcut9.sayfada korunacak ve ana sunumda sona taşınacak. Aşağıdaki kaynak sunum, çalışma kopyasıdır; ana dosyada özgün ekip sayfası kullanılacak.')
s.text('Kurucu',120,465,1200,28,'muted',font='bold');s.text('Özyeğin Üniversitesi\nYönetim Bilişim Sistemleri + Bilgisayar Mühendisliği çift anadal\nemlyon’da dijital pazarlama değişim eğitimi',120,530,1630,36,'muted')
s.text('Önceki çalışmalar',120,715,1630,28,font='bold');s.text('Porsuk · Endgame Arena · QualifiLab · OzU Ventures',120,765,1630,35)
s.rect(120,850,1680,65,'soft',r=12);s.text('İşletme ve banka pilotları için görüşelim.  talha.guler@ozu.edu.tr',145,866,1630,29,font='bold')

manifest=d.save();(R/'deck-manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2))
out=['# QualiFi — 17 Kasım 2026 sunum konuşma ve tıklama notları','Ana anlatı: proje ve vadeli tahsilatla çalışan KOBİ. Banka: gelecekteki pilot. Tüm görüşme bulguları kurucunun nitel aktarımı.']
for section,title,speech,extra in notes:out+=['## '+section,title,speech,'Kanıt / durum: '+extra,'']
(R/'KONUSMA-NOTLARI.md').write_text('\n\n'.join(out).rstrip()+'\n')
print('Built editable PPTX + vector PDF:',len(manifest['pages']),'slides.')
