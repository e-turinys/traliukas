import { test } from "node:test"
import assert from "node:assert/strict"
import { registerHooks } from "node:module"
import { pathToFileURL } from "node:url"
import path from "node:path"

// Same lightweight Node 24 resolution used by the existing P02 tests.
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith("@/")) return nextResolve(pathToFileURL(path.resolve(import.meta.dirname, "../src", `${specifier.slice(2)}.ts`)).href, context)
    try { return nextResolve(specifier, context) }
    catch (error) {
      if (specifier.startsWith(".") && !path.extname(specifier)) return nextResolve(`${specifier}.ts`, context)
      throw error
    }
  },
})

const { findMockCarrierProfile, mockCarrierProfiles } = await import("../src/lib/mock/carrier-profiles.ts")
const { mockCarrierRoutes } = await import("../src/lib/mock/carrier-routes.ts")
const { activeCarrierRoutes, completedCarrierReviews } = await import("../src/features/public/carrier-profile-context.ts")

test("profiles resolve stable carrier IDs and preserve existing route reputation", () => {
  assert.equal(new Set(mockCarrierProfiles.map(c => c.id)).size, mockCarrierProfiles.length)
  for (const { carrier } of mockCarrierRoutes) {
    const profile = findMockCarrierProfile(carrier.id)
    for (const key of Object.keys(carrier)) assert.deepEqual(profile[key], carrier[key])
  }
  assert.equal(findMockCarrierProfile("unknown"), undefined)
  assert.equal(findMockCarrierProfile("baltijos-kelias-0915"), undefined)
  assert.equal(findMockCarrierProfile("manto-transportas").rating, null)
})

test("active routes exclude full, expired, closed and other-carrier routes without mutation", () => {
  const route = mockCarrierRoutes[0]
  const routes = [
    { ...route, id: "later", dateFrom: "2026-09-16" }, route,
    { ...route, id: "expired", dateTo: "2026-09-12" },
    { ...route, id: "closed", acceptingNewRequests: false },
    { ...route, id: "full", parvezkReserved: route.capacityTotal },
    mockCarrierRoutes[2],
  ]
  const before = structuredClone(routes)
  assert.deepEqual(activeCarrierRoutes(routes, route.carrier.id, "2026-09-13").map(r => r.id), [route.id, "later"])
  assert.equal(activeCarrierRoutes([route], route.carrier.id, route.dateTo).length, 1)
  assert.deepEqual(activeCarrierRoutes([route], route.carrier.id, "2026-09-18"), [])
  assert.deepEqual(routes, before)
})

test("route-free carrier exists without adding supply and new carriers have no reviews", () => {
  assert.ok(findMockCarrierProfile("aukstaitijos-transportas"))
  assert.deepEqual(activeCarrierRoutes(mockCarrierRoutes, "aukstaitijos-transportas", "2026-09-13"), [])
  assert.deepEqual(completedCarrierReviews("manto-transportas"), [])
  assert.equal(activeCarrierRoutes(mockCarrierRoutes, "baltijos-kelias", "2026-09-13").length, 1)
})

test("reviews include only this carrier's completed bookings, newest first", () => {
  const review = completedCarrierReviews("baltijos-kelias")[0]
  const reviews = [
    { ...review, id: "old", completedOn: "2026-01-01" },
    { ...review, id: "delivered", bookingStatus: "delivered" },
    { ...review, id: "other", carrierId: "manto-transportas" }, review,
  ]
  assert.deepEqual(completedCarrierReviews("baltijos-kelias", reviews).map(r => r.id), [review.id, "old"])
  assert.equal(reviews[0].id, "old")
})
