begin;

create table app.carrier_routes (
  id uuid primary key default gen_random_uuid(),
  carrier_id uuid not null references app.carriers(id) on delete restrict,
  status text not null default 'draft' check (status in ('draft','published','expired','cancelled')),
  moderation_status text not null default 'normal' check (moderation_status in ('normal','hidden','removed')),
  date_from date not null,
  date_to date not null,
  capacity_total integer not null check (capacity_total > 0),
  capacity_reserved integer not null default 0 check (capacity_reserved >= 0 and capacity_reserved <= capacity_total),
  accepting_new_requests boolean not null default true,
  supported_categories text[] not null,
  supports_non_running boolean not null default false,
  route_flexible boolean not null default false,
  route_version integer not null default 1 check (route_version > 0),
  published_at timestamptz,
  created_at timestamptz not null default transaction_timestamp(),
  updated_at timestamptz not null default transaction_timestamp(),
  constraint route_dates check (isfinite(date_from) and isfinite(date_to) and date_from <= date_to),
  constraint route_categories check (cardinality(supported_categories) between 1 and 4
    and array_ndims(supported_categories)=1 and array_position(supported_categories,null) is null
    and supported_categories <@ array['car','suv','van','motorcycle']::text[]),
  constraint route_publication check (status not in ('published','expired') or published_at is not null)
);
alter table app.carrier_routes enable row level security;
create index routes_public_date on app.carrier_routes(date_from,id) where status='published' and moderation_status='normal';
create index routes_carrier on app.carrier_routes(carrier_id,status,date_from,id);

create table app.route_stops (
  id uuid primary key default gen_random_uuid(),
  route_id uuid not null references app.carrier_routes(id) on delete restrict,
  position smallint not null check (position >= 0),
  location_id uuid not null references app.public_locations(id) on delete restrict,
  created_at timestamptz not null default transaction_timestamp(),
  updated_at timestamptz not null default transaction_timestamp(),
  unique(route_id,position)
);
alter table app.route_stops enable row level security;
create index route_stops_location on app.route_stops(location_id,route_id,position);

create table app.route_revisions (
  route_id uuid not null references app.carrier_routes(id) on delete restrict,
  version integer not null check (version > 0),
  changed_by uuid not null references app.profiles(id) on delete restrict,
  snapshot_schema_version smallint not null default 1 check (snapshot_schema_version=1),
  public_terms_snapshot jsonb not null check (jsonb_typeof(public_terms_snapshot)='object'
    and octet_length(public_terms_snapshot::text)<=32768
    and public_terms_snapshot ?& array['stops','date_from','date_to','supported_categories','supports_non_running','route_flexible','capacity_total']
    and public_terms_snapshot - array['stops','date_from','date_to','supported_categories','supports_non_running','route_flexible','capacity_total']::text[]='{}'::jsonb),
  created_at timestamptz not null default transaction_timestamp(),
  primary key(route_id,version)
);
alter table app.route_revisions enable row level security;
create index route_revision_actor on app.route_revisions(changed_by);
create trigger route_revisions_immutable before update or delete or truncate on app.route_revisions
for each statement execute function private.guard_audit();

create function private.guard_route_identity() returns trigger
language plpgsql set search_path='' as $$
begin
  if tg_op='UPDATE' and (new.id<>old.id or new.carrier_id<>old.carrier_id) then
    raise exception 'Route identity is immutable' using errcode='23514';
  end if;
  if cardinality(new.supported_categories)<>(select count(distinct category) from unnest(new.supported_categories) category) then
    raise exception 'Duplicate category' using errcode='23514';
  end if;
  return new;
end;
$$;
revoke execute on function private.guard_route_identity() from public,anon,authenticated,service_role;
create trigger route_identity before insert or update on app.carrier_routes for each row execute function private.guard_route_identity();
create trigger route_timestamps before insert or update on app.carrier_routes for each row execute function private.set_timestamps();
create trigger route_stop_timestamps before insert or update on app.route_stops for each row execute function private.set_timestamps();

create function private.owns_route(target uuid) returns boolean
language sql stable security definer set search_path=''
begin atomic
  select exists(select 1 from app.carrier_routes where id=target and private.is_carrier_owner(carrier_id));
end;
revoke execute on function private.owns_route(uuid) from public,anon,authenticated,service_role;
grant execute on function private.owns_route(uuid) to authenticated,parvezk_commands;
grant execute on function private.is_carrier_owner(uuid) to parvezk_authorization;

grant select,update on app.carrier_routes to parvezk_authorization;
grant select on app.route_stops,app.route_revisions to parvezk_authorization;
create policy routes_authorization on app.carrier_routes to parvezk_authorization using(true) with check(true);
create policy route_stops_authorization on app.route_stops for select to parvezk_authorization using(true);
create policy route_revisions_authorization on app.route_revisions for select to parvezk_authorization using(true);

create function private.lock_route_stop() returns trigger
language plpgsql security definer set search_path='' as $$
begin
  if tg_op='UPDATE' and (new.id<>old.id or new.route_id<>old.route_id) then
    raise exception 'Stop identity is immutable' using errcode='23514';
  end if;
  perform 1 from app.carrier_routes where id=case when tg_op='DELETE' then old.route_id else new.route_id end for update;
  return case when tg_op='DELETE' then old else new end;
end;
$$;
revoke execute on function private.lock_route_stop() from public,anon,authenticated,service_role;
create trigger route_stop_parent_lock before insert or update or delete on app.route_stops
for each row execute function private.lock_route_stop();

create function private.require_complete_route() returns trigger
language plpgsql security definer set search_path='' as $$
declare target uuid; parent app.carrier_routes%rowtype; locations uuid[]; positions smallint[];
begin
  if tg_table_name='carrier_routes' then target:=new.id;
  else target:=case when tg_op='DELETE' then old.route_id else new.route_id end; end if;
  select * into parent from app.carrier_routes where id=target for update;
  if found then
    select array_agg(location_id order by position),array_agg(position order by position)
      into locations,positions from app.route_stops where route_id=target;
    if coalesce(cardinality(locations),0)<2 or positions[1]<>0
      or positions[cardinality(positions)]<>cardinality(positions)-1
      or locations[1]=locations[cardinality(locations)] then
      raise exception 'Route requires contiguous ordered stops and distinct endpoints' using errcode='23514';
    end if;
    if parent.published_at is not null and not exists(select 1 from app.route_revisions where route_id=target and version=parent.route_version) then
      raise exception 'Published route requires its current revision' using errcode='23514';
    end if;
  end if;
  return null;
end;
$$;
revoke execute on function private.require_complete_route() from public,anon,authenticated,service_role;
create constraint trigger complete_route after insert or update on app.carrier_routes deferrable initially deferred
for each row execute function private.require_complete_route();
create constraint trigger complete_route_stops after insert or update or delete on app.route_stops deferrable initially deferred
for each row execute function private.require_complete_route();

create policy routes_public_read on app.carrier_routes for select to anon,authenticated using
  (status in ('published','expired') and moderation_status='normal' and exists
    (select 1 from app.carriers c where c.id=carrier_id and c.visibility='published' and c.suspended_at is null));
create policy routes_owner_read on app.carrier_routes for select to authenticated using(private.is_carrier_owner(carrier_id));
create policy route_stops_read on app.route_stops for select to anon,authenticated using
  (exists(select 1 from app.carrier_routes r where r.id=route_id));
create policy route_revisions_owner_read on app.route_revisions for select to authenticated using(private.owns_route(route_id));
grant select on app.carrier_routes,app.route_stops to anon,authenticated;
grant select on app.route_revisions to authenticated;

create view api.public_routes with(security_invoker=true) as
select r.id,r.carrier_id,r.status,r.date_from,r.date_to,r.capacity_total,r.capacity_reserved,
  greatest(0,r.capacity_total-r.capacity_reserved) as capacity_available,
  r.accepting_new_requests,r.supported_categories,r.supports_non_running,r.route_flexible,r.route_version,
  r.published_at,r.created_at,r.updated_at
from app.carrier_routes r join api.public_carriers c on c.id=r.carrier_id
where r.status in ('published','expired') and r.moderation_status='normal';
create view api.public_route_stops with(security_invoker=true) as
select s.route_id,s.position,s.location_id from app.route_stops s
join api.public_routes r on r.id=s.route_id;
create view api.my_routes with(security_invoker=true) as
select id,carrier_id,status,moderation_status,date_from,date_to,capacity_total,capacity_reserved,
  accepting_new_requests,supported_categories,supports_non_running,route_flexible,route_version,published_at,created_at,updated_at
from app.carrier_routes where private.is_carrier_owner(carrier_id);
create view api.my_route_stops with(security_invoker=true) as
select route_id,position,location_id from app.route_stops where private.owns_route(route_id);
grant select on api.public_routes,api.public_route_stops to anon,authenticated;
grant select on api.my_routes,api.my_route_stops to authenticated;

grant select,insert,update on app.carrier_routes to parvezk_commands;
grant select,insert,delete on app.route_stops to parvezk_commands;
grant select,insert on app.route_revisions to parvezk_commands;
create policy routes_command on app.carrier_routes to parvezk_commands
using(private.is_carrier_owner(carrier_id)) with check(private.is_carrier_owner(carrier_id));
create policy route_stops_command on app.route_stops to parvezk_commands
using(private.owns_route(route_id)) with check(private.owns_route(route_id));
create policy route_revisions_command on app.route_revisions to parvezk_commands
using(private.owns_route(route_id)) with check(private.owns_route(route_id));

-- Approved Closed Beta policy and Route commands follow in 20260925000200.

grant parvezk_authorization to current_user with inherit false;
grant parvezk_authorization to current_user with set true;
grant create on schema private to parvezk_authorization;
alter function private.owns_route(uuid) owner to parvezk_authorization;
alter function private.lock_route_stop() owner to parvezk_authorization;
alter function private.require_complete_route() owner to parvezk_authorization;
revoke create on schema private from parvezk_authorization;
revoke set option for parvezk_authorization from current_user;

commit;
