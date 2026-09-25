import { isRouteId } from "@/features/public/route-persistence/adapter"
import { loadRealRequest } from "@/features/public/marketplace-persistence/load"
import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { PageContainer } from "@/components/layout/page-container"
import { RequestDetailView } from "@/features/public/request-detail/view"
import { serializeRequestDetail } from "@/features/public/request-detail/logic"
import { findMockRequestDetail, requestReviewNow } from "@/lib/mock/request-details"

export const metadata: Metadata = { title: "Užklausa ir pasiūlymai", robots: { index: false, follow: false } }

export default async function RequestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const real = isRouteId(id) ? await loadRealRequest(id) : null
  const request = isRouteId(id) ? real?.request : findMockRequestDetail(id)
  if (!request) notFound()
  return <div className="marketplace-theme bg-background text-foreground"><PageContainer className="py-6 sm:py-8 lg:py-12"><RequestDetailView key={`${id}:${request.requestVersion}:${request.status}`} initialRequest={serializeRequestDetail(request)} reviewNow={real ? new Date().toISOString() : requestReviewNow} persisted={real ? {conversations:real.conversations} : undefined} /></PageContainer></div>
}
