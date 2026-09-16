# Parvezk.lt V1 — Product Blueprint

**Canonical status:** LOCKED unless a real user test, legal requirement, or technical blocker requires a change.  
**Last consolidated:** 2026-09-11.

## 1. Core domain model

### User

One User account may use customer functionality and may also own or belong to a Carrier Profile/Organization.

A verified phone number belongs to only one active User.

Customer publishing requires phone verification. Email may be collected and verified, but email verification does not block customer Request publication.

Carrier Offer capability requires the carrier verification conditions defined by the platform, including required contact verification.

### Transport Request

A Transport Request is a customer's need to transport 1–10 vehicles in one shared requested pickup date/date window. Each vehicle may have its own pickup and delivery location, while the Request remains one complete job for one carrier, one Offer and one eventual Booking.

A Request contains:

- default public pickup location;
- default public delivery location;
- optional private operational pickup details;
- optional private operational delivery details;
- pickup date/date window/flexible date;
- 1–10 vehicles, each with a stable identity, structured pickup and delivery locations, category, make/model, optional year, running/non-running state and rolling ability when non-running;
- optional photos belonging to their individual vehicle;
- optional notes;
- visibility: `targeted` or `marketplace`;
- if targeted, target carrier and target route references;
- current request version.

Material Request changes increment `request_version` and invalidate incompatible pending Offers.

Material fields include:

- pickup location;
- delivery location;
- date/date window;
- adding or removing a vehicle;
- changing any vehicle pickup or delivery location;
- any vehicle category, make/model, year, running/non-running condition or rolling-ability change when relevant.

Non-material fields such as Request notes or vehicle photos do not automatically invalidate Offers.

### Carrier Route

A Carrier Route is one planned travel direction with ordered stops.

A route such as Lithuania ↔ Germany must be represented as two directional routes if the carrier plans to serve both directions.

Route fields include:

- origin;
- destination;
- ordered intermediate stops;
- route start date;
- route end date;
- supported vehicle categories;
- non-running vehicle capability;
- `capacity_total`;
- `capacity_reserved`;
- `accepting_new_requests`;
- current route version.

Derived available capacity:

`available = max(0, capacity_total - capacity_reserved)`

A carrier specifies a positive integer number of vehicle spaces. V1 intentionally uses one space per vehicle for every supported category; it has no fractional capacity or size coefficients. Physical loading suitability remains for the carrier to confirm.

A carrier may adjust `capacity_total`, including through a future quick mobile control, but never below `capacity_reserved`.

Submitting an Offer does not change capacity. Successful Booking creation increments `capacity_reserved` by the Request's complete vehicle count, and an eligible Booking cancellation releases that same count. Zero available capacity means the Route is full and unavailable for new matching, while the Route remains directly viewable.

Route lifecycle:

- `draft`
- `active`
- `expired`
- `cancelled`

Availability such as Available/Full is derived, not a lifecycle state.

Moderation status is separate from lifecycle.

### Match

V1 matching is deterministic, not AI-first.

A Request can match a Carrier Route using:

- every vehicle's pickup proximity to the route;
- every vehicle's delivery proximity to the route;
- correct pickup-before-delivery order for every vehicle in the carrier's travel direction;
- date compatibility with the overall route window;
- vehicle category compatibility;
- non-running capability if required;
- available capacity for the complete vehicle set (`vehicles.length`);
- route accepting new requests.

V1 UI uses qualitative labels:

- Puikiai tinka / Excellent match
- Gerai tinka / Good match
- Galimas variantas / Possible match

Do not show fake precision such as “92% match”.

Exact total route detour is optional for later integration with a routing provider; V1 core matching must not depend on a perfect detour engine.

### Offer

An Offer is created by a verified carrier for a specific Transport Request and a specific Carrier Route.

Browse may happen without a route, but Send Offer requires a concrete route.

One carrier may have at most one active `pending` Offer for the same Request at a time.

An Offer includes:

- final customer transport price in EUR;
- planned pickup date/time window;
- planned delivery date;
- structured/semistructured payment terms;
- optional carrier comment;
- expiration time;
- request version seen by the carrier;
- route version used for the Offer;
- current offer version.

One Offer covers the complete 1–10 vehicle set and all vehicle routes in its Request. Its final customer transport price is the total price for transporting all Request vehicles. Partial Offers, per-vehicle acceptance and splitting one Request between carriers are not supported in V1. The carrier must be able to transport the complete vehicle set.

An Offer does **not** reserve route capacity.

Offer expiration must be in the future and before the planned pickup.

Offer lifecycle:

- `pending`
- `accepted`
- `declined`
- `withdrawn`
- `expired`
- `not_selected`
- `unavailable`

Offer edits do not create duplicate active Offers. They increment `offer_version` and create Offer revision history.

A stale Offer cannot be accepted if the Offer, Request, or relevant Route assumptions changed.

### Booking

A Booking is created only when the customer accepts a valid Offer.

Booking creation must be one atomic server-side business transaction that:

1. confirms Offer is still pending;
2. confirms current offer version;
3. confirms current request version;
4. confirms route is active and valid;
5. confirms route has capacity;
6. reserves route capacity;
7. accepts the chosen Offer;
8. changes the Request to Booked;
9. marks competing pending Offers Not Selected where appropriate;
10. creates an immutable agreement snapshot;
11. links the existing Offer conversation to the Booking;
12. creates notifications/audit events.

If another customer consumes the last capacity at the same moment, the later transaction must fail cleanly and must never allow negative capacity.

#### Booking agreement snapshot

The Booking snapshot stores the accepted commercial/transport agreement, including at least:

- customer and carrier identity references/names relevant to the agreement;
- public route/location values at acceptance;
- information for every vehicle in the Request;
- agreed pickup date;
- agreed delivery estimate;
- final price;
- payment terms;
- accepted Offer text/version;
- Request version;
- Carrier Route reference/version.

The snapshot does not silently change when current Request/Route/Profile data changes.

#### Operational Booking data

Operational information may change and is logged separately, for example:

- exact pickup address;
- exact delivery address;
- pickup contact;
- delivery contact;
- pickup time window;
- operational ETA;
- gate/access instructions.

### Booking status lifecycle

- `booked`
- `pickup_scheduled`
- `vehicle_collected`
- `in_transit`
- `delivered`
- `completed`
- `cancelled` as an alternate terminal path before collection

Carrier UI exposes only the next valid transport action, not an unrestricted status dropdown.

Normal cancellation is allowed only before `vehicle_collected`.

After `vehicle_collected`, problems go through Report/Admin intervention rather than normal Cancel.

`Delivered` is not the same as `Completed`.

Carrier marks Delivered. Customer confirms receipt to produce Completed. V1 does not auto-complete after 48/72 hours; Admin may override with a reason when necessary.

### Conversation

A conversation begins only after a carrier submits an Offer. Exactly one Conversation exists for one Request + one Carrier. Offer revisions from that carrier reuse the same Conversation and update its current Offer reference.

Pending and updated Offers keep the Conversation active. Declined, expired, withdrawn or unavailable Offers archive it as read-only. When the customer accepts an Offer, the winning Conversation remains active and is linked to the new Booking; competing carriers' Conversations archive as read-only historical threads. Do not create a second chat thread after Booking. A Completed Booking keeps the Conversation available as history and V1 may make it read-only.

The canonical detail URL is `/messages/[conversationId]`; Request, Offer and Booking screens link there. `/bookings/[id]/chat` is not a second or canonical thread.

V1 supports text user messages, sender identity, timestamps, read/unread state and immutable system messages. Attachments are deferred to V1.2. No open “message any user” functionality exists; every Conversation is tied to its Request/Carrier and optional Booking context.

System events displayed in chat should come from structured activity records where appropriate, not exist only as mutable plain text messages. A future `message.created` domain event feeds in-app and transactional email notification handling; SMS is not sent by default and the chat UI does not call notification channels directly.

### Booking Activity

Structured activity records include:

- status changed;
- pickup schedule changed;
- booking cancelled;
- report created;
- relevant admin override;
- other important state transitions.

Each event records actor, timestamp, old/new state where relevant, and reason when required.

### Review

Reviews may be created only after a Completed Booking.

Customer → Carrier review:

- 1–5 stars;
- optional comment;
- publicly visible unless moderated;
- marked as a verified transport.

Carrier → Customer review may be collected in V1 but is not publicly displayed as a customer reputation system.

One participant gets one review opportunity per Booking according to allowed review direction.

### Report / dispute

Reports are linked to a Booking and have their own status independent from transport status.

Typical categories:

- carrier did not arrive;
- customer unavailable;
- incorrect vehicle information;
- damage;
- payment disagreement;
- communication issue;
- other.

Report lifecycle:

- `open`
- `in_review`
- `resolved`
- `dismissed`

Creating/resolving a Report does not automatically change Booking status.

A user should not be able to spam multiple identical simultaneous open reports for the same issue/context.

## 2. Public vs private data

### Public marketplace data may include

- city/region-level pickup/delivery;
- route cities/stops;
- approximate dates;
- vehicle category/basic vehicle information as designed;
- carrier public profile;
- current verification badges;
- rating/completed transports;
- public reviews.

### Private/operational data includes

- exact addresses;
- phone/email;
- pickup/delivery private contacts;
- identity documents;
- carrier verification file contents;
- internal admin notes;
- sensitive operational attachments.

Private data must not be exposed through permanent public URLs or client-only authorization.

## 3. Authentication and account rules

V1 uses passwordless phone OTP as the main user authentication flow.

- Existing phone → OTP logs the User in.
- New phone → OTP verifies and creates the User.
- Auth flow returns the User to the interrupted task (e.g., Request publish), not always to Dashboard.
- OTP attempts and resend are rate-limited server-side.
- Email verification exists, but does not block customer Request publication.
- Carrier Offer capability depends on required verified contact/verification conditions.

## 4. Carrier verification

Verification categories are separate and may be partially approved:

- contact;
- identity;
- company, when applicable;
- transport documents.

Verification state per category/document:

- `not_submitted`
- `pending`
- `approved`
- `rejected`
- `expired`

A public “Patvirtintas vežėjas / Verified Carrier” badge appears only when all current platform-required verification checks are approved.

An expired required verification can block new Offers without automatically cancelling existing Bookings.

Carrier may create a profile, create routes, browse Requests, and see Matches before full approval. Sending Offers requires the required verification state.

## 5. Request visibility

Request visibility is one of:

- `targeted` — intended for a specific carrier/route;
- `marketplace` — visible to eligible carriers in marketplace discovery.

If a customer starts from a Carrier Route, the final form must clearly tell them who will see the Request before publication.

Default for a targeted route flow is “only this carrier” unless the customer chooses broader marketplace visibility.

A targeted Request can later be expanded to Marketplace visibility without creating a duplicate Request.

If the target route becomes unavailable before publication, the customer should be offered a clean fallback to publish the Request to other suitable carriers instead of receiving a dead-end error.

## 6. Request and route lifecycle vs moderation

Lifecycle and moderation are different concepts.

### Request lifecycle

Typical business lifecycle:

- `draft`
- `active`
- `booked`
- `completed`
- `closed`

Moderation state is separate, e.g.:

- `normal`
- `hidden`
- `removed`

Admin removal does not pretend the customer voluntarily closed the Request.

### Route lifecycle

- `draft`
- `active`
- `expired`
- `cancelled`

Route moderation is separate from lifecycle.

`accepting_new_requests` is also separate from lifecycle.

## 7. Request closure and Booking cancellation

When a customer closes an Active Request:

- the Request becomes Closed;
- pending Offers become Unavailable;
- the same Request is not re-opened later.

If the customer wants the same transport again, “Pakartoti užklausą” creates a new Draft with copied values.

When a Booking is normally cancelled before collection:

- Booking becomes Cancelled;
- the capacity reservation is released if applicable;
- the original Request becomes Closed;
- it is **not** automatically re-opened;
- the customer may create a new Draft based on the prior Request if they want to search again.

## 8. Carrier route cancellation

A carrier may stop accepting new Requests without cancelling the Route by setting `accepting_new_requests = false`.

A real Route cancellation means the journey will not happen. A route with active Bookings must not be casually cancelled before those Bookings are handled individually.

## 9. Pricing and payment terms

V1 Offer currency: EUR.

The Offer price shown to the customer is the final transport price for every vehicle in the Request together. Required undisclosed mandatory fees must not be added after acceptance. V1 does not expose a per-vehicle price or partial Offer.

V1 does not process or guarantee payment.

Payment terms are stored in the Offer and Booking snapshot so the customer can compare offers meaningfully.

## 10. Notifications and messages

Notifications are event-driven and link directly to the relevant object.

The V1 event boundary is `offer.created`, `offer.updated`, `offer.accepted`, `message.created`, `booking.created`, `booking.pickupScheduled`, `booking.collected`, `booking.inTransit`, `booking.delivered` and `booking.completed`. Offer, Chat and Booking UI must not call email or SMS providers directly. A user never receives a notification for their own action; independently generated system events notify the relevant parties according to policy.

Examples:

Customer:

- new offer;
- updated offer;
- offer unavailable;
- message;
- booking created;
- pickup scheduled/changed;
- vehicle collected;
- delivered;
- report update.

Carrier:

- matching request;
- message;
- offer accepted/declined;
- booking cancelled;
- verification result;
- document expiry warning.

In-app notification history is the authoritative/default channel. New and updated Offers use in-app + email, without SMS. `offer.accepted` remains an internal lifecycle/Booking trigger event but creates no customer-facing delivery. `booking.created` is the single canonical accepted-Booking notification and uses in-app + email + SMS for the customer and selected carrier, linking to `/bookings/[bookingId]`. Pickup scheduled and Delivered use in-app + email + SMS for the customer. Collected and In Transit use in-app + email without SMS for the customer. Completed uses in-app + email without SMS for customer and carrier.

`message.created` notifies the other Conversation participant in-app and has no SMS. Email is a delayed unread fallback rather than one email per message: the future backend should wait approximately 10 minutes, confirm the message/Conversation remains unread, and debounce or batch repeated messages.

Future user preferences may reduce optional email/SMS delivery, but in-app history remains authoritative. OTP/auth, accepted Booking, pickup schedule and Delivered are critical transactional categories; Offers, Chat fallback and routine transport progress are normal transactional categories. No provider is selected and no email/SMS is sent by the frontend/mock implementation.

Every Notification stores its canonical destination `href`; UI does not reconstruct navigation from event type. Future event processing and channel delivery must use idempotency keys so retries cannot create duplicate in-app records or duplicate email/SMS sends.

Essential security/booking notifications cannot be completely disabled in notification preferences.

Unread state is server-side so it remains consistent across devices.

## 11. Admin principles

- Admin moderation is not silent business-data editing.
- Important overrides require a reason and audit record.
- No hard-delete of core business/history objects through normal Admin flows.
- User suspension does not automatically cancel active Bookings.
- Booking snapshot is immutable even for Admin; support corrections use explicit override/event paths rather than silently rewriting the agreement.
- Review content may be hidden but not rewritten by Admin.
- Lifecycle and moderation remain separate.
- Verification documents/private operational files require strict authorization.

## 12. UX/design principles

- One primary CTA per screen where practical.
- Use human language in UI, not raw backend state names.
- Mobile-first for customer/carrier; Admin is desktop-first but responsive.
- List is the source of truth in List+Map views; Map is supplemental and lazy-loaded.
- No-result states always offer a productive next action.
- Avoid fake urgency, fake social proof, fake counts, or fake precision.
- Accessibility: real labels, keyboard navigation, focus states, meaningful error text, sufficient touch target sizes.
- Use `shadcn/ui + Tailwind` patterns consistently rather than custom one-off visual components.

## 13. V1 intentionally excluded

See `00_PROJECT_OVERVIEW.md`, section “V1 non-goals”. New ideas that are not blockers go to V1.1/V2 backlog instead of silently expanding V1.
