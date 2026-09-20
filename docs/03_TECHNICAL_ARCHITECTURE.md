# Parvezk.lt V1 — Technical Architecture

**Status:** Implementation blueprint locked; backend not yet implemented.  
**Last consolidated:** 2026-09-17.

## 1. Current stack

### Existing

- Next.js 15.5.25
- TypeScript
- Tailwind CSS
- Hostinger managed Node.js hosting
- GitHub repository: `e-turinys/traliukas`
- Automatic GitHub → Hostinger deployment working

### Chosen for V1

- shadcn/ui design system
- shadcn/Base UI primitives
- Lucide icons
- React Hook Form + Zod
- TanStack Table for Admin data tables
- Sonner for toasts
- Supabase planned for PostgreSQL/Auth/Storage
- i18n-ready UI text structure from the start

## 2. Frontend architecture principles

### Page components compose; shared components implement reusable UI

Planned shared components include:

- `LocationPicker`
- `DateWindowPicker`
- `RouteSummary`
- `RouteCard`
- `CarrierCard`
- `CarrierTrust`
- `VerificationBadge`
- `RatingDisplay`
- `VehicleSummary`
- `RequestCard`
- `OfferCard`
- `BookingStatus`
- `StatusTimeline`
- `EmptyState`
- `ErrorState`
- `LoadingCards`
- `MoneyDisplay`
- `UserAvatar`
- `MessageThread`
- `NotificationItem`
- `FileUploader`
- `ConfirmActionDialog`
- reusable Admin `DataTable`

Rule: do not embed business eligibility rules inside visual cards. For example, `OfferCard` displays an Offer; server/business logic decides whether it may be accepted.

### Design tokens

Use semantic design tokens rather than hard-coded colors throughout the app.

Examples:

- `primary`
- `secondary`
- `muted`
- `destructive`
- `success`
- `warning`

Components should receive semantic state (`status="completed"`) rather than repeatedly embedding raw utility color choices.

### V1 visual baseline — LOCKED (D-051, 2026-09-17)

P01 High-Fidelity passed human desktop and mobile browser review. Its current responsive browser implementation is the visual source of truth and the reference for future P02/P03 high-fidelity work. This approval does not authorize redesigning P01 or changing any locked product behavior.

- **Direction:** Clean Marketplace + Friendly European Marketplace. Practical, calm, trustworthy and consumer-facing; transport-focused without corporate logistics or luxury automotive styling.
- **Palette:** deep teal/petrol primary (Tailwind teal-700 family), darker teal hover, very light teal soft surfaces, light slate/neutral backgrounds, white cards, near-black slate text, muted slate secondary text and subtle slate borders. No gradients, unrelated brand colors or dark theme.
- **Typography/icons:** Geist remains the typography baseline; use standard Tailwind type/leading scales and Lucide application icons.
- **Sizing:** Tailwind v4 spacing, height, width, type and radius scales plus existing shadcn/Base UI sizing conventions are mandatory. Avoid arbitrary custom pixel dimensions; any unavoidable technical exception must be explained. Use responsive max-width containers and practical touch targets.
- **Layout:** normal page sections use grid, flex and content-driven auto-layout behavior. Do not use fragile absolute positioning for normal layouts, tightly fitted text containers or fixed card heights. Text and translated labels must wrap naturally; buttons must grow without clipping.
- **Rhythm:** controlled whitespace, clear hierarchy, restrained rounding, subtle borders and minimal shadows. Preserve visible keyboard focus, semantic headings/labels, adequate contrast and non-color-only status meaning.
- **Responsive reference:** P01 at 390, 768, 1280 and 1440px. Future P02/P03 work must retain intentional mobile layouts and avoid horizontal overflow, overlapping text, clipped actions or hidden sections.

#### Reusable patterns established by P01

| Pattern | Reference | Approved treatment |
|---|---|---|
| Public header | `src/components/layout/public-header.tsx` | Lightweight white header, teal wordmark, desktop navigation and compact mobile Sheet menu; existing destinations retained. |
| PageContainer | `src/components/layout/page-container.tsx` | Centered `max-w-7xl` container with responsive standard horizontal padding. |
| Marketplace search surface | `src/features/public/home-search.tsx` | White bordered Card, aligned labeled controls, prominent primary action, secondary Request action; horizontal desktop, intermediate tablet grid and stacked mobile fields. Preserve validation and URL handoffs. |
| Trust strip/item | P01 page benefit list | Quiet Lucide icon/text items in a responsive row/grid/list; no fabricated verification claims or excessive badges. |
| MarketplaceRouteCard | `src/components/shared/marketplace-route-card.tsx` | Route-first hierarchy, waypoints, carrier, evidence-backed trust, derived capacity, dates and full-width detail action. Cards grow with content; responsive 1/2/3-column grid. |
| Section heading | P01 page sections | Clear `text-2xl`/`sm:text-3xl` semibold headings, optional muted supporting text and consistent standard spacing. |
| Three-step explanatory section | P01 “Kaip tai veikia” | Compact numbered items with concise headings/descriptions; stacked mobile and three-column desktop layout. |
| Carrier CTA surface | P01 closing section | Deep teal surface, readable light text and white content-sized action; stacked mobile and text/action desktop row. |

The page-level reference is `src/app/(public)/page.tsx`; the opt-in palette is `.marketplace-theme` in `src/app/globals.css`. Trust items, section headings, steps and the CTA are reusable composition patterns, not separately extracted components. Reuse or extract them when a concrete screen needs them; do not prematurely abstract or recolor locked screens. P02 now uses the locked `MarketplaceRouteCard` result variant below; the older `RouteCard` remains unchanged for its other consumers.

#### Results/discovery visual baseline — LOCKED (D-052, 2026-09-18)

P02 Search Results High-Fidelity passed human desktop and mobile browser review. Its current responsive implementation is the V1 visual reference for future search/discovery screens, alongside the unchanged locked P01 foundation. It continues the Clean Marketplace + Friendly European Marketplace direction, deep teal/slate palette, Geist typography, white surfaces, subtle borders and restrained radii/shadows.

| Locked pattern | Reference | Approved treatment |
|---|---|---|
| Compact search summary / modify search | `src/features/public/search-results.tsx`, `search-edit-form.tsx` | Compact white surface showing origin → destination, count-aware vehicle wording and date. Existing modify action reveals responsive labeled controls without an oversized hero; validation and URL handoffs are preserved. |
| MarketplaceRouteCard result variant | `src/components/shared/marketplace-route-card.tsx` | `variant="result"` extends the shared card with route-first hierarchy, waypoints, match explanation, carrier/trust, derived availability, date window and vehicle/non-running compatibility. Detail action remains easy to tap. P01's default compact variant stays unchanged. |
| Match explanation | Result variant | Qualitative match label and matching pickup → delivery segment in a compact soft-teal treatment, with readable wrapping. No invented scores, proximity, trust or detour logic. |
| Alternative routes | Search results and result variant | Separate section after exact results, explanatory copy about the different delivery city, and a neutral “Galimas variantas” treatment. Alternatives must not imply an exact delivery match. |
| Filters and sorting | `src/features/public/search-filters.tsx` | Existing compact controls with standard sizing; desktop disclosure and mobile Sheet, preserving URL state, history and filter/sort behavior. |
| Empty-state flow | `src/components/shared/search-result-states.tsx` | “Neradome tinkamo maršruto” plus explanation and “Sukurti pervežimo užklausą” action, retaining the account-free Request handoff with existing location/date prefill. No new vehicle-count handoff is implied. |
| Responsive results layout | Search results | Single-column cards on mobile/tablet; desktop two-thirds results and one-third supplemental, content-sized map placeholder. Mobile List/Map behavior remains. No Maps/provider integration is implied. |

Tailwind v4 standard spacing/type/height/width/radius scales and shadcn/Base UI sizing remain mandatory. Normal layouts must use grid/flex and content-driven sizing, not fragile absolute positioning. Do not introduce arbitrary custom pixel dimensions. Allow longer translated labels and metadata to wrap, maintain practical touch targets and visible focus, and prevent clipping, overlap and horizontal scrolling. P02 at 390/768/1280/1440px is the responsive reference. Loading and error states follow the same palette/surface treatment.

This visual lock does not change search/matching, capacity, multi-vehicle or multi-location rules. Full routes remain excluded from new matching; no false trust data or additional actions are introduced. P03 Route Detail High-Fidelity is the next separately scoped visual task, not part of this lock.

#### Route-detail visual baseline — LOCKED (D-053, 2026-09-18)

P03 Route Detail High-Fidelity passed human desktop and mobile browser review. Its current responsive browser implementation is part of the V1 design baseline, continuing the Clean Marketplace + Friendly European Marketplace direction, deep teal/slate palette, Geist typography, white surfaces, subtle borders and restrained radii. P01 and P02 remain LOCKED and unchanged.

| Locked pattern | Reference | Approved treatment |
|---|---|---|
| Route-first detail hierarchy | `src/features/public/route-detail.tsx` | Route title is strongest, followed by ordered waypoint summary, existing dates and availability. Route information precedes carrier content; no decorative hero. |
| Route timeline | `src/components/shared/route-stop-list.tsx` | Semantic ordered list, numbered markers, stronger origin/destination and secondary waypoints. Flex columns and content-driven connector lines; public city/country only, no map or absolute positioning. |
| Transport capabilities | RouteDetail | Compact supported-category rows and restrained running/non-running copy, using only current route data. |
| Carrier trust | RouteDetail and unchanged `CarrierTrust` | Public carrier identity, evidence-backed verification, rating/review count and completed transports; compact icon/text rows, completed-transport review previews and existing profile navigation. No invented trust attributes. |
| Desktop action card | RouteDetail | Standard two-column grid composition with a sticky sidebar containing availability, dates, compatibility and the existing Request action. Content determines height. |
| Mobile action card | RouteDetail | Single-column presentation with the action card in normal document flow; no fixed or sticky mobile action bar. Buttons wrap and grow with content. |
| Capacity/unavailable states | RouteDetail and existing availability helpers | Available capacity remains `max(0, capacityTotal - capacityReserved)`. Full routes show “Maršrutas pilnas” and no new Request CTA. Expired/closed non-full routes preserve the existing marketplace fallback; unknown IDs retain the not-found flow. |

Tailwind v4 and shadcn/Base UI standard sizing remains mandatory. Responsive layouts must use grid/flex/content-driven sizing; arbitrary custom pixel dimensions and fragile absolute-positioned layouts are prohibited. Preserve practical touch targets, visible focus, readable wrapping and the reviewed 390/768/1280/1440px behavior.

The targeted Request CTA, location/date/carrier/route URL handoff, account-free browsing/drafting and public-location privacy remain unchanged. The runtime model does not expose search-match context, route flexibility or extra CMR/invoice/tracking attributes; this approval does not authorize inventing them. P04 Carrier Profile High-Fidelity is the next separately scoped visual task. No P04 implementation, backend, Auth, Supabase, i18n rollout or provider work starts with this lock.

#### Carrier-profile visual baseline — LOCKED (D-054, 2026-09-18)

P04 Carrier Profile High-Fidelity passed human desktop and mobile browser review. Its current responsive browser implementation is part of the V1 design baseline, continuing Clean Marketplace + Friendly European Marketplace, deep teal/slate, Geist, white surfaces, subtle borders and restrained radii/shadows. P01/P02/P03 remain LOCKED and unchanged.

| Locked pattern | Reference | Approved treatment |
|---|---|---|
| Compact carrier identity | `src/features/public/carrier-profile.tsx` | Public carrier name leads a compact hero, followed by verified/reputation summary and the existing routes-anchor or Request action. No invented logo/photo. |
| Verified/reputation summary | Unchanged `CarrierTrust` | Evidence-backed verification, rating/review count and completed transports. New carriers show no invented rating or reviews. |
| Public-safe information and trust cards | CarrierPublicProfile | Existing description, registration country where present and service countries; restrained bordered verification card with icon/text and explanatory copy. No fabricated CMR, invoice or tracking claims. |
| Transport capabilities | CarrierPublicProfile | P03-style compact category rows and restrained non-running text, explicitly scoped to current active routes. Derived from existing route data and omitted when no active routes exist; not a fabricated carrier-wide capability record. |
| Active routes | `MarketplaceRouteCard` | Existing result styling with opt-in `context="profile"` suppressing repeated carrier identity/trust. Preserve dates, canonical capacity, compatibility, detail links and active-route eligibility. Default discovery rendering remains unchanged. Empty routes retain the existing Request flow. |
| Reviews | CarrierPublicProfile, following P03 | Author, numeric star rating, comment, completed-transport marker and readable date in white bordered cards; preserve existing filtering, ordering and preview limit. No artificial rating categories or additional reviews. |
| Responsive profile layout | CarrierPublicProfile | Desktop two-column marketplace layout: two-thirds main routes/reviews and one-third public information/trust/capabilities. Mobile stacks in normal document flow with single-column route/review cards. Reference widths: 390/768/1280/1440px. |

P04 remains public and account-free. Do not expose phone, email, private exact address, documents, internal data or private Booking/customer information. Only existing public review previews are rendered. No pre-offer messaging CTA: chat starts only after a Carrier submits an Offer. Existing route and Request navigation remains unchanged.

Tailwind v4 + shadcn/Base UI standard sizing is mandatory. Use grid/flex/content-driven responsive layouts, practical touch targets and wrapping text/buttons. Arbitrary custom pixel dimensions, fragile absolute positioning and fixed content heights are prohibited. P05 Create Request High-Fidelity is the next separately scoped visual task; this lock starts no P05, backend, Auth, Supabase, i18n rollout or provider implementation.

#### Request-wizard visual baseline — LOCKED (D-055, 2026-09-19)

P05 Create Request High-Fidelity passed human desktop/mobile review and the correction pass. Its current browser implementation at 390/768/1280/1440px is the approved Request-wizard reference, continuing the locked P01–P04 teal/slate, Geist and marketplace surface language. Do not visually change P01–P05 under subsequent screen work.

| Locked pattern | Approved treatment and behavior |
|---|---|
| Four-step wizard | Focused form column; desktop step indicator and compact mobile progress. Preserve Route/date → Vehicles → Additional information → Contacts/visibility/review, inline validation, focus and Back/Next retention. |
| Default route and vehicles | Step 1 supplies the default route; newly added vehicles inherit it. Keep 1–10 vehicles with stable local IDs, independent location overrides and existing add/remove rules. One future Offer covers all vehicles; no partial offers. |
| Vehicle scope | Passenger car, SUV/crossover, van/minivan and motorcycle: `car`, `suv`, `van`, `motorcycle`. No generic `other`, heavy machinery or cargo. Lithuanian labels include “Furgonas / mikroautobusas” and “Motociklas”. |
| Shared timing | One requested pickup date/window for the entire Request, retaining existing exact/range/flexible date behavior; no per-vehicle dates. |
| Photos | Each vehicle owns its photos. Preserve local selection, limits, validation and navigation retention; this is not an upload/storage implementation. |
| Compact review | Human-readable aggregate route/date/count plus individual vehicle routes and optional notes, with existing edit actions. Do not repeat the full form. |
| Multi-location summary | All same: “Hamburg → Warsaw”. Different pickups only: “2 paėmimo vietos → Warsaw”. Different deliveries only: “Hamburg → 2 pristatymo vietos”. Both differ: “Kelių vietų pervežimas”. No route optimization. |
| Publication boundary | Public users may start and complete a Request without an account. Progressive registration/contact confirmation belongs at publication. Preserve the current phone-verification handoff, which explicitly does not send a code or publish. P06 remains the existing demo flow. |
| Location privacy | Public locations are city/area/country. Keep exact/private addresses and contacts separate and out of public projections; future backend access is restricted to authorized parties after Booking. This visual lock does not implement that backend. |

References: `src/app/(public)/request/new/page.tsx`, `src/features/public/create-request/` and the unchanged `src/features/public/request-route-summary.ts`. Reuse PublicHeader, PageContainer, LocationPicker, DateWindowPicker and existing shadcn/Base UI primitives. Standard Tailwind v4 spacing/type/size/radius and shadcn/Base UI sizing are mandatory. Responsive layouts use grid/flex/content-driven sizing; arbitrary custom pixel dimensions, fragile absolute-positioned layouts and fixed card heights are prohibited. Preserve natural wrapping, practical touch targets and visible focus.

**Known implementation gap:** Optional Request budget (`budgetAmount?`, `budgetCurrency?`) is **ARCHITECTURE-LOCKED but NOT YET IMPLEMENTED** in the actual P05 Request domain/state. It remains optional desired overall transport guidance, never a per-vehicle price, fixed price, Offer or auto-accept rule. Implement it later together with real Request domain/backend work; do not add budget UI under this lock. `CURRENT_STATUS.md` identifies the model/state/projection files needing future changes.

P06 Published Success High-Fidelity is the next separately scoped visual task. This documentation lock starts no application, backend, Auth, Supabase, i18n rollout, provider or storage work.

#### Published-success visual baseline — LOCKED (D-056, 2026-09-19)

P06 Published Success High-Fidelity passed human desktop and mobile browser review. Its responsive implementation at 390/768/1280/1440px is part of the V1 visual baseline alongside locked P01–P05. Preserve the existing Clean Marketplace + Friendly European Marketplace direction, deep teal/slate palette, Geist and white bordered surfaces.

| Locked pattern | Approved treatment and behavior |
|---|---|
| Restrained success confirmation | Modest Lucide check in a soft-teal surface, semantic success heading and concise supporting copy. Preserve marketplace/targeted wording; no oversized illustrations, confetti, gradients or excessive celebration graphics. |
| Compact published Request summary | Route-first hierarchy with canonical aggregate location summary, shared pickup date/window, audience, vehicle count and each vehicle's public display line/route. Exclude private exact addresses, contacts, notes and photos. |
| “Kas toliau?” | Three concise steps: carrier review, offers visible in the Request, carrier selection. Horizontal desktop grid and stacked mobile list; no pre-Offer messaging or promise of real notifications/provider delivery. |
| Primary/secondary actions | Existing “Peržiūrėti mano užklausą” → `/requests/[id]`; “Grįžti į pradžią” → `/`. Content-sized desktop actions and full-width mobile treatment; no invented Dashboard action. |
| Demo/local visibility | Preserve targeted-only expansion, heading/audience update, accessible status focus/announcement and reset on reload. Explicit fixture lookup, noindex/nofollow and unknown-ID not-found behavior remain unchanged. |

References: `src/app/(public)/request/[id]/published/page.tsx` and `src/features/public/request-published/`. Reuse PublicHeader, PageContainer, Button, Card/CardContent and Lucide. Tailwind v4 + shadcn/Base UI standard sizing is mandatory. Use responsive grid/flex/content-driven layouts with natural wrapping, visible focus and practical touch targets. Arbitrary custom pixel dimensions, fragile absolute positioning and fixed content heights are prohibited.

**Known gaps preserved:** P05 publication still stops at the current local phone-verification/demo boundary without sending a code or publishing. P06 is a demo published state, not real backend persistence; visibility expansion does not save or notify. Notification delivery providers are not implemented. Optional Request budget remains ARCHITECTURE-LOCKED but NOT YET IMPLEMENTED in actual Request domain/state and belongs to later real Request domain/backend work. This visual lock adds no budget UI or Auth/backend integration.

P01–P06 UI/behavior remain unchanged by this documentation lock. P07 Request Detail + Offers High-Fidelity is next, separately scoped; no P07 implementation or backend/Auth/Supabase/i18n/provider work starts here.

#### Request Detail + Offers visual baseline — LOCKED (D-057, 2026-09-20)

P07 High-Fidelity passed human desktop and mobile browser review. Its current responsive browser implementation is part of the V1 visual baseline alongside locked P01–P06, continuing the Clean Marketplace + Friendly European Marketplace direction, deep teal/slate, Geist and white bordered surfaces.

| Locked pattern | Approved treatment and behavior |
|---|---|
| Compact Request summary/status | Route-first aggregate summary, vehicle names/count, shared pickup window, visibility and readable existing Request status. Preserve public/private location separation and existing permitted actions. |
| Offer comparison list | Content-driven cards with carrier identity, existing CarrierTrust, total price, pickup/delivery dates, expiry, available payment terms, status and revision indicator. No fabricated trust or commercial data. |
| Total-price hierarchy | Total EUR price is a primary comparison element. One Offer covers the complete Request and all vehicles/routes; retain explicit multi-vehicle price scope. No partial Offer, per-vehicle acceptance or partial Booking. |
| Offer states | Existing pending/updated treatment, selected Offer emphasis and readable secondary expired/declined/unavailable/historical states. Status meaning is conveyed in text, not only color. |
| Offer/Conversation navigation | Existing eligible “Peržiūrėti pasiūlymą” links to `/offers/[id]`. Conversation entry exists only after an Offer and uses existing `/messages/[conversationId]` links; revisions reuse the same conversation. No pre-Offer messaging. |
| Request details | Reuse canonical multi-vehicle and multi-location summaries; preserve individual vehicle routes, capabilities/condition, local photos and notes. Editing remains governed by existing lifecycle/validation/invalidation rules. |
| Zero-offers state | Clear empty state without guaranteed offers, countdowns or public-contact suggestions. Preserve existing targeted visibility-expansion action and local behavior. |
| Accepted/closed states | Selected Carrier and Offer, collapsed prior Offers and existing Booking destination where allowed. Closed requests stay closed; repeat creates a local draft. P07 does not independently accept Offers or create Bookings. |
| Responsive layout | Desktop two-column comparison/details layout, normal-flow mobile stacking, wrapping labels and comfortable actions. Preserve keyboard focus and confirmation-dialog behavior. |

References: `src/app/(public)/requests/[id]/` and `src/features/public/request-detail/`. Reuse PublicHeader, PageContainer, Button, Card, CarrierTrust, vehicle/location helpers and existing P05 editor primitives without modifying locked screens. Tailwind v4 + shadcn/Base UI standard sizing is mandatory; use grid/flex/content-driven layouts. Arbitrary custom pixel dimensions, fragile absolute positioning and tightly fitted text containers are prohibited.

**Known gaps preserved:** current data and actions remain fixture/demo based with a fixed review clock and local state, without real backend persistence or Auth. Notification delivery providers are not implemented. Optional Request budget remains ARCHITECTURE-LOCKED but NOT YET IMPLEMENTED in actual Request domain/state and is deferred to real Request domain/backend work.

P01–P07 UI/behavior remain unchanged by this documentation lock. P08 Offer Detail High-Fidelity is next, separately scoped. No P08 implementation, backend, Auth, Supabase, i18n rollout or provider work starts here.

#### Offer Detail visual baseline — LOCKED (D-058, 2026-09-20)

P08 Offer Detail High-Fidelity passed human desktop and mobile browser review. Its current responsive implementation joins locked P01–P07 as the V1 visual source of truth, preserving Clean Marketplace + Friendly European Marketplace, deep teal/slate, Geist and restrained white bordered surfaces.

| Locked pattern | Approved treatment and behavior |
|---|---|
| Price and complete Request scope | Visually dominant canonical total Offer price, with count-aware scope copy. One Offer covers every vehicle and route in the complete Request; no partial Offer or partial acceptance. |
| Offer terms | Compact readable pickup, planned delivery, validity and payment terms, plus existing comments. Latest terms remain authoritative; existing revision history is expandable and read-only. |
| Carrier trust sidebar | Existing verified/reputation data and profile link using CarrierTrust. Sticky desktop action/trust column; normal-flow mobile stacking. No fabricated trust or private contacts. |
| Conversation entry | Existing canonical Conversation navigation only because an Offer exists; availability follows existing lifecycle. No pre-Offer messaging or embedded transcript. |
| Decision actions and dialogs | Primary Accept Offer, secondary Decline Offer, existing accessible confirmation dialogs and cancel-first focus. Explicit complete-Request terms; no automatic acceptance or skipped confirmation. |
| Lifecycle presentation | Accepted, declined, expired and unavailable states follow existing eligibility/status logic and suppress inappropriate actions. Existing accepted Booking fixtures link to their Booking; local acceptance does not fabricate one. |
| Request/vehicle summary | Reuse canonical multi-vehicle/multi-location summaries, individual public routes and shared requested pickup window. Preserve private-address separation. |
| Responsive layout | Content-driven two-column desktop layout and normal-flow mobile cards, readable wrapping, visible focus and comfortable controls. Reference widths: 390/768/1280/1440px. |

References: `src/app/(public)/offers/[id]/` and `src/features/public/offer-detail/`. Tailwind v4 + shadcn/Base UI standard sizing is mandatory. Use grid/flex/content-driven responsive layouts; no arbitrary custom pixel dimensions or fragile absolute-positioned page layouts.

**Known gaps preserved:** fixture/demo data and fixed review clock; local decisions reset on reload without backend persistence, real Booking creation or propagated Request/competing-Offer/Conversation changes. Auth, notification providers and payment processing/escrow are not implemented; payments/escrow remain outside V1 scope. i18n/label normalization remains pending. Optional Request budget is architecture-locked but absent from actual Request domain/state.

This documentation-only approval changes no P01–P08 UI or behavior. P09 Customer Dashboard High-Fidelity is next, separately scoped; no P09, backend, Auth, Supabase, i18n, provider or payment work starts here.

### Mobile/performance

- Customer and Carrier UI: mobile-first.
- Admin: desktop-first, responsive.
- Map modules are lazy-loaded and must not block list content.
- List must work without Map provider availability.
- Skeletons instead of page-blocking spinners where practical.

## 3. Planned Next.js routes

See `02_V1_SCREEN_MAP.md` for the canonical URL map.

Next.js route groups may be used for code organization, but route grouping is not an authorization boundary.

## 4. Domain entities / planned tables

The final SQL schema may split or merge implementation details, but the following domain entities must exist conceptually.

### Identity / account

- `users`
- `carrier_profiles`
- organization/membership support should not be blocked by the V1 schema even if V1 UI starts with one main carrier user
- contact verification state

Minimum Customer identity fields are `id`, `name`, `email`, `phone`, `preferred_locale`, optional `email_verified_at` and optional `phone_verified_at`. Future `spoken_languages` is optional and is not required at registration. Carrier Profile readiness includes separate `verified_carrier`, `cmr_insurance_available`, `cmr_insurance_verified`, `invoice_available` and `live_tracking_available` facts, with optional evidence/coverage/company metadata rather than fabricated UI claims.

### Carrier verification

- `carrier_verifications`
- `carrier_documents`

### Customer demand

- `transport_requests`
- `request_vehicles`
- `request_versions`

`transport_requests` may store optional `budget_amount` + `budget_currency` for the customer's overall desired transport budget. It is neither an Offer, a fixed price nor an acceptance condition.

`transport_requests` owns default pickup/delivery locations and the shared pickup window. Each Request owns 1–10 ordered `request_vehicles` with a stable vehicle ID and vehicle-specific structured pickup/delivery locations, category, make/model, optional year, condition, rolling ability and photos. Vehicle locations become canonical after an override; Request defaults exist for inheritance and convenience.

### Carrier supply

- `carrier_routes`
- `route_stops`
- `route_versions`
- `route_distribution_jobs`

Persisted Carrier Route readiness includes `route_flexible boolean`. It expresses willingness to deviate by agreement only; there is no V1 `max_detour_km` or distance-based detour matcher. Canonical future public lifecycle is `draft` → `published` → `expired`/`cancelled`; current mock “active” Routes map to `published` during persistence migration.

### Commercial flow

- `offers`
- `offer_revisions`
- `bookings`

### Communication / operations

- `conversations`
- `messages`
- `booking_activity`
- `notifications`

### Trust / support

- `reviews`
- `reports`
- `saved_carriers`
- `audit_logs`

## 5. Key relationships

```text
USER
 ├─ may own/use CUSTOMER capabilities
 └─ may have CARRIER PROFILE
        ├─ VERIFICATION / DOCUMENTS
        └─ CARRIER ROUTES
              └─ ROUTE STOPS / ROUTE VERSIONS

TRANSPORT REQUEST
 ├─ 1–10 REQUEST VEHICLES
 ├─ REQUEST VERSIONS
 ├─ OFFERS
 │    ├─ OFFER REVISIONS
 │    └─ accepted → BOOKING
 └─ REQUEST + CARRIER → one CONVERSATION
      ├─ MESSAGES
      └─ optional BOOKING link after acceptance

BOOKING
├─ linked winning CONVERSATION (not a new thread)
 ├─ BOOKING ACTIVITY
 ├─ REPORTS
 └─ REVIEWS
```

## 6. Location model

Do not store only a free-text string such as `"Hamburg"`.

A structured location should include enough data for matching and display, such as:

- `display_name`
- `city`
- `region` when useful
- `country`
- `country_code`
- `latitude`
- `longitude`
- `provider_place_id`

Transport Request must distinguish public location from private operational details.

Example public pickup:

- Hamburg, Germany

Example private operational pickup data:

- exact address;
- facility/auction name;
- gate;
- private contact;
- instructions.

The backend schema must enforce two levels rather than relying on hidden UI:

- `public_location`: city/area, country and future coordinates/structured place reference, safe for marketplace discovery and distribution;
- optional `private_address`: street, postal code, city, country and access instructions, visible only to selected/authorized parties after Booking.

Each Request/Booking vehicle pickup and delivery must be able to retain both references. The current structured `Location` model remains the public-level base and does not need a frontend migration during this architecture lock. Phone numbers and exact addresses are never included in public projections or Route distribution payloads.

## 7. Date and time model

Calendar/business dates such as “pickup date Sep 16” should be represented as date-only values where appropriate, not accidentally shifted by UTC conversion.

Event timestamps such as:

- Offer created;
- status changed;
- message sent;
- Offer expires;

should use normalized timestamp storage and explicit timezone-aware display rules.

Pickup time is displayed/interpreted in the pickup location's local time context, not blindly in the viewer's device timezone.

## 8. Route capacity model

Recommended fields:

- `capacity_total`
- `capacity_reserved`

Derived:

`available_capacity = max(0, capacity_total - capacity_reserved)`

Rules:

- Offer creation does not reserve capacity.
- Each Request vehicle consumes exactly one space regardless of category or route segment. V1 has no fractional capacity, size coefficients or segment-based capacity reuse.
- Request capacity demand is its complete `request_vehicles` count. Every vehicle pickup/delivery must be directionally compatible with the Route, and the Route must have available capacity and category/non-running capability for the complete set; matching remains advisory until acceptance checks.
- Booking acceptance atomically increases `capacity_reserved` by the Request vehicle count; eligible Booking cancellation releases the same count.
- Available capacity never becomes negative, reservation cannot exceed available capacity, and carrier capacity cannot be reduced below `capacity_reserved`.
- Zero available capacity derives the Full state and excludes the Route from new recommendations without deleting the Route.
- Route may remain Published while `accepting_new_requests = false`.

## 9. Versioning model

Use versioning to prevent stale commercial actions.

### Request

Material Request edit increments `request_version` and writes Request version history. Material edits include default route/date changes; adding/removing a vehicle; and vehicle pickup/delivery, category, make/model, year, condition or rolling-ability changes when relevant. Vehicle photo and Request note changes are non-material.

### Route

Material Route edit increments `route_version` and writes Route version history.

### Offer

Offer edit increments `offer_version` and writes Offer revision history.

Offer stores the Request version and Route version against which it was created/revalidated.

One Offer covers all Request vehicles and all their routes, and stores one total price for the complete Request. V1 has no Offer line items, partial vehicle selection or partial acceptance. All vehicles share one requested pickup date/window; per-vehicle requested date windows and route optimization are deferred.

### Accept Offer checks

The server must confirm the versions expected by the customer still match current valid versions before accepting.

If not, return a stale-data response and make the user review updated terms.

## 10. Conversation architecture

The Conversation aggregate is created by Offer submission, never before an Offer. Enforce a unique Request + Carrier identity. `current_offer_id` points to the carrier's current Offer, so Offer revisions reuse the existing Conversation rather than creating another thread.

Canonical Conversation fields:

- `id`
- `request_id`
- `carrier_id`
- `current_offer_id`
- optional `booking_id`
- `status`: `active`, `archived`, or completed/read-only equivalent
- `created_at`
- `last_message_at`

Canonical Message fields:

- `id`
- `conversation_id`
- `type`: `user` or `system`
- `sender_type`: customer, carrier or system
- optional `sender_id`
- `body`
- `created_at`
- optional `read_at`

Pending and revised Offers keep their Conversation active. Accepting an Offer atomically links the winning Conversation to the Booking and keeps it active while archiving the Request's competing Conversations. Terminal non-winning Offers archive their Conversations. Completed Booking history remains accessible and may be read-only in V1.

`/messages/[conversationId]` is the only canonical detail route before and after Booking. Authorization must verify that the viewer participates in the Request/Carrier/Booking context. V1 UI is text-only and local/mock; it does not claim persistence or realtime transport.

Creating a user Message establishes the `message.created` domain-event boundary. The future notification layer consumes it for in-app notification and transactional email; SMS is off by default. Conversation UI must not invoke email or SMS providers directly.

## 11. Booking snapshot architecture

Do not render the contractual/commercial agreement by joining only to current mutable Request/Route/Offer/Profile values.

At acceptance time, Booking stores an agreement snapshot or equivalent immutable fields containing the accepted state.

Canonical B01 Booking fields include `id`, `request_id`, `accepted_offer_id`, `accepted_offer_version`, `carrier_id`, `conversation_id`, snapshotted `vehicles`, `agreed_total_price`, `currency`, `payment_terms`, `requested_pickup_window`, `planned_pickup`, `planned_delivery`, one aggregate `status` and `created_at`. The carrier identity needed to render the agreement is snapshotted or otherwise preserved alongside its reference.

Every snapshotted vehicle retains its accepted make/model/category/year/condition plus its own pickup and delivery location. Later Request, Offer, Route or Profile mutation must not change those B01 agreement values.

V1 uses one aggregate Booking lifecycle for the complete Request: `booked` → `pickup_scheduled` → `collected` → `in_transit` → `delivered` → `completed`. There is no per-vehicle status model. Delivered becomes Completed only after customer confirmation (or a future explicit Admin override path); accepted terms remain read-only in B01.

The Booking stores the accepted Offer Conversation ID and B01 links to `/messages/[conversationId]`. It never creates `/bookings/[id]/chat` or another Conversation.

Important searchable Booking fields may also be duplicated in structured columns for queryability; the snapshot exists to preserve agreement meaning/history.

Operational details remain mutable and logged separately.

## 12. Server-side business layer

Important actions must run through explicit server-side business functions/server actions/API handlers rather than a sequence of independent client mutations.

Examples:

- `publishTransportRequest()`
- `updateTransportRequest()`
- `createCarrierRoute()`
- `updateCarrierRoute()`
- `submitOffer()`
- `updateOffer()`
- `acceptOffer()`
- `cancelBooking()`
- `updateBookingStatus()`
- `submitVerification()`
- `createReport()`
- `resolveReport()`
- `moderateReview()`

### `acceptOffer()` atomic responsibilities

At minimum:

1. authenticate/authorize customer;
2. load and lock/validate relevant Offer/Request/Route data;
3. check Offer status and expiration;
4. check Offer version;
5. check Request status/version;
6. check Route lifecycle/version as required;
7. check route acceptance/capacity;
8. reserve capacity;
9. set Offer Accepted;
10. set Request Booked;
11. mark competing eligible Offers Not Selected;
12. create Booking agreement snapshot;
13. link/reuse the conversation;
14. generate activity/audit records;
15. generate notifications;
16. commit atomically.

Double-submit must be idempotent/safely handled.

## 13. Authorization model

Authorization must be enforced server-side.

Knowing `/bookings/123` is not sufficient to access Booking 123.

Typical policy examples:

- Public may search/view public routes/profiles.
- A User may manage their own Requests.
- Only eligible carrier users may access carrier-only Request marketplace details.
- Only the carrier tied to a Booking may perform carrier status actions.
- Only Booking participants/admin can view private Booking operational data/conversation.
- Only authorized Admin roles can access verification files/internal notes.

Supabase Row Level Security may be used as an additional defense, not as a substitute for well-defined application business rules.

## 14. Authentication architecture

V1 target is progressive, passwordless authentication rather than registration-first UX.

Customer flow:

1. Browse/search/view public Route and Carrier pages without an account.
2. Start and complete a Transport Request locally.
3. At Publish, show “Patvirtinkite kontaktus ir paskelbkite užklausą”.
4. Verify identity/contact and automatically create or reuse the Customer account.
5. Preserve the pending action/deep link and publish only after authorization checks.

Phone verification remains required for V1 Request publication as an anti-spam/trust gate. Possible passwordless identity methods include email OTP, magic link, phone OTP, Google and Apple; no provider is selected and no traditional password/reset architecture is required. Dashboard, Offers, Chat, Offer acceptance, Booking and Notifications are authenticated surfaces.

Carrier browsing is public, but authentication is required before creating/publishing a Route, submitting an Offer, messaging or managing Bookings. Carrier publication/Offer eligibility additionally uses contact, business and trust-verification policy. Provider and onboarding UI implementation remain future scope.

## 15. Storage / files

Planned Supabase Storage use cases:

- vehicle/request photos;
- Booking/report evidence;
- carrier verification documents.

Requirements:

- verification/private files must not use permanent public URLs;
- authorization controls access;
- uploads validate file type/size;
- user-facing delete should not silently destroy evidence needed for active disputes/audit/legal retention.

## 15A. Internationalization architecture

Canonical source/fallback locale is English (`en`). Initial locale identifiers are `en`, `lt`, `de`, `nl`, `fr`, `pl`, `ro`, `uk` and `ru`. Resolve locale in this order: saved supported `preferred_locale`, supported browser locale, English.

Translation keys cover navigation, controls, forms, validation, empty states, lifecycle/status labels, system messages, Notifications, transactional email/SMS and Route-distribution templates. Normal domain entities store canonical/user-entered content once; Chat messages, carrier comments and Request notes are not machine-translated in V1. A future `spoken_languages[]` profile field is optional and separate from UI locale.

Formatting adapters accept locale and use locale-aware date, number and currency formatting. Persist date-only business dates, normalized timestamps, numeric monetary amounts and ISO currency codes; do not store preformatted Lithuanian strings in domain/backend records. Existing Lithuanian frontend formatters remain unchanged until the separately scoped rollout.

## 15B. Route distribution architecture

`carrierRoute.published` is the domain boundary emitted after an authorized, eligible transition to `published`. Distribution processing additionally verifies available capacity > 0. Draft, ineligible or full Routes create no distribution jobs.

Flow:

`Carrier Route → carrierRoute.published → Route Distribution Service → channel-specific RouteDistributionJob`

Canonical `RouteDistributionJob` fields are `id`, `route_id`, channel (`telegram`, `facebook`, `whatsapp`), `target_id`, `locale`, mode (`automatic`, `manual`), status (`pending`, `published`, `manual_required`, `failed`), immutable `payload_snapshot`, optional `external_post_id`, `created_at`, optional `published_at` and optional `error`. Carrier Route remains provider-agnostic.

`payload_snapshot` can contain public origin/destination/waypoints, departure/date, available spaces, supported light-vehicle categories, non-running compatibility, `route_flexible`, public carrier trust indicators, localized CTA and canonical `/routes/[routeId]`. It excludes exact/private addresses and contact data. Route edits/version changes do not silently mutate historical external posts.

Create one job per channel/target/locale according to distribution policy. Future processing must be idempotent, using a stable publication-event/version + channel + target + locale key. Telegram is intended as the first automated adapter; Facebook Groups use generated manual post packages unless supported capability is established; WhatsApp is future opt-in Business messaging and never assumes arbitrary group posting. No provider/API is selected or integrated by this architecture lock.

## 15C. V1 vehicle-domain boundary

Supported V1 categories are passenger car, SUV/crossover, van/minivan and motorcycle. Excavators, heavy/agricultural machinery, loose freight, engines/standalone cargo and heavy commercial equipment require different dimensions, weight, payload, trailer and regulatory models and remain outside V1. The existing integer capacity rule stays limited to supported light vehicles.

## 16. Notifications architecture

Use domain-event-driven notification creation rather than scattering ad hoc notification logic across UI components.

Locked N01 domain events:

- `offer.created`
- `offer.updated`
- `offer.accepted`
- `message.created`
- `booking.created`
- `booking.pickupScheduled`
- `booking.collected`
- `booking.inTransit`
- `booking.delivered`
- `booking.completed`

V1 does not need Kafka or a complex external event bus; a simple application/domain event pattern is sufficient.

Future backend flow:

`Domain Event → Recipient Resolution → Notification Policy → In-App Notification → optional Email Delivery → optional SMS Delivery`

Recipient resolution removes the event actor after resolving the policy, preventing self-notifications. An actor-free system event notifies the relevant parties according to its policy.

Canonical Notification fields are `id`, `source_event_id`, `recipient_id`, `event_type`, optional `actor_id`, `title`, `body`, stored canonical `href`, `created_at`, optional `read_at`, `entity_type` and `entity_id`. Entity types in this boundary are Offer, Conversation and Booking.

Channel delivery state is separate from Notification. A future `notification_deliveries` record contains `notification_id`, channel (`in_app`, `email`, `sms`), delivery status, idempotency key, optional sent timestamp and optional failure reason. Provider credentials/state do not belong in the base Notification model.

V1 policy:

| Event | Recipients before self-suppression | In-app | Email | SMS |
|---|---|---:|---:|---:|
| `offer.created` | Customer | Yes | Immediate | No |
| `offer.updated` | Customer | Yes | Immediate | No |
| `offer.accepted` | Internal transition only | No | No | No |
| `message.created` | Other Conversation participant | Yes | Unread fallback | No |
| `booking.created` | Customer + selected carrier | Yes | Immediate | Yes |
| `booking.pickupScheduled` | Customer | Yes | Immediate | Yes |
| `booking.collected` | Customer | Yes | Immediate | No |
| `booking.inTransit` | Customer | Yes | Immediate | No |
| `booking.delivered` | Customer | Yes | Immediate | Yes |
| `booking.completed` | Customer + carrier | Yes | Immediate | No |

`offer.accepted` remains a valid internal event for the Offer lifecycle transition, Conversation system event, Booking creation trigger and archiving losing Conversations. It must not independently materialize Notification or delivery records. `booking.created` is the sole customer-facing confirmation of successful acceptance because the canonical Booking ID now exists; it notifies the customer and selected carrier and stores `/bookings/[bookingId]` as its destination.

For `message.created`, future email delivery waits approximately 10 minutes, checks that the message/Conversation is still unread, and debounces or batches repeated messages. It does not send one email per message and does not use SMS by default. Chat UI never calls delivery providers.

Domain-event processing and every channel delivery must be idempotent. The same `booking.created` retry uses a stable event + recipient + channel key so it cannot create duplicate in-app Notifications or duplicate email/SMS sends. Offer, Chat and Booking UI emit/establish domain boundaries only; they never invoke providers directly.

In-app history remains authoritative. Future preferences may reduce optional channels, while critical transactional classes (OTP/auth, accepted Booking, pickup schedule and Delivered) remain distinct from normal transactional Offers, Chat fallback and routine progress. Provider selection and preference persistence are deferred to backend work.

The camel-case Booking lifecycle events above establish the future notification boundary for B01. The current frontend does not emit notifications or call email, SMS or push providers.

## 17. Analytics architecture

Track a small set of product funnel events from authoritative business actions when possible:

Customer:

- `search_submitted`
- `search_no_results`
- `route_viewed`
- `request_started`
- `request_published`
- `offer_received`
- `offer_viewed`
- `offer_accepted`
- `request_closed`
- `carrier_saved`

Carrier:

- `carrier_onboarding_started`
- `carrier_onboarding_completed`
- `verification_submitted`
- `verification_approved`
- `route_created`
- `match_viewed`
- `request_viewed`
- `offer_sent`
- `offer_updated`
- `offer_accepted`
- `route_closed_to_new`
- `booking_completed`

Avoid counting the same business action solely from fragile client clicks when the authoritative server action can emit the event.

## 18. Admin data architecture

- Lifecycle status is separate from moderation status.
- Admin overrides record actor, time, old/new value and reason.
- Audit log is immutable through normal UI.
- Admin data tables must support server-side filtering/sorting/pagination at scale.
- User suspension does not cascade into silent Booking cancellations.

## 19. Development UI catalog

Create a development-only route such as `/dev/components` containing production reusable components with mock states:

- RouteCard variants;
- CarrierTrust variants;
- RequestCard variants;
- OfferCard variants;
- BookingStatus variants;
- StatusBadge variants;
- EmptyState;
- form controls.

This acts as a lightweight component catalog without requiring Storybook in V1.

## 20. Testing priorities

Highest-risk flows should receive tests early:

- Offer acceptance concurrency/idempotency;
- route capacity never goes negative;
- stale version acceptance blocked;
- authorization of private Booking/conversation data;
- verification-gated Offer creation;
- material Request/Route edits invalidate only appropriate Offers;
- Booking snapshot remains unchanged after source objects change;
- cancellation releases reservation only once;
- lifecycle vs moderation remain independent.
