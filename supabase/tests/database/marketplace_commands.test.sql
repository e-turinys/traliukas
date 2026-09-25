begin;
create extension if not exists pgtap with schema extensions;
select extensions.no_plan();
insert into auth.users(id,email,phone,phone_confirmed_at) select ('71000000-0000-0000-0000-00000000000'||n)::uuid,'transaction-'||n||'@example.test','3706998800'||n,now() from generate_series(1,4) n;
insert into auth.sessions(id,user_id) select ('72000000-0000-0000-0000-00000000000'||n)::uuid,('71000000-0000-0000-0000-00000000000'||n)::uuid from generate_series(1,4) n;
update app.profiles set beta_access=true,display_name='Transaction user' where id::text like '71000000-%';
insert into app.carriers(id,slug,display_name,visibility) select ('73000000-0000-0000-0000-00000000000'||n)::uuid,'transaction-carrier-'||n,'Transaction Carrier '||n,'published' from generate_series(1,2) n;
insert into app.carrier_memberships(carrier_id,user_id,role) select ('73000000-0000-0000-0000-00000000000'||n)::uuid,('71000000-0000-0000-0000-00000000000'||(n+1))::uuid,'owner' from generate_series(1,2) n;
insert into app.carrier_private_details(carrier_id,legal_name,business_kind,registration_country)
select id,'Private legal identity',case when slug='transaction-carrier-1' then 'individual' else 'company' end,'LT' from app.carriers;
insert into app.carrier_verifications(carrier_id,category,status,reviewed_by,reviewed_at,expires_at)
select id,case when slug='transaction-carrier-1' then 'identity' else 'company' end,'approved','71000000-0000-0000-0000-000000000004',now(),now()+interval '60 days' from app.carriers;
insert into app.carrier_routes(id,carrier_id,date_from,date_to,capacity_total,supported_categories,status,published_at)
select ('74000000-0000-0000-0000-00000000000'||n)::uuid,('73000000-0000-0000-0000-00000000000'||n)::uuid,current_date+30,current_date+35,2,array['car'],'published',now() from generate_series(1,2) n;
insert into app.route_stops(route_id,position,location_id)
select r.id,p.position,l.id from app.carrier_routes r cross join (values(0,'hamburg-de'),(1,'kaunas-lt')) p(position,slug) join app.public_locations l on l.slug=p.slug;
insert into app.route_revisions(route_id,version,changed_by,public_terms_snapshot)
select r.id,1,m.user_id,jsonb_build_object('stops',(select jsonb_agg(location_id order by position) from app.route_stops where route_id=r.id),
'date_from',r.date_from,'date_to',r.date_to,'capacity_total',r.capacity_total,'supported_categories',r.supported_categories,'supports_non_running',false,'route_flexible',false)
from app.carrier_routes r join app.carrier_memberships m on m.carrier_id=r.carrier_id;
insert into app.transport_requests(id,customer_id,status,visibility,default_pickup_location_id,default_delivery_location_id,pickup_kind,terms_version,terms_accepted_at,published_at,client_publish_key)
select '75000000-0000-0000-0000-000000000001','71000000-0000-0000-0000-000000000001','active','marketplace',a.id,b.id,'anytime','test',now(),now(),gen_random_uuid()
from app.public_locations a,app.public_locations b where a.slug='hamburg-de' and b.slug='kaunas-lt';
insert into app.request_vehicles(id,request_id,position,category,make,model,condition,pickup_location_id,delivery_location_id)
select ('76000000-0000-0000-0000-00000000000'||n)::uuid,id,n,'car','Test','Car','running',default_pickup_location_id,default_delivery_location_id from app.transport_requests cross join generate_series(1,2) n;
insert into app.request_vehicle_private_details(vehicle_id,side,instructions) select id,'pickup','PRIVATE pickup instruction' from app.request_vehicles;
insert into app.request_revisions(request_id,version,changed_by,public_terms_snapshot)
values('75000000-0000-0000-0000-000000000001',1,'71000000-0000-0000-0000-000000000001','{}');
set constraints all immediate;
set constraints all deferred;
create function pg_temp.login(n integer) returns void language sql as $$select set_config('request.jwt.claims',jsonb_build_object('sub','71000000-0000-0000-0000-00000000000'||n,'session_id','72000000-0000-0000-0000-00000000000'||n)::text,true)::text::void$$;
create function pg_temp.terms() returns jsonb language sql as $$select jsonb_build_object('total_price',500,'currency','EUR','planned_pickup_date',current_date+31,'planned_delivery_date',current_date+33,'payment_terms','On delivery','expires_at',now()+interval '1 day')$$;
create function pg_temp.submit(n integer,version integer default null) returns uuid language sql as $$select api.submit_offer('75000000-0000-0000-0000-000000000001',('74000000-0000-0000-0000-00000000000'||n)::uuid,pg_temp.terms(),1,1,version)$$;
create function pg_temp.offer(n integer) returns uuid language sql as $$select id from app.offers where carrier_id=('73000000-0000-0000-0000-00000000000'||n)::uuid$$;
create function pg_temp.thread(n integer) returns uuid language sql as $$select id from app.conversations where carrier_id=('73000000-0000-0000-0000-00000000000'||n)::uuid$$;
create function pg_temp.accept() returns jsonb language sql as $$select api.accept_offer(pg_temp.offer(1),2,1,1)$$;

set local role anon;
select extensions.throws_ok($$select pg_temp.submit(1)$$,'42501',null,'anon cannot Offer');
reset role;
set local role authenticated;
select pg_temp.login(1);
select extensions.throws_ok($$select pg_temp.submit(1)$$,'42501',null,'Customer cannot Offer');
select pg_temp.login(2);
select extensions.throws_ok($$select pg_temp.submit(2)$$,'42501',null,'Carrier cannot impersonate another owner');
select extensions.lives_ok($$select pg_temp.submit(1)$$,'individual phone + approved identity can Offer without email/contact/CMR');
select extensions.is((select capacity_reserved from api.my_routes),0,'Offer reserves nothing');
select extensions.is((select count(*)::int from app.conversations),1,'first Offer creates one Conversation');
select extensions.lives_ok($$select pg_temp.submit(1,1)$$,'revision reuses relationship');
select extensions.is((select count(*)::int from app.offers),1,'revision reuses Offer ID');
select extensions.is((select count(*)::int from app.offer_revisions),2,'immutable revision history retained');
select extensions.is((select count(*)::int from app.conversations),1,'revision reuses Conversation');
select extensions.throws_ok($$select pg_temp.submit(1,1)$$,'40001',null,'stale revision rejected');
select extensions.throws_ok($$select api.submit_offer('75000000-0000-0000-0000-000000000001','74000000-0000-0000-0000-000000000001',pg_temp.terms()||'{"vehicle_ids":[]}',1,1,2)$$,'22023',null,'partial vehicle selection rejected');
select extensions.lives_ok($$select api.send_message(pg_temp.thread(1),'Carrier text','77000000-0000-0000-0000-000000000001')$$,'Carrier sends persisted text');
select extensions.lives_ok($$select api.send_message(pg_temp.thread(1),'Carrier text','77000000-0000-0000-0000-000000000001')$$,'message retry returns same outcome');
select extensions.is((select count(*)::int from app.messages where kind='user'),1,'message retry does not duplicate');
select pg_temp.login(3);
select extensions.lives_ok($$select pg_temp.submit(2)$$,'company phone + approved company identity can Offer');
select extensions.is((select count(*)::int from app.offers),1,'Carrier sees only its own Offer');
select pg_temp.login(4);
select extensions.is((select count(*)::int from app.offers),0,'unrelated Customer cannot read Offers');
select extensions.is((select count(*)::int from app.messages),0,'nonparticipant cannot read messages');
select extensions.throws_ok($$select api.send_message('78000000-0000-0000-0000-000000000001','Intrusion',gen_random_uuid())$$,'42501',null,'nonparticipant cannot send');
select pg_temp.login(1);
select extensions.is((select count(*)::int from app.offers),2,'Request owner sees full private Offer set');
select extensions.lives_ok($$select api.send_message(pg_temp.thread(1),'Customer text',gen_random_uuid())$$,'Customer sends persisted text');
select extensions.throws_ok($$select api.accept_offer(pg_temp.offer(1),1,1,1)$$,'40001',null,'stale Offer acceptance rejected');
reset role;

-- Wrong category cannot stand in for the applicable identity approval.
update app.carrier_verifications set status='rejected' where category='company';
insert into app.carrier_verifications(carrier_id,category,status,reviewed_by,reviewed_at)
values('73000000-0000-0000-0000-000000000002','identity','approved','71000000-0000-0000-0000-000000000004',now());
set local role authenticated;
select pg_temp.login(3);
select extensions.throws_ok($$select pg_temp.submit(2,1)$$,'42501',null,'company requires company category, not individual identity');
reset role;
update app.carrier_verifications set status='approved' where category='company';
set local role authenticated;
select pg_temp.login(1);
reset role;
update app.transport_requests set request_version=2;
set local role authenticated;
select extensions.throws_ok($$select pg_temp.accept()$$,'40001',null,'material Request change rejects acceptance');
reset role;
update app.transport_requests set request_version=1;
update app.carrier_routes set route_version=2 where id='74000000-0000-0000-0000-000000000001';
set local role authenticated;
select extensions.throws_ok($$select pg_temp.accept()$$,'40001',null,'material Route change rejects acceptance');
reset role;
update app.carrier_routes set route_version=1 where id='74000000-0000-0000-0000-000000000001';
create function pg_temp.expired_acceptance() returns void language plpgsql as $$
begin
  insert into app.offer_revisions(offer_id,version,request_id,request_version,route_id,route_version,total_price,currency,planned_pickup_date,pickup_time_zone,planned_delivery_date,payment_terms,expires_at,revised_by)
    select offer_id,3,request_id,request_version,route_id,route_version,total_price,currency,planned_pickup_date,pickup_time_zone,planned_delivery_date,payment_terms,clock_timestamp()+interval '100 milliseconds',revised_by from app.offer_revisions where offer_id=pg_temp.offer(1) and version=2;
  update app.offers set current_version=3 where id=pg_temp.offer(1);
  perform pg_sleep(0.15);
  perform api.accept_offer(pg_temp.offer(1),3,1,1);
end;$$;
select extensions.throws_ok($$select pg_temp.expired_acceptance()$$,'40001',null,'elapsed Offer expiry rejects acceptance using wall time');
-- Force a failure AFTER reservation/Booking creation; the whole RPC rolls back.
create function pg_temp.fail_booking_event() returns trigger language plpgsql as $$begin
 if new.event_type='booking.created' then raise exception 'Injected event failure' using errcode='23514'; end if; return new; end;$$;
create trigger fail_booking_event before insert on app.domain_events for each row execute function pg_temp.fail_booking_event();
set local role authenticated;
select extensions.throws_ok($$select pg_temp.accept()$$,'23514','Injected event failure','late event failure aborts the entire acceptance');
reset role;
select extensions.is((select count(*)::int from app.bookings),0,'late failure rolls back Booking');
select extensions.is((select sum(capacity_reserved)::int from app.carrier_routes),0,'late failure rolls back complete reservation');
select extensions.is((select count(*)::int from app.domain_events where event_type='offer.accepted'),0,'late failure rolls back preceding system event');
drop trigger fail_booking_event on app.domain_events;

-- Each failed acceptance must leave every commercial record/counter untouched.
update app.carrier_verifications set status='rejected' where category='identity';
set local role authenticated;
select pg_temp.login(2);
select extensions.throws_ok($$select pg_temp.submit(1,2)$$,'42501',null,'revoked identity prevents revision');
select pg_temp.login(1);
select extensions.throws_ok($$select pg_temp.accept()$$,'42501',null,'revoked identity prevents acceptance');
reset role;
update app.carrier_verifications set status='approved',expires_at=now()-interval '1 second' where category='identity';
set local role authenticated;
select extensions.throws_ok($$select pg_temp.accept()$$,'42501',null,'expired identity prevents acceptance');
reset role;
update app.carrier_verifications set expires_at=null where category='identity';
update auth.users set phone_confirmed_at=null where id='71000000-0000-0000-0000-000000000002';
set local role authenticated;
select extensions.throws_ok($$select pg_temp.accept()$$,'42501',null,'lost Auth-confirmed phone prevents acceptance');
reset role;
update auth.users set phone_confirmed_at=now() where id='71000000-0000-0000-0000-000000000002';
update app.profiles set beta_access=false where id='71000000-0000-0000-0000-000000000002';
set local role authenticated;
select extensions.throws_ok($$select pg_temp.accept()$$,'42501',null,'lost beta admission prevents acceptance');
reset role;
update app.profiles set beta_access=true where id='71000000-0000-0000-0000-000000000002';
update app.carriers set suspended_at=now() where id='73000000-0000-0000-0000-000000000001';
set local role authenticated;
select extensions.throws_ok($$select pg_temp.accept()$$,'42501',null,'suspended Carrier prevents acceptance');
reset role;
update app.carriers set suspended_at=null where id='73000000-0000-0000-0000-000000000001';
update app.carrier_routes set capacity_total=1 where id='74000000-0000-0000-0000-000000000001';
set local role authenticated;
select extensions.throws_ok($$select pg_temp.accept()$$,'40001',null,'insufficient complete capacity rejects acceptance');
reset role;
select extensions.is((select count(*)::int from app.bookings),0,'failed acceptance creates no Booking');
select extensions.is((select sum(capacity_reserved)::int from app.carrier_routes),0,'failed acceptance reserves no partial capacity');
select extensions.is((select status from app.transport_requests),'active','failed acceptance leaves Request active');
select extensions.is((select count(*)::int from app.offers where status='pending'),2,'failed acceptance leaves competitors untouched');
update app.carrier_routes set capacity_total=2 where id='74000000-0000-0000-0000-000000000001';
set local role authenticated;
select extensions.lives_ok($$select pg_temp.accept()$$,'Customer accepts current complete Offer');
select extensions.is((select count(*)::int from app.bookings),1,'acceptance creates exactly one Booking');
select extensions.is((pg_temp.accept()->>'replayed')::boolean,true,'same Offer retry is idempotent');
select extensions.throws_ok($$select api.accept_offer(pg_temp.offer(2),1,1,1)$$,'40001',null,'competing Offer cannot also win');
select extensions.is((select status from api.my_requests),'booked','Request moves to booked');
select extensions.lives_ok($$select api.send_message(pg_temp.thread(1),'Winning Customer text',gen_random_uuid())$$,'winning Customer thread remains active');
select extensions.throws_ok($$select api.send_message(pg_temp.thread(2),'Losing Customer text',gen_random_uuid())$$,'42501',null,'losing thread read-only for Customer');
select pg_temp.login(2);
select extensions.lives_ok($$select api.send_message(pg_temp.thread(1),'Winning Carrier text',gen_random_uuid())$$,'winning Carrier thread remains active');
select extensions.is((select capacity_reserved from api.my_routes),2,'reserves exact complete vehicle count once');
select pg_temp.login(3);
select extensions.throws_ok($$select api.send_message(pg_temp.thread(2),'Losing Carrier text',gen_random_uuid())$$,'42501',null,'losing thread read-only for Carrier');
reset role;
select extensions.is((select count(*)::int from app.domain_events where event_type='booking.created'),1,'retry emits one booking.created internal event');
select extensions.is((select count(*)::int from app.booking_vehicle_operations),2,'private per-vehicle details copied separately');
select extensions.ok((select agreement_snapshot::text not like '%PRIVATE%' from app.bookings),'snapshot excludes private operational details');
select extensions.throws_ok($$update app.bookings set agreed_total_price=1$$,'23514',null,'accepted agreement immutable even for trusted writes');
update app.request_vehicles set make='Changed source';
select extensions.ok((select agreement_snapshot::text not like '%Changed source%' from app.bookings),'source changes do not rewrite Booking snapshot');
set constraints all immediate;
select * from extensions.finish();
rollback;
