import { PageContainer } from "@/components/layout/page-container"
import { SearchResultsSkeleton } from "@/components/shared/search-result-states"

export default function Loading() {
  return <div className="marketplace-theme min-h-full bg-background text-foreground"><PageContainer className="py-8 sm:py-10"><SearchResultsSkeleton /></PageContainer></div>
}
