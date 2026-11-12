import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { LegalLayout } from "@/components/site/LegalLayout";
import { LegalPageSkeleton } from "@/components/skeletons/LegalPageSkeleton";
import i18n from "@/i18n/config";
import { seo } from "@/utils/seo";
import { useWebsiteConfiguration } from "@/hooks/useWebsiteConfiguration";
import {
  Building2,
  Mail,
  Phone,
  UserCheck,
  FileText,
  CreditCard,
  Scale,
  ShieldAlert,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";

export const Route = createFileRoute("/impressum")({
  pendingComponent: LegalPageSkeleton,
  head: () =>
    seo({
      title: i18n.t("meta.impressumTitle", "Legal Notice & Imprint - Gravurtastisch"),
      description: i18n.t(
        "meta.impressumDesc",
        "Legal notice, company registration, and statutory provider details pursuant to § 5 DDG for Gravurtastisch."
      ),
      url: "/impressum",
    }),
  component: ImpressumPage,
});

function ImpressumPage() {
  const { t } = useTranslation();
  const { config } = useWebsiteConfiguration();
  const companyName = config?.company?.name || "Gravurtastisch Studio";
  const contactEmail = config?.contact?.email || "info@gravurtastisch.de";
  const contactPhone = config?.contact?.phone || "017661055576";
  const dynamicAddress = (() => {
    if (config?.contact) {
      const line1 = config.contact.address;
      const cityPostal = [config.contact.postal_code, config.contact.city]
        .filter(Boolean)
        .join(" ");
      const regionCountry = [config.contact.state, config.contact.country]
        .filter(Boolean)
        .join(", ");
      const full = [line1, cityPostal, regionCountry].filter(Boolean).join(", ");
      if (full) return full;
    }
    return t("impressum.address", "Gertrudstr. 2, 44575 Castrop-Rauxel, Deutschland");
  })();

  const isSkeletonPreview =
    typeof window !== "undefined" && window.location.search.includes("skeleton=true");

  if (isSkeletonPreview) {
    return <LegalPageSkeleton />;
  }

  return (
    <LegalLayout
      title={t("impressum.title", "Legal Notice & Imprint")}
      updated={t("impressum.updated", "July 24, 2026")}
    >
      {/* 2x2 Bento Grid for Core Corporate Information */}
      <div className="not-prose grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {/* Card 1: Company & Address */}
        <div className="p-5 sm:p-6 rounded-2xl bg-slate-50/80 dark:bg-navy/70 border border-slate-200/80 dark:border-white/10 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3 text-brand">
              <div className="w-8 h-8 rounded-lg bg-brand/10 flex items-center justify-center">
                <Building2 className="w-4 h-4 text-brand" />
              </div>
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {t("impressum.headingProvider", "Information pursuant to § 5 DDG")}
              </span>
            </div>
            <h3 className="text-base font-extrabold text-navy-deep dark:text-white">
              {companyName}
            </h3>
            <p className="text-xs font-semibold text-brand mt-0.5">
              {t("impressum.legalForm", "Custom Laser Engraving & Personalized Gifts")}
            </p>
            <p className="mt-3 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {dynamicAddress}
            </p>
          </div>
        </div>

        {/* Card 2: Contact Options */}
        <div className="p-5 sm:p-6 rounded-2xl bg-slate-50/80 dark:bg-navy/70 border border-slate-200/80 dark:border-white/10 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3 text-brand">
              <div className="w-8 h-8 rounded-lg bg-brand/10 flex items-center justify-center">
                <Mail className="w-4 h-4 text-brand" />
              </div>
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {t("impressum.contactBadge", "Direct Communication")}
              </span>
            </div>
            <h3 className="text-base font-extrabold text-navy-deep dark:text-white mb-3">
              {t("impressum.headingContact", "Studio Contact")}
            </h3>
            <div className="space-y-2 text-xs sm:text-sm">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                <a
                  href={`mailto:${contactEmail}`}
                  className="font-medium text-brand hover:underline truncate"
                >
                  {contactEmail}
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                <a
                  href={`tel:${contactPhone.replace(/\s+/g, "")}`}
                  className="font-medium text-brand hover:underline"
                >
                  {contactPhone}
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: Representation & Commercial Register */}
        <div className="p-5 sm:p-6 rounded-2xl bg-slate-50/80 dark:bg-navy/70 border border-slate-200/80 dark:border-white/10 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3 text-brand">
              <div className="w-8 h-8 rounded-lg bg-brand/10 flex items-center justify-center">
                <UserCheck className="w-4 h-4 text-brand" />
              </div>
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {t("impressum.headingRepresented", "Representation")}
              </span>
            </div>
            <h3 className="text-sm sm:text-base font-extrabold text-navy-deep dark:text-white">
              {t("impressum.representative", "Management / Studio Leadership")}
            </h3>
            <div className="mt-3 pt-3 border-t border-slate-200/60 dark:border-white/10">
              <span className="text-[11px] font-mono text-slate-500 uppercase block font-bold">
                {t("impressum.headingRegister", "Commercial Register")}
              </span>
              <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                {t(
                  "impressum.registerDetails",
                  "Business Registration pursuant to German commercial law / Jurisdiction: Castrop-Rauxel, Germany"
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Card 4: Tax ID & Business Details */}
        <div className="p-5 sm:p-6 rounded-2xl bg-slate-50/80 dark:bg-navy/70 border border-slate-200/80 dark:border-white/10 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3 text-brand">
              <div className="w-8 h-8 rounded-lg bg-brand/10 flex items-center justify-center">
                <CreditCard className="w-4 h-4 text-brand" />
              </div>
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {t("impressum.headingVat", "Tax & Identification")}
              </span>
            </div>
            <h3 className="text-sm sm:text-base font-extrabold text-navy-deep dark:text-white">
              {t(
                "impressum.vatDetails",
                "Tax / VAT identification number pursuant to § 27 a UStG: Pending registration / Available upon request"
              )}
            </h3>
            <div className="mt-3 pt-3 border-t border-slate-200/60 dark:border-white/10">
              <span className="text-[11px] font-mono text-slate-500 uppercase block font-bold">
                {t("impressum.headingCompliance", "Standards & Compliance")}
              </span>
              <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                {t(
                  "impressum.complianceDetails",
                  "Digital proof-gated production with German-craft quality standards."
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* EU Dispute Resolution Highlight Card */}
      <div className="not-prose p-5 sm:p-6 rounded-2xl bg-brand/05 dark:bg-brand/10 border border-brand/20 shadow-xs mb-8">
        <div className="flex items-start gap-3.5">
          <div className="w-9 h-9 rounded-xl bg-brand/10 flex items-center justify-center text-brand shrink-0 mt-0.5">
            <Scale className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-navy-deep dark:text-white">
              {t("impressum.headingDispute", "EU Online Dispute Resolution")}
            </h3>
            <p className="mt-1.5 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {t(
                "impressum.disputeText",
                "The European Commission provides a platform for online dispute resolution (ODR): https://ec.europa.eu/consumers/odr/."
              )}
            </p>
            <a
              href="https://ec.europa.eu/consumers/odr/"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2.5 inline-flex items-center gap-1.5 text-xs font-bold text-brand hover:underline"
            >
              <span>ec.europa.eu/consumers/odr</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            <div className="mt-4 pt-3 border-t border-brand/15 text-xs text-slate-500 dark:text-slate-400">
              <strong>{t("impressum.headingConsumerDispute", "Consumer Dispute Resolution:")}</strong>{" "}
              {t(
                "impressum.consumerDisputeText",
                "We are neither willing nor obliged to participate in dispute resolution proceedings before a consumer arbitration board."
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Disclaimers (Liability for content, links, copyright) */}
      <div className="space-y-6 pt-2">
        <div>
          <h2>{t("impressum.headingLiabilityContent", "Liability for Content")}</h2>
          <p>
            {t(
              "impressum.liabilityContentText",
              "As a service provider, we are responsible for our own content on these pages under general law in accordance with Section 7 (1) DDG. According to Sections 8 to 10 DDG, we are not obligated to monitor transmitted or stored third-party information or to investigate circumstances that indicate illegal activity."
            )}
          </p>
        </div>

        <div>
          <h2>{t("impressum.headingLiabilityLinks", "Liability for Links")}</h2>
          <p>
            {t(
              "impressum.liabilityLinksText",
              "Our website contains links to external websites of third parties over whose content we have no influence. Therefore, we cannot assume any liability for this external content. The respective provider or operator of the pages is always responsible for the content of the linked pages."
            )}
          </p>
        </div>

        <div>
          <h2>{t("impressum.headingCopyright", "Copyright & Trademark")}</h2>
          <p>
            {t(
              "impressum.copyrightText",
              "The content and works created by the site operators on these pages are subject to copyright law. Duplication, processing, distribution, and any kind of exploitation outside the limits of copyright law require the written consent of the respective author or creator."
            )}
          </p>
        </div>
      </div>
    </LegalLayout>
  );
}
