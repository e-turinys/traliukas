"use client"

import Link from "next/link"
import { useRef, useState } from "react"
import { ChevronDown } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { publishedRequestSummary, publicationCopy } from "../request-published/context"
import { applyRequestEdit, closeRequest, expandRequestVisibility, hydrateRequestDetail, repeatRequest, requestActions, requestOfferGroups, visibleOfferStatus } from "./logic"
import { requestStatusLabels, type RequestDetailPayload } from "./model"
import { RequestDetails } from "./details"
import { RequestEditSection } from "./edit-section"
import { OfferCard } from "./offer-card"
import { ConfirmRequestDialog } from "./confirm-dialog"

export function RequestDetailView({ initialRequest, reviewNow }: { initialRequest: RequestDetailPayload; reviewNow: string }) {
  const [request, setRequest] = useState(() => hydrateRequestDetail(initialRequest))
  const [editing, setEditing] = useState(false)
  const [closing, setClosing] = useState(false)
  const [notice, setNotice] = useState("")
  const heading = useRef<HTMLHeadingElement>(null)
  const closeButton = useRef<HTMLButtonElement>(null)
  const actions = requestActions(request)
  const offerGroups = requestOfferGroups(request)
  const summary = publishedRequestSummary(request)
  const finishEditing = () => { setEditing(false); requestAnimationFrame(() => heading.current?.focus()) }
  return <div className="mx-auto max-w-6xl space-y-6">
    <p className="rounded-lg bg-muted p-4 text-sm text-muted-foreground">Demonstracinė užklausa. Pakeitimai galioja tik šiame puslapyje ir atnaujinus puslapį dingsta. Duomenys neišsaugomi ir vežėjams nesiunčiami.</p>
    <header className="space-y-4">
      <Badge variant="secondary">{requestStatusLabels[request.status]}</Badge>
      <h1 ref={heading} tabIndex={-1} className="break-words text-3xl font-semibold tracking-tight outline-none">{summary.route}</h1>
      <dl className="grid gap-4 text-sm sm:grid-cols-3">
        <div className="min-w-0"><dt className="text-muted-foreground">Automobilis</dt><dd className="break-words">{summary.vehicle}</dd></div>
        <div><dt className="text-muted-foreground">Pageidaujamas paėmimas</dt><dd>{summary.date}</dd></div>
        <div className="min-w-0"><dt className="text-muted-foreground">Matomumas</dt><dd className="break-words">{publicationCopy(summary).audience}</dd></div>
      </dl>
      {!editing && <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        {actions.edit && <Button variant="outline" className="min-h-11" onClick={() => setEditing(true)}>Redaguoti užklausą</Button>}
        {actions.close && <Button ref={closeButton} variant="outline" className="min-h-11" onClick={() => setClosing(true)}>Uždaryti užklausą</Button>}
        {actions.booking && <Button nativeButton={false} render={<Link href={`/bookings/${request.bookingId}`} />} className="min-h-11">Atidaryti pervežimą</Button>}
        {actions.repeat && <Button className="min-h-11" onClick={() => {
          setRequest(repeatRequest(request))
          setNotice("Sukurtas naujas vietinis juodraštis su nukopijuotais duomenimis. Pradinė užklausa lieka uždaryta. Juodraštis neišsaugotas ir nepaskelbtas.")
        }}>Pakartoti užklausą</Button>}
      </div>}
      {request.status === "booked" && <p className="text-sm text-muted-foreground">Vežėjas jau pasirinktas. Sutarto pervežimo informaciją rasite pervežime.</p>}
      {request.status === "completed" && <p className="text-sm text-muted-foreground">Pervežimas užbaigtas. Užklausos duomenys rodomi tik peržiūrai.</p>}
      {request.status === "closed" && <p className="text-sm text-muted-foreground">Ši užklausa uždaryta ir nebus atidaryta iš naujo.</p>}
      {request.status === "draft" && <p className="text-sm text-muted-foreground">Juodraštis nepaskelbtas. Vežėjai jo nemato.</p>}
    </header>
    <p role="status" className="text-sm">{notice}</p>
    {editing ? <RequestEditSection request={request} today={reviewNow.slice(0, 10)} onCancel={finishEditing} onSave={(edit, confirmed) => {
      const next = applyRequestEdit(request, edit, confirmed, reviewNow.slice(0, 10))
      setRequest(next)
      setNotice(next.requestVersion !== request.requestVersion ? "Užklausa pakeista šiame puslapyje. Ankstesni pasiūlymai nebegalioja." : "Pakeitimai pritaikyti šiame puslapyje. Pasiūlymai lieka galioti.")
      finishEditing()
    }} /> : <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
      <section aria-labelledby="offers-heading" className="min-w-0 space-y-4">
        <h2 id="offers-heading" className="text-xl font-semibold">{offerGroups.selected ? "Pasirinktas vežėjas" : "Vežėjų pasiūlymai"}</h2>
        {offerGroups.selected && <OfferCard offer={offerGroups.selected} status={visibleOfferStatus(request, offerGroups.selected, reviewNow)} emphasis="selected" />}
        {offerGroups.current.length ? offerGroups.current.map(offer => <OfferCard key={offer.id} offer={offer} status={visibleOfferStatus(request, offer, reviewNow)} />) : !offerGroups.selected && request.offers.length === 0 ? <div className="space-y-4 rounded-xl border p-5">
          <h3 className="font-semibold">Pasiūlymų dar nėra</h3>
          {request.status === "active" && <p className="text-sm text-muted-foreground">Čia galėsite palyginti vežėjų kainas ir pervežimo datas.</p>}
          {request.status === "active" && request.visibility === "targeted" && <Button className="h-auto min-h-11 w-full whitespace-normal py-3" onClick={() => { setRequest(expandRequestVisibility(request)); setNotice("Matomumas pakeistas tik šiame puslapyje. Vežėjams nieko neišsiųsta.") }}>Parodyti ir kitiems tinkamiems vežėjams</Button>}
        </div> : null}
        {offerGroups.historical.length > 0 && <details className="group/history rounded-xl border bg-muted/20">
          <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring group-open/history:border-b">
            <span>Ankstesni pasiūlymai ({offerGroups.historical.length})</span>
            <ChevronDown aria-hidden="true" className="size-4 shrink-0 transition-transform group-open/history:rotate-180" />
          </summary>
          <div className="space-y-3 p-3 sm:p-4">{offerGroups.historical.map(offer => <OfferCard key={offer.id} offer={offer} status={visibleOfferStatus(request, offer, reviewNow)} emphasis="historical" />)}</div>
        </details>}
      </section>
      <RequestDetails request={request} />
    </div>}
    <ConfirmRequestDialog open={closing} onOpenChange={setClosing} title="Uždaryti užklausą?" description="Esami pasiūlymai nebegalios. Šios užklausos atidaryti iš naujo negalėsite, tačiau galėsite ją pakartoti." action="Patvirtinti uždarymą" finalFocus={closeButton} onConfirm={() => {
      setRequest(closeRequest(request, true)); setClosing(false); setNotice("Užklausa uždaryta šiame puslapyje. Ankstesni pasiūlymai nebegalioja.")
      requestAnimationFrame(() => heading.current?.focus())
    }} />
  </div>
}
