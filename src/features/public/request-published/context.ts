import type { TransportRequestDraft } from "../create-request/model"
import { dateLabel } from "../search-query"
import { compactVehicleSummary, vehicleDisplayLine } from "../vehicle-summary"
import { requestRouteSummary, vehicleRouteLabel } from "../request-route-summary"

// Public confirmation projection. Addresses, contacts, photos and notes never cross this boundary.
export type PublishedRequestInput = Pick<TransportRequestDraft, "route" | "vehicles" | "visibility" | "target">

export function publishedRequestSummary(request: PublishedRequestInput) {
  const { route, vehicles, target, visibility } = request
  if (!route.from || !route.to || vehicles.length < 1 || vehicles.some(vehicle => !vehicle.category || !vehicle.pickupLocation || !vehicle.deliveryLocation)) throw new Error("Incomplete request summary")
  const carrierName = target.requested ? target.route?.carrier.name ?? null : null
  if (visibility === "targeted" && !carrierName) throw new Error("Targeted request requires a carrier")
  const routeSummary = requestRouteSummary(vehicles)
  return {
    route: routeSummary.compact,
    routeDetailed: routeSummary.detailed,
    locationCount: routeSummary.locationCount,
    vehicleCount: vehicles.length,
    vehicleSummary: compactVehicleSummary(vehicles),
    vehicleLines: vehicles.map(vehicle => `${vehicleDisplayLine(vehicle)} · ${vehicleRouteLabel(vehicle)}`),
    date: dateLabel(route.date),
    carrierName,
    visibility,
  }
}

export type PublishedRequestSummary = ReturnType<typeof publishedRequestSummary>

export function publicationCopy(summary: PublishedRequestSummary) {
  const targeted = summary.visibility === "targeted"
  return {
    heading: targeted ? `Užklausa išsiųsta vežėjui „${summary.carrierName}“` : "Užklausa paskelbta",
    audience: targeted ? `Tik ${summary.carrierName}` : summary.carrierName ? `${summary.carrierName} ir kiti tinkami vežėjai` : "Tinkami vežėjai",
    next: targeted ? "Vežėjas galės peržiūrėti jūsų užklausą ir pateikti pasiūlymą." : "Vežėjai, kuriems tinka jūsų maršrutas, galės pateikti pasiūlymus.",
  }
}
