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
import i18n from "@/i18n/config";
import { seo } from "@/utils/seo";

export const Route = createFileRoute("/smart-scheduling")({
  pendingComponent: ServicePageSkeleton,
  head: () =>
    seo({
      title: "Batch Processing & Production Queue - Printomation SaaS",
      description: i18n.exists("smartScheduling.heroDesc")
        ? i18n.t("smartScheduling.heroDesc")
        : "Automated batch processing, machine queue management, and ready-to-run file compilation for Amazon Custom sellers.",
      url: "/smart-scheduling",
      keywords: ["batch processing", "amazon custom batch files", "laser file queue", "printomation"],
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
      day: "Step 01",
      title: t('smartScheduling.phase0Title') || "1. Learn & Register",
      desc: t('smartScheduling.phase0Desc') || "Discover our SaaS features, register your seller account, and start your free trial.",
      color: "bg-[#0032ab]/10 text-[#0032ab] border-[#0032ab]/20",
    },
    {
      day: "Step 02",
      title: t('smartScheduling.phase1Title') || "2. Choose Subscription",
      desc: t('smartScheduling.phase1Desc') || "Select a transparent plan matched to your monthly Amazon Custom order volume.",
      color: "bg-[#155dfc]/10 text-[#155dfc] border-[#155dfc]/25",
    },
    {
      day: "Step 03",
      title: t('smartScheduling.phase2Title') || "3. Connect Amazon Store",
      desc: t('smartScheduling.phase2Desc') || "Authorize official SP-API integration in one click to stream your custom listings.",
      color: "bg-indigo-50 text-indigo-700 border-indigo-200",
    },
    {
      day: "Step 04",
      title: t('smartScheduling.phase3Title') || "4. Batch File Compilation",
      desc: t('smartScheduling.phase3Desc') || "Our engine compiles orders into calibrated SVG, DXF, and 300 DPI PDF files on schedule.",
      color: "bg-emerald-50 text-emerald-700 border-emerald-200",
    },
    {
      day: "Step 05",
      title: t('smartScheduling.phase4Title') || "5. Download & Produce",
      desc: t('smartScheduling.phase4Desc') || "Download organized batch ZIPs and load them directly into LightBurn, EZCad, or your RIP.",
      color: "bg-sky-50 text-sky-700 border-sky-200",
    },
  ];

  const faqs = [
    {
      q: t('smartScheduling.faq1Q') || "Do you manufacture, print, or ship physical products?",
      a: t('smartScheduling.faq1A') || "No. We are strictly a B2B SaaS software platform. We do not manufacture, engrave, or ship any physical goods. Our software generates the production-ready files that your own workshop machines or production partners use to print and engrave.",
    },
    {
      q: t('smartScheduling.faq2Q') || "How does batch file generation save time for sellers?",
      a: t('smartScheduling.faq2A') || "Manually creating files in design software takes 4-7 minutes per custom order. Printomation generates 100 calibrated machine files in under 60 seconds, reducing pre-press labor by up to 85%.",
    },
    {
      q: t('smartScheduling.faq3Q') || "Which file formats and machines are supported?",
      a: t('smartScheduling.faq3A') || "We output production-ready vector SVG and DXF files (for LightBurn, EZCad, RDWorks, and CNC routers) as well as 300+ DPI print PDFs (for UV flatbed, sublimation, and direct-to-film printers).",
    },
    {
      q: t('smartScheduling.faq4Q') || "Can I configure custom batch schedules?",
      a: t('smartScheduling.faq4A') || "Yes. You can set automated triggers to compile batches at specific times of day (e.g. 08:30 AM before workshop shifts) or run continuous real-time compilation.",
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
                    <span className="absolute text-[11px] font-black text-emerald-600 font-mono">5k+</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">{t('smartScheduling.chrono2Tag') || "Holiday Scale"}</span>
                    </div>
                    <p className="text-sm font-bold text-navy-deep mt-0.5">{t('smartScheduling.chrono2Title') || "High-Volume Batches"}</p>
                    <p className="text-[10.5px] text-slate-500">{t('smartScheduling.chrono2Sub') || "5,000+ orders / day"}</p>
                  </div>
                </div>
              </Reveal>

              {/* Chrono Dial 3: Zero Misprint Shield */}
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
                    <span className="absolute text-[10px] font-black text-indigo-600 font-mono">100%</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700">{t('smartScheduling.chrono3Tag') || "100% Precision"}</span>
                    </div>
                    <p className="text-sm font-bold text-navy-deep mt-0.5">{t('smartScheduling.chrono3Title') || "Zero Misprint Shield"}</p>
                    <p className="text-[10.5px] text-slate-500">{t('smartScheduling.chrono3Sub') || "Pre-flight boundary lock"}</p>
                  </div>
                </div>
              </Reveal>

              {/* Chrono Dial 4: Multi-Format Output */}
              <Reveal delay={200}>
                <div className="group relative rounded-2xl sm:rounded-3xl liquid-glass border border-white/80 p-5 sm:p-6 shadow-[0_8px_30px_rgba(0,50,171,0.06)] hover:shadow-[0_16px_40px_rgba(0,50,171,0.12)] transition-all duration-300 flex items-center gap-4 hover:-translate-y-1">
                  <div className="relative h-13 w-13 shrink-0 rounded-2xl bg-amber-50 border border-amber-200 flex flex-col items-center justify-center text-amber-700 shadow-inner">
                    <span className="text-[11px] font-black font-mono leading-none">SVG</span>
                    <span className="text-[8px] font-bold uppercase text-amber-600 mt-0.5">DXF·PDF</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700">{t('smartScheduling.chrono4Tag') || "Multi-Format"}</span>
                    </div>
                    <p className="text-sm font-bold text-navy-deep mt-0.5">{t('smartScheduling.chrono4Title') || "Multi-Format Output"}</p>
                    <p className="text-[10.5px] text-slate-500">{t('smartScheduling.chrono4Sub') || "Laser & print ready"}</p>
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
                  {t('smartScheduling.matrixSectionBadge') || "Batch Engine Capabilities"}
                </span>
                <h2 className="mt-3 text-3xl sm:text-4xl lg:text-[2.75rem] font-extrabold tracking-tight text-navy-deep leading-[1.15]">
                  {t('smartScheduling.matrixHeading') || "Smart Queuing for Workshop Efficiency"}
                </h2>
                <p className="mt-4 text-base text-slate-body leading-relaxed max-w-2xl">
                  {t('smartScheduling.matrixDesc') || "Manually opening orders and retyping text in Illustrator takes 4-7 minutes per job. Printomation's batch scheduler generates hundreds of machine-ready files automatically on your schedule."}
                </p>
              </div>
            </Reveal>

            {/* 2x2 Interactive Control Matrix (Compact Height) */}
            <div className="grid md:grid-cols-2 gap-4 sm:gap-5 items-stretch">
              {/* Quadrant 1: ASIN & Material Grouping */}
              <Reveal delay={60}>
                <div className="h-full liquid-glass rounded-2xl p-4 sm:p-5 border border-white/80 shadow-[0_8px_25px_rgba(0,50,171,0.05)] hover:shadow-[0_14px_35px_rgba(0,50,171,0.1)] hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between group">
                  <div>
                    <div className="flex items-center justify-between gap-3 mb-2.5">
                      <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-[#0032ab] to-[#155dfc] text-white flex items-center justify-center shadow-[0_4px_12px_rgba(0,50,171,0.2)] group-hover:scale-105 transition-transform">
                        <ShieldCheck className="h-4.5 w-4.5" />
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#0032ab]/10 text-[#0032ab] border border-[#0032ab]/20">
                        {t('smartScheduling.quad1Tag') || "Batch Grouping"}
                      </span>
                    </div>

                    <h3 className="text-base sm:text-lg font-extrabold text-navy-deep leading-snug">
                      {t('smartScheduling.quad1Title') || "ASIN & Material Grouping"}
                    </h3>
                    <p className="mt-1 text-xs sm:text-[13px] text-slate-body leading-relaxed">
                      {t('smartScheduling.quad1Desc') || "Automatically group orders by blank material (slate, wood, tumblers, acrylic) or machine bed type for uninterrupted production runs."}
                    </p>

                    {/* Embedded Widget: 3-Stage Range Gauge */}
                    <div className="mt-3.5 rounded-xl bg-white/90 border border-slate-200/80 p-2.5 sm:p-3 space-y-2 shadow-2xs">
                      <div className="flex items-center justify-between text-[10.5px] font-mono text-slate-500">
                        <span className="font-semibold text-slate-600">{t('smartScheduling.slaProofGate', 'PRE-FLIGHT VALIDATION')}</span>
                        <span className="text-[#0032ab] font-bold flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3 text-[#155dfc]" />
                          {t('smartScheduling.autoEnforced', 'AUTO-ENFORCED')}
                        </span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden flex p-0.5 gap-1">
                        <div className="h-full w-1/4 bg-slate-300 rounded-full" title="Intake Queue" />
                        <div className="h-full w-2/4 bg-gradient-to-r from-[#0032ab] to-[#155dfc] rounded-full animate-pulse shadow-2xs" title="Pre-Flight Verification" />
                        <div className="h-full w-1/4 bg-emerald-500 rounded-full" title="File Generated" />
                      </div>
                      <div className="flex items-center justify-between text-[10px] pt-0.5">
                        <span className="text-slate-500 font-medium">{t('smartScheduling.stage1ProofSent', 'Stage 1: Intake')}</span>
                        <span className="text-[#0032ab] font-bold flex items-center gap-1">
                          <Sparkles className="h-2.5 w-2.5 text-[#155dfc]" />
                          {t('smartScheduling.stage2Approved', 'Stage 2: Pre-Flight')}
                        </span>
                        <span className="text-emerald-600 font-medium">{t('smartScheduling.stage3LaserQueued', 'Stage 3: Ready File')}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3.5 pt-2.5 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-500">
                    <span className="font-medium">{t('smartScheduling.materialWastePrevention', 'Vector Precision Gate')}</span>
                    <span className="font-bold text-[#0032ab]">{t('smartScheduling.zeroBadRuns', 'Zero Misprint Guarantee')}</span>
                  </div>
                </div>
              </Reveal>

              {/* Quadrant 2: Scheduled Queue Runs */}
              <Reveal delay={100}>
                <div className="h-full liquid-glass rounded-2xl p-4 sm:p-5 border border-white/80 shadow-[0_8px_25px_rgba(0,50,171,0.05)] hover:shadow-[0_14px_35px_rgba(0,50,171,0.12)] hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between group">
                  <div>
                    <div className="flex items-center justify-between gap-3 mb-2.5">
                      <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-[#0032ab] to-[#155dfc] text-white flex items-center justify-center shadow-[0_4px_12px_rgba(0,50,171,0.2)] group-hover:scale-105 transition-transform">
                        <SunMedium className="h-4.5 w-4.5" />
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#0032ab]/10 text-[#0032ab] border border-[#0032ab]/20">
                        {t('smartScheduling.quad2Tag') || "Automated Schedule"}
                      </span>
                    </div>

                    <h3 className="text-base sm:text-lg font-extrabold text-navy-deep leading-snug">
                      {t('smartScheduling.quad2Title') || "Scheduled Queue Runs"}
                    </h3>
                    <p className="mt-1 text-xs sm:text-[13px] text-slate-body leading-relaxed">
                      {t('smartScheduling.quad2Desc') || "Set automated batch compilation schedules (such as daily 08:30 AM before workshop shifts) so machine operators have files waiting."}
                    </p>

                    {/* Embedded Widget: Live Multi-Market Timezone Console */}
                    <div className="mt-3.5 rounded-xl bg-white/90 border border-slate-200/80 p-2.5 space-y-1.5 shadow-2xs">
                      <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-slate-50/80 border border-slate-200/70 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-white bg-gradient-to-r from-[#0032ab] to-[#155dfc] px-1.5 py-0.5 rounded shadow-2xs">AM</span>
                          <span className="font-bold text-navy-deep text-[11.5px]">Morning Shift Batch</span>
                        </div>
                        <span className="font-mono text-[10.5px] font-bold text-[#0032ab] bg-[#0032ab]/10 px-2 py-0.5 rounded-md border border-[#0032ab]/20 flex items-center gap-1.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          08:30 Auto-Compile
                        </span>
                      </div>
                      <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-slate-50/80 border border-slate-200/70 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-white bg-gradient-to-r from-[#0032ab] to-[#155dfc] px-1.5 py-0.5 rounded shadow-2xs">PM</span>
                          <span className="font-bold text-navy-deep text-[11.5px]">Afternoon Rush Run</span>
                        </div>
                        <span className="font-mono text-[10.5px] font-bold text-[#0032ab] bg-[#0032ab]/10 px-2 py-0.5 rounded-md border border-[#0032ab]/20 flex items-center gap-1.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          13:30 Auto-Compile
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3.5 pt-2.5 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-500">
                    <span className="font-medium">{t('smartScheduling.timezoneIntelligence', 'Workshop Shift Triggers')}</span>
                    <span className="font-bold text-[#0032ab]">{t('smartScheduling.zeroMidnightSpam', 'Scheduled Batch Runs')}</span>
                  </div>
                </div>
              </Reveal>

              {/* Quadrant 3: Text-to-Curves & Bleed Validation */}
              <Reveal delay={140}>
                <div className="h-full liquid-glass rounded-2xl p-4 sm:p-5 border border-white/80 shadow-[0_8px_25px_rgba(0,50,171,0.05)] hover:shadow-[0_14px_35px_rgba(0,50,171,0.12)] hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between group">
                  <div>
                    <div className="flex items-center justify-between gap-3 mb-2.5">
                      <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-[#0032ab] to-[#155dfc] text-white flex items-center justify-center shadow-[0_4px_12px_rgba(0,50,171,0.2)] group-hover:scale-105 transition-transform">
                        <Sliders className="h-4.5 w-4.5" />
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#0032ab]/10 text-[#0032ab] border border-[#0032ab]/20">
                        {t('smartScheduling.quad3Tag') || "Pre-Flight Lock"}
                      </span>
                    </div>

                    <h3 className="text-base sm:text-lg font-extrabold text-navy-deep leading-snug">
                      {t('smartScheduling.quad3Title') || "Text-to-Curves & Bleed Validation"}
                    </h3>
                    <p className="mt-1 text-xs sm:text-[13px] text-slate-body leading-relaxed">
                      {t('smartScheduling.quad3Desc') || "The engine converts buyer fonts into vector curves, checks photo resolution (300+ DPI), and locks safe margins before generating files."}
                    </p>

                    {/* Embedded Widget: 2 Lead Time Sliders */}
                    <div className="mt-3.5 rounded-xl bg-white/90 border border-slate-200/80 p-2.5 sm:p-3 space-y-2 shadow-2xs">
                      <div>
                        <div className="flex justify-between text-[11px] font-semibold text-slate-700 mb-1">
                          <span className="flex items-center gap-1.5 truncate">
                            <Pill className="h-3 w-3 text-[#155dfc] shrink-0" />
                            Deep Wood Engrave & Slate
                          </span>
                          <span className="text-[#0032ab] font-bold font-mono shrink-0 ml-2">Kerf Locked</span>
                        </div>
                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full w-full bg-gradient-to-r from-[#0032ab] to-[#155dfc] rounded-full shadow-2xs" />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-[11px] font-semibold text-slate-700 mb-1">
                          <span className="flex items-center gap-1.5 truncate">
                            <Headphones className="h-3 w-3 text-[#155dfc] shrink-0" />
                            Laser Tumblers & Flasks
                          </span>
                          <span className="text-[#0032ab] font-bold font-mono shrink-0 ml-2">360° Mapped</span>
                        </div>
                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full w-full bg-gradient-to-r from-[#0032ab] to-[#38bdf8] rounded-full shadow-2xs" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3.5 pt-2.5 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-500">
                    <span className="font-medium">{t('smartScheduling.skuThrottleRules', 'ASIN & Machine Routing')}</span>
                    <span className="font-bold text-[#0032ab]">{t('smartScheduling.dynamicBatchAllocation', 'Dynamic Batch Sorting')}</span>
                  </div>
                </div>
              </Reveal>

              {/* Quadrant 4: Peak Holiday Surge Handling */}
              <Reveal delay={180}>
                <div className="h-full liquid-glass rounded-2xl p-4 sm:p-5 border border-white/80 shadow-[0_8px_25px_rgba(0,50,171,0.05)] hover:shadow-[0_14px_35px_rgba(0,50,171,0.12)] hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between group">
                  <div>
                    <div className="flex items-center justify-between gap-3 mb-2.5">
                      <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-[#0032ab] to-[#155dfc] text-white flex items-center justify-center shadow-[0_4px_12px_rgba(0,50,171,0.2)] group-hover:scale-105 transition-transform">
                        <TrendingUp className="h-4.5 w-4.5" />
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#0032ab]/10 text-[#0032ab] border border-[#0032ab]/20">
                        {t('smartScheduling.quad4Tag') || "Peak Scale"}
                      </span>
                    </div>

                    <h3 className="text-base sm:text-lg font-extrabold text-navy-deep leading-snug">
                      {t('smartScheduling.quad4Title') || "Peak Holiday Surge Handling"}
                    </h3>
                    <p className="mt-1 text-xs sm:text-[13px] text-slate-body leading-relaxed">
                      {t('smartScheduling.quad4Desc') || "Scale smoothly through Q4, Valentine's, and Mother's Day surges without hiring temporary graphic design staff."}
                    </p>

                    {/* Embedded Widget: Stat & 5-Star Telemetry Box */}
                    <div className="mt-3.5 rounded-xl bg-white/90 border border-slate-200/80 p-2.5 sm:p-3 flex items-center justify-between shadow-2xs">
                      <div>
                        <p className="text-2xl font-extrabold text-navy-deep font-mono tracking-tight leading-none">85%</p>
                        <p className="text-[11px] font-medium text-slate-500 mt-1">{t('smartScheduling.onTimeCertainty', 'Pre-Press Labor Saved')}</p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center justify-end gap-0.5">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400 drop-shadow-[0_1px_3px_rgba(251,191,36,0.3)]" />
                          ))}
                        </div>
                        <span className="text-[10px] font-bold text-[#0032ab] bg-[#0032ab]/10 px-2 py-0.5 rounded-full mt-1 inline-block border border-[#0032ab]/20">
                          {t('smartScheduling.zeroOverbooking', '10k+ Daily Files')}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3.5 pt-2.5 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-500">
                    <span className="font-medium">{t('smartScheduling.capacityGuardrail', 'Holiday Scale Capacity')}</span>
                    <span className="font-bold text-[#0032ab]">{t('smartScheduling.zeroOverbooking', '10k+ Daily Files')}</span>
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
                  {t('smartScheduling.timelineDesc') || "How Printomation sequences proof, craft, and ship for personalized orders."}
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
                    <h4 className="font-extrabold text-navy-deep text-base sm:text-lg">{t('smartScheduling.calloutTitle') || "Automated File Delivery"}</h4>
                    <p className="text-xs sm:text-sm text-slate-body mt-1 max-w-xl leading-relaxed">
                      {t('smartScheduling.calloutDesc') || "When scheduled batch compilation finishes, organized files are immediately available for one-click download in your seller panel."}
                    </p>
                  </div>
                </div>
                <a
                  href="/register"
                  className="inline-flex items-center gap-2 rounded-full btn-glass-primary px-6 py-3 text-xs sm:text-sm font-bold !text-white transition-all shadow-[0_6px_20px_rgba(0,50,171,0.25)] hover:-translate-y-0.5 shrink-0 relative z-10"
                >
                  {t('smartScheduling.calloutCta') || "Start Free Trial ->"}
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
                        <AccordionTrigger className="text-left hover:no-underline font-bold text-navy-deep text-[15px] sm:text-base py-3.5 sm:py-4 flex gap-3.5">
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
                  {t('smartScheduling.ctaBadge') || "Scale Your Production"}
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-navy-deep tracking-tight leading-snug">
                  {t('smartScheduling.ctaHeading') || "Eliminate the File Preparation Bottleneck"}
                </h2>
                <p className="mt-2 text-slate-body text-xs sm:text-sm max-w-xl mx-auto leading-relaxed">
                  {t('smartScheduling.ctaDesc') || "Automate Amazon Custom order compilation into ready-to-use vector and print files. Start your free trial today."}
                </p>
                <div className="mt-5 flex flex-wrap justify-center gap-3">
                  <a
                    href="/register"
                    className="inline-flex items-center gap-2 rounded-full btn-glass-primary px-6 py-2.5 text-xs sm:text-sm font-bold !text-white transition-all shadow-md shadow-[#0032ab]/20 hover:-translate-y-0.5"
                  >
                    {t('smartScheduling.ctaButton') || "Start Free Trial"}
                    <ArrowRight className="h-4 w-4" />
                  </a>
                  <a
                    href="/pricing"
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
      aria-label="Printomation Precision Chronometric Astrolabe HUD"
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
