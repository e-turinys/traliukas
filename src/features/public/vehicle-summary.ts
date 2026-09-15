import { requestCategories, type VehicleDraft } from "./create-request/model"
import { formatCount } from "@/lib/format-count"

export function vehicleCountLabel(count: number) {
  return formatCount(count, { one: "automobilis", few: "automobiliai", other: "automobilių" })
}

export function vehiclePriceScope(count: number) {
  if (count === 1) return "1 automobilį"
  if (count === 10) return "10 automobilių"
  return `${count} automobilius`
}

export function vehicleTransportScope(count: number) {
  return `${count} ${count === 1 ? "automobilio" : "automobilių"} pervežimą`
}

export function vehicleName(vehicle: Pick<VehicleDraft, "make" | "model">) {
  return `${vehicle.make} ${vehicle.model}`.trim()
}

export function vehicleDisplayLine(vehicle: Pick<VehicleDraft, "category" | "make" | "model">) {
  const name = vehicleName(vehicle)
  return vehicle.category ? `${name} · ${requestCategories[vehicle.category]}` : name
}

export function compactVehicleSummary(vehicles: Pick<VehicleDraft, "category" | "make" | "model">[]) {
  if (vehicles.length === 1) return vehicleDisplayLine(vehicles[0])
  const names = vehicles.slice(0, 2).map(vehicleName).join(", ")
  const remaining = vehicles.length - 2
  return `${vehicleCountLabel(vehicles.length)} · ${names}${remaining > 0 ? ` +${remaining}` : ""}`
}
