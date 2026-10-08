import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { LegalLayout } from "@/components/site/LegalLayout";
import { LegalPageSkeleton } from "@/components/skeletons/LegalPageSkeleton";
import i18n from "@/i18n/config";

import { useWebsiteConfiguration } from "@/hooks/useWebsiteConfiguration";

export const Route = createFileRoute("/privacy")({
  pendingComponent: LegalPageSkeleton,
  head: () => ({
    meta: [
      { title: i18n.t('meta.privacyTitle') },
      { name: "description", content: i18n.t('meta.privacyDesc') },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  const { t } = useTranslation();
  const { config } = useWebsiteConfiguration();
  const contactEmail = config?.contact?.email || "info@ctasis.com";
  const isSkeletonPreview = typeof window !== "undefined" && window.location.search.includes("skeleton=true");

  if (isSkeletonPreview) {
    return <LegalPageSkeleton />;
  }

  return (
    <LegalLayout title={t('privacy.title')} updated={t('privacy.updated')}>
      <p>{t('privacy.para1')}</p>

      <h2>{t('privacy.heading1')}</h2>
      <ul>
        <li>{t('privacy.list1Item1')}</li>
        <li>{t('privacy.list1Item2')}</li>
        <li>{t('privacy.list1Item3')}</li>
      </ul>

      <h2>{t('privacy.heading2')}</h2>
      <ul>
        <li>{t('privacy.list2Item1')}</li>
        <li>{t('privacy.list2Item2')}</li>
        <li>{t('privacy.list2Item3')}</li>
        <li>{t('privacy.list2Item4')}</li>
      </ul>

      <h2>{t('privacy.heading3')}</h2>
      <p>{t('privacy.para3')}</p>

      <h2>{t('privacy.heading4')}</h2>
      <p>{t('privacy.para4')}</p>

      <h2>{t('privacy.heading5')}</h2>
      <p>
        {t('privacy.para5')}{" "}
        <a href={`mailto:${contactEmail}`} className="text-brand hover:underline">
          {contactEmail}
        </a>.
      </p>
    </LegalLayout>
  );
}
