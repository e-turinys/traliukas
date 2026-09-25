begin;
create extension if not exists pgtap with schema extensions;
select extensions.no_plan();

insert into auth.users(id,email) select ('61000000-0000-0000-0000-00000000000'||n)::uuid,'commercial-schema-'||n||'@example.test' from generate_series(1,4) n;
insert into auth.sessions(id,user_id) select ('62000000-0000-0000-0000-00000000000'||n)::uuid,('61000000-0000-0000-0000-00000000000'||n)::uuid from generate_series(1,4) n;
insert into app.carriers(id,slug,display_name,visibility) values('63000000-0000-0000-0000-000000000001','commercial-schema-carrier','Schema Carrier','published');
insert into app.carrier_memberships(carrier_id,user_id,role) values('63000000-0000-0000-0000-000000000001','61000000-0000-0000-0000-000000000002','owner');
insert into app.carrier_routes(id,carrier_id,date_from,date_to,capacity_total,supported_categories,status,published_at)
values('64000000-0000-0000-0000-000000000001','63000000-0000-0000-0000-000000000001',current_date+30,current_date+35,2,array['car'],'published',now());
insert into app.route_stops(route_id,position,location_id)
select '64000000-0000-0000-0000-000000000001',p.position,l.id from (values(0,'hamburg-de'),(1,'kaunas-lt')) p(position,slug) join app.public_locations l on l.slug=p.slug;
insert into app.route_revisions(route_id,version,changed_by,public_terms_snapshot)
select id,1,'61000000-0000-0000-0000-000000000002',jsonb_build_object('stops',(select jsonb_agg(location_id order by position) from app.route_stops),
'date_from',date_from,'date_to',date_to,'capacity_total',capacity_total,'supported_categories',supported_categories,'supports_non_running',false,'route_flexible',false) from app.carrier_routes;
insert into app.transport_requests(id,customer_id,status,visibility,default_pickup_location_id,default_delivery_location_id,pickup_kind,terms_version,terms_accepted_at,published_at,client_publish_key)
select '65000000-0000-0000-0000-000000000001','61000000-0000-0000-0000-000000000001','active','marketplace',a.id,b.id,'anytime','test',now(),now(),gen_random_uuid()
from app.public_locations a,app.public_locations b where a.slug='hamburg-de' and b.slug='kaunas-lt';
insert into app.request_vehicles(id,request_id,position,category,make,model,condition,pickup_location_id,delivery_location_id)
select ('66000000-0000-0000-0000-00000000000'||n)::uuid,id,n,'car','Test','Car','running',default_pickup_location_id,default_delivery_location_id from app.transport_requests cross join generate_series(1,2) n;
insert into app.request_revisions(request_id,version,changed_by,public_terms_snapshot)
values('65000000-0000-0000-0000-000000000001',1,'61000000-0000-0000-0000-000000000001','{}');
insert into app.offers(id,request_id,carrier_id,route_id,created_by)
values('67000000-0000-0000-0000-000000000001','65000000-0000-0000-0000-000000000001','63000000-0000-0000-0000-000000000001','64000000-0000-0000-0000-000000000001','61000000-0000-0000-0000-000000000002');
insert into app.offer_revisions(offer_id,version,request_id,request_version,route_id,route_version,total_price,planned_pickup_date,pickup_time_zone,planned_delivery_date,payment_terms,expires_at,revised_by)
values('67000000-0000-0000-0000-000000000001',1,'65000000-0000-0000-0000-000000000001',1,'64000000-0000-0000-0000-000000000001',1,500,current_date+31,'Europe/Berlin',current_date+33,'On delivery',now()+interval '1 day','61000000-0000-0000-0000-000000000002');
insert into app.conversations(id,request_id,carrier_id,current_offer_id)
values('68000000-0000-0000-0000-000000000001','65000000-0000-0000-0000-000000000001','63000000-0000-0000-0000-000000000001','67000000-0000-0000-0000-000000000001');
insert into app.messages(conversation_id,sequence,kind,sender_user_id,sender_side,body,client_message_key)
values('68000000-0000-0000-0000-000000000001',1,'user','61000000-0000-0000-0000-000000000002','carrier','Persisted text',gen_random_uuid());
set constraints all immediate;

with tables(name) as (values('offers'),('offer_revisions'),('conversations'),('bookings'),('booking_vehicle_operations'),('domain_events'),('messages'),('conversation_reads'))
select extensions.ok(c.relrowsecurity,'RLS enabled: '||name) from tables join pg_class c on c.oid=('app.'||name)::regclass;
with tables(name) as (values('offers'),('offer_revisions'),('conversations'),('bookings'),('booking_vehicle_operations'),('domain_events'),('messages'),('conversation_reads'))
select extensions.ok(not has_table_privilege('authenticated','app.'||name,'INSERT,UPDATE,DELETE,TRUNCATE'),'client cannot write: '||name) from tables;

select extensions.throws_ok($$insert into app.conversations(request_id,carrier_id,current_offer_id) select request_id,carrier_id,current_offer_id from app.conversations$$,'23505',null,'one Conversation per Request/Carrier');
select extensions.throws_ok($$insert into app.offers(request_id,carrier_id,route_id,created_by) select request_id,carrier_id,route_id,created_by from app.offers$$,'23505',null,'one pending Offer per pair');
select extensions.throws_ok($$update app.offers set carrier_id=gen_random_uuid()$$,'23514',null,'Offer identity cannot be reassigned');
select extensions.throws_ok($$update app.conversations set request_id=gen_random_uuid()$$,'23514',null,'Conversation identity cannot be reassigned');
select extensions.throws_ok($$update app.offer_revisions set total_price=1$$,'42501',null,'Offer revisions immutable');
select extensions.throws_ok($$delete from app.messages$$,'42501',null,'Message history immutable');
select extensions.throws_ok($$delete from app.domain_events$$,'42501',null,'Internal events immutable');
select extensions.throws_ok($$update app.carrier_routes set capacity_reserved=1$$,'23514','Route capacity must reconcile with Bookings','even trusted capacity writes need Booking reconciliation');
select extensions.is((select capacity_reserved from app.carrier_routes),0,'failed reconciliation rolls back the complete increment');
select extensions.throws_ok($$insert into app.conversation_reads(conversation_id,user_id,last_read_sequence) values('68000000-0000-0000-0000-000000000001','61000000-0000-0000-0000-000000000001',2)$$,'23514',null,'read cursor cannot exceed actual history');
insert into app.conversation_reads(conversation_id,user_id,last_read_sequence) values('68000000-0000-0000-0000-000000000001','61000000-0000-0000-0000-000000000001',1);
select extensions.throws_ok($$update app.conversation_reads set last_read_sequence=0$$,'23514',null,'read cursor cannot go backwards');

set local role anon;
select extensions.throws_ok($$select * from app.offers$$,'42501',null,'anon cannot read Offers');
select extensions.throws_ok($$select * from app.messages$$,'42501',null,'anon cannot read messages');
reset role;
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"61000000-0000-0000-0000-000000000001","session_id":"62000000-0000-0000-0000-000000000001"}',true);
select extensions.is((select count(*)::int from app.offers),1,'Request customer reads its Offer');
select extensions.is((select count(*)::int from app.offer_revisions),1,'Request customer reads its terms');
select extensions.is((select count(*)::int from app.conversations),1,'Request customer reads its Conversation');
select extensions.is((select count(*)::int from app.messages),1,'Request customer reads persisted text');
select extensions.is((select count(*)::int from app.conversation_reads),1,'Customer sees own read cursor');
select extensions.throws_ok($$select * from app.domain_events$$,'42501',null,'internal events have no client read path');
select extensions.throws_ok($$select * from app.booking_vehicle_operations$$,'42501',null,'private operations require audited gateway');
select extensions.throws_ok($$insert into app.messages default values$$,'42501',null,'Customer cannot bypass send command');
select set_config('request.jwt.claims','{"sub":"61000000-0000-0000-0000-000000000002","session_id":"62000000-0000-0000-0000-000000000002"}',true);
select extensions.is((select count(*)::int from app.offers),1,'Carrier owner reads own Offer');
select extensions.is((select count(*)::int from app.conversations),1,'Carrier owner reads own Conversation');
select extensions.is((select count(*)::int from app.messages),1,'Carrier owner reads message history');
select extensions.is((select count(*)::int from app.conversation_reads),0,'Carrier cannot read Customer read metadata');
select set_config('request.jwt.claims','{"sub":"61000000-0000-0000-0000-000000000003","session_id":"62000000-0000-0000-0000-000000000003"}',true);
select extensions.is((select count(*)::int from app.offers),0,'unrelated Customer cannot read Offers');
select extensions.is((select count(*)::int from app.offer_revisions),0,'unrelated Customer cannot read terms');
select extensions.is((select count(*)::int from app.conversations),0,'nonparticipant cannot read Conversations');
select extensions.is((select count(*)::int from app.messages),0,'nonparticipant cannot read messages');
select extensions.is((select count(*)::int from app.bookings),0,'nonparticipant sees no Bookings');
select set_config('request.jwt.claims','{"sub":"61000000-0000-0000-0000-000000000001","session_id":"62000000-0000-0000-0000-000000000001"}',true);
reset role;
delete from auth.sessions where id='62000000-0000-0000-0000-000000000001';
set local role authenticated;
select extensions.is((select count(*)::int from app.messages),0,'revoked session cannot read commercial history');
reset role;
select * from extensions.finish();
rollback;
