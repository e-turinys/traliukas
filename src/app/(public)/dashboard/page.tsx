import { hasSupabaseEnvironment } from "@/lib/supabase/env"
import { loadDashboardRequests } from "@/features/public/marketplace-persistence/load"
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
  const view = (await searchParams).view
  const name = dashboardFixtureName(view)
  const fixture = dashboardFixture(name)
  const real = !view && hasSupabaseEnvironment()
  const dashboard = deriveDashboard(real ? await loadDashboardRequests() : fixture.requests, real ? new Date().toISOString() : requestReviewNow, fixture.defaultTab)
  return <div className="marketplace-theme bg-background text-foreground"><PageContainer className="py-8 sm:py-12"><DashboardView dashboard={dashboard} /></PageContainer></div>
}
