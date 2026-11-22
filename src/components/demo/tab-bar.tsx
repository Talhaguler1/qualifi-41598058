import type { ReactNode } from "react";
import {
  Camera,
  FileUp,
  House,
  MessageCircle,
  MoreHorizontal,
  Phone,
  Plus,
  TrendingUp,
  Users,
} from "lucide-react";
import { L } from "@/lib/demo";

export type TabKey = "today" | "cash" | "customers" | "more";

/**
 * Phone navigation: four places and one action in the middle, always in the same spot,
 * so the hand learns it. Hidden on wide screens (the "+ Ekle" button in the top bar does the same).
 */
export function TabBar({
  active,
  onTab,
  onAdd,
}: {
  active: TabKey;
  onTab: (t: TabKey) => void;
  onAdd: () => void;
}) {
  const item = (key: TabKey, icon: ReactNode, label: string) => (
    <button
      type="button"
      className={`qd-tabbar__item${active === key ? " is-on" : ""}`}
      aria-current={active === key ? "page" : undefined}
      onClick={() => onTab(key)}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
  return (
    <nav className="qd-tabbar" aria-label={L("Ana gezinme", "Main navigation")}>
      {item("today", <House size={20} strokeWidth={1.9} />, L("Bugün", "Today"))}
      {item("cash", <TrendingUp size={20} strokeWidth={1.9} />, L("Nakit", "Cash"))}
      <button
        type="button"
        className="qd-tabbar__add"
        onClick={onAdd}
        aria-label={L("Ekle", "Add")}
      >
        <Plus size={26} strokeWidth={2.4} />
        <span>{L("Ekle", "Add")}</span>
      </button>
      {item("customers", <Users size={20} strokeWidth={1.9} />, L("Müşteriler", "Customers"))}
      {item("more", <MoreHorizontal size={20} strokeWidth={1.9} />, L("Daha fazla", "More"))}
    </nav>
  );
}

export type AddChoice = "promise" | "photo" | "file" | "message";

/** The one door for everything new. The order never changes: the most frequent job stays on top. */
export function AddMenu({ onPick }: { onPick: (c: AddChoice) => void }) {
  const rows: Array<[AddChoice, ReactNode, string, string]> = [
    [
      "promise",
      <Phone key="p" size={20} />,
      L("Ödeme sözü", "Payment promise"),
      L(
        "Telefonda, yüz yüze ya da mesajla alınan söz",
        "Taken on the phone, in person or by message",
      ),
    ],
    [
      "photo",
      <Camera key="c" size={20} />,
      L("Fotoğraf çek", "Take a photo"),
      L("Fatura, çek, senet ya da sözleşme", "Invoice, cheque, note or contract"),
    ],
    [
      "file",
      <FileUp key="f" size={20} />,
      L("Dosya yükle", "Upload a file"),
      L("PDF, Excel, banka ekstresi, sohbet dökümü", "PDF, Excel, bank statement, chat export"),
    ],
    [
      "message",
      <MessageCircle key="m" size={20} />,
      L("Müşteri mesajı", "Customer message"),
      L(
        "WhatsApp mesajını yapıştırın, ajan okusun",
        "Paste a WhatsApp message for the agent to read",
      ),
    ],
  ];
  return (
    <ul className="qd-addmenu">
      {rows.map(([key, icon, title, sub]) => (
        <li key={key}>
          <button type="button" onClick={() => onPick(key)}>
            <span className="qd-addmenu__icon">{icon}</span>
            <span className="qd-addmenu__text">
              <b>{title}</b>
              <small>{sub}</small>
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}

/** What a photo or file does in a real account; the demo already has sample documents loaded. */
export function DocumentInfo({
  onSources,
  onSignup,
}: {
  onSources: () => void;
  onSignup: () => void;
}) {
  return (
    <section className="qd-card qd-docinfo">
      <p>
        {L(
          "Gerçek hesabınızda fotoğrafı ya da dosyayı yüklediğinizde ajan tutarı, vadeyi ve karşı tarafı okur; emin olmadığı alanı size sorar.",
          "In a real account the agent reads the amount, due date and counterparty from your photo or file, and asks you about anything it is unsure of.",
        )}
      </p>
      <p>
        {L(
          "Bu demoda örnek belgeler zaten yüklü.",
          "This demo already has sample documents loaded.",
        )}
      </p>
      <div className="qd-docinfo__actions">
        <button type="button" className="qd-btn qd-btn--primary" onClick={onSources}>
          {L("Örnek belgeleri gör", "See the sample documents")}
        </button>
        <button type="button" className="qd-btn" onClick={onSignup}>
          {L("Ücretsiz hesap aç", "Open a free account")}
        </button>
      </div>
    </section>
  );
}
