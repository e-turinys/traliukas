import type { Database, Json } from "@/lib/supabase/database.types"
import type { RequestDetail, RequestOffer } from "../request-detail/model"
import type { Booking } from "@/lib/types/booking"
import type { VehicleDraft } from "../create-request/model"
import type { DateWindowValue } from "@/lib/types/date-window"
import { parseCalendarDate } from "../search-query"
import { locationProjection } from "../route-persistence/adapter"

type Views = Database["api"]["Views"]
export function object(value: Json | undefined): Record<string, Json | undefined> {
  if (!value || Array.isArray(value) || typeof value !== "object") throw new Error("Invalid persisted agreement")
  return value
}
export function string(value: Json | undefined): string {
  if (typeof value !== "string") throw new Error("Invalid persisted text")
  return value
}
export function array(value: Json | undefined): Json[] {
  if (!Array.isArray(value)) throw new Error("Invalid persisted collection")
  return value
}
export function pickupWindow(kind: string | null, from: string | null, to: string | null): DateWindowValue {
  if (kind === "anytime") return { type: "anytime" }
  const start = parseCalendarDate(from), end = parseCalendarDate(to)
  if (!start || !end) throw new Error("Invalid persisted date window")
  // Persisted flexible windows have a fixed publication anchor; never recalculate from today.
  return kind === "single" ? { type: "single", date: start } : { type: "range", from: start, to: end }
}
export function safeCarrier(id: string, name: string) {
  return { id, name, verification: "not_submitted" as const, rating: null, reviewCount: 0, completedTransports: 0 }
}
function vehicle(row: Record<string, Json | undefined>, places: Views["public_locations"]["Row"][]): VehicleDraft {
  const category = string(row.category), condition = string(row.condition)
  if (!["car","suv","van","motorcycle"].includes(category) || !["running","non_running"].includes(condition)) throw new Error("Invalid vehicle")
  const place = (id: Json | undefined) => {
    const value = places.find(p => p.id === id)
    if (!value) throw new Error("Missing public locality")
    return locationProjection(value)
  }
  return { id: string(row.id), category: category as VehicleDraft["category"], make: string(row.make), model: string(row.model),
    year: row.year == null ? "" : String(row.year), condition: condition === "running" ? "running" : "non-running",
    rolls: (row.rolling_ability ?? "") as VehicleDraft["rolls"], photos: [], usesDefaultRoute: false,
    pickupLocation: place(row.pickup_location_id), deliveryLocation: place(row.delivery_location_id) }
}
export function requestProjection(row: Views["my_requests"]["Row"], vehicles: Views["request_vehicles"]["Row"][], places: Views["public_locations"]["Row"][], offers: RequestOffer[] = [], bookingId?: string): RequestDetail {
  const parsed = vehicles.map(v => vehicle(v, places))
  const from = places.find(p => p.id === row.default_pickup_location_id), to = places.find(p => p.id === row.default_delivery_location_id)
  if (!row.id || !row.status || !row.request_version || !from || !to || !parsed.length) throw new Error("Incomplete persisted Request")
  return { id: row.id, status: row.status as RequestDetail["status"], requestVersion: row.request_version, bookingId, offers,
    route: { from: locationProjection(from), to: locationProjection(to), date: pickupWindow(row.pickup_kind,row.pickup_from,row.pickup_to) },
    vehicles: parsed, notes: row.notes ?? "", visibility: "marketplace", target: { requested: false, route: null } }
}
export function historicalRequest(id: string, version: number, snapshot: Json, places: Views["public_locations"]["Row"][], offers: RequestOffer[], bookingId?: string): RequestDetail {
  const data = object(snapshot), pickup = object(data.pickup)
  const vehicles = array(data.vehicles).map(v => vehicle(object(v),places))
  if (!vehicles.length) throw new Error("Missing historical vehicles")
  return { id, requestVersion: version, status: bookingId ? "booked" : "active", bookingId, offers, notes: "",
    route: { from: vehicles[0].pickupLocation, to: vehicles[0].deliveryLocation,
      date: pickupWindow(string(pickup.kind),pickup.from as string | null,pickup.to as string | null) },
    vehicles, visibility: "marketplace", target: { requested: false, route: null } }
}
export function offerProjection(row: Views["offers"]["Row"], revisions: Views["offer_revisions"]["Row"][], carrier: Views["commercial_carriers"]["Row"]): RequestOffer {
  const terms = revisions.find(t => t.offer_id === row.id && t.version === row.current_version)
  if (!row.id || !row.request_id || !row.route_id || !row.status || !terms || !carrier.id || !carrier.display_name) throw new Error("Incomplete Offer")
  return { id: row.id, requestId: row.request_id, routeId: row.route_id, carrier: safeCarrier(carrier.id,carrier.display_name),
    status: row.status as RequestOffer["status"], totalPriceEur: terms.total_price!, pickupDate: terms.planned_pickup_date!, deliveryDate: terms.planned_delivery_date!,
    expiresAt: terms.expires_at!, paymentTerms: terms.payment_terms!, carrierComment: terms.carrier_comment ?? undefined,
    requestVersion: terms.request_version!, routeVersion: terms.route_version!, offerVersion: row.current_version!,
    revisions: revisions.filter(t => t.offer_id === row.id).sort((a,b) => a.version!-b.version!).map(t => ({ totalPriceEur: t.total_price!, pickupDate: t.planned_pickup_date!, deliveryDate: t.planned_delivery_date!, paymentTerms: t.payment_terms!, revisedAt: t.created_at! })) }
}
export function bookingProjection(row: Views["bookings"]["Row"]): Booking {
  const s = object(row.agreement_snapshot), carrier = object(s.carrier), request = object(s.request), pickup = object(request.pickup)
  const vehicles = array(s.vehicles).map(value => {
    const v = object(value), from = object(v.pickup_location), to = object(v.delivery_location)
    const places = [from,to].map(p => ({ ...p, region: null, time_zone: null })) as Views["public_locations"]["Row"][]
    const { photos: _photos, usesDefaultRoute: _default, ...result } = vehicle({ ...v, pickup_location_id: from.id, delivery_location_id: to.id },places)
    void _photos; void _default
    return result
  })
  if (!row.id || row.status !== "booked" || row.snapshot_schema_version !== 1) throw new Error("Unsupported persisted Booking")
  return { id: row.id, requestId: row.request_id!, acceptedOfferId: row.accepted_offer_id!, acceptedOfferVersion: row.accepted_offer_version!,
    carrierId: string(carrier.id), carrier: safeCarrier(string(carrier.id),string(carrier.display_name)), conversationId: row.conversation_id!, vehicles,
    agreedTotalPrice: row.agreed_total_price!, currency: "EUR", paymentTerms: row.payment_terms!, plannedPickup: row.planned_pickup_date!, plannedDelivery: row.planned_delivery_date!,
    requestedPickupWindow: pickupWindow(string(pickup.kind),pickup.from as string | null,pickup.to as string | null), status: "booked", createdAt: row.created_at! }
}
