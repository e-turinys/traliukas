import Link from "next/link"
import { CarrierTrust } from "@/components/shared/carrier-trust"
import { ArrowRight, CircleCheck, Clock3, MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { formatDateRange } from "@/lib/format-date"
import { formatOfferExpiry } from "./logic"
import { offerStatusLabels, type RequestOffer } from "./model"
import { vehiclePriceScope } from "../vehicle-summary"

export function OfferCard({ offer, status, vehicleCount, emphasis = "standard", conversation }: {
  offer: RequestOffer; status: RequestOffer["status"]; vehicleCount: number; emphasis?: "standard" | "selected" | "historical"
  conversation?: { id: string; canSend: boolean }
}) {
  const actionable = status === "pending"
  const selected = emphasis === "selected"
  const historical = emphasis === "historical"
  return <Card className={`min-w-0 border py-0 shadow-none ring-0 ${selected ? "border-primary/40 bg-secondary/30" : actionable ? "bg-card" : "bg-background"}`}>
    <CardContent className="space-y-4 p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-2">
          <h3 className={`break-words font-semibold ${historical ? "text-base" : "text-lg"}`}>{offer.carrier.name}</h3>
          <CarrierTrust carrier={offer.carrier} />
        </div>
        <div className="space-y-1">
          <p className={`font-semibold tracking-tight tabular-nums ${historical ? "text-2xl" : "text-3xl"}`}>{new Intl.NumberFormat("lt-LT", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(offer.totalPriceEur)}</p>
          <p className="text-sm text-muted-foreground">{vehicleCount === 1 ? "Visa pervežimo kaina" : `Visa pervežimo kaina už ${vehiclePriceScope(vehicleCount)}`}</p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
        <p className={`flex items-center gap-2 font-medium ${selected || actionable ? "text-primary" : "text-muted-foreground"}`}>{selected ? <CircleCheck aria-hidden="true" className="size-4 shrink-0" /> : actionable ? <Clock3 aria-hidden="true" className="size-4 shrink-0" /> : null}{offerStatusLabels[status]}</p>
        {offer.offerVersion > 1 && <p className="font-medium">Atnaujintas pasiūlymas</p>}
      </div>
      <dl className="grid gap-4 border-t pt-4 text-sm sm:grid-cols-2">
        <div className="min-w-0"><dt className="text-muted-foreground">Paėmimas</dt><dd>{formatDateRange(offer.pickupDate)}</dd></div>
        <div className="min-w-0"><dt className="text-muted-foreground">Planuojamas pristatymas</dt><dd>{formatDateRange(offer.deliveryDate)}</dd></div>
        <div className="min-w-0 sm:col-span-2"><dt className="text-muted-foreground">Pasiūlymas galioja iki</dt><dd>{formatOfferExpiry(offer.expiresAt)} <span className="text-muted-foreground">(Lietuvos laiku)</span></dd></div>
        {offer.paymentTerms && <div className="min-w-0 sm:col-span-2"><dt className="text-muted-foreground">Apmokėjimas</dt><dd className="break-words">{offer.paymentTerms}</dd></div>}
      </dl>
      {actionable && <Button nativeButton={false} render={<Link href={`/offers/${encodeURIComponent(offer.id)}`} />} className="h-auto min-h-11 w-full py-3 whitespace-normal">Peržiūrėti pasiūlymą<ArrowRight aria-hidden="true" /></Button>}
      {conversation && <Button nativeButton={false} variant="outline" render={<Link href={`/messages/${encodeURIComponent(conversation.id)}`} />} className="h-auto min-h-11 w-full py-3 whitespace-normal">
        <MessageSquare aria-hidden="true" />{conversation.canSend ? "Rašyti vežėjui" : "Peržiūrėti pokalbį"}
      </Button>}
    </CardContent>
  </Card>
}
