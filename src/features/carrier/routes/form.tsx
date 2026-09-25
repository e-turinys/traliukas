"use client"
import { useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createBrowserSupabaseClient } from "@/lib/supabase/client"
import { vehicleCategoryLabels, type VehicleCategory } from "@/lib/types/carrier-route"
import type { LocationOption } from "@/lib/types/location"
import type { PersistedRoute } from "@/features/public/route-persistence/adapter"
import type { Database } from "@/lib/supabase/database.types"

type SaveArgs = Database["api"]["Functions"]["save_route"]["Args"]
export function RouteForm({ route, places, carriers = [] }: { route?: PersistedRoute; places: LocationOption[]; carriers?: { slug: string | null; display_name: string | null }[] }) {
  const router = useRouter()
  const [carrierSlug,setCarrierSlug] = useState(carriers[0]?.slug ?? "")
  const [stops,setStops] = useState(route ? [route.origin,...route.stops,route.destination].map(p => p.id) : ["",""])
  const [dateFrom,setDateFrom] = useState(route?.dateFrom ?? "")
  const [dateTo,setDateTo] = useState(route?.dateTo ?? "")
  const [capacity,setCapacity] = useState(String(route?.capacityTotal ?? 1))
  const [categories,setCategories] = useState<VehicleCategory[]>(route?.vehicleCategories ?? ["car"])
  const [nonRunning,setNonRunning] = useState(route?.supportsNonRunning ?? false)
  const [flexible,setFlexible] = useState(route?.routeFlexible ?? false)
  const [accepting,setAccepting] = useState(route?.acceptingNewRequests ?? true)
  const [busy,setBusy] = useState(false)
  const busyRef = useRef(false)
  const [error,setError] = useState("")
  const [uncertain,setUncertain] = useState(false)
  const pending = useRef<SaveArgs | null>(null)
  const key = useRef<string | null>(null)
  async function run(publish: boolean, close = false) {
    if (busyRef.current) return
    setError("")
    if (!close && !pending.current && (!stops[0] || stops.some(s => !s) || stops[0] === stops.at(-1) || !dateFrom || !dateTo || dateFrom > dateTo
      || !/^[1-9][0-9]*$/.test(capacity) || Number(capacity)<(route?.capacityReserved ?? 0) || !categories.length)) {
      setError("Pasirinkite skirtingas pradžios ir pabaigos vietas, tinkamas datas, teigiamą vietų skaičių ir bent vieną kategoriją."); return
    }
    busyRef.current=true; setBusy(true)
    try {
      const client = createBrowserSupabaseClient()
      const {data:identity,error:authError} = await client.auth.getUser()
      if (authError || !identity.user) throw new Error("Prisijunkite iš naujo ir pakartokite veiksmą.")
      if (close && route) {
        const {error} = await client.rpc("close_route",{p_route_id:route.id,p_expected_version:route.version})
        if (error) throw error
      } else {
        key.current ??= crypto.randomUUID()
        const args: SaveArgs = pending.current ?? {p_route_id:route?.id,p_expected_version:route?.version,p_create_key:key.current,p_publish:publish,
          p_carrier_slug:route ? undefined : carrierSlug,
          p_payload:{stops,date_from:dateFrom,date_to:dateTo,capacity_total:Number(capacity),supported_categories:categories,
            supports_non_running:nonRunning,route_flexible:flexible,accepting_new_requests:accepting}}
        if (!route) {pending.current=args; setUncertain(true)}
        const {data,error} = await client.rpc("save_route",args)
        if (error || !data) {
          // Definite server rejection permits correction. Network-uncertain
          // creation keeps its original payload/key for an idempotent retry.
          if (error?.code && /^[0-9A-Z]{5}$/.test(error.code)) {pending.current=null; setUncertain(false)}
          throw error ?? new Error("Unable to save")
        }
        router.replace(`/carrier/routes/${data}`)
      }
      router.refresh()
    } catch (failure) {
      const code = failure && typeof failure === "object" && "code" in failure ? failure.code : null
      setError(code === "42501" ? "Patikrinkite vežėjo savininko ir uždaros beta versijos prieigą."
        : code === "40001" ? "Maršrutas jau pakeistas. Atnaujinkite puslapį prieš redaguodami."
        : "Nepavyko išsaugoti. Patikrinkite datas, vietas ir talpą. Jei ryšys nutrūko, pakartokite veiksmą arba atnaujinkite puslapį.")
    } finally {busyRef.current=false; setBusy(false)}
  }
  if (route && ["cancelled","expired"].includes(route.status)) return <p>Šis maršrutas uždarytas. Galite sukurti naują maršrutą.</p>
  return <form className="space-y-6" onSubmit={e => {e.preventDefault(); const publish=(e.nativeEvent as SubmitEvent).submitter?.getAttribute("value") === "publish"; void run(publish)}}>
    <fieldset disabled={busy || uncertain} className="space-y-6 disabled:opacity-70">
      {!route && carriers.length>1 && <div className="space-y-2"><Label htmlFor="route-carrier">Vežėjas</Label>
        <select id="route-carrier" value={carrierSlug} onChange={e => setCarrierSlug(e.target.value)} className="min-h-11 w-full rounded-md border bg-background px-3">
          {carriers.map(c => <option key={c.slug} value={c.slug!}>{c.display_name}</option>)}
        </select>
      </div>}
      <div className="space-y-4">
        {stops.map((value,index) => <div key={index} className="space-y-2">
          <Label htmlFor={`route-stop-${index}`}>{index===0 ? "Iš kur?" : index===stops.length-1 ? "Į kur?" : `Tarpinis sustojimas ${index}`}</Label>
          <div className="flex flex-wrap gap-2">
            <select id={`route-stop-${index}`} required value={value} onChange={e => setStops(stops.map((s,i) => i===index ? e.target.value : s))} className="min-h-11 min-w-0 flex-1 rounded-md border bg-background px-3 text-base">
              <option value="">Pasirinkite miestą</option>{places.map(p => <option key={p.id} value={p.id}>{p.city}, {p.country}</option>)}
            </select>
            {index>0 && index<stops.length-1 && <>
              <Button type="button" variant="outline" aria-label={`Sustojimą ${index} aukštyn`} disabled={index===1} onClick={() => {const next=[...stops]; [next[index-1],next[index]]=[next[index],next[index-1]]; setStops(next)}}>↑</Button>
              <Button type="button" variant="outline" aria-label={`Pašalinti sustojimą ${index}`} onClick={() => setStops(stops.filter((_,i) => i!==index))}>Pašalinti</Button>
            </>}
          </div>
        </div>)}
        <Button type="button" variant="outline" disabled={stops.length>=32} onClick={() => setStops([...stops.slice(0,-1),"",stops.at(-1)!])}>Pridėti sustojimą</Button>
        <p className="text-sm text-muted-foreground">Nurodykite tik viešas miesto ar vietovės vietas kelionės krypties tvarka.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2"><Label htmlFor="route-date-from">Nuo</Label><Input id="route-date-from" type="date" required value={dateFrom} onChange={e => setDateFrom(e.target.value)} /></div>
        <div className="space-y-2"><Label htmlFor="route-date-to">Iki</Label><Input id="route-date-to" type="date" required value={dateTo} min={dateFrom} onChange={e => setDateTo(e.target.value)} /></div>
      </div>
      <div className="space-y-2"><Label htmlFor="route-capacity">Kiek vietų automobiliams turite?</Label><Input id="route-capacity" type="number" min={Math.max(1,route?.capacityReserved ?? 0)} step={1} required value={capacity} onChange={e => setCapacity(e.target.value)} />
        <p className="text-sm text-muted-foreground">1 automobilis = 1 vieta. Rezervuota: {route?.capacityReserved ?? 0}. Bendras vietų skaičius negali būti mažesnis už rezervuotą.</p>
      </div>
      <fieldset className="space-y-3"><legend className="mb-3 font-medium">Ką galite vežti?</legend>
        {(Object.entries(vehicleCategoryLabels) as [VehicleCategory,string][]).map(([value,label]) => <label key={value} className="flex min-h-11 items-center gap-3"><input type="checkbox" id={`category-${value}`} checked={categories.includes(value)} onChange={e => setCategories(e.target.checked ? [...categories,value] : categories.filter(c => c!==value))} />{label}</label>)}
      </fieldset>
      <label className="flex min-h-11 items-center gap-3"><input id="route-non-running" type="checkbox" checked={nonRunning} onChange={e => setNonRunning(e.target.checked)} />Galiu vežti nevažiuojančius automobilius</label>
      <label className="flex min-h-11 items-center gap-3"><input id="route-flexible" type="checkbox" checked={flexible} onChange={e => setFlexible(e.target.checked)} />Maršrutas lankstus</label>
      <p className="text-sm text-muted-foreground">Dėl nukrypimo galima tartis. Paieška remiasi nurodytais sustojimais.</p>
      <label className="flex min-h-11 items-center gap-3"><input id="route-accepting" type="checkbox" checked={accepting} onChange={e => setAccepting(e.target.checked)} />Priimti naujas užklausas</label>
    </fieldset>
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    {uncertain && <p role="status">Pakartotinis bandymas išsaugos tą patį maršrutą. Įvesti duomenys išliks šiame puslapyje.</p>}
    <div className="flex flex-col gap-3 sm:flex-row">
      <Button type="submit" value="publish" disabled={busy} className="min-h-11">{busy ? "Palaukite…" : uncertain ? "Pakartoti išsaugojimą" : route?.status === "published" ? "Išsaugoti pakeitimus" : "Paskelbti maršrutą"}</Button>
      {!uncertain && route?.status !== "published" && <Button type="submit" value="draft" variant="outline" disabled={busy} className="min-h-11">Išsaugoti juodraštį</Button>}
      {route && <Button type="button" variant="outline" disabled={busy} className="min-h-11" onClick={() => {if (window.confirm("Uždaryti maršrutą? Jis nebebus rodomas paieškoje.")) void run(false,true)}}>Uždaryti maršrutą</Button>}
      <Button variant="outline" nativeButton={false} render={<Link href="/carrier/routes" />} className="min-h-11">Mano maršrutai</Button>
    </div>
  </form>
}
