// QualiFi · 24 Kasım 2026 final sunumu (7 dakika) + yedek slaytlar.
// Every figure is either from a cited source, the product itself, or the finance model (labelled as an assumption).
const pptxgen = require("pptxgenjs");
const path = require("path");
const { applyTheme } = require(process.env.PPTX_SKILL + "/scripts/apply_theme.js");

const A = (f) => path.join(__dirname, "assets", f);
const THEME = {
  name: "QualiFi",
  headFontFace: "Schibsted Grotesk",
  bodyFontFace: "Onest",
  colors: {
    dk1: "16302A", lt1: "FFFFFF", dk2: "34524A", lt2: "F7F6F1",
    accent1: "D6EE9E", accent2: "2F7D4F", accent3: "8FBF4D", accent4: "E0873A", accent5: "5D6C61", accent6: "A9B2AB",
    hlink: "2F7D4F", folHlink: "34524A",
  },
};
const HEX = { ink: "16302A", ink2: "34524A", paper: "F7F6F1", lime: "D6EE9E", green: "2F7D4F", muted: "5D6C61", line: "E2E6DB", soft: "EEF2E6", orange: "E0873A" };

const pres = new pptxgen();
pres.layout = "LAYOUT_WIDE"; // 13.333 x 7.5 in
pres.title = "QualiFi · Akbank Düşünce Kulübü final sunumu";
pres.author = "Muhammed Talha Güler";
pres.theme = { headFontFace: THEME.headFontFace, bodyFontFace: THEME.bodyFontFace };
const C = pres.SchemeColor;
const W = 13.333, M = 0.6;

pres.defineSlideMaster({
  title: "ICERIK",
  background: { color: HEX.paper },
  objects: [
    { text: { text: "QualiFi · Akbank Düşünce Kulübü · 24 Kasım 2026", options: { x: M, y: 7.05, w: 7, h: 0.3, fontSize: 10, color: HEX.muted, margin: 0 } } },
  ],
  slideNumber: { x: W - M - 0.6, y: 7.05, w: 0.6, h: 0.3, fontSize: 10, color: HEX.muted, align: "right" },
  placeholders: [],
});
pres.defineSlideMaster({ title: "KOYU", background: { color: HEX.ink }, objects: [] });

// Schibsted Grotesk draws ₺ like £, so the lira sign in titles is set in the body font (Onest).
function liraRuns(text) {
  return text.split(/(₺)/).filter(Boolean).map((t) => (t === "₺" ? { text: t, options: { fontFace: "+mn-lt" } } : { text: t, options: {} }));
}
function title(slide, text, opts = {}) {
  slide.addText(text.includes("₺") ? liraRuns(text) : text, { x: M, y: 0.42, w: W - 2 * M, h: 1.0, fontFace: "+mj-lt", fontSize: 28, bold: true, color: HEX.ink, margin: 0, valign: "top", isTextBox: true, objectName: "Başlık", ...opts });
}
function eyebrow(slide, text) {
  slide.addText(text.toLocaleUpperCase("tr-TR"), { x: M, y: 0.18, w: 6, h: 0.25, fontSize: 11, bold: true, color: HEX.green, charSpacing: 2, margin: 0, isTextBox: true });
}
function img(slide, file, x, y, w, h, alt) {
  slide.addImage({ path: A(file), x, y, w, h, altText: alt, objectName: alt });
}
function phones(slide, back, front, altBack, altFront) {
  const k = 4.6 / 1902; // inch per px, phone body 4.6" tall
  const cw = 1140 * k, ch = 2082 * k, pad = 90 * k;
  slide.addImage({ path: A(back), x: 0.75 - pad, y: 1.5 - pad, w: cw, h: ch, altText: altBack, objectName: altBack });
  slide.addImage({ path: A(front), x: 2.85 - pad, y: 1.92 - pad, w: cw, h: ch, altText: altFront, objectName: altFront });
}
function note(slide, text) {
  slide.addText(text, { x: M, y: 6.62, w: W - 2 * M, h: 0.32, fontSize: 10.5, color: HEX.muted, margin: 0, italic: true, isTextBox: true });
}
function card(slide, x, y, w, h, fill = "FFFFFF", line = HEX.line) {
  slide.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h, fill: { color: fill }, line: { color: line, width: 1 }, rectRadius: 0.18 });
}
const section = (t) => pres.addSection({ title: t });

/* ───────────── ANA SUNUM ───────────── */
section("Ana sunum");

// 1 · Kapak
{
  const s = pres.addSlide({ masterName: "KOYU", sectionTitle: "Ana sunum" });
  // Large mask bleeding off the bottom-right corner; it flies in from that corner (animation added after build).
  s.addShape(pres.shapes.OVAL, { x: 6.3, y: 1.7, w: 8.2, h: 6.6, fill: { color: HEX.lime, transparency: 90 }, line: { color: HEX.lime, transparency: 100 }, objectName: "Kapak isigi" });
  s.addImage({ path: A("maske-buyuk.png"), x: 6.45, y: 1.85, w: 8.4, h: 5.63, rotate: -14, altText: "QualiFi maske logosu", objectName: "Kapak maskesi" });
  s.addText("QualiFi", { x: 0.85, y: 1.35, w: 7, h: 1.4, fontFace: "+mj-lt", fontSize: 80, bold: true, color: "FFFFFF", margin: 0, isTextBox: true });
  s.addText("Paranız ne zaman gelecek, önceden bilin.", { x: 0.85, y: 2.85, w: 6.3, h: 1.2, fontSize: 30, bold: true, color: HEX.lime, margin: 0, valign: "top", isTextBox: true });
  s.addText("Alternatif veriden finansal öngörüye", { x: 0.85, y: 4.15, w: 6.3, h: 0.5, fontSize: 18, color: "C9D8C4", margin: 0, isTextBox: true });
  s.addText("Muhammed Talha Güler · Akbank Düşünce Kulübü · 24 Kasım 2026", { x: 0.85, y: 6.55, w: 11, h: 0.4, fontSize: 13, color: "A9C0A3", margin: 0, isTextBox: true });
  s.addNotes("Merhaba, ben Talha. Projem QualiFi. QualiFi, işletmenin parasının ne zaman geleceğini söyler: faturayı, sözleşmeyi, banka hareketini ve müşterinin verdiği ödeme sözünü bir araya getirir ve nakit sıkışmadan haftalar önce uyarır.");
}

// 2 · Kurucu ve çıkış hikâyesi
{
  const s = pres.addSlide({ masterName: "ICERIK", sectionTitle: "Ana sunum" });
  eyebrow(s, "Kurucu");
  title(s, "Fikir, işletme sahiplerinden aynı cümleyi tekrar tekrar duyunca doğdu");
  // Photo grid: every photo is pre-cropped to its frame ratio (no stretching) with rounded corners.
  img(s, "f_portre.png", 0.6, 1.6, 2.7, 4.9, "Talha Güler, karekodlu şişeyle");
  img(s, "f_sise.png", 3.45, 1.6, 4.0, 2.85, "OzUBEX'te Beni okut karekodlu şişeler");
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 3.6, y: 3.98, w: 3.05, h: 0.34, fill: { color: HEX.ink, transparency: 12 }, line: { color: HEX.ink, transparency: 100 }, rectRadius: 0.17, objectName: "Şişe etiketi zemini" });
  s.addText([{ text: "OzUBEX · ", options: { bold: true, color: HEX.lime } }, { text: "“Beni okut” karekodlu şişeler", options: { color: "FFFFFF" } }], { x: 3.72, y: 3.98, w: 2.9, h: 0.34, fontSize: 11, margin: 0, valign: "middle", isTextBox: true, objectName: "Şişe etiketi" });
  img(s, "f_calisma.png", 3.45, 4.6, 1.925, 1.9, "Ürün geliştirirken");
  img(s, "f_gorusme.png", 5.525, 4.6, 1.925, 1.9, "Görüntülü görüşme");

  // Right column: who, where from, the sentence that started it
  s.addText([
    { text: "Muhammed Talha Güler", options: { fontSize: 26, bold: true, color: HEX.ink, breakLine: true } },
    { text: "Özyeğin Üniversitesi", options: { fontSize: 15, bold: true, color: HEX.green, breakLine: true } },
    { text: "Yönetim Bilişim Sistemleri ve Bilgisayar Mühendisliği", options: { fontSize: 14, color: HEX.ink2 } },
  ], { x: 7.85, y: 1.6, w: 4.88, h: 1.3, margin: 0, valign: "top", paraSpaceAfter: 4, isTextBox: true });
  let cx = 7.85;
  for (const [label, w] of [["Porsuk", 1.15], ["Endgame Arena", 1.85], ["Ozu Ventures", 1.65]]) {
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: cx, y: 3.02, w, h: 0.42, fill: { color: HEX.soft }, line: { color: HEX.line, width: 1 }, rectRadius: 0.21 });
    s.addText(label, { x: cx, y: 3.02, w, h: 0.42, fontSize: 12.5, bold: true, color: HEX.ink, align: "center", valign: "middle", margin: 0, isTextBox: true });
    cx += w + 0.12;
  }
  card(s, 7.85, 3.75, 4.88, 2.75, HEX.ink, HEX.ink);
  s.addText("“", { x: 8.1, y: 3.8, w: 0.8, h: 0.8, fontFace: "+mj-lt", fontSize: 60, bold: true, color: HEX.green, margin: 0, isTextBox: true });
  s.addText([
    { text: "Faturayı kestik, ama para ne zaman gelecek bilmiyoruz.", options: { fontSize: 22, bold: true, color: HEX.lime, breakLine: true } },
    { text: "Ozu Ventures'ta işletme sahipleriyle görüşmelerde en sık duyduğum cümle. QualiFi buradan doğdu.", options: { fontSize: 13.5, color: "C9D8C4" } },
  ], { x: 8.15, y: 4.45, w: 4.3, h: 1.9, margin: 0, valign: "top", paraSpaceAfter: 10, isTextBox: true });
  s.addNotes("Özyeğin'de Yönetim Bilişim Sistemleri ve Bilgisayar Mühendisliği okuyorum. Porsuk ve Endgame Arena'da ürün geliştirdim, Ozu Ventures'ta işletme sahipleriyle görüştüm. Bu görüşmelerde hep aynı cümleyi duydum: \"Faturayı kestik, ama para ne zaman gelecek bilmiyoruz.\" QualiFi bu cümleden doğdu.");
}

// 3 · Problem
{
  const s = pres.addSlide({ masterName: "ICERIK", sectionTitle: "Ana sunum" });
  eyebrow(s, "Problem");
  title(s, "Ödeme sözü veriliyor, ama nakit planına hiç girmiyor");
  // before → after
  card(s, M, 1.75, 3.6, 2.3, "FFFFFF");
  s.addText([{ text: "MÜŞTERİ KONUŞMASI", options: { fontSize: 11, bold: true, color: HEX.muted, charSpacing: 2, breakLine: true } }, { text: "“Ödemeyi cuma gönderiyoruz.”", options: { fontSize: 22, bold: true, color: HEX.ink, breakLine: true } }, { text: "Telefonda, WhatsApp'ta ya da yüz yüze", options: { fontSize: 13, color: HEX.muted } }], { x: M + 0.3, y: 1.95, w: 3.0, h: 1.9, margin: 0, valign: "top", paraSpaceAfter: 8, isTextBox: true });
  s.addShape(pres.shapes.RIGHT_ARROW, { x: 4.35, y: 2.65, w: 0.6, h: 0.5, fill: { color: HEX.ink } });
  card(s, 5.1, 1.75, 3.6, 2.3, "FBE9E4", "F1C9BE");
  s.addText([{ text: "NAKİT PLANI", options: { fontSize: 11, bold: true, color: "8A3A2A", charSpacing: 2, breakLine: true } }, { text: "Söz işlenmedi", options: { fontSize: 22, bold: true, color: "8A3A2A", breakLine: true } }, { text: "Beklenen tahsilat tarihi güncel değil; sıkışma ay sonunda fark ediliyor.", options: { fontSize: 13, color: "6B3A2E" } }], { x: 5.4, y: 1.95, w: 3.0, h: 1.9, margin: 0, valign: "top", paraSpaceAfter: 8, isTextBox: true });
  s.addText([
    { text: "Üç hipotezle sahaya çıktık", options: { fontSize: 15, bold: true, color: HEX.ink, breakLine: true } },
    { text: "Alacak takibi elle ve dağınık yapılıyor; söz hiçbir tabloya girmiyor.", options: { bullet: { type: "number" }, fontSize: 14, color: HEX.ink2, breakLine: true } },
    { text: "Nakit tahmini işletmenin çok vaktini alıyor ve yine de tutmuyor.", options: { bullet: { type: "number" }, fontSize: 14, color: HEX.ink2, breakLine: true } },
    { text: "Bu boşluk bankada kredi kararını zorlaştırıyor; sorun ancak taksit gecikince görülüyor.", options: { bullet: { type: "number" }, fontSize: 14, color: HEX.ink2, breakLine: true } },
    { text: "14 işletme sahibi ve 7 bankacıyla (4 şubede yüz yüze, 3 çevrimiçi) yaptığımız görüşmelerde üçü de doğrulandı.", options: { fontSize: 13, bold: true, color: HEX.green } },
  ], { x: M, y: 4.3, w: 8.1, h: 2.1, margin: 0, valign: "top", paraSpaceAfter: 5, isTextBox: true });
  // stats
  card(s, 9.1, 1.75, 3.63, 2.15, "FFFFFF");
  s.addText([{ text: "%51", options: { fontSize: 48, bold: true, color: HEX.green, breakLine: true } }, { text: "işveren KOBİ düzensiz nakit akışını finansal sorun olarak görüyor (ABD)", options: { fontSize: 13, color: HEX.ink2, breakLine: true } }, { text: "Fed Small Business Credit Survey, 2025 raporu (2024 anketi)", options: { fontSize: 10, color: HEX.muted } }], { x: 9.35, y: 1.85, w: 3.2, h: 1.95, margin: 0, valign: "top", paraSpaceAfter: 4, isTextBox: true });
  card(s, 9.1, 4.1, 3.63, 2.15, HEX.ink, HEX.ink);
  s.addText([{ text: "200+", options: { fontSize: 48, bold: true, color: HEX.lime, breakLine: true } }, { text: "bir ilişki temsilcisinin konuştuğu KOBİ sayısı", options: { fontSize: 13, color: "E3EEDB", breakLine: true } }, { text: "Kaynak: KOBİ müşteri temsilcisi görüşmesi", options: { fontSize: 10, color: "A9C0A3" } }], { x: 9.35, y: 4.2, w: 3.2, h: 1.95, margin: 0, valign: "top", paraSpaceAfter: 4, isTextBox: true });
  s.addNotes("Bu cümlenin arkasında şu var: müşteri \"cuma gönderiyoruz\" diyor, ama bu söz hiçbir tabloya girmiyor. Bilgi muhasebe programında, bankada ve en önemlisi konuşmada dağınık duruyor. ABD'de Fed'in KOBİ anketinde işletmelerin yarısı düzensiz nakit akışını sorun olarak görüyor. Üç hipotezle sahaya çıktım: takip elle yapılıyor, nakit tahmini çok vakit alıyor ve bu boşluk bankada kredi kararını zorlaştırıyor. On dört işletme sahibiyle ve yedi bankacıyla konuştum; dördünü şubesinde yerinde gördüm. Üçü de doğrulandı. Bir ilişki temsilcisi iki yüzden fazla KOBİ ile ilgileniyor; sorunu ancak taksit gecikince görüyor.");
}

// 4 · Persona ve sahadan öğrendiklerimiz
{
  const s = pres.addSlide({ masterName: "ICERIK", sectionTitle: "Ana sunum" });
  eyebrow(s, "Kimin için · sahadan öğrendiklerimiz");
  title(s, "İlk müşterimiz: vadeli satan, yüzden fazla açık alacağı olan işletme");
  card(s, M, 1.7, 4.2, 4.75, HEX.ink, HEX.ink);
  s.addText([
    { text: "PERSONA", options: { fontSize: 11, bold: true, color: HEX.lime, charSpacing: 2, breakLine: true } },
    { text: "Küçük esnaf ve küçük işletme", options: { fontSize: 22, bold: true, color: "FFFFFF", breakLine: true } },
    { text: "5–50 kişi, vadeli satış", options: { bullet: true, fontSize: 15, color: "E3EEDB", breakLine: true } },
    { text: "Sürekli yüzden fazla açık alacak", options: { bullet: true, fontSize: 15, color: "E3EEDB", breakLine: true } },
    { text: "Muhasebe yarı zamanlı ya da 1–2 kişi", options: { bullet: true, fontSize: 15, color: "E3EEDB", breakLine: true } },
    { text: "Sözü telefonda ya da WhatsApp'ta alır", options: { bullet: true, fontSize: 15, color: "E3EEDB", breakLine: true } },
    { text: "Teknolojiyi aktif kullanır", options: { bullet: true, fontSize: 15, color: "E3EEDB" } },
  ], { x: M + 0.35, y: 1.95, w: 3.6, h: 4.3, margin: 0, valign: "top", paraSpaceAfter: 7, isTextBox: true });
  s.addText("14 işletme sahibi ve 7 bankacıdan duyduk, ürüne yansıttık", { x: 5.2, y: 1.7, w: 7.5, h: 0.45, fontSize: 18, bold: true, color: HEX.ink, margin: 0, isTextBox: true });
  const rows = [
    ["“Müşteri sözü telefonda veriyor, WhatsApp şart mı?”", "Telefonda ya da yüz yüze alınan söz on saniyede kaydediliyor."],
    ["“Mesaj kuralla değil, anlamıyla okunmalı.”", "Mesajı yapay zekâ okuyor; emin değilse tahmin yürütmüyor, işletmeye soruyor."],
    ["“Bana rakam lazım: bu gecikme kaça mal oluyor?”", "Gecikmenin maliyeti, ödemeleri karşılama oranı ve finansman ihtiyacı eklendi."],
  ];
  rows.forEach(([heard, did], i) => {
    const y = 2.3 + i * 1.38;
    card(s, 5.2, y, 7.53, 1.2, "FFFFFF");
    s.addText(heard, { x: 5.45, y: y + 0.12, w: 3.3, h: 0.96, fontSize: 14, italic: true, color: HEX.ink2, margin: 0, valign: "middle", isTextBox: true });
    s.addShape(pres.shapes.RIGHT_ARROW, { x: 8.85, y: y + 0.45, w: 0.35, h: 0.3, fill: { color: HEX.green } });
    s.addText(did, { x: 9.35, y: y + 0.12, w: 3.2, h: 0.96, fontSize: 14, bold: true, color: HEX.ink, margin: 0, valign: "middle", isTextBox: true });
  });
  s.addNotes("İlk müşterimiz vadeli satan, sürekli yüzden fazla açık alacağı olan küçük işletmeler. Görüştüğüm kişilerden üç şey öğrendim ve hepsini ürüne yansıttım. On dört işletme sahibiyle ve yedi bankacıyla görüştüm, Özyeğin'de girişimcilere ilk sunumu yapıp demoyu denettim. Birincisi, söz çoğu zaman telefonda veriliyor; artık on saniyede kaydediliyor. İkincisi, mesaj kuralla değil anlamıyla okunmalı. Üçüncüsü, işletme rakam istiyor: bu gecikme bana kaça mal oluyor?");
}

// 5 · Çözüm
{
  const s = pres.addSlide({ masterName: "ICERIK", sectionTitle: "Ana sunum" });
  eyebrow(s, "Çözüm");
  title(s, "QualiFi dağınık veriyi tek yerde birleştirip altı somut çıktıya çevirir");
  img(s, "12-veri-kaynaklari.png", 0.95, 1.6, 11.43, 3.57, "Veri kaynakları, QualiFi ve altı çıktı");
  const layers = [["Okur", "Dil modeli mesajdan söz, tarih ve tutarı çıkarır; güveni düşükse işaretler.", "Bugün"], ["Hesaplar", "Vade, ödeme geçmişi ve sözden nakit takvimi ve açık tahmini.", "Bugün"], ["Önerir", "Hatırlatma taslağı hazırlar; işletme onaylamadan hiçbir şey gitmez.", "Bugün"]];
  layers.forEach(([h, t, st], i) => {
    const x = M + i * 4.1;
    card(s, x, 5.35, 3.9, 1.15, "FFFFFF");
    s.addText([{ text: h + "  ", options: { bold: true, fontSize: 15, color: HEX.ink } }, { text: st, options: { fontSize: 10, bold: true, color: HEX.green } }], { x: x + 0.22, y: 5.43, w: 3.5, h: 0.35, margin: 0, isTextBox: true });
    s.addText(t, { x: x + 0.22, y: 5.78, w: 3.5, h: 0.65, fontSize: 12.5, color: HEX.ink2, margin: 0, valign: "top", isTextBox: true });
  });
  s.addNotes("QualiFi işletmenin zaten sahip olduğu veriyi okur: e-fatura ve ön muhasebe, banka hareketleri, sözleşmeler ve müşterinin verdiği söz. Söz telefonda verildiyse on saniyede kaydedilir; WhatsApp'tan geldiyse yapay zekâ okur. Bunlardan altı çıktı üretir. Bu altı çıktı işletmenin altı sorusuna cevap veriyor: kim öder, ne zaman öder, gecikme kaça mal olur, önümüzdeki 30 günde ne kadar tahsil ederim, bu ödemelerimi karşılar mı ve açık varsa ne kadar finansman gerekir. Yapay zekâ okur ve hesaplar; mesaj göndermek gibi her aksiyon için işletmenin onayı gerekir.");
}

// 7 · İşletme demosu
{
  const s = pres.addSlide({ masterName: "ICERIK", sectionTitle: "Ana sunum" });
  eyebrow(s, "Ürün · işletme");
  title(s, "Söz ister WhatsApp’tan ister telefondan gelsin, nakit planı o an güncellenir");
  // Three phones fanned: landing page (where people arrive), decision summary, live update.
  {
    const k = 4.3 / 1902, cw = 1140 * k, ch = 2082 * k, pad = 90 * k;
    [["telefon_landing.png", 0.5, 1.95, "Tanıtım sayfası, qualifilab.com"], ["telefon_nh.png", 2.3, 1.5, "Karar özeti ve alt sekme çubuğu"], ["telefon_nc.png", 4.1, 1.95, "Telefonda alınan sözün canlı güncellemesi"]]
      .forEach(([f, x, y, alt]) => s.addImage({ path: A(f), x: x - pad, y: y - pad, w: cw, h: ch, altText: alt, objectName: alt }));
  }
  const steps = [["1", "Karar özeti", "Gecikmenin maliyeti, 30 günde ödemeleri karşılama ve finansman ihtiyacı tek bakışta."], ["2", "Söz kaydedilir", "WhatsApp mesajı yapay zekâyla okunur; telefonda alınan söz on saniyede girilir ve doğru faturayla eşleşir."], ["3", "Plan o an yeniden çizilir", "Beklenen tarih kayar, tahmin ve gecikmenin maliyeti güncellenir. Takip mesajı taslaktır; işletme onaylamadan gitmez."]];
  steps.forEach(([n, h, t], i) => {
    const y = 1.7 + i * 1.6;
    s.addShape(pres.shapes.OVAL, { x: 6.8, y, w: 0.55, h: 0.55, fill: { color: HEX.lime }, line: { color: HEX.lime } });
    s.addText(n, { x: 6.8, y, w: 0.55, h: 0.55, fontSize: 16, bold: true, color: HEX.ink, align: "center", valign: "middle", margin: 0, isTextBox: true });
    s.addText([{ text: h, options: { fontSize: 18, bold: true, color: HEX.ink, breakLine: true } }, { text: t, options: { fontSize: 14, color: HEX.ink2 } }], { x: 7.55, y: y - 0.05, w: 5.2, h: 1.35, margin: 0, valign: "top", paraSpaceAfter: 4, isTextBox: true });
  });
  note(s, "Soldan: tanıtım sayfası (qualifilab.com), karar özeti, canlı güncelleme. Demo sentetik verili örnek işletmedir: qualifilab.com/demo");
  s.addNotes("İşletme sahibi bizi önce tanıtım sayfasında görüyor. Önce tanıtım sayfası ve reklamla soğuk kitleyi denedik; dönüş zayıftı. Buradan şunu öğrendik: bu ürünü esnafa reklam değil, güvendiği biri anlatmalı. Bu yüzden doğrudan görüşmeye geçtik ve on dört işletme sahibine ürünü elden denettik. İşletme sahibi paneli açtığında karar özetini görür: gecikmeler ona kaça mal oluyor, önümüzdeki 30 günde tahsilat ödemelerin ne kadarını karşılıyor ve finansmana ihtiyacı var mı. Müşteri telefonda \"ayın dokuzunda ödüyorum\" dediğinde işletme sahibi bunu on saniyede kaydeder; WhatsApp'tan yazdıysa yapay zekâ okur. Söz doğru faturayla eşleşir, nakit planı o an yeniden çizilir. Takip mesajı hazırlansa da işletme onaylamadan hiçbir şey gitmez.");
}

// 8 · Banka demosu + Akbank faydası
{
  const s = pres.addSlide({ masterName: "ICERIK", sectionTitle: "Ana sunum" });
  eyebrow(s, "Akbank'a fayda");
  title(s, "Banka, işletmenin nakit sıkışıklığını kredi taksiti gecikmeden önce, onun izniyle görür");
  phones(s, "telefon_p08.png", "telefon_p10.png", "Bankacı asistanı öncelik listesi", "İşletmenin paylaştığı karne");
  const rows = [["Bugün bankanın gördüğü", "QualiFi ile, işletmenin izniyle"], ["Hesap hareketi", "Beklenen tahsilatlar ve verilen ödeme sözleri"], ["Geçmiş kredi davranışı", "Müşterilerin söz tutma oranı"], ["Dönem sonu finansal tablo", "8 haftalık nakit takvimi ve açık tahmini"], ["Temsilcinin sezgisi", "Kaynağı gösterilen, açıklanabilir erken uyarı"]];
  s.addTable(rows.map((r, i) => r.map((c, j) => ({ text: c, options: { bold: i === 0 || j === 1, fontSize: i === 0 ? 12 : 13.5, color: i === 0 ? (j === 1 ? HEX.ink : HEX.muted) : HEX.ink, fill: { color: i === 0 ? (j === 1 ? HEX.lime : HEX.soft) : (j === 1 ? "F1F8E4" : "FFFFFF") }, valign: "middle", margin: [4, 8, 4, 8] } }))), { x: 6.75, y: 1.65, w: 5.98, colW: [2.5, 3.48], rowH: 0.62, border: { type: "solid", color: HEX.line, pt: 1 } });
  s.addText([
    { text: "Temsilciye otomatik not: ", options: { bold: true, color: HEX.ink, bullet: true } }, { text: "bugün kimi, neden araması gerektiği.", options: { color: HEX.ink2, breakLine: true } },
    { text: "Doğru teklif, doğru zamanda: ", options: { bold: true, color: HEX.ink, bullet: true } }, { text: "çek iskontosu, kısa vadeli kredi, limit artışı ya da faktoring.", options: { color: HEX.ink2, breakLine: true } },
    { text: "Yeni müşteri: ", options: { bold: true, color: HEX.ink, bullet: true } }, { text: "bankayla arası olmayan KOBİ'ye, işine yarayan bir araçla ulaşılır.", options: { color: HEX.ink2 } },
  ], { x: 6.75, y: 4.9, w: 5.98, h: 1.6, fontSize: 13, margin: 0, valign: "top", paraSpaceAfter: 4, isTextBox: true });
  note(s, "Beklenen fayda. Akbank ile bir entegrasyon ya da ölçülmüş sonuç henüz yok; banka ekranları sentetik veriyle çalışan demodur.");
  s.addNotes("Peki banka ne kazanıyor? Bugün banka hesap hareketini ve geçmiş kredi davranışını görüyor. QualiFi ile, yalnızca işletme izin verirse, beklenen tahsilatları, müşterilerin söz tutma oranını ve sekiz haftalık nakit takvimini görür. Akbank'a üç faydası var. Birincisi, müşteri temsilcisine otomatik not düşer: bugün kimi, neden araması gerektiği. İkincisi, doğru teklif doğru zamanda gider: çek iskontosu, kısa vadeli kredi, limit artışı ya da faktoring, kredi taksiti gecikmeden önce. Üçüncüsü, bankayla arası olmayan KOBİ'lere işlerine yarayan bir araçla ulaşılır; bu Akbank için yeni müşteri demek. Müşteri isimleri ve ham mesajlar paylaşılmaz.");
}

// 9 · Rekabet
{
  const s = pres.addSlide({ masterName: "ICERIK", sectionTitle: "Ana sunum" });
  eyebrow(s, "Rekabet");
  title(s, "Rakipler kaydı okur; QualiFi müşterinin sözünü de okur");
  img(s, "7-rekabet-haritasi.png", 1.55, 1.45, 10.22, 5.75, "Rekabet haritası");
  s.addNotes("Türkiye'deki araçlar faturayı kaydeder; yurt dışındakiler kendi pazarına göre kurulu. En yakın rakibimiz Tesorio ödeme sözünü okuyor ama yalnızca e-postadan ve ERP'si olan büyük şirketler için. QualiFi WhatsApp'taki ve telefondaki sözü okur, ERP gerektirmez ve bankayla izinle paylaşır.");
}

// 10 · Pazar
{
  const s = pres.addSlide({ masterName: "ICERIK", sectionTitle: "Ana sunum" });
  eyebrow(s, "Pazar");
  title(s, "İlk hedef 1.000 işletme; hizmet verilebilir pazar aylık ₺205 milyon");
  img(s, "10-pazar.png", 1.2, 1.45, 10.93, 5.12, "TAM SAM SOM");
  note(s, "KOBİ sayısı TÜİK 2024. Ölçek dağılımı tahmindir. Finans modelinde 1.000 ücretli işletmeye 14. ayda ulaşılıyor (varsayım).");
  s.addNotes("Türkiye'de TÜİK'e göre 3,9 milyon KOBİ var. Odaklandığımız kesim alacağı çok olan küçük ve orta firmalar; aylık 205 milyon liralık hizmet verilebilir pazar. İlk hedefimiz bu kesimde teknolojiyi aktif kullanan 1.000 işletme; finans planımızda buna 14. ayda ulaşıyoruz.");
}

// 11 · Gelir modeli
{
  const s = pres.addSlide({ masterName: "ICERIK", sectionTitle: "Ana sunum" });
  eyebrow(s, "İş modeli");
  title(s, "Her işletme kendi ölçeğine göre öder; banka kurumsal lisansla katılır");
  // Package ladder from the pricing visuals (ratio 1747:859)
  img(s, "merdiven.png", 0.6, 1.62, 8.5, 8.5 * 810 / 1747, "Paket merdiveni: Başlangıç, KOBİ, Büyüme, Banka");
  const k = [["%72", "KOBİ paketinde brüt marj", "hesap başı maliyet ₺96: yapay zekâ, WhatsApp mesajı, entegrasyon, barındırma"], ["Ücretsiz", "Başlangıç paketi", "serbest çalışanlar ve şahıs şirketleri veri havuzuna katılır, ürün engelsiz denenir"], ["Lisans", "Bankalar", "portföye göre fiyatlanan kurumsal paket (modelde varsayım: 13. aydan itibaren)"]];
  k.forEach(([v, h, t], i) => {
    const y = 1.62 + i * 1.62;
    card(s, 9.35, y, 3.38, 1.47, i === 0 ? HEX.ink : "FFFFFF", i === 0 ? HEX.ink : HEX.line);
    s.addText([{ text: v, options: { fontSize: 24, bold: true, color: i === 0 ? HEX.lime : HEX.green, breakLine: true } }, { text: h, options: { fontSize: 13.5, bold: true, color: i === 0 ? "FFFFFF" : HEX.ink, breakLine: true } }, { text: t, options: { fontSize: 10.5, color: i === 0 ? "C9D8C4" : HEX.ink2 } }], { x: 9.55, y: y + 0.1, w: 3.0, h: 1.3, margin: 0, valign: "top", paraSpaceAfter: 2, isTextBox: true });
  });
  note(s, "Fiyatlar aylık, KDV hariç. Segmentlere göre kullanım şekli yedek slaytta.");
  s.addNotes("Gelir modelimiz bir büyüme merdiveni. Başlangıç paketi ücretsiz: serbest çalışanları ve şahıs şirketlerini veri havuzuna katmak ve ürünü engelsiz denetmek için. KOBİ paketi ayda 390 lira, büyüme paketi 3.990 lira. Bir KOBİ hesabının bize maliyeti ayda yaklaşık 96 lira; brüt marj yüzde 72. Bankalar kurumsal lisansla katılıyor; yani iki taraftan gelir.");
}

// 12 · Yapay zekâ ve inovasyon
{
  const s = pres.addSlide({ masterName: "ICERIK", sectionTitle: "Ana sunum" });
  eyebrow(s, "Yapay zekâ çağında bankacılık");
  title(s, "Yapay zekâ okur ve hesaplar; kararı her zaman insan verir");
  img(s, "15-yapay-zeka-inovasyon.png", 0.95, 1.75, 11.43, 3.2, "Yapay zekâ ilkesi ve inovasyonlar");
  s.addText("Bugünkü ürün → bankaya izinli karar desteği → işletme ve banka ajanlarının izinle, standart protokollerle konuştuğu finansman", { x: M, y: 5.35, w: W - 2 * M, h: 0.8, fontSize: 16, bold: true, color: HEX.ink2, margin: 0, isTextBox: true });
  s.addNotes("Güncel bir araştırmada 23 yapay zekâ modeli on bir yıllık bir finans yöneticisi simülasyonunda denendi; denemelerin yalnızca yüzde 15'i sonuna kadar dayanabildi. Bu yüzden QualiFi'de yapay zekâ okur ve hesaplar, kararı insan verir. Bugün sözü anlayan okuma hattı çalışıyor. Sırada olasılıklı nakit tahmini, kaynak gösteren analist ajanlar ve verinin cihazda kalıp sistemin sektörden öğrendiği federe öğrenme var.");
}

// 13 · Yol haritası
{
  const s = pres.addSlide({ masterName: "ICERIK", sectionTitle: "Ana sunum" });
  eyebrow(s, "Yol haritası");
  title(s, "Son iki ayda çalışan ürüne ulaştık; sırada banka pilotu var");
  img(s, "9-yol-haritasi.png", 0.65, 2.1, 12.0, 3.0, "Yol haritası");
  note(s, "Bugün çalışanlar: canlı site ve demo, belge okuma, WhatsApp'tan gelen mesajı yapay zekâyla okuma, sözlü söz kaydı.");
  s.addNotes("Son iki ayda saha görüşmeleri yaptım, canlı demoyu yayına aldım, belge okumayı ve WhatsApp'tan gelen mesajı anlık okumayı çalıştırdım. Bugün ürün çalışıyor. İlk iki ayda banka pilotu ve işletmelerin kendi numaralarını bağlaması, sonra e-fatura ve açık bankacılık, dört aydan sonra da bankaların yapay zekâ ajanlarıyla finansman.");
}

// 14 · Finansal plan ve talep
{
  const s = pres.addSlide({ masterName: "ICERIK", sectionTitle: "Ana sunum" });
  eyebrow(s, "Talep");
  title(s, "₺12,75 milyonla 12 ayda banka pilotu ve ~780 ücretli işletme");
  img(s, "16-finansal-plan.png", 0.95, 1.6, 11.43, 3.69, "Finansal plan");
  s.addText([{ text: "Neden şimdi: ", options: { bold: true, color: HEX.ink } }, { text: "Ürün çalışıyor; tahmini gerçek ve izinli işletme verisiyle bir banka pilotunda kanıtlamamız gerekiyor.", options: { color: HEX.ink2 } }], { x: M, y: 5.55, w: W - 2 * M, h: 0.6, fontSize: 15, margin: 0, isTextBox: true });
  note(s, "Varsayımlara dayalı plan (12 ay pist, 4 kişilik ekip, %20 güvenlik payı). Varsayımlar yedek slaytlarda.");
  s.addNotes("Talebimiz 12,75 milyon lira tohum yatırımı ve bir bankayla pilot ortaklığı. Bu tutar finans modelimizden geliyor: on iki aylık pist ve dört kişilik ekip. Paranın yarısına yakını ürün ve ekibe, dörtte biri işletme edinimine gidiyor. On iki ayın sonunda hedefimiz yaklaşık 780 ücretli işletme ve aylık 526 bin lira gelir; 13. ayda ilk banka lisansı.");
}

// 15 · Kapanış + QR
{
  const s = pres.addSlide({ masterName: "KOYU", sectionTitle: "Ana sunum" });
  s.addText("Paranın ne zaman geleceği artık bir tahmin değil, bir kayıt olsun.", { x: 0.85, y: 1.5, w: 7.6, h: 2.6, fontFace: "+mj-lt", fontSize: 38, bold: true, color: "FFFFFF", margin: 0, valign: "top", isTextBox: true });
  s.addText("Gelin, dağınık veriyi birlikte finansal öngörüye dönüştürelim.", { x: 0.85, y: 4.2, w: 7.6, h: 0.9, fontSize: 20, color: HEX.lime, margin: 0, isTextBox: true });
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 9.05, y: 1.5, w: 3.45, h: 4.25, fill: { color: "FFFFFF" }, line: { color: "FFFFFF" }, rectRadius: 0.2 });
  img(s, "p21_0.png", 9.35, 1.8, 2.85, 2.85, "Şifresiz demo karekodu: qualifilab.com/demo");
  s.addText([{ text: "Şifresiz demo", options: { fontSize: 16, bold: true, color: HEX.ink, breakLine: true } }, { text: "qualifilab.com/demo", options: { fontSize: 14, color: HEX.green } }], { x: 9.35, y: 4.75, w: 2.85, h: 0.8, align: "center", margin: 0, isTextBox: true });
  s.addText("Teşekkürler · Muhammed Talha Güler · qualifilab.com", { x: 0.85, y: 6.55, w: 11, h: 0.4, fontSize: 13, color: "A9C0A3", margin: 0, isTextBox: true });
  s.addNotes("Artık bir işletme \"para ne zaman gelecek?\" diye sorduğunda cevap bir tahmin değil, bir kayıt olsun. Karekodu okutarak demoyu şifresiz hemen deneyebilirsiniz. Teşekkür ederim, sorularınızı bekliyorum.");
}

/* ───────────── YEDEK SLAYTLAR ───────────── */
section("Yedek slaytlar");
const Y = "Yedek slaytlar";

// Y0 · Örnek işletmede altı çıktı (moved from the main deck: too many numbers to read live)
{
  const s = pres.addSlide({ masterName: "ICERIK", sectionTitle: Y });
  eyebrow(s, "Yedek · örnek işletme");
  title(s, "Altı soruya cevap: kim öder, ne zaman, kaça mal olur, ne kadar finansman gerekir");
  img(s, "13-alti-cikti.png", 0.95, 1.55, 11.43, 4.41, "Altı çıktı ve örnekleri");
  note(s, "Örnek veriyle; gecikmenin maliyeti işletmenin kendi kredi faiziyle hesaplanır (tutar × gün × yıllık faiz ÷ 365).");
  s.addNotes("Bu altı çıktı işletmenin günlük sorularına cevap veriyor. Hangi müşteri sözünü tutuyor? Bu fatura kaç gün gecikecek? Bu gecikme bana kaça mal oluyor? Önümüzdeki 30 günde ne kadar tahsil edeceğim, bu ödemelerimin ne kadarını karşılıyor? Ve açık varsa ne kadar finansmana ihtiyacım var? Ekrandaki rakamlar örnek veri.");
}

// Y1 · Teknik mimari
{
  const s = pres.addSlide({ masterName: "ICERIK", sectionTitle: Y });
  eyebrow(s, "Yedek · teknik mimari");
  title(s, "Mesajdan nakit planına: hangi adım bugün çalışıyor, hangisi plan");
  const steps = [["Mesaj gelir", "WhatsApp Business resmî Cloud API; imza doğrulanır", "Bugün"], ["Okunur", "Büyük dil modeli niyet, tarih, tutar ve güven puanı çıkarır", "Bugün"], ["Denetlenir", "Güven 0,75'in altındaysa “kontrol bekliyor” olarak işaretlenir", "Bugün"], ["İşlenir", "Eşleşen alacağın beklenen tarihi kayar; nakit takvimi yeniden çizilir", "Bugün"], ["Onaylanır", "Cevap taslağı işletme onaylamadan gönderilmez", "Bugün"], ["Ölçeklenir", "Ön eleme, küçük yerel model, kural tabanlı tarih çözümleme", "Plan"]];
  steps.forEach(([h, t, st], i) => {
    const col = i % 3, row = Math.floor(i / 3);
    const x = M + col * 4.1, y = 1.75 + row * 2.4;
    card(s, x, y, 3.9, 2.15, st === "Plan" ? HEX.soft : "FFFFFF");
    s.addText(`${i + 1}`, { x: x + 0.25, y: y + 0.22, w: 0.5, h: 0.5, fontSize: 22, bold: true, color: HEX.green, margin: 0, isTextBox: true });
    s.addText(st, { x: x + 2.6, y: y + 0.25, w: 1.05, h: 0.3, fontSize: 10, bold: true, color: st === "Plan" ? "8A4A12" : HEX.green, align: "right", margin: 0, isTextBox: true });
    s.addText([{ text: h, options: { fontSize: 17, bold: true, color: HEX.ink, breakLine: true } }, { text: t, options: { fontSize: 13, color: HEX.ink2 } }], { x: x + 0.25, y: y + 0.75, w: 3.4, h: 1.3, margin: 0, valign: "top", paraSpaceAfter: 4, isTextBox: true });
  });
  s.addNotes("Özgün olan kısım modelin kendisi değil, akış: sözü faturayla eşleştirmek, güven düşükse insana sormak ve nakit takvimini yeniden hesaplamak. Dil modeli olarak hazır bir model kullanıyoruz; ölçekte küçük ve yerel bir modele geçmeyi planlıyoruz.");
}

// Y2 · Veri güvenliği ve KVKK
{
  const s = pres.addSlide({ masterName: "ICERIK", sectionTitle: Y });
  eyebrow(s, "Yedek · veri güvenliği");
  title(s, "Veri işletmenindir; bankaya yalnızca izinle, yalnızca özet gider");
  const cols = [["Bugün", ["Belgeler yalnızca kullanıcının hesabında, satır düzeyinde erişim kurallarıyla", "WhatsApp mesajları resmî API ile, imza doğrulamasıyla alınır", "Hiçbir mesaj işletme onaylamadan gönderilmez", "Kullanıcı tüm verisini tek tuşla silebilir"]], ["Bankayla paylaşım", ["Yalnızca işletmenin açık izniyle", "Müşteri isimleri, vergi numaraları ve ham mesajlar paylaşılmaz", "Paylaşım kaydı tutulur, izin geri alınabilir"]], ["Pilot öncesi", ["KVKK aydınlatma metni ve izin akışı", "Yurt dışına aktarım (m.9) için standart sözleşme", "Açık bankacılık için lisanslı ortak", "Türkiye'de barındırma, sızma testi"]]];
  cols.forEach(([h, items], i) => {
    const x = M + i * 4.1;
    card(s, x, 1.75, 3.9, 4.7, i === 1 ? HEX.ink : "FFFFFF", i === 1 ? HEX.ink : HEX.line);
    s.addText([{ text: h, options: { fontSize: 18, bold: true, color: i === 1 ? HEX.lime : HEX.ink, breakLine: true } }, ...items.map((t, j) => ({ text: t, options: { bullet: true, fontSize: 13.5, color: i === 1 ? "E3EEDB" : HEX.ink2, breakLine: j < items.length - 1 } }))], { x: x + 0.28, y: 1.95, w: 3.35, h: 4.3, margin: 0, valign: "top", paraSpaceAfter: 8, isTextBox: true });
  });
}

// Y3 · Tahmin doğruluğu nasıl ölçülecek
{
  const s = pres.addSlide({ masterName: "ICERIK", sectionTitle: Y });
  eyebrow(s, "Yedek · doğruluk");
  title(s, "Doğruluğu pilotta, gerçek ve izinli veriyle ölçeceğiz");
  const rows = [["Ölçü", "Sorduğu soru"], ["Uyarı ön süresi", "Nakit açığı oluşmadan kaç gün önce uyarı verildi?"], ["Kaçırılan açık oranı", "Hiç uyarı verilmeden oluşan açıkların oranı"], ["Yanlış alarm oranı", "Gerçekleşmeyen uyarıların oranı"], ["Kalibrasyon", "“%70 ihtimal” dediğimiz durumların gerçekten ~%70'i oluyor mu?"], ["Söz tutma tahmini", "Tahmin edilen ödeme tarihi ile gerçekleşen arasındaki fark"]];
  s.addTable(rows.map((r, i) => r.map((c) => ({ text: c, options: { bold: i === 0, fontSize: 14, color: HEX.ink, fill: { color: i === 0 ? HEX.lime : "FFFFFF" }, margin: [6, 10, 6, 10], valign: "middle" } }))), { x: M, y: 1.75, w: W - 2 * M, colW: [3.6, W - 2 * M - 3.6], rowH: 0.62, border: { type: "solid", color: HEX.line, pt: 1 } });
  note(s, "Bugün demo sentetik veriyle çalışıyor; gerçek doğruluk henüz ölçülmedi.");
}

// Y4–Y5 · Rakip detayları
for (const [f, t] of [["5a-rekabet-turkiye.png", "Türkiye'deki araçlar"], ["5b-rekabet-yurtdisi.png", "Yurt dışındaki araçlar"]]) {
  const s = pres.addSlide({ masterName: "ICERIK", sectionTitle: Y });
  img(s, f, 0, 0, W, 7.5, "Rekabet ayrıntısı: " + t);
}

// Y5b · Segmentler
{
  const s = pres.addSlide({ masterName: "ICERIK", sectionTitle: Y });
  eyebrow(s, "Yedek · segmentler");
  title(s, "Her segment QualiFi'yi kendi düzenine göre kullanır");
  img(s, "14-segmentler.png", 0.95, 1.9, 11.43, 2.74, "Segmentler ve paketler");
}

// Y5c · Uygulamanın yapısı
{
  const s = pres.addSlide({ masterName: "ICERIK", sectionTitle: Y });
  eyebrow(s, "Yedek · uygulamanın yapısı");
  title(s, "Tek uygulama, tek kapı: paketler ekranla değil kapasiteyle ayrışır");
  const k = 4.45 / 1902;
  const cw = 1140 * k, ch = 2082 * k, pad = 90 * k;
  [["telefon_nh.png", "Bugün: karar özeti ve alt sekmeler"], ["telefon_na.png", "Ekle menüsü"], ["telefon_nm.png", "Daha fazla menüsü"]].forEach(([f, alt], i) => {
    s.addImage({ path: A(f), x: 0.55 + i * 2.55 - pad, y: 1.6 - pad, w: cw, h: ch, altText: alt, objectName: alt });
  });
  const rows = [
    ["Telefon", "5 sekme: Bugün · Nakit · Ekle · Müşteriler · Daha fazla. Ortadaki Ekle her ekranda aynı yerde."],
    ["Ekle", "Ödeme sözü · fotoğraf · dosya · müşteri mesajı. Sıra hiç değişmez; en sık iş en üstte."],
    ["Paketler", "Başlangıç, KOBİ ve Büyüme aynı ekranları kullanır; bağlantı, numara ve kullanıcı sayısı değişir."],
    ["Roller", "Büyüme'de patron her şeyi, muhasebeci kontrol bekleyenleri, satışçı kendi müşterilerini görür."],
    ["Banka", "Ayrı ürün: öncelik listesi, izinli karne, sektör analizi, teklif. Ham veri yok."],
  ];
  rows.forEach(([h, t], i) => {
    const y = 1.62 + i * 0.98;
    card(s, 8.35, y, 4.38, 0.88, i === 1 ? HEX.ink : "FFFFFF", i === 1 ? HEX.ink : HEX.line);
    s.addText([{ text: h + "  ", options: { bold: true, fontSize: 13, color: i === 1 ? HEX.lime : HEX.green } }, { text: t, options: { fontSize: 11.5, color: i === 1 ? "E3EEDB" : HEX.ink2 } }], { x: 8.55, y: y + 0.08, w: 4.0, h: 0.72, margin: 0, valign: "middle", isTextBox: true });
  });
  s.addNotes("Dört paket için dört ayrı arayüz yapmadık. İşletme paketleri aynı uygulamayı kullanıyor, böylece işletme büyüdükçe hiçbir şeyi yeniden öğrenmiyor. Fark kapasitede: bağlantı, numara ve kullanıcı sayısı. Telefonda ortadaki Ekle düğmesi her ekranda aynı yerde; söz, fotoğraf, dosya ya da mesaj, hepsi tek kapıdan giriyor. Banka ise ayrı bir ürün, çünkü sorusu farklı: bugün hangi firmayı aramalıyım.");
}

// Y6 · Birim ekonomi
{
  const s = pres.addSlide({ masterName: "ICERIK", sectionTitle: Y });
  eyebrow(s, "Yedek · birim ekonomi");
  title(s, "₺390'lık pakette hesap başı maliyet ₺96, brüt marj %72");
  const rows = [["Paket", "Fiyat / ay", "Yapay zekâ", "WhatsApp mesajı", "Entegrasyon", "Barındırma", "Toplam maliyet", "Brüt marj"], ["Başlangıç", "Ücretsiz", "₺8", "–", "–", "₺3", "₺11", "Ücretlilerce taşınır"], ["KOBİ", "₺390", "₺50", "₺11", "₺25", "₺10", "₺96", "%72"], ["Büyüme", "₺3.990", "₺550", "₺135", "₺150", "₺60", "₺895", "%75"]];
  s.addTable(rows.map((r, i) => r.map((c) => ({ text: c, options: { bold: i === 0, fontSize: 13, color: HEX.ink, fill: { color: i === 0 ? HEX.lime : "FFFFFF" }, margin: [6, 8, 6, 8], valign: "middle" } }))), { x: M, y: 1.75, w: W - 2 * M, rowH: 0.6, border: { type: "solid", color: HEX.line, pt: 1 } });
  const k = [["%67", "karma brüt marj", "ücretsiz hesaplar ve %3 ödeme komisyonu dahil"], ["₺3.040", "karma edinme maliyeti", "KOBİ ₺2.000 · Büyüme ₺15.000"], ["5,0×", "LTV / CAC", "aylık %3 kayıpla"], ["6,7 ay", "edinme maliyetinin geri dönüşü", ""]];
  k.forEach(([v, h, t], i) => {
    const x = M + i * 3.08;
    card(s, x, 4.45, 2.9, 1.75, "FFFFFF");
    s.addText([{ text: v, options: { fontSize: 26, bold: true, color: HEX.green, breakLine: true } }, { text: h, options: { fontSize: 13.5, bold: true, color: HEX.ink, breakLine: true } }, { text: t, options: { fontSize: 11, color: HEX.muted } }], { x: x + 0.22, y: 4.55, w: 2.5, h: 1.55, margin: 0, valign: "top", paraSpaceAfter: 2, isTextBox: true });
  });
  note(s, "Varsayım: 1 USD ≈ ₺45. WhatsApp hizmet mesajı Türkiye'de ~$0,005–0,006 (Meta fiyatları üç ayda bir değişir). Fiyatlar KDV hariç.");
}

// Y7 · İlk 1.000 işletme
{
  const s = pres.addSlide({ masterName: "ICERIK", sectionTitle: Y });
  eyebrow(s, "Yedek · müşteri edinimi");
  title(s, "İlk 1.000 işletmeye dört kanaldan ulaşmayı planlıyoruz");
  const ch = [["Ücretsiz paket", "Serbest çalışanlar ve şahıs şirketleri dener; ölçeği büyüyen KOBİ paketine geçer."], ["Banka pilotu", "Pilot bankanın KOBİ müşterilerine izinli erişim; en düşük edinme maliyeti."], ["Mali müşavirler", "Bir müşavir onlarca işletmeye dokunur; ortaklık ve yönlendirme."], ["Sektör ve sahada satış", "Vadeli satışın yoğun olduğu sektörlerde fuar, dernek ve birebir ziyaret."]];
  ch.forEach(([h, t], i) => {
    const col = i % 2, row = Math.floor(i / 2);
    const x = M + col * 6.15, y = 1.75 + row * 2.0;
    card(s, x, y, 5.95, 1.8, "FFFFFF");
    s.addText([{ text: h, options: { fontSize: 18, bold: true, color: HEX.ink, breakLine: true } }, { text: t, options: { fontSize: 14, color: HEX.ink2 } }], { x: x + 0.3, y: y + 0.2, w: 5.35, h: 1.45, margin: 0, valign: "top", paraSpaceAfter: 6, isTextBox: true });
  });
  note(s, "Plan, ölçülmüş sonuç değil. Modelde ilk ay 30 yeni ücretli işletme, ilk 12 ay aylık %15 büyüme varsayılıyor: 12. ayda ~780, 14. ayda 1.000.");
}

// Y8 · Finans modeli varsayımları
{
  const s = pres.addSlide({ masterName: "ICERIK", sectionTitle: Y });
  eyebrow(s, "Yedek · finans modeli");
  title(s, "₺12,75 milyon şu varsayımlardan çıkıyor");
  const rows = [["Varsayım", "Değer"], ["Fiyatlar (KDV hariç)", "KOBİ ₺390 · Büyüme ₺3.990 · yıllık %25 artış"], ["Büyüme", "1. ay 30 yeni ücretli işletme · ilk 12 ay aylık %15, sonra %5"], ["Paket karışımı ve kayıp", "Yeni işletmelerin %8'i Büyüme · aylık %3 kayıp"], ["Ekip (işveren maliyeti)", "Kurucu ₺60 bin · 2 mühendis ₺125–160 bin · satış ₺95 bin · 4 kişi"], ["Maliyet artışı", "Aylık %2 (maaş, kira, reklam) · %10 beklenmedik gider payı"], ["Banka lisansı", "Aylık ₺150 bin, ilk banka 13. ayda (varsayım)"], ["Pist ve güvenlik payı", "12 ay · en derin nakit ihtiyacının %20 fazlası"], ["36 ayda toplam dış sermaye", "₺29,5 milyon; kalanı bir sonraki turla"]];
  s.addTable(rows.map((r, i) => r.map((c, j) => ({ text: c, options: { bold: i === 0 || j === 0, fontSize: 13.5, color: HEX.ink, fill: { color: i === 0 ? HEX.lime : "FFFFFF" }, margin: [5, 10, 5, 10], valign: "middle" } }))), { x: M, y: 1.65, w: W - 2 * M, colW: [3.6, W - 2 * M - 3.6], rowH: 0.52, border: { type: "solid", color: HEX.line, pt: 1 } });
  note(s, "Model qualifilab.com/admin/finans sayfasında; her varsayım değiştirilebilir.");
}

// Y9 · Ürün doğrulama
{
  const s = pres.addSlide({ masterName: "ICERIK", sectionTitle: Y });
  eyebrow(s, "Yedek · doğrulama");
  title(s, "Neyi doğruladık, neyi henüz doğrulamadık");
  const done = ["Ürün canlıda: site, şifresiz demo ve kendi belgeleriyle çalışan hesap", "WhatsApp Business API üzerinden gerçek mesaj alınıp yapay zekâyla okundu (kendi testimiz)", "14 işletme sahibi ve 7 bankacı (4 şubede yüz yüze, 3 çevrimiçi; KOBİ ve veri ekipleri): üç hipotez doğrulandı", "Özyeğin Girişimcilik Merkezi müdürüyle görüşme; Özyeğin'de girişimcilere ilk sunum ve demo denemesi", "Görüşmelerden gelen üç öğrenim ürüne yansıtıldı"];
  const notyet = ["Tahmin doğruluğu gerçek veriyle", "Ödeme isteği (390 lira) ve dönüşüm oranı", "Bankanın erken uyarıdan sağladığı ölçülmüş fayda"];
  card(s, M, 1.75, 6.0, 4.7, "FFFFFF");
  s.addText([{ text: "Doğrulandı", options: { fontSize: 18, bold: true, color: HEX.green, breakLine: true } }, ...done.map((t, j) => ({ text: t, options: { bullet: true, fontSize: 14, color: HEX.ink2, breakLine: j < done.length - 1 } }))], { x: M + 0.3, y: 1.95, w: 5.4, h: 4.3, margin: 0, valign: "top", paraSpaceAfter: 9, isTextBox: true });
  card(s, 6.73, 1.75, 6.0, 4.7, HEX.soft, HEX.line);
  s.addText([{ text: "Pilotta ölçülecek", options: { fontSize: 18, bold: true, color: "8A4A12", breakLine: true } }, ...notyet.map((t, j) => ({ text: t, options: { bullet: true, fontSize: 14, color: HEX.ink2, breakLine: j < notyet.length - 1 } }))], { x: 7.03, y: 1.95, w: 5.4, h: 4.3, margin: 0, valign: "top", paraSpaceAfter: 9, isTextBox: true });
  s.addNotes("Görüşme sayılarını ve kullanıcıların ürünü denerken söylediklerini burada sözlü anlat.");
}

(async () => {
  const out = path.join(__dirname, "QualiFi-final-sunum.pptx");
  await pres.writeFile({ fileName: out });
  await applyTheme(out, THEME);
  console.log("written", out);
})();
