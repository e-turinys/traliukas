begin;

-- Forward-only operational extension. Phase 4 acceptance/snapshot/reservation
-- commands and ordinary-client write privileges are unchanged.
alter table app.domain_events drop constraint domain_events_event_type_check;
alter table app.domain_events add constraint domain_events_event_type_check check(event_type in
 ('offer.created','offer.updated','offer.accepted','offer.declined','message.created','booking.created',
 'booking.pickupScheduled','booking.collected','booking.inTransit','booking.delivered','booking.completed','booking.cancelled'));
alter table app.domain_events drop constraint domain_events_payload_check;
alter table app.domain_events add constraint domain_events_payload_check check(jsonb_typeof(payload)='object' and octet_length(payload::text)<=32768
 and payload-array['offer_version','message_id','vehicle_count','status_version','from_status','to_status']::text[]='{}'::jsonb);
alter table app.audit_log drop constraint audit_action;
alter table app.audit_log add constraint audit_action check(action in
 ('carrier.created','carrier.updated','carrier.owner_transferred','carrier.verification_changed','profile.updated','profile.beta_access','platform_role.bootstrap','request.published','route.created','route.updated','carrierRoute.published','route.closed','offer.submitted','offer.revised','offer.declined','booking.created','booking.status_changed','booking.cancelled','booking.pickups_read'));

-- Append-only command receipts bind a retry to the original actor, expected
-- version and exact payload. No pickup PII in events/audit; private pickup data remains
-- only in operations (receipt stores a digest, not another private copy).
create table app.booking_actions (
 booking_id uuid not null references app.bookings(id),
 from_version integer not null check(from_version>0),
 actor_id uuid not null references app.profiles(id),
 from_status text not null,
 to_status text not null,
 payload_hash text not null,
 created_at timestamptz not null default transaction_timestamp(),
 primary key(booking_id,from_version)
);
alter table app.booking_actions enable row level security;
create index booking_actions_actor on app.booking_actions(actor_id);
create trigger booking_actions_immutable before update or delete or truncate on app.booking_actions
 for each statement execute function private.guard_audit();
grant select,insert on app.booking_actions to parvezk_commands;
create policy booking_actions_command on app.booking_actions to parvezk_commands
 using(private.can_read_booking(booking_id)) with check(private.can_read_booking(booking_id));
grant update(status,status_version,status_changed_at,completed_at,cancelled_at,capacity_released_at) on app.bookings to parvezk_commands;
create policy booking_lifecycle_update on app.bookings for update to parvezk_commands
 using(private.can_read_booking(id)) with check(private.can_read_booking(id));
grant update on app.booking_vehicle_operations to parvezk_commands;

-- Same lock order as acceptance: caller profile -> Request -> Carrier -> Route
-- -> Conversation -> Booking -> operations/events. Route precedes Booking even
-- for normal progression because the deferred reconciliation trigger locks it.
create function private.lock_operational_booking(p_booking uuid) returns app.bookings
language plpgsql set search_path='' as $$
declare b app.bookings%rowtype; caller uuid;
begin
 caller:=private.require_active_user(false);
 select * into b from app.bookings where id=p_booking;
 if not found or not private.can_read_booking(b.id) then raise exception 'Not authorized' using errcode='42501'; end if;
 perform 1 from app.transport_requests where id=b.request_id for update;
 perform 1 from app.carriers where id=b.carrier_id for update;
 if caller<>b.customer_id and (not private.is_carrier_owner(b.carrier_id)
   or exists(select 1 from app.carriers where id=b.carrier_id and suspended_at is not null)) then
   raise exception 'Not authorized' using errcode='42501'; end if;
 perform 1 from app.carrier_routes where id=b.route_id for update;
 perform 1 from app.conversations where id=b.conversation_id for update;
 select * into b from app.bookings where id=p_booking for update;
 return b;
end;
$$;
revoke execute on function private.lock_operational_booking(uuid) from public,anon,authenticated,service_role;
grant execute on function private.lock_operational_booking(uuid) to parvezk_commands;

create function api.transition_booking(p_booking_id uuid,p_expected_version integer,p_next_status text,p_pickups jsonb default null) returns jsonb
language plpgsql security definer set search_path='' set lock_timeout='5s' set statement_timeout='15s' as $$
declare b app.bookings%rowtype; a app.booking_actions%rowtype; item jsonb; v jsonb; expected text; kind text; label text;
 fingerprint text:=md5(jsonb_build_object('next',p_next_status,'pickups',p_pickups)::text);
begin
 b:=private.lock_operational_booking(p_booking_id);
 if p_next_status='completed' then
   if private.request_user_id()<>b.customer_id then raise exception 'Customer confirmation required' using errcode='42501'; end if;
 elsif p_next_status in ('pickup_scheduled','collected','in_transit','delivered') then
   if not private.is_carrier_owner(b.carrier_id) or private.request_user_id()=b.customer_id then raise exception 'Carrier action required' using errcode='42501'; end if;
 else raise exception 'Invalid transition' using errcode='22023'; end if;
 select * into a from app.booking_actions where booking_id=b.id and from_version=p_expected_version;
 if found and a.actor_id=private.request_user_id() and a.to_status=p_next_status and a.payload_hash=fingerprint
   and b.status_version=p_expected_version+1 and b.status=p_next_status then
   return jsonb_build_object('booking_id',b.id,'status',b.status,'status_version',b.status_version,'replayed',true);
 end if;
 if b.status_version is distinct from p_expected_version then raise exception 'Booking changed; reload' using errcode='40001'; end if;
 expected:=case b.status when 'booked' then 'pickup_scheduled' when 'pickup_scheduled' then 'collected' when 'collected' then 'in_transit' when 'in_transit' then 'delivered' when 'delivered' then 'completed' end;
 if expected is null or expected<>p_next_status then raise exception 'Invalid transition' using errcode='23514'; end if;
 if p_next_status='pickup_scheduled' then
   if p_pickups is null or jsonb_typeof(p_pickups)<>'array' or octet_length(p_pickups::text)>32768
     or jsonb_array_length(p_pickups)<>b.vehicle_count then raise exception 'Complete pickup details required' using errcode='22023'; end if;
   if (select count(distinct value->>'vehicle_id') from jsonb_array_elements(p_pickups))<>b.vehicle_count then raise exception 'Duplicate pickup vehicle' using errcode='22023'; end if;
   for item in select value from jsonb_array_elements(p_pickups) loop
     if jsonb_typeof(item)<>'object' or not(item ?& array['vehicle_id','street','contact_name','contact_phone','scheduled_from','scheduled_to'])
       or item-array['vehicle_id','street','contact_name','contact_phone','scheduled_from','scheduled_to']::text[]<>'{}'::jsonb
       or exists(select 1 from jsonb_each(item) e where jsonb_typeof(e.value)<>'string')
       or coalesce(length(btrim(item->>'street')),0)=0 or coalesce(length(btrim(item->>'contact_name')),0)=0
       or (item->>'contact_phone') !~ '^\+[1-9][0-9]{1,14}$'
       or (item->>'scheduled_from') !~ '(Z|[+-][0-9]{2}:[0-9]{2})$' or (item->>'scheduled_to') !~ '(Z|[+-][0-9]{2}:[0-9]{2})$'
       or not isfinite((item->>'scheduled_from')::timestamptz) or not isfinite((item->>'scheduled_to')::timestamptz)
       or (item->>'scheduled_from')::timestamptz>(item->>'scheduled_to')::timestamptz then
       raise exception 'Invalid pickup details' using errcode='22023'; end if;
     select value into v from jsonb_array_elements(b.agreement_snapshot->'vehicles') where value->>'id'=item->>'vehicle_id';
     if not found then raise exception 'Vehicle outside Booking' using errcode='22023'; end if;
     insert into app.booking_vehicle_operations(booking_id,vehicle_id,side,street,city,country_code,contact_name,contact_phone,scheduled_from,scheduled_to,updated_by)
       values(b.id,(item->>'vehicle_id')::uuid,'pickup',btrim(item->>'street'),v->'pickup_location'->>'city',v->'pickup_location'->>'country_code',btrim(item->>'contact_name'),item->>'contact_phone',(item->>'scheduled_from')::timestamptz,(item->>'scheduled_to')::timestamptz,private.request_user_id())
       on conflict(booking_id,vehicle_id,side) do update set street=excluded.street,city=excluded.city,country_code=excluded.country_code,
         contact_name=excluded.contact_name,contact_phone=excluded.contact_phone,scheduled_from=excluded.scheduled_from,scheduled_to=excluded.scheduled_to,
         operation_version=app.booking_vehicle_operations.operation_version+1,updated_by=excluded.updated_by,updated_at=clock_timestamp();
   end loop;
 elsif p_pickups is not null then raise exception 'Pickup data only allowed when scheduling' using errcode='22023'; end if;
 update app.bookings set status=p_next_status,status_version=status_version+1,status_changed_at=clock_timestamp(),
   completed_at=case when p_next_status='completed' then clock_timestamp() else null end where id=b.id;
 if p_next_status='completed' then
   update app.transport_requests set status='completed' where id=b.request_id;
   update app.conversations set status='completed' where id=b.conversation_id;
 end if;
 insert into app.booking_actions values(b.id,b.status_version,private.request_user_id(),b.status,p_next_status,fingerprint,clock_timestamp());
 kind:=case p_next_status when 'pickup_scheduled' then 'booking.pickupScheduled' when 'in_transit' then 'booking.inTransit' else 'booking.'||p_next_status end;
 label:=case p_next_status when 'pickup_scheduled' then 'Paėmimas suplanuotas' when 'collected' then case when b.vehicle_count=1 then 'Automobilis paimtas' else 'Automobiliai paimti' end when 'in_transit' then 'Vežama' when 'delivered' then 'Pristatyta' when 'completed' then 'Pervežimas užbaigtas' end;
 perform private.append_commercial_event(kind,b.accepted_offer_id,b.conversation_id,b.id,'booking:'||b.id||':status:'||(b.status_version+1),label,
   jsonb_build_object('status_version',b.status_version+1,'from_status',b.status,'to_status',p_next_status));
 insert into app.audit_log(actor_id,action,entity_type,entity_id,correlation_id,change_summary)
 values(private.request_user_id(),'booking.status_changed','booking',b.id,gen_random_uuid(),jsonb_build_object('fields',case when p_next_status='pickup_scheduled' then array['status','status_version','pickup_operations'] else array['status','status_version'] end,'old_status',b.status,'new_status',p_next_status));
 return jsonb_build_object('booking_id',b.id,'status',p_next_status,'status_version',b.status_version+1,'replayed',false);
end;
$$;

create function api.cancel_booking(p_booking_id uuid,p_expected_version integer,p_reason text) returns jsonb
language plpgsql security definer set search_path='' set lock_timeout='5s' set statement_timeout='15s' as $$
declare b app.bookings%rowtype; a app.booking_actions%rowtype; fingerprint text:=md5(btrim(p_reason));
begin
 b:=private.lock_operational_booking(p_booking_id);
 if p_reason is null or length(btrim(p_reason)) not between 1 and 2000 then raise exception 'Cancellation reason required' using errcode='22023'; end if;
 select * into a from app.booking_actions where booking_id=b.id and from_version=p_expected_version;
 if found and a.actor_id=private.request_user_id() and a.to_status='cancelled' and a.payload_hash=fingerprint
   and b.status='cancelled' and b.status_version=p_expected_version+1 then
   return jsonb_build_object('booking_id',b.id,'status',b.status,'status_version',b.status_version,'replayed',true);
 end if;
 if b.status_version is distinct from p_expected_version then raise exception 'Booking changed; reload' using errcode='40001'; end if;
 if b.status not in ('booked','pickup_scheduled') or b.capacity_released_at is not null then raise exception 'Cancellation no longer allowed' using errcode='23514'; end if;
 update app.carrier_routes set capacity_reserved=capacity_reserved-b.vehicle_count where id=b.route_id and capacity_reserved>=b.vehicle_count;
 if not found then raise exception 'Reservation conflict' using errcode='40001'; end if;
 update app.bookings set status='cancelled',status_version=status_version+1,status_changed_at=clock_timestamp(),cancelled_at=clock_timestamp(),capacity_released_at=clock_timestamp() where id=b.id;
 update app.transport_requests set status='closed',closed_at=clock_timestamp() where id=b.request_id;
 update app.conversations set status='archived' where id=b.conversation_id;
 insert into app.booking_actions values(b.id,b.status_version,private.request_user_id(),b.status,'cancelled',fingerprint,clock_timestamp());
 perform private.append_commercial_event('booking.cancelled',b.accepted_offer_id,b.conversation_id,b.id,'booking:'||b.id||':status:'||(b.status_version+1),'Pervežimas atšauktas',
   jsonb_build_object('status_version',b.status_version+1,'from_status',b.status,'to_status','cancelled','vehicle_count',b.vehicle_count));
 insert into app.audit_log(actor_id,action,entity_type,entity_id,correlation_id,reason,change_summary)
 values(private.request_user_id(),'booking.cancelled','booking',b.id,gen_random_uuid(),btrim(p_reason),jsonb_build_object('fields',array['status','capacity_released'],'old_status',b.status,'new_status','cancelled'));
 return jsonb_build_object('booking_id',b.id,'status','cancelled','status_version',b.status_version+1,'replayed',false);
end;
$$;

-- Narrow participant-only private read; no direct client SELECT on operations.
create function api.booking_pickups(p_booking_id uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
begin
 if not private.can_read_booking(p_booking_id) then raise exception 'Not authorized' using errcode='42501'; end if;
 insert into app.audit_log(actor_id,action,entity_type,entity_id,correlation_id,change_summary)
 values(private.request_user_id(),'booking.pickups_read','booking',p_booking_id,gen_random_uuid(),'{"fields":["pickup_operations"]}');
 return coalesce((select jsonb_agg(jsonb_build_object('vehicle_id',vehicle_id,'street',street,'contact_name',contact_name,'contact_phone',contact_phone,'scheduled_from',scheduled_from,'scheduled_to',scheduled_to) order by vehicle_id)
 from app.booking_vehicle_operations where booking_id=p_booking_id and side='pickup' and scheduled_from is not null),'[]'::jsonb);
end;
$$;

-- Add caller-side/version metadata without changing existing view columns.
create or replace view api.bookings with(security_invoker=true) as
select id,request_id,accepted_offer_id,accepted_offer_version,carrier_id,route_id,conversation_id,vehicle_count,agreed_total_price,currency,payment_terms,planned_pickup_date,planned_delivery_date,snapshot_schema_version,agreement_snapshot,status,created_at,
 status_version,case when customer_id=auth.uid() then 'customer' else 'carrier' end as viewer_side
from app.bookings;

revoke execute on function api.transition_booking(uuid,integer,text,jsonb),api.cancel_booking(uuid,integer,text),api.booking_pickups(uuid) from public,anon,authenticated,service_role;
grant execute on function api.transition_booking(uuid,integer,text,jsonb),api.cancel_booking(uuid,integer,text),api.booking_pickups(uuid) to authenticated;
grant parvezk_commands to current_user with set true;
grant create on schema api to parvezk_commands;
alter function api.transition_booking(uuid,integer,text,jsonb) owner to parvezk_commands;
alter function api.cancel_booking(uuid,integer,text) owner to parvezk_commands;
alter function api.booking_pickups(uuid) owner to parvezk_commands;
revoke create on schema api from parvezk_commands;
revoke set option for parvezk_commands from current_user;
commit;
