import { mockLocations } from "./locations"
import type { CarrierRoute } from "../types/carrier-route"

function location(id: string) {
  const value = mockLocations.find((item) => item.id === id)
  if (!value) throw new Error(`Unknown mock location: ${id}`)
  return value
}

// Fictional carriers and fixed review fixtures; no marketplace-wide statistics.
export const mockCarrierRoutes: CarrierRoute[] = [
  {
    id: "baltijos-kelias-0915", carrier: { id: "baltijos-kelias", name: "Baltijos kelias", verification: "approved", rating: 4.9, reviewCount: 38, completedTransports: 52 },
    origin: location("hamburg-de"), destination: location("kaunas-lt"), stops: [location("berlin-de"), location("warsaw-pl")],
    dateFrom: "2026-09-15", dateTo: "2026-09-17", capacityTotal: 5, capacityReserved: 2, acceptingNewRequests: true,
    vehicleCategories: ["car", "suv"], routeFlexible: false, supportsNonRunning: true,
  },
  {
    id: "siaures-autovezis-0916", carrier: { id: "siaures-autovezis", name: "Šiaurės autovežis", verification: "approved", rating: 4.7, reviewCount: 21, completedTransports: 34 },
    origin: location("hamburg-de"), destination: location("vilnius-lt"), stops: [location("berlin-de"), location("kaunas-lt")],
    dateFrom: "2026-09-16", dateTo: "2026-09-18", capacityTotal: 6, capacityReserved: 4, acceptingNewRequests: true,
    vehicleCategories: ["car", "suv", "van"], routeFlexible: false, supportsNonRunning: false,
  },
  {
    id: "manto-transportas-0917", carrier: { id: "manto-transportas", name: "Manto transportas", verification: "pending", rating: null, reviewCount: 0, completedTransports: 0 },
    origin: location("hamburg-de"), destination: location("kaunas-lt"), stops: [],
    dateFrom: "2026-09-17", dateTo: "2026-09-19", capacityTotal: 3, capacityReserved: 2, acceptingNewRequests: true,
    vehicleCategories: ["car", "motorcycle"], routeFlexible: false, supportsNonRunning: true,
  },
  {
    id: "nemuno-logistika-0915", carrier: { id: "nemuno-logistika", name: "Nemuno logistika", verification: "approved", rating: 4.8, reviewCount: 64, completedTransports: 87 },
    origin: location("berlin-de"), destination: location("kaunas-lt"), stops: [location("warsaw-pl")],
    dateFrom: "2026-09-15", dateTo: "2026-09-16", capacityTotal: 8, capacityReserved: 6, acceptingNewRequests: true,
    vehicleCategories: ["car", "suv", "van"], routeFlexible: false, supportsNonRunning: true,
  },
  {
    id: "vakaru-kryptis-0918", carrier: { id: "vakaru-kryptis", name: "Vakarų kryptis", verification: "approved", rating: 4.6, reviewCount: 17, completedTransports: 25 },
    origin: location("rotterdam-nl"), destination: location("vilnius-lt"), stops: [location("hamburg-de"), location("kaunas-lt")],
    dateFrom: "2026-09-18", dateTo: "2026-09-21", capacityTotal: 8, capacityReserved: 4, acceptingNewRequests: true,
    vehicleCategories: ["car", "suv"], routeFlexible: false, supportsNonRunning: false,
  },
  {
    id: "pajurio-pervezimai-0922", carrier: { id: "pajurio-pervezimai", name: "Pajūrio pervežimai", verification: "not_submitted", rating: 4.5, reviewCount: 6, completedTransports: 9 },
    origin: location("hamburg-de"), destination: location("vilnius-lt"), stops: [],
    dateFrom: "2026-09-22", dateTo: "2026-09-24", capacityTotal: 3, capacityReserved: 0, acceptingNewRequests: true,
    vehicleCategories: ["car", "van"], routeFlexible: false, supportsNonRunning: true,
  },
]

// Full-route detail fixture; excluded by the existing P02 capacity filter.
mockCarrierRoutes.push({
  ...mockCarrierRoutes[0],
  id: "baltijos-kelias-0920-full",
  dateFrom: "2026-09-20",
  dateTo: "2026-09-22",
  capacityTotal: 3,
  capacityReserved: 3,
})

export function findMockCarrierRoute(id: string) {
  return mockCarrierRoutes.find((route) => route.id === id)
}
