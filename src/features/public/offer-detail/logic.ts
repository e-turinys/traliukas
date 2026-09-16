import { calendarDate } from "../search-query"
import { visibleOfferStatus } from "../request-detail/logic"
import type { OfferRevision, RequestDetail, RequestOffer } from "../request-detail/model"
import { formatDateRange } from "@/lib/format-date"

export const customerOfferStatusLabels: Record<RequestOffer["status"], string> = {
  pending: "Laukia jūsų sprendimo",
  accepted: "Pasirinktas",
  declined: "Atmestas",
  expired: "Pasiūlymas nebegalioja",
  unavailable: "Pasiūlymas nebegalioja",
  not_selected: "Nepasirinktas",
  withdrawn: "Atšauktas vežėjo",
}

export function offerDetailStatus(request: RequestDetail, offer: RequestOffer, now: string) {
  return visibleOfferStatus(request, offer, now)
}

export function isOfferActionable(status: RequestOffer["status"]) {
  return status === "pending"
}

export function latestOfferTerms(offer: RequestOffer) {
  return {
    totalPriceEur: offer.totalPriceEur,
    pickupDate: offer.pickupDate,
    deliveryDate: offer.deliveryDate,
    paymentTerms: offer.paymentTerms,
  }
}

export function offerRevisionHistory(offer: RequestOffer): OfferRevision[] {
  return [...offer.revisions].sort((left, right) => {
    if (!left.revisedAt) return 1
    if (!right.revisedAt) return -1
    return Date.parse(right.revisedAt) - Date.parse(left.revisedAt)
  })
}

export function offeredPickupDiffers(request: RequestDetail, offer: RequestOffer) {
  const requested = request.route.date
  if (requested.type === "single") return !!requested.date && calendarDate(requested.date) !== offer.pickupDate
  if (requested.type === "range" && requested.from && requested.to) {
    return offer.pickupDate < calendarDate(requested.from) || offer.pickupDate > calendarDate(requested.to)
  }
  return false
}

export function offerReadOnlyCopy(request: RequestDetail, offer: RequestOffer, now: string) {
  const status = offerDetailStatus(request, offer, now)
  if (status === "expired") return "Šio pasiūlymo galiojimo laikas baigėsi."
  if (status === "not_selected") return "Pasirinkote kitą vežėją."
  if (status === "declined") return "Šį pasiūlymą atmetėte."
  if (status === "accepted") return "Pasiūlymas pasirinktas."
  if (status === "withdrawn") return "Vežėjas atšaukė šį pasiūlymą."
  if (status === "unavailable" && offer.requestVersion !== request.requestVersion) {
    return "Šis pasiūlymas nebegalioja, nes užklausos duomenys pasikeitė."
  }
  if (status === "unavailable" && request.status === "closed") return "Šis pasiūlymas nebegalioja, nes užklausa uždaryta."
  if (status === "unavailable") return "Šis pasiūlymas nebegalioja."
}

export function applyMockOfferDecision(request: RequestDetail, offer: RequestOffer, decision: "accept" | "decline", now: string) {
  if (!isOfferActionable(offerDetailStatus(request, offer, now))) throw new Error("Only pending offers can be changed")
  return { ...offer, status: decision === "accept" ? "accepted" as const : "declined" as const }
}

export function formatOfferTimestamp(value: string) {
  const timestamp = new Date(value)
  const dateParts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Vilnius", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(timestamp)
  const part = (type: Intl.DateTimeFormatPartTypes) => dateParts.find(item => item.type === type)?.value ?? ""
  const date = `${part("year")}-${part("month")}-${part("day")}`
  const time = new Intl.DateTimeFormat("lt-LT", {
    timeZone: "Europe/Vilnius", hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).format(timestamp)
  return `${formatDateRange(date)} ${time}`
}
