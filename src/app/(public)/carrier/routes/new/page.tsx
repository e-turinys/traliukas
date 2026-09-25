import { PageContainer } from "@/components/layout/page-container"
import { carrierAccess, AccessMessage } from "@/features/carrier/routes/access"
import { RouteForm } from "@/features/carrier/routes/form"
export default async function NewRoutePage() {
  const access = await carrierAccess()
  return <div className="marketplace-theme"><PageContainer className="max-w-3xl space-y-6 py-8"><h1 className="text-3xl font-semibold">Sukurti maršrutą</h1>
    {access.allowed ? <RouteForm places={access.places} carriers={access.carriers} /> : <AccessMessage access={access} />}
  </PageContainer></div>
}
