import Link from "next/link"
import { PageContainer } from "@/components/layout/page-container"
import { Button } from "@/components/ui/button"

export default function RequestNotFound() {
  return <PageContainer className="space-y-5 py-12"><h1 className="text-3xl font-semibold">Užklausa nerasta</h1><p className="text-muted-foreground">Tokios užklausos nėra.</p><Button nativeButton={false} render={<Link href="/request/new" />} className="min-h-11">Sukurti užklausą</Button></PageContainer>
}
