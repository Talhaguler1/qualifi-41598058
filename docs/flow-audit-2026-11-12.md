# QualiFi canlı akış ve başvuru denetimi — 12 Kasım 2026

İncelenen site: https://qualifilab.com/. İncelenen kaynak: `3783c90`
(`Talhaguler1/qualifi-41598058`, `main`). Bu çalışma işlev değiştirmez veya
siteyi yayınlamaz; canlı davranışları ve kaynak kodunu karşılaştırır.

## Sonuç ve kanıt sınırı

- 24 giriş/kampanya URL'si gerçek Chromium ile açıldı. Masaüstünde toplam 128
  CTA açılışı, her sayfada mobil ilk CTA, form alanları, gizlilik penceresi ve
  varsa pilot adımları kontrol edildi. Bu kontrollerde JavaScript sayfa hatası
  ve açılmayan CTA görülmedi. Bu, bütün gönderimlerin başarılı olduğu anlamına gelmez.
- Farklı dalları temsil eden 8 gerçek test başvurusu canlı form üzerinden
  gönderildi; hepsi HTTP 201 ve kayıt numarası döndürdü. Her sayfa/dil için
  ayrı ayrı gerçek başvuru oluşturulmadı.
- Tekrar gönderim ve yeni istek numarasıyla aynı başvuru HTTP 200,
  `duplicate:true` ve aynı kayıt numarasını döndürdü. Çerezsiz ayrı HTTP
  istemcisindeki kontrol de aynı sonucu verdi.
- Kullanıcı, bu test e-posta adreslerinin kendi yönetici panelinde göründüğünü
  bu görüşmede doğruladı. Yetkili panel verisini asistan bağımsız olarak okumadı.
- Yönetici listeleme, CSV ve durum değiştirme API'leri oturumsuz isteklere 401
  döndürdü. Gerçek kullanıcı şifresi, token'ı veya kurtarma bağlantısı alınmadı.
- Güncel kaynak üzerinde `npm test`: 4 dosya, 56 test geçti. Bu yerel testler
  canlı yetkili CSV/durum değişikliği veya e-posta teslimatının yerine geçmez.

Tarayıcı istekleri ortamın güvenilir CA'sını kullanan Playwright `Route.fetch`
üzerinden canlı sunucuya iletildi. TLS doğrulaması kapatılmadı; API yanıtları
taklit edilmedi. `/app.js` ve `/campaign.js` canlı içerikleri incelenen kaynakla
bayt düzeyinde aynıydı. Masaüstü boyutu 1440×900, mobil boyutu 390×844 idi.

## Hangi sayfada hangi bilgi isteniyor?

### Ana hedef kitle sayfaları

| Kitle | Türkçe | İngilizce |
| --- | --- | --- |
| İşletmeler | `/isletmeler` (`/tr` de aynı kitle) | `/en/business` (`/` de aynı kitle) |
| Freelancer | `/freelancerlar` | `/en/freelancers` |
| Finans ekipleri | `/finans-ekipleri` | `/en/finance-teams` |
| Bankalar | `/bankalar` | `/en/banks` |

Bu sayfalarda üç başvuru akışı vardır:

| Akış | Ziyaretçinin girdiği/seçtiği bilgi | Sonuç |
| --- | --- | --- |
| Bekleme listesi | Zorunlu e-posta ve veri kullanım onayı; çözüm sayfadaki seçimden gelir | `kind=waitlist` |
| Talk to a human / Görüşme | Zorunlu e-posta ve veri kullanım onayı; seçili çözüm | `kind=meeting`; gün/saat rezervasyonu değil |
| Ajan/pilot kurulumu | 1. Hedef/çözüm. 2. Örnek sözleşme veya kendi dosyası; tercih edilen e-posta/WhatsApp kanalı. 3. Zorunlu e-posta/onay, isteğe bağlı şirket/proje ve rol | Örnek senaryoda `kind=pilot`; canlı ajan açılmaz |

Bankalarda çözüm `risk`; diğer kitlelerde `forecast`/`autopilot` seçilir.
Gizli `website` alanı spam tuzağıdır; ziyaretçinin dolduracağı şirket sitesi
alanı değildir. Veri kullanım penceresi form göndermez, sadece açıklama gösterir.

**Eksik:** Ana pilot formundaki `role` ve `channel` istek gövdesine ekleniyor,
ancak `parseLead` çıktısı ve veritabanı alanları bunları içermiyor. Bu bilgiler
başvuruya kaydedilmiyor ve panelde görülemiyor. Dosya seçimi de bir belge kaydı
anlamına gelmiyor; mevcut sunucu bütün kendi-dosyanı-yükle taleplerini reddediyor.

### Reklam/kampanya sayfaları

| Çözüm | Türkçe URL | İngilizce URL | Gönderilen talep |
| --- | --- | --- | --- |
| Sözleşmeden nakit akışı | `/tr/sozlesmeden-nakit-akisi` | `/en/contract-cash-flow` | Pilot: e-posta, onay, dosya/örnek seçimi |
| Freelancer gelir planı | `/tr/freelancer-gelir-plani` | `/en/freelancer-income-plan` | Bekleme listesi: e-posta, onay |
| Tahsilat takibi | `/tr/tahsilat-takibi` | `/en/receivables-follow-up` | Bekleme listesi: e-posta, onay |
| Gmail satış takibi | `/tr/gmail-satis-takibi` | `/en/gmail-sales-follow-up` | Bekleme listesi: e-posta, onay |
| Satış öngörüsü | `/tr/satis-ongorusu` | `/en/sales-outlook` | Bekleme listesi: e-posta, onay |
| WhatsApp ödeme takibi | `/tr/whatsapp-odeme-takibi` | `/en/whatsapp-payment-follow-up` | Bekleme listesi: e-posta, onay |
| Banka risk pilotu | `/tr/banka-risk-pilotu` | `/en/bank-risk-pilot` | Pilot: e-posta, onay; kurum adı isteğe bağlı |

Kampanya dizinleri `/kampanyalar` ve `/en/campaigns` çalışıyor. Kampanyalardaki
tekrarlanan CTA'lar aynı sayfaya ait tek formu açıyor. Seçili İngilizce
sayfalardaki planlanan fiyatlar ödeme/abonelik başlatmıyor.

## Form, kayıt ve e-posta nereye gidiyor?

1. Form, aynı sitenin `POST /api/leads` adresine JSON gönderiyor. Girilen e-posta
   doğrudan bir posta kutusuna form mesajı olarak iletilmiyor.
2. Sunucu alanları ve sayfa/çözüm/talep uyumunu doğruluyor. Yönetilen backend'de
   `qualifi_save_lead` işlemiyle özel `public.qualifi_leads` tablosuna kaydediyor.
3. Panelin `POST /api/admin/leads` sorgusu aynı tabloyu okuyor. Kişi e-postası,
   şirket, talep türü, sayfa/kampanya, dil, çözüm, ilk UTM kaynak bilgileri,
   iletişim durumu ve tarih panelin beklediği alanlar.
4. Yeni kayıt sonrası `owner-request` e-posta şablonu deneniyor. Kaynakta
   gönderici `QualiFi <noreply@notify.qualifilab.com>`, sabit alıcı
   `talha.guler@ozu.edu.tr`, konu `QualiFi: Yeni başvuru`.
5. Bildirimde sayfa, talep türü ve özel panel bağlantısı var. Ziyaretçinin
   e-postası veya sözleşmesi bildirim gövdesine eklenmiyor; iletişim adresi
   panelden okunuyor. Bildirim başarısız olsa bile kayıt korunuyor ve form
   başarı dönebiliyor. Bu nedenle 201, e-postanın teslim edildiğinin kanıtı değil.

**Ziyaretçiye otomatik teşekkür/onay e-postası yok.** Site formuna e-posta
bırakmak Google Workspace hesabı açmaz, Gmail/WhatsApp bağlamaz veya demo
randevusu oluşturmaz. `talha@qualifilab.com` adresinin açılması uygulamadaki
bildirim alıcısını kendiliğinden değiştirmez.

Paneldeki **E-posta yaz**, `mailto:` bağlantısıyla yöneticinin posta uygulamasını
açar; gönderim elle yapılır. Kayıtlar başvuru sırasında otomatik oluşur;
**açık panel anlık olarak yeni kayıtları dinlemiyor**. Yeni başvuruyu görmek için
panelde **Yenile**, filtre değişikliği veya sayfayı tekrar açma gerekir.

Giriş/şifre sıfırlama e-postaları başvuru bildirimlerinden ayrıdır: Supabase
kimlik işlemi ilgili hesap e-postasına bağlantı gönderir. Kaynakta bu şablonlar
da `notify.qualifilab.com` göndericisine ayarlı. Canlı şifre sıfırlama teslimatı
ve bağlantıyla şifre değiştirme bu denetimde yapılmadı. Bağlantısız
`/reset-password` ziyareti doğru şekilde geçerli davet/kurtarma bağlantısı ister.

## Canlıda doğrulanan eksikler

### Reklam öncesinde öncelikli

1. **Bazı CTA ölçümleri kayboluyor.** İngilizce Gmail kampanyasında `journey`,
   `price`, `footer` konumlarından gelen `primary_cta_clicked` olayları canlı
   `/api/events` tarafından 400 `invalid_submission` ile reddedildi. Ana
   sayfada `position=offer` ajan CTA'sı ve `channel=undecided` tercihi de
   reddedildi. İstemci otomatik tekrar ettiği için aynı hata iki kez görüldü.
   Sebep: istemcinin gönderdiği değerler ile sunucu allowlist'i uyuşmuyor.
   Bu, form kaydını engellemiyor ama tıklama oranlarını eksik gösteriyor.
2. **Belge yükleme vaadi ile gerçek akış farklı.** Sentetik TXT yüklemesi 400
   `uploads_unavailable` verdi; form e-postayı korudu. Örnek senaryoya geçince
   aynı talep 201 ile kaydedildi. FAQ ve veri kullanımı metni hâlâ dosyanın
   gönderimde kaydedileceğini söylüyor. Ya özel dosya saklama tamamlanmalı ya da
   yükleme seçeneği ve bu metinler mevcut yeteneğe uygun hale getirilmeli.
3. **Rol/kanal bilgileri kayboluyor.** Formda sorulup saklanmayan alanlar
   kaldırılmalı veya Lovable yönetilen şeması, doğrulama ve panelde tamamlanmalı.

### Operasyon ve araştırma

- **Takvim bağlı değil.** Canlı `/api/config` içindeki `calendarUrl` boş,
  `agentLive=false`. Görüşme talebi kaydediliyor; randevu veya davet oluşmuyor.
- **Otomatik ziyaretçi yanıtı yok.** Başvuru türü/diline uygun teyit metni ve
  otomatik gönderim ayrıca kurulmalı; yöneticinin elle yanıtı şu anda mümkün.
- **Bildirim teslimatı teyitsiz.** Gönderim kaydı veya alıcı kutusu görülmedi.
  Test başvurularının panelde görünmesi kullanıcı tarafından doğrulandı;
  bildirimin okul e-posta kutusuna ulaşması ayrı kontrol edilmeli.
- **Panel davranış analitiği raporu değil.** Tamamlanmış başvuruları gösterir;
  yalnız CTA'ya basıp formu göndermeyen kişiler bu listede görünmez. İzinli
  davranış olayları `qualifi_events` tablosuna gider; panelde trafik/CTA grafiği yok.
- **Tekrar başvurunun kapsamı:** benzersizlik e-posta + sayfa + talep türüdür.
  Aynı kişi aynı ana sayfadan farklı çözüm seçerek tekrar aynı tür talebi
  gönderirse eski kayıt döner; yeni seçimi ayrı başvuruya dönüştürmez veya
  kayıtlı eski alanları güncellemez. Bu özellik araştırma yorumunda hesaba katılmalı.
- **Atıf:** kayıt adaptörü ilk `utm_source`, `utm_medium`, `utm_campaign`,
  `utm_content` değerlerini saklıyor. İstemcinin gönderdiği son UTM alanları,
  `utm_term`, rol ve kanal lead kaydına alınmıyor.
- **Mobil küçük taşma:** 390 px genişlikte ana sayfalarda 395 px, incelenen
  kampanya örneklerinde 400 px doküman genişliği ölçüldü. Kampanyalarda
  `conversation-glow` dışarı taşıyor. CTA/form açılışı çalıştı; taşma giderilmeli.
- **Ek sayfalar/SEO:** `/sitemap.xml`, `/en/about`, `/tr/hakkimizda`,
  `/en/data-use`, `/tr/veri-kullanimi` 404. Bunlar mevcut menüde kırık bağlantı
  olarak sunulmuyor; planlanan ayrı sayfalar henüz yok. Veri kullanımı modalı
  mevcut ve açılıyor. Ana HTML'de mutlak canonical bulunmadı.

## Test verisi ve kalan kontroller

Gerçek müşteri olmayan 8 kayıt **`qa-audit-`** öneki ve `example.invalid`
alan adıyla işaretlendi; uygun formlarda şirket adı `[QA TEST]` idi. Bunlara
e-posta gönderilmemeli ve reklam/ürün talebi sonuçlarına dahil edilmemeli.
Bu denetimde kayıt silinmedi; özel kayıt numaraları ve tam test gövdeleri Git'e
eklenmedi. Aynı kaynak etiketiyle oluşan denetim olayları da analizden çıkarılmalı
(`utm_source=qa_audit`).

Tam yetkili canlı CSV indirme, iletişim durumu güncelleme, oturum kapatma ve
şifre değiştirme asistan tarafından yapılmadı. İlgili yerel testler geçti;
canlı yetkili işlemler ayrıca doğrulanabilir. Inbox teslimatı, Gmail MX geçişi
ve Meta/GA4 entegrasyonuna bu sonuçlardan başarı atfedilemez.

İnsanla gerçek 5 saniye testi yapılmadı. Nitel LIFT değerlendirmesinde en belirgin
güven sorunu yükleme vaadinin hata vermesi; netlik sorunu ise ana sayfaların
üç farklı CTA hedefini birlikte sunması. Kampanya sayfalarının tek forma
yönelmesi güçlü. Dönüşüm iyileşmesi için canlı deney verisi henüz üretilmedi.

## İzlenebilir kaynak noktaları

- `public/app.js`, `public/campaign.js`: alanlar, CTA ve gönderim davranışı.
- `src/lib/qualifi-submission.ts`: sunucu doğrulama ve saklanan alanlar.
- `src/lib/qualifi-request-storage.server.ts`: kayıt ve bildirim ayrımı.
- `drizzle/migrations/0000_qualifi_private_requests.sql`: Lovable tarafından
  oluşturulmuş mevcut tablo/işlem/RLS sözleşmesi; bu denetimde düzenlenmedi.
- `src/lib/lead-admin.server.ts`, `src/components/admin/leads-admin-page.tsx`:
  panelin okuduğu tablo, filtreler, yenileme ve mailto bağlantısı.
- `src/lib/email-templates/owner-request.tsx`, `send-email.ts`,
  `src/routes/lovable/email/auth/webhook.ts`: alıcı/gönderici ve e-posta türleri.
