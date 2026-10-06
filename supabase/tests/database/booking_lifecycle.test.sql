begin;
create extension if not exists pgtap with schema extensions;
select extensions.no_plan();
insert into auth.users(id,email,phone,phone_confirmed_at) select ('81000000-0000-0000-0000-00000000000'||n)::uuid,'lifecycle-'||n||'@example.test','3706998800'||n,now() from generate_series(1,4) n;
insert into auth.sessions(id,user_id) select ('82000000-0000-0000-0000-00000000000'||n)::uuid,('81000000-0000-0000-0000-00000000000'||n)::uuid from generate_series(1,4) n;
update app.profiles set beta_access=true,display_name='Transaction user' where id::text like '81000000-%';
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


-- Three additional independent two-vehicle agreements on the same route.
insert into app.transport_requests(id,customer_id,status,visibility,default_pickup_location_id,default_delivery_location_id,pickup_kind,terms_version,terms_accepted_at,published_at,client_publish_key)
select ('85000000-0000-0000-0000-00000000000'||n)::uuid,customer_id,'active',visibility,default_pickup_location_id,default_delivery_location_id,pickup_kind,terms_version,now(),now(),gen_random_uuid() from app.transport_requests cross join generate_series(2,4) n;
insert into app.request_vehicles(id,request_id,position,category,make,model,condition,pickup_location_id,delivery_location_id)
select gen_random_uuid(),r.id,n,'car','Test','Car','running',default_pickup_location_id,default_delivery_location_id from app.transport_requests r cross join generate_series(1,2) n where r.id<>'85000000-0000-0000-0000-000000000001';
insert into app.request_revisions(request_id,version,changed_by,public_terms_snapshot) select id,1,customer_id,'{}' from app.transport_requests where id<>'85000000-0000-0000-0000-000000000001';
set local role authenticated;
select pg_temp.login(2);
select api.submit_offer(id,'84000000-0000-0000-0000-000000000001',pg_temp.terms(),1,1) from app.transport_requests;
select pg_temp.login(1);
select api.accept_offer(id,1,1,1) from app.offers;
reset role;
set constraints all immediate;
set constraints all deferred;
create temp table original as select *,right(request_id::text,1)::integer as n from app.bookings;
grant select on original to authenticated;
create function pg_temp.bid(n integer default 1) returns uuid language sql as $$select id from original o where o.n=$1$$;
create function pg_temp.pickups(n integer default 1) returns jsonb language sql as $$select jsonb_agg(jsonb_build_object('vehicle_id',v->>'id','street','Private street 1','contact_name','Private person','contact_phone','+37060000000','scheduled_from','2030-01-01T10:00:00Z','scheduled_to','2030-01-01T12:00:00Z')) from original o, jsonb_array_elements(o.agreement_snapshot->'vehicles') v where o.n=$1$$;
create function pg_temp.move(version integer, next_status text, n integer default 1) returns jsonb language sql as $$select api.transition_booking(pg_temp.bid(n),version,next_status,case when next_status='pickup_scheduled' then pg_temp.pickups(n) else null end)$$;
create function pg_temp.cancel(n integer default 1, version integer default 1) returns jsonb language sql as $$select api.cancel_booking(pg_temp.bid(n),version,'Local cancellation reason')$$;
set local role authenticated;
select pg_temp.login(1);
select extensions.is((select count(*)::int from api.bookings),4,'Customer reads four own agreements');
select extensions.throws_ok($$select pg_temp.move(1,'pickup_scheduled')$$,'42501',null,'Customer cannot schedule pickup');
select extensions.throws_ok($$update app.bookings set status='completed' where id=pg_temp.bid()$$,'42501',null,'ordinary client cannot mutate Booking');
select extensions.throws_ok($$select * from app.booking_vehicle_operations$$,'42501',null,'private operations have no direct client access');
select pg_temp.login(3);
select extensions.is((select count(*)::int from api.bookings),0,'unrelated Carrier cannot read Booking');
select extensions.throws_ok($$select pg_temp.move(1,'pickup_scheduled')$$,'42501',null,'unrelated Carrier cannot progress');
select extensions.throws_ok($$select pg_temp.cancel()$$,'42501',null,'unrelated Carrier cannot cancel');
select extensions.throws_ok($$select api.booking_pickups(pg_temp.bid())$$,'42501',null,'unrelated Carrier cannot read private pickup data');
select pg_temp.login(4);
select extensions.is((select count(*)::int from api.bookings),0,'unrelated Customer cannot read Booking');
select extensions.throws_ok($$select pg_temp.cancel()$$,'42501',null,'unrelated Customer cannot cancel');
select extensions.throws_ok($$select api.booking_pickups(pg_temp.bid())$$,'42501',null,'unrelated Customer cannot read private pickup data');
select pg_temp.login(2);
select extensions.throws_ok($$select pg_temp.move(1,'delivered')$$,'23514',null,'Booked to Delivered skip rejected');
select extensions.throws_ok($$select api.transition_booking(pg_temp.bid(),1,'pickup_scheduled')$$,'22023',null,'scheduling requires complete operational details');
select extensions.throws_ok($$select api.transition_booking(pg_temp.bid(),1,'pickup_scheduled',jsonb_build_array(pg_temp.pickups()->0))$$,'22023',null,'partial pickup data rejected');
select extensions.throws_ok($$select api.transition_booking(pg_temp.bid(),1,'pickup_scheduled',jsonb_build_array(pg_temp.pickups()->0,pg_temp.pickups()->0))$$,'22023',null,'duplicate vehicle pickup data rejected');
select extensions.lives_ok($$select pg_temp.move(1,'pickup_scheduled')$$,'selected Carrier schedules all pickups');
select extensions.is((select status from api.bookings where id=pg_temp.bid()),'pickup_scheduled','PickupScheduled persists');
select extensions.is(jsonb_array_length(api.booking_pickups(pg_temp.bid())),2,'Carrier reads two private pickups');
select extensions.is(pg_temp.move(1,'pickup_scheduled')->>'replayed','true','exact retry is safe');
select extensions.is((select status_version from api.bookings where id=pg_temp.bid()),2,'retry does not increment version');
select extensions.throws_ok($$select api.transition_booking(pg_temp.bid(),1,'pickup_scheduled',jsonb_set(pg_temp.pickups(),'{0,street}','"Different street"'))$$,'40001',null,'changed payload cannot replay prior command');
select pg_temp.login(1);
select extensions.is(jsonb_array_length(api.booking_pickups(pg_temp.bid())),2,'Customer reads pickup details');
select extensions.throws_ok($$select pg_temp.move(2,'collected')$$,'42501',null,'Customer cannot mark Collected');
select extensions.throws_ok($$select pg_temp.move(2,'completed')$$,'23514',null,'PickupScheduled cannot skip to Completed');
select pg_temp.login(2);
select extensions.lives_ok($$select pg_temp.move(2,'collected')$$,'selected Carrier marks Collected');
select extensions.throws_ok($$select pg_temp.move(3,'pickup_scheduled')$$,'23514',null,'backwards transition rejected');
select extensions.throws_ok($$select pg_temp.move(3,'booked')$$,'22023',null,'Collected to Booked rejected');
select extensions.throws_ok($$select pg_temp.move(1,'pickup_scheduled')$$,'40001',null,'old retry cannot overwrite later progress');
select extensions.throws_ok($$select pg_temp.cancel(1,3)$$,'23514',null,'Carrier cancellation after collection rejected');
select pg_temp.login(1);
select extensions.throws_ok($$select pg_temp.cancel(1,3)$$,'23514',null,'Customer cancellation after collection rejected');
select extensions.throws_ok($$select pg_temp.move(3,'in_transit')$$,'42501',null,'Customer cannot mark InTransit');
select pg_temp.login(2);
select extensions.is((select capacity_reserved from api.my_routes where id='84000000-0000-0000-0000-000000000001'),8,'failed cancellations release no capacity');
select extensions.lives_ok($$select pg_temp.move(3,'in_transit')$$,'selected Carrier marks InTransit');
select pg_temp.login(1);
select extensions.throws_ok($$select pg_temp.move(4,'delivered')$$,'42501',null,'Customer cannot mark Delivered');
select pg_temp.login(2);
select extensions.lives_ok($$select pg_temp.move(4,'delivered')$$,'selected Carrier marks Delivered');
select extensions.throws_ok($$select pg_temp.move(5,'completed')$$,'42501',null,'Carrier cannot confirm Customer receipt');
select extensions.is((select status from api.conversations where booking_id=pg_temp.bid()),'active','winning Conversation stays active until completion');
select extensions.lives_ok($$select api.send_message((select conversation_id from original where n=1),'Delivery ready',gen_random_uuid())$$,'text messages work while active');
select pg_temp.login(1);
select extensions.lives_ok($$select pg_temp.move(5,'completed')$$,'Customer confirms Delivered to Completed');
select extensions.is(pg_temp.move(5,'completed')->>'replayed','true','Customer completion retry is idempotent');
select extensions.throws_ok($$select pg_temp.move(6,'completed')$$,'23514',null,'Completed cannot progress again');
select extensions.is((select status from api.bookings where id=pg_temp.bid()),'completed','completed Booking exposed to dashboard');
select extensions.is((select status from api.my_requests where id=(select request_id from original where n=1)),'completed','Request becomes completed for history');
select extensions.is((select status from api.conversations where booking_id=pg_temp.bid()),'completed','Conversation becomes historical');
select extensions.throws_ok($$select api.send_message((select conversation_id from original where n=1),'No more text',gen_random_uuid())$$,'42501',null,'completed Conversation rejects new messages');
select pg_temp.login(2);
select extensions.is((select capacity_reserved from api.my_routes where id='84000000-0000-0000-0000-000000000001'),8,'Completed does not release historical trip capacity');

-- Customer cancels Booked; Carrier cancels PickupScheduled.
select pg_temp.login(1);
select extensions.throws_ok($$select api.cancel_booking(pg_temp.bid(2),1,' ')$$,'22023',null,'cancellation requires a reason');
select extensions.throws_ok($$select pg_temp.cancel(2,99)$$,'40001',null,'stale cancellation rejected');
select extensions.lives_ok($$select pg_temp.cancel(2)$$,'Customer may cancel Booked');
select extensions.is(pg_temp.cancel(2)->>'replayed','true','Customer cancellation retry is safe');
select extensions.throws_ok($$select api.cancel_booking(pg_temp.bid(2),1,'Changed reason')$$,'40001',null,'changed reason cannot replay cancellation');
select extensions.is((select status from api.bookings where id=pg_temp.bid(2)),'cancelled','cancellation is terminal exception');
select extensions.is((select status from api.my_requests where id=(select request_id from original where n=2)),'closed','cancelled Request is historical');
select extensions.is((select status from api.conversations where booking_id=pg_temp.bid(2)),'archived','cancelled Conversation archived');
select extensions.throws_ok($$select api.send_message((select conversation_id from original where n=2),'No more text',gen_random_uuid())$$,'42501',null,'cancelled Conversation rejects messages');
select pg_temp.login(2);
select extensions.is((select capacity_reserved from api.my_routes where id='84000000-0000-0000-0000-000000000001'),6,'Customer cancellation releases exactly two slots once');
select extensions.throws_ok($$select pg_temp.cancel(2)$$,'40001',null,'different actor cannot replay cancellation');
select extensions.throws_ok($$select pg_temp.move(2,'pickup_scheduled',2)$$,'23514',null,'cancelled Booking cannot restart');
select extensions.lives_ok($$select pg_temp.move(1,'pickup_scheduled',3)$$,'third Booking scheduled');
select extensions.lives_ok($$select pg_temp.cancel(3,2)$$,'Carrier may cancel PickupScheduled');
select extensions.is(pg_temp.cancel(3,2)->>'replayed','true','Carrier cancellation retry safe');
select extensions.is((select capacity_reserved from api.my_routes where id='84000000-0000-0000-0000-000000000001'),4,'Carrier cancellation releases exact count once');

reset role;
-- Force a late transaction failure after capacity/Booking writes.
create function pg_temp.reject_cancel_event() returns trigger language plpgsql as $$begin if new.event_type='booking.cancelled' then raise exception 'Injected event failure' using errcode='23514'; end if; return new; end$$;
create trigger test_cancel_rollback before insert on app.domain_events for each row execute function pg_temp.reject_cancel_event();
set local role authenticated;
select pg_temp.login(1);
select extensions.throws_ok($$select pg_temp.cancel(4)$$,'23514','Injected event failure','late failure rolls entire cancellation back');
select extensions.is((select status from api.bookings where id=pg_temp.bid(4)),'booked','failed cancellation leaves Booking unchanged');
select extensions.is((select status from api.conversations where booking_id=pg_temp.bid(4)),'active','failed cancellation keeps Conversation active');
select pg_temp.login(2);
select extensions.is((select capacity_reserved from api.my_routes where id='84000000-0000-0000-0000-000000000001'),4,'late failure releases nothing');
reset role;
drop trigger test_cancel_rollback on app.domain_events;
select extensions.ok(not exists(select 1 from app.bookings b join original o on o.id=b.id where b.agreement_snapshot<>o.agreement_snapshot or b.agreed_total_price<>o.agreed_total_price or b.payment_terms<>o.payment_terms),'all immutable agreements unchanged');
select extensions.is((select count(*)::int from app.booking_actions),8,'receipts exactly once per committed action');
select extensions.is((select count(*)::int from app.audit_log where action='booking.cancelled'),2,'cancel audit exactly once per cancellation');
select extensions.is((select count(*)::int from app.domain_events where event_type='booking.cancelled'),2,'cancel events exactly once');
select extensions.ok(not exists(select 1 from app.domain_events where payload::text like '%Private%' or payload::text like '%Local cancellation reason%'),'events contain no private pickup or reason data');
select extensions.ok((select bool_and(cancelled_at is not null and capacity_released_at is not null) from app.bookings where status='cancelled'),'cancellation and release timestamps recorded together');
select extensions.is((select count(*)::int from app.booking_actions where booking_id=pg_temp.bid(4)),0,'failed cancellation has no receipt');
select extensions.is((select count(*)::int from app.audit_log where action='booking.pickups_read'),2,'authorized private pickup reads audited, denied reads expose nothing');
set constraints all immediate;
select extensions.pass('deferred capacity reconciliation holds for completed and cancelled Bookings');
set constraints all deferred;
-- Revoked Auth session and suspended caller are not accepted.
update app.profiles set account_status='suspended' where id='81000000-0000-0000-0000-000000000002';
set local role authenticated;
select pg_temp.login(2);
select extensions.throws_ok($$select pg_temp.move(1,'pickup_scheduled',4)$$,'42501',null,'suspended caller cannot progress');
reset role;
update app.profiles set account_status='active' where id='81000000-0000-0000-0000-000000000002';
update app.carriers set suspended_at=now() where id='83000000-0000-0000-0000-000000000001';
set local role authenticated;
select extensions.throws_ok($$select pg_temp.move(1,'pickup_scheduled',4)$$,'42501',null,'suspended Carrier cannot progress');
reset role;
update app.carriers set suspended_at=null where id='83000000-0000-0000-0000-000000000001';
update app.carrier_verifications set expires_at=now()-interval '1 day' where carrier_id='83000000-0000-0000-0000-000000000001';
update app.profiles set beta_access=false where id='81000000-0000-0000-0000-000000000002';
set local role authenticated;
select extensions.lives_ok($$select pg_temp.move(1,'pickup_scheduled',4)$$,'expired new-Offer eligibility does not strand existing commitments');
select pg_temp.login(1);
select extensions.lives_ok($$select pg_temp.cancel(4,2)$$,'Customer can also cancel PickupScheduled');
reset role;
delete from auth.sessions where id='82000000-0000-0000-0000-000000000002';
set local role authenticated;
select pg_temp.login(2);
select extensions.throws_ok($$select pg_temp.move(1,'pickup_scheduled',4)$$,'42501',null,'stale session cannot progress');
reset role;
select * from extensions.finish();
rollback;
