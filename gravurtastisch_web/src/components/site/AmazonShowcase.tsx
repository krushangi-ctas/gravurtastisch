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
  FlagAT,
  FlagCH,
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
      badgeColor: "bg-brand/10 text-brand border-brand/25",
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
    { name: "AT", Flag: FlagAT, share: "Studio AT" },
    { name: "CH", Flag: FlagCH, share: "Studio CH" },
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
                  <span className="section-badge mb-3">
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
                    className="inline-flex items-center justify-center px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider liquid-glass border border-[#0032ab]/15 text-slate-700 hover:border-[#0032ab]/40 hover:text-[#0032ab] shadow-2xs hover:shadow-xs transition-all"
                  >
                    {t("amazonShowcase.btnExplore", "Explore the studio hub")}
                  </a>

                  <a
                    href="/#contact"
                    className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider btn-glass-primary !text-white shadow-sm shadow-[#0032ab]/30 hover:scale-[1.02] transition-all"
                  >
                    <span className="!text-white">{t("amazonShowcase.btnTalk", "Talk to our team")}</span>
                    <ArrowRight className="w-4 h-4 text-white" />
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

      {/* 2. 4 Core Pillars of Studio Production in EcomRetails light theme */}
      <section id="amazon-ecosystem" className="relative py-14 lg:py-18 bg-[#f8f9fc] text-slate-900 overflow-hidden border-t border-slate-200/80">
        <Container className="relative">
          {/* Header Subtitle & Title (Center Aligned) */}
          <Reveal>
            <div className="text-center max-w-3xl mx-auto">
              <span className="section-badge mb-3">
                {t("amazonShowcase.badge", "GRAVURTASTISCH STUDIO HUB")}
              </span>
              <h2 className="mt-4 text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight leading-tight text-slate-900">
                {t("amazonShowcase.headingMain", "Run custom production")}{" "}
                <span className="text-slate-900">{t("amazonShowcase.headingHighlight", "without the chaos.")}</span>
              </h2>
              <p className="mt-4 text-slate-600 text-base sm:text-lg leading-relaxed max-w-2xl mx-auto">
                {t(
                  "amazonShowcase.description",
                  "From artwork intake to laser engraving and delivery - Gravurtastisch keeps proofs, craft cells, and shipping on one clear timeline."
                )}
              </p>
            </div>
          </Reveal>

          {/* 4 Core Pillars Grid with Liquid Glass cards */}
          <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {amazonPillars.map((pillar, i) => {
              const IconComponent = pillar.icon;
              return (
                <Reveal key={pillar.titleKey} delay={i * 70}>
                  <div className="group relative h-full rounded-2xl liquid-glass border border-[#0032ab]/12 hover:border-[#0032ab]/30 p-6 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#0032ab] via-[#4f6ef7] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                    <div>
                      <div className="flex items-center justify-between mb-5">
                        <div className="h-12 w-12 rounded-2xl bg-[#0032ab]/10 border border-[#0032ab]/20 text-[#0032ab] grid place-items-center group-hover:scale-105 transition-all duration-300">
                          <IconComponent className="w-6 h-6 text-[#0032ab]" />
                        </div>
                        <span className="text-[11px] font-mono font-bold px-2.5 py-1 rounded-full border border-[#0032ab]/20 bg-[#0032ab]/06 text-[#0032ab]">
                          {pillar.badge}
                        </span>
                      </div>

                      <h3 className="text-lg font-bold text-slate-900 group-hover:text-[#0032ab] transition-colors leading-snug">
                        {t(pillar.titleKey, pillar.badge)}
                      </h3>

                      <p className="mt-3 text-sm text-slate-600 leading-[1.7]">
                        {t(pillar.descKey, "")}
                      </p>
                    </div>

                    <div className="mt-6 pt-4 border-t border-slate-200/80 flex items-center justify-between text-xs text-slate-500 group-hover:text-slate-900 transition-colors">
                      <span className="font-mono text-[11px] uppercase tracking-wider text-[#0032ab] font-bold">
                        {t("amazonShowcase.verifiedTag", "Craft verified")}
                      </span>
                      <ArrowRight className="w-4 h-4 text-[#0032ab] opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-200" />
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </Container>
      </section>

      {/* 3. Workflow Comparison: High-End Interactive Matrix & Impact Hub */}
      <section id="amazon-comparison" className="relative py-16 lg:py-24 bg-gradient-to-b from-surface via-surface-alt/60 to-surface border-y border-border/60 overflow-hidden text-navy-deep">
        {/* Subtle ambient light gradient */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[500px] bg-brand/5 rounded-full blur-3xl pointer-events-none" />

        <Container className="relative">
          {/* Centered Premium Header */}
          <Reveal>
            <div className="text-center max-w-3xl mx-auto mb-10">
              <span className="section-badge mb-3">
                {t("amazonShowcase.comparisonTag", "WORKFLOW COMPARISON")}
              </span>
              <h2 className="mt-3 text-3xl sm:text-4xl lg:text-[2.75rem] font-extrabold text-navy-deep tracking-tight leading-[1.15]">
                {t("amazonShowcase.comparisonHeading", "Scattered vendors vs. Gravurtastisch Studio Hub")}
              </h2>
              <p className="mt-4 text-slate-600 text-sm sm:text-base leading-relaxed max-w-2xl mx-auto">
                {activeTab === "fba"
                  ? t("amazonShowcase.comparisonDescFba", "See how unifying multi-channel intake, proofs, and laser craft eliminates vendor chaos and protects your customer feedback.")
                  : t("amazonShowcase.comparisonDescFbm", "Streamline corporate gifts, custom merchandise, and wholesale reorders from a single studio production hub.")}
              </p>

              {/* Mode Toggle with Pill Accent */}
              <div className="mt-6 inline-flex items-center gap-1 p-1.5 rounded-full bg-slate-200/80 dark:bg-navy/80 border border-slate-300/80 dark:border-white/10 shadow-inner">
                <button
                  type="button"
                  onClick={() => setActiveTab("fba")}
                  className={`px-5 py-2 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${activeTab === "fba"
                    ? "bg-[#0032ab] text-white shadow-md shadow-[#0032ab]/30 scale-102"
                    : "text-slate-600 dark:text-slate-300 hover:text-slate-900"
                    }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{t("amazonShowcase.tabFba", "Marketplace orders")}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("fbm")}
                  className={`px-5 py-2 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${activeTab === "fbm"
                    ? "bg-[#0032ab] text-white shadow-md shadow-[#0032ab]/30 scale-102"
                    : "text-slate-600 dark:text-slate-300 hover:text-slate-900"
                    }`}
                >
                  <Globe2 className="w-3.5 h-3.5" />
                  <span>{t("amazonShowcase.tabFbm", "Direct & B2B")}</span>
                </button>
              </div>
            </div>
          </Reveal>

          {/* Quick Impact KPIs Strip */}
          <Reveal delay={60}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-8">
              <div className="p-3.5 sm:p-4 rounded-2xl bg-white/80 dark:bg-navy/60 border border-slate-200/90 dark:border-white/10 shadow-2xs text-center backdrop-blur-sm">
                <div className="text-xl sm:text-2xl font-extrabold text-[#0032ab] font-mono">3.8x</div>
                <div className="text-xs font-medium text-slate-600 dark:text-slate-300 mt-0.5">Faster proof turnaround</div>
              </div>
              <div className="p-3.5 sm:p-4 rounded-2xl bg-white/80 dark:bg-navy/60 border border-slate-200/90 dark:border-white/10 shadow-2xs text-center backdrop-blur-sm">
                <div className="text-xl sm:text-2xl font-extrabold text-emerald-600 font-mono">100%</div>
                <div className="text-xs font-medium text-slate-600 dark:text-slate-300 mt-0.5">Free digital proofs</div>
              </div>
              <div className="p-3.5 sm:p-4 rounded-2xl bg-white/80 dark:bg-navy/60 border border-slate-200/90 dark:border-white/10 shadow-2xs text-center backdrop-blur-sm">
                <div className="text-xl sm:text-2xl font-extrabold text-[#0032ab] font-mono">0%</div>
                <div className="text-xs font-medium text-slate-600 dark:text-slate-300 mt-0.5">Brand / bleed mismatch</div>
              </div>
              <div className="p-3.5 sm:p-4 rounded-2xl bg-white/80 dark:bg-navy/60 border border-slate-200/90 dark:border-white/10 shadow-2xs text-center backdrop-blur-sm">
                <div className="text-xl sm:text-2xl font-extrabold text-purple-600 font-mono">1 Hub</div>
                <div className="text-xs font-medium text-slate-600 dark:text-slate-300 mt-0.5">Instead of 5 separate vendors</div>
              </div>
            </div>
          </Reveal>

          {/* Structured Head-to-Head Comparison Matrix */}
          <Reveal delay={100}>
            <div className="rounded-3xl bg-white dark:bg-navy/90 border border-slate-200/90 dark:border-white/10 shadow-xl shadow-[#0032ab]/05 overflow-hidden">
              {/* Matrix Table Header */}
              <div className="grid grid-cols-1 md:grid-cols-12 border-b border-slate-200/80 dark:border-white/10 bg-slate-50/70 dark:bg-white/5">
                <div className="md:col-span-3 p-4 sm:p-5 flex items-center">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 font-mono">
                    Workflow Dimension
                  </span>
                </div>
                <div className="md:col-span-4 p-4 sm:p-5 border-t md:border-t-0 md:border-l border-slate-200/80 dark:border-white/10 flex items-center justify-between bg-rose-50/30 dark:bg-rose-950/10">
                  <div className="flex items-center gap-2">
                    <XCircle className="w-4 h-4 text-rose-500 shrink-0" />
                    <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                      {t("amazonShowcase.manualTitle", "Traditional multi-vendor process")}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300 font-semibold">
                    Fragmented
                  </span>
                </div>
                <div className="md:col-span-5 p-4 sm:p-5 border-t md:border-t-0 md:border-l border-slate-200/80 dark:border-white/10 flex items-center justify-between bg-gradient-to-r from-[#0032ab]/08 via-[#4f6ef7]/08 to-transparent">
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-lg bg-[#0032ab] grid place-items-center text-white shrink-0 shadow-xs">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-bold text-[#0032ab] dark:text-brand-bright">
                      {t("amazonShowcase.autoTitle", "Gravurtastisch unified pipeline")}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono uppercase px-2.5 py-0.5 rounded-full bg-[#0032ab] text-white font-bold shadow-xs">
                    {t("amazonShowcase.autoBadge", "One studio flow")}
                  </span>
                </div>
              </div>

              {/* Comparison Rows */}
              <div className="divide-y divide-slate-100 dark:divide-white/05">
                {/* Row 1: Artwork Intake */}
                <div className="grid grid-cols-1 md:grid-cols-12 group hover:bg-slate-50/60 dark:hover:bg-white/03 transition-colors">
                  <div className="md:col-span-3 p-4 sm:p-5 flex flex-col justify-center">
                    <span className="text-xs font-bold text-navy-deep dark:text-white flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-[#0032ab]" />
                      Artwork & SKU Intake
                    </span>
                    <span className="text-[11px] text-slate-500 mt-0.5">Asset collection & routing</span>
                  </div>
                  <div className="md:col-span-4 p-4 sm:p-5 md:border-l border-slate-100 dark:border-white/05 flex items-start gap-2.5 text-xs sm:text-sm text-slate-600 dark:text-slate-400 bg-rose-50/15 dark:bg-rose-950/05">
                    <XCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                    <div>
                      <p>{t("amazonShowcase.manualPoint1", "Emailing artwork to different suppliers for each product type")}</p>
                      <span className="inline-block mt-1 text-[10px] font-mono text-rose-600 bg-rose-100/60 px-2 py-0.5 rounded-md">
                        Lost attachments & manual sorting
                      </span>
                    </div>
                  </div>
                  <div className="md:col-span-5 p-4 sm:p-5 md:border-l border-slate-100 dark:border-white/05 flex items-start gap-2.5 text-xs sm:text-sm text-slate-800 dark:text-slate-100 bg-[#0032ab]/03">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">{t("amazonShowcase.autoPoint1", "Central uploads with automatic SKU and product-line routing")}</p>
                      <span className="inline-block mt-1 text-[10px] font-mono text-emerald-700 dark:text-emerald-400 bg-emerald-100/70 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md font-semibold">
                        Instant SKU parsing · Zero email loss
                      </span>
                    </div>
                  </div>
                </div>

                {/* Row 2: Digital Proofs */}
                <div className="grid grid-cols-1 md:grid-cols-12 group hover:bg-slate-50/60 dark:hover:bg-white/03 transition-colors">
                  <div className="md:col-span-3 p-4 sm:p-5 flex flex-col justify-center">
                    <span className="text-xs font-bold text-navy-deep dark:text-white flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                      Digital Proofs & Revisions
                    </span>
                    <span className="text-[11px] text-slate-500 mt-0.5">Pre-production verification</span>
                  </div>
                  <div className="md:col-span-4 p-4 sm:p-5 md:border-l border-slate-100 dark:border-white/05 flex items-start gap-2.5 text-xs sm:text-sm text-slate-600 dark:text-slate-400 bg-rose-50/15 dark:bg-rose-950/05">
                    <XCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                    <div>
                      <p>{t("amazonShowcase.manualPoint2", "Approving proofs on inconsistent templates and missing bleed zones")}</p>
                      <span className="inline-block mt-1 text-[10px] font-mono text-rose-600 bg-rose-100/60 px-2 py-0.5 rounded-md">
                        Wasted blanks & wrong positions
                      </span>
                    </div>
                  </div>
                  <div className="md:col-span-5 p-4 sm:p-5 md:border-l border-slate-100 dark:border-white/05 flex items-start gap-2.5 text-xs sm:text-sm text-slate-800 dark:text-slate-100 bg-[#0032ab]/03">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">{t("amazonShowcase.autoPoint2", "Free digital proofs with revision rounds before production unlocks")}</p>
                      <span className="inline-block mt-1 text-[10px] font-mono text-emerald-700 dark:text-emerald-400 bg-emerald-100/70 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md font-semibold">
                        Proof-gated · 100% Guaranteed safe
                      </span>
                    </div>
                  </div>
                </div>

                {/* Row 3: Tracking & Visibility */}
                <div className="grid grid-cols-1 md:grid-cols-12 group hover:bg-slate-50/60 dark:hover:bg-white/03 transition-colors">
                  <div className="md:col-span-3 p-4 sm:p-5 flex flex-col justify-center">
                    <span className="text-xs font-bold text-navy-deep dark:text-white flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-amber-500" />
                      Live Stage Tracking
                    </span>
                    <span className="text-[11px] text-slate-500 mt-0.5">Real-time status visibility</span>
                  </div>
                  <div className="md:col-span-4 p-4 sm:p-5 md:border-l border-slate-100 dark:border-white/05 flex items-start gap-2.5 text-xs sm:text-sm text-slate-600 dark:text-slate-400 bg-rose-50/15 dark:bg-rose-950/05">
                    <XCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                    <div>
                      <p>{t("amazonShowcase.manualPoint3", "No single view of what's in production or already shipped")}</p>
                      <span className="inline-block mt-1 text-[10px] font-mono text-rose-600 bg-rose-100/60 px-2 py-0.5 rounded-md">
                        Constant "where is my order" queries
                      </span>
                    </div>
                  </div>
                  <div className="md:col-span-5 p-4 sm:p-5 md:border-l border-slate-100 dark:border-white/05 flex items-start gap-2.5 text-xs sm:text-sm text-slate-800 dark:text-slate-100 bg-[#0032ab]/03">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">{t("amazonShowcase.autoPoint3", "Status you can trust: proof → crafting → quality → shipped")}</p>
                      <span className="inline-block mt-1 text-[10px] font-mono text-emerald-700 dark:text-emerald-400 bg-emerald-100/70 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md font-semibold">
                        Clear timeline milestones · Live tracking
                      </span>
                    </div>
                  </div>
                </div>

                {/* Row 4: Brand Fidelity */}
                <div className="grid grid-cols-1 md:grid-cols-12 group hover:bg-slate-50/60 dark:hover:bg-white/03 transition-colors">
                  <div className="md:col-span-3 p-4 sm:p-5 flex flex-col justify-center">
                    <span className="text-xs font-bold text-navy-deep dark:text-white flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-purple-500" />
                      Brand Fidelity & Repeat Runs
                    </span>
                    <span className="text-[11px] text-slate-500 mt-0.5">Consistent specs across runs</span>
                  </div>
                  <div className="md:col-span-4 p-4 sm:p-5 md:border-l border-slate-100 dark:border-white/05 flex items-start gap-2.5 text-xs sm:text-sm text-slate-600 dark:text-slate-400 bg-rose-50/15 dark:bg-rose-950/05">
                    <XCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                    <div>
                      <p>{t("amazonShowcase.manualPoint4", "Reorders that drift from your original brand colors or font choices")}</p>
                      <span className="inline-block mt-1 text-[10px] font-mono text-rose-600 bg-rose-100/60 px-2 py-0.5 rounded-md">
                        Inconsistent customer perception
                      </span>
                    </div>
                  </div>
                  <div className="md:col-span-5 p-4 sm:p-5 md:border-l border-slate-100 dark:border-white/05 flex items-start gap-2.5 text-xs sm:text-sm text-slate-800 dark:text-slate-100 bg-[#0032ab]/03">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">{t("amazonShowcase.autoPoint4", "Saved brand presets for faster reorders and corporate runs")}</p>
                      <span className="inline-block mt-1 text-[10px] font-mono text-emerald-700 dark:text-emerald-400 bg-emerald-100/70 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md font-semibold">
                        Vector-locked presets · Exact match guarantee
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>

          {/* Regional Multi-Marketplace Glass Dock */}
          <Reveal delay={140}>
            <div className="mt-8 p-4 sm:p-5 rounded-2xl liquid-glass border border-[#0032ab]/15 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2.5 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <Globe2 className="w-4 h-4 text-[#0032ab]" />
                <span>{t("amazonShowcase.marketplacesSupported", "Seamless multi-region studio routing across Europe & wholesale channels:")}</span>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2">
                {marketplaces.map((m) => {
                  const Flag = m.Flag;
                  return (
                    <div
                      key={m.name}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white dark:bg-navy/80 border border-slate-200/90 dark:border-white/10 shadow-2xs hover:border-[#0032ab]/50 hover:scale-105 transition-all cursor-default"
                      title={m.share}
                    >
                      <Flag className="w-4 h-3 rounded-xs" />
                      <span className="text-xs font-mono font-bold text-navy-deep dark:text-white">{m.name}</span>
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
