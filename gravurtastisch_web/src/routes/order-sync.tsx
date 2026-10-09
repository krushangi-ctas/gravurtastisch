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
  RefreshCw,
  Clock,
  CheckCircle2,
  Filter,
  ShieldAlert,
  Globe2,
  Package,
  Truck,
  Send,
  HelpCircle,
  ArrowRight,
  Sparkles,
  Layers,
  ShoppingBag,
  Headphones
} from "lucide-react";
import i18n from "@/i18n/config";
import { ServicePageSkeleton } from "@/components/skeletons/ServicePageSkeleton";

export const Route = createFileRoute("/order-sync")({
  pendingComponent: ServicePageSkeleton,
  head: () => ({
    meta: [
      { title: "Real-Time Amazon Order Sync Engine | Gravurtastisch" },
      {
        name: "description",
        content:
          "Automated real-time Amazon order synchronization for Retail & wholesale sellers. Filter cancellations, manage multi-marketplace orders, and prepare solicitations seamlessly.",
      },
      { property: "og:title", content: "Amazon Order Sync Engine | Gravurtastisch" },
      {
        property: "og:description",
        content:
          "Instant two-way order ingestion from Amazon order desk across 12+ marketplaces with automated return & refund guardrails.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/order-sync" },
    ],
    links: [{ rel: "canonical", href: "/order-sync" }],
  }),
  component: OrderSyncPage,
});

function OrderSyncPage() {
  const { t } = useTranslation();
  const isSkeletonPreview = typeof window !== "undefined" && window.location.search.includes("skeleton=true");

  if (isSkeletonPreview) {
    return <ServicePageSkeleton />;
  }


  const orderLifecycleSteps = [
    {
      step: "01",
      title: t('orderSync.step1Title') || "Order Placed & Fulfilled",
      desc: t('orderSync.step1Desc') || "Marketplace or your merchant warehouse picks, packs, and ships the order. Order status moves to Shipped in order desk.",
      icon: ShoppingBag,
    },
    {
      step: "02",
      title: t('orderSync.step2Title') || "Delivery Event Ingestion",
      desc: t('orderSync.step2Desc') || "Gravurtastisch's studio API listener captures the exact carrier delivery timestamp (Amazon Logistics, UPS, FedEx, DHL).",
      icon: Truck,
    },
    {
      step: "03",
      title: t('orderSync.step3Title') || "Eligibility & Refund Audit",
      desc: t('orderSync.step3Desc') || "Our engine verifies order qualification: checks for return flags, cancellation requests, and ensures no duplicate requests.",
      icon: CheckCircle2,
    },
    {
      step: "04",
      title: t('orderSync.step4Title') || "Scheduled for Solicitation",
      desc: t('orderSync.step4Desc') || "Order is automatically queued for review dispatch at the optimal time window inside Amazon's 5-30 day rule.",
      icon: Send,
    },
  ];

  const liveMockOrders = [
    {
      id: "114-8923019-3928101",
      market: "🇺🇸 Amazon US",
      sku: "CT-HYDR-BTL-32",
      channel: "FBA",
      delivery: "Delivered 2h ago",
      status: "Synced & Queued",
      statusColor: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
    },
    {
      id: "402-9918231-1029384",
      market: "🇬🇧 Amazon UK",
      sku: "CT-LEATH-WLLT-BRN",
      channel: "FBA",
      delivery: "Delivered 1d ago",
      status: "Scheduled (Day 5)",
      statusColor: "bg-brand/15 text-brand border-brand/30",
    },
    {
      id: "028-4491023-8829103",
      market: "🇩🇪 Amazon DE",
      sku: "CT-MAT-YOGA-BLK",
      channel: "FBM",
      delivery: "Delivered 4d ago",
      status: "Ready to Dispatch",
      statusColor: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
    },
    {
      id: "701-1928374-5561029",
      market: "🇮🇳 Amazon IN",
      sku: "CT-CUP-CERAMIC-SET",
      channel: "FBA",
      delivery: "Cancelled by Buyer",
      status: "Suppressed (Safety Rule)",
      statusColor: "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30",
    },
  ];

  const faqs = [
    {
      q: "How often does Gravurtastisch sync orders from Amazon?",
      a: "Gravurtastisch uses real-time studio API order webhooks and high-frequency polling every 5 minutes to ensure your order queue is always up to date.",
    },
    {
      q: "Does order sync support both FBA and FBM (Merchant Fulfilled)?",
      a: "Yes! Gravurtastisch tracks both Fulfillment by Amazon (FBA) and Merchant Fulfilled Network (MFN/FBM) orders, automatically detecting carrier delivery confirmations for both channels.",
    },
    {
      q: "What happens if a buyer requests a return after order delivery?",
      a: "Our sync engine continuously monitors return and refund events. If a return is initiated, Gravurtastisch automatically suppresses and cancels any pending review solicitation for that order.",
    },
    {
      q: "Can I selectively exclude certain SKUs from being synced or messaged?",
      a: "Yes. You can configure custom SKU inclusion and exclusion rules. Products you exclude will never receive automated production jobs.",
    },
  ];

  return (
    <div className="min-h-screen bg-background text-navy-deep overflow-x-hidden w-full max-w-full">
      <Nav />

      <main className="pb-8 w-full max-w-full overflow-x-hidden">
        {/* Hero Section */}
        <section className="relative overflow-hidden pt-24 pb-8 lg:pt-28 lg:pb-10 bg-gradient-to-b from-navy-deep via-navy to-navy-soft text-white w-full max-w-full">
          <div className="absolute inset-0 grid-bg opacity-40 pointer-events-none" />
          <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-brand/20 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-sky-500/15 blur-3xl pointer-events-none" />

          <Container className="relative">
            <div className="grid lg:grid-cols-12 gap-10 lg:gap-12 items-center">
              {/* Left Column: Hero Copy & CTA */}
              <Reveal className="lg:col-span-6 xl:col-span-6">
                <div className="inline-flex items-center gap-2 rounded-full bg-brand/20 border border-brand/40 px-3.5 py-1 text-xs font-semibold text-brand-bright mb-4">
                  <Sparkles className="h-3.5 w-3.5" />
                  {t('orderSync.heroBadge') || "Continuous Two-Way Order Ingestion"}
                </div>
                <h1 className="text-4xl sm:text-5xl lg:text-[3.25rem] font-extrabold tracking-tight leading-[1.1]">
                  {t('orderSync.heroTitle') || "Real-Time"} <span className="text-brand-bright">{t('orderSync.heroTitleHighlight') || "Amazon Order Sync"}</span> Engine
                </h1>
                <p className="mt-4 text-white/70 text-base sm:text-lg leading-relaxed max-w-xl">
                  {t('orderSync.heroDesc') || "Delivered orders flow automatically into Gravurtastisch across all 12+ Amazon marketplaces. Track every package from delivery to review dispatch without spreadsheets."}
                </p>
                <div className="mt-6 flex flex-wrap gap-4">
                  <a
                    href="/#register"
                    className="inline-flex items-center gap-2 rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-brand/30 hover:bg-brand-bright hover:-translate-y-0.5 transition-all"
                  >
                    {t('orderSync.heroCtaRegister') || "Start Syncing Orders"}
                    <ArrowRight className="h-4 w-4" />
                  </a>
                  <a
                    href="#lifecycle"
                    className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/20 px-6 py-3 text-sm font-semibold text-white hover:bg-white/20 transition-all"
                  >
                    {t('orderSync.heroCtaExplore') || "View Order Pipeline"}
                  </a>
                </div>
              </Reveal>

              {/* Right Column: Dynamic Real-Time Order Sync Engine Vector Illustration */}
              <Reveal className="lg:col-span-6 xl:col-span-6 relative" delay={120}>
                <div className="relative max-w-lg mx-auto lg:max-w-none">
                  {/* Subtle Neon Aura Glow Backdrop */}
                  <div className="absolute -inset-2 bg-gradient-to-r from-brand/20 via-sky-400/15 to-emerald-500/15 rounded-3xl blur-2xl opacity-60 pointer-events-none" />

                  {/* Clean SVG Vector Illustration Container */}
                  <div className="relative flex items-center justify-center select-none">
                    <OrderSyncHeroSvg />
                  </div>
                </div>
              </Reveal>
            </div>

            {/* Connected Live Logistics Telemetry Pipeline Stream */}
            <Reveal delay={180}>
              <div className="mt-8 sm:mt-10 rounded-2xl bg-white/[0.05] border border-white/15 backdrop-blur-xl p-3 sm:p-4 shadow-2xl shadow-black/40">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 divide-y md:divide-y-0 md:divide-x divide-white/10">
                  {/* Pipeline Station 1: Latency */}
                  <div className="flex items-center gap-3.5 p-2.5 sm:p-2 lg:p-3">
                    <div className="relative shrink-0">
                      <div className="h-10 w-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 grid place-items-center">
                        <Clock className="h-5 w-5" />
                      </div>
                      <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-emerald-400 animate-ping opacity-75" />
                      <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-emerald-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xl sm:text-2xl font-black text-white font-mono tracking-tight">&lt; 5 mins</span>
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          LIVE STREAM
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-white/80">{t('orderSync.statLatencyTitle') || "Real-Time Ingestion"}</p>
                      <p className="text-[10px] text-white/50">{t('orderSync.statLatencySub') || "High-frequency studio API webhooks"}</p>
                    </div>
                  </div>

                  {/* Pipeline Station 2: Global Regions */}
                  <div className="flex items-center gap-3.5 p-2.5 sm:p-2 lg:p-3 pt-3 md:pt-2">
                    <div className="h-10 w-10 rounded-xl bg-brand/20 border border-brand/40 text-brand-bright grid place-items-center shrink-0">
                      <Globe2 className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xl sm:text-2xl font-black text-white font-mono tracking-tight">12+ Regions</span>
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-brand/20 text-brand-bright border border-brand/40">
                          GLOBAL
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-white/80">{t('orderSync.statMarketplacesTitle') || "Active Marketplaces"}</p>
                      <div className="flex items-center gap-1 text-xs mt-0.5">
                        <span>🇺🇸</span>
                        <span>🇬🇧</span>
                        <span>🇩🇪</span>
                        <span>🇯🇵</span>
                        <span>🇮🇳</span>
                        <span className="text-[10px] text-white/50">+7 more</span>
                      </div>
                    </div>
                  </div>

                  {/* Pipeline Station 3: Order Accuracy & Guardrail */}
                  <div className="flex items-center gap-3.5 p-2.5 sm:p-2 lg:p-3 pt-3 md:pt-2">
                    <div className="h-10 w-10 rounded-xl bg-sky-500/20 border border-sky-500/40 text-sky-300 grid place-items-center shrink-0">
                      <CheckCircle2 className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xl sm:text-2xl font-black text-white font-mono tracking-tight">99.99%</span>
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30">
                          ZERO DUPES
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-white/80">{t('orderSync.statAccuracyTitle') || "Order Sync Accuracy"}</p>
                      <p className="text-[10px] text-white/50">{t('orderSync.statAccuracySub') || "Auto-filters returns & cancellations"}</p>
                    </div>
                  </div>

                  {/* Pipeline Station 4: Fulfillment Modes */}
                  <div className="flex items-center gap-3.5 p-2.5 sm:p-2 lg:p-3 pt-3 md:pt-2">
                    <div className="h-10 w-10 rounded-xl bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 grid place-items-center shrink-0">
                      <Package className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xl sm:text-2xl font-black text-white font-mono tracking-tight">FBA &amp; FBM</span>
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                          ALL CARRIERS
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-white/80">{t('orderSync.statFulfillmentTitle') || "Dual Fulfillment Support"}</p>
                      <p className="text-[10px] text-white/50">{t('orderSync.statFulfillmentSub') || "Prime & Merchant tracking"}</p>
                    </div>
                  </div>
                </div>
              </div>
            </Reveal>
          </Container>
        </section>

        {/* Automation Capabilities Bento Showcase */}
        <section className="py-10 lg:py-14 bg-surface border-b border-border">
          <Container>
            <Reveal>
              <div className="max-w-2xl mb-8">
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-brand">
                  {t('orderSync.bentoSectionBadge') || "Automation Capabilities"}
                </span>
                <h2 className="mt-3 text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-navy-deep leading-tight">
                  {t('orderSync.bentoSectionHeading') || "Engineered to Protect Your Seller Account"}
                </h2>
                <p className="mt-2 text-slate-body text-sm sm:text-base leading-relaxed">
                  {t('orderSync.bentoSectionDesc') || "Gravurtastisch's sync engine doesn't just pull order numbers - it actively inspects return statuses, buyer cancellation flags, and delivery confirmations to ensure zero unwanted solicitations."}
                </p>
              </div>
            </Reveal>

            {/* Asymmetrical Bento Architecture Grid */}
            <div className="grid lg:grid-cols-12 gap-5 items-stretch">
              {/* Left Column (Hero Bento Card): Continuous 5-Minute Ingestion Console */}
              <Reveal className="lg:col-span-5 flex" delay={50}>
                <div className="w-full rounded-3xl bg-gradient-to-b from-navy-deep to-slate-900 text-white p-6 sm:p-7 flex flex-col justify-between border border-white/10 shadow-xl relative overflow-hidden group">
                  {/* Subtle Background Accent Glow */}
                  <div className="absolute top-0 right-0 w-64 h-64 bg-brand/20 rounded-full blur-3xl pointer-events-none group-hover:bg-brand/30 transition-all" />

                  <div>
                    <div className="flex items-center justify-between gap-3 mb-5">
                      <div className="h-11 w-11 rounded-2xl bg-brand/20 border border-brand/40 text-brand-bright grid place-items-center shadow-inner">
                        <RefreshCw className="h-5 w-5 animate-[spin_6s_linear_infinite]" />
                      </div>
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                        <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                        {t('orderSync.bentoCard1Badge') || "Continuous Ingestion"}
                      </span>
                    </div>

                    <h3 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight leading-snug">
                      {t('orderSync.bentoCard1Title') || "Continuous 5-Minute Order Stream"}
                    </h3>
                    <p className="mt-2 text-xs sm:text-sm text-white/70 leading-relaxed">
                      {t('orderSync.bentoCard1Desc') || "Orders automatically stream into your Gravurtastisch queue within minutes of being updated in order desk. No manual CSV uploads or babysitting required."}
                    </p>

                    {/* Interactive Live Stream Visualizer */}
                    <div className="mt-5 rounded-2xl bg-white/[0.05] border border-white/10 p-3.5 backdrop-blur-md space-y-2">
                      <div className="flex items-center justify-between text-xs text-white/60 font-mono">
                        <span>LIVE studio API STREAM</span>
                        <span className="text-brand-bright font-bold">POLLING: 5m</span>
                      </div>

                      {/* Mini Live Stream Chips */}
                      <div className="flex items-center justify-between p-2 rounded-xl bg-white/[0.04] border border-white/5 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-sky-400" />
                          <span className="font-mono text-white/90">#114-8923019</span>
                        </div>
                        <span className="text-[11px] font-semibold text-emerald-400">Ingested (FBA)</span>
                      </div>

                      <div className="flex items-center justify-between p-2 rounded-xl bg-white/[0.04] border border-white/5 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-indigo-400" />
                          <span className="font-mono text-white/90">#402-9918231</span>
                        </div>
                        <span className="text-[11px] font-semibold text-sky-400">Verified (Delivered)</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-white/60">
                    <span>Latency: &lt; 1.8s Response</span>
                    <span className="text-brand-bright font-semibold">100% Automated Flow →</span>
                  </div>
                </div>
              </Reveal>

              {/* Right Column (Stacked Capability Rows): 3 Distinct Modular Strips */}
              <div className="lg:col-span-7 flex flex-col justify-between gap-3.5">
                {/* Capability 1: Return & Refund Guardrails */}
                <Reveal delay={100}>
                  <div className="group rounded-2xl bg-white border border-border p-5 sm:p-6 shadow-sm hover:border-rose-300 hover:shadow-md transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-3.5">
                      <div className="h-11 w-11 rounded-2xl bg-rose-50 text-rose-600 border border-rose-100 grid place-items-center shrink-0 group-hover:bg-rose-600 group-hover:text-white transition-colors">
                        <ShieldAlert className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h3 className="text-base font-bold text-navy-deep">{t('orderSync.bentoCap1Title') || "Return & Refund Guardrails"}</h3>
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            {t('orderSync.bentoCap1Tag') || "Auto-Suppression"}
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm text-slate-body leading-relaxed">
                          {t('orderSync.bentoCap1Desc') || "If a customer initiates a return or cancellation, Gravurtastisch immediately cancels the production job to prevent soliciting dissatisfied buyers."}
                        </p>
                      </div>
                    </div>
                    <div className="shrink-0 flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                      <span className="text-[11px] font-bold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-lg">
                        0 Bad Custom orders
                      </span>
                    </div>
                  </div>
                </Reveal>

                {/* Capability 2: Granular SKU & ASIN Filtering */}
                <Reveal delay={150}>
                  <div className="group rounded-2xl bg-white border border-border p-5 sm:p-6 shadow-sm hover:border-indigo-300 hover:shadow-md transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-3.5">
                      <div className="h-11 w-11 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100 grid place-items-center shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                        <Filter className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h3 className="text-base font-bold text-navy-deep">{t('orderSync.bentoCap2Title') || "Granular SKU & ASIN Filtering"}</h3>
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                            {t('orderSync.bentoCap2Tag') || "Catalog Control"}
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm text-slate-body leading-relaxed">
                          {t('orderSync.bentoCap2Desc') || "Exclude specific items, bundles, or low-margin SKUs from review solicitations with easy toggle rules per marketplace."}
                        </p>
                      </div>
                    </div>
                    <div className="shrink-0 flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                      <span className="text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg">
                        Rule Toggles
                      </span>
                    </div>
                  </div>
                </Reveal>

                {/* Capability 3: 12+ Global Marketplaces */}
                <Reveal delay={200}>
                  <div className="group rounded-2xl bg-white border border-border p-5 sm:p-6 shadow-sm hover:border-emerald-300 hover:shadow-md transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-3.5">
                      <div className="h-11 w-11 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 grid place-items-center shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                        <Globe2 className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h3 className="text-base font-bold text-navy-deep">{t('orderSync.bentoCap3Title') || "12+ Global Marketplaces"}</h3>
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {t('orderSync.bentoCap3Tag') || "Multi-Market"}
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm text-slate-body leading-relaxed">
                          {t('orderSync.bentoCap3Desc') || "Sync orders simultaneously across North America (US, CA, MX), Europe (UK, DE, FR, IT, ES), Far East (JP, AU), and India (IN)."}
                        </p>
                      </div>
                    </div>
                    <div className="shrink-0 flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                      <div className="flex items-center gap-1 text-sm">
                        <span>🇺🇸</span>
                        <span>🇬🇧</span>
                        <span>🇩🇪</span>
                        <span>🇯🇵</span>
                        <span>🇮🇳</span>
                      </div>
                    </div>
                  </div>
                </Reveal>
              </div>
            </div>
          </Container>
        </section>

        {/* Order Lifecycle Flow */}
        <section id="lifecycle" className="py-10 lg:py-14 bg-white">
          <Container>
            <Reveal>
              <div className="text-center max-w-3xl mx-auto mb-8">
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-brand">
                  {t('orderSync.pipelineBadge') || "Step-by-Step Flow"}
                </span>
                <h2 className="mt-3 text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-navy-deep leading-tight">
                  {t('orderSync.pipelineHeading') || "The End-to-End Order Sync Journey"}
                </h2>
                <p className="mt-2 text-slate-body text-sm sm:text-base">
                  {t('orderSync.pipelineDesc') || "See how an order transitions from checkout to automated production job."}
                </p>
              </div>
            </Reveal>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 relative">
              {orderLifecycleSteps.map((step, idx) => {
                const Icon = step.icon;
                return (
                  <Reveal key={step.step} delay={idx * 70}>
                    <div className="relative rounded-2xl bg-surface border border-border p-5 sm:p-6 h-full flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <span className="font-mono text-2xl font-bold text-brand/30">{step.step}</span>
                          <div className="h-9 w-9 rounded-lg bg-brand/10 text-brand grid place-items-center">
                            <Icon className="h-4 w-4" />
                          </div>
                        </div>
                        <h3 className="text-base font-bold text-navy-deep mb-1.5">{step.title}</h3>
                        <p className="text-xs sm:text-sm text-slate-body leading-relaxed">{step.desc}</p>
                      </div>
                    </div>
                  </Reveal>
                );
              })}
            </div>
          </Container>
        </section>

        {/* Live Mock Order Feed Preview */}
        <section className="py-10 lg:py-14 bg-surface-alt border-y border-border">
          <Container>
            <div className="grid lg:grid-cols-12 gap-8 lg:gap-10 items-center">
              <Reveal className="lg:col-span-5 min-w-0">
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-brand">
                  {t('orderSync.tableBadge') || "Live Feed Preview"}
                </span>
                <h2 className="mt-3 text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-navy-deep leading-tight">
                  {t('orderSync.tableHeading') || "Transparent Visibility on Every Package"}
                </h2>
                <p className="mt-3 text-slate-body text-sm sm:text-base leading-relaxed">
                  {t('orderSync.tableDesc') || "Inside your Gravurtastisch dashboard, you get complete visibility of incoming orders, carrier delivery times, eligibility status, and scheduled review dispatches."}
                </p>
                <ul className="mt-4 space-y-2.5 text-xs sm:text-sm text-slate-body">
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>{t('orderSync.tableBullet1') || "Automatic marketplace conversion & time-zone alignment"}</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>{t('orderSync.tableBullet2') || "Instant suppression of cancelled or returned orders"}</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>{t('orderSync.tableBullet3') || "Manual single-click send override for VIP buyers"}</span>
                  </li>
                </ul>
              </Reveal>

              <Reveal className="lg:col-span-7 min-w-0" delay={100}>
                <div className="rounded-3xl bg-navy-deep text-white p-4 sm:p-6 lg:p-7 shadow-xl border border-white/10 overflow-hidden">
                  <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-3 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="font-semibold text-white/90">LIVE ORDER SYNC FEED</span>
                    </div>
                    <span className="font-mono text-white/45">AUTO-REFRESH: 5m</span>
                  </div>

                  <div className="overflow-x-auto min-w-0 w-full">
                    <table className="w-full text-left text-xs min-w-[580px]">
                      <thead>
                        <tr className="text-white/40 uppercase font-mono tracking-wider border-b border-white/10">
                          <th className="py-2.5 px-3 whitespace-nowrap">{t('orderSync.tableColOrderId') || "Order ID"}</th>
                          <th className="py-2.5 px-3 whitespace-nowrap">{t('orderSync.tableColMarketplace') || "Marketplace"}</th>
                          <th className="py-2.5 px-3 whitespace-nowrap">{t('orderSync.tableColSku') || "SKU / Delivery"}</th>
                          <th className="py-2.5 px-3 text-right whitespace-nowrap">{t('orderSync.tableColStatus') || "Status"}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/10">
                        {liveMockOrders.map((ord) => (
                          <tr key={ord.id} className="hover:bg-white/[0.03] transition-colors">
                            <td className="py-3 px-3 font-mono text-white/90 whitespace-nowrap">{ord.id}</td>
                            <td className="py-3 px-3 text-white/70 whitespace-nowrap">{ord.market}</td>
                            <td className="py-3 px-3 whitespace-nowrap">
                              <p className="font-medium text-white/80">{ord.sku}</p>
                              <p className="text-[11px] text-white/50">{ord.delivery}</p>
                            </td>
                            <td className="py-3 px-3 text-right whitespace-nowrap">
                              <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-semibold border ${ord.statusColor}`}>
                                {ord.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </Reveal>
            </div>
          </Container>
        </section>

        {/* FAQ Section (2-Column: Left SVG, Right FAQs) */}
        <section className="py-10 lg:py-14 bg-white border-b border-border">
          <Container>
            <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-center">
              {/* Left Column: Order Sync FAQ & Logistics Assistant Vector Illustration */}
              <Reveal className="lg:col-span-5 xl:col-span-5">
                <div className="space-y-4">
                  {/* Clean Vector Graphic (Transparent canvas, no card border/shadow) */}
                  <div className="relative flex items-center justify-center">
                    <OrderSyncFaqSvg />
                  </div>

                  <div className="rounded-2xl bg-surface border border-border p-4 flex items-center justify-between gap-4 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-xl bg-brand/10 text-brand grid place-items-center shrink-0">
                        <Headphones className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-navy-deep">{t('orderSync.faqSupportTitle') || "Have custom sync questions?"}</p>
                        <p className="text-[10.5px] text-slate-body">{t('orderSync.faqSupportDesc') || "Our team assists with order desk order pipelines."}</p>
                      </div>
                    </div>
                    <a
                      href="/#contact"
                      className="inline-flex items-center gap-1 text-xs font-bold text-brand hover:text-brand-bright transition-colors shrink-0"
                    >
                      {t('orderSync.faqSupportLink') || "Talk to us →"}
                    </a>
                  </div>
                </div>
              </Reveal>

              {/* Right Column: FAQs List */}
              <div className="lg:col-span-7 xl:col-span-7">
                <Reveal>
                  <div className="mb-6">
                    <span className="text-xs font-bold uppercase tracking-[0.2em] text-brand">
                      {t('orderSync.faqBadge') || "Order Sync FAQs"}
                    </span>
                    <h2 className="mt-3 text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-navy-deep leading-tight">
                      {t('orderSync.faqHeading') || "Frequently Asked Questions"}
                    </h2>
                    <p className="mt-2 text-sm text-slate-body leading-relaxed">
                      {t('orderSync.faqDesc') || "Everything you need to know about real-time Amazon order tracking, FBA delivery detection, and return safety guardrails."}
                    </p>
                  </div>
                </Reveal>

                <Accordion type="single" collapsible className="w-full space-y-3.5">
                  {faqs.map((faq, idx) => (
                    <Reveal key={faq.q} delay={idx * 50}>
                      <AccordionItem
                        value={`faq-${idx}`}
                        className="rounded-2xl border border-border bg-surface px-5 sm:px-6 transition-all hover:border-brand/30 border-b-0"
                      >
                        <AccordionTrigger className="text-left hover:no-underline font-bold text-navy-deep text-sm sm:text-base py-4 sm:py-5 flex gap-3">
                          <span className="flex items-center gap-3">
                            <HelpCircle className="h-5 w-5 text-brand shrink-0" />
                            <span>{faq.q}</span>
                          </span>
                        </AccordionTrigger>
                        <AccordionContent className="text-xs sm:text-sm text-slate-body leading-relaxed pb-5 pl-8">
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
                {t('orderSync.ctaHeading') || "Put Your Amazon Order Sync on Autopilot"}
              </h2>
              <p className="mt-3 text-white/75 text-sm sm:text-base max-w-xl mx-auto">
                {t('orderSync.ctaDesc') || "No CSVs, no missed review opportunities, and no risk of messaging returned orders."}
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-4">
                <a
                  href="/#register"
                  className="inline-flex items-center gap-2 rounded-full bg-brand-bright px-7 py-3.5 text-sm font-bold text-navy-deep hover:bg-white transition-all shadow-lg hover:-translate-y-0.5"
                >
                  {t('orderSync.ctaButton') || "Register as Seller"}
                  <ArrowRight className="h-4 w-4" />
                </a>
                <a
                  href="/#how"
                  className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/20 px-7 py-3.5 text-sm font-semibold text-white hover:bg-white/20 transition-all"
                >
                  {t('orderSync.ctaHow') || "How Gravurtastisch Works"}
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

function OrderSyncHeroSvg() {
  return (
    <svg
      viewBox="0 0 600 430"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-auto select-none"
      role="img"
      aria-label="Real-Time Amazon Order Sync Pipeline, Carrier Tracking & Review Solicitation Engine"
    >
      <defs>
        {/* Soft Ambient Radial Lights */}
        <radialGradient id="sync-glow-blue" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.25" />
          <stop offset="60%" stopColor="#2563EB" stopOpacity="0.08" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="sync-glow-green" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#34D399" stopOpacity="0.28" />
          <stop offset="70%" stopColor="#10B981" stopOpacity="0.06" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="sync-glow-amber" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FBBF24" stopOpacity="0.22" />
          <stop offset="70%" stopColor="#F59E0B" stopOpacity="0.05" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </radialGradient>

        {/* Premium Drop Shadows */}
        <filter id="sync-card-shadow-elevated" x="-20%" y="-15%" width="140%" height="135%">
          <feDropShadow dx="0" dy="16" stdDeviation="18" floodColor="#020617" floodOpacity="0.38" />
          <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#020617" floodOpacity="0.18" />
        </filter>
        <filter id="sync-card-shadow-regular" x="-15%" y="-15%" width="130%" height="130%">
          <feDropShadow dx="0" dy="10" stdDeviation="14" floodColor="#020617" floodOpacity="0.30" />
        </filter>
        <filter id="sync-pill-shadow" x="-15%" y="-20%" width="130%" height="140%">
          <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#020617" floodOpacity="0.25" />
        </filter>

        {/* 3D Kraft Amazon Parcel Box Gradients */}
        <linearGradient id="kraft-top" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FDE68A" />
          <stop offset="100%" stopColor="#F59E0B" />
        </linearGradient>
        <linearGradient id="kraft-left" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#D97706" />
          <stop offset="100%" stopColor="#92400E" />
        </linearGradient>
        <linearGradient id="kraft-right" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#B45309" />
        </linearGradient>

        {/* Prime Blue Tape Texture */}
        <linearGradient id="prime-tape" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#0073E6" />
          <stop offset="100%" stopColor="#0052A3" />
        </linearGradient>

        {/* Data Conduit Laser Lines */}
        <linearGradient id="laser-pipe-1" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#0284C7" />
          <stop offset="50%" stopColor="#38BDF8" />
          <stop offset="100%" stopColor="#10B981" />
        </linearGradient>
        <linearGradient id="laser-pipe-2" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#10B981" />
          <stop offset="50%" stopColor="#6366F1" />
          <stop offset="100%" stopColor="#8B5CF6" />
        </linearGradient>

        {/* Radar Scanner Sweep */}
        <linearGradient id="radar-sweep-emerald" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#10B981" stopOpacity="0.85" />
          <stop offset="70%" stopColor="#10B981" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
        </linearGradient>

        {/* Barcode Scanner Light Line */}
        <linearGradient id="barcode-laser" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#38BDF8" stopOpacity="0" />
          <stop offset="50%" stopColor="#0284C7" stopOpacity="1" />
          <stop offset="100%" stopColor="#38BDF8" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* ==================================================== */}
      {/* 0. AMBIENT BACKDROP LIGHT HALOS */}
      {/* ==================================================== */}
      <circle cx="110" cy="200" r="160" fill="url(#sync-glow-blue)" />
      <circle cx="300" cy="190" r="180" fill="url(#sync-glow-green)" />
      <circle cx="490" cy="200" r="160" fill="url(#sync-glow-amber)" />

      {/* Background Circuit Guideline Grid */}
      <g opacity="0.18">
        <path d="M 40 380 L 560 380" stroke="#94A3B8" strokeWidth="1" strokeDasharray="4 6" />
        <path d="M 110 330 L 110 380" stroke="#94A3B8" strokeWidth="1" strokeDasharray="3 4" />
        <path d="M 300 355 L 300 380" stroke="#94A3B8" strokeWidth="1" strokeDasharray="3 4" />
        <path d="M 490 330 L 490 380" stroke="#94A3B8" strokeWidth="1" strokeDasharray="3 4" />
      </g>

      {/* ==================================================== */}
      {/* 1. TOP FLOATING TELEMETRY CHIPS */}
      {/* ==================================================== */}
      {/* Top Left: Live Ingestion Webhook */}
      <g transform="translate(30, 16)" filter="url(#sync-pill-shadow)">
        <rect x="0" y="0" width="180" height="28" rx="14" fill="#FFFFFF" stroke="#BAE6FD" strokeWidth="1" />
        <circle cx="16" cy="14" r="4.5" fill="#10B981">
          <animate attributeName="opacity" values="1;0.3;1" dur="1.2s" repeatCount="indefinite" />
        </circle>
        <text x="28" y="18" fill="#0369A1" fontFamily="system-ui" fontSize="9" fontWeight="800">
          studio API ORDER STREAM
        </text>
        <rect x="132" y="4.5" width="40" height="19" rx="9.5" fill="#F0FDF4" stroke="#86EFAC" strokeWidth="0.8" />
        <text x="152" y="17.5" textAnchor="middle" fill="#15803D" fontFamily="monospace" fontSize="8" fontWeight="800">
          ⚡ 1.8s
        </text>
      </g>

      {/* Top Right: Global Marketplaces */}
      <g transform="translate(390, 16)" filter="url(#sync-pill-shadow)">
        <rect x="0" y="0" width="180" height="28" rx="14" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1" />
        <text x="14" y="18" fill="#475569" fontFamily="system-ui" fontSize="8.5" fontWeight="700">
          SYNCED:
        </text>
        <text x="60" y="19" fontSize="10">🇺🇸</text>
        <text x="82" y="19" fontSize="10">🇬🇧</text>
        <text x="104" y="19" fontSize="10">🇩🇪</text>
        <text x="126" y="19" fontSize="10">🇯🇵</text>
        <text x="148" y="19" fontSize="10">🇮🇳</text>
      </g>

      {/* ==================================================== */}
      {/* 2. HIGH-SPEED CONNECTING DATA CONDUITS & PHOTONS */}
      {/* ==================================================== */}
      {/* Pipe 1: Stage 1 -> Stage 2 */}
      <path
        d="M 195 200 C 205 200, 205 195, 215 195"
        stroke="url(#laser-pipe-1)"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <line x1="192" y1="200" x2="218" y2="195" stroke="#38BDF8" strokeWidth="2" strokeDasharray="3 3">
        <animate attributeName="stroke-dashoffset" values="0;-12" dur="0.8s" repeatCount="indefinite" />
      </line>

      {/* Pipe 2: Stage 2 -> Stage 3 */}
      <path
        d="M 385 195 C 395 195, 395 200, 405 200"
        stroke="url(#laser-pipe-2)"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <line x1="382" y1="195" x2="408" y2="200" stroke="#8B5CF6" strokeWidth="2" strokeDasharray="3 3">
        <animate attributeName="stroke-dashoffset" values="0;-12" dur="0.8s" repeatCount="indefinite" />
      </line>

      {/* ==================================================== */}
      {/* 3. STAGE 1 (LEFT): INGESTED ORDER & 3D AMAZON PARCEL */}
      {/* ==================================================== */}
      <g transform="translate(25, 58)" filter="url(#sync-card-shadow-regular)">
        {/* Main Card Background */}
        <rect
          x="0"
          y="0"
          width="170"
          height="272"
          rx="18"
          fill="#FFFFFF"
          stroke="#BAE6FD"
          strokeWidth="1.2"
        />

        {/* Stage Header Pill */}
        <rect x="10" y="10" width="150" height="24" rx="12" fill="#EFF6FF" stroke="#BFDBFE" strokeWidth="0.8" />
        <circle cx="22" cy="22" r="3" fill="#2563EB" />
        <text x="30" y="25.5" fill="#1D4ED8" fontFamily="monospace" fontSize="8.5" fontWeight="800">
          01. ORDER INGESTION
        </text>

        {/* 3D Isometric Amazon Kraft Parcel Box */}
        <g transform="translate(57, 78)">
          {/* Box Drop Shadow */}
          <ellipse cx="28" cy="46" rx="34" ry="10" fill="#020617" opacity="0.12" />

          {/* Top Diamond Face */}
          <polygon points="0,-18 28,-32 56,-18 28,-4" fill="url(#kraft-top)" stroke="#D97706" strokeWidth="0.8" />
          {/* Prime Tape Top */}
          <polygon points="22,-29 28,-32 34,-29 28,-26" fill="url(#prime-tape)" />

          {/* Left Isometric Face */}
          <polygon points="0,-18 28,-4 28,30 0,16" fill="url(#kraft-left)" stroke="#B45309" strokeWidth="0.8" />
          {/* Prime Tape Left */}
          <polygon points="22,-7 28,-4 28,30 22,27" fill="url(#prime-tape)" />

          {/* Right Isometric Face */}
          <polygon points="28,-4 56,-18 56,16 28,30" fill="url(#kraft-right)" stroke="#B45309" strokeWidth="0.8" />

          {/* Amazon Orange Smile Arrow */}
          <path d="M 33 13 Q 42 19 50 11" fill="none" stroke="#EA580C" strokeWidth="2.2" strokeLinecap="round" />
          <polygon points="50,11 48,15 45,13" fill="#EA580C" />

          {/* Moving Laser Scanner Line */}
          <line x1="-4" y1="-10" x2="60" y2="-10" stroke="url(#barcode-laser)" strokeWidth="2.5">
            <animate attributeName="y1" values="-24;36;-24" dur="2.4s" repeatCount="indefinite" />
            <animate attributeName="y2" values="-24;36;-24" dur="2.4s" repeatCount="indefinite" />
          </line>
        </g>

        {/* Order Details */}
        <g transform="translate(12, 140)">
          <text x="0" y="0" fill="#0F172A" fontFamily="monospace" fontSize="9.5" fontWeight="800">
            #114-8923019
          </text>
          <text x="0" y="14" fill="#64748B" fontFamily="system-ui" fontSize="8">
            SKU: <tspan fill="#0284C7" fontWeight="700">CT-HYDR-BTL-32</tspan>
          </text>
        </g>

        {/* FBA Prime & Carrier Pill */}
        <g transform="translate(12, 172)">
          <rect x="0" y="0" width="70" height="20" rx="6" fill="#EFF6FF" stroke="#93C5FD" strokeWidth="0.8" />
          <text x="35" y="13.5" textAnchor="middle" fill="#1D4ED8" fontFamily="system-ui" fontSize="8" fontWeight="800">
            FBA PRIME
          </text>

          <rect x="76" y="0" width="70" height="20" rx="6" fill="#F8FAFC" stroke="#E2E8F0" strokeWidth="0.8" />
          <text x="111" y="13.5" textAnchor="middle" fill="#475569" fontFamily="system-ui" fontSize="8" fontWeight="700">
            🇺🇸 amazon.com
          </text>
        </g>

        {/* Delivery Event Status */}
        <g transform="translate(12, 202)">
          <rect x="0" y="0" width="146" height="24" rx="8" fill="#F0FDF4" stroke="#86EFAC" strokeWidth="0.9" />
          <circle cx="12" cy="12" r="3.5" fill="#10B981" />
          <text x="21" y="15.5" fill="#15803D" fontFamily="system-ui" fontSize="8" fontWeight="700">
            Delivered • Amazon Logistics
          </text>
        </g>

        {/* Carrier Sync Confirmation */}
        <g transform="translate(12, 234)">
          <rect x="0" y="0" width="146" height="24" rx="8" fill="#F8FAFC" stroke="#E2E8F0" strokeWidth="0.8" />
          <text x="8" y="15" fill="#64748B" fontFamily="system-ui" fontSize="7.5" fontWeight="600">
            Carrier Timestamp: <tspan fill="#0F172A" fontWeight="800">2h ago (Verified)</tspan>
          </text>
        </g>
      </g>

      {/* ==================================================== */}
      {/* 4. STAGE 2 (CENTER): ELEVATED GUARDRAIL & AUDIT CORE */}
      {/* ==================================================== */}
      <g transform="translate(215, 45)" filter="url(#sync-card-shadow-elevated)">
        {/* Main Elevated Card Background */}
        <rect
          x="0"
          y="0"
          width="170"
          height="298"
          rx="20"
          fill="#FFFFFF"
          stroke="#86EFAC"
          strokeWidth="1.6"
        />

        {/* Top Header Badge */}
        <rect x="10" y="10" width="150" height="24" rx="12" fill="#ECFDF5" stroke="#A7F3D0" strokeWidth="0.8" />
        <circle cx="22" cy="22" r="3" fill="#10B981" />
        <text x="30" y="25.5" fill="#047857" fontFamily="monospace" fontSize="8.5" fontWeight="800">
          02. POLICY GUARDRAIL
        </text>

        {/* High-Tech Radar Audit Core */}
        <g transform="translate(85, 96)">
          {/* Concentric Gyro Rings */}
          <circle cx="0" cy="0" r="48" fill="none" stroke="#E2E8F0" strokeWidth="1" strokeDasharray="4 4" />
          <circle cx="0" cy="0" r="40" fill="#F8FAFC" stroke="#86EFAC" strokeWidth="1.5" />
          <circle cx="0" cy="0" r="30" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1" />

          {/* Rotating Emerald Radar Sweep */}
          <g>
            <animateTransform
              attributeName="transform"
              type="rotate"
              from="0"
              to="360"
              dur="5s"
              repeatCount="indefinite"
            />
            <path d="M 0 0 L 0 -40 A 40 40 0 0 1 28 -28 Z" fill="url(#radar-sweep-emerald)" />
          </g>

          {/* Center Shield with Checkmark */}
          <circle cx="0" cy="0" r="14" fill="#DCFCE7" stroke="#10B981" strokeWidth="1.5" />
          <path
            d="M -5 0 L -1 4 L 6 -3"
            fill="none"
            stroke="#15803D"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>

        {/* Core Verification Heading */}
        <g transform="translate(85, 156)">
          <text x="0" y="0" textAnchor="middle" fill="#0F172A" fontFamily="system-ui" fontSize="10" fontWeight="900">
            AUDIT PASSED
          </text>
          <text x="0" y="12" textAnchor="middle" fill="#15803D" fontFamily="system-ui" fontSize="8" fontWeight="800">
            ✓ 100% Policy Safe
          </text>
        </g>

        {/* Detailed Guardrail Checklist Pills */}
        <g transform="translate(10, 180)">
          {/* Check 1: Return/Refund Check */}
          <rect x="0" y="0" width="150" height="22" rx="7" fill="#F0FDF4" stroke="#86EFAC" strokeWidth="0.8" />
          <text x="10" y="14.5" fill="#15803D" fontFamily="system-ui" fontSize="7.5" fontWeight="700">
            ✓ 0 Returns / Refunds Found
          </text>

          {/* Check 2: Cancellation Check */}
          <rect x="0" y="26" width="150" height="22" rx="7" fill="#F0FDF4" stroke="#86EFAC" strokeWidth="0.8" />
          <text x="10" y="40.5" fill="#15803D" fontFamily="system-ui" fontSize="7.5" fontWeight="700">
            ✓ Buyer Cancellation: Clear
          </text>

          {/* Check 3: Amazon 5-30 Day Window */}
          <rect x="0" y="52" width="150" height="22" rx="7" fill="#EFF6FF" stroke="#93C5FD" strokeWidth="0.8" />
          <text x="10" y="66.5" fill="#1D4ED8" fontFamily="system-ui" fontSize="7.5" fontWeight="700">
            ✓ Amazon Window: Day 5 Match
          </text>

          {/* Check 4: Zero Duplicate Solicitations */}
          <rect x="0" y="78" width="150" height="22" rx="7" fill="#FAF5FF" stroke="#D8B4FE" strokeWidth="0.8" />
          <text x="10" y="92.5" fill="#7E22CE" fontFamily="system-ui" fontSize="7.5" fontWeight="700">
            ✓ Duplicate Guard: 0 Prior Sent
          </text>
        </g>
      </g>

      {/* ==================================================== */}
      {/* 5. STAGE 3 (RIGHT): OFFICIAL SOLICITATION & 5-STAR LIFT */}
      {/* ==================================================== */}
      <g transform="translate(405, 58)" filter="url(#sync-card-shadow-regular)">
        {/* Main Card Background */}
        <rect
          x="0"
          y="0"
          width="170"
          height="272"
          rx="18"
          fill="#FFFFFF"
          stroke="#DDD6FE"
          strokeWidth="1.2"
        />

        {/* Stage Header Pill */}
        <rect x="10" y="10" width="150" height="24" rx="12" fill="#FAF5FF" stroke="#E9D5FF" strokeWidth="0.8" />
        <circle cx="22" cy="22" r="3" fill="#7C3AED" />
        <text x="30" y="25.5" fill="#6D28D9" fontFamily="monospace" fontSize="8.5" fontWeight="800">
          03. SOLICITATION V1
        </text>

        {/* 5-Star Verified Review Request Banner */}
        <g transform="translate(10, 46)">
          <rect x="0" y="0" width="150" height="52" rx="10" fill="#FFFBEB" stroke="#FDE68A" strokeWidth="1" />
          <text x="75" y="22" textAnchor="middle" fill="#D97706" fontSize="16" fontWeight="bold">
            ★★★★★
          </text>
          <text x="75" y="40" textAnchor="middle" fill="#92400E" fontFamily="system-ui" fontSize="8.5" fontWeight="800">
            Verified Review Request
          </text>
        </g>

        {/* API Endpoint Details */}
        <g transform="translate(12, 114)">
          <text x="0" y="0" fill="#0F172A" fontFamily="system-ui" fontSize="9" fontWeight="800">
            Official Amazon In-Box
          </text>
          <text x="0" y="14" fill="#64748B" fontFamily="monospace" fontSize="8">
            POST /solicitations/v1/orders
          </text>
        </g>

        {/* Scheduled Status Pill */}
        <g transform="translate(12, 146)">
          <rect x="0" y="0" width="146" height="22" rx="6" fill="#F5F3FF" stroke="#DDD6FE" strokeWidth="0.8" />
          <text x="73" y="14.5" textAnchor="middle" fill="#6D28D9" fontFamily="system-ui" fontSize="8" fontWeight="800">
            AUTO-QUEUED FOR DISPATCH
          </text>
        </g>

        {/* Conversion Lift Metric */}
        <g transform="translate(12, 176)">
          <rect x="0" y="0" width="146" height="26" rx="8" fill="#F0FDF4" stroke="#86EFAC" strokeWidth="1" />
          <text x="73" y="17" textAnchor="middle" fill="#15803D" fontFamily="system-ui" fontSize="9" fontWeight="900">
            🚀 +38% Review Volume Lift
          </text>
        </g>

        {/* Compliance Footer */}
        <g transform="translate(12, 210)">
          <rect x="0" y="0" width="146" height="48" rx="8" fill="#F8FAFC" stroke="#E2E8F0" strokeWidth="0.8" />
          <text x="8" y="16" fill="#64748B" fontFamily="system-ui" fontSize="7.5" fontWeight="600">
            Delivery: <tspan fill="#0F172A" fontWeight="800">Studio production API Official</tspan>
          </text>
          <text x="8" y="30" fill="#64748B" fontFamily="system-ui" fontSize="7.5" fontWeight="600">
            Buyer Opt-Outs: <tspan fill="#059669" fontWeight="800">Auto-Filtered</tspan>
          </text>
          <text x="8" y="42" fill="#64748B" fontFamily="system-ui" fontSize="7.5" fontWeight="600">
            Security: <tspan fill="#2563EB" fontWeight="800">100% Policy Compliant</tspan>
          </text>
        </g>
      </g>

      {/* ==================================================== */}
      {/* 6. BOTTOM CARRIER LOGISTICS & SYNC STRIP */}
      {/* ==================================================== */}
      <g transform="translate(60, 368)" filter="url(#sync-pill-shadow)">
        <rect x="0" y="0" width="480" height="34" rx="17" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1" />
        <circle cx="18" cy="17" r="3.5" fill="#0284C7" />
        <text x="28" y="21" fill="#475569" fontFamily="system-ui" fontSize="8.5" fontWeight="700">
          CARRIER TRACKING:
        </text>
        <rect x="135" y="6" width="94" height="22" rx="6" fill="#EFF6FF" stroke="#BFDBFE" strokeWidth="0.8" />
        <text x="182" y="20" textAnchor="middle" fill="#1D4ED8" fontFamily="system-ui" fontSize="8" fontWeight="800">
          Amazon Logistics
        </text>

        <rect x="236" y="6" width="58" height="22" rx="6" fill="#F8FAFC" stroke="#E2E8F0" strokeWidth="0.8" />
        <text x="265" y="20" textAnchor="middle" fill="#0F172A" fontFamily="system-ui" fontSize="8" fontWeight="800">
          UPS FBA
        </text>

        <rect x="301" y="6" width="58" height="22" rx="6" fill="#F8FAFC" stroke="#E2E8F0" strokeWidth="0.8" />
        <text x="330" y="20" textAnchor="middle" fill="#0F172A" fontFamily="system-ui" fontSize="8" fontWeight="800">
          FedEx
        </text>

        <rect x="366" y="6" width="50" height="22" rx="6" fill="#F8FAFC" stroke="#E2E8F0" strokeWidth="0.8" />
        <text x="391" y="20" textAnchor="middle" fill="#0F172A" fontFamily="system-ui" fontSize="8" fontWeight="800">
          DHL
        </text>

        <rect x="423" y="6" width="46" height="22" rx="6" fill="#ECFDF5" stroke="#A7F3D0" strokeWidth="0.8" />
        <text x="446" y="20" textAnchor="middle" fill="#047857" fontFamily="system-ui" fontSize="8" fontWeight="800">
          FBM
        </text>
      </g>
    </svg>
  );
}

function OrderSyncFaqSvg() {
  return (
    <svg
      viewBox="0 0 540 500"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-auto select-none"
      role="img"
      aria-label="Real-Time Amazon Order Tracking & Automated Review Dispatch Hub"
    >
      <defs>
        {/* Soft Drop Shadows */}
        <filter id="hub-shadow-sm" x="-10%" y="-10%" width="120%" height="125%">
          <feDropShadow dx="0" dy="6" stdDeviation="10" floodColor="#0F172A" floodOpacity="0.07" />
        </filter>
        <filter id="hub-shadow-md" x="-12%" y="-12%" width="124%" height="130%">
          <feDropShadow dx="0" dy="10" stdDeviation="14" floodColor="#0F172A" floodOpacity="0.09" />
        </filter>
        <filter id="hub-glow-cyan" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="5" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
        <filter id="hub-glow-emerald" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>

        {/* Clean Gradients */}
        <linearGradient id="hub-card-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#F8FAFC" />
        </linearGradient>

        <linearGradient id="hub-conveyor-track" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#E2E8F0" />
          <stop offset="50%" stopColor="#CBD5E1" />
          <stop offset="100%" stopColor="#E2E8F0" />
        </linearGradient>

        <linearGradient id="hub-beam-active" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0284C7" />
          <stop offset="50%" stopColor="#10B981" />
          <stop offset="100%" stopColor="#6366F1" />
        </linearGradient>

        {/* 3D Box Gradients (Orange / Craft Amazon Parcel) */}
        <linearGradient id="box-top-amber" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FDE68A" />
          <stop offset="100%" stopColor="#F59E0B" />
        </linearGradient>
        <linearGradient id="box-left-amber" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#D97706" />
          <stop offset="100%" stopColor="#92400E" />
        </linearGradient>
        <linearGradient id="box-right-amber" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#B45309" />
        </linearGradient>

        {/* 3D Box Gradients (Cyan / Prime Cyber Package) */}
        <linearGradient id="box-top-cyan" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#BAE6FD" />
          <stop offset="100%" stopColor="#38BDF8" />
        </linearGradient>
        <linearGradient id="box-left-cyan" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0284C7" />
          <stop offset="100%" stopColor="#0369A1" />
        </linearGradient>
        <linearGradient id="box-right-cyan" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#38BDF8" />
          <stop offset="100%" stopColor="#0284C7" />
        </linearGradient>

        {/* Laser Scanner Light */}
        <linearGradient id="hub-laser-scan" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#0284C7" stopOpacity="0" />
          <stop offset="50%" stopColor="#0284C7" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#0284C7" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* ==================================================== */}
      {/* 1. BACKGROUND CONNECTING LOGISTICS FLOW PIPES */}
      {/* ==================================================== */}
      {/* Curved Pipe from Top-Left to Center Hub */}
      <path
        d="M 120 135 C 120 190, 270 180, 270 230"
        fill="none"
        stroke="url(#hub-beam-active)"
        strokeWidth="2.5"
        strokeDasharray="6 6"
      >
        <animate attributeName="stroke-dashoffset" values="0;-24" dur="1.4s" repeatCount="indefinite" />
      </path>

      {/* Curved Pipe from Top-Right to Center Hub */}
      <path
        d="M 420 135 C 420 190, 270 180, 270 230"
        fill="none"
        stroke="url(#hub-beam-active)"
        strokeWidth="2.5"
        strokeDasharray="6 6"
      >
        <animate attributeName="stroke-dashoffset" values="0;-24" dur="1.4s" repeatCount="indefinite" />
      </path>

      {/* Pipe from Center Hub to Bottom Dispatch Station */}
      <path
        d="M 270 290 L 270 345"
        fill="none"
        stroke="url(#hub-beam-active)"
        strokeWidth="2.5"
        strokeDasharray="6 6"
      >
        <animate attributeName="stroke-dashoffset" values="0;-24" dur="1.1s" repeatCount="indefinite" />
      </path>

      {/* Flowing Energy Photons */}
      <circle cx="0" cy="0" r="3.5" fill="#0284C7" filter="url(#hub-glow-cyan)">
        <animateMotion
          path="M 120 135 C 120 190, 270 180, 270 230"
          dur="1.8s"
          repeatCount="indefinite"
        />
      </circle>
      <circle cx="0" cy="0" r="3.5" fill="#10B981" filter="url(#hub-glow-emerald)">
        <animateMotion
          path="M 420 135 C 420 190, 270 180, 270 230"
          dur="1.8s"
          repeatCount="indefinite"
        />
      </circle>

      {/* ==================================================== */}
      {/* 2. TOP-LEFT CARD: FBA CARRIER TRACKING RADAR */}
      {/* ==================================================== */}
      <g transform="translate(18, 20)" filter="url(#hub-shadow-sm)">
        <g>
          <animateTransform
            attributeName="transform"
            type="translate"
            values="0 0; 0 -4; 0 0"
            dur="4s"
            repeatCount="indefinite"
          />
          {/* Card Frame */}
          <rect
            x="0"
            y="0"
            width="235"
            height="125"
            rx="16"
            fill="url(#hub-card-bg)"
            stroke="#E2E8F0"
            strokeWidth="1.2"
          />

          {/* Header Bar */}
          <g transform="translate(14, 14)">
            <rect x="0" y="0" width="76" height="20" rx="6" fill="#EFF6FF" stroke="#BFDBFE" strokeWidth="0.8" />
            <text x="38" y="14" textAnchor="middle" fill="#1D4ED8" fontFamily="system-ui" fontSize="9" fontWeight="800">
              🇺🇸 FBA PRIME
            </text>
            <text x="86" y="14" fill="#64748B" fontFamily="system-ui" fontSize="9" fontWeight="600">
              Carrier Sync
            </text>
          </g>

          {/* 3D Parcel Preview */}
          <g transform="translate(38, 76)">
            {/* Box Top */}
            <polygon points="0,-16 18,-26 36,-16 18,-6" fill="url(#box-top-amber)" stroke="#F59E0B" strokeWidth="0.6" />
            {/* Box Left */}
            <polygon points="0,-16 18,-6 18,18 0,8" fill="url(#box-left-amber)" stroke="#B45309" strokeWidth="0.6" />
            {/* Box Right */}
            <polygon points="18,-6 36,-16 36,8 18,18" fill="url(#box-right-amber)" stroke="#D97706" strokeWidth="0.6" />
            {/* Amazon Smile Curve */}
            <path d="M 22 4 Q 28 9 33 3" fill="none" stroke="#0F172A" strokeWidth="1.5" strokeLinecap="round" />
          </g>

          {/* Order Info */}
          <g transform="translate(85, 48)">
            <text x="0" y="0" fill="#0F172A" fontFamily="monospace" fontSize="10.5" fontWeight="800">
              #114-8923019
            </text>
            <text x="0" y="14" fill="#64748B" fontFamily="system-ui" fontSize="8.5">
              SKU: <tspan fill="#0F172A" fontWeight="700">Hydration Pro</tspan>
            </text>
            {/* Status Pill */}
            <g transform="translate(0, 22)">
              <rect x="0" y="0" width="134" height="20" rx="6" fill="#ECFDF5" stroke="#A7F3D0" strokeWidth="0.8" />
              <circle cx="9" cy="10" r="3" fill="#10B981" />
              <text x="18" y="13.5" fill="#047857" fontFamily="system-ui" fontSize="8" fontWeight="700">
                Delivered (Amazon Log.)
              </text>
            </g>
          </g>
        </g>
      </g>

      {/* ==================================================== */}
      {/* 3. TOP-RIGHT CARD: FBM MERCHANT FULFILLED SYNC */}
      {/* ==================================================== */}
      <g transform="translate(287, 20)" filter="url(#hub-shadow-sm)">
        <g>
          <animateTransform
            attributeName="transform"
            type="translate"
            values="0 0; 0 -5; 0 0"
            dur="4.5s"
            repeatCount="indefinite"
          />
          {/* Card Frame */}
          <rect
            x="0"
            y="0"
            width="235"
            height="125"
            rx="16"
            fill="url(#hub-card-bg)"
            stroke="#E2E8F0"
            strokeWidth="1.2"
          />

          {/* Header Bar */}
          <g transform="translate(14, 14)">
            <rect x="0" y="0" width="76" height="20" rx="6" fill="#FAF5FF" stroke="#E9D5FF" strokeWidth="0.8" />
            <text x="38" y="14" textAnchor="middle" fill="#7E22CE" fontFamily="system-ui" fontSize="9" fontWeight="800">
              🇬🇧 FBM / MFN
            </text>
            <text x="86" y="14" fill="#64748B" fontFamily="system-ui" fontSize="9" fontWeight="600">
              Multi-Carrier
            </text>
          </g>

          {/* 3D Cyan Cyber Parcel Preview */}
          <g transform="translate(38, 76)">
            {/* Box Top */}
            <polygon points="0,-16 18,-26 36,-16 18,-6" fill="url(#box-top-cyan)" stroke="#38BDF8" strokeWidth="0.6" />
            {/* Box Left */}
            <polygon points="0,-16 18,-6 18,18 0,8" fill="url(#box-left-cyan)" stroke="#0369A1" strokeWidth="0.6" />
            {/* Box Right */}
            <polygon points="18,-6 36,-16 36,8 18,18" fill="url(#box-right-cyan)" stroke="#0284C7" strokeWidth="0.6" />
            {/* Laser tape */}
            <line x1="16" y1="-17" x2="22" y2="-14" stroke="#FFFFFF" strokeWidth="2" opacity="0.9" />
          </g>

          {/* Order Info */}
          <g transform="translate(85, 48)">
            <text x="0" y="0" fill="#0F172A" fontFamily="monospace" fontSize="10.5" fontWeight="800">
              #402-9918231
            </text>
            <text x="0" y="14" fill="#64748B" fontFamily="system-ui" fontSize="8.5">
              Carrier: <tspan fill="#0F172A" fontWeight="700">UPS / FedEx</tspan>
            </text>
            {/* Status Pill */}
            <g transform="translate(0, 22)">
              <rect x="0" y="0" width="134" height="20" rx="6" fill="#EFF6FF" stroke="#BFDBFE" strokeWidth="0.8" />
              <circle cx="9" cy="10" r="3" fill="#0284C7" />
              <text x="18" y="13.5" fill="#1D4ED8" fontFamily="system-ui" fontSize="8" fontWeight="700">
                Tracking Auto-Matched
              </text>
            </g>
          </g>
        </g>
      </g>

      {/* ==================================================== */}
      {/* 4. CENTER: INTELLIGENT LOGISTICS & RETURN AUDIT HUB */}
      {/* ==================================================== */}
      <g transform="translate(270, 235)" filter="url(#hub-shadow-md)">
        {/* Ambient Outer Halo */}
        <circle cx="0" cy="0" r="50" fill="#F8FAFC" stroke="#E2E8F0" strokeWidth="1.5" />
        <circle cx="0" cy="0" r="42" fill="#FFFFFF" stroke="#0284C7" strokeWidth="2" opacity="0.9" />

        {/* Rotating Tech Gyro */}
        <circle cx="0" cy="0" r="46" fill="none" stroke="#38BDF8" strokeWidth="1.5" strokeDasharray="10 12">
          <animateTransform
            attributeName="transform"
            type="rotate"
            from="0"
            to="360"
            dur="15s"
            repeatCount="indefinite"
          />
        </circle>

        {/* Central Core Shield & Check */}
        <circle cx="0" cy="0" r="28" fill="#0284C7" />
        <text x="0" y="7" textAnchor="middle" fontSize="17" fill="#FFFFFF">
          🛡️
        </text>

        {/* Left Floating Metric Tag */}
        <g transform="translate(-160, -14)">
          <rect x="0" y="0" width="120" height="28" rx="8" fill="#0F172A" stroke="#38BDF8" strokeWidth="1" />
          <circle cx="12" cy="14" r="3.5" fill="#10B981">
            <animate attributeName="opacity" values="1;0.3;1" dur="1.2s" repeatCount="indefinite" />
          </circle>
          <text x="22" y="17" fill="#FFFFFF" fontFamily="system-ui" fontSize="8.5" fontWeight="800">
            0 Returns Detected
          </text>
        </g>

        {/* Right Floating Metric Tag */}
        <g transform="translate(42, -14)">
          <rect x="0" y="0" width="120" height="28" rx="8" fill="#0F172A" stroke="#34D399" strokeWidth="1" />
          <circle cx="12" cy="14" r="3.5" fill="#34D399">
            <animate attributeName="opacity" values="1;0.3;1" dur="1.5s" repeatCount="indefinite" />
          </circle>
          <text x="22" y="17" fill="#34D399" fontFamily="system-ui" fontSize="8.5" fontWeight="800">
            Safe to Solicit ✓
          </text>
        </g>
      </g>

      {/* ==================================================== */}
      {/* 5. BOTTOM CARD: 5-DAY OPTIMAL REVIEW DISPATCH CONSOLE */}
      {/* ==================================================== */}
      <g transform="translate(18, 345)" filter="url(#hub-shadow-sm)">
        <g>
          <animateTransform
            attributeName="transform"
            type="translate"
            values="0 0; 0 -4; 0 0"
            dur="3.8s"
            repeatCount="indefinite"
          />
          {/* Main Card Frame */}
          <rect
            x="0"
            y="0"
            width="504"
            height="135"
            rx="18"
            fill="url(#hub-card-bg)"
            stroke="#CBD5E1"
            strokeWidth="1.2"
          />

          {/* Console Header */}
          <g transform="translate(20, 20)">
            <rect x="0" y="0" width="145" height="22" rx="6" fill="#0F172A" />
            <text x="72" y="15" textAnchor="middle" fill="#38BDF8" fontFamily="monospace" fontSize="8.5" fontWeight="800">
              SOLICITATION PIPELINE
            </text>
            <text x="160" y="15" fill="#059669" fontFamily="system-ui" fontSize="9.5" fontWeight="700">
              ● Amazon 5-30 Day Window Active
            </text>
            <rect x="360" y="1" width="105" height="20" rx="5" fill="#EFF6FF" stroke="#93C5FD" strokeWidth="0.8" />
            <text x="412" y="14" textAnchor="middle" fill="#1D4ED8" fontFamily="monospace" fontSize="8.5" fontWeight="700">
              solicitations/v1
            </text>
          </g>

          {/* Visual Step Progress Bar */}
          <g transform="translate(30, 68)">
            {/* Rail track */}
            <line x1="0" y1="0" x2="444" y2="0" stroke="#E2E8F0" strokeWidth="5" strokeLinecap="round" />
            {/* Active Range from Day 0 to Day 5 */}
            <line x1="0" y1="0" x2="190" y2="0" stroke="#0284C7" strokeWidth="5" strokeLinecap="round" />

            {/* Point 1: Day 0 (Delivered) */}
            <g transform="translate(0, 0)">
              <circle cx="0" cy="0" r="9" fill="#10B981" />
              <path d="M -3 0 L -1 2 L 3 -2" fill="none" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" />
              <text x="0" y="20" textAnchor="middle" fill="#0F172A" fontFamily="system-ui" fontSize="8.5" fontWeight="800">
                Day 0
              </text>
              <text x="0" y="31" textAnchor="middle" fill="#64748B" fontFamily="system-ui" fontSize="7.5">
                Delivered
              </text>
            </g>

            {/* Point 2: Day 5 (Optimal Review Solicitation) */}
            <g transform="translate(190, 0)">
              <circle cx="0" cy="0" r="14" fill="#0284C7" filter="url(#hub-glow-cyan)">
                <animate attributeName="r" values="12;16;12" dur="2s" repeatCount="indefinite" />
              </circle>
              <circle cx="0" cy="0" r="7" fill="#FFFFFF" />
              <text x="0" y="22" textAnchor="middle" fill="#1D4ED8" fontFamily="system-ui" fontSize="9" fontWeight="900">
                ★ Day 5 (Optimal)
              </text>
              <text x="0" y="33" textAnchor="middle" fill="#0284C7" fontFamily="system-ui" fontSize="7.5" fontWeight="700">
                Auto-Review Sent
              </text>
            </g>

            {/* Point 3: Day 30 (Window Expiry) */}
            <g transform="translate(444, 0)">
              <circle cx="0" cy="0" r="8" fill="#94A3B8" />
              <text x="0" y="20" textAnchor="middle" fill="#64748B" fontFamily="system-ui" fontSize="8.5" fontWeight="700">
                Day 30
              </text>
              <text x="0" y="31" textAnchor="middle" fill="#94A3B8" fontFamily="system-ui" fontSize="7.5">
                Window Closes
              </text>
            </g>
          </g>

          {/* Footer Security Badge */}
          <g transform="translate(20, 118)">
            <text x="0" y="0" fill="#64748B" fontFamily="system-ui" fontSize="8">
              Automatic 1-Request Deduplication Lock • Zero Spam &amp; Account Strike Safe
            </text>
          </g>
        </g>
      </g>
    </svg>
  );
}
