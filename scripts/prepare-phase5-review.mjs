// Explicit local-only review bootstrap. Uses the existing local foundation
// bootstrap and real marketplace commands; never imported by product code.
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { seedMarketplace, sql, acting, literal, day, terms } from '../tests/marketplace-local.mjs'

const local = JSON.parse(execFileSync(process.execPath, ['node_modules/supabase/dist/supabase.js', 'status', '--output', 'json'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }))
assert.equal(local.API_URL, 'http://127.0.0.1:54321', 'Only this local Supabase is allowed')
const manifest = 'supabase/.temp/phase5-review.json'
if (existsSync(manifest)) {
  const saved = JSON.parse(readFileSync(manifest, 'utf8'))
  if (sql(`select count(*) from app.bookings where id=${literal(saved.lifecycle.booking)}`) === '1') {
    console.log(JSON.stringify(saved, null, 2)); process.exit(0)
  }
}
const identities = [
  ['37062557545', 'phase5-windows-customer@example.test'],
  ['37065603638', 'phase5-windows-carrier@example.test'],
  ['37060000503', 'phase5-other-carrier@example.test'],
  ['37060000504', 'phase5-local-reviewer@example.test'],
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
// Safe trusted bootstrap metadata, explicitly audited; eligibility is unchanged.
sql(`begin; update app.carriers set display_name='Phase 5 Windows Carrier' where id=${literal(f.carriers[0].id)}; insert into app.audit_log(actor_id,action,entity_type,entity_id,correlation_id,reason,change_summary) values(${literal(actors[3].id)},'carrier.updated','carrier',${literal(f.carriers[0].id)},gen_random_uuid(),'Local Phase 5 review display name','{"fields":["display_name"]}'); commit;`)
const result = { customerPhone: '+37062557545', carrierPhone: '+37065603638', carrier: f.carriers[0].id }
for (const [index, key] of ['lifecycle', 'cancellation', 'automationLifecycle', 'automationCancellation'].entries()) {
  const route = index === 0 ? f.carriers[0].route : sql(acting(actors[1], `select api.save_route(${literal(JSON.stringify({ stops: ['hamburg-de', 'berlin-de', 'kaunas-lt'], date_from: day(30), date_to: day(35), capacity_total: 2, supported_categories: ['car'], supports_non_running: true, route_flexible: false, accepting_new_requests: true }))}::jsonb,true,null,null,${literal(randomUUID())})`))
  const request = f.publish()
  const offer = sql(acting(actors[1], `select api.submit_offer(${literal(request)},${literal(route)},${literal(JSON.stringify({ ...terms(), total_price: 1000 }))}::jsonb,1,1)`))
  const accepted = JSON.parse(sql(acting(actors[0], `select api.accept_offer(${literal(offer)},1,1,1)`)))
  result[key] = { request, route, offer, booking: accepted.booking_id, conversation: sql(`select conversation_id from app.bookings where id=${literal(accepted.booking_id)}`) }
}
writeFileSync(manifest, JSON.stringify(result, null, 2) + '\n')
console.log(JSON.stringify(result, null, 2))
