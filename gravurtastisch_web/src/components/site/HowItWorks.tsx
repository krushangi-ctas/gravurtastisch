import React, { useState } from "react";
import { Container } from "./Container";
import { Reveal } from "./Reveal";
import { useTranslation } from "react-i18next";
import {
  UploadCloud,
  ShieldCheck,
  Flame,
  PackageCheck,
  Check,
  ArrowRight,
  Clock,
  Sparkles,
  CheckCircle2,
  FileCode,
  Zap,
} from "lucide-react";

export function HowItWorks() {
  const { t } = useTranslation();
  const [proofApproved, setProofApproved] = useState(false);

  return (
    <section id="how" className="relative py-16 lg:py-24 bg-[#f8f9fc] dark:bg-navy-deep/60 text-foreground border-b border-border/60 overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-brand/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-brand-bright/5 rounded-full blur-3xl pointer-events-none" />

      <Container className="relative">
        {/* Centered Modern Section Header */}
        <Reveal>
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="section-badge mb-3">
              {t("howItWorks.sectionLabel", "How it works")}
            </span>
            <h2 className="mt-3 text-3xl sm:text-4xl lg:text-[2.75rem] font-extrabold tracking-tight text-foreground leading-[1.15]">
              {t("howItWorks.heading", "Send design → proof → craft → deliver.")}
            </h2>
            <p className="mt-4 text-slate-body text-sm sm:text-base leading-relaxed max-w-2xl mx-auto">
              {t(
                "howItWorks.description",
                "Four clear steps from your artwork to a finished piece on the doorstep. We keep you in the loop at every stage - especially before anything is engraved."
              )}
            </p>
          </div>
        </Reveal>

        {/* 1. Panoramic 4-Stage Visual Runway (Connected Process Runway with embedded interactive artifacts) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 relative mb-12">
          {/* Stage 1: Send Your Design */}
          <Reveal delay={60}>
            <div className="h-full rounded-3xl liquid-glass border border-slate-200/90 dark:border-white/10 p-6 flex flex-col justify-between hover:border-[#0032ab]/30 transition-all duration-300 shadow-sm hover:shadow-md">
              <div>
                {/* Stage Header */}
                <div className="flex items-center justify-between mb-4">
                  <span className="h-9 w-9 rounded-xl bg-[#0032ab]/10 border border-[#0032ab]/20 text-[#0032ab] dark:text-brand-bright font-mono font-bold text-xs grid place-items-center">
                    01
                  </span>
                  <span className="text-[10px] font-mono uppercase tracking-wider font-bold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-white/06 text-slate-600 dark:text-slate-300">
                    Intake & Brief
                  </span>
                </div>

                <h3 className="text-lg font-bold text-navy-deep dark:text-white leading-snug">
                  {t("howItWorks.step1Title", "Send your design")}
                </h3>
                <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  {t(
                    "howItWorks.step1Desc",
                    "Upload photos, logos, or text. Tell us the product, quantity, and any placement notes."
                  )}
                </p>
              </div>

              {/* Embedded Visual Artifact: File Dropzone & Supported Formats */}
              <div className="mt-5 p-3.5 rounded-2xl bg-white dark:bg-navy/80 border border-slate-200/80 dark:border-white/08 shadow-2xs">
                <div className="flex items-center gap-2 mb-2 text-xs font-bold text-[#0032ab] dark:text-brand-bright">
                  <UploadCloud className="w-4 h-4" />
                  <span>Artwork Ingestion</span>
                </div>
                <div className="flex flex-wrap gap-1 text-[10px] font-mono font-semibold text-slate-500 dark:text-slate-400">
                  <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-white/06">.SVG</span>
                  <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-white/06">.AI</span>
                  <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-white/06">.PNG</span>
                  <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-white/06">.PDF</span>
                  <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-white/06">.DXF</span>
                </div>
                <span className="mt-2 block text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                  ✓ Automatic SKU Classification
                </span>
              </div>
            </div>
          </Reveal>

          {/* Stage 2: Free Digital Proof (THE SAFETY GATE - Featured Glowing Border) */}
          <Reveal delay={100}>
            <div className="h-full rounded-3xl bg-white dark:bg-navy/90 border-2 border-[#0032ab] p-6 flex flex-col justify-between shadow-xl shadow-[#0032ab]/12 relative overflow-hidden">
              <div className="absolute top-0 right-0 px-3 py-1 bg-[#0032ab] text-white text-[10px] font-mono font-bold uppercase rounded-bl-xl shadow-xs">
                Safety Gate
              </div>

              <div>
                {/* Stage Header */}
                <div className="flex items-center justify-between mb-4">
                  <span className="h-9 w-9 rounded-xl bg-[#0032ab] text-white font-mono font-bold text-xs grid place-items-center shadow-xs">
                    02
                  </span>
                  <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    100% Free Proof
                  </span>
                </div>

                <h3 className="text-lg font-bold text-[#0032ab] dark:text-brand-bright leading-snug">
                  {t("howItWorks.step2Title", "Free digital proof")}
                </h3>
                <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  {t(
                    "howItWorks.step2Desc",
                    "We mock up layout on the real product shape. You approve - or request tweaks - before production."
                  )}
                </p>
              </div>

              {/* Embedded Visual Artifact: Interactive Proof Approval Simulation */}
              <div className="mt-5 p-3.5 rounded-2xl bg-slate-50 dark:bg-white/05 border border-[#0032ab]/20 shadow-2xs">
                <div className="flex items-center justify-between mb-2 text-xs">
                  <span className="font-bold text-navy-deep dark:text-white font-mono text-[11px]">
                    Mockup Preview
                  </span>
                  <span
                    className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      proofApproved
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                        : "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300"
                    }`}
                  >
                    {proofApproved ? "APPROVED" : "AWAITING OK"}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setProofApproved(!proofApproved)}
                  className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs flex items-center justify-center gap-1.5 ${
                    proofApproved
                      ? "bg-emerald-600 text-white shadow-emerald-500/20"
                      : "bg-[#0032ab] text-white hover:bg-[#00227a]"
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{proofApproved ? "Proof OK · Unlocked!" : "Simulate Approval"}</span>
                </button>
              </div>
            </div>
          </Reveal>

          {/* Stage 3: Craft & Engrave */}
          <Reveal delay={140}>
            <div className="h-full rounded-3xl liquid-glass border border-slate-200/90 dark:border-white/10 p-6 flex flex-col justify-between hover:border-[#0032ab]/30 transition-all duration-300 shadow-sm hover:shadow-md">
              <div>
                {/* Stage Header */}
                <div className="flex items-center justify-between mb-4">
                  <span className="h-9 w-9 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 font-mono font-bold text-xs grid place-items-center">
                    03
                  </span>
                  <span className="text-[10px] font-mono uppercase tracking-wider font-bold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-white/06 text-slate-600 dark:text-slate-300">
                    Studio Production
                  </span>
                </div>

                <h3 className="text-lg font-bold text-navy-deep dark:text-white leading-snug">
                  {t("howItWorks.step3Title", "Craft & engrave")}
                </h3>
                <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  {t(
                    "howItWorks.step3Desc",
                    "Laser engraving, printing, or stitching runs on studio-calibrated equipment with a quality check."
                  )}
                </p>
              </div>

              {/* Embedded Visual Artifact: Machine Calibration Telemetry */}
              <div className="mt-5 p-3.5 rounded-2xl bg-white dark:bg-navy/80 border border-slate-200/80 dark:border-white/08 shadow-2xs space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-600">
                  <Flame className="w-4 h-4" />
                  <span>Laser Cell Calibration</span>
                </div>
                <div className="grid grid-cols-2 gap-1.5 text-[10px] font-mono text-slate-600 dark:text-slate-300">
                  <div className="px-2 py-1 rounded bg-slate-100 dark:bg-white/06">Beam: 0.05mm</div>
                  <div className="px-2 py-1 rounded bg-slate-100 dark:bg-white/06">Laser: 120W Peak</div>
                </div>
                <span className="block text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                  ✓ Optical Quality Inspection
                </span>
              </div>
            </div>
          </Reveal>

          {/* Stage 4: Pack & Deliver */}
          <Reveal delay={180}>
            <div className="h-full rounded-3xl liquid-glass border border-slate-200/90 dark:border-white/10 p-6 flex flex-col justify-between hover:border-[#0032ab]/30 transition-all duration-300 shadow-sm hover:shadow-md">
              <div>
                {/* Stage Header */}
                <div className="flex items-center justify-between mb-4">
                  <span className="h-9 w-9 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-600 font-mono font-bold text-xs grid place-items-center">
                    04
                  </span>
                  <span className="text-[10px] font-mono uppercase tracking-wider font-bold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-white/06 text-slate-600 dark:text-slate-300">
                    Doorstep Delivery
                  </span>
                </div>

                <h3 className="text-lg font-bold text-navy-deep dark:text-white leading-snug">
                  {t("howItWorks.step4Title", "Pack & deliver")}
                </h3>
                <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  {t(
                    "howItWorks.step4Desc",
                    "Finished pieces are packed with care and shipped with tracking straight to you or your customer."
                  )}
                </p>
              </div>

              {/* Embedded Visual Artifact: Carrier Dispatch & Tracking */}
              <div className="mt-5 p-3.5 rounded-2xl bg-white dark:bg-navy/80 border border-slate-200/80 dark:border-white/08 shadow-2xs space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-bold text-purple-600">
                  <PackageCheck className="w-4 h-4" />
                  <span>Direct Carrier Dispatch</span>
                </div>
                <div className="px-2 py-1 rounded bg-slate-100 dark:bg-white/06 font-mono text-[10px] text-slate-600 dark:text-slate-300 truncate">
                  DHL / DPD: #GT-24018-EU
                </div>
                <span className="block text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                  ✓ Individual Eco Cushion Wrap
                </span>
              </div>
            </div>
          </Reveal>
        </div>

        {/* 2. Order Timeline Gantt Chart & Proof Policy Callout (Integrated Fluidly) */}
        <Reveal delay={200}>
          <div className="rounded-3xl liquid-glass border border-slate-200/90 dark:border-white/10 p-6 sm:p-8 lg:p-9 shadow-lg">
            <GanttChart />
          </div>
        </Reveal>
      </Container>
    </section>
  );
}

function GanttChart() {
  const { t } = useTranslation();

  const ganttRows = [
    { laneKey: "ganttLaneOrder", left: "8%", width: "42%", tone: "bg-slate-200/90 text-slate-700", labelKey: "ganttLabelFulfilled" },
    { laneKey: "ganttLaneDelivery", left: "42%", width: "18%", tone: "bg-[#0032ab] text-white font-semibold shadow-xs", labelKey: "ganttLabelMarked" },
    { laneKey: "ganttLaneGravurtastisch", left: "58%", width: "22%", tone: "bg-gradient-to-r from-[#0032ab] to-[#4f6ef7] text-white font-bold ring-2 ring-[#4f6ef7]/50 shadow-md", labelKey: "ganttLabelRequestSent", pulse: true },
    { laneKey: "ganttLaneBuyer", left: "78%", width: "18%", tone: "bg-slate-100 border border-dashed border-slate-300 text-slate-500", labelKey: "ganttLabelMayLeave", muted: true },
  ];

  const phases = [
    t("howItWorks.ganttPhaseOrder", "Design received"),
    t("howItWorks.ganttPhaseDelivered", "Proof approved"),
    t("howItWorks.ganttPhaseSent", "In production"),
    t("howItWorks.ganttPhaseBuyer", "Delivered"),
  ];

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#0032ab] dark:text-brand-bright">
            {t("howItWorks.ganttTitle", "Order timeline")}
          </p>
          <p className="mt-1 text-sm text-slate-body">
            {t("howItWorks.ganttSubtitle", "From upload to doorstep - proof is the gate before craft.")}
          </p>
        </div>
        <div className="flex flex-wrap gap-4 text-[11px] text-slate-body">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-[#0032ab]" />{" "}
            {t("howItWorks.ganttLegendConfirmed", "Approved / in progress")}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm border border-dashed border-slate-400 bg-slate-100" />{" "}
            {t("howItWorks.ganttLegendNoAck", "Awaiting your OK")}
          </span>
        </div>
      </div>

      <div className="hidden sm:grid grid-cols-[7.5rem_1fr] gap-4 mb-3">
        <div />
        <div className="grid grid-cols-4 gap-2">
          {phases.map((p) => (
            <p
              key={p}
              className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold text-center"
            >
              {p}
            </p>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {ganttRows.map((row) => (
          <div
            key={row.laneKey}
            className="grid grid-cols-1 sm:grid-cols-[7.5rem_1fr] gap-2 sm:gap-4 items-center"
          >
            <p
              className={`text-xs font-semibold sm:text-right ${
                row.muted ? "text-slate-400" : "text-foreground"
              }`}
            >
              {t(`howItWorks.${row.laneKey}`)}
            </p>
            <div className="relative h-11 rounded-xl bg-slate-100/90 border border-slate-200/80 overflow-hidden shadow-2xs">
              <div className="absolute inset-0 grid grid-cols-4 pointer-events-none" aria-hidden>
                {[0, 1, 2, 3].map((c) => (
                  <div key={c} className="border-r border-slate-200/70 last:border-r-0" />
                ))}
              </div>
              <div
                className={`absolute top-1.5 bottom-1.5 rounded-lg ${row.tone} flex items-center px-3 min-w-0`}
                style={{ left: row.left, width: row.width }}
              >
                <span
                  className={`text-[10px] sm:text-[11px] truncate ${
                    row.laneKey === "ganttLaneGravurtastisch" || row.laneKey === "ganttLaneDelivery"
                      ? "!text-white font-bold"
                      : row.muted
                        ? "text-slate-500"
                        : "text-slate-700 font-medium"
                  }`}
                >
                  {t(`howItWorks.${row.labelKey}`)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Proof-Before-Production Safety Policy Callout */}
      <div className="mt-6 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 rounded-xl bg-[#0032ab]/08 border border-[#0032ab]/20 px-5 py-4">
        <span className="inline-flex items-center gap-2 text-sm font-bold text-[#0032ab] dark:text-brand-bright shrink-0">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#0032ab] opacity-60" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#0032ab]" />
          </span>
          {t("howItWorks.calloutTitle", "Proof before production")}
        </span>
        <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
          {t(
            "howItWorks.calloutBody",
            "We never start laser or print work until you approve the digital proof. That single checkpoint protects your brand and your budget."
          )}
        </p>
      </div>
    </div>
  );
}
