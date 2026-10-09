import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Nav } from "@/components/site/Nav";
import { Footer } from "@/components/site/Footer";
import { Container } from "@/components/site/Container";
import { Reveal } from "@/components/site/Reveal";
import { getBlogById, getBlogs, BlogItem } from "@/lib/api";
import { LexicalViewer } from "@/components/site/LexicalViewer";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Share2,
  Check,
  Sparkles,
  ShieldCheck,
  ArrowRight,
  BookOpen,
  Loader2,
  ExternalLink,
  Layers,
  Zap,
  ChevronLeft,
  ChevronRight,
  ImageIcon,
} from "lucide-react";
import { format } from "date-fns";
import { BlogDetailSkeleton } from "@/components/skeletons/BlogDetailSkeleton";

export const Route = createFileRoute("/blogs/$blogId")({
  pendingComponent: BlogDetailSkeleton,
  head: () => ({
    meta: [
      { title: "Gravurtastisch Journal - Studio Insights" },
      {
        name: "description",
        content: "Deep dives on custom engraving workflows, proofing, production scheduling, and gift fulfillment.",
      },
    ],
  }),
  component: BlogDetailPage,
});

function calculateReadingTime(text?: string): number {
  if (!text) return 4;
  const wordCount = text.trim().split(/\s+/).length;
  return Math.max(2, Math.ceil(wordCount / 180));
}

function BlogDetailPage() {
  const { blogId } = Route.useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const isSkeletonPreview = typeof window !== "undefined" && window.location.search.includes("skeleton=true");

  const [blog, setBlog] = useState<BlogItem | null>(null);
  const [relatedBlogs, setRelatedBlogs] = useState<BlogItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  const articleImages = useMemo(() => {
    const list: string[] = [];
    if (blog?.full_image_urls && Array.isArray(blog.full_image_urls)) {
      blog.full_image_urls.forEach((url) => {
        if (url && typeof url === "string" && !list.includes(url)) list.push(url);
      });
    }
    if (blog?.description_images && Array.isArray(blog.description_images)) {
      const baseUrl = (import.meta.env.VITE_API_BASE_URL ?? "https://api.gravurtastisch.com").replace(/\/+$/, "");
      blog.description_images.forEach((img) => {
        if (img) {
          const cleanPath = img.replace(/^\/+/, "");
          const fullUrl = img.startsWith("http") ? img : `${baseUrl}/${cleanPath}`;
          if (!list.includes(fullUrl)) list.push(fullUrl);
        }
      });
    }
    return list;
  }, [blog]);

  const validImages = useMemo(() => {
    return articleImages.filter((url) => !failedImages[url]);
  }, [articleImages, failedImages]);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setError(null);
    setActiveImageIndex(0);
    setFailedImages({});
    window.scrollTo({ top: 0, behavior: "smooth" });

    getBlogById(blogId)
      .then((res) => {
        if (isMounted) {
          if (res?.data) {
            setBlog(res.data);
            // Update document title dynamically
            document.title = `${res.data.blog_title} | Gravurtastisch Blog`;

            // If accessed via raw Mongo ID, transparently redirect to clean SEO slug URL
            if (res.data.slug && blogId !== res.data.slug) {
              navigate({
                to: "/blogs/$blogId",
                params: { blogId: res.data.slug },
                replace: true,
              });
            }
          } else {
            setError("Blog post not found.");
          }
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message || "Failed to load blog post.");
        }
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    // Fetch related articles
    getBlogs({ limit: 4 })
      .then((res) => {
        if (isMounted && res?.data) {
          setRelatedBlogs(
            res.data.filter((b) => (b.id || b._id) !== blogId && b.slug !== blogId).slice(0, 3)
          );
        }
      })
      .catch(() => { });

    return () => {
      isMounted = false;
    };
  }, [blogId, navigate]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareTwitter = () => {
    if (!blog) return;
    const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
      blog.blog_title
    )}&url=${encodeURIComponent(window.location.href)}`;
    window.open(shareUrl, "_blank", "noopener,noreferrer");
  };

  const handleShareLinkedIn = () => {
    if (!blog) return;
    const shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
      window.location.href
    )}`;
    window.open(shareUrl, "_blank", "noopener,noreferrer");
  };

  if (isLoading || isSkeletonPreview) {
    return <BlogDetailSkeleton />;
  }

  if (error || !blog) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-background text-navy-deep dark:text-slate-100 flex flex-col">
        <Nav />
        <Container className="flex-1 flex flex-col items-center justify-center py-32 text-center max-w-xl">
          <div className="h-16 w-16 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center mb-6">
            <BookOpen className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-extrabold font-display mb-3">Article Not Found</h1>
          <p className="text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
            The article you are looking for might have been updated or moved. Check out our latest
            Gravurtastisch studio guides in our journal.
          </p>
          <Link
            to="/blogs"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-brand hover:bg-brand-bright text-white font-semibold transition-colors shadow-lg shadow-brand/25"
          >
            <ArrowLeft className="h-4 w-4" />
            Return to All Blogs
          </Link>
        </Container>
        <Footer />
      </div>
    );
  }

  const readingTime = calculateReadingTime(
    blog.short_description + " " + JSON.stringify(blog.description || "")
  );

  const formattedDate = blog.createdAt
    ? format(new Date(blog.createdAt), "MMMM dd, yyyy")
    : "Recently Published";

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-background text-navy-deep dark:text-slate-100 selection:bg-brand/20 selection:text-brand overflow-x-hidden w-full max-w-full">
      <Nav />

      <main className="pb-24 w-full max-w-full overflow-x-hidden">
        {/* ==================================================== */}
        {/* 1. HERO & ARTICLE HEADER */}
        {/* ==================================================== */}
        {/* 1. HERO HEADER */}
        {/* ==================================================== */}
        <section className="relative pt-32 pb-16 md:pt-40 md:pb-20 bg-gradient-to-b from-navy-deep via-navy to-navy-soft text-white border-b border-white/10 overflow-hidden">
          <div className="absolute inset-0 grid-bg opacity-30 pointer-events-none" />
          <div className="absolute -top-40 right-1/4 w-96 h-96 bg-brand/30 rounded-full blur-[140px] pointer-events-none" />
          <div className="absolute bottom-0 left-10 w-80 h-80 bg-amber-500/15 rounded-full blur-[120px] pointer-events-none" />
          <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-brand-bright/20 rounded-full blur-[100px] pointer-events-none" />

          <Container className="relative max-w-4xl">
            {/* Navigation back */}
            <div className="mb-8">
              <Link
                to="/blogs"
                className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400 hover:text-brand-bright transition-colors group"
              >
                <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-1 text-brand-bright" />
                Back to all articles
              </Link>
            </div>

            <Reveal>
              {/* Category / Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand/20 border border-brand/40 text-brand-bright text-xs font-semibold uppercase tracking-wider mb-6 backdrop-blur-md">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Studio craft & personalization</span>
              </div>

              {/* Title */}
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight font-display leading-[1.15] text-white">
                {blog.blog_title}
              </h1>

              {/* Short Summary */}
              {blog.short_description && (
                <p className="mt-5 text-lg sm:text-xl text-slate-300 leading-relaxed max-w-3xl">
                  {blog.short_description}
                </p>
              )}

              {/* Metadata Bar */}
              <div className="mt-8 pt-6 border-t border-white/10 flex flex-wrap items-center justify-between gap-6 text-sm text-slate-400">
                <div className="flex items-center gap-4">
                  <div className="relative h-11 w-11 rounded-2xl bg-gradient-to-br from-[#613EA3] to-[#855FBF] border border-white/20 flex items-center justify-center text-white font-extrabold shadow-md">
                    <span className="text-base font-bold">G</span>
                    <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-[#E89B5C]" />
                  </div>
                  <div>
                    <div className="font-semibold text-white flex items-center gap-1.5">
                      Gravurtastisch Editorial Team
                      <ShieldCheck className="h-4 w-4 text-brand-bright" />
                    </div>
                    <div className="text-xs text-slate-400">Custom engraving & order fulfillment</div>
                  </div>
                </div>

                <div className="flex items-center gap-6 text-xs sm:text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-brand-bright" />
                    <span>{formattedDate}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-amber-400" />
                    <span>{readingTime} min read</span>
                  </div>
                </div>
              </div>
            </Reveal>
          </Container>
        </section>

        {/* ==================================================== */}
        {/* 2. ARTICLE BODY + SIDEBAR */}
        {/* ==================================================== */}
        <section className="py-12 md:py-16">
          <Container className="max-w-5xl">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
              {/* Main Content Column */}
              <div className="lg:col-span-8">
                <article className="bg-white dark:bg-slate-900/80 rounded-3xl p-6 sm:p-10 border border-slate-200/80 dark:border-white/10 shadow-xl shadow-slate-900/5">
                  {/* Share toolbar */}
                  {/* <div className="flex items-center justify-between pb-6 mb-8 border-b border-slate-100 dark:border-white/10 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                    <span className="font-medium">Share this article:</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleCopyLink}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 hover:border-brand/40 bg-slate-50 dark:bg-slate-800 hover:text-brand transition-all"
                        title="Copy link"
                      >
                        {copied ? (
                          <>
                            <Check className="h-3.5 w-3.5 text-emerald-500" />
                            <span className="text-emerald-600 font-medium">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Share2 className="h-3.5 w-3.5" />
                            <span>Copy link</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={handleShareTwitter}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 hover:border-brand/40 bg-slate-50 dark:bg-slate-800 hover:text-sky-500 transition-colors"
                      >
                        X / Twitter
                      </button>

                      <button
                        onClick={handleShareLinkedIn}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 hover:border-brand/40 bg-slate-50 dark:bg-slate-800 hover:text-blue-600 transition-colors"
                      >
                        LinkedIn
                      </button>
                    </div>
                  </div> */}

                  {/* Blog Image(s) / Carousel Gallery */}
                  {validImages.length > 0 && (
                    <div className="mb-8 select-none">
                      {validImages.length === 1 ? (
                        /* Single Image */
                        <div className="rounded-2xl overflow-hidden border border-slate-200/80 dark:border-white/10 shadow-lg bg-slate-900/5 dark:bg-slate-900/40">
                          <img
                            src={validImages[0]}
                            alt={blog.blog_title}
                            className="w-full max-h-[550px] object-contain block mx-auto"
                            loading="lazy"
                            onError={() => {
                              setFailedImages((prev) => ({ ...prev, [validImages[0]]: true }));
                            }}
                          />
                        </div>
                      ) : (
                        /* Multi-Image Carousel Gallery */
                        <div className="space-y-3">
                          <div className="relative rounded-2xl overflow-hidden border border-slate-200/80 dark:border-white/10 shadow-xl bg-slate-900/5 dark:bg-slate-900/40 group">
                            {/* Main Active Image */}
                            {(() => {
                              const safeIndex = Math.min(activeImageIndex, validImages.length - 1);
                              const currentImg = validImages[safeIndex] || validImages[0];
                              return (
                                <div className="flex items-center justify-center min-h-[300px] max-h-[550px] w-full bg-slate-950/20">
                                  <img
                                    src={currentImg}
                                    alt={`${blog.blog_title} - image ${safeIndex + 1}`}
                                    className="w-full max-h-[550px] object-contain block mx-auto transition-opacity duration-300"
                                    loading="lazy"
                                    onError={() => {
                                      setFailedImages((prev) => ({ ...prev, [currentImg]: true }));
                                    }}
                                  />
                                </div>
                              );
                            })()}

                            {/* Left / Previous Arrow */}
                            <button
                              type="button"
                              onClick={() =>
                                setActiveImageIndex((prev) =>
                                  prev > 0 ? prev - 1 : validImages.length - 1
                                )
                              }
                              className="absolute left-3.5 top-1/2 -translate-y-1/2 h-10 w-10 sm:h-11 sm:w-11 rounded-full bg-navy-deep/80 hover:bg-brand text-white flex items-center justify-center backdrop-blur-md border border-white/20 shadow-xl transition-all cursor-pointer hover:scale-110 active:scale-95"
                              aria-label="Previous image"
                            >
                              <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
                            </button>

                            {/* Right / Next Arrow */}
                            <button
                              type="button"
                              onClick={() =>
                                setActiveImageIndex((prev) =>
                                  prev < validImages.length - 1 ? prev + 1 : 0
                                )
                              }
                              className="absolute right-3.5 top-1/2 -translate-y-1/2 h-10 w-10 sm:h-11 sm:w-11 rounded-full bg-navy-deep/80 hover:bg-brand text-white flex items-center justify-center backdrop-blur-md border border-white/20 shadow-xl transition-all cursor-pointer hover:scale-110 active:scale-95"
                              aria-label="Next image"
                            >
                              <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
                            </button>

                            {/* Image Counter Badge */}
                            <div className="absolute top-3.5 right-3.5 px-3 py-1.5 rounded-full bg-navy-deep/80 backdrop-blur-md border border-white/15 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md">
                              <ImageIcon className="h-3.5 w-3.5 text-brand-bright" />
                              <span>
                                {Math.min(activeImageIndex, validImages.length - 1) + 1} / {validImages.length}
                              </span>
                            </div>

                            {/* Bottom Indicator Dots */}
                            <div className="absolute bottom-3.5 inset-x-0 flex items-center justify-center gap-1.5 pointer-events-auto">
                              {validImages.map((_, i) => (
                                <button
                                  key={i}
                                  type="button"
                                  onClick={() => setActiveImageIndex(i)}
                                  aria-label={`Go to image ${i + 1}`}
                                  className={`h-2 rounded-full transition-all cursor-pointer ${Math.min(activeImageIndex, validImages.length - 1) === i
                                      ? "w-6 bg-brand-bright shadow-sm"
                                      : "w-2 bg-white/50 hover:bg-white/90"
                                    }`}
                                />
                              ))}
                            </div>
                          </div>

                          {/* Thumbnail strip */}
                          <div className="flex items-center gap-2.5 overflow-x-auto py-1 px-0.5 scrollbar-thin">
                            {validImages.map((imgSrc: string, idx: number) => (
                              <button
                                key={imgSrc}
                                type="button"
                                onClick={() => setActiveImageIndex(idx)}
                                className={`relative shrink-0 h-16 w-24 rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${Math.min(activeImageIndex, validImages.length - 1) === idx
                                    ? "border-brand shadow-md ring-2 ring-brand/40 scale-[1.02]"
                                    : "border-slate-200 dark:border-white/10 opacity-60 hover:opacity-100"
                                  }`}
                              >
                                <img
                                  src={imgSrc}
                                  alt={`Thumbnail ${idx + 1}`}
                                  className="w-full h-full object-cover"
                                  onError={() => {
                                    setFailedImages((prev) => ({ ...prev, [imgSrc]: true }));
                                  }}
                                />
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Render Rich Lexical / HTML Content */}
                  <div className="article-rendered-body">
                    <LexicalViewer content={blog.description} />
                  </div>

                  {/* End of article tag & support box */}
                  <div className="mt-12 pt-8 border-t border-slate-100 dark:border-white/10">
                    <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div>
                        <h4 className="font-bold text-navy-deep dark:text-white font-display">
                          Ready to put custom orders on a clear studio path?
                        </h4>
                        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                          Gravurtastisch connects intake, proofs, and production so every mug and engraved piece ships as promised.
                        </p>
                      </div>
                      <a
                        href="/#register"
                        className="shrink-0 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand hover:bg-brand-bright text-white text-xs font-bold uppercase tracking-wider transition-all shadow-md shadow-brand/20"
                      >
                        <span>Start Free</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </a>
                    </div>
                  </div>
                </article>
              </div>

              {/* Sidebar Column */}
              <div className="lg:col-span-4 space-y-6">
                {/* Studio quality guarantee box */}
                <div className="p-6 rounded-3xl bg-gradient-to-br from-navy-deep via-navy to-brand/40 text-white border border-brand/30 shadow-xl relative overflow-hidden">
                  <div className="absolute -top-12 -right-12 w-32 h-32 bg-brand/30 rounded-full blur-2xl pointer-events-none" />
                  <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-amber-500/15 rounded-full blur-xl pointer-events-none" />
                  <div className="h-10 w-10 rounded-xl bg-brand/25 flex items-center justify-center mb-4 text-brand-bright border border-brand/40 shadow-sm">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <h3 className="text-lg font-bold font-display">Craft-quality workflow</h3>
                  <p className="mt-2 text-xs leading-relaxed text-slate-300">
                    Every personalized job flows through Gravurtastisch with proof approval, encrypted artwork storage,
                    and scheduled bench time - no guesswork on the shop floor.
                  </p>
                  <ul className="mt-4 space-y-2 text-xs text-slate-300">
                    <li className="flex items-center gap-2">
                      <Zap className="h-3.5 w-3.5 text-brand-bright" />
                      Proof-before-production on every SKU
                    </li>
                    <li className="flex items-center gap-2">
                      <Zap className="h-3.5 w-3.5 text-brand-bright" />
                      Encrypted uploads & scoped shop tokens
                    </li>
                    <li className="flex items-center gap-2">
                      <Zap className="h-3.5 w-3.5 text-brand-bright" />
                      Webshop, wholesale & counter orders
                    </li>
                  </ul>
                  <a
                    href="/#register"
                    className="mt-6 w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white hover:bg-slate-100 text-navy-deep font-bold text-xs uppercase tracking-wider transition-colors shadow-md"
                  >
                    Start a custom order
                    <ArrowRight className="h-3.5 w-3.5" />
                  </a>
                </div>

                {/* More Articles in this Hub */}
                {relatedBlogs.length > 0 && (
                  <div className="p-6 rounded-3xl bg-white dark:bg-slate-900/80 border border-slate-200/80 dark:border-white/10 shadow-lg">
                    <h3 className="text-base font-bold font-display text-navy-deep dark:text-white mb-4 flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-brand" />
                      More studio reads
                    </h3>
                    <div className="space-y-4">
                      {relatedBlogs.map((rel) => {
                        const relId = rel.slug || rel.id || rel._id || "";
                        return (
                          <Link
                            key={rel.id || rel._id || relId}
                            to="/blogs/$blogId"
                            params={{ blogId: relId }}
                            className="block group p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors border border-transparent hover:border-slate-200/60 dark:hover:border-white/5"
                          >
                            <h4 className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 group-hover:text-brand transition-colors line-clamp-2 leading-snug">
                              {rel.blog_title}
                            </h4>
                            <div className="mt-2 flex items-center gap-3 text-[11px] text-slate-400">
                              <span>
                                {rel.createdAt
                                  ? format(new Date(rel.createdAt), "MMM dd, yyyy")
                                  : "Article"}
                              </span>
                              <span>•</span>
                              <span className="text-brand font-medium group-hover:underline inline-flex items-center gap-0.5">
                                Read
                                <ArrowRight className="h-2.5 w-2.5" />
                              </span>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Container>
        </section>
      </main>

      <Footer />
    </div>
  );
}
