import { Container } from "@/components/site/Container";
import { Skeleton } from "@/components/ui/skeleton";
import { Nav } from "@/components/site/Nav";
import { Footer } from "@/components/site/Footer";

export function BlogDetailSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-background text-navy-deep dark:text-slate-100 overflow-hidden">
      {/* Real Nav Header */}
      <Nav />

      {/* Blog Detail Hero Skeleton */}
      <section className="relative pt-32 pb-16 md:pt-40 md:pb-20 bg-gradient-to-b from-navy-deep via-navy to-navy-soft text-white border-b border-white/10 overflow-hidden">
        <Container className="max-w-4xl space-y-6">
          <Skeleton className="h-5 w-32 rounded-full bg-white/10" />
          <Skeleton className="h-6 w-52 rounded-full bg-brand/30" />
          <div className="space-y-3">
            <Skeleton className="h-12 w-full bg-white/20 rounded-2xl" />
            <Skeleton className="h-12 w-4/5 bg-white/20 rounded-2xl" />
          </div>
          <div className="pt-6 border-t border-white/10 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full bg-white/15" />
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-36 bg-white/20" />
                <Skeleton className="h-3 w-28 bg-white/10" />
              </div>
            </div>
            <div className="flex gap-4">
              <Skeleton className="h-4 w-24 bg-white/15" />
              <Skeleton className="h-4 w-20 bg-white/15" />
            </div>
          </div>
        </Container>
      </section>

      {/* Blog Detail Article & Sidebar Skeleton */}
      <section className="py-12 md:py-16">
        <Container className="max-w-5xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* Article Body Skeleton */}
            <div className="lg:col-span-8">
              <div className="bg-white dark:bg-slate-900/80 rounded-3xl p-6 sm:p-10 border border-slate-200/80 dark:border-white/10 shadow-sm space-y-6">
                <Skeleton className="h-64 w-full rounded-2xl bg-slate-200 dark:bg-white/10" />
                <Skeleton className="h-8 w-3/4 bg-slate-200 dark:bg-white/10" />
                <div className="space-y-3">
                  <Skeleton className="h-4 w-full bg-slate-100 dark:bg-white/5" />
                  <Skeleton className="h-4 w-full bg-slate-100 dark:bg-white/5" />
                  <Skeleton className="h-4 w-5/6 bg-slate-100 dark:bg-white/5" />
                </div>
                <Skeleton className="h-7 w-2/3 bg-slate-200 dark:bg-white/10 pt-4" />
                <div className="space-y-3">
                  <Skeleton className="h-4 w-full bg-slate-100 dark:bg-white/5" />
                  <Skeleton className="h-4 w-11/12 bg-slate-100 dark:bg-white/5" />
                  <Skeleton className="h-4 w-4/5 bg-slate-100 dark:bg-white/5" />
                </div>
              </div>
            </div>

            {/* Sidebar Skeleton */}
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-white dark:bg-slate-900/80 rounded-3xl p-6 border border-slate-200/80 dark:border-white/10 space-y-4">
                <Skeleton className="h-6 w-36 bg-slate-200 dark:bg-white/10" />
                {[1, 2, 3].map((i) => (
                  <div key={i} className="space-y-2 pt-3 border-t border-slate-100 dark:border-white/5">
                    <Skeleton className="h-4 w-full bg-slate-200 dark:bg-white/10" />
                    <Skeleton className="h-3 w-20 bg-slate-100 dark:bg-white/5" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Real Footer */}
      <Footer />
    </div>
  );
}
