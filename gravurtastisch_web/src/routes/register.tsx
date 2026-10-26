import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Nav } from "@/components/site/Nav";
import { Footer } from "@/components/site/Footer";
import { RegisterSection } from "@/components/site/RegisterAndContact";
import { Container } from "@/components/site/Container";
import { Reveal } from "@/components/site/Reveal";
import {
  ShieldCheck,
  Lock,
  Star,
  CheckCircle2,
  FileCheck2,
  Sparkles,
} from "lucide-react";
import i18n from "@/i18n/config";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      {
        title:
          i18n.exists("register.pageTitle")
            ? i18n.t("register.pageTitle")
            : "Registration - Gravurtastisch",
      },
      {
        name: "description",
        content:
          i18n.exists("register.pageDesc")
            ? i18n.t("register.pageDesc")
            : "Submit your custom order or register your seller account for automated Amazon review requests, digital proofs, and laser engraving.",
      },
      {
        property: "og:title",
        content: "Gravurtastisch - Custom Order & Seller Registration",
      },
      {
        property: "og:description",
        content:
          "Start your personalized project or register as an Amazon seller for automated review solicitations and studio engraving.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/register" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/register" }],
  }),
  component: RegisterPage,
});

function RegisterPage() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-background text-navy-deep dark:text-slate-100 selection:bg-brand/20 selection:text-brand overflow-x-hidden w-full max-w-full">
      <Nav />

      <main className="pb-16 w-full max-w-full overflow-x-hidden">
        {/* ==================================================== */}
        {/* DISTINCT HERO: ONBOARDING STEPPER & TRUST RIBBON */}
        {/* (SKY BLUE GRADIENT - SAME AS GUIDE) */}
        {/* ==================================================== */}
        <section className="relative overflow-hidden pt-24 pb-12 lg:pt-28 lg:pb-16 bg-gradient-to-b from-[#c6dbf2] via-[#d5e4f7] to-[#bfd6f0] text-slate-800 w-full max-w-full">
          <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-brand/10 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

          <Container className="relative max-w-5xl mx-auto text-center">
            <Reveal className="max-w-4xl mx-auto flex flex-col items-center">
              {/* Modern 3-Step Onboarding Indicator (Liquid Glass) */}
              <div className="inline-flex items-center gap-2 sm:gap-4 p-1.5 px-3 sm:px-4 rounded-full bg-white/70 backdrop-blur-md border border-white/80 shadow-2xs mb-5 text-xs font-semibold">
                <span className="flex items-center gap-1.5 text-brand font-bold">
                  <span className="h-5 w-5 rounded-full bg-brand text-white text-[11px] grid place-items-center font-mono">1</span>
                  <span>Intake Form</span>
                </span>
                <span className="text-slate-400 font-normal">&rarr;</span>
                <span className="flex items-center gap-1.5 text-slate-600">
                  <span className="h-5 w-5 rounded-full bg-white/80 text-slate-700 text-[11px] grid place-items-center font-mono border border-slate-300/60">2</span>
                  <span>Select Plan</span>
                </span>
                <span className="text-slate-400 font-normal">&rarr;</span>
                <span className="flex items-center gap-1.5 text-slate-600">
                  <span className="h-5 w-5 rounded-full bg-white/80 text-slate-700 text-[11px] grid place-items-center font-mono border border-slate-300/60">3</span>
                  <span>Review Quota Active</span>
                </span>
              </div>

              {/* Centered Heading with Gradient Accent */}
              <h1 className="text-3xl sm:text-4xl lg:text-[3.25rem] font-extrabold tracking-tight text-navy-deep leading-[1.1] text-center">
                <span>Seller Registration &amp;</span>{" "}
                <span className="bg-gradient-to-r from-[#0032ab] via-[#2563eb] to-[#7c3aed] text-transparent bg-clip-text">
                  Custom Project Intake
                </span>
              </h1>

              <p className="mt-4 text-slate-700 text-base sm:text-lg leading-relaxed max-w-2xl font-medium text-center mx-auto">
                Complete the intake application below to activate your Amazon review requests quota and submit project specifications for instant proofs.
              </p>

              {/* Trust & Compliance Strip in liquid-glass pills */}
              <div className="mt-6 flex flex-wrap justify-center items-center gap-3 sm:gap-4 text-xs text-slate-700 font-semibold">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/70 backdrop-blur-sm border border-white/80 shadow-2xs">
                  <Lock className="h-3.5 w-3.5 text-emerald-600" />
                  <span>256-Bit TLS Encrypted</span>
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/70 backdrop-blur-sm border border-white/80 shadow-2xs">
                  <ShieldCheck className="h-3.5 w-3.5 text-brand" />
                  <span>Official Amazon SP-API Partner</span>
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/70 backdrop-blur-sm border border-white/80 shadow-2xs">
                  <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                  <span>Trusted by 250+ Verified Sellers</span>
                </span>
              </div>
            </Reveal>
          </Container>
        </section>

        {/* ==================================================== */}
        {/* 2. REGISTRATION FORM COMPONENT */}
        {/* ==================================================== */}
        <RegisterSection />
      </main>

      <Footer />
    </div>
  );
}
