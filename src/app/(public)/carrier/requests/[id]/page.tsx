import Link from "next/link"
import { notFound } from "next/navigation"
import { PageContainer } from "@/components/layout/page-container"
import { carrierAccess,AccessMessage } from "@/features/carrier/routes/access"
import { CarrierOfferForm } from "@/features/carrier/offers/form"
import { loadCarrierRequests,loadCommercialData } from "@/features/public/marketplace-persistence/load"
import { loadRoutes } from "@/features/public/route-persistence/load"
import { RequestDetails } from "@/features/public/request-detail/details"
import { publishedRequestSummary } from "@/features/public/request-published/context"
export default async function CarrierRequestPage({params}:{params:Promise<{id:string}>}) {
  const access = await carrierAccess()
  if(!access.allowed) return <PageContainer className="space-y-6 py-8"><h1 className="text-3xl font-semibold">Pervežimo užklausa</h1><AccessMessage access={access} /></PageContainer>
  const {id}=await params
  const request=(await loadCarrierRequests(id))[0]
  if(!request) notFound()
  const [routes,data] = await Promise.all([loadRoutes({owner:true}),loadCommercialData()])
  const existing=data?.projected.find(o => o.requestId === id && data.offers.some(r => r.id === o.id && r.viewer_side === "carrier") && ["pending","unavailable","expired"].includes(o.status))
  return <PageContainer className="mx-auto max-w-6xl space-y-6 py-8">
    <Link href="/carrier/requests" className="underline">Visos užklausos</Link><h1 className="break-words text-3xl font-semibold">{publishedRequestSummary(request).route}</h1>
    <div className="grid items-start gap-6 lg:grid-cols-2"><RequestDetails request={request} /><CarrierOfferForm requestId={id} requestVersion={request.requestVersion} routes={routes.filter(r => r.status === "published" && r.acceptingNewRequests)} existing={existing} /></div>
  </PageContainer>
}
