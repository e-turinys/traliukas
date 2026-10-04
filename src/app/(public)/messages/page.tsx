import { hasSupabaseEnvironment } from "@/lib/supabase/env"
import { loadRealConversations } from "@/features/public/marketplace-persistence/load"
import type { Metadata } from "next"
import { PageContainer } from "@/components/layout/page-container"
import { MessagesInbox } from "@/features/public/messages/inbox"
import { listMockConversations } from "@/lib/mock/conversations"

export const metadata: Metadata = { title: "Pokalbiai", robots: { index: false, follow: false } }

export default async function MessagesPage({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  const view = (await searchParams).view
  const conversations = view === "empty" ? [] : view === "demo" || !hasSupabaseEnvironment() ? listMockConversations() : await loadRealConversations()
  return <div className="marketplace-theme bg-background text-foreground"><PageContainer><MessagesInbox conversations={conversations} /></PageContainer></div>
}
