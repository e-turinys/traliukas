"use client"

import Link from "next/link"
import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { commandClient, commandError } from "../marketplace-persistence/client"
import { BookingOperations } from "./operations"
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
  bookingCommandResult,
} from "./logic"
import type { Booking } from "@/lib/types/booking"
import { BookingCompletionDialog } from "./completion-dialog"
import { BookingStatusTimeline } from "./status-timeline"

const nextStepCopy = {
  booked: "Su vežėju suderinkite paėmimo detales. Kitas etapas – paėmimo suplanavimas.",
  pickup_scheduled: "Pasiruoškite sutartam paėmimui. Kitas etapas – automobilių paėmimas.",
  collected: "Automobiliai paimti. Kitas etapas – pervežimas į pristatymo vietą.",
  in_transit: "Pervežimas vyksta. Kai vežėjas pažymės pristatymą, galėsite patvirtinti gavimą.",
  completed: "Gavimas patvirtintas. Sutartos sąlygos ir susirašinėjimo istorija lieka prieinamos.",
  cancelled: "Pervežimas atšauktas. Sutartos sąlygos ir pokalbio istorija lieka prieinamos. Rezervuota maršruto talpa atlaisvinta.",
} as const

const conditionLabels = { running: "Važiuojantis", "non-running": "Nevažiuojantis" } as const
const rollingLabels = { yes: "Rieda", no: "Nerieda", unknown: "Riedėjimas nežinomas" } as const

function Detail({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return <div className={`min-w-0 space-y-1 ${className}`}><dt className="text-muted-foreground">{label}</dt><dd className="break-words font-medium">{children}</dd></div>
}

export function BookingDetailView({ initialBooking }: { initialBooking: BookingPayload }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [booking, setBooking] = useState(() => hydrateBooking(initialBooking))
  const [confirming, setConfirming] = useState(false)
  const completionButton = useRef<HTMLButtonElement>(null)
  const route = requestRouteSummary(booking.vehicles).compact
  const vehicleCount = booking.vehicles.length
  const completionCopy = bookingCompletionCopy(vehicleCount)
  const conversationCopy = bookingConversationCopy(booking.status)
  const canComplete = canCustomerConfirmDelivery(booking.status) && booking.viewer !== "carrier"
  const isCarrier = booking.viewer === "carrier"
  const completed = booking.status === "completed"
  const historical = completed || booking.status === "cancelled"
  const statusHeading = useRef<HTMLHeadingElement>(null)

  const confirmCompletion = async () => {
    if (busy) return
    setBusy(true); setError("")
    try {
      if (booking.statusVersion) {
        const client = await commandClient()
        const result = await client.rpc("transition_booking", { p_booking_id: booking.id, p_expected_version: booking.statusVersion, p_next_status: "completed" })
        if (result.error) throw result.error
        setBooking(current => ({ ...current, ...bookingCommandResult(result.data, booking.id) }))
      } else {
        setBooking(current => completeDeliveredBooking(current))
      }
      setConfirming(false)
      if (booking.statusVersion) router.refresh()
    } catch (cause) { setError(commandError(cause)) }
    finally { setBusy(false) }
  }

  return <div className="mx-auto w-full max-w-6xl space-y-6 pb-8">
    <Link href={booking.viewer === "carrier" ? "/carrier/bookings" : historical ? "/dashboard?tab=history" : "/dashboard?tab=transports"} className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
      <ArrowLeft aria-hidden="true" className="size-4" />{booking.viewer === "carrier" ? "Grįžti į pervežimus" : historical ? "Grįžti į istoriją" : "Grįžti į skydelį"}
    </Link>

    <header className="min-w-0 space-y-3 rounded-xl border bg-card p-4 sm:p-6">
      <p className="text-sm text-muted-foreground">{isCarrier ? "Pervežimo valdymas" : "Jūsų pervežimas"}</p>
      <h1 className="break-words text-3xl font-semibold tracking-tight sm:text-4xl">{route}</h1>
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <Badge variant="secondary" className="h-auto whitespace-normal py-1">{completed ? <CircleCheck aria-hidden="true" /> : <Truck aria-hidden="true" />}{bookingStatusLabel(booking.status, vehicleCount)}</Badge>
        <span className="text-muted-foreground">{vehicleCountLabel(vehicleCount)}</span>
      </div>
      {isCarrier && <p className="break-words text-sm text-muted-foreground">Užsakymo nr. {booking.id}</p>}
    </header>

    <Card className="border py-0 shadow-none ring-0"><CardContent className="space-y-5 p-4 sm:p-6">
      <h2 className="text-xl font-semibold">Pervežimo eiga</h2>
      <BookingStatusTimeline status={booking.status} vehicleCount={vehicleCount} />
    </CardContent></Card>

    {!isCarrier && <Card className="border py-0 shadow-none ring-0"><CardContent className="grid gap-6 p-4 sm:p-6 md:grid-cols-2">
      <div className="min-w-0 space-y-2">
        <h2 className="text-sm text-muted-foreground">Pasirinktas vežėjas</h2>
        <p className="break-words text-lg font-semibold">{booking.carrier.name}</p>
        <CarrierTrust carrier={booking.carrier} />
        <Link href={`/carriers/${encodeURIComponent(booking.carrierId)}`} className="inline-flex min-h-11 items-center text-sm font-medium underline underline-offset-4">Peržiūrėti vežėjo profilį</Link>
      </div>
      <AgreedPrice booking={booking} />
    </CardContent></Card>}

    {(!isCarrier || booking.status === "delivered" || historical) && <section className="space-y-3 rounded-xl border bg-card p-4 sm:p-6" aria-labelledby="next-step-heading">
      <div className="space-y-2" role="status">
        <h2 id="next-step-heading" ref={statusHeading} tabIndex={-1} className="text-xl font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">{completed ? "Pervežimas užbaigtas" : canComplete ? "Patvirtinkite gavimą" : historical ? "Pervežimas atšauktas" : "Kas toliau?"}</h2>
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">{booking.status === "delivered" ? isCarrier ? "Laukiama kliento gavimo patvirtinimo." : completionCopy.cardDescription : booking.status === "collected" && vehicleCount === 1 ? "Automobilis paimtas. Kitas etapas – pervežimas į pristatymo vietą." : booking.status === "pickup_scheduled" && vehicleCount === 1 ? "Pasiruoškite sutartam paėmimui. Kitas etapas – automobilio paėmimas." : nextStepCopy[booking.status]}</p>
      </div>
      {canComplete && <Button ref={completionButton} className="h-auto min-h-11 whitespace-normal py-3" onClick={() => setConfirming(true)}>{completionCopy.cta}<Check aria-hidden="true" /></Button>}
      {!isCarrier && <BookingOperations booking={booking} onSaved={state => setBooking(current => ({ ...current, ...state }))} />}
    </section>}

    {isCarrier && <BookingOperations booking={booking} onSaved={state => setBooking(current => ({ ...current, ...state }))} />}

    <section aria-labelledby="vehicles-heading" className="space-y-4">
      <h2 id="vehicles-heading" className="text-xl font-semibold">Automobiliai ({vehicleCount})</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        {booking.vehicles.map(vehicle => {
          const pickup = booking.pickups?.find(item => item.vehicle_id === vehicle.id)
          return <Card key={vehicle.id} className="border py-0 shadow-none ring-0"><CardContent className="space-y-4 p-4 sm:p-6">
            <div className="flex items-start gap-3">
              <Car aria-hidden="true" className="mt-1 size-5 shrink-0 text-muted-foreground" />
              <div className="min-w-0 space-y-1">
                <h3 className="break-words text-lg font-semibold">{vehicleName(vehicle)}</h3>
                <p className="break-words text-sm font-medium">{vehicleRouteLabel(vehicle)}</p>
              </div>
            </div>
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <Detail label="Kategorija">{vehicle.category ? requestCategories[vehicle.category] : "Nenurodyta"}</Detail>
              {vehicle.year && <Detail label="Metai">{vehicle.year}</Detail>}
              <Detail label="Būklė">{vehicle.condition ? conditionLabels[vehicle.condition] : "Nenurodyta"}</Detail>
              {vehicle.condition === "non-running" && vehicle.rolls && <Detail label="Riedėjimas">{rollingLabels[vehicle.rolls]}</Detail>}
            </dl>
            {pickup && <div className="space-y-2 break-words border-t pt-4 text-sm">
              <h4 className="font-semibold">Suderintas paėmimas</h4>
              <p>{pickup.street}</p>
              <p>{pickup.contact_name} · {pickup.contact_phone}</p>
              <p>{new Date(pickup.scheduled_from).toLocaleString("lt-LT", { timeZone: "UTC" })} – {new Date(pickup.scheduled_to).toLocaleString("lt-LT", { timeZone: "UTC" })} (UTC)</p>
            </div>}
          </CardContent></Card>
        })}
      </div>
    </section>

    <Card className="border py-0 shadow-none ring-0"><CardContent className="space-y-5 p-4 sm:p-6">
      <h2 className="text-xl font-semibold">Sutartos sąlygos</h2>
      {isCarrier && <AgreedPrice booking={booking} />}
      <dl className="grid gap-4 text-sm sm:grid-cols-3">
        <Detail label="Planuojamas paėmimas">{formatDateRange(booking.plannedPickup)}</Detail>
        <Detail label="Planuojamas pristatymas">{formatDateRange(booking.plannedDelivery)}</Detail>
        <Detail label="Pageidautas paėmimas">{dateLabel(booking.requestedPickupWindow)}</Detail>
      </dl>
    </CardContent></Card>

    <section aria-labelledby="chat-heading" className="flex flex-col gap-4 border-t pt-6 sm:flex-row sm:items-center sm:justify-between">
      <div className="space-y-1">
        <h2 id="chat-heading" className="text-xl font-semibold">Susirašinėjimas</h2>
        <p className="text-sm text-muted-foreground">{isCarrier && !historical ? "Suderinkite pervežimo detales su klientu." : conversationCopy.description}</p>
      </div>
      <Button nativeButton={false} variant="outline" render={<Link href={bookingChatHref(booking)} />} className="h-auto min-h-11 whitespace-normal py-3 sm:shrink-0">{conversationCopy.cta}<MessageCircle aria-hidden="true" className="size-4" /></Button>
    </section>

    <BookingCompletionDialog open={confirming} onOpenChange={setConfirming} onConfirm={() => void confirmCompletion()} busy={busy} error={error} finalFocus={completed ? statusHeading : completionButton} vehicleCount={vehicleCount} />
  </div>
}

function AgreedPrice({ booking }: { booking: Booking }) {
  return <div className="min-w-0 space-y-2">
    <p className="text-sm text-muted-foreground">Sutarta bendra kaina</p>
    <p className="text-2xl font-semibold tabular-nums">{formatEur(booking.agreedTotalPrice)}</p>
    <p className="text-sm text-muted-foreground">{booking.vehicles.length === 1 ? "Visa pervežimo kaina" : `Visa pervežimo kaina už ${vehiclePriceScope(booking.vehicles.length)}`}</p>
    <dl className="text-sm"><Detail label="Apmokėjimo sąlygos">{booking.paymentTerms}</Detail></dl>
  </div>
}
