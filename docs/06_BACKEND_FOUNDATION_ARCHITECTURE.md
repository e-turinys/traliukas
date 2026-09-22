# Backend Foundation Architecture — Closed Beta / V1

**Status: LOCKED architecture.** Human approval recorded 2026-09-22. Implementation remains separately scoped.

This is the approved database/Auth/security contract, not SQL, migrations, project configuration or application code. It preserves the locked product rules and High-Fidelity screens. Section 22 records the approved OD-1 through OD-5 architecture decisions and the remaining non-blocking legal/operations retention item.

## 1. Executive summary

Use one Supabase project per environment, managed Supabase Auth, Postgres as the authoritative domain store, and private Supabase Storage. Keep the existing Next.js application and screen contracts. Use normalized operational tables, immutable version records and one immutable Booking agreement snapshot. No microservices, event-sourcing framework, payment system or realtime dependency.

Propose **26 application tables**, plus Supabase-managed Auth/Storage tables. Public discovery reads only safe carrier/location/route/review projections. Customers and carriers read protected rows under RLS. All application domain writes use narrow transactional database commands; ordinary authenticated clients receive no direct table INSERT/UPDATE/DELETE grants. Critical commands validate the caller again even when implemented with elevated database privileges.

Accepting an Offer is one database transaction: validate identity and versions, lock Request and Route, reserve the complete vehicle count, persist the immutable Booking, resolve competing Offers and Conversations, create events and in-app Notifications, then commit. Unique constraints provide a second guard against duplicate winners and Bookings. No client-side multi-call acceptance sequence.

The fastest safe beta still needs real identity delivery: production email OTP needs configured Auth mail delivery, and the locked verified-phone publication gate uses phone OTP. Deferring business notification providers does not make authentication delivery optional.

## 2. Scope and inspected baseline

Closed beta must support real public discovery, local Request drafting, publish-time authentication/verification, authenticated carrier onboarding with manual approval, Route publication, Request browsing, complete Offers, text Chat, atomic acceptance, aggregate transport progression, customer completion, eligible reviews and persisted in-app Notifications.

Source documents inspected: README, Product Blueprint, Screen Map, Technical Architecture, Implementation Plan, Decisions Log and Current Status. Product decisions D-040–D-050 and D-060–D-062 remain the governing boundaries. This locked architecture does not override those decisions.

Code inspection anchors and production mapping:

| Existing source | Finding / proposed persistence boundary |
|---|---|
| `src/features/public/create-request/model.ts` and `logic.ts` | Local contact data, shared date window, 1–10 stable vehicle IDs, per-vehicle public locations, optional Request-level private text; 5 photos per vehicle, 10 MiB each. No actual account, upload or budget persistence. |
| `src/lib/types/location.ts`, `mock/locations.ts` | Structured city/country and coordinates; seed a curated public locality catalog. Coordinates must represent a locality centroid, not an exact address. |
| `src/lib/types/carrier-route.ts`, `carrier-profile.ts`, `mock/carrier-*.ts` | Route capacity/categories and public carrier reputation are fixture fields. No actual roles/memberships, granular verification or `routeFlexible` field yet. Persist flexibility and trust foundations without fabricating fixture values. |
| `src/features/public/request-detail/model.ts`, `logic.ts`, `mock/request-details.ts` | Request and Offer versions/statuses; private contacts intentionally absent from public Request projection. Existing edits identify material invalidation. |
| `src/features/public/request-matching.ts`, `search-matching.ts`, `src/lib/route-capacity.ts` | Ordered-stop, date, category/non-running and complete-set capacity matching; one vehicle = one slot. Local reserve/release helpers are not concurrency controls. |
| `src/features/public/offer-detail/logic.ts`, `mock/offer-details.ts` | Local decisions, total price and revision previews; no real atomic acceptance. Offered pickup can differ from requested pickup; do not reject an otherwise valid Offer merely for that difference. |
| `src/lib/types/conversation.ts`, `features/public/messages/logic.ts`, `mock/conversations.ts` | One Request + Carrier thread; revisions reuse it; winning thread persists; losing/completed threads are read-only. Fixture sender IDs sometimes refer to carrier IDs: production sender IDs must be actual user IDs. |
| `src/lib/types/booking.ts`, `features/public/booking-detail/logic.ts`, `mock/bookings.ts` | Snapshot and six aggregate states; local Delivered completion. Fixture links are not reliable referential data for production import. |
| `src/lib/mock/carrier-reviews.ts` | Fictional completed-transport review previews, not proof of eligible real reviews. Never migrate fixture reputation to real carriers. |
| `src/lib/types/notification.ts`, `features/public/notifications/logic.ts`, `mock/notifications.ts` | Stored href, actor suppression, channel policy and idempotency helpers already exist; read state is local. `offer.accepted` generates no user Notification. |

Canonical database naming is snake_case with camelCase adapters. Use `published` for a public Route (legacy fixture `active` maps to it), and `collected` for Booking (older blueprint `vehicle_collected` is an alias, not a seventh normal stage). Preserve the six customer-facing labels and aggregate behavior unchanged.

Non-goals: redesigning UI, full i18n rollout, paid transactions/escrow, social distribution, notification delivery providers, automated KYC, attachments, GPS/maps/geocoding, segment capacity, arbitrary messaging, public customer reputation or production import of demo data.

## 3. Supabase Auth strategy

### 3.1 Identity and publication gate

- Do not create anonymous Auth users just to browse or draft. Keep pre-auth Request data locally; avoid long-lived browser storage of private addresses/contact details. Preserve interrupted drafts through an in-tab OTP flow. File selections stay local until authenticated upload staging.
- Gate only Publish Request with “Patvirtinkite kontaktus ir paskelbkite užklausą.” Automatically create/reuse the account through managed passwordless Auth; provision a minimal profile idempotently. Never let profile-provisioning retries create another account.
- Locked sign-in capabilities: phone OTP is the Request-publication verification gate; optional email OTP may establish a session, after which the user must still verify ownership of the attached phone before publishing. A phone-authenticated user may provide an unverified contact email and publish once the other gates pass. Magic links remain a later alternate.
- The publication command requires an active, beta-admitted user, nonblank name, valid contact email, **verified current E.164 phone**, accepted current terms version and a complete valid draft. It does not require a Match, a carrier, an Offer, or confirmed email. Authentication is not equivalent to eligibility.
- Auth-managed verified contact changes synchronize trusted confirmation facts to the private profile. Confirmation applies to the exact contact value, never to a freely editable replacement. Unverified input can be stored as contact email but is not a login identity or verified channel.
- A verified phone may belong to only one non-deleted account. Do not merge accounts because someone typed the same email/phone. Link/change contacts only in a verified existing session with proof of the new channel. Conflicts need recovery/support; Google/Apple linking is deferred.
- Account existence may begin during a managed OTP challenge; no Request is published and no marketplace authority granted until verification succeeds. Clean up unused Auth shells with an approved retention policy.

Supabase supports passwordless email and phone flows; phone sign-in requires an SMS provider. Production Auth SMTP is a separate operational prerequisite from future business email Notifications. No provider is selected or integrated by this document. [Auth methods](https://supabase.com/docs/guides/auth), [phone sign-in](https://supabase.com/docs/guides/auth/phone-login), [custom SMTP](https://supabase.com/docs/guides/auth/auth-smtp).

### 3.2 Sessions and abuse controls

Use the supported SSR cookie session pattern. Validate tokens server-side, not by trusting a client-supplied user ID or unverified session object. Verify current account status from Postgres on every mutation. Sensitive account/admin actions additionally validate the live Auth session; a locally valid unexpired JWT alone does not establish that its session has not been revoked. [SSR](https://supabase.com/docs/guides/auth/server-side), [session validation caveat](https://supabase.com/docs/guides/auth/server-side/advanced-guide).

Use HTTPS, secure cookies and the SSR library's supported cookie handling; do not assume all session cookies can be HttpOnly if browser Auth needs access. No custom token copies in application localStorage/logs. Avoid caching personalized responses in shared CDN/Next caches. Allowlist same-origin post-auth destinations; never trust an arbitrary return URL. Protect cookie-based mutation endpoints with origin/CSRF checks. Configure OTP attempt/resend limits, per-IP/per-contact abuse limits and CAPTCHA where appropriate. Never log OTPs or signed URLs. Bootstrap admins out-of-band, require MFA for admin actions, and do not expose self-service admin creation.

For closed beta, `beta_access` is admin-controlled. It gates publication/supply mutations, not anonymous browsing. Gate carrier creation/publication/Offers through authenticated account + membership + approved verification where required. The locked post-publication Customer screens always require authentication and ownership checks.

## 4. Identity and role model

One Auth user can be a customer and a carrier member. There is no exclusive `customer_or_carrier` role enum. Customer authority follows Request/Booking ownership. Carrier authority follows an active membership, not user-editable metadata. `platform_roles` contains admin grants only; public Auth metadata is never a permission source.

Closed beta permits exactly one active owner member per carrier and no staff/operator access. Retain the normalized membership table so a later approved migration can add staff roles without changing carrier ownership identity. One carrier can own many Routes and participate in many Requests. Prevent self-dealing: a customer who owns a carrier cannot submit or accept that carrier's Offer on their own Request.

Carrier legal/business data and verification evidence are private. Public trust attributes expose only safe claims/derived verification. `verified_carrier` is computed from current approved required checks, expiry and suspension; it is not a carrier-editable checkbox. `cmr_insurance_available` and `cmr_insurance_verified` are separate. Invoice/live-tracking availability are declarations, never invented endorsements. Carrier reputation is derived from completed real Bookings and visible eligible reviews, not writable counters imported from fixtures.

## 5. Entity relationship overview

Text ER overview (cardinality, not executable schema):

```text
auth.users 1—1 profiles 1—many transport_requests 1—many request_vehicles
profiles many—many carriers (carrier_memberships)
carriers 1—1 carrier_private_details; 1—many carrier_verifications
carriers 1—many carrier_routes 1—many route_stops —1 public_locations
carrier_routes 1—many route_revisions
transport_requests 1—many request_revisions
request_vehicles 1—many request_vehicle_private_details (pickup/delivery)
request_vehicles 1—many vehicle_photos
transport_requests 1—many offers —1 carriers; offers —1 carrier_routes
offers 1—many offer_revisions
(transport_request, carrier) 1—1 conversations 1—many messages
conversations 1—many conversation_reads —1 profiles
transport_requests 1—0..1 bookings —1 accepted offer_revision
bookings 1—1 winning conversation; 1—many booking_vehicle_operations
bookings 1—0..2 reviews (one per eligible direction)
domain_events 1—many notifications —1 recipient profile
audit_log records privileged/domain changes; platform_roles grants admin access
```

## 6. Detailed table definitions

### 6.1 Universal schema contract

All column lists below are exhaustive for the initial locked architecture except the expressly stated common columns. `?` means nullable; every unmarked column is NOT NULL. `PK` and `FK` mean primary and foreign key. IDs are `uuid`, database-generated random UUIDs unless specified as shared/composite keys. UUID possession never grants access. User-controlled text is trimmed/length-validated and rendered as plain text.

Every table has `created_at timestamptz`, database-assigned transaction time. Mutable tables also have `updated_at timestamptz`, set only by a database update hook; marked **append-only** tables do not have `updated_at`. Every FK defaults to RESTRICT on deletion. No cascade may remove commercial history. Storage object references are bucket/key references governed through the Storage API, not FKs into managed `storage.objects`. Reference only `auth.users.id` in the managed Auth schema. [Auth user data guidance](https://supabase.com/docs/guides/auth/managing-user-data).

Use `text` plus named CHECK constraints for small state vocabularies, rather than PostgreSQL enums, to keep future vocabulary migrations straightforward. Section 7 defines those checks. Money uses `numeric(12,2)` in major currency units, never float. Dates use `date`; instants use `timestamptz`. UUIDs/versions are immutable once a published relationship exists. No table has an unconstrained generic `metadata` column.

### 6.2 Identity and carrier tables (1–5)

| # / table | Columns in addition to common timestamps | Keys / integrity |
|---|---|---|
| 1 `profiles` | `id uuid PK FK auth.users.id`; `display_name text`; `contact_email text?`; `phone_e164 text?`; `email_verified_at timestamptz?`; `phone_verified_at timestamptz?`; `preferred_locale text` default `en`; `account_status text` default `active`; `beta_access boolean` default false; `deleted_at timestamptz?` | Private. Empty name allowed only during Auth provisioning; business commands require completed identity. Confirmation flags are trusted sync fields. Unique confirmed phone among non-deleted accounts, including suspended ones. Deleted identity removal must not permit unsafe account recovery. |
| 2 `platform_roles` | `user_id uuid FK profiles`; `role text` (`admin`); `granted_by uuid? FK profiles`; `revoked_at timestamptz?` | PK `(user_id,role)`; no self-grant. Null grantor only for documented initial bootstrap. |
| 3 `carriers` | `id uuid PK`; `slug text`; `display_name text`; `description text` default empty; `registration_country char(2)?`; `service_countries text[]` default empty; `visibility text` default `draft`; `suspended_at timestamptz?`; `cmr_insurance_available boolean` default false; `invoice_available boolean` default false; `live_tracking_available boolean` default false | Unique slug. No contact fields or private notes. `verified_carrier`, `cmr_insurance_verified`, rating/review count/completed count are safe derived read-projection fields, not writable columns. |
| 4 `carrier_memberships` | `carrier_id uuid FK carriers`; `user_id uuid FK profiles`; `role text`; `active boolean` default true | PK `(carrier_id,user_id)`; exactly one active owner per carrier. Commands ensure one owner and atomically transfer ownership; no orphan carrier. Closed beta accepts only `owner`; staff/operator roles require a later approved migration. |
| 5 `carrier_private_details` | `carrier_id uuid PK FK carriers`; `legal_name text`; `business_kind text`; `registration_number text?`; `vat_number text?`; `registration_country char(2)`; `street text?`; `postcode text?`; `city text?`; `contact_email text?`; `contact_phone text?` | Private owner/admin access. Business kind `individual` or `company`; required identity fields are enforced by the current server-side carrier verification policy. No public join to this row. |

### 6.3 Verification and supply (6–10)

| # / table | Columns | Keys / integrity |
|---|---|---|
| 6 `carrier_verifications` | `id uuid PK`; `carrier_id uuid FK carriers`; `category text`; `status text`; `evidence_bucket text?`; `evidence_key text?`; `reviewed_by uuid? FK profiles`; `reviewed_at timestamptz?`; `expires_at timestamptz?`; `coverage_amount numeric(12,2)?`; `coverage_currency char(3)?`; `decision_reason text?` | Unique `(carrier_id,category)` for current check; audit retains decision changes. Pair evidence bucket/key and amount/currency; amount positive. Evidence bucket fixed to private verification bucket. Approval requires reviewer/time; expiry is checked at read/command time, not only by a scheduler. Required categories are evaluated from the current server-side platform verification policy. |
| 7 `public_locations` | `id uuid PK`; `slug text`; `city text`; `region text?`; `country_name text`; `country_code char(2)`; `latitude numeric(9,6)?`; `longitude numeric(9,6)?`; `provider_place_id text?`; `time_zone text` | Unique slug. Optional coordinate pair, latitude -90..90/longitude -180..180. IANA timezone required from curated catalog; no precise private coordinates. Referenced localities are immutable; correction creates a new locality. |
| 8 `carrier_routes` | `id uuid PK`; `carrier_id uuid FK carriers`; `status text` default `draft`; `moderation_status text` default `normal`; `date_from date`; `date_to date`; `capacity_total integer`; `capacity_reserved integer` default 0; `accepting_new_requests boolean` default true; `supported_categories text[]`; `supports_non_running boolean` default false; `route_flexible boolean` default false; `route_version integer` default 1; `published_at timestamptz?` | Total > 0; reserved between 0 and total; dates ordered; categories nonempty/unique/allowed. No stored available count. Parent lock required for stops/edits/reservations. |
| 9 `route_stops` | `id uuid PK`; `route_id uuid FK carrier_routes`; `position smallint`; `location_id uuid FK public_locations` | Unique `(route_id,position)`; positions start 0. First/last are origin/destination; remaining stops are waypoints, not duplicated endpoint columns. Publication requires >=2 contiguous stops and distinct endpoints. |
| 10 `route_revisions` **append-only** | `route_id uuid FK carrier_routes`; `version integer`; `changed_by uuid FK profiles`; `snapshot_schema_version smallint` default 1; `public_terms_snapshot jsonb` | PK `(route_id,version)`. Bounded validated object with ordered public stops, dates, supported categories, flexibility, non-running capability and total capacity. No private data; no capacity-reserved snapshot used for live decisions. Create revision 1 on publication and every material version change. |

### 6.4 Demand and photos (11–15)

| # / table | Columns | Keys / integrity |
|---|---|---|
| 11 `transport_requests` | `id uuid PK`; `customer_id uuid FK profiles`; `status text` default `draft`; `moderation_status text` default `normal`; `visibility text`; `target_carrier_id uuid? FK carriers`; `target_route_id uuid? FK carrier_routes`; `default_pickup_location_id uuid FK public_locations`; `default_delivery_location_id uuid FK public_locations`; `pickup_kind text`; `pickup_from date?`; `pickup_to date?`; `pickup_flexible_option text?`; `pickup_anchor_date date?`; `notes text` default empty; `budget_amount numeric(12,2)?`; `budget_currency char(3)?`; `request_version integer` default 1; `terms_version text?`; `terms_accepted_at timestamptz?`; `published_at timestamptz?`; `closed_at timestamptz?`; `client_publish_key uuid` | Unique `(customer_id,client_publish_key)` for publish retries. Budget pair both absent or amount > 0 + EUR. Complete draft may be staged after Auth; anonymous incomplete form is not a DB row. Publication validates contact/terms and count. Target route must belong to target carrier. |
| 12 `request_vehicles` | `id uuid PK`; `request_id uuid FK transport_requests`; `position smallint`; `category text`; `make text`; `model text`; `year smallint?`; `condition text`; `rolling_ability text?`; `pickup_location_id uuid FK public_locations`; `delivery_location_id uuid FK public_locations`; `uses_default_route boolean` default true; `removed_at timestamptz?` | Unique active `(request_id,position)`; position 1..10, nonblank make/model. Active vehicles 1..10 on published Request, checked under parent lock. Resolved locations always stored even when inherited. Soft-remove vehicles before Booking; never replace their identity. |
| 13 `request_vehicle_private_details` | `vehicle_id uuid FK request_vehicles`; `side text`; `street text?`; `postcode text?`; `city text?`; `country_code char(2)?`; `instructions text?`; `contact_name text?`; `contact_phone text?`; `contact_email text?` | PK `(vehicle_id,side)`; side pickup/delivery. Optional row, optional partial fields while drafting. Exact data never in Request projection. Existing unstructured private text maps to `instructions` without guessing parsed street/contact values. |
| 14 `request_revisions` **append-only** | `request_id uuid FK transport_requests`; `version integer`; `changed_by uuid FK profiles`; `snapshot_schema_version smallint` default 1; `public_terms_snapshot jsonb` | PK `(request_id,version)`. Shared date semantics + ordered complete public vehicle/location set + visibility/target and optional budget; no exact address/contact or arbitrary private notes. Immutable revision for each material version, starting at publication. |
| 15 `vehicle_photos` | `id uuid PK`; `vehicle_id uuid FK request_vehicles`; `uploaded_by uuid FK profiles`; `bucket_id text`; `object_key text`; `position smallint`; `mime_type text`; `byte_size bigint`; `state text` default `pending`; `removed_at timestamptz?` | Unique `(bucket_id,object_key)` and active `(vehicle_id,position)`; 1..5 positions, 1..10,485,760 bytes. Allowed input image formats match P05; only validated sanitized `ready` objects served. Metadata is never a permanent public URL. |

### 6.5 Offers and Chat (16–20)

| # / table | Columns | Keys / integrity |
|---|---|---|
| 16 `offers` | `id uuid PK`; `request_id uuid FK transport_requests`; `carrier_id uuid FK carriers`; `route_id uuid FK carrier_routes`; `status text` default `pending`; `current_version integer` default 1; `created_by uuid FK profiles` | Unique pending `(request_id,carrier_id)`; unique accepted `request_id`. Route belongs to carrier. Current `(id,current_version)` references an existing revision through a deferred FK. Versions are not supplied as trusted counters by clients. |
| 17 `offer_revisions` **append-only** | `offer_id uuid FK offers`; `version integer`; `request_id uuid`; `request_version integer`; `route_id uuid`; `route_version integer`; `total_price numeric(12,2)`; `currency char(3)` default EUR; `planned_pickup_date date`; `pickup_time_from time?`; `pickup_time_to time?`; `pickup_time_zone text`; `planned_delivery_date date`; `payment_terms text`; `carrier_comment text?`; `expires_at timestamptz`; `revised_by uuid FK profiles` | PK `(offer_id,version)`; composite FKs to Request/Route revision keys. IDs must equal parent Offer IDs via deferred constraint trigger. Price > 0, EUR, delivery >= pickup, nonblank payment terms. Time pair absent or ordered same-day interval; IANA timezone. Expiry future at write and before earliest agreed pickup instant (section 7). |
| 18 `conversations` | `id uuid PK`; `request_id uuid FK transport_requests`; `carrier_id uuid FK carriers`; `current_offer_id uuid FK offers`; `status text` default `active`; `last_message_at timestamptz` | Unique `(request_id,carrier_id)`. Required current Offer belongs to same pair; no pre-Offer row. Booking link is reverse lookup from unique `bookings.conversation_id`, avoiding a circular duplicated Booking pointer. |
| 19 `messages` **append-only** | `id uuid PK`; `conversation_id uuid FK conversations`; `sequence bigint`; `kind text`; `sender_user_id uuid? FK profiles`; `sender_side text`; `body text`; `event_id uuid? FK domain_events`; `client_message_key uuid?` | Unique `(conversation_id,sequence)`, `(conversation_id,event_id)` where event present, `(sender_user_id,client_message_key)` where key present. User messages require real sender/key and no event; system messages require event and no sender/key. Text trimmed 1..2000 chars. No edits/deletes/attachments. Sequence assigned under Conversation lock. |
| 20 `conversation_reads` | `conversation_id uuid FK conversations`; `user_id uuid FK profiles`; `last_read_sequence bigint` default 0 | PK `(conversation_id,user_id)`. Nonnegative, monotonic and <= last actual sequence; server validates participant and supplied highest visible message. No arbitrary client readAt for other participants. |

### 6.6 Transport, reputation and system records (21–26)

| # / table | Columns | Keys / integrity |
|---|---|---|
| 21 `bookings` | `id uuid PK`; `request_id uuid FK transport_requests`; `accepted_offer_id uuid`; `accepted_offer_version integer`; `customer_id uuid FK profiles`; `carrier_id uuid FK carriers`; `route_id uuid FK carrier_routes`; `conversation_id uuid FK conversations`; `vehicle_count smallint`; `agreed_total_price numeric(12,2)`; `currency char(3)`; `payment_terms text`; `planned_pickup_date date`; `planned_delivery_date date`; `snapshot_schema_version smallint` default 1; `agreement_snapshot jsonb`; `status text` default `booked`; `status_version integer` default 1; `status_changed_at timestamptz`; `completed_at timestamptz?`; `cancelled_at timestamptz?`; `capacity_released_at timestamptz?` | Unique request, accepted Offer, Conversation; composite FK to accepted Offer revision. Vehicle count 1..10. All agreement/identity fields immutable; only allowed lifecycle fields mutable. Deferred consistency check ensures request/customer/carrier/route/conversation/revision agree. Snapshot validates count, IDs, price/currency/dates against typed columns. |
| 22 `booking_vehicle_operations` | `booking_id uuid FK bookings`; `vehicle_id uuid FK request_vehicles`; `side text`; `street text?`; `postcode text?`; `city text?`; `country_code char(2)?`; `instructions text?`; `contact_name text?`; `contact_phone text?`; `contact_email text?`; `scheduled_from timestamptz?`; `scheduled_to timestamptz?`; `operational_eta timestamptz?`; `operation_version integer` default 1; `updated_by uuid FK profiles` | PK `(booking_id,vehicle_id,side)`. Vehicle must occur in Booking snapshot and original Request. Side pickup/delivery; time pairs ordered. Independent copied operational data, not a live join to Request private details. No per-vehicle lifecycle status. |
| 23 `reviews` | `id uuid PK`; `booking_id uuid FK bookings`; `author_user_id uuid FK profiles`; `direction text`; `rating smallint`; `comment text?`; `moderation_status text` default normal | Unique `(booking_id,direction)`; rating 1..5; comment <=2000 chars. Author must be the eligible customer or carrier owner for that direction at creation, and the Booking must be Completed. Target carrier/customer is derived from the Booking. Customer-to-carrier reviews are public; carrier-to-customer reviews are private. No author edit/delete initially. |
| 24 `domain_events` **append-only** | `id uuid PK`; `dedupe_key text`; `event_type text`; `actor_id uuid? FK profiles`; `request_id uuid? FK transport_requests`; `offer_id uuid? FK offers`; `conversation_id uuid? FK conversations`; `booking_id uuid? FK bookings`; `route_id uuid? FK carrier_routes`; `payload_schema_version smallint` default 1; `payload jsonb` | Unique dedupe key. At least one entity; references must share context. Bounded event-specific payload <=32 KiB, no contacts/addresses/tokens. Allowlisted event types only. This is a small transactional activity/outbox record, not event-sourced state. |
| 25 `notifications` | `id uuid PK`; `source_event_id uuid FK domain_events`; `recipient_id uuid FK profiles`; `event_type text`; `actor_id uuid? FK profiles`; `title text`; `body text`; `href text`; `locale text`; `read_at timestamptz?`; `entity_type text`; `entity_id uuid`; `offer_id uuid? FK offers`; `conversation_id uuid? FK conversations`; `booking_id uuid? FK bookings` | Unique `(source_event_id,recipient_id)`. Exactly one entity FK populated, matching entity_type/entity_id; no orphan polymorphic ID. Actor absent or different from recipient. Internal-only event types rejected. Content/context immutable; only read_at can change monotonically through own-read commands. |
| 26 `audit_log` **append-only** | `id uuid PK`; `actor_id uuid? FK profiles`; `action text`; `entity_type text`; `entity_id uuid`; `correlation_id uuid`; `reason text?`; `change_summary jsonb` | Server/admin only. Bounded allowlisted summary <=16 KiB, record changed field names and safe old/new statuses/versions; do not duplicate private addresses, document contents, passwords or JWTs. Generic entity reference is intentional for audit only; business FKs use concrete tables. |

No separate `users`, mutable `booking_vehicles`, generic role-permission framework, capacity-ledger, Match, provider-delivery or distribution-job table is needed initially. `auth.users`, `auth.identities`, `auth.sessions`, `storage.buckets` and `storage.objects` are Supabase-managed, not included in the 26.

## 7. Enum/check constraints and write-time validation

| Domain | Values / exact invariant |
|---|---|
| Account | `active`, `suspended`, `deleted`; `deleted_at` present iff deleted. Suspension blocks mutations but does not silently cancel agreements. Historical own reads remain allowed; incident-specific access restrictions require admin action. |
| Locale | `en`, `lt`, `de`, `nl`, `fr`, `pl`, `ro`, `uk`, `ru`; canonical source/fallback remains English. No full translations introduced here. |
| Carrier | visibility `draft`, `published`, `hidden`; closed-beta membership `owner` only; verification category `contact`, `identity`, `company`, `transport_documents`, `cmr_insurance`; status `not_submitted`, `pending`, `approved`, `rejected`, `expired`. Staff/operator membership requires a later approved migration. |
| Moderation | `normal`, `hidden`, `removed`, separate from business lifecycle. |
| Route | `draft`, `published`, `expired`, `cancelled`; numeric capacity bounds always enforced. Full is derived, not a status. |
| Request | `draft`, `active`, `booked`, `completed`, `closed`; visibility `targeted` or `marketplace`. Targeted requires carrier; optional route must belong to it. Marketplace target fields are null after explicit broadening. Drafts excluded from discovery/dashboard active lists. |
| Pickup window | `anytime`, `single`, `range`, `flexible`. Anytime has no dates/option; single has equal from/to; range has ordered from/to; flexible has option + anchor + resolved ordered from/to. Options match `next-week`, `next-two-weeks`, `this-month`. Resolve existing helper semantics on publication using Europe/Vilnius calendar and freeze that anchor, not a moving window. |
| Vehicles | `car`, `suv`, `van`, `motorcycle`; condition `running`, `non_running` (adapter maps UI `non-running`); rolling `yes`, `no`, `unknown` required iff non-running, null otherwise. Pickup differs from delivery. Year 1886..9999 static bound; write-time validator also caps at current year + 1. |
| Offer | `pending`, `accepted`, `declined`, `withdrawn`, `expired`, `not_selected`, `unavailable`; versions positive. Expiry must be later than server write time and earlier than start of agreed pickup, interpreted in the stored pickup timezone; when time absent use midnight of pickup date. Delivery is not before pickup. |
| Booking | Normal lifecycle: `booked`, `pickup_scheduled`, `collected`, `in_transit`, `delivered`, `completed`. `cancelled` is a terminal exception outcome available only before `collected`, not a seventh normal lifecycle step. Completed requires completed_at; cancelled requires cancelled_at and capacity_released_at; other statuses forbid those terminal timestamps. |
| Chat | Conversation `active`, `archived`, `completed`; message kind `user`, `system`; sender side `customer`, `carrier`, `system`; type/actor/event constraints described above. |
| Photos | `pending`, `ready`, `rejected`; JPEG/PNG/WebP/HEIC/HEIF input; serve sanitized supported raster output only. |
| Reviews | direction `customer_to_carrier` or `carrier_to_customer`; latter never public. |
| Notifications | Only offer.created, offer.updated, message.created, booking.created, booking.pickupScheduled, booking.collected, booking.inTransit, booking.delivered, booking.completed. Never offer.accepted. |

Application validates for useful errors; database commands and constraints independently enforce integrity. Cross-row counts, version-parent relationships, current Offer references, booking snapshot membership and lifecycle transitions require constraints/triggers or command checks under a common parent lock; a plain CHECK cannot count another table. Add deferred constraint triggers for end-of-transaction invariants (1–10 vehicles, route stops, valid current revision, accepted Offer/Booking linkage). No temporary invalid commit is allowed.

Money/date/JSON inputs have hard size limits. Proposed free text bounds: make/model 100 chars each, carrier name 200, description 4000, Request notes/instructions 4000, payment terms/comment 2000; IDs and contact fields have format/length validation. These technical limits must not silently truncate existing user content. Current form values are rejected with actionable validation if beyond bounds.

## 8. Important indexes and retention

PK/unique constraints create their own indexes. Add indexes on every referencing FK column/group used for access checks; Postgres does not automatically index all referencing foreign keys. Avoid duplicate indexes with a composite index already providing the needed leading columns.

- Membership `(user_id,carrier_id)` filtered active; verification `(carrier_id,category,status,expires_at)`.
- Public routes `(date_from,id)` filtered published/normal; `(carrier_id,status,date_from,id)`; stops `(location_id,route_id,position)`. Start with normal B-tree indexes; no PostGIS or GIN until measured needs justify them.
- Requests `(customer_id,created_at desc,id)`; active marketplace `(published_at desc,id)`; targeted `(target_carrier_id,status,published_at desc,id)`; vehicles `(request_id,position)` filtered nonremoved and indexes on location FKs.
- Offers `(request_id,status,id)`, `(carrier_id,status,created_at desc,id)`, `(route_id,status,id)`; current pending expiration lookup joins revision PK, with `(expires_at,offer_id)` on revisions if sweeper measurements need it.
- Conversations `(carrier_id,last_message_at desc,id)` and request FK; Bookings `(customer_id,status,created_at desc,id)`, `(carrier_id,status,created_at desc,id)`, `(route_id,capacity_released_at)`.
- Messages unique conversation sequence supports stable ascending history/keyset pagination; conversation_reads user index supports Inbox unread calculation.
- Notifications `(recipient_id,created_at desc,id)` and same filtered `read_at` absent; never use only offset pagination for a changing inbox.
- Reviews `(booking_id,direction)` unique plus public reputation query index on direction/moderation; events `(booking_id,created_at,id)` and `(conversation_id,created_at,id)`; audit `(entity_type,entity_id,created_at,id)`.

No user-facing hard delete of published domain rows. Close/cancel/archive/moderate rather than delete. Drafts can be abandoned; a server retention task may hard-delete never-published abandoned drafts and their unused children after an approved period. Never cascade Auth deletion through Bookings/messages/reviews. User erasure is an audited anonymization/retention workflow, not browser DELETE. Commercial agreement/history is preserved, while PII, operational data and evidence remain separately restrictable/anonymizable. Numeric retention periods require legal/operations approval before retention jobs or production cleanup are enabled, but they do not block this database architecture. Supabase backup/restore and Storage recovery must be tested separately; database backups alone are not an object-file recovery plan.

## 9. RLS permission matrix

### 9.1 Grants, schemas and meanings

Put application tables in a non-exposed `app` schema; expose a small `api` schema of safe read views and command wrappers. Revoke default PUBLIC function execution and schema/table privileges. Enable RLS on **every** application table, including currently server-only tables. Authenticated/anon underlying SELECT grants exist only where needed for invoker views; keeping a schema out of the Data API is an additional boundary, not a substitute for RLS. Public views list columns explicitly; never SELECT-all a private table. Views used for caller-scoped data use invoker semantics so they do not accidentally bypass RLS. [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security), [view security](https://supabase.com/docs/guides/database/views).

Matrix cells are **SELECT / INSERT / UPDATE / DELETE via ordinary table access**. `—` denies. Every I/U/D entry is deliberately denied to customer/carrier clients; authorized actions use the commands below. This prevents a user from changing ownership, verification flags, prices or status by bypassing UI. Server APIs use the caller's validated JWT for routine reads/commands, not a service-role client for every request.

Predicates: **own** = current user owns the record; **member** = the current active carrier owner in closed beta; **participant** = Request customer or current owner of that Conversation/Booking's carrier. **discoverable** Request = active/normal and marketplace, or targeted to the user's carrier; authenticated carrier ownership is sufficient to browse, while Offer submission requires verification. Pending carrier visibility does not include any exact address. **public** = explicitly allowed published/unhidden safe projection. Carrier owners retain their customer permissions on their own Requests; they never get all customers' data just by owning a carrier.

| Table | PUBLIC / ANON S/I/U/D | Authenticated customer S/I/U/D | Authenticated carrier S/I/U/D | Admin / service responsibilities |
|---|---|---|---|---|
| profiles | —/—/—/— | own/—/—/— | own/—/—/— | Trusted contact sync, suspend, beta admission; audited support lookup |
| platform_roles | —/—/—/— | own/—/—/— | own/—/—/— | Grant/revoke via MFA admin; bootstrap separately |
| carriers | public/—/—/— | public/—/—/— | public + member/—/—/— | Moderation/suspension, safe trust projection |
| carrier_memberships | —/—/—/— | own memberships/—/—/— | own membership; owner sees carrier roster/—/—/— | Membership administration; last-owner protection |
| carrier_private_details | —/—/—/— | —/—/—/— | carrier owner/—/—/— | Verification/restricted support |
| carrier_verifications | —/—/—/— | —/—/—/— | carrier owner/—/—/— | Review/evidence/expiry; never self-approval |
| public_locations | all/—/—/— | all/—/—/— | all/—/—/— | Curated catalog management |
| carrier_routes | public/—/—/— | public/—/—/— | public + member/—/—/— | Route moderation; commands own reservations |
| route_stops | parent public/—/—/— | parent public/—/—/— | parent visible/—/—/— | Same Route visibility; no private locations |
| route_revisions | —/—/—/— | revision referenced by own Offer/Booking/—/—/— | own carrier revisions/—/—/— | Append on version changes; never rewrite |
| transport_requests | —/—/—/— | own/—/—/— | discoverable + selected Booking Request/—/—/— | Moderation; direct anon Request reads not needed for locked flow |
| request_vehicles | —/—/—/— | own Request/—/—/— | visible Request, nonremoved vehicles/—/—/— | All private fields physically absent |
| request_vehicle_private_details | —/—/—/— | own Request/—/—/— | —/—/—/— | Selected carrier reads Booking copy, never this source table |
| request_revisions | —/—/—/— | own Request/—/—/— | revision referenced by own carrier Offer/Booking/—/—/— | Preserve historical public terms, not later private/source changes |
| vehicle_photos | —/—/—/— | own Request/—/—/— | ready/nonremoved for visible Request/—/—/— | Upload staging/sanitization/cleanup; private bucket |
| offers | —/—/—/— | own Request/—/—/— | own carrier/—/—/— | Atomic decisions/expiry; no competitor reads |
| offer_revisions | —/—/—/— | parent Offer visible/—/—/— | parent Offer visible/—/—/— | Append only; terms never overwritten |
| conversations | —/—/—/— | participant/—/—/— | participant/—/—/— | Status synchronization; retained archived access |
| messages | —/—/—/— | participant/—/—/— | participant/—/—/— | Active-only send command; immutable system messages |
| conversation_reads | —/—/—/— | own + participant/—/—/— | own + participant/—/—/— | Monotonic own-read cursor; no other-user mutation |
| bookings | —/—/—/— | own/—/—/— | selected carrier owner/—/—/— | Create only by acceptance; audited lifecycle commands |
| booking_vehicle_operations | —/—/—/— | own Booking/—/—/— | selected carrier owner, not cancelled/—/—/— | Private operations; completion retention follows the approved retention policy |
| reviews | public customer-to-carrier/—/—/— | public + own Booking/—/—/— | public + own carrier Booking/—/—/— | Eligibility and moderation; carrier-to-customer reviews are never public |
| domain_events | —/—/—/— | —/—/—/— | —/—/—/— | Transactional events/outbox; scoped Booking activity RPC only |
| notifications | —/—/—/— | recipient only/—/—/— | recipient only/—/—/— | Create from policy; no recipient or href edits |
| audit_log | —/—/—/— | —/—/—/— | —/—/—/— | Append-only trusted writers; MFA admin read |

Public carrier/route projections remain available to anyone, but hidden/draft rows do not. Public route detail may show expired/full published routes according to existing discovery/detail rules; cancelled/hidden routes have no public discovery projection. Separate query filters determine search eligibility from visibility. Public reviews expose rating, comment, carrier and an approved display-name snapshot/projection only; do not expose Booking/customer UUIDs or legal contact data in public views. Base review SELECT column grants must exclude those private columns for anon; public view is an explicit safe column projection. A participant-only review detail RPC supplies private linkage if needed.

Carrier verification rows require the same column discipline: the carrier owner may read only an owner-safe status/submission projection (for example category, status, expiry and submitted evidence metadata), while reviewer notes, internal decision context and unrestricted evidence access are admin/server-only. If the physical table cannot enforce that column boundary, expose an explicit owner-safe view/RPC and keep direct base-table SELECT revoked; RLS alone is not a column-level privacy control.

### 9.2 Authorized write commands and column boundaries

| Command family | Caller / allowed changes |
|---|---|
| Update own profile | Authenticated owner: display name, contact email, preferred locale. Verified contacts require Auth proof; no role/beta/status/verified-at writes. |
| Create carrier / edit business | Active admitted user creates carrier+owner atomically; owner edits descriptive fields/business declarations. Admin alone approves verification, public eligibility and suspension. No staff/operator command exists in V1. |
| Submit evidence | Owner stages verification object; command marks pending. Admin approval records reviewer/reason/time. Carrier cannot supply approved status/coverage verification. |
| Route create/edit/publish | Active admitted carrier owner; publication requires approved eligibility. Stops/category/dates/capacity edited under Route lock; immutable revision for material changes. Never accepts capacity_reserved from caller. |
| Request stage/publish/edit/close | Owner only; publishing gates in section 3. Draft staging can persist a complete form after Auth, but active listing begins only on publication. Material edit increments version and invalidates pending Offers/archives affected threads atomically. Notes/photo changes do not auto-invalidate. No edits after booked/completed/closed. Repeat creates new draft IDs. |
| Submit/revise/withdraw Offer | Active approved carrier owner; one concrete owned Route; complete Request; optimistic versions; inserts immutable revision and creates/reuses Conversation in same transaction. |
| Decline/accept Offer | Request owner only; decline while pending/current, accept through section 12 exclusively. |
| Send message / mark read | Authenticated participant; send checks effective active state; caller can only advance their own read cursor. Authenticated role alone is insufficient. |
| Booking lifecycle/operations | Section 14; only allowed mutable fields. No command mutates agreement snapshot. |
| Create review | Eligible Completed Booking participant only; direction fixed from caller; one review per side. |
| Mark notification read/all | Own recipient only; set server time if absent. Cannot alter content/href or set another recipient's state. |

Use dedicated non-login function-owner roles with minimum table privileges; no application function owned by a broadly privileged human login. Security-definer functions have an empty/fixed search path and fully qualified references, no caller-controlled dynamic SQL, and explicit execute grants. Derive `auth.uid()` inside commands. Private helper functions are not exposed as arbitrary data oracles; membership helpers return only caller-scoped booleans and avoid recursive RLS. Enforce authorization inside each command because definer functions can bypass the caller's normal table policies. [Function security](https://supabase.com/docs/guides/database/functions).

Admin is an application role, not permission to send a service key to the browser. MFA admins call audited, allowlisted support commands. Service-role credentials technically bypass RLS: protect them as backend secrets and restrict their uses to Auth synchronization, storage processing/cleanup, scheduled expiry and controlled support/bootstrap. Do not mistake the matrix for a restriction imposed on an exposed service key.

## 10. Public/private locations and vehicle persistence

Resolve each vehicle's default route into actual public location IDs when the Request is staged/published. `uses_default_route` records UI intent, not a dynamic pointer that can silently alter a Booking. The Request owns vehicles, photos and private detail rows; authorization always traverses this ownership, not a caller-provided customer UUID.

Before Booking, only the customer and authorized support can read exact address/contact rows. Targeting a carrier or receiving its Offer does **not** grant private-address access. At acceptance copy optional private details into Booking operations. Selected participants may then read that Booking copy; losing carriers never gain access. Later operational updates affect the Booking copy only and are audited. Historical agreement snapshot contains public city-level geography only; exact operational addresses remain separately protected.

P05 currently has Request-level free text for private pickup/delivery. Preserve it as instructions for corresponding vehicle-side rows when defaults apply; do not parse phone/email/street heuristically or assume it applies to independently overridden locations. If the available form cannot supply operationally required multi-location data, collect through an authorized operational workflow later, not in public notes; required operational fields must be satisfied before the relevant Booking transition is allowed.

Public notes, make/model text, review comments and images can contain user-entered PII. Physical column separation cannot prevent a user typing a phone number into notes. Apply input guidance, bounded text and moderation; never publish exact-address fields into these surfaces. Strip photo metadata and restrict object readership. Do not include private details in public HTML, metadata, logs, API errors, notifications or distribution snapshots.

## 11. Offer revisions and Conversation consistency

Store terms only in `offer_revisions`, not two divergent mutable copies. `offers.current_version` selects the current immutable revision. A pending revision increments the counter and points to current Request/Route revisions; previous rows remain queryable by the same commercial parties. Customer acceptance submits expected Offer, Request and Route versions from the viewed terms; it cannot choose an older revision.

A carrier can submit a new Offer after a terminal prior Offer only if the Request is still active and product rules allow a new pending Offer. Revisions are not new Offer identities. Exactly one Conversation survives for the Request/carrier pair. When a valid new pending Offer is submitted, reuse that Conversation and make it active; preserve all system history. No insertion of a Conversation before its initial Offer. The deferred current-offer FK and unique pair constrain this linkage.

Current active state must be checked against current Offer expiry/version/Request state or active winning Booking. A stale stored `active` string is not permission to send. Expiration workers archive rows for consistency, but reads/actions compute effective read-only state immediately even if workers lag. Route changes need not lock all Requests in reverse order: invalidate by version immediately, then background reconciliation updates display statuses; sending/acceptance always reject stale versions. Request edits can invalidate related Offers synchronously because they already own the Request lock.

All relevant commands serialize on the Request before modifying its Offers/Conversations. A message racing acceptance is either committed while its thread is legitimately active before acceptance, or rejected after it is archived. It cannot commit using stale permission after acceptance. A closing/expiry command follows the same lock order.

## 12. Atomic Offer acceptance / Booking creation

Locked RPC contract: `accept_offer(offer_id, expected_offer_version, expected_request_version, expected_route_version)` returns Booking ID and whether this was an idempotent replay. No price, carrier/customer identity, vehicle list, notification text or snapshot is trusted from the client. This is a prose transaction design, not executable SQL.

1. Require validated caller identity, active profile, beta admission and Request ownership. Resolve immutable Offer parent IDs without trusting supplied Request/Route IDs. Lock caller profile against simultaneous suspension.
2. Lock the Request row. Check ownership again against the locked row. If an existing Booking selected this exact Offer/version, return that same Booking without reserving/emitting again, including after completion/cancellation. If a different Offer won, return a conflict, not another Booking.
3. Require Request active/normal with 1–10 nonremoved vehicles and matching expected Request version. A Request does not need an earlier Match.
4. Lock carrier eligibility row and selected Route in that order. Recheck current membership/verification eligibility, suspension, required verification expiry, route carrier, published/normal state, accepting-new flag and not-expired dates. Do not use stale public trust cache as authority.
5. Lock Offers for the Request in stable ID order, including selected/competing pending Offers; check selected status is pending, current revision exists, matches all expected versions and references this Request/Route. Re-read server time after lock acquisition for expiry checks; a transaction start timestamp from before a long lock wait is insufficient.
6. Validate complete current vehicle set against route categories, non-running ability and ordered public stops. Preserve current date semantics: offered pickup may differ from requested window, but agreed pickup/delivery must be feasible within the chosen Route window. No unsupported detour calculation or routeFlexible bypass.
7. Check `capacity_total - capacity_reserved >= vehicle_count`, then conditionally increment reserved by that count on the locked Route. Require exactly one successful Route update; any failure aborts the transaction. Capacity reservation does not increment the material Route version.
8. Insert one Booking with typed immutable terms and schema-versioned snapshot assembled from the locked Request, selected immutable Offer revision, Route revision and carrier/customer identity needed for the agreement. Insert copied per-vehicle operational rows without placing private data in the agreement JSON.
9. Mark selected Offer accepted. Mark other still-valid pending Offers `not_selected`; already elapsed/stale pending records may be finalized `expired`/`unavailable` instead. Do not rewrite previously terminal decisions.
10. Lock the Request's Conversations in stable ID order. Keep selected thread active with its existing ID; archive all losing threads. Booking's unique Conversation FK supplies the reverse link. Set Request booked.
11. Append one internal `offer.accepted` event/system message and one `booking.created` event using deterministic dedupe keys based on Booking identity. Generate in-app Notifications only for booking.created using the locked recipient policy and actor suppression. Append an audit summary. Insert no external delivery jobs in this beta scope.
12. Commit. Only now return success and invalidate/refetch relevant protected UI data. If anything fails—including snapshot validation, event creation or FK constraints—roll back capacity, Booking and every other side effect together.

Database-level backstops: unique Booking per Request/Offer/Conversation, one accepted Offer per Request, one pending Offer per pair, composite accepted revision FK, capacity bounds, immutable snapshot guard, deferred relationship validation and event/recipient deduplication. Same-offer retries after a lost response return the existing Booking. Same Request/different Offer returns conflict. Expired or changed terms return a recoverable stale/expired error requiring a refresh, never silent acceptance of new terms.

## 13. Capacity concurrency and lock protocol

Use ordinary Postgres transactions with row locks at READ COMMITTED plus constraints; no distributed lock or separate reservation service. Rows remain locked until commit/rollback. PostgreSQL can detect deadlocks; consistent acquisition order reduces them. [Postgres explicit locking](https://www.postgresql.org/docs/current/explicit-locking.html).

Global order for multi-entity commands: acting profile → Request → carrier → Route → Offers sorted by ID → Conversations sorted by ID → Booking → children. A command skips entities it does not need; never acquire an earlier class after a later one. Carrier membership/verification mutators lock carrier before changing eligibility. Route-only edits lock carrier then Route and never reach backward into Requests in the same transaction. Booking lifecycle begins from its immutable Request ID and follows the same order. Auth contact/profile suspension changes lock profile. Admin changes to multiple profiles lock IDs in sorted order. Database helpers and workers must obey this order too.

Two different Requests competing for a Route serialize on its row: the first reserves N slots; the second evaluates the new remaining capacity and succeeds wholly or fails wholly. Same Request contenders serialize on Request before touching capacity. Capacity-total updates take the same Route lock and reject total < reserved. Reservation is derived from the actual vehicle count, never a client number.

Maintain `capacity_reserved` as a protected counter and `bookings.vehicle_count` plus `capacity_released_at` as its reconciliation source. Invariant: reserved equals sum of vehicle_count for that Route's Bookings whose capacity has not been released. A deferred Route/Booking constraint trigger verifies this at transaction end; trusted operations do not bypass it. Completion does **not** free a slot for reuse on the same Route; only eligible pre-collection cancellation releases it. Cancellation locks the same chain, checks not already released, changes Booking/Request state and decrements once. Rollback restores both. No segment capacity reuse.

Bound lock/statement timeouts. On serialization/deadlock/transient failure, retry the entire idempotent command a small bounded number of times; never replay a partial increment. Return a refreshable conflict for genuine capacity/version failures. Concurrent test cases must run separate database connections, not sequential mocks.

## 14. Booking snapshot and lifecycle authorization

### 14.1 Snapshot content and immutability

`agreement_snapshot` is a validated JSON object, schema version 1, maximum proposed size 128 KiB: acceptance time; customer ID/display name; carrier ID/display name and safe trust facts at acceptance; Request ID/version and shared requested date window including flexible anchor; Route ID/version/public ordered stops; accepted Offer ID/version/text; ordered 1–10 vehicle records with stable IDs/category/make/model/year/condition/rolling ability and public location values; total/currency/payment terms; planned dates and optional pickup time/timezone. No private contacts, addresses, document URLs, photos or mutable live-profile references are required to render B01.

Typed price/date/identity fields support constraints and indexing; a validator checks equality with JSON once at creation. An immutability trigger rejects changes to all agreement/identity fields even through ordinary administrative updates. Corrections to operational information go into the separate operations table. Future legal agreement amendments require a separately approved model, not overwriting history. Booking status remains a mutable aggregate field outside the immutable snapshot.

### 14.2 Transition matrix

| From → to | Actor | Preconditions / same-transaction effects |
|---|---|---|
| no Booking → booked | Request customer through accept_offer | Section 12; never direct insertion |
| booked → pickup_scheduled | Selected carrier owner | Expected status_version; required pickup operational details satisfied; record schedule/activity; booking.pickupScheduled |
| pickup_scheduled → collected | Selected carrier owner | Expected state/version; all vehicles collected as one aggregate assertion; booking.collected |
| collected → in_transit | Selected carrier owner | Expected state/version; booking.inTransit |
| in_transit → delivered | Selected carrier owner | Expected state/version; whole-job delivery assertion; booking.delivered |
| delivered → completed | Booking customer | Explicit receipt confirmation; completed_at; Request completed; Conversation completed/read-only; booking.completed |
| booked/pickup_scheduled → cancelled | Booking customer or selected carrier owner | Pre-`collected` only; reason and audit required; capacity release occurs atomically and exactly once; Request closes and winning Conversation archives |
| exception intervention | MFA admin/manual support only | Required after `collected`; reason/audit required; no generic status setter; never edits snapshot or automatically reopens Request |

Carrier operational progression versus customer confirmation is established in the blueprint. Closed-beta carrier actions belong to the single active owner. Customer and selected carrier owner may cancel only before `collected`; cancellation is a terminal exception outcome, not a normal lifecycle stage, and its capacity release/audit effects are one atomic command. After `collected`, exceptions require manual support through narrow audited MFA-admin commands. An expired carrier verification blocks new Offers/publications but does not automatically cancel existing Bookings; assigned participants may finish existing transports unless the account is suspended. A suspended actor requires support intervention, not unrestricted status changes.

Use command-specific expected status/version, increment `status_version`, record safe old/new state and actor. Duplicate already-applied same transition can return current success without another event; later/invalid versions return conflict. Customer cannot skip stages; no automatic Delivered→Completed timer. Exact customer labels remain Vežėjas pasirinktas → Paėmimas suplanuotas → Automobilis/Automobiliai paimti → Vežama → Pristatyta → Pervežimas užbaigtas.

Completed Bookings keep agreement/history access, no progression action and read-only Chat. Operational data is not independently mutable after completion/cancellation except audited authorized corrections. Review insertion locks Request/Booking and enforces Completed + correct author + unique direction. Admin cannot manufacture a review for an incomplete Booking by bypassing eligibility.

## 15. Notifications and domain-event handling

Persist in-app Notifications synchronously with their successful domain command for beta. Event key examples are Booking ID + status_version, Offer ID + revision + event kind, or Message ID + message.created. Retry uses the same event identity. Unique event dedupe + `(source_event_id,recipient_id)` prevents repeated records. No asynchronous external broker is needed for the in-app happy path.

| Event | Recipients before actor suppression | In-app now | Future channel intent only |
|---|---|---|---|
| offer.created / offer.updated | Request customer | Yes | Email |
| offer.accepted | None for notifications | No | None; internal event/system message only |
| message.created | Other Conversation participant(s) | Yes | Delayed unread/debounced email; no SMS |
| booking.created | Customer + selected carrier responsible user | Yes | Email + SMS |
| booking.pickupScheduled | Customer | Yes | Email + SMS |
| booking.collected / booking.inTransit | Customer | Yes | Email |
| booking.delivered | Customer | Yes | Email + SMS |
| booking.completed | Customer + carrier responsible user | Yes | Email |

Remove actor after recipient resolution. Consequently, normal customer-triggered acceptance does **not** send a self-Notification to that same customer; the carrier gets booking.created, and the customer sees the transactional success/Booking. An actor-free system/admin-triggered event may notify both eligible parties. Do not duplicate a customer notification via offer.accepted to compensate. This follows the existing helper tests and locked self-suppression rule.

For beta single-owner carriers, responsible carrier user and Notification recipient = current active owner. Staff/operator access and multi-member fan-out are outside V1. Notifications already assigned to a former owner do not confer ongoing access to their destination. Keep bodies free of exact private data; destination authorization is checked on every open.

Build stored href server-side from authoritative entity ID at notification creation, validate it against canonical same-origin paths (`/offers/…`, `/messages/…`, `/bookings/…`), and never recompute it during navigation. Reject external/protocol-relative/javascript destinations. Persist body/title/locale as a bounded delivery snapshot; locale chosen by the saved preference and locked fallback policy. Full translation rollout remains later work; missing translations use English fallback rather than changing entity data.

System Chat messages reference immutable domain_events and receive server-rendered bounded text, never client-authored system kind. Prevent recursion: inserting a system message does not emit message.created. Internal events needed initially also include Request publication/material change/closure, Offer decline/withdraw/expiry/unavailability, route publication and Booking operational/admin changes; these create no extra user-facing Notification types beyond the locked list.

Future email/SMS delivery adds its own table keyed by Notification/channel and transport idempotency key, delayed unread recheck/debounce and retries. No provider credentials or delivery state belong in the base Notification. Initial domain_events are not replayed into old social posts when adapters arrive; distribution requires an explicit new eligible publication event.

## 16. Supabase Storage strategy

Use two **private** buckets: `vehicle-photos` and `carrier-verification`. No Chat-attachment bucket. Never use public buckets for operational/verification data. Storage access relies on object policies plus authoritative metadata/ownership checks; possession of a predictable object prefix is not authorization. [Storage access control](https://supabase.com/docs/guides/storage/security/access-control).

- After authentication, stage a complete private Request draft and reserve up to five photo metadata slots per vehicle under Request lock. Generate server-selected UUID object keys; do not use raw filenames or user-supplied paths as authority. Issue short-lived upload authorization only for a pending metadata row owned by the caller. No upload before Auth.
- Enforce 10 MiB maximum and accepted image types at bucket and validator boundaries. Verify decoded file format, not only MIME/extension; reject decompression bombs, strip EXIF/GPS and re-encode a safe display image. Support existing HEIC/HEIF selection through conversion or return an honest processing error; do not silently drop a locked supported input type.
- Upload and Postgres publication cannot share a transaction. Use pending→ready validation; publication requires referenced photos ready or explicit user removal of failed photos. Server owns finalization, never a client-provided ready flag. Retry upload/finalization safely; cleanup orphan/pending objects through Storage API, not direct metadata deletion.
- Prefer authenticated object downloads under RLS; if issuing signed read URLs, authorize at issuance, keep lifetime short (proposed 60 seconds) and never persist/share them in public HTML or Notifications. Revocation cannot retract an already issued URL before expiry. Vehicle photos are visible only to the customer and currently authorized carrier readers, never anonymous public users in beta.
- Verification objects are visible only to carrier owner and assigned/admin reviewers; access is audited. No operator/general marketplace access. Admin scans/checks evidence; evidence approval is a distinct database command.
- For closed beta use trusted server-mediated upload grants/finalization/deletion. Grant no arbitrary storage.objects update/upsert. Object authorization must match both bucket/key and metadata owner/context. Removing a photo first revokes metadata visibility; asynchronous file cleanup follows retention rules. Removed or failed files never expand the five-active-slot quota.

No persisted photo blob inside Postgres; no external image provider required. File retention and verification evidence handling follow the separately restrictable/anonymizable retention model; numeric periods still require legal/operations approval. This design adds no upload implementation now.

## 17. Server/service-role boundary and auditing

Next.js presents authenticated reads and commands, validates input sizes, origin and sessions, and converts typed records to locked frontend projections. Database authority remains independent of those checks. Do not run acceptance as many independent REST writes or use a service key with a user ID passed by the client.

Service-only tasks: trusted Auth profile/contact reconciliation, object sanitization and cleanup, timed Offer/Route expiry, approved admin bootstrap and outbox processing when providers are later introduced. Give each job only its necessary function grants when possible. No secrets in browser bundles, logs, previews or build-time generated pages. Keep production and staging credentials/datasets separate.

Audit membership/role changes, verification decisions, private-address access via server read gateway, moderation, capacity/Booking/status changes and admin overrides. RLS does not itself provide a useful business read-access audit trail: private operational/evidence reads should use a narrow audited server/RPC path where required. Audit records are append-only and cannot be rewritten by application admin commands. Database owners remain technically privileged; restrict production access and monitor it operationally.

Bound and monitor command latency, lock waits, duplicate/conflict rates, OTP abuse, cross-tenant denials and upload failures without logging PII. Do not expose raw constraint names, whether another account owns a phone, or private entity existence in anonymous errors. Use uniform unauthorized/not-found responses.

## 18. Migration order after approval

No migrations are created in this task. Proposed dependency batches, all applied/tested in staging first:

1. Auth project/delivery decisions and environment isolation; app/api/private helper schemas, privileges, roles and extension policy. Create profiles/platform_roles and trusted provisioning. Keep Data API exposure closed until policies are present.
2. Carrier identity, memberships, private business details, verifications and curated public_locations. Install caller-scoped authorization helpers and initial policies in the same deployment, never a public unprotected interval.
3. Routes/stops/revisions and Requests/vehicles/private details/revisions; budget/flexibility fields and versioning/count invariants. Add RLS, invoker projections and owner commands.
4. Photo metadata and private buckets/object policies. Add staging/validation boundary; no public evidence storage.
5. Offers/revisions and Conversations. Add deferred circular current-revision constraints only after both tables exist. Define but do not expose write paths until integrity checks pass.
6. Bookings/operations, domain_events/audit_log, messages/read cursors, Notifications and reviews. Resolve concrete FKs in dependency order (domain_events before message.event_id; Booking after Conversation). Enable RLS/default-deny at table creation.
7. Transactional submit/revise/accept/status/read/review commands, immutable-snapshot and capacity reconciliation guards, event/notification generation, admin and expiry commands. Grant EXECUTE only on reviewed entry points. Seed catalog/controlled admin grants, never fixture reputation.
8. Security/concurrency tests using actual anon/customer/carrier/admin/service roles; backup/restore rehearsal, Storage permission tests, Auth delivery tests and rollout checks before any real users.

Auth → Supabase/Postgres schema → roles/permissions → persistence → end-to-end remains D-062's project sequence. Default-deny RLS must accompany initial tables; this does not justify postponing access control until after data becomes reachable. All table/constraint changes are additive/reviewed; no ad-hoc production SQL through the browser.

## 19. Fixture-to-production rollout sequence

1. Freeze UI contracts and create data-access adapters; domain data no longer imported directly from mock modules in production paths. Keep isolated fixture mode for local/browser review only. Never fall back to fixtures on a production authorization/network error.
2. Auth/profiles: gated publication returns to the original local draft. Stage only after authentication, publish idempotently after verification. Test phone conflict/change, revoked session, publish retries and form/photo retention.
3. Catalog + carrier onboarding + verified Route reads/writes: public discovery uses safe projections. Import only vetted geography, not mock carriers/reviews/prices. Map real UUIDs to the existing route parameters through adapters; no new navigation model.
4. Requests/vehicles/photos/private data: complete job publication independent of matching; targeted visibility, owner Dashboard and carrier browse. Verify optional budget is stored as guidance and route_flexible does not alter matching.
5. Offers/revisions + Conversations/messages: one pair thread, recipient identity, immutable system events, active/read-only states, persisted unread cursors; refresh on navigation/manual/polling as needed without requiring realtime.
6. Acceptance/Booking: one transaction and real snapshot; connect Offer, Request, Dashboard and Chat to the same persisted entity IDs. Correct fixture-only cross-links in adapters/data, without redesigning UI. Resolve the existing History-to-Completed-Booking navigation gap separately if locked UI would need a new action.
7. Lifecycle/reviews/in-app Notifications: status authorization, customer completion, unique eligible review, canonical href and mark-read persistence; capacity stays correct across retries/cancellation.
8. End-to-end beta acceptance with real test accounts and separate database connections. No mixed real/fixture counterpart entities. Feature-gate whole connected flows until authorization tests pass; do not expose a partially real accept path.

Release acceptance tests: public/private separation across direct REST/RPC/Storage; targeted carrier versus competitor; malicious ownership/status fields; two Offers for same Request; two Requests for last capacity; repeated acceptance response loss; stale Request/Route/Offer; cancellation retry and cancellation racing collection; capacity reduction race; Offer revision racing acceptance; message racing thread archive; membership revoked mid-command; verification expired during lock wait; replayed event; forged Notification href/recipient; review before completion/duplicate/wrong party; long input/upload misuse; cross-user read-state writes; private cache contamination; timezone/DST/date-only boundaries. Existing unit/browser tests remain regressions, not proof of RLS/concurrency correctness.

## 20. Deferred V1.2/later items

**RouteDistributionJob: choose B, defer its table to a later migration.** Closed beta has no active social integration and does not need an empty queue to complete its marketplace flow. Keep the publication event boundary and public immutable Route revision now. Add the job table only with an approved adapter/manual distribution workflow, using the locked fields (route/channel/target/locale/mode/status/payload snapshot/external ID/timestamps/error) and unique publication-event + channel + target + locale key. At that time snapshot public eligible supply, exclude contacts/addresses, never replay stale publication events automatically. No current Route mutation calls a provider.

Also defer: notification_deliveries/provider preferences, Maps/PostGIS/detour engines, automated KYC, Google/Apple, staff invitations, Chat attachments/realtime, public customer reviews, saved-carrier persistence, payments/escrow, global event bus, translation rollout, advanced analytics and capacity reuse. Do not defer real Auth delivery if its chosen mechanism is necessary to admit beta users.

Reports/disputes: no new table is required for the minimum happy-path beta. Existing product behavior requires staffed manual support with audited admin actions for post-collection exceptions. This is not permission to add normal self-service cancellation after collection or silently drop incidents.

## 21. Security risks and edge cases

- **Email-only shortcut:** would violate locked verified-phone publication semantics unless explicitly approved. An unverified phone field is not an authentication factor.
- **Privileges:** service-role leakage, insecure definer search paths, default function EXECUTE, invoker-view misconfiguration and user-controlled role metadata can defeat RLS. Test direct API calls, not just pages.
- **Concurrency:** every critical write must follow the same locks/invariants; background jobs and admin routes are not exceptions. Preserve immutable parent IDs so preliminary lookups cannot redirect locks to another Request.
- **Stale authority:** verify account/membership/current verification at execution; public trust aggregates and JWT role claims can be stale. Losing carrier Offer/Chat history must not reopen Request private access.
- **Data leakage:** public reviews, public route projections, photos/EXIF, notes, logs, Notification bodies, signed URLs and Next/CDN caches are distinct leak channels. IDs/slugs are locators, never authorization.
- **Historical truth:** no fixture import of ratings/verified flags, no recomputing Booking terms from mutable Request/carrier rows; opaque snapshots still need validation and size limits.
- **Availability:** publication can fail if profile sync or photo processing fails; provide retries and honest errors, not partial publication. Provider outage must not bypass phone verification.
- **Retention/account recovery:** verified phone reuse and anonymization need deliberate support handling; automatic linking could enable takeover. Database retention does not automatically retain or purge Storage objects.
- **Operational boundaries:** required pickup fields must gate the relevant transition; cancellation/admin authority is command-specific; closed beta has one carrier owner. Do not replace these constraints with a permissive generic update policy.
- **Locale/time:** business dates use locality/calendar semantics; shared multi-location pickup window does not imply every pickup uses one timezone. Individual operational windows store instants; the shared Offer pickup timezone is explicit. No arbitrary client timestamp decides expiration/read/success.

## 22. LOCKED architecture decisions — human approved 2026-09-22

OD-1 through OD-5 are resolved architecture decisions, not open migration blockers.

| ID | Locked decision |
|---|---|
| OD-1 | **Approved A — Auth delivery/publication gate.** Phone OTP is required for Request publication. Email OTP is optional, but an email-authenticated user must still complete phone verification before publishing. |
| OD-2 | **Approved A — Carrier organization access.** Closed beta has exactly one active Carrier owner and no staff/operator access in V1. Carrier-private data, historical Chat, operational actions and carrier Notifications are scoped to that owner under RLS. |
| OD-3 | **Approved A with constraints — cancellation and exception authority.** Customer and selected Carrier owner may cancel before `collected`. Cancellation is a terminal exception outcome, not a seventh normal Booking lifecycle step. Cancellation, exactly-once capacity release, Request/Conversation closure and audit recording are atomic. After `collected`, cancellation is not a normal self-service action; exceptions require manual support through narrow audited admin commands. |
| OD-4 | **Approved A — review directions.** Customer-to-Carrier reviews are public; Carrier-to-Customer reviews are private. Both require a Completed Booking and uniqueness per `(booking_id,direction)`. Review implementation may be deferred if it is not required for the initial closed-beta migrations, while the schema and private-by-default RLS contract remain locked. |
| OD-5 | **Approved A — retention and historical access.** Preserve immutable commercial agreement/history. Keep PII, operational data and evidence separately restrictable/anonymizable under an approved retention policy; never cascade account deletion through commercial history. Numeric retention periods are intentionally not invented and require legal/operations approval. |

### Remaining non-blocking legal/operations item

Legal/operations must approve numeric retention periods for PII, operational records, verification evidence and Storage objects before retention jobs or production cleanup are enabled. This does **not** block the database architecture or initial foundation migrations because durable commercial history and separable private-data boundaries are already locked.

No packages, Supabase project/configuration, SQL, migrations, API routes, server actions, Auth code, UI, fixtures, realtime or providers were created by this architecture approval.
