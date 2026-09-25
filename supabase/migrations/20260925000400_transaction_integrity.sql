begin;

create function private.guard_commercial_identity() returns trigger
language plpgsql set search_path='' as $$
begin
  if tg_table_name='offers' then
    if (new.id,new.request_id,new.carrier_id,new.route_id,new.created_by,new.created_at)
      is distinct from (old.id,old.request_id,old.carrier_id,old.route_id,old.created_by,old.created_at) then
      raise exception 'Offer identity is immutable' using errcode='23514';
    end if;
  elsif (new.id,new.request_id,new.carrier_id,new.created_at)
    is distinct from (old.id,old.request_id,old.carrier_id,old.created_at) then
    raise exception 'Conversation identity is immutable' using errcode='23514';
  end if;
  return new;
end;
$$;
revoke execute on function private.guard_commercial_identity() from public,anon,authenticated,service_role;
create trigger offer_identity before update on app.offers for each row execute function private.guard_commercial_identity();
create trigger conversation_identity before update on app.conversations for each row execute function private.guard_commercial_identity();

create function private.validate_offer_revision() returns trigger
language plpgsql set search_path='' as $$
begin
  if not exists(select 1 from pg_catalog.pg_timezone_names where name=new.pickup_time_zone)
    or new.expires_at<=clock_timestamp()
    or new.expires_at >= ((new.planned_pickup_date + coalesce(new.pickup_time_from,'00:00'::time)) at time zone new.pickup_time_zone) then
    raise exception 'Invalid Offer validity or pickup timezone' using errcode='23514';
  end if;
  return new;
end;
$$;
revoke execute on function private.validate_offer_revision() from public,anon,authenticated,service_role;
create trigger offer_revision_dates before insert on app.offer_revisions for each row execute function private.validate_offer_revision();

create function private.guard_booking_snapshot() returns trigger
language plpgsql set search_path='' as $$
declare s jsonb:=new.agreement_snapshot; v jsonb; p jsonb;
begin
  if tg_op='UPDATE' then
    if (to_jsonb(new)-array['status','status_version','status_changed_at','completed_at','cancelled_at','capacity_released_at','updated_at']::text[])
      is distinct from (to_jsonb(old)-array['status','status_version','status_changed_at','completed_at','cancelled_at','capacity_released_at','updated_at']::text[]) then
      raise exception 'Booking agreement is immutable' using errcode='23514';
    end if;
    return new;
  end if;
  if not(s ?& array['accepted_at','customer','carrier','request','route','offer','vehicles','total_price','currency','payment_terms','planned_pickup_date','planned_delivery_date'])
    or s-array['accepted_at','customer','carrier','request','route','offer','vehicles','total_price','currency','payment_terms','planned_pickup_date','planned_delivery_date']::text[]<>'{}'::jsonb
    or s->'customer'->>'id' is distinct from new.customer_id::text
    or s->'carrier'->>'id' is distinct from new.carrier_id::text
    or s->'request'->>'id' is distinct from new.request_id::text
    or s->'route'->>'id' is distinct from new.route_id::text
    or s->'offer'->>'id' is distinct from new.accepted_offer_id::text
    or s->'offer'->>'version' is distinct from new.accepted_offer_version::text
    or (s->>'total_price')::numeric is distinct from new.agreed_total_price
    or s->>'currency' is distinct from new.currency::text
    or s->>'payment_terms' is distinct from new.payment_terms
    or s->>'planned_pickup_date' is distinct from new.planned_pickup_date::text
    or s->>'planned_delivery_date' is distinct from new.planned_delivery_date::text
    or jsonb_typeof(s->'vehicles') is distinct from 'array'
    or jsonb_array_length(s->'vehicles')<>new.vehicle_count then
    raise exception 'Invalid Booking snapshot' using errcode='23514';
  end if;
  if jsonb_typeof(s->'customer')<>'object' or (s->'customer')-array['id','display_name']::text[]<>'{}'::jsonb
    or jsonb_typeof(s->'carrier')<>'object' or (s->'carrier')-array['id','display_name','registration_country']::text[]<>'{}'::jsonb
    or jsonb_typeof(s->'request')<>'object' or (s->'request')-array['id','version','pickup']::text[]<>'{}'::jsonb
    or jsonb_typeof(s->'route')<>'object' or (s->'route')-array['id','version','stops']::text[]<>'{}'::jsonb
    or jsonb_typeof(s->'offer')<>'object' or (s->'offer')-array['id','version','pickup_time_zone','pickup_time_from','pickup_time_to','carrier_comment']::text[]<>'{}'::jsonb
    or jsonb_typeof(s->'request'->'pickup') is distinct from 'object'
    or (s->'request'->'pickup')-array['kind','from','to','flexible_option','anchor_date']::text[]<>'{}'::jsonb
    or jsonb_typeof(s->'route'->'stops') is distinct from 'array' then
    raise exception 'Invalid Booking public context' using errcode='23514';
  end if;
  for v in select value from jsonb_array_elements(s->'vehicles') loop
    if jsonb_typeof(v)<>'object'
      or not(v ?& array['id','category','make','model','year','condition','rolling_ability','pickup_location','delivery_location'])
      or v-array['id','category','make','model','year','condition','rolling_ability','pickup_location','delivery_location']::text[]<>'{}'::jsonb then
      raise exception 'Invalid Booking vehicle' using errcode='23514';
    end if;
  end loop;
  for p in select value from jsonb_array_elements(s->'route'->'stops')
    union all select value->'pickup_location' from jsonb_array_elements(s->'vehicles')
    union all select value->'delivery_location' from jsonb_array_elements(s->'vehicles') loop
    if jsonb_typeof(p) is distinct from 'object'
      or not(p ?& array['id','slug','city','country_name','country_code'])
      or p-array['id','slug','city','country_name','country_code','latitude','longitude']::text[]<>'{}'::jsonb then
      raise exception 'Invalid Booking public locality' using errcode='23514';
    end if;
  end loop;
  return new;
end;
$$;
revoke execute on function private.guard_booking_snapshot() from public,anon,authenticated,service_role;
create trigger booking_snapshot before insert or update on app.bookings for each row execute function private.guard_booking_snapshot();

create function private.check_booking_context() returns trigger
language plpgsql security definer set search_path='' as $$
declare b app.bookings%rowtype; r app.transport_requests%rowtype; o app.offers%rowtype; terms app.offer_revisions%rowtype;
begin
  select * into b from app.bookings where id=new.id;
  select * into r from app.transport_requests where id=b.request_id;
  select * into o from app.offers where id=b.accepted_offer_id;
  select * into terms from app.offer_revisions where offer_id=b.accepted_offer_id and version=b.accepted_offer_version;
  if r.customer_id<>b.customer_id or o.route_id<>b.route_id or o.status<>'accepted'
    or o.current_version<>b.accepted_offer_version
    or (terms.total_price,terms.currency,terms.payment_terms,terms.planned_pickup_date,terms.planned_delivery_date)
      is distinct from (b.agreed_total_price,b.currency,b.payment_terms,b.planned_pickup_date,b.planned_delivery_date)
    or (b.agreement_snapshot->'request'->>'version')::integer is distinct from terms.request_version
    or (b.agreement_snapshot->'route'->>'version')::integer is distinct from terms.route_version
    or exists(select 1 from jsonb_array_elements(b.agreement_snapshot->'vehicles') v
      where not exists(select 1 from app.request_vehicles rv where rv.id=(v->>'id')::uuid and rv.request_id=b.request_id))
    or (select count(distinct value->>'id') from jsonb_array_elements(b.agreement_snapshot->'vehicles'))<>b.vehicle_count
    or not exists(select 1 from app.conversations c where c.id=b.conversation_id and c.current_offer_id=b.accepted_offer_id) then
    raise exception 'Booking context mismatch' using errcode='23514';
  end if;
  return null;
end;
$$;
revoke execute on function private.check_booking_context() from public,anon,authenticated,service_role;
create constraint trigger booking_context after insert on app.bookings deferrable initially deferred
  for each row execute function private.check_booking_context();

create function private.reconcile_route_capacity() returns trigger
language plpgsql security definer set search_path='' as $$
declare target uuid; reserved integer; required bigint;
begin
  if tg_table_name='carrier_routes' then target:=new.id;
  else target:=case when tg_op='DELETE' then old.route_id else new.route_id end; end if;
  select capacity_reserved into reserved from app.carrier_routes where id=target for update;
  select coalesce(sum(vehicle_count),0) into required from app.bookings where route_id=target and capacity_released_at is null;
  if reserved is distinct from required then
    raise exception 'Route capacity must reconcile with Bookings' using errcode='23514';
  end if;
  return null;
end;
$$;
revoke execute on function private.reconcile_route_capacity() from public,anon,authenticated,service_role;
create constraint trigger route_capacity_reconciliation after insert or update on app.carrier_routes deferrable initially deferred
  for each row execute function private.reconcile_route_capacity();
create constraint trigger booking_capacity_reconciliation after insert or update or delete on app.bookings deferrable initially deferred
  for each row execute function private.reconcile_route_capacity();

create function private.validate_read_cursor() returns trigger
language plpgsql security definer set search_path='' as $$
begin
  if tg_op='UPDATE' and ((new.conversation_id,new.user_id) is distinct from (old.conversation_id,old.user_id)
    or new.last_read_sequence<old.last_read_sequence) then
    raise exception 'Read cursor must be monotonic' using errcode='23514';
  end if;
  if new.last_read_sequence>coalesce((select max(sequence) from app.messages where conversation_id=new.conversation_id),0) then
    raise exception 'Read cursor exceeds message history' using errcode='23514';
  end if;
  return new;
end;
$$;
revoke execute on function private.validate_read_cursor() from public,anon,authenticated,service_role;
create trigger read_cursor before insert or update on app.conversation_reads for each row execute function private.validate_read_cursor();

create function private.validate_booking_operation() returns trigger
language plpgsql security definer set search_path='' as $$
begin
  if tg_op='UPDATE' and (new.booking_id,new.vehicle_id,new.side) is distinct from (old.booking_id,old.vehicle_id,old.side) then
    raise exception 'Operation identity is immutable' using errcode='23514';
  end if;
  if not exists(select 1 from app.bookings b,jsonb_array_elements(b.agreement_snapshot->'vehicles') v
    where b.id=new.booking_id and v->>'id'=new.vehicle_id::text) then
    raise exception 'Vehicle outside Booking' using errcode='23514';
  end if;
  return new;
end;
$$;
revoke execute on function private.validate_booking_operation() from public,anon,authenticated,service_role;
create trigger booking_operation_vehicle before insert or update on app.booking_vehicle_operations
  for each row execute function private.validate_booking_operation();

grant parvezk_authorization to current_user with inherit false;
grant parvezk_authorization to current_user with set true;
grant create on schema private to parvezk_authorization;
alter function private.check_booking_context() owner to parvezk_authorization;
alter function private.reconcile_route_capacity() owner to parvezk_authorization;
alter function private.validate_read_cursor() owner to parvezk_authorization;
alter function private.validate_booking_operation() owner to parvezk_authorization;
revoke create on schema private from parvezk_authorization;
revoke set option for parvezk_authorization from current_user;
commit;
