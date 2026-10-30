const fs = require('fs');
const path = require('path');

const coreDir = path.join(__dirname, '../src');

function readFileSafe(relPath) {
  try {
    return fs.readFileSync(path.join(coreDir, relPath), 'utf8');
  } catch (e) {
    return '';
  }
}

const userModelCode = readFileSafe('models/user.model.ts');
const orderModelCode = readFileSafe('models/order.model.ts');
const amazonCredModelCode = readFileSafe('models/amazon-credentials.model.ts');
const planModelCode = readFileSafe('models/plan.model.ts');
const paymentModelCode = readFileSafe('models/payment.model.ts');
const roleModelCode = readFileSafe('models/role.model.ts');
const sectionModelCode = readFileSafe('models/section.model.ts');
const marketplaceModelCode = readFileSafe('models/marketplace.model.ts');
const generalSettingModelCode = readFileSafe('models/generalSetting.model.ts');
const blogModelCode = readFileSafe('models/blog.model.ts');
const supportRequestModelCode = readFileSafe('models/support-request.model.ts');
const systemLogsModelCode = readFileSafe('models/system-logs.model.ts');
const websiteConfigModelCode = readFileSafe('models/website-configuration.model.ts');
const emailTemplateModelCode = readFileSafe('models/email-templates.model.ts');
const tokenModelCode = readFileSafe('models/token.model.ts');
const universalOtpModelCode = readFileSafe('models/universal-otp.model.ts');

const authMwCode = readFileSafe('middlewares/auth.ts');
const permissionMwCode = readFileSafe('middlewares/permission.ts');
const manageRoleMwCode = readFileSafe('middlewares/manage-role.ts');
const validateMwCode = readFileSafe('middlewares/validate.ts');
const errorMwCode = readFileSafe('middlewares/error.ts');
const rateLimiterMwCode = readFileSafe('middlewares/rateLimiter.ts');
const universalOtpMwCode = readFileSafe('middlewares/universalOtpApiKey.ts');

const apiErrorUtilCode = readFileSafe('utils/ApiError.ts');
const catchAsyncUtilCode = readFileSafe('utils/catchAsync.ts');
const systemLogUtilCode = readFileSafe('utils/system-log.ts');
const pickUtilCode = readFileSafe('utils/pick.ts');
const fileUploaderUtilCode = readFileSafe('utils/file-uploader.ts');
const errorHandlerUtilCode = readFileSafe('utils/error.handler.ts');

const toJSONPluginCode = readFileSafe('models/plugins/toJSON.plugin.ts');
const paginatePluginCode = readFileSafe('models/plugins/paginate.plugin.ts');
const commonPaginationPluginCode = readFileSafe('models/plugins/common-pagination.ts');

const sectionsData = {
  models: [
    {
      id: "user-model",
      title: "User & Seller Model",
      shortTitle: "User",
      overview: "Comprehensive Mongoose schema representing Administrators, Brand Sellers, and Seller Team Members.",
      purpose: "Handles core user identity, credentials, role associations, subscription plans, quotas, and profile metadata.",
      badge: "tbl_users",
      highlights: [
        { label: "Collection", value: "tbl_users" },
        { label: "Role Tiers", value: "admin, seller, user" },
        { label: "Auth Mechanism", value: "Bcrypt & JWT Session" },
        { label: "Plugins Applied", value: "toJSON, paginate" }
      ],
      interfaceCode: userModelCode || "// user.model.ts",
      keyFields: [
        { name: "_id", description: "Unique MongoDB ObjectId identifier" },
        { name: "name", description: "Full name of the registered user" },
        { name: "email", description: "Unique lowercased email address used for login" },
        { name: "password", description: "Bcrypt hashed password (stripped in toJSON serialization)" },
        { name: "role", description: "System role level ('admin', 'seller', 'user')" },
        { name: "role_id", description: "Reference to custom RBAC role in tbl_roles" },
        { name: "plan_id", description: "Active subscription plan reference in tbl_plans" },
        { name: "plan_limits", description: "Quotas: maxMarketplaces, maxReviewRequests, maxTeamMembers" },
        { name: "seller_id", description: "Parent seller reference for staff members" },
        { name: "status", description: "Account status: 0=Inactive, 1=Active, 2=Deleted" }
      ],
      notes: [
        "Passwords are automatically hashed pre-save via bcrypt using 8 salt rounds.",
        "Contains helper method isPasswordMatch() for validating credentials during login.",
        "Private fields such as password and __v are hidden automatically by toJSON plugin."
      ]
    },
    {
      id: "order-model",
      title: "Amazon Order & Solicitations Model",
      shortTitle: "Order",
      overview: "Synchronized Amazon customer orders retrieved from Selling Partner API (SP-API) for feedback management.",
      purpose: "Stores order fulfillment status, purchase dates, delivery estimates, and automated review request tracking.",
      badge: "tbl_orders",
      highlights: [
        { label: "Collection", value: "tbl_orders" },
        { label: "Channel", value: "AFN (FBA) & MFN (Merchant)" },
        { label: "Review Status", value: "isReviewSent boolean flag" },
        { label: "Sync Engine", value: "Amazon SP-API Orders API" }
      ],
      interfaceCode: orderModelCode || "// order.model.ts",
      keyFields: [
        { name: "amazonOrderId", description: "Unique Amazon 19-character Order ID (e.g. 302-1234567-8901234)" },
        { name: "userId", description: "Seller account ObjectId who owns the store" },
        { name: "marketplaceId", description: "Amazon Marketplace identifier (e.g. A1PA6795UKMFR9 for DE)" },
        { name: "orderStatus", description: "Current Amazon status: Shipped, Delivered, Unshipped, Canceled" },
        { name: "fulfillmentChannel", description: "AFN (Fulfilled by Amazon) or MFN (Merchant Fulfilled Network)" },
        { name: "orderTotal", description: "Currency code and total purchase amount" },
        { name: "isReviewSent", description: "Boolean flag preventing duplicate solicitation emails" },
        { name: "reviewSentDate", description: "Timestamp when review solicitation was dispatched" }
      ],
      notes: [
        "Unique compound indexing on amazonOrderId guarantees zero order duplication.",
        "The review solicitation cron evaluates orders whose delivery date satisfies the delay threshold."
      ]
    },
    {
      id: "amazon-credential-model",
      title: "Amazon SP-API Credentials Model",
      shortTitle: "AmazonCredential",
      overview: "Amazon Selling Partner API (SP-API) Login with Amazon (LWA) OAuth credentials and seller store tokens.",
      purpose: "Authorizes secure programmatic access to Amazon Order and Solicitation endpoints.",
      badge: "tbl_amazon_credentials",
      highlights: [
        { label: "Collection", value: "tbl_amazon_credentials" },
        { label: "API Standard", value: "Amazon Selling Partner API" },
        { label: "Security", value: "Masked Client Secret & Refresh Token" },
        { label: "Region", value: "European Union (EU - eu-west-1)" }
      ],
      interfaceCode: amazonCredModelCode || "// amazon-credentials.model.ts",
      keyFields: [
        { name: "userId", description: "Reference to seller user in tbl_users" },
        { name: "seller_id", description: "Amazon Merchant ID / Selling Partner Seller ID" },
        { name: "client_id", description: "Amazon LWA OAuth App Client ID" },
        { name: "client_secret", description: "Amazon LWA OAuth App Secret (encrypted)" },
        { name: "refresh_token", description: "Long-lived refresh token for generating access tokens" },
        { name: "activeMarketplaces", description: "Array of authorized Amazon marketplace IDs" }
      ],
      notes: [
        "Tokens are used by the background scheduler to mint short-lived LWA access tokens.",
        "Supports multi-marketplace selling across Germany, France, Italy, Spain, UK, Netherlands."
      ]
    },
    {
      id: "plan-model",
      title: "Subscription Plan Model",
      shortTitle: "Plan",
      overview: "Tiered subscription packages governing marketplace count, review quotas, and feature entitlements.",
      purpose: "Defines pricing tiers, feature lists, and monthly quota ceilings for brand sellers.",
      badge: "tbl_plans",
      highlights: [
        { label: "Collection", value: "tbl_plans" },
        { label: "Default Currency", value: "EUR (€)" },
        { label: "Duration", value: "30 Days per cycle" },
        { label: "Limits", value: "Marketplaces & Review Requests" }
      ],
      interfaceCode: planModelCode || "// plan.model.ts",
      keyFields: [
        { name: "name", description: "Commercial plan name (e.g. Starter, Professional, Enterprise)" },
        { name: "price", description: "Subscription charge in EUR" },
        { name: "marketplace", description: "Maximum number of connected Amazon marketplaces" },
        { name: "request_quota", description: "Monthly review solicitation requests quota ceiling" },
        { name: "status", description: "Plan state: 0=Inactive, 1=Active, 2=Deleted" }
      ],
      notes: [
        "Synced directly with Stripe subscription price IDs for automated recurring billing.",
        "Used by backend rate limits and middleware to protect review solicitation quotas."
      ]
    },
    {
      id: "payment-model",
      title: "Stripe Billing & Payments Model",
      shortTitle: "Payment",
      overview: "Persisted Stripe checkout sessions, successful charges, invoices, and billing histories.",
      purpose: "Maintains financial transaction records and triggers seller plan activations via webhooks.",
      badge: "tbl_payments",
      highlights: [
        { label: "Collection", value: "tbl_payments" },
        { label: "Payment Gateway", value: "Stripe Checkout & Webhooks" },
        { label: "Transaction State", value: "pending, paid, failed" },
        { label: "Audit Compliance", value: "Session ID & Amount" }
      ],
      interfaceCode: paymentModelCode || "// payment.model.ts",
      keyFields: [
        { name: "email", description: "Billing email address of the payer" },
        { name: "planId", description: "Purchased subscription plan reference" },
        { name: "amount", description: "Total payment amount charged" },
        { name: "stripeSessionId", description: "Stripe Checkout Session identifier" },
        { name: "status", description: "Payment state: 'pending', 'paid', 'failed'" }
      ],
      notes: [
        "Updated asynchronously upon receiving cryptographically signed Stripe webhook events.",
        "Prevents race conditions by verifying stripeSessionId idempotency."
      ]
    },
    {
      id: "role-model",
      title: "RBAC Role & Permissions Model",
      shortTitle: "Role",
      overview: "Granular Role-Based Access Control matrix governing section access (view, create, update, delete).",
      purpose: "Enables administrators and sellers to create custom roles and assign precise permissions.",
      badge: "tbl_roles",
      highlights: [
        { label: "Collection", value: "tbl_roles" },
        { label: "Architecture", value: "Section Permissions Matrix" },
        { label: "Scope", value: "Admin & Seller Scopes" },
        { label: "Actions", value: "canView, canCreate, canUpdate, canDelete" }
      ],
      interfaceCode: roleModelCode || "// role.model.ts",
      keyFields: [
        { name: "role", description: "Machine-readable slug identifier (e.g. catalog_specialist)" },
        { name: "title", description: "Human-readable display name for the role" },
        { name: "scope", description: "Applicability domain: 'admin' or 'seller'" },
        { name: "sectionPermissions", description: "Array of { section, canView, canCreate, canUpdate, canDelete }" }
      ],
      notes: [
        "Evaluated dynamically by checkPermission middleware before controller execution.",
        "System administrator role bypasses permission checks automatically."
      ]
    },
    {
      id: "section-model",
      title: "System Sections & Modules Model",
      shortTitle: "Section",
      overview: "Registry of platform modules and dashboard navigation items available for permission assignment.",
      purpose: "Centralizes available features and controls navigation visibility across admin and seller panels.",
      badge: "tbl_sections",
      highlights: [
        { label: "Collection", value: "tbl_sections" },
        { label: "Scope", value: "Admin and Seller Navigation" },
        { label: "Hierarchy", value: "Name, Title, Icon, Order" }
      ],
      interfaceCode: sectionModelCode || "// section.model.ts",
      keyFields: [
        { name: "name", description: "Section unique key identifier (e.g. 'orders', 'settings')" },
        { name: "title", description: "Display title for the navigation item" },
        { name: "scope", description: "Section scope: 'admin' or 'seller'" },
        { name: "order", description: "Sorting index for visual navigation ordering" }
      ],
      notes: [
        "Acts as the master schema for constructing role permission checkboxes.",
        "Supports dynamic module activation and deactivation without code changes."
      ]
    },
    {
      id: "marketplace-model",
      title: "Amazon Marketplaces Registry",
      shortTitle: "Marketplace",
      overview: "Amazon supported global country marketplaces, identifiers, regions, and currency codes.",
      purpose: "Stores Amazon marketplace configurations for Germany, France, Italy, Spain, UK, etc.",
      badge: "tbl_marketplaces",
      highlights: [
        { label: "Collection", value: "tbl_marketplaces" },
        { label: "Marketplace IDs", value: "Amazon Official Identifiers" },
        { label: "Currencies", value: "EUR, GBP, USD" }
      ],
      interfaceCode: marketplaceModelCode || "// marketplace.model.ts",
      keyFields: [
        { name: "marketplace_id", description: "Amazon official Marketplace ID (e.g. A1PA6795UKMFR9)" },
        { name: "country_code", description: "ISO 3166-1 alpha-2 country code (DE, FR, IT, ES)" },
        { name: "country", description: "English name of the country" },
        { name: "status", description: "0: Inactive, 1: Active, 2: Deleted" }
      ],
      notes: [
        "Pre-seeded with official Amazon Selling Partner EU and North American marketplaces."
      ]
    },
    {
      id: "general-setting-model",
      title: "Automation Settings & Schedule Model",
      shortTitle: "GeneralSetting",
      overview: "Seller review automation campaign configurations, scheduled execution hours, and filters.",
      purpose: "Stores seller preferences for automated review solicitation delays and active marketplace targets.",
      badge: "tbl_general_settings",
      highlights: [
        { label: "Collection", value: "tbl_general_settings" },
        { label: "Scheduling", value: "Configurable Execution Hour" },
        { label: "Filters", value: "Order Status & Delay Days" }
      ],
      interfaceCode: generalSettingModelCode || "// generalSetting.model.ts",
      keyFields: [
        { name: "userId", description: "Seller account ObjectId" },
        { name: "amazonCredentialId", description: "Selected Amazon SP-API credential" },
        { name: "activeMarketplaces", description: "Marketplaces targeted for review solicitations" },
        { name: "schedule_time", description: "Time of day when solicitation cron executes (e.g. '14:00')" },
        { name: "review_delay_days", description: "Days to wait after delivery before soliciting reviews" }
      ],
      notes: [
        "Controls the review solicitation worker to send compliant requests within Amazon guidelines (5-30 days)."
      ]
    },
    {
      id: "blog-model",
      title: "Blog & Content Articles Model",
      shortTitle: "Blog",
      overview: "Public marketing website blog articles, SEO slugs, rich text content, and banners.",
      purpose: "Content management system powering informative articles and SEO landing pages.",
      badge: "tbl_blogs",
      highlights: [
        { label: "Collection", value: "tbl_blogs" },
        { label: "Formatting", value: "Rich HTML & Description Images" },
        { label: "SEO", value: "Unique Indexed Slugs" }
      ],
      interfaceCode: blogModelCode || "// blog.model.ts",
      keyFields: [
        { name: "blog_title", description: "Article headline and H1 title" },
        { name: "slug", description: "URL-friendly slug (e.g. 'how-to-automate-amazon-reviews')" },
        { name: "short_description", description: "Summary excerpt for cards and meta descriptions" },
        { name: "description", description: "Full article body content" },
        { name: "banner_image", description: "Hero banner image URL" }
      ],
      notes: [
        "Indexed by slug for fast server-side and client-side blog routing."
      ]
    },
    {
      id: "support-request-model",
      title: "Support Tickets & Inquiries Model",
      shortTitle: "SupportRequest",
      overview: "Customer inquiries, contact forms, and seller technical support requests.",
      purpose: "Tracks customer support issues, status (pending, in-progress, resolved), and response trails.",
      badge: "tbl_support_requests",
      highlights: [
        { label: "Collection", value: "tbl_support_requests" },
        { label: "Workflow", value: "Pending ➔ In-Progress ➔ Resolved" },
        { label: "Notification", value: "Email dispatch to support desk" }
      ],
      interfaceCode: supportRequestModelCode || "// support-request.model.ts",
      keyFields: [
        { name: "name", description: "Name of the customer or seller submitting request" },
        { name: "email", description: "Contact email address for follow-ups" },
        { name: "message", description: "Detailed inquiry message or bug report" },
        { name: "status", description: "Ticket status: 'pending', 'in-progress', 'resolved'" }
      ],
      notes: [
        "Admin panel provides direct response and status update capabilities."
      ]
    },
    {
      id: "system-logs-model",
      title: "System Audit & Security Logs Model",
      shortTitle: "SystemLog",
      overview: "Immutable audit trail recording administrative actions, payload diffs, and security events.",
      purpose: "Ensures compliance and security accountability across all user, plan, and role modifications.",
      badge: "tbl_system_logs",
      highlights: [
        { label: "Collection", value: "tbl_system_logs" },
        { label: "Security", value: "IP Address & Operator ID Logging" },
        { label: "Auditing", value: "Operation Data Snapshot Diffs" }
      ],
      interfaceCode: systemLogsModelCode || "// system-logs.model.ts",
      keyFields: [
        { name: "operation", description: "Action identifier (e.g. 'CREATE_USER', 'UPDATE_PLAN')" },
        { name: "operation_by", description: "Admin user ObjectId who triggered the action" },
        { name: "key", description: "Entity key or module name affected" },
        { name: "operation_data", description: "Before and after data snapshot payload" },
        { name: "ip_address", description: "Client IP address captured from request header" }
      ],
      notes: [
        "Written asynchronously by systemLog utility without blocking client responses."
      ]
    },
    {
      id: "website-config-model",
      title: "Website Branding Configuration Model",
      shortTitle: "WebsiteConfiguration",
      overview: "Global brand profile, company legal information, contact coordinates, and social media links.",
      purpose: "Centralizes customizable site metadata powering the public website and footer waves.",
      badge: "tbl_website_configurations",
      highlights: [
        { label: "Collection", value: "tbl_website_configurations" },
        { label: "Scope", value: "Company, Contact, Social Profiles" }
      ],
      interfaceCode: websiteConfigModelCode || "// website-configuration.model.ts",
      keyFields: [
        { name: "company", description: "Name, website, tagline, about, copyright_text" },
        { name: "contact", description: "Email, phone, postal address, support hours" },
        { name: "social_links", description: "Facebook, Instagram, LinkedIn, YouTube URLs" }
      ],
      notes: [
        "Exposed via cached public GET /v1/website-configuration endpoint."
      ]
    },
    {
      id: "email-template-model",
      title: "Email & Notification Templates Model",
      shortTitle: "EmailTemplate",
      overview: "Customizable HTML email templates for OTP verification, welcome emails, and plan invoices.",
      purpose: "Stores dynamic email copy and subject lines with mustache-style placeholder variables.",
      badge: "tbl_email_templates",
      highlights: [
        { label: "Collection", value: "tbl_email_templates" },
        { label: "Templating", value: "Dynamic Variable Substitution" }
      ],
      interfaceCode: emailTemplateModelCode || "// email-templates.model.ts",
      keyFields: [
        { name: "subject", description: "Email subject line template" },
        { name: "content", description: "HTML email body with {{variables}}" },
        { name: "status", description: "0: Inactive, 1: Active, 2: Deleted" }
      ],
      notes: [
        "Rendered at runtime by templateHelpers utility during email dispatch."
      ]
    }
  ],

  middlewares: [
    {
      id: "auth-guard",
      title: "JWT Authentication Guard",
      overview: "Passport.js JWT Bearer token authentication middleware verifying authorization headers.",
      code: authMwCode || "// auth.ts",
      notes: [
        "Validates signature using JWT_SECRET from configuration.",
        "Rejects expired or tampered tokens with 401 Unauthorized.",
        "Attaches authenticated user document to req.user."
      ],
      highlights: [
        { label: "Type", value: "Express Request Guard" },
        { label: "Strategy", value: "Passport JWT" },
        { label: "Header", value: "Authorization: Bearer <token>" }
      ]
    },
    {
      id: "permission-guard",
      title: "RBAC Section Permission Guard",
      overview: "Dynamic authorization middleware checking user role privileges (canView, canCreate, canUpdate, canDelete).",
      code: permissionMwCode || "// permission.ts",
      notes: [
        "Extracts user role and queries tbl_roles for section privileges.",
        "Grants automatic bypass for system administrators.",
        "Returns 403 Forbidden if user lacks the required permission."
      ],
      highlights: [
        { label: "Type", value: "Authorization Interceptor" },
        { label: "Granularity", value: "Section + Action Matrix" },
        { label: "Security", value: "403 Forbidden Protection" }
      ]
    },
    {
      id: "manage-role-guard",
      title: "Role Scope & Hierarchy Guard",
      overview: "Enforces role boundary protection preventing sellers from modifying admin accounts.",
      code: manageRoleMwCode || "// manage-role.ts",
      notes: [
        "Verifies operator role hierarchy before role updates.",
        "Ensures seller team members can only be managed by their owner."
      ],
      highlights: [
        { label: "Type", value: "Hierarchy Validator" },
        { label: "Scope", value: "Admin & Seller Isolation" }
      ]
    },
    {
      id: "validate-pipe",
      title: "Joi Schema Validation Middleware",
      overview: "Request payload validator enforcing schema constraints on body, query, and path parameters.",
      code: validateMwCode || "// validate.ts",
      notes: [
        "Validates request data against defined Joi schemas.",
        "Strips unknown properties and enforces strict types.",
        "Returns 400 Bad Request with precise validation error messages."
      ],
      highlights: [
        { label: "Type", value: "Validation Middleware" },
        { label: "Engine", value: "Joi Schema Validator" },
        { label: "Targets", value: "body, query, params" }
      ]
    },
    {
      id: "error-converter",
      title: "Global Error Converter & Handler",
      overview: "Centralized Express error handling pipeline normalizing errors into standardized JSON envelopes.",
      code: errorMwCode || "// error.ts",
      notes: [
        "Converts unknown errors (e.g. Mongoose, CastError) into ApiError instances.",
        "Formats final response as { status, message, stack? }.",
        "Hides stack traces in production environment."
      ],
      highlights: [
        { label: "Type", value: "Express Error Handler" },
        { label: "Format", value: "{ status, message }" }
      ]
    },
    {
      id: "rate-limiter",
      title: "IP Rate Limiter Middleware",
      overview: "Brute-force protection throttling authentication and OTP solicitation requests.",
      code: rateLimiterMwCode || "// rateLimiter.ts",
      notes: [
        "Restricts repeated failed login and OTP requests from the same IP.",
        "Prevents denial of service and credential stuffing attacks."
      ],
      highlights: [
        { label: "Type", value: "Security Throttler" },
        { label: "Target", value: "/auth/* routes" }
      ]
    },
    {
      id: "universal-otp-guard",
      title: "Universal OTP Security Guard",
      overview: "API Key authorization middleware guarding programmatic universal OTP generation.",
      code: universalOtpMwCode || "// universalOtpApiKey.ts",
      notes: [
        "Validates x-api-key header against server configured secret.",
        "Protects automated test environments and staging OTP endpoints."
      ],
      highlights: [
        { label: "Type", value: "API Key Guard" },
        { label: "Header", value: "x-api-key" }
      ]
    }
  ],

  utilities: [
    {
      id: "api-error-class",
      title: "ApiError Custom Exception Class",
      overview: "Standardized operational error class extending native Error with HTTP status codes.",
      code: apiErrorUtilCode || "// ApiError.ts",
      notes: [
        "Accepts statusCode, message, isOperational flag, and custom stack.",
        "Used universally across controllers and services for throwing expected errors."
      ],
      highlights: [
        { label: "Type", value: "Custom Exception Class" },
        { label: "Inheritance", value: "extends Error" }
      ]
    },
    {
      id: "catch-async-wrapper",
      title: "catchAsync Controller Wrapper",
      overview: "Higher-order utility wrapping asynchronous Express route handlers to forward unhandled rejections to next().",
      code: catchAsyncUtilCode || "// catchAsync.ts",
      notes: [
        "Eliminates redundant try/catch blocks in controller methods.",
        "Guarantees all Promise rejections reach the centralized error handler."
      ],
      highlights: [
        { label: "Type", value: "Async Handler Wrapper" },
        { label: "Benefit", value: "Zero try/catch boilerplate" }
      ]
    },
    {
      id: "system-audit-logger",
      title: "System Audit Activity Logger",
      overview: "Asynchronous background helper persisting admin and seller activity diffs to tbl_system_logs.",
      code: systemLogUtilCode || "// system-log.ts",
      notes: [
        "Captures operator ID, action name, module, IP address, and changed fields.",
        "Executed in non-blocking fashion without delaying HTTP responses."
      ],
      highlights: [
        { label: "Type", value: "Audit Logger" },
        { label: "Target", value: "tbl_system_logs" }
      ]
    },
    {
      id: "pick-utility",
      title: "Object Property Whitelist Utility",
      overview: "Safe utility creating an object composed of selected whitelisted properties.",
      code: pickUtilCode || "// pick.ts",
      notes: [
        "Extracts search, page, limit, and filter parameters cleanly from req.query.",
        "Guards against prototype pollution and unintended query injection."
      ],
      highlights: [
        { label: "Type", value: "Data Sanitizer" },
        { label: "Input", value: "object + keys array" }
      ]
    },
    {
      id: "file-uploader",
      title: "Multer File Uploader Utility",
      overview: "Configured Multer storage engine handling avatar images, blog banners, and media uploads.",
      code: fileUploaderUtilCode || "// file-uploader.ts",
      notes: [
        "Validates image MIME types (JPEG, PNG, WebP) and 5MB size limits.",
        "Generates unique random filenames to avoid file collisions."
      ],
      highlights: [
        { label: "Type", value: "File Storage Engine" },
        { label: "Destination", value: "uploads/ directory" }
      ]
    },
    {
      id: "diagnostic-error-handler",
      title: "Diagnostic Service Error Logger",
      overview: "Formatted console and Winston logger capturing contextual runtime diagnostics.",
      code: errorHandlerUtilCode || "// error.handler.ts",
      notes: [
        "Categorizes errors by action_type for quick debugging in development.",
        "Integrates with Morgan HTTP logger in production."
      ],
      highlights: [
        { label: "Type", value: "Logger Helper" },
        { label: "Output", value: "Console & Logs" }
      ]
    }
  ],

  plugins: [
    {
      id: "to-json-plugin",
      title: "Mongoose toJSON Serialization Plugin",
      overview: "Custom Mongoose plugin transforming documents into clean API response JSON objects.",
      code: toJSONPluginCode || "// toJSON.plugin.ts",
      notes: [
        "Deletes private fields like password and __v.",
        "Transforms _id to id string representation automatically.",
        "Applied globally across all application Mongoose schemas."
      ],
      highlights: [
        { label: "Type", value: "Mongoose Schema Plugin" },
        { label: "Behavior", value: "Strips password & converts _id to id" }
      ]
    },
    {
      id: "paginate-plugin",
      title: "Mongoose Pagination & Query Plugin",
      overview: "High-performance pagination plugin adding paginate() static method to Mongoose models.",
      code: paginatePluginCode || "// paginate.plugin.ts",
      notes: [
        "Handles sortBy, limit, page, and populate options seamlessly.",
        "Returns { results, page, limit, totalPages, totalResults } standard envelope."
      ],
      highlights: [
        { label: "Type", value: "Mongoose Query Plugin" },
        { label: "Output", value: "Paginated Results Envelope" }
      ]
    },
    {
      id: "common-pagination",
      title: "Common Pagination Envelope Helper",
      overview: "Transforms raw pagination counters into unified API response envelopes.",
      code: commonPaginationPluginCode || "// common-pagination.ts",
      notes: [
        "Ensures consistent response metadata across admin and seller tables."
      ],
      highlights: [
        { label: "Type", value: "Envelope Utility" },
        { label: "Structure", value: "{ status, message, data, pagination }" }
      ]
    }
  ],

  configuration: {
    serverPort: "7051",
    environment: "development",
    authWindow: "15m / 30d",
    groups: [
      {
        title: "Server & Runtime Environment",
        summary: "Core Node.js runtime process ports and hosting variables.",
        entries: [
          { key: "PORT", description: "Backend server listening port (Default: 7051)" },
          { key: "NODE_ENV", description: "Application runtime mode ('development' | 'production' | 'test')" },
          { key: "APP_URL", description: "Public canonical backend base URL" },
          { key: "CORS_ORIGIN", description: "Allowed CORS client origins for admin, seller, and web apps" }
        ]
      },
      {
        title: "Database Cluster Settings",
        summary: "MongoDB cluster connection and connection pool configurations.",
        entries: [
          { key: "MONGODB_URL", description: "MongoDB connection string with credentials and database name" },
          { key: "AUTO_INDEX", description: "Mongoose auto-index creation enabled in development" },
          { key: "POOL_SIZE", description: "Maximum concurrent database connection pool allocation" }
        ]
      },
      {
        title: "JWT & Authentication Windows",
        summary: "Cryptographic secrets and session token lifetime parameters.",
        entries: [
          { key: "JWT_SECRET", description: "HMAC SHA-256 secret key for signing user session tokens" },
          { key: "JWT_ACCESS_EXPIRATION_MINUTES", description: "Short-lived access token validity (Default: 15 minutes)" },
          { key: "JWT_REFRESH_EXPIRATION_DAYS", description: "Persistent refresh token validity (Default: 30 days)" },
          { key: "JWT_RESET_PASSWORD_EXPIRATION_MINUTES", description: "Password recovery link expiry window (10 minutes)" }
        ]
      },
      {
        title: "Amazon SP-API Integration",
        summary: "Selling Partner API OAuth App credentials and LWA endpoints.",
        entries: [
          { key: "AMAZON_CLIENT_ID", description: "Login with Amazon (LWA) App Client ID" },
          { key: "AMAZON_CLIENT_SECRET", description: "Login with Amazon (LWA) App Secret" },
          { key: "AMAZON_OAUTH_REDIRECT_URL", description: "Registered OAuth callback URL for seller authorization" },
          { key: "SP_API_REGION", description: "AWS Selling Partner API regional endpoint (eu-west-1)" }
        ]
      },
      {
        title: "Stripe Payment Gateway",
        summary: "Stripe API keys for checkout sessions and webhook verification.",
        entries: [
          { key: "STRIPE_SECRET_KEY", description: "Stripe secret API key for billing and session creation" },
          { key: "STRIPE_WEBHOOK_SECRET", description: "Cryptographic secret for verifying Stripe webhook signatures" },
          { key: "PAYMENT_CURRENCY", description: "Default transaction currency (Default: 'eur')" }
        ]
      },
      {
        title: "Email & SMTP Service",
        summary: "Outgoing mail server configuration for OTP and notifications.",
        entries: [
          { key: "SMTP_HOST", description: "Outbound SMTP server hostname" },
          { key: "SMTP_PORT", description: "SMTP port (587 for TLS, 465 for SSL)" },
          { key: "SMTP_USERNAME", description: "SMTP authentication username" },
          { key: "SMTP_PASSWORD", description: "SMTP authentication password" },
          { key: "EMAIL_FROM", description: "Sender display name and email address" }
        ]
      }
    ]
  }
};

const targetPath = path.join(__dirname, '../../gravurtastisch_panel/public/api-docs/technical-doc-sections.json');
fs.writeFileSync(targetPath, JSON.stringify(sectionsData, null, 2), 'utf8');
console.log('Successfully generated technical-doc-sections.json at:', targetPath);
