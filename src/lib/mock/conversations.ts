import { conversationContext } from "@/features/public/messages/logic"
import { findMockRequestDetail } from "./request-details"
import type { RequestDetail, RequestOffer } from "@/features/public/request-detail/model"
import type { Conversation, Message } from "@/lib/types/conversation"

export type MockConversationDetail = {
  conversation: Conversation
  request: RequestDetail
  offer: RequestOffer
  messages: Message[]
}

type FixtureDefinition = {
  id: string
  requestId: string
  offerIndex: number
  status: Conversation["status"]
  bookingId?: string
  updated?: boolean
  completed?: boolean
}

const definitions: readonly FixtureDefinition[] = [
  { id: "active-prebooking-demo-001", requestId: "marketplace-demo-001", offerIndex: 0, status: "active" },
  { id: "updated-offer-demo-001", requestId: "updated-offer-demo-001", offerIndex: 0, status: "active", updated: true },
  { id: "booking-winning-demo-001", requestId: "booked-demo-001", offerIndex: 0, status: "active", bookingId: "transport-demo-001" },
  { id: "booking-losing-demo-001", requestId: "booked-demo-001", offerIndex: 1, status: "archived" },
  { id: "completed-demo-001", requestId: "completed-demo-001", offerIndex: 0, status: "completed", bookingId: "transport-demo-001", completed: true },
  { id: "multi-location-demo-001", requestId: "multi-location-pickups-demo-001", offerIndex: 0, status: "active" },
]

function systemMessage(id: string, conversationId: string, body: string, createdAt: string): Message {
  return { id, conversationId, type: "system", senderType: "system", body, createdAt, readAt: createdAt }
}

function buildMessages(definition: FixtureDefinition, offer: RequestOffer): Message[] {
  const { id } = definition
  const messages: Message[] = [
    systemMessage(`${id}-offer-created`, id, `${offer.carrier.name} pateikė pasiūlymą – ${offer.revisions[0]?.totalPriceEur ?? offer.totalPriceEur} €`, "2026-09-14T08:00:00Z"),
    { id: `${id}-carrier-1`, conversationId: id, type: "user", senderType: "carrier", senderId: offer.carrier.id, body: "Sveiki, galime paimti automobilius nurodytu laiku.", createdAt: "2026-09-14T08:05:00Z", readAt: "2026-09-14T08:10:00Z" },
    { id: `${id}-customer-1`, conversationId: id, type: "user", senderType: "customer", senderId: "customer-demo-001", body: "Sveiki, ar pristatymo data dar nesikeičia?", createdAt: "2026-09-14T08:12:00Z", readAt: "2026-09-14T08:15:00Z" },
  ]
  if (definition.updated) messages.push(systemMessage(`${id}-offer-updated`, id, `Pasiūlymas atnaujintas – ${offer.totalPriceEur} €`, "2026-09-14T08:20:00Z"))
  if (definition.bookingId) messages.push(systemMessage(`${id}-offer-accepted`, id, "Pasiūlymas priimtas", "2026-09-14T08:25:00Z"))
  if (definition.completed) {
    messages.push(systemMessage(`${id}-pickup-scheduled`, id, "Paėmimas suplanuotas", "2026-09-14T09:00:00Z"))
    messages.push(systemMessage(`${id}-collected`, id, "Automobiliai paimti", "2026-09-15T10:00:00Z"))
    messages.push(systemMessage(`${id}-in-transit`, id, "Automobiliai pakeliui", "2026-09-16T08:00:00Z"))
    messages.push(systemMessage(`${id}-delivered`, id, "Automobiliai pristatyti", "2026-09-17T16:00:00Z"))
    messages.push(systemMessage(`${id}-completed`, id, "Pervežimas užbaigtas", "2026-09-17T18:00:00Z"))
  }
  if (definition.id === "active-prebooking-demo-001") messages.push({
    id: `${id}-carrier-unread`, conversationId: id, type: "user", senderType: "carrier", senderId: offer.carrier.id,
    body: "Taip, pristatymo data lieka rugsėjo 17 d.", createdAt: "2026-09-14T08:30:00Z",
  })
  return messages
}

function buildDetail(definition: FixtureDefinition): MockConversationDetail | undefined {
  const request = findMockRequestDetail(definition.requestId)
  const offer = request?.offers[definition.offerIndex]
  if (!request || !offer) return undefined
  const messages = buildMessages(definition, offer)
  return {
    conversation: {
      id: definition.id,
      requestId: request.id,
      carrierId: offer.carrier.id,
      currentOfferId: offer.id,
      bookingId: definition.bookingId,
      status: definition.status,
      createdAt: messages[0].createdAt,
      lastMessageAt: messages.at(-1)!.createdAt,
    },
    request,
    offer,
    messages,
  }
}

export function findMockConversation(id: string) {
  const definition = definitions.find(item => item.id === id)
  return definition ? buildDetail(definition) : undefined
}

export function listMockConversations() {
  return definitions.map(buildDetail).filter((detail): detail is MockConversationDetail => !!detail)
    .sort((a, b) => Date.parse(b.conversation.lastMessageAt) - Date.parse(a.conversation.lastMessageAt))
}

export function findMockConversationByContext(requestId: string, carrierId: string) {
  return listMockConversations().find(detail => detail.conversation.requestId === requestId && detail.conversation.carrierId === carrierId)
}

export function mockConversationSummary(detail: MockConversationDetail) {
  const context = conversationContext(detail.request)
  const lastMessage = detail.messages.at(-1)
  return { ...context, lastMessage: lastMessage?.body ?? "", lastMessageAt: lastMessage?.createdAt ?? detail.conversation.createdAt }
}
