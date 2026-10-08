import { createFileRoute, useLocation } from "@tanstack/react-router";
import i18n from "@/i18n/config";
import { Nav } from "@/components/site/Nav";
import { Hero } from "@/components/site/Hero";
import { ValueProp } from "@/components/site/ValueProp";
import { AmazonShowcase } from "@/components/site/AmazonShowcase";
import { HowItWorks } from "@/components/site/HowItWorks";
import { DashboardPreview } from "@/components/site/DashboardPreview";
import { StackDiagram } from "@/components/site/StackDiagram";
import { Pricing } from "@/components/site/Pricing";
import { RegisterAndContact } from "@/components/site/RegisterAndContact";
import { Footer } from "@/components/site/Footer";
import { HomeSkeleton } from "@/components/skeletons/HomeSkeleton";

export const Route = createFileRoute("/")({
  pendingComponent: HomeSkeleton,
  head: () => ({
    meta: [
      { title: i18n.t('meta.indexTitle') },
      { name: "description", content: i18n.t('meta.indexDesc') },
      { property: "og:title", content: i18n.t('meta.ogTitle') },
      { property: "og:description", content: i18n.t('meta.ogDesc') },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: i18n.t('meta.twitterTitle') },
      { name: "twitter:description", content: i18n.t('meta.twitterDesc') },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
  component: Index,
});

function Index() {
  const location = useLocation();
  const isSkeletonPreview = typeof window !== "undefined" && window.location.search.includes("skeleton=true");

  if (isSkeletonPreview) {
    return <HomeSkeleton />;
  }

  return (
    <div className="min-h-screen bg-background text-navy-deep">
      <Nav />
      <main>
        <Hero />
        <ValueProp />
        <HowItWorks />
        <AmazonShowcase />
        <DashboardPreview />
        <StackDiagram />
        <Pricing />
        <RegisterAndContact />
      </main>
      <Footer />
    </div>
  );
}
