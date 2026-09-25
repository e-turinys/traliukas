import assert from 'node:assert/strict'
import { seedMarketplace, sql, sqlAsync, literal, claims } from './marketplace-local.mjs'
const f=seedMarketplace()
const accept = (actor,offer) => `begin; ${claims(actor)} select api.accept_offer(${literal(offer)},1,1,1); select pg_sleep(0.3); commit;`
const request=f.publish(),first=f.offer(request),second=f.offer(request,1)
const results=await Promise.all([sqlAsync(accept(f.actors[0],first)),sqlAsync(accept(f.actors[0],second))])
assert.equal(results.filter(r=>r.code===0).length,1,'exactly one concurrent Offer wins')
assert.equal(sql(`select count(*) from app.bookings where request_id=${literal(request)}`),'1')
const winner=sql(`select accepted_offer_id from app.bookings where request_id=${literal(request)}`)
const retry=await sqlAsync(accept(f.actors[0],winner));assert.equal(retry.code,0,retry.err);assert.match(retry.out,/"replayed": true/)
assert.equal(sql(`select sum(capacity_reserved) from app.carrier_routes where id in (${f.carriers.map(c=>literal(c.route)).join(',')})`),'2')
console.log('PASS: concurrent same-Request acceptance, competing Offer conflict, idempotent retry')

const g=seedMarketplace()
const r1=g.publish(),r2=g.publish(g.actors[3]),o1=g.offer(r1),o2=g.offer(r2)
const capacity=await Promise.all([sqlAsync(accept(g.actors[0],o1)),sqlAsync(accept(g.actors[3],o2))])
assert.equal(capacity.filter(r=>r.code===0).length,1,'only one complete Request fits the last slots')
assert.equal(sql(`select count(*) from app.bookings where route_id=${literal(g.carriers[0].route)}`),'1')
assert.equal(sql(`select capacity_reserved from app.carrier_routes where id=${literal(g.carriers[0].route)}`),'2')
assert.equal(sql(`select count(*) from app.transport_requests where id in (${literal(r1)},${literal(r2)}) and status='active'`),'1')
console.log('PASS: two Requests competing for capacity, no overbooking or partial reservation')

const h=seedMarketplace(),rr=h.publish(),oo=h.offer(rr)
// Hold the Route while a trusted revocation commits under the earlier Carrier
// lock. Acceptance queues behind it and must see the changed eligibility.
const revoke=sqlAsync(`begin; select id from app.carriers where id=${literal(h.carriers[0].id)} for update; update app.carrier_verifications set status='rejected' where carrier_id=${literal(h.carriers[0].id)}; select pg_sleep(0.6); commit;`)
await new Promise(resolve=>setTimeout(resolve,150))
const blocked=sqlAsync(accept(h.actors[0],oo))
const [revoked,denied]=await Promise.all([revoke,blocked])
assert.equal(revoked.code,0,revoked.err);assert.notEqual(denied.code,0)
assert.equal(sql(`select count(*) from app.bookings where request_id=${literal(rr)}`),'0')
assert.equal(sql(`select capacity_reserved from app.carrier_routes where id=${literal(h.carriers[0].route)}`),'0')
console.log('PASS: verification revocation during lock wait rejects acceptance atomically')
