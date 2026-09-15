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

const { createRequestDraft, validateStep, targetIssue, switchToMarketplace, photoSelectionError, addRequestVehicle, removeRequestVehicle, maxRequestVehicles } = await import("../src/features/public/create-request/logic.ts")
const { calendarDate, writeDate } = await import("../src/features/public/search-query.ts")
const { routeRequestHref } = await import("../src/features/public/route-detail-context.ts")
const { mockCarrierRoutes } = await import("../src/lib/mock/carrier-routes.ts")
const today = "2026-09-13"
const prefilled = () => createRequestDraft(new URLSearchParams("from=hamburg-de&to=kaunas-lt&dateType=range&dateFrom=2026-09-15&dateTo=2026-09-17"))
const targeted = () => createRequestDraft(new URL(routeRequestHref(mockCarrierRoutes[0], true), "https://example.test").searchParams)

test("blank and invalid locations require selected, distinct public locations", () => {
  const blank = createRequestDraft(new URLSearchParams())
  assert.equal(blank.vehicles.length, 1)
  assert.equal(blank.vehicle, undefined)
  assert.equal(blank.visibility, "marketplace")
  assert.equal(blank.target.requested, false)
  assert.deepEqual(Object.keys(validateStep(blank, 1, today)), ["from", "to"])
  const same = createRequestDraft(new URLSearchParams("from=hamburg-de&to=hamburg-de"))
  assert.ok(validateStep(same, 1, today).to)
  assert.equal(createRequestDraft(new URLSearchParams("from=unknown&to=kaunas-lt")).route.from, null)
  assert.deepEqual(validateStep(prefilled(), 1, today), {})
})

test("P01 flexible alias and P02 flexible names both prefill", () => {
  for (const key of ["dateOption", "dateFlexible"]) {
    const draft = createRequestDraft(new URLSearchParams(`from=hamburg-de&to=kaunas-lt&dateType=flexible&${key}=next-week`))
    assert.deepEqual(draft.route.date, { type: "flexible", option: "next-week" })
    assert.deepEqual(validateStep(draft, 1, today), {})
  }
})

test("calendar prefill preserves date-only values across timezones and rejects incomplete dates", () => {
  const original = process.env.TZ
  try {
    for (const zone of ["America/Chicago", "Europe/Vilnius", "Pacific/Auckland"]) {
      process.env.TZ = zone
      const draft = prefilled()
      assert.equal(calendarDate(draft.route.date.from), "2026-09-15")
      const params = new URLSearchParams()
      writeDate(params, draft.route.date)
      assert.equal(params.get("dateTo"), "2026-09-17")
    }
  } finally { if (original === undefined) delete process.env.TZ; else process.env.TZ = original }
  for (const query of ["dateType=single&date=2026-02-30", "dateType=range&dateFrom=2026-09-15", "dateType=range&dateFrom=2026-09-17&dateTo=2026-09-15", "dateType=flexible&dateFlexible=bad"]) {
    assert.ok(validateStep(createRequestDraft(new URLSearchParams(query)), 1, today).date)
  }
})

test("actual P03 URL resolves target names and defaults to only that carrier", () => {
  const draft = targeted()
  assert.equal(draft.visibility, "targeted")
  assert.equal(draft.target.route.carrier.name, "Baltijos kelias")
  assert.equal(targetIssue(draft, today), undefined)
  assert.ok(targetIssue({ ...draft, target: { requested: true, route: null } }, today))
  const mismatch = createRequestDraft(new URLSearchParams("visibility=targeted&targetRoute=baltijos-kelias-0915&targetCarrier=manto-transportas"))
  assert.equal(mismatch.target.route, null)
  assert.equal(mismatch.visibility, "targeted")
})

test("unavailable and edited incompatible targets require explicit marketplace fallback", () => {
  const draft = targeted()
  for (const route of [{ ...draft.target.route, capacityReserved: draft.target.route.capacityTotal }, { ...draft.target.route, acceptingNewRequests: false }, { ...draft.target.route, dateTo: "2026-09-12" }]) {
    assert.ok(targetIssue({ ...draft, target: { requested: true, route } }, today))
  }
  assert.ok(targetIssue({ ...draft, route: { ...draft.route, from: draft.route.to, to: draft.route.from } }, today))
  assert.ok(targetIssue({ ...draft, vehicles: [{ ...draft.vehicles[0], category: "van" }] }, today))
  assert.ok(targetIssue({ ...draft, vehicles: [{ ...draft.vehicles[0], category: "other" }] }, today))
  assert.ok(targetIssue({ ...draft, vehicles: Array.from({ length: 4 }, (_, index) => ({ ...draft.vehicles[0], id: `vehicle-${index + 1}`, category: "car" })) }, today))
  const fallback = switchToMarketplace(draft)
  assert.equal(fallback.visibility, "marketplace")
  assert.deepEqual(fallback.target, { requested: false, route: null })
  assert.equal(fallback.route, draft.route)
  assert.equal(fallback.contact, draft.contact)
  assert.equal(draft.visibility, "targeted")
})

test("vehicle validates required fields and rolling answer only when non-running", () => {
  const draft = prefilled()
  assert.deepEqual(Object.keys(validateStep(draft, 2, today)), ["vehicles"])
  assert.deepEqual(Object.keys(validateStep(draft, 2, today).vehicles["vehicle-1"]), ["category", "make", "model", "condition"])
  draft.vehicles[0] = { ...draft.vehicles[0], category: "car", make: "VW", model: "Golf", year: "", condition: "running", rolls: "" }
  assert.deepEqual(validateStep(draft, 2, today), {})
  draft.vehicles[0].condition = "non-running"
  assert.ok(validateStep(draft, 2, today).vehicles["vehicle-1"].rolls)
  draft.vehicles[0].rolls = "unknown"
  assert.deepEqual(validateStep(draft, 2, today), {})
  draft.vehicles[0].year = "abcd"
  assert.ok(validateStep(draft, 2, today).vehicles["vehicle-1"].year)
})

test("vehicles add and remove with stable IDs while preserving values and enforcing 1–10", () => {
  const first = { ...prefilled().vehicles[0], category: "suv", make: "BMW", model: "X5", condition: "running" }
  let vehicles = addRequestVehicle([first], first.pickupLocation, first.deliveryLocation)
  vehicles[1] = { ...vehicles[1], category: "suv", make: "Audi", model: "Q5", condition: "non-running", rolls: "yes" }
  assert.equal(vehicles.length, 2)
  assert.equal(vehicles[0], first)
  assert.equal(vehicles[1].id, "vehicle-2")
  assert.deepEqual(validateStep({ ...prefilled(), vehicles }, 2, today), {})
  assert.equal(removeRequestVehicle(vehicles, vehicles[0].id), vehicles)
  assert.deepEqual(removeRequestVehicle(vehicles, vehicles[1].id), [first])
  assert.equal(removeRequestVehicle([first], first.id)[0], first)
  while (vehicles.length < maxRequestVehicles) vehicles = addRequestVehicle(vehicles, first.pickupLocation, first.deliveryLocation)
  assert.equal(vehicles.length, 10)
  assert.equal(addRequestVehicle(vehicles), vehicles)
  assert.ok(validateStep({ ...prefilled(), vehicles: [] }, 2, today).vehicleCount)
  assert.ok(validateStep({ ...prefilled(), vehicles: [...vehicles, { ...first, id: "vehicle-11" }] }, 2, today).vehicleCount)
})

test("new vehicles inherit the default route and per-vehicle overrides remain independent", () => {
  const draft = prefilled()
  const vehicles = addRequestVehicle(draft.vehicles, draft.route.from, draft.route.to)
  assert.equal(vehicles[1].pickupLocation.id, "hamburg-de")
  assert.equal(vehicles[1].deliveryLocation.id, "kaunas-lt")
  assert.equal(vehicles[1].usesDefaultRoute, true)

  const berlin = createRequestDraft(new URLSearchParams("from=berlin-de&to=kaunas-lt")).route.from
  const overridden = vehicles.map((vehicle, index) => index === 1
    ? { ...vehicle, usesDefaultRoute: false, pickupLocation: berlin }
    : vehicle)
  assert.equal(overridden[0].pickupLocation.id, "hamburg-de")
  assert.equal(overridden[1].pickupLocation.id, "berlin-de")
})

test("target matching rejects the complete request when one vehicle route is incompatible", () => {
  const draft = targeted()
  const vilnius = createRequestDraft(new URLSearchParams("from=vilnius-lt&to=kaunas-lt")).route.from
  const vehicles = addRequestVehicle(draft.vehicles, vilnius, draft.route.to).map((vehicle, index) => ({
    ...vehicle,
    category: "suv",
    make: index === 0 ? "BMW" : "Audi",
    model: index === 0 ? "X5" : "Q5",
    condition: "running",
  }))
  assert.ok(targetIssue({ ...draft, vehicles }, today))
})

test("contact requires name phone email and terms, never email verification or OTP", () => {
  const draft = prefilled()
  assert.deepEqual(Object.keys(validateStep(draft, 4, today)), ["name", "phone", "email", "terms"])
  draft.contact = { name: "Jonas", phone: "+370 612 34567", email: "jonas@example.test" }
  draft.termsAccepted = true
  assert.deepEqual(validateStep(draft, 4, today), {})
  assert.deepEqual(validateStep(draft, 3, today), {})
  assert.equal(draft.published, undefined)
  assert.equal(draft.phoneVerified, undefined)
})

test("photo selection enforces image types, five-file limit and 10 MB size", () => {
  const image = { type: "image/jpeg", size: 100 }
  assert.equal(photoSelectionError([image], 4), undefined)
  assert.ok(photoSelectionError([image, image], 4))
  assert.ok(photoSelectionError([{ type: "text/plain", size: 100 }], 0))
  assert.ok(photoSelectionError([{ ...image, size: 11 * 1024 * 1024 }], 0))
})
