import { findMockPublishedRequest } from "./published-requests"
import { mockCarrierRoutes } from "./carrier-routes"
import type { RequestDetail, RequestOffer } from "@/features/public/request-detail/model"

// Fixed review clock keeps pending/expired demos reproducible; never a live eligibility clock.
export const requestReviewNow = "2026-09-14T09:00:00Z"

function offers(requestId: string): RequestOffer[] {
  return mockCarrierRoutes.slice(0, 2).map((route, index) => ({
    id: `${requestId}-offer-${index + 1}`, requestId, routeId: route.id, carrier: { ...route.carrier },
    status: "pending", totalPriceEur: index === 0 ? 590 : 640,
    pickupDate: route.dateFrom, deliveryDate: route.dateTo, expiresAt: "2026-09-14T18:00:00Z",
    paymentTerms: index === 0 ? "Apmokėjimas pristatymo metu" : "50 % paėmimo metu, 50 % pristatymo metu",
    carrierComment: index === 0 ? "Automobilį paimsime sutartu laiku ir pristatysime tiesiai į Kauną." : undefined,
    revisions: [],
    requestVersion: 1, routeVersion: 1, offerVersion: 1,
  }))
}

export function findMockRequestDetail(id: string): RequestDetail | undefined {
  const published = findMockPublishedRequest(id)
  const extra = ["updated-offer-demo-001", "booked-demo-001", "closed-demo-001", "completed-demo-001", "historical-offers-demo-001", "draft-demo-001", "non-running-demo-001", "request-changed-demo-001"]
  if (!published && !extra.includes(id)) return undefined
  const base = published ?? findMockPublishedRequest("marketplace-demo-001")!
  const request: RequestDetail = {
    ...base, id, status: "active", requestVersion: 1, photos: [],
    vehicle: { ...base.vehicle, year: "2020" },
    notes: "Raktai vietoje. Automobilį galima paimti darbo dienomis.",
    offers: base.visibility === "targeted" ? [] : offers(id),
  }
  if (id === "updated-offer-demo-001") {
    request.offers[0] = {
      ...request.offers[0], totalPriceEur: 570, offerVersion: 2,
      revisions: [{
        totalPriceEur: 590, pickupDate: request.offers[0].pickupDate,
        deliveryDate: request.offers[0].deliveryDate,
        paymentTerms: request.offers[0].paymentTerms,
        revisedAt: "2026-09-14T07:30:00Z",
      }],
    }
  }
  if (id === "draft-demo-001") { request.status = "draft"; request.offers = [] }
  if (id === "non-running-demo-001") {
    request.vehicle = { ...request.vehicle, condition: "non-running", rolls: "yes" }
    request.offers = request.offers.slice(0, 1)
  }
  if (id === "request-changed-demo-001") request.requestVersion = 2
  if (id === "booked-demo-001" || id === "completed-demo-001") {
    request.status = id === "booked-demo-001" ? "booked" : "completed"
    request.bookingId = "transport-demo-001"
    request.offers = request.offers.map((offer, index) => ({ ...offer, status: index === 0 ? "accepted" : "not_selected" }))
  }
  if (id === "closed-demo-001") {
    request.status = "closed"
    request.offers = request.offers.map(offer => ({ ...offer, status: "unavailable" }))
  }
  if (id === "historical-offers-demo-001") {
    request.offers[0].expiresAt = "2026-09-13T18:00:00Z"
    request.offers[1].status = "declined"
  }
  return request
}
