import { useEffect, useState } from "react";
import { captureFirstTouch } from "@/lib/attribution";
import { loadPixel, readConsent, saveConsent, trackingEnabled } from "@/lib/tracking";

/**
 * Site-wide: remembers the first campaign source, and (only when a Meta Pixel ID is configured)
 * asks for consent before loading it. Accept and decline are equally easy (KVKK).
 */
export function ConsentAndAttribution() {
  const [ask, setAsk] = useState(false);
  const [en, setEn] = useState(false);
  useEffect(() => {
    captureFirstTouch();
    setEn(document.documentElement.lang === "en");
    if (!trackingEnabled()) return;
    const c = readConsent();
    if (c === "granted") loadPixel();
    else if (c === null) setAsk(true);
  }, []);
  if (!ask) return null;
  const choose = (v: "granted" | "denied") => {
    saveConsent(v);
    setAsk(false);
  };
  return (
    <div className="qf-consent" role="dialog" aria-live="polite" aria-label={en ? "Cookie preferences" : "Çerez tercihleri"}>
      <p>
        {en
          ? "We use a Meta Pixel to measure our ads (e.g. how many visitors open an account). It runs only if you accept."
          : "Reklamlarımızı ölçmek için (ör. kaç ziyaretçinin hesap açtığı) Meta Pixel kullanıyoruz. Yalnız kabul ederseniz çalışır."}
      </p>
      <div>
        <button type="button" className="qf-consent__btn" onClick={() => choose("denied")}>
          {en ? "Decline" : "Reddet"}
        </button>
        <button type="button" className="qf-consent__btn qf-consent__btn--yes" onClick={() => choose("granted")}>
          {en ? "Accept" : "Kabul et"}
        </button>
      </div>
    </div>
  );
}
