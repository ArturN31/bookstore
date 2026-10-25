# Bookstore Codebase Analysis

**Audit date:** October 23, 2026
**Repository:** `ArturN31/bookstore`
**Audited checkout:** `master` at `bf2e178` with current uncommitted development-tools changes
**Scope:** Checked-out application source, tests, SQL migrations, configuration, workflow files, and existing Lighthouse reports. Local environment files and credential values were not inspected or included.
**Verification performed:** `npm run test`, `npm run lint`, and `npm run build`.

## Executive Assessment

This is a substantial full-stack bookstore prototype built with Next.js App Router, React, TypeScript, Supabase/PostgreSQL, and Stripe. It implements catalog discovery, account and profile flows, reviews, cart and wishlist functionality, public/private sharing, card checkout, order views, development tooling, and selected database-backed privacy/security controls. Domain code is generally separated into schemas, actions, services, repositories, and mappers.

The audited checkout passes the current configured verification: **243 Jest suites, 1,810 tests, and one snapshot passed; configured statement, branch, function, and line coverage each report 100%; ESLint passed; and the Next.js production build completed its TypeScript verification and route generation.** The standard Jest run does not execute the opt-in local Supabase integration suites. These results do not prove deployed database policies, Stripe delivery/retry behavior, end-to-end customer journeys, or production operations. The reported coverage applies only to Jest's configured collection.

**Assessment:** strong prototype-level breadth, clear domain boundaries in several areas, and broad mocked unit/component tests. The repository is a personal project, not an operated retail service. A high-priority remaining issue is a reconciliation path that ignores a database deletion failure. The checkout and order-detail pages now direct unauthenticated customers to the actual sign-in route and preserve the requested order destination. The development console is intended for local seed/reset/data-generation workflows, is restricted to development mode, and uses service-role access; it must target the intended development database. Any future production commerce deployment would also require verifying migrations, RLS policies, edge-proxy configuration, and external integrations.

## 1. Architecture and Features

### Current design

- **Web application:** [app/](app/) uses Next.js App Router route segments, server-rendered pages, Server Actions, and route handlers. The current production build includes catalog, checkout, order, profile, review, wishlist, development-tool, Stripe webhook, and reconciliation routes.
- **Shared presentation:** [components/](components/) contains shared layout, catalog, cart, form, filtering, and interaction components. Route-specific composition generally remains close to its route.
- **Domain/data layer:** [data/](data/) groups authentication, books, cart, checkout, and user operations. Schemas and actions feed services, repositories, and mappers.
- **Client state:** [providers/](providers/) composes catalog/filtering, user, cart, and notification state. Cart and user domains use reducers and separate state/action contexts.
- **Database boundary:** [utils/db/server.ts](utils/db/server.ts) and [utils/db/client.ts](utils/db/client.ts) create SSR-aware and browser Supabase clients. [utils/db/admin.ts](utils/db/admin.ts) exposes service-role access and therefore requires strict server-only use.
- **Persistence and policy source:** five versioned files exist in [supabase/migrations/](supabase/migrations/), including the captured schema/RPC definitions, public privacy changes, service-role-only commerce RPC permissions, and atomic checkout discount redemption. The presence of source migrations does not prove that a deployed database has applied them or that it matches the checked-in baseline.
- **External services:** Supabase Auth, PostgreSQL, and Realtime support identity and persistence. Stripe PaymentIntents and signed webhooks support card payments. Upstash Redis provides shared rate-limit storage.

### Strengths

1. Route/UI, domain orchestration, persistence access, and mapping have recognizable boundaries.
2. Catalog content is server-rendered, with interactive client components limited to workflows that need browser state.
3. Zod schemas and generated database types improve consistency at several boundaries.
4. Checkout derives line items from the authenticated user's server-side cart and obtains authoritative product data on the server.
5. Database RPCs provide transaction boundaries for order creation and Stripe event handling; migration 20261021160000 restricts the commerce RPCs to the service role.
6. Privacy behavior is represented in SQL, application routes, and opt-in local integration tests rather than only in UI conditions.

### Bottlenecks and recommendations

- **Distributed commerce state:** Supabase and Stripe cannot participate in one ACID transaction. Define and test explicit order/payment states, idempotent transitions, compensation, and operator recovery paths.
- **Migration operations:** apply the committed migrations to a disposable database in CI and verify production migration history before rollout. Add explicit rollback/forward-fix guidance for schema changes.
- **Development tools:** the local seed/reset console is purpose-built for maintaining project data and can make destructive service-role writes. Keep its runtime guard on the page and every action, keep the development server private, and ensure local credentials point to the intended development database.
- **Route/action scope:** some domain modules coordinate several operations. Keep the public action boundary narrow and put business rules into small, testable service functions.

## 2. State Management and Server Actions

### Data flow

[components/layout/SessionProviderWrapper.tsx](components/layout/SessionProviderWrapper.tsx) loads session-linked state and seeds [providers/Providers.tsx](providers/Providers.tsx). User and cart reducers centralize client-side transitions; Realtime listeners refresh state from Supabase. Search/filter inputs and other transient UI state remain local to hooks or components. Persistent mutations generally pass through Server Actions into domain services and repositories.

For checkout, [data/checkout/CheckoutAction.ts](data/checkout/CheckoutAction.ts) validates the server payload, applies IP and user rate limits, resolves the current user, and fetches that user's cart from the server. [data/checkout/services/CheckoutService.ts](data/checkout/services/CheckoutService.ts) orchestrates the workflow; [data/checkout/services/CheckoutServiceUtils.ts](data/checkout/services/CheckoutServiceUtils.ts) separates product/discount loading, total calculation, order persistence, and PaymentIntent recovery. The order transaction RPC reloads/validates database data and reserves discount usage through the new trigger. These controls prevent client-supplied item IDs, prices, or quantities from being the source of truth.

### Strengths

- Server-seeded user/cart state reduces avoidable hydration flashes.
- Reducers make complex cart and user state transitions testable.
- The checkout action derives the actor from the server-side session and reads that actor's cart.
- Sensitive order reads include ownership checks; public data routes have specific visibility behavior.
- Rate limits are backed by Upstash Redis and configured to fail closed on protected paths.

### Findings and recommendations

1. **Discount enforcement is now transactional but deployment must be verified.** Migration `20261022130000_enforce_checkout_discount_redemptions.sql` adds a `BEFORE INSERT` trigger on `order_discounts` that locks and validates the discount and order, enforces active status, activation dates, minimum subtotal, global usage limits, and per-user usage limits, then increments usage as part of the order transaction. Reservations are released when a pending order fails or is cancelled. A dedicated local Supabase integration suite covers rejection boundaries and concurrent reservation. Apply and run this migration in each environment; do not infer deployment state from the checked-in file.
2. **Server Actions are public mutation endpoints.** `proxy.ts` and page redirects provide useful session handling but are not authorization boundaries for exported actions. Authenticate and authorize inside every action, validate every argument at runtime, and ensure service-role clients are never driven by an unauthenticated caller.
4. **Realtime refreshes can amplify reads.** Coalesce bursts and measure subscription count/query volume before scaling; avoid replacing authoritative database reads with unvalidated client state.
5. **External payment orchestration needs stronger state semantics.** An order RPC and PaymentIntent call are separate systems. Test retry, timeout, and partial-failure windows and make cleanup/reconciliation observable rather than assuming both sides commit together.

## 3. Utility and Reusability

### Existing practices

- Shared validation schemas, error sanitization, Supabase client factories, rate-limit helpers, retry utilities, IP extraction, and security-audit logging live under [utils/](utils/) or domain schema modules.
- Supabase row-to-domain mapping and repositories help keep database-specific shapes out of some UI components.
- Generated declarations in [database.types.ts](database.types.ts) provide table and RPC typing, while Zod is used for runtime validation in several forms and actions.

### Risks and recommendations

- A TypeScript database type is not runtime validation. Parse RPC responses and external-service payloads before using them as trusted domain values.
- Review retry helpers so they retry only known transient errors and idempotent operations. Retrying arbitrary writes can duplicate effects.
- Keep error handling explicit: preserve useful operational context in server logs while returning sanitized messages to clients. Avoid treating ignored Supabase errors as successful work.
- Avoid duplicating authorization or discount rules across preview, checkout, webhook, and reconciliation code. Put shared policy in a transaction/service contract that can be tested once at its authoritative boundary.
- Keep service-role client construction centralized and server-only; do not import admin helpers into client-reachable modules.

## 4. Testing Strategy

### Current evidence

The standard Jest suite contains app, component, data, hook, provider, and utility tests, with framework and service mocks in [__mocks__/](__mocks__/). [jest.config.ts](jest.config.ts) collects coverage for a configured source set and excludes the opt-in integration directory. The latest run on October 23, 2026 completed with:

| Check | Result |
| --- | --- |
| Jest suites | 243 passed / 243 total |
| Jest tests | 1,810 passed / 1,810 total |
| Snapshots | 1 passed / 1 total |
| Statements / branches / functions / lines | 100% each in the configured collection |
| ESLint | Passed |
| Production build | Passed; TypeScript verification and route generation completed |

Opt-in database suites are configured by [jest.integration.config.js](jest.integration.config.js), with commands for privacy behavior, commerce-RPC permissions, and discount-redemption behavior. The discount-redemption suite was run after syncing `master` and passed all four tests; the privacy and RPC-permission suites were not run. There is no evidence here of a live Stripe integration test, full browser E2E test suite, or production migration verification.

### Strengths

- High unit/component coverage within the declared Jest collection.
- The existing test structure covers data services, reducer transitions, validation, and selected security behavior.
- Privacy and RPC permission tests are designed to run against a local Supabase instance without broad fixture seeding.

### Gaps and recommendations

1. Run the new database integration suite for concurrent discount redemption, active/date/minimum checks, per-user/global limits, and reservation release against a local Supabase stack.
2. Test Stripe webhook duplicate, out-of-order, transient database failure, and reconciliation cases against local database functions.
3. Add browser E2E coverage for signup/sign-in return flow, checkout success/failure/cancellation, order ownership, profile privacy, and wishlist token revocation.
4. Extend CI beyond Jest to include lint, production build/type checking, migration application, privacy/RPC/discount integration tests, and selected E2E checks.
5. Treat 100% configured coverage as a useful regression signal, not evidence that excluded routes, CSS, infrastructure, external services, or production configuration are correct.
6. Avoid asserting live service behavior based on mocked Supabase/Stripe responses.

## 5. Security

### Existing controls

- Supabase SSR/browser/admin clients are separated.
- Checkout performs runtime payload validation and uses the authenticated user's cart.
- Order pages perform ownership checks; the Stripe webhook validates the signature before processing events.
- The webhook transaction records event IDs and makes payment/order state changes idempotent in the database function.
- Public profile/review/wishlist behavior is covered by privacy-oriented SQL and integration-test code.
- Upstash sliding-window rate limiting is shared across application instances and fails closed for sensitive operations.
- [next.config.ts](next.config.ts) configures response security headers, including CSP, HSTS, frame/content-type protections, referrer policy, and permissions policy.

### High-priority findings

1. **Development seed/reset operations are destructive by design.** The `/dev-tools` page and its exported actions are restricted to `NODE_ENV=development`. The tools use service-role privileges for this personal project's data generation and reset workflows; keep the development server private and verify that its credentials target the intended development database.
2. **Reconciliation ignores an event deletion error.** [app/api/cron/reconcile/route.ts](app/api/cron/reconcile/route.ts) deletes an unmatched webhook ledger row before retrying the event but does not inspect the delete result. A failed delete followed by a duplicate-aware RPC call can make recovery appear successful without replaying the intended transition. Check and surface the deletion error, and make replay semantics atomic and explicit.
3. **Trusted proxy configuration is security-sensitive.** [utils/network/getAppClientIp.ts](utils/network/getAppClientIp.ts) reads edge-provided client-IP headers. Any deployment must ensure requests reach the app only through a trusted proxy that overwrites those headers; otherwise IP-based limits can be spoofed.
4. **CSP has permissive script directives.** The current policy includes `'unsafe-inline'` and `'unsafe-eval'`. Evaluate nonces/hashes compatible with Next.js, MUI, and Stripe; do not remove required behavior without browser verification.
5. **Migration application is unverified.** The repository contains privacy, commerce-RPC permission, and checkout-discount migrations, but deployment history and actual live RLS/grants were not inspected. Confirm the migration state and test least-privilege access against a disposable project before any production use.

### Privacy model and data exposure

The current implementation has separate profile, review, and wishlist visibility controls. Profile privacy does not automatically hide a review or a username-addressable wishlist when that section is independently public; the public profile page displays sections only when both the profile and section permit display. Public profile data includes username and, when public, join month/year. Public reviews include review/book identifiers, username, rating, text, timestamps, and book title/author. Public wishlist entries include username and book identifiers and catalog display fields such as title, author, price, image URL, and description. Private contact details, address, date of birth, phone, and the wishlist share token should not be exposed by these views.

A private wishlist token is a bearer secret: anyone who possesses the current token can view the shared list. Token rotation/revocation and public/private transitions must remain tested. No social feed or community messaging is currently implemented; additional community features should wait until this data-exposure contract is documented, reviewed, and tested.

### Additional security recommendations

- Secure every Server Action independently of route visibility and keep privileged actions out of untrusted environments.
- Validate authorization at the data boundary as well as the UI; test anon, authenticated owner, authenticated non-owner, and service-role behavior.
- Use sanitized client errors with structured, monitored server-side diagnostics and durable audit delivery for security-relevant events.
- Add startup validation for required configuration and ensure service-role, Stripe secret, Redis, and cron secrets are server-only.
- Conduct dependency, secret, and deployment-configuration checks as part of CI/release.

## 6. Usability and Accessibility

### Strengths

- Shared responsive components, breadcrumbs, loading skeletons, empty/error states, and form feedback support common journeys.
- Search suggestions support keyboard navigation, bounded results, debouncing, and cancellation of obsolete requests.
- Account, review, cart, and wishlist interactions provide visible pending/result feedback.
- Existing Lighthouse JSON artifacts record accessibility scores of 90 for both desktop and mobile, alongside mobile performance 71 and desktop performance 99.

### Gaps and recommendations

- Lighthouse files are checked-in snapshots and were not regenerated during this audit. They do not certify WCAG conformance.
- No automated axe suite or documented complete keyboard/screen-reader audit is configured.
- Audit accessible names and live announcements for icon controls, async search, cart/wishlist updates, form errors, and payment outcomes.
- Verify modal/drawer focus trapping and restoration, visible focus, heading hierarchy, contrast, reduced-motion behavior, zoom/reflow, and screen-reader use across checkout and account flows.
- Investigate the existing mobile performance score using fresh production-build measurements before optimizing by assumption.

## 7. Scalability and Maintainability

### Positive foundations

- Server-rendered catalog access, domain modules, generated database types, and isolated reducers are useful foundations.
- Shared Upstash Redis rate limits avoid process-local behavior across horizontally scaled instances.
- The database transaction RPCs centralize order and webhook state changes more appropriately than scattered client writes.
- The codebase has meaningful test seams and established formatting/lint/build tooling.

### Current constraints

- Stripe and Supabase transitions require explicit idempotency and compensation because they cannot share a transaction.
- Discount usage limits are not currently reserved/redeemed atomically at final order creation.
- Reconciliation has a failure path that can be misreported as successful when deletion errors are ignored.
- The development seed/reset tools use service-role credentials; the development-only guard, private local server, and correct target database are important safeguards.
- Realtime listeners can multiply reads if many events trigger uncoalesced refreshes.
- The CI workflow currently runs Jest only; lint, build, database integration, and browser E2E are not gates.
- Observability is not a complete structured logging, tracing, metrics, durable audit, and alerting system.
- Tax defaults to zero and shipping behavior is configured around UK postcode zones; business, tax, and fulfillment requirements need confirmation.

### Priority recommendations

#### P0 — Before production customer commerce

1. Keep `/dev-tools` and every exported action inaccessible outside development mode; run seed/reset actions only against the intended development database.
2. Fix the reconciliation delete-error path and test replay/idempotency under duplicate and transient-failure conditions.
3. Verify applied migrations, including atomic discount redemption, RLS policies, and service-role-only RPC grants before any production use.
4. Confirm that any deployed trusted proxy protects client-IP headers and that cron authorization is configured.

#### P1 — Delivery confidence and customer journeys

1. Correct checkout sign-in redirect path and query parameter contract.
2. Add end-to-end payment/order tests covering success, decline, cancellation, webhook retries, and reconciliation.
3. Extend CI to run lint, build/type checks, migrations and targeted database tests.
4. Verify tax, shipping, cancellation/refund, and order-status semantics with the business requirements.
5. Add operational alerts for failed webhook processing, stale orders, reconciliation failures, and rate-limit service outages.

#### P2 — Maintainability and experience

1. Add safe environment documentation/startup validation and a non-secret `.env.example`.
2. Add structured telemetry and durable security audit delivery as required by the deployment.
3. Complete WCAG-focused manual and automated audits.
4. Measure performance and database query plans under representative traffic before adding caching or architectural complexity.
5. Keep privacy rules explicit and tested before starting social/community features.

## 8. Tooling and Setup

- **Package manager:** npm with committed `package-lock.json`.
- **Runtime/application:** Next.js 16 App Router, React 19, strict TypeScript, Tailwind CSS 4, Material UI.
- **Validation:** Zod.
- **Persistence:** Supabase/PostgreSQL, Supabase Auth/Realtime, checked-in migrations.
- **Payments/rate limiting:** Stripe and Upstash Redis.
- **Tests:** Jest 30, jsdom, React Testing Library, V8 coverage; separate opt-in Supabase integration configuration.
- **Lint/build:** ESLint 9 and `next build` (includes TypeScript verification).
- **CI:** GitHub Actions on pull requests to `master`, Node.js 25, `npm ci`, then Jest only.
- **Local verification:** `npm run test`, `npm run lint`, and `npm run build` all passed on October 23, 2026 at commit `bf2e178`.
- **Environment:** `.env` is present locally but was not read; there is no checked-in `.env.example`. Configure local secrets from the README instructions without committing them.
- **Database integration:** `npm run test:db:privacy`, `npm run test:db:rpc-security`, and `npm run test:db:discount-redemption` require a local Supabase stack and loopback credentials. The discount-redemption suite passed (4 tests); the privacy and RPC-permission suites were not run.
- **Build routes:** the current build also includes `/api/cron/reconcile` in addition to the Stripe webhook and customer/storefront routes.

## 9. Conclusion

The checked-out code has a broad bookstore feature set, useful domain separation, five committed SQL migrations, a database-backed webhook idempotency path, atomic discount reservation, and a strong configured Jest suite. All local Jest (243 suites and 1,810 tests), lint, and production-build checks passed with the current uncommitted development-tools changes. The coverage result is bounded to the configured collection, while opt-in database integration tests and live external service behavior remain separate evidence.

The main outstanding issue is the webhook reconciliation delete-error path. Checkout and order-detail unauthenticated redirects now use the actual sign-in route and preserve the return destination. The dev console is a local personal-project tool, deliberately uses service-role access for seed/reset operations, and is restricted to development mode. If this application is ever operated as a real store, migration/RLS deployment state, edge proxy trust, cron secrets, payment recovery, tax/shipping behavior, and broader production controls require separate review.
