# Sentry Monitoring — TransHub

Production-grade error, performance and payment monitoring across the Express
backend and the Next.js frontend. Everything is **env-driven**: with no DSN set,
the Sentry SDK initializes in a disabled state and sends nothing (safe no-op),
so local/test runs are unaffected.

---

## 1. Setup (two projects)

Create two projects in Sentry (org `adeniran-israel`):

| Project | Platform | DSN env var |
|---|---|---|
| `transhub-backend` | Node.js / Express | `SENTRY_DSN` (backend `.env`) |
| `transhub-frontend` | Next.js | `NEXT_PUBLIC_SENTRY_DSN` (frontend `.env.local`) |

Copy each project's DSN (Settings → Client Keys) into the matching env var.
See `backend/.env.example` and `frontend/.env.example` for the full list.

Source-map upload (optional, build-time): set `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`,
`SENTRY_PROJECT` in the frontend before `next build`. Without a token the build
still succeeds (upload is skipped).

---

## 2. Environments

Set `SENTRY_ENVIRONMENT` (backend) / `NEXT_PUBLIC_SENTRY_ENVIRONMENT` (frontend)
per deploy. Defaults to `NODE_ENV` when unset.

| Environment | Traces sample rate (default) | Notes |
|---|---|---|
| `development` | `1.0` | Local; usually no DSN, so nothing is sent. |
| `staging` | `0.1` | Real DSN; validates alerting before prod. |
| `production` | `0.1` | Tune via `SENTRY_TRACES_SAMPLE_RATE`. |

Sample rates are overridable: backend `SENTRY_TRACES_SAMPLE_RATE`, frontend
uses the same per-environment defaults in `instrumentation-client.ts`.

---

## 3. Coverage

### Frontend (`transhub-frontend`)
| Requirement | How |
|---|---|
| React errors | `app/error.js` + `app/global-error.js` boundaries call `Sentry.captureException` |
| Runtime errors | Global unhandled error/rejection handlers (browser SDK) |
| Hydration errors | Caught by `global-error.js` (root) + `error.js` (segments) |
| Route errors | `instrumentation.ts` → `onRequestError` (server) + `onRouterTransitionStart` (client nav) |
| API failures | `lib/api.ts` axios interceptor captures 5xx + network failures (skips expected 4xx) |
| User session | Automatic release-health sessions |
| Route | Navigation instrumentation + `route` tag |
| Browser info | Automatic (UA/OS/browser contexts) |

### Backend (`transhub-backend`)
| Requirement | How |
|---|---|
| API exceptions | Central error handler captures unexpected 5xx (`category: api`) |
| Database errors | Prisma faults tagged `category: database` |
| Authentication errors | 401s captured as `warning` (`category: auth`) |
| Authorization errors | 403s captured as `warning` (`category: authorization`) |
| Payment errors | `reportPaymentIssue()` at every failure point (see below) |
| Webhook errors | Invalid-signature 401 + per-type webhook failures |

### Payment monitoring (`reportPaymentIssue`)
Tagged `payment.type` (booking|charter|waybill) × `payment.stage`
(init|verify|webhook|callback|confirm), grouped by fingerprint:

| Type | Captured failures |
|---|---|
| Ticket (booking) | metadata incomplete, unknown trip, **amount mismatch (fraud)**, **captured-but-seats-gone (refund)**, confirm exceptions — on both webhook & verify paths |
| Charter | no quoted price, **amount mismatch** |
| Waybill | **amount mismatch** |

Verification failures and callback failures surface through the verify-path
captures (stage `verify`) and the API-failure capture on the frontend callback.

### Performance
| Signal | How | Default threshold |
|---|---|---|
| Slow API calls | `observability` middleware on `res.finish` | `SLOW_REQUEST_MS` = 1000ms |
| Slow queries | Prisma `$on('query')` (query template only, never bound values) | `SLOW_QUERY_MS` = 300ms |
| Large payloads | `observability` middleware checks `content-length` | `LARGE_PAYLOAD_BYTES` = 1MB |
| Slow pages | Frontend tracing (`tracesSampleRate`) — page-load + navigation transactions | — |

---

## 4. Security — what is NEVER sent

`sendDefaultPii: false` everywhere (no IPs, cookies, or auto request bodies),
plus a deep recursive scrubber wired as `beforeSend` / `beforeSendTransaction` /
`beforeBreadcrumb` on **both** sides (`backend/src/infra/sentry/scrub.ts`,
`frontend/src/lib/sentry-scrub.ts`):

- **Redacted by key**: password, secret, token, authorization, cookie, api key,
  card / cvv / cvc / pin, otp, jwt, dsn, paystack, signature, credential,
  refresh token.
- **Redacted by value** (anywhere): JWTs, `Bearer …` tokens, `sk_*`/`pk_*` keys.
- **Dropped headers**: `authorization`, `cookie`, `set-cookie`,
  `x-paystack-signature`, `proxy-authorization`.
- **Payment references**: only the **last 6 chars** are tagged
  (`payment.ref_suffix`) — never the full reference, never card data.
- **User context**: only `{ id, role }` — never email, phone, or IP.

---

## 5. User context attached (when available)

| Field | Backend | Frontend |
|---|---|---|
| User ID | `setSentryUser` in `authenticate` | `authStore` login/hydrate |
| User role | same | same |
| Route | `observability` middleware `route` tag | navigation + `route` tag |
| Request ID | `request_id` tag (from `x-request-id`) | echoed from response header on API failures |

---

## 6. Recommended alert rules

Create these in **Sentry → Alerts** for each project (start in **staging**,
then replicate to **production**; keep **development** alert-free).

### Backend (`transhub-backend`)
1. **Payment failures (critical)** — Issues where `error.category = payment`.
   *Any new event* → page on-call (Slack/PagerDuty). These are money events.
2. **Captured-but-seats-gone refunds** — `payment.stage = confirm` AND message
   contains "manual refund". *Any event* → finance + on-call.
3. **Amount mismatch (fraud signal)** — issues containing "amount mismatch".
   *Any event* → security channel.
4. **Server error spike** — `category = api` OR `category = database`,
   **> 10 events in 5 min** → on-call.
5. **Database errors** — `category = database`, **> 5 in 5 min** → on-call.
6. **Auth/authz anomaly** — `category in (auth, authorization)`,
   **> 50 in 5 min** (credential-stuffing / BOLA probing) → security.
7. **Slow requests** — `performance.kind = request`, **> 20 in 10 min** → perf channel.
8. **Webhook failures** — issues tagged `error.category = webhook` OR 401 on
   `/payments/webhook` → on-call.

### Frontend (`transhub-frontend`)
9. **Error-rate spike** — **> 25 issues in 5 min** → frontend channel.
10. **API failures** — `error.category = api`, **> 20 in 5 min** → on-call.
11. **Checkout/payment-page errors** — `route` starts with `/checkout`,
    `/my-charters`, `/pay-success` → page on-call (these block revenue).
12. **Core Web Vitals / slow transactions** — p75 LCP regression alert (metric alert).

### Suggested noise controls
- Set **inbound rate limits** per project to cap event spend.
- Mute `category in (auth, authorization)` from paging (dashboard-only) unless spiking.
- Use **environment = production** filters so staging noise never pages.

---

## 7. Verifying ingestion

With DSNs set, trigger one of each and confirm it lands in the right project:

- **Frontend React error**: throw in a client component / click a test button.
- **Backend API exception**: hit a route that throws an unexpected error (500).
- **API failure**: stop the backend, perform any dashboard action → frontend
  `category = api` event.
- **Payment error**: send a Paystack webhook with a mismatched amount →
  `payment.type = booking, payment.stage = webhook` event.

Each should appear with `{ id, role }` user, `route`, `request_id`, and **no**
passwords/tokens/cards in the payload.
