# Phase 4 — final human review and lock

**Phase 4 — Offer / Conversation / Booking Transaction = LOCKED.** Human review PASSED and explicit approval was recorded on **2026-10-04**. This document records the completed review; no acceptance or Dashboard review remains pending for Phase 4.

## Human-validated marketplace flow

Carrier authentication → eligible Carrier reads the real Customer Request → complete-request compatible Route → persisted Offer/revisions → created/reused Conversation → persisted Customer/Carrier messages → Customer acceptance → exactly one atomic Booking → Booked Request and capacity reservation → persisted Booking Detail and Dashboard.

- Incompatible Routes are excluded from Offer submission. The complete Request contains Volkswagen Golf Hamburg → Kaunas and Toyota Corolla Berlin → Kaunas; the compatible Route is Hamburg → Berlin → Kaunas.
- Customer can view and accept the real Offer. The immutable Booking snapshot contains the accepted price, terms, vehicles and routes. The winning Conversation remains active and both participants' messages survive reload.
- Capacity before acceptance: **2 total / 0 reserved / 2 available**. Capacity after acceptance: **2 total / 2 reserved / 0 available**. Offer creation/revision does not reserve capacity.
- The Booked Request leaves active **Užklausos**. Its Booking appears **exactly once** in **Pervežimai**, shows **Vežėjas pasirinktas**, and links to the real Booking. Booking and Dashboard survive reload. Locked public UI remains preserved.
- Realtime Chat/websockets were intentionally deferred. New messages appearing after reload is accepted Phase 4 behavior, not an unfinished review blocker.

## Resolved human-review fixes

1. **Carrier access diagnostics/session handling:** server-only diagnostics exposed the failed profile/Carrier/private-detail reads. On Windows, recorded failures were HTTP 401 / `PGRST303: JWT issued at future`; local Auth restart and fresh managed sessions passed all reads. Existing admission/membership/private details/verification and local environment were verified. No RLS or eligibility bypass, and stale reset cookies were not established as the root cause.
2. **Complete-request Offer Route filtering:** the former Amsterdam → Hamburg → Kaunas Route omitted Berlin. The form now uses complete-request matching, excludes incompatible/unavailable Routes and constrains dates to Route bounds. Database D-005/RLS/matching remain authoritative.
3. **Customer global login / returnTo:** header links targeted a missing `/login` route. The new minimal phone OTP route reuses existing Auth helpers, recognizes existing sessions and validates local return destinations. Desktop/mobile header styling and Carrier auth remain unchanged.
4. **Persisted Dashboard Booking integration:** the old Booking back link `?view=transport` selected mock fixtures. Configured Dashboard now always reads caller-authenticated real data; tab queries select only the tab. Transport/history cards consume accepted Booking snapshots, preserve compact multi-location/count-aware status labels and prevent duplicate Requests across tabs. Canonical transport destination remains `/bookings/[id]`.

## Final Windows review records

Local app: **http://127.0.0.1:3000**. Customer: `+37062557545`; Carrier: `+37065603638`. These are disposable local identities, not production verification decisions. Separate browser profiles were used.

| Record | Final local URL |
|---|---|
| Booked Request | http://127.0.0.1:3000/requests/fc762fed-6dc9-4668-8bf3-2baf4fefabbe |
| Accepted Offer | http://127.0.0.1:3000/offers/1ed61c0a-8b13-4a33-add7-3f31c5ec76e5 |
| Winning Conversation | http://127.0.0.1:3000/messages/fcfde71b-85f1-429a-9451-bfa5afbfa271 |
| Booking | http://127.0.0.1:3000/bookings/735b9cf9-bd2f-42b7-b0a6-246cbfd7e6f2 |
| Reserved Route | http://127.0.0.1:3000/routes/cec6d9f1-bc8b-4a1e-8501-4d272bfe9be6 |
| Dashboard Transports | http://127.0.0.1:3000/dashboard?tab=transports |

Historical Linux URLs and the ignored pre-acceptance bootstrap manifest are superseded by these records. Do not reset the review database or submit another acceptance to reproduce the completed human review. For later local inspection, the existing PowerShell OTP helper remains available:

~~~powershell
Set-Location C:\Projects\traliukas
$env:PARVEZK_TEST_PHONE = '37062557545' # use 37065603638 for Carrier
node scripts/local-phone-auth.mjs
Get-Content supabase/.temp/local-phone-auth.json
~~~

## Explicitly deferred

- Realtime Chat/websockets.
- Attachments/read receipts.
- Full Booking operational lifecycle after Booked, including cancellation/capacity release and private operations gateway.
- Notification persistence/provider delivery.
- Reviews persistence.
- Payments/escrow.
- Route Distribution.
- Full i18n.

Request edit/close persistence and automatic expiry reconciliation remain deferred as previously recorded. Minimal internal events/system messages and internal read cursors do not constitute notification delivery, realtime or user-facing read receipts.

## Validation and roadmap handoff

Final lock checks: `npm.cmd test` — **141/141 PASS**; `npm.cmd run build` — **PASS**, including lint/types; `git diff --check` — **PASS**; `git status --short` reviewed, with existing implementation changes left uncommitted. Prior implementation evidence (not rerun against the persistent review DB in this lock task): 541/541 pgTAP assertions; concurrency/idempotency/rollback tests; owner/unrelated-Customer RLS checks; real browser flow and Dashboard checks at 390/768/1280/1440. Owner access succeeded, unrelated Customer access was denied, and private operations remained unavailable to ordinary clients. No security relaxation.

The existing numbered roadmap names **Phase 5 — Carrier Marketplace** in `04_IMPLEMENTATION_PLAN.md`. That older numbering overlaps completed backend milestones; remaining scope must account for locked work. The detailed backend rollout (§19 of `06_BACKEND_FOUNDATION_ARCHITECTURE.md`) separately follows Acceptance/Booking with lifecycle/reviews/in-app Notifications. No new roadmap is invented and no deferred feature is started or authorized by this lock. Await the separate next-phase task.

This lock task changes documentation only; pre-existing implementation changes remain uncommitted. No remote Supabase access, commit or push.

## Implementation report

1. **Migrations/files:** Four Phase 4 forward migrations: `20260925000300_offer_conversation_booking.sql`, `20260925000400_transaction_integrity.sql` (existing groundwork), `20260925000500_marketplace_commands.sql`, `20260925000600_marketplace_projections.sql`. Locked Phase 1–3 migrations unchanged. Full file inventory below.
2. **Offer schema/versioning:** One pending Offer per Request/Carrier; immutable revision rows with Request/Route/Offer versions. Revisions reuse Offer identity; later eligible relationships reuse the pair's Conversation. Complete Request only, fixed EUR V1, immutable parent identity.
3. **Conversations/messages:** Unique Request/Carrier Conversation, append-only user/system text, sequence ordering, idempotent message key and monotonic per-user read cursor. No pre-Offer/arbitrary messaging.
4. **Carrier flow:** Existing Route management links to Request browsing and a minimum submit/revise form. Server resolves Carrier from the owned Route and rechecks D-065. No client Carrier identity or capacity counter accepted.
5. **Request owner integration:** P07 lists only the owner's persisted Offer set. P08 reads latest terms and immutable history; real accept/decline commands replace fixture-only actions on UUID paths.
6. **Atomic acceptance:** `api.accept_offer` validates live identity/ownership/current terms, revalidates D-005, reserves capacity, inserts immutable agreement/operations, resolves Offers/threads, books Request and appends internal events/audit in one transaction. Same Offer/version retries return Booking ID with `replayed=true`.
7. **Concurrency:** Sorted participant profiles → Request → Carrier → Route → sorted Offers → sorted Conversations → Booking/children. Expected versions, unique constraints, bounded lock/statement timeouts and conditional reservation. Conflicts tell the caller to refresh; no partial-write retry.
8. **Capacity:** One slot per vehicle, exact full count reserved once at acceptance, never on submit/revise. Counter is protected and reconciles with unreleased Booking vehicle counts through deferred constraints. No segment reuse or release command.
9. **Snapshot:** Schema-versioned immutable accepted Request/Offer/Carrier/Route identity, public vehicle locations, price/payment and requested/planned dates. Private operational values are copied separately. B01 renders the accepted snapshot, never mutable profile/request joins.
10. **Competing Offers:** Winning Offer accepted; remaining pending competitors become non-winning. A second winner conflicts; previously terminal decisions remain intact.
11. **Conversation states:** Winner active; losers archived/read-only. Effective expiry/staleness/eligibility/capacity checks prevent sending against stale stored active status. Same thread continues after Booking.
12. **Booking Detail:** Dynamic authenticated `/bookings/[uuid]`, participant RLS and not-found for inaccessible/unknown records; fixture IDs preserved.
13. **Dashboard:** Customer-owned persisted Booking snapshots populate Transports exactly once, suppress active Request duplicates and link to canonical Bookings. Completed Bookings map to History. Configured tab queries never switch to mock data; visual fixtures remain available without Supabase configuration.
14. **RLS/security:** No ordinary direct writes, carrier reassignment, reserved-capacity writes, self-admission or self-verification. Live-session active participant reads; private operations and internal events have no ordinary read projection. D-065 uses existing `identity`/`company` and trusted Auth-confirmed phone, never email/contact/CMR/badge gates.
15. **pgTAP:** 541/541 PASS, including the prior 441 assertions; tested real PostgreSQL client roles and late-failure rollback.
16. **DB validation:** Local reset, lint (no errors), generated types and exact type check PASS.
17. **Unit tests:** Final suite 141/141 PASS, including immutable snapshots, Dashboard lifecycle/tab routing, safe Auth returns and sequence-order regressions.
18. **Browser/concurrency:** Real local managed Auth, browser submit/revise/chat/reload/accept/Booking/capacity/owner isolation/Dashboard PASS. Separate connections test double acceptance, last-slot contention, retry and verification revocation during a wait. Widths 390/768/1280/1440 pass with no overflow/runtime exceptions; screenshots inspected in `.next/phase4-review/`.
19. **Build:** Production build PASS, including lint/types. Booking UUID route explicitly dynamic.
20. **Diff:** `git diff --check` PASS. Working tree intentionally uncommitted.
21. **Deferred:** Operational lifecycle/cancellation, operations gateway, Request edit/close persistence, automatic expiry worker, Notifications/providers, Reviews, payments, realtime, attachments, distribution and full i18n. Real P07 edit/close reports unavailable rather than pretending to save. Effective expired/stale reads/actions are enforced without a worker.
22. **Human review:** PASSED. Explicit human approval locks Phase 4 on 2026-10-04; completed criteria and final Windows records are above.
23. **UI:** Locked public design/layout preserved. Only data/action wiring, truthful persistence copy, participant labels and the minimum Carrier Offer form were added.
24. **Later phases:** None implemented. Internal events are not Notifications persistence or provider delivery.
25. **Supabase:** Local only; no remote login/link/push/project access.
26. **Git:** No commit or push.

## Historical full-suite reproduction (disposable database only)

Do not run these reset/bootstrap commands against the accepted Windows review state. This is the historical full-suite recipe for a separate disposable local database. Run reset → pgTAP before persistent integration fixtures. The existing foundation test suite assumes an empty reset database; running it after browser/concurrency fixtures can fail fixture counts/keys. Reset is destructive only to disposable local review records.

```sh
npm run db:reset
npm run db:test
npm run db:lint
npm run db:types
npm run db:types:check
npm run test:foundation
npm test
npm run build
node tests/marketplace-concurrency.mjs
npm run start -- --hostname 127.0.0.1 --port 3002
# In another terminal:
PHASE4_BASE_URL=http://127.0.0.1:3002 node tests/marketplace-persistence.browser.mjs
git diff --check
```

Browser bootstrap is test-only: it uses local Auth administration to create disposable identities, obtains real managed sessions, and then exercises the UI with ordinary caller cookies. No administrative secret enters application code, screenshots or the review manifest.

## File inventory

Final review fixes also include:

- `scripts/local-phone-auth.mjs` (Windows CLI launch)
- `src/features/carrier/routes/access.tsx` (server diagnostics)
- `src/features/carrier/offers/eligibility.ts`
- `src/app/(public)/login/page.tsx`
- `src/components/layout/login-link.tsx`
- `src/components/layout/public-header.tsx`
- `src/features/public/sign-in/form.tsx`
- `src/lib/auth/validation.ts`
- `src/features/public/booking-detail/view.tsx`
- `src/features/public/dashboard/logic.ts`
- `src/features/public/dashboard/model.ts`
- `src/features/public/dashboard/cards.tsx`
- `tests/auth-foundation.test.mjs`
- `tests/dashboard.test.mjs`

Original transaction implementation inventory:

- `docs/05_DECISIONS_LOG.md`
- `docs/06_BACKEND_FOUNDATION_ARCHITECTURE.md`
- `docs/08_PHASE4_REVIEW.md`
- `docs/CURRENT_STATUS.md`
- `src/app/(public)/bookings/[id]/page.tsx`
- `src/app/(public)/carrier/requests/[id]/page.tsx`
- `src/app/(public)/carrier/requests/page.tsx`
- `src/app/(public)/carrier/routes/page.tsx`
- `src/app/(public)/dashboard/page.tsx`
- `src/app/(public)/messages/[conversationId]/page.tsx`
- `src/app/(public)/messages/page.tsx`
- `src/app/(public)/offers/[id]/page.tsx`
- `src/app/(public)/requests/[id]/page.tsx`
- `src/features/carrier/offers/form.tsx`
- `src/features/public/marketplace-persistence/adapter.ts`
- `src/features/public/marketplace-persistence/client.ts`
- `src/features/public/marketplace-persistence/load.ts`
- `src/features/public/messages/inbox.tsx`
- `src/features/public/messages/logic.ts`
- `src/features/public/messages/thread.tsx`
- `src/features/public/offer-detail/decision-dialog.tsx`
- `src/features/public/offer-detail/view.tsx`
- `src/features/public/request-detail/details.tsx`
- `src/features/public/request-detail/view.tsx`
- `src/lib/supabase/database.types.ts`
- `src/lib/types/conversation.ts`
- `supabase/migrations/20260925000300_offer_conversation_booking.sql`
- `supabase/migrations/20260925000400_transaction_integrity.sql`
- `supabase/migrations/20260925000500_marketplace_commands.sql`
- `supabase/migrations/20260925000600_marketplace_projections.sql`
- `supabase/tests/database/carrier_routes.test.sql`
- `supabase/tests/database/commercial_schema.test.sql`
- `supabase/tests/database/function_ownership.test.sql`
- `supabase/tests/database/marketplace_commands.test.sql`
- `supabase/tests/database/route_commands.test.sql`
- `tests/marketplace-concurrency.mjs`
- `tests/marketplace-local.mjs`
- `tests/marketplace-persistence.browser.mjs`
- `tests/marketplace-persistence.test.mjs`
