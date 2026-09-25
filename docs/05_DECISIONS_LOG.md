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

### D-040 — V1 Conversation architecture

**Decision:** A Conversation begins after a carrier submits an Offer, with exactly one Conversation per Request + Carrier. Offer revisions reuse it. The winning Conversation remains active and gains the Booking link at acceptance; competing Conversations archive as read-only history, and no second Booking chat is created. `/messages/[conversationId]` is canonical before and after Booking. V1 is text-only with explicit user/system messages and read state; attachments are deferred to V1.2. There is no arbitrary user-to-user messaging. `message.created` is the future notification boundary for in-app and transactional email delivery, with no SMS by default and no channel calls from chat UI.
**Reason:** One durable contextual thread preserves the complete commercial and transport history without duplicate chats, while keeping V1 communication scope and future notification integration explicit.

### D-041 — B01 Booking Snapshot + Aggregate Lifecycle

**Decision:** B01 renders immutable accepted transport terms from the Booking snapshot, including the accepted Offer ID/version, complete vehicle/location set, carrier reference/identity, requested and planned dates, total price and payment terms. V1 has one aggregate Booking lifecycle for all vehicles and no per-vehicle status. The accepted Conversation continues into Booking and B01 links to `/messages/[conversationId]` without creating another thread. Delivered may be confirmed by the customer as Completed. The customer cannot edit the accepted carrier, price, payment terms or original Request from B01.
**Reason:** Preserve the actual complete-request agreement while keeping multi-vehicle operations understandable and preventing mutable Request/Offer data or partial per-vehicle state from rewriting the accepted transport.

### D-042 — Notifications V1 — Event-Driven Delivery Policy

**Decision:** Notifications are derived from Offer, Message and Booking domain events through recipient resolution and policy, never direct email/SMS calls from UI. Self-notifications are suppressed. `offer.accepted` remains an internal Offer/Conversation/Booking transition event but produces no external delivery; `booking.created` is the sole accepted-Booking notification, reaches customer + selected carrier through in-app + email + SMS, and links to `/bookings/[bookingId]`. In-app history is authoritative; email carries transactional updates, while SMS is otherwise limited to selected critical pickup-scheduled and Delivered events. `message.created` uses in-app immediately and a future delayed unread/debounced email fallback, with no SMS. Every Notification stores its canonical `href`. Future event processing and channel delivery require stable event + recipient + channel idempotency keys; channel delivery state is separate from the base Notification. Provider choice, real delivery, preferences and auth-aware global unread counts remain deferred.
**Reason:** Central policy keeps customer communication consistent, retry-safe and provider-independent without coupling locked Offer, Chat or Booking interfaces to delivery infrastructure.

### D-043 — Route Distribution Architecture

**Decision:** Carrier Route gains the future-ready `routeFlexible: boolean` concept; it does not add `maxDetourKm` or distance-based detour matching. An eligible Route transition to canonical `published` with available capacity > 0 emits `carrierRoute.published`. A separate Route Distribution Service creates immutable, localized `RouteDistributionJob` snapshots per channel/target rather than making CarrierRoute call providers. Draft/ineligible/full Routes never distribute. Telegram is the first intended automated adapter; Facebook Groups use a generated/manual post package baseline; WhatsApp is future opt-in Business messaging. Every external CTA returns to `/routes/[routeId]`, and snapshots exclude exact addresses, phone numbers and private contacts.
**Reason:** Provider-independent, snapshot-based distribution can acquire customers without mutating historical posts, leaking private data or encouraging marketplace bypass.

### D-044 — Internationalization V1

**Decision:** English (`en`) is the canonical source and fallback. Initial locales are `en`, `lt`, `de`, `nl`, `fr`, `pl`, `ro`, `uk` and `ru`; resolution order is saved `preferredLocale`, supported browser locale, then English. Product/system/notification/delivery/distribution copy uses translation keys and locale-aware formatting. Normal entity and user-generated data is stored once; Chat, comments and Request notes are not auto-translated in V1. Optional `spokenLanguages[]` is future profile metadata, not an account requirement.
**Reason:** One deterministic locale policy supports international operations without duplicating domain data or coupling backend values to Lithuanian display strings.

### D-045 — Public vs Private Location

**Decision:** Marketplace/public location is city/area + country with future coordinates/place reference. Private transport address is street, postal code, city, country and optional instructions. Vehicle pickup/delivery must eventually support `publicLocation` plus optional `privateAddress`; exact addresses and phone/contact data are available only to selected, authorized parties after Booking and are excluded from public/distribution projections.
**Reason:** Matching and acquisition need useful geography, while operations require backend-enforced protection of exact locations and contacts.

### D-046 — Optional Request Budget

**Decision:** A Request may have optional `budgetAmount` + `budgetCurrency` representing the customer's overall desired transport budget. It is not required, fixed, per-vehicle, an auto-accept rule or a replacement for the carrier's independent Offer.
**Reason:** Budget guidance can improve commercial fit without changing the Offer/acceptance model or misleading users about a guaranteed price.

### D-047 — Carrier Trust Metadata

**Decision:** Carrier schema readiness distinguishes `verifiedCarrier`, `cmrInsuranceAvailable`, `cmrInsuranceVerified`, `invoiceAvailable` and `liveTrackingAvailable`. Optional later metadata includes CMR coverage amount/currency, company identity and verification timestamps. Trust claims must be evidence-backed and never fabricated.
**Reason:** Separate availability and verification facts let public trust UI evolve safely without overloading one generic verification badge.

### D-048 — V1 Vehicle Scope

**Decision:** V1 supports passenger cars, SUV/crossovers, vans/minivans and motorcycles. Excavators, heavy/agricultural machinery, loose freight, engines/standalone cargo and heavy commercial equipment are excluded. The one-vehicle-equals-one-capacity-slot rule is not extended to those categories.
**Reason:** Heavy/cargo transport needs dimensions, weight, trailer, payload and regulatory models that would invalidate the intentionally simple V1 capacity architecture.

### D-049 — Progressive Customer Authentication

**Decision:** Customers may browse, view public Route/Carrier pages, and complete a Request locally without an account. Authentication/contact confirmation occurs at Publish Request; successful verification creates or reuses the Customer account and returns to the pending action. V1 retains verified phone for publication anti-spam/trust. Authentication is passwordless-first; email OTP, magic link, phone OTP, Google or Apple may be used later without password/reset UX. Auth is required after publication for Dashboard, Offers, Chat, acceptance, Booking and Notifications.
**Reason:** Delaying registration until the value-bearing publish action reduces acquisition friction while retaining marketplace accountability.

### D-050 — Carrier Authentication Gate

**Decision:** Carriers may browse publicly, but must authenticate before creating/publishing a Carrier Route, submitting an Offer, messaging a customer or managing Bookings. Future onboarding is Account → Carrier Profile → email/phone verification → business details → applicable trust verification → publish Routes; eligibility policy is enforced server-side.
**Reason:** Supply-side actions create commercial and operational obligations and therefore require a stronger identity/eligibility boundary than public browsing.

### D-051 — P01 High-Fidelity and V1 visual baseline

**Date:** 2026-09-17. **Status:** LOCKED after human desktop and mobile browser review.

**Decision:** P01 High-Fidelity is approved and its current responsive browser implementation becomes the V1 visual source of truth and reference for P02/P03. The approved direction is **Clean Marketplace + Friendly European Marketplace**, using deep teal/petrol and slate, white cards and Geist typography. Tailwind v4 standard dimensions and shadcn/Base UI sizing conventions are mandatory. Normal layouts use grid/flex/content-driven auto-layout behavior, not fragile absolute positioning; avoid arbitrary custom pixel dimensions and allow translated content to wrap and grow. No gradients, unrelated brand colors or dark theme. The reusable header, PageContainer, search surface, trust strip/items, MarketplaceRouteCard, section headings, three-step section and carrier CTA are documented in `03_TECHNICAL_ARCHITECTURE.md`.

**Reason:** Human-reviewed production UI provides a consistent, responsive marketplace baseline without maintaining a separate high-fidelity design source. This lock changes documentation only; P01 UI and behavior stay unchanged. P02 Search Results High-Fidelity is the next separately scoped visual task; no P02/P03, backend, Auth, Supabase, i18n rollout or provider work begins under this approval.

### D-052 — P02 High-Fidelity and results/discovery visual baseline

**Date:** 2026-09-18. **Status:** LOCKED after human desktop and mobile browser review.

**Decision:** P02 High-Fidelity is approved as the V1 responsive visual reference for future search/discovery screens. Lock `MarketplaceRouteCard`'s result variant, the soft-teal qualitative match/served-segment explanation, separate neutral alternative-route treatment, compact search summary/modify-search surface, existing filters/sort presentation and the account-free empty-state Request flow. P01 remains LOCKED and unchanged. Tailwind v4 + shadcn/Base UI standard sizing is mandatory; normal responsive layouts use grid/flex/content-driven sizing without arbitrary custom pixel dimensions or fragile absolute positioning. Detailed patterns and 390/768/1280/1440px references are recorded in `03_TECHNICAL_ARCHITECTURE.md`.

**Reason:** Human-reviewed production results UI establishes a consistent discovery baseline while preserving matching, capacity, multi-vehicle/multi-location rules and existing URL handoffs. This lock changes documentation only. P03 Route Detail High-Fidelity is the next separately scoped visual task; no P03, backend, Auth, Supabase, i18n rollout or provider work begins here.

### D-053 — P03 High-Fidelity and route-detail visual baseline

**Date:** 2026-09-18. **Status:** LOCKED after human desktop and mobile browser review.

**Decision:** P03 High-Fidelity is approved as part of the V1 design baseline. Lock the route-first detail hierarchy, flex-based ordered timeline, compact transport capabilities, evidence-backed carrier trust/reviews, sticky desktop action card and normal-document-flow mobile action card. Preserve canonical capacity/full-route presentation, unavailable/not-found states and existing account-free Request handoffs. P01 and P02 remain LOCKED and unchanged. Tailwind v4 + shadcn/Base UI standard sizing is mandatory; responsive layouts use grid/flex/content-driven sizing. Arbitrary custom pixel dimensions and fragile absolute-positioned layouts are prohibited. Detailed patterns and responsive references are recorded in `03_TECHNICAL_ARCHITECTURE.md`.

**Reason:** Human-reviewed production Route Detail establishes a consistent destination from the locked results UI without altering domain, privacy or acquisition rules. This lock changes documentation only. P04 Carrier Profile High-Fidelity is the next separately scoped visual task; no P04 implementation, backend, Auth, Supabase, i18n rollout or provider work begins here.

### D-054 — P04 High-Fidelity and carrier-profile visual baseline

**Date:** 2026-09-18. **Status:** LOCKED after human desktop and mobile browser review.

**Decision:** P04 High-Fidelity is approved as part of the V1 design baseline. Lock compact carrier identity and verified/reputation summary, public-safe information, restrained trust cards, active-route capability treatment, MarketplaceRouteCard profile reuse, P03-style reviews, desktop two-column marketplace layout and normal-flow mobile stacking. No public phone/email/private address or pre-offer messaging CTA. Preserve active-route eligibility, capacity, review data and existing account-free route/Request actions. P01/P02/P03 remain LOCKED and unchanged. Tailwind v4 + shadcn/Base UI standard sizing and grid/flex/content-driven responsive layouts are mandatory; arbitrary custom pixel dimensions are prohibited. Detailed patterns are recorded in `03_TECHNICAL_ARCHITECTURE.md`.

**Reason:** Human-reviewed production Carrier Profile completes the trust-focused destination from P03 without changing domain, privacy or acquisition behavior. This lock changes documentation only. P05 Create Request High-Fidelity is next, separately scoped; no P05, backend, Auth, Supabase, i18n rollout or provider work starts here.

### D-055 — P05 High-Fidelity and Request-wizard visual baseline

**Date:** 2026-09-19. **Status:** LOCKED after human desktop/mobile review and the correction pass.

**Decision:** P05 High-Fidelity is approved as part of the V1 design baseline. Lock the four-step wizard, default route inheritance, 1–10 vehicles, per-vehicle location overrides, canonical multi-location summaries, shared pickup date/window, per-vehicle photo ownership and compact final review. V1 categories are passenger car, SUV/crossover, van/minivan and motorcycle, with no generic `other`. Preserve progressive registration at publication, the current phone-verification handoff and exact/private address separation. Tailwind v4 + shadcn/Base UI standard sizing and responsive grid/flex/content-driven layouts are mandatory; arbitrary custom pixel dimensions are prohibited. Detailed patterns are in `03_TECHNICAL_ARCHITECTURE.md`. P01–P04 remain LOCKED and unchanged.

**Implementation boundary:** Optional Request budget under D-046 is ARCHITECTURE-LOCKED but NOT YET IMPLEMENTED in the actual P05 Request domain/state. Implement it later with real Request domain/backend work; add no budget UI in this lock. P05 still stops at the local phone-verification handoff without sending a code or publishing; P06 remains the existing demo flow. This visual approval does not imply working Auth, publication, persistence or photo storage.

**Reason:** Human-reviewed production UI and the verified correction pass establish a consistent acquisition baseline without changing domain rules. This lock changes documentation only. P06 Published Success High-Fidelity is the next separately scoped visual task; no P06 implementation, backend, Auth, Supabase, i18n rollout, provider or storage work starts here.

### D-056 — P06 High-Fidelity and published-success visual baseline

**Date:** 2026-09-19. **Status:** LOCKED after human desktop and mobile browser review.

**Decision:** P06 High-Fidelity is approved as part of the V1 visual baseline. Lock the restrained success confirmation, compact route-first published Request summary, concise three-step “Kas toliau?” explanation, primary Request Detail CTA and secondary return-home action. No excessive celebration graphics or promise of real notifications/provider delivery. Preserve current demo/local publication behavior, targeted visibility expansion and existing destinations. Tailwind v4 + shadcn/Base UI standard sizing and responsive grid/flex/content-driven layouts remain mandatory; arbitrary custom pixel dimensions are prohibited. Detailed patterns are in `03_TECHNICAL_ARCHITECTURE.md`. P01–P05 remain LOCKED and unchanged.

**Implementation boundary:** P05 still stops at the phone-verification/demo boundary without publication. P06 does not represent real backend persistence, and notification delivery providers are unimplemented. Optional Request budget remains architecture-locked under D-046 but absent from actual Request domain/state; implement it later with real Request domain/backend work, not under this visual lock.

**Reason:** Human-reviewed production confirmation UI establishes a calm, useful next step without implying backend capabilities or changing lifecycle rules. This lock changes documentation only. P07 Request Detail + Offers High-Fidelity is next, separately scoped; no P07 implementation, backend, Auth, Supabase, i18n rollout or provider work starts here.

### D-057 — P07 High-Fidelity and Request/Offer comparison visual baseline

**Date:** 2026-09-20. **Status:** LOCKED after human desktop and mobile browser review.

**Decision:** P07 Request Detail + Offers High-Fidelity is approved as part of the V1 visual baseline. Lock the compact Request summary/status, Offer comparison list, prominent total Offer price, carrier trust inside cards, existing Offer-status treatment, Offer Detail CTA and Conversation entry only after an Offer exists. Reuse canonical multi-vehicle/multi-location summaries. One Offer covers the complete Request/all vehicles; no partial Offers or partial acceptance. Zero-offers, accepted/selected, historical and closed states follow existing lifecycle and action rules. Tailwind v4 + shadcn/Base UI standard sizing and grid/flex/content-driven responsive layouts remain mandatory; arbitrary custom pixel dimensions are prohibited. Detailed patterns are in `03_TECHNICAL_ARCHITECTURE.md`. P01–P06 remain LOCKED and unchanged.

**Implementation boundary:** current data/actions remain fixture/demo based. Real backend persistence, Auth and notification delivery providers are not implemented. Optional Request budget remains architecture-locked under D-046 but absent from actual Request domain/state, deferred to real Request domain/backend work. P07 does not independently accept Offers or create Bookings.

**Reason:** Human-reviewed Request management makes complete-request Offers easy to compare while preserving commercial, privacy and conversation rules. This lock changes documentation only. P08 Offer Detail High-Fidelity is next, separately scoped; no P08 implementation, backend, Auth, Supabase, i18n rollout or provider work starts here.

### D-058 — P08 High-Fidelity and Offer Detail visual baseline

**Date:** 2026-09-20. **Status:** LOCKED after human desktop and mobile browser review.

**Decision:** P08 Offer Detail High-Fidelity is approved as part of the V1 visual baseline. Lock visually dominant canonical total price, complete-Request/all-vehicle scope, Offer terms (pickup, planned delivery, validity and payment), carrier trust sidebar, existing Offer-linked chat entry, primary Accept and secondary Decline actions, confirmation-dialog behavior and Request/vehicle summary. Accepted/declined/expired/unavailable states follow existing lifecycle. No partial Offers or partial acceptance. Tailwind v4 + shadcn/Base UI standard sizing and responsive grid/flex/content-driven layouts remain mandatory; arbitrary custom pixel dimensions are prohibited. Detailed patterns are in `03_TECHNICAL_ARCHITECTURE.md`. P01–P07 remain LOCKED and unchanged.

**Implementation boundary:** fixture/demo data and local decisions remain; no real backend persistence, Auth, payment processing/escrow or notification providers. i18n/label normalization is pending. Local acceptance does not implement atomic Booking creation or propagate lifecycle changes. Optional Request budget remains architecture-locked but absent from actual Request domain/state. This approval does not expand V1 payment scope.

**Reason:** Human-reviewed Offer Detail establishes a consistent decision screen while preserving complete-Request commercial semantics and existing lifecycle behavior. This lock changes documentation only. P09 Customer Dashboard High-Fidelity is next, separately scoped; no P09 implementation, backend, Auth, Supabase, i18n, provider or payment work starts here.

### D-059 — Messages Inbox and Conversation / Chat High-Fidelity baseline

**Date:** 2026-09-20. **Status:** LOCKED after human desktop/mobile and active/read-only browser review.

**Decision:** Lock `/messages` Inbox and canonical `/messages/[conversationId]`, non-color-only unread presentation, compact route/vehicle/multi-location context, active/archived/completed states, carrier-left/customer-right bubbles and neutral centered system events. Preserve active-only text composer, read-only losing/expired/declined/unavailable Conversations, active winning Conversation while Booking is active and historical/read-only Completed Booking Conversation. One Request + Carrier means one Conversation; revisions reuse it, and no pre-Offer messaging or V1 attachments are introduced. Tailwind v4 + shadcn/Base UI standard sizing and responsive content-driven grid/flex layouts are mandatory; arbitrary custom pixel dimensions are prohibited. Detailed patterns are in `03_TECHNICAL_ARCHITECTURE.md`. P01–P09 remain LOCKED and unchanged.

**Implementation boundary:** fixture/demo messaging only, with no backend persistence, real-time sockets, Auth or notification providers. Attachments, real read receipts and location sharing remain deferred. Existing unread/readAt fixtures do not imply real read receipts. Global i18n/date normalization remains pending; domain and notification architecture are unchanged.

**Reason:** Human-reviewed marketplace messaging preserves transport context and clear active/read-only behavior without changing Conversation identity or lifecycle. This documentation-only lock starts no implementation or integration. Booking / Transport Detail High-Fidelity is next, separately scoped.

### D-060 — Booking / Transport Detail High-Fidelity baseline

**Date:** 2026-09-21. **Status:** LOCKED after human desktop/mobile browser review.

**Decision:** Lock canonical `/bookings/[id]`, immutable accepted Offer/Request snapshot, one aggregate Booked → PickupScheduled → Collected → InTransit → Delivered → Completed lifecycle for all vehicles, multi-vehicle/multi-location support, agreed total price/currency and payment terms. Customer labels are “Vežėjas pasirinktas”, “Paėmimas suplanuotas”, “Automobilis paimtas” / “Automobiliai paimti” according to vehicle count, “Vežama”, “Pristatyta” and “Pervežimas užbaigtas”. Preserve the responsive marketplace-detail hero, accessible six-stage timeline, stage guidance, Delivered-only confirmation, vehicle/route cards, carrier trust and terms. Continue the same accepted Conversation via `/messages/[conversationId]`; Completed remains historical/read-only with agreement details accessible. B01 cannot edit carrier, price, payment terms or original Request. Payments/escrow remain out of V1 scope. Detailed visual patterns are in `03_TECHNICAL_ARCHITECTURE.md`.

**Implementation boundary:** demo/fixture data, no backend persistence, Auth, Supabase, real notifications/providers or payments; full i18n remains pending. Local confirmation does not persist or propagate to separate Chat/Dashboard fixtures. Existing History-to-Completed-Booking navigation gap remains documented. No domain behavior changes.

**Reason:** Human-reviewed Booking presentation makes the accepted agreement, aggregate progress and available actions clear across desktop/mobile. This documentation-only lock changes no P01–P09, Messages Inbox, Conversation / Chat or Booking UI. Notifications High-Fidelity is next, separately scoped. No implementation/integration, commit or push starts here.

### D-061 — Notifications High-Fidelity baseline

**Date:** 2026-09-21. **Status:** LOCKED after human desktop/mobile review.

**Decision:** Lock canonical `/notifications`, stored `href` navigation, compact marketplace-style list, explicit read/unread text, stronger unread titles, dot/tint and non-color-only state meaning. Preserve Visi / unread filtering, local mark-one-on-open, secondary mark-all and compact empty states. Approval terminology “Neskaityti” refers to the existing reviewed “Neperskaityti” filter; no UI label change. `offer.accepted` remains internal-only; `booking.created` is canonical for accepted/booking notifications. No real email/SMS/push providers are implemented in V1 yet.

**Boundary:** fixture data, nonpersistent read state, no backend persistence/Auth/Supabase/realtime/real provider integrations; full i18n pending. All P01–P09, Messages Inbox, Conversation / Chat, Booking / Transport Detail and Notifications High-Fidelity are LOCKED. No application UI or domain changes, commit or push.

**Reason:** Human review approves the final major customer-side High-Fidelity surface before backend work. Detailed patterns are recorded in `03_TECHNICAL_ARCHITECTURE.md`.

### D-062 — Backend Foundation phase order

**Date:** 2026-09-21. **Status:** LOCKED by explicit project instruction.

**Decision:** Next project phase is BACKEND FOUNDATION: (1) Auth, (2) Supabase/Postgres schema, (3) Roles and permissions, (4) Replace fixture data with real persistence, (5) End-to-end marketplace flow. This supersedes the earlier i18n-first implementation sequence, not the locked locale architecture; full i18n remains pending. Preserve all approved UI and domain rules. Roles/access policies must be enforced before real private data is exposed.

**Reason:** The customer High-Fidelity baseline is approved; the next work connects it to authenticated, authorized persistence and validates the complete marketplace flow. This documentation task records the phase only; implementation begins with a separately scoped Auth task.

### D-063 — Closed Beta Carrier Route publication eligibility

**Date:** 2026-09-25. **Status:** Approved by explicit human decision; Phase 3 implementation remains IN REVIEW.

**Decision:** Route create/publish/manage requires a live Auth session, active single-owner membership, an active non-suspended Carrier, explicit controlled beta admission and the base Carrier profile/legal identity fields required by the existing schema. Individual and company Carriers use the same eligibility rule. CMR verification, invoice/tracking declarations, a generic Verified Carrier badge and transport-document categories are not additional Closed Beta Route gates. Beta admission never establishes verification.

**Implementation mapping:** Reuse the admin-controlled owner `profiles.beta_access` and Carrier `visibility='published'`/`suspended_at` fields for explicit admission/public eligibility; ordinary users cannot write these. The trusted bootstrap records both approvals in `audit_log`. Carrier display/legal name, legal business kind and registration country remain schema-validated. No second role model, self-approval endpoint or category policy is introduced. The internal Route eligibility helper can change for a future approved production policy without changing ownership.

**Boundary:** This decision applies to Route supply only. It does not authorize Offer/Booking/Message/Notification/Review persistence, production document rules or distribution providers. Real carriers receive no fabricated verification or reputation.

## How to add a new decision

Add a new `D-XXX` entry only for a material product/architecture decision. Include:

- Decision
- Reason
- Date if helpful

If the decision changes a canonical rule, update the relevant blueprint/architecture document in the same change.
