import Link from "next/link"
import { CircleCheck } from "lucide-react"
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
    <Card className="w-full min-w-0 sm:[--card-spacing:--spacing(6)]">
      <CardContent className="space-y-6 break-words">
        <div className="space-y-3">
          <CircleCheck aria-hidden="true" className="size-10 text-primary" />
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{copy.heading}</h1>
        </div>
        <dl className="space-y-4 rounded-lg bg-muted p-4">
          {[["Maršrutas", summary.route], ["Automobilis", summary.vehicle], ["Paėmimo laikas", summary.date], ["Kas mato užklausą", copy.audience]].map(([label, value]) => (
            <div key={label} className="min-w-0 space-y-1">
              <dt className="text-sm text-muted-foreground">{label}</dt>
              <dd className="font-medium">{value}</dd>
            </div>
          ))}
        </dl>
        <div className="space-y-2 text-sm leading-relaxed">
          <h2 className="text-base font-semibold">Kas toliau?</h2>
          <p>{copy.next}</p>
          <p className="text-muted-foreground">Informuosime, kai gausite naują pasiūlymą.</p>
        </div>
        <div className="space-y-2">
          <Button nativeButton={false} render={<Link href={`/requests/${encodeURIComponent(id)}`} />} className="h-auto min-h-11 w-full py-3 whitespace-normal">Peržiūrėti mano užklausą</Button>
          <Button variant="ghost" nativeButton={false} render={<Link href="/" />} className="h-auto min-h-11 w-full py-3 whitespace-normal">Grįžti į pradžią</Button>
        </div>
        {summary.visibility === "targeted" && onExpand && (
          <div className="space-y-3 border-t pt-5">
            <h2 className="font-medium">Norite gauti daugiau pasiūlymų?</h2>
            <Button variant="outline" onClick={onExpand} className="h-auto min-h-11 w-full py-3 whitespace-normal">Parodyti ir kitiems tinkamiems vežėjams</Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
