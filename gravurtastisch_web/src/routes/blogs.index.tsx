import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Nav } from "@/components/site/Nav";
import { Footer } from "@/components/site/Footer";
import { Container } from "@/components/site/Container";
import { Reveal } from "@/components/site/Reveal";
import { Input } from "@/components/ui/input";
import { getBlogs, BlogItem } from "@/lib/api";
import {
  BookOpen,
  Sparkles,
  Search,
  Clock,
  Calendar,
  ArrowRight,
  ShieldCheck,
  Zap,
  TrendingUp,
  Layers,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Newspaper
} from "lucide-react";
import { format } from "date-fns";
import { BlogsIndexSkeleton } from "@/components/skeletons/BlogsIndexSkeleton";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/blogs/")({
  pendingComponent: BlogsIndexSkeleton,
  head: () => ({
    meta: [
      { title: "Gravurtastisch Journal — Custom Engraving, Proofing & Studio Craft" },
      {
        name: "description",
        content:
          "Stories on photo mugs, laser engraving, proof workflows, production scheduling, and building a premium personalization studio.",
      },
      { property: "og:title", content: "Gravurtastisch Journal & Studio Notes" },
      {
        property: "og:description",
        content:
          "Master custom intake, digital proofs, bench scheduling, and memorable gift fulfillment.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/blogs" }],
  }),
  component: BlogsPage,
});

function calculateReadingTime(text?: string): number {
  if (!text) return 3;
  const wordCount = text.trim().split(/\s+/).length;
  return Math.max(2, Math.ceil(wordCount / 180));
}

function BlogsPage() {
  const { t } = useTranslation();
  const isSkeletonPreview = typeof window !== "undefined" && window.location.search.includes("skeleton=true");

  const [blogs, setBlogs] = useState<BlogItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);

  const pageSize = 9;

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    getBlogs({
      page: currentPage,
      limit: pageSize,
      search: searchQuery.trim(),
    })
      .then((res) => {
        if (isMounted && res?.data) {
          setBlogs(res.data);
          setTotalPages(res.pagination?.totalPages || 1);
          setTotalResults(res.pagination?.totalResults || res.data.length);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch blogs:", err);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [currentPage, searchQuery]);

  const categories = ["All", "Intake & Integrations", "Production Scheduling", "Order Pipeline", "Craft & Gifts"];

  // Filter by tag client-side if selected
  const filteredBlogs = useMemo(() => {
    if (selectedTag === "All") return blogs;
    return blogs.filter((b) => {
      const text = `${b.blog_title} ${b.short_description}`.toLowerCase();
      if (selectedTag === "Intake & Integrations") return text.includes("intake") || text.includes("shop") || text.includes("integration") || text.includes("oauth") || text.includes("webhook");
      if (selectedTag === "Production Scheduling") return text.includes("scheduling") || text.includes("production") || text.includes("laser") || text.includes("bench");
      if (selectedTag === "Order Pipeline") return text.includes("order") || text.includes("sync") || text.includes("proof") || text.includes("pipeline");
      if (selectedTag === "Craft & Gifts") return text.includes("mug") || text.includes("engrav") || text.includes("gift") || text.includes("personal") || text.includes("cup");
      return true;
    });
  }, [blogs, selectedTag]);

  function getBlogThumbnail(blog: BlogItem): string | null {
    if (blog.full_image_urls && blog.full_image_urls.length > 0 && blog.full_image_urls[0]) {
      return blog.full_image_urls[0];
    }
    if (blog.description_images && blog.description_images.length > 0 && blog.description_images[0]) {
      return blog.description_images[0];
    }
    if (typeof blog.description === "string") {
      const match = blog.description.match(/<img[^>]+src=["']([^"']+)["']/i);
      if (match && match[1]) {
        return match[1];
      }
    }
    return null;
  }

  if (isSkeletonPreview) {
    return <BlogsIndexSkeleton />;
  }

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-background text-navy-deep dark:text-slate-100 selection:bg-brand/20 selection:text-brand overflow-x-hidden w-full max-w-full">
      <Nav />

      <main className="pb-20 w-full max-w-full overflow-x-hidden">
        {/* ==================================================== */}
        {/* 1. HERO SECTION (DARK NAVY GRADIENT) */}
        {/* ==================================================== */}
        <section className="relative overflow-hidden pt-28 pb-16 lg:pt-32 lg:pb-20 bg-gradient-to-b from-navy-deep via-navy to-navy-soft text-white w-full max-w-full">
          <div className="absolute inset-0 grid-bg opacity-40 pointer-events-none" />
          <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-brand/25 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-sky-500/20 blur-3xl pointer-events-none" />

          <Container className="relative">
            <Reveal className="max-w-3xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 rounded-full bg-brand/20 border border-brand/40 px-3.5 py-1 text-xs font-semibold text-brand-bright mb-4">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Gravurtastisch Journal & Studio Notes</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white font-display leading-[1.15]">
                Actionable Insights for <br className="hidden sm:inline" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-bright via-amber-300 to-purple-300">
                  Premium Personalization Studio
                </span>
              </h1>

              <p className="mt-4 text-base sm:text-lg text-white/70 max-w-2xl mx-auto leading-relaxed">
                Ideas for sharper proofs, happier gift buyers, and a calmer engraving floor—written by the Gravurtastisch studio team.
              </p>

              {/* Search Bar */}
              <div className="mt-8 max-w-xl mx-auto relative">
                <div className="relative flex items-center">
                  <Search className="absolute left-4 h-5 w-5 text-white/50 z-10 pointer-events-none" />
                  <Input
                    type="text"
                    placeholder="Search engraving, proofing, scheduling, gifts..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="h-12 w-full pl-12 pr-16 rounded-2xl bg-white/10 border-white/20 text-white placeholder:text-white/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-bright focus-visible:border-transparent backdrop-blur-md text-sm shadow-xl transition-all"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-4 text-xs font-semibold text-white/60 hover:text-white z-10"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Category Filter Chips */}
              <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => {
                      setSelectedTag(cat);
                      setCurrentPage(1);
                    }}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                      selectedTag === cat
                        ? "bg-brand text-white shadow-md shadow-brand/25 scale-105"
                        : "bg-white/10 text-white/70 hover:bg-white/15 hover:text-white border border-white/10"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </Reveal>
          </Container>
        </section>

        {/* ==================================================== */}
        {/* 2. BLOG CONTENT SECTION (UNIFORM 3-COLUMN GRID) */}
        {/* ==================================================== */}
        <section className="py-12 lg:py-16">
          <Container>
            {isLoading ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div
                    key={i}
                    className="rounded-2xl bg-white dark:bg-navy-deep/70 border border-slate-200/80 dark:border-white/10 p-6 sm:p-7 space-y-4 shadow-sm"
                  >
                    <div className="flex justify-between items-center">
                      <Skeleton className="h-5 w-24 rounded-full" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                    <Skeleton className="h-6 w-5/6" />
                    <Skeleton className="h-6 w-3/4" />
                    <div className="space-y-2 pt-2">
                      <Skeleton className="h-3.5 w-full bg-slate-100 dark:bg-white/5" />
                      <Skeleton className="h-3.5 w-4/5 bg-slate-100 dark:bg-white/5" />
                    </div>
                    <div className="pt-4 border-t border-slate-100 dark:border-white/5 flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-7 w-7 rounded-full" />
                        <Skeleton className="h-3.5 w-24" />
                      </div>
                      <Skeleton className="h-4 w-16" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredBlogs.length === 0 ? (
              <div className="py-20 text-center max-w-md mx-auto">
                <div className="h-16 w-16 bg-slate-100 dark:bg-navy-soft rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                  <Newspaper className="h-8 w-8" />
                </div>
                <h3 className="text-lg font-bold text-navy-deep dark:text-white">No articles found</h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {searchQuery
                    ? `No matching articles found for "${searchQuery}". Try a different keyword.`
                    : "No blogs available in this category yet."}
                </p>
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="mt-4 px-4 py-2 rounded-lg bg-brand text-white text-xs font-semibold hover:bg-brand-dark transition-colors"
                  >
                    View All Articles
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-10">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200/80 dark:border-white/10">
                  <h2 className="text-xl sm:text-2xl font-bold text-navy-deep dark:text-white font-display">
                    All Articles
                  </h2>
                  <span className="text-xs text-slate-500 font-medium">
                    Showing {filteredBlogs.length} {filteredBlogs.length === 1 ? "post" : "posts"}
                  </span>
                </div>

                {/* 3-Column Blog Cards Grid (Pure Content Cards) */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                  {filteredBlogs.map((blog) => {
                    const blogId = blog._id || blog.id || "";
                    const blogSlugOrId = blog.slug || blogId;
                    const readTime = calculateReadingTime(
                      blog.short_description + " " + (typeof blog.description === "string" ? blog.description : "")
                    );

                    return (
                      <Reveal key={blogId}>
                        <article className="group flex flex-col h-full rounded-2xl bg-white dark:bg-navy-deep/70 border border-slate-200/80 dark:border-white/10 shadow-sm hover:shadow-xl hover:border-brand/40 hover:-translate-y-1 transition-all duration-300 p-6 sm:p-7">
                          {/* Metadata Bar & Badge */}
                          <div className="flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400 mb-4 pb-3 border-b border-slate-100 dark:border-white/5">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-3.5 w-3.5 text-brand" />
                              <span>
                                {blog.createdAt ? format(new Date(blog.createdAt), "dd MMM yyyy") : "Recent"}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 text-slate-400">
                              <Clock className="h-3.5 w-3.5 text-brand" />
                              <span>{readTime} min read</span>
                            </div>
                          </div>

                          {/* Card Title */}
                          <h3 className="text-lg sm:text-xl font-bold text-navy-deep dark:text-white group-hover:text-brand transition-colors leading-snug line-clamp-2 font-display mb-3">
                            <Link to="/blogs/$blogId" params={{ blogId: blogSlugOrId }}>
                              {blog.blog_title}
                            </Link>
                          </h3>

                          {/* Card Short Description */}
                          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-4 flex-1 mb-6">
                            {blog.short_description ||
                              "Studio notes on personalization, quality control, and scaling custom gift production."}
                          </p>

                          {/* Card Action */}
                          <div className="pt-4 border-t border-slate-100 dark:border-white/10 flex items-center justify-between">
                            <Link
                              to="/blogs/$blogId"
                              params={{ blogId: blogSlugOrId }}
                              className="inline-flex items-center gap-1.5 text-xs font-bold text-brand hover:text-brand-dark transition-colors group-hover:gap-2.5 uppercase tracking-wider"
                            >
                              <span>Read More</span>
                              <ArrowRight className="h-3.5 w-3.5" />
                            </Link>
                          </div>
                        </article>
                      </Reveal>
                    );
                  })}
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 pt-8">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="p-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-navy-deep text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      aria-label="Previous page"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>

                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`h-10 w-10 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          currentPage === page
                            ? "bg-brand text-white shadow-md shadow-brand/30"
                            : "border border-slate-200 dark:border-white/10 bg-white dark:bg-navy-deep text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/10"
                        }`}
                      >
                        {page}
                      </button>
                    ))}

                    <button
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="p-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-navy-deep text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      aria-label="Next page"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </Container>
        </section>

        {/* ==================================================== */}
        {/* 3. BOTTOM CTA BANNER */}
        {/* ==================================================== */}
        <section className="mt-12">
          <Container>
            <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-navy-deep via-navy to-brand-deep text-white p-8 sm:p-12 border border-white/15 shadow-2xl">
              <div className="absolute inset-0 grid-bg opacity-30 pointer-events-none" />
              <div className="relative z-10 max-w-2xl">
                <span className="inline-flex items-center gap-1.5 text-xs uppercase tracking-widest text-brand-bright font-extrabold mb-2">
                  <Zap className="h-3.5 w-3.5" /> Start your custom order
                </span>
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight font-display">
                  Ready to turn ideas into engraved keepsakes?
                </h2>
                <p className="mt-3 text-sm sm:text-base text-white/70 leading-relaxed">
                  Join makers who use Gravurtastisch to intake orders, approve proofs, and ship photo cups and engraved gifts on time.
                </p>
                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <a
                    href="#register"
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-brand hover:bg-brand-dark text-white font-bold text-sm shadow-lg shadow-brand/30 transition-all hover:scale-105"
                  >
                    <span>Start a custom order</span>
                    <ArrowRight className="h-4 w-4" />
                  </a>
                  <a
                    href="/#pricing"
                    className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-sm border border-white/20 transition-colors"
                  >
                    View Pricing
                  </a>
                </div>
              </div>
            </div>
          </Container>
        </section>
      </main>

      <Footer />
    </div>
  );
}
