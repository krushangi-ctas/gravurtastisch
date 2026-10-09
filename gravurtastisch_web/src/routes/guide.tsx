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
  Play
} from "lucide-react";

import { GuidePageSkeleton } from "@/components/skeletons/GuidePageSkeleton";

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
      title: t('guide.step1Title'),
      desc: t('guide.step1Desc'),
      icon: ShoppingBag,
    },
    {
      num: "02",
      title: t('guide.step2Title'),
      desc: t('guide.step2Desc'),
      icon: Send,
    },
    {
      num: "03",
      title: t('guide.step3Title'),
      desc: t('guide.step3Desc'),
      icon: KeyRound,
    },
    {
      num: "04",
      title: t('guide.step4Title'),
      desc: t('guide.step4Desc'),
      icon: Settings2,
    },
    {
      num: "05",
      title: t('guide.step5Title'),
      desc: t('guide.step5Desc'),
      icon: Zap,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-background text-navy-deep dark:text-slate-100 selection:bg-brand/20 selection:text-brand overflow-x-hidden w-full max-w-full">
      <Nav />

      <main className="pb-20 w-full max-w-full overflow-x-hidden">
        {/* ==================================================== */}
        {/* 1. HERO SECTION (DARK NAVY GRADIENT) */}
        {/* ==================================================== */}
        <section className="relative overflow-hidden pt-24 pb-12 lg:pt-28 lg:pb-16 bg-gradient-to-b from-navy-deep via-navy to-navy-soft text-white w-full max-w-full">
          <div className="absolute inset-0 grid-bg opacity-40 pointer-events-none" />
          <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-brand/25 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-sky-500/20 blur-3xl pointer-events-none" />

          <Container className="relative">
            <div className="grid lg:grid-cols-12 gap-10 lg:gap-12 items-center">
              {/* Left Column: Hero Copy */}
              <Reveal className="lg:col-span-6 xl:col-span-6">
                <div className="inline-flex items-center gap-2 rounded-full bg-brand/20 border border-brand/40 px-3.5 py-1 text-xs font-semibold text-brand-bright mb-4">
                  <BookOpen className="h-3.5 w-3.5" />
                  {t('guide.heroBadge')}
                </div>
                <h1 className="text-4xl sm:text-5xl lg:text-[3.25rem] font-extrabold tracking-tight leading-[1.1]">
                  {t('guide.heroTitle')} <span className="text-brand-bright">{t('guide.heroTitleHighlight')}</span>
                </h1>
                <p className="mt-4 text-white/70 text-base sm:text-lg leading-relaxed max-w-xl">
                  {t('guide.heroDesc')}
                </p>
                <div className="mt-6 flex flex-wrap gap-4">
                  <a
                    href="/#register"
                    className="inline-flex items-center gap-2 rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-brand/30 hover:bg-brand-bright hover:-translate-y-0.5 transition-all"
                  >
                    {t('guide.heroCtaRegister')}
                    <ArrowRight className="h-4 w-4" />
                  </a>
                  <a
                    href="#visual-workflow-section"
                    className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/20 px-6 py-3 text-sm font-semibold text-white hover:bg-white/20 transition-all"
                  >
                    {t('guide.heroCtaWorkflow')}
                  </a>
                </div>
              </Reveal>

              {/* Right Column: Hero Architecture Diagram Vector */}
              <Reveal className="lg:col-span-6 xl:col-span-6 relative" delay={120}>
                <div className="relative max-w-lg mx-auto lg:max-w-none">
                  <div className="absolute -inset-2 bg-gradient-to-r from-brand/25 via-sky-400/20 to-blue-600/20 rounded-3xl blur-2xl opacity-60 pointer-events-none" />
                  <div className="relative flex items-center justify-center select-none">
                    <GuideHeroOverviewSvg />
                  </div>
                </div>
              </Reveal>
            </div>
          </Container>
        </section>

        {/* ==================================================== */}
        {/* 2. OVERVIEW: STEP-BY-STEP FLOW & PURPOSE */}
        {/* ==================================================== */}
        <section className="py-12 lg:py-16 bg-slate-100/90 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800">
          <Container>
            <div className="grid gap-8 lg:grid-cols-12 items-start">
              {/* Step-by-step flow list */}
              <div className="lg:col-span-7">
                <Reveal>
                  <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/80 p-6 sm:p-8 shadow-xl shadow-slate-200/40 dark:shadow-none backdrop-blur-sm">
                    <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                      <div>
                        <span className="text-xs font-bold uppercase tracking-[0.22em] text-brand dark:text-brand-bright">
                          {t('guide.blueprintBadge')}
                        </span>
                        <h2 className="mt-3 text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
                          {t('guide.flowTitle')}
                        </h2>
                      </div>
                      <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {t('guide.stepsCount')}
                      </span>
                    </div>

                    <div className="mt-6 space-y-3">
                      {stepFlowItems.map((step, idx) => (
                        <div
                          key={idx}
                          className="group flex items-start gap-3.5 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-800/30 hover:bg-white dark:hover:bg-slate-800 hover:border-brand/30 hover:shadow-sm transition-all"
                        >
                          <div className="h-9 w-9 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm grid place-items-center shrink-0 group-hover:scale-105 transition-transform">
                            <step.icon className="h-4 w-4 text-brand" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] font-mono font-bold text-brand bg-brand/10 px-1.5 py-0.5 rounded">
                                {step.num}
                              </span>
                              <strong className="text-sm font-bold text-slate-900 dark:text-white">
                                {step.title}:
                              </strong>
                            </div>
                            <p className="mt-1 text-xs sm:text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                              {step.desc}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </Reveal>
              </div>

              {/* Purpose & Cron overview card */}
              <div className="lg:col-span-5">
                <Reveal delay={80}>
                  <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/80 p-6 sm:p-8 shadow-xl shadow-slate-200/40 dark:shadow-none backdrop-blur-sm">
                    <span className="text-xs font-bold uppercase tracking-[0.22em] text-brand dark:text-brand-bright">
                      {t('guide.purposeBadge')}
                    </span>
                    <h2 className="mt-3 text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
                      {t('guide.purposeTitle')}
                    </h2>
                    <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                      {t('guide.purposeDesc')}
                    </p>

                    <div className="mt-6 space-y-4">
                      {/* Order Fetch Cron */}
                      <div className="p-4 rounded-2xl bg-gradient-to-br from-sky-50 to-blue-50/60 dark:from-sky-950/30 dark:to-blue-950/20 border border-sky-100 dark:border-sky-900/40">
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 rounded-lg bg-sky-500/15 text-sky-600 dark:text-sky-400 grid place-items-center shrink-0">
                            <RefreshCw className="h-4 w-4" />
                          </div>
                          <strong className="text-sm font-bold text-slate-900 dark:text-white">
                            {t('guide.orderFetchCronTitle')}
                          </strong>
                        </div>
                        <p className="mt-2 text-xs text-slate-600 dark:text-slate-300 leading-relaxed pl-10">
                          {t('guide.orderFetchCronDesc')}
                        </p>
                      </div>

                      {/* Feedback Request Cron */}
                      <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50/60 dark:from-blue-950/30 dark:to-indigo-950/20 border border-blue-100 dark:border-blue-900/40">
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 rounded-lg bg-brand/15 text-brand dark:text-brand-bright grid place-items-center shrink-0">
                            <Clock className="h-4 w-4" />
                          </div>
                          <strong className="text-sm font-bold text-slate-900 dark:text-white">
                            {t('guide.feedbackRequestCronTitle')}
                          </strong>
                        </div>
                        <p className="mt-2 text-xs text-slate-600 dark:text-slate-300 leading-relaxed pl-10">
                          {t('guide.feedbackRequestCronDesc')}
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
        {/* 3. TOPIC 1: ORDER LISTING (LEFT: TEXT, RIGHT: SVG) */}
        {/* ==================================================== */}
        <section id="order-listing-section" className="py-12 lg:py-16 bg-white dark:bg-slate-950 scroll-mt-24 border-b border-border">
          <Container>
            <Reveal>
              <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-center">
                {/* Left: Content & Streamlined Action Steps */}
                <div className="lg:col-span-6 space-y-6">
                  <div>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-brand/10 text-brand dark:bg-brand/20 dark:text-brand-bright mb-3">
                      <ShoppingBag className="h-3.5 w-3.5" />
                      {t('guide.stage1Badge')}
                    </div>
                    <h2 className="mt-3 text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
                      {t('guide.stage1Title')}
                    </h2>
                    <p className="mt-2 text-base sm:text-lg leading-relaxed text-slate-600 dark:text-slate-300">
                      {t('guide.stage1Desc')}
                    </p>
                  </div>

                  <div className="pt-2">
                    {/* Step 1 */}
                    <div className="relative pl-12 pb-8 before:absolute before:left-4 before:top-8 before:bottom-0 before:w-[2px] before:bg-blue-200 dark:before:bg-blue-900/50">
                      <span className="absolute left-0 top-0.5 h-8 w-8 rounded-full bg-brand text-white font-extrabold text-sm grid place-items-center ring-4 ring-white dark:ring-slate-900 shadow-sm">
                        1
                      </span>
                      <div>
                        <h4 className="text-lg font-bold text-slate-900 dark:text-white">{t('guide.stage1Step1Title')}</h4>
                        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed">
                          {t('guide.stage1Step1Desc')}
                        </p>
                        <div className="flex flex-wrap items-center gap-2.5 mt-3.5">
                          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700">
                            🇺🇸 US Store
                          </span>
                          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900">
                            Filtered ✓
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Step 2 */}
                    <div className="relative pl-12 pb-8 before:absolute before:left-4 before:top-8 before:bottom-0 before:w-[2px] before:bg-sky-200 dark:before:bg-sky-900/50">
                      <span className="absolute left-0 top-0.5 h-8 w-8 rounded-full bg-sky-600 text-white font-extrabold text-sm grid place-items-center ring-4 ring-white dark:ring-slate-900 shadow-sm">
                        2
                      </span>
                      <div>
                        <h4 className="text-lg font-bold text-slate-900 dark:text-white">{t('guide.stage1Step2Title')}</h4>
                        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed">
                          {t('guide.stage1Step2Desc')}
                        </p>
                        <div className="flex flex-wrap items-center gap-2.5 mt-3.5">
                          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                            ● Pending
                          </span>
                          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900">
                            ✓ Sent
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Step 3 */}
                    <div className="relative pl-12">
                      <span className="absolute left-0 top-0.5 h-8 w-8 rounded-full bg-brand text-white font-extrabold text-sm grid place-items-center ring-4 ring-white dark:ring-slate-900 shadow-sm">
                        3
                      </span>
                      <div>
                        <h4 className="text-lg font-bold text-slate-900 dark:text-white">{t('guide.stage1Step3Title')}</h4>
                        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed">
                          {t('guide.stage1Step3Desc')}
                        </p>
                        <div className="mt-3.5">
                          <span className="inline-flex items-center gap-1.5 px-4.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-brand text-white shadow-md shadow-brand/20">
                            {t('guide.stage1SendRequest')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right: Modern SaaS Order Stream Preview SVG */}
                <div className="lg:col-span-6">
                  <div className="w-full relative rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-gradient-to-b from-white to-slate-50/60 dark:from-slate-900 dark:to-slate-900/60 p-4 sm:p-6 shadow-xl shadow-slate-200/50 dark:shadow-none">
                    <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-1.5">
                        <div className="h-2 w-2 rounded-full bg-slate-300 dark:bg-slate-600" />
                        <div className="h-2 w-2 rounded-full bg-sky-400" />
                        <div className="h-2 w-2 rounded-full bg-brand" />
                        <span className="ml-1.5 text-[11px] font-mono font-semibold text-slate-500 dark:text-slate-400">
                          orders.manage.table
                        </span>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400">
                        studio API Ingestion
                      </span>
                    </div>
                    <OrderListingStreamSvg />
                  </div>
                </div>
              </div>
            </Reveal>
          </Container>
        </section>

        {/* ==================================================== */}
        {/* 4. TOPIC 2: AMAZON CREDENTIALS (LEFT: SVG, RIGHT: TEXT) */}
        {/* ==================================================== */}
        <section id="amazon-credentials-section" className="py-12 lg:py-16 bg-slate-100/90 dark:bg-slate-900/80 scroll-mt-24 border-b border-slate-200 dark:border-slate-800">
          <Container>
            <Reveal>
              <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-center">
                {/* Left: Modern Security & studio API Authorization Console SVG */}
                <div className="lg:col-span-6 order-2 lg:order-1">
                  <div className="w-full relative rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-gradient-to-b from-white to-slate-50/60 dark:from-slate-900 dark:to-slate-900/60 p-4 sm:p-6 shadow-xl shadow-slate-200/50 dark:shadow-none">
                    <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-1.5">
                        <ShieldCheck className="h-3.5 w-3.5 text-brand" />
                        <span className="text-[11px] font-mono font-semibold text-slate-700 dark:text-slate-300">
                          sp-api.oauth2.auth-vault
                        </span>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand/10 text-brand dark:text-brand-bright">
                        AES-256 Encrypted
                      </span>
                    </div>
                    <AmazonCredentialsConsoleSvg />
                  </div>
                </div>

                {/* Right: Content & Configuration Flow */}
                <div className="lg:col-span-6 space-y-6 order-1 lg:order-2">
                  <div>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-brand/10 text-brand dark:bg-brand/20 dark:text-brand-bright mb-3">
                      <KeyRound className="h-3.5 w-3.5" />
                      {t('guide.stage2Badge')}
                    </div>
                    <h2 className="mt-3 text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
                      {t('guide.stage2Title')}
                    </h2>
                    <p className="mt-2 text-base sm:text-lg leading-relaxed text-slate-600 dark:text-slate-300">
                      <strong>{t('guide.purposeTitle')}:</strong> {t('guide.stage2Desc')}
                    </p>
                  </div>

                  <div className="pt-2">
                    {/* Credential Step 1 */}
                    <div className="relative pl-12 pb-8 before:absolute before:left-4 before:top-8 before:bottom-0 before:w-[2px] before:bg-blue-200 dark:before:bg-blue-900/50">
                      <span className="absolute left-0 top-0.5 h-8 w-8 rounded-full bg-brand text-white font-extrabold text-sm grid place-items-center ring-4 ring-white dark:ring-slate-900 shadow-sm">
                        1
                      </span>
                      <div>
                        <h4 className="text-lg font-bold text-slate-900 dark:text-white">{t('guide.stage2Step1Title')}</h4>
                        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed">
                          {t('guide.stage2Step1Desc')}
                        </p>
                        <div className="mt-3.5">
                          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900">
                            {t('guide.stage2EncryptedToken')}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Credential Step 2 */}
                    <div className="relative pl-12 pb-8 before:absolute before:left-4 before:top-8 before:bottom-0 before:w-[2px] before:bg-sky-200 dark:before:bg-sky-900/50">
                      <span className="absolute left-0 top-0.5 h-8 w-8 rounded-full bg-sky-600 text-white font-extrabold text-sm grid place-items-center ring-4 ring-white dark:ring-slate-900 shadow-sm">
                        2
                      </span>
                      <div>
                        <h4 className="text-lg font-bold text-slate-900 dark:text-white">{t('guide.stage2Step2Title')}</h4>
                        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed">
                          {t('guide.stage2Step2Desc')}
                        </p>
                        <div className="flex flex-wrap items-center gap-2.5 mt-3.5">
                          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-900">
                            {t('guide.stage2AutoOnOff')}
                          </span>
                          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-900">
                            {t('guide.stage2Channel')}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Credential Step 3 */}
                    <div className="relative pl-12">
                      <span className="absolute left-0 top-0.5 h-8 w-8 rounded-full bg-brand text-white font-extrabold text-sm grid place-items-center ring-4 ring-white dark:ring-slate-900 shadow-sm">
                        3
                      </span>
                      <div>
                        <h4 className="text-lg font-bold text-slate-900 dark:text-white">{t('guide.stage2Step3Title')}</h4>
                        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed">
                          {t('guide.stage2Step3Desc')}
                        </p>
                        <div className="flex flex-wrap items-center gap-2.5 mt-3.5">
                          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900">
                            {t('guide.stage2ShippedOnly')}
                          </span>
                          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                            {t('guide.stage2AllProducts')}
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
        {/* 5. TOPIC 3: AUTOMATED CRON JOB FOR FEEDBACK */}
        {/* ==================================================== */}
        <section className="py-12 lg:py-16 bg-white dark:bg-slate-950 border-b border-border">
          <Container>
            <Reveal>
              <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-surface/50 dark:bg-slate-900/80 p-6 sm:p-8 shadow-xl shadow-slate-200/40 dark:shadow-none backdrop-blur-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-brand/10 text-brand dark:bg-brand/20 dark:text-brand-bright">
                      <Zap className="h-3.5 w-3.5" />
                      {t('guide.stage3Badge')}
                    </div>
                    <h2 className="mt-3 text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
                      {t('guide.stage3Title')}
                    </h2>
                  </div>
                </div>

                <p className="mt-4 text-base leading-relaxed text-slate-600 dark:text-slate-300 max-w-3xl">
                  <strong>{t('guide.purposeTitle')}:</strong> {t('guide.stage3Desc')}
                </p>

                <div className="mt-6 grid gap-6 lg:grid-cols-2">
                  <div className="relative overflow-hidden rounded-2xl border border-sky-200/70 dark:border-sky-900/40 bg-gradient-to-br from-sky-50/80 via-white to-sky-50/30 dark:from-sky-950/30 dark:via-slate-900 dark:to-slate-900 p-6 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-sky-500/15 text-sky-600 dark:text-sky-400 grid place-items-center shrink-0">
                        <RefreshCw className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white text-base">{t('guide.orderFetchCronTitle')}</p>
                        <span className="text-[11px] font-semibold text-sky-600 dark:text-sky-400">{t('guide.stage3Cron1Tag')}</span>
                      </div>
                    </div>
                    <p className="mt-4 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                      {t('guide.stage3Cron1Desc')}
                    </p>
                  </div>

                  <div className="relative overflow-hidden rounded-2xl border border-blue-200/70 dark:border-blue-900/40 bg-gradient-to-br from-blue-50/80 via-white to-blue-50/30 dark:from-blue-950/30 dark:via-slate-900 dark:to-slate-900 p-6 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-brand/15 text-brand dark:text-brand-bright grid place-items-center shrink-0">
                        <Clock className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white text-base">{t('guide.feedbackRequestCronTitle')}</p>
                        <span className="text-[11px] font-semibold text-brand dark:text-brand-bright">{t('guide.stage3Cron2Tag')}</span>
                      </div>
                    </div>
                    <p className="mt-4 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                      {t('guide.stage3Cron2Desc')}
                    </p>
                  </div>
                </div>
              </div>
            </Reveal>
          </Container>
        </section>

        {/* ==================================================== */}
        {/* 6. TOPIC 4: VISUAL WORKFLOW (LEFT: SVG, RIGHT: TEXT) */}
        {/* ==================================================== */}
        <section id="visual-workflow-section" className="py-12 lg:py-16 bg-slate-100/90 dark:bg-slate-900/80 scroll-mt-24 border-b border-slate-200 dark:border-slate-800">
          <Container>
            <Reveal>
              <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-center">
                {/* Left: Streamlined Modern Architecture Vector SVG */}
                <div className="lg:col-span-7">
                  <div className="relative rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-gradient-to-b from-white to-slate-50/60 dark:from-slate-900 dark:to-slate-900/60 p-4 sm:p-6 shadow-xl shadow-slate-200/50 dark:shadow-none">
                    <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-2">
                        <Workflow className="h-4 w-4 text-brand" />
                        <span className="text-xs font-mono font-semibold text-slate-700 dark:text-slate-300">
                          pipeline.end-to-end.flow
                        </span>
                      </div>
                      <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-brand/10 text-brand dark:text-brand-bright">
                        Live Ecosystem
                      </span>
                    </div>
                    <VisualWorkflowPipelineSvg />
                  </div>
                </div>

                {/* Right: Architecture Summary & Key Connectors */}
                <div className="lg:col-span-5 space-y-6">
                  <div>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-brand/10 text-brand dark:bg-brand/20 dark:text-brand-bright mb-3">
                      <Layers className="h-3.5 w-3.5" />
                      {t('guide.stage4Badge')}
                    </div>
                    <h2 className="mt-3 text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
                      {t('guide.stage4Title')}
                    </h2>
                    <p className="mt-2 text-base leading-relaxed text-slate-600 dark:text-slate-300">
                      {t('guide.stage4Desc')}
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-start gap-3.5">
                      <div className="h-8 w-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 grid place-items-center shrink-0 mt-0.5">
                        <ShoppingBag className="h-4 w-4" />
                      </div>
                      <div>
                        <strong className="text-sm font-bold text-slate-900 dark:text-white">{t('guide.stage4Card1Title')}</strong>
                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                          {t('guide.stage4Card1Desc')}
                        </p>
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-start gap-3.5">
                      <div className="h-8 w-8 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400 grid place-items-center shrink-0 mt-0.5">
                        <RefreshCw className="h-4 w-4" />
                      </div>
                      <div>
                        <strong className="text-sm font-bold text-slate-900 dark:text-white">{t('guide.stage4Card2Title')}</strong>
                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                          {t('guide.stage4Card2Desc')}
                        </p>
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-start gap-3.5">
                      <div className="h-8 w-8 rounded-lg bg-brand/10 text-brand dark:text-brand-bright grid place-items-center shrink-0 mt-0.5">
                        <Sliders className="h-4 w-4" />
                      </div>
                      <div>
                        <strong className="text-sm font-bold text-slate-900 dark:text-white">{t('guide.stage4Card3Title')}</strong>
                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                          {t('guide.stage4Card3Desc')}
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

/* ========================================================================== */
/* SVG 1: HERO OVERVIEW PIPELINE (High-tech, Clean, Animated)                  */
/* ========================================================================== */
function GuideHeroOverviewSvg() {
  return (
    <svg
      viewBox="0 0 540 360"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-auto select-none"
      role="img"
      aria-label="Gravurtastisch Amazon Review Automation Guide Visual Pipeline"
    >
      <defs>
        <radialGradient id="guide-hero-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.25" />
          <stop offset="60%" stopColor="#2563EB" stopOpacity="0.08" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </radialGradient>
        <filter id="guide-hero-shadow" x="-15%" y="-15%" width="130%" height="130%">
          <feDropShadow dx="0" dy="12" stdDeviation="14" floodColor="#020617" floodOpacity="0.32" />
        </filter>
        <linearGradient id="guide-conduit" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#38BDF8" />
          <stop offset="50%" stopColor="#2563EB" />
          <stop offset="100%" stopColor="#0284C7" />
        </linearGradient>
      </defs>

      {/* Ambient Halo */}
      <circle cx="270" cy="180" r="170" fill="url(#guide-hero-glow)" />

      {/* Connection Conduit Line */}
      <path
        d="M 130 180 C 200 180, 210 180, 270 180 C 330 180, 340 180, 410 180"
        stroke="url(#guide-conduit)"
        strokeWidth="3"
        strokeDasharray="4 4"
      >
        <animate attributeName="stroke-dashoffset" values="0;-16" dur="1s" repeatCount="indefinite" />
      </path>

      {/* Top Floating Badge */}
      <g transform="translate(170, 20)" filter="url(#guide-hero-shadow)">
        <rect x="0" y="0" width="200" height="30" rx="15" fill="#FFFFFF" stroke="#BAE6FD" strokeWidth="1" />
        <circle cx="16" cy="15" r="4" fill="#2563EB">
          <animate attributeName="opacity" values="1;0.3;1" dur="1.2s" repeatCount="indefinite" />
        </circle>
        <text x="30" y="19" fill="#0369A1" fontFamily="system-ui" fontSize="9.5" fontWeight="800">
          studio API AUTOMATION ACTIVE
        </text>
      </g>

      {/* Card 1 (Left): Connect & Authenticate */}
      <g transform="translate(20, 80)" filter="url(#guide-hero-shadow)">
        <rect x="0" y="0" width="145" height="195" rx="16" fill="#FFFFFF" stroke="#BFDBFE" strokeWidth="1.2" />
        <rect x="10" y="10" width="125" height="22" rx="8" fill="#EFF6FF" stroke="#BFDBFE" strokeWidth="0.8" />
        <circle cx="20" cy="21" r="3" fill="#2563EB" />
        <text x="28" y="24.5" fill="#1D4ED8" fontFamily="monospace" fontSize="8" fontWeight="800">
          01. CREDENTIALS
        </text>

        {/* Security Key Graphic */}
        <g transform="translate(72.5, 75)">
          <circle cx="0" cy="0" r="24" fill="#EFF6FF" stroke="#93C5FD" strokeWidth="1.5" />
          <circle cx="-5" cy="-5" r="6" fill="none" stroke="#2563EB" strokeWidth="2" />
          <path d="M 0 0 L 10 10 M 6 6 L 10 2 M 8 8 L 12 4" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" />
        </g>

        <text x="72.5" y="122" textAnchor="middle" fill="#0F172A" fontFamily="system-ui" fontSize="9.5" fontWeight="800">
          studio API OAuth 2.0
        </text>
        <text x="72.5" y="136" textAnchor="middle" fill="#64748B" fontFamily="system-ui" fontSize="8">
          Encrypted Vault
        </text>

        <rect x="12" y="152" width="121" height="22" rx="6" fill="#EFF6FF" />
        <text x="72.5" y="166" textAnchor="middle" fill="#2563EB" fontFamily="system-ui" fontSize="8" fontWeight="700">
          ✓ Verified Active
        </text>
      </g>

      {/* Card 2 (Center): Order Fetch & Cron Engine */}
      <g transform="translate(195, 65)" filter="url(#guide-hero-shadow)">
        <rect x="0" y="0" width="150" height="225" rx="18" fill="#FFFFFF" stroke="#93C5FD" strokeWidth="1.6" />
        <rect x="10" y="10" width="130" height="22" rx="8" fill="#EFF6FF" stroke="#BFDBFE" strokeWidth="0.8" />
        <circle cx="20" cy="21" r="3" fill="#2563EB" />
        <text x="28" y="24.5" fill="#1D4ED8" fontFamily="monospace" fontSize="8" fontWeight="800">
          02. CRON ENGINE
        </text>

        {/* Pulsing Clock / Cron Dial */}
        <g transform="translate(75, 78)">
          <circle cx="0" cy="0" r="28" fill="#F8FAFC" stroke="#BFDBFE" strokeWidth="1.5" />
          <line x1="0" y1="0" x2="0" y2="-16" stroke="#2563EB" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="0" y1="0" x2="10" y2="5" stroke="#1D4ED8" strokeWidth="2" strokeLinecap="round" />
          <circle cx="0" cy="0" r="4" fill="#2563EB" />
          <circle cx="0" cy="0" r="34" fill="none" stroke="#E2E8F0" strokeWidth="1" strokeDasharray="3 3">
            <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="10s" repeatCount="indefinite" />
          </circle>
        </g>

        <text x="75" y="130" textAnchor="middle" fill="#0F172A" fontFamily="system-ui" fontSize="10" fontWeight="900">
          Autonomous Fetch
        </text>
        <text x="75" y="144" textAnchor="middle" fill="#2563EB" fontFamily="system-ui" fontSize="8" fontWeight="700">
          Every 5 Minutes
        </text>

        <g transform="translate(15, 160)">
          <rect x="0" y="0" width="120" height="20" rx="6" fill="#F0F9FF" stroke="#BAE6FD" strokeWidth="0.8" />
          <text x="60" y="13.5" textAnchor="middle" fill="#0369A1" fontFamily="system-ui" fontSize="7.5" fontWeight="700">
            ✓ Order Filter: Ready
          </text>
          <rect x="0" y="26" width="120" height="20" rx="6" fill="#EFF6FF" stroke="#93C5FD" strokeWidth="0.8" />
          <text x="60" y="39.5" textAnchor="middle" fill="#1D4ED8" fontFamily="system-ui" fontSize="7.5" fontWeight="700">
            ✓ Timing Window: Set
          </text>
        </g>
      </g>

      {/* Card 3 (Right): Solicitations Dispatch */}
      <g transform="translate(375, 80)" filter="url(#guide-hero-shadow)">
        <rect x="0" y="0" width="145" height="195" rx="16" fill="#FFFFFF" stroke="#60A5FA" strokeWidth="1.2" />
        <rect x="10" y="10" width="125" height="22" rx="8" fill="#EFF6FF" stroke="#BFDBFE" strokeWidth="0.8" />
        <circle cx="20" cy="21" r="3" fill="#2563EB" />
        <text x="28" y="24.5" fill="#1D4ED8" fontFamily="monospace" fontSize="8" fontWeight="800">
          03. SOLICITATION
        </text>

        {/* 5-Star verified icon graphic */}
        <g transform="translate(72.5, 75)">
          <circle cx="0" cy="0" r="24" fill="#EFF6FF" stroke="#BFDBFE" strokeWidth="1.5" />
          <text x="0" y="6" textAnchor="middle" fill="#2563EB" fontSize="15" fontWeight="bold">
            ★★★★★
          </text>
        </g>

        <text x="72.5" y="122" textAnchor="middle" fill="#0F172A" fontFamily="system-ui" fontSize="9.5" fontWeight="800">
          Official In-Box
        </text>
        <text x="72.5" y="136" textAnchor="middle" fill="#64748B" fontFamily="system-ui" fontSize="8">
          1-Click Feedback
        </text>

        <rect x="12" y="152" width="121" height="22" rx="6" fill="#EFF6FF" />
        <text x="72.5" y="166" textAnchor="middle" fill="#1D4ED8" fontFamily="system-ui" fontSize="8" fontWeight="700">
          ✓ Review Lift +38%
        </text>
      </g>

      {/* Bottom Telemetry Bar */}
      <g transform="translate(70, 318)">
        <rect x="0" y="0" width="400" height="28" rx="14" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1" filter="url(#guide-hero-shadow)" />
        <circle cx="18" cy="14" r="3.5" fill="#2563EB" />
        <text x="32" y="18" fill="#475569" fontFamily="system-ui" fontSize="9" fontWeight="700">
          End-to-End Studio production API Review Ingestion Active
        </text>
      </g>
    </svg>
  );
}

/* ========================================================================== */
/* SVG 2: ORDER LISTING STREAM PREVIEW (Realistic Modern Table & Action Flow)  */
/* ========================================================================== */
function OrderListingStreamSvg() {
  return (
    <svg
      viewBox="0 0 500 340"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-auto select-none"
      role="img"
      aria-label="Order listing modern table and action execution flow"
    >
      <defs>
        <filter id="rowGlow" x="-5%" y="-15%" width="110%" height="130%">
          <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#2563EB" floodOpacity="0.10" />
        </filter>
        <linearGradient id="actionBtnGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#2563EB" />
          <stop offset="100%" stopColor="#4F46E5" />
        </linearGradient>
      </defs>

      {/* Top Filter Controls Bar */}
      <g transform="translate(10, 10)">
        <rect x="0" y="0" width="480" height="38" rx="10" fill="#F8FAFC" stroke="#E2E8F0" strokeWidth="1" />
        
        {/* Marketplace Pill */}
        <g transform="translate(10, 8)">
          <rect x="0" y="0" width="105" height="22" rx="6" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="0.8" />
          <text x="8" y="15" fill="#334155" fontFamily="system-ui" fontSize="9.5" fontWeight="700">🇺🇸 US Store ▼</text>
        </g>

        {/* Filter State Pill */}
        <g transform="translate(122, 8)">
          <rect x="0" y="0" width="85" height="22" rx="6" fill="#EFF6FF" stroke="#93C5FD" strokeWidth="0.8" />
          <text x="8" y="15" fill="#1D4ED8" fontFamily="system-ui" fontSize="9.5" fontWeight="800">Filtered ✓</text>
        </g>

        {/* Search Mockup */}
        <g transform="translate(214, 8)">
          <rect x="0" y="0" width="170" height="22" rx="6" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="0.8" />
          <circle cx="12" cy="11" r="3.5" fill="none" stroke="#94A3B8" strokeWidth="1.2" />
          <line x1="14.5" y1="13.5" x2="18" y2="17" stroke="#94A3B8" strokeWidth="1.2" />
          <text x="24" y="15" fill="#94A3B8" fontFamily="system-ui" fontSize="9">Search order ID...</text>
        </g>

        {/* Status Filter Pill */}
        <g transform="translate(390, 8)">
          <rect x="0" y="0" width="80" height="22" rx="6" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="0.8" />
          <text x="8" y="15" fill="#475569" fontFamily="system-ui" fontSize="9" fontWeight="600">All Status ▼</text>
        </g>
      </g>

      {/* Table Headers */}
      <g transform="translate(10, 58)">
        <text x="12" y="10" fill="#64748B" fontFamily="system-ui" fontSize="9" fontWeight="800">ORDER DETAILS</text>
        <text x="180" y="10" fill="#64748B" fontFamily="system-ui" fontSize="9" fontWeight="800">MARKETPLACE</text>
        <text x="285" y="10" fill="#64748B" fontFamily="system-ui" fontSize="9" fontWeight="800">STATUS</text>
        <text x="395" y="10" fill="#64748B" fontFamily="system-ui" fontSize="9" fontWeight="800">ACTION</text>
      </g>

      {/* Row 1: Target Active Order (Pending -> Send Action Highlighted) */}
      <g transform="translate(10, 76)" filter="url(#rowGlow)">
        <rect x="0" y="0" width="480" height="66" rx="12" fill="#FFFFFF" stroke="#3B82F6" strokeWidth="1.5" />
        
        {/* Order Info */}
        <text x="14" y="24" fill="#0F172A" fontFamily="monospace" fontSize="11" fontWeight="800">#114-892314-9912</text>
        <text x="14" y="42" fill="#64748B" fontFamily="system-ui" fontSize="9.5">Echo ANC Earbuds Pro • $49.99</text>
        <text x="14" y="55" fill="#0284C7" fontFamily="system-ui" fontSize="8" fontWeight="700">● Delivered 4 days ago (Eligible)</text>

        {/* Marketplace */}
        <g transform="translate(180, 22)">
          <rect x="0" y="0" width="60" height="20" rx="5" fill="#F1F5F9" />
          <text x="30" y="13.5" textAnchor="middle" fill="#334155" fontFamily="system-ui" fontSize="9" fontWeight="700">🇺🇸 Amazon</text>
        </g>

        {/* Status Pill: Pending */}
        <g transform="translate(275, 20)">
          <rect x="0" y="0" width="76" height="24" rx="12" fill="#EFF6FF" stroke="#93C5FD" strokeWidth="1" />
          <circle cx="12" cy="12" r="3" fill="#2563EB">
            <animate attributeName="opacity" values="1;0.3;1" dur="1s" repeatCount="indefinite" />
          </circle>
          <text x="44" y="15.5" textAnchor="middle" fill="#1D4ED8" fontFamily="system-ui" fontSize="9.5" fontWeight="800">Pending</text>
        </g>

        {/* Action Button: Send Request */}
        <g transform="translate(365, 18)">
          <rect x="0" y="0" width="105" height="28" rx="8" fill="url(#actionBtnGrad)" />
          <text x="52.5" y="17.5" textAnchor="middle" fill="#FFFFFF" fontFamily="system-ui" fontSize="9.5" fontWeight="800">
            Send Request ➔
          </text>
          <circle cx="96" cy="7" r="3" fill="#38BDF8">
            <animate attributeName="r" values="3;5;3" dur="1.2s" repeatCount="indefinite" />
          </circle>
        </g>
      </g>

      {/* Row 2: Completed / Sent Order */}
      <g transform="translate(10, 150)">
        <rect x="0" y="0" width="480" height="54" rx="10" fill="#F8FAFC" stroke="#E2E8F0" strokeWidth="1" />
        
        {/* Order Info */}
        <text x="14" y="22" fill="#334155" fontFamily="monospace" fontSize="10.5" fontWeight="700">#112-748291-1024</text>
        <text x="14" y="38" fill="#64748B" fontFamily="system-ui" fontSize="9">Coffee Bean Grinder Pro • $89.00</text>

        {/* Marketplace */}
        <g transform="translate(180, 17)">
          <rect x="0" y="0" width="60" height="20" rx="5" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="0.8" />
          <text x="30" y="13.5" textAnchor="middle" fill="#334155" fontFamily="system-ui" fontSize="9" fontWeight="700">🇨🇦 CA Store</text>
        </g>

        {/* Status Pill: Sent */}
        <g transform="translate(275, 15)">
          <rect x="0" y="0" width="76" height="24" rx="12" fill="#F0F9FF" stroke="#BAE6FD" strokeWidth="1" />
          <text x="38" y="15.5" textAnchor="middle" fill="#0284C7" fontFamily="system-ui" fontSize="9.5" fontWeight="800">✓ Sent</text>
        </g>

        {/* Action: Sent Done */}
        <g transform="translate(365, 15)">
          <rect x="0" y="0" width="105" height="24" rx="6" fill="#F1F5F9" />
          <text x="52.5" y="15.5" textAnchor="middle" fill="#64748B" fontFamily="system-ui" fontSize="9" fontWeight="700">Completed</text>
        </g>
      </g>

      {/* Row 3: Auto-Queued Order */}
      <g transform="translate(10, 212)">
        <rect x="0" y="0" width="480" height="54" rx="10" fill="#F8FAFC" stroke="#E2E8F0" strokeWidth="1" />
        
        {/* Order Info */}
        <text x="14" y="22" fill="#334155" fontFamily="monospace" fontSize="10.5" fontWeight="700">#114-382910-4491</text>
        <text x="14" y="38" fill="#64748B" fontFamily="system-ui" fontSize="9">Desk Mat XL (Black) • $24.50</text>

        {/* Marketplace */}
        <g transform="translate(180, 17)">
          <rect x="0" y="0" width="60" height="20" rx="5" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="0.8" />
          <text x="30" y="13.5" textAnchor="middle" fill="#334155" fontFamily="system-ui" fontSize="9" fontWeight="700">🇬🇧 UK Store</text>
        </g>

        {/* Status Pill: Queued */}
        <g transform="translate(275, 15)">
          <rect x="0" y="0" width="76" height="24" rx="12" fill="#EFF6FF" stroke="#BFDBFE" strokeWidth="1" />
          <text x="38" y="15.5" textAnchor="middle" fill="#1D4ED8" fontFamily="system-ui" fontSize="9.5" fontWeight="800">Queued</text>
        </g>

        {/* Action: Scheduled */}
        <g transform="translate(365, 15)">
          <rect x="0" y="0" width="105" height="24" rx="6" fill="#EFF6FF" stroke="#BFDBFE" strokeWidth="0.8" />
          <text x="52.5" y="15.5" textAnchor="middle" fill="#2563EB" fontFamily="system-ui" fontSize="9" fontWeight="700">⚡ Auto-Queue</text>
        </g>
      </g>

      {/* Footer Info Strip */}
      <g transform="translate(10, 280)">
        <rect x="0" y="0" width="480" height="42" rx="10" fill="#EFF6FF" stroke="#BFDBFE" strokeWidth="1" />
        <circle cx="20" cy="21" r="5" fill="#2563EB" />
        <text x="34" y="24" fill="#1E3A8A" fontFamily="system-ui" fontSize="10" fontWeight="700">
          Real-Time Sync • Manual trigger or auto-queue dispatches production job instantly.
        </text>
      </g>
    </svg>
  );
}

/* ========================================================================== */
/* SVG 3: AMAZON CREDENTIALS SECURITY CONSOLE (Left-Side Stage 02 Vector)      */
/* ========================================================================== */
function AmazonCredentialsConsoleSvg() {
  return (
    <svg
      viewBox="0 0 500 340"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-auto select-none"
      role="img"
      aria-label="Amazon credentials security token, rules, and targeting console"
    >
      <defs>
        <linearGradient id="shieldGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#2563EB" />
          <stop offset="100%" stopColor="#1D4ED8" />
        </linearGradient>
        <filter id="consoleDropShadow" x="-5%" y="-10%" width="110%" height="120%">
          <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#0F172A" floodOpacity="0.08" />
        </filter>
      </defs>

      {/* 1. Top Section: studio API Encrypted Token Authentication Box */}
      <g transform="translate(10, 10)" filter="url(#consoleDropShadow)">
        <rect x="0" y="0" width="480" height="88" rx="14" fill="#FFFFFF" stroke="#BAE6FD" strokeWidth="1.2" />
        
        {/* Glowing Shield Icon */}
        <g transform="translate(30, 44)">
          <circle cx="0" cy="0" r="22" fill="#EFF6FF" stroke="#BFDBFE" strokeWidth="1.5" />
          <path d="M -8 -8 L 8 -8 L 8 2 C 8 8, 0 12, 0 12 C 0 12, -8 8, -8 2 Z" fill="url(#shieldGrad)" />
          <path d="M -3 0 L 0 3 L 5 -2" stroke="#FFFFFF" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </g>

        {/* Title & studio API Authorization Info */}
        <text x="64" y="32" fill="#0F172A" fontFamily="system-ui" fontSize="13" fontWeight="800">
          1. Connect Account - Studio production API Authorization
        </text>
        <text x="64" y="48" fill="#64748B" fontFamily="system-ui" fontSize="10.5">
          Store credentials securely with OAuth 2.0 multi-region token vault
        </text>

        {/* Token Key Bar */}
        <g transform="translate(64, 56)">
          <rect x="0" y="0" width="280" height="22" rx="6" fill="#F8FAFC" stroke="#CBD5E1" strokeWidth="0.8" />
          <text x="10" y="15" fill="#475569" fontFamily="monospace" fontSize="9.5">
            amzn.lwa.oa2.at.pv2.983f...••••••••
          </text>
          <rect x="290" y="0" width="115" height="22" rx="6" fill="#EFF6FF" stroke="#93C5FD" strokeWidth="0.8" />
          <text x="347.5" y="15" textAnchor="middle" fill="#1D4ED8" fontFamily="system-ui" fontSize="9" fontWeight="800">
            🔒 Encrypted Token
          </text>
        </g>
      </g>

      {/* Downward Conduit Link 1 -> 2 */}
      <path d="M 250 98 L 250 114" stroke="#38BDF8" strokeWidth="2" strokeDasharray="3 3" />
      <polygon points="250,115 247,110 253,110" fill="#38BDF8" />

      {/* 2. Middle Section: Set Rules & Time Controls */}
      <g transform="translate(10, 115)" filter="url(#consoleDropShadow)">
        <rect x="0" y="0" width="480" height="96" rx="14" fill="#FFFFFF" stroke="#93C5FD" strokeWidth="1.2" />

        {/* Clock/Rule Icon */}
        <g transform="translate(30, 48)">
          <circle cx="0" cy="0" r="22" fill="#EFF6FF" stroke="#BFDBFE" strokeWidth="1.5" />
          <circle cx="0" cy="0" r="10" fill="none" stroke="#2563EB" strokeWidth="1.8" />
          <path d="M 0 -6 L 0 0 L 4 3" stroke="#2563EB" strokeWidth="1.8" strokeLinecap="round" />
        </g>

        {/* Title */}
        <text x="64" y="30" fill="#0F172A" fontFamily="system-ui" fontSize="13" fontWeight="800">
          2. Set Rules &amp; Time - Schedule Hour &amp; Minute
        </text>
        <text x="64" y="46" fill="#64748B" fontFamily="system-ui" fontSize="10.5">
          Define channel configuration (Retail / wholesale) &amp; execution trigger window
        </text>

        {/* Interactive Controls Pill Row */}
        <g transform="translate(64, 56)">
          {/* Switch 1: Auto On/Off */}
          <rect x="0" y="0" width="105" height="28" rx="8" fill="#EFF6FF" stroke="#BFDBFE" strokeWidth="1" />
          <circle cx="16" cy="14" r="5" fill="#2563EB" />
          <text x="58" y="18" textAnchor="middle" fill="#1D4ED8" fontFamily="system-ui" fontSize="9.5" fontWeight="800">
            Auto: ON ✓
          </text>

          {/* Switch 2: Channel Retail / wholesale */}
          <g transform="translate(115, 0)">
            <rect x="0" y="0" width="130" height="28" rx="8" fill="#F0F9FF" stroke="#BAE6FD" strokeWidth="1" />
            <text x="65" y="18" textAnchor="middle" fill="#0284C7" fontFamily="system-ui" fontSize="9.5" fontWeight="800">
              Channel: Retail / wholesale
            </text>
          </g>

          {/* Timing Window Pill */}
          <g transform="translate(255, 0)">
            <rect x="0" y="0" width="145" height="28" rx="8" fill="#F8FAFC" stroke="#E2E8F0" strokeWidth="1" />
            <text x="72.5" y="18" textAnchor="middle" fill="#475569" fontFamily="system-ui" fontSize="9.5" fontWeight="700">
              ⏰ Schedule: 09:00 AM
            </text>
          </g>
        </g>
      </g>

      {/* Downward Conduit Link 2 -> 3 */}
      <path d="M 250 211 L 250 227" stroke="#2563EB" strokeWidth="2" strokeDasharray="3 3" />
      <polygon points="250,228 247,223 253,223" fill="#2563EB" />

      {/* 3. Bottom Section: Target Matching (Shipped items only vs All) */}
      <g transform="translate(10, 228)" filter="url(#consoleDropShadow)">
        <rect x="0" y="0" width="480" height="96" rx="14" fill="#FFFFFF" stroke="#60A5FA" strokeWidth="1.2" />

        {/* Target Bullseye Icon */}
        <g transform="translate(30, 48)">
          <circle cx="0" cy="0" r="22" fill="#EFF6FF" stroke="#BFDBFE" strokeWidth="1.5" />
          <circle cx="0" cy="0" r="12" fill="none" stroke="#2563EB" strokeWidth="2" />
          <circle cx="0" cy="0" r="5" fill="#2563EB" />
        </g>

        {/* Title */}
        <text x="64" y="30" fill="#0F172A" fontFamily="system-ui" fontSize="13" fontWeight="800">
          3. Target Matching - Shipped Items Filter
        </text>
        <text x="64" y="46" fill="#64748B" fontFamily="system-ui" fontSize="10.5">
          Select target order criteria: Shipped items only vs All products option
        </text>

        {/* Selection Options */}
        <g transform="translate(64, 56)">
          {/* Active Option: Shipped items only */}
          <rect x="0" y="0" width="180" height="28" rx="8" fill="#EFF6FF" stroke="#2563EB" strokeWidth="1.5" />
          <circle cx="16" cy="14" r="5" fill="#2563EB" />
          <text x="96" y="18" textAnchor="middle" fill="#1D4ED8" fontFamily="system-ui" fontSize="9.5" fontWeight="800">
            ✓ Shipped Items Only
          </text>

          {/* Inactive Option: All Products Option */}
          <g transform="translate(190, 0)">
            <rect x="0" y="0" width="170" height="28" rx="8" fill="#F8FAFC" stroke="#CBD5E1" strokeWidth="1" />
            <circle cx="16" cy="14" r="4" fill="none" stroke="#94A3B8" strokeWidth="1.5" />
            <text x="92" y="18" textAnchor="middle" fill="#64748B" fontFamily="system-ui" fontSize="9.5" fontWeight="600">
              All Products Option
            </text>
          </g>
        </g>
      </g>
    </svg>
  );
}

/* ========================================================================== */
/* SVG 4: VISUAL WORKFLOW STREAMLINED PIPELINE (High-Tech Connected Graph)     */
/* ========================================================================== */
function VisualWorkflowPipelineSvg() {
  return (
    <svg
      viewBox="0 0 540 370"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-auto select-none"
      role="img"
      aria-label="Comprehensive review automation end-to-end connected architecture"
    >
      <defs>
        <linearGradient id="pipeFlowGradTop" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#2563EB" />
          <stop offset="50%" stopColor="#0284C7" />
          <stop offset="100%" stopColor="#38BDF8" />
        </linearGradient>
        <linearGradient id="pipeFeedDownGrad" x1="1" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#38BDF8" />
          <stop offset="60%" stopColor="#0284C7" />
          <stop offset="100%" stopColor="#2563EB" />
        </linearGradient>
        <linearGradient id="pipeDispatchGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#2563EB" />
          <stop offset="100%" stopColor="#0284C7" />
        </linearGradient>
        <filter id="nodeShadow" x="-10%" y="-15%" width="120%" height="130%">
          <feDropShadow dx="0" dy="5" stdDeviation="6" floodColor="#0F172A" floodOpacity="0.07" />
        </filter>
        <marker id="blueHead" markerWidth="6" markerHeight="6" refX="4" refY="3" orient="auto">
          <path d="M0,1 L5,3 L0,5 Z" fill="#0284C7" />
        </marker>
        <marker id="skyHead" markerWidth="6" markerHeight="6" refX="4" refY="3" orient="auto">
          <path d="M0,1 L5,3 L0,5 Z" fill="#38BDF8" />
        </marker>
        <marker id="royalHead" markerWidth="7" markerHeight="7" refX="4" refY="3" orient="auto">
          <path d="M0,1 L6,3 L0,5 Z" fill="#2563EB" />
        </marker>
      </defs>

      {/* ==================================================== */}
      {/* 1. TOP ROW CONDUITS (Left to Right: Node 1 -> 2 -> 3) */}
      {/* ==================================================== */}
      {/* Connector: Stage 1 -> Stage 2 */}
      <path d="M 160 85 L 188 85" stroke="#BAE6FD" strokeWidth="6" strokeLinecap="round" />
      <path d="M 160 85 L 186 85" stroke="#0284C7" strokeWidth="2.5" strokeDasharray="4 4" markerEnd="url(#blueHead)">
        <animate attributeName="stroke-dashoffset" values="0;-16" dur="0.8s" repeatCount="indefinite" />
      </path>

      {/* Connector: Stage 2 -> Stage 3 */}
      <path d="M 345 85 L 372 85" stroke="#BFDBFE" strokeWidth="6" strokeLinecap="round" />
      <path d="M 345 85 L 370 85" stroke="#2563EB" strokeWidth="2.5" strokeDasharray="4 4" markerEnd="url(#royalHead)">
        <animate attributeName="stroke-dashoffset" values="0;-16" dur="0.8s" repeatCount="indefinite" />
      </path>

      {/* ==================================================== */}
      {/* 2. FEED CONDUIT FROM STAGE 3 DOWN INTO CRON HUB (Top-Right -> Bottom-Left) */}
      {/* ==================================================== */}
      <path
        d="M 450 135 C 450 165, 300 155, 185 180"
        stroke="#E2E8F0"
        strokeWidth="6"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M 450 135 C 450 165, 300 155, 185 180"
        stroke="url(#pipeFeedDownGrad)"
        strokeWidth="2.5"
        strokeDasharray="5 5"
        fill="none"
        markerEnd="url(#royalHead)"
      >
        <animate attributeName="stroke-dashoffset" values="0;-20" dur="1s" repeatCount="indefinite" />
      </path>

      {/* ==================================================== */}
      {/* 3. DISPATCH CONDUIT FROM CRON HUB TO CONVERSION (Bottom-Left -> Bottom-Right) */}
      {/* ==================================================== */}
      <path d="M 265 242 L 338 242" stroke="#BAE6FD" strokeWidth="6" strokeLinecap="round" />
      <path
        d="M 265 242 L 335 242"
        stroke="#0284C7"
        strokeWidth="2.5"
        strokeDasharray="4 4"
        markerEnd="url(#blueHead)"
      >
        <animate attributeName="stroke-dashoffset" values="0;-16" dur="0.8s" repeatCount="indefinite" />
      </path>

      {/* ==================================================== */}
      {/* TOP ROW NODES */}
      {/* ==================================================== */}

      {/* Node 1: Order Listing & Marketplace Filter */}
      <g transform="translate(15, 35)" filter="url(#nodeShadow)">
        <rect x="0" y="0" width="145" height="100" rx="14" fill="#FFFFFF" stroke="#BAE6FD" strokeWidth="1.2" />
        <rect x="8" y="8" width="129" height="20" rx="6" fill="#EFF6FF" />
        <text x="14" y="21.5" fill="#1D4ED8" fontFamily="system-ui" fontSize="8.5" fontWeight="800">
          STAGE 01 • INGESTION
        </text>
        <text x="12" y="44" fill="#0F172A" fontFamily="system-ui" fontSize="11" fontWeight="800">
          Order listing
        </text>
        <text x="12" y="58" fill="#64748B" fontFamily="system-ui" fontSize="8.5">
          Marketplace filters
        </text>
        <g transform="translate(12, 68)">
          <rect x="0" y="0" width="121" height="20" rx="10" fill="#F0F9FF" stroke="#7DD3FC" strokeWidth="0.8" />
          <text x="60.5" y="13.5" textAnchor="middle" fill="#0369A1" fontFamily="system-ui" fontSize="8" fontWeight="800">
            🇺🇸 US • 🇨🇦 CA • 🇬🇧 UK
          </text>
        </g>
      </g>

      {/* Node 2: Amazon Credentials */}
      <g transform="translate(195, 35)" filter="url(#nodeShadow)">
        <rect x="0" y="0" width="150" height="100" rx="14" fill="#FFFFFF" stroke="#93C5FD" strokeWidth="1.2" />
        <rect x="8" y="8" width="134" height="20" rx="6" fill="#EFF6FF" />
        <text x="14" y="21.5" fill="#1D4ED8" fontFamily="system-ui" fontSize="8.5" fontWeight="800">
          STAGE 02 • SECURITY
        </text>
        <text x="12" y="44" fill="#0F172A" fontFamily="system-ui" fontSize="11" fontWeight="800">
          Amazon credentials
        </text>
        <text x="12" y="58" fill="#64748B" fontFamily="system-ui" fontSize="8.5">
          studio API OAuth 2.0 Vault
        </text>
        <g transform="translate(12, 68)">
          <rect x="0" y="0" width="126" height="20" rx="10" fill="#F0F9FF" stroke="#BAE6FD" strokeWidth="0.8" />
          <text x="63" y="13.5" textAnchor="middle" fill="#0369A1" fontFamily="system-ui" fontSize="8" fontWeight="800">
            🔒 Encrypted &amp; Authorized
          </text>
        </g>
      </g>

      {/* Node 3: Rules & Settings */}
      <g transform="translate(378, 35)" filter="url(#nodeShadow)">
        <rect x="0" y="0" width="145" height="100" rx="14" fill="#FFFFFF" stroke="#60A5FA" strokeWidth="1.2" />
        <rect x="8" y="8" width="129" height="20" rx="6" fill="#EFF6FF" />
        <text x="14" y="21.5" fill="#1D4ED8" fontFamily="system-ui" fontSize="8.5" fontWeight="800">
          STAGE 03 • RULES
        </text>
        <text x="12" y="44" fill="#0F172A" fontFamily="system-ui" fontSize="11" fontWeight="800">
          Settings &amp; Timing
        </text>
        <text x="12" y="58" fill="#64748B" fontFamily="system-ui" fontSize="8.5">
          FBA/FBM &amp; Shipped only
        </text>
        <g transform="translate(12, 68)">
          <rect x="0" y="0" width="121" height="20" rx="10" fill="#F0F9FF" stroke="#93C5FD" strokeWidth="0.8" />
          <text x="60.5" y="13.5" textAnchor="middle" fill="#1D4ED8" fontFamily="system-ui" fontSize="8" fontWeight="800">
            Auto On/Off: ACTIVE
          </text>
        </g>
      </g>

      {/* ==================================================== */}
      {/* BOTTOM ROW NODES */}
      {/* ==================================================== */}

      {/* Central Heart: Autonomous Cron Engine */}
      <g transform="translate(20, 185)" filter="url(#nodeShadow)">
        <rect x="0" y="0" width="245" height="115" rx="18" fill="#FFFFFF" stroke="#2563EB" strokeWidth="1.6" />
        <rect x="10" y="10" width="225" height="22" rx="7" fill="#EFF6FF" />
        <circle cx="24" cy="21" r="3.5" fill="#2563EB">
          <animate attributeName="opacity" values="1;0.2;1" dur="1s" repeatCount="indefinite" />
        </circle>
        <text x="34" y="24.5" fill="#1D4ED8" fontFamily="system-ui" fontSize="9" fontWeight="900">
          AUTONOMOUS CRON HUB
        </text>
        
        {/* 3 Step Pill Loop: Fetch -> Review -> Send */}
        <g transform="translate(14, 42)">
          <rect x="0" y="0" width="58" height="26" rx="7" fill="#F0F9FF" stroke="#BAE6FD" strokeWidth="0.8" />
          <text x="29" y="17" textAnchor="middle" fill="#0369A1" fontFamily="system-ui" fontSize="9" fontWeight="800">Fetch</text>
          
          <text x="66" y="17" fill="#2563EB" fontSize="11" fontWeight="bold">➔</text>
          
          <rect x="76" y="0" width="60" height="26" rx="7" fill="#EFF6FF" stroke="#93C5FD" strokeWidth="0.8" />
          <text x="106" y="17" textAnchor="middle" fill="#1D4ED8" fontFamily="system-ui" fontSize="9" fontWeight="800">Review</text>
          
          <text x="144" y="17" fill="#2563EB" fontSize="11" fontWeight="bold">➔</text>

          <rect x="154" y="0" width="56" height="26" rx="7" fill="#2563EB" />
          <text x="182" y="17" textAnchor="middle" fill="#FFFFFF" fontFamily="system-ui" fontSize="9.5" fontWeight="900">Send</text>
        </g>

        <g transform="translate(14, 78)">
          <rect x="0" y="0" width="217" height="24" rx="12" fill="#EFF6FF" stroke="#BFDBFE" strokeWidth="0.8" />
          <circle cx="14" cy="12" r="3" fill="#2563EB" />
          <text x="112" y="15.5" textAnchor="middle" fill="#1D4ED8" fontFamily="system-ui" fontSize="9" fontWeight="800">
            Cron Job Scheduler Active
          </text>
        </g>
      </g>

      {/* Output Destination: Verified Amazon Review Solicitation */}
      <g transform="translate(345, 185)" filter="url(#nodeShadow)">
        <rect x="0" y="0" width="180" height="115" rx="18" fill="#FFFFFF" stroke="#38BDF8" strokeWidth="1.4" />
        <rect x="10" y="10" width="160" height="22" rx="7" fill="#F0F9FF" />
        <text x="90" y="24.5" textAnchor="middle" fill="#0284C7" fontFamily="system-ui" fontSize="9" fontWeight="900">
          5-STAR REVIEW CONVERSION
        </text>

        <g transform="translate(90, 54)">
          <text x="0" y="0" textAnchor="middle" fill="#2563EB" fontSize="15" fontWeight="bold">
            ★★★★★
          </text>
          <text x="0" y="17" textAnchor="middle" fill="#0F172A" fontFamily="system-ui" fontSize="10" fontWeight="800">
            Verified Custom orders Lifted
          </text>
        </g>

        <g transform="translate(10, 80)">
          <rect x="0" y="0" width="160" height="22" rx="11" fill="#EFF6FF" stroke="#BFDBFE" strokeWidth="0.8" />
          <text x="80" y="14.5" textAnchor="middle" fill="#1D4ED8" fontFamily="system-ui" fontSize="9" fontWeight="800">
            ✓ 100% Policy Compliant
          </text>
        </g>
      </g>

      {/* Bottom Telemetry Bar */}
      <g transform="translate(25, 330)">
        <rect x="0" y="0" width="490" height="26" rx="13" fill="#F8FAFC" stroke="#E2E8F0" strokeWidth="0.8" />
        <circle cx="16" cy="13" r="3" fill="#2563EB" />
        <text x="26" y="16.5" fill="#475569" fontFamily="system-ui" fontSize="8" fontWeight="700">
          Order Ingestion ➔ studio API OAuth ➔ Rules Engine ➔ Cron Automation ➔ Amazon Feedback Delivered
        </text>
      </g>
    </svg>
  );
}

