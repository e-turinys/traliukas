begin;

-- Phase 4 commercial records. No ordinary client writes and no notification
-- delivery/storage. Entry points are installed separately after their guards.
create table app.offers (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references app.transport_requests(id) on delete restrict,
  carrier_id uuid not null references app.carriers(id) on delete restrict,
  route_id uuid not null references app.carrier_routes(id) on delete restrict,
  status text not null default 'pending' check(status in ('pending','accepted','declined','withdrawn','expired','not_selected','unavailable')),
  current_version integer not null default 1 check(current_version>0),
  created_by uuid not null references app.profiles(id) on delete restrict,
  created_at timestamptz not null default transaction_timestamp(),
  updated_at timestamptz not null default transaction_timestamp(),
  unique(id,request_id,carrier_id), unique(id,request_id,route_id)
);
alter table app.offers enable row level security;
create unique index offers_pending_pair on app.offers(request_id,carrier_id) where status='pending';
create unique index offers_one_winner on app.offers(request_id) where status='accepted';
create index offers_carrier on app.offers(carrier_id,created_at,id);
create index offers_route on app.offers(route_id);
create index offers_actor on app.offers(created_by);

create table app.offer_revisions (
  offer_id uuid not null,
  version integer not null check(version>0),
  request_id uuid not null,
  request_version integer not null,
  route_id uuid not null,
  route_version integer not null,
  total_price numeric(12,2) not null check(total_price>0 and total_price<10000000000),
  currency char(3) not null default 'EUR' check(currency='EUR'),
  planned_pickup_date date not null,
  pickup_time_from time,
  pickup_time_to time,
  pickup_time_zone text not null check(length(pickup_time_zone) between 1 and 100),
  planned_delivery_date date not null,
  payment_terms text not null check(payment_terms=btrim(payment_terms) and length(payment_terms) between 1 and 2000),
  carrier_comment text check(carrier_comment=btrim(carrier_comment) and length(carrier_comment) between 1 and 2000),
  expires_at timestamptz not null check(isfinite(expires_at)),
  revised_by uuid not null references app.profiles(id) on delete restrict,
  created_at timestamptz not null default transaction_timestamp(),
  primary key(offer_id,version),
  foreign key(offer_id,request_id,route_id) references app.offers(id,request_id,route_id) on delete restrict,
  foreign key(request_id,request_version) references app.request_revisions(request_id,version) on delete restrict,
  foreign key(route_id,route_version) references app.route_revisions(route_id,version) on delete restrict,
  check(isfinite(planned_pickup_date) and isfinite(planned_delivery_date) and planned_delivery_date>=planned_pickup_date),
  check((pickup_time_from is null and pickup_time_to is null) or
    (pickup_time_from is not null and pickup_time_to is not null and pickup_time_from<=pickup_time_to))
);
alter table app.offer_revisions enable row level security;
create index offer_revisions_request on app.offer_revisions(request_id,request_version);
create index offer_revisions_route on app.offer_revisions(route_id,route_version);
create index offer_revisions_actor on app.offer_revisions(revised_by);
alter table app.offers add constraint offer_current_revision foreign key(id,current_version)
  references app.offer_revisions(offer_id,version) deferrable initially deferred;

create table app.conversations (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references app.transport_requests(id) on delete restrict,
  carrier_id uuid not null references app.carriers(id) on delete restrict,
  current_offer_id uuid not null,
  status text not null default 'active' check(status in ('active','archived','completed')),
  last_message_at timestamptz not null default transaction_timestamp(),
  created_at timestamptz not null default transaction_timestamp(),
  updated_at timestamptz not null default transaction_timestamp(),
  unique(request_id,carrier_id), unique(id,request_id,carrier_id),
  foreign key(current_offer_id,request_id,carrier_id) references app.offers(id,request_id,carrier_id) on delete restrict
);
alter table app.conversations enable row level security;
create index conversations_carrier on app.conversations(carrier_id,last_message_at,id);
create index conversations_offer on app.conversations(current_offer_id);

create table app.bookings (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null unique references app.transport_requests(id) on delete restrict,
  accepted_offer_id uuid not null unique,
  accepted_offer_version integer not null,
  customer_id uuid not null references app.profiles(id) on delete restrict,
  carrier_id uuid not null references app.carriers(id) on delete restrict,
  route_id uuid not null references app.carrier_routes(id) on delete restrict,
  conversation_id uuid not null unique,
  vehicle_count smallint not null check(vehicle_count between 1 and 10),
  agreed_total_price numeric(12,2) not null check(agreed_total_price>0 and agreed_total_price<10000000000),
  currency char(3) not null check(currency='EUR'),
  payment_terms text not null check(payment_terms=btrim(payment_terms) and length(payment_terms) between 1 and 2000),
  planned_pickup_date date not null,
  planned_delivery_date date not null,
  snapshot_schema_version smallint not null default 1 check(snapshot_schema_version=1),
  agreement_snapshot jsonb not null check(jsonb_typeof(agreement_snapshot)='object' and octet_length(agreement_snapshot::text)<=131072),
  -- No lifecycle command is exposed in Phase 4.
  status text not null default 'booked' check(status in ('booked','pickup_scheduled','collected','in_transit','delivered','completed','cancelled')),
  status_version integer not null default 1 check(status_version>0),
  status_changed_at timestamptz not null default transaction_timestamp(),
  completed_at timestamptz,
  cancelled_at timestamptz,
  capacity_released_at timestamptz,
  created_at timestamptz not null default transaction_timestamp(),
  updated_at timestamptz not null default transaction_timestamp(),
  foreign key(accepted_offer_id,accepted_offer_version) references app.offer_revisions(offer_id,version) on delete restrict,
  foreign key(accepted_offer_id,request_id,carrier_id) references app.offers(id,request_id,carrier_id) on delete restrict,
  foreign key(conversation_id,request_id,carrier_id) references app.conversations(id,request_id,carrier_id) on delete restrict,
  check(isfinite(planned_pickup_date) and isfinite(planned_delivery_date) and planned_delivery_date>=planned_pickup_date),
  check((status='completed')=(completed_at is not null)),
  check((status='cancelled')=(cancelled_at is not null)),
  check((status='cancelled')=(capacity_released_at is not null))
);
alter table app.bookings enable row level security;
create index bookings_customer on app.bookings(customer_id,created_at,id);
create index bookings_carrier on app.bookings(carrier_id,created_at,id);
create index bookings_route on app.bookings(route_id);

create table app.booking_vehicle_operations (
  booking_id uuid not null references app.bookings(id) on delete restrict,
  vehicle_id uuid not null references app.request_vehicles(id) on delete restrict,
  side text not null check(side in ('pickup','delivery')),
  street text check(length(street) between 1 and 300),
  postcode text check(length(postcode) between 1 and 32),
  city text check(length(city) between 1 and 200),
  country_code char(2) check(country_code ~ '^[A-Z]{2}$'),
  instructions text check(length(instructions) between 1 and 4000),
  contact_name text check(length(contact_name) between 1 and 200),
  contact_phone text check(contact_phone ~ '^\+[1-9][0-9]{1,14}$'),
  contact_email text check(length(contact_email)<=254 and contact_email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'),
  scheduled_from timestamptz,
  scheduled_to timestamptz,
  eta timestamptz,
  operation_version integer not null default 1 check(operation_version>0),
  updated_by uuid not null references app.profiles(id) on delete restrict,
  created_at timestamptz not null default transaction_timestamp(),
  updated_at timestamptz not null default transaction_timestamp(),
  primary key(booking_id,vehicle_id,side),
  check((scheduled_from is null and scheduled_to is null) or
    (scheduled_from is not null and scheduled_to is not null and scheduled_from<=scheduled_to))
);
alter table app.booking_vehicle_operations enable row level security;
create index booking_operations_vehicle on app.booking_vehicle_operations(vehicle_id);
create index booking_operations_actor on app.booking_vehicle_operations(updated_by);

-- Internal event boundary only. No Notifications table, recipients or delivery.
create table app.domain_events (
  id uuid primary key default gen_random_uuid(),
  dedupe_key text not null unique check(length(dedupe_key) between 1 and 200),
  event_type text not null check(event_type in ('offer.created','offer.updated','offer.accepted','offer.declined','message.created','booking.created')),
  actor_id uuid references app.profiles(id) on delete restrict,
  request_id uuid not null references app.transport_requests(id) on delete restrict,
  offer_id uuid references app.offers(id) on delete restrict,
  conversation_id uuid references app.conversations(id) on delete restrict,
  booking_id uuid references app.bookings(id) on delete restrict,
  route_id uuid references app.carrier_routes(id) on delete restrict,
  payload_schema_version smallint not null default 1 check(payload_schema_version=1),
  payload jsonb not null default '{}' check(jsonb_typeof(payload)='object' and octet_length(payload::text)<=32768
    and payload - array['offer_version','message_id','vehicle_count']::text[]='{}'::jsonb),
  created_at timestamptz not null default transaction_timestamp()
);
alter table app.domain_events enable row level security;
create index events_request on app.domain_events(request_id);
create index events_actor on app.domain_events(actor_id);
create index events_offer on app.domain_events(offer_id);
create index events_conversation on app.domain_events(conversation_id);
create index events_booking on app.domain_events(booking_id);
create index events_route on app.domain_events(route_id);

create table app.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references app.conversations(id) on delete restrict,
  sequence bigint not null check(sequence>0),
  kind text not null check(kind in ('user','system')),
  sender_user_id uuid references app.profiles(id) on delete restrict,
  sender_side text not null check(sender_side in ('customer','carrier','system')),
  body text not null check(body=btrim(body) and length(body) between 1 and 2000),
  event_id uuid references app.domain_events(id) on delete restrict,
  client_message_key uuid,
  created_at timestamptz not null default transaction_timestamp(),
  unique(conversation_id,sequence),
  check((kind='user' and sender_user_id is not null and client_message_key is not null and event_id is null and sender_side in ('customer','carrier'))
    or (kind='system' and sender_user_id is null and client_message_key is null and event_id is not null and sender_side='system'))
);
alter table app.messages enable row level security;
create unique index messages_event on app.messages(conversation_id,event_id) where event_id is not null;
create unique index messages_retry on app.messages(sender_user_id,client_message_key) where client_message_key is not null;
create index messages_event_fk on app.messages(event_id);

create table app.conversation_reads (
  conversation_id uuid not null references app.conversations(id) on delete restrict,
  user_id uuid not null references app.profiles(id) on delete restrict,
  last_read_sequence bigint not null default 0 check(last_read_sequence>=0),
  created_at timestamptz not null default transaction_timestamp(),
  updated_at timestamptz not null default transaction_timestamp(),
  primary key(conversation_id,user_id)
);
alter table app.conversation_reads enable row level security;
create index conversation_reads_user on app.conversation_reads(user_id);

create trigger offer_revisions_immutable before update or delete or truncate on app.offer_revisions
  for each statement execute function private.guard_audit();
create trigger messages_immutable before update or delete or truncate on app.messages
  for each statement execute function private.guard_audit();
create trigger events_immutable before update or delete or truncate on app.domain_events
  for each statement execute function private.guard_audit();
create trigger offers_timestamps before insert or update on app.offers for each row execute function private.set_timestamps();
create trigger conversations_timestamps before insert or update on app.conversations for each row execute function private.set_timestamps();
create trigger bookings_timestamps before insert or update on app.bookings for each row execute function private.set_timestamps();
create trigger reads_timestamps before insert or update on app.conversation_reads for each row execute function private.set_timestamps();

-- Authorization functions return caller-scoped booleans only. They neither
-- accept a trusted user ID nor return another participant's private records.
grant select(id,account_status) on app.profiles to parvezk_authorization;
create policy profiles_party_authorization on app.profiles for select to parvezk_authorization using(id=auth.uid());
create function private.commercial_party(p_request uuid,p_carrier uuid) returns boolean
language sql stable security definer set search_path='' begin atomic
  select private.has_live_session() and exists(select 1 from app.profiles where id=auth.uid() and account_status='active')
    and (private.owns_request(p_request) or private.is_carrier_owner(p_carrier));
end;
create function private.can_read_offer(target uuid) returns boolean
language sql stable security definer set search_path='' begin atomic
  select exists(select 1 from app.offers o where o.id=target and private.commercial_party(o.request_id,o.carrier_id));
end;
create function private.can_read_conversation(target uuid) returns boolean
language sql stable security definer set search_path='' begin atomic
  select exists(select 1 from app.conversations c where c.id=target and private.commercial_party(c.request_id,c.carrier_id));
end;
create function private.can_read_booking(target uuid) returns boolean
language sql stable security definer set search_path='' begin atomic
  select exists(select 1 from app.bookings b where b.id=target and private.commercial_party(b.request_id,b.carrier_id));
end;
revoke execute on function private.commercial_party(uuid,uuid),private.can_read_offer(uuid),private.can_read_conversation(uuid),private.can_read_booking(uuid) from public,anon,authenticated,service_role;
grant execute on function private.commercial_party(uuid,uuid),private.can_read_offer(uuid),private.can_read_conversation(uuid),private.can_read_booking(uuid) to authenticated,parvezk_commands,parvezk_authorization;
grant execute on function private.owns_request(uuid) to parvezk_authorization;

grant select on app.offers,app.offer_revisions,app.conversations,app.bookings,app.messages,app.conversation_reads to authenticated;
create policy offers_read on app.offers for select to authenticated using(private.commercial_party(request_id,carrier_id));
create policy offer_revisions_read on app.offer_revisions for select to authenticated using(private.can_read_offer(offer_id));
create policy conversations_read on app.conversations for select to authenticated using(private.commercial_party(request_id,carrier_id));
create policy bookings_read on app.bookings for select to authenticated using(private.commercial_party(request_id,carrier_id));
create policy messages_read on app.messages for select to authenticated using(private.can_read_conversation(conversation_id));
create policy reads_read on app.conversation_reads for select to authenticated using(user_id=auth.uid() and private.can_read_conversation(conversation_id));
-- Operational exact data remains closed until the audited gateway is installed.

grant select on app.offers,app.offer_revisions,app.conversations,app.bookings,app.messages,app.conversation_reads,app.booking_vehicle_operations to parvezk_authorization;
create policy offers_authorization on app.offers for select to parvezk_authorization using(true);
create policy offer_revisions_authorization on app.offer_revisions for select to parvezk_authorization using(true);
create policy conversations_authorization on app.conversations for select to parvezk_authorization using(true);
create policy bookings_authorization on app.bookings for select to parvezk_authorization using(true);
create policy messages_authorization on app.messages for select to parvezk_authorization using(true);
create policy reads_authorization on app.conversation_reads for select to parvezk_authorization using(true);
create policy operations_authorization on app.booking_vehicle_operations for select to parvezk_authorization using(true);

grant parvezk_authorization to current_user with inherit false;
grant parvezk_authorization to current_user with set true;
grant create on schema private to parvezk_authorization;
alter function private.commercial_party(uuid,uuid) owner to parvezk_authorization;
alter function private.can_read_offer(uuid) owner to parvezk_authorization;
alter function private.can_read_conversation(uuid) owner to parvezk_authorization;
alter function private.can_read_booking(uuid) owner to parvezk_authorization;
revoke create on schema private from parvezk_authorization;
revoke set option for parvezk_authorization from current_user;
commit;
