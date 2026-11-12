export interface SeoProps {
  title: string;
  description: string;
  image?: string;
  url?: string;
  type?: "website" | "article" | "product";
  keywords?: string[];
  noindex?: boolean;
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
}

export const SITE_NAME = "Gravurtastisch";
export const DEFAULT_SITE_URL =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_SITE_URL) ||
  "https://gravurtastisch-web.vercel.app";
export const DEFAULT_OG_IMAGE = `${DEFAULT_SITE_URL}/home1.webp`;
export const DEFAULT_TWITTER_HANDLE = "@gravurtastisch";

/**
 * Reusable SEO helper to generate consistent Meta and Links for TanStack Router head: () => ...
 */
export function seo({
  title,
  description,
  image = DEFAULT_OG_IMAGE,
  url = DEFAULT_SITE_URL,
  type = "website",
  keywords,
  noindex = false,
  publishedTime,
  modifiedTime,
  author,
}: SeoProps) {
  const fullTitle = title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`;
  const cleanBase = DEFAULT_SITE_URL.replace(/\/+$/, "");
  const cleanPath = url.startsWith("http")
    ? url
    : url === "/"
      ? ""
      : `/${url.replace(/^\/+/, "")}`;
  const fullUrl = url.startsWith("http") ? url : `${cleanBase}${cleanPath}`;
  const fullImage = image.startsWith("http")
    ? image
    : `${cleanBase}/${image.replace(/^\/+/, "")}`;

  const meta: Array<{ [key: string]: string }> = [
    { title: fullTitle },
    { name: "description", content: description },
    {
      name: "robots",
      content: noindex
        ? "noindex, nofollow"
        : "index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1",
    },
    {
      name: "googlebot",
      content: noindex
        ? "noindex, nofollow"
        : "index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1",
    },
    // Open Graph
    { property: "og:site_name", content: SITE_NAME },
    { property: "og:type", content: type },
    { property: "og:title", content: fullTitle },
    { property: "og:description", content: description },
    { property: "og:url", content: fullUrl },
    { property: "og:image", content: fullImage },
    { property: "og:image:width", content: "1200" },
    { property: "og:image:height", content: "630" },
    { property: "og:image:alt", content: fullTitle },
    { property: "og:locale", content: "de_DE" },
    { property: "og:locale:alternate", content: "en_US" },
    // Twitter Card
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:site", content: DEFAULT_TWITTER_HANDLE },
    { name: "twitter:creator", content: DEFAULT_TWITTER_HANDLE },
    { name: "twitter:title", content: fullTitle },
    { name: "twitter:description", content: description },
    { name: "twitter:image", content: fullImage },
    { name: "twitter:image:alt", content: fullTitle },
  ];

  if (keywords && keywords.length > 0) {
    meta.push({ name: "keywords", content: keywords.join(", ") });
  }

  if (type === "article") {
    if (publishedTime) {
      meta.push({ property: "article:published_time", content: publishedTime });
    }
    if (modifiedTime) {
      meta.push({ property: "article:modified_time", content: modifiedTime });
    }
    if (author) {
      meta.push({ property: "article:author", content: author });
    }
  }

  const links = [{ rel: "canonical", href: fullUrl }];

  return { meta, links };
}

/**
 * Organization Schema for Google Knowledge Graph & Brand rich results
 */
export function createOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": SITE_NAME,
    "url": DEFAULT_SITE_URL,
    "logo": `${DEFAULT_SITE_URL}/g.svg`,
    "description": "Premium custom laser engraving, photo cups, and personalized gift studio with free digital proofs and German-craft precision.",
    "email": "info@gravurtastisch.de",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "Gertrudstr. 2",
      "addressLocality": "Castrop-Rauxel",
      "addressRegion": "NRW",
      "postalCode": "44575",
      "addressCountry": "DE"
    },
    "sameAs": [
      "https://www.linkedin.com/company/gravurtastisch",
      "https://www.facebook.com/gravurtastisch",
      "https://www.instagram.com/gravurtastisch"
    ]
  };
}

/**
 * WebSite Schema with SearchAction
 */
export function createWebSiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": SITE_NAME,
    "url": DEFAULT_SITE_URL,
    "potentialAction": {
      "@type": "SearchAction",
      "target": `${DEFAULT_SITE_URL}/blogs?search={search_term_string}`,
      "query-input": "required name=search_term_string"
    }
  };
}

/**
 * FAQPage Schema
 */
export function createFaqSchema(faqs: Array<{ q: string; a: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map((faq) => ({
      "@type": "Question",
      "name": faq.q,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.a,
      },
    })),
  };
}

/**
 * Article Schema for Blog posts
 */
export function createArticleSchema({
  title,
  description,
  url,
  image = DEFAULT_OG_IMAGE,
  datePublished,
  dateModified,
  authorName = SITE_NAME,
}: {
  title: string;
  description: string;
  url: string;
  image?: string;
  datePublished?: string;
  dateModified?: string;
  authorName?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": title,
    "description": description,
    "image": image.startsWith("http") ? image : `${DEFAULT_SITE_URL}${image.startsWith("/") ? image : `/${image}`}`,
    "datePublished": datePublished || new Date().toISOString(),
    "dateModified": dateModified || datePublished || new Date().toISOString(),
    "author": {
      "@type": "Organization",
      "name": authorName,
      "url": DEFAULT_SITE_URL,
    },
    "publisher": {
      "@type": "Organization",
      "name": SITE_NAME,
      "logo": {
        "@type": "ImageObject",
        "url": `${DEFAULT_SITE_URL}/g.svg`,
      },
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": url.startsWith("http") ? url : `${DEFAULT_SITE_URL}${url}`,
    },
  };
}
