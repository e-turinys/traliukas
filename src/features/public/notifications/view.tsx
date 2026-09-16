"use client"

import Link from "next/link"
import { useState } from "react"
import { ArrowRight, Bell, CheckCheck } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import type { Notification } from "@/lib/types/notification"
import type { NotificationFilter } from "@/lib/mock/notifications"
import {
  markAllNotificationsRead, markNotificationRead, notificationDestination, unreadNotifications,
} from "./logic"

function formatNotificationTime(value: string) {
  return new Intl.DateTimeFormat("lt-LT", {
    timeZone: "Europe/Vilnius", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  }).format(new Date(value))
}

function EmptyState({ allEmpty }: { allEmpty: boolean }) {
  return <Card className="bg-muted/20">
    <CardContent className="py-10 text-center">
      <Bell aria-hidden="true" className="mx-auto mb-3 size-7 text-muted-foreground" />
      <h2 className="font-semibold">{allEmpty ? "Pranešimų nėra" : "Visus pranešimus perskaitėte"}</h2>
    </CardContent>
  </Card>
}

export function NotificationsView({ initialNotifications, initialFilter = "all" }: {
  initialNotifications: Notification[]
  initialFilter?: NotificationFilter
}) {
  const [notifications, setNotifications] = useState(initialNotifications)
  const [filter, setFilter] = useState<NotificationFilter>(initialFilter)
  const unread = unreadNotifications(notifications)
  const visible = filter === "unread" ? unread : notifications
  const now = () => new Date().toISOString()

  return <div className="mx-auto w-full max-w-4xl space-y-6">
    <header className="space-y-2">
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Pranešimai</h1>
      <p className="text-muted-foreground">Svarbūs pasiūlymų, pokalbių ir pervežimų atnaujinimai.</p>
    </header>

    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div role="tablist" aria-label="Pranešimų filtras" className="grid min-h-11 grid-cols-2 rounded-lg bg-muted p-1 sm:w-72">
        <Button role="tab" aria-selected={filter === "all"} variant={filter === "all" ? "outline" : "ghost"} className="min-h-11" onClick={() => setFilter("all")}>Visi</Button>
        <Button role="tab" aria-selected={filter === "unread"} variant={filter === "unread" ? "outline" : "ghost"} className="min-h-11" onClick={() => setFilter("unread")}>Neperskaityti</Button>
      </div>
      {notifications.length > 0 && <Button variant="outline" className="h-auto min-h-11 w-full whitespace-normal py-2 sm:w-auto" disabled={!unread.length} onClick={() => setNotifications(current => markAllNotificationsRead(current, now()))}>
        <CheckCheck aria-hidden="true" />Pažymėti visus kaip perskaitytus
      </Button>}
    </div>

    {visible.length > 0 ? <ol aria-label="Pranešimų sąrašas" className="space-y-3">
      {visible.map(notification => {
        const isUnread = !notification.readAt
        return <li key={notification.id}>
          <Card data-notification-id={notification.id} data-notification-read={!isUnread} className={isUnread ? "min-w-0 ring-2 ring-primary/35" : "min-w-0 bg-muted/25"}>
            <CardContent className="p-0">
              <Link href={notificationDestination(notification)} onClick={() => setNotifications(current => markNotificationRead(current, notification.id, now()))} className="group grid min-h-24 min-w-0 gap-3 rounded-xl p-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:p-5">
                <div className="min-w-0 space-y-2">
                  <div className="flex min-w-0 flex-wrap items-center gap-2">
                    <h2 className="break-words font-semibold">{notification.title}</h2>
                    {isUnread && <Badge>Naujas<span className="sr-only">, neperskaitytas pranešimas</span></Badge>}
                  </div>
                  <p className="break-words text-sm text-muted-foreground">{notification.body}</p>
                </div>
                <div className="flex items-center justify-between gap-3 sm:flex-col sm:items-end">
                  <time className="text-xs text-muted-foreground" dateTime={notification.createdAt}>{formatNotificationTime(notification.createdAt)}</time>
                  <ArrowRight aria-hidden="true" className="size-4 shrink-0 transition-transform group-hover:translate-x-0.5" />
                </div>
              </Link>
            </CardContent>
          </Card>
        </li>
      })}
    </ol> : <EmptyState allEmpty={notifications.length === 0} />}
  </div>
}
