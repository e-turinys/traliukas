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

const { findMockOfferDetail: find } = await import("../src/lib/mock/offer-details.ts")
const { requestReviewNow: now } = await import("../src/lib/mock/request-details.ts")
const {
  applyMockOfferDecision, customerOfferStatusLabels, isOfferActionable, latestOfferTerms,
  offerDetailStatus, offeredPickupDiffers, offerReadOnlyCopy, offerRevisionHistory, formatOfferTimestamp,
} = await import("../src/features/public/offer-detail/logic.ts")

const ids = {
  pending: "marketplace-demo-001-offer-1",
  updated: "updated-offer-demo-001-offer-1",
  expired: "historical-offers-demo-001-offer-1",
  declined: "historical-offers-demo-001-offer-2",
  unavailable: "request-changed-demo-001-offer-1",
  notSelected: "booked-demo-001-offer-2",
  accepted: "booked-demo-001-offer-1",
  multi: "multi-vehicle-demo-001-offer-1",
}

test("offer lookup reuses explicit P07 offer and request fixtures", () => {
  for (const id of Object.values(ids)) assert.equal(find(id).offer.id, id)
  for (const id of ["unknown-offer", "", "__proto__", "marketplace-demo-001"]) assert.equal(find(id), undefined)
  const first = find(ids.pending)
  first.offer.totalPriceEur = 1
  assert.equal(find(ids.pending).offer.totalPriceEur, 590)
  assert.equal(find(ids.pending).offer.paymentTerms, "Apmokėjimas pristatymo metu")
})

test("customer status labels are human-readable and only pending is actionable", () => {
  assert.deepEqual(customerOfferStatusLabels, {
    pending: "Laukia jūsų sprendimo",
    accepted: "Pasirinktas",
    declined: "Atmestas",
    expired: "Pasiūlymas nebegalioja",
    unavailable: "Pasiūlymas nebegalioja",
    not_selected: "Nepasirinktas",
    withdrawn: "Atšauktas vežėjo",
  })
  for (const status of Object.keys(customerOfferStatusLabels)) assert.equal(isOfferActionable(status), status === "pending")
})

test("fixture states derive pending, expired, unavailable, not-selected, accepted and declined", () => {
  const expected = { pending: "pending", updated: "pending", expired: "expired", unavailable: "unavailable", notSelected: "not_selected", accepted: "accepted", declined: "declined" }
  for (const [key, status] of Object.entries(expected)) {
    const detail = find(ids[key])
    assert.equal(offerDetailStatus(detail.request, detail.offer, now), status)
  }
})

test("latest fields remain the source of truth and previous revisions sort newest first", () => {
  const { offer } = find(ids.updated)
  assert.deepEqual(latestOfferTerms(offer), {
    totalPriceEur: 570,
    pickupDate: "2026-09-15",
    deliveryDate: "2026-09-17",
    paymentTerms: "Apmokėjimas pristatymo metu",
  })
  const older = { ...offer.revisions[0], totalPriceEur: 610, revisedAt: "2026-09-13T07:30:00Z" }
  const newer = { ...offer.revisions[0], totalPriceEur: 590, revisedAt: "2026-09-14T07:30:00Z" }
  assert.deepEqual(offerRevisionHistory({ ...offer, revisions: [older, newer] }).map(item => item.totalPriceEur), [590, 610])
  assert.deepEqual(offer.revisions.map(item => item.totalPriceEur), [590])
})

test("mock accept and decline update only a cloned pending offer", () => {
  for (const decision of ["accept", "decline"]) {
    const { request, offer } = find(ids.pending)
    const result = applyMockOfferDecision(request, offer, decision, now)
    assert.equal(result.status, decision === "accept" ? "accepted" : "declined")
    assert.equal(offer.status, "pending")
    assert.equal(request.status, "active")
    assert.equal(request.bookingId, undefined)
  }
  const readOnly = find(ids.expired)
  assert.throws(() => applyMockOfferDecision(readOnly.request, readOnly.offer, "accept", now), /pending/)
})

test("read-only copy explains terminal states including request-change invalidation", () => {
  const expected = {
    expired: "Šio pasiūlymo galiojimo laikas baigėsi.",
    unavailable: "Šis pasiūlymas nebegalioja, nes užklausos duomenys pasikeitė.",
    notSelected: "Pasirinkote kitą vežėją.",
    accepted: "Pasiūlymas pasirinktas.",
    declined: "Šį pasiūlymą atmetėte.",
  }
  for (const [key, copy] of Object.entries(expected)) {
    const detail = find(ids[key])
    assert.equal(offerReadOnlyCopy(detail.request, detail.offer, now), copy)
  }
})

test("pickup differences are neutral and only derived from explicit requested dates", () => {
  const { request, offer } = find(ids.pending)
  assert.equal(offeredPickupDiffers(request, offer), false)
  assert.equal(offeredPickupDiffers(request, { ...offer, pickupDate: "2026-09-18" }), true)
  assert.equal(offeredPickupDiffers({ ...request, route: { ...request.route, date: { type: "anytime" } } }, { ...offer, pickupDate: "2026-09-18" }), false)
})

test("offer timestamps use the Lithuanian calendar display while preserving Vilnius time", () => {
  assert.equal(formatOfferTimestamp("2026-09-14T18:00:00Z"), "2026 m. rugs. 14 d. 21:00")
})

test("one request-level offer covers the complete multi-vehicle request without partial selection", () => {
  const detail = find(ids.multi)
  assert.equal(detail.request.vehicles.length, 2)
  assert.equal(detail.offer.totalPriceEur, 900)
  assert.equal("vehicleId" in detail.offer, false)
  assert.equal("vehicleIds" in detail.offer, false)
  assert.equal("lineItems" in detail.offer, false)
  assert.equal(isOfferActionable(offerDetailStatus(detail.request, detail.offer, now)), true)
})

test("multi-vehicle fixture uses a comment that applies to the complete vehicle set", () => {
  const detail = find("multi-location-pickups-demo-001-offer-1")
  assert.equal(detail.offer.carrierComment, "Automobilius paimsime sutartu laiku ir pristatysime į nurodytas vietas.")
})
