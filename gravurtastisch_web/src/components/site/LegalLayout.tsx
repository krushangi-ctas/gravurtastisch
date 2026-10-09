import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Container } from "@/components/site/Container";
import { Footer } from "@/components/site/Footer";
import { Nav } from "@/components/site/Nav";

export function LegalLayout({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: ReactNode;
}) {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-background text-navy-deep">
      <Nav />
      <main className="pt-28 pb-16">
        <Container className="max-w-3xl">
          <Link
            to="/"
            className="text-sm font-medium text-brand hover:text-brand-bright transition-colors"
          >
            ← {t('legal.backToHome')}
          </Link>
          <h1 className="mt-6 text-3xl sm:text-4xl font-extrabold tracking-tight text-navy-deep">
            {title}
          </h1>
          <p className="mt-2 text-sm text-slate-body">{t('legal.lastUpdated')}: {updated}</p>
          <div className="mt-10 space-y-6 text-sm sm:text-base text-slate-body leading-relaxed [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-navy-deep [&_h2]:mt-8 [&_h2]:mb-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5">
            {children}
          </div>
        </Container>
      </main>
      <Footer />
    </div>
  );
}
