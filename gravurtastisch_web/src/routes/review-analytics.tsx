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
  BarChart3,
  TrendingUp,
  Star,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  ShieldCheck,
  Zap,
  HelpCircle,
  ArrowRight,
  Sparkles,
  PieChart,
  LineChart,
  Boxes,
  Headphones
} from "lucide-react";
import i18n from "@/i18n/config";
import { ServicePageSkeleton } from "@/components/skeletons/ServicePageSkeleton";

export const Route = createFileRoute("/review-analytics")({
  pendingComponent: ServicePageSkeleton,
  head: () => ({
    meta: [
      { title: "Amazon Review Analytics & Conversion Intelligence | Gravurtastisch" },
      {
        name: "description",
        content:
          "Track review velocity, monitor SKU-level rating deltas, analyze solicitation delivery rates, and accelerate your Amazon Buy Box conversion.",
      },
      { property: "og:title", content: "Amazon Review Analytics & Insights | Gravurtastisch" },
      {
        property: "og:description",
        content:
          "Actionable analytics for Amazon sellers. Measure rating trends, track SKU performance, and optimize review velocity.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/review-analytics" },
    ],
    links: [{ rel: "canonical", href: "/review-analytics" }],
  }),
  component: ReviewAnalyticsPage,
});

function ReviewAnalyticsPage() {
  const { t } = useTranslation();
  const isSkeletonPreview = typeof window !== "undefined" && window.location.search.includes("skeleton=true");

  if (isSkeletonPreview) {
    return <ServicePageSkeleton />;
  }

  const analyticsFeatures = [
    {
      icon: Star,
      title: t('reviewAnalytics.feat1Title') || "SKU & ASIN Rating Deltas",
      desc: t('reviewAnalytics.feat1Desc') || "Spot which specific product variations are pulling your store rating up or down so you can resolve product issues before negative custom orders compound.",
    },
    {
      icon: TrendingUp,
      title: t('reviewAnalytics.feat2Title') || "Review Velocity Benchmarking",
      desc: t('reviewAnalytics.feat2Desc') || "Measure monthly review generation speed across all marketplaces. Track the compounding impact on your organic Amazon search ranking.",
    },
    {
      icon: BarChart3,
      title: t('reviewAnalytics.feat3Title') || "Request Delivery Funnel",
      desc: t('reviewAnalytics.feat3Desc') || "Transparent funnel analytics tracking total orders, queued solicitations, successful dispatches, and marketplace distributions.",
    },
    {
      icon: Boxes,
      title: t('reviewAnalytics.feat4Title') || "Multi-Marketplace Comparison",
      desc: t('reviewAnalytics.feat4Desc') || "Compare review conversion rates across North America, Europe, India, and Far East regions to uncover localized buyer behavior trends.",
    },
  ];

  const skuTableRows = [
    {
      sku: "CT-HYDR-BTL-32",
      asin: "B09X817L2K",
      name: "32oz Insulated Water Bottle",
      rating: "4.9 ★",
      delta: "+0.3 ★",
      sent: "1,420",
      lift: "+42%",
    },
    {
      sku: "CT-LEATH-WLLT-BRN",
      asin: "B08R929M1N",
      name: "RFID Genuine Leather Wallet",
      rating: "4.7 ★",
      delta: "+0.2 ★",
      sent: "890",
      lift: "+35%",
    },
    {
      sku: "CT-MAT-YOGA-BLK",
      asin: "B09Z104V9P",
      name: "Non-Slip Exercise Yoga Mat",
      rating: "4.8 ★",
      delta: "+0.4 ★",
      sent: "650",
      lift: "+48%",
    },
    {
      sku: "CT-CUP-CERAMIC-SET",
      asin: "B08T551Q8R",
      name: "Ceramic Coffee Mug Set (4pk)",
      rating: "4.6 ★",
      delta: "+0.1 ★",
      sent: "410",
      lift: "+22%",
    },
  ];

  const faqs = [
    {
      q: t('reviewAnalytics.faq1Q') || "Does Amazon tell Gravurtastisch which exact buyer left a review?",
      a: t('reviewAnalytics.faq1A') || "No. In accordance with Amazon's strict Customer Data Protection Policy, Amazon does not link individual customer custom orders directly to specific order IDs. Gravurtastisch provides accurate aggregate review velocity, rating lift deltas, and SKU-level performance metrics.",
    },
    {
      q: t('reviewAnalytics.faq2Q') || "How does Gravurtastisch calculate SKU Rating Deltas?",
      a: t('reviewAnalytics.faq2A') || "Gravurtastisch tracks your listing's average star rating and review count over time before and after automated solicitations are enabled, calculating the net rating improvement and velocity increase per SKU.",
    },
    {
      q: t('reviewAnalytics.faq3Q') || "How does review velocity affect my Amazon Buy Box and SEO rank?",
      a: t('reviewAnalytics.faq3A') || "Amazon's A9 search algorithm and Buy Box algorithms heavily favor listings with steady review velocity, recent feedback, and higher star ratings. Sellers automating production jobs consistently see higher conversion rates and improved organic keyword rankings.",
    },
    {
      q: t('reviewAnalytics.faq4Q') || "Can I export review analytics reports?",
      a: t('reviewAnalytics.faq4A') || "Yes. You can export detailed CSV and PDF reports from the Gravurtastisch dashboard for your marketing and product development teams.",
    },
  ];

  return (
    <div className="min-h-screen bg-background text-navy-deep overflow-x-hidden w-full max-w-full">
      <Nav />

      <main className="pb-8 w-full max-w-full overflow-x-hidden">
        {/* Hero Section */}
        <section className="relative overflow-hidden pt-24 pb-8 lg:pt-28 lg:pb-10 bg-gradient-to-b from-navy-deep via-navy to-navy-soft text-white w-full max-w-full">
          <div className="absolute inset-0 grid-bg opacity-40 pointer-events-none" />
          <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-brand/20 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-32 -left-32 w-80 h-80 rounded-full bg-indigo-500/15 blur-3xl pointer-events-none" />

          <Container className="relative">
            <div className="grid lg:grid-cols-12 gap-10 lg:gap-12 items-center">
              {/* Left Column: Content & CTAs */}
              <Reveal className="lg:col-span-6 xl:col-span-6">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-brand/20 border border-brand/40 px-3.5 py-1 text-xs font-semibold text-brand-bright mb-4">
                    <Sparkles className="h-3.5 w-3.5" />
                    {t('reviewAnalytics.heroBadge') || "Conversion Intelligence & Rating Deltas"}
                  </div>
                  <h1 className="text-4xl sm:text-5xl lg:text-[3.25rem] font-extrabold tracking-tight leading-[1.1]">
                    {t('reviewAnalytics.heroTitle') || "Amazon"} <span className="text-brand-bright">{t('reviewAnalytics.heroTitleHighlight') || "Review Analytics"}</span> &amp; Performance Insights
                  </h1>
                  <p className="mt-4 text-white/70 text-base sm:text-lg leading-relaxed max-w-xl">
                    {t('reviewAnalytics.heroDesc') || "Turn review solicitations into quantifiable business growth. Track SKU rating deltas, monitor review generation velocity, and discover actionable store insights."}
                  </p>
                  <div className="mt-6 flex flex-wrap gap-4">
                    <a
                      href="/#register"
                      className="inline-flex items-center gap-2 rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-brand/30 hover:bg-brand-bright hover:-translate-y-0.5 transition-all"
                    >
                      {t('reviewAnalytics.heroCtaRegister') || "Get Store Analytics"}
                      <ArrowRight className="h-4 w-4" />
                    </a>
                    <a
                      href="#dashboard-preview"
                      className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/20 px-6 py-3 text-sm font-semibold text-white hover:bg-white/20 transition-all"
                    >
                      {t('reviewAnalytics.heroCtaMetrics') || "View SKU Performance Table"}
                    </a>
                  </div>
                </div>
              </Reveal>

              {/* Right Column: Holographic 3D Rating Lift & Velocity SVG */}
              <Reveal delay={100} className="lg:col-span-6 xl:col-span-6">
                <div className="relative flex items-center justify-center">
                  <ReviewAnalyticsHeroSvg />
                </div>
              </Reveal>
            </div>

            {/* Executive Analytics KPI Scorecards with Embedded Micro-Sparklines */}
            <div className="mt-8 sm:mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 border-t border-white/10 pt-6">
              {/* Scorecard 1: Rating Lift + Ascending Curve Sparkline */}
              <Reveal delay={50}>
                <div className="rounded-2xl bg-white/[0.05] border border-white/12 p-4 backdrop-blur-md hover:border-emerald-400/40 hover:bg-white/[0.08] transition-all flex flex-col justify-between shadow-lg">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-white/70">{t('reviewAnalytics.kpi1Label') || "Avg Rating Lift"}</span>
                    <span className="px-2 py-0.5 rounded-full text-[9.5px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                      <TrendingUp className="h-2.5 w-2.5" />
                      +0.35 Stars
                    </span>
                  </div>
                  <div className="my-3 flex items-end justify-between">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <p className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight">4.92</p>
                        <Star className="h-5 w-5 fill-amber-400 text-amber-400 mb-1" />
                      </div>
                      <p className="text-[10px] text-white/50">{t('reviewAnalytics.kpi1Sub') || "Baseline: 4.57 Avg"}</p>
                    </div>
                    {/* Embedded SVG Sparkline */}
                    <svg className="w-20 h-9" viewBox="0 0 80 36" fill="none">
                      <defs>
                        <linearGradient id="spark-lift" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#10B981" stopOpacity="0.4" />
                          <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      <path d="M 0 30 Q 20 28 40 18 T 80 4 L 80 36 L 0 36 Z" fill="url(#spark-lift)" />
                      <path d="M 0 30 Q 20 28 40 18 T 80 4" stroke="#34D399" strokeWidth="2.2" strokeLinecap="round" />
                      <circle cx="80" cy="4" r="3" fill="#10B981" />
                    </svg>
                  </div>
                  <p className="text-[10.5px] text-emerald-300 font-medium pt-2 border-t border-white/10 flex items-center gap-1.5">
                    <TrendingUp className="h-3 w-3 text-emerald-300 shrink-0" />
                    <span>{t('reviewAnalytics.kpi1Footer') || "+7.8% rating delta per ASIN"}</span>
                  </p>
                </div>
              </Reveal>

              {/* Scorecard 2: Velocity + Bar Histogram Sparkline */}
              <Reveal delay={100}>
                <div className="rounded-2xl bg-white/[0.05] border border-white/12 p-4 backdrop-blur-md hover:border-brand/40 hover:bg-white/[0.08] transition-all flex flex-col justify-between shadow-lg">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-white/70">{t('reviewAnalytics.kpi2Label') || "Review Velocity"}</span>
                    <span className="px-2 py-0.5 rounded-full text-[9.5px] font-bold bg-brand/20 text-brand-bright border border-brand/40 flex items-center gap-1">
                      <Zap className="h-2.5 w-2.5" />
                      +2.4x
                    </span>
                  </div>
                  <div className="my-3 flex items-end justify-between">
                    <div>
                      <p className="text-2xl sm:text-3xl font-black text-brand-bright font-mono tracking-tight">+2.4x</p>
                      <p className="text-[10px] text-white/50">{t('reviewAnalytics.kpi2Sub') || "Weekly Growth Rate"}</p>
                    </div>
                    {/* Embedded SVG Histogram Sparkline */}
                    <svg className="w-20 h-9 flex items-end" viewBox="0 0 80 36" fill="none">
                      <rect x="2" y="24" width="8" height="12" rx="2" fill="#60A5FA" opacity="0.4" />
                      <rect x="16" y="20" width="8" height="16" rx="2" fill="#60A5FA" opacity="0.5" />
                      <rect x="30" y="15" width="8" height="21" rx="2" fill="#60A5FA" opacity="0.65" />
                      <rect x="44" y="11" width="8" height="25" rx="2" fill="#60A5FA" opacity="0.8" />
                      <rect x="58" y="6" width="8" height="30" rx="2" fill="#3B82F6" />
                      <rect x="72" y="2" width="8" height="34" rx="2" fill="#2563EB" />
                    </svg>
                  </div>
                  <p className="text-[10.5px] text-brand-bright font-medium pt-2 border-t border-white/10 flex items-center gap-1.5">
                    <BarChart3 className="h-3 w-3 text-brand-bright shrink-0" />
                    <span>{t('reviewAnalytics.kpi2Footer') || "1,420 monthly solicitations"}</span>
                  </p>
                </div>
              </Reveal>

              {/* Scorecard 3: Dispatch Rate + Pulse Stream Sparkline */}
              <Reveal delay={150}>
                <div className="rounded-2xl bg-white/[0.05] border border-white/12 p-4 backdrop-blur-md hover:border-sky-400/40 hover:bg-white/[0.08] transition-all flex flex-col justify-between shadow-lg">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-white/70">{t('reviewAnalytics.kpi3Label') || "Dispatch Delivery"}</span>
                    <span className="px-2 py-0.5 rounded-full text-[9.5px] font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30 flex items-center gap-1">
                      <CheckCircle2 className="h-2.5 w-2.5" />
                      High-Throughput
                    </span>
                  </div>
                  <div className="my-3 flex items-end justify-between">
                    <div>
                      <p className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight">99.8%</p>
                      <p className="text-[10px] text-white/50">{t('reviewAnalytics.kpi3Sub') || "Direct In-Box Delivery"}</p>
                    </div>
                    {/* Embedded SVG Pulse Stream */}
                    <svg className="w-20 h-9" viewBox="0 0 80 36" fill="none">
                      <path
                        d="M 0 18 L 24 18 L 30 8 L 38 28 L 46 12 L 52 18 L 80 18"
                        stroke="#38BDF8"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <circle cx="80" cy="18" r="3" fill="#38BDF8" />
                    </svg>
                  </div>
                  <p className="text-[10.5px] text-sky-300 font-medium pt-2 border-t border-white/10 flex items-center gap-1.5">
                    <Zap className="h-3 w-3 text-sky-300 shrink-0" />
                    <span>{t('reviewAnalytics.kpi3Footer') || "studio API automated execution"}</span>
                  </p>
                </div>
              </Reveal>

              {/* Scorecard 4: Policy Warnings + Safety Flatline */}
              <Reveal delay={200}>
                <div className="rounded-2xl bg-white/[0.05] border border-white/12 p-4 backdrop-blur-md hover:border-purple-400/40 hover:bg-white/[0.08] transition-all flex flex-col justify-between shadow-lg">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-white/70">{t('reviewAnalytics.kpi4Label') || "Policy Safety"}</span>
                    <span className="px-2 py-0.5 rounded-full text-[9.5px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1">
                      <ShieldCheck className="h-2.5 w-2.5" />
                      100% Amazon ToS
                    </span>
                  </div>
                  <div className="my-3 flex items-end justify-between">
                    <div>
                      <p className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight">100%</p>
                      <p className="text-[10px] text-white/50">{t('reviewAnalytics.kpi4Sub') || "Zero Policy Warnings"}</p>
                    </div>
                    {/* Embedded SVG Flatline Shield Meter */}
                    <svg className="w-20 h-9" viewBox="0 0 80 36" fill="none">
                      <line x1="0" y1="18" x2="80" y2="18" stroke="#C084FC" strokeWidth="2.5" strokeDasharray="4 4" />
                      <circle cx="40" cy="18" r="7" fill="#581C87" stroke="#C084FC" strokeWidth="1.5" />
                      <path d="M 37 18 L 39 20 L 43 16" stroke="#FAF5FF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <p className="text-[10.5px] text-purple-300 font-medium pt-2 border-t border-white/10 flex items-center gap-1">
                    <span>{t('reviewAnalytics.kpi4Footer') || "✓ 0 buyer communication flags"}</span>
                  </p>
                </div>
              </Reveal>
            </div>
          </Container>
        </section>

        {/* Feature Highlights */}
        <section className="py-10 lg:py-14 bg-surface border-b border-border">
          <Container>
            <Reveal>
              <div className="max-w-2xl mb-8">
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-brand">
                  {t('reviewAnalytics.featureSectionBadge') || "Intelligence Stack"}
                </span>
                <h2 className="mt-3 text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-navy-deep leading-tight">
                  {t('reviewAnalytics.featureSectionHeading') || "Understand What Drives Your Store's Reputation"}
                </h2>
                <p className="mt-2 text-slate-body text-sm sm:text-base leading-relaxed">
                  {t('reviewAnalytics.featureSectionDesc') || "Go beyond simple review counts. Gravurtastisch gives you granular analytics to pinpoint top-converting ASINs, diagnose underperforming variations, and benchmark across international marketplaces."}
                </p>
              </div>
            </Reveal>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
              {analyticsFeatures.map((f, idx) => {
                const Icon = f.icon;
                return (
                  <Reveal key={f.title} delay={idx * 60}>
                    <div className="h-full rounded-2xl bg-white border border-border p-5 sm:p-6 shadow-sm hover:border-brand/40 hover:shadow-md transition-all flex flex-col justify-between">
                      <div>
                        <div className="h-10 w-10 rounded-xl bg-brand/10 text-brand grid place-items-center mb-4">
                          <Icon className="h-5 w-5" />
                        </div>
                        <h3 className="text-base font-bold text-navy-deep mb-1.5">{f.title}</h3>
                        <p className="text-xs sm:text-sm text-slate-body leading-relaxed">{f.desc}</p>
                      </div>
                      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center text-xs font-semibold text-brand">
                        <span>Analytics Module</span>
                      </div>
                    </div>
                  </Reveal>
                );
              })}
            </div>
          </Container>
        </section>

        {/* SKU Performance Table Showcase */}
        <section id="dashboard-preview" className="py-10 lg:py-14 bg-white">
          <Container>
            <Reveal>
              <div className="max-w-3xl mx-auto text-center mb-8">
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-brand">
                  {t('reviewAnalytics.skuTableBadge') || "SKU Breakdown"}
                </span>
                <h2 className="mt-3 text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-navy-deep leading-tight">
                  {t('reviewAnalytics.skuTableHeading') || "Granular SKU & ASIN Rating Performance"}
                </h2>
                <p className="mt-2 text-slate-body text-sm sm:text-base">
                  {t('reviewAnalytics.skuTableDesc') || "Track individual product velocity, rating deltas, and review conversion lifts in real-time."}
                </p>
              </div>
            </Reveal>

            <Reveal delay={100}>
              <div className="overflow-x-auto rounded-2xl border border-border bg-surface shadow-sm">
                <table className="w-full text-left text-sm min-w-[640px]">
                  <thead className="bg-navy-deep text-white text-xs uppercase tracking-wider">
                    <tr>
                      <th className="p-3.5 sm:p-4">{t('reviewAnalytics.tableColProduct') || "Product & SKU"}</th>
                      <th className="p-3.5 sm:p-4">{t('reviewAnalytics.tableColAsin') || "ASIN"}</th>
                      <th className="p-3.5 sm:p-4">{t('reviewAnalytics.tableColRating') || "Current Rating"}</th>
                      <th className="p-3.5 sm:p-4">{t('reviewAnalytics.tableColDelta') || "Rating Delta"}</th>
                      <th className="p-3.5 sm:p-4">{t('reviewAnalytics.tableColSent') || "Requests Sent"}</th>
                      <th className="p-3.5 sm:p-4 text-right">{t('reviewAnalytics.tableColLift') || "Review Lift"}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {skuTableRows.map((row, idx) => (
                      <tr key={row.sku} className={idx % 2 === 0 ? "bg-white" : "bg-slate-50/50"}>
                        <td className="p-3.5 sm:p-4">
                          <p className="font-bold text-navy-deep text-sm">{row.name}</p>
                          <p className="font-mono text-xs text-slate-400 mt-0.5">{row.sku}</p>
                        </td>
                        <td className="p-3.5 sm:p-4 font-mono text-xs text-slate-600">{row.asin}</td>
                        <td className="p-3.5 sm:p-4 font-bold text-amber-600 flex items-center gap-1">
                          <Star className="h-4 w-4 fill-amber-400 text-amber-400 inline" />
                          {row.rating}
                        </td>
                        <td className="p-3.5 sm:p-4 text-emerald-600 font-bold">{row.delta}</td>
                        <td className="p-3.5 sm:p-4 font-mono text-slate-700">{row.sent}</td>
                        <td className="p-3.5 sm:p-4 text-right font-bold text-brand">{row.lift}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Reveal>
          </Container>
        </section>

        {/* FAQs (2-Column: Left Analytics Conversion Funnel SVG, Right FAQs) */}
        <section className="py-10 lg:py-14 bg-white border-b border-border">
          <Container>
            <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-center">
              {/* Left Column: Analytics Funnel Vector Graphic */}
              <Reveal className="lg:col-span-5 xl:col-span-5">
                <div className="space-y-4">
                  <div className="relative flex items-center justify-center">
                    <ReviewAnalyticsFaqSvg />
                  </div>

                  <div className="rounded-2xl bg-surface border border-border p-4 flex items-center justify-between gap-4 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-xl bg-brand/10 text-brand grid place-items-center shrink-0">
                        <Headphones className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-navy-deep">{t('reviewAnalytics.faqSupportTitle') || "Need Custom Analytics Reports?"}</p>
                        <p className="text-[10.5px] text-slate-body">{t('reviewAnalytics.faqSupportDesc') || "Our team assists with custom ASIN cohort exports."}</p>
                      </div>
                    </div>
                    <a
                      href="/#contact"
                      className="inline-flex items-center gap-1 text-xs font-bold text-brand hover:text-brand-bright transition-colors shrink-0"
                    >
                      {t('reviewAnalytics.faqSupportLink') || "Talk to us →"}
                    </a>
                  </div>
                </div>
              </Reveal>

              {/* Right Column: FAQs List */}
              <div className="lg:col-span-7 xl:col-span-7">
                <Reveal>
                  <div className="mb-6">
                    <span className="text-xs font-bold uppercase tracking-[0.2em] text-brand">
                      {t('reviewAnalytics.faqBadge') || "Intelligence & Data"}
                    </span>
                    <h2 className="mt-3 text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-navy-deep leading-tight">
                      {t('reviewAnalytics.faqHeading') || "Analytics FAQs"}
                    </h2>
                    <p className="mt-2 text-sm text-slate-body leading-relaxed">
                      {t('reviewAnalytics.faqDesc') || "Everything you need to know about Amazon review tracking, SKU rating delta calculations, and data privacy."}
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
            <div className="rounded-3xl bg-gradient-to-br from-navy-deep via-navy-deep to-brand p-6 sm:p-10 text-white text-center shadow-xl">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight">
                {t('reviewAnalytics.ctaHeading') || "Unlock Intelligent Amazon Review Analytics"}
              </h2>
              <p className="mt-3 text-white/75 text-sm sm:text-base max-w-xl mx-auto">
                {t('reviewAnalytics.ctaDesc') || "Discover the data behind your custom orders and grow your FBA brand with confidence."}
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-4">
                <a
                  href="/#register"
                  className="inline-flex items-center gap-2 rounded-full bg-brand-bright px-7 py-3.5 text-sm font-bold text-navy-deep hover:bg-white transition-all shadow-lg hover:-translate-y-0.5"
                >
                  {t('reviewAnalytics.ctaButton') || "Register as Seller"}
                  <ArrowRight className="h-4 w-4" />
                </a>
                <a
                  href="/#pricing"
                  className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/20 px-7 py-3.5 text-sm font-semibold text-white hover:bg-white/20 transition-all"
                >
                  {t('reviewAnalytics.ctaPricing') || "View Pricing Plans"}
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

function ReviewAnalyticsHeroSvg() {
  return (
    <svg
      viewBox="0 0 580 430"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-auto select-none"
      role="img"
      aria-label="Amazon Review Analytics & Rating Velocity SaaS Intelligence Console"
    >
      <defs>
        {/* Glow & Shadow Filters */}
        <filter id="hud-glow-cyan" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
        <filter id="hud-white-card-shadow" x="-10%" y="-10%" width="120%" height="125%">
          <feDropShadow dx="0" dy="16" stdDeviation="24" floodColor="#020617" floodOpacity="0.45" />
        </filter>

        {/* Chart Area Fill Gradient on White Base */}
        <linearGradient id="hud-chart-area-white" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0284C7" stopOpacity="0.22" />
          <stop offset="60%" stopColor="#10B981" stopOpacity="0.08" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.0" />
        </linearGradient>

        {/* Chart Primary Stroke Gradient */}
        <linearGradient id="hud-chart-stroke-white" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#0284C7" />
          <stop offset="45%" stopColor="#6366F1" />
          <stop offset="80%" stopColor="#10B981" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>

        {/* Tooltip Background (Dark Contrast Focal Point) */}
        <linearGradient id="hud-tooltip-dark" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#0F172A" />
          <stop offset="100%" stopColor="#1E293B" />
        </linearGradient>
      </defs>

      {/* ==================================================== */}
      {/* 1. MAIN WHITE CONSOLE CARD FRAME */}
      {/* ==================================================== */}
      <g filter="url(#hud-white-card-shadow)">
        <rect
          x="10"
          y="10"
          width="560"
          height="410"
          rx="22"
          fill="#FFFFFF"
          stroke="#E2E8F0"
          strokeWidth="1.5"
        />
      </g>

      {/* ==================================================== */}
      {/* 2. TOP CONSOLE HEADER */}
      {/* ==================================================== */}
      <g transform="translate(26, 32)">
        {/* Terminal Mac Window Dots */}
        <circle cx="0" cy="0" r="4.5" fill="#EF4444" />
        <circle cx="13" cy="0" r="4.5" fill="#F59E0B" />
        <circle cx="26" cy="0" r="4.5" fill="#10B981" />

        {/* Console Title */}
        <text x="44" y="4" fill="#0F172A" fontFamily="system-ui" fontSize="12" fontWeight="800">
          Review Intelligence Console
        </text>

        {/* Live Indicator Pill */}
        <g transform="translate(225, 0)">
          <rect x="-6" y="-10" width="144" height="20" rx="10" fill="#ECFDF5" stroke="#A7F3D0" strokeWidth="1" />
          <circle cx="4" cy="0" r="3.5" fill="#10B981">
            <animate attributeName="opacity" values="1;0.3;1" dur="1.4s" repeatCount="indefinite" />
          </circle>
          <text x="13" y="3.5" fill="#065F46" fontFamily="monospace" fontSize="8" fontWeight="800">
            LIVE TELEMETRY STREAM
          </text>
        </g>

        {/* Timeframe Selector Pill (Right) */}
        <g transform="translate(440, 0)">
          <rect x="-42" y="-10" width="84" height="20" rx="10" fill="#F8FAFC" stroke="#E2E8F0" strokeWidth="1" />
          <text x="0" y="3.5" textAnchor="middle" fill="#475569" fontFamily="system-ui" fontSize="8.5" fontWeight="600">
            Last 30 Days ▾
          </text>
        </g>
      </g>

      {/* Header Divider Line */}
      <line x1="10" y1="52" x2="570" y2="52" stroke="#F1F5F9" strokeWidth="1.5" />

      {/* ==================================================== */}
      {/* 3. THREE TOP TELEMETRY METRIC WIDGETS */}
      {/* ==================================================== */}
      {/* WIDGET 1: Average Rating Lift */}
      <g transform="translate(30, 68)">
        <rect x="0" y="0" width="160" height="54" rx="12" fill="#F8FAFC" stroke="#E2E8F0" strokeWidth="1" />
        <text x="12" y="18" fill="#64748B" fontFamily="system-ui" fontSize="8.5" fontWeight="700">
          AVG STORE RATING
        </text>
        <text x="12" y="41" fill="#D97706" fontFamily="monospace" fontSize="18" fontWeight="900">
          4.92 ★
        </text>
        <rect x="92" y="27" width="56" height="18" rx="9" fill="#DCFCE7" stroke="#86EFAC" strokeWidth="0.8" />
        <text x="120" y="39" textAnchor="middle" fill="#16A34A" fontFamily="monospace" fontSize="8.5" fontWeight="800">
          +0.35 ★
        </text>
      </g>

      {/* WIDGET 2: Review Velocity Multiplier */}
      <g transform="translate(205, 68)">
        <rect x="0" y="0" width="170" height="54" rx="12" fill="#F8FAFC" stroke="#E2E8F0" strokeWidth="1" />
        <text x="12" y="18" fill="#64748B" fontFamily="system-ui" fontSize="8.5" fontWeight="700">
          REVIEW GENERATION VELOCITY
        </text>
        <text x="12" y="41" fill="#0284C7" fontFamily="monospace" fontSize="18" fontWeight="900">
          +2.4x
        </text>
        <rect x="85" y="27" width="73" height="18" rx="9" fill="#E0F2FE" stroke="#BAE6FD" strokeWidth="0.8" />
        <text x="121" y="39" textAnchor="middle" fill="#0369A1" fontFamily="monospace" fontSize="8" fontWeight="800">
          1,420 SENT
        </text>
      </g>

      {/* WIDGET 3: Buy Box Win Rate */}
      <g transform="translate(390, 68)">
        <rect x="0" y="0" width="160" height="54" rx="12" fill="#F8FAFC" stroke="#E2E8F0" strokeWidth="1" />
        <text x="12" y="18" fill="#64748B" fontFamily="system-ui" fontSize="8.5" fontWeight="700">
          BUY BOX CONVERSION
        </text>
        <text x="12" y="41" fill="#059669" fontFamily="monospace" fontSize="18" fontWeight="900">
          +42.8%
        </text>
        <rect x="94" y="27" width="54" height="18" rx="9" fill="#DCFCE7" stroke="#86EFAC" strokeWidth="0.8" />
        <text x="121" y="39" textAnchor="middle" fill="#16A34A" fontFamily="monospace" fontSize="8.5" fontWeight="800">
          99.8%
        </text>
      </g>

      {/* ==================================================== */}
      {/* 4. MAIN TREND GRAPH: SOLICITATION VS RATING SURGE */}
      {/* ==================================================== */}
      <g transform="translate(45, 138)">
        {/* Y-Axis Grid Lines & Labels */}
        {[
          { y: 0, val: "5.0 ★" },
          { y: 35, val: "4.8 ★" },
          { y: 70, val: "4.5 ★" },
          { y: 105, val: "4.0 ★" },
          { y: 140, val: "3.5 ★" },
        ].map((grid, idx) => (
          <g key={idx}>
            <line x1="30" y1={grid.y} x2="495" y2={grid.y} stroke="#F1F5F9" strokeWidth="1.2" />
            <text x="0" y={grid.y + 3.5} fill="#94A3B8" fontFamily="monospace" fontSize="8.5" fontWeight="600">
              {grid.val}
            </text>
          </g>
        ))}

        {/* X-Axis Timeline Markers */}
        {[
          { x: 30, lbl: "Day 0" },
          { x: 120, lbl: "Day 5" },
          { x: 215, lbl: "Day 12" },
          { x: 310, lbl: "Day 18 (Peak)" },
          { x: 405, lbl: "Day 24" },
          { x: 495, lbl: "Day 30" },
        ].map((tm, idx) => (
          <text key={idx} x={tm.x} y="155" textAnchor="middle" fill="#94A3B8" fontFamily="monospace" fontSize="8">
            {tm.lbl}
          </text>
        ))}

        {/* Shaded Area Under Primary Curve */}
        <path
          d="M 30 135 C 100 130, 160 115, 230 75 C 290 40, 360 15, 430 10 C 465 8, 480 6, 495 5 L 495 140 L 30 140 Z"
          fill="url(#hud-chart-area-white)"
        />

        {/* Baseline (Without Automation) Stagnant Curve */}
        <path
          d="M 30 135 C 120 133, 220 130, 320 128 C 400 125, 460 123, 495 120"
          fill="none"
          stroke="#94A3B8"
          strokeWidth="1.8"
          strokeDasharray="4 6"
        />
        <text x="355" y="118" fill="#64748B" fontFamily="system-ui" fontSize="8" fontWeight="600">
          --- Unautomated Baseline (+0.05★)
        </text>

        {/* Primary Accelerated Review Velocity Spline */}
        <path
          d="M 30 135 C 100 130, 160 115, 230 75 C 290 40, 360 15, 430 10 C 465 8, 480 6, 495 5"
          fill="none"
          stroke="url(#hud-chart-stroke-white)"
          strokeWidth="3.5"
          strokeLinecap="round"
        />

        {/* Animated Flowing Laser Pulse on Curve */}
        <path
          d="M 30 135 C 100 130, 160 115, 230 75 C 290 40, 360 15, 430 10 C 465 8, 480 6, 495 5"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="1.5"
          strokeDasharray="6 14"
          opacity="0.9"
        >
          <animate attributeName="stroke-dashoffset" values="0;-40" dur="1.6s" repeatCount="indefinite" />
        </path>

        {/* Vertical Crosshair Guide at Optimal Conversion Node (Day 18) */}
        <line x1="310" y1="0" x2="310" y2="140" stroke="#0284C7" strokeWidth="1" strokeDasharray="3 3" opacity="0.6" />
        <circle cx="310" cy="30" r="5" fill="#0284C7" stroke="#FFFFFF" strokeWidth="2" filter="url(#hud-glow-cyan)">
          <animate attributeName="r" values="5;7;5" dur="2s" repeatCount="indefinite" />
        </circle>

        {/* Interactive Floating Tooltip Card (High Contrast Dark Navy) */}
        <g transform="translate(195, -12)" filter="url(#hud-white-card-shadow)">
          <rect x="0" y="0" width="185" height="42" rx="8" fill="url(#hud-tooltip-dark)" stroke="#38BDF8" strokeWidth="1" />
          <circle cx="12" cy="14" r="3.5" fill="#34D399" />
          <text x="22" y="16" fill="#F8FAFC" fontFamily="system-ui" fontSize="8.5" fontWeight="700">
            Day 18 Optimal Window Peak
          </text>
          <text x="12" y="32" fill="#34D399" fontFamily="monospace" fontSize="9" fontWeight="800">
            4.92 ★ • +42% Review Lift
          </text>
        </g>
      </g>

      {/* ==================================================== */}
      {/* 5. BOTTOM BAR: STAR RATING DISTRIBUTION & SKU TELEMETRY */}
      {/* ==================================================== */}
      <g transform="translate(30, 315)">
        <rect x="0" y="0" width="520" height="92" rx="14" fill="#F8FAFC" stroke="#E2E8F0" strokeWidth="1" />

        {/* Section Label */}
        <text x="16" y="20" fill="#0F172A" fontFamily="system-ui" fontSize="9" fontWeight="800">
          5-STAR RATING BREAKDOWN &amp; SKU LIFT
        </text>

        {/* SKU Badge (Right) */}
        <g transform="translate(378, 10)">
          <rect x="0" y="0" width="126" height="16" rx="8" fill="#EFF6FF" stroke="#BFDBFE" strokeWidth="0.8" />
          <text x="63" y="11.5" textAnchor="middle" fill="#1D4ED8" fontFamily="monospace" fontSize="8" fontWeight="800">
            SKU: CT-HYDR-BTL-32
          </text>
        </g>

        {/* 5-Tier Segmented Distribution Bar */}
        <g transform="translate(16, 32)">
          {/* Segment 5-Star (76%) */}
          <rect x="0" y="0" width="220" height="12" rx="3" fill="#10B981" />
          {/* Segment 4-Star (15%) */}
          <rect x="224" y="0" width="45" height="12" rx="3" fill="#0284C7" />
          {/* Segment 3-Star (5%) */}
          <rect x="273" y="0" width="16" height="12" rx="3" fill="#F59E0B" />
          {/* Segment 2-Star (2%) */}
          <rect x="293" y="0" width="8" height="12" rx="3" fill="#F97316" />
          {/* Segment 1-Star (2%) */}
          <rect x="305" y="0" width="8" height="12" rx="3" fill="#EF4444" />

          {/* Buy Box Win Badge (Right of Bar) */}
          <g transform="translate(325, -2)">
            <rect x="0" y="0" width="162" height="16" rx="8" fill="#ECFDF5" stroke="#A7F3D0" strokeWidth="0.8" />
            <text x="81" y="11.5" textAnchor="middle" fill="#059669" fontFamily="system-ui" fontSize="8" fontWeight="800">
              🏆 Amazon Buy Box Win: 99.4%
            </text>
          </g>
        </g>

        {/* Legend Row */}
        <g transform="translate(16, 62)">
          <circle cx="4" cy="4" r="3.5" fill="#10B981" />
          <text x="12" y="7" fill="#334155" fontFamily="monospace" fontSize="8" fontWeight="800">
            5★ (76%)
          </text>

          <circle cx="75" cy="4" r="3.5" fill="#0284C7" />
          <text x="83" y="7" fill="#334155" fontFamily="monospace" fontSize="8" fontWeight="800">
            4★ (15%)
          </text>

          <circle cx="145" cy="4" r="3.5" fill="#F59E0B" />
          <text x="153" y="7" fill="#334155" fontFamily="monospace" fontSize="8" fontWeight="800">
            3★ (5%)
          </text>

          <circle cx="215" cy="4" r="3.5" fill="#F97316" />
          <text x="223" y="7" fill="#334155" fontFamily="monospace" fontSize="8" fontWeight="800">
            2★ (2%)
          </text>

          <circle cx="280" cy="4" r="3.5" fill="#EF4444" />
          <text x="288" y="7" fill="#334155" fontFamily="monospace" fontSize="8" fontWeight="800">
            1★ (2%)
          </text>

          {/* A9 Rank Indicator */}
          <text x="488" y="7" textAnchor="end" fill="#0284C7" fontFamily="system-ui" fontSize="8" fontWeight="800">
            ⚡ A9 Organic Rank: +14 Positions
          </text>
        </g>
      </g>
    </svg>
  );
}

function ReviewAnalyticsFaqSvg() {
  return (
    <svg
      viewBox="0 0 540 500"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-auto select-none"
      role="img"
      aria-label="Enterprise Amazon Review Analytics & Orbital Velocity Radar"
    >
      <defs>
        {/* Modern Theme Blue Gradients (Pure Royal Blue, Cobalt & Sky Navy) */}
        <radialGradient id="faq-radar-core-grad" cx="40%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#2563EB" />
          <stop offset="35%" stopColor="#1D4ED8" />
          <stop offset="75%" stopColor="#0F172A" />
          <stop offset="100%" stopColor="#020617" />
        </radialGradient>

        <linearGradient id="faq-radar-arc-blue" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#38BDF8" />
          <stop offset="50%" stopColor="#2563EB" />
          <stop offset="100%" stopColor="#1E3A8A" />
        </linearGradient>

        <linearGradient id="faq-radar-beam-cyan" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#38BDF8" />
          <stop offset="100%" stopColor="#2563EB" />
        </linearGradient>

        <linearGradient id="faq-node-card-bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#F8FAFC" />
        </linearGradient>

        <linearGradient id="faq-sparkline-blue" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#0284C7" />
          <stop offset="50%" stopColor="#2563EB" />
          <stop offset="100%" stopColor="#38BDF8" />
        </linearGradient>

        {/* Soft Drop Shadows & Theme Blue Glows */}
        <filter id="faq-node-shadow" x="-15%" y="-15%" width="130%" height="135%">
          <feDropShadow dx="0" dy="6" stdDeviation="8" floodColor="#0F172A" floodOpacity="0.08" />
        </filter>

        <filter id="faq-radar-glow-blue" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="8" stdDeviation="14" floodColor="#2563EB" floodOpacity="0.25" />
        </filter>

        <filter id="faq-radar-glow-cyan" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="6" stdDeviation="12" floodColor="#0284C7" floodOpacity="0.2" />
        </filter>
      </defs>

      {/* ==================================================== */}
      {/* 1. AMBIENT BACKGROUND CONCENTRIC RADAR RINGS & MESH */}
      {/* ==================================================== */}
      <g transform="translate(270, 250)">
        {/* Soft Background Circular Glow */}
        <circle cx="0" cy="0" r="190" fill="#F8FAFC" opacity="0.7" />
        <circle cx="0" cy="0" r="150" fill="#EFF6FF" opacity="0.4" />

        {/* Outer Orbit Guideline */}
        <circle cx="0" cy="0" r="185" fill="none" stroke="#E2E8F0" strokeWidth="1" strokeDasharray="4 6" />
        <circle cx="0" cy="0" r="135" fill="none" stroke="#CBD5E1" strokeWidth="1.2" strokeDasharray="3 5" />
        <circle cx="0" cy="0" r="85" fill="none" stroke="#BFDBFE" strokeWidth="1.5" strokeDasharray="6 6" />

        {/* Rotating Radar Range Grid Crosshairs */}
        <line x1="-185" y1="0" x2="185" y2="0" stroke="#E2E8F0" strokeWidth="1" strokeDasharray="2 4" />
        <line x1="0" y1="-185" x2="0" y2="185" stroke="#E2E8F0" strokeWidth="1" strokeDasharray="2 4" />
        <line x1="-130" y1="-130" x2="130" y2="130" stroke="#F1F5F9" strokeWidth="1" />
        <line x1="-130" y1="130" x2="130" y2="-130" stroke="#F1F5F9" strokeWidth="1" />
      </g>

      {/* ==================================================== */}
      {/* 2. DYNAMIC ENERGY BEAMS & TRAVELING PHOTONS */}
      {/* ==================================================== */}
      {/* Curved Beam: Top (Ingestion) to Center Core */}
      <path
        d="M 270 70 L 270 170"
        fill="none"
        stroke="url(#faq-radar-beam-cyan)"
        strokeWidth="2.5"
        strokeDasharray="5 5"
      >
        <animate attributeName="stroke-dashoffset" values="0;-20" dur="1.2s" repeatCount="indefinite" />
      </path>

      {/* Curved Beam: Center Core to Left (5-Star Lift) */}
      <path
        d="M 190 250 C 130 250, 100 280, 80 320"
        fill="none"
        stroke="#2563EB"
        strokeWidth="2.2"
        strokeDasharray="5 5"
      >
        <animate attributeName="stroke-dashoffset" values="0;-20" dur="1.4s" repeatCount="indefinite" />
      </path>

      {/* Curved Beam: Center Core to Right (Open Rate) */}
      <path
        d="M 350 250 C 410 250, 430 220, 450 180"
        fill="none"
        stroke="#0284C7"
        strokeWidth="2.2"
        strokeDasharray="5 5"
      >
        <animate attributeName="stroke-dashoffset" values="0;-20" dur="1.3s" repeatCount="indefinite" />
      </path>

      {/* Curved Beam: Center Core to Bottom (Buy Box Win) */}
      <path
        d="M 270 330 C 270 380, 320 400, 360 410"
        fill="none"
        stroke="#1D4ED8"
        strokeWidth="2.2"
        strokeDasharray="5 5"
      >
        <animate attributeName="stroke-dashoffset" values="0;-20" dur="1.5s" repeatCount="indefinite" />
      </path>

      {/* Traveling Energy Photons */}
      <circle cx="270" cy="110" r="3.5" fill="#38BDF8">
        <animate attributeName="cy" values="70;170" dur="1.2s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.2;1;0.2" dur="1.2s" repeatCount="indefinite" />
      </circle>

      <circle cx="0" cy="0" r="3.5" fill="#2563EB">
        <animateMotion
          path="M 190 250 C 130 250, 100 280, 80 320"
          dur="1.4s"
          repeatCount="indefinite"
        />
      </circle>

      <circle cx="0" cy="0" r="3.5" fill="#0284C7">
        <animateMotion
          path="M 350 250 C 410 250, 430 220, 450 180"
          dur="1.3s"
          repeatCount="indefinite"
        />
      </circle>

      {/* ==================================================== */}
      {/* 3. CENTRAL 3D RATING & DELTA RADAR CORE */}
      {/* ==================================================== */}
      <g transform="translate(270, 250)" filter="url(#faq-radar-glow-blue)">
        {/* Revolving Tech Gyro Ring */}
        <circle cx="0" cy="0" r="76" fill="none" stroke="#93C5FD" strokeWidth="1.5" strokeDasharray="8 12">
          <animateTransform
            attributeName="transform"
            type="rotate"
            from="0"
            to="360"
            dur="24s"
            repeatCount="indefinite"
          />
        </circle>

        {/* Active Velocity Progress Ring */}
        <circle cx="0" cy="0" r="66" fill="none" stroke="#E2E8F0" strokeWidth="5" />
        <circle
          cx="0"
          cy="0"
          r="66"
          fill="none"
          stroke="url(#faq-radar-arc-blue)"
          strokeWidth="6"
          strokeDasharray="414"
          strokeDashoffset="75"
          strokeLinecap="round"
          transform="rotate(-90)"
        />

        {/* 3D Dark Core Sphere */}
        <circle cx="0" cy="0" r="54" fill="url(#faq-radar-core-grad)" stroke="#38BDF8" strokeWidth="2" />

        {/* Sweeping Scanner Radar Hand */}
        <line x1="0" y1="0" x2="0" y2="-50" stroke="#38BDF8" strokeWidth="2.5" strokeLinecap="round">
          <animateTransform
            attributeName="transform"
            type="rotate"
            from="0"
            to="360"
            dur="5s"
            repeatCount="indefinite"
          />
        </line>
        <circle cx="0" cy="0" r="5" fill="#38BDF8" />

        {/* Central Live Rating Metrics */}
        <text x="0" y="-18" textAnchor="middle" fill="#7DD3FC" fontFamily="monospace" fontSize="9.5" fontWeight="800" letterSpacing="0.5">
          STORE AVERAGE
        </text>

        <text x="0" y="8" textAnchor="middle" fill="#FFFFFF" fontFamily="system-ui" fontSize="22" fontWeight="900">
          4.92 ★
        </text>

        <g transform="translate(0, 24)">
          <rect x="-44" y="-9" width="88" height="18" rx="9" fill="#0F172A" stroke="#2563EB" strokeWidth="1" />
          <text x="0" y="3.5" textAnchor="middle" fill="#93C5FD" fontFamily="monospace" fontSize="8.5" fontWeight="800">
            ▲ +0.35 DELTA
          </text>
        </g>
      </g>

      {/* ==================================================== */}
      {/* 4. FLOATING SATELLITE METRIC CAPSULES */}
      {/* ==================================================== */}

      {/* TOP SATELLITE: Ingestion Stream */}
      <g transform="translate(140, 22)" filter="url(#faq-node-shadow)">
        <g>
          <animateTransform
            attributeName="transform"
            type="translate"
            values="0 0; 0 -4; 0 0"
            dur="3.8s"
            repeatCount="indefinite"
          />
          <rect width="260" height="50" rx="25" fill="url(#faq-node-card-bg)" stroke="#E2E8F0" strokeWidth="1.2" />

          {/* High-Contrast Vibrant Brand Theme Blue Container */}
          <circle cx="25" cy="25" r="16" fill="#1E293B" stroke="#2563EB" strokeWidth="1.2" />
          {/* Crisp White & Light Cyan Ingestion Box Vector */}
          <g transform="translate(17, 17)" stroke="#FFFFFF" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <path d="M 8 1.5 L 14.5 4.8 L 8 8.2 L 1.5 4.8 Z" fill="#38BDF8" stroke="#FFFFFF" />
            <path d="M 1.5 4.8 L 1.5 11.2 L 8 14.5 L 8 8.2" fill="#2563EB" stroke="#FFFFFF" />
            <path d="M 14.5 4.8 L 14.5 11.2 L 8 14.5" fill="#1D4ED8" stroke="#FFFFFF" />
            <line x1="4.8" y1="3.2" x2="11.2" y2="6.5" stroke="#BFDBFE" strokeWidth="1.2" />
          </g>

          <text x="50" y="21" fill="#0F172A" fontFamily="system-ui" fontSize="11" fontWeight="800">
            10,000 Orders Ingested
          </text>
          <text x="50" y="35" fill="#0284C7" fontFamily="monospace" fontSize="8" fontWeight="700">
            studio API Webhook · 100% Pool
          </text>

          <rect x="204" y="15" width="46" height="20" rx="10" fill="#EFF6FF" stroke="#BFDBFE" strokeWidth="0.8" />
          <text x="227" y="28" textAnchor="middle" fill="#2563EB" fontFamily="monospace" fontSize="7.5" fontWeight="800">
            LIVE
          </text>
        </g>
      </g>

      {/* LEFT-TOP SATELLITE: Dispatched Solicitations */}
      <g transform="translate(10, 136)" filter="url(#faq-node-shadow)">
        <g>
          <animateTransform
            attributeName="transform"
            type="translate"
            values="0 0; 0 -5; 0 0"
            dur="4.4s"
            repeatCount="indefinite"
          />
          <rect width="188" height="66" rx="16" fill="url(#faq-node-card-bg)" stroke="#E2E8F0" strokeWidth="1.2" />

          <rect x="10" y="10" width="28" height="28" rx="8" fill="#1E293B" stroke="#2563EB" strokeWidth="1" />
          {/* Crisp Vector Mail Icon */}
          <g transform="translate(16, 17)" stroke="#FFFFFF" strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <rect x="1" y="2" width="14" height="10" rx="2" fill="#2563EB" stroke="#FFFFFF" />
            <path d="M 1 3.5 L 8 8.5 L 15 3.5" />
          </g>

          <text x="46" y="23" fill="#0F172A" fontFamily="system-ui" fontSize="10.5" fontWeight="800">
            9,980 Dispatched
          </text>
          <text x="46" y="36" fill="#64748B" fontFamily="system-ui" fontSize="8">
            5-30D Window Filter
          </text>

          <rect x="10" y="45" width="168" height="15" rx="4" fill="#EFF6FF" stroke="#BFDBFE" strokeWidth="0.6" />
          <text x="94" y="55.5" textAnchor="middle" fill="#1D4ED8" fontFamily="monospace" fontSize="7.5" fontWeight="800">
            99.8% SENT TO BUYERS
          </text>
        </g>
      </g>

      {/* RIGHT-TOP SATELLITE: Open Rate Peak */}
      <g transform="translate(342, 126)" filter="url(#faq-node-shadow)">
        <g>
          <animateTransform
            attributeName="transform"
            type="translate"
            values="0 0; 0 -4.5; 0 0"
            dur="4.2s"
            repeatCount="indefinite"
          />
          <rect width="188" height="70" rx="16" fill="url(#faq-node-card-bg)" stroke="#E2E8F0" strokeWidth="1.2" />

          <rect x="10" y="10" width="28" height="28" rx="8" fill="#0F172A" stroke="#0284C7" strokeWidth="1" />
          {/* Crisp Vector Flash Icon in Theme Sky Blue */}
          <g transform="translate(16, 15)" stroke="#FFFFFF" strokeWidth="1.3" fill="#38BDF8" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="9,1 3,9 8,9 7,15 13,7 8,7" />
          </g>

          <text x="46" y="24" fill="#0F172A" fontFamily="system-ui" fontSize="11" fontWeight="800">
            42.1% Open Rate
          </text>
          <text x="46" y="37" fill="#0284C7" fontFamily="system-ui" fontSize="8">
            18:30 Buyer Local Peak
          </text>

          <rect x="10" y="47" width="168" height="15" rx="4" fill="#F0F9FF" stroke="#BAE6FD" strokeWidth="0.6" />
          <text x="94" y="57.5" textAnchor="middle" fill="#0284C7" fontFamily="monospace" fontSize="7.5" fontWeight="800">
            4,210 REQUESTS READ
          </text>
        </g>
      </g>

      {/* LEFT-BOTTOM SATELLITE: 5-Star Custom orders Lift & Velocity */}
      <g transform="translate(10, 290)" filter="url(#faq-node-shadow)">
        <g>
          <animateTransform
            attributeName="transform"
            type="translate"
            values="0 0; 0 -4; 0 0"
            dur="4s"
            repeatCount="indefinite"
          />
          <rect width="215" height="118" rx="18" fill="url(#faq-node-card-bg)" stroke="#E2E8F0" strokeWidth="1.2" />

          <g transform="translate(12, 12)">
            {/* Crisp Vector Star Badge */}
            <rect x="0" y="0" width="26" height="26" rx="7" fill="#1E293B" stroke="#2563EB" strokeWidth="1" />
            <polygon points="13,5 15.5,9.8 20.8,10.5 16.9,14.2 17.9,19.5 13,16.8 8.1,19.5 9.1,14.2 5.2,10.5 10.5,9.8" fill="#38BDF8" />

            <text x="34" y="12" fill="#0F172A" fontFamily="system-ui" fontSize="11" fontWeight="800">
              5-Star Review Lift
            </text>
            <text x="34" y="24" fill="#64748B" fontFamily="system-ui" fontSize="8">
              Organic Verified
            </text>

            {/* Stat Row with Generous Spacing */}
            <text x="0" y="52" fill="#0F172A" fontFamily="monospace" fontSize="19" fontWeight="900">
              +1,420
            </text>

            {/* Separate Velocity Pill Badge */}
            <g transform="translate(78, 38)">
              <rect width="112" height="18" rx="9" fill="#EFF6FF" stroke="#BFDBFE" strokeWidth="0.8" />
              <text x="56" y="12.5" textAnchor="middle" fill="#1D4ED8" fontFamily="monospace" fontSize="7.5" fontWeight="800">
                ▲ +38% VELOCITY
              </text>
            </g>

            {/* Sparkline curve strictly positioned BELOW text in Theme Blue Gradient */}
            <g transform="translate(0, 10)">
              {/* Soft area glow under sparkline */}
              <path
                d="M 0 82 Q 45 80, 90 70 T 170 56 L 170 88 L 0 88 Z"
                fill="url(#faq-sparkline-blue)"
                opacity="0.12"
              />
              <path
                d="M 0 82 Q 45 80, 90 70 T 170 56"
                fill="none"
                stroke="url(#faq-sparkline-blue)"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <circle cx="170" cy="56" r="3.5" fill="#2563EB" stroke="#FFFFFF" strokeWidth="1" />
            </g>
          </g>
        </g>
      </g>

      {/* RIGHT-BOTTOM SATELLITE: Buy Box Dominance & A9 Rank */}
      <g transform="translate(322, 290)" filter="url(#faq-node-shadow)">
        <g>
          <animateTransform
            attributeName="transform"
            type="translate"
            values="0 0; 0 -4.6; 0 0"
            dur="4.6s"
            repeatCount="indefinite"
          />
          <rect width="208" height="118" rx="18" fill="url(#faq-node-card-bg)" stroke="#E2E8F0" strokeWidth="1.2" />

          <g transform="translate(12, 12)">
            {/* Crisp Vector Trophy Badge */}
            <rect x="0" y="0" width="26" height="26" rx="7" fill="#1E293B" stroke="#2563EB" strokeWidth="1" />
            <g transform="translate(4.5, 4.5)" stroke="#FFFFFF" strokeWidth="1.3" fill="none" strokeLinecap="round" strokeLinejoin="round">
              <path d="M 4 2 L 13 2 L 13 7.5 C 13 10 10.5 11.5 8.5 11.5 C 6.5 11.5 4 10 4 7.5 Z" fill="#38BDF8" stroke="#FFFFFF" />
              <path d="M 4 4.5 L 2 4.5 C 1 4.5 1 7.5 3 7.5 L 4 7.5" />
              <path d="M 13 4.5 L 15 4.5 C 16 4.5 16 7.5 14 7.5 L 13 7.5" />
              <line x1="8.5" y1="11.5" x2="8.5" y2="14.5" />
              <line x1="5.5" y1="14.5" x2="11.5" y2="14.5" />
            </g>

            <text x="34" y="12" fill="#0F172A" fontFamily="system-ui" fontSize="11" fontWeight="800">
              Buy Box Win Rate
            </text>
            <text x="34" y="24" fill="#64748B" fontFamily="system-ui" fontSize="8">
              A9 Search Rank #1
            </text>

            <text x="0" y="52" fill="#0F172A" fontFamily="monospace" fontSize="19" fontWeight="900">
              99.4%
            </text>

            {/* Rank Lift Tag */}
            <g transform="translate(72, 38)">
              <rect width="112" height="18" rx="9" fill="#EFF6FF" stroke="#BFDBFE" strokeWidth="0.8" />
              <text x="56" y="12.5" textAnchor="middle" fill="#1D4ED8" fontFamily="monospace" fontSize="7.5" fontWeight="800">
                +14 POSITIONS #1
              </text>
            </g>

            <rect x="0" y="72" width="184" height="20" rx="6" fill="#0F172A" stroke="#2563EB" strokeWidth="0.8" />
            <text x="92" y="85" textAnchor="middle" fill="#93C5FD" fontFamily="monospace" fontSize="8" fontWeight="800">
              CATEGORY #1 BEST SELLER
            </text>
          </g>
        </g>
      </g>

      {/* Floating Theme Particles (Pure Blue & Cyan only) */}
      <g transform="translate(105, 80)">
        <circle cx="0" cy="0" r="3" fill="#2563EB">
          <animate attributeName="opacity" values="0.3;1;0.3" dur="2s" repeatCount="indefinite" />
        </circle>
        <polygon points="6,0 7.2,3 10.5,3.2 8,5.2 8.7,8.5 6,6.8 3.3,8.5 4,5.2 1.5,3.2 4.8,3" fill="#38BDF8" />
      </g>

      <g transform="translate(440, 80)">
        <circle cx="0" cy="0" r="3" fill="#0284C7">
          <animate attributeName="opacity" values="1;0.2;1" dur="2.2s" repeatCount="indefinite" />
        </circle>
        <polygon points="6,0 7.2,3 10.5,3.2 8,5.2 8.7,8.5 6,6.8 3.3,8.5 4,5.2 1.5,3.2 4.8,3" fill="#38BDF8" />
      </g>

      {/* Bottom Floating Status Pill */}
      <g transform="translate(270, 470)">
        <rect x="-105" y="-13" width="210" height="26" rx="13" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1" filter="url(#faq-node-shadow)" />
        <circle cx="-88" cy="0" r="3" fill="#2563EB">
          <animate attributeName="opacity" values="1;0.2;1" dur="1.4s" repeatCount="indefinite" />
        </circle>
        {/* Crisp inline SVG bolt icon in Theme Royal Blue */}
        <g transform="translate(-76, -7)" fill="#2563EB">
          <polygon points="7,0 2,8 6,8 5,14 11,6 7,6" />
        </g>
        <text x="9" y="3.5" textAnchor="middle" fill="#0F172A" fontFamily="system-ui" fontSize="8.5" fontWeight="800">
          Continuous ROI Tracking
        </text>
      </g>
    </svg>
  );
}


