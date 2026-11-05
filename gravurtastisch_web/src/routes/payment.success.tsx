import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { Nav } from "@/components/site/Nav";
import { Footer } from "@/components/site/Footer";
import { Container } from "@/components/site/Container";
import { getPaymentSession } from "@/lib/api";

export const Route = createFileRoute("/payment/success")({
  validateSearch: (search: Record<string, unknown>) => ({
    session_id: typeof search.session_id === "string" ? search.session_id : "",
  }),
  component: PaymentSuccessPage,
});

function PaymentSuccessPage() {
  const { t } = useTranslation();
  const { session_id: sessionId } = Route.useSearch();
  const [state, setState] = useState<"loading" | "paid" | "pending" | "error">(
    "loading"
  );
  const [planName, setPlanName] = useState("");
  const [amount, setAmount] = useState<number | null>(null);
  const [billingCycle, setBillingCycle] = useState<number>(1);
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [siteUrl, setSiteUrl] = useState("");
  const [sellerPanelUrl, setSellerPanelUrl] = useState("");

  useEffect(() => {
    if (!sessionId) {
      setState("error");
      setMessage("Missing checkout session. If you paid, our webhook still recorded it.");
      return;
    }

    let cancelled = false;
    let attempts = 0;

    async function poll() {
      try {
        const res = await getPaymentSession(sessionId);
        if (cancelled) return;
        const status = res.data?.status;
        setPlanName(res.data?.planName || "");
        setAmount(typeof res.data?.amount === "number" ? res.data.amount : null);
        if (res.data?.billingCycle) {
          setBillingCycle(Number(res.data.billingCycle) || 1);
        }
        if (res.data?.email) {
          setEmail(res.data.email);
        }
        if (res.data?.sellerPanelUrl) {
          setSellerPanelUrl(res.data.sellerPanelUrl);
        }
        if (res.data?.siteUrl) {
          setSiteUrl(res.data.siteUrl);
        }

        if (status === "paid") {
          setState("paid");
          return;
        }

        attempts += 1;
        if (attempts < 8) {
          setState("pending");
          setTimeout(poll, 1500);
        } else {
          setState("pending");
          setMessage(
            "Payment is processing. Even if you close this tab, Stripe will notify our server via webhook."
          );
        }
      } catch (err) {
        if (cancelled) return;
        setState("error");
        setMessage(
          err instanceof Error
            ? err.message
            : "Could not verify payment status. Webhook will still confirm if payment succeeded."
        );
      }
    }

    poll();
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  return (
    <div className="min-h-screen bg-surface text-navy-deep flex flex-col">
      <Nav />
      <main className="flex-1 pt-28 pb-16">
        <Container className="max-w-xl">
          <div className="rounded-3xl border border-border bg-white p-8 sm:p-10 shadow-sm text-center">
            {state === "loading" && (
              <>
                <Loader2 className="mx-auto h-12 w-12 text-brand animate-spin" />
                <h1 className="mt-6 text-2xl font-extrabold">{t('payment.confirmingTitle', 'Confirming payment…')}</h1>
                <p className="mt-2 text-slate-body text-sm">
                  {t('payment.confirmingDesc', 'Checking Stripe and our webhook acknowledgement.')}
                </p>
              </>
            )}

            {state === "paid" && (
              <>
                <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-500" />
                <h1 className="mt-6 text-2xl font-extrabold">{t('payment.paidTitle', 'Payment received')}</h1>
                <p className="mt-2 text-slate-body text-sm leading-relaxed">
                  {t('payment.paidThanks', 'Thanks')}{planName ? ` - ${t('payment.paidPlanConfirmed', 'your plan is confirmed')} (${planName})` : ""}
                  {amount != null
                    ? ` ($${amount}${billingCycle === 3
                      ? "/yr"
                      : billingCycle === 2
                        ? "/qtr"
                        : "/mo"
                    })`
                    : ""}. {t('payment.paidEmailNotice', 'A confirmation email with your payment details and panel access has been sent to')} {email ? <strong className="text-navy-deep">{email}</strong> : t('payment.registeredEmail', 'your registered email')}.
                </p>
              </>
            )}

            {state === "pending" && (
              <>
                <Loader2 className="mx-auto h-12 w-12 text-brand animate-spin" />
                <h1 className="mt-6 text-2xl font-extrabold">{t('payment.pendingTitle', 'Almost there')}</h1>
                <p className="mt-2 text-slate-body text-sm leading-relaxed">
                  {message ||
                    t('payment.pendingDesc', 'Stripe is finalizing. Our webhook will mark the payment paid in the background.')}
                </p>
              </>
            )}

            {state === "error" && (
              <>
                <AlertCircle className="mx-auto h-12 w-12 text-amber-500" />
                <h1 className="mt-6 text-2xl font-extrabold">{t('payment.errorTitle', 'Status check issue')}</h1>
                <p className="mt-2 text-slate-body text-sm leading-relaxed">{message}</p>
              </>
            )}

            <div className="mt-8 flex flex-wrap justify-center gap-3">
              {state === "paid" ? (
                <>
                  {(() => {
                    const panelTarget = (
                      sellerPanelUrl ||
                      (import.meta as any).env?.VITE_PANEL_URL ||
                      (import.meta as any).env?.VITE_SELLER_PANEL_URL ||
                      (import.meta as any).env?.VITE_SITE_URL ||
                      siteUrl ||
                      ""
                    ).trim().replace(/\/+$/, "");
                    const resolvedSignInUrl = panelTarget.endsWith("/sign-in")
                      ? panelTarget
                      : `${panelTarget}/sign-in`;

                    return (
                      <a
                        href={resolvedSignInUrl}
                        className="inline-flex items-center gap-2 rounded-full btn-glass-primary px-7 py-3 text-sm font-bold !text-white transition shadow-md"
                      >
                        <span>{t('payment.goToPanel', 'Go to Seller Panel')}</span>
                        <span>→</span>
                      </a>
                    );
                  })()}
                  <Link
                    to="/"
                    className="inline-flex items-center rounded-full border border-border px-6 py-3 text-sm font-semibold text-foreground hover:bg-surface-alt transition"
                  >
                    {t('payment.backHome', 'Back to Home')}
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    to="/"
                    hash="pricing"
                    className="inline-flex rounded-full btn-glass-primary px-6 py-3 text-sm font-bold !text-white transition"
                  >
                    {t('pricing.sectionLabel', 'Pricing')}
                  </Link>
                  <Link
                    to="/"
                    hash="contact"
                    className="inline-flex rounded-full border border-border px-6 py-3 text-sm font-semibold text-navy-deep hover:bg-surface-alt transition"
                  >
                    {t('contact.sectionLabel', 'Contact')}
                  </Link>
                </>
              )}
            </div>
          </div>
        </Container>
      </main>
      <Footer />
    </div>
  );
}
