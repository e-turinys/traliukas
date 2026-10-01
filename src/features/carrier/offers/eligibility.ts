import type { PersistedRoute } from "@/features/public/route-persistence/adapter"
import type { VehicleDraft } from "@/features/public/create-request/model"
import { routeCanServeCompleteRequest } from "@/features/public/request-matching"

// UI preflight only. submit_offer rechecks current terms, identity and matching.
export function eligibleOfferRoutes(routes: PersistedRoute[], vehicles: VehicleDraft[], today: string, existingRouteId?: string) {
  return routes.filter(route => route.status === "published" && route.acceptingNewRequests
    && route.dateTo >= today && (!existingRouteId || route.id === existingRouteId)
    && vehicles.length <= 10 && routeCanServeCompleteRequest(route, vehicles))
}

export function offerDatesFitRoute(route: PersistedRoute, pickup: string, delivery: string) {
  return pickup >= route.dateFrom && delivery <= route.dateTo && delivery >= pickup
}
