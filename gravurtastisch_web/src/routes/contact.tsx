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
  Globe,
  Truck,
  ShieldCheck,
  CheckCircle2,
  HelpCircle,
  Sparkles,
  Calendar,
  Layers,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { FlagDE, FlagGB, FlagFR, FlagIcon } from "@/components/ui/FlagIcon";
import i18n from "@/i18n/config";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      {
        title:
          i18n.exists("contact.pageTitle")
            ? i18n.t("contact.pageTitle")
            : "Contact Us - Gravurtastisch Studio",
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

  const contactFaqs = [
    {
      q: "How fast do you respond to custom order inquiries?",
      a: "Our studio desk typically responds within 2 business hours during working days (Mon–Fri 10:30 AM–8:30 PM IST), and always guarantees a reply within one business day.",
    },
    {
      q: "Can I request changes to my digital proof before engraving begins?",
      a: "Yes! Production only commences after your explicit digital proof approval. We provide unlimited mockup iterations to ensure font kerning, graphic contrast, and cylinder placement are 100% satisfactory.",
    },
    {
      q: "Do you handle rush corporate orders and physical sample proofs?",
      a: "Yes. For volume corporate gifting (50+ units), we can rush-produce and courier a physical sample piece within 48 hours for executive review before initiating the full production run.",
    },
    {
      q: "What file formats should I send with my message?",
      a: "Vector files (SVG, AI, EPS, or vector PDF) produce the sharpest 1200 DPI laser results. High-resolution raster images (PNG, JPEG at 300+ DPI with solid contrast) are also fully supported.",
    },
    {
      q: "Where is your manufacturing facility located?",
      a: "Our primary laser engraving and personalization studio is located in Ahmedabad, Gujarat, India, with localized logistics lanes serving direct Amazon EU & UK fulfillment routes.",
    },
  ];

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
                  href="mailto:info@gravurtastisch.com"
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
                      info@gravurtastisch.com
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

        {/* ==================================================== */}
        {/* 3. GLOBAL LOGISTICS & REGIONAL FULFILLMENT HUBS */}
        {/* ==================================================== */}
        <section className="py-16 lg:py-20 bg-white/70 dark:bg-navy-deep/40 border-t border-slate-200/80 dark:border-white/10 relative overflow-hidden">
          <Container className="max-w-6xl">
            <Reveal className="text-center max-w-3xl mx-auto mb-12">
              <span className="section-badge mb-3">
                Global Delivery Network
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-navy-deep dark:text-white leading-[1.18]">
                Where we craft and deliver worldwide
              </h2>
              <p className="mt-3.5 text-slate-600 dark:text-slate-300 text-sm sm:text-base leading-relaxed">
                Whether you order personalized drinkware for European gifting campaigns or corporate batch orders, our coordinated international lanes ensure rapid and reliable courier transit.
              </p>
            </Reveal>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {/* Hub 1: Germany & Central Europe */}
              <Reveal delay={50}>
                <div className="h-full p-6 rounded-3xl liquid-glass border border-[#0032ab]/12 shadow-xs flex flex-col justify-between hover:border-brand/30 transition-all">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="h-10 w-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 grid place-items-center text-amber-700">
                        <FlagDE className="w-5 h-5 rounded-xs" />
                      </div>
                      <span className="text-[11px] font-bold text-brand bg-brand/10 px-2.5 py-1 rounded-full">
                        DHL Express
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-navy-deep dark:text-white">
                      Germany &amp; Central EU
                    </h3>
                    <p className="mt-2 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      Direct delivery across Berlin, Frankfurt, Munich, Vienna, and Zurich with compliant EU VAT invoicing.
                    </p>
                  </div>
                  <div className="mt-5 pt-4 border-t border-slate-100 dark:border-white/10 flex items-center justify-between text-xs text-slate-500">
                    <span>Transit Window</span>
                    <strong className="text-navy-deep dark:text-slate-200">2–4 Business Days</strong>
                  </div>
                </div>
              </Reveal>

              {/* Hub 2: United Kingdom */}
              <Reveal delay={100}>
                <div className="h-full p-6 rounded-3xl liquid-glass border border-[#0032ab]/12 shadow-xs flex flex-col justify-between hover:border-brand/30 transition-all">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="h-10 w-10 rounded-2xl bg-blue-500/10 border border-blue-500/20 grid place-items-center text-blue-700">
                        <FlagGB className="w-5 h-5 rounded-xs" />
                      </div>
                      <span className="text-[11px] font-bold text-sky-700 bg-sky-100 px-2.5 py-1 rounded-full">
                        Royal Mail / DPD
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-navy-deep dark:text-white">
                      United Kingdom
                    </h3>
                    <p className="mt-2 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      Fast tracked courier service across London, Manchester, and Birmingham for personalized tumblers and gifts.
                    </p>
                  </div>
                  <div className="mt-5 pt-4 border-t border-slate-100 dark:border-white/10 flex items-center justify-between text-xs text-slate-500">
                    <span>Transit Window</span>
                    <strong className="text-navy-deep dark:text-slate-200">3–5 Business Days</strong>
                  </div>
                </div>
              </Reveal>

              {/* Hub 3: France & Western Europe */}
              <Reveal delay={150}>
                <div className="h-full p-6 rounded-3xl liquid-glass border border-[#0032ab]/12 shadow-xs flex flex-col justify-between hover:border-brand/30 transition-all">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="h-10 w-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 grid place-items-center text-indigo-700">
                        <FlagFR className="w-5 h-5 rounded-xs" />
                      </div>
                      <span className="text-[11px] font-bold text-indigo-700 bg-indigo-100 px-2.5 py-1 rounded-full">
                        Colissimo / UPS
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-navy-deep dark:text-white">
                      France &amp; Western EU
                    </h3>
                    <p className="mt-2 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      Custom photo mugs, textiles, and laser-etched keepsakes delivered safely across Paris, Lyon, and Brussels.
                    </p>
                  </div>
                  <div className="mt-5 pt-4 border-t border-slate-100 dark:border-white/10 flex items-center justify-between text-xs text-slate-500">
                    <span>Transit Window</span>
                    <strong className="text-navy-deep dark:text-slate-200">3–5 Business Days</strong>
                  </div>
                </div>
              </Reveal>

              {/* Hub 4: Primary Craft Studio */}
              <Reveal delay={200}>
                <div className="h-full p-6 rounded-3xl liquid-glass border border-brand/25 bg-gradient-to-br from-brand/5 via-white to-brand/10 dark:from-navy dark:via-navy-soft dark:to-navy-deep shadow-xs flex flex-col justify-between hover:border-brand/40 transition-all">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="h-10 w-10 rounded-2xl bg-brand/15 text-brand grid place-items-center">
                        <Sparkles className="w-5 h-5" />
                      </div>
                      <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full">
                        Central Studio
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-navy-deep dark:text-white">
                      Studio Headquarters
                    </h3>
                    <p className="mt-2 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      High-precision 1200 DPI fiber laser engraving, color sublimation lab, vector pre-flight, and QA inspection.
                    </p>
                  </div>
                  <div className="mt-5 pt-4 border-t border-slate-200/80 dark:border-white/10 flex items-center justify-between text-xs text-slate-500">
                    <span>Location</span>
                    <strong className="text-brand font-semibold">Ahmedabad, India</strong>
                  </div>
                </div>
              </Reveal>
            </div>
          </Container>
        </section>

        {/* ==================================================== */}
        {/* 4. STUDIO SERVICE COMMITMENTS & RESPONSE SLA MATRIX */}
        {/* ==================================================== */}
        <section className="py-16 bg-surface/50 border-t border-slate-200/80 dark:border-white/10">
          <Container className="max-w-6xl">
            <div className="grid lg:grid-cols-3 gap-6">
              <Reveal delay={50}>
                <div className="p-7 rounded-3xl bg-white dark:bg-navy-deep/80 border border-brand/10 shadow-xs h-full flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="h-11 w-11 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                      <Clock className="w-5 h-5" />
                    </div>
                    <h3 className="text-lg font-bold text-navy-deep dark:text-white">
                      Fast Support Turnaround
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                      We value your timeline. Order inquiries, quote requests, and artwork questions receive written answers within 2 hours during active studio hours.
                    </p>
                  </div>
                  <ul className="mt-5 pt-4 border-t border-slate-100 dark:border-white/10 space-y-2 text-xs text-slate-600 dark:text-slate-400">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>Dedicated human desk — no automated bot loops</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>Direct WhatsApp &amp; phone line access</span>
                    </li>
                  </ul>
                </div>
              </Reveal>

              <Reveal delay={100}>
                <div className="p-7 rounded-3xl bg-white dark:bg-navy-deep/80 border border-brand/10 shadow-xs h-full flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="h-11 w-11 rounded-2xl bg-brand/10 text-brand flex items-center justify-center">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <h3 className="text-lg font-bold text-navy-deep dark:text-white">
                      Proof-Gated Manufacturing
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                      Zero surprises when parcels land. We send visual mockups showing exact millimeter placement, contrast, and scaling before our laser machines turn on.
                    </p>
                  </div>
                  <ul className="mt-5 pt-4 border-t border-slate-100 dark:border-white/10 space-y-2 text-xs text-slate-600 dark:text-slate-400">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-brand shrink-0" />
                      <span>Unlimited proof revisions before craft lock</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-brand shrink-0" />
                      <span>Vector optical correction for cylindrical items</span>
                    </li>
                  </ul>
                </div>
              </Reveal>

              <Reveal delay={150}>
                <div className="p-7 rounded-3xl bg-white dark:bg-navy-deep/80 border border-brand/10 shadow-xs h-full flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="h-11 w-11 rounded-2xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center">
                      <Truck className="w-5 h-5" />
                    </div>
                    <h3 className="text-lg font-bold text-navy-deep dark:text-white">
                      Sample Prototypes Available
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                      Planning a 100+ unit corporate event or recurring Amazon catalog run? Request an initial sample piece to feel the laser texture and verify color fidelity in person.
                    </p>
                  </div>
                  <ul className="mt-5 pt-4 border-t border-slate-100 dark:border-white/10 space-y-2 text-xs text-slate-600 dark:text-slate-400">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
                      <span>Sample fee credited toward volume reorders</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
                      <span>Full packaging and branding unboxing check</span>
                    </li>
                  </ul>
                </div>
              </Reveal>
            </div>
          </Container>
        </section>

        {/* ==================================================== */}
        {/* 5. CONTACT & SUPPORT FAQ ACCORDION */}
        {/* ==================================================== */}
        <section className="py-16 lg:py-20 bg-white/80 dark:bg-navy-deep/60 border-t border-slate-200/80 dark:border-white/10">
          <Container className="max-w-4xl">
            <Reveal className="text-center max-w-2xl mx-auto mb-10">
              <span className="section-badge mb-3">
                Help &amp; Support Questions
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-navy-deep dark:text-white leading-[1.18]">
                Frequently asked contact questions
              </h2>
              <p className="mt-3 text-slate-600 dark:text-slate-300 text-sm sm:text-base">
                Find quick answers about proof turnaround, corporate inquiries, sample requests, and shipping.
              </p>
            </Reveal>

            <Accordion type="single" collapsible className="w-full space-y-3.5">
              {contactFaqs.map((faq, idx) => (
                <Reveal key={faq.q} delay={idx * 40}>
                  <AccordionItem
                    value={`contact-faq-${idx}`}
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
      </main>

      <Footer />
    </div>
  );
}
