import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Zap,
  ShieldCheck,
  Check,
  Cpu,
  Layers,
  ArrowRight,
  Download,
  FileCode,
  Sliders,
  CheckCircle2,
  Sparkles,
} from "lucide-react";

export function AmazonHubDiagram() {
  const { t } = useTranslation();
  const [activeJobIndex, setActiveJobIndex] = useState(0);

  const customJobs = [
    {
      id: "AMZ-114-8923019-48",
      marketplace: "Amazon.de",
      flag: "🇩🇪",
      productName: "Rotary Powder-Coated Tumbler",
      shortName: "360° Laser Tumbler",
      asin: "B09X7K81",
      buyerText: "Alexander - Est. 2024",
      buyerFont: "Cinzel Bold",
      machineProfile: "Rotary Laser (Fiber/CO2)",
      fileFormat: "SVG & DXF (EZCad)",
      safeMargin: "15.0mm (Rim & Base Lock)",
      renderTime: "0.6s",
      dimensions: "H: 185mm · Ø: 78mm",
      accent: "#38bdf8",
      accentBg: "rgba(56, 189, 248, 0.12)",
      borderColor: "rgba(56, 189, 248, 0.35)",
      renderCadGraphic: () => (
        <svg viewBox="0 0 320 180" className="w-full h-full" fill="none">
          <defs>
            <pattern id="tumblerGrid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="0.8" />
            </pattern>
          </defs>
          <rect width="320" height="180" fill="#081226" />
          <rect width="320" height="180" fill="url(#tumblerGrid)" />

          {/* Tumbler wireframe outline */}
          <path d="M 70 30 L 250 30 L 235 150 L 85 150 Z" fill="rgba(56, 189, 248, 0.05)" stroke="rgba(255,255,255,0.22)" strokeWidth="1.2" strokeDasharray="4 3" />
          
          {/* Safe zone boundary */}
          <rect x="100" y="55" width="120" height="70" rx="4" fill="rgba(56, 189, 248, 0.1)" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="4 2" />
          <text x="160" y="48" fill="#38bdf8" fontSize="8.5" fontFamily="monospace" textAnchor="middle" fontWeight="bold">Safe Zone Locked</text>

          {/* Calibrated Vector Text curves */}
          <text x="160" y="85" fill="#ffffff" fontSize="13" fontFamily="serif" fontWeight="bold" textAnchor="middle" letterSpacing="1.5">Alexander</text>
          <text x="160" y="103" fill="#38bdf8" fontSize="9.5" fontFamily="sans-serif" textAnchor="middle" letterSpacing="2">- Est. 2024 -</text>

          {/* Vector nodes & handles */}
          <circle cx="100" cy="55" r="3" fill="#38bdf8" />
          <circle cx="220" cy="55" r="3" fill="#38bdf8" />
          <circle cx="100" cy="125" r="3" fill="#38bdf8" />
          <circle cx="220" cy="125" r="3" fill="#38bdf8" />

          {/* Laser spot crosshairs */}
          <circle cx="160" cy="92" r="14" fill="none" stroke="#ef4444" strokeWidth="1.2" />
          <line x1="140" y1="92" x2="180" y2="92" stroke="#ef4444" strokeWidth="1.2" />
          <line x1="160" y1="72" x2="160" y2="112" stroke="#ef4444" strokeWidth="1.2" />
          <circle cx="160" cy="92" r="2" fill="#ef4444" />

          {/* Coordinate overlay badge */}
          <rect x="10" y="152" width="130" height="20" rx="4" fill="rgba(0,0,0,0.6)" stroke="rgba(255,255,255,0.15)" />
          <text x="75" y="166" fill="#38bdf8" fontSize="8" fontFamily="monospace" textAnchor="middle">Rotary Angle: 0.05°</text>
        </svg>
      )
    },
    {
      id: "AMZ-502-118274-03",
      marketplace: "Amazon.co.uk",
      flag: "🇬🇧",
      productName: "Solid Oak Engraved Serving Board",
      shortName: "Oak Cutting Board",
      asin: "B07W5P19",
      buyerText: "The Miller Family",
      buyerFont: "Edwardian Script",
      machineProfile: "CO2 Flatbed Laser & CNC",
      fileFormat: "Multi-Layer DXF & SVG",
      safeMargin: "20.0mm (Bevel Clearance)",
      renderTime: "0.8s",
      dimensions: "W: 350mm · H: 240mm",
      accent: "#10b981",
      accentBg: "rgba(16, 185, 129, 0.12)",
      borderColor: "rgba(16, 185, 129, 0.35)",
      renderCadGraphic: () => (
        <svg viewBox="0 0 320 180" className="w-full h-full" fill="none">
          <defs>
            <pattern id="woodGrid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="0.8" />
            </pattern>
          </defs>
          <rect width="320" height="180" fill="#051a14" />
          <rect width="320" height="180" fill="url(#woodGrid)" />

          {/* Cutting Board outer cut path (Red line) */}
          <rect x="40" y="25" width="240" height="130" rx="16" fill="rgba(16, 185, 129, 0.06)" stroke="#ef4444" strokeWidth="1.5" />
          <circle cx="65" cy="50" r="10" stroke="#ef4444" strokeWidth="1.5" fill="none" />
          
          {/* Inner engraving safe zone */}
          <rect x="85" y="45" width="170" height="90" rx="8" fill="rgba(16, 185, 129, 0.1)" stroke="#10b981" strokeWidth="1.2" strokeDasharray="4 2" />

          {/* Flourish & Monogram */}
          <path d="M 120 70 Q 170 50 220 70" stroke="#10b981" strokeWidth="1.5" fill="none" />
          <text x="170" y="90" fill="#ffffff" fontSize="16" fontFamily="serif" fontWeight="bold" textAnchor="middle">M</text>
          <text x="170" y="110" fill="#a7f3d0" fontSize="11" fontFamily="serif" textAnchor="middle">The Miller Family</text>
          <path d="M 120 120 Q 170 140 220 120" stroke="#10b981" strokeWidth="1.5" fill="none" />

          {/* Laser Cut/Engrave legend */}
          <rect x="195" y="152" width="115" height="20" rx="4" fill="rgba(0,0,0,0.6)" stroke="rgba(255,255,255,0.15)" />
          <circle cx="205" cy="162" r="3" fill="#ef4444" />
          <text x="214" y="165" fill="#ef4444" fontSize="7.5" fontFamily="monospace">Cut</text>
          <circle cx="240" cy="162" r="3" fill="#10b981" />
          <text x="249" y="165" fill="#10b981" fontSize="7.5" fontFamily="monospace">Engrave</text>
        </svg>
      )
    },
    {
      id: "AMZ-028-449102-12",
      marketplace: "Amazon.fr",
      flag: "🇫🇷",
      productName: "Custom Acrylic Photo Plaque",
      shortName: "Acrylic Photo Plaque",
      asin: "B08Y6M92",
      buyerText: "Emma & Lucas - Paris 2024",
      buyerFont: "Montserrat SemiBold",
      machineProfile: "UV Flatbed & Contour Laser",
      fileFormat: "300 DPI PDF (Cut Path)",
      safeMargin: "3.0mm Bleed Enforced",
      renderTime: "0.5s",
      dimensions: "W: 200mm · H: 150mm",
      accent: "#38bdf8",
      accentBg: "rgba(56, 189, 248, 0.12)",
      borderColor: "rgba(56, 189, 248, 0.35)",
      renderCadGraphic: () => (
        <svg viewBox="0 0 320 180" className="w-full h-full" fill="none">
          <defs>
            <pattern id="acrylicGrid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(56,189,248,0.08)" strokeWidth="0.8" />
            </pattern>
          </defs>
          {/* Refined modern Blueprint Sapphire background - NO murky purple */}
          <rect width="320" height="180" fill="#0c1736" />
          <rect width="320" height="180" fill="url(#acrylicGrid)" />

          {/* Acrylic Plaque outer frame in crisp Cyan / Sapphire */}
          <rect x="55" y="25" width="210" height="130" rx="10" fill="rgba(56, 189, 248, 0.08)" stroke="#38bdf8" strokeWidth="1.5" />
          
          {/* Photo pre-flight box */}
          <rect x="70" y="38" width="105" height="104" rx="6" fill="rgba(255,255,255,0.07)" stroke="rgba(56,189,248,0.35)" strokeWidth="1.2" />
          <circle cx="100" cy="70" r="14" fill="#38bdf8" opacity="0.8" />
          <polygon points="75,125 110,85 135,110 155,95 170,125" fill="rgba(56,189,248,0.35)" />

          {/* 300 DPI Badge */}
          <rect x="75" y="45" width="70" height="18" rx="4" fill="#10b981" />
          <text x="110" y="57" fill="#ffffff" fontSize="8" fontFamily="sans-serif" fontWeight="bold" textAnchor="middle">300 DPI Passed</text>

          {/* Text block */}
          <text x="190" y="70" fill="#ffffff" fontSize="12" fontFamily="sans-serif" fontWeight="bold">Emma &amp; Lucas</text>
          <text x="190" y="88" fill="#7dd3fc" fontSize="9.5" fontFamily="sans-serif">Paris, France</text>
          <text x="190" y="104" fill="#cbd5e1" fontSize="8.5" fontFamily="monospace">15.08.2024</text>

          {/* Registration marks */}
          <circle cx="65" cy="35" r="4" fill="none" stroke="#ef4444" strokeWidth="1.2" />
          <circle cx="255" cy="35" r="4" fill="none" stroke="#ef4444" strokeWidth="1.2" />
          <circle cx="65" cy="145" r="4" fill="none" stroke="#ef4444" strokeWidth="1.2" />
          <circle cx="255" cy="145" r="4" fill="none" stroke="#ef4444" strokeWidth="1.2" />
        </svg>
      )
    }
  ];

  const currentJob = customJobs[activeJobIndex];

  return (
    <div className="relative w-full max-w-[640px] mx-auto select-none py-2 min-w-0 font-sans">
      {/* Background Soft Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px] h-[420px] bg-gradient-to-tr from-[#0032ab]/12 via-[#2563eb]/10 to-transparent rounded-full blur-3xl pointer-events-none" />

      {/* Main Container Card: Modern SaaS Terminal Window */}
      <div className="relative z-10 rounded-2xl bg-white/95 dark:bg-[#070d1e]/90 border border-slate-200/90 dark:border-white/10 shadow-xl overflow-hidden backdrop-blur-md">
        
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-100/80 dark:bg-slate-900/80 border-b border-slate-200/80 dark:border-white/10">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#ef4444] inline-block" />
            <span className="w-3 h-3 rounded-full bg-[#f59e0b] inline-block" />
            <span className="w-3 h-3 rounded-full bg-[#10b981] inline-block" />
            <span className="ml-2 font-mono text-[11px] font-bold text-slate-700 dark:text-slate-300">
              Printomation // CAD Vector Compiler
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-mono text-[10px] font-bold flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>SP-API Live</span>
            </div>
            <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
              {currentJob.flag} {currentJob.marketplace}
            </span>
          </div>
        </div>

        {/* 2-Column Core Architecture Pipeline */}
        <div className="p-4 sm:p-5 grid grid-cols-1 md:grid-cols-12 gap-4">
          
          {/* Left Column (5 Cols): Amazon Custom Order Intake */}
          <div className="md:col-span-5 min-w-0 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 dark:border-white/5">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                  01 · Amazon Custom Intake
                </span>
                <span className="text-[9.5px] font-mono font-bold text-[#0032ab] dark:text-brand-bright">
                  {currentJob.renderTime}
                </span>
              </div>

              {/* Order Pill */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/5 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono font-bold text-navy-deep dark:text-white truncate">
                    {currentJob.id}
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-brand/10 text-brand font-bold shrink-0">
                    {currentJob.asin}
                  </span>
                </div>

                <div className="text-[11px] space-y-1 pt-1 border-t border-slate-200/60 dark:border-white/5">
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>Buyer Input:</span>
                    <span className="font-bold text-navy-deep dark:text-white truncate max-w-[120px]">
                      "{currentJob.buyerText}"
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>Font Chosen:</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200 truncate">
                      {currentJob.buyerFont}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>Dimensions:</span>
                    <span className="font-mono text-slate-700 dark:text-slate-300">
                      {currentJob.dimensions}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Automation Pipeline Checkmarks */}
            <div className="p-2.5 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-[11px] space-y-1.5 text-emerald-800 dark:text-emerald-300">
              <div className="flex items-center gap-1.5 font-medium">
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Text-to-Curves Outline Lock</span>
              </div>
              <div className="flex items-center gap-1.5 font-medium">
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Safe Margin: {currentJob.safeMargin}</span>
              </div>
              <div className="flex items-center gap-1.5 font-medium">
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>0 Retyping Misprints Guaranteed</span>
              </div>
            </div>
          </div>

          {/* Right Column (7 Cols): Live CAD Machine Vector Output */}
          <div className="md:col-span-7 min-w-0 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 dark:border-white/5">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                  02 · Machine File Generation
                </span>
                <span className="text-[9.5px] font-mono font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Pre-Press Verified
                </span>
              </div>

              {/* Interactive Vector CAD Screen */}
              <div className="relative rounded-xl overflow-hidden border border-slate-200/90 dark:border-white/10 shadow-inner aspect-[16/9] w-full">
                {currentJob.renderCadGraphic()}

                {/* Corner Machine Profile Pill */}
                <div className="absolute top-2.5 right-2.5 px-2.5 py-1 rounded-lg bg-slate-900/90 backdrop-blur-md border border-white/20 text-[9.5px] font-mono font-bold text-white flex items-center gap-1.5 shadow-sm">
                  <Cpu className="w-3 h-3 text-cyan-400" />
                  <span>{currentJob.machineProfile}</span>
                </div>
              </div>
            </div>

            {/* Bottom Output Format Bar */}
            <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/5 w-full min-w-0 overflow-hidden">
              <div className="flex items-center gap-1.5 min-w-0 flex-1">
                <FileCode className="w-3.5 h-3.5 text-brand shrink-0" />
                <span className="font-mono text-[11px] sm:text-xs font-bold text-navy-deep dark:text-white truncate">
                  {currentJob.fileFormat}
                </span>
              </div>
              <button
                type="button"
                className="px-2.5 py-1.5 rounded-lg bg-brand text-white font-mono text-[10.5px] font-semibold flex items-center gap-1.5 shadow-xs shrink-0 cursor-pointer hover:bg-brand-bright transition-colors"
              >
                <Download className="w-3.5 h-3.5 shrink-0" />
                <span>Download File</span>
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Simulation Selector Tabs */}
        <div className="px-4 py-3 bg-slate-50/90 dark:bg-slate-900/90 border-t border-slate-200/80 dark:border-white/10">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-slate-500 dark:text-slate-400">
              Select Simulated Custom Line:
            </span>
            <span className="text-[9.5px] font-mono text-slate-400">
              Click to switch preview
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {customJobs.map((job, idx) => {
              const isActive = activeJobIndex === idx;
              return (
                <button
                  key={job.id}
                  type="button"
                  onClick={() => setActiveJobIndex(idx)}
                  className={`h-10 px-2.5 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 truncate border ${
                    isActive
                      ? "bg-brand !text-white border-brand shadow-sm shadow-brand/25 scale-[1.02]"
                      : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-white/10 hover:border-brand/40 hover:bg-slate-50"
                  }`}
                >
                  <span className="text-sm shrink-0">{job.flag}</span>
                  <span className="truncate">{job.shortName}</span>
                </button>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
