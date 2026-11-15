# QualiFi — 12 aylık örnek finansal senaryo

15 Kasım 2026. Kullanıcı, varsayımları açıkça yazılan 12 aylık örnek senaryoyu istedi. Bu çalışma bir bütçe/duyarlılık modeli örneğidir; gerçekleşmiş finansal veri, onaylı fiyat, hedef taahhüdü veya olasılık ağırlıklı tahmin değildir. Tüm sayısal girdiler değiştirilmek üzere önerilen varsayımlardır. Kaynak, kullanıcının SaaS/çoklu ajan iş modeli ve bu çalışma için izin verdiği örnek senaryodur; girdilerin harici araştırmayla doğrulandığı iddia edilmez.

## Gelir ve müşteri varsayımları

- Başlangıçta ücretli müşteri: modelde 0.
- Aylık müşteri başına gelir: 1.500 TL, KDV hariç; yayımlanmış TR tarifesi değildir.
- Aylara göre brüt yeni ücretli müşteriler: 0, 0, 2, 3, 4, 4, 5, 5, 6, 6, 7, 8; toplam 50.
- Aylık müşteri kaybı: dönem başındaki müşterilerin %3'ü; doğrulanmış retention verisi değildir.
- Kapanış aktif müşteri = önceki ay aktif × (1 − %3) + yeni müşteri. Kesirli değerler beklenen hesap adedidir; gerçek hayatta müşteri sayısı tamsayıdır.
- Basitleştirilmiş aylık gelir = dönem sonu aktif hesap × 1.500 TL. Yeni müşterilere tam ay gelir varsayılır; başlangıç günü bazında prorata yapılmaz. Tahsilat gecikmesi ve dönem sonu alacak finansmanı modellenmez.
- Banka pilotu, kurumsal entegrasyon, kurulum veya hizmet geliri eklenmedi.

## Doğrudan maliyetler ve faaliyet giderleri

| Girdi | Aylık varsayım |
| --- | ---: |
| Müşteri başına değişken doğrudan maliyet: AI/API, belge ve mesaj işleme | 450 TL / aktif müşteri |
| Sabit doğrudan platform/altyapı | 3.000 TL |
| Kurucu toplam maliyet/zaman bütçesi | 40.000 TL |
| Dış ürün geliştirme | 10.000 TL |
| İç yazılım araçları | 2.000 TL |
| İdari / muhasebe | 3.000 TL |
| Pazarlama | 5.000 TL |

İlk iki satır satışların maliyetine, sonraki beş satır faaliyet giderlerine alınır. Sabit altyapı dahil aylık sabit maliyet 63.000 TL'dir. Kurucu maliyeti dahil edildi; kurucunun çalışması bedava kabul edilerek kâr şişirilmedi. 40.000 TL mevcut ücret, iş sözleşmesi, işçilik hukuku veya piyasa benchmarkı beyanı değildir; değiştirilebilir toplam kaynak bütçesidir.

Önceki konuşmadaki 10.000 TL reklam bütçesi kısa süreli araştırma deneyi içindi. Bu modeldeki 5.000 TL/ay pazarlama tutarı o bütçenin onaylanmış devamı değildir; ayrı, açık bir varsayımdır.

## Hesaplanan örnek sonuçlar

- 12 aylık gelir: 314.246,44 TL; slaytta 314 bin TL.
- 12. ay MRR: 67.600,63 TL; slaytta 67,6 bin TL.
- 12 aylık faaliyet sonucu: **−536.027,49 TL**; slaytta −536 bin TL.
- Yıllık brüt marj: %58,54; sabit doğrudan altyapı maliyetini içerir.
- 12. ay aktif ücretli hesap beklentisi: 45,07.
- Sabit giderleri karşılamak için teorik başabaş seviyesi: 60 aktif hesap. Bu örnek senaryo 12. ayda başabaşa ulaşmaz.

Faaliyet sonucu, gelir − doğrudan maliyet − faaliyet gideridir; vergi sonrası net kâr veya tek başına nakit akışı değildir. KDV, vergi, finansman, başlangıç yatırımı, işletme sermayesi, beklenmeyen harcamalar ve kur/enflasyon değişimi dahil edilmedi. Faaliyet açığı yatırım talebi olarak sunulmaz; yatırım tutarı sayfasına dokunulmaz.

## CAC ve LTV

CAC bütçesi = 12 × (5.000 TL pazarlama + 40.000 TL kurucu maliyetinin %25 satış payı) = 180.000 TL.

Senaryo CAC = 180.000 / 50 brüt yeni ücretli müşteri = **3.600 TL**. Bu ölçülmüş CAC değildir. Kurucu satış payı faaliyet giderlerindeki 40.000 TL'nin içindedir; toplam giderlere ikinci kez eklenmez. Dönem bütçesi tüm yeni müşteri kohortlarına basitleştirilmiş olarak dağıtılır.

**LTV sayısı verilmedi.** Gerçek ücretli retention kohortları yokken varsayılan churn üzerinden yapay bir müşteri ömrü / yüksek LTV:CAC oranı sunulmadı. Slaytta “Kohortla ölçülecek” yazıyor.

## Dosyalar

`QualiFi-12-Aylik-Ornek-Senaryo.xlsx` girdileri ve aylık Excel formüllerini içerir. `financial-model.json` ve `.csv` aynı hesabın Python ile değerlendirilmiş sayısal sonuçlarını saklar; Excel formülleri yeniden hesaplanmadığında bu sonuçlar kontrol için kullanılabilir. Grafik standart Matplotlib ile üretildi. Model girdileri değiştirilirse slayt görseli de yeniden üretilmelidir.
