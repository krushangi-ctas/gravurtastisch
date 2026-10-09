import {
  Star,
  Sparkles,
  Send,
  Clock,
  MailOpen,
  TrendingUp,
  Package,
  LayoutDashboard,
  Inbox,
  Settings,
  Bell,
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
      className="relative overflow-hidden pt-28 pb-12 lg:pt-32 lg:pb-16 bg-gradient-to-b from-navy-deep via-navy to-navy-soft text-white"
    >
      <div className="absolute inset-0 grid-bg opacity-30" aria-hidden />
      <div className="absolute inset-0 noise-bg" aria-hidden />
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        {Array.from({ length: 14 }).map((_, i) => (
          <Star
            key={i}
            className="absolute text-brand/40 twinkle"
            style={{
              top: `${(i * 53) % 88 + 6}%`,
              left: `${(i * 37) % 94 + 3}%`,
              width: 7 + (i % 3) * 3,
              height: 7 + (i % 3) * 3,
              animationDelay: `${(i % 5) * 0.35}s`,
            }}
            fill="currentColor"
            strokeWidth={0}
          />
        ))}
      </div>

      <Container className="relative grid lg:grid-cols-12 gap-8 items-center">
        <div className="lg:col-span-6 xl:col-span-7 rise">
          <h1 className="font-extrabold tracking-tight text-4xl sm:text-5xl lg:text-[3.75rem] xl:text-[4.5rem] leading-[1.08]">
            {t('hero.headline')}{" "}
            <span className="relative inline-block">
              <span className="bg-gradient-to-r from-brand-bright to-white bg-clip-text text-transparent">
                {t('hero.headlineHighlight')}
              </span>
              <svg
                className="absolute -bottom-2 left-0 w-full"
                viewBox="0 0 300 12"
                fill="none"
                aria-hidden
              >
                <path
                  d="M2 8 C 80 2, 160 12, 298 4"
                  stroke="#E89B5C"
                  strokeWidth="3"
                  strokeLinecap="round"
                  className="draw-line"
                />
              </svg>
            </span>
          </h1>
          <p className="mt-8 max-w-xl text-base sm:text-lg text-white/70 leading-[1.7]">
            {t('hero.description')}
          </p>

          <div className="mt-10 flex flex-wrap gap-4">
            <a
              href="#register"
              className="inline-flex items-center gap-2 rounded-full bg-brand px-8 py-3.5 text-sm font-semibold text-white shadow-[0_18px_40px_-12px_rgba(97,62,163,0.65)] hover:bg-brand-bright hover:-translate-y-0.5 hover:shadow-[0_22px_48px_-12px_rgba(97,62,163,0.8)] transition-all duration-300"
            >
              {t('hero.ctaRegister')} →
            </a>
            <a
              href="#how"
              className="inline-flex items-center gap-2 rounded-full border border-white/25 px-8 py-3.5 text-sm font-semibold text-white hover:bg-white/10 hover:border-[#E89B5C]/50 transition-all duration-300"
            >
              {t('hero.ctaPricing')}
            </a>
          </div>

          <dl className="mt-9 grid grid-cols-3 gap-3 max-w-md">
            {[
              { k: "48h", v: t('hero.statSendWindow') },
              { k: "3D", v: t('hero.statReviewLift') },
              { k: "EU+", v: t('hero.statUptime') },
            ].map((s) => (
              <div key={s.k} className="rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-3 backdrop-blur-sm">
                <dt className="text-xl font-extrabold text-white tracking-tight">{s.k}</dt>
                <dd className="text-[10px] text-white/55 mt-1 uppercase tracking-wider leading-snug">{s.v}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-8 pt-6 border-t border-white/10 flex flex-wrap items-center gap-3 text-xs text-white/70">
            <div className="flex items-center gap-1.5 font-semibold text-white">
              <span className="h-2 w-2 rounded-full bg-[#E89B5C] animate-pulse" />
              <span>{t('hero.spApiVerified')}</span>
            </div>
            <span className="text-white/30">•</span>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-white/60">{t('hero.stores')}</span>
              <FlagDE className="w-3.5 h-2.5" />
              <FlagFR className="w-3.5 h-2.5" />
              <FlagGB className="w-3.5 h-2.5" />
              <FlagIT className="w-3.5 h-2.5" />
              <FlagES className="w-3.5 h-2.5" />
              <span className="text-[10px] font-mono text-[#E89B5C] font-bold">+EU</span>
            </div>
          </div>
        </div>

        <div className="lg:col-span-6 xl:col-span-5 rise" style={{ animationDelay: "0.15s" }}>
          <HeroMock />
        </div>
      </Container>
    </section>
  );
}

function HeroMock() {
  const { t } = useTranslation();
  const orders = [
    {
      id: "GT-24018",
      product: "Photo Mug Duo",
      sku: "CUP-WRAP-11",
      channel: "Studio • DE",
      key: "sent",
      Icon: Send,
      tone: "bg-brand/10 text-brand",
      av: "from-[#855FBF] to-[#613EA3]",
    },
    {
      id: "GT-24017",
      product: "Engraved Oak Board",
      sku: "KIT-BOARD-02",
      channel: "Laser • EU",
      key: "queued",
      Icon: Clock,
      tone: "bg-amber-500/10 text-amber-700",
      av: "from-[#E89B5C] to-[#C47432]",
    },
    {
      id: "GT-24016",
      product: "Acrylic Night Lamp",
      sku: "LIFE-LED-07",
      channel: "Proof OK",
      key: "reviewed",
      Icon: Sparkles,
      tone: "bg-emerald-500/10 text-emerald-600",
      av: "from-emerald-400 to-teal-600",
    },
  ];

  const statusLabels: Record<string, string> = {
    sent: t('hero.mockStatusSent'),
    queued: t('hero.mockStatusQueued'),
    reviewed: t('hero.mockStatusReviewed'),
  };

  return (
    <div className="relative float-y">
      <div
        className="absolute -inset-12 bg-gradient-to-br from-brand/50 via-brand/20 to-transparent blur-3xl animate-pulse"
        style={{ animationDuration: '4s' }}
        aria-hidden
      />

      {/* ReviewSnapp-style orbital rings — Gravurtastisch purple/amber */}
      <svg
        className="absolute -right-12 -top-12 w-64 h-64 opacity-60 pointer-events-none select-none overflow-visible"
        viewBox="0 0 200 200"
        aria-hidden
      >
        <defs>
          <linearGradient id="orbGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#E89B5C" stopOpacity="0.9" />
            <stop offset="50%" stopColor="#855FBF" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#613EA3" stopOpacity="0" />
          </linearGradient>
          <filter id="orbGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        <g>
          <circle
            cx="100"
            cy="100"
            r="86"
            fill="none"
            stroke="url(#orbGrad1)"
            strokeWidth="1.5"
            strokeDasharray="8 6"
          >
            <animate attributeName="stroke-dashoffset" values="0;-100" dur="8s" repeatCount="indefinite" />
          </circle>
          <circle cx="100" cy="14" r="4" fill="#E89B5C" filter="url(#orbGlow)">
            <animateTransform
              attributeName="transform"
              type="rotate"
              from="0 100 100"
              to="360 100 100"
              dur="10s"
              repeatCount="indefinite"
            />
          </circle>
        </g>

        <g>
          <circle
            cx="100"
            cy="100"
            r="62"
            fill="none"
            stroke="#855FBF"
            strokeWidth="1.2"
            strokeDasharray="5 5"
            opacity="0.65"
          >
            <animate attributeName="stroke-dashoffset" values="0;80" dur="6s" repeatCount="indefinite" />
          </circle>
          <circle cx="100" cy="38" r="3" fill="#C4B5FD" filter="url(#orbGlow)">
            <animateTransform
              attributeName="transform"
              type="rotate"
              from="360 100 100"
              to="0 100 100"
              dur="7s"
              repeatCount="indefinite"
            />
          </circle>
        </g>

        <circle cx="100" cy="100" r="38" fill="rgba(97,62,163,0.18)">
          <animate attributeName="r" values="32;42;32" dur="3s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.2;0.5;0.2" dur="3s" repeatCount="indefinite" />
        </circle>
        <circle cx="100" cy="100" r="22" fill="#613EA3" opacity="0.25" filter="url(#orbGlow)">
          <animate attributeName="r" values="18;26;18" dur="2s" repeatCount="indefinite" />
        </circle>
      </svg>

      <div className="relative rounded-[1.5rem] bg-slate-50 text-navy-deep shadow-[0_40px_90px_-20px_rgba(0,0,0,0.5)] ring-1 ring-white/30 overflow-hidden transition-all duration-300 hover:shadow-[0_45px_100px_-20px_rgba(0,0,0,0.65)]">
        {/* App chrome */}
        <div className="flex items-center justify-between px-4 sm:px-5 py-3 bg-white border-b border-border/80">
          <div className="flex items-center gap-3">
            <div className="flex gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-rose-500 transition-transform hover:scale-125" />
              <span className="h-2.5 w-2.5 rounded-full bg-amber-400 transition-transform hover:scale-125" />
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 transition-transform hover:scale-125" />
            </div>
            <div className="hidden sm:flex items-center gap-1.5 rounded-md bg-surface-alt px-2.5 py-1 text-[10px] font-mono text-slate-body">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {t('hero.mockUrl')}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="grid place-items-center h-7 w-7 rounded-lg bg-surface-alt text-slate-body transition-colors hover:text-brand">
              <Bell className="h-3.5 w-3.5" />
            </span>
            <span className="grid place-items-center h-7 w-7 rounded-full bg-gradient-to-br from-navy-deep to-brand text-[10px] font-bold text-white shadow-xs">
              G
            </span>
          </div>
        </div>

        <div className="flex">
          {/* Mini sidebar */}
          <aside className="hidden sm:flex w-14 shrink-0 flex-col items-center gap-3 py-4 border-r border-border/80 bg-white">
            {[
              { Icon: LayoutDashboard, active: true },
              { Icon: Inbox, active: false },
              { Icon: Package, active: false },
              { Icon: Settings, active: false },
            ].map(({ Icon, active }, i) => (
              <span
                key={i}
                className={`grid place-items-center h-9 w-9 rounded-xl transition-all duration-200 cursor-pointer ${
                  active
                    ? "bg-brand text-white shadow-md shadow-brand/30 scale-105"
                    : "text-slate-body/70 bg-transparent hover:bg-slate-100 hover:text-navy-deep"
                }`}
              >
                <Icon className="h-4 w-4" strokeWidth={1.75} />
              </span>
            ))}
          </aside>

          <div className="flex-1 min-w-0 p-4 sm:p-5">
            {/* Header row */}
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] uppercase tracking-[0.18em] text-slate-body font-semibold">
                  {t('hero.mockReviewPipeline')}
                </p>
                <p className="text-base sm:text-lg font-bold mt-0.5">{t('hero.mockTodayOrders')}</p>
              </div>
              <div className="flex items-center gap-1.5 rounded-full bg-brand/10 px-2.5 py-1 text-[11px] font-semibold text-brand shadow-2xs">
                <span className="h-1.5 w-1.5 rounded-full bg-brand animate-ping" />
                {t('hero.mockLive')}
              </div>
            </div>

            {/* KPI strip */}
            <div className="mt-4 grid grid-cols-3 gap-2 sm:gap-2.5">
              {[
                { key: "sent", value: "842", delta: "+12%", Icon: Send, tint: "from-brand/15 to-brand/5 text-brand" },
                { key: "opened", value: "618", delta: "+8%", Icon: MailOpen, tint: "from-amber-500/15 to-amber-500/5 text-amber-600" },
                { key: "reviews", value: "312", delta: "+18%", Icon: Star, tint: "from-emerald-500/15 to-emerald-500/5 text-emerald-600" },
              ].map((k) => (
                <div
                  key={k.key}
                  className="rounded-xl bg-white border border-border/70 p-2.5 sm:p-3 shadow-sm hover:border-brand/40 hover:-translate-y-0.5 transition-all duration-200"
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`grid place-items-center h-7 w-7 rounded-lg bg-gradient-to-br ${k.tint}`}
                    >
                      <k.Icon className="h-3.5 w-3.5" strokeWidth={2} />
                    </span>
                    <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-emerald-600">
                      <TrendingUp className="h-3 w-3 animate-pulse" />
                      {k.delta}
                    </span>
                  </div>
                  <p className="mt-2 text-lg sm:text-xl font-extrabold tracking-tight leading-none">
                    {k.value}
                  </p>
                  <p className="mt-1 text-[10px] text-slate-body font-medium">
                    {k.key === 'sent' ? t('hero.mockSent') : k.key === 'opened' ? t('hero.mockOpened') : t('hero.mockReviews')}
                  </p>
                </div>
              ))}
            </div>

            {/* Chart + rating ring */}
            <div className="mt-3 grid grid-cols-12 gap-2.5">
              <div className="col-span-8 rounded-xl bg-white border border-border/70 p-3 shadow-sm hover:border-brand/30 transition-colors">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[10px] font-semibold text-slate-body uppercase tracking-wider">
                    {t('hero.mockChartLabel')}
                  </p>
                  <span className="text-[10px] font-semibold text-brand flex items-center gap-0.5">
                    <span>↑ 24%</span>
                  </span>
                </div>
                <PipelineChart />
              </div>

              <div className="col-span-4 rounded-xl bg-white border border-border/70 p-3 shadow-sm flex flex-col items-center justify-center hover:border-amber-300/60 transition-colors">
                <RatingRing />
                <p className="mt-1.5 text-[10px] font-semibold text-slate-body text-center leading-tight">
                  {t('hero.mockAvgRating')}
                </p>
              </div>
            </div>

            {/* Activity feed */}
            <div className="mt-3 rounded-xl bg-white border border-border/70 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-3 py-2 border-b border-border/60 bg-slate-50/50">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-body">
                  {t('hero.mockRecentActivity')}
                </p>
                <span className="text-[10px] font-medium text-brand hover:underline cursor-pointer">{t('hero.mockViewAll')}</span>
              </div>
              <ul className="divide-y divide-border/60">
                {orders.map((o) => (
                  <li
                    key={o.id}
                    className="flex items-center gap-2.5 px-3 py-2.5 transition-colors hover:bg-surface-alt/80"
                  >
                    <span
                      className={`grid place-items-center h-9 w-9 shrink-0 rounded-xl bg-gradient-to-br ${o.av} text-white shadow-sm transition-transform hover:scale-105`}
                    >
                      <Package className="h-3.5 w-3.5" strokeWidth={2} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="text-xs font-semibold text-navy-deep truncate">{o.product}</p>
                        <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-bold bg-[#613EA3]/12 text-[#613EA3] border border-[#613EA3]/25 font-mono">
                          {o.channel}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-body">
                        <span className="font-mono text-brand font-semibold">{o.sku}</span>
                        <span>•</span>
                        <span className="font-mono text-slate-400">{o.id}</span>
                      </div>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-semibold shrink-0 ${o.tone}`}
                    >
                      <o.Icon className="h-3 w-3" strokeWidth={2.25} />
                      {statusLabels[o.key]}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PipelineChart() {
  // Smooth area + line over 7 days
  const points = [28, 42, 36, 58, 52, 74, 68, 88];
  const w = 220;
  const h = 72;
  const max = 100;
  const step = w / (points.length - 1);
  const coords = points.map((p, i) => [i * step, h - (p / max) * h] as const);
  const line = coords.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`).join(" ");
  const area = `${line} L${w},${h} L0,${h} Z`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-[72px] overflow-visible" aria-hidden>
      <defs>
        <linearGradient id="heroArea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#E89B5C" stopOpacity="0.5" />
          <stop offset="60%" stopColor="#613EA3" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#613EA3" stopOpacity="0.01" />
        </linearGradient>
        <linearGradient id="heroLine" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#E89B5C" />
          <stop offset="50%" stopColor="#613EA3" />
          <stop offset="100%" stopColor="#613EA3" />
        </linearGradient>
        <filter id="heroChartGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Grid lines */}
      {[0.25, 0.5, 0.75].map((t) => (
        <line
          key={t}
          x1="0"
          y1={h * t}
          x2={w}
          y2={h * t}
          stroke="#E2E8F0"
          strokeWidth="1"
          strokeDasharray="3 3"
        />
      ))}

      {/* Area Gradient with smooth breathing pulse */}
      <path d={area} fill="url(#heroArea)">
        <animate attributeName="opacity" values="0.7;1;0.7" dur="3s" repeatCount="indefinite" />
      </path>

      {/* Glowing under-line */}
      <path
        d={line}
        fill="none"
        stroke="#E89B5C"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.3"
        filter="url(#heroChartGlow)"
      >
        <animate attributeName="opacity" values="0.2;0.5;0.2" dur="2s" repeatCount="indefinite" />
      </path>

      {/* Base Solid Chart Line */}
      <path
        d={line}
        fill="none"
        stroke="url(#heroLine)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Continuous Dash-Flow Wave on Line */}
      <path
        d={line}
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray="8 12"
        opacity="0.85"
      >
        <animate attributeName="stroke-dashoffset" values="0;-40" dur="1.8s" repeatCount="indefinite" />
      </path>

      {/* Flowing Pulse Particle moving along the line */}
      <g>
        <circle r="4" fill="#E89B5C" opacity="0.6" filter="url(#heroChartGlow)">
          <animateMotion path={line} dur="3s" repeatCount="indefinite" />
          <animate attributeName="r" values="3;6;3" dur="1.5s" repeatCount="indefinite" />
        </circle>
        <circle r="2.5" fill="#FFFFFF">
          <animateMotion path={line} dur="3s" repeatCount="indefinite" />
        </circle>
      </g>

      {/* Data point nodes with animations */}
      {coords.map(([x, y], i) => (
        <g key={i}>
          {i === coords.length - 1 ? (
            <>
              {/* Pulsing radar wave around the active latest node */}
              <circle cx={x} cy={y} r="8" fill="#E89B5C" opacity="0.4">
                <animate attributeName="r" values="4;12;4" dur="1.6s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.7;0;0.7" dur="1.6s" repeatCount="indefinite" />
              </circle>
              <circle
                cx={x}
                cy={y}
                r="4.5"
                fill="#613EA3"
                stroke="#FFFFFF"
                strokeWidth="2"
              >
                <animate attributeName="r" values="4;5.5;4" dur="1.6s" repeatCount="indefinite" />
              </circle>
            </>
          ) : (
            <circle
              cx={x}
              cy={y}
              r="2.5"
              fill="#FFFFFF"
              stroke="#613EA3"
              strokeWidth="2"
            >
              <animate
                attributeName="r"
                values="2;3.2;2"
                dur="2.4s"
                begin={`${i * 0.3}s`}
                repeatCount="indefinite"
              />
            </circle>
          )}
        </g>
      ))}
    </svg>
  );
}

function RatingRing() {
  const r = 28;
  const c = 2 * Math.PI * r;
  const pct = 0.98; // 4.9 / 5

  return (
    <div className="relative">
      <svg width="72" height="72" viewBox="0 0 72 72" aria-hidden className="overflow-visible">
        <defs>
          <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#613EA3" />
            <stop offset="50%" stopColor="#E89B5C" />
            <stop offset="100%" stopColor="#F59E0B" />
          </linearGradient>
          <filter id="ringGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Background Track */}
        <circle cx="36" cy="36" r={r} fill="none" stroke="#E2E8F0" strokeWidth="6" />

        {/* Outer Glow Ring */}
        <circle
          cx="36"
          cy="36"
          r={r}
          fill="none"
          stroke="url(#ringGrad)"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={`${c * pct} ${c}`}
          transform="rotate(-90 36 36)"
          opacity="0.4"
          filter="url(#ringGlow)"
        >
          <animate attributeName="opacity" values="0.3;0.7;0.3" dur="2.5s" repeatCount="indefinite" />
        </circle>

        {/* Animated Progress Arc */}
        <circle
          cx="36"
          cy="36"
          r={r}
          fill="none"
          stroke="url(#ringGrad)"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={`${c * pct} ${c}`}
          transform="rotate(-90 36 36)"
        >
          <animate
            attributeName="stroke-dashoffset"
            values="0;-16;0"
            dur="4s"
            repeatCount="indefinite"
          />
        </circle>
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <div className="text-center">
          <p className="text-sm font-extrabold text-navy-deep leading-none">4.9</p>
          <div className="flex justify-center mt-0.5 gap-px">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className="h-2 w-2 text-amber-500 transition-transform"
                style={{
                  animation: `twinkle 2s ease-in-out infinite`,
                  animationDelay: `${i * 0.2}s`,
                }}
                fill="currentColor"
                strokeWidth={0}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

