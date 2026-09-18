import Link from "next/link"
import { ArrowLeft, ArrowRight, BadgeCheck, Car, Globe, Star } from "lucide-react"
import { PageContainer } from "@/components/layout/page-container"
import { CarrierTrust } from "@/components/shared/carrier-trust"
import { MarketplaceRouteCard } from "@/components/shared/marketplace-route-card"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { formatCountry } from "@/lib/format-country"
import { formatDateRange } from "@/lib/format-date"
import { formatCount } from "@/lib/format-count"
import type { CarrierProfile } from "@/lib/types/carrier-profile"
import { vehicleCategoryLabels, type CarrierRoute } from "@/lib/types/carrier-route"
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
  capabilities: "Transporto galimybės", capabilityHint: "Pagal aktyvius maršrutus. Konkrečias galimybes patikrinkite pasirinktame maršrute.",
  nonRunning: "Yra maršrutų nevažiuojantiems automobiliams", runningOnly: "Tik važiuojantys automobiliai",
}

type Props = { carrier: CarrierProfile; routes: CarrierRoute[]; reviews: ReturnType<typeof completedCarrierReviews> }

export function CarrierPublicProfile({ carrier, routes, reviews }: Props) {
  const hasRoutes = routes.length > 0
  // Current fixtures contain two previews per reviewed carrier. No invented remaining reviews.
  const visibleReviews = reviews.slice(0, 6)
  const categories = Array.from(new Set(routes.flatMap(route => route.vehicleCategories)))
  return <div className="marketplace-theme bg-background text-foreground"><PageContainer className="space-y-6 py-6 sm:space-y-8 sm:py-8 lg:pb-12">
    <Button variant="ghost" nativeButton={false} render={<Link href="/search" />} className="h-auto min-h-11 whitespace-normal text-muted-foreground"><ArrowLeft aria-hidden="true" />{copy.back}</Button>

    <header className="flex flex-col gap-6 border-b pb-6 lg:flex-row lg:items-center lg:justify-between">
      <div className="min-w-0">
        <div className="min-w-0 space-y-3">
          <p className="text-sm font-medium text-primary">{copy.profile}</p>
          <h1 className="text-3xl leading-tight font-semibold tracking-tight break-words sm:text-4xl">{carrier.name}</h1>
          <div className="[&_svg]:text-primary"><CarrierTrust carrier={carrier} /></div>
        </div>
      </div>
      <div className="min-w-0 lg:max-w-sm">
        <Button nativeButton={false} render={<Link href={hasRoutes ? "#active-routes" : "/request/new"} />} className="h-auto min-h-11 w-full px-4 py-3 whitespace-normal">{hasRoutes ? copy.viewRoutes : copy.offers}<ArrowRight aria-hidden="true" /></Button>
      </div>
    </header>

    <div className="grid items-start gap-6 lg:grid-cols-3 lg:gap-8">
    <aside aria-label={copy.about} className="min-w-0 space-y-6 lg:col-start-3 lg:row-start-1">
      <section aria-labelledby="about-heading">
        <Card className="overflow-visible border py-6 ring-0"><CardContent className="space-y-4 px-6">
        <h2 id="about-heading" className="text-xl font-semibold">{copy.about}</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">{carrier.description}</p>
        <dl className="space-y-3 text-sm">
          {carrier.registrationCountry && <div className="space-y-1"><dt className="text-muted-foreground">{copy.registration}</dt><dd>{formatCountry(carrier.registrationCountry)}</dd></div>}
          {!!carrier.serviceCountries?.length && <div className="space-y-2 border-t pt-4"><dt className="flex items-center gap-2 text-muted-foreground"><Globe aria-hidden="true" className="size-4 shrink-0 text-primary" />{copy.countries}</dt><dd className="leading-relaxed">{carrier.serviceCountries.map(formatCountry).join(" · ")}</dd></div>}
        </dl>
        </CardContent></Card>
      </section>
      <section aria-labelledby="verification-heading" className="min-w-0">
        <Card className="overflow-visible border py-6 ring-0"><CardContent className="space-y-3 px-6">
          <h2 id="verification-heading" className="text-xl font-semibold">{copy.verification}</h2>
          <p className="flex items-start gap-2 font-medium">{carrier.verification === "approved" && <BadgeCheck aria-hidden="true" className="size-5 shrink-0 text-primary" />}{carrier.verification === "approved" ? copy.verified : copy.unverified}</p>
          <p className="text-sm leading-relaxed text-muted-foreground">{carrier.verification === "approved" ? copy.verifiedHint : copy.unverifiedHint}</p>
        </CardContent></Card>
      </section>
      {categories.length > 0 && <section aria-labelledby="capabilities-heading">
        <Card className="overflow-visible border py-6 ring-0"><CardContent className="space-y-4 px-6">
          <h2 id="capabilities-heading" className="text-xl font-semibold">{copy.capabilities}</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">{copy.capabilityHint}</p>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            {categories.map(category => <li key={category} className="flex items-start gap-2 rounded-lg bg-muted/50 p-3"><Car aria-hidden="true" className="size-5 shrink-0 text-primary" />{vehicleCategoryLabels[category]}</li>)}
          </ul>
          <p className="border-t pt-4 text-sm font-medium">{routes.some(route => route.supportsNonRunning) ? copy.nonRunning : copy.runningOnly}</p>
        </CardContent></Card>
      </section>}
    </aside>
    <div className="min-w-0 space-y-8 lg:col-span-2 lg:col-start-1 lg:row-start-1">

    <section id="active-routes" tabIndex={-1} aria-labelledby="routes-heading" className="scroll-mt-6 space-y-4">
      <h2 id="routes-heading" className="text-2xl font-semibold tracking-tight">{copy.routes}</h2>
      {hasRoutes ? <>
        <p className="text-sm text-muted-foreground">{copy.routeHint}</p>
        <ul className="grid gap-4">{routes.map((route) => <li key={route.id} className="min-w-0"><MarketplaceRouteCard route={route} variant="result" context="profile" /></li>)}</ul>
      </> : <Card className="overflow-visible border py-6 ring-0"><CardContent className="space-y-3 px-6">
        <p className="font-medium">{copy.noRoutes}</p>
        <p className="text-sm text-muted-foreground">{copy.noRoutesHint}</p>
        <Button variant="outline" nativeButton={false} render={<Link href="/request/new" />} className="h-auto min-h-11 w-full px-4 py-3 whitespace-normal text-primary hover:bg-secondary hover:text-primary sm:w-auto">{copy.offers}</Button>
      </CardContent></Card>}
    </section>

    <section aria-labelledby="reviews-heading" className="space-y-6">
      <div className="space-y-2">
        <h2 id="reviews-heading" className="text-2xl font-semibold tracking-tight">{copy.reviews}</h2>
        <p className="text-sm text-muted-foreground">{copy.reviewHint}</p>
        {carrier.reviewCount > 0 && carrier.rating !== null && <p className="flex items-center gap-2"><Star aria-hidden="true" className="size-5" /><span>{carrier.rating.toLocaleString("lt-LT")} · {formatCount(carrier.reviewCount, { one: "atsiliepimas", few: "atsiliepimai", other: "atsiliepimų" })}</span></p>}
      </div>
      {visibleReviews.length ? <>
        <p className="text-sm font-medium">{copy.latestReviews}</p>
        <ul className="grid gap-4 md:grid-cols-2">{visibleReviews.map((review) => <li key={review.id} className="min-w-0">
          <Card className="h-full overflow-visible border py-6 ring-0"><CardContent className="space-y-3 px-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-medium">{review.author}</h3>
              <span className="flex items-center gap-1 text-sm" aria-label={`${review.rating} iš 5 žvaigždučių`}><Star aria-hidden="true" className="size-4" />{review.rating} / 5</span>
            </div>
            <blockquote className="text-sm leading-relaxed">{review.comment}</blockquote>
            <p className="flex items-center gap-1.5 text-sm text-muted-foreground"><BadgeCheck aria-hidden="true" className="size-4 shrink-0" />{copy.verifiedReview}</p>
            <time dateTime={review.completedOn} className="text-sm text-muted-foreground">{formatDateRange(review.completedOn)}</time>
          </CardContent></Card>
        </li>)}</ul>
      </> : <p className="text-sm text-muted-foreground">{copy.noReviews}</p>}
    </section>
    </div>
    </div>
  </PageContainer></div>
}
