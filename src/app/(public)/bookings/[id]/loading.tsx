import { PageContainer } from "@/components/layout/page-container"
import { Skeleton } from "@/components/ui/skeleton"

export default function BookingDetailLoading() {
  return <PageContainer className="py-8 sm:py-12">
    <div aria-label="Įkeliama pervežimo informacija" className="mx-auto max-w-6xl space-y-6">
      <Skeleton className="h-11 w-40" />
      <div className="space-y-3 border-b pb-6"><Skeleton className="h-6 w-36" /><Skeleton className="h-10 w-3/4 max-w-lg" /><Skeleton className="h-5 w-28" /></div>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(18rem,2fr)]">
        <div className="space-y-6"><Skeleton className="h-52 w-full rounded-xl" /><Skeleton className="h-48 w-full rounded-xl" /><Skeleton className="h-72 w-full rounded-xl" /></div>
        <div className="space-y-6"><Skeleton className="h-52 w-full rounded-xl" /><Skeleton className="h-40 w-full rounded-xl" /></div>
      </div>
    </div>
  </PageContainer>
}
