import type { DateWindowValue } from "@/lib/types/date-window"
import type { LocationOption } from "@/lib/types/location"
import type { CarrierRoute, VehicleCategory } from "@/lib/types/carrier-route"

export const requestCategories = { car: "Lengvasis automobilis", suv: "SUV / Crossover", van: "Furgonas / mikroautobusas", motorcycle: "Motociklas" } as const satisfies Record<VehicleCategory, string>
export type RequestCategory = keyof typeof requestCategories
export type Step = 1 | 2 | 3 | 4
export type VehicleDraft = {
  id: string
  category: RequestCategory | ""
  make: string
  model: string
  year: string
  condition: "running" | "non-running" | ""
  rolls: "yes" | "no" | "unknown" | ""
  photos: File[]
  pickupLocation: LocationOption | null
  deliveryLocation: LocationOption | null
  usesDefaultRoute: boolean
}
export type TransportRequestDraft = {
  route: { from: LocationOption | null; to: LocationOption | null; date: DateWindowValue }
  privateDetails: { pickup: string; delivery: string }
  vehicles: VehicleDraft[]
  notes: string
  contact: { name: string; phone: string; email: string }
  visibility: "targeted" | "marketplace"
  target: { requested: boolean; route: CarrierRoute | null }
  termsAccepted: boolean
}
export type VehicleErrors = Partial<Record<"category" | "make" | "model" | "year" | "condition" | "rolls" | "photos" | "pickupLocation" | "deliveryLocation", string>>
export type Errors = Partial<Record<"from" | "to" | "date" | "name" | "phone" | "email" | "terms" | "target" | "vehicleCount", string>> & {
  vehicles?: Record<string, VehicleErrors>
}
