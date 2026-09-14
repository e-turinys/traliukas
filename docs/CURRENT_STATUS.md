# Parvezk.lt — Current Status

**Date:** 2026-09-14
**Current phase:** Phase 2 — Request / Offer UI with mock data
**Project status:** P01–P04 are completed, browser-reviewed and locked. P04 remains uncommitted. P05 Create Transport Request is completed, browser-reviewed and ready to commit. Next task: P06 Request Published. P06/backend/auth have not started.

## P05 implementation and overflow correction — 2026-09-14

- Added `/request/new` with a client-side, four-step wizard: Maršrutas, Automobilis, Papildoma informacija, Kontaktai ir matomumas. A typed in-memory draft preserves values/photos on Back/Next; no storage, upload, API or persistence.
- Reuses LocationPicker, DateWindowPicker, Base UI/shadcn fields and Progress. Supports existing `from`, `to`, `dateType`, `date`, `dateFrom`, `dateTo`, `dateFlexible` and P01 `dateOption`; date-only values use existing local-calendar helpers.
- Resolves P03 `visibility`, `targetCarrier` and `targetRoute` against existing mock routes. Targeted defaults remain carrier-only; broadening is explicit. Invalid, unavailable or incompatible targets require an explicit marketplace fallback before handoff. Existing route availability and matching logic are reused.
- Keeps public city-level route fields separate from optional private addresses/contact fields. Vehicle category, make, model and condition are required; rolling capability is required only for non-running vehicles. Optional photos allow up to five JPG/PNG/WebP/HEIC files at 10 MB each, with removal and no actual upload. Optional year accepts 1886 through the current year plus one; category `other` has no equivalent in existing carrier route support and requires marketplace fallback for targeted requests.
- Step validation has associated inline errors and focus management; corrected fields clear their errors. Step 4 requires name, phone, email and terms/privacy acknowledgement, with no marketing consent or email-verification gate. Terms/privacy reuse existing planned destinations in a new tab; these pages are not implemented by P05.
- Final action validates the draft and stops at an informational phone-verification boundary, retaining editable values. It explicitly says verification is unavailable, the request is not published and no code was sent. No U01/U02, P06 success, authentication or backend implemented.
- Browser review URLs: `/request/new`; `/request/new?from=hamburg-de&to=kaunas-lt&dateType=range&dateFrom=2026-09-15&dateTo=2026-09-17`; `/request/new?from=hamburg-de&to=kaunas-lt&dateType=range&dateFrom=2026-09-15&dateTo=2026-09-17&visibility=targeted&targetCarrier=baltijos-kelias&targetRoute=baltijos-kelias-0915`.
- Overflow root causes: hidden `#request-photos` combined shared Input `w-full` with `sr-only` absolute positioning (390px client width produced 747px document width); the desktop Next button also retained full width beside Back. The file input is now a native hidden input triggered by the same visible button; the desktop Next button flexes into remaining space. No global overflow masking or product-logic changes.
- Step 2 checks passed at 390/768/1280/1536px for default, non-running and long-filename states. Document and body scroll widths matched their client widths: 390/753/1265/1521px respectively (desktop client widths exclude the vertical scrollbar). No elements extended beyond the right viewport edge.
- Validation: `npm.cmd run build` and all 25 tests passed (8 P05 and 17 P02–P04 regressions). End-to-end browser checks cover validation/focus, retained fields/photos, removal, targeted defaults/broadening, explicit fallback and the non-publishing handoff at mobile/desktop widths.
- Existing uncommitted P04 work is preserved. P01–P04 remain locked. P05 final browser review passed; P05 is completed, browser-reviewed and ready to commit. P06/backend/auth have not started. No commit or push performed.

## P04 implementation — 2026-09-13

- Final review corrections: removed the unavailable save action and hint; added RouteCard `context="profile"` to omit repeated carrier identity/trust while retaining route details and an accessible route heading; removed `/ 5` from the review summary while keeping its Star icon. P02 card defaults and all profile eligibility/data logic are unchanged. All 17 existing P04/P03/P02 tests passed again.
- Added `/carriers/[id]` with stable carrier-ID lookup, metadata and a Lithuanian Next.js not-found screen. The profile type extends the existing route carrier identity; existing route/review fixtures and P01–P03 behavior are preserved.
- Profile header reuses CarrierTrust. Verification displays only the existing aggregate approved status; no invented identity/company/document breakdown or private contact data.
- Added short public descriptions. Existing carriers' service countries derive from their route stops; their registration country is omitted because it is unknown. Added only `aukstaitijos-transportas`, a profile without routes, to cover the empty state without fabricating supply.
- Active routes reuse P03 availability (positive capacity, accepting requests, end date not before today in Europe/Vilnius), sorted by start date. RouteCard now accepts an omitted match level for profiles; P02 continues to pass its existing match labels unchanged.
- Primary action leads to active routes, or `/request/new` when none exist. The empty state also offers the request fallback. The unavailable save action and its hint were removed during final review; no authentication or persistence.
- Reviews reuse only completed-transport fixtures, newest first, with accessible stars and localized dates. Existing aggregate reputation remains unchanged; the latest-review list uses the available previews (up to six). No fabricated remaining reviews, infinite scroll or moderation tools.
- Validation: production build passed; 17 tests passed (4 P04 lookup/filter/review checks and 13 P02/P03 regressions). Production browser checks passed at 390px and 1280px for verified, new, route-free and unknown profiles: HTTP 200/404, CTA destinations, no horizontal overflow, 44px link targets, and no runtime/console errors. Mobile/desktop screenshots inspected.
- P04 final browser review passed. P04 is completed, browser-reviewed, locked and ready to commit. P01/P02/P03 are locked. At P04 completion, P05/backend had not started. No packages, maps, contact actions, messaging, auth or backend added. No commit or push performed in this P04 session.

## P03 final polish — 2026-09-13

- Removed the public demonstration-data notice. Mock data remains internal. Route-stop country names now use a reusable Lithuanian display helper (Vokietija, Lenkija, Lietuva, Nyderlandai); canonical location values are unchanged.
- Preserved existing uncommitted P03 work, route hierarchy, dates, capacity, timeline structure, compatibility, trust/reviews, sticky CTA and request URL behavior. No P04/P05, backend, maps, auth or new functionality.
- Production build passed after stopping the concurrent development server that was conflicting with generated `.next` output. All 13 existing focused tests passed (5 P03 and 8 P02 regressions).
- Mobile browser and production HTTP checks verified `baltijos-kelias-0915` (verified, 3 spaces), `baltijos-kelias-0920-full` (full, marketplace fallback), `manto-transportas-0917` (new carrier, no reviews), and `unknown-p03-route` (HTTP 404). Also checked `vakaru-kryptis-0918` for Nyderlandai display.
- The reported “1 Issue” could not be reproduced in a fresh mobile development session: the Next.js indicator had `data-error=false`, no issue count, and no runtime exceptions or browser audit issues were captured. The original warning's cause remains unconfirmed; no speculative application or tooling changes were made.
- Development server restored on port 3000. Diff reviewed for unrelated changes. P03 final browser review passed. P03 is now locked and committed as `26504ed` (`Complete P03 carrier route detail`).

## P03 implementation — 2026-09-12

- Added `/routes/[id]`, resolving the existing mock route dataset with Next.js `notFound()` for unknown IDs and a Lithuanian not-found screen.
- Route endpoints, stops, localized date window and available spaces precede carrier trust details. An ordered stop timeline represents the planned route without a map or GPS.
- “Ką gali vežti” uses existing supported categories and explicitly states non-running capability. Dates reuse `formatDateRange`; ISO date-only values are preserved.
- Added stable `carrier.id` values to the existing route model for profile/targeting links. No second route model was introduced. Added `baltijos-kelias-0920-full` as a full-route fixture; P02's existing capacity filter excludes it.
- Available routes lead to `/request/new` with `visibility=targeted`, `targetCarrier`, `targetRoute`, existing location-ID parameters `from`/`to`, and the existing single/range date contract. These additive frontend prefill names are the P03-to-P05 handoff assumption; P05 must resolve/validate context rather than trust URL eligibility.
- Full, expired or closed-to-new-request routes omit targeted actions and offer a marketplace Request fallback with route places/dates preserved and no target IDs.
- Mobile has a sticky bottom quote action with content clearance and safe-area padding; desktop has a sticky carrier/CTA card. No login gate was added.
- Carrier trust uses only existing verification/reputation fields. Two fictional completed-transport review previews are shown per reviewed carrier; the original demonstration-data notice was removed during final polish. New carriers show no fabricated rating/reviews. Profile links target `/carriers/[carrier-id]`; P04 was not yet implemented at P03 completion.
- Save-carrier persistence is deferred. P01/P02 presentation, matching, filters, URL handling, header/footer and date formatter remain unchanged. No packages, maps, auth, P04/P05 or backend were added.
- Validation: `npm.cmd run build` and standalone lint passed; 13 focused tests passed (8 P02 regressions and 5 P03 lookup/formatting checks). Production HTTP checks passed for available, full, new-carrier and non-running-incompatible routes, plus an HTTP 404 for an unknown ID.
- P03 final browser review passed on 2026-09-13. P03 is locked and committed as `26504ed` (`Complete P03 carrier route detail`).

## P02 implementation — 2026-09-12

- Added `/search` with an inline search editor reusing LocationPicker and DateWindowPicker. Missing/unknown locations, identical locations and malformed dates require correction before results appear.
- Search, date, verification, rating, vehicle category, non-running filters and sort persist in the URL; browser Back/Forward restores applied criteria. Mobile filters use the existing Base UI Sheet.
- P02 accepts both `dateFlexible` and P01's existing `dateOption`; revised P02 dates use `dateFlexible`. Request fallback preserves incoming From/To/date parameters. Calendar dates use local fields without UTC conversion.
- Six fictional route fixtures reuse LocationOption and fixed September 15–24, 2026 dates. Available spaces derive from total minus reserved capacity. Demonstration data is identified in the UI; routes have no prices.
- Deterministic mock matching checks ordered stops, date overlap, capacity and filters. Exact matches and same-pickup/different-delivery-city alternatives appear separately. Match levels are derived per search rather than fixed carrier scores.
- Flexible mock windows mean today through the next 7/14 days or the end of this month, using the Lithuanian calendar. This is a UI-phase assumption, not a new backend matching contract.
- Desktop uses approximately 45% list / 55% map placeholder. Mobile defaults to List with a Map toggle. No map provider, pins or GPS data were added.
- Added reusable RouteCard, MatchBadge, skeleton, empty and error states, with a Next.js loading/error boundary and simple “Rodyti daugiau” batches when needed.
- At P02 completion, P03, request creation, backend, authentication and maps remained unimplemented. No package changes or locked product changes.
- Validation: production build passed. Focused query/matching tests cover alias compatibility, invalid inputs, date-safe serialization, request fallback, direction, date overlap, filters, capacity and sorting; run with Node 24 using `node --test tests/search.test.mjs`.
- P02 browser review passed successfully after the presentation corrections. P02 is locked and committed as `3dc823b` (`Complete P02 carrier search results`).

## P01 implementation — 2026-09-11

- Replaced starter content with the Lithuanian hero, HomeSearch, trust/value section, three steps and carrier CTA using the existing public layout and PageContainer.
- HomeSearch reuses LocationPicker and DateWindowPicker; both actions require distinct selected locations, show associated errors and focus the first invalid control.
- Both destinations preserve the same query contract: `from` and `to` are existing location IDs; optional dates use `dateType=single&date=YYYY-MM-DD`, `dateType=range&dateFrom=YYYY-MM-DD&dateTo=YYYY-MM-DD`, or `dateType=flexible&dateOption=...`.
- Dates serialize using local calendar fields, without UTC conversion. Empty date selections mean anytime; a started range requires an end date.
- Picker changes add accessible descriptions/required state, larger input triggers, and Lithuanian calendar labels. Base UI `render` composition is retained.
- Validation: production build and standalone lint passed using `npm.cmd run build` and `npm.cmd run lint` (PowerShell blocks the npm.ps1 launcher).
- P01 browser review corrections completed: global Geist token mapping, locked labels/helper copy, disabled search until distinct selected locations, and stacked mobile CTAs.
- P01 completed/reviewed and committed as `28b82f4` (`Complete P01 home experience`), pushed to `main`.
- `/search` is now implemented by P02; `/request/new` and `/carrier` remain planned destinations. No locked product rules changed.

## Completed

- Product concept and V1 marketplace logic reviewed multiple times.
- Public/Customer flow locked: P01–P10.
- Carrier flow locked: C01–C15.
- Booking flow locked: B01–B07.
- Account flow locked: U01–U05.
- Messages locked: M01.
- Notifications locked: N01.
- Admin flow locked: A01–A11.
- Cross-screen edge cases reviewed.
- Booking snapshot/versioning/capacity rules locked.
- Frontend design system selected: shadcn/ui + Tailwind.
- Implementation architecture and phased plan defined.
- Next.js 15 deployment to Hostinger is already working.

## Locked frontend stack

- Next.js 15.5.25
- TypeScript
- Tailwind CSS
- shadcn/ui
- Base UI/shadcn primitives
- Lucide icons
- React Hook Form + Zod
- TanStack Table for Admin
- Sonner
- mobile-first Customer/Carrier
- desktop-first Admin
- i18n-ready from the beginning

## Current infrastructure

- Live domain: `parvezk.lt`
- GitHub repo: `https://github.com/e-turinys/traliukas.git`
- Branch: `main`
- Local path: `C:\Projects\traliukas`
- GitHub → Hostinger auto-deploy: working
- Supabase: not connected yet
- shadcn/ui: configured with Base UI, Nova preset and neutral tokens
- Real product UI: public layout, shared pickers, P01 Home, P02 mock Search Results, P03 mock Carrier Route Detail P04 mock Carrier Public Profile and P05 mock Create Transport Request implemented

## Immediate next task

Next task: **P06 Request Published**. P01–P04 are locked. P05 Create Transport Request is completed, browser-reviewed and ready to commit. P06/backend/auth have not started. Publication still requires phone verification.

## Next after Phase 0 foundation

P01–P04 are completed, browser-reviewed and locked; P04 remains ready to commit. P05 is completed, browser-reviewed and ready to commit. P06/backend/auth have not started.

Then:

- P06 Request Published (publication still requires phone verification)

Do not start the full Supabase/backend implementation before reviewing these first real UI screens in desktop and mobile layouts unless a required UI decision cannot be made without backend work.

## Do not reopen without a blocker

The following are already locked and should not be casually redesigned during implementation:

- one User can be customer + carrier;
- search works without registration;
- phone OTP required to publish customer Request;
- Carrier Offer requires required verification;
- Route has no price;
- Offer requires a Route;
- Offer does not reserve capacity;
- accepted Offer creates Booking atomically;
- Booking has immutable agreement snapshot;
- Request/Route/Offer versioning prevents stale acceptance;
- targeted vs marketplace Request visibility;
- city-level public location vs private operational address;
- one active pending Offer per carrier + Request;
- normal cancellation only before Vehicle Collected;
- Delivered is not Completed;
- reviews only after Completed Booking;
- no public customer rating in V1;
- lifecycle is separate from moderation;
- no hard-delete in normal workflows;
- no payments/commission/escrow/live GPS/native app in V1;
- shadcn/ui + Tailwind is the UI standard;
- Map is supplemental, List is primary.

## End-of-session rule

Before stopping work for the day:

1. update this file with what was completed;
2. set one explicit “Immediate next task”;
3. update canonical docs if a locked rule changed;
4. add important changes to `05_DECISIONS_LOG.md`;
5. commit docs with code when practical.

## Recommended Codex start prompt

> Read `docs/CURRENT_STATUS.md`, `docs/01_V1_PRODUCT_BLUEPRINT.md`, `docs/03_TECHNICAL_ARCHITECTURE.md`, and the relevant screen section in `docs/02_V1_SCREEN_MAP.md`. Implement only the Immediate next task from CURRENT_STATUS. Do not change locked product rules unless explicitly instructed. Keep the existing Next.js 15 Hostinger build working and run the project build before finishing.
