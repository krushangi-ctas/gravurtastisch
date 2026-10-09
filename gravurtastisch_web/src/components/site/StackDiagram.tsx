import { Container } from "./Container";
import { Reveal } from "./Reveal";
import { useTranslation } from "react-i18next";

/** Tags aligned to layer meaning (not random suffixes) */
const layerTagKeys = [".touch", ".api", ".queue", ".sync", ".vault"];

export function StackDiagram() {
  const { t } = useTranslation();

  const layers = [
    { labelKey: "layer1Label", subKey: "layer1Sub" },
    { labelKey: "layer2Label", subKey: "layer2Sub" },
    { labelKey: "layer3Label", subKey: "layer3Sub" },
    { labelKey: "layer4Label", subKey: "layer4Sub" },
    { labelKey: "layer5Label", subKey: "layer5Sub" },
  ];

  return (
    <section id="stack" className="relative py-12 lg:py-16 bg-white overflow-hidden">
      <Container>
        <div className="grid lg:grid-cols-12 gap-8 items-center">
          <Reveal className="lg:col-span-5 min-w-0 w-full">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-brand">
              {t("stackDiagram.sectionLabel")}
            </span>
            <h2 className="mt-3 text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-navy-deep leading-tight">
              {t("stackDiagram.heading")}
            </h2>
            <p className="mt-5 text-slate-body leading-[1.75] text-base sm:text-lg">
              {t("stackDiagram.description")}
            </p>
            <ul className="mt-8 space-y-3 text-sm text-slate-body">
              {["listItem1", "listItem2", "listItem3"].map((k) => (
                <li key={k} className="flex gap-2.5">
                  <span className="text-brand mt-0.5">◆</span> {t(`stackDiagram.${k}`)}
                </li>
              ))}
            </ul>
          </Reveal>

          <Reveal className="lg:col-span-7 min-w-0 w-full" delay={120}>
            <div className="relative space-y-3">
              <div
                className="absolute left-[1.15rem] top-6 bottom-6 w-px bg-gradient-to-b from-brand via-[#E89B5C]/60 to-navy-deep"
                aria-hidden
              />
              {layers.map((l, i) => (
                <div
                  key={l.labelKey}
                  className="relative flex items-center gap-3 sm:gap-4 pl-0 group"
                  style={{ animationDelay: `${i * 0.08}s` }}
                >
                  <span className="relative z-10 grid place-items-center h-9 w-9 shrink-0 rounded-full bg-white border-2 border-brand text-[10px] font-mono font-bold text-brand shadow-sm pulse-node">
                    {String(i).padStart(2, "0")}
                  </span>
                  <div className="flex-1 min-w-0 flex items-center justify-between gap-3 sm:gap-4 rounded-2xl border border-border bg-surface px-4 py-3.5 sm:px-5 sm:py-4 transition-all duration-300 group-hover:border-brand/40 group-hover:shadow-md group-hover:-translate-y-0.5">
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-navy-deep text-sm sm:text-base leading-snug">
                        {t(`stackDiagram.${l.labelKey}`)}
                      </p>
                      <p className="mt-0.5 text-xs sm:text-sm text-slate-body leading-relaxed">
                        {t(`stackDiagram.${l.subKey}`)}
                      </p>
                    </div>
                    <span className="font-mono text-[11px] sm:text-xs text-slate-body/60 shrink-0">
                      {layerTagKeys[i]}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}
