import siteCss from "@/styles/site.css?url";
import { AUDIENCE_PATH, COPY, HOME_PATH, type Audience, type SiteLang } from "@/lib/site/copy";
import { Landing } from "./landing";

const ORIGIN = "https://qualifilab.com";

/** Shared route options for every landing URL: per-language meta, hreflang pairs, page CSS. */
export function landingRoute(lang: SiteLang, audience: Audience) {
  const c = COPY[lang];
  const h = c.hero[audience];
  const path = (l: SiteLang) => (audience === "business" ? HOME_PATH[l] : AUDIENCE_PATH[l][audience]);
  const title = audience === "business" ? c.meta.title : `QualiFi | ${h.tab}: ${h.title.replace(/\.$/, "")}`;
  const description = audience === "business" ? c.meta.description : h.sub;
  return {
    head: () => ({
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { property: "og:locale", content: lang === "tr" ? "tr_TR" : "en_US" },
        { name: "twitter:card", content: "summary" },
      ],
      links: [
        { rel: "stylesheet", href: siteCss },
        { rel: "canonical", href: `${ORIGIN}${path(lang)}` },
        { rel: "alternate", hrefLang: "tr", href: `${ORIGIN}${path("tr")}` },
        { rel: "alternate", hrefLang: "en", href: `${ORIGIN}${path("en")}` },
        { rel: "alternate", hrefLang: "x-default", href: `${ORIGIN}${path("tr")}` },
      ],
    }),
    component: () => <Landing lang={lang} initialAudience={audience} />,
  };
}
