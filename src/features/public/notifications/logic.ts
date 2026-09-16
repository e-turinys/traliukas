import { vehiclePriceScope } from "../vehicle-summary"
import type {
  Notification, NotificationChannel, NotificationDomainEvent, NotificationEventType,
} from "@/lib/types/notification"

export type NotificationRecipientPolicy = "none" | "customer" | "customer_and_carrier" | "other_conversation_participant"
export type NotificationEmailPolicy = "none" | "immediate" | "unread_fallback"

export type NotificationPolicy = {
  recipients: NotificationRecipientPolicy
  inApp: boolean
  email: NotificationEmailPolicy
  sms: boolean
}

export const notificationPolicies: Record<NotificationEventType, NotificationPolicy> = {
  "offer.created": { recipients: "customer", inApp: true, email: "immediate", sms: false },
  "offer.updated": { recipients: "customer", inApp: true, email: "immediate", sms: false },
  "offer.accepted": { recipients: "none", inApp: false, email: "none", sms: false },
  "message.created": { recipients: "other_conversation_participant", inApp: true, email: "unread_fallback", sms: false },
  "booking.created": { recipients: "customer_and_carrier", inApp: true, email: "immediate", sms: true },
  "booking.pickupScheduled": { recipients: "customer", inApp: true, email: "immediate", sms: true },
  "booking.collected": { recipients: "customer", inApp: true, email: "immediate", sms: false },
  "booking.inTransit": { recipients: "customer", inApp: true, email: "immediate", sms: false },
  "booking.delivered": { recipients: "customer", inApp: true, email: "immediate", sms: true },
  "booking.completed": { recipients: "customer_and_carrier", inApp: true, email: "immediate", sms: false },
}

export function notificationPolicy(eventType: NotificationEventType) {
  return notificationPolicies[eventType]
}

export function resolveNotificationRecipients(event: NotificationDomainEvent) {
  const policy = notificationPolicy(event.type)
  let recipients: string[]
  if (policy.recipients === "none") recipients = []
  else if (policy.recipients === "customer") recipients = [event.customerId]
  else if (policy.recipients === "customer_and_carrier") recipients = [event.customerId, event.selectedCarrierUserId].filter((id): id is string => !!id)
  else recipients = [...(event.conversationParticipantIds ?? [])]

  // Suppression applies after policy resolution so an actor never receives their own notification.
  return [...new Set(recipients)].filter(recipientId => recipientId !== event.actorId)
}

export function notificationIdempotencyKey(sourceEventId: string, recipientId: string, channel: NotificationChannel = "in_app") {
  return `${sourceEventId}:${recipientId}:${channel}`
}

export function notificationDeliveryIdempotencyKeys(sourceEventId: string, recipientId: string, eventType: NotificationEventType) {
  const policy = notificationPolicy(eventType)
  const channels: NotificationChannel[] = [
    ...(policy.inApp ? ["in_app" as const] : []),
    ...(policy.email !== "none" ? ["email" as const] : []),
    ...(policy.sms ? ["sms" as const] : []),
  ]
  return channels.map(channel => notificationIdempotencyKey(sourceEventId, recipientId, channel))
}

export function createInAppNotifications(event: NotificationDomainEvent, content: { title: string; body: string; href: string }) {
  return resolveNotificationRecipients(event).map((recipientId): Notification => ({
    id: `notification-${event.id}-${recipientId}`,
    sourceEventId: event.id,
    recipientId,
    eventType: event.type,
    actorId: event.actorId,
    title: content.title,
    body: content.body,
    href: content.href,
    createdAt: event.occurredAt,
    entityType: event.entityType,
    entityId: event.entityId,
  }))
}

export function appendNotificationsIdempotently(existing: readonly Notification[], incoming: readonly Notification[]) {
  const keys = new Set(existing.map(notification => notificationIdempotencyKey(notification.sourceEventId, notification.recipientId)))
  return [...existing, ...incoming.filter(notification => {
    const key = notificationIdempotencyKey(notification.sourceEventId, notification.recipientId)
    if (keys.has(key)) return false
    keys.add(key)
    return true
  })]
}

export function markNotificationRead(notifications: readonly Notification[], id: string, readAt: string) {
  return notifications.map(notification => notification.id === id && !notification.readAt ? { ...notification, readAt } : notification)
}

export function markAllNotificationsRead(notifications: readonly Notification[], readAt: string) {
  return notifications.map(notification => notification.readAt ? notification : { ...notification, readAt })
}

export function unreadNotifications(notifications: readonly Notification[]) {
  return notifications.filter(notification => !notification.readAt)
}

export function notificationDestination(notification: Pick<Notification, "href">) {
  return notification.href
}

export function bookingNotificationCopy(eventType: Extract<NotificationEventType, "booking.collected" | "booking.delivered">, vehicleCount: number) {
  const singular = vehicleCount === 1
  if (eventType === "booking.collected") return {
    title: singular ? "Automobilis paimtas" : "Automobiliai paimti",
    body: singular ? "Vežėjas paėmė automobilį." : `Vežėjas paėmė ${vehiclePriceScope(vehicleCount)}.`,
  }
  return {
    title: singular ? "Automobilis pristatytas" : "Automobiliai pristatyti",
    body: singular ? "Patvirtinkite, kad gavote automobilį." : `Patvirtinkite, kad gavote ${vehiclePriceScope(vehicleCount)}.`,
  }
}
