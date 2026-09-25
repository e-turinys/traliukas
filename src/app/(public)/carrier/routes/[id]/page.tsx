import Link from "next/link"
import { notFound } from "next/navigation"
import { PageContainer } from "@/components/layout/page-container"
import { carrierAccess, AccessMessage } from "@/features/carrier/routes/access"
import { RouteForm } from "@/features/carrier/routes/form"
import { loadRoutes } from "@/features/public/route-persistence/load"
import { isRouteId } from "@/features/public/route-persistence/adapter"
export default async function ManageRoutePage({params}: {params:Promise<{id:string}>}) {
  const {id} = await params
  if (!isRouteId(id)) notFound()
  const access = await carrierAccess()
  if (!access.allowed) return <PageContainer className="space-y-6 py-8"><h1 className="text-3xl font-semibold">Mano maršrutas</h1><AccessMessage access={access} /></PageContainer>
  const route = (await loadRoutes({id,owner:true}))[0]
  if (!route) notFound()
  if (!access.carriers.some(c => c.id === route.carrier.id)) return <PageContainer className="space-y-6 py-8"><h1 className="text-3xl font-semibold">Mano maršrutas</h1><p>Šiam vežėjui reikalinga aktyvi beta versijos prieiga ir užpildyti duomenys.</p></PageContainer>
  return <div className="marketplace-theme"><PageContainer className="max-w-3xl space-y-6 py-8">
    <h1 className="text-3xl font-semibold">{route.origin.city} → {route.destination.city}</h1>
    <p role="status">{route.status === "published" ? "Maršrutas paskelbtas" : route.status === "draft" ? "Juodraštis išsaugotas" : "Maršrutas uždarytas"}</p>
    {route.status === "published" && <Link className="inline-flex min-h-11 items-center text-primary underline" href={`/routes/${route.id}`}>Peržiūrėti viešą maršrutą</Link>}
    <RouteForm key={`${route.id}-${route.updatedAt}`} route={route} places={access.places} />
  </PageContainer></div>
}
