const fs = require('fs');
const path = require('path');

const outDir = path.resolve(__dirname, '../public/blogs');
const coreDir = path.resolve(__dirname, '../../gravurtastisch_core/public/blogs');

[outDir, coreDir].forEach(d => {
  if (!fs.existsSync(d)) {
    fs.mkdirSync(d, { recursive: true });
  }
});

function escapeXml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&amp;/g, '&') // unescape first to avoid &amp;amp;
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

const blogs = [
  {
    fileName: 'blog-vector-automation.svg',
    slug: 'vector_automation',
    tag: 'PRE-PRESS VECTOR ENGINE',
    titleLine1: 'Automate Amazon Custom',
    titleLine2: 'to Machine Vector (SVG & DXF)',
    subtitle: 'Zero-touch CAD export directly from buyer personalization JSON',
    color1: '#070d1e',
    color2: '#0f2757',
    accent: '#38bdf8',
    glowColor: '#0ea5e9',
    badgeText: 'SVG • PDF • DXF',
    hudTitle: 'VECTOR CURVE ENGINE',
    renderGraphic: (acc) => `
      <!-- Vector curve with nodes -->
      <path d="M 60 240 C 140 80, 220 80, 300 240" fill="none" stroke="${acc}" stroke-width="4" stroke-linecap="round" />
      <circle cx="60" cy="240" r="7" fill="#ffffff" stroke="${acc}" stroke-width="3" />
      <circle cx="180" cy="140" r="7" fill="#ffffff" stroke="${acc}" stroke-width="3" />
      <circle cx="300" cy="240" r="7" fill="#ffffff" stroke="${acc}" stroke-width="3" />
      <!-- Tangent handle handles -->
      <line x1="180" y1="140" x2="140" y2="80" stroke="rgba(255,255,255,0.4)" stroke-width="1.5" stroke-dasharray="3 3" />
      <line x1="180" y1="140" x2="220" y2="80" stroke="rgba(255,255,255,0.4)" stroke-width="1.5" stroke-dasharray="3 3" />
      <circle cx="140" cy="80" r="4" fill="${acc}" />
      <circle cx="220" cy="80" r="4" fill="${acc}" />
      <!-- Laser spot -->
      <circle cx="180" cy="140" r="18" fill="none" stroke="#ef4444" stroke-width="2" />
      <line x1="170" y1="140" x2="190" y2="140" stroke="#ef4444" stroke-width="2" />
      <line x1="180" y1="130" x2="180" y2="150" stroke="#ef4444" stroke-width="2" />
    `
  },
  {
    fileName: 'blog-sp-api-ingestion.svg',
    slug: 'sp_api',
    tag: 'SP-API AUTOMATION PIPELINE',
    titleLine1: 'Connecting Amazon SP-API',
    titleLine2: 'End Manual CSV Copy-Pasting',
    subtitle: 'Direct LWA OAuth 2.0 Webhooks streaming customer inputs in real-time',
    color1: '#031410',
    color2: '#064e3b',
    accent: '#34d399',
    glowColor: '#10b981',
    badgeText: 'Official SP-API OAuth',
    hudTitle: 'LWA LIVE WEBHOOK PULSE',
    renderGraphic: (acc) => `
      <!-- API Node diagram -->
      <rect x="50" y="80" width="100" height="60" rx="10" fill="rgba(255,255,255,0.08)" stroke="${acc}" stroke-width="1.5" />
      <text x="100" y="115" fill="#ffffff" font-family="monospace" font-size="12" text-anchor="middle">AMAZON</text>
      
      <rect x="210" y="80" width="100" height="60" rx="10" fill="rgba(255,255,255,0.08)" stroke="${acc}" stroke-width="1.5" />
      <text x="260" y="115" fill="#ffffff" font-family="monospace" font-size="12" text-anchor="middle">PRINTOMATION</text>

      <path d="M 150 110 L 210 110" stroke="${acc}" stroke-width="3" stroke-dasharray="6 4" />
      <polygon points="208,106 216,110 208,114" fill="${acc}" />

      <!-- Pulse signal line -->
      <path d="M 50 220 L 110 220 L 130 180 L 150 250 L 170 200 L 190 220 L 310 220" fill="none" stroke="${acc}" stroke-width="3" />
      <circle cx="150" cy="250" r="5" fill="#ffffff" />
    `
  },
  {
    fileName: 'blog-safe-zones-rotary.svg',
    slug: 'safe_zones',
    tag: 'PRODUCTION GUARDRAILS',
    titleLine1: 'Pre-Press Safe Zones &amp; Bleeds',
    titleLine2: 'For Tumblers, Wood &amp; Acrylic',
    subtitle: 'Dynamic bounding boxes, curved compensation and rotary margins',
    color1: '#1a1003',
    color2: '#451a03',
    accent: '#fbbf24',
    glowColor: '#f59e0b',
    badgeText: 'Curved Offset Guard',
    hudTitle: 'ROTARY BOUNDING BOX',
    renderGraphic: (acc) => `
      <!-- Tumbler cylinder wireframe -->
      <ellipse cx="180" cy="90" rx="80" ry="25" fill="none" stroke="rgba(255,255,255,0.3)" stroke-width="2" />
      <line x1="100" y1="90" x2="100" y2="230" stroke="rgba(255,255,255,0.3)" stroke-width="2" />
      <line x1="260" y1="90" x2="260" y2="230" stroke="rgba(255,255,255,0.3)" stroke-width="2" />
      <ellipse cx="180" cy="230" rx="80" ry="25" fill="none" stroke="rgba(255,255,255,0.3)" stroke-width="2" stroke-dasharray="4 4" />
      
      <!-- Safe zone rectangle -->
      <rect x="130" y="125" width="100" height="70" rx="6" fill="rgba(251,191,36,0.12)" stroke="${acc}" stroke-width="2" stroke-dasharray="4 3" />
      <text x="180" y="165" fill="${acc}" font-family="monospace" font-size="11" font-weight="700" text-anchor="middle">SAFE BOUNDS</text>
    `
  },
  {
    fileName: 'blog-photo-upload-dpi.svg',
    slug: 'photo_dpi',
    tag: 'HIGH-RES PRE-FLIGHT',
    titleLine1: 'Buyer Photo Uploads',
    titleLine2: 'Automated DPI &amp; Background Prep',
    subtitle: '300+ DPI automatic vectorization and transparent background masking',
    color1: '#0e0b1f',
    color2: '#2e1065',
    accent: '#a78bfa',
    glowColor: '#8b5cf6',
    badgeText: '300+ DPI Auto-Scale',
    hudTitle: 'RASTER PRE-FLIGHT MESH',
    renderGraphic: (acc) => `
      <!-- Photo frame with resolution grid -->
      <rect x="70" y="75" width="220" height="150" rx="12" fill="rgba(255,255,255,0.05)" stroke="${acc}" stroke-width="2" />
      <!-- Mountain and sun graphic -->
      <circle cx="120" cy="120" r="16" fill="${acc}" opacity="0.8" />
      <polygon points="90,195 150,135 190,175 220,150 260,195" fill="rgba(255,255,255,0.2)" stroke="${acc}" stroke-width="1.5" />
      <!-- DPI badge -->
      <rect x="195" y="90" width="80" height="26" rx="6" fill="#10b981" />
      <text x="235" y="107" fill="#ffffff" font-family="system-ui, sans-serif" font-size="11" font-weight="800" text-anchor="middle">300 DPI OK</text>
    `
  },
  {
    fileName: 'blog-zero-misprints.svg',
    slug: 'zero_misprints',
    tag: 'QUALITY ASSURANCE',
    titleLine1: 'Eliminating Misprints',
    titleLine2: 'ASIN Templates Prevent Typing Errors',
    subtitle: 'Zero manual re-keying saves 4% of custom runs from scrap &amp; refunds',
    color1: '#1f0409',
    color2: '#5c081e',
    accent: '#fb7185',
    glowColor: '#e11d48',
    badgeText: '0% Misprint Guarantee',
    hudTitle: 'ASIN TEMPLATE LOCK',
    renderGraphic: (acc) => `
      <!-- Shield icon with checkmark -->
      <path d="M 180 70 L 260 100 L 260 170 Q 260 230 180 260 Q 100 230 100 170 L 100 100 Z" fill="rgba(251,113,133,0.12)" stroke="${acc}" stroke-width="2.5" />
      <!-- Checkmark -->
      <path d="M 145 160 L 170 185 L 220 130" fill="none" stroke="#ffffff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" />
    `
  },
  {
    fileName: 'blog-scaling-q4-batches.svg',
    slug: 'q4_batches',
    tag: 'HIGH-VOLUME FULFILLMENT',
    titleLine1: 'Automated Batch Processing',
    titleLine2: '5,000+ Daily Holiday Orders',
    subtitle: 'Automated nesting, production batch sheets and barcode scan queues',
    color1: '#02181d',
    color2: '#083344',
    accent: '#06b6d4',
    glowColor: '#0891b2',
    badgeText: '5,000+ Orders/Day',
    hudTitle: 'MULTI-JOB GANG NESTING',
    renderGraphic: (acc) => `
      <!-- Nested grid sheet -->
      <rect x="70" y="70" width="220" height="170" rx="10" fill="rgba(255,255,255,0.05)" stroke="${acc}" stroke-width="2" />
      <rect x="85" y="85" width="45" height="40" rx="4" fill="rgba(6,182,212,0.2)" stroke="${acc}" stroke-width="1.2" />
      <rect x="140" y="85" width="45" height="40" rx="4" fill="rgba(6,182,212,0.2)" stroke="${acc}" stroke-width="1.2" />
      <rect x="195" y="85" width="80" height="40" rx="4" fill="rgba(6,182,212,0.2)" stroke="${acc}" stroke-width="1.2" />
      <rect x="85" y="135" width="80" height="40" rx="4" fill="rgba(6,182,212,0.2)" stroke="${acc}" stroke-width="1.2" />
      <rect x="175" y="135" width="100" height="40" rx="4" fill="rgba(6,182,212,0.2)" stroke="${acc}" stroke-width="1.2" />
      <rect x="85" y="185" width="190" height="40" rx="4" fill="rgba(6,182,212,0.2)" stroke="${acc}" stroke-width="1.2" />
    `
  },
  {
    fileName: 'blog-ezcad-laser-export.svg',
    slug: 'ezcad_laser',
    tag: 'DIRECT MACHINE WORKFLOWS',
    titleLine1: 'Direct Machine Exports',
    titleLine2: 'Fiber Lasers, UV &amp; EZCad',
    subtitle: 'Hatch spacing, stroke calibrations and multi-layer vector exports',
    color1: '#0f1702',
    color2: '#1a2e05',
    accent: '#a3e635',
    glowColor: '#65a30d',
    badgeText: 'LightBurn &amp; EZCad Ready',
    hudTitle: 'LAYER PEN HATCH MATRIX',
    renderGraphic: (acc) => `
      <!-- Multi-layer stack -->
      <polygon points="180,70 280,110 180,150 80,110" fill="rgba(163,230,53,0.2)" stroke="#ef4444" stroke-width="2" />
      <polygon points="180,110 280,150 180,190 80,150" fill="rgba(163,230,53,0.3)" stroke="#3b82f6" stroke-width="2" />
      <polygon points="180,150 280,190 180,230 80,190" fill="rgba(163,230,53,0.4)" stroke="${acc}" stroke-width="2" />
      <!-- Legend markers -->
      <circle cx="295" cy="110" r="4" fill="#ef4444" />
      <circle cx="295" cy="150" r="4" fill="#3b82f6" />
      <circle cx="295" cy="190" r="4" fill="${acc}" />
    `
  },
  {
    fileName: 'blog-font-glyph-engine.svg',
    slug: 'font_glyphs',
    tag: 'TYPOGRAPHY &amp; GLYPHS',
    titleLine1: 'Font Matching &amp; Special Chars',
    titleLine2: 'Preventing Missing Glyphs in Jewelry',
    subtitle: 'Automatic Unicode, umlaut and emoji conversion to clean curves',
    color1: '#24061a',
    color2: '#701a75',
    accent: '#f472b6',
    glowColor: '#d946ef',
    badgeText: 'Unicode &amp; Emoji Outlines',
    hudTitle: 'COMPOUND PATH GLYPHS',
    renderGraphic: (acc) => `
      <!-- Large styled letter "A" with vector nodes -->
      <text x="180" y="200" fill="none" stroke="${acc}" stroke-width="4" font-family="serif" font-size="140" font-weight="900" text-anchor="middle">A</text>
      <circle cx="180" cy="85" r="5" fill="#ffffff" stroke="${acc}" stroke-width="2" />
      <circle cx="130" cy="190" r="5" fill="#ffffff" stroke="${acc}" stroke-width="2" />
      <circle cx="230" cy="190" r="5" fill="#ffffff" stroke="${acc}" stroke-width="2" />
      <circle cx="155" cy="160" r="4" fill="#ffffff" stroke="${acc}" stroke-width="2" />
      <circle cx="205" cy="160" r="4" fill="#ffffff" stroke="${acc}" stroke-width="2" />
    `
  },
  {
    fileName: 'blog-multi-marketplace-sync.svg',
    slug: 'marketplace_sync',
    tag: 'GLOBAL COMMERCE HUB',
    titleLine1: 'Scaling Cross-Border',
    titleLine2: 'Amazon DE, UK, FR, IT, ES &amp; US',
    subtitle: 'Unify international buyer inputs into single unified production queues',
    color1: '#1c0d02',
    color2: '#7c2d12',
    accent: '#fb923c',
    glowColor: '#ea580c',
    badgeText: '6 Marketplaces Unified',
    hudTitle: 'CROSS-BORDER DATA BRIDGE',
    renderGraphic: (acc) => `
      <!-- Globe wireframe -->
      <circle cx="180" cy="160" r="75" fill="none" stroke="${acc}" stroke-width="2" />
      <ellipse cx="180" cy="160" rx="75" ry="30" fill="none" stroke="rgba(255,255,255,0.3)" stroke-width="1.5" />
      <line x1="180" y1="85" x2="180" y2="235" stroke="rgba(255,255,255,0.3)" stroke-width="1.5" />
      <line x1="105" y1="160" x2="255" y2="160" stroke="rgba(255,255,255,0.3)" stroke-width="1.5" />
      
      <!-- Marketplace flags / nodes -->
      <circle cx="130" cy="130" r="6" fill="#facc15" />
      <circle cx="180" cy="120" r="6" fill="#38bdf8" />
      <circle cx="220" cy="150" r="6" fill="#4ade80" />
      <circle cx="150" cy="190" r="6" fill="#f87171" />
    `
  },
  {
    fileName: 'blog-10s-pipeline-study.svg',
    slug: 'study_10s',
    tag: 'EFFICIENCY CASE STUDY',
    titleLine1: 'From Order Intake to Machine File',
    titleLine2: 'In Under 10 Seconds: A Case Study',
    subtitle: 'How a German laser studio slashed pre-press time from 11 mins to 0',
    color1: '#07153a',
    color2: '#1e40af',
    accent: '#60a5fa',
    glowColor: '#3b82f6',
    badgeText: 'SLA: Under 10 Seconds',
    hudTitle: 'REAL-TIME SLA PIPELINE',
    renderGraphic: (acc) => `
      <!-- Stopwatch dial -->
      <circle cx="180" cy="165" r="75" fill="rgba(255,255,255,0.05)" stroke="${acc}" stroke-width="3" />
      <circle cx="180" cy="165" r="60" fill="none" stroke="rgba(255,255,255,0.15)" stroke-width="1.5" stroke-dasharray="6 4" />
      <!-- Stopwatch top button -->
      <rect x="172" y="75" width="16" height="15" rx="3" fill="${acc}" />
      <!-- Dial hand pointing to 10s mark -->
      <line x1="180" y1="165" x2="215" y2="120" stroke="#ef4444" stroke-width="3" stroke-linecap="round" />
      <circle cx="180" cy="165" r="6" fill="#ffffff" />
      <!-- Big text -->
      <text x="180" y="210" fill="${acc}" font-family="system-ui, sans-serif" font-size="18" font-weight="900" text-anchor="middle">&lt; 10 SEC</text>
    `
  }
];

function buildSvg(b) {
  const bgId = `bgGrad_${b.slug}`;
  const gridId = `grid_${b.slug}`;
  const glowId = `glow_${b.slug}`;

  const tag = escapeXml(b.tag);
  const titleLine1 = escapeXml(b.titleLine1);
  const titleLine2 = escapeXml(b.titleLine2);
  const subtitle = escapeXml(b.subtitle);
  const badgeText = escapeXml(b.badgeText);
  const hudTitle = escapeXml(b.hudTitle);

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 675" width="1200" height="675">
  <defs>
    <linearGradient id="${bgId}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${b.color1}" />
      <stop offset="100%" stop-color="${b.color2}" />
    </linearGradient>
    <pattern id="${gridId}" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="1" />
    </pattern>
    <filter id="${glowId}" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="35" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>

  <!-- Solid Gradient Background -->
  <rect width="1200" height="675" fill="url(#${bgId})" />
  <rect width="1200" height="675" fill="url(#${gridId})" />

  <!-- Ambient Glowing Orbs -->
  <circle cx="220" cy="160" r="240" fill="${b.glowColor}" opacity="0.14" filter="url(#${glowId})" />
  <circle cx="1000" cy="480" r="280" fill="${b.glowColor}" opacity="0.12" filter="url(#${glowId})" />

  <!-- Outer Glass Frame -->
  <rect x="50" y="45" width="1100" height="585" rx="24" fill="rgba(255, 255, 255, 0.03)" stroke="rgba(255, 255, 255, 0.12)" stroke-width="1.5" />

  <!-- Window Header Bar -->
  <g transform="translate(85, 75)">
    <circle cx="12" cy="12" r="6" fill="#ef4444" opacity="0.85" />
    <circle cx="32" cy="12" r="6" fill="#f59e0b" opacity="0.85" />
    <circle cx="52" cy="12" r="6" fill="#10b981" opacity="0.85" />
    <text x="75" y="17" fill="rgba(255,255,255,0.45)" font-family="monospace" font-size="12" font-weight="600">PRINTOMATION // CAD &amp; SP-API PIPELINE // ${b.slug.toUpperCase()}</text>
  </g>

  <!-- Tag Pill -->
  <g transform="translate(85, 125)">
    <rect width="260" height="36" rx="18" fill="rgba(255,255,255,0.08)" stroke="${b.accent}" stroke-width="1.5" />
    <circle cx="20" cy="18" r="4.5" fill="${b.accent}" />
    <text x="36" y="23" fill="${b.accent}" font-family="system-ui, -apple-system, sans-serif" font-size="12" font-weight="800" letter-spacing="1">${tag}</text>
  </g>

  <!-- Main Title -->
  <g transform="translate(85, 225)">
    <text x="0" y="0" fill="#ffffff" font-family="system-ui, -apple-system, sans-serif" font-size="38" font-weight="800" letter-spacing="-0.5">
      <tspan x="0" dy="0">${titleLine1}</tspan>
      <tspan x="0" dy="50" fill="${b.accent}">${titleLine2}</tspan>
    </text>
  </g>

  <!-- Subtitle -->
  <g transform="translate(85, 360)">
    <text x="0" y="0" fill="rgba(255,255,255,0.78)" font-family="system-ui, -apple-system, sans-serif" font-size="20" font-weight="400">
      ${subtitle}
    </text>
  </g>

  <!-- Badges in Footer of Banner -->
  <g transform="translate(85, 475)">
    <rect x="0" y="0" width="180" height="44" rx="10" fill="rgba(255,255,255,0.07)" stroke="rgba(255,255,255,0.18)" />
    <text x="90" y="27" fill="#f1f5f9" font-family="monospace" font-size="13" font-weight="700" text-anchor="middle">${badgeText}</text>

    <rect x="195" y="0" width="190" height="44" rx="10" fill="rgba(255,255,255,0.07)" stroke="rgba(255,255,255,0.18)" />
    <text x="290" y="27" fill="#f1f5f9" font-family="monospace" font-size="13" font-weight="700" text-anchor="middle">Official SP-API</text>

    <rect x="400" y="0" width="180" height="44" rx="10" fill="rgba(255,255,255,0.07)" stroke="rgba(255,255,255,0.18)" />
    <text x="490" y="27" fill="#f1f5f9" font-family="monospace" font-size="13" font-weight="700" text-anchor="middle">&lt; 10s Automated</text>
  </g>

  <!-- Right Side Interactive Graphic / Machine HUD -->
  <g transform="translate(730, 140)">
    <!-- Tech HUD Container -->
    <rect width="370" height="370" rx="20" fill="rgba(3, 7, 18, 0.85)" stroke="${b.accent}" stroke-width="1.5" />
    
    <!-- Coordinate Target Circle -->
    <circle cx="185" cy="170" r="130" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="1" />
    <circle cx="185" cy="170" r="90" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="1" stroke-dasharray="4 4" />
    <circle cx="185" cy="170" r="50" fill="none" stroke="${b.accent}" stroke-width="1.5" opacity="0.35" />

    <!-- Specific Visual Elements per Topic -->
    ${b.renderGraphic(b.accent)}

    <!-- Bottom HUD Spec Pill -->
    <rect x="25" y="305" width="320" height="40" rx="10" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.15)" />
    <text x="185" y="330" fill="#ffffff" font-family="monospace" font-size="12" font-weight="700" text-anchor="middle">${hudTitle}</text>
  </g>
</svg>`;
}

blogs.forEach(b => {
  const svgContent = buildSvg(b);
  fs.writeFileSync(path.join(outDir, b.fileName), svgContent, 'utf8');
  fs.writeFileSync(path.join(coreDir, b.fileName), svgContent, 'utf8');
  console.log(`Generated and validated: ${b.fileName}`);
});

console.log('All 10 SVGs successfully generated and synced.');
