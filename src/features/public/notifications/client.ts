"use client"
import { commandClient } from "../marketplace-persistence/client"

export async function persistNotificationRead(id?: string) {
  const client = await commandClient()
  const { data, error } = await client.rpc("mark_notifications_read", { p_notification_id: id })
  if (error || !data) throw new Error("Unable to mark notifications read")
  return data
}
