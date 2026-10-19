import assert from 'node:assert/strict'
import { seedMarketplace, sql, sqlAsync, literal, acting } from './marketplace-local.mjs'
const f=seedMarketplace(), request=f.publish(), offer=f.offer(request)
const id=sql(`select id from app.notifications where recipient_id=${literal(f.actors[0].id)} and offer_id=${literal(offer)}`)
const results=await Promise.all([
 sqlAsync(acting(f.actors[0],`select api.mark_notifications_read(${literal(id)})`)),
 sqlAsync(acting(f.actors[0],`select api.mark_notifications_read()`)),
 sqlAsync(acting(f.actors[0],`select api.mark_notifications_read(${literal(id)})`)),
])
assert.ok(results.every(r=>r.code===0),JSON.stringify(results))
const stamp=sql(`select read_at from app.notifications where id=${literal(id)}`)
assert.ok(stamp)
sql(acting(f.actors[0],`select api.mark_notifications_read()`))
assert.equal(sql(`select read_at from app.notifications where id=${literal(id)}`),stamp)
assert.equal(sql(`select count(*) from app.notifications where source_event_id in (select id from app.domain_events where offer_id=${literal(offer)})`),'1')
console.log('PASS: concurrent mark-one/all/retry serializes and preserves first read timestamp')
