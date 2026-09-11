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

**Decision:** Store `capacity_total` and `parvezk_reserved`; available capacity is derived.  
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

## How to add a new decision

Add a new `D-XXX` entry only for a material product/architecture decision. Include:

- Decision
- Reason
- Date if helpful

If the decision changes a canonical rule, update the relevant blueprint/architecture document in the same change.
