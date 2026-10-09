import { createFileRoute, Link } from "@tanstack/react-router";
import { XCircle } from "lucide-react";
import { Nav } from "@/components/site/Nav";
import { Footer } from "@/components/site/Footer";
import { Container } from "@/components/site/Container";

export const Route = createFileRoute("/payment/cancel")({
  component: PaymentCancelPage,
});

function PaymentCancelPage() {
  return (
    <div className="min-h-screen bg-surface text-navy-deep flex flex-col">
      <Nav />
      <main className="flex-1 pt-28 pb-16">
        <Container className="max-w-xl">
          <div className="rounded-3xl border border-border bg-white p-8 sm:p-10 shadow-sm text-center">
            <XCircle className="mx-auto h-14 w-14 text-rose-500" />
            <h1 className="mt-6 text-2xl font-extrabold">Checkout canceled</h1>
            <p className="mt-2 text-slate-body text-sm leading-relaxed">
              No charge was made. You can pick a plan again whenever you are ready - payment goes
              through Stripe Checkout securely.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link
                to="/"
                hash="pricing"
                className="inline-flex rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white hover:bg-brand-bright transition"
              >
                Choose a plan
              </Link>
              <Link
                to="/"
                hash="contact"
                className="inline-flex rounded-full border border-border px-6 py-3 text-sm font-semibold text-navy-deep hover:bg-surface-alt transition"
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
