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
