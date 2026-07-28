# FoodDely Frontend Audit

Audit date: 2026-07-24

## Executive summary

The application builds successfully and its current TypeScript and ESLint checks pass. The repository contains 35 Next.js routes and a substantial API integration layer, but it is not production-ready.

The most urgent problems are:

1. A GitHub personal access token is embedded in the local Git remote URL. Revoke/rotate it immediately and remove credentials from the remote configuration.
2. The installed production dependency tree has 11 known vulnerabilities: 3 critical, 7 high, and 1 moderate.
3. `src/middleware.ts` permits every request. Several manager/prototype screens are publicly accessible without authentication.
4. JWTs are stored in `localStorage`, so any successful XSS can steal long-lived credentials.
5. Payment, cart, and session identifiers and personal checkout data are logged or stored in browser-accessible locations.
6. Password reset is fake but displays a success state; several legal and account links are placeholders.
7. There are no automated tests, CI security checks, error boundaries, observability, or documented deployment environment.

## Scope and evidence

Reviewed:

- All files under `src/app`, `src/components`, `src/lib`, `src/data`, and project configuration.
- All 35 routes emitted by `next build`.
- Authentication, customer, restaurant-owner, cart, order, payment, menu, discount, review, address, and no-waste client hooks.
- Runtime behavior of every route in a locally built production server while signed out.
- Production dependency advisories using `npm audit --omit=dev`.
- TypeScript, ESLint, and production build output.

Not available:

- No frontend production URL is documented or discoverable in the repository.
- The only production service URL found is the API: `https://backend.fooddely.com`.
- No test customer or restaurant-owner credentials were supplied.
- Backend source, infrastructure configuration, server logs, Stripe webhook code, and authorization policies were not in this repository.

Therefore, authenticated end-to-end behavior and backend protections against IDOR/BOLA, mass assignment, privilege escalation, rate-limit bypass, and payment replay could not be proven. Those controls must be tested against a staging environment using dedicated test accounts; authentication should not be bypassed.

## Verification results

Commands completed:

- `npx tsc --noEmit`: pass
- `npx eslint src --max-warnings=0`: pass
- `npm run build`: pass
- `npm audit --omit=dev`: fail, 11 vulnerabilities

The `npm run lint` script is invalid for the installed Next.js version because it invokes `next lint`; use a direct ESLint script.

## Critical findings

### SEC-01 — GitHub credential embedded in Git remote

Severity: Critical

The configured `origin` URL contains a GitHub personal access token. Even though `.git/config` is normally not committed, the secret can leak through terminal output, support bundles, screenshots, logs, backups, or shared workspaces.

Required action:

1. Revoke the exposed token in GitHub immediately.
2. Review the token's audit log and repository activity.
3. Replace the remote with `https://github.com/Rashid-Mahmood501/food_dely.git` or an SSH remote.
4. Use the OS credential manager or SSH agent, never credentials in URLs.
5. Run a repository-history and artifact secret scan with Gitleaks or TruffleHog.

### DEP-01 — Known vulnerable production dependencies

Severity: Critical

`npm audit` reports 3 critical, 7 high, and 1 moderate vulnerabilities affecting the installed Next.js, Clerk, Axios, PostCSS, Sharp, form-data, follow-redirects, and js-cookie tree.

Notable affected direct versions:

- `next` 15.3.4
- `@clerk/nextjs` 6.25.4
- `axios` 1.13.2

Required action:

1. Create a dedicated dependency-upgrade branch.
2. Upgrade Next.js to a patched supported release, along with matching `eslint-config-next`.
3. Upgrade Clerk and Axios to versions outside all reported ranges.
4. Regenerate the lockfile.
5. Run unit, integration, payment, auth, and browser regression tests.
6. Add Dependabot/Renovate and a CI `npm audit` policy.

Do not blindly run `npm audit fix --force` on production; review the resulting framework changes.

### AUTH-01 — Middleware does not protect any route

Severity: Critical if backend authorization is also missing; otherwise High

`src/middleware.ts` matches application and API routes but always returns `NextResponse.next()`. Manager pages use inconsistent client-side checks, which are navigation behavior rather than a security boundary.

Observed while signed out:

- Correctly redirected: `/dashboard`, `/sales`, `/discounts`, `/customer-reviews`, `/restaurant-settings`, `/manage-menu`, `/order-list`, `/ranking`.
- Public manager/prototype content: `/address`, `/anti-waste`, `/experience`, `/payment/tips`, `/archive-list`, `/zone`.

Several public pages expose realistic restaurant, order, payment, address, and performance data. Some data is static, but users cannot distinguish a prototype from real manager data.

Required action:

- Adopt one authentication system. Clerk is installed/configured but the app actually uses a custom JWT.
- Protect manager route groups on the server.
- Enforce restaurant ownership and role authorization on every backend endpoint.
- Move mock/demo pages under a clearly labeled, disabled-in-production route such as `/demo`.
- Never rely on a token-presence check for authorization.

### AUTH-02 — JWT stored in `localStorage`

Severity: High

`src/lib/api/client.ts` reads and writes `auth_token` in `localStorage`. JavaScript can access it, so XSS compromises the account.

Required design:

- Prefer short-lived sessions in `Secure`, `HttpOnly`, `SameSite=Lax/Strict` cookies.
- Rotate refresh tokens and detect reuse.
- Add server-side session validation and role checks.
- If bearer tokens must remain, keep access tokens in memory, use short expiry, store refresh tokens only in HttpOnly cookies, and implement a strict CSP.

### AUTH-03 — Mixed and incomplete authentication architecture

Severity: High

Clerk dependencies and environment keys exist, but no Clerk provider or Clerk middleware protects the application. The active flow uses custom JWT endpoints and local storage. This increases confusion and makes security maintenance error-prone.

Required action: choose Clerk or the custom backend auth system, remove the unused implementation, and document the chosen session lifecycle.

## High findings

### PAY-01 — Payment client secret placed in the URL

Severity: High

`src/app/cart/page.tsx` redirects to `/payment?client_secret=...`. Query strings can appear in browser history, analytics, screenshots, referrer data, support logs, and monitoring tools.

Use server-managed checkout state, an opaque one-time checkout ID, or transient in-memory/session state. Configure `Referrer-Policy: no-referrer` or `strict-origin` as defense in depth.

### PAY-02 — Sensitive payment and cart diagnostics logged in production

Severity: High

Payment code logs PaymentIntent objects, IDs, cart contents, session IDs, delivery information, and backend error responses. These can contain personal or operational data and may be collected by browser monitoring tools.

Remove production console logging. Introduce a redacting logger and never log:

- access/refresh tokens;
- session IDs;
- Stripe client secrets or full PaymentIntent objects;
- names, phone numbers, email addresses, delivery addresses, or notes;
- full backend error payloads.

### PAY-03 — Payment completion must be webhook-authoritative

Severity: High until backend behavior is verified

The browser calls the backend to confirm payment and create an order after Stripe returns. The backend must independently retrieve the PaymentIntent, verify amount/currency/cart/user, enforce idempotency, and use verified Stripe webhooks as the source of truth.

Add tests for replay, duplicate callbacks, modified cart after intent creation, wrong currency, wrong account/session, failed/expired intents, and webhook reordering.

### AUTH-04 — No reliable password reset

Severity: High for account recovery

`src/app/forgot-password/page.tsx` waits two seconds and displays “Email Sent” without calling an API. The sign-in page's “Forgot password?” link points to `#`, so even the mock page is unreachable from the normal flow.

Implement single-use, short-expiry reset tokens; rate limiting; uniform responses to prevent account enumeration; session invalidation after reset; and audit logging.

### API-01 — Backend object authorization must be verified

Severity: High until proven

Many operations use caller-controlled numeric IDs:

- order detail/status/cancel;
- restaurant images;
- menu items, option groups, and option items;
- discounts;
- no-waste packages, custom items, and linked menu items;
- addresses.

Every backend query must scope the object to the authenticated customer, restaurant owner, or anonymous cart session. Return 404/403 without revealing object existence. Add two-account integration tests that attempt cross-account reads and mutations.

### API-02 — Anonymous session ID is browser-controlled and transmitted multiple ways

Severity: High until backend entropy and scoping are verified

Anonymous session IDs are stored in `localStorage` and sent as query parameters and/or `X-Session-ID`. Query parameters leak more easily and duplicate transports create ambiguity.

Use a single opaque, high-entropy session identifier in a Secure HttpOnly cookie. Rotate it on authentication, prevent fixation, set expiry, and bind all anonymous order/cart access to that session.

## Medium findings

### SEC-02 — Missing HTTP security headers

`next.config.ts` configures images only. Add and test:

- `Content-Security-Policy` with nonces/hashes and explicit Stripe domains;
- `Strict-Transport-Security`;
- `X-Content-Type-Options: nosniff`;
- `Referrer-Policy`;
- `Permissions-Policy`;
- clickjacking protection using CSP `frame-ancestors`;
- a minimal CORS policy on the backend.

### SEC-03 — Personal checkout data persisted in local storage

Guest name, email, phone, address, postal code, city, and delivery notes are persisted in `checkout_guest_info`. Any script on the origin can read them and they remain after checkout.

Keep checkout PII in component/session memory, clear it on success/cancel/logout, define retention, and avoid storing delivery notes in durable browser storage.

### AUTH-05 — 401 handling creates inconsistent UI state

The Axios interceptor removes the token but does not redirect, clear all user-scoped query caches, or preserve a safe return URL. A page can remain visible with stale cached data.

Centralize session-expiry handling, clear sensitive caches, redirect to sign-in, and validate return paths against an allowlist.

### UX-01 — Broken or placeholder account/legal controls

- Sign-in “Forgot password?” points to `#`.
- Signup and business signup legal links point to `#`.
- “Remember me” has no behavior.
- Several “Help”, “Disconnect”, filter, export, and navigation controls on prototype pages have no action.
- Terms and Privacy explicitly say they are under construction.

Remove, disable with a clear explanation, or implement every production control.

### UX-02 — Indefinite loading and weak error states

Observed signed out:

- `/partners/1` remained at “Loading restaurant...”.
- `/cart` remained at “Loading cart...”.
- `/profile` remained at “Loading profile...”.

Queries need explicit timeout, error, empty, offline, and retry states. Do not display an infinite loader after an API failure.

### RUN-01 — Missing fallback image and server runtime exception

The runtime requested `/images/default-restaurant.png`, but that asset does not exist, so Next.js returned HTML to the image optimizer. Add the intended asset or use an existing guaranteed fallback.

While exercising `/orders/[id]`, the production server also emitted an uncaught `ReferenceError: location is not defined`. The source route uses `window.location` inside a client component, but the compiled server path still reached an unguarded browser-global access. Add an SSR regression test for every dynamic route and replace hard navigation with `router.push`/`router.replace` where possible.

### DATA-01 — Mock and production data are mixed

Several routes embed mock restaurant, order, payment, map, and customer data directly in page files or `src/data`. This makes public prototype content appear real and makes API coverage unclear.

Move fixtures to test/story files and gate demos out of production builds.

### ARCH-01 — Large page components and duplicated UI

`payment/page.tsx`, partner pages, and manager pages mix data access, validation, navigation, presentation, and business logic. Header/auth/loading patterns are duplicated.

Split into:

- server route/layout guards;
- feature services and schemas;
- focused form and presentation components;
- reusable error/loading/empty states;
- shared customer and manager layouts.

### VAL-01 — Validation is mostly client-only and ad hoc

Inputs are converted with `Number`, `parseInt`, or JSON/FormData without a shared schema. Add Zod/Valibot schemas shared where possible with the backend contract. The server must revalidate all fields, prices, quantities, restaurant IDs, option IDs, delivery fees, discount rules, and order totals.

### ERR-01 — Raw backend error details shown or logged

Some UI code forwards backend `message`, `error`, or `detail`. Standardize safe public error codes and keep stack traces/internal validation details server-side.

### PERF-01 — Heavy client bundles

First-load JavaScript reaches approximately:

- `/order-list`: 228 kB
- `/sales`: 211 kB
- `/partners`: 191 kB
- `/manage-menu`: 156 kB
- `/payment`: 160 kB

Use server components where appropriate, dynamically load charts/editors/payment UI, avoid loading manager dependencies on public pages, and analyze bundles in CI.

## Low and maintainability findings

- `README.md` is still the default create-next-app text and does not document architecture, roles, endpoints, deployment, environment variables, or test accounts.
- There are no unit, integration, component, end-to-end, accessibility, or security regression tests.
- There is no CI workflow.
- There is no `error.tsx`, `global-error.tsx`, or meaningful `not-found.tsx`.
- No loading skeleton conventions or centralized toast/notification system exist.
- Native `alert()` and `confirm()` are used for user flows.
- `console.log`/`console.error` are widespread.
- The fallback Stripe publishable test key is hard-coded. Publishable keys are not secret, but environment mistakes should fail closed rather than silently use a test account.
- Currency display is inconsistent (`CHF` and `$`).
- Date/time handling uses browser-local assumptions and hard-coded strings.
- Some manager screens are French while customer/other manager screens are English, without an i18n system.
- Metadata is generic for every route.
- Accessibility needs automated and manual review: focus management in modals, dialog semantics, status announcements, button names, color contrast, table semantics, keyboard use, and reduced motion.
- No analytics consent implementation is evident despite the privacy text mentioning cookies/advertising.
- No PWA/offline strategy exists, although food ordering needs clear behavior during network loss.

## Route audit

### Public/customer routes

- `/`: renders.
- `/signin`: renders; password-reset link is broken.
- `/signup`: renders; legal links are placeholders.
- `/forgot-password`: renders but is a fake workflow.
- `/business-signup`: renders; legal links are placeholders.
- `/partners`: renders public restaurant data.
- `/partners/[id]`: route renders but test ID remained in a loading state.
- `/cart`: remained in a loading state without a usable anonymous cart response.
- `/payment`: renders guest checkout even without a client secret; payment submit remains unavailable.
- `/orders`: redirects to sign-in.
- `/orders/[id]`: redirects to sign-in with a return target.
- `/profile`: remained in a loading state signed out.
- `/menu`: redirects to `/partners`.
- `/payment/callback`: shows a missing-payment error when parameters are absent.
- `/order-confirmation`: shows “Order ID not provided” when parameters are absent.
- `/privacy`, `/terms`: render incomplete legal drafts.
- `/learn-more`, `/loyalty-demo`, `/cheez-mama`: render demo/static content.

### Manager routes

- Protected by client behavior: `/dashboard`, `/sales`, `/discounts`, `/customer-reviews`, `/restaurant-settings`, `/manage-menu`, `/order-list`, `/ranking`.
- Public and apparently prototype/static: `/address`, `/anti-waste`, `/experience`, `/payment/tips`, `/archive-list`, `/zone`.

The protected set still needs server-side authorization. The public manager set should be protected or removed from production.

## Files that should be added or reorganized

Suggested target structure:

```text
src/
  app/
    (public)/
    (customer)/
      layout.tsx
    (manager)/
      layout.tsx
    api/
      auth/
    error.tsx
    global-error.tsx
    loading.tsx
    not-found.tsx
  components/
    common/
    customer/
    manager/
    forms/
  features/
    auth/
    cart/
    checkout/
    orders/
    restaurants/
    manager/
  lib/
    auth/
      server.ts
      client.ts
      permissions.ts
    api/
      client.ts
      errors.ts
    validation/
    logging/
      logger.ts
      redact.ts
    security/
      headers.ts
  test/
    fixtures/
    factories/
    mocks/
tests/
  unit/
  integration/
  e2e/
  security/
.github/
  workflows/
    ci.yml
    dependency-review.yml
    codeql.yml
  dependabot.yml
.env.example
.nvmrc
SECURITY.md
CONTRIBUTING.md
ARCHITECTURE.md
DEPLOYMENT.md
TESTING.md
```

Also add:

- `vitest.config.ts` and React Testing Library setup;
- `playwright.config.ts`;
- MSW handlers for deterministic frontend API tests;
- schema validation for environment variables;
- commit hooks for formatting, linting, type checks, and secret scanning;
- a CSP/security-header test;
- OpenAPI-generated or schema-validated API types rather than manually drifting interfaces.

## Required backend test checklist

Before release, verify with separate customer A/customer B and restaurant A/restaurant B accounts:

1. Customer A cannot read/cancel/reorder customer B's order.
2. Restaurant A cannot read or mutate restaurant B's menu, images, discounts, no-waste items, reviews, sales, or orders.
3. Anonymous session A cannot access session B's cart/order.
4. Prices, discounts, fees, totals, restaurant IDs, and option IDs are recalculated server-side.
5. Payment confirmation is idempotent and cannot be replayed.
6. A PaymentIntent for one cart/user cannot create an order for another.
7. Webhook signatures, event ordering, retries, and duplicate events are handled safely.
8. Login, signup, password reset, and business signup are rate limited.
9. Authentication responses do not reveal whether an email exists.
10. File uploads validate MIME type from content, size, dimensions, extension, and storage permissions.
11. CORS only allows approved frontend origins and credentials are configured correctly.
12. CSRF defenses cover all cookie-authenticated mutations.

## Prioritized improvement plan

### Immediate — before any deployment

1. Revoke the exposed GitHub token and clean the remote URL.
2. Upgrade vulnerable dependencies.
3. Protect or remove all public manager routes.
4. Confirm backend object-level authorization and payment webhook behavior.
5. Remove sensitive logs and stop placing checkout secrets in URLs.
6. Implement real password reset and fix legal/account links.

### Next sprint

1. Consolidate authentication and move away from localStorage JWTs.
2. Add security headers and a strict Stripe-compatible CSP.
3. Add schema validation and consistent error handling.
4. Separate mocks/demos from production.
5. Add CI, tests, dependency scanning, secret scanning, and CodeQL.
6. Add robust loading/error/offline states.

### Following iterations

1. Refactor route groups and large components.
2. Improve accessibility and localization.
3. Optimize large route bundles.
4. Add observability with PII redaction, performance monitoring, and audited business events.
5. Replace the default README with architecture, deployment, testing, and incident-response documentation.
