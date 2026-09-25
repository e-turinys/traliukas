"use client"

import { useState } from "react"
import { useSearchParams } from "next/navigation"
import { List, Map, SlidersHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetClose } from "@/components/ui/sheet"
import { MarketplaceRouteCard } from "@/components/shared/marketplace-route-card"
import { EmptySearchResults } from "@/components/shared/search-result-states"
import type { CarrierRoute, RouteMatch } from "@/lib/types/carrier-route"
import type { LocationOption } from "@/lib/types/location"
import { cn } from "@/lib/utils"
import { SearchEditForm } from "./search-edit-form"
import { SearchFilters, SearchSelect } from "./search-filters"
import { dateLabel, readFilters, readSearch, readRequestedVehicleCount, requestHref } from "./search-query"
import { vehicleCountLabel } from "./vehicle-summary"
import { matchRoutes } from "./search-matching"

const copy = {
  title: "Vežėjų maršrutai", edit: "Keisti", hide: "Uždaryti paiešką", filters: "Filtrai",
  invalid: "Patikrinkite paiešką: pasirinkite skirtingas vietas ir tinkamą datą arba „Bet kada“.",
  recommendation: "Atitikimas yra rekomendacija. Paėmimo, pristatymo ir automobilio vežimo galimybes patvirtinkite su vežėju.",
  mock: "Rodomi demonstraciniai maršrutai ir vežėjų duomenys.",
}

function MapPanel() {
  return <section aria-label="Maršrutų žemėlapis" className="flex items-center justify-center rounded-xl border bg-card p-8">
    <div className="max-w-sm space-y-3 text-center">
      <Map aria-hidden="true" className="mx-auto size-10 text-muted-foreground" />
      <h2 className="text-lg font-semibold">Čia bus maršrutų žemėlapis</h2>
      <p className="text-sm text-muted-foreground">Žemėlapis dar nepasiekiamas. Maršrutus ir jų informaciją rasite sąraše.</p>
    </div>
  </section>
}

function RouteList({ matches, servedSegment }: { matches: RouteMatch[]; servedSegment?: { from: LocationOption; to: LocationOption } }) {
  const [limit, setLimit] = useState(4)
  return <div className="space-y-4">
    <ul className="space-y-4">{matches.slice(0, limit).map((match) => <li key={match.route.id}><MarketplaceRouteCard variant="result" {...match} servedSegment={servedSegment} /></li>)}</ul>
    {matches.length > limit && <Button variant="outline" className="h-auto min-h-11 whitespace-normal px-4 py-2 w-full" onClick={() => setLimit((value) => value + 4)}>Rodyti daugiau</Button>}
  </div>
}

export function SearchResults({ today, routes, demo = false }: { today: string; routes: CarrierRoute[]; demo?: boolean }) {
  const searchParams = useSearchParams()
  const query = searchParams.toString()
  const params = new URLSearchParams(query)
  const search = readSearch(params)
  const filters = readFilters(params)
  const [editing, setEditing] = useState(false)
  const [desktopFilters, setDesktopFilters] = useState(false)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [view, setView] = useState<"list" | "map">("list")
  const { exact, alternatives } = matchRoutes(routes, params, today)
  const activeCount = Number(filters.verified) + Number(filters.rating !== "any") + Number(filters.vehicle !== "any") + Number(filters.nonRunning) + Number(search.date.type !== "anytime")
  const showEditor = editing || search.invalid
  const sort = ["date", "rating"].includes(params.get("sort") ?? "") ? params.get("sort")! : "best"

  function update(next: URLSearchParams) {
    // Native history updates integrate with useSearchParams; filtering the server-loaded supply needs no server request.
    window.history.pushState(null, "", `/search${next.size ? `?${next}` : ""}`)
  }

  return <div className="space-y-6">
    <Card className="overflow-visible border py-6 shadow-sm ring-0"><CardContent className="space-y-4 px-4 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0 space-y-1">
          <h2 className="text-xl font-semibold">{search.from?.city ?? "Iš kur?"} → {search.to?.city ?? "Į kur?"}</h2>
          <p className="text-sm text-muted-foreground">{vehicleCountLabel(readRequestedVehicleCount(params))} · {search.invalid ? "Patikslinkite paiešką" : dateLabel(search.date)}</p>
        </div>
        <Button variant="outline" className="h-auto min-h-11 whitespace-normal px-4 py-2" aria-expanded={showEditor} aria-controls="search-editor" onClick={() => setEditing(!editing)} disabled={search.invalid}>{showEditor ? copy.hide : copy.edit}</Button>
      </div>
      {showEditor && <div id="search-editor" className="space-y-4 border-t pt-4">
        {search.invalid && <p role="status" className="text-sm text-muted-foreground">{copy.invalid}</p>}
        <SearchEditForm key={query} query={query} onSubmit={(next) => { update(next); setEditing(false); setView("list") }} />
      </div>}
    </CardContent></Card>

    <div className="space-y-2"><h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{copy.title}</h1>
      {demo && <p className="text-sm text-muted-foreground">{copy.mock}</p>}
      {!search.invalid && <p role="status" className="text-sm">Tinkami maršrutai: <strong>{exact.length}</strong>{alternatives.length > 0 && <> · Alternatyvūs maršrutai: <strong>{alternatives.length}</strong></>}</p>}
    </div>
    {!search.invalid && <>
      <div className="flex flex-col gap-4 rounded-xl border bg-card p-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Button variant="outline" className="hidden h-auto min-h-11 whitespace-normal px-4 py-2 lg:inline-flex" aria-expanded={desktopFilters} aria-controls="desktop-search-filters" onClick={() => setDesktopFilters(!desktopFilters)}><SlidersHorizontal aria-hidden="true" />{copy.filters}{activeCount > 0 && ` (${activeCount})`}</Button>
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger render={<Button variant="outline" className="h-auto min-h-11 whitespace-normal px-4 py-2 w-full lg:hidden" />}><SlidersHorizontal aria-hidden="true" />{copy.filters}{activeCount > 0 && ` (${activeCount})`}</SheetTrigger>
            <SheetContent side="bottom" showCloseButton={false} className="marketplace-theme max-h-dvh overflow-y-auto bg-card">
              <SheetHeader><SheetTitle>Paieškos filtrai</SheetTitle><SheetDescription>Pasirinkite kriterijus ir taikykite juos maršrutams.</SheetDescription></SheetHeader>
              <div className="px-4"><SearchFilters key={query} query={query} apply={(next) => { update(next); setSheetOpen(false) }} /></div>
              <SheetClose render={<Button variant="outline" className="mx-4 mb-4 min-h-11" />}>Uždaryti</SheetClose>
            </SheetContent>
          </Sheet>
        </div>
        <div className="w-full sm:w-60"><SearchSelect label="Rikiuoti" value={sort} onChange={(value) => { if (value === "best") params.delete("sort"); else params.set("sort", value); update(params) }} options={[{ value: "best", label: "Tinkamiausi" }, { value: "date", label: "Artimiausia data" }, { value: "rating", label: "Geriausiai įvertinti" }]} /></div>
      </div>
      {desktopFilters && <div id="desktop-search-filters" className="hidden rounded-xl border bg-card p-6 lg:block"><SearchFilters key={query} query={query} apply={update} /></div>}
      <p className="text-sm text-muted-foreground">{copy.recommendation}</p>
      <div role="group" aria-label="Rezultatų rodymas" className="grid grid-cols-2 gap-2 lg:hidden">
        <Button variant={view === "list" ? "secondary" : "outline"} className="h-auto min-h-11 whitespace-normal px-4 py-2" aria-pressed={view === "list"} aria-controls="search-route-list" onClick={() => setView("list")}><List aria-hidden="true" />Sąrašas</Button>
        <Button variant={view === "map" ? "secondary" : "outline"} className="h-auto min-h-11 whitespace-normal px-4 py-2" aria-pressed={view === "map"} aria-controls="search-map" onClick={() => setView("map")}><Map aria-hidden="true" />Žemėlapis</Button>
      </div>
      <div className="grid items-start gap-6 lg:grid-cols-3">
        <div id="search-route-list" className={cn("min-w-0 space-y-6 lg:col-span-2", view === "map" && "hidden lg:block")}>
          {exact.length ? <section aria-label="Tinkami maršrutai"><RouteList key={`exact-${query}`} matches={exact} servedSegment={search.from && search.to ? { from: search.from, to: search.to } : undefined} /></section> : <EmptySearchResults requestUrl={requestHref(params)} />}
          {alternatives.length > 0 && <section className="space-y-4 border-t pt-6" aria-labelledby="alternative-heading">
            <h2 id="alternative-heading" className="text-xl font-semibold">Galimi alternatyvūs maršrutai</h2>
            <p className="text-sm text-muted-foreground">Paėmimo vieta sutampa, tačiau pristatymo miestas skiriasi. Dėl pristatymo į jūsų pasirinktą vietą reikia tartis su vežėju.</p>
            <RouteList key={`alternatives-${query}`} matches={alternatives} />
          </section>}
        </div>
        <div id="search-map" className={cn("min-w-0 lg:sticky lg:top-6", view === "list" && "hidden lg:block")}><MapPanel /></div>
      </div>
    </>}
  </div>
}
