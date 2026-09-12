import { PageContainer } from "@/components/layout/page-container"
import { SearchResultsSkeleton } from "@/components/shared/search-result-states"

export default function Loading() {
  return <PageContainer className="py-8 sm:py-10"><SearchResultsSkeleton /></PageContainer>
}
