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
  ShieldCheck,
  Lock,
  Zap,
  Server,
  KeyRound,
  CheckCircle2,
  XCircle,
  Cpu,
  Layers,
  HelpCircle,
  ArrowRight,
  Sparkles,
  ExternalLink,
  Headphones
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
  const isSkeletonPreview = typeof window !== "undefined" && window.location.search.includes("skeleton=true");

  if (isSkeletonPreview) {
    return <ServicePageSkeleton />;
  }

  const securityBadges = [
    {
      icon: ShieldCheck,
      title: t('amazonSpApi.badgeCertified'),
      desc: t('amazonSpApi.badgeCertifiedDesc'),
    },
    {
      icon: Lock,
      title: t('amazonSpApi.badgeZeroCred'),
      desc: t('amazonSpApi.badgeZeroCredDesc'),
    },
    {
      icon: KeyRound,
      title: t('amazonSpApi.badgeScoped'),
      desc: t('amazonSpApi.badgeScopedDesc'),
    },
    {
      icon: Server,
      title: t('amazonSpApi.badgeVault'),
      desc: t('amazonSpApi.badgeVaultDesc'),
    },
  ];

  const apiEndpoints = [
    {
      endpoint: "solicitations/v1/orders/{orderId}/solicitations/productReviewAndSellerFeedback",
      name: t('amazonSpApi.endpoint1Name') || "Solicitations API v1",
      purpose: t('amazonSpApi.endpoint1Purpose') || "Dispatches official, Amazon-branded buyer review and seller feedback request emails with single-click rating stars.",
      method: "POST",
      status: "Compliant",
    },
    {
      endpoint: "orders/v0/orders & orders/v0/orders/{orderId}/orderItems",
      name: t('amazonSpApi.endpoint2Name') || "Orders API v0",
      purpose: t('amazonSpApi.endpoint2Purpose') || "Retrieves order status, fulfillment channel (FBA/MFN), delivery timestamps, and SKU line items.",
      method: "GET",
      status: "Real-time",
    },
    {
      endpoint: "notifications/v1/subscriptions",
      name: t('amazonSpApi.endpoint3Name') || "Notifications API v1",
      purpose: t('amazonSpApi.endpoint3Purpose') || "Real-time SQS/EventBridge webhook ingestion for instant order delivery and status updates.",
      method: "EVENT",
      status: "Automated",
    },
    {
      endpoint: "sellers/v1/marketplaceParticipations",
      name: t('amazonSpApi.endpoint4Name') || "Marketplaces API v1",
      purpose: t('amazonSpApi.endpoint4Purpose') || "Identifies active regions and currencies across North America, Europe, Far East, and India.",
      method: "GET",
      status: "Multi-Region",
    },
  ];

  const comparisonRows = [
    {
      feature: t('amazonSpApi.compRow1Feature') || "Amazon ToS Compliance",
      reviewSnapp: t('amazonSpApi.compRow1RS') || "100% Compliant via Official studio API",
      scraping: t('amazonSpApi.compRow1Scraping') || "High Risk (Violates Amazon ToS)",
      smtp: t('amazonSpApi.compRow1Smtp') || "Risky (Subject to buyer opt-outs)",
    },
    {
      feature: t('amazonSpApi.compRow2Feature') || "Buyer Email Access Required",
      reviewSnapp: t('amazonSpApi.compRow2RS') || "No (Amazon handles delivery)",
      scraping: t('amazonSpApi.compRow2Scraping') || "Yes (Exposes PII data)",
      smtp: t('amazonSpApi.compRow2Smtp') || "Yes (Requires Buyer-Seller messaging)",
    },
    {
      feature: t('amazonSpApi.compRow3Feature') || "Buyer Opt-Out Bypass",
      reviewSnapp: t('amazonSpApi.compRow3RS') || "Official Solicitations override marketing opt-outs",
      scraping: t('amazonSpApi.compRow3Scraping') || "Blocked or causes account warnings",
      smtp: t('amazonSpApi.compRow3Smtp') || "Blocked by Amazon unsubscribe flags",
    },
    {
      feature: t('amazonSpApi.compRow4Feature') || "Credential Security",
      reviewSnapp: t('amazonSpApi.compRow4RS') || "OAuth 2.0 LWA with Encrypted Vault",
      scraping: t('amazonSpApi.compRow4Scraping') || "Stores plain passwords / cookies",
      smtp: t('amazonSpApi.compRow4Smtp') || "Requires SMTP credentials",
    },
    {
      feature: t('amazonSpApi.compRow5Feature') || "Amazon Seller Account Risk",
      reviewSnapp: t('amazonSpApi.compRow5RS') || "Zero risk (Approved API integration)",
      scraping: t('amazonSpApi.compRow5Scraping') || "Severe risk of account suspension",
      smtp: t('amazonSpApi.compRow5Smtp') || "Risk of messaging restriction strikes",
    },
  ];

  const faqs = [
    {
      q: t('amazonSpApi.faq1Q') || "How does Gravurtastisch authenticate with my Amazon account?",
      a: t('amazonSpApi.faq1A') || "Gravurtastisch uses Login with Amazon (LWA) OAuth 2.0 authorization. When connecting, you are securely redirected to Amazon order desk where you authorize Gravurtastisch. We never see or store your primary Amazon password.",
    },
    {
      q: t('amazonSpApi.faq2Q') || "Can Gravurtastisch cause my Amazon account to be flagged?",
      a: t('amazonSpApi.faq2A') || "No. Gravurtastisch only uses Amazon's official Solicitations API endpoint (`createProductReviewAndSellerFeedbackSolicitation`). Because Amazon generates and delivers the standardized email template directly to the customer, there is zero risk of policy violation or template manipulation.",
    },
    {
      q: t('amazonSpApi.faq3Q') || "What permissions does Gravurtastisch need?",
      a: t('amazonSpApi.faq3A') || "Gravurtastisch only requests read access to Order Metadata (to know when an order was delivered) and permission to trigger the Review Solicitation endpoint. We do not require access to your finances, inventory pricing, or sensitive buyer PII.",
    },
    {
      q: t('amazonSpApi.faq4Q') || "Can I revoke Gravurtastisch's access at any time?",
      a: t('amazonSpApi.faq4A') || "Yes. You maintain 100% control. You can revoke access at any time directly in your Amazon order desk under 'Manage Your Apps'.",
    },
  ];

  return (
    <div className="min-h-screen bg-background text-navy-deep">
      <Nav />

      <main className="pb-8">
        {/* Hero Section */}
        <section className="relative overflow-hidden pt-24 pb-8 lg:pt-28 lg:pb-10 bg-gradient-to-b from-navy-deep via-navy to-navy-soft text-white">
          <div className="absolute inset-0 grid-bg opacity-40 pointer-events-none" />
          <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-brand/20 blur-3xl pointer-events-none" />

          <Container className="relative">
            <div className="grid lg:grid-cols-12 gap-10 lg:gap-12 items-center">
              <Reveal className="lg:col-span-6 xl:col-span-6">
                <div className="inline-flex items-center gap-2 rounded-full bg-brand/20 border border-brand/40 px-3.5 py-1 text-xs font-semibold text-brand-bright mb-4">
                  <Sparkles className="h-3.5 w-3.5" />
                  {t('amazonSpApi.heroBadge')}
                </div>
                <h1 className="text-4xl sm:text-5xl lg:text-[3.25rem] font-extrabold tracking-tight leading-[1.1]">
                  {t('amazonSpApi.heroTitle')} <span className="text-brand-bright">{t('amazonSpApi.heroTitleHighlight')}</span>
                </h1>
                <p className="mt-4 text-white/70 text-base sm:text-lg leading-relaxed max-w-xl">
                  {t('amazonSpApi.heroDesc')}
                </p>
                <div className="mt-6 flex flex-wrap gap-4">
                  <a
                    href="/#register"
                    className="inline-flex items-center gap-2 rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-brand/30 hover:bg-brand-bright hover:-translate-y-0.5 transition-all"
                  >
                    {t('amazonSpApi.heroCtaRegister')}
                    <ArrowRight className="h-4 w-4" />
                  </a>
                  <a
                    href="#architecture"
                    className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/20 px-6 py-3 text-sm font-semibold text-white hover:bg-white/20 transition-all"
                  >
                    {t('amazonSpApi.heroCtaArch')}
                  </a>
                </div>
              </Reveal>

              <Reveal className="lg:col-span-6 xl:col-span-6 relative" delay={120}>
                <div className="relative max-w-lg mx-auto lg:max-w-none">
                  {/* Subtle Glow Backdrop */}
                  <div className="absolute -inset-2 bg-gradient-to-r from-brand/20 via-sky-400/20 to-indigo-500/15 rounded-3xl blur-xl opacity-60 pointer-events-none" />

                  {/* Animated SVG Container (Clean White Background) */}
                  <div className="relative rounded-2xl bg-white border border-slate-200/80 p-1.5 sm:p-2.5 shadow-2xl overflow-hidden">
                    <AmazonSpApiHeroSvg />
                  </div>

                  {/* Floating Micro-Badges (White Card Style - hidden on small mobile to avoid overflow) */}
                  <div className="hidden sm:flex absolute -top-3 -left-4 bg-white border border-slate-200 rounded-xl px-3 py-1.5 shadow-lg items-center gap-2 backdrop-blur-md">
                    <div className="h-6 w-6 rounded-lg bg-emerald-50 text-emerald-600 grid place-items-center">
                      <ShieldCheck className="h-3.5 w-3.5" />
                    </div>
                    <div className="text-left">
                      <p className="text-[11px] font-bold text-slate-900 leading-tight">{t('amazonSpApi.badgeCertified') || "studio API v1 Certified"}</p>
                      <p className="text-[10px] text-emerald-600 font-mono font-semibold">{t('amazonSpApi.badgePolicySafe') || "100% Policy-Compliant"}</p>
                    </div>
                  </div>

                  <div className="hidden sm:flex absolute -bottom-3 -right-4 bg-white border border-slate-200 rounded-xl px-3 py-1.5 shadow-lg items-center gap-2 backdrop-blur-md">
                    <div className="h-6 w-6 rounded-lg bg-blue-50 text-brand grid place-items-center">
                      <Lock className="h-3.5 w-3.5" />
                    </div>
                    <div className="text-left">
                      <p className="text-[11px] font-bold text-slate-900 leading-tight">{t('amazonSpApi.badgeOauthVault') || "OAuth 2.0 LWA Vault"}</p>
                      <p className="text-[10px] text-slate-500 font-mono">AES-256 GCM</p>
                    </div>
                  </div>
                </div>
              </Reveal>
            </div>

            {/* Badges Grid */}
            <div className="mt-8 sm:mt-10 grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 border-t border-white/10 pt-6">
              {securityBadges.map((badge, idx) => {
                const Icon = badge.icon;
                return (
                  <Reveal key={badge.title} delay={idx * 60}>
                    <div className="h-full rounded-2xl bg-white/[0.04] border border-white/10 p-5 backdrop-blur-sm hover:border-brand/50 transition-colors">
                      <div className="h-10 w-10 rounded-xl bg-brand/20 text-brand-bright grid place-items-center mb-3">
                        <Icon className="h-5 w-5" />
                      </div>
                      <h3 className="text-base font-bold text-white mb-1.5">{badge.title}</h3>
                      <p className="text-xs sm:text-sm text-white/60 leading-relaxed">{badge.desc}</p>
                    </div>
                  </Reveal>
                );
              })}
            </div>
          </Container>
        </section>

        {/* 5-Layer Stack Architecture */}
        <section id="architecture" className="py-10 lg:py-14 bg-surface border-b border-border">
          <Container>
            <div className="grid lg:grid-cols-12 gap-8 lg:gap-10 items-center">
              <Reveal className="lg:col-span-5 min-w-0">
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-brand">
                  {t('amazonSpApi.archSectionBadge')}
                </span>
                <h2 className="mt-3 text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-navy-deep leading-tight">
                  {t('amazonSpApi.archHeading')}
                </h2>
                <p className="mt-3 text-slate-body leading-relaxed text-sm sm:text-base">
                  {t('amazonSpApi.archDesc')}
                </p>

                <div className="mt-6 space-y-3.5">
                  <div className="flex items-start gap-3.5 p-3.5 sm:p-4 rounded-xl bg-white border border-border">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-bold text-navy-deep">{t('amazonSpApi.archFeature1Title') || "AWS SigV4 Authentication"}</h4>
                      <p className="text-xs text-slate-body mt-0.5 leading-relaxed">{t('amazonSpApi.archFeature1Desc') || "Every request is signed using AWS Signature Version 4 with time-limited tokens."}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3.5 p-3.5 sm:p-4 rounded-xl bg-white border border-border">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-bold text-navy-deep">{t('amazonSpApi.archFeature2Title') || "Token Isolation Vault"}</h4>
                      <p className="text-xs text-slate-body mt-0.5 leading-relaxed">{t('amazonSpApi.archFeature2Desc') || "Tokens live in a dedicated KMS-backed memory enclave, isolated from public web endpoints."}</p>
                    </div>
                  </div>
                </div>
              </Reveal>

              <Reveal className="lg:col-span-7 min-w-0" delay={100}>
                <div className="rounded-3xl bg-navy-deep p-4 sm:p-6 lg:p-8 text-white border border-white/10 shadow-xl space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3 mb-3">
                    <span className="font-mono text-xs text-white/50">ARCH-DIAGRAM // v2.4</span>
                    <span className="inline-flex items-center gap-1.5 text-xs text-brand-bright font-semibold">
                      <Cpu className="h-3.5 w-3.5 shrink-0" /> Active studio API Pipeline
                    </span>
                  </div>

                  {[
                    { num: "01", title: t('amazonSpApi.archLayer1Title') || "Amazon Buyer Touchpoint", sub: t('amazonSpApi.archLayer1Sub') || "Official Amazon-rendered template with verified 1-click star rating UI", tag: ".io" },
                    { num: "02", title: t('amazonSpApi.archLayer2Title') || "Delivery API Gateway", sub: t('amazonSpApi.archLayer2Sub') || "Dispatches review solicitations via official solicitations/v1 endpoint", tag: ".api" },
                    { num: "03", title: t('amazonSpApi.archLayer3Title') || "Rate-Shaped Queue Worker", sub: t('amazonSpApi.archLayer3Sub') || "Strict throttling to prevent Studio production API 429 quota exceed errors", tag: ".queue" },
                    { num: "04", title: t('amazonSpApi.archLayer4Title') || "Two-Way Order Sync Engine", sub: t('amazonSpApi.archLayer4Sub') || "Continuous order status, delivery timestamp, and refund event polling", tag: ".sync" },
                    { num: "05", title: t('amazonSpApi.archLayer5Title') || "KMS Credential Vault", sub: t('amazonSpApi.archLayer5Sub') || "AES-256 encrypted OAuth refresh tokens with automated key rotation", tag: ".vault" },
                  ].map((layer) => (
                    <div
                      key={layer.num}
                      className="flex items-center gap-3 sm:gap-4 rounded-xl bg-white/[0.04] border border-white/10 p-3 sm:p-3.5 transition-all hover:border-brand/40 hover:bg-white/[0.07]"
                    >
                      <span className="grid place-items-center h-8 w-8 rounded-lg bg-brand/20 text-brand-bright text-xs font-mono font-bold shrink-0">
                        {layer.num}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-white leading-snug">{layer.title}</p>
                        <p className="text-xs text-white/60 leading-relaxed mt-0.5">{layer.sub}</p>
                      </div>
                      <span className="font-mono text-[11px] text-white/40 hidden sm:inline shrink-0">{layer.tag}</span>
                    </div>
                  ))}
                </div>
              </Reveal>
            </div>
          </Container>
        </section>

        {/* Endpoints & Technical Specs */}
        <section className="py-10 lg:py-14 bg-white">
          <Container>
            <Reveal>
              <div className="max-w-2xl mb-8">
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-brand">
                  {t('amazonSpApi.endpointsSectionBadge')}
                </span>
                <h2 className="mt-3 text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-navy-deep leading-tight">
                  {t('amazonSpApi.endpointsHeading')}
                </h2>
                <p className="mt-2 text-slate-body text-sm sm:text-base">
                  {t('amazonSpApi.endpointsDesc') || "Gravurtastisch uses only approved Amazon Selling Partner API endpoints. We never scrape HTML or reverse-engineer private APIs."}
                </p>
              </div>
            </Reveal>

            <div className="grid md:grid-cols-2 gap-5">
              {apiEndpoints.map((ep, i) => (
                <Reveal key={ep.name} delay={i * 50} className="h-full">
                  <div className="rounded-2xl border border-border bg-surface p-4 sm:p-5 lg:p-6 h-full flex flex-col justify-between hover:shadow-md transition-shadow">
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className="font-bold text-navy-deep text-base truncate">{ep.name}</span>
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-brand/10 text-brand shrink-0">
                          {ep.method}
                        </span>
                      </div>
                      <div className="rounded-lg bg-slate-900 text-slate-200 font-mono text-[11px] p-2.5 mb-3 overflow-x-auto break-all whitespace-pre-wrap">
                        {ep.endpoint}
                      </div>
                      <p className="text-xs sm:text-sm text-slate-body leading-relaxed">{ep.purpose}</p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-xs text-slate-body">
                      <span>Status: <strong className="text-emerald-600 font-semibold">{ep.status}</strong></span>
                      <span className="text-slate-400">AWS REST v1</span>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </Container>
        </section>

        {/* Comparison Table: Official studio API vs Scraping vs SMTP */}
        <section className="py-10 lg:py-14 bg-surface-alt border-y border-border">
          <Container>
            <Reveal>
              <div className="text-center max-w-3xl mx-auto mb-8">
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-brand">
                  {t('amazonSpApi.comparisonBadge')}
                </span>
                <h2 className="mt-3 text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-navy-deep leading-tight">
                  {t('amazonSpApi.comparisonHeading')}
                </h2>
                <p className="mt-2 text-slate-body text-sm sm:text-base">
                  {t('amazonSpApi.comparisonDesc') || "Compare official Selling Partner API automation with risky legacy alternatives."}
                </p>
              </div>
            </Reveal>

            <Reveal delay={100} className="min-w-0">
              <div className="overflow-x-auto rounded-2xl border border-border bg-white shadow-sm">
                <table className="w-full text-left text-sm min-w-[580px] sm:min-w-[640px]">
                  <thead className="bg-navy-deep text-white text-xs uppercase tracking-wider">
                    <tr>
                      <th className="p-3.5 sm:p-4">{t('amazonSpApi.compColFeature') || "Security Feature"}</th>
                      <th className="p-3.5 sm:p-4 text-brand-bright">{t('amazonSpApi.compColGravurtastisch') || "Gravurtastisch (studio API)"}</th>
                      <th className="p-3.5 sm:p-4 text-slate-300">{t('amazonSpApi.compColScraping') || "Web Scraping / Extensions"}</th>
                      <th className="p-3.5 sm:p-4 text-slate-300">{t('amazonSpApi.compColSmtp') || "SMTP Buyer Messaging"}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {comparisonRows.map((row, idx) => (
                      <tr key={row.feature} className={idx % 2 === 0 ? "bg-white" : "bg-slate-50/50"}>
                        <td className="p-3.5 sm:p-4 font-semibold text-navy-deep">{row.feature}</td>
                        <td className="p-3.5 sm:p-4 text-brand font-bold bg-brand/5 flex items-center gap-1.5">
                          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                          {row.reviewSnapp}
                        </td>
                        <td className="p-3.5 sm:p-4 text-rose-600 font-medium">{row.scraping}</td>
                        <td className="p-3.5 sm:p-4 text-amber-700 font-medium">{row.smtp}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Reveal>
          </Container>
        </section>

        {/* FAQ Section (2-Column: Left SVG, Right FAQs) */}
        <section className="py-10 lg:py-14 bg-white border-b border-border">
          <Container>
            <div className="grid lg:grid-cols-12 gap-8 lg:gap-10 lg:gap-14 items-center">
              {/* Left Column: studio API FAQ & Security Assistant Vector Illustration */}
              <Reveal className="lg:col-span-5 xl:col-span-5">
                <div className="space-y-5">
                  {/* Clean Vector Graphic (No card background, border, or shadow) */}
                  <div className="relative flex items-center justify-center">
                    <SpApiFaqSvg />
                  </div>

                  <div className="rounded-2xl bg-surface border border-border p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-brand/10 text-brand grid place-items-center shrink-0">
                        <Headphones className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-navy-deep leading-tight">{t('amazonSpApi.faqSupportTitle') || "Have custom API questions?"}</p>
                        <p className="text-[11px] text-slate-body leading-relaxed mt-0.5">{t('amazonSpApi.faqSupportDesc') || "Our team assists with order desk onboarding."}</p>
                      </div>
                    </div>
                    <a
                      href="/#contact"
                      className="inline-flex items-center gap-1 text-xs font-bold text-brand hover:text-brand-bright transition-colors shrink-0 self-start sm:self-auto"
                    >
                      {t('amazonSpApi.faqSupportLink') || "Talk to us →"}
                    </a>
                  </div>
                </div>
              </Reveal>

              {/* Right Column: FAQs List */}
              <div className="lg:col-span-7 xl:col-span-7">
                <Reveal>
                  <div className="mb-6">
                    <span className="text-xs font-bold uppercase tracking-[0.2em] text-brand">
                      {t('amazonSpApi.faqBadge')}
                    </span>
                    <h2 className="mt-3 text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-navy-deep leading-tight">
                      {t('amazonSpApi.faqHeading')}
                    </h2>
                    <p className="mt-2 text-sm text-slate-body leading-relaxed">
                      {t('amazonSpApi.faqDesc') || "Clear answers on authorization, data security, Amazon ToS compliance, and credentials."}
                    </p>
                  </div>
                </Reveal>

                <Accordion type="single" collapsible className="w-full space-y-3.5">
                  {faqs.map((faq, idx) => (
                    <Reveal key={idx} delay={idx * 50}>
                      <AccordionItem
                        value={`faq-${idx}`}
                        className="rounded-2xl border border-border bg-surface px-5 sm:px-6 transition-colors border-b-0"
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

        {/* CTA Banner */}
        <section className="py-8 lg:py-10">
          <Container>
            <div className="rounded-3xl bg-gradient-to-br from-navy-deep via-navy-deep to-brand p-8 sm:p-12 text-white text-center shadow-xl">
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                {t('amazonSpApi.ctaHeading')}
              </h2>
              <p className="mt-3 text-white/75 text-sm sm:text-base max-w-xl mx-auto">
                {t('amazonSpApi.ctaDesc')}
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-4">
                <a
                  href="/#register"
                  className="inline-flex items-center gap-2 rounded-full bg-brand-bright px-7 py-3.5 text-sm font-bold text-navy-deep hover:bg-white transition-all shadow-lg hover:-translate-y-0.5"
                >
                  {t('amazonSpApi.ctaButton')}
                  <ArrowRight className="h-4 w-4" />
                </a>
                <a
                  href="/#pricing"
                  className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/20 px-7 py-3.5 text-sm font-semibold text-white hover:bg-white/20 transition-all"
                >
                  {t('amazonSpApi.ctaPricing') || "View Pricing Plans"}
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
      viewBox="0 0 540 480"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-auto select-none"
      role="img"
      aria-label="Enterprise Studio production API Security & Compliance Architecture Gateway"
    >
      <defs>
        {/* Soft Modern Gradients */}
        <linearGradient id="faq-spapi-card-bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#F8FAFC" />
        </linearGradient>

        <linearGradient id="faq-spapi-vault-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#0F172A" />
          <stop offset="60%" stopColor="#1E293B" />
          <stop offset="100%" stopColor="#0F172A" />
        </linearGradient>

        <linearGradient id="faq-spapi-shield-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#38BDF8" />
          <stop offset="50%" stopColor="#0284C7" />
          <stop offset="100%" stopColor="#1E3A8A" />
        </linearGradient>

        <linearGradient id="faq-spapi-emerald-badge" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#10B981" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>

        <linearGradient id="faq-spapi-brand-beam" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#3B82F6" />
          <stop offset="50%" stopColor="#60A5FA" />
          <stop offset="100%" stopColor="#10B981" />
        </linearGradient>

        {/* Soft Drop Shadows */}
        <filter id="faq-spapi-shadow" x="-8%" y="-8%" width="116%" height="120%">
          <feDropShadow dx="0" dy="6" stdDeviation="8" floodColor="#0F172A" floodOpacity="0.07" />
        </filter>

        <filter id="faq-spapi-core-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="8" stdDeviation="12" floodColor="#0284C7" floodOpacity="0.25" />
        </filter>
      </defs>

      {/* Main Base Canvas Container */}
      <rect x="8" y="8" width="524" height="464" rx="20" fill="url(#faq-spapi-card-bg)" stroke="#E2E8F0" strokeWidth="1.5" />

      {/* Subtle Background Grid & Dots */}
      <g opacity="0.4">
        {[...Array(9)].map((_, i) => (
          <line key={`fgh-${i}`} x1="8" y1={48 + i * 46} x2="532" y2={48 + i * 46} stroke="#E2E8F0" strokeWidth="1" strokeDasharray="3 3" />
        ))}
        {[...Array(11)].map((_, i) => (
          <line key={`fgv-${i}`} x1={32 + i * 46} y1="8" x2={32 + i * 46} y2="472" stroke="#E2E8F0" strokeWidth="1" strokeDasharray="3 3" />
        ))}
      </g>

      {/* Top Header Console Bar */}
      <g transform="translate(24, 22)">
        <rect width="492" height="34" rx="10" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1" />
        <circle cx="16" cy="17" r="4" fill="#EF4444" opacity="0.85" />
        <circle cx="28" cy="17" r="4" fill="#F59E0B" opacity="0.85" />
        <circle cx="40" cy="17" r="4" fill="#10B981" opacity="0.85" />

        <text x="56" y="21" fill="#475569" fontFamily="monospace" fontSize="10.5" fontWeight="700">
          studio API GATEWAY // AWS SigV4 KMS ENCLAVE
        </text>

        <rect x="360" y="7" width="120" height="20" rx="10" fill="#ECFDF5" stroke="#A7F3D0" />
        <circle cx="372" cy="17" r="3" fill="#10B981">
          <animate attributeName="opacity" values="1;0.3;1" dur="1.5s" repeatCount="indefinite" />
        </circle>
        <text x="382" y="20.5" fill="#059669" fontFamily="system-ui" fontSize="9.5" fontWeight="700">
          100% Policy-Safe
        </text>
      </g>

      {/* ==================================================== */}
      {/* 1. CONNECTING DATA PIPES WITH FLOWING ENCRYPTED PACKETS */}
      {/* ==================================================== */}
      {/* Left Node to Central Core Wire */}
      <path
        d="M 145 150 C 145 200, 210 235, 270 235"
        fill="none"
        stroke="#93C5FD"
        strokeWidth="2.5"
        strokeDasharray="6 6"
      >
        <animate attributeName="stroke-dashoffset" values="0;-24" dur="1.4s" repeatCount="indefinite" />
      </path>

      {/* Central Core to Right Node Wire */}
      <path
        d="M 270 235 C 330 235, 395 200, 395 150"
        fill="none"
        stroke="#6EE7B7"
        strokeWidth="2.5"
        strokeDasharray="6 6"
      >
        <animate attributeName="stroke-dashoffset" values="0;-24" dur="1.4s" repeatCount="indefinite" />
      </path>

      {/* Central Core to Bottom Cards Wire */}
      <path
        d="M 270 295 L 270 345"
        fill="none"
        stroke="#CBD5E1"
        strokeWidth="2"
        strokeDasharray="4 4"
      />

      {/* Flowing Energy Packets */}
      <circle cx="0" cy="0" r="4" fill="#2563EB">
        <animateMotion
          path="M 145 150 C 145 200, 210 235, 270 235"
          dur="1.8s"
          repeatCount="indefinite"
        />
        <animate attributeName="opacity" values="0.2;1;0.2" dur="1.8s" repeatCount="indefinite" />
      </circle>

      <circle cx="0" cy="0" r="4" fill="#059669">
        <animateMotion
          path="M 270 235 C 330 235, 395 200, 395 150"
          dur="1.8s"
          repeatCount="indefinite"
        />
        <animate attributeName="opacity" values="0.2;1;0.2" dur="1.8s" repeatCount="indefinite" />
      </circle>

      {/* ==================================================== */}
      {/* 2. TOP-LEFT CARD: AMAZON SELLER CENTRAL LWA AUTH */}
      {/* ==================================================== */}
      <g transform="translate(35, 75)" filter="url(#faq-spapi-shadow)">
        <rect width="215" height="110" rx="14" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1.2" />

        {/* Amazon Smile Badge */}
        <rect x="12" y="12" width="34" height="34" rx="8" fill="#FFF7ED" stroke="#FED7AA" />
        <text x="23" y="35" fill="#EA580C" fontFamily="system-ui" fontSize="18" fontWeight="900">a</text>

        <text x="54" y="24" fill="#0F172A" fontFamily="system-ui" fontSize="12" fontWeight="700">order desk LWA</text>
        <text x="54" y="38" fill="#0284C7" fontFamily="monospace" fontSize="9" fontWeight="700">OAuth 2.0 Token Handshake</text>

        {/* Divider */}
        <line x1="12" y1="54" x2="203" y2="54" stroke="#F1F5F9" strokeWidth="1" />

        {/* Status Line 1 */}
        <g transform="translate(14, 62)">
          <circle cx="4" cy="6" r="3" fill="#10B981" />
          <text x="14" y="9" fill="#334155" fontFamily="system-ui" fontSize="9.5" fontWeight="600">Zero Passwords Shared</text>
          <text x="140" y="9" fill="#059669" fontFamily="monospace" fontSize="8.5" fontWeight="700">SECURE</text>
        </g>

        {/* Status Line 2 */}
        <g transform="translate(14, 82)">
          <circle cx="4" cy="6" r="3" fill="#3B82F6" />
          <text x="14" y="9" fill="#334155" fontFamily="system-ui" fontSize="9.5" fontWeight="600">Scoped API Metadata</text>
          <text x="135" y="9" fill="#2563EB" fontFamily="monospace" fontSize="8.5" fontWeight="700">REVOCABLE</text>
        </g>
      </g>

      {/* ==================================================== */}
      {/* 3. TOP-RIGHT CARD: OFFICIAL SOLICITATIONS API */}
      {/* ==================================================== */}
      <g transform="translate(290, 75)" filter="url(#faq-spapi-shadow)">
        <rect width="215" height="110" rx="14" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1.2" />

        {/* Solicitations Star Badge */}
        <rect x="12" y="12" width="34" height="34" rx="8" fill="#ECFDF5" stroke="#A7F3D0" />
        <text x="21" y="35" fill="#059669" fontFamily="system-ui" fontSize="17">⭐</text>

        <text x="54" y="24" fill="#0F172A" fontFamily="system-ui" fontSize="12" fontWeight="700">Official Solicitations</text>
        <text x="54" y="38" fill="#059669" fontFamily="monospace" fontSize="9" fontWeight="700">solicitations/v1 API</text>

        {/* Divider */}
        <line x1="12" y1="54" x2="203" y2="54" stroke="#F1F5F9" strokeWidth="1" />

        {/* Status Line 1 */}
        <g transform="translate(14, 62)">
          <circle cx="4" cy="6" r="3" fill="#10B981" />
          <text x="14" y="9" fill="#334155" fontFamily="system-ui" fontSize="9.5" fontWeight="600">Amazon Standard Email</text>
          <text x="138" y="9" fill="#059669" fontFamily="monospace" fontSize="8.5" fontWeight="700">VERIFIED</text>
        </g>

        {/* Status Line 2 */}
        <g transform="translate(14, 82)">
          <circle cx="4" cy="6" r="3" fill="#F59E0B" />
          <text x="14" y="9" fill="#334155" fontFamily="system-ui" fontSize="9.5" fontWeight="600">1-Click Star Rating UI</text>
          <text x="135" y="9" fill="#D97706" fontFamily="monospace" fontSize="8.5" fontWeight="700">IN-BOX</text>
        </g>
      </g>

      {/* ==================================================== */}
      {/* 4. CENTRAL HIGH-SECURITY CRYPTO VAULT CORE */}
      {/* ==================================================== */}
      <g transform="translate(270, 235)" filter="url(#faq-spapi-core-glow)">
        {/* Rotating Concentric Tech Security Rings */}
        <circle cx="0" cy="0" r="56" fill="none" stroke="#93C5FD" strokeWidth="1.5" strokeDasharray="6 8">
          <animateTransform
            attributeName="transform"
            type="rotate"
            from="0"
            to="360"
            dur="24s"
            repeatCount="indefinite"
          />
        </circle>

        <circle cx="0" cy="0" r="48" fill="none" stroke="#38BDF8" strokeWidth="2" strokeDasharray="16 20">
          <animateTransform
            attributeName="transform"
            type="rotate"
            from="360"
            to="0"
            dur="18s"
            repeatCount="indefinite"
          />
        </circle>

        {/* Outer Hexagon Shield Badge */}
        <polygon
          points="0,-40 35,-20 35,20 0,40 -35,20 -35,-20"
          fill="url(#faq-spapi-vault-grad)"
          stroke="#38BDF8"
          strokeWidth="2.5"
        />

        {/* Inner Glowing Shield Vector */}
        <path
          d="M 0 -20 C 12 -20 18 -12 18 4 C 18 16 0 24 0 24 C 0 24 -18 16 -18 4 C -18 -12 -12 -20 0 -20 Z"
          fill="url(#faq-spapi-shield-grad)"
          stroke="#67E8F9"
          strokeWidth="1.5"
        />

        {/* Central Padlock Icon */}
        <g transform="translate(-8, -12)">
          <rect x="2" y="8" width="12" height="10" rx="2" fill="#FFFFFF" />
          <path d="M 4 8 L 4 5 C 4 2.8 5.8 1 8 1 C 10.2 1 12 2.8 12 5 L 12 8" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
          <circle cx="8" cy="13" r="1.5" fill="#0284C7" />
        </g>

        {/* Center Badge Pill */}
        <g transform="translate(0, 48)">
          <rect x="-65" y="-10" width="130" height="20" rx="10" fill="#0F172A" stroke="#38BDF8" strokeWidth="1" />
          <circle cx="-52" cy="0" r="2.5" fill="#10B981">
            <animate attributeName="opacity" values="1;0.2;1" dur="1.2s" repeatCount="indefinite" />
          </circle>
          <text x="4" y="3.5" textAnchor="middle" fill="#FFFFFF" fontFamily="monospace" fontSize="8.5" fontWeight="700">
            AES-256 KMS VAULT
          </text>
        </g>
      </g>

      {/* ==================================================== */}
      {/* 5. BOTTOM 3 SECURITY AUDIT SCORECARDS */}
      {/* ==================================================== */}
      <g transform="translate(24, 352)">
        {/* Card 1: Zero Scraping */}
        <g transform="translate(0, 0)" filter="url(#faq-spapi-shadow)">
          <rect width="154" height="100" rx="12" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1.2" />
          <g>
            <rect x="10" y="10" width="26" height="26" rx="6" fill="#EFF6FF" stroke="#BFDBFE" />
            <text x="18" y="27" fill="#2563EB" fontFamily="system-ui" fontSize="13" fontWeight="bold">✓</text>

            <text x="42" y="22" fill="#0F172A" fontFamily="system-ui" fontSize="10.5" fontWeight="700">Zero Scraping</text>
            <text x="42" y="32" fill="#64748B" fontFamily="system-ui" fontSize="8">No Chrome ext.</text>

            <line x1="10" y1="44" x2="144" y2="44" stroke="#F1F5F9" strokeWidth="1" />

            <text x="10" y="60" fill="#334155" fontFamily="system-ui" fontSize="8.5" fontWeight="500">Pure studio API protocol</text>
            <text x="10" y="74" fill="#334155" fontFamily="system-ui" fontSize="8.5" fontWeight="500">Zero HTML injection</text>

            <rect x="10" y="80" width="134" height="14" rx="4" fill="#F8FAFC" />
            <text x="77" y="90" textAnchor="middle" fill="#059669" fontFamily="monospace" fontSize="7.5" fontWeight="700">100% TOS COMPLIANT</text>
          </g>
        </g>

        {/* Card 2: AWS SigV4 Encryption */}
        <g transform="translate(169, 0)" filter="url(#faq-spapi-shadow)">
          <rect width="154" height="100" rx="12" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1.2" />
          <g>
            <rect x="10" y="10" width="26" height="26" rx="6" fill="#F0FDF4" stroke="#BBF7D0" />
            <text x="18" y="27" fill="#16A34A" fontFamily="system-ui" fontSize="13">🔒</text>

            <text x="42" y="22" fill="#0F172A" fontFamily="system-ui" fontSize="10.5" fontWeight="700">AWS SigV4</text>
            <text x="42" y="32" fill="#64748B" fontFamily="system-ui" fontSize="8">Signed requests</text>

            <line x1="10" y1="44" x2="144" y2="44" stroke="#F1F5F9" strokeWidth="1" />

            <text x="10" y="60" fill="#334155" fontFamily="system-ui" fontSize="8.5" fontWeight="500">KMS Key Rotation</text>
            <text x="10" y="74" fill="#334155" fontFamily="system-ui" fontSize="8.5" fontWeight="500">Isolated memory pool</text>

            <rect x="10" y="80" width="134" height="14" rx="4" fill="#F8FAFC" />
            <text x="77" y="90" textAnchor="middle" fill="#0284C7" fontFamily="monospace" fontSize="7.5" fontWeight="700">256-BIT ENCRYPTED</text>
          </g>
        </g>

        {/* Card 3: Rate Limiting & Account Safety */}
        <g transform="translate(338, 0)" filter="url(#faq-spapi-shadow)">
          <rect width="154" height="100" rx="12" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1.2" />
          <g>
            <rect x="10" y="10" width="26" height="26" rx="6" fill="#FAF5FF" stroke="#E9D5FF" />
            <text x="18" y="27" fill="#7C3AED" fontFamily="system-ui" fontSize="13">🛡️</text>

            <text x="42" y="22" fill="#0F172A" fontFamily="system-ui" fontSize="10.5" fontWeight="700">Account Safety</text>
            <text x="42" y="32" fill="#64748B" fontFamily="system-ui" fontSize="8">Rate-shaped queue</text>

            <line x1="10" y1="44" x2="144" y2="44" stroke="#F1F5F9" strokeWidth="1" />

            <text x="10" y="60" fill="#334155" fontFamily="system-ui" fontSize="8.5" fontWeight="500">Zero 429 Quota errors</text>
            <text x="10" y="74" fill="#334155" fontFamily="system-ui" fontSize="8.5" fontWeight="500">0 Policy warning strikes</text>

            <rect x="10" y="80" width="134" height="14" rx="4" fill="#F8FAFC" />
            <text x="77" y="90" textAnchor="middle" fill="#7C3AED" fontFamily="monospace" fontSize="7.5" fontWeight="700">STRIKE PROTECTION</text>
          </g>
        </g>
      </g>
    </svg>
  );
}

function AmazonSpApiHeroSvg() {
  return (
    <svg
      viewBox="0 0 700 450"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-auto select-none"
      role="img"
      aria-label="Studio production API Connected Architecture Animation"
    >
      <defs>
        <linearGradient id="spapi-white-card" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#F8FAFC" />
        </linearGradient>

        <linearGradient id="spapi-blue-header" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#2563EB" />
          <stop offset="100%" stopColor="#1D4ED8" />
        </linearGradient>

        <linearGradient id="spapi-shine-light" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0" />
          <stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.75" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>

        <filter id="spapi-soft-shadow" x="-5%" y="-5%" width="110%" height="110%">
          <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#0F172A" floodOpacity="0.06" />
        </filter>

        <clipPath id="spapi-clean-clip">
          <rect x="0" y="0" width="700" height="450" rx="14" />
        </clipPath>
      </defs>

      <g clipPath="url(#spapi-clean-clip)">
        {/* Crisp White Canvas Background */}
        <rect width="700" height="450" fill="#FFFFFF" />

        {/* Subtle Light Grid Pattern */}
        <g opacity="0.6">
          {[...Array(14)].map((_, i) => (
            <line
              key={`gh-${i}`}
              x1="0"
              y1={i * 32}
              x2="700"
              y2={i * 32}
              stroke="#F1F5F9"
              strokeWidth="1"
            />
          ))}
          {[...Array(22)].map((_, i) => (
            <line
              key={`gv-${i}`}
              x1={i * 32}
              y1="0"
              x2={i * 32}
              y2="450"
              stroke="#F1F5F9"
              strokeWidth="1"
            />
          ))}
        </g>

        {/* Top Terminal Bar (Light SaaS Style) */}
        <rect x="14" y="12" width="672" height="34" rx="8" fill="#F8FAFC" stroke="#E2E8F0" strokeWidth="1" />
        <circle cx="32" cy="29" r="4" fill="#EF4444" />
        <circle cx="45" cy="29" r="4" fill="#F59E0B" />
        <circle cx="58" cy="29" r="4" fill="#10B981" />

        <text x="76" y="33" fill="#475569" fontFamily="monospace" fontSize="10.5" fontWeight="600">
          sp-api-pipeline.ts // AWS SigV4 · OAuth 2.0 LWA
        </text>

        <rect x="548" y="20" width="126" height="18" rx="9" fill="#ECFDF5" stroke="#A7F3D0" />
        <circle cx="560" cy="29" r="3" fill="#10B981">
          <animate attributeName="opacity" values="1;0.3;1" dur="1.8s" repeatCount="indefinite" />
        </circle>
        <text x="570" y="32.5" fill="#059669" fontFamily="system-ui" fontSize="9.5" fontWeight="700">
          studio API · 200 OK
        </text>

        {/* Animated Cables Connecting Nodes */}
        {/* Left to Center Wire */}
        <path
          d="M 215 220 L 260 220"
          stroke="#3B82F6"
          strokeWidth="2.5"
          strokeDasharray="5 5"
        >
          <animate attributeName="stroke-dashoffset" values="0;-20" dur="1.2s" repeatCount="indefinite" />
        </path>

        {/* Center to Right Wire */}
        <path
          d="M 440 220 L 485 220"
          stroke="#10B981"
          strokeWidth="2.5"
          strokeDasharray="5 5"
        >
          <animate attributeName="stroke-dashoffset" values="0;-20" dur="1.2s" repeatCount="indefinite" />
        </path>

        {/* Dynamic Flowing Packet Pulses */}
        <circle cx="237" cy="220" r="3.5" fill="#2563EB">
          <animate attributeName="cx" values="215;260" dur="1.2s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.3;1;0.3" dur="1.2s" repeatCount="indefinite" />
        </circle>

        <circle cx="462" cy="220" r="3.5" fill="#059669">
          <animate attributeName="cx" values="440;485" dur="1.2s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.3;1;0.3" dur="1.2s" repeatCount="indefinite" />
        </circle>

        {/* LEFT NODE: Amazon order desk (OAuth / Orders) */}
        <g transform="translate(25, 60)" filter="url(#spapi-soft-shadow)">
          <rect width="190" height="365" rx="12" fill="url(#spapi-white-card)" stroke="#E2E8F0" strokeWidth="1.2" />

          <rect x="12" y="12" width="30" height="30" rx="6" fill="#FFF7ED" stroke="#FED7AA" />
          <text x="21" y="32" fill="#EA580C" fontFamily="system-ui" fontSize="15" fontWeight="bold">a</text>

          <text x="48" y="24" fill="#0F172A" fontFamily="system-ui" fontSize="11" fontWeight="700">Amazon Seller</text>
          <text x="48" y="37" fill="#64748B" fontFamily="system-ui" fontSize="9">order desk LWA</text>

          <rect x="12" y="52" width="166" height="24" rx="6" fill="#FFFFFF" stroke="#E2E8F0" />
          <circle cx="22" cy="64" r="3" fill="#10B981" />
          <text x="32" y="67.5" fill="#0F172A" fontFamily="monospace" fontSize="8.5" fontWeight="600">TOKEN: LWA_AUTHORIZED</text>

          <g transform="translate(12, 86)">
            <rect width="166" height="48" rx="6" fill="#FFFFFF" stroke="#E2E8F0" />
            <text x="10" y="16" fill="#0284C7" fontFamily="system-ui" fontSize="8.5" fontWeight="700">SCOPES GRANTED</text>
            <text x="10" y="30" fill="#334155" fontFamily="monospace" fontSize="8.5">✓ orders:v0/read</text>
            <text x="10" y="42" fill="#334155" fontFamily="monospace" fontSize="8.5">✓ solicitations:v1</text>
          </g>

          <g transform="translate(12, 142)">
            <rect width="166" height="46" rx="6" fill="#FFFFFF" stroke="#E2E8F0" />
            <text x="10" y="16" fill="#B45309" fontFamily="system-ui" fontSize="8.5" fontWeight="700">ACCOUNT PROTECTION</text>
            <text x="10" y="29" fill="#475569" fontFamily="system-ui" fontSize="8.5">0 Password Access</text>
            <text x="10" y="40" fill="#475569" fontFamily="system-ui" fontSize="8.5">Revocable in 1-Click</text>
          </g>

          <g transform="translate(12, 198)">
            <rect width="166" height="152" rx="6" fill="#FFFFFF" stroke="#E2E8F0" />
            <text x="10" y="16" fill="#64748B" fontFamily="system-ui" fontSize="8" fontWeight="700">REAL-TIME ORDER STREAM</text>

            <g transform="translate(10, 26)">
              <rect width="146" height="34" rx="4" fill="#F8FAFC" stroke="#F1F5F9" />
              <circle cx="8" cy="12" r="2.5" fill="#3B82F6">
                <animate attributeName="r" values="2;3.5;2" dur="1.5s" repeatCount="indefinite" />
              </circle>
              <text x="16" y="14" fill="#0F172A" fontFamily="monospace" fontSize="8" fontWeight="600">#114-8923019</text>
              <text x="16" y="26" fill="#64748B" fontFamily="system-ui" fontSize="7.5">FBA · Water Bottle</text>
              <text x="102" y="14" fill="#059669" fontFamily="monospace" fontSize="7.5" fontWeight="700">DELIVERED</text>
            </g>

            <g transform="translate(10, 66)">
              <rect width="146" height="34" rx="4" fill="#F8FAFC" stroke="#F1F5F9" />
              <circle cx="8" cy="12" r="2.5" fill="#3B82F6" />
              <text x="16" y="14" fill="#0F172A" fontFamily="monospace" fontSize="8" fontWeight="600">#402-9918231</text>
              <text x="16" y="26" fill="#64748B" fontFamily="system-ui" fontSize="7.5">FBA · Leather Wallet</text>
              <text x="102" y="14" fill="#059669" fontFamily="monospace" fontSize="7.5" fontWeight="700">DELIVERED</text>
            </g>

            <g transform="translate(10, 106)">
              <rect width="146" height="34" rx="4" fill="#F8FAFC" stroke="#F1F5F9" />
              <circle cx="8" cy="12" r="2.5" fill="#F59E0B" />
              <text x="16" y="14" fill="#0F172A" fontFamily="monospace" fontSize="8" fontWeight="600">#028-4491023</text>
              <text x="16" y="26" fill="#64748B" fontFamily="system-ui" fontSize="7.5">FBM · Yoga Mat</text>
              <text x="102" y="14" fill="#2563EB" fontFamily="monospace" fontSize="7.5" fontWeight="700">SHIPPED</text>
            </g>
          </g>
        </g>

        {/* CENTER HUB: Gravurtastisch studio API Core & Vault */}
        <g transform="translate(260, 50)" filter="url(#spapi-soft-shadow)">
          <rect width="180" height="385" rx="14" fill="#EFF6FF" stroke="#93C5FD" strokeWidth="1.5" />

          <rect x="10" y="10" width="160" height="32" rx="6" fill="url(#spapi-blue-header)" />
          <text x="90" y="30" textAnchor="middle" fill="#FFFFFF" fontFamily="system-ui" fontSize="11" fontWeight="800" letterSpacing="0.4">
            Gravurtastisch Core
          </text>

          <g transform="translate(10, 50)">
            <rect width="160" height="66" rx="6" fill="#FFFFFF" stroke="#DBEAFE" />
            <circle cx="18" cy="18" r="7" fill="#EFF6FF" stroke="#3B82F6" strokeWidth="1" />
            <text x="18" y="22" textAnchor="middle" fill="#2563EB" fontSize="9">🔒</text>

            <text x="32" y="21" fill="#0F172A" fontFamily="system-ui" fontSize="9.5" fontWeight="700">AES-256 KMS Vault</text>
            <text x="10" y="42" fill="#64748B" fontFamily="monospace" fontSize="8">Encrypted token enclave</text>
            <text x="10" y="55" fill="#059669" fontFamily="monospace" fontSize="8">● Auto-rotated keys</text>
          </g>

          <g transform="translate(10, 124)">
            <rect width="160" height="88" rx="6" fill="#FFFFFF" stroke="#DBEAFE" />
            <text x="10" y="16" fill="#0284C7" fontFamily="system-ui" fontSize="9" fontWeight="700">RATE-SHAPED QUEUE</text>
            <text x="10" y="30" fill="#64748B" fontFamily="system-ui" fontSize="8">Amazon Throttle Guard</text>

            <rect x="10" y="40" width="140" height="8" rx="4" fill="#E2E8F0" />
            <rect x="10" y="40" width="95" height="8" rx="4" fill="#2563EB">
              <animate attributeName="width" values="40;125;70;105" dur="3s" repeatCount="indefinite" />
            </rect>

            <text x="10" y="64" fill="#334155" fontFamily="monospace" fontSize="8">Capacity: 15 req/sec</text>
            <text x="10" y="78" fill="#059669" fontFamily="monospace" fontSize="8">Status: 0 Quota Spikes</text>
          </g>

          <g transform="translate(10, 220)">
            <rect width="160" height="150" rx="6" fill="#FFFFFF" stroke="#DBEAFE" />
            <text x="10" y="16" fill="#B45309" fontFamily="system-ui" fontSize="9" fontWeight="700">SOLICITATIONS ENGINE</text>

            <rect x="10" y="24" width="140" height="20" rx="4" fill="#F8FAFC" stroke="#E2E8F0" />
            <text x="14" y="37" fill="#0F172A" fontFamily="monospace" fontSize="7.5" fontWeight="600">POST /solicitations/v1</text>

            <g transform="translate(10, 56)">
              <text x="0" y="10" fill="#64748B" fontFamily="system-ui" fontSize="8">5-30 Day Window:</text>
              <text x="88" y="10" fill="#059669" fontFamily="monospace" fontSize="8" fontWeight="700">VERIFIED</text>
            </g>

            <g transform="translate(10, 78)">
              <text x="0" y="10" fill="#64748B" fontFamily="system-ui" fontSize="8">Opt-Out Safe:</text>
              <text x="88" y="10" fill="#059669" fontFamily="monospace" fontSize="8" fontWeight="700">100% TOS</text>
            </g>

            <g transform="translate(10, 100)">
              <text x="0" y="10" fill="#64748B" fontFamily="system-ui" fontSize="8">Single-Send Lock:</text>
              <text x="88" y="10" fill="#2563EB" fontFamily="monospace" fontSize="8" fontWeight="700">ENFORCED</text>
            </g>

            <g transform="translate(10, 122)">
              <text x="0" y="10" fill="#64748B" fontFamily="system-ui" fontSize="8">Timezone Align:</text>
              <text x="88" y="10" fill="#059669" fontFamily="monospace" fontSize="8" fontWeight="700">ACTIVE</text>
            </g>
          </g>
        </g>

        {/* RIGHT NODE: Official Solicitation & Buyer Delivery */}
        <g transform="translate(485, 60)" filter="url(#spapi-soft-shadow)">
          <rect width="190" height="365" rx="12" fill="url(#spapi-white-card)" stroke="#E2E8F0" strokeWidth="1.2" />

          <rect x="12" y="12" width="30" height="30" rx="6" fill="#ECFDF5" stroke="#A7F3D0" />
          <text x="20" y="32" fill="#059669" fontFamily="system-ui" fontSize="15">✉</text>

          <text x="48" y="24" fill="#0F172A" fontFamily="system-ui" fontSize="11" fontWeight="700">Official Delivery</text>
          <text x="48" y="37" fill="#64748B" fontFamily="system-ui" fontSize="9">Amazon In-Box Email</text>

          <g transform="translate(12, 52)">
            <rect width="166" height="182" rx="8" fill="#FFFFFF" stroke="#E2E8F0" />

            <rect x="0" y="0" width="166" height="22" rx="8" fill="#131A22" />
            <text x="10" y="15" fill="#E89B5C" fontFamily="system-ui" fontSize="9" fontWeight="bold">amazon</text>
            <text x="56" y="15" fill="#FFFFFF" fontFamily="system-ui" fontSize="7.5">Customer Feedback</text>

            <text x="10" y="38" fill="#0F172A" fontFamily="system-ui" fontSize="8.5" fontWeight="700">How was your item?</text>
            <text x="10" y="50" fill="#64748B" fontFamily="system-ui" fontSize="7.5">32oz Insulated Water Bottle</text>

            <g transform="translate(10, 60)">
              {['★', '★', '★', '★', '★'].map((star, sIdx) => (
                <text key={sIdx} x={sIdx * 27} y="22" fill="#F59E0B" fontSize="18">
                  {star}
                </text>
              ))}
            </g>

            <rect x="10" y="94" width="146" height="20" rx="4" fill="#FFD814" stroke="#FCD200" />
            <text x="83" y="107" textAnchor="middle" fill="#0F172A" fontFamily="system-ui" fontSize="8" fontWeight="700">
              Submit Review on Amazon
            </text>

            <text x="83" y="130" textAnchor="middle" fill="#94A3B8" fontFamily="system-ui" fontSize="7">
              Standard Amazon-managed template
            </text>

            <rect x="10" y="142" width="146" height="28" rx="4" fill="#F8FAFC" stroke="#E2E8F0" />
            <text x="83" y="155" textAnchor="middle" fill="#059669" fontFamily="system-ui" fontSize="7.5" fontWeight="700">
              ✓ Verified Amazon Buyer
            </text>
            <text x="83" y="165" textAnchor="middle" fill="#64748B" fontFamily="system-ui" fontSize="6.5">
              1-Click Instant Star Rating
            </text>
          </g>

          <g transform="translate(12, 244)">
            <rect width="166" height="106" rx="6" fill="#FFFFFF" stroke="#E2E8F0" />

            <g transform="translate(10, 16)">
              <circle cx="4" cy="6" r="3" fill="#10B981" />
              <text x="14" y="9" fill="#0F172A" fontFamily="system-ui" fontSize="8.5" fontWeight="700">Review Request Sent</text>
              <text x="14" y="21" fill="#64748B" fontFamily="system-ui" fontSize="7.5">Counted instantly as Sent</text>
            </g>

            <g transform="translate(10, 46)">
              <circle cx="4" cy="6" r="3" fill="#3B82F6" />
              <text x="14" y="9" fill="#0F172A" fontFamily="system-ui" fontSize="8.5" fontWeight="700">Zero Spam Risk</text>
              <text x="14" y="21" fill="#64748B" fontFamily="system-ui" fontSize="7.5">No Buyer-Seller strike</text>
            </g>

            <g transform="translate(10, 76)">
              <circle cx="4" cy="6" r="3" fill="#059669" />
              <text x="14" y="9" fill="#0F172A" fontFamily="system-ui" fontSize="8.5" fontWeight="700">Compliant Flow</text>
              <text x="14" y="21" fill="#64748B" fontFamily="system-ui" fontSize="7.5">100% Studio production API ToS</text>
            </g>
          </g>
        </g>

        {/* Ambient Moving Scan / Shine Sweep */}
        <g transform="rotate(-15 350 225)">
          <rect x="-200" y="60" width="80" height="380" fill="url(#spapi-shine-light)" opacity="0.5" style={{ mixBlendMode: 'overlay' }}>
            <animateTransform
              attributeName="transform"
              type="translate"
              values="0 0; 900 0; 900 0"
              keyTimes="0; 0.6; 1"
              dur="4.5s"
              repeatCount="indefinite"
            />
          </rect>
        </g>
      </g>
    </svg>
  );
}


