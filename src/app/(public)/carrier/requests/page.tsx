import Link from "next/link"
import { PageContainer } from "@/components/layout/page-container"
import { Button } from "@/components/ui/button"
import { carrierAccess,AccessMessage } from "@/features/carrier/routes/access"
import { loadCarrierRequests } from "@/features/public/marketplace-persistence/load"
import { publishedRequestSummary } from "@/features/public/request-published/context"
export default async function CarrierRequestsPage() {
  const access = await carrierAccess()
  const requests = access.allowed ? await loadCarrierRequests() : []
  return <PageContainer className="space-y-6 py-8"><h1 className="text-3xl font-semibold">Pervežimo užklausos</h1>
    {!access.allowed ? <AccessMessage access={access} /> : <><Link href="/carrier/routes" className="underline">Mano maršrutai</Link>
    {!requests.length && <p>Aktyvių užklausų nėra.</p>}
    <ul className="grid gap-4 sm:grid-cols-2">{requests.map(r => {const summary=publishedRequestSummary(r);return <li key={r.id} className="space-y-3 rounded-xl border bg-card p-6">
      <h2 className="text-xl font-semibold">{summary.route}</h2><p>{summary.vehicleSummary}</p><p>{summary.date}</p>
      <Button nativeButton={false} render={<Link href={`/carrier/requests/${r.id}`} />} className="min-h-11">Peržiūrėti užklausą</Button>
    </li>})}</ul></>}
  </PageContainer>
}
