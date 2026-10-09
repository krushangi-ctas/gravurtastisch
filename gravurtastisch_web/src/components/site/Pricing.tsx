import { useState, useEffect, type FormEvent } from "react";
import { Check, Sparkles, ArrowRight, Loader2, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Container } from "./Container";
import { Reveal } from "./Reveal";
import { createCheckoutSession, getPublicPlans, PlanItem } from "@/lib/api";

const defaultFallbackPlans: PlanItem[] = [
  {
    name: "Starter",
    price: 15,
    marketplace: 5,
    request_quota: 150,
    status: 1,
  },
  {
    name: "Growth",
    price: 25,
    marketplace: 10,
    request_quota: 300,
    status: 1,
  },
  {
    name: "Scale",
    price: 99,
    marketplace: 25,
    request_quota: 1000,
    status: 1,
  },
];

export function Pricing() {
  const { t } = useTranslation();
  const [plans, setPlans] = useState<PlanItem[]>(defaultFallbackPlans);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<PlanItem | null>(null);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");

  useEffect(() => {
    let isMounted = true;
    async function loadPlans() {
      try {
        const res = await getPublicPlans({ status: 1, sortBy: "price:asc", limit: 20 });
        if (isMounted && res?.data && res.data.length > 0) {
          const activePlans = res.data.filter((p) => p.status === 1);
          if (activePlans.length > 0) {
            setPlans(activePlans);
          }
        }
      } catch (err) {
        console.error("Failed to load pricing plans:", err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadPlans();
    return () => {
      isMounted = false;
    };
  }, []);

  const getTierTag = (index: number, total: number) => {
    if (index === 0) return t("pricing.tiers.starter.tag") || "SOLO SELLERS";
    if (index === Math.floor(total / 2) || index === 1)
      return t("pricing.tiers.growth.tag") || "SCALING BRANDS";
    return t("pricing.tiers.scale.tag") || "MULTI-ACCOUNT";
  };

  const getPerks = (plan: PlanItem, index: number, isHighlight: boolean) => {
    const marketplaceText =
      plan.marketplace <= 1
        ? t("pricing.marketplaceSingle", "1 marketplace")
        : t("pricing.marketplacePlural", {
            count: plan.marketplace,
            defaultValue: `${plan.marketplace} marketplaces`,
          });

    const starterPerks =
      (t("pricing.tiers.starter.perks", { returnObjects: true }) as string[]) || [];
    const growthPerks =
      (t("pricing.tiers.growth.perks", { returnObjects: true }) as string[]) || [];

    if (index === 0) {
      return [
        starterPerks[0] || "Auto-scheduler",
        starterPerks[1] || "Basic tracking",
        starterPerks[2] || "Email support",
        marketplaceText,
      ];
    }

    if (isHighlight) {
      return [
        growthPerks[0] || "Priority scheduling",
        growthPerks[1] || "Full analytics",
        marketplaceText,
        growthPerks[3] || "Chat support",
      ];
    }

    return [
      starterPerks[0] || "Auto-scheduler",
      growthPerks[1] || "Full analytics",
      growthPerks[3] || "Chat support",
      marketplaceText,
    ];
  };

  const highlightIndex =
    plans.length <= 1 ? 0 : plans.length === 2 ? 1 : Math.floor(plans.length / 2);

  const openCheckout = (plan: PlanItem) => {
    const planId = plan._id || plan.id;
    if (!planId) {
      setCheckoutError(
        "This plan is a preview placeholder. Create active plans in the admin panel first."
      );
      setSelectedPlan(plan);
      return;
    }
    setSelectedPlan(plan);
    setCheckoutError("");
  };

  const closeModal = () => {
    if (checkoutLoading) return;
    setSelectedPlan(null);
    setCheckoutError("");
  };

  const startStripeCheckout = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedPlan) return;
    const planId = selectedPlan._id || selectedPlan.id;
    if (!planId) {
      setCheckoutError("Plan id missing - add plans via the admin panel.");
      return;
    }

    setCheckoutLoading(true);
    setCheckoutError("");
    try {
      const res = await createCheckoutSession({
        planId,
        email: email.trim(),
        name: name.trim() || undefined,
      });
      if (!res.data?.url) {
        throw new Error("Stripe did not return a checkout URL.");
      }
      // Hosted Stripe Checkout — payment events still arrive via webhook if tab closes
      window.location.href = res.data.url;
    } catch (err) {
      setCheckoutError(
        err instanceof Error
          ? err.message
          : "Could not start Stripe Checkout. Check API Stripe keys."
      );
      setCheckoutLoading(false);
    }
  };

  return (
    <section id="pricing" className="relative py-12 lg:py-16 bg-surface-alt">
      <Container>
        <Reveal>
          <div className="max-w-3xl">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-brand">
              {t("pricing.sectionLabel")}
            </span>
            <h2 className="mt-3 text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-navy-deep leading-tight">
              {t("pricing.heading1")}
              <br />
              {t("pricing.heading2")}
            </h2>
            <p className="mt-4 text-base sm:text-lg text-slate-body leading-relaxed max-w-2xl">
              {t("pricing.description")}
            </p>
          </div>
        </Reveal>

        <Reveal delay={100}>
          <div
            className={`mt-8 grid gap-5 lg:gap-6 items-stretch ${
              plans.length === 1
                ? "grid-cols-1 max-w-md mx-auto"
                : plans.length === 2
                  ? "grid-cols-1 md:grid-cols-2 max-w-3xl mx-auto"
                  : plans.length === 3
                    ? "grid-cols-1 md:grid-cols-3"
                    : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
            }`}
          >
            {plans.map((plan, index) => {
              const isHighlight = index === highlightIndex;
              const tag = getTierTag(index, plans.length);
              const perks = getPerks(plan, index, isHighlight);

              return (
                <div
                  key={plan._id || plan.id || `${plan.name}-${index}`}
                  className={`relative flex flex-col rounded-3xl p-8 lg:p-10 transition-all duration-300 hover:-translate-y-1 ${
                    isHighlight
                      ? "bg-gradient-to-br from-navy-deep to-navy text-white shadow-xl shadow-navy-deep/25"
                      : "bg-white border border-border shadow-sm hover:shadow-md"
                  }`}
                >
                  {isHighlight && (
                    <span className="absolute top-5 right-5 rounded-full bg-brand-bright px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
                      {t("pricing.popular") || "Popular"}
                    </span>
                  )}

                  <p
                    className={`text-xs font-semibold uppercase tracking-widest ${
                      isHighlight ? "text-brand-bright" : "text-brand"
                    }`}
                  >
                    {tag}
                  </p>

                  <h3
                    className={`mt-2 text-3xl font-extrabold ${
                      isHighlight ? "text-white" : "text-navy-deep"
                    }`}
                  >
                    {plan.name}
                  </h3>

                  <div className="mt-8 min-h-[3.5rem] flex items-end">
                    <div className="flex items-baseline gap-1">
                      <span
                        className={`text-5xl font-extrabold tracking-tight ${
                          isHighlight ? "text-white" : "text-navy-deep"
                        }`}
                      >
                        ${plan.price}
                      </span>
                      <span
                        className={`${
                          isHighlight ? "text-white/55" : "text-slate-body"
                        } text-sm`}
                      >
                        {t("pricing.perMonth") || "/mo"}
                      </span>
                    </div>
                  </div>

                  <p
                    className={`mt-3 text-sm ${
                      isHighlight ? "text-white/65" : "text-slate-body"
                    }`}
                  >
                    {plan.request_quota
                      ? t("pricing.requestsPerMonth", {
                          count: Number(plan.request_quota).toLocaleString(),
                          defaultValue: `${Number(plan.request_quota).toLocaleString()} custom pieces / month`,
                        })
                      : t("pricing.unlimitedRequests", "Unlimited custom pieces / month")}
                  </p>

                  <ul className="mt-8 space-y-3.5 flex-1">
                    {perks.map((p: string) => (
                      <li key={p} className="flex items-start gap-2.5 text-sm">
                        <Check
                          className={`h-4 w-4 mt-0.5 shrink-0 ${
                            isHighlight ? "text-brand-bright" : "text-brand"
                          }`}
                          strokeWidth={2.5}
                        />
                        <span className={isHighlight ? "text-white/85" : "text-navy-deep"}>
                          {p}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <button
                    type="button"
                    disabled={isLoading}
                    onClick={() => openCheckout(plan)}
                    className={`mt-10 inline-flex w-full items-center justify-center rounded-full px-5 py-3.5 text-sm font-semibold transition-all duration-300 ${
                      isHighlight
                        ? "bg-brand-bright text-white hover:bg-brand"
                        : "border border-navy-deep text-navy-deep hover:bg-navy-deep hover:text-white"
                    }`}
                  >
                    {t("pricing.tiers.starter.cta") || "Get started"}
                  </button>
                </div>
              );
            })}
          </div>
        </Reveal>

        <Reveal delay={200}>
          <div className="mt-10 rounded-3xl bg-white border border-border p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-sm hover:shadow-md transition-all duration-300">
            <div className="flex items-center gap-4 text-center sm:text-left">
              <div className="hidden sm:flex h-12 w-12 rounded-2xl bg-brand/10 text-brand items-center justify-center shrink-0">
                <Sparkles className="h-6 w-6 text-brand" />
              </div>
              <div>
                <h4 className="text-lg sm:text-xl font-bold text-navy-deep">
                  {t("pricing.customPlanTitle") || "Need a custom high-volume plan?"}
                </h4>
                <p className="mt-1 text-sm text-slate-body max-w-xl">
                  {t("pricing.customPlanDesc") ||
                    "Need higher craft volume, white-glove proofs, or B2B gifting programs? We will shape a studio plan around your brand."}
                </p>
              </div>
            </div>

            <a
              href="/#contact"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-navy-deep px-6 py-3.5 text-sm font-semibold text-white shadow-md hover:bg-navy transition-all duration-300 shrink-0 group hover:shadow-lg"
            >
              <span>{t("pricing.customPlanCta") || "Contact for Custom Plan"}</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </a>
          </div>
        </Reveal>
      </Container>

      {/* Stripe checkout email gate — then redirect to Stripe hosted Checkout */}
      {selectedPlan && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-navy-deep/50 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="checkout-title"
          onClick={closeModal}
        >
          <div
            className="w-full max-w-md rounded-3xl bg-white border border-border shadow-2xl p-6 sm:p-8"
            onClick={(ev) => ev.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand">
                  Stripe Checkout
                </p>
                <h3 id="checkout-title" className="mt-1 text-xl font-extrabold text-navy-deep">
                  {selectedPlan.name} - ${selectedPlan.price}/mo
                </h3>
                <p className="mt-1.5 text-sm text-slate-body">
                  Enter your email, then continue to Stripe to pay securely. Closing the Stripe
                  window is fine - our webhook still records a successful payment.
                </p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="rounded-full p-2 text-slate-body hover:bg-surface-alt"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={startStripeCheckout} className="mt-6 space-y-4">
              <div>
                <label htmlFor="checkout-email" className="block text-xs font-semibold text-navy-deep mb-1.5">
                  Email
                </label>
                <input
                  id="checkout-email"
                  type="email"
                  required
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  className="w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                />
              </div>
              <div>
                <label htmlFor="checkout-name" className="block text-xs font-semibold text-navy-deep mb-1.5">
                  Name <span className="font-normal text-slate-body">(optional)</span>
                </label>
                <input
                  id="checkout-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Studio / contact name"
                  className="w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                />
              </div>

              {checkoutError && (
                <p className="text-sm text-rose-600 bg-rose-50 border border-rose-100 rounded-xl px-3 py-2">
                  {checkoutError}
                </p>
              )}

              <button
                type="submit"
                disabled={checkoutLoading || !(selectedPlan._id || selectedPlan.id)}
                className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-brand px-5 py-3.5 text-sm font-semibold text-white hover:bg-brand-bright disabled:opacity-60 transition"
              >
                {checkoutLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Opening Stripe…
                  </>
                ) : (
                  <>
                    Continue to Stripe
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
