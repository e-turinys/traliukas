import type { Database } from "@/lib/supabase/database.types"
import { notificationEventTypes, notificationEntityTypes, type Notification } from "@/lib/types/notification"

export function notificationProjection(row: Database["api"]["Views"]["notifications"]["Row"]): Notification {
  if (!row.id || !row.source_event_id || !row.recipient_id || !row.event_type || row.event_type === "offer.accepted"
    || !notificationEventTypes.includes(row.event_type as Notification["eventType"])
    || !notificationEntityTypes.includes(row.entity_type as Notification["entityType"])
    || !row.entity_id || !row.title || !row.body || !row.created_at || !row.href) throw new Error("Invalid notification")
  const prefix = row.entity_type === "offer" ? "/offers/" : row.entity_type === "conversation" ? "/messages/" : "/bookings/"
  if (row.href !== prefix + row.entity_id) throw new Error("Invalid notification destination")
  return { id: row.id, sourceEventId: row.source_event_id, recipientId: row.recipient_id,
    actorId: row.actor_id ?? undefined, eventType: row.event_type as Notification["eventType"],
    title: row.title, body: row.body, href: row.href, createdAt: row.created_at, readAt: row.read_at ?? undefined,
    entityType: row.entity_type as Notification["entityType"], entityId: row.entity_id }
}
