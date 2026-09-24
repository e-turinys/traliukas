begin;
create extension if not exists pgtap with schema extensions;
select extensions.no_plan();

insert into auth.users(id,email,email_confirmed_at,phone,phone_confirmed_at,raw_user_meta_data)
values ('10000000-0000-0000-0000-000000000001','first@example.test',now(),'37060000001',now(),'{"role":"admin","beta_access":true}'),
 ('10000000-0000-0000-0000-000000000002','second@example.test',null,null,null,'{}');
insert into auth.sessions(id,user_id,created_at,updated_at)
values ('20000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001',now(),now()),
 ('20000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000002',now(),now());
select extensions.is((select count(*)::int from app.profiles),2,'Auth provisions profiles');
select extensions.is((select phone_e164 from app.profiles where id='10000000-0000-0000-0000-000000000001'),'+37060000001','Auth phone normalized to E.164');
select extensions.ok((select phone_verified_at is not null from app.profiles where id='10000000-0000-0000-0000-000000000001'),'trusted phone confirmation synchronized');
select extensions.is((select count(*)::int from app.platform_roles),0,'metadata cannot grant admin');
select extensions.ok(not (select beta_access from app.profiles where id='10000000-0000-0000-0000-000000000001'),'metadata cannot admit beta');
select extensions.is((select count(*)::int from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='app' and c.relkind='r' and c.relrowsecurity and c.relname in ('profiles','platform_roles','audit_log','carriers','carrier_memberships','carrier_private_details','carrier_verifications','public_locations')),8,'all eight foundation tables have RLS');
select extensions.ok(not has_function_privilege('anon','api.update_my_profile(text,text,text)','execute'),'anonymous cannot execute profile command');
select extensions.ok(not has_function_privilege('authenticated','private.sync_auth_profile()','execute'),'client cannot execute Auth trigger');
select extensions.ok(not has_column_privilege('authenticated','app.carrier_verifications','decision_reason','select'),'reviewer notes inaccessible even via SQL');

update app.profiles set beta_access=true where id='10000000-0000-0000-0000-000000000001';
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"10000000-0000-0000-0000-000000000001","role":"authenticated","session_id":"20000000-0000-0000-0000-000000000001"}',true);
select extensions.is((select count(*)::int from api.my_profile),1,'self profile visible');
select extensions.is((select count(*)::int from api.my_profile where id='10000000-0000-0000-0000-000000000002'),0,'cross-user profile hidden');
select extensions.throws_ok($$update app.profiles set beta_access=true$$,'42501',null,'no direct profile writes');
select extensions.throws_ok($$insert into app.platform_roles(user_id,role) values(auth.uid(),'admin')$$,'42501',null,'no self-grant');
select set_config('request.jwt.claims','{"sub":"10000000-0000-0000-0000-000000000001","role":"authenticated","session_id":"20000000-0000-0000-0000-000000000002"}',true);
select extensions.throws_ok($$select api.update_my_profile('Attack','contact@example.test','lt')$$,'42501',null,'another user session cannot authorize commands');
reset role;
update auth.sessions set not_after=statement_timestamp() - interval '1 minute' where id='20000000-0000-0000-0000-000000000001';
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"10000000-0000-0000-0000-000000000001","role":"authenticated","session_id":"20000000-0000-0000-0000-000000000001"}',true);
select extensions.throws_ok($$select api.update_my_profile('Attack','contact@example.test','lt')$$,'42501',null,'expired session cannot authorize commands');
reset role;
update auth.sessions set not_after=null where id='20000000-0000-0000-0000-000000000001';
set local role authenticated;
select extensions.lives_ok($$select api.update_my_profile('First User','contact@example.test','lt')$$,'allowed profile fields via command');
select extensions.ok((select email_verified_at is null from api.my_profile),'contact replacement clears email confirmation');
select extensions.is((select phone_e164 from api.my_profile),'+37060000001','profile command cannot replace trusted phone');
select extensions.lives_ok($$select api.create_carrier('first-carrier','First Carrier','First Business','company','LT')$$,'admitted caller creates carrier and owner atomically');
select extensions.is((select count(*)::int from api.my_carrier_memberships where active),1,'one owner created');
select extensions.is((select count(*)::int from api.my_carrier_private_details),1,'owner sees legal data');
select extensions.is((select count(*)::int from api.public_carriers),0,'draft omitted from public projection even for owner');
select extensions.throws_ok($$update app.carriers set visibility='published'$$,'42501',null,'owner cannot publish or approve directly');
select extensions.throws_ok($$insert into app.carrier_verifications(carrier_id,category,status) select id,'identity','approved' from api.my_carriers$$,'42501',null,'owner cannot self-approve verification');
select extensions.lives_ok($$select api.update_my_carrier((select id from api.my_carriers),'Changed Carrier','Description',array['LT','DE'],true,true,false)$$,'owner can update safe declarations');
reset role;
update app.carriers set visibility='published';
insert into app.carrier_verifications(carrier_id,category,status,decision_reason)
select id,'identity','pending','Internal reviewer context' from app.carriers;
insert into app.public_locations(slug,city,country_name,country_code,time_zone) values('test-city','Test City','Lithuania','LT','Europe/Vilnius');

set local role authenticated;
select extensions.is((select count(*)::int from api.my_carrier_verifications),1,'owner status projection visible');
select extensions.throws_ok($$select decision_reason from app.carrier_verifications$$,'42501',null,'owner cannot read internal reviewer context');
select set_config('request.jwt.claims','{"sub":"10000000-0000-0000-0000-000000000002","role":"authenticated","session_id":"20000000-0000-0000-0000-000000000002"}',true);
select extensions.is((select count(*)::int from api.my_carrier_private_details),0,'cross-user legal data isolation');
select extensions.is((select count(*)::int from api.my_carrier_verifications),0,'cross-user verification isolation');
select extensions.is((select count(*)::int from api.my_carrier_memberships),0,'cross-user membership isolation');
select extensions.is((select count(*)::int from api.my_carriers),0,'my carriers excludes someone else’s public carrier');
select extensions.is((select count(*)::int from api.public_carriers),1,'public carrier readable by another user');
select extensions.throws_ok($$select api.create_carrier('second-carrier','Second','Second','individual','LT')$$,'42501',null,'non-admitted user cannot create carrier');
reset role;
update app.profiles set beta_access=true where id='10000000-0000-0000-0000-000000000002';
set local role authenticated;
select extensions.throws_ok($$select api.update_my_carrier((select id from api.public_carriers),'Attack','',array['LT'],false,false,false)$$,'42501',null,'admitted non-owner cannot edit carrier');
reset role;

set local role anon;
select set_config('request.jwt.claims','{"role":"anon"}',true);
select extensions.is((select count(*)::int from api.public_carriers),1,'anonymous can read published carrier');
select extensions.is((select count(*)::int from api.public_locations where slug='test-city'),1,'anonymous can read curated catalog');
select extensions.throws_ok($$select * from api.my_profile$$,'42501',null,'anonymous private profile denied');
select extensions.throws_ok($$select * from api.my_carrier_private_details$$,'42501',null,'anonymous legal data denied');
select extensions.throws_ok($$select * from api.my_carrier_verifications$$,'42501',null,'anonymous verification evidence denied');
select extensions.throws_ok($$select * from app.audit_log$$,'42501',null,'anonymous audit denied');
reset role;
select extensions.ok(not exists (select 1 from information_schema.columns where table_schema='api' and table_name='public_carriers' and column_name in ('contact_email','contact_phone','legal_name','user_id','decision_reason','evidence_key')),'public projection excludes private columns');
update app.carriers set suspended_at=now();
set local role anon;
select extensions.is((select count(*)::int from api.public_carriers),0,'suspended carrier not public');
reset role;
update app.carriers set suspended_at=null;

select extensions.throws_ok($$insert into app.carrier_memberships(carrier_id,user_id,role) select id,'10000000-0000-0000-0000-000000000002','owner' from app.carriers$$,'23505',null,'second active owner rejected');
select extensions.throws_ok($$insert into app.carrier_memberships(carrier_id,user_id,role,active) select id,'10000000-0000-0000-0000-000000000002','operator',false from app.carriers$$,'23514',null,'staff/operator rejected');
create function pg_temp.remove_owner() returns void language plpgsql as $$
begin
  update app.carrier_memberships set active=false;
  set constraints all immediate;
end;
$$;
create function pg_temp.delete_owner() returns void language plpgsql as $$
begin
  delete from app.carrier_memberships;
  set constraints all immediate;
end;
$$;
select extensions.throws_ok('select pg_temp.delete_owner()','23514',null,'last owner deletion rejected at transaction end');
select extensions.throws_ok($$insert into app.carrier_memberships(carrier_id,user_id,role,active) select id,'10000000-0000-0000-0000-000000000002','staff',false from app.carriers$$,'23514',null,'staff role also rejected');
select extensions.throws_ok('select pg_temp.remove_owner()','23514',null,'last owner removal rejected at transaction end');
create function pg_temp.orphan_carrier() returns void language plpgsql as $$
begin
  insert into app.carriers(slug,display_name) values('orphan-carrier','Orphan');
  set constraints all immediate;
end;
$$;
select extensions.throws_ok('select pg_temp.orphan_carrier()','23514',null,'orphan carrier cannot commit');

update auth.users set phone='37060000003',phone_confirmed_at=null where id='10000000-0000-0000-0000-000000000001';
select extensions.ok((select phone_e164='+37060000003' and phone_verified_at is null from app.profiles where id='10000000-0000-0000-0000-000000000001'),'Auth contact change clears stale proof');
update auth.users set phone_confirmed_at=now() where id='10000000-0000-0000-0000-000000000001';
select extensions.ok((select phone_verified_at is not null from app.profiles where id='10000000-0000-0000-0000-000000000001'),'new phone confirmation synchronizes');
select extensions.throws_ok($$update app.profiles set phone_e164='+37060000003',phone_verified_at=now() where id='10000000-0000-0000-0000-000000000002'$$,'23505',null,'confirmed phone uniqueness');
select extensions.throws_ok($$delete from auth.users where id='10000000-0000-0000-0000-000000000001'$$,'23503',null,'Auth deletion cannot cascade commercial identity');
select extensions.throws_ok($$update app.audit_log set action='profile.updated'$$,'42501',null,'audit immutable even for trusted writers');
select extensions.throws_ok($$delete from app.audit_log$$,'42501',null,'trusted writer cannot delete audit records');
select extensions.throws_ok($$truncate app.audit_log$$,'42501',null,'trusted writer cannot truncate audit records');
select extensions.throws_ok($$update app.audit_log set action='profile.updated' where false$$,'42501',null,'audit mutation denied even when no rows match');
update app.profiles set account_status='suspended' where id='10000000-0000-0000-0000-000000000001';
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"10000000-0000-0000-0000-000000000001","role":"authenticated","session_id":"20000000-0000-0000-0000-000000000001"}',true);
select extensions.is((select count(*)::int from api.my_profile),1,'suspended users retain own reads');
select extensions.throws_ok($$select api.update_my_profile('Attack','contact@example.test','en')$$,'42501',null,'suspension blocks writes');
reset role;
update app.profiles set account_status='active' where id='10000000-0000-0000-0000-000000000001';
delete from auth.sessions where id='20000000-0000-0000-0000-000000000001';
set local role authenticated;
select extensions.throws_ok($$select api.update_my_profile('Attack','contact@example.test','en')$$,'42501',null,'revoked session cannot mutate with unexpired JWT');
reset role;
set constraints all immediate;
select * from extensions.finish();
rollback;
