import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Flame,
  ShieldCheck,
  Zap,
  Globe2,
  Layers,
  PackageCheck,
  Check,
} from "lucide-react";

export function AmazonHubDiagram() {
  const { t } = useTranslation();
  const [activeJobIndex, setActiveJobIndex] = useState(0);

  const customJobs = [
    {
      id: "CUP-WRAP-750",
      channel: "Amazon Handmade",
      channelBadge: "SP-API Live",
      productName: "Matte Insulated Tumbler",
      shortName: "Matte Tumbler",
      category: "Drinkware",
      material: "Food-Grade Stainless Steel",
      craftLine: "360° Rotary Laser Pass",
      beamSpec: "0.05mm Micro-Focal Spot",
      powerSpec: "120W Laser · 850mm/s",
      proofStatus: "Proof Approved · Unlocked",
      proofShort: "Proof Approved",
      trackingCode: "DHL Express: #DE-9941824",
      eta: "Dispatched < 24h",
      coords: "X: 142.4mm · Y: 88.0mm",
      accentColor: "#0032ab",
      type: "tumbler",
    },
    {
      id: "BOARD-OAK-02",
      channel: "Shopify DTC Store",
      channelBadge: "Shopify Webhook",
      productName: "Solid Oak Engraved Board",
      shortName: "Solid Oak Board",
      category: "Woodcraft",
      material: "Sustainably Sourced European Oak",
      craftLine: "Deep Vector Laser Etch (0.8mm)",
      beamSpec: "High-Contrast Surface Etch",
      powerSpec: "95W Co2 · Mineral Oil Sealed",
      proofStatus: "100% Vector Mockup Locked",
      proofShort: "Vector Locked",
      trackingCode: "DPD Europe: #AT-8812045",
      eta: "Dispatched < 36h",
      coords: "X: 210.0mm · Y: 130.5mm",
      accentColor: "#4f6ef7",
      type: "board",
    },
    {
      id: "APP-HOOD-12",
      channel: "Corporate B2B Portal",
      channelBadge: "Direct B2B Sync",
      productName: "Heavyweight Studio Hoodie",
      shortName: "Studio Hoodie",
      category: "Apparel",
      material: "350 GSM Organic Cotton",
      craftLine: "High-Density Tajima Embroidery",
      beamSpec: "18,500 Precision Stitches",
      powerSpec: "Pantone-Matched Madeira Threads",
      proofStatus: "Digital Proof Approved by Brand",
      proofShort: "Proof Approved",
      trackingCode: "DHL Express: #B2B-CH-4419",
      eta: "Dispatched < 48h",
      coords: "X: 180.0mm · Y: 110.0mm",
      accentColor: "#155dfc",
      type: "apparel",
    },
  ];

  const currentJob = customJobs[activeJobIndex];

  return (
    <div className="relative w-full max-w-[620px] mx-auto select-none py-2">
      {/* Brand Ambient Glows - Royal Blue & Electric Indigo Caustics */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[380px] h-[380px] bg-gradient-to-tr from-[#0032ab]/10 via-[#4f6ef7]/12 to-transparent rounded-full blur-3xl pointer-events-none" />

      {/* SVG Kinetic Conduits: EXACT 45° DIAGONAL CROSS CONNECTIONS BETWEEN CARDS AND CENTER CIRCLE */}
      <svg
        className="absolute inset-0 w-full h-[390px] pointer-events-none z-0"
        viewBox="0 0 620 390"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="laserBeamLight" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0032ab" stopOpacity="0.5" />
            <stop offset="50%" stopColor="#4f6ef7" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#155dfc" stopOpacity="0.5" />
          </linearGradient>
        </defs>

        {/* 1. TOP-LEFT DIAGONAL CROSS: Amazon SP-API Card (150, 48) <---> Center Circle Rim (235, 115) */}
        {/* Base Solid Guide Line */}
        <line
          x1="140"
          y1="48"
          x2="240"
          y2="120"
          stroke="#0032ab"
          strokeWidth="2"
          strokeOpacity="0.25"
        />
        {/* Animated Dashed Laser Pulse Beam */}
        <line
          x1="140"
          y1="48"
          x2="240"
          y2="120"
          stroke="#0032ab"
          strokeWidth="2.5"
          className="flow-dash"
        />
        {/* Connector Port Dots */}
        <circle cx="165" cy="56" r="4" fill="#0032ab" />
        <circle cx="232" cy="115" r="3.5" fill="#4f6ef7" />

        {/* 2. TOP-RIGHT DIAGONAL CROSS: Shopify DTC Card (480, 48) <---> Center Circle Rim (385, 115) */}
        {/* Base Solid Guide Line */}
        <line
          x1="480"
          y1="48"
          x2="380"
          y2="120"
          stroke="#4f6ef7"
          strokeWidth="2"
          strokeOpacity="0.25"
        />
        {/* Animated Dashed Laser Pulse Beam */}
        <line
          x1="480"
          y1="48"
          x2="380"
          y2="120"
          stroke="#4f6ef7"
          strokeWidth="2.5"
          className="flow-dash"
        />
        {/* Connector Port Dots */}
        <circle cx="455" cy="56" r="4" fill="#4f6ef7" />
        <circle cx="388" cy="115" r="3.5" fill="#155dfc" />

        {/* 3. BOTTOM-LEFT DIAGONAL CROSS: B2B Bulk Portal Card (140, 332) <---> Center Circle Rim (240, 260) */}
        {/* Base Solid Guide Line */}
        <line
          x1="140"
          y1="332"
          x2="240"
          y2="260"
          stroke="#155dfc"
          strokeWidth="2"
          strokeOpacity="0.25"
        />
        {/* Animated Dashed Laser Pulse Beam */}
        <line
          x1="140"
          y1="332"
          x2="240"
          y2="260"
          stroke="#155dfc"
          strokeWidth="2.5"
          className="flow-dash-reverse"
        />
        {/* Connector Port Dots */}
        <circle cx="165" cy="324" r="4" fill="#155dfc" />
        <circle cx="232" cy="265" r="3.5" fill="#0032ab" />

        {/* 4. BOTTOM-RIGHT DIAGONAL CROSS: DHL Express EU Card (480, 332) <---> Center Circle Rim (380, 260) */}
        {/* Base Solid Guide Line */}
        <line
          x1="480"
          y1="332"
          x2="380"
          y2="260"
          stroke="#10b981"
          strokeWidth="2"
          strokeOpacity="0.25"
        />
        {/* Animated Dashed Laser Pulse Beam */}
        <line
          x1="480"
          y1="332"
          x2="380"
          y2="260"
          stroke="#10b981"
          strokeWidth="2.5"
          className="flow-dash"
        />
        {/* Connector Port Dots */}
        <circle cx="455" cy="324" r="4" fill="#10b981" />
        <circle cx="388" cy="265" r="3.5" fill="#10b981" />
      </svg>

      {/* TOP ROW: Satellite Channel Capsules (Uniform 200px x 56px) */}
      <div className="relative z-10 flex items-center justify-between gap-3 mb-1">
        {/* Top-Left Satellite: Amazon SP-API */}
        <div
          onClick={() => setActiveJobIndex(0)}
          className={`w-[200px] h-[56px] flex items-center gap-2.5 px-3 rounded-2xl cursor-pointer transition-all duration-200 border relative ${
            activeJobIndex === 0
              ? "bg-white dark:bg-[#0b132b] border-[#0032ab] shadow-md shadow-[#0032ab]/15 ring-2 ring-[#0032ab]/15"
              : "bg-white/95 dark:bg-[#0b132b]/80 border-slate-200/90 dark:border-white/10 hover:border-[#0032ab]/50 hover:bg-white"
          }`}
        >
          <div className="h-8 w-8 rounded-xl bg-[#0032ab] text-white grid place-items-center shrink-0 shadow-xs">
            <Zap className="w-4 h-4" />
          </div>
          <div className="min-w-0 text-left">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-navy-deep dark:text-white truncate">
                Amazon SP-API
              </span>
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
            </div>
            <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 block truncate">
              Live Intake · 12ms
            </span>
          </div>
        </div>

        {/* Top-Center Orchestrator Live Pill */}
        <div className="hidden sm:inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-slate-100/90 dark:bg-white/06 border border-slate-200 dark:border-white/10 text-[9.5px] font-mono font-bold text-[#0032ab] dark:text-[#4f6ef7]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#4f6ef7] animate-pulse" />
          <span>STUDIO ORCHESTRATOR LIVE</span>
        </div>

        {/* Top-Right Satellite: Shopify DTC */}
        <div
          onClick={() => setActiveJobIndex(1)}
          className={`w-[200px] h-[56px] flex items-center gap-2.5 px-3 rounded-2xl cursor-pointer transition-all duration-200 border relative ${
            activeJobIndex === 1
              ? "bg-white dark:bg-[#0b132b] border-[#4f6ef7] shadow-md shadow-[#4f6ef7]/15 ring-2 ring-[#4f6ef7]/15"
              : "bg-white/95 dark:bg-[#0b132b]/80 border-slate-200/90 dark:border-white/10 hover:border-[#4f6ef7]/50 hover:bg-white"
          }`}
        >
          <div className="h-8 w-8 rounded-xl bg-[#4f6ef7] text-white grid place-items-center shrink-0 shadow-xs">
            <Globe2 className="w-4 h-4" />
          </div>
          <div className="min-w-0 text-left">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-navy-deep dark:text-white truncate">
                Shopify DTC
              </span>
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
            </div>
            <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 block truncate">
              Vector Inflow · 300 DPI
            </span>
          </div>
        </div>
      </div>

      {/* CENTRAL STAGE: Compact Precision Optical Laser Dial (Sized 216px, Perfectly Center Aligned) */}
      <div className="relative z-10 flex items-center justify-center my-3">
        {/* Outer Circular Calibration Orbit Rings */}
        <div className="absolute w-[248px] sm:w-[268px] h-[248px] sm:h-[268px] rounded-full border border-dashed border-[#0032ab]/25 dark:border-[#4f6ef7]/30 orbit-spin-slow pointer-events-none" />
        <div className="absolute w-[264px] sm:w-[284px] h-[264px] sm:h-[284px] rounded-full border border-slate-200/70 dark:border-white/10 orbit-spin-slow-rev pointer-events-none" />

        {/* Degree Markers */}
        <div className="absolute inset-0 flex items-center justify-between px-3 sm:px-6 pointer-events-none text-[8px] font-mono text-[#0032ab]/60 dark:text-[#4f6ef7]/70 font-bold">
          <span>270°</span>
          <span>090°</span>
        </div>
        <div className="absolute inset-0 flex flex-col items-center justify-between py-1 sm:py-3 pointer-events-none text-[8px] font-mono text-[#0032ab]/60 dark:text-[#4f6ef7]/70 font-bold">
          <span>000° [CAL]</span>
          <span>180° [ROT]</span>
        </div>

        {/* Left Telemetry Wing: Laser Optics */}
        <div className="hidden md:flex absolute -left-1 w-[120px] flex-col gap-1 p-2.5 rounded-2xl bg-white/95 dark:bg-[#0b132b]/90 border border-slate-200/90 dark:border-white/10 shadow-sm backdrop-blur-md text-[9.5px] font-mono z-20 text-left">
          <div className="flex items-center gap-1.5 text-[#0032ab] dark:text-[#4f6ef7] font-bold">
            <Flame className="w-3.5 h-3.5" />
            <span className="uppercase tracking-wider">Optics</span>
          </div>
          <div className="space-y-0.5 pt-1 border-t border-slate-100 dark:border-white/06">
            <div className="flex justify-between items-center text-slate-500">
              <span>Beam</span>
              <span className="font-bold text-[#0032ab] dark:text-[#4f6ef7]">0.05mm</span>
            </div>
            <div className="flex justify-between items-center text-slate-500">
              <span>Power</span>
              <span className="font-bold text-navy-deep dark:text-white">120W</span>
            </div>
            <div className="flex justify-between items-center text-slate-500">
              <span>Speed</span>
              <span className="font-bold text-navy-deep dark:text-white">850mm/s</span>
            </div>
          </div>
        </div>

        {/* Right Telemetry Wing: Quality Gate */}
        <div className="hidden md:flex absolute -right-1 w-[120px] flex-col gap-1 p-2.5 rounded-2xl bg-white/95 dark:bg-[#0b132b]/90 border border-slate-200/90 dark:border-white/10 shadow-sm backdrop-blur-md text-[9.5px] font-mono z-20 text-left">
          <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span className="uppercase tracking-wider">Quality</span>
          </div>
          <div className="space-y-0.5 pt-1 border-t border-slate-100 dark:border-white/06">
            <div className="flex justify-between items-center text-slate-500">
              <span>Proof</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">100% OK</span>
            </div>
            <div className="flex justify-between items-center text-slate-500">
              <span>Color</span>
              <span className="font-bold text-navy-deep dark:text-white">Pantone</span>
            </div>
            <div className="flex justify-between items-center text-slate-500">
              <span>Route</span>
              <span className="font-bold text-[#0032ab] dark:text-[#4f6ef7]">DHL 24h</span>
            </div>
          </div>
        </div>

        {/* The Main Circular Optical Craft Lens - Sized 216px */}
        <div className="relative w-52 h-52 sm:w-56 sm:h-56 rounded-full p-2 bg-gradient-to-tr from-[#0032ab] via-[#4f6ef7] to-[#155dfc] shadow-lg shadow-[#0032ab]/20">
          {/* Inner Light Craft Lens */}
          <div className="relative w-full h-full rounded-full bg-gradient-to-b from-white via-slate-50/90 to-blue-50/40 dark:from-[#0b132b] dark:to-[#152238] overflow-hidden border border-white/60 dark:border-white/10 flex flex-col items-center justify-center p-2.5">
            {/* Concentric Precision Radar Circles */}
            <div className="absolute inset-3 rounded-full border border-[#0032ab]/12 dark:border-white/10 pointer-events-none" />
            <div className="absolute inset-8 rounded-full border border-dashed border-[#4f6ef7]/20 pointer-events-none" />

            {/* Crosshair Hairlines */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-[#0032ab]/20 to-transparent" />
            </div>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="h-full w-[1px] bg-gradient-to-b from-transparent via-[#0032ab]/20 to-transparent" />
            </div>

            {/* Live Sweeping Laser Beam Line */}
            <div className="absolute left-4 right-4 h-[2px] bg-gradient-to-r from-transparent via-[#0032ab] to-transparent laser-sweep-line pointer-events-none z-20 shadow-[0_0_8px_#4f6ef7]">
              <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#4f6ef7] shadow-[0_0_6px_#4f6ef7]" />
            </div>

            {/* Product Craft Interactive Visualizer */}
            <div className="relative z-10 flex flex-col items-center justify-center text-center">
              {/* Product SVG Graphic (Compact & Crisp) */}
              <div className="relative w-20 h-18 mb-0.5 flex items-center justify-center">
                {currentJob.type === "tumbler" && (
                  /* Premium Stainless Steel Tumbler */
                  <svg className="w-12 h-18 drop-shadow-sm" viewBox="0 0 70 110" fill="none">
                    <rect x="18" y="4" width="34" height="6" rx="2" fill="#0032ab" />
                    <path
                      d="M 16 14 L 54 14 L 48 102 C 48 105, 46 107, 43 107 L 27 107 C 24 107, 22 105, 22 102 Z"
                      fill="url(#tumblerSilverGrad)"
                      stroke="#0032ab"
                      strokeWidth="1.5"
                    />
                    <circle cx="35" cy="55" r="10" stroke="#0032ab" strokeWidth="1.2" strokeDasharray="3 2" />
                    <text x="35" y="58" fill="#0032ab" fontSize="7" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                      GT-26
                    </text>
                    <line x1="20" y1="36" x2="50" y2="36" stroke="#4f6ef7" strokeWidth="1" strokeDasharray="2 1" />
                    <line x1="23" y1="74" x2="47" y2="74" stroke="#4f6ef7" strokeWidth="1" strokeDasharray="2 1" />
                    <defs>
                      <linearGradient id="tumblerSilverGrad" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#f8fafc" />
                        <stop offset="30%" stopColor="#e2e8f0" />
                        <stop offset="60%" stopColor="#ffffff" />
                        <stop offset="100%" stopColor="#cbd5e1" />
                      </linearGradient>
                    </defs>
                  </svg>
                )}

                {currentJob.type === "board" && (
                  /* Solid European Oak Board */
                  <svg className="w-16 h-16 drop-shadow-sm" viewBox="0 0 90 90" fill="none">
                    <rect
                      x="10"
                      y="14"
                      width="70"
                      height="62"
                      rx="10"
                      fill="url(#oakWoodBlonde)"
                      stroke="#d97706"
                      strokeWidth="1.5"
                    />
                    <polygon points="45,26 62,56 28,56" stroke="#0032ab" strokeWidth="1.2" fill="none" strokeDasharray="3 2" />
                    <text x="45" y="50" fill="#0032ab" fontSize="8" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                      EST. 2026
                    </text>
                    <line x1="22" y1="64" x2="68" y2="64" stroke="#b45309" strokeWidth="1" />
                    <defs>
                      <linearGradient id="oakWoodBlonde" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#fef3c7" />
                        <stop offset="50%" stopColor="#fde68a" />
                        <stop offset="100%" stopColor="#fef3c7" />
                      </linearGradient>
                    </defs>
                  </svg>
                )}

                {currentJob.type === "apparel" && (
                  /* Studio Hoodie */
                  <svg className="w-16 h-16 drop-shadow-sm" viewBox="0 0 90 90" fill="none">
                    <path
                      d="M 30 18 L 45 26 L 60 18 L 82 30 L 72 45 L 63 38 L 63 76 L 27 76 L 27 38 L 18 45 L 8 30 Z"
                      fill="url(#hoodieCleanGrad)"
                      stroke="#0032ab"
                      strokeWidth="1.5"
                    />
                    <rect x="36" y="42" width="18" height="18" rx="3" stroke="#4f6ef7" strokeWidth="1.2" strokeDasharray="2 1" />
                    <text x="45" y="54" fill="#0032ab" fontSize="7.5" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                      18.5K
                    </text>
                    <defs>
                      <linearGradient id="hoodieCleanGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#ffffff" />
                        <stop offset="60%" stopColor="#f1f5f9" />
                        <stop offset="100%" stopColor="#e2e8f0" />
                      </linearGradient>
                    </defs>
                  </svg>
                )}
              </div>

              {/* Target Reticle Text */}
              <div className="space-y-0.5">
                <span className="text-[9px] font-mono text-[#0032ab] dark:text-[#4f6ef7] font-bold block uppercase tracking-wider">
                  {currentJob.id}
                </span>
                <h5 className="text-xs sm:text-[13px] font-extrabold text-navy-deep dark:text-white tracking-tight">
                  {currentJob.shortName}
                </h5>
                <span className="text-[9px] font-mono text-slate-500 dark:text-slate-400 block font-medium">
                  {currentJob.coords}
                </span>
              </div>

              {/* Compact Proof Badge - Safe in center vertical flow, NEVER cut off! */}
              <div className="mt-1 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-[8.5px] font-mono font-bold text-emerald-700 dark:text-emerald-300 inline-flex items-center gap-1 shadow-2xs">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                <span>{currentJob.proofShort.toUpperCase()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* BOTTOM ROW: Satellite Channel Capsules (Uniform 200px x 56px) */}
      <div className="relative z-10 flex items-center justify-between gap-3 mt-1">
        {/* Bottom-Left Satellite: Corporate B2B Portal */}
        <div
          onClick={() => setActiveJobIndex(2)}
          className={`w-[200px] h-[56px] flex items-center gap-2.5 px-3 rounded-2xl cursor-pointer transition-all duration-200 border relative ${
            activeJobIndex === 2
              ? "bg-white dark:bg-[#0b132b] border-[#155dfc] shadow-md shadow-[#155dfc]/15 ring-2 ring-[#155dfc]/15"
              : "bg-white/95 dark:bg-[#0b132b]/80 border-slate-200/90 dark:border-white/10 hover:border-[#155dfc]/50 hover:bg-white"
          }`}
        >
          <div className="h-8 w-8 rounded-xl bg-[#155dfc] text-white grid place-items-center shrink-0 shadow-xs">
            <Layers className="w-4 h-4" />
          </div>
          <div className="min-w-0 text-left">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-navy-deep dark:text-white truncate">
                B2B Bulk Portal
              </span>
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
            </div>
            <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 block truncate">
              Proof-Gated · Tiered
            </span>
          </div>
        </div>

        {/* Bottom-Right Satellite: DHL Express EU */}
        <div className="w-[200px] h-[56px] flex items-center gap-2.5 px-3 rounded-2xl border bg-white/95 dark:bg-[#0b132b]/80 border-slate-200/90 dark:border-white/10 relative">
          <div className="h-8 w-8 rounded-xl bg-emerald-600 text-white grid place-items-center shrink-0 shadow-xs">
            <PackageCheck className="w-4 h-4" />
          </div>
          <div className="min-w-0 text-left">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-navy-deep dark:text-white truncate">
                DHL Express EU
              </span>
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
            </div>
            <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 block font-bold truncate">
              {currentJob.eta}
            </span>
          </div>
        </div>
      </div>

      {/* INTERACTIVE CRAFT STUDIO SWITCHER: Equal Uniform Size for ALL 3 Options! */}
      <div className="relative z-10 mt-5 flex flex-col items-center gap-2">
        <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 uppercase tracking-widest font-bold">
          Select Custom Studio Line to Simulate:
        </span>

        {/* Uniform Grid: 3 Equal-Sized Options (100% Equal Width & Height, No Truncation) */}
        <div className="w-full max-w-[620px] grid grid-cols-1 sm:grid-cols-3 gap-2.5 p-1.5 rounded-2xl bg-slate-100/90 dark:bg-white/06 border border-slate-200/90 dark:border-white/10">
          {customJobs.map((job, idx) => {
            const isActive = activeJobIndex === idx;
            return (
              <button
                key={job.id}
                type="button"
                onClick={() => setActiveJobIndex(idx)}
                className={`w-full h-11 px-3.5 rounded-xl text-[11.5px] font-bold transition-all duration-200 cursor-pointer flex items-center justify-between gap-1.5 ${
                  isActive
                    ? "bg-[#0032ab] text-white shadow-md shadow-[#0032ab]/25"
                    : "bg-white dark:bg-[#0b132b]/80 text-navy-deep dark:text-white border border-slate-200/70 dark:border-white/10 hover:border-[#0032ab]/40"
                }`}
              >
                <div className="flex items-center gap-1.5 whitespace-nowrap">
                  {isActive && (
                    <span className="h-1.5 w-1.5 rounded-full bg-cyan-300 shrink-0" />
                  )}
                  <span>{job.shortName}</span>
                </div>
                <span
                  className={`text-[8.5px] font-mono px-1.5 py-0.5 rounded uppercase font-bold shrink-0 ${
                    isActive
                      ? "bg-white/20 text-white"
                      : "bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-400"
                  }`}
                >
                  {job.category}
                </span>
              </button>
            );
          })}
        </div>

        {/* Dynamic Detail Breadcrumb Bar */}
        <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-slate-600 dark:text-slate-300 mt-1">
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-[11px] font-bold text-[#0032ab] dark:text-[#4f6ef7]">Channel:</span>
            <span className="font-semibold text-navy-deep dark:text-white">{currentJob.channel}</span>
          </div>
          <span className="text-slate-300 dark:text-white/20">•</span>
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-[11px] font-bold text-[#0032ab] dark:text-[#4f6ef7]">Craft Line:</span>
            <span className="font-semibold text-navy-deep dark:text-white">{currentJob.craftLine}</span>
          </div>
          <span className="text-slate-300 dark:text-white/20">•</span>
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-[11px] font-bold text-emerald-600 dark:text-emerald-400">Tracking:</span>
            <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">{currentJob.trackingCode}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
