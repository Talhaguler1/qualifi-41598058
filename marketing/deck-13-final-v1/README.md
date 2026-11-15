# QualiFi — 13 sayfalık yatırımcı sunumu

15 Kasım 2026. Kullanıcı önizlemeleri onayladı; Canva ana sunumu kaydedildi ve tam 13 sayfa olduğu doğrulandı. 14–17. ek sayfalar ana sunumdan çıkarıldı; 17 sayfalık tam kopya yedekte korundu. Bağlantılar `canva-delivery.json` içinde.

1–3 ve 6–9. sayfaların metinleri son kayıt öncesi sürümle karşılaştırıldı ve aynı kaldığı doğrulandı. 4. sayfada örnek etiketi görünür alana alındı. 5. sayfada kaynak kapsamı ve 900 işletmenin ilk ay erişim hedefi olduğu netleştirildi. 10–13 finansal plan, yol haritası, yatırım kullanımı ve kapanış olarak tamamlandı.

## 12. sayfa

Önerilen yatırım 1.500.000 TL, plan dönemi 12 ay. Yuvarlak kullanım: 850 bin TL çekirdek operasyon, 200 bin TL muhasebe/ERP, 100 bin TL veri güvenliği ve yedekleme, 150 bin TL B2B pilot ve iş akışları, 200 bin TL rezerv. Tutarlar teklif veya gerçekleşme değil, açık planlama varsayımıdır. Fiziksel veri merkezi veya ödeme kuruluşu faaliyeti planlanmadı.

10. sayfadaki finansal senaryo aynı modelle güncellendi: 314 bin TL yıllık gelir, 67,6 bin TL 12. ay MRR, yaklaşık −986 bin TL yıllık faaliyet sonucu, %50,6 yıllık brüt marj, 5.100 TL senaryo CAC. LTV ücretli kohortla ölçülecek. Tümü varsayımdır; müşteri kazanımı veya gelir gerçekleşmesi iddiası yoktur.

## Dosyalar ve doğrulama

- `QualiFi-12-Aylik-Yatirim-Senaryosu.xlsx`: formüllü, düzenlenebilir senaryo.
- `financial-model.json`, `financial-model.csv`: hesap girdileri ve çıktıları.
- `funding-budget.json`: yuvarlamadan önce fon kullanım tutarları.
- `REVIEW-AND-PLAN.md`: kapsam, varsayımlar ve matematik açıklaması.
- PNG/SVG dosyaları: Canva'ya yerleştirilen hesap ve kullanım grafikleri.
- Python kaynakları: çalışma ortamında Pillow, Matplotlib, OpenPyXL ve fontTools ile üretildi; marka fontları `../investor-deck-v1/brand/fonts` içinde.

Yatırım kalemleri toplamı, gider+rezerv, gelir−gider ve Excel B2B bütçe formülü kontrol edildi. B2B bütçesinin tamamı faaliyet gideri; yalnız yarısı CAC edinim maliyetine katılır. Excel formül yapısı kontrol edildi; masaüstü Excel yeniden hesaplaması ayrıca yapılmadı. Son kayıt sonrası 12. sayfa fon kullanım görseli ve 10. sayfa yeni finansal görsel varlığı doğrulandı. Son altı sayfanın ilgili önizlemeleri görsel olarak kontrol edildi.

Bağımsız kaynak/matematik ve 5 saniye/LIFT incelemeleri yapıldı; bu, gerçek kullanıcıyla anlama testi değildir. Sunumun eski konuşmacı notları içerik güncellemelerini yansıtmayabilir; güncel rakamlar için bu dosya ve çalışma kitabı kullanılmalıdır. Eski PDF/PPTX sürümleri bu yeni 13 sayfalık Canva sürümünün dışa aktarımı değildir. Web sitesinde değişiklik yapılmadı.

## Kaynaklar

Pazar: KOSGEB 2026, TÜİK 2024, Tablo 3; basılı s.11 / PDF s.20. Sanayi ve hizmet KOBİ toplamı 3.928.385. Bilgi-iletişim (J) 65.699 + mesleki, bilimsel ve teknik faaliyetler (M) 312.028 = 377.727. Sektör havuzu tahmini teknoloji olgunluğu veya satın alma isteği ölçümü değildir. SOM doğrulanacak; 900 erişim hedefidir.

https://webdosya.kosgeb.gov.tr/Content/Upload/Dosya/Kurumsal/2026/Tu%CC%88rkiye%27deki_KOBI%CC%87%27lere_I%CC%87lis%CC%A7kin_Baz%C4%B1_I%CC%87statistiki_Go%CC%88stergeler.pdf#page=20

Önceki kaynak ve konuşmacı açıklamaları: `../investor-deck-v1/sources.md`, `../investor-deck-v1/konusmaci-notlari.md`, `../team-financials-v1/SOURCES.md`. Bunlar tarihsel dosyalardır; bu senaryo eski finansal varsayımların üzerine entegrasyon/veri/B2B için 450 bin TL ekler. Yeni bütçe dış kaynak tahmini değildir, kullanıcı isteği üzerine hazırlanmış örnek işletme planıdır.
