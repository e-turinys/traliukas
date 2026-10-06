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
| Normal lifecycle | `f6a9d4fd-d69b-4d7b-a2fa-d469096d3d2f` | `ce6c6465-3e3d-4c11-a313-2195b45e508d` | `d7299beb-ee30-4ec5-8364-1138c48b2114` |
| Cancellation | `42863b3c-74be-42a9-8532-9f409350aa5b` | `dba931be-ae1c-4053-80bc-7dc9fe5d1f7e` | `ad8fd53d-5c73-4ef9-9849-07ba5d106fd8` |

Use separate browser profiles for Carrier and Customer. Clear old localhost/127.0.0.1 site cookies after the reset, then consistently use **http://127.0.0.1:3000**.

Carrier **+37065603638**, PowerShell from `C:\Projects\traliukas`:

```powershell
$env:PARVEZK_TEST_PHONE = '37065603638'
node scripts/local-phone-auth.mjs
Get-Content supabase/.temp/local-phone-auth.json
```

Open http://127.0.0.1:3000/login?returnTo=%2Fcarrier%2Fbookings and complete phone OTP with the locally printed code. The existing helper restarts local Supabase without resetting data and restores tracked configuration. It enables one test number at a time; keep the Carrier browser signed in while configuring Customer.

Customer **+37062557545**, separate browser profile:

```powershell
$env:PARVEZK_TEST_PHONE = '37062557545'
node scripts/local-phone-auth.mjs
Get-Content supabase/.temp/local-phone-auth.json
```

Open http://127.0.0.1:3000/login?returnTo=%2Fbookings%2Ff6a9d4fd-d69b-4d7b-a2fa-d469096d3d2f and complete OTP. No Request creation is required.

1. Carrier opens http://127.0.0.1:3000/bookings/f6a9d4fd-d69b-4d7b-a2fa-d469096d3d2f (also linked from `/carrier/bookings`). Enter agreed pickup address/contact/phone/window for **both** vehicles; choose **Suplanuoti paėmimą**. Verify **Paėmimas suplanuotas** and reload.
2. Carrier chooses **Pažymėti paėmimą**, **Pradėti vežimą**, **Pažymėti pristatymą** in order. Observe **Automobiliai paimti → Vežama → Pristatyta**. Cancellation disappears after collection. Carrier cannot confirm receipt.
3. Customer reloads the same Booking and chooses **Patvirtinti, kad automobiliai gauti**, then **Patvirtinti gavimą**. Verify **Pervežimas užbaigtas**, the six-stage timeline and reload persistence.
4. At http://127.0.0.1:3000/dashboard?tab=history the Booking appears exactly once, absent from active Requests and Transports, and links back to itself. At http://127.0.0.1:3000/messages/d7299beb-ee30-4ec5-8364-1138c48b2114 history is readable and sending unavailable. Lifecycle Route capacity remains **2 / 2 / 0**, including after completion.
5. Open http://127.0.0.1:3000/bookings/42863b3c-74be-42a9-8532-9f409350aa5b as either participant. Optionally schedule pickup first; do not mark Collected. Choose **Atšaukti pervežimą**, enter a reason and **Patvirtinti atšaukimą**. Reload: terminal cancellation persists; chat is read-only; Dashboard contains only the historical Booking. Its Route http://127.0.0.1:3000/carrier/routes/dba931be-ae1c-4053-80bc-7dc9fe5d1f7e changes from **2 / 2 / 0** to **2 / 0 / 2** exactly once.
6. Review new controls at **390, 768, 1280, 1440**. Existing Booking layout, public UI and multi-location summary rules are preserved.

`node scripts/prepare-phase5-review.mjs` creates these scenarios through managed local Auth, the existing trusted test bootstrap and real publication/Offer/acceptance commands after a reset. Its ignored `supabase/.temp/phase5-review.json` manifest contains IDs only, no Auth credentials. A repeat with the existing manifest preserves progressed review state. IDs change after an explicit database reset; use the newly printed manifest then. It does not reset or contact remote Supabase itself.

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
