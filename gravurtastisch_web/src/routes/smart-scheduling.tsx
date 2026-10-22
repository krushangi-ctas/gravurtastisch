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
  Star
} from "lucide-react";
import { ServicePageSkeleton } from "@/components/skeletons/ServicePageSkeleton";
import { FlagDE, FlagFR, FlagGB } from "@/components/ui/FlagIcon";

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
      title: t('smartScheduling.phase0Title') || "Order Placed & Shipped",
      desc: t('smartScheduling.phase0Desc') || "Customer completes purchase on Amazon. Warehouse processes shipment.",
      color: "bg-brand/10 text-brand font-bold",
    },
    {
      day: "Days 1-3",
      title: t('smartScheduling.phase1Title') || "Carrier Delivery",
      desc: t('smartScheduling.phase1Desc') || "Carrier delivers package. Exact delivery timestamp is captured via studio API.",
      color: "bg-brand/15 text-brand font-bold",
    },
    {
      day: "Days 3-5",
      title: t('smartScheduling.phase2Title') || "Cooldown & Product Experience",
      desc: t('smartScheduling.phase2Desc') || "Customer unboxes product. Gravurtastisch suppresses early requests to avoid annoying the buyer.",
      color: "bg-brand/20 text-brand font-bold",
    },
    {
      day: "Days 5-8",
      title: t('smartScheduling.phase3Title') || "Golden Solicitation Window",
      desc: t('smartScheduling.phase3Desc') || "Gravurtastisch dispatches official 1-click production job email at peak opening hour.",
      color: "bg-brand/10 text-brand font-bold border border-brand/25",
    },
    {
      day: "Day 30+",
      title: t('smartScheduling.phase4Title') || "Policy Cutoff Guardrail",
      desc: t('smartScheduling.phase4Desc') || "Amazon policy window closes. Gravurtastisch automatically blocks any delayed requests.",
      color: "bg-stone-200 text-stone-700 font-bold",
    },
  ];

  const faqs = [
    {
      q: "Why is the 5 to 30-day post-delivery window so important?",
      a: "Amazon's official Selling Partner API policy explicitly allows review solicitations only within 5 to 30 days after order delivery. Attempting to solicit before Day 5 or after Day 30 is rejected by Amazon and can risk your account health. Gravurtastisch guarantees you stay within this window.",
    },
    {
      q: "Can I adjust the send delay for different products?",
      a: "Yes! You can configure global default rules or customize delay timing per SKU/ASIN to match how long buyers realistically need to experience your product.",
    },
    {
      q: "How does Gravurtastisch determine the buyer's timezone?",
      a: "Gravurtastisch maps the order's destination postal code and marketplace jurisdiction to the correct local timezone, scheduling the dispatch for the optimal evening reading hours.",
    },
    {
      q: "Can a buyer receive duplicate production jobs?",
      a: "Never. Gravurtastisch applies strict idempotency controls and Amazon's Solicitations API strictly enforces a maximum of 1 production job per order.",
    },
  ];

  return (
    <div className="min-h-screen bg-background text-navy-deep overflow-x-hidden w-full max-w-full">
      <Nav />

      <main className="pb-8 w-full max-w-full overflow-x-hidden">
        {/* Hero Section */}
        <section className="relative overflow-hidden pt-24 pb-8 lg:pt-28 lg:pb-10 bg-gradient-to-b from-[#c6dbf2] via-[#d5e4f7] to-[#bfd6f0] text-slate-800 w-full max-w-full">
          <div className="absolute inset-0 grid-bg opacity-15 pointer-events-none" />
          <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-brand/10 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-brand/10 blur-3xl pointer-events-none" />

          <Container className="relative max-w-5xl mx-auto text-center">
            <Reveal className="max-w-4xl mx-auto flex flex-col items-center">
              <div className="section-badge mb-4">
                <CalendarClock className="h-3.5 w-3.5 text-brand shrink-0" />
                <span>{t('smartScheduling.heroBadge') || "Algorithmic Delivery Timing"}</span>
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-[3.25rem] font-extrabold tracking-tight leading-[1.1] text-navy-deep text-center">
                <span>{t('smartScheduling.heroTitle') || "Smart Scheduling for"}</span>{" "}
                <span className="bg-gradient-to-r from-[#0032ab] via-[#2563eb] to-[#7c3aed] text-transparent bg-clip-text">
                  {t('smartScheduling.heroTitleHighlight') || "Maximum Custom orders"}
                </span>
              </h1>
              <p className="mt-4 text-slate-700 text-base sm:text-lg leading-relaxed max-w-2xl font-medium text-center mx-auto">
                {t('smartScheduling.heroDesc') || "Reach Amazon buyers at the exact moment they are happiest with their order. Fully compliant with Amazon's 5-30 day solicitation window and tailored to buyer timezones."}
              </p>
              <div className="mt-7 flex flex-wrap justify-center items-center gap-4">
                <a
                  href="/#register"
                  className="inline-flex items-center gap-2 rounded-full btn-glass-primary px-7 py-3 text-sm font-bold !text-white shadow-lg shadow-brand/30 hover:-translate-y-0.5 transition-all"
                >
                  {t('smartScheduling.heroCtaRegister') || "Enable Smart Scheduling"}
                  <ArrowRight className="h-4 w-4" />
                </a>
                <a
                  href="#timeline"
                  className="inline-flex items-center gap-2 rounded-full bg-white border border-[#0032ab]/20 px-7 py-3 text-sm font-semibold text-navy-deep hover:bg-slate-50 transition-all shadow-xs"
                >
                  {t('smartScheduling.heroCtaHow') || "Explore 5-30 Day Timeline"}
                </a>
              </div>
            </Reveal>

            {/* Chrono Dial & Timing Telemetry Meters with Liquid Glass */}
            <div className="mt-10 sm:mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 border-t border-[#0032ab]/15 pt-8 text-left">
              {/* Chrono Dial 1: +38% Review Lift */}
              <Reveal delay={50}>
                <div className="group relative rounded-2xl sm:rounded-3xl liquid-glass border border-white/80 p-5 sm:p-6 shadow-[0_8px_30px_rgba(0,50,171,0.06)] hover:shadow-[0_16px_40px_rgba(0,50,171,0.12)] transition-all duration-300 flex items-center gap-4 hover:-translate-y-1">
                  <div className="relative h-13 w-13 shrink-0 flex items-center justify-center">
                    {/* SVG Radial Arc Meter */}
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
                        strokeDashoffset="38"
                        strokeLinecap="round"
                        className="transition-all duration-700"
                      />
                    </svg>
                    <span className="absolute text-[11px] font-black text-sky-600 font-mono">+38%</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-sky-500 animate-pulse" />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-sky-700">{t('smartScheduling.chrono1Tag') || "Conversion Lift"}</span>
                    </div>
                    <p className="text-sm font-bold text-navy-deep mt-0.5">{t('smartScheduling.chrono1Title') || "Verified Custom orders"}</p>
                    <p className="text-[10.5px] text-slate-500">{t('smartScheduling.chrono1Sub') || "Optimal timing boost"}</p>
                  </div>
                </div>
              </Reveal>

              {/* Chrono Dial 2: 0% Policy Violations */}
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
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">{t('smartScheduling.chrono2Tag') || "Policy Violations"}</span>
                    </div>
                    <p className="text-sm font-bold text-navy-deep mt-0.5">{t('smartScheduling.chrono2Title') || "100% Amazon ToS"}</p>
                    <p className="text-[10.5px] text-slate-500">{t('smartScheduling.chrono2Sub') || "Automated safety lock"}</p>
                  </div>
                </div>
              </Reveal>

              {/* Chrono Dial 3: 100% Timezone Precision */}
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
                        strokeDashoffset="10"
                        strokeLinecap="round"
                      />
                    </svg>
                    <span className="absolute text-[10px] font-black text-indigo-600 font-mono">18:30</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700">{t('smartScheduling.chrono3Tag') || "Buyer Timezone"}</span>
                    </div>
                    <p className="text-sm font-bold text-navy-deep mt-0.5">{t('smartScheduling.chrono3Title') || "Evening Peak Slot"}</p>
                    <p className="text-[10.5px] text-slate-500">{t('smartScheduling.chrono3Sub') || "Postal-code aligned"}</p>
                  </div>
                </div>
              </Reveal>

              {/* Chrono Dial 4: 5-30 Days Golden Window */}
              <Reveal delay={200}>
                <div className="group relative rounded-2xl sm:rounded-3xl liquid-glass border border-white/80 p-5 sm:p-6 shadow-[0_8px_30px_rgba(0,50,171,0.06)] hover:shadow-[0_16px_40px_rgba(0,50,171,0.12)] transition-all duration-300 flex items-center gap-4 hover:-translate-y-1">
                  <div className="relative h-13 w-13 shrink-0 rounded-2xl bg-amber-50 border border-amber-200 flex flex-col items-center justify-center text-amber-700 shadow-inner">
                    <span className="text-[12px] font-black font-mono leading-none">5-30</span>
                    <span className="text-[8px] font-bold uppercase text-amber-600 mt-0.5">DAYS</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700">{t('smartScheduling.chrono4Tag') || "Golden Window"}</span>
                    </div>
                    <p className="text-sm font-bold text-navy-deep mt-0.5">{t('smartScheduling.chrono4Title') || "Peak Gifting Period"}</p>
                    <p className="text-[10.5px] text-slate-500">{t('smartScheduling.chrono4Sub') || "Automated delivery align"}</p>
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
                  {t('smartScheduling.matrixSectionBadge') || "Core Algorithm"}
                </span>
                <h2 className="mt-3 text-3xl sm:text-4xl lg:text-[2.75rem] font-extrabold tracking-tight text-navy-deep leading-[1.15]">
                  {t('smartScheduling.matrixHeading') || "Timing Is Everything in Amazon Review Conversions"}
                </h2>
                <p className="mt-4 text-base text-slate-body leading-relaxed max-w-2xl">
                  {t('smartScheduling.matrixDesc') || "Sending a production job too early annoys the customer before they've tried the product. Sending too late leads to low recall. Smart scheduling strikes the perfect balance."}
                </p>
              </div>
            </Reveal>

            {/* 2x2 Interactive Control Matrix */}
            <div className="grid md:grid-cols-2 gap-6 lg:gap-8 items-stretch">
              {/* Quadrant 1: Strict 5-30 Day Policy Guardrail */}
              <Reveal delay={60}>
                <div className="h-full liquid-glass rounded-[2rem] p-6 sm:p-7 border border-white/80 shadow-[0_10px_35px_rgba(0,50,171,0.06)] hover:shadow-[0_16px_45px_rgba(0,50,171,0.12)] hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group">
                  <div>
                    <div className="flex items-center justify-between gap-3 mb-4">
                      <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-[#0032ab] to-[#155dfc] text-white flex items-center justify-center shadow-[0_6px_20px_rgba(0,50,171,0.25)] group-hover:scale-105 transition-transform">
                        <ShieldCheck className="h-6 w-6" />
                      </div>
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#0032ab]/10 text-[#0032ab] border border-[#0032ab]/20">
                        {t('smartScheduling.quad1Tag') || "100% Policy-Safe"}
                      </span>
                    </div>

                    <h3 className="text-lg sm:text-xl font-extrabold text-navy-deep">
                      {t('smartScheduling.quad1Title') || "Strict 5-30 Day Window Compliance"}
                    </h3>
                    <p className="mt-2 text-sm text-slate-body leading-relaxed">
                      {t('smartScheduling.quad1Desc') || "Amazon policy strictly prohibits solicitations outside the 5 to 30-day post-delivery range. Gravurtastisch enforces this guardrail automatically."}</p>

                    {/* Embedded Widget: 3-Stage Range Gauge */}
                    <div className="mt-5 rounded-2xl bg-white/90 border border-slate-200/80 p-4 space-y-2.5 shadow-xs">
                      <div className="flex items-center justify-between text-[11px] font-mono text-slate-500">
                        <span className="font-semibold text-slate-600">POLICY RANGE TRACKER</span>
                        <span className="text-[#0032ab] font-bold flex items-center gap-1">
                          <CheckCircle2 className="h-3.5 w-3.5 text-[#155dfc]" />
                          AUTO-ENFORCED
                        </span>
                      </div>
                      <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden flex p-0.5 gap-1">
                        <div className="h-full w-1/4 bg-slate-300 rounded-full" title="Days 0-4 Cooldown" />
                        <div className="h-full w-2/4 bg-gradient-to-r from-[#0032ab] to-[#155dfc] rounded-full animate-pulse shadow-sm" title="Days 5-30 Golden Window" />
                        <div className="h-full w-1/4 bg-slate-300 rounded-full" title="Day 31+ Cutoff" />
                      </div>
                      <div className="flex items-center justify-between text-[11px] pt-1">
                        <span className="text-slate-500 font-medium">Day 0-4: Cooldown</span>
                        <span className="text-[#0032ab] font-bold flex items-center gap-1">
                          <Sparkles className="h-3 w-3 text-[#155dfc]" />
                          Day 5-30: Golden Slot
                        </span>
                        <span className="text-slate-400 font-medium">Day 31+: Closed</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 pt-3.5 border-t border-slate-200/60 flex items-center justify-between text-xs text-slate-500">
                    <span className="font-medium">Account Strike Protection</span>
                    <span className="font-bold text-[#0032ab]">Idempotent 1-Send Lock</span>
                  </div>
                </div>
              </Reveal>

              {/* Quadrant 2: Buyer Timezone Evening Peak Optimization */}
              <Reveal delay={100}>
                <div className="h-full liquid-glass rounded-[2rem] p-6 sm:p-7 border border-white/80 shadow-[0_10px_35px_rgba(0,50,171,0.06)] hover:shadow-[0_16px_45px_rgba(0,50,171,0.12)] hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group">
                  <div>
                    <div className="flex items-center justify-between gap-3 mb-4">
                      <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-[#0032ab] to-[#155dfc] text-white flex items-center justify-center shadow-[0_6px_20px_rgba(0,50,171,0.25)] group-hover:scale-105 transition-transform">
                        <SunMedium className="h-6 w-6" />
                      </div>
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#0032ab]/10 text-[#0032ab] border border-[#0032ab]/20">
                        {t('smartScheduling.quad2Tag') || "18:30 Evening Peak"}
                      </span>
                    </div>

                    <h3 className="text-lg sm:text-xl font-extrabold text-navy-deep">
                      {t('smartScheduling.quad2Title') || "Buyer Timezone Optimization"}
                    </h3>
                    <p className="mt-2 text-sm text-slate-body leading-relaxed">
                      {t('smartScheduling.quad2Desc') || "Review solicitations are scheduled for peak opening hours (6:00 PM - 9:00 PM local buyer time) rather than midnight notifications."}
                    </p>

                    {/* Embedded Widget: Live Multi-Market Timezone Console */}
                    <div className="mt-5 rounded-2xl bg-white/90 border border-slate-200/80 p-3.5 space-y-2.5 shadow-xs">
                      <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50/80 border border-slate-200/70 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-bold text-white bg-gradient-to-r from-[#0032ab] to-[#155dfc] px-2 py-0.5 rounded shadow-xs">US</span>
                          <span className="font-bold text-navy-deep">New York (EDT)</span>
                        </div>
                        <span className="font-mono text-[11px] font-bold text-[#0032ab] bg-[#0032ab]/10 px-2.5 py-1 rounded-md border border-[#0032ab]/20 flex items-center gap-1.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          18:30 Local Slot
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50/80 border border-slate-200/70 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-bold text-white bg-gradient-to-r from-[#0032ab] to-[#155dfc] px-2 py-0.5 rounded shadow-xs">UK</span>
                          <span className="font-bold text-navy-deep">London (BST)</span>
                        </div>
                        <span className="font-mono text-[11px] font-bold text-[#0032ab] bg-[#0032ab]/10 px-2.5 py-1 rounded-md border border-[#0032ab]/20 flex items-center gap-1.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          19:00 Local Slot
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 pt-3.5 border-t border-slate-200/60 flex items-center justify-between text-xs text-slate-500">
                    <span className="font-medium">Postal-Code Geo Mapping</span>
                    <span className="font-bold text-[#0032ab]">Zero Midnight Spam</span>
                  </div>
                </div>
              </Reveal>

              {/* Quadrant 3: Category-Specific Delay Matrix */}
              <Reveal delay={140}>
                <div className="h-full liquid-glass rounded-[2rem] p-6 sm:p-7 border border-white/80 shadow-[0_10px_35px_rgba(0,50,171,0.06)] hover:shadow-[0_16px_45px_rgba(0,50,171,0.12)] hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group">
                  <div>
                    <div className="flex items-center justify-between gap-3 mb-4">
                      <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-[#0032ab] to-[#155dfc] text-white flex items-center justify-center shadow-[0_6px_20px_rgba(0,50,171,0.25)] group-hover:scale-105 transition-transform">
                        <Sliders className="h-6 w-6" />
                      </div>
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#0032ab]/10 text-[#0032ab] border border-[#0032ab]/20">
                        {t('smartScheduling.quad3Tag') || "ASIN Granularity"}
                      </span>
                    </div>

                    <h3 className="text-lg sm:text-xl font-extrabold text-navy-deep">
                      {t('smartScheduling.quad3Title') || "Category-Specific Smart Delays"}
                    </h3>
                    <p className="mt-2 text-sm text-slate-body leading-relaxed">
                      {t('smartScheduling.quad3Desc') || "Tailor send delays to product complexity: supplements need 14 days of usage, whereas simple phone cases can be reviewed in 5 days."}
                    </p>

                    {/* Embedded Widget: 3 Category Delay Sliders */}
                    <div className="mt-5 rounded-2xl bg-white/90 border border-slate-200/80 p-4 space-y-3 shadow-xs">
                      <div>
                        <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1.5">
                          <span className="flex items-center gap-1.5">
                            <Pill className="h-3.5 w-3.5 text-[#155dfc]" />
                            Supplements / Skincare
                          </span>
                          <span className="text-[#0032ab] font-bold font-mono">14 Days Delay</span>
                        </div>
                        <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full w-3/4 bg-gradient-to-r from-[#0032ab] to-[#155dfc] rounded-full shadow-xs" />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1.5">
                          <span className="flex items-center gap-1.5">
                            <Headphones className="h-3.5 w-3.5 text-[#155dfc]" />
                            Tech &amp; Electronics
                          </span>
                          <span className="text-[#0032ab] font-bold font-mono">5 Days Delay</span>
                        </div>
                        <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full w-1/3 bg-gradient-to-r from-[#0032ab] to-[#38bdf8] rounded-full shadow-xs" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 pt-3.5 border-t border-slate-200/60 flex items-center justify-between text-xs text-slate-500">
                    <span className="font-medium">SKU Override Rules</span>
                    <span className="font-bold text-[#0032ab]">Adaptive Timing</span>
                  </div>
                </div>
              </Reveal>

              {/* Quadrant 4: +38% Review Conversion Lift Engine */}
              <Reveal delay={180}>
                <div className="h-full liquid-glass rounded-[2rem] p-6 sm:p-7 border border-white/80 shadow-[0_10px_35px_rgba(0,50,171,0.06)] hover:shadow-[0_16px_45px_rgba(0,50,171,0.12)] hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group">
                  <div>
                    <div className="flex items-center justify-between gap-3 mb-4">
                      <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-[#0032ab] to-[#155dfc] text-white flex items-center justify-center shadow-[0_6px_20px_rgba(0,50,171,0.25)] group-hover:scale-105 transition-transform">
                        <TrendingUp className="h-6 w-6" />
                      </div>
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#0032ab]/10 text-[#0032ab] border border-[#0032ab]/20">
                        {t('smartScheduling.quad4Tag') || "Conversion Engine"}
                      </span>
                    </div>

                    <h3 className="text-lg sm:text-xl font-extrabold text-navy-deep">
                      {t('smartScheduling.quad4Title') || "+38% Review Conversion Velocity"}
                    </h3>
                    <p className="mt-2 text-sm text-slate-body leading-relaxed">
                      {t('smartScheduling.quad4Desc') || "Timing production jobs when buyers are most satisfied with their delivery significantly drives positive feedback and boosts review rates."}
                    </p>

                    {/* Embedded Widget: Stat & 5-Star Telemetry Box */}
                    <div className="mt-5 rounded-2xl bg-white/90 border border-slate-200/80 p-4 flex items-center justify-between shadow-xs">
                      <div>
                        <p className="text-3xl font-extrabold text-navy-deep font-mono tracking-tight">+38%</p>
                        <p className="text-xs font-medium text-slate-500 mt-0.5">Average Review Velocity Lift</p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400 drop-shadow-[0_2px_4px_rgba(251,191,36,0.3)]" />
                          ))}
                        </div>
                        <span className="text-[11px] font-bold text-[#0032ab] bg-[#0032ab]/10 px-2.5 py-0.5 rounded-full mt-1.5 inline-block border border-[#0032ab]/20">
                          Verified Amazon ToS
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 pt-3.5 border-t border-slate-200/60 flex items-center justify-between text-xs text-slate-500">
                    <span className="font-medium">Organic Feedback Growth</span>
                    <span className="font-bold text-[#0032ab]">Maximum Open Rate</span>
                  </div>
                </div>
              </Reveal>
            </div>
          </Container>
        </section>

        {/* Interactive Timeline Diagram */}
        <section id="timeline" className="py-16 lg:py-24 bg-white border-b border-slate-200/60 relative overflow-hidden">
          <Container>
            <Reveal>
              <div className="text-center max-w-3xl mx-auto mb-14">
                <span className="section-badge mb-3">
                  {t('smartScheduling.timelineBadge') || "The Review Lifecycle"}
                </span>
                <h2 className="mt-3 text-3xl sm:text-4xl lg:text-[2.75rem] font-extrabold tracking-tight text-navy-deep leading-[1.15]">
                  {t('smartScheduling.timelineHeading') || "The Amazon 5 to 30-Day Golden Window"}
                </h2>
                <p className="mt-4 text-base text-slate-body leading-relaxed max-w-2xl mx-auto">
                  {t('smartScheduling.timelineDesc') || "How Gravurtastisch sequences every delivered order for maximum buyer engagement."}
                </p>
              </div>
            </Reveal>

            <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-5">
              {timelinePhases.map((phase, idx) => (
                <Reveal key={phase.day} delay={idx * 60}>
                  <div className="relative rounded-[1.75rem] liquid-glass p-6 sm:p-7 border border-white/80 shadow-[0_8px_30px_rgba(0,50,171,0.06)] hover:shadow-[0_16px_40px_rgba(0,50,171,0.12)] hover:-translate-y-1 transition-all duration-300 h-full flex flex-col justify-between overflow-hidden group">
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
                    <h4 className="font-extrabold text-navy-deep text-base sm:text-lg">{t('smartScheduling.calloutTitle') || "Automatic Status Flip: Counted as Sent"}</h4>
                    <p className="text-xs sm:text-sm text-slate-body mt-1 max-w-xl leading-relaxed">
                      {t('smartScheduling.calloutDesc') || "The moment Gravurtastisch dispatches the request through studio API, status updates to Sent immediately."}
                    </p>
                  </div>
                </div>
                <a
                  href="/#register"
                  className="inline-flex items-center gap-2 rounded-full btn-glass-primary px-6 py-3 text-xs sm:text-sm font-bold !text-white transition-all shadow-[0_6px_20px_rgba(0,50,171,0.25)] hover:-translate-y-0.5 shrink-0 relative z-10"
                >
                  {t('smartScheduling.calloutCta') || "Configure Your Delays →"}
                </a>
              </div>
            </Reveal>
          </Container>
        </section>

        {/* FAQ Section (2-Column: Left Organic Chrono-Astrolabe SVG, Right FAQs) */}
        <section className="py-16 lg:py-24 bg-[#f8f9fc] border-b border-slate-200/60 relative overflow-hidden">
          <Container>
            <div className="grid lg:grid-cols-12 gap-10 lg:gap-14 items-center">
              {/* Left Column: Organic Holographic Astrolabe & Precision Arc Time-Stream */}
              <Reveal className="lg:col-span-5 xl:col-span-5">
                <div className="space-y-6">
                  {/* Clean Non-Box Floating Vector Graphic */}
                  <div className="relative flex items-center justify-center">
                    <SmartSchedulingFaqSvg />
                  </div>

                  <div className="liquid-glass rounded-2xl border border-white/80 p-5 flex items-center justify-between gap-4 shadow-[0_8px_30px_rgba(0,50,171,0.06)]">
                    <div className="flex items-center gap-3.5">
                      <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-[#0032ab] to-[#155dfc] text-white flex items-center justify-center shadow-[0_4px_15px_rgba(0,50,171,0.2)] shrink-0">
                        <Headphones className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-navy-deep">{t('smartScheduling.faqSupportTitle') || "Have timing or policy questions?"}</p>
                        <p className="text-xs text-slate-body mt-0.5">{t('smartScheduling.faqSupportDesc') || "Our team assists with custom delay configurations."}</p>
                      </div>
                    </div>
                    <a
                      href="/#contact"
                      className="inline-flex items-center gap-1 text-xs font-bold text-[#0032ab] hover:text-[#155dfc] px-3.5 py-1.5 rounded-full bg-[#0032ab]/10 border border-[#0032ab]/20 hover:bg-[#0032ab]/15 transition-all shrink-0"
                    >
                      {t('smartScheduling.faqSupportLink') || "Talk to us →"}
                    </a>
                  </div>
                </div>
              </Reveal>

              {/* Right Column: FAQs List */}
              <div className="lg:col-span-7 xl:col-span-7">
                <Reveal>
                  <div className="mb-8">
                    <span className="section-badge mb-3">
                      {t('smartScheduling.faqBadge') || "Timing & Policies"}
                    </span>
                    <h2 className="mt-3 text-3xl sm:text-4xl lg:text-[2.75rem] font-extrabold tracking-tight text-navy-deep leading-[1.15]">
                      {t('smartScheduling.faqHeading') || "Smart Scheduling FAQs"}
                    </h2>
                    <p className="mt-4 text-base text-slate-body leading-relaxed">
                      {t('smartScheduling.faqDesc') || "Clear answers on Amazon's 5-30 day rule, buyer timezone scheduling, category delays, and account protection."}
                    </p>
                  </div>
                </Reveal>

                <Accordion type="single" collapsible className="w-full space-y-4">
                  {faqs.map((faq, idx) => (
                    <Reveal key={faq.q} delay={idx * 50}>
                      <AccordionItem
                        value={`faq-${idx}`}
                        className="liquid-glass rounded-2xl border border-white/80 bg-white/90 px-6 sm:px-7 shadow-[0_4px_20px_rgba(0,50,171,0.04)] border-b-0 transition-all hover:border-[#155dfc]/40 hover:shadow-[0_8px_30px_rgba(0,50,171,0.08)]"
                      >
                        <AccordionTrigger className="text-left hover:no-underline font-extrabold text-navy-deep text-base sm:text-lg py-5 flex gap-3.5">
                          <span className="flex items-center gap-3.5">
                            <span className="flex h-7 w-7 rounded-xl bg-gradient-to-br from-[#0032ab] to-[#155dfc] text-white items-center justify-center text-xs font-extrabold shadow-xs shrink-0">
                              {idx + 1}
                            </span>
                            <span>{faq.q}</span>
                          </span>
                        </AccordionTrigger>
                        <AccordionContent className="text-sm text-slate-body leading-relaxed pb-6 pl-10.5">
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
                  {t('smartScheduling.ctaHeading') || "Never Miss the Amazon Review Golden Window"}
                </h2>
                <p className="mt-2 text-slate-body text-xs sm:text-sm max-w-xl mx-auto leading-relaxed">
                  {t('smartScheduling.ctaDesc') || "Optimize your review velocity safely with Gravurtastisch's automated scheduler."}
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

function SmartSchedulingHeroSvg() {
  return (
    <svg
      viewBox="0 0 560 440"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-auto select-none"
      role="img"
      aria-label="Gravurtastisch Precision Chronometer & Smart Solicitation Delay Timing HUD"
    >
      <defs>
        {/* Soft Ambient Radial Lights */}
        <radialGradient id="sched-glow-blue" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#4f6ef7" stopOpacity="0.2" />
          <stop offset="60%" stopColor="#0032ab" stopOpacity="0.06" />
          <stop offset="100%" stopColor="#001855" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="sched-glow-cyan" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.18" />
          <stop offset="70%" stopColor="#0284c7" stopOpacity="0.05" />
          <stop offset="100%" stopColor="#001855" stopOpacity="0" />
        </radialGradient>



        {/* Crisp Card Subtle Background Shimmer */}
        <linearGradient id="sched-white-card-bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#F8FAFC" />
        </linearGradient>

        {/* Card Borders */}
        <linearGradient id="sched-card-border" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#E2E8F0" />
          <stop offset="50%" stopColor="#CBD5E1" />
          <stop offset="100%" stopColor="#BFDBFE" />
        </linearGradient>

        <linearGradient id="sched-blue-pill" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#0032ab" />
          <stop offset="50%" stopColor="#155dfc" />
          <stop offset="100%" stopColor="#4f6ef7" />
        </linearGradient>

        {/* Clock Dial Radial Gradient (Ice Blue) */}
        <radialGradient id="white-dial-center" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="70%" stopColor="#F0F7FF" />
          <stop offset="100%" stopColor="#E0EDFF" />
        </radialGradient>

        {/* Golden Hour Window Arc Gradient */}
        <linearGradient id="sched-arc-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="50%" stopColor="#155dfc" />
          <stop offset="100%" stopColor="#0032ab" />
        </linearGradient>

        {/* Slider Gradients */}
        <linearGradient id="slider-grad-cyan" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#155dfc" />
        </linearGradient>
        <linearGradient id="slider-grad-indigo" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#0032ab" />
          <stop offset="100%" stopColor="#155dfc" />
        </linearGradient>
        <linearGradient id="slider-grad-emerald" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#059669" />
          <stop offset="100%" stopColor="#10b981" />
        </linearGradient>

        {/* Sparkline Gradient */}
        <linearGradient id="sparkline-grad-clean" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#0032ab" />
          <stop offset="50%" stopColor="#155dfc" />
          <stop offset="100%" stopColor="#38bdf8" />
        </linearGradient>
      </defs>

      {/* Ambient Lighting Orbs */}
      <circle cx="140" cy="180" r="150" fill="url(#sched-glow-cyan)" pointerEvents="none" />
      <circle cx="410" cy="180" r="160" fill="url(#sched-glow-blue)" pointerEvents="none" />
      <circle cx="300" cy="340" r="150" fill="url(#sched-glow-blue)" pointerEvents="none" />

      {/* ==================================================== */}
      {/* 1. BACKGROUND CONNECTING BEAMS & PHOTONS */}
      {/* ==================================================== */}
      {/* Curved Beam from Dial to Category Delay Matrix */}
      <path
        d="M 270 160 C 285 160, 275 110, 290 110"
        fill="none"
        stroke="#38bdf8"
        strokeWidth="2.5"
        strokeDasharray="5 5"
      >
        <animate attributeName="stroke-dashoffset" values="0;-20" dur="1.4s" repeatCount="indefinite" />
      </path>

      {/* Curved Beam from Dial to Timezone Matrix */}
      <path
        d="M 270 250 C 285 250, 275 330, 290 330"
        fill="none"
        stroke="#38bdf8"
        strokeWidth="2.5"
        strokeDasharray="5 5"
      >
        <animate attributeName="stroke-dashoffset" values="0;-20" dur="1.2s" repeatCount="indefinite" />
      </path>

      {/* Traveling Energy Photons */}
      <circle cx="0" cy="0" r="4" fill="#155dfc" filter="drop-shadow(0 0 4px #38bdf8)">
        <animateMotion
          path="M 270 160 C 285 160, 275 110, 290 110"
          dur="1.4s"
          repeatCount="indefinite"
        />
      </circle>
      <circle cx="0" cy="0" r="4" fill="#155dfc" filter="drop-shadow(0 0 4px #38bdf8)">
        <animateMotion
          path="M 270 250 C 285 250, 275 330, 290 330"
          dur="1.2s"
          repeatCount="indefinite"
        />
      </circle>

      {/* ==================================================== */}
      {/* 2. TOP HUD: CHRONO ALGORITHM GATEWAY (WHITE PILL) */}
      {/* ==================================================== */}
      <g transform="translate(15, 14)">
        <rect
          x="0"
          y="0"
          width="530"
          height="38"
          rx="19"
          fill="#FFFFFF"
          stroke="#E2E8F0"
          strokeWidth="1.2"
          style={{ filter: "drop-shadow(0 6px 14px rgba(0, 26, 77, 0.16))" }}
        />
        {/* Pulsing Blue Light */}
        <circle cx="22" cy="19" r="4.5" fill="#155dfc">
          <animate attributeName="opacity" values="1;0.4;1" dur="1.6s" repeatCount="indefinite" />
        </circle>
        <circle cx="22" cy="19" r="9" fill="none" stroke="#38bdf8" strokeWidth="1" opacity="0.6">
          <animate attributeName="r" values="4.5;11;4.5" dur="1.6s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.8;0;0.8" dur="1.6s" repeatCount="indefinite" />
        </circle>

        {/* Title */}
        <text x="38" y="23.5" fill="#0f172a" fontFamily="system-ui, -apple-system, sans-serif" fontSize="11" fontWeight="800">
          ChronoTiming Precision Engine
        </text>

        {/* Window Badge */}
        <g transform="translate(230, 8)">
          <rect x="0" y="0" width="144" height="22" rx="11" fill="#eff6ff" stroke="#bfdbfe" strokeWidth="0.8" />
          <text x="72" y="15.5" textAnchor="middle" fill="#0032ab" fontFamily="monospace" fontSize="8.5" fontWeight="800">
            AMAZON 5-30 DAY WINDOW
          </text>
        </g>

        {/* Optimal Dispatch Pill */}
        <g transform="translate(385, 8)">
          <rect x="0" y="0" width="134" height="22" rx="11" fill="url(#sched-blue-pill)" />
          <text x="67" y="15.5" textAnchor="middle" fill="#ffffff" fontFamily="monospace" fontSize="8.5" fontWeight="800">
            ⚡ Peak: 18:30 Local Time
          </text>
        </g>
      </g>

      {/* ==================================================== */}
      {/* 3. CARD 1: 3D CHRONOMETER GOLDEN-HOUR DIAL (WHITE CARD) */}
      {/* ==================================================== */}
      <g transform="translate(15, 66)">
        <g>
          {/* Card Body */}
          <rect
            x="0"
            y="0"
            width="255"
            height="240"
            rx="18"
            fill="url(#sched-white-card-bg)"
            stroke="url(#sched-card-border)"
            strokeWidth="1.2"
            style={{ filter: "drop-shadow(0 10px 18px rgba(0, 26, 77, 0.18))" }}
          />

          {/* Header */}
          <rect x="10" y="10" width="235" height="26" rx="13" fill="url(#sched-blue-pill)" />
          <text x="20" y="27" fill="#ffffff" fontFamily="monospace" fontSize="9.5" fontWeight="800">
            01. GOLDEN HOUR RADAR
          </text>
          <rect x="180" y="13.5" width="58" height="19" rx="9.5" fill="#FFFFFF" />
          <text x="209" y="26.5" textAnchor="middle" fill="#0032ab" fontFamily="system-ui" fontSize="8.5" fontWeight="900">
            18:30 PM
          </text>

          {/* Chronometer Circular Dial */}
          <g transform="translate(127, 128)">
            {/* Outer Tech Ring */}
            <circle cx="0" cy="0" r="62" fill="none" stroke="#bfdbfe" strokeWidth="1.2" strokeDasharray="3 4" />
            <circle cx="0" cy="0" r="54" fill="url(#white-dial-center)" stroke="#93c5fd" strokeWidth="1.5" />

            {/* Glowing Arc (Peak Evening Window 17:00 - 21:00) */}
            <path
              d="M 28 42 A 54 54 0 0 1 -48 24"
              fill="none"
              stroke="url(#sched-arc-grad)"
              strokeWidth="6"
              strokeLinecap="round"
              filter="drop-shadow(0 0 4px #38bdf8)"
            />

            {/* Hour Markers */}
            {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg, i) => (
              <line
                key={i}
                x1="0"
                y1="-44"
                x2="0"
                y2="-50"
                stroke={i % 3 === 0 ? "#0032ab" : "#93c5fd"}
                strokeWidth={i % 3 === 0 ? "2" : "1"}
                transform={`rotate(${deg})`}
              />
            ))}

            {/* Rotating Radar Hand */}
            <g>
              <line x1="0" y1="0" x2="28" y2="38" stroke="#0032ab" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="0" y1="0" x2="-20" y2="-28" stroke="#155dfc" strokeWidth="1.5" strokeLinecap="round" />
              <circle cx="0" cy="0" r="6" fill="#0032ab" stroke="#38bdf8" strokeWidth="1.5" />
              <circle cx="0" cy="0" r="2.5" fill="#ffffff" />
            </g>

            {/* Central Rotating Photon */}
            <g transform="translate(0, 0)">
              <animateTransform
                attributeName="transform"
                type="rotate"
                from="0"
                to="360"
                dur="10s"
                repeatCount="indefinite"
              />
              <circle cx="36" cy="0" r="4" fill="#155dfc" filter="drop-shadow(0 0 3px #38bdf8)" />
            </g>
          </g>

          {/* Bottom Timezone Note */}
          <g transform="translate(12, 200)">
            <rect x="0" y="0" width="231" height="28" rx="14" fill="#eff6ff" stroke="#bfdbfe" strokeWidth="0.8" />
            <circle cx="14" cy="14" r="3.5" fill="#10b981" />
            <text x="26" y="18" fill="#0032ab" fontFamily="system-ui" fontSize="8.5" fontWeight="800">
              Auto-Adjusted to Buyer Local Time
            </text>
          </g>
        </g>
      </g>

      {/* ==================================================== */}
      {/* 4. CARD 2: CATEGORY-SPECIFIC DELAY SLIDERS (WHITE CARD) */}
      {/* ==================================================== */}
      <g transform="translate(285, 66)">
        <g>
          {/* Card Body */}
          <rect
            x="0"
            y="0"
            width="260"
            height="174"
            rx="18"
            fill="url(#sched-white-card-bg)"
            stroke="url(#sched-card-border)"
            strokeWidth="1.2"
            style={{ filter: "drop-shadow(0 10px 18px rgba(0, 26, 77, 0.18))" }}
          />

          {/* Header */}
          <rect x="10" y="10" width="240" height="26" rx="13" fill="url(#sched-blue-pill)" />
          <text x="20" y="27" fill="#ffffff" fontFamily="monospace" fontSize="9.5" fontWeight="800">
            02. CATEGORY DELAY MATRIX
          </text>
          <rect x="200" y="13.5" width="44" height="19" rx="9.5" fill="#FFFFFF" />
          <text x="222" y="26.5" textAnchor="middle" fill="#0032ab" fontFamily="system-ui" fontSize="8" fontWeight="900">
            AUTO
          </text>

          {/* Slider 1: Supplements / Consumables (14 Days) */}
          <g transform="translate(14, 50)">
            <text x="0" y="0" fill="#0f172a" fontFamily="system-ui" fontSize="8.5" fontWeight="800">
              💊 Supplements / Beauty
            </text>
            <text x="232" y="0" textAnchor="end" fill="#0032ab" fontFamily="monospace" fontSize="8.5" fontWeight="800">
              Day 14 (Usage)
            </text>
            {/* Slider track */}
            <rect x="0" y="7" width="232" height="7" rx="3.5" fill="#f1f5f9" stroke="#e2e8f0" strokeWidth="0.8" />
            <rect x="0" y="7" width="140" height="7" rx="3.5" fill="url(#slider-grad-indigo)" />
            <circle cx="140" cy="10.5" r="5.5" fill="#155dfc" stroke="#ffffff" strokeWidth="2" filter="drop-shadow(0 1px 3px rgba(0,0,0,0.2))">
              <animate attributeName="cx" values="140;144;140" dur="2s" repeatCount="indefinite" />
            </circle>
          </g>

          {/* Slider 2: Electronics / Gadgets (5 Days) */}
          <g transform="translate(14, 90)">
            <text x="0" y="0" fill="#0f172a" fontFamily="system-ui" fontSize="8.5" fontWeight="800">
              🎧 Electronics &amp; Audio
            </text>
            <text x="232" y="0" textAnchor="end" fill="#0032ab" fontFamily="monospace" fontSize="8.5" fontWeight="800">
              Day 5 (Golden)
            </text>
            {/* Slider track */}
            <rect x="0" y="7" width="232" height="7" rx="3.5" fill="#f1f5f9" stroke="#e2e8f0" strokeWidth="0.8" />
            <rect x="0" y="7" width="65" height="7" rx="3.5" fill="url(#slider-grad-cyan)" />
            <circle cx="65" cy="10.5" r="5.5" fill="#38bdf8" stroke="#ffffff" strokeWidth="2" filter="drop-shadow(0 1px 3px rgba(0,0,0,0.2))">
              <animate attributeName="cx" values="65;68;65" dur="2.4s" repeatCount="indefinite" />
            </circle>
          </g>

          {/* Slider 3: Apparel / Lifestyle (7 Days) */}
          <g transform="translate(14, 130)">
            <text x="0" y="0" fill="#0f172a" fontFamily="system-ui" fontSize="8.5" fontWeight="800">
              👕 Apparel &amp; Fashion
            </text>
            <text x="232" y="0" textAnchor="end" fill="#059669" fontFamily="monospace" fontSize="8.5" fontWeight="800">
              Day 7 (Fit Test)
            </text>
            {/* Slider track */}
            <rect x="0" y="7" width="232" height="7" rx="3.5" fill="#f1f5f9" stroke="#e2e8f0" strokeWidth="0.8" />
            <rect x="0" y="7" width="90" height="7" rx="3.5" fill="url(#slider-grad-emerald)" />
            <circle cx="90" cy="10.5" r="5.5" fill="#10b981" stroke="#ffffff" strokeWidth="2" filter="drop-shadow(0 1px 3px rgba(0,0,0,0.2))">
              <animate attributeName="cx" values="90;94;90" dur="2.2s" repeatCount="indefinite" />
            </circle>
          </g>
        </g>
      </g>

      {/* ==================================================== */}
      {/* 5. CARD 3: CONVERSION VELOCITY LIFT (WHITE CARD) */}
      {/* ==================================================== */}
      <g transform="translate(15, 318)">
        <g>
          {/* Card Body */}
          <rect
            x="0"
            y="0"
            width="255"
            height="110"
            rx="16"
            fill="url(#sched-white-card-bg)"
            stroke="url(#sched-card-border)"
            strokeWidth="1.2"
            style={{ filter: "drop-shadow(0 10px 18px rgba(0, 26, 77, 0.18))" }}
          />

          <g transform="translate(16, 18)">
            <text x="0" y="0" fill="#0f172a" fontFamily="system-ui" fontSize="8.5" fontWeight="900" letterSpacing="0.5">
              CONVERSION LIFT
            </text>
            <text x="220" y="0" textAnchor="end" fill="#f59e0b" fontFamily="system-ui" fontSize="8.5" fontWeight="800">
              ★★★★★ 5-Star
            </text>

            <text x="0" y="26" fill="#0032ab" fontFamily="monospace" fontSize="24" fontWeight="900">
              +38%
            </text>
            <text x="68" y="22" fill="#475569" fontFamily="system-ui" fontSize="9.5" fontWeight="700">
              More Verified Custom orders
            </text>

            {/* Gradient Sparkline Graphic */}
            <path
              d="M 0 46 Q 50 44, 100 38 T 165 32 T 220 22"
              fill="none"
              stroke="url(#sparkline-grad-clean)"
              strokeWidth="3"
              strokeLinecap="round"
            />
            <circle cx="220" cy="22" r="4" fill="#155dfc" filter="drop-shadow(0 0 3px #38bdf8)" />

            <text x="0" y="68" fill="#64748b" fontFamily="system-ui" fontSize="7.5" fontWeight="600">
              Optimal timing prevents buyer irritation &amp; strikes
            </text>
          </g>
        </g>
      </g>

      {/* ==================================================== */}
      {/* 6. CARD 4: GLOBAL BUYER TIMEZONE SYNC (WHITE CARD) */}
      {/* ==================================================== */}
      <g transform="translate(285, 252)">
        <g>
          {/* Card Body */}
          <rect
            x="0"
            y="0"
            width="260"
            height="176"
            rx="18"
            fill="url(#sched-white-card-bg)"
            stroke="url(#sched-card-border)"
            strokeWidth="1.2"
            style={{ filter: "drop-shadow(0 10px 18px rgba(0, 26, 77, 0.18))" }}
          />

          {/* Header */}
          <rect x="10" y="10" width="240" height="26" rx="13" fill="url(#sched-blue-pill)" />
          <text x="20" y="27" fill="#ffffff" fontFamily="monospace" fontSize="9.5" fontWeight="800">
            03. GLOBAL TIMEZONE SYNC
          </text>
          <circle cx="232" cy="23" r="4" fill="#ffffff" />

          {/* Timezone Row 1: US East */}
          <g transform="translate(14, 48)">
            <rect x="0" y="0" width="232" height="34" rx="8" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="0.8" />
            <FlagFR x={10} y={7.5} width={14} height={9} />
            <text x="28" y="15" fill="#0f172a" fontFamily="system-ui" fontSize="9" fontWeight="800">
              Paris (CEST)
            </text>
            <text x="10" y="27" fill="#64748b" fontFamily="system-ui" fontSize="7.5" fontWeight="600">
              Postal Code Mapped
            </text>
            <rect x="146" y="7" width="76" height="20" rx="10" fill="url(#sched-blue-pill)" />
            <text x="184" y="20.5" textAnchor="middle" fill="#ffffff" fontFamily="monospace" fontSize="8" fontWeight="800">
              18:30 QUEUED
            </text>
          </g>

          {/* Timezone Row 2: UK */}
          <g transform="translate(14, 88)">
            <rect x="0" y="0" width="232" height="34" rx="8" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="0.8" />
            <FlagGB x={10} y={7.5} width={14} height={9} />
            <text x="28" y="15" fill="#0f172a" fontFamily="system-ui" fontSize="9" fontWeight="800">
              London (BST)
            </text>
            <text x="10" y="27" fill="#64748b" fontFamily="system-ui" fontSize="7.5" fontWeight="600">
              Evening Slot Target
            </text>
            <rect x="146" y="7" width="76" height="20" rx="10" fill="#ecfdf5" stroke="#a7f3d0" strokeWidth="0.8" />
            <text x="184" y="20.5" textAnchor="middle" fill="#065f46" fontFamily="monospace" fontSize="8" fontWeight="800">
              19:00 READY
            </text>
          </g>

          {/* Timezone Row 3: EU Germany */}
          <g transform="translate(14, 128)">
            <rect x="0" y="0" width="232" height="34" rx="8" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="0.8" />
            <FlagDE x={10} y={7.5} width={14} height={9} />
            <text x="28" y="15" fill="#0f172a" fontFamily="system-ui" fontSize="9" fontWeight="800">
              Berlin (CEST)
            </text>
            <text x="10" y="27" fill="#64748b" fontFamily="system-ui" fontSize="7.5" fontWeight="600">
              Post-Dinner Window
            </text>
            <rect x="146" y="7" width="76" height="20" rx="10" fill="#eff6ff" stroke="#bfdbfe" strokeWidth="0.8" />
            <text x="184" y="20.5" textAnchor="middle" fill="#0032ab" fontFamily="monospace" fontSize="8" fontWeight="800">
              18:45 SYNCED
            </text>
          </g>
        </g>
      </g>
    </svg>
  );
}

function SmartSchedulingFaqSvg() {
  return (
    <svg
      viewBox="0 0 540 510"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-auto select-none"
      role="img"
      aria-label="Amazon 5 to 30 Day Smart Scheduling Chrono Timeline Flow"
    >
      <defs>
        {/* Modern Brand Gradients */}
        <linearGradient id="sched-s-ribbon-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4f6ef7" />
          <stop offset="40%" stopColor="#0032ab" />
          <stop offset="70%" stopColor="#4f6ef7" />
          <stop offset="100%" stopColor="#1d4ed8" />
        </linearGradient>

        <linearGradient id="sched-dial-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#F0F4FF" />
        </linearGradient>

        <linearGradient id="sched-pill-bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#F8FAFC" />
        </linearGradient>

        {/* Soft Drop Shadows & Glows */}
        <filter id="sched-pill-shadow" x="-15%" y="-15%" width="130%" height="135%">
          <feDropShadow dx="0" dy="5" stdDeviation="7" floodColor="#282828" floodOpacity="0.06" />
        </filter>

        <filter id="sched-core-glow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="8" stdDeviation="14" floodColor="#4f6ef7" floodOpacity="0.25" />
        </filter>
      </defs>

      {/* ==================================================== */}
      {/* 1. S-CURVED CHRONO TIMELINE RIBBON PATHWAY */}
      {/* ==================================================== */}
      {/* Outer Glowing Wave Trail */}
      <path
        d="M 130 60 C 260 60, 410 80, 410 150 C 410 220, 130 210, 130 310 C 130 400, 350 400, 410 445"
        fill="none"
        stroke="#E7E5E4"
        strokeWidth="10"
        strokeLinecap="round"
      />

      {/* Active Glowing Neon Core Tube */}
      <path
        d="M 130 60 C 260 60, 410 80, 410 150 C 410 220, 130 210, 130 310 C 130 400, 350 400, 410 445"
        fill="none"
        stroke="url(#sched-s-ribbon-grad)"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeDasharray="8 8"
      >
        <animate attributeName="stroke-dashoffset" values="0;-32" dur="2s" repeatCount="indefinite" />
      </path>

      {/* Pulsing Energy Photons Traveling along Timeline */}
      <circle cx="0" cy="0" r="5" fill="#4f6ef7">
        <animateMotion
          path="M 130 60 C 260 60, 410 80, 410 150 C 410 220, 130 210, 130 310 C 130 400, 350 400, 410 445"
          dur="5s"
          repeatCount="indefinite"
        />
      </circle>

      {/* ==================================================== */}
      {/* 2. TIMELINE MILESTONE 1: DAY 0 (ORDER DELIVERED) */}
      {/* ==================================================== */}
      <g transform="translate(20, 30)" filter="url(#sched-pill-shadow)">
        <g>
          <animateTransform
            attributeName="transform"
            type="translate"
            values="0 0; 0 -3; 0 0"
            dur="4s"
            repeatCount="indefinite"
          />
          {/* Pill Container */}
          <rect width="220" height="54" rx="14" fill="url(#sched-pill-bg)" stroke="#4f6ef7" strokeWidth="1" strokeOpacity="0.5" />

          <rect x="10" y="10" width="34" height="34" rx="8" fill="#F8FAFC" stroke="#4f6ef7" strokeWidth="0.8" />
          {/* Crisp Vector Parcel Box Icon */}
          <g transform="translate(19, 19)" stroke="#0032ab" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <path d="M 8 1 L 15 4.5 L 8 8 L 1 4.5 Z" fill="#EFF6FF" />
            <path d="M 1 4.5 L 1 11.5 L 8 15 L 8 8" />
            <path d="M 15 4.5 L 15 11.5 L 8 15" />
            <path d="M 4.5 6.2 L 11.5 2.7" />
          </g>

          <text x="52" y="24" fill="#0b132b" fontFamily="system-ui" fontSize="10.5" fontWeight="800">
            Day 0: Delivered
          </text>
          <text x="52" y="38" fill="#0032ab" fontFamily="monospace" fontSize="8" fontWeight="700">
            studio API Webhook Sync
          </text>

          <rect x="162" y="10" width="48" height="18" rx="6" fill="#F8FAFC" stroke="#4f6ef7" strokeWidth="0.8" />
          <text x="186" y="22.5" textAnchor="middle" fill="#0032ab" fontFamily="monospace" fontSize="7.5" fontWeight="800">
            START
          </text>
        </g>
      </g>

      {/* ==================================================== */}
      {/* 3. TIMELINE MILESTONE 2: DAYS 1-4 (EXPERIENCE BUFFER) */}
      {/* ==================================================== */}
      <g transform="translate(295, 115)" filter="url(#sched-pill-shadow)">
        <g>
          <animateTransform
            attributeName="transform"
            type="translate"
            values="0 0; 0 -3.5; 0 0"
            dur="4.5s"
            repeatCount="indefinite"
          />
          <rect width="225" height="54" rx="14" fill="url(#sched-pill-bg)" stroke="#4f6ef7" strokeWidth="1" strokeOpacity="0.5" />

          <rect x="10" y="10" width="34" height="34" rx="8" fill="#F8FAFC" stroke="#4f6ef7" strokeWidth="0.8" />
          {/* Crisp Vector Hourglass Timer Icon */}
          <g transform="translate(19, 19)" stroke="#0032ab" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <path d="M 2 1 L 14 1 M 2 15 L 14 15" />
            <path d="M 3 1 C 3 6, 7 7, 8 8 C 9 7, 13 6, 13 1" fill="#F8FAFC" />
            <path d="M 3 15 C 3 10, 7 9, 8 8 C 9 9, 13 10, 13 15" fill="#EFF6FF" />
            <circle cx="8" cy="12" r="0.8" fill="#0032ab" stroke="none" />
          </g>

          <text x="52" y="24" fill="#0b132b" fontFamily="system-ui" fontSize="10.5" fontWeight="800">
            Days 1-4: Buffer
          </text>
          <text x="52" y="38" fill="#0032ab" fontFamily="monospace" fontSize="8" fontWeight="700">
            0 Early Spam Sent
          </text>

          <rect x="150" y="10" width="65" height="18" rx="6" fill="#F8FAFC" stroke="#4f6ef7" strokeWidth="0.8" />
          <text x="182" y="22.5" textAnchor="middle" fill="#0032ab" fontFamily="monospace" fontSize="7.5" fontWeight="800">
            COOLDOWN
          </text>
        </g>
      </g>

      {/* ==================================================== */}
      {/* 4. TIMELINE MILESTONE 3 (HERO): DAY 5 // 18:30 GOLDEN HOUR */}
      {/* ==================================================== */}
      <g transform="translate(30, 215)" filter="url(#sched-core-glow)">
        <g>
          {/* Main Hero Capsule */}
          <rect width="480" height="92" rx="18" fill="url(#sched-dial-grad)" stroke="#155dfc" strokeWidth="1.2" />

          {/* Left Hero Rotating Chrono Clock */}
          <g transform="translate(46, 46)">
            {/* Outer Orbit */}
            <circle cx="0" cy="0" r="30" fill="none" stroke="#155dfc" strokeWidth="1.5" strokeDasharray="4 5">
              <animateTransform
                attributeName="transform"
                type="rotate"
                from="0"
                to="360"
                dur="18s"
                repeatCount="indefinite"
              />
            </circle>

            {/* Glowing Dial Body */}
            <circle cx="0" cy="0" r="25" fill="#EEF2FF" stroke="#155dfc" strokeWidth="1.8" />

            {/* Clock Hand pointing to 18:30 */}
            <line x1="0" y1="0" x2="12" y2="15" stroke="#0032ab" strokeWidth="2.2" strokeLinecap="round">
              <animateTransform
                attributeName="transform"
                type="rotate"
                from="0"
                to="360"
                dur="4s"
                repeatCount="indefinite"
              />
            </line>
            <circle cx="0" cy="0" r="3" fill="#0032ab" />
          </g>

          {/* Hero Center Text & Details */}
          <g transform="translate(90, 16)">
            {/* Optimal Tag */}
            <rect x="0" y="0" width="98" height="16" rx="8" fill="rgba(0,50,171,0.08)" stroke="#155dfc" strokeWidth="0.8" />
            <text x="49" y="11.5" textAnchor="middle" fill="#0032ab" fontFamily="monospace" fontSize="7.5" fontWeight="800">
              ★ DAY 05 OPTIMAL
            </text>

            <text x="0" y="38" fill="#0b132b" fontFamily="system-ui" fontSize="15" fontWeight="900">
              18:30 Buyer Local Peak
            </text>
            <text x="0" y="54" fill="#4b5563" fontFamily="system-ui" fontSize="8.5">
              Postal Geo-Sync • 0 Midnight Notification Spam
            </text>
          </g>

          {/* Right Status Badge Box */}
          <g transform="translate(378, 15)">
            <rect width="88" height="62" rx="10" fill="#FFFFFF" stroke="#0032ab" strokeOpacity="0.2" strokeWidth="0.8" />
            <text x="44" y="24" textAnchor="middle" fill="#0032ab" fontFamily="monospace" fontSize="15" fontWeight="900">
              +38%
            </text>
            <text x="44" y="38" textAnchor="middle" fill="#64748b" fontFamily="system-ui" fontSize="7.5" fontWeight="700">
              OPEN RATE
            </text>
            <rect x="10" y="46" width="68" height="6" rx="3" fill="#E2E8F0" />
            <rect x="10" y="46" width="52" height="6" rx="3" fill="#155dfc" />
          </g>
        </g>
      </g>

      {/* ==================================================== */}
      {/* 5. TIMELINE MILESTONE 4: DAY 14 (CATEGORY ADAPTIVE DELAY) */}
      {/* ==================================================== */}
      <g transform="translate(20, 350)" filter="url(#sched-pill-shadow)">
        <g>
          <animateTransform
            attributeName="transform"
            type="translate"
            values="0 0; 0 -3; 0 0"
            dur="4.2s"
            repeatCount="indefinite"
          />
          <rect width="225" height="54" rx="14" fill="url(#sched-pill-bg)" stroke="#4f6ef7" strokeWidth="1" strokeOpacity="0.5" />

          <rect x="10" y="10" width="34" height="34" rx="8" fill="#F8FAFC" stroke="#4f6ef7" strokeWidth="0.8" />
          {/* Crisp Vector Tuning Sliders Icon */}
          <g transform="translate(19, 19)" stroke="#0032ab" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <line x1="2" y1="4" x2="14" y2="4" />
            <circle cx="5" cy="4" r="2.2" fill="#F8FAFC" stroke="#0032ab" strokeWidth="1.4" />
            <line x1="2" y1="12" x2="14" y2="12" />
            <circle cx="11" cy="12" r="2.2" fill="#F8FAFC" stroke="#0032ab" strokeWidth="1.4" />
          </g>

          <text x="52" y="24" fill="#0b132b" fontFamily="system-ui" fontSize="10.5" fontWeight="800">
            Day 14: Category
          </text>
          <text x="52" y="38" fill="#0032ab" fontFamily="monospace" fontSize="8" fontWeight="700">
            Supplements / Beauty
          </text>

          <rect x="156" y="10" width="58" height="18" rx="6" fill="#F8FAFC" stroke="#4f6ef7" strokeWidth="0.8" />
          <text x="185" y="22.5" textAnchor="middle" fill="#0032ab" fontFamily="monospace" fontSize="7.5" fontWeight="800">
            CUSTOM
          </text>
        </g>
      </g>

      {/* ==================================================== */}
      {/* 6. TIMELINE MILESTONE 5: DAY 30 (AMAZON WINDOW LOCK) */}
      {/* ==================================================== */}
      <g transform="translate(295, 415)" filter="url(#sched-pill-shadow)">
        <g>
          <animateTransform
            attributeName="transform"
            type="translate"
            values="0 0; 0 -3.6; 0 0"
            dur="4.6s"
            repeatCount="indefinite"
          />
          <rect width="225" height="54" rx="14" fill="url(#sched-pill-bg)" stroke="#4f6ef7" strokeWidth="1" strokeOpacity="0.5" />

          <rect x="10" y="10" width="34" height="34" rx="8" fill="#F8FAFC" stroke="#4f6ef7" strokeWidth="0.8" />
          {/* Crisp Vector Shield / Lock Cutoff Icon */}
          <g transform="translate(19, 19)" stroke="#0032ab" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <path d="M 8 1 C 13 1, 15 4, 15 8 C 15 12.5, 8 15.5, 8 15.5 C 8 15.5, 1 12.5, 1 8 C 1 4, 3 1, 8 1 Z" fill="#EFF6FF" />
            <path d="M 5.5 8 L 10.5 8" stroke="#0032ab" strokeWidth="1.8" />
          </g>

          <text x="52" y="24" fill="#0b132b" fontFamily="system-ui" fontSize="10.5" fontWeight="800">
            Day 30: Cutoff
          </text>
          <text x="52" y="38" fill="#78716C" fontFamily="monospace" fontSize="8" fontWeight="700">
            Auto-Stop Guard
          </text>

          <rect x="156" y="10" width="58" height="18" rx="6" fill="#F8FAFC" stroke="#4f6ef7" strokeWidth="0.8" />
          <text x="185" y="22.5" textAnchor="middle" fill="#0032ab" fontFamily="monospace" fontSize="7.5" fontWeight="800">
            LOCKED
          </text>
        </g>
      </g>

      {/* ==================================================== */}
      {/* 7. FLOATING TIMEZONE PILLS IN CLEAR EMPTY SPACES */}
      {/* ==================================================== */}
      <g transform="translate(248, 70)" filter="url(#sched-pill-shadow)">
        <rect width="84" height="22" rx="11" fill="#F8FAFC" stroke="#4f6ef7" strokeWidth="0.8" />
        <FlagFR x={8} y={6.5} width={13} height={9} />
        <text x="25" y="14.5" fill="#0b132b" fontFamily="system-ui" fontSize="8" fontWeight="800">
          18:30 CEST
        </text>
      </g>

      <g transform="translate(425, 40)" filter="url(#sched-pill-shadow)">
        <rect width="84" height="22" rx="11" fill="#F8FAFC" stroke="#4f6ef7" strokeWidth="0.8" />
        <FlagGB x={8} y={6.5} width={13} height={9} />
        <text x="25" y="14.5" fill="#0b132b" fontFamily="system-ui" fontSize="8" fontWeight="800">
          19:00 BST
        </text>
      </g>

      <g transform="translate(255, 330)" filter="url(#sched-pill-shadow)">
        <rect width="84" height="22" rx="11" fill="#F8FAFC" stroke="#4f6ef7" strokeWidth="0.8" />
        <FlagDE x={8} y={6.5} width={13} height={9} />
        <text x="25" y="14.5" fill="#0b132b" fontFamily="system-ui" fontSize="8" fontWeight="800">
          18:45 CEST
        </text>
      </g>
    </svg>
  );
}
