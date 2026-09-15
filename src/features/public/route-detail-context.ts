import type { CarrierRoute } from "@/lib/types/carrier-route"
import { formatCount } from "@/lib/format-count"
import { getAvailableCapacity } from "@/lib/route-capacity"

export function routeAvailability(route: CarrierRoute, today: string) {
  const spaces = getAvailableCapacity(route)
  const expired = route.dateTo < today
  const available = spaces > 0 && route.acceptingNewRequests && !expired
  const label = spaces === 0
    ? "Maršrutas pilnas"
    : expired ? "Šio maršruto datos jau praėjo"
    : !route.acceptingNewRequests ? "Šiam maršrutui naujos užklausos nebepriimamos"
    : formatCount(spaces, { one: "laisva vieta", few: "laisvos vietos", other: "laisvų vietų" })
  return { spaces, available, full: spaces === 0, label }
}

export function routeRequestHref(route: CarrierRoute, available: boolean) {
  const params = new URLSearchParams({ from: route.origin.id, to: route.destination.id })
  if (route.dateFrom === route.dateTo) {
    params.set("dateType", "single")
    params.set("date", route.dateFrom)
  } else {
    params.set("dateType", "range")
    params.set("dateFrom", route.dateFrom)
    params.set("dateTo", route.dateTo)
  }
  params.set("visibility", available ? "targeted" : "marketplace")
  if (available) {
    params.set("targetCarrier", route.carrier.id)
    params.set("targetRoute", route.id)
  }
  return `/request/new?${params}`
}
