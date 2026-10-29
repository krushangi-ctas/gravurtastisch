import { createFileRoute, Link } from "@tanstack/react-router";
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
  Zap,
  Layers,
  Clock,
  ArrowRight,
  Headphones,
  Check,
  HelpCircle,
  Truck,
  Box,
  Sliders,
  Award,
  Sparkle,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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

const onboardingSteps = [
  {
    step: "01",
    title: "Instant Intake & File Pre-Flight",
    desc: "Our technical team reviews your submitted requirements, Amazon SP-API scopes, or vector art within 2 business hours.",
    pill: "Response < 2 Hours",
    icon: FileCheck2,
  },
  {
    step: "02",
    title: "Photorealistic Digital Proof",
    desc: "Receive an interactive 3D rendering with micron-accurate laser coordinates and depth simulation before physical processing.",
    pill: "Proof-Gated Manufacturing",
    icon: Layers,
  },
  {
    step: "03",
    title: "Production Lock & Machining",
    desc: "Your Amazon review automation triggers immediately, or custom hardware enters our automated laser line with certified repeatability.",
    pill: "Micron-Precision Laser",
    icon: Zap,
  },
  {
    step: "04",
    title: "Real-Time Tracking & Delivery",
    desc: "Monitor live campaign metrics on your portal or track DHL Express delivery directly to Amazon FBA or European studio hubs.",
    pill: "Insured Tracked Courier",
    icon: Truck,
  },
];

const studioPerks = [
  {
    icon: ShieldCheck,
    badge: "100% Quality Safeguard",
    title: "Zero-Misprint Guarantee",
    desc: "We strictly gate production behind your explicit digital sign-off. If the finished product deviates from your approved proof, we re-machine and re-dispatch at zero extra charge.",
    highlights: [
      "Zero-tolerance vector calibration",
      "Automated edge and curve pre-flight",
      "Complimentary re-run warranty",
    ],
  },
  {
    icon: Zap,
    badge: "Seasonal Capacity",
    title: "Priority Holiday & Peak Quota",
    desc: "Avoid peak-season manufacturing bottlenecks. Registered sellers receive reserved laser bed capacity and fast-tracked dispatch during Black Friday, Cyber Monday, and Prime Days.",
    highlights: [
      "Guaranteed 48h dispatch slots",
      "Reserved machine cycles during Q4",
      "Locked transparent wholesale pricing",
    ],
  },
  {
    icon: Headphones,
    badge: "Direct Communication",
    title: "Dedicated 1-on-1 Studio Lead",
    desc: "Skip generic help desk tickets. You are paired with a dedicated laser engineer and account manager reachable via WhatsApp, email, or telephone for agile changes.",
    highlights: [
      "Direct WhatsApp and phone line",
      "Expert material selection guidance",
      "Fast turnaround on bespoke prototypes",
    ],
  },
];

const registerFaqs = [
  {
    q: "Is there any setup fee or long-term commitment required to register?",
    a: "No. Account registration and initial intake consultations are 100% free of charge with zero setup fees. You only pay when you choose to activate a paid Amazon review quota plan or approve a physical laser engraving production run.",
  },
  {
    q: "How does Gravurtastisch connect to my Amazon Seller Central account safely?",
    a: "We connect via Amazon's official Selling Partner API (SP-API) using OAuth 2.0 authorization. We never see or store your Seller Central master password. All communications are protected by 256-bit TLS encryption in strict adherence to Amazon's Data Protection Policy.",
  },
  {
    q: "Can I register both for Amazon software automation and physical laser engraving?",
    a: "Yes! Our unified client platform allows you to manage automated customer review solicitation workflows while simultaneously placing and tracking bespoke physical laser engraving batches under one consolidated dashboard.",
  },
  {
    q: "What vector formats should I submit for custom laser engraving?",
    a: "We recommend vector formats such as SVG, AI (Adobe Illustrator), EPS, and vector PDF for maximum edge sharpness. If you only possess high-resolution bitmap files (PNG, JPG), our in-house vector studio can digitize and optimize your artwork at no extra charge.",
  },
  {
    q: "Can multi-brand aggregators register multiple seller storefronts?",
    a: "Yes. Our platform natively supports multi-brand management. You can connect and manage multiple Amazon marketplace storefronts (e.g. Amazon DE, FR, IT, ES, UK, US) within a single Gravurtastisch master account with separate billing and campaign permissions.",
  },
  {
    q: "What if I need a physical sample before committing to a larger production run?",
    a: "You can easily request a physical prototype sample through your registered account dashboard. We will engrave your exact vector design on the target material and courier it to your address for final physical touch-and-feel verification.",
  },
];

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

        {/* ==================================================== */}
        {/* 3. POST-REGISTRATION 4-STEP ONBOARDING JOURNEY */}
        {/* ==================================================== */}
        <section className="py-16 lg:py-24 bg-gradient-to-b from-white via-slate-50/60 to-white dark:from-background dark:via-navy-deep/20 dark:to-background border-t border-slate-200/80 dark:border-white/10">
          <Container className="max-w-6xl">
            <Reveal className="text-center max-w-2xl mx-auto mb-14">
              <span className="section-badge mb-3">
                Transparent Execution Pipeline
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-navy-deep dark:text-white leading-[1.18]">
                What happens after you register?
              </h2>
              <p className="mt-3.5 text-slate-600 dark:text-slate-300 text-sm sm:text-base leading-relaxed">
                From initial application review to automated Amazon reviews or precision laser delivery—here is our frictionless 4-step workflow.
              </p>
            </Reveal>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {onboardingSteps.map((step, idx) => {
                const IconComponent = step.icon;
                return (
                  <Reveal key={step.step} delay={idx * 70}>
                    <div className="h-full rounded-2xl liquid-glass border border-white/85 dark:border-white/10 p-6 shadow-[0_4px_16px_rgba(0,50,171,0.06)] hover:shadow-[0_8px_28px_rgba(0,50,171,0.12)] hover:-translate-y-1 transition-all flex flex-col justify-between group">
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-xs font-mono font-black text-brand bg-brand/10 dark:bg-brand/20 px-2.5 py-1 rounded-lg">
                            {step.step}
                          </span>
                          <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-white/5 px-2 py-0.5 rounded-full">
                            Phase {idx + 1}
                          </span>
                        </div>

                        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-brand/10 to-sky-100 dark:from-brand/20 dark:to-sky-950/40 text-brand grid place-items-center mb-4 group-hover:scale-105 group-hover:bg-brand group-hover:text-white transition-all">
                          <IconComponent className="h-6 w-6" />
                        </div>

                        <h3 className="text-lg font-bold text-navy-deep dark:text-white mb-2 leading-snug">
                          {step.title}
                        </h3>

                        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                          {step.desc}
                        </p>
                      </div>

                      <div className="mt-5 pt-4 border-t border-slate-200/60 dark:border-white/10">
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-brand">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                          <span>{step.pill}</span>
                        </span>
                      </div>
                    </div>
                  </Reveal>
                );
              })}
            </div>
          </Container>
        </section>

        {/* ==================================================== */}
        {/* 4. STUDIO GUARANTEES & REGISTERED CLIENT PERKS */}
        {/* ==================================================== */}
        <section className="py-16 lg:py-24 bg-slate-50/70 dark:bg-navy-deep/40 border-t border-slate-200/80 dark:border-white/10">
          <Container className="max-w-6xl">
            <Reveal className="text-center max-w-2xl mx-auto mb-14">
              <span className="section-badge mb-3">
                Why Verified Sellers Partner With Us
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-navy-deep dark:text-white leading-[1.18]">
                Enterprise-grade guarantees for growing brands
              </h2>
              <p className="mt-3.5 text-slate-600 dark:text-slate-300 text-sm sm:text-base leading-relaxed">
                Registered clients receive peace-of-mind safeguards, seasonal production priority, and personal engineer access.
              </p>
            </Reveal>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
              {studioPerks.map((perk, idx) => {
                const PerkIcon = perk.icon;
                return (
                  <Reveal key={perk.title} delay={idx * 80}>
                    <div className="h-full rounded-2xl liquid-glass border border-white/85 dark:border-white/10 p-6 sm:p-7 shadow-[0_4px_16px_rgba(0,50,171,0.06)] hover:shadow-[0_12px_32px_rgba(0,50,171,0.14)] hover:-translate-y-1 transition-all flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <div className="h-11 w-11 rounded-xl bg-brand/10 dark:bg-brand/20 text-brand grid place-items-center">
                            <PerkIcon className="h-5 w-5" />
                          </div>
                          <span className="text-[10px] font-bold text-brand uppercase tracking-wider bg-brand/10 dark:bg-brand/20 px-2.5 py-1 rounded-full">
                            {perk.badge}
                          </span>
                        </div>

                        <h3 className="text-xl font-bold text-navy-deep dark:text-white mb-3">
                          {perk.title}
                        </h3>

                        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
                          {perk.desc}
                        </p>
                      </div>

                      <div className="pt-4 border-t border-slate-200/60 dark:border-white/10 space-y-2.5">
                        {perk.highlights.map((item) => (
                          <div key={item} className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-200">
                            <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                            <span>{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </Reveal>
                );
              })}
            </div>
          </Container>
        </section>

        {/* ==================================================== */}
        {/* 5. REGISTRATION FAQ ACCORDION */}
        {/* ==================================================== */}
        <section className="py-16 lg:py-24 bg-white/80 dark:bg-background border-t border-slate-200/80 dark:border-white/10">
          <Container className="max-w-4xl">
            <Reveal className="text-center max-w-2xl mx-auto mb-12">
              <span className="section-badge mb-3">
                Clear Answers &amp; Guidance
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-navy-deep dark:text-white leading-[1.18]">
                Frequently asked onboarding questions
              </h2>
              <p className="mt-3 text-slate-600 dark:text-slate-300 text-sm sm:text-base leading-relaxed">
                Everything you need to know about setting up your account, integrating your Amazon storefront, and custom laser proofing.
              </p>
            </Reveal>

            <Accordion type="single" collapsible className="w-full space-y-3.5">
              {registerFaqs.map((faq, idx) => (
                <Reveal key={faq.q} delay={idx * 30}>
                  <AccordionItem
                    value={`reg-faq-${idx}`}
                    className="rounded-2xl liquid-glass border border-[#0032ab]/12 px-5 sm:px-6 shadow-2xs hover:border-[#0032ab]/30 transition-all border-b-0"
                  >
                    <AccordionTrigger className="text-left hover:no-underline font-bold text-navy-deep dark:text-white text-base sm:text-lg py-4 sm:py-5 flex gap-3.5">
                      <span className="flex items-center gap-3.5">
                        <HelpCircle className="h-5 w-5 text-brand shrink-0" />
                        <span>{faq.q}</span>
                      </span>
                    </AccordionTrigger>
                    <AccordionContent className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed pb-5 pl-8.5">
                      {faq.a}
                    </AccordionContent>
                  </AccordionItem>
                </Reveal>
              ))}
            </Accordion>
          </Container>
        </section>

        {/* ==================================================== */}
        {/* 6. ENTERPRISE / CUSTOM ASSISTANCE CTA */}
        {/* ==================================================== */}
        <section className="py-12 lg:py-16 bg-gradient-to-b from-slate-50/50 to-sky-100/30 dark:from-background dark:to-navy-deep/20 border-t border-slate-200/80 dark:border-white/10">
          <Container className="max-w-4xl">
            <Reveal>
              <div className="rounded-3xl p-8 sm:p-10 liquid-glass border border-white/90 dark:border-white/10 shadow-[0_8px_32px_rgba(0,50,171,0.08)] flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
                <div className="max-w-xl">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand/10 text-brand text-xs font-bold mb-3">
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Have Unique Project Requirements?</span>
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-navy-deep dark:text-white leading-tight">
                    Need customized volume or agency white-labeling?
                  </h3>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                    Connect directly with our engineering desk for tailored SP-API rate limit allocations, custom fixture development, or multi-hub fulfillment.
                  </p>
                </div>
                <div className="shrink-0">
                  <Link
                    to="/contact"
                    className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-xl bg-brand hover:bg-[#002685] text-white font-bold text-sm shadow-[0_4px_16px_rgba(0,50,171,0.25)] hover:shadow-[0_6px_22px_rgba(0,50,171,0.35)] hover:-translate-y-0.5 transition-all"
                  >
                    <span>Contact Enterprise Desk</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </Reveal>
          </Container>
        </section>
      </main>

      <Footer />
    </div>
  );
}

