# QualiFi — The Round-Down Friend

İngilizce, seslendirmeli, 9:16 Instagram Reels. Kurmaca arkadaş, iki ödemeyi eksik gönderdiği için kendini dâhi sanır; uzman ve QualiFi ajanı araya girer. Ajanın komik çizgi film “nudge” hareketi, tam tutarı istemesiyle sonlanır.

## Hemen kullan

- `QualiFi-The-Round-Down-Friend.mp4`: Paylaşılacak dosya; 1080×1920, 30 fps, yaklaşık 26 saniye, H.264/AAC.
- `QualiFi-The-Round-Down-Friend.html`: Ses ve fontlar dahil tek dosyalık önizleme. Tarayıcıda açıp **Play with sound** seç. İnternet veya Node kurulumu gerektirmez. Kurumsal tarayıcı yerel dosyaları engelliyorsa klasörde `python -m http.server 8768` çalıştırıp localhost:8768 adresini aç.
- `QualiFi-Reel-Cover.png`: Videonun son sahnesinden kapak karesi.
- `.srt`: İngilizce altyazı metni. MP4'te altyazılar zaten görünür; ayrıca yüklemek zorunlu değil.

Instagram'da paylaşmadan önce bio bağlantısını bekleme listesi formuna yönlendir. Videodaki düğme çizimdir; Instagram içinde tıklanabilen bir bağlantı değildir. Meta reklamında hedef URL ve gerçek reklam CTA'sı ayrıca ayarlanır. Paket oluşturulması Instagram'da paylaşım yapmaz.

## Marka ve mesaj

- Forest `#203B30`, lime `#D8EEA6`, paper `#F6F7F2`.
- Başlık: Manrope. Metin: DM Sans. QualiFi'nin mevcut q işareti kullanıldı.
- Tek CTA: **Join the waiting list**. Son kare: **Link in bio · qualifilab.com**.
- Ürün durumunu doğru göstermek için “Early access”, “concept message” ve “the follow-up agent we’re building” ifadeleri var.
- Üç ayrı sentetik İngilizce ses; gerçek bir kişinin taklidi yok. Karakterler özgün SVG çizimleri. Müzik ve efektler kodla üretildi.
- Zararsız, stilize bir çizgi film dürtmesi kullanıldı; yaralanma veya gerçek fiziksel temas görüntüsü yok.

## Örnek hesabın anlamı

`$24.62 − $24.26 = $0.36`; `$78 − $75 = $3.00`.

Her örneğin haftada bir kez tekrarlanması varsayımıyla `($0.36 + $3.00) × 52 = $174.72`. Bu, ödenmemiş tutardır; kazanılmış gelir veya QualiFi'nin müşteriye kazandırdığı para değildir. Varsayım yıllık sayı sahnesinde yazılıdır. Ajanın `$3.36` mesajı ise **bu haftaki** eksik tutardır.

## Kaynak ve yeniden üretim

`template.html` tasarım, çizimler ve deterministik zaman çizelgesini içerir. `window.renderAt(seconds)` sahneyi verilen zamana getirir. `timeline.json` konuşma zamanlarını, ağız hareketi için ses genliklerini ve matematiği saklar.

Mevcut seslerle yeniden HTML/MP4 üretmek için:

```sh
python -m pip install -r requirements-render.txt
python build_html.py
python render.py
```

FFmpeg ve Chromium kurulu olmalı. Chromium bulunmazsa `python -m playwright install chromium` kullan. Özel Chromium yolu `QUALIFI_CHROMIUM` ortam değişkeniyle verilebilir. Render sırasında yerel HTTP sunucusu yalnız 127.0.0.1 üzerinde açılır ve bitince kapanır.

Ses metnini değiştirmek için `make_audio.py` içindeki `SCRIPT` bölümünü düzenle. Değişen klibin `assets/<id>.wav` dosyasını sil; diğer klipler yeniden kullanılabilir. Ayrı bir Python ortamına `requirements-voice.txt` kur. Kokoro v1.0 int8 modeli ve `voices-v1.0.bin` dosyasını aşağıdaki araştırma bağlantılarından indir; klasörünü `QUALIFI_TTS_MODELS` ile belirt. Model dosyaları pakete dahil edilmedi. Sonra `make_audio.py`, `build_html.py`, `render.py` sırasıyla çalıştır. Ses değiştiğinde süre ve altyazı zamanları yeniden hesaplanır.

Çıktı dosyalarını yeniden üretmek için bulut API anahtarı, abonelik veya Canva kredisi gerekmez. Cihaz ve tarayıcı sürümleri arasında küçük rasterizasyon farkları olabilir.

## Kontrol

Başlık/sahne örnekleri tarayıcıda incelendi; sesli oynatma, altyazı akışı ve sayısal hesap kontrol edildi. Bağımsız kaynak incelemesi 5-saniye/LIFT ilkelerine göre yapıldı; bu gerçek ziyaretçilerle yürütülmüş bir anlama testi veya dönüşüm garantisi değildir. Dışa aktarılan MP4'ün teknik kontrol sonucu `qa/media-check.json` içindedir.

Araştırma ve lisans notları: `RESEARCH.md`.
