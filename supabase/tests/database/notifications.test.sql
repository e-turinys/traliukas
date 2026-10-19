begin;
create extension if not exists pgtap with schema extensions;
select extensions.no_plan();
insert into auth.users(id,email,phone,phone_confirmed_at) select ('81000000-0000-0000-0000-00000000000'||n)::uuid,'lifecycle-'||n||'@example.test','3706998800'||n,now() from generate_series(1,4) n;
insert into auth.sessions(id,user_id) select ('82000000-0000-0000-0000-00000000000'||n)::uuid,('81000000-0000-0000-0000-00000000000'||n)::uuid from generate_series(1,4) n;
update app.profiles set beta_access=true,display_name='Transaction user',preferred_locale='lt' where id::text like '81000000-%';
insert into app.carriers(id,slug,display_name,visibility) select ('83000000-0000-0000-0000-00000000000'||n)::uuid,'lifecycle-carrier-'||n,'Transaction Carrier '||n,'published' from generate_series(1,2) n;
insert into app.carrier_memberships(carrier_id,user_id,role) select ('83000000-0000-0000-0000-00000000000'||n)::uuid,('81000000-0000-0000-0000-00000000000'||(n+1))::uuid,'owner' from generate_series(1,2) n;
insert into app.carrier_private_details(carrier_id,legal_name,business_kind,registration_country)
select id,'Private legal identity',case when slug='lifecycle-carrier-1' then 'individual' else 'company' end,'LT' from app.carriers;
insert into app.carrier_verifications(carrier_id,category,status,reviewed_by,reviewed_at,expires_at)
select id,case when slug='lifecycle-carrier-1' then 'identity' else 'company' end,'approved','81000000-0000-0000-0000-000000000004',now(),now()+interval '60 days' from app.carriers;
insert into app.carrier_routes(id,carrier_id,date_from,date_to,capacity_total,supported_categories,status,published_at)
select ('84000000-0000-0000-0000-00000000000'||n)::uuid,('83000000-0000-0000-0000-00000000000'||n)::uuid,current_date+30,current_date+35,8,array['car'],'published',now() from generate_series(1,2) n;
insert into app.route_stops(route_id,position,location_id)
select r.id,p.position,l.id from app.carrier_routes r cross join (values(0,'hamburg-de'),(1,'kaunas-lt')) p(position,slug) join app.public_locations l on l.slug=p.slug;
insert into app.route_revisions(route_id,version,changed_by,public_terms_snapshot)
select r.id,1,m.user_id,jsonb_build_object('stops',(select jsonb_agg(location_id order by position) from app.route_stops where route_id=r.id),
'date_from',r.date_from,'date_to',r.date_to,'capacity_total',r.capacity_total,'supported_categories',r.supported_categories,'supports_non_running',false,'route_flexible',false)
from app.carrier_routes r join app.carrier_memberships m on m.carrier_id=r.carrier_id;
insert into app.transport_requests(id,customer_id,status,visibility,default_pickup_location_id,default_delivery_location_id,pickup_kind,terms_version,terms_accepted_at,published_at,client_publish_key)
select '85000000-0000-0000-0000-000000000001','81000000-0000-0000-0000-000000000001','active','marketplace',a.id,b.id,'anytime','test',now(),now(),gen_random_uuid()
from app.public_locations a,app.public_locations b where a.slug='hamburg-de' and b.slug='kaunas-lt';
insert into app.request_vehicles(id,request_id,position,category,make,model,condition,pickup_location_id,delivery_location_id)
select ('86000000-0000-0000-0000-00000000000'||n)::uuid,id,n,'car','Test','Car','running',default_pickup_location_id,default_delivery_location_id from app.transport_requests cross join generate_series(1,2) n;
insert into app.request_vehicle_private_details(vehicle_id,side,instructions) select id,'pickup','PRIVATE pickup instruction' from app.request_vehicles;
insert into app.request_revisions(request_id,version,changed_by,public_terms_snapshot)
values('85000000-0000-0000-0000-000000000001',1,'81000000-0000-0000-0000-000000000001','{}');
set constraints all immediate;
set constraints all deferred;
create function pg_temp.login(n integer) returns void language sql as $$select set_config('request.jwt.claims',jsonb_build_object('sub','81000000-0000-0000-0000-00000000000'||n,'session_id','82000000-0000-0000-0000-00000000000'||n)::text,true)::text::void$$;
create function pg_temp.terms() returns jsonb language sql as $$select jsonb_build_object('total_price',500,'currency','EUR','planned_pickup_date',current_date+31,'planned_delivery_date',current_date+33,'payment_terms','On delivery','expires_at',now()+interval '1 day')$$;
create function pg_temp.submit(n integer,version integer default null) returns uuid language sql as $$select api.submit_offer('85000000-0000-0000-0000-000000000001',('84000000-0000-0000-0000-00000000000'||n)::uuid,pg_temp.terms(),1,1,version)$$;
create function pg_temp.offer(n integer) returns uuid language sql as $$select id from app.offers where carrier_id=('83000000-0000-0000-0000-00000000000'||n)::uuid$$;
create function pg_temp.thread(n integer) returns uuid language sql as $$select id from app.conversations where carrier_id=('83000000-0000-0000-0000-00000000000'||n)::uuid$$;
create function pg_temp.accept() returns jsonb language sql as $$select api.accept_offer(pg_temp.offer(1),2,1,1)$$;


-- Exercise real domain commands; only identity/Route/Request setup is privileged.
set local role authenticated;
select pg_temp.login(2);
select extensions.lives_ok($$select pg_temp.submit(1)$$,'Offer creates notification in its transaction');
select extensions.is((select count(*)::int from api.notifications),0,'Offer actor receives none');
select pg_temp.login(1);
select extensions.is((select count(*)::int from api.notifications),1,'Customer sees own notification');
select extensions.is((select title from api.notifications),'Naujas pasiūlymas','saved LT preference renders required title');
select extensions.is((select href from api.notifications),'/offers/'||pg_temp.offer(1)::text,'canonical Offer href is stored');
select extensions.throws_ok($$insert into app.notifications default values$$,'42501',null,'client cannot insert authoritative notifications');
select extensions.throws_ok($$update app.notifications set title='forged'$$,'42501',null,'client cannot edit content');
select extensions.throws_ok($$update app.notifications set read_at=now()$$,'42501',null,'direct read-state writes denied');
reset role;
create temp table first_notification as select id,recipient_id from app.notifications;
grant select on first_notification to authenticated;
set local role authenticated;
select pg_temp.login(4);
select extensions.is((select count(*)::int from api.notifications),0,'unrelated Customer sees none');
select extensions.throws_ok($$select api.mark_notifications_read((select id from first_notification))$$,'42501',null,'cannot mark another recipient read');
select extensions.lives_ok($$select api.mark_notifications_read()$$,'mark-all with no own notifications is harmless');
select pg_temp.login(1);
select extensions.is((select count(*)::int from api.notifications where read_at is not null),0,'cross-user mark-all changes nothing');
select extensions.lives_ok($$select api.mark_notifications_read((select id from first_notification))$$,'own mark-one succeeds');
select extensions.is((select count(*)::int from api.notifications where read_at is not null),1,'read timestamp persists');
select extensions.is(api.mark_notifications_read((select id from first_notification)),(select read_at from api.notifications limit 1),'read retry preserves original timestamp');
select pg_temp.login(2);
select extensions.lives_ok($$select pg_temp.submit(1,1)$$,'Offer revision persists');
select extensions.lives_ok($$select api.send_message(pg_temp.thread(1),'PRIVATE message body','89000000-0000-0000-0000-000000000001')$$,'Carrier sends message');
select extensions.lives_ok($$select api.send_message(pg_temp.thread(1),'PRIVATE message body','89000000-0000-0000-0000-000000000001')$$,'identical message retry succeeds');
select pg_temp.login(1);
select extensions.is((select count(*)::int from api.notifications where event_type='offer.updated'),1,'one revision notification');
select extensions.is((select count(*)::int from api.notifications where event_type='message.created'),1,'message retry does not duplicate notification');
select extensions.is((select href from api.notifications where event_type='message.created'),'/messages/'||pg_temp.thread(1)::text,'stored Conversation destination');
select extensions.ok(not exists(select 1 from api.notifications where body like '%PRIVATE%'),'notification excludes private message contents');
select extensions.lives_ok($$select api.send_message(pg_temp.thread(1),'Customer reply','89000000-0000-0000-0000-000000000002')$$,'Customer reply succeeds');
select extensions.is((select count(*)::int from api.notifications where event_type='message.created'),1,'Customer not notified of own reply');
reset role;
create function pg_temp.fail_notification() returns trigger language plpgsql as $$begin raise exception 'forced notification failure'; end$$;
create trigger fail_notification before insert on app.notifications for each row execute function pg_temp.fail_notification();
set local role authenticated;
select pg_temp.login(1);
select extensions.throws_ok($$select api.send_message(pg_temp.thread(1),'Must roll back','89000000-0000-0000-0000-000000000003')$$,'P0001','forced notification failure','notification failure aborts domain command');
reset role;
select extensions.is((select count(*)::int from app.messages where client_message_key='89000000-0000-0000-0000-000000000003'),0,'message rolled back with notification failure');
drop trigger fail_notification on app.notifications;
set local role authenticated;
select pg_temp.login(1);
select extensions.lives_ok($$select pg_temp.accept()$$,'acceptance creates canonical notification');
select extensions.lives_ok($$select pg_temp.accept()$$,'acceptance retry is safe');
select extensions.is((select count(*)::int from api.notifications where event_type='booking.created'),0,'Customer acceptance suppresses self notification');
select pg_temp.login(2);
select extensions.is((select count(*)::int from api.notifications where event_type='message.created'),1,'Carrier receives Customer reply only');
select extensions.is((select count(*)::int from api.notifications where event_type='booking.created'),1,'Carrier receives exactly one booking.created');
select extensions.is((select count(*)::int from api.notifications where event_type='offer.accepted'),0,'no offer.accepted notification');
reset role;
create temp table original as select *,1 as n from app.bookings;
grant select on original to authenticated;
create function pg_temp.bid() returns uuid language sql as $$select id from original$$;
create function pg_temp.pickups() returns jsonb language sql as $$select jsonb_agg(jsonb_build_object('vehicle_id',v->>'id','street','Private street','contact_name','Private contact','contact_phone','+37060000000','scheduled_from','2030-01-01T10:00:00Z','scheduled_to','2030-01-01T12:00:00Z')) from original,jsonb_array_elements(agreement_snapshot->'vehicles') v$$;
set local role authenticated;
select pg_temp.login(2);
select api.transition_booking(pg_temp.bid(),1,'pickup_scheduled',pg_temp.pickups());
select api.transition_booking(pg_temp.bid(),1,'pickup_scheduled',pg_temp.pickups());
select api.transition_booking(pg_temp.bid(),2,'collected');
select api.transition_booking(pg_temp.bid(),3,'in_transit');
select api.transition_booking(pg_temp.bid(),4,'delivered');
select pg_temp.login(1);
select extensions.is((select count(*)::int from api.notifications where event_type in ('booking.pickupScheduled','booking.collected','booking.inTransit','booking.delivered')),4,'all four Carrier lifecycle events reach Customer once');
select extensions.ok(not exists(select 1 from api.notifications where event_type like 'booking.%' and href<>'/bookings/'||pg_temp.bid()::text),'lifecycle href uses real Booking');
select api.transition_booking(pg_temp.bid(),5,'completed');
select api.transition_booking(pg_temp.bid(),5,'completed');
select extensions.is((select count(*)::int from api.notifications where event_type='booking.completed'),0,'Customer completion suppresses self');
select pg_temp.login(2);
select extensions.is((select count(*)::int from api.notifications where event_type='booking.completed'),1,'Carrier gets completion once');
select extensions.is((select count(*)::int from api.notifications where event_type in ('booking.pickupScheduled','booking.collected','booking.inTransit','booking.delivered')),0,'Carrier does not get own lifecycle events');
select extensions.lives_ok($$select api.mark_notifications_read()$$,'mark all own notifications succeeds');
select extensions.is((select count(*)::int from api.notifications where read_at is null),0,'all own notifications read');
select pg_temp.login(1);
select extensions.ok(exists(select 1 from api.notifications where read_at is null),'other recipient unread state unchanged');
reset role;
select extensions.is((select capacity_reserved from app.carrier_routes where id='84000000-0000-0000-0000-000000000001'),2,'completion still retains capacity');
select extensions.ok(not exists(select 1 from app.notifications where recipient_id=actor_id),'all persisted events suppress actors');
-- Test event re-processing by firing the same projection twice for one new event.
-- Trusted test executor temporarily receives trigger-creation permission only.
select set_config('test.executor',current_user,true);
grant parvezk_notifications to current_user with set true;
set local role parvezk_notifications;
do $$begin execute format('grant execute on function private.notify_domain_event() to %I',current_setting('test.executor')); end$$;
reset role;
create trigger notification_test_replay after insert on app.domain_events for each row execute function private.notify_domain_event();
-- A new independent agreement allows real cancellation, not a forged status update.
insert into app.transport_requests(id,customer_id,status,visibility,default_pickup_location_id,default_delivery_location_id,pickup_kind,terms_version,terms_accepted_at,published_at,client_publish_key)
select '85000000-0000-0000-0000-000000000002',customer_id,'active',visibility,default_pickup_location_id,default_delivery_location_id,pickup_kind,terms_version,now(),now(),gen_random_uuid() from app.transport_requests;
insert into app.request_vehicles(request_id,position,category,make,model,condition,pickup_location_id,delivery_location_id)
select '85000000-0000-0000-0000-000000000002',position,category,make,model,condition,pickup_location_id,delivery_location_id from app.request_vehicles;
insert into app.request_revisions(request_id,version,changed_by,public_terms_snapshot) values('85000000-0000-0000-0000-000000000002',1,'81000000-0000-0000-0000-000000000001','{}');
set constraints all immediate;
set constraints all deferred;
set local role authenticated;
select pg_temp.login(2);
select api.submit_offer('85000000-0000-0000-0000-000000000002','84000000-0000-0000-0000-000000000001',pg_temp.terms(),1,1);
select pg_temp.login(1);
select api.accept_offer(id,1,1,1) from api.offers where request_id='85000000-0000-0000-0000-000000000002';
savepoint carrier_cancel;
select pg_temp.login(2);
select api.cancel_booking(id,1,'Carrier cancellation') from api.bookings where request_id='85000000-0000-0000-0000-000000000002';
select pg_temp.login(1);
select extensions.is((select count(*)::int from api.notifications where event_type='booking.cancelled'),1,'Carrier cancellation notifies Customer');
rollback to savepoint carrier_cancel;
select api.cancel_booking(id,1,'PRIVATE cancellation') from api.bookings where request_id='85000000-0000-0000-0000-000000000002';
select api.cancel_booking(id,1,'PRIVATE cancellation') from api.bookings where request_id='85000000-0000-0000-0000-000000000002';
select extensions.is((select count(*)::int from api.notifications where event_type='booking.cancelled'),0,'Customer cancellation suppresses actor');
select pg_temp.login(2);
select extensions.is((select count(*)::int from api.notifications where event_type='booking.cancelled'),1,'cancellation retry and repeated projection notify other party once');
reset role;
select extensions.is((select capacity_reserved from app.carrier_routes where id='84000000-0000-0000-0000-000000000001'),2,'cancellation only releases its own reservation');
select extensions.ok(not exists(select 1 from app.notifications where body like '%PRIVATE%'),'no private cancellation/operation content');
select extensions.throws_ok($$update app.notifications set href='https://evil.test'$$,'23514',null,'immutable stored href');
select extensions.throws_ok($$update app.notifications set read_at=null where read_at is not null$$,'23514',null,'read state cannot go backwards');
select extensions.throws_ok($$delete from app.notifications$$,'23514',null,'no notification deletion');
set local role anon;
select extensions.throws_ok($$select * from api.notifications$$,'42501',null,'anonymous has no feed access');
select extensions.throws_ok($$select api.mark_notifications_read()$$,'42501',null,'anonymous cannot mark read');
reset role;
update app.profiles set account_status='suspended' where id='81000000-0000-0000-0000-000000000001';
set local role authenticated;
select pg_temp.login(1);
select extensions.is((select count(*)::int from api.notifications),0,'suspended account cannot read feed');
select extensions.throws_ok($$select api.mark_notifications_read()$$,'42501',null,'suspended account cannot mark read');
reset role;
update app.profiles set account_status='active' where id='81000000-0000-0000-0000-000000000001';
delete from auth.sessions where user_id='81000000-0000-0000-0000-000000000001';
set local role authenticated;
select extensions.is((select count(*)::int from api.notifications),0,'revoked session has no feed');
select extensions.throws_ok($$select api.mark_notifications_read()$$,'42501',null,'revoked session cannot mark read');
reset role;
select * from extensions.finish();
rollback;
