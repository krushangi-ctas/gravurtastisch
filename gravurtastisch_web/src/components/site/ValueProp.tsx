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
      accent: "from-[#282828] to-[#4A4A4A]",
    },
    {
      id: "02",
      icon: Sparkles,
      titleKey: "feature2Title",
      bodyKey: "feature2Body",
      tag: t("valueProp.feature2Tag", "Laser engraving"),
      accent: "from-[#4A4A4A] to-[#6E6E6E]",
    },
    {
      id: "03",
      icon: Lamp,
      titleKey: "feature3Title",
      bodyKey: "feature3Body",
      tag: t("valueProp.feature3Tag", "Lifestyle"),
      accent: "from-[#181818] to-[#282828]",
    },
    {
      id: "04",
      icon: Shirt,
      titleKey: "feature4Title",
      bodyKey: "feature4Body",
      tag: t("valueProp.feature4Tag", "Apparel"),
      accent: "from-[#3A3A3A] to-[#5A5A5A]",
    },
  ];

  return (
    <section className="relative py-20 lg:py-28 bg-[#F8F8F6] overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.45]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 12% 20%, rgba(40,40,40,0.06), transparent 42%), radial-gradient(circle at 88% 70%, rgba(80,80,80,0.06), transparent 40%)",
        }}
        aria-hidden
      />

      <Container className="relative">
        <Reveal>
          <div className="max-w-3xl">
            <span className="text-xs font-bold uppercase tracking-[0.22em] text-brand">
              {t("valueProp.sectionLabel")}
            </span>
            <h2 className="mt-3 text-3xl sm:text-4xl lg:text-[2.75rem] font-extrabold tracking-tight text-navy-deep leading-[1.15]">
              {t("valueProp.title1")}{" "}
              <span className="text-navy-deep">
                {t("valueProp.title2")}
              </span>
            </h2>
            <p className="mt-4 text-base text-slate-body leading-relaxed max-w-2xl text-left">
              {t("valueProp.description")}
            </p>
          </div>
        </Reveal>

        <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <Reveal key={f.id} delay={i * 60}>
                <article
                  className="group relative flex h-full flex-col justify-between overflow-hidden rounded-[1.75rem] border border-[#E5E5DF] bg-white p-6 sm:p-7 shadow-[0_1px_0_rgba(40,40,40,0.04)] hover:shadow-[0_24px_60px_-28px_rgba(40,40,40,0.25)] hover:-translate-y-1 transition-all duration-300"
                >
                  <div>
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
                    <p className="mt-3 text-sm text-slate-600 leading-relaxed">
                      {t(`valueProp.${f.bodyKey}`)}
                    </p>
                  </div>
                  <div className="mt-6 flex items-center justify-between pt-2">
                    <span className="rounded-full border border-[#E5E5DF] bg-[#F2F2EF] px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-brand">
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
