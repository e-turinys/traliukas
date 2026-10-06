import type { VehicleDraft } from "@/features/public/create-request/model"
import type { DateWindowValue } from "./date-window"
import type { CarrierRoute } from "./carrier-route"

export const bookingStatuses = ["booked", "pickup_scheduled", "collected", "in_transit", "delivered", "completed"] as const
export type BookingStage = (typeof bookingStatuses)[number]
export type BookingStatus = BookingStage | "cancelled"

export type BookingPickup = {
  vehicle_id: string
  street: string
  contact_name: string
  contact_phone: string
  scheduled_from: string
  scheduled_to: string
}

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
  statusVersion?: number
  viewer?: "customer" | "carrier"
  pickups?: BookingPickup[]
  createdAt: string
}
