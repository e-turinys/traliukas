# Parvezk.lt — Current Status

**Date:** 2026-09-11  
**Current phase:** Phase 0 — Foundation  
**Project status:** Product/UX/implementation blueprint completed and locked; production UI coding is the next step.

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
- shadcn/ui: chosen but not yet installed/configured
- Real product UI: not yet built beyond the existing Next.js starter

## Immediate next task

### Phase 0 — Step 1

Install and configure **shadcn/ui** in `C:\Projects\traliukas` without breaking the existing Next.js 15 Hostinger build.

Then:

1. establish semantic theme/design tokens;
2. create core layout/folder conventions;
3. prepare i18n-ready string structure;
4. add Sonner and core form conventions;
5. create `/dev/components` development component catalog;
6. verify `npm run build` locally;
7. commit and push;
8. verify Hostinger deployment.

## Next after Phase 0 foundation

Build **P01 Home** in the real browser using production shadcn components and realistic mock data.

Then:

- P02 Search Results
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
