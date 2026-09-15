import { mockLocations } from "@/lib/mock/locations"
import { formatDateRange } from "@/lib/format-date"
import type { DateWindowValue, FlexibleDateOption } from "@/lib/types/date-window"
import { vehicleCategoryLabels, type VehicleCategory } from "@/lib/types/carrier-route"

export const searchKeys = ["from", "to", "dateType", "date", "dateFrom", "dateTo", "dateFlexible", "dateOption"] as const
const dateKeys = searchKeys.filter((key) => key !== "from" && key !== "to")
export const flexibleLabels: Record<FlexibleDateOption, string> = {
  "next-week": "Artimiausia savaitė",
  "next-two-weeks": "Artimiausios 2 savaitės",
  "this-month": "Šį mėnesį",
}

export function calendarDate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
}

export function parseCalendarDate(value: string | null) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined
  const [year, month, day] = value.split("-").map(Number)
  const date = new Date(year, month - 1, day)
  return calendarDate(date) === value ? date : undefined
}

export function readDate(params: URLSearchParams): { value: DateWindowValue; invalid: boolean } {
  const type = params.get("dateType")
  if (!type || type === "anytime") return { value: { type: "anytime" }, invalid: false }
  if (type === "single") {
    const date = parseCalendarDate(params.get("date"))
    return { value: { type, date }, invalid: !date }
  }
  if (type === "range") {
    const from = parseCalendarDate(params.get("dateFrom"))
    const to = parseCalendarDate(params.get("dateTo"))
    return { value: { type, from, to }, invalid: !from || !to || from > to }
  }
  if (type === "flexible") {
    const raw = params.get("dateFlexible") ?? params.get("dateOption")
    const option = Object.keys(flexibleLabels).find((key) => key === raw) as FlexibleDateOption | undefined
    return { value: { type, option }, invalid: !option }
  }
  return { value: { type: "anytime" }, invalid: true }
}

export function dateError(date: DateWindowValue) {
  if (date.type === "range" && (date.from || date.to) && (!date.from || !date.to || date.from > date.to)) {
    return "Pasirinkite tinkamą intervalo pradžią ir pabaigą arba „Bet kada“."
  }
  return undefined
}

export function writeDate(params: URLSearchParams, date: DateWindowValue) {
  dateKeys.forEach((key) => params.delete(key))
  if (date.type === "single" && date.date) {
    params.set("dateType", "single")
    params.set("date", calendarDate(date.date))
  } else if (date.type === "range" && date.from && date.to) {
    params.set("dateType", "range")
    params.set("dateFrom", calendarDate(date.from))
    params.set("dateTo", calendarDate(date.to))
  } else if (date.type === "flexible" && date.option) {
    params.set("dateType", "flexible")
    params.set("dateFlexible", date.option)
  }
}

export function dateLabel(value: DateWindowValue): string {
  if (value.type === "single" && value.date) return formatDateRange(calendarDate(value.date))
  if (value.type === "range" && value.from && value.to) return formatDateRange(calendarDate(value.from), calendarDate(value.to))
  if (value.type === "flexible" && value.option) return flexibleLabels[value.option]
  return "Bet kada"
}

export function readSearch(params: URLSearchParams) {
  const from = mockLocations.find((item) => item.id === params.get("from")) ?? null
  const to = mockLocations.find((item) => item.id === params.get("to")) ?? null
  const date = readDate(params)
  return { from, to, date: date.value, invalid: !from || !to || from.id === to.id || date.invalid }
}

export function readFilters(params: URLSearchParams) {
  const category = params.get("vehicle")
  return {
    verified: params.get("verified") === "true",
    rating: ["4", "4.5"].includes(params.get("rating") ?? "") ? params.get("rating")! : "any",
    vehicle: Object.keys(vehicleCategoryLabels).includes(category ?? "") ? category as VehicleCategory : "any" as const,
    nonRunning: params.get("nonRunning") === "true",
  }
}

export function readRequestedVehicleCount(params: URLSearchParams) {
  const value = Number(params.get("vehicleCount") ?? "1")
  return Number.isInteger(value) && value >= 1 ? value : 1
}

export function requestHref(params: URLSearchParams) {
  const query = new URLSearchParams()
  searchKeys.forEach((key) => params.getAll(key).forEach((value) => query.append(key, value)))
  return `/request/new${query.size ? `?${query}` : ""}`
}
