import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Nav } from "@/components/site/Nav";
import { Footer } from "@/components/site/Footer";
import { ContactSection } from "@/components/site/RegisterAndContact";
import { Container } from "@/components/site/Container";
import { Reveal } from "@/components/site/Reveal";
import {
  Mail,
  Phone,
  MapPin,
  Clock,
  Headphones,
  ArrowRight,
} from "lucide-react";
import i18n from "@/i18n/config";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      {
        title:
          i18n.exists("contact.pageTitle")
            ? i18n.t("contact.pageTitle")
            : "Contact Us - Gravurtastisch",
      },
      {
        name: "description",
        content:
          i18n.exists("contact.pageDesc")
            ? i18n.t("contact.pageDesc")
            : "Get in touch with Gravurtastisch. Send us a message about custom products, proofs, orders, or support. We reply within one business day.",
      },
      {
        property: "og:title",
        content: "Contact Gravurtastisch Studio",
      },
      {
        property: "og:description",
        content:
          "Have questions about custom projects, bulk orders, or Amazon integration? Talk to our studio team.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/contact" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/contact" }],
  }),
  component: ContactPage,
});

function ContactPage() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-background text-navy-deep dark:text-slate-100 selection:bg-brand/20 selection:text-brand overflow-x-hidden w-full max-w-full">
      <Nav />

      <main className="pb-20 w-full max-w-full overflow-x-hidden">
        {/* ==================================================== */}
        {/* 1. HERO SECTION (SKY BLUE GRADIENT - SAME AS GUIDE) */}
        {/* ==================================================== */}
        <section className="relative overflow-hidden pt-24 pb-12 lg:pt-28 lg:pb-16 bg-gradient-to-b from-[#c6dbf2] via-[#d5e4f7] to-[#bfd6f0] text-slate-800 w-full max-w-full">
          <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-brand/10 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

          <Container className="relative max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-12 gap-8 items-center">
              {/* Left Column: Direct Studio Contact Context */}
              <Reveal className="lg:col-span-7 text-left">
                <div className="section-badge mb-4">
                  <Headphones className="h-3.5 w-3.5 text-brand shrink-0" />
                  <span>Dedicated Studio Support</span>
                </div>

                <h1 className="text-3xl sm:text-4xl lg:text-[3rem] font-extrabold tracking-tight leading-[1.12] text-navy-deep">
                  <span>Talk to our studio</span>{" "}
                  <span className="bg-gradient-to-r from-[#0032ab] via-[#2563eb] to-[#7c3aed] text-transparent bg-clip-text">
                    expert team
                  </span>
                </h1>

                <p className="mt-4 text-slate-700 text-base sm:text-lg leading-relaxed max-w-xl font-medium">
                  Have questions about digital proofs, laser-engraved lines, custom products, or Amazon SP-API integrations? Send a message below or reach us directly.
                </p>

                {/* Live Availability Tag */}
                <div className="mt-5 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/70 backdrop-blur-md border border-white/90 text-slate-700 text-xs font-semibold shadow-2xs">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Studio desk is online &middot; Average reply &lt; 2 hours</span>
                </div>
              </Reveal>

              {/* Right Column: 3 Liquid Glass Studio Channel Cards */}
              <Reveal className="lg:col-span-5 flex flex-col gap-3" delay={100}>
                {/* Channel 1: Email */}
                <a
                  href="mailto:info@gravurtastich.com"
                  className="group rounded-2xl liquid-glass border border-white/85 p-4 shadow-[0_4px_16px_rgba(0,50,171,0.06)] hover:shadow-[0_8px_24px_rgba(0,50,171,0.14)] hover:-translate-y-0.5 transition-all flex items-center gap-3.5"
                >
                  <div className="h-10 w-10 rounded-xl bg-brand/10 text-brand grid place-items-center shrink-0 group-hover:bg-brand group-hover:text-white transition-colors">
                    <Mail className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold text-brand uppercase">Email Support</span>
                      <span className="text-[9.5px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full">24h SLA</span>
                    </div>
                    <p className="text-sm font-bold text-navy-deep group-hover:text-brand transition-colors truncate">
                      info@gravurtastich.com
                    </p>
                  </div>
                </a>

                {/* Channel 2: Phone */}
                <a
                  href="tel:+917948789349"
                  className="group rounded-2xl liquid-glass border border-white/85 p-4 shadow-[0_4px_16px_rgba(0,50,171,0.06)] hover:shadow-[0_8px_24px_rgba(0,50,171,0.14)] hover:-translate-y-0.5 transition-all flex items-center gap-3.5"
                >
                  <div className="h-10 w-10 rounded-xl bg-sky-100 text-sky-700 grid place-items-center shrink-0 group-hover:bg-sky-600 group-hover:text-white transition-colors">
                    <Phone className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold text-sky-700 uppercase">Phone Desk</span>
                      <span className="text-[9.5px] text-slate-600 font-medium">Mon–Fri</span>
                    </div>
                    <p className="text-sm font-bold text-navy-deep group-hover:text-brand transition-colors">
                      +91 79487 89349 <span className="text-xs font-normal text-slate-600">(10:30 AM–8:30 PM IST)</span>
                    </p>
                  </div>
                </a>

                {/* Channel 3: Studio Location */}
                <div className="rounded-2xl liquid-glass border border-white/85 p-4 shadow-[0_4px_16px_rgba(0,50,171,0.06)] flex items-center gap-3.5">
                  <div className="h-10 w-10 rounded-xl bg-purple-100 text-purple-700 grid place-items-center shrink-0">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] font-mono font-bold text-purple-700 uppercase">Studio Location</span>
                    <p className="text-sm font-bold text-navy-deep">
                      Ahmedabad, Gujarat &middot; India
                    </p>
                  </div>
                </div>
              </Reveal>
            </div>
          </Container>
        </section>

        {/* ==================================================== */}
        {/* 2. CONTACT US FORM & DETAILS */}
        {/* ==================================================== */}
        <ContactSection />
      </main>

      <Footer />
    </div>
  );
}
