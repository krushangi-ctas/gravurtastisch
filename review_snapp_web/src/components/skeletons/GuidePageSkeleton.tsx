import { Container } from "@/components/site/Container";
import { Skeleton } from "@/components/ui/skeleton";
import { Nav } from "@/components/site/Nav";
import { Footer } from "@/components/site/Footer";

export function GuidePageSkeleton() {
  return (
    <div className="min-h-screen bg-background text-navy-deep overflow-hidden">
      {/* Real Nav Header */}
      <Nav />

      {/* Guide Hero Skeleton */}
      <section className="relative pt-32 pb-20 lg:pt-36 lg:pb-24 bg-gradient-to-b from-navy-deep via-navy to-navy-soft text-white">
        <Container className="text-center max-w-3xl space-y-5">
          <Skeleton className="h-6 w-32 rounded-full bg-white/15 mx-auto" />
          <Skeleton className="h-10 sm:h-12 w-3/4 bg-white/20 rounded-2xl mx-auto" />
          <Skeleton className="h-4 w-full max-w-xl bg-white/10 mx-auto" />
        </Container>
      </section>

      {/* Guide Navigation Tabs Skeleton */}
      <section className="py-6 border-b border-border bg-white sticky top-0 z-20">
        <Container>
          <div className="flex gap-4 overflow-x-auto pb-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-10 w-32 rounded-xl bg-slate-200 shrink-0" />
            ))}
          </div>
        </Container>
      </section>

      {/* Guide Steps Body Skeleton */}
      <section className="py-14 bg-surface-alt">
        <Container className="max-w-4xl space-y-8">
          {[1, 2, 3].map((step) => (
            <div key={step} className="p-8 rounded-3xl border border-slate-200 bg-white space-y-4 shadow-sm">
              <div className="flex items-center gap-3">
                <Skeleton className="h-8 w-8 rounded-full bg-brand/20" />
                <Skeleton className="h-6 w-48 bg-slate-200" />
              </div>
              <Skeleton className="h-16 w-full bg-slate-100 rounded-xl" />
              <Skeleton className="h-48 w-full bg-slate-200 rounded-2xl" />
            </div>
          ))}
        </Container>
      </section>

      {/* Real Footer */}
      <Footer />
    </div>
  );
}
