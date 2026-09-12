# Parvezk.lt — Current Status

**Date:** 2026-09-12
**Current phase:** Phase 1 — Public UI
**Project status:** P01 completed, reviewed and committed. P02 completed and browser-reviewed; ready to commit. Next implementation task: P03 Carrier Route Detail. No P03 or backend work has started.

## P02 implementation — 2026-09-12

- Added `/search` with an inline search editor reusing LocationPicker and DateWindowPicker. Missing/unknown locations, identical locations and malformed dates require correction before results appear.
- Search, date, verification, rating, vehicle category, non-running filters and sort persist in the URL; browser Back/Forward restores applied criteria. Mobile filters use the existing Base UI Sheet.
- P02 accepts both `dateFlexible` and P01's existing `dateOption`; revised P02 dates use `dateFlexible`. Request fallback preserves incoming From/To/date parameters. Calendar dates use local fields without UTC conversion.
- Six fictional route fixtures reuse LocationOption and fixed September 15–24, 2026 dates. Available spaces derive from total minus reserved capacity. Demonstration data is identified in the UI; routes have no prices.
- Deterministic mock matching checks ordered stops, date overlap, capacity and filters. Exact matches and same-pickup/different-delivery-city alternatives appear separately. Match levels are derived per search rather than fixed carrier scores.
- Flexible mock windows mean today through the next 7/14 days or the end of this month, using the Lithuanian calendar. This is a UI-phase assumption, not a new backend matching contract.
- Desktop uses approximately 45% list / 55% map placeholder. Mobile defaults to List with a Map toggle. No map provider, pins or GPS data were added.
- Added reusable RouteCard, MatchBadge, skeleton, empty and error states, with a Next.js loading/error boundary and simple “Rodyti daugiau” batches when needed.
- P03, request creation, backend, authentication and maps remain unimplemented. No package changes or locked product changes.
- Validation: production build passed. Focused query/matching tests cover alias compatibility, invalid inputs, date-safe serialization, request fallback, direction, date overlap, filters, capacity and sorting; run with Node 24 using `node --test tests/search.test.mjs`.
- P02 browser review passed successfully after the presentation corrections. P02 is completed and ready to commit. No commit or push performed for P02.

## P01 implementation — 2026-09-11

- Replaced starter content with the Lithuanian hero, HomeSearch, trust/value section, three steps and carrier CTA using the existing public layout and PageContainer.
- HomeSearch reuses LocationPicker and DateWindowPicker; both actions require distinct selected locations, show associated errors and focus the first invalid control.
- Both destinations preserve the same query contract: `from` and `to` are existing location IDs; optional dates use `dateType=single&date=YYYY-MM-DD`, `dateType=range&dateFrom=YYYY-MM-DD&dateTo=YYYY-MM-DD`, or `dateType=flexible&dateOption=...`.
- Dates serialize using local calendar fields, without UTC conversion. Empty date selections mean anytime; a started range requires an end date.
- Picker changes add accessible descriptions/required state, larger input triggers, and Lithuanian calendar labels. Base UI `render` composition is retained.
- Validation: production build and standalone lint passed using `npm.cmd run build` and `npm.cmd run lint` (PowerShell blocks the npm.ps1 launcher).
- P01 browser review corrections completed: global Geist token mapping, locked labels/helper copy, disabled search until distinct selected locations, and stacked mobile CTAs.
- P01 completed/reviewed and committed as `28b82f4` (`Complete P01 home experience`), pushed to `main`.
- `/search` is now implemented by P02; `/request/new` and `/carrier` remain planned destinations. No locked product rules changed.

## Completed

- Product concept and V1 marketplace logic reviewed multiple times.
- Public/Customer flow locked: P01–P10.
- Carrier flow locked: C01–C15.
- Booking flow locked: B01–B07.
- Account flow locked: U01–U05.
- Messages locked: M01.
- Notifications locked: N01.
- Admin flow locked: A01–A11.
- Cross-screen edge cases reviewed.
- Booking snapshot/versioning/capacity rules locked.
- Frontend design system selected: shadcn/ui + Tailwind.
- Implementation architecture and phased plan defined.
- Next.js 15 deployment to Hostinger is already working.

## Locked frontend stack

- Next.js 15.5.25
- TypeScript
- Tailwind CSS
- shadcn/ui
- Base UI/shadcn primitives
- Lucide icons
- React Hook Form + Zod
- TanStack Table for Admin
- Sonner
- mobile-first Customer/Carrier
- desktop-first Admin
- i18n-ready from the beginning

## Current infrastructure

- Live domain: `parvezk.lt`
- GitHub repo: `https://github.com/e-turinys/traliukas.git`
- Branch: `main`
- Local path: `C:\Projects\traliukas`
- GitHub → Hostinger auto-deploy: working
- Supabase: not connected yet
- shadcn/ui: configured with Base UI, Nova preset and neutral tokens
- Real product UI: public layout, shared pickers, P01 Home and P02 mock Search Results implemented

## Immediate next task

Next implementation task: **P03 Carrier Route Detail**. P02 Search Results is completed, browser-reviewed and ready to commit. No P03 or backend work has started yet. Remaining foundation tasks (including the development catalog and planned form/toast tooling) are not implied complete by P02.

## Next after Phase 0 foundation

P01 Home is completed, reviewed and committed. P02 Search Results is completed, browser-reviewed and ready to commit.

Then:

- P03 Carrier Route Detail
- P04 Carrier Public Profile
- P05 Create Transport Request

Do not start the full Supabase/backend implementation before reviewing these first real UI screens in desktop and mobile layouts unless a required UI decision cannot be made without backend work.

## Do not reopen without a blocker

The following are already locked and should not be casually redesigned during implementation:

- one User can be customer + carrier;
- search works without registration;
- phone OTP required to publish customer Request;
- Carrier Offer requires required verification;
- Route has no price;
- Offer requires a Route;
- Offer does not reserve capacity;
- accepted Offer creates Booking atomically;
- Booking has immutable agreement snapshot;
- Request/Route/Offer versioning prevents stale acceptance;
- targeted vs marketplace Request visibility;
- city-level public location vs private operational address;
- one active pending Offer per carrier + Request;
- normal cancellation only before Vehicle Collected;
- Delivered is not Completed;
- reviews only after Completed Booking;
- no public customer rating in V1;
- lifecycle is separate from moderation;
- no hard-delete in normal workflows;
- no payments/commission/escrow/live GPS/native app in V1;
- shadcn/ui + Tailwind is the UI standard;
- Map is supplemental, List is primary.

## End-of-session rule

Before stopping work for the day:

1. update this file with what was completed;
2. set one explicit “Immediate next task”;
3. update canonical docs if a locked rule changed;
4. add important changes to `05_DECISIONS_LOG.md`;
5. commit docs with code when practical.

## Recommended Codex start prompt

> Read `docs/CURRENT_STATUS.md`, `docs/01_V1_PRODUCT_BLUEPRINT.md`, `docs/03_TECHNICAL_ARCHITECTURE.md`, and the relevant screen section in `docs/02_V1_SCREEN_MAP.md`. Implement only the Immediate next task from CURRENT_STATUS. Do not change locked product rules unless explicitly instructed. Keep the existing Next.js 15 Hostinger build working and run the project build before finishing.
