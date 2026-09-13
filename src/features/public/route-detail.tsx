import Link from "next/link"
import { ArrowLeft, BadgeCheck, CalendarDays, Car, Star } from "lucide-react"
import { PageContainer } from "@/components/layout/page-container"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { CarrierTrust } from "@/components/shared/carrier-trust"
import { RouteStopList } from "@/components/shared/route-stop-list"
import { formatDateRange } from "@/lib/format-date"
import { formatCount } from "@/lib/format-count"
import { mockCarrierReviews } from "@/lib/mock/carrier-reviews"
import { vehicleCategoryLabels, type CarrierRoute } from "@/lib/types/carrier-route"
import { routeAvailability, routeRequestHref } from "./route-detail-context"

const copy = {
  back: "Ieškoti maršrutų",
  route: "Vežėjo maršrutas", planned: "Planuojamas vežėjo maršrutas", via: "Per",
  dates: "Maršruto datos", capacity: "Laisvos vietos", stops: "Maršruto eiga",
  stopHint: "Paėmimas ir pristatymas galimi maršruto sustojimuose pagal kelionės kryptį. Konkrečias vietas ir laiką suderinsite su vežėju.",
  compatibility: "Ką gali vežti", nonRunning: "Gali vežti nevažiuojantį automobilį",
  runningOnly: "Nevažiuojančių automobilių neveža", loadingHint: "Nevažiuojančio automobilio pakrovimo galimybes suderinkite su vežėju.",
  carrier: "Vežėjas", profile: "Peržiūrėti vežėjo profilį", quote: "Gauti pasiūlymą iš šio vežėjo",
  otherQuotes: "Gauti pasiūlymų iš kitų vežėjų", next: "Kitas žingsnis",
  targetedHint: "Pateikite automobilio pervežimo užklausą šiam vežėjui. Vežėjas pasiūlyme patvirtins datas, kainą ir sąlygas.",
  fallbackHint: "Pateikite užklausą kitiems vežėjams. Maršruto vietos ir datos bus perkeltos į užklausą.",
  reviews: "Klientų atsiliepimai", reviewHint: "Apie ankstesnius užbaigtus šio vežėjo pervežimus.",
  verifiedReview: "Patvirtintas pervežimas", noReviews: "Šis vežėjas dar neturi klientų atsiliepimų.",
}

function QuoteLink({ href, available }: { href: string; available: boolean }) {
  return <Button nativeButton={false} render={<Link href={href} />} className="h-auto min-h-11 w-full px-4 py-3 text-center whitespace-normal">
    {available ? copy.quote : copy.otherQuotes}
  </Button>
}

export function RouteDetail({ route, today }: { route: CarrierRoute; today: string }) {
  const availability = routeAvailability(route, today)
  const requestUrl = routeRequestHref(route, availability.available)
  const reviews = mockCarrierReviews.filter((review) => review.carrierId === route.carrier.id && review.bookingStatus === "completed").slice(0, 2)

  return <div>
    <PageContainer className="space-y-8 pt-6 pb-28 sm:pt-8 lg:pb-12">
      <div className="space-y-3">
        <Button variant="ghost" nativeButton={false} render={<Link href={`/search?from=${route.origin.id}&to=${route.destination.id}`} />} className="min-h-11"><ArrowLeft aria-hidden="true" />{copy.back}</Button>
      </div>

      <header className="space-y-4">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">{copy.route}</p>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{route.origin.city} → {route.destination.city}</h1>
          {route.stops.length > 0 && <p className="text-muted-foreground">{copy.via}: {route.stops.map((stop) => stop.city).join(" → ")}</p>}
          <p className="text-sm text-muted-foreground">{copy.planned}</p>
        </div>
        <dl className="grid gap-4 rounded-xl border bg-muted/30 p-5 sm:grid-cols-2">
          <div className="space-y-2">
            <dt className="text-sm text-muted-foreground">{copy.dates}</dt>
            <dd className="flex items-start gap-2 font-medium"><CalendarDays aria-hidden="true" className="mt-0.5 size-5 shrink-0" />{formatDateRange(route.dateFrom, route.dateTo)}</dd>
          </div>
          <div className="space-y-2">
            <dt className="text-sm text-muted-foreground">{copy.capacity}</dt>
            <dd className="font-medium">{availability.label}</dd>
          </div>
        </dl>
      </header>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="min-w-0 space-y-6">
          <section aria-labelledby="route-stops-heading">
            <Card><CardContent className="space-y-5">
              <h2 id="route-stops-heading" className="text-xl font-semibold">{copy.stops}</h2>
              <RouteStopList stops={[route.origin, ...route.stops, route.destination]} />
              <p className="text-sm leading-relaxed text-muted-foreground">{copy.stopHint}</p>
            </CardContent></Card>
          </section>
          <section aria-labelledby="vehicle-heading">
            <Card><CardContent className="space-y-4">
              <h2 id="vehicle-heading" className="text-xl font-semibold">{copy.compatibility}</h2>
              <ul className="grid gap-3 sm:grid-cols-2">
                {route.vehicleCategories.map((category) => <li key={category} className="flex items-center gap-2"><Car aria-hidden="true" className="size-5 shrink-0 text-muted-foreground" />{vehicleCategoryLabels[category]}</li>)}
              </ul>
              <div className="space-y-2 border-t pt-4">
                <p className="font-medium">{route.supportsNonRunning ? copy.nonRunning : copy.runningOnly}</p>
                {route.supportsNonRunning && <p className="text-sm text-muted-foreground">{copy.loadingHint}</p>}
              </div>
            </CardContent></Card>
          </section>
        </div>

        <aside className="min-w-0 lg:sticky lg:top-6" aria-labelledby="carrier-heading">
          <Card><CardContent className="space-y-5">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">{copy.carrier}</p>
              <h2 id="carrier-heading" className="text-xl font-semibold">{route.carrier.name}</h2>
              <CarrierTrust carrier={route.carrier} />
            </div>
            <Button variant="outline" nativeButton={false} render={<Link href={`/carriers/${route.carrier.id}`} />} className="h-auto min-h-11 w-full py-3 whitespace-normal">{copy.profile}</Button>
            <div className="space-y-3 border-t pt-5">
              <h3 className="font-semibold">{copy.next}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{availability.available ? copy.targetedHint : copy.fallbackHint}</p>
              <div className="hidden lg:block"><QuoteLink href={requestUrl} available={availability.available} /></div>
            </div>
          </CardContent></Card>
        </aside>
      </div>

      <section aria-labelledby="reviews-heading" className="space-y-5 border-t pt-8">
        <div className="space-y-2">
          <h2 id="reviews-heading" className="text-xl font-semibold">{copy.reviews}</h2>
          <p className="text-sm text-muted-foreground">{copy.reviewHint}</p>
          {route.carrier.reviewCount > 0 && route.carrier.rating !== null && <p className="flex items-center gap-2 text-sm"><Star aria-hidden="true" className="size-4" />{route.carrier.rating.toLocaleString("lt-LT")} · {formatCount(route.carrier.reviewCount, { one: "atsiliepimas", few: "atsiliepimai", other: "atsiliepimų" })}</p>}
        </div>
        {reviews.length > 0 ? <ul className="grid gap-4 md:grid-cols-2">
          {reviews.map((review) => <li key={review.id}>
            <Card className="h-full"><CardContent className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="font-medium">{review.author}</h3><span className="flex items-center gap-1 text-sm"><Star aria-hidden="true" className="size-4" />{review.rating} / 5</span></div>
              <blockquote className="text-sm leading-relaxed">{review.comment}</blockquote>
              <p className="flex items-center gap-1.5 text-sm text-muted-foreground"><BadgeCheck aria-hidden="true" className="size-4 shrink-0" />{copy.verifiedReview}</p>
              <time dateTime={review.completedOn} className="text-xs text-muted-foreground">{formatDateRange(review.completedOn)}</time>
            </CardContent></Card>
          </li>)}
        </ul> : <p className="text-sm text-muted-foreground">{copy.noReviews}</p>}
      </section>
    </PageContainer>

    <div className="sticky bottom-0 z-20 border-t bg-background pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:hidden">
      <PageContainer><QuoteLink href={requestUrl} available={availability.available} /></PageContainer>
    </div>
  </div>
}
