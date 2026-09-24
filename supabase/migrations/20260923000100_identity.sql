begin;

create schema app;
create schema api;
create schema private;
revoke all on schema app, api, private from public;
revoke create on schema public from public;
-- Schema-local defaults cannot revoke PostgreSQL's global PUBLIC EXECUTE default.
-- Revoke on every function explicitly before allowlisting callers below.
alter default privileges in schema app, api, private revoke all on tables from anon, authenticated;

-- Dedicated non-login owners; never grant membership in these roles to API roles.
do $$
begin
  if not exists (select 1 from pg_catalog.pg_roles where rolname = 'parvezk_auth_sync') then
    create role parvezk_auth_sync nologin noinherit;
  elsif exists (select 1 from pg_catalog.pg_roles where rolname = 'parvezk_auth_sync'
    and (rolcanlogin or rolsuper or rolbypassrls or rolinherit)) then
    raise exception 'Unsafe existing function-owner role: parvezk_auth_sync';
  end if;
end;
$$;
do $$
begin
  if not exists (select 1 from pg_catalog.pg_roles where rolname = 'parvezk_commands') then
    create role parvezk_commands nologin noinherit;
  elsif exists (select 1 from pg_catalog.pg_roles where rolname = 'parvezk_commands'
    and (rolcanlogin or rolsuper or rolbypassrls or rolinherit)) then
    raise exception 'Unsafe existing function-owner role: parvezk_commands';
  end if;
end;
$$;
do $$
begin
  if not exists (select 1 from pg_catalog.pg_roles where rolname = 'parvezk_authorization') then
    create role parvezk_authorization nologin noinherit;
  elsif exists (select 1 from pg_catalog.pg_roles where rolname = 'parvezk_authorization'
    and (rolcanlogin or rolsuper or rolbypassrls or rolinherit)) then
    raise exception 'Unsafe existing function-owner role: parvezk_authorization';
  end if;
end;
$$;
grant usage on schema app, private to parvezk_auth_sync, parvezk_commands, parvezk_authorization;
grant usage on schema api to parvezk_commands;
grant usage on schema app, api, private to authenticated;
grant usage on schema app, api to anon;
grant usage on schema app, api, private to service_role;

create table app.profiles (
  id uuid primary key references auth.users(id) on delete restrict,
  display_name text not null default '',
  contact_email text,
  phone_e164 text,
  email_verified_at timestamptz,
  phone_verified_at timestamptz,
  preferred_locale text not null default 'en',
  account_status text not null default 'active',
  beta_access boolean not null default false,
  deleted_at timestamptz,
  created_at timestamptz not null default transaction_timestamp(),
  updated_at timestamptz not null default transaction_timestamp(),
  constraint profiles_name check (display_name = btrim(display_name) and length(display_name) <= 200),
  constraint profiles_email check (contact_email is null or (length(contact_email) <= 254 and contact_email = btrim(contact_email) and contact_email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$')),
  constraint profiles_phone check (phone_e164 is null or phone_e164 ~ '^\+[1-9][0-9]{1,14}$'),
  constraint profiles_confirmed_contacts check ((email_verified_at is null or contact_email is not null) and (phone_verified_at is null or phone_e164 is not null)),
  constraint profiles_locale check (preferred_locale in ('en','lt','de','nl','fr','pl','ro','uk','ru')),
  constraint profiles_status check (account_status in ('active','suspended','deleted')),
  constraint profiles_deleted check ((account_status = 'deleted') = (deleted_at is not null))
);
create unique index profiles_confirmed_phone on app.profiles(phone_e164)
  where phone_verified_at is not null and deleted_at is null;
alter table app.profiles enable row level security;

create table app.platform_roles (
  user_id uuid not null references app.profiles(id) on delete restrict,
  role text not null,
  granted_by uuid references app.profiles(id) on delete restrict,
  revoked_at timestamptz,
  created_at timestamptz not null default transaction_timestamp(),
  updated_at timestamptz not null default transaction_timestamp(),
  primary key (user_id, role),
  constraint platform_roles_admin check (role = 'admin')
);
create index platform_roles_grantor on app.platform_roles(granted_by);
alter table app.platform_roles enable row level security;

-- Needed now for membership changes, controlled beta admission and bootstrap audit.
create table app.audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references app.profiles(id) on delete restrict,
  action text not null,
  entity_type text not null,
  entity_id uuid not null,
  correlation_id uuid not null,
  reason text,
  change_summary jsonb not null,
  created_at timestamptz not null default transaction_timestamp(),
  constraint audit_action check (action in ('carrier.created','carrier.updated','carrier.owner_transferred','profile.updated','profile.beta_access','platform_role.bootstrap')),
  constraint audit_entity check (entity_type in ('profile','carrier','platform_role')),
  constraint audit_reason check (reason is null or (reason = btrim(reason) and length(reason) between 1 and 2000)),
  constraint audit_summary check (jsonb_typeof(change_summary) = 'object' and octet_length(change_summary::text) <= 16384
    and change_summary - array['fields','beta_access','role']::text[] = '{}'::jsonb)
);
create index audit_log_actor on app.audit_log(actor_id);
create index audit_log_entity on app.audit_log(entity_type,entity_id,created_at);
alter table app.audit_log enable row level security;

create function private.set_timestamps() returns trigger
language plpgsql set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    new.created_at := transaction_timestamp();
  else
    new.created_at := old.created_at;
  end if;
  new.updated_at := transaction_timestamp();
  return new;
end;
$$;
revoke execute on function private.set_timestamps() from public, anon, authenticated, service_role;
create trigger profiles_timestamps before insert or update on app.profiles
for each row execute function private.set_timestamps();
create trigger platform_roles_timestamps before insert or update on app.platform_roles
for each row execute function private.set_timestamps();

create function private.guard_audit() returns trigger
language plpgsql set search_path = '' as $$
begin
  if tg_op <> 'INSERT' then raise exception 'Audit is append-only' using errcode = '42501'; end if;
  new.created_at := transaction_timestamp();
  return new;
end;
$$;
revoke execute on function private.guard_audit() from public, anon, authenticated, service_role;
create trigger audit_append_only before insert on app.audit_log
for each row execute function private.guard_audit();
-- Statement-level rejection also covers zero-row mutations and TRUNCATE.
create trigger audit_no_mutation before update or delete or truncate on app.audit_log
for each statement execute function private.guard_audit();
revoke update, delete, truncate on app.audit_log from anon, authenticated, service_role,
  parvezk_commands, parvezk_auth_sync, parvezk_authorization;

-- Only managed Auth columns establish confirmation. User metadata never grants authority.
create function private.sync_auth_profile() returns trigger
language plpgsql security definer set search_path = '' as $$
declare canonical_phone text;
begin
  canonical_phone := case when nullif(new.phone, '') is null then null
    when left(new.phone,1) = '+' then new.phone else '+' || new.phone end;
  insert into app.profiles(id, contact_email, phone_e164, email_verified_at, phone_verified_at)
  values (new.id, nullif(new.email,''), canonical_phone, new.email_confirmed_at, new.phone_confirmed_at)
  on conflict (id) do update set
    contact_email = case
      when new.email is distinct from old.email or new.email_confirmed_at is distinct from old.email_confirmed_at
      then nullif(new.email,'') else app.profiles.contact_email end,
    email_verified_at = case
      when new.email is distinct from old.email or new.email_confirmed_at is distinct from old.email_confirmed_at
      then new.email_confirmed_at else app.profiles.email_verified_at end,
    phone_e164 = canonical_phone,
    phone_verified_at = new.phone_confirmed_at;
  return new;
end;
$$;
revoke execute on function private.sync_auth_profile() from public, anon, authenticated, service_role;
grant select, insert, update on app.profiles to parvezk_auth_sync;
create policy profiles_auth_sync on app.profiles to parvezk_auth_sync using (true) with check (true);
create trigger auth_profile_sync after insert or update of email, phone, email_confirmed_at, phone_confirmed_at
on auth.users for each row execute function private.sync_auth_profile();

create policy profiles_self_read on app.profiles for select to authenticated using (id = (select auth.uid()));
create policy platform_roles_self_read on app.platform_roles for select to authenticated using (user_id = (select auth.uid()));
grant select on app.profiles, app.platform_roles to authenticated;
grant select, update on app.profiles to parvezk_commands;
create policy profiles_command on app.profiles to parvezk_commands using (id = (select auth.uid())) with check (id = (select auth.uid()));
grant insert on app.audit_log to parvezk_commands;
create policy audit_command_insert on app.audit_log for insert to parvezk_commands with check (actor_id = (select auth.uid()));

create view api.my_profile with (security_invoker = true) as
select id, display_name, contact_email, phone_e164, email_verified_at, phone_verified_at,
  preferred_locale, account_status, beta_access, deleted_at, created_at, updated_at from app.profiles;
create view api.my_platform_roles with (security_invoker = true) as
select user_id, role, granted_by, revoked_at, created_at, updated_at from app.platform_roles;
grant select on api.my_profile, api.my_platform_roles to authenticated;

-- The migration executor has auth USAGE but cannot delegate it. SQL-standard
-- bodies resolve Auth objects at creation time, retaining dependency tracking
-- and runtime object ACL checks without requiring runtime schema name lookup.
-- This invoker adapter grants no table access and is callable only by commands.
create function private.request_user_id() returns uuid
language sql stable set search_path = ''
return auth.uid();
revoke execute on function private.request_user_id() from public, anon, authenticated, service_role;
grant execute on function private.request_user_id() to parvezk_commands;

-- Managed auth.sessions has default-deny RLS, and the migration executor
-- cannot grant auth schema USAGE or install policies on this managed table.
-- This private, owner-executed view is the sole trusted Auth read boundary.
-- It returns only a boolean for the JWT's own user/session pair, never rows,
-- and only the narrow authorization role may read it. All API views remain
-- security_invoker; this internal view is deliberately not API-exposed.
create view private.current_session with (security_barrier = true, security_invoker = false) as
select exists (select 1 from auth.sessions s
  where s.id::text = auth.jwt()->>'session_id' and s.user_id = auth.uid()
    and (s.not_after is null or s.not_after > statement_timestamp())) as is_live;
revoke all on private.current_session from public, anon, authenticated, service_role;
grant select on private.current_session to parvezk_authorization;

create function private.has_live_session() returns boolean
language sql stable security definer set search_path = ''
begin atomic
  select is_live from private.current_session;
end;
revoke execute on function private.has_live_session() from public, anon, authenticated, service_role;
grant execute on function private.has_live_session() to parvezk_commands;

create function private.require_active_user(require_beta boolean default false) returns uuid
language plpgsql set search_path = '' as $$
declare caller uuid := private.request_user_id();
begin
  if caller is null or not private.has_live_session() then
    raise exception 'Not authorized' using errcode = '42501';
  end if;
  perform 1 from app.profiles where id = caller and account_status = 'active'
    and (not require_beta or beta_access) for update;
  if not found then raise exception 'Not authorized' using errcode = '42501'; end if;
  return caller;
end;
$$;
revoke execute on function private.require_active_user(boolean) from public, anon, authenticated, service_role;
grant execute on function private.require_active_user(boolean) to parvezk_commands;

create function api.update_my_profile(p_display_name text, p_contact_email text, p_preferred_locale text)
returns void language plpgsql security definer set search_path = '' as $$
declare caller uuid;
begin
  caller := private.require_active_user(false);
  update app.profiles set display_name = btrim(p_display_name),
    contact_email = nullif(btrim(p_contact_email),''), preferred_locale = p_preferred_locale,
    email_verified_at = case when contact_email = nullif(btrim(p_contact_email),'') then email_verified_at else null end
  where id = caller;
  insert into app.audit_log(actor_id,action,entity_type,entity_id,correlation_id,change_summary)
    values(caller,'profile.updated','profile',caller,gen_random_uuid(),'{"fields":["display_name","contact_email","preferred_locale"]}');
end;
$$;
revoke execute on function api.update_my_profile(text,text,text) from public, anon, authenticated, service_role;
grant execute on function api.update_my_profile(text,text,text) to authenticated;

-- Direct administrative SQL is out-of-band only. No service key is required by the app.
grant select, insert, update on app.profiles, app.platform_roles to service_role;
grant select, insert on app.audit_log to service_role;
-- PostgreSQL 17/Supabase migrations run without superuser ownership bypass.
-- Finish trigger creation and EXECUTE grants while still owning the functions.
-- Give only this trusted migration executor temporary SET permission (not
-- inherited runtime privileges), and give new owners temporary schema CREATE.
-- Keep the creator's ADMIN-only membership for later migrations/local resets;
-- remove SET permission and schema CREATE before this transaction commits.
grant parvezk_auth_sync, parvezk_authorization, parvezk_commands to current_user with inherit false;
grant parvezk_auth_sync, parvezk_authorization, parvezk_commands to current_user with set true;
grant create on schema private to parvezk_auth_sync;
grant create on schema private to parvezk_authorization;
grant create on schema api to parvezk_commands;

alter function private.sync_auth_profile() owner to parvezk_auth_sync;
alter function private.has_live_session() owner to parvezk_authorization;
alter function api.update_my_profile(text,text,text) owner to parvezk_commands;

revoke create on schema private from parvezk_auth_sync;
revoke create on schema private from parvezk_authorization;
revoke create on schema api from parvezk_commands;
revoke set option for parvezk_auth_sync, parvezk_authorization, parvezk_commands from current_user;
commit;
