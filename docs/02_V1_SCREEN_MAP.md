# Parvezk.lt V1 — Canonical Screen Map

**Last consolidated:** 2026-09-11.

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

- Search works without login.
- Required: From, To.
- Date optional; empty means “Bet kada”.
- Primary CTA: “Rasti vežėją”.
- Secondary CTA: “Gauti vežėjų pasiūlymus”.
- Active routes section appears only when real routes exist.

### P02 Search key rules

- Search state and filters persist in URL.
- Desktop List + Map; mobile defaults to List with Map toggle.
- Map is lazy-loaded and supplemental.
- No route price.
- Sorting: best match, closest date, best rated.
- V1 uses “Rodyti daugiau”, not infinite scroll.
- No results → CTA to P05 with prefilled search values.
- Approximate/alternative results are visually separated from exact results.

### P03 Route detail key rules

- Route information precedes carrier marketing.
- Show planned route, dates, capacity, vehicle compatibility, carrier trust.
- Public route does not expose live GPS.
- One primary CTA: “Gauti pasiūlymą iš šio vežėjo”.
- If route becomes full/unavailable, offer marketplace Request fallback.

### P04 Carrier profile key rules

- Shows public profile, current verification details, active routes, verified Booking reviews.
- No phone/email/private documents/direct open message action.
- New carrier without reviews is “Naujas vežėjas”, not rating 0.0.

### P05 Request wizard key rules

4 steps:

1. Route + pickup date/date window/flexible date.
2. Vehicle category/make/model/year/condition/photos.
3. Additional notes.
4. Contact + visibility + legal acknowledgement + Phone OTP if needed.

Targeted flow must tell the customer before publish whether only the selected carrier or also other matching carriers will see the Request.

Phone OTP is required to publish. Email verification does not block customer publication.

### P06 Published key rules

Success state only. No fake “X carriers notified” claims.

Targeted-only Requests can be expanded to Marketplace visibility.

### P07 Request detail key rules

Customer UI uses human labels, e.g.:

- Draft → Juodraštis
- Active → Ieškoma vežėjo
- Booked → Vežėjas pasirinktas
- Completed → Pervežimas užbaigtas
- Closed → Užklausa uždaryta

Offers live in this screen; there is no separate Offer List screen.

Material Request edits increment Request version and invalidate pending Offers.

Closing a Request does not later re-open the same object; repeating creates a new Draft.

### P08 Offer detail key rules

- Price shown as final transport price.
- Payment terms shown separately.
- Contextual conversation is the same thread that later becomes Booking chat.
- Accept uses confirmation screen/dialog and atomic server transaction.
- Stale Offer/Request/Route version prevents acceptance and forces re-review.

### P09 Dashboard key rules

- “Needs attention” first when relevant.
- Tabs/sections: Requests, Transports, History.
- No vanity KPI dashboard.

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
| B02 | Booking Conversation | Existing Offer conversation continued after Booking | `/bookings/[id]/chat` |
| B03 | Status Update | Carrier next valid transport action | Primarily action UI inside B01 |
| B04 | Delivery Confirmation | Customer confirms delivery or reports a problem | Primarily action UI inside B01 |
| B05 | Review | Completed Booking review | Booking-context route/modal/page as implemented |
| B06 | Report Problem | Create Booking-linked report | Booking-context route/modal/page as implemented |
| B07 | Cancel Booking | Pre-collection cancellation | Booking-context action/dialog |

### Booking screen rules

- Agreement snapshot and operational data are visually distinct.
- Required operational pickup data must exist before pickup process proceeds.
- Carrier only sees valid next status action.
- Normal cancellation ends after Vehicle Collected.
- Delivered waits for customer confirmation; no automatic V1 completion timer.
- Report state is independent from Booking transport status.

---

## 4. Account / Shared screens

| ID | Screen | Primary purpose | Planned URL |
|---|---|---|---|
| U01 | Login / Register | Passwordless phone entry | Auth flow / modal / route as implemented |
| U02 | Phone OTP | Verify phone and create/login User | Auth flow |
| U03 | Email Verification | Optional customer / required carrier contact verification path | Auth/account flow |
| U04 | Profile & Privacy | Basic user profile, security, privacy/account request | `/account` |
| U05 | Notification Preferences | Essential vs marketplace channel preferences | `/account/notifications` |
| M01 | Messages Inbox | Contextual Offer/Booking conversations | `/messages` |
| N01 | Notifications | Event list with deep links | `/notifications` |

### Shared rules

- No global “New Message” action.
- Conversation exists only in marketplace context.
- Unread counts are server-side.
- Deep links return the user to the exact requested object after authentication.
- Authorization is server-side, not based on hidden UI.

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
