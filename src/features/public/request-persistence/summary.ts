import type { Database } from "@/lib/supabase/database.types"
import type { LocationOption } from "@/lib/types/location"
import type { DateWindowValue } from "@/lib/types/date-window"
import type { VehicleDraft } from "../create-request/model"
import { requestCategories } from "../create-request/model"
import { parseCalendarDate } from "../search-query"
import { publishedRequestSummary } from "../request-published/context"

type Views = Database["api"]["Views"]
export type PersistedRequest = Views["my_requests"]["Row"]
export type PersistedVehicle = Views["my_request_vehicles"]["Row"]
export type PublicLocation = Views["public_locations"]["Row"]

/** Only safe display values leave the server, using the locked summary helpers. */
export function persistedRequestSummary(request: PersistedRequest, vehicles: PersistedVehicle[], places: PublicLocation[]) {
  const locations = new Map(places.map(p => [p.id, p]))
  function location(id: string | null): LocationOption {
    const p = locations.get(id)
    if (!p?.id || !p.city || !p.country_name || !p.country_code) throw new Error("Incomplete persisted locality")
    return { id: p.id, city: p.city, country: p.country_name, countryCode: p.country_code,
      label: `${p.city}, ${p.country_name}`, lat: p.latitude ?? 0, lng: p.longitude ?? 0 }
  }
  if (!request.id || !request.published_at || request.status === "draft" || request.visibility !== "marketplace") throw new Error("Invalid published request")
  let date: DateWindowValue
  if (request.pickup_kind === "anytime") date = { type: "anytime" }
  else if (request.pickup_kind === "single") {
    const value = parseCalendarDate(request.pickup_from)
    if (!value) throw new Error("Invalid stored date")
    date = { type: "single", date: value }
  } else if (request.pickup_kind === "flexible") {
    const option = request.pickup_flexible_option
    if (option !== "next-week" && option !== "next-two-weeks" && option !== "this-month") throw new Error("Invalid stored flexible window")
    date = { type: "flexible", option }
  } else if (request.pickup_kind === "range") {
    const from = parseCalendarDate(request.pickup_from); const to = parseCalendarDate(request.pickup_to)
    if (!from || !to) throw new Error("Invalid stored range")
    date = { type: "range", from, to }
  } else throw new Error("Invalid stored pickup window")
  const drafts: VehicleDraft[] = [...vehicles].sort((a, b) => (a.position ?? 0) - (b.position ?? 0)).map(v => {
    if (!v.id || !v.category || !Object.hasOwn(requestCategories, v.category) || !v.make || !v.model
      || !["running", "non_running"].includes(v.condition ?? "")) throw new Error("Incomplete persisted vehicle")
    return {
      id: v.id, category: v.category as VehicleDraft["category"], make: v.make, model: v.model,
      year: v.year?.toString() ?? "", condition: v.condition === "non_running" ? "non-running" : "running",
      rolls: (v.rolling_ability ?? "") as VehicleDraft["rolls"], photos: [], usesDefaultRoute: v.uses_default_route ?? false,
      pickupLocation: location(v.pickup_location_id), deliveryLocation: location(v.delivery_location_id),
    }
  })
  return publishedRequestSummary({ route: { from: location(request.default_pickup_location_id), to: location(request.default_delivery_location_id), date },
    vehicles: drafts, visibility: "marketplace", target: { requested: false, route: null } })
}
