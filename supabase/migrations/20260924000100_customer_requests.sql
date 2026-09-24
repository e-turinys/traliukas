begin;

-- Curated city centroids corresponding to the existing picker, never user-supplied addresses.
insert into app.public_locations(slug,city,country_name,country_code,latitude,longitude,time_zone) values
('hamburg-de','Hamburg','Germany','DE',53.5511,9.9937,'Europe/Berlin'),
('berlin-de','Berlin','Germany','DE',52.52,13.405,'Europe/Berlin'),
('warsaw-pl','Warsaw','Poland','PL',52.2297,21.0122,'Europe/Warsaw'),
('kaunas-lt','Kaunas','Lithuania','LT',54.8985,23.9036,'Europe/Vilnius'),
('vilnius-lt','Vilnius','Lithuania','LT',54.6872,25.2797,'Europe/Vilnius'),
('klaipeda-lt','Klaipėda','Lithuania','LT',55.7033,21.1443,'Europe/Vilnius'),
('rotterdam-nl','Rotterdam','Netherlands','NL',51.9244,4.4777,'Europe/Amsterdam'),
('amsterdam-nl','Amsterdam','Netherlands','NL',52.3676,4.9041,'Europe/Amsterdam');

create table app.transport_requests (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references app.profiles(id) on delete restrict,
  status text not null default 'draft' check (status in ('draft','active','booked','completed','closed')),
  moderation_status text not null default 'normal' check (moderation_status in ('normal','hidden','removed')),
  visibility text not null check (visibility in ('marketplace','targeted')),
  target_carrier_id uuid references app.carriers(id) on delete restrict,
  -- Reserved architecture column. No route table or route persistence in Phase 2.
  -- A future supply migration must install its FK before lifting this NULL guard.
  target_route_id uuid check (target_route_id is null),
  default_pickup_location_id uuid not null references app.public_locations(id) on delete restrict,
  default_delivery_location_id uuid not null references app.public_locations(id) on delete restrict,
  pickup_kind text not null check (pickup_kind in ('anytime','single','range','flexible')),
  pickup_from date,
  pickup_to date,
  pickup_flexible_option text,
  pickup_anchor_date date,
  notes text not null default '' check (notes=btrim(notes) and length(notes)<=4000),
  budget_amount numeric(12,2),
  budget_currency char(3),
  request_version integer not null default 1 check (request_version>0),
  terms_version text,
  terms_accepted_at timestamptz,
  published_at timestamptz,
  closed_at timestamptz,
  client_publish_key uuid not null,
  created_at timestamptz not null default transaction_timestamp(),
  updated_at timestamptz not null default transaction_timestamp(),
  unique(customer_id,client_publish_key),
  constraint request_targets check ((visibility='marketplace' and target_carrier_id is null and target_route_id is null)
    or (visibility='targeted' and target_carrier_id is not null)),
  constraint request_locations check (default_pickup_location_id<>default_delivery_location_id),
  constraint request_budget check ((budget_amount is null and budget_currency is null)
    or (budget_amount is not null and budget_amount>0 and budget_currency is not null and budget_currency='EUR')),
  constraint request_dates check (
    (pickup_kind='anytime' and pickup_from is null and pickup_to is null and pickup_flexible_option is null and pickup_anchor_date is null)
    or (pickup_kind in ('single','range') and pickup_from is not null and pickup_to is not null
      and pickup_from<=pickup_to and (pickup_kind='range' or pickup_from=pickup_to)
      and pickup_flexible_option is null and pickup_anchor_date is null)
    or (pickup_kind='flexible' and pickup_from is not null and pickup_to is not null and pickup_from<=pickup_to
      and pickup_anchor_date is not null and pickup_from=pickup_anchor_date and pickup_flexible_option is not null
      and pickup_flexible_option in ('next-week','next-two-weeks','this-month'))),
  constraint request_publication check (status='draft' or (published_at is not null and terms_accepted_at is not null and terms_version is not null)),
  constraint request_closed check ((status='closed')=(closed_at is not null))
);
create index requests_customer on app.transport_requests(customer_id,created_at desc,id);
create index requests_marketplace on app.transport_requests(published_at desc,id) where status='active' and visibility='marketplace' and moderation_status='normal';
create index requests_target on app.transport_requests(target_carrier_id,status,published_at desc,id);
create index requests_pickup on app.transport_requests(default_pickup_location_id);
create index requests_delivery on app.transport_requests(default_delivery_location_id);
alter table app.transport_requests enable row level security;

create table app.request_vehicles (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references app.transport_requests(id) on delete restrict,
  position smallint not null check (position between 1 and 10),
  category text not null check (category in ('car','suv','van','motorcycle')),
  make text not null check (make=btrim(make) and length(make) between 1 and 100),
  model text not null check (model=btrim(model) and length(model) between 1 and 100),
  year smallint check (year between 1886 and 9999),
  condition text not null check (condition in ('running','non_running')),
  rolling_ability text,
  pickup_location_id uuid not null references app.public_locations(id) on delete restrict,
  delivery_location_id uuid not null references app.public_locations(id) on delete restrict,
  uses_default_route boolean not null default true,
  removed_at timestamptz,
  created_at timestamptz not null default transaction_timestamp(),
  updated_at timestamptz not null default transaction_timestamp(),
  constraint vehicle_rolling check ((condition='running' and rolling_ability is null)
    or (condition='non_running' and rolling_ability is not null and rolling_ability in ('yes','no','unknown'))),
  constraint vehicle_locations check (pickup_location_id<>delivery_location_id)
);
create unique index request_vehicle_position on app.request_vehicles(request_id,position) where removed_at is null;
create index request_vehicle_pickup on app.request_vehicles(pickup_location_id);
create index request_vehicle_delivery on app.request_vehicles(delivery_location_id);
alter table app.request_vehicles enable row level security;

create table app.request_vehicle_private_details (
  vehicle_id uuid not null references app.request_vehicles(id) on delete restrict,
  side text not null check (side in ('pickup','delivery')),
  street text check (street=btrim(street) and length(street) between 1 and 300),
  postcode text check (postcode=btrim(postcode) and length(postcode) between 1 and 32),
  city text check (city=btrim(city) and length(city) between 1 and 200),
  country_code char(2) check (country_code ~ '^[A-Z]{2}$'),
  instructions text check (instructions=btrim(instructions) and length(instructions) between 1 and 4000),
  contact_name text check (contact_name=btrim(contact_name) and length(contact_name) between 1 and 200),
  contact_phone text check (contact_phone ~ '^\+[1-9][0-9]{1,14}$'),
  contact_email text check (length(contact_email)<=254 and contact_email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'),
  created_at timestamptz not null default transaction_timestamp(),
  updated_at timestamptz not null default transaction_timestamp(),
  primary key(vehicle_id,side)
);
alter table app.request_vehicle_private_details enable row level security;

create table app.request_revisions (
  request_id uuid not null references app.transport_requests(id) on delete restrict,
  version integer not null check (version>0),
  changed_by uuid not null references app.profiles(id) on delete restrict,
  snapshot_schema_version smallint not null default 1 check (snapshot_schema_version=1),
  public_terms_snapshot jsonb not null check (jsonb_typeof(public_terms_snapshot)='object' and octet_length(public_terms_snapshot::text)<=131072
    and public_terms_snapshot - array['pickup','vehicles','visibility','target_carrier_id','budget_amount','budget_currency']::text[]='{}'::jsonb),
  created_at timestamptz not null default transaction_timestamp(),
  primary key(request_id,version)
);
create index request_revision_actor on app.request_revisions(changed_by);
alter table app.request_revisions enable row level security;
create trigger request_revisions_immutable before update or delete or truncate on app.request_revisions
for each statement execute function private.guard_audit();
create function private.guard_request_identity() returns trigger
language plpgsql set search_path='' as $$
begin
  if new.id<>old.id or new.customer_id<>old.customer_id or new.client_publish_key<>old.client_publish_key then
    raise exception 'Request identity is immutable' using errcode='23514';
  end if;
  return new;
end;
$$;
revoke execute on function private.guard_request_identity() from public,anon,authenticated,service_role;
create trigger request_identity before update on app.transport_requests
for each row execute function private.guard_request_identity();
create trigger request_timestamps before insert or update on app.transport_requests for each row execute function private.set_timestamps();
create trigger request_vehicle_timestamps before insert or update on app.request_vehicles for each row execute function private.set_timestamps();
create trigger request_private_timestamps before insert or update on app.request_vehicle_private_details for each row execute function private.set_timestamps();

-- Caller-scoped helpers; no arbitrary customer lookup or recursive RLS.
create function private.owns_request(target uuid) returns boolean
language sql stable security definer set search_path=''
begin atomic
  select exists(select 1 from app.transport_requests where id=target and customer_id=auth.uid());
end;
revoke execute on function private.owns_request(uuid) from public,anon,authenticated,service_role;
grant execute on function private.owns_request(uuid) to authenticated,parvezk_commands;
create function private.can_read_request(target uuid) returns boolean
language sql stable security definer set search_path=''
begin atomic
  select exists(select 1 from app.transport_requests r where r.id=target and
    (r.customer_id=auth.uid() or (r.status='active' and r.moderation_status='normal' and exists (
      select 1 from app.carrier_memberships m where m.user_id=auth.uid() and m.active and m.role='owner'
        and (r.visibility='marketplace' or m.carrier_id=r.target_carrier_id)))));
end;
revoke execute on function private.can_read_request(uuid) from public,anon,authenticated,service_role;
grant execute on function private.can_read_request(uuid) to authenticated;
grant select,update on app.transport_requests to parvezk_authorization;
grant select on app.request_vehicles,app.request_revisions to parvezk_authorization;
create policy requests_authorization on app.transport_requests to parvezk_authorization using(true) with check(true);
create policy vehicles_authorization on app.request_vehicles for select to parvezk_authorization using(true);
create policy revisions_authorization on app.request_revisions for select to parvezk_authorization using(true);

create policy requests_read on app.transport_requests for select to authenticated using(private.can_read_request(id));
create policy vehicles_read on app.request_vehicles for select to authenticated using
  (private.owns_request(request_id) or (removed_at is null and private.can_read_request(request_id)));
create policy request_private_read on app.request_vehicle_private_details for select to authenticated using
  (exists(select 1 from app.request_vehicles v where v.id=vehicle_id and private.owns_request(v.request_id)));
create policy revisions_read on app.request_revisions for select to authenticated using(private.owns_request(request_id));

-- No customer ID, publish key, terms evidence or private address in carrier-readable columns.
grant select(id,status,moderation_status,visibility,target_carrier_id,default_pickup_location_id,default_delivery_location_id,
  pickup_kind,pickup_from,pickup_to,pickup_flexible_option,pickup_anchor_date,notes,budget_amount,budget_currency,request_version,published_at,created_at)
  on app.transport_requests to authenticated;
grant select on app.request_vehicles,app.request_vehicle_private_details,app.request_revisions to authenticated;
create view api.my_requests with(security_invoker=true) as
select id,status,visibility,default_pickup_location_id,default_delivery_location_id,pickup_kind,pickup_from,pickup_to,
  pickup_flexible_option,pickup_anchor_date,notes,budget_amount,budget_currency,request_version,published_at,created_at
from app.transport_requests where private.owns_request(id);
create view api.marketplace_requests with(security_invoker=true) as
select id,visibility,target_carrier_id,default_pickup_location_id,default_delivery_location_id,pickup_kind,pickup_from,pickup_to,
  pickup_flexible_option,pickup_anchor_date,notes,budget_amount,budget_currency,request_version,published_at
from app.transport_requests where status='active' and moderation_status='normal';
create view api.my_request_vehicles with(security_invoker=true) as
select id,request_id,position,category,make,model,year,condition,rolling_ability,pickup_location_id,delivery_location_id,uses_default_route
from app.request_vehicles where removed_at is null and private.owns_request(request_id);
create view api.request_vehicles with(security_invoker=true) as
select id,request_id,position,category,make,model,year,condition,rolling_ability,pickup_location_id,delivery_location_id
from app.request_vehicles where removed_at is null;
create view api.my_request_private_details with(security_invoker=true) as
select vehicle_id,side,street,postcode,city,country_code,instructions,contact_name,contact_phone,contact_email
from app.request_vehicle_private_details;
grant select on api.my_requests,api.marketplace_requests,api.my_request_vehicles,api.request_vehicles,api.my_request_private_details to authenticated;

-- Commands are the sole application writers; their RLS remains owner scoped.
grant select,insert on app.transport_requests,app.request_vehicles,app.request_vehicle_private_details,app.request_revisions to parvezk_commands;
grant select on app.public_locations to parvezk_commands;
create policy request_catalog on app.public_locations for select to parvezk_commands using(true);
create policy requests_command on app.transport_requests to parvezk_commands using(customer_id=(select auth.uid())) with check(customer_id=(select auth.uid()));
create policy vehicles_command on app.request_vehicles to parvezk_commands using(private.owns_request(request_id)) with check(private.owns_request(request_id));
create policy private_details_command on app.request_vehicle_private_details to parvezk_commands
using(exists(select 1 from app.request_vehicles v where v.id=vehicle_id and private.owns_request(v.request_id)))
with check(exists(select 1 from app.request_vehicles v where v.id=vehicle_id and private.owns_request(v.request_id)));
create policy revisions_command on app.request_revisions to parvezk_commands using(private.owns_request(request_id)) with check(private.owns_request(request_id));

create function private.lock_request_vehicle() returns trigger
language plpgsql security definer set search_path='' as $$
begin
  if tg_op='UPDATE' and (new.id<>old.id or new.request_id<>old.request_id) then
    raise exception 'Vehicle identity is immutable' using errcode='23514';
  end if;
  perform 1 from app.transport_requests where id=case when tg_op='DELETE' then old.request_id else new.request_id end for update;
  return case when tg_op='DELETE' then old else new end;
end;
$$;
revoke execute on function private.lock_request_vehicle() from public,anon,authenticated,service_role;
create trigger request_vehicle_parent_lock before insert or update or delete on app.request_vehicles
for each row execute function private.lock_request_vehicle();
create function private.require_complete_request() returns trigger
language plpgsql security definer set search_path='' as $$
declare target uuid; parent app.transport_requests%rowtype; total integer;
begin
  if tg_table_name='transport_requests' then target:=new.id;
  else target:=case when tg_op='DELETE' then old.request_id else new.request_id end; end if;
  select * into parent from app.transport_requests where id=target for update;
  if found and parent.status<>'draft' then
    select count(*) into total from app.request_vehicles where request_id=target and removed_at is null;
    if total not between 1 and 10 or not exists(select 1 from app.request_revisions where request_id=target and version=parent.request_version) then
      raise exception 'Published request requires vehicles and its current revision' using errcode='23514';
    end if;
  end if;
  return null;
end;
$$;
revoke execute on function private.require_complete_request() from public,anon,authenticated,service_role;
create constraint trigger complete_request after insert or update on app.transport_requests deferrable initially deferred
for each row execute function private.require_complete_request();
create constraint trigger complete_request_vehicles after insert or update or delete on app.request_vehicles deferrable initially deferred
for each row execute function private.require_complete_request();

alter table app.audit_log drop constraint audit_action;
alter table app.audit_log add constraint audit_action check(action in ('carrier.created','carrier.updated','carrier.owner_transferred',
'carrier.verification_changed','profile.updated','profile.beta_access','platform_role.bootstrap','request.published'));
alter table app.audit_log drop constraint audit_entity;
alter table app.audit_log add constraint audit_entity check(entity_type in ('profile','carrier','platform_role','request'));

-- Publication payload has no owner/status/version/authority fields. Unknown keys fail closed.
create function api.publish_request(p_payload jsonb,p_client_publish_key uuid) returns uuid
language plpgsql security definer set search_path='' set lock_timeout='5s' set statement_timeout='15s' as $$
declare
  caller uuid; result uuid; profile app.profiles%rowtype; v jsonb; n integer:=0; vehicle_id uuid;
  pickup uuid; delivery uuid; default_pickup uuid; default_delivery uuid;
  kind text; date_from date; date_to date; option text; anchor date;
  today date:=(statement_timestamp() at time zone 'Europe/Vilnius')::date;
  snapshot_vehicles jsonb:='[]'::jsonb;
begin
  caller:=private.require_active_user(true);
  select * into profile from app.profiles where id=caller;
  if profile.phone_verified_at is null or profile.phone_e164 is null then
    raise exception 'Verified phone required' using errcode='42501';
  end if;
  if p_client_publish_key is null then raise exception 'Publish key required' using errcode='22023'; end if;
  -- Profile lock serializes retries. The first committed payload wins for this key.
  select id into result from app.transport_requests where customer_id=caller and client_publish_key=p_client_publish_key;
  if found then return result; end if;
  if p_payload is null or jsonb_typeof(p_payload)<>'object' or octet_length(p_payload::text)>131072
    or p_payload - array['name','email','phone','terms_version','pickup','from','to','notes','budget_amount','budget_currency','vehicles','private_pickup','private_delivery']::text[]<>'{}'::jsonb
    or not (p_payload ?& array['name','email','phone','terms_version','pickup','from','to','vehicles']) then
    raise exception 'Invalid publication payload' using errcode='22023';
  end if;
  if p_payload->>'phone' is distinct from profile.phone_e164 then
    raise exception 'Verify the current contact phone' using errcode='42501';
  end if;
  if p_payload->>'terms_version' is distinct from '2026-09-24' or nullif(btrim(p_payload->>'name'),'') is null
    or nullif(btrim(p_payload->>'email'),'') is null then
    raise exception 'Contact and current terms required' using errcode='22023';
  end if;
  if p_payload->>'budget_amount' is not null and ((p_payload->>'budget_amount')::numeric<>round((p_payload->>'budget_amount')::numeric,2)
    or (p_payload->>'budget_amount')::numeric<=0 or (p_payload->>'budget_amount')::numeric>=10000000000) then
    raise exception 'Invalid budget amount' using errcode='22023';
  end if;
  if jsonb_typeof(p_payload->'vehicles') is distinct from 'array' then raise exception 'Vehicles required' using errcode='22023'; end if;
  if jsonb_array_length(p_payload->'vehicles') not between 1 and 10 then raise exception 'Require 1 to 10 vehicles' using errcode='22023'; end if;
  if length(coalesce(p_payload->>'private_pickup',''))>4000 or length(coalesce(p_payload->>'private_delivery',''))>4000 then
    raise exception 'Private instructions too long' using errcode='22023';
  end if;
  if jsonb_typeof(p_payload->'pickup') is distinct from 'object'
    or (p_payload->'pickup')-array['kind','from','to','option']::text[]<>'{}'::jsonb then
    raise exception 'Invalid pickup window' using errcode='22023';
  end if;
  kind:=p_payload#>>'{pickup,kind}';
  date_from:=(p_payload#>>'{pickup,from}')::date; date_to:=(p_payload#>>'{pickup,to}')::date;
  option:=p_payload#>>'{pickup,option}';
  if kind='flexible' then
    if date_from is not null or date_to is not null then raise exception 'Flexible dates are server resolved' using errcode='22023'; end if;
    anchor:=today; date_from:=today;
    date_to:=case option when 'next-week' then today+7 when 'next-two-weeks' then today+14
      when 'this-month' then (date_trunc('month',today)+interval '1 month - 1 day')::date end;
  end if;
  select id into default_pickup from app.public_locations where slug=p_payload->>'from';
  select id into default_delivery from app.public_locations where slug=p_payload->>'to';
  if default_pickup is null or default_delivery is null then raise exception 'Unknown locality' using errcode='22023'; end if;
  -- Profile completion and its audit are part of this same transaction.
  perform api.update_my_profile(btrim(p_payload->>'name'),btrim(p_payload->>'email'),profile.preferred_locale);
  insert into app.transport_requests(customer_id,status,visibility,default_pickup_location_id,default_delivery_location_id,
    pickup_kind,pickup_from,pickup_to,pickup_flexible_option,pickup_anchor_date,notes,budget_amount,budget_currency,
    terms_version,terms_accepted_at,published_at,client_publish_key)
  values(caller,'active','marketplace',default_pickup,default_delivery,kind,date_from,date_to,option,anchor,
    btrim(coalesce(p_payload->>'notes','')),(p_payload->>'budget_amount')::numeric,p_payload->>'budget_currency',
    '2026-09-24',transaction_timestamp(),transaction_timestamp(),p_client_publish_key) returning id into result;
  for v in select value from jsonb_array_elements(p_payload->'vehicles') loop
    n:=n+1;
    if jsonb_typeof(v)<>'object' or v-array['category','make','model','year','condition','rolling_ability','pickup','delivery','uses_default_route']::text[]<>'{}'::jsonb
      or not(v ?& array['category','make','model','condition','pickup','delivery','uses_default_route']) then
      raise exception 'Invalid vehicle' using errcode='22023';
    end if;
    if (v->>'year')::integer>extract(year from today)::integer+1 then raise exception 'Invalid vehicle year' using errcode='22023'; end if;
    select id into pickup from app.public_locations where slug=v->>'pickup';
    select id into delivery from app.public_locations where slug=v->>'delivery';
    if pickup is null or delivery is null then raise exception 'Unknown vehicle locality' using errcode='22023'; end if;
    if (v->>'uses_default_route')::boolean and (pickup<>default_pickup or delivery<>default_delivery) then
      raise exception 'Default route mismatch' using errcode='22023';
    end if;
    insert into app.request_vehicles(request_id,position,category,make,model,year,condition,rolling_ability,pickup_location_id,delivery_location_id,uses_default_route)
    values(result,n,v->>'category',btrim(v->>'make'),btrim(v->>'model'),(v->>'year')::smallint,v->>'condition',v->>'rolling_ability',pickup,delivery,(v->>'uses_default_route')::boolean)
    returning id into vehicle_id;
    if (v->>'uses_default_route')::boolean then
      insert into app.request_vehicle_private_details(vehicle_id,side,instructions)
      select vehicle_id,side,instructions from (values
        ('pickup',nullif(btrim(p_payload->>'private_pickup'),'')),
        ('delivery',nullif(btrim(p_payload->>'private_delivery'),''))) as details(side,instructions)
      where instructions is not null;
    end if;
    snapshot_vehicles:=snapshot_vehicles||jsonb_build_array(jsonb_build_object('id',vehicle_id,'position',n,'category',v->>'category',
      'make',btrim(v->>'make'),'model',btrim(v->>'model'),'year',(v->>'year')::integer,'condition',v->>'condition',
      'rolling_ability',v->>'rolling_ability','pickup_location_id',pickup,'delivery_location_id',delivery));
  end loop;
  insert into app.request_revisions(request_id,version,changed_by,public_terms_snapshot)
  values(result,1,caller,jsonb_build_object('pickup',jsonb_build_object('kind',kind,'from',date_from,'to',date_to,'option',option,'anchor',anchor),
    'vehicles',snapshot_vehicles,'visibility','marketplace','target_carrier_id',null,
    'budget_amount',(p_payload->>'budget_amount')::numeric,'budget_currency',p_payload->>'budget_currency'));
  insert into app.audit_log(actor_id,action,entity_type,entity_id,correlation_id,change_summary)
  values(caller,'request.published','request',result,p_client_publish_key,'{"fields":["request","vehicles","locations","terms"]}');
  return result;
end;
$$;
revoke execute on function api.publish_request(jsonb,uuid) from public,anon,authenticated,service_role;
grant execute on function api.publish_request(jsonb,uuid) to authenticated;

-- Use the same temporary ownership-transfer protocol as the locked foundation.
grant parvezk_commands,parvezk_authorization to current_user with inherit false;
grant parvezk_commands,parvezk_authorization to current_user with set true;
grant create on schema api to parvezk_commands;
grant create on schema private to parvezk_authorization;
alter function api.publish_request(jsonb,uuid) owner to parvezk_commands;
alter function private.owns_request(uuid) owner to parvezk_authorization;
alter function private.can_read_request(uuid) owner to parvezk_authorization;
alter function private.lock_request_vehicle() owner to parvezk_authorization;
alter function private.require_complete_request() owner to parvezk_authorization;
revoke create on schema api from parvezk_commands;
revoke create on schema private from parvezk_authorization;
revoke set option for parvezk_commands,parvezk_authorization from current_user;
commit;
