# Parvezk.lt — Project Overview

**Status:** V1 product/UX architecture locked; implementation is about to start.  
**Last consolidated:** 2026-09-11.

## 1. Product idea

Parvezk.lt is a vehicle-transport marketplace that replaces fragmented Facebook-group behavior with a structured flow for finding carriers, publishing vehicle transport needs, comparing offers, booking transport, communicating, tracking status, and leaving verified reviews.

The initial use case is vehicle transport between Lithuania and other European countries, but the architecture must not be hard-coded to Lithuania-only flows.

The core marketplace has two supply/demand objects:

- **Transport Request** — a customer needs one vehicle transported from A to B.
- **Carrier Route** — a carrier plans to travel from A to B, optionally via ordered intermediate stops, and has capacity available.

The platform matches those two objects. A carrier then sends an **Offer**. If the customer accepts, the platform creates a **Booking**.

## 2. V1 goal

V1 should prove marketplace liquidity and workflow quality, not maximize monetization.

The primary success loop is:

**Search / Request → Offer → Booking → Completed Transport → Review**

V1 should help answer:

- Do real customers publish transport needs?
- Do real carriers create routes and send offers?
- How quickly does the first offer arrive?
- What percentage of requests receive offers?
- What percentage of offers become bookings?
- Do users complete the transport inside the platform flow?
- Do carriers return and reuse routes?

## 3. V1 business model

V1 is free for customers and carriers.

V1 does **not** process payments, take commission, hold escrow, calculate refunds, or mediate chargebacks.

Possible later monetization includes carrier subscriptions, priority visibility, route alerts, analytics, fleet/multi-user tools, premium lead features, and payment/escrow fees. These are not V1 requirements.

## 4. V1 product principles

- Search must work without registration.
- A customer can start a Transport Request as a guest; verified phone is required to publish.
- No dead ends: if no route matches, the customer is encouraged to publish a request.
- Carrier Routes and Transport Requests remain independent until an Offer is accepted.
- Matching is a recommendation layer, not the only way to discover work.
- Carriers may browse Marketplace Requests manually.
- A carrier may browse without a route, but must select/create a concrete Carrier Route before sending an Offer.
- Public pages never expose customer phone, email, exact operational address, or uploaded identity documents.
- Route price does not exist in V1; price appears only in an Offer.
- Reviews are allowed only after a Completed Booking.
- Accepted Booking terms are snapshotted and do not change when the Request, Route, Offer, or profile later changes.
- No live GPS tracking in V1.
- No native iOS/Android application is required for V1; mobile-first web is the target.
- Admin moderation and verification may be manual in V1.
- No hard-delete of business/history objects from normal product workflows.

## 5. V1 main user types

### User

There is one core `User` account. A user can act as a customer and may also create a Carrier Profile. There are no separate customer and carrier accounts.

### Customer capability

A normal User can:

- search carrier routes;
- publish Transport Requests;
- receive and compare Offers;
- accept an Offer;
- manage Bookings;
- communicate inside Offer/Booking conversations;
- confirm delivery;
- review a carrier;
- save carriers.

### Carrier capability

A User with a Carrier Profile can:

- create/edit routes;
- browse Marketplace Requests;
- see route matches;
- complete verification;
- send Offers after required verification is approved;
- manage accepted Bookings and transport statuses;
- build reputation from completed transports.

### Admin

Admin controls verification, moderation, disputes, support overrides, reviews, and audit history. Admin is not a silent editor of marketplace agreements.

## 6. V1 non-goals

The following are intentionally excluded from V1 unless a blocking real-world requirement emerges:

- payment processing;
- escrow;
- commission collection;
- live GPS tracking;
- AI route optimization;
- AI matching as the primary logic;
- per-segment carrier capacity;
- advanced route-stop ETA modeling;
- native mobile apps;
- multi-currency offers;
- complex carrier BI/revenue analytics;
- carrier/customer open direct messaging outside a Request/Offer/Booking context;
- fully automated KYC;
- public customer reputation score;
- real-time bidding/auction mechanics.

## 7. Frontend standard

Parvezk.lt V1 uses one design system instead of custom UX per screen:

- Next.js 15
- TypeScript
- Tailwind CSS
- shadcn/ui
- shadcn/Base UI primitives
- Lucide icons
- React Hook Form + Zod for forms
- TanStack Table + shadcn for admin tables
- Sonner for toasts
- mobile-first layouts
- i18n-ready text structure from the beginning

Rule: **do not create a custom component if a standard shadcn pattern solves the problem well.**

## 8. Current infrastructure

- Domain: `parvezk.lt`
- Hosting: Hostinger managed Node.js / Next.js hosting
- Repository: `https://github.com/e-turinys/traliukas.git`
- Main branch: `main`
- Local project path: `C:\Projects\traliukas`
- Current framework version: Next.js 15.5.25
- GitHub → Hostinger deployment: working
- Supabase: planned, not connected yet
- shadcn/ui: chosen, not yet installed/configured at the time of this snapshot

## 9. Next milestone

Start **Phase 0 — Foundation**:

1. install/configure shadcn/ui;
2. create semantic theme/design tokens;
3. establish folder/layout structure;
4. establish i18n-ready text structure;
5. add reusable component shell;
6. build P01 Home with realistic mock data;
7. continue P02/P03/P04/P05 as real browser UI before building the full backend.
