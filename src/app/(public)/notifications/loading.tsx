import { PageContainer } from "@/components/layout/page-container"
import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return <PageContainer className="py-8 sm:py-12">
    <div role="status" aria-label="Įkeliami pranešimai" className="mx-auto max-w-4xl space-y-6">
      <span className="sr-only">Įkeliami pranešimai</span>
      <div aria-hidden="true" className="space-y-3"><Skeleton className="h-10 w-52" /><Skeleton className="h-5 w-full max-w-xl" /></div>
      <div aria-hidden="true" className="flex flex-col gap-3 sm:flex-row sm:justify-between"><Skeleton className="h-11 w-full sm:w-72" /><Skeleton className="h-11 w-full sm:w-64" /></div>
      <div aria-hidden="true" className="space-y-3"><Skeleton className="h-28 w-full" /><Skeleton className="h-28 w-full" /><Skeleton className="h-28 w-full" /></div>
    </div>
  </PageContainer>
}
