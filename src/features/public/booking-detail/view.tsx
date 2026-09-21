"use client"

import Link from "next/link"
import { useRef, useState } from "react"
import { ArrowLeft, Car, Check, CircleCheck, MessageCircle, Truck } from "lucide-react"
import { CarrierTrust } from "@/components/shared/carrier-trust"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { formatDateRange } from "@/lib/format-date"
import { formatEur } from "@/lib/format-money"
import { requestCategories } from "../create-request/model"
import { requestRouteSummary, vehicleRouteLabel } from "../request-route-summary"
import { dateLabel } from "../search-query"
import { vehicleCountLabel, vehicleName, vehiclePriceScope } from "../vehicle-summary"
import {
  bookingChatHref, bookingCompletionCopy, bookingConversationCopy, bookingStatusLabel,
  canCustomerConfirmDelivery, completeDeliveredBooking, hydrateBooking, type BookingPayload,
} from "./logic"
import { BookingCompletionDialog } from "./completion-dialog"
import { BookingStatusTimeline } from "./status-timeline"

const nextStepCopy = {
  booked: "Su vežėju suderinkite paėmimo detales. Kitas etapas – paėmimo suplanavimas.",
  pickup_scheduled: "Pasiruoškite sutartam paėmimui. Kitas etapas – automobilių paėmimas.",
  collected: "Automobiliai paimti. Kitas etapas – pervežimas į pristatymo vietą.",
  in_transit: "Pervežimas vyksta. Kai vežėjas pažymės pristatymą, galėsite patvirtinti gavimą.",
  completed: "Gavimas patvirtintas. Sutartos sąlygos ir susirašinėjimo istorija lieka prieinamos.",
} as const

const conditionLabels = { running: "Važiuojantis", "non-running": "Nevažiuojantis" } as const
const rollingLabels = { yes: "Rieda", no: "Nerieda", unknown: "Riedėjimas nežinomas" } as const

function Detail({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return <div className={`min-w-0 space-y-1 ${className}`}><dt className="text-muted-foreground">{label}</dt><dd className="break-words font-medium">{children}</dd></div>
}

export function BookingDetailView({ initialBooking }: { initialBooking: BookingPayload }) {
  const [booking, setBooking] = useState(() => hydrateBooking(initialBooking))
  const [confirming, setConfirming] = useState(false)
  const completionButton = useRef<HTMLButtonElement>(null)
  const route = requestRouteSummary(booking.vehicles).compact
  const vehicleCount = booking.vehicles.length
  const completionCopy = bookingCompletionCopy(vehicleCount)
  const conversationCopy = bookingConversationCopy(booking.status)
  const canComplete = canCustomerConfirmDelivery(booking.status)
  const completed = booking.status === "completed"
  const statusHeading = useRef<HTMLHeadingElement>(null)

  const confirmCompletion = () => {
    setBooking(current => completeDeliveredBooking(current))
    setConfirming(false)
  }

  return <div className="mx-auto w-full max-w-6xl space-y-6 pb-8">
    <Link href={completed ? "/dashboard?view=history" : "/dashboard?view=transport"} className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
      <ArrowLeft aria-hidden="true" className="size-4" />{completed ? "Grįžti į istoriją" : "Grįžti į skydelį"}
    </Link>

    <header className="flex min-w-0 flex-col items-start justify-between gap-6 rounded-xl border bg-card p-4 sm:flex-row sm:items-end sm:p-6">
      <div className="min-w-0 flex-1 space-y-3">
        <p className="text-sm text-muted-foreground">Jūsų pervežimas</p>
        <h1 className="break-words text-3xl font-semibold tracking-tight sm:text-4xl">{route}</h1>
        <Badge variant="secondary" className="h-auto whitespace-normal py-1">{completed ? <CircleCheck aria-hidden="true" /> : <Truck aria-hidden="true" />}{bookingStatusLabel(booking.status, vehicleCount)}</Badge>
        <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
          <p className="break-words font-medium text-foreground">{booking.carrier.name}</p>
          <p className="flex items-center gap-2"><Car aria-hidden="true" className="size-4 shrink-0" />{vehicleCountLabel(vehicleCount)}</p>
        </div>
      </div>
      <div className="min-w-0 space-y-2">
        <p className="text-4xl leading-tight font-semibold tracking-tight tabular-nums sm:text-5xl">{formatEur(booking.agreedTotalPrice)}</p>
        <p className="text-sm text-muted-foreground">Sutarta bendra kaina</p>
      </div>
    </header>

    <Card className="border py-0 shadow-none ring-0"><CardContent className="space-y-6 p-4 sm:p-6">
      <h2 className="text-xl font-semibold">Pervežimo eiga</h2>
      <BookingStatusTimeline status={booking.status} vehicleCount={vehicleCount} />
      <div className="flex flex-col gap-4 border-t pt-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0 space-y-2" role="status">
          <h3 ref={statusHeading} tabIndex={-1} className="font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">{completed ? "Pervežimas užbaigtas" : canComplete ? "Patvirtinkite gavimą" : "Kas toliau?"}</h3>
          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">{booking.status === "delivered" ? completionCopy.cardDescription : booking.status === "collected" && vehicleCount === 1 ? "Automobilis paimtas. Kitas etapas – pervežimas į pristatymo vietą." : booking.status === "pickup_scheduled" && vehicleCount === 1 ? "Pasiruoškite sutartam paėmimui. Kitas etapas – automobilio paėmimas." : nextStepCopy[booking.status]}</p>
        </div>
        {canComplete ? <Button ref={completionButton} className="h-auto min-h-11 w-full whitespace-normal py-3 lg:w-auto lg:max-w-sm" onClick={() => setConfirming(true)}>{completionCopy.cta}<Check aria-hidden="true" /></Button> : <Button nativeButton={false} variant="outline" render={<Link href={bookingChatHref(booking)} />} className="h-auto min-h-11 w-full whitespace-normal py-3 lg:w-auto lg:shrink-0">{conversationCopy.cta}<MessageCircle aria-hidden="true" /></Button>}
      </div>
    </CardContent></Card>

    <div className="grid min-w-0 items-start gap-6 lg:grid-cols-3">
      <div className="min-w-0 space-y-6 lg:col-span-2">
        <Card className="border py-0 shadow-none ring-0"><CardContent className="space-y-5 p-4 sm:p-6">
          <h2 className="text-xl font-semibold">Sutartas pervežimas</h2>
          <dl className="grid gap-5 text-sm sm:grid-cols-2">
            <Detail label="Planuojamas paėmimas">{formatDateRange(booking.plannedPickup)}</Detail>
            <Detail label="Planuojamas pristatymas">{formatDateRange(booking.plannedDelivery)}</Detail>
            <Detail label="Pageidautas paėmimas" className="border-t pt-4 sm:col-span-2">{dateLabel(booking.requestedPickupWindow)}</Detail>
          </dl>
          <p className="text-sm leading-relaxed text-muted-foreground">Sąlygos sutartos priimant vežėjo pasiūlymą.</p>
        </CardContent></Card>

        <section aria-labelledby="vehicles-heading" className="space-y-4">
          <h2 id="vehicles-heading" className="text-xl font-semibold">Automobiliai ({booking.vehicles.length})</h2>
          <div className={`grid gap-4 ${vehicleCount > 1 ? "sm:grid-cols-2" : ""}`}>
            {booking.vehicles.map(vehicle => <Card key={vehicle.id} className="border py-0 shadow-none ring-0">
              <CardContent className="space-y-4 p-4 sm:p-6">
                <div className="flex items-start gap-3"><span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted"><Car aria-hidden="true" className="size-5 text-muted-foreground" /></span><div className="min-w-0 space-y-1">
                <h3 className="break-words text-lg font-semibold">{vehicleName(vehicle)}</h3>
                <p className="break-words text-sm font-medium">{vehicleRouteLabel(vehicle)}</p>
                </div></div>
                <dl className="grid grid-cols-2 gap-4 border-t pt-4 text-sm">
                  <Detail label="Kategorija">{vehicle.category ? requestCategories[vehicle.category] : "Nenurodyta"}</Detail>
                  {vehicle.year && <Detail label="Metai">{vehicle.year}</Detail>}
                  <Detail label="Būklė">{vehicle.condition ? conditionLabels[vehicle.condition] : "Nenurodyta"}</Detail>
                  {vehicle.condition === "non-running" && vehicle.rolls && <Detail label="Riedėjimas">{rollingLabels[vehicle.rolls]}</Detail>}
                  <Detail label="Paėmimo vieta" className="col-span-2 border-t pt-4">{vehicle.pickupLocation?.city ?? "Nenurodyta"}</Detail>
                  <Detail label="Pristatymo vieta" className="col-span-2">{vehicle.deliveryLocation?.city ?? "Nenurodyta"}</Detail>
                </dl>
              </CardContent>
            </Card>)}
          </div>
        </section>
      </div>

      <aside className="min-w-0 space-y-6 lg:sticky lg:top-24">
        <Card className="border py-0 shadow-none ring-0">
          <CardContent className="space-y-4 p-4 sm:p-6">
            <h2 className="text-xl font-semibold">Vežėjas</h2>
            <h3 className="break-words text-lg font-semibold">{booking.carrier.name}</h3>
            <CarrierTrust carrier={booking.carrier} />
            <Button nativeButton={false} variant="outline" render={<Link href={`/carriers/${encodeURIComponent(booking.carrierId)}`} />} className="h-auto min-h-11 w-full whitespace-normal py-3">Peržiūrėti vežėjo profilį</Button>
          </CardContent>
        </Card>

        <Card className="border py-0 shadow-none ring-0">
          <CardContent className="space-y-4 p-4 sm:p-6">
            <h2 className="text-xl font-semibold">Kaina ir apmokėjimas</h2>
            <div>
              <p className="text-2xl font-semibold">{formatEur(booking.agreedTotalPrice)}</p>
              <p className="text-sm text-muted-foreground">{booking.vehicles.length === 1 ? "Visa pervežimo kaina" : `Visa pervežimo kaina už ${vehiclePriceScope(booking.vehicles.length)}`}</p>
            </div>
            <dl className="text-sm"><Detail label="Apmokėjimo sąlygos">{booking.paymentTerms}</Detail></dl>
          </CardContent>
        </Card>

        <Card className="border py-0 shadow-none ring-0">
          <CardContent className="space-y-4 p-4 sm:p-6">
            <h2 className="text-xl font-semibold">Susirašinėjimas</h2>
            <p className="text-sm text-muted-foreground">{conversationCopy.description}</p>
            <Button nativeButton={false} render={<Link href={bookingChatHref(booking)} />} className="h-auto min-h-11 w-full whitespace-normal py-3">{conversationCopy.cta}<MessageCircle aria-hidden="true" className="size-4" /></Button>
          </CardContent>
        </Card>
      </aside>
    </div>

    <BookingCompletionDialog open={confirming} onOpenChange={setConfirming} onConfirm={confirmCompletion} finalFocus={completed ? statusHeading : completionButton} vehicleCount={vehicleCount} />
  </div>
}
