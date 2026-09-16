"use client"

import Link from "next/link"
import { useRef, useState } from "react"
import { ArrowLeft, ChevronDown } from "lucide-react"
import { CarrierTrust } from "@/components/shared/carrier-trust"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { formatDateRange } from "@/lib/format-date"
import { formatEur } from "@/lib/format-money"
import { publishedRequestSummary } from "../request-published/context"
import { vehiclePriceScope } from "../vehicle-summary"
import { hydrateRequestDetail } from "../request-detail/logic"
import type { RequestDetailPayload, RequestOffer } from "../request-detail/model"
import { OfferDecisionDialog } from "./decision-dialog"
import {
  applyMockOfferDecision, customerOfferStatusLabels, formatOfferTimestamp, isOfferActionable,
  offerDetailStatus, offeredPickupDiffers, offerReadOnlyCopy, offerRevisionHistory,
} from "./logic"

export function OfferDetailView({ initialRequest, offerId, reviewNow }: {
  initialRequest: RequestDetailPayload; offerId: string; reviewNow: string
}) {
  const [request] = useState(() => hydrateRequestDetail(initialRequest))
  const [offer, setOffer] = useState<RequestOffer>(() => {
    const found = request.offers.find(candidate => candidate.id === offerId)
    if (!found) throw new Error("Offer is missing from its request")
    return found
  })
  const [decision, setDecision] = useState<"accept" | "decline" | null>(null)
  const [notice, setNotice] = useState("")
  const acceptButton = useRef<HTMLButtonElement>(null)
  const declineButton = useRef<HTMLButtonElement>(null)
  const status = offerDetailStatus(request, offer, reviewNow)
  const actionable = isOfferActionable(status)
  const requestSummary = publishedRequestSummary(request)
  const revisions = offerRevisionHistory(offer)
  const readOnlyCopy = offerReadOnlyCopy(request, offer, reviewNow)

  const confirm = () => {
    if (!decision) return
    setOffer(applyMockOfferDecision(request, offer, decision, reviewNow))
    setNotice(decision === "accept"
      ? ""
      : "Pasiūlymas atmestas tik šiame puslapyje. Pakeitimas neišsaugotas.")
    setDecision(null)
  }

  return <div className="mx-auto w-full max-w-6xl space-y-6 pb-8">
    <Link href={`/requests/${encodeURIComponent(request.id)}`} className="inline-flex min-h-11 items-center gap-2 text-sm font-medium underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
      <ArrowLeft aria-hidden="true" className="size-4" />Grįžti į užklausą
    </Link>

    <header className="grid min-w-0 gap-4 border-b pb-6 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
      <div className="min-w-0 space-y-3">
        <div className="flex flex-wrap gap-2">
          <Badge variant={status === "pending" || status === "accepted" ? "default" : "secondary"}>{customerOfferStatusLabels[status]}</Badge>
          {offer.offerVersion > 1 && <Badge variant="outline">Atnaujintas pasiūlymas</Badge>}
        </div>
        <h1 className="break-words text-3xl font-semibold tracking-tight">Pasiūlymas iš vežėjo „{offer.carrier.name}“</h1>
      </div>
      <div className="min-w-0 sm:text-right">
        <p className="text-3xl font-semibold" aria-label={`Visa pervežimo kaina ${formatEur(offer.totalPriceEur)} už visus užklausos automobilius`}>{formatEur(offer.totalPriceEur)}</p>
        <p className="text-sm text-muted-foreground">{requestSummary.vehicleCount === 1 ? "Visa pervežimo kaina" : `Visa pervežimo kaina už ${vehiclePriceScope(requestSummary.vehicleCount)}`}</p>
      </div>
    </header>

    <p role="status" className={notice ? "rounded-lg border bg-muted/30 p-4 text-sm" : "sr-only"}>{notice}</p>

    <div className="grid min-w-0 items-start gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(18rem,2fr)]">
      <aside className="order-first min-w-0 space-y-5 lg:order-last lg:sticky lg:top-24">
        <Card><CardContent className="space-y-4">
          <h2 className="text-lg font-semibold">Jūsų sprendimas</h2>
          {actionable ? <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Peržiūrėkite naujausias sąlygas ir pasirinkite, ar šis pasiūlymas jums tinka.</p>
            <Button ref={acceptButton} className="h-auto min-h-11 w-full py-3 whitespace-normal" onClick={() => setDecision("accept")}>Priimti pasiūlymą</Button>
            <Button ref={declineButton} variant="outline" className="h-auto min-h-11 w-full py-3 whitespace-normal" onClick={() => setDecision("decline")}>Atmesti pasiūlymą</Button>
          </div> : <p className="text-sm leading-relaxed text-muted-foreground">{readOnlyCopy}</p>}
        </CardContent></Card>

        <Card><CardContent className="space-y-4">
          <h2 className="text-lg font-semibold">Jūsų užklausa</h2>
          <dl className="space-y-3 text-sm">
            <div className="min-w-0"><dt className="text-muted-foreground">Maršrutas</dt><dd className="break-words">{requestSummary.route}</dd></div>
            <div className="min-w-0"><dt className="text-muted-foreground">Automobiliai ({requestSummary.vehicleCount})</dt><dd><ul className="space-y-1">{requestSummary.vehicleLines.map((line, index) => <li key={`${line}-${index}`} className="break-words">{line}</li>)}</ul></dd></div>
            <div><dt className="text-muted-foreground">Pageidaujamas paėmimas</dt><dd>{requestSummary.date}</dd></div>
          </dl>
          <p className="text-sm text-muted-foreground">Pasiūlymas apima visus automobilius ir visus šioje užklausoje nurodytus maršrutus.</p>
        </CardContent></Card>
      </aside>

      <main className="min-w-0 space-y-6">
        <Card><CardContent className="space-y-5">
          <h2 className="text-xl font-semibold">Pasiūlymo sąlygos</h2>
          <dl className="grid gap-4 text-sm sm:grid-cols-2">
            <div><dt className="text-muted-foreground">Paėmimas</dt><dd className="font-medium">{formatDateRange(offer.pickupDate)}</dd></div>
            <div><dt className="text-muted-foreground">Planuojamas pristatymas</dt><dd className="font-medium">{formatDateRange(offer.deliveryDate)}</dd></div>
            <div><dt className="text-muted-foreground">Pasiūlymas galioja iki</dt><dd>{formatOfferTimestamp(offer.expiresAt)} <span className="text-muted-foreground">(Lietuvos laiku)</span></dd></div>
            <div className="min-w-0"><dt className="text-muted-foreground">Apmokėjimas</dt><dd className="break-words">{offer.paymentTerms}</dd></div>
          </dl>
          {offeredPickupDiffers(request, offer) && <p className="rounded-lg border bg-muted/40 p-4 text-sm">Siūlomas paėmimas skiriasi nuo jūsų pageidaujamo laiko.</p>}
          {offer.carrierComment && <div className="space-y-2 border-t pt-4"><h3 className="font-medium">Vežėjo komentaras</h3><p className="whitespace-pre-wrap break-words text-sm text-muted-foreground">{offer.carrierComment}</p></div>}
          <p className="border-t pt-4 text-sm text-muted-foreground">Priėmus pasiūlymą, šios naujausios kainos, datų ir apmokėjimo sąlygos sudarytų susitarimą dėl pervežimo.</p>
        </CardContent></Card>

        <Card><CardContent className="space-y-4">
          <h2 className="text-xl font-semibold">Vežėjas</h2>
          <div className="space-y-3">
            <h3 className="break-words text-lg font-semibold">{offer.carrier.name}</h3>
            <CarrierTrust carrier={offer.carrier} />
          </div>
          <Button nativeButton={false} variant="outline" render={<Link href={`/carriers/${encodeURIComponent(offer.carrier.id)}`} />} className="h-auto min-h-11 w-full py-3 whitespace-normal">Peržiūrėti vežėjo profilį</Button>
        </CardContent></Card>

        {offer.offerVersion > 1 && <details className="group/history rounded-xl border">
          <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 px-4 py-4 font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:px-6">
            <span>Pasiūlymo istorija</span><ChevronDown aria-hidden="true" className="size-4 shrink-0 transition-transform group-open/history:rotate-180" />
          </summary>
          <div className="space-y-4 border-t p-4 sm:p-6">
            <p className="text-sm text-muted-foreground">Viršuje rodomos naujausios galiojančios sąlygos. Ankstesnių sąlygų pasirinkti negalima.</p>
            {revisions.map((revision, index) => <article key={`${revision.revisedAt ?? "revision"}-${index}`} className="space-y-3 rounded-lg bg-muted/40 p-4">
              <h3 className="font-medium">Ankstesnis pasiūlymas</h3>
              {revision.revisedAt && <p className="text-xs text-muted-foreground">Atnaujinta {formatOfferTimestamp(revision.revisedAt)}</p>}
              <dl className="grid gap-3 text-sm sm:grid-cols-2">
                <div><dt className="text-muted-foreground">Ankstesnė kaina</dt><dd>{formatEur(revision.totalPriceEur)}</dd></div>
                <div><dt className="text-muted-foreground">Paėmimas</dt><dd>{formatDateRange(revision.pickupDate)}</dd></div>
                <div><dt className="text-muted-foreground">Pristatymas</dt><dd>{formatDateRange(revision.deliveryDate)}</dd></div>
                <div className="min-w-0"><dt className="text-muted-foreground">Apmokėjimas</dt><dd className="break-words">{revision.paymentTerms}</dd></div>
              </dl>
            </article>)}
          </div>
        </details>}
      </main>
    </div>

    {decision && <OfferDecisionDialog open onOpenChange={open => { if (!open) setDecision(null) }} decision={decision} offer={offer} vehicleCount={requestSummary.vehicleCount} onConfirm={confirm} finalFocus={decision === "accept" ? acceptButton : declineButton} />}
  </div>
}
