# Parvezk.lt V1 — Technical Architecture

**Status:** Implementation blueprint locked; backend not yet implemented.  
**Last consolidated:** 2026-09-11.

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

### Carrier verification

- `carrier_verifications`
- `carrier_documents`

### Customer demand

- `transport_requests`
- `request_vehicles`
- `request_versions`

`transport_requests` owns default pickup/delivery locations and the shared pickup window. Each Request owns 1–10 ordered `request_vehicles` with a stable vehicle ID and vehicle-specific structured pickup/delivery locations, category, make/model, optional year, condition, rolling ability and photos. Vehicle locations become canonical after an override; Request defaults exist for inheritance and convenience.

### Carrier supply

- `carrier_routes`
- `route_stops`
- `route_versions`

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
- Route may remain Active while `accepting_new_requests = false`.

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

V1 target: passwordless phone OTP.

Flow:

- user enters phone;
- OTP verifies;
- existing phone logs into existing User;
- new phone creates User;
- redirect returns to the intended task.

Email verification remains separate.

SMS provider selection is an implementation task and is not required before mock UI work begins.

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

## 16. Notifications architecture

Use domain-event-driven notification creation rather than scattering ad hoc notification logic across UI components.

Example domain events:

- `offer.created`
- `offer.updated`
- `offer.accepted`
- `offer.declined`
- `message.created`
- `booking.created`
- `booking.pickup_scheduled`
- `booking.pickup_changed`
- `booking.collected`
- `booking.delivered`
- `booking.cancelled`
- `verification.approved`
- `verification.rejected`
- `report.created`
- `report.resolved`

V1 does not need Kafka or a complex external event bus; a simple application/domain event pattern is sufficient.

`message.created` should produce an in-app notification and may produce transactional email through this layer. It does not produce SMS by default. The chat UI never calls email/SMS providers directly.

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
