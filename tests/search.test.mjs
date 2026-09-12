import { test } from "node:test"
import assert from "node:assert/strict"
import { registerHooks } from "node:module"
import { pathToFileURL } from "node:url"
import path from "node:path"

// Node 24's TypeScript stripping plus resolution of the application's existing aliases.
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith("@/")) {
      return nextResolve(pathToFileURL(path.resolve(import.meta.dirname, "../src", `${specifier.slice(2)}.ts`)).href, context)
    }
    try { return nextResolve(specifier, context) }
    catch (error) {
      if (specifier.startsWith(".") && !path.extname(specifier)) return nextResolve(`${specifier}.ts`, context)
      throw error
    }
  },
})

const { readSearch, readDate, writeDate, parseCalendarDate, calendarDate, requestHref } = await import("../src/features/public/search-query.ts")
const { matchRoutes } = await import("../src/features/public/search-matching.ts")
const { mockCarrierRoutes } = await import("../src/lib/mock/carrier-routes.ts")
const query = (extra = "") => new URLSearchParams(`from=hamburg-de&to=kaunas-lt${extra}`)
const match = (params, routes = mockCarrierRoutes) => matchRoutes(routes, params, "2026-09-12")

test("P01 and P02 flexible date keys resolve identically", () => {
  assert.deepEqual(readDate(query("&dateType=flexible&dateOption=next-week")), readDate(query("&dateType=flexible&dateFlexible=next-week")))
  assert.equal(readDate(query("&dateType=flexible&dateFlexible=unknown")).invalid, true)
})

test("invalid locations, identical locations and malformed dates do not produce results", () => {
  for (const params of [new URLSearchParams(), new URLSearchParams("from=unknown&to=kaunas-lt"), new URLSearchParams("from=kaunas-lt&to=kaunas-lt"), query("&dateType=single&date=2026-02-30"), query("&dateType=range&dateFrom=2026-09-17&dateTo=2026-09-15")]) {
    assert.equal(readSearch(params).invalid, true)
    assert.deepEqual(match(params), { exact: [], alternatives: [] })
  }
})

test("calendar serialization preserves local days and removes stale date parameters", () => {
  const params = query("&dateType=flexible&dateOption=this-month&dateFlexible=next-week")
  writeDate(params, { type: "range", from: new Date(2026, 8, 15), to: new Date(2026, 8, 17) })
  assert.equal(params.get("dateFrom"), "2026-09-15")
  assert.equal(params.get("dateTo"), "2026-09-17")
  assert.equal(params.has("dateOption"), false)
  assert.equal(params.has("dateFlexible"), false)
  assert.equal(calendarDate(parseCalendarDate("2028-02-29")), "2028-02-29")
  assert.equal(parseCalendarDate("2026-02-29"), undefined)
})

test("request fallback preserves search values and excludes filters", () => {
  const params = query("&dateType=flexible&dateOption=next-week&verified=true&sort=rating")
  assert.equal(requestHref(params), "/request/new?from=hamburg-de&to=kaunas-lt&dateType=flexible&dateOption=next-week")
})

test("ordered stop matches and alternatives stay separate; reversed journeys never match", () => {
  const results = match(query())
  assert.equal(results.exact.length, 4)
  assert.equal(results.alternatives.length, 1)
  assert.equal(results.exact.find((item) => item.route.id === "siaures-autovezis-0916").level, "good")
  assert.equal(results.alternatives[0].level, "possible")
  assert.deepEqual(match(new URLSearchParams("from=kaunas-lt&to=hamburg-de")), { exact: [], alternatives: [] })
})

test("date overlap is inclusive and an empty date window stays empty", () => {
  const result = match(query("&dateType=single&date=2026-09-17"))
  assert.equal(result.exact.length, 3)
  assert.deepEqual(match(query("&dateType=single&date=2026-10-15")), { exact: [], alternatives: [] })
  assert.equal(match(query("&dateType=flexible&dateFlexible=next-week")).alternatives.length, 0)
})

test("verification, rating, category and non-running filters combine", () => {
  const result = match(query("&verified=true&rating=4.5&vehicle=suv&nonRunning=true"))
  assert.deepEqual(result.exact.map((item) => item.route.id), ["baltijos-kelias-0915"])
  assert.equal(result.alternatives.length, 0)
})

test("unavailable routes are excluded and rating sort puts new carriers last", () => {
  const first = mockCarrierRoutes[0]
  assert.equal(match(query(), [{ ...first, capacityTotal: 5, parvezkReserved: 5 }]).exact.length, 0)
  assert.equal(match(query(), [{ ...first, acceptingNewRequests: false }]).exact.length, 0)
  assert.equal(match(query(), [{ ...first, dateFrom: "2026-09-01", dateTo: "2026-09-02" }]).exact.length, 0)
  const sorted = match(query("&sort=rating")).exact
  assert.equal(sorted[0].route.carrier.rating, 4.9)
  assert.equal(sorted.at(-1).route.carrier.rating, null)
  const dates = match(query("&sort=date")).exact.map((item) => item.route.dateFrom)
  assert.deepEqual(dates, [...dates].sort())
})
