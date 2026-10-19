# Phase 5 — Booking Operational Lifecycle

Status: **IN REVIEW**. Human review is required before LOCKED. Implementation order was corrected by human approval on 2026-10-04 (D-066); the historical Carrier Marketplace roadmap remains recorded. Phase 4 acceptance, immutable agreement creation and reservation semantics are unchanged.

## Persisted operations and authorization

| Current state | Only permitted next stage | Actor |
|---|---|---|
| Booked | PickupScheduled | Selected Carrier's active owner |
| PickupScheduled | Collected | Selected Carrier's active owner |
| Collected | InTransit | Selected Carrier's active owner |
| InTransit | Delivered | Selected Carrier's active owner |
| Delivered | Completed | Booking Customer |

One aggregate stage covers every vehicle. No skips/backwards transitions. Suspended/deleted users, stale sessions, suspended Carriers and unrelated parties cannot operate a Booking. Expired new-Offer verification/beta eligibility does not strand an existing commitment; new Offers and Routes retain their existing admission rules.

`api.transition_booking` authenticates the live caller, locks the Request → Carrier → Route → Conversation → Booking in existing transaction order after the caller profile, validates role/current state/version, and writes the stage, append-only receipt, audit and system event atomically. Scheduling requires each snapshot vehicle's private pickup street, contact name, E.164 phone and ordered start/end instants. The form accepts device-local time and the saved detail explicitly displays UTC. Operational data is separate from the immutable agreement; there are no per-vehicle stages. `api.booking_pickups` is a participant-only audited gateway; no ordinary-client direct operations-table grant exists.

Exact retries at the resulting version return the canonical state without duplicate events/capacity writes. Changed payloads, different actors and retries after later progression conflict and require reload. Commands retain the narrow non-login, non-BYPASSRLS owner. No service role is used in the browser.

## Cancellation, capacity and Conversation

Customer or selected Carrier owner may call `api.cancel_booking` only while Booked/PickupScheduled, with a reason. It atomically marks the existing `cancelled` terminal exception, records actor/reason/timestamps/audit, closes the Request (including `closed_at`), archives the Conversation and releases exactly `vehicle_count`. A receipt prevents double release. A forced late event failure rolls all writes back. Cancellation is not a seventh timeline stage. After collection, self-service cancellation is rejected; exceptions require manual support.

Normal stages, including Completed, retain reserved capacity. Completion marks the Request completed and Conversation historical/read-only. Cancelled chat is archived/read-only. Existing text history stays accessible; terminal message sends are rejected in PostgreSQL.

Customer Dashboard shows active Bookings only in **Pervežimai**, Completed/cancelled only in **Istorija**, using snapshot route/count/Carrier and the canonical `/bookings/[id]` link. No duplicate Request/Booking across tabs. All six Lithuanian status labels and singular/plural Collected wording remain unchanged.

## Local human review

The requested local reset replaced the old Phase 4 database records; historical Phase 4 review IDs remain in its lock document. These are newly accepted real €1,000 agreements, each with Volkswagen Golf Hamburg → Kaunas and Toyota Corolla Berlin → Kaunas. Each compatible Route is Hamburg → Berlin → Kaunas, capacity **2 total / 2 reserved / 0 available**. Separate automation agreements were consumed by browser tests; the following two remain Booked for human review.

| Scenario | Booking | Route | Conversation |
|---|---|---|---|
| Normal lifecycle | `14387c8f-1992-4f6d-85ec-c5a6a8cb60c1` | `fce08779-16dd-41a3-892a-2c229d76a5a9` | `f1335771-6278-48a0-94e8-dceca7344def` |
| Cancellation | `e4e16da6-19f9-4c9c-8ffc-c552581bb775` | `cb8df947-218a-49b5-8361-0a08bebcaa9d` | `2b1d8d15-cab2-4bc5-bae2-5e12aeeeebd8` |

Use separate browser profiles for Carrier and Customer. Clear old localhost/127.0.0.1 site cookies after the reset, then consistently use **http://127.0.0.1:3000**.

Carrier **+37065603638**, Bash from `/home/cv95/Projects/traliukas`:

```bash
PARVEZK_TEST_PHONE=37065603638 node scripts/local-phone-auth.mjs
cat supabase/.temp/local-phone-auth.json
```

Open http://127.0.0.1:3000/login?returnTo=%2Fcarrier%2Fbookings and complete phone OTP with the locally printed code. The existing helper restarts local Supabase without resetting data and restores tracked configuration. It enables one test number at a time; keep the Carrier browser signed in while configuring Customer.

Customer **+37062557545**, separate browser profile:

```bash
PARVEZK_TEST_PHONE=37062557545 node scripts/local-phone-auth.mjs
cat supabase/.temp/local-phone-auth.json
```

Open http://127.0.0.1:3000/login?returnTo=%2Fbookings%2F14387c8f-1992-4f6d-85ec-c5a6a8cb60c1 and complete OTP. No Request creation is required.

1. Carrier opens http://127.0.0.1:3000/bookings/14387c8f-1992-4f6d-85ec-c5a6a8cb60c1 (also linked from `/carrier/bookings`). Enter agreed pickup address/contact/phone/window for **both** vehicles; choose **Suplanuoti paėmimą**. Verify **Paėmimas suplanuotas** and reload.
2. Carrier chooses **Pažymėti paėmimą**, **Pradėti vežimą**, **Pažymėti pristatymą** in order. Observe **Automobiliai paimti → Vežama → Pristatyta**. Cancellation disappears after collection. Carrier cannot confirm receipt.
3. Customer reloads the same Booking and chooses **Patvirtinti, kad automobiliai gauti**, then **Patvirtinti gavimą**. Verify **Pervežimas užbaigtas**, the six-stage timeline and reload persistence.
4. At http://127.0.0.1:3000/dashboard?tab=history the Booking appears exactly once, absent from active Requests and Transports, and links back to itself. At http://127.0.0.1:3000/messages/f1335771-6278-48a0-94e8-dceca7344def history is readable and sending unavailable. Lifecycle Route capacity remains **2 / 2 / 0**, including after completion.
5. Open http://127.0.0.1:3000/bookings/e4e16da6-19f9-4c9c-8ffc-c552581bb775 as either participant. Optionally schedule pickup first; do not mark Collected. Choose **Atšaukti pervežimą**, enter a reason and **Patvirtinti atšaukimą**. Reload: terminal cancellation persists; chat is read-only; Dashboard contains only the historical Booking. Its Route http://127.0.0.1:3000/carrier/routes/cb8df947-218a-49b5-8361-0a08bebcaa9d changes from **2 / 2 / 0** to **2 / 0 / 2** exactly once.
6. Review new controls at **390, 768, 1280, 1440**. Existing Booking layout, public UI and multi-location summary rules are preserved.

`node scripts/prepare-phase5-review.mjs` creates these scenarios through managed local Auth, the existing trusted test bootstrap and real publication/Offer/acceptance commands after a reset. Its ignored `supabase/.temp/phase5-review.json` manifest contains IDs only, no Auth credentials. A repeat with the existing manifest preserves progressed review state. IDs change after an explicit database reset; use the newly printed manifest then. It does not reset or contact remote Supabase itself.

## Linux revalidation — 2026-10-06

Resumed the clean `wip/phase5-booking-lifecycle` tree at `c66e112`; retained the transferred implementation. Ran `npm run db:reset` against local Supabase only: all 11 migrations applied from zero. Then passed `db:test` (636 assertions across 8 files, including 80 lifecycle), `db:lint`, `db:types`, `db:types:check`, `test:foundation` (6/6), `npm test` (143/143), `npm run build` (including lint/type checks), and `git diff --check`. Generated types did not change.

The four Phase 5 concurrency scenarios and all three existing Phase 4 transaction concurrency scenarios passed. The existing review bootstrap recreated its four scenarios; the browser test consumed only the two automation Bookings. The real two-party browser flow, completion, cancellation, reload, History, read-only Chat and capacity checks passed at 390/768/1280/1440 with no runtime exceptions or horizontal overflow. Mobile scheduling and desktop Carrier list screenshots were also inspected. Human Bookings above remain Booked, each at 2 total / 2 reserved / 0 available.

The only test-code correction in this continuation is portable Chrome selection in `tests/booking-lifecycle.browser.mjs`: platform default or `CHROME_PATH`, preserving the Windows default. No product code or migrations changed. The installed Next.js 15.5.25 package does not contain the `dist/docs/` directory referenced by AGENTS.md; no Next.js implementation edits were needed. The existing local app serves port 3000.

No implementation blocker was found in this validation. Human acceptance is still required; Phase 5 is not LOCKED. Phase 4 migrations/acceptance commands are unchanged, and Phase 4 remains LOCKED. No Phase 6, remote Supabase access, commit or push.

## Booking Detail UX correction — 2026-10-06

Human review requested a presentation-only simplification. `/bookings/[id]` now uses role-aware wording and a single-column section order. Customer: summary → timeline → selected Carrier and price/payment → next Customer action → vehicles/pickups → agreed dates → Chat. Carrier: summary/order reference → timeline → next operational action → vehicles/pickups → agreed price/payment/dates → Chat. No Customer name is invented; the existing Booking reference provides order context.

Removed the duplicate Chat CTA, hero price, repeated Carrier identity/sidebar, repeated vehicle cities and separate pickup summary cards. Saved pickup information appears with its vehicle. Carrier scheduling retains every required field in compact per-vehicle groups, with only the current stage action; cancellation stays secondary. Customer sees its existing cancellation option, never Carrier progression controls. There is one Chat link at the bottom and one price/payment section per role.

Validation: `npm test` **143/143 PASS**, `npm run build` **PASS** (lint/types included), `git diff --check` **PASS**. Read-only browser checks passed for both roles across the four existing Bookings at **390/768/1280/1440**, checking one Chat link, one price/payment section, role-specific identity and no overflow/runtime exceptions. Screenshots inspected; artifacts are in ignored `supabase/.temp/phase5-ux-screens/`. No review Booking was progressed or reset. Lifecycle tests were not modified in this UX pass.

This correction changes only Booking presentation; command handlers, lifecycle, authorization, cancellation/capacity rules, database/RLS, immutable snapshots, Conversation, Dashboard and Phase 4 behavior remain unchanged. Phase 5 stays IN REVIEW pending another human review.

## Carrier Bookings views — 2026-10-06

Human review requested separation of current work from history. `/carrier/bookings` defaults to **Aktyvūs pervežimai** (Booked, PickupScheduled, Collected, InTransit, Delivered); `/carrier/bookings?tab=history` shows **Istorija** (Completed, Cancelled). The views partition the same participant-scoped persisted data with one terminal-status predicate; no Booking appears in both. Existing Booking links and ordering are preserved. Both views have simple empty states and reloadable navigation.

Validation: `npm test` **143/143 PASS**, production build **PASS**, `git diff --check` **PASS**. Read-only browser checks verified real Carrier and Customer placement, no duplicates, tab navigation/reload, both empty states and no overflow at 390/768/1280/1440. Mobile screenshots inspected; ignored artifacts: `supabase/.temp/phase5-tabs-screens/`. Customer active Bookings remain in Pervežimai and Completed/Cancelled in Istorija. No review state changed, and no lifecycle/cancellation tests were edited. Only the Carrier list presentation changed in this correction; backend, lifecycle, RLS, capacity, snapshots and Phase 4 remain unchanged. Phase 5 is still IN REVIEW; no commit, push or Phase 6.

## Global header Auth correction — 2026-10-06

Root cause: PublicHeader rendered LoginLink unconditionally in both desktop and mobile navigation. It never consulted Supabase Auth, even when page loaders independently validated a session and loaded owned Bookings.

PublicHeader now reads the existing browser Supabase client with `auth.getUser()` and resolves Carrier ownership through the existing RLS-protected `api.my_carriers` view. Anonymous visitors see Prisijungti; Customers see Mano užklausos → `/dashboard`; Carrier owners see Mano pervežimai → `/carrier/bookings`. Both authenticated roles have Atsijungti. No duplicated credentials/session storage or new authorization model. A neutral loading state avoids falsely claiming the visitor is anonymous before Auth resolves. Navigation, Auth events and window focus refresh the displayed state; obsolete responses are ignored. Existing controls and mobile Sheet styling remain.

Logout uses managed `auth.signOut({ scope: "local" })`, then replaces the route with `/` and refreshes the router. Failure reports an error rather than claiming success. The shared public layout does not acquire server cookie reads or per-user server caching; `/` and `/carrier` remain static in the build output.

Validation: `npm test` **143/143 PASS**, `npm run build` **PASS**, `git diff --check` **PASS**. New `tests/header-auth.browser.mjs` passed anonymous/Customer/Carrier desktop (1440) and mobile (390) checks, account-link navigation and mobile-sheet closure, Customer desktop logout, Carrier mobile logout, cleared Auth cookies and private Booking isolation after logout. No runtime exceptions or overflow; settled mobile and desktop screenshots inspected under ignored `supabase/.temp/header-auth-screens/`. Uses new local test sessions only; no Booking state changes or remote access. Phase 5 remains IN REVIEW; no lifecycle/business logic, Phase 6, commit or push.

## Validation and changed areas

- Forward migration: `20261004000100_booking_lifecycle.sql`; no Phase 1–4 migration edits. Existing Booking columns/model retained; new append-only `booking_actions` retry receipts, three narrow RPCs, event/audit allowlist extensions and caller/version view metadata.
- App: Booking type/adapter/loader, existing Booking completion dialog/timeline/status view, minimal `operations.tsx`, `/carrier/bookings` list and Routes link, Dashboard cancellation placement, explicit login return allowlist for the new page. Accepted agreement content/UI is unchanged.
- Local tooling: `database-types.mjs` invokes the installed CLI with Node on Windows; safe local review bootstrap; generated database types.
- Tests: lifecycle pgTAP, command owner/EXECUTE allowlist, independent-connection concurrency, real-browser role flow and widths, existing Booking/Dashboard/Auth unit regressions.
- Local reset/migrations passed. **636 pgTAP assertions**, including **80 lifecycle assertions**, passed. Four concurrent scenarios passed: identical cancel retries, Customer/Carrier competing cancels, identical scheduling retries, collection racing cancellation.
- DB lint: no schema errors. Generated types/check: passed. Foundation: **6/6**. Application tests: **143/143**. Production build and `git diff --check`: passed.
- Browser: real Carrier → Delivered, Customer → Completed, refresh/History/read-only chat; cancellation/release; separate sessions; new controls at four widths. Screenshots are ignored local artifacts under `supabase/.temp/phase5-screens/`.
- Browser validation found that cancellation could commit while the page remained stale. Controls now immediately apply the RPC's validated canonical Booking ID/status/version and then refresh server data; the complete rerun passed. No optimistic state transition precedes database success.

Phase 4 remains LOCKED. Phase 5 awaits human review; do not mark LOCKED. Realtime/websockets, attachments/read receipts, Notifications persistence/provider delivery, Reviews persistence, payments/escrow, Route Distribution, full i18n and Carrier staff accounts remain deferred. No remote Supabase access, commit or push.
