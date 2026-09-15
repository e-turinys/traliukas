import { findMockRequestDetail } from "./request-details"
import { mockCarrierRoutes } from "./carrier-routes"
import { mockLocations } from "./locations"
import type { RequestDetail } from "@/features/public/request-detail/model"
import type { DashboardTab } from "@/features/public/dashboard/model"

export type DashboardFixtureName = "mixed" | "requests" | "transport" | "history" | "empty"

const fixtureRequestIds: Record<DashboardFixtureName, string[]> = {
  mixed: ["updated-offer-demo-001", "marketplace-demo-001", "targeted-demo-001", "booked-demo-001", "completed-demo-001", "closed-demo-001"],
  requests: ["marketplace-demo-001", "targeted-demo-001"],
  transport: ["booked-demo-001"],
  history: ["completed-demo-001", "closed-demo-001"],
  empty: [],
}

const location = (id: string) => mockLocations.find(item => item.id === id)!
const date = (day: number) => new Date(2026, 8, day)

function dashboardRequest(id: string): RequestDetail | undefined {
  const request = findMockRequestDetail(id)
  if (!request) return undefined
  const firstVehicle = request.vehicles[0]
  const variants: Partial<Record<string, Pick<RequestDetail, "route" | "vehicles">>> = {
    "updated-offer-demo-001": {
      route: request.route,
      vehicles: [firstVehicle, { ...firstVehicle, id: "vehicle-2", make: "Audi", model: "Q5", year: "2021", photos: [], pickupLocation: location("berlin-de"), usesDefaultRoute: false }],
    },
    "marketplace-demo-001": {
      route: { from: location("berlin-de"), to: location("vilnius-lt"), date: { type: "range", from: date(18), to: date(20) } },
      vehicles: [{ ...firstVehicle, make: "Audi", model: "Q5", category: "suv", pickupLocation: location("berlin-de"), deliveryLocation: location("vilnius-lt") }],
    },
    "targeted-demo-001": {
      route: { from: location("warsaw-pl"), to: location("kaunas-lt"), date: { type: "range", from: date(16), to: date(17) } },
      vehicles: [{ ...firstVehicle, make: "Volkswagen", model: "Passat", category: "car", pickupLocation: location("warsaw-pl"), deliveryLocation: location("kaunas-lt") }],
    },
    "booked-demo-001": {
      route: { from: location("hamburg-de"), to: location("vilnius-lt"), date: { type: "range", from: date(16), to: date(18) } },
      vehicles: [{ ...firstVehicle, make: "Mercedes-Benz", model: "GLC", category: "suv", pickupLocation: location("hamburg-de"), deliveryLocation: location("vilnius-lt") }],
    },
    "completed-demo-001": {
      route: { from: location("berlin-de"), to: location("kaunas-lt"), date: { type: "range", from: date(15), to: date(16) } },
      vehicles: [{ ...firstVehicle, make: "Volvo", model: "XC60", category: "suv", pickupLocation: location("berlin-de"), deliveryLocation: location("kaunas-lt") }],
    },
    "closed-demo-001": {
      route: { from: location("rotterdam-nl"), to: location("vilnius-lt"), date: { type: "range", from: date(18), to: date(21) } },
      vehicles: [{ ...firstVehicle, make: "Tesla", model: "Model 3", category: "car", pickupLocation: location("rotterdam-nl"), deliveryLocation: location("vilnius-lt") }],
    },
  }
  const variant = variants[id]
  if (variant) Object.assign(request, variant)

  if (id === "booked-demo-001" || id === "completed-demo-001") {
    const route = mockCarrierRoutes[id === "booked-demo-001" ? 1 : 3]
    request.offers = request.offers.map(offer => offer.status === "accepted" ? {
      ...offer,
      routeId: route.id,
      carrier: { ...route.carrier },
      pickupDate: route.dateFrom,
      deliveryDate: route.dateTo,
    } : offer)
  }
  return request
}

export function dashboardFixtureName(value: string | string[] | undefined): DashboardFixtureName {
  const candidate = Array.isArray(value) ? value[0] : value
  return candidate && Object.prototype.hasOwnProperty.call(fixtureRequestIds, candidate) ? candidate as DashboardFixtureName : "mixed"
}

export function dashboardFixture(name: DashboardFixtureName): { requests: RequestDetail[]; defaultTab: DashboardTab } {
  const requests = fixtureRequestIds[name].map(dashboardRequest).filter((request): request is RequestDetail => !!request)
  const defaultTab: DashboardTab = name === "transport" ? "transports" : name === "history" ? "history" : "requests"
  return { requests, defaultTab }
}
