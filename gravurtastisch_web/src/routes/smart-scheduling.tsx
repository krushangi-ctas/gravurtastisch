import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Nav } from "@/components/site/Nav";
import { Footer } from "@/components/site/Footer";
import { Container } from "@/components/site/Container";
import { Reveal } from "@/components/site/Reveal";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  CalendarClock,
  Clock,
  Zap,
  ShieldCheck,
  TrendingUp,
  SunMedium,
  CheckCircle2,
  HelpCircle,
  ArrowRight,
  Sparkles,
  Sliders,
  BellRing,
  Headphones,
  Pill,
  Star,
  Check,
  Shield,
  Layers,
  Sparkle
} from "lucide-react";
import { ServicePageSkeleton } from "@/components/skeletons/ServicePageSkeleton";
import { FlagDE, FlagFR, FlagGB, FlagIcon } from "@/components/ui/FlagIcon";

export const Route = createFileRoute("/smart-scheduling")({
  pendingComponent: ServicePageSkeleton,
  head: () => ({
    meta: [
      { title: "Smart Scheduling for Amazon Custom orders | Gravurtastisch" },
      {
        name: "description",
        content:
          "Intelligent production job timing compliant with Amazon's 5-30 day window. Optimize open rates with buyer timezone scheduling and product category delay algorithms.",
      },
      { property: "og:title", content: "Smart Scheduling & Amazon Compliance | Gravurtastisch" },
      {
        property: "og:description",
        content:
          "Send production jobs at the optimal moment inside Amazon's 5-30 day post-delivery window for maximum conversion lift.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/smart-scheduling" },
    ],
    links: [{ rel: "canonical", href: "/smart-scheduling" }],
  }),
  component: SmartSchedulingPage,
});

function SmartSchedulingPage() {
  const { t } = useTranslation();
  const isSkeletonPreview = typeof window !== "undefined" && window.location.search.includes("skeleton=true");

  if (isSkeletonPreview) {
    return <ServicePageSkeleton />;
  }

  const timelinePhases = [
    {
      day: "Day 0",
      title: t('smartScheduling.phase0Title') || "Order received",
      desc: t('smartScheduling.phase0Desc') || "Checkout completes and personalization fields sync to the studio queue.",
      color: "bg-[#0032ab]/10 text-[#0032ab] border-[#0032ab]/20",
    },
    {
      day: "Days 1-3",
      title: t('smartScheduling.phase1Title') || "Proof delivered",
      desc: t('smartScheduling.phase1Desc') || "Digital mockup sent. Timer starts for your approval window.",
      color: "bg-[#155dfc]/10 text-[#155dfc] border-[#155dfc]/25",
    },
    {
      day: "Days 3-5",
      title: t('smartScheduling.phase2Title') || "Cool-down & revisions",
      desc: t('smartScheduling.phase2Desc') || "Request tweaks without restarting the whole order - version history stays attached.",
      color: "bg-indigo-50 text-indigo-700 border-indigo-200",
    },
    {
      day: "Days 5-8",
      title: t('smartScheduling.phase3Title') || "Production window",
      desc: t('smartScheduling.phase3Desc') || "Laser, print, or stitch runs in a reserved slot with QC before pack-out.",
      color: "bg-emerald-50 text-emerald-700 border-emerald-200",
    },
    {
      day: "Day 30+",
      title: t('smartScheduling.phase4Title') || "Ship by promise",
      desc: t('smartScheduling.phase4Desc') || "Carrier pickup aligned to your quoted delivery date and region.",
      color: "bg-slate-100 text-slate-700 border-slate-200",
    },
  ];

  const faqs = [
    {
      q: t('smartScheduling.faq1Q') || "Why can't production start immediately?",
      a: t('smartScheduling.faq1A') || "Custom work needs an approved mockup. Starting early would risk wrong text placement, bad crops, or non-refundable material waste.",
    },
    {
      q: t('smartScheduling.faq2Q') || "Can I set different lead times per product?",
      a: t('smartScheduling.faq2A') || "Yes - configure defaults per product line or SKU so ship estimates match real craft duration.",
    },
    {
      q: t('smartScheduling.faq3Q') || "How do you handle holiday peaks?",
      a: t('smartScheduling.faq3A') || "Capacity rules tighten automatically and we surface honest cutoffs on checkout integrations where supported.",
    },
    {
      q: t('smartScheduling.faq4Q') || "Can customers see live proof status?",
      a: t('smartScheduling.faq4A') || "Yes - shareable proof links let buyers approve or comment without logging into your full order desk.",
    },
  ];

  return (
    <div className="min-h-screen bg-background text-navy-deep overflow-x-hidden w-full max-w-full">
      <Nav />

      <main className="pb-8 w-full max-w-full overflow-x-hidden">
        {/* Hero Section */}
        <section className="relative overflow-hidden pt-24 pb-12 lg:pt-28 lg:pb-16 bg-gradient-to-b from-[#c6dbf2] via-[#d5e4f7] to-[#bfd6f0] text-slate-800 w-full max-w-full">
          <div className="absolute inset-0 grid-bg opacity-15 pointer-events-none" />
          <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-brand/10 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-[#155dfc]/10 blur-3xl pointer-events-none" />

          <Container className="relative max-w-5xl mx-auto text-center">
            <Reveal className="max-w-4xl mx-auto flex flex-col items-center">
              <div className="section-badge mb-4">
                <CalendarClock className="h-3.5 w-3.5 text-brand shrink-0" />
                <span>{t('smartScheduling.heroBadge') || "Smart production timing"}</span>
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-[3.25rem] font-extrabold tracking-tight leading-[1.1] text-navy-deep text-center">
                <span>{t('smartScheduling.heroTitle') || "Scheduling for"}</span>{" "}
                <span className="bg-gradient-to-r from-[#0032ab] via-[#2563eb] to-[#7c3aed] text-transparent bg-clip-text">
                  {t('smartScheduling.heroTitleHighlight') || "on-time delivery"}
                </span>
              </h1>
              <p className="mt-4 text-slate-700 text-base sm:text-lg leading-relaxed max-w-2xl font-medium text-center mx-auto">
                {t('smartScheduling.heroDesc') || "Balance proof SLAs, craft capacity, and carrier cutoffs - so personalized orders arrive when you promised, not when chaos allows."}
              </p>
              <div className="mt-7 flex flex-wrap justify-center items-center gap-4">
                <a
                  href="/#register"
                  className="inline-flex items-center gap-2 rounded-full btn-glass-primary px-7 py-3 text-sm font-bold !text-white shadow-lg shadow-brand/30 hover:-translate-y-0.5 transition-all"
                >
                  {t('smartScheduling.heroCtaRegister') || "Enable smart scheduling"}
                  <ArrowRight className="h-4 w-4" />
                </a>
                <a
                  href="#timeline"
                  className="inline-flex items-center gap-2 rounded-full bg-white border border-[#0032ab]/20 px-7 py-3 text-sm font-semibold text-navy-deep hover:bg-slate-50 transition-all shadow-xs"
                >
                  {t('smartScheduling.heroCtaHow') || "Explore production timeline"}
                </a>
              </div>
            </Reveal>

            {/* Chrono Dial & Timing Telemetry Meters with Liquid Glass */}
            <div className="mt-10 sm:mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 border-t border-[#0032ab]/15 pt-8 text-left">
              {/* Chrono Dial 1: On-time proofs */}
              <Reveal delay={50}>
                <div className="group relative rounded-2xl sm:rounded-3xl liquid-glass border border-white/80 p-5 sm:p-6 shadow-[0_8px_30px_rgba(0,50,171,0.06)] hover:shadow-[0_16px_40px_rgba(0,50,171,0.12)] transition-all duration-300 flex items-center gap-4 hover:-translate-y-1">
                  <div className="relative h-13 w-13 shrink-0 flex items-center justify-center">
                    <svg className="h-13 w-13 -rotate-90" viewBox="0 0 48 48">
                      <circle cx="24" cy="24" r="18" fill="none" stroke="#e2e8f0" strokeWidth="3.5" />
                      <circle
                        cx="24"
                        cy="24"
                        r="18"
                        fill="none"
                        stroke="#0284c7"
                        strokeWidth="3.5"
                        strokeDasharray="113"
                        strokeDashoffset="34"
                        strokeLinecap="round"
                        className="transition-all duration-700"
                      />
                    </svg>
                    <span className="absolute text-[11px] font-black text-sky-600 font-mono">+38%</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-sky-500 animate-pulse" />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-sky-700">{t('smartScheduling.chrono1Tag') || "Faster approvals"}</span>
                    </div>
                    <p className="text-sm font-bold text-navy-deep mt-0.5">{t('smartScheduling.chrono1Title') || "On-time proofs"}</p>
                    <p className="text-[10.5px] text-slate-500">{t('smartScheduling.chrono1Sub') || "SLA-aware queue"}</p>
                  </div>
                </div>
              </Reveal>

              {/* Chrono Dial 2: Capacity safe */}
              <Reveal delay={100}>
                <div className="group relative rounded-2xl sm:rounded-3xl liquid-glass border border-white/80 p-5 sm:p-6 shadow-[0_8px_30px_rgba(0,50,171,0.06)] hover:shadow-[0_16px_40px_rgba(0,50,171,0.12)] transition-all duration-300 flex items-center gap-4 hover:-translate-y-1">
                  <div className="relative h-13 w-13 shrink-0 flex items-center justify-center">
                    <svg className="h-13 w-13 -rotate-90" viewBox="0 0 48 48">
                      <circle cx="24" cy="24" r="18" fill="none" stroke="#e2e8f0" strokeWidth="3.5" />
                      <circle
                        cx="24"
                        cy="24"
                        r="18"
                        fill="none"
                        stroke="#10b981"
                        strokeWidth="3.5"
                        strokeDasharray="113"
                        strokeDashoffset="0"
                        strokeLinecap="round"
                      />
                    </svg>
                    <span className="absolute text-[11px] font-black text-emerald-600 font-mono">0%</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">{t('smartScheduling.chrono2Tag') || "Quality protected"}</span>
                    </div>
                    <p className="text-sm font-bold text-navy-deep mt-0.5">{t('smartScheduling.chrono2Title') || "Capacity safe"}</p>
                    <p className="text-[10.5px] text-slate-500">{t('smartScheduling.chrono2Sub') || "No overbooking lines"}</p>
                  </div>
                </div>
              </Reveal>

              {/* Chrono Dial 3: Ship window fit */}
              <Reveal delay={150}>
                <div className="group relative rounded-2xl sm:rounded-3xl liquid-glass border border-white/80 p-5 sm:p-6 shadow-[0_8px_30px_rgba(0,50,171,0.06)] hover:shadow-[0_16px_40px_rgba(0,50,171,0.12)] transition-all duration-300 flex items-center gap-4 hover:-translate-y-1">
                  <div className="relative h-13 w-13 shrink-0 flex items-center justify-center">
                    <svg className="h-13 w-13 -rotate-90" viewBox="0 0 48 48">
                      <circle cx="24" cy="24" r="18" fill="none" stroke="#e2e8f0" strokeWidth="3.5" />
                      <circle
                        cx="24"
                        cy="24"
                        r="18"
                        fill="none"
                        stroke="#6366f1"
                        strokeWidth="3.5"
                        strokeDasharray="113"
                        strokeDashoffset="12"
                        strokeLinecap="round"
                      />
                    </svg>
                    <span className="absolute text-[10px] font-black text-indigo-600 font-mono">18:30</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700">{t('smartScheduling.chrono3Tag') || "Regional delivery"}</span>
                    </div>
                    <p className="text-sm font-bold text-navy-deep mt-0.5">{t('smartScheduling.chrono3Title') || "Ship window fit"}</p>
                    <p className="text-[10.5px] text-slate-500">{t('smartScheduling.chrono3Sub') || "Carrier cutoff aware"}</p>
                  </div>
                </div>
              </Reveal>

              {/* Chrono Dial 4: Seasonal readiness */}
              <Reveal delay={200}>
                <div className="group relative rounded-2xl sm:rounded-3xl liquid-glass border border-white/80 p-5 sm:p-6 shadow-[0_8px_30px_rgba(0,50,171,0.06)] hover:shadow-[0_16px_40px_rgba(0,50,171,0.12)] transition-all duration-300 flex items-center gap-4 hover:-translate-y-1">
                  <div className="relative h-13 w-13 shrink-0 rounded-2xl bg-amber-50 border border-amber-200 flex flex-col items-center justify-center text-amber-700 shadow-inner">
                    <span className="text-[12px] font-black font-mono leading-none">5-30</span>
                    <span className="text-[8px] font-bold uppercase text-amber-600 mt-0.5">DAYS</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700">{t('smartScheduling.chrono4Tag') || "Peak gifting"}</span>
                    </div>
                    <p className="text-sm font-bold text-navy-deep mt-0.5">{t('smartScheduling.chrono4Title') || "Seasonal readiness"}</p>
                    <p className="text-[10.5px] text-slate-500">{t('smartScheduling.chrono4Sub') || "Holiday surge planning"}</p>
                  </div>
                </div>
              </Reveal>
            </div>
          </Container>
        </section>

        {/* Interactive 4-Quadrant Timing Engine Matrix */}
        <section className="py-16 lg:py-24 bg-[#f8f9fc] border-b border-slate-200/60 relative overflow-hidden">
          <Container>
            <Reveal>
              <div className="max-w-3xl mb-12">
                <span className="section-badge mb-3">
                  {t('smartScheduling.matrixSectionBadge') || "Core algorithm"}
                </span>
                <h2 className="mt-3 text-3xl sm:text-4xl lg:text-[2.75rem] font-extrabold tracking-tight text-navy-deep leading-[1.15]">
                  {t('smartScheduling.matrixHeading') || "Timing matters for custom craft"}
                </h2>
                <p className="mt-4 text-base text-slate-body leading-relaxed max-w-2xl">
                  {t('smartScheduling.matrixDesc') || "Rushing engraving before proof approval wastes material; delaying shipment misses gifting moments. Smart scheduling balances both."}
                </p>
              </div>
            </Reveal>

            {/* 2x2 Interactive Control Matrix (Compact Height) */}
            <div className="grid md:grid-cols-2 gap-4 sm:gap-5 items-stretch">
              {/* Quadrant 1: Hard Gate Before Craft */}
              <Reveal delay={60}>
                <div className="h-full liquid-glass rounded-2xl p-4 sm:p-5 border border-white/80 shadow-[0_8px_25px_rgba(0,50,171,0.05)] hover:shadow-[0_14px_35px_rgba(0,50,171,0.1)] hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between group">
                  <div>
                    <div className="flex items-center justify-between gap-3 mb-2.5">
                      <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-[#0032ab] to-[#155dfc] text-white flex items-center justify-center shadow-[0_4px_12px_rgba(0,50,171,0.2)] group-hover:scale-105 transition-transform">
                        <ShieldCheck className="h-4.5 w-4.5" />
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#0032ab]/10 text-[#0032ab] border border-[#0032ab]/20">
                        {t('smartScheduling.quad1Tag') || "Proof-first"}
                      </span>
                    </div>

                    <h3 className="text-base sm:text-lg font-extrabold text-navy-deep leading-snug">
                      {t('smartScheduling.quad1Title') || "Hard gate before craft"}
                    </h3>
                    <p className="mt-1 text-xs sm:text-[13px] text-slate-body leading-relaxed">
                      {t('smartScheduling.quad1Desc') || "Production slots open only after digital approval - automatic holds if proof expires unapproved."}
                    </p>

                    {/* Embedded Widget: 3-Stage Range Gauge */}
                    <div className="mt-3.5 rounded-xl bg-white/90 border border-slate-200/80 p-2.5 sm:p-3 space-y-2 shadow-2xs">
                      <div className="flex items-center justify-between text-[10.5px] font-mono text-slate-500">
                        <span className="font-semibold text-slate-600">SLA PROOF GATE</span>
                        <span className="text-[#0032ab] font-bold flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3 text-[#155dfc]" />
                          AUTO-ENFORCED
                        </span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden flex p-0.5 gap-1">
                        <div className="h-full w-1/4 bg-slate-300 rounded-full" title="Days 0-4 Cooldown" />
                        <div className="h-full w-2/4 bg-gradient-to-r from-[#0032ab] to-[#155dfc] rounded-full animate-pulse shadow-2xs" title="Days 5-30 Golden Window" />
                        <div className="h-full w-1/4 bg-slate-300 rounded-full" title="Day 31+ Cutoff" />
                      </div>
                      <div className="flex items-center justify-between text-[10px] pt-0.5">
                        <span className="text-slate-500 font-medium">Stage 1: Proof Sent</span>
                        <span className="text-[#0032ab] font-bold flex items-center gap-1">
                          <Sparkles className="h-2.5 w-2.5 text-[#155dfc]" />
                          Stage 2: Approved
                        </span>
                        <span className="text-slate-400 font-medium">Stage 3: Laser Queued</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3.5 pt-2.5 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-500">
                    <span className="font-medium">Material Waste Prevention</span>
                    <span className="font-bold text-[#0032ab]">Zero Bad Custom runs</span>
                  </div>
                </div>
              </Reveal>

              {/* Quadrant 2: Stakeholder-Friendly Reminders */}
              <Reveal delay={100}>
                <div className="h-full liquid-glass rounded-2xl p-4 sm:p-5 border border-white/80 shadow-[0_8px_25px_rgba(0,50,171,0.05)] hover:shadow-[0_14px_35px_rgba(0,50,171,0.12)] hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between group">
                  <div>
                    <div className="flex items-center justify-between gap-3 mb-2.5">
                      <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-[#0032ab] to-[#155dfc] text-white flex items-center justify-center shadow-[0_4px_12px_rgba(0,50,171,0.2)] group-hover:scale-105 transition-transform">
                        <SunMedium className="h-4.5 w-4.5" />
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#0032ab]/10 text-[#0032ab] border border-[#0032ab]/20">
                        {t('smartScheduling.quad2Tag') || "Evening proof drops"}
                      </span>
                    </div>

                    <h3 className="text-base sm:text-lg font-extrabold text-navy-deep leading-snug">
                      {t('smartScheduling.quad2Title') || "Stakeholder-friendly reminders"}
                    </h3>
                    <p className="mt-1 text-xs sm:text-[13px] text-slate-body leading-relaxed">
                      {t('smartScheduling.quad2Desc') || "Proof emails and nudges timed for when your team actually reads inbox - not 3 AM server time."}
                    </p>

                    {/* Embedded Widget: Live Multi-Market Timezone Console */}
                    <div className="mt-3.5 rounded-xl bg-white/90 border border-slate-200/80 p-2.5 space-y-1.5 shadow-2xs">
                      <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-slate-50/80 border border-slate-200/70 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-white bg-gradient-to-r from-[#0032ab] to-[#155dfc] px-1.5 py-0.5 rounded shadow-2xs">US</span>
                          <span className="font-bold text-navy-deep text-[11.5px]">New York (EDT)</span>
                        </div>
                        <span className="font-mono text-[10.5px] font-bold text-[#0032ab] bg-[#0032ab]/10 px-2 py-0.5 rounded-md border border-[#0032ab]/20 flex items-center gap-1.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          18:30 Drop Slot
                        </span>
                      </div>
                      <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-slate-50/80 border border-slate-200/70 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-white bg-gradient-to-r from-[#0032ab] to-[#155dfc] px-1.5 py-0.5 rounded shadow-2xs">UK</span>
                          <span className="font-bold text-navy-deep text-[11.5px]">London (BST)</span>
                        </div>
                        <span className="font-mono text-[10.5px] font-bold text-[#0032ab] bg-[#0032ab]/10 px-2 py-0.5 rounded-md border border-[#0032ab]/20 flex items-center gap-1.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          19:00 Drop Slot
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3.5 pt-2.5 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-500">
                    <span className="font-medium">Timezone Intelligence</span>
                    <span className="font-bold text-[#0032ab]">Zero Midnight Spam</span>
                  </div>
                </div>
              </Reveal>

              {/* Quadrant 3: Material-Specific Lead Times */}
              <Reveal delay={140}>
                <div className="h-full liquid-glass rounded-2xl p-4 sm:p-5 border border-white/80 shadow-[0_8px_25px_rgba(0,50,171,0.05)] hover:shadow-[0_14px_35px_rgba(0,50,171,0.12)] hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between group">
                  <div>
                    <div className="flex items-center justify-between gap-3 mb-2.5">
                      <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-[#0032ab] to-[#155dfc] text-white flex items-center justify-center shadow-[0_4px_12px_rgba(0,50,171,0.2)] group-hover:scale-105 transition-transform">
                        <Sliders className="h-4.5 w-4.5" />
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#0032ab]/10 text-[#0032ab] border border-[#0032ab]/20">
                        {t('smartScheduling.quad3Tag') || "SKU-aware delays"}
                      </span>
                    </div>

                    <h3 className="text-base sm:text-lg font-extrabold text-navy-deep leading-snug">
                      {t('smartScheduling.quad3Title') || "Material-specific lead times"}
                    </h3>
                    <p className="mt-1 text-xs sm:text-[13px] text-slate-body leading-relaxed">
                      {t('smartScheduling.quad3Desc') || "Textiles, ceramic, and deep wood engrave get different default windows based on real studio throughput."}
                    </p>

                    {/* Embedded Widget: 2 Lead Time Sliders */}
                    <div className="mt-3.5 rounded-xl bg-white/90 border border-slate-200/80 p-2.5 sm:p-3 space-y-2 shadow-2xs">
                      <div>
                        <div className="flex justify-between text-[11px] font-semibold text-slate-700 mb-1">
                          <span className="flex items-center gap-1.5 truncate">
                            <Pill className="h-3 w-3 text-[#155dfc] shrink-0" />
                            Deep Wood Engrave & Slate
                          </span>
                          <span className="text-[#0032ab] font-bold font-mono shrink-0 ml-2">14h Craft</span>
                        </div>
                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full w-3/4 bg-gradient-to-r from-[#0032ab] to-[#155dfc] rounded-full shadow-2xs" />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-[11px] font-semibold text-slate-700 mb-1">
                          <span className="flex items-center gap-1.5 truncate">
                            <Headphones className="h-3 w-3 text-[#155dfc] shrink-0" />
                            Laser Tumblers & Flasks
                          </span>
                          <span className="text-[#0032ab] font-bold font-mono shrink-0 ml-2">5h Rapid</span>
                        </div>
                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full w-1/3 bg-gradient-to-r from-[#0032ab] to-[#38bdf8] rounded-full shadow-2xs" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3.5 pt-2.5 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-500">
                    <span className="font-medium">SKU Throttle Rules</span>
                    <span className="font-bold text-[#0032ab]">Dynamic Batch Allocation</span>
                  </div>
                </div>
              </Reveal>

              {/* Quadrant 4: Predictable Ship Dates */}
              <Reveal delay={180}>
                <div className="h-full liquid-glass rounded-2xl p-4 sm:p-5 border border-white/80 shadow-[0_8px_25px_rgba(0,50,171,0.05)] hover:shadow-[0_14px_35px_rgba(0,50,171,0.12)] hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between group">
                  <div>
                    <div className="flex items-center justify-between gap-3 mb-2.5">
                      <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-[#0032ab] to-[#155dfc] text-white flex items-center justify-center shadow-[0_4px_12px_rgba(0,50,171,0.2)] group-hover:scale-105 transition-transform">
                        <TrendingUp className="h-4.5 w-4.5" />
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#0032ab]/10 text-[#0032ab] border border-[#0032ab]/20">
                        {t('smartScheduling.quad4Tag') || "Delivery confidence"}
                      </span>
                    </div>

                    <h3 className="text-base sm:text-lg font-extrabold text-navy-deep leading-snug">
                      {t('smartScheduling.quad4Title') || "Predictable ship dates"}
                    </h3>
                    <p className="mt-1 text-xs sm:text-[13px] text-slate-body leading-relaxed">
                      {t('smartScheduling.quad4Desc') || 'Customers see honest estimates that respect capacity - fewer angry "where is my gift?" messages.'}
                    </p>

                    {/* Embedded Widget: Stat & 5-Star Telemetry Box */}
                    <div className="mt-3.5 rounded-xl bg-white/90 border border-slate-200/80 p-2.5 sm:p-3 flex items-center justify-between shadow-2xs">
                      <div>
                        <p className="text-2xl font-extrabold text-navy-deep font-mono tracking-tight leading-none">+38%</p>
                        <p className="text-[11px] font-medium text-slate-500 mt-1">On-Time Delivery Certainty</p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center justify-end gap-0.5">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400 drop-shadow-[0_1px_3px_rgba(251,191,36,0.3)]" />
                          ))}
                        </div>
                        <span className="text-[10px] font-bold text-[#0032ab] bg-[#0032ab]/10 px-2 py-0.5 rounded-full mt-1 inline-block border border-[#0032ab]/20">
                          100% Studio Protected
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3.5 pt-2.5 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-500">
                    <span className="font-medium">Capacity Guardrail</span>
                    <span className="font-bold text-[#0032ab]">Zero Overbooking</span>
                  </div>
                </div>
              </Reveal>
            </div>
          </Container>
        </section>

        {/* Interactive Stepped Timeline ("From checkout to doorstep") */}
        <section id="timeline" className="py-16 lg:py-24 bg-white border-b border-slate-200/60 relative overflow-hidden">
          <Container>
            <Reveal>
              <div className="text-center max-w-3xl mx-auto mb-14">
                <span className="section-badge mb-3">
                  {t('smartScheduling.timelineBadge') || "The production lifecycle"}
                </span>
                <h2 className="mt-3 text-3xl sm:text-4xl lg:text-[2.75rem] font-extrabold tracking-tight text-navy-deep leading-[1.15]">
                  {t('smartScheduling.timelineHeading') || "From checkout to doorstep"}
                </h2>
                <p className="mt-4 text-base text-slate-body leading-relaxed max-w-2xl mx-auto">
                  {t('smartScheduling.timelineDesc') || "How Gravurtastisch sequences proof, craft, and ship for personalized orders."}
                </p>
              </div>
            </Reveal>

            {/* Stepped Timeline Cards Grid */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-5 relative">
              {timelinePhases.map((phase, idx) => (
                <Reveal key={phase.day} delay={idx * 60}>
                  <div className="relative rounded-[1.75rem] liquid-glass p-6 sm:p-7 border border-[#0032ab]/12 shadow-[0_8px_30px_rgba(0,50,171,0.06)] hover:shadow-[0_16px_40px_rgba(0,50,171,0.12)] hover:-translate-y-1 transition-all duration-300 h-full flex flex-col justify-between overflow-hidden group">
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#0032ab] to-[#155dfc] opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div>
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-mono font-bold mb-3 border ${phase.color}`}>
                        {phase.day}
                      </span>
                      <h3 className="text-base sm:text-lg font-extrabold text-navy-deep mb-2">{phase.title}</h3>
                      <p className="text-xs sm:text-sm text-slate-body leading-relaxed">{phase.desc}</p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>

            {/* Callout Box */}
            <Reveal delay={200}>
              <div className="mt-10 rounded-[2rem] liquid-glass bg-white p-6 sm:p-8 border border-[#0032ab]/15 shadow-[0_12px_40px_rgba(0,50,171,0.08)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative overflow-hidden">
                <div className="absolute -right-20 -bottom-20 w-60 h-60 rounded-full bg-[#155dfc]/10 blur-3xl pointer-events-none" />
                <div className="flex items-center gap-4 relative z-10">
                  <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-[#0032ab] to-[#155dfc] text-white flex items-center justify-center shadow-md shadow-[#0032ab]/25 shrink-0">
                    <Zap className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-navy-deep text-base sm:text-lg">{t('smartScheduling.calloutTitle') || "Automatic status updates"}</h4>
                    <p className="text-xs sm:text-sm text-slate-body mt-1 max-w-xl leading-relaxed">
                      {t('smartScheduling.calloutDesc') || "When proof approves or parcel ships, statuses flip in your dashboard and optional webhooks fire."}
                    </p>
                  </div>
                </div>
                <a
                  href="/#register"
                  className="inline-flex items-center gap-2 rounded-full btn-glass-primary px-6 py-3 text-xs sm:text-sm font-bold !text-white transition-all shadow-[0_6px_20px_rgba(0,50,171,0.25)] hover:-translate-y-0.5 shrink-0 relative z-10"
                >
                  {t('smartScheduling.calloutCta') || "Configure SLAs →"}
                </a>
              </div>
            </Reveal>
          </Container>
        </section>

        {/* FAQ Section (2-Column: Left Unique Non-Square Chrono-Astrolabe SVG, Right FAQs) */}
        <section className="relative py-16 lg:py-24 bg-[#f8f9fc] border-b border-[#0032ab]/10">
          <Container>
            <div className="grid lg:grid-cols-12 gap-10 lg:gap-14 items-center">
              {/* Left Column: Unique Non-Square Chrono-Astrolabe SVG & Support Assistant */}
              <Reveal className="lg:col-span-5 xl:col-span-5">
                <div className="space-y-6">
                  {/* Clean Non-Box Floating Vector Graphic */}
                  <div className="relative flex items-center justify-center">
                    <SmartSchedulingFaqSvg />
                  </div>

                  <div className="rounded-2xl liquid-glass border border-[#0032ab]/15 p-5 flex items-center justify-between gap-4 shadow-[0_4px_24px_rgba(0,50,171,0.06)] hover:shadow-[0_12px_32px_rgba(0,50,171,0.12)] transition-all">
                    <div className="flex items-center gap-3.5">
                      <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-[#0032ab] to-[#155dfc] text-white shadow-md shadow-[#0032ab]/25 grid place-items-center shrink-0">
                        <Headphones className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-navy-deep leading-tight">{t('smartScheduling.faqSupportTitle') || "Have timing questions?"}</p>
                        <p className="text-xs text-slate-body leading-relaxed mt-0.5">{t('smartScheduling.faqSupportDesc') || "Our team assists with custom SLA rules."}</p>
                      </div>
                    </div>
                    <a
                      href="/#contact"
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0032ab] hover:text-[#155dfc] transition-colors shrink-0"
                    >
                      {t('smartScheduling.faqSupportLink') || "Talk to us →"}
                    </a>
                  </div>
                </div>
              </Reveal>

              {/* Right Column: FAQs List matching Order-Sync liquid-glass accordion UI */}
              <div className="lg:col-span-7 xl:col-span-7">
                <Reveal>
                  <div className="mb-8">
                    <span className="section-badge mb-3">
                      {t('smartScheduling.faqBadge') || "Scheduling FAQs"}
                    </span>
                    <h2 className="mt-3 text-3xl sm:text-4xl lg:text-[2.75rem] font-extrabold tracking-tight text-navy-deep leading-[1.15]">
                      {t('smartScheduling.faqHeading') || "Smart scheduling FAQs"}
                    </h2>
                    <p className="mt-4 text-base text-slate-body leading-relaxed">
                      {t('smartScheduling.faqDesc') || "Answers on proof windows, capacity, holidays, and delivery promises."}
                    </p>
                  </div>
                </Reveal>

                <Accordion type="single" collapsible className="w-full space-y-4">
                  {faqs.map((faq, idx) => (
                    <Reveal key={faq.q} delay={idx * 50}>
                      <AccordionItem
                        value={`faq-${idx}`}
                        className="rounded-2xl liquid-glass border border-[#0032ab]/12 px-5 sm:px-6 shadow-[0_2px_12px_rgba(0,50,171,0.04)] hover:border-[#0032ab]/30 transition-all border-b-0"
                      >
                        <AccordionTrigger className="text-left hover:no-underline font-bold text-navy-deep text-base sm:text-lg py-4 sm:py-5 flex gap-3.5">
                          <span className="flex items-center gap-3.5">
                            <HelpCircle className="h-5 w-5 text-brand shrink-0" />
                            <span>{faq.q}</span>
                          </span>
                        </AccordionTrigger>
                        <AccordionContent className="text-sm text-slate-600 leading-relaxed pb-5 pl-8.5">
                          {faq.a}
                        </AccordionContent>
                      </AccordionItem>
                    </Reveal>
                  ))}
                </Accordion>
              </div>
            </div>
          </Container>
        </section>

        {/* CTA */}
        <section className="py-8 lg:py-10 bg-[#f8f9fc]">
          <Container>
            <div className="relative rounded-[2rem] liquid-glass bg-white py-8 px-6 sm:py-9 sm:px-10 text-center shadow-[0_12px_40px_rgba(0,50,171,0.06)] border border-[#0032ab]/15 overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(0,50,171,0.03),transparent_70%)] pointer-events-none" />

              <div className="relative z-10 max-w-3xl mx-auto">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0032ab]/10 border border-[#0032ab]/20 text-xs font-semibold uppercase tracking-wider text-[#0032ab] mb-3">
                  <Sparkles className="h-3.5 w-3.5 text-[#155dfc]" />
                  {t('smartScheduling.ctaBadge') || "Instant Deployment"}
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-navy-deep tracking-tight leading-snug">
                  {t('smartScheduling.ctaHeading') || "Never miss a gifting deadline"}
                </h2>
                <p className="mt-2 text-slate-body text-xs sm:text-sm max-w-xl mx-auto leading-relaxed">
                  {t('smartScheduling.ctaDesc') || "Proof-first scheduling with studio-realistic ship dates."}
                </p>
                <div className="mt-5 flex flex-wrap justify-center gap-3">
                  <a
                    href="/#register"
                    className="inline-flex items-center gap-2 rounded-full btn-glass-primary px-6 py-2.5 text-xs sm:text-sm font-bold !text-white transition-all shadow-md shadow-[#0032ab]/20 hover:-translate-y-0.5"
                  >
                    {t('smartScheduling.ctaButton') || "Register as Seller"}
                    <ArrowRight className="h-4 w-4" />
                  </a>
                  <a
                    href="/#pricing"
                    className="inline-flex items-center gap-2 rounded-full bg-white border border-[#0032ab]/20 px-6 py-2.5 text-xs sm:text-sm font-bold text-[#0032ab] hover:bg-blue-50/50 hover:border-[#0032ab]/40 transition-all shadow-xs"
                  >
                    {t('smartScheduling.ctaPricing') || "View Pricing Plans"}
                  </a>
                </div>
              </div>
            </div>
          </Container>
        </section>
      </main>

      <Footer />
    </div>
  );
}

{/*
  ========================================================================
  BESPOKE ULTRA-RICH NON-SQUARE / NON-RECTANGULAR CHRONO-ASTROLABE SVG
  Unique Polar Compass Architecture • No Boxy Cards • Celestial Precision
  ========================================================================
*/}
function SmartSchedulingFaqSvg() {
  return (
    <svg
      viewBox="0 0 540 520"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-auto select-none"
      role="img"
      aria-label="Gravurtastisch Precision Chronometric Astrolabe HUD"
    >
      <defs>
        {/* Soft Ambient Radial Lights */}
        <radialGradient id="astrolabe-ambient-cyan" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.22" />
          <stop offset="60%" stopColor="#0284c7" stopOpacity="0.06" />
          <stop offset="100%" stopColor="#001855" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="astrolabe-ambient-blue" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#4f6ef7" stopOpacity="0.25" />
          <stop offset="65%" stopColor="#0032ab" stopOpacity="0.08" />
          <stop offset="100%" stopColor="#001855" stopOpacity="0" />
        </radialGradient>

        {/* Metallic & Holographic Dial Gradients */}
        <radialGradient id="chrono-dial-metallic" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="70%" stopColor="#F0F7FF" />
          <stop offset="92%" stopColor="#E2EDFD" />
          <stop offset="100%" stopColor="#CBDDF8" />
        </radialGradient>

        <linearGradient id="golden-arc-neon" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="30%" stopColor="#155dfc" />
          <stop offset="70%" stopColor="#0032ab" />
          <stop offset="100%" stopColor="#6366f1" />
        </linearGradient>

        <linearGradient id="cooldown-arc-subtle" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#94a3b8" />
          <stop offset="100%" stopColor="#cbd5e1" />
        </linearGradient>

        <linearGradient id="orbital-wing-grad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#0032ab" />
          <stop offset="50%" stopColor="#155dfc" />
          <stop offset="100%" stopColor="#38bdf8" />
        </linearGradient>

        {/* Drop Glow Filter */}
        <filter id="astrolabe-core-glow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="8" stdDeviation="16" floodColor="#155dfc" floodOpacity="0.28" />
        </filter>
        <filter id="node-blip-glow" x="-40%" y="-40%" width="180%" height="180%">
          <feDropShadow dx="0" dy="2" stdDeviation="5" floodColor="#38bdf8" floodOpacity="0.45" />
        </filter>
      </defs>

      {/* Ambient Backdrop Orbs */}
      <circle cx="270" cy="260" r="210" fill="url(#astrolabe-ambient-cyan)" pointerEvents="none" />
      <circle cx="270" cy="260" r="160" fill="url(#astrolabe-ambient-blue)" pointerEvents="none" />

      {/* ==================================================== */}
      {/* 1. OUTER CELESTIAL GUIDES & AZIMUTH TICK RING */}
      {/* ==================================================== */}
      <g transform="translate(270, 260)">
        {/* Outer Fine Reticle Ring */}
        <circle cx="0" cy="0" r="236" fill="none" stroke="#0032ab" strokeWidth="0.8" strokeOpacity="0.25" strokeDasharray="3 4" />
        <circle cx="0" cy="0" r="218" fill="none" stroke="#155dfc" strokeWidth="1.2" strokeOpacity="0.35" />

        {/* 12 Celestial Radial Hour Ticks */}
        {[...Array(12)].map((_, i) => (
          <g key={i} transform={`rotate(${i * 30})`}>
            <line x1="0" y1="-218" x2="0" y2="-208" stroke="#0032ab" strokeWidth="1.8" strokeOpacity="0.6" />
            <line x1="0" y1="-218" x2="0" y2="-213" stroke="#155dfc" strokeWidth="0.8" transform="rotate(15)" strokeOpacity="0.4" />
          </g>
        ))}

        {/* Coordinate Cardinal Markers (00h, 06h, 12h, 18h) */}
        <text x="0" y="-222" textAnchor="middle" fill="#0032ab" fontFamily="monospace" fontSize="8.5" fontWeight="800">24h / 00h</text>
        <text x="232" y="3" textAnchor="start" fill="#0032ab" fontFamily="monospace" fontSize="8.5" fontWeight="800">06h</text>
        <text x="0" y="232" textAnchor="middle" fill="#0032ab" fontFamily="monospace" fontSize="8.5" fontWeight="800">12h</text>
        <text x="-232" y="3" textAnchor="end" fill="#0032ab" fontFamily="monospace" fontSize="8.5" fontWeight="800">18h</text>

        {/* Orbit Path 1: Inner Guide */}
        <circle cx="0" cy="0" r="182" fill="none" stroke="#cbd5e1" strokeWidth="1" strokeDasharray="6 6" />

        {/* ==================================================== */}
        {/* 2. THE 30-DAY TIMELINE DUAL-SECTOR ARCS (NON-BOX) */}
        {/* ==================================================== */}
        {/* Zone A: Cooldown Sector (Days 0-4 // -90 deg to -38 deg) */}
        <path
          d="M 0 -182 A 182 182 0 0 1 143 -112"
          fill="none"
          stroke="url(#cooldown-arc-subtle)"
          strokeWidth="8"
          strokeLinecap="round"
        />

        {/* Zone B: Amazon Golden Window Sector (Days 5-30 // -38 deg to 175 deg) */}
        <path
          d="M 143 -112 A 182 182 0 1 1 -181 16"
          fill="none"
          stroke="url(#golden-arc-neon)"
          strokeWidth="11"
          strokeLinecap="round"
          filter="url(#astrolabe-core-glow)"
        />

        {/* Active Animated Laser Beam Traveling Along Golden Arc */}
        <path
          d="M 143 -112 A 182 182 0 1 1 -181 16"
          fill="none"
          stroke="#ffffff"
          strokeWidth="2.8"
          strokeLinecap="round"
          strokeDasharray="14 18"
        >
          <animate attributeName="stroke-dashoffset" values="0;-64" dur="2.2s" repeatCount="indefinite" />
        </path>

        {/* Traveling Energy Photons */}
        <circle cx="0" cy="0" r="5" fill="#38bdf8" filter="url(#node-blip-glow)">
          <animateMotion
            path="M 143 -112 A 182 182 0 1 1 -181 16"
            dur="4s"
            repeatCount="indefinite"
          />
        </circle>

        {/* Zone C: Policy Hard Stop Gap / Cutoff Shield */}
        <path
          d="M -181 16 A 182 182 0 0 1 0 -182"
          fill="none"
          stroke="#ef4444"
          strokeWidth="3"
          strokeDasharray="4 4"
          strokeOpacity="0.4"
        />

        {/* ==================================================== */}
        {/* 3. CENTRAL POLISHED CHRONO CORE INSTRUMENT */}
        {/* ==================================================== */}
        <g filter="url(#astrolabe-core-glow)">
          {/* Main Dial Outer Bezel */}
          <circle cx="0" cy="0" r="114" fill="url(#chrono-dial-metallic)" stroke="#155dfc" strokeWidth="2.5" />
          <circle cx="0" cy="0" r="106" fill="none" stroke="#0032ab" strokeWidth="0.8" strokeOpacity="0.3" strokeDasharray="2 3" />

          {/* 60 Minute / Second Chrono Dial Radial Graduations */}
          {[...Array(24)].map((_, i) => (
            <line
              key={i}
              x1="0"
              y1="-106"
              x2="0"
              y2={i % 6 === 0 ? "-96" : "-101"}
              stroke="#0032ab"
              strokeWidth={i % 6 === 0 ? "1.8" : "0.9"}
              strokeOpacity={i % 6 === 0 ? "0.8" : "0.4"}
              transform={`rotate(${i * 15})`}
            />
          ))}

          {/* Golden 18:30 Timezone Sector Shading */}
          <path
            d="M 0 0 L -62 48 A 78 78 0 0 1 -76 -18 Z"
            fill="rgba(21, 93, 252, 0.08)"
            stroke="#155dfc"
            strokeWidth="0.8"
            strokeDasharray="2 2"
          />

          {/* Rotating Celestial Satellite Orbital Ring */}
          <circle cx="0" cy="0" r="62" fill="none" stroke="#0032ab" strokeWidth="1" strokeDasharray="5 5">
            <animateTransform
              attributeName="transform"
              type="rotate"
              from="0"
              to="360"
              dur="24s"
              repeatCount="indefinite"
            />
          </circle>

          {/* Active Precision Chrono Needle Hand pointing to 18:30 (Evening Peak) */}
          <g transform="rotate(222)">
            <line x1="0" y1="12" x2="0" y2="-92" stroke="#0032ab" strokeWidth="2.5" strokeLinecap="round" />
            <polygon points="-4,-70 4,-70 0,-92" fill="#155dfc" />
            <circle cx="0" cy="-60" r="2.5" fill="#38bdf8" />
          </g>

          {/* Polished Center Pin Cap */}
          <circle cx="0" cy="0" r="32" fill="#0032ab" stroke="#ffffff" strokeWidth="2.5" />
          <circle cx="0" cy="0" r="28" fill="url(#orbital-wing-grad)" />
          
          <text x="0" y="-2" textAnchor="middle" fill="#ffffff" fontFamily="monospace" fontSize="11" fontWeight="900">
            18:30
          </text>
          <text x="0" y="10" textAnchor="middle" fill="#93c5fd" fontFamily="system-ui" fontSize="7" fontWeight="800" letterSpacing="0.8">
            PEAK SLOT
          </text>
        </g>

        {/* ==================================================== */}
        {/* 4. RADIAL MILESTONE ORBITAL BLIPS (CIRCULAR / NON-BOX) */}
        {/* ==================================================== */}
        {/* Blip 1: Day 0 Delivery Ingestion */}
        <g transform="translate(0, -182)" filter="url(#node-blip-glow)">
          <circle cx="0" cy="0" r="16" fill="#ffffff" stroke="#0032ab" strokeWidth="2.2" />
          <circle cx="0" cy="0" r="8" fill="#155dfc" />
          <circle cx="0" cy="0" r="3" fill="#ffffff" />
          {/* Circular Telemetry Label */}
          <g transform="translate(0, -24)">
            <text x="0" y="0" textAnchor="middle" fill="#0032ab" fontFamily="monospace" fontSize="9" fontWeight="900">
              DAY 0: DELIVERY
            </text>
            <text x="0" y="9" textAnchor="middle" fill="#64748b" fontFamily="system-ui" fontSize="7" fontWeight="700">
              Auto studio Webhook
            </text>
          </g>
        </g>

        {/* Blip 2: Day 5 Golden Hour Peak (Hero Node) */}
        <g transform="translate(143, -112)" filter="url(#node-blip-glow)">
          <circle cx="0" cy="0" r="22" fill="#ffffff" stroke="#155dfc" strokeWidth="2.8" />
          <circle cx="0" cy="0" r="13" fill="url(#orbital-wing-grad)" />
          <circle cx="0" cy="0" r="4" fill="#ffffff">
            <animate attributeName="r" values="3;5;3" dur="1.6s" repeatCount="indefinite" />
          </circle>
          {/* Radiating Pulse Wave */}
          <circle cx="0" cy="0" r="28" fill="none" stroke="#38bdf8" strokeWidth="1.2" strokeOpacity="0.6">
            <animate attributeName="r" values="22;34;22" dur="2s" repeatCount="indefinite" />
            <animate attributeName="stroke-opacity" values="0.8;0;0.8" dur="2s" repeatCount="indefinite" />
          </circle>
          {/* Flange Callout */}
          <g transform="translate(32, -6)">
            <text x="0" y="0" fill="#0032ab" fontFamily="monospace" fontSize="10.5" fontWeight="900">
              ★ DAY 5: GOLDEN PEAK
            </text>
            <text x="0" y="11" fill="#155dfc" fontFamily="system-ui" fontSize="7.5" fontWeight="800">
              +38% Approval Velocity
            </text>
          </g>
        </g>

        {/* Blip 3: Day 14 Category Adaptive Run */}
        <g transform="translate(128, 128)" filter="url(#node-blip-glow)">
          <circle cx="0" cy="0" r="15" fill="#ffffff" stroke="#0032ab" strokeWidth="2" />
          <circle cx="0" cy="0" r="7" fill="#0284c7" />
          <circle cx="0" cy="0" r="2.5" fill="#ffffff" />
          <g transform="translate(24, 4)">
            <text x="0" y="0" fill="#0032ab" fontFamily="monospace" fontSize="8.5" fontWeight="900">
              DAY 14: ADAPTIVE
            </text>
            <text x="0" y="9" fill="#64748b" fontFamily="system-ui" fontSize="7" fontWeight="700">
              Wood &amp; Custom Lead
            </text>
          </g>
        </g>

        {/* Blip 4: Day 30 Policy Cutoff Guard */}
        <g transform="translate(-181, 16)" filter="url(#node-blip-glow)">
          <circle cx="0" cy="0" r="16" fill="#ffffff" stroke="#ef4444" strokeWidth="2.2" />
          <circle cx="0" cy="0" r="7" fill="#ef4444" />
          <circle cx="0" cy="0" r="2.5" fill="#ffffff" />
          <g transform="translate(-24, 4)" textAnchor="end">
            <text x="0" y="0" fill="#dc2626" fontFamily="monospace" fontSize="8.5" fontWeight="900">
              DAY 30: HARD LOCK
            </text>
            <text x="0" y="9" fill="#64748b" fontFamily="system-ui" fontSize="7" fontWeight="700">
              Zero Strike Guardrail
            </text>
          </g>
        </g>

        {/* ==================================================== */}
        {/* 5. POLAR CALLOUT WINGS (ANGLED CALIPER SHAPES) */}
        {/* ==================================================== */}
        {/* Left Wing (Chamfered Aerospace Telemetry Fin) */}
        <g transform="translate(-230, -145)">
          <path
            d="M 0 0 L 110 -18 L 100 16 L -10 24 Z"
            fill="rgba(0, 50, 171, 0.06)"
            stroke="#155dfc"
            strokeWidth="0.8"
          />
          <text x="45" y="4" textAnchor="middle" fill="#0032ab" fontFamily="monospace" fontSize="7.5" fontWeight="800">
            AUTO-POLICY GATE
          </text>
        </g>

        {/* Right Wing (Chamfered Aerospace Telemetry Fin) */}
        <g transform="translate(120, 185)">
          <path
            d="M 0 0 L 110 18 L 120 -14 L 10 -22 Z"
            fill="rgba(0, 50, 171, 0.06)"
            stroke="#155dfc"
            strokeWidth="0.8"
          />
          <text x="65" y="3" textAnchor="middle" fill="#0032ab" fontFamily="monospace" fontSize="7.5" fontWeight="800">
            TIMEZONE SYNC 18:30
          </text>
        </g>
      </g>
    </svg>
  );
}
