import Link from "next/link"
import { PageContainer } from "@/components/layout/page-container"
import { Button } from "@/components/ui/button"

export default function RouteNotFound() {
  return <div className="marketplace-theme bg-background text-foreground"><PageContainer className="space-y-4 py-12">
    <h1 className="text-2xl font-semibold">Maršrutas nerastas</h1>
    <p className="text-muted-foreground">Šio maršruto nėra. Ieškokite kitų vežėjų maršrutų.</p>
    <Button nativeButton={false} render={<Link href="/search" />} className="h-auto min-h-11 px-6 py-3 whitespace-normal">Ieškoti maršrutų</Button>
  </PageContainer></div>
}
