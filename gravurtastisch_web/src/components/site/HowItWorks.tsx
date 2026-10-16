import { Container } from "./Container";
import { Reveal } from "./Reveal";
import { useTranslation } from "react-i18next";

export function HowItWorks() {
  const { t } = useTranslation();

  const steps = [
    { key: "step1" },
    { key: "step2" },
    { key: "step3" },
    { key: "step4" },
  ];

  return (
    <section id="how" className="relative py-16 lg:py-24 bg-[#f8f9fc] text-foreground border-b border-border/60 overflow-hidden">
      <div className="hero-orb blue w-96 h-96 -top-20 -left-20 opacity-30" />
      <div className="hero-orb cyan w-80 h-80 -bottom-20 -right-20 opacity-25" />

      <Container className="relative">
        <Reveal>
          <div className="max-w-3xl">
            <span className="section-badge mb-3">
              {t('howItWorks.sectionLabel')}
            </span>
            <h2 className="mt-4 text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-foreground leading-tight">
              {t('howItWorks.heading')}
            </h2>
            <p className="mt-4 text-slate-body text-base sm:text-lg leading-relaxed max-w-2xl">
              {t('howItWorks.description')}
            </p>
          </div>
        </Reveal>

        <Reveal delay={100}>
          <div className="mt-10 rounded-2xl lg:rounded-3xl liquid-glass-strong border border-border p-6 sm:p-8 lg:p-10 shadow-xl">
            <GanttChart />
          </div>
        </Reveal>

        <ol className="mt-10 grid sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          {steps.map((s, i) => (
            <Reveal key={s.key} delay={i * 70}>
              <li className="liquid-glass rounded-2xl p-6 border border-border hover:border-brand/40 transition-all duration-300 hover:-translate-y-1 h-full flex flex-col justify-between bg-white/90">
                <div>
                  <span className="font-mono text-xs text-brand font-bold tracking-wider">
                    {t('howItWorks.stepLabel')} {String(i + 1).padStart(2, "0")}
                  </span>
                  <h3 className="mt-3 text-lg font-bold leading-snug text-foreground">{t(`howItWorks.${s.key}Title`)}</h3>
                  <p className="mt-3 text-sm text-slate-body leading-[1.7]">{t(`howItWorks.${s.key}Desc`)}</p>
                </div>
              </li>
            </Reveal>
          ))}
        </ol>
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
    t('howItWorks.ganttPhaseOrder'),
    t('howItWorks.ganttPhaseDelivered'),
    t('howItWorks.ganttPhaseSent'),
    t('howItWorks.ganttPhaseBuyer'),
  ];

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-8">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand">
            {t('howItWorks.ganttTitle')}
          </p>
          <p className="mt-1 text-sm text-slate-body">
            {t('howItWorks.ganttSubtitle')}
          </p>
        </div>
        <div className="flex flex-wrap gap-4 text-[11px] text-slate-body">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-brand" /> {t('howItWorks.ganttLegendConfirmed')}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm border border-dashed border-slate-400 bg-slate-100" />{" "}
            {t('howItWorks.ganttLegendNoAck')}
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

      <div className="mt-6 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 rounded-xl bg-brand/10 border border-brand/25 px-5 py-4">
        <span className="inline-flex items-center gap-2 text-sm font-bold text-brand shrink-0">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand opacity-60" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-brand" />
          </span>
          {t('howItWorks.calloutTitle')}
        </span>
        <p className="text-sm text-slate-700 leading-relaxed">
          {t('howItWorks.calloutBody')}
        </p>
      </div>
    </div>
  );
}
