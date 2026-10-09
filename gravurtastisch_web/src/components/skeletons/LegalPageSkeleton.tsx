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
      <section className="relative pt-32 pb-16 lg:pt-36 lg:pb-20 bg-gradient-to-b from-navy-deep to-navy text-white">
        <Container className="max-w-4xl space-y-4">
          <Skeleton className="h-4 w-28 bg-white/15" />
          <Skeleton className="h-10 w-64 bg-white/20 rounded-2xl" />
          <Skeleton className="h-4 w-40 bg-white/10" />
        </Container>
      </section>

      {/* Content Skeleton */}
      <section className="py-14 bg-surface">
        <Container className="max-w-4xl space-y-8">
          {[1, 2, 3].map((section) => (
            <div key={section} className="space-y-4">
              <Skeleton className="h-7 w-52 bg-slate-200" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-full bg-slate-100" />
                <Skeleton className="h-4 w-full bg-slate-100" />
                <Skeleton className="h-4 w-4/5 bg-slate-100" />
              </div>
            </div>
          ))}
        </Container>
      </section>

      {/* Real Footer */}
      <Footer />
    </div>
  );
}
