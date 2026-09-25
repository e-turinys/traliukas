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
const {routeProjection,carrierProjection,locationProjection} = await import('../src/features/public/route-persistence/adapter.ts')
const {matchRoutes} = await import('../src/features/public/search-matching.ts')
const {routeCanServeCompleteRequest} = await import('../src/features/public/request-matching.ts')
const {mockLocations} = await import('../src/lib/mock/locations.ts')
const {routeAvailability} = await import('../src/features/public/route-detail-context.ts')
const carrier = carrierProjection({id:'real-carrier',display_name:'Real Carrier',description:'Public description',registration_country:'LT',service_countries:['LT','DE'],legal_name:'PRIVATE',cmr_insurance_available:true,invoice_available:true,live_tracking_available:true})
const places = mockLocations.map((p,i)=>({id:`place-${i}`,slug:p.id,city:p.city,country_name:p.country,country_code:p.countryCode,latitude:p.lat,longitude:p.lng}))
const row = {id:'real-route',carrier_id:carrier.id,status:'published',date_from:'2030-05-10',date_to:'2030-05-15',capacity_total:3,capacity_reserved:1,accepting_new_requests:true,supported_categories:['car','motorcycle'],supports_non_running:true,route_flexible:true,route_version:2,published_at:'2030-05-01T00:00:00Z',created_at:'2030-05-01T00:00:00Z',updated_at:'2030-05-02T00:00:00Z'}
const stops = [{route_id:row.id,position:2,location_id:'place-3'},{route_id:row.id,position:0,location_id:'place-0'},{route_id:row.id,position:1,location_id:'place-1'}]
const route = routeProjection(row,stops,places,carrier)
const params = extra=>new URLSearchParams(`from=hamburg-de&to=kaunas-lt&${extra}`)
test('persisted adapter uses public fields, ordered catalog slugs and protected capacity',()=>{
  assert.equal(route.origin.id,'hamburg-de');assert.equal(route.destination.id,'kaunas-lt');assert.equal(route.stops[0].id,'berlin-de')
  assert.equal(route.capacityTotal,3);assert.equal(route.capacityReserved,1);assert.equal(route.routeFlexible,true);assert.equal(route.version,2)
  assert.ok(!JSON.stringify(route).includes('PRIVATE'))
  assert.equal(carrier.verification,'not_submitted');assert.equal(carrier.rating,null);assert.equal(carrier.reviewCount,0)
  assert.equal(carrier.completedTransports,0)
  assert.equal(locationProjection({...places[0],latitude:null,longitude:null}).lat,undefined)
})
test('real routes preserve capacity for complete requested count, categories, non-running and dates',()=>{
  assert.equal(matchRoutes([route],params('vehicleCount=2&vehicle=motorcycle&nonRunning=true'),'2030-05-01').exact.length,1)
  assert.equal(matchRoutes([route],params('vehicleCount=3'),'2030-05-01').exact.length,0)
  assert.equal(matchRoutes([route],params('vehicle=van'),'2030-05-01').exact.length,0)
  assert.equal(matchRoutes([route],params('dateType=single&date=2030-05-20'),'2030-05-01').exact.length,0)
  assert.equal(matchRoutes([route],params('dateType=single&date=2030-05-12'),'2030-05-01').exact.length,1)
  assert.equal(matchRoutes([route],params('verified=true'),'2030-05-01').exact.length,0)
  assert.equal(routeCanServeCompleteRequest(route,[{category:'car',condition:'running',pickupLocation:mockLocations[0],deliveryLocation:mockLocations[3]},{category:'motorcycle',condition:'non-running',pickupLocation:mockLocations[1],deliveryLocation:mockLocations[3]}]),true)
  assert.equal(routeCanServeCompleteRequest({...route,supportsNonRunning:false},[{category:'car',condition:'running',pickupLocation:mockLocations[0],deliveryLocation:mockLocations[3]},{category:'motorcycle',condition:'non-running',pickupLocation:mockLocations[1],deliveryLocation:mockLocations[3]}]),false)
})
test('flexibility does not broaden ordered matching or permit partial vehicle sets',()=>{
  assert.equal(matchRoutes([route],new URLSearchParams('from=kaunas-lt&to=hamburg-de'),'2030-05-01').exact.length,0)
  const vehicles=[{category:'car',condition:'running',pickupLocation:mockLocations[0],deliveryLocation:mockLocations[3]},{category:'car',condition:'running',pickupLocation:mockLocations[3],deliveryLocation:mockLocations[1]}]
  assert.equal(routeCanServeCompleteRequest(route,vehicles),false)
  assert.deepEqual(matchRoutes([{...route,routeFlexible:false}],params(''),'2030-05-01').exact.map(m=>m.level),matchRoutes([route],params(''),'2030-05-01').exact.map(m=>m.level))
})
test('full/expired/closed supply is unavailable; malformed rows never become fixtures',()=>{
  const full=routeProjection({...row,capacity_reserved:3},stops,places,carrier)
  assert.equal(routeAvailability(full,'2030-05-01').full,true)
  assert.equal(matchRoutes([full],params(''),'2030-05-01').exact.length,0)
  for(const status of ['expired','cancelled']) assert.equal(routeProjection({...row,status},stops,places,carrier).acceptingNewRequests,false)
  assert.throws(()=>routeProjection(row,stops.filter(s=>s.position!==1),places,carrier))
  assert.throws(()=>routeProjection({...row,supported_categories:['truck']},stops,places,carrier))
  assert.throws(()=>routeProjection(row,stops,[],carrier))
})
