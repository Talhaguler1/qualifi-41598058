# QualiFi — 17 Kasım 2026 sunum revizyonu

Ana Canva tasarımı DAHa7yMPkSQ, kullanıcı onayıyla13sayfa olarak güncellendi. Eski tam sürüm DAHbJNVolg0 olarak kontrol klasöründe korundu.

Görüşme bulguları, ürün kararları, proje senaryosu, banka faydası ve koşullu AI/banka yol haritası eklendi. Kurucu sayfası sona taşındı. Finansal varsayımlar değiştirilmedi.

- Güncel konuşma: KONUSMA-NOTLARI.md
- Animasyon tercihleri ve uygulanma durumu: ANIMASYON-VE-PROVA.md
- Kanıt sınırları ve teslim ayrıntısı: SOURCES-AND-CHANGES.md
- Bağlantılar: canva-delivery.json

Yerel PowerPoint kaynağının1–12sayfaları kullanıldı;13.sayfa ana Canva dosyasında özgün kurucu sayfasıdır. Prova HTML’si kişisel fotoğraf içerdiğinden Git’e eklenmedi; sohbet tesliminde bulunur. `build_rehearsal.py`, yerel PDF ve yalnız prova için current-09.png gerektirir.

PowerPoint/PDF kaynağı için python-pptx, reportlab ve Pillow gerekir; marka fontları ../investor-deck-v1/brand/fonts içinde. Derleme, kaynak bağımlılıklarını okur ve bu klasöre çıktı verir.
