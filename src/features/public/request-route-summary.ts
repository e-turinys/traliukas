import { formatCount } from "@/lib/format-count"
import type { LocationOption } from "@/lib/types/location"

type VehicleRoute = { pickupLocation: LocationOption | null; deliveryLocation: LocationOption | null }

const locationKey = (location: LocationOption) => location.id || `${location.city}-${location.countryCode}`
const uniqueLocations = (locations: LocationOption[]) => [...new Map(locations.map(location => [locationKey(location), location])).values()]

export function vehicleRouteLabel(vehicle: VehicleRoute) {
  if (!vehicle.pickupLocation || !vehicle.deliveryLocation) return "Maršrutas nenurodytas"
  return `${vehicle.pickupLocation.city} → ${vehicle.deliveryLocation.city}`
}

export function requestRouteSummary(vehicles: readonly VehicleRoute[]) {
  const complete = vehicles.filter((vehicle): vehicle is { pickupLocation: LocationOption; deliveryLocation: LocationOption } =>
    !!vehicle.pickupLocation && !!vehicle.deliveryLocation)
  if (complete.length !== vehicles.length || complete.length === 0) {
    return { compact: "Maršrutas nenurodytas", detailed: "Maršrutas nenurodytas", locationCount: 0 }
  }
  const pickups = uniqueLocations(complete.map(vehicle => vehicle.pickupLocation))
  const deliveries = uniqueLocations(complete.map(vehicle => vehicle.deliveryLocation))
  const locationCount = uniqueLocations([...pickups, ...deliveries]).length
  if (pickups.length === 1 && deliveries.length === 1) {
    const route = `${pickups[0].city} → ${deliveries[0].city}`
    return { compact: route, detailed: route, locationCount }
  }
  if (deliveries.length === 1) {
    return {
      compact: `${formatCount(pickups.length, { one: "paėmimo vieta", few: "paėmimo vietos", other: "paėmimo vietų" })} → ${deliveries[0].city}`,
      detailed: `${pickups.map(location => location.city).join(", ")} → ${deliveries[0].city}`,
      locationCount,
    }
  }
  if (pickups.length === 1) {
    return {
      compact: `${pickups[0].city} → ${formatCount(deliveries.length, { one: "pristatymo vieta", few: "pristatymo vietos", other: "pristatymo vietų" })}`,
      detailed: `${pickups[0].city} → ${deliveries.map(location => location.city).join(", ")}`,
      locationCount,
    }
  }
  return { compact: "Kelių vietų pervežimas", detailed: "Kelių vietų pervežimas", locationCount }
}

export function transportLocationLabel(count: number) {
  return formatCount(count, { one: "transporto vieta", few: "transporto vietos", other: "transporto vietų" })
}
