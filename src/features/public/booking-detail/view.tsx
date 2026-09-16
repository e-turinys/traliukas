"use client"

import Link from "next/link"
import { useRef, useState } from "react"
import { ArrowLeft, Check, Circle, MessageCircle } from "lucide-react"
import { CarrierTrust } from "@/components/shared/carrier-trust"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatDateRange } from "@/lib/format-date"
import { formatEur } from "@/lib/format-money"
import { requestCategories } from "../create-request/model"
import { requestRouteSummary, vehicleRouteLabel } from "../request-route-summary"
import { dateLabel } from "../search-query"
import { vehicleCountLabel, vehicleName, vehiclePriceScope } from "../vehicle-summary"
import {
  bookingChatHref, bookingCompletionCopy, bookingConversationCopy, bookingStatusLabel,
  bookingTimeline, canCustomerConfirmDelivery, completeDeliveredBooking, hydrateBooking, type BookingPayload,
} from "./logic"
import { BookingCompletionDialog } from "./completion-dialog"

const conditionLabels = { running: "Važiuojantis", "non-running": "Nevažiuojantis" } as const
const rollingLabels = { yes: "Rieda", no: "Nerieda", unknown: "Riedėjimas nežinomas" } as const

function Detail({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return <div className={`min-w-0 ${className}`}><dt className="text-muted-foreground">{label}</dt><dd className="break-words font-medium">{children}</dd></div>
}

export function BookingDetailView({ initialBooking }: { initialBooking: BookingPayload }) {
  const [booking, setBooking] = useState(() => hydrateBooking(initialBooking))
  const [confirming, setConfirming] = useState(false)
  const completionButton = useRef<HTMLButtonElement>(null)
  const route = requestRouteSummary(booking.vehicles).compact
  const vehicleCount = booking.vehicles.length
  const timeline = bookingTimeline(booking.status, vehicleCount)
  const completionCopy = bookingCompletionCopy(vehicleCount)
  const conversationCopy = bookingConversationCopy(booking.status)
  const canComplete = canCustomerConfirmDelivery(booking.status)

  const confirmCompletion = () => {
    setBooking(current => completeDeliveredBooking(current))
    setConfirming(false)
  }

  return <div className="mx-auto w-full max-w-6xl space-y-6 pb-8">
    <Link href="/dashboard" className="inline-flex min-h-11 items-center gap-2 text-sm font-medium underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
      <ArrowLeft aria-hidden="true" className="size-4" />Grįžti į skydelį
    </Link>

    <header className="min-w-0 space-y-3 border-b pb-6">
      <Badge>{bookingStatusLabel(booking.status, vehicleCount)}</Badge>
      <h1 className="break-words text-3xl font-semibold tracking-tight">{route}</h1>
      <p className="text-muted-foreground">{vehicleCountLabel(booking.vehicles.length)}</p>
    </header>

    <div className="grid min-w-0 items-start gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(18rem,2fr)]">
      <main className="min-w-0 space-y-6">
        <Card>
          <CardHeader><CardTitle className="text-xl">Sutartas pervežimas</CardTitle></CardHeader>
          <CardContent>
            <dl className="grid gap-4 text-sm sm:grid-cols-2">
              <Detail label="Pasirinktas vežėjas">{booking.carrier.name}</Detail>
              <Detail label="Pageidautas paėmimas">{dateLabel(booking.requestedPickupWindow)}</Detail>
              <Detail label="Planuojamas paėmimas">{formatDateRange(booking.plannedPickup)}</Detail>
              <Detail label="Planuojamas pristatymas">{formatDateRange(booking.plannedDelivery)}</Detail>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-xl">Pervežimo eiga</CardTitle></CardHeader>
          <CardContent>
            <ol aria-label="Pervežimo būsenos" className="relative grid gap-0 md:grid-cols-6">
              <span data-timeline-connector aria-hidden="true" className="absolute top-2 right-[8.333%] left-[8.333%] hidden h-0.5 bg-border md:block" />
              {timeline.map(step => {
                const complete = step.state === "complete"
                const current = step.state === "current"
                return <li key={step.status} data-timeline-state={step.state} className="relative min-w-0 border-l-2 pb-5 pl-7 last:border-l-transparent last:pb-0 md:border-l-0 md:px-2 md:pt-6 md:pb-0 md:text-center">
                  <span data-timeline-node className={`absolute -left-[0.5625rem] top-0 z-[1] flex size-4 items-center justify-center rounded-full border bg-background md:top-0 md:left-1/2 md:-translate-x-1/2 ${complete || current ? "border-primary text-primary" : "border-muted-foreground/40 text-muted-foreground"}`}>
                    {complete ? <Check aria-hidden="true" className="size-3" /> : <Circle aria-hidden="true" className={`size-2 ${current ? "fill-current" : ""}`} />}
                  </span>
                  <p className={`break-words text-sm ${current ? "font-semibold" : complete ? "font-medium" : "text-muted-foreground"}`}>{step.label}</p>
                  <span className="sr-only">{complete ? "Atlikta" : current ? "Dabartinė būsena" : "Dar neatlikta"}</span>
                </li>
              })}
            </ol>
          </CardContent>
        </Card>

        <section aria-labelledby="vehicles-heading" className="space-y-4">
          <h2 id="vehicles-heading" className="text-xl font-semibold">Automobiliai ({booking.vehicles.length})</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {booking.vehicles.map(vehicle => <Card key={vehicle.id} size="sm">
              <CardHeader>
                <CardTitle className="break-words text-lg">{vehicleName(vehicle)}</CardTitle>
                <p className="break-words text-sm font-medium">{vehicleRouteLabel(vehicle)}</p>
              </CardHeader>
              <CardContent>
                <dl className="grid gap-3 text-sm">
                  <Detail label="Kategorija">{vehicle.category ? requestCategories[vehicle.category] : "Nenurodyta"}</Detail>
                  {vehicle.year && <Detail label="Metai">{vehicle.year}</Detail>}
                  <Detail label="Būklė">{vehicle.condition ? conditionLabels[vehicle.condition] : "Nenurodyta"}</Detail>
                  {vehicle.condition === "non-running" && vehicle.rolls && <Detail label="Riedėjimas">{rollingLabels[vehicle.rolls]}</Detail>}
                  <Detail label="Paėmimo vieta">{vehicle.pickupLocation?.city ?? "Nenurodyta"}</Detail>
                  <Detail label="Pristatymo vieta">{vehicle.deliveryLocation?.city ?? "Nenurodyta"}</Detail>
                </dl>
              </CardContent>
            </Card>)}
          </div>
        </section>
      </main>

      <aside className="min-w-0 space-y-6 lg:sticky lg:top-24">
        {canComplete && <Card className="border-primary/40 shadow-sm">
          <CardHeader><CardTitle>Patvirtinkite gavimą</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">{completionCopy.cardDescription}</p>
            <Button ref={completionButton} className="h-auto min-h-11 w-full whitespace-normal py-3" onClick={() => setConfirming(true)}>{completionCopy.cta}</Button>
          </CardContent>
        </Card>}

        <Card>
          <CardHeader><CardTitle>Vežėjas</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <h3 className="break-words text-lg font-semibold">{booking.carrier.name}</h3>
            <CarrierTrust carrier={booking.carrier} />
            <Button nativeButton={false} variant="outline" render={<Link href={`/carriers/${encodeURIComponent(booking.carrierId)}`} />} className="h-auto min-h-11 w-full whitespace-normal py-3">Peržiūrėti vežėjo profilį</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Kaina ir apmokėjimas</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-2xl font-semibold">{formatEur(booking.agreedTotalPrice)}</p>
              <p className="text-sm text-muted-foreground">{booking.vehicles.length === 1 ? "Visa pervežimo kaina" : `Visa pervežimo kaina už ${vehiclePriceScope(booking.vehicles.length)}`}</p>
            </div>
            <dl className="text-sm"><Detail label="Apmokėjimo sąlygos">{booking.paymentTerms}</Detail></dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Susirašinėjimas</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">{conversationCopy.description}</p>
            <Button nativeButton={false} render={<Link href={bookingChatHref(booking)} />} className="h-auto min-h-11 w-full whitespace-normal py-3">{conversationCopy.cta}<MessageCircle aria-hidden="true" className="size-4" /></Button>
          </CardContent>
        </Card>
      </aside>
    </div>

    <BookingCompletionDialog open={confirming} onOpenChange={setConfirming} onConfirm={confirmCompletion} finalFocus={completionButton} vehicleCount={vehicleCount} />
  </div>
}
