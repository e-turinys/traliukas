import { test } from "node:test"
import assert from "node:assert/strict"
import { registerHooks } from "node:module"
import { pathToFileURL } from "node:url"
import path from "node:path"

registerHooks({ resolve(specifier, context, nextResolve) {
  if (specifier.startsWith("@/")) return nextResolve(pathToFileURL(path.resolve(import.meta.dirname, "../src", `${specifier.slice(2)}.ts`)).href, context)
  try { return nextResolve(specifier, context) } catch (error) {
    if (specifier.startsWith(".") && !path.extname(specifier)) return nextResolve(`${specifier}.ts`, context)
    throw error
  }
} })

const { findMockRequestDetail } = await import("../src/lib/mock/request-details.ts")
const { findMockConversation, findMockConversationByContext, listMockConversations } = await import("../src/lib/mock/conversations.ts")
const {
  appendLocalMessage, canSendMessage, conversationContext, conversationForOffer,
  conversationsAfterAcceptance, messageCreatedEvent, orderedMessages, unreadMessageCount,
} = await import("../src/features/public/messages/logic.ts")

test("no conversation exists before an Offer", () => {
  const targeted = findMockRequestDetail("targeted-demo-001")
  assert.equal(targeted.offers.length, 0)
  assert.equal(findMockConversationByContext(targeted.id, "baltijos-kelias"), undefined)
})

test("an Offer revision from the same carrier reuses the conversation", () => {
  const request = findMockRequestDetail("updated-offer-demo-001")
  const existing = findMockConversation("updated-offer-demo-001").conversation
  const revised = { ...request.offers[0], offerVersion: 3, totalPriceEur: 550 }
  const result = conversationForOffer([existing], request, revised, "2026-09-14T09:00:00Z")
  assert.equal(result.id, existing.id)
  assert.equal(result.carrierId, existing.carrierId)
})

test("different carriers on one Request have different conversations", () => {
  const winning = findMockConversation("booking-winning-demo-001").conversation
  const losing = findMockConversation("booking-losing-demo-001").conversation
  assert.equal(winning.requestId, losing.requestId)
  assert.notEqual(winning.carrierId, losing.carrierId)
  assert.notEqual(winning.id, losing.id)
})

test("acceptance keeps the winner active, links Booking and archives competitors", () => {
  const winning = findMockConversation("active-prebooking-demo-001")
  const request = winning.request
  const second = conversationForOffer([winning.conversation], request, request.offers[1], "2026-09-14T08:45:00Z")
  const result = conversationsAfterAcceptance([winning.conversation, second], request.id, winning.offer.carrier.id, "booking-123")
  const accepted = result.find(item => item.carrierId === winning.offer.carrier.id)
  const rejected = result.find(item => item.carrierId !== winning.offer.carrier.id)
  assert.equal(accepted.status, "active")
  assert.equal(accepted.bookingId, "booking-123")
  assert.equal(rejected.status, "archived")
  assert.equal(rejected.bookingId, undefined)
})

test("archived and completed conversations cannot send", () => {
  for (const id of ["booking-losing-demo-001", "completed-demo-001"]) {
    const detail = findMockConversation(id)
    assert.equal(canSendMessage(detail.conversation), false)
    assert.throws(() => appendLocalMessage(detail.conversation, detail.messages, "Sveiki", "customer", "2026-09-14T10:00:00Z"), /read-only/)
  }
})

test("active conversation appends a trimmed local message and exposes message.created", () => {
  const detail = findMockConversation("active-prebooking-demo-001")
  const messages = appendLocalMessage(detail.conversation, detail.messages, "  Ačiū  ", "customer", "2026-09-14T10:00:00Z")
  const appended = messages.at(-1)
  assert.equal(appended.body, "Ačiū")
  assert.equal(appended.type, "user")
  assert.equal(appended.senderType, "customer")
  assert.deepEqual(messageCreatedEvent(appended), {
    type: "message.created", messageId: appended.id, conversationId: detail.conversation.id, occurredAt: appended.createdAt,
  })
})

test("messages are ordered chronologically with a deterministic tie break", () => {
  const detail = findMockConversation("updated-offer-demo-001")
  const reversed = [...detail.messages].reverse()
  const ordered = orderedMessages(reversed)
  assert.equal(ordered[0].id, detail.messages[0].id)
  assert.equal(ordered.at(-1).id, detail.messages.at(-1).id)
})

test("unread count includes inbound carrier messages and excludes the viewer's messages", () => {
  const detail = findMockConversation("active-prebooking-demo-001")
  assert.equal(unreadMessageCount(detail.messages, "customer"), 1)
  assert.equal(unreadMessageCount(detail.messages, "carrier"), 0)
})

test("winning and completed conversations retain Booking linkage", () => {
  assert.equal(findMockConversation("booking-winning-demo-001").conversation.bookingId, "transport-demo-001")
  assert.equal(findMockConversation("completed-demo-001").conversation.bookingId, "transport-demo-001")
})

test("multi-location context stays compact", () => {
  const detail = findMockConversation("multi-location-demo-001")
  assert.deepEqual(conversationContext(detail.request), {
    route: "2 paėmimo vietos → Kaunas", vehicleCount: 2, vehicleLabel: "2 automobiliai",
  })
})

test("review fixtures and unknown ID handling are explicit", () => {
  assert.equal(listMockConversations().length, 6)
  assert.equal(findMockConversation("unknown-conversation"), undefined)
  assert.equal(findMockConversation("__proto__"), undefined)
})
