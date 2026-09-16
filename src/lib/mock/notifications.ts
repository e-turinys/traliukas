import { bookingNotificationCopy } from "@/features/public/notifications/logic"
import { requestRouteSummary } from "@/features/public/request-route-summary"
import { vehicleCountLabel } from "@/features/public/vehicle-summary"
import { formatEur } from "@/lib/format-money"
import type { Notification } from "@/lib/types/notification"
import { findMockBooking } from "./bookings"

export type NotificationFixtureName = "default" | "empty" | "all-read"
export type NotificationFilter = "all" | "unread"

const customerId = "customer-demo-001"
const readAt = "2026-09-16T10:00:00Z"
const collected = bookingNotificationCopy("booking.collected", 1)
const delivered = bookingNotificationCopy("booking.delivered", 1)
const multiLocationBooking = findMockBooking("transport-multi-location-demo-001")!
const multiContext = `${requestRouteSummary(multiLocationBooking.vehicles).compact} · ${vehicleCountLabel(multiLocationBooking.vehicles.length)} · ${multiLocationBooking.carrier.name} · ${formatEur(multiLocationBooking.agreedTotalPrice)}`

const fixtures: readonly Notification[] = [
  {
    id: "notification-offer-created-001", sourceEventId: "event-offer-created-001", recipientId: customerId,
    eventType: "offer.created", actorId: "carrier-user-baltijos-kelias", title: "Naujas pasiūlymas",
    body: "Baltijos kelias pateikė 590 € pasiūlymą.", href: "/offers/marketplace-demo-001-offer-1",
    createdAt: "2026-09-16T09:45:00Z", entityType: "offer", entityId: "marketplace-demo-001-offer-1",
  },
  {
    id: "notification-message-created-001", sourceEventId: "event-message-created-001", recipientId: customerId,
    eventType: "message.created", actorId: "carrier-user-baltijos-kelias", title: "Nauja žinutė",
    body: "Baltijos kelias parašė naują žinutę.", href: "/messages/active-prebooking-demo-001",
    createdAt: "2026-09-16T09:30:00Z", entityType: "conversation", entityId: "active-prebooking-demo-001",
  },
  {
    id: "notification-delivered-001", sourceEventId: "event-booking-delivered-001", recipientId: customerId,
    eventType: "booking.delivered", actorId: "carrier-user-baltijos-kelias", title: delivered.title,
    body: delivered.body, href: "/bookings/transport-delivered-demo-001",
    createdAt: "2026-09-16T09:00:00Z", entityType: "booking", entityId: "transport-delivered-demo-001",
  },
  {
    id: "notification-in-transit-001", sourceEventId: "event-booking-in-transit-001", recipientId: customerId,
    eventType: "booking.inTransit", actorId: "carrier-user-baltijos-kelias", title: "Vežama",
    body: multiContext, href: "/bookings/transport-multi-location-demo-001",
    createdAt: "2026-09-16T08:30:00Z", readAt, entityType: "booking", entityId: "transport-multi-location-demo-001",
  },
  {
    id: "notification-collected-001", sourceEventId: "event-booking-collected-001", recipientId: customerId,
    eventType: "booking.collected", actorId: "carrier-user-baltijos-kelias", title: collected.title,
    body: collected.body, href: "/bookings/transport-collected-demo-001",
    createdAt: "2026-09-15T11:00:00Z", readAt, entityType: "booking", entityId: "transport-collected-demo-001",
  },
  {
    id: "notification-pickup-scheduled-001", sourceEventId: "event-booking-pickup-scheduled-001", recipientId: customerId,
    eventType: "booking.pickupScheduled", actorId: "carrier-user-baltijos-kelias", title: "Paėmimas suplanuotas",
    body: "Vežėjas suplanuavo automobilio paėmimą.", href: "/bookings/transport-pickup-scheduled-demo-001",
    createdAt: "2026-09-14T12:00:00Z", readAt, entityType: "booking", entityId: "transport-pickup-scheduled-demo-001",
  },
  {
    id: "notification-booking-created-001", sourceEventId: "event-booking-created-001", recipientId: customerId,
    eventType: "booking.created", title: "Pasiūlymas priimtas",
    body: "Sukurtas pervežimas su „Baltijos kelias“.", href: "/bookings/transport-demo-001",
    createdAt: "2026-09-14T11:25:00Z", readAt, entityType: "booking", entityId: "transport-demo-001",
  },
  {
    id: "notification-offer-updated-001", sourceEventId: "event-offer-updated-001", recipientId: customerId,
    eventType: "offer.updated", actorId: "carrier-user-baltijos-kelias", title: "Pasiūlymas atnaujintas",
    body: "Baltijos kelias atnaujino pasiūlymą iki 570 €.", href: "/offers/updated-offer-demo-001-offer-1",
    createdAt: "2026-09-14T10:30:00Z", readAt, entityType: "offer", entityId: "updated-offer-demo-001-offer-1",
  },
  {
    id: "notification-completed-001", sourceEventId: "event-booking-completed-001", recipientId: customerId,
    eventType: "booking.completed", title: "Pervežimas užbaigtas",
    body: "Pervežimas sėkmingai užbaigtas.", href: "/bookings/transport-completed-demo-001",
    createdAt: "2026-09-13T18:00:00Z", readAt, entityType: "booking", entityId: "transport-completed-demo-001",
  },
]

function clone(notification: Notification): Notification {
  return { ...notification }
}

export function notificationFixtureName(value: string | string[] | undefined): NotificationFixtureName {
  const candidate = Array.isArray(value) ? value[0] : value
  return candidate === "empty" || candidate === "all-read" ? candidate : "default"
}

export function notificationFilterName(value: string | string[] | undefined): NotificationFilter {
  const candidate = Array.isArray(value) ? value[0] : value
  return candidate === "unread" ? "unread" : "all"
}

export function listMockNotifications(name: NotificationFixtureName = "default") {
  if (name === "empty") return []
  if (name === "all-read") return fixtures.map(notification => ({ ...clone(notification), readAt: notification.readAt ?? readAt }))
  return fixtures.map(clone)
}
