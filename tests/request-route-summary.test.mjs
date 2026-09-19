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

const { requestRouteSummary } = await import("../src/features/public/request-route-summary.ts")
const { mockLocations } = await import("../src/lib/mock/locations.ts")
const byId = id => mockLocations.find(location => location.id === id)
const vehicle = (pickup, delivery) => ({ pickupLocation: byId(pickup), deliveryLocation: byId(delivery) })

test("Warsaw review scenarios preserve all four canonical multi-location summary rules", () => {
  const bmw = vehicle("hamburg-de", "warsaw-pl")
  for (const [audi, expected] of [
    [vehicle("hamburg-de", "warsaw-pl"), "Hamburg → Warsaw"],
    [vehicle("berlin-de", "warsaw-pl"), "2 paėmimo vietos → Warsaw"],
    [vehicle("hamburg-de", "kaunas-lt"), "Hamburg → 2 pristatymo vietos"],
    [vehicle("berlin-de", "kaunas-lt"), "Kelių vietų pervežimas"],
  ]) assert.equal(requestRouteSummary([bmw, audi]).compact, expected)
})

test("route summary handles a shared route", () => {
  assert.deepEqual(requestRouteSummary([vehicle("hamburg-de", "kaunas-lt"), vehicle("hamburg-de", "kaunas-lt")]), {
    compact: "Hamburg → Kaunas", detailed: "Hamburg → Kaunas", locationCount: 2,
  })
})

test("route summary handles two pickups with one delivery", () => {
  assert.deepEqual(requestRouteSummary([vehicle("hamburg-de", "kaunas-lt"), vehicle("berlin-de", "kaunas-lt")]), {
    compact: "2 paėmimo vietos → Kaunas", detailed: "Hamburg, Berlin → Kaunas", locationCount: 3,
  })
})

test("route summary handles one pickup with two deliveries", () => {
  assert.deepEqual(requestRouteSummary([vehicle("hamburg-de", "kaunas-lt"), vehicle("hamburg-de", "vilnius-lt")]), {
    compact: "Hamburg → 2 pristatymo vietos", detailed: "Hamburg → Kaunas, Vilnius", locationCount: 3,
  })
})

test("route summary handles fully mixed vehicle routes", () => {
  assert.deepEqual(requestRouteSummary([vehicle("hamburg-de", "kaunas-lt"), vehicle("berlin-de", "vilnius-lt")]), {
    compact: "Kelių vietų pervežimas", detailed: "Kelių vietų pervežimas", locationCount: 4,
  })
})
