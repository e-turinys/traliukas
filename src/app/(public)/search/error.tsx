"use client"

import { PageContainer } from "@/components/layout/page-container"
import { SearchResultsError } from "@/components/shared/search-result-states"

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <div className="marketplace-theme min-h-full bg-background text-foreground"><PageContainer className="py-8 sm:py-10"><SearchResultsError retry={reset} /></PageContainer></div>
}
