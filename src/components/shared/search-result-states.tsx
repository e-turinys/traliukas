"use client"

import Link from "next/link"
import { SearchX, TriangleAlert } from "lucide-react"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

export function EmptySearchResults({ requestUrl }: { requestUrl: string }) {
  return <Card className="border py-6 ring-0"><CardContent className="space-y-4 px-6 sm:p-8">
    <SearchX aria-hidden="true" className="size-8 text-primary" />
    <h2 className="text-2xl font-semibold tracking-tight">Neradome tinkamo maršruto</h2>
    <p className="text-base leading-relaxed text-muted-foreground">Pakeiskite paiešką ar filtrus arba sukurkite pervežimo užklausą. Vežėjai galės pateikti savo pasiūlymus.</p>
    <Link href={requestUrl} className={cn(buttonVariants(), "h-auto min-h-11 w-full whitespace-normal px-6 py-3 text-center hover:bg-teal-800 sm:w-auto")}>Sukurti pervežimo užklausą</Link>
  </CardContent></Card>
}

export function SearchResultsError({ retry }: { retry: () => void }) {
  return <Card className="border ring-0"><CardContent className="space-y-4 p-6" role="alert">
    <TriangleAlert aria-hidden="true" className="size-6 text-muted-foreground" />
    <h1 className="text-xl font-semibold">Nepavyko įkelti maršrutų</h1>
    <p className="text-muted-foreground">Bandykite dar kartą. Jūsų paieška išsaugota adrese.</p>
    <Button className="h-auto min-h-11 whitespace-normal px-6 py-3 hover:bg-teal-800" onClick={retry}>Bandyti dar kartą</Button>
  </CardContent></Card>
}

export function SearchResultsSkeleton() {
  return <div role="status" aria-label="Įkeliami maršrutai" className="space-y-6">
    <span className="sr-only">Įkeliami maršrutai</span>
    <Skeleton className="h-24 w-full" />
    <div className="grid gap-6 lg:grid-cols-3" aria-hidden="true">
      <div className="space-y-4 lg:col-span-2">{[0, 1, 2].map((item) => <Skeleton key={item} className="h-72 w-full" />)}</div>
      <Skeleton className="hidden h-64 lg:block" />
    </div>
  </div>
}
