begin;

-- Transactional in-app projection of existing trusted events; no provider queue.
do $$ begin
 if not exists(select 1 from pg_roles where rolname='parvezk_notifications') then
   create role parvezk_notifications nologin noinherit;
 elsif exists(select 1 from pg_roles where rolname='parvezk_notifications' and (rolcanlogin or rolsuper or rolbypassrls or rolinherit)) then
   raise exception 'Unsafe notification owner';
 end if;
end $$;
grant usage on schema app,private to parvezk_notifications;
grant select on app.transport_requests,app.offers,app.bookings,app.carrier_memberships,app.profiles to parvezk_notifications;
create policy notification_context on app.transport_requests for select to parvezk_notifications using(true);
create policy notification_context on app.offers for select to parvezk_notifications using(true);
create policy notification_context on app.bookings for select to parvezk_notifications using(true);
create policy notification_context on app.carrier_memberships for select to parvezk_notifications using(true);
create policy notification_context on app.profiles for select to parvezk_notifications using(true);

create table app.notifications (
 id uuid primary key default gen_random_uuid(),
 source_event_id uuid not null references app.domain_events(id) on delete restrict,
 recipient_id uuid not null references app.profiles(id) on delete restrict,
 actor_id uuid references app.profiles(id) on delete restrict,
 event_type text not null check(event_type in ('offer.created','offer.updated','message.created','booking.created','booking.pickupScheduled','booking.collected','booking.inTransit','booking.delivered','booking.completed','booking.cancelled')),
 title text not null check(length(title) between 1 and 200),
 body text not null check(length(body) between 1 and 2000),
 href text not null,
 locale text not null check(locale in ('en','lt')),
 entity_type text not null,
 entity_id uuid not null,
 offer_id uuid references app.offers(id) on delete restrict,
 conversation_id uuid references app.conversations(id) on delete restrict,
 booking_id uuid references app.bookings(id) on delete restrict,
 created_at timestamptz not null default transaction_timestamp(),
 read_at timestamptz,
 unique(source_event_id,recipient_id),
 check(actor_id is distinct from recipient_id),
 check(read_at is null or read_at>=created_at),
 check(num_nonnulls(offer_id,conversation_id,booking_id)=1),
 check((entity_type='offer' and entity_id=offer_id and offer_id is not null and href='/offers/'||offer_id::text and event_type in ('offer.created','offer.updated'))
   or (entity_type='conversation' and entity_id=conversation_id and conversation_id is not null and href='/messages/'||conversation_id::text and event_type='message.created')
   or (entity_type='booking' and entity_id=booking_id and booking_id is not null and href='/bookings/'||booking_id::text and event_type like 'booking.%'))
);
alter table app.notifications enable row level security;
revoke all on app.notifications from public,anon,authenticated,service_role;
create index notifications_recipient_time on app.notifications(recipient_id,created_at desc,id desc);
create index notifications_unread on app.notifications(recipient_id,created_at desc,id desc) where read_at is null;
create index notifications_actor on app.notifications(actor_id);
create index notifications_offer on app.notifications(offer_id);
create index notifications_conversation on app.notifications(conversation_id);
create index notifications_booking on app.notifications(booking_id);

create function private.notification_reader() returns boolean
language sql stable security definer set search_path='' as $$
 select private.has_live_session() and exists(select 1 from app.profiles where id=private.request_user_id() and account_status='active');
$$;
revoke execute on function private.notification_reader() from public,anon,authenticated,service_role;
grant execute on function private.notification_reader() to authenticated,parvezk_commands;
create policy notifications_own on app.notifications for select to authenticated,parvezk_commands
 using(recipient_id=auth.uid() and private.notification_reader());
create policy notifications_read_command on app.notifications for update to parvezk_commands
 using(recipient_id=auth.uid() and private.notification_reader()) with check(recipient_id=auth.uid() and private.notification_reader());
grant select on app.notifications to authenticated,parvezk_commands;
grant update(read_at) on app.notifications to parvezk_commands;
grant select,insert on app.notifications to parvezk_notifications;
create policy notifications_writer on app.notifications for insert to parvezk_notifications with check(true);
create policy notifications_writer_read on app.notifications for select to parvezk_notifications using(true);

create function private.guard_notification() returns trigger language plpgsql set search_path='' as $$
begin
 if tg_op='DELETE' or (to_jsonb(new)-'read_at') is distinct from (to_jsonb(old)-'read_at')
   or new.read_at is null or (old.read_at is not null and new.read_at is distinct from old.read_at) then
   raise exception 'Notification content is immutable' using errcode='23514';
 end if;
 return new;
end $$;
revoke execute on function private.guard_notification() from public,anon,authenticated,service_role;
create trigger notifications_immutable before update or delete on app.notifications for each row execute function private.guard_notification();

create function private.notify_domain_event() returns trigger
language plpgsql security definer set search_path='' as $$
declare customer uuid; carrier_owner uuid; carrier uuid; target uuid; kind text; url text;
 recipient uuid; recipients uuid[]; language_code text; heading text; content text; count_vehicles integer;
begin
 if new.event_type not in ('offer.created','offer.updated','message.created','booking.created','booking.pickupScheduled','booking.collected','booking.inTransit','booking.delivered','booking.completed','booking.cancelled') then return new; end if;
 select customer_id into strict customer from app.transport_requests where id=new.request_id;
 select carrier_id into strict carrier from app.offers where id=new.offer_id;
 select user_id into strict carrier_owner from app.carrier_memberships where carrier_id=carrier and active and role='owner';
 if new.event_type in ('offer.created','offer.updated') then
   kind:='offer'; target:=new.offer_id; url:='/offers/'||target::text;
 elsif new.event_type='message.created' then
   kind:='conversation'; target:=new.conversation_id; url:='/messages/'||target::text;
 else
   kind:='booking'; target:=new.booking_id; url:='/bookings/'||target::text;
   select vehicle_count into strict count_vehicles from app.bookings where id=target;
 end if;
 recipients:=case when new.event_type in ('message.created','booking.created','booking.completed','booking.cancelled') then array[customer,carrier_owner] else array[customer] end;
 for recipient in select distinct unnest(recipients) loop
   if recipient is not distinct from new.actor_id then continue; end if;
   select case when preferred_locale='lt' then 'lt' else 'en' end into strict language_code from app.profiles where id=recipient;
   -- Safe bounded copy: never duplicate message text, cancellation reason or private operations.
   heading:=case new.event_type
    when 'offer.created' then case when language_code='lt' then 'Naujas pasiūlymas' else 'New offer' end
    when 'offer.updated' then case when language_code='lt' then 'Pasiūlymas atnaujintas' else 'Offer updated' end
    when 'message.created' then case when language_code='lt' then 'Nauja žinutė' else 'New message' end
    when 'booking.created' then case when language_code='lt' then 'Pasiūlymas priimtas' else 'Offer accepted' end
    when 'booking.pickupScheduled' then case when language_code='lt' then 'Paėmimas suplanuotas' else 'Pickup scheduled' end
    when 'booking.collected' then case when language_code='lt' then case when count_vehicles=1 then 'Automobilis paimtas' else 'Automobiliai paimti' end else 'Vehicles collected' end
    when 'booking.inTransit' then case when language_code='lt' then 'Vežama' else 'In transit' end
    when 'booking.delivered' then case when language_code='lt' then case when count_vehicles=1 then 'Automobilis pristatytas' else 'Automobiliai pristatyti' end else 'Vehicles delivered' end
    when 'booking.completed' then case when language_code='lt' then 'Pervežimas užbaigtas' else 'Transport completed' end
    when 'booking.cancelled' then case when language_code='lt' then 'Pervežimas atšauktas' else 'Transport cancelled' end end;
   content:=case kind when 'offer' then case when language_code='lt' then 'Peržiūrėkite pasiūlymą ir jo sąlygas.' else 'View the offer and its terms.' end
    when 'conversation' then case when language_code='lt' then 'Pokalbyje yra nauja žinutė.' else 'There is a new message in your conversation.' end
    else case when language_code='lt' then 'Peržiūrėkite pervežimo informaciją.' else 'View the transport details.' end end;
   insert into app.notifications(source_event_id,recipient_id,actor_id,event_type,title,body,href,locale,entity_type,entity_id,offer_id,conversation_id,booking_id,created_at)
   values(new.id,recipient,new.actor_id,new.event_type,heading,content,url,language_code,kind,target,
    case when kind='offer' then target end,case when kind='conversation' then target end,case when kind='booking' then target end,new.created_at)
   on conflict(source_event_id,recipient_id) do nothing;
 end loop;
 return new;
end $$;
revoke execute on function private.notify_domain_event() from public,anon,authenticated,service_role;
create trigger notifications_from_event after insert on app.domain_events for each row execute function private.notify_domain_event();

create view api.notifications with (security_invoker=true) as
 select id,source_event_id,recipient_id,actor_id,event_type,title,body,href,locale,entity_type,entity_id,created_at,read_at from app.notifications;
revoke all on api.notifications from public,anon,authenticated,service_role;
grant select on api.notifications to authenticated;

-- NULL means all own unread rows. Caller cannot supply recipient or timestamp.
create function api.mark_notifications_read(p_notification_id uuid default null) returns timestamptz
language plpgsql security definer set search_path='' set lock_timeout='5s' set statement_timeout='15s' as $$
declare caller uuid; stamp timestamptz; result timestamptz;
begin
 caller:=private.require_active_user(false);
 stamp:=clock_timestamp();
 if p_notification_id is not null then
   update app.notifications set read_at=coalesce(read_at,stamp) where id=p_notification_id and recipient_id=caller returning read_at into result;
   if not found then raise exception 'Notification unavailable' using errcode='42501'; end if;
   return result;
 end if;
 update app.notifications set read_at=stamp where recipient_id=caller and read_at is null;
 return stamp;
end $$;
revoke execute on function api.mark_notifications_read(uuid) from public,anon,authenticated,service_role;
grant execute on function api.mark_notifications_read(uuid) to authenticated;

grant parvezk_notifications to current_user with inherit false;
grant parvezk_notifications,parvezk_authorization,parvezk_commands to current_user with set true;
grant create on schema private to parvezk_notifications,parvezk_authorization;
grant create on schema api to parvezk_commands;
alter function private.notify_domain_event() owner to parvezk_notifications;
alter function private.notification_reader() owner to parvezk_authorization;
alter function api.mark_notifications_read(uuid) owner to parvezk_commands;
revoke create on schema private from parvezk_notifications,parvezk_authorization;
revoke create on schema api from parvezk_commands;
revoke set option for parvezk_notifications,parvezk_authorization,parvezk_commands from current_user;
commit;
