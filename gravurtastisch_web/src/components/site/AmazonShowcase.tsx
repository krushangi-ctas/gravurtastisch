import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Container } from "./Container";
import { Reveal } from "./Reveal";
import { AmazonHubDiagram } from "./AmazonHubDiagram";
import {
  CheckCircle2,
  XCircle,
  ArrowRight,
  ShieldCheck,
  Zap,
  Globe2,
  Sparkles,
  Check,
  ImagePlus,
  BadgeCheck,
  Flame,
  PackageCheck,
} from "lucide-react";
import {
  FlagGB,
  FlagDE,
  FlagFR,
  FlagIT,
  FlagES,
} from "@/components/ui/FlagIcon";

export function AmazonShowcase() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<"fba" | "fbm">("fba");

  const bulletPoints = [
    t("amazonShowcase.bullet1", "One studio desk for cups, engraving, apparel, and keepsakes"),
    t("amazonShowcase.bullet2", "Free digital proofs before anything goes to production"),
    t("amazonShowcase.bullet3", "Laser and print capacity scheduled around approved artwork"),
    t("amazonShowcase.bullet4", "Live status from intake → proof → craft → delivery"),
    t("amazonShowcase.bullet5", "Secure shop and marketplace connections for custom SKUs"),
    t("amazonShowcase.bullet6", "Team roles so designers, makers, and support stay aligned"),
  ];

  const amazonPillars = [
    {
      icon: ImagePlus,
      titleKey: "amazonShowcase.pillar1Title",
      descKey: "amazonShowcase.pillar1Desc",
      badge: t("amazonShowcase.badgeSpApi", "Secure intake"),
      badgeColor: "bg-[#613EA3]/10 text-[#613EA3] border-[#613EA3]/25",
    },
    {
      icon: BadgeCheck,
      titleKey: "amazonShowcase.pillar2Title",
      descKey: "amazonShowcase.pillar2Desc",
      badge: t("amazonShowcase.badgePolicySafe", "Proof before craft"),
      badgeColor: "bg-emerald-500/10 text-emerald-600 border-emerald-200/60",
    },
    {
      icon: Flame,
      titleKey: "amazonShowcase.pillar3Title",
      descKey: "amazonShowcase.pillar3Desc",
      badge: t("amazonShowcase.badgeFbaFbm", "Cups to apparel"),
      badgeColor: "bg-amber-500/10 text-amber-700 border-amber-200/60",
    },
    {
      icon: PackageCheck,
      titleKey: "amazonShowcase.pillar4Title",
      descKey: "amazonShowcase.pillar4Desc",
      badge: t("amazonShowcase.badgeBuyBox", "Premium finish"),
      badgeColor: "bg-purple-500/10 text-purple-600 border-purple-200/60",
    },
  ];

  const marketplaces = [
    { name: "DE", Flag: FlagDE, share: "Studio DE" },
    { name: "AT", Flag: FlagDE, share: "Studio AT" },
    { name: "CH", Flag: FlagDE, share: "Studio CH" },
    { name: "UK", Flag: FlagGB, share: "Studio UK" },
    { name: "FR", Flag: FlagFR, share: "Studio FR" },
    { name: "IT", Flag: FlagIT, share: "Studio IT" },
    { name: "ES", Flag: FlagES, share: "Studio ES" },
  ];

  return (
    <>
      {/* 1. New Main Hub Showcase Section: 2-Column (Left: Content, Bullets, CTAs; Right: Animated SVG Architecture Diagram) */}
      <section id="studio-hub" className="relative py-16 lg:py-24 bg-surface text-navy-deep overflow-hidden border-b border-border/60">
        {/* Subtle mesh background effect */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-brand/5 rounded-full blur-3xl pointer-events-none" />

        <Container className="relative">
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Left Column: Headline, Description, 4 Crisp Feature Items, CTAs, Clean Trust Badges */}
            <div className="lg:col-span-5 space-y-6">
              <Reveal>
                <div>
                  <span className="text-xs font-bold uppercase tracking-[0.2em] text-brand">
                    {t("amazonShowcase.hubBadge", "Custom production studio")}
                  </span>
                  <h2 className="mt-3 text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-navy-deep dark:text-white leading-tight">
                    {t("amazonShowcase.hubHeadingPrefix", "One desk for engraving, print, and")}{" "}
                    {t("amazonShowcase.hubHeadingHighlight", "keepsakes that feel personal.")}
                  </h2>
                  <p className="mt-3.5 text-sm sm:text-base text-slate-body leading-relaxed max-w-xl">
                    {t(
                      "amazonShowcase.hubDescription",
                      "Coordinate artwork intake, free digital proofs, laser engraving, and premium print finishes from a single Gravurtastisch studio workflow."
                    )}
                  </p>
                </div>
              </Reveal>

              {/* 4 Crisp Key Value Props (2x2 Grid) */}
              <Reveal delay={80}>
                <div className="grid sm:grid-cols-2 gap-3 pt-1">
                  <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-white dark:bg-navy/60 border border-slate-200/80 dark:border-white/10 shadow-2xs">
                    <div className="h-6 w-6 rounded-lg bg-brand/10 border border-brand-500/20 grid place-items-center text-brand-600 dark:text-brand-400 shrink-0 mt-0.5">
                      <Sparkles className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-navy-deep dark:text-white">
                        {t("amazonShowcase.bullet1Title", "Official SP-API")}
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-white/60 leading-tight mt-0.5">
                        {t("amazonShowcase.bullet1Desc", "Artwork intake with clear SKU briefs")}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-white dark:bg-navy/60 border border-slate-200/80 dark:border-white/10 shadow-2xs">
                    <div className="h-6 w-6 rounded-lg bg-emerald-500/10 border border-emerald-500/20 grid place-items-center text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5">
                      <ShieldCheck className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-navy-deep dark:text-white">
                        {t("amazonShowcase.bullet3Title", "100% Policy Safe")}
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-white/60 leading-tight mt-0.5">
                        {t("amazonShowcase.bullet3Desc", "Strict 5–30 day rule with zero risk")}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-white dark:bg-navy/60 border border-slate-200/80 dark:border-white/10 shadow-2xs">
                    <div className="h-6 w-6 rounded-lg bg-amber-500/10 border border-amber-500/20 grid place-items-center text-amber-600 dark:text-amber-400 shrink-0 mt-0.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-navy-deep dark:text-white">
                        {t("amazonShowcase.bullet2Title", "Delivery Sync")}
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-white/60 leading-tight mt-0.5">
                        {t("amazonShowcase.bullet2Desc", "Auto-dispatches for FBA & FBM orders")}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-white dark:bg-navy/60 border border-slate-200/80 dark:border-white/10 shadow-2xs">
                    <div className="h-6 w-6 rounded-lg bg-purple-500/10 border border-purple-500/20 grid place-items-center text-purple-600 dark:text-purple-400 shrink-0 mt-0.5">
                      <Globe2 className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-navy-deep dark:text-white">
                        {t("amazonShowcase.bullet4Title", "Multi-Store Hub")}
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-white/60 leading-tight mt-0.5">
                        {t("amazonShowcase.bullet4Desc", "Unified US, UK, EU & global stores")}
                      </p>
                    </div>
                  </div>
                </div>
              </Reveal>

              {/* CTA Buttons */}
              <Reveal delay={120}>
                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <a
                    href="#amazon-ecosystem"
                    className="inline-flex items-center justify-center px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider bg-white dark:bg-navy border border-slate-300 dark:border-white/20 text-navy-deep dark:text-white hover:border-brand hover:text-brand shadow-2xs hover:shadow-xs transition-all"
                  >
                    {t("amazonShowcase.btnExplore", "Explore the studio hub")}
                  </a>

                  <a
                    href="/#contact"
                    className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider bg-[#613EA3] hover:bg-[#452B78] text-white shadow-sm shadow-[#613EA3]/30 hover:scale-[1.02] transition-all"
                  >
                    <span>{t("amazonShowcase.btnTalk", "Talk to our team")}</span>
                    <ArrowRight className="w-4 h-4" />
                  </a>
                </div>
              </Reveal>

              <Reveal delay={160}>
                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-200/80 dark:border-white/10 text-[11px] text-slate-500 dark:text-white/60">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 font-medium">
                    <Check className="w-3 h-3 text-emerald-600" />
                    {t("amazonShowcase.pillFba", "Retail & wholesale")}
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 font-medium">
                    <Check className="w-3 h-3 text-emerald-600" />
                    {t("amazonShowcase.pillSpApi", "Laser-certified workflow")}
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 font-medium">
                    <Check className="w-3 h-3 text-emerald-600" />
                    {t("amazonShowcase.pillPolicySafe", "Proof-gated production")}
                  </span>
                </div>
              </Reveal>
            </div>

            {/* Right Column: Interactive Animated Amazon Hub Diagram */}
            <div className="lg:col-span-7 flex justify-center lg:justify-end">
              <Reveal delay={120}>
                <AmazonHubDiagram />
              </Reveal>
            </div>
          </div>
        </Container>
      </section>

      {/* 2. Dark Section: 4 Core Pillars of Amazon SP-API Integration */}
      <section id="amazon-ecosystem" className="relative py-14 lg:py-18 bg-navy-deep text-white overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-30" aria-hidden />
        <div className="absolute inset-0 noise-bg opacity-80" aria-hidden />

        <Container className="relative">
          {/* Header Subtitle & Title (Center Aligned) */}
          <Reveal>
            <div className="text-center max-w-3xl mx-auto">
              <span className="block text-xs font-bold uppercase tracking-[0.2em] text-brand-bright">
                {t("amazonShowcase.badge", "GRAVURTASTISCH STUDIO HUB")}
              </span>
              <h2 className="mt-4 text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight leading-tight text-white">
                {t("amazonShowcase.headingMain", "Run custom production")}{" "}
                {t("amazonShowcase.headingHighlight", "without the chaos.")}
              </h2>
              <p className="mt-4 text-white/60 text-base sm:text-lg leading-relaxed max-w-2xl mx-auto">
                {t(
                  "amazonShowcase.description",
                  "From artwork intake to laser engraving and delivery - Gravurtastisch keeps proofs, craft cells, and shipping on one clear timeline."
                )}
              </p>
            </div>
          </Reveal>

          {/* 4 Core Pillars Grid with Animated Amazon SVGs */}
          <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {amazonPillars.map((pillar, i) => {
              const IconComponent = pillar.icon;
              return (
                <Reveal key={pillar.titleKey} delay={i * 70}>
                  <div className="group relative h-full rounded-2xl bg-white/[0.04] border border-white/10 hover:border-brand-bright/50 p-6 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between overflow-hidden">
                    {/* Hover ambient top highlight */}
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-bright via-brand to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                    <div>
                      <div className="flex items-center justify-between mb-5">
                        <div className="h-12 w-12 rounded-2xl bg-white/[0.06] border border-white/10 grid place-items-center group-hover:scale-105 group-hover:border-brand-bright/40 transition-all duration-300">
                          <IconComponent className="w-8 h-8" />
                        </div>
                        <span className={`text-[11px] font-mono font-bold px-2.5 py-1 rounded-full border ${pillar.badgeColor}`}>
                          {pillar.badge}
                        </span>
                      </div>

                      <h3 className="text-lg font-bold text-white group-hover:text-brand-bright transition-colors leading-snug">
                        {t(pillar.titleKey, pillar.badge)}
                      </h3>

                      <p className="mt-3 text-sm text-white/65 leading-[1.7]">
                        {t(pillar.descKey, "")}
                      </p>
                    </div>

                    <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-white/50 group-hover:text-white transition-colors">
                      <span className="font-mono text-[11px] uppercase tracking-wider text-brand-bright font-semibold">
                        {t("amazonShowcase.verifiedTag", "Craft verified")}
                      </span>
                      <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-200" />
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </Container>
      </section>

      {/* 3. Light / White Bottom Section: Workflow Comparison Full-Width Band */}
      <section id="amazon-comparison" className="relative py-16 lg:py-24 bg-gradient-to-b from-surface via-surface-alt/40 to-surface border-y border-border/60 overflow-hidden text-navy-deep">
        {/* Subtle ambient light gradient */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-brand/5 rounded-full blur-3xl pointer-events-none" />

        <Container className="relative">
          <Reveal>
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-10 border-b border-slate-200/80">
              <div className="max-w-2xl">
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-brand">
                  {t("amazonShowcase.comparisonTag", "WORKFLOW COMPARISON")}
                </span>
                <h2 className="mt-3 text-2xl sm:text-3xl lg:text-4xl font-extrabold text-navy-deep tracking-tight leading-tight">
                  {t("amazonShowcase.comparisonHeading", "DIY shops vs. Gravurtastisch studio desk")}
                </h2>
              </div>

              {/* Mode Toggle */}
              <div className="inline-flex rounded-full bg-slate-200/70 border border-slate-300/80 p-1 self-start lg:self-auto shadow-inner">
                <button
                  type="button"
                  onClick={() => setActiveTab("fba")}
                  className={`px-6 py-2.5 rounded-full text-xs font-bold transition-all ${
                    activeTab === "fba"
                      ? "bg-brand text-white shadow-md shadow-brand/30 scale-102"
                      : "text-slate-600 hover:text-navy-deep"
                  }`}
                >
                  {t("amazonShowcase.tabFba", "Marketplace orders")}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("fbm")}
                  className={`px-6 py-2.5 rounded-full text-xs font-bold transition-all ${
                    activeTab === "fbm"
                      ? "bg-[#E89B5C] text-navy-deep font-extrabold shadow-md shadow-[#E89B5C]/35 scale-102"
                      : "text-slate-600 hover:text-navy-deep"
                  }`}
                >
                  {t("amazonShowcase.tabFbm", "Direct & B2B")}
                </button>
              </div>
            </div>
          </Reveal>

          {/* Side-by-Side Comparison Cards on White Section */}
          <div className="mt-10 grid md:grid-cols-2 gap-8">
            {/* Left: Scattered DIY custom shops */}
            <Reveal delay={80}>
              <div className="h-full rounded-3xl bg-white border border-rose-200/90 p-7 sm:p-8 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3.5 pb-6 border-b border-rose-100">
                  <div className="h-11 w-11 rounded-2xl bg-rose-100 grid place-items-center text-rose-600 shrink-0 shadow-2xs">
                    <XCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-navy-deep text-lg">
                      {t("amazonShowcase.manualTitle", "Traditional multi-vendor process")}
                    </h4>
                    <p className="text-xs text-rose-600 font-medium mt-0.5">
                      {t("amazonShowcase.manualSubtitle", "Slow proofs, mismatched colors, lost files")}
                    </p>
                  </div>
                </div>

                <ul className="mt-6 space-y-4 text-sm sm:text-base text-slate-600">
                  <li className="flex items-start gap-3">
                    <XCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                    <span>{t("amazonShowcase.manualPoint1", 'Opening every order individually to click "Request a Review" button')}</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <XCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                    <span>{t("amazonShowcase.manualPoint2", "Frequently missing the strict 5 to 30-day Amazon window")}</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <XCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                    <span>{t("amazonShowcase.manualPoint3", "Risk of policy strikes from non-compliant custom buyer-seller messages")}</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <XCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                    <span>{t("amazonShowcase.manualPoint4", "No automated timing for buyer timezones or weekend peak-reading hours")}</span>
                  </li>
                </ul>
              </div>
            </Reveal>

            {/* Right: Gravurtastisch SP-API Autopilot */}
            <Reveal delay={160}>
              <div className="h-full rounded-3xl bg-white border-2 border-brand/30 p-7 sm:p-8 relative overflow-hidden group shadow-lg shadow-brand/5 hover:border-brand/60 transition-all">
                <div className="absolute top-0 right-0 px-4 py-1.5 bg-gradient-to-r from-brand to-[#E89B5C] text-[11px] font-bold uppercase tracking-wider text-white rounded-bl-2xl shadow-sm">
                  {t("amazonShowcase.autoBadge", "One studio flow")}
                </div>

                <div className="flex items-center gap-3.5 pb-6 border-b border-violet-100">
                  <div className="h-11 w-11 rounded-2xl bg-[#F4F0FA] grid place-items-center text-brand shrink-0 shadow-2xs">
                    <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-navy-deep text-lg">
                      {t("amazonShowcase.autoTitle", "Gravurtastisch unified pipeline")}
                    </h4>
                    <p className="text-xs text-emerald-600 font-medium mt-0.5">
                      {t("amazonShowcase.autoSubtitle", "Design intake through delivery in one hub")}
                    </p>
                  </div>
                </div>

                <ul className="mt-6 space-y-4 text-sm sm:text-base text-slate-700">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{t("amazonShowcase.autoPoint1", "Proof-approved jobs move into laser and print queues automatically")}</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{t("amazonShowcase.autoPoint2", "Amazon Policy Guard: Strict 5–30 day rule calculation preventing any invalid API calls")}</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{t("amazonShowcase.autoPoint3", "Zero Risk: Uses Amazon native template - never touches buyer personal email or messaging terms")}</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{t("amazonShowcase.autoPoint4", "Smart Peak-Hour Delivery: Sends in the customer’s local timezone to maximize review submissions")}</span>
                  </li>
                </ul>
              </div>
            </Reveal>
          </div>

          {/* Global Amazon Marketplaces Strip */}
          <Reveal delay={200}>
            <div className="mt-12 pt-8 border-t border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-600">
                <Globe2 className="w-4 h-4 text-[#D97706]" />
                <span>{t("amazonShowcase.marketplacesSupported", "Seamless Multi-Region SP-API Support across all Amazon Stores:")}</span>
              </div>
              <div className="flex flex-wrap items-center gap-2.5">
                {marketplaces.map((m) => {
                  const Flag = m.Flag;
                  return (
                    <div
                      key={m.name}
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-slate-200 shadow-2xs hover:border-[#E89B5C] hover:shadow-xs transition-all"
                      title={m.share}
                    >
                      <Flag className="w-4 h-3" />
                      <span className="text-xs font-mono font-bold text-navy-deep">{m.name}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </Reveal>
        </Container>
      </section>
    </>
  );
}
