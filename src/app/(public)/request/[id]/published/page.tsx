import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { PageContainer } from "@/components/layout/page-container"
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
  if (!request) notFound()
  // Format calendar dates on the server; only public display strings reach the client.
  const summary = publishedRequestSummary(request)
  return (
    <div className="marketplace-theme bg-background text-foreground"><PageContainer className="py-8 sm:py-12">
      <div className="mx-auto w-full min-w-0 max-w-3xl">
        <DemoRequestSuccess key={id} id={id} initialSummary={summary} />
      </div>
    </PageContainer></div>
  )
}
