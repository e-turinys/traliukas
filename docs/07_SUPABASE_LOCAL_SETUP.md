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

P05 now binds the existing phone OTP helpers at Publish, including attaching/changing a phone within an existing authenticated account. Verification continues the in-tab pending publication; the database independently checks all publication gates. The original four-step layout remains. No password-first UI, anonymous Auth account or magic-link callback is introduced.

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

Generation and `db:types:check` pass against the local migrated database. `src/lib/supabase/database.types.ts` contains generated output. Browser/server clients use the generated Database generic with the `api` schema; the publication RPC and real P06 adapter use these types.

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

Next phase: **PHASE 2 — CUSTOMER REQUEST REAL PERSISTENCE**. Customer completes P05 locally → Phone OTP verification → authenticated customer → publish Request → persist Request + vehicles + public/private locations in Postgres → published success reads the real persisted Request. Phase 2 is now IN REVIEW as described below.

The installed Next.js 15.5.25 package contains no `node_modules/next/dist/docs/` directory. Implementation checked its installed cookie API types and the official [Next.js 15 middleware](https://nextjs.org/docs/15/app/api-reference/file-conventions/middleware), [cookies](https://nextjs.org/docs/15/app/api-reference/functions/cookies), and [Supabase SSR](https://supabase.com/docs/guides/auth/server-side/creating-a-client) guidance. Next.js 15 requires `middleware.ts`; `proxy.ts` is a later-version convention.

## Phase 2 publication and local phone test — IN REVIEW

The forward migration `20260924000100_customer_requests.sql` adds the four Request tables and `api.publish_request(jsonb,uuid)`. Existing Phase 1 migrations remain unchanged. Publication is one transaction including profile completion, all vehicles and locations, terms evidence, revision 1 and audit. The caller is derived from the validated session; client owner/status/version fields are rejected. The first committed payload wins for a per-customer retry key. The UI freezes the pending payload/key across network retries. Incomplete anonymous drafts remain in memory only.

Public locations use the eight existing picker city centroids, linked by curated slug and stored UUID. Exact address text stays in owner-only `request_vehicle_private_details.instructions`; it is not heuristically parsed or copied onto overridden vehicle routes. Request discovery requires carrier ownership; anonymous and unrelated customer discovery is denied by the locked RLS matrix. Carrier projections omit customer identity/contact/terms/publish-key/private-address data. The owner P06 server loader emits only the existing safe summary shape, never private instructions, contacts or notes. Explicit demo IDs remain; unknown or unauthorized real IDs never resolve via fixture fallback.

To test managed phone Auth without production SMS credentials:

```sh
node scripts/local-phone-auth.mjs
```

This script uses only `supabase stop` / `supabase start` for the local `traliukas` project, retaining local data. It temporarily adds a generated six-digit test code and deliberately invalid local-only Twilio-shaped placeholders to local Auth configuration (this CLI otherwise disables phone Auth even with a test map), restores the tracked file in `finally`, and writes the local phone/code to ignored `supabase/.temp/local-phone-auth.json` with mode 0600. Read that file locally for manual entry; do not share/log its contents. `PARVEZK_TEST_PHONE` may select a dedicated test number in digits with country code. Only the mapped test number is supported: managed Auth bypasses SMS delivery for that number. The placeholders are not production credentials; other numbers cannot receive SMS through them. There is no production provider and no fixed OTP in tracked files. Restarting normally removes the test map; rerun the script when needed. If the process is forcibly killed, restore `supabase/config.toml` from its reviewed local-only baseline before any commit. Check its diff: it must contain no test OTP.

Set `.env.local` from the local CLI URL and **public anon/publishable key only**, as described above. Start the app with those settings. Complete P05, continue at Publish, request the code, and enter the locally generated code. Newly created profiles are not automatically beta-admitted: a trusted local operator must set `beta_access=true` for the dedicated test profile and append the `profile.beta_access` audit in the same transaction. Never grant beta through user metadata or weaken publication checks. If publication is denied while awaiting admission, keep the page open and retry after admission; the in-tab draft remains intact.

Automated local browser validation (requires Docker, Chrome and a running application with local environment settings):

```sh
node scripts/local-phone-auth.mjs
npm run build
npm start
# In another terminal:
node tests/request-persistence.browser.mjs
```

The browser test uses the ignored local test account and performs its explicit local SQL beta admission with an audit record. It fills P05 with two vehicles and separate locations, verifies through managed Auth, publishes, checks real P06/reload, and checks anonymous/unknown-ID denial. It creates disposable local test records. It never uses a service-role browser client. Override `P05_BASE_URL` only with a loopback URL and `CHROME_PATH` if necessary.

Deferred behavior is explicit:

- Selected photos block publication with an actionable message to return and remove them if publishing without photos. Files remain in memory during OTP. No object upload, fake uploaded URL or ready metadata is persisted; Storage staging/sanitization is deferred.
- Demo carrier Routes are not persisted or interpreted as real targets. Use the existing explicit marketplace fallback before publishing. `target_route_id` stays NULL until a future supply migration installs the FK; no Carrier Route implementation is included.
- P06's existing Request Detail link is visually unchanged, but real P07/detail and Dashboard loaders are deferred; they still resolve their explicit fixtures. This phase's real flow ends at persisted P06.
- Optional EUR budget has schema/adapter support only; no new P05 field. The existing terms checkbox records technical version `2026-09-24`; production legal text/delivery approval is not supplied by this work.
- No Route/Offer/Booking/Message/Notification/Review persistence, payment, realtime, provider distribution or full translation rollout.

Validation completed on 2026-09-24 after resuming the existing working tree:

- Clean local reset applied all four migrations from zero. All **235 pgTAP assertions** passed, including immutable customer/Request ID/publication retry key and rejection of fractional-cent, zero, negative, non-finite and out-of-range budgets.
- Database lint, generated-type drift check, all 17 JavaScript test files (including foundation and Request persistence), ESLint, standalone TypeScript, production build and `git diff --check` passed.
- `tests/request-persistence.browser.mjs` passed against the production server: real managed phone OTP, two vehicles with separate routes, atomic publication, owner P06/reload, anonymous and unknown-ID 404 responses, and no runtime exceptions. Mobile (390px) and desktop (1440px) screenshots were inspected at `.next/phase2-review/real-p06-{mobile,desktop}.png`; neither viewport overflowed.
- Existing P05 regression script passed at 390, 768, 1280 and 1440px, including wizard state, validation/focus, photos, 1–10 vehicles, route overrides, verification handoff, demo P06 and explicit target fallback. On Linux run it with `CHROME_PATH=/usr/bin/google-chrome node tests/create-request.browser.mjs`.
- Local test OTP setup restored tracked `supabase/config.toml` without a diff. The browser run left its disposable local customer/Request records for review; no remote database was used. This proves local test-OTP behavior, not production SMS delivery.

Human review is required before Phase 2 can be LOCKED. No Phase 3 work, commit or push.

## Phase 3 Carrier supply — IN REVIEW (2026-09-25)

The earlier Phase 1/2 boundaries above are historical. Phase 3 adds two forward migrations: `20260925000100_carrier_routes.sql` (Routes/stops/revisions/RLS) and `20260925000200_route_commands.sql` (approved beta policy and atomic commands). No locked migration is rewritten. D-063 in the Decisions Log records the human-approved policy.

Admission uses the existing controlled SQL/bootstrap path. In one audited transaction, the operator approves the owner's `profiles.beta_access` and the Carrier's `visibility='published'` with `suspended_at IS NULL`, ensures the single active owner membership and required `carrier_private_details` legal name/business kind/registration country. Carrier name/legal constraints remain enforced by the schema. Append `profile.beta_access` and `carrier.updated` audit entries for those changes. No browser/admin key, user metadata, CMR/category approval or public Verified Carrier claim substitutes for admission. Phone OTP is the provided login UI; the database policy requires a live authenticated session, not an additional phone/document verification gate.

- `api.save_route(payload, publish, route_id?, expected_version?, create_key?, carrier_slug?)`: create draft/published supply, publish saved draft, edit existing owned supply. The payload contains only public ordered locality **slugs**, dates, total capacity, categories, non-running, flexibility and accepting-new-requests. Slugs resolve to immutable catalog UUIDs. An optional Carrier slug selects among the caller's owned admitted Carriers and grants no authority. With no selection, creation requires unambiguous ownership. Ownership cannot be reassigned and reserved capacity is never an input.
- Creation retries reuse the same create key and original payload; audit correlation identifies the original Route. Published updates require the viewed version. Immutable revisions accompany material changes. The atomic `carrierRoute.published` audit entry records the publication boundary alongside revision 1; Route distribution and the later cross-domain outbox remain deferred.
- `api.close_route(route_id, expected_version)`: idempotent cancellation, hidden from public reads. Pausing `accepting_new_requests` is separate and retains public detail. No capacity reservation/release transaction exists.
- Browser/server clients use only the ordinary public key and caller JWT. Views use invoker security and RLS; commands independently check a live Auth session and trusted eligibility. There is no new cookie-based mutation endpoint.
- Search uses real database supply whenever Supabase is configured, with no error fallback. Explicit demo Route/Carrier IDs remain for isolated visual review; unknown UUIDs return not-found. Real carriers have no fixture reputation/reviews or inferred verification. Production aggregate verification display requires a separately approved trust policy.
- The existing eight curated locations remain the Search picker catalog. No private Carrier address input is exposed. Public centroid coordinates are optional; missing coordinates stay absent.

Run the full validation commands listed above, then run the focused production browser test:

```sh
node scripts/local-phone-auth.mjs
npm run build
npm run start -- -p 3001
# In another terminal:
node tests/route-persistence.browser.mjs
```

The script allows only a loopback application URL (`PHASE3_BASE_URL`, default `http://127.0.0.1:3001`), signs in through managed test OTP, performs audited local SQL admission and creates actual supply through the UI/RPC. It checks draft/publish/reload, Search, detail, Carrier Profile, capacity/category/direction filters, edits, pause/close, unknown-ID denial and widths 390/768/1280/1440px. Artifacts and the remaining review Route ID are in ignored `.next/phase3-review/`. It uses no service-role browser client and never connects to remote Supabase.

Phase 2's targeted Request publication guard remains; public Route targeting continues to require the existing explicit marketplace fallback before Request publication. This phase proves Carrier supply persistence and discovery, not Offers, Bookings, Messages, Notifications, Reviews, production SMS delivery or a complete targeted commercial flow. No commit/push is authorized by these instructions.
