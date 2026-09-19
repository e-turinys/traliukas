# Parvezk.lt — Current Status

**Date:** 2026-09-19
**P01 High-Fidelity = LOCKED.** Human desktop and mobile browser review passed. The current responsive P01 browser implementation is the approved V1 visual baseline and the visual reference for P02/P03. P01 search behavior remains locked and unchanged.
**P02 High-Fidelity = LOCKED.** Human desktop and mobile browser review passed. Its responsive search-results implementation is the V1 visual reference for future results/discovery screens under D-052. P01 remains LOCKED and unchanged.
**P03 High-Fidelity = LOCKED.** Human desktop and mobile browser review passed. Its route-detail patterns are part of the V1 visual baseline under D-053. P01/P02 remain LOCKED and unchanged.
**P04 High-Fidelity = LOCKED.** Human desktop and mobile browser review passed. Its carrier-profile patterns are part of the V1 visual baseline under D-054. P01/P02/P03 remain LOCKED and unchanged.
**P05 High-Fidelity = LOCKED.** Human desktop/mobile review and the correction pass are approved. Its Request-wizard patterns are part of the V1 visual baseline under D-055. P01–P04 remain LOCKED and unchanged.
**P06 High-Fidelity = LOCKED.** Human desktop and mobile browser review passed. Its published-success patterns are part of the V1 visual baseline under D-056. P01–P05 remain LOCKED and unchanged.
**Next visual task:** P07 Request Detail + Offers High-Fidelity, separately scoped. This documentation lock does not start P07 implementation.

## P06 High-Fidelity implementation — 2026-09-19

- Applied the existing marketplace theme, focused `max-w-3xl` content width, white bordered Card, restrained teal check indicator, standard Tailwind spacing and responsive content-driven layout. Reused unchanged PublicHeader, PageContainer, Button, Card/CardContent and Lucide icons; extended the existing RequestSuccessCard/DemoRequestSuccess without adding a new component abstraction.
- Preserved marketplace/targeted success headings and supporting copy from `publicationCopy`. The route-first summary displays the existing canonical aggregate route, shared pickup date, audience, vehicle count and every vehicle's public display line/route. No private addresses, contacts, notes or photos enter this presentation; fixtures, summary helpers and Request domain logic are unchanged.
- Added a concise three-step explanation: carrier review, offers visible in the Request, then carrier selection. No pre-Offer messaging or provider-delivery promises. Primary “Peržiūrėti mano užklausą” still opens `/requests/[id]`; secondary “Grįžti į pradžią” still opens `/`. No Dashboard or new-request action was invented.
- Targeted-only local visibility expansion retains the existing action, heading/audience change, status focus/announcement and reset on reload. Its status surface follows the same quiet teal treatment. All six explicit fixtures and unknown-ID not-found behavior remain unchanged; pages retain noindex/nofollow.
- **Known gap unchanged:** P05 still stops at the local phone-verification boundary without sending a code or publishing. P06 is an explicit demo published state, not a real P05 publication result. Visibility expansion does not persist or notify carriers. Real Auth, verification, publication, persistence and notification delivery remain unimplemented. The optional Request budget gap recorded under P05 remains deferred to real Request domain/backend work.
- Validation: `npm.cmd run build` passed compilation, lint and types; all 114 unit tests passed. New `tests/request-published.browser.mjs` passed for all six fixtures at 390/768/1280/1440px: summary/date/vehicle accuracy, real Request Detail navigation, home navigation, keyboard expansion and focus, reload reset, noindex, no clipping/overflow, unknown-ID HTTP 404 and no runtime exceptions. Screenshots in ignored `.next/p06-review/` were visually inspected at all four widths. `git diff --check` passed.
- Review URLs: `/request/marketplace-demo-001/published`, `/request/targeted-demo-001/published`, `/request/targeted-marketplace-demo-001/published`, `/request/multi-vehicle-demo-001/published`, `/request/multi-location-pickups-demo-001/published`, `/request/multi-location-mixed-demo-001/published`.
- Human desktop and mobile browser review passed; P06 High-Fidelity is LOCKED under D-056. Lock the restrained success confirmation, compact route-first Request summary, concise three-step “Kas toliau?” explanation, Request Detail primary CTA and secondary return-home action. No excessive celebration graphics or promise of real notification/provider delivery. Current demo/local publication behavior is preserved. Tailwind v4 + shadcn/Base UI standard sizing and responsive grid/flex/content-driven layouts remain mandatory; arbitrary custom pixel dimensions are prohibited.
- This documentation-only lock changes no P01–P06 UI or behavior. No P07 High-Fidelity, backend, Auth, Supabase, i18n rollout, provider or storage work starts here; no commit or push.

## P05 High-Fidelity and correction review — 2026-09-19

- P05 uses the established marketplace surfaces, focused form width, compact responsive progress, vehicle cards and editable review summary. The existing four steps, shared date window, local photos, validation, 1–10 vehicles and per-vehicle locations remain in place. The correction pass does not redesign these treatments.
- Corrected Request categories to the locked D-048 V1 scope: `car`, `suv`, `van`, `motorcycle`. Removed `other` rather than relabeling miscellaneous transport as a motorcycle. `van` remains the canonical value, labeled “Furgonas / mikroautobusas”; `motorcycle` is labeled “Motociklas”. Carrier-route categories already used these values. No existing fixtures contained `other`; unsupported legacy input is rejected, not silently converted.
- The existing aggregate summary helper remains unchanged: shared route → city pair; different pickups only → pickup count and destination; different deliveries only → origin and delivery count; both vary → “Kelių vietų pervežimas”. The correction browser scenario uses BMW X5 Hamburg → Warsaw and Audi Q5 Berlin → Warsaw, including back/forward retention and individual review routes.
- **Known budget gap — CASE B:** Optional Request budget is architecture-locked but not yet implemented in the P05 domain/state. D-046 and the product/architecture documents specify the desired overall budget only. No fake budget field was added. A later implementation must extend `TransportRequestDraft` in `src/features/public/create-request/model.ts`, initialization/validation in `logic.ts`, state/UI in `wizard.tsx`, and review in `contact-step.tsx`. Downstream budget support must also extend `PublishedRequestInput`/summary in `src/features/public/request-published/context.ts`, `RequestDetail`/`RequestEdit` in `src/features/public/request-detail/model.ts` and the projection in `src/lib/mock/published-requests.ts`, with corresponding tests.
- **Existing publication gap unchanged:** P05 ends at the local phone-verification handoff, explicitly saying the Request is not published and no code was sent. P06 remains an explicit mock published-request fixture, not a successful publication from P05. Real verification, persistence and storage remain out of scope. Photos remain local browser files; planned terms/privacy destinations are still unimplemented.
- Verification: production build (including lint/types) passed; all 114 unit tests passed; `tests/create-request.browser.mjs` passed at 390/768/1280/1440px. Browser checks cover corrected category labels and motorcycle selection, 1–10 vehicles, add/remove, inheritance, overrides, retained photos/fields, validation/focus, review edits, all four summary cases, the verification boundary and unchanged P06 demo. Step 2 and Review screenshots were visually inspected at every width in `.next/p05-review`; no clipping, horizontal overflow or runtime exceptions detected. BMW Hamburg → Warsaw and Audi Berlin → Warsaw correctly produce “2 paėmimo vietos → Warsaw” after back/forward navigation. `git diff --check` passed. A concurrent local dev server was stopped and production rebuilt to eliminate conflicting `.next` output before the successful browser run.
- Human desktop/mobile review and the correction pass passed; P05 High-Fidelity is now LOCKED under D-055. Lock the four-step wizard, default inheritance, 1–10 vehicles, per-vehicle location overrides/photos, canonical multi-location summaries, four-category V1 scope without `other`, shared pickup window, compact review, publication-time registration/phone-verification boundary and public/private address separation. Standard Tailwind v4 + shadcn/Base UI sizing and responsive grid/flex/content-driven layouts remain mandatory; arbitrary custom pixel dimensions are prohibited.
- Optional Request budget remains ARCHITECTURE-LOCKED but NOT YET IMPLEMENTED in the actual P05 Request domain/state. Implement it later together with real Request domain/backend work; this lock adds no budget UI.
- This documentation-only lock changes no P01–P05 UI or behavior and starts no backend, Auth, Supabase, i18n rollout, provider or storage work. No commit or push.

## P04 High-Fidelity implementation — 2026-09-18

- Applied the locked teal/slate, Geist, standard Tailwind/shadcn sizing and white bordered-surface patterns to Carrier Profile and its not-found state. Reused PublicHeader, PageContainer, Button, Card/CardContent and unchanged CarrierTrust. Identity emphasizes the public name, real verification, rating/review count and completed transports without an invented logo/photo.
- Desktop uses a standard two-thirds main column for active routes/reviews and one-third public information, verification and capabilities. Mobile stacks content in normal flow. Public descriptions, registration country where present and service countries use existing fixtures only.
- Replaced the old profile RouteCard presentation with MarketplaceRouteCard's existing result styling. An opt-in `context="profile"` omits repeated carrier identity/trust, preserving the previous profile behavior. Default discovery rendering for P01/P02 is unchanged. Route cards retain dates, canonical available capacity, compatibility and their existing detail links.
- The CarrierProfile model has no structured capability fields. The compact capability summary is explicitly scoped to current active routes, using their existing categories/non-running support; it is omitted when no active routes exist. No profile-wide capability, CMR, invoice, tracking or additional verification claims were fabricated.
- Reviews retain existing completed-transport filtering, order and preview limit. Cards follow P03's author, numeric star rating, comment, verified-transport marker and readable date treatment. New carriers show no fabricated rating or reviews. Empty active routes retain the existing account-free `/request/new` flow; the header retains its routes anchor or Request fallback.
- Active-route eligibility, capacity, matching, fixtures, models and review helpers are unchanged. No private contacts, exact addresses, documents, Booking details or private customer data are exposed; only existing public review previews are rendered. No message action or login gate was introduced.
- Validation: `npm.cmd run build` passed compilation, lint and types; all 111 unit tests passed. `tests/carrier-profile.browser.mjs` passed at 390/768/1280/1440px for verified/new/route-free/expired/unverified/unknown profiles, trust/capacity, unclipped content, privacy-related links, keyboard routes-anchor access, route/Request/back navigation, HTTP 404 and no runtime exceptions. Screenshots were visually inspected under ignored `.next/p04-review/`.
- Existing P01, P02 and P03 browser suites also passed at all four widths. `git diff --check` passed. Shared card changes are opt-in for P04; locked discovery/detail presentation and behavior remain unchanged.
- Human review URLs on the local production server at port 3000: `/carriers/vakaru-kryptis`, `/carriers/manto-transportas`, `/carriers/aukstaitijos-transportas`, `/carriers/baltijos-kelias`, `/carriers/pajurio-pervezimai` and `/carriers/unknown`. Fixed September fixtures naturally expire according to existing rules. Human desktop and mobile browser review passed; P04 High-Fidelity is LOCKED under D-054. This documentation-only lock changes no P01/P02/P03/P04 UI or behavior.
- Locked patterns: compact carrier identity/reputation, public-safe information, restrained trust cards, active-route capabilities, MarketplaceRouteCard reuse, P03-style reviews, desktop two-column layout and normal-flow mobile stacking. No public phone/email/private address or pre-offer messaging CTA. Standard Tailwind v4 + shadcn/Base UI sizing and grid/flex/content-driven layouts are mandatory; arbitrary custom pixel dimensions are prohibited. See `03_TECHNICAL_ARCHITECTURE.md`.
- No P01/P02/P03 redesign, P05 implementation, backend, Auth, Supabase, persistence, Maps, payments, i18n rollout or provider work. No commit or push.

## P03 High-Fidelity implementation — 2026-09-18

- Applied the locked P01/P02 teal/slate, Geist and white bordered-surface treatment to Route Detail and its existing not-found state. Reused the unchanged PublicHeader, PageContainer, Button, Card/CardContent and CarrierTrust. Refined RouteDetail and the existing RouteStopList; no new UI component abstraction was needed.
- Route-first summary shows the existing ordered waypoints, dates and availability. RouteStopList now uses a semantic ordered list with flex columns and content-driven connector lines, with stronger endpoints; no absolute positioning, fixed card heights, map or arbitrary pixel dimensions.
- Standard responsive grid gives desktop main content plus a sticky action sidebar. On mobile, the action card stays in normal document flow. Capabilities, carrier verification/rating/completed transports and completed-transport review previews use only existing data. Carrier profile and back-to-search links are unchanged.
- Canonical capacity and availability helpers, fixtures, date semantics and request URL construction are unchanged. Available routes retain the targeted CTA and complete location/date/carrier/route handoff; expired or closed non-full routes retain the existing marketplace fallback. Full routes remain directly viewable without a new Request CTA. Browsing and starting a Request remain account-free.
- The current runtime model does not expose routeFlexible, search-match context or extra CMR/invoice/tracking attributes, so no values or indicators were fabricated. Only public city/country location data is shown. Fixed September fixtures still expire naturally under existing rules.
- Validation: production build passed compilation, lint and types; all 111 unit tests passed. `tests/route-detail.browser.mjs` passed at 390/768/1280/1440px for available/full/expired/new-carrier/unknown states, ordered stops, capacity, unclipped content, desktop/mobile sidebar behavior, keyboard Request handoff, carrier/back navigation, HTTP 404 and no runtime exceptions. Screenshots were visually inspected under ignored `.next/p03-review/`. A tablet heading line-height issue found during review was corrected using standard Tailwind leading.
- Existing P01 and P02 browser suites also passed at all four widths. `git diff --check` passed; changes are limited to P03 presentation, its timeline, focused browser checks and this status document.
- Human review: `/routes/vakaru-kryptis-0918` (available), `/routes/manto-transportas-0917` (new carrier), `/routes/baltijos-kelias-0920-full` (full), `/routes/baltijos-kelias-0915` (expired) and `/routes/unknown` (not found), on the local production server at port 3000. Human desktop and mobile browser review passed; P03 High-Fidelity is LOCKED under D-053. This documentation-only lock changes no P01/P02/P03 UI or behavior.
- Locked patterns: route-first hierarchy, route timeline, compact capabilities, evidence-backed carrier trust, sticky desktop action card, normal-flow mobile action card and capacity/full-route UI. Tailwind v4 + shadcn/Base UI standard sizing and grid/flex/content-driven responsive layouts remain mandatory; arbitrary custom pixel dimensions are prohibited. See `03_TECHNICAL_ARCHITECTURE.md` for the approved baseline.
- No P01/P02 redesign, P04 high-fidelity, domain changes, backend, Auth, Supabase, persistence, i18n rollout, Maps or provider work. No commit or push.

## P02 High-Fidelity implementation — 2026-09-18

- Applied the locked P01 teal/slate palette to P02, including loading/error states. Reused the unchanged public header/container and extended `MarketplaceRouteCard` with a `result` variant; the default P01 presentation is preserved. Result cards prioritize routes, waypoints, qualitative match explanations, carrier trust, availability/dates and vehicle/non-running compatibility.
- Added count-aware search-summary wording from the existing `vehicleCount` URL value. Preserved search editing, filters, sorting, history, exact/alternative groups, route destinations and request fallback. Matching, capacity, multi-vehicle and multi-location domain logic and fixtures are unchanged. Vehicle count still has no editor control; the existing Request fallback carries locations/dates, not `vehicleCount`.
- Desktop uses a two-thirds results list and one-third supplemental map placeholder with content-driven height. Mobile retains List/Map and filter Sheet behavior. No map provider or invented CMR/invoice/flexibility claims. Existing demonstration-data notice remains; fixed September fixtures naturally expire under existing matching rules.
- Empty results provide “Sukurti pervežimo užklausą” with the existing account-free prefilled Request handoff. No P01 redesign, P03 implementation, backend, Auth, Supabase, persistence, full i18n or provider work. No commit or push.
- Validation: `npm.cmd run build` passed compilation, lint and types; all 111 unit tests passed; `git diff --check` passed. `tests/search.browser.mjs` passed at 390/768/1280/1440px for results, matching segments, count labels, filter/history and sort URLs, search editing, empty/invalid states, mobile List/Map and route navigation, with no overflow/clipping or runtime exceptions. Screenshots reviewed under ignored `.next/p02-review/`. Existing P01 browser checks also passed at all four widths; P01 screenshots were visually rechecked. Review URL: `/search?from=hamburg-de&to=kaunas-lt` on the local production server at port 3000. Human desktop and mobile browser review passed; P02 High-Fidelity is LOCKED under D-052. This documentation lock does not change P01/P02 UI or behavior.

## P01 visual implementation — 2026-09-17

- Refreshed Home and the shared public header using Geist, standard Tailwind dimensions, Base UI/shadcn primitives and a scoped teal/slate palette. Added a reusable discovery route card using existing fixed fixtures and evidence-backed verification/rating values; P02/P03 layouts and search logic are unchanged.
- Origin/destination validation, optional single/range/flexible dates, search and secondary Request handoffs are preserved. P01 did not have a vehicle-count control or locale selector; neither was introduced in this visual pass. The carrier CTA retains the existing `/carrier` destination, which is still a planned screen.
- Human desktop and mobile browser review passed; P01 High-Fidelity is LOCKED. D-051 and the V1 visual baseline in `03_TECHNICAL_ARCHITECTURE.md` record the approved direction, mandatory layout/sizing rules and reusable patterns. No backend, Auth, Supabase, persistence, i18n rollout or provider work started. No commit or push.
- Validation: production build passed including lint/types; all 111 unit tests passed. Headless Chrome and screenshot review covered 390/768/1280/1440px, no horizontal overflow or clipped controls, desktop control alignment, keyboard location selection, validation focus, both URL handoffs and mobile menu. `git diff --check` passed. Screenshots are in ignored `.next/p01-review/`; production review is served on port 3000. A concurrent development server was stopped after it overwrote build assets; final checks used a fresh production server.

**Current phase:** P01, P02, P03 and P04 High-Fidelity LOCKED; next visual task is P05 Create Request High-Fidelity. Backend implementation has not started.
**Project status:** P01–P09, Multi-Vehicle, Multi-Location, Carrier Capacity V1, Conversation / Chat V1, the Messages Inbox, B01 Booking Detail and Notifications V1 / N01 are implemented, browser-reviewed and LOCKED. The pre-backend Route Distribution, i18n, location privacy, optional budget, carrier trust, light-vehicle scope and progressive Customer/Carrier authentication decisions are also LOCKED. Real authentication, backend, Supabase, persistence, realtime messaging, provider integrations and full translation rollout have not started.

## Final pre-backend architecture lock — 2026-09-17

- D-043 locks `routeFlexible`, canonical persisted Route publication, `carrierRoute.published`, eligibility/capacity checks, provider-independent channel jobs, immutable public payload snapshots and canonical `/routes/[routeId]` acquisition CTAs. Telegram is the first intended automated adapter; Facebook starts as generated/manual publishing; WhatsApp is future opt-in Business messaging. No adapter/provider was implemented.
- D-044 locks English as source/fallback; locales `en`, `lt`, `de`, `nl`, `fr`, `pl`, `ro`, `uk`, `ru`; saved preference → browser → English resolution; translation-key scope; locale-aware formatting; and no automatic translation of user-generated content. The current locked Lithuanian UI was not migrated or changed.
- D-045 locks public city/area + country separately from private exact addresses/instructions. Future vehicle locations support `publicLocation` plus optional `privateAddress`, enforced by backend authorization after Booking. Phone/private contact data never belongs in public or distribution payloads.
- D-046/D-047 lock optional overall Request budget fields and evidence-backed Carrier trust metadata without changing P05 or current Carrier UI.
- D-048 limits V1 capacity/matching to passenger cars, SUV/crossovers, vans/minivans and motorcycles. Heavy machinery, agricultural machinery, loose freight, engines and heavy commercial equipment remain out of scope. The current mock `other` form option is not a persisted heavy-transport category and remains untouched until the data-backed migration is scoped.
- D-049/D-050 lock progressive passwordless Customer auth at Publish Request and stricter Carrier auth before supply/commercial actions. Verified phone remains the V1 Request-publication trust gate; no OTP/OAuth/provider flow was implemented.
- The intended growth funnel is external Route post → public Route Detail → account-free browse/local Request form → verification at Publish → Request → Offer → Conversation → Booking.
- Locked next-phase order: i18n foundation → Auth/User roles → Supabase schema → migrate mock entities to persistence.
- Not started: Supabase, real auth, real persistence, realtime backend, email/SMS providers, Telegram/Facebook/WhatsApp adapters, Maps/geocoding, address reveal logic and full i18n translation rollout.
- Final validation: `npm.cmd run build` passed compilation, lint/type checks, static generation and build tracing; all 111 unit tests passed; `git diff --check` passed. This lock changed documentation only and did not alter application behavior.

## N01 Notifications V1 locked baseline — 2026-09-16

- Added `/notifications` with “Visi” and “Neperskaityti” filters, explicit unread presentation, local mark-one-on-navigation behavior, “Pažymėti visus kaip perskaitytus”, stored canonical deep links, loading UI and the required empty states. Review selectors cover default, unread, empty and all-read states without technical/mock wording.
- Added the canonical Notification model and separate future NotificationDelivery concept. D-042 locks domain-event recipient/channel policy, self-notification suppression, `Notification.href`, delayed unread/debounced Chat email fallback and future event/recipient/channel idempotency. `offer.accepted` is internal-only; `booking.created` is the sole customer-facing accepted-Booking notification and points to `/bookings/[bookingId]`.
- Fixtures cover new/updated Offers, a Chat message, the canonical `booking.created` confirmation, every Booking progress event and a compact €900 two-vehicle/two-pickup Booking context. Count-aware collected/delivered copy reuses the current vehicle wording rules.
- Header integration is intentionally deferred: the current shared header is public/unauthenticated, so adding a customer account unread badge would create an auth and global-state assumption across locked screens. The future auth-aware header must use authoritative server unread state.
- No provider or SDK was selected or installed. N01 sends no email, SMS or push and adds no credentials, service worker, preferences persistence, backend, Supabase or realtime behavior.
- Validation: `npm.cmd run build` passed compilation, lint/type checks and static generation. All 111 unit tests passed, including 10 focused N01 tests; the focused N01/B01/Chat/P08/P09 group passed all 52 tests. Production browser checks passed N01 plus locked B01, Chat, P08 and P09 at 390/768/1280/1536px without horizontal overflow or runtime exceptions. N01 click navigation uses the stored Notification `href`.
- Human browser review passed. Notifications V1 / N01 and its event-driven policy, authoritative in-app history, self-notification suppression, canonical stored destinations, `offer.accepted` internal-only boundary, single `booking.created` accepted-Booking delivery set and future idempotency requirement are now LOCKED as the approved baseline.

## B01 Booking / Transport Detail locked baseline — 2026-09-16

- Added `/bookings/[id]` as the customer source of truth for an accepted complete-request transport, plus loading and Lithuanian 404 states. The existing P09 “Atidaryti pervežimą” destination now resolves without changing the locked Dashboard design or behavior.
- Added canonical Booking/BookingVehicle types derived from existing Vehicle, Location and Carrier types. D-041 locks the immutable accepted agreement snapshot and one aggregate lifecycle: Booked, Pickup Scheduled, Collected, In Transit, Delivered and Completed. Per-vehicle statuses are intentionally excluded from V1.
- B01 shows compact route/vehicle context, agreed dates, all per-vehicle routes/details, responsive aggregate timeline, selected carrier trust, total price/payment terms and the accepted Conversation link. It never shows competing Offers or editing controls for the Request, carrier, price or terms.
- Delivered alone offers customer confirmation and transitions locally to Completed after an accessible confirmation dialog. No persistence, payments, cancellation, reports, documents, photos, GPS or carrier operational controls were added.
- Booking snapshot tests prove later Request/Offer/carrier/location mutation does not change accepted values. Review fixtures cover every lifecycle state, a €900 two-vehicle/two-pickup Booking and unknown-ID 404.
- Future `booking.created`, `booking.pickupScheduled`, `booking.collected`, `booking.inTransit`, `booking.delivered` and `booking.completed` events are documented as notification boundaries only. B01 does not send notifications, email, SMS or push; Chat retains its separate `message.created` boundary.
- Human browser review passed. B01 Booking Detail, its immutable complete-Booking snapshot, one aggregate count-aware lifecycle, per-vehicle pickup/delivery data, multi-vehicle + multi-location behavior, total complete-Booking price and reuse of the accepted-offer Conversation are now LOCKED as the approved V1 baseline.
- Final lock validation: `npm.cmd run build` passed compilation, lint/type checks and static generation; all 101 unit tests passed. The 42-test focused B01, Chat, P08 and P09 subset also passed. Production browser regressions for B01, Chat, P08 and P09 passed at 390/768/1280/1536px without horizontal overflow or runtime exceptions.

## V1 Conversation / Chat locked baseline — 2026-09-16

- Locked D-040: chat begins after Offer, exactly one Conversation exists per Request + Carrier, Offer revisions reuse it, the winning Conversation continues into Booking and losing/terminal conversations archive read-only. There is no arbitrary user messaging or second Booking chat.
- Added canonical `Conversation` and `Message` types, lifecycle/acceptance/send/order/unread helpers, and a `message.created` domain-event boundary for future in-app and transactional email notifications. V1 chat is text-only; SMS is off by default and attachments are deferred to V1.2.
- Added and browser-reviewed the Messages Inbox at `/messages` and canonical detail at `/messages/[conversationId]`, with compact multi-location context, explicit customer/carrier/system identity, timestamps, unread presentation, immutable system events, local active-thread send behavior, and read-only historical states. Unknown IDs use Next.js 404 handling.
- Added P07/P08 conversation entry points without adding chat before an Offer. Winning Booking-linked conversations keep the same ID; B01 links to that existing Conversation at `/messages/[conversationId]` and does not create another chat.
- Review fixtures cover active pre-Booking, updated Offer, Booking-linked winner, archived loser, completed/read-only and multi-vehicle/multi-location states.
- Human browser review passed. Conversation / Chat V1 and the Messages Inbox are now LOCKED. Backend persistence, realtime transport, email, SMS and notification delivery remain unimplemented; `message.created` is only the documented future notification event boundary.
- Final lock validation: all 90 unit tests passed, including 11 focused Conversation cases; `npm.cmd run build` passed compilation, lint/type validation and static generation; Conversation and P07/P08/P09 production browser regressions passed at 390/768/1280/1536px without horizontal overflow or runtime exceptions.

## Multi-Vehicle Core Revision — 2026-09-15

- One Transport Request contains 1–10 vehicles with one shared requested pickup date/window. Each vehicle has structured pickup and delivery locations, initially inherited from the Step 1 default route and independently overridable. Vehicle photos belong to individual vehicles.
- One Offer covers the complete Request and its `totalPriceEur` is the total price for all vehicles. Partial Offers, per-vehicle acceptance, split Bookings and multiple carriers per Request remain outside V1.
- Adding/removing a vehicle or changing vehicle category, make/model, year, condition or rolling ability when relevant is material and invalidates Pending Offers. Request notes and vehicle photos remain non-material.
- The canonical frontend Request model now uses `vehicles[]` only. P05 supports 1–10 independently validated vehicles while preserving the four-step flow; P06–P09 use shared compact or detailed multi-vehicle presentations as appropriate.
- P07 keeps Request-level route/date/notes and Offer invalidation rules. P08 makes the complete-request price and acceptance scope explicit without per-vehicle pricing or partial acceptance. P09 preserves its locked lifecycle and attention rules with a representative multi-vehicle fixture.
- D-038 locks integer Route capacity: each vehicle consumes one space; `capacityAvailable` derives from `capacityTotal` and `capacityReserved`; Offers do not reserve; future successful Booking creation reserves the complete Request vehicle count; eligible cancellation releases the same count. Full Routes remain viewable but do not match or show a public request CTA.
- D-039 locks per-vehicle structured pickup/delivery locations, Step 1 default-route inheritance, one shared requested date window and one complete carrier Offer/Booking. Matching must accept the complete vehicle/location set; partial matching, route optimization and segment-capacity reuse remain outside V1. D-039 supersedes D-037's same-route restriction.
- Review URLs: P02 insufficient capacity `/search?from=hamburg-de&to=kaunas-lt&vehicle=car&vehicleCount=2`; P03 available `/routes/baltijos-kelias-0915`; P03 full `/routes/baltijos-kelias-0920-full`; P05 two pickups `/request/new?from=hamburg-de&to=kaunas-lt&dateType=range&dateFrom=2026-09-15&dateTo=2026-09-17&review=multi-location-pickups`; P05 mixed `/request/new?from=hamburg-de&to=kaunas-lt&dateType=range&dateFrom=2026-09-15&dateTo=2026-09-17&review=multi-location-mixed`; P06 `/request/multi-location-pickups-demo-001/published`; P07 `/requests/multi-location-pickups-demo-001` and `/requests/multi-location-mixed-demo-001`; P08 `/offers/multi-location-pickups-demo-001-offer-1` and `/offers/multi-location-mixed-demo-001-offer-2`; P09 `/dashboard`.
- Final validation: `npm.cmd run build` passed and all 79 P01–P09 regression tests passed. Production browser review passed P02/P03 capacity, P05 route inheritance/override and final summaries, P06–P09 multi-location states, and the full P07/P08/P09 flows at 390/768/1280/1536px without horizontal overflow or runtime exceptions.
- P01–P09 are LOCKED and browser-reviewed. Multi-Vehicle Requests, per-vehicle Multi-Location transport, Multi-Vehicle + Multi-Location Booking behavior and Carrier Route Capacity V1 are the approved baseline. Backend, authentication and Supabase have not started. No commit or push performed.

## P09 implementation — 2026-09-15

- Locked the detailed P09 product rules in `02_V1_SCREEN_MAP.md` and added D-036 to `05_DECISIONS_LOG.md`: Active Requests belong to Užklausos, Booked Requests to Pervežimai, Completed/Closed Requests to Istorija, Drafts are excluded, attention derives only from actionable Pending Offers, detail actions remain off the Dashboard, and vanity KPIs are prohibited.
- Added `/dashboard` with a page header and “Sukurti naują užklausą”, conditional “Reikia dėmesio”, and responsive Užklausos / Pervežimai / Istorija tabs. Cards reuse P07/P08 Request, Offer, carrier, selected-Offer, Booking-link, status and formatting data through a derived view model; no second Request model or private contact data was added.
- Attention cards count only currently actionable Pending Offers using the existing P07 validity rules. Requests with updated actionable Offers sort first and show “Atnaujintas pasiūlymas”; other qualifying Requests show “Naujas pasiūlymas”. Dashboard actions only navigate to P07 or the future Booking route.
- Added compact whole-page and per-tab empty states, a skeleton loading route and a retry error boundary. Review fixtures use the non-UI `view` query selector: mixed `/dashboard`, Requests-only `/dashboard?view=requests`, transport-only `/dashboard?view=transport`, History-only `/dashboard?view=history`, and empty `/dashboard?view=empty`.
- Validation: `npm.cmd run build` passed lint, TypeScript and production compilation. All 55 unit tests passed: 9 focused P09 tests and 46 P01–P08 regressions. Production P09 browser checks passed all five fixtures, tab navigation, destinations, touch targets and no horizontal overflow at 390/768/1280/1536px. Full P07 and P08 production browser regressions also passed at all four widths with no runtime exceptions.
- At the P09 implementation checkpoint, P01–P08 were locked and P09 awaited browser review. D-037 and the Multi-Vehicle Core Revision above now supersede that checkpoint status. B01/backend/auth, persistence, payments, notifications, messages, analytics and P10 were not started.

## P08 implementation — 2026-09-15

- Added `/offers/[id]` as a no-index customer decision page using the existing P07 `RequestOffer` and request fixtures. Unknown IDs use Next.js not-found behavior with a Lithuanian P08 404. The page links back to its request and to the existing P04 carrier profile without exposing private contact, address or verification-document data.
- The page places human-readable status, final EUR transport price and carrier name first, then shows pickup, planned delivery, expiry, explicit payment terms, optional carrier comment, carrier trust and compact “Jūsų užklausa” context. Only city-level route and the existing public vehicle/date projection are used. A neutral comparison notice appears only when an explicitly offered pickup date falls outside a single requested date or date window; the request has no delivery deadline to compare, so no delivery conflict is invented.
- Minimally extended the shared P07 offer model with payment terms, optional carrier comment and prior revision snapshots. Added a shared EUR formatter. The updated-offer fixture keeps its current fields as the latest actionable terms and exposes the previous €590 terms in collapsed “Pasiūlymo istorija”, sorted newest first. Previous revisions have no action controls and internal version numbers are not presented as primary UI.
- Pending offers alone show “Priimti pasiūlymą” and “Atmesti pasiūlymą”. Both require accessible confirmation dialogs. Accept confirmation summarizes carrier, final price, pickup, delivery and payment terms and explains the effect on competing offers. Confirming either action changes only the local offer state; accepting creates no Booking, changes no Request, reserves no capacity and explicitly says real booking creation awaits backend integration. Reload restores the fixture.
- Expired, request-version-invalidated, Not Selected, Accepted and Declined fixtures are read-only with specific customer context. Review URLs: pending `/offers/marketplace-demo-001-offer-1`; updated `/offers/updated-offer-demo-001-offer-1`; expired `/offers/historical-offers-demo-001-offer-1`; unavailable after request change `/offers/request-changed-demo-001-offer-1`; not selected `/offers/booked-demo-001-offer-2`; accepted `/offers/booked-demo-001-offer-1`; declined `/offers/historical-offers-demo-001-offer-2`; unknown `/offers/unknown-p08-offer` (404).
- Validation: `npm.cmd run build` passed lint, TypeScript and production compilation. All 46 tests passed: 8 focused P08 tests and 38 P02–P07 regressions. Production P08 browser checks passed seven states, revision disclosure, carrier/request links, both confirmation dialogs, local action/reset behavior, HTTP 404 and no horizontal overflow at 390/768/1280/1536px. The full P07 production browser regression also passed at all four widths. No runtime exceptions were captured. Review screenshots are generated under ignored `.next/p08-review/`.
- P01–P07 remain locked. P08 is completed, browser-reviewed and ready to commit. No P09, B01, real booking creation, backend, Supabase, auth, payments, notifications, messaging or Admin work was added. No commit or push performed.

## P07 implementation — 2026-09-15

- Browser-review correction: Booked and Completed requests now present the accepted offer under “Pasirinktas vežėjas” and move non-selected offers into a collapsed, visually secondary “Ankstesni pasiūlymai (N)” section. Historical offers retain their data and “Nepasirinktas” status without a decision CTA. Active request offer comparison is unchanged. Focused grouping and browser assertions cover this presentation.
- Resumed the existing `1c11041` WIP commit. The working tree was clean on arrival; that commit already contained the request model, lifecycle/edit helpers, offer card, details, editor, confirmation dialog and review fixtures. All existing work was retained.
- Added `/requests/[id]`, a Lithuanian unknown-request HTTP 404, no-index metadata and the client page connecting the existing components. Summary includes route, vehicle, requested date and visibility. Offers reuse carrier verification/reputation and show total EUR transport price, pickup, delivery, expiry, updated badge and actionable-only `/offers/[id]` links.
- Local notes/photo edits preserve the request version and pending offers. Material route/date/category/condition changes (including non-running rolling capability) require “Pakeitus šiuos duomenis esami pasiūlymai nebegalios.” confirmation, increment the internal request version and mark pending offers unavailable. Cancel preserves the original. Selected photos can be previewed and removed; nothing is uploaded.
- Closing requires confirmation, produces Closed and makes pending offers Unavailable. There is no reopen. “Pakartoti užklausą” creates a separate in-memory Draft with copied request values and no offers, leaving the original closed. This draft is only a local preview, without publication or persistence.
- Booked requests are read-only with “Atidaryti pervežimą” linking to `/bookings/transport-demo-001`. Completed, closed and draft fixtures have appropriate read-only states. Targeted-only zero-offer requests can demonstrate expanding visibility without sending anything. Reload restores the fixtures.
- The existing fixed review clock (`2026-09-14T09:00:00Z`) keeps pending and expired offers reproducible; it is not live eligibility. At P07 completion, P08 and booking screens remained unimplemented link destinations. No offer acceptance, booking creation, backend, Supabase, auth, notifications or payments were added. P01–P06 application code and fixtures were unchanged.
- Review URLs: `/requests/marketplace-demo-001`, `/requests/targeted-demo-001`, `/requests/updated-offer-demo-001`, `/requests/booked-demo-001`, `/requests/closed-demo-001`, and `/requests/unknown-p07-request` (404). Additional states: `/requests/completed-demo-001`, `/requests/draft-demo-001`, `/requests/non-running-demo-001`, `/requests/historical-offers-demo-001`, `/requests/targeted-marketplace-demo-001`.
- Validation: `node --test tests/*.test.mjs` passed all 38 tests (10 P07 and 28 P02–P06 regressions). `npm.cmd run build` passed lint, types and production compilation. `node tests/request-detail.browser.mjs` passed against the final production build at 390/768/1280/1536px: nine fixtures, CTA states, desktop columns, notes/photos, confirmation/cancel, invalidation, closure/repeat, visibility/reset and unknown HTTP 404. No horizontal overflow or runtime exceptions; mobile/desktop screenshots inspected. Screenshots are generated under ignored `.next/p07-review/`. Final P07 browser review passed.
- At P07 completion, P07 was browser-reviewed and ready to commit, P01–P06 remained locked, and P08/backend had not started.
- Build integration fixed the existing WIP country-format import and photo-preview effect. A fresh generated-cache rebuild was needed to include new desktop CSS classes. No packages or locked product decisions changed. No commit or push performed in this session.

## P06 implementation — 2026-09-14

- Added `/request/[id]/published` with explicit demo fixture lookup and Next.js not-found behavior for every unknown ID. The reusable success card takes a public summary derived from the P05 draft model; private addresses, contacts, notes and photos are excluded. Local-calendar date formatting is reused on the server.
- Marketplace, targeted-only and targeted-plus-marketplace states show the route, vehicle, pickup window, audience and concise next steps. The primary link points to `/requests/[id]`; at P06 completion, that planned P07 destination still returned 404. A secondary link returns home.
- The targeted-only growth action changes only the demo component's in-memory visibility and resets on reload. It does not save or notify anyone. Demo routes are excluded from indexing; no P05 navigation leads to them. P05 still requires phone verification and does not claim publication.
- Browser review: `/request/marketplace-demo-001/published`, `/request/targeted-demo-001/published`, `/request/targeted-marketplace-demo-001/published`; unknown state: `/request/unknown-p06-request/published`.
- Validation: production build passed, including lint/type checks. All 28 tests passed (3 P06 tests and 25 P02–P05 regressions). Production browser checks covered all three fixtures at 390/768/1280/1536px, correct headings/links, no horizontal overflow, demo expansion/reset, focus and unknown-ID HTTP 404. No runtime exceptions were captured.
- At P06 completion, P01–P05 application code was unchanged and locked, while P07/backend/auth had not started. P06 final browser review passed and P06 is locked. No commit or push was performed in that session.

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
- P05 final browser review passed. P04/P05 are now locked and included in commit `968e664` (`Complete P05 create transport request`). No commit or push was performed in the P05 implementation session.

## P04 implementation — 2026-09-13

- Final review corrections: removed the unavailable save action and hint; added RouteCard `context="profile"` to omit repeated carrier identity/trust while retaining route details and an accessible route heading; removed `/ 5` from the review summary while keeping its Star icon. P02 card defaults and all profile eligibility/data logic are unchanged. All 17 existing P04/P03/P02 tests passed again.
- Added `/carriers/[id]` with stable carrier-ID lookup, metadata and a Lithuanian Next.js not-found screen. The profile type extends the existing route carrier identity; existing route/review fixtures and P01–P03 behavior are preserved.
- Profile header reuses CarrierTrust. Verification displays only the existing aggregate approved status; no invented identity/company/document breakdown or private contact data.
- Added short public descriptions. Existing carriers' service countries derive from their route stops; their registration country is omitted because it is unknown. Added only `aukstaitijos-transportas`, a profile without routes, to cover the empty state without fabricating supply.
- Active routes reuse P03 availability (positive capacity, accepting requests, end date not before today in Europe/Vilnius), sorted by start date. RouteCard now accepts an omitted match level for profiles; P02 continues to pass its existing match labels unchanged.
- Primary action leads to active routes, or `/request/new` when none exist. The empty state also offers the request fallback. The unavailable save action and its hint were removed during final review; no authentication or persistence.
- Reviews reuse only completed-transport fixtures, newest first, with accessible stars and localized dates. Existing aggregate reputation remains unchanged; the latest-review list uses the available previews (up to six). No fabricated remaining reviews, infinite scroll or moderation tools.
- Validation: production build passed; 17 tests passed (4 P04 lookup/filter/review checks and 13 P02/P03 regressions). Production browser checks passed at 390px and 1280px for verified, new, route-free and unknown profiles: HTTP 200/404, CTA destinations, no horizontal overflow, 44px link targets, and no runtime/console errors. Mobile/desktop screenshots inspected.
- P04 final browser review passed. P04 is completed, browser-reviewed and locked; included in commit `968e664`. P01/P02/P03 are locked. At P04 completion, P05/backend had not started. No packages, maps, contact actions, messaging, auth or backend added. No commit or push performed in this P04 session.

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
- Real product UI: public layout, shared pickers and P01–P09 implemented with mock data; P01–P09 and the Multi-Vehicle, Multi-Location and Carrier Capacity V1 baseline are locked and browser-reviewed.

## Immediate next task

**Next visual task = P07 Request Detail + Offers High-Fidelity**, separately scoped and preserving existing product behavior. P01, P02, P03, P04, P05 and P06 High-Fidelity remain LOCKED and unchanged. This documentation-only lock does not start P07 implementation, backend, Auth, Supabase, i18n rollout, provider or storage work.

The later backend-phase order remains **i18n foundation → Auth/User roles → Supabase schema → migrate mock entities to persistence**, with each phase separately scoped. Do not start any of these phases or provider work from this visual lock.

## Locked baseline handoff

P01–P09, Multi-Vehicle Requests, per-vehicle Multi-Location transport, Multi-Vehicle + Multi-Location Booking behavior, Carrier Route Capacity V1, Conversation / Chat V1, the Messages Inbox, B01 Booking Detail and Notifications V1 / N01 are approved, browser-reviewed and LOCKED. D-043–D-050 lock the final pre-backend architecture. Start no new phase until it is separately selected and scoped. Real authentication, backend, Supabase, persistence, realtime messaging, provider delivery, Route-distribution adapters and full i18n translation rollout remain unstarted. Do not commit or push without a separate instruction.

## Do not reopen without a blocker

The following are already locked and should not be casually redesigned during implementation:

- one User can be customer + carrier;
- search works without registration;
- phone OTP required to publish customer Request;
- progressive passwordless Customer auth gates Publish rather than browsing/form completion;
- Carrier auth gates Route publication, Offers, customer messaging and Booking management;
- English source/fallback and saved preference → browser → English locale resolution;
- public city/area Location is separate from private exact transport address;
- optional Request budget is overall guidance, not an Offer or auto-accept rule;
- V1 vehicle scope is passenger car, SUV/crossover, van/minivan and motorcycle only;
- `carrierRoute.published` feeds snapshot-based provider-independent distribution jobs;
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
