# QualiFi — yatırımcı sunumu ve logo düzenlemesi

15 Kasım 2026. Ana anlatı küçük ve orta ölçekli işletmeler; bankalar büyüme alanıdır. Açık paper zemin, koyu forest metin ve sınırlı lime vurgu kullanıldı. Sunum Türkçedir.

## Canva'da aç

- [Yatırımcı sunumu — düzenlenebilir, 17 sayfa](https://www.canva.com/d/1az64FMM3lwRlYa)
- [Logo ve marka düzenlemesi v2 — 2 sayfa](https://www.canva.com/d/3Rcac8Ua0QzGalj)
- [Bu çalışmanın klasörü](https://www.canva.com/folder/FAHa726GrLM)

Ana klasörde yalnız son sunum ve son marka panosu yer alır. Bu oturumda üretilen ara aktarımlar “Kontrol kopyaları” alt klasörüne ayrıldı. Daha önceki Instagram veya diğer proje tasarımları değiştirilmedi. Logo dosyaları Canva yüklemelerine de eklendi; bu işlem bir Canva Brand Kit kurulumu değildir.

## Dosyalar

- `QualiFi-Yatirimci-Sunumu-TR.pptx` — düzenlenebilir yerel sunum.
- `QualiFi-Yatirimci-Sunumu-TR.pdf` — görüntülemek veya paylaşmak için.
- `QualiFi-Logo-ve-Marka-v2.pptx` / `.pdf` — yeni logo ve renk/font panosu.
- `brand/QualiFi-Mark.svg` / `.png` — q sembolü; SVG ölçeklenebilir ana dosyadır.
- `brand/QualiFi-Wordmark.svg` / `.png` — yatay logo.
- `brand/brand-identity-v2.md` — mevcut marka MD'sinden türetilen düzenleme ve kullanım kuralları.
- `konusmaci-notlari.md` — her slayt için anlatım, kaynak ve ürün durumu notları.
- `sources.md` — kaynakların tam bağlantıları ve iddia sınırları.
- `qa/` — yerleşim ve Canva aktarım kontrolleri.

## Sunum yapısı

Yüklenen **Experinn — Sunum Eğitimi** dokümanının 7. sayfasındaki 13 bölüm sırasıyla korundu. 14–17. sayfalar ajan yaklaşımı, entegrasyonlar, bankalar ve kaynaklar ekidir. Bir sahne sunumunda 13 ana sayfa üzerinden ilerleyip ekleri sorular sırasında açabilirsiniz.

Kullanıcının talebiyle **9. sayfa ekip, 10. sayfa finansal öngörüler ve 12. sayfa yatırım talebi/kullanımı** başlık dışında boş bırakıldı. Bu sayfalar dışarıya tamamlanmış yatırım sunumu olarak gönderilmeden önce doğrulanmış bilgilerle doldurulmalı veya Canva'da sunum sırasında atlanmalıdır. Ekip deneyimi, müşteri adedi, gelir, yatırım tutarı, değerleme veya performans oranı uydurulmadı.

Bugünkü talep toplama akışı ile gelecekteki ajanlar ve entegrasyonlar birbirinden ayrıldı. Ürün görseli kavramsal örnektir. İş modeli, başlangıç segmenti ve geliştirme sırası taslak olarak etiketlendi. Genel KOBİ sayısı SAM/SOM veya ücretli talep gibi sunulmadı.

Logo düzenlemesinde mevcut q ve nokta korunarak fonttan bağımsız vektör çizgileri, boşluklar ve yatay wordmark oluşturuldu. Canlı web sitesi veya eski tasarımlar bu görevde değiştirilmedi.

## Yeniden üretme

`build_logo.py` fontTools ile vektörleri oluşturur. PNG'ler SVG'nin tarayıcı çıktısıdır. `build_deck.py` aynı düzeni düzenlenebilir PowerPoint ve PDF olarak oluşturur. Python bağımlılıkları: python-pptx, reportlab, Pillow, fonttools; PNG render için Playwright ve Chromium. Kaynak betiklerde `F` / `FONT` değişkenleri font klasörüne işaret eder. Manrope ve DM Sans SIL OFL lisansları pakettedir. Şirket metni ve konuşmacı notları betikte bulunur.

Kaynak incelemesi, bağımsız 5-saniye/LIFT ve iddia kontrolü yapıldı; bu gerçek yatırımcılarla yürütülmüş bir test değildir. Canva'da 17 adet 1920×1080 sayfa ve seçili sayfalarda düzenlenebilir metin doğrulandı. Görsel yerleşim önizlemelerde kontrol edildi.
