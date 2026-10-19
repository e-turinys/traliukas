// Explicit local-only review bootstrap. Uses the existing local foundation
// bootstrap and real marketplace commands; never imported by product code.
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { seedMarketplace, sql, acting, literal, day, terms } from '../tests/marketplace-local.mjs'

const local = JSON.parse(execFileSync(process.execPath, ['node_modules/supabase/dist/supabase.js', 'status', '--output', 'json'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }))
assert.equal(local.API_URL, 'http://127.0.0.1:54321', 'Only this local Supabase is allowed')
const automation = process.argv.includes('--automation')
const suffix = automation ? '-auto' : ''
const manifest = `supabase/.temp/notifications${suffix}-review.json`
if (existsSync(manifest)) {
  const saved = JSON.parse(readFileSync(manifest, 'utf8'))
  if (sql(`select count(*) from app.transport_requests where id=${literal(saved.pending.request)}`) === '1') {
    console.log(JSON.stringify(saved, null, 2)); process.exit(0)
  }
}
const identities = [
  [automation ? '37060000611' : '37060000601', `notifications${suffix}-customer@example.test`],
  [automation ? '37060000612' : '37060000602', `notifications${suffix}-carrier@example.test`],
  [automation ? '37060000613' : '37060000603', `notifications${suffix}-other@example.test`],
  [automation ? '37060000614' : '37060000604', `notifications${suffix}-empty@example.test`],
]
const actors = []
for (const [phone, email] of identities) {
  let id = sql(`select id from auth.users where phone=${literal(phone)}`)
  if (!id) {
    const response = await fetch(`${local.API_URL}/auth/v1/admin/users`, { method: 'POST', headers: { apikey: local.SERVICE_ROLE_KEY, Authorization: `Bearer ${local.SERVICE_ROLE_KEY}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ phone, email, phone_confirm: true, email_confirm: true }) })
    assert.ok(response.ok, `Managed local Auth create failed: ${response.status}`)
    id = (await response.json()).id
  }
  // Managed Auth creates the live session. Privileged key stays in this process.
  const link = await fetch(`${local.API_URL}/auth/v1/admin/generate_link`, { method: 'POST', headers: { apikey: local.SERVICE_ROLE_KEY, Authorization: `Bearer ${local.SERVICE_ROLE_KEY}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'magiclink', email }) })
  assert.ok(link.ok)
  const generated = await link.json()
  const verified = await fetch(`${local.API_URL}/auth/v1/verify`, { method: 'POST', headers: { apikey: local.ANON_KEY, 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'magiclink', token_hash: generated.hashed_token }) })
  assert.ok(verified.ok)
  const auth = await verified.json()
  const jwt = JSON.parse(Buffer.from(auth.access_token.split('.')[1], 'base64url').toString())
  assert.equal(jwt.sub, id)
  actors.push({ id, session: jwt.session_id, email, phone })
}
assert.equal(sql(`select count(*) from app.carrier_memberships where user_id=${literal(actors[1].id)}`), '0', 'Existing review Carrier: preserve its state; recover the saved manifest instead of duplicating it')
const f = seedMarketplace(actors)
for (const actor of actors) sql(acting(actor, `select api.update_my_profile('Notification review',${literal(actor.email)},'lt')`))
const result = { customerPhone: '+' + actors[0].phone, carrierPhone: '+' + actors[1].phone, customer: actors[0].id, carrierUser: actors[1].id }
for (const [index,key] of ['pending','completed','cancelled'].entries()) {
 const route = index===0 ? f.carriers[0].route : sql(acting(actors[1], `select api.save_route(${literal(JSON.stringify({stops:['hamburg-de','berlin-de','kaunas-lt'],date_from:day(30),date_to:day(35),capacity_total:2,supported_categories:['car'],supports_non_running:true,route_flexible:false,accepting_new_requests:true}))}::jsonb,true,null,null,${literal(randomUUID())})`))
 const request=f.publish()
 const submit = version => sql(acting(actors[1], `select api.submit_offer(${literal(request)},${literal(route)},${literal(JSON.stringify({...terms(),total_price:version ? 950 : 1000}))}::jsonb,1,1,${version ?? 'null'})`))
 const offer=submit(); submit(1)
 const conversation=sql(`select id from app.conversations where current_offer_id=${literal(offer)}`)
 for (const actor of [actors[1],actors[0]]) sql(acting(actor, `select api.send_message(${literal(conversation)},'Notifications review message',${literal(randomUUID())})`))
 const record={request,route,offer,conversation}
 if(key!=='pending') {
  record.booking=JSON.parse(sql(acting(actors[0], `select api.accept_offer(${literal(offer)},2,1,1)`))).booking_id
  if(key==='cancelled') sql(acting(actors[1],`select api.cancel_booking(${literal(record.booking)},1,'Local review cancellation')`))
  else {
   const pickups=sql(`select jsonb_agg(jsonb_build_object('vehicle_id',v->>'id','street','Review street 1','contact_name','Review contact','contact_phone','+37060000601','scheduled_from','2030-01-01T10:00:00Z','scheduled_to','2030-01-01T12:00:00Z')) from app.bookings,jsonb_array_elements(agreement_snapshot->'vehicles') v where id=${literal(record.booking)}`)
   for(const [i,status] of ['pickup_scheduled','collected','in_transit','delivered','completed'].entries()) sql(acting(status==='completed'?actors[0]:actors[1],`select api.transition_booking(${literal(record.booking)},${i+1},${literal(status)},${i===0 ? literal(pickups)+'::jsonb' : 'null'})`))
  }
 }
 result[key]=record
}
writeFileSync(manifest,JSON.stringify(result,null,2)+'\n')
console.log(JSON.stringify(result,null,2))
