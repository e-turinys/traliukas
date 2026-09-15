"use client"

import { PageContainer } from "@/components/layout/page-container"
import { DashboardError } from "@/features/public/dashboard/states"

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <PageContainer className="py-8 sm:py-12"><DashboardError retry={reset} /></PageContainer>
}
