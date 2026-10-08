import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { LegalLayout } from "@/components/site/LegalLayout";
import { LegalPageSkeleton } from "@/components/skeletons/LegalPageSkeleton";
import i18n from "@/i18n/config";

import { useWebsiteConfiguration } from "@/hooks/useWebsiteConfiguration";

export const Route = createFileRoute("/terms")({
  pendingComponent: LegalPageSkeleton,
  head: () => ({
    meta: [
      { title: i18n.t('meta.termsTitle') },
      { name: "description", content: i18n.t('meta.termsDesc') },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
  const { t } = useTranslation();
  const { config } = useWebsiteConfiguration();
  const contactEmail = config?.contact?.email || "info@ctasis.com";
  const isSkeletonPreview = typeof window !== "undefined" && window.location.search.includes("skeleton=true");

  if (isSkeletonPreview) {
    return <LegalPageSkeleton />;
  }

  return (
    <LegalLayout title={t('terms.title')} updated={t('terms.updated')}>
      <p>{t('terms.para1')}</p>

      <h2>{t('terms.heading1')}</h2>
      <p>{t('terms.para1b')}</p>

      <h2>{t('terms.heading2')}</h2>
      <ul>
        <li>{t('terms.list1Item1')}</li>
        <li>{t('terms.list1Item2')}</li>
        <li>{t('terms.list1Item3')}</li>
        <li>{t('terms.list1Item4')}</li>
      </ul>

      <h2>{t('terms.heading3')}</h2>
      <p>{t('terms.para3')}</p>

      <h2>{t('terms.heading4')}</h2>
      <p>{t('terms.para4')}</p>

      <h2>{t('terms.heading5')}</h2>
      <p>{t('terms.para5')}</p>

      <h2>{t('terms.heading6')}</h2>
      <p>
        {t('terms.para6')}{" "}
        <a href={`mailto:${contactEmail}`} className="text-brand hover:underline">
          {contactEmail}
        </a>.
      </p>
    </LegalLayout>
  );
}
