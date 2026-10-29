import { Container } from "@/components/site/Container";
import { Skeleton } from "@/components/ui/skeleton";
import { Nav } from "@/components/site/Nav";
import { Footer } from "@/components/site/Footer";

export function LegalPageSkeleton() {
  return (
    <div className="min-h-screen bg-background text-navy-deep overflow-hidden">
      {/* Real Nav Header */}
      <Nav />

      {/* Header Skeleton */}
      <section className="relative pt-32 pb-14 lg:pt-36 lg:pb-16 bg-gradient-to-b from-[#0032ab]/6 via-white to-transparent border-b border-border/40">
        <Container className="max-w-4xl space-y-4">
          <Skeleton className="h-5 w-28 rounded-full bg-brand/15" />
          <Skeleton className="h-10 w-64 bg-slate-200/90 rounded-2xl" />
          <Skeleton className="h-4 w-44 bg-slate-200/60" />
        </Container>
      </section>

      {/* Content Skeleton */}
      <section className="py-12 bg-surface/50">
        <Container className="max-w-4xl">
          <div className="rounded-3xl bg-white dark:bg-navy-deep/80 border border-brand/10 p-6 sm:p-10 space-y-6 shadow-xs">
            {[1, 2, 3].map((section) => (
              <div key={section} className="space-y-3">
                <Skeleton className="h-7 w-52 bg-slate-200" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full bg-slate-100" />
                  <Skeleton className="h-4 w-full bg-slate-100" />
                  <Skeleton className="h-4 w-4/5 bg-slate-100" />
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
