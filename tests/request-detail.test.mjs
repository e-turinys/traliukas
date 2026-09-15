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
const { findMockRequestDetail: find, requestReviewNow: now } = await import("../src/lib/mock/request-details.ts")
const { applyRequestEdit: apply, closeRequest, repeatRequest, expandRequestVisibility, requestActions, requestOfferGroups, visibleOfferStatus: status, serializeRequestDetail, hydrateRequestDetail } = await import("../src/features/public/request-detail/logic.ts")
const today = now.slice(0, 10)
const editOf = request => ({ route: request.route, vehicle: request.vehicle, notes: request.notes, photos: request.photos })

test("review fixtures cover active, targeted, updated, booked, closed, completed, draft and unknown", () => {
  assert.equal(find("marketplace-demo-001").offers.length, 2)
  assert.equal(find("targeted-demo-001").offers.length, 0)
  assert.equal(find("updated-offer-demo-001").offers[0].offerVersion, 2)
  for (const state of ["booked", "closed", "completed", "draft"]) assert.equal(find(`${state}-demo-001`).status, state)
  assert.equal(find("unknown-p07-request"), undefined)
  assert.equal(find("__proto__"), undefined)
  assert.equal(find("non-running-demo-001").vehicle.rolls, "yes")
})

test("calendar date serialization survives JSON and preserves request context", () => {
  const request = find("targeted-demo-001")
  const restored = hydrateRequestDetail(JSON.parse(JSON.stringify(serializeRequestDetail(request))))
  assert.deepEqual(restored, request)
})

test("notes and local photos retain request version and valid offers", () => {
  const request = find("marketplace-demo-001")
  const file = new File(["test"], "vehicle.png", { type: "image/png" })
  const edited = apply(request, { ...editOf(request), notes: "Changed", photos: [file] }, false, today)
  assert.equal(edited.requestVersion, 1)
  assert.equal(edited.photos[0], file)
  assert.ok(edited.offers.every(offer => status(edited, offer, now) === "pending"))
  assert.notEqual(request.notes, "Changed")
  const removed = apply(edited, { ...editOf(edited), photos: [] }, false, today)
  assert.equal(removed.requestVersion, 1)
})

test("every material field requires confirmation, increments version and invalidates pending only", () => {
  const request = find("marketplace-demo-001")
  request.offers.push({ ...request.offers[0], id: "history", status: "declined" })
  const edits = [
    { route: { ...request.route, from: request.route.to, to: request.route.from } },
    { route: { ...request.route, date: { type: "anytime" } } },
    { route: { ...request.route, date: { type: "single", date: new Date(2026, 8, 16) } } },
    { route: { ...request.route, date: { type: "range", from: new Date(2026, 8, 16), to: new Date(2026, 8, 18) } } },
    { vehicle: { ...request.vehicle, category: "car" } },
    { vehicle: { ...request.vehicle, condition: "non-running", rolls: "yes" } },
  ]
  for (const patch of edits) {
    const edit = { ...editOf(request), ...patch }
    assert.throws(() => apply(request, edit, false, today), /confirmation/)
    const next = apply(request, edit, true, today)
    assert.equal(next.requestVersion, 2)
    assert.deepEqual(next.offers.map(offer => offer.status), ["unavailable", "unavailable", "declined"])
    assert.equal(request.requestVersion, 1)
    assert.equal(request.offers[0].status, "pending")
  }
})

test("invalid route, date, condition and photos cannot be saved", () => {
  const request = find("marketplace-demo-001")
  for (const patch of [
    { route: { ...request.route, to: request.route.from } },
    { route: { ...request.route, date: { type: "range" } } },
    { vehicle: { ...request.vehicle, condition: "non-running", rolls: "" } },
    { photos: [new File(["bad"], "bad.txt", { type: "text/plain" })] },
  ]) assert.throws(() => apply(request, { ...editOf(request), ...patch }, true, today), /Invalid/)
})

test("closing requires confirmation; repeat copies to a distinct draft without reopening", () => {
  const request = find("marketplace-demo-001")
  assert.throws(() => closeRequest(request, false))
  const closed = closeRequest(request, true)
  assert.equal(closed.status, "closed")
  assert.ok(closed.offers.every(offer => offer.status === "unavailable"))
  assert.throws(() => apply(closed, editOf(closed), true, today), /read-only/)
  const draft = repeatRequest(closed)
  assert.notEqual(draft.id, closed.id)
  assert.equal(draft.status, "draft")
  assert.deepEqual(draft.vehicle, closed.vehicle)
  assert.deepEqual(draft.route, closed.route)
  assert.equal(draft.notes, closed.notes)
  assert.equal(draft.offers.length, 0)
  assert.equal(closed.status, "closed")
})

test("booked, completed, closed and draft requests cannot use normal edit or close", () => {
  for (const state of ["booked", "completed", "closed", "draft"]) {
    const request = find(`${state}-demo-001`)
    assert.equal(requestActions(request).edit, false)
    assert.equal(requestActions(request).close, false)
    assert.throws(() => closeRequest(request, true))
    assert.throws(() => apply(request, editOf(request), true, today))
    assert.ok(request.offers.every(offer => status(request, offer, now) !== "pending"))
  }
  assert.equal(requestActions(find("booked-demo-001")).booking, true)
})

test("active offers remain comparable while booked and completed offers separate selected from history", () => {
  const active = requestOfferGroups(find("marketplace-demo-001"))
  assert.equal(active.selected, undefined)
  assert.deepEqual(active.current.map(offer => offer.status), ["pending", "pending"])
  assert.deepEqual(active.historical, [])
  for (const state of ["booked", "completed"]) {
    const groups = requestOfferGroups(find(`${state}-demo-001`))
    assert.equal(groups.selected.status, "accepted")
    assert.deepEqual(groups.current, [])
    assert.deepEqual(groups.historical.map(offer => offer.status), ["not_selected"])
  }
})

test("stale, expired, mismatched and terminal offers are never actionable", () => {
  const request = find("marketplace-demo-001"), offer = request.offers[0]
  assert.equal(status(request, offer, now), "pending")
  assert.equal(status(request, { ...offer, expiresAt: now }, now), "expired")
  assert.equal(status(request, { ...offer, expiresAt: "invalid" }, now), "unavailable")
  assert.equal(status(request, { ...offer, requestVersion: 0 }, now), "unavailable")
  assert.equal(status(request, { ...offer, requestId: "another" }, now), "unavailable")
  for (const state of ["withdrawn", "declined", "accepted", "not_selected", "unavailable", "expired"]) assert.equal(status(request, { ...offer, status: state }, now), state)
})

test("targeted expansion stays local and does not invalidate offers or duplicate requests", () => {
  const original = find("targeted-demo-001"), expanded = expandRequestVisibility(original)
  assert.equal(expanded.visibility, "marketplace")
  assert.equal(expanded.id, original.id)
  assert.equal(expanded.requestVersion, original.requestVersion)
  assert.equal(find(original.id).visibility, "targeted")
  assert.equal(expandRequestVisibility({ ...original, status: "closed" }).visibility, "targeted")
})
