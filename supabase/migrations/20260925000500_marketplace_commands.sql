begin;

-- D-065: trusted Auth-synchronized phone + applicable current identity approval.
-- This policy is deliberately separate from D-063 Route publication.
grant select,update on app.profiles to parvezk_authorization;
create policy profiles_commercial_lock on app.profiles to parvezk_authorization using(true) with check(true);
grant select on app.carrier_private_details,app.carrier_verifications to parvezk_authorization;
create policy legal_eligibility on app.carrier_private_details for select to parvezk_authorization using(true);
create policy verification_eligibility on app.carrier_verifications for select to parvezk_authorization using(true);
create function private.offer_carrier_eligible(target uuid) returns boolean
language sql volatile security definer set search_path='' as $$
  select exists(select 1 from app.carriers c
    join app.carrier_memberships m on m.carrier_id=c.id and m.active and m.role='owner'
    join app.profiles p on p.id=m.user_id
    join app.carrier_private_details d on d.carrier_id=c.id
    join app.carrier_verifications v on v.carrier_id=c.id
      and v.category=case d.business_kind when 'individual' then 'identity' when 'company' then 'company' end
    where c.id=target and c.visibility='published' and c.suspended_at is null
      and p.account_status='active' and p.beta_access and p.phone_e164 is not null and p.phone_verified_at is not null
      and v.status='approved' and (v.expires_at is null or v.expires_at>clock_timestamp()));
$$;
-- Acquire both actors' profiles in UUID order BEFORE Request/carrier/Route locks.
-- Acceptance therefore serializes with Auth contact loss and beta revocation,
-- without acquiring a second profile after locking the Request.
create function private.lock_commercial_profiles(target uuid) returns uuid
language plpgsql security definer set search_path='' as $$
declare owner_id uuid;
begin
  if not private.has_live_session() then raise exception 'Not authorized' using errcode='42501'; end if;
  select user_id into owner_id from app.carrier_memberships where carrier_id=target and active and role='owner';
  perform 1 from app.profiles where id in (private.request_user_id(),owner_id) order by id for update;
  if not exists(select 1 from app.profiles where id=private.request_user_id() and account_status='active' and beta_access) then
    raise exception 'Not authorized' using errcode='42501'; end if;
  return owner_id;
end;
$$;
revoke execute on function private.offer_carrier_eligible(uuid),private.lock_commercial_profiles(uuid) from public,anon,authenticated,service_role;
grant execute on function private.offer_carrier_eligible(uuid),private.lock_commercial_profiles(uuid) to parvezk_commands,parvezk_authorization;

grant execute on function private.request_user_id() to parvezk_authorization;
grant parvezk_authorization to current_user with set true;
set local role parvezk_authorization;
grant execute on function private.can_read_request(uuid) to parvezk_commands;
reset role;
grant update on app.transport_requests to parvezk_commands;
create policy requests_commercial_lock on app.transport_requests to parvezk_commands
using(private.can_read_request(id)) with check(private.can_read_request(id));
create policy vehicles_commercial_read on app.request_vehicles for select to parvezk_commands using(private.can_read_request(request_id));
create policy revisions_commercial_read on app.request_revisions for select to parvezk_commands using(private.can_read_request(request_id));
grant select,insert,update on app.offers,app.conversations,app.conversation_reads to parvezk_commands;
grant select,insert on app.offer_revisions,app.bookings,app.messages,app.booking_vehicle_operations,app.domain_events to parvezk_commands;
create policy offers_commands on app.offers to parvezk_commands using(private.commercial_party(request_id,carrier_id)) with check(private.commercial_party(request_id,carrier_id));
create policy terms_commands on app.offer_revisions to parvezk_commands using(private.can_read_offer(offer_id)) with check(private.can_read_offer(offer_id));
create policy conversations_commands on app.conversations to parvezk_commands using(private.commercial_party(request_id,carrier_id)) with check(private.commercial_party(request_id,carrier_id));
create policy bookings_commands on app.bookings to parvezk_commands using(private.owns_request(request_id)) with check(private.owns_request(request_id));
create policy messages_commands on app.messages to parvezk_commands using(private.can_read_conversation(conversation_id)) with check(private.can_read_conversation(conversation_id));
create policy reads_commands on app.conversation_reads to parvezk_commands using(user_id=private.request_user_id() and private.can_read_conversation(conversation_id)) with check(user_id=private.request_user_id() and private.can_read_conversation(conversation_id));
create policy operations_commands on app.booking_vehicle_operations to parvezk_commands using(private.can_read_booking(booking_id)) with check(private.can_read_booking(booking_id));
create policy events_commands on app.domain_events to parvezk_commands using(private.owns_request(request_id) or private.can_read_offer(offer_id)) with check(private.owns_request(request_id) or private.can_read_offer(offer_id));
create policy carrier_acceptance_lock on app.carriers to parvezk_commands
using(exists(select 1 from app.offers o where o.carrier_id=carriers.id and private.owns_request(o.request_id))) with check(true);
create policy route_acceptance_lock on app.carrier_routes to parvezk_commands
using(exists(select 1 from app.offers o where o.route_id=carrier_routes.id and private.owns_request(o.request_id))) with check(true);
create policy stops_acceptance_read on app.route_stops for select to parvezk_commands
using(exists(select 1 from app.offers o where o.route_id=route_stops.route_id and private.owns_request(o.request_id)));
create policy route_terms_acceptance_read on app.route_revisions for select to parvezk_commands
using(exists(select 1 from app.offers o where o.route_id=route_revisions.route_id and private.owns_request(o.request_id)));

-- Complete Request matching mirrors findIndex ordering; flexibility never
-- bypasses ordered stops, categories, non-running support or complete capacity.
create function private.route_fits_request(p_route uuid,p_request uuid,p_pickup date,p_delivery date) returns boolean
language sql stable security definer set search_path='' as $$
 select exists(select 1 from app.carrier_routes r where r.id=p_route and r.status='published' and r.moderation_status='normal'
   and r.accepting_new_requests and r.date_to>=(clock_timestamp() at time zone 'Europe/Vilnius')::date
   and p_pickup>=r.date_from and p_delivery<=r.date_to and p_delivery>=p_pickup
   and (select count(*) from app.request_vehicles v where v.request_id=p_request and v.removed_at is null) between 1 and least(10,r.capacity_total-r.capacity_reserved)
   and not exists(select 1 from app.request_vehicles v where v.request_id=p_request and v.removed_at is null and
     (not(v.category=any(r.supported_categories)) or (v.condition='non_running' and not r.supports_non_running)
      or coalesce((select min(position) from app.route_stops where route_id=r.id and location_id=v.pickup_location_id),-1)<0
      or coalesce((select min(position) from app.route_stops where route_id=r.id and location_id=v.delivery_location_id),-1)
         <=coalesce((select min(position) from app.route_stops where route_id=r.id and location_id=v.pickup_location_id),-1))));
$$;
revoke execute on function private.route_fits_request(uuid,uuid,date,date) from public,anon,authenticated,service_role;
grant execute on function private.route_fits_request(uuid,uuid,date,date) to parvezk_commands,parvezk_authorization;

create function private.effective_offer_status(target uuid) returns text
language plpgsql volatile security definer set search_path='' as $$
declare o app.offers%rowtype; t app.offer_revisions%rowtype; r app.transport_requests%rowtype; route app.carrier_routes%rowtype;
begin
 if not private.can_read_offer(target) then return null; end if;
 select * into o from app.offers where id=target;
 if o.status<>'pending' then return o.status; end if;
 select * into t from app.offer_revisions where offer_id=o.id and version=o.current_version;
 if t.expires_at<=clock_timestamp() then return 'expired'; end if;
 select * into r from app.transport_requests where id=o.request_id;
 select * into route from app.carrier_routes where id=o.route_id;
 if r.status<>'active' or r.moderation_status<>'normal' or r.request_version<>t.request_version or route.route_version<>t.route_version
   or not private.offer_carrier_eligible(o.carrier_id) or not private.route_fits_request(o.route_id,o.request_id,t.planned_pickup_date,t.planned_delivery_date) then return 'unavailable'; end if;
 return 'pending';
end;
$$;
create function private.effective_conversation_status(target uuid) returns text
language plpgsql volatile security definer set search_path='' as $$
declare c app.conversations%rowtype; b app.bookings%rowtype;
begin
 if not private.can_read_conversation(target) then return null; end if;
 select * into c from app.conversations where id=target;
 select * into b from app.bookings where conversation_id=target;
 if found then return case when b.status='completed' then 'completed' when b.status='cancelled' then 'archived' else 'active' end; end if;
 return case when c.status='active' and private.effective_offer_status(c.current_offer_id)='pending' then 'active' else 'archived' end;
end;
$$;
revoke execute on function private.effective_offer_status(uuid),private.effective_conversation_status(uuid) from public,anon,authenticated,service_role;
grant execute on function private.effective_offer_status(uuid),private.effective_conversation_status(uuid) to authenticated,parvezk_commands,parvezk_authorization;

create function private.append_commercial_event(p_kind text,p_offer uuid,p_conversation uuid,p_booking uuid,p_key text,p_body text,p_payload jsonb default '{}') returns uuid
language plpgsql set search_path='' as $$
declare result uuid; o app.offers%rowtype;
begin
 select * into o from app.offers where id=p_offer;
 insert into app.domain_events(dedupe_key,event_type,actor_id,request_id,offer_id,conversation_id,booking_id,route_id,payload)
 values(p_key,p_kind,private.request_user_id(),o.request_id,o.id,p_conversation,p_booking,o.route_id,p_payload) returning id into result;
 if p_body is not null then
   insert into app.messages(conversation_id,sequence,kind,sender_side,body,event_id)
     select p_conversation,coalesce(max(sequence),0)+1,'system','system',p_body,result from app.messages where conversation_id=p_conversation;
   update app.conversations set last_message_at=clock_timestamp() where id=p_conversation;
 end if;
 return result;
end;
$$;
revoke execute on function private.append_commercial_event(text,uuid,uuid,uuid,text,text,jsonb) from public,anon,authenticated,service_role;
grant execute on function private.append_commercial_event(text,uuid,uuid,uuid,text,text,jsonb) to parvezk_commands;

alter table app.audit_log drop constraint audit_action;
alter table app.audit_log add constraint audit_action check(action in ('carrier.created','carrier.updated','carrier.owner_transferred','carrier.verification_changed','profile.updated','profile.beta_access','platform_role.bootstrap','request.published','route.created','route.updated','carrierRoute.published','route.closed','offer.submitted','offer.revised','offer.declined','booking.created'));
alter table app.audit_log drop constraint audit_entity;
alter table app.audit_log add constraint audit_entity check(entity_type in ('profile','carrier','platform_role','request','route','offer','booking'));

create function api.submit_offer(p_request_id uuid,p_route_id uuid,p_terms jsonb,p_expected_request_version integer,p_expected_route_version integer,p_expected_offer_version integer default null) returns uuid
language plpgsql security definer set search_path='' set lock_timeout='5s' set statement_timeout='15s' as $$
declare carrier uuid; owner_id uuid; r app.transport_requests%rowtype; route app.carrier_routes%rowtype; o app.offers%rowtype;
 result uuid; thread uuid; version integer; pickup date; delivery date; zone text;
begin
 select carrier_id into carrier from app.carrier_routes where id=p_route_id;
 owner_id:=private.lock_commercial_profiles(carrier);
 select * into r from app.transport_requests where id=p_request_id for update;
 if not found or r.status<>'active' or r.moderation_status<>'normal' or r.customer_id=private.request_user_id()
   or not private.can_read_request(r.id) then raise exception 'Request unavailable' using errcode='42501'; end if;
 if r.request_version is distinct from p_expected_request_version then raise exception 'Request changed; reload' using errcode='40001'; end if;
 perform 1 from app.carriers where id=carrier for update;
 if owner_id is distinct from private.request_user_id() or not private.is_carrier_owner(carrier) or not private.offer_carrier_eligible(carrier) then
   raise exception 'Carrier is not eligible to offer' using errcode='42501'; end if;
 select * into route from app.carrier_routes where id=p_route_id for update;
 if route.route_version is distinct from p_expected_route_version then raise exception 'Route changed; reload' using errcode='40001'; end if;
 if p_terms is null or jsonb_typeof(p_terms)<>'object' or octet_length(p_terms::text)>16384
   or not(p_terms ?& array['total_price','currency','planned_pickup_date','planned_delivery_date','payment_terms','expires_at'])
   or p_terms-array['total_price','currency','planned_pickup_date','planned_delivery_date','payment_terms','expires_at','carrier_comment']::text[]<>'{}'::jsonb
   or jsonb_typeof(p_terms->'total_price') is distinct from 'number'
   or (p_terms->>'total_price') !~ '^[0-9]+(\.[0-9]{1,2})?$'
   or p_terms->>'currency' is distinct from 'EUR'
   or jsonb_typeof(p_terms->'payment_terms') is distinct from 'string'
   or (p_terms->>'planned_pickup_date') !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'
   or (p_terms->>'planned_delivery_date') !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' then
   raise exception 'Invalid complete Offer terms' using errcode='22023'; end if;
 pickup:=(p_terms->>'planned_pickup_date')::date; delivery:=(p_terms->>'planned_delivery_date')::date;
 if not private.route_fits_request(p_route_id,p_request_id,pickup,delivery) then raise exception 'Route cannot serve complete Request' using errcode='23514'; end if;
 select time_zone into zone from app.public_locations where id=r.default_pickup_location_id;
 select * into o from app.offers where request_id=r.id and carrier_id=carrier and status='pending' for update;
 if found then
   if o.route_id<>p_route_id or p_expected_offer_version is distinct from o.current_version then raise exception 'Offer changed; reload' using errcode='40001'; end if;
   result:=o.id; version:=o.current_version+1;
   update app.offers set current_version=version where id=result;
 else
   if p_expected_offer_version is not null then raise exception 'Offer changed; reload' using errcode='40001'; end if;
   insert into app.offers(request_id,carrier_id,route_id,created_by) values(r.id,carrier,p_route_id,private.request_user_id()) returning id into result;
   version:=1;
 end if;
 insert into app.offer_revisions(offer_id,version,request_id,request_version,route_id,route_version,total_price,currency,planned_pickup_date,pickup_time_zone,planned_delivery_date,payment_terms,carrier_comment,expires_at,revised_by)
 values(result,version,r.id,r.request_version,p_route_id,route.route_version,(p_terms->>'total_price')::numeric,'EUR',pickup,zone,delivery,btrim(p_terms->>'payment_terms'),nullif(btrim(p_terms->>'carrier_comment'),''),(p_terms->>'expires_at')::timestamptz,private.request_user_id());
 insert into app.conversations(request_id,carrier_id,current_offer_id) values(r.id,carrier,result)
 on conflict(request_id,carrier_id) do update set current_offer_id=excluded.current_offer_id,status='active' returning id into thread;
 perform private.append_commercial_event(case when version=1 then 'offer.created' else 'offer.updated' end,result,thread,null,
   'offer:'||result||':'||version,case when version=1 then 'Pasiūlymas pateiktas' else 'Pasiūlymas atnaujintas' end,jsonb_build_object('offer_version',version));
 insert into app.audit_log(actor_id,action,entity_type,entity_id,correlation_id,change_summary)
 values(private.request_user_id(),case when version=1 then 'offer.submitted' else 'offer.revised' end,'offer',result,gen_random_uuid(),'{"fields":["terms","version"]}');
 return result;
end;
$$;
revoke execute on function api.submit_offer(uuid,uuid,jsonb,integer,integer,integer) from public,anon,authenticated,service_role;
grant execute on function api.submit_offer(uuid,uuid,jsonb,integer,integer,integer) to authenticated;

create function api.accept_offer(p_offer_id uuid,p_expected_offer_version integer,p_expected_request_version integer,p_expected_route_version integer) returns jsonb
language plpgsql security definer set search_path='' set lock_timeout='5s' set statement_timeout='15s' as $$
declare o app.offers%rowtype; t app.offer_revisions%rowtype; r app.transport_requests%rowtype; route app.carrier_routes%rowtype;
 b app.bookings%rowtype; owner_id uuid; carrier app.carriers%rowtype; thread uuid; count_vehicles integer; result uuid:=gen_random_uuid(); snapshot jsonb; vehicles jsonb; stops jsonb; customer_name text;
begin
 select * into o from app.offers where id=p_offer_id;
 if not found then raise exception 'Not authorized' using errcode='42501'; end if;
 owner_id:=private.lock_commercial_profiles(o.carrier_id);
 select * into r from app.transport_requests where id=o.request_id for update;
 if not found or r.customer_id<>private.request_user_id() then raise exception 'Not authorized' using errcode='42501'; end if;
 select * into b from app.bookings where request_id=r.id;
 if found then
   if b.accepted_offer_id=p_offer_id and b.accepted_offer_version=p_expected_offer_version then
     return jsonb_build_object('booking_id',b.id,'replayed',true);
   end if;
   raise exception 'Request already booked' using errcode='40001';
 end if;
 if r.status<>'active' or r.moderation_status<>'normal' or r.request_version is distinct from p_expected_request_version then
   raise exception 'Request changed; reload' using errcode='40001'; end if;
 select * into carrier from app.carriers where id=o.carrier_id for update;
 if not exists(select 1 from app.carrier_memberships where carrier_id=o.carrier_id and user_id=owner_id and active and role='owner')
   or not private.offer_carrier_eligible(o.carrier_id) then raise exception 'Carrier is not eligible to offer' using errcode='42501'; end if;
 select * into route from app.carrier_routes where id=o.route_id for update;
 perform 1 from app.offers where request_id=r.id order by id for update;
 select * into o from app.offers where id=p_offer_id;
 select * into t from app.offer_revisions where offer_id=o.id and version=o.current_version;
 if o.status<>'pending' or o.current_version is distinct from p_expected_offer_version
   or t.request_version is distinct from p_expected_request_version or t.route_version is distinct from p_expected_route_version
   or route.route_version is distinct from p_expected_route_version or route.carrier_id<>o.carrier_id
   or t.expires_at<=clock_timestamp() or not private.offer_carrier_eligible(o.carrier_id)
   or not private.route_fits_request(o.route_id,r.id,t.planned_pickup_date,t.planned_delivery_date) then
   raise exception 'Offer unavailable; reload' using errcode='40001'; end if;
 select count(*) into count_vehicles from app.request_vehicles where request_id=r.id and removed_at is null;
 update app.carrier_routes set capacity_reserved=capacity_reserved+count_vehicles
 where id=route.id and capacity_total-capacity_reserved>=count_vehicles;
 if not found then raise exception 'Insufficient capacity' using errcode='40001'; end if;
 -- Lock every thread before Booking/children; all competing commands lock Request first.
 perform 1 from app.conversations where request_id=r.id order by id for update;
 select id into thread from app.conversations where request_id=r.id and carrier_id=o.carrier_id and current_offer_id=o.id;
 select display_name into customer_name from app.profiles where id=private.request_user_id();
 select jsonb_agg(jsonb_build_object('id',v.id,'category',v.category,'make',v.make,'model',v.model,'year',v.year,'condition',v.condition,'rolling_ability',v.rolling_ability,
   'pickup_location',jsonb_build_object('id',p.id,'slug',p.slug,'city',p.city,'country_name',p.country_name,'country_code',p.country_code,'latitude',p.latitude,'longitude',p.longitude),
   'delivery_location',jsonb_build_object('id',d.id,'slug',d.slug,'city',d.city,'country_name',d.country_name,'country_code',d.country_code,'latitude',d.latitude,'longitude',d.longitude)) order by v.position)
 into vehicles from app.request_vehicles v join app.public_locations p on p.id=v.pickup_location_id join app.public_locations d on d.id=v.delivery_location_id where v.request_id=r.id and v.removed_at is null;
 select jsonb_agg(jsonb_build_object('id',l.id,'slug',l.slug,'city',l.city,'country_name',l.country_name,'country_code',l.country_code,'latitude',l.latitude,'longitude',l.longitude) order by s.position)
 into stops from app.route_stops s join app.public_locations l on l.id=s.location_id where s.route_id=route.id;
 snapshot:=jsonb_build_object('accepted_at',clock_timestamp(),'customer',jsonb_build_object('id',r.customer_id,'display_name',customer_name),
 'carrier',jsonb_build_object('id',carrier.id,'display_name',carrier.display_name,'registration_country',carrier.registration_country),
 'request',jsonb_build_object('id',r.id,'version',r.request_version,'pickup',jsonb_build_object('kind',r.pickup_kind,'from',r.pickup_from,'to',r.pickup_to,'flexible_option',r.pickup_flexible_option,'anchor_date',r.pickup_anchor_date)),
 'route',jsonb_build_object('id',route.id,'version',route.route_version,'stops',stops),
 'offer',jsonb_build_object('id',o.id,'version',o.current_version,'pickup_time_zone',t.pickup_time_zone,'pickup_time_from',t.pickup_time_from,'pickup_time_to',t.pickup_time_to,'carrier_comment',t.carrier_comment),
 'vehicles',vehicles,'total_price',t.total_price,'currency',t.currency,'payment_terms',t.payment_terms,'planned_pickup_date',t.planned_pickup_date,'planned_delivery_date',t.planned_delivery_date);
 insert into app.bookings(id,request_id,accepted_offer_id,accepted_offer_version,customer_id,carrier_id,route_id,conversation_id,vehicle_count,agreed_total_price,currency,payment_terms,planned_pickup_date,planned_delivery_date,agreement_snapshot)
 values(result,r.id,o.id,o.current_version,r.customer_id,o.carrier_id,route.id,thread,count_vehicles,t.total_price,t.currency,t.payment_terms,t.planned_pickup_date,t.planned_delivery_date,snapshot);
 insert into app.booking_vehicle_operations(booking_id,vehicle_id,side,street,postcode,city,country_code,instructions,contact_name,contact_phone,contact_email,updated_by)
 select result,d.vehicle_id,d.side,d.street,d.postcode,d.city,d.country_code,d.instructions,d.contact_name,d.contact_phone,d.contact_email,private.request_user_id()
 from app.request_vehicle_private_details d join app.request_vehicles v on v.id=d.vehicle_id where v.request_id=r.id and v.removed_at is null;
 update app.offers set status=case when id=o.id then 'accepted' else 'not_selected' end where request_id=r.id and status='pending';
 update app.conversations set status=case when id=thread then 'active' else 'archived' end where request_id=r.id;
 update app.transport_requests set status='booked' where id=r.id;
 perform private.append_commercial_event('offer.accepted',o.id,thread,result,'booking:'||result||':accepted','Pasiūlymas priimtas',jsonb_build_object('offer_version',o.current_version));
 perform private.append_commercial_event('booking.created',o.id,thread,result,'booking:'||result||':created',null,jsonb_build_object('vehicle_count',count_vehicles));
 insert into app.audit_log(actor_id,action,entity_type,entity_id,correlation_id,change_summary)
 values(private.request_user_id(),'booking.created','booking',result,gen_random_uuid(),'{"fields":["agreement","capacity_reserved"]}');
 return jsonb_build_object('booking_id',result,'replayed',false);
end;
$$;
revoke execute on function api.accept_offer(uuid,integer,integer,integer) from public,anon,authenticated,service_role;
grant execute on function api.accept_offer(uuid,integer,integer,integer) to authenticated;

-- These commands serialize on the immutable Request parent before thread locks.
create function api.send_message(p_conversation_id uuid,p_body text,p_client_key uuid) returns uuid
language plpgsql security definer set search_path='' set lock_timeout='5s' set statement_timeout='15s' as $$
declare caller uuid; c app.conversations%rowtype; result uuid; prior app.messages%rowtype;
begin
 caller:=private.require_active_user(false);
 select * into c from app.conversations where id=p_conversation_id;
 if not found then raise exception 'Not authorized' using errcode='42501'; end if;
 perform 1 from app.transport_requests where id=c.request_id for update;
 perform 1 from app.conversations where id=c.id for update;
 if not private.can_read_conversation(c.id) then raise exception 'Not authorized' using errcode='42501'; end if;
 select * into prior from app.messages where sender_user_id=caller and client_message_key=p_client_key;
 if found then
   if prior.conversation_id<>c.id or prior.body is distinct from btrim(p_body) then raise exception 'Message key conflict' using errcode='22023'; end if;
   return prior.id;
 end if;
 if private.effective_conversation_status(c.id)<>'active' then raise exception 'Conversation is read-only' using errcode='42501'; end if;
 insert into app.messages(conversation_id,sequence,kind,sender_user_id,sender_side,body,client_message_key)
 select c.id,coalesce(max(sequence),0)+1,'user',caller,case when private.owns_request(c.request_id) then 'customer' else 'carrier' end,btrim(p_body),p_client_key
 from app.messages where conversation_id=c.id returning id into result;
 update app.conversations set last_message_at=clock_timestamp() where id=c.id;
 perform private.append_commercial_event('message.created',c.current_offer_id,c.id,null,'message:'||result,null,jsonb_build_object('message_id',result));
 return result;
end;
$$;
create function api.mark_conversation_read(p_conversation_id uuid,p_sequence bigint) returns void
language plpgsql security definer set search_path='' set lock_timeout='5s' as $$
declare caller uuid;
begin
 caller:=private.require_active_user(false);
 if not private.can_read_conversation(p_conversation_id) then raise exception 'Not authorized' using errcode='42501'; end if;
 insert into app.conversation_reads(conversation_id,user_id,last_read_sequence) values(p_conversation_id,caller,p_sequence)
 on conflict(conversation_id,user_id) do update set last_read_sequence=greatest(app.conversation_reads.last_read_sequence,excluded.last_read_sequence);
end;
$$;
create function api.decline_offer(p_offer_id uuid,p_expected_version integer) returns void
language plpgsql security definer set search_path='' set lock_timeout='5s' as $$
declare o app.offers%rowtype; thread uuid;
begin
 perform private.require_active_user(true);
 select * into o from app.offers where id=p_offer_id;
 if not found or not private.owns_request(o.request_id) then raise exception 'Not authorized' using errcode='42501'; end if;
 perform 1 from app.transport_requests where id=o.request_id for update;
 select * into o from app.offers where id=p_offer_id for update;
 if o.current_version is distinct from p_expected_version or private.effective_offer_status(o.id)<>'pending' then raise exception 'Offer unavailable; reload' using errcode='40001'; end if;
 select id into thread from app.conversations where current_offer_id=o.id for update;
 update app.offers set status='declined' where id=o.id;
 update app.conversations set status='archived' where id=thread;
 perform private.append_commercial_event('offer.declined',o.id,thread,null,'offer:'||o.id||':'||o.current_version||':declined','Pasiūlymas atmestas');
 insert into app.audit_log(actor_id,action,entity_type,entity_id,correlation_id,change_summary) values(private.request_user_id(),'offer.declined','offer',o.id,gen_random_uuid(),'{"fields":["status"]}');
end;
$$;
revoke execute on function api.send_message(uuid,text,uuid),api.mark_conversation_read(uuid,bigint),api.decline_offer(uuid,integer) from public,anon,authenticated,service_role;
grant execute on function api.send_message(uuid,text,uuid),api.mark_conversation_read(uuid,bigint),api.decline_offer(uuid,integer) to authenticated;

-- Selected carrier can continue its winning thread after the Request is booked.
create policy requests_booking_command on app.transport_requests to parvezk_commands using(exists(select 1 from app.bookings b where b.request_id=transport_requests.id and private.can_read_booking(b.id))) with check(true);
create policy bookings_carrier_command_read on app.bookings for select to parvezk_commands using(private.is_carrier_owner(carrier_id));
-- Acceptance rechecks membership after its carrier lock, without private roster exposure.
create policy membership_acceptance_read on app.carrier_memberships for select to parvezk_commands using(exists(select 1 from app.offers o where o.carrier_id=carrier_memberships.carrier_id and private.owns_request(o.request_id)));

grant parvezk_authorization,parvezk_commands to current_user with inherit false;
grant parvezk_authorization,parvezk_commands to current_user with set true;
grant create on schema private to parvezk_authorization;
grant create on schema api to parvezk_commands;
alter function private.offer_carrier_eligible(uuid) owner to parvezk_authorization;
alter function private.lock_commercial_profiles(uuid) owner to parvezk_authorization;
alter function private.route_fits_request(uuid,uuid,date,date) owner to parvezk_authorization;
alter function private.effective_offer_status(uuid) owner to parvezk_authorization;
alter function private.effective_conversation_status(uuid) owner to parvezk_authorization;
alter function api.submit_offer(uuid,uuid,jsonb,integer,integer,integer) owner to parvezk_commands;
alter function api.accept_offer(uuid,integer,integer,integer) owner to parvezk_commands;
alter function api.send_message(uuid,text,uuid) owner to parvezk_commands;
alter function api.mark_conversation_read(uuid,bigint) owner to parvezk_commands;
alter function api.decline_offer(uuid,integer) owner to parvezk_commands;
revoke create on schema private from parvezk_authorization;
revoke create on schema api from parvezk_commands;
revoke set option for parvezk_authorization,parvezk_commands from current_user;
commit;
