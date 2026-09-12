import Link from "next/link"
import { ArrowRight, BadgeCheck, MessagesSquare, Star } from "lucide-react"
import { PageContainer } from "@/components/layout/page-container"
import { buttonVariants } from "@/components/ui/button"
import { HomeSearch } from "@/features/public/home-search"
import { cn } from "@/lib/utils"

const copy = {
  heading: "Reikia parvežti automobilį?",
  introduction: "Raskite vežėją pagal savo maršrutą arba gaukite vežėjų pasiūlymus ir pasirinkite jums tinkamiausią automobilio pervežimą.",
  trustLabel: "Kodėl Parvezk.lt",
  benefits: [
    { icon: BadgeCheck, title: "Patikrinti vežėjai", description: "Vežėjų profiliuose matykite patvirtinimo informaciją." },
    { icon: Star, title: "Tikri atsiliepimai po pervežimo", description: "Atsiliepimus gali palikti tik užbaigto pervežimo klientai." },
    { icon: MessagesSquare, title: "Pasiūlymai vienoje vietoje", description: "Palyginkite vežėjų kainas, datas ir pervežimo sąlygas." },
  ],
  how: "Kaip veikia",
  steps: [
    { title: "Nurodykite maršrutą", description: "Pasirinkite, iš kur ir į kur reikia parvežti automobilį. Jei žinote, nurodykite datą." },
    { title: "Gaukite pasiūlymus", description: "Pateikite pervežimo užklausą ir gaukite vežėjų pasiūlymus su kaina bei sąlygomis." },
    { title: "Pasirinkite vežėją", description: "Palyginkite pasiūlymus, peržiūrėkite vežėjo profilį ir priimkite tinkamiausią pasiūlymą." },
  ],
  carrierHeading: "Vežate automobilius?",
  carrierText: "Pridėkite savo maršrutus ir raskite automobilių laisvoms vietoms. Parvezk.lt vežėjams – nemokamai.",
  carrierCta: "Vežėjams",
}

export default function Home() {
  return (
    <PageContainer className="space-y-14 py-10 sm:space-y-20 sm:py-16">
      <section aria-labelledby="home-heading" className="space-y-8">
        <div className="max-w-2xl space-y-4">
          <h1 id="home-heading" className="text-3xl font-semibold tracking-tight text-balance sm:text-5xl">{copy.heading}</h1>
          <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">{copy.introduction}</p>
        </div>
        <HomeSearch />
      </section>
      <section aria-label={copy.trustLabel}>
        <ul className="grid gap-8 md:grid-cols-3">
          {copy.benefits.map(({ icon: Icon, title, description }) => (
            <li key={title} className="space-y-3">
              <Icon aria-hidden="true" className="size-6 text-muted-foreground" />
              <h2 className="text-base font-semibold">{title}</h2>
              <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
            </li>
          ))}
        </ul>
      </section>
      <section aria-labelledby="how-heading" className="space-y-8 border-t pt-10 sm:pt-14">
        <h2 id="how-heading" className="text-2xl font-semibold tracking-tight">{copy.how}</h2>
        <ol className="grid gap-8 md:grid-cols-3">
          {copy.steps.map((step, index) => (
            <li key={step.title} className="space-y-3">
              <span aria-hidden="true" className="flex size-9 items-center justify-center rounded-lg bg-muted text-sm font-medium">{index + 1}</span>
              <h3 className="font-semibold">{step.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{step.description}</p>
            </li>
          ))}
        </ol>
      </section>
      <section aria-labelledby="carrier-heading" className="flex flex-col gap-6 rounded-xl border bg-muted/30 p-6 sm:p-8 md:flex-row md:items-center md:justify-between">
        <div className="max-w-xl space-y-3">
          <h2 id="carrier-heading" className="text-2xl font-semibold tracking-tight">{copy.carrierHeading}</h2>
          <p className="leading-relaxed text-muted-foreground">{copy.carrierText}</p>
        </div>
        <Link href="/carrier" className={cn(buttonVariants({ variant: "outline" }), "min-h-11 px-5")}>{copy.carrierCta}<ArrowRight aria-hidden="true" /></Link>
      </section>
    </PageContainer>
  )
}
