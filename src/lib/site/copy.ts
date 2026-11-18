// All landing-page copy, TR and EN, in one place (docs/design-system.md: copy rules).
// Turkish is written natively, not translated. Fixed terms: söz/promise, nakit tahmini/cash
// forecast, hatırlatma/reminder, ödeme karnesi/payment scorecard.

export type SiteLang = "tr" | "en";
export type Audience = "business" | "freelancer" | "finance" | "bank";
export const AUDIENCES: Audience[] = ["business", "freelancer", "finance", "bank"];

/** URL of each audience page, per language (old URLs keep working). */
export const AUDIENCE_PATH: Record<SiteLang, Record<Audience, string>> = {
  tr: { business: "/isletmeler", freelancer: "/freelancerlar", finance: "/finans-ekipleri", bank: "/bankalar" },
  en: { business: "/en/business", freelancer: "/en/freelancers", finance: "/en/finance-teams", bank: "/en/banks" },
};
export const HOME_PATH: Record<SiteLang, string> = { tr: "/", en: "/en" };

export function audienceFromPath(path: string): { lang: SiteLang; audience: Audience } {
  for (const lang of ["tr", "en"] as const) {
    for (const a of AUDIENCES) if (AUDIENCE_PATH[lang][a] === path) return { lang, audience: a };
  }
  return { lang: path.startsWith("/en") ? "en" : "tr", audience: "business" };
}

interface HeroCopy {
  tab: string;
  title: string;
  sub: string;
  primary: { label: string; href: string };
  secondary: { label: string; href: string };
}

export interface SiteCopy {
  meta: { title: string; description: string };
  nav: { product: string; how: string; banks: string; faq: string; demo: string; signIn: string; signUp: string; menu: string; close: string };
  audienceLabel: string;
  hero: Record<Audience, HeroCopy>;
  visual: {
    whatsapp: string;
    message: string;
    read: string;
    moved: string;
    forecast: string;
    warnTitle: string;
    calmTitle: string;
    axis: string[];
    ghost: string;
    calmText: string;
    warnAdvice: string;
    milestones: string[];
    milestoneLate: string;
    reminder: string;
    aging: string[];
    agingTitle: string;
    promisesWeek: string;
    score: string;
    riskHigh: string;
    factors: string[];
    product: string;
    masked: string;
  };
  sources: { title: string; sub: string; items: string[]; agent: string; outputs: string[] };
  before: { title: string; sub: string; oldLabel: string; oldSteps: string[]; newLabel: string; newSteps: string[]; time: [string, string] };
  how: { title: string; steps: Array<{ title: string; text: string }> };
  bento: { title: string; tiles: Array<{ title: string; text: string }> };
  banks: { title: string; sub: string; points: Array<{ title: string; text: string }>; cta: string };
  trust: { title: string; items: Array<{ title: string; text: string }> };
  faq: { title: string; items: Array<{ q: string; a: string }> };
  final: { title: string; sub: string };
  footer: { tagline: string; disclaimer: string; links: Array<{ label: string; href: string }> };
}

const TR: SiteCopy = {
  meta: {
    title: "QualiFi | Müşteriniz ne zaman öder, önceden bilin",
    description: "QualiFi ERP, muhasebe, banka ve WhatsApp'ı okur; ödeme sözlerini nakit tahminine işler ve sıkışmadan önce uyarır.",
  },
  nav: { product: "Ürün", how: "Nasıl çalışır", banks: "Bankalar", faq: "SSS", demo: "Canlı demo", signIn: "Giriş", signUp: "Ücretsiz hesap aç", menu: "Menü", close: "Kapat" },
  audienceLabel: "Kimin için",
  hero: {
    business: {
      tab: "İşletmeler",
      title: "Müşteriniz ne zaman öder, önceden bilin.",
      sub: "QualiFi ERP, muhasebe, banka ve WhatsApp'ı okur; ödeme sözlerini tahmine işler, nakit sıkışmadan haftalar önce uyarır.",
      primary: { label: "Canlı demoyu dene", href: "/demo/isletme?t=017&d=2026-11-24" },
      secondary: { label: "Ücretsiz hesap aç", href: "/app/kayit" },
    },
    freelancer: {
      tab: "Serbest çalışanlar",
      title: "Proje ödemeleriniz takvimde, sürprizsiz.",
      sub: "Sözleşmedeki hakedişleri çıkarır, geciken ödemeyi hatırlatır, önümüzdeki ayların gelirini gösterir.",
      primary: { label: "Canlı demoyu dene", href: "/demo/isletme?t=017&d=2026-11-24" },
      secondary: { label: "Ücretsiz hesap aç", href: "/app/kayit" },
    },
    finance: {
      tab: "Finans ekipleri",
      title: "Alacak takibi kendi kendine güncellensin.",
      sub: "Yaşlandırma, ödeme sözleri ve 8 haftalık nakit tahmini; ekip Excel'le değil istisnalarla uğraşsın.",
      primary: { label: "Canlı demoyu dene", href: "/demo/isletme?t=017&d=2026-11-24" },
      secondary: { label: "Ücretsiz hesap aç", href: "/app/kayit" },
    },
    bank: {
      tab: "Bankalar",
      title: "KOBİ riskini telefon çalmadan görün.",
      sub: "İşletmelerin izinle paylaştığı ödeme karnesi, maskeli veriyle erken uyarı ve doğru zamanda doğru ürün önerisi.",
      primary: { label: "Bankacı demosunu dene", href: "/demo/banka?b=01&d=2026-11-24" },
      secondary: { label: "Kurumsal pilot talep et", href: "/bankalar#pilot" },
    },
  },
  visual: {
    whatsapp: "WhatsApp · Seltemta Gıda",
    message: "Ödemeyi 2 hafta sonra yapabileceğiz, kusura bakmayın.",
    read: "Ajan okudu: 14 gün erteleme",
    moved: "₺232.500 → 16 Oca",
    forecast: "8 haftalık nakit tahmini",
    warnTitle: "30 Ara haftasında nakit sıkışıyor",
    calmTitle: "Nakit önümüzdeki 8 hafta yeterli",
    axis: ["25 Kas", "9 Ara", "23 Ara", "6 Oca", "20 Oca"],
    ghost: "2 Oca",
    calmText: "Ajan yeni mesajları ve tahsilatları izliyor.",
    warnAdvice: "Önce vadesi gelmiş iki müşteriyi arayın: ₺170 bin.",
    milestones: ["Tasarım teslimi", "Geliştirme hakedişi", "Yayın ve bakım"],
    milestoneLate: "5 gün gecikti",
    reminder: "Hatırlatma taslağı hazır",
    aging: ["Vadesi gelmemiş", "1–30 gün", "31–60 gün", "60+ gün"],
    agingTitle: "Alacak yaşlandırma",
    promisesWeek: "Bu hafta 12 ödeme sözü",
    score: "Risk skoru",
    riskHigh: "Yüksek",
    factors: ["Tahsil süresi 3 ayda 12 gün uzadı", "2 taahhüt tutulmadı", "WhatsApp'ta nakit sıkışıklığı"],
    product: "Önerilecek ürün: Faktoring",
    masked: "Yapay zekâ yalnız maskeli veri görür",
  },
  sources: {
    title: "Veriniz zaten var. QualiFi hepsini okur.",
    sub: "Ön muhasebe ne kadar alacağınızı bilir; ne zaman geleceğini sohbetler bilir. İkisi ilk kez aynı yerde.",
    items: ["ERP", "Ön muhasebe", "Banka", "WhatsApp Business", "Gmail", "Sözleşme ve fatura"],
    agent: "QualiFi ajanı",
    outputs: ["Güncel ödeme tarihleri", "8 haftalık nakit tahmini", "Onaylı hatırlatmalar"],
  },
  before: {
    title: "Tek bir mesaj, dört ayrı güncelleme demekti.",
    sub: "“Cuma öderiz” dendiğinde tahmini güncellemek bugün yarım saat sürüyor. QualiFi'de saniyeler.",
    oldLabel: "Bugün",
    oldSteps: ["Telefonda söz alınır", "Muhasebeciye iletilir", "ERP'de vade düzeltilir", "Excel tahmini elle güncellenir"],
    newLabel: "QualiFi ile",
    newSteps: ["Mesaj gelir", "Tarih kendiliğinden kayar, tahmin yeniden çizilir"],
    time: ["Yaklaşık 30 dakika, çoğu zaman unutulur", "Yaklaşık 3 saniye, her seferinde"],
  },
  how: {
    title: "Dört adımda nakit görünürlüğü.",
    steps: [
      { title: "Bağlayın", text: "ERP, ön muhasebe, banka ve WhatsApp Business. Ya da belgelerinizi yükleyin." },
      { title: "Okur ve günceller", text: "Sözleri ve gecikmeleri yakalar, beklenen ödeme tarihini kendisi kaydırır." },
      { title: "Tahmin ve öneri", text: "Her müşterinin ödeme alışkanlığını öğrenir; sıkışmayı haftalar önce, ne yapacağınızla birlikte söyler." },
      { title: "Bankanızla paylaşın", text: "İsterseniz ödeme karnenizi bankanıza gönderin; teklifleri yan yana görün." },
    ],
  },
  bento: {
    title: "Tahsilattan bankaya, tek ekran.",
    tiles: [
      { title: "Sohbetten otomatik tarih", text: "“2 hafta sonra” yazıldığı an fatura tarihi kayar." },
      { title: "Onaylı hatırlatmalar", text: "Taslağı ajan yazar, siz onaylamadan gitmez." },
      { title: "8 haftalık canlı tahmin", text: "Her söz ve gecikmeyle yeniden çizilir." },
      { title: "Müşteri ödeme karnesi", text: "Kim dakik, kim sözünü tutmuyor; A'dan D'ye." },
      { title: "Sıkışma uyarısı ve öneri", text: "Hangi hafta, ne kadar, kimi önce aramalı." },
      { title: "Bankalarla paylaşım", text: "Karnenizi izinle paylaşın, teklifleri karşılaştırın." },
    ],
  },
  banks: {
    title: "Bankalar için: aynı veri, doğru zamanda.",
    sub: "Müşteri ilişkileri yöneticisi, KOBİ'nin nakit hikâyesini işletmenin izniyle ve maskeli veriyle görür.",
    points: [
      { title: "Erken uyarı", text: "Firmanın kendi müşterilerinden tahsil süresi uzadığında, takip başlamadan haber verir." },
      { title: "Proaktif ürün önerisi", text: "Faktoring, çek iskontosu ya da ödeme planı; gerekçesiyle, doğru zamanda." },
      { title: "Maskeli yapay zekâ", text: "Unvan ve kimlik bilgileri bankada kalır; model yalnız maskeli özeti görür." },
    ],
    cta: "Bankacı demosunu dene",
  },
  trust: {
    title: "Kontrol sizde.",
    items: [
      { title: "Onayınız olmadan hiçbir şey gitmez", text: "Hatırlatmalar taslak olarak gelir; gönderme kararı sizin." },
      { title: "Veriniz sizin", text: "Belgeler yalnız hesabınızda tutulur; istediğiniz an silersiniz." },
      { title: "Bankaya yalnız özet", text: "Paylaşım izninizle olur, geri çekebilirsiniz; müşteri adları gitmez." },
    ],
  },
  faq: {
    title: "Sık sorulanlar",
    items: [
      { q: "Hesap açmak için belge gerekiyor mu?", a: "Hayır. Ücretsiz hesap açın; belgeleri dilediğiniz zaman yükleyin ya da önce demoyu deneyin." },
      { q: "Hangi sistemlerle çalışıyor?", a: "ERP, ön muhasebe, banka hesapları, WhatsApp Business ve Gmail için bağlantılar pilot sürecinde kuruluyor. Bugün belge, Excel ve sohbet dışa aktarımıyla başlayabilirsiniz." },
      { q: "Müşterilerime kendiliğinden mesaj atar mı?", a: "Hayır. Ajan taslak hazırlar, siz onaylarsınız." },
      { q: "Tahminler ne kadar doğru?", a: "Demo örnek veriyle çalışır. Gerçek doğruluk, pilotta sizin ödeme geçmişinizle ölçülür ve size açıkça gösterilir." },
      { q: "Bankam verilerimi görür mü?", a: "Yalnız siz paylaşırsanız ve yalnız özet karneyi. Paylaşımı istediğiniz an geri çekebilirsiniz." },
    ],
  },
  final: { title: "Paranızın ne zaman geleceğini bilin.", sub: "Demoyu bir dakikada deneyin; hazır olduğunuzda kendi verinizle başlayın." },
  footer: {
    tagline: "İşinizi siz büyütün, finansal takibi biz halledelim.",
    disclaimer: "Demo örnek veri kullanır. Şirketler, sohbetler ve bankalar gerçek değildir.",
    links: [
      { label: "Canlı demo", href: "/demo" },
      { label: "Ücretsiz hesap aç", href: "/app/kayit" },
      { label: "Giriş", href: "/app/giris" },
      { label: "Bankalar için pilot", href: "/bankalar#pilot" },
    ],
  },
};

const EN: SiteCopy = {
  meta: {
    title: "QualiFi | Know when customers will actually pay",
    description: "QualiFi reads your ERP, accounting, bank and WhatsApp, turns payment promises into your cash forecast and warns you before cash gets tight.",
  },
  nav: { product: "Product", how: "How it works", banks: "Banks", faq: "FAQ", demo: "Live demo", signIn: "Sign in", signUp: "Open a free account", menu: "Menu", close: "Close" },
  audienceLabel: "Built for",
  hero: {
    business: {
      tab: "Businesses",
      title: "Know when customers will actually pay.",
      sub: "QualiFi reads your ERP, accounting, bank and WhatsApp, turns payment promises into your forecast and warns you weeks before cash gets tight.",
      primary: { label: "Try the live demo", href: "/demo/isletme?t=017&d=2026-11-24&l=en" },
      secondary: { label: "Open a free account", href: "/app/kayit" },
    },
    freelancer: {
      tab: "Freelancers",
      title: "Your project payments, on schedule.",
      sub: "QualiFi reads milestones from your contracts, reminds late payers and shows the income of the months ahead.",
      primary: { label: "Try the live demo", href: "/demo/isletme?t=017&d=2026-11-24&l=en" },
      secondary: { label: "Open a free account", href: "/app/kayit" },
    },
    finance: {
      tab: "Finance teams",
      title: "Receivables that update themselves.",
      sub: "Aging, payment promises and an 8-week cash forecast, so your team handles exceptions, not spreadsheets.",
      primary: { label: "Try the live demo", href: "/demo/isletme?t=017&d=2026-11-24&l=en" },
      secondary: { label: "Open a free account", href: "/app/kayit" },
    },
    bank: {
      tab: "Banks",
      title: "See SME risk before the phone rings.",
      sub: "Scorecards businesses share with consent, early warnings on masked data and the right product at the right time.",
      primary: { label: "Try the banker demo", href: "/demo/banka?b=01&d=2026-11-24&l=en" },
      secondary: { label: "Request a corporate pilot", href: "/en/banks#pilot" },
    },
  },
  visual: {
    whatsapp: "WhatsApp · Seltemta Gıda",
    message: "We'll be able to pay in 2 weeks, sorry about that.",
    read: "Agent read: 14-day delay",
    moved: "₺232,500 → 16 Jan",
    forecast: "8-week cash forecast",
    warnTitle: "Cash gets tight in the week of 30 Dec",
    calmTitle: "Cash is sufficient for the next 8 weeks",
    axis: ["25 Nov", "9 Dec", "23 Dec", "6 Jan", "20 Jan"],
    ghost: "2 Jan",
    calmText: "The agent is watching new messages and payments.",
    warnAdvice: "Call two customers who are already due first: ₺170K.",
    milestones: ["Design delivery", "Development milestone", "Launch and support"],
    milestoneLate: "5 days late",
    reminder: "Reminder draft ready",
    aging: ["Not yet due", "1–30 days", "31–60 days", "60+ days"],
    agingTitle: "Receivables aging",
    promisesWeek: "12 payment promises this week",
    score: "Risk score",
    riskHigh: "High",
    factors: ["Collection time up 12 days in 3 months", "2 commitments broken", "Cash-stress signals on WhatsApp"],
    product: "Product to offer: Factoring",
    masked: "The AI only sees masked data",
  },
  sources: {
    title: "Your data already exists. QualiFi reads all of it.",
    sub: "Accounting knows how much you are owed; chats know when it will arrive. For the first time, both in one place.",
    items: ["ERP", "Accounting", "Bank", "WhatsApp Business", "Gmail", "Contracts and invoices"],
    agent: "QualiFi agent",
    outputs: ["Up-to-date payment dates", "8-week cash forecast", "Approved reminders"],
  },
  before: {
    title: "One message used to mean four manual updates.",
    sub: "When a customer says “we'll pay Friday”, updating the forecast takes half an hour today. With QualiFi, seconds.",
    oldLabel: "Today",
    oldSteps: ["Promise taken on the phone", "Passed on to the accountant", "Due date fixed in the ERP", "Excel forecast updated by hand"],
    newLabel: "With QualiFi",
    newSteps: ["The message arrives", "The date moves and the forecast redraws itself"],
    time: ["About 30 minutes, often forgotten", "About 3 seconds, every time"],
  },
  how: {
    title: "Cash visibility in four steps.",
    steps: [
      { title: "Connect", text: "ERP, accounting, bank and WhatsApp Business. Or just upload documents." },
      { title: "It reads and updates", text: "It catches promises and delays and moves the expected payment date itself." },
      { title: "Forecast and advice", text: "It learns how each customer pays and tells you about a cash gap weeks ahead, with what to do." },
      { title: "Share with your bank", text: "If you want, send your payment scorecard to your bank and compare offers side by side." },
    ],
  },
  bento: {
    title: "From collections to your bank, one screen.",
    tiles: [
      { title: "Dates from chats", text: "The moment someone writes “in 2 weeks”, the invoice date moves." },
      { title: "Approved reminders", text: "The agent drafts; nothing goes out without your approval." },
      { title: "Live 8-week forecast", text: "Redrawn with every promise and delay." },
      { title: "Customer payment scorecard", text: "Who pays on time and who breaks promises, A to D." },
      { title: "Cash gap warnings", text: "Which week, how much, and whom to call first." },
      { title: "Share with banks", text: "Share your scorecard with consent and compare offers." },
    ],
  },
  banks: {
    title: "For banks: the same data, at the right time.",
    sub: "Relationship managers see an SME's cash story with the business's consent and on masked data.",
    points: [
      { title: "Early warning", text: "When a firm's own customers start paying slower, you know before collections begin." },
      { title: "Proactive product ideas", text: "Factoring, cheque discounting or a payment plan, with the reason, at the right time." },
      { title: "Masked AI", text: "Names and IDs stay inside the bank; the model only sees a masked summary." },
    ],
    cta: "Try the banker demo",
  },
  trust: {
    title: "You stay in control.",
    items: [
      { title: "Nothing is sent without your approval", text: "Reminders arrive as drafts; sending is your call." },
      { title: "Your data is yours", text: "Documents stay in your account; delete them at any time." },
      { title: "Banks only see a summary", text: "Sharing needs your consent and can be withdrawn; customer names never leave." },
    ],
  },
  faq: {
    title: "Questions",
    items: [
      { q: "Do I need documents to open an account?", a: "No. Open a free account and upload documents whenever you like, or try the demo first." },
      { q: "Which systems does it work with?", a: "Connections for ERP, accounting, bank accounts, WhatsApp Business and Gmail are being set up in the pilot. Today you can start with documents, spreadsheets and chat exports." },
      { q: "Will it message my customers on its own?", a: "No. The agent drafts, you approve." },
      { q: "How accurate are the forecasts?", a: "The demo runs on sample data. Real accuracy is measured in the pilot on your own payment history and shown to you openly." },
      { q: "Will my bank see my data?", a: "Only if you share, and only the summary scorecard. You can withdraw it at any time." },
    ],
  },
  final: { title: "Know when your money arrives.", sub: "Try the demo in a minute; start with your own data when you're ready." },
  footer: {
    tagline: "You grow the business. We handle the financial follow-up.",
    disclaimer: "The demo uses sample data. Companies, chats and banks are not real.",
    links: [
      { label: "Live demo", href: "/demo?l=en" },
      { label: "Open a free account", href: "/app/kayit" },
      { label: "Sign in", href: "/app/giris" },
      { label: "Bank pilot", href: "/en/banks#pilot" },
    ],
  },
};

export const COPY: Record<SiteLang, SiteCopy> = { tr: TR, en: EN };
