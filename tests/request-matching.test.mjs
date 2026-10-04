import { test } from "node:test"
import assert from "node:assert/strict"
import { registerHooks } from "node:module"
import { pathToFileURL } from "node:url"
import path from "node:path"

registerHooks({ resolve(specifier, context, nextResolve) {
  if (specifier.startsWith("@/")) return nextResolve(pathToFileURL(path.resolve(import.meta.dirname, "../src", `${specifier.slice(2)}.ts`)).href, context)
  try { return nextResolve(specifier, context) } catch (error) {
    if (specifier.startsWith(".") && !path.extname(specifier)) return nextResolve(`${specifier}.ts`, context)
    throw error
  }
} })

const { routeCanServeCompleteRequest } = await import("../src/features/public/request-matching.ts")
const { eligibleOfferRoutes, offerDatesFitRoute } = await import("../src/features/carrier/offers/eligibility.ts")
const { createRequestDraft } = await import("../src/features/public/create-request/logic.ts")
const { mockCarrierRoutes } = await import("../src/lib/mock/carrier-routes.ts")
const draft = review => createRequestDraft(new URLSearchParams(`from=hamburg-de&to=kaunas-lt&dateType=range&dateFrom=2026-09-15&dateTo=2026-09-17&review=${review}`))

test("complete-request matching evaluates every vehicle route and never returns a partial match", () => {
  const route = { ...mockCarrierRoutes.find(item => item.id === "siaures-autovezis-0916"), supportsNonRunning: true }
  const pickups = draft("multi-location-pickups")
  assert.equal(routeCanServeCompleteRequest(route, pickups.vehicles), true)
  const mixed = draft("multi-location-mixed")
  assert.equal(routeCanServeCompleteRequest(route, mixed.vehicles), true)
  const incompatible = { ...mixed.vehicles[1], pickupLocation: mixed.vehicles[1].deliveryLocation, deliveryLocation: mixed.vehicles[1].pickupLocation }
  assert.equal(routeCanServeCompleteRequest(route, [mixed.vehicles[0], incompatible]), false)
})

test("capacity still uses the full vehicle count for multi-location requests", () => {
  const route = { ...mockCarrierRoutes.find(item => item.id === "siaures-autovezis-0916"), supportsNonRunning: true }
  const request = draft("multi-location-pickups")
  assert.equal(routeCanServeCompleteRequest({ ...route, capacityTotal: 3, capacityReserved: 2 }, request.vehicles), false)
  assert.equal(routeCanServeCompleteRequest({ ...route, capacityTotal: 4, capacityReserved: 2 }, request.vehicles), true)
})

const location = id => ({ id, city:id, country:"Test", countryCode:"DE", label:id })
const hamburg=location("hamburg-de"), berlin=location("berlin-de"), kaunas=location("kaunas-lt")
const completeVehicles = [
  {category:"car",condition:"running",pickupLocation:hamburg,deliveryLocation:kaunas},
  {category:"car",condition:"non-running",pickupLocation:berlin,deliveryLocation:kaunas},
]
const offerRoute = {id:"compatible",status:"published",origin:hamburg,stops:[berlin],destination:kaunas,
  dateFrom:"2026-09-30",dateTo:"2026-10-07",capacityTotal:2,capacityReserved:0,
  acceptingNewRequests:true,vehicleCategories:["car"],supportsNonRunning:true,routeFlexible:true}

test("Offer selection excludes Amsterdam/Hamburg partial match even with route flexibility", () => {
  const partial={...offerRoute,id:"partial",origin:location("amsterdam-nl"),stops:[hamburg]}
  assert.deepEqual(eligibleOfferRoutes([partial,offerRoute],completeVehicles,"2026-09-29").map(r=>r.id),["compatible"])
  assert.deepEqual(eligibleOfferRoutes([partial],completeVehicles,"2026-09-29"),[])
})

test("Offer selection checks every stop order, category, condition, full capacity and availability", () => {
  for(const change of [
    {origin:kaunas,destination:hamburg}, {vehicleCategories:["suv"]}, {supportsNonRunning:false},
    {capacityReserved:1}, {status:"draft"}, {status:"cancelled"}, {acceptingNewRequests:false}, {dateTo:"2026-09-28"},
  ]) assert.deepEqual(eligibleOfferRoutes([{...offerRoute,...change}],completeVehicles,"2026-09-29"),[],JSON.stringify(change))
  assert.deepEqual(eligibleOfferRoutes([offerRoute],[],"2026-09-29"),[])
  assert.deepEqual(eligibleOfferRoutes([offerRoute],completeVehicles,"2026-09-29","other-route"),[])
  assert.equal(eligibleOfferRoutes([offerRoute],completeVehicles,"2026-09-29","compatible").length,1)
})

test("Offer dates stay inside the selected Route and delivery follows pickup", () => {
  assert.equal(offerDatesFitRoute(offerRoute,"2026-09-30","2026-10-02"),true)
  assert.equal(offerDatesFitRoute(offerRoute,"2026-09-30","2026-10-07"),true)
  assert.equal(offerDatesFitRoute(offerRoute,"2026-09-29","2026-10-02"),false)
  assert.equal(offerDatesFitRoute(offerRoute,"2026-09-30","2026-10-08"),false)
  assert.equal(offerDatesFitRoute(offerRoute,"2026-10-02","2026-09-30"),false)
})
