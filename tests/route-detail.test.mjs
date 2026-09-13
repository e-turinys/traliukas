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

const { findMockCarrierRoute, mockCarrierRoutes } = await import("../src/lib/mock/carrier-routes.ts")
const { routeRequestHref } = await import("../src/features/public/route-detail-context.ts")
const { formatCount } = await import("../src/lib/format-count.ts")
const { formatDateRange } = await import("../src/lib/format-date.ts")

test("route lookup reuses the existing dataset for available, full and new-carrier states", () => {
  const available = findMockCarrierRoute("baltijos-kelias-0915")
  assert.equal(available, mockCarrierRoutes[0])
  const full = findMockCarrierRoute("baltijos-kelias-0920-full")
  assert.equal(full.capacityTotal - full.parvezkReserved, 0)
  assert.equal(full.carrier.id, available.carrier.id)
  assert.equal(findMockCarrierRoute("manto-transportas-0917").carrier.reviewCount, 0)
  assert.equal(findMockCarrierRoute("unknown"), undefined)
})

test("targeted request URL includes stable carrier/route IDs and date-only range", () => {
  const route = findMockCarrierRoute("baltijos-kelias-0915")
  const url = new URL(routeRequestHref(route, true), "https://example.test")
  assert.equal(url.pathname, "/request/new")
  assert.deepEqual(Object.fromEntries(url.searchParams), {
    from: "hamburg-de", to: "kaunas-lt", dateType: "range", dateFrom: "2026-09-15", dateTo: "2026-09-17",
    visibility: "targeted", targetCarrier: "baltijos-kelias", targetRoute: "baltijos-kelias-0915",
  })
})

test("marketplace fallback retains route places/dates and removes targeting", () => {
  const route = findMockCarrierRoute("baltijos-kelias-0920-full")
  const params = new URL(routeRequestHref(route, false), "https://example.test").searchParams
  assert.equal(params.get("visibility"), "marketplace")
  assert.equal(params.has("targetCarrier"), false)
  assert.equal(params.has("targetRoute"), false)
  assert.equal(params.get("from"), route.origin.id)
  assert.equal(params.get("to"), route.destination.id)
  assert.equal(params.get("dateFrom"), route.dateFrom)
  assert.equal(params.get("dateTo"), route.dateTo)
})

test("single-day route URL uses the existing single-date contract", () => {
  const route = findMockCarrierRoute("baltijos-kelias-0915")
  const params = new URL(routeRequestHref({ ...route, dateTo: route.dateFrom }, true), "https://example.test").searchParams
  assert.equal(params.get("dateType"), "single")
  assert.equal(params.get("date"), "2026-09-15")
  assert.equal(params.has("dateFrom"), false)
  assert.equal(params.has("dateTo"), false)
})

test("Lithuanian capacity and date formatting remains human-readable", () => {
  const labels = { one: "laisva vieta", few: "laisvos vietos", other: "laisvų vietų" }
  assert.equal(formatCount(1, labels), "1 laisva vieta")
  assert.equal(formatCount(2, labels), "2 laisvos vietos")
  assert.equal(formatCount(11, labels), "11 laisvų vietų")
  assert.equal(formatDateRange("2026-09-15", "2026-09-17"), "2026 m. rugs. 15–17 d.")
})
