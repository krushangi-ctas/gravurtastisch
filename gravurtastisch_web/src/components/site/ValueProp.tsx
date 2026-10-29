import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Container } from "./Container";
import { Reveal } from "./Reveal";
import {
  CupSoda,
  Sparkles,
  Shirt,
  Lamp,
  CheckCircle2,
  Lock,
  ArrowRight,
  ShieldCheck,
  Layers,
  Zap,
  Eye,
  Sliders,
} from "lucide-react";

export function ValueProp() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState(0);

  const craftProfiles = [
    {
      id: "01",
      icon: CupSoda,
      titleKey: "feature1Title",
      bodyKey: "feature1Body",
      category: t("valueProp.feature1Tag", "Drinkware"),
      accent: "from-[#0032ab] to-[#4f6ef7]",
      accentColor: "#0032ab",
      specMaterial: "Double-Wall Stainless Steel & Matte Ceramic",
      specTechnique: "360° Rotary Laser Micro-Pass",
      specDurability: "100% Dishwasher & Fade-Proof",
      specTurnaround: "Same-Day Digital Proof",
      badgeText: "Rotary Laser 360°",
      previewTitle: "Matte Black Insulated Tumbler",
      previewSub: "Custom laser engraved vector wrap with zero seam overlap",
      previewMetric: "0.05mm Beam Precision",
    },
    {
      id: "02",
      icon: Sparkles,
      titleKey: "feature2Title",
      bodyKey: "feature2Body",
      category: t("valueProp.feature2Tag", "Laser engraving"),
      accent: "from-[#4f6ef7] to-[#155dfc]",
      accentColor: "#4f6ef7",
      specMaterial: "Solid Oak, Walnut, Slate & Anodized Metal",
      specTechnique: "120W High-Focal CO2 Laser Beam",
      specDurability: "Proof-Gated Before Machine Starts",
      specTurnaround: "Free Digital 3D Mockup Included",
      badgeText: "Proof-Gated Quality Lock",
      previewTitle: "Deep Engraved Oak Cutting Board",
      previewSub: "Approved vector layout verified for food-safe mineral oil finish",
      previewMetric: "100% Proof Guarantee",
    },
    {
      id: "03",
      icon: Lamp,
      titleKey: "feature3Title",
      bodyKey: "feature3Body",
      category: t("valueProp.feature3Tag", "Lifestyle"),
      accent: "from-[#1447e6] to-[#0032ab]",
      accentColor: "#1447e6",
      specMaterial: "Optical Cast Acrylic & Solid Beechwood",
      specTechnique: "Precision Laser Cut + UV Color Fill",
      specDurability: "Dual Warm/Neutral LED Dimming",
      specTurnaround: "Live Stage Tracking at Every Step",
      badgeText: "Real-Time Milestone Sync",
      previewTitle: "Illuminated Acrylic Keepsake Lamp",
      previewSub: "Laser polished diamond edges with personalized ambient lighting",
      previewMetric: "Live Status Tracker",
    },
    {
      id: "04",
      icon: Shirt,
      titleKey: "feature4Title",
      bodyKey: "feature4Body",
      category: t("valueProp.feature4Tag", "Apparel"),
      accent: "from-[#0032ab] to-[#3080ff]",
      accentColor: "#3080ff",
      specMaterial: "350 GSM Organic Combed Cotton",
      specTechnique: "High-Density Tajima Embroidery",
      specDurability: "Pantone-Matched Madeira Threads",
      specTurnaround: "Encrypted Scoped Artwork Vault",
      badgeText: "AES-256 Vault Protected",
      previewTitle: "Heavyweight Studio Embroidered Tee",
      previewSub: "Up to 25,000 stitches with vector-locked typography fidelity",
      previewMetric: "Zero-Drift Vector Vault",
    },
  ];

  const active = craftProfiles[activeTab];
  const ActiveIcon = active.icon;

  return (
    <section className="relative py-16 lg:py-24 bg-[#f8f9fc] dark:bg-navy-deep/60 overflow-hidden border-b border-slate-200/80 dark:border-white/10">
      {/* Background ambient radial glow */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.45]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 15% 25%, rgba(0,50,171,0.06), transparent 45%), radial-gradient(circle at 85% 75%, rgba(79,110,247,0.06), transparent 45%)",
        }}
        aria-hidden
      />

      <Container className="relative">
        {/* Section Header */}
        <Reveal>
          <div className="text-center max-w-3xl mx-auto mb-10">
            <span className="section-badge mb-3">
              {t("valueProp.sectionLabel", "Why customers choose us")}
            </span>
            <h2 className="mt-3 text-3xl sm:text-4xl lg:text-[2.75rem] font-extrabold tracking-tight text-navy-deep dark:text-white leading-[1.15]">
              {t("valueProp.title1", "Designs that feel personal.")}{" "}
              <span className="text-navy-deep dark:text-white">
                {t("valueProp.title2", "Quality you can hold.")}
              </span>
            </h2>
            <p className="mt-4 text-base text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl mx-auto">
              {t(
                "valueProp.description",
                "Every gift and everyday item should carry meaning. Gravurtastisch pairs careful materials with laser-sharp detail - so your photos, names, and messages look premium long after unboxing."
              )}
            </p>

            {/* Interactive Craft Selector Segmented Bar (NOT repetitive cards!) */}
            <div className="mt-8 inline-flex flex-wrap items-center justify-center p-1.5 rounded-full bg-slate-200/80 dark:bg-navy/80 border border-slate-300/80 dark:border-white/10 shadow-inner gap-1">
              {craftProfiles.map((cp, idx) => {
                const isSelected = activeTab === idx;
                const Icon = cp.icon;
                return (
                  <button
                    key={cp.id}
                    type="button"
                    onClick={() => setActiveTab(idx)}
                    className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                      isSelected
                        ? "bg-[#0032ab] text-white shadow-md shadow-[#0032ab]/30 scale-102"
                        : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>
                      {cp.id} · {cp.category}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </Reveal>

        {/* Masterstage Showcase Console (Unified, Rich, Smart Experience) */}
        <Reveal delay={80}>
          <div className="rounded-3xl liquid-glass border border-[#0032ab]/18 p-6 sm:p-8 lg:p-10 shadow-xl shadow-[#0032ab]/06 overflow-hidden relative">
            <div className="grid lg:grid-cols-12 gap-8 lg:gap-10 items-center">
              {/* Left Column: Feature Narrative & Engineering Specs */}
              <div className="lg:col-span-7 space-y-6">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="font-mono text-xs font-bold text-[#0032ab] dark:text-brand-bright px-3 py-1 rounded-full bg-[#0032ab]/10 border border-[#0032ab]/20">
                      CRAFT PROFILE // {active.id} · {active.category}
                    </span>
                    <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Active Studio Line
                    </span>
                  </div>

                  <h3 className="text-2xl sm:text-3xl font-extrabold text-navy-deep dark:text-white leading-tight">
                    {t(`valueProp.${active.titleKey}`)}
                  </h3>

                  <p className="mt-3 text-slate-600 dark:text-slate-300 text-sm sm:text-base leading-relaxed max-w-xl">
                    {t(`valueProp.${active.bodyKey}`)}
                  </p>
                </div>

                {/* 4-Item Studio Engineering Spec Grid */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="p-3.5 rounded-2xl bg-white/90 dark:bg-navy/80 border border-slate-200/90 dark:border-white/10 shadow-2xs">
                    <span className="text-[10px] font-mono uppercase text-slate-400 block font-bold">
                      Material Spec
                    </span>
                    <span className="text-xs sm:text-sm font-bold text-navy-deep dark:text-white mt-1 block">
                      {active.specMaterial}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-white/90 dark:bg-navy/80 border border-slate-200/90 dark:border-white/10 shadow-2xs">
                    <span className="text-[10px] font-mono uppercase text-slate-400 block font-bold">
                      Craft Technology
                    </span>
                    <span className="text-xs sm:text-sm font-bold text-[#0032ab] dark:text-brand-bright mt-1 block font-mono">
                      {active.specTechnique}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-white/90 dark:bg-navy/80 border border-slate-200/90 dark:border-white/10 shadow-2xs">
                    <span className="text-[10px] font-mono uppercase text-slate-400 block font-bold">
                      Quality Standard
                    </span>
                    <span className="text-xs sm:text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-1 block">
                      {active.specDurability}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-white/90 dark:bg-navy/80 border border-slate-200/90 dark:border-white/10 shadow-2xs">
                    <span className="text-[10px] font-mono uppercase text-slate-400 block font-bold">
                      Proof SLA
                    </span>
                    <span className="text-xs sm:text-sm font-bold text-purple-600 dark:text-purple-400 mt-1 block font-mono">
                      {active.specTurnaround}
                    </span>
                  </div>
                </div>

                {/* Proof Gate Trust Callout */}
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Zero Misprints Guaranteed
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#0032ab]/08 border border-[#0032ab]/20 text-xs font-bold text-[#0032ab] dark:text-brand-bright">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Digital Proof Lock
                  </span>
                </div>
              </div>

              {/* Right Column: Interactive Studio Simulator Visual Card */}
              <div className="lg:col-span-5">
                <div className="rounded-2xl bg-gradient-to-br from-white via-slate-50 to-slate-100 dark:from-navy dark:via-navy/90 dark:to-navy-deep border border-slate-200/90 dark:border-white/10 p-6 sm:p-7 shadow-lg shadow-[#0032ab]/05 relative overflow-hidden group">
                  {/* Decorative glowing gradient circle */}
                  <div
                    className={`absolute -top-12 -right-12 w-48 h-48 rounded-full bg-gradient-to-br ${active.accent} opacity-15 blur-2xl pointer-events-none`}
                  />

                  {/* Top Bar of Simulation */}
                  <div className="flex items-center justify-between pb-4 border-b border-slate-200/80 dark:border-white/10 text-xs">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-xl bg-[#0032ab] text-white grid place-items-center shadow-xs">
                        <ActiveIcon className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-bold text-navy-deep dark:text-white block text-xs">
                          {active.badgeText}
                        </span>
                        <span className="text-[10px] font-mono text-slate-500">
                          Calibration: Validated
                        </span>
                      </div>
                    </div>
                    <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400">
                      PASS QC
                    </span>
                  </div>

                  {/* Central Visual Showcase Box */}
                  <div className="my-6 p-5 rounded-xl bg-white dark:bg-navy/80 border border-slate-200/90 dark:border-white/10 shadow-2xs">
                    <span className="text-[10px] font-mono uppercase text-[#0032ab] dark:text-brand-bright font-bold tracking-wider">
                      SAMPLE PRODUCT OUTPUT
                    </span>
                    <h4 className="mt-1 text-base font-bold text-navy-deep dark:text-white">
                      {active.previewTitle}
                    </h4>
                    <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      {active.previewSub}
                    </p>

                    {/* Progress milestone simulator */}
                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-white/06 flex items-center justify-between text-xs">
                      <span className="font-mono text-[11px] text-slate-500">Precision Lock:</span>
                      <span className="font-mono font-bold text-[#0032ab] dark:text-brand-bright text-xs">
                        {active.previewMetric}
                      </span>
                    </div>
                  </div>

                  {/* Simulator Footer with Interactive Tabs Switcher Dots */}
                  <div className="flex items-center justify-between pt-2 text-xs text-slate-500">
                    <span className="text-[11px] font-mono">Profile {active.id} of 04</span>
                    <div className="flex gap-1.5">
                      {craftProfiles.map((_, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setActiveTab(i)}
                          className={`h-2 rounded-full transition-all cursor-pointer ${
                            activeTab === i ? "w-6 bg-[#0032ab]" : "w-2 bg-slate-300 dark:bg-white/20"
                          }`}
                          aria-label={`Go to craft profile ${i + 1}`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Reveal>

        {/* Continuous Connected Flow Ribbon (Connecting all 4 values without separate cards) */}
        <Reveal delay={120}>
          <div className="mt-8 p-4 rounded-2xl liquid-glass border border-[#0032ab]/12 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2.5 text-xs font-bold text-slate-700 dark:text-slate-300">
              <span className="h-2 w-2 rounded-full bg-[#0032ab] animate-pulse" />
              <span className="font-mono uppercase tracking-wider">
                Full Studio Craft Spectrum:
              </span>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-xs text-slate-600 dark:text-slate-300 font-medium">
              {craftProfiles.map((cp, idx) => (
                <button
                  key={cp.id}
                  type="button"
                  onClick={() => setActiveTab(idx)}
                  className={`inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
                    activeTab === idx
                      ? "text-[#0032ab] dark:text-brand-bright font-bold"
                      : "hover:text-[#0032ab]"
                  }`}
                >
                  <span className="font-mono text-[10px] text-slate-400">{cp.id}.</span>
                  <span>{t(`valueProp.${cp.titleKey}`)}</span>
                </button>
              ))}
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
