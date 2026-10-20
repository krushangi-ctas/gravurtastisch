import { useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { XCircle } from "lucide-react";
import { Nav } from "@/components/site/Nav";
import { Footer } from "@/components/site/Footer";
import { Container } from "@/components/site/Container";
import { cancelPaymentSession } from "@/lib/api";

type PaymentCancelSearch = {
  session_id?: string;
  plan?: string;
  email?: string;
};

export const Route = createFileRoute("/payment/cancel")({
  validateSearch: (search: Record<string, unknown>): PaymentCancelSearch => ({
    session_id: typeof search.session_id === "string" ? search.session_id : undefined,
    plan: typeof search.plan === "string" ? search.plan : undefined,
    email: typeof search.email === "string" ? search.email : undefined,
  }),
  component: PaymentCancelPage,
});

function PaymentCancelPage() {
  const { session_id, plan, email } = Route.useSearch();

  useEffect(() => {
    if (session_id || plan || email) {
      cancelPaymentSession({
        sessionId: session_id,
        planId: plan,
        email,
      }).catch((err) => {
        console.warn("Payment cancellation sync error:", err);
      });
    }
  }, [session_id, plan, email]);

  return (
    <div className="min-h-screen bg-surface text-navy-deep flex flex-col">
      <Nav />
      <main className="flex-1 pt-28 pb-16">
        <Container className="max-w-xl">
          <div className="rounded-3xl border border-rose-100 bg-white p-8 sm:p-10 shadow-sm text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-rose-50 text-rose-500">
              <XCircle className="h-10 w-10 text-rose-500" />
            </div>
            <h1 className="mt-5 text-2xl font-extrabold text-navy-deep">
              Checkout canceled
            </h1>
            <p className="mt-2 text-slate-body text-sm leading-relaxed">
              No charge was made. Your registration has been saved as inactive.
              You can complete your subscription anytime whenever you are ready.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link
                to="/"
                hash="pricing"
                className="inline-flex rounded-full btn-glass-primary px-6 py-3 text-sm font-bold !text-white transition"
              >
                Choose a plan
              </Link>
              <Link
                to="/"
                hash="contact"
                className="inline-flex rounded-full border border-border px-6 py-3 text-sm font-semibold text-foreground hover:bg-surface-alt transition"
              >
                Talk to us
              </Link>
            </div>
          </div>
        </Container>
      </main>
      <Footer />
    </div>
  );
}
