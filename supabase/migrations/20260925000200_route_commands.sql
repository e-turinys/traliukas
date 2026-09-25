begin;

-- Closed-beta policy approved 2026-09-25. Admission is the existing trusted
-- profile.beta_access + carrier public eligibility (visibility='published').
-- No verification category, insurance or capability is a publication gate.
create function private.require_route_carrier(p_route_id uuid default null,p_carrier_slug text default null) returns uuid
language plpgsql set search_path='' as $$
declare caller uuid; carrier uuid; candidates uuid[];
begin
  caller:=private.require_active_user(true);
  if p_route_id is null then
    select array_agg(c.id) into candidates from app.carriers c
      join app.carrier_memberships m on m.carrier_id=c.id
      where m.user_id=caller and m.active and m.role='owner'
        and c.visibility='published' and c.suspended_at is null
        and (p_carrier_slug is null or c.slug=p_carrier_slug);
    if coalesce(cardinality(candidates),0)<>1 then
      raise exception 'One admitted Carrier required' using errcode='42501';
    end if;
    carrier:=candidates[1];
  else
    select carrier_id into carrier from app.carrier_routes where id=p_route_id;
  end if;
  -- Lock order is profile -> carrier -> route. Membership changes also lock
  -- the carrier; recheck ownership AFTER acquiring its lock.
  perform 1 from app.carriers where id=carrier and visibility='published' and suspended_at is null for update;
  if not found or not private.is_carrier_owner(carrier) then
    raise exception 'Not authorized' using errcode='42501';
  end if;
  perform 1 from app.carrier_private_details where carrier_id=carrier
    and length(btrim(legal_name))>0 and business_kind in ('individual','company')
    and registration_country ~ '^[A-Z]{2}$' for share;
  if not found then raise exception 'Carrier legal profile required' using errcode='42501'; end if;
  return carrier;
end;
$$;
revoke execute on function private.require_route_carrier(uuid,text) from public,anon,authenticated,service_role;
grant execute on function private.require_route_carrier(uuid,text) to parvezk_commands;

alter table app.audit_log drop constraint audit_action;
alter table app.audit_log add constraint audit_action check(action in ('carrier.created','carrier.updated','carrier.owner_transferred',
'carrier.verification_changed','profile.updated','profile.beta_access','platform_role.bootstrap','request.published',
'route.created','route.updated','carrierRoute.published','route.closed'));
alter table app.audit_log drop constraint audit_entity;
alter table app.audit_log add constraint audit_entity check(entity_type in ('profile','carrier','platform_role','request','route'));
-- A publication boundary is recorded transactionally with the immutable revision.
-- Distribution jobs/providers, Notifications and the later cross-domain outbox
-- remain deferred. Creation retries use the existing append-only audit identity.
create unique index route_creation_retry on app.audit_log(actor_id,correlation_id) where action='route.created';
grant select on app.audit_log to parvezk_commands;
create policy route_retry_read on app.audit_log for select to parvezk_commands
using(actor_id=(select auth.uid()) and action='route.created');

create function api.save_route(p_payload jsonb,p_publish boolean,p_route_id uuid default null,
  p_expected_version integer default null,p_create_key uuid default null,p_carrier_slug text default null) returns uuid
language plpgsql security definer set search_path='' set lock_timeout='5s' set statement_timeout='15s' as $$
declare
  carrier uuid; caller uuid; result uuid; parent app.carrier_routes%rowtype;
  places uuid[]; categories text[]; start_date date; end_date date; total integer;
  snapshot jsonb; previous jsonb; version integer; was_published boolean:=false; changed boolean:=true;
begin
  carrier:=private.require_route_carrier(p_route_id,p_carrier_slug);
  caller:=private.request_user_id();
  if p_route_id is null then
    if p_create_key is null then raise exception 'Creation key required' using errcode='22023'; end if;
    select entity_id into result from app.audit_log where actor_id=caller and correlation_id=p_create_key and action='route.created';
    if found then
      if not private.owns_route(result) then raise exception 'Not authorized' using errcode='42501'; end if;
      return result;
    end if;
  else
    select * into parent from app.carrier_routes where id=p_route_id for update;
    if not found or parent.carrier_id<>carrier or parent.status not in ('draft','published') or parent.moderation_status<>'normal' then
      raise exception 'Route unavailable' using errcode='42501';
    end if;
    if p_expected_version is distinct from parent.route_version then raise exception 'Route changed; reload' using errcode='40001'; end if;
    was_published:=parent.published_at is not null;
  end if;
  if p_publish is null or p_payload is null or jsonb_typeof(p_payload)<>'object' or octet_length(p_payload::text)>32768
    or not(p_payload ?& array['stops','date_from','date_to','capacity_total','supported_categories','supports_non_running','route_flexible','accepting_new_requests'])
    or p_payload - array['stops','date_from','date_to','capacity_total','supported_categories','supports_non_running','route_flexible','accepting_new_requests']::text[]<>'{}'::jsonb then
    raise exception 'Invalid Route payload' using errcode='22023';
  end if;
  if jsonb_typeof(p_payload->'stops') is distinct from 'array'
    or jsonb_typeof(p_payload->'supported_categories') is distinct from 'array'
    or jsonb_typeof(p_payload->'supports_non_running') is distinct from 'boolean'
    or jsonb_typeof(p_payload->'route_flexible') is distinct from 'boolean'
    or jsonb_typeof(p_payload->'accepting_new_requests') is distinct from 'boolean'
    or jsonb_typeof(p_payload->'capacity_total') is distinct from 'number'
    or (p_payload->>'capacity_total') !~ '^[1-9][0-9]{0,8}$'
    or jsonb_typeof(p_payload->'date_from') is distinct from 'string'
    or jsonb_typeof(p_payload->'date_to') is distinct from 'string'
    or (p_payload->>'date_from') !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'
    or (p_payload->>'date_to') !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' then
    raise exception 'Invalid Route fields' using errcode='22023';
  end if;
  if jsonb_array_length(p_payload->'stops') not between 2 and 32
    or jsonb_array_length(p_payload->'supported_categories') not between 1 and 4
    or exists(select 1 from jsonb_array_elements(p_payload->'stops') s where jsonb_typeof(s)<>'string')
    or exists(select 1 from jsonb_array_elements(p_payload->'supported_categories') c where jsonb_typeof(c)<>'string') then
    raise exception 'Invalid stops or categories' using errcode='22023';
  end if;
  select array_agg(l.id order by s.ordinality) into places
    from jsonb_array_elements_text(p_payload->'stops') with ordinality s(slug,ordinality)
    left join app.public_locations l on l.slug=s.slug;
  if array_position(places,null) is not null or places[1]=places[cardinality(places)] then
    raise exception 'Choose distinct public endpoints' using errcode='22023';
  end if;
  select array_agg(c order by c) into categories from jsonb_array_elements_text(p_payload->'supported_categories') c;
  start_date:=(p_payload->>'date_from')::date; end_date:=(p_payload->>'date_to')::date;
  total:=(p_payload->>'capacity_total')::integer;
  if start_date>end_date or not isfinite(start_date) or not isfinite(end_date)
    or ((p_publish or was_published) and end_date<(clock_timestamp() at time zone 'Europe/Vilnius')::date) then
    raise exception 'Invalid Route dates' using errcode='22023';
  end if;
  snapshot:=jsonb_build_object('stops',to_jsonb(places),'date_from',start_date,'date_to',end_date,
    'capacity_total',total,'supported_categories',categories,'supports_non_running',p_payload->'supports_non_running','route_flexible',p_payload->'route_flexible');
  if was_published then
    select rr.public_terms_snapshot into previous from app.route_revisions rr where rr.route_id=p_route_id and rr.version=parent.route_version;
    changed:=previous is distinct from snapshot or parent.accepting_new_requests is distinct from (p_payload->>'accepting_new_requests')::boolean;
  end if;
  version:=case when was_published then parent.route_version+changed::integer else 1 end;
  if p_route_id is null then
    insert into app.carrier_routes(carrier_id,status,date_from,date_to,capacity_total,supported_categories,supports_non_running,route_flexible,accepting_new_requests,published_at)
    values(carrier,case when p_publish then 'published' else 'draft' end,start_date,end_date,total,categories,
      (p_payload->>'supports_non_running')::boolean,(p_payload->>'route_flexible')::boolean,(p_payload->>'accepting_new_requests')::boolean,
      case when p_publish then transaction_timestamp() end) returning id into result;
  else
    result:=p_route_id;
    update app.carrier_routes set status=case when p_publish or was_published then 'published' else 'draft' end,
      date_from=start_date,date_to=end_date,capacity_total=total,supported_categories=categories,
      supports_non_running=(p_payload->>'supports_non_running')::boolean,route_flexible=(p_payload->>'route_flexible')::boolean,
      accepting_new_requests=(p_payload->>'accepting_new_requests')::boolean,route_version=version,
      published_at=case when p_publish then coalesce(published_at,transaction_timestamp()) else published_at end where id=result;
    delete from app.route_stops where route_id=result;
  end if;
  insert into app.route_stops(route_id,position,location_id)
    select result,(ordinality-1)::smallint,location from unnest(places) with ordinality p(location,ordinality);
  if (p_publish or was_published) and (not was_published or changed) then
    insert into app.route_revisions(route_id,version,changed_by,public_terms_snapshot) values(result,version,caller,snapshot);
  end if;
  insert into app.audit_log(actor_id,action,entity_type,entity_id,correlation_id,change_summary)
    values(caller,case when p_route_id is null then 'route.created' else 'route.updated' end,'route',result,
      case when p_route_id is null then p_create_key else gen_random_uuid() end,'{"fields":["route","stops","capacity_total"]}');
  if p_publish and not was_published then
    insert into app.audit_log(actor_id,action,entity_type,entity_id,correlation_id,change_summary)
      values(caller,'carrierRoute.published','route',result,gen_random_uuid(),'{"fields":["status","route_version","public_terms_snapshot"]}');
  end if;
  return result;
end;
$$;
revoke execute on function api.save_route(jsonb,boolean,uuid,integer,uuid,text) from public,anon,authenticated,service_role;
grant execute on function api.save_route(jsonb,boolean,uuid,integer,uuid,text) to authenticated;

create function api.close_route(p_route_id uuid,p_expected_version integer) returns uuid
language plpgsql security definer set search_path='' set lock_timeout='5s' as $$
declare carrier uuid; parent app.carrier_routes%rowtype;
begin
  carrier:=private.require_route_carrier(p_route_id);
  select * into parent from app.carrier_routes where id=p_route_id for update;
  if not found or parent.carrier_id<>carrier or parent.moderation_status<>'normal' then raise exception 'Not authorized' using errcode='42501'; end if;
  if parent.status='cancelled' then return p_route_id; end if;
  if p_expected_version is distinct from parent.route_version then raise exception 'Route changed; reload' using errcode='40001'; end if;
  update app.carrier_routes set status='cancelled',accepting_new_requests=false where id=p_route_id;
  insert into app.audit_log(actor_id,action,entity_type,entity_id,correlation_id,change_summary)
    values(private.request_user_id(),'route.closed','route',p_route_id,gen_random_uuid(),'{"fields":["status","accepting_new_requests"]}');
  return p_route_id;
end;
$$;
revoke execute on function api.close_route(uuid,integer) from public,anon,authenticated,service_role;
grant execute on function api.close_route(uuid,integer) to authenticated;

-- FK readiness only: Phase 2 targeted Request publication stays separately gated.
alter table app.transport_requests add constraint request_target_route_fk foreign key(target_route_id) references app.carrier_routes(id) on delete restrict;
create index request_target_route on app.transport_requests(target_route_id);

grant parvezk_commands to current_user with inherit false;
grant parvezk_commands to current_user with set true;
grant create on schema api to parvezk_commands;
alter function api.save_route(jsonb,boolean,uuid,integer,uuid,text) owner to parvezk_commands;
alter function api.close_route(uuid,integer) owner to parvezk_commands;
revoke create on schema api from parvezk_commands;
revoke set option for parvezk_commands from current_user;
commit;
