import { hasSupabaseEnvironment } from "@/lib/supabase/env"
import { loadDashboardData } from "@/features/public/marketplace-persistence/load"
import type { Metadata } from "next"
import { PageContainer } from "@/components/layout/page-container"
import { deriveDashboard, derivePersistedDashboard, dashboardTabFromQuery } from "@/features/public/dashboard/logic"
import { DashboardView } from "@/features/public/dashboard/view"
import { dashboardFixture, dashboardFixtureName } from "@/lib/mock/dashboard"
import { requestReviewNow } from "@/lib/mock/request-details"

export const metadata: Metadata = { title: "Mano užklausos ir pervežimai", robots: { index: false, follow: false } }

export default async function DashboardPage({ searchParams }: {
  searchParams: Promise<{ view?: string | string[]; tab?: string | string[] }>
}) {
  const { view, tab } = await searchParams
  const name = dashboardFixtureName(view)
  const fixture = dashboardFixture(name)
  const real = hasSupabaseEnvironment()
  const data = real ? await loadDashboardData() : null
  const dashboard = data
    ? derivePersistedDashboard(data.requests, data.bookings, new Date().toISOString(), dashboardTabFromQuery(tab ?? view))
    : deriveDashboard(fixture.requests, requestReviewNow, fixture.defaultTab)
  return <div className="marketplace-theme bg-background text-foreground"><PageContainer className="py-8 sm:py-12"><DashboardView key={dashboard.defaultTab} dashboard={dashboard} /></PageContainer></div>
}
