import type { VehicleDraft } from "@/features/public/create-request/model"
import type { DateWindowValue } from "./date-window"
import type { CarrierRoute } from "./carrier-route"

export const bookingStatuses = ["booked", "pickup_scheduled", "collected", "in_transit", "delivered", "completed"] as const
export type BookingStatus = (typeof bookingStatuses)[number]

export type BookingVehicle = Omit<VehicleDraft, "photos" | "usesDefaultRoute">

export type Booking = {
  id: string
  requestId: string
  acceptedOfferId: string
  acceptedOfferVersion: number
  carrierId: string
  carrier: CarrierRoute["carrier"]
  conversationId: string
  vehicles: BookingVehicle[]
  agreedTotalPrice: number
  currency: "EUR"
  paymentTerms: string
  requestedPickupWindow: DateWindowValue
  plannedPickup: string
  plannedDelivery: string
  status: BookingStatus
  createdAt: string
}
