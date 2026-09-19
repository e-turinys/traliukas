import Link from "next/link"
import { ArrowRight, CalendarDays, CarFront, CircleCheck, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { publicationCopy, type PublishedRequestSummary } from "./context"

export function RequestSuccessCard({ id, summary, onExpand }: {
  id: string
  summary: PublishedRequestSummary
  onExpand?: () => void
}) {
  const copy = publicationCopy(summary)
  return (
    <Card className="w-full min-w-0 border py-0 shadow-none ring-0">
      <CardContent className="space-y-6 break-words p-4 sm:space-y-8 sm:p-8">
        <header className="space-y-3">
          <div className="flex size-12 items-center justify-center rounded-xl bg-secondary text-primary">
            <CircleCheck aria-hidden="true" className="size-6" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{copy.heading}</h1>
          <p className="leading-relaxed text-muted-foreground">{copy.next}</p>
        </header>
        <section aria-labelledby="published-summary" className="space-y-4 rounded-lg border bg-background p-4 sm:p-6">
          <div className="space-y-2">
            <h2 id="published-summary" className="text-sm font-medium text-muted-foreground">Jūsų pervežimas</h2>
            <p className="text-xl font-semibold leading-snug sm:text-2xl">{summary.route}</p>
          </div>
          <dl className="grid gap-4 border-t pt-4 sm:grid-cols-2">
            <div className="min-w-0 space-y-1">
              <dt className="flex items-center gap-2 text-sm text-muted-foreground"><CalendarDays aria-hidden="true" className="size-4 shrink-0" />Paėmimo laikas</dt>
              <dd className="text-sm font-medium leading-relaxed">{summary.date}</dd>
            </div>
            <div className="min-w-0 space-y-1">
              <dt className="flex items-center gap-2 text-sm text-muted-foreground"><Users aria-hidden="true" className="size-4 shrink-0" />Kas mato užklausą</dt>
              <dd className="text-sm font-medium leading-relaxed">{copy.audience}</dd>
            </div>
          </dl>
          <div className="space-y-3 border-t pt-4">
            <h3 className="flex items-center gap-2 text-sm font-medium"><CarFront aria-hidden="true" className="size-4 shrink-0 text-primary" />{summary.vehicleCount === 1 ? "Automobilis" : `Automobiliai (${summary.vehicleCount})`}</h3>
            <ul className="space-y-2 text-sm leading-relaxed">
              {summary.vehicleLines.map((line, index) => <li key={index}>{line}</li>)}
            </ul>
          </div>
        </section>
        <section aria-labelledby="published-next" className="space-y-4">
          <h2 id="published-next" className="text-lg font-semibold">Kas toliau?</h2>
          <ol className="grid gap-4 sm:grid-cols-3">
            {[summary.visibility === "targeted" ? "Vežėjas peržiūrės jūsų užklausą" : "Vežėjai peržiūrės jūsų užklausą", "Gautus pasiūlymus matysite užklausoje", "Pasirinksite tinkamiausią vežėją"].map((step, index) => <li key={step} className="flex min-w-0 items-start gap-3 sm:flex-col">
              <span aria-hidden="true" className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-secondary text-sm font-semibold text-primary">{index + 1}</span>
              <p className="text-sm leading-relaxed">{step}</p>
            </li>)}
          </ol>
        </section>
        <div className="flex flex-col gap-2 border-t pt-6 sm:flex-row sm:flex-wrap sm:gap-3">
          <Button nativeButton={false} render={<Link href={`/requests/${encodeURIComponent(id)}`} />} className="h-auto min-h-11 w-full px-6 py-3 whitespace-normal sm:w-auto">Peržiūrėti mano užklausą<ArrowRight aria-hidden="true" /></Button>
          <Button variant="ghost" nativeButton={false} render={<Link href="/" />} className="h-auto min-h-11 w-full px-6 py-3 whitespace-normal sm:w-auto">Grįžti į pradžią</Button>
        </div>
        {summary.visibility === "targeted" && onExpand && (
          <div className="space-y-3 border-t pt-6">
            <h2 className="font-medium">Norite gauti daugiau pasiūlymų?</h2>
            <Button variant="outline" onClick={onExpand} className="h-auto min-h-11 w-full py-3 whitespace-normal">Parodyti ir kitiems tinkamiems vežėjams</Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
