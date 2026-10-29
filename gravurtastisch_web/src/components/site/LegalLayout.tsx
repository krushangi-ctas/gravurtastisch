import { Link, useLocation } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import {
  ArrowLeft,
  ShieldCheck,
  FileText,
  RotateCcw,
  Calendar,
  Lock,
  Mail,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { Container } from "@/components/site/Container";
import { Footer } from "@/components/site/Footer";
import { Nav } from "@/components/site/Nav";
import { useWebsiteConfiguration } from "@/hooks/useWebsiteConfiguration";

export function LegalLayout({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: ReactNode;
}) {
  const { t } = useTranslation();
  const location = useLocation();
  const { config } = useWebsiteConfiguration();
  const contactEmail = config?.contact?.email || "info@gravurtastisch.com";

  const legalTabs = [
    {
      to: "/privacy",
      label: t("legal.tabPrivacy", "Privacy Policy"),
      icon: ShieldCheck,
      isActive: location.pathname.startsWith("/privacy"),
    },
    {
      to: "/terms",
      label: t("legal.tabTerms", "Terms & Conditions"),
      icon: FileText,
      isActive: location.pathname.startsWith("/terms"),
    },
    {
      to: "/refund",
      label: t("legal.tabRefund", "Refund Policy"),
      icon: RotateCcw,
      isActive: location.pathname.startsWith("/refund"),
    },
  ];

  return (
    <div className="min-h-screen bg-background text-navy-deep relative overflow-hidden flex flex-col justify-between">
      {/* Ambient caustics and decorative gradient glow */}
      <div
        className="pointer-events-none absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80"
        aria-hidden="true"
      >
        <div
          className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#0032ab]/20 to-[#155dfc]/15 opacity-40 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"
          style={{
            clipPath:
              "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)",
          }}
        />
      </div>

      <Nav />

      <main className="pt-32 pb-20 flex-grow relative z-10">
        <Container className="max-w-4xl">
          {/* Top Breadcrumb & Badge Row */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
            <Link
              to="/"
              className="group inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs sm:text-sm font-semibold text-brand hover:text-brand-bright bg-white/80 dark:bg-navy-deep/80 hover:bg-white dark:hover:bg-navy-deep border border-brand/15 shadow-xs transition-all duration-200"
            >
              <ArrowLeft className="w-3.5 h-3.5 transition-transform duration-200 group-hover:-translate-x-1" />
              <span>{t("legal.backToHome")}</span>
            </Link>

            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>{t("legal.badge", "Studio Compliance & Trust")}</span>
            </div>
          </div>

          {/* Hero Header */}
          <div className="mb-10 text-center sm:text-left">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-navy-deep dark:text-white leading-[1.15]">
              {title}
            </h1>

            <div className="mt-4 flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs sm:text-sm text-slate-500">
              <div className="inline-flex items-center gap-1.5 font-medium">
                <Calendar className="w-4 h-4 text-brand" />
                <span>
                  {t("legal.lastUpdated")}: <strong className="text-navy-deep dark:text-slate-200 font-semibold">{updated}</strong>
                </span>
              </div>
              <span className="hidden sm:inline-block w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700" />
              <div className="inline-flex items-center gap-2 font-medium text-emerald-600 dark:text-emerald-400">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span>{t("legal.statusActive", "Active & Enforced")}</span>
              </div>
            </div>
          </div>

          {/* Document Switcher Tab Dock */}
          <div className="mb-8 p-1.5 rounded-2xl bg-slate-100/80 dark:bg-slate-900/60 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-1.5">
            {legalTabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <Link
                  key={tab.to}
                  to={tab.to}
                  className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 ${
                    tab.isActive
                      ? "bg-white dark:bg-navy-deep text-brand dark:text-white shadow-sm border border-brand/10 font-bold"
                      : "text-slate-600 dark:text-slate-400 hover:text-navy-deep dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-800/50"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${tab.isActive ? "text-brand" : "opacity-70"}`} />
                  <span>{tab.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Main Document Content Card */}
          <div className="relative rounded-3xl bg-white/95 dark:bg-navy-deep/80 backdrop-blur-xl border border-brand/12 shadow-[0_20px_60px_-15px_rgba(0,50,171,0.07)] p-6 sm:p-10 md:p-14 overflow-hidden">
            {/* Top Brand Accent Bar */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-brand via-brand-bright to-[#00d2ff]" />

            {/* Structured Legal Prose Styling */}
            <div className="space-y-6 text-sm sm:text-base text-slate-700 dark:text-slate-300 leading-relaxed 
              [&_p]:leading-relaxed [&_p]:text-slate-600 dark:[&_p]:text-slate-300
              [&_h2]:text-lg sm:[&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-navy-deep dark:[&_h2]:text-white 
              [&_h2]:mt-10 [&_h2]:mb-3 [&_h2]:pt-4 [&_h2]:border-t [&_h2]:border-slate-100 dark:[&_h2]:border-slate-800/80
              [&_h2:first-of-type]:mt-6 [&_h2:first-of-type]:pt-0 [&_h2:first-of-type]:border-t-0
              [&_ul]:space-y-2.5 [&_ul]:my-4 [&_ul]:pl-1
              [&_li]:flex [&_li]:items-start [&_li]:gap-2.5 [&_li]:text-slate-600 dark:[&_li]:text-slate-300
              [&_li::before]:content-[''] [&_li::before]:w-1.5 [&_li::before]:h-1.5 [&_li::before]:rounded-full [&_li::before]:bg-brand [&_li::before]:mt-2.5 [&_li::before]:shrink-0
              [&_a]:text-brand [&_a]:font-semibold hover:[&_a]:text-brand-bright hover:[&_a]:underline"
            >
              {children}
            </div>
          </div>

          {/* Trust & Compliance Features Grid */}
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-white/80 dark:bg-navy-deep/60 backdrop-blur-sm border border-brand/10 shadow-xs">
              <div className="w-9 h-9 rounded-xl bg-brand/10 flex items-center justify-center text-brand mb-3">
                <Lock className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-navy-deep dark:text-white">
                {t("legal.trustGdprTitle", "GDPR & DSGVO Compliant")}
              </h3>
              <p className="mt-1.5 text-xs text-slate-500 leading-relaxed">
                {t("legal.trustGdprDesc", "Encrypted file transfer & strict privacy standards for all uploaded customer artwork.")}
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white/80 dark:bg-navy-deep/60 backdrop-blur-sm border border-brand/10 shadow-xs">
              <div className="w-9 h-9 rounded-xl bg-brand/10 flex items-center justify-center text-brand mb-3">
                <Sparkles className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-navy-deep dark:text-white">
                {t("legal.trustProofTitle", "Proof-Gated Manufacturing")}
              </h3>
              <p className="mt-1.5 text-xs text-slate-500 leading-relaxed">
                {t("legal.trustProofDesc", "Production starts only after your digital proof approval. Zero surprises.")}
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white/80 dark:bg-navy-deep/60 backdrop-blur-sm border border-brand/10 shadow-xs">
              <div className="w-9 h-9 rounded-xl bg-brand/10 flex items-center justify-center text-brand mb-3">
                <Mail className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-navy-deep dark:text-white">
                {t("legal.trustSupportTitle", "Direct Human Support")}
              </h3>
              <p className="mt-1.5 text-xs text-slate-500 leading-relaxed">
                {t("legal.trustSupportDesc", "Have questions about terms or orders? Our studio team typically answers within 1 business day.")}
              </p>
            </div>
          </div>

          {/* Direct Help Callout Banner */}
          <div className="mt-8 p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-[#0032ab]/6 via-white to-[#155dfc]/8 dark:from-navy dark:via-navy-soft dark:to-navy-deep relative overflow-hidden shadow-xs border border-brand/15">
            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-brand/10 text-brand dark:text-brand-bright mb-3 border border-brand/20">
                  <CheckCircle2 className="w-3.5 h-3.5 text-brand dark:text-brand-bright" />
                  <span>{t("legal.badge", "Studio Transparency")}</span>
                </div>
                <h3 className="text-lg sm:text-xl font-bold tracking-tight text-navy-deep dark:text-white">
                  {t("legal.needHelpTitle", "Need clarification on legal or order terms?")}
                </h3>
                <p className="mt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-xl">
                  {t("legal.needHelpDesc", "We believe in complete transparency. Reach out to our legal and customer team anytime.")}
                </p>
              </div>

              <a
                href={`mailto:${contactEmail}`}
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-brand hover:bg-brand-bright text-white font-semibold text-xs sm:text-sm shadow-xs transition-all duration-200 shrink-0"
              >
                <Mail className="w-4 h-4" />
                <span>{t("legal.contactSupport", "Contact Legal Support")}</span>
              </a>
            </div>
          </div>
        </Container>
      </main>

      <Footer />
    </div>
  );
}
