# Parvezk.lt V1 — Implementation Plan

**Last consolidated:** 2026-09-17.

## Working strategy

Do not ask Codex to “build Parvezk.lt” as one task.

Build in phases with small, reviewable milestones.

The first UI phases use realistic mock data in the real production component stack. This replaces a separate high-fidelity Figma build for V1. The same components should survive into production; only their data source changes.

### Current visual milestone

P01 and P02 High-Fidelity are LOCKED after human desktop and mobile browser review. P01 remains the V1 visual foundation under D-051; P02 adds the results/discovery baseline under D-052, including the shared card's result variant, match/alternative treatments, compact search editor and empty-state flow. See `03_TECHNICAL_ARCHITECTURE.md` for mandatory sizing/layout rules and responsive references. The next visual task is **P03 Route Detail High-Fidelity**, separately scoped and preserving locked functionality. P03 does not start as part of this documentation lock. Backend-phase ordering below remains unchanged and does not authorize backend, Auth, Supabase, i18n rollout or provider work now.

## Phase 0 — Foundation

### Goal

Prepare the existing Next.js repository for consistent product development.

### Tasks

- install/configure shadcn/ui;
- establish Base UI/shadcn primitives;
- define semantic theme tokens;
- establish public/customer/carrier/admin layout structure;
- create folder/component conventions;
- prepare i18n-ready string structure;
- add Lucide icon usage conventions;
- add Sonner;
- establish React Hook Form + Zod conventions;
- create reusable `EmptyState`, `ErrorState`, `LoadingCards` shells;
- create dev-only `/dev/components` catalog;
- confirm lint/build/deploy pipeline still passes Hostinger.

### Exit criteria

- `npm run build` passes locally;
- deployment to Hostinger still works;
- shadcn components render correctly;
- semantic theme/tokens exist;
- layouts and component folders are established;
- `/dev/components` exists with at least a few reusable primitives.

## Phase 1 — Public UI with mock data

### Goal

Create the public marketplace shell in the browser before backend complexity.

### Screens

- P01 Home
- P02 Search Results
- P03 Carrier Route Detail
- P04 Carrier Public Profile

### Important components

- LocationPicker mock/autocomplete shell
- DateWindowPicker
- RouteCard
- RouteSummary
- CarrierTrust
- VerificationBadge
- RatingDisplay
- Search filters
- mobile List/Map switching shell

### Exit criteria

- desktop + mobile usable;
- no major layout problems;
- loading/empty/error states exist;
- mock search/route/profile flows connect correctly;
- Map can still be a placeholder/lazy shell if provider not selected.

## Phase 2 — Request / Offer UI with mock or light state

### Screens

- P05 Create Transport Request
- P06 Request Published
- P07 Request Detail + Offers
- P08 Offer Detail
- P09 Customer Dashboard
- P10 Saved Carriers
- preliminary shared auth/OTP UI shell as needed

### Exit criteria

- full customer happy path can be clicked through using realistic mock data;
- request form keeps state between steps;
- targeted vs marketplace visibility is represented correctly;
- stale/expired/unavailable Offer states have UI;
- responsive review complete before database work expands.

## Phase 3 — Backend foundation

### Goal

Connect real persistence/auth/storage without changing locked UX rules.

### Locked entry order

1. Establish the i18n foundation: English source/fallback, supported locale registry, translation-key boundaries and locale-aware formatting adapters. Do not attempt a full translation rollout in this step.
2. Implement progressive passwordless Auth/User roles and publish-time Customer verification; retain public browsing and local Request drafting.
3. Define and migrate the Supabase schema/RLS from the locked domain decisions.
4. Move mock entities to persistence incrementally, preserving locked screen behavior.

### Tasks

- provision/configure Supabase project;
- database schema/migrations;
- progressive passwordless auth and Customer/Carrier role model;
- publish-time phone verification and provider decision/integration;
- email verification;
- Storage buckets/policies;
- server-side authorization conventions;
- environment variable setup in local/Hostinger environments;
- seed/demo data;
- establish domain/business action layer.

### Priority entities

- User
- Carrier Profile
- Carrier Verification / Documents
- Transport Request / Request Versions
- Carrier Route / Stops / Route Versions
- Route Distribution Jobs
- Offer / Offer Revisions
- Booking
- Conversation / Messages
- Booking Activity
- Notifications
- Reports
- Reviews
- Audit

## Phase 4 — Real Customer Marketplace

### Goal

Replace customer mock flows with live data.

### Deliver

- public route search;
- Request publication;
- customer Dashboard;
- Request edit/close/repeat;
- Offer display;
- Saved Carriers;
- customer authorization/privacy.

## Phase 5 — Carrier Marketplace

### Deliver

- C01–C15 core carrier screens;
- verification gating;
- route creation/editing;
- deterministic matching;
- manual Request browse;
- Offer create/update/withdraw;
- route/request/offer versioning;
- capacity model.

## Phase 6 — Booking and Conversation

### Deliver

- atomic `acceptOffer()`;
- Booking snapshot;
- Offer conversation → Booking conversation continuity;
- Booking operational details;
- status lifecycle;
- pre-collection cancellation;
- delivery confirmation;
- review flow.

### Highest-priority tests

- simultaneous acceptance of final capacity;
- double-click/idempotency;
- stale version blocked;
- Booking snapshot immutability;
- authorization.

## Phase 7 — Notifications, Reports, Shared Infrastructure

### Deliver

- M01 Messages Inbox;
- N01 Notifications;
- email notification hooks;
- notification preferences;
- B06 reports;
- internal Booking activity timeline;
- deep-link return after auth.
- `carrierRoute.published` handling and provider-independent Route distribution job creation;
- Telegram automated adapter only after provider selection;
- Facebook generated/manual post package baseline;
- future opt-in WhatsApp Business adapter.

Route-distribution adapters must consume public localized payload snapshots, point to `/routes/[routeId]`, exclude exact addresses/phone numbers, and remain separate from Carrier Route persistence. Provider integration is not part of the pre-backend architecture lock.

## Phase 8 — Admin

### Deliver

- A01–A11;
- verification queue/detail;
- user suspension/ban flow;
- Request/Route moderation;
- Offer audit;
- Booking support view/override;
- Report case management;
- Review moderation;
- Audit log;
- server-side Admin table filtering/pagination.

## Phase 9 — Hardening

### Security

- verify all server-side authorization paths;
- private Storage URL/access review;
- OTP abuse/rate limiting;
- admin permission review;
- audit sensitive access where required.

### Quality

- core unit/integration tests;
- concurrency tests;
- mobile browser testing;
- accessibility pass;
- performance pass;
- error/empty/loading state pass;
- localization readiness check.

### Product analytics

- funnel events;
- search no-result rate;
- request → first Offer time;
- request → Offer rate;
- Offer → Booking conversion;
- Booking completion rate;
- carrier repeat route creation.

## Phase 10 — Pilot

### Goal

Validate marketplace liquidity with real users before expanding scope.

Suggested initial validation targets discussed:

- approximately 100 real transport Requests;
- approximately 20–30 real carriers;
- measure Offer rate;
- time to first Offer;
- Booking conversion;
- completion rate;
- repeated carrier/customer usage.

### Pilot operating model

- manual verification acceptable;
- manual Admin support acceptable;
- closely inspect no-result searches;
- interview carriers/customers after real flows;
- put non-blocking feature ideas into V1.1/V2 rather than adding them mid-pilot.

## Session workflow

At the end of every meaningful work session:

1. update `CURRENT_STATUS.md`;
2. update the relevant canonical document if a locked rule changed;
3. add a line to `05_DECISIONS_LOG.md` for architectural/product decisions;
4. commit docs together with the code change when practical;
5. make the next task explicit.
