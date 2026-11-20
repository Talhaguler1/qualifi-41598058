# Canlı WhatsApp mesajları tablosu

Yalnız veritabanı değişikliği; uygulama kodu ve sayfalar değişmez.

## Yeni tablo: `public.qualifi_whatsapp_messages`
Tüm sütunlar ve kontroller istendiği gibi: id, user_id, wa_message_id (benzersiz, boş olabilir), direction ('in','out'), contact_wa_id (en fazla 32), contact_name (en fazla 100), body (en fazla 4096), intent (promise/paid/refuse/question/other), commitment_id (taahhüt silinirse boşalır), previous_due_date, new_due_date, ai_summary (en fazla 400), confidence (0-1), reply_draft (en fazla 1000), reply_state (varsayılan 'none'; none/waiting/sent/dismissed/failed), delivery_status (sent/delivered/read/failed), error (en fazla 300), created_at. (user_id, created_at desc) dizini.

Tek sapma: `user_id` için auth.users'a yabancı anahtar eklenmez. Platform kuralı gereği yeni uygulama tabloları kullanıcı kimliğini düz uuid olarak tutar; bu kural yalnız user_roles ve profiles için istisna tanır. Kullanıcının verisi yine silme fonksiyonuyla temizlenir. Yabancı anahtar özellikle gerekiyorsa söylemen yeterli.

## Güvenlik
- Satır düzeyi güvenlik açık.
- Giriş yapmış kullanıcı: yalnız okuma; kendi satırları veya yönetici (`user_id = auth.uid() OR public.qualifi_is_admin()`).
- Yazma yalnız sunucu (service role) ile.
- Önce varsayılan anon/authenticated hakları REVOKE edilir, sonra authenticated'a SELECT, service_role'e ALL verilir (projede varsayılan haklar ALL verdiği için).

## `qualifi_delete_my_workspace()` güncellemesi
Taahhütlerden önce çağıranın WhatsApp mesajlarını siler ve sonuca `whatsapp` sayısını ekler; diğer her şey aynı.

## Doğrulama
- Tür dosyası yeniden üretilir (otomatik, uygulama kodu değil).
- Sorgularla kontrol: sütunlar/kontroller, politika, haklar (anon erişemez, authenticated ekleyemez), fonksiyon çıktısında `whatsapp` alanı.
