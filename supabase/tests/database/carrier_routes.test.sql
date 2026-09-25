begin;
create extension if not exists pgtap with schema extensions;
select extensions.no_plan();
insert into auth.users(id,email) values
('41000000-0000-0000-0000-000000000001','route-owner@example.test'),
('41000000-0000-0000-0000-000000000002','route-other@example.test');
insert into auth.sessions(id,user_id) select ('42000000-0000-0000-0000-00000000000'||n)::uuid,('41000000-0000-0000-0000-00000000000'||n)::uuid from generate_series(1,2) n;
update app.profiles set beta_access=true where id::text like '41000000-%';
insert into app.carriers(id,slug,display_name,visibility) values
('43000000-0000-0000-0000-000000000001','route-test-carrier','Route carrier','published');
insert into app.carrier_memberships(carrier_id,user_id,role) values
('43000000-0000-0000-0000-000000000001','41000000-0000-0000-0000-000000000001','owner');
insert into app.carrier_private_details(carrier_id,legal_name,business_kind,registration_country,street,contact_email) values
('43000000-0000-0000-0000-000000000001','PRIVATE legal name','individual','LT','PRIVATE street','private@example.test');
insert into app.carrier_routes(id,carrier_id,date_from,date_to,capacity_total,supported_categories)
select ('44000000-0000-0000-0000-00000000000'||n)::uuid,'43000000-0000-0000-0000-000000000001',current_date+1,current_date+5,3,array['car','motorcycle'] from generate_series(1,3) n;
insert into app.route_stops(route_id,position,location_id)
select r.id,p.position,l.id from app.carrier_routes r cross join (values(0,'hamburg-de'),(1,'berlin-de'),(2,'kaunas-lt')) p(position,slug)
join app.public_locations l on l.slug=p.slug;
insert into app.route_revisions(route_id,version,changed_by,public_terms_snapshot)
select id,1,'41000000-0000-0000-0000-000000000001',jsonb_build_object('stops',array['hamburg-de','berlin-de','kaunas-lt'],
'date_from',date_from,'date_to',date_to,'supported_categories',supported_categories,'supports_non_running',false,'route_flexible',false,'capacity_total',capacity_total)
from app.carrier_routes where id<>'44000000-0000-0000-0000-000000000001';
update app.carrier_routes set status='published',published_at=now() where id='44000000-0000-0000-0000-000000000002';
update app.carrier_routes set status='cancelled',published_at=now() where id='44000000-0000-0000-0000-000000000003';
set constraints all immediate;
select extensions.throws_ok($$update app.carrier_routes set capacity_total=0$$,'23514',null,'zero total rejected');
select extensions.throws_ok($$update app.carrier_routes set capacity_total=-1$$,'23514',null,'negative total rejected');
select extensions.throws_ok($$update app.carrier_routes set capacity_reserved=-1$$,'23514',null,'negative reserved rejected');
select extensions.throws_ok($$update app.carrier_routes set capacity_reserved=4$$,'23514',null,'reserved cannot exceed total');
update app.carrier_routes set capacity_reserved=2 where status='published';
select extensions.throws_ok($$update app.carrier_routes set capacity_total=1 where status='published'$$,'23514',null,'total cannot drop below reserved');
select extensions.throws_ok($$update app.carrier_routes set supported_categories=array['truck']$$,'23514',null,'unsupported category rejected');
select extensions.throws_ok($$update app.carrier_routes set supported_categories=array['car','car']$$,'23514',null,'duplicate categories rejected');
select extensions.throws_ok($$update app.carrier_routes set supported_categories='{}'$$,'23514',null,'empty categories rejected');
select extensions.throws_ok($$update app.carrier_routes set date_to=date_from-1$$,'23514',null,'reversed dates rejected');
select extensions.throws_ok($$update app.carrier_routes set date_to='infinity'$$,'23514',null,'infinite dates rejected');
select extensions.throws_ok($$update app.carrier_routes set carrier_id=gen_random_uuid()$$,'23514',null,'carrier identity immutable even for trusted writes');
select extensions.throws_ok($$update app.carrier_routes set id=gen_random_uuid()$$,'23514',null,'route identity immutable');
select extensions.throws_ok($$delete from app.route_stops where position=1$$,'23514',null,'noncontiguous stops rejected');
select extensions.throws_ok($$update app.route_stops set location_id=(select id from app.public_locations where slug='hamburg-de') where position=2$$,'23514',null,'identical endpoints rejected');
select extensions.throws_ok($$update app.route_revisions set version=version$$,'42501',null,'revisions immutable');
select extensions.throws_ok($$update app.carrier_memberships set role='operator'$$,'23514',null,'operator remains impossible');
select extensions.throws_ok($$update app.carrier_memberships set role='staff'$$,'23514',null,'staff remains impossible');
set local role anon;
select extensions.is((select count(*)::int from api.public_routes),1,'only published route public');
select extensions.is((select capacity_available from api.public_routes),1,'public availability total minus reserved');
select extensions.is((select count(*)::int from api.public_route_stops),3,'ordered public stops visible');
select extensions.ok(not exists(select 1 from api.public_routes r where row_to_json(r)::text like '%PRIVATE%' or row_to_json(r)::text like '%private@example.test%'),'public projection contains no private Carrier data');
select extensions.throws_ok($$select * from app.carrier_private_details$$,'42501',null,'no private business reads');
select extensions.throws_ok($$select * from api.my_routes$$,'42501',null,'anonymous cannot read own-routes view');
select extensions.throws_ok($$insert into app.carrier_routes default values$$,'42501',null,'anonymous cannot insert');
select extensions.throws_ok($$update app.carrier_routes set status='published'$$,'42501',null,'anonymous cannot publish');
select extensions.throws_ok($$select * from app.route_revisions$$,'42501',null,'anonymous revisions denied');
reset role;
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"41000000-0000-0000-0000-000000000001","session_id":"42000000-0000-0000-0000-000000000001"}',true);
select extensions.is((select count(*)::int from api.my_routes),3,'owner sees draft published and cancelled routes');
select extensions.is((select count(*)::int from api.my_route_stops),9,'owner sees all own stops');
select extensions.is((select count(*)::int from api.public_routes),1,'public projection excludes own draft and cancelled routes');
select extensions.throws_ok($$update app.carrier_routes set capacity_reserved=0$$,'42501',null,'owner cannot write reserved capacity');
select extensions.throws_ok($$update app.carrier_routes set carrier_id=gen_random_uuid()$$,'42501',null,'owner cannot reassign carrier');
select extensions.throws_ok($$update app.carriers set visibility='published'$$,'42501',null,'owner cannot self-approve public eligibility');
select extensions.throws_ok($$update app.carrier_verifications set status='approved'$$,'42501',null,'owner cannot self-verify');
select extensions.throws_ok($$insert into app.route_stops default values$$,'42501',null,'owner cannot bypass parent command to insert stops');
select set_config('request.jwt.claims','{"sub":"41000000-0000-0000-0000-000000000002","session_id":"42000000-0000-0000-0000-000000000002"}',true);
select extensions.is((select count(*)::int from api.my_routes),0,'nonowner has no own routes');
select extensions.is((select count(*)::int from api.my_route_stops),0,'nonowner has no own stops');
select extensions.throws_ok($$update app.carrier_routes set capacity_total=5$$,'42501',null,'nonowner cannot update');
reset role;
update app.carrier_routes set capacity_reserved=capacity_total where status='published';
set local role anon;
select extensions.is((select capacity_available from api.public_routes),0,'full route remains directly public with zero availability');
reset role;
update app.carrier_routes set moderation_status='hidden' where status='published';
set local role anon;
select extensions.is((select count(*)::int from api.public_routes),0,'hidden route not public');
select extensions.is((select count(*)::int from api.public_route_stops),0,'hidden route stops not public');
reset role;
select * from extensions.finish();
rollback;
