# Phase 4 human review

Phase 4 — Offer / Conversation / Booking Transaction = **IN REVIEW**, not LOCKED. Local production app: http://127.0.0.1:3002. These are disposable local test identities and records, not real verification decisions for production users.

## Review entry

Use separate browser profiles for Carrier and Customer. Existing local phone Auth tooling configures one test number at a time; switching its map does not require recreating the database. Do not run `db:reset` before reviewing these records.

1. For Carrier, run `PARVEZK_TEST_PHONE=37065603638 node scripts/local-phone-auth.mjs`. Read the generated OTP from ignored `supabase/.temp/local-phone-auth.json` locally. Open http://127.0.0.1:3002/carrier/routes in a fresh browser profile and sign in with `+37065603638` and that OTP.
2. For Customer, run `PARVEZK_TEST_PHONE=37062557545 node scripts/local-phone-auth.mjs`. In a second browser profile use the same sign-in form with `+37062557545` and the newly generated OTP, then navigate to the Customer URLs below. The Customer has no Carrier membership; the Carrier access notice after sign-in does not block the Customer's own Dashboard/Request/Chat.
3. The browser bootstrap has already admitted these local test accounts and created the applicable reviewed identity records through trusted local SQL. No browser service key or self-verification endpoint is provided. No further policy decision is needed for this review.

## Exact current URLs

| Screen | URL |
|---|---|
| Carrier Request list | http://127.0.0.1:3002/carrier/requests |
| Fresh Carrier Offer form | http://127.0.0.1:3002/carrier/requests/56cda6c8-51bc-47ed-985a-482ecd937e5c |
| Fresh Customer Request | http://127.0.0.1:3002/requests/56cda6c8-51bc-47ed-985a-482ecd937e5c |
| Available review Route | http://127.0.0.1:3002/routes/2a1e7d0e-5ec2-4d1e-b646-560d4a87bb9b |
| Already booked Request | http://127.0.0.1:3002/requests/05f765b8-6ed7-43d2-b3f5-73864ff402cc |
| Accepted Offer | http://127.0.0.1:3002/offers/1872741d-42a9-447a-a0ff-ec9264da628c |
| Losing Offer (Customer) | http://127.0.0.1:3002/offers/8dcf1f15-c469-4422-915d-0c0414edff90 |
| Winning Conversation | http://127.0.0.1:3002/messages/6ef6ed36-3c71-460d-a32a-81622aff5406 |
| Losing Conversation (Customer) | http://127.0.0.1:3002/messages/be13a498-0b09-4e21-9605-1f2a0cc65ca5 |
| Real Booking snapshot | http://127.0.0.1:3002/bookings/db30e422-a536-4f06-bb98-745945b82c71 |
| Inbox | http://127.0.0.1:3002/messages |
| Dashboard → Pervežimai | http://127.0.0.1:3002/dashboard |
| Reserved/full Route | http://127.0.0.1:3002/routes/25924655-e007-4029-af98-9c258f803a67 |

For a fresh transaction, select the available review Route in the Carrier form. Supply a total EUR price, pickup/delivery within the Route dates, payment terms and validity strictly before the pickup day's start in the pickup locality. Submit, reload, revise from the same Request form, then open the Customer Request. Exchange messages, accept from Offer Detail and reload the resulting Booking. Verify two reserved slots, Request under Dashboard Transports, continued winning Chat and read-only losing history in the already-booked example.

The full Route and fresh available Route coexist deliberately. The original completed browser scenario remains inspectable, while the open Request/available Route allow a new human transaction. Local IDs and test phones are also in ignored `supabase/.temp/phase4-review.json`; rerunning the browser test creates a fresh manifest.

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
13. **Dashboard:** Real booked Request moves to Transports and links to persisted Booking. Explicit fixture views remain available.
14. **RLS/security:** No ordinary direct writes, carrier reassignment, reserved-capacity writes, self-admission or self-verification. Live-session active participant reads; private operations and internal events have no ordinary read projection. D-065 uses existing `identity`/`company` and trusted Auth-confirmed phone, never email/contact/CMR/badge gates.
15. **pgTAP:** 541/541 PASS, including the prior 441 assertions; tested real PostgreSQL client roles and late-failure rollback.
16. **DB validation:** Local reset, lint (no errors), generated types and exact type check PASS.
17. **Unit tests:** Foundation PASS; 19/19 test files PASS, including immutable snapshot adapter and sequence-order regression tests.
18. **Browser/concurrency:** Real local managed Auth, browser submit/revise/chat/reload/accept/Booking/capacity/owner isolation/Dashboard PASS. Separate connections test double acceptance, last-slot contention, retry and verification revocation during a wait. Widths 390/768/1280/1440 pass with no overflow/runtime exceptions; screenshots inspected in `.next/phase4-review/`.
19. **Build:** Production build PASS, including lint/types. Booking UUID route explicitly dynamic.
20. **Diff:** `git diff --check` PASS. Working tree intentionally uncommitted.
21. **Deferred:** Operational lifecycle/cancellation, operations gateway, Request edit/close persistence, automatic expiry worker, Notifications/providers, Reviews, payments, realtime, attachments, distribution and full i18n. Real P07 edit/close reports unavailable rather than pretending to save. Effective expired/stale reads/actions are enforced without a worker.
22. **Human review:** Use the local URLs and phone-entry steps above. Approve/reject Phase 4; it is not LOCKED.
23. **UI:** Locked public design/layout preserved. Only data/action wiring, truthful persistence copy, participant labels and the minimum Carrier Offer form were added.
24. **Later phases:** None implemented. Internal events are not Notifications persistence or provider delivery.
25. **Supabase:** Local only; no remote login/link/push/project access.
26. **Git:** No commit or push.

## Reproduce validation

Run reset → pgTAP before persistent integration fixtures. The existing foundation test suite assumes an empty reset database; running it after browser/concurrency fixtures can fail fixture counts/keys. Reset is destructive only to disposable local review records.

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
