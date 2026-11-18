# QualiFi yeniden tasarım: çalışma planı

**Alınan kararlar (18 Kas):** takvim plandaki gibi; bankacı geri bildiriminin dördü de sunuma giriyor; ana butonlar "Canlı demoyu dene" + "Ücretsiz hesap aç", stok fotoğraf yok. Altyapı kararı (TanStack'te kalmak) son onayda.

Kaynaklar: `QualiFi-redesign-prompt.md` (tasarım brief'i), 18 Kasım tarihli "daha sade, kartlı demo" isteği, bir bankacının geri bildirimi.
Sabit tarih: **24 Kasım 2026 sunumu** (Akbank, bir VC, jüri). Bugün 18 Kasım: 6 gün var.

---

## 0. Önceki isteğin durumu

| İş | Durum |
|---|---|
| Demoya İngilizce seçeneği (TR/EN düğmesi, `?l=en`) | ✅ Bitti, GitHub'da (7a50188) |
| Demo: önce ajan, altında 6 kart | ✅ Bitti, GitHub'da (82351b3). Brief bu tasarımın eksiklerini sayıyor; aşağıda 2. adımda düzeltiliyor. |
| Lovable'da Publish | ⏳ Sizde |
| "Edit with Lovable" rozetini gizlemek | ⏳ Sizde (Lovable proje ayarları, kredi harcamaz) |
| Prova listesi (7 dakikalık akış + internet kesilirse B planı) | ⏳ Yapılacak, yeni tasarım bitince (23 Kasım) |
| Sözlerde tutarsız `amount` için Lovable migration'ı | ⏳ Yapılacak, sunumdan sonra |

---

## 1. Onayınıza bıraktığım konular (brief'te bana mantıklı gelmeyenler)

1. **Next.js'e geçiş: önerim geçmemek.** Site Lovable'da TanStack Start ile çalışıyor ve Publish düğmesi bu yapıya bağlı. Next.js'e geçersek Lovable'dan yayın biter, hosting ve Supabase bağlantısı yeniden kurulur; 6 günde bu büyük bir risk. Brief'in istediği her şeyin TanStack'te karşılığı var:
   - Fontları kendimiz barındırırız (Fontsource veya Fontshare).
   - Motion ve View Transitions aynen kullanılabilir.
   - `/tr` ve `/en` adresleri, hreflang etiketleri ve ortak mesaj dosyaları için ayrı bir i18n kütüphanesine gerek yok.
2. **Ana sayfayı sıfırdan yazmak: evet, ama iki aşamada.** Bugünkü 26 pazarlama sayfası başka bir yerde üretilmiş ve koda gömülmüş hazır HTML (`qualifi-pages.ts`, 500 KB). Düzeltmeler bu HTML'e yamayla yapılıyor; tasarım tutarsızlığının asıl kaynağı bu.
   - **Sunumdan önce:** ana sayfa (4 hedef kitle sekmesi tek sayfada) ve TR/EN, gerçek React bileşenleriyle yeniden yazılır.
   - **Sunumdan sonra:** 20 kampanya sayfası taşınır. O zamana kadar eski hâlleriyle kalırlar ama menüden çıkarılırlar.
3. **Lenis (yumuşak kaydırma) ve GSAP ile sabitlenen kaydırma sahneleri: önerim kullanmamak.** Kaydırmayı ele geçirmek telefonda ve sunum bilgisayarında takılma riski taşır. Aynı etki Motion'ın kaydırma animasyonlarıyla, daha hafif biçimde yapılabilir.
4. **Fotoğraflar (Türkiye'de KOBİ sahipleri):** Lisanslı ücretsiz stok fotoğraflar çoğu zaman yapay ve "stok" görünür, Türkiye'ye özgü olanları da az. Önerim: sunumdan önce fotoğraf yok, ürün görselleri ve animasyon anlatsın. Sonra sizin çekeceğiniz ya da onaylayacağınız 1-2 gerçek fotoğraf eklenir.
5. **Çekinceli dili azaltmak:** Kabul. Ama yalnız doğru olanı yazarız. "Banka seviyesinde güvenlik", "KVKK uyumlu", "bankalar kredi teklifi verir" gibi cümleler, gerçekten öyle olana kadar "hedef / pilot" diliyle kalır. Demoda tek satırlık "örnek veri" notu yeterli.
6. **Ana buton:** Brief "tek dürüst eylem" seçmemizi istiyor. Hesap açma bugün gerçekten çalıştığı için önerim:
   - birinci buton: **"Canlı demoyu dene"**,
   - ikinci buton: **"Ücretsiz hesap aç"**,
   - "Bekleme listesi" ifadesi kalkar.
7. **Lighthouse 95+:** Ana sayfa için hedef olarak kalır. Grafik ağırlıklı demo için gerçekçi hedef 90+.

---

## 2. Bankacının geri bildirimi: ne yapıyoruz, ne zaman

| Öneri | Plan | Ne zaman |
|---|---|---|
| Bankacıya (müşteri ilişkileri yöneticisine) proaktif ürün önerisi | Bankacı panelinde her firma kartına "Bu firmaya şimdi önerilecek ürün" ve gerekçesi eklenir. Örnekler: tahsil süresi uzuyor → çek iskontosu; büyük alacak → faktoring; mevsimsel açık → rotatif kredi. Ürün adları genel tutulur, banka ürün adı geçmez. Bankacı panelinin ana kullanıcısı da müşteri ilişkileri yöneticisi olarak yeniden adlandırılır. | Sunumdan önce |
| Yapay zekâya giden müşteri verisini maskeleme | Firma kartında "Ajanın gördüğü" görünümü: unvan, vergi no ve kişi adları maskelenmiş (F01-075, ***). "Veri bankadan çıkmaz, yapay zekâya yalnız maskeli özet gider" ilkesi gösterilir. | Sunumdan önce (görsel ve ilke). Teknik altyapı sonra. |
| Birden fazla bankadaki ürünleri tek ekrandan izlemek, talimat vermek, başvurmak | İşletme panelinde "Bankalarım" kartı: 3 sahte bankadaki hesap, kredi ve çekler tek yerde. Açık bankacılık (ÖHVPS hesap bilgisi hizmeti) izniyle. Talimat ve başvuru "vizyon" etiketiyle simüle edilir. | Sunumdan önce, kart ve vizyon olarak |
| Bankalardan ürün bazında teklif alıp karşılaştırmak | İşletme "Nakit ihtiyacı" senaryosundan teklif ister, 3 sahte bankadan teklif gelir, karşılaştırma tablosu çıkar. Bu, bankacının "bankacı gönderdi" akışıyla birleşir. ⚠️ Gerçek üründe kredi aracılığı mevzuatı (BDDK) incelenmeli; demoda "teklif isteği" diye adlandırılır, "aracılık" denmez. | Sunumdan önce (simülasyon). Hukuki inceleme sonra. |
| Müşterinin diğer bankalardaki ürünleri hakkında sınırlı bilgi | Yalnız işletmenin kendi izniyle paylaştığı karnede, toplam düzeyde (ör. "3 bankada toplam ₺X kredi, en yakın vade Ocak"). Ayrıntı yok. | Sunumdan önce, paylaşılan karneye eklenir |

---

## 3. İş bölümü (kredi ve verim için)

| Kim | Ne |
|---|---|
| **Claude (ben)** | Araştırma ajanları, tasarım sistemi, demo, yeni ana sayfa, doğrulama döngüleri, prova listesi. Tüm kod GitHub'a. |
| **Araştırma alt ajanları (brief'teki gibi 4 paralel)** | Tipografi, referans siteler, bileşen/hareket, ikonlar. Sonuçlar `docs/research.md` ve `docs/design-system.md` dosyalarına yazılır. Fotoğraf araştırması 1.4'teki karara göre kısılır. |
| **Lovable** | Yalnız Publish. Sunumdan sonra `amount` migration'ı. Rozet gizleme ayarlardan yapılır, kredi harcamaz. Tasarım işi verilmez (kredi). |
| **ChatGPT** | Türkçe metinlerin ana dilde son okuması ve sunum konuşma metni. İsteklerini ben yazarım. |
| **Codex** | Sunumdan sonra kampanya sayfalarının yeni bileşenlere taşınması. Ayrı dosyalar ve ayrı dal olduğu için çakışmaz. Sunumdan önce aynı dosyalarda iki kişi çalışmasın diye Codex'e iş vermiyorum. |

---

## 4. Gün gün plan (sunumdan önce)

**18 Kas (bugün):** plan onayı. Araştırma ajanları paralel çalışır. `research.md` ve `design-system.md` yazılır, font ve ikon seçimi size bir kez gösterilir.

**19 Kas: tasarım sistemi ve demo düzeltmeleri**
- Tasarım sistemi koda girer: tek font sistemi, sabit tip ölçeği, renk token'ları, tek logo, tek buton/kart/çip stili, tek ikon ailesi.
- Demo:
  - Her ekran tek ana rakamla açılır; tutarsız rakamlar giderilir (185/150 müşteri, 43/54, 10/66 ve benzerleri).
  - Detaylar masaüstünde yan panelde, telefonda alttan açılan panelde açılır; karttan büyüyerek gelir.
  - Demo ziyaretçinin dilinde açılır.
  - Tarih seçici "Zamanda yolculuk" diye açıklanır.
  - Telefonda üst çubuk tek satır olur.

**20 Kas: demonun kalbi**
- "2 hafta sonra ödeyeceğiz" akışı:
  - örnek mesaj düğmeleri ve yazı kutusu;
  - fatura tarihi zaman çizgisinde 2 hafta sağa kayar;
  - tahmin çizgisi yeniden çizilir;
  - sıkışan hafta kırmızıya döner;
  - 1-3 eylemlik öneri kartı çıkar.
- "Bugün ödedim" ve "İkiye bölebilir miyiz?" senaryoları da çalışır.
- İşletme ile bankacı panelleri bağlanır: karne paylaşılınca bankacıda görünür, bankacı örnek teklif gönderir, teklif işletmeye düşer.

**21 Kas: bankacı geri bildirimi**
- Müşteri ilişkileri yöneticisi görünümü: proaktif ürün önerisi ve maskeli "ajanın gördüğü" görünümü.
- "Bankalarım" kartı ve teklif karşılaştırma simülasyonu.

**22 Kas: yeni ana sayfa (TR/EN)**
- Üst menü ve telefon menüsü.
- 4 hedef kitle sekmesi, yeniden yüklemeden kayan geçişle.
- Hero animasyonu: WhatsApp balonu → tarih kayar → çizgi kırılır → öneri kartı.
- Entegrasyon akış diyagramı, eski yol ve QualiFi yolu karşılaştırması, özellik ızgarası, güven, SSS, alt bilgi.
- Eski sayfalar yeni ana sayfaya yönlendirilir; kampanya dizini menüden çıkar.
- **Publish #1.**

**23 Kas: doğrulama ve dondurma**
- 4 genişlikte (390, 768, 1024, 1440), TR ve EN ekran görüntüsü turları; her sorun düzeltilir.
- Azaltılmış hareket, klavye ile gezinme ve Lighthouse kontrolleri.
- İşi görmemiş bağımsız bir inceleme ajanı siteyi denetler.
- Prova listesi ve B planı hazırlanır.
- **Publish #2, kod dondurulur.**

**24 Kas:** sunum. Değişiklik yok.

## 5. Sunumdan sonra
- Kampanya sayfalarının taşınması (Codex).
- Gerçek fotoğraflar, Lighthouse cilası.
- `amount` migration'ı (Lovable).
- xlsx kütüphanesinin değiştirilmesi.
- Teklif karşılaştırma ve maskeleme için hukuki inceleme.
- Gerçek banka ve açık bankacılık entegrasyon araştırması.

## 6. Riskler
- **Zaman:** 6 gün dar. Bir şey yetişmezse ilk kesilecek iş ana sayfanın alt bölümleridir; demo ve hero korunur.
- **Sunum bilgisayarı:** Sunumda internet kesilirse demo yerel kopyadan açılır (B planı).
- **Kod dondurma:** 23 Kasım akşamından sonra kod değişikliği yapılmaz.
