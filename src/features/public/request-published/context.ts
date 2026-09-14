import { requestCategories, type TransportRequestDraft } from "../create-request/model"
import { dateLabel } from "../search-query"

// Public confirmation projection. Addresses, contacts, photos and notes never cross this boundary.
export type PublishedRequestInput = Pick<TransportRequestDraft, "route" | "vehicle" | "visibility" | "target">

export function publishedRequestSummary(request: PublishedRequestInput) {
  const { route, vehicle, target, visibility } = request
  if (!route.from || !route.to || !vehicle.category) throw new Error("Incomplete request summary")
  const carrierName = target.requested ? target.route?.carrier.name ?? null : null
  if (visibility === "targeted" && !carrierName) throw new Error("Targeted request requires a carrier")
  return {
    route: `${route.from.city} → ${route.to.city}`,
    vehicle: `${vehicle.make} ${vehicle.model} · ${requestCategories[vehicle.category]}`,
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
