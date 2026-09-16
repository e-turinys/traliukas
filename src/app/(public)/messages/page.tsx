import type { Metadata } from "next"
import { PageContainer } from "@/components/layout/page-container"
import { MessagesInbox } from "@/features/public/messages/inbox"
import { listMockConversations } from "@/lib/mock/conversations"

export const metadata: Metadata = { title: "Pokalbiai", robots: { index: false, follow: false } }

export default function MessagesPage() {
  return <PageContainer><MessagesInbox conversations={listMockConversations()} /></PageContainer>
}
