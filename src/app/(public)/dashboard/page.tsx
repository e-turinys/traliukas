import type { Metadata } from "next"
import { PageContainer } from "@/components/layout/page-container"
import { deriveDashboard } from "@/features/public/dashboard/logic"
import { DashboardView } from "@/features/public/dashboard/view"
import { dashboardFixture, dashboardFixtureName } from "@/lib/mock/dashboard"
import { requestReviewNow } from "@/lib/mock/request-details"

export const metadata: Metadata = { title: "Mano užklausos ir pervežimai", robots: { index: false, follow: false } }

export default async function DashboardPage({ searchParams }: {
  searchParams: Promise<{ view?: string | string[] }>
}) {
  const name = dashboardFixtureName((await searchParams).view)
  const fixture = dashboardFixture(name)
  const dashboard = deriveDashboard(fixture.requests, requestReviewNow, fixture.defaultTab)
  return <PageContainer className="py-8 sm:py-12"><DashboardView dashboard={dashboard} /></PageContainer>
}
