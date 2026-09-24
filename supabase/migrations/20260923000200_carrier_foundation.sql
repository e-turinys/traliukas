begin;
create table app.carriers (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  display_name text not null,
  description text not null default '',
  registration_country char(2),
  service_countries text[] not null default '{}',
  visibility text not null default 'draft',
  suspended_at timestamptz,
  cmr_insurance_available boolean not null default false,
  invoice_available boolean not null default false,
  live_tracking_available boolean not null default false,
  created_at timestamptz not null default transaction_timestamp(),
  updated_at timestamptz not null default transaction_timestamp(),
  constraint carriers_slug check (length(slug) between 3 and 100 and slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  constraint carriers_name check (display_name = btrim(display_name) and length(display_name) between 1 and 200),
  constraint carriers_description check (description = btrim(description) and length(description) <= 4000),
  constraint carriers_country check (registration_country is null or registration_country ~ '^[A-Z]{2}$'),
  constraint carriers_countries check (cardinality(service_countries) <= 250 and array_position(service_countries,null) is null and array_to_string(service_countries,',') ~ '^([A-Z]{2}(,[A-Z]{2})*)?$'),
  constraint carriers_visibility check (visibility in ('draft','published','hidden'))
);
alter table app.carriers enable row level security;
create table app.carrier_memberships (
  carrier_id uuid not null references app.carriers(id) on delete restrict,
  user_id uuid not null references app.profiles(id) on delete restrict,
  role text not null,
  active boolean not null default true,
  created_at timestamptz not null default transaction_timestamp(),
  updated_at timestamptz not null default transaction_timestamp(),
  primary key (carrier_id,user_id),
  constraint carrier_memberships_owner_only check (role = 'owner')
);
create unique index carrier_one_active_owner on app.carrier_memberships(carrier_id) where active;
create index carrier_memberships_user on app.carrier_memberships(user_id,carrier_id);
alter table app.carrier_memberships enable row level security;
create table app.carrier_private_details (
  carrier_id uuid primary key references app.carriers(id) on delete restrict,
  legal_name text not null,
  business_kind text not null,
  registration_number text,
  vat_number text,
  registration_country char(2) not null,
  street text,
  postcode text,
  city text,
  contact_email text,
  contact_phone text,
  created_at timestamptz not null default transaction_timestamp(),
  updated_at timestamptz not null default transaction_timestamp(),
  constraint carrier_private_name check (legal_name = btrim(legal_name) and length(legal_name) between 1 and 200),
  constraint carrier_private_kind check (business_kind in ('individual','company')),
  constraint carrier_private_country check (registration_country ~ '^[A-Z]{2}$'),
  constraint carrier_private_registration check (registration_number is null or (registration_number = btrim(registration_number) and length(registration_number) between 1 and 100)),
  constraint carrier_private_vat check (vat_number is null or (vat_number = btrim(vat_number) and length(vat_number) between 1 and 100)),
  constraint carrier_private_street check (street is null or (street = btrim(street) and length(street) between 1 and 300)),
  constraint carrier_private_postcode check (postcode is null or (postcode = btrim(postcode) and length(postcode) between 1 and 32)),
  constraint carrier_private_city check (city is null or (city = btrim(city) and length(city) between 1 and 200)),
  constraint carrier_private_email check (contact_email is null or (length(contact_email) <= 254 and contact_email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$')),
  constraint carrier_private_phone check (contact_phone is null or contact_phone ~ '^\+[1-9][0-9]{1,14}$')
);
alter table app.carrier_private_details enable row level security;
create table app.carrier_verifications (
  id uuid primary key default gen_random_uuid(),
  carrier_id uuid not null references app.carriers(id) on delete restrict,
  category text not null,
  status text not null,
  evidence_bucket text,
  evidence_key text,
  reviewed_by uuid references app.profiles(id) on delete restrict,
  reviewed_at timestamptz,
  expires_at timestamptz,
  coverage_amount numeric(12,2),
  coverage_currency char(3),
  decision_reason text,
  created_at timestamptz not null default transaction_timestamp(),
  updated_at timestamptz not null default transaction_timestamp(),
  unique(carrier_id,category),
  constraint carrier_verification_category check (category in ('contact','identity','company','transport_documents','cmr_insurance')),
  constraint carrier_verification_status check (status in ('not_submitted','pending','approved','rejected','expired')),
  constraint carrier_verification_evidence check ((evidence_bucket is null) = (evidence_key is null)
    and (evidence_bucket is null or evidence_bucket = 'carrier-verification')
    and (evidence_key is null or (length(evidence_key) between 1 and 1024 and evidence_key = btrim(evidence_key)))),
  constraint carrier_verification_coverage check ((coverage_amount is null) = (coverage_currency is null)
    and (coverage_amount is null or coverage_amount > 0)
    and (coverage_currency is null or coverage_currency ~ '^[A-Z]{3}$')),
  constraint carrier_verification_approval check (status <> 'approved' or (reviewed_by is not null and reviewed_at is not null)),
  constraint carrier_verification_reason check (decision_reason is null or (decision_reason = btrim(decision_reason) and length(decision_reason) between 1 and 2000))
);
create index carrier_verifications_reviewer on app.carrier_verifications(reviewed_by);
create index carrier_verifications_eligibility on app.carrier_verifications(carrier_id,category,status,expires_at);
alter table app.carrier_verifications enable row level security;
create table app.public_locations (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  city text not null,
  region text,
  country_name text not null,
  country_code char(2) not null,
  latitude numeric(9,6),
  longitude numeric(9,6),
  provider_place_id text,
  time_zone text not null,
  created_at timestamptz not null default transaction_timestamp(),
  updated_at timestamptz not null default transaction_timestamp(),
  constraint public_locations_slug check (length(slug) between 1 and 200 and slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  constraint public_locations_city check (city = btrim(city) and length(city) between 1 and 200),
  constraint public_locations_region check (region is null or (region = btrim(region) and length(region) between 1 and 200)),
  constraint public_locations_country_name check (country_name = btrim(country_name) and length(country_name) between 1 and 200),
  constraint public_locations_country_code check (country_code ~ '^[A-Z]{2}$'),
  constraint public_locations_coordinates check ((latitude is null) = (longitude is null) and latitude between -90 and 90 and longitude between -180 and 180),
  constraint public_locations_provider check (provider_place_id is null or (provider_place_id = btrim(provider_place_id) and length(provider_place_id) between 1 and 500))
);
alter table app.public_locations enable row level security;

create function private.validate_location() returns trigger
language plpgsql set search_path = '' as $$
begin
  if tg_op <> 'INSERT' then raise exception 'Curated locations are immutable; create a correction row'; end if;
  if not exists (select 1 from pg_catalog.pg_timezone_names where name = new.time_zone) then
    raise exception 'Invalid IANA time zone' using errcode = '23514';
  end if;
  return new;
end;
$$;
revoke execute on function private.validate_location() from public, anon, authenticated, service_role;
create trigger public_locations_immutable before insert or update or delete on app.public_locations
for each row execute function private.validate_location();

create trigger carriers_timestamps before insert or update on app.carriers for each row execute function private.set_timestamps();
create trigger memberships_timestamps before insert or update on app.carrier_memberships for each row execute function private.set_timestamps();
create trigger carrier_private_timestamps before insert or update on app.carrier_private_details for each row execute function private.set_timestamps();
create trigger verifications_timestamps before insert or update on app.carrier_verifications for each row execute function private.set_timestamps();
create trigger locations_timestamps before insert or update on app.public_locations for each row execute function private.set_timestamps();

-- Maximum one owner is immediate; minimum one is checked at transaction end.
-- Lock the carrier for all membership mutations, including trusted SQL.
create function private.lock_membership_carrier() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'UPDATE' and (new.carrier_id <> old.carrier_id or new.user_id <> old.user_id) then
    raise exception 'Membership identity is immutable' using errcode = '23514';
  end if;
  perform 1 from app.carriers where id = case when tg_op = 'DELETE' then old.carrier_id else new.carrier_id end for update;
  return case when tg_op = 'DELETE' then old else new end;
end;
$$;
revoke execute on function private.lock_membership_carrier() from public, anon, authenticated, service_role;
create function private.require_one_owner() returns trigger
language plpgsql security definer set search_path = '' as $$
declare target uuid;
begin
  if tg_table_name = 'carriers' then target := new.id;
  else target := case when tg_op = 'DELETE' then old.carrier_id else new.carrier_id end; end if;
  perform 1 from app.carriers where id = target for update;
  if found and (select count(*) from app.carrier_memberships where carrier_id = target and active) <> 1 then
    raise exception 'Carrier must have exactly one active owner' using errcode = '23514';
  end if;
  return null;
end;
$$;
revoke execute on function private.require_one_owner() from public, anon, authenticated, service_role;
grant select, update on app.carriers to parvezk_authorization;
grant select on app.carrier_memberships to parvezk_authorization;
create policy carriers_authorization on app.carriers to parvezk_authorization using (true) with check (true);
create policy memberships_authorization on app.carrier_memberships for select to parvezk_authorization using (true);
create trigger membership_parent_lock before insert or update or delete on app.carrier_memberships for each row execute function private.lock_membership_carrier();
create constraint trigger carrier_has_owner after insert or update on app.carriers deferrable initially deferred for each row execute function private.require_one_owner();
create constraint trigger membership_has_owner after insert or update or delete on app.carrier_memberships deferrable initially deferred for each row execute function private.require_one_owner();

create function private.is_carrier_owner(target uuid) returns boolean
language sql stable security definer set search_path = ''
begin atomic
  select exists (select 1 from app.carrier_memberships
    where carrier_id = target and user_id = auth.uid() and active and role = 'owner');
end;
revoke execute on function private.is_carrier_owner(uuid) from public, anon, authenticated, service_role;
grant execute on function private.is_carrier_owner(uuid) to authenticated, parvezk_commands;

create policy carriers_public_read on app.carriers for select to anon, authenticated using (visibility = 'published' and suspended_at is null);
create policy carriers_owner_read on app.carriers for select to authenticated using (private.is_carrier_owner(id));
create policy memberships_owner_read on app.carrier_memberships for select to authenticated using (user_id = (select auth.uid()) or private.is_carrier_owner(carrier_id));
create policy carrier_private_owner_read on app.carrier_private_details for select to authenticated using (private.is_carrier_owner(carrier_id));
create policy verification_owner_read on app.carrier_verifications for select to authenticated using (private.is_carrier_owner(carrier_id));
create policy locations_public_read on app.public_locations for select to anon, authenticated using (true);

-- Column grants are required in addition to RLS, even for a non-exposed base schema.
grant select (id,slug,display_name,description,registration_country,service_countries,cmr_insurance_available,invoice_available,live_tracking_available,visibility,suspended_at) on app.carriers to anon, authenticated;
grant select on app.carrier_memberships, app.carrier_private_details to authenticated;
grant select (id,carrier_id,category,status,evidence_bucket,evidence_key,expires_at,created_at,updated_at) on app.carrier_verifications to authenticated;
grant select (id,slug,city,region,country_name,country_code,latitude,longitude,time_zone) on app.public_locations to anon, authenticated;
create view api.public_carriers with (security_invoker = true) as
select id,slug,display_name,description,registration_country,service_countries,
  cmr_insurance_available,invoice_available,live_tracking_available
from app.carriers where visibility = 'published' and suspended_at is null;
create view api.my_carriers with (security_invoker = true) as
select id,slug,display_name,description,registration_country,service_countries,visibility,suspended_at,
  cmr_insurance_available,invoice_available,live_tracking_available
from app.carriers where private.is_carrier_owner(id);
create view api.my_carrier_memberships with (security_invoker = true) as
select carrier_id,user_id,role,active,created_at,updated_at from app.carrier_memberships;
create view api.my_carrier_private_details with (security_invoker = true) as
select carrier_id,legal_name,business_kind,registration_number,vat_number,registration_country,
  street,postcode,city,contact_email,contact_phone,created_at,updated_at from app.carrier_private_details;
create view api.my_carrier_verifications with (security_invoker = true) as
select id,carrier_id,category,status,evidence_bucket,evidence_key,expires_at,created_at,updated_at from app.carrier_verifications;
create view api.public_locations with (security_invoker = true) as
select id,slug,city,region,country_name,country_code,latitude,longitude,time_zone from app.public_locations;
grant select on api.public_carriers, api.public_locations to anon, authenticated;
grant select on api.my_carriers,api.my_carrier_memberships,api.my_carrier_private_details,api.my_carrier_verifications to authenticated;

-- Only commands can create or edit; no ordinary client table writes.
grant select, insert, update on app.carriers,app.carrier_memberships,app.carrier_private_details to parvezk_commands;
create policy carriers_command on app.carriers to parvezk_commands using (private.is_carrier_owner(id)) with check (true);
create policy memberships_command on app.carrier_memberships to parvezk_commands using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy carrier_private_command on app.carrier_private_details to parvezk_commands using (private.is_carrier_owner(carrier_id)) with check (private.is_carrier_owner(carrier_id));

create function api.create_carrier(p_slug text,p_display_name text,p_legal_name text,p_business_kind text,p_registration_country text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare caller uuid; carrier uuid := gen_random_uuid();
begin
  caller := private.require_active_user(true);
  -- Check before assignment into char(2), which would otherwise truncate explicit casts.
  if p_registration_country is null or p_registration_country !~ '^[A-Z]{2}$' then
    raise exception 'Invalid country' using errcode = '23514';
  end if;
  insert into app.carriers(id,slug,display_name,registration_country)
    values (carrier,p_slug,btrim(p_display_name),p_registration_country);
  insert into app.carrier_memberships(carrier_id,user_id,role) values(carrier,caller,'owner');
  insert into app.carrier_private_details(carrier_id,legal_name,business_kind,registration_country)
    values(carrier,btrim(p_legal_name),p_business_kind,p_registration_country);
  insert into app.audit_log(actor_id,action,entity_type,entity_id,correlation_id,change_summary)
    values(caller,'carrier.created','carrier',carrier,gen_random_uuid(),'{"fields":["carrier","owner","business"]}');
  return carrier;
end;
$$;
revoke execute on function api.create_carrier(text,text,text,text,text) from public, anon, authenticated, service_role;
grant execute on function api.create_carrier(text,text,text,text,text) to authenticated;

create function api.update_my_carrier(p_carrier_id uuid,p_display_name text,p_description text,
  p_service_countries text[],p_cmr_insurance_available boolean,p_invoice_available boolean,p_live_tracking_available boolean)
returns void language plpgsql security definer set search_path = '' as $$
declare caller uuid;
begin
  caller := private.require_active_user(true);
  perform 1 from app.carriers where id = p_carrier_id and suspended_at is null for update;
  if not found or not private.is_carrier_owner(p_carrier_id) then raise exception 'Not authorized' using errcode = '42501'; end if;
  update app.carriers set display_name=btrim(p_display_name),description=btrim(p_description),service_countries=p_service_countries,
    cmr_insurance_available=p_cmr_insurance_available,invoice_available=p_invoice_available,live_tracking_available=p_live_tracking_available
    where id=p_carrier_id;
  insert into app.audit_log(actor_id,action,entity_type,entity_id,correlation_id,change_summary)
    values(caller,'carrier.updated','carrier',p_carrier_id,gen_random_uuid(),'{"fields":["display_name","description","service_countries","declarations"]}');
end;
$$;
revoke execute on function api.update_my_carrier(uuid,text,text,text[],boolean,boolean,boolean) from public, anon, authenticated, service_role;
grant execute on function api.update_my_carrier(uuid,text,text,text[],boolean,boolean,boolean) to authenticated;

-- Approval, eligibility, suspension and evidence workflows are not generic write endpoints.
-- Foundation service access supports controlled server operations, never ordinary app reads.
grant select, insert, update on app.carriers,app.carrier_memberships,app.carrier_private_details,app.carrier_verifications to service_role;
grant select, insert on app.public_locations to service_role;
-- PostgreSQL 17/Supabase migrations run without superuser ownership bypass.
-- Finish trigger creation and EXECUTE grants while still owning the functions.
-- Give only this trusted migration executor temporary SET permission (not
-- inherited runtime privileges), and give new owners temporary schema CREATE.
-- Keep the creator's ADMIN-only membership for later migrations/local resets;
-- remove SET permission and schema CREATE before this transaction commits.
grant parvezk_authorization, parvezk_commands to current_user with inherit false;
grant parvezk_authorization, parvezk_commands to current_user with set true;
grant create on schema private to parvezk_authorization;
grant create on schema api to parvezk_commands;

alter function private.lock_membership_carrier() owner to parvezk_authorization;
alter function private.require_one_owner() owner to parvezk_authorization;
alter function private.is_carrier_owner(uuid) owner to parvezk_authorization;
alter function api.create_carrier(text,text,text,text,text) owner to parvezk_commands;
alter function api.update_my_carrier(uuid,text,text,text[],boolean,boolean,boolean) owner to parvezk_commands;

revoke create on schema private from parvezk_authorization;
revoke create on schema api from parvezk_commands;
revoke set option for parvezk_authorization, parvezk_commands from current_user;
commit;
