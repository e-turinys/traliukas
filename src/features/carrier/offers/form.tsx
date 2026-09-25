"use client"
import { useState, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { commandClient, commandError } from "@/features/public/marketplace-persistence/client"
import type { PersistedRoute } from "@/features/public/route-persistence/adapter"
import type { RequestOffer } from "@/features/public/request-detail/model"

export function CarrierOfferForm({ requestId,requestVersion,routes,existing }: {requestId:string;requestVersion:number;routes:PersistedRoute[];existing?:RequestOffer}) {
  const router = useRouter()
  const [busy,setBusy] = useState(false), [error,setError] = useState("")
  async function submit(event:FormEvent<HTMLFormElement>) {
    event.preventDefault(); if(busy) return
    const values = new FormData(event.currentTarget), route = routes.find(r => r.id === values.get("route"))
    if(!route) return
    setBusy(true);setError("")
    try {
      const client = await commandClient()
      const {data,error} = await client.rpc("submit_offer",{p_request_id:requestId,p_route_id:route.id,p_expected_request_version:requestVersion,p_expected_route_version:route.version,
        p_expected_offer_version:existing?.offerVersion,
        p_terms:{ total_price:Number(values.get("total_price")),currency:"EUR",planned_pickup_date:String(values.get("pickup")),planned_delivery_date:String(values.get("delivery")),
          payment_terms:String(values.get("payment_terms")),expires_at:new Date(String(values.get("validity"))).toISOString(),carrier_comment:String(values.get("comment")) }})
      if(error) throw error
      router.push(`/offers/${data}`)
    } catch(error) {setError(commandError(error))} finally {setBusy(false)}
  }
  const field="min-w-0 space-y-2"
  return <form onSubmit={submit} className="space-y-5 rounded-xl border bg-card p-4 sm:p-6">
    <h2 className="text-xl font-semibold">{existing ? "Atnaujinti pasiūlymą" : "Pateikti pasiūlymą"}</h2>
    <p className="text-sm text-muted-foreground">Viena bendra kaina už visus užklausos automobilius ir visus paėmimus bei pristatymus.</p>
    <div className={field}><label htmlFor="offer-route">Jūsų maršrutas</label><select id="offer-route" name="route" required defaultValue={existing?.routeId ?? routes[0]?.id} className="min-h-11 w-full rounded-md border bg-background px-3">
      {routes.filter(r => !existing || r.id === existing.routeId).map(r => <option key={r.id} value={r.id}>{r.carrier.name}: {r.origin.city} → {r.destination.city} · {r.dateFrom}–{r.dateTo} · {r.capacityTotal-r.capacityReserved} viet.</option>)}
    </select></div>
    <div className="grid gap-4 sm:grid-cols-2">
      <div className={field}><label htmlFor="offer-price">Visa kaina (EUR)</label><Input id="offer-price" name="total_price" type="number" required min="0.01" max="9999999999.99" step="0.01" defaultValue={existing?.totalPriceEur} /></div>
      <div className={field}><label htmlFor="offer-validity">Galioja iki (jūsų vietos laiku)</label><Input id="offer-validity" name="validity" type="datetime-local" required /><p className="text-xs text-muted-foreground">Galiojimas turi baigtis prieš paėmimo dienos pradžią paėmimo vietos laiku.</p></div>
      <div className={field}><label htmlFor="offer-pickup">Planuojamas paėmimas</label><Input id="offer-pickup" name="pickup" type="date" required defaultValue={existing?.pickupDate} /></div>
      <div className={field}><label htmlFor="offer-delivery">Planuojamas pristatymas</label><Input id="offer-delivery" name="delivery" type="date" required defaultValue={existing?.deliveryDate} /></div>
    </div>
    <div className={field}><label htmlFor="offer-payment">Apmokėjimo sąlygos</label><Textarea id="offer-payment" name="payment_terms" required maxLength={2000} defaultValue={existing?.paymentTerms} /></div>
    <div className={field}><label htmlFor="offer-comment">Komentaras (neprivalomas)</label><Textarea id="offer-comment" name="comment" maxLength={2000} defaultValue={existing?.carrierComment} /></div>
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    <Button type="submit" disabled={busy || !routes.length} className="min-h-11">{busy ? "Saugoma…" : existing ? "Atnaujinti pasiūlymą" : "Pateikti pasiūlymą"}</Button>
  </form>
}
