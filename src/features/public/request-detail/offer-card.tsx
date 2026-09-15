import Link from "next/link"
import { CarrierTrust } from "@/components/shared/carrier-trust"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { formatDateRange } from "@/lib/format-date"
import { formatOfferExpiry } from "./logic"
import { offerStatusLabels, type RequestOffer } from "./model"
import { vehiclePriceScope } from "../vehicle-summary"

export function OfferCard({ offer, status, vehicleCount, emphasis = "standard" }: {
  offer: RequestOffer; status: RequestOffer["status"]; vehicleCount: number; emphasis?: "standard" | "selected" | "historical"
}) {
  const actionable = status === "pending"
  const selected = emphasis === "selected"
  const historical = emphasis === "historical"
  return <Card className={selected ? "min-w-0 border-primary/50 shadow-sm" : actionable ? "min-w-0" : "min-w-0 bg-muted/40"}>
    <CardContent className={historical ? "space-y-4" : "space-y-5"}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-2">
          <h3 className={`break-words font-semibold ${historical ? "text-base" : "text-lg"}`}>{offer.carrier.name}</h3>
          <CarrierTrust carrier={offer.carrier} />
        </div>
        <div className="space-y-1">
          <p className={historical ? "font-semibold" : "text-xl font-semibold"}>{new Intl.NumberFormat("lt-LT", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(offer.totalPriceEur)}</p>
          <p className="text-xs text-muted-foreground">{vehicleCount === 1 ? "Visa pervežimo kaina" : `Visa pervežimo kaina už ${vehiclePriceScope(vehicleCount)}`}</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Badge variant={selected ? "default" : "secondary"}>{offerStatusLabels[status]}</Badge>
        {offer.offerVersion > 1 && <Badge variant="outline">Atnaujintas pasiūlymas</Badge>}
      </div>
      <dl className="grid gap-3 text-sm sm:grid-cols-2">
        <div className="min-w-0"><dt className="text-muted-foreground">Paėmimas</dt><dd>{formatDateRange(offer.pickupDate)}</dd></div>
        <div className="min-w-0"><dt className="text-muted-foreground">Planuojamas pristatymas</dt><dd>{formatDateRange(offer.deliveryDate)}</dd></div>
        <div className="min-w-0 sm:col-span-2"><dt className="text-muted-foreground">Pasiūlymas galioja iki</dt><dd>{formatOfferExpiry(offer.expiresAt)} <span className="text-muted-foreground">(Lietuvos laiku)</span></dd></div>
      </dl>
      {actionable && <Button nativeButton={false} render={<Link href={`/offers/${encodeURIComponent(offer.id)}`} />} className="h-auto min-h-11 w-full py-3 whitespace-normal">Peržiūrėti pasiūlymą</Button>}
    </CardContent>
  </Card>
}
