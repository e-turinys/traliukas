begin;
-- Historical terms remain visible only to the original commercial parties.
create policy request_terms_offer_history on app.request_revisions for select to authenticated using
(exists(select 1 from app.offer_revisions t where t.request_id=request_revisions.request_id and t.request_version=request_revisions.version));
create policy carrier_offer_history on app.carriers for select to authenticated using
(exists(select 1 from app.offers o where o.carrier_id=carriers.id));
create view api.commercial_carriers with(security_invoker=true) as
select id,display_name,registration_country from app.carriers where exists(select 1 from app.offers o where o.carrier_id=carriers.id);
create view api.offers with(security_invoker=true) as
select o.id,o.request_id,o.carrier_id,o.route_id,private.effective_offer_status(o.id) as status,o.current_version,o.created_at,o.updated_at,
 case when private.owns_request(o.request_id) then 'customer' else 'carrier' end as viewer_side,
 c.id as conversation_id from app.offers o join app.conversations c on c.request_id=o.request_id and c.carrier_id=o.carrier_id;
create view api.offer_revisions with(security_invoker=true) as
select offer_id,version,request_id,request_version,route_id,route_version,total_price,currency,planned_pickup_date,pickup_time_from,pickup_time_to,pickup_time_zone,planned_delivery_date,payment_terms,carrier_comment,expires_at,created_at from app.offer_revisions;
create view api.commercial_request_terms with(security_invoker=true) as
select request_id,version,public_terms_snapshot from app.request_revisions;
create view api.conversations with(security_invoker=true) as
select c.id,c.request_id,c.carrier_id,c.current_offer_id,private.effective_conversation_status(c.id) as status,c.last_message_at,c.created_at,
 b.id as booking_id,case when private.owns_request(c.request_id) then 'customer' else 'carrier' end as viewer_side
from app.conversations c left join app.bookings b on b.conversation_id=c.id;
create view api.messages with(security_invoker=true) as
select id,conversation_id,sequence,kind,sender_side,body,created_at from app.messages;
create view api.my_read_cursors with(security_invoker=true) as
select conversation_id,last_read_sequence,updated_at from app.conversation_reads where user_id=auth.uid();
create view api.bookings with(security_invoker=true) as
select id,request_id,accepted_offer_id,accepted_offer_version,carrier_id,route_id,conversation_id,vehicle_count,agreed_total_price,currency,payment_terms,planned_pickup_date,planned_delivery_date,snapshot_schema_version,agreement_snapshot,status,created_at from app.bookings;
grant select on api.commercial_carriers,api.offers,api.offer_revisions,api.commercial_request_terms,api.conversations,api.messages,api.my_read_cursors,api.bookings to authenticated;
commit;
