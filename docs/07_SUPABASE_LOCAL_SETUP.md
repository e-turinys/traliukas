# Supabase/Auth foundation — local development

**Supabase/Auth Foundation Phase 1 = LOCKED** after successful local Linux/PostgreSQL validation on 2026-09-24. The Linux checkout is canonical. No old workstation implementation or marketplace fixtures are imported. Schema authority: [locked backend architecture](06_BACKEND_FOUNDATION_ARCHITECTURE.md). Do not link this checkout to a remote project.

## Prerequisites and startup

Use Node 22.18+ (Node 24 is also supported), npm and a running Docker daemon accessible to the current user. Check `docker --version` and `docker info`. If daemon access is denied, have the workstation administrator repair Docker access and restart the affected login/agent session. Do not make the socket world-writable.

```sh
npm install
npm run supabase:start
```

The CLI is a project dev dependency, not a global installation. The `project_id` in `supabase/config.toml` is a local container namespace, not a hosted project ID. Local ports are API 54321, PostgreSQL 54322, Studio 54323 and the email inbox 54324. The exposed Data API schema is only `api`; `app` and `private` are not exposed. Realtime, Storage, edge functions and analytics are disabled for this phase.

Do not run `supabase login`, `link`, `db push`, or commands with `--linked`, `--project-id` or a remote database URL. `db:reset` destroys only this local project's database; it is intended for disposable development data.

## Environment contract

Copy `.env.example` to ignored `.env.local`. Obtain the actual local values from `npx --no-install supabase status`; do not copy values from a hosted project or documentation example.

- `NEXT_PUBLIC_SUPABASE_URL`: the running local API URL.
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: the local publishable key, or legacy local `anon` JWT when emitted by the CLI.

These are public configuration, not administrative credentials. Secret/service-role keys are rejected by the configuration validator. The app does not need a service-role key, database password, SMS credential or SMTP credential. No admin client is exported. Future privileged jobs must live in `server-only` modules with separately scoped credentials; ordinary app calls continue using the caller's JWT.

Both variables can remain absent while reviewing the unchanged fixture UI. Creating an Auth client requires both; incomplete or invalid configuration fails. Middleware refreshes configured sessions and sets private/no-store cache headers. Server Components use a per-request cookie client and no-store fetches. There are no new cached personalized pages or HTTP mutation endpoints.

## Passwordless Auth and local delivery

The browser helper supports phone OTP, verification, and attaching/changing a phone within an existing authenticated account. It is intentionally not wired into P05 or any locked screen. A verified session does not publish a Request. No password-first UI, anonymous Auth account, magic-link callback or Request persistence is introduced.

Local email confirmation is enabled, with messages captured by the local inbox. Optional email OTP application helpers are not introduced. Phone confirmation is enabled in config, but **phone login is unavailable until a local test OTP map or a real SMS provider is configured**. The CLI reports this honestly; do not disable confirmation to make tests pass.

For an isolated local OTP smoke test, add an `[auth.sms.test_otp]` map to your local working config using a dedicated test phone and six-digit code, then restart the local stack. Never deploy a fixed OTP map or commit it; inspect the config diff before sharing changes. No test phone, OTP, provider identity or credentials have been invented here. Actual phone delivery needs an operations-selected provider. Production email Auth needs configured SMTP. Production must also configure CAPTCHA, provider limits, permitted origins, HTTPS and admin MFA before admitting real users; the local rate limits are not a production abuse-control certification.

OTP should remain in-tab. The return-path helper permits only explicitly allowlisted destinations. Future cookie-based mutation handlers must call the same-origin guard with a trusted deployment origin, not a request-supplied Host value. Database commands independently validate a live Auth session, lock/check the active profile and check beta admission for carrier mutations. Token signature validation alone is not sufficient for sensitive writes.

## Migrations and validation from zero

```sh
npm run db:reset
npm run db:test
npm run db:lint
npm run db:types
npm run db:types:check
npm run test:foundation
npm test
npm run lint
npx tsc --noEmit
npm run build
git diff --check
git status --short
```

The pgTAP test transaction creates synthetic Auth users/sessions and carrier records, exercises actual `authenticated` and `anon` PostgreSQL roles, and rolls everything back. It tests provisioning, trusted contact changes, private reads, cross-user denial, public-safe projections, direct-write denial, confirmation uniqueness, beta gates, suspension, revoked sessions, no staff and no missing/duplicate owner. This is database authorization validation, not proof of SMS delivery, browser cookie round-trips or concurrent production traffic.

The three migrations install eight `app` tables: `profiles`, `platform_roles`, `audit_log`, `carriers`, `carrier_memberships`, `carrier_private_details`, `carrier_verifications`, `public_locations`. Audit was brought forward because membership creation and verification decisions already need an audit trail; it has no dependency on later marketplace tables. All tables have RLS in the same migration that creates them. UUIDs reference `auth.users.id` through profiles; no alternate users table exists.

Only invoker views and allowlisted commands live in `api`. Clients have no direct INSERT/UPDATE/DELETE grants. Carrier verification grants exclude reviewer/reason/coverage columns; the owner-safe view contains category, status, expiry and submitted evidence metadata only. Public views contain no legal identity, private contact, reviewer note or evidence key. The public carrier projection deliberately does not invent reputation or an aggregate verified claim: required verification-category policy and publication commands are not implemented in this foundation.

`create_carrier` creates the carrier, owner, legal details and audit atomically. `update_my_carrier` permits only descriptive fields and business declarations. It cannot change visibility, suspension, verification or owner. `update_my_profile` permits name/contact email/locale and clears proof on email replacement. Legal identity changes, ownership transfer, evidence upload and administrative approval endpoints are not exposed in this phase.

An immediate partial unique index permits at most one active owner; a deferred constraint trigger requires exactly one when committing. Membership mutation locks its carrier. Trusted ownership transfers must deactivate the previous owner and activate the replacement in one transaction under the documented profile → carrier lock order. Staff/operator roles are rejected even for trusted SQL.

Initial beta admission/admin bootstrap is an out-of-band, controlled SQL operation, never Auth user metadata. A documented initial admin grant may use a null `granted_by`; subsequent role grants require the future audited MFA admin workflow. Record beta/bootstrap actions in `app.audit_log` in the same transaction. Do not use a service key in the browser or introduce a generic admin update endpoint. No bootstrap identity or beta-admitted user is seeded.

## Database types

SQL migrations remain authoritative; database names stay snake_case and future screen adapters use camelCase. The locked architecture specifies that boundary but does not prescribe a generated-file path or CLI command. `npm run db:types` concretizes the strategy: generate `Database` and helpers from the **local migrated** `app,api` schemas into `src/lib/supabase/database.types.ts`. It writes atomically only after success. `db:types:check` regenerates and compares byte-for-byte for drift; it never rewrites the checked file.

Generation and `db:types:check` both passed against the local migrated database. `src/lib/supabase/database.types.ts` contains generated output. Current Auth helpers use SDK Auth types and select the `api` schema; future persisted screen adapters should use the generated database types.

## Current workstation validation — 2026-09-24

**Phase 1 is LOCKED.** Docker and local Supabase work on Linux; the earlier Docker-permission blocker is resolved and replaced by successful validation:

- Clean local Supabase reset and all three migrations from zero: PASS.
- Real PostgreSQL pgTAP: **148/148 assertions PASS**.
- RLS, cross-user isolation and anonymous access rules: PASS.
- Exactly one active Carrier owner, last-owner protection and rejection of staff/operator roles: PASS.
- Auth/profile synchronization, live-session authorization, carrier verification protection and audit immutability: PASS.
- Generated database types, DB type drift check and database lint: PASS.
- Foundation tests, full unit tests, ESLint, TypeScript and Next.js production build: PASS.
- `git diff --check`: PASS.
- No remote Supabase project was linked, queried or modified. Locked UI and backend architecture remain unchanged.

This lock records successful local database/foundation validation. It does not claim real SMS delivery or browser Auth cookie integration. The earlier browser-script run remains historical: 9 of 13 passed; four failed on expired route fixture expectations or a P06 summary-string expectation. Those locked code/test files were not changed by the database fixes.

Next phase: **PHASE 2 — CUSTOMER REQUEST REAL PERSISTENCE**. Customer completes P05 locally → Phone OTP verification → authenticated customer → publish Request → persist Request + vehicles + public/private locations in Postgres → published success reads the real persisted Request. This is recorded only; Phase 2 has not started.

The installed Next.js 15.5.25 package contains no `node_modules/next/dist/docs/` directory. Implementation checked its installed cookie API types and the official [Next.js 15 middleware](https://nextjs.org/docs/15/app/api-reference/file-conventions/middleware), [cookies](https://nextjs.org/docs/15/app/api-reference/functions/cookies), and [Supabase SSR](https://supabase.com/docs/guides/auth/server-side/creating-a-client) guidance. Next.js 15 requires `middleware.ts`; `proxy.ts` is a later-version convention.
