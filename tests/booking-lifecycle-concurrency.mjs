import assert from 'node:assert/strict'
import { seedMarketplace, sql, sqlAsync, literal, claims, acting } from './marketplace-local.mjs'

function booked() {
  const f = seedMarketplace(), request = f.publish(), offer = f.offer(request)
  const result = JSON.parse(sql(acting(f.actors[0], `select api.accept_offer(${literal(offer)},1,1,1)`)))
  return { ...f, booking: result.booking_id }
}
const cancel = (f, actor, version = 1) => `begin; ${claims(actor)} select api.cancel_booking(${literal(f.booking)},${version},'Concurrent review cancellation'); select pg_sleep(0.2); commit;`
function pickups(f) {
  return sql(`select jsonb_agg(jsonb_build_object('vehicle_id',v->>'id','street','Test street','contact_name','Test person','contact_phone','+37060000000','scheduled_from','2030-01-01T10:00:00Z','scheduled_to','2030-01-01T11:00:00Z')) from app.bookings, jsonb_array_elements(agreement_snapshot->'vehicles') v where id=${literal(f.booking)}`)
}
const capacity = f => Number(sql(`select capacity_reserved from app.carrier_routes where id=${literal(f.carriers[0].route)}`))

const first = booked()
const duplicate = await Promise.all([sqlAsync(cancel(first, first.actors[0])), sqlAsync(cancel(first, first.actors[0]))])
assert.ok(duplicate.every(r => r.code === 0), JSON.stringify(duplicate))
assert.equal(duplicate.filter(r => r.out.includes('"replayed": true')).length, 1)
assert.equal(capacity(first), 0)
assert.equal(sql(`select count(*) from app.domain_events where booking_id=${literal(first.booking)} and event_type='booking.cancelled'`), '1')
console.log('PASS: concurrent same-actor cancellation retries release capacity and emit event once')

const second = booked()
const competing = await Promise.all([sqlAsync(cancel(second, second.actors[0])), sqlAsync(cancel(second, second.actors[1]))])
assert.equal(competing.filter(r => r.code === 0).length, 1, JSON.stringify(competing))
assert.equal(capacity(second), 0)
console.log('PASS: competing Customer/Carrier cancellation has exactly one winner')

const third = booked()
const scheduled = `select api.transition_booking(${literal(third.booking)},1,'pickup_scheduled',${literal(pickups(third))}::jsonb)`
const schedules = await Promise.all([sqlAsync(acting(third.actors[1], scheduled)), sqlAsync(acting(third.actors[1], scheduled))])
assert.ok(schedules.every(r => r.code === 0), JSON.stringify(schedules))
assert.equal(schedules.filter(r => r.out.includes('"replayed": true')).length, 1)
assert.equal(capacity(third), 2)
console.log('PASS: concurrent scheduling creates one transition and does not change capacity')
const race = await Promise.all([
  sqlAsync(`begin; ${claims(third.actors[1])} select api.transition_booking(${literal(third.booking)},2,'collected'); select pg_sleep(0.2); commit;`),
  sqlAsync(cancel(third, third.actors[0], 2)),
])
assert.equal(race.filter(r => r.code === 0).length, 1, JSON.stringify(race))
const status = sql(`select status from app.bookings where id=${literal(third.booking)}`)
assert.ok(['collected', 'cancelled'].includes(status))
assert.equal(capacity(third), status === 'cancelled' ? 0 : 2)
assert.equal(sql(`select count(*) from app.booking_actions where booking_id=${literal(third.booking)} and from_version=2`), '1')
console.log('PASS: collection/cancellation race serializes with exact capacity and one receipt')
