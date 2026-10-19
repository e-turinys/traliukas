# Parvezk.lt V1 — Implementation Plan

**Roadmap reconciled:** 2026-10-19. **Historical master-plan consolidation:** 2026-09-17.

## Active roadmap — reconciled after locked backend Phases 1–5

**2026-10-19; documentation-only recommendation (D-067).** Backend Phases 1–5 are LOCKED and Phase 5 is merged into `main`. The older UI/master-plan phase numbers below are historical, not a remaining implementation queue. This roadmap does not authorize implementation, provider purchases, hosted access or deployment. Each phase needs a separately scoped execution instruction.

**Sequence: Notifications Persistence → Hosted Release and Beta Acceptance → CLOSED BETA READY → Public V1 Trust and Launch Acceptance → PUBLIC V1 READY.** Three remaining phases, two before beta. Labels replace old numbering; do not call the next task the old Phase 6.

Closed beta means a bounded, explicitly admitted cohort with named manual support, phone OTP and manual Carrier verification. Public V1 means public acquisition and a documented admission/application route for new users, still with controlled Carrier verification; it does not mean anonymous writes, automatic Carrier approval or unlimited volume. Initial launch serves users who can use the current Lithuanian interface; multilingual market expansion is outside these gates. English source/fallback architecture remains locked for later translation work.

### Completed — do not schedule again

| Locked backend phase | Delivered capability |
|---|---|
| 1 — Supabase/Auth Foundation | Local Auth integration, identity/ownership, private schemas, grants/RLS and audit foundations |
| 2 — Customer Request Persistence | Phone OTP publication, persisted Requests/vehicles, real success/detail data |
| 3 — Carrier Route Persistence | Carrier-owned Route management, public discovery/detail and complete-request matching foundations |
| 4 — Offer / Conversation / Booking Transaction | Offers/revisions, persisted text Chat, atomic acceptance, immutable agreement, exact reservation, Dashboard integration |
| 5 — Booking Operational Lifecycle | Carrier stages through Delivered, Customer Completed, pre-collection cancellation/exact release, terminal Chat, active/history, role-aware UI and header/logout |

Evidence: `08_PHASE4_REVIEW.md`, `09_PHASE5_REVIEW.md`. Latest recorded validation: 636 pgTAP, 6 foundation, 143 unit assertions/tests; Phase 5 concurrency 4/4, Phase 4 concurrency 3/3, responsive lifecycle/header browser checks and production build passed. These are local results, not proof of hosted readiness. No validation suite is rerun for this roadmap change.

### Current implementation evidence and launch classification

A = required before Closed Beta (and therefore also Public V1). B = additional requirement before Public V1. C = safe to defer after launch under the stated boundaries. Configuration or operations marked unverified are not claimed absent from external accounts: no hosted account was inspected.

| Remaining item | Repo evidence / present state | Class and smallest sufficient deliverable |
|---|---|---|
| In-app Notifications | `/notifications` calls `listMockNotifications`; `NotificationsView` updates local state. Internal events exist; no notifications table/commands. | **A:** persisted recipient-scoped feed, read state and canonical links from existing events. Preserve D-042/D-061; no delivery provider. |
| Reviews/reputation | `mock/carrier-reviews.ts`; real Carrier projections return null rating/zero reviews. No reviews table/commands. | **B:** eligible Completed-Booking reviews and truthful aggregates; both OD-4 directions, public Customer→Carrier and private Carrier→Customer. Beta shows no invented reviews and collects feedback through support. |
| Hosted Supabase | Eleven local migrations; `.env.example` and `supabase/config.toml` are local-only. No hosted migration/configuration acceptance evidence. | **A:** isolated staging/production, reviewed migration rollout, correct API schema/grants, credentials and region selection, no test seeds. |
| Production phone OTP | Managed Auth helper exists; local config explicitly has no SMS provider. | **A:** real SMS delivery to intended countries, expiry/resend/failure tests and provider cost controls. No fixed test codes or manually asserted phone confirmation. |
| Auth email | Local mail sink and email Auth config exist; current product sign-in uses phone. | **A decision/configuration:** disable unused email sign-in/recovery routes or configure/test custom SMTP for every enabled email Auth flow. Optional email login itself is **C**; unverified contact email never substitutes for phone proof. |
| Business email/SMS/push | Channel intent/helpers only; no delivery integration. | **C:** beta/public V1 use in-app updates/manual refresh and state that limitation. Support watches time-sensitive beta cases; reconsider delivery only if pilot evidence makes it necessary. |
| Security hardening | Transaction authorization, live-session checks, RLS and denial/concurrency tests exist. Hosted settings and dependency exposure not verified. | **A:** targeted production security review, supported/patched dependency check, secret/cookie/cache/redirect/origin and public projection checks; fix blockers, do not rewrite the authorization model. |
| CAPTCHA/rate limits/abuse | Local Auth limits exist; `requestPhoneOtp` accepts an optional CAPTCHA token but callers supply none. | **A:** provider-enforced CAPTCHA on exposed OTP entry points, attempt/resend/IP/contact limits, SMS spend alerts/limits; bound domain spam and test direct API abuse. Beta admission alone does not protect the public Auth endpoint. |
| Admin/bootstrap/seed | Ownership/verification/audit schema exists; local fixture scripts use privileged bootstrap. No production admin workflow evidence. | **A:** least-privileged, MFA-protected operator procedure for real admission, verification/revocation, suspension, support and account recovery; audited reasons. Curated locations only, no fixture identities/ratings/Bookings. Full admin dashboard is **C**. |
| Customer/Carrier onboarding | Phone login works; Carrier access requires pre-existing admitted owner/profile and tells users to contact admin. | **A:** documented invitation/contact and manual onboarding with actual identity verification. **B:** reachable public application/admission/status/help flow and defined replacement for invite-only Customer admission; preserve server authority and Carrier verification. |
| Support/report/moderation | Audit foundations exist; no support/report UI or legal/help routes. | **A:** reachable support channel, assigned operator and tested restricted handling of suspended actors, disputes and post-collection exceptions. **B:** public reporting instructions, review moderation and response ownership. Automated case management is **C**. |
| Monitoring/logging/errors | Some server diagnostics; no integrated error/uptime alerting or operational runbook found. `analytics.enabled=false` is local Supabase analytics, not a product analytics implementation. | **A:** health/uptime, redacted error logs and actionable Auth/DB/provider/backup alerts with an owner. No new observability platform required if host tooling suffices. |
| Privacy/legal/terms | Footer and publish form link `/terms` and `/privacy`, but neither route exists; terms version is stored. Retention periods remain unapproved. | **A:** owner-approved notices/terms matching the service, working links, versioned acceptance, documented data inventory/processors/retention/access-erasure and incident procedures. Qualified legal review before real personal data; do not invent retention periods or claim compliance from schema design. |
| Deployment/release | Prior Hostinger auto-deploy recorded; README is generic, Next config minimal. Local build passes. Hosted backend deployment not verified. | **A:** HTTPS/domain, server runtime/env, staging smoke test, protected release/migration order, rollback/forward-fix procedure; no production resets or destructive fixture scripts. |
| Backups/recovery | Restore rehearsal is required by architecture, but no completion evidence. | **A:** approved recovery objectives, configured backup/access/retention and restore drill into isolation, including Auth/config/secrets recovery ownership. Objects need a separate plan if Storage is ever enabled. |
| E2E beta acceptance | Strong local two-party and concurrency coverage; no real-delivery hosted proof. | **A:** hosted staged test with separate real accounts/devices and real OTP, tenant isolation, failure/retry and full lifecycle/cancel paths; go/no-go sign-off. |
| Public load/accessibility/pilot | Local responsive checks exist; no hosted load or real pilot evidence. | **B:** bounded-load performance and accessibility checks, pilot outcome/support review, resolved critical issues and an explicit public release decision. |
| Launch analytics | No product analytics SDK/pipeline found; authoritative Request/Offer/Booking timestamps exist. | **B:** minimal aggregate pilot measures from existing records: Offer rate, time to first Offer, conversion, completion/cancellation, support burden. **C:** tracking SDK, marketing attribution, session replay and advanced funnels; no tracking cookies required for launch. |
| Realtime Chat/read receipts | Persisted messages and internal read cursors exist; realtime disabled. | **C:** retain reload-based Chat and existing unread behavior. User-visible receipts/websockets are not launch dependencies. |
| Attachments/vehicle photos | Storage disabled; Request payload explicitly rejects selected photos. No production upload pipeline. | **C:** text-only launch. **A honesty gate:** hide/disable unavailable upload promises before publication, never silently discard files. No Storage tables or upload service just for beta. |
| Route Distribution | Audited `carrierRoute.published` boundary exists; no jobs/adapters. | **C:** no Telegram/Facebook/WhatsApp integrations or distribution infrastructure. |
| Payments/escrow | Agreed price/payment terms persist; no processor. | **C / outside V1:** payment remains between parties; copy/terms must not promise platform-held funds. |
| Full i18n | Preferred locale foundation, mainly Lithuanian UI; no complete translation layer. | **C:** limited-language launch with honest supported-language scope; preserve D-044 for future rollout. Essential legal/error/action copy must be understandable to the admitted audience (**A**). |
| Request management gaps | Real edit/close unavailable; effective stale/expiry checks enforced without a worker. | **A:** safe audited support closure for unwanted active Requests and truthful controls. **B:** narrow owner close path for unbooked Requests with appropriate Offer/thread handling. **C:** material edits/repeat automation and expiry reconciliation worker while effective checks remain authoritative. |
| Targeted publication, Saved Carriers, optional budget UI | Targeted publication falls back explicitly to marketplace; Saved Carriers not persisted; budget payload/schema support exists but UI remains deferred. | **C:** retain explicit marketplace consent and truthful unavailable controls. No duplicate Request persistence work. |
| Maps/KYC/staff/native/GPS | Outside current minimal transaction implementation. | **C:** full maps/geocoding, automated KYC, staff permissions, native app/live tracking, segment capacity/reuse and expanded trust badges. |

### Notifications Persistence — IN REVIEW (human review is the immediate next task)

**Implementation update, 2026-10-19:** persisted implementation and local validation are complete; see `10_NOTIFICATIONS_REVIEW.md`. Human approval is pending. The user explicitly authorized cancellation notifications to the other affected participant; D-068 adds `booking.cancelled` in-app only. Earlier recommendation not to add it without a separate instruction is now satisfied. Hosted readiness remains unstarted.

**Objective:** make the existing Notifications screen reflect the user's actual marketplace activity. **Gate: A, required before Closed Beta.**

**Exact scope:** recipient-owned persisted notifications/read state; connect the existing locked Offer/Message/Booking event allowlist in backend architecture section 15 to transactional creation; unique event+recipient dedupe, actor suppression, immutable content/canonical server-built href, own mark-one/mark-all and the existing UI. New live events only; no invented historical backfill. `offer.accepted` stays internal-only; `booking.created` is the single acceptance notification. System Chat messages must not recursively generate message Notifications. Do not add cancellation as a new notification type without a separate policy decision; its existing Booking/system-event behavior remains.

**Out of scope:** Reviews, realtime/global live badge, external delivery/preferences, new event framework, redesign or changes to locked acceptance/lifecycle semantics.

**Acceptance:** reload and a second session retain notification/read state; unrelated users cannot read/write rows; link destinations independently authorize access; retries/concurrent commands produce one eligible notification; late failure rolls back with the domain transaction; no actor duplicates or system-message recursion. Existing Phase 4/5 capacity/snapshot/authorization tests remain green, relevant new database/UI tests pass, and human review approves the existing screen with real data. A clean new user sees an empty real feed, never mock notifications.

### Following phase — Hosted Release and Beta Acceptance

**Objective:** run the already implemented marketplace safely for a small invited cohort. **Gate: A; exit is CLOSED BETA READY.** Work can be prepared alongside Notifications, but neither gate is waived.

**Exact scope:** all A operational rows above: staging/production configuration and migration plan; phone provider, conditional Auth SMTP, OTP CAPTCHA/rate/spend controls; focused security/dependency/cache review; release isolation of demo IDs/fixture fallbacks and unavailable features; manual onboarding/verification/admin support/recovery procedure; working terms/privacy/help/contact, approved retention handling; monitoring and backup/restore; Hostinger production runtime/deployment/rollback; hosted E2E acceptance. Implement only the minimum missing operator commands/tools needed to make manual support safe and audited, never generic privileged status edits or test-bootstrap access in the app. Check unresolved delivery-location/contact instructions operationally without reopening the locked lifecycle.

**Out of scope:** full admin suite, Reviews, new marketplace flows, business notification providers, multi-language rollout, analytics SDK, realtime, uploads, payments and distribution. Do not replace the local suite with hosted destructive tests or copy test Auth users into production.

**Acceptance:** no synthetic reputation/transactions on production routes; missing production env fails closed instead of selecting demos; deployment/config checklist and rollback exercised; real SMS succeeds and outage/expired-code/retry/logout/isolation tests pass; abuse controls reject direct endpoint misuse; security-critical issues fixed; invited Customer and Carrier can onboard without developer fixture scripts; operators demonstrate admission/revocation, safe Request closure, recovery and support escalation without changing immutable agreements. Approved legal/support pages load from the actual publication form. A backup restore is verified against agreed recovery objectives; a synthetic error triggers the named operator's alert without sensitive payloads. Hosted two-party Request→Offer→Chat→acceptance→Completed plus separate cancellation/retained-capacity cases pass across the established responsive widths. Human go/no-go names cohort, support owner and capacity limits. No outstanding security/data-loss/core-flow blocker.

### Final phase — Public V1 Trust and Launch Acceptance

**Objective:** add minimum public trust and admission capability, then validate public operation using beta evidence. **Gate: B; exit is PUBLIC V1 READY.**

**Exact scope:** Completed-only Reviews under OD-4 (unique Booking+direction, correct author, public Customer→Carrier/private Carrier→Customer, safe aggregates and audited moderation); public Customer/Carrier application, admission and help paths with an explicitly approved production eligibility policy; owner close of unbooked Requests; public reporting/support coverage; aggregate pilot metrics; load/accessibility/security regression checks and production release sign-off. Manual Carrier verification remains acceptable. Removing invite-only Customer gating requires an explicit policy decision and a narrow implementation, never a broad grant or bypass. Resolve legal/operational changes from the pilot before widening admission.

**Out of scope:** automatic verification, full enterprise admin, review solicitation providers, public Customer ratings, review imports, general Request editor, new payment/Chat systems and all C items.

**Acceptance:** incomplete/cancelled/wrong-party/duplicate reviews are rejected; private Customer feedback is never public; ratings/counts derive only from eligible visible real reviews; moderation is auditable. New non-invited users have a tested admission path and clear pending/rejected states; Carrier Offer verification stays enforced. Owner closure cannot cancel a booked transport or release capacity. Hosted pilot demonstrates real completed transports, support/recovery handling and no unresolved critical defects; the owner records acceptable response times, load/concurrency limits and pilot outcomes before public release. No arbitrary requirement for 100 Requests/20–30 Carriers: those old targets are observations to measure, not mandatory build scope. Production safeguards from the beta gate remain effective.

### Readiness estimate (planning judgment, not release approval)

**Closed Beta: approximately 70%. Public V1: approximately 55% (both ±10 percentage points).** The persisted core and local validation are strong. Notifications, hosted identity/deployment/recovery and operational/legal proof remain beta gates; public trust, wider onboarding and real pilot evidence remain additional public gates. These estimates express scope completion, not elapsed time, security certification, current uptime or permission to launch. Hosted readiness is unverified, not assumed complete from historical frontend deployment. Re-estimate after each gate; any missing mandatory gate blocks launch regardless of percentage.

### Superseded sequencing and preserved decisions

- Old master-plan Phases 0–4 mixed frontend milestones with backend work; completed capability is mapped above, not reimplemented.
- Old Phase 5 Carrier Marketplace and Phase 6 Booking and Conversation are **superseded as implementation phases** by backend Phases 3–5. Only Reviews from old Phase 6 remain, now in Public V1 Trust and Launch Acceptance.
- Old Phases 7–10 are **superseded as a release sequence**: Notifications goes first; necessary operator/security/release tasks precede beta; pilot evidence precedes public launch. The full admin UI, provider/distribution and analytics wishlist does not block release.
- Architecture section 2's broad beta list included Reviews; OD-4 permits deferral. This recommendation explicitly schedules Reviews before Public V1, not before the bounded beta. Notifications stays a beta requirement. Locked authorization, privacy, review directions and domain invariants do not change.
- Earlier “no backend/Auth yet” paragraphs and Phase 4's deferred lifecycle are dated history, superseded by the lock records. “Hostinger deploy working” describes frontend history, not verified hosted Supabase readiness. Historical records below and D-001–D-066 remain intact.

Operational reference checks (public documentation only; no account access): [Supabase production checklist](https://supabase.com/docs/guides/deployment/going-into-prod) supports checking production RLS, admin access, load and delivery configuration; [Auth CAPTCHA](https://supabase.com/docs/guides/auth/auth-captcha) documents provider enforcement; [database backups](https://supabase.com/docs/guides/platform/backups) distinguishes database recovery from Storage objects. Provider/plan selection and actual configuration are future scoped work, not completed by this review.

## Historical master plan — superseded sequence, retained for traceability

The following records describe earlier implementation stages. “Next”, missing-backend statements and phase exit criteria below are historical. Use the active roadmap above for remaining work; use CURRENT_STATUS and the phase review records for completed work.

## Historical working strategy

Do not ask Codex to “build Parvezk.lt” as one task.

Build in phases with small, reviewable milestones.

The first UI phases use realistic mock data in the real production component stack. This replaces a separate high-fidelity Figma build for V1. The same components should survive into production; only their data source changes.

### Current visual milestone

P01, P02, P03, P04, P05, P06 and P07 High-Fidelity are LOCKED after human desktop and mobile browser review. P05 also passed its correction review. P01 supplies the V1 foundation (D-051), P02 results/discovery (D-052), P03 route detail (D-053), P04 carrier profiles (D-054), P05 the Request wizard (D-055), P06 published success (D-056), and P07 Request Detail + Offers (D-057). P05 locks the four steps, default inheritance, 1–10 vehicles, independent locations/photos, canonical route summaries, four-category V1 scope without `other`, shared pickup window, compact review, publication-time registration/phone-verification boundary and private address separation.

See `03_TECHNICAL_ARCHITECTURE.md` for mandatory Tailwind v4 + shadcn/Base UI standard sizing and responsive grid/flex/content-driven layouts; arbitrary custom pixel dimensions are prohibited. Optional Request budget remains ARCHITECTURE-LOCKED but NOT YET IMPLEMENTED in the actual P05 Request domain/state. Implement it later with real Request domain/backend work, not as a budget UI addition in this lock.

P06 locks restrained confirmation, compact route-first summary, three-step next actions, Request Detail primary CTA and secondary return-home action, without excessive celebration or promises of real notifications. P05 still stops at its phone-verification/demo boundary; P06 remains demo-only without backend persistence or notification delivery providers.

P07 locks compact Request/status summaries, Offer comparison, prominent complete-Request total prices, carrier trust/status, Offer Detail and existing Offer-linked Conversation actions, canonical multi-vehicle/location summaries, and lifecycle-correct zero-offers/accepted/closed states. No partial Offers or acceptance. Data remains fixture/demo based; real persistence, Auth and notification delivery providers remain unimplemented.

P08 Offer Detail High-Fidelity is also LOCKED after human desktop/mobile browser review (D-058). P01–P08 are now LOCKED. P08 locks visually dominant canonical total price for the complete Request, terms/dates/validity/payment presentation, carrier trust sidebar, Offer-linked chat, Accept/Decline actions and confirmations, lifecycle-correct unavailable/historical states, and Request/vehicle scope summaries without partial Offers or acceptance. Fixture/demo behavior remains; real persistence, Auth, payment processing/escrow and notification providers are unimplemented, and i18n/label normalization is pending.

P01–P09 High-Fidelity remain LOCKED. Messages Inbox and Conversation / Chat High-Fidelity are now LOCKED after human desktop/mobile and active/read-only review (D-059). Preserve canonical routes, non-color-only unread state, compact context, carrier-left/customer-right/system-centered presentation, active-only text composer, Conversation identity/revision reuse and lifecycle-correct read-only history. No pre-Offer messaging or V1 attachments. Fixture/demo messaging, missing persistence/realtime/Auth/providers, deferred attachments/read receipts/location sharing and pending global i18n/date normalization remain documented gaps.

**Booking / Transport Detail High-Fidelity = LOCKED** after human desktop/mobile review (D-060). Preserve canonical `/bookings/[id]`, immutable accepted Offer/Request snapshot, count-aware six-stage aggregate lifecycle, multi-vehicle/multi-location presentation, agreed total price/payment terms, same accepted Conversation, Delivered-only confirmation and historical/read-only Completed state. No editing Request/carrier/price/payment terms; no payments/escrow in V1. Responsive marketplace-detail patterns are recorded in `03_TECHNICAL_ARCHITECTURE.md`. Demo data, absent backend persistence/Auth/Supabase/real notifications/providers/payments and pending full i18n remain documented gaps.

**Notifications High-Fidelity = LOCKED** after human desktop/mobile review (D-061). P01–P09, Messages Inbox, Conversation / Chat, Booking / Transport Detail and Notifications now form the locked customer High-Fidelity baseline. Preserve `/notifications`, stored `href`, compact marketplace list, explicit non-color-only read/unread treatment and Visi / unread filters (reviewed UI: “Neperskaityti”; approval terminology: “Neskaityti”). `offer.accepted` stays internal-only; `booking.created` is the canonical accepted/booking notification. Fixture data, nonpersistent read state, absent backend persistence/Auth/Supabase/realtime/providers and pending full i18n remain documented gaps. No real email/SMS/push providers are implemented yet.

Next project phase: **BACKEND FOUNDATION**, in the D-062 order below. This documentation-only approval changes no application UI and starts no backend implementation.

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

1. Auth: progressive passwordless authentication and publish-time Customer verification, preserving public browsing and local Request drafting.
2. Supabase/Postgres schema: define entities and migrations from locked domain decisions.
3. Roles and permissions: enforce Customer/Carrier/Admin authorization and database access policies before exposing real private data.
4. Replace fixture data with real persistence, preserving locked screen behavior.
5. End-to-end marketplace flow: validate Request → Offer → accepted Booking → Conversation → delivery confirmation with persisted state.

This explicitly approved order (D-062, 2026-09-21) supersedes the prior i18n-first entry order. Locked locale architecture remains valid; full i18n is pending. The next implementation task is Auth, separately scoped; the current documentation approval starts none of these steps.

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

## Historical Phase 5 correction — completed and LOCKED on 2026-10-19

Human decision D-066 explicitly places Booking Operational Lifecycle immediately after locked backend Phase 4. Carrier ownership/Routes/Request browse/complete matching/Offers/Chat/acceptance/capacity already support the closed-beta transaction; do not rebuild or redesign them. Implementation order evolved from the historical plan below.

Deliver the locked aggregate Booked → PickupScheduled → Collected → InTransit → Delivered → Completed chain, selected-Carrier operational authorization, Customer receipt confirmation, and Customer/Carrier pre-collection cancellation with atomic exact capacity release. Preserve the immutable agreement, terminal read-only Conversation and Dashboard placement. No Notifications/Reviews/payments/realtime/Route Distribution scope. Start IN PROGRESS; finish IN REVIEW pending human approval.

## Historical Phase 5 — Carrier Marketplace

### Deliver

- C01–C15 core carrier screens;
- verification gating;
- route creation/editing;
- deterministic matching;
- manual Request browse;
- Offer create/update/withdraw;
- route/request/offer versioning;
- capacity model.

## Historical Phase 6 — Booking and Conversation (superseded)

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

## Historical Phase 7 — Notifications, Reports, Shared Infrastructure

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

## Historical Phase 8 — Admin

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

## Historical Phase 9 — Hardening

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

## Historical Phase 10 — Pilot

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
