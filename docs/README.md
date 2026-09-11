# Parvezk.lt V1 Documentation

This folder is the canonical product and implementation documentation for Parvezk.lt V1.

## Source-of-truth order

1. `CURRENT_STATUS.md` — where the team is now and what to do next.
2. `01_V1_PRODUCT_BLUEPRINT.md` — locked product/business rules.
3. `02_V1_SCREEN_MAP.md` — canonical UX screen map.
4. `03_TECHNICAL_ARCHITECTURE.md` — implementation architecture and data model.
5. `04_IMPLEMENTATION_PLAN.md` — build phases and delivery order.
6. `05_DECISIONS_LOG.md` — important locked decisions and why they exist.
7. `00_PROJECT_OVERVIEW.md` — short project context and V1 scope.

## Working rule

If a chat discussion conflicts with these files, update the relevant canonical document first before implementing the change. Do not let code silently redefine a locked product rule.

## Codex handoff rule

Before implementing a new task, Codex should read:

- `CURRENT_STATUS.md`
- `01_V1_PRODUCT_BLUEPRINT.md`
- `03_TECHNICAL_ARCHITECTURE.md`
- the relevant section of `02_V1_SCREEN_MAP.md`

Then implement only the next task listed in `CURRENT_STATUS.md` unless explicitly instructed otherwise.

Last consolidated: 2026-09-11.
