<div align="center">

# 🚌 TransHub

### Nigeria's Interstate E-Ticketing, Logistics & Charter Marketplace

**Book bus seats. Send parcels by waybill. Charter entire vehicles.** One platform connecting passengers, transport operators, drivers, and administrators across the country.

[![Next.js](https://img.shields.io/badge/Next.js-16.2-000000?logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Express](https://img.shields.io/badge/Express-5-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Prisma](https://img.shields.io/badge/Prisma-6-2D3748?logo=prisma&logoColor=white)](https://www.prisma.io/)
[![Redis](https://img.shields.io/badge/Redis-7-DC382D?logo=redis&logoColor=white)](https://redis.io/)
[![PWA](https://img.shields.io/badge/PWA-offline_ready-5A0FC8?logo=pwa&logoColor=white)](https://web.dev/progressive-web-apps/)
[![CI](https://img.shields.io/badge/CI-GitHub_Actions-2088FF?logo=githubactions&logoColor=white)](.github/workflows/ci.yml)

</div>

---

## Table of Contents

- [Project Title](#-transhub)
- [Overview](#overview)
- [Key Features](#key-features)
- [User Roles](#user-roles)
- [Booking System](#booking-system)
- [Charter System](#charter-system)
- [Waybill System](#waybill-system)
- [Payment System](#payment-system)
- [Authentication & Authorization](#authentication--authorization)
- [Dashboard Architecture](#dashboard-architecture)
- [Frontend Architecture](#frontend-architecture)
- [Backend Architecture](#backend-architecture)
- [Database Design](#database-design)
- [Security Features](#security-features)
- [Monitoring & Reliability](#monitoring--reliability)
- [CI/CD & Deployment](#cicd--deployment)
- [Project Structure](#project-structure)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [API Overview](#api-overview)
- [Performance Optimizations](#performance-optimizations)
- [Future Roadmap](#future-roadmap)
- [Technical Highlights](#technical-highlights)
- [Development Approach](#development-approach)
- [Author](#author)

---

## Overview

Interstate travel and parcel logistics in Nigeria are still largely **cash-first, paper-based, and fragmented** across hundreds of independent transport companies. Passengers queue at motor parks with no guarantee of a seat; operators manage manifests on paper and lose revenue to double-bookings and walk-in chaos; sending a parcel means physically handing cash to a driver and hoping it arrives.

**TransHub solves this** by unifying three real businesses into a single, production-grade marketplace:

1. **🎫 Bus & seat e-ticketing** — passengers search routes across many operators, reserve seats with a guaranteed hold, pay online, and receive a ticket they can present **even with no signal at the terminal**.
2. **📦 Waybill (parcel logistics)** — customers request shipments, receive an admin-priced quote, pay, and track their parcel live through every hub stage.
3. **🚐 Vehicle charter** — customers hire an entire vehicle for a private journey through a quote-and-confirm flow.

The defining engineering challenge — and the heart of this codebase — is **seat inventory under concurrency**: at a target scale of **2,000–3,000 concurrent users**, the system must *never* sell the same seat twice, even when hundreds of people race for the last seat on a trip the instant it's released.

**Business value:** digitises a high-volume, cash-heavy market; eliminates double-booking and revenue leakage for operators; gives passengers reliable, prepaid, offline-capable tickets; and opens new revenue lines (logistics + charter) on shared infrastructure.

**Target users:** everyday interstate travellers, transport companies (operators) and their drivers, parcel senders, and the platform administrators who run the marketplace.

---

## Key Features

### 🎫 Travel & Ticketing
- Multi-operator route search with date and origin/destination filtering
- Two-phase **hold → confirm** seat reservation with a 10-minute TTL hold
- Concurrency-safe inventory that **provably** cannot oversell (integration-tested)
- Online payment via **Paystack** with webhook-driven, idempotent confirmation
- Digital tickets with passenger + next-of-kin details, downloadable & **offline-available** as a PWA
- Live trip capacity updates over WebSockets (seats / "marked full" / walk-in counts)

### 📦 Logistics (Waybill)
- Customer shipment requests with sender/recipient details and declared value
- Admin-driven **quote → pay → track** lifecycle with operator assignment
- Full hub-based status pipeline with a per-stage audit trail
- **Public, unauthenticated parcel tracking** by waybill number — with PII stripped from the public projection
- Real-time tracking updates pushed to anyone watching a shipment

### 🚐 Charter
- Private vehicle hire requests with contact + trip details
- Admin quoting (with internal operator cost / service-fee breakdown) and customer accept/reject
- Pay-and-confirm flow with post-payment trip details (operator, pickup, travel info)

### 🛠️ Operations & Platform
- **Operator onboarding** with admin approval and auto-provisioned operator accounts
- Fleet management (vehicles) and **driver** management with phone-based driver login
- Operator + admin **analytics dashboards** (revenue, top routes, operator performance)
- Transaction ledgers scoped per role
- **Progressive Web App**: installable, offline-capable, with a product-driven caching policy
- End-to-end **observability**: structured logs, error tracking, payment monitoring, performance signals

---

## User Roles

TransHub implements four first-class roles, enforced server-side via JWT claims and RBAC middleware (the frontend `AuthGuard` is UX-only — the server is the source of truth).

| Role | Who they are | What they can do |
|---|---|---|
| **`passenger`** | The end customer | Search & book trips, hold/pay for seats, view tickets offline, request charters, send & track waybills, manage their own account |
| **`operator`** | A transport company | Manage trips, fleet (vehicles) and drivers; view bookings & passenger manifests for their trips; see their own analytics, transactions and assigned waybills; edit their company profile |
| **`admin`** | Platform staff | Approve/decline operators, oversee all bookings/trips/customers, price & manage waybills and charters, view platform-wide analytics and transactions |
| **`driver`** | An operator's driver | Phone-based login; view their assigned trips, mark a trip full, record walk-in (offline) seats, and view passenger lists for their trips |

> Roles are a lowercase enum (`passenger | operator | admin | driver`) deliberately aligned between the database, the JWT payload, and the frontend so claims flow through `AuthGuard` with **zero mapping**.

---

## Booking System

The booking workflow is **defense-in-depth against double-booking** — the single most important guarantee in the platform.

```
   SELECT SEATS            PAY                       WEBHOOK / VERIFY
        │                   │                              │
        ▼                   ▼                              ▼
 ┌─────────────┐    ┌────────────────┐         ┌────────────────────────┐
 │  Phase A    │    │  Initialize    │         │  Phase B — CONFIRM      │
 │   HOLD      │───▶│  Paystack txn  │────────▶│  (inside one Postgres   │
 │ (10-min TTL)│    │ amount from DB │         │   transaction)          │
 └─────────────┘    └────────────────┘         └────────────────────────┘
```

**Phase A — Hold** (`POST /bookings/hold`)
- Validates trip state (scheduled/active, accepting bookings, not full).
- Inside a Postgres transaction, atomically claims free seat slots with
  `SELECT … FOR UPDATE SKIP LOCKED` — concurrent claims lock **disjoint** rows, so total holds can *never* exceed capacity.
- Seats transition `available → held`, stamped with `heldBy` + `heldUntil` (the durable, transactional source of truth).
- Best-effort fast-path caching to **Redis** (TTL keys) and a **BullMQ** delayed expiry job are layered on top — but the DB hold stands alone even if Redis or the queue are unavailable.

**Phase B — Confirm** (Paystack webhook *or* callback verify)
- Idempotency check on `paymentRef` — a webhook firing twice returns the same booking, never two.
- A single Postgres transaction locks the held seats with `SELECT … FOR UPDATE` (concurrent confirms serialise; first commit wins) and creates the booking + passenger records.
- The amount is **always recomputed from the database** and compared — the provider's amount is never trusted.

**Expiry & safety nets**
- A **BullMQ delayed job** releases holds that never paid.
- A **periodic sweeper** (every 60s) reclaims any orphaned `held` seat past its `heldUntil` — covering crashes, lost jobs, or a Redis flush.
- A `UNIQUE (tripId, label)` seat constraint and a `UNIQUE seatId` on confirmed seats are the **database-level last line of defence**: even a logic bug cannot persist a double-booking.

> ✅ A dedicated **concurrency integration test** fires *N + overflow* simultaneous requests at a fixed-capacity trip and asserts exactly *N* succeed, the rest get `409`, and availability lands at `0` — for both single-seat and multi-seat holds. A second test drives the full webhook → booked money path concurrently. **These tests run on every CI build.**

The platform also supports a **capacity / open-seating model** (book by quantity rather than fixed seat labels) and operator/driver controls for **walk-in (offline) seats** and a manual **"mark full"** override, all reflected live to passengers over WebSockets.

---

## Charter System

A passenger hires an **entire vehicle** for a private journey through an admin-mediated quote flow:

```
pending ──▶ quote_sent ──▶ awaiting_payment ──▶ confirmed ──▶ completed
   │                                                              
   └──────────────────────── cancelled / rejected ───────────────
```

1. **Request** — passenger submits route, dates, passenger count and contact details (a ≥24h lead-time rule is enforced). An event notifies the admin.
2. **Quote** — admin sets the customer price, selects an operator, and records the internal operator cost + service fee. Customer is emailed.
3. **Accept / Pay** — customer accepts and pays via Paystack; payment can only be initiated in `awaiting_payment`, and the charged amount comes from the **DB-stored quote**, never the client.
4. **Confirm** — webhook (or callback verify) confirms atomically and idempotently, with amount re-verification.
5. **Booking details & completion** — admin attaches operator/pickup/travel info post-payment, then marks the charter completed.

Every charter carries a human-readable reference (e.g. `CHR-20260601-A3F2B1`) for UI and email.

---

## Waybill System

A complete **parcel-logistics lifecycle** built around physical transport hubs:

```
pending ─▶ quote_sent ─▶ paid ─▶ dropped_off ─▶ picked_up
   ─▶ in_transit ─▶ arrived_at_hub ─▶ completed       (cancelled by admin only)
```

- **Request** — customer submits sender/recipient, route, description, weight and declared value. No upfront payment.
- **Quote** — admin assigns a transport operator and sets the fee (a base fee + per-kg rate + a declared-value insurance component). The customer is notified.
- **Pay** — Paystack payment against the DB-quoted fee; confirmation is an **atomic conditional update** so duplicate webhook deliveries can never double-confirm.
- **Track** — every status change writes a `WaybillEvent` (timestamped, with location/note) building a full audit trail, and is **pushed live** to trackers over WebSockets.
- **Public tracking** — `GET /waybills/:no` is unauthenticated and returns a **PII-stripped projection** (no phone numbers, no userId, no payment reference, no declared value). The waybill number itself is a high-entropy, CSPRNG-generated token (`WB-2026-XXXXXX`).

> 🔒 Operator scoping is **BOLA-hardened**: an operator can only ever see and advance the waybills *assigned to them* — any client-supplied operator id is ignored, and operators cannot cancel a paid shipment (a refund decision reserved for admin).

---

## Payment System

Payments are integrated with **Paystack** and engineered to be **idempotent, webhook-driven, and fraud-resistant** across all three product lines (bookings, charters, waybills).

**Architecture**
- **Initialize** — server resolves the chargeable items from the **database** (held seats / quoted price / quoted fee), computes the amount server-side, and asks Paystack for an authorization URL. The client cannot influence the amount.
- **Webhook** (`POST /payments/webhook`) — registered with `express.raw()` **before** JSON parsing so the raw body is available for signature verification. The signature is checked with **HMAC-SHA512 in constant time** (`crypto.timingSafeEqual`); an invalid signature is the *only* path that returns a non-200. The webhook routes by `metadata.type` to the booking, charter, or waybill confirm path via the internal event bus.
- **Verify fallback** — the frontend payment-callback pages call a verify endpoint that asks Paystack directly. This makes confirmation resilient to delayed/dropped webhooks (or local dev where Paystack can't reach the server) and lets the UI distinguish *failed/abandoned* from *still pending* instead of silently timing out.

**Security invariants (enforced in code)**
- Amounts are **always recomputed from the DB** and compared — provider amounts are only ever verified, never trusted (an amount mismatch is treated as a possible fraud signal and reported).
- The Paystack **secret key and payment references are never logged** or returned to clients.
- Confirmation is **idempotent** on the payment reference — duplicate deliveries return the existing record.
- A captured payment whose seats are gone is flagged for **manual refund / reconciliation** (a dedicated monitoring alert).
- Passenger PII collected at checkout is cached in Redis keyed by reference (24h TTL) rather than embedded in third-party metadata.

---

## Authentication & Authorization

**Authentication**
- **Registration & login** issue a signed **JWT** (HS256). Passwords are hashed with **argon2id**.
- The JWT payload *is* the frontend's user shape (`id, email, fullName, phone, role, operatorId?`), so the client decodes identity straight from the token with no extra round-trip.
- **Drivers** authenticate by **phone + password** (no email) via a dedicated login.
- **Password reset** is token-based and email-driven: a 256-bit CSPRNG token is emailed, but only its **SHA-256 hash** is stored. Tokens are **single-use**, time-boxed (1h), and prior tokens are invalidated when a new one is issued.

**Authorization**
- **Role-based access control** via `requireRole(...)` middleware, applied per route after `authenticate`.
- Resource ownership is enforced in services (passengers see only their own bookings/charters/waybills; operators are scoped to their own trips/fleet/drivers/waybills; admins are unrestricted).
- The **JWT verification pins the algorithm to HS256** and validates the payload shape with Zod on every request — closing algorithm-confusion / `alg:none` attacks and rejecting tampered tokens.

**Protected routes**
- Frontend pages are wrapped in an `AuthGuard` that waits for the persisted auth store to hydrate before deciding (no redirect-on-refresh flicker) and renders an *Access Denied* state on role mismatch.
- This is **UX only** — every protected API route independently enforces auth + RBAC on the server.

---

## Dashboard Architecture

Each role has a purpose-built dashboard surface, organised as Next.js **route groups**:

| Dashboard | Route group | Highlights |
|---|---|---|
| **Passenger** | `(passenger)` | Search, trip detail (live seat availability), checkout, booking success, offline tickets, my shipments, account settings |
| **Operator** | `(operator)` | Trips, fleet/vehicles, drivers, bookings & passenger manifests, transactions, analytics, company profile, assigned waybills |
| **Admin** | `(admin)` | Operator approvals, all bookings, customers directory, manage-trips, charters, waybills, transactions, platform analytics |
| **Driver** | `(driver)` | Assigned trips, mark-full / walk-in seat controls, passenger lists |
| **Charter / Waybill** | `(charter)`, `(waybill)` | Charter request & my-charters; send parcel, track parcel, pay-success |

Admin and operator analytics are powered by **Recharts** over server-side aggregate endpoints (summary, revenue over time, top routes, operator performance) — all backed by purpose-built database indexes.

---

## Frontend Architecture

**Framework & language**
- **Next.js 16.2 (App Router)** + **React 19.2**, with the **React Compiler** enabled in production builds.
- Incremental TypeScript: core logic (`lib`, `store`, `services`, `hooks`, `types`) is `.ts`; page components remain `.js` by design (`allowJs`).

**UI & styling**
- **Tailwind CSS v4** with a **CSS-first config** (`@theme` tokens in `globals.css`, not a JS config file).
- **shadcn/ui** + **@base-ui/react** primitives, **lucide-react** icons, **Framer Motion** for animation, **canvas-confetti** for booking success.

**State, data & routing**
- **Zustand** stores for client state (auth, booking, charter, fleet, operator, toasts) with persisted, hydration-aware auth.
- A pre-configured **Axios** client: auto-attaches the JWT, unwraps responses, **retries 5xx/network errors with backoff**, normalises the server's `{ error: { code, message } }` shape, and handles `401` by clearing auth and redirecting (without bouncing users off login pages).
- A typed **service layer** (`services/*`) maps one module per backend domain.
- **socket.io-client** powers live trip capacity and waybill tracking; **Zod** mirrors validation on the client.

**Progressive Web App**
- A hand-written, versioned **service worker** implements a deliberate, product-driven caching policy (see below).
- Installable with a web manifest, maskable icons, and an offline fallback page.

---

## Backend Architecture

A **modular monolith** in **Express 5 + TypeScript** — structured so modules *could* be split into services later, but deployed as one app (microservices would be over-engineering at this scale).

**Module internal layering** (one-way data flow, enforced):

```
*.routes.ts       URL → handler map (+ validation, auth, RBAC middleware)
*.controller.ts   HTTP only — reads req, sends res. No business logic, no DB.
*.service.ts      business logic — knows nothing about req/res or SQL.
*.repository.ts   the ONLY place that touches the DB for this module.
*.schema.ts       Zod input validation.
*.openapi.ts      OpenAPI registration (dev/staging Swagger UI).
*.job.ts          BullMQ processor that lives with its feature.
index.ts          PUBLIC interface — re-exports the service only.
```

**Architecture rules (treated as enforced invariants):**
1. **Public-interface rule** — modules import each other only through `index.ts`, never another module's internals.
2. **Table-ownership rule** — each table has one owning module whose repository is its only writer. `seats` is written **only** by `inventory.repository` — this is what protects the concurrency guarantee.
3. **Layer-direction rule** — `routes → controller → service → repository → db`, one way.
4. **Event rule** — cross-module side effects flow through a strongly-typed **event bus**, not direct calls (e.g. `payment.charter.succeeded` decouples `payments` from `charters` and breaks a circular import). A throwing listener is caught and logged so a notification bug can never break a money flow.

> `eslint-plugin-boundaries` + `no-restricted-imports` encode rules 1–3 so violations **fail CI**, not just review.

**Infrastructure (plumbing only, no business logic):** Prisma client, Redis (ioredis), BullMQ queues/workers, Socket.io server, a typed event bus, pino logger, Nodemailer mailer, Sentry, and the OpenAPI registry.

**Boot & resilience (`server.ts`):** binds the HTTP port **first** so health probes are reachable immediately, then connects Postgres/Redis in the background (the app boots "degraded" and self-heals rather than failing a deploy on a flapping dependency), starts the hold-expiry + seat-sweep workers, and handles **graceful shutdown** (drains sockets, flushes Sentry, closes DB/Redis/queues with a hard-timeout fallback).

---

## Database Design

**PostgreSQL** (ACID — non-negotiable for money + inventory) via **Prisma** ORM, with **raw SQL dropped in for the seat-locking queries** where row-lock semantics matter. Schema evolution is tracked through **25+ ordered migrations**.

**Core models**

| Model | Purpose | Notable design |
|---|---|---|
| `User` | All non-driver accounts | argon2id hash; lowercase `Role` enum; `(role, createdAt)` index for the admin directory |
| `Operator` | Transport company application | Approval workflow (`pending/approved/declined`); 1-to-1 with its operator `User` |
| `Driver` | Operator's drivers | Phone-unique; argon2 hash; phone-based auth |
| `Vehicle` | Operator fleet | Soft-deleted (never hard-deleted) |
| `Trip` | A scheduled journey | Auto-creates `Seat` rows; capacity + walk-in/offline override fields; composite route index `(from, to, departureTime)` |
| `Seat` | One seat on a trip | `available/held/booked` + `heldBy`/`heldUntil`; **`UNIQUE(tripId, label)`**; indexes tuned for availability counts and the sweeper |
| `Booking` / `BookedSeat` / `PassengerInfo` | A confirmed booking | `paymentRef` **unique** (webhook idempotency); **`UNIQUE seatId`** as the anti-double-booking backstop |
| `Charter` | Private vehicle hire | Quote + payment + confirmation fields; decimal money columns |
| `Waybill` / `WaybillEvent` | Parcel + lifecycle audit trail | Per-stage timestamps; status+recency indexes; cascade-deleted events |
| `PasswordResetToken` | Reset grants | Stores only the token **hash**; single-use; TTL-boxed |

**Data architecture notes**
- Indexes are intentional and documented — e.g. foreign-key columns are explicitly indexed (Postgres does not auto-index FKs), and composite indexes back the exact filter+sort of each hot read path (admin lists, "my bookings", availability counts, the expiry sweeper).
- Money is stored as integers (naira) for seats and as `Decimal(12,2)` for charter/waybill amounts.
- Foreign-key delete behaviour is deliberate (`SetNull` for driver→trip, `Cascade` for events/reset tokens) to avoid accidental data loss.

---

## Security Features

Security is treated as a first-class feature, not an afterthought:

- **Password hashing** with **argon2id**.
- **JWT** signed HS256 with a **pinned verification algorithm** and Zod-validated payload (blocks `alg:none` / algorithm confusion / tampering).
- **Timing-safe login** — argon2 verify runs even for unknown emails (constant-time) to prevent **user enumeration**; a single dummy hash is pre-computed at boot.
- **RBAC** on every protected route + **ownership/BOLA scoping** in services (operators and passengers cannot read across tenants).
- **Redis-backed rate limiting** via an **atomic Lua script** (INCR+EXPIRE in one round-trip, no TTL-leak window), keyed by user-or-IP, **fail-open** so the limiter can never self-inflict an outage. Tighter limits guard auth and webhooks.
- **Helmet** with an explicit **CSP**, production **HSTS**, and COEP; **CORS** is a validated, normalised allowlist (scheme-checked at boot, multi-origin for prod + preview URLs).
- **Webhook signature verification** (HMAC-SHA512, constant-time) and **payment amount re-verification** against the DB.
- **Env validation at boot** (Zod) — the app **refuses to start** misconfigured, with extra production-only guards (no test Paystack key, no localhost CORS, SMTP required).
- **Central typed errors** → one error middleware → a consistent `{ error: { code, message, details? } }` shape with correct HTTP codes; internal details never leak to clients.
- **PII protection in telemetry** — Sentry runs with `sendDefaultPii: false` plus a deep recursive scrubber on both client and server (redacts passwords, tokens, cards, signatures; drops auth/cookie headers; tags only the last 6 chars of a payment ref; user context limited to `{ id, role }`).
- **Input validation everywhere** with Zod (body, query, params — including UUID guards so bad ids become clean `400`s, not raw DB `500`s).

---

## Monitoring & Reliability

**Error & performance tracking** — **Sentry** across two projects (backend + frontend), fully env-driven (a no-op when no DSN is set, so local/test runs are unaffected). Coverage includes:
- Unexpected `5xx` (tagged `api` vs `database`), security-relevant `401`/`403` spikes, React error boundaries, route errors, and frontend API failures.
- **Dedicated payment monitoring** — every failure point reports a tagged event (`payment.type` × `payment.stage`), with critical alerts for **amount mismatch (fraud)** and **captured-but-seats-gone (refund required)**.
- **Performance signals** — slow requests, slow queries (query template only, never bound values), and large payloads, with configurable thresholds.
- A documented set of **recommended production alert rules** ships in [`SENTRY.md`](SENTRY.md).

**Logging** — structured **pino** logging with per-request IDs propagated end-to-end (`x-request-id`), correlated into Sentry.

**Health & liveness** — a **split health model**: `/healthz` is a dependency-free **liveness** probe (point your platform's deploy gate here) and `/health` is a **readiness** probe that returns `503` when Postgres or Redis is unreachable (with per-check timeouts so a hung dependency reports "down" rather than wedging the probe).

**Reliability patterns** — degraded-boot + self-healing Redis/Postgres reconnects, graceful shutdown, a belt-and-braces seat sweeper, idempotent payment paths, and BullMQ retry/backoff on background jobs.

---

## CI/CD & Deployment

**Continuous Integration** — [GitHub Actions](.github/workflows/ci.yml) runs on every push to `main` and every PR, with in-flight runs cancelled on new pushes:

- **Backend** — ESLint, `tsc` typecheck, unit tests, and the **seat-concurrency + confirm-concurrency integration tests** against live **Postgres 16** and **Redis 7** service containers (migrations applied + admin seeded first).
- **Frontend** — production `next build`.
- CI uses hardcoded, test-only secret fallbacks so fork PRs (which can't read repo secrets) still pass — real secrets are never required by tests.

**Local development** — `docker-compose.yml` provisions Postgres + Redis; the apps run on the host for a fast edit-reload loop.

**Production deployment** — the platform is provisioned across managed services:
- **Backend (Express)** on a container host (e.g. Render), with the **liveness** path wired to `/healthz`.
- **PostgreSQL** on a managed provider (e.g. Neon).
- **Redis** on a managed provider (e.g. Upstash) over TLS (`rediss://`) — the queue client decodes ACL credentials and passes SNI so managed-Redis connections authenticate and self-heal.
- **Frontend (Next.js PWA)** on an edge platform (e.g. Vercel), with the production domain + preview URLs in the CORS allowlist.

**Production readiness** is enforced at boot (env validation rejects test keys, localhost origins, and missing SMTP in production).

---

## Project Structure

```
transhub/
├── .github/workflows/ci.yml      Lint · typecheck · tests · concurrency · build
├── docker-compose.yml            Local Postgres + Redis
├── SENTRY.md                     Monitoring & alerting playbook
├── CLAUDE.md                     Engineering spec & architecture rules
│
├── frontend/                     Next.js 16 PWA (passenger/operator/admin/driver)
│   ├── public/                   Service worker, manifest, icons
│   └── src/
│       ├── app/                  App Router — route groups by audience
│       │   ├── (public)/ (passenger)/ (operator)/ (admin)/
│       │   ├── (charter)/ (waybill)/ (driver)/
│       │   └── auth/             login · register · forgot/reset-password
│       ├── components/           booking/ charter/ waybill/ shared/ ui/
│       ├── lib/                  api client · auth · socket · validation
│       ├── services/             one module per backend domain
│       ├── store/                Zustand stores
│       ├── hooks/  └─ types/
│       └── sentry.*.config.ts
│
├── backend/                      Express 5 modular monolith
│   ├── prisma/
│   │   ├── schema.prisma         Models, enums, indexes
│   │   ├── migrations/           25+ ordered migrations
│   │   └── seed.ts               Idempotent admin seed (non-prod only)
│   └── src/
│       ├── app.ts                Express assembly (security, CORS, routes, errors)
│       ├── server.ts             Boot, workers, graceful shutdown
│       ├── config/               Zod-validated env + constants
│       ├── infra/                db · redis · queue · events · socket · logger · mailer · sentry · openapi
│       ├── middleware/           authenticate · rbac · rate-limit · validate · request-id · error · observability
│       ├── modules/              auth · users · operators · drivers · trips · inventory ·
│       │                         bookings · payments · tickets · charters · waybills ·
│       │                         vehicles · analytics · transactions · notifications · contact · health
│       ├── shared/               errors · tokens · pagination · security · list-query
│       └── tests/                seat-concurrency · confirm-concurrency · pagination
│
└── packages/                     (reserved for shared types)
```

---

## Installation

### Prerequisites
- **Node.js 22+**
- **Docker** (for local Postgres + Redis) — or local Postgres 16 / Redis 7
- A **Paystack** account (test keys are fine for development)

### 1. Clone & install
```bash
git clone <repo-url> transhub && cd transhub

# Frontend deps
npm --prefix frontend install

# Backend deps (runs `prisma generate` on postinstall)
npm --prefix backend install
```

### 2. Start infrastructure
```bash
docker compose up -d        # Postgres + Redis
```

### 3. Configure environment
```bash
cp backend/.env.example backend/.env
# edit backend/.env — set JWT_SECRET (openssl rand -hex 32) and your Paystack keys

# frontend/.env.local
echo "NEXT_PUBLIC_API_URL=http://localhost:4000" >> frontend/.env.local
echo "NEXT_PUBLIC_PAYSTACK_KEY=pk_test_xxx"       >> frontend/.env.local
```

### 4. Migrate & seed the database
```bash
npm --prefix backend run prisma:migrate     # apply migrations
npm --prefix backend run db:seed            # seed dev admin (admin@transhub.ng)
```

### 5. Run
```bash
# Terminal 1 — backend API (http://localhost:4000, Swagger at /docs)
npm run dev:backend

# Terminal 2 — frontend (http://localhost:3000)
npm run dev
```

### Useful scripts (from repo root)
| Command | Action |
|---|---|
| `npm run dev` / `npm run dev:backend` | Start frontend / backend |
| `npm run build` / `npm run build:backend` | Production build |
| `npm run typecheck` / `npm run typecheck:backend` | TypeScript checks |
| `npm run lint` / `npm run lint:backend` | Lint |
| `npm run test:backend` | Backend unit tests |
| `npm --prefix backend run test:concurrency` | Seat oversell integration test |
| `npm --prefix backend run test:confirm-concurrency` | Webhook→booked concurrency test |

---

## Environment Variables

Backend variables are **validated at boot** — the app refuses to start if any are missing or malformed.

### Backend (`backend/.env`)
| Variable | Required | Description |
|---|---|---|
| `NODE_ENV` | – | `development` \| `test` \| `production` |
| `PORT` | – | API port (default `4000`) |
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `REDIS_URL` | ✅ | Redis URL (`rediss://` for managed/TLS) |
| `CORS_ORIGIN` | ✅ | Comma-separated allowlist of frontend origins (scheme required) |
| `JWT_SECRET` | ✅ | ≥16 chars (`openssl rand -hex 32`) |
| `JWT_EXPIRES_IN` | – | Token lifetime, e.g. `7d` |
| `PAYSTACK_SECRET` | ✅ | `sk_test_…` / `sk_live_…` — server-only, never exposed |
| `PAYSTACK_PUBLIC_KEY` | ✅ | `pk_…` — safe to forward to the client |
| `FRONTEND_URL` | ✅ | Base URL for email/callback links |
| `SMTP_HOST/PORT/USER/PASS/FROM` | prod | Email delivery (auto Ethereal test account in dev) |
| `ADMIN_EMAIL` / `CONTACT_EMAIL` | – | Platform notification inboxes |
| `SENTRY_DSN` + `SENTRY_*` | – | Monitoring (no-op when unset) |
| `SLOW_REQUEST_MS` / `SLOW_QUERY_MS` / `LARGE_PAYLOAD_BYTES` | – | Performance signal thresholds |

### Frontend (`frontend/.env.local`)
| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | ✅ | Backend base URL |
| `NEXT_PUBLIC_PAYSTACK_KEY` | ✅ | Paystack public key |
| `NEXT_PUBLIC_SENTRY_DSN` + `NEXT_PUBLIC_SENTRY_*` | – | Frontend monitoring |
| `SENTRY_AUTH_TOKEN` / `SENTRY_ORG` / `SENTRY_PROJECT` | – | Source-map upload at build time |

> No secrets are committed — `.env.example` ships placeholders only.

---

## API Overview

JSON over HTTP, JWT-authenticated, consistently shaped errors. Interactive **Swagger UI** is served at `/docs` in non-production environments.

| Domain | Representative endpoints | Access |
|---|---|---|
| **Auth** | `POST /auth/register` · `/auth/login` · `/auth/driver/login` · `/auth/forgot-password` · `/auth/reset-password` · `GET /auth/me` | Public / self |
| **Users** | `GET /users` · `GET/PATCH /users/me` · `PATCH /users/me/password` | Admin / self |
| **Operators** | `POST /operators/register` · `GET /operators/public` · `GET/PATCH /operators/me` · `GET /operators` · `PATCH /operators/:id/approve\|decline` | Public / operator / admin |
| **Drivers** | `POST/GET/GET:id/PATCH/DELETE /drivers` | Operator / admin |
| **Trips** | `GET /trips/search` · `GET /trips/:id` · `POST /trips` · `GET /trips/mine` · `PATCH /trips/:id/active\|fill\|offline` · `GET /trips/:id/passengers` | Public / operator / driver / admin |
| **Bookings** | `POST /bookings/hold` · `GET /bookings` · `GET /bookings/:id` | Passenger / operator / admin |
| **Payments** | `POST /payments/initialize` · `GET /payments/verify/:reference` · `POST /payments/webhook` | Passenger / Paystack |
| **Tickets** | `GET /tickets` · `GET /tickets/:bookingId` | Passenger |
| **Charters** | `POST /charters` · `GET /charters/me` · `GET /charters` · `PATCH /charters/:id/quote\|accept\|reject\|confirm-booking\|complete` · `POST /charters/:id/pay\|verify-payment` | Passenger / admin |
| **Waybills** | `POST /waybills` · `GET /waybills/mine` · `GET /waybills` · `PATCH /waybills/:id/quote\|status` · `POST /waybills/:id/pay` · `POST /waybills/verify/:reference` · `GET /waybills/:no` (public) | Customer / admin / operator / public |
| **Analytics** | `GET /analytics/summary\|revenue\|routes\|operators` · `GET /analytics/operator` | Admin / operator |
| **Transactions** | `GET /transactions` | Role-scoped |
| **Health** | `GET /healthz` (liveness) · `GET /health` (readiness) | Public |

---

## Performance Optimizations

- **Concurrency primitives over coarse locks** — `FOR UPDATE SKIP LOCKED` lets concurrent holds claim disjoint seats without blocking; confirms serialise only on the exact seats contended.
- **Purpose-built indexes** for every hot path — route search, "my bookings", seat-availability counts, the expiry sweeper, and admin list+sort screens — with explicit FK indexing (Postgres doesn't add it for you).
- **Redis fast paths** — seat-hold cache keys, atomic rate limiting, and PII staging keyed by payment reference.
- **Background jobs (BullMQ)** keep the request path lean — hold expiry, the seat sweeper, and email notifications run off the critical path with retry/backoff.
- **Frontend**: React Compiler in production, route-group code organisation, an Axios layer with retry/backoff, and a recent first-load JS reduction by dropping always-on animation from the shell.
- **PWA caching policy** tuned to the product: tickets cached aggressively for **offline boarding**, while **inventory, payments, and anything money-related are never served from cache** (stale inventory = double-booking).
- **Resilient boot** — port-first startup with background dependency connects so a slow dependency never blocks a deploy or a health probe.

---

## Future Roadmap

Realistic next steps that build naturally on the current architecture:

- **Refresh-token rotation** in Redis (the JWT scaffolding and Redis session store are already in place).
- **QR-coded tickets** for scan-to-board (ticket model + offline caching already support it).
- **Seat-map UI** for trips that use fixed seat labels (the data model already distinguishes labelled vs. open seating).
- **PgBouncer connection pooling** at the deployment layer (noted as deferred in `docker-compose`).
- **Operator payout & settlement** automation built on the existing transactions + event-bus foundation.
- **Notification expansion** — SMS/push alongside email, via the existing notifications job module.
- **Multi-currency / additional PSPs** behind the existing provider-agnostic payment service boundary.
- **Module extraction** — the strict module boundaries mean high-traffic domains (inventory, payments) could be split into services with minimal refactoring.

---

## Technical Highlights

> A quick tour for engineering reviewers of what makes this codebase production-grade.

**🏗️ Architecture**
- A disciplined **modular monolith** with strictly layered modules (`routes → controller → service → repository`), a **public-interface rule**, a **table-ownership rule**, and an **event bus** for cross-module side effects — all **enforced in CI** via `eslint-plugin-boundaries`, not just convention.

**⚡ Concurrency & correctness**
- A genuinely hard problem (no double-booking at scale) solved with **defense-in-depth**: row-level `FOR UPDATE SKIP LOCKED` holds, serialised confirms, a TTL + delayed-job + periodic-sweeper expiry trio, and **database unique constraints as the final backstop** — all **proven by concurrency integration tests that run on every build**.

**🔒 Security**
- argon2id, HS256 with a pinned algorithm + Zod-validated claims, timing-safe login (anti-enumeration), atomic fail-open rate limiting, HMAC-SHA512 webhook verification, **server-side amount re-computation (anti-fraud)**, BOLA-scoped multi-tenant access, boot-time env validation, and deep PII scrubbing in telemetry.

**💳 Payments**
- **Idempotent, webhook-driven** confirmation with a **verify-API fallback** for delivery resilience, shared across three product lines, with money-specific monitoring (fraud + refund alerts).

**📈 Scalability & reliability**
- Degraded-boot + self-healing connections, graceful shutdown, background workers, split liveness/readiness health, indexed read paths, and a real-time layer (Socket.io) that's a UX nicety, never a source of truth.

**🧰 Engineering practices**
- End-to-end TypeScript, Zod validation shared in spirit across the stack, OpenAPI/Swagger docs, structured logging with request-id correlation, a documented monitoring/alerting playbook, an opinionated CI matrix, and an unusually high standard of **intent-revealing code comments** explaining *why*, not just *what*.

---

## Development Approach

This project was built with modern software-engineering practices: domain-driven module boundaries, test-backed critical paths, infrastructure-as-config, and an emphasis on production readiness over feature breadth.

**AI-assisted development tools were used responsibly** as part of the workflow — for productivity enhancement, debugging, code-review assistance, documentation support, and accelerated development. **All architectural decisions, integrations, security reviews, testing, and final engineering judgments were designed, validated, and controlled by the developer.** The system design, the concurrency strategy, the security model, and the trade-offs throughout reflect deliberate engineering ownership.

---

## Author

**Adeniran Israel**

**Full Stack Developer**

I build scalable, production-minded web applications and startup products — with a focus on backend systems, data integrity under concurrency, secure payment flows, and clean, maintainable architecture. I care about shipping software that holds up in production, not just in a demo, and I'm a continuous learner who enjoys turning hard real-world problems into reliable systems.

<div align="center">

---

*Built for reliability at scale — where a double-booked seat is never an option.*

</div>
