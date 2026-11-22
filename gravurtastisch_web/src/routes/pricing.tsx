import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Nav } from "@/components/site/Nav";
import { Footer } from "@/components/site/Footer";
import { Pricing } from "@/components/site/Pricing";
import { Container } from "@/components/site/Container";
import { Reveal } from "@/components/site/Reveal";
import {
  ShieldCheck,
  Zap,
  RefreshCw,
  Globe,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import i18n from "@/i18n/config";
import { seo } from "@/utils/seo";

export const Route = createFileRoute("/pricing")({
  head: () =>
    seo({
      title: i18n.exists("pricing.pageTitle")
        ? i18n.t("pricing.pageTitle")
        : "Pricing Plans - Printomation",
      description: i18n.exists("pricing.pageDesc")
        ? i18n.t("pricing.pageDesc")
        : "Transparent pricing for custom engraving and personalized products. Scale your studio fulfillment effortlessly.",
      url: "/pricing",
      keywords: ["pricing plans", "lasergravur preise", "custom merchandise rates", "printomation tarife"],
    }),
  component: PricingPage,
});

function PricingPage() {
  const { t } = useTranslation();

  const pricingPills = [
    {
      icon: ShieldCheck,
      tag: t("pricing.pill1Tag", "Automation"),
      title: t("pricing.pill1Title", "Instant File Generation"),
      desc: t("pricing.pill1Desc", "Ready-to-run files generated in seconds"),
    },
    {
      icon: Zap,
      tag: t("pricing.pill2Tag", "Transparent"),
      title: t("pricing.pill2Title", "Zero Setup Fees"),
      desc: t("pricing.pill2Desc", "No onboarding charges, cancel anytime"),
    },
    {
      icon: RefreshCw,
      tag: t("pricing.pill3Tag", "Error-Free"),
      title: t("pricing.pill3Title", "Pre-Flight Protection"),
      desc: t("pricing.pill3Desc", "Automatic text & resolution validation"),
    },
    {
      icon: Globe,
      tag: t("pricing.pill4Tag", "SP-API"),
      title: t("pricing.pill4Title", "Multi-Marketplace"),
      desc: t("pricing.pill4Desc", "Connect EU, US & global stores"),
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-background text-navy-deep dark:text-slate-100 selection:bg-brand/20 selection:text-brand overflow-x-hidden w-full max-w-full">
      <Nav />

      <main className="pb-20 w-full max-w-full overflow-x-hidden">
        {/* ==================================================== */}
        {/* 1. HERO SECTION (SKY BLUE GRADIENT - SAME AS GUIDE) */}
        {/* ==================================================== */}
        <section className="relative overflow-hidden pt-24 pb-12 lg:pt-28 lg:pb-16 bg-gradient-to-b from-[#c6dbf2] via-[#d5e4f7] to-[#bfd6f0] text-slate-800 w-full max-w-full">
          <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-brand/10 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

          <Container className="relative max-w-5xl mx-auto text-center">
            <Reveal className="max-w-4xl mx-auto flex flex-col items-center">
              <div className="section-badge mb-4">
                <Sparkles className="h-3.5 w-3.5 text-brand shrink-0" />
                <span>{t("pricing.sectionLabel", "Pricing")} · {t("pricing.heading2", "Zero hidden fees")}</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-[3.25rem] font-extrabold tracking-tight leading-[1.1] text-navy-deep text-center">
                <span>{t("pricing.heading1", "Transparent plans for your")}</span>{" "}
                <span className="bg-gradient-to-r from-[#0032ab] via-[#2563eb] to-[#7c3aed] text-transparent bg-clip-text">
                  {t("pricing.headingHighlight", "automated order volume")}
                </span>
              </h1>

              <p className="mt-4 text-slate-700 text-base sm:text-lg leading-relaxed max-w-2xl font-medium text-center mx-auto">
                {t("pricing.description", "Billed monthly in USD for software access and included automated file generations. No setup fees, cancel anytime. All plans include SP-API integration, ASIN templates, and multi-format exports.")}
              </p>

              <div className="mt-7 flex flex-wrap justify-center items-center gap-4">
                <a
                  href="#pricing"
                  className="inline-flex items-center gap-2 rounded-full btn-glass-primary px-7 py-3 text-sm font-bold !text-white shadow-lg shadow-brand/30 hover:-translate-y-0.5 transition-all"
                >
                  <span>{t("hero.ctaPricing", "View Subscription Plans")}</span>
                  <ArrowRight className="h-4 w-4" />
                </a>
                <a
                  href="/register"
                  className="inline-flex items-center gap-2 rounded-full bg-white border border-[#0032ab]/20 px-7 py-3 text-sm font-semibold text-navy-deep hover:bg-slate-50 transition-all shadow-xs"
                >
                  <span>{t("nav.registerAsSeller", "Start Free Trial")}</span>
                </a>
              </div>
            </Reveal>

            {/* Feature Highlights Row in Liquid Glass */}
            <div className="mt-8 sm:mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3 w-full border-t border-[#0032ab]/15 pt-6 text-left">
              {pricingPills.map((pill, idx) => (
                <div
                  key={idx}
                  className="group relative rounded-xl sm:rounded-2xl liquid-glass border border-white/85 p-3 sm:p-3.5 shadow-[0_4px_16px_rgba(0,50,171,0.05)] hover:shadow-[0_8px_24px_rgba(0,50,171,0.12)] transition-all duration-300 hover:-translate-y-0.5 flex items-start gap-2.5 min-w-0"
                >
                  <div className="h-8 w-8 rounded-lg bg-brand/10 text-brand grid place-items-center shrink-0 group-hover:scale-105 transition-transform">
                    <pill.icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex flex-col flex-1">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-[9px] font-mono font-bold text-brand bg-brand/10 px-1.5 py-0.5 rounded shrink-0 uppercase">
                        {pill.tag}
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-navy-deep leading-tight truncate">
                      {pill.title}
                    </h4>
                    <p className="text-[10.5px] text-slate-600 mt-0.5 truncate">
                      {pill.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Container>
        </section>

        {/* ==================================================== */}
        {/* 2. PRICING TIERS & PLANS */}
        {/* ==================================================== */}
        <Pricing />
      </main>

      <Footer />
    </div>
  );
}
