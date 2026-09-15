import type { LocationOption } from "./location"

export type MatchLevel = "excellent" | "good" | "possible"
export type VehicleCategory = "car" | "suv" | "van" | "motorcycle"

export const vehicleCategoryLabels: Record<VehicleCategory, string> = {
  car: "Lengvasis automobilis",
  suv: "Visureigis",
  van: "Mikroautobusas",
  motorcycle: "Motociklas",
}

export type CarrierRoute = {
  id: string
  carrier: {
    id: string
    name: string
    verification: "approved" | "pending" | "not_submitted"
    rating: number | null
    reviewCount: number
    completedTransports: number
  }
  origin: LocationOption
  destination: LocationOption
  stops: LocationOption[]
  dateFrom: string
  dateTo: string
  capacityTotal: number
  capacityReserved: number
  acceptingNewRequests: boolean
  vehicleCategories: VehicleCategory[]
  supportsNonRunning: boolean
}

export type RouteMatch = { route: CarrierRoute; level: MatchLevel }
