import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { PageContainer } from "@/components/layout/page-container"
import { NotificationsView } from "@/features/public/notifications/view"
import { notificationProjection } from "@/features/public/notifications/adapter"
import { marketplaceClient } from "@/features/public/marketplace-persistence/load"
import { readPages } from "@/features/public/route-persistence/load"
import { hasSupabaseEnvironment } from "@/lib/supabase/env"
import { listMockNotifications, notificationFilterName, notificationFixtureName } from "@/lib/mock/notifications"

export const metadata: Metadata = { title: "Pranešimai", robots: { index: false, follow: false } }
export const dynamic = "force-dynamic"

export default async function NotificationsPage({ searchParams }: {
  searchParams: Promise<{ filter?: string | string[]; view?: string | string[] }>
}) {
  const query = await searchParams
  const persisted = hasSupabaseEnvironment()
  const client = persisted ? await marketplaceClient() : null
  if (persisted && !client) redirect("/login?returnTo=%2Fnotifications")
  const notifications = client
    ? (await readPages((a, b) => client.from("notifications").select("*").order("created_at", { ascending: false }).order("id", { ascending: false }).range(a, b))).map(notificationProjection)
    : listMockNotifications(notificationFixtureName(query.view))
  return <PageContainer className="py-8 sm:py-12">
    <NotificationsView initialNotifications={notifications} initialFilter={notificationFilterName(query.filter)} persisted={persisted} />
  </PageContainer>
}
