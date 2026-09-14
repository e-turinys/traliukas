import { createRequestDraft } from "@/features/public/create-request/logic"
import type { PublishedRequestInput } from "@/features/public/request-published/context"
import { mockCarrierRoutes } from "./carrier-routes"

// Explicit review fixtures only: no publication, verification or persistence is performed.
function reviewRequest(targeted: boolean, expanded = false): PublishedRequestInput {
  const route = mockCarrierRoutes[0]
  const params = new URLSearchParams({ from: route.origin.id, to: route.destination.id, dateType: "range", dateFrom: route.dateFrom, dateTo: route.dateTo })
  if (targeted) {
    params.set("visibility", expanded ? "marketplace" : "targeted")
    params.set("targetCarrier", route.carrier.id)
    params.set("targetRoute", route.id)
  }
  const draft = createRequestDraft(params)
  return {
    route: draft.route, visibility: draft.visibility, target: draft.target,
    vehicle: { ...draft.vehicle, category: "suv", make: "BMW", model: "X5", condition: "running" },
  }
}

export function findMockPublishedRequest(id: string): PublishedRequestInput | undefined {
  switch (id) {
    case "marketplace-demo-001": return reviewRequest(false)
    case "targeted-demo-001": return reviewRequest(true)
    case "targeted-marketplace-demo-001": return reviewRequest(true, true)
    default: return undefined
  }
}
