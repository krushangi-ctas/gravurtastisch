import { useTranslation } from "react-i18next";
import { Container } from "./Container";
import { Reveal } from "./Reveal";
import {
  CupSoda,
  Sparkles,
  Shirt,
  Lamp,
  ArrowUpRight,
} from "lucide-react";

export function ValueProp() {
  const { t } = useTranslation();

  const features = [
    {
      id: "01",
      icon: CupSoda,
      titleKey: "feature1Title",
      bodyKey: "feature1Body",
      tag: t("valueProp.feature1Tag", "Drinkware"),
      span: "lg:col-span-2",
      accent: "from-[#613EA3] to-[#855FBF]",
    },
    {
      id: "02",
      icon: Sparkles,
      titleKey: "feature2Title",
      bodyKey: "feature2Body",
      tag: t("valueProp.feature2Tag", "Laser engraving"),
      span: "lg:col-span-1",
      accent: "from-[#E89B5C] to-[#C47432]",
    },
    {
      id: "03",
      icon: Lamp,
      titleKey: "feature3Title",
      bodyKey: "feature3Body",
      tag: t("valueProp.feature3Tag", "Lifestyle"),
      span: "lg:col-span-1",
      accent: "from-[#452B78] to-[#613EA3]",
    },
    {
      id: "04",
      icon: Shirt,
      titleKey: "feature4Title",
      bodyKey: "feature4Body",
      tag: t("valueProp.feature4Tag", "Apparel"),
      span: "lg:col-span-2",
      accent: "from-[#855FBF] to-[#E89B5C]",
    },
  ];

  return (
    <section className="relative py-20 lg:py-28 bg-[#FAF8FC] overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.45]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 12% 20%, rgba(97,62,163,0.08), transparent 42%), radial-gradient(circle at 88% 70%, rgba(232,155,92,0.10), transparent 40%)",
        }}
        aria-hidden
      />

      <Container className="relative">
        <Reveal>
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 max-w-5xl">
            <div className="max-w-2xl">
              <span className="text-xs font-bold uppercase tracking-[0.22em] text-brand">
                {t("valueProp.sectionLabel")}
              </span>
              <h2 className="mt-3 text-3xl sm:text-4xl lg:text-[2.75rem] font-extrabold tracking-tight text-navy-deep leading-[1.15]">
                {t("valueProp.title1")}{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand to-[#E89B5C]">
                  {t("valueProp.title2")}
                </span>
              </h2>
            </div>
            <p className="text-base text-slate-body leading-relaxed max-w-md lg:text-right">
              {t("valueProp.description")}
            </p>
          </div>
        </Reveal>

        <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <Reveal key={f.id} delay={i * 60}>
                <article
                  className={`group relative h-full overflow-hidden rounded-[1.75rem] border border-[#E8E4EF] bg-white p-7 shadow-[0_1px_0_rgba(42,24,72,0.04)] hover:shadow-[0_24px_60px_-28px_rgba(97,62,163,0.35)] hover:-translate-y-1 transition-all duration-300 ${f.span}`}
                >
                  <div
                    className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${f.accent} opacity-80`}
                    aria-hidden
                  />
                  <div className="flex items-start justify-between gap-4">
                    <div
                      className={`grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br ${f.accent} text-white shadow-md`}
                    >
                      <Icon className="h-5 w-5" strokeWidth={1.75} />
                    </div>
                    <span className="font-mono text-[11px] font-bold tracking-wider text-slate-400">
                      {f.id}
                    </span>
                  </div>
                  <h3 className="mt-6 text-xl font-bold tracking-tight text-navy-deep group-hover:text-brand transition-colors">
                    {t(`valueProp.${f.titleKey}`)}
                  </h3>
                  <p className="mt-3 text-sm text-slate-600 leading-relaxed max-w-md">
                    {t(`valueProp.${f.bodyKey}`)}
                  </p>
                  <div className="mt-6 flex items-center justify-between">
                    <span className="rounded-full border border-[#E8E4EF] bg-[#F7F5FA] px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-brand">
                      {f.tag}
                    </span>
                    <ArrowUpRight className="h-4 w-4 text-slate-300 group-hover:text-brand group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                  </div>
                </article>
              </Reveal>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
