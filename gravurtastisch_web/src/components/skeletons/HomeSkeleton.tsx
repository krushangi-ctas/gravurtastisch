import { Container } from "@/components/site/Container";
import { Skeleton } from "@/components/ui/skeleton";
import { Nav } from "@/components/site/Nav";
import { Footer } from "@/components/site/Footer";

export function HomeSkeleton() {
  return (
    <div className="min-h-screen bg-background text-navy-deep overflow-hidden">
      {/* Real Functional Navigation Header */}
      <Nav />

      {/* 1. Hero Skeleton */}
      <section className="relative pt-32 pb-20 lg:pt-36 lg:pb-24 bg-gradient-to-b from-navy-deep via-navy to-navy-soft text-white">
        <Container className="grid lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-6 xl:col-span-7 space-y-6">
            <Skeleton className="h-7 w-48 rounded-full bg-white/15" />
            <div className="space-y-3">
              <Skeleton className="h-12 sm:h-14 w-4/5 bg-white/20 rounded-2xl" />
              <Skeleton className="h-12 sm:h-14 w-3/5 bg-white/20 rounded-2xl" />
            </div>
            <div className="space-y-2 pt-2">
              <Skeleton className="h-4 w-full max-w-lg bg-white/10" />
              <Skeleton className="h-4 w-4/5 max-w-md bg-white/10" />
            </div>
            <div className="flex gap-4 pt-4">
              <Skeleton className="h-12 w-44 rounded-full bg-brand/60" />
              <Skeleton className="h-12 w-36 rounded-full bg-white/15" />
            </div>
            <div className="flex gap-10 pt-6">
              <div className="space-y-2">
                <Skeleton className="h-8 w-16 bg-white/20" />
                <Skeleton className="h-3 w-20 bg-white/10" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-8 w-16 bg-white/20" />
                <Skeleton className="h-3 w-20 bg-white/10" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-8 w-16 bg-white/20" />
                <Skeleton className="h-3 w-20 bg-white/10" />
              </div>
            </div>
          </div>
          <div className="lg:col-span-6 xl:col-span-5">
            <Skeleton className="h-96 w-full rounded-3xl bg-white/10 border border-white/15 shadow-2xl" />
          </div>
        </Container>
      </section>

      {/* 2. ValueProp 4-Cards Skeleton */}
      <section className="py-16 bg-surface border-y border-border/60">
        <Container>
          <div className="max-w-2xl space-y-3 mb-12">
            <Skeleton className="h-4 w-32 bg-brand/20" />
            <Skeleton className="h-9 w-96 bg-slate-200 dark:bg-white/10" />
            <Skeleton className="h-4 w-full max-w-md bg-slate-100 dark:bg-white/5" />
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="p-7 rounded-3xl border border-slate-200 bg-white dark:bg-navy space-y-4 shadow-sm">
                <div className="flex justify-between items-center">
                  <Skeleton className="h-12 w-12 rounded-2xl bg-brand/10" />
                  <Skeleton className="h-6 w-16 rounded-full bg-slate-100 dark:bg-white/10" />
                </div>
                <Skeleton className="h-6 w-36 bg-slate-200 dark:bg-white/15" />
                <Skeleton className="h-12 w-full bg-slate-100 dark:bg-white/5" />
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* 3. How It Works Gantt Chart Skeleton */}
      <section className="py-16 bg-navy-deep text-white">
        <Container className="space-y-8">
          <div className="max-w-2xl space-y-3">
            <Skeleton className="h-4 w-32 bg-white/15" />
            <Skeleton className="h-9 w-80 bg-white/20" />
            <Skeleton className="h-4 w-full max-w-lg bg-white/10" />
          </div>
          <Skeleton className="h-80 w-full rounded-3xl bg-white/[0.05] border border-white/10" />
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-20 bg-brand/40" />
                <Skeleton className="h-5 w-36 bg-white/20" />
                <Skeleton className="h-12 w-full bg-white/10" />
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* 4. Live Dashboard Preview Skeleton */}
      <section className="py-16 bg-surface-alt">
        <Container className="grid lg:grid-cols-2 gap-12 items-center">
          <Skeleton className="h-80 w-full rounded-3xl bg-white dark:bg-navy p-6 shadow-xl border border-slate-200 dark:border-white/10" />
          <div className="space-y-6">
            <Skeleton className="h-4 w-28 bg-brand/20" />
            <Skeleton className="h-9 w-80 bg-slate-200 dark:bg-white/15" />
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex gap-4 items-start">
                  <Skeleton className="h-10 w-10 rounded-xl bg-brand/10 shrink-0" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-5 w-44 bg-slate-200 dark:bg-white/15" />
                    <Skeleton className="h-4 w-full bg-slate-100 dark:bg-white/5" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Container>
      </section>

      {/* 5. Stack Diagram Skeleton */}
      <section className="py-16 bg-white dark:bg-navy-deep">
        <Container className="grid lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-5 space-y-4">
            <Skeleton className="h-4 w-28 bg-brand/20" />
            <Skeleton className="h-9 w-72 bg-slate-200 dark:bg-white/15" />
            <Skeleton className="h-16 w-full bg-slate-100 dark:bg-white/5" />
          </div>
          <div className="lg:col-span-7 space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-16 w-full rounded-2xl bg-surface border border-border" />
            ))}
          </div>
        </Container>
      </section>

      {/* 6. Pricing Skeleton */}
      <section className="py-16 bg-surface-alt">
        <Container className="space-y-10">
          <div className="max-w-2xl space-y-3">
            <Skeleton className="h-4 w-28 bg-brand/20" />
            <Skeleton className="h-9 w-80 bg-slate-200 dark:bg-white/15" />
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-96 w-full rounded-3xl bg-white dark:bg-navy p-8 border border-slate-200 dark:border-white/10 shadow-lg" />
            ))}
          </div>
        </Container>
      </section>

      {/* Real Footer */}
      <Footer />
    </div>
  );
}
