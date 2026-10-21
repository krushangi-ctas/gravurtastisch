import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { registerSeller, submitSupportMessage, getPublicPlans, PlanItem } from "@/lib/api";
import { useWebsiteConfiguration } from "@/hooks/useWebsiteConfiguration";
import { Mail, MapPin, Phone, Sparkles, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { Container } from "./Container";
import { Reveal } from "./Reveal";
import { FlagIcon } from "@/components/ui/FlagIcon";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function RegisterAndContact() {
  return (
    <>
      <RegisterSection />
      <ContactSection />
    </>
  );
}

const AVAILABLE_MARKETPLACES = [
  { code: "US", name: "United States" },
  { code: "CA", name: "Canada" },
  { code: "MX", name: "Mexico" },
  { code: "UK", name: "United Kingdom" },
  { code: "DE", name: "Germany" },
  { code: "FR", name: "France" },
  { code: "IT", name: "Italy" },
  { code: "ES", name: "Spain" },
  { code: "JP", name: "Japan" },
  { code: "AE", name: "UAE" },
  { code: "IN", name: "India" },
];

const defaultFallbackPlans: PlanItem[] = [
  {
    _id: "6abf64e2b7518e2b102d81e2",
    name: "Starter Plan",
    price: 29,
    marketplace: 1,
    request_quota: 500,
    billingCycle: 2,
    status: 1,
  },
  {
    _id: "6abf64e2b7518e2b102d81e3",
    name: "Growth Plan",
    price: 49,
    marketplace: 3,
    request_quota: 2000,
    billingCycle: 2,
    status: 1,
  },
  {
    _id: "6abf64e2b7518e2b102d81e4",
    name: "Scale Plan",
    price: 89,
    marketplace: 5,
    request_quota: 6000,
    billingCycle: 2,
    status: 1,
  },
  {
    _id: "6abf64e2b7518e2b102d81e5",
    name: "Enterprise Pro",
    price: 199,
    marketplace: 11,
    request_quota: 25000,
    billingCycle: 3,
    status: 1,
  },
];

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const NAME_REGEX = /^[a-zA-Z\u00C0-\u024F\u1E00-\u1EFF\s.'-]+$/;
const PHONE_CHARS_REGEX = /^[+0-9\s\-()]+$/;

function RegisterSection() {
  const { t } = useTranslation();
  const [plans, setPlans] = useState<PlanItem[]>(defaultFallbackPlans);
  const [selectedPlanId, setSelectedPlanId] = useState<string>("6abf64e2b7518e2b102d81e2");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [formValues, setFormValues] = useState({
    business: "",
    seller: "",
    email: "",
    phone: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (typeof window !== "undefined") {
      const searchParams = new URLSearchParams(window.location.search);
      const planParam = searchParams.get("plan");
      if (planParam) {
        setSelectedPlanId(planParam);
      }
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    getPublicPlans({ status: 1, limit: 20 })
      .then((res) => {
        if (!isMounted) return;
        const activePlans = res?.data || [];
        if (activePlans.length > 0) {
          setPlans(activePlans);
          setSelectedPlanId((prev) => {
            const exists = activePlans.some(
              (p) => (p._id && p._id === prev) || (p.id && p.id === prev)
            );
            return exists ? prev : ((activePlans[0]._id || activePlans[0].id || "") as string);
          });
        }
      })
      .catch((err) => {
        console.warn("Failed to fetch public plans, keeping defaults:", err);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const currentPlan = plans.find(
    (p) => (p._id && p._id === selectedPlanId) || (p.id && p.id === selectedPlanId)
  );

  useEffect(() => {
    if (sent) {
      const timer = setTimeout(() => {
        setSent(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [sent]);

  const validate = (
    values: typeof formValues,
    planId: string
  ): Record<string, string> => {
    const errs: Record<string, string> = {};

    const business = values.business.trim();
    if (!business) {
      errs.business = t("register.errBusinessRequired");
    } else if (business.length < 2) {
      errs.business = t("register.errBusinessMin");
    } else if (business.length > 100) {
      errs.business = t("register.errBusinessMax");
    }

    const seller = values.seller.trim();
    if (!seller) {
      errs.seller = t("register.errSellerRequired");
    } else if (seller.length < 2) {
      errs.seller = t("register.errSellerMin");
    } else if (seller.length > 60) {
      errs.seller = t("register.errSellerMax");
    } else if (!NAME_REGEX.test(seller)) {
      errs.seller = t("register.errSellerFormat");
    }

    const email = values.email.trim();
    if (!email) {
      errs.email = t("register.errEmailRequired");
    } else if (email.length > 100) {
      errs.email = t("register.errEmailMax");
    } else if (!EMAIL_REGEX.test(email)) {
      errs.email = t("register.errEmailInvalid");
    }

    const phone = values.phone.trim();
    if (phone) {
      const digitsOnly = phone.replace(/\D/g, "");
      if (phone.length > 20) {
        errs.phone = t("register.errPhoneMax");
      } else if (!PHONE_CHARS_REGEX.test(phone) || digitsOnly.length < 10 || digitsOnly.length > 20) {
        errs.phone = t("register.errPhoneInvalid");
      }
    }

    if (!planId && plans.length > 0) {
      errs.plan = t("register.errPlanRequired");
    }

    return errs;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const nextValues = { ...formValues, [name]: value };
    setFormValues(nextValues);

    if (touched[name]) {
      const nextErrors = validate(nextValues, selectedPlanId);
      setErrors((prev) => ({
        ...prev,
        [name]: nextErrors[name] || "",
      }));
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    const nextErrors = validate(formValues, selectedPlanId);
    setErrors((prev) => ({
      ...prev,
      [name]: nextErrors[name] || "",
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSent(false);

    const validationErrors = validate(formValues, selectedPlanId);
    setErrors(validationErrors);
    setTouched({
      business: true,
      seller: true,
      email: true,
      phone: true,
      plan: true,
    });

    if (Object.keys(validationErrors).length > 0) {
      const firstKey = Object.keys(validationErrors)[0];
      const targetElem = document.getElementById(`register-${firstKey}`);
      targetElem?.focus();
      return;
    }

    setLoading(true);

    try {
      const res = await registerSeller({
        business: formValues.business.trim(),
        seller: formValues.seller.trim(),
        email: formValues.email.trim(),
        phone: formValues.phone.trim() || undefined,
        planId: selectedPlanId || undefined,
      });

      if (res?.data?.checkoutUrl) {
        setSent(true);
        window.location.href = res.data.checkoutUrl;
        return;
      }

      setSent(true);
      setFormValues({
        business: "",
        seller: "",
        email: "",
        phone: "",
      });
      setTouched({});
      setErrors({});
    } catch (err: any) {
      setError(err?.message || t("register.errorDefault"));
    } finally {
      setLoading(false);
    }
  };

  const listItems = [t("register.listItem1"), t("register.listItem2"), t("register.listItem3")];

  return (
    <section id="register" className="relative py-12 lg:py-16 bg-white">
      <Container className="grid lg:grid-cols-12 gap-8">
        <Reveal className="lg:col-span-5">
          <span className="section-badge mb-3">
            {t("register.sectionLabel")}
          </span>
          <h2 className="mt-4 text-3xl sm:text-4xl lg:text-[2.75rem] font-extrabold text-navy-deep tracking-tight leading-[1.15]">
            {t("register.heading1")}
            <br />
            {t("register.heading2")}
          </h2>
          <p className="mt-6 text-slate-body leading-[1.75] text-base sm:text-lg">
            {t("register.description")}
          </p>
          <ul className="mt-10 space-y-3.5 text-sm text-slate-body">
            {listItems.map((x) => (
              <li key={x} className="flex gap-2.5">
                <span className="text-brand font-bold">✓</span> {x}
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal className="lg:col-span-7" delay={100}>
          <form
            noValidate
            onSubmit={handleSubmit}
            className="rounded-3xl bg-white border border-border shadow-xl p-8 lg:p-10 relative overflow-hidden"
          >
            <div className="relative grid sm:grid-cols-2 gap-5">
              <Field
                label={t("register.fieldBusinessName")}
                name="business"
                placeholder={t("register.fieldBusinessPlaceholder")}
                value={formValues.business}
                onChange={handleChange}
                onBlur={handleBlur}
                error={errors.business}
                touched={touched.business}
                required
                minLength={2}
                maxLength={100}
                disabled={loading}
              />
              <Field
                label={t("register.fieldSellerName")}
                name="seller"
                placeholder={t("register.fieldSellerPlaceholder")}
                value={formValues.seller}
                onChange={handleChange}
                onBlur={handleBlur}
                error={errors.seller}
                touched={touched.seller}
                required
                minLength={2}
                maxLength={60}
                disabled={loading}
              />
              <Field
                label={t("register.fieldEmail")}
                name="email"
                type="email"
                placeholder={t("register.fieldEmailPlaceholder")}
                value={formValues.email}
                onChange={handleChange}
                onBlur={handleBlur}
                error={errors.email}
                touched={touched.email}
                required
                maxLength={100}
                disabled={loading}
              />
              <Field
                label={t("register.fieldPhone")}
                name="phone"
                type="tel"
                placeholder={t("register.fieldPhonePlaceholder")}
                value={formValues.phone}
                onChange={handleChange}
                onBlur={handleBlur}
                error={errors.phone}
                touched={touched.phone}
                required={false}
                maxLength={20}
                disabled={loading}
              />

              {/* Dynamic Subscription Plan Selector */}
              <div className="sm:col-span-2 space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="register-plan" className="block text-xs font-semibold uppercase tracking-widest text-slate-body">
                    Subscription Plan <span className="text-red-500">*</span>
                  </Label>
                  {currentPlan && (
                    <span className="text-xs font-semibold text-brand">
                      ${currentPlan.price}
                      {currentPlan.billingCycle === 3
                        ? "/yr"
                        : currentPlan.billingCycle === 2
                        ? "/qtr"
                        : "/mo"}{" "}
                      · {currentPlan.request_quota.toLocaleString()} requests/mo
                    </span>
                  )}
                </div>
                <Select
                  value={selectedPlanId}
                  onValueChange={(val) => {
                    setSelectedPlanId(val);
                    setError("");
                    setErrors((prev) => ({ ...prev, plan: "" }));
                  }}
                  disabled={loading}
                >
                  <SelectTrigger
                    id="register-plan"
                    className={`h-12 w-full rounded-xl bg-white border px-4 py-3 text-sm text-foreground shadow-xs hover:border-brand/40 focus:outline-none focus:ring-2 transition [&>svg]:text-brand cursor-pointer ${
                      errors.plan && touched.plan
                        ? "border-red-500 focus:ring-red-200"
                        : "border-border focus:ring-brand/20 focus:border-brand"
                    }`}
                  >
                    <SelectValue placeholder="Select a subscription plan">
                      {currentPlan && (
                        <div className="flex items-center justify-between w-full pr-2 text-left truncate">
                          <span className="font-semibold text-foreground truncate">
                            {currentPlan.name}{" "}
                            <span className="text-brand font-bold">
                              — ${currentPlan.price}
                              {currentPlan.billingCycle === 3
                                ? "/yr"
                                : currentPlan.billingCycle === 2
                                ? "/qtr"
                                : "/mo"}
                            </span>
                          </span>
                          <span className="hidden sm:inline-block text-xs text-muted-foreground font-mono ml-3 shrink-0">
                            {currentPlan.marketplace}{" "}
                            {currentPlan.marketplace === 1
                              ? "marketplace"
                              : "marketplaces"}
                            , {currentPlan.request_quota.toLocaleString()} requests/mo
                          </span>
                        </div>
                      )}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent
                    className="bg-white border border-border text-foreground shadow-2xl rounded-2xl p-1.5 z-50 min-w-[var(--radix-select-trigger-width)]"
                  >
                    {plans.map((p) => {
                      const planId = (p._id || p.id) as string;
                      const cycleShort =
                        p.billingCycle === 3
                          ? "/yr"
                          : p.billingCycle === 2
                          ? "/qtr"
                          : "/mo";
                      return (
                        <SelectItem
                          key={planId}
                          value={planId}
                          className="rounded-xl px-3.5 py-3 text-sm text-foreground hover:bg-slate-100 focus:bg-slate-100 cursor-pointer transition-colors data-[state=checked]:bg-brand/10 data-[state=checked]:text-brand [&_svg]:text-brand my-0.5"
                        >
                          <div className="flex items-center justify-between w-full gap-4 pr-3">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-foreground">
                                {p.name}
                              </span>
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-brand/10 text-brand border border-brand/20">
                                ${p.price}{cycleShort}
                              </span>
                            </div>
                            <span className="text-xs text-muted-foreground font-mono">
                              {p.marketplace}{" "}
                              {p.marketplace === 1
                                ? "marketplace"
                                : "marketplaces"}
                              , {p.request_quota.toLocaleString()} req/mo
                            </span>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                {errors.plan && touched.plan && (
                  <p role="alert" className="text-xs text-red-500 font-medium flex items-center gap-1 mt-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{errors.plan}</span>
                  </p>
                )}
              </div>

              {/* Supported Marketplaces (View Purpose Only) */}
              <div className="sm:col-span-2">
                <div className="flex items-center justify-between mb-2.5">
                  <p className="text-xs font-semibold uppercase tracking-widest text-slate-body">
                    {t("register.marketplacesLabel")}{" "}
                    <span className="normal-case font-normal text-muted-foreground">
                      ({t("register.configuredAfter")})
                    </span>
                  </p>
                  {currentPlan && (
                    <span className="text-xs font-mono text-muted-foreground">
                      Plan allowance:{" "}
                      <strong className="text-brand">
                        {currentPlan.marketplace} {currentPlan.marketplace === 1 ? "marketplace" : "marketplaces"}
                      </strong>
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {AVAILABLE_MARKETPLACES.map(({ code }) => (
                    <span
                      key={code}
                      className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 border border-slate-200 px-3 py-1.5 text-xs font-mono font-medium text-slate-700 select-none cursor-default shadow-2xs hover:bg-slate-200/50"
                      title={code}
                    >
                      <FlagIcon code={code} className="w-3.5 h-2.5 rounded-[2px]" />
                      <span>{code}</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-8 flex flex-col items-end">
              <button
                type="submit"
                disabled={loading}
                className="relative inline-flex items-center gap-2 rounded-full btn-glass-primary !py-3.5 px-8 text-sm font-bold !text-white shadow-[0_8px_24px_rgba(0,50,171,0.35)] hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span className="!text-white">
                      {currentPlan && currentPlan.price > 0 ? "Redirecting to checkout..." : t("register.submitSending")}
                    </span>
                  </>
                ) : currentPlan && currentPlan.price > 0 ? (
                  <>
                    <span className="!text-white">
                      Continue to Payment (${currentPlan.price}
                      {currentPlan.billingCycle === 3
                        ? "/yr"
                        : currentPlan.billingCycle === 2
                        ? "/qtr"
                        : "/mo"})
                    </span>
                    <Sparkles className="w-4 h-4 text-white" />
                  </>
                ) : (
                  <span className="!text-white">{t("register.submitLabel")}</span>
                )}
              </button>
              {sent && (
                <p className="relative mt-3 text-sm text-emerald-600 font-medium flex items-center gap-1.5 text-right">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{t("register.successMessage")}</span>
                </p>
              )}
              {error && (
                <p className="relative mt-3 text-sm text-red-500 font-medium flex items-center gap-1.5 text-right">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </p>
              )}
            </div>
          </form>
        </Reveal>
      </Container>
    </section>
  );
}

function Field({
  label,
  name,
  type = "text",
  placeholder,
  value,
  onChange,
  onBlur,
  error,
  touched,
  required = true,
  maxLength,
  minLength,
  disabled,
}: {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  error?: string;
  touched?: boolean;
  required?: boolean;
  maxLength?: number;
  minLength?: number;
  disabled?: boolean;
}) {
  const hasError = Boolean(error && touched);

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label htmlFor={`register-${name}`} className="block text-xs font-semibold uppercase tracking-widest text-slate-body">
          {label} {required && <span className="text-red-500">*</span>}
        </Label>
        {maxLength && value.length > maxLength * 0.8 && (
          <span className="text-[10px] font-mono text-muted-foreground">
            {value.length}/{maxLength}
          </span>
        )}
      </div>
      <Input
        id={`register-${name}`}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        placeholder={placeholder}
        maxLength={maxLength}
        minLength={minLength}
        disabled={disabled}
        aria-invalid={hasError}
        aria-describedby={hasError ? `register-${name}-error` : undefined}
        className={`h-12 rounded-xl border px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground shadow-xs focus-visible:outline-none focus-visible:ring-2 transition ${
          hasError
            ? "border-red-500 bg-red-50/20 focus-visible:border-red-500 focus-visible:ring-red-200 text-red-900"
            : "bg-slate-50 border-slate-200 focus-visible:border-brand focus-visible:bg-white focus-visible:ring-brand/20"
        }`}
      />
      {hasError && (
        <p id={`register-${name}-error`} role="alert" className="text-xs text-red-500 font-medium flex items-center gap-1 mt-1">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}

function ContactSection() {
  const { t, i18n } = useTranslation();
  const { config } = useWebsiteConfiguration();
  const currentLang = (i18n.language || "en").split("-")[0];
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [formValues, setFormValues] = useState({
    name: "",
    email: "",
    message: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (sent) {
      const timer = setTimeout(() => {
        setSent(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [sent]);

  const validate = (values: typeof formValues): Record<string, string> => {
    const errs: Record<string, string> = {};

    const name = values.name.trim();
    if (!name) {
      errs.name = t("contact.errNameRequired");
    } else if (name.length < 2) {
      errs.name = t("contact.errNameMin");
    } else if (name.length > 60) {
      errs.name = t("contact.errNameMax");
    } else if (!NAME_REGEX.test(name)) {
      errs.name = t("contact.errNameFormat");
    }

    const email = values.email.trim();
    if (!email) {
      errs.email = t("contact.errEmailRequired");
    } else if (email.length > 100) {
      errs.email = t("contact.errEmailMax");
    } else if (!EMAIL_REGEX.test(email)) {
      errs.email = t("contact.errEmailInvalid");
    }

    const message = values.message.trim();
    if (!message) {
      errs.message = t("contact.errMessageRequired");
    } else if (message.length < 10) {
      errs.message = t("contact.errMessageMin");
    } else if (message.length > 1000) {
      errs.message = t("contact.errMessageMax");
    }

    return errs;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    const nextValues = { ...formValues, [name]: value };
    setFormValues(nextValues);

    if (touched[name]) {
      const nextErrors = validate(nextValues);
      setErrors((prev) => ({
        ...prev,
        [name]: nextErrors[name] || "",
      }));
    }
  };

  const handleBlur = (
    e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    const nextErrors = validate(formValues);
    setErrors((prev) => ({
      ...prev,
      [name]: nextErrors[name] || "",
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSent(false);

    const validationErrors = validate(formValues);
    setErrors(validationErrors);
    setTouched({
      name: true,
      email: true,
      message: true,
    });

    if (Object.keys(validationErrors).length > 0) {
      const firstKey = Object.keys(validationErrors)[0];
      const targetElem = document.getElementById(`contact-${firstKey}`);
      targetElem?.focus();
      return;
    }

    setLoading(true);

    try {
      await submitSupportMessage({
        name: formValues.name.trim(),
        email: formValues.email.trim(),
        message: formValues.message.trim(),
      });
      setSent(true);
      setFormValues({
        name: "",
        email: "",
        message: "",
      });
      setTouched({});
      setErrors({});
    } catch (err: any) {
      setError(err?.message || t("contact.errorDefault"));
    } finally {
      setLoading(false);
    }
  };

  const supportEmail = config?.contact?.email || "info@ctasis.com";
  const workingHours =
    currentLang === "en" && config?.contact?.working_hours
      ? config.contact.working_hours
      : t("contact.salesHours");

  const headOffice =
    currentLang === "en"
      ? (() => {
          if (
            config?.contact?.city ||
            config?.contact?.state ||
            config?.contact?.country
          ) {
            const cityState = [config.contact.city, config.contact.state]
              .filter(Boolean)
              .join(", ");
            return (
              [cityState, config.contact.country].filter(Boolean).join(" · ") ||
              config.contact.address ||
              t("contact.officeLocation")
            );
          }
          return config?.contact?.address || t("contact.officeLocation");
        })()
      : t("contact.officeLocation");

  const isMessageError = Boolean(errors.message && touched.message);

  return (
    <section id="contact" className="relative py-12 lg:py-16 bg-surface">
      <Container className="grid lg:grid-cols-12 gap-8 items-start">
        <Reveal className="lg:col-span-7 order-2 lg:order-1">
          <form
            noValidate
            onSubmit={handleSubmit}
            className="rounded-3xl border border-border bg-white p-6 sm:p-8 lg:p-8 space-y-5 sm:space-y-6 shadow-sm"
          >
            <div className="mb-6 sm:mb-7">
              <h3 className="text-xl sm:text-2xl font-bold text-navy-deep">
                {t("contact.formTitle")}
              </h3>
              <p className="mt-1.5 text-sm text-slate-body">
                {t("contact.formSubtitle")}
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-5">
              <PlainField
                label={t("contact.fieldName")}
                name="name"
                value={formValues.name}
                onChange={handleChange}
                onBlur={handleBlur}
                error={errors.name}
                touched={touched.name}
                required
                minLength={2}
                maxLength={60}
                disabled={loading}
              />
              <PlainField
                label={t("contact.fieldEmail")}
                name="email"
                type="email"
                value={formValues.email}
                onChange={handleChange}
                onBlur={handleBlur}
                error={errors.email}
                touched={touched.email}
                required
                maxLength={100}
                disabled={loading}
              />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label
                  htmlFor="contact-message"
                  className="block text-xs font-semibold uppercase tracking-widest text-slate-body"
                >
                  {t("contact.fieldMessage")} <span className="text-red-500">*</span>
                </Label>
                <span
                  className={`text-[11px] font-mono ${
                    formValues.message.length > 950
                      ? "text-amber-600 font-semibold"
                      : "text-muted-foreground"
                  }`}
                >
                  {formValues.message.length}/1000
                </span>
              </div>
              <Textarea
                id="contact-message"
                name="message"
                rows={5}
                value={formValues.message}
                onChange={handleChange}
                onBlur={handleBlur}
                maxLength={1000}
                minLength={10}
                disabled={loading}
                placeholder={t(
                  "contact.fieldMessagePlaceholder",
                  "Tell us about your project, quantity, timeline, or design ideas..."
                )}
                aria-invalid={isMessageError}
                aria-describedby={isMessageError ? "contact-message-error" : undefined}
                className={`w-full min-h-[140px] rounded-xl border px-4 py-3.5 text-sm text-navy-deep placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 resize-y transition ${
                  isMessageError
                    ? "border-red-500 bg-red-50/20 focus-visible:border-red-500 focus-visible:ring-red-200 text-red-900"
                    : "border-border bg-white focus-visible:border-brand focus-visible:ring-brand/20"
                }`}
              />
              {isMessageError && (
                <p
                  id="contact-message-error"
                  role="alert"
                  className="text-xs text-red-500 font-medium flex items-center gap-1 mt-1"
                >
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{errors.message}</span>
                </p>
              )}
            </div>
            <div className="flex flex-col items-end pt-2">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-full btn-glass-primary !py-3.5 px-7 text-sm font-bold !text-white shadow-md hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 cursor-pointer"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin text-white" />}
                <span className="!text-white">
                  {loading ? t("contact.submitSending") : t("contact.submitLabel")}
                </span>
              </button>
              {sent && (
                <p className="text-sm text-emerald-600 font-medium flex items-center gap-1.5 text-right mt-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{t("contact.successMessage")}</span>
                </p>
              )}
              {error && (
                <p className="text-sm text-red-500 font-medium flex items-center gap-1.5 text-right mt-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </p>
              )}
            </div>
          </form>
        </Reveal>
        <Reveal className="lg:col-span-5 order-1 lg:order-2" delay={80}>
          <span className="section-badge mb-3">
            {t("contact.sectionLabel")}
          </span>
          <h2 className="mt-3 text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-navy-deep leading-tight">
            {t("contact.heading")}
          </h2>
          <p className="mt-5 text-slate-body leading-[1.7] text-base sm:text-lg">
            {t("contact.description")}
          </p>
          <ul className="mt-10 space-y-5 text-sm">
            <li className="flex gap-4 items-start">
              <span className="grid place-items-center h-10 w-10 rounded-xl bg-brand/10 text-brand shrink-0">
                <Mail className="h-4 w-4" />
              </span>
              <div>
                <p className="font-semibold text-navy-deep">{t("contact.supportEmail")}</p>
                <a
                  href={`mailto:${supportEmail}`}
                  className="text-slate-body hover:text-brand transition-colors"
                >
                  {supportEmail}
                </a>
              </div>
            </li>
            <li className="flex gap-4 items-start">
              <span className="grid place-items-center h-10 w-10 rounded-xl bg-brand/10 text-brand shrink-0">
                <Phone className="h-4 w-4" />
              </span>
              <div>
                <p className="font-semibold text-navy-deep">{t("contact.sales")}</p>
                <p className="text-slate-body">{workingHours}</p>
              </div>
            </li>
            <li className="flex gap-4 items-start">
              <span className="grid place-items-center h-10 w-10 rounded-xl bg-brand/10 text-brand shrink-0">
                <MapPin className="h-4 w-4" />
              </span>
              <div>
                <p className="font-semibold text-navy-deep">{t("contact.headOffice")}</p>
                <p className="text-slate-body">{headOffice}</p>
              </div>
            </li>
          </ul>
        </Reveal>
      </Container>
    </section>
  );
}

function PlainField({
  label,
  name,
  type = "text",
  placeholder,
  value,
  onChange,
  onBlur,
  error,
  touched,
  required = true,
  maxLength,
  minLength,
  disabled,
}: {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  error?: string;
  touched?: boolean;
  required?: boolean;
  maxLength?: number;
  minLength?: number;
  disabled?: boolean;
}) {
  const hasError = Boolean(error && touched);

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label htmlFor={`contact-${name}`} className="block text-xs font-semibold uppercase tracking-widest text-slate-body">
          {label} {required && <span className="text-red-500">*</span>}
        </Label>
        {maxLength && value.length > maxLength * 0.8 && (
          <span className="text-[10px] font-mono text-muted-foreground">
            {value.length}/{maxLength}
          </span>
        )}
      </div>
      <Input
        id={`contact-${name}`}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        placeholder={placeholder}
        maxLength={maxLength}
        minLength={minLength}
        disabled={disabled}
        aria-invalid={hasError}
        aria-describedby={hasError ? `contact-${name}-error` : undefined}
        className={`h-12 rounded-xl border px-4 py-3 text-sm text-navy-deep placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 shadow-none transition ${
          hasError
            ? "border-red-500 bg-red-50/20 focus-visible:border-red-500 focus-visible:ring-red-200 text-red-900"
            : "border-border bg-white focus-visible:border-brand focus-visible:ring-brand/20"
        }`}
      />
      {hasError && (
        <p id={`contact-${name}-error`} role="alert" className="text-xs text-red-500 font-medium flex items-center gap-1 mt-1">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}
