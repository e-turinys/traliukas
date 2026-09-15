import Link from "next/link"
import { PageContainer } from "@/components/layout/page-container"
import { Button } from "@/components/ui/button"

export default function OfferNotFound() {
  return <PageContainer className="space-y-5 py-12">
    <h1 className="text-3xl font-semibold">Pasiūlymas nerastas</h1>
    <p className="text-muted-foreground">Tokio pasiūlymo nėra arba jis jums nepasiekiamas.</p>
    <Button nativeButton={false} render={<Link href="/" />} className="min-h-11">Grįžti į pradžią</Button>
  </PageContainer>
}
