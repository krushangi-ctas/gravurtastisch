/**
 * Central API configuration for review-snap-pro.
 * All backend requests go through this module so the base URL
 * is sourced from the VITE_API_BASE_URL environment variable
 * and never hardcoded in component files.
 */

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:7051";

/** The v1 prefix used by every backend route */
export const API_V1 = `${BASE_URL}/v1`;

/**
 * Thin wrapper around `fetch` that sets JSON headers by default.
 * Returns the parsed JSON body on success or throws an Error with
 * the server's message on non-2xx responses.
 */
export async function apiFetch<T = unknown>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const isFormData = init.body instanceof FormData;

  const response = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(init.headers ?? {}),
    },
  });

  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      (body as any)?.message ?? `Request failed with status ${response.status}`
    );
  }

  return body as T;
}

/** POST /v1/users/register-seller - public lead capture form */
export async function registerSeller(data: {
  business: string;
  seller: string;
  email: string;
  phone?: string;
  marketplaces: string[];
}) {
  return apiFetch("/v1/users/register-seller", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/** POST /v1/support - public contact form (no auth required) */
export async function submitSupportMessage(data: {
  name: string;
  email: string;
  message: string;
}) {
  return apiFetch("/v1/support", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export interface BlogItem {
  id?: string;
  _id?: string;
  blog_title: string;
  slug?: string;
  short_description?: string;
  description?: any;
  description_images?: string[];
  full_image_urls?: string[];
  status: number;
  createdAt: string;
  updatedAt: string;
}

export interface BlogsApiResponse {
  status: number;
  message: string;
  data: BlogItem[];
  pagination: {
    totalResults: number;
    totalPages: number;
    page: number;
    limit: number;
  };
}

/** GET /v1/blogs - public list of active blogs */
export async function getBlogs(params: {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
} = {}): Promise<BlogsApiResponse> {
  const queryParams = new URLSearchParams();
  if (params.page) queryParams.append("page", params.page.toString());
  if (params.limit) queryParams.append("limit", params.limit.toString());
  if (params.search) queryParams.append("search", params.search);
  if (params.sortBy) queryParams.append("sortBy", params.sortBy);

  const qs = queryParams.toString();
  return apiFetch<BlogsApiResponse>(qs ? `/v1/blogs?${qs}` : "/v1/blogs");
}

/** GET /v1/blogs/:blogId - single public blog */
export async function getBlogById(blogId: string): Promise<{ status: number; message: string; data: BlogItem }> {
  return apiFetch<{ status: number; message: string; data: BlogItem }>(`/v1/blogs/${blogId}`);
}

export interface CompanyConfig {
  name?: string;
  website?: string;
  tagline?: string;
  about?: string;
  copyright_text?: string;
}

export interface ContactConfig {
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
  working_hours?: string;
  timezone?: string;
}

export interface SocialLinksConfig {
  facebook?: string;
  instagram?: string;
  linkedin?: string;
  youtube?: string;
}

export interface WebsiteConfiguration {
  _id?: string;
  company?: CompanyConfig;
  contact?: ContactConfig;
  social_links?: SocialLinksConfig;
  createdAt?: string;
  updatedAt?: string;
}

export interface WebsiteConfigApiResponse {
  status: boolean | number;
  message: string;
  data: WebsiteConfiguration;
}

/** GET /v1/website-configuration - public site configuration */
export async function getWebsiteConfiguration(): Promise<WebsiteConfigApiResponse> {
  return apiFetch<WebsiteConfigApiResponse>("/v1/website-configuration");
}

export interface PlanItem {
  id?: string;
  _id?: string;
  name: string;
  price: number;
  marketplace: number;
  request_quota: number;
  expireAt?: string | null;
  status: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface PlansApiResponse {
  status: number;
  message: string;
  data: PlanItem[];
  pagination: {
    totalResults: number;
    totalPages: number;
    page: number;
    limit: number;
  };
}

/** GET /v1/plans - public list of active plans */
export async function getPublicPlans(params: {
  status?: number;
  sortBy?: string;
  limit?: number;
} = {}): Promise<PlansApiResponse> {
  const queryParams = new URLSearchParams();
  queryParams.append("status", (params.status ?? 1).toString());
  if (params.sortBy) queryParams.append("sortBy", params.sortBy);
  if (params.limit) queryParams.append("limit", params.limit.toString());

  const qs = queryParams.toString();
  return apiFetch<PlansApiResponse>(qs ? `/v1/plans?${qs}` : "/v1/plans");
}

export interface CheckoutSessionResponse {
  status: number;
  message: string;
  data: {
    sessionId: string;
    url: string;
    paymentId: string;
  };
}

/** POST /v1/payments/checkout — create Stripe Checkout Session */
export async function createCheckoutSession(data: {
  planId: string;
  email: string;
  name?: string;
}): Promise<CheckoutSessionResponse> {
  return apiFetch<CheckoutSessionResponse>("/v1/payments/checkout", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export interface PaymentSessionStatus {
  status: number;
  message: string;
  data: {
    _id?: string;
    email?: string;
    planName?: string;
    amount?: number;
    currency?: string;
    status?: "pending" | "paid" | "failed" | "canceled" | "refunded";
    paidAt?: string | null;
    stripeSessionId?: string;
  };
}

/** GET /v1/payments/session/:sessionId — payment status after Stripe return */
export async function getPaymentSession(
  sessionId: string
): Promise<PaymentSessionStatus> {
  return apiFetch<PaymentSessionStatus>(
    `/v1/payments/session/${encodeURIComponent(sessionId)}`
  );
}

