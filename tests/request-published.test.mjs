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
const { findMockPublishedRequest: find } = await import("../src/lib/mock/published-requests.ts")
const { publishedRequestSummary: summary, publicationCopy: copy } = await import("../src/features/public/request-published/context.ts")

test("only explicit demo IDs resolve, with independent fixture values", () => {
  for (const id of ["marketplace-demo-001", "targeted-demo-001", "targeted-marketplace-demo-001", "multi-vehicle-demo-001", "multi-location-pickups-demo-001", "multi-location-mixed-demo-001"]) assert.ok(find(id))
  for (const id of ["unknown", "baltijos-kelias-0915", "", "__proto__"]) assert.equal(find(id), undefined)
  const first = find("targeted-demo-001")
  first.visibility = "marketplace"
  assert.equal(find("targeted-demo-001").visibility, "targeted")
})
test("targeted and expanded audiences retain the existing carrier identity", () => {
  const targeted = summary(find("targeted-demo-001"))
  assert.equal(copy(targeted).heading, "Užklausa išsiųsta vežėjui „Baltijos kelias“")
  assert.equal(copy(targeted).next, "Vežėjas galės peržiūrėti jūsų užklausą ir pateikti pasiūlymą.")
  assert.equal(copy(targeted).audience, "Tik Baltijos kelias")
  const expanded = summary(find("targeted-marketplace-demo-001"))
  assert.equal(copy(expanded).heading, "Užklausa paskelbta")
  assert.equal(copy(expanded).audience, "Baltijos kelias ir kiti tinkami vežėjai")
  assert.equal(copy(summary(find("marketplace-demo-001"))).audience, "Tinkami vežėjai")
})
test("summary preserves calendar dates and excludes private request data", () => {
  const fixture = find("marketplace-demo-001")
  const result = summary({ ...fixture, contact: { phone: "private-phone" }, privateDetails: { pickup: "secret" }, notes: "private-note" })
  assert.deepEqual(Object.keys(result).sort(), ["carrierName", "date", "locationCount", "route", "routeDetailed", "vehicleCount", "vehicleLines", "vehicleSummary", "visibility"])
  assert.equal(result.route, "Hamburg → Kaunas")
  assert.equal(result.vehicleSummary, "BMW X5 · SUV / Crossover")
  assert.equal(result.date, "2026 m. rugs. 15–17 d.")
  assert.equal(summary({ ...fixture, route: { ...fixture.route, date: { type: "anytime" } } }).date, "Bet kada")
  assert.throws(() => summary({ ...fixture, visibility: "targeted" }), /requires a carrier/)
})

test("multi-vehicle published summary stays compact and excludes per-vehicle photos", () => {
  const result = summary(find("multi-vehicle-demo-001"))
  assert.equal(result.vehicleCount, 2)
  assert.equal(result.vehicleSummary, "2 automobiliai · BMW X5, Audi Q5")
  assert.deepEqual(result.vehicleLines, ["BMW X5 · SUV / Crossover · Hamburg → Kaunas", "Audi Q5 · SUV / Crossover · Hamburg → Kaunas"])
  assert.equal(JSON.stringify(result).includes("photos"), false)
})

test("multi-location published summaries distinguish shared and mixed destinations", () => {
  const pickups = summary(find("multi-location-pickups-demo-001"))
  assert.equal(pickups.route, "2 paėmimo vietos → Kaunas")
  assert.equal(pickups.routeDetailed, "Hamburg, Berlin → Kaunas")
  assert.equal(pickups.locationCount, 3)
  const mixed = summary(find("multi-location-mixed-demo-001"))
  assert.equal(mixed.route, "Kelių vietų pervežimas")
  assert.equal(mixed.locationCount, 4)
})
