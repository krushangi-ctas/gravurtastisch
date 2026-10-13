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
import i18n from "@/i18n/config";
import { ServicePageSkeleton } from "@/components/skeletons/ServicePageSkeleton";

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
      color: "bg-[#282828] text-[#D2B48C] font-bold border border-[#D2B48C]",
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
        <section className="relative overflow-hidden pt-24 pb-8 lg:pt-28 lg:pb-10 bg-gradient-to-b from-navy-deep via-navy to-navy-soft text-white w-full max-w-full">
          <div className="absolute inset-0 grid-bg opacity-40 pointer-events-none" />
          <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-white/5 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-brand/20 blur-3xl pointer-events-none" />

          <Container className="relative">
            <div className="grid lg:grid-cols-12 gap-10 lg:gap-12 items-center">
              {/* Left Column: Hero Content */}
              <Reveal className="lg:col-span-6 xl:col-span-6">
                <div className="inline-flex items-center gap-2 rounded-full bg-brand/20 border border-brand/40 px-3.5 py-1 text-xs font-semibold text-brand-bright mb-4">
                  <Sparkles className="h-3.5 w-3.5" />
                  {t('smartScheduling.heroBadge') || "Algorithmic Delivery Timing"}
                </div>
                <h1 className="text-4xl sm:text-5xl lg:text-[3.25rem] font-extrabold tracking-tight leading-[1.1]">
                  <span className="text-gradient-silver">{t('smartScheduling.heroTitle') || "Smart Scheduling for"}</span>{" "}
                  <span className="text-gradient-gold">{t('smartScheduling.heroTitleHighlight') || "Maximum Custom orders"}</span>
                </h1>
                <p className="mt-4 text-white/70 text-base sm:text-lg leading-relaxed max-w-xl">
                  {t('smartScheduling.heroDesc') || "Reach Amazon buyers at the exact moment they are happiest with their order. Fully compliant with Amazon's 5-30 day solicitation window and tailored to buyer timezones."}
                </p>
                <div className="mt-6 flex flex-wrap gap-4">
                  <a
                    href="/#register"
                    className="inline-flex items-center gap-2 rounded-full bg-brand px-6 py-3 text-sm font-bold text-navy-deep shadow-lg shadow-brand/30 hover:bg-brand-bright hover:-translate-y-0.5 transition-all"
                  >
                    {t('smartScheduling.heroCtaRegister') || "Enable Smart Scheduling"}
                    <ArrowRight className="h-4 w-4" />
                  </a>
                  <a
                    href="#timeline"
                    className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/20 px-6 py-3 text-sm font-semibold text-white hover:bg-white/20 transition-all"
                  >
                    {t('smartScheduling.heroCtaHow') || "Explore 5-30 Day Timeline"}
                  </a>
                </div>
              </Reveal>

              {/* Right Column: Unique Smart Scheduling & Timezone Chronometer Vector SVG */}
              <Reveal className="lg:col-span-6 xl:col-span-6 relative" delay={120}>
                <div className="relative max-w-lg mx-auto lg:max-w-none">
                  {/* Subtle Neon Aura Glow Backdrop */}
                  <div className="absolute -inset-2 bg-gradient-to-r from-brand/30 via-white/10 to-brand/20 rounded-3xl blur-2xl opacity-60 pointer-events-none" />

                  {/* Clean SVG Vector Illustration Container */}
                  <div className="relative flex items-center justify-center select-none">
                    <SmartSchedulingHeroSvg />
                  </div>
                </div>
              </Reveal>
            </div>

            {/* Chrono Dial & Timing Telemetry Meters */}
            <div className="mt-8 sm:mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 border-t border-white/10 pt-6">
              {/* Chrono Dial 1: +38% Review Lift */}
              <Reveal delay={50}>
                <div className="group relative rounded-2xl bg-gradient-to-b from-white/[0.08] to-white/[0.02] border border-white/15 p-3.5 sm:p-4 backdrop-blur-md hover:border-brand/50 transition-all shadow-lg flex items-center gap-3.5">
                  <div className="relative h-13 w-13 shrink-0 flex items-center justify-center">
                    {/* SVG Radial Arc Meter */}
                    <svg className="h-13 w-13 -rotate-90" viewBox="0 0 48 48">
                      <circle cx="24" cy="24" r="18" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="3.5" />
                      <circle
                        cx="24"
                        cy="24"
                        r="18"
                        fill="none"
                        stroke="#D2B48C"
                        strokeWidth="3.5"
                        strokeDasharray="113"
                        strokeDashoffset="38"
                        strokeLinecap="round"
                      />
                    </svg>
                    <span className="absolute text-[11px] font-black text-brand-bright font-mono">+38%</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-brand-bright animate-pulse" />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-brand-bright">{t('smartScheduling.chrono1Tag') || "Conversion Lift"}</span>
                    </div>
                    <p className="text-sm font-bold text-white mt-0.5">{t('smartScheduling.chrono1Title') || "Verified Custom orders"}</p>
                    <p className="text-[10px] text-white/50">{t('smartScheduling.chrono1Sub') || "Optimal timing boost"}</p>
                  </div>
                </div>
              </Reveal>

              {/* Chrono Dial 2: 0% Policy Violations */}
              <Reveal delay={100}>
                <div className="group relative rounded-2xl bg-gradient-to-b from-white/[0.08] to-white/[0.02] border border-white/15 p-3.5 sm:p-4 backdrop-blur-md hover:border-brand/50 transition-all shadow-lg flex items-center gap-3.5">
                  <div className="relative h-13 w-13 shrink-0 flex items-center justify-center">
                    <svg className="h-13 w-13 -rotate-90" viewBox="0 0 48 48">
                      <circle cx="24" cy="24" r="18" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="3.5" />
                      <circle
                        cx="24"
                        cy="24"
                        r="18"
                        fill="none"
                        stroke="#D2B48C"
                        strokeWidth="3.5"
                        strokeDasharray="113"
                        strokeDashoffset="0"
                        strokeLinecap="round"
                      />
                    </svg>
                    <span className="absolute text-[11px] font-black text-brand-bright font-mono">0%</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-brand-bright" />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-brand-bright">{t('smartScheduling.chrono2Tag') || "Policy Violations"}</span>
                    </div>
                    <p className="text-sm font-bold text-white mt-0.5">{t('smartScheduling.chrono2Title') || "100% Amazon ToS"}</p>
                    <p className="text-[10px] text-white/50">{t('smartScheduling.chrono2Sub') || "Automated safety lock"}</p>
                  </div>
                </div>
              </Reveal>

              {/* Chrono Dial 3: 100% Timezone Precision */}
              <Reveal delay={150}>
                <div className="group relative rounded-2xl bg-gradient-to-b from-white/[0.08] to-white/[0.02] border border-white/15 p-3.5 sm:p-4 backdrop-blur-md hover:border-brand/50 transition-all shadow-lg flex items-center gap-3.5">
                  <div className="relative h-13 w-13 shrink-0 flex items-center justify-center">
                    <svg className="h-13 w-13 -rotate-90" viewBox="0 0 48 48">
                      <circle cx="24" cy="24" r="18" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="3.5" />
                      <circle
                        cx="24"
                        cy="24"
                        r="18"
                        fill="none"
                        stroke="#D2B48C"
                        strokeWidth="3.5"
                        strokeDasharray="113"
                        strokeDashoffset="10"
                        strokeLinecap="round"
                      />
                    </svg>
                    <span className="absolute text-[10px] font-black text-brand-bright font-mono">18:30</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-brand-bright" />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-brand-bright">{t('smartScheduling.chrono3Tag') || "Buyer Timezone"}</span>
                    </div>
                    <p className="text-sm font-bold text-white mt-0.5">{t('smartScheduling.chrono3Title') || "Evening Peak Slot"}</p>
                    <p className="text-[10px] text-white/50">{t('smartScheduling.chrono3Sub') || "Postal-code aligned"}</p>
                  </div>
                </div>
              </Reveal>

              {/* Chrono Dial 4: 5-30 Days Golden Window */}
              <Reveal delay={200}>
                <div className="group relative rounded-2xl bg-gradient-to-b from-white/[0.08] to-white/[0.02] border border-white/15 p-3.5 sm:p-4 backdrop-blur-md hover:border-brand-bright/50 transition-all shadow-lg flex items-center gap-3.5">
                  <div className="relative h-13 w-13 shrink-0 rounded-2xl bg-white/10 border border-white/20 flex flex-col items-center justify-center text-white">
                    <span className="text-[12px] font-black font-mono leading-none">5-30</span>
                    <span className="text-[8px] font-bold uppercase text-slate-300 mt-0.5">DAYS</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-white/80" />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300">{t('smartScheduling.chrono4Tag') || "Golden Window"}</span>
                    </div>
                    <p className="text-sm font-bold text-white mt-0.5">{t('smartScheduling.chrono4Title') || "Compliant Timeline"}</p>
                    <p className="text-[10px] text-white/50">{t('smartScheduling.chrono4Sub') || "Category-tuned delays"}</p>
                  </div>
                </div>
              </Reveal>
            </div>
          </Container>
        </section>

        {/* Interactive 4-Quadrant Timing Engine Matrix */}
        <section className="py-10 lg:py-14 bg-surface border-b border-border">
          <Container>
            <Reveal>
              <div className="max-w-2xl mb-8">
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-brand">
                  {t('smartScheduling.matrixSectionBadge') || "Core Algorithm"}
                </span>
                <h2 className="mt-3 text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-navy-deep leading-tight">
                  {t('smartScheduling.matrixHeading') || "Timing Is Everything in Amazon Review Conversions"}
                </h2>
                <p className="mt-2 text-slate-body text-sm sm:text-base leading-relaxed">
                  {t('smartScheduling.matrixDesc') || "Sending a production job too early annoys the customer before they've tried the product. Sending too late leads to low recall. Smart scheduling strikes the perfect balance."}
                </p>
              </div>
            </Reveal>

            {/* 2x2 Interactive Control Matrix */}
            <div className="grid md:grid-cols-2 gap-5 items-stretch">
              {/* Quadrant 1: Strict 5-30 Day Policy Guardrail */}
              <Reveal delay={60}>
                <div className="h-full rounded-3xl bg-white border border-border p-5 sm:p-6 shadow-sm hover:border-brand/40 hover:shadow-md transition-all flex flex-col justify-between group">
                  <div>
                    <div className="flex items-center justify-between gap-3 mb-3.5">
                      <div className="h-10 w-10 rounded-2xl bg-brand/10 text-brand border border-brand/20 grid place-items-center group-hover:bg-brand group-hover:text-white transition-colors">
                        <ShieldCheck className="h-5 w-5" />
                      </div>
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-brand/10 text-brand border border-brand/20">
                        {t('smartScheduling.quad1Tag') || "100% Policy-Safe"}
                      </span>
                    </div>

                    <h3 className="text-base sm:text-lg font-bold text-navy-deep">
                      {t('smartScheduling.quad1Title') || "Strict 5-30 Day Window Compliance"}
                    </h3>
                    <p className="mt-1.5 text-xs sm:text-sm text-slate-body leading-relaxed">
                      {t('smartScheduling.quad1Desc') || "Amazon policy strictly prohibits solicitations outside the 5 to 30-day post-delivery range. Gravurtastisch enforces this guardrail automatically."}
                    </p>

                    {/* Embedded Widget: 3-Stage Range Gauge */}
                    <div className="mt-4 rounded-2xl bg-slate-50 border border-slate-200/80 p-3.5 space-y-2">
                      <div className="flex items-center justify-between text-[11px] font-mono text-slate-500">
                        <span>POLICY RANGE TRACKER</span>
                        <span className="text-brand font-bold flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3 text-brand" />
                          AUTO-ENFORCED
                        </span>
                      </div>
                      <div className="h-2.5 w-full bg-slate-200 rounded-full overflow-hidden flex p-0.5 gap-1">
                        <div className="h-full w-1/4 bg-slate-400 rounded-full" title="Days 0-4 Cooldown" />
                        <div className="h-full w-2/4 bg-brand rounded-full animate-pulse" title="Days 5-30 Golden Window" />
                        <div className="h-full w-1/4 bg-stone-400 rounded-full" title="Day 31+ Cutoff" />
                      </div>
                      <div className="flex items-center justify-between text-[10.5px] pt-0.5">
                        <span className="text-slate-400">Day 0-4: Cooldown</span>
                        <span className="text-brand font-bold flex items-center gap-1">
                          <Sparkles className="h-3 w-3 text-brand" />
                          Day 5-30: Golden Slot
                        </span>
                        <span className="text-stone-400">Day 31+: Closed</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <span>Account Strike Protection</span>
                    <span className="font-semibold text-brand">Idempotent 1-Send Lock</span>
                  </div>
                </div>
              </Reveal>

              {/* Quadrant 2: Buyer Timezone Evening Peak Optimization */}
              <Reveal delay={100}>
                <div className="h-full rounded-3xl bg-white border border-border p-5 sm:p-6 shadow-sm hover:border-brand/40 hover:shadow-md transition-all flex flex-col justify-between group">
                  <div>
                    <div className="flex items-center justify-between gap-3 mb-3.5">
                      <div className="h-10 w-10 rounded-2xl bg-brand/10 text-brand border border-brand/20 grid place-items-center group-hover:bg-brand group-hover:text-white transition-colors">
                        <SunMedium className="h-5 w-5" />
                      </div>
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-brand/10 text-brand border border-brand/20">
                        {t('smartScheduling.quad2Tag') || "18:30 Evening Peak"}
                      </span>
                    </div>

                    <h3 className="text-base sm:text-lg font-bold text-navy-deep">
                      {t('smartScheduling.quad2Title') || "Buyer Timezone Optimization"}
                    </h3>
                    <p className="mt-1.5 text-xs sm:text-sm text-slate-body leading-relaxed">
                      {t('smartScheduling.quad2Desc') || "Review solicitations are scheduled for peak opening hours (6:00 PM - 9:00 PM local buyer time) rather than midnight notifications."}
                    </p>

                    {/* Embedded Widget: Live Multi-Market Timezone Console */}
                    <div className="mt-4 rounded-2xl bg-slate-50 border border-slate-200/80 p-3 space-y-2">
                      <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200/60 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-brand bg-brand/10 px-1.5 py-0.5 rounded">US</span>
                          <span className="font-semibold text-navy-deep">New York (EDT)</span>
                        </div>
                        <span className="font-mono text-[11px] font-bold text-brand bg-brand/10 px-2 py-0.5 rounded-md">
                          18:30 Local Slot
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200/60 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-brand bg-brand/10 px-1.5 py-0.5 rounded">UK</span>
                          <span className="font-semibold text-navy-deep">London (BST)</span>
                        </div>
                        <span className="font-mono text-[11px] font-bold text-brand bg-brand/10 px-2 py-0.5 rounded-md">
                          19:00 Local Slot
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <span>Postal-Code Geo Mapping</span>
                    <span className="font-semibold text-brand">Zero Midnight Spam</span>
                  </div>
                </div>
              </Reveal>

              {/* Quadrant 3: Category-Specific Delay Matrix */}
              <Reveal delay={140}>
                <div className="h-full rounded-3xl bg-white border border-border p-5 sm:p-6 shadow-sm hover:border-brand/40 hover:shadow-md transition-all flex flex-col justify-between group">
                  <div>
                    <div className="flex items-center justify-between gap-3 mb-3.5">
                      <div className="h-10 w-10 rounded-2xl bg-brand/10 text-brand border border-brand/20 grid place-items-center group-hover:bg-brand group-hover:text-white transition-colors">
                        <Sliders className="h-5 w-5" />
                      </div>
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-brand/10 text-brand border border-brand/20">
                        {t('smartScheduling.quad3Tag') || "ASIN Granularity"}
                      </span>
                    </div>

                    <h3 className="text-base sm:text-lg font-bold text-navy-deep">
                      {t('smartScheduling.quad3Title') || "Category-Specific Smart Delays"}
                    </h3>
                    <p className="mt-1.5 text-xs sm:text-sm text-slate-body leading-relaxed">
                      {t('smartScheduling.quad3Desc') || "Tailor send delays to product complexity: supplements need 14 days of usage, whereas simple phone cases can be reviewed in 5 days."}
                    </p>

                    {/* Embedded Widget: 3 Category Delay Sliders */}
                    <div className="mt-4 rounded-2xl bg-slate-50 border border-slate-200/80 p-3 space-y-2">
                      <div>
                        <div className="flex justify-between text-[11px] font-semibold text-slate-700 mb-1">
                          <span className="flex items-center gap-1.5">
                            <Pill className="h-3.5 w-3.5 text-brand" />
                            Supplements / Skincare
                          </span>
                          <span className="text-brand font-mono">14 Days Delay</span>
                        </div>
                        <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                          <div className="h-full w-3/4 bg-brand rounded-full" />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-[11px] font-semibold text-slate-700 mb-1">
                          <span className="flex items-center gap-1.5">
                            <Headphones className="h-3.5 w-3.5 text-brand" />
                            Tech &amp; Electronics
                          </span>
                          <span className="text-brand font-mono">5 Days Delay</span>
                        </div>
                        <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                          <div className="h-full w-1/3 bg-brand rounded-full" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <span>SKU Override Rules</span>
                    <span className="font-semibold text-brand">Adaptive Timing</span>
                  </div>
                </div>
              </Reveal>

              {/* Quadrant 4: +38% Review Conversion Lift Engine */}
              <Reveal delay={180}>
                <div className="h-full rounded-3xl bg-white border border-border p-5 sm:p-6 shadow-sm hover:border-brand/40 hover:shadow-md transition-all flex flex-col justify-between group">
                  <div>
                    <div className="flex items-center justify-between gap-3 mb-3.5">
                      <div className="h-10 w-10 rounded-2xl bg-brand/10 text-brand border border-brand/20 grid place-items-center group-hover:bg-brand group-hover:text-white transition-colors">
                        <TrendingUp className="h-5 w-5" />
                      </div>
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-brand/10 text-brand border border-brand/20">
                        {t('smartScheduling.quad4Tag') || "Conversion Engine"}
                      </span>
                    </div>

                    <h3 className="text-base sm:text-lg font-bold text-navy-deep">
                      {t('smartScheduling.quad4Title') || "+38% Review Conversion Velocity"}
                    </h3>
                    <p className="mt-1.5 text-xs sm:text-sm text-slate-body leading-relaxed">
                      {t('smartScheduling.quad4Desc') || "Timing production jobs when buyers are most satisfied with their delivery significantly drives positive feedback and boosts review rates."}
                    </p>

                    {/* Embedded Widget: Stat & 5-Star Telemetry Box */}
                    <div className="mt-4 rounded-2xl bg-slate-50 border border-slate-200/80 p-3.5 flex items-center justify-between">
                      <div>
                        <p className="text-2xl font-extrabold text-navy-deep font-mono">+38%</p>
                        <p className="text-[11px] font-semibold text-slate-500">Average Review Velocity Lift</p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center justify-end gap-0.5">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className="h-3.5 w-3.5 fill-brand text-brand" />
                          ))}
                        </div>
                        <span className="text-[10px] font-bold text-brand bg-brand/10 px-2 py-0.5 rounded-full mt-1 inline-block">
                          Verified Amazon ToS
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <span>Organic Feedback Growth</span>
                    <span className="font-semibold text-brand">Maximum Open Rate</span>
                  </div>
                </div>
              </Reveal>
            </div>
          </Container>
        </section>

        {/* Interactive Timeline Diagram */}
        <section id="timeline" className="py-10 lg:py-14 bg-white">
          <Container>
            <Reveal>
              <div className="text-center max-w-3xl mx-auto mb-8">
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-brand">
                  {t('smartScheduling.timelineBadge') || "The Review Lifecycle"}
                </span>
                <h2 className="mt-3 text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-navy-deep leading-tight">
                  {t('smartScheduling.timelineHeading') || "The Amazon 5 to 30-Day Golden Window"}
                </h2>
                <p className="mt-2 text-slate-body text-sm sm:text-base">
                  {t('smartScheduling.timelineDesc') || "How Gravurtastisch sequences every delivered order for maximum buyer engagement."}
                </p>
              </div>
            </Reveal>

            <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-5">
              {timelinePhases.map((phase, idx) => (
                <Reveal key={phase.day} delay={idx * 60}>
                  <div className="rounded-2xl border border-border bg-surface p-5 sm:p-6 h-full flex flex-col justify-between hover:border-brand/30 transition-colors">
                    <div>
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-mono font-bold mb-2.5 ${phase.color}`}>
                        {phase.day}
                      </span>
                      <h3 className="text-base font-bold text-navy-deep mb-1.5">{phase.title}</h3>
                      <p className="text-xs sm:text-sm text-slate-body leading-relaxed">{phase.desc}</p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>

            {/* Callout Box */}
            <Reveal delay={200}>
              <div className="mt-8 rounded-2xl bg-navy-deep text-white p-5 sm:p-7 border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
                <div className="flex items-center gap-3.5">
                  <div className="h-11 w-11 rounded-xl bg-brand/20 text-brand-bright grid place-items-center shrink-0">
                    <Zap className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-base">{t('smartScheduling.calloutTitle') || "Automatic Status Flip: Counted as Sent"}</h4>
                    <p className="text-xs sm:text-sm text-white/60 mt-0.5">
                      {t('smartScheduling.calloutDesc') || "The moment Gravurtastisch dispatches the request through studio API, status updates to Sent immediately."}
                    </p>
                  </div>
                </div>
                <a
                  href="/#register"
                  className="inline-flex items-center gap-2 rounded-full bg-brand px-5 py-2.5 text-xs font-bold text-navy-deep hover:bg-brand-bright transition-colors shrink-0"
                >
                  {t('smartScheduling.calloutCta') || "Configure Your Delays →"}
                </a>
              </div>
            </Reveal>
          </Container>
        </section>

        {/* FAQ Section (2-Column: Left Organic Chrono-Astrolabe SVG, Right FAQs) */}
        <section className="py-10 lg:py-14 bg-white border-b border-border">
          <Container>
            <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-center">
              {/* Left Column: Organic Holographic Astrolabe & Precision Arc Time-Stream */}
              <Reveal className="lg:col-span-5 xl:col-span-5">
                <div className="space-y-4">
                  {/* Clean Non-Box Floating Vector Graphic */}
                  <div className="relative flex items-center justify-center">
                    <SmartSchedulingFaqSvg />
                  </div>

                  <div className="rounded-2xl bg-surface border border-border p-4 flex items-center justify-between gap-4 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-xl bg-brand/10 text-brand grid place-items-center shrink-0">
                        <Headphones className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-navy-deep">{t('smartScheduling.faqSupportTitle') || "Have timing or policy questions?"}</p>
                        <p className="text-[10.5px] text-slate-body">{t('smartScheduling.faqSupportDesc') || "Our team assists with custom delay configurations."}</p>
                      </div>
                    </div>
                    <a
                      href="/#contact"
                      className="inline-flex items-center gap-1 text-xs font-bold text-brand hover:text-brand-bright transition-colors shrink-0"
                    >
                      {t('smartScheduling.faqSupportLink') || "Talk to us →"}
                    </a>
                  </div>
                </div>
              </Reveal>

              {/* Right Column: FAQs List */}
              <div className="lg:col-span-7 xl:col-span-7">
                <Reveal>
                  <div className="mb-6">
                    <span className="text-xs font-bold uppercase tracking-[0.2em] text-brand">
                      {t('smartScheduling.faqBadge') || "Timing & Policies"}
                    </span>
                    <h2 className="mt-3 text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-navy-deep leading-tight">
                      {t('smartScheduling.faqHeading') || "Smart Scheduling FAQs"}
                    </h2>
                    <p className="mt-2 text-sm text-slate-body leading-relaxed">
                      {t('smartScheduling.faqDesc') || "Clear answers on Amazon's 5-30 day rule, buyer timezone scheduling, category delays, and account protection."}
                    </p>
                  </div>
                </Reveal>

                <Accordion type="single" collapsible className="w-full space-y-3.5">
                  {faqs.map((faq, idx) => (
                    <Reveal key={faq.q} delay={idx * 50}>
                      <AccordionItem
                        value={`faq-${idx}`}
                        className="rounded-2xl border border-slate-200/80 bg-white px-5 sm:px-6 shadow-xs border-b-0 transition-all hover:border-brand/40"
                      >
                        <AccordionTrigger className="text-left hover:no-underline font-bold text-navy-deep text-sm sm:text-base py-4 sm:py-5 flex gap-3">
                          <span className="flex items-center gap-3">
                            <span className="flex h-6 w-6 rounded-full bg-brand/10 text-brand items-center justify-center text-xs font-bold shrink-0">
                              {idx + 1}
                            </span>
                            <span>{faq.q}</span>
                          </span>
                        </AccordionTrigger>
                        <AccordionContent className="text-xs sm:text-sm text-slate-body leading-relaxed pb-5 pl-9">
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
        <section className="py-8 lg:py-10">
          <Container>
            <div className="rounded-3xl bg-gradient-to-br from-navy-deep via-navy-deep to-brand p-8 sm:p-12 text-white text-center shadow-xl">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight">
                {t('smartScheduling.ctaHeading') || "Never Miss the Amazon Review Golden Window"}
              </h2>
              <p className="mt-3 text-white/75 text-sm sm:text-base max-w-xl mx-auto">
                {t('smartScheduling.ctaDesc') || "Optimize your review velocity safely with Gravurtastisch's automated scheduler."}
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-4">
                <a
                  href="/#register"
                  className="inline-flex items-center gap-2 rounded-full bg-brand-bright px-7 py-3.5 text-sm font-bold text-navy-deep hover:bg-white transition-all shadow-lg hover:-translate-y-0.5"
                >
                  {t('smartScheduling.ctaButton') || "Register as Seller"}
                  <ArrowRight className="h-4 w-4" />
                </a>
                <a
                  href="/#pricing"
                  className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/20 px-7 py-3.5 text-sm font-semibold text-white hover:bg-white/20 transition-all"
                >
                  {t('smartScheduling.ctaPricing') || "View Pricing Plans"}
                </a>
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
      aria-label="Smart Scheduling & Timezone Optimization Chronometer Engine"
    >
      <defs>
        {/* Soft Drop Shadows for White Cards */}
        <filter id="white-sched-shadow" x="-8%" y="-8%" width="116%" height="120%">
          <feDropShadow dx="0" dy="10" stdDeviation="14" floodColor="#0F172A" floodOpacity="0.22" />
        </filter>

        <filter id="white-sched-shadow-sm" x="-8%" y="-8%" width="116%" height="120%">
          <feDropShadow dx="0" dy="4" stdDeviation="8" floodColor="#0F172A" floodOpacity="0.14" />
        </filter>

        {/* Clock Dial Radial Gradient on White */}
        <radialGradient id="white-dial-center" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="70%" stopColor="#FAF9F6" />
          <stop offset="100%" stopColor="#F5F2EB" />
        </radialGradient>

        {/* Golden Hour Window Arc Gradient */}
        <linearGradient id="white-arc-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#D2B48C" />
          <stop offset="100%" stopColor="#B8966C" />
        </linearGradient>

        {/* Slider Gradients */}
        <linearGradient id="slider-grad-cyan" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#D2B48C" />
          <stop offset="100%" stopColor="#EAD7BC" />
        </linearGradient>
        <linearGradient id="slider-grad-indigo" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#282828" />
          <stop offset="100%" stopColor="#4A4A4A" />
        </linearGradient>
        <linearGradient id="slider-grad-emerald" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#D2B48C" />
          <stop offset="100%" stopColor="#B8966C" />
        </linearGradient>

        {/* Sparkline Gradient */}
        <linearGradient id="sparkline-grad-clean" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#D2B48C" />
          <stop offset="50%" stopColor="#EAD7BC" />
          <stop offset="100%" stopColor="#D2B48C" />
        </linearGradient>
      </defs>

      {/* ==================================================== */}
      {/* 1. BACKGROUND CONNECTING BEAMS & PHOTONS */}
      {/* ==================================================== */}
      {/* Curved Beam from Dial to Category Delay Matrix */}
      <path
        d="M 230 160 C 270 160, 260 110, 300 110"
        fill="none"
        stroke="#D2B48C"
        strokeWidth="2.2"
        strokeDasharray="5 5"
      >
        <animate attributeName="stroke-dashoffset" values="0;-20" dur="1.4s" repeatCount="indefinite" />
      </path>

      {/* Curved Beam from Dial to Timezone Matrix */}
      <path
        d="M 230 250 C 270 250, 260 330, 300 330"
        fill="none"
        stroke="#D2B48C"
        strokeWidth="2.2"
        strokeDasharray="5 5"
      >
        <animate attributeName="stroke-dashoffset" values="0;-20" dur="1.2s" repeatCount="indefinite" />
      </path>

      {/* Traveling Energy Photons */}
      <circle cx="0" cy="0" r="3.5" fill="#D2B48C">
        <animateMotion
          path="M 230 160 C 270 160, 260 110, 300 110"
          dur="1.4s"
          repeatCount="indefinite"
        />
      </circle>
      <circle cx="0" cy="0" r="3.5" fill="#D2B48C">
        <animateMotion
          path="M 230 250 C 270 250, 260 330, 300 330"
          dur="1.2s"
          repeatCount="indefinite"
        />
      </circle>

      {/* ==================================================== */}
      {/* 2. TOP HUD: CHRONO ALGORITHM GATEWAY (WHITE) */}
      {/* ==================================================== */}
      <g transform="translate(20, 15)" filter="url(#white-sched-shadow)">
        <rect
          x="0"
          y="0"
          width="520"
          height="38"
          rx="12"
          fill="#FAF9F6"
          stroke="#D2B48C"
          strokeWidth="1.2"
        />
        {/* Pulsing Tan Light */}
        <circle cx="20" cy="19" r="4.5" fill="#D2B48C">
          <animate attributeName="opacity" values="1;0.4;1" dur="1.6s" repeatCount="indefinite" />
        </circle>
        <circle cx="20" cy="19" r="8.5" fill="none" stroke="#D2B48C" strokeWidth="1" opacity="0.4">
          <animate attributeName="r" values="4.5;11;4.5" dur="1.6s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.6;0;0.6" dur="1.6s" repeatCount="indefinite" />
        </circle>

        {/* Title */}
        <text x="36" y="23" fill="#282828" fontFamily="system-ui" fontSize="11" fontWeight="800">
          ChronoTiming Precision Engine
        </text>

        {/* Window Badge */}
        <g transform="translate(230, 9)">
          <rect x="0" y="0" width="130" height="20" rx="6" fill="#282828" stroke="#D2B48C" strokeWidth="0.8" />
          <text x="65" y="14" textAnchor="middle" fill="#D2B48C" fontFamily="monospace" fontSize="9" fontWeight="800">
            AMAZON 5-30 DAY WINDOW
          </text>
        </g>

        {/* Optimal Dispatch Pill */}
        <g transform="translate(375, 8)">
          <rect x="0" y="0" width="132" height="22" rx="7" fill="#FFFFFF" stroke="#D2B48C" strokeWidth="0.8" />
          <text x="66" y="15" textAnchor="middle" fill="#282828" fontFamily="monospace" fontSize="9" fontWeight="800">
            ⚡ Peak: 18:30 Local Time
          </text>
        </g>
      </g>

      {/* ==================================================== */}
      {/* 3. CARD 1: 3D CHRONOMETER GOLDEN-HOUR DIAL (LEFT - WHITE) */}
      {/* ==================================================== */}
      <g transform="translate(20, 68)" filter="url(#white-sched-shadow)">
        <g>
          <animateTransform
            attributeName="transform"
            type="translate"
            values="0 0; 0 -4; 0 0"
            dur="4s"
            repeatCount="indefinite"
          />
          {/* Card Body */}
          <rect
            x="0"
            y="0"
            width="250"
            height="235"
            rx="16"
            fill="#FAF9F6"
            stroke="#D2B48C"
            strokeWidth="1.2"
          />

          {/* Header */}
          <rect x="10" y="10" width="230" height="24" rx="7" fill="#282828" stroke="#D2B48C" strokeWidth="0.8" />
          <text x="18" y="26" fill="#D2B48C" fontFamily="monospace" fontSize="9.5" fontWeight="800">
            01. GOLDEN HOUR RADAR
          </text>
          <rect x="175" y="13" width="58" height="18" rx="5" fill="#FAF9F6" stroke="#D2B48C" strokeWidth="0.8" />
          <text x="204" y="25" textAnchor="middle" fill="#282828" fontFamily="system-ui" fontSize="8" fontWeight="800">
            18:30 PM
          </text>

          {/* Chronometer Circular Dial */}
          <g transform="translate(125, 125)">
            {/* Outer Tech Ring */}
            <circle cx="0" cy="0" r="62" fill="none" stroke="#D2B48C" strokeWidth="1" strokeDasharray="3 5" opacity="0.4" />
            <circle cx="0" cy="0" r="54" fill="url(#white-dial-center)" stroke="#D2B48C" strokeWidth="1.5" />

            {/* Golden Arc (Peak Evening Window 17:00 - 21:00) */}
            <path
              d="M 28 42 A 54 54 0 0 1 -48 24"
              fill="none"
              stroke="url(#white-arc-grad)"
              strokeWidth="5.5"
              strokeLinecap="round"
            />

            {/* Hour Markers */}
            {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg, i) => (
              <line
                key={i}
                x1="0"
                y1="-46"
                x2="0"
                y2="-51"
                stroke={i % 3 === 0 ? "#282828" : "#D2B48C"}
                strokeWidth={i % 3 === 0 ? "2" : "1"}
                transform={`rotate(${deg})`}
              />
            ))}

            {/* Rotating Radar Hand */}
            <g>
              <line x1="0" y1="0" x2="28" y2="38" stroke="#282828" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="0" y1="0" x2="-20" y2="-28" stroke="#D2B48C" strokeWidth="1.5" strokeLinecap="round" />
              <circle cx="0" cy="0" r="5.5" fill="#282828" />
              <circle cx="0" cy="0" r="2.5" fill="#FAF9F6" />
            </g>

            {/* Central Rotating Photon */}
            <g transform="translate(0, 0)">
              <animateTransform
                attributeName="transform"
                type="rotate"
                from="0"
                to="360"
                dur="12s"
                repeatCount="indefinite"
              />
              <circle cx="36" cy="0" r="3.5" fill="#D2B48C" />
            </g>
          </g>

          {/* Bottom Timezone Note */}
          <g transform="translate(12, 195)">
            <rect x="0" y="0" width="226" height="28" rx="7" fill="#FFFFFF" stroke="#D2B48C" strokeWidth="0.8" />
            <circle cx="12" cy="14" r="3.5" fill="#D2B48C" />
            <text x="22" y="17.5" fill="#282828" fontFamily="system-ui" fontSize="8.5" fontWeight="700">
              Auto-Adjusted to Buyer Local Time
            </text>
          </g>
        </g>
      </g>

      {/* ==================================================== */}
      {/* 4. CARD 2: CATEGORY-SPECIFIC DELAY SLIDERS (RIGHT TOP - WHITE) */}
      {/* ==================================================== */}
      <g transform="translate(285, 68)" filter="url(#white-sched-shadow)">
        <g>
          <animateTransform
            attributeName="transform"
            type="translate"
            values="0 0; 0 -5; 0 0"
            dur="4.5s"
            repeatCount="indefinite"
          />
          {/* Card Body */}
          <rect
            x="0"
            y="0"
            width="255"
            height="170"
            rx="16"
            fill="#FAF9F6"
            stroke="#D2B48C"
            strokeWidth="1.2"
          />

          {/* Header */}
          <rect x="10" y="10" width="235" height="24" rx="7" fill="#282828" stroke="#D2B48C" strokeWidth="0.8" />
          <text x="18" y="26" fill="#D2B48C" fontFamily="monospace" fontSize="9.5" fontWeight="800">
            02. CATEGORY DELAY MATRIX
          </text>
          <rect x="195" y="13" width="44" height="18" rx="5" fill="#FAF9F6" stroke="#D2B48C" strokeWidth="0.8" />
          <text x="217" y="25" textAnchor="middle" fill="#282828" fontFamily="system-ui" fontSize="8" fontWeight="800">
            AUTO
          </text>

          {/* Slider 1: Supplements / Consumables (14 Days) */}
          <g transform="translate(14, 48)">
            <text x="0" y="0" fill="#282828" fontFamily="system-ui" fontSize="8.5" fontWeight="800">
              💊 Supplements / Beauty
            </text>
            <text x="226" y="0" textAnchor="end" fill="#282828" fontFamily="monospace" fontSize="8.5" fontWeight="800">
              Day 14 (Usage)
            </text>
            {/* Slider track */}
            <rect x="0" y="7" width="226" height="6" rx="3" fill="#E5E5DF" />
            <rect x="0" y="7" width="135" height="6" rx="3" fill="url(#slider-grad-indigo)" />
            <circle cx="135" cy="10" r="5" fill="#FFFFFF" stroke="#282828" strokeWidth="2" />
          </g>

          {/* Slider 2: Electronics / Gadgets (5 Days) */}
          <g transform="translate(14, 88)">
            <text x="0" y="0" fill="#282828" fontFamily="system-ui" fontSize="8.5" fontWeight="800">
              🎧 Electronics &amp; Audio
            </text>
            <text x="226" y="0" textAnchor="end" fill="#282828" fontFamily="monospace" fontSize="8.5" fontWeight="800">
              Day 5 (Golden)
            </text>
            {/* Slider track */}
            <rect x="0" y="7" width="226" height="6" rx="3" fill="#E5E5DF" />
            <rect x="0" y="7" width="60" height="6" rx="3" fill="url(#slider-grad-cyan)" />
            <circle cx="60" cy="10" r="5" fill="#FFFFFF" stroke="#D2B48C" strokeWidth="2" />
          </g>

          {/* Slider 3: Apparel / Lifestyle (7 Days) */}
          <g transform="translate(14, 128)">
            <text x="0" y="0" fill="#282828" fontFamily="system-ui" fontSize="8.5" fontWeight="800">
              👕 Apparel &amp; Fashion
            </text>
            <text x="226" y="0" textAnchor="end" fill="#282828" fontFamily="monospace" fontSize="8.5" fontWeight="800">
              Day 7 (Fit Test)
            </text>
            {/* Slider track */}
            <rect x="0" y="7" width="226" height="6" rx="3" fill="#E5E5DF" />
            <rect x="0" y="7" width="85" height="6" rx="3" fill="url(#slider-grad-emerald)" />
            <circle cx="85" cy="10" r="5" fill="#FFFFFF" stroke="#D2B48C" strokeWidth="2" />
          </g>
        </g>
      </g>

      {/* ==================================================== */}
      {/* 5. CARD 3: CONVERSION VELOCITY LIFT (BOTTOM LEFT - WHITE) */}
      {/* ==================================================== */}
      <g transform="translate(20, 318)" filter="url(#white-sched-shadow)">
        <g>
          <animateTransform
            attributeName="transform"
            type="translate"
            values="0 0; 0 -4; 0 0"
            dur="4.2s"
            repeatCount="indefinite"
          />
          {/* Card Body */}
          <rect
            x="0"
            y="0"
            width="250"
            height="108"
            rx="14"
            fill="#FAF9F6"
            stroke="#D2B48C"
            strokeWidth="1.2"
          />

          <g transform="translate(16, 18)">
            <text x="0" y="0" fill="#282828" fontFamily="system-ui" fontSize="8.5" fontWeight="800" letterSpacing="0.5">
              CONVERSION LIFT
            </text>
            <text x="215" y="0" textAnchor="end" fill="#D2B48C" fontFamily="system-ui" fontSize="8.5" fontWeight="800">
              ★★★★★ 5-Star
            </text>

            <text x="0" y="24" fill="#282828" fontFamily="monospace" fontSize="22" fontWeight="900">
              +38%
            </text>
            <text x="62" y="21" fill="#666666" fontFamily="system-ui" fontSize="9" fontWeight="700">
              More Verified Custom orders
            </text>

            {/* Gradient Sparkline Graphic */}
            <path
              d="M 0 46 Q 50 44, 100 38 T 165 32 T 215 24"
              fill="none"
              stroke="url(#sparkline-grad-clean)"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <circle cx="215" cy="24" r="3.5" fill="#D2B48C" />

            <text x="0" y="66" fill="#666666" fontFamily="system-ui" fontSize="7.5" fontWeight="600">
              Optimal timing prevents buyer irritation &amp; strikes
            </text>
          </g>
        </g>
      </g>

      {/* ==================================================== */}
      {/* 6. CARD 4: GLOBAL BUYER TIMEZONE SYNC (BOTTOM RIGHT - WHITE) */}
      {/* ==================================================== */}
      <g transform="translate(285, 252)" filter="url(#white-sched-shadow)">
        <g>
          <animateTransform
            attributeName="transform"
            type="translate"
            values="0 0; 0 -4; 0 0"
            dur="3.8s"
            repeatCount="indefinite"
          />
          {/* Card Body */}
          <rect
            x="0"
            y="0"
            width="255"
            height="174"
            rx="16"
            fill="#FAF9F6"
            stroke="#D2B48C"
            strokeWidth="1.2"
          />

          {/* Header */}
          <rect x="10" y="10" width="235" height="24" rx="7" fill="#282828" stroke="#D2B48C" strokeWidth="0.8" />
          <text x="18" y="26" fill="#D2B48C" fontFamily="monospace" fontSize="9.5" fontWeight="800">
            03. GLOBAL TIMEZONE SYNC
          </text>
          <circle cx="228" cy="22" r="4" fill="#D2B48C" />

          {/* Timezone Row 1: US East */}
          <g transform="translate(14, 48)">
            <rect x="0" y="0" width="226" height="32" rx="8" fill="#FFFFFF" stroke="#E5E5DF" strokeWidth="0.8" />
            <text x="10" y="15" fill="#282828" fontFamily="system-ui" fontSize="9" fontWeight="800">
              🇺🇸 New York (EDT)
            </text>
            <text x="10" y="26" fill="#666666" fontFamily="system-ui" fontSize="7.5" fontWeight="500">
              Postal Code Mapped
            </text>
            <rect x="144" y="7" width="74" height="18" rx="5" fill="#282828" stroke="#D2B48C" strokeWidth="0.8" />
            <text x="181" y="19" textAnchor="middle" fill="#D2B48C" fontFamily="monospace" fontSize="8" fontWeight="800">
              18:30 QUEUED
            </text>
          </g>

          {/* Timezone Row 2: UK */}
          <g transform="translate(14, 86)">
            <rect x="0" y="0" width="226" height="32" rx="8" fill="#FFFFFF" stroke="#E5E5DF" strokeWidth="0.8" />
            <text x="10" y="15" fill="#282828" fontFamily="system-ui" fontSize="9" fontWeight="800">
              🇬🇧 London (BST)
            </text>
            <text x="10" y="26" fill="#666666" fontFamily="system-ui" fontSize="7.5" fontWeight="500">
              Evening Slot Target
            </text>
            <rect x="144" y="7" width="74" height="18" rx="5" fill="#FAF9F6" stroke="#D2B48C" strokeWidth="0.8" />
            <text x="181" y="19" textAnchor="middle" fill="#282828" fontFamily="monospace" fontSize="8" fontWeight="800">
              19:00 READY
            </text>
          </g>

          {/* Timezone Row 3: EU Germany */}
          <g transform="translate(14, 124)">
            <rect x="0" y="0" width="226" height="32" rx="8" fill="#FFFFFF" stroke="#E5E5DF" strokeWidth="0.8" />
            <text x="10" y="15" fill="#282828" fontFamily="system-ui" fontSize="9" fontWeight="800">
              🇩🇪 Berlin (CEST)
            </text>
            <text x="10" y="26" fill="#666666" fontFamily="system-ui" fontSize="7.5" fontWeight="500">
              Post-Dinner Window
            </text>
            <rect x="144" y="7" width="74" height="18" rx="5" fill="#FAF9F6" stroke="#D2B48C" strokeWidth="0.8" />
            <text x="181" y="19" textAnchor="middle" fill="#282828" fontFamily="monospace" fontSize="8" fontWeight="800">
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
          <stop offset="0%" stopColor="#D2B48C" />
          <stop offset="40%" stopColor="#B8966C" />
          <stop offset="70%" stopColor="#D2B48C" />
          <stop offset="100%" stopColor="#8C7355" />
        </linearGradient>

        <linearGradient id="sched-dial-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#282828" />
          <stop offset="60%" stopColor="#1E1E1E" />
          <stop offset="100%" stopColor="#141414" />
        </linearGradient>

        <linearGradient id="sched-pill-bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#FAF9F6" />
        </linearGradient>

        {/* Soft Drop Shadows & Glows */}
        <filter id="sched-pill-shadow" x="-15%" y="-15%" width="130%" height="135%">
          <feDropShadow dx="0" dy="5" stdDeviation="7" floodColor="#282828" floodOpacity="0.06" />
        </filter>

        <filter id="sched-core-glow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="8" stdDeviation="14" floodColor="#D2B48C" floodOpacity="0.25" />
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
      <circle cx="0" cy="0" r="5" fill="#D2B48C">
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
          <rect width="220" height="54" rx="14" fill="url(#sched-pill-bg)" stroke="#D2B48C" strokeWidth="1" strokeOpacity="0.5" />

          <rect x="10" y="10" width="34" height="34" rx="8" fill="#FAF9F6" stroke="#D2B48C" strokeWidth="0.8" />
          {/* Crisp Vector Parcel Box Icon */}
          <g transform="translate(19, 19)" stroke="#B8966C" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <path d="M 8 1 L 15 4.5 L 8 8 L 1 4.5 Z" fill="#F5EBE1" />
            <path d="M 1 4.5 L 1 11.5 L 8 15 L 8 8" />
            <path d="M 15 4.5 L 15 11.5 L 8 15" />
            <path d="M 4.5 6.2 L 11.5 2.7" />
          </g>

          <text x="52" y="24" fill="#282828" fontFamily="system-ui" fontSize="10.5" fontWeight="800">
            Day 0: Delivered
          </text>
          <text x="52" y="38" fill="#B8966C" fontFamily="monospace" fontSize="8" fontWeight="700">
            studio API Webhook Sync
          </text>

          <rect x="162" y="10" width="48" height="18" rx="6" fill="#FAF9F6" stroke="#D2B48C" strokeWidth="0.8" />
          <text x="186" y="22.5" textAnchor="middle" fill="#282828" fontFamily="monospace" fontSize="7.5" fontWeight="800">
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
          <rect width="225" height="54" rx="14" fill="url(#sched-pill-bg)" stroke="#D2B48C" strokeWidth="1" strokeOpacity="0.5" />

          <rect x="10" y="10" width="34" height="34" rx="8" fill="#FAF9F6" stroke="#D2B48C" strokeWidth="0.8" />
          {/* Crisp Vector Hourglass Timer Icon */}
          <g transform="translate(19, 19)" stroke="#B8966C" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <path d="M 2 1 L 14 1 M 2 15 L 14 15" />
            <path d="M 3 1 C 3 6, 7 7, 8 8 C 9 7, 13 6, 13 1" fill="#FAF9F6" />
            <path d="M 3 15 C 3 10, 7 9, 8 8 C 9 9, 13 10, 13 15" fill="#F5EBE1" />
            <circle cx="8" cy="12" r="0.8" fill="#B8966C" stroke="none" />
          </g>

          <text x="52" y="24" fill="#282828" fontFamily="system-ui" fontSize="10.5" fontWeight="800">
            Days 1-4: Buffer
          </text>
          <text x="52" y="38" fill="#B8966C" fontFamily="monospace" fontSize="8" fontWeight="700">
            0 Early Spam Sent
          </text>

          <rect x="150" y="10" width="65" height="18" rx="6" fill="#FAF9F6" stroke="#D2B48C" strokeWidth="0.8" />
          <text x="182" y="22.5" textAnchor="middle" fill="#282828" fontFamily="monospace" fontSize="7.5" fontWeight="800">
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
          <rect width="480" height="92" rx="18" fill="url(#sched-dial-grad)" stroke="#D2B48C" strokeWidth="1.5" />

          {/* Left Hero Rotating Chrono Clock */}
          <g transform="translate(46, 46)">
            {/* Outer Orbit */}
            <circle cx="0" cy="0" r="30" fill="none" stroke="#D2B48C" strokeWidth="1.5" strokeDasharray="4 5">
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
            <circle cx="0" cy="0" r="25" fill="#1C1C1C" stroke="#D2B48C" strokeWidth="2" />

            {/* Clock Hand pointing to 18:30 */}
            <line x1="0" y1="0" x2="12" y2="15" stroke="#D2B48C" strokeWidth="2.2" strokeLinecap="round">
              <animateTransform
                attributeName="transform"
                type="rotate"
                from="0"
                to="360"
                dur="4s"
                repeatCount="indefinite"
              />
            </line>
            <circle cx="0" cy="0" r="3" fill="#FAF9F6" />
          </g>

          {/* Hero Center Text & Details */}
          <g transform="translate(90, 16)">
            {/* Optimal Tag */}
            <rect x="0" y="0" width="98" height="16" rx="8" fill="#1E1E1E" stroke="#D2B48C" strokeWidth="0.8" />
            <text x="49" y="11.5" textAnchor="middle" fill="#D2B48C" fontFamily="monospace" fontSize="7.5" fontWeight="800">
              ★ DAY 05 OPTIMAL
            </text>

            <text x="0" y="38" fill="#FAF9F6" fontFamily="system-ui" fontSize="15" fontWeight="900">
              18:30 Buyer Local Peak
            </text>
            <text x="0" y="54" fill="#A8A29E" fontFamily="system-ui" fontSize="8.5">
              Postal Geo-Sync • 0 Midnight Notification Spam
            </text>
          </g>

          {/* Right Status Badge Box */}
          <g transform="translate(378, 15)">
            <rect width="88" height="62" rx="10" fill="#1E1E1E" stroke="#383838" strokeWidth="0.8" />
            <text x="44" y="24" textAnchor="middle" fill="#D2B48C" fontFamily="monospace" fontSize="15" fontWeight="900">
              +38%
            </text>
            <text x="44" y="38" textAnchor="middle" fill="#A8A29E" fontFamily="system-ui" fontSize="7.5" fontWeight="700">
              OPEN RATE
            </text>
            <rect x="10" y="46" width="68" height="6" rx="3" fill="#383838" />
            <rect x="10" y="46" width="52" height="6" rx="3" fill="#D2B48C" />
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
          <rect width="225" height="54" rx="14" fill="url(#sched-pill-bg)" stroke="#D2B48C" strokeWidth="1" strokeOpacity="0.5" />

          <rect x="10" y="10" width="34" height="34" rx="8" fill="#FAF9F6" stroke="#D2B48C" strokeWidth="0.8" />
          {/* Crisp Vector Tuning Sliders Icon */}
          <g transform="translate(19, 19)" stroke="#B8966C" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <line x1="2" y1="4" x2="14" y2="4" />
            <circle cx="5" cy="4" r="2.2" fill="#FAF9F6" stroke="#B8966C" strokeWidth="1.4" />
            <line x1="2" y1="12" x2="14" y2="12" />
            <circle cx="11" cy="12" r="2.2" fill="#FAF9F6" stroke="#B8966C" strokeWidth="1.4" />
          </g>

          <text x="52" y="24" fill="#282828" fontFamily="system-ui" fontSize="10.5" fontWeight="800">
            Day 14: Category
          </text>
          <text x="52" y="38" fill="#B8966C" fontFamily="monospace" fontSize="8" fontWeight="700">
            Supplements / Beauty
          </text>

          <rect x="156" y="10" width="58" height="18" rx="6" fill="#FAF9F6" stroke="#D2B48C" strokeWidth="0.8" />
          <text x="185" y="22.5" textAnchor="middle" fill="#282828" fontFamily="monospace" fontSize="7.5" fontWeight="800">
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
          <rect width="225" height="54" rx="14" fill="url(#sched-pill-bg)" stroke="#D2B48C" strokeWidth="1" strokeOpacity="0.5" />

          <rect x="10" y="10" width="34" height="34" rx="8" fill="#FAF9F6" stroke="#D2B48C" strokeWidth="0.8" />
          {/* Crisp Vector Shield / Lock Cutoff Icon */}
          <g transform="translate(19, 19)" stroke="#282828" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <path d="M 8 1 C 13 1, 15 4, 15 8 C 15 12.5, 8 15.5, 8 15.5 C 8 15.5, 1 12.5, 1 8 C 1 4, 3 1, 8 1 Z" fill="#F5EBE1" />
            <path d="M 5.5 8 L 10.5 8" stroke="#282828" strokeWidth="1.8" />
          </g>

          <text x="52" y="24" fill="#282828" fontFamily="system-ui" fontSize="10.5" fontWeight="800">
            Day 30: Cutoff
          </text>
          <text x="52" y="38" fill="#78716C" fontFamily="monospace" fontSize="8" fontWeight="700">
            Auto-Stop Guard
          </text>

          <rect x="156" y="10" width="58" height="18" rx="6" fill="#FAF9F6" stroke="#D2B48C" strokeWidth="0.8" />
          <text x="185" y="22.5" textAnchor="middle" fill="#282828" fontFamily="monospace" fontSize="7.5" fontWeight="800">
            LOCKED
          </text>
        </g>
      </g>

      {/* ==================================================== */}
      {/* 7. FLOATING TIMEZONE PILLS IN CLEAR EMPTY SPACES */}
      {/* ==================================================== */}
      <g transform="translate(248, 70)" filter="url(#sched-pill-shadow)">
        <rect width="84" height="22" rx="11" fill="#FAF9F6" stroke="#D2B48C" strokeWidth="0.8" />
        <circle cx="10" cy="11" r="3" fill="#D2B48C" />
        <text x="18" y="15" fill="#282828" fontFamily="system-ui" fontSize="8" fontWeight="800">
          🇺🇸 18:30 EDT
        </text>
      </g>

      <g transform="translate(425, 40)" filter="url(#sched-pill-shadow)">
        <rect width="84" height="22" rx="11" fill="#FAF9F6" stroke="#D2B48C" strokeWidth="0.8" />
        <circle cx="10" cy="11" r="3" fill="#D2B48C" />
        <text x="18" y="15" fill="#282828" fontFamily="system-ui" fontSize="8" fontWeight="800">
          🇬🇧 19:00 BST
        </text>
      </g>

      <g transform="translate(255, 330)" filter="url(#sched-pill-shadow)">
        <rect width="84" height="22" rx="11" fill="#FAF9F6" stroke="#D2B48C" strokeWidth="0.8" />
        <circle cx="10" cy="11" r="3" fill="#D2B48C" />
        <text x="18" y="15" fill="#282828" fontFamily="system-ui" fontSize="8" fontWeight="800">
          🇩🇪 18:45 CEST
        </text>
      </g>
    </svg>
  );
}
