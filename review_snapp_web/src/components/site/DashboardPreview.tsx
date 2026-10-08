import { Check, Clock, Send, Star, Zap } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Container } from "./Container";
import { Reveal } from "./Reveal";

export function DashboardPreview() {
  const { t } = useTranslation();

  const features = [
    { Icon: Send, titleKey: "feature1Title", descKey: "feature1Desc" },
    { Icon: Clock, titleKey: "feature2Title", descKey: "feature2Desc" },
    { Icon: Check, titleKey: "feature3Title", descKey: "feature3Desc" },
    { Icon: Star, titleKey: "feature4Title", descKey: "feature4Desc" },
  ];

  const tableRows = [
    { id: "GT-24018", sku: "CUP-WRAP-11", d: "12m ago", s: "queued", t: "Proof" },
    { id: "GT-24017", sku: "KIT-BOARD-02", d: "1h ago", s: "sent", t: "Laser" },
    { id: "GT-24016", sku: "LIFE-LED-07", d: "3h ago", s: "queued", t: "Proof" },
    { id: "GT-24015", sku: "APP-TEE-04", d: "6h ago", s: "opened", t: "Ship" },
  ];

  return (
    <section id="dashboard" className="relative py-12 lg:py-16 bg-surface-alt overflow-hidden">
      <Container className="grid lg:grid-cols-2 gap-10 lg:gap-12 xl:gap-16 items-center">
        <Reveal className="order-2 lg:order-1 min-w-0 w-full max-w-full">
          <div className="rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white p-4 sm:p-6 lg:p-7 shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-200/80 dark:border-slate-800 transition-transform duration-500 hover:-translate-y-1 w-full max-w-full overflow-hidden">
            <div className="flex items-center justify-between text-xs gap-2 sm:gap-3 pb-3 sm:pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex gap-1.5 shrink-0">
                <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
                <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
              </div>
              <span className="font-mono text-[11px] sm:text-xs text-slate-600 dark:text-slate-300 font-semibold truncate min-w-0">
                {t('dashboardPreview.mockUrl')}
              </span>
              <span className="flex items-center gap-1.5 text-brand dark:text-brand-bright font-bold shrink-0 text-[11px] sm:text-xs">
                <Zap className="h-3 w-3" fill="currentColor" />
                {t('dashboardPreview.sectionLabel')}
              </span>
            </div>

            <div className="mt-4 overflow-x-auto w-full max-w-full">
              <table className="w-full text-sm min-w-[420px] sm:min-w-[460px]">
                <thead>
                  <tr className="text-xs uppercase tracking-wider bg-navy-deep text-white">
                    <th className="text-left font-bold py-2.5 px-3 rounded-l-xl">{t('dashboardPreview.tableOrder')}</th>
                    <th className="text-left font-bold py-2.5 px-2.5">{t('dashboardPreview.tableSku')}</th>
                    <th className="text-left font-bold py-2.5 px-2.5">{t('dashboardPreview.tableDelivered')}</th>
                    <th className="text-left font-bold py-2.5 px-2.5">{t('dashboardPreview.tableStatus')}</th>
                    <th className="text-right font-bold py-2.5 px-3 rounded-r-xl">{t('dashboardPreview.tableAction')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {tableRows.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-3 font-mono text-xs font-semibold text-slate-900 dark:text-white whitespace-nowrap">{r.id}</td>
                      <td className="py-3 px-2.5 font-medium text-slate-700 dark:text-slate-200 text-xs sm:text-sm whitespace-nowrap">{r.sku}</td>
                      <td className="py-3 px-2.5 text-slate-500 dark:text-slate-400 text-xs whitespace-nowrap">
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" /> {r.d}
                        </span>
                      </td>
                      <td className="py-3 px-2.5 whitespace-nowrap">
                        <StatusPill status={r.s} />
                      </td>
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 rounded-full bg-brand/10 dark:bg-brand/20 border border-brand/30 dark:border-brand/40 px-2.5 py-1 text-xs font-semibold text-brand dark:text-brand-bright hover:bg-brand hover:text-white dark:hover:bg-brand transition"
                        >
                          <Send className="h-3 w-3" />
                          {r.t}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Reveal>

        <Reveal className="order-1 lg:order-2 min-w-0 w-full max-w-full" delay={100}>
          <div className="space-y-6 sm:space-y-8">
            <div>
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-brand">
                {t('dashboardPreview.sectionLabel')}
              </span>
              <h2 className="mt-3 text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-navy-deep leading-tight">
                {t('dashboardPreview.heading')}
              </h2>
            </div>
            <ul className="space-y-5 sm:space-y-6">
              {features.map((c) => {
                const Icon = c.Icon;
                return (
                  <li key={c.titleKey} className="flex gap-3.5 sm:gap-4 group">
                    <span className="grid place-items-center h-10 w-10 shrink-0 rounded-xl bg-brand/10 text-brand transition-transform duration-300 group-hover:scale-105">
                      <Icon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-navy-deep text-sm sm:text-base">{t(`dashboardPreview.${c.titleKey}`)}</p>
                      <p className="mt-1 text-xs sm:text-sm text-slate-body leading-relaxed">{t(`dashboardPreview.${c.descKey}`)}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}

function StatusPill({ status }: { status: string }) {
  const { t } = useTranslation();
  const map: Record<string, { c: string; l: string }> = {
    queued: { c: "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700", l: t('dashboardPreview.statusQueued') },
    sent: { c: "bg-blue-50 dark:bg-blue-950/40 text-brand dark:text-blue-400 border border-blue-200 dark:border-blue-900", l: t('dashboardPreview.statusSent') },
    opened: { c: "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900", l: t('dashboardPreview.statusOpened') },
    reviewed: { c: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900", l: t('dashboardPreview.statusReviewed') },
  };
  const s = map[status] || map.queued;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full ${s.c} px-2.5 py-1 text-[11px] font-semibold`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {s.l}
    </span>
  );
}
