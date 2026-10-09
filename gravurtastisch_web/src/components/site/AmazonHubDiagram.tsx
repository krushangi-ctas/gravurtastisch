import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ImagePlus,
  BadgeCheck,
  Flame,
  PackageCheck,
  RefreshCw,
  CheckCircle2,
} from "lucide-react";

/** Small Gravurtastisch mark used where legacy showed the Amazon logo */
function StudioMark({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <img
      src="/logo.svg?v=gt2"
      alt=""
      className={`inline-block rounded-[4px] object-contain shrink-0 ${className}`}
      loading="lazy"
    />
  );
}

/**
 * Exact ReviewSnapp hub geometry — rebranded for Gravurtastisch.
 * Keep absolute positions: that layout is what made the original feel premium.
 */
export function AmazonHubDiagram() {
  const { t } = useTranslation();
  const [activeNode, setActiveNode] = useState<number | null>(null);

  const satelliteNodes = [
    {
      id: 1,
      title: t("amazonShowcase.diagramNode1Title", "Design intake"),
      desc: t("amazonShowcase.diagramNode1Desc", "Files, SKUs & quantities"),
      icon: ImagePlus,
      topPx: 62,
      bgLight: "bg-violet-50 dark:bg-violet-950/40",
      borderLight: "border-violet-200 dark:border-violet-800/40",
      iconColor: "text-[#613EA3] dark:text-violet-300",
      glowColor: "hover:shadow-[#613EA3]/20",
    },
    {
      id: 2,
      title: t("amazonShowcase.diagramNode2Title", "Digital proof"),
      desc: t("amazonShowcase.diagramNode2Desc", "Approve before craft"),
      icon: BadgeCheck,
      topPx: 165,
      bgLight: "bg-amber-50 dark:bg-amber-950/40",
      borderLight: "border-amber-200 dark:border-amber-800/40",
      iconColor: "text-[#C47432] dark:text-amber-300",
      glowColor: "hover:shadow-[#E89B5C]/25",
    },
    {
      id: 3,
      title: t("amazonShowcase.diagramNode3Title", "Laser & print"),
      desc: t("amazonShowcase.diagramNode3Desc", "Studio production cells"),
      icon: Flame,
      topPx: 268,
      bgLight: "bg-rose-50 dark:bg-rose-950/40",
      borderLight: "border-rose-200 dark:border-rose-800/40",
      iconColor: "text-rose-600 dark:text-rose-400",
      glowColor: "hover:shadow-rose-500/20",
    },
    {
      id: 4,
      title: t("amazonShowcase.diagramNode4Title", "Fulfillment"),
      desc: t("amazonShowcase.diagramNode4Desc", "Pack, ship & notify"),
      icon: PackageCheck,
      topPx: 371,
      bgLight: "bg-emerald-50 dark:bg-emerald-950/40",
      borderLight: "border-emerald-200 dark:border-emerald-800/40",
      iconColor: "text-emerald-600 dark:text-emerald-400",
      glowColor: "hover:shadow-emerald-500/20",
    },
  ];

  return (
    <div className="relative w-full max-w-[690px] mx-auto select-none">
      <div className="absolute top-1/2 left-1/3 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-brand/10 dark:bg-brand/20 rounded-full blur-3xl pointer-events-none" />

      {/* Desktop canvas — same geometry as ReviewSnapp */}
      <div className="hidden sm:block relative w-[660px] h-[540px] mx-auto">
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          viewBox="0 0 660 540"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="hubWireGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#613EA3" stopOpacity="0.85" />
              <stop offset="50%" stopColor="#855FBF" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#E89B5C" stopOpacity="0.85" />
            </linearGradient>
            <linearGradient id="hubWireGradAmber" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#613EA3" />
              <stop offset="100%" stopColor="#E89B5C" />
            </linearGradient>
            <linearGradient id="hubWireGradRose" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#613EA3" />
              <stop offset="100%" stopColor="#E11D48" />
            </linearGradient>
            <linearGradient id="hubWireGradEmerald" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#613EA3" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>
          </defs>

          <line x1="175" y1="72" x2="175" y2="175" stroke="#CBD5E1" strokeWidth="2" strokeDasharray="4 4" className="dark:stroke-slate-700" />
          <line x1="175" y1="72" x2="175" y2="175" stroke="url(#hubWireGrad)" strokeWidth="2.5" className="flow-dash" />

          <line x1="175" y1="355" x2="175" y2="475" stroke="#CBD5E1" strokeWidth="2" strokeDasharray="4 4" className="dark:stroke-slate-700" />
          <line x1="175" y1="355" x2="175" y2="475" stroke="url(#hubWireGrad)" strokeWidth="2.5" className="flow-dash" />

          <path d="M 260 240 C 310 240, 320 95, 370 95" stroke="#CBD5E1" strokeWidth="2" strokeDasharray="4 4" className="dark:stroke-slate-700" />
          <path d="M 260 240 C 310 240, 320 95, 370 95" stroke="url(#hubWireGrad)" strokeWidth="2.5" className="flow-dash" />

          <path d="M 265 255 C 310 255, 320 198, 370 198" stroke="#CBD5E1" strokeWidth="2" strokeDasharray="4 4" className="dark:stroke-slate-700" />
          <path d="M 265 255 C 310 255, 320 198, 370 198" stroke="url(#hubWireGradAmber)" strokeWidth="2.5" className="flow-dash" />

          <path d="M 265 275 C 310 275, 320 301, 370 301" stroke="#CBD5E1" strokeWidth="2" strokeDasharray="4 4" className="dark:stroke-slate-700" />
          <path d="M 265 275 C 310 275, 320 301, 370 301" stroke="url(#hubWireGradRose)" strokeWidth="2.5" className="flow-dash" />

          <path d="M 260 290 C 310 290, 320 404, 370 404" stroke="#CBD5E1" strokeWidth="2" strokeDasharray="4 4" className="dark:stroke-slate-700" />
          <path d="M 260 290 C 310 290, 320 404, 370 404" stroke="url(#hubWireGradEmerald)" strokeWidth="2.5" className="flow-dash" />

          <circle cx="175" cy="175" r="3.5" fill="#613EA3" />
          <circle cx="175" cy="355" r="3.5" fill="#613EA3" />
          <circle cx="370" cy="95" r="3.5" fill="#855FBF" />
          <circle cx="370" cy="198" r="3.5" fill="#E89B5C" />
          <circle cx="370" cy="301" r="3.5" fill="#E11D48" />
          <circle cx="370" cy="404" r="3.5" fill="#059669" />
        </svg>

        {/* Top channel card */}
        <div className="absolute left-[60px] top-[8px] w-[230px] bg-white dark:bg-navy border border-slate-200/90 dark:border-white/10 rounded-2xl p-3 shadow-md shadow-slate-200/50 dark:shadow-none hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 flex items-center gap-3 z-10">
          <div className="relative h-10 w-10 rounded-xl bg-[#F4F0FA] dark:bg-white/5 border border-[#E8E4EF] dark:border-white/10 grid place-items-center shrink-0 shadow-2xs">
            <StudioMark className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border-2 border-white dark:border-navy" />
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-1.5">
              <span className="text-xs font-bold text-navy-deep dark:text-white whitespace-nowrap">
                {t("amazonShowcase.diagramTopTitle", "Sales channel")}
              </span>
              <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 shrink-0">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {t("amazonShowcase.diagramTopConnected", "Connected")}
              </span>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-white/60 font-medium whitespace-nowrap mt-0.5">
              {t("amazonShowcase.diagramTopSub", "Live order sync")}
            </p>
          </div>
        </div>

        {/* Core hub */}
        <div className="absolute left-[85px] top-[175px] w-[180px] h-[180px] rounded-full grid place-items-center z-20">
          <div
            className="absolute inset-0 rounded-full border-2 border-dashed border-[#855FBF]/55 dark:border-[#C4B5FD]/40 animate-spin"
            style={{ animationDuration: "24s" }}
          />
          <div className="absolute inset-2 rounded-full bg-gradient-to-tr from-[#613EA3]/25 via-[#E89B5C]/15 to-[#855FBF]/25 pulse-ring blur-xs" />
          <div className="relative w-[145px] h-[145px] rounded-full bg-gradient-to-b from-[#2A1848] to-[#1A0F2E] text-white p-3 shadow-xl shadow-brand/30 border border-[#855FBF]/45 flex flex-col items-center justify-center text-center hover:scale-105 transition-transform duration-300">
            <div className="h-8 w-8 rounded-full bg-[#613EA3]/35 border border-[#E89B5C]/40 grid place-items-center mb-1">
              <RefreshCw className="w-3.5 h-3.5 text-[#E89B5C] animate-spin" style={{ animationDuration: "8s" }} />
            </div>
            <h4 className="text-xs font-extrabold text-white tracking-tight leading-tight whitespace-nowrap">
              {t("amazonShowcase.diagramCoreTitle", "Gravurtastisch studio")}
            </h4>
            <p className="text-[10px] text-[#C4B5FD]/90 font-medium mt-0.5 whitespace-nowrap">
              {t("amazonShowcase.diagramCoreSub", "Production engine")}
            </p>
            <span className="mt-1 text-[8px] font-mono font-bold text-[#E89B5C] bg-black/40 border border-[#E89B5C]/35 px-2 py-0.5 rounded-full whitespace-nowrap">
              {t("amazonShowcase.diagramCoreLatency", "< 2s updates")}
            </span>
          </div>
        </div>

        {/* Bottom trust pill */}
        <div className="absolute left-[25px] top-[475px] w-[300px] flex justify-center z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white dark:bg-navy border border-slate-200/90 dark:border-white/10 shadow-sm text-slate-700 dark:text-white/80 text-[11px] whitespace-nowrap">
            <div className="h-5 w-5 rounded-full bg-emerald-500/10 border border-emerald-500/20 grid place-items-center text-emerald-600 dark:text-emerald-400 shrink-0">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
            <span className="font-bold text-navy-deep dark:text-white">
              {t("amazonShowcase.diagramBottomTitle", "Precise · Reliable · Scalable")}
            </span>
          </div>
        </div>

        {/* Satellite nodes */}
        {satelliteNodes.map((node) => {
          const IconComp = node.icon;
          const isActive = activeNode === node.id;
          return (
            <div
              key={node.id}
              style={{ top: `${node.topPx}px` }}
              onMouseEnter={() => setActiveNode(node.id)}
              onMouseLeave={() => setActiveNode(null)}
              className={`absolute left-[370px] w-[275px] h-[66px] rounded-2xl px-3.5 py-2.5 bg-white dark:bg-navy border ${node.borderLight} shadow-sm hover:shadow-md ${node.glowColor} transition-all duration-200 hover:translate-x-1.5 flex items-center gap-3 cursor-pointer z-10 ${isActive ? "ring-1 ring-[#613EA3]/30" : ""}`}
            >
              <div
                className={`h-10 w-10 rounded-xl ${node.bgLight} border ${node.borderLight} grid place-items-center shrink-0 ${node.iconColor} shadow-2xs`}
              >
                <IconComp className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h5 className="text-[13px] font-bold text-navy-deep dark:text-white leading-snug whitespace-nowrap">
                  {node.title}
                </h5>
                <p className="text-[11px] text-slate-500 dark:text-white/65 leading-tight whitespace-nowrap mt-0.5">
                  {node.desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Mobile */}
      <div className="sm:hidden space-y-4 p-2">
        <div className="bg-white dark:bg-navy border border-slate-200 dark:border-white/10 rounded-2xl p-3 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-[#F4F0FA] dark:bg-white/5 border border-[#E8E4EF] dark:border-white/10 grid place-items-center">
              <StudioMark className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-navy-deep dark:text-white block">
                {t("amazonShowcase.diagramTopTitle", "Sales channel")}
              </span>
              <span className="text-[10px] text-slate-500 dark:text-white/60">
                {t("amazonShowcase.diagramTopSub", "Live order sync")}
              </span>
            </div>
          </div>
          <span className="text-[9px] font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full">
            {t("amazonShowcase.diagramTopConnected", "Connected")}
          </span>
        </div>

        <div className="bg-gradient-to-r from-[#2A1848] to-[#1A0F2E] text-white rounded-2xl p-4 text-center border border-[#855FBF]/35 shadow-md flex items-center justify-between">
          <div className="flex items-center gap-3 text-left">
            <div className="h-9 w-9 rounded-full bg-[#613EA3]/35 border border-[#E89B5C]/35 grid place-items-center shrink-0">
              <RefreshCw className="w-4 h-4 text-[#E89B5C] animate-spin" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white">
                {t("amazonShowcase.diagramCoreTitle", "Gravurtastisch studio")}
              </h4>
              <p className="text-[10px] text-[#C4B5FD]/90">
                {t("amazonShowcase.diagramCoreSub", "Production engine")}
              </p>
            </div>
          </div>
          <span className="text-[9px] font-mono font-bold text-[#E89B5C] bg-black/40 border border-[#E89B5C]/30 px-2 py-0.5 rounded-full">
            {t("amazonShowcase.diagramCoreLatency", "< 2s updates")}
          </span>
        </div>

        <div className="space-y-2.5">
          {satelliteNodes.map((node) => {
            const IconComp = node.icon;
            return (
              <div
                key={node.id}
                className={`rounded-2xl p-3 bg-white dark:bg-navy border ${node.borderLight} shadow-2xs flex items-center gap-3`}
              >
                <div className={`h-9 w-9 rounded-lg ${node.bgLight} grid place-items-center ${node.iconColor} shrink-0`}>
                  <IconComp className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <h5 className="text-xs font-bold text-navy-deep dark:text-white">{node.title}</h5>
                  <p className="text-[11px] text-slate-500 dark:text-white/60 mt-0.5">{node.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="text-center pt-2">
          <span className="text-[11px] font-medium text-slate-500 dark:text-white/60">
            {t("amazonShowcase.diagramBottomTitle", "Precise · Reliable · Scalable")}
          </span>
        </div>
      </div>
    </div>
  );
}
