# DigistackPro

A digital downloads store with guest checkout, manual Easypaisa/JazzCash/bank payments, private file delivery, email-code order access, an admin panel, and configurable funnel templates. Architecture and milestones are in [PLAN.md](PLAN.md).

## Local setup

The UI uses official shadcn/ui components with the New York style and Tailwind v4 theme tokens in `app/globals.css`. The store's admin-configured primary color also drives shadcn's primary and focus-ring colors. Add components with `npx shadcn add <component>`; generated source lives in `components/ui` and configuration lives in `components.json`.

Use Node.js 22.12 or newer and npm. The repository uses Next.js 16.3.7 and its `proxy.ts` convention, replacing the deprecated `middleware.ts` filename.

```sh
npm ci
cp .env.example .env
# Fill in .env using your Supabase and Resend projects.
npm run db:migrate
# Run supabase/storage.sql in the Supabase SQL editor next.
npm run db:seed
npm run dev
```

In PowerShell, use `Copy-Item .env.example .env`. Prisma and Next.js both read `.env`. Never commit that file.

- Store: http://localhost:3000
- Admin: http://admin.localhost:3000
- Path-based admin also works at http://localhost:3000/admin

Modern browsers resolve `*.localhost` to loopback. If yours does not, add `127.0.0.1 admin.localhost` to your hosts file. Authentication is separate per host; logging into localhost does not log into admin.localhost.

Without database configuration, the storefront shows a real empty state and default branding. Checkout, admin management, OTP, and delivery require the services below; there is no fake payment or email success mode.

Example values such as `PROJECT`, `POOLER`, and `PASSWORD` are treated as incomplete setup, so copying `.env.example` does not trigger database connection errors while browsing. Admin login displays setup instructions until the database URL, Supabase URL, and public key are configured. Replace those values, run migrations, and follow the first-admin instructions below. Real connection failures with configured credentials still surface as errors.

The admin Home dashboard reports submitted orders over 7, 30, or 90 UTC calendar days, including today. Revenue includes approved orders only, net of discounts; product revenue allocates order discounts proportionally. Customers counts distinct checkout email addresses in the period. Comparisons use the preceding equal-length period; no percentage is shown when the previous value was zero. Pending counts reflect current order status. Digital product sales reports purchases, not download events. The sidebar badge includes all submitted pending orders regardless of the selected reporting period.

## Supabase setup

1. Create a Supabase project. Copy its URL and anon/publishable key into `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`. The latter name also accepts the newer publishable key format. Put the server secret/service-role key in `SUPABASE_SERVICE_ROLE_KEY`; never prefix that variable with `NEXT_PUBLIC_`.
2. Copy the transaction-pooler connection string into `DATABASE_URL`, keeping `pgbouncer=true` and a small `connection_limit`. Use a direct or session-pooler connection for `DIRECT_URL` and migrations. URL-encode special characters in the database password. The migration connection must be able to reference `auth.users` and configure RLS.
3. Run `npm run db:migrate`. The second migration links customers to Supabase Auth, enables RLS on every application table, revokes browser writes, and allows authenticated customers to read only their own records. Catalog and admin data go through server services. The privileged Prisma connection does not itself enforce end-user RLS: every server mutation also verifies its caller. See the [Supabase Prisma guide](https://supabase.com/docs/guides/database/prisma).
4. Run [supabase/storage.sql](supabase/storage.sql) in the SQL editor. It creates `product-files` (private), `payment-proofs` (private), and `store-images` (public), with restrictive storage policies. Do not add public read policies to private buckets.
5. Storage image limits are 5 MiB and JPEG/PNG/WebP only. Product uploads are capped at 100 MiB by the app; set your project's global storage limit accordingly if your Supabase plan permits it. A lower project limit still applies. Uploads go directly to Storage using server-authorized signed upload tokens, bypassing Vercel body-size limits. The server verifies the stored size and image signature before accepting proof.
6. Enable email authentication and email signups for optional customer access. Customize the **Magic Link** email template to show `{{ .Token }}` as a one-time code. No password or pre-checkout verification is required. Configure production SMTP (Resend SMTP can be used) so Supabase can email customers outside the development allowlist. Configure OTP expiry and Auth rate limits in Supabase. See [passwordless email setup](https://supabase.com/docs/guides/auth/auth-email-passwordless).
7. Set the Supabase Site URL initially to your deployed storefront URL. Add localhost, admin.localhost, and your exact deployed storefront/admin URLs to allowed redirect URLs. The app verifies codes inline, but keeping these URLs accurate avoids accidental fallback links to the wrong host.

### First administrator

Create a confirmed user under Supabase **Authentication → Users** for your owner email, or verify that email through My Orders first. Then run the following in the SQL editor, replacing the email:

```sql
INSERT INTO public.customers (id, email, name, role, created_at)
SELECT id, lower(email), 'Store owner', 'admin', now()
FROM auth.users
WHERE lower(email) = lower('owner@example.com') AND email_confirmed_at IS NOT NULL
ON CONFLICT (id) DO UPDATE SET role = 'admin';
```

Set a password for the confirmed owner in Supabase Authentication. Sign in at `http://admin.localhost:3000/login` with that email and password. The database password is separate from the administrator's sign-in password. Admin login does not create users. Roles are read from the protected database table, never user-editable auth metadata. To revoke access, update the customer's role back to `customer`.

Set `ADMIN_SESSION_SECRET` to a random server-only secret of at least 32 characters in `.env` and Vercel. Generate one with `node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"`. Password authentication grants host-only, HttpOnly admin access for 12 hours, bound to the Supabase user and session. Customer email-code sign-in cannot create this grant.

Under **Admin → Settings → Admin sign-in security**, email verification is off by default. Turning it on first sends a code and requires confirmation before saving. Configure Supabase's Magic Link template with `{{ .Token }}` and working SMTP before enabling it. Every subsequent admin login requires both the password and email code; the pending password step expires after 10 minutes and cannot access admin pages or APIs. Changing this setting invalidates other admin grants. This is application-enforced email two-step verification, not Supabase authenticator-app MFA/AAL2. Customer order access remains email-code based.

### Admin password recovery

Use **Forgot Password?** on the admin login page. The existing Supabase Auth user is retained. Recovery emails use the current browser origin plus `/reset-password` on admin hosts, or `/admin/reset-password` on localhost/Vercel path-based admin hosts; recovery never uses the storefront's `SITE_URL` in application code.

In **Supabase → Authentication → URL Configuration → Redirect URLs**, retain existing entries and allow:

- `http://admin.localhost:3000/reset-password`
- `http://localhost:3000/admin/reset-password`
- `https://admin.digistackpro.store/reset-password`
- `https://YOUR-DEPLOYMENT.vercel.app/admin/reset-password` for each deployment on which admin login is used.

Do not change the project's Site URL to the admin URL; storefront authentication may depend on it. A missing allowlist entry causes Supabase to fall back to the Site URL. The production storefront host blocks `/admin`, so request admin recovery on the admin host, not `digistackpro.store`.

Under **Authentication → Email Templates → Reset Password**, the link should use `<a href="{{ .ConfirmationURL }}">Reset password</a>`, not a hard-coded storefront URL or `{{ .SiteURL }}`. An optional custom template can instead use `{{ .RedirectTo }}?token_hash={{ .TokenHash }}&type=recovery`. Request a **new** recovery email after configuration changes; old links keep their old destination. Working Supabase email delivery/SMTP is required. Template customization may require custom SMTP depending on your Supabase plan.

The recovery client uses an isolated, memory-only session; it does not overwrite storefront SSR cookies or local storage. A validated recovery session for an existing database admin is required before the form enables password updates. Invalid, expired, already-used, or missing links display an error and a new-link action. Successful updates clear the current host's admin grant, sign out the recovery session, and redirect to `/login` on admin hosts or `/admin/login` on path-based admin hosts. The optional admin email-verification setting does not block recovery or change during a reset; it still applies to the subsequent password sign-in. Dashboard pages and APIs continue to require the full admin grant. Existing PKCE links from another flow should be replaced with a fresh recovery link requested through this form.

### Sample data

`npm run db:seed` creates three small sample products and a category without overwriting existing records. Set `SEED_UPLOAD_FILES=true` for the first seed to upload usable TXT/CSV files and publish the samples. Otherwise they remain drafts; upload their files and publish them from admin later. Re-running the seed does not change existing publication state.

Payment settings are intentionally blank, rather than fake account numbers. Add real instructions in **Admin → Settings** before checkout is enabled. Replace sample resources and artwork with your own products before launch.

## Payments and delivery

The customer enters their name, email, and WhatsApp, chooses a configured payment method, reviews the server-calculated total, pays externally, and uploads a screenshot. Submission freezes the order. Screenshots and downloadable files are never public.

Admin reviews the screenshot, then approves or rejects. Approval is transactional and can happen only once. Approved revenue appears on the dashboard. Product titles, prices, and file paths are snapshotted into order items, so later edits do not change existing purchases. Archive products instead of deleting their referenced files.

Set `RESEND_API_KEY` and `RESEND_FROM` to a verified sender. Approval generates 24-hour signed URLs and sends them through Resend. Failed sends stay visible in the order detail with **Retry delivery email**. Retries use a persisted payload and idempotency key; old failed payloads are regenerated before their links expire. A short database lease prevents concurrent delivery attempts. Approval remains valid if email delivery fails.

Customers can enter the checkout email on **My Orders**, verify an email code, and access matching orders. Only verified ownership of an approved order permits fresh signed links. Links are bearer credentials: anyone with an emailed link can use it until expiry, so customers should keep delivery emails private.

Discounts are either whole-number percentages or fixed PKR amounts; one coupon per cart. Usage limits count submitted, non-rejected orders. Eligibility is checked again when proof is submitted. If a coupon expires or becomes exhausted before payment, the customer must start a fresh checkout; resolve any already-sent manual payment with the customer before approval. Discount terms on used coupons are immutable; create a new code for different terms.

## Funnels

Create a draft under **Admin → Funnels**, add steps, drag their handles or use keyboard sorting, and configure the form beside the selected step. Preview shows saved templates without real sessions, orders, or analytics. Publishing validates products and paths.

- Step types: landing, checkout, order bump, upsell, downsell, thank you. Templates and Zod schemas live in the registry; there is no arbitrary HTML or page builder.
- Exactly one checkout is required, and all reachable terminal paths must pass through it. Checkout/offer steps require published products. Explicit accept/decline paths override the next position. Both explicit and sequential cycles are rejected.
- Offers before checkout accumulate in the session. Checkout creates one pending order; later accepts add unique products to that order. Final payment proof is collected once after offers. A thank-you template is the final review prompt; payment submission displays the confirmation.
- Statistics count each event type once per session and step. Purchase is recorded on admin approval, not at unpaid checkout.
- Published structures are read-only. Unpublish to edit; unfinished sessions must restart. Removed steps are archived so historical step statistics and purchase attribution remain intact. Existing purchased orders and item snapshots are preserved.
- Public entry is `/f/[funnelSlug]`; session steps are `/f/[funnelSlug]/[stepId]`. Cookies keep an unguessable session token; the server validates the current step and order state on every action.

## Vercel deployment

1. Push the repository and import it into Vercel as a Next.js project. Use Node 22 or newer, `npm ci`, and `npm run build`. The build generates the Prisma client but does not run database migrations.
2. Add environment variables from `.env.example` to the appropriate Production/Preview environments. Use a separate Supabase project for untrusted preview branches; do not expose production secrets to forks.
3. Keep `ROOT_DOMAIN=digistackpro.store` and `ADMIN_HOST=admin.digistackpro.store` even before DNS is connected. Leave `SITE_URL` empty initially. Vercel URLs work as storefronts with `/admin` on the path.
4. Apply migrations and `supabase/storage.sql` against the intended production project, configure Auth/SMTP and Resend, and promote the owner. Deploy. Visit `https://YOUR-PROJECT.vercel.app/admin/login`.
5. Add real payment instructions, upload a low-price test product, and run the live verification checklist below before accepting customer orders.

### Add both domains after the first deploy

- [ ] Add `digistackpro.store` and `admin.digistackpro.store` to the **same** Vercel project.
- [ ] Add the DNS records Vercel shows for each host; wait for valid TLS certificates.
- [ ] Confirm ROOT_DOMAIN and ADMIN_HOST still match these hosts. Set `SITE_URL=https://digistackpro.store` for canonical SEO URLs and redeploy configuration. No source changes are needed.
- [ ] Update Supabase Site URL and allowed redirect URLs to the connected domains; retain the local URLs you still use.
- [ ] Confirm the storefront works at the root domain, `/admin` on that domain returns 404, and the admin host serves its login at `/login` and panel at `/`.
- [ ] Confirm admin sign-in cookies have no Domain attribute. Sign in separately on the admin host; sessions are intentionally not shared with the storefront.
- [ ] Check storefront sitemap/robots/canonicals and admin robots/noindex. API, `_next`, and asset routes are excluded from host rewriting; API authorization is independent of the host.
- [ ] Repeat a payment approval and download from the production storefront. Test rejected payments and email retry as well.

## Checks and operations

```sh
npm run lint
npm run typecheck
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

Unit/service tests cover host routing, discount limits, graph validation, unsafe inputs, admin authorization, and download ownership/signing. Embedded PostgreSQL tests apply the actual migrations and storage policies against minimal local Supabase schema stand-ins, then exercise RLS isolation, denied mutations, payment constraints, and immutable snapshots. These do not replace live Supabase Storage/Auth tests. Browser smoke tests are intended for a clean, unconfigured development environment and cover desktop/mobile rendering, empty cart, optional email login, protected admin, CSRF rejection, and layout overflow; screenshots are saved in `test-results`.

### Live acceptance checklist (configured services required)

- [ ] Migrations and storage setup succeed on a fresh Supabase project; direct anon table writes and private-file reads fail.
- [ ] Admin uploads real thumbnails/files, edits settings/categories/coupons, and publishes products.
- [ ] Guest order works without login; altered prices are ignored, repeated requests do not create duplicate orders, and proof type/size checks reject invalid files.
- [ ] Only submitted pending orders can be reviewed; two concurrent approvals produce one transition. Reject does not grant downloads.
- [ ] Delivery email arrives, URLs work and expire after 24 hours, and an intentional Resend failure can be retried from admin.
- [ ] Email-code login claims only matching guest orders; a second customer cannot read or regenerate the first customer's downloads.
- [ ] Every funnel type renders; branching and sorting work; loop/bypass publication fails; repeated offer accepts do not duplicate items; final proof locks the order; preview creates no order/event records.
- [ ] Storefront and admin work on localhost, Vercel, and both connected domains, with separate host-only cookies.

Review Vercel server logs for errors and Resend's delivery dashboard for bounces. Keep database backups enabled. Never delete product files referenced by purchases. Periodically remove expired `rate_limits` rows and abandoned, unreferenced uploads after checking references; the app deliberately does not delete historical files automatically.

The dependency override for `deepmerge-ts` addresses the recursive-merge advisory in Prisma's tooling dependency; Prisma generation and migrations should be rechecked when upgrading it. Consult the installed Next.js documentation before framework changes.
