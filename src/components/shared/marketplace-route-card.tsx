import Link from "next/link"
import { ArrowRight, BadgeCheck, CalendarDays, Car, Star } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { buttonVariants } from "@/components/ui/button"
import { formatDateRange } from "@/lib/format-date"
import { getAvailableCapacity } from "@/lib/route-capacity"
import type { CarrierRoute } from "@/lib/types/carrier-route"
import { cn } from "@/lib/utils"

const copy = {
  via: "Per", direct: "Tiesioginis maršrutas", verified: "Patvirtintas vežėjas",
  newCarrier: "Naujas vežėjas", reviews: "atsiliepimų", details: "Peržiūrėti maršrutą",
}

// A discovery card without search-specific match scores or served segments.
export function MarketplaceRouteCard({ route }: { route: CarrierRoute }) {
  const spaces = getAvailableCapacity(route)
  const plural = new Intl.PluralRules("lt-LT").select(spaces)
  const spaceLabel = plural === "one" ? "laisva vieta" : plural === "few" ? "laisvos vietos" : "laisvų vietų"
  return (
    <article aria-labelledby={`discovery-${route.id}`} className="min-w-0">
      <Card className="h-full overflow-visible border border-border py-6 ring-0 transition-colors hover:border-primary/40">
        <CardContent className="flex h-full flex-col gap-5 px-6">
          <div className="space-y-2">
            <h3 id={`discovery-${route.id}`} className="text-xl font-semibold tracking-tight">
              {route.origin.city} <span className="text-primary">→</span> {route.destination.city}
            </h3>
            <p className="text-sm text-muted-foreground">{route.stops.length ? `${copy.via}: ${route.stops.map(stop => stop.city).join(" · ")}` : copy.direct}</p>
          </div>
          <div className="space-y-2 border-y py-4">
            <p className="font-medium">{route.carrier.name}</p>
            {route.carrier.verification === "approved" && <p className="flex items-center gap-2 text-sm text-primary"><BadgeCheck aria-hidden="true" className="size-4 shrink-0" />{copy.verified}</p>}
            {route.carrier.reviewCount > 0 && route.carrier.rating !== null ? (
              <p className="flex items-center gap-2 text-sm text-muted-foreground"><Star aria-hidden="true" className="size-4 shrink-0" /><span><strong className="font-medium text-foreground">{route.carrier.rating.toLocaleString("lt-LT")}</strong> · {route.carrier.reviewCount} {copy.reviews}</span></p>
            ) : <p className="text-sm text-muted-foreground">{copy.newCarrier}</p>}
          </div>
          <div className="space-y-3 text-sm">
            <p className="flex items-center gap-2 font-medium"><Car aria-hidden="true" className="size-4 shrink-0 text-primary" />{spaces} {spaceLabel}</p>
            <p className="flex items-start gap-2 text-muted-foreground"><CalendarDays aria-hidden="true" className="size-4 shrink-0" /><span>{formatDateRange(route.dateFrom, route.dateTo)}</span></p>
          </div>
          <Link href={`/routes/${route.id}`} aria-label={`${copy.details}: ${route.origin.city} → ${route.destination.city}, ${route.carrier.name}`} className={cn(buttonVariants({ variant: "outline" }), "mt-auto h-auto min-h-11 w-full gap-2 whitespace-normal px-4 py-3 text-primary hover:bg-secondary hover:text-primary")}>
            {copy.details}<ArrowRight aria-hidden="true" />
          </Link>
        </CardContent>
      </Card>
    </article>
  )
}
