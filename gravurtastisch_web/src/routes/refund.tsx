import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { LegalLayout } from "@/components/site/LegalLayout";
import { LegalPageSkeleton } from "@/components/skeletons/LegalPageSkeleton";
import i18n from "@/i18n/config";

import { useWebsiteConfiguration } from "@/hooks/useWebsiteConfiguration";

export const Route = createFileRoute("/refund")({
  pendingComponent: LegalPageSkeleton,
  head: () => ({
    meta: [
      { title: i18n.t('meta.refundTitle') },
      { name: "description", content: i18n.t('meta.refundDesc') },
    ],
  }),
  component: RefundPage,
});

function RefundPage() {
  const { t } = useTranslation();
  const { config } = useWebsiteConfiguration();
  const contactEmail = config?.contact?.email || "info@ctasis.com";
  const isSkeletonPreview = typeof window !== "undefined" && window.location.search.includes("skeleton=true");

  if (isSkeletonPreview) {
    return <LegalPageSkeleton />;
  }

  return (
    <LegalLayout title={t('refund.title')} updated={t('refund.updated')}>
      <p>{t('refund.para1')}</p>

      <h2>{t('refund.heading1')}</h2>
      <p>{t('refund.para1b')}</p>

      <h2>{t('refund.heading2')}</h2>
      <ul>
        <li>{t('refund.list1Item1')}</li>
        <li>{t('refund.list1Item2')}</li>
        <li>{t('refund.list1Item3')}</li>
      </ul>

      <h2>{t('refund.heading3')}</h2>
      <p>
        {t('refund.para3Prefix', 'Email')}{" "}
        <a href={`mailto:${contactEmail}`} className="text-brand hover:underline">
          {contactEmail}
        </a>{" "}
        {t('refund.para3Suffix', 'with your account email, plan name, and reason for the request. We typically respond within one business day.')}
      </p>
    </LegalLayout>
  );
}
