import Link from "next/link"
import { PageContainer } from "@/components/layout/page-container"
import { Button } from "@/components/ui/button"
import { carrierAccess, AccessMessage } from "@/features/carrier/routes/access"
import { loadRoutes } from "@/features/public/route-persistence/load"
import { formatDateRange } from "@/lib/format-date"
import { getAvailableCapacity } from "@/lib/route-capacity"

const labels: Record<string,string> = {draft:"Juodraštis",published:"Paskelbtas",expired:"Pasibaigęs",cancelled:"Uždarytas"}
export default async function MyRoutesPage() {
  const access = await carrierAccess()
  const routes = access.allowed ? await loadRoutes({owner:true}) : []
  return <div className="marketplace-theme"><PageContainer className="space-y-6 py-8">
    <h1 className="text-3xl font-semibold">Mano maršrutai</h1>
    {!access.allowed ? <AccessMessage access={access} /> : <>
      <p>{access.carrier.display_name}</p>
      <Button nativeButton={false} render={<Link href="/carrier/routes/new" />} className="min-h-11">Sukurti maršrutą</Button>
      <Button variant="outline" nativeButton={false} render={<Link href="/carrier/requests" />} className="min-h-11">Peržiūrėti užklausas</Button>
      {!routes.length && <p>Maršrutų dar nėra.</p>}
      <ul className="grid gap-4 sm:grid-cols-2">{routes.map(route => <li key={route.id} className="space-y-3 rounded-xl border bg-card p-6">
        <p className="text-sm text-muted-foreground">{labels[route.status]}{route.status === "published" && !route.acceptingNewRequests ? " · Naujos užklausos nepriimamos" : ""}</p>
        <h2 className="text-xl font-semibold">{route.origin.city} → {route.destination.city}</h2>
        <p>{formatDateRange(route.dateFrom,route.dateTo)}</p><p>Laisvos vietos: {getAvailableCapacity(route)} / {route.capacityTotal}</p>
        <Button variant="outline" nativeButton={false} render={<Link href={`/carrier/routes/${route.id}`} />} className="min-h-11">Valdyti maršrutą</Button>
      </li>)}</ul>
    </>}
  </PageContainer></div>
}
