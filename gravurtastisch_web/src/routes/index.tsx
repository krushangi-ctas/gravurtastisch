import { lazy, Suspense } from "react";
import { createFileRoute, useLocation } from "@tanstack/react-router";
import i18n from "@/i18n/config";
import { seo, createOrganizationSchema, createWebSiteSchema } from "@/utils/seo";
import { Nav } from "@/components/site/Nav";
import { Hero } from "@/components/site/Hero";
import { ValueProp } from "@/components/site/ValueProp";
import { HowItWorks } from "@/components/site/HowItWorks";
import { AmazonShowcase } from "@/components/site/AmazonShowcase";
import { Footer } from "@/components/site/Footer";
import { HomeSkeleton } from "@/components/skeletons/HomeSkeleton";

const VectorPreflightShowcase = lazy(() =>
  import("@/components/site/VectorPreflightShowcase").then((m) => ({ default: m.VectorPreflightShowcase }))
);
const DashboardPreview = lazy(() =>
  import("@/components/site/DashboardPreview").then((m) => ({ default: m.DashboardPreview }))
);
const StackDiagram = lazy(() =>
  import("@/components/site/StackDiagram").then((m) => ({ default: m.StackDiagram }))
);

export const Route = createFileRoute("/")({
  pendingComponent: HomeSkeleton,
  head: () => {
    const { meta, links } = seo({
      title: i18n.t("meta.indexTitle", "Gravurtastisch - Custom Photo Cups, Laser Engraving & Personalized Gifts"),
      description: i18n.t(
        "meta.indexDesc",
        "Premium custom studio for photo mugs, laser-engraved kitchenware, apparel, and keepsakes. Free digital proofs, German-craft precision, and reliable delivery."
      ),
      url: "/",
      keywords: [
        "lasergravur",
        "fototassen",
        "personalisierte geschenke",
        "custom engraving",
        "amazon fba fulfillment",
        "geschenkideen mit gravur",
      ],
    });

    return {
      meta,
      links,
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify(createOrganizationSchema()),
        },
        {
          type: "application/ld+json",
          children: JSON.stringify(createWebSiteSchema()),
        },
      ],
    };
  },
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
        <Suspense fallback={null}>
          <VectorPreflightShowcase />
        </Suspense>
        <HowItWorks />
        <AmazonShowcase />
        <Suspense fallback={null}>
          <DashboardPreview />
          <StackDiagram />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
