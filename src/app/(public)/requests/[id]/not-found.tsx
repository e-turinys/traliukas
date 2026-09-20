import Link from "next/link"
import { PageContainer } from "@/components/layout/page-container"
import { Button } from "@/components/ui/button"

export default function RequestNotFound() {
  return <div className="marketplace-theme bg-background text-foreground"><PageContainer className="py-12"><section className="mx-auto max-w-xl space-y-4 rounded-xl border bg-card p-6"><h1 className="text-2xl font-semibold sm:text-3xl">Užklausa nerasta</h1><p className="text-muted-foreground">Tokios užklausos nėra.</p><Button nativeButton={false} render={<Link href="/request/new" />} className="h-auto min-h-11 py-3 whitespace-normal">Sukurti užklausą</Button></section></PageContainer></div>
}
