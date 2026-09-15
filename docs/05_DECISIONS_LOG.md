# Parvezk.lt — Decisions Log

This file records important product/architecture decisions that should not be casually re-opened. It is not a transcript of every discussion.

**Last consolidated:** 2026-09-11.

## Locked decisions

### D-001 — V1 is free marketplace first

**Decision:** V1 is free for customers and carriers. No commission, payment processing or escrow.  
**Reason:** Reduce implementation complexity and focus on marketplace liquidity/behavior first.

### D-002 — One User account

**Decision:** There is one User account. A User may act as a customer and may also have Carrier capability/profile.  
**Reason:** Avoid duplicate identities and allow carriers to also use the platform as customers.

### D-003 — Search before registration

**Decision:** Public Carrier Route search works without login.  
**Reason:** Minimize acquisition friction, especially traffic arriving from Facebook/social groups.

### D-004 — Phone OTP gates Request publication

**Decision:** A guest may fill the Request form before authentication; verified phone is required to publish. Customer email verification does not block publication.  
**Reason:** Preserve conversion while establishing an accountable Request owner.

### D-005 — Carrier verification gates Offers, not exploration

**Decision:** Carrier may create profile/routes, browse Requests and see matches before full verification; required verification is enforced before Send Offer.  
**Reason:** Let carriers see product value before hitting the trust/compliance wall.

### D-006 — One directional Carrier Route

**Decision:** Each Carrier Route represents one ordered travel direction. Return travel is a separate Route if needed.  
**Reason:** Capacity, dates and pickup-before-delivery logic differ by direction.

### D-007 — Route has no public price

**Decision:** Carrier Routes do not carry a customer transport price in V1. Price exists only in an Offer.  
**Reason:** A route alone does not define vehicle-specific transport terms and a displayed route price would be ambiguous.

### D-008 — Offer requires a Route

**Decision:** Carrier may browse Requests without a Route but must select/create a concrete Route to submit an Offer.  
**Reason:** Keeps Offer tied to real operational supply and supports capacity/version/revalidation logic.

### D-009 — Offer does not reserve capacity

**Decision:** Pending Offers do not reserve route capacity. Capacity is reserved only when a customer successfully accepts an Offer.  
**Reason:** Prevents non-responsive customers from freezing the carrier's physical capacity.

### D-010 — Capacity uses total vs reserved

**Decision:** Store `capacity_total` and `capacity_reserved`; available capacity is derived.
**Reason:** Supports both offline/private loads and Parvezk reservations without pretending Parvezk controls all carrier capacity.

### D-011 — Route can stop accepting new work without cancellation

**Decision:** Route lifecycle and `accepting_new_requests` are separate.  
**Reason:** Carrier may stop acquiring new jobs while still completing existing Bookings on the same journey.

### D-012 — Deterministic matching

**Decision:** V1 matching uses geography, ordered direction, date compatibility, vehicle compatibility and capacity. No AI dependency and no fake percentage score.  
**Reason:** More explainable, testable and reliable for V1.

### D-013 — Public vs private location data

**Decision:** Marketplace shows city/region-level location; exact addresses/operational contacts remain private until Booking context authorizes disclosure.  
**Reason:** Privacy, marketplace integrity and reduced off-platform bypass.

### D-014 — Targeted vs Marketplace Request

**Decision:** One Transport Request object supports `targeted` and `marketplace` visibility. No separate quote-request object.  
**Reason:** Simpler domain model and clean transition from “ask this carrier” to “show others too”.

### D-015 — One active Offer per carrier + Request

**Decision:** A carrier may not create multiple simultaneous Pending Offers for one Request. Edits create Offer revisions.  
**Reason:** Prevent clutter/spam and preserve clean commercial history.

### D-016 — Version Request, Route and Offer

**Decision:** Material changes increment versions and stale versions cannot be accepted.  
**Reason:** Prevent Booking based on outdated route/vehicle/date/price conditions.

### D-017 — Offer price is final transport price

**Decision:** Offer price is the final transport price shown to the customer; payment terms are stored separately. Currency V1 = EUR.  
**Reason:** Enable meaningful comparison and avoid hidden mandatory fees after acceptance.

### D-018 — Accept Offer is atomic

**Decision:** Offer acceptance, capacity reservation, competing-offer state changes and Booking creation occur in one server-side transaction.  
**Reason:** Prevent overbooking and partial-state corruption.

### D-019 — Booking is immutable agreement snapshot

**Decision:** Accepted agreement terms are copied/snapshotted into Booking and do not follow later Request/Route/Profile edits.  
**Reason:** Preserve what both parties actually agreed to.

### D-020 — Operational Booking data is separate

**Decision:** Exact addresses, contacts, pickup time window and operational instructions may change and are logged separately from the agreement snapshot.  
**Reason:** Real transport operations change without rewriting the commercial agreement.

### D-021 — Same conversation continues into Booking

**Decision:** Offer conversation becomes Booking conversation after acceptance. Do not create a second thread.  
**Reason:** Preserve context and evidence; avoid fragmented communication.

### D-022 — No random direct messaging

**Decision:** V1 has no “message any user/carrier” system. Conversations are contextual to Offers/Bookings.  
**Reason:** Reduce spam and keep communication tied to marketplace activity.

### D-023 — Cancellation ends after collection

**Decision:** Normal Booking cancellation is allowed only before Vehicle Collected. After collection, use Report/Admin intervention.  
**Reason:** A physically collected vehicle is no longer a simple marketplace cancellation case.

### D-024 — Delivered is not Completed

**Decision:** Carrier marks Delivered; customer confirmation creates Completed. No V1 automatic completion timer.  
**Reason:** Preserve customer confirmation and keep edge cases explicit during early operations.

### D-025 — Reviews require Completed Booking

**Decision:** Public carrier reviews can only come from Completed Bookings.  
**Reason:** Prevent fake/unverified reputation.

### D-026 — Customer public rating deferred

**Decision:** Carrier may review the customer, but V1 does not expose a public customer reputation score.  
**Reason:** Avoid creating a premature public reputation registry for private individuals.

### D-027 — Lifecycle and moderation are separate

**Decision:** Request/Route business lifecycle is separate from Admin hidden/removed moderation state.  
**Reason:** Preserve accurate history of who actually closed/cancelled what.

### D-028 — No hard-delete in normal workflows

**Decision:** Core business/history objects use terminal/moderation states instead of normal hard deletion.  
**Reason:** Audit, disputes, analytics and support history.

### D-029 — Admin is not a silent agreement editor

**Decision:** Admin may moderate and explicitly override with reason, but must not silently rewrite Offer/Booking agreement data.  
**Reason:** Preserve trust and auditability.

### D-030 — V1 frontend design system

**Decision:** Use Next.js 15 + TypeScript + Tailwind + shadcn/ui as the V1 frontend standard.  
**Reason:** Build directly in a consistent production UI system and avoid unnecessary custom UX/design work.

### D-031 — Browser UI replaces separate high-fidelity prototype

**Decision:** Build early P screens in the real shadcn component stack with realistic mock data instead of commissioning a separate full high-fidelity Figma project for V1.  
**Reason:** Faster iteration, lower cost, direct feedback in the actual browser/mobile layout.

### D-032 — List is primary, Map supplemental

**Decision:** List+Map screens must remain fully usable without Map. Map loads lazily and is not the source of truth.  
**Reason:** Mobile UX, accessibility, performance and provider resilience.

### D-033 — i18n-ready from the beginning

**Decision:** UI strings should be structured for localization and not scattered as irreversible hard-coded text in components.  
**Reason:** The marketplace naturally spans multiple European languages.

### D-034 — Supabase is the planned backend foundation

**Decision:** Current planned backend stack is Supabase PostgreSQL/Auth/Storage with Next.js hosted on Hostinger.  
**Reason:** Relational marketplace model, authentication, file storage and fast V1 development fit the project well.

### D-035 — Admin tables use server-side data operations

**Decision:** Admin filtering/sorting/pagination must be server-side at scale even if TanStack Table renders the UI.  
**Reason:** Avoid browser-side loading/filtering of tens of thousands of records.

### D-036 — Customer Dashboard is a lifecycle overview

**Decision:** P09 classifies each customer Request into one Dashboard area: Active appears in Requests, Booked appears in Transports, and Completed or Closed appears in History. Persisted Drafts are excluded from the V1 Dashboard. “Reikia dėmesio” is derived only from an Active Request with an actionable Pending Offer, with updated actionable Offers prioritized. Dashboard actions navigate to detail screens; they do not accept/decline Offers or edit, close, reopen or modify Bookings. The Dashboard has no vanity KPIs.
**Reason:** Give customers one actionable overview without duplicating lifecycle objects, inventing notification state or moving detailed business actions into a summary screen.

### D-037 — Multi-vehicle Transport Request in V1

**Decision:** One V1 Transport Request contains 1–10 vehicles with stable per-vehicle identities. All vehicles share one pickup location, delivery location and requested pickup window; different routes require separate Requests. Photos belong to individual vehicles. One carrier Offer covers the complete vehicle set, and `totalPriceEur` is the total price for transporting all vehicles. Partial Offers, per-vehicle acceptance, split Bookings and multiple carriers for one Request are unsupported. A Route must support the complete set's capacity, categories and any non-running vehicle. Adding/removing a vehicle or changing category, make/model, year, condition or rolling ability when relevant invalidates Pending Offers; vehicle photo and Request note changes do not. This supersedes the previous single-vehicle V1 assumption.
**Reason:** Customers commonly need several vehicles moved together while one route, one commercial Offer and one responsible carrier keep V1 fulfillment clear and atomic.

### D-038 — V1 Carrier Route Capacity

**Decision:** Every supported vehicle consumes one Route capacity space in V1, regardless of category. Store `capacity_total` and `capacity_reserved`; derive available capacity as `max(0, capacity_total - capacity_reserved)`. An Offer does not reserve capacity. Successful Booking creation reserves the complete Request vehicle count, and eligible cancellation releases the same count. Zero available capacity means Full and excludes the Route from new matching without deleting it. Partial Offers and split Bookings remain unsupported. Future carrier route management may provide a quick mobile capacity control, but `capacity_total` can never be reduced below `capacity_reserved`.
**Reason:** Integer spaces make complete-request matching and atomic reservation predictable while leaving physical loading suitability for carrier confirmation.

### D-039 — V1 Multi-Vehicle Multi-Location Requests

**Decision:** Each vehicle in a 1–10 vehicle Request may have its own structured pickup and delivery location. P05 Step 1 supplies default locations inherited by vehicle cards, and any vehicle, including Vehicle 1, may override them. The Request remains one complete job for one carrier, one Offer and one eventual Booking; partial Offers and split Bookings are unsupported. All vehicles share one requested pickup date/window in V1. Matching evaluates every vehicle's direction, category and non-running capability and uses the complete vehicle count for capacity, without route optimization or segment-capacity reuse. Per-vehicle pickup or delivery edits are material and invalidate Pending Offers. This supersedes D-037's same-route requirement while retaining its 1–10 vehicle, complete-Offer and material-vehicle-change rules.
**Reason:** Customers can group vehicles that start or finish in different cities while keeping one commercial agreement and a simple V1 scheduling and capacity model.

## How to add a new decision

Add a new `D-XXX` entry only for a material product/architecture decision. Include:

- Decision
- Reason
- Date if helpful

If the decision changes a canonical rule, update the relevant blueprint/architecture document in the same change.
