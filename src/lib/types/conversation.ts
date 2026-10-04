export const conversationStatuses = ["active", "archived", "completed"] as const
export type ConversationStatus = (typeof conversationStatuses)[number]

export type Conversation = {
  id: string
  requestId: string
  carrierId: string
  currentOfferId: string
  bookingId?: string
  status: ConversationStatus
  createdAt: string
  lastMessageAt: string
}

export const messageTypes = ["user", "system"] as const
export type MessageType = (typeof messageTypes)[number]

export const messageSenderTypes = ["customer", "carrier", "system"] as const
export type MessageSenderType = (typeof messageSenderTypes)[number]

export type Message = {
  sequence?: number
  id: string
  conversationId: string
  type: MessageType
  senderType: MessageSenderType
  senderId?: string
  body: string
  createdAt: string
  readAt?: string
}
