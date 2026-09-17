import Link from "next/link"
import { ArrowRight, BadgeCheck, MessagesSquare, Search, Star, Truck } from "lucide-react"
import { PageContainer } from "@/components/layout/page-container"
import { MarketplaceRouteCard } from "@/components/shared/marketplace-route-card"
import { buttonVariants } from "@/components/ui/button"
import { HomeSearch } from "@/features/public/home-search"
import { mockCarrierRoutes } from "@/lib/mock/carrier-routes"
import { getAvailableCapacity } from "@/lib/route-capacity"
import { cn } from "@/lib/utils"

const copy = {
  eyebrow: "Automobilių transportas Europoje",
  heading: "Raskite patikimą vežėją savo automobiliui",
  introduction: "Palyginkite maršrutus, kainas ir patikrintus vežėjus vienoje vietoje.",
  trustLabel: "Kodėl Parvezk.lt",
  benefits: [
    { icon: BadgeCheck, title: "Patikrinti vežėjai" },
    { icon: Star, title: "Atsiliepimai po pervežimo" },
    { icon: Search, title: "Pasiūlymai vienoje vietoje" },
    { icon: MessagesSquare, title: "Susirašinėjimas platformoje" },
  ],
  routes: "Populiarūs maršrutai",
  routesText: "Vežėjų maršrutai su laisvomis vietomis",
  how: "Kaip tai veikia",
  steps: [
    { title: "Raskite arba paskelbkite pervežimą", description: "Pasirinkite maršrutą arba pateikite užklausą savo automobilio pervežimui." },
    { title: "Gaukite ir palyginkite pasiūlymus", description: "Peržiūrėkite vežėjų kainas, datas, atsiliepimus ir pervežimo sąlygas." },
    { title: "Pasirinkite vežėją ir sekite pervežimą", description: "Priimkite tinkamiausią pasiūlymą ir bendraukite su vežėju platformoje." },
  ],
  carrierHeading: "Vežate automobilius po Europą?",
  carrierText: "Paskelbkite maršrutą, nurodykite laisvas vietas ir gaukite klientų užklausas.",
  carrierCta: "Paskelbti maršrutą",
}

export default function Home() {
  // Existing fixed review fixtures; no popularity ranking or invented trust data.
  const routes = mockCarrierRoutes.filter(route => route.acceptingNewRequests && getAvailableCapacity(route) > 0).slice(0, 3)
  return (
    <div className="marketplace-theme bg-background text-foreground">
      <section aria-labelledby="home-heading" className="border-b bg-secondary/50">
        <PageContainer className="space-y-8 py-10 sm:py-12 lg:py-16">
          <div className="max-w-3xl space-y-4">
            <p className="flex items-center gap-2 text-sm font-medium text-primary"><Truck aria-hidden="true" className="size-5" />{copy.eyebrow}</p>
            <h1 id="home-heading" className="text-4xl leading-tight font-semibold tracking-tight text-balance sm:text-5xl">{copy.heading}</h1>
            <p className="max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">{copy.introduction}</p>
          </div>
          <HomeSearch />
          <div aria-label={copy.trustLabel}>
            <ul className="grid gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-4">
              {copy.benefits.map(({ icon: Icon, title }) => (
                <li key={title} className="flex items-center gap-3 text-sm text-muted-foreground">
                  <Icon aria-hidden="true" className="size-5 shrink-0 text-primary" /><span>{title}</span>
                </li>
              ))}
            </ul>
          </div>
        </PageContainer>
      </section>
      <PageContainer className="space-y-12 py-10 sm:space-y-16 sm:py-14">
        {routes.length > 0 && <section aria-labelledby="routes-heading" className="space-y-6">
          <div className="space-y-2">
            <h2 id="routes-heading" className="text-2xl font-semibold tracking-tight sm:text-3xl">{copy.routes}</h2>
            <p className="text-muted-foreground">{copy.routesText}</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 lg:gap-6">
            {routes.map(route => <MarketplaceRouteCard key={route.id} route={route} />)}
          </div>
        </section>}
        <section aria-labelledby="how-heading" className="space-y-6 border-t pt-10 sm:pt-12">
          <h2 id="how-heading" className="text-2xl font-semibold tracking-tight sm:text-3xl">{copy.how}</h2>
          <ol className="grid gap-6 md:grid-cols-3 lg:gap-8">
            {copy.steps.map((step, index) => (
              <li key={step.title} className="flex items-start gap-4">
                <span aria-hidden="true" className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-secondary font-semibold text-primary">{index + 1}</span>
                <div className="space-y-2">
                  <h3 className="font-semibold leading-snug">{step.title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{step.description}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>
        <section aria-labelledby="carrier-heading" className="flex flex-col gap-6 rounded-xl bg-primary p-6 text-primary-foreground sm:p-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl space-y-3">
            <h2 id="carrier-heading" className="text-2xl font-semibold tracking-tight">{copy.carrierHeading}</h2>
            <p className="leading-relaxed">{copy.carrierText}</p>
          </div>
          <Link href="/carrier" className={cn(buttonVariants({ variant: "outline" }), "h-auto min-h-12 gap-3 whitespace-normal bg-white px-6 py-3 text-primary hover:bg-secondary hover:text-primary")}>
            {copy.carrierCta}<ArrowRight aria-hidden="true" />
          </Link>
        </section>
      </PageContainer>
    </div>
  )
}
