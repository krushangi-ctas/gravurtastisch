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
                  <span className="text-gradient-silver">{t('amazonSpApi.heroTitle')}</span>{" "}
                  <span className="text-gradient-gold">{t('amazonSpApi.heroTitleHighlight')}</span>
                </h1>
                <p className="mt-4 text-white/70 text-base sm:text-lg leading-relaxed max-w-xl">
                  {t('amazonSpApi.heroDesc')}
                </p>
                <div className="mt-6 flex flex-wrap gap-4">
                  <a
                    href="/#register"
                    className="inline-flex items-center gap-2 rounded-full btn-glass-primary px-6 py-3 text-sm font-bold !text-white shadow-lg shadow-brand/30 hover:-translate-y-0.5 transition-all"
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

                  {/* Clean SVG Vector Illustration Container */}
                  <div className="relative flex items-center justify-center select-none">
                    <AmazonSpApiHeroSvg />
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
                    <div className="group relative h-full rounded-2xl bg-white/[0.04] border border-white/10 p-5 backdrop-blur-sm hover:border-brand-bright/50 hover:bg-white/[0.07] hover:-translate-y-1 transition-all duration-300 shadow-lg">
                      <div className="flex items-center justify-between gap-3 mb-3">
                        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#0032ab] to-[#155dfc] text-white shadow-md shadow-[#0032ab]/30 grid place-items-center group-hover:scale-105 transition-transform">
                          <Icon className="h-5 w-5" />
                        </div>
                        <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-white/40 group-hover:text-brand-bright transition-colors">
                          0{idx + 1}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-white mb-1.5 group-hover:text-brand-bright transition-colors">{badge.title}</h3>
                      <p className="text-xs sm:text-sm text-white/70 leading-relaxed">{badge.desc}</p>
                    </div>
                  </Reveal>
                );
              })}
            </div>
          </Container>
        </section>

        {/* 5-Layer Stack Architecture */}
        <section id="architecture" className="relative py-16 lg:py-24 bg-[#f8f9fc] overflow-hidden border-b border-[#0032ab]/10">
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.45]"
            style={{
              backgroundImage:
                "radial-gradient(circle at 12% 20%, rgba(0,50,171,0.05), transparent 42%), radial-gradient(circle at 88% 70%, rgba(79,110,247,0.05), transparent 40%)",
            }}
            aria-hidden
          />
          <Container className="relative">
            <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-center">
              <Reveal className="lg:col-span-5 min-w-0">
                <span className="section-badge mb-3">
                  {t('amazonSpApi.archSectionBadge')}
                </span>
                <h2 className="mt-3 text-3xl sm:text-4xl lg:text-[2.75rem] font-extrabold tracking-tight text-navy-deep leading-[1.15]">
                  {t('amazonSpApi.archHeading')}
                </h2>
                <p className="mt-4 text-base text-slate-body leading-relaxed max-w-2xl text-left">
                  {t('amazonSpApi.archDesc')}
                </p>

                <div className="mt-8 space-y-4">
                  <div className="group relative flex items-start gap-4 p-5 rounded-2xl liquid-glass border border-[#0032ab]/12 shadow-[0_4px_24px_rgba(0,50,171,0.06)] hover:shadow-[0_16px_36px_rgba(0,50,171,0.12)] hover:-translate-y-1 transition-all duration-300">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#0032ab] to-[#155dfc] text-white shadow-md shadow-[#0032ab]/25 grid place-items-center shrink-0">
                      <CheckCircle2 className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-base font-bold text-navy-deep group-hover:text-brand transition-colors">{t('amazonSpApi.archFeature1Title') || "AWS SigV4 Authentication"}</h4>
                      <p className="text-xs sm:text-sm text-slate-body mt-1 leading-relaxed">{t('amazonSpApi.archFeature1Desc') || "Every request is signed using AWS Signature Version 4 with time-limited tokens."}</p>
                    </div>
                  </div>
                  <div className="group relative flex items-start gap-4 p-5 rounded-2xl liquid-glass border border-[#0032ab]/12 shadow-[0_4px_24px_rgba(0,50,171,0.06)] hover:shadow-[0_16px_36px_rgba(0,50,171,0.12)] hover:-translate-y-1 transition-all duration-300">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#0032ab] to-[#155dfc] text-white shadow-md shadow-[#0032ab]/25 grid place-items-center shrink-0">
                      <CheckCircle2 className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-base font-bold text-navy-deep group-hover:text-brand transition-colors">{t('amazonSpApi.archFeature2Title') || "Token Isolation Vault"}</h4>
                      <p className="text-xs sm:text-sm text-slate-body mt-1 leading-relaxed">{t('amazonSpApi.archFeature2Desc') || "Tokens live in a dedicated KMS-backed memory enclave, isolated from public web endpoints."}</p>
                    </div>
                  </div>
                </div>
              </Reveal>

              <Reveal className="lg:col-span-7 min-w-0" delay={100}>
                <div className="rounded-[2rem] liquid-glass bg-white p-6 sm:p-8 text-navy-deep border border-[#0032ab]/15 shadow-[0_16px_45px_rgba(0,50,171,0.08)] space-y-3.5 relative overflow-hidden">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/80 pb-4 mb-4">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="font-mono text-xs font-bold text-navy-deep">ARCH-DIAGRAM // v2.4</span>
                    </div>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs text-[#0032ab] font-bold bg-[#0032ab]/10 border border-[#0032ab]/25">
                      <Cpu className="h-3.5 w-3.5 shrink-0 animate-[spin_8s_linear_infinite]" /> Active studio API Pipeline
                    </span>
                  </div>

                  {[
                    { num: "01", title: t('amazonSpApi.archLayer1Title') || "Amazon Buyer Touchpoint", sub: t('amazonSpApi.archLayer1Sub') || "Official Amazon-rendered template with verified 1-click star rating UI", tag: ".io", accent: "from-[#0032ab] to-[#155dfc]" },
                    { num: "02", title: t('amazonSpApi.archLayer2Title') || "Delivery API Gateway", sub: t('amazonSpApi.archLayer2Sub') || "Dispatches review solicitations via official solicitations/v1 endpoint", tag: ".api", accent: "from-[#155dfc] to-[#4f6ef7]" },
                    { num: "03", title: t('amazonSpApi.archLayer3Title') || "Rate-Shaped Queue Worker", sub: t('amazonSpApi.archLayer3Sub') || "Strict throttling to prevent Studio production API 429 quota exceed errors", tag: ".queue", accent: "from-[#0032ab] to-[#38bdf8]" },
                    { num: "04", title: t('amazonSpApi.archLayer4Title') || "Two-Way Order Sync Engine", sub: t('amazonSpApi.archLayer4Sub') || "Continuous order status, delivery timestamp, and refund event polling", tag: ".sync", accent: "from-[#155dfc] to-[#0032ab]" },
                    { num: "05", title: t('amazonSpApi.archLayer5Title') || "KMS Credential Vault", sub: t('amazonSpApi.archLayer5Sub') || "AES-256 encrypted OAuth refresh tokens with automated key rotation", tag: ".vault", accent: "from-emerald-500 to-[#0032ab]" },
                  ].map((layer) => (
                    <div
                      key={layer.num}
                      className="group flex items-center gap-3.5 sm:gap-4 rounded-2xl bg-[#f8f9fc] hover:bg-white border border-slate-200/80 hover:border-[#155dfc]/50 p-3.5 sm:p-4 transition-all duration-300 hover:shadow-md hover:translate-x-1"
                    >
                      <span className={`grid place-items-center h-9 w-9 rounded-xl bg-gradient-to-br ${layer.accent} text-white text-xs font-mono font-bold shrink-0 shadow-sm`}>
                        {layer.num}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm sm:text-base font-extrabold text-navy-deep leading-snug group-hover:text-[#0032ab] transition-colors">{layer.title}</p>
                        <p className="text-xs text-slate-600 font-medium leading-relaxed mt-0.5">{layer.sub}</p>
                      </div>
                      <span className="font-mono text-[11px] font-bold text-[#0032ab] group-hover:text-[#155dfc] px-2 py-0.5 rounded bg-[#0032ab]/10 border border-[#0032ab]/20 hidden sm:inline shrink-0">{layer.tag}</span>
                    </div>
                  ))}
                </div>
              </Reveal>
            </div>
          </Container>
        </section>

        {/* Endpoints & Technical Specs */}
        <section className="relative py-16 lg:py-24 bg-white overflow-hidden border-b border-[#0032ab]/10">
          <Container className="relative">
            <Reveal>
              <div className="max-w-3xl mb-12">
                <span className="section-badge mb-3">
                  {t('amazonSpApi.endpointsSectionBadge')}
                </span>
                <h2 className="mt-3 text-3xl sm:text-4xl lg:text-[2.75rem] font-extrabold tracking-tight text-navy-deep leading-[1.15]">
                  {t('amazonSpApi.endpointsHeading')}
                </h2>
                <p className="mt-4 text-base text-slate-body leading-relaxed max-w-2xl text-left">
                  {t('amazonSpApi.endpointsDesc') || "Gravurtastisch uses only approved Amazon Selling Partner API endpoints. We never scrape HTML or reverse-engineer private APIs."}
                </p>
              </div>
            </Reveal>

            <div className="grid md:grid-cols-2 gap-6">
              {apiEndpoints.map((ep, i) => (
                <Reveal key={ep.name} delay={i * 60} className="h-full">
                  <div className="group relative h-full rounded-[1.75rem] liquid-glass border border-[#0032ab]/12 p-6 sm:p-7 shadow-[0_4px_24px_rgba(0,50,171,0.06)] hover:shadow-[0_20px_48px_rgba(0,50,171,0.12)] hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between gap-3 mb-4">
                        <span className="font-bold text-navy-deep text-lg group-hover:text-brand transition-colors truncate">{ep.name}</span>
                        <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-[#0032ab]/10 text-brand border border-[#0032ab]/20 shrink-0">
                          {ep.method}
                        </span>
                      </div>
                      <div className="rounded-xl bg-[#f8f9fc] text-[#0b132b] font-mono text-xs p-3.5 mb-4 overflow-x-auto break-all whitespace-pre-wrap border border-slate-200/90 shadow-xs font-semibold">
                        <span className="text-[#155dfc] font-black select-none mr-2">$</span>{ep.endpoint}
                      </div>
                      <p className="text-sm text-slate-600 leading-relaxed">{ep.purpose}</p>
                    </div>
                    <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                      <span className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                        Status: <strong className="text-brand font-semibold">{ep.status}</strong>
                      </span>
                      <span className="font-mono text-slate-400">AWS REST v1</span>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </Container>
        </section>

        {/* Comparison Table: Official studio API vs Scraping vs SMTP */}
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
            <Reveal>
              <div className="text-center max-w-3xl mx-auto mb-12">
                <span className="section-badge mb-3">
                  {t('amazonSpApi.comparisonBadge')}
                </span>
                <h2 className="mt-3 text-3xl sm:text-4xl lg:text-[2.75rem] font-extrabold tracking-tight text-navy-deep leading-[1.15]">
                  {t('amazonSpApi.comparisonHeading')}
                </h2>
                <p className="mt-4 text-base text-slate-body leading-relaxed max-w-2xl mx-auto">
                  {t('amazonSpApi.comparisonDesc') || "Compare official Selling Partner API automation with risky legacy alternatives."}
                </p>
              </div>
            </Reveal>

            <Reveal delay={100} className="min-w-0">
              <div className="overflow-x-auto rounded-[2rem] liquid-glass border border-[#0032ab]/15 shadow-[0_12px_40px_rgba(0,50,171,0.08)] bg-white">
                <table className="w-full text-left text-sm min-w-[620px]">
                  <thead className="bg-[#e2e8f0] border-b border-slate-300 text-navy-deep text-xs uppercase tracking-wider font-mono">
                    <tr>
                      <th className="p-4 sm:p-5 font-bold text-navy-deep">{t('amazonSpApi.compColFeature') || "Quality Feature"}</th>
                      <th className="p-4 sm:p-5 text-brand font-black bg-[#0032ab]/10 border-x border-[#0032ab]/20">{t('amazonSpApi.compColGravurtastisch') || "Gravurtastisch Hub"}</th>
                      <th className="p-4 sm:p-5 text-slate-700 font-bold">{t('amazonSpApi.compColScraping') || "Manual Email / Freelancers"}</th>
                      <th className="p-4 sm:p-5 text-slate-700 font-bold">{t('amazonSpApi.compColSmtp') || "Generic Print Dropship"}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {comparisonRows.map((row, idx) => (
                      <tr key={row.feature} className={`hover:bg-blue-50/40 transition-colors ${idx % 2 === 0 ? "bg-white" : "bg-slate-50/60"}`}>
                        <td className="p-4 sm:p-5 font-bold text-navy-deep text-sm">{row.feature}</td>
                        <td className="p-4 sm:p-5 text-brand font-bold bg-[#0032ab]/[0.04] border-x border-[#0032ab]/12 flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-brand shrink-0" />
                          {row.reviewSnapp}
                        </td>
                        <td className="p-4 sm:p-5 text-slate-500 font-medium text-xs sm:text-sm">{row.scraping}</td>
                        <td className="p-4 sm:p-5 text-slate-500 font-medium text-xs sm:text-sm">{row.smtp}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Reveal>
          </Container>
        </section>

        {/* FAQ Section (2-Column: Left SVG, Right FAQs) */}
        <section className="relative py-16 lg:py-24 bg-white border-b border-[#0032ab]/10">
          <Container>
            <div className="grid lg:grid-cols-12 gap-10 lg:gap-14 items-center">
              {/* Left Column: studio API FAQ & Security Assistant Vector Illustration */}
              <Reveal className="lg:col-span-5 xl:col-span-5">
                <div className="space-y-6">
                  {/* Clean Vector Graphic (No card background, border, or shadow) */}
                  <div className="relative flex items-center justify-center">
                    <SpApiFaqSvg />
                  </div>

                  <div className="rounded-2xl liquid-glass border border-[#0032ab]/15 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-[0_4px_24px_rgba(0,50,171,0.06)] hover:shadow-[0_12px_32px_rgba(0,50,171,0.12)] transition-all">
                    <div className="flex items-center gap-3.5">
                      <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-[#0032ab] to-[#155dfc] text-white shadow-md shadow-[#0032ab]/25 grid place-items-center shrink-0">
                        <Headphones className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-navy-deep leading-tight">{t('amazonSpApi.faqSupportTitle') || "Have custom API questions?"}</p>
                        <p className="text-xs text-slate-body leading-relaxed mt-0.5">{t('amazonSpApi.faqSupportDesc') || "Our team assists with order desk onboarding."}</p>
                      </div>
                    </div>
                    <a
                      href="/#contact"
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-brand hover:text-brand-bright transition-colors shrink-0 self-start sm:self-auto"
                    >
                      {t('amazonSpApi.faqSupportLink') || "Talk to us →"}
                    </a>
                  </div>
                </div>
              </Reveal>

              {/* Right Column: FAQs List */}
              <div className="lg:col-span-7 xl:col-span-7">
                <Reveal>
                  <div className="mb-8">
                    <span className="section-badge mb-3">
                      {t('amazonSpApi.faqBadge')}
                    </span>
                    <h2 className="mt-3 text-3xl sm:text-4xl lg:text-[2.75rem] font-extrabold tracking-tight text-navy-deep leading-[1.15]">
                      {t('amazonSpApi.faqHeading')}
                    </h2>
                    <p className="mt-4 text-base text-slate-body leading-relaxed">
                      {t('amazonSpApi.faqDesc') || "Clear answers on authorization, data security, Amazon ToS compliance, and credentials."}
                    </p>
                  </div>
                </Reveal>

                <Accordion type="single" collapsible className="w-full space-y-4">
                  {faqs.map((faq, idx) => (
                    <Reveal key={idx} delay={idx * 50}>
                      <AccordionItem
                        value={`faq-${idx}`}
                        className="rounded-2xl liquid-glass border border-[#0032ab]/12 px-5 sm:px-6 shadow-[0_2px_12px_rgba(0,50,171,0.04)] hover:border-[#0032ab]/30 transition-all border-b-0"
                      >
                        <AccordionTrigger className="text-left hover:no-underline font-bold text-navy-deep text-base sm:text-lg py-4 sm:py-5 flex gap-3.5">
                          <span className="flex items-center gap-3.5">
                            <span className="flex h-7 w-7 rounded-xl bg-gradient-to-br from-[#0032ab] to-[#155dfc] text-white text-xs font-bold items-center justify-center shrink-0 shadow-sm shadow-[#0032ab]/30">
                              {idx + 1}
                            </span>
                            <span>{faq.q}</span>
                          </span>
                        </AccordionTrigger>
                        <AccordionContent className="text-sm text-slate-600 leading-relaxed pb-5 pl-10.5">
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
            <div className="relative rounded-[2rem] liquid-glass bg-white py-8 px-6 sm:py-9 sm:px-10 text-center shadow-[0_12px_40px_rgba(0,50,171,0.06)] border border-[#0032ab]/15 overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(0,50,171,0.03),transparent_70%)] pointer-events-none" />
              <div className="relative inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#0032ab]/10 text-[#0032ab] border border-[#0032ab]/20 mb-3">
                <span className="h-1.5 w-1.5 rounded-full bg-[#155dfc] animate-pulse" />
                {t('amazonSpApi.ctaBadge') || "Zero Password Storage"}
              </div>
              <h2 className="relative text-2xl sm:text-3xl font-extrabold text-navy-deep tracking-tight leading-snug">
                {t('amazonSpApi.ctaHeading')}
              </h2>
              <p className="relative mt-2 text-slate-body text-xs sm:text-sm max-w-xl mx-auto leading-relaxed">
                {t('amazonSpApi.ctaDesc')}
              </p>
              <div className="relative mt-5 flex flex-wrap justify-center gap-3">
                <a
                  href="/#register"
                  className="inline-flex items-center gap-2 rounded-full btn-glass-primary px-6 py-2.5 text-xs sm:text-sm font-bold !text-white transition-all shadow-md shadow-[#0032ab]/20 hover:-translate-y-0.5"
                >
                  {t('amazonSpApi.ctaButton')}
                  <ArrowRight className="h-4 w-4" />
                </a>
                <a
                  href="/#pricing"
                  className="inline-flex items-center gap-2 rounded-full bg-white border border-[#0032ab]/20 px-6 py-2.5 text-xs sm:text-sm font-bold text-[#0032ab] hover:bg-blue-50/50 hover:border-[#0032ab]/40 transition-all shadow-xs"
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
          <stop offset="0%" stopColor="#282828" />
          <stop offset="60%" stopColor="#3E3E3E" />
          <stop offset="100%" stopColor="#282828" />
        </linearGradient>

        <linearGradient id="faq-spapi-shield-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4f6ef7" />
          <stop offset="50%" stopColor="#0032ab" />
          <stop offset="100%" stopColor="#282828" />
        </linearGradient>

        <linearGradient id="faq-spapi-emerald-badge" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#4f6ef7" />
          <stop offset="100%" stopColor="#0032ab" />
        </linearGradient>

        <linearGradient id="faq-spapi-brand-beam" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#4f6ef7" />
          <stop offset="50%" stopColor="#F8FAFC" />
          <stop offset="100%" stopColor="#4f6ef7" />
        </linearGradient>

        {/* Soft Drop Shadows */}
        <filter id="faq-spapi-shadow" x="-8%" y="-8%" width="116%" height="120%">
          <feDropShadow dx="0" dy="6" stdDeviation="8" floodColor="#0F172A" floodOpacity="0.07" />
        </filter>

        <filter id="faq-spapi-core-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="8" stdDeviation="12" floodColor="#4f6ef7" floodOpacity="0.25" />
        </filter>
      </defs>

      {/* Main Base Canvas Container */}
      <rect x="8" y="8" width="524" height="464" rx="20" fill="url(#faq-spapi-card-bg)" stroke="#4f6ef7" strokeWidth="1.2" />

      {/* Subtle Background Grid & Dots */}
      <g opacity="0.3">
        {[...Array(9)].map((_, i) => (
          <line key={`fgh-${i}`} x1="8" y1={48 + i * 46} x2="532" y2={48 + i * 46} stroke="#4f6ef7" strokeWidth="1" strokeDasharray="3 3" />
        ))}
        {[...Array(11)].map((_, i) => (
          <line key={`fgv-${i}`} x1={32 + i * 46} y1="8" x2={32 + i * 46} y2="472" stroke="#4f6ef7" strokeWidth="1" strokeDasharray="3 3" />
        ))}
      </g>

      {/* Top Header Console Bar */}
      <g transform="translate(24, 22)">
        <rect width="492" height="34" rx="10" fill="#F8FAFC" stroke="#4f6ef7" strokeWidth="1" />
        <circle cx="16" cy="17" r="4" fill="#155dfc" opacity="0.85" />
        <circle cx="28" cy="17" r="4" fill="#4f6ef7" opacity="0.85" />
        <circle cx="40" cy="17" r="4" fill="#0032ab" opacity="0.85" />

        <text x="56" y="21" fill="#0b132b" fontFamily="monospace" fontSize="10.5" fontWeight="700">
          studio API GATEWAY // AWS SigV4 KMS ENCLAVE
        </text>

        <rect x="360" y="7" width="120" height="20" rx="10" fill="rgba(0,50,171,0.08)" stroke="#155dfc" strokeWidth="1" />
        <circle cx="372" cy="17" r="3" fill="#155dfc">
          <animate attributeName="opacity" values="1;0.3;1" dur="1.5s" repeatCount="indefinite" />
        </circle>
        <text x="382" y="20.5" fill="#0032ab" fontFamily="system-ui" fontSize="9.5" fontWeight="700">
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
        stroke="#4f6ef7"
        strokeWidth="2.5"
        strokeDasharray="6 6"
      >
        <animate attributeName="stroke-dashoffset" values="0;-24" dur="1.4s" repeatCount="indefinite" />
      </path>

      {/* Central Core to Right Node Wire */}
      <path
        d="M 270 235 C 330 235, 395 200, 395 150"
        fill="none"
        stroke="#4f6ef7"
        strokeWidth="2.5"
        strokeDasharray="6 6"
      >
        <animate attributeName="stroke-dashoffset" values="0;-24" dur="1.4s" repeatCount="indefinite" />
      </path>

      {/* Central Core to Bottom Cards Wire */}
      <path
        d="M 270 295 L 270 345"
        fill="none"
        stroke="#4f6ef7"
        strokeWidth="2"
        strokeDasharray="4 4"
      />

      {/* Flowing Energy Packets */}
      <circle cx="0" cy="0" r="4" fill="#4f6ef7">
        <animateMotion
          path="M 145 150 C 145 200, 210 235, 270 235"
          dur="1.8s"
          repeatCount="indefinite"
        />
        <animate attributeName="opacity" values="0.2;1;0.2" dur="1.8s" repeatCount="indefinite" />
      </circle>

      <circle cx="0" cy="0" r="4" fill="#4f6ef7">
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
        <rect width="215" height="110" rx="14" fill="#F8FAFC" stroke="#4f6ef7" strokeWidth="1.2" />

        {/* Amazon Smile Badge */}
        <rect x="12" y="12" width="34" height="34" rx="8" fill="rgba(0,50,171,0.08)" stroke="#0032ab" strokeWidth="1" />
        <text x="23" y="35" fill="#0032ab" fontFamily="system-ui" fontSize="18" fontWeight="900">a</text>

        <text x="54" y="24" fill="#0b132b" fontFamily="system-ui" fontSize="12" fontWeight="700">order desk LWA</text>
        <text x="54" y="38" fill="#475569" fontFamily="monospace" fontSize="9" fontWeight="700">OAuth 2.0 Token Handshake</text>

        {/* Divider */}
        <line x1="12" y1="54" x2="203" y2="54" stroke="#E2E8F0" strokeWidth="1" />

        {/* Status Line 1 */}
        <g transform="translate(14, 62)">
          <circle cx="4" cy="6" r="3" fill="#155dfc" />
          <text x="14" y="9" fill="#0b132b" fontFamily="system-ui" fontSize="9.5" fontWeight="600">Zero Passwords Shared</text>
          <text x="140" y="9" fill="#0032ab" fontFamily="monospace" fontSize="8.5" fontWeight="700">SECURE</text>
        </g>

        {/* Status Line 2 */}
        <g transform="translate(14, 82)">
          <circle cx="4" cy="6" r="3" fill="#155dfc" />
          <text x="14" y="9" fill="#0b132b" fontFamily="system-ui" fontSize="9.5" fontWeight="600">Scoped API Metadata</text>
          <text x="135" y="9" fill="#0032ab" fontFamily="monospace" fontSize="8.5" fontWeight="700">REVOCABLE</text>
        </g>
      </g>

      {/* ==================================================== */}
      {/* 3. TOP-RIGHT CARD: OFFICIAL SOLICITATIONS API */}
      {/* ==================================================== */}
      <g transform="translate(290, 75)" filter="url(#faq-spapi-shadow)">
        <rect width="215" height="110" rx="14" fill="#F8FAFC" stroke="#4f6ef7" strokeWidth="1.2" />

        {/* Solicitations Star Badge */}
        <rect x="12" y="12" width="34" height="34" rx="8" fill="rgba(0,50,171,0.08)" stroke="#0032ab" strokeWidth="1" />
        <text x="21" y="35" fill="#4f6ef7" fontFamily="system-ui" fontSize="17">⭐</text>

        <text x="54" y="24" fill="#0b132b" fontFamily="system-ui" fontSize="12" fontWeight="700">Official Solicitations</text>
        <text x="54" y="38" fill="#475569" fontFamily="monospace" fontSize="9" fontWeight="700">solicitations/v1 API</text>

        {/* Divider */}
        <line x1="12" y1="54" x2="203" y2="54" stroke="#E2E8F0" strokeWidth="1" />

        {/* Status Line 1 */}
        <g transform="translate(14, 62)">
          <circle cx="4" cy="6" r="3" fill="#155dfc" />
          <text x="14" y="9" fill="#0b132b" fontFamily="system-ui" fontSize="9.5" fontWeight="600">Amazon Standard Email</text>
          <text x="138" y="9" fill="#0032ab" fontFamily="monospace" fontSize="8.5" fontWeight="700">VERIFIED</text>
        </g>

        {/* Status Line 2 */}
        <g transform="translate(14, 82)">
          <circle cx="4" cy="6" r="3" fill="#155dfc" />
          <text x="14" y="9" fill="#0b132b" fontFamily="system-ui" fontSize="9.5" fontWeight="600">1-Click Star Rating UI</text>
          <text x="135" y="9" fill="#0032ab" fontFamily="monospace" fontSize="8.5" fontWeight="700">IN-BOX</text>
        </g>
      </g>

      {/* ==================================================== */}
      {/* 4. CENTRAL HIGH-SECURITY CRYPTO VAULT CORE */}
      {/* ==================================================== */}
      <g transform="translate(270, 235)" filter="url(#faq-spapi-core-glow)">
        {/* Rotating Concentric Tech Security Rings */}
        <circle cx="0" cy="0" r="56" fill="none" stroke="#4f6ef7" strokeWidth="1.5" strokeDasharray="6 8">
          <animateTransform
            attributeName="transform"
            type="rotate"
            from="0"
            to="360"
            dur="24s"
            repeatCount="indefinite"
          />
        </circle>

        <circle cx="0" cy="0" r="48" fill="none" stroke="#4f6ef7" strokeWidth="2" strokeDasharray="16 20">
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
          stroke="#4f6ef7"
          strokeWidth="2"
        />

        {/* Inner Glowing Shield Vector */}
        <path
          d="M 0 -20 C 12 -20 18 -12 18 4 C 18 16 0 24 0 24 C 0 24 -18 16 -18 4 C -18 -12 -12 -20 0 -20 Z"
          fill="url(#faq-spapi-shield-grad)"
          stroke="#4f6ef7"
          strokeWidth="1.5"
        />

        {/* Central Padlock Icon */}
        <g transform="translate(-8, -12)">
          <rect x="2" y="8" width="12" height="10" rx="2" fill="#F8FAFC" />
          <path d="M 4 8 L 4 5 C 4 2.8 5.8 1 8 1 C 10.2 1 12 2.8 12 5 L 12 8" fill="none" stroke="#F8FAFC" strokeWidth="2" strokeLinecap="round" />
          <circle cx="8" cy="13" r="1.5" fill="#0032ab" />
        </g>

        {/* Center Badge Pill */}
        <g transform="translate(0, 48)">
          <rect x="-65" y="-10" width="130" height="20" rx="10" fill="#0032ab" stroke="#155dfc" strokeWidth="1" />
          <circle cx="-52" cy="0" r="2.5" fill="#38bdf8">
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
          <rect width="154" height="100" rx="12" fill="#F8FAFC" stroke="#4f6ef7" strokeWidth="1.2" />
          <g>
            <rect x="10" y="10" width="26" height="26" rx="6" fill="rgba(0,50,171,0.08)" stroke="#0032ab" strokeWidth="1" />
            <text x="18" y="27" fill="#0032ab" fontFamily="system-ui" fontSize="13" fontWeight="bold">✓</text>

            <text x="42" y="22" fill="#0b132b" fontFamily="system-ui" fontSize="10.5" fontWeight="700">Zero Scraping</text>
            <text x="42" y="32" fill="#475569" fontFamily="system-ui" fontSize="8">No Chrome ext.</text>

            <line x1="10" y1="44" x2="144" y2="44" stroke="#E2E8F0" strokeWidth="1" />

            <text x="10" y="60" fill="#0b132b" fontFamily="system-ui" fontSize="8.5" fontWeight="500">Pure studio API protocol</text>
            <text x="10" y="74" fill="#0b132b" fontFamily="system-ui" fontSize="8.5" fontWeight="500">Zero HTML injection</text>

            <rect x="10" y="80" width="134" height="14" rx="4" fill="rgba(0,50,171,0.08)" stroke="rgba(0,50,171,0.2)" strokeWidth="0.8" />
            <text x="77" y="90" textAnchor="middle" fill="#0032ab" fontFamily="monospace" fontSize="7.5" fontWeight="700">100% TOS COMPLIANT</text>
          </g>
        </g>

        {/* Card 2: AWS SigV4 Encryption */}
        <g transform="translate(169, 0)" filter="url(#faq-spapi-shadow)">
          <rect width="154" height="100" rx="12" fill="#F8FAFC" stroke="#4f6ef7" strokeWidth="1.2" />
          <g>
            <rect x="10" y="10" width="26" height="26" rx="6" fill="rgba(0,50,171,0.08)" stroke="#0032ab" strokeWidth="1" />
            <text x="18" y="27" fill="#0032ab" fontFamily="system-ui" fontSize="13">🔒</text>

            <text x="42" y="22" fill="#0b132b" fontFamily="system-ui" fontSize="10.5" fontWeight="700">AWS SigV4</text>
            <text x="42" y="32" fill="#475569" fontFamily="system-ui" fontSize="8">Signed requests</text>

            <line x1="10" y1="44" x2="144" y2="44" stroke="#E2E8F0" strokeWidth="1" />

            <text x="10" y="60" fill="#0b132b" fontFamily="system-ui" fontSize="8.5" fontWeight="500">KMS Key Rotation</text>
            <text x="10" y="74" fill="#0b132b" fontFamily="system-ui" fontSize="8.5" fontWeight="500">Isolated memory pool</text>

            <rect x="10" y="80" width="134" height="14" rx="4" fill="rgba(0,50,171,0.08)" stroke="rgba(0,50,171,0.2)" strokeWidth="0.8" />
            <text x="77" y="90" textAnchor="middle" fill="#0032ab" fontFamily="monospace" fontSize="7.5" fontWeight="700">256-BIT ENCRYPTED</text>
          </g>
        </g>

        {/* Card 3: Rate Limiting & Account Safety */}
        <g transform="translate(338, 0)" filter="url(#faq-spapi-shadow)">
          <rect width="154" height="100" rx="12" fill="#F8FAFC" stroke="#4f6ef7" strokeWidth="1.2" />
          <g>
            <rect x="10" y="10" width="26" height="26" rx="6" fill="rgba(0,50,171,0.08)" stroke="#0032ab" strokeWidth="1" />
            <text x="18" y="27" fill="#0032ab" fontFamily="system-ui" fontSize="13">🛡️</text>

            <text x="42" y="22" fill="#0b132b" fontFamily="system-ui" fontSize="10.5" fontWeight="700">Account Safety</text>
            <text x="42" y="32" fill="#475569" fontFamily="system-ui" fontSize="8">Rate-shaped queue</text>

            <line x1="10" y1="44" x2="144" y2="44" stroke="#E2E8F0" strokeWidth="1" />

            <text x="10" y="60" fill="#0b132b" fontFamily="system-ui" fontSize="8.5" fontWeight="500">Zero 429 Quota errors</text>
            <text x="10" y="74" fill="#0b132b" fontFamily="system-ui" fontSize="8.5" fontWeight="500">0 Policy warning strikes</text>

            <rect x="10" y="80" width="134" height="14" rx="4" fill="rgba(0,50,171,0.08)" stroke="rgba(0,50,171,0.2)" strokeWidth="0.8" />
            <text x="77" y="90" textAnchor="middle" fill="#0032ab" fontFamily="monospace" fontSize="7.5" fontWeight="700">STRIKE PROTECTION</text>
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
        {/* Soft Ambient Radial Lights */}
        <radialGradient id="spapi-orb-blue" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#4f6ef7" stopOpacity="0.2" />
          <stop offset="60%" stopColor="#0032ab" stopOpacity="0.06" />
          <stop offset="100%" stopColor="#001855" stopOpacity="0" />
        </radialGradient>

        <radialGradient id="spapi-orb-cyan" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.18" />
          <stop offset="70%" stopColor="#0284c7" stopOpacity="0.05" />
          <stop offset="100%" stopColor="#001855" stopOpacity="0" />
        </radialGradient>


        {/* Crisp White Card Backgrounds */}
        <linearGradient id="spapi-white-card" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#F8FAFC" />
        </linearGradient>

        <linearGradient id="spapi-center-card" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="50%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#F0F7FF" />
        </linearGradient>

        <linearGradient id="spapi-card-border" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#E2E8F0" />
          <stop offset="50%" stopColor="#CBD5E1" />
          <stop offset="100%" stopColor="#BFDBFE" />
        </linearGradient>

        <linearGradient id="spapi-center-border" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="50%" stopColor="#4f6ef7" />
          <stop offset="100%" stopColor="#155dfc" />
        </linearGradient>

        <linearGradient id="spapi-blue-header" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#0032ab" />
          <stop offset="50%" stopColor="#155dfc" />
          <stop offset="100%" stopColor="#4f6ef7" />
        </linearGradient>
      </defs>

      {/* Ambient Glow Orbs */}
      <circle cx="350" cy="225" r="220" fill="url(#spapi-orb-blue)" pointerEvents="none" />
      <circle cx="120" cy="180" r="160" fill="url(#spapi-orb-cyan)" pointerEvents="none" />
      <circle cx="560" cy="240" r="150" fill="url(#spapi-orb-blue)" pointerEvents="none" />

      {/* Top Terminal Bar (Crisp White Pill) */}
      <g transform="translate(14, 12)">
        <rect x="0" y="0" width="672" height="34" rx="17" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1.2" style={{ filter: "drop-shadow(0 6px 12px rgba(0, 26, 77, 0.16))" }} />
        <circle cx="20" cy="17" r="4" fill="#ef4444" />
        <circle cx="33" cy="17" r="4" fill="#f59e0b" />
        <circle cx="46" cy="17" r="4" fill="#10b981" />

        <text x="64" y="21" fill="#0f172a" fontFamily="monospace" fontSize="10.5" fontWeight="700">
          sp-api-pipeline.ts // AWS SigV4 · OAuth 2.0 LWA
        </text>

        <rect x="526" y="6" width="134" height="22" rx="11" fill="#ecfdf5" stroke="#a7f3d0" strokeWidth="0.8" />
        <circle cx="540" cy="17" r="3.5" fill="#10b981">
          <animate attributeName="opacity" values="1;0.3;1" dur="1.8s" repeatCount="indefinite" />
        </circle>
        <text x="550" y="20.5" fill="#065f46" fontFamily="system-ui" fontSize="9" fontWeight="800">
          studio API · 200 OK
        </text>
      </g>

      {/* Animated Connecting Data Cables with Fast Stream Photons */}
      {/* Left to Center Wire */}
      <path
        d="M 215 225 L 260 225"
        stroke="#38bdf8"
        strokeWidth="3"
        strokeDasharray="5 5"
      >
        <animate attributeName="stroke-dashoffset" values="0;-20" dur="1.2s" repeatCount="indefinite" />
      </path>

      {/* Center to Right Wire */}
      <path
        d="M 440 225 L 485 225"
        stroke="#38bdf8"
        strokeWidth="3"
        strokeDasharray="5 5"
      >
        <animate attributeName="stroke-dashoffset" values="0;-20" dur="1.2s" repeatCount="indefinite" />
      </path>

      {/* Flowing Laser Packet Photons */}
      <circle cx="237" cy="225" r="4" fill="#155dfc" filter="drop-shadow(0 0 4px #38bdf8)">
        <animate attributeName="cx" values="215;260" dur="1.2s" repeatCount="indefinite" />
      </circle>

      <circle cx="462" cy="225" r="4" fill="#155dfc" filter="drop-shadow(0 0 4px #38bdf8)">
        <animate attributeName="cx" values="440;485" dur="1.2s" repeatCount="indefinite" />
      </circle>

      {/* LEFT NODE: Amazon Seller (Crisp White Card) */}
      <g transform="translate(25, 58)">
        <rect width="190" height="370" rx="18" fill="url(#spapi-white-card)" stroke="url(#spapi-card-border)" strokeWidth="1.2" style={{ filter: "drop-shadow(0 10px 18px rgba(0, 26, 77, 0.18))" }} />

        {/* Node Header */}
        <g transform="translate(12, 12)">
          <rect width="32" height="32" rx="8" fill="#eff6ff" stroke="#bfdbfe" />
          <text x="11" y="22" fill="#0032ab" fontFamily="system-ui" fontSize="16" fontWeight="bold">a</text>
          <text x="40" y="14" fill="#0f172a" fontFamily="system-ui" fontSize="11" fontWeight="800">Amazon Seller</text>
          <text x="40" y="27" fill="#64748b" fontFamily="system-ui" fontSize="8.5">order desk LWA</text>
        </g>

        {/* Token Badge */}
        <rect x="12" y="54" width="166" height="24" rx="12" fill="#eff6ff" stroke="#bfdbfe" />
        <circle cx="22" cy="66" r="3" fill="#155dfc" />
        <text x="32" y="69.5" fill="#0032ab" fontFamily="monospace" fontSize="8.5" fontWeight="800">TOKEN: LWA_AUTHORIZED</text>

        {/* Scopes Box */}
        <g transform="translate(12, 88)">
          <rect width="166" height="48" rx="8" fill="#f8fafc" stroke="#e2e8f0" />
          <text x="10" y="16" fill="#0f172a" fontFamily="system-ui" fontSize="8.5" fontWeight="800">SCOPES GRANTED</text>
          <text x="10" y="30" fill="#0032ab" fontFamily="monospace" fontSize="8.5" fontWeight="700">✓ orders:v0/read</text>
          <text x="10" y="42" fill="#0032ab" fontFamily="monospace" fontSize="8.5" fontWeight="700">✓ solicitations:v1</text>
        </g>

        {/* Protection Box */}
        <g transform="translate(12, 144)">
          <rect width="166" height="48" rx="8" fill="#f8fafc" stroke="#e2e8f0" />
          <text x="10" y="16" fill="#0f172a" fontFamily="system-ui" fontSize="8.5" fontWeight="800">ACCOUNT PROTECTION</text>
          <text x="10" y="30" fill="#64748b" fontFamily="system-ui" fontSize="8">0 Password Access</text>
          <text x="10" y="42" fill="#059669" fontFamily="system-ui" fontSize="8" fontWeight="700">Revocable in 1-Click</text>
        </g>

        {/* Real-Time Order Stream Box */}
        <g transform="translate(12, 200)">
          <rect width="166" height="156" rx="8" fill="#f8fafc" stroke="#e2e8f0" />
          <text x="10" y="16" fill="#0f172a" fontFamily="system-ui" fontSize="8" fontWeight="800">REAL-TIME ORDER STREAM</text>

          <g transform="translate(8, 26)">
            <rect width="150" height="36" rx="6" fill="#FFFFFF" stroke="#e2e8f0" />
            <circle cx="8" cy="14" r="2.5" fill="#10b981">
              <animate attributeName="r" values="2;3.5;2" dur="1.5s" repeatCount="indefinite" />
            </circle>
            <text x="16" y="15" fill="#0f172a" fontFamily="monospace" fontSize="8" fontWeight="700">#114-8923019</text>
            <text x="16" y="27" fill="#64748b" fontFamily="system-ui" fontSize="7.5">FBA · Water Bottle</text>
            <text x="104" y="15" fill="#0032ab" fontFamily="monospace" fontSize="7.5" fontWeight="800">DELIVERED</text>
          </g>

          <g transform="translate(8, 68)">
            <rect width="150" height="36" rx="6" fill="#FFFFFF" stroke="#e2e8f0" />
            <circle cx="8" cy="14" r="2.5" fill="#10b981" />
            <text x="16" y="15" fill="#0f172a" fontFamily="monospace" fontSize="8" fontWeight="700">#402-9918231</text>
            <text x="16" y="27" fill="#64748b" fontFamily="system-ui" fontSize="7.5">FBA · Leather Wallet</text>
            <text x="104" y="15" fill="#0032ab" fontFamily="monospace" fontSize="7.5" fontWeight="800">DELIVERED</text>
          </g>

          <g transform="translate(8, 110)">
            <rect width="150" height="36" rx="6" fill="#FFFFFF" stroke="#e2e8f0" />
            <circle cx="8" cy="14" r="2.5" fill="#155dfc" />
            <text x="16" y="15" fill="#0f172a" fontFamily="monospace" fontSize="8" fontWeight="700">#028-4491023</text>
            <text x="16" y="27" fill="#64748b" fontFamily="system-ui" fontSize="7.5">FBM · Yoga Mat</text>
            <text x="104" y="15" fill="#155dfc" fontFamily="monospace" fontSize="7.5" fontWeight="800">SHIPPED</text>
          </g>
        </g>
      </g>

      {/* CENTER HUB: Gravurtastisch Core (Elevated White Hero Card) */}
      <g transform="translate(260, 48)">
        <rect width="180" height="390" rx="20" fill="url(#spapi-center-card)" stroke="url(#spapi-center-border)" strokeWidth="2" style={{ filter: "drop-shadow(0 14px 22px rgba(0, 26, 77, 0.22))" }} />

        {/* Hero Header Pill */}
        <rect x="10" y="10" width="160" height="32" rx="16" fill="url(#spapi-blue-header)" />
        <text x="90" y="30" textAnchor="middle" fill="#ffffff" fontFamily="system-ui" fontSize="11" fontWeight="900" letterSpacing="0.4">
          Gravurtastisch Core
        </text>

        {/* KMS Vault Box */}
        <g transform="translate(10, 52)">
          <rect width="160" height="66" rx="8" fill="#eff6ff" stroke="#bfdbfe" />
          <circle cx="18" cy="18" r="7" fill="#FFFFFF" stroke="#155dfc" strokeWidth="1" />
          <text x="18" y="22" textAnchor="middle" fill="#0032ab" fontSize="9">🔒</text>

          <text x="32" y="21" fill="#0f172a" fontFamily="system-ui" fontSize="9.5" fontWeight="800">AES-256 KMS Vault</text>
          <text x="10" y="42" fill="#64748b" fontFamily="monospace" fontSize="8">Encrypted token enclave</text>
          <text x="10" y="55" fill="#059669" fontFamily="monospace" fontSize="8" fontWeight="800">● Auto-rotated keys</text>
        </g>

        {/* Rate-Shaped Queue Box */}
        <g transform="translate(10, 126)">
          <rect width="160" height="88" rx="8" fill="#f8fafc" stroke="#e2e8f0" />
          <text x="10" y="16" fill="#0f172a" fontFamily="system-ui" fontSize="9" fontWeight="800">RATE-SHAPED QUEUE</text>
          <text x="10" y="30" fill="#64748b" fontFamily="system-ui" fontSize="8">Amazon Throttle Guard</text>

          <rect x="10" y="40" width="140" height="8" rx="4" fill="#e2e8f0" />
          <rect x="10" y="40" width="95" height="8" rx="4" fill="url(#spapi-blue-header)">
            <animate attributeName="width" values="40;125;70;105" dur="3s" repeatCount="indefinite" />
          </rect>

          <text x="10" y="64" fill="#0f172a" fontFamily="monospace" fontSize="8" fontWeight="700">Capacity: 15 req/sec</text>
          <text x="10" y="78" fill="#059669" fontFamily="monospace" fontSize="8" fontWeight="800">Status: 0 Quota Spikes</text>
        </g>

        {/* Solicitations Engine Box */}
        <g transform="translate(10, 222)">
          <rect width="160" height="154" rx="8" fill="#f8fafc" stroke="#e2e8f0" />
          <text x="10" y="16" fill="#0f172a" fontFamily="system-ui" fontSize="9" fontWeight="800">SOLICITATIONS ENGINE</text>

          <rect x="10" y="24" width="140" height="22" rx="6" fill="#eff6ff" stroke="#bfdbfe" />
          <text x="14" y="38" fill="#0032ab" fontFamily="monospace" fontSize="8" fontWeight="800">POST /solicitations/v1</text>

          <g transform="translate(10, 60)">
            <text x="0" y="10" fill="#64748b" fontFamily="system-ui" fontSize="8">5-30 Day Window:</text>
            <text x="88" y="10" fill="#059669" fontFamily="monospace" fontSize="8" fontWeight="800">VERIFIED</text>
          </g>

          <g transform="translate(10, 82)">
            <text x="0" y="10" fill="#64748b" fontFamily="system-ui" fontSize="8">Opt-Out Safe:</text>
            <text x="88" y="10" fill="#059669" fontFamily="monospace" fontSize="8" fontWeight="800">100% TOS</text>
          </g>

          <g transform="translate(10, 104)">
            <text x="0" y="10" fill="#64748b" fontFamily="system-ui" fontSize="8">Single-Send Lock:</text>
            <text x="88" y="10" fill="#059669" fontFamily="monospace" fontSize="8" fontWeight="800">ENFORCED</text>
          </g>

          <g transform="translate(10, 126)">
            <text x="0" y="10" fill="#64748b" fontFamily="system-ui" fontSize="8">Timezone Align:</text>
            <text x="88" y="10" fill="#059669" fontFamily="monospace" fontSize="8" fontWeight="800">ACTIVE</text>
          </g>
        </g>
      </g>

      {/* RIGHT NODE: Official Delivery (Crisp White Card) */}
      <g transform="translate(485, 58)">
        <rect width="190" height="370" rx="18" fill="url(#spapi-white-card)" stroke="url(#spapi-card-border)" strokeWidth="1.2" style={{ filter: "drop-shadow(0 10px 18px rgba(0, 26, 77, 0.18))" }} />

        {/* Node Header */}
        <g transform="translate(12, 12)">
          <rect width="32" height="32" rx="8" fill="#eff6ff" stroke="#bfdbfe" />
          <text x="10" y="22" fill="#0032ab" fontFamily="system-ui" fontSize="15">✉</text>
          <text x="40" y="14" fill="#0f172a" fontFamily="system-ui" fontSize="11" fontWeight="800">Official Delivery</text>
          <text x="40" y="27" fill="#64748b" fontFamily="system-ui" fontSize="8.5">Amazon In-Box Email</text>
        </g>

        {/* Email Preview Card */}
        <g transform="translate(12, 54)">
          <rect width="166" height="186" rx="10" fill="#FFFFFF" stroke="#bfdbfe" strokeWidth="1" />

          <rect x="0" y="0" width="166" height="24" rx="10" fill="#eff6ff" />
          <text x="10" y="16" fill="#0032ab" fontFamily="system-ui" fontSize="9" fontWeight="bold">amazon</text>
          <text x="56" y="16" fill="#64748b" fontFamily="system-ui" fontSize="7.5">Customer Feedback</text>

          <text x="10" y="40" fill="#0f172a" fontFamily="system-ui" fontSize="8.5" fontWeight="800">How was your item?</text>
          <text x="10" y="52" fill="#64748b" fontFamily="system-ui" fontSize="7.5">32oz Insulated Water Bottle</text>

          {/* Glowing Amber Stars */}
          <g transform="translate(10, 62)">
            {["★", "★", "★", "★", "★"].map((star, sIdx) => (
              <text key={sIdx} x={sIdx * 27} y="22" fill="#f59e0b" fontSize="18">
                {star}
              </text>
            ))}
          </g>

          {/* CTA Button with pure WHITE text */}
          <rect x="10" y="96" width="146" height="22" rx="11" fill="url(#spapi-blue-header)" />
          <text x="83" y="110" textAnchor="middle" fill="#ffffff" fontFamily="system-ui" fontSize="8" fontWeight="800">
            Submit Review on Amazon
          </text>

          <text x="83" y="132" textAnchor="middle" fill="#64748b" fontFamily="system-ui" fontSize="7">
            Standard Amazon-managed template
          </text>

          {/* Verified Buyer Badge */}
          <rect x="10" y="144" width="146" height="28" rx="6" fill="#ecfdf5" stroke="#a7f3d0" strokeWidth="0.8" />
          <text x="83" y="157" textAnchor="middle" fill="#065f46" fontFamily="system-ui" fontSize="7.5" fontWeight="800">
            ✓ Verified Amazon Buyer
          </text>
          <text x="83" y="167" textAnchor="middle" fill="#059669" fontFamily="system-ui" fontSize="6.5">
            1-Click Instant Star Rating
          </text>
        </g>

        {/* Compliance Rows */}
        <g transform="translate(12, 248)">
          <rect width="166" height="108" rx="8" fill="#f8fafc" stroke="#e2e8f0" />

          <g transform="translate(10, 16)">
            <circle cx="4" cy="6" r="3" fill="#155dfc" />
            <text x="14" y="9" fill="#0f172a" fontFamily="system-ui" fontSize="8.5" fontWeight="800">Review Request Sent</text>
            <text x="14" y="21" fill="#64748b" fontFamily="system-ui" fontSize="7.5">Counted instantly as Sent</text>
          </g>

          <g transform="translate(10, 48)">
            <circle cx="4" cy="6" r="3" fill="#10b981" />
            <text x="14" y="9" fill="#0f172a" fontFamily="system-ui" fontSize="8.5" fontWeight="800">Zero Spam Risk</text>
            <text x="14" y="21" fill="#64748b" fontFamily="system-ui" fontSize="7.5">No Buyer-Seller strike</text>
          </g>

          <g transform="translate(10, 80)">
            <circle cx="4" cy="6" r="3" fill="#0032ab" />
            <text x="14" y="9" fill="#0f172a" fontFamily="system-ui" fontSize="8.5" fontWeight="800">Compliant Flow</text>
            <text x="14" y="21" fill="#64748b" fontFamily="system-ui" fontSize="7.5">100% Studio production API ToS</text>
          </g>
        </g>
      </g>
    </svg>
  );
}


