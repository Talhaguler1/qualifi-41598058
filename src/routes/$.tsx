import { createFileRoute } from "@tanstack/react-router";
import { servePage } from "@/lib/qualifi-serve";

export const Route = createFileRoute("/$")({
  head: ({ match }) => ({ meta: [
    { title: `QualiFi | ${match.pathname.split('/').filter(Boolean).join(' / ')}` },
    { name: 'description', content: 'QualiFi finansal takip çözümleri ve pilot başvuruları.' },
    { property: 'og:title', content: `QualiFi | ${match.pathname}` },
    { property: 'og:description', content: 'QualiFi finansal takip çözümleri ve pilot başvuruları.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary' },
  ] }),
  server: { handlers: { GET: ({ request }) => servePage(new URL(request.url).pathname) } },
  component: () => null,
});
