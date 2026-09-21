import type { Metadata } from "next"
import { PageContainer } from "@/components/layout/page-container"
import { MessagesInbox } from "@/features/public/messages/inbox"
import { listMockConversations } from "@/lib/mock/conversations"

export const metadata: Metadata = { title: "Pokalbiai", robots: { index: false, follow: false } }

export default async function MessagesPage({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  const empty = (await searchParams).view === "empty"
  return <div className="marketplace-theme bg-background text-foreground"><PageContainer><MessagesInbox conversations={empty ? [] : listMockConversations()} /></PageContainer></div>
}
