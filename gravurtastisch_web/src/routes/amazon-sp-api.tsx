import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
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
  ShieldCheck,
  Lock,
  Zap,
  Server,
  KeyRound,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Cpu,
  Layers,
  HelpCircle,
  ArrowRight,
  Sparkles,
  ExternalLink,
  Headphones,
  Check,
  Code2,
  Terminal,
  Copy,
  ChevronRight,
  RefreshCw,
  Globe2,
  PackageCheck,
} from "lucide-react";
import i18n from "@/i18n/config";
import { ServicePageSkeleton } from "@/components/skeletons/ServicePageSkeleton";

export const Route = createFileRoute("/amazon-sp-api")({
  pendingComponent: ServicePageSkeleton,
  head: () => ({
    meta: [
      { title: "Studio production API Integration & Security | Gravurtastisch" },
      {
        name: "description",
        content:
          "Gravurtastisch's official Amazon Selling Partner API (studio API) integration. Certified, scoped access, OAuth 2.0 security, and zero scraping policy.",
      },
      { property: "og:title", content: "Studio production API Architecture | Gravurtastisch" },
      {
        property: "og:description",
        content:
          "Official Studio production API integration with scoped, revocable access, encrypted token vaults, and 100% Amazon TOS compliance.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/amazon-sp-api" },
    ],
    links: [{ rel: "canonical", href: "/amazon-sp-api" }],
  }),
  component: AmazonSpApiPage,
});

function AmazonSpApiPage() {
  const { t } = useTranslation();
  const [activeArchLayer, setActiveArchLayer] = useState(0);
  const [activeEndpointIndex, setActiveEndpointIndex] = useState(0);
  const [copiedEndpoint, setCopiedEndpoint] = useState<string | null>(null);

  const isSkeletonPreview = typeof window !== "undefined" && window.location.search.includes("skeleton=true");

  if (isSkeletonPreview) {
    return <ServicePageSkeleton />;
  }

  const securityBadges = [
    {
      icon: ShieldCheck,
      title: t('amazonSpApi.badgeCertified', 'Studio certified'),
      desc: t('amazonSpApi.badgeCertifiedDesc', 'Proof-gated workflows and material profiles built for repeat brand quality.'),
      metric: "100% Policy-Safe",
      color: "#0032ab",
    },
    {
      icon: Lock,
      title: t('amazonSpApi.badgeZeroCred', 'Zero password storage'),
      desc: t('amazonSpApi.badgeZeroCredDesc', 'We never ask for your shop password. Connections use OAuth tokens where supported.'),
      metric: "OAuth 2.0 LWA",
      color: "#4f6ef7",
    },
    {
      icon: KeyRound,
      title: t('amazonSpApi.badgeScoped', 'Scoped & revocable'),
      desc: t('amazonSpApi.badgeScopedDesc', 'Access is limited to order and catalog sync - revoke anytime from your platform.'),
      metric: "1-Click Revocable",
      color: "#155dfc",
    },
    {
      icon: Server,
      title: t('amazonSpApi.badgeVault', 'Encrypted asset vault'),
      desc: t('amazonSpApi.badgeVaultDesc', 'Artwork and tokens encrypted at rest with industry-standard algorithms.'),
      metric: "AES-256 KMS",
      color: "#059669",
    },
  ];

  const archLayers = [
    {
      num: "01",
      title: t('amazonSpApi.archLayer1Title', 'Customer notifications'),
      sub: t('amazonSpApi.archLayer1Sub', 'Proof ready · shipped · delivery updates'),
      protocol: "AWS EventBridge · Webhook SQS",
      latency: "12ms ingestion",
      sla: "Zero PII leakage",
      tag: ".notifications",
      accent: "from-[#0032ab] to-[#155dfc]",
    },
    {
      num: "02",
      title: t('amazonSpApi.archLayer2Title', 'Production gateway'),
      sub: t('amazonSpApi.archLayer2Sub', 'Queue jobs · schedule craft lines'),
      protocol: "REST API Gateway · SigV4 Signed",
      latency: "850 mm/s laser sync",
      sla: "Proof-lock gate",
      tag: ".gateway",
      accent: "from-[#155dfc] to-[#4f6ef7]",
    },
    {
      num: "03",
      title: t('amazonSpApi.archLayer3Title', 'Capacity-aware worker'),
      sub: t('amazonSpApi.archLayer3Sub', 'Smooths peak loads without missed SLAs'),
      protocol: "Token Bucket Rate Limiter",
      latency: "15 req/sec cap",
      sla: "0 Quota 429 Errors",
      tag: ".throttle",
      accent: "from-[#0032ab] to-[#38bdf8]",
    },
    {
      num: "04",
      title: t('amazonSpApi.archLayer4Title', 'Two-way order sync'),
      sub: t('amazonSpApi.archLayer4Sub', 'Live status from intake through shipment'),
      protocol: "2-Way Bi-directional SQS Poller",
      latency: "Real-time carrier sync",
      sla: "DHL Express 24h",
      tag: ".sync",
      accent: "from-[#155dfc] to-[#0032ab]",
    },
    {
      num: "05",
      title: t('amazonSpApi.archLayer5Title', 'Credential & asset vault'),
      sub: t('amazonSpApi.archLayer5Sub', 'Encrypted storage with controlled retention'),
      protocol: "AWS KMS · Hardware Security Module",
      latency: "Automated key rotation",
      sla: "Zero Password Storage",
      tag: ".vault",
      accent: "from-emerald-600 to-[#0032ab]",
    },
  ];

  const apiEndpoints = [
    {
      id: "ep-1",
      endpoint: "solicitations/v1/orders/{orderId}/solicitations/productReviewAndSellerFeedback",
      name: t('amazonSpApi.endpoint1Name', 'Order webhooks'),
      purpose: t('amazonSpApi.endpoint1Purpose', 'Ingest new custom orders and line items as soon as your storefront confirms checkout.'),
      method: "POST",
      status: "Compliant",
      payload: `{
  "event": "ORDER_INGESTED",
  "orderId": "#GT-2026-9941",
  "channel": "SP_API_OFFICIAL",
  "proofGate": "LOCKED_AWAITING_APPROVAL",
  "vectorDpi": 300,
  "sku": "CUP-WRAP-750"
}`,
    },
    {
      id: "ep-2",
      endpoint: "orders/v0/orders & orders/v0/orders/{orderId}/orderItems",
      name: t('amazonSpApi.endpoint2Name', 'Catalog sync'),
      purpose: t('amazonSpApi.endpoint2Purpose', 'Maps SKUs to product lines - cups, engrave surfaces, textiles - for correct routing.'),
      method: "GET",
      status: "Real-time",
      payload: `{
  "skuMapping": {
    "CUP-WRAP-750": "ROTARY_LASER_360",
    "BOARD-OAK-02": "DEEP_VECTOR_ETCH",
    "APP-HOOD-12": "TAJIMA_EMBROIDERY_18K"
  },
  "status": "CALIBRATED_100%"
}`,
    },
    {
      id: "ep-3",
      endpoint: "notifications/v1/subscriptions",
      name: t('amazonSpApi.endpoint3Name', 'Shipment events'),
      purpose: t('amazonSpApi.endpoint3Purpose', 'Push tracking numbers and carrier events back to your channel when parcels leave the studio.'),
      method: "EVENT",
      status: "Automated",
      payload: `{
  "eventType": "PARCEL_DISPATCHED",
  "tracking": "DHL_EXPRESS_DE_9941824",
  "transitTime": "< 24h",
  "opticalQc": "PASSED_100%"
}`,
    },
    {
      id: "ep-4",
      endpoint: "sellers/v1/marketplaceParticipations",
      name: t('amazonSpApi.endpoint4Name', 'Multi-store routing'),
      purpose: t('amazonSpApi.endpoint4Purpose', 'Separate queues per brand or region while sharing one proof and production engine.'),
      method: "GET",
      status: "Multi-Region",
      payload: `{
  "regions": ["DE", "AT", "CH", "UK", "FR", "IT", "ES"],
  "currencyRouting": ["EUR", "GBP", "CHF"],
  "studioEngine": "GRAVURTASTISCH_UNIFIED"
}`,
    },
  ];

  const comparisonRows = [
    {
      feature: t('amazonSpApi.compRow1Feature', 'Proof before production'),
      gravurtastisch: t('amazonSpApi.compRow1RS', 'Always - digital mockup required'),
      scraping: t('amazonSpApi.compRow1Scraping', 'Often skipped or inconsistent'),
      smtp: t('amazonSpApi.compRow1Smtp', 'Template-only, no true product mockup'),
    },
    {
      feature: t('amazonSpApi.compRow2Feature', 'Artwork security'),
      gravurtastisch: t('amazonSpApi.compRow2RS', 'Encrypted vault, scoped access'),
      scraping: t('amazonSpApi.compRow2Scraping', 'Files in inboxes and chat apps'),
      smtp: t('amazonSpApi.compRow2Smtp', 'Unknown retention policies'),
    },
    {
      feature: t('amazonSpApi.compRow3Feature', 'Brand consistency'),
      gravurtastisch: t('amazonSpApi.compRow3RS', 'Saved presets per SKU and color'),
      scraping: t('amazonSpApi.compRow3Scraping', 'Drifts between reorder batches'),
      smtp: t('amazonSpApi.compRow3Smtp', 'Stock designs, limited customization'),
    },
    {
      feature: t('amazonSpApi.compRow4Feature', 'Order visibility'),
      gravurtastisch: t('amazonSpApi.compRow4RS', 'Single dashboard: proof → ship'),
      scraping: t('amazonSpApi.compRow4Scraping', 'Spreadsheets and threads'),
      smtp: t('amazonSpApi.compRow4Smtp', 'Opaque third-party status'),
    },
    {
      feature: t('amazonSpApi.compRow5Feature', 'Material expertise'),
      gravurtastisch: t('amazonSpApi.compRow5RS', 'Laser-tuned profiles per material'),
      scraping: t('amazonSpApi.compRow5Scraping', 'Varies by whoever is available'),
      smtp: t('amazonSpApi.compRow5Smtp', 'One-size-fits-all printing'),
    },
  ];

  const faqs = [
    {
      q: t('amazonSpApi.faq1Q', 'How does Gravurtastisch connect to my shop?'),
      a: t('amazonSpApi.faq1A', 'Where your platform supports OAuth or API tokens, you authorize Gravurtastisch with scoped permissions. We never see your shop password.'),
    },
    {
      q: t('amazonSpApi.faq2Q', 'Can Gravurtastisch misproduce my order?'),
      a: t('amazonSpApi.faq2A', 'Production unlocks only after you approve the digital proof. That gate is our primary guard against wrong placement, crops, or colors.'),
    },
    {
      q: t('amazonSpApi.faq3Q', 'What data does Gravurtastisch need?'),
      a: t('amazonSpApi.faq3A', 'Order references, SKU mappings, shipping addresses, and artwork files required to fulfill - not your unrelated financial or customer marketing lists.'),
    },
    {
      q: t('amazonSpApi.faq4Q', 'Can I revoke access at any time?'),
      a: t('amazonSpApi.faq4A', 'Yes. Disconnect the integration from your commerce admin or contact us to rotate tokens and pause sync.'),
    },
  ];

  const handleCopyEndpoint = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedEndpoint(text);
    setTimeout(() => setCopiedEndpoint(null), 2000);
  };

  return (
    <div className="min-h-screen bg-background text-navy-deep antialiased selection:bg-[#0032ab]/15 selection:text-[#0032ab]">
      <Nav />

      <main className="pb-12">
        {/* ========================================================================= */}
        {/* 1. HERO SECTION: Smart, Rich, Brand-Aligned with Live Pipeline Visualizer */}
        {/* ========================================================================= */}
        <section className="relative overflow-hidden pt-24 pb-8 lg:pt-28 lg:pb-10 bg-gradient-to-b from-[#c6dbf2] via-[#d5e4f7] to-[#bfd6f0] text-slate-800 w-full max-w-full border-b border-[#0032ab]/12">
          <div className="absolute inset-0 grid-bg opacity-15 pointer-events-none" />
          <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-brand/10 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-brand/10 blur-3xl pointer-events-none" />

          <Container className="relative max-w-5xl mx-auto text-center">
            {/* Top Headline Block */}
            <div className="text-center max-w-3xl mx-auto mb-6">
              <Reveal>
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white dark:bg-navy/80 border border-[#0032ab]/20 shadow-xs text-xs font-bold text-[#0032ab] dark:text-[#4f6ef7] mb-4">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>{t('amazonSpApi.heroBadge', 'Studio-grade security & quality')}</span>
                </div>
              </Reveal>

              <Reveal delay={60}>
                <h1 className="text-4xl sm:text-5xl lg:text-[3.25rem] font-extrabold tracking-tight leading-[1.1] text-navy-deep text-center">
                  <span>{t('amazonSpApi.heroTitle', 'Production hub')}</span>{" "}
                  <span className="bg-gradient-to-r from-[#0032ab] via-[#2563eb] to-[#7c3aed] text-transparent bg-clip-text">
                    {t('amazonSpApi.heroTitleHighlight', 'integration & trust')}
                  </span>
                </h1>
              </Reveal>

              <Reveal delay={100}>
                <p className="mt-4 text-slate-700 text-base sm:text-lg leading-relaxed font-medium max-w-2xl mx-auto">
                  {t('amazonSpApi.heroDesc', 'Secure connections to your storefronts and order sources. No scattered files, no mystery vendors - just a certified pipeline from upload to shipped parcel.')}
                </p>
              </Reveal>

              <Reveal delay={140}>
                <div className="mt-7 flex flex-wrap justify-center items-center gap-3.5">
                  <a
                    href="/#register"
                    className="inline-flex items-center gap-2 rounded-full btn-glass-primary px-7 py-3 text-xs sm:text-sm font-bold !text-white shadow-lg shadow-[#0032ab]/25 hover:-translate-y-0.5 transition-all"
                  >
                    <span>{t('amazonSpApi.heroCtaRegister', 'Place Custom Order')}</span>
                    <ArrowRight className="h-4 w-4" />
                  </a>
                  <a
                    href="#architecture"
                    className="inline-flex items-center gap-2 rounded-full bg-white dark:bg-navy/90 border border-slate-200/90 dark:border-white/10 px-6 py-3 text-xs sm:text-sm font-bold text-navy-deep dark:text-white hover:border-[#0032ab]/40 hover:text-[#0032ab] transition-all shadow-2xs"
                  >
                    <span>{t('amazonSpApi.heroCtaArch', 'View 5-layer architecture')}</span>
                  </a>
                </div>
              </Reveal>
            </div>

            {/* Badges Grid with Liquid Glass - Compact Height matching other pages */}
            <div className="mt-8 sm:mt-10 grid sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 border-t border-[#0032ab]/15 pt-6 text-left">
              {securityBadges.map((badge, idx) => {
                const Icon = badge.icon;
                return (
                  <Reveal key={badge.title} delay={idx * 60}>
                    <div className="group relative h-full rounded-2xl liquid-glass border border-white/80 p-3.5 sm:p-4 shadow-[0_6px_24px_rgba(0,50,171,0.06)] hover:shadow-[0_12px_32px_rgba(0,50,171,0.12)] hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between gap-3 mb-2">
                          <div className="h-8.5 w-8.5 rounded-xl bg-gradient-to-br from-[#0032ab] to-[#155dfc] text-white shadow-sm shadow-[#0032ab]/30 grid place-items-center group-hover:scale-105 transition-transform">
                            <Icon className="h-4 w-4" />
                          </div>
                          <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-slate-500 group-hover:text-brand transition-colors">
                            {badge.metric || `0${idx + 1}`}
                          </span>
                        </div>
                        <h3 className="text-sm sm:text-[15px] font-bold text-navy-deep mb-1 group-hover:text-brand transition-colors leading-snug">
                          {badge.title}
                        </h3>
                        <p className="text-[11.5px] sm:text-xs text-slate-600 leading-relaxed font-normal">
                          {badge.desc}
                        </p>
                      </div>
                    </div>
                  </Reveal>
                );
              })}
            </div>
          </Container>
        </section>

        {/* ========================================================================= */}
        {/* 2. 5-LAYER STACK ARCHITECTURE: Interactive Telemetry Console */}
        {/* ========================================================================= */}
        <section id="architecture" className="relative py-16 lg:py-24 bg-[#f8f9fc] dark:bg-[#080d1e] overflow-hidden border-b border-[#0032ab]/10">
          <Container className="relative">
            <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-center">
              {/* Left Column: Headline, Specs & Telemetry Badges */}
              <Reveal className="lg:col-span-5 min-w-0">
                <span className="section-badge mb-3">
                  {t('amazonSpApi.archSectionBadge', 'Under the hood')}
                </span>
                <h2 className="mt-3 text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-navy-deep dark:text-white leading-tight">
                  {t('amazonSpApi.archHeading', 'Enterprise-grade 5-layer stack')}
                </h2>
                <p className="mt-4 text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed text-left">
                  {t('amazonSpApi.archDesc', 'Every layer is decoupled and isolated. Assets and credentials live in encrypted enclaves; production traffic is throttled to protect quality SLAs.')}
                </p>

                {/* 2 Clean Value Cards with Liquid Glass and Accent Borders */}
                <div className="mt-6 space-y-3.5">
                  <div className="group relative rounded-2xl liquid-glass border border-slate-200/90 dark:border-white/10 p-4 sm:p-4.5 shadow-sm hover:shadow-md hover:border-[#0032ab]/40 hover:-translate-y-0.5 transition-all duration-300 flex items-start gap-3.5 overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#0032ab] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-[#0032ab] to-[#155dfc] text-white grid place-items-center shrink-0 mt-0.5 shadow-xs group-hover:scale-105 transition-transform">
                      <CheckCircle2 className="h-4.5 w-4.5" />
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-navy-deep dark:text-white group-hover:text-[#0032ab] transition-colors">
                        {t('amazonSpApi.archFeature1Title', 'Signed API requests')}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                        {t('amazonSpApi.archFeature1Desc', 'Every integration call is authenticated with time-limited tokens and audit logging.')}
                      </p>
                    </div>
                  </div>

                  <div className="group relative rounded-2xl liquid-glass border border-slate-200/90 dark:border-white/10 p-4 sm:p-4.5 shadow-sm hover:shadow-md hover:border-[#0032ab]/40 hover:-translate-y-0.5 transition-all duration-300 flex items-start gap-3.5 overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#4f6ef7] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-[#4f6ef7] to-[#155dfc] text-white grid place-items-center shrink-0 mt-0.5 shadow-xs group-hover:scale-105 transition-transform">
                      <Lock className="h-4.5 w-4.5" />
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-navy-deep dark:text-white group-hover:text-[#0032ab] transition-colors">
                        {t('amazonSpApi.archFeature2Title', 'Token isolation vault')}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                        {t('amazonSpApi.archFeature2Desc', 'Store tokens stay isolated from public web endpoints and customer-facing uploads.')}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Real-time SLA Badges with Animated Pulses */}
                <div className="mt-5 flex flex-wrap items-center gap-2 pt-4 border-t border-slate-200/80 dark:border-white/10 text-xs">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 font-mono font-bold shadow-2xs">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    ✓ 99.98% Uptime SLA
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-[#0032ab] dark:text-[#4f6ef7] font-mono font-bold shadow-2xs">
                    <span className="h-2 w-2 rounded-full bg-[#0032ab] animate-pulse" />
                    ✓ 0 Quota Spikes
                  </span>
                </div>
              </Reveal>

              {/* Right Column: Interactive 5-Layer Stack Console */}
              <Reveal className="lg:col-span-7 min-w-0" delay={80}>
                <div className="relative rounded-3xl bg-white dark:bg-[#0b132b] p-5 sm:p-7 border border-[#0032ab]/18 shadow-2xl shadow-[#0032ab]/08 backdrop-blur-xl overflow-hidden">
                  {/* Subtle Blueprint Micro-Grid */}
                  <div className="absolute inset-0 bg-[radial-gradient(#0032ab_1px,transparent_1px)] [background-size:20px_20px] opacity-[0.035] pointer-events-none" />
                  <div className="absolute -top-24 -right-24 w-60 h-60 bg-gradient-to-br from-[#0032ab]/10 via-[#4f6ef7]/08 to-transparent rounded-full blur-2xl pointer-events-none" />

                  {/* Terminal Header */}
                  <div className="relative flex items-center justify-between gap-2 border-b border-slate-100 dark:border-white/08 pb-3.5 mb-3">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                      </div>
                      <span className="font-mono text-xs font-bold text-navy-deep dark:text-white ml-2 flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                        ARCHITECTURE COCKPIT // v2.6
                      </span>
                    </div>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#0032ab]/08 dark:bg-[#4f6ef7]/15 text-[#0032ab] dark:text-[#4f6ef7] border border-[#0032ab]/20 shadow-2xs">
                      <Cpu className="h-3.5 w-3.5 animate-spin" /> Active Pipeline
                    </span>
                  </div>

                  {/* 5 Stack Layers (Interactive Selection) */}
                  <div className="relative space-y-2.5">
                    {archLayers.map((layer, idx) => {
                      const isSelected = activeArchLayer === idx;
                      return (
                        <div
                          key={layer.num}
                          onClick={() => setActiveArchLayer(idx)}
                          className={`group relative p-3.5 sm:p-4 rounded-2xl cursor-pointer transition-all duration-300 border ${
                            isSelected
                              ? "bg-gradient-to-r from-blue-50/80 via-white to-blue-50/40 dark:bg-white/08 border-[#0032ab] dark:border-[#4f6ef7] shadow-md shadow-[#0032ab]/08 ring-2 ring-[#0032ab]/15"
                              : "bg-white dark:bg-transparent border-slate-200/80 dark:border-white/06 hover:border-[#0032ab]/40 hover:bg-slate-50/70 hover:-translate-y-0.5 hover:shadow-2xs"
                          }`}
                        >
                          {/* Active Left Indicator Bar */}
                          {isSelected && (
                            <div className="absolute left-0 top-3 bottom-3 w-1 rounded-r-full bg-gradient-to-b from-[#0032ab] to-[#155dfc]" />
                          )}

                          <div className="flex items-center gap-3">
                            <span
                              className={`h-9 w-9 rounded-xl bg-gradient-to-br ${layer.accent} text-white text-xs font-mono font-bold grid place-items-center shrink-0 shadow-xs group-hover:scale-105 transition-transform`}
                            >
                              {layer.num}
                            </span>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <h4 className="text-xs sm:text-sm font-bold text-navy-deep dark:text-white truncate group-hover:text-[#0032ab] transition-colors">
                                  {layer.title}
                                </h4>
                                <span className="font-mono text-[10px] text-slate-400 group-hover:text-[#0032ab] font-bold shrink-0 px-2 py-0.5 rounded bg-slate-100 dark:bg-white/06 border border-slate-200/60 dark:border-white/08">
                                  {layer.tag}
                                </span>
                              </div>
                              <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                                {layer.sub}
                              </p>
                            </div>
                          </div>

                          {/* Expanded Telemetry for Selected Layer */}
                          {isSelected && (
                            <div className="mt-3 pt-3 border-t border-[#0032ab]/15 dark:border-white/10 grid grid-cols-3 gap-2 text-[10.5px] font-mono animate-in fade-in duration-200">
                              <div className="p-2 rounded-xl bg-white/80 dark:bg-black/20 border border-slate-200/70 dark:border-white/08">
                                <span className="text-slate-400 text-[9.5px] block font-semibold">PROTOCOL</span>
                                <span className="font-bold text-navy-deep dark:text-white truncate block mt-0.5">
                                  {layer.protocol}
                                </span>
                              </div>
                              <div className="p-2 rounded-xl bg-white/80 dark:bg-black/20 border border-slate-200/70 dark:border-white/08">
                                <span className="text-slate-400 text-[9.5px] block font-semibold">TELEMETRY</span>
                                <span className="font-bold text-[#0032ab] dark:text-[#4f6ef7] truncate block mt-0.5">
                                  {layer.latency}
                                </span>
                              </div>
                              <div className="p-2 rounded-xl bg-white/80 dark:bg-black/20 border border-slate-200/70 dark:border-white/08">
                                <span className="text-slate-400 text-[9.5px] block font-semibold">SECURITY</span>
                                <span className="font-bold text-emerald-600 dark:text-emerald-400 truncate block mt-0.5">
                                  {layer.sla}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </Reveal>
            </div>
          </Container>
        </section>

        {/* ========================================================================= */}
        {/* 3. ENDPOINTS & TECHNICAL SPECS: Developer REST Explorer */}
        {/* ========================================================================= */}
        <section className="relative py-16 lg:py-24 bg-white dark:bg-[#070b19] overflow-hidden border-b border-[#0032ab]/10">
          <Container className="relative">
            <Reveal>
              <div className="max-w-3xl mb-10">
                <span className="section-badge mb-3">
                  {t('amazonSpApi.endpointsSectionBadge', 'Integration architecture')}
                </span>
                <h2 className="mt-3 text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-navy-deep dark:text-white leading-tight">
                  {t('amazonSpApi.endpointsHeading', 'Connections we support')}
                </h2>
                <p className="mt-4 text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl text-left">
                  {t('amazonSpApi.endpointsDesc', 'Gravurtastisch integrates with common commerce APIs and webhooks - we do not scrape private admin panels.')}
                </p>
              </div>
            </Reveal>

            {/* 4 Crisp Endpoints in Balanced 2x2 Grid with Developer Console Bento Styling */}
            <div className="grid md:grid-cols-2 gap-5">
              {apiEndpoints.map((ep, i) => {
                const isCopied = copiedEndpoint === ep.endpoint;
                return (
                  <Reveal key={ep.id} delay={i * 60} className="h-full">
                    <div className="group relative h-full rounded-3xl bg-white dark:bg-[#0b132b] border border-slate-200/90 dark:border-white/10 p-6 shadow-sm hover:shadow-xl hover:shadow-[#0032ab]/08 hover:border-[#0032ab]/40 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between overflow-hidden">
                      {/* Top gradient highlight on hover */}
                      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#0032ab] via-[#4f6ef7] to-[#155dfc] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                      <div>
                        {/* Header with high-contrast method badge */}
                        <div className="flex items-center justify-between gap-3 mb-3.5">
                          <h3 className="font-bold text-navy-deep dark:text-white text-base group-hover:text-[#0032ab] transition-colors">
                            {ep.name}
                          </h3>
                          <span
                            className={`px-3 py-1 rounded-full text-[10.5px] font-mono font-extrabold uppercase tracking-wider shadow-2xs flex items-center gap-1.5 ${
                              ep.method === "POST"
                                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300"
                                : ep.method === "GET"
                                ? "bg-blue-50 text-[#0032ab] dark:bg-blue-950/60 dark:text-blue-300 border border-blue-300"
                                : "bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-300"
                            }`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full animate-pulse ${
                                ep.method === "POST"
                                  ? "bg-emerald-500"
                                  : ep.method === "GET"
                                  ? "bg-[#0032ab]"
                                  : "bg-purple-500"
                              }`}
                            />
                            {ep.method}
                          </span>
                        </div>

                        {/* URL Pill with Copy Icon and interactive feedback */}
                        <div className="group/code flex items-center justify-between gap-2 p-2.5 sm:p-3 rounded-xl bg-slate-50 dark:bg-white/06 border border-slate-200/90 dark:border-white/10 group-hover:border-[#0032ab]/30 font-mono text-[11px] mb-3.5 shadow-2xs transition-colors">
                          <span className="truncate text-navy-deep dark:text-white font-mono font-medium">
                            {ep.endpoint}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopyEndpoint(ep.endpoint)}
                            className="p-1.5 rounded-lg bg-white dark:bg-navy/80 hover:bg-slate-100 dark:hover:bg-white/15 border border-slate-200/90 dark:border-white/15 text-slate-600 dark:text-slate-300 hover:text-[#0032ab] shrink-0 cursor-pointer transition-all hover:scale-105 active:scale-95 flex items-center gap-1 shadow-2xs"
                            title="Copy endpoint"
                          >
                            {isCopied ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                                <span className="text-[10px] text-emerald-600 font-bold hidden sm:inline">Copied!</span>
                              </>
                            ) : (
                              <Copy className="w-3.5 h-3.5 text-slate-500 hover:text-[#0032ab]" />
                            )}
                          </button>
                        </div>

                        {/* Description */}
                        <p className="text-xs sm:text-[13px] text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
                          {ep.purpose}
                        </p>
                      </div>

                      {/* Footer Specs with animated heartbeat */}
                      <div className="mt-6 pt-3.5 border-t border-slate-100 dark:border-white/08 flex items-center justify-between text-xs">
                        <span className="flex items-center gap-2 text-slate-500 font-mono">
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                          </span>
                          <span>Status:</span>
                          <strong className="text-[#0032ab] dark:text-[#4f6ef7] font-bold">
                            {ep.status}
                          </strong>
                        </span>
                        <span className="font-mono text-[10.5px] px-2 py-0.5 rounded bg-slate-100 dark:bg-white/06 text-slate-600 dark:text-slate-400 font-semibold border border-slate-200/80 dark:border-white/08">
                          REST 1.0 JSON
                        </span>
                      </div>
                    </div>
                  </Reveal>
                );
              })}
            </div>
          </Container>
        </section>

        {/* ========================================================================= */}
        {/* 4. COMPARISON MATRIX: Why a Unified Studio Hub Beats DIY Vendors */}
        {/* ========================================================================= */}
        <section className="relative py-16 lg:py-24 bg-[#f8f9fc] dark:bg-[#080d1e] border-b border-[#0032ab]/10 overflow-hidden">
          <Container className="relative">
            <Reveal>
              <div className="text-center max-w-3xl mx-auto mb-10">
                <span className="section-badge mb-3">
                  {t('amazonSpApi.comparisonBadge', 'Approach comparison')}
                </span>
                <h2 className="mt-3 text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-navy-deep dark:text-white leading-tight">
                  {t('amazonSpApi.comparisonHeading', 'Why a unified studio hub beats DIY vendors')}
                </h2>
                <p className="mt-4 text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl mx-auto">
                  {t('amazonSpApi.comparisonDesc', 'Compare Gravurtastisch integrations with risky manual workflows.')}
                </p>
              </div>
            </Reveal>

            {/* 4 KPI Matrix Highlights */}
            <Reveal delay={60}>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                <div className="p-4 rounded-2xl bg-white dark:bg-navy/80 border border-slate-200/90 dark:border-white/10 shadow-xs text-center">
                  <span className="text-xl sm:text-2xl font-black text-[#0032ab] dark:text-[#4f6ef7] block">
                    100%
                  </span>
                  <span className="text-[11px] font-mono text-slate-500 uppercase font-bold mt-0.5 block">
                    Proof-Gated Lock
                  </span>
                </div>
                <div className="p-4 rounded-2xl bg-white dark:bg-navy/80 border border-slate-200/90 dark:border-white/10 shadow-xs text-center">
                  <span className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 block">
                    0
                  </span>
                  <span className="text-[11px] font-mono text-slate-500 uppercase font-bold mt-0.5 block">
                    Password Leaks
                  </span>
                </div>
                <div className="p-4 rounded-2xl bg-white dark:bg-navy/80 border border-slate-200/90 dark:border-white/10 shadow-xs text-center">
                  <span className="text-xl sm:text-2xl font-black text-[#155dfc] dark:text-brand-bright block">
                    1 Hub
                  </span>
                  <span className="text-[11px] font-mono text-slate-500 uppercase font-bold mt-0.5 block">
                    Cups, Wood & Apparel
                  </span>
                </div>
                <div className="p-4 rounded-2xl bg-white dark:bg-navy/80 border border-slate-200/90 dark:border-white/10 shadow-xs text-center">
                  <span className="text-xl sm:text-2xl font-black text-[#0032ab] dark:text-[#4f6ef7] block">
                    &lt; 24h
                  </span>
                  <span className="text-[11px] font-mono text-slate-500 uppercase font-bold mt-0.5 block">
                    Tracked Dispatch
                  </span>
                </div>
              </div>
            </Reveal>

            {/* High-Contrast Modern Matrix Window */}
            <Reveal delay={100} className="w-full max-w-full min-w-0">
              <div className="w-full rounded-3xl bg-white dark:bg-[#0b132b] border border-[#0032ab]/18 shadow-xl shadow-[#0032ab]/06 overflow-hidden">
                <div className="w-full overflow-x-auto custom-table-scrollbar">
                  <table className="w-full text-left text-sm min-w-[700px]">
                    <thead className="bg-slate-100/90 dark:bg-white/06 border-b border-slate-200 dark:border-white/10 text-xs font-mono uppercase tracking-wider text-navy-deep dark:text-white">
                      <tr>
                        <th className="p-4 sm:p-5 font-bold min-w-[170px]">
                          {t('amazonSpApi.compColFeature', 'Quality feature')}
                        </th>
                        <th className="p-4 sm:p-5 text-[#0032ab] dark:text-[#4f6ef7] font-black bg-[#0032ab]/06 dark:bg-[#4f6ef7]/10 border-x border-[#0032ab]/15 min-w-[210px]">
                          {t('amazonSpApi.compColGravurtastisch', 'Gravurtastisch hub')}
                        </th>
                        <th className="p-4 sm:p-5 text-slate-500 dark:text-slate-400 font-bold min-w-[170px]">
                          {t('amazonSpApi.compColScraping', 'Manual email / freelancers')}
                        </th>
                        <th className="p-4 sm:p-5 text-slate-500 dark:text-slate-400 font-bold min-w-[170px]">
                          {t('amazonSpApi.compColSmtp', 'Generic print dropship')}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-white/06">
                      {comparisonRows.map((row, idx) => (
                        <tr
                          key={row.feature}
                          className={`hover:bg-blue-50/30 dark:hover:bg-white/03 transition-colors ${
                            idx % 2 === 0 ? "bg-white dark:bg-transparent" : "bg-slate-50/50 dark:bg-white/02"
                          }`}
                        >
                          <td className="p-4 sm:p-5 font-bold text-navy-deep dark:text-white text-xs sm:text-sm">
                            {row.feature}
                          </td>
                          <td className="p-4 sm:p-5 font-bold text-[#0032ab] dark:text-[#4f6ef7] bg-[#0032ab]/[0.03] dark:bg-[#4f6ef7]/[0.05] border-x border-[#0032ab]/12 text-xs sm:text-sm">
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="h-4 w-4 text-[#0032ab] dark:text-[#4f6ef7] shrink-0" />
                              <span>{row.gravurtastisch}</span>
                            </div>
                          </td>
                          <td className="p-4 sm:p-5 text-slate-500 dark:text-slate-400 font-medium text-xs">
                            <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400">
                              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                              <span>{row.scraping}</span>
                            </div>
                          </td>
                          <td className="p-4 sm:p-5 text-slate-500 dark:text-slate-400 font-medium text-xs">
                            <div className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400">
                              <XCircle className="h-3.5 w-3.5 shrink-0" />
                              <span>{row.smtp}</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </Reveal>
          </Container>
        </section>

        {/* ========================================================================= */}
        {/* 5. FAQ SECTION: 2-Column with Security Graphic & Frosted Accordion */}
        {/* ========================================================================= */}
        {/* 5. FAQ SECTION: 2-Column with Vector Graphic & Clean Accordion */}
        {/* ========================================================================= */}
        <section className="relative py-16 lg:py-24 bg-white dark:bg-[#070b19] border-b border-[#0032ab]/10">
          <Container>
            <div className="grid lg:grid-cols-12 gap-10 lg:gap-14 items-center">
              {/* Left Column: Studio API FAQ & Assistant Graphic */}
              <Reveal className="lg:col-span-5 xl:col-span-5">
                <div className="space-y-6">
                  {/* Clean Vector Graphic (Transparent canvas, no extra outer card border) */}
                  <div className="relative flex items-center justify-center">
                    <SpApiFaqSvg />
                  </div>

                  <div className="rounded-2xl liquid-glass border border-[#0032ab]/15 p-5 flex items-center justify-between gap-4 shadow-[0_4px_24px_rgba(0,50,171,0.06)] hover:shadow-[0_12px_32px_rgba(0,50,171,0.12)] transition-all">
                    <div className="flex items-center gap-3.5">
                      <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-[#0032ab] to-[#155dfc] text-white shadow-md shadow-[#0032ab]/25 grid place-items-center shrink-0">
                        <Headphones className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-navy-deep dark:text-white leading-tight">
                          {t('amazonSpApi.faqSupportTitle', 'Have custom integration questions?')}
                        </p>
                        <p className="text-xs text-slate-body dark:text-slate-400 leading-relaxed mt-0.5">
                          {t('amazonSpApi.faqSupportDesc', 'Our team helps with storefront onboarding.')}
                        </p>
                      </div>
                    </div>
                    <a
                      href="/#contact"
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-brand hover:text-brand-bright transition-colors shrink-0"
                    >
                      {t('amazonSpApi.faqSupportLink', 'Talk to us →')}
                    </a>
                  </div>
                </div>
              </Reveal>

              {/* Right Column: FAQs List */}
              <div className="lg:col-span-7 xl:col-span-7">
                <Reveal>
                  <div className="mb-8">
                    <span className="section-badge mb-3">
                      {t('amazonSpApi.faqBadge', 'Integration FAQ')}
                    </span>
                    <h2 className="mt-3 text-3xl sm:text-4xl lg:text-[2.75rem] font-extrabold tracking-tight text-navy-deep dark:text-white leading-[1.15]">
                      {t('amazonSpApi.faqHeading', 'Frequently asked questions')}
                    </h2>
                    <p className="mt-4 text-base text-slate-body dark:text-slate-300 leading-relaxed">
                      {t('amazonSpApi.faqDesc', 'Clear answers on connections, data security, proofs, and file handling.')}
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
                        <AccordionTrigger className="text-left hover:no-underline font-bold text-navy-deep dark:text-white text-base sm:text-lg py-4 sm:py-5 flex gap-3.5">
                          <span className="flex items-center gap-3.5">
                            <HelpCircle className="h-5 w-5 text-brand shrink-0" />
                            <span>{faq.q}</span>
                          </span>
                        </AccordionTrigger>
                        <AccordionContent className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed pb-5 pl-8.5">
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

        {/* ========================================================================= */}
        {/* 6. BOTTOM CTA BANNER: Smart, Rich Brand Launchpad */}
        {/* ========================================================================= */}
        <section className="py-10 lg:py-14">
          <Container>
            <div className="relative rounded-3xl bg-gradient-to-br from-[#eff5ff] via-[#e2edfc] to-[#d8e7fc] py-10 px-6 sm:py-12 sm:px-10 text-center shadow-xl shadow-[#0032ab]/10 border border-[#0032ab]/20 overflow-hidden text-slate-900">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(0,50,171,0.12),transparent_70%)] pointer-events-none" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(79,110,247,0.08),transparent_60%)] pointer-events-none" />

              <div className="relative inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-mono font-bold bg-white/80 text-[#0032ab] border border-[#0032ab]/20 shadow-xs mb-3">
                <span className="h-2 w-2 rounded-full bg-[#0032ab] animate-pulse" />
                <span>{t('amazonSpApi.ctaBadge', 'Zero Password Storage')}</span>
              </div>

              <h2 className="relative text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight leading-tight text-slate-900">
                {t('amazonSpApi.ctaHeading', 'Connect your store with confidence')}
              </h2>

              <p className="relative mt-2.5 text-slate-600 text-xs sm:text-sm max-w-xl mx-auto leading-relaxed">
                {t('amazonSpApi.ctaDesc', 'Proof-first custom production with secure integrations and studio-grade craft.')}
              </p>

              <div className="relative mt-6 flex flex-wrap justify-center gap-3">
                <a
                  href="/#register"
                  className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#0032ab] to-[#155dfc] hover:from-[#002685] hover:to-[#0f4ac7] px-7 py-3 text-xs sm:text-sm font-bold !text-white transition-all shadow-md shadow-[#0032ab]/30 hover:-translate-y-0.5"
                >
                  <span>{t('amazonSpApi.ctaButton', 'Place Custom Order')}</span>
                  <ArrowRight className="h-4 w-4" />
                </a>
                <a
                  href="/#pricing"
                  className="inline-flex items-center gap-2 rounded-full bg-white hover:bg-slate-50 border border-slate-200/90 shadow-xs px-6 py-3 text-xs sm:text-sm font-bold text-slate-800 hover:-translate-y-0.5 transition-all"
                >
                  <span>{t('amazonSpApi.ctaPricing', 'View pricing plans')}</span>
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

function SpApiFaqSvg() {
  return (
    <svg
      viewBox="0 0 540 450"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-auto select-none"
      role="img"
      aria-label="Gravurtastisch Studio SP-API Trust Passport and Security Enclave"
    >
      <defs>
        {/* Soft Drop Shadows */}
        <filter id="passport-shadow" x="-4%" y="-4%" width="108%" height="112%">
          <feDropShadow dx="0" dy="8" stdDeviation="10" floodColor="#0032ab" floodOpacity="0.07" />
        </filter>
        <filter id="bento-card-shadow" x="-6%" y="-6%" width="112%" height="118%">
          <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="#0032ab" floodOpacity="0.05" />
        </filter>

        {/* Medallion Gradients */}
        <linearGradient id="medallion-gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#F59E0B" />
          <stop offset="50%" stopColor="#FCD34D" />
          <stop offset="100%" stopColor="#D97706" />
        </linearGradient>
        <linearGradient id="medallion-core" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#0032ab" />
          <stop offset="100%" stopColor="#0b1736" />
        </linearGradient>

        {/* Card Header Linear Gradient */}
        <linearGradient id="passport-header-grad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#0032ab" stopOpacity="0.1" />
          <stop offset="50%" stopColor="#2563eb" stopOpacity="0.05" />
          <stop offset="100%" stopColor="#0032ab" stopOpacity="0.1" />
        </linearGradient>

        <linearGradient id="header-divider-grad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#0032ab" stopOpacity="0.05" />
          <stop offset="50%" stopColor="#0032ab" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#0032ab" stopOpacity="0.05" />
        </linearGradient>
      </defs>

      {/* ========================================================================= */}
      {/* 1. OUTER CHASSIS / PASSPORT BASE CARD */}
      {/* ========================================================================= */}
      <rect
        x="6"
        y="6"
        width="528"
        height="438"
        rx="22"
        fill="#FFFFFF"
        stroke="#0032ab"
        strokeWidth="1.2"
        strokeOpacity="0.18"
        filter="url(#passport-shadow)"
      />

      {/* Subtle top inner glow banner */}
      <path
        d="M 6 28 C 6 15.85 15.85 6 28 6 L 512 6 C 524.15 6 534 15.85 534 28 L 534 54 L 6 54 Z"
        fill="url(#passport-header-grad)"
      />

      {/* ========================================================================= */}
      {/* 2. TOP WINDOW BAR / OFFICIAL CLEARANCE HEADER */}
      {/* ========================================================================= */}
      {/* macOS status dots */}
      <circle cx="26" cy="30" r="4.5" fill="#10b981" />
      <circle cx="39" cy="30" r="4.5" fill="#3b82f6" />
      <circle cx="52" cy="30" r="4.5" fill="#06b6d4" />

      {/* Title */}
      <text x="68" y="34" fill="#0032ab" fontFamily="monospace" fontSize="9.5" fontWeight="800" letterSpacing="0.8">
        GRAVURTASTISCH // SP-API TRUST PASSPORT
      </text>

      {/* Right Verified Pill Badge */}
      <g transform="translate(382, 18)">
        <rect width="134" height="24" rx="12" fill="#ecfdf5" stroke="#a7f3d0" strokeWidth="1" />
        <circle cx="12" cy="12" r="3" fill="#10b981">
          <animate attributeName="opacity" values="1;0.4;1" dur="2s" repeatCount="indefinite" />
        </circle>
        <text x="22" y="15.5" fill="#059669" fontFamily="monospace" fontSize="8" fontWeight="800">
          TLS 1.3 · ZERO RETENTION
        </text>
      </g>

      {/* Header Divider Line */}
      <line x1="6" y1="54" x2="534" y2="54" stroke="url(#header-divider-grad)" strokeWidth="1" />

      {/* ========================================================================= */}
      {/* 3. UPPER SHOWCASE: OFFICIAL CERTIFICATION MEDALLION & SPECS */}
      {/* ========================================================================= */}
      <g transform="translate(20, 68)" filter="url(#bento-card-shadow)">
        <rect
          width="500"
          height="92"
          rx="16"
          fill="#F8FAFD"
          stroke="#0032ab"
          strokeWidth="1"
          strokeOpacity="0.14"
        />

        {/* Left Medallion Seal */}
        <g transform="translate(18, 11)">
          {/* Outer Gold Graduation Ring */}
          <circle cx="35" cy="35" r="33" fill="none" stroke="url(#medallion-gold)" strokeWidth="2" strokeDasharray="3 3" />
          <circle cx="35" cy="35" r="28" fill="url(#medallion-gold)" fillOpacity="0.15" />

          {/* Inner Sapphire Core */}
          <circle cx="35" cy="35" r="24" fill="url(#medallion-core)" stroke="url(#medallion-gold)" strokeWidth="1.5" />

          {/* Gold Vector Padlock */}
          {/* Shackle */}
          <path
            d="M 31 31 L 31 26 C 31 23.8 39 23.8 39 26 L 39 31"
            fill="none"
            stroke="url(#medallion-gold)"
            strokeWidth="2.4"
            strokeLinecap="round"
          />
          {/* Body */}
          <rect x="27" y="31" width="16" height="13" rx="3" fill="#FFFFFF" />
          {/* Keyhole */}
          <circle cx="35" cy="36.5" r="1.6" fill="#0032ab" />
          <polygon points="34,37 36,37 35.5,41 34.5,41" fill="#0032ab" />
        </g>

        {/* Right Clearance Specs */}
        <g transform="translate(100, 16)">
          <text x="0" y="14" fill="#0b132b" fontFamily="system-ui" fontSize="13" fontWeight="800">
            Amazon SP-API Official LWA Gateway
          </text>
          <text x="0" y="28" fill="#64748b" fontFamily="monospace" fontSize="8" fontWeight="600">
            DIRECT TOKENIZED SELLER API · ZERO THIRD-PARTY SCRAPING
          </text>

          <line x1="0" y1="36" x2="385" y2="36" stroke="#0032ab" strokeWidth="0.6" strokeOpacity="0.12" />

          {/* 3 Inline Verification Badges */}
          <g transform="translate(0, 48)">
            {/* Tag 1 */}
            <g transform="translate(0, 0)">
              <rect width="118" height="20" rx="6" fill="#FFFFFF" stroke="#0032ab" strokeWidth="0.8" strokeOpacity="0.2" />
              <path d="M 8 10 L 11 13 L 16 8" fill="none" stroke="#059669" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              <text x="21" y="13.5" fill="#0032ab" fontFamily="monospace" fontSize="8" fontWeight="700">
                OAuth 2.0 Auth
              </text>
            </g>

            {/* Tag 2 */}
            <g transform="translate(126, 0)">
              <rect width="124" height="20" rx="6" fill="#FFFFFF" stroke="#0032ab" strokeWidth="0.8" strokeOpacity="0.2" />
              <path d="M 8 10 L 11 13 L 16 8" fill="none" stroke="#059669" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              <text x="21" y="13.5" fill="#0032ab" fontFamily="monospace" fontSize="8" fontWeight="700">
                AES-256 SigV4 KMS
              </text>
            </g>

            {/* Tag 3 */}
            <g transform="translate(258, 0)">
              <rect width="126" height="20" rx="6" fill="#FFFFFF" stroke="#0032ab" strokeWidth="0.8" strokeOpacity="0.2" />
              <path d="M 8 10 L 11 13 L 16 8" fill="none" stroke="#059669" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              <text x="21" y="13.5" fill="#059669" fontFamily="monospace" fontSize="8" fontWeight="700">
                GDPR Auto-Purge
              </text>
            </g>
          </g>
        </g>
      </g>

      {/* ========================================================================= */}
      {/* 4. SYMMETRICAL 2x2 BENTO GRID: 4 CORE TRUST PILLARS */}
      {/* ========================================================================= */}

      {/* PILLAR 1: Top-Left (x: 20, y: 172) -> Zero Password Storage */}
      <g transform="translate(20, 172)" filter="url(#bento-card-shadow)">
        <rect width="242" height="86" rx="14" fill="#FFFFFF" stroke="#0032ab" strokeWidth="1" strokeOpacity="0.16" />
        
        {/* Vector Key Icon Tile */}
        <g transform="translate(12, 12)">
          <rect width="36" height="36" rx="10" fill="#eff6ff" stroke="#bfdbfe" strokeWidth="1" />
          <circle cx="16" cy="16" r="6" fill="none" stroke="#0032ab" strokeWidth="1.8" />
          <line x1="20.5" y1="20.5" x2="28" y2="28" stroke="#0032ab" strokeWidth="2" strokeLinecap="round" />
          <line x1="24.5" y1="24.5" x2="27" y2="22" stroke="#0032ab" strokeWidth="1.8" strokeLinecap="round" />
        </g>

        {/* Text Details */}
        <g transform="translate(56, 14)">
          <text x="0" y="12" fill="#0b132b" fontFamily="system-ui" fontSize="11" fontWeight="800">
            Zero Password Storage
          </text>
          <text x="0" y="26" fill="#64748b" fontFamily="system-ui" fontSize="8.5">
            Seller Login with Amazon token flow
          </text>

          {/* Micro Pill Badge */}
          <g transform="translate(0, 36)">
            <rect width="144" height="18" rx="6" fill="#ecfdf5" stroke="#a7f3d0" strokeWidth="0.8" />
            <text x="7" y="12.5" fill="#059669" fontFamily="monospace" fontSize="7.5" fontWeight="800">
              ✓ 0 Passwords in Database
            </text>
          </g>
        </g>
      </g>

      {/* PILLAR 2: Top-Right (x: 278, y: 172) -> 300 DPI Vector Guard */}
      <g transform="translate(278, 172)" filter="url(#bento-card-shadow)">
        <rect width="242" height="86" rx="14" fill="#FFFFFF" stroke="#0032ab" strokeWidth="1" strokeOpacity="0.16" />

        {/* Vector Crosshair / Target Icon Tile */}
        <g transform="translate(12, 12)">
          <rect width="36" height="36" rx="10" fill="#eff6ff" stroke="#bfdbfe" strokeWidth="1" />
          <circle cx="18" cy="18" r="8" fill="none" stroke="#2563eb" strokeWidth="1.8" />
          <circle cx="18" cy="18" r="3" fill="#2563eb" />
          <line x1="18" y1="6" x2="18" y2="10" stroke="#2563eb" strokeWidth="1.8" strokeLinecap="round" />
          <line x1="18" y1="26" x2="18" y2="30" stroke="#2563eb" strokeWidth="1.8" strokeLinecap="round" />
          <line x1="6" y1="18" x2="10" y2="18" stroke="#2563eb" strokeWidth="1.8" strokeLinecap="round" />
          <line x1="26" y1="18" x2="30" y2="18" stroke="#2563eb" strokeWidth="1.8" strokeLinecap="round" />
        </g>

        {/* Text Details */}
        <g transform="translate(56, 14)">
          <text x="0" y="12" fill="#0b132b" fontFamily="system-ui" fontSize="11" fontWeight="800">
            300 DPI Vector Guard
          </text>
          <text x="0" y="26" fill="#64748b" fontFamily="system-ui" fontSize="8.5">
            Automatic lock before engraving run
          </text>

          {/* Micro Pill Badge */}
          <g transform="translate(0, 36)">
            <rect width="144" height="18" rx="6" fill="#eff6ff" stroke="#bfdbfe" strokeWidth="0.8" />
            <text x="7" y="12.5" fill="#0032ab" fontFamily="monospace" fontSize="7.5" fontWeight="800">
              ✓ 0 Misprints Guaranteed
            </text>
          </g>
        </g>
      </g>

      {/* PILLAR 3: Bottom-Left (x: 20, y: 270) -> GDPR Auto-Purge 30D */}
      <g transform="translate(20, 270)" filter="url(#bento-card-shadow)">
        <rect width="242" height="86" rx="14" fill="#FFFFFF" stroke="#0032ab" strokeWidth="1" strokeOpacity="0.16" />

        {/* Vector Shield Check Icon Tile */}
        <g transform="translate(12, 12)">
          <rect width="36" height="36" rx="10" fill="#f0fdf4" stroke="#bbf7d0" strokeWidth="1" />
          <path d="M 18 7 L 27 11 C 27 19.5 22.5 24.5 18 27 C 13.5 24.5 9 19.5 9 11 Z" fill="#ecfdf5" stroke="#059669" strokeWidth="1.8" />
          <path d="M 14.5 16.5 L 17 19 L 21.5 14" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </g>

        {/* Text Details */}
        <g transform="translate(56, 14)">
          <text x="0" y="12" fill="#0b132b" fontFamily="system-ui" fontSize="11" fontWeight="800">
            GDPR Auto-Purge 30D
          </text>
          <text x="0" y="26" fill="#64748b" fontFamily="system-ui" fontSize="8.5">
            Buyer shipping PII wiped clean
          </text>

          {/* Micro Pill Badge */}
          <g transform="translate(0, 36)">
            <rect width="144" height="18" rx="6" fill="#ecfdf5" stroke="#a7f3d0" strokeWidth="0.8" />
            <text x="7" y="12.5" fill="#059669" fontFamily="monospace" fontSize="7.5" fontWeight="800">
              ✓ Cryptographic Shred
            </text>
          </g>
        </g>
      </g>

      {/* PILLAR 4: Bottom-Right (x: 278, y: 270) -> 1-Click Access Revocation */}
      <g transform="translate(278, 270)" filter="url(#bento-card-shadow)">
        <rect width="242" height="86" rx="14" fill="#FFFFFF" stroke="#0032ab" strokeWidth="1" strokeOpacity="0.16" />

        {/* Vector Power / Cut Switch Icon Tile */}
        <g transform="translate(12, 12)">
          <rect width="36" height="36" rx="10" fill="#fef2f2" stroke="#fecaca" strokeWidth="1" />
          <path d="M 13.5 13 A 6.5 6.5 0 1 0 22.5 13" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" />
          <line x1="18" y1="8" x2="18" y2="16" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" />
        </g>

        {/* Text Details */}
        <g transform="translate(56, 14)">
          <text x="0" y="12" fill="#0b132b" fontFamily="system-ui" fontSize="11" fontWeight="800">
            1-Click Revocation
          </text>
          <text x="0" y="26" fill="#64748b" fontFamily="system-ui" fontSize="8.5">
            Instant sever via Seller Central
          </text>

          {/* Micro Pill Badge */}
          <g transform="translate(0, 36)">
            <rect width="144" height="18" rx="6" fill="#fef2f2" stroke="#fecaca" strokeWidth="0.8" />
            <text x="7" y="12.5" fill="#dc2626" fontFamily="monospace" fontSize="7.5" fontWeight="800">
              ✓ Zero Lock-In Contract
            </text>
          </g>
        </g>
      </g>

      {/* ========================================================================= */}
      {/* 5. BOTTOM TELEMETRY STATUS RIBBON */}
      {/* ========================================================================= */}
      <g transform="translate(20, 368)" filter="url(#bento-card-shadow)">
        <rect
          width="500"
          height="54"
          rx="14"
          fill="#F8FAFD"
          stroke="#0032ab"
          strokeWidth="1"
          strokeOpacity="0.16"
        />

        {/* Col 1: System Status */}
        <g transform="translate(16, 14)">
          <text x="0" y="10" fill="#64748b" fontFamily="system-ui" fontSize="7.5" fontWeight="bold">
            SYSTEM STATUS
          </text>
          <circle cx="5" cy="22" r="3" fill="#10b981">
            <animate attributeName="opacity" values="1;0.4;1" dur="1.8s" repeatCount="indefinite" />
          </circle>
          <text x="14" y="25" fill="#059669" fontFamily="monospace" fontSize="9.5" fontWeight="800">
            ALL ENCLAVES ACTIVE
          </text>
        </g>

        <line x1="175" y1="12" x2="175" y2="42" stroke="#0032ab" strokeWidth="0.6" strokeOpacity="0.15" />

        {/* Col 2: SLA & Latency */}
        <g transform="translate(190, 14)">
          <text x="0" y="10" fill="#64748b" fontFamily="system-ui" fontSize="7.5" fontWeight="bold">
            UPTIME & INTEGRITY
          </text>
          <text x="0" y="25" fill="#0032ab" fontFamily="monospace" fontSize="9.5" fontWeight="800">
            99.99% SLA · ZERO-LAG
          </text>
        </g>

        <line x1="335" y1="12" x2="335" y2="42" stroke="#0032ab" strokeWidth="0.6" strokeOpacity="0.15" />

        {/* Col 3: Hardware Signing */}
        <g transform="translate(350, 14)">
          <text x="0" y="10" fill="#64748b" fontFamily="system-ui" fontSize="7.5" fontWeight="bold">
            HARDWARE KMS ENCLAVE
          </text>
          <text x="0" y="25" fill="#2563eb" fontFamily="monospace" fontSize="9.5" fontWeight="800">
            AWS SigV4 ISOLATED
          </text>
        </g>
      </g>
    </svg>
  );
}

function AmazonSpApiHeroSvg() {
  return (
    <div className="w-full select-none">
      {/* Top macOS Style Terminal Bar */}
      <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-slate-100 dark:border-white/08 text-xs font-mono">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <span className="w-3 h-3 rounded-full bg-rose-400" />
            <span className="w-3 h-3 rounded-full bg-amber-400" />
            <span className="w-3 h-3 rounded-full bg-emerald-400" />
          </div>
          <span className="text-slate-500 font-bold ml-2 hidden sm:inline">
            gravurtastisch-studio-hub // pipeline.ts
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            STUDIO API · 200 OK
          </span>
        </div>
      </div>

      {/* 3-Stage Connected Pipeline Visual Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        {/* Node 1: Storefront Inflow */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/03 border border-slate-200/80 dark:border-white/06 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-[#0032ab] text-white grid place-items-center text-xs font-bold">
                a
              </div>
              <span className="text-xs font-bold text-navy-deep dark:text-white">
                Storefront Inflow
              </span>
            </div>
            <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
              ✓ Connected
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-white dark:bg-navy/80 border border-slate-200 dark:border-white/10 text-[11px] font-mono space-y-1">
            <div className="text-slate-500">SCOPES GRANTED:</div>
            <div className="text-[#0032ab] dark:text-[#4f6ef7] font-bold">✓ orders:v0/read</div>
            <div className="text-[#0032ab] dark:text-[#4f6ef7] font-bold">✓ solicitations:v1</div>
          </div>

          <div className="p-2 rounded-xl bg-white dark:bg-navy/80 border border-slate-200 dark:border-white/10 text-[10.5px]">
            <span className="text-slate-500 block">LIVE ORDER STREAM:</span>
            <div className="flex items-center justify-between text-navy-deep dark:text-white font-mono mt-0.5">
              <span>#GT-DE-9941</span>
              <span className="text-emerald-600 font-bold">INTAKE OK</span>
            </div>
          </div>
        </div>

        {/* Node 2: Gravurtastisch Studio Core (Elevated Center) */}
        <div className="p-4 rounded-2xl bg-gradient-to-b from-[#0032ab]/06 via-white to-blue-50/20 dark:from-[#4f6ef7]/15 dark:to-navy/80 border-2 border-[#0032ab]/30 dark:border-[#4f6ef7]/40 space-y-3 shadow-md shadow-[#0032ab]/06">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-gradient-to-tr from-[#0032ab] to-[#4f6ef7] text-white grid place-items-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-navy-deep dark:text-white">
                Gravurtastisch Core
              </span>
            </div>
            <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
          </div>

          <div className="p-2.5 rounded-xl bg-white dark:bg-[#0b132b] border border-blue-200 dark:border-white/10 text-[11px] font-mono space-y-1">
            <div className="flex justify-between text-slate-500">
              <span>KMS VAULT:</span>
              <span className="text-emerald-600 font-bold">AES-256</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>RATE QUEUE:</span>
              <span className="text-[#0032ab] dark:text-[#4f6ef7] font-bold">15 req/s</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>PROOF LOCK:</span>
              <span className="text-emerald-600 font-bold">ENFORCED</span>
            </div>
          </div>

          <div className="p-2 rounded-xl bg-[#0032ab] text-white text-[10.5px] font-mono text-center font-bold shadow-xs">
            100% TOS COMPLIANT PIPELINE
          </div>
        </div>

        {/* Node 3: Doorstep Carrier Delivery */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/03 border border-slate-200/80 dark:border-white/06 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-emerald-600 text-white grid place-items-center">
                <PackageCheck className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-navy-deep dark:text-white">
                Carrier Dispatch
              </span>
            </div>
            <span className="text-[10px] font-mono text-slate-500">EU Wide</span>
          </div>

          <div className="p-2.5 rounded-xl bg-white dark:bg-navy/80 border border-slate-200 dark:border-white/10 text-[11px] space-y-1">
            <div className="flex justify-between text-slate-500 font-mono">
              <span>CARRIER:</span>
              <span className="text-navy-deep dark:text-white font-bold">DHL Express</span>
            </div>
            <div className="flex justify-between text-slate-500 font-mono">
              <span>DISPATCH:</span>
              <span className="text-emerald-600 font-bold">&lt; 24h</span>
            </div>
            <div className="flex justify-between text-slate-500 font-mono">
              <span>OPTICAL QC:</span>
              <span className="text-emerald-600 font-bold">100% PASSED</span>
            </div>
          </div>

          <div className="p-2 rounded-xl bg-white dark:bg-navy/80 border border-slate-200 dark:border-white/10 text-[10.5px] flex items-center justify-between text-slate-600 font-mono">
            <span>Tracking Push:</span>
            <span className="text-emerald-600 font-bold">Automatic</span>
          </div>
        </div>
      </div>
    </div>
  );
}
