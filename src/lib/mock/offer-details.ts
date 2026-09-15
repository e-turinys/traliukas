import { findMockRequestDetail } from "./request-details"
import type { RequestDetail, RequestOffer } from "@/features/public/request-detail/model"

export type MockOfferDetail = { request: RequestDetail; offer: RequestOffer }

const requestIds = [
  "marketplace-demo-001",
  "updated-offer-demo-001",
  "historical-offers-demo-001",
  "closed-demo-001",
  "booked-demo-001",
  "request-changed-demo-001",
  "multi-vehicle-demo-001",
  "multi-location-pickups-demo-001",
  "multi-location-mixed-demo-001",
] as const

export function findMockOfferDetail(id: string): MockOfferDetail | undefined {
  for (const requestId of requestIds) {
    const request = findMockRequestDetail(requestId)
    const offer = request?.offers.find(candidate => candidate.id === id)
    if (request && offer) return { request, offer }
  }
}
