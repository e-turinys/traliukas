import type { TransportRequestDraft } from "../create-request/model"
import type { PublishedRequestInput } from "../request-published/context"
import type { CarrierRoute } from "@/lib/types/carrier-route"

export const requestStatusLabels = {
  draft: "Juodraštis", active: "Ieškoma vežėjo", booked: "Vežėjas pasirinktas",
  completed: "Pervežimas užbaigtas", closed: "Užklausa uždaryta",
} as const
export const offerStatusLabels = {
  pending: "Laukiama jūsų sprendimo", accepted: "Pasirinktas", declined: "Atmestas",
  expired: "Galiojimas baigėsi", unavailable: "Nebegalioja", not_selected: "Nepasirinktas", withdrawn: "Atšauktas vežėjo",
} as const

export type OfferRevision = {
  totalPriceEur: number
  pickupDate: string
  deliveryDate: string
  paymentTerms: string
  revisedAt?: string
}

export type RequestOffer = {
  id: string
  requestId: string
  routeId: string
  carrier: CarrierRoute["carrier"]
  status: keyof typeof offerStatusLabels
  totalPriceEur: number
  pickupDate: string
  deliveryDate: string
  expiresAt: string
  paymentTerms: string
  carrierComment?: string
  revisions: OfferRevision[]
  requestVersion: number
  routeVersion: number
  offerVersion: number
}

// Extends the P05/P06 public request projection, never its private contacts/addresses.
export type RequestDetail = PublishedRequestInput & Pick<TransportRequestDraft, "notes" | "photos"> & {
  id: string
  status: keyof typeof requestStatusLabels
  requestVersion: number
  bookingId?: string
  offers: RequestOffer[]
}

export type RequestEdit = Pick<RequestDetail, "route" | "notes" | "photos"> & {
  vehicle: Pick<TransportRequestDraft["vehicle"], "category" | "condition" | "rolls">
}

// Date-only query serialization uses the existing P05 contract across the server/client boundary.
export type RequestDetailPayload = Omit<RequestDetail, "route" | "photos"> & {
  route: Omit<RequestDetail["route"], "date"> & { dateQuery: string }
}
