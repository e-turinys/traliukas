begin;
create extension if not exists pgtap with schema extensions;
select extensions.no_plan();
insert into auth.users(id,email,phone,phone_confirmed_at) values
('31000000-0000-0000-0000-000000000001','owner@example.test','37060000101',now()),
('31000000-0000-0000-0000-000000000002','other@example.test','37060000102',now()),
('31000000-0000-0000-0000-000000000003','carrier@example.test','37060000103',now()),
('31000000-0000-0000-0000-000000000004','unverified@example.test','37060000104',null);
insert into auth.sessions(id,user_id) select ('32000000-0000-0000-0000-00000000000'||n)::uuid,('31000000-0000-0000-0000-00000000000'||n)::uuid from generate_series(1,4) n;
update app.profiles set beta_access=true where id::text like '31000000-%';
insert into app.carriers(id,slug,display_name) values('33000000-0000-0000-0000-000000000001','request-test-carrier','Carrier');
insert into app.carrier_memberships(carrier_id,user_id,role) values('33000000-0000-0000-0000-000000000001','31000000-0000-0000-0000-000000000003','owner');

create function pg_temp.payload() returns jsonb language sql as $$
select '{"name":"Customer","email":"contact@example.test","phone":"+37060000101","terms_version":"2026-09-24",
 "from":"hamburg-de","to":"kaunas-lt","pickup":{"kind":"anytime"},"notes":"Transport notes",
 "private_pickup":"SECRET pickup street and postcode","private_delivery":"SECRET delivery instructions",
 "budget_amount":750.50,"budget_currency":"EUR","vehicles":[
 {"category":"car","make":"VW","model":"Golf","year":2020,"condition":"running","rolling_ability":null,"pickup":"hamburg-de","delivery":"kaunas-lt","uses_default_route":true},
 {"category":"motorcycle","make":"Yamaha","model":"MT-07","condition":"non_running","rolling_ability":"yes","pickup":"berlin-de","delivery":"vilnius-lt","uses_default_route":false}]}'::jsonb;
$$;
set local role anon;
select extensions.throws_ok($$select api.publish_request(pg_temp.payload(),gen_random_uuid())$$,'42501',null,'anonymous cannot publish');
select extensions.throws_ok($$select * from api.marketplace_requests$$,'42501',null,'anonymous Request discovery is denied by locked matrix');
select extensions.throws_ok($$insert into app.transport_requests default values$$,'42501',null,'anon cannot insert directly');
select extensions.throws_ok($$update app.transport_requests set status='active'$$,'42501',null,'anon cannot update directly');
reset role;
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"31000000-0000-0000-0000-000000000004","session_id":"32000000-0000-0000-0000-000000000004"}',true);
select extensions.throws_ok($$select api.publish_request(pg_temp.payload(),gen_random_uuid())$$,'42501',null,'unverified phone cannot publish');
select set_config('request.jwt.claims','{"sub":"31000000-0000-0000-0000-000000000001","session_id":"32000000-0000-0000-0000-000000000001"}',true);
select extensions.lives_ok($$select api.publish_request(pg_temp.payload(),'34000000-0000-0000-0000-000000000001')$$,'verified admitted owner publishes complete multi-vehicle Request');
select extensions.is((select count(*)::int from api.my_requests),1,'owner reads real Request');
select extensions.is((select count(*)::int from api.my_request_vehicles),2,'all vehicles persisted');
select extensions.is((select count(distinct pickup_location_id)::int from api.my_request_vehicles),2,'separate pickups persisted');
select extensions.is((select count(distinct delivery_location_id)::int from api.my_request_vehicles),2,'separate deliveries persisted');
select extensions.is((select budget_amount from api.my_requests),750.50::numeric,'optional budget persisted');
select extensions.is((select budget_currency::text from api.my_requests),'EUR','budget currency persisted');
select extensions.is((select count(*)::int from api.my_request_private_details),2,'default vehicle gets both private instructions');
select extensions.is((select count(*)::int from api.my_request_private_details d join api.my_request_vehicles v on v.id=d.vehicle_id where not v.uses_default_route),0,'overridden vehicle does not inherit unrelated private instructions');
select extensions.is(api.publish_request(pg_temp.payload(),'34000000-0000-0000-0000-000000000001'),(select id from api.my_requests),'retry returns same canonical Request ID');
select extensions.is((select count(*)::int from api.my_request_vehicles),2,'retry does not duplicate vehicles');
select extensions.throws_ok($$insert into app.transport_requests default values$$,'42501',null,'no direct Request insert');
select extensions.throws_ok($$update app.transport_requests set status='completed'$$,'42501',null,'no direct lifecycle updates');
select extensions.throws_ok($$update app.request_vehicles set model='attack'$$,'42501',null,'no direct child writes');
select extensions.throws_ok($$select customer_id from app.transport_requests$$,'42501',null,'customer identity absent from ordinary projections');
select extensions.throws_ok($$select api.publish_request(pg_temp.payload()||'{"customer_id":"31000000-0000-0000-0000-000000000002"}',gen_random_uuid())$$,'22023',null,'cannot assign another customer');
select extensions.throws_ok($$select api.publish_request(pg_temp.payload()||'{"status":"active","request_version":99}',gen_random_uuid())$$,'22023',null,'protected input fields rejected');
select extensions.throws_ok($$select api.publish_request(pg_temp.payload()||'{"vehicles":[]}',gen_random_uuid())$$,'22023',null,'zero vehicles rejected');
select extensions.throws_ok($$select api.publish_request(jsonb_set(pg_temp.payload(),'{vehicles}',(select jsonb_agg(pg_temp.payload()#>'{vehicles,0}') from generate_series(1,11))),gen_random_uuid())$$,'22023',null,'eleven vehicles rejected');
select extensions.throws_ok($$select api.publish_request(jsonb_set(pg_temp.payload(),'{vehicles,1,category}','"other"'),gen_random_uuid())$$,'23514',null,'unsupported category rejects second child');
select extensions.is((select count(*)::int from api.my_requests),1,'failed child insert rolls back parent');
select extensions.is((select count(*)::int from api.my_request_vehicles),2,'failed child insert rolls back first child');
select extensions.throws_ok($$select api.publish_request(jsonb_set(pg_temp.payload(),'{vehicles,1,pickup}','"untrusted-exact-address"'),gen_random_uuid())$$,'22023',null,'unknown client locality rejected');
select extensions.throws_ok($$select api.publish_request(pg_temp.payload()||'{"phone":"+37060000102"}',gen_random_uuid())$$,'42501',null,'cannot substitute verified phone');
select extensions.throws_ok($$select api.publish_request(pg_temp.payload()||'{"terms_version":"old"}',gen_random_uuid())$$,'22023',null,'current terms required');
select extensions.throws_ok($$select api.publish_request(pg_temp.payload()||'{"budget_amount":1.234}',gen_random_uuid())$$,'22023',null,'budget cannot silently round');
select extensions.throws_ok($$select api.publish_request(pg_temp.payload()||'{"budget_amount":0.001}',gen_random_uuid())$$,'22023',null,'sub-cent budget rejected before numeric coercion');
select extensions.throws_ok($$select api.publish_request(pg_temp.payload()||'{"budget_amount":0}',gen_random_uuid())$$,'22023',null,'zero budget rejected');
select extensions.throws_ok($$select api.publish_request(pg_temp.payload()||'{"budget_amount":-1}',gen_random_uuid())$$,'22023',null,'negative budget rejected');
select extensions.throws_ok($$select api.publish_request(pg_temp.payload()||'{"budget_amount":10000000000}',gen_random_uuid())$$,'22023',null,'out-of-range budget rejected before numeric coercion');
select extensions.throws_ok($$select api.publish_request(pg_temp.payload()||'{"budget_amount":"NaN"}',gen_random_uuid())$$,'22023',null,'non-finite budget rejected');
select extensions.throws_ok($$select api.publish_request(pg_temp.payload()||'{"budget_currency":"USD"}',gen_random_uuid())$$,'23514',null,'budget EUR only');
select extensions.throws_ok($$select api.publish_request(pg_temp.payload()||'{"budget_amount":null}',gen_random_uuid())$$,'23514',null,'budget pair enforced');
select extensions.throws_ok($$select api.publish_request(jsonb_set(pg_temp.payload(),'{vehicles,0,photos}','[{"url":"https://fake.test/photo"}]'),gen_random_uuid())$$,'22023',null,'fake photo metadata rejected');
select extensions.lives_ok($$select api.publish_request((pg_temp.payload()-'budget_amount'-'budget_currency')||'{"pickup":{"kind":"flexible","option":"next-week"}}','34000000-0000-0000-0000-000000000002')$$,'budget absent and flexible window accepted');
select extensions.ok((select pickup_from=(statement_timestamp() at time zone 'Europe/Vilnius')::date and pickup_to=pickup_from+7 and pickup_anchor_date=pickup_from from api.my_requests where pickup_kind='flexible'),'flexible dates frozen by database calendar');
reset role;
select extensions.is((select count(*)::int from app.request_revisions),2,'one immutable revision per publication');
select extensions.is((select count(*)::int from app.audit_log where action='request.published'),2,'one publication audit per committed Request');
select extensions.ok(not exists(select 1 from app.request_revisions where public_terms_snapshot::text like '%SECRET%' or public_terms_snapshot::text like '%contact@example.test%'),'snapshots exclude private instructions and contacts');
select extensions.throws_ok($$update app.transport_requests set customer_id='31000000-0000-0000-0000-000000000002'$$,'23514',null,'trusted updates cannot reassign Request identity');
select extensions.throws_ok($$update app.transport_requests set id=gen_random_uuid()$$,'23514',null,'trusted updates cannot replace Request ID');
select extensions.throws_ok($$update app.transport_requests set client_publish_key=gen_random_uuid()$$,'23514',null,'trusted updates cannot replace publication retry identity');
select extensions.throws_ok($$update app.request_revisions set version=version$$,'42501',null,'revisions immutable');
create function pg_temp.remove_vehicles() returns void language plpgsql as $$
begin
  update app.request_vehicles set removed_at=now();
  set constraints all immediate;
end;
$$;
select extensions.throws_ok('select pg_temp.remove_vehicles()','23514',null,'published Request cannot commit without vehicles');
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"31000000-0000-0000-0000-000000000002","session_id":"32000000-0000-0000-0000-000000000002"}',true);
select extensions.is((select count(*)::int from api.my_requests),0,'unrelated customer cannot read Request');
select extensions.is((select count(*)::int from api.my_request_private_details),0,'unrelated customer cannot read exact address');
select extensions.is((select count(*)::int from api.marketplace_requests),0,'customer without carrier membership cannot browse Requests');
select set_config('request.jwt.claims','{"sub":"31000000-0000-0000-0000-000000000003","session_id":"32000000-0000-0000-0000-000000000003"}',true);
select extensions.is((select count(*)::int from api.marketplace_requests),2,'carrier reads active marketplace safe projection');
select extensions.is((select count(*)::int from api.request_vehicles),4,'carrier reads public vehicle locations');
select extensions.is((select count(*)::int from api.my_requests),0,'carrier cannot read customer owner projection');
select extensions.is((select count(*)::int from api.my_request_private_details),0,'carrier cannot read source private addresses before Booking');
select extensions.ok(not exists(select 1 from api.marketplace_requests r where to_jsonb(r)::text like '%SECRET%' or to_jsonb(r)::text like '%contact@example.test%'),'carrier projection excludes exact address and contacts');
select extensions.throws_ok($$update app.transport_requests set notes='attack'$$,'42501',null,'carrier cannot modify customer Request');
reset role;
update app.transport_requests set moderation_status='hidden';
set local role authenticated;
select extensions.is((select count(*)::int from api.marketplace_requests),0,'hidden Request unavailable to carrier');
select extensions.is((select count(*)::int from api.request_vehicles),0,'hidden Request vehicles unavailable to carrier');
reset role;
update app.profiles set beta_access=false where id='31000000-0000-0000-0000-000000000001';
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"31000000-0000-0000-0000-000000000001","session_id":"32000000-0000-0000-0000-000000000001"}',true);
select extensions.throws_ok($$select api.publish_request(pg_temp.payload(),gen_random_uuid())$$,'42501',null,'beta admission required');
reset role;
update app.profiles set beta_access=true,account_status='suspended' where id='31000000-0000-0000-0000-000000000001';
set local role authenticated;
select extensions.throws_ok($$select api.publish_request(pg_temp.payload(),gen_random_uuid())$$,'42501',null,'active profile required');
reset role;
update app.profiles set account_status='active' where id='31000000-0000-0000-0000-000000000001';
delete from auth.sessions where id='32000000-0000-0000-0000-000000000001';
set local role authenticated;
select extensions.throws_ok($$select api.publish_request(pg_temp.payload(),gen_random_uuid())$$,'42501',null,'revoked live session rejected');
reset role;
select extensions.is((select count(*)::int from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='app' and c.relname in ('transport_requests','request_vehicles','request_vehicle_private_details','request_revisions') and c.relrowsecurity),4,'all four new tables enable RLS');
set constraints all immediate;
select * from extensions.finish();
rollback;
