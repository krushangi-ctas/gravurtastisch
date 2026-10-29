import React from "react";
import { useTranslation } from "react-i18next";
import { Container } from "./Container";
import { Reveal } from "./Reveal";
import { Sparkles, CheckCircle2, Sliders, ShieldCheck, ArrowRight } from "lucide-react";

/**
 * Bespoke Vector Pre-Flight & Optical Curvature Astrolabe SVG
 * Built with the exact masterwork orbital visual language of Smart Scheduling:
 * Circular celestial reticle, 12 radial ticks, glowing multi-color arcs,
 * animated traveling photon, metallic core chrono instrument, and pulsing milestone blips.
 */
function VectorPreflightAstrolabeSvg() {
  return (
    <div className="relative w-full flex items-center justify-center lg:justify-start select-none overflow-visible">
      <svg
        viewBox="0 0 540 520"
        className="w-full h-auto max-w-[480px] lg:max-w-[530px] drop-shadow-[0_16px_40px_rgba(0,50,171,0.14)]"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Ambient Glow Radials */}
          <radialGradient id="vpf-ambient-cyan" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.28" />
            <stop offset="70%" stopColor="#0032ab" stopOpacity="0.06" />
            <stop offset="100%" stopColor="#0032ab" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="vpf-ambient-blue" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#155dfc" stopOpacity="0.32" />
            <stop offset="60%" stopColor="#0032ab" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#0032ab" stopOpacity="0" />
          </radialGradient>

          {/* Central Chrono Metallic Bezel */}
          <radialGradient id="vpf-chrono-metallic" cx="35%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="45%" stopColor="#EEF5FF" />
            <stop offset="80%" stopColor="#D8E8FE" />
            <stop offset="100%" stopColor="#CBDDF8" />
          </radialGradient>

          {/* Neon Arc Gradients */}
          <linearGradient id="vpf-arc-emerald" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#34d399" />
            <stop offset="50%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>

          <linearGradient id="vpf-arc-golden" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="30%" stopColor="#155dfc" />
            <stop offset="70%" stopColor="#0032ab" />
            <stop offset="100%" stopColor="#6366f1" />
          </linearGradient>

          <linearGradient id="vpf-wing-grad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#0032ab" />
            <stop offset="50%" stopColor="#155dfc" />
            <stop offset="100%" stopColor="#38bdf8" />
          </linearGradient>

          {/* Glow Filters */}
          <filter id="vpf-core-glow" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="8" stdDeviation="16" floodColor="#155dfc" floodOpacity="0.28" />
          </filter>
          <filter id="vpf-blip-glow" x="-40%" y="-40%" width="180%" height="180%">
            <feDropShadow dx="0" dy="2" stdDeviation="6" floodColor="#38bdf8" floodOpacity="0.5" />
          </filter>
        </defs>

        {/* Ambient Backdrop Orbs */}
        <circle cx="270" cy="260" r="210" fill="url(#vpf-ambient-cyan)" pointerEvents="none" />
        <circle cx="270" cy="260" r="160" fill="url(#vpf-ambient-blue)" pointerEvents="none" />

        {/* ==================================================== */}
        {/* 1. OUTER CELESTIAL GUIDES & AZIMUTH TICK RING        */}
        {/* ==================================================== */}
        <g transform="translate(270, 260)">
          {/* Outer Fine Reticle Rings */}
          <circle cx="0" cy="0" r="236" fill="none" stroke="#0032ab" strokeWidth="0.8" strokeOpacity="0.22" strokeDasharray="3 4" />
          <circle cx="0" cy="0" r="218" fill="none" stroke="#155dfc" strokeWidth="1.2" strokeOpacity="0.35" />

          {/* 12 Rotary Hour / Calibration Ticks */}
          {[...Array(12)].map((_, i) => (
            <g key={i} transform={`rotate(${i * 30})`}>
              <line x1="0" y1="-218" x2="0" y2="-208" stroke="#0032ab" strokeWidth="1.8" strokeOpacity="0.65" />
              <line x1="0" y1="-218" x2="0" y2="-213" stroke="#155dfc" strokeWidth="0.8" transform="rotate(15)" strokeOpacity="0.4" />
            </g>
          ))}

          {/* Coordinate Cardinal Markers */}
          <text x="0" y="-222" textAnchor="middle" fill="#0032ab" fontFamily="monospace" fontSize="8.5" fontWeight="800">
            360° / 0° (ROTARY)
          </text>
          <text x="232" y="3" textAnchor="start" fill="#0032ab" fontFamily="monospace" fontSize="8.5" fontWeight="800">
            90° TANGENT
          </text>
          <text x="0" y="232" textAnchor="middle" fill="#0032ab" fontFamily="monospace" fontSize="8.5" fontWeight="800">
            180° CONTOUR
          </text>
          <text x="-232" y="3" textAnchor="end" fill="#0032ab" fontFamily="monospace" fontSize="8.5" fontWeight="800">
            270° DEPTH
          </text>

          {/* Inner Dashed Orbital Track */}
          <circle cx="0" cy="0" r="182" fill="none" stroke="#cbd5e1" strokeWidth="1" strokeDasharray="6 6" />

          {/* ==================================================== */}
          {/* 2. THE MULTI-SECTOR OPTICAL PRE-FLIGHT ARCS          */}
          {/* ==================================================== */}
          {/* Sector A: Intake DPI Normalization (Emerald Arc) */}
          <path
            d="M 0 -182 A 182 182 0 0 1 143 -112"
            fill="none"
            stroke="url(#vpf-arc-emerald)"
            strokeWidth="8.5"
            strokeLinecap="round"
          />

          {/* Sector B: 360° Conical Curvature Mapping (Golden Neon Glow) */}
          <path
            d="M 143 -112 A 182 182 0 1 1 -181 16"
            fill="none"
            stroke="url(#vpf-arc-golden)"
            strokeWidth="11"
            strokeLinecap="round"
            filter="url(#vpf-core-glow)"
          />

          {/* Active Animated Laser Beam Traveling Along Golden Arc */}
          <path
            d="M 143 -112 A 182 182 0 1 1 -181 16"
            fill="none"
            stroke="#ffffff"
            strokeWidth="2.8"
            strokeLinecap="round"
            strokeDasharray="14 18"
          >
            <animate attributeName="stroke-dashoffset" values="0;-64" dur="2.2s" repeatCount="indefinite" />
          </path>

          {/* Traveling Photon */}
          <circle cx="0" cy="0" r="5" fill="#38bdf8" filter="url(#vpf-blip-glow)">
            <animateMotion
              path="M 143 -112 A 182 182 0 1 1 -181 16"
              dur="4s"
              repeatCount="indefinite"
            />
          </circle>

          {/* Sector C: Kerf Limit Hard Cutoff Arc */}
          <path
            d="M -181 16 A 182 182 0 0 1 0 -182"
            fill="none"
            stroke="#155dfc"
            strokeWidth="3.5"
            strokeDasharray="4 4"
            strokeOpacity="0.45"
          />

          {/* ==================================================== */}
          {/* 3. CENTRAL POLISHED CHRONO CORE INSTRUMENT           */}
          {/* ==================================================== */}
          <g filter="url(#vpf-core-glow)">
            {/* Main Dial Outer Bezel */}
            <circle cx="0" cy="0" r="114" fill="url(#vpf-chrono-metallic)" stroke="#155dfc" strokeWidth="2.5" />
            <circle cx="0" cy="0" r="106" fill="none" stroke="#0032ab" strokeWidth="0.8" strokeOpacity="0.3" strokeDasharray="2 3" />

            {/* 24 Radial Calibration Graduations */}
            {[...Array(24)].map((_, i) => (
              <line
                key={i}
                x1="0"
                y1="-106"
                x2="0"
                y2={i % 6 === 0 ? "-96" : "-101"}
                stroke="#0032ab"
                strokeWidth={i % 6 === 0 ? "1.8" : "0.9"}
                strokeOpacity={i % 6 === 0 ? "0.8" : "0.4"}
                transform={`rotate(${i * 15})`}
              />
            ))}

            {/* Center Inner Reticle */}
            <circle cx="0" cy="0" r="76" fill="#ffffff" stroke="#0032ab" strokeWidth="1.2" strokeOpacity="0.3" />
            <circle cx="0" cy="0" r="72" fill="#f0f6ff" stroke="#38bdf8" strokeWidth="1" strokeDasharray="4 3" />

            {/* Targeting Crosshairs */}
            <line x1="-76" y1="0" x2="76" y2="0" stroke="#155dfc" strokeWidth="0.8" strokeOpacity="0.35" />
            <line x1="0" y1="-76" x2="0" y2="76" stroke="#155dfc" strokeWidth="0.8" strokeOpacity="0.35" />

            {/* Laser Targeting Hand */}
            <g transform="rotate(-30)">
              <polygon points="0,-70 5,-16 0,0 -5,-16" fill="#155dfc" />
              <polygon points="0,-70 3,-16 0,0" fill="#38bdf8" />
              <circle cx="0" cy="-60" r="2.5" fill="#38bdf8" />
            </g>

            {/* Polished Center Pin Cap */}
            <circle cx="0" cy="0" r="32" fill="#0032ab" stroke="#ffffff" strokeWidth="2.5" />
            <circle cx="0" cy="0" r="28" fill="url(#vpf-wing-grad)" />

            <text x="0" y="-2" textAnchor="middle" fill="#ffffff" fontFamily="monospace" fontSize="11" fontWeight="900">
              1200 DPI
            </text>
            <text x="0" y="10" textAnchor="middle" fill="#93c5fd" fontFamily="system-ui" fontSize="7" fontWeight="800" letterSpacing="0.8">
              VECTOR PASS
            </text>
          </g>

          {/* ==================================================== */}
          {/* 4. RADIAL MILESTONE ORBITAL BLIPS                    */}
          {/* ==================================================== */}
          {/* Blip 1: Day 0 Vector Intake */}
          <g transform="translate(0, -182)" filter="url(#vpf-blip-glow)">
            <circle cx="0" cy="0" r="16" fill="#ffffff" stroke="#10b981" strokeWidth="2.4" />
            <circle cx="0" cy="0" r="8" fill="#10b981" />
            <circle cx="0" cy="0" r="3" fill="#ffffff" />
            <g transform="translate(0, -24)">
              <text x="0" y="0" textAnchor="middle" fill="#065f46" fontFamily="monospace" fontSize="9" fontWeight="900">
                1200 DPI INTAKE
              </text>
              <text x="0" y="9" textAnchor="middle" fill="#64748b" fontFamily="system-ui" fontSize="7" fontWeight="700">
                Contour Auto-Scan
              </text>
            </g>
          </g>

          {/* Blip 2: 360° Conical Curvature Mapping (Hero Node) */}
          <g transform="translate(143, -112)" filter="url(#vpf-blip-glow)">
            <circle cx="0" cy="0" r="22" fill="#ffffff" stroke="#155dfc" strokeWidth="2.8" />
            <circle cx="0" cy="0" r="13" fill="url(#vpf-wing-grad)" />
            <circle cx="0" cy="0" r="4" fill="#ffffff">
              <animate attributeName="r" values="3;5;3" dur="1.6s" repeatCount="indefinite" />
            </circle>
            {/* Radiating Pulse Wave */}
            <circle cx="0" cy="0" r="28" fill="none" stroke="#38bdf8" strokeWidth="1.2" strokeOpacity="0.6">
              <animate attributeName="r" values="22;34;22" dur="2s" repeatCount="indefinite" />
              <animate attributeName="stroke-opacity" values="0.8;0;0.8" dur="2s" repeatCount="indefinite" />
            </circle>
            {/* Flange Callout */}
            <g transform="translate(32, -6)">
              <text x="0" y="0" fill="#0032ab" fontFamily="monospace" fontSize="10.5" fontWeight="900">
                ★ 360° CONICAL WRAP
              </text>
              <text x="0" y="11" fill="#155dfc" fontFamily="system-ui" fontSize="7.5" fontWeight="800">
                +38% Contour Fit
              </text>
            </g>
          </g>

          {/* Blip 3: Kerf Compensation Pass */}
          <g transform="translate(128, 128)" filter="url(#vpf-blip-glow)">
            <circle cx="0" cy="0" r="15" fill="#ffffff" stroke="#0032ab" strokeWidth="2" />
            <circle cx="0" cy="0" r="7" fill="#0284c7" />
            <circle cx="0" cy="0" r="2.5" fill="#ffffff" />
            <g transform="translate(24, 4)">
              <text x="0" y="0" fill="#0032ab" fontFamily="monospace" fontSize="8.5" fontWeight="900">
                0.08mm KERF PASS
              </text>
              <text x="0" y="9" fill="#64748b" fontFamily="system-ui" fontSize="7" fontWeight="700">
                Intricate Micro-Offsets
              </text>
            </g>
          </g>

          {/* Blip 4: Substrate Contrast Lock */}
          <g transform="translate(-181, 16)" filter="url(#vpf-blip-glow)">
            <circle cx="0" cy="0" r="16" fill="#ffffff" stroke="#6366f1" strokeWidth="2.2" />
            <circle cx="0" cy="0" r="7" fill="#6366f1" />
            <circle cx="0" cy="0" r="2.5" fill="#ffffff" />
            <g transform="translate(-24, 4)" textAnchor="end">
              <text x="0" y="0" fill="#4338ca" fontFamily="monospace" fontSize="8.5" fontWeight="900">
                CONTRAST LOCK 100%
              </text>
              <text x="0" y="9" fill="#64748b" fontFamily="system-ui" fontSize="7" fontWeight="700">
                Legibility Verified
              </text>
            </g>
          </g>

          {/* ==================================================== */}
          {/* 5. POLAR CALLOUT WINGS (ANGLED CALIPERS)             */}
          {/* ==================================================== */}
          {/* Left Wing */}
          <g transform="translate(-230, -145)">
            <path
              d="M 0 0 L 115 -18 L 105 16 L -10 24 Z"
              fill="rgba(0, 50, 171, 0.06)"
              stroke="#155dfc"
              strokeWidth="0.8"
            />
            <text x="48" y="4" textAnchor="middle" fill="#0032ab" fontFamily="monospace" fontSize="7.5" fontWeight="800">
              PRE-FLIGHT PASS
            </text>
          </g>

          {/* Right Wing */}
          <g transform="translate(120, 185)">
            <path
              d="M 0 0 L 115 18 L 125 -14 L 10 -22 Z"
              fill="rgba(0, 50, 171, 0.06)"
              stroke="#155dfc"
              strokeWidth="0.8"
            />
            <text x="65" y="0" textAnchor="middle" fill="#0032ab" fontFamily="monospace" fontSize="7.5" fontWeight="800">
              VECTOR NORMALIZER
            </text>
          </g>
        </g>
      </svg>
    </div>
  );
}

export function VectorPreflightShowcase() {
  const { t } = useTranslation();

  return (
    <section className="relative py-16 lg:py-24 bg-white border-b border-[#0032ab]/10 overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-1/3 -left-32 w-80 h-80 rounded-full bg-brand/5 blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-0 w-80 h-80 rounded-full bg-sky-400/5 blur-3xl pointer-events-none" />

      <Container className="relative">
        <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column: Stunning Vector Pre-Flight Astrolabe SVG (Properly Left-Aligned, No Dead Space) */}
          <div className="lg:col-span-6 xl:col-span-6 flex items-center justify-center lg:justify-start">
            <Reveal delay={60} className="w-full">
              <VectorPreflightAstrolabeSvg />
            </Reveal>
          </div>

          {/* Right Column: High-Density Optical Pre-Flight Content */}
          <div className="lg:col-span-6 xl:col-span-6 flex flex-col justify-center">
            <Reveal delay={120}>
              <div>
                <span className="section-badge mb-3">
                  <Sparkles className="h-3.5 w-3.5 text-brand shrink-0" />
                  <span>{t("vectorPreflight.badge", "STUDIO PRE-FLIGHT INTELLIGENCE")}</span>
                </span>

                <h2 className="mt-3 text-2xl sm:text-3xl lg:text-[2.25rem] font-extrabold tracking-tight text-navy-deep leading-[1.18]">
                  {t("vectorPreflight.heading", "Automated vector inspection before a single laser fires.")}
                </h2>

                <p className="mt-4 text-xs sm:text-sm text-slate-body leading-relaxed">
                  {t(
                    "vectorPreflight.desc",
                    "Avoid wasted inventory from blurry logos, jagged low-res JPEGs, or warped cylinder wraps. Our studio pre-flight engine analyzes vector anchor points, compensates for conical taper, and validates engraving depth in real time."
                  )}
                </p>

                {/* 3 High-Tech Pillars */}
                <div className="mt-6 space-y-3">
                  {/* Pillar 1 */}
                  <div className="group p-3.5 rounded-2xl liquid-glass border border-slate-200/90 hover:border-[#0032ab]/30 transition-all duration-200 shadow-2xs hover:shadow-xs flex items-start gap-3">
                    <div className="h-9 w-9 rounded-xl bg-[#0032ab]/10 text-[#0032ab] grid place-items-center shrink-0 group-hover:scale-105 transition-transform">
                      <CheckCircle2 className="h-4.5 w-4.5 text-[#0032ab]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <strong className="text-xs sm:text-sm font-extrabold text-navy-deep block leading-tight">
                        {t("vectorPreflight.feature1Title", "Contour & Anchor Point Optimization")}
                      </strong>
                      <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5 leading-relaxed">
                        {t("vectorPreflight.feature1Desc", "Eliminates jagged edges and self-intersecting paths with 1200 DPI vector fidelity.")}
                      </p>
                    </div>
                  </div>

                  {/* Pillar 2 */}
                  <div className="group p-3.5 rounded-2xl liquid-glass border border-slate-200/90 hover:border-[#0032ab]/30 transition-all duration-200 shadow-2xs hover:shadow-xs flex items-start gap-3">
                    <div className="h-9 w-9 rounded-xl bg-sky-500/10 text-sky-600 grid place-items-center shrink-0 group-hover:scale-105 transition-transform">
                      <Sliders className="h-4.5 w-4.5 text-sky-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <strong className="text-xs sm:text-sm font-extrabold text-navy-deep block leading-tight">
                        {t("vectorPreflight.feature2Title", "360° Conical Taper Projection")}
                      </strong>
                      <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5 leading-relaxed">
                        {t("vectorPreflight.feature2Desc", "Compensates for tumbler taper angles so logos wrap straight without barrel distortion.")}
                      </p>
                    </div>
                  </div>

                  {/* Pillar 3 */}
                  <div className="group p-3.5 rounded-2xl liquid-glass border border-slate-200/90 hover:border-[#0032ab]/30 transition-all duration-200 shadow-2xs hover:shadow-xs flex items-start gap-3">
                    <div className="h-9 w-9 rounded-xl bg-emerald-500/10 text-emerald-600 grid place-items-center shrink-0 group-hover:scale-105 transition-transform">
                      <ShieldCheck className="h-4.5 w-4.5 text-emerald-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <strong className="text-xs sm:text-sm font-extrabold text-navy-deep block leading-tight">
                        {t("vectorPreflight.feature3Title", "Substrate Etch Contrast Check")}
                      </strong>
                      <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5 leading-relaxed">
                        {t("vectorPreflight.feature3Desc", "Validates optical contrast against stainless steel, slate, and solid wood.")}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Micro Action Button */}
                <div className="mt-6 flex items-center gap-3">
                  <a
                    href="#how"
                    className="inline-flex items-center gap-2 rounded-full btn-glass-primary px-6 py-2.5 text-xs sm:text-sm font-bold !text-white shadow-md shadow-brand/20 hover:-translate-y-0.5 transition-all"
                  >
                    <span>{t("vectorPreflight.cta", "Explore 4-Step Process →")}</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </Container>
    </section>
  );
}
