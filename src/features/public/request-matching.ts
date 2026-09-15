import { canFitRequest } from "@/lib/route-capacity"
import type { CarrierRoute } from "@/lib/types/carrier-route"
import type { VehicleDraft } from "./create-request/model"

export function routeServesVehicleLocations(route: CarrierRoute, vehicles: readonly Pick<VehicleDraft, "pickupLocation" | "deliveryLocation">[]) {
  const stops = [route.origin, ...route.stops, route.destination]
  return vehicles.length > 0 && vehicles.every(vehicle => {
    if (!vehicle.pickupLocation || !vehicle.deliveryLocation) return false
    const pickup = stops.findIndex(stop => stop.id === vehicle.pickupLocation?.id)
    const delivery = stops.findIndex(stop => stop.id === vehicle.deliveryLocation?.id)
    return pickup >= 0 && delivery > pickup
  })
}

export function routeCanServeCompleteRequest(route: CarrierRoute, vehicles: readonly VehicleDraft[]) {
  return canFitRequest(route, vehicles) && routeServesVehicleLocations(route, vehicles)
}
