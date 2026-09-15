import { createRequestDraft } from "@/features/public/create-request/logic"
import type { PublishedRequestInput } from "@/features/public/request-published/context"
import { mockCarrierRoutes } from "./carrier-routes"
import { mockLocations } from "./locations"

// Explicit review fixtures only: no publication, verification or persistence is performed.
function reviewRequest(targeted: boolean, expanded = false, variant: "single" | "multiple" | "pickups" | "mixed" = "single"): PublishedRequestInput {
  const route = mockCarrierRoutes[0]
  const params = new URLSearchParams({ from: route.origin.id, to: route.destination.id, dateType: "range", dateFrom: route.dateFrom, dateTo: route.dateTo })
  if (targeted) {
    params.set("visibility", expanded ? "marketplace" : "targeted")
    params.set("targetCarrier", route.carrier.id)
    params.set("targetRoute", route.id)
  }
  const draft = createRequestDraft(params)
  const first = { ...draft.vehicles[0], category: "suv" as const, make: "BMW", model: "X5", year: "2020", condition: "running" as const }
  const secondPickup = variant === "pickups" || variant === "mixed" ? mockLocations.find(location => location.id === "berlin-de")! : first.pickupLocation
  const secondDelivery = variant === "mixed" ? mockLocations.find(location => location.id === "vilnius-lt")! : first.deliveryLocation
  const second = { ...first, id: "vehicle-2", make: "Audi", model: "Q5", year: "2021", pickupLocation: secondPickup, deliveryLocation: secondDelivery, usesDefaultRoute: variant === "multiple" }
  return {
    route: draft.route, visibility: draft.visibility, target: draft.target,
    vehicles: variant === "single" ? [first] : [first, second],
  }
}

export function findMockPublishedRequest(id: string): PublishedRequestInput | undefined {
  switch (id) {
    case "marketplace-demo-001": return reviewRequest(false)
    case "targeted-demo-001": return reviewRequest(true)
    case "targeted-marketplace-demo-001": return reviewRequest(true, true)
    case "multi-vehicle-demo-001": return reviewRequest(false, false, "multiple")
    case "multi-location-pickups-demo-001": return reviewRequest(false, false, "pickups")
    case "multi-location-mixed-demo-001": return reviewRequest(false, false, "mixed")
    default: return undefined
  }
}
