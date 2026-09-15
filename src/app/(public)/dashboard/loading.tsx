import { PageContainer } from "@/components/layout/page-container"
import { DashboardSkeleton } from "@/features/public/dashboard/states"

export default function Loading() {
  return <PageContainer className="py-8 sm:py-12"><DashboardSkeleton /></PageContainer>
}
