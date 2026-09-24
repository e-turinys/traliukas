import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { PageContainer } from "@/components/layout/page-container"
import { loadPublishedRequest } from "@/features/public/request-persistence/load"
import { RequestSuccessCard } from "@/features/public/request-published/success-card"
import { DemoRequestSuccess } from "@/features/public/request-published/demo-success"
import { publishedRequestSummary } from "@/features/public/request-published/context"
import { findMockPublishedRequest } from "@/lib/mock/published-requests"

export const metadata: Metadata = {
  title: "Užklausos patvirtinimas",
  robots: { index: false, follow: false },
}

export default async function PublishedRequestPage({ params }: PageProps<"/request/[id]/published">) {
  const { id } = await params
  const request = findMockPublishedRequest(id)
  // Only explicit demo IDs use fixtures. Real IDs never fall back after denial/error.
  const summary = request ? publishedRequestSummary(request) : await loadPublishedRequest(id)
  if (!summary) notFound()
  return (
    <div className="marketplace-theme bg-background text-foreground"><PageContainer className="py-8 sm:py-12">
      <div className="mx-auto w-full min-w-0 max-w-3xl">
        {request ? <DemoRequestSuccess key={id} id={id} initialSummary={summary} /> : <RequestSuccessCard id={id} summary={summary} />}
      </div>
    </PageContainer></div>
  )
}
