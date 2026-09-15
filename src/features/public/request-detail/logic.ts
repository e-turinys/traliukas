import { createRequestDraft, photoSelectionError, validateStep } from "../create-request/logic"
import { readDate, writeDate } from "../search-query"
import type { RequestDetail, RequestDetailPayload, RequestEdit, RequestOffer } from "./model"

function dateQuery(date: RequestDetail["route"]["date"]) {
  const params = new URLSearchParams()
  writeDate(params, date)
  return params.toString()
}

export function serializeRequestDetail(request: RequestDetail): RequestDetailPayload {
  const { route, photos: _photos, ...rest } = request
  void _photos // Local File objects never cross the server/client boundary.
  return { ...rest, route: { from: route.from, to: route.to, dateQuery: dateQuery(route.date) } }
}

export function hydrateRequestDetail(payload: RequestDetailPayload): RequestDetail {
  const { dateQuery: query, ...places } = payload.route
  return { ...payload, route: { ...places, date: readDate(new URLSearchParams(query)).value }, photos: [] }
}

export function requestActions(request: RequestDetail) {
  return { edit: request.status === "active", close: request.status === "active", repeat: request.status === "closed", booking: request.status === "booked" && !!request.bookingId }
}

export function requestOfferGroups(request: RequestDetail) {
  if (request.status !== "booked" && request.status !== "completed") {
    return { selected: undefined, current: request.offers, historical: [] }
  }
  const selected = request.offers.find(offer => offer.status === "accepted")
  return { selected, current: [], historical: request.offers.filter(offer => offer !== selected) }
}

export function isMaterialEdit(request: RequestDetail, edit: RequestEdit) {
  return request.route.from?.id !== edit.route.from?.id || request.route.to?.id !== edit.route.to?.id ||
    dateQuery(request.route.date) !== dateQuery(edit.route.date) || request.vehicle.category !== edit.vehicle.category ||
    request.vehicle.condition !== edit.vehicle.condition ||
    (edit.vehicle.condition === "non-running" && request.vehicle.rolls !== edit.vehicle.rolls)
}

export function validateRequestEdit(request: RequestDetail, edit: RequestEdit, today: string) {
  const draft = { ...createRequestDraft(new URLSearchParams()), route: edit.route, vehicle: { ...request.vehicle, ...edit.vehicle } }
  return { ...validateStep(draft, 1, today), ...validateStep(draft, 2, today) }
}

const invalidatePending = (offers: RequestOffer[]) => offers.map(offer => offer.status === "pending" ? { ...offer, status: "unavailable" as const } : offer)

export function applyRequestEdit(request: RequestDetail, edit: RequestEdit, confirmed: boolean, today: string): RequestDetail {
  if (!requestActions(request).edit) throw new Error("Request is read-only")
  if (Object.keys(validateRequestEdit(request, edit, today)).length || photoSelectionError(edit.photos, 0)) throw new Error("Invalid request edit")
  const material = isMaterialEdit(request, edit)
  if (material && !confirmed) throw new Error("Material edit requires confirmation")
  return { ...request, route: edit.route, notes: edit.notes, photos: edit.photos, vehicle: { ...request.vehicle, ...edit.vehicle },
    requestVersion: request.requestVersion + (material ? 1 : 0), offers: material ? invalidatePending(request.offers) : request.offers }
}

export function closeRequest(request: RequestDetail, confirmed: boolean): RequestDetail {
  if (!requestActions(request).close || !confirmed) throw new Error("Closing requires an active request and confirmation")
  return { ...request, status: "closed", offers: invalidatePending(request.offers) }
}

export function repeatRequest(request: RequestDetail): RequestDetail {
  if (!requestActions(request).repeat) throw new Error("Only closed requests can be repeated")
  return { ...request, id: `${request.id}-repeat`, status: "draft", requestVersion: 1, offers: [], bookingId: undefined }
}

export function expandRequestVisibility(request: RequestDetail): RequestDetail {
  if (request.status !== "active" || request.visibility !== "targeted") return request
  return { ...request, visibility: "marketplace" }
}

export function visibleOfferStatus(request: RequestDetail, offer: RequestOffer, now: string): RequestOffer["status"] {
  if (offer.status !== "pending") return offer.status
  if (request.status !== "active" || offer.requestVersion !== request.requestVersion || offer.requestId !== request.id) return "unavailable"
  if (!Number.isFinite(Date.parse(offer.expiresAt)) || !Number.isFinite(Date.parse(now))) return "unavailable"
  if (Date.parse(offer.expiresAt) <= Date.parse(now)) return "expired"
  return "pending"
}

export function repeatRequestHref(request: RequestDetail) {
  const params = new URLSearchParams({ from: request.route.from?.id ?? "", to: request.route.to?.id ?? "" })
  writeDate(params, request.route.date)
  // P05 accepts location/date prefill only; no new vehicle query convention or targeting.
  return `/request/new?${params}`
}

export function formatOfferExpiry(value: string) {
  return new Intl.DateTimeFormat("lt-LT", { timeZone: "Europe/Vilnius", year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(value))
}
