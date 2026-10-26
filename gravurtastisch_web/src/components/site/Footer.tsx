import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Container } from "./Container";
import { FlagIcon } from "@/components/ui/FlagIcon";
import { useWebsiteConfiguration } from "@/hooks/useWebsiteConfiguration";
import { FooterWaveCanvas } from "./FooterWaveCanvas";
import {
  Mail,
  Phone,
  MapPin,
  ShieldCheck,
  Zap,
  Globe2,
  Headphones,
  ArrowUpRight,
  ArrowUp,
  Linkedin,
  Youtube,
  FacebookIcon,
  Instagram,
  Sparkles,
} from "lucide-react";

const marketplaces = [
  { name: "amazon.de", code: "de" },
  { name: "amazon.co.uk", code: "gb" },
  { name: "amazon.fr", code: "fr" },
  { name: "amazon.it", code: "it" },
  { name: "amazon.es", code: "es" },
  { name: "amazon.nl", code: "nl" },
  { name: "amazon.pl", code: "pl" },
  { name: "amazon.se", code: "se" },
];

export function Footer() {
  const { t, i18n } = useTranslation();
  const { config } = useWebsiteConfiguration();
  const currentLang = (i18n.language || 'en').split('-')[0];

  const companyTagline = currentLang === 'en' && config?.company?.tagline
    ? config.company.tagline
    : t('footer.tagline', config?.company?.tagline || 'Engraving, custom cups & personalized orders');

  const companyAbout = currentLang === 'en' && config?.company?.about
    ? config.company.about
    : t('footer.companyDesc');

  const contactEmail = config?.contact?.email || "info@gravurtastisch.com";
  const contactPhone = config?.contact?.phone || "+91 79489 93409";
  const contactAddress = config?.contact?.address || t('footer.officeAddress');
  const companyWebsite = config?.company?.website || "https://gravurtastisch.com";
  const companyName = config?.company?.name || "Gravurtastisch";
  const companyLocation = currentLang === 'en'
    ? [config?.contact?.city, config?.contact?.state].filter(Boolean).join(", ") || "Ahmedabad, Gujarat"
    : t('contact.officeLocation');

  const copyrightText = currentLang === 'en' && config?.company?.copyright_text
    ? config.company.copyright_text
    : `© ${new Date().getFullYear()} ${companyName}. ${t('footer.copyright')}`;

  const trustStrip = [
    { icon: ShieldCheck, titleKey: "trust1Title", copyKey: "trust1Copy", iconBg: "bg-blue-50 text-blue-600 border-blue-200/60", border: "hover:border-blue-400/60" },
    { icon: Zap, titleKey: "trust2Title", copyKey: "trust2Copy", iconBg: "bg-amber-50 text-amber-600 border-amber-200/60", border: "hover:border-amber-400/60" },
    { icon: Globe2, titleKey: "trust3Title", copyKey: "trust3Copy", iconBg: "bg-emerald-50 text-emerald-600 border-emerald-200/60", border: "hover:border-emerald-400/60" },
    { icon: Headphones, titleKey: "trust4Title", copyKey: "trust4Copy", iconBg: "bg-purple-50 text-purple-600 border-purple-200/60", border: "hover:border-purple-400/60" },
  ];

  const productLinks: [string, string][] = [
    [t('footer.colProductLink1'), "/pricing"],
    [t('footer.colProductLink2'), "/#how"],
    [t('footer.colProductLink3'), "/#dashboard"],
    [t('footer.colProductLink4'), "/register"],
    [t('footer.colProductLinkGuide') || t('nav.guide') || "Guide", "/guide"],
    [t('footer.colProductLinkBlogs') || t('nav.blogs') || "Blogs", "/blogs"],
    [t('nav.contact') || "Contact", "/contact"],
  ];

  const platformLinks: [string, string][] = [
    [t('footer.colPlatformLink1'), "/amazon-sp-api"],
    [t('footer.colPlatformLink2'), "/order-sync"],
    [t('footer.colPlatformLink3'), "/smart-scheduling"],
  ];

  const legalLinks: [string, string][] = [
    [t('footer.colLegalLink1'), "/privacy"],
    [t('footer.colLegalLink2'), "/terms"],
    [t('footer.colLegalLink3'), "/refund"],
    [companyName, companyWebsite],
  ];

  const socialLinks: { icon: typeof Linkedin; label: string; href: string }[] = [
    {
      icon: Linkedin,
      label: t('footer.socialLinkedin'),
      href: config?.social_links?.linkedin || 'https://linkedin.com/company/gravurtastisch',
    },
    {
      icon: FacebookIcon,
      label: t('footer.socialFacebook'),
      href: config?.social_links?.facebook || 'https://www.facebook.com/gravurtastisch',
    },
    {
      icon: Youtube,
      label: t('footer.socialYoutube'),
      href: config?.social_links?.youtube || 'https://www.youtube.com/@gravurtastisch',
    },
    {
      icon: Instagram,
      label: t('footer.socialInstagram'),
      href: config?.social_links?.instagram || 'https://instagram.com/gravurtastisch/',
    },
  ];

  const scrollToTop = () => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <footer className="bg-gradient-to-b from-[#edf5fd] via-[#f5f9fe] to-[#e4f0fc] text-slate-700 relative overflow-hidden">
      {/* Top spacing before waves section */}
      <div className="w-full h-8 sm:h-12 bg-white" />

      {/* Dynamic Animated Waves Band */}
      <div className="relative w-full h-36 sm:h-44 md:h-48 overflow-hidden pointer-events-none select-none bg-gradient-to-b from-white via-white/70 to-transparent">
        <FooterWaveCanvas className="absolute inset-0 w-full h-full" />
      </div>

      <Container className="relative z-10">
        {/* Modern Bento Trust Strip - Interactive Light Capsules */}
        <div className="pt-4 sm:pt-6 pb-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {trustStrip.map(({ icon: Icon, titleKey, copyKey, iconBg, border }) => (
            <div
              key={titleKey}
              className={`group relative rounded-2xl p-3.5 sm:p-4 bg-white border border-[#0032ab]/15 ${border} shadow-[0_4px_16px_rgba(0,50,171,0.06)] hover:shadow-[0_12px_32px_rgba(0,50,171,0.12)] transition-all duration-300 hover:-translate-y-0.5 overflow-hidden`}
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-brand/5 rounded-full blur-xl pointer-events-none group-hover:scale-150 transition-transform duration-500" />
              <div className="relative flex items-start gap-3">
                <div className={`h-10 w-10 rounded-xl ${iconBg} border flex items-center justify-center group-hover:scale-105 shadow-xs shrink-0 transition-all duration-300`}>
                  <Icon className="h-4.5 w-4.5" strokeWidth={1.8} />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs sm:text-sm font-extrabold text-navy-deep group-hover:text-brand transition-colors font-display tracking-tight">
                    {t(`footer.${titleKey}`)}
                  </h4>
                  <p className="mt-0.5 text-[11px] sm:text-xs text-slate-600 leading-relaxed font-normal">
                    {t(`footer.${copyKey}`)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Main Footer Body - Modern Bento Architecture */}
        <div className="grid lg:grid-cols-12 gap-6 lg:gap-8 py-6 lg:py-7 border-t border-[#0032ab]/15">
          {/* Brand & Interactive Contact Bento (Left Column) */}
          <div className="lg:col-span-4 flex flex-col justify-between space-y-4">
            <div>
              <a href="#home" className="inline-flex items-center gap-2.5 group">
                <img
                  src="/gravurtastich.png"
                  className="h-10 md:h-11 w-auto object-contain transition-transform duration-300 group-hover:scale-102"
                  alt={t('footer.logoAlt')}
                />
              </a>

              {companyTagline && (
                <p className="mt-3.5 text-xs sm:text-[13px] font-semibold text-navy-deep leading-snug">
                  {companyTagline}
                </p>
              )}

              <p className="mt-2 text-xs sm:text-[13px] leading-relaxed text-slate-600 max-w-sm">
                {companyAbout}
              </p>
            </div>

            {/* Interactive Contact Pills */}
            <div className="space-y-2.5 pt-2">
              <a
                href={`mailto:${contactEmail}`}
                className="group flex items-center gap-3 p-2.5 rounded-xl bg-transparent hover:bg-white/20 border border-[#0032ab]/15 hover:border-brand/40 transition-all duration-200"
              >
                <div className="h-8 w-8 rounded-lg bg-[#0032ab]/10 border border-[#0032ab]/15 flex items-center justify-center text-brand group-hover:text-brand-bright group-hover:scale-105 transition-all shrink-0">
                  <Mail className="h-4 w-4" strokeWidth={1.8} />
                </div>
                <div className="min-w-0">
                  <span className="block text-[11px] uppercase tracking-wider text-slate-500 font-mono font-semibold">Email Us</span>
                  <span className="text-xs sm:text-sm font-bold text-navy-deep group-hover:text-brand transition-colors truncate block">
                    {contactEmail}
                  </span>
                </div>
              </a>

              <a
                href={`tel:${contactPhone.replace(/\s+/g, '')}`}
                className="group flex items-center gap-3 p-2.5 rounded-xl bg-transparent hover:bg-white/20 border border-[#0032ab]/15 hover:border-brand/40 transition-all duration-200"
              >
                <div className="h-8 w-8 rounded-lg bg-[#0032ab]/10 border border-[#0032ab]/15 flex items-center justify-center text-brand group-hover:text-brand-bright group-hover:scale-105 transition-all shrink-0">
                  <Phone className="h-4 w-4" strokeWidth={1.8} />
                </div>
                <div className="min-w-0">
                  <span className="block text-[11px] uppercase tracking-wider text-slate-500 font-mono font-semibold">Direct Line</span>
                  <span className="text-xs sm:text-sm font-bold text-navy-deep group-hover:text-brand transition-colors truncate block">
                    {contactPhone}
                  </span>
                </div>
              </a>

              <div className="flex items-start gap-3 p-2.5 rounded-xl bg-transparent border border-[#0032ab]/15">
                <div className="h-8 w-8 rounded-lg bg-[#0032ab]/10 border border-[#0032ab]/15 flex items-center justify-center text-brand shrink-0 mt-0.5">
                  <MapPin className="h-4 w-4" strokeWidth={1.8} />
                </div>
                <div className="min-w-0">
                  <span className="block text-[11px] uppercase tracking-wider text-slate-500 font-mono font-semibold">Studio Address</span>
                  <span className="text-xs text-slate-700 leading-relaxed block font-medium">
                    {contactAddress}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Links & Global Fulfillment Matrix (Middle Column) */}
          <div className="lg:col-span-5 flex flex-col justify-between gap-8">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 sm:gap-8">
              <FooterCol
                title={t('footer.colProduct')}
                links={productLinks}
              />

              <FooterCol
                title={t('footer.colPlatform')}
                links={platformLinks}
              />

              <FooterCol
                title={t('footer.colLegal')}
                links={legalLinks}
              />
            </div>

            {/* Where We Fulfill - Interactive Country Chips */}
            <div className="pt-4 border-t border-[#0032ab]/15">
              <div className="flex items-center gap-2 mb-3">
                <span className="h-1.5 w-1.5 rounded-full bg-brand animate-ping" />
                <p className="text-xs font-bold uppercase tracking-widest text-navy-deep font-display">
                  {t('footer.marketplacesTitle')}
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {marketplaces.map((m) => (
                  <span
                    key={m.name}
                    className="group inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-transparent hover:bg-white/20 border border-[#0032ab]/15 hover:border-brand/40 text-[11px] font-semibold text-slate-700 hover:text-navy-deep transition-all cursor-default"
                  >
                    <FlagIcon code={m.code} className="w-3.5 h-2.5 rounded-[2px] transition-transform group-hover:scale-110 shadow-xs" />
                    <span className="truncate">{m.name}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Studio Notes & Amazon Verified Badge (Right Column) */}
          <div className="lg:col-span-3 flex flex-col justify-between gap-6">
            {/* Studio Notes Newsletter Bento */}
            <div className="rounded-2xl bg-transparent border border-[#0032ab]/15 p-5 hover:border-brand/40 transition-all">
              <div className="flex items-center gap-2 mb-3">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <p className="text-xs font-bold uppercase tracking-widest text-navy-deep font-display">
                  {t('footer.newsletterTitle')}
                </p>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                {t('footer.newsletterDesc')}
              </p>
              <a
                href={`mailto:${contactEmail}?subject=Seller%20insights`}
                className="mt-4 inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-brand hover:text-navy-deep transition-colors group"
              >
                <span>{t('footer.newsletterCta')}</span>
                <ArrowUpRight className="h-4 w-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </a>
            </div>

            {/* Amazon Official SP-API Partner Card */}
            <div className="relative rounded-2xl bg-transparent border border-amber-400/60 hover:border-amber-400 p-4 transition-all group overflow-hidden">
              <div className="absolute top-0 inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-amber-400/80 to-transparent opacity-80" />
              <div className="flex items-center gap-3.5">
                <div className="h-10 w-10 rounded-xl bg-amber-500/10 border border-amber-300/60 flex items-center justify-center p-1.5 shrink-0 group-hover:scale-105 transition-transform">
                  <img
                    src="/amazon-logo.svg"
                    alt="Amazon Selling Partner"
                    className="h-5 w-auto object-contain"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs font-extrabold text-navy-deep leading-snug truncate">
                      {t('footer.amazonPartnerTitle') || "Amazon Selling Partner API"}
                    </p>
                    <Sparkles className="h-3 w-3 text-amber-500 shrink-0" />
                  </div>
                  <p className="text-[11px] text-slate-600 leading-tight mt-0.5 line-clamp-2">
                    {t('footer.amazonPartnerDesc') || "Secure shop connections and proof-gated production for custom gifts."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar: Copyright, Metadata, Social Icons, and Smooth Back-to-Top */}
        <div className="border-t border-[#0032ab]/15 py-3.5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs text-slate-600">
          <div className="space-y-1">
            <p className="text-slate-800 font-semibold">{copyrightText}</p>
            <p className="text-[11px] text-slate-600">
              {t('footer.operatedBy')}{" "}
              <a
                href={companyWebsite}
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand hover:text-navy-deep font-semibold transition-colors underline-offset-2 hover:underline"
              >
                {companyName}
              </a>{" "}
              · {companyLocation} · {t('footer.notAffiliated')}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            {/* Social Icons with Subtle Hover Effects */}
            <div className="flex items-center gap-2">
              <span className="mr-1 hidden sm:inline font-semibold text-slate-600 text-xs">{t('footer.followUs')}</span>
              {socialLinks.map(({ icon: Icon, label, href }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="group relative h-9 w-9 grid place-items-center rounded-xl bg-white hover:bg-blue-50/90 border border-slate-300/90 hover:border-brand/50 text-slate-700 hover:text-brand shadow-xs hover:shadow-[0_4px_12px_rgba(0,50,171,0.12)] hover:-translate-y-0.5 active:scale-95 transition-all duration-300 ease-out"
                >
                  <Icon className="h-4 w-4 transition-transform duration-300 group-hover:scale-110" strokeWidth={1.85} />
                </a>
              ))}
            </div>

            {/* Back to Top Animated Button */}
            <button
              onClick={scrollToTop}
              className="group inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white hover:bg-blue-50/90 border border-slate-300/90 hover:border-brand/50 text-xs font-bold text-slate-800 hover:text-brand transition-all shadow-xs hover:shadow-[0_4px_12px_rgba(0,50,171,0.1)] hover:-translate-y-0.5 cursor-pointer"
            >
              <span>Back to top</span>
              <ArrowUp className="h-3.5 w-3.5 text-brand group-hover:-translate-y-0.5 transition-transform" />
            </button>
          </div>
        </div>
      </Container>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3.5">
        <span className="h-1.5 w-1.5 rounded-full bg-brand" />
        <p className="text-xs font-bold uppercase tracking-widest text-navy-deep font-display">
          {title}
        </p>
      </div>
      <ul className="space-y-2.5 text-xs sm:text-[13px]">
        {links.map(([label, href]) => (
          <li key={label}>
            {href.startsWith("http") ? (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-1 text-slate-600 hover:text-brand hover:translate-x-1 font-medium transition-all duration-200"
              >
                <span>{label}</span>
                <ArrowUpRight className="h-3 w-3 opacity-0 group-hover:opacity-100 text-brand transition-opacity" />
              </a>
            ) : href.startsWith("/#") || href.startsWith("#") ? (
              <a
                href={href}
                className="group inline-flex items-center gap-1 text-slate-600 hover:text-brand hover:translate-x-1 font-medium transition-all duration-200"
              >
                <span>{label}</span>
                <span className="h-1 w-1 rounded-full bg-brand opacity-0 group-hover:opacity-100 transition-opacity" />
              </a>
            ) : (
              <Link
                to={href}
                className="group inline-flex items-center gap-1 text-slate-600 hover:text-brand hover:translate-x-1 font-medium transition-all duration-200"
              >
                <span>{label}</span>
                <span className="h-1 w-1 rounded-full bg-brand opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
