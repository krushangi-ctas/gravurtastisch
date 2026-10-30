import React, { useState } from "react";
import {
  Check,
  Clock,
  Send,
  Star,
  Zap,
  Search,
  RefreshCw,
  CheckCircle2,
  Flame,
  Bell,
  Repeat,
  Sparkles,
  Lock,
  Layers,
  SlidersHorizontal,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Container } from "./Container";
import { Reveal } from "./Reveal";

interface OrderRow {
  id: string;
  sku: string;
  item: string;
  d: string;
  s: "queued" | "sent" | "opened" | "reviewed";
  t: string;
  material: string;
}

export function DashboardPreview() {
  const { t } = useTranslation();
  const [activeFilter, setActiveFilter] = useState<"all" | "queued" | "sent" | "opened">("all");
  const [approvedIds, setApprovedIds] = useState<Record<string, boolean>>({});
  const [justApproved, setJustApproved] = useState<string | null>(null);

  const initialRows: OrderRow[] = [
    {
      id: "GT-24018",
      sku: "CUP-WRAP-11",
      item: "Insulated Tumbler 750ml",
      material: "Rotary Laser 360°",
      d: "12m ago",
      s: "queued",
      t: "Proof",
    },
    {
      id: "GT-24017",
      sku: "KIT-BOARD-02",
      item: "Solid Oak Board",
      material: "Deep Laser Engrave",
      d: "1h ago",
      s: "sent",
      t: "Laser",
    },
    {
      id: "GT-24016",
      sku: "LIFE-LED-07",
      item: "Acrylic Light Base",
      material: "Laser Cut & UV",
      d: "3h ago",
      s: "queued",
      t: "Proof",
    },
    {
      id: "GT-24015",
      sku: "APP-TEE-04",
      item: "Heavyweight Boxy Tee",
      material: "12k Stitch Embroidery",
      d: "6h ago",
      s: "opened",
      t: "Ship",
    },
  ];

  const handleActionClick = (rowId: string, currentStatus: string) => {
    if (currentStatus === "queued" || !approvedIds[rowId]) {
      setApprovedIds((prev) => ({ ...prev, [rowId]: true }));
      setJustApproved(rowId);
      setTimeout(() => setJustApproved(null), 3000);
    }
  };

  const filteredRows = initialRows.filter((r) => {
    const isApproved = approvedIds[r.id];
    const currentStatus = isApproved ? "sent" : r.s;
    if (activeFilter === "all") return true;
    return currentStatus === activeFilter;
  });

  const features = [
    {
      Icon: Flame,
      titleKey: "feature1Title",
      descKey: "feature1Desc",
      badge: "VIP High Priority",
      accent: "text-amber-500 bg-amber-500/10 border-amber-500/20",
    },
    {
      Icon: Bell,
      titleKey: "feature2Title",
      descKey: "feature2Desc",
      badge: "Auto Dispatch",
      accent: "text-[#0032ab] bg-[#0032ab]/10 border-[#0032ab]/20",
    },
    {
      Icon: CheckCircle2,
      titleKey: "feature3Title",
      descKey: "feature3Desc",
      badge: "Proof → QC → Ship",
      accent: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
    },
    {
      Icon: Sparkles,
      titleKey: "feature4Title",
      descKey: "feature4Desc",
      badge: "1-Click Clone",
      accent: "text-purple-500 bg-purple-500/10 border-purple-500/20",
    },
  ];

  return (
    <section id="dashboard" className="relative py-16 lg:py-24 bg-[#f8f9fc] dark:bg-navy-deep/60 overflow-hidden border-t border-slate-200/80 dark:border-white/10">
      {/* Subtle radial ambient glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-brand/5 rounded-full blur-3xl pointer-events-none" />

      <Container>
        {/* Centered Modern Section Header */}
        <Reveal>
          <div className="text-center max-w-3xl mx-auto mb-10">
            <span className="section-badge mb-3">
              {t("dashboardPreview.sectionLabel", "Order dashboard")}
            </span>
            <h2 className="mt-3 text-3xl sm:text-4xl lg:text-[2.65rem] font-extrabold tracking-tight text-navy-deep dark:text-white leading-tight">
              {t("dashboardPreview.heading", "Every custom job, from proof to parcel.")}
            </h2>
            <p className="mt-3.5 text-slate-600 dark:text-slate-300 text-sm sm:text-base leading-relaxed max-w-2xl mx-auto">
              Real-time studio cockpit for artwork intake, digital proof approvals, laser machine scheduling, and carrier tracking.
            </p>

            {/* Live Studio Metrics Ribbon */}
            <div className="mt-6 inline-flex flex-wrap items-center justify-center gap-3 sm:gap-4 px-4 py-2 rounded-2xl bg-white dark:bg-navy/80 border border-slate-200/90 dark:border-white/10 shadow-2xs text-xs text-slate-600 dark:text-slate-300">
              <span className="flex items-center gap-1.5 font-semibold text-emerald-600 dark:text-emerald-400">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                Live Studio Engine
              </span>
              <span className="text-slate-300 dark:text-slate-700">|</span>
              <span className="font-mono text-slate-700 dark:text-slate-200">
                Avg. Proof Speed: <strong className="text-navy-deep dark:text-white">18 mins</strong>
              </span>
              <span className="text-slate-300 dark:text-slate-700">|</span>
              <span className="font-mono text-slate-700 dark:text-slate-200">
                QC Match Rate: <strong className="text-emerald-600">99.8%</strong>
              </span>
            </div>
          </div>
        </Reveal>

        {/* Centerpiece: Full-Width Interactive Studio Cockpit Window */}
        <Reveal delay={80}>
          <div className="rounded-3xl liquid-glass text-slate-900 dark:text-white p-4 sm:p-6 lg:p-7 shadow-2xl shadow-[#0032ab]/08 border border-[#0032ab]/18 transition-all duration-300 w-full overflow-hidden">
            {/* Window Chrome / Titlebar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200/80 dark:border-white/10">
              <div className="flex items-center gap-3">
                <div className="flex gap-1.5 shrink-0">
                  <span className="h-3 w-3 rounded-full bg-red-400/90 shadow-2xs" />
                  <span className="h-3 w-3 rounded-full bg-amber-400/90 shadow-2xs" />
                  <span className="h-3 w-3 rounded-full bg-emerald-400/90 shadow-2xs" />
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-white/06 border border-slate-200 dark:border-white/10 font-mono text-[11px] text-slate-600 dark:text-slate-300">
                  <Lock className="w-3 h-3 text-emerald-600" />
                  <span className="truncate">{t("dashboardPreview.mockUrl", "app.gravurtastisch.com/orders")}</span>
                </div>
              </div>

              {/* Status Message / Notification */}
              {justApproved && (
                <div className="animate-in fade-in slide-in-from-top-1 duration-200 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-[11px] font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Digital Proof for {justApproved} approved & unlocked to Laser Cell!</span>
                </div>
              )}

              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-[#0032ab] dark:text-brand-bright flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  Studio OS v2.4
                </span>
              </div>
            </div>

            {/* Interactive Filter Tabs Toolbar */}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 pb-3">
              <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-white/05 border border-slate-200/80 dark:border-white/10 text-xs">
                <button
                  type="button"
                  onClick={() => setActiveFilter("all")}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                    activeFilter === "all"
                      ? "bg-[#0032ab] text-white shadow-xs"
                      : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  All Orders ({initialRows.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveFilter("queued")}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                    activeFilter === "queued"
                      ? "bg-[#0032ab] text-white shadow-xs"
                      : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  {t("dashboardPreview.statusQueued", "Awaiting proof")}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveFilter("sent")}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                    activeFilter === "sent"
                      ? "bg-[#0032ab] text-white shadow-xs"
                      : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  {t("dashboardPreview.statusSent", "In production")}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveFilter("opened")}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                    activeFilter === "opened"
                      ? "bg-[#0032ab] text-white shadow-xs"
                      : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  {t("dashboardPreview.statusOpened", "Proof sent")}
                </button>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                <span>SP-API Live Sync Active</span>
              </div>
            </div>

            {/* Orders Table */}
            <div className="overflow-x-auto w-full custom-table-scrollbar">
              <table className="w-full text-sm min-w-[620px]">
                <thead>
                  <tr className="text-xs uppercase tracking-wider bg-gradient-to-r from-[#0032ab] to-[#155dfc] text-white">
                    <th className="text-left font-bold py-3 px-3.5 rounded-l-xl text-white">
                      {t("dashboardPreview.tableOrder", "Order")}
                    </th>
                    <th className="text-left font-bold py-3 px-3">
                      {t("dashboardPreview.tableSku", "Product & Craft Line")}
                    </th>
                    <th className="text-left font-bold py-3 px-3">
                      {t("dashboardPreview.tableDelivered", "Timeline")}
                    </th>
                    <th className="text-left font-bold py-3 px-3">
                      {t("dashboardPreview.tableStatus", "Status")}
                    </th>
                    <th className="text-right font-bold py-3 px-3.5 rounded-r-xl">
                      {t("dashboardPreview.tableAction", "Action")}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredRows.map((r) => {
                    const isApproved = approvedIds[r.id];
                    const currentStatus = isApproved ? "sent" : r.s;
                    const actionLabel = isApproved ? "Craft QC" : r.t;

                    return (
                      <tr
                        key={r.id}
                        className="hover:bg-slate-50/80 dark:hover:bg-white/03 transition-colors group"
                      >
                        <td className="py-3.5 px-3.5 whitespace-nowrap">
                          <span className="font-mono text-xs font-bold text-navy-deep dark:text-white block">
                            {r.id}
                          </span>
                          <span className="text-[11px] font-mono text-slate-500">{r.sku}</span>
                        </td>
                        <td className="py-3.5 px-3 whitespace-nowrap">
                          <p className="font-bold text-slate-800 dark:text-slate-100 text-xs sm:text-sm">
                            {r.item}
                          </p>
                          <span className="inline-flex items-center gap-1 text-[11px] font-mono text-[#0032ab] dark:text-brand-bright">
                            <Layers className="w-3 h-3" />
                            {r.material}
                          </span>
                        </td>
                        <td className="py-3.5 px-3 text-slate-500 dark:text-slate-400 text-xs whitespace-nowrap">
                          <span className="inline-flex items-center gap-1 font-mono">
                            <Clock className="h-3.5 w-3.5 text-slate-400" /> {r.d}
                          </span>
                        </td>
                        <td className="py-3.5 px-3 whitespace-nowrap">
                          <StatusPill status={currentStatus} />
                        </td>
                        <td className="py-3.5 px-3.5 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => handleActionClick(r.id, r.s)}
                            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition-all cursor-pointer shadow-2xs hover:scale-105 active:scale-95 ${
                              isApproved
                                ? "bg-emerald-500 text-white shadow-emerald-500/20"
                                : "bg-[#0032ab]/10 border border-[#0032ab]/25 text-[#0032ab] hover:bg-[#0032ab] hover:text-white"
                            }`}
                          >
                            {isApproved ? (
                              <>
                                <Check className="h-3.5 w-3.5" />
                                <span>Approved</span>
                              </>
                            ) : (
                              <>
                                <Send className="h-3 w-3" />
                                <span>{actionLabel}</span>
                              </>
                            )}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Dashboard Footer Tip */}
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-white/06 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-500 gap-2">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Click <strong>"Proof"</strong> above to test interactive approval workflow simulation!
              </span>
              <span className="font-mono text-[11px]">4 sample jobs shown of 142 daily batches</span>
            </div>
          </div>
        </Reveal>

        {/* 4 Smart Feature Bento Cards in a Horizontal 4-Column Row */}
        <Reveal delay={120}>
          <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {features.map((c) => {
              const Icon = c.Icon;
              return (
                <div
                  key={c.titleKey}
                  className="rounded-2xl liquid-glass border border-[#0032ab]/12 hover:border-[#0032ab]/30 p-5 shadow-2xs hover:shadow-md transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3.5">
                      <div className={`h-10 w-10 rounded-xl grid place-items-center transition-transform duration-300 group-hover:scale-110 ${c.accent}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/08 text-slate-600 dark:text-slate-300">
                        {c.badge}
                      </span>
                    </div>
                    <h3 className="font-bold text-navy-deep dark:text-white text-sm sm:text-base group-hover:text-[#0032ab] transition-colors">
                      {t(`dashboardPreview.${c.titleKey}`)}
                    </h3>
                    <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      {t(`dashboardPreview.${c.descKey}`)}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-white/06 flex items-center justify-between text-[11px] text-[#0032ab] dark:text-brand-bright font-bold">
                    <span>Studio Feature</span>
                    <span className="text-slate-400 group-hover:translate-x-1 transition-transform">→</span>
                  </div>
                </div>
              );
            })}
          </div>
        </Reveal>
      </Container>
    </section>
  );
}

function StatusPill({ status }: { status: string }) {
  const { t } = useTranslation();
  const map: Record<string, { c: string; dot: string; l: string }> = {
    queued: {
      c: "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700",
      dot: "bg-slate-500",
      l: t("dashboardPreview.statusQueued", "Awaiting proof"),
    },
    sent: {
      c: "bg-blue-50 dark:bg-blue-950/60 text-[#0032ab] dark:text-blue-300 border border-blue-200 dark:border-blue-900",
      dot: "bg-blue-600 animate-pulse",
      l: t("dashboardPreview.statusSent", "In production"),
    },
    opened: {
      c: "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900",
      dot: "bg-amber-500",
      l: t("dashboardPreview.statusOpened", "Proof sent"),
    },
    reviewed: {
      c: "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900",
      dot: "bg-emerald-500",
      l: t("dashboardPreview.statusReviewed", "Delivered"),
    },
  };
  const s = map[status] || map.queued;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full ${s.c} px-2.5 py-1 text-[11px] font-bold shadow-2xs`}>
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {s.l}
    </span>
  );
}
