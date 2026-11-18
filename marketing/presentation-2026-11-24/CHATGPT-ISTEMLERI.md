# 24 Kasım sunumu — ChatGPT istem paketi

Her başlık ayrı bir ChatGPT sohbetidir. Sohbetleri karıştırmayın: her biri kendi
bağlamını korur. Önce 1'i başlatın (sizinle röportaj yapacak), beklerken 2'yi
çalıştırın. 3 ve 4 sunumdan bağımsız ilerleyebilir.

| # | Sohbet adı | Model / mod | Ne çıkar | Ne zaman |
| --- | --- | --- | --- | --- |
| 1 | QualiFi sunum hikâyesi | GPT-6.1 Sol, düşünme açık | Kişisel hikâye, sunum akışı, konuşma metni, demo anı | Bugün |
| 2 | QualiFi farklılaşma ve gelecek | Deep research (bir kez) | Rakip haritası, 1 ve 5 yıl yol haritası, geleceğin bankacılığı | Bugün, 1 ile paralel |
| 3 | QualiFi Instagram ve reklam | GPT-6.1 Sol | 14 günlük içerik + reklam planı, sunum etrafında kampanya | Yarın |
| 4 | QualiFi sunum görselleri | Görsel üretimi | Kapak, vizyon ve yol haritası görselleri | 1 ve 2 bittikten sonra |

Ortak bağlam bloğunu (aşağıda) 1, 2 ve 3'ün başına aynen yapıştırın.

---

## Ortak bağlam bloğu

```
BAĞLAM — QualiFi (kopyalayıp her sohbetin başına koyuyorum)

Ben Muhammed Talha Güler, QualiFi'nin kurucusuyum. Özyeğin Üniversitesi'nde
Yönetim Bilişim Sistemleri ve Bilgisayar Mühendisliği çift anadal öğrencisiyim;
emlyon'da dijital pazarlama değişim programı yaptım; SOMFY senaryolu Digital
Night Challenge'da kazanan ekipteydim.

Ürün: 100-200 farklı müşteriye satış yapan veya onlardan ödeme alan, teknolojiye
yakın KOBİ'ler için finans ajanı. ERP, ön muhasebe ve banka API'si birleşse bile
üç şey yapılmıyor:
1) Taahhüdün NE ZAMAN ödeneceği (fatura, sözleşme taksiti, WhatsApp'ta verilen
   "cuma gönderiyoruz" sözü),
2) Her müşterinin geçmişte ne kadar erken/geç ödediği (ödeme karnesi),
3) Ödemelerin bir ajan tarafından takibi (vadeden önce hatırlatma, söz kontrolü,
   kullanıcı onayıyla mesaj).
Kısaca: ERP "ne kadar alacağın var" bilir; QualiFi "kimden, ne zaman, ne kadar
güvenle" bilir.

Bankacı tarafı: kredi riski / takipteki krediler birimindeki uzman (ör. 20 uzman ×
300 firma). Firmanın KENDİ müşterilerinden tahsil süresinin uzaması, kredinin
ödenmeyeceğinin en erken işaretidir; bilanço ve kredi kaydı bunu aylar sonra
gösterir. Panel: açıklamalı risk skoru, sektör analizi, WhatsApp'tan erteleme ve
nakit sıkıntısı işaretleri, taahhüt takibi, günlük arama listesi.

Bugün ne var (gerçek): qualifilab.com/demo adresinde çalışan, tıklanabilir demo.
- İşletme paneli: 8 haftalık nakit tahmini (iyimser-kötümser aralık), "şu müşteri
  30 gün geç öderse" senaryosu, müşteri ödeme karnesi (A-D), WhatsApp sözleri,
  kaynakları adım adım tarayan ve takip önerisi hazırlayan ajan, ajana soru sorma.
- Bankacı paneli: 300 / 6.000 firmalık portföy, risk etkenleri, sektör analizi,
  WhatsApp içgörüleri, taahhüt takibi, arama listesi.
- Demo verisi sentetik: mockerp, mockonmuhasebe, mockbanka adlı sahte kaynaklar.
  Gerçek ERP/banka bağlantısı yok. 3 tarih arasında geçiş var (27 Eki, 10 Kas,
  24 Kas); önceki tarihte yapılan tahminin gerçekleşenle karşılaştırması gösteriliyor.
- Sitede bekleme listesi ve pilot başvuru formu, özel admin paneli.

Ne YOK (sunumda olduğu gibi söylenmeyecek): ödeme yapan müşteri, banka
ortaklığı, gerçek veriyle ölçülmüş doğruluk oranı, canlı WhatsApp/ERP bağlantısı.
Dayanak: yaklaşık 20 girişimle görüşme ve yakından gözlemlenen bir yazılım
şirketinin ödeme gecikmesi (isim verilmeden anlatılacak). Nitel bulgular: veri
birden fazla yerden geliyor ve farklı yerlere gidiyor; nakit akışı otomatik
görülemiyor; yeni projenin nakde etkisi karşılaştırılamıyor; görüşülen
girişimlerde geciken alacaklarla tekrar tekrar karşılaşıldı. Kesin oran,
görüşme kayıtlarından sayılmadan söylenmeyecek.

Rakip araştırması sonucu (17 Kas): Tesorio ve Upflow ödeme davranışı tahmini,
yazışmadan taahhüt çıkarma ve takip ajanını zaten sunuyor; D&B Global Trade
Exchange ve Moody's Pulse ödeme verisi ağı kuruyor. Bu yüzden farklılaşma
"bu yeteneklere sahibiz" değil, şu üç tez:
1) Türkiye'de 100-200 alıcılı KOBİ'nin iş akışına uyum: yerel muhasebe,
   Türkçe yazışma (WhatsApp), daha az elle işlem.
2) Verilen söz ile gerçekleşen ödemeyi karşılaştırmak: yazışmanın, yalnız
   ödeme geçmişine bakan modele ek tahmin faydası.
3) İşletmenin izinli verisinden bankaya erken uyarı: bankanın mevcut
   göstergelerinden daha erken/isabetli sinyal.
Bunlar pilotta sınanacak tezlerdir, kanıtlanmış üstünlük değil.
Demoya 17 Kas'ta eklenenler (farklılaşmayı ekranda gösterir):
- Çek ve senet: mock verilerde vadeli çek/senet portföyü; ajan takas günü
  tahsilatı bekler, notu düşük keşideciden gelen çek için teyit önerir,
  karşılıksız çıkanı tahmine katmaz.
- "Bu işi alırsam": işin bedeli, avans, ek maliyet, teslim süresi ve kalan
  ödemenin vadesiyle 8 haftalık nakde etkisi ve karar ("taşınabilir" /
  "kasayı eksiye düşürüyor, şu kadar finansman gerekir").
- "Karnemi bankama göster": işletme, müşteri isimleri ve mesaj metni olmadan
  ödeme karnesinin özetini bankasına gönderir; bankacı panelinde "İşletme
  paylaştı" kartı olarak görünür. Banka KOBİ'yi izlemiyor; KOBİ iyi karnesini
  kendisi götürüyor.
Önerilen konumlandırma: "QualiFi, finans ekibi olmayan KOBİ'nin tahsilat
ajanı: faturayı, çeki ve WhatsApp'taki sözü tek takvimde izler; işletme isterse
bu ödeme karnesini bankasına götürür."
Demo bu tezleri gösterir: 10 Kas ve 24 Kas ekranlarında "Tahmin ve söz
karnesi" bölümü, önceki tarihte yapılan tahminlerin ve verilen ödeme
sözlerinin o güne kadar nasıl sonuçlandığını tek tek gösterir.

Marka: koyu yeşil #203B30, açık lime #D8EEA6, kırık beyaz #F6F7F2. Sade, sakin,
güven veren; abartı ve "devrim" dili yok. Kısa ifade: "Bir sonraki ödemene netlik."

Sunum: 24 Kasım 2026. Kitle: Akbank yetkilileri, girişim sermayesi tarafından
bir katılımcı ve diğer jüri üyeleri. Süre: 7 dakika sunum + 8 dakika soru-cevap.
Hedef: jürinin hem bugünkü probleme hem de ürünün büyüyebileceğine inanması.
```

---

## 1 — "QualiFi sunum hikâyesi" (GPT-6.1 Sol, düşünme açık)

```
[Ortak bağlam bloğu]

Görev: 24 Kasım sunumumun hikâyesini birlikte kuracağız. Mevcut 13 slaytlık
sunumum çok temkinli; her slaytta "bu iddia değildir" diyor ve ürünü "temsilî
örnek" diye anlatıyor. Artık çalışan bir demo var. Sunum basit bir nakit takip
aracı gibi değil, "AI çağında geleceğin bankacılığına" giden bir ürünün ilk adımı
gibi anlaşılmalı. Ama olmayan bir şeyi var gibi göstermeyeceğiz; kitle bunu
yakalar ve güveni kaybederiz. Vizyon cesur, kanıt dürüst olacak.

ADIM 1 — Önce bana röportaj yap. Tek seferde değil, 3'er soru halinde sor.
Kişisel hikâyem için şunları öğren: bu problemi ilk nerede gördüm (ailede,
bir işletmede, stajda?), hangi an beni harekete geçirdi, neden ben, neden şimdi,
görüşmelerde en çok aklımda kalan cümle, ekip/danışman durumu, bu sunumdan
somut olarak ne istiyorum (yatırım, pilot, banka görüşmesi, ödül?).
Cevaplarımı dinlemeden hikâye yazma.

ADIM 2 — Röportajdan sonra 3 farklı hikâye omurgası öner (her biri 5 cümle):
a) Kişisel an → problem → demo → gelecek
b) Bir müşterinin bir haftası (cuma sözü verilen ödeme) → ajan → banka
c) "Bankalar krediyi neden geç fark eder?" → işletme verisi → iki taraflı çözüm
Her birinin güçlü ve zayıf yanını yaz, kitleme göre birini öner.

ADIM 3 — Seçtiğim omurgayla slayt slayt akış çıkar (en fazla 12 slayt):
her slayt için başlık (en fazla 8 kelime), ekranda tek cümle, konuşma metni
(süreyi saniye olarak yaz), geçiş cümlesi. Demo anını ayrı yaz: canlı demoda
tam olarak hangi ekrana, hangi sırayla tıklayacağım ve o sırada ne söyleyeceğim
(öneri: 10 Kasım ekranında ajanın beklediği ödemeler ve verilen WhatsApp
sözleri → 24 Kasım'a geçince "Tahmin ve söz karnesi": hangi tahmin tuttu, hangi
söz tutulmadı, vade tarihine bakan basit yönteme göre fark → "şu müşteri 30 gün
geç öderse" senaryosu → bankacı paneline geçiş. 24 Kasım'dan sonraki haftalar
için yapılan tahminler henüz sonuçlanmadı; bunlar "tuttu" diye gösterilmez).
Demo en fazla 2 dakika.

ADIM 4 — Şunları ayrıca yaz:
- 30 saniyelik açılış (ezberlenecek)
- 20 saniyelik kapanış ve tek bir net talep
- En zor 10 soru ve kısa cevapları (ör. "Paraşüt de nakit takibi yapıyor",
  "Bankalar bu veriyi neden size versin", "WhatsApp verisini nasıl alacaksınız",
  "Doğruluk oranınız ne", "Neden bankalar kendisi yapmasın")
- Demo çalışmazsa B planı cümlesi

Dil: sade Türkçe, kısa cümleler, jargon yok. "Devrim", "disrupt", "ilk ve tek"
gibi kanıtlayamayacağım ifadeler kullanma.
```

---

## 2 — "QualiFi farklılaşma ve gelecek" (Deep research, bir kez)

```
[Ortak bağlam bloğu]

Görev: Sunumdaki "neden farklıyız" ve "1 yıl / 5 yıl" bölümleri için araştırma
yap. Her iddianın yanına açtığın resmi kaynağın linkini koy; bulamadığın şeyi
"doğrulanamadı" diye işaretle. Uydurma rakam kullanma.

1) Rakip haritası. Türkiye: Paraşüt, Logo, Mikro, Bizim Hesap, QNB Dijital Köprü /
   KolayBi, bankaların KOBİ nakit yönetimi ürünleri (ör. Akbank, Garanti BBVA,
   İş Bankası, Yapı Kredi), açık bankacılık / hesap bilgisi hizmeti sağlayıcıları.
   Global: alacak yönetimi ve nakit tahmini (ör. Tesorio, HighRadius, Upflow,
   Chaser, Agicap, Float), bankalar için erken uyarı sistemleri.
   Her biri için: kime satıyor, veri kaynağı, ödeme DAVRANIŞI tahmini var mı,
   WhatsApp/yazışmadan taahhüt çıkarıyor mu, takip ajanı var mı, banka tarafına
   veri sunuyor mu. Tek tablo.
2) Bu tabloya göre QualiFi'nin 3 net farkını yaz; her farkın neden kolay
   kopyalanamayacağını (veya kopyalanabileceğini) dürüstçe belirt.
3) Türkiye'de ilgili düzenleme ve altyapı: açık bankacılık / hesap bilgisi
   hizmeti çerçevesi, e-fatura yaygınlığı, KOBİ'lerde vadeli satış ve tahsilat
   gecikmesi, takipteki KOBİ kredileri oranı. Güncel resmi kaynaklarla.
4) "AI çağında geleceğin bankacılığı": ajan tabanlı finans (agentic finance),
   gömülü finans, alacak bazlı finansman / faktoring, gerçek zamanlı kredi riski,
   bankaların LLM kullanımı. Büyük danışmanlık ve kurum raporlarından (ör.
   McKinsey, BCG, BIS, Dünya Bankası) 5-6 güçlü, kaynaklı tespit.
5) QualiFi için iki yol haritası taslağı:
   - 1 yıl: somut kilometre taşları (pilot sayısı, ilk gerçek veri bağlantısı,
     banka pilotu, ölçülecek metrikler). Her biri "ne olursa başarı sayarız".
   - 5 yıl: ödeme davranışı ağı. Çok sayıda işletmenin alacak verisi biriktikçe
     aynı alıcının birden fazla satıcıya nasıl ödediği görülür; bu ağ etkisi
     (a) daha doğru tahmin, (b) bankalar için erken uyarı, (c) davranışa göre
     fiyatlanan alacak finansmanı, (d) ajanların vade ve ödeme planını
     karşılıklı müzakere etmesi şeklinde büyür. Bunun önündeki 5 gerçek engeli
     (veri izni, güven, düzenleme, bankaların iç sistemleri, kötüye kullanım)
     ve her birinin aşılma yolunu yaz.
6) Bunları 3 slayta sığacak şekilde özetle: "Neden farklıyız", "1 yılda",
   "5 yılda: geleceğin bankacılığı". Her slayt için ekranda en fazla 25 kelime.
```

---

## 3 — "QualiFi Instagram ve reklam" (GPT-6.1 Sol)

```
[Ortak bağlam bloğu]

Durum: Instagram ve reklam tarafında sorun var. [BURAYA YAZIN: takipçi sayısı,
son 2 haftada paylaşım sayısı, ortalama erişim, reklam bütçesi (TL/gün),
şimdiye kadar denenen reklamlar ve sonuçları, ne işe yaramadı]. Daha önce
6 günlük bir seri planlandı (dağınık ödeme bilgisi, teslim edilen iş-geciken
ödeme, 5 ajan, banka bilgisiyle başlamayan yaklaşım, freelancer ödeme planı,
özet); uygulanıp uygulanmadığı: [EVET/HAYIR/KISMEN].

Görev:
1) Önce bana en fazla 6 soru sorarak sorunu teşhis et (erişim mi, içerik mi,
   hedef kitle mi, düzen mi, CTA mı). Sonra teşhisini 5 madde yaz.
2) 18 Kasım-1 Aralık için 14 günlük plan: 24 Kasım sunumunu bir kampanya anına
   çevir (öncesi: merak, gün: canlı demo/arka plan, sonrası: demo linki ve
   sonuçlar). Ana malzeme artık çalışan demo: ekran kayıtlarıyla 15-25 sn Reels.
   Her gün için format, kanca (ilk 2 saniye cümlesi), ekran metni, açıklama,
   Story etkileşim etiketi (anket/soru) ve tek eylem.
3) Tekrar kullanılabilir 3 içerik şablonu: "Bir müşterinin ödeme karnesi",
   "Ajan bugün ne yaptı", "Bankacı ne görür".
4) Meta reklam planı: [bütçe] ile 2 kitle × 3 yaratıcı testi; kitle tanımları
   (ilgi alanı + yaş + konum + iş unvanı mantığı), 3 reklam metni varyantı,
   hedef (demo ziyareti mi, bekleme listesi mi), 3. günde neye bakıp neyi
   kapatacağım. Tıklama başına maliyet tahmini verme; sadece ölçüm planı ver.
5) Instagram'da bir etkinlik fikri: canlı yayın veya "işletmeni getir, ödeme
   karnesini birlikte okuyalım" gibi; katılımı ölçülebilir olsun.
Yanıtlarda "AI ajanımız müşterilerinizden otomatik tahsilat yapıyor" gibi
olmayan bir özelliği ima eden cümle kullanma; demo verisinin örnek olduğunu
gizleme.
```

---

## 4 — "QualiFi sunum görselleri" (görsel üretimi)

1 ve 2 bittikten sonra, seçtiğiniz slayt metinleriyle:

```
QualiFi sunumu için 16:9 görseller üret. Marka renkleri: koyu yeşil #203B30,
açık lime #D8EEA6, kırık beyaz #F6F7F2. Düz, sakin, editoryal; 3D parlak efekt,
robot, holografik beyin, dolar yağmuru yok. Metin koyma (metni ben eklerim).
1) Kapak: bir işletmenin alacak takvimi ile bir bankanın portföy görünümünü
   tek bir ince çizgiyle birbirine bağlayan soyut kompozisyon.
2) "Ödeme davranışı ağı": birbirine bağlı küçük işletme düğümleri; bazı
   bağlantılar lime ile vurgulanmış; ortada değil, sağa yaslı.
3) Yol haritası arka planı: soldan sağa 3 aşama için yumuşak bantlar
   (bugün, 1 yıl, 5 yıl), üzerinde boş alan.
4) Kurucu sayfası arka planı: fotoğrafın yerleşeceği sol yarı boş, sağda
   ince geometrik desen.
```

---

## Çıktılar bana dönsün

Her sohbetin sonucunu (özellikle 1'deki slayt akışı ve 2'deki yol haritası)
bana yapıştırın. Ben:
- Rakamları ve iddiaları demoda ve repoda gerçekten olanla karşılaştırırım,
- Demo akışını sunumdaki konuşmayla birebir eşlerim (gerekirse demoya
  sunum için "sunum modu" eklerim),
- Ana sayfa ve demo giriş metnini aynı dile çekerim.


---

## 5 — "QualiFi keskin tez" (GPT-6.1 Sol, düşünme açık; gerekirse Deep research)

18 Kasım derin araştırmasından sonra: araştırma dürüst ama savunmacı kaldı.
Bu istem rakip taramasını tekrar ettirmez; ondan sonra gelen soruyu sorar:
"Herkesin yapabildiğini bildiğimize göre, kimsenin yapmadığı ve 5 yılda
kategori kuracak hamle ne?"

```
[Ortak bağlam bloğu]

ÖNCEKİ ARAŞTIRMANIN SONUCU (bunu tekrar araştırma, üzerine kur):
- Ödeme davranışı tahmini (Tesorio, Growfin, Chaser), WhatsApp'tan ödeme sözü
  çıkarma (Peakflo), takip ajanı (Upflow, Stuut), nakit senaryosu (Float,
  Finrota NAP360), ödeme davranışı ağı (D&B, Moody's Pulse), vade müzakere
  ajanı (Pactum) ve banka erken uyarısı (SAS, Moody's, Findeks) zaten var.
- Türk bankaları DBS, garantili vadeli ödeme (Akbank Ödemen Güvende, Ziraat
  Kesin Ödeme, VakıfBank Vinov), çek/senet, açık bankacılık ve tedarikçi
  finansmanı sunuyor.
- TCMB 17 Mart 2026: ÖHVPS 2.0.0 ile ileri tarihli ve düzenli ödeme emri
  başlatma mümkün. e-Fatura'da 1,94 milyon mükellef var (GİB 2025); her
  faturada alıcının vergi numarası var.
- Önceki araştırmanın önerdiği yön: "aynı alacağı tüm kaynaklarda tanı",
  "tahsilat engelini bul", "güvenli avans/vade hesapla". Bunlar doğru ama
  jüriye "iyi bir araç" der, "kategori" demez.

BUGÜN ÇALIŞAN ÜRÜN (qualifilab.com):
- Ücretsiz kayıt; belge (PDF, fatura görseli, Excel, WhatsApp .txt) yükleme;
  ajan tutar/vade/karşı taraf/ödeme sözü çıkarıyor; kullanıcı düzeltiyor;
  8 haftalık nakit görünümü; döviz ve olası tekrar ayrımı.
- Demo: ödeme karnesi, çek/senet, "Bu işi alırsam" senaryosu, tahmin ve söz
  karnesi, "Karnemi bankama göster" (KOBİ'nin kendi onayıyla bankaya özet),
  bankacı paneli (portföy, sektör, WhatsApp içgörüsü, taahhüt takibi).
- Belge okuma maliyeti çok düşük (ucuz model); ölçek maliyeti sorun değil.

GÖREV: QualiFi için "çok ileri ama gerçekçi" ve fark yaratan çözüm bul. Üç
eksende keskinleş: (1) KOBİ'nin deneyimi, (2) ölçülebilir sonuç, (3) banka.

ADIM 1 — Ezber bozan 12 fikir üret. Her biri tek cümle + hangi gerçek
altyapıya dayandığı (ÖHVPS 2.0 ileri tarihli ödeme emri, e-Fatura/VKN,
çek/senet, DBS, KVKK açık rıza, WhatsApp Business, faktoring 6361 vb.).
Kural: "dashboard", "tahmin", "AI asistan", "risk skoru" tek başına fikir
sayılmaz. Şu tür tersine çevirmeleri zorla:
- Sözü veriye değil, işleme çevirmek (ör. WhatsApp'taki "cuma öderim" →
  alıcıya tek dokunuşla ileri tarihli ödeme talimatı linki).
- Bankanın erken UYARISINI erken YARDIMA çevirmek (en dar hafta görüldüğü an,
  sözü teyitli alacaklar karşılığında banka teklifi).
- KOBİ'yi izlenen değil veri sahibi yapmak (iyi ödeme karnesi = daha iyi
  koşul; "karne taşınabilirliği").
- Alıcıyı da kazandırmak (zamanında ödeyen alıcıya erken ödeme iskontosu /
  itibar), iki taraflı ağ etkisi.
- Ödemenin önündeki engeli (eksik evrak, itiraz, yanlış muhatap) ajanın
  kendisinin çözmesi.

ADIM 2 — 12 fikri tabloyla puanla (1-5): KOBİ'ye ilk haftada somut fayda,
bankaya gelir/risk etkisi, kopyalanma zorluğu (neden?), Türkiye'ye özgü
zamanlama avantajı, 24 Kasım'a kadar demoda gösterilebilirlik, düzenleyici
risk. En iyi 3'ü seç; neden diğerlerini elediğini bir cümleyle yaz.

ADIM 3 — Seçilen 3 fikir için ayrı ayrı:
a) Kullanıcı hikâyesi: Pazartesi sabahı bir KOBİ sahibinin telefonunda ne
   oluyor, adım adım (ekran değil; mesaj, karar, tek dokunuş).
b) Bankanın tarafı: hangi birim kullanır, hangi kararı daha iyi verir, banka
   bundan nasıl para kazanır veya zarar önler; Akbank'ın mevcut bir ürününe
   (Ödemen Güvende, DBS, KOBİ kredileri) nasıl takılır.
c) Neden bugün mümkün (2026 altyapısı), neden 3 yıl önce değildi.
d) Neden kopyalanması zor: biriken veri, iki taraflı ağ, güven, lisans/ortak.
e) Ölçülecek tek metrik ve pilotta başarı eşiği.
f) Yasal/izin gerçeği: QualiFi ne yapar, yetkili kuruluş ne yapar (ödeme
   emri başlatma, faktoring, müşteri sırrı). Engel değil, tasarım kısıtı
   olarak yaz.

ADIM 4 — Bu üçünü tek bir 5 yıllık hikâyeye bağla:
"Bugün → 1 yıl → 3 yıl → 5 yıl". Her aşamada KOBİ ne yaşar, banka ne kazanır,
QualiFi'nin elinde ne birikir. 2031 için tek cümlelik kategori adı öner
(ör. "ticari sözün altyapısı"); 3 alternatif ver.

ADIM 5 — 24 Kasım sunumu için:
- 7 dakikanın içine sığacak "keskin tez" slaytı (en fazla 20 kelime) ve 30
  saniyelik konuşma metni.
- Demoda bugün gösterilebilecek bir "vizyon anı" önerisi: mevcut ekranlara
  en fazla 1 gün işle eklenebilecek, fikri somutlaştıran tek etkileşim
  (ör. "en dar haftada banka teklifi" kartı veya "sözü talimata çevir"
  butonu). Ekranda ne yazar, kullanıcı neye basar, sonra ne olur; demo
  verisi olduğunu nasıl dürüstçe belirtiriz.
- Akbank jürisinin soracağı en sert 5 soru ve cevabı.

YAZIM KURALLARI: Sade Türkçe, kısa cümle. Cesur ol ama olmayan müşteri,
ortaklık, doğruluk oranı yazma. Her iddiayı şu etiketlerden biriyle
işaretle: [Bugün çalışıyor] [24 Kasım demosu] [Pilot hedefi] [Vizyon].
Rakip listesini tekrar etme; yalnız fikrin özgünlüğünü test etmek için
gerektiğinde bir rakibe atıf yap.
```
