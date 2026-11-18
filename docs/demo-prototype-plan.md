# QualiFi demo prototipi — 24 saatlik plan dosyası

Bu dosya Claude, Lovable ve ChatGPT/Codex'in ortak görev listesidir. Bir göreve
başlamadan önce `main`'i çekin, bitirince kutuyu işaretleyip commit edin.
Rapor ve gerekçeler: Claude Docs'taki "QualiFi Site Analizi ve 24 Saatlik Plan".

## Hedef

**Sunum: 24 Kasım 2026.** Demo tarihleri 27 Ekim, 10 Kasım ve 24 Kasım; varsayılan 24 Kasım,
böylece demodaki "bugün" sunum günüyle aynı.

Sunumda da kullanılacak, her tuşu çalışan bir demo ürünü qualifilab.com üzerinde:

1. **Demo işletme hesapları** — `mockerpXXX`, `mockonmuhasebeXXX`, `mockbankaXXX`
   sahte kaynaklarından tarih tarih gelen veriyle gerçek nakit tahmini.
2. **Boş işletme hesapları** — kullanıcı sözleşme, Excel, fatura görseli ve
   WhatsApp sohbeti yükler; aynı paneller küçük ama gerçek tahmin verir.
3. **Bankacı paneli** — bölge biriminde 20 uzman × 300 firma; sektör analizi,
   WhatsApp içgörüleri, taahhüt takibi.
4. **Admin (Talha)** — 100 hesabı CSV ile açar, her hesabı onun gözünden görür,
   demo tarihini ileri alır.

QualiFi'nin farkı: taahhüdün **ne zaman** ödeneceği, müşterinin geçmişte ne kadar
erken/geç ödediği ve ödemelerin bir ajanla takibi. ERP + ön muhasebe + banka API
birleşse bile bu üçü yok.

## Alınan kararlar (değiştirmek isterseniz söyleyin)

| Karar | Neden | Sonuç |
| --- | --- | --- |
| Demo paneller giriş istemeden `/demo` altında açık | Sunumda ve ana sayfadaki "Demo işletmeyi incele" butonunda şifresiz açılsın | Yalnız uydurma veri gösterir, arama motorlarına kapalı (noindex). Hesaplı giriş `/app` altında ayrıca gelecek |
| Ajan cevapları kural tabanlı, yapay zekâ çağrısı yok | Sunumda her seferinde aynı ve doğru rakam; kredi harcamaz, internet yavaşken de çalışır | Serbest soruların hepsini anlamaz; anlamadığında önerilen soruları gösterir. İsterseniz sonra Lovable AI ile genişletilir (istem L5) |
| Animasyon için yeni kütüphane eklenmedi | Repoda bun.lock var; yeni paket Lovable kurulumunu bozabilir | Geçişler CSS ve Recharts ile; "hareketi azalt" tercihine uyar |
| Sunum günü = demodaki "bugün" (24 Kasım) | Sahnede tarih tutarlı olsun | 27 Ekim'de ajan nakit sıkışması uyarısı verir, 24 Kasım'a gelince durum değişir |

## Değişmeyen kurallar

- Aynı dosyaya aynı anda iki araç dokunmaz. Başlamadan `git pull`, bitince push.
- Force push, rebase, amend yok (Lovable geçmişi bozulur).
- `supabase/migrations/`, `drizzle/`, otomatik üretilen dosyalar ve gizli
  anahtarlar yalnız Lovable'dan değişir.
- Demo verisi her yerde "Demo verisi" etiketi taşır. "Canlı entegrasyon",
  "banka ortağımız", doğruluk oranı gibi iddialar kanıt olmadan yazılmaz.
- Demo verisi veritabanına yazılmaz; hesap numarasından deterministik üretilir
  (`src/lib/demo/`). Böylece Lovable'a mock tablo açtırmak ve kredi harcamak gerekmez.
- Hesap türü ve numarası Supabase kullanıcısının `app_metadata` alanında:
  `qualifi_role` = `demo` | `blank` | `banker` | `admin`, `qualifi_tenant` = `017`,
  bankacı için `qualifi_region` ve `qualifi_banker_no`.

## Kredi bütçesi (Lovable)

Üst sınır **~40 kredi**, bakiyenin yarısını asla geçmez. Her istekten sonra
"More options → Credits used" değerini aşağıya yazın.

| İstek | Tahmin | Gerçek |
| --- | --- | --- |
| L0 + buton kontrolü (Plan) | 2 | |
| L1 Yükleme tabloları + depo + etkileşim kaydı (Plan + Build) | 5–8 | |
| L2 Belgeden taahhüt çıkarma fonksiyonu | 4–8 | |
| L3 Görsel cila (panel sayfaları) | 8–15 | |
| L4 Hata düzeltme payı | 5–10 | |
| **Toplam** | **24–43** | |

## Zaman çizelgesi ve görevler

0\. saat = başladığınız an. Sahip: **C** Claude, **L** Lovable, **G** ChatGPT/Codex, **T** Talha.

### 0–4. saat: temel

- [x] C — Bu plan dosyası ve istem paketi
- [x] C — Tahmin motoru + deterministik mock veri üreticisi + testler (`src/lib/demo/`)
- [x] L — **L0** doğrulama, buton düzeltmesi kontrolü, Publish (17 Kas)
- [x] L — **L1**: boş hesap yüklemeleri + demo etkileşim kaydı (17 Kas, Claude inceledi)
- [x] C — Tahmin ve söz karnesi; çek/senet; "Bu işi alırsam" senaryosu; "Karnemi bankama göster" (17 Kas)
- [x] C — Demo panelleri etkileşim kaydına bağlandı (tarih, sekme, kart, senaryo, soru, onay/düzenle/ertele)
- [ ] G — **G1–G3** istekleri: demo belgeleri, WhatsApp sohbetleri, ana sayfa metin varyantları
- [ ] T — Lovable'da "Edit with Lovable" rozetini gizle; takvim linkini ver (Cal.com/Calendly)

### 4–13. saat: paneller ve site

- [x] C — Demo tarihi seçici (27 Eki · 10 Kas · 24 Kas) ve geçiş animasyonları
- [x] C — Giriş (`/app/giris`) ve role göre panel (`/app`): demo işletme, bankacı, boş işletme, admin (17 Kas)
- [x] C — İşletme paneli (`/demo/isletme`): nakit tahmini + senaryo, müşteri ödeme karnesi,
      beklenen tahsilatlar, WhatsApp sözleri, kaynaklar, müşteri kartı
- [x] C — Ajan: adım adım çalışma akışı, günlük özet, soru-cevap, "ya geç öderse" senaryosu,
      onay/düzenle/ertele kuyruğu (hiçbir mesaj gerçekten gönderilmez)
- [x] C — Bankacı paneli (`/demo/banka`): portföy, sektör analizi, WhatsApp içgörüleri,
      taahhüt takibi, firma kartı, uzman/birim seçimi, arama listesi hazırlayan ajan
- [x] C — Admin: CSV ile hesap açma (davet e-postası veya kopyalanabilir davet bağlantısı), hesap listesi, "onun gözünden gör", demo etkinliği (17 Kas)
- [x] C — Boş hesap çalışma alanı: yükle → ajan okur → kontrol/düzelt → 8 haftalık görünüm → tümünü sil (17 Kas)
- [x] C — Ana sayfa: "İşinizi siz büyütün. Finansal takibi biz halledelim.", Ücretsiz hesap aç + Canlı demo; menü/alt bilgide site haritası (18 Kas)
- [x] C — Herkese açık kayıt (`/app/kayit`), ilk girişte boş çalışma alanı rolü, ilk adımlar ve bağlantı ekranları, günlük AI okuma sınırı (18 Kas)
- [x] C — Site düzeltmeleri: yükleme vaadi ve "AI'ya gönderilmez" metinleri, CTA ölçümleri, sitemap, TR yönlendirme (18 Kas)
- [ ] L — **L2** isteği: belgeden taahhüt çıkarma
- [ ] L — **L3** isteği: görsel cila (yalnız stil, mantık değişmez)

### 13–15. saat: kontrol ve yayın

- [ ] G — **G4**: Codex ile bağımsız inceleme (salt okuma, yorum olarak)
- [ ] C — Tıklama testi: her tuş, her rol, mobil ve masaüstü
- [ ] T — Lovable'da **Publish**
- [ ] T — 100 hesap CSV'sini admin panelinden yükle

### 15–24. saat: Figma, geri bildirim, ikinci yayın

- [ ] T + C — Ekranları Figma'ya aktar (html.to.design ile canlı URL'den veya ekran görüntüsü), sunum akışını kur
- [ ] T — Demo hesap davetleri; 5 saniye testi ve canlı görev testleri
- [ ] C — Yanıt analizi ve düzeltme listesi
- [ ] L/C — Düzeltmeler ve ikinci Publish

## Hesap CSV biçimi

```csv
email,role,tenant,company,sector,region,banker_no
ornek@firma.com,demo,017,Örnek Yazılım A.Ş.,Yazılım,,
deneme@firma.com,blank,,Deneme Ltd.,E-ticaret,,
uzman1@banka.com,banker,,,,Marmara-1,01
```

Önerilen dağılım: 60 demo, 20 boş, 20 bankacı.

## Adım adım: kim nereye ne yazacak

Sıra önemli; bir adım bitmeden sonrakine geçmeyin.

1. **Lovable → proje ayarları:** "Edit with Lovable" rozetini gizleyin (kredi harcamaz).
2. **Lovable → sohbet (Plan modu):** aşağıdaki **L0** istemini yapıştırın, planı okuyun, onaylayın. Bu yalnız GitHub'daki son değişiklikleri çekip önizlemeyi doğrular.
3. **Lovable önizleme:** `/demo`, `/demo/isletme`, `/demo/banka` sayfalarını açıp tıklayın. Sorun görürseniz bana yazın; Lovable'a düzelttirmeyin (kredi + çakışma).
4. **Lovable → Publish:** önizleme sorunsuzsa yayınlayın. Canlı adres: qualifilab.com/demo
5. **ChatGPT → yeni sohbet "QualiFi demo belgeleri":** G1, sonra aynı sohbette G2.
6. **ChatGPT → yeni sohbet "QualiFi metinleri":** G3. Beğendiğiniz başlığı bana gönderin; ana sayfaya ben koyarım.
7. **Lovable → sohbet (Plan modu):** L1 (boş hesap yüklemeleri + demo etkileşim kaydı). Plan onayından sonra Build.
8. **Bana:** "L1 bitti" yazın; yükleme ekranını, `/app` girişini ve admin hesap açma ekranını yazayım.
9. **Lovable:** L2 (belgeden taahhüt çıkarma).
10. **ChatGPT → Codex:** G4 incelemesi; çıktıyı bana yapıştırın.

## Lovable istem paketi

### L0 — GitHub değişikliklerini doğrula (Plan modu, kod yazdırmayın)

```
GitHub'dan gelen son commit'leri incele: /demo, /demo/isletme ve /demo/banka
rotaları ile src/lib/demo ve src/components/demo eklendi. Hiçbir dosyayı
değiştirme. Yalnız önizlemenin hatasız derlendiğini ve bu üç sayfanın
açıldığını doğrula; sorun varsa ne olduğunu yaz ama düzeltme.
```


Her isteği önce **Plan** modunda gönderin, planı okuyup onaylayın, sonra Build.

### L1 — Boş hesap yüklemeleri + demo etkileşim kaydı

```
QualiFi uygulamasına iki özel veri yapısı ekle. Mevcut qualifi_leads /
qualifi_events tablolarına, admin paneline ve src/lib/demo, src/components/demo
dosyalarına dokunma. Arayüz yapma; arayüzü GitHub üzerinden Claude ekleyecek.

A) Boş hesap yüklemeleri
1. Özel depolama kovası: workspace-files (herkese açık değil, dosya başı 10 MB;
   pdf, png, jpg, xlsx, csv, txt).
2. Tablo qualifi_workspace_files: id, user_id (auth.users), kind
   ('contract' | 'invoice_image' | 'spreadsheet' | 'whatsapp'), storage_path,
   original_name, status ('uploaded' | 'processing' | 'extracted' | 'failed'),
   error, created_at.
3. Tablo qualifi_commitments: id, user_id, file_id (nullable), counterparty,
   direction ('in' | 'out'), amount (numeric), currency (varsayılan 'TRY'),
   due_date (date), kind ('invoice' | 'contract_installment' | 'promise' | 'expense'),
   status ('open' | 'paid'), paid_at (date, nullable), confidence (0-1),
   evidence (kısa alıntı), needs_review (boolean), created_at.
4. Kullanıcı kendi dosyalarını ve taahhütlerini tek seferde silebilsin (KVKK).

B) Demo etkileşim kaydı (geri bildirim için)
5. Tablo qualifi_demo_interactions: id, user_id (nullable; giriş yapılmamış
   /demo ziyaretinde boş), session_id (tarayıcıda üretilen rastgele uuid),
   panel ('business' | 'bank'), tenant (text, örn. '017'), demo_date (date),
   action ('agent_approve' | 'agent_edit' | 'agent_snooze' | 'agent_question'
   | 'scenario_run' | 'date_change' | 'customer_open' | 'firm_open' | 'tab_open'),
   target (kısa metin, örn. fatura veya firma no), detail (en fazla 300
   karakter; ajan sorusunun metni burada), created_at.
6. Bu tabloya yalnız bir sunucu rotası (POST /api/demo-interactions) yazsın;
   alanları doğrulasın, e-posta veya telefon gibi kişisel veri içeren detail'i
   reddetsin, aynı session_id'den dakikada 60'tan fazla kaydı reddetsin.

Yetki (RLS)
7. A'daki tablolar ve dosyalar: kullanıcı yalnız kendi satırlarını görür,
   ekler, siler. app_metadata.qualifi_admin === true olan kullanıcı hepsini
   okuyabilir. user_metadata ile asla yetki verme.
8. qualifi_demo_interactions: tarayıcıdan doğrudan okuma/yazma yok; yalnız
   admin okuyabilir.
Yalnız şema, depo, RLS, bu sunucu rotası ve oluşan TypeScript tiplerini ekle.
```

### L2 — Belgeden taahhüt çıkarma

```
Önce küçük bir eksik: qualifi_commitments tablosunda kullanıcı kendi satırını
GÜNCELLEYEMİYOR. Kullanıcının yalnız kendi satırlarında amount, due_date,
counterparty, status, paid_at ve needs_review alanlarını güncelleyebileceği bir
UPDATE izni ve RLS politikası ekle (user_id ve file_id değiştirilemesin).
qualifi_workspace_files için kullanıcı güncellemesi gerekmiyor.

Sonra:
qualifi_workspace_files tablosundaki bir dosya için taahhütleri çıkaran bir
sunucu rotası ekle: POST /api/workspace/extract (dosya:
src/routes/api/workspace/extract.ts, iş mantığı ayrı bir .server.ts dosyasında,
mevcut demo-interactions rotası gibi). Lovable AI ağ geçidini kullan;
LOVABLE_API_KEY tarayıcıya gitmesin. src/lib/demo, src/components/demo ve
src/routes/demo dosyalarına dokunma.

- Girdi: JSON {"file_id": "<uuid>"}; kullanıcı yalnız Authorization: Bearer
  <oturum anahtarı> başlığından tanınır. Çağıran kullanıcı dosyanın sahibi olmalı.
- Yanıt: 200 {"status": "extracted", "count": <eklenen taahhüt sayısı>} veya
  hata durumunda uygun kod + {"error": "<kısa kod>", "message": "<Türkçe açıklama>"}.
- Aynı dosya tekrar işlenirse önce o dosyaya bağlı eski taahhütleri sil.
- Fatura görseli → görsel model; sözleşme PDF, Excel/CSV, WhatsApp .txt
  dışa aktarımı → metin olarak oku.
- Çıktı: counterparty, direction, amount, currency, due_date, kind, confidence,
  evidence (belgeden en fazla 20 kelimelik alıntı). Belgede olmayan bilgiyi
  uydurma; emin değilsen needs_review = true.
- WhatsApp sohbetinde "cuma gönderiyoruz" gibi ödeme sözlerini kind='promise'
  olarak, mesaj tarihine göre due_date ile çıkar.
- Sonuçları qualifi_commitments'a yaz, dosya status'ünü güncelle.
- Hata olursa status='failed' ve kısa Türkçe hata mesajı.
- Doğrulama, yetki ve hata durumları için odaklı testler yaz ve çalıştır.
Arayüz yapma; yükleme ekranını GitHub üzerinden Claude ekleyecek.
```

### L5 — (İsteğe bağlı, sunumdan sonra) Ajanın serbest soruları

```
src/lib/demo/agent.ts içindeki askAgent kural tabanlı çalışıyor. Bunu bozmadan,
intent "unknown" döndüğünde Lovable AI ağ geçidini çağıran bir sunucu fonksiyonu
ekle: soruyu ve snapshot'tan hesaplanmış özet rakamları (bakiye, 8 haftalık
tahmin, en riskli 5 müşteri) gönder, yalnız bu rakamlara dayanarak 3 cümlelik
Türkçe cevap üret. Rakam uydurma. LOVABLE_API_KEY tarayıcıya gitmesin.
```

### L3 — Görsel cila

```
/app altındaki panel sayfalarını (işletme, bankacı, admin) marka diline uyumlu
hale getir: renkler, boşluklar, tipografi, boş durum ve yükleniyor durumları,
mobil uyum. Hesaplama mantığına, veri akışına, rotalara ve testlere dokunma.
Hiçbir yere "canlı bağlantı" veya gerçek banka/ERP adı yazma; "Demo verisi"
etiketlerini koru.
```

## ChatGPT istem paketi

### G1 — Demo belgeleri

```
Türkiye'de B2B yazılım hizmeti satan hayali bir KOBİ için (şirket adı
"Örnek Yazılım A.Ş.", gerçek firma adı kullanma) 3 kısa hizmet sözleşmesi yaz.
Her biri 1 sayfa: taraflar (hayali), hizmet, toplam bedel (TL), ödeme planı
(2-4 taksit, net tarihler 2026 Ekim-Aralık), gecikme maddesi. Her sayfanın
üstüne "ÖRNEK BELGE – DEMO" yaz. Ayrıca 5 fatura görseli üret: hayali alıcı,
fatura no, tarih, vade, KDV dahil tutar; köşesinde "ÖRNEK" filigranı.
```

### G2 — WhatsApp sohbetleri

```
Aynı hayali şirketin 5 müşterisiyle WhatsApp sohbet dışa aktarımı yaz
(.txt biçimi: "17.10.2026 14:32 - Ad: mesaj"). Her biri 8-15 mesaj.
Müşteri tipleri: dakik ödeyen, sürekli 2 hafta erteleyen, "cuma
gönderiyoruz" deyip göndermeyen, kısmi ödeme teklif eden, nakit sıkıntısını
ima eden. Gerçek kişi/firma adı kullanma.
```

### G3 — Ana sayfa metin varyantları

```
QualiFi: 100-200 farklı müşteriye satış yapan Türk KOBİ'leri için, kimin ne
zaman ödeyeceğini öğrenen, ödemeleri bir ajanla takip eden ve haftalık nakit
tahmini çıkaran bir ürün. ERP/ön muhasebe "ne kadar" bilir, QualiFi "ne zaman
ve kimden" bilir. Ürün demo aşamasında, canlı entegrasyon yok.
Bunun için 5 farklı ana başlık + alt metin + tek buton metni varyantı yaz.
Kısa, sade Türkçe; abartı, garanti veya doğruluk oranı iddiası yok.
Bankalar sayfası için de 3 varyant yaz (kredi riski / takipteki krediler
uzmanına hitap eden).
```

### G4 — Codex incelemesi

```
Talhaguler1/qualifi-41598058 reposunda son commit'leri incele. Kod yazma,
push etme. Yalnız şunları raporla: kırık buton veya rota, yanlış rol
yetkisi (bir kullanıcı başkasının verisini görebiliyor mu), demo verisinin
gerçek gibi sunulduğu metin, mobilde taşan ekran. Her bulgu için dosya:satır.
```

## Figma akışı

Önce site, sonra Figma: çalışan prototip sitenin kendisidir, Figma sunum ve
yedek içindir.

1. Sunum hesabıyla (sabit demo tarihi) her ekranı açın.
2. Figma'da html.to.design eklentisiyle canlı URL'leri içe aktarın veya
   ekran görüntüsü alın.
3. Sayfa sırası: ana sayfa → demo işletme paneli → müşteri karnesi → ajan
   önerisi → demo tarihi ileri → tahmin sapması → bankacı portföyü → sektör
   analizi → WhatsApp içgörüsü.
4. Ekranları tıklanabilir yedek akış olarak bağlayın (internet kesilirse).

## Kabul listesi ("her tuş çalışıyor")

- [ ] Her rol yalnız kendi verisini görüyor (başka hesabın URL'si açılmıyor)
- [ ] Demo tarihi değişince tahmin, taahhütler ve ajan önerileri değişiyor
- [ ] Aynı hesap her açılışta aynı veriyi gösteriyor
- [ ] Boş hesapta yükleme → çıkarma → tahmin akışı uçtan uca çalışıyor
- [ ] Bankacı panelinde 300 firma, sektör filtresi ve firma kartı çalışıyor
- [ ] Admin CSV ile hesap açabiliyor, "onun gözünden gör" çalışıyor
- [ ] Mobil 375 px ve masaüstünde taşma yok
- [ ] `npm test` ve `npm run build` geçiyor
