import { readDate, writeDate } from "../search-query"
import type { RequestDetail, RequestOffer } from "../request-detail/model"
import { bookingStatuses, type Booking, type BookingStatus } from "@/lib/types/booking"

export const bookingStatusLabels: Record<BookingStatus, string> = {
  booked: "Vežėjas pasirinktas",
  pickup_scheduled: "Paėmimas suplanuotas",
  collected: "Automobiliai paimti",
  in_transit: "Vežama",
  delivered: "Pristatyta",
  completed: "Pervežimas užbaigtas",
}

export function bookingStatusLabel(status: BookingStatus, vehicleCount: number) {
  if (status === "collected" && vehicleCount === 1) return "Automobilis paimtas"
  return bookingStatusLabels[status]
}

function cloneDate(value: Date | undefined) {
  return value ? new Date(value.getTime()) : undefined
}

function cloneRequestedPickupWindow(value: RequestDetail["route"]["date"]): Booking["requestedPickupWindow"] {
  if (value.type === "single") return { type: "single", date: cloneDate(value.date) }
  if (value.type === "range") return { type: "range", from: cloneDate(value.from), to: cloneDate(value.to) }
  if (value.type === "flexible") return { ...value }
  return { type: "anytime" }
}

export function createBookingSnapshot({
  id, request, offer, conversationId, status = "booked", createdAt,
}: {
  id: string
  request: RequestDetail
  offer: RequestOffer
  conversationId: string
  status?: BookingStatus
  createdAt: string
}): Booking {
  if (offer.requestId !== request.id) throw new Error("Accepted Offer must belong to the Booking Request")
  if (offer.status !== "accepted") throw new Error("Booking snapshot requires an accepted Offer")
  if (!request.vehicles.length) throw new Error("Booking requires at least one vehicle")
  return {
    id,
    requestId: request.id,
    acceptedOfferId: offer.id,
    acceptedOfferVersion: offer.offerVersion,
    carrierId: offer.carrier.id,
    carrier: { ...offer.carrier },
    conversationId,
    vehicles: request.vehicles.map(({ photos: _photos, usesDefaultRoute: _usesDefaultRoute, pickupLocation, deliveryLocation, ...vehicle }) => {
      void _photos; void _usesDefaultRoute
      return {
        ...vehicle,
        pickupLocation: pickupLocation ? { ...pickupLocation } : null,
        deliveryLocation: deliveryLocation ? { ...deliveryLocation } : null,
      }
    }),
    agreedTotalPrice: offer.totalPriceEur,
    currency: "EUR",
    paymentTerms: offer.paymentTerms,
    requestedPickupWindow: cloneRequestedPickupWindow(request.route.date),
    plannedPickup: offer.pickupDate,
    plannedDelivery: offer.deliveryDate,
    status,
    createdAt,
  }
}

export type BookingPayload = Omit<Booking, "requestedPickupWindow"> & { requestedPickupWindowQuery: string }

export function serializeBooking(booking: Booking): BookingPayload {
  const params = new URLSearchParams()
  writeDate(params, booking.requestedPickupWindow)
  const { requestedPickupWindow: _requestedPickupWindow, ...rest } = booking
  void _requestedPickupWindow
  return { ...rest, requestedPickupWindowQuery: params.toString() }
}

export function hydrateBooking(payload: BookingPayload): Booking {
  const { requestedPickupWindowQuery, ...rest } = payload
  return { ...rest, requestedPickupWindow: readDate(new URLSearchParams(requestedPickupWindowQuery)).value }
}

export function bookingTimeline(status: BookingStatus, vehicleCount: number) {
  const currentIndex = bookingStatuses.indexOf(status)
  return bookingStatuses.map((step, index) => ({
    status: step,
    label: bookingStatusLabel(step, vehicleCount),
    state: index < currentIndex ? "complete" as const : index === currentIndex ? "current" as const : "upcoming" as const,
  }))
}

export function bookingCompletionCopy(vehicleCount: number) {
  const singular = vehicleCount === 1
  return {
    cardDescription: singular
      ? "Jei automobilis pristatytas, patvirtinkite jo gavimą ir užbaikite pervežimą."
      : "Jei automobiliai pristatyti, patvirtinkite jų gavimą ir užbaikite pervežimą.",
    cta: singular ? "Patvirtinti, kad automobilis gautas" : "Patvirtinti, kad automobiliai gauti",
    dialogTitle: singular ? "Patvirtinti automobilio gavimą?" : "Patvirtinti automobilių gavimą?",
    dialogDescription: singular
      ? "Patvirtinus, kad automobilis gautas, pervežimas bus pažymėtas kaip užbaigtas."
      : "Patvirtinus, kad automobiliai gauti, pervežimas bus pažymėtas kaip užbaigtas.",
  }
}

export function bookingConversationCopy(status: BookingStatus) {
  return status === "completed"
    ? { description: "Peržiūrėkite susirašinėjimo istoriją.", cta: "Peržiūrėti pokalbį" }
    : { description: "Susisiekite su pasirinktu vežėju tame pačiame pasiūlymo pokalbyje.", cta: "Atidaryti pokalbį" }
}

export function canCustomerConfirmDelivery(status: BookingStatus) {
  return status === "delivered"
}

export function completeDeliveredBooking(booking: Booking): Booking {
  if (!canCustomerConfirmDelivery(booking.status)) throw new Error("Only a delivered Booking can be completed")
  return { ...booking, status: "completed" }
}

export function bookingChatHref(booking: Pick<Booking, "conversationId">) {
  return `/messages/${encodeURIComponent(booking.conversationId)}`
}

export const bookingDomainEvents = [
  "booking.created",
  "booking.pickupScheduled",
  "booking.collected",
  "booking.inTransit",
  "booking.delivered",
  "booking.completed",
] as const
