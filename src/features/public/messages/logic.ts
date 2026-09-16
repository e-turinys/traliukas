import { requestRouteSummary } from "../request-route-summary"
import { vehicleCountLabel, vehicleName } from "../vehicle-summary"
import type { RequestDetail, RequestOffer } from "../request-detail/model"
import type { Conversation, Message, MessageSenderType } from "@/lib/types/conversation"

export function conversationForOffer(
  conversations: readonly Conversation[],
  request: Pick<RequestDetail, "id">,
  offer: RequestOffer,
  createdAt: string,
) {
  const existing = conversations.find(conversation =>
    conversation.requestId === request.id && conversation.carrierId === offer.carrier.id)
  if (existing) return existing.currentOfferId === offer.id ? existing : { ...existing, currentOfferId: offer.id }
  return {
    id: `conversation-${request.id}-${offer.carrier.id}`,
    requestId: request.id,
    carrierId: offer.carrier.id,
    currentOfferId: offer.id,
    status: "active" as const,
    createdAt,
    lastMessageAt: createdAt,
  }
}

export function conversationsAfterAcceptance(
  conversations: readonly Conversation[], requestId: string, carrierId: string, bookingId: string,
) {
  return conversations.map(conversation => {
    if (conversation.requestId !== requestId) return conversation
    if (conversation.carrierId === carrierId) return { ...conversation, bookingId, status: "active" as const }
    return { ...conversation, status: "archived" as const }
  })
}

export function canSendMessage(conversation: Conversation) {
  return conversation.status === "active"
}

export function appendLocalMessage(
  conversation: Conversation,
  messages: readonly Message[],
  body: string,
  senderType: Exclude<MessageSenderType, "system">,
  createdAt: string,
) {
  if (!canSendMessage(conversation)) throw new Error("Conversation is read-only")
  const trimmed = body.trim()
  if (!trimmed) throw new Error("Message body is required")
  const message: Message = {
    id: `${conversation.id}-local-${createdAt}`,
    conversationId: conversation.id,
    type: "user",
    senderType,
    body: trimmed,
    createdAt,
    readAt: createdAt,
  }
  return orderedMessages([...messages, message])
}

export function orderedMessages(messages: readonly Message[]) {
  return [...messages].sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt) || a.id.localeCompare(b.id))
}

export function unreadMessageCount(messages: readonly Message[], viewer: Exclude<MessageSenderType, "system">) {
  return messages.filter(message => !message.readAt && message.senderType !== viewer).length
}

export function conversationContext(request: RequestDetail) {
  const route = requestRouteSummary(request.vehicles).compact
  return {
    route,
    vehicleCount: request.vehicles.length,
    vehicleLabel: request.vehicles.length === 1 ? vehicleName(request.vehicles[0]) : vehicleCountLabel(request.vehicles.length),
  }
}

export function messageCreatedEvent(message: Message) {
  return { type: "message.created" as const, messageId: message.id, conversationId: message.conversationId, occurredAt: message.createdAt }
}
