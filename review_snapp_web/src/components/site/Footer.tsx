import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Container } from "./Container";
import { FlagIcon } from "@/components/ui/FlagIcon";
import { useWebsiteConfiguration } from "@/hooks/useWebsiteConfiguration";
import {
  Mail,
  Phone,
  MapPin,
  ShieldCheck,
  Zap,
  Globe2,
  Headphones,
  ArrowUpRight,
  Linkedin,
  Youtube,
  FacebookIcon,
  Instagram,
} from "lucide-react";

const marketplaces = [
  { name: "amazon.com", code: "us" },
  { name: "amazon.in", code: "in" },
  { name: "amazon.co.uk", code: "gb" },
  { name: "amazon.de", code: "de" },
  { name: "amazon.ae", code: "ae" },
  { name: "amazon.ca", code: "ca" },
  { name: "amazon.com.au", code: "au" },
  { name: "amazon.co.jp", code: "jp" },
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

  const contactEmail = config?.contact?.email || "info@ctasis.com";
  const contactPhone = config?.contact?.phone || "+91 79489 93409";
  const contactAddress = config?.contact?.address || t('footer.officeAddress');
  const companyWebsite = config?.company?.website || "https://ctasis.com";
  const companyName = config?.company?.name || "Ctas Info Services";
  const companyLocation = currentLang === 'en'
    ? [config?.contact?.city, config?.contact?.state].filter(Boolean).join(", ") || "Ahmedabad, Gujarat"
    : t('contact.officeLocation');

  const copyrightText = currentLang === 'en' && config?.company?.copyright_text
    ? config.company.copyright_text
    : `© ${new Date().getFullYear()} ${companyName}. ${t('footer.copyright')}`;

  const trustStrip = [
    { icon: ShieldCheck, titleKey: "trust1Title", copyKey: "trust1Copy" },
    { icon: Zap, titleKey: "trust2Title", copyKey: "trust2Copy" },
    { icon: Globe2, titleKey: "trust3Title", copyKey: "trust3Copy" },
    { icon: Headphones, titleKey: "trust4Title", copyKey: "trust4Copy" },
  ];

  const productLinks: [string, string][] = [
    [t('footer.colProductLink1'), "/#pricing"],
    [t('footer.colProductLink2'), "/#how"],
    [t('footer.colProductLink3'), "/#dashboard"],
    [t('footer.colProductLink4'), "/#register"],
    [t('footer.colProductLinkGuide') || t('nav.guide') || "Guide", "/guide"],
    [t('footer.colProductLinkBlogs') || t('nav.blogs') || "Blogs", "/blogs"],
  ];

  const platformLinks: [string, string][] = [
    [t('footer.colPlatformLink1'), "/amazon-sp-api"],
    [t('footer.colPlatformLink2'), "/order-sync"],
    [t('footer.colPlatformLink3'), "/smart-scheduling"],
    // [t('footer.colPlatformLink4'), "/review-analytics"],
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
      href: config?.social_links?.linkedin || 'https://linkedin.com/company/ctas-info-services',
    },
    {
      icon: FacebookIcon,
      label: t('footer.socialFacebook'),
      href: config?.social_links?.facebook || 'https://www.facebook.com/ctasinfoservices',
    },
    {
      icon: Youtube,
      label: t('footer.socialYoutube'),
      href: config?.social_links?.youtube || 'https://www.youtube.com/@ctasinfoservicesllp7030',
    },
    {
      icon: Instagram,
      label: t('footer.socialInstagram'),
      href: config?.social_links?.instagram || 'https://instagram.com/ctasinfoservices/',
    },
  ];

  return (
    <footer className="bg-navy-deep text-white/70 relative overflow-hidden">
      <div className="absolute inset-0 grid-bg opacity-60 pointer-events-none" />
      <Container className="relative">
        {/* Trust strip - dividers, not cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 border-b border-white/10">
          {trustStrip.map(({ icon: Icon, titleKey, copyKey }, i) => (
            <div
              key={titleKey}
              className={`py-8 lg:py-10 lg:px-7 ${i === 0 ? "lg:pl-0" : ""
                } ${i !== trustStrip.length - 1 ? "lg:border-r border-white/10" : ""
                }`}
            >
              <Icon className="h-7 w-7 md:h-8 md:w-8 text-brand-bright" strokeWidth={1.75} />
              <p className="mt-4 text-sm font-semibold text-white font-display">{t(`footer.${titleKey}`)}</p>
              <p className="mt-1.5 text-[13px] leading-relaxed text-white/55">{t(`footer.${copyKey}`)}</p>
            </div>
          ))}
        </div>

        {/* Main footer body - asymmetric grid */}
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-8 py-14 lg:py-16">
          <div className="lg:col-span-4">
            <a href="#home" className="flex items-center gap-2.5">
              <img src="/logo-white.svg?v=gt2" className="h-8 w-8" alt={t('footer.logoAlt')} />
              <span className="font-extrabold tracking-tight text-white text-lg font-display">
                Gravur<span className="text-brand-bright">tastisch</span>
              </span>
            </a>

            {companyTagline && (
              <p className="mt-3.5 text-xs sm:text-[13px] font-semibold text-white/90 leading-snug">
                {companyTagline}
              </p>
            )}

            <p className="mt-2 max-w-sm text-xs sm:text-[13px] leading-relaxed text-white/60">
              {companyAbout}
            </p>

            <ul className="mt-7 space-y-3 text-sm">
              <li className="flex items-start gap-3">
                <Mail className="h-4 w-4 mt-0.5 text-brand-bright shrink-0" strokeWidth={1.75} />
                <a href={`mailto:${contactEmail}`} className="hover:text-white transition-colors">
                  {contactEmail}
                </a>
              </li>
              <li className="flex items-start gap-3">
                <Phone className="h-4 w-4 mt-0.5 text-brand-bright shrink-0" strokeWidth={1.75} />
                <a href={`tel:${contactPhone.replace(/\s+/g, '')}`} className="hover:text-white transition-colors">
                  {contactPhone}
                </a>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="h-4 w-4 mt-0.5 text-brand-bright shrink-0" strokeWidth={1.75} />
                <span className="leading-relaxed text-white/60">
                  {contactAddress}
                </span>
              </li>
            </ul>
          </div>

          <div className="lg:col-span-5 flex flex-col gap-10">
            <div className="grid sm:grid-cols-3 gap-8">
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

            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-white mb-3 font-display">
                {t('footer.marketplacesTitle')}
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-2.5 text-[12px] text-white/50">
                {marketplaces.map((m) => (
                  <span key={m.name} className="inline-flex items-center gap-2 hover:text-white transition-colors">
                    <FlagIcon code={m.code} className="w-3.5 h-2.5 rounded-[2px]" />
                    <span>{m.name}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Newsletter & Amazon Partner Card */}
          <div className="lg:col-span-3 flex flex-col justify-between gap-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-white mb-4 font-display">
                {t('footer.newsletterTitle')}
              </p>
              <p className="text-[13px] leading-relaxed text-white/55">
                {t('footer.newsletterDesc')}
              </p>
              <a
                href={`mailto:${contactEmail}?subject=Seller%20insights`}
                className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-brand-bright hover:text-white transition-colors"
              >
                {t('footer.newsletterCta')}
                <ArrowUpRight className="h-4 w-4" />
              </a>
            </div>

            {/* Amazon SP-API Integration Card */}
            <div className="flex items-center gap-3.5 rounded-xl bg-white/[0.04] border border-white/10 p-3 max-w-sm backdrop-blur-xs transition-colors hover:border-white/20 hover:bg-white/[0.07]">
              <div className="shrink-0 flex items-center justify-center">
                <img
                  src="/amazon-white.svg"
                  alt="Amazon Selling Partner"
                  className="h-6 sm:h-7 w-auto object-contain"
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-white leading-snug">
                  {t('footer.amazonPartnerTitle') || "Amazon Selling Partner API"}
                </p>
                <p className="text-[11px] text-white/60 leading-tight mt-0.5">
                  {t('footer.amazonPartnerDesc') || "Secure shop connections and proof-gated production for custom gifts."}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/10 py-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs text-white/45">
          <div className="space-y-1">
            <p>{copyrightText}</p>
            <p>
              {t('footer.operatedBy')}{" "}
              <a
                href={companyWebsite}
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-bright hover:text-white transition-colors"
              >
                {companyName}
              </a>{" "}
              · {companyLocation} · {t('footer.notAffiliated')}
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="mr-1 hidden sm:inline font-medium text-white/60">{t('footer.followUs')}</span>
            {socialLinks.map(({ icon: Icon, label, href }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="group relative h-9 w-9 grid place-items-center rounded-xl bg-white/[0.05] animate-white-blink hover:bg-brand-bright/15 border border-white/20 hover:!border-brand-bright/50 text-white/70 hover:text-white shadow-xs hover:!shadow-[0_0_16px_rgba(56,189,248,0.45)] hover:-translate-y-0.5 active:scale-95 transition-all duration-300 ease-out"
              >
                <Icon className="h-4 w-4 transition-transform duration-300 group-hover:scale-110" strokeWidth={1.85} />
              </a>
            ))}
          </div>
        </div>
      </Container>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-widest text-white mb-4 font-display">
        {title}
      </p>
      <ul className="space-y-2.5 text-sm">
        {links.map(([label, href]) => (
          <li key={label}>
            {href.startsWith("http") ? (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-brand-bright transition-colors"
              >
                {label}
              </a>
            ) : href.startsWith("/#") || href.startsWith("#") ? (
              <a href={href} className="hover:text-brand-bright transition-colors">
                {label}
              </a>
            ) : (
              <Link to={href} className="hover:text-brand-bright transition-colors">
                {label}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
