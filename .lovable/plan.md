# Belge okuma maliyetini düşürme

## Seçilen modeller (ağ geçidinin canlı listesinden, fiyatlar bu çalışma alanının kredi oranıyla)

| Belge | Model | Girdi / çıktı (kredi, 1M token) | Astra'ya göre |
| --- | --- | --- | --- |
| Şu an (hepsi) | openai/gpt-6-astra | 40 / 200 | — |
| Metin: WhatsApp .txt, Excel/CSV metni, PDF sözleşme | openai/gpt-6-luna, düşünme "low" | 0,4 / 2 | yaklaşık 100 kat ucuz (~%99 tasarruf) |
| Fatura görseli: png/jpg | openai/gpt-6-luna, düşünme "medium" | 0,4 / 2 (+ biraz daha fazla düşünme tokenı) | yaklaşık 50-100 kat ucuz |

Neden gpt-6-luna:
- Listede hem metin hem görsel girdi kabul ediyor; faturalar için ayrı sağlayıcı gerekmiyor.
- Responses yüzeyinde veri saklamama (zero retention) işaretli; KVKK açısından astra ile aynı düzey. Daha güçlü ama ucuz alternatif gpt-6.1-terra veri sakladığı için seçilmedi.
- Aynı OpenAI Responses yolu kullanıldığı için yapılandırılmış çıktı şeması, hata eşlemesi (402/403/429/5xx) ve akış davranışı değişmeden kalıyor.
- Görseller için düşünme seviyesini "medium" yapıyoruz: rakam/tarih okumada daha dikkatli olur, maliyet yine astra'nın çok altında.
- Değerlendirilip seçilmeyen: google/gemini-3.8-flash (görsel için iyi, ~13 kat ucuz ama farklı uç nokta ve ayrı kod yolu gerektiriyor; luna daha ucuz).

## Değişiklik
- `src/lib/workspace-extract-deps.server.ts`: `EXTRACT_MODEL` yerine `EXTRACT_TEXT_MODEL` ve `EXTRACT_IMAGE_MODEL` sabitleri; `input.type === "image"` ise görsel modeli ve "medium", aksi halde metin modeli ve "low". `EXTRACT_MODEL` adı başka yerde kullanılıyorsa uyumluluk için metin modeline eşitlenerek korunur.
- Şema, hata kodları, Türkçe mesajlar, rota adresi, günlük sınır kontrolü, demo dosyaları ve account-claim dosyasına dokunulmaz. Arayüz yok.

## Doğrulama
- Model seçimini sınayan küçük bir test (görsel → görsel modeli, metin/PDF → metin modeli) eklenir; mevcut testlerin hepsi çalıştırılır.
- Geçici hesapla canlı deneme: bir WhatsApp .txt ve bir fatura görseli işlenir, 200 ve beklenen taahhütler kontrol edilir, ağ geçidi kayıtlarında kullanılan model ve maliyet doğrulanır; test verisi silinir.
- Commit edilir, yayınlanmaz.
