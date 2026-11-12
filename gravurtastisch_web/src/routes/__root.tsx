import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useLocation,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, useRef, type ReactNode } from "react";
import { useTranslation, I18nextProvider } from "react-i18next";
import Lenis from "lenis";
import i18n from "../i18n/config";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { Toaster } from "../components/ui/toast";
import { ScrollToTopButton } from "../components/site/ScrollToTopButton";
import { API_V1 } from "../lib/api";
import { DEFAULT_SITE_URL, DEFAULT_OG_IMAGE } from "@/utils/seo";

function NotFoundComponent() {
  const { t } = useTranslation();
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">{t('root.notFoundTitle')}</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {t('root.notFoundDesc')}
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {t('root.notFoundBtn')}
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: any; reset: () => void }) {
  const { t } = useTranslation();
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          {t('root.errorTitle')}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {t('root.errorDesc')}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {t('root.errorRetry')}
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            {t('root.errorGoHome')}
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Gravurtastisch - Custom Photo Cups, Laser Engraving & Personalized Gifts" },
      {
        name: "description",
        content:
          "Premium custom studio for photo mugs, laser-engraved kitchenware, apparel, and keepsakes. Free digital proofs, German-craft precision, and reliable delivery.",
      },
      { name: "author", content: "Gravurtastisch" },
      { name: "robots", content: "index, follow" },
      {
        name: "googlebot",
        content: "index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1",
      },
      { property: "og:site_name", content: "Gravurtastisch" },
      { property: "og:type", content: "website" },
      { property: "og:title", content: "Gravurtastisch - Custom Photo Cups, Laser Engraving & Personalized Gifts" },
      {
        property: "og:description",
        content:
          "Premium custom studio for photo mugs, laser-engraved kitchenware, apparel, and keepsakes. Free digital proofs, German-craft precision, and reliable delivery.",
      },
      { property: "og:url", content: DEFAULT_SITE_URL },
      { property: "og:image", content: DEFAULT_OG_IMAGE },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { property: "og:image:alt", content: "Gravurtastisch Studio" },
      { property: "og:locale", content: "de_DE" },
      { property: "og:locale:alternate", content: "en_US" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:site", content: "@gravurtastisch" },
      { name: "twitter:creator", content: "@gravurtastisch" },
      { name: "twitter:title", content: "Gravurtastisch - Custom Photo Cups, Laser Engraving & Personalized Gifts" },
      {
        name: "twitter:description",
        content:
          "Premium custom studio for photo mugs, laser-engraved kitchenware, apparel, and keepsakes. Free digital proofs, German-craft precision, and reliable delivery.",
      },
      { name: "twitter:image", content: DEFAULT_OG_IMAGE },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/g.svg", type: "image/svg+xml" },
      { rel: "shortcut icon", href: "/g.svg" },
      { rel: "apple-touch-icon", href: "/g.svg" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700&family=Inter:wght@400;500;600;700&display=swap",
      },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          "name": "Gravurtastisch",
          "url": DEFAULT_SITE_URL,
          "logo": `${DEFAULT_SITE_URL}/g.svg`,
          "description": "Premium custom laser engraving, photo cups, and personalized gift studio with free digital proofs and German-craft precision.",
          "email": "info@gravurtastisch.de",
          "address": {
            "@type": "PostalAddress",
            "streetAddress": "Gertrudstr. 2",
            "addressLocality": "Castrop-Rauxel",
            "addressRegion": "NRW",
            "postalCode": "44575",
            "addressCountry": "DE"
          },
          "sameAs": [
            "https://www.linkedin.com/company/gravurtastisch",
            "https://www.facebook.com/gravurtastisch",
            "https://www.instagram.com/gravurtastisch"
          ]
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          "name": "Gravurtastisch",
          "url": DEFAULT_SITE_URL
        }),
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  const { i18n: i18nInstance } = useTranslation();
  return (
    <html lang={i18nInstance.language || 'en'} suppressHydrationWarning>
      <head>
        <HeadContent />
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
  const location = useLocation();
  const lenisRef = useRef<Lenis | null>(null);

  // Global Lenis smooth scrolling for desktop only (mobile native hardware-accelerated momentum scrolling has 0 overhead)
  useEffect(() => {
    if (typeof window === "undefined" || window.innerWidth < 768) return;

    const lenis = new Lenis({
      autoRaf: true,
      allowNestedScroll: true,
    });
    lenisRef.current = lenis;
    (window as any).__lenis = lenis;

    return () => {
      lenis.destroy();
      lenisRef.current = null;
      if ((window as any).__lenis === lenis) {
        delete (window as any).__lenis;
      }
    };
  }, []);

  useEffect(() => {
    if (!location.hash) {
      if (lenisRef.current) {
        lenisRef.current.scrollTo(0, { immediate: true });
      } else {
        window.scrollTo({ top: 0, left: 0, behavior: "instant" });
      }
    } else {
      const targetId = location.hash.replace(/^#/, "");
      const el = document.getElementById(targetId);
      if (el) {
        if (lenisRef.current) {
          lenisRef.current.scrollTo(el, { offset: -70 });
        } else {
          el.scrollIntoView({ behavior: "smooth" });
        }
      }
    }
  }, [location.pathname, location.hash]);

  // Keep-alive: Pings backend /health safely to prevent sleep without blocking initial load or Lighthouse
  useEffect(() => {
    if (typeof window === "undefined") return;

    const healthUrl = `${API_V1.replace(/\/v1$/, "")}/health`;
    const ping = () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000);
        fetch(healthUrl, { method: "GET", cache: "no-store", signal: controller.signal })
          .catch(() => {})
          .finally(() => clearTimeout(timeoutId));
      } catch {}
    };

    // Delay first ping by 15s to keep initial load and Core Web Vitals unblocked
    const t = setTimeout(ping, 15000);
    const id = setInterval(ping, 5 * 60 * 1000);
    return () => {
      clearTimeout(t);
      clearInterval(id);
    };
  }, []);

  return (
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={queryClient}>
        <Outlet />
        <Toaster />
        <ScrollToTopButton />
      </QueryClientProvider>
    </I18nextProvider>
  );
}
