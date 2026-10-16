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
      statusColor: "bg-[#0032ab]/10 text-[#0032ab] border-[#0032ab]/25",
    },
    {
      id: "402-9918231-1029384",
      market: "🇬🇧 Amazon UK",
      sku: "CT-LEATH-WLLT-BRN",
      channel: "FBA",
      delivery: "Delivered 1d ago",
      status: "Scheduled (Day 5)",
      statusColor: "bg-[#155dfc]/10 text-[#155dfc] border-[#155dfc]/25",
    },
    {
      id: "028-4491023-8829103",
      market: "🇩🇪 Amazon DE",
      sku: "CT-MAT-YOGA-BLK",
      channel: "FBM",
      delivery: "Delivered 4d ago",
      status: "Ready to Dispatch",
      statusColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
    },
    {
      id: "701-1928374-5561029",
      market: "🇮🇳 Amazon IN",
      sku: "CT-CUP-CERAMIC-SET",
      channel: "FBA",
      delivery: "Cancelled by Buyer",
      status: "Suppressed (Safety Rule)",
      statusColor: "bg-amber-50 text-amber-700 border-amber-200",
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
        <section className="relative overflow-hidden pt-24 pb-8 lg:pt-28 lg:pb-10 bg-gradient-to-b from-[#c6dbf2] via-[#d5e4f7] to-[#bfd6f0] text-slate-800 w-full max-w-full">
          <div className="absolute inset-0 grid-bg opacity-15 pointer-events-none" />
          <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-brand/10 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-brand/10 blur-3xl pointer-events-none" />

          <Container className="relative max-w-5xl mx-auto text-center">
            <Reveal className="max-w-4xl mx-auto flex flex-col items-center">
              <div className="section-badge mb-4">
                <RefreshCw className="h-3.5 w-3.5 text-brand shrink-0" />
                <span>{t('orderSync.heroBadge') || "Continuous Two-Way Order Ingestion"}</span>
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-[3.25rem] font-extrabold tracking-tight leading-[1.1] text-navy-deep text-center">
                <span>{t('orderSync.heroTitle') || "Real-Time"}</span>{" "}
                <span className="bg-gradient-to-r from-[#0032ab] via-[#2563eb] to-[#7c3aed] text-transparent bg-clip-text">
                  {t('orderSync.heroTitleHighlight') || "Amazon Order Sync"}
                </span>
              </h1>
              <p className="mt-4 text-slate-700 text-base sm:text-lg leading-relaxed max-w-2xl font-medium text-center mx-auto">
                {t('orderSync.heroDesc') || "Delivered orders flow automatically into Gravurtastisch across all 12+ Amazon marketplaces. Track every package from delivery to review dispatch without spreadsheets."}
              </p>
              <div className="mt-7 flex flex-wrap justify-center items-center gap-4">
                <a
                  href="/#register"
                  className="inline-flex items-center gap-2 rounded-full btn-glass-primary px-7 py-3 text-sm font-bold !text-white shadow-lg shadow-brand/30 hover:-translate-y-0.5 transition-all"
                >
                  {t('orderSync.heroCtaRegister') || "Start Syncing Orders"}
                  <ArrowRight className="h-4 w-4" />
                </a>
                <a
                  href="#lifecycle"
                  className="inline-flex items-center gap-2 rounded-full bg-white border border-[#0032ab]/20 px-7 py-3 text-sm font-semibold text-navy-deep hover:bg-slate-50 transition-all shadow-xs"
                >
                  {t('orderSync.heroCtaExplore') || "View Order Pipeline"}
                </a>
              </div>
            </Reveal>

            {/* Connected Live Logistics Telemetry Pipeline Stream with Liquid Glass */}
            <Reveal delay={180}>
              <div className="mt-10 sm:mt-12 rounded-[2rem] liquid-glass border border-white/80 p-5 sm:p-6 shadow-[0_8px_30px_rgba(0,50,171,0.06)] hover:shadow-[0_16px_40px_rgba(0,50,171,0.12)] transition-all text-left">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 divide-y md:divide-y-0 md:divide-x divide-[#0032ab]/10">
                  {/* Pipeline Station 1: Latency */}
                  <div className="flex items-center gap-3.5 p-2.5 sm:p-2 lg:p-3">
                    <div className="relative shrink-0">
                      <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-[#0032ab] to-[#155dfc] text-white shadow-md shadow-[#0032ab]/30 grid place-items-center">
                        <Clock className="h-5 w-5" />
                      </div>
                      <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-emerald-500 animate-ping opacity-75" />
                      <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-emerald-500" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xl sm:text-2xl font-black text-navy-deep font-mono tracking-tight">&lt; 5 mins</span>
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-[#0032ab]/10 text-brand border border-[#0032ab]/20">
                          LIVE STREAM
                        </span>
                      </div>
                      <p className="text-xs font-bold text-navy-deep">{t('orderSync.statLatencyTitle') || "Real-Time Ingestion"}</p>
                      <p className="text-[10px] text-slate-500">{t('orderSync.statLatencySub') || "High-frequency studio API webhooks"}</p>
                    </div>
                  </div>

                  {/* Pipeline Station 2: Global Regions */}
                  <div className="flex items-center gap-3.5 p-2.5 sm:p-2 lg:p-3 pt-3 md:pt-2">
                    <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-[#0032ab] to-[#155dfc] text-white shadow-md shadow-[#0032ab]/30 grid place-items-center shrink-0">
                      <Globe2 className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xl sm:text-2xl font-black text-navy-deep font-mono tracking-tight">12+ Regions</span>
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-[#0032ab]/10 text-brand border border-[#0032ab]/20">
                          GLOBAL
                        </span>
                      </div>
                      <p className="text-xs font-bold text-navy-deep">{t('orderSync.statMarketplacesTitle') || "Active Marketplaces"}</p>
                      <div className="flex items-center gap-1.5 text-xs mt-0.5">
                        <span>🇺🇸</span>
                        <span>🇬🇧</span>
                        <span>🇩🇪</span>
                        <span>🇯🇵</span>
                        <span>🇮🇳</span>
                        <span className="text-[10px] text-slate-500 font-semibold">+7 more</span>
                      </div>
                    </div>
                  </div>

                  {/* Pipeline Station 3: Order Accuracy & Guardrail */}
                  <div className="flex items-center gap-3.5 p-2.5 sm:p-2 lg:p-3 pt-3 md:pt-2">
                    <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-[#0032ab] to-[#155dfc] text-white shadow-md shadow-[#0032ab]/30 grid place-items-center shrink-0">
                      <CheckCircle2 className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xl sm:text-2xl font-black text-navy-deep font-mono tracking-tight">99.99%</span>
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-300">
                          ZERO DUPES
                        </span>
                      </div>
                      <p className="text-xs font-bold text-navy-deep">{t('orderSync.statAccuracyTitle') || "Order Sync Accuracy"}</p>
                      <p className="text-[10px] text-slate-500">{t('orderSync.statAccuracySub') || "Auto-filters returns & cancellations"}</p>
                    </div>
                  </div>

                  {/* Pipeline Station 4: Fulfillment Modes */}
                  <div className="flex items-center gap-3.5 p-2.5 sm:p-2 lg:p-3 pt-3 md:pt-2">
                    <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-[#0032ab] to-[#155dfc] text-white shadow-md shadow-[#0032ab]/30 grid place-items-center shrink-0">
                      <Package className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xl sm:text-2xl font-black text-navy-deep font-mono tracking-tight">FBA &amp; FBM</span>
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-[#0032ab]/10 text-brand border border-[#0032ab]/20">
                          ALL CARRIERS
                        </span>
                      </div>
                      <p className="text-xs font-bold text-navy-deep">{t('orderSync.statFulfillmentTitle') || "Dual Fulfillment Support"}</p>
                      <p className="text-[10px] text-slate-500">{t('orderSync.statFulfillmentSub') || "Prime & Merchant tracking"}</p>
                    </div>
                  </div>
                </div>
              </div>
            </Reveal>
          </Container>
        </section>

        {/* Automation Capabilities Bento Showcase */}
        <section className="relative py-16 lg:py-24 bg-[#f8f9fc] overflow-hidden border-b border-[#0032ab]/10">
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.45]"
            style={{
              backgroundImage:
                "radial-gradient(circle at 12% 20%, rgba(0,50,171,0.05), transparent 42%), radial-gradient(circle at 88% 70%, rgba(79,110,247,0.05), transparent 40%)",
            }}
            aria-hidden
          />
          <Container className="relative">
            <Reveal>
              <div className="max-w-3xl mb-12">
                <span className="section-badge mb-3">
                  {t('orderSync.bentoSectionBadge') || "Automation Capabilities"}
                </span>
                <h2 className="mt-3 text-3xl sm:text-4xl lg:text-[2.75rem] font-extrabold tracking-tight text-navy-deep leading-[1.15]">
                  {t('orderSync.bentoSectionHeading') || "Engineered to Protect Your Seller Account"}
                </h2>
                <p className="mt-4 text-base text-slate-body leading-relaxed max-w-2xl text-left">
                  {t('orderSync.bentoSectionDesc') || "Gravurtastisch's sync engine doesn't just pull order numbers - it actively inspects return statuses, buyer cancellation flags, and delivery confirmations to ensure zero unwanted solicitations."}
                </p>
              </div>
            </Reveal>

            {/* Asymmetrical Bento Architecture Grid */}
            <div className="grid lg:grid-cols-12 gap-6 items-stretch">
              {/* Left Column (Hero Bento Card): Continuous 5-Minute Ingestion Console */}
              <Reveal className="lg:col-span-5 flex" delay={50}>
                <div className="w-full rounded-[2rem] liquid-glass bg-white text-navy-deep p-7 sm:p-8 flex flex-col justify-between border border-white/80 shadow-[0_16px_45px_rgba(0,50,171,0.08)] relative overflow-hidden group">
                  <div>
                    <div className="flex items-center justify-between gap-3 mb-6">
                      <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-[#0032ab] to-[#155dfc] text-white shadow-md shadow-[#0032ab]/30 grid place-items-center">
                        <RefreshCw className="h-6 w-6 animate-[spin_8s_linear_infinite]" />
                      </div>
                      <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-semibold bg-[#0032ab]/10 text-[#0032ab] border border-[#0032ab]/20">
                        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                        {t('orderSync.bentoCard1Badge') || "Continuous Ingestion"}
                      </span>
                    </div>

                    <h3 className="text-2xl sm:text-[1.65rem] font-extrabold text-navy-deep tracking-tight leading-snug">
                      {t('orderSync.bentoCard1Title') || "Continuous 5-Minute Order Stream"}
                    </h3>
                    <p className="mt-3 text-sm text-slate-body leading-relaxed">
                      {t('orderSync.bentoCard1Desc') || "Orders automatically stream into your Gravurtastisch queue within minutes of being updated in order desk. No manual CSV uploads or babysitting required."}
                    </p>

                    {/* Interactive Live Stream Visualizer */}
                    <div className="mt-6 rounded-2xl bg-[#f8f9fc] border border-slate-200/90 p-4 space-y-2.5">
                      <div className="flex items-center justify-between text-xs text-slate-500 font-mono">
                        <span className="flex items-center gap-1.5 font-semibold text-navy-deep">
                          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                          LIVE studio API STREAM
                        </span>
                        <span className="text-[#0032ab] font-bold">POLLING: 5m</span>
                      </div>

                      {/* Mini Live Stream Chips */}
                      <div className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-slate-200/80 text-xs shadow-xs">
                        <div className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-emerald-500" />
                          <span className="font-mono text-navy-deep font-extrabold">#114-8923019</span>
                        </div>
                        <span className="text-[11px] font-bold text-[#0032ab] bg-[#0032ab]/10 px-2 py-0.5 rounded border border-[#0032ab]/20">Ingested (FBA)</span>
                      </div>

                      <div className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-slate-200/80 text-xs shadow-xs">
                        <div className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-[#155dfc]" />
                          <span className="font-mono text-navy-deep font-extrabold">#402-9918231</span>
                        </div>
                        <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">Verified (Delivered)</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 pt-4 border-t border-slate-200/80 flex items-center justify-between text-xs text-slate-500 font-mono">
                    <span>Latency: &lt; 1.8s Response</span>
                    <span className="text-[#0032ab] font-bold">100% Automated Flow →</span>
                  </div>
                </div>
              </Reveal>

              {/* Right Column (Stacked Capability Rows): 3 Distinct Modular Strips */}
              <div className="lg:col-span-7 flex flex-col justify-between gap-4">
                {/* Capability 1: Return & Refund Guardrails */}
                <Reveal delay={100}>
                  <div className="group relative rounded-2xl liquid-glass border border-[#0032ab]/12 p-5 sm:p-6 shadow-[0_4px_24px_rgba(0,50,171,0.06)] hover:shadow-[0_16px_36px_rgba(0,50,171,0.12)] hover:-translate-y-1 transition-all duration-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-[#0032ab] to-[#155dfc] text-white shadow-md shadow-[#0032ab]/25 grid place-items-center shrink-0 group-hover:scale-105 transition-transform">
                        <ShieldAlert className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h3 className="text-base sm:text-lg font-bold text-navy-deep group-hover:text-brand transition-colors">{t('orderSync.bentoCap1Title') || "Return & Refund Guardrails"}</h3>
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#0032ab]/10 text-brand border border-[#0032ab]/20">
                            {t('orderSync.bentoCap1Tag') || "Auto-Suppression"}
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm text-slate-body leading-relaxed">
                          {t('orderSync.bentoCap1Desc') || "If a customer initiates a return or cancellation, Gravurtastisch immediately cancels the production job to prevent soliciting dissatisfied buyers."}
                        </p>
                      </div>
                    </div>
                    <div className="shrink-0 flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                      <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                        0 Bad Custom orders
                      </span>
                    </div>
                  </div>
                </Reveal>

                {/* Capability 2: Granular SKU & ASIN Filtering */}
                <Reveal delay={150}>
                  <div className="group relative rounded-2xl liquid-glass border border-[#0032ab]/12 p-5 sm:p-6 shadow-[0_4px_24px_rgba(0,50,171,0.06)] hover:shadow-[0_16px_36px_rgba(0,50,171,0.12)] hover:-translate-y-1 transition-all duration-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-[#0032ab] to-[#155dfc] text-white shadow-md shadow-[#0032ab]/25 grid place-items-center shrink-0 group-hover:scale-105 transition-transform">
                        <Filter className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h3 className="text-base sm:text-lg font-bold text-navy-deep group-hover:text-brand transition-colors">{t('orderSync.bentoCap2Title') || "Granular SKU & ASIN Filtering"}</h3>
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#0032ab]/10 text-brand border border-[#0032ab]/20">
                            {t('orderSync.bentoCap2Tag') || "Catalog Control"}
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm text-slate-body leading-relaxed">
                          {t('orderSync.bentoCap2Desc') || "Exclude specific items, bundles, or low-margin SKUs from review solicitations with easy toggle rules per marketplace."}
                        </p>
                      </div>
                    </div>
                    <div className="shrink-0 flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                      <span className="text-[11px] font-bold text-brand bg-[#0032ab]/10 border border-[#0032ab]/20 px-3 py-1 rounded-full">
                        Rule Toggles
                      </span>
                    </div>
                  </div>
                </Reveal>

                {/* Capability 3: 12+ Global Marketplaces */}
                <Reveal delay={200}>
                  <div className="group relative rounded-2xl liquid-glass border border-[#0032ab]/12 p-5 sm:p-6 shadow-[0_4px_24px_rgba(0,50,171,0.06)] hover:shadow-[0_16px_36px_rgba(0,50,171,0.12)] hover:-translate-y-1 transition-all duration-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-[#0032ab] to-[#155dfc] text-white shadow-md shadow-[#0032ab]/25 grid place-items-center shrink-0 group-hover:scale-105 transition-transform">
                        <Globe2 className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h3 className="text-base sm:text-lg font-bold text-navy-deep group-hover:text-brand transition-colors">{t('orderSync.bentoCap3Title') || "12+ Global Marketplaces"}</h3>
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#0032ab]/10 text-brand border border-[#0032ab]/20">
                            {t('orderSync.bentoCap3Tag') || "Multi-Market"}
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm text-slate-body leading-relaxed">
                          {t('orderSync.bentoCap3Desc') || "Sync orders simultaneously across North America (US, CA, MX), Europe (UK, DE, FR, IT, ES), Far East (JP, AU), and India (IN)."}
                        </p>
                      </div>
                    </div>
                    <div className="shrink-0 flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                      <div className="flex items-center gap-1.5 text-sm p-1 px-2 rounded-lg bg-slate-50 border border-slate-200">
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
        <section id="lifecycle" className="relative py-16 lg:py-24 bg-white overflow-hidden border-b border-[#0032ab]/10">
          <Container className="relative">
            <Reveal>
              <div className="text-center max-w-3xl mx-auto mb-12">
                <span className="section-badge mb-3">
                  {t('orderSync.pipelineBadge') || "Step-by-Step Flow"}
                </span>
                <h2 className="mt-3 text-3xl sm:text-4xl lg:text-[2.75rem] font-extrabold tracking-tight text-navy-deep leading-[1.15]">
                  {t('orderSync.pipelineHeading') || "The End-to-End Order Sync Journey"}
                </h2>
                <p className="mt-4 text-base text-slate-body leading-relaxed max-w-2xl mx-auto">
                  {t('orderSync.pipelineDesc') || "See how an order transitions from checkout to automated production job."}
                </p>
              </div>
            </Reveal>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 relative">
              {orderLifecycleSteps.map((step, idx) => {
                const Icon = step.icon;
                return (
                  <Reveal key={step.step} delay={idx * 70}>
                    <div className="group relative rounded-[1.75rem] liquid-glass border border-[#0032ab]/12 p-6 sm:p-7 h-full flex flex-col justify-between shadow-[0_4px_24px_rgba(0,50,171,0.06)] hover:shadow-[0_20px_48px_rgba(0,50,171,0.12)] hover:-translate-y-1.5 transition-all duration-300">
                      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#0032ab] to-[#155dfc] opacity-85" aria-hidden />
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <span className="font-mono text-2xl font-black text-brand/30 group-hover:text-brand transition-colors">{step.step}</span>
                          <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-[#0032ab] to-[#155dfc] text-white shadow-md shadow-[#0032ab]/25 grid place-items-center group-hover:scale-105 transition-transform">
                            <Icon className="h-5 w-5" />
                          </div>
                        </div>
                        <h3 className="text-lg font-bold text-navy-deep mb-2 group-hover:text-brand transition-colors">{step.title}</h3>
                        <p className="text-sm text-slate-600 leading-relaxed">{step.desc}</p>
                      </div>
                    </div>
                  </Reveal>
                );
              })}
            </div>
          </Container>
        </section>

        {/* Live Mock Order Feed Preview */}
        <section className="relative py-16 lg:py-24 bg-[#f8f9fc] border-b border-[#0032ab]/10 overflow-hidden">
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.4]"
            style={{
              backgroundImage:
                "radial-gradient(circle at 10% 30%, rgba(0,50,171,0.05), transparent 45%), radial-gradient(circle at 90% 70%, rgba(79,110,247,0.05), transparent 40%)",
            }}
            aria-hidden
          />
          <Container className="relative">
            <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-center">
              <Reveal className="lg:col-span-5 min-w-0">
                <span className="section-badge mb-3">
                  {t('orderSync.tableBadge') || "Live Feed Preview"}
                </span>
                <h2 className="mt-3 text-3xl sm:text-4xl lg:text-[2.75rem] font-extrabold tracking-tight text-navy-deep leading-[1.15]">
                  {t('orderSync.tableHeading') || "Transparent Visibility on Every Package"}
                </h2>
                <p className="mt-4 text-base text-slate-body leading-relaxed max-w-2xl text-left">
                  {t('orderSync.tableDesc') || "Inside your Gravurtastisch dashboard, you get complete visibility of incoming orders, carrier delivery times, eligibility status, and scheduled review dispatches."}
                </p>
                <div className="mt-6 space-y-3">
                  {[
                    t('orderSync.tableBullet1') || "Automatic marketplace conversion & time-zone alignment",
                    t('orderSync.tableBullet2') || "Instant suppression of cancelled or returned orders",
                    t('orderSync.tableBullet3') || "Manual single-click send override for VIP buyers"
                  ].map((bullet, bIdx) => (
                    <div key={bIdx} className="flex items-center gap-3 p-3.5 rounded-2xl liquid-glass border border-[#0032ab]/10 shadow-[0_2px_12px_rgba(0,50,171,0.04)]">
                      <div className="h-7 w-7 rounded-lg bg-emerald-50 text-emerald-600 grid place-items-center shrink-0 border border-emerald-200">
                        <CheckCircle2 className="h-4 w-4" />
                      </div>
                      <span className="text-xs sm:text-sm font-semibold text-navy-deep">{bullet}</span>
                    </div>
                  ))}
                </div>
              </Reveal>

              <Reveal className="lg:col-span-7 min-w-0" delay={100}>
                <div className="rounded-[2rem] liquid-glass bg-white p-5 sm:p-7 shadow-[0_16px_45px_rgba(0,50,171,0.08)] border border-white/80 overflow-hidden relative">
                  <div className="flex items-center justify-between border-b border-slate-200/80 pb-4 mb-4 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="font-extrabold text-navy-deep tracking-wide">LIVE ORDER SYNC FEED</span>
                    </div>
                    <span className="font-mono text-[#0032ab] bg-[#0032ab]/10 border border-[#0032ab]/20 px-2.5 py-1 rounded-md font-bold">AUTO-REFRESH: 5m</span>
                  </div>

                  <div className="overflow-x-auto min-w-0 w-full">
                    <table className="w-full text-left text-xs min-w-[580px]">
                      <thead className="bg-[#e2e8f0] border-b border-slate-300">
                        <tr className="text-navy-deep uppercase font-mono tracking-wider font-bold">
                          <th className="py-3 px-3.5 whitespace-nowrap">{t('orderSync.tableColOrderId') || "Order ID"}</th>
                          <th className="py-3 px-3.5 whitespace-nowrap">{t('orderSync.tableColMarketplace') || "Marketplace"}</th>
                          <th className="py-3 px-3.5 whitespace-nowrap">{t('orderSync.tableColSku') || "SKU / Delivery"}</th>
                          <th className="py-3 px-3.5 text-right whitespace-nowrap">{t('orderSync.tableColStatus') || "Status"}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {liveMockOrders.map((ord) => (
                          <tr key={ord.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-3.5 px-3.5 font-mono text-[#0032ab] font-extrabold whitespace-nowrap">{ord.id}</td>
                            <td className="py-3.5 px-3.5 text-slate-700 font-semibold whitespace-nowrap">{ord.market}</td>
                            <td className="py-3.5 px-3.5 whitespace-nowrap">
                              <p className="font-extrabold text-navy-deep">{ord.sku}</p>
                              <p className="text-[11px] text-slate-500 font-medium">{ord.delivery}</p>
                            </td>
                            <td className="py-3.5 px-3.5 text-right whitespace-nowrap">
                              <span className={`inline-block px-3 py-1 rounded-full text-[10.5px] font-bold border ${ord.statusColor}`}>
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
        <section className="relative py-16 lg:py-24 bg-white border-b border-[#0032ab]/10">
          <Container>
            <div className="grid lg:grid-cols-12 gap-10 lg:gap-14 items-center">
              {/* Left Column: Order Sync FAQ & Logistics Assistant Vector Illustration */}
              <Reveal className="lg:col-span-5 xl:col-span-5">
                <div className="space-y-6">
                  {/* Clean Vector Graphic (Transparent canvas, no card border/shadow) */}
                  <div className="relative flex items-center justify-center">
                    <OrderSyncFaqSvg />
                  </div>

                  <div className="rounded-2xl liquid-glass border border-[#0032ab]/15 p-5 flex items-center justify-between gap-4 shadow-[0_4px_24px_rgba(0,50,171,0.06)] hover:shadow-[0_12px_32px_rgba(0,50,171,0.12)] transition-all">
                    <div className="flex items-center gap-3.5">
                      <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-[#0032ab] to-[#155dfc] text-white shadow-md shadow-[#0032ab]/25 grid place-items-center shrink-0">
                        <Headphones className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-navy-deep leading-tight">{t('orderSync.faqSupportTitle') || "Have custom sync questions?"}</p>
                        <p className="text-xs text-slate-body leading-relaxed mt-0.5">{t('orderSync.faqSupportDesc') || "Our team assists with order desk order pipelines."}</p>
                      </div>
                    </div>
                    <a
                      href="/#contact"
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-brand hover:text-brand-bright transition-colors shrink-0"
                    >
                      {t('orderSync.faqSupportLink') || "Talk to us →"}
                    </a>
                  </div>
                </div>
              </Reveal>

              {/* Right Column: FAQs List */}
              <div className="lg:col-span-7 xl:col-span-7">
                <Reveal>
                  <div className="mb-8">
                    <span className="section-badge mb-3">
                      {t('orderSync.faqBadge') || "Order Sync FAQs"}
                    </span>
                    <h2 className="mt-3 text-3xl sm:text-4xl lg:text-[2.75rem] font-extrabold tracking-tight text-navy-deep leading-[1.15]">
                      {t('orderSync.faqHeading') || "Frequently Asked Questions"}
                    </h2>
                    <p className="mt-4 text-base text-slate-body leading-relaxed">
                      {t('orderSync.faqDesc') || "Everything you need to know about real-time Amazon order tracking, FBA delivery detection, and return safety guardrails."}
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
        <section className="py-8 lg:py-10">
          <Container>
            <div className="relative rounded-[2rem] liquid-glass bg-white py-8 px-6 sm:py-9 sm:px-10 text-center shadow-[0_12px_40px_rgba(0,50,171,0.06)] border border-[#0032ab]/15 overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(0,50,171,0.03),transparent_70%)] pointer-events-none" />
              <div className="relative inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#0032ab]/10 text-[#0032ab] border border-[#0032ab]/20 mb-3">
                <span className="h-1.5 w-1.5 rounded-full bg-[#155dfc] animate-pulse" />
                {t('orderSync.ctaBadge') || "Instant Activation"}
              </div>
              <h2 className="relative text-2xl sm:text-3xl font-extrabold text-navy-deep tracking-tight leading-snug">
                {t('orderSync.ctaHeading') || "Put Your Amazon Order Sync on Autopilot"}
              </h2>
              <p className="relative mt-2 text-slate-body text-xs sm:text-sm max-w-xl mx-auto leading-relaxed">
                {t('orderSync.ctaDesc') || "No CSVs, no missed review opportunities, and no risk of messaging returned orders."}
              </p>
              <div className="relative mt-5 flex flex-wrap justify-center gap-3">
                <a
                  href="/#register"
                  className="inline-flex items-center gap-2 rounded-full btn-glass-primary px-6 py-2.5 text-xs sm:text-sm font-bold !text-white transition-all shadow-md shadow-[#0032ab]/20 hover:-translate-y-0.5"
                >
                  {t('orderSync.ctaButton') || "Register as Seller"}
                  <ArrowRight className="h-4 w-4" />
                </a>
                <a
                  href="/#how"
                  className="inline-flex items-center gap-2 rounded-full bg-white border border-[#0032ab]/20 px-6 py-2.5 text-xs sm:text-sm font-bold text-[#0032ab] hover:bg-blue-50/50 hover:border-[#0032ab]/40 transition-all shadow-xs"
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
          <stop offset="0%" stopColor="#4f6ef7" stopOpacity="0.2" />
          <stop offset="60%" stopColor="#0032ab" stopOpacity="0.06" />
          <stop offset="100%" stopColor="#001855" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="sync-glow-cyan" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.18" />
          <stop offset="70%" stopColor="#0284c7" stopOpacity="0.05" />
          <stop offset="100%" stopColor="#001855" stopOpacity="0" />
        </radialGradient>



        {/* Crisp Card Subtle Background Shimmer */}
        <linearGradient id="sync-white-card-bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#F8FAFC" />
        </linearGradient>

        <linearGradient id="sync-center-card-bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="60%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#F0F7FF" />
        </linearGradient>

        {/* Card Borders */}
        <linearGradient id="sync-card-border" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#E2E8F0" />
          <stop offset="50%" stopColor="#CBD5E1" />
          <stop offset="100%" stopColor="#BFDBFE" />
        </linearGradient>

        <linearGradient id="sync-card-border-center" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="50%" stopColor="#4f6ef7" />
          <stop offset="100%" stopColor="#155dfc" />
        </linearGradient>

        <linearGradient id="sync-blue-pill" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#0032ab" />
          <stop offset="50%" stopColor="#155dfc" />
          <stop offset="100%" stopColor="#4f6ef7" />
        </linearGradient>

        {/* 3D Amazon Parcel Box Kraft Gradients */}
        <linearGradient id="kraft-top" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#e5b887" />
          <stop offset="100%" stopColor="#d29b68" />
        </linearGradient>
        <linearGradient id="kraft-left" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#c8905a" />
          <stop offset="100%" stopColor="#a76f3c" />
        </linearGradient>
        <linearGradient id="kraft-right" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#d9a473" />
          <stop offset="100%" stopColor="#b67f4a" />
        </linearGradient>

        {/* Prime Charcoal Tape Texture */}
        <linearGradient id="prime-tape" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#0f172a" />
          <stop offset="100%" stopColor="#1e293b" />
        </linearGradient>

        {/* Data Conduit Laser Lines */}
        <linearGradient id="laser-pipe-1" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="50%" stopColor="#4f6ef7" />
          <stop offset="100%" stopColor="#0032ab" />
        </linearGradient>
        <linearGradient id="laser-pipe-2" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#0032ab" />
          <stop offset="50%" stopColor="#4f6ef7" />
          <stop offset="100%" stopColor="#38bdf8" />
        </linearGradient>

        {/* Radar Scanner Sweep */}
        <linearGradient id="radar-sweep-emerald" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.85" />
          <stop offset="70%" stopColor="#4f6ef7" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#4f6ef7" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Ambient Lighting Orbs */}
      <circle cx="110" cy="190" r="140" fill="url(#sync-glow-blue)" pointerEvents="none" />
      <circle cx="300" cy="190" r="160" fill="url(#sync-glow-cyan)" pointerEvents="none" />
      <circle cx="490" cy="190" r="140" fill="url(#sync-glow-blue)" pointerEvents="none" />

      {/* ==================================================== */}
      {/* 1. TOP FLOATING TELEMETRY CHIPS (CRISP WHITE PILLS) */}
      {/* ==================================================== */}
      {/* Top Left: Live Ingestion Webhook */}
      <g transform="translate(25, 14)">
        <rect x="0" y="0" width="200" height="30" rx="15" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1.2" style={{ filter: "drop-shadow(0 6px 12px rgba(0, 26, 77, 0.16))" }} />
        <circle cx="16" cy="15" r="4.5" fill="#155dfc">
          <animate attributeName="opacity" values="1;0.3;1" dur="1.2s" repeatCount="indefinite" />
        </circle>
        <text x="28" y="19.5" fill="#0f172a" fontFamily="system-ui, -apple-system, sans-serif" fontSize="9" fontWeight="800">
          studio API ORDER STREAM
        </text>
        <rect x="146" y="5" width="46" height="20" rx="10" fill="#eff6ff" stroke="#bfdbfe" strokeWidth="0.8" />
        <text x="169" y="18.5" textAnchor="middle" fill="#0032ab" fontFamily="monospace" fontSize="8.5" fontWeight="800">
          ⚡ 1.8s
        </text>
      </g>

      {/* Top Right: Global Marketplaces */}
      <g transform="translate(390, 14)">
        <rect x="0" y="0" width="185" height="30" rx="15" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1.2" style={{ filter: "drop-shadow(0 6px 12px rgba(0, 26, 77, 0.16))" }} />
        <circle cx="15" cy="15" r="3.5" fill="#10b981" />
        <text x="26" y="19" fill="#0f172a" fontFamily="system-ui, -apple-system, sans-serif" fontSize="8.5" fontWeight="800">
          SYNCED:
        </text>
        <text x="75" y="20" fontSize="11">🇺🇸</text>
        <text x="96" y="20" fontSize="11">🇬🇧</text>
        <text x="117" y="20" fontSize="11">🇩🇪</text>
        <text x="138" y="20" fontSize="11">🇯🇵</text>
        <text x="159" y="20" fontSize="11">🇮🇳</text>
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
      <line x1="192" y1="200" x2="218" y2="195" stroke="#38bdf8" strokeWidth="2" strokeDasharray="3 3">
        <animate attributeName="stroke-dashoffset" values="0;-12" dur="0.8s" repeatCount="indefinite" />
      </line>

      {/* Pipe 2: Stage 2 -> Stage 3 */}
      <path
        d="M 385 195 C 395 195, 395 200, 405 200"
        stroke="url(#laser-pipe-2)"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <line x1="382" y1="195" x2="408" y2="200" stroke="#38bdf8" strokeWidth="2" strokeDasharray="3 3">
        <animate attributeName="stroke-dashoffset" values="0;-12" dur="0.8s" repeatCount="indefinite" />
      </line>

      {/* ==================================================== */}
      {/* 3. STAGE 1 (LEFT): INGESTED ORDER & 3D PARCEL (WHITE CARD) */}
      {/* ==================================================== */}
      <g transform="translate(25, 56)">
        {/* Main Card Background */}
        <rect
          x="0"
          y="0"
          width="170"
          height="282"
          rx="18"
          fill="url(#sync-white-card-bg)"
          stroke="url(#sync-card-border)"
          strokeWidth="1.2"
          style={{ filter: "drop-shadow(0 10px 18px rgba(0, 26, 77, 0.18))" }}
        />

        {/* Stage Header Pill */}
        <rect x="10" y="10" width="150" height="25" rx="12.5" fill="url(#sync-blue-pill)" />
        <circle cx="22" cy="22.5" r="3" fill="#ffffff" />
        <text x="32" y="26" fill="#ffffff" fontFamily="monospace" fontSize="8.5" fontWeight="800">
          01. ORDER INGESTION
        </text>

        {/* 3D Amazon Kraft Parcel Box Animation */}
        <g transform="translate(57, 96)">
          <animateTransform
            attributeName="transform"
            type="translate"
            values="57 96; 57 90; 57 96"
            dur="3.2s"
            repeatCount="indefinite"
          />
          {/* Box Shadow */}
          <ellipse cx="28" cy="46" rx="34" ry="10" fill="#001a4d" opacity="0.16" />

          {/* 3D Box Faces */}
          <polygon points="0,-18 28,-32 56,-18 28,-4" fill="url(#kraft-top)" stroke="#c8905a" strokeWidth="0.8" />
          <polygon points="0,-18 28,-4 28,34 0,20" fill="url(#kraft-left)" stroke="#a76f3c" strokeWidth="0.8" />
          <polygon points="28,-4 56,-18 56,20 28,34" fill="url(#kraft-right)" stroke="#b67f4a" strokeWidth="0.8" />

          {/* Prime Dark Tape Strip */}
          <polygon points="24,-16 32,-20 32,32 24,36" fill="url(#prime-tape)" opacity="0.9" />

          {/* Amazon Orange Smile Arrow Logo on Box */}
          <path
            d="M 8 6 C 14 13, 20 13, 24 8"
            fill="none"
            stroke="#ff9900"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <polygon points="25,6 25,10 22,9" fill="#ff9900" />
        </g>

        {/* Order Identifier */}
        <g transform="translate(12, 164)">
          <text x="0" y="0" fill="#0f172a" fontFamily="monospace" fontSize="10" fontWeight="900">
            #114-8923019
          </text>
          <text x="0" y="12" fill="#64748b" fontFamily="system-ui" fontSize="7.5" fontWeight="600">
            SKU: CT-HYDR-BTL-32
          </text>
        </g>

        {/* Dual Tag Chips */}
        <g transform="translate(12, 190)">
          <rect x="0" y="0" width="70" height="21" rx="6" fill="#eff6ff" stroke="#bfdbfe" strokeWidth="0.8" />
          <text x="35" y="14" textAnchor="middle" fill="#0032ab" fontFamily="system-ui" fontSize="7.5" fontWeight="800">
            FBA PRIME
          </text>

          <rect x="76" y="0" width="70" height="21" rx="6" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="0.8" />
          <text x="111" y="14" textAnchor="middle" fill="#0f172a" fontFamily="system-ui" fontSize="7.5" fontWeight="700">
            🇺🇸 amazon.com
          </text>
        </g>

        {/* Carrier Sync Status */}
        <g transform="translate(12, 222)">
          <rect x="0" y="0" width="146" height="25" rx="8" fill="#eff6ff" stroke="#bfdbfe" strokeWidth="0.9" />
          <circle cx="12" cy="12.5" r="3.5" fill="#10b981" />
          <text x="22" y="16" fill="#0032ab" fontFamily="system-ui" fontSize="8" fontWeight="800">
            Delivered • Amazon Logistics
          </text>
        </g>

        {/* Delivery Timestamp Pill */}
        <g transform="translate(12, 260)">
          <text x="0" y="0" fill="#64748b" fontFamily="system-ui" fontSize="7.5" fontWeight="600">
            Carrier Timestamp: <tspan fill="#059669" fontWeight="800">2h ago (Verified)</tspan>
          </text>
        </g>
      </g>

      {/* ==================================================== */}
      {/* 4. STAGE 2 (CENTER HERO): 360 RADAR COMPLIANCE (ELEVATED WHITE CARD) */}
      {/* ==================================================== */}
      <g transform="translate(215, 48)">
        {/* Elevated Center Hero Card */}
        <rect
          x="0"
          y="0"
          width="170"
          height="298"
          rx="20"
          fill="url(#sync-center-card-bg)"
          stroke="url(#sync-card-border-center)"
          strokeWidth="2"
          style={{ filter: "drop-shadow(0 14px 22px rgba(0, 26, 77, 0.22))" }}
        />

        {/* Stage Header Pill */}
        <rect x="10" y="10" width="150" height="26" rx="13" fill="url(#sync-blue-pill)" />
        <circle cx="22" cy="23" r="3.5" fill="#38bdf8">
          <animate attributeName="opacity" values="1;0.4;1" dur="1s" repeatCount="indefinite" />
        </circle>
        <text x="32" y="26.5" fill="#ffffff" fontFamily="monospace" fontSize="8.5" fontWeight="900">
          02. POLICY GUARDRAIL
        </text>

        {/* Rotating Circular 360 Policy Radar Scan on Ice Blue Dish */}
        <g transform="translate(85, 84)">
          <circle cx="0" cy="0" r="48" fill="none" stroke="#bfdbfe" strokeWidth="1" strokeDasharray="4 4" />
          <circle cx="0" cy="0" r="40" fill="#f0f7ff" stroke="#93c5fd" strokeWidth="1.5" />
          <circle cx="0" cy="0" r="28" fill="#e0edff" stroke="#38bdf8" strokeWidth="1" />

          {/* Sweeping Radar Cone */}
          <g>
            <animateTransform
              attributeName="transform"
              type="rotate"
              from="0"
              to="360"
              dur="4s"
              repeatCount="indefinite"
            />
            <path
              d="M 0 0 L 38 -15 A 40 40 0 0 1 40 0 Z"
              fill="url(#radar-sweep-emerald)"
            />
          </g>

          {/* Radar center pulse ring */}
          <circle cx="0" cy="0" r="14" fill="none" stroke="#155dfc" strokeWidth="1.5" opacity="0.6">
            <animate attributeName="r" values="14;26;14" dur="2s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.8;0;0.8" dur="2s" repeatCount="indefinite" />
          </circle>

          {/* Center Checkmark Icon */}
          <circle cx="0" cy="0" r="14" fill="#0032ab" stroke="#38bdf8" strokeWidth="1.5" />
          <path
            d="M -5 0 L -2 3 L 5 -4"
            fill="none"
            stroke="#ffffff"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>

        {/* Audit Status Pill */}
        <g transform="translate(10, 144)">
          <rect x="0" y="0" width="150" height="28" rx="14" fill="#ecfdf5" stroke="#a7f3d0" strokeWidth="1" />
          <text x="75" y="14" textAnchor="middle" fill="#065f46" fontFamily="system-ui" fontSize="9" fontWeight="900">
            AUDIT PASSED
          </text>
          <text x="75" y="24" textAnchor="middle" fill="#059669" fontFamily="system-ui" fontSize="7.5" fontWeight="800">
            ✓ 100% Policy Safe
          </text>
        </g>

        {/* 4 Multi-Point Policy Verification Matrix */}
        <g transform="translate(10, 182)">
          <rect x="0" y="0" width="150" height="23" rx="7" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="0.8" />
          <text x="10" y="15" fill="#0f172a" fontFamily="system-ui" fontSize="7.5" fontWeight="700">
            <tspan fill="#059669" fontWeight="900">✓</tspan> 0 Returns / Refunds Found
          </text>

          <rect x="0" y="27" width="150" height="23" rx="7" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="0.8" />
          <text x="10" y="42" fill="#0f172a" fontFamily="system-ui" fontSize="7.5" fontWeight="700">
            <tspan fill="#059669" fontWeight="900">✓</tspan> Buyer Cancellation: Clear
          </text>

          <rect x="0" y="54" width="150" height="23" rx="7" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="0.8" />
          <text x="10" y="69" fill="#0f172a" fontFamily="system-ui" fontSize="7.5" fontWeight="700">
            <tspan fill="#059669" fontWeight="900">✓</tspan> Amazon Window: Day 5 Match
          </text>

          <rect x="0" y="81" width="150" height="23" rx="7" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="0.8" />
          <text x="10" y="96" fill="#0f172a" fontFamily="system-ui" fontSize="7.5" fontWeight="700">
            <tspan fill="#059669" fontWeight="900">✓</tspan> Duplicate Guard: 0 Prior Sent
          </text>
        </g>
      </g>

      {/* ==================================================== */}
      {/* 5. STAGE 3 (RIGHT): OFFICIAL SOLICITATION (WHITE CARD) */}
      {/* ==================================================== */}
      <g transform="translate(405, 56)">
        {/* Main Card Background */}
        <rect
          x="0"
          y="0"
          width="170"
          height="282"
          rx="18"
          fill="url(#sync-white-card-bg)"
          stroke="url(#sync-card-border)"
          strokeWidth="1.2"
          style={{ filter: "drop-shadow(0 10px 18px rgba(0, 26, 77, 0.18))" }}
        />

        {/* Stage Header Pill */}
        <rect x="10" y="10" width="150" height="25" rx="12.5" fill="url(#sync-blue-pill)" />
        <circle cx="22" cy="22.5" r="3" fill="#ffffff" />
        <text x="32" y="26" fill="#ffffff" fontFamily="monospace" fontSize="8.5" fontWeight="800">
          03. SOLICITATION V1
        </text>

        {/* Amazon Official Review Invitation Box */}
        <g transform="translate(10, 46)">
          <rect x="0" y="0" width="150" height="54" rx="10" fill="#eff6ff" stroke="#bfdbfe" strokeWidth="1" />
          <text x="75" y="24" textAnchor="middle" fill="#f59e0b" fontSize="16" fontWeight="bold">
            ★★★★★
          </text>
          <text x="75" y="42" textAnchor="middle" fill="#0032ab" fontFamily="system-ui" fontSize="8.5" fontWeight="900">
            Verified Review Request
          </text>
        </g>

        {/* API Endpoint Details */}
        <g transform="translate(12, 116)">
          <text x="0" y="0" fill="#0f172a" fontFamily="system-ui" fontSize="9.5" fontWeight="800">
            Official Amazon In-Box
          </text>
          <text x="0" y="14" fill="#0032ab" fontFamily="monospace" fontSize="8" fontWeight="700">
            POST /solicitations/v1/orders
          </text>
        </g>

        {/* Scheduled Status Pill */}
        <g transform="translate(12, 148)">
          <rect x="0" y="0" width="146" height="23" rx="6" fill="#f0f7ff" stroke="#bfdbfe" strokeWidth="0.8" />
          <circle cx="14" cy="11.5" r="3" fill="#155dfc" />
          <text x="78" y="15" textAnchor="middle" fill="#0032ab" fontFamily="system-ui" fontSize="8" fontWeight="800">
            AUTO-QUEUED FOR DISPATCH
          </text>
        </g>

        {/* Conversion Lift Metric with Pure White Text */}
        <g transform="translate(12, 178)">
          <rect x="0" y="0" width="146" height="28" rx="14" fill="url(#sync-blue-pill)" style={{ filter: "drop-shadow(0 4px 8px rgba(0, 50, 171, 0.3))" }} />
          <text x="73" y="18" textAnchor="middle" fill="#ffffff" fontFamily="system-ui" fontSize="9" fontWeight="900">
            🚀 +38% Review Volume Lift
          </text>
        </g>

        {/* Compliance Footer */}
        <g transform="translate(12, 216)">
          <rect x="0" y="0" width="146" height="52" rx="8" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="0.8" />
          <text x="8" y="16" fill="#64748b" fontFamily="system-ui" fontSize="7.5" fontWeight="600">
            Delivery: <tspan fill="#0f172a" fontWeight="800">Studio production API Official</tspan>
          </text>
          <text x="8" y="30" fill="#64748b" fontFamily="system-ui" fontSize="7.5" fontWeight="600">
            Buyer Opt-Outs: <tspan fill="#059669" fontWeight="800">Auto-Filtered</tspan>
          </text>
          <text x="8" y="44" fill="#64748b" fontFamily="system-ui" fontSize="7.5" fontWeight="600">
            Security: <tspan fill="#0032ab" fontWeight="800">100% Policy Compliant</tspan>
          </text>
        </g>
      </g>

      {/* ==================================================== */}
      {/* 6. BOTTOM CARRIER LOGISTICS & SYNC STRIP (CRISP WHITE STRIP) */}
      {/* ==================================================== */}
      <g transform="translate(45, 368)">
        <rect x="0" y="0" width="510" height="36" rx="18" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1.2" style={{ filter: "drop-shadow(0 6px 14px rgba(0, 26, 77, 0.16))" }} />
        <circle cx="18" cy="18" r="4" fill="#155dfc">
          <animate attributeName="opacity" values="1;0.4;1" dur="1.5s" repeatCount="indefinite" />
        </circle>
        <text x="28" y="22" fill="#0f172a" fontFamily="system-ui" fontSize="9" fontWeight="800">
          CARRIER TRACKING:
        </text>
        <rect x="145" y="6" width="104" height="24" rx="12" fill="url(#sync-blue-pill)" />
        <text x="197" y="21.5" textAnchor="middle" fill="#ffffff" fontFamily="system-ui" fontSize="8" fontWeight="800">
          Amazon Logistics
        </text>

        <rect x="257" y="6" width="60" height="24" rx="12" fill="#eff6ff" stroke="#bfdbfe" strokeWidth="0.8" />
        <text x="287" y="21.5" textAnchor="middle" fill="#0032ab" fontFamily="system-ui" fontSize="8" fontWeight="800">
          UPS FBA
        </text>

        <rect x="325" y="6" width="58" height="24" rx="12" fill="#eff6ff" stroke="#bfdbfe" strokeWidth="0.8" />
        <text x="354" y="21.5" textAnchor="middle" fill="#0032ab" fontFamily="system-ui" fontSize="8" fontWeight="800">
          FedEx
        </text>

        <rect x="391" y="6" width="52" height="24" rx="12" fill="#eff6ff" stroke="#bfdbfe" strokeWidth="0.8" />
        <text x="417" y="21.5" textAnchor="middle" fill="#0032ab" fontFamily="system-ui" fontSize="8" fontWeight="800">
          DHL
        </text>

        <rect x="451" y="6" width="48" height="24" rx="12" fill="#eff6ff" stroke="#bfdbfe" strokeWidth="0.8" />
        <text x="475" y="21.5" textAnchor="middle" fill="#0032ab" fontFamily="system-ui" fontSize="8" fontWeight="800">
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
          <feDropShadow dx="0" dy="6" stdDeviation="10" floodColor="#282828" floodOpacity="0.06" />
        </filter>
        <filter id="hub-shadow-md" x="-12%" y="-12%" width="124%" height="130%">
          <feDropShadow dx="0" dy="10" stdDeviation="14" floodColor="#282828" floodOpacity="0.08" />
        </filter>
        <filter id="hub-glow-brand" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>

        {/* Clean Brand Gradients */}
        <linearGradient id="hub-card-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#F8FAFC" />
        </linearGradient>

        <linearGradient id="hub-conveyor-track" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#E7E5E4" />
          <stop offset="50%" stopColor="#4f6ef7" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#E7E5E4" />
        </linearGradient>

        <linearGradient id="hub-beam-active" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4f6ef7" />
          <stop offset="50%" stopColor="#0032ab" />
          <stop offset="100%" stopColor="#1d4ed8" />
        </linearGradient>

        {/* 3D Box Gradients (Craft Parcel 1: Tan) */}
        <linearGradient id="box-top-amber" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#F8FAFC" />
          <stop offset="100%" stopColor="#4f6ef7" />
        </linearGradient>
        <linearGradient id="box-left-amber" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0032ab" />
          <stop offset="100%" stopColor="#1d4ed8" />
        </linearGradient>
        <linearGradient id="box-right-amber" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4f6ef7" />
          <stop offset="100%" stopColor="#1e40af" />
        </linearGradient>

        {/* 3D Box Gradients (Craft Parcel 2: Sky / Sapphire Blue) */}
        <linearGradient id="box-top-cyan" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#0284c7" />
        </linearGradient>
        <linearGradient id="box-left-cyan" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0369a1" />
          <stop offset="100%" stopColor="#075985" />
        </linearGradient>
        <linearGradient id="box-right-cyan" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0ea5e9" />
          <stop offset="100%" stopColor="#0284c7" />
        </linearGradient>

        {/* Laser Scanner Light */}
        <linearGradient id="hub-laser-scan" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#4f6ef7" stopOpacity="0" />
          <stop offset="50%" stopColor="#4f6ef7" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#4f6ef7" stopOpacity="0" />
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
      <circle cx="0" cy="0" r="3.5" fill="#4f6ef7" filter="url(#hub-glow-brand)">
        <animateMotion
          path="M 120 135 C 120 190, 270 180, 270 230"
          dur="1.8s"
          repeatCount="indefinite"
        />
      </circle>
      <circle cx="0" cy="0" r="3.5" fill="#4f6ef7" filter="url(#hub-glow-brand)">
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
            stroke="#4f6ef7"
            strokeWidth="1"
            strokeOpacity="0.4"
          />

          {/* Header Bar */}
          <g transform="translate(14, 14)">
            <rect x="0" y="0" width="76" height="20" rx="6" fill="#F8FAFC" stroke="#4f6ef7" strokeWidth="0.8" />
            <text x="38" y="14" textAnchor="middle" fill="#0b132b" fontFamily="system-ui" fontSize="9" fontWeight="800">
              🇺🇸 FBA PRIME
            </text>
            <text x="86" y="14" fill="#78716C" fontFamily="system-ui" fontSize="9" fontWeight="600">
              Carrier Sync
            </text>
          </g>

          {/* 3D Parcel Preview */}
          <g transform="translate(38, 76)">
            {/* Box Top */}
            <polygon points="0,-16 18,-26 36,-16 18,-6" fill="url(#box-top-amber)" stroke="#4f6ef7" strokeWidth="0.6" />
            {/* Box Left */}
            <polygon points="0,-16 18,-6 18,18 0,8" fill="url(#box-left-amber)" stroke="#1d4ed8" strokeWidth="0.6" />
            {/* Box Right */}
            <polygon points="18,-6 36,-16 36,8 18,18" fill="url(#box-right-amber)" stroke="#0032ab" strokeWidth="0.6" />
            {/* Amazon Smile Curve */}
            <path d="M 22 4 Q 28 9 33 3" fill="none" stroke="#0032ab" strokeWidth="1.8" strokeLinecap="round" />
          </g>

          {/* Order Info */}
          <g transform="translate(85, 48)">
            <text x="0" y="0" fill="#0b132b" fontFamily="monospace" fontSize="10.5" fontWeight="800">
              #114-8923019
            </text>
            <text x="0" y="14" fill="#78716C" fontFamily="system-ui" fontSize="8.5">
              SKU: <tspan fill="#0032ab" fontWeight="700">Hydration Pro</tspan>
            </text>
            {/* Status Pill */}
            <g transform="translate(0, 22)">
              <rect x="0" y="0" width="134" height="20" rx="6" fill="#F8FAFC" stroke="#4f6ef7" strokeWidth="0.8" />
              <circle cx="9" cy="10" r="3" fill="#4f6ef7" />
              <text x="18" y="13.5" fill="#0b132b" fontFamily="system-ui" fontSize="8" fontWeight="700">
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
            stroke="#4f6ef7"
            strokeWidth="1"
            strokeOpacity="0.4"
          />

          {/* Header Bar */}
          <g transform="translate(14, 14)">
            <rect x="0" y="0" width="76" height="20" rx="6" fill="#F8FAFC" stroke="#4f6ef7" strokeWidth="0.8" />
            <text x="38" y="14" textAnchor="middle" fill="#0b132b" fontFamily="system-ui" fontSize="9" fontWeight="800">
              🇬🇧 FBM / MFN
            </text>
            <text x="86" y="14" fill="#78716C" fontFamily="system-ui" fontSize="9" fontWeight="600">
              Multi-Carrier
            </text>
          </g>

          {/* 3D Cyan Cyber Parcel Preview */}
          <g transform="translate(38, 76)">
            {/* Box Top */}
            <polygon points="0,-16 18,-26 36,-16 18,-6" fill="url(#box-top-cyan)" stroke="#38bdf8" strokeWidth="0.8" />
            {/* Box Left */}
            <polygon points="0,-16 18,-6 18,18 0,8" fill="url(#box-left-cyan)" stroke="#0284c7" strokeWidth="0.8" />
            {/* Box Right */}
            <polygon points="18,-6 36,-16 36,8 18,18" fill="url(#box-right-cyan)" stroke="#0369a1" strokeWidth="0.8" />
            {/* Tape */}
            <line x1="16" y1="-17" x2="22" y2="-14" stroke="#e0f2fe" strokeWidth="2" opacity="0.9" />
          </g>

          {/* Order Info */}
          <g transform="translate(85, 48)">
            <text x="0" y="0" fill="#0b132b" fontFamily="monospace" fontSize="10.5" fontWeight="800">
              #402-9918231
            </text>
            <text x="0" y="14" fill="#78716C" fontFamily="system-ui" fontSize="8.5">
              Carrier: <tspan fill="#0032ab" fontWeight="700">UPS / FedEx</tspan>
            </text>
            {/* Status Pill */}
            <g transform="translate(0, 22)">
              <rect x="0" y="0" width="134" height="20" rx="6" fill="#F8FAFC" stroke="#4f6ef7" strokeWidth="0.8" />
              <circle cx="9" cy="10" r="3" fill="#4f6ef7" />
              <text x="18" y="13.5" fill="#0b132b" fontFamily="system-ui" fontSize="8" fontWeight="700">
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
        <circle cx="0" cy="0" r="50" fill="#F8FAFC" stroke="#E7E5E4" strokeWidth="1.5" />
        <circle cx="0" cy="0" r="42" fill="#FFFFFF" stroke="#4f6ef7" strokeWidth="2" opacity="0.9" />

        {/* Rotating Tech Gyro */}
        <circle cx="0" cy="0" r="46" fill="none" stroke="#4f6ef7" strokeWidth="1.5" strokeDasharray="10 12">
          <animateTransform
            attributeName="transform"
            type="rotate"
            from="0"
            to="360"
            dur="15s"
            repeatCount="indefinite"
          />
        </circle>

        {/* Central Core Shield */}
        <circle cx="0" cy="0" r="28" fill="#0032ab" stroke="#155dfc" strokeWidth="1.5" />
        <text x="0" y="7" textAnchor="middle" fontSize="17" fill="#FFFFFF">
          🛡️
        </text>

        {/* Left Floating Metric Tag */}
        <g transform="translate(-160, -14)">
          <rect x="0" y="0" width="120" height="28" rx="8" fill="rgba(0,50,171,0.08)" stroke="#155dfc" strokeWidth="1" />
          <circle cx="12" cy="14" r="3.5" fill="#155dfc">
            <animate attributeName="opacity" values="1;0.3;1" dur="1.2s" repeatCount="indefinite" />
          </circle>
          <text x="22" y="17" fill="#0032ab" fontFamily="system-ui" fontSize="8.5" fontWeight="800">
            0 Returns Detected
          </text>
        </g>

        {/* Right Floating Metric Tag */}
        <g transform="translate(42, -14)">
          <rect x="0" y="0" width="120" height="28" rx="8" fill="rgba(16,185,129,0.08)" stroke="#10b981" strokeWidth="1" />
          <circle cx="12" cy="14" r="3.5" fill="#10b981">
            <animate attributeName="opacity" values="1;0.3;1" dur="1.5s" repeatCount="indefinite" />
          </circle>
          <text x="22" y="17" fill="#059669" fontFamily="system-ui" fontSize="8.5" fontWeight="800">
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
            stroke="#4f6ef7"
            strokeWidth="1"
            strokeOpacity="0.5"
          />

          {/* Console Header */}
          <g transform="translate(20, 20)">
            <rect x="0" y="0" width="145" height="22" rx="6" fill="rgba(0,50,171,0.08)" stroke="#155dfc" strokeWidth="0.8" />
            <text x="72" y="15" textAnchor="middle" fill="#0032ab" fontFamily="monospace" fontSize="8.5" fontWeight="800">
              SOLICITATION PIPELINE
            </text>
            <text x="160" y="15" fill="#0b132b" fontFamily="system-ui" fontSize="9.5" fontWeight="700">
              ● Amazon 5-30 Day Window Active
            </text>
            <rect x="360" y="1" width="105" height="20" rx="5" fill="#F8FAFC" stroke="#4f6ef7" strokeWidth="0.8" />
            <text x="412" y="14" textAnchor="middle" fill="#0032ab" fontFamily="monospace" fontSize="8.5" fontWeight="700">
              solicitations/v1
            </text>
          </g>

          {/* Visual Step Progress Bar */}
          <g transform="translate(30, 68)">
            {/* Rail track */}
            <line x1="0" y1="0" x2="444" y2="0" stroke="#E7E5E4" strokeWidth="5" strokeLinecap="round" />
            {/* Active Range from Day 0 to Day 5 */}
            <line x1="0" y1="0" x2="190" y2="0" stroke="#4f6ef7" strokeWidth="5" strokeLinecap="round" />

            {/* Point 1: Day 0 (Delivered) */}
            <g transform="translate(0, 0)">
              <circle cx="0" cy="0" r="9" fill="#0032ab" stroke="#155dfc" strokeWidth="1" />
              <path d="M -3 0 L -1 2 L 3 -2" fill="none" stroke="#F8FAFC" strokeWidth="1.8" strokeLinecap="round" />
              <text x="0" y="20" textAnchor="middle" fill="#0b132b" fontFamily="system-ui" fontSize="8.5" fontWeight="800">
                Day 0
              </text>
              <text x="0" y="31" textAnchor="middle" fill="#78716C" fontFamily="system-ui" fontSize="7.5">
                Delivered
              </text>
            </g>

            {/* Point 2: Day 5 (Optimal Review Solicitation) */}
            <g transform="translate(190, 0)">
              <circle cx="0" cy="0" r="14" fill="#4f6ef7" filter="url(#hub-glow-brand)">
                <animate attributeName="r" values="12;16;12" dur="2s" repeatCount="indefinite" />
              </circle>
              <circle cx="0" cy="0" r="7" fill="#FFFFFF" stroke="#0032ab" strokeWidth="2" />
              <text x="0" y="22" textAnchor="middle" fill="#0032ab" fontFamily="system-ui" fontSize="9" fontWeight="900">
                ★ Day 5 (Optimal)
              </text>
              <text x="0" y="33" textAnchor="middle" fill="#0032ab" fontFamily="system-ui" fontSize="7.5" fontWeight="700">
                Auto-Review Sent
              </text>
            </g>

            {/* Point 3: Day 30 (Window Expiry) */}
            <g transform="translate(444, 0)">
              <circle cx="0" cy="0" r="8" fill="#A8A29E" />
              <text x="0" y="20" textAnchor="middle" fill="#78716C" fontFamily="system-ui" fontSize="8.5" fontWeight="700">
                Day 30
              </text>
              <text x="0" y="31" textAnchor="middle" fill="#A8A29E" fontFamily="system-ui" fontSize="7.5">
                Window Closes
              </text>
            </g>
          </g>

          {/* Footer Security Badge */}
          <g transform="translate(20, 118)">
            <text x="0" y="0" fill="#78716C" fontFamily="system-ui" fontSize="8">
              Automatic 1-Request Deduplication Lock • Zero Spam &amp; Account Strike Safe
            </text>
          </g>
        </g>
      </g>
    </svg>
  );
}
