import { PageContainer } from "@/components/layout/page-container"
import { DashboardSkeleton } from "@/features/public/dashboard/states"

export default function Loading() {
  return <div className="marketplace-theme bg-background text-foreground"><PageContainer className="py-8 sm:py-12"><DashboardSkeleton /></PageContainer></div>
}
