import type { Metadata } from "next"
import { PageContainer } from "@/components/layout/page-container"
import { NotificationsView } from "@/features/public/notifications/view"
import { listMockNotifications, notificationFilterName, notificationFixtureName } from "@/lib/mock/notifications"

export const metadata: Metadata = { title: "Pranešimai", robots: { index: false, follow: false } }

export default async function NotificationsPage({ searchParams }: {
  searchParams: Promise<{ filter?: string | string[]; view?: string | string[] }>
}) {
  const query = await searchParams
  return <PageContainer className="py-8 sm:py-12">
    <NotificationsView initialNotifications={listMockNotifications(notificationFixtureName(query.view))} initialFilter={notificationFilterName(query.filter)} />
  </PageContainer>
}
