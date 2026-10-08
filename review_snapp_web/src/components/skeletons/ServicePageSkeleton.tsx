import { Container } from "@/components/site/Container";
import { Skeleton } from "@/components/ui/skeleton";
import { Nav } from "@/components/site/Nav";
import { Footer } from "@/components/site/Footer";

export function ServicePageSkeleton() {
  return (
    <div className="min-h-screen bg-background text-navy-deep overflow-hidden">
      {/* Real Nav Header */}
      <Nav />

      {/* Service Hero Skeleton */}
      <section className="relative pt-32 pb-20 lg:pt-36 lg:pb-24 bg-gradient-to-b from-navy-deep via-navy to-navy-soft text-white">
        <Container className="grid lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-6 space-y-6">
            <Skeleton className="h-6 w-36 rounded-full bg-white/15" />
            <div className="space-y-3">
              <Skeleton className="h-10 sm:h-12 w-4/5 bg-white/20 rounded-2xl" />
              <Skeleton className="h-10 sm:h-12 w-3/5 bg-white/20 rounded-2xl" />
            </div>
            <Skeleton className="h-4 w-full max-w-lg bg-white/10" />
            <Skeleton className="h-4 w-3/4 max-w-md bg-white/10" />
            <div className="flex gap-4 pt-2">
              <Skeleton className="h-11 w-36 rounded-full bg-brand/50" />
              <Skeleton className="h-11 w-32 rounded-full bg-white/10" />
            </div>
          </div>
          <div className="lg:col-span-6">
            <Skeleton className="h-80 w-full rounded-3xl bg-white/10 border border-white/15" />
          </div>
        </Container>
      </section>

      {/* Highlights Grid Skeleton */}
      <section className="py-16 bg-surface border-b border-border">
        <Container>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-7 rounded-2xl border border-slate-200 bg-white space-y-3 shadow-sm">
                <Skeleton className="h-10 w-10 rounded-xl bg-brand/10" />
                <Skeleton className="h-5 w-40 bg-slate-200" />
                <Skeleton className="h-10 w-full bg-slate-100" />
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Interactive Terminal / Showcase Skeleton */}
      <section className="py-16 bg-surface-alt">
        <Container className="grid lg:grid-cols-2 gap-10 items-center">
          <div className="space-y-4">
            <Skeleton className="h-4 w-28 bg-brand/20" />
            <Skeleton className="h-8 w-72 bg-slate-200" />
            <Skeleton className="h-16 w-full bg-slate-100" />
          </div>
          <Skeleton className="h-80 w-full rounded-3xl bg-white border border-slate-200 shadow-md" />
        </Container>
      </section>

      {/* Real Footer */}
      <Footer />
    </div>
  );
}
