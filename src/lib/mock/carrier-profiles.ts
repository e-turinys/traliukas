import { mockCarrierRoutes } from "./carrier-routes"
import type { CarrierProfile } from "../types/carrier-profile"

const descriptions: Record<string, string> = {
  "baltijos-kelias": "Vežame lengvuosius automobilius ir visureigius iš Vokietijos į Lietuvą. Paėmimo ir pristatymo sąlygas aptariame prieš pervežimą.",
  "siaures-autovezis": "Pervežame lengvuosius automobilius, visureigius ir mikroautobusus iš Vokietijos į Lietuvą.",
  "manto-transportas": "Vežame lengvuosius automobilius ir motociklus iš Vokietijos į Lietuvą. Dėl nevažiuojančio automobilio pakrovimo susitariame iš anksto.",
  "nemuno-logistika": "Pervežame automobilius iš Vokietijos į Lietuvą per Lenkiją. Galime vežti ir nevažiuojančius automobilius.",
  "vakaru-kryptis": "Vežame lengvuosius automobilius ir visureigius iš Nyderlandų per Vokietiją į Lietuvą.",
  "pajurio-pervezimai": "Pervežame lengvuosius automobilius ir mikroautobusus iš Vokietijos į Lietuvą.",
}

// Reuse existing identity/reputation values; do not alter P02/P03 route fixtures.
export const mockCarrierProfiles: CarrierProfile[] = Array.from(
  new Map(mockCarrierRoutes.map(({ carrier }) => [carrier.id, carrier])).values(),
  (carrier) => ({
    ...carrier,
    description: descriptions[carrier.id],
    serviceCountries: Array.from(new Set(mockCarrierRoutes
      .filter((route) => route.carrier.id === carrier.id)
      .flatMap((route) => [route.origin, ...route.stops, route.destination].map((stop) => stop.country)))),
  }),
)

// A profile may exist before a carrier publishes any routes. No fabricated supply.
mockCarrierProfiles.push({
  id: "aukstaitijos-transportas", name: "Aukštaitijos transportas",
  verification: "not_submitted", rating: null, reviewCount: 0, completedTransports: 0,
  description: "Planuojame teikti lengvųjų automobilių pervežimo paslaugas Lietuvoje.",
  registrationCountry: "Lithuania", serviceCountries: ["Lithuania"],
})

export function findMockCarrierProfile(id: string) {
  return mockCarrierProfiles.find((carrier) => carrier.id === id)
}
