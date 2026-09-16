export const notificationEventTypes = [
  "offer.created",
  "offer.updated",
  "offer.accepted",
  "message.created",
  "booking.created",
  "booking.pickupScheduled",
  "booking.collected",
  "booking.inTransit",
  "booking.delivered",
  "booking.completed",
] as const

export type NotificationEventType = (typeof notificationEventTypes)[number]

export const notificationEntityTypes = ["offer", "conversation", "booking"] as const
export type NotificationEntityType = (typeof notificationEntityTypes)[number]

export type Notification = {
  id: string
  sourceEventId: string
  recipientId: string
  eventType: NotificationEventType
  actorId?: string
  title: string
  body: string
  href: string
  createdAt: string
  readAt?: string
  entityType: NotificationEntityType
  entityId: string
}

export const notificationChannels = ["in_app", "email", "sms"] as const
export type NotificationChannel = (typeof notificationChannels)[number]

export const notificationDeliveryStatuses = ["pending", "sent", "failed", "skipped"] as const
export type NotificationDeliveryStatus = (typeof notificationDeliveryStatuses)[number]

// Planned backend delivery state remains separate from the in-app Notification record.
export type NotificationDelivery = {
  notificationId: string
  channel: NotificationChannel
  status: NotificationDeliveryStatus
  idempotencyKey: string
  sentAt?: string
  failureReason?: string
}

export type NotificationDomainEvent = {
  id: string
  type: NotificationEventType
  occurredAt: string
  actorId?: string
  customerId: string
  selectedCarrierUserId?: string
  conversationParticipantIds?: readonly string[]
  entityType: NotificationEntityType
  entityId: string
}
