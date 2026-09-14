import type { DateWindowValue } from "@/lib/types/date-window"
import type { LocationOption } from "@/lib/types/location"
import type { CarrierRoute } from "@/lib/types/carrier-route"

export const requestCategories = { car: "Lengvasis automobilis", suv: "SUV / Crossover", van: "Van / LCV", other: "Kita" } as const
export type RequestCategory = keyof typeof requestCategories
export type Step = 1 | 2 | 3 | 4
export type TransportRequestDraft = {
  route: { from: LocationOption | null; to: LocationOption | null; date: DateWindowValue }
  privateDetails: { pickup: string; delivery: string }
  vehicle: { category: RequestCategory | ""; make: string; model: string; year: string; condition: "running" | "non-running" | ""; rolls: "yes" | "no" | "unknown" | "" }
  photos: File[]
  notes: string
  contact: { name: string; phone: string; email: string }
  visibility: "targeted" | "marketplace"
  target: { requested: boolean; route: CarrierRoute | null }
  termsAccepted: boolean
}
export type Errors = Partial<Record<"from" | "to" | "date" | "category" | "make" | "model" | "year" | "condition" | "rolls" | "name" | "phone" | "email" | "terms" | "target", string>>
