import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { setDemoLang } from "../lib/demo/i18n";
import { ConsentAndAttribution } from "../components/site/consent";
import { META_DOMAIN_VERIFICATION } from "../lib/tracking";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    // Replace these placeholders with the app's name and description when first building the app.
    // Each content route, / included, must still set its own head(). Never add og:image or
    // twitter:image here: every page without its own would inherit the root's preview image.
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "QualiFi" },
      { name: "description", content: "QualiFi finansal takip ve başvuru yönetimi." },
      { name: "author", content: "QualiFi" },
      { property: "og:title", content: "QualiFi" },
      { property: "og:description", content: "QualiFi finansal takip ve başvuru yönetimi." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      // Meta domain verification (Business Settings → Domains); empty until the code is provided.
      ...(META_DOMAIN_VERIFICATION ? [{ name: "facebook-domain-verification", content: META_DOMAIN_VERIFICATION }] : []),
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  // Turkish unless the page is under /en or asks for English (?l=en), so uppercase "i" becomes "İ".
  const lang = useRouterState({
    select: (s) => (s.location.pathname.startsWith("/en") || (s.location.search as { l?: string }).l === "en" ? "en" : "tr"),
  });
  // Two installable apps: the demo (no sign-in, opens the demo chooser) and QualiFi itself (opens the panel).
  const demo = useRouterState({ select: (s) => s.location.pathname.startsWith("/demo") });
  return (
    <html lang={lang}>
      <head>
        <HeadContent />
        <link rel="manifest" href={demo ? "/manifest-demo.webmanifest" : "/manifest.webmanifest"} />
        <link rel="apple-touch-icon" href={demo ? "/pwa/apple-touch-icon-demo.png" : "/pwa/apple-touch-icon.png"} />
        <meta name="apple-mobile-web-app-title" content={demo ? "QualiFi Demo" : "QualiFi"} />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="theme-color" content="#16302a" />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  // The demo language lives in a module variable; on the server reset it for every request
  // so one visitor's English page never leaks into the next page rendered (demo routes set it again).
  if (typeof window === "undefined") setDemoLang("tr");
  // No automatic "install the app" banner: visitors (and jury members scanning the QR) should never
  // find an app on their phone they did not ask for. Installing stays possible from the browser menu.
  useEffect(() => {
    const block = (e: Event) => e.preventDefault();
    window.addEventListener("beforeinstallprompt", block);
    return () => window.removeEventListener("beforeinstallprompt", block);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
      <Outlet />
      <ConsentAndAttribution />
    </QueryClientProvider>
  );
}
