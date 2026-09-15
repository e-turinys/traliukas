import { publishedRequestSummary, publicationCopy } from "../request-published/context"
import { visibleOfferStatus } from "../request-detail/logic"
import { requestStatusLabels, type RequestDetail } from "../request-detail/model"
import { formatDateRange } from "@/lib/format-date"
import type { DashboardTab, DashboardViewModel } from "./model"

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
