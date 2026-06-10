# TransHub Production-Readiness Test — Bug Log

Format: BUG #N | File:line | Symptom | Root cause | Fix

## Open / In progress

- **BUG #1** | [frontend/src/app/(passenger)/dashboard/page.js:24-45](frontend/src/app/(passenger)/dashboard/page.js#L24) | Passenger dashboard shows hardcoded mock stats (`12` Total Trips, `2` Upcoming, `5` Goods Sent, `4.8★`) and fake `RECENT_TICKETS`; embedded `DriverDashboard` uses mock `useFleetStore` + `DRIVER_ID="DRV-001"`. A brand-new user sees fabricated history. No API call made. | `PASSENGER_STATS`/`RECENT_TICKETS`/`DRIVER_STAT_DEFS` are hardcoded constants. | TBD — wire to GET /tickets, derive real stats + recent tickets, real empty states; remove dead embedded driver dashboard.

- **BUG #2** (security/PII) | [backend/src/modules/waybills/waybills.service.ts:74-78](backend/src/modules/waybills/waybills.service.ts#L74) | Public, unauthenticated `GET /waybills/:no` returns the FULL waybill: `senderPhone`, `recipientPhone`, internal `userId`, `paymentRef`, `declaredValue`, `tripId`, `id`. Waybill numbers are `TH`+8 digits (enumerable) → anyone can harvest sender/recipient phone numbers + internal IDs. | `trackWaybill` returns the raw repository DTO with `res.json(waybill)`; no public projection. | TBD — return a public tracking projection (only fields the Tracker UI needs: waybillNo, status, route, names, description, weightKg, fee, events). Strip phones/userId/paymentRef/declaredValue/tripId/id.

- **BUG #3** (UX/navigation) | [frontend/src/components/shared/Navbar.js:136-141](frontend/src/components/shared/Navbar.js#L136) | A logged-in passenger's account dropdown contains ONLY "Log Out" — no link to My Tickets, Dashboard, or Profile. After login they land on `/`; the marquee offline-tickets feature is only reachable by typing the URL. No passenger profile page exists at all (though backend GET/PATCH `/users/me` work + persist). | Dropdown only renders Log Out for non-admin/operator; passenger nav array has no "My Tickets"/account entries. | TBD — add My Tickets + Dashboard links to the passenger dropdown.

NOTE 1.9: Backend `GET /users/me` + `PATCH /users/me` verified working & persisting (phone change 08012345678→08033334444). Frontend has no passenger profile UI (ties into BUG #1/#3).

- **BUG #4** (mock data) | [frontend/src/app/(operator)/operator/page.js:10-27](frontend/src/app/(operator)/operator/page.js#L10) | Operator dashboard KPI cards are REAL (GET /analytics/operator), but "Today's Trips" (`TRIPS_TODAY` = TR-101 16/18), "Recent Bookings" (`RECENT_BOOKINGS`), and the Revenue chart (`REVENUE`) are hardcoded mock. A new operator sees a fake "TR-101 In Transit 16/18" trip. | Hardcoded module consts rendered instead of GET /trips + GET /bookings (operator-scoped). | TBD — wire Today's Trips→GET /trips, Recent Bookings→GET /bookings; revenue chart needs an operator time-series endpoint or removal.

- **BUG #5** (correctness) FIXED | [backend/src/middleware/error.ts:60](backend/src/middleware/error.ts#L60) | A malformed JSON request body returned **500 INTERNAL_ERROR** instead of **400**. `express.json()` body-parser errors (`type: entity.parse.failed`, status 400; also `entity.too.large` 413) fell through to the generic 500 fallback — masking client errors as server faults and polluting error-rate/alert metrics. | Central error handler had no branch for http-errors-style body-parser errors. | FIXED — added a branch that honors the 4xx `status` from `entity.*` body-parser errors → 400 "Malformed request body" / 413 "Request body is too large". Typecheck clean; verified 400 + no regression (valid hold still 201).

RBAC MATRIX (verified, all correct): no/bad-token→401; passenger→driver/operator/admin endpoints→403; operator→passenger/admin endpoints→403; driver→passenger endpoint→403; admin→driver endpoint→403; positive controls (admin→/operators, passenger→/tickets)→200. RBAC is solid.

- **BUG #6** (mock data) | [frontend/src/app/(admin)/analytics/page.js:179-203](frontend/src/app/(admin)/analytics/page.js#L179) | Admin analytics KPIs + Daily Revenue + Top Routes are REAL, but "Booking Breakdown" (Bus Seats 892/74%, Waybills 329/27%, Charters 47/4%) and "Payment Methods" (Card 58/Transfer 28/USSD 14%) are hardcoded mock (platform has ~14 bookings). A real `GET /analytics/operators` endpoint exists (live operator revenue) but the page ignores it. | Hardcoded arrays rendered as bars. | TBD — back Booking Breakdown with real counts (or wire /analytics/operators); remove Payment Methods (no payment-method data is tracked).

- **BUG #7** (missing UI / feature gap) | frontend `app/(admin)` + `app/(operator)` | No waybill-management UI exists. Backend `GET /waybills` and `PATCH /waybills/:id/status` (operator/admin) work fully (state machine pending→in_transit→arrived→delivered, events appended), but no admin/operator page or nav link surfaces them. Staff cannot advance a parcel's status except via raw API. | Frontend page never built; nav has no Waybills entry. | TBD — add an admin (and/or operator) Waybills page listing GET /waybills with a status-advance control (PATCH /waybills/:id/status).

- **BUG #8** (CI/lint) FIXED | [backend/src/modules/drivers/drivers.repository.ts:11](backend/src/modules/drivers/drivers.repository.ts#L11) | `npm run lint` failed CI: `CreateDriverInput` imported but never used (create() uses an inline type). CLAUDE.md requires lint to pass CI. | Dead import left after a refactor. | FIXED — removed the unused import (kept `UpdateDriverInput`). Lint + typecheck now exit 0.

- **BUG #9** (CI/lint) FIXED | [frontend/src/app/(admin)/manage-trips/page.js:241](frontend/src/app/(admin)/manage-trips/page.js#L241) | `npm --prefix frontend run lint` failed CI: 2× `react/no-unescaped-entities` (raw `"` around the search term). | Literal double quotes in JSX text. | FIXED — replaced with `&ldquo;`/`&rdquo;`. Frontend lint now exits 0 (one pre-existing non-blocking useEffect-dep warning in trips/[id] remains).

## Verified-safe (investigated, NOT bugs)
- Waybill `PATCH /:id/status` 409 on in_transit→delivered — correct state machine (must go via `arrived`). Valid transitions return 200 + append events.
- Charter `POST /charters` 409 `CHARTER_LEAD_TIME` — correct 24h-lead-time business rule, not a bug. Frontend sends correctly; backend enforces.
- Waybill create+pay coupling: on payment-init failure the service deletes the orphaned waybill ([waybills.service.ts createWaybill](backend/src/modules/waybills/waybills.service.ts)) — clean rollback. UI create blocked only by placeholder Paystack key.
- Payment initialize 409 on placeholder key — handled by checkout with toast + redirect ([checkout/page.js:247](frontend/src/app/(passenger)/checkout/page.js#L247)). Confirm path proven via signed webhook sim (booking confirmed, ticket issued).

- Login page "Demo Login as Admin" button — gated by `NODE_ENV === "development"` at both render ([login/page.js:156](frontend/src/app/auth/login/page.js#L156)) and handler ([:33](frontend/src/app/auth/login/page.js#L33)); "demo-token" rejected by backend. Safe.

## Notes / minor
- Page `<title>` is "Sign In | TransHub" on /auth/register and /dashboard (per-page metadata not set). Cosmetic.
