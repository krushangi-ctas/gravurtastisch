import { useState } from "react";
import { useTranslation } from "react-i18next";
import { registerSeller, submitSupportMessage } from "@/lib/api";
import { useWebsiteConfiguration } from "@/hooks/useWebsiteConfiguration";
import { Mail, MapPin, Phone } from "lucide-react";
import { Container } from "./Container";
import { Reveal } from "./Reveal";
import { FlagIcon } from "@/components/ui/FlagIcon";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export function RegisterAndContact() {
  return (
    <>
      <RegisterSection />
      <ContactSection />
    </>
  );
}

function RegisterSection() {
  const { t } = useTranslation();
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSent(false);

    const form = e.currentTarget;
    const formData = new FormData(form);
    const business = formData.get("business") as string;
    const seller = formData.get("seller") as string;
    const email = formData.get("email") as string;
    const phone = (formData.get("phone") as string) || "";

    try {
      await registerSeller({ business, seller, email, phone, marketplaces: [] });
      setSent(true);
      form.reset();
    } catch (err: any) {
      setError(err?.message || t('register.errorDefault'));
    } finally {
      setLoading(false);
    }
  };

  const listItems = [t('register.listItem1'), t('register.listItem2'), t('register.listItem3')];

  return (
    <section id="register" className="relative py-12 lg:py-16 bg-white">
      <Container className="grid lg:grid-cols-12 gap-8">
        <Reveal className="lg:col-span-5">
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-brand">
            {t('register.sectionLabel')}
          </span>
          <h2 className="mt-4 text-2xl sm:text-3xl lg:text-4xl font-extrabold text-navy-deep leading-tight">
            {t('register.heading1')}
            <br />
            {t('register.heading2')}
          </h2>
          <p className="mt-6 text-slate-body leading-[1.75] text-base sm:text-lg">
            {t('register.description')}
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
            onSubmit={handleSubmit}
            className="rounded-3xl bg-navy-deep text-white p-8 lg:p-10 relative overflow-hidden"
          >
            <div className="absolute inset-0 noise-bg opacity-70" aria-hidden />
            <div className="relative grid sm:grid-cols-2 gap-5">
              <Field label={t('register.fieldBusinessName')} name="business" placeholder={t('register.fieldBusinessPlaceholder')} />
              <Field label={t('register.fieldSellerName')} name="seller" placeholder={t('register.fieldSellerPlaceholder')} />
              <Field label={t('register.fieldEmail')} name="email" type="email" placeholder={t('register.fieldEmailPlaceholder')} />
              <Field label={t('register.fieldPhone')} name="phone" placeholder={t('register.fieldPhonePlaceholder')} />

              <div className="sm:col-span-2">
                <p className="text-xs font-semibold uppercase tracking-widest text-white/50 mb-2.5">
                  {t('register.marketplacesLabel')} <span className="normal-case font-normal">({t('register.configuredAfter')})</span>
                </p>
                <div className="flex flex-wrap gap-2">
                  {["US", "CA", "MX", "UK", "DE", "FR", "IT", "ES", "JP", "AE", "IN"].map((m) => (
                    <span
                      key={m}
                      className="inline-flex items-center gap-1.5 rounded-full bg-white/10 border border-white/15 px-3 py-1.5 text-xs font-mono font-medium text-white/90 select-none cursor-default shadow-xs"
                    >
                      <FlagIcon code={m} className="w-3.5 h-2.5 rounded-[2px]" />
                      <span>{m}</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="relative mt-9 inline-flex items-center gap-2 rounded-full bg-brand-bright px-7 py-3.5 text-sm font-semibold text-white shadow-[0_18px_40px_-12px_oklch(0.60_0.24_264/0.7)] hover:bg-brand hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:pointer-events-none"
            >
              {loading ? t('register.submitSending') : t('register.submitLabel')}
            </button>
            {sent && (
              <p className="relative mt-4 text-sm text-emerald-300">
                ✓ {t('register.successMessage')}
              </p>
            )}
            {error && (
              <p className="relative mt-4 text-sm text-red-400">
                ✗ {error}
              </p>
            )}
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
}: {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name} className="block text-xs font-semibold uppercase tracking-widest text-white/70">
        {label}
      </Label>
      <Input
        id={name}
        name={name}
        type={type}
        required={type !== "tel" && name !== "phone"}
        placeholder={placeholder}
        className="h-12 rounded-xl bg-white/5 border-white/15 px-4 py-3 text-sm text-white placeholder:text-white/35 shadow-none focus-visible:outline-none focus-visible:border-brand-bright focus-visible:bg-white/10 focus-visible:ring-2 focus-visible:ring-brand-bright/30 transition"
      />
    </div>
  );
}

function ContactSection() {
  const { t, i18n } = useTranslation();
  const { config } = useWebsiteConfiguration();
  const currentLang = (i18n.language || 'en').split('-')[0];
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSent(false);

    const form = e.currentTarget;
    const formData = new FormData(form);
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const message = formData.get("message") as string;

    try {
      await submitSupportMessage({ name, email, message });
      setSent(true);
      form.reset();
    } catch (err: any) {
      setError(err?.message || t('contact.errorDefault'));
    } finally {
      setLoading(false);
    }
  };

  const supportEmail = config?.contact?.email || "info@ctasis.com";
  const workingHours = currentLang === 'en' && config?.contact?.working_hours
    ? config.contact.working_hours
    : t('contact.salesHours');

  const headOffice = currentLang === 'en'
    ? (() => {
        if (config?.contact?.city || config?.contact?.state || config?.contact?.country) {
          const cityState = [config.contact.city, config.contact.state].filter(Boolean).join(", ");
          return [cityState, config.contact.country].filter(Boolean).join(" · ") || config.contact.address || t('contact.officeLocation');
        }
        return config?.contact?.address || t('contact.officeLocation');
      })()
    : t('contact.officeLocation');

  return (
    <section id="contact" className="relative py-12 lg:py-16 bg-surface">
      <Container className="grid lg:grid-cols-12 gap-8 items-start">
        <Reveal className="lg:col-span-7 order-2 lg:order-1">
          <form
            onSubmit={handleSubmit}
            className="rounded-3xl border border-border bg-white p-6 sm:p-8 lg:p-8 space-y-5 sm:space-y-6 shadow-sm"
          >
            <div className="mb-6 sm:mb-7">
              <h3 className="text-xl sm:text-2xl font-bold text-navy-deep">{t('contact.formTitle')}</h3>
              <p className="mt-1.5 text-sm text-slate-body">{t('contact.formSubtitle')}</p>
            </div>

            <div className="grid sm:grid-cols-2 gap-5">
              <PlainField label={t('contact.fieldName')} name="name" />
              <PlainField label={t('contact.fieldEmail')} name="email" type="email" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="message" className="block text-xs font-semibold uppercase tracking-widest text-slate-body">
                {t('contact.fieldMessage')}
              </Label>
              <Textarea
                id="message"
                name="message"
                rows={5}
                required
                className="w-full min-h-[140px] rounded-xl border border-border bg-white px-4 py-3.5 text-sm text-navy-deep placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/20 resize-y"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-full bg-navy-deep px-7 py-3.5 text-sm font-semibold text-white hover:bg-brand hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50"
            >
              {loading ? t('contact.submitSending') : t('contact.submitLabel')}
            </button>
            {sent && (
              <p className="text-sm text-emerald-600 font-medium">
                ✓ {t('contact.successMessage')}
              </p>
            )}
            {error && (
              <p className="text-sm text-red-500 font-medium">✗ {error}</p>
            )}
          </form>
        </Reveal>
        <Reveal className="lg:col-span-5 order-1 lg:order-2" delay={80}>
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-brand">
            {t('contact.sectionLabel')}
          </span>
          <h2 className="mt-3 text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-navy-deep leading-tight">
            {t('contact.heading')}
          </h2>
          <p className="mt-5 text-slate-body leading-[1.7] text-base sm:text-lg">
            {t('contact.description')}
          </p>
          <ul className="mt-10 space-y-5 text-sm">
            <li className="flex gap-4 items-start">
              <span className="grid place-items-center h-10 w-10 rounded-xl bg-brand/10 text-brand shrink-0">
                <Mail className="h-4 w-4" />
              </span>
              <div>
                <p className="font-semibold text-navy-deep">{t('contact.supportEmail')}</p>
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
                <p className="font-semibold text-navy-deep">{t('contact.sales')}</p>
                <p className="text-slate-body">{workingHours}</p>
              </div>
            </li>
            <li className="flex gap-4 items-start">
              <span className="grid place-items-center h-10 w-10 rounded-xl bg-brand/10 text-brand shrink-0">
                <MapPin className="h-4 w-4" />
              </span>
              <div>
                <p className="font-semibold text-navy-deep">{t('contact.headOffice')}</p>
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
}: {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name} className="block text-xs font-semibold uppercase tracking-widest text-slate-body">
        {label}
      </Label>
      <Input
        id={name}
        name={name}
        type={type}
        required
        placeholder={placeholder}
        className="h-12 rounded-xl border border-border bg-white px-4 py-3 text-sm text-navy-deep placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/20 shadow-none"
      />
    </div>
  );
}
