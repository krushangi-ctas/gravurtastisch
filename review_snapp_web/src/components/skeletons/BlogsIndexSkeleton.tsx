import { Container } from "@/components/site/Container";
import { Skeleton } from "@/components/ui/skeleton";
import { Nav } from "@/components/site/Nav";
import { Footer } from "@/components/site/Footer";

export function BlogsIndexSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-background text-navy-deep dark:text-slate-100 overflow-hidden">
      {/* Real Nav Header */}
      <Nav />

      {/* Blog Hero Skeleton */}
      <section className="relative pt-32 pb-20 lg:pt-36 lg:pb-24 bg-gradient-to-b from-navy-deep via-navy to-navy-soft text-white">
        <Container className="text-center max-w-3xl space-y-5">
          <Skeleton className="h-6 w-48 rounded-full bg-white/15 mx-auto" />
          <Skeleton className="h-12 w-4/5 bg-white/20 rounded-2xl mx-auto" />
          <Skeleton className="h-4 w-full max-w-xl bg-white/10 mx-auto" />
          {/* Search bar skeleton */}
          <div className="pt-4 max-w-lg mx-auto">
            <Skeleton className="h-12 w-full rounded-2xl bg-white/15" />
          </div>
          {/* Category pills skeleton */}
          <div className="flex flex-wrap justify-center gap-2 pt-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-8 w-24 rounded-full bg-white/10" />
            ))}
          </div>
        </Container>
      </section>

      {/* Blog Cards Grid Skeleton */}
      <section className="py-12 lg:py-16">
        <Container>
          <div className="flex justify-between items-center pb-4 mb-8 border-b border-slate-200 dark:border-white/10">
            <Skeleton className="h-7 w-36 bg-slate-200 dark:bg-white/10" />
            <Skeleton className="h-4 w-20 bg-slate-200 dark:bg-white/10" />
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="rounded-2xl bg-white dark:bg-navy-deep/70 border border-slate-200 dark:border-white/10 p-6 sm:p-7 space-y-4 shadow-sm"
              >
                <div className="flex justify-between items-center">
                  <Skeleton className="h-5 w-24 rounded-full bg-slate-200 dark:bg-white/10" />
                  <Skeleton className="h-4 w-16 bg-slate-200 dark:bg-white/10" />
                </div>
                <Skeleton className="h-6 w-5/6 bg-slate-200 dark:bg-white/10" />
                <Skeleton className="h-6 w-3/4 bg-slate-200 dark:bg-white/10" />
                <div className="space-y-2 pt-2">
                  <Skeleton className="h-3.5 w-full bg-slate-100 dark:bg-white/5" />
                  <Skeleton className="h-3.5 w-4/5 bg-slate-100 dark:bg-white/5" />
                  <Skeleton className="h-3.5 w-3/5 bg-slate-100 dark:bg-white/5" />
                </div>
                <div className="pt-4 border-t border-slate-100 dark:border-white/5 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-7 w-7 rounded-full bg-slate-200 dark:bg-white/10" />
                    <Skeleton className="h-3.5 w-24 bg-slate-200 dark:bg-white/10" />
                  </div>
                  <Skeleton className="h-4 w-16 bg-slate-200 dark:bg-white/10" />
                </div>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Real Footer */}
      <Footer />
    </div>
  );
}
