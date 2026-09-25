import type { Database } from "@/lib/supabase/database.types"
import type { CarrierRoute } from "@/lib/types/carrier-route"
import type { CarrierProfile } from "@/lib/types/carrier-profile"
import type { LocationOption } from "@/lib/types/location"

type Views = Database["api"]["Views"]
export type PersistedRoute = CarrierRoute & {
  status: string; version: number; publishedAt: string | null; createdAt: string; updatedAt: string
}
export const isRouteId = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
export function carrierProjection(row: Views["public_carriers"]["Row"]): CarrierProfile {
  if (!row.id || !row.display_name) throw new Error("Incomplete Carrier projection")
  return { id: row.id, name: row.display_name, description: row.description ?? "",
    registrationCountry: row.registration_country ?? undefined, serviceCountries: row.service_countries ?? [],
    // Beta admission is NOT verification. No aggregate verification/reputation
    // policy or completed-Booking evidence exists in these phases.
    verification: "not_submitted", rating: null, reviewCount: 0, completedTransports: 0 }
}
export function locationProjection(row: Views["public_locations"]["Row"]): LocationOption {
  if (!row.id || !row.slug || !row.city || !row.country_name || !row.country_code) throw new Error("Incomplete public locality")
  return { id: row.slug, city: row.city, country: row.country_name, countryCode: row.country_code,
    label: `${row.city}, ${row.country_name}`, lat: row.latitude ?? undefined, lng: row.longitude ?? undefined }
}
export function routeProjection(row: Views["public_routes"]["Row"] | Views["my_routes"]["Row"],
  stops: Views["public_route_stops"]["Row"][], places: Views["public_locations"]["Row"][], carrier: CarrierProfile): PersistedRoute {
  if (!row.id || row.carrier_id !== carrier.id || !row.date_from || !row.date_to || row.capacity_total === null
    || row.capacity_reserved === null || !row.status || !row.created_at || !row.updated_at || row.route_version === null
    || row.route_flexible === null || row.supports_non_running === null || row.accepting_new_requests === null
    || !row.supported_categories?.length || row.supported_categories.some(c => !["car","suv","van","motorcycle"].includes(c))) throw new Error("Incomplete Route projection")
  const ordered = stops.filter(s => s.route_id === row.id).sort((a,b) => a.position! - b.position!)
  if (ordered.length < 2 || ordered.some((s,i) => s.position !== i)) throw new Error("Incomplete Route stops")
  const locations = ordered.map(s => {
    const place = places.find(p => p.id === s.location_id)
    if (!place) throw new Error("Missing Route locality")
    return locationProjection(place)
  })
  return { id: row.id, carrier, origin: locations[0], destination: locations.at(-1)!, stops: locations.slice(1,-1),
    dateFrom: row.date_from, dateTo: row.date_to, capacityTotal: row.capacity_total, capacityReserved: row.capacity_reserved,
    acceptingNewRequests: !["cancelled","expired"].includes(row.status) && row.accepting_new_requests,
    vehicleCategories: row.supported_categories as CarrierRoute["vehicleCategories"], supportsNonRunning: row.supports_non_running,
    routeFlexible: row.route_flexible, status: row.status, version: row.route_version,
    publishedAt: row.published_at, createdAt: row.created_at, updatedAt: row.updated_at }
}
