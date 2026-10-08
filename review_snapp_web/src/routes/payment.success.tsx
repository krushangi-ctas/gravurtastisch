import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
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
  const { session_id: sessionId } = Route.useSearch();
  const [state, setState] = useState<"loading" | "paid" | "pending" | "error">(
    "loading"
  );
  const [planName, setPlanName] = useState("");
  const [amount, setAmount] = useState<number | null>(null);
  const [message, setMessage] = useState("");

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
                <h1 className="mt-6 text-2xl font-extrabold">Confirming payment…</h1>
                <p className="mt-2 text-slate-body text-sm">
                  Checking Stripe and our webhook acknowledgement.
                </p>
              </>
            )}

            {state === "paid" && (
              <>
                <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-500" />
                <h1 className="mt-6 text-2xl font-extrabold">Payment received</h1>
                <p className="mt-2 text-slate-body text-sm leading-relaxed">
                  Thanks{planName ? ` — your ${planName} plan` : ""} is confirmed
                  {amount != null ? ` ($${amount}/mo)` : ""}. Our backend recorded this via
                  Stripe webhook, so it stays acknowledged even if the browser closed mid-checkout.
                </p>
              </>
            )}

            {state === "pending" && (
              <>
                <Loader2 className="mx-auto h-12 w-12 text-brand animate-spin" />
                <h1 className="mt-6 text-2xl font-extrabold">Almost there</h1>
                <p className="mt-2 text-slate-body text-sm leading-relaxed">
                  {message ||
                    "Stripe is finalizing. Our webhook will mark the payment paid in the background."}
                </p>
              </>
            )}

            {state === "error" && (
              <>
                <AlertCircle className="mx-auto h-12 w-12 text-amber-500" />
                <h1 className="mt-6 text-2xl font-extrabold">Status check issue</h1>
                <p className="mt-2 text-slate-body text-sm leading-relaxed">{message}</p>
              </>
            )}

            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link
                to="/"
                hash="pricing"
                className="inline-flex rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white hover:bg-brand-bright transition"
              >
                Back to pricing
              </Link>
              <Link
                to="/"
                hash="contact"
                className="inline-flex rounded-full border border-border px-6 py-3 text-sm font-semibold text-navy-deep hover:bg-surface-alt transition"
              >
                Contact support
              </Link>
            </div>
          </div>
        </Container>
      </main>
      <Footer />
    </div>
  );
}
