begin;
create extension if not exists pgtap with schema extensions;
select extensions.no_plan();

-- These are catalog/privilege assertions, not calls as a superuser that could
-- conceal an accidentally privileged function owner or a leaked role grant.
with expected(signature, owner_name) as (values
  ('private.sync_auth_profile()', 'parvezk_auth_sync'),
  ('private.has_live_session()', 'parvezk_authorization'),
  ('api.update_my_profile(text,text,text)', 'parvezk_commands'),
  ('private.lock_membership_carrier()', 'parvezk_authorization'),
  ('private.require_one_owner()', 'parvezk_authorization'),
  ('private.is_carrier_owner(uuid)', 'parvezk_authorization'),
  ('api.create_carrier(text,text,text,text,text)', 'parvezk_commands'),
  ('api.update_my_carrier(uuid,text,text,text[],boolean,boolean,boolean)', 'parvezk_commands'),
  ('private.audit_verification_change()', 'parvezk_verification_audit'),
  ('api.publish_request(jsonb,uuid)', 'parvezk_commands'),
  ('private.owns_request(uuid)', 'parvezk_authorization'),
  ('private.can_read_request(uuid)', 'parvezk_authorization'),
  ('private.lock_request_vehicle()', 'parvezk_authorization'),
  ('private.require_complete_request()', 'parvezk_authorization')
)
select extensions.ok(
  coalesce(p.proowner = r.oid and p.prosecdef and 'search_path=""' = any(p.proconfig), false),
  signature || ' retains its narrow owner, SECURITY DEFINER and empty search_path')
from expected e
left join pg_catalog.pg_proc p on p.oid = to_regprocedure(e.signature)
left join pg_catalog.pg_roles r on r.rolname = e.owner_name;

with owners(name) as (values ('parvezk_auth_sync'), ('parvezk_commands'),
  ('parvezk_authorization'), ('parvezk_verification_audit'))
select extensions.ok(
  not r.rolcanlogin and not r.rolsuper and not r.rolbypassrls and not r.rolinherit
  and not has_schema_privilege(r.oid, 'private', 'CREATE')
  and not has_schema_privilege(r.oid, 'api', 'CREATE'),
  name || ' remains non-login/unprivileged without temporary schema CREATE')
from owners join pg_catalog.pg_roles r on r.rolname = name;

with owners(name) as (values ('parvezk_auth_sync'), ('parvezk_commands'),
  ('parvezk_authorization'), ('parvezk_verification_audit')),
clients(name) as (values ('anon'), ('authenticated'), ('authenticator'), ('service_role'))
select extensions.ok(
  not pg_has_role(clients.name, owners.name, 'SET')
  and not pg_has_role(clients.name, owners.name, 'USAGE'),
  clients.name || ' cannot assume or inherit ' || owners.name)
from owners cross join clients;

select extensions.ok(not exists (
  select 1 from pg_catalog.pg_auth_members m
  join pg_catalog.pg_roles owner_role on owner_role.oid = m.roleid
  join pg_catalog.pg_roles executor on executor.oid = m.member
  where owner_role.rolname in ('parvezk_auth_sync','parvezk_commands',
    'parvezk_authorization','parvezk_verification_audit')
    and executor.rolname = current_user and (m.set_option or m.inherit_option)
), 'migration executor retains no temporary SET/inherited membership privileges');

-- Check the entire client EXECUTE allowlist, including helpers used by RLS.
with clients(name) as (values ('anon'), ('authenticated'), ('service_role'))
select extensions.is(
  has_function_privilege(clients.name, p.oid, 'EXECUTE'),
  clients.name = 'authenticated' and p.oid in (
    'api.update_my_profile(text,text,text)'::regprocedure,
    'api.create_carrier(text,text,text,text,text)'::regprocedure,
    'api.update_my_carrier(uuid,text,text,text[],boolean,boolean,boolean)'::regprocedure,
    'private.is_carrier_owner(uuid)'::regprocedure,
    'api.publish_request(jsonb,uuid)'::regprocedure,
    'private.owns_request(uuid)'::regprocedure,
    'private.can_read_request(uuid)'::regprocedure),
  clients.name || ' EXECUTE allowlist: ' || p.oid::regprocedure::text)
from pg_catalog.pg_proc p
join pg_catalog.pg_namespace n on n.oid = p.pronamespace
cross join clients where n.nspname in ('api','private');

select extensions.ok(not exists (
  select 1 from pg_catalog.pg_proc p
  join pg_catalog.pg_namespace n on n.oid = p.pronamespace,
  lateral aclexplode(coalesce(p.proacl, acldefault('f',p.proowner))) a
  where n.nspname in ('api','private') and a.grantee = 0 and a.privilege_type = 'EXECUTE'
), 'no foundation function grants PUBLIC EXECUTE');

with roles(name) as (values ('anon'), ('authenticated'), ('parvezk_commands'),
  ('parvezk_auth_sync'), ('parvezk_authorization'), ('parvezk_verification_audit'))
select extensions.ok(not has_any_column_privilege(name,'auth.users','SELECT'),
  name || ' has no Auth user reads') from roles;

select extensions.ok(
  not has_any_column_privilege('parvezk_authorization','auth.sessions','SELECT')
  and has_table_privilege('parvezk_authorization','private.current_session','SELECT'),
  'session authorization reads only the private caller-scoped boolean');

with clients(name) as (values ('anon'), ('authenticated'), ('service_role'), ('parvezk_commands'))
select extensions.ok(not has_table_privilege(name,'private.current_session','SELECT'),
  name || ' cannot read the private Auth boundary') from clients;

with roles(name) as (values ('anon'), ('authenticated'), ('service_role'),
  ('parvezk_commands'), ('parvezk_verification_audit'))
select extensions.ok(
  not has_table_privilege(name,'app.audit_log','UPDATE')
  and not has_table_privilege(name,'app.audit_log','DELETE')
  and not has_table_privilege(name,'app.audit_log','TRUNCATE'),
  name || ' cannot mutate or truncate audit records') from roles;

select * from extensions.finish();
rollback;
