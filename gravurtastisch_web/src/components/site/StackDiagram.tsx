import React, { useState } from "react";
import { Container } from "./Container";
import { Reveal } from "./Reveal";
import { useTranslation } from "react-i18next";
import {
  ShieldCheck,
  Cpu,
  Layers,
  Database,
  RefreshCw,
  Zap,
  ArrowRight,
  Terminal,
  Activity,
  CheckCircle2,
  Lock,
} from "lucide-react";

/** Layer tags aligned to layer meaning */
const layerTagKeys = [".touch", ".api", ".queue", ".sync", ".vault"];

export function StackDiagram() {
  const { t } = useTranslation();
  const [activeLayer, setActiveLayer] = useState(2); // Default to Quality queue (index 2)

  const layers = [
    {
      id: "00",
      labelKey: "layer1Label",
      subKey: "layer1Sub",
      tag: ".touch",
      icon: Activity,
      purpose: "Customer Touchpoint",
      detail: "Manages customer digital proof approvals, order milestone notifications, and direct buyer communication channels.",
      techMetric: "< 25ms Webhooks",
      protocol: "REST · Webhooks · SMTP",
    },
    {
      id: "01",
      labelKey: "layer2Label",
      subKey: "layer2Sub",
      tag: ".api",
      icon: Terminal,
      purpose: "Production API",
      detail: "Idempotent job scheduler with automatic retry logic, capacity balancing, and rate-limiting across laser cells.",
      techMetric: "99.99% Uptime",
      protocol: "gRPC · Event Queue",
    },
    {
      id: "02",
      labelKey: "layer3Label",
      subKey: "layer3Sub",
      tag: ".queue",
      icon: Cpu,
      purpose: "Quality Queue",
      detail: "Strict proof-gated validation engine. Laser, print, and stitch machines are locked until the digital proof signoff is registered.",
      techMetric: "100% Proof Gated",
      protocol: "Zero-Drift Orchestrator",
    },
    {
      id: "03",
      labelKey: "layer4Label",
      subKey: "layer4Sub",
      tag: ".sync",
      icon: RefreshCw,
      purpose: "Sync Engine",
      detail: "Bidirectional sync for Amazon SP-API, Shopify, and Etsy. Dispatches carrier tracking numbers in local buyer timezones.",
      techMetric: "Real-Time Sync",
      protocol: "Official SP-API · Webhooks",
    },
    {
      id: "04",
      labelKey: "layer5Label",
      subKey: "layer5Sub",
      tag: ".vault",
      icon: Database,
      purpose: "Asset Vault",
      detail: "High-resolution vector artwork, typography definitions, and brand presets stored in encrypted zero-knowledge storage buckets.",
      techMetric: "AES-256 Encrypted",
      protocol: "Zero-Knowledge Object Storage",
    },
  ];

  const current = layers[activeLayer];
  const CurrentIcon = current.icon;

  return (
    <section id="stack" className="relative py-16 lg:py-24 bg-gradient-to-b from-[#f8f9fc] via-white to-[#f8f9fc] dark:from-navy-deep/60 dark:via-navy/40 dark:to-navy-deep/60 overflow-hidden border-t border-slate-200/80 dark:border-white/10">
      {/* Background ambient mesh */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[450px] bg-brand/5 rounded-full blur-3xl pointer-events-none" />

      <Container className="relative">
        {/* Centered Architecture Section Header */}
        <Reveal>
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="section-badge mb-3">
              {t("stackDiagram.sectionLabel", "Under the hood")}
            </span>
            <h2 className="mt-3 text-3xl sm:text-4xl lg:text-[2.65rem] font-extrabold tracking-tight text-navy-deep dark:text-white leading-tight">
              {t("stackDiagram.heading", "A stack built for custom scale - and trust.")}
            </h2>
            <p className="mt-4 text-slate-600 dark:text-slate-300 text-sm sm:text-base leading-relaxed max-w-2xl mx-auto">
              {t(
                "stackDiagram.description",
                "Every layer is isolated. Artwork lives in encrypted storage. Production jobs flow through a queue that respects proof approval and material limits by default."
              )}
            </p>

            {/* Architecture Telemetry Specs */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5 text-xs">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white dark:bg-navy/80 border border-slate-200/90 dark:border-white/10 font-mono text-slate-700 dark:text-slate-300 shadow-2xs">
                <Lock className="w-3 h-3 text-emerald-600" />
                AES-256 Storage
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white dark:bg-navy/80 border border-slate-200/90 dark:border-white/10 font-mono text-slate-700 dark:text-slate-300 shadow-2xs">
                <CheckCircle2 className="w-3 h-3 text-[#0032ab]" />
                100% Proof Gated
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white dark:bg-navy/80 border border-slate-200/90 dark:border-white/10 font-mono text-slate-700 dark:text-slate-300 shadow-2xs">
                <Zap className="w-3 h-3 text-amber-500" />
                Sub-50ms Webhooks
              </span>
            </div>
          </div>
        </Reveal>

        {/* Horizontal 5-Stage Interactive Pipeline */}
        <Reveal delay={80}>
          <div className="relative mb-8">
            {/* Connecting Horizontal Pulse Cable (Desktop) */}
            <div
              className="hidden lg:block absolute top-[2.25rem] left-[5%] right-[5%] h-1 bg-gradient-to-r from-[#0032ab] via-[#4f6ef7] to-[#155dfc] rounded-full opacity-30 pointer-events-none"
              aria-hidden
            />

            {/* 5 Connected Node Buttons */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 relative z-10">
              {layers.map((l, i) => {
                const isSelected = activeLayer === i;
                const Icon = l.icon;

                return (
                  <button
                    type="button"
                    key={l.id}
                    onClick={() => setActiveLayer(i)}
                    className={`relative p-4 sm:p-5 rounded-2xl text-left transition-all duration-300 cursor-pointer group flex flex-col justify-between ${
                      isSelected
                        ? "bg-white dark:bg-navy/95 border-2 border-[#0032ab] shadow-xl shadow-[#0032ab]/15 scale-102"
                        : "bg-white/80 dark:bg-navy/60 border border-slate-200/90 dark:border-white/10 hover:border-[#0032ab]/40 hover:bg-white shadow-xs"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span
                          className={`grid place-items-center h-8 w-8 rounded-xl font-mono text-xs font-bold transition-transform group-hover:scale-105 ${
                            isSelected
                              ? "bg-[#0032ab] text-white shadow-xs shadow-[#0032ab]/30"
                              : "bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10"
                          }`}
                        >
                          {l.id}
                        </span>
                        <span className="font-mono text-[11px] font-bold text-slate-500 dark:text-slate-400">
                          {l.tag}
                        </span>
                      </div>

                      <h4 className={`font-bold text-xs sm:text-sm leading-tight transition-colors ${
                        isSelected ? "text-[#0032ab] dark:text-brand-bright" : "text-navy-deep dark:text-white"
                      }`}>
                        {t(`stackDiagram.${l.labelKey}`)}
                      </h4>

                      <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                        {t(`stackDiagram.${l.subKey}`)}
                      </p>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-white/06 flex items-center justify-between text-[10px] font-mono">
                      <span className={isSelected ? "text-[#0032ab] font-bold" : "text-slate-400"}>
                        {isSelected ? "Active Stage" : "Inspect →"}
                      </span>
                      {isSelected && (
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </Reveal>

        {/* Dynamic Stage Telemetry & Deep-Dive Inspector Panel */}
        <Reveal delay={120}>
          <div className="rounded-3xl liquid-glass border border-[#0032ab]/20 p-6 sm:p-8 shadow-xl shadow-[#0032ab]/06 mb-10 overflow-hidden relative">
            <div className="grid lg:grid-cols-12 gap-6 items-center">
              {/* Left Column: Stage Info */}
              <div className="lg:col-span-7">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2.5 py-1 rounded-full bg-[#0032ab]/10 border border-[#0032ab]/20 text-[#0032ab] dark:text-brand-bright text-xs font-mono font-bold">
                    STAGE {current.id} // {current.tag}
                  </span>
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-mono">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    Operational
                  </span>
                </div>

                <h3 className="text-xl sm:text-2xl font-extrabold text-navy-deep dark:text-white">
                  {t(`stackDiagram.${current.labelKey}`)}:{" "}
                  <span className="text-[#0032ab] dark:text-brand-bright">{t(`stackDiagram.${current.subKey}`)}</span>
                </h3>

                <p className="mt-3 text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed max-w-xl">
                  {current.detail}
                </p>
              </div>

              {/* Right Column: Telemetry Specs Matrix */}
              <div className="lg:col-span-5 grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-2xl bg-white/90 dark:bg-navy/80 border border-slate-200/90 dark:border-white/10 shadow-2xs">
                  <span className="text-[10px] font-mono uppercase text-slate-400 block font-bold">
                    Architecture Role
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-navy-deep dark:text-white mt-1 block">
                    {current.purpose}
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-white/90 dark:bg-navy/80 border border-slate-200/90 dark:border-white/10 shadow-2xs">
                  <span className="text-[10px] font-mono uppercase text-slate-400 block font-bold">
                    Telemetry / SLA
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-1 block font-mono">
                    {current.techMetric}
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-white/90 dark:bg-navy/80 border border-slate-200/90 dark:border-white/10 shadow-2xs col-span-2">
                  <span className="text-[10px] font-mono uppercase text-slate-400 block font-bold">
                    Integration Protocols
                  </span>
                  <span className="text-xs font-mono font-bold text-[#0032ab] dark:text-brand-bright mt-1 block">
                    {current.protocol}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </Reveal>

        {/* 3 Core Security & Scale Pillars (3-Column Trust Cards) */}
        <Reveal delay={160}>
          <div className="grid md:grid-cols-3 gap-5">
            <div className="p-5 rounded-2xl bg-white dark:bg-navy/80 border border-slate-200/90 dark:border-white/10 shadow-2xs hover:shadow-md transition-shadow group">
              <div className="h-10 w-10 rounded-xl bg-purple-500/10 border border-purple-500/20 grid place-items-center text-purple-600 mb-3.5 group-hover:scale-105 transition-transform">
                <Database className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-navy-deep dark:text-white text-sm sm:text-base">
                {t("stackDiagram.listItem1", "Encrypted asset vault")}
              </h4>
              <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Vector artwork, custom typography, and proof files are stored in scoped, encrypted vaults with strict access rules.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-navy/80 border border-slate-200/90 dark:border-white/10 shadow-2xs hover:shadow-md transition-shadow group">
              <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 grid place-items-center text-emerald-600 mb-3.5 group-hover:scale-105 transition-transform">
                <Cpu className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-navy-deep dark:text-white text-sm sm:text-base">
                {t("stackDiagram.listItem2", "Proof-gated job queue")}
              </h4>
              <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Physical laser, rotary, and embroidery cells never start production without explicit digital proof signoff.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-navy/80 border border-slate-200/90 dark:border-white/10 shadow-2xs hover:shadow-md transition-shadow group">
              <div className="h-10 w-10 rounded-xl bg-[#0032ab]/10 border border-[#0032ab]/20 grid place-items-center text-[#0032ab] mb-3.5 group-hover:scale-105 transition-transform">
                <Zap className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-navy-deep dark:text-white text-sm sm:text-base">
                {t("stackDiagram.listItem3", "Per-channel order webhooks")}
              </h4>
              <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Seamless real-time order intake and tracking dispatch for Amazon, Shopify, Etsy, and corporate B2B storefronts.
              </p>
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
