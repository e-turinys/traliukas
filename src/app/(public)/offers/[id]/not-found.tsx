import Link from "next/link"
import { PageContainer } from "@/components/layout/page-container"
import { Button } from "@/components/ui/button"

export default function OfferNotFound() {
  return <div className="marketplace-theme bg-background text-foreground"><PageContainer className="py-12"><section className="mx-auto max-w-xl space-y-4 rounded-xl border bg-card p-6">
    <h1 className="text-3xl font-semibold">Pasiūlymas nerastas</h1>
    <p className="text-muted-foreground">Tokio pasiūlymo nėra arba jis jums nepasiekiamas.</p>
    <Button nativeButton={false} render={<Link href="/" />} className="h-auto min-h-11 py-3 whitespace-normal">Grįžti į pradžią</Button>
  </section></PageContainer></div>
}
