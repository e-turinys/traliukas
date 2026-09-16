import { createBookingSnapshot } from "@/features/public/booking-detail/logic"
import { findMockRequestDetail } from "./request-details"
import type { RequestDetail, RequestOffer } from "@/features/public/request-detail/model"
import type { Booking, BookingStatus } from "@/lib/types/booking"

const createdAt = "2026-09-14T08:25:00Z"

function acceptedOffer(request: RequestDetail, index = 0, totalPriceEur?: number): RequestOffer {
  const offer = request.offers[index]
  if (!offer) throw new Error(`Missing Booking fixture Offer for ${request.id}`)
  return { ...offer, status: "accepted", totalPriceEur: totalPriceEur ?? offer.totalPriceEur, carrier: { ...offer.carrier } }
}

function snapshot(id: string, request: RequestDetail, offer: RequestOffer, status: BookingStatus, conversationId = "booking-winning-demo-001") {
  return createBookingSnapshot({ id, request, offer, conversationId, status, createdAt })
}

const bookedRequest = findMockRequestDetail("booked-demo-001")!
const baseOffer = acceptedOffer(bookedRequest)
const completedRequest = findMockRequestDetail("completed-demo-001")!
const multiRequest = findMockRequestDetail("multi-location-pickups-demo-001")!

const fixtures: readonly Booking[] = [
  snapshot("transport-demo-001", bookedRequest, baseOffer, "booked"),
  snapshot("transport-pickup-scheduled-demo-001", bookedRequest, baseOffer, "pickup_scheduled"),
  snapshot("transport-collected-demo-001", bookedRequest, baseOffer, "collected"),
  snapshot("transport-in-transit-demo-001", bookedRequest, baseOffer, "in_transit"),
  snapshot("transport-delivered-demo-001", bookedRequest, baseOffer, "delivered"),
  snapshot("transport-completed-demo-001", completedRequest, acceptedOffer(completedRequest), "completed", "completed-demo-001"),
  snapshot("transport-multi-location-demo-001", multiRequest, acceptedOffer(multiRequest, 0, 900), "in_transit"),
]

function cloneBooking(booking: Booking): Booking {
  return {
    ...booking,
    carrier: { ...booking.carrier },
    vehicles: booking.vehicles.map(vehicle => ({
      ...vehicle,
      pickupLocation: vehicle.pickupLocation ? { ...vehicle.pickupLocation } : null,
      deliveryLocation: vehicle.deliveryLocation ? { ...vehicle.deliveryLocation } : null,
    })),
    requestedPickupWindow: booking.requestedPickupWindow.type === "single"
      ? { type: "single", date: booking.requestedPickupWindow.date ? new Date(booking.requestedPickupWindow.date) : undefined }
      : booking.requestedPickupWindow.type === "range"
        ? { type: "range", from: booking.requestedPickupWindow.from ? new Date(booking.requestedPickupWindow.from) : undefined, to: booking.requestedPickupWindow.to ? new Date(booking.requestedPickupWindow.to) : undefined }
        : { ...booking.requestedPickupWindow },
  }
}

export function findMockBooking(id: string) {
  const booking = fixtures.find(candidate => candidate.id === id)
  return booking ? cloneBooking(booking) : undefined
}

export function listMockBookings() {
  return fixtures.map(cloneBooking)
}
