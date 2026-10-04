import { publishedRequestSummary, publicationCopy } from "../request-published/context"
import { visibleOfferStatus } from "../request-detail/logic"
import { requestStatusLabels, type RequestDetail } from "../request-detail/model"
import { formatDateRange } from "@/lib/format-date"
import type { DashboardTab, DashboardViewModel } from "./model"
import type { Booking } from "@/lib/types/booking"
import { bookingStatusLabel } from "../booking-detail/logic"
import { requestRouteSummary } from "../request-route-summary"
import { compactVehicleSummary } from "../vehicle-summary"

export function dashboardTabFromQuery(value: string | string[] | undefined): DashboardTab {
  const tab = Array.isArray(value) ? value[0] : value
  return tab === "transport" || tab === "transports" ? "transports" : tab === "history" ? "history" : "requests"
}

export function derivePersistedDashboard(requests: RequestDetail[], bookings: Booking[], now: string, defaultTab: DashboardTab = "requests"): DashboardViewModel {
  const unique = [...new Map(bookings.map(b => [b.id, b])).values()]
  const booked = new Set(unique.map(b => b.requestId))
  const view = deriveDashboard(requests.filter(r => !booked.has(r.id)), now, defaultTab)
  for (const booking of unique) {
    const item = {
      id: booking.requestId, bookingId: booking.id,
      route: requestRouteSummary(booking.vehicles).compact,
      vehicle: compactVehicleSummary(booking.vehicles), vehicleCount: booking.vehicles.length,
      carrier: booking.carrier.name, status: bookingStatusLabel(booking.status, booking.vehicles.length),
    }
    if (booking.status === "completed") {
      view.history.push({ ...item, dateLabel: "Pristatyta", date: formatDateRange(booking.plannedDelivery) })
    } else {
      view.transports.push({ ...item, pickupDate: formatDateRange(booking.plannedPickup), deliveryDate: formatDateRange(booking.plannedDelivery) })
    }
  }
  view.empty = !view.requests.length && !view.transports.length && !view.history.length
  return view
}

export function dashboardTabForStatus(status: RequestDetail["status"]): DashboardTab | undefined {
  if (status === "active") return "requests"
  if (status === "booked") return "transports"
  if (status === "completed" || status === "closed") return "history"
}

export function deriveDashboard(
  requests: RequestDetail[],
  now: string,
  defaultTab: DashboardTab = "requests"
): DashboardViewModel {
  const view: DashboardViewModel = {
    attention: [], requests: [], transports: [], history: [], defaultTab, empty: false,
  }

  requests.forEach(request => {
    const tab = dashboardTabForStatus(request.status)
    if (!tab) return
    const summary = publishedRequestSummary(request)

    if (tab === "requests") {
      const actionable = request.offers.filter(offer => visibleOfferStatus(request, offer, now) === "pending")
      view.requests.push({
        id: request.id,
        route: summary.route,
        vehicle: summary.vehicleSummary,
        vehicleCount: summary.vehicleCount,
        requestedDate: summary.date,
        visibility: publicationCopy(summary).audience,
        status: requestStatusLabels.active,
        offerCount: request.offers.length,
      })
      if (actionable.length) {
        view.attention.push({
          id: request.id,
          route: summary.route,
          vehicle: summary.vehicleSummary,
          vehicleCount: summary.vehicleCount,
          status: requestStatusLabels.active,
          actionableOfferCount: actionable.length,
          updated: actionable.some(offer => offer.offerVersion > 1),
        })
      }
      return
    }

    const accepted = request.offers.find(offer => offer.status === "accepted")
    if (tab === "transports") {
      if (!accepted || !request.bookingId) throw new Error("Booked dashboard request requires an accepted offer and booking link")
      view.transports.push({
        id: request.id,
        bookingId: request.bookingId,
        route: summary.route,
        vehicle: summary.vehicleSummary,
        vehicleCount: summary.vehicleCount,
        carrier: accepted.carrier.name,
        pickupDate: formatDateRange(accepted.pickupDate),
        deliveryDate: formatDateRange(accepted.deliveryDate),
        status: requestStatusLabels.booked,
      })
      return
    }

    view.history.push({
      id: request.id,
      route: summary.route,
      vehicle: summary.vehicleSummary,
      vehicleCount: summary.vehicleCount,
      status: requestStatusLabels[request.status],
      dateLabel: request.status === "completed" && accepted ? "Pristatyta" : "Pageidautas paėmimas",
      date: request.status === "completed" && accepted ? formatDateRange(accepted.deliveryDate) : summary.date,
      carrier: request.status === "completed" ? accepted?.carrier.name : undefined,
    })
  })

  view.attention.sort((left, right) => Number(right.updated) - Number(left.updated))
  view.empty = view.requests.length === 0 && view.transports.length === 0 && view.history.length === 0
  return view
}
