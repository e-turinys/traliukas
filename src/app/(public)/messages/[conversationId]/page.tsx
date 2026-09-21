import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { PageContainer } from "@/components/layout/page-container"
import { MessageThread } from "@/features/public/messages/thread"
import { findMockConversation } from "@/lib/mock/conversations"

export const metadata: Metadata = { title: "Pokalbis", robots: { index: false, follow: false } }

export default async function ConversationPage({ params }: { params: Promise<{ conversationId: string }> }) {
  const { conversationId } = await params
  const detail = findMockConversation(conversationId)
  if (!detail) notFound()
  return <div className="marketplace-theme bg-background text-foreground"><PageContainer className="py-8 sm:py-12"><MessageThread detail={detail} /></PageContainer></div>
}
