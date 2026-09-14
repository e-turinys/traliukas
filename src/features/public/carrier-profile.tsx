import Link from "next/link"
import { ArrowLeft, ArrowRight, BadgeCheck, Star, Truck } from "lucide-react"
import { PageContainer } from "@/components/layout/page-container"
import { CarrierTrust } from "@/components/shared/carrier-trust"
import { RouteCard } from "@/components/shared/route-card"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { formatCountry } from "@/lib/format-country"
import { formatDateRange } from "@/lib/format-date"
import { formatCount } from "@/lib/format-count"
import type { CarrierProfile } from "@/lib/types/carrier-profile"
import type { CarrierRoute } from "@/lib/types/carrier-route"
import type { completedCarrierReviews } from "./carrier-profile-context"

const copy = {
  back: "Ieškoti maršrutų", profile: "Vežėjo profilis", about: "Apie vežėją",
  registration: "Registracijos šalis", countries: "Paslaugų šalys",
  verification: "Vežėjo patvirtinimas", verified: "Patvirtintas vežėjas",
  verifiedHint: "Vežėjas atitinka visus šiuo metu privalomus platformos patvirtinimo reikalavimus.",
  unverified: "Vežėjas dar nepatvirtintas", unverifiedHint: "Visi privalomi patikrinimai dar nėra patvirtinti.",
  routes: "Aktyvūs maršrutai", viewRoutes: "Peržiūrėti maršrutus",
  routeHint: "Pasirinkite maršrutą ir peržiūrėkite jo datas bei pervežimo galimybes.",
  noRoutes: "Šiuo metu aktyvių maršrutų nėra.", offers: "Gauti vežėjų pasiūlymus",
  noRoutesHint: "Pateikite pervežimo užklausą ir gaukite kitų vežėjų pasiūlymus.",
  reviews: "Klientų atsiliepimai", reviewHint: "Atsiliepimai po užbaigtų pervežimų.",
  latestReviews: "Naujausi atsiliepimai", verifiedReview: "Patvirtintas pervežimas",
  noReviews: "Šis vežėjas dar neturi klientų atsiliepimų.",
}

type Props = { carrier: CarrierProfile; routes: CarrierRoute[]; reviews: ReturnType<typeof completedCarrierReviews> }

export function CarrierPublicProfile({ carrier, routes, reviews }: Props) {
  const hasRoutes = routes.length > 0
  // Current fixtures contain two previews per reviewed carrier. No invented remaining reviews.
  const visibleReviews = reviews.slice(0, 6)
  return <PageContainer className="space-y-8 py-6 sm:space-y-10 sm:py-8">
    <Button variant="ghost" nativeButton={false} render={<Link href="/search" />} className="min-h-11"><ArrowLeft aria-hidden="true" />{copy.back}</Button>

    <header className="flex flex-col gap-6 border-b pb-8 lg:flex-row lg:items-start lg:justify-between">
      <div className="flex min-w-0 items-start gap-4">
        <div aria-hidden="true" className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-muted sm:size-16"><Truck className="size-7 text-muted-foreground" /></div>
        <div className="min-w-0 space-y-3">
          <p className="text-sm text-muted-foreground">{copy.profile}</p>
          <h1 className="text-3xl font-semibold tracking-tight break-words sm:text-4xl">{carrier.name}</h1>
          <CarrierTrust carrier={carrier} />
        </div>
      </div>
      <div className="space-y-2 lg:w-72 lg:shrink-0">
        <Button nativeButton={false} render={<Link href={hasRoutes ? "#active-routes" : "/request/new"} />} className="h-auto min-h-11 w-full px-4 py-3 whitespace-normal">{hasRoutes ? copy.viewRoutes : copy.offers}<ArrowRight aria-hidden="true" /></Button>
      </div>
    </header>

    <div className="grid items-start gap-6 md:grid-cols-2">
      <section aria-labelledby="about-heading" className="min-w-0 space-y-4">
        <h2 id="about-heading" className="text-xl font-semibold">{copy.about}</h2>
        <p className="leading-relaxed text-muted-foreground">{carrier.description}</p>
        <dl className="space-y-3 text-sm">
          {carrier.registrationCountry && <div className="space-y-1"><dt className="text-muted-foreground">{copy.registration}</dt><dd>{formatCountry(carrier.registrationCountry)}</dd></div>}
          {!!carrier.serviceCountries?.length && <div className="space-y-1"><dt className="text-muted-foreground">{copy.countries}</dt><dd>{carrier.serviceCountries.map(formatCountry).join(" · ")}</dd></div>}
        </dl>
      </section>
      <section aria-labelledby="verification-heading" className="min-w-0">
        <Card><CardContent className="space-y-3">
          <h2 id="verification-heading" className="text-xl font-semibold">{copy.verification}</h2>
          <p className="flex items-center gap-2 font-medium">{carrier.verification === "approved" && <BadgeCheck aria-hidden="true" className="size-5 shrink-0" />}{carrier.verification === "approved" ? copy.verified : copy.unverified}</p>
          <p className="text-sm leading-relaxed text-muted-foreground">{carrier.verification === "approved" ? copy.verifiedHint : copy.unverifiedHint}</p>
        </CardContent></Card>
      </section>
    </div>

    <section id="active-routes" tabIndex={-1} aria-labelledby="routes-heading" className="scroll-mt-6 space-y-5 border-t pt-8">
      <h2 id="routes-heading" className="text-2xl font-semibold">{copy.routes}</h2>
      {hasRoutes ? <>
        <p className="text-sm text-muted-foreground">{copy.routeHint}</p>
        <ul className="grid gap-4 md:grid-cols-2">{routes.map((route) => <li key={route.id} className="min-w-0"><RouteCard route={route} context="profile" /></li>)}</ul>
      </> : <Card><CardContent className="space-y-3">
        <p className="font-medium">{copy.noRoutes}</p>
        <p className="text-sm text-muted-foreground">{copy.noRoutesHint}</p>
        <Button variant="outline" nativeButton={false} render={<Link href="/request/new" />} className="h-auto min-h-11 w-full py-3 whitespace-normal sm:w-auto">{copy.offers}</Button>
      </CardContent></Card>}
    </section>

    <section aria-labelledby="reviews-heading" className="space-y-5 border-t pt-8">
      <div className="space-y-2">
        <h2 id="reviews-heading" className="text-2xl font-semibold">{copy.reviews}</h2>
        <p className="text-sm text-muted-foreground">{copy.reviewHint}</p>
        {carrier.reviewCount > 0 && carrier.rating !== null && <p className="flex items-center gap-2"><Star aria-hidden="true" className="size-5" /><span>{carrier.rating.toLocaleString("lt-LT")} · {formatCount(carrier.reviewCount, { one: "atsiliepimas", few: "atsiliepimai", other: "atsiliepimų" })}</span></p>}
      </div>
      {visibleReviews.length ? <>
        <p className="text-sm font-medium">{copy.latestReviews}</p>
        <ul className="grid gap-4 md:grid-cols-2">{visibleReviews.map((review) => <li key={review.id} className="min-w-0">
          <Card className="h-full"><CardContent className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-medium">{review.author}</h3>
              <span role="img" className="flex items-center gap-1" aria-label={`${review.rating} iš 5 žvaigždučių`}>
                {Array.from({ length: 5 }, (_, index) => <Star key={index} aria-hidden="true" className={`size-4 ${index < review.rating ? "fill-current" : "text-muted-foreground"}`} />)}
              </span>
            </div>
            <blockquote className="text-sm leading-relaxed">{review.comment}</blockquote>
            <p className="flex items-center gap-1.5 text-sm text-muted-foreground"><BadgeCheck aria-hidden="true" className="size-4 shrink-0" />{copy.verifiedReview}</p>
            <time dateTime={review.completedOn} className="text-xs text-muted-foreground">{formatDateRange(review.completedOn)}</time>
          </CardContent></Card>
        </li>)}</ul>
      </> : <p className="text-sm text-muted-foreground">{copy.noReviews}</p>}
    </section>
  </PageContainer>
}
