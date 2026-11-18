// Serve-time edits to the pre-rendered marketing pages (qualifi-pages.ts is generated and
// left untouched). Every page gets the same navigation and footer links, so the site map
// is connected: home ⇄ demo ⇄ sign-up ⇄ sign-in ⇄ panel. Business and bank home pages get
// the new hero; the broken "upload your own contract" option and outdated promises go away.

const ARROW = '<svg class="icon " width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6"/></svg>';

const BUSINESS_HOME = new Set(["/", "/tr", "/isletmeler", "/en/business"]);
const BANK_HOME = new Set(["/bankalar", "/en/banks"]);

function isTurkish(html: string): boolean {
  return /<html lang="tr"/.test(html) || /data-locale="tr"/.test(html);
}

const TEXT_FIXES: ReadonlyArray<[string, string]> = [
  [
    "Hayır. Örnek sözleşme seçeneğiyle talep bırakabilirsiniz. Kendi belgenizi eklerseniz PDF veya TXT, en fazla 5 MB kabul edilir ve yalnızca talebinizi gönderdiğinizde kaydedilir.",
    "Hayır. Hesap açmak ve pilot talebi bırakmak için belge gerekmez. Hesabınızı açtıktan sonra dilediğinizde sözleşme, fatura görseli, Excel veya WhatsApp sohbeti yükleyebilirsiniz; belgeler yalnız sizin hesabınızda saklanır, okunması için yapay zekâ hizmeti kullanılır ve istediğiniz an silebilirsiniz.",
  ],
  [
    "No. You can request a pilot with a sample agreement. If you add your own, PDF or TXT files up to 5 MB are accepted and saved only when you submit your request.",
    "No. You need no document to open an account or request a pilot. After opening your account you can upload a contract, invoice image, spreadsheet or WhatsApp chat whenever you like; documents are stored only in your account, read with an AI service, and can be deleted at any time.",
  ],
  ["Kendi sözleşmenizi seçerseniz dosya yalnızca talebi gönderdiğinizde kaydedilir.", "Talep formu belge almaz."],
  ["Your own agreement is saved only when you submit the request.", "The request form does not accept documents."],
  [
    "Bu aşamada belgeniz bir AI modeline gönderilmez ve WhatsApp/e-posta hesabınıza bağlanılmaz.",
    "Talep formu belge almaz ve WhatsApp/e-posta hesabınıza bağlanmaz. Hesap açıp belge yüklerseniz belgeleriniz yalnız hesabınızda saklanır ve okunması için yapay zekâ hizmeti kullanılır.",
  ],
  [
    "At this stage your document is not sent to an AI model, and your email/WhatsApp accounts are not connected.",
    "The request form does not accept documents and does not connect your email/WhatsApp accounts. If you open an account and upload documents, they are stored only in your account and read with an AI service.",
  ],
  [
    "E-posta adresiniz, seçtiğiniz çözüm, sayfa/kampanya bağlamı ve varsa yüklediğiniz dosya talebinizi değerlendirmek için uygulama sunucusunda saklanır. Belgeleriniz bu aşamada AI modeline gönderilmez. Hesaplarınıza erişim alınmaz.",
    "E-posta adresiniz, seçtiğiniz çözüm ve sayfa/kampanya bağlamı talebinizi değerlendirmek için uygulama sunucusunda saklanır. Bu form belge almaz ve hesaplarınıza erişim istemez. Belgelerinizle çalışmak isterseniz ücretsiz hesap açabilirsiniz; orada yüklenen belgeler yapay zekâ hizmetiyle okunur ve istediğiniz an silinebilir.",
  ],
  [
    "Your email, chosen solution, page/campaign context and any uploaded file are stored on the application server to process your request. Documents are not sent to an AI model at this stage. No account access is requested.",
    "Your email, chosen solution and page/campaign context are stored on the application server to process your request. This form does not accept documents or request account access. To work with your own documents, open a free account; documents uploaded there are read with an AI service and can be deleted at any time.",
  ],
  [
    "Pilot kapsamını açıklayan kısa bir form açılır. İsterseniz sözleşmenizi seçebilir, isterseniz örnek senaryoyla ilgi bırakabilirsiniz. Dosyanız yalnızca formu gönderdiğinizde kaydedilir.",
    "Pilot kapsamını açıklayan kısa bir form açılır; örnek senaryoyla ilgi bırakırsınız. Kendi belgelerinizle denemek için ücretsiz hesap açabilirsiniz.",
  ],
  [
    "A short form explains the pilot. Choose your own agreement or express interest with a sample scenario. Your file is saved only when you submit the form.",
    "A short form explains the pilot; you express interest with a sample scenario. To try it with your own documents, open a free account.",
  ],
  [
    "PDF veya UTF-8 TXT, en fazla 5 MB. Belgenizi bir AI modeline göndermiyoruz; bu aşamada yalnızca pilot talebinizle birlikte saklıyoruz. Kendi belgenizi paylaşmak isteğe bağlı.",
    "Talep formu belge almaz. Belgelerinizle çalışmak için ücretsiz hesap açın; hesabınızda PDF, görsel, Excel veya WhatsApp sohbeti yükleyebilirsiniz.",
  ],
  [
    "PDF or UTF-8 TXT, up to 5 MB. We do not send your document to an AI model; at this stage it is stored with your pilot request. Sharing your own document is optional.",
    "The request form does not accept documents. To work with your own documents, open a free account and upload PDFs, images, spreadsheets or WhatsApp chats there.",
  ],
  ["Yalnızca talebinizi gönderdiğinizde kaydedilir.", "Belgelerinizi hesap açınca yükleyebilirsiniz."],
  ["Saved only when you submit your request.", "Upload documents after opening an account."],
];

function uploadOptionReplacement(tr: boolean): string {
  return tr
    ? '<a class="radio-card" href="/app/kayit"><span><strong>Kendi belgelerimle başla</strong><small>Ücretsiz hesap açın; belgelerinizi hesabınızda yükleyin.</small></span></a>'
    : '<a class="radio-card" href="/app/kayit"><span><strong>Start with my own documents</strong><small>Open a free account and upload them there.</small></span></a>';
}

function navActions(tr: boolean, bank: boolean, language: string): string {
  const login = `<a class="nav-login" href="/app/giris">${tr ? "Giriş" : "Sign in"}</a>`;
  const primary = bank
    ? `<a class="button outline small" href="/demo/banka">${tr ? "Bankacı demosu" : "Banker demo"} ${ARROW}</a>`
    : `<a class="button primary small" href="/app/kayit">${tr ? "Ücretsiz başla" : "Start free"} ${ARROW}</a>`;
  return `<div class="nav-actions">${language}${login}${primary}</div>`;
}

function footerLinks(tr: boolean): string {
  return tr
    ? '<nav class="footer-links" aria-label="Site haritası"><a href="/isletmeler">İşletmeler</a><a href="/bankalar">Bankalar</a><a href="/demo">Canlı demo</a><a href="/app/kayit">Ücretsiz hesap aç</a><a href="/app/giris">Giriş</a></nav>'
    : '<nav class="footer-links" aria-label="Site map"><a href="/en/business">Businesses</a><a href="/en/banks">Banks</a><a href="/demo">Live demo</a><a href="/app/kayit">Open a free account</a><a href="/app/giris">Sign in</a></nav>';
}

function businessHero(html: string, tr: boolean): string {
  const h1 = tr ? "İşinizi siz büyütün.<br><em>Finansal takibi biz halledelim.</em>" : "You grow the business.<br><em>We handle the financial follow-up.</em>";
  const lead = tr
    ? "Faturalarınızı, çeklerinizi ve WhatsApp'ta verilen ödeme sözlerini tek yerde izleyen bir finans ajanı. Kimin ne zaman ödeyeceğini öğrenir, vadeden önce hatırlatır ve önümüzdeki 8 haftanın nakit tablosunu çıkarır."
    : "A finance agent that tracks your invoices, cheques and the payment promises made on WhatsApp in one place. It learns who pays when, reminds before the due date and maps the next 8 weeks of cash.";
  const actions = tr
    ? `<div class="actions"><a class="button primary" href="/app/kayit">Ücretsiz hesap aç ${ARROW}</a></div><div class="hero-secondary"><a class="text-link" href="/demo/isletme">Canlı demoyu incele ${ARROW}</a><span>Kayıt için belge gerekmez · Demo verileri örnektir</span></div>`
    : `<div class="actions"><a class="button primary" href="/app/kayit">Open a free account ${ARROW}</a></div><div class="hero-secondary"><a class="text-link" href="/demo/isletme">Explore the live demo ${ARROW}</a><span>No document needed to sign up · Demo data is illustrative</span></div>`;
  const title = tr ? "QualiFi — İşinizi siz büyütün. Finansal takibi biz halledelim." : "QualiFi — You grow the business. We handle the financial follow-up.";
  return html
    .replace(/<title>[^<]*<\/title>/, `<title>${title}</title>`)
    .replace(/(<meta property="og:title" content=")[^"]*(")/, `$1${title}$2`)
    .replace(/(<section class="hero wrap">[\s\S]*?<h1>)[\s\S]*?(<\/h1>)/, `$1${h1}$2`)
    .replace(/(<section class="hero wrap">[\s\S]*?<p class="hero-description">)[\s\S]*?(<\/p>)/, `$1${lead}$2`)
    .replace(/(<section class="hero wrap">[\s\S]*?)<div class="actions">[\s\S]*?<\/span><\/div>/, `$1${actions}`);
}

function bankHero(html: string, tr: boolean): string {
  const actions = tr
    ? `<div class="actions"><a class="button primary" href="/demo/banka">Bankacı demosunu incele ${ARROW}</a></div><div class="hero-secondary"><button class="text-link" data-open="agent" data-position="hero">Kurumsal pilot talep et ${ARROW}</button><span>Demo verileri örnektir · Banka verisine erişim pilot sözleşmesiyle kurulur</span></div>`
    : `<div class="actions"><a class="button primary" href="/demo/banka">Explore the banker demo ${ARROW}</a></div><div class="hero-secondary"><button class="text-link" data-open="agent" data-position="hero">Request a corporate pilot ${ARROW}</button><span>Demo data is illustrative · Bank data access is set up under a pilot agreement</span></div>`;
  return html.replace(/(<section class="hero wrap">[\s\S]*?)<div class="actions">[\s\S]*?<\/span><\/div>/, `$1${actions}`);
}

export function enhancePage(route: string, html: string): string {
  const tr = isTurkish(html);
  let out = html;
  for (const [from, to] of TEXT_FIXES) out = out.split(from).join(to);

  // The pilot form's own-file option always failed: point it to sign-up instead.
  out = out.replace(/<label class="radio-card"><input type="radio" name="fileMode" value="upload"(?: checked)?>[\s\S]*?<\/label>/g, uploadOptionReplacement(tr));
  out = out.split('name="fileMode" value="sample">').join('name="fileMode" value="sample" checked>');
  out = out.split('<label id="campaign-file-field">').join('<label id="campaign-file-field" hidden>');

  // Navigation: keep language switch, add sign-in and the primary action; add the demo to the menu.
  out = out.replace(/<div class="nav-actions">(<a class="language"[^>]*>[^<]*<\/a>)[\s\S]*?<\/div>(<\/div><\/header>)/, (_m, language: string, end: string) => `${navActions(tr, BANK_HOME.has(route), language)}${end}`);
  if (!/<nav aria-label="(?:Ana menü|Main menu|Main navigation)">(?:(?!<\/nav>)[\s\S])*href="\/demo"/.test(out)) {
    out = out.replace(/(<nav aria-label="(?:Ana menü|Main menu|Main navigation)">[\s\S]*?)(<\/nav>)/, `$1<a href="/demo">${tr ? "Canlı demo" : "Live demo"}</a>$2`);
  }

  // Footer: a site map on every page.
  if (!out.includes('class="footer-links"')) out = out.replace(/(<footer class="footer wrap">[\s\S]*?<\/span>)/, `$1${footerLinks(tr)}`);

  if (BUSINESS_HOME.has(route)) out = businessHero(out, tr);
  if (BANK_HOME.has(route)) out = bankHero(out, tr);
  return out;
}

export const SITEMAP_PATHS = ["/isletmeler", "/en/business", "/freelancerlar", "/en/freelancers", "/finans-ekipleri", "/en/finance-teams", "/bankalar", "/en/banks", "/kampanyalar", "/en/campaigns"] as const;
