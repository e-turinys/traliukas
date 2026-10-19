# Notifications Persistence — human review

**Status: IN REVIEW**, 2026-10-19. Implementation and local validation passed; human approval is required before LOCKED. Backend Phases 1–5 remain LOCKED. This phase adds in-app Notifications at their existing event boundaries, without redesigning N01 or changing the existing commercial command implementations.

## Persisted model and security

Forward migration: `supabase/migrations/20261019000100_notifications.sql`. No earlier migration was edited.

`app.notifications` stores UUID identity, `source_event_id`, recipient/actor, allowlisted event type, bounded title/body, canonical stored href, rendered locale, entity type/ID, exactly one Offer/Conversation/Booking FK, creation time and nullable `read_at`. Unique `(source_event_id,recipient_id)` is the in-app idempotency key; existing `domain_events.dedupe_key` provides source-event identity. Recipient/time and unread partial indexes support the list; FK indexes cover entity/actor lookups. Content/context is immutable; read time is monotonic. No delivery queue or generic event framework.

A private AFTER INSERT event trigger runs inside the same successful Offer/Message/Booking transaction. Its dedicated `parvezk_notifications` owner is non-login, non-superuser and non-BYPASSRLS, with only context reads and notification insertion. Clients cannot assume it or call the trigger. Repeated projection uses ON CONFLICT DO NOTHING; command retries reuse their existing event/receipt semantics. A notification failure aborts the parent transaction. No historical backfill or fixture reputation import.

`api.notifications` is an invoker view. SELECT requires the recipient's live session and active account; unrelated users see no rows, anonymous access is denied. No browser INSERT/UPDATE/DELETE or mutable recipient/content/destination fields. `api.mark_notifications_read(uuid)` marks one owned row; NULL/omitted ID marks all own unread rows. The command derives the caller and timestamp, serializes on the caller profile, returns the server timestamp and preserves an existing read timestamp on retry. Unknown/foreign IDs have the same unavailable error. No browser service-role key.

Stored href is constructed from authoritative IDs (`/offers/[id]`, `/messages/[id]`, `/bookings/[id]`) and enforced by constraints. Destination pages still authorize access independently: receiving a Notification never grants access after ownership changes. Bodies do not copy Chat text, exact addresses/contacts or cancellation reasons. Saved `lt` preference produces Lithuanian copy; other preferences currently use the English fallback. This is bounded notification copy, not a full i18n rollout.

## Final recipient policy

All recipients are resolved first, then the actor is removed.

| Event | Eligible recipients before suppression | Actual ordinary flow |
|---|---|---|
| offer.created / offer.updated | Request Customer | Carrier action → Customer |
| message.created | Customer + current Carrier owner | Other participant only; system messages create no message notification |
| offer.accepted | None | Internal only, never a Notification |
| booking.created | Customer + selected Carrier owner | Customer acceptance → Carrier only |
| booking.pickupScheduled / booking.collected / booking.inTransit / booking.delivered | Customer | Carrier progression → Customer |
| booking.completed | Customer + Carrier owner | Customer confirmation → Carrier only |
| booking.cancelled | Customer + Carrier owner | Cancelling participant → other participant only |

The user instruction extends the earlier event allowlist with **booking.cancelled, in-app only**. No cancellation email/SMS policy is invented. For actor-free trusted events, the existing two-recipient policy can reach both participants. Normal Customer acceptance/completion does not create a self-notification: the Customer sees transactional success and Booking history instead. “Both sides according to policy” does not override actor suppression.

Existing future email/SMS intent remains unchanged for other event types; no providers, external deliveries, push or preference infrastructure were implemented.

## Screen integration

The locked `/notifications` list, cards, unread indicator, **Visi / Neperskaityti** filters, mark-all control, stored-link navigation and empty states remain visually unchanged. “Neperskaityti” is the existing approved unread-filter label. With Supabase configured, all query variants load only real caller-scoped data; `view=empty`/`view=demo` cannot inject fixtures. Anonymous users are redirected to login with a safe return destination. Database errors show a retry state, never fixtures. Existing standalone fixtures remain only when Supabase is not configured.

Normal link activation saves read state before navigating to the stored href; modified-click navigation retains normal browser behavior without claiming a read write. Mark-all and mark-one update displayed read state only after RPC success, then refresh server data. Failed writes show an error and retain unread state for retry. No bell/dropdown, realtime subscription or header redesign was added. Review uses the direct `/notifications` URL.

## Local validation completed

- `npm run db:reset`: all **12** migrations applied from zero, local Supabase only.
- `npm run db:test`: **714/714 pgTAP assertions across 9 files**; includes **56 Notifications assertions** plus extended function-owner/EXECUTE security checks. Existing lifecycle/transaction suites passed.
- `npm run db:lint`: no schema warnings/errors. `db:types` and `db:types:check`: passed.
- `npm run test:foundation`: **6/6**. `npm test`: **145/145**.
- `tests/notifications-concurrency.mjs`: **1/1** mark-one/all/retry race passed, preserving the first read timestamp.
- Existing Phase 5 concurrency: **4/4**; Phase 4 transaction concurrency: **3/3**.
- Production `npm run build`: passed, including lint and TypeScript checks. The installed Next.js 15.5.25 has no `node_modules/next/dist/docs/` guide directory; integration follows existing project patterns.
- `tests/notifications-persistence.browser.mjs`: real Customer/Carrier feeds, filters, mark-one/all, denied-network write/retry, persisted reload, later incoming message, stored Offer/Conversation/Booking navigation, empty account and anonymous redirect passed. Layouts checked at **390/768/1280/1440**, without horizontal overflow or runtime exceptions. Mobile Customer and desktop Carrier screenshots inspected under ignored `supabase/.temp/notifications-screens/`.
- `git diff --check`: passed. No commit or push.

The first validation pass exposed an Auth-schema lookup in the new notification reader; it now uses the existing restricted identity adapter. Test-only replay permissions, fixture Conversation lookup and React state synchronization were also corrected. No locked command, authorization gate, capacity invariant or test assertion was weakened.

## Human-review entry and fixtures

Local production app: **http://127.0.0.1:3002**. Direct list: **http://127.0.0.1:3002/notifications**. Use separate browser profiles for Customer and Carrier. The app is served with `npm run start -- --hostname 127.0.0.1 --port 3002`.

| Role | Local test phone |
|---|---|
| Customer | `+37060000601` |
| Carrier | `+37060000602` |

Configure one local test number at a time with the existing helper; it restarts local Auth and restores tracked configuration without resetting database data. Keep the first browser signed in while switching the test number. No production SMS is involved.

```bash
PARVEZK_TEST_PHONE=37060000601 node scripts/local-phone-auth.mjs
cat supabase/.temp/local-phone-auth.json
# Use the printed local OTP at the login URL below in the Customer profile.
# Then configure the Carrier and use a separate browser profile:
PARVEZK_TEST_PHONE=37060000602 node scripts/local-phone-auth.mjs
cat supabase/.temp/local-phone-auth.json
```

Login: http://127.0.0.1:3002/login?returnTo=%2Fnotifications

The human fixtures are separate from automation accounts (`+37060000611` / `+37060000612`); browser read-state tests did not consume human unread notifications. Three real command-driven scenarios exist: pending Offer with revision and messages in both directions; completed transport; Carrier-cancelled transport. They are deterministic scenario fixtures, not duplicate production transactions. New fixture UUIDs after reset are recorded in ignored `supabase/.temp/notifications-review.json`; no credentials are stored there.

| Scenario | Review URL |
|---|---|
| Pending Request | http://127.0.0.1:3002/requests/74137475-8046-49ad-ace6-ac3345aec1ae |
| Pending Offer (version 2) | http://127.0.0.1:3002/offers/972a1136-ca2a-4dfb-931f-0e63b8b564a7 |
| Active Chat | http://127.0.0.1:3002/messages/d19367e8-63e6-4997-91aa-69d199233df3 |
| Completed Booking | http://127.0.0.1:3002/bookings/09a09279-4b0a-4f9a-8c1f-5af5ca1cc580 |
| Cancelled Booking | http://127.0.0.1:3002/bookings/135c0289-bd4c-4945-a530-2100d4dae127 |

1. Customer list: verify **Naujas pasiūlymas**, **Pasiūlymas atnaujintas**, **Nauja žinutė**, four Carrier lifecycle updates and the Carrier cancellation. Carrier list: Customer reply notifications, canonical **Pasiūlymas priimtas** and **Pervežimas užbaigtas**. No actor's own message, acceptance/completion self-notification or offer.accepted duplicate.
2. Open notification cards and confirm their real Offer, Chat and Booking destinations. Return/reload: that card is read. Filter unread, mark all read, reload; read state persists. The other account's state is unchanged.
3. Send a new message from either profile in the active Chat. Reload the other participant's list: one new **Nauja žinutė**. Sender receives none. Manual refresh is expected.
4. Carrier may revise the pending Offer via `/carrier/requests/74137475-8046-49ad-ace6-ac3345aec1ae`; Customer reload sees a new revision notification. Customer then accepts the current Offer. Carrier gets exactly one booking.created notification, Customer gets no duplicate. Use the returned real Booking link.
5. Carrier schedules both vehicle pickups and progresses in order through Delivered; Customer receives each stage notification. Customer confirms receipt: Carrier receives Completed, Customer sees completed Booking and no self-notification. Previously generated Notifications retain their stored destinations/read state.
6. Use the pre-cancelled scenario to inspect cancellation notification and read-only history; pgTAP covers either actor cancelling and retries without duplicate release/notification. Capacity remains reserved on Completed, and only the cancelled reservation is released.
7. Review the unchanged list at 390/768/1280/1440. Stop and report human approval or issues; do not mark LOCKED automatically.

Fixtures use normal Offer expiry (one day); review the pending path promptly. `node scripts/prepare-notifications-review.mjs` preserves an existing manifest/state, rather than duplicating progressed review records. `--automation` uses a separate manifest/account set. Do not reset human-review state merely to rerun tests. Fresh full-suite reproduction requires a disposable local reset, then DB tests before persistent fixtures. The browser test expects freshly prepared automation unread state.

## Changed file inventory and boundaries

- Migration and generated types: `supabase/migrations/20261019000100_notifications.sql`, `src/lib/supabase/database.types.ts`.
- UI/data: `src/app/(public)/notifications/page.tsx`, new `error.tsx`; `src/features/public/notifications/view.tsx`, `logic.ts`, new `adapter.ts`/`client.ts`; `src/lib/types/notification.ts`.
- Tests/tooling: `supabase/tests/database/notifications.test.sql`, extended `function_ownership.test.sql`, `tests/notifications.test.mjs`, new `notifications-concurrency.mjs`, `notifications-persistence.browser.mjs`, `scripts/prepare-notifications-review.mjs`.
- Documentation: this guide, CURRENT_STATUS, implementation plan, decisions log and backend architecture.

No earlier migrations or Phase 1–5 command implementations changed. No Reviews, realtime Chat, attachments, payments, Route Distribution, full i18n, production Auth/provider integration or hosted deployment. Local Supabase only; no remote login/link/push/project access, commit or push. **Notifications Persistence remains IN REVIEW.**
