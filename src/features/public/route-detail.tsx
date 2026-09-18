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
  runningOnly: "Tik važiuojantys automobiliai", loadingHint: "Nevažiuojančio automobilio pakrovimo galimybes suderinkite su vežėju.",
  carrier: "Vežėjas", profile: "Peržiūrėti vežėjo profilį", quote: "Gauti pasiūlymą iš šio vežėjo",
  otherQuotes: "Gauti pasiūlymų iš kitų vežėjų", next: "Kitas žingsnis",
  targetedHint: "Pateikite automobilio pervežimo užklausą šiam vežėjui. Vežėjas pasiūlyme patvirtins datas, kainą ir sąlygas.",
  fallbackHint: "Pateikite užklausą kitiems vežėjams. Maršruto vietos ir datos bus perkeltos į užklausą.",
  fullHint: "Šis maršrutas pilnas ir naujos užklausos jam nepriimamos.",
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

  return <div className="marketplace-theme bg-background text-foreground">
    <PageContainer className="space-y-6 py-6 sm:space-y-8 sm:py-8 lg:pb-12">
      <div className="space-y-3">
        <Button variant="ghost" nativeButton={false} render={<Link href={`/search?from=${route.origin.id}&to=${route.destination.id}`} />} className="h-auto min-h-11 whitespace-normal text-muted-foreground"><ArrowLeft aria-hidden="true" />{copy.back}</Button>
      </div>

      <header className="space-y-4">
        <div className="space-y-2">
          <p className="text-sm font-medium text-primary">{copy.route}</p>
          <h1 className="text-3xl leading-tight font-semibold tracking-tight sm:text-4xl">{route.origin.city} <span className="text-primary">→</span> {route.destination.city}</h1>
          {route.stops.length > 0 && <p className="text-muted-foreground">{copy.via}: {route.stops.map((stop) => stop.city).join(" · ")}</p>}
          <p className="text-sm text-muted-foreground">{copy.planned}</p>
        </div>
        <dl className="flex flex-wrap gap-x-8 gap-y-4 border-t pt-4">
          <div className="space-y-2">
            <dt className="text-sm text-muted-foreground">{copy.dates}</dt>
            <dd className="flex items-start gap-2 font-medium"><CalendarDays aria-hidden="true" className="size-5 shrink-0 text-primary" />{formatDateRange(route.dateFrom, route.dateTo)}</dd>
          </div>
          <div className="space-y-2">
            <dt className="text-sm text-muted-foreground">{copy.capacity}</dt>
            <dd className="flex items-start gap-2 font-medium"><Car aria-hidden="true" className="size-5 shrink-0 text-primary" />{availability.label}</dd>
          </div>
        </dl>
      </header>

      <div className="grid items-start gap-6 lg:grid-cols-3 lg:gap-8">
        <div className="min-w-0 space-y-6 lg:col-span-2">
          <section aria-labelledby="route-stops-heading">
            <Card className="overflow-visible border py-6 ring-0"><CardContent className="space-y-6 px-6">
              <h2 id="route-stops-heading" className="text-xl font-semibold">{copy.stops}</h2>
              <RouteStopList stops={[route.origin, ...route.stops, route.destination]} />
              <p className="text-sm leading-relaxed text-muted-foreground">{copy.stopHint}</p>
            </CardContent></Card>
          </section>
          <section aria-labelledby="vehicle-heading">
            <Card className="overflow-visible border py-6 ring-0"><CardContent className="space-y-4 px-6">
              <h2 id="vehicle-heading" className="text-xl font-semibold">{copy.compatibility}</h2>
              <ul className="grid gap-3 sm:grid-cols-2">
                {route.vehicleCategories.map((category) => <li key={category} className="flex items-start gap-2 rounded-lg bg-muted/50 p-3"><Car aria-hidden="true" className="size-5 shrink-0 text-primary" />{vehicleCategoryLabels[category]}</li>)}
              </ul>
              <div className="space-y-2 border-t pt-4">
                <p className="font-medium">{route.supportsNonRunning ? copy.nonRunning : copy.runningOnly}</p>
                {route.supportsNonRunning && <p className="text-sm text-muted-foreground">{copy.loadingHint}</p>}
              </div>
            </CardContent></Card>
          </section>
          <section aria-labelledby="carrier-heading">
          <Card className="overflow-visible border py-6 ring-0"><CardContent className="space-y-4 px-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">{copy.carrier}</p>
              <h2 id="carrier-heading" className="text-xl font-semibold">{route.carrier.name}</h2>
              <div className="pt-2 [&_svg]:text-primary"><CarrierTrust carrier={route.carrier} /></div>
            </div>
            <Button variant="outline" nativeButton={false} render={<Link href={`/carriers/${route.carrier.id}`} />} className="h-auto min-h-11 w-full px-4 py-3 whitespace-normal text-primary hover:bg-secondary hover:text-primary sm:w-auto">{copy.profile}</Button>
          </CardContent></Card>
          </section>
        </div>

        <aside className="min-w-0 lg:sticky lg:top-6" aria-labelledby="route-action-heading">
          <Card className="overflow-visible border border-primary/20 py-6 ring-0"><CardContent className="space-y-6 px-6">
            <h2 id="route-action-heading" className="text-xl font-semibold">{copy.next}</h2>
            <div className="space-y-2 rounded-lg bg-secondary p-4 text-secondary-foreground">
              <p className="flex items-start gap-2 text-base font-semibold"><Car aria-hidden="true" className="size-5 shrink-0" />{availability.label}</p>
              <p className="flex items-start gap-2 text-sm"><CalendarDays aria-hidden="true" className="size-4 shrink-0" />{formatDateRange(route.dateFrom, route.dateTo)}</p>
            </div>
            <div className="space-y-2 text-sm">
              <p className="font-medium">{copy.compatibility}</p>
              <p className="leading-relaxed text-muted-foreground">{route.vehicleCategories.map(category => vehicleCategoryLabels[category]).join(" · ")}</p>
              <p className="text-muted-foreground">{route.supportsNonRunning ? copy.nonRunning : copy.runningOnly}</p>
            </div>
            <div className="space-y-4 border-t pt-4">
              <p className="text-sm leading-relaxed text-muted-foreground">{availability.full ? copy.fullHint : availability.available ? copy.targetedHint : copy.fallbackHint}</p>
              {!availability.full && <QuoteLink href={requestUrl} available={availability.available} />}
            </div>
          </CardContent></Card>
        </aside>

      <section aria-labelledby="reviews-heading" className="min-w-0 space-y-6 lg:col-span-2">
        <div className="space-y-2">
          <h2 id="reviews-heading" className="text-2xl font-semibold tracking-tight">{copy.reviews}</h2>
          <p className="text-sm text-muted-foreground">{copy.reviewHint}</p>
          {route.carrier.reviewCount > 0 && route.carrier.rating !== null && <p className="flex items-center gap-2 text-sm"><Star aria-hidden="true" className="size-4" />{route.carrier.rating.toLocaleString("lt-LT")} · {formatCount(route.carrier.reviewCount, { one: "atsiliepimas", few: "atsiliepimai", other: "atsiliepimų" })}</p>}
        </div>
        {reviews.length > 0 ? <ul className="grid gap-4 md:grid-cols-2">
          {reviews.map((review) => <li key={review.id}>
            <Card className="h-full overflow-visible border py-6 ring-0"><CardContent className="space-y-3 px-6">
              <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="font-medium">{review.author}</h3><span className="flex items-center gap-1 text-sm"><Star aria-hidden="true" className="size-4" />{review.rating} / 5</span></div>
              <blockquote className="text-sm leading-relaxed">{review.comment}</blockquote>
              <p className="flex items-center gap-1.5 text-sm text-muted-foreground"><BadgeCheck aria-hidden="true" className="size-4 shrink-0" />{copy.verifiedReview}</p>
              <time dateTime={review.completedOn} className="text-sm text-muted-foreground">{formatDateRange(review.completedOn)}</time>
            </CardContent></Card>
          </li>)}
        </ul> : <p className="text-sm text-muted-foreground">{copy.noReviews}</p>}
      </section>
      </div>
    </PageContainer>
  </div>
}
