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

const { dashboardTabForStatus, deriveDashboard } = await import("../src/features/public/dashboard/logic.ts")
const { dashboardFixture, dashboardFixtureName } = await import("../src/lib/mock/dashboard.ts")
const { findMockRequestDetail, requestReviewNow } = await import("../src/lib/mock/request-details.ts")

test("request lifecycle maps to exactly the locked dashboard tab", () => {
  assert.equal(dashboardTabForStatus("active"), "requests")
  assert.equal(dashboardTabForStatus("booked"), "transports")
  assert.equal(dashboardTabForStatus("completed"), "history")
  assert.equal(dashboardTabForStatus("closed"), "history")
  assert.equal(dashboardTabForStatus("draft"), undefined)
})

test("needs attention comes only from Active requests with actionable Pending offers", () => {
  const active = findMockRequestDetail("marketplace-demo-001")
  const targeted = findMockRequestDetail("targeted-demo-001")
  const changed = findMockRequestDetail("request-changed-demo-001")
  const booked = findMockRequestDetail("booked-demo-001")
  const dashboard = deriveDashboard([active, targeted, changed, booked], requestReviewNow)
  assert.deepEqual(dashboard.attention.map(item => item.id), [active.id])
  assert.equal(dashboard.attention[0].actionableOfferCount, 2)
  assert.equal(dashboard.attention[0].updated, false)
})

test("updated actionable offers have attention priority while stable request order is retained", () => {
  const normal = findMockRequestDetail("marketplace-demo-001")
  const updated = findMockRequestDetail("updated-offer-demo-001")
  const dashboard = deriveDashboard([normal, updated], requestReviewNow)
  assert.deepEqual(dashboard.attention.map(item => item.id), [updated.id, normal.id])
  assert.deepEqual(dashboard.attention.map(item => item.updated), [true, false])
  assert.deepEqual(dashboard.requests.map(item => item.id), [normal.id, updated.id])
})

test("dashboard fixtures are visually distinct while attention repeats its request intentionally", () => {
  const fixture = dashboardFixture("mixed")
  const dashboard = deriveDashboard(fixture.requests, requestReviewNow)
  assert.deepEqual(dashboard.requests.map(item => [item.route, item.vehicle]), [
    ["2 paėmimo vietos → Kaunas", "2 automobiliai · BMW X5, Audi Q5"],
    ["Berlin → Vilnius", "Audi Q5 · SUV / Crossover"],
    ["Warsaw → Kaunas", "Volkswagen Passat · Lengvasis automobilis"],
  ])
  assert.equal(dashboard.attention[0].id, dashboard.requests[0].id)
  assert.equal(dashboard.attention[1].id, dashboard.requests[1].id)
})

test("an object cannot be duplicated across lifecycle tabs", () => {
  const fixture = dashboardFixture("mixed")
  const dashboard = deriveDashboard(fixture.requests, requestReviewNow)
  const ids = [...dashboard.requests, ...dashboard.transports, ...dashboard.history].map(item => item.id)
  assert.equal(ids.length, new Set(ids).size)
  assert.equal(dashboard.requests.every(item => !dashboard.transports.some(other => other.id === item.id)), true)
})

test("empty fixture produces the whole-dashboard empty state", () => {
  const fixture = dashboardFixture("empty")
  const dashboard = deriveDashboard(fixture.requests, requestReviewNow)
  assert.equal(dashboard.empty, true)
  assert.deepEqual([dashboard.attention, dashboard.requests, dashboard.transports, dashboard.history], [[], [], [], []])
})

test("Booked requests derive only the selected carrier and booking destination in Transports", () => {
  const fixture = dashboardFixture("transport")
  const dashboard = deriveDashboard(fixture.requests, requestReviewNow, fixture.defaultTab)
  assert.equal(dashboard.requests.length, 0)
  assert.equal(dashboard.history.length, 0)
  assert.deepEqual(dashboard.transports.map(item => ({ id: item.id, carrier: item.carrier, bookingId: item.bookingId })), [
    { id: "booked-demo-001", carrier: "Šiaurės autovežis", bookingId: "transport-demo-001" },
  ])
})

test("Completed and Closed requests appear only in History with read-only context", () => {
  const fixture = dashboardFixture("history")
  const dashboard = deriveDashboard(fixture.requests, requestReviewNow, fixture.defaultTab)
  assert.equal(dashboard.requests.length, 0)
  assert.equal(dashboard.transports.length, 0)
  assert.deepEqual(dashboard.history.map(item => [item.id, item.status, item.carrier]), [
    ["completed-demo-001", "Pervežimas užbaigtas", "Nemuno logistika"],
    ["closed-demo-001", "Užklausa uždaryta", undefined],
  ])
})

test("review selector is explicit and unknown values fall back to mixed", () => {
  for (const name of ["mixed", "requests", "transport", "history", "empty"]) assert.equal(dashboardFixtureName(name), name)
  assert.equal(dashboardFixtureName("unknown"), "mixed")
  assert.equal(dashboardFixtureName("__proto__"), "mixed")
  assert.equal(dashboardFixtureName(["history", "empty"]), "history")
  assert.equal(dashboardFixtureName(undefined), "mixed")
})
