begin;
alter table app.audit_log drop constraint audit_action;
alter table app.audit_log add constraint audit_action check (action in (
  'carrier.created','carrier.updated','carrier.owner_transferred','carrier.verification_changed',
  'profile.updated','profile.beta_access','platform_role.bootstrap'));
alter table app.audit_log drop constraint audit_summary;
alter table app.audit_log add constraint audit_summary check (
  jsonb_typeof(change_summary)='object' and octet_length(change_summary::text)<=16384
  and change_summary - array['fields','beta_access','role','category','old_status','new_status']::text[] = '{}'::jsonb);

-- The trigger's owner has no authority to approve or read evidence, only lock
-- the parent and append safe status audit. API roles cannot execute the trigger.
do $$
begin
  if not exists (select 1 from pg_catalog.pg_roles where rolname = 'parvezk_verification_audit') then
    create role parvezk_verification_audit nologin noinherit;
  elsif exists (select 1 from pg_catalog.pg_roles where rolname = 'parvezk_verification_audit'
    and (rolcanlogin or rolsuper or rolbypassrls or rolinherit)) then
    raise exception 'Unsafe existing function-owner role: parvezk_verification_audit';
  end if;
end;
$$;
grant usage on schema app,private to parvezk_verification_audit;
grant select,update on app.carriers to parvezk_verification_audit;
grant insert on app.audit_log to parvezk_verification_audit;
create policy carriers_verification_lock on app.carriers to parvezk_verification_audit using (true) with check (true);
create policy verification_audit_insert on app.audit_log for insert to parvezk_verification_audit with check (true);
create function private.audit_verification_change() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'UPDATE' and (new.id <> old.id or new.carrier_id <> old.carrier_id or new.category <> old.category) then
    raise exception 'Verification identity is immutable' using errcode = '23514';
  end if;
  perform 1 from app.carriers where id=new.carrier_id for update;
  insert into app.audit_log(actor_id,action,entity_type,entity_id,correlation_id,change_summary)
  values(new.reviewed_by,'carrier.verification_changed','carrier',new.carrier_id,gen_random_uuid(),
    jsonb_build_object('category',new.category,'old_status',case when tg_op='INSERT' then null else old.status end,
      'new_status',new.status,'fields',jsonb_build_array('verification')));
  return new;
end;
$$;
revoke execute on function private.audit_verification_change() from public, anon, authenticated, service_role;
create trigger verification_audit before insert or update on app.carrier_verifications
for each row execute function private.audit_verification_change();
-- PostgreSQL 17/Supabase migrations run without superuser ownership bypass.
-- Finish trigger creation and EXECUTE grants while still owning the functions.
-- Give only this trusted migration executor temporary SET permission (not
-- inherited runtime privileges), and give new owners temporary schema CREATE.
-- Keep the creator's ADMIN-only membership for later migrations/local resets;
-- remove SET permission and schema CREATE before this transaction commits.
grant parvezk_verification_audit to current_user with inherit false;
grant parvezk_verification_audit to current_user with set true;
grant create on schema private to parvezk_verification_audit;

alter function private.audit_verification_change() owner to parvezk_verification_audit;

revoke create on schema private from parvezk_verification_audit;
revoke set option for parvezk_verification_audit from current_user;
commit;
