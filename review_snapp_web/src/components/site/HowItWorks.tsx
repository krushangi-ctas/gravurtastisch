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
    <section id="how" className="relative py-12 lg:py-16 bg-navy-deep text-white overflow-hidden">
      <div className="absolute inset-0 grid-bg opacity-30" aria-hidden />
      <div className="absolute inset-0 noise-bg opacity-80" aria-hidden />

      <Container className="relative">
        <Reveal>
          <div className="max-w-3xl">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-brand-bright">
              {t('howItWorks.sectionLabel')}
            </span>
            <h2 className="mt-4 text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight leading-tight">
              {t('howItWorks.heading')}
            </h2>
            <p className="mt-4 text-white/60 text-base sm:text-lg leading-relaxed max-w-2xl">
              {t('howItWorks.description')}
            </p>
          </div>
        </Reveal>

        <Reveal delay={100}>
          <div className="mt-10 rounded-2xl lg:rounded-3xl bg-white/[0.04] border border-white/10 p-6 sm:p-8 lg:p-10">
            <GanttChart />
          </div>
        </Reveal>

        <ol className="mt-10 grid sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10">
          {steps.map((s, i) => (
            <Reveal key={s.key} delay={i * 70}>
              <li>
                <span className="font-mono text-xs text-brand-bright tracking-wider">
                  {t('howItWorks.stepLabel')} {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-3 text-lg font-bold leading-snug">{t(`howItWorks.${s.key}Title`)}</h3>
                <p className="mt-3 text-sm text-white/65 leading-[1.7]">{t(`howItWorks.${s.key}Desc`)}</p>
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
    { laneKey: "ganttLaneOrder", left: "8%", width: "42%", tone: "bg-white/25", labelKey: "ganttLabelFulfilled" },
    { laneKey: "ganttLaneDelivery", left: "42%", width: "18%", tone: "bg-amazon", labelKey: "ganttLabelMarked" },
    { laneKey: "ganttLaneGravurtastisch", left: "58%", width: "22%", tone: "bg-brand ring-1 ring-brand-bright/40", labelKey: "ganttLabelRequestSent", pulse: true },
    { laneKey: "ganttLaneBuyer", left: "78%", width: "18%", tone: "bg-white/10 border border-dashed border-white/25", labelKey: "ganttLabelMayLeave", muted: true },
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
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/45">
            {t('howItWorks.ganttTitle')}
          </p>
          <p className="mt-1 text-sm text-white/70">
            {t('howItWorks.ganttSubtitle')}
          </p>
        </div>
        <div className="flex flex-wrap gap-4 text-[11px] text-white/55">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-sm bg-brand" /> {t('howItWorks.ganttLegendConfirmed')}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-sm border border-dashed border-white/40 bg-white/10" />{" "}
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
              className="text-[10px] uppercase tracking-wider text-white/40 font-semibold text-center"
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
                row.muted ? "text-white/40" : "text-white/75"
              }`}
            >
              {t(`howItWorks.${row.laneKey}`)}
            </p>
            <div className="relative h-11 rounded-xl bg-white/[0.04] border border-white/[0.08] overflow-hidden">
              <div className="absolute inset-0 grid grid-cols-4 pointer-events-none" aria-hidden>
                {[0, 1, 2, 3].map((c) => (
                  <div key={c} className="border-r border-white/[0.06] last:border-r-0" />
                ))}
              </div>
              <div
                className={`absolute top-1.5 bottom-1.5 rounded-lg ${row.tone} flex items-center px-3 min-w-0`}
                style={{ left: row.left, width: row.width }}
              >
                <span
                  className={`text-[10px] sm:text-[11px] font-semibold truncate ${
                    row.muted ? "text-white/45" : "text-white"
                  }`}
                >
                  {t(`howItWorks.${row.labelKey}`)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 rounded-xl bg-brand/15 border border-brand/30 px-5 py-4">
        <span className="inline-flex items-center gap-2 text-sm font-bold text-brand-bright shrink-0">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-bright opacity-60" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-brand-bright" />
          </span>
          {t('howItWorks.calloutTitle')}
        </span>
        <p className="text-sm text-white/70 leading-relaxed">
          {t('howItWorks.calloutBody')}
        </p>
      </div>
    </div>
  );
}
