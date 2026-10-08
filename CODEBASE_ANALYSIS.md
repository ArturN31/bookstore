# Bookstore Codebase Analysis

**Audit date:** October 7, 2026
**Repository:** `ArturN31/bookstore`
**Scope:** Maintained application source, configuration, test suite, workflow files, generated database type declarations, and checked-in reports. The local environment file was not inspected.
**Verification performed:** `npm test -- --watchAll=false --ci`, `npm run lint`, and `npm run build`.

## Executive Assessment

This is a feature-rich, server-rendered online bookstore built with Next.js App Router, React 19, TypeScript, Supabase/PostgreSQL, and Stripe. The implementation separates route/UI code from data access through schemas, server actions, services, repositories, and mappers. It includes catalog discovery, authentication, reviews, cart and wishlist workflows, sharing, checkout, order views, development seed tools, and broad automated tests.

The latest local verification passed: **234 Jest suites, 1,704 tests, and one snapshot**, with the configured coverage collection reporting **100% statements, branches, functions, and lines**; ESLint passed; the production build completed and listed 22 application routes plus the not-found route. These results establish that the configured tests and build pass in this environment. They do not establish production readiness, integration correctness against a live Supabase project or Stripe account, complete source-wide coverage, or WCAG compliance.

**Overall assessment:** good feature-level modularity and unusually thorough mocked unit/component test coverage; **not production-ready for real commerce until the security and payment integrity findings below are remediated**. Highest-priority findings are an admin-privileged developer Server Action without its own production/authentication guard, a non-distributed in-memory rate limiter, and a Stripe webhook fulfillment path that is not event-idempotent. Checkout also clears the cart before the card payment is confirmed, and checkout sign-in redirects target a route that does not exist.

## 1. Architecture and Features

### Current design

- **Routing and rendering:** Next.js App Router route modules live in [app/](app/). The homepage and book-detail pages load catalog data on the server; client components provide interactive search, filtering, cart, wishlist, reviews, and payment inputs.
- **Shared UI:** [components/](components/) contains reusable layout, catalog, cart, form, filtering, and feedback components. Route-specific composition stays beside route implementations.
- **Data access:** [data/](data/) is organized by domain (`books`, `auth`, `cart`, `checkout`, `user`), generally separating input schemas, server actions, services, repositories, and mappers.
- **Database boundary:** [utils/db/server.ts](utils/db/server.ts) creates a cookie-aware Supabase SSR client using the public project key; [utils/db/client.ts](utils/db/client.ts) creates the browser client. [utils/db/admin.ts](utils/db/admin.ts) creates a service-role client that bypasses RLS.
- **Persistence model:** [database.types.ts](database.types.ts) declares generated types for catalog, identity, reviews, carts, wishlist, orders, discounts, and RPC functions. The repository does not contain SQL migrations or definitions for the declared transactional RPCs, so their constraints and atomicity cannot be verified from this checkout.
- **Core implemented paths:** browse and filter books, book detail and reviews, Supabase email/password authentication and profile onboarding, own-review management, cart mutation, public/private wishlist sharing, card checkout, order confirmation and history routes, informational pages, and local development seed tooling.
- **Runtime routes:** the verified build lists `/`, `/book/[slug]`, `/checkout`, `/checkout/success`, `/api/webhooks/stripe`, `/user/orders`, `/user/order/[orderId]`, profile/auth/review/wishlist routes, `/dev-tools`, and four `/infos/*` routes. Route availability does not imply production hardening of each route.

### Strengths

1. Domain-oriented organization reduces the amount of database logic embedded directly in UI components.
2. Catalog reads are server-rendered and SEO metadata is supplied for key content pages.
3. Checkout and order confirmation have dedicated services and repositories rather than being folded into a single page module.
4. Typed database access and shared Zod schemas improve the consistency of values crossing form/server boundaries.
5. The implementation has explicit empty, loading, error, and restricted-access UI states across several key journeys.

### Bottlenecks and recommendations

- **Database deployment is not reproducible from the repository.** Types declare procedures such as `process_order_transaction` and `increment_book_stock`, but `supabase/` has no committed migration/schema SQL in the audited tree. Commit versioned migrations, constraints, indexes, and RLS policies; run them in CI against a disposable Supabase/PostgreSQL instance.
- **The application relies on broad server actions and environment-dependent behavior.** Keep mutations in their domain modules, but make every exported Server Action authenticate and authorize the actor independently; a hidden or redirected page is not an access-control boundary.
- **Service boundaries do not yet guarantee transactional commerce semantics.** Define an explicit order/payment state machine, inventory reservation/release rules, and idempotent transitions in database transactions/RPCs and webhook processing. Verify these against database migrations.
- **Development tooling is part of the deployed source surface.** Remove privileged test-only actions from production bundles where possible, and enforce server-side environment, role, and authorization checks even in local tooling.

## 2. State Management and Server Actions

### Data flow

[components/layout/SessionProviderWrapper.tsx](components/layout/SessionProviderWrapper.tsx) reads the Supabase session server-side and fetches a signed-in user's profile, wishlist, and cart before hydrating [providers/Providers.tsx](providers/Providers.tsx). The provider tree owns separate book-sort, advanced-filter, user, and cart state. User and cart use reducers with distinct state/action contexts; listeners in [providers/user/utils/useUserListeners.ts](providers/user/utils/useUserListeners.ts) and [providers/cart/utils/useCartListeners.ts](providers/cart/utils/useCartListeners.ts) synchronize browser state with authentication and Supabase Realtime events.

The server remains authoritative for persisted data. Providers support view state and refresh; actions use repositories/services to mutate persistent state. Search and form-local input are appropriately held in hooks/components rather than global state. Checkout totals are calculated both in the browser for presentation and on the server for order/payment creation.

### Strengths

- Server-seeded identity/cart state avoids an unnecessary anonymous-to-authenticated hydration transition.
- Reducers make state transitions explicit and testable; separate action contexts reduce unnecessary subscriptions.
- User-owned mutations generally resolve the current user from the server session rather than accepting a user ID from the browser.
- Zod validation is applied across authentication, onboarding, cart, review, wishlist, and checkout form data.
- `process_order_transaction` is invoked as a database RPC from [data/checkout/services/CheckoutService.ts](data/checkout/services/CheckoutService.ts), which is an appropriate place to enforce atomic order persistence if the database function is correctly implemented.

### Findings and recommendations

1. **[High] Checkout action input is incompletely validated.** [data/checkout/CheckoutAction.ts](data/checkout/CheckoutAction.ts) parses `shippingDetails`, but does not runtime-validate the complete payload (`items`, each item ID/positive integer quantity, `discountId`, shipping method, or idempotency key). [data/checkout/services/CheckoutService.ts](data/checkout/services/CheckoutService.ts) re-reads book prices and stock, which is good, but validate all payload fields server-side and bind purchased items to the current server-side cart. Do not trust a client-provided list as the cart source of truth.
2. **[High] Cart is cleared before payment confirmation.** `processCheckoutAction` clears the user's cart after creating the payment intent and order, but before the browser calls `stripe.confirmCardPayment`. A declined/abandoned payment therefore loses the cart. Clear only after a verified successful payment transition, or preserve/reconstruct the cart until that transition.
3. **[High] Rate limiting is per-process memory only.** [utils/network/rateLimiter.ts](utils/network/rateLimiter.ts) stores counters in a `Map`. It resets on restart, is not shared among serverless instances/regions, has unbounded key retention, and cannot reliably impose a production-wide limit. Replace it with an atomic shared store (for example Redis or a database-backed limiter) and apply it to login/signup and sensitive actions, not only checkout/discount attempts.
4. **[High] Discounts are validated inconsistently.** [data/checkout/services/CheckoutDiscountService.ts](data/checkout/services/CheckoutDiscountService.ts) checks activation, start/end dates, and minimum subtotal for preview; final checkout in `CheckoutService.ts` looks up a client-supplied discount ID and checks active/minimum subtotal but does not repeat date, eligibility, redemption-count, or usage-limit validation. Recompute and validate every promotion against authoritative server state in the final transaction.
5. **[High] Stripe webhook transitions are not deduplicated.** [app/api/webhooks/stripe/route.ts](app/api/webhooks/stripe/route.ts) verifies the Stripe signature, but does not persist/check the Stripe event ID or condition stock restoration on a one-time order status transition. Replayed `payment_failed`/`canceled` events can run inventory restoration repeatedly. Several database errors in those paths are ignored and can still result in a `200` response. Implement a durable event ledger, conditional state transitions, atomic inventory handling, and explicit retry/error responses.
6. **[High] Login redirects are inconsistent with actual routes.** [app/checkout/page.tsx](app/checkout/page.tsx) and [app/checkout/success/page.tsx](app/checkout/success/page.tsx) redirect unauthenticated users to `/login?redirect=...`; the implemented sign-in route is `/user/auth/signin`, and [data/auth/SignInAction.ts](data/auth/SignInAction.ts) consumes a `returnTo` value rather than `redirect`. Use one centralized, validated sign-in redirect contract and test the complete unauthenticated return flow.
7. **[Medium] Checkout side effects span multiple systems.** Stripe PaymentIntent creation occurs before the database order RPC; failures in later writes can leave an orphan intent. Introduce a persisted checkout attempt/state machine and reconciliation for payment intents and orders. Use stable, user/session-bound idempotency keys and verify retry behavior across both systems.
8. **[Medium] Realtime is refresh-oriented.** Refreshing authoritative state is safer than applying speculative browser mutations, but high event volume may trigger duplicate full reads. Add event coalescing, cleanup/reconnect tests, and telemetry before scaling.
9. **[Medium] Broad catch/fallback patterns can obscure failures.** Several service/action paths normalize exceptions, while webhook and developer reset paths suppress or ignore underlying errors. Return explicit operation status, log structured diagnostics, and do not report successful completion if a persistence step failed.

## 3. Utility, Reuse, and Type Safety

### Strengths

- [data/schemas/](data/schemas/) centralizes runtime schemas and inferred application types.
- Domain mappers isolate Supabase row shapes from UI models (for example [data/books/BookMapper.ts](data/books/BookMapper.ts) and [data/cart/CartMapper.ts](data/cart/CartMapper.ts)).
- [utils/db/safeSupabaseQuery.ts](utils/db/safeSupabaseQuery.ts), [utils/errors/](utils/errors/), and [utils/network/retry.ts](utils/network/retry.ts) provide reusable boundary behavior.
- Strict TypeScript is enabled in [tsconfig.json](tsconfig.json), with an `@/*` path alias and generated `Database` declarations.
- Search and sharing have focused custom hooks and utilities rather than routing all interaction state through one global provider.

### Bottlenecks and recommendations

- **Unsafe casts at model boundaries:** checkout/book paths include casts such as `as unknown as CartCheckoutItem` and JSON/RPC result casts. Replace with explicit parsing/refinement functions and typed RPC return shapes; generated database types do not validate runtime payloads.
- **Generic retry semantics:** [utils/network/retry.ts](utils/network/retry.ts) classifies transient errors by message fragments and retries an arbitrary callback. Restrict retries to known transient Supabase/network failures and safe/idempotent operations; never automatically retry non-idempotent writes without durable idempotency.
- **Shared utilities suppress distinctions:** safe-query/error helpers should preserve structured error codes and retryability internally while exposing safe user-facing messages at the UI boundary.
- **Current rate limiter is not a production utility:** replace its implementation, not just its call sites, with distributed atomic storage and expiry.
- **Missing schema artifacts:** generated types are not a substitute for DDL, constraints, or authorization policy definitions. Generate them from migrations and fail CI if they drift.
- **Data layer conventions vary by domain:** maintain consistent action/service/repository return types and remove duplicate validation/business logic where checkout currently has preview-vs-final mismatch.

## 4. Testing Strategy

### Verified status

The current run of `npm test -- --watchAll=false --ci` passed:

| Measure | Result |
| --- | ---: |
| Jest suites | 234 / 234 |
| Tests | 1,704 / 1,704 |
| Snapshots | 1 / 1 |
| Statements, branches, functions, lines | 100% each within the configured collection |

[jest.config.ts](jest.config.ts) uses Jest 30, jsdom, React Testing Library setup, V8 coverage, and global thresholds of 99% branches, 95% functions, and 90% statements/lines. Tests are colocated under [__tests__/](__tests__/) by app, component, data, hook, provider, and utility concerns. [__mocks__/](__mocks__/) contains framework mocks. The suite includes checkout actions/services and Stripe webhook tests as well as catalog, authentication, reviews, cart, sharing, and provider behavior.

### Assessment

- The suite is broad and checks many error, pending, authorization, reducer, schema, and UI states.
- Coverage is collected for `app`, `components`, `data`, `providers`, `hooks`, selected error/security utilities, and `safeSupabaseQuery`. Root layout/global CSS are explicitly excluded; top-level `proxy.ts`, Next configuration, dependency configuration, and real infrastructure are outside the declared collection.
- Tests primarily provide deterministic unit/component coverage with mocked Supabase, Next, and payment boundaries. They do not prove live PostgreSQL/RLS behavior, SQL RPC atomicity, Stripe event retries, or deployment integration.
- No dedicated browser E2E runner or live-database integration-test job is declared in the inspected package/workflow configuration.
- The single GitHub Actions workflow ([.github/workflows/test.yml](.github/workflows/test.yml)) runs Jest for PRs to `master`; it does not run the linter, production build, migration checks, dependency security audit, or E2E tests.
- A 100% figure within the collection is not a risk or quality score and does not show whether critical production behaviors are exercised end-to-end.

### Recommendations

1. Add integration tests against a disposable PostgreSQL/Supabase schema, including actual RLS and both commerce RPCs.
2. Add Stripe test-mode integration tests for duplicate/out-of-order events, failed payment, abandoned checkout, partial database failure, and recovery/reconciliation.
3. Add Playwright (or equivalent) E2E coverage for unauthenticated checkout redirect/return, sign-in, successful/failed payment, order ownership, review lifecycle, and share links.
4. Extend CI to run lint, type/build checks, SQL migration validation, security/dependency checks, and the necessary focused integration tests.
5. Keep coverage thresholds, but publish the collection/exclusion scope and supplement coverage with mutation testing or risk-weighted critical-path assertions.

## 5. Security

### Existing safeguards

- Supabase SSR session handling is used in [utils/db/server.ts](utils/db/server.ts), and [proxy.ts](proxy.ts) invokes session refresh for selected protected paths.
- Many domain actions resolve authenticated users server-side and validate input with Zod.
- Order reads check ownership in [data/checkout/services/OrderOwnershipService.ts](data/checkout/services/OrderOwnershipService.ts).
- Stripe webhooks verify the raw request body against the signature before processing events.
- [next.config.ts](next.config.ts) adds CSP, HSTS, frame/content-type/referrer/permissions headers and disables the `X-Powered-By` header.
- [utils/security/securityAuditLogger.ts](utils/security/securityAuditLogger.ts) redacts keys with sensitive names and records audit events using the service-role client.
- Authentication forms require a CAPTCHA token and pass it to Supabase Auth; production effectiveness depends on correct Supabase CAPTCHA configuration.

### Critical and high-priority findings

1. **[Critical] Privileged `impulseLogin` Server Action has no production or caller authorization guard.** [app/dev-tools/actions/DevToolsActions.ts](app/dev-tools/actions/DevToolsActions.ts) guards `systemCommandAction` and `fullResetAction` against production, but exported `impulseLogin(email)` has neither such a guard nor a role/session check. It uses the service-role client to find an arbitrary user, sets their password to a known fixed developer password, then signs in as that user. Redirecting the `/dev-tools` page in production is not authorization for a Server Action. Remove this action from deployable builds or require an explicit development-only control and authenticated admin authorization; rotate/review any credentials/accounts that may have been exposed to a deployed environment.
2. **[High] Replayed Stripe failure/cancel webhooks can restore stock more than once.** The webhook has no event-ID ledger or conditional one-time transition; errors during restoration are ignored. Make event processing durable and idempotent before accepting real payments.
3. **[High] Checkout mutation input validation and promotion checks are incomplete.** Validate item quantities and all IDs/options at the server boundary; derive lines from the signed-in user's cart; repeat promotion dates/eligibility/redemption checks in the final transaction.
4. **[High] The in-memory limiter does not enforce distributed production limits.** Use shared atomic storage; also rate-limit authentication and other abuse-sensitive endpoints.
5. **[High] Cart is removed before payment confirmation.** This is primarily a correctness/data-loss issue, but also undermines reliable order reconciliation. Clear it only after durable confirmed fulfillment.
6. **[Medium] The database security posture is not auditable from this repository.** No schema/migration or policy SQL is present under `supabase/`; prior documentation's broad assertion that RLS is configured cannot be independently verified here. Treat RLS as unverified until policies are versioned, reviewed, and exercised with integration tests. Service-role access bypasses RLS by design and must remain server-only.
7. **[Medium] CSP permits `'unsafe-inline'` and `'unsafe-eval'` for scripts.** This weakens XSS defense. Assess Next/MUI/Stripe runtime needs and move toward nonce/hash-based script policies; avoid broadening host allowlists without need.
8. **[Medium] Audit logging is best-effort.** The logger schedules background writes and catches/logs failures. This may be appropriate for non-blocking telemetry, but security-critical audit obligations need durable delivery/monitoring and alerting.
9. **[Medium] Secrets/setup documentation is incomplete.** `.env*` is gitignored, but there is no checked-in example template. Document variable names and public-vs-secret classification without committing real credentials; add startup validation for mandatory settings.

## 6. Usability and Accessibility

### Strengths

- Shared layout, responsive Tailwind/MUI components, breadcrumbs, feedback notifications, skeletons, and explicit empty/error states provide consistent interaction patterns.
- Search supports debouncing, cancellation, bounded suggestions, and keyboard movement/escape handling in [hooks/SearchBar/](hooks/SearchBar/) and [components/layout/UserNavbar/SearchBar/](components/layout/UserNavbar/SearchBar/).
- Forms expose validation and pending feedback; cart and wishlist actions expose optimistic feedback.
- Dialogs, drawers, and mobile layouts are built from established UI components rather than entirely bespoke primitives.
- Checked-in Lighthouse JSON reports show desktop scores of performance 99, accessibility 90, best practices 96, SEO 100; mobile scores of performance 71, accessibility 90, best practices 96, SEO 100. These are report artifacts, not a fresh browser run during this audit and not WCAG certification.

### Gaps and recommendations

- There is no automated axe/WCAG test suite or documented manual screen-reader/keyboard audit.
- Review accessible names and state announcements for icon-only cart/wishlist/filter controls, search suggestions, async errors, and form validation; use consistent `aria-live`/described-by behavior where appropriate.
- Verify focus trapping/restoration for MUI modals/drawers, visible focus styles, heading hierarchy, contrast, reduced-motion preferences, and zoom/reflow at narrow viewport sizes.
- Retest mobile performance: the recorded 71 score is substantially below desktop's 99. Investigate client JavaScript, hydration, image payloads, and render-blocking assets with current production measurements.
- Add accessibility tests to checkout/review/share workflows and perform manual assistive-technology checks before release.

## 7. Scalability and Maintainability

### Positive foundations

- Server-rendered catalog reads, indexed relational access patterns (where configured), domain modules, generated types, and isolated state reducers form a sound starting point.
- Image formats/cache TTL and response compression are configured in [next.config.ts](next.config.ts).
- Retry/query helpers, mappings, and schemas provide seams that can support incremental refactoring.
- Test coverage supports safe local changes to the modeled behavior.

### Current constraints

- **Process-local limiter:** not suitable for horizontally scaled/serverless deployment and stores keys in an unbounded `Map`.
- **Database source of truth absent:** migrations, indexes, RLS and RPC bodies are not checked in; schema updates and test environments are not reproducible.
- **Commerce consistency across services:** order persistence, inventory and payment are coordinated across Stripe and Supabase without an in-repository event ledger/outbox or complete compensation strategy.
- **Refresh-heavy realtime:** repeated full-state reads can multiply under load; measure event rate, query latency and subscription churn.
- **Quality gates incomplete:** CI only runs Jest. No required lint/build/type/dependency/migration checks are defined in the workflow.
- **Operational visibility:** console-based logging and best-effort audit writes are not a complete structured logging, tracing, metrics, or alerting solution.
- **No documented E2E/performance release gate:** existing Lighthouse artifacts are not generated by the PR workflow.
- **Project setup ambiguity:** there is no `.env.example`; database configuration and local bootstrap steps are not fully captured in version control.

### Recommendations

1. Establish schema-as-code and deterministic local/test Supabase environments first.
2. Make order, stock, discount usage, webhook receipt, and fulfillment transitions durable and transactional/idempotent.
3. Add distributed rate limiting, structured telemetry, tracing, error reporting, and operational dashboards.
4. Define release checks for lint/type/build, migration/RLS tests, payment/webhook integration, E2E flows, and accessible Lighthouse/axe baselines.
5. Profile actual production routes and database query plans before adding caching or broad architectural complexity.

## 8. Tooling and Setup

- Package manager: npm with committed [package-lock.json](package-lock.json).
- Framework/compiler: Next.js App Router, React 19, strict TypeScript configuration.
- Styling: Tailwind CSS 4 and Material UI.
- Validation: Zod.
- Automated checks: Jest 30, jsdom, React Testing Library, V8 coverage, ESLint 9.
- CI: GitHub Actions on PRs targeting `master`, using Node 25 and `npm ci`; workflow currently executes Jest only.
- Current package scripts include `dev`, `build`, `start`, `lint`, `test`, `test:coverage`, `test:report`, Lighthouse scripts, security/audit install scripts, and generated Supabase type refresh.
- No committed environment template or SQL migration set was found. Local execution therefore requires separately provisioned Supabase schema/auth configuration and Stripe/hCaptcha setup.

## 9. Priority Recommendations

### P0 — Resolve before any production commerce deployment

1. Remove/guard `impulseLogin`; require server-side administrator authorization for every privileged action.
2. Implement webhook idempotency and atomic, conditional payment/order/inventory transitions; test duplicate and out-of-order Stripe events.
3. Move rate limiting to shared durable storage and apply it to auth and sensitive endpoints.
4. Validate the full checkout payload, derive items from the signed-in user's cart, and revalidate discount validity/limits server-side.
5. Preserve the cart until Stripe confirms payment and durable order state is settled.
6. Commit/review migrations, RLS policies, transaction functions, constraints, and indexes; test them in CI.

### P1 — Correct customer-facing flows and delivery confidence

1. Fix checkout/sign-in redirect route and query parameter mismatches.
2. Add payment/order reconciliation and explicit `pending`, `paid`, `failed`, `canceled`, and fulfillment semantics; review when a success screen may claim payment completion.
3. Add end-to-end tests for checkout, failed payments, order history/ownership, profile, review management, and public/private wishlist sharing.
4. Expand CI to run lint, production build/type verification, migration checks, dependency/security scanning, and integration tests.
5. Clarify production shipping/tax behavior: checkout currently defaults tax calculation to zero and shipping rules are hard-coded for UK postcode zones; confirm business/legal requirements before launch.

### P2 — Improve maintainability and user experience

1. Add `.env.example` with placeholders, startup validation, and reproducible database setup instructions.
2. Replace unchecked model/RPC casts with runtime parsers and typed results.
3. Add structured observability, operational alerts, and durable security audit delivery where required.
4. Complete WCAG-focused manual and automated accessibility testing and improve the mobile performance baseline.
5. Add repository-level performance and mutation-test baselines after critical transaction semantics are stable.

## 10. Conclusion

The codebase has a coherent domain-oriented architecture and a substantial implemented bookstore experience. Automated test, lint, and build checks currently pass, and the mocked test suite reports 100% coverage within its configured set. The principal risks lie at production boundaries not demonstrated by those tests: privileged Server Action authorization, distributed abuse controls, database policy/schema reproducibility, and correctness under payment/webhook retries. Address the P0 items and add live database/payment integration verification before treating the system as ready for real customer orders.
