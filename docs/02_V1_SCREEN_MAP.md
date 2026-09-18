# Parvezk.lt V1 — Canonical Screen Map

**Last consolidated:** 2026-09-17.

This document defines the canonical V1 screen IDs and intended URLs. Screen IDs are product references; URLs are implementation targets and may be adjusted only deliberately.

## 1. Public / Customer screens

| ID | Screen | Primary purpose | Planned URL |
|---|---|---|---|
| P01 | Home | Search for routes or start getting carrier offers | `/` |
| P02 | Carrier Search Results | Compare matching Carrier Routes in List + Map | `/search` |
| P03 | Carrier Route Detail | Understand one route and request an Offer from that carrier | `/routes/[id]` |
| P04 | Carrier Public Profile | Trust/reputation, verification, active routes, reviews | `/carriers/[id]` |
| P05 | Create Transport Request | 4-step mobile-first Request wizard | `/request/new` |
| P06 | Request Published | Success state and visibility expansion CTA | `/request/[id]/published` |
| P07 | Request Detail + Offers | Request status, details, Offers, edit/close actions | `/requests/[id]` |
| P08 | Offer Detail | Offer terms, contextual conversation, accept/decline | `/offers/[id]` |
| P09 | Customer Dashboard | Requests, active transports, history, attention items | `/dashboard` |
| P10 | Saved Carriers | Customer bookmarks of carriers | `/saved-carriers` |

### P01 Home key rules

**High-Fidelity status: LOCKED** after human desktop and mobile browser review (2026-09-17). The current responsive P01 browser UI is the V1 visual baseline and reference for P02/P03; see D-051 and the visual patterns in `03_TECHNICAL_ARCHITECTURE.md`. Do not redesign P01 under subsequent screen work.

- Search works without login.
- Required: From, To.
- Date optional; empty means “Bet kada”.
- Primary CTA: “Rasti vežėją”.
- Secondary CTA: “Gauti vežėjų pasiūlymus”.
- Active routes section appears only when real routes exist.

### P02 Search key rules

**High-Fidelity status: LOCKED** after human desktop and mobile browser review (2026-09-18). The current responsive P02 browser implementation is the V1 results/discovery visual baseline under D-052. Its compact search summary/editor, `MarketplaceRouteCard` result variant, match explanations, separate alternatives and account-free empty-state Request flow are locked; see `03_TECHNICAL_ARCHITECTURE.md`. P01 remains LOCKED and unchanged.

- Search state and filters persist in URL.
- Desktop List + Map; mobile defaults to List with Map toggle.
- Map is lazy-loaded and supplemental.
- No route price.
- Sorting: best match, closest date, best rated.
- V1 uses “Rodyti daugiau”, not infinite scroll.
- No results → CTA to P05 with prefilled search values.
- Approximate/alternative results are visually separated from exact results.
- Matching uses the requested vehicle count and excludes a Route when derived available capacity is smaller. Route cards continue to show “Laisvos vietos: N”; full Routes do not appear as available results.

### P03 Route detail key rules

- Route information precedes carrier marketing.
- Show planned route, dates, capacity, vehicle compatibility, carrier trust.
- Public route does not expose live GPS.
- One primary CTA: “Gauti pasiūlymą iš šio vežėjo” when capacity is available.
- Capacity uses “1 laisva vieta”, “2 laisvos vietos” and “Maršrutas pilnas”. A full Route remains directly viewable in a read-only state and does not show a misleading active Request CTA.
- Other unavailable states may retain the marketplace Request fallback where appropriate.
- Future persisted Routes may show “Maršrutas lankstus” when `routeFlexible` is true. This is informational in V1; it does not add detour-distance matching or expose a private address/contact.
- `/routes/[id]` is the canonical public destination for localized external Route-distribution CTAs.

### P04 Carrier profile key rules

- Shows public profile, current verification details, active routes, verified Booking reviews.
- No phone/email/private documents/direct open message action.
- New carrier without reviews is “Naujas vežėjas”, not rating 0.0.

### P05 Request wizard key rules

4 steps:

1. Default route + shared pickup date/date window/flexible date.
2. “Automobiliai”: 1–10 vertically stacked vehicle cards, each with category/make/model/year/condition, conditional rolling ability, its own photos and structured pickup/delivery locations. The first vehicle cannot be removed; additional vehicles can be added or removed without clearing other values.
3. Additional notes.
4. Contact + visibility + legal acknowledgement + Phone OTP if needed.

Each vehicle initially inherits the Step 1 default route. Its card shows “Naudoti pagrindinį maršrutą: [From] → [To]” and an accessible “Keisti šio automobilio maršrutą” control that reveals vehicle-specific pickup and delivery pickers. Vehicle 1 may also override. Vehicles retain independent locations; all share the Request pickup date/window. Every vehicle validates independently before continuing. Step 4 uses compact route and vehicle summaries rather than repeating all cards.

Targeted flow must tell the customer before publish whether only the selected carrier or also other matching carriers will see the Request.

An optional overall transport budget may be added in a future data-backed P05 iteration without becoming a fixed price or per-vehicle price. It is not required to publish, and carriers still submit independent Offers.

The form remains usable locally without an account. Authentication/contact confirmation is gated at the final Publish action with the concept “Patvirtinkite kontaktus ir paskelbkite užklausą”; V1 retains verified phone as the publication anti-spam/trust requirement. Do not redesign P05 until this backend/auth phase is explicitly scoped.

### P06 Published key rules

Success state only. No fake “X carriers notified” claims.

Summary supports 1–10 vehicles and same-route, multiple-pickup, multiple-delivery or mixed-location Requests using shared compact summaries. It does not expose vehicle photos.

Targeted-only Requests can be expanded to Marketplace visibility.

### P07 Request detail key rules

Customer UI uses human labels, e.g.:

- Draft → Juodraštis
- Active → Ieškoma vežėjo
- Booked → Vežėjas pasirinktas
- Completed → Pervežimas užbaigtas
- Closed → Užklausa uždaryta

Offers live in this screen; there is no separate Offer List screen.

Show a dedicated “Automobiliai (N)” section with each vehicle's pickup → delivery route, category, make/model, optional year, condition, conditional rolling ability and photos.

Adding/removing a vehicle or changing its pickup/delivery, category, make/model, year, condition or rolling ability when relevant is material. Default route and pickup-date changes remain material. Material Request edits increment Request version and invalidate pending Offers; Request notes and vehicle photos remain non-material.

Closing a Request does not later re-open the same object; repeating creates a new Draft.

### P08 Offer detail key rules

- Price shown as final transport price.
- For multiple vehicles, price copy explicitly says it covers the complete vehicle set. One Offer remains Request-level; there is no per-vehicle price, selection or partial acceptance.
- “Jūsų užklausa” lists every vehicle with its pickup → delivery route, and acceptance confirmation states that the Offer covers all vehicles and routes in the complete Request.
- Payment terms shown separately.
- An Offer creates/reuses the Request + Carrier conversation. “Rašyti vežėjui” links to `/messages/[conversationId]`; an Offer revision keeps the same thread.
- Accept uses confirmation screen/dialog and atomic server transaction.
- Stale Offer/Request/Route version prevents acceptance and forces re-review.

### P09 Dashboard key rules

- Customer overview route: `/dashboard`.
- Page order: title, primary “Sukurti naują užklausą” action to `/request/new`, conditional “Reikia dėmesio”, then the “Užklausos”, “Pervežimai” and “Istorija” tabs.
- “Reikia dėmesio” appears only when an Active Request has at least one actionable Pending Offer. Show route, vehicle, Request status, actionable Offer count and whether it is a new or updated Offer. An actionable Offer with `offer_version > 1` uses “Atnaujintas pasiūlymas”; otherwise use “Naujas pasiūlymas”. Updated Offers sort before other actionable Offers. The only action is “Peržiūrėti pasiūlymus” to `/requests/[id]`.
- “Užklausos” contains Active targeted and marketplace Requests only. Cards show route, vehicle, requested pickup date/window, visibility, “Ieškoma vežėjo”, Offer count and “Peržiūrėti užklausą” to `/requests/[id]`. A zero-Offer card says “Pasiūlymų dar nėra”. Persisted Drafts, Booked, Completed and Closed Requests do not appear here.
- “Pervežimai” contains Booked Requests only. Cards derive the accepted Offer and Booking link from existing data and show route, vehicle, selected carrier, pickup, planned delivery, “Vežėjas pasirinktas” and “Atidaryti pervežimą” to `/bookings/[bookingId]`. Competing Offers are omitted. P09 does not add Booking lifecycle states; B01 may remain unavailable during the frontend phase.
- “Istorija” contains Completed and Closed Requests only. Cards show route, vehicle, “Pervežimas užbaigtas” or “Užklausa uždaryta”, a relevant date, carrier where relevant and a read-only detail link, preferring `/requests/[id]`. Booked Requests do not appear and Closed Requests cannot be reopened.
- Objects belong to exactly one lifecycle tab. Ordering within tabs is stable and deterministic; there is no complex ranking.
- Dashboard actions only navigate. Accept, decline, edit, close, reopen and Booking changes remain on detail screens.
- Whole-dashboard empty state: “Čia dar nieko nėra”, “Sukurkite pirmą pervežimo užklausą ir gaukite vežėjų pasiūlymus.” and “Sukurti užklausą” to `/request/new`. Tab empty states are “Aktyvių užklausų nėra”, “Aktyvių pervežimų nėra” and “Istorija tuščia”.
- Loading uses skeletons. Error UI is concise and includes retry; do not use a fullscreen spinner.
- Mobile keeps “Reikia dėmesio”, tabs and vertically stacked cards in that order. Use a responsive three-item tab control with approximately 44px touch targets and no page-level horizontal scrolling or desktop tables.
- Browser-review fixtures cover mixed (default), Requests-only, active-transport-only, History-only and completely empty Dashboard states. A non-UI query selector may select these fixtures. Do not show mock/demo notices.
- P09 reuses P07/P08 Request, Offer, carrier, status, accepted-Offer and Booking-link data. A small derived view model and the minimum Completed history fixture are allowed; do not create an incompatible Dashboard Request model.
- Attention, Request, Transport and History cards use shared compact vehicle and route summaries; multi-location cards use wording such as “2 paėmimo vietos → Kaunas” or “Kelių vietų pervežimas” and never expand all vehicle routes. At least one mixed review fixture contains multiple vehicles.
- Real authentication is deferred. The frontend/mock route must expose no private customer contacts.
- No vanity KPI dashboard, spending totals, response analytics, marketplace statistics, fake unread state/counts, fake notifications, backend, persistence, payments, messages or direct management actions.

### P10 Saved carriers key rules

- Bookmark only; no subscription/alert engine in V1.
- Current verification/availability is shown live, not snapshotted from save time.

---

## 2. Carrier screens

| ID | Screen | Primary purpose | Planned URL |
|---|---|---|---|
| C01 | Carrier Onboarding | Create Carrier Profile / company or self-employed details | `/carrier/onboarding` |
| C02 | Verification Center | Manage carrier/contact/company/document verification | `/carrier/verification` |
| C03 | Carrier Dashboard | Attention items, routes, matches, offers, active transports | `/carrier` |
| C04 | Add Route | 4-step route wizard | `/carrier/routes/new` |
| C05 | Edit Route | Edit route/capacity/compatibility and revalidate Offers | `/carrier/routes/[id]/edit` |
| C06 | My Routes | Upcoming/draft/past/cancelled route lists | `/carrier/routes` |
| C07 | Route Management | One route as work center: matches, offers, bookings | `/carrier/routes/[id]` |
| C08 | Matching Requests | Requests matched to a specific route | `/carrier/routes/[id]/matches` |
| C09 | Browse Requests | Manual marketplace Request discovery | `/carrier/requests` |
| C10 | Request Detail | Carrier view of one customer Request | `/carrier/requests/[id]` |
| C11 | Send Offer | Price/date/payment terms/comment/expiry | `/carrier/requests/[id]/offer` |
| C12 | My Offers | Pending, accepted, history | `/carrier/offers` |
| C13 | Offer Detail | Current Offer, revisions, conversation, edit/withdraw | `/carrier/offers/[id]` |
| C14 | Carrier Profile Settings | Public profile + legal/contact settings | `/carrier/profile` |
| C15 | Carrier History | Completed/cancelled Booking history and reputation | `/carrier/history` |

### Carrier screen rules

- Carrier may browse Requests before verification.
- Send Offer requires required carrier verification.
- Browse may happen without a route; Send Offer requires a concrete Route.
- Route wizard stores ordered stops; direction order is used in matching.
- Route create/edit requires a positive-integer “Laisvos vietos” / “Kiek vietų automobiliams turite?” value. A sensible V1 UI control may cap ordinary entry at 10 while the domain model remains flexible.
- Future route management should provide a quick mobile capacity control such as “Laisvos vietos [-] 3 [+]”; it must never reduce `capacity_total` below already reserved Bookings. This control does not belong on public Route pages.
- Route has separate `accepting_new_requests` control; closing to new work does not cancel the Route.
- Route material edits revalidate pending Offers, but never rewrite accepted Bookings.
- Offer does not reserve capacity.
- One active pending Offer per carrier + Request.
- Offer revisions are history, not duplicate active Offer cards.
- Completed Booking detail opens in read-only historical mode.

---

## 3. Booking screens

| ID | Screen | Primary purpose | Planned URL |
|---|---|---|---|
| B01 | Booking Detail | Source of truth for agreement, operations and status | `/bookings/[id]` |
| B02 | Booking Conversation | Existing Offer conversation continued after Booking | `/messages/[conversationId]` |
| B03 | Status Update | Carrier next valid transport action | Primarily action UI inside B01 |
| B04 | Delivery Confirmation | Customer confirms delivery or reports a problem | Primarily action UI inside B01 |
| B05 | Review | Completed Booking review | Booking-context route/modal/page as implemented |
| B06 | Report Problem | Create Booking-linked report | Booking-context route/modal/page as implemented |
| B07 | Cancel Booking | Pre-collection cancellation | Booking-context action/dialog |

### Booking screen rules

- B01 is the customer source of truth after one complete Request Offer is accepted. It shows the immutable accepted agreement, one selected carrier, one aggregate Booking lifecycle, every vehicle and its own pickup/delivery route, current progress, price/payment terms, carrier trust and the linked Conversation. It does not compare rejected Offers or permit editing accepted terms.
- Booking snapshots the accepted Offer ID/version, total price, payment terms, carrier identity/reference, requested pickup window, planned pickup/delivery and every vehicle/location. B01 does not derive these agreed terms from the current mutable Request or Offer.
- V1 has one Booking status for the complete vehicle set: Booked → Pickup Scheduled → Collected → In Transit → Delivered → Completed. There is no per-vehicle lifecycle even for multi-location Bookings.
- Agreement snapshot and operational data are visually distinct.
- Required operational pickup data must exist before pickup process proceeds.
- Carrier only sees valid next status action.
- Normal cancellation ends after Vehicle Collected.
- Delivered waits for customer confirmation; no automatic V1 completion timer.
- Customer B01 shows “Patvirtinti, kad automobiliai gauti” only for Delivered; confirmation transitions the local/mock review state to Completed. Accepted price, terms, carrier and Request cannot be edited from B01.
- Report state is independent from Booking transport status.
- B01 opens the linked winning Conversation through “Atidaryti pokalbį” to `/messages/[conversationId]`; it never creates a Booking-specific duplicate thread.

---

## 4. Account / Shared screens

| ID | Screen | Primary purpose | Planned URL |
|---|---|---|---|
| U01 | Login / Register | Progressive passwordless contact confirmation | Auth flow / modal / route as implemented |
| U02 | Phone OTP | Verify phone and create/login User | Auth flow |
| U03 | Email Verification | Optional customer / required carrier contact verification path | Auth/account flow |
| U04 | Profile & Privacy | Basic user profile, security, privacy/account request | `/account` |
| U05 | Notification Preferences | Essential vs marketplace channel preferences | `/account/notifications` |
| M01 | Messages Inbox | Contextual Offer/Booking conversations | `/messages` |
| N01 | Notifications | Event list with deep links | `/notifications` |

### Shared rules

- No global “New Message” action.
- Conversation begins after an Offer and exists only in marketplace context. Exactly one Conversation exists per Request + Carrier, and Offer revisions reuse it.
- Conversation detail is canonical at `/messages/[conversationId]`. Its compact header shows carrier, Request route, vehicle count and useful Request/Booking status, with navigation to the Request before Booking and Booking after acceptance.
- Pending/updated Offer conversations are active. The accepted carrier's Conversation remains active and links to Booking; competing, declined, expired, withdrawn or unavailable Offer conversations are archived/read-only. Completed Booking conversations remain historical and may be read-only.
- M01 lists carrier, compact route, last-message preview, timestamp, real fixture/account unread count and useful state. Archived threads are visually secondary. There is no marketplace-wide fabricated unread statistic.
- Active threads support text-only local/mock send behavior. User and immutable system messages have explicit non-color-only identity and timestamps. Read-only threads omit the composer and explain that the conversation is finished.
- Attachments, photos, audio, reactions, typing state, editing/deleting, realtime transport and backend persistence are outside this V1 screen; attachments are deferred to V1.2.
- Unread counts are server-side.
- Deep links return the user to the exact requested object after authentication.
- Authorization is server-side, not based on hidden UI.
- Public users may browse/search, view public Routes and Carrier profiles, and complete P05 locally. Dashboard, Offers, Chat, Offer acceptance, Booking and Notifications require an account; the interrupted deep link/action is retained through authentication.
- Customer auth is passwordless and progressive. Phone OTP remains the V1 Request-publication verification gate; email OTP/magic link and Google/Apple may later establish identity without creating password-first UX.
- Public discovery shows city/area + country only. Exact street/postal address, location instructions and phone/contact data are limited to selected, authorized parties after Booking.
- UI strings and localized templates will move to translation keys. Locale resolution is saved preference → supported browser locale → English; English is the canonical source/fallback. User-generated content is not auto-translated in V1.

### N01 Notifications key rules

- `/notifications` shows event-driven marketplace activity with stored canonical deep links. Each item has a title, concise description, timestamp and explicit read/unread presentation; destinations are read from `Notification.href`, never reconstructed in the UI.
- Filters are “Visi” and “Neperskaityti”. Local/mock state supports opening one Notification as read and “Pažymėti visus kaip perskaitytus”. Empty states are “Pranešimų nėra” and “Visus pranešimus perskaitėte”. Persistence remains a backend responsibility.
- Representative deep links are Offer events → `/offers/[offerId]`, Message events → `/messages/[conversationId]`, and accepted/lifecycle Booking events → `/bookings/[bookingId]`.
- Lifecycle titles are count-aware: one vehicle uses “Automobilis paimtas / pristatytas”; two or more use “Automobiliai paimti / pristatyti”. Multi-location context stays compact.
- The current shared header is public and unauthenticated, so N01 does not add a misleading global account unread count. An auth-aware customer navigation entry and server-derived count belong to the account/backend integration phase.
- N01 does not send email, SMS or push, expose provider state, or implement notification preferences. It renders local review data for the future event-driven notification layer.

### Pre-backend screen-map boundary

- This architecture lock adds no new V1 screen or route and does not redesign P01–P09, M01, B01 or N01.
- Carrier Route publishing will emit `carrierRoute.published` only after authenticated/eligible publication with capacity. A separate service creates Telegram, Facebook or WhatsApp distribution jobs; no screen calls a provider directly.
- Telegram is the first intended automated adapter. Facebook Groups starts with a generated manual post package, and WhatsApp is future opt-in Business messaging—not arbitrary group posting.
- External posts always deep-link to the public Route Detail and may prefill P05; authentication/contact verification remains deferred until Publish.

---

## 5. Admin screens

| ID | Screen | Primary purpose | Planned URL |
|---|---|---|---|
| A01 | Admin Dashboard | Operational attention queues and global search | `/admin` |
| A02 | Users | User/account/carrier/support management | `/admin/users` |
| A03 | Verification Queue | Verification work queue | `/admin/verifications` |
| A04 | Verification Detail | Approve/reject separate verification components | `/admin/verifications/[id]` |
| A05 | Transport Requests | Request moderation and audit | `/admin/requests` |
| A06 | Carrier Routes | Route moderation and inspection | `/admin/routes` |
| A07 | Offers | Offer/revision audit, exceptional invalidation | `/admin/offers` |
| A08 | Bookings | Full Booking source of truth and explicit overrides | `/admin/bookings` |
| A09 | Reports / Disputes | Support case management | `/admin/reports` |
| A10 | Reviews | Review moderation without rewriting content | `/admin/reviews` |
| A11 | Audit Log | Immutable business/security change log | `/admin/audit` |

### Admin rules

- Desktop-first, responsive enough for critical tablet/mobile use.
- Operational queues before vanity analytics.
- Lifecycle and moderation remain separate.
- Admin is not a silent editor of customer/carrier agreement data.
- Overrides require reason + audit log.
- Tables use server-side pagination/filtering/sorting at scale.
- Private verification and operational data are strictly authorized.

---

## 6. Global navigation principles

### Public

- Rasti vežėją
- Vežėjams
- Prisijungti / account menu

Do not expose a public global customer Request catalog.

### Logged-in customer

Primary access to:

- Search
- Dashboard / Requests
- Bookings
- Messages
- Notifications
- Account

### Carrier

Desktop primary navigation:

- Dashboard
- Maršrutai
- Užklausos
- Pasiūlymai
- Pervežimai
- Žinutės

Mobile primary nav should stay to roughly 4–5 destinations; secondary items can live in menu/notifications/dashboard.

### Admin

Sidebar:

- Overview
- Users
- Verification
- Requests
- Routes
- Offers
- Bookings
- Reports
- Reviews
- Audit Log
