import { lazy, Suspense } from "react";
import { createFileRoute, useLocation } from "@tanstack/react-router";
import i18n from "@/i18n/config";
import { seo, createOrganizationSchema, createWebSiteSchema } from "@/utils/seo";
import { Nav } from "@/components/site/Nav";
import { Hero } from "@/components/site/Hero";
import { HomeSkeleton } from "@/components/skeletons/HomeSkeleton";

const ValueProp = lazy(() =>
  import("@/components/site/ValueProp").then((m) => ({ default: m.ValueProp }))
);
const HowItWorks = lazy(() =>
  import("@/components/site/HowItWorks").then((m) => ({ default: m.HowItWorks }))
);
const AmazonShowcase = lazy(() =>
  import("@/components/site/AmazonShowcase").then((m) => ({ default: m.AmazonShowcase }))
);
const VectorPreflightShowcase = lazy(() =>
  import("@/components/site/VectorPreflightShowcase").then((m) => ({ default: m.VectorPreflightShowcase }))
);
const DashboardPreview = lazy(() =>
  import("@/components/site/DashboardPreview").then((m) => ({ default: m.DashboardPreview }))
);
const StackDiagram = lazy(() =>
  import("@/components/site/StackDiagram").then((m) => ({ default: m.StackDiagram }))
);
const Footer = lazy(() =>
  import("@/components/site/Footer").then((m) => ({ default: m.Footer }))
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
        <Suspense fallback={null}>
          <ValueProp />
          <VectorPreflightShowcase />
          <HowItWorks />
          <AmazonShowcase />
          <DashboardPreview />
          <StackDiagram />
        </Suspense>
      </main>
      <Suspense fallback={null}>
        <Footer />
      </Suspense>
    </div>
  );
}
