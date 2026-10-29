import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Nav } from "@/components/site/Nav";
import { Footer } from "@/components/site/Footer";
import { Container } from "@/components/site/Container";
import { Reveal } from "@/components/site/Reveal";
import {
  BookOpen,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  KeyRound,
  Zap,
  Clock,
  Send,
  CheckCircle2,
  Filter,
  Layers,
  RefreshCw,
  ShoppingBag,
  Settings2,
  Workflow,
  Check,
  Lock,
  Globe,
  Sliders,
  Play,
  CheckCircle,
  Shield
} from "lucide-react";

import { GuidePageSkeleton } from "@/components/skeletons/GuidePageSkeleton";
import { FlagDE, FlagFR, FlagGB } from "@/components/ui/FlagIcon";

export const Route = createFileRoute("/guide")({
  pendingComponent: GuidePageSkeleton,
  head: () => ({
    meta: [
      { title: "Gravurtastisch Guide" },
      { name: "description", content: "Step-by-step guide for setting up Amazon review automation." },
      { property: "og:title", content: "Gravurtastisch Guide" },
      { property: "og:description", content: "Learn how to configure order listing, credentials, and automated Amazon production jobs." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/guide" }],
  }),
  component: Guide,
});

function Guide() {
  const { t } = useTranslation();
  const isSkeletonPreview = typeof window !== "undefined" && window.location.search.includes("skeleton=true");

  if (isSkeletonPreview) {
    return <GuidePageSkeleton />;
  }

  const stepFlowItems = [
    {
      num: "01",
      title: t('guide.step1Title') || "Order listing",
      desc: t('guide.step1Desc') || "Find your job, filter by product line or status, and use the action column to open proofs or shipping details.",
      icon: ShoppingBag,
      tag: "Intake",
      badgeClass: "bg-[#0032ab]/10 text-[#0032ab] border-[#0032ab]/20",
      accent: "from-[#0032ab] to-[#155dfc]",
      borderHover: "hover:border-[#0032ab]/40",
    },
    {
      num: "02",
      title: t('guide.step2Title') || "Manual actions",
      desc: t('guide.step2Desc') || "Request a proof revision or mark rush priority when a deadline is tight.",
      icon: Send,
      tag: "Rush & Edit",
      badgeClass: "bg-indigo-50 text-indigo-700 border-indigo-200",
      accent: "from-[#2563eb] to-[#4f46e5]",
      borderHover: "hover:border-indigo-400/40",
    },
    {
      num: "03",
      title: t('guide.step3Title') || "Channel connections",
      desc: t('guide.step3Desc') || "Link your shop or marketplace accounts so new custom orders flow into the studio queue automatically.",
      icon: KeyRound,
      tag: "OAuth 2.0",
      badgeClass: "bg-sky-50 text-sky-700 border-sky-200",
      accent: "from-[#0284c7] to-[#0ea5e9]",
      borderHover: "hover:border-sky-400/40",
    },
    {
      num: "04",
      title: t('guide.step4Title') || "Settings",
      desc: t('guide.step4Desc') || "Configure notification emails, default fonts, brand colors, and shipping preferences.",
      icon: Settings2,
      tag: "Presets",
      badgeClass: "bg-purple-50 text-purple-700 border-purple-200",
      accent: "from-[#7c3aed] to-[#9333ea]",
      borderHover: "hover:border-purple-400/40",
    },
    {
      num: "05",
      title: t('guide.step5Title') || "Automated sync",
      desc: t('guide.step5Desc') || "Schedule automatic imports from connected storefronts and status webhooks to your team.",
      icon: Zap,
      tag: "Cron Engine",
      badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
      accent: "from-[#059669] to-[#10b981]",
      borderHover: "hover:border-emerald-400/40",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-background text-navy-deep dark:text-slate-100 selection:bg-brand/20 selection:text-brand overflow-x-hidden w-full max-w-full">
      <Nav />

      <main className="pb-20 w-full max-w-full overflow-x-hidden">
        {/* ==================================================== */}
        {/* 1. HERO SECTION (KEPT EXACTLY AS IN UPLOADED IMAGE) */}
        {/* ==================================================== */}
        <section className="relative overflow-hidden pt-24 pb-12 lg:pt-28 lg:pb-16 bg-gradient-to-b from-[#c6dbf2] via-[#d5e4f7] to-[#bfd6f0] text-slate-800 w-full max-w-full">
          <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-brand/10 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

          <Container className="relative max-w-5xl mx-auto text-center">
            <Reveal className="max-w-4xl mx-auto flex flex-col items-center">
              <div className="section-badge mb-4">
                <Workflow className="h-3.5 w-3.5 text-brand shrink-0" />
                <span>{t('guide.heroBadge')}</span>
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-[3.25rem] font-extrabold tracking-tight leading-[1.1] text-navy-deep text-center">
                <span>{t('guide.heroTitle')}</span>{" "}
                <span className="bg-gradient-to-r from-[#0032ab] via-[#2563eb] to-[#7c3aed] text-transparent bg-clip-text">
                  {t('guide.heroTitleHighlight')}
                </span>
              </h1>
              <p className="mt-4 text-slate-700 text-base sm:text-lg leading-relaxed max-w-2xl font-medium text-center mx-auto">
                {t('guide.heroDesc')}
              </p>
              <div className="mt-7 flex flex-wrap justify-center items-center gap-4">
                <a
                  href="/register"
                  className="inline-flex items-center gap-2 rounded-full btn-glass-primary px-7 py-3 text-sm font-bold !text-white shadow-lg shadow-brand/30 hover:-translate-y-0.5 transition-all"
                >
                  {t('guide.heroCtaRegister')}
                  <ArrowRight className="h-4 w-4" />
                </a>
                <a
                  href="#visual-workflow-section"
                  className="inline-flex items-center gap-2 rounded-full bg-white border border-[#0032ab]/20 px-7 py-3 text-sm font-semibold text-navy-deep hover:bg-slate-50 transition-all shadow-xs"
                >
                  {t('guide.heroCtaWorkflow')}
                </a>
              </div>
            </Reveal>

            {/* 5-Step Process Row in Liquid Glass - Sleek Single-Line Horizontal Cards */}
            <div className="mt-8 sm:mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 sm:gap-3 w-full border-t border-[#0032ab]/15 pt-6 text-left">
              {stepFlowItems.map((step, idx) => (
                <div
                  key={idx}
                  className="group relative rounded-xl sm:rounded-2xl liquid-glass border border-white/85 px-3 py-2 sm:px-3.5 sm:py-2.5 shadow-[0_4px_16px_rgba(0,50,171,0.05)] hover:shadow-[0_8px_24px_rgba(0,50,171,0.12)] transition-all duration-300 hover:-translate-y-0.5 flex items-center gap-2.5 min-w-0"
                >
                  <div className="h-7 w-7 rounded-lg bg-brand/10 text-brand grid place-items-center shrink-0 group-hover:scale-105 transition-transform">
                    <step.icon className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0 flex items-center gap-1.5 flex-1 overflow-hidden">
                    <span className="text-[9.5px] font-mono font-bold text-brand bg-brand/10 px-1.5 py-0.5 rounded shrink-0 whitespace-nowrap">
                      Step {step.num}
                    </span>
                    <h4 className="text-xs font-bold text-navy-deep leading-tight whitespace-nowrap truncate">
                      {step.title}
                    </h4>
                  </div>
                </div>
              ))}
            </div>
          </Container>
        </section>

        {/* ==================================================== */}
        {/* 2. OVERVIEW: STEP-BY-STEP FLOW & PURPOSE (UNIQUE UI) */}
        {/* ==================================================== */}
        <section className="py-16 lg:py-20 bg-[#f8fafd] border-b border-[#0032ab]/10 relative overflow-hidden">
          {/* Subtle Ambient Background Lighting */}
          <div className="absolute top-1/4 -left-40 w-96 h-96 rounded-full bg-brand/5 blur-3xl pointer-events-none" />
          <div className="absolute bottom-10 right-0 w-80 h-80 rounded-full bg-sky-400/5 blur-3xl pointer-events-none" />

          <Container>
            <div className="grid gap-8 lg:grid-cols-12 items-stretch">
              {/* Left Column: Interconnected Studio Blueprint Spine */}
              <div className="lg:col-span-7 flex flex-col">
                <Reveal className="h-full">
                  <div className="rounded-[2.25rem] liquid-glass bg-white p-6 sm:p-8 shadow-[0_16px_40px_rgba(0,50,171,0.06)] border border-[#0032ab]/15 relative overflow-hidden h-full flex flex-col justify-between">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
                      <div>
                        <span className="section-badge mb-2.5">
                          <Workflow className="h-3.5 w-3.5 text-brand shrink-0" />
                          <span>{t('guide.blueprintBadge') || "Studio Blueprint"}</span>
                        </span>
                        <h2 className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight text-navy-deep leading-tight">
                          {t('guide.flowTitle') || "Step-by-step flow"}
                        </h2>
                        <p className="mt-1 text-xs sm:text-sm text-slate-500 font-medium">
                          End-to-end custom production journey
                        </p>
                      </div>
                      <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0032ab]/10 border border-[#0032ab]/20 shrink-0 self-start sm:self-auto">
                        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-xs font-mono font-extrabold text-[#0032ab]">
                          {t('guide.stepsCount') || "5 essential steps"}
                        </span>
                      </div>
                    </div>

                    {/* Illuminated Vertical Pipeline Track with Floating Step Cards */}
                    <div className="mt-6 flex-1 flex flex-col justify-between relative pl-7 sm:pl-9 space-y-3.5 before:absolute before:left-3.5 sm:before:left-4.5 before:top-4 before:bottom-4 before:w-1 before:rounded-full before:bg-gradient-to-b before:from-[#0032ab] before:via-[#155dfc] before:to-[#10b981]">
                      {stepFlowItems.map((step, idx) => (
                        <div
                          key={idx}
                          className={`group relative flex items-start gap-3.5 sm:gap-4 p-3.5 sm:p-4 rounded-2xl liquid-glass border border-[#0032ab]/10 bg-gradient-to-r from-white via-white to-[#fbfdff] ${step.borderHover} hover:shadow-[0_10px_28px_rgba(0,50,171,0.1)] hover:-translate-y-0.5 transition-all duration-300`}
                        >
                          {/* Floating Pulsing Node on the Track Line */}
                          <div className={`absolute -left-7 sm:-left-9 top-4 h-7 w-7 rounded-full bg-gradient-to-br ${step.accent} text-white shadow-md grid place-items-center ring-4 ring-white`}>
                            <span className="text-[10px] font-mono font-black">{step.num}</span>
                          </div>

                          {/* Step Icon */}
                          <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${step.accent} text-white shadow-md shadow-[#0032ab]/15 grid place-items-center shrink-0 group-hover:scale-105 transition-transform`}>
                            <step.icon className="h-5 w-5 text-white" />
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border ${step.badgeClass}`}>
                                {step.tag}
                              </span>
                              <strong className="text-sm sm:text-base font-extrabold text-navy-deep group-hover:text-brand transition-colors">
                                {step.title}
                              </strong>
                            </div>
                            <p className="mt-1 text-xs sm:text-[13px] leading-relaxed text-slate-body">
                              {step.desc}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </Reveal>
              </div>

              {/* Right Column: Purpose & Automated Engine Control Deck (Single Unified Matched-Height Card) */}
              <div className="lg:col-span-5 flex flex-col">
                <Reveal delay={80} className="h-full">
                  <div className="rounded-[2.25rem] liquid-glass bg-white p-6 sm:p-8 shadow-[0_16px_40px_rgba(0,50,171,0.06)] border border-[#0032ab]/15 h-full flex flex-col justify-between">
                    {/* Top: Purpose & Core Objective Enclave */}
                    <div>
                      <div className="flex items-center justify-between gap-3 mb-2.5">
                        <span className="section-badge">
                          <Sparkles className="h-3.5 w-3.5 text-brand shrink-0" />
                          <span>{t('guide.purposeBadge') || "Core objective"}</span>
                        </span>
                      </div>
                      <h2 className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight text-navy-deep leading-tight">
                        {t('guide.purposeTitle') || "Purpose"}
                      </h2>
                      <p className="mt-2.5 text-xs sm:text-sm leading-relaxed text-slate-body font-medium">
                        {t('guide.purposeDesc') || "Keep every custom order on a proof-first path from intake to delivery - less email chaos, fewer misprints, happier recipients."}
                      </p>

                      {/* 3 Core Architectural Pillars */}
                      <div className="mt-4 grid grid-cols-1 gap-2 pt-3 border-t border-[#0032ab]/10">
                        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50/80 border border-[#0032ab]/10 shadow-2xs">
                          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                          <span className="text-xs font-bold text-navy-deep">Zero CSV Chaos</span>
                          <span className="text-[11px] text-slate-500 ml-auto">Direct API sync</span>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50/80 border border-[#0032ab]/10 shadow-2xs">
                          <CheckCircle2 className="h-4 w-4 text-brand shrink-0" />
                          <span className="text-xs font-bold text-navy-deep">24h Proof SLA</span>
                          <span className="text-[11px] text-slate-500 ml-auto">Automated nudges</span>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50/80 border border-[#0032ab]/10 shadow-2xs">
                          <CheckCircle2 className="h-4 w-4 text-indigo-600 shrink-0" />
                          <span className="text-xs font-bold text-navy-deep">100% Traceability</span>
                          <span className="text-[11px] text-slate-500 ml-auto">Proof to dispatch</span>
                        </div>
                      </div>
                    </div>

                    {/* Bottom: Automated Live Cron Telemetry Deck */}
                    <div className="mt-6 pt-5 border-t border-slate-100 space-y-3.5">
                      <div className="flex items-center justify-between pb-1">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                          <h4 className="text-[11px] font-mono font-black uppercase tracking-wider text-navy-deep">
                            Automated Daemon Engines
                          </h4>
                        </div>
                        <span className="text-[9.5px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          2 ACTIVE CRONS
                        </span>
                      </div>

                      {/* Order Fetch Cron Panel */}
                      <div className="p-3.5 rounded-2xl liquid-glass border border-[#0032ab]/12 bg-gradient-to-r from-white to-[#f8faff] shadow-2xs hover:border-[#0032ab]/30 hover:shadow-xs transition-all">
                        <div className="flex items-center justify-between gap-2.5">
                          <div className="flex items-center gap-2.5">
                            <div className="h-8.5 w-8.5 rounded-xl bg-gradient-to-br from-[#0032ab] to-[#155dfc] text-white shadow-xs grid place-items-center shrink-0">
                              <RefreshCw className="h-4 w-4 animate-[spin_10s_linear_infinite]" />
                            </div>
                            <div>
                              <strong className="text-xs sm:text-sm font-extrabold text-navy-deep block leading-tight">
                                {t('guide.orderFetchCronTitle') || "Order import sync"}
                              </strong>
                              <span className="text-[10px] font-bold text-[#0032ab]">Active Storefront Inflow</span>
                            </div>
                          </div>
                          <span className="text-[9.5px] font-mono font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 shrink-0">
                            EVERY 5M
                          </span>
                        </div>
                        <p className="mt-2 text-xs text-slate-body leading-relaxed pl-11">
                          {t('guide.orderFetchCronDesc') || "Periodically pulls new custom orders from connected sales channels into your dashboard."}
                        </p>
                      </div>

                      {/* Proof Reminder Cron Panel */}
                      <div className="p-3.5 rounded-2xl liquid-glass border border-[#0032ab]/12 bg-gradient-to-r from-white to-[#f8faff] shadow-2xs hover:border-[#0032ab]/30 hover:shadow-xs transition-all">
                        <div className="flex items-center justify-between gap-2.5">
                          <div className="flex items-center gap-2.5">
                            <div className="h-8.5 w-8.5 rounded-xl bg-gradient-to-br from-[#155dfc] to-[#0ea5e9] text-white shadow-xs grid place-items-center shrink-0">
                              <Clock className="h-4 w-4" />
                            </div>
                            <div>
                              <strong className="text-xs sm:text-sm font-extrabold text-navy-deep block leading-tight">
                                {t('guide.feedbackRequestCronTitle') || "Proof reminder sync"}
                              </strong>
                              <span className="text-[10px] font-bold text-[#0284c7]">Anti-Stall Production Gate</span>
                            </div>
                          </div>
                          <span className="text-[9.5px] font-mono font-extrabold text-[#0032ab] bg-[#0032ab]/10 px-2 py-0.5 rounded-md border border-[#0032ab]/20 shrink-0">
                            AUTO-NUDGE
                          </span>
                        </div>
                        <p className="mt-2 text-xs text-slate-body leading-relaxed pl-11">
                          {t('guide.feedbackRequestCronDesc') || "Nudges you when proofs await approval so production slots stay on schedule."}
                        </p>
                      </div>
                    </div>
                  </div>
                </Reveal>
              </div>
            </div>
          </Container>
        </section>

        {/* ==================================================== */}
        {/* 3. TOPIC 1: ORDER LISTING (SMART RADAR SVG)          */}
        {/* ==================================================== */}
        <section id="order-listing-section" className="py-16 lg:py-20 bg-white scroll-mt-24 border-b border-[#0032ab]/10">
          <Container>
            <Reveal>
              <div className="grid lg:grid-cols-12 gap-10 lg:gap-14 items-center">
                {/* Left: Content & Streamlined Action Steps */}
                <div className="lg:col-span-6 space-y-6">
                  <div>
                    <div className="section-badge mb-3">
                      <ShoppingBag className="h-3.5 w-3.5 text-brand shrink-0" />
                      <span>{t('guide.stage1Badge') || "Stage 01"}</span>
                    </div>
                    <h2 className="mt-3 text-3xl sm:text-4xl lg:text-[2.75rem] font-extrabold text-navy-deep tracking-tight leading-[1.15]">
                      {t('guide.stage1Title') || "Order listing"}
                    </h2>
                    <p className="mt-3 text-base sm:text-lg leading-relaxed text-slate-body">
                      {t('guide.stage1Desc') || "Use filters and the action column to manage proofs, production, and shipments efficiently."}
                    </p>
                  </div>

                  <div className="pt-2 space-y-4">
                    {/* Step 1 */}
                    <div className="p-4 rounded-2xl liquid-glass border border-[#0032ab]/12 bg-white flex items-start gap-3.5 hover:border-[#0032ab]/30 transition-all">
                      <span className="h-8 w-8 rounded-xl bg-gradient-to-br from-[#0032ab] to-[#155dfc] text-white font-extrabold text-sm grid place-items-center shadow-xs shrink-0">
                        1
                      </span>
                      <div>
                        <h4 className="text-base font-extrabold text-navy-deep">{t('guide.stage1Step1Title') || "1. Filter orders"}</h4>
                        <p className="text-xs sm:text-sm text-slate-body mt-1 leading-relaxed">
                          {t('guide.stage1Step1Desc') || "Select product line · filter by date & status"}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 mt-2.5">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white text-navy-deep border border-[#0032ab]/18 shadow-2xs">
                            <FlagDE className="w-4 h-2.5 rounded-[2px] shadow-xs" /> DE Store
                          </span>
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#0032ab]/10 text-brand border border-[#0032ab]/20">
                            Filtered ✓
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Step 2 */}
                    <div className="p-4 rounded-2xl liquid-glass border border-[#0032ab]/12 bg-white flex items-start gap-3.5 hover:border-[#0032ab]/30 transition-all">
                      <span className="h-8 w-8 rounded-xl bg-gradient-to-br from-[#0032ab] to-[#155dfc] text-white font-extrabold text-sm grid place-items-center shadow-xs shrink-0">
                        2
                      </span>
                      <div>
                        <h4 className="text-base font-extrabold text-navy-deep">{t('guide.stage1Step2Title') || "2. Check status"}</h4>
                        <p className="text-xs sm:text-sm text-slate-body mt-1 leading-relaxed">
                          {t('guide.stage1Step2Desc') || "Inspect proof & production state · live tracking"}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 mt-2.5">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200">
                            ● Pending
                          </span>
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200">
                            ✓ Sent
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Step 3 */}
                    <div className="p-4 rounded-2xl liquid-glass border border-[#0032ab]/12 bg-white flex items-start gap-3.5 hover:border-[#0032ab]/30 transition-all">
                      <span className="h-8 w-8 rounded-xl bg-gradient-to-br from-[#0032ab] to-[#155dfc] text-white font-extrabold text-sm grid place-items-center shadow-xs shrink-0">
                        3
                      </span>
                      <div>
                        <h4 className="text-base font-extrabold text-navy-deep">{t('guide.stage1Step3Title') || "3. Take action"}</h4>
                        <p className="text-xs sm:text-sm text-slate-body mt-1 leading-relaxed">
                          {t('guide.stage1Step3Desc') || "Approve proof · request edit · view tracking"}
                        </p>
                        <div className="mt-3">
                          <span className="inline-flex items-center gap-2 px-5 py-2 rounded-full text-xs font-bold btn-glass-primary !text-white shadow-md shadow-brand/20">
                            {t('guide.stage1SendRequest') || "Approve proof ➔"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right: Unique Non-Box Order Stream Radar SVG */}
                <div className="lg:col-span-6 flex items-center justify-center">
                  <div className="w-full relative flex items-center justify-center">
                    <OrderListingStreamSvg />
                  </div>
                </div>
              </div>
            </Reveal>
          </Container>
        </section>

        {/* ==================================================== */}
        {/* 4. TOPIC 2: CHANNEL CONNECTIONS (CRYPTO VAULT SVG)   */}
        {/* ==================================================== */}
        <section id="amazon-credentials-section" className="py-16 lg:py-20 bg-[#f8f9fc] scroll-mt-24 border-b border-[#0032ab]/10">
          <Container>
            <Reveal>
              <div className="grid lg:grid-cols-12 gap-10 lg:gap-14 items-center">
                {/* Left: Bespoke Non-Box Tri-Shield OAuth Vault SVG */}
                <div className="lg:col-span-6 order-2 lg:order-1 flex items-center justify-center">
                  <div className="w-full relative flex items-center justify-center">
                    <AmazonCredentialsConsoleSvg />
                  </div>
                </div>

                {/* Right: Content & Configuration Flow */}
                <div className="lg:col-span-6 space-y-6 order-1 lg:order-2">
                  <div>
                    <div className="section-badge mb-3">
                      <KeyRound className="h-3.5 w-3.5 text-brand shrink-0" />
                      <span>{t('guide.stage2Badge') || "Stage 02"}</span>
                    </div>
                    <h2 className="mt-3 text-3xl sm:text-4xl lg:text-[2.75rem] font-extrabold text-navy-deep tracking-tight leading-[1.15]">
                      {t('guide.stage2Title') || "Channel connections"}
                    </h2>
                    <p className="mt-3 text-base sm:text-lg leading-relaxed text-slate-body">
                      <strong>{t('guide.purposeTitle') || "Purpose"}:</strong> {t('guide.stage2Desc') || "Connect storefronts securely so orders and SKUs sync without manual CSV uploads."}
                    </p>
                  </div>

                  <div className="pt-2 space-y-4">
                    {/* Credential Step 1 */}
                    <div className="p-4 rounded-2xl liquid-glass border border-[#0032ab]/12 bg-white flex items-start gap-3.5 hover:border-[#0032ab]/30 transition-all">
                      <span className="h-8 w-8 rounded-xl bg-gradient-to-br from-[#0032ab] to-[#155dfc] text-white font-extrabold text-sm grid place-items-center shadow-xs shrink-0">
                        1
                      </span>
                      <div>
                        <h4 className="text-base font-extrabold text-navy-deep">{t('guide.stage2Step1Title') || "1. Connect store"}</h4>
                        <p className="text-xs sm:text-sm text-slate-body mt-1 leading-relaxed">
                          {t('guide.stage2Step1Desc') || "OAuth or API token · credentials stored securely"}
                        </p>
                        <div className="mt-2.5">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#0032ab]/10 text-brand border border-[#0032ab]/20">
                            {t('guide.stage2EncryptedToken') || "Encrypted token"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Credential Step 2 */}
                    <div className="p-4 rounded-2xl liquid-glass border border-[#0032ab]/12 bg-white flex items-start gap-3.5 hover:border-[#0032ab]/30 transition-all">
                      <span className="h-8 w-8 rounded-xl bg-gradient-to-br from-[#0032ab] to-[#155dfc] text-white font-extrabold text-sm grid place-items-center shadow-xs shrink-0">
                        2
                      </span>
                      <div>
                        <h4 className="text-base font-extrabold text-navy-deep">{t('guide.stage2Step2Title') || "2. Set rules & timing"}</h4>
                        <p className="text-xs sm:text-sm text-slate-body mt-1 leading-relaxed">
                          {t('guide.stage2Step2Desc') || "Choose auto-import · set proof SLA reminders"}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 mt-2.5">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200">
                            {t('guide.stage2AutoOnOff') || "Auto on/off"}
                          </span>
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-[#0032ab] bg-[#0032ab]/10 border border-[#0032ab]/20">
                            {t('guide.stage2Channel') || "DTC / B2B"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Credential Step 3 */}
                    <div className="p-4 rounded-2xl liquid-glass border border-[#0032ab]/12 bg-white flex items-start gap-3.5 hover:border-[#0032ab]/30 transition-all">
                      <span className="h-8 w-8 rounded-xl bg-gradient-to-br from-[#0032ab] to-[#155dfc] text-white font-extrabold text-sm grid place-items-center shadow-xs shrink-0">
                        3
                      </span>
                      <div>
                        <h4 className="text-base font-extrabold text-navy-deep">{t('guide.stage2Step3Title') || "3. Product mapping"}</h4>
                        <p className="text-xs sm:text-sm text-slate-body mt-1 leading-relaxed">
                          {t('guide.stage2Step3Desc') || "Map SKUs to cup, engrave, or apparel lines"}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 mt-2.5">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-brand bg-brand/10 border border-brand/20">
                            {t('guide.stage2ShippedOnly') || "✓ Active SKUs only"}
                          </span>
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white text-slate-600 border border-slate-200">
                            {t('guide.stage2AllProducts') || "Full catalog option"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Reveal>
          </Container>
        </section>

        {/* ==================================================== */}
        {/* 5. TOPIC 3: AUTOMATED CRON JOB FOR REMINDERS (SMART) */}
        {/* ==================================================== */}
        <section className="py-16 lg:py-20 bg-white border-b border-[#0032ab]/10">
          <Container>
            <Reveal>
              <div className="rounded-[2.5rem] liquid-glass bg-gradient-to-b from-white via-[#fbfdff] to-[#f4f8fe] p-8 sm:p-10 shadow-[0_16px_45px_rgba(0,50,171,0.06)] border border-[#0032ab]/15">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200/80">
                  <div>
                    <div className="section-badge mb-3">
                      <Zap className="h-3.5 w-3.5 text-brand shrink-0" />
                      <span>{t('guide.stage3Badge') || "Stage 03"}</span>
                    </div>
                    <h2 className="mt-3 text-3xl sm:text-4xl lg:text-[2.75rem] font-extrabold text-navy-deep tracking-tight leading-[1.15]">
                      {t('guide.stage3Title') || "Automated production reminders"}
                    </h2>
                  </div>
                </div>

                <p className="mt-4 text-base leading-relaxed text-slate-body max-w-3xl">
                  <strong>{t('guide.purposeTitle') || "Purpose"}:</strong> {t('guide.stage3Desc') || "Stay on schedule with automatic imports and proof deadlines - no manual spreadsheet chasing."}
                </p>

                <div className="mt-8 grid gap-6 lg:grid-cols-2">
                  <div className="relative overflow-hidden rounded-2xl liquid-glass border border-[#0032ab]/15 bg-white p-6 shadow-xs hover:border-[#0032ab]/35 hover:-translate-y-1 transition-all duration-300">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-[#0032ab] to-[#155dfc] text-white shadow-md shadow-[#0032ab]/20 grid place-items-center shrink-0">
                          <RefreshCw className="h-5 w-5 animate-[spin_8s_linear_infinite]" />
                        </div>
                        <div>
                          <p className="font-extrabold text-navy-deep text-base">{t('guide.orderFetchCronTitle') || "Order import sync"}</p>
                          <span className="text-xs font-bold text-[#0032ab]">{t('guide.stage3Cron1Tag') || "Continuous intake"}</span>
                        </div>
                      </div>
                      <span className="text-[11px] font-mono font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                        Active 5m
                      </span>
                    </div>
                    <p className="mt-4 text-sm text-slate-body leading-relaxed">
                      {t('guide.stage3Cron1Desc') || "Pulls new orders from connected channels so the studio queue always reflects live demand."}
                    </p>
                  </div>

                  <div className="relative overflow-hidden rounded-2xl liquid-glass border border-[#0032ab]/15 bg-white p-6 shadow-xs hover:border-[#0032ab]/35 hover:-translate-y-1 transition-all duration-300">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-[#155dfc] to-[#0ea5e9] text-white shadow-md shadow-[#155dfc]/20 grid place-items-center shrink-0">
                          <Clock className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-extrabold text-navy-deep text-base">{t('guide.feedbackRequestCronTitle') || "Proof reminder sync"}</p>
                          <span className="text-xs font-bold text-[#0032ab]">{t('guide.stage3Cron2Tag') || "Proof nudges"}</span>
                        </div>
                      </div>
                      <span className="text-[11px] font-mono font-bold text-[#0032ab] bg-[#0032ab]/10 px-3 py-1 rounded-full border border-[#0032ab]/20">
                        SLA Aware
                      </span>
                    </div>
                    <p className="mt-4 text-sm text-slate-body leading-relaxed">
                      {t('guide.stage3Cron2Desc') || "Reminds stakeholders when proofs need approval so engraving slots are not wasted."}
                    </p>
                  </div>
                </div>
              </div>
            </Reveal>
          </Container>
        </section>

        {/* ==================================================== */}
        {/* 6. TOPIC 4: VISUAL WORKFLOW (NON-BOX CONTINUOUS SVG) */}
        {/* ==================================================== */}
        <section id="visual-workflow-section" className="py-16 lg:py-20 bg-[#f8f9fc] scroll-mt-24 border-b border-[#0032ab]/10">
          <Container>
            <Reveal>
              <div className="grid lg:grid-cols-12 gap-10 lg:gap-14 items-center">
                {/* Left: Continuous Orbit Turbine SVG */}
                <div className="lg:col-span-7 flex items-center justify-center">
                  <div className="w-full relative flex items-center justify-center">
                    <VisualWorkflowPipelineSvg />
                  </div>
                </div>

                {/* Right: Architecture Summary & Key Connectors */}
                <div className="lg:col-span-5 space-y-6">
                  <div>
                    <div className="section-badge mb-3">
                      <Layers className="h-3.5 w-3.5 text-brand shrink-0" />
                      <span>{t('guide.stage4Badge') || "System architecture"}</span>
                    </div>
                    <h2 className="mt-3 text-3xl sm:text-4xl lg:text-[2.75rem] font-extrabold text-navy-deep tracking-tight leading-[1.15]">
                      {t('guide.stage4Title') || "Visual workflow"}
                    </h2>
                    <p className="mt-3 text-base leading-relaxed text-slate-body">
                      {t('guide.stage4Desc') || "How order listing, connections, settings, and automation link in one studio flow."}
                    </p>
                  </div>

                  <div className="space-y-3.5">
                    <div className="p-4 rounded-2xl liquid-glass bg-white border border-[#0032ab]/12 shadow-xs hover:border-[#0032ab]/30 hover:shadow-md transition-all flex items-start gap-3.5">
                      <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-[#0032ab] to-[#155dfc] text-white grid place-items-center shrink-0 mt-0.5 shadow-2xs">
                        <ShoppingBag className="h-4.5 w-4.5" />
                      </div>
                      <div>
                        <strong className="text-sm font-extrabold text-navy-deep">{t('guide.stage4Card1Title') || "Orders & connections"}</strong>
                        <p className="text-xs text-slate-body mt-0.5 leading-relaxed">
                          {t('guide.stage4Card1Desc') || "Channel filters and secure token storage for storefront sync."}
                        </p>
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl liquid-glass bg-white border border-[#0032ab]/12 shadow-xs hover:border-[#0032ab]/30 hover:shadow-md transition-all flex items-start gap-3.5">
                      <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-[#155dfc] to-[#0ea5e9] text-white grid place-items-center shrink-0 mt-0.5 shadow-2xs">
                        <RefreshCw className="h-4.5 w-4.5" />
                      </div>
                      <div>
                        <strong className="text-sm font-extrabold text-navy-deep">{t('guide.stage4Card2Title') || "Studio automation"}</strong>
                        <p className="text-xs text-slate-body mt-0.5 leading-relaxed">
                          {t('guide.stage4Card2Desc') || "Automated loop: Import order ➔ Send proof ➔ Unlock production."}
                        </p>
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl liquid-glass bg-white border border-[#0032ab]/12 shadow-xs hover:border-[#0032ab]/30 hover:shadow-md transition-all flex items-start gap-3.5">
                      <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-[#0032ab] to-[#06b6d4] text-white grid place-items-center shrink-0 mt-0.5 shadow-2xs">
                        <Sliders className="h-4.5 w-4.5" />
                      </div>
                      <div>
                        <strong className="text-sm font-extrabold text-navy-deep">{t('guide.stage4Card3Title') || "Rules & settings"}</strong>
                        <p className="text-xs text-slate-body mt-0.5 leading-relaxed">
                          {t('guide.stage4Card3Desc') || "Brand presets with scheduled proof reminders."}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Reveal>
          </Container>
        </section>
      </main>

      <Footer />
    </div>
  );
}

{/*
  ==========================================================================
  SVG 1: BESPOKE NON-SQUARE / NON-BOX ORDER INGESTION RADAR
  No boring spreadsheet tables • Aerodynamic flight-lanes & live radar scan
  ==========================================================================
*/}
function OrderListingStreamSvg() {
  return (
    <svg
      viewBox="0 0 540 370"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-auto select-none"
      role="img"
      aria-label="Gravurtastisch Multi-Channel Order Ingestion Radar Console"
    >
      <defs>
        <radialGradient id="radar-ambient-cyan" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.22" />
          <stop offset="70%" stopColor="#0284c7" stopOpacity="0.04" />
          <stop offset="100%" stopColor="#001855" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="radar-ambient-blue" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#4f6ef7" stopOpacity="0.24" />
          <stop offset="65%" stopColor="#0032ab" stopOpacity="0.06" />
          <stop offset="100%" stopColor="#001855" stopOpacity="0" />
        </radialGradient>

        <linearGradient id="lane-grad-active" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="60%" stopColor="#F8FAFC" />
          <stop offset="100%" stopColor="#EFF6FF" />
        </linearGradient>

        <linearGradient id="lane-border-blue" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#bfdbfe" />
          <stop offset="50%" stopColor="#155dfc" />
          <stop offset="100%" stopColor="#38bdf8" />
        </linearGradient>

        <filter id="radarGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="6" stdDeviation="12" floodColor="#155dfc" floodOpacity="0.18" />
        </filter>
      </defs>

      {/* Ambient Lighting */}
      <circle cx="270" cy="185" r="160" fill="url(#radar-ambient-cyan)" pointerEvents="none" />
      <circle cx="270" cy="185" r="120" fill="url(#radar-ambient-blue)" pointerEvents="none" />

      {/* Outer Chamfered Radar Reticle Frame */}
      <g filter="url(#radarGlow)">
        {/* Chamfered Polygonal HUD Ring (Non-Box) */}
        <polygon
          points="60,18 480,18 522,60 522,310 480,352 60,352 18,310 18,60"
          fill="#FFFFFF"
          stroke="#155dfc"
          strokeWidth="1.6"
          strokeOpacity="0.4"
        />
        <polygon
          points="64,24 476,24 516,64 516,306 476,346 64,346 24,306 24,64"
          fill="none"
          stroke="#0032ab"
          strokeWidth="0.8"
          strokeDasharray="4 4"
          strokeOpacity="0.25"
        />

        {/* Top Telemetry Header Ribbon */}
        <g transform="translate(42, 34)">
          <path d="M 0 0 L 140 0 L 155 24 L -15 24 Z" fill="rgba(0, 50, 171, 0.08)" stroke="#155dfc" strokeWidth="0.8" />
          <text x="65" y="16" textAnchor="middle" fill="#0032ab" fontFamily="monospace" fontSize="8.5" fontWeight="900">
            • STUDIO INTAKE RADAR
          </text>

          <g transform="translate(320, 2)">
            <rect x="0" y="0" width="125" height="20" rx="10" fill="#f8fafc" stroke="#bfdbfe" strokeWidth="0.8" />
            <circle cx="10" cy="10" r="3" fill="#10b981">
              <animate attributeName="opacity" values="1;0.3;1" dur="1s" repeatCount="indefinite" />
            </circle>
            <text x="66" y="14" textAnchor="middle" fill="#0032ab" fontFamily="monospace" fontSize="8" fontWeight="800">
              POLLING: 5m LIVE
            </text>
          </g>
        </g>

        {/* Aerodynamic Flight-Lane 1 (Active Order Ready for Action) */}
        <g transform="translate(38, 76)">
          <path
            d="M 12 0 L 452 0 C 462 0, 468 10, 462 20 L 452 56 C 448 62, 440 66, 432 66 L 0 66 C -8 66, -14 56, -8 46 L 2 10 C 6 4, 14 0, 12 0 Z"
            fill="url(#lane-grad-active)"
            stroke="url(#lane-border-blue)"
            strokeWidth="1.5"
          />
          <circle cx="22" cy="33" r="5" fill="#155dfc">
            <animate attributeName="r" values="4;6;4" dur="1.4s" repeatCount="indefinite" />
          </circle>
          <g transform="translate(38, 24)">
            <text x="0" y="0" fill="#0b132b" fontFamily="monospace" fontSize="11" fontWeight="900">#114-892314-9912</text>
            <text x="0" y="16" fill="#64748b" fontFamily="system-ui" fontSize="9" fontWeight="600">Echo ANC Earbuds Pro • Engraved Matte Case</text>
            <text x="0" y="30" fill="#155dfc" fontFamily="system-ui" fontSize="8" fontWeight="800">● Delivered 4d ago • Proof SLA Active</text>
          </g>
          {/* Flag & Channel */}
          <g transform="translate(265, 23)">
            <FlagDE x={0} y={0} width={15} height={10} />
            <text x="22" y="9" fill="#0b132b" fontFamily="system-ui" fontSize="8.5" fontWeight="800">DE Store</text>
          </g>
          {/* Action Capsule */}
          <g transform="translate(345, 18)">
            <rect x="0" y="0" width="105" height="30" rx="15" fill="#0032ab" stroke="#155dfc" strokeWidth="1" />
            <text x="52" y="19" textAnchor="middle" fill="#ffffff" fontFamily="system-ui" fontSize="9" fontWeight="900">
              Approve proof ➔
            </text>
          </g>
        </g>

        {/* Aerodynamic Flight-Lane 2 (Studio Dispatched) */}
        <g transform="translate(38, 156)">
          <path
            d="M 12 0 L 452 0 C 462 0, 468 10, 462 20 L 452 56 C 448 62, 440 66, 432 66 L 0 66 C -8 66, -14 56, -8 46 L 2 10 C 6 4, 14 0, 12 0 Z"
            fill="#FFFFFF"
            stroke="#e2e8f0"
            strokeWidth="1.2"
          />
          <circle cx="22" cy="33" r="4" fill="#10b981" />
          <g transform="translate(38, 24)">
            <text x="0" y="0" fill="#0b132b" fontFamily="monospace" fontSize="10.5" fontWeight="800">#112-748291-1024</text>
            <text x="0" y="16" fill="#64748b" fontFamily="system-ui" fontSize="9">Coffee Bean Grinder Pro • Precision Etch</text>
            <text x="0" y="30" fill="#10b981" fontFamily="system-ui" fontSize="8" fontWeight="700">✓ Laser Bed Dispatched (DHL Express)</text>
          </g>
          <g transform="translate(265, 23)">
            <FlagFR x={0} y={0} width={15} height={10} />
            <text x="22" y="9" fill="#0b132b" fontFamily="system-ui" fontSize="8.5" fontWeight="800">FR Store</text>
          </g>
          <g transform="translate(355, 20)">
            <rect x="0" y="0" width="95" height="26" rx="13" fill="#ecfdf5" stroke="#a7f3d0" strokeWidth="0.8" />
            <text x="47" y="17" textAnchor="middle" fill="#065f46" fontFamily="system-ui" fontSize="8.5" fontWeight="800">
              ✓ Dispatched
            </text>
          </g>
        </g>

        {/* Aerodynamic Flight-Lane 3 (Auto-Queued Run) */}
        <g transform="translate(38, 236)">
          <path
            d="M 12 0 L 452 0 C 462 0, 468 10, 462 20 L 452 56 C 448 62, 440 66, 432 66 L 0 66 C -8 66, -14 56, -8 46 L 2 10 C 6 4, 14 0, 12 0 Z"
            fill="#FFFFFF"
            stroke="#e2e8f0"
            strokeWidth="1.2"
          />
          <circle cx="22" cy="33" r="4" fill="#0ea5e9" />
          <g transform="translate(38, 24)">
            <text x="0" y="0" fill="#0b132b" fontFamily="monospace" fontSize="10.5" fontWeight="800">#114-382910-4491</text>
            <text x="0" y="16" fill="#64748b" fontFamily="system-ui" fontSize="9">Desk Mat XL • Tajima Embroidery</text>
            <text x="0" y="30" fill="#0284c7" fontFamily="system-ui" fontSize="8" fontWeight="700">⚡ Auto-Queued to Craft Line</text>
          </g>
          <g transform="translate(265, 23)">
            <FlagGB x={0} y={0} width={15} height={10} />
            <text x="22" y="9" fill="#0b132b" fontFamily="system-ui" fontSize="8.5" fontWeight="800">UK Store</text>
          </g>
          <g transform="translate(355, 20)">
            <rect x="0" y="0" width="95" height="26" rx="13" fill="#eff6ff" stroke="#bfdbfe" strokeWidth="0.8" />
            <text x="47" y="17" textAnchor="middle" fill="#0032ab" fontFamily="system-ui" fontSize="8.5" fontWeight="800">
              ⚡ In Craft Slot
            </text>
          </g>
        </g>

        {/* Bottom Status Ticker */}
        <g transform="translate(60, 316)">
          <text x="0" y="14" fill="#64748b" fontFamily="monospace" fontSize="8.5" fontWeight="700">
            AUTO-SYNC ENGINE // 100% STUDIO REALTIME • ZERO MANUAL CSV EXPORTS
          </text>
        </g>
      </g>
    </svg>
  );
}

{/*
  ==========================================================================
  SVG 2: ENTERPRISE OAUTH 2.0 & MULTI-CHANNEL SECURITY CONSOLE
  Smart, Rich, SaaS Gateway Console • Hex-chamfered chassis • Proper UI Shapes
  ==========================================================================
*/}
function AmazonCredentialsConsoleSvg() {
  return (
    <svg
      viewBox="0 0 540 400"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-auto select-none"
      role="img"
      aria-label="Gravurtastisch Cryptographic OAuth Vault and Channel Gateway Console"
    >
      <defs>
        <radialGradient id="console-bg-glow" cx="50%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.18" />
          <stop offset="50%" stopColor="#155dfc" stopOpacity="0.08" />
          <stop offset="100%" stopColor="#001855" stopOpacity="0" />
        </radialGradient>

        <linearGradient id="console-chassis-border" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="35%" stopColor="#155dfc" />
          <stop offset="70%" stopColor="#0032ab" />
          <stop offset="100%" stopColor="#60a5fa" />
        </linearGradient>

        <linearGradient id="vault-card-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="50%" stopColor="#F8FAFC" />
          <stop offset="100%" stopColor="#EFF6FF" />
        </linearGradient>

        <linearGradient id="cyber-pill-blue" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#0032ab" />
          <stop offset="100%" stopColor="#155dfc" />
        </linearGradient>

        <linearGradient id="cyber-pill-emerald" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#059669" />
          <stop offset="100%" stopColor="#10b981" />
        </linearGradient>

        <filter id="consoleGlow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="10" stdDeviation="16" floodColor="#155dfc" floodOpacity="0.16" />
        </filter>
        <filter id="cardInnerGlow" x="-5%" y="-5%" width="110%" height="110%">
          <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#0032ab" floodOpacity="0.06" />
        </filter>
      </defs>

      {/* Ambient Radial Backlight */}
      <rect x="0" y="0" width="540" height="400" rx="30" fill="url(#console-bg-glow)" pointerEvents="none" />

      {/* Main Console Chassis with Smooth Rounded Corners (No protruding lines) */}
      <g filter="url(#consoleGlow)">
        {/* Outer Clean Rounded Container */}
        <rect
          x="12"
          y="14"
          width="516"
          height="372"
          rx="24"
          fill="#FFFFFF"
          stroke="url(#console-chassis-border)"
          strokeWidth="1.8"
        />

        {/* ---------------------------------------------------- */}
        {/* CONSOLE HEADER: TELEMETRY & SECURITY STATUS          */}
        {/* ---------------------------------------------------- */}
        <g transform="translate(24, 28)">
          {/* Status Badge Left */}
          <rect x="0" y="0" width="176" height="26" rx="13" fill="#eff6ff" stroke="#bfdbfe" strokeWidth="1" />
          <circle cx="14" cy="13" r="4.5" fill="#10b981">
            <animate attributeName="opacity" values="1;0.4;1" dur="1.4s" repeatCount="indefinite" />
          </circle>
          <text x="26" y="17" fill="#0032ab" fontFamily="monospace" fontSize="9" fontWeight="800">
            SP-API GATEWAY: ONLINE
          </text>

          {/* Center Region Monospace Chip */}
          <rect x="186" y="0" width="138" height="26" rx="13" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="1" />
          <text x="255" y="16.5" textAnchor="middle" fill="#475569" fontFamily="monospace" fontSize="8.5" fontWeight="700">
            REGION: EU-WEST [DE,FR,UK]
          </text>

          {/* Right Security Encryption Tag */}
          <g transform="translate(334, 0)">
            <rect x="0" y="0" width="158" height="26" rx="13" fill="url(#cyber-pill-blue)" />
            <path
              d="M 16 8 C 21 8, 23 10, 23 13 C 23 18, 16 21, 16 21 C 16 21, 9 18, 9 13 C 9 10, 11 8, 16 8 Z"
              fill="#FFFFFF"
              opacity="0.9"
            />
            <text x="78" y="17" textAnchor="middle" fill="#FFFFFF" fontFamily="monospace" fontSize="8.5" fontWeight="900">
              AES-256 GCM SECURED
            </text>
          </g>
        </g>

        {/* ---------------------------------------------------- */}
        {/* PANEL 1: OAUTH 2.0 TOKEN VAULT (HIGH-TECH KEY CARD)  */}
        {/* ---------------------------------------------------- */}
        <g transform="translate(24, 66)" filter="url(#cardInnerGlow)">
          <rect
            x="0"
            y="0"
            width="492"
            height="112"
            rx="18"
            fill="url(#vault-card-grad)"
            stroke="#155dfc"
            strokeWidth="1.2"
            strokeOpacity="0.4"
          />

          {/* Vault Icon Disc */}
          <g transform="translate(16, 16)">
            <circle cx="20" cy="20" r="20" fill="url(#cyber-pill-blue)" />
            <path
              d="M 14 19 C 14 15.7 16.7 13 20 13 C 23.3 13 26 15.7 26 19 L 26 21 L 27 21 C 28.1 21 29 21.9 29 23 L 29 27 C 29 28.1 28.1 29 27 29 L 13 29 C 11.9 29 11 28.1 11 27 L 11 23 C 11 21.9 11.9 21 13 21 L 14 21 Z M 16 21 L 24 21 L 24 19 C 24 16.8 22.2 15 20 15 C 17.8 15 16 16.8 16 19 Z"
              fill="#FFFFFF"
            />
          </g>

          {/* Module Titles */}
          <g transform="translate(68, 22)">
            <text x="0" y="12" fill="#0b132b" fontFamily="system-ui" fontSize="13" fontWeight="900">
              01. OAuth 2.0 Encrypted Token Vault
            </text>
            <text x="0" y="27" fill="#64748b" fontFamily="system-ui" fontSize="9" fontWeight="600">
              Amazon Selling Partner (SP-API) Handshake · LWA Bearer Token Service
            </text>
          </g>

          {/* Live Encrypted Token Display Box (Light Color Theme) */}
          <g transform="translate(16, 62)">
            <rect x="0" y="0" width="460" height="36" rx="10" fill="#f0f5ff" stroke="#bfdbfe" strokeWidth="1" />
            <circle cx="16" cy="18" r="4.5" fill="#155dfc" />
            <text x="28" y="22.5" fill="#0032ab" fontFamily="monospace" fontSize="10.5" fontWeight="800">
              amzn.lwa.oa2.at.pv2.1a98c••••••••••••72xQ
            </text>
            {/* Locked Badge */}
            <g transform="translate(320, 6)">
              <rect x="0" y="0" width="130" height="24" rx="6" fill="#ecfdf5" stroke="#a7f3d0" strokeWidth="1" />
              <circle cx="12" cy="12" r="3.5" fill="#10b981" />
              <text x="70" y="16" textAnchor="middle" fill="#047857" fontFamily="monospace" fontSize="8.5" fontWeight="900">
                LOCKED · ROTATES 1h
              </text>
            </g>
          </g>
        </g>

        {/* ---------------------------------------------------- */}
        {/* PANEL 2: RULES & TIMING (LEFT LOWER CARD)            */}
        {/* ---------------------------------------------------- */}
        <g transform="translate(24, 192)" filter="url(#cardInnerGlow)">
          <rect
            x="0"
            y="0"
            width="238"
            height="148"
            rx="18"
            fill="url(#vault-card-grad)"
            stroke="#0ea5e9"
            strokeWidth="1.2"
            strokeOpacity="0.4"
          />

          {/* Card Header */}
          <g transform="translate(14, 14)">
            <circle cx="14" cy="14" r="14" fill="#f0f9ff" stroke="#bae6fd" strokeWidth="1" />
            {/* Clock icon */}
            <circle cx="14" cy="14" r="7" stroke="#0284c7" strokeWidth="1.5" fill="none" />
            <path d="M 14 10 L 14 14 L 17 16" stroke="#0284c7" strokeWidth="1.5" strokeLinecap="round" />
            <text x="36" y="13" fill="#0b132b" fontFamily="system-ui" fontSize="11" fontWeight="900">
              02. Rules &amp; Timing
            </text>
            <text x="36" y="24" fill="#64748b" fontFamily="system-ui" fontSize="8.5" fontWeight="600">
              Scheduled Fetch Engine
            </text>
          </g>

          {/* Setting Row 1: Auto-Import Toggle */}
          <g transform="translate(14, 56)">
            <rect x="0" y="0" width="210" height="28" rx="8" fill="#FFFFFF" stroke="#e2e8f0" strokeWidth="0.8" />
            <text x="10" y="18" fill="#334155" fontFamily="system-ui" fontSize="9" fontWeight="700">
              Auto-Import Loop
            </text>
            {/* Switch Pill ON */}
            <g transform="translate(148, 4)">
              <rect x="0" y="0" width="52" height="20" rx="10" fill="#0032ab" />
              <circle cx="41" cy="10" r="7.5" fill="#FFFFFF" />
              <text x="18" y="13.5" textAnchor="middle" fill="#FFFFFF" fontFamily="monospace" fontSize="7.5" fontWeight="900">
                ON
              </text>
            </g>
          </g>

          {/* Setting Row 2: Cron Interval */}
          <g transform="translate(14, 90)">
            <rect x="0" y="0" width="210" height="42" rx="8" fill="#FFFFFF" stroke="#e2e8f0" strokeWidth="0.8" />
            <text x="10" y="16" fill="#0284c7" fontFamily="monospace" fontSize="8.5" fontWeight="900">
              CRON: 09:00 AM • 5M PULSE
            </text>
            <text x="10" y="30" fill="#64748b" fontFamily="system-ui" fontSize="8" fontWeight="600">
              SLA Reminder: 24h Auto-Escalate
            </text>
            <rect x="156" y="10" width="46" height="20" rx="4" fill="#eff6ff" stroke="#bfdbfe" strokeWidth="0.8" />
            <text x="179" y="23" textAnchor="middle" fill="#0032ab" fontFamily="monospace" fontSize="8" fontWeight="800">
              DTC/B2B
            </text>
          </g>
        </g>

        {/* ---------------------------------------------------- */}
        {/* PANEL 3: SKU & PRODUCT MAPPING (RIGHT LOWER CARD)    */}
        {/* ---------------------------------------------------- */}
        <g transform="translate(278, 192)" filter="url(#cardInnerGlow)">
          <rect
            x="0"
            y="0"
            width="238"
            height="148"
            rx="18"
            fill="url(#vault-card-grad)"
            stroke="#10b981"
            strokeWidth="1.2"
            strokeOpacity="0.4"
          />

          {/* Card Header */}
          <g transform="translate(14, 14)">
            <circle cx="14" cy="14" r="14" fill="#ecfdf5" stroke="#a7f3d0" strokeWidth="1" />
            {/* Target Reticle Icon */}
            <circle cx="14" cy="14" r="7" stroke="#059669" strokeWidth="1.5" fill="none" />
            <circle cx="14" cy="14" r="2.5" fill="#10b981" />
            <text x="36" y="13" fill="#0b132b" fontFamily="system-ui" fontSize="11" fontWeight="900">
              03. Product Mapping
            </text>
            <text x="36" y="24" fill="#64748b" fontFamily="system-ui" fontSize="8.5" fontWeight="600">
              SKU Routing &amp; Material Filter
            </text>
          </g>

          {/* Mapping Progress Bars */}
          <g transform="translate(14, 56)">
            {/* Line 1: Tumblers / Laser */}
            <text x="0" y="8" fill="#334155" fontFamily="system-ui" fontSize="8" fontWeight="700">
              Laser Tumblers &amp; Cups
            </text>
            <text x="210" y="8" textAnchor="end" fill="#059669" fontFamily="monospace" fontSize="8" fontWeight="800">
              99.4% Mapped
            </text>
            <rect x="0" y="13" width="210" height="6" rx="3" fill="#e2e8f0" />
            <rect x="0" y="13" width="208" height="6" rx="3" fill="url(#cyber-pill-emerald)" />

            {/* Line 2: Coasters / Wood */}
            <text x="0" y="32" fill="#334155" fontFamily="system-ui" fontSize="8" fontWeight="700">
              Coaster Sets &amp; Woodcraft
            </text>
            <text x="210" y="32" textAnchor="end" fill="#059669" fontFamily="monospace" fontSize="8" fontWeight="800">
              100% Active
            </text>
            <rect x="0" y="37" width="210" height="6" rx="3" fill="#e2e8f0" />
            <rect x="0" y="37" width="210" height="6" rx="3" fill="url(#cyber-pill-emerald)" />

            {/* Protection Badge */}
            <g transform="translate(0, 52)">
              <rect x="0" y="0" width="210" height="22" rx="6" fill="#ecfdf5" stroke="#a7f3d0" strokeWidth="0.8" />
              <text x="105" y="15" textAnchor="middle" fill="#047857" fontFamily="system-ui" fontSize="8.5" fontWeight="800">
                ✓ Active SKUs Only · Zero Misprint Risk
              </text>
            </g>
          </g>
        </g>

        {/* ---------------------------------------------------- */}
        {/* BOTTOM TELEMETRY BUS TICKER                          */}
        {/* ---------------------------------------------------- */}
        <g transform="translate(24, 352)">
          <rect x="0" y="0" width="492" height="24" rx="12" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="0.8" />
          <text x="246" y="16" textAnchor="middle" fill="#64748b" fontFamily="monospace" fontSize="8" fontWeight="800">
            AUTO-SYNC ENGINE // 100% DATA ISOLATION // ZERO MANUAL CSV SPREADSHEETS
          </text>
        </g>
      </g>
    </svg>
  );
}

{/*
  ==========================================================================
  SVG 3: ENTERPRISE STUDIO VISUAL WORKFLOW CONTROL DAG PIPELINE
  Smart Multi-Stage Architecture • Step Conduits • Zero Wireframe Ellipses
  ==========================================================================
*/}
function VisualWorkflowPipelineSvg() {
  return (
    <svg
      viewBox="0 0 600 400"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-auto select-none"
      role="img"
      aria-label="Gravurtastisch Unified Studio Workflow DAG Pipeline Architecture"
    >
      <defs>
        <radialGradient id="dag-glow" cx="50%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.16" />
          <stop offset="60%" stopColor="#155dfc" stopOpacity="0.06" />
          <stop offset="100%" stopColor="#001855" stopOpacity="0" />
        </radialGradient>

        <linearGradient id="dag-frame-border" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="30%" stopColor="#155dfc" />
          <stop offset="70%" stopColor="#0032ab" />
          <stop offset="100%" stopColor="#38bdf8" />
        </linearGradient>

        <linearGradient id="stage-card-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#F8FAFC" />
        </linearGradient>

        <linearGradient id="pipe-bus-grad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#0032ab" />
          <stop offset="35%" stopColor="#155dfc" />
          <stop offset="70%" stopColor="#0ea5e9" />
          <stop offset="100%" stopColor="#10b981" />
        </linearGradient>

        <filter id="dagGlow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="10" stdDeviation="16" floodColor="#155dfc" floodOpacity="0.16" />
        </filter>
        <filter id="stepShadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="4" stdDeviation="8" floodColor="#0032ab" floodOpacity="0.08" />
        </filter>
      </defs>

      {/* Ambient Lighting */}
      <rect x="0" y="0" width="600" height="400" rx="30" fill="url(#dag-glow)" pointerEvents="none" />

      {/* Main Console Chassis with Ergonomic Rounded Chamfers */}
      <g filter="url(#dagGlow)">
        <rect
          x="12"
          y="12"
          width="576"
          height="376"
          rx="24"
          fill="#FFFFFF"
          stroke="url(#dag-frame-border)"
          strokeWidth="1.8"
        />

        {/* ---------------------------------------------------- */}
        {/* HEADER: STUDIO WORKFLOW ENGINE TELEMETRY BAR         */}
        {/* ---------------------------------------------------- */}
        <g transform="translate(26, 26)">
          <rect x="0" y="0" width="230" height="26" rx="13" fill="#eff6ff" stroke="#bfdbfe" strokeWidth="1" />
          <circle cx="14" cy="13" r="4.5" fill="#155dfc">
            <animate attributeName="opacity" values="1;0.3;1" dur="1.2s" repeatCount="indefinite" />
          </circle>
          <text x="26" y="17" fill="#0032ab" fontFamily="monospace" fontSize="8.5" fontWeight="800">
            • STUDIO WORKFLOW ENGINE // DAG
          </text>

          <g transform="translate(242, 0)">
            <rect x="0" y="0" width="154" height="26" rx="13" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="1" />
            <text x="77" y="16.5" textAnchor="middle" fill="#475569" fontFamily="monospace" fontSize="8.5" fontWeight="700">
              100% UNIFIED FLOW
            </text>
          </g>

          <g transform="translate(408, 0)">
            <rect x="0" y="0" width="140" height="26" rx="13" fill="#ecfdf5" stroke="#a7f3d0" strokeWidth="1" />
            <circle cx="14" cy="13" r="4" fill="#10b981" />
            <text x="24" y="17" fill="#047857" fontFamily="monospace" fontSize="8.5" fontWeight="800">
              ZERO CSV CHAOS
            </text>
          </g>
        </g>

        {/* ---------------------------------------------------- */}
        {/* CONNECTING FIBER-OPTIC PIPELINE BUS (BEHIND CARDS)   */}
        {/* ---------------------------------------------------- */}
        <g transform="translate(0, 134)">
          {/* Main Bus Track */}
          <line x1="50" y1="0" x2="550" y2="0" stroke="#e2e8f0" strokeWidth="6" strokeLinecap="round" />
          <line
            x1="50"
            y1="0"
            x2="550"
            y2="0"
            stroke="url(#pipe-bus-grad)"
            strokeWidth="3.5"
            strokeDasharray="10 8"
            strokeLinecap="round"
          >
            <animate attributeName="stroke-dashoffset" values="0;-36" dur="1.8s" repeatCount="indefinite" />
          </line>
        </g>

        {/* ---------------------------------------------------- */}
        {/* 4 HORIZONTAL MILESTONE WORKFLOW STATIONS (30PX GAPS) */}
        {/* ---------------------------------------------------- */}

        {/* --- STAGE 01: ORDER INTAKE --- */}
        <g transform="translate(28, 66)" filter="url(#stepShadow)">
          <rect x="0" y="0" width="112" height="136" rx="16" fill="url(#stage-card-grad)" stroke="#0032ab" strokeWidth="1.5" />
          {/* Step Pill */}
          <rect x="10" y="10" width="52" height="20" rx="10" fill="#0032ab" />
          <text x="36" y="23.5" textAnchor="middle" fill="#FFFFFF" fontFamily="monospace" fontSize="8.5" fontWeight="900">
            01 IN
          </text>
          {/* Station Titles */}
          <text x="10" y="48" fill="#0b132b" fontFamily="system-ui" fontSize="11" fontWeight="900">
            Order Listing
          </text>
          <text x="10" y="62" fill="#64748b" fontFamily="system-ui" fontSize="8" fontWeight="600">
            SP-API Intake
          </text>
          {/* Micro Live Queue UI */}
          <g transform="translate(8, 72)">
            <rect x="0" y="0" width="96" height="24" rx="6" fill="#f1f5f9" />
            <text x="6" y="15.5" fill="#1e293b" fontFamily="monospace" fontSize="7.5" fontWeight="700">
              #114-8923 DE
            </text>
          </g>
          <g transform="translate(8, 102)">
            <rect x="0" y="0" width="96" height="22" rx="6" fill="#eff6ff" stroke="#bfdbfe" strokeWidth="0.8" />
            <circle cx="9" cy="11" r="3" fill="#155dfc" />
            <text x="16" y="15" fill="#0032ab" fontFamily="monospace" fontSize="7" fontWeight="800">
              5m Poll Stream
            </text>
          </g>
        </g>

        {/* Chevron Connector 1 -> 2 (Floating with 7px margin on both sides) */}
        <g transform="translate(146, 125)">
          <circle cx="9" cy="9" r="9" fill="#FFFFFF" stroke="#155dfc" strokeWidth="1.4" />
          <path d="M 7 5 L 11 9 L 7 13" stroke="#155dfc" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </g>

        {/* --- STAGE 02: CREDENTIALS --- */}
        <g transform="translate(170, 66)" filter="url(#stepShadow)">
          <rect x="0" y="0" width="112" height="136" rx="16" fill="url(#stage-card-grad)" stroke="#155dfc" strokeWidth="1.5" />
          {/* Step Pill */}
          <rect x="10" y="10" width="56" height="20" rx="10" fill="#155dfc" />
          <text x="38" y="23.5" textAnchor="middle" fill="#FFFFFF" fontFamily="monospace" fontSize="8.5" fontWeight="900">
            02 AUTH
          </text>
          {/* Station Titles */}
          <text x="10" y="48" fill="#0b132b" fontFamily="system-ui" fontSize="11" fontWeight="900">
            Credentials
          </text>
          <text x="10" y="62" fill="#64748b" fontFamily="system-ui" fontSize="8" fontWeight="600">
            OAuth 2.0 Vault
          </text>
          {/* Micro Status UI (Light Color) */}
          <g transform="translate(8, 72)">
            <rect x="0" y="0" width="96" height="24" rx="6" fill="#f0f5ff" stroke="#bfdbfe" strokeWidth="0.8" />
            <text x="6" y="15.5" fill="#0032ab" fontFamily="monospace" fontSize="7.5" fontWeight="800">
              amzn.lwa.oa2••
            </text>
          </g>
          <g transform="translate(8, 102)">
            <rect x="0" y="0" width="96" height="22" rx="6" fill="#ecfdf5" stroke="#a7f3d0" strokeWidth="0.8" />
            <circle cx="9" cy="11" r="3" fill="#10b981" />
            <text x="16" y="15" fill="#047857" fontFamily="monospace" fontSize="7" fontWeight="800">
              AES Protected
            </text>
          </g>
        </g>

        {/* Chevron Connector 2 -> 3 (Floating with 7px margin on both sides) */}
        <g transform="translate(288, 125)">
          <circle cx="9" cy="9" r="9" fill="#FFFFFF" stroke="#0ea5e9" strokeWidth="1.4" />
          <path d="M 7 5 L 11 9 L 7 13" stroke="#0ea5e9" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </g>

        {/* --- STAGE 03: RULES & SLA --- */}
        <g transform="translate(312, 66)" filter="url(#stepShadow)">
          <rect x="0" y="0" width="112" height="136" rx="16" fill="url(#stage-card-grad)" stroke="#0ea5e9" strokeWidth="1.5" />
          {/* Step Pill */}
          <rect x="10" y="10" width="58" height="20" rx="10" fill="#0ea5e9" />
          <text x="39" y="23.5" textAnchor="middle" fill="#FFFFFF" fontFamily="monospace" fontSize="8.5" fontWeight="900">
            03 RULES
          </text>
          {/* Station Titles */}
          <text x="10" y="48" fill="#0b132b" fontFamily="system-ui" fontSize="11" fontWeight="900">
            Rules &amp; SLA
          </text>
          <text x="10" y="62" fill="#64748b" fontFamily="system-ui" fontSize="8" fontWeight="600">
            Proof Auto-Throttle
          </text>
          {/* Micro Status UI */}
          <g transform="translate(8, 72)">
            <rect x="0" y="0" width="96" height="24" rx="6" fill="#f0f9ff" />
            <text x="6" y="15.5" fill="#0284c7" fontFamily="monospace" fontSize="7.5" fontWeight="700">
              09:00 AM Cron
            </text>
          </g>
          <g transform="translate(8, 102)">
            <rect x="0" y="0" width="96" height="22" rx="6" fill="#fef3c7" stroke="#fde68a" strokeWidth="0.8" />
            <circle cx="9" cy="11" r="3" fill="#d97706" />
            <text x="16" y="15" fill="#92400e" fontFamily="monospace" fontSize="7" fontWeight="800">
              Proof SLA Alert
            </text>
          </g>
        </g>

        {/* Chevron Connector 3 -> 4 (Floating with 7px margin on both sides) */}
        <g transform="translate(430, 125)">
          <circle cx="9" cy="9" r="9" fill="#FFFFFF" stroke="#10b981" strokeWidth="1.4" />
          <path d="M 7 5 L 11 9 L 7 13" stroke="#10b981" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </g>

        {/* --- STAGE 04: AUTOMATED CRAFT LOOP --- */}
        <g transform="translate(454, 66)" filter="url(#stepShadow)">
          <rect x="0" y="0" width="112" height="136" rx="16" fill="url(#stage-card-grad)" stroke="#10b981" strokeWidth="1.5" />
          {/* Step Pill */}
          <rect x="10" y="10" width="56" height="20" rx="10" fill="#10b981" />
          <text x="38" y="23.5" textAnchor="middle" fill="#FFFFFF" fontFamily="monospace" fontSize="8.5" fontWeight="900">
            04 CRAFT
          </text>
          {/* Station Titles */}
          <text x="10" y="48" fill="#0b132b" fontFamily="system-ui" fontSize="11" fontWeight="900">
            Studio Loop
          </text>
          <text x="10" y="62" fill="#64748b" fontFamily="system-ui" fontSize="8" fontWeight="600">
            Laser &amp; Craft Queue
          </text>
          {/* Micro Status UI */}
          <g transform="translate(8, 72)">
            <rect x="0" y="0" width="96" height="24" rx="6" fill="#ecfdf5" />
            <text x="6" y="15.5" fill="#059669" fontFamily="monospace" fontSize="7.5" fontWeight="700">
              Laser Bed Slot 1
            </text>
          </g>
          <g transform="translate(8, 102)">
            <rect x="0" y="0" width="96" height="22" rx="6" fill="#eff6ff" stroke="#bfdbfe" strokeWidth="0.8" />
            <circle cx="9" cy="11" r="3" fill="#155dfc" />
            <text x="16" y="15" fill="#0032ab" fontFamily="monospace" fontSize="7" fontWeight="800">
              Auto Dispatched
            </text>
          </g>
        </g>

        {/* ---------------------------------------------------- */}
        {/* DESCENT CONDUITS: FEEDING INTO OUTPUT STAGE 05       */}
        {/* ---------------------------------------------------- */}
        <path
          d="M 510 202 L 510 226 C 510 234, 500 238, 490 238 L 85 238 C 75 238, 65 244, 65 252 L 65 260"
          fill="none"
          stroke="url(#pipe-bus-grad)"
          strokeWidth="2.5"
          strokeDasharray="6 6"
        >
          <animate attributeName="stroke-dashoffset" values="0;-24" dur="1.2s" repeatCount="indefinite" />
        </path>

        {/* ---------------------------------------------------- */}
        {/* STAGE 05: VERIFIED FULFILLMENT & 5-STAR REVIEW LOOP  */}
        {/* (Clean, Generously Spaced Layout - ZERO Text Cutoff) */}
        {/* ---------------------------------------------------- */}
        <g transform="translate(28, 252)" filter="url(#stepShadow)">
          <rect
            x="0"
            y="0"
            width="538"
            height="110"
            rx="18"
            fill="url(#stage-card-grad)"
            stroke="#f59e0b"
            strokeWidth="1.5"
          />

          {/* Left Sub-Section: Carrier Dispatch Tracking */}
          <g transform="translate(18, 14)">
            {/* Header Line: Pill + Title with clear separation */}
            <rect x="0" y="0" width="82" height="22" rx="11" fill="#f59e0b" />
            <text x="41" y="15" textAnchor="middle" fill="#FFFFFF" fontFamily="monospace" fontSize="8.5" fontWeight="900">
              05 VERIFIED
            </text>
            <text x="92" y="16" fill="#0b132b" fontFamily="system-ui" fontSize="12" fontWeight="900">
              Verified Delivery &amp; Feedback
            </text>

            {/* Description lines */}
            <text x="0" y="38" fill="#475569" fontFamily="system-ui" fontSize="8.5" fontWeight="600">
              Automated DHL/UPS carrier tracking confirmation
            </text>
            <text x="0" y="50" fill="#475569" fontFamily="system-ui" fontSize="8.5" fontWeight="600">
              pushed to Amazon SP-API storefront instantly.
            </text>

            {/* Barcode Visual Representation */}
            <g transform="translate(0, 58)">
              <rect x="0" y="0" width="250" height="24" rx="6" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="0.8" />
              <text x="10" y="16" fill="#0b132b" fontFamily="monospace" fontSize="7.5" fontWeight="800">
                TRACK: DHL-DE-9941829410294 [✓ CONFIRMED]
              </text>
            </g>
          </g>

          {/* Right Sub-Section: 5-Star Feedback Flywheel (Starts at 292px) */}
          <g transform="translate(292, 14)">
            <rect x="0" y="0" width="230" height="82" rx="12" fill="#fffbeb" stroke="#fde68a" strokeWidth="1" />
            <g transform="translate(14, 14)">
              {/* Star Rating Graphic */}
              <text x="0" y="14" fill="#d97706" fontFamily="system-ui" fontSize="14" fontWeight="900">
                ★ ★ ★ ★ ★
              </text>
              <text x="96" y="13" fill="#b45309" fontFamily="monospace" fontSize="8.5" fontWeight="900">
                5.0 RATING
              </text>
              <text x="0" y="32" fill="#78350f" fontFamily="system-ui" fontSize="9" fontWeight="700">
                Automated Review Request Sent
              </text>
              <text x="0" y="46" fill="#92400e" fontFamily="system-ui" fontSize="8" fontWeight="500">
                Proof-first customer satisfaction = zero refund risk
              </text>
            </g>
          </g>
        </g>
      </g>
    </svg>
  );
}

