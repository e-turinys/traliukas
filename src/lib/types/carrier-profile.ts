import type { CarrierRoute } from "./carrier-route"

// Public profile fields extend the same carrier identity used by route cards.
export type CarrierProfile = CarrierRoute["carrier"] & {
  description: string
  registrationCountry?: string
  serviceCountries?: string[]
}
