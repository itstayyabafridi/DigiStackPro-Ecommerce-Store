# DigistackPro implementation plan

## Architecture

One Next.js App Router codebase using TypeScript, Tailwind, shadcn/ui, Supabase (Postgres, Auth, Storage), Prisma, and Resend, deployed on Vercel. Read the installed Next.js guides before implementation; this repository uses Next.js 16.3.7.

- Server Components render catalog and account data. Client components handle cart, uploads, and editor interactions. Validated server services own pricing, authorization, orders, storage, and delivery.
- Guest checkout collects name, email, and WhatsApp without signup or verification. Optional My Orders access uses a Supabase email code; only a verified email can claim matching guest orders and regenerate downloads.
- Prisma runs server-side. Enable Supabase RLS and storage policies, and enforce authorization in every server mutation because privileged database connections can bypass RLS. Admin roles are assigned manually, never through public signup.
- Keep product files and payment screenshots private; thumbnails and branding are public. Approval emails contain 24-hour signed file URLs. Owned, approved orders can generate fresh links.
- Store money as integer paisa and display PKR. Calculate totals server-side and preserve purchased product, price, and file snapshots. One copy of each digital product per order.
- Orders retain pending, approved, and rejected statuses. A payment-submission timestamp distinguishes unfinished pending orders from orders ready for review. Freeze items after proof submission.
- Use host-only auth cookies and opaque guest/funnel cookies backed by hashed tokens. Apply Zod validation, same-origin checks, and database-backed abuse limits to mutations.

## Folders

| Path | Responsibility |
| --- | --- |
| `app/(store)/` | Home, categories, products, cart, checkout, My Orders, and public funnels |
| `app/admin/` | Admin login, dashboard, products, categories, orders, coupons, settings, funnels |
| `app/api/` | Upload/download and integration handlers |
| `components/` | shadcn primitives and shared store/admin UI |
| `lib/` | Database, auth, authorization, validation, pricing, storage, email, settings, funnel registry/services |
| `prisma/` | Schema, migrations, and repeatable sample seed |
| `supabase/` | Storage setup and RLS policies |
| `tests/` | Critical integration and browser flows |
| `proxy.ts` | Environment-driven host routing and session refresh |

## Milestones

### 1. Foundation, database, authentication, and routing

- [x] Install dependencies, configure shadcn/ui, validate environment variables, and establish shared services.
- [x] Create products, categories, customers, roles, orders, order_items, coupons, and JSON settings with constraints and indexes. Include guest contact snapshots, nullable customer ownership, payment submission, checkout-token hashes, and delivery tracking.
- [x] Implement optional customer email-code login and transactional guest-order claiming. Admin login accepts existing users only; check the database admin role on every protected page, action, and API.
- [x] Use `proxy.ts`, the agreed replacement for deprecated `middleware.ts`. Normalize hosts and ports: ADMIN_HOST or an `admin.` hostname rewrites to `/admin/*`; ROOT_DOMAIN returns 404 for `/admin` and descendants; other hosts allow path-based admin access. Avoid duplicate prefixes and exclude API, Next.js internals, and static assets.
- [x] Support both admin navigation modes, host-only cookies, and admin noindex headers/metadata. Local admin works at `http://admin.localhost:3000`.

### 2. Core storefront, guest checkout, and delivery

- [x] Build home, category, product, cart, checkout, payment submission, and My Orders pages. Use product previews, white/pale-blue surfaces, navy text, a configurable cobalt primary color, and accessible responsive shadcn components.
- [x] Persist the cart locally and revalidate availability/prices server-side. Support one percentage or fixed-PKR coupon per order, active dates, minimum spend, and optional redemption limits.
- [x] Load Easypaisa, JazzCash, and bank-transfer instructions from settings. Accept JPEG, PNG, or WebP screenshots up to 5 MiB; validate content and size server-side and bind generated storage paths to the checkout.
- [x] Approve only payment-submitted pending orders, transactionally and idempotently. Generate signed downloads and email them through Resend; persist delivery failures and offer admin retry without reverting approval.
- [x] Allow verified owners to view history and regenerate links for approved orders only. Keep private responses uncached and files inaccessible through public storage URLs.
- [x] Add SSR metadata, canonical URLs, product JSON-LD, sitemap, and host-aware robots rules. Exclude account, checkout, and admin content from indexing.

### 3. Administration and deployment readiness

- [x] Build product/category management, publication controls, coupons CRUD, order filters, screenshot previews, approval/rejection, and admin notes. Archive referenced products and retain purchased files.
- [x] Authorize direct-to-storage product uploads to avoid Vercel request-body limits; verify uploaded objects before saving products.
- [x] Show approved revenue, reviewable pending orders, and top products on the dashboard.
- [x] Implement settings for site name, logo, favicon, primary CSS color, hero content, WhatsApp, contact email, payment instructions, and default SEO.
- [x] Add loading, empty, validation, and failure states, keyboard support, and mobile layouts.
- [x] Seed sample products with usable demo downloads and clearly marked payment placeholders. Disable checkout until payment instructions are configured.
- [x] Deliver `.env.example` and README covering local setup, database connections/migrations, Supabase buckets and RLS, OTP email template, first-admin promotion, Resend sender setup, Vercel deployment, and the two-domain checklist.
- [x] Document all variables, including ROOT_DOMAIN, ADMIN_HOST, database runtime/migration connections, Supabase public/server credentials, Resend key/sender, and optional canonical site URL. Use the deployment origin before domains connect; domain activation requires configuration only, no code changes.

### 4. Funnels, after the core store works

- [x] Add funnels, funnel_steps, funnel_sessions, and funnel_events. Build a registry for landing, checkout, order_bump, upsell, downsell, and thank_you; each entry owns its React component, Zod schema, defaults, and form field metadata.
- [x] Implement `/f/[funnelSlug]` and `/f/[funnelSlug]/[stepId]`, cookie sessions, validated traversal, and view/accept/decline/purchase events.
- [x] Checkout collects contact details and creates one pending order. Earlier selections remain in the session; later accepts update that same order transactionally without duplicate products. Collect one payment screenshot for the final total after offers, then show confirmation.
- [x] Follow explicit accept/decline targets, otherwise the next position. Block loops, invalid targets, and publication unless exactly one checkout exists and every reachable terminal path passes through it. Include implicit sequential edges in validation.
- [x] Build admin funnel status controls, per-step stats, a sortable step list using dnd-kit only for ordering, type/product pickers, schema-driven side forms, and accept/decline selectors.
- [x] Keep preview admin-only and free of real orders/events. Prevent structural edits while published; unpublishing invalidates unfinished sessions with a restart message. Submitted orders cannot accept further offers.
- [x] Count purchase once on approval and use session-distinct counts for views and offer decisions.

## Verification and completion

Run lint, TypeScript checks, production build, and focused tests at the appropriate milestone. Review storefront, checkout, My Orders, and admin in desktop/mobile browsers.

Critical coverage: host-routing matrix; admin and customer isolation; RLS/private storage; verified-email ownership; price tampering; coupon limits; repeated submissions; screenshot validation; concurrent approvals; delivery failure/retry; expired-link regeneration; funnel branches/loops; duplicate accepts; final payment locking; preview isolation; and purchase-event deduplication.

Verify real Supabase, Resend, and Vercel integrations when credentials are configured. Report unverified external-service checks explicitly. README must include the post-deploy domain, DNS, canonical URL, and auth configuration checklist.

## Boundaries and execution

English, PKR, one owner, manual payment approval, and code-defined funnel templates. No automated payment verification, subscriptions, refunds workflow, or free-form page builder.

All four implementation milestones are complete in code. Local validation: production build, lint, TypeScript, 34 unit/service/PostgreSQL tests, and 10 desktop/mobile browser checks passed. Desktop and mobile screenshots were reviewed. Live Supabase Auth/Storage, Resend delivery, and Vercel/domain verification remain deployment acceptance tasks because service credentials are not configured. Follow the README checklist before launch.
