import type { CarrierRoute } from "@/lib/types/carrier-route"
import { mockCarrierReviews } from "@/lib/mock/carrier-reviews"
import { routeAvailability } from "./route-detail-context"

export function activeCarrierRoutes(routes: CarrierRoute[], carrierId: string, today: string) {
  return routes.filter((route) => route.carrier.id === carrierId && routeAvailability(route, today).available)
    .sort((a, b) => a.dateFrom.localeCompare(b.dateFrom) || a.id.localeCompare(b.id))
}

export function completedCarrierReviews(carrierId: string, reviews = mockCarrierReviews) {
  return reviews.filter((review) => review.carrierId === carrierId && review.bookingStatus === "completed")
    .sort((a, b) => b.completedOn.localeCompare(a.completedOn) || a.id.localeCompare(b.id))
}
