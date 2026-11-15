# QualiFi — ekip ve finansal öngörüler

15 Kasım 2026. Çalışmanın kapsamı mevcut Canva sunumunun yalnız 9. ekip ve 10. finansal öngörüler sayfalarıdır. Kullanıcı diğer sayfaları eş zamanlı düzenlediğinden tam sunum yeniden içe aktarılmaz.

## Ekip

Kullanıcı ekibin tek kişiden oluştuğunu ve LinkedIn profilinin kendisine ait olduğunu doğruladı. Kısa metin; öğrencilik, emlyon değişim eğitimi ve kazanan AI proje ekibindeki rolünden oluşur. Kaynak ve iddia sınırları `SOURCES.md` dosyasında. Canva'ya kullanıcının eklediği fotoğraf aynen korunur; yalnız yerleşimi düzenlenir. Fotoğraf kaynak depoya kopyalanmaz.

## Finansal sayfa

Kullanıcı tüm varsayımları görünür olan 12 aylık örnek senaryoyu açıkça seçti. Gerçekleşmiş satış, ücretli müşteri, tarife veya maliyet verisi paylaşılmadığı için bunlar örnek girdilerdir. Sayfada yaklaşık 314 bin TL gelir, 12. ay 67,6 bin TL MRR ve −536 bin TL faaliyet sonucu yer alır. Senaryo ilk yıl başabaşa ulaşmaz; bu faaliyet açığı bir yatırım talebi değildir. LTV'ye sayı yazılmadı.

- `QualiFi-12-Aylik-Ornek-Senaryo.xlsx`: Değiştirilebilir girdiler, aylık formüller, CAC ve brüt marj hesapları. Excel'de otomatik yeniden hesaplama açıktır.
- `financial-model.json` ve `.csv`: Python ile değerlendirilmiş temel senaryo.
- `FINANCIAL-ASSUMPTIONS.md`: Tüm gelir, gider, müşteri, CAC, kapsam ve zamanlama varsayımları.
- `QualiFi-Finansal-Ornek-Senaryo.pdf`: Finansal slaydın yerel çıktısı.
- `financial-composition.svg` / `.png`: Slayda yerleştirilen grafik ve KPI kompozisyonunun kaynakları.
- `team-titles.svg` / `.png` ve `team-copy.txt`: Ekip başlıkları ve düzenlenebilir gövde metni.

Görseller veri modeline göre `build.py` ile üretilir; dosyadaki `A` sözlüğü hesap girdisidir. Excel'deki değişiklikler kendi Excel formüllerini yeniden hesaplar, Canva görseline otomatik aktarılmaz. Canva'yı güncellemek için `A` girdileri de uyarlanıp görsel yeniden üretilmelidir. Bağımlılıklar: fonttools, matplotlib, openpyxl, playwright ve Chromium; fontlar önceki `investor-deck-v1/brand/fonts` klasöründen kullanılır.

Kaynak ve yöntem için bağımsız salt okunur kontrol yapıldı. Değişken maliyetin müşteri/ay birimi netleştirildi; sıfır paydalarda 0 marj/CAC yerine boş veya hesaplanamaz sonucu kullanıldı. Bu, gerçek yatırımcılarla yapılmış bir test değildir.

## Canva kaydı

Kullanıcı iki önizleme sonrasında yalnız 9 ve 10’u kaydetmeyi açıkça onayladı; kayıt tamamlandı. Güncel bağlantı `canva-delivery.json` içindedir. Diğer sayfalardaki metinlerin taslak içinde değişmediği kontrol edildi.
