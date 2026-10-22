import {
  Clock,
  Star,
  Truck,
  Sparkles,
  Shield,
  ShieldCheck,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Container } from "./Container";
import {
  FlagGB,
  FlagDE,
  FlagFR,
  FlagIT,
  FlagES,
} from "@/components/ui/FlagIcon";

export function Hero() {
  const { t } = useTranslation();

  return (
    <section
      id="home"
      className="relative overflow-hidden pt-28 pb-16 lg:pt-32 lg:pb-24 bg-gradient-to-b from-[#edf4fe] via-[#e2edfc] to-[#edf4fe] text-slate-800"
    >
      {/* Ambient Radial Soft Glows */}
      <div className="absolute top-12 left-1/2 -translate-x-1/2 w-[850px] h-[400px] bg-gradient-to-b from-indigo-200/35 via-sky-200/25 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -left-20 top-1/4 w-[500px] h-[500px] bg-gradient-to-tr from-sky-300/30 via-indigo-200/20 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -right-20 top-1/4 w-[500px] h-[500px] bg-gradient-to-tl from-indigo-300/35 via-purple-200/25 to-transparent rounded-full blur-3xl pointer-events-none" />

      {/* Floating 3D Ambient Spheres matching reference artwork */}
      {/* Left side spheres */}
      <div className="hidden lg:block absolute top-[36%] left-[2.5%] w-6 h-6 rounded-full bg-gradient-to-br from-[#60a5fa] to-[#2563eb] shadow-[0_4px_12px_rgba(37,99,235,0.4)] pointer-events-none z-10" />
      <div className="hidden lg:block absolute bottom-[22%] left-[4%] w-11 h-11 rounded-full bg-gradient-to-br from-[#818cf8] via-[#6366f1] to-[#3b82f6] shadow-[0_8px_20px_rgba(99,102,241,0.35)] pointer-events-none z-10" />
      <div className="hidden lg:block absolute bottom-[40%] left-[20%] w-5 h-5 rounded-full bg-gradient-to-br from-[#38bdf8] to-[#2563eb] shadow-md pointer-events-none z-10" />
      <div className="hidden lg:block absolute bottom-[28%] left-[24%] w-4 h-4 rounded-full bg-gradient-to-br from-[#a855f7] to-[#7c3aed] shadow-[0_4px_10px_rgba(124,58,237,0.3)] pointer-events-none z-10" />

      {/* Right side spheres */}
      <div className="hidden lg:block absolute top-[16%] right-[24%] w-5 h-5 rounded-full bg-gradient-to-br from-[#c084fc] to-[#7c3aed] shadow-md pointer-events-none z-10" />
      <div className="hidden lg:block absolute top-[32%] right-[7%] w-5 h-5 rounded-full bg-gradient-to-br from-[#60a5fa] to-[#2563eb] shadow-md pointer-events-none z-10" />
      <div className="hidden lg:block absolute top-[54%] right-[3%] w-4 h-4 rounded-full bg-gradient-to-br from-[#a855f7] to-[#6366f1] shadow-md pointer-events-none z-10" />
      <div className="hidden lg:block absolute bottom-[23%] right-[15%] w-6 h-6 rounded-full bg-gradient-to-br from-[#818cf8] to-[#3b82f6] shadow-md pointer-events-none z-10" />

      {/* Left 3D Podium & Mug Composition (home1.png) */}
      <div className="hidden lg:block absolute left-0 bottom-6 xl:bottom-8 w-[28%] xl:w-[30%] max-w-[480px] xl:max-w-[540px] pointer-events-none select-none z-10">
        <div className="relative">
          {/* Subtle 3D Disc & Orbital Ring behind Podium */}
          <div className="absolute -left-10 bottom-6 w-[420px] h-[420px] rounded-full bg-gradient-to-br from-[#818cf8]/25 via-[#6366f1]/15 to-[#3b82f6]/20 blur-xl pointer-events-none -z-10" />
          <div className="absolute -left-6 bottom-10 w-[380px] h-[380px] rounded-full border border-indigo-300/35 pointer-events-none -z-10" />
          <img
            src="/home1.png?v=2"
            alt="Personalized Photo Mug & Laser Engraved Keepsakes"
            className="w-full h-auto object-contain object-bottom drop-shadow-[0_20px_35px_rgba(0,40,150,0.1)]"
          />
        </div>
      </div>

      {/* Right Floating Bottle, Photo Frame & Keychain Composition (home2.png) */}
      <div className="hidden lg:block absolute right-0 lg:right-2 xl:right-6 2xl:right-10 top-1/2 -translate-y-[48%] w-[25%] xl:w-[27%] max-w-[400px] xl:max-w-[460px] pointer-events-none select-none z-10">
        <div className="relative">
          {/* Subtle 3D Disc & Orbital Ring behind Composition */}
          <div className="absolute -right-8 top-1/2 -translate-y-1/2 w-[420px] h-[420px] rounded-full bg-gradient-to-br from-[#a855f7]/20 via-[#6366f1]/20 to-[#3b82f6]/15 blur-xl pointer-events-none -z-10" />
          <div className="absolute -right-4 top-1/2 -translate-y-1/2 w-[390px] h-[390px] rounded-full border border-indigo-300/35 pointer-events-none -z-10 animate-[spin_60s_linear_infinite]" />

          <img
            src="/home2.png?v=2"
            alt="Custom Engraved Bottle, Keychain & Photo Frame"
            className="w-full h-auto object-contain drop-shadow-[0_25px_45px_rgba(20,40,140,0.15)] float-y"
          />

          {/* Frosted Glass Pill Badge: Your Design Our Craft 💜 */}
          <div className="absolute bottom-[6%] right-[8%] bg-white/75 backdrop-blur-xl border border-white/90 rounded-2xl px-3.5 py-2 shadow-[0_10px_25px_rgba(99,102,241,0.2)] flex items-center gap-2">
            <div className="text-left">
              <p className="text-[11px] font-extrabold text-[#5b21b6] leading-tight">Your Design</p>
              <p className="text-[11px] font-extrabold text-[#5b21b6] leading-tight">Our Craft</p>
            </div>
            <span className="text-xs">💜</span>
          </div>
        </div>
      </div>

      {/* Center Hero Content */}
      <Container className="relative z-20 max-w-5xl mx-auto text-center px-4">
        <div className="max-w-3xl xl:max-w-[820px] mx-auto flex flex-col items-center">
          {/* Top Pill Badge */}
          <div className="section-badge mb-6">
            <Sparkles className="h-3.5 w-3.5 text-brand shrink-0" />
            <span>Custom Art • Digital Proofs • Fast Delivery</span>
          </div>

          {/* Main Headline */}
          <h1 className="font-extrabold tracking-tight text-4xl sm:text-5xl lg:text-[3.5rem] xl:text-[4.25rem] leading-[1.08] text-[#0f172a] text-center">
            <span>{t("hero.headline") || "Make it"}</span>{" "}
            <span className="bg-gradient-to-r from-[#7c3aed] to-[#2563eb] bg-clip-text text-transparent">
              {t("hero.headlineHighlight") || "Uniquely Yours"}
            </span>
          </h1>

          {/* Description */}
          <p className="mt-6 max-w-2xl text-sm sm:text-base lg:text-lg text-slate-600 leading-[1.65] font-normal text-center mx-auto">
            {t("hero.description") ||
              "From photo mugs and kitchen accessories to apparel and keepsakes – Gravurtastisch turns your artwork into finished pieces with digital proofs, studio-grade engraving, and dependable delivery."}
          </p>

          {/* CTA Buttons */}
          <div className="mt-8 flex flex-wrap justify-center items-center gap-3.5">
            <a
              href="#register"
              className="inline-flex items-center gap-2 rounded-full px-7 py-3 text-sm font-bold text-white bg-gradient-to-r from-[#1c22aa] via-[#2032b5] to-[#2563eb] shadow-[0_8px_24px_rgba(28,34,170,0.38)] hover:shadow-[0_12px_28px_rgba(28,34,170,0.48)] hover:-translate-y-0.5 transition-all duration-300"
            >
              <span>{t("hero.ctaRegister") || "Place Custom Order"} →</span>
            </a>
            <a
              href="/#pricing"
              className="inline-flex items-center gap-2 rounded-full border border-slate-200/90 bg-white hover:bg-slate-50 px-7 py-3 text-sm font-semibold text-slate-800 shadow-xs hover:border-slate-300 transition-all duration-300"
            >
              {t("hero.ctaPricing") || "See Pricing"}
            </a>
          </div>

          {/* 3D Bento Luxury Glass Cards */}
          <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5 w-full">
            {/* Bento Card 1: 48h Proof Turnaround */}
            <div className="group relative rounded-[24px] bg-white/95 backdrop-blur-md p-5 sm:p-6 text-left flex flex-col justify-between shadow-[0_10px_30px_rgba(15,23,42,0.06)] border border-slate-100 border-b-[3px] border-b-sky-400 hover:shadow-[0_18px_40px_rgba(14,165,233,0.18)] hover:-translate-y-1 transition-all duration-300">
              {/* Top Row: Icon + Badge */}
              <div className="flex items-center justify-between mb-5">
                <div className="h-10 w-10 rounded-full bg-sky-100 flex items-center justify-center text-sky-500 shadow-2xs group-hover:scale-105 transition-transform duration-300">
                  <Clock className="h-5 w-5" />
                </div>
                <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-sky-600 bg-sky-50 border border-sky-200/70 px-2.5 py-0.5 rounded-full">
                  Fast SLA
                </span>
              </div>

              {/* Metric & Label */}
              <div>
                <div className="text-3xl sm:text-4xl lg:text-[2.6rem] font-black text-[#0f172a] tracking-tight leading-none">
                  48h
                </div>
                <p className="text-sm font-bold text-slate-900 mt-2 tracking-tight">
                  {t("hero.statSendWindow") || "Proof turnaround"}
                </p>
                <p className="text-xs text-slate-500 mt-1 font-medium">
                  Digital proof ready before production
                </p>
              </div>

              {/* Bottom Subtle Row */}
              <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-sky-600 font-semibold">
                <span className="flex items-center gap-1">⚡ Express Proofing</span>
                <span className="flex items-center gap-1">
                  <Shield className="h-3.5 w-3.5 fill-sky-600 text-sky-600" /> Guaranteed
                </span>
              </div>
            </div>

            {/* Bento Card 2: 10k+ Happy Clients */}
            <div className="group relative rounded-[24px] bg-white/95 backdrop-blur-md p-5 sm:p-6 text-left flex flex-col justify-between shadow-[0_10px_30px_rgba(15,23,42,0.06)] border border-slate-100 border-b-[3px] border-b-amber-400 hover:shadow-[0_18px_40px_rgba(245,158,11,0.18)] hover:-translate-y-1 transition-all duration-300">
              {/* Top Row: Icon + Badge */}
              <div className="flex items-center justify-between mb-5">
                <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-500 shadow-2xs group-hover:scale-105 transition-transform duration-300">
                  <Star className="h-5 w-5 fill-amber-500 text-amber-500" />
                </div>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 border border-amber-200/70 px-2.5 py-0.5 rounded-full">
                  ✦ 4.9 RATING
                </span>
              </div>

              {/* Metric & Label */}
              <div>
                <div className="text-3xl sm:text-4xl lg:text-[2.6rem] font-black text-[#0f172a] tracking-tight leading-none">
                  10k+
                </div>
                <p className="text-sm font-bold text-slate-900 mt-2 tracking-tight">
                  {t("hero.statReviewLift") || "Happy clients"}
                </p>
                <p className="text-xs text-slate-500 mt-1 font-medium">
                  Verified custom orders completed
                </p>
              </div>

              {/* Bottom Subtle Row */}
              <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-amber-800 font-semibold">
                <span>Five-Star Quality</span>
                <span className="text-amber-500 tracking-wider font-bold">★★★★★</span>
              </div>
            </div>

            {/* Bento Card 3: 99.8% On-Time Ship Rate */}
            <div className="group relative rounded-[24px] bg-white/95 backdrop-blur-md p-5 sm:p-6 text-left flex flex-col justify-between shadow-[0_10px_30px_rgba(15,23,42,0.06)] border border-slate-100 border-b-[3px] border-b-emerald-400 hover:shadow-[0_18px_40px_rgba(16,185,129,0.18)] hover:-translate-y-1 transition-all duration-300">
              {/* Top Row: Icon + Badge */}
              <div className="flex items-center justify-between mb-5">
                <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shadow-2xs group-hover:scale-105 transition-transform duration-300">
                  <Truck className="h-5 w-5" />
                </div>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200/70 px-2.5 py-0.5 rounded-full">
                  ✦ EU WIDE
                </span>
              </div>

              {/* Metric & Label */}
              <div>
                <div className="text-3xl sm:text-4xl lg:text-[2.6rem] font-black text-[#0f172a] tracking-tight leading-none">
                  99.8%
                </div>
                <p className="text-sm font-bold text-slate-900 mt-2 tracking-tight">
                  {t("hero.statUptime") || "On-time ship rate"}
                </p>
                <p className="text-xs text-slate-500 mt-1 font-medium">
                  Tracked courier dispatch across EU
                </p>
              </div>

              {/* Bottom Subtle Row */}
              <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-emerald-800 font-semibold">
                <span className="flex items-center gap-1">📦 Direct Studio Shipping</span>
                <span className="flex items-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" /> Insured
                </span>
              </div>
            </div>
          </div>

          {/* Precision Bar */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-2.5 text-xs text-slate-600">
            <div className="flex items-center gap-1.5 font-semibold text-slate-800">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>{t("hero.spApiVerified") || "German craft precision"}</span>
            </div>
            <span className="text-slate-300 mx-1 font-light">|</span>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500">{t("hero.stores") || "Channels:"}</span>
              <FlagDE className="w-3.5 h-2.5 shadow-2xs rounded-[2px]" />
              <FlagFR className="w-3.5 h-2.5 shadow-2xs rounded-[2px]" />
              <FlagGB className="w-3.5 h-2.5 shadow-2xs rounded-[2px]" />
              <FlagIT className="w-3.5 h-2.5 shadow-2xs rounded-[2px]" />
              <FlagES className="w-3.5 h-2.5 shadow-2xs rounded-[2px]" />
              <span className="text-[10px] font-mono text-brand font-bold bg-blue-50/80 text-blue-700 px-1 py-0.5 rounded border border-blue-200/60">
                +EU
              </span>
            </div>
          </div>
        </div>
      </Container>

      {/* Bottom Curved Wave Transition */}
      <div className="absolute bottom-0 left-0 right-0 w-full overflow-hidden leading-none z-10 pointer-events-none">
        <svg
          viewBox="0 0 1440 96"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-10 sm:h-14 lg:h-20 block preserve-3d"
          preserveAspectRatio="none"
        >
          <path
            d="M0,36 C320,80 560,18 880,48 C1160,76 1320,28 1440,42 L1440,96 L0,96 Z"
            fill="#ffffff"
          />
        </svg>
      </div>
    </section>
  );
}
