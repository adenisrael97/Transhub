# TransHub

E-ticketing **bus marketplace**: passengers search routes across many bus operators,
pick seats, pay, and receive tickets. Operators list trips and manage their fleet;
admins oversee the platform. Target scale: **2,000–3,000 concurrent users**.

The defining technical challenge is **seat inventory under concurrency** (no double-booking).
Treat that as the heart of the system — see [Seat inventory](#seat-inventory-the-core-problem).

---

## Monorepo layout

```
transhub/
├── frontend/    Next.js PWA — passenger/operator/admin UI   (EXISTS, in active dev)
├── backend/     Express modular monolith, serves JSON        (PLANNED — see note)
├── packages/    shared types between front & back (optional) (not created yet)
└── package.json root scripts that proxy into frontend/
```

> **Status note for the assistant:** the **backend does not exist yet** (`backend/` is empty).
> The structure and rules below are the agreed spec to build *to*. Do **not** assume backend
> files exist — create them per this spec. The frontend is real and in active development.

---

## Commands

Run from repo root:

| Command | What it does |
|---|---|
| `npm run dev` | Start the frontend (`next dev`) |
| `npm run build` | Build the frontend |
| `npm run lint` | Lint the frontend |
| `npm --prefix frontend run typecheck` | TypeScript check (`tsc --noEmit`) |

When the backend exists, mirror these with `--prefix backend`.

---

## ⚠️ Critical: this Next.js is not the one you know

The frontend runs **Next.js 16.2.1 + React 19** — newer than training data, with breaking
changes to APIs, conventions, and file structure. **Before writing or editing any Next.js
code, read the relevant guide in `frontend/node_modules/next/dist/docs/`** and heed
deprecation notices. This is restated in [frontend/AGENTS.md](frontend/AGENTS.md). Do not
rely on memory for Next.js APIs here.

---

## Frontend (`frontend/`)

Next.js **App Router** PWA. Pages are organized by **route groups** under `src/app/`.

### Stack (actual, from package.json)
- **Next.js 16.2.1**, **React 19.2.4** (React Compiler enabled via `babel-plugin-react-compiler`)
- **Tailwind CSS v4** + **shadcn/ui** + **@base-ui/react** for components
- **Framer Motion** (animation), **Recharts** (admin analytics), **canvas-confetti** (booking success)
- **Zustand** (client state), **Zod** (validation, in `lib/validation.ts`)
- **Axios** (API client), **jwt-decode** (auth), **socket.io-client** (real-time: live seat
  availability / waybill tracking), **lucide-react** (icons)

### Language policy
Incremental TypeScript migration. **Core is `.ts`** (`lib`, `store`, `services`, `hooks`,
`types`); **page components stay `.js` by design** (`allowJs`). Match the file's existing
language — don't convert a `.js` page to `.tsx` unprompted.

### Layout
```
frontend/src/
├── app/
│   ├── (public)/        landing
│   ├── (passenger)/     search, trips/[id], checkout, booking-success, tickets
│   ├── (operator)/      operator dashboard: bookings, fleet, trips, profile
│   ├── (admin)/         admin, analytics, bookings, manage-trips, operators
│   ├── (charter)/ (waybill)/ (driver)/
│   ├── auth/            login, register
│   ├── layout.js        root layout (registers service worker, links manifest)
│   └── globals.css
├── components/  booking/ charter/ shared/ (Navbar, Footer, AdminShell, AuthGuard)  pwa/
├── lib/         api client, validation.ts (zod)
├── store/       zustand stores
├── services/    functions that call the backend API
├── hooks/
└── types/
```

### Tailwind v4 gotcha
Config is CSS-first (`@theme` in `globals.css`), **not** `tailwind.config.js`. Design tokens
live in CSS. Confirm token names in `globals.css` before using a class.

---

## PWA

The frontend is a **Progressive Web App** (installable, offline-capable).

- **Service worker** via **Serwist** (`@serwist/next`) — never hand-write the SW.
  Source in `frontend/sw.ts`, plugin wired in `next.config.js`.
- **Manifest** via `app/manifest.ts` (Next generates it) or `public/manifest.json`.
- **Icons** in `public/icons/` (192, 512, maskable).
- **Offline fallback** page at `app/~offline/`.

### Caching policy (product-driven — get this right)
- **Cache aggressively / make offline-available:** purchased **tickets + QR codes**. A
  passenger must show their ticket at boarding even with no signal. This is the marquee
  PWA feature.
- **Never serve from cache (network-first / network-only):** live **seat availability**,
  **payment state**, and anything money-related. Stale inventory = double-booking.

---

## Backend (`backend/`) — spec to build to

**Modular monolith** (not microservices — that would be over-engineering at this scale).
Structured so modules *could* be split later, but deployed as one app.

### Planned stack & why
- **Express** (or NestJS for built-in DI/modules) + **PostgreSQL** (ACID, required for money/inventory)
- **Prisma/Drizzle** (typed queries + migrations) — but drop to **raw SQL for the seat-locking query**
- **Redis** — seat holds (TTL), sessions, rate limiting, caching
- **BullMQ** — background jobs (ticket issuance, hold expiry, payment reconciliation, notifications)
- **Paystack/Flutterwave** — payments (webhook-driven, **idempotent**)
- **JWT** (access + refresh, refresh-rotation in Redis) + **Zod** validation + **pino** logging
- **No Elasticsearch** at this scale — indexed Postgres is enough

### Layout
```
backend/src/
├── config/      env validation (zod, fail at boot), constants
├── infra/       PLUMBING ONLY (no business logic): db/ redis/ queue/ events/ logger/
├── modules/     THE PRODUCT — each feature self-contained & internally layered:
│                auth, users, operators, trips, inventory, bookings, payments,
│                tickets, notifications
├── middleware/  auth, rbac, rate-limit, request-id, central error handler, validate
├── shared/      used by 2+ modules only: errors/ types/ pagination
├── app.ts       assembles express (middleware + mounts module routes)
└── server.ts    boots: validate env → connect db/redis → listen
```

### Module internal layering (the "MVC" lives here)
```
*.routes.ts      URL → handler map
*.controller.ts  HTTP only (reads req, sends res) — NO business logic, NO DB
*.service.ts     business logic — knows nothing about req/res or SQL (most important file)
*.repository.ts  the ONLY place that touches the DB for this module
*.schema.ts      zod input validation
index.ts         PUBLIC interface — re-exports the service only
*.job.ts         BullMQ processor for this module (lives with its feature)
```

---

## Architecture rules (these are enforced, not suggestions)

These are what keep the modular monolith from rotting. Treat violations as bugs.

1. **Public-interface rule** — import another module only through its `index.ts`.
   Never import another module's `*.repository.ts` or internals directly.
2. **Table-ownership rule** — schema is global, but each table has **one owning module**
   whose repository is the only writer. `seats` → only `inventory.repository`. This is
   what protects concurrency guarantees.
3. **Layer-direction rule** — `routes → controller → service → repository → db`, one way.
   Controllers never touch the DB; services never touch `req`/`res`; lower layers never
   import upper ones.
4. **Event rule** — cross-module side effects go through the **event bus / queue**, not
   direct calls. Emit, don't reach in:
   ```
   payment.succeeded → bookings confirms → emits booking.confirmed
                                          → tickets.job issues ticket
                                          → notifications.job sends email/SMS
   ```
   `payments` must not know `tickets` exists.
5. **`shared/` is not a junk drawer** — something graduates to `shared/` only when a 2nd
   module needs it; otherwise it stays in its module.

Wire **`eslint-plugin-boundaries`** + `no-restricted-imports` so rules 1–3 **fail CI**.

---

## Seat inventory — the core problem

Two-phase **hold → confirm**, defense-in-depth against double-booking:

1. **Hold** — on seat selection, create a temporary reservation with a TTL (~10 min)
   (Redis key per seat or a `status='held'` row + `expires_at`). Stops two users grabbing
   the same seat during checkout.
2. **Confirm** — on the payment webhook, inside a **Postgres transaction**, lock the rows:
   ```sql
   BEGIN;
   SELECT id FROM seats
     WHERE trip_id = $1 AND seat_no = ANY($2) AND status = 'available'
     FOR UPDATE;                       -- concurrent txns wait here
   -- if returned rows ≠ requested → abort (seat taken)
   UPDATE seats SET status = 'booked' WHERE ...;
   COMMIT;
   ```
3. **Expire** — a BullMQ delayed job releases holds that never paid.
4. **Last line of defense** — a `UNIQUE (trip_id, seat_no)` constraint on confirmed bookings.
   Even with a logic bug, the DB refuses the double-booking.

Also: **payment webhooks must be idempotent** (dedupe on payment reference — same webhook
fires twice must not issue two tickets).

There must be an **integration test that fires concurrent requests at one seat and proves
only one wins.** That test matters more than any feature.

---

## Conventions

- **Validate every endpoint** with Zod; share schemas with the frontend where possible.
- **RBAC**: roles are `passenger`, `operator`, `admin` (+ `driver`).
- **Errors**: typed error classes + one central error middleware + consistent JSON error
  shape + correct HTTP codes. No ad-hoc `res.status(500)` scattered around.
- **Secrets** in env, validated at boot — app refuses to start if misconfigured.
- **Money & inventory** always go through transactions; never trust cache for them.
- Keep PRs feature-scoped; favor depth (a few modules done to production quality) over breadth.

---

## Pointers

- Frontend Next.js warning & docs: [frontend/AGENTS.md](frontend/AGENTS.md)
- When the backend is created, add a `backend/CLAUDE.md` for backend-specific detail.
