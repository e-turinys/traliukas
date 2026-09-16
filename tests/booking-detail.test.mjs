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

const { findMockRequestDetail } = await import("../src/lib/mock/request-details.ts")
const { findMockBooking, listMockBookings } = await import("../src/lib/mock/bookings.ts")
const {
  bookingChatHref, bookingCompletionCopy, bookingConversationCopy, bookingStatusLabel,
  bookingStatusLabels, bookingTimeline, canCustomerConfirmDelivery, completeDeliveredBooking,
  createBookingSnapshot, hydrateBooking, serializeBooking,
} = await import("../src/features/public/booking-detail/logic.ts")

test("Booking snapshot retains accepted Offer identity, version, price and payment terms", () => {
  const request = findMockRequestDetail("booked-demo-001")
  const offer = request.offers.find(item => item.status === "accepted")
  const booking = createBookingSnapshot({ id: "booking", request, offer, conversationId: "conversation", createdAt: "2026-09-14T08:25:00Z" })
  assert.equal(booking.requestId, request.id)
  assert.equal(booking.acceptedOfferId, offer.id)
  assert.equal(booking.acceptedOfferVersion, offer.offerVersion)
  assert.equal(booking.agreedTotalPrice, offer.totalPriceEur)
  assert.equal(booking.paymentTerms, offer.paymentTerms)
  assert.equal(booking.carrierId, offer.carrier.id)
})

test("multi-vehicle snapshot retains every vehicle and per-vehicle route", () => {
  const booking = findMockBooking("transport-multi-location-demo-001")
  assert.equal(booking.vehicles.length, 2)
  assert.deepEqual(booking.vehicles.map(vehicle => [vehicle.make, vehicle.model, vehicle.pickupLocation.city, vehicle.deliveryLocation.city]), [
    ["BMW", "X5", "Hamburg", "Kaunas"],
    ["Audi", "Q5", "Berlin", "Kaunas"],
  ])
  assert.equal(booking.agreedTotalPrice, 900)
  assert.equal(booking.currency, "EUR")
})

test("later Request mutation cannot alter the Booking agreement snapshot", () => {
  const request = findMockRequestDetail("booked-demo-001")
  const offer = request.offers.find(item => item.status === "accepted")
  const booking = createBookingSnapshot({ id: "booking", request, offer, conversationId: "conversation", createdAt: "2026-09-14T08:25:00Z" })
  const originalName = `${booking.vehicles[0].make} ${booking.vehicles[0].model}`
  const originalPickup = booking.vehicles[0].pickupLocation.city
  request.vehicles[0].make = "Changed"
  request.vehicles[0].model = "Vehicle"
  request.vehicles[0].pickupLocation.city = "Changed city"
  assert.equal(`${booking.vehicles[0].make} ${booking.vehicles[0].model}`, originalName)
  assert.equal(booking.vehicles[0].pickupLocation.city, originalPickup)
})

test("later Offer mutation cannot alter accepted price, terms, version or carrier snapshot", () => {
  const request = findMockRequestDetail("booked-demo-001")
  const offer = request.offers.find(item => item.status === "accepted")
  const booking = createBookingSnapshot({ id: "booking", request, offer, conversationId: "conversation", createdAt: "2026-09-14T08:25:00Z" })
  const expected = { price: booking.agreedTotalPrice, terms: booking.paymentTerms, version: booking.acceptedOfferVersion, carrier: booking.carrier.name }
  offer.totalPriceEur = 1
  offer.paymentTerms = "Changed"
  offer.offerVersion = 99
  offer.carrier.name = "Changed carrier"
  assert.deepEqual({ price: booking.agreedTotalPrice, terms: booking.paymentTerms, version: booking.acceptedOfferVersion, carrier: booking.carrier.name }, expected)
})

test("Booking lifecycle labels and timeline progression use one aggregate status", () => {
  assert.deepEqual(bookingStatusLabels, {
    booked: "Vežėjas pasirinktas",
    pickup_scheduled: "Paėmimas suplanuotas",
    collected: "Automobiliai paimti",
    in_transit: "Vežama",
    delivered: "Pristatyta",
    completed: "Pervežimas užbaigtas",
  })
  const timeline = bookingTimeline("in_transit", 1)
  assert.deepEqual(timeline.map(step => step.state), ["complete", "complete", "complete", "current", "upcoming", "upcoming"])
  assert.equal(timeline.filter(step => step.state === "current").length, 1)
})

test("Booking lifecycle and Delivered confirmation wording follow vehicle count", () => {
  assert.equal(bookingStatusLabel("collected", 1), "Automobilis paimtas")
  assert.equal(bookingStatusLabel("collected", 2), "Automobiliai paimti")
  assert.equal(bookingStatusLabel("collected", 3), "Automobiliai paimti")
  assert.equal(bookingTimeline("collected", 1)[2].label, "Automobilis paimtas")
  assert.equal(bookingTimeline("collected", 2)[2].label, "Automobiliai paimti")
  assert.equal(bookingCompletionCopy(1).cta, "Patvirtinti, kad automobilis gautas")
  assert.equal(bookingCompletionCopy(2).cta, "Patvirtinti, kad automobiliai gauti")
  assert.match(bookingCompletionCopy(1).dialogDescription, /automobilis gautas/)
  assert.match(bookingCompletionCopy(2).dialogDescription, /automobiliai gauti/)
})

test("Completed Booking uses historical Chat copy while active Booking keeps the open action", () => {
  assert.equal(bookingConversationCopy("completed").description, "Peržiūrėkite susirašinėjimo istoriją.")
  assert.equal(bookingConversationCopy("completed").cta, "Peržiūrėti pokalbį")
  for (const status of ["booked", "pickup_scheduled", "collected", "in_transit", "delivered"]) {
    assert.equal(bookingConversationCopy(status).cta, "Atidaryti pokalbį")
  }
})

test("only Delivered exposes completion and local transition produces Completed", () => {
  for (const status of Object.keys(bookingStatusLabels)) assert.equal(canCustomerConfirmDelivery(status), status === "delivered")
  const delivered = findMockBooking("transport-delivered-demo-001")
  const completed = completeDeliveredBooking(delivered)
  assert.equal(completed.status, "completed")
  assert.equal(delivered.status, "delivered")
  assert.throws(() => completeDeliveredBooking(findMockBooking("transport-demo-001")), /delivered/)
})

test("conversation ID is retained and resolves to the canonical Chat route", () => {
  const booking = findMockBooking("transport-demo-001")
  assert.equal(booking.conversationId, "booking-winning-demo-001")
  assert.equal(bookingChatHref(booking), "/messages/booking-winning-demo-001")
})

test("Booking serialization preserves the requested date window", () => {
  const booking = findMockBooking("transport-demo-001")
  const restored = hydrateBooking(JSON.parse(JSON.stringify(serializeBooking(booking))))
  assert.deepEqual(restored, booking)
})

test("review fixtures cover every aggregate lifecycle state, multi-location and unknown ID", () => {
  assert.deepEqual(listMockBookings().map(booking => booking.status), ["booked", "pickup_scheduled", "collected", "in_transit", "delivered", "completed", "in_transit"])
  assert.equal(findMockBooking("unknown-booking"), undefined)
  assert.equal(findMockBooking("__proto__"), undefined)
})
