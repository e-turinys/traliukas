import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { PageContainer } from "@/components/layout/page-container"
import { RequestDetailView } from "@/features/public/request-detail/view"
import { serializeRequestDetail } from "@/features/public/request-detail/logic"
import { findMockRequestDetail, requestReviewNow } from "@/lib/mock/request-details"

export const metadata: Metadata = { title: "Užklausa ir pasiūlymai", robots: { index: false, follow: false } }

export default async function RequestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const request = findMockRequestDetail(id)
  if (!request) notFound()
  return <PageContainer className="py-8 sm:py-12"><RequestDetailView key={id} initialRequest={serializeRequestDetail(request)} reviewNow={requestReviewNow} /></PageContainer>
}
