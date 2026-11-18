// Bank audience: its own page body (reviewer feedback, 18 Nov: /bankalar must not reuse the SME page).
import type { SiteCopy, SiteLang } from "./copy";

export type BankPageCopy = Pick<SiteCopy, "sources" | "before" | "how" | "bento" | "trust" | "faq" | "final"> & {
  pilot: {
    id: string;
    title: string;
    sub: string;
    email: string;
    company: string;
    consent: string;
    submit: string;
    sending: string;
    done: string;
    doneSub: string;
    error: string;
    points: string[];
  };
};

const TR: BankPageCopy = {
  sources: {
    title: "Kredi verisi dünü gösterir. Nakit hikâyesi bugünü.",
    sub: "İşletme izin verdiğinde QualiFi, firmanın kendi tahsilatını ve müşteri sözlerini bankanın verisiyle birleştirir.",
    items: ["Bankanın kredi verisi", "İşletmenin paylaştığı karne", "Açık bankacılık (izinli)", "Taahhüt kayıtları", "İzinli sohbet sinyalleri", "Sektör verisi"],
    agent: "QualiFi bankacı asistanı",
    outputs: ["Erken uyarı listesi", "Önerilecek ürün", "Maskeli özet"],
  },
  before: {
    title: "Risk bugün, takibe düşünce fark ediliyor.",
    sub: "Firmanın kendi müşterileri geç ödemeye başladığında sinyal haftalar önce vardır, ama görünmez.",
    oldLabel: "Bugün",
    oldSteps: ["Taksit gecikir", "Müşteri temsilcisi arar", "Güncel mali tablo istenir", "Yapılandırma konuşulur"],
    newLabel: "QualiFi ile",
    newSteps: ["Tahsil süresi uzar, uyarı gelir", "Taksit gecikmeden doğru ürün önerilir"],
    time: ["Haftalar sonra, sorun büyümüşken", "Gecikmeden önce, gerekçesiyle"],
  },
  how: {
    title: "Müşteri ilişkileri yöneticisi için dört adım.",
    steps: [
      { title: "Portföyü bağlayın", text: "Kendi kredi verinizle başlayın; işletmeler karnelerini izinle ekler." },
      { title: "Maskeli veriyle analiz", text: "Unvan ve kimlik bilgileri bankada kalır; model yalnız maskeli özeti görür." },
      { title: "Sabah arama listesi", text: "Riski en çok artan firmalar, gerekçeleri ve önerilecek ürünle hazır." },
      { title: "Teklifinizi gönderin", text: "Karnesini paylaşan işletmeye teklifinizi tek tıkla iletin." },
    ],
  },
  bento: {
    title: "Portföy izleme, doğru zamanda doğru ürün.",
    tiles: [
      { title: "Erken uyarı", text: "Firmanın müşterilerinden tahsil süresi uzarken haber verir." },
      { title: "Açıklanabilir risk skoru", text: "0–100, yüksek = riskli. Her puanın gerekçesi görünür." },
      { title: "Proaktif ürün önerisi", text: "Faktoring, çek iskontosu ya da ödeme planı, gerekçesiyle." },
      { title: "Maskeli yapay zekâ", text: "Unvan, vergi no ve kişi adları modele gitmez." },
      { title: "Taahhüt takibi", text: "Yapılandırma taksitleri ve ödeme sözleri tek listede." },
      { title: "Paylaşılan karne ve teklif", text: "İşletme karnesini getirir, siz teklifinizi gönderirsiniz." },
    ],
  },
  trust: {
    title: "Mevzuata uygun çalışacak şekilde tasarlandı.",
    items: [
      { title: "Veri bankada kalır", text: "Analiz maskeli özet üzerinden yapılır; kimlik bilgileri modele gitmez." },
      { title: "İzin esaslı", text: "İşletme verisi yalnız işletmenin açık izniyle gelir ve geri çekilebilir." },
      { title: "Açıklanabilir", text: "Her skor ve öneri gerekçesiyle gösterilir; karar bankacınındır." },
    ],
  },
  faq: {
    title: "Bankaların sorduğu",
    items: [
      { q: "Müşteri verisi yapay zekâya gider mi?", a: "Kimlik bilgileri gitmez. Model yalnız maskeli özeti ve izinli sinyalleri görür; eşleştirme bankanın içinde kalır." },
      { q: "Banka, işletmenin WhatsApp yazışmalarını görür mü?", a: "Hayır. İşletme izin verirse yalnız sınıflandırılmış sinyaller (ör. erteleme talebi) ve toplamlar paylaşılır." },
      { q: "Hangi sistemlerle entegre olur?", a: "Pilotta bankanın kredi verisiyle ve açık bankacılık (ÖHVPS) üzerinden izinli hesap bilgisiyle başlıyoruz." },
      { q: "Pilot nasıl işler?", a: "Bir bölge birimi, maskeli bir portföy örneği ve 8 hafta. Erken uyarıların isabeti birlikte ölçülür." },
    ],
  },
  final: { title: "Pilotu birlikte kuralım.", sub: "Bir bölge birimiyle, maskeli veriyle, 8 haftada." },
  pilot: {
    id: "pilot",
    title: "Kurumsal pilot talebi",
    sub: "E-postanızı bırakın; 20 dakikalık bir görüşmede pilot kapsamını birlikte belirleyelim.",
    email: "Kurumsal e-posta",
    company: "Kurum (isteğe bağlı)",
    consent: "Talebimi değerlendirmek için e-posta adresimin saklanmasını kabul ediyorum.",
    submit: "Pilot talep et",
    sending: "Gönderiliyor…",
    done: "Talebiniz alındı.",
    doneSub: "En kısa sürede sizinle iletişime geçeceğiz.",
    error: "Talep şu an kaydedilemedi. Lütfen biraz sonra tekrar deneyin.",
    points: ["Bir bölge birimi", "Maskeli portföy örneği", "8 haftada ölçülebilir sonuç"],
  },
};

const EN: BankPageCopy = {
  sources: {
    title: "Credit data shows yesterday. Cash shows today.",
    sub: "With the business's consent, QualiFi combines the firm's own collections and customer promises with the bank's data.",
    items: ["The bank's credit data", "Scorecard shared by the business", "Open banking (with consent)", "Commitment records", "Consented chat signals", "Sector data"],
    agent: "QualiFi banker assistant",
    outputs: ["Early-warning list", "Product to offer", "Masked summary"],
  },
  before: {
    title: "Today, risk is noticed when the loan is already late.",
    sub: "When a firm's own customers start paying late, the signal exists weeks earlier, but nobody sees it.",
    oldLabel: "Today",
    oldSteps: ["An instalment is late", "The relationship manager calls", "Fresh financials are requested", "Restructuring is discussed"],
    newLabel: "With QualiFi",
    newSteps: ["Collection time grows, a warning arrives", "The right product is offered before anything is late"],
    time: ["Weeks later, when the problem is bigger", "Before the delay, with the reason"],
  },
  how: {
    title: "Four steps for relationship managers.",
    steps: [
      { title: "Connect the portfolio", text: "Start with your own credit data; businesses add their scorecards with consent." },
      { title: "Analyse masked data", text: "Names and IDs stay inside the bank; the model only sees a masked summary." },
      { title: "Morning call list", text: "Firms whose risk rose most, with reasons and a product to offer." },
      { title: "Send your offer", text: "Send an offer to a business that shared its scorecard, in one click." },
    ],
  },
  bento: {
    title: "Portfolio monitoring, the right product at the right time.",
    tiles: [
      { title: "Early warning", text: "Flags when a firm's own customers start paying slower." },
      { title: "Explainable risk score", text: "0–100, higher = riskier. Every point shows its reason." },
      { title: "Proactive product ideas", text: "Factoring, cheque discounting or a payment plan, with the reason." },
      { title: "Masked AI", text: "Company names, tax IDs and personal names never reach the model." },
      { title: "Commitment tracking", text: "Restructuring instalments and payment promises in one list." },
      { title: "Shared scorecard and offers", text: "The business brings its scorecard; you send your offer." },
    ],
  },
  trust: {
    title: "Designed to work within regulation.",
    items: [
      { title: "Data stays in the bank", text: "Analysis runs on a masked summary; identifiers never reach the model." },
      { title: "Consent first", text: "Business data arrives only with the business's explicit consent and can be withdrawn." },
      { title: "Explainable", text: "Every score and suggestion shows its reason; the decision stays with the banker." },
    ],
  },
  faq: {
    title: "What banks ask",
    items: [
      { q: "Does client data go to the AI?", a: "Identifiers do not. The model only sees a masked summary and consented signals; matching stays inside the bank." },
      { q: "Does the bank see the business's WhatsApp messages?", a: "No. With consent, only classified signals (e.g. a deferral request) and totals are shared." },
      { q: "Which systems does it integrate with?", a: "The pilot starts with the bank's credit data and consented account information via open banking." },
      { q: "How does the pilot work?", a: "One regional unit, a masked portfolio sample and 8 weeks. We measure the hit rate of early warnings together." },
    ],
  },
  final: { title: "Let's set up the pilot together.", sub: "One regional unit, masked data, eight weeks." },
  pilot: {
    id: "pilot",
    title: "Corporate pilot request",
    sub: "Leave your email; in a 20-minute call we will scope the pilot together.",
    email: "Work email",
    company: "Organisation (optional)",
    consent: "I agree that my email is stored to process this request.",
    submit: "Request a pilot",
    sending: "Sending…",
    done: "Your request is saved.",
    doneSub: "We will get in touch shortly.",
    error: "The request could not be saved right now. Please try again in a moment.",
    points: ["One regional unit", "A masked portfolio sample", "Measurable results in 8 weeks"],
  },
};

export const BANK_COPY: Record<SiteLang, BankPageCopy> = { tr: TR, en: EN };
