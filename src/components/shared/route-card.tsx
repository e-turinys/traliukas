import Link from "next/link"
import { BadgeCheck, CalendarDays, Car, Star } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { buttonVariants } from "@/components/ui/button"
import { MatchBadge } from "./match-badge"
import { vehicleCategoryLabels, type RouteMatch } from "@/lib/types/carrier-route"
import { cn } from "@/lib/utils"
import type { LocationOption } from "@/lib/types/location"
import { formatDateRange } from "@/lib/format-date"

const copy = {
  verified: "Patvirtintas vežėjas", newCarrier: "Naujas vežėjas",
  spaces: "Laisvos vietos", stops: "Per", route: "Vežėjo maršrutas", segment: "Tinka jūsų kelionei",
  nonRunning: "Gali vežti nevažiuojantį automobilį", running: "Tik važiuojantys automobiliai",
  details: "Peržiūrėti maršrutą",
}

const pluralRules = new Intl.PluralRules("lt-LT")
const reviewLabels = { one: "atsiliepimas", few: "atsiliepimai", other: "atsiliepimų" }
const transportLabels = { one: "užbaigtas pervežimas", few: "užbaigti pervežimai", other: "užbaigtų pervežimų" }
function countLabel(count: number, labels: typeof reviewLabels) {
  const plural = pluralRules.select(count)
  return `${count} ${plural === "one" || plural === "few" ? labels[plural] : labels.other}`
}

type RouteCardProps = Omit<RouteMatch, "level"> & {
  level?: RouteMatch["level"]
  context?: "search" | "profile"
  servedSegment?: { from: LocationOption; to: LocationOption }
}

export function RouteCard({ route, level, servedSegment, context = "search" }: RouteCardProps) {
  const headingId = `route-${route.id}`
  const showSegment = servedSegment && (servedSegment.from.id !== route.origin.id || servedSegment.to.id !== route.destination.id)
  return (
    <article aria-labelledby={headingId}>
      <Card>
        <CardContent className="space-y-4">
          {context !== "profile" && <><div className="flex flex-wrap items-start justify-between gap-2">
            <h3 id={headingId} className="text-base font-semibold">{route.carrier.name}</h3>
            {level && <MatchBadge level={level} />}
          </div>
          <div className="space-y-1 text-sm text-muted-foreground">
            {route.carrier.verification === "approved" && <p className="flex items-center gap-1.5 text-foreground"><BadgeCheck aria-hidden="true" className="size-4" />{copy.verified}</p>}
            {route.carrier.reviewCount > 0 && route.carrier.rating !== null ? (
              <p className="flex items-center gap-1.5"><Star aria-hidden="true" className="size-4" />{route.carrier.rating.toLocaleString("lt-LT")} · {countLabel(route.carrier.reviewCount, reviewLabels)}</p>
            ) : <p>{copy.newCarrier}</p>}
            {route.carrier.completedTransports > 0 && <p>{countLabel(route.carrier.completedTransports, transportLabels)}</p>}
          </div></>}
          <div>
            <p className="mb-1 text-sm text-muted-foreground">{copy.route}</p>
            {context === "profile" ? <h3 id={headingId} className="text-lg font-semibold">{route.origin.city} → {route.destination.city}</h3> : <p className="text-lg font-semibold">{route.origin.city} → {route.destination.city}</p>}
            {route.stops.length > 0 && <p className="mt-1 text-sm text-muted-foreground">{copy.stops}: {route.stops.map((stop) => stop.city).join(" → ")}</p>}
            {showSegment && <p className="mt-2 text-sm font-medium">{copy.segment}: {servedSegment.from.city} → {servedSegment.to.city}</p>}
          </div>
          <div className="space-y-2 text-sm">
            <p className="flex items-center gap-2"><CalendarDays aria-hidden="true" className="size-4 shrink-0" /><span>{formatDateRange(route.dateFrom, route.dateTo)}</span></p>
            <p>{copy.spaces}: <strong>{route.capacityTotal - route.parvezkReserved}</strong></p>
            <p className="flex items-start gap-2"><Car aria-hidden="true" className="size-4 shrink-0" /><span>{route.vehicleCategories.map((category) => vehicleCategoryLabels[category]).join(" · ")}</span></p>
            <p className="text-muted-foreground">{route.supportsNonRunning ? copy.nonRunning : copy.running}</p>
          </div>
          <Link href={`/routes/${route.id}`} aria-label={`${copy.details}: ${route.carrier.name}, ${route.origin.city} → ${route.destination.city}`} className={cn(buttonVariants({ variant: "outline" }), "min-h-11 w-full")}>{copy.details}</Link>
        </CardContent>
      </Card>
    </article>
  )
}
