import { createFileRoute } from "@tanstack/react-router";

const TITLE = "Gizlilik politikası | QualiFi";
const DESC = "QualiFi'nin hangi verileri neden işlediği, kimlerle paylaştığı ve verilerinizi nasıl sildirebileceğiniz.";
const CONTACT = "talha.guler@ozu.edu.tr";

export const Route = createFileRoute("/gizlilik")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PrivacyPage,
});

function Section({ id, title, children }: { id?: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="mt-10 scroll-mt-8">
      <h2 className="text-xl font-semibold">{title}</h2>
      <div className="mt-3 space-y-3 leading-relaxed text-[15.5px] opacity-90">{children}</div>
    </section>
  );
}

function PrivacyPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-3xl px-6 py-14">
        <a href="/" className="text-sm font-semibold underline-offset-4 hover:underline">← QualiFi</a>
        <h1 className="mt-6 text-3xl font-semibold tracking-tight">Gizlilik politikası</h1>
        <p className="mt-2 text-sm opacity-70">Son güncelleme: 20 Kasım 2026</p>

        <Section title="Kısaca">
          <p>
            QualiFi, işletmelerin alacak ve nakit takibini kolaylaştıran bir yazılımdır. Yalnızca hizmeti sunmak için gereken
            veriyi işleriz, veriyi satmayız ve reklam amacıyla kimseyle paylaşmayız. İşletmenin verisi işletmenindir; bir bankayla
            paylaşım yalnızca işletmenin açık izniyle yapılır.
          </p>
        </Section>

        <Section title="Hangi verileri işliyoruz">
          <ul className="list-disc space-y-2 pl-5">
            <li><b>Hesap bilgileri:</b> hesap açarken verdiğiniz ad, e-posta adresi ve şirket bilgileri.</li>
            <li><b>Form bilgileri:</b> pilot ya da iletişim formlarına yazdığınız ad, e-posta, kurum ve mesaj.</li>
            <li><b>Yüklediğiniz belgeler:</b> fatura, sözleşme ve benzeri belgelerden ödeme tarihi ve tutar gibi alanlar.</li>
            <li>
              <b>WhatsApp mesajları:</b> bir işletme WhatsApp Business hesabını QualiFi'ye bağlarsa, o hesaba gelen mesajlar
              Meta'nın WhatsApp Business Platformu üzerinden bize iletilir. Bu mesajlardan yalnızca ödeme sözü, tarih ve tutar
              gibi bilgiler çıkarılır. İşletme onaylamadan müşterilerine hiçbir mesaj gönderilmez.
            </li>
            <li>
              <b>Site kullanımı:</b> sitenin hangi kaynaktan ziyaret edildiğini (ör. reklam bağlantısı) tarayıcınızda saklarız.
              Meta Pikseli yalnızca çerez izni verirseniz yüklenir.
            </li>
          </ul>
        </Section>

        <Section title="Neden işliyoruz">
          <p>
            Hesabınızı açmak ve korumak, ödeme sözlerini faturalarla eşleştirip nakit tahmini üretmek, sizin onayınızla mesaj
            göndermek, başvurularınıza dönmek ve sitenin hangi kanaldan ziyaret edildiğini ölçmek için.
          </p>
          <p>Mesajlarınızı ve belgelerinizi yapay zekâ modeli eğitmek için kullanmayız.</p>
        </Section>

        <Section title="Kimlerle paylaşıyoruz">
          <p>Hizmeti çalıştırmak için şu altyapı sağlayıcılarını kullanırız:</p>
          <ul className="list-disc space-y-2 pl-5">
            <li>Barındırma ve veritabanı (Lovable Cloud / Supabase)</li>
            <li>WhatsApp mesajlaşması (Meta Platforms, WhatsApp Business Platformu)</li>
            <li>Belgelerden alan çıkarma için yapay zekâ hizmeti</li>
          </ul>
          <p>
            Bu sağlayıcıların sunucuları yurt dışında bulunabilir. Bankalarla paylaşım yalnızca işletme bunu açıkça seçtiğinde ve
            seçtiği kapsamda yapılır; müşteri isimleri, vergi numaraları ve ham konuşmalar paylaşılmaz.
          </p>
        </Section>

        <Section title="Ne kadar süre saklıyoruz">
          <p>Hesabınız açık olduğu sürece. Hesabınızı ya da verilerinizi silmemizi istediğinizde aşağıdaki adımları izleriz.</p>
        </Section>

        <Section id="veri-silme" title="Verilerinizin silinmesi">
          <p>
            Verilerinizin silinmesini istemek için <a className="underline" href={`mailto:${CONTACT}?subject=Veri%20silme%20talebi`}>{CONTACT}</a>{" "}
            adresine, hesabınızda kullandığınız e-posta adresinden “Veri silme talebi” konulu bir e-posta gönderin. WhatsApp
            üzerinden yazıştıysanız telefon numaranızı da ekleyin.
          </p>
          <p>Talebinizi aldıktan sonra en geç 30 gün içinde verilerinizi siler ve size e-postayla bilgi veririz.</p>
        </Section>

        <Section title="Haklarınız">
          <p>
            6698 sayılı Kişisel Verilerin Korunması Kanunu'nun 11. maddesi kapsamında verilerinizin işlenip işlenmediğini öğrenme,
            düzeltilmesini ya da silinmesini isteme ve işlemeye itiraz etme haklarına sahipsiniz. Talepleriniz için{" "}
            <a className="underline" href={`mailto:${CONTACT}`}>{CONTACT}</a> adresine yazabilirsiniz.
          </p>
        </Section>

        <Section title="İletişim">
          <p>QualiFi · Muhammed Talha Güler · <a className="underline" href={`mailto:${CONTACT}`}>{CONTACT}</a></p>
        </Section>
      </div>
    </main>
  );
}
