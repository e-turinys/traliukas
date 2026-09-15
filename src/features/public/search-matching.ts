import type { CarrierRoute, RouteMatch } from "@/lib/types/carrier-route"
import { calendarDate, parseCalendarDate, readFilters, readRequestedVehicleCount, readSearch } from "./search-query"
import { canFitVehicleCount } from "@/lib/route-capacity"
import type { DateWindowValue } from "@/lib/types/date-window"

function dateBounds(value: DateWindowValue, today: string) {
  if (value.type === "single" && value.date) return [calendarDate(value.date), calendarDate(value.date)]
  if (value.type === "range" && value.from && value.to) return [calendarDate(value.from), calendarDate(value.to)]
  if (value.type === "flexible" && value.option) {
    const end = parseCalendarDate(today)!
    if (value.option === "this-month") end.setMonth(end.getMonth() + 1, 0)
    else end.setDate(end.getDate() + (value.option === "next-week" ? 7 : 14))
    return [today, calendarDate(end)]
  }
  return null
}

export function matchRoutes(routes: CarrierRoute[], params: URLSearchParams, today: string) {
  const search = readSearch(params)
  const exact: RouteMatch[] = []
  const alternatives: RouteMatch[] = []
  if (search.invalid || !search.from || !search.to) return { exact, alternatives }
  const filters = readFilters(params)
  const vehicleCount = readRequestedVehicleCount(params)
  const bounds = dateBounds(search.date, today)
  for (const route of routes) {
    if (!route.acceptingNewRequests || !canFitVehicleCount(route, vehicleCount) || route.dateTo < today) continue
    if (filters.verified && route.carrier.verification !== "approved") continue
    if (filters.rating !== "any" && (route.carrier.rating ?? 0) < Number(filters.rating)) continue
    if (filters.vehicle !== "any" && !route.vehicleCategories.includes(filters.vehicle)) continue
    if (filters.nonRunning && !route.supportsNonRunning) continue
    if (bounds && (route.dateTo < bounds[0] || route.dateFrom > bounds[1])) continue
    const stops = [route.origin, ...route.stops, route.destination]
    const pickup = stops.findIndex((stop) => stop.id === search.from!.id)
    const delivery = stops.findIndex((stop) => stop.id === search.to!.id)
    if (pickup >= 0 && delivery > pickup) {
      exact.push({ route, level: pickup === 0 && delivery === stops.length - 1 ? "excellent" : "good" })
    } else if (pickup >= 0 && delivery < 0 && stops.slice(pickup + 1).some((stop) => stop.countryCode === search.to!.countryCode)) {
      // Same pickup, another delivery city in the requested country. Never claim proximity or an exact match.
      alternatives.push({ route, level: "possible" })
    }
  }
  const rank = { excellent: 0, good: 1, possible: 2 }
  const sort = params.get("sort")
  const compare = (a: RouteMatch, b: RouteMatch) => {
    const byDate = a.route.dateFrom.localeCompare(b.route.dateFrom)
    const byRating = (b.route.carrier.rating ?? -1) - (a.route.carrier.rating ?? -1)
    if (sort === "date") return byDate || byRating
    if (sort === "rating") return byRating || byDate
    return rank[a.level] - rank[b.level] || byDate || byRating
  }
  return { exact: exact.sort(compare), alternatives: alternatives.sort(compare) }
}
