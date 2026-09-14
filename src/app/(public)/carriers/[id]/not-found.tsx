import Link from "next/link"
import { PageContainer } from "@/components/layout/page-container"
import { Button } from "@/components/ui/button"

export default function CarrierNotFound() {
  return <PageContainer className="space-y-5 py-12">
    <h1 className="text-2xl font-semibold">Vežėjas nerastas</h1>
    <p className="text-muted-foreground">Šio vežėjo profilio nėra. Ieškokite kitų vežėjų maršrutų.</p>
    <Button nativeButton={false} render={<Link href="/search" />} className="min-h-11">Ieškoti maršrutų</Button>
  </PageContainer>
}
