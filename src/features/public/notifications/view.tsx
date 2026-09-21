"use client"

import Link from "next/link"
import { useState } from "react"
import { ArrowRight, Bell, CalendarDays, CheckCheck, CircleCheck, FileText, MessageSquare, PackageCheck, Truck } from "lucide-react"
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
  return <Card className="border bg-card py-0 shadow-none ring-0">
    <CardContent className="space-y-2 p-6 text-center sm:py-10">
      <span className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-muted"><Bell aria-hidden="true" className="size-5 text-muted-foreground" /></span>
      <h2 className="font-semibold">{allEmpty ? "Pranešimų nėra" : "Visus pranešimus perskaitėte"}</h2>
      <p className="text-sm leading-relaxed text-muted-foreground">{allEmpty ? "Čia matysite svarbius užklausų ir pervežimų atnaujinimus." : "Visi pranešimai lieka pasiekiami skiltyje „Visi“."}</p>
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

  return <div className="mx-auto w-full max-w-4xl space-y-6 pb-8">
    <header className="space-y-2">
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Pranešimai</h1>
      <p className="text-muted-foreground">Svarbūs atnaujinimai apie jūsų užklausas ir pervežimus.</p>
    </header>

    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div role="group" aria-label="Pranešimų filtras" className="grid min-h-11 grid-cols-2 rounded-lg border bg-muted p-1 sm:w-72 sm:shrink-0">
        <Button aria-pressed={filter === "all"} variant={filter === "all" ? "outline" : "ghost"} className="h-auto min-h-11 whitespace-normal px-3 py-2" onClick={() => setFilter("all")}>Visi</Button>
        <Button aria-pressed={filter === "unread"} variant={filter === "unread" ? "outline" : "ghost"} className="h-auto min-h-11 whitespace-normal px-3 py-2" onClick={() => setFilter("unread")}>Neperskaityti</Button>
      </div>
      {notifications.length > 0 && <Button variant="ghost" className="h-auto min-h-11 w-full whitespace-normal py-2 sm:w-auto" disabled={!unread.length} onClick={() => setNotifications(current => markAllNotificationsRead(current, now()))}>
        <CheckCheck aria-hidden="true" />Pažymėti visus kaip perskaitytus
      </Button>}
    </div>
    <p role="status" className="sr-only">Neperskaityti pranešimai: {unread.length}. Rodoma: {visible.length}.</p>

    {visible.length > 0 ? <ol aria-label="Pranešimų sąrašas" className="space-y-3">
      {visible.map(notification => {
        const isUnread = !notification.readAt
        const Icon = notification.eventType === "message.created" ? MessageSquare
          : notification.eventType === "offer.created" || notification.eventType === "offer.updated" ? FileText
          : notification.eventType === "booking.pickupScheduled" ? CalendarDays
          : notification.eventType === "booking.created" || notification.eventType === "booking.completed" ? CircleCheck
          : notification.eventType === "booking.delivered" ? PackageCheck : Truck
        return <li key={notification.id}>
          <Card data-notification-id={notification.id} data-notification-read={!isUnread} className={`min-w-0 border py-0 shadow-none ring-0 ${isUnread ? "border-primary/20 bg-primary/5" : "bg-card"}`}>
            <CardContent className="p-0">
              <Link href={notificationDestination(notification)} onClick={() => setNotifications(current => markNotificationRead(current, notification.id, now()))} className="group flex min-h-24 min-w-0 items-start gap-3 rounded-xl p-4 transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring sm:gap-4 sm:p-6">
                <span className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${isUnread ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}><Icon aria-hidden="true" className="size-5" /></span>
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                    <h2 className={`min-w-0 break-words text-base leading-snug ${isUnread ? "font-semibold" : "font-medium"}`}>{notification.title}</h2>
                    <time className="shrink-0 text-sm text-muted-foreground" dateTime={notification.createdAt}>{formatNotificationTime(notification.createdAt)}</time>
                  </div>
                  <p className="break-words text-sm leading-relaxed text-muted-foreground">{notification.body}</p>
                  <div className="flex items-center justify-between gap-3 pt-1">
                    <span className={`inline-flex items-center gap-2 text-xs ${isUnread ? "font-medium text-primary" : "text-muted-foreground"}`}>{isUnread && <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-primary" />}{isUnread ? "Neperskaitytas" : "Perskaitytas"}</span>
                    <ArrowRight aria-hidden="true" className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                  </div>
                </div>
              </Link>
            </CardContent>
          </Card>
        </li>
      })}
    </ol> : <EmptyState allEmpty={notifications.length === 0} />}
  </div>
}
