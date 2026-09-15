import type { CarrierRoute } from "@/lib/types/carrier-route"

type CapacityFields = Pick<CarrierRoute, "capacityTotal" | "capacityReserved">
type CompatibleRoute = Pick<CarrierRoute, "capacityTotal" | "capacityReserved" | "vehicleCategories" | "supportsNonRunning">
type CapacityVehicle = { category: string; condition: string }

function requirePositiveInteger(value: number, label: string) {
  if (!Number.isInteger(value) || value < 1) throw new RangeError(`${label} must be a positive integer`)
}

export function getAvailableCapacity(route: CapacityFields) {
  return Math.max(0, route.capacityTotal - route.capacityReserved)
}

export function canFitVehicleCount(route: CapacityFields, vehicleCount: number) {
  if (!Number.isInteger(vehicleCount) || vehicleCount < 1) return false
  return getAvailableCapacity(route) >= vehicleCount
}

export function canFitRequest(route: CompatibleRoute, vehicles: readonly CapacityVehicle[]) {
  if (!canFitVehicleCount(route, vehicles.length)) return false
  return vehicles.every(vehicle => route.vehicleCategories.includes(vehicle.category as CarrierRoute["vehicleCategories"][number]) &&
    (vehicle.condition !== "non-running" || route.supportsNonRunning))
}

export function reserveCapacity<T extends CapacityFields>(route: T, vehicleCount: number): T {
  requirePositiveInteger(vehicleCount, "vehicleCount")
  if (!canFitVehicleCount(route, vehicleCount)) throw new RangeError("Route does not have enough available capacity")
  return { ...route, capacityReserved: route.capacityReserved + vehicleCount }
}

export function releaseCapacity<T extends CapacityFields>(route: T, vehicleCount: number): T {
  requirePositiveInteger(vehicleCount, "vehicleCount")
  if (vehicleCount > route.capacityReserved) throw new RangeError("Cannot release more capacity than is reserved")
  return { ...route, capacityReserved: route.capacityReserved - vehicleCount }
}

export function setCapacityTotal<T extends CapacityFields>(route: T, capacityTotal: number): T {
  requirePositiveInteger(capacityTotal, "capacityTotal")
  if (capacityTotal < route.capacityReserved) throw new RangeError("Total capacity cannot be lower than reserved capacity")
  return { ...route, capacityTotal }
}
