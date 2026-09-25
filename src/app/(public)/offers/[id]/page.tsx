import { isRouteId } from "@/features/public/route-persistence/adapter"
import { loadRealOffer } from "@/features/public/marketplace-persistence/load"
import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { PageContainer } from "@/components/layout/page-container"
import { OfferDetailView } from "@/features/public/offer-detail/view"
import { serializeRequestDetail } from "@/features/public/request-detail/logic"
import { findMockOfferDetail } from "@/lib/mock/offer-details"
import { requestReviewNow } from "@/lib/mock/request-details"

export const metadata: Metadata = { title: "Pasiūlymo informacija", robots: { index: false, follow: false } }

export default async function OfferDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const real = isRouteId(id) ? await loadRealOffer(id) : null
  const detail = isRouteId(id) ? real : findMockOfferDetail(id)
  if (!detail) notFound()
  return <div className="marketplace-theme bg-background text-foreground"><PageContainer className="py-6 sm:py-8 lg:py-12"><OfferDetailView key={real ? `${id}:${real.offer.offerVersion}:${real.offer.status}` : id} initialRequest={serializeRequestDetail(detail.request)} offerId={id} reviewNow={real ? new Date().toISOString() : requestReviewNow} persisted={real ? {conversationId:real.conversation.id!,canSend:real.conversation.status === "active",viewer:real.viewer} : undefined} /></PageContainer></div>
}
