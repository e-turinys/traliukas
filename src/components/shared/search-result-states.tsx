"use client"

import Link from "next/link"
import { SearchX, TriangleAlert } from "lucide-react"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

export function EmptySearchResults({ requestUrl }: { requestUrl: string }) {
  return <Card><CardContent className="space-y-4 py-6">
    <SearchX aria-hidden="true" className="size-6 text-muted-foreground" />
    <h2 className="text-lg font-semibold">Tikslių maršrutų neradome</h2>
    <p className="text-sm text-muted-foreground">Pakeiskite paiešką ar filtrus arba pateikite užklausą vežėjams.</p>
    <Link href={requestUrl} className={cn(buttonVariants(), "min-h-11 w-full whitespace-normal text-center")}>Gauti vežėjų pasiūlymus</Link>
  </CardContent></Card>
}

export function SearchResultsError({ retry }: { retry: () => void }) {
  return <Card><CardContent className="space-y-4 py-6" role="alert">
    <TriangleAlert aria-hidden="true" className="size-6 text-muted-foreground" />
    <h1 className="text-xl font-semibold">Nepavyko įkelti maršrutų</h1>
    <p className="text-muted-foreground">Bandykite dar kartą. Jūsų paieška išsaugota adrese.</p>
    <Button className="min-h-11" onClick={retry}>Bandyti dar kartą</Button>
  </CardContent></Card>
}

export function SearchResultsSkeleton() {
  return <div role="status" aria-label="Įkeliami maršrutai" className="space-y-6">
    <span className="sr-only">Įkeliami maršrutai</span>
    <Skeleton className="h-24 w-full" />
    <div className="grid gap-6 lg:grid-cols-[minmax(0,45fr)_minmax(0,55fr)]" aria-hidden="true">
      <div className="space-y-4">{[0, 1, 2].map((item) => <Skeleton key={item} className="h-72 w-full" />)}</div>
      <Skeleton className="hidden h-[36rem] lg:block" />
    </div>
  </div>
}
