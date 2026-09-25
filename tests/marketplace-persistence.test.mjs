import { test } from "node:test"
import assert from "node:assert/strict"
import { registerHooks } from "node:module"
import { pathToFileURL } from "node:url"
import path from "node:path"
registerHooks({ resolve(specifier, context, nextResolve) {
  if (specifier.startsWith("@/")) return nextResolve(pathToFileURL(path.resolve(import.meta.dirname,"../src",`${specifier.slice(2)}.ts`)).href,context)
  try { return nextResolve(specifier,context) } catch(error) {
    if(specifier.startsWith(".") && !path.extname(specifier)) return nextResolve(`${specifier}.ts`,context)
    throw error
  }
} })
const {bookingProjection,pickupWindow,safeCarrier} = await import('../src/features/public/marketplace-persistence/adapter.ts')
const {orderedMessages} = await import('../src/features/public/messages/logic.ts')
const place=(id,city)=>({id,slug:id,city,country_name:'Lithuania',country_code:'LT',latitude:54,longitude:25})
const snapshot={customer:{id:'customer',display_name:'Customer'},carrier:{id:'carrier',display_name:'Accepted identity'},request:{id:'request',version:1,pickup:{kind:'flexible',from:'2030-01-01',to:'2030-01-08',anchor_date:'2030-01-01'}},vehicles:[{id:'vehicle',category:'car',make:'Toyota',model:'Corolla',year:2020,condition:'running',rolling_ability:null,pickup_location:place('a','A'),delivery_location:place('b','B')}]}
const row={id:'booking',request_id:'request',accepted_offer_id:'offer',accepted_offer_version:2,carrier_id:'carrier',conversation_id:'thread',vehicle_count:1,agreed_total_price:550,currency:'EUR',payment_terms:'On delivery',planned_pickup_date:'2030-01-03',planned_delivery_date:'2030-01-05',snapshot_schema_version:1,agreement_snapshot:snapshot,status:'booked',created_at:'2030-01-01T00:00:00Z'}
test('Booking projection consumes accepted snapshot and preserves vehicle identity and anchored dates',()=>{
 const booking=bookingProjection(row)
 assert.equal(booking.carrier.name,'Accepted identity');assert.equal(booking.acceptedOfferVersion,2);assert.equal(booking.vehicles[0].id,'vehicle')
 assert.equal(booking.vehicles[0].pickupLocation.city,'A');assert.equal(booking.agreedTotalPrice,550)
 assert.equal(booking.requestedPickupWindow.type,'range');assert.equal(booking.requestedPickupWindow.from.getFullYear(),2030)
 assert.equal(booking.carrier.verification,'not_submitted');assert.equal(booking.carrier.rating,null)
 assert.ok(!JSON.stringify(booking).includes('customer'))
 assert.throws(()=>bookingProjection({...row,snapshot_schema_version:2}))
})
test('real messages use committed sequence when timestamps tie or transactions start out of order',()=>{
 const sorted=orderedMessages([{id:'z',sequence:1,createdAt:'2030-01-02'},{id:'a',sequence:2,createdAt:'2030-01-01'}])
 assert.deepEqual(sorted.map(m=>m.id),['z','a'])
})
test('beta admission or identity approval never fabricates generic Carrier reputation',()=>{
 assert.deepEqual(safeCarrier('id','Carrier'),{id:'id',name:'Carrier',verification:'not_submitted',rating:null,reviewCount:0,completedTransports:0})
 assert.deepEqual(pickupWindow('anytime',null,null),{type:'anytime'})
 assert.throws(()=>pickupWindow('range','invalid','invalid'))
})
