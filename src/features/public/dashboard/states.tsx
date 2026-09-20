"use client"

import { TriangleAlert } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function DashboardSkeleton() {
  return <div role="status" aria-label="Įkeliamas kliento skydelis" className="mx-auto max-w-6xl space-y-8">
    <span className="sr-only">Įkeliamas kliento skydelis</span>
    <div className="space-y-3" aria-hidden="true">
      <Skeleton className="h-10 w-3/4 max-w-xl" />
      <Skeleton className="h-5 w-full max-w-2xl" />
      <Skeleton className="h-11 w-full sm:w-56" />
    </div>
    <div className="space-y-4" aria-hidden="true">
      <Skeleton className="h-8 w-48" />
      <div className="grid gap-4 md:grid-cols-2"><Skeleton className="h-64 w-full" /><Skeleton className="h-64 w-full" /></div>
    </div>
    <Skeleton aria-hidden="true" className="h-11 w-full max-w-md" />
  </div>
}

export function DashboardError({ retry }: { retry: () => void }) {
  return <Card className="mx-auto max-w-xl border bg-card shadow-none ring-0"><CardContent role="alert" className="space-y-4 py-6">
    <TriangleAlert aria-hidden="true" className="size-7 text-muted-foreground" />
    <div className="space-y-2">
      <h1 className="text-xl font-semibold">Nepavyko įkelti paskyros duomenų</h1>
      <p className="text-muted-foreground">Bandykite įkelti puslapį dar kartą.</p>
    </div>
    <Button className="h-auto min-h-11 whitespace-normal py-3" onClick={retry}>Bandyti dar kartą</Button>
  </CardContent></Card>
}
