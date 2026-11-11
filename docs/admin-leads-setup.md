# QualiFi başvurular paneli

Adres: `/admin/leads`. Kod ve testler hazırlanmıştır; bu belge canlı yayın veya
gerçek veritabanı kurulumunun tamamlandığı anlamına gelmez.

## Hazırlanan ekran

- Supabase Auth e-posta/şifre girişi; herkese açık kayıt oluşturma ekranı yok.
- E-posta, şirket, ilgili çözüm/sayfa, talep türü, dil, kaynak/medium/kampanya,
  İstanbul saatinde tarih ve iletişim durumu.
- E-posta araması, tarih/dil/durum filtreleri; 25 kayıtlık sayfalama.
- Durumlar: `new`, `contacted`, `demo_scheduled`, `not_a_fit`.
  Bunlar yöneticinin iletişim notlarıdır; otomatik doğrulanmış rezervasyon veya
  Meta dönüşüm olayı oluşturmazlar.
- Aynı filtrelerden CSV; UTF-8 BOM ve formül koruması, en fazla 1.000 kayıt.
  Tam veri alınamazsa indirme başarısız olur; sessiz kesilme yok.
- Elle e-posta yazmak için posta uygulamasını açan bağlantı; otomatik gönderim yok.
- Gerçek bağlantı hatası, eksik kurulum ve doğrulanmış boş sonuç ayrı gösterilir.
  Örnek/müşteri taklidi kayıtlar yok. Testlerdeki sahte kayıtlar yalnızca bellek içindedir.

## Yetki ve sunucu sözleşmesi

Ekran erişimi tek başına veri koruması değildir. Üç API işlemi de sunucuda
Supabase `auth.getUser(token)` ile token'ı doğrular. Doğrulanmış e-posta ve
**server-managed `app_metadata.qualifi_admin === true`** gerekir. Kullanıcının
değiştirebildiği `user_metadata` bu yetkiyi sağlamaz.

- `POST /api/admin/leads`: JSON filtreleriyle liste ve filtrelenmiş sayılar.
- `PATCH /api/admin/leads`: `{id, status}` ile yalnızca iletişim durumu.
- `POST /api/admin/leads/export`: aynı filtrelerden CSV.

Kimlik/şirket bilgileri URL'ye veya uygulama loguna yazılmaz. Yanıtlar no-store;
token URL'de değil Authorization başlığındadır. Çıkış veya hesap değişiminde
bekleyen liste/işlem/CSV iptal edilir. Admin sayfası noindex'tir.

Okuma/yazma işlemleri yönetici kullanıcısının token'ı ve publishable key ile RLS
üzerinden yapılır. Service-role anahtarını tarayıcıya veya panele koyma.

## Lovable'da tamamlanacak yönetilen kurulum

Repo `AGENTS.md` kuralı: **"Database. Do not add or edit `supabase/migrations/`
or `drizzle/`. Ask Lovable to change the schema."** Bu sebeple yönetilen şema ve
gerçek hesabın yönetici yetkisi bu çalışmada değiştirilmedi.

Panel şu **`public.qualifi_leads`** alanlarını bekler:

| Alan                                              | Sözleşme                                                     |
| ------------------------------------------------- | ------------------------------------------------------------ |
| id                                                | UUID, birincil anahtar                                       |
| email                                             | Geçerli başvuru e-postası                                    |
| company                                           | nullable text                                                |
| kind                                              | waitlist / pilot / meeting                                   |
| page_id                                           | Sayfa kimliği                                                |
| campaign_id                                       | nullable kampanya/çözüm kimliği                              |
| locale                                            | tr / en                                                      |
| solution                                          | Seçilen çözüm                                                |
| utm_source, utm_medium, utm_campaign, utm_content | nullable text                                                |
| contact_status                                    | new / contacted / demo_scheduled / not_a_fit; varsayılan new |
| created_at                                        | timezone-aware kayıt zamanı                                  |

Kaynak JSON context içinde tutuluyorsa bu alanları tabloya uyumlu biçimde aç veya
sunucu adaptörünü gerçek şemayla eşleştir. Körlemesine ikinci lead tablosu oluşturma.
RLS ve grant'ler anonim/normal hesaplara kişi listesini kapatmalı; yöneticiye
yalnız gerekli SELECT alanları ve `contact_status` UPDATE yetkisi vermeli.
`contact_status` için CHECK/enum kullan. Başvuru yazımı herkese açık doğrudan tablo
INSERT ile değil, doğrulayan sunucu API'si üzerinden yapılmalı.

## Lovable'a verilecek tek talimat

```text
GitHub'dan gelen /admin/leads ekranını ve admin API'lerini koru; paneli yeniden yazma.
docs/admin-leads-setup.md ve docs/lovable-storage-setup.md sözleşmelerine göre
mevcut Lovable Cloud backend'ini tamamla. Şemayı yalnızca yönetilen migration
akışıyla değiştir; varsa mevcut başvuruları/verileri koru.

Panelin beklediği qualifi_leads alanlarını ve RLS/kolon yetkilerini tamamla.
Doğrulanmış benim yönetici hesabım için server-managed app_metadata içine
qualifi_admin:true ata. Hesap yoksa güvenli şekilde yönetici hesabını kurmamı sağla.
Rolü user_metadata, istemci parametresi, otomatik signup veya ilk giriş yapan
kişiye yönetici verme yöntemiyle tanımlama. Şifre/secret değerlerini Git'e yazma.

Mevcut /api/leads ve /api/events geçici guard'ını gerçek kalıcı yazımla değiştir.
201 yalnız gerçek yeni kayıt DB'ye commit edilince dönsün; duplicate ikinci lead
veya dönüşüm oluşturmasın. Form bilgileri hata halinde korunsun. Analitik izni
reddedenler başvurabilsin; izinli analitik olaylarında e-posta/belge/şirket metni olmasın.
Belge yüklemesini ancak gerçek özel kayıt çalışıyorsa başarılı say.

Kontrollü test başvurusunun panelde göründüğünü, durum değişikliğinin yenilemeden
sonra korunduğunu, CSV'nin aynı filtreleri verdiğini, normal/anonim kullanıcının
liste/CSV/durum değişikliğine erişemediğini ve gizli verinin public tablolardan
okunamadığını doğrula. Test başvurularını gerçek sonuçlardan ayır.

Test sonuçlarını göster. Her şey geçtiğinde Publish changes ile yayınla ve
https://qualifilab.com/admin/leads adresini kontrol et. Doğrulanmamış kurulumu
tamamlandı veya canlı veri kaydı çalışıyor diye raporlama.
```

## Test kanıtı ve sınırı

Yerel API/DOM testleri kimlik/yetki kapılarını, tarihler ve CSV'yi, başarısızlık
durumlarını, filtre/durum işlemlerini ve çıkış sonrası indirme engelini kontrol eder.
Üretim build'i route ağacını otomatik üretir; generated dosyalar elle düzenlenmez.

Gerçek Supabase hesabı/RLS/veri kalıcılığı ve canlı panel henüz doğrulanmadı.
Bu yönetimli ortamda `cua_repl.js` bulunmadığı için gerçek tarayıcı/görsel kontrol
yapılmadı. İnsanla 5 saniye testi de ayrıca yapılmalıdır.
