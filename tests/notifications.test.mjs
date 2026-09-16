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

const {
  appendNotificationsIdempotently, bookingNotificationCopy, createInAppNotifications,
  markAllNotificationsRead, markNotificationRead, notificationDestination, notificationIdempotencyKey,
  notificationDeliveryIdempotencyKeys, notificationPolicy, resolveNotificationRecipients, unreadNotifications,
} = await import("../src/features/public/notifications/logic.ts")
const { listMockNotifications, notificationFilterName, notificationFixtureName } = await import("../src/lib/mock/notifications.ts")

const event = (type, overrides = {}) => ({
  id: `event-${type}`, type, occurredAt: "2026-09-16T10:00:00Z", customerId: "customer",
  selectedCarrierUserId: "carrier", entityType: type.startsWith("offer") ? "offer" : type === "message.created" ? "conversation" : "booking",
  entityId: "entity", ...overrides,
})

test("event policies map recipients and exact V1 channel behavior", () => {
  assert.deepEqual(notificationPolicy("offer.created"), { recipients: "customer", inApp: true, email: "immediate", sms: false })
  assert.deepEqual(notificationPolicy("offer.updated"), { recipients: "customer", inApp: true, email: "immediate", sms: false })
  assert.deepEqual(notificationPolicy("offer.accepted"), { recipients: "none", inApp: false, email: "none", sms: false })
  assert.deepEqual(notificationPolicy("message.created"), { recipients: "other_conversation_participant", inApp: true, email: "unread_fallback", sms: false })
  assert.equal(notificationPolicy("booking.pickupScheduled").sms, true)
  assert.equal(notificationPolicy("booking.delivered").sms, true)
  assert.equal(notificationPolicy("booking.created").sms, true)
  assert.equal(notificationPolicy("booking.collected").sms, false)
  assert.equal(notificationPolicy("booking.inTransit").sms, false)
  assert.equal(notificationPolicy("booking.completed").sms, false)
})

test("recipient resolution suppresses self-notifications after policy resolution", () => {
  assert.deepEqual(resolveNotificationRecipients(event("offer.created", { actorId: "carrier" })), ["customer"])
  assert.deepEqual(resolveNotificationRecipients(event("offer.created", { actorId: "customer" })), [])
  assert.deepEqual(resolveNotificationRecipients(event("offer.accepted", { actorId: "customer" })), [])
  assert.deepEqual(resolveNotificationRecipients(event("booking.completed")), ["customer", "carrier"])
})

test("booking.created is the sole accepted-Booking delivery event", () => {
  assert.deepEqual(resolveNotificationRecipients(event("offer.accepted")), [])
  assert.deepEqual(notificationDeliveryIdempotencyKeys("accepted", "customer", "offer.accepted"), [])
  assert.deepEqual(resolveNotificationRecipients(event("booking.created")), ["customer", "carrier"])
  assert.deepEqual(notificationPolicy("booking.created"), { recipients: "customer_and_carrier", inApp: true, email: "immediate", sms: true })
  const created = createInAppNotifications(event("booking.created"), {
    title: "Pasiūlymas priimtas", body: "Sukurtas pervežimas.", href: "/bookings/booking-123",
  })
  assert.deepEqual(created.map(notification => notification.recipientId), ["customer", "carrier"])
  assert.ok(created.every(notification => notification.href === "/bookings/booking-123"))
})

test("message.created notifies only the other participant and never uses SMS", () => {
  const message = event("message.created", { actorId: "carrier", conversationParticipantIds: ["customer", "carrier"] })
  assert.deepEqual(resolveNotificationRecipients(message), ["customer"])
  assert.equal(notificationPolicy(message.type).email, "unread_fallback")
  assert.equal(notificationPolicy(message.type).sms, false)
})

test("created Notification retains its canonical stored href for navigation", () => {
  const [notification] = createInAppNotifications(event("offer.created", { actorId: "carrier" }), {
    title: "Naujas pasiūlymas", body: "Gavote pasiūlymą.", href: "/offers/offer-123",
  })
  assert.equal(notification.href, "/offers/offer-123")
  assert.equal(notificationDestination(notification), "/offers/offer-123")
  assert.equal(notification.entityType, "offer")
})

test("read, unread, mark-one and mark-all helpers remain immutable", () => {
  const original = listMockNotifications()
  const firstUnread = unreadNotifications(original)[0]
  const oneRead = markNotificationRead(original, firstUnread.id, "2026-09-16T11:00:00Z")
  assert.equal(unreadNotifications(oneRead).length, unreadNotifications(original).length - 1)
  assert.equal(original.find(item => item.id === firstUnread.id).readAt, undefined)
  assert.equal(unreadNotifications(markAllNotificationsRead(original, "2026-09-16T11:00:00Z")).length, 0)
})

test("duplicate event processing is idempotent per event, recipient and channel", () => {
  const bookingCreated = event("booking.created", { id: "booking-created-123" })
  const incoming = createInAppNotifications(bookingCreated, {
    title: "Pasiūlymas priimtas", body: "Sukurtas pervežimas.", href: "/bookings/booking-123",
  })
  const once = appendNotificationsIdempotently([], incoming)
  const retried = appendNotificationsIdempotently(once, incoming)
  assert.equal(once.length, 2)
  assert.equal(retried.length, 2)
  const firstDeliveryAttempt = notificationDeliveryIdempotencyKeys(bookingCreated.id, "customer", bookingCreated.type)
  const retryDeliveryAttempt = notificationDeliveryIdempotencyKeys(bookingCreated.id, "customer", bookingCreated.type)
  assert.deepEqual(firstDeliveryAttempt, [
    notificationIdempotencyKey(bookingCreated.id, "customer", "in_app"),
    notificationIdempotencyKey(bookingCreated.id, "customer", "email"),
    notificationIdempotencyKey(bookingCreated.id, "customer", "sms"),
  ])
  assert.deepEqual(retryDeliveryAttempt, firstDeliveryAttempt)
  assert.equal(new Set([...firstDeliveryAttempt, ...retryDeliveryAttempt]).size, 3)
})

test("Booking lifecycle notification copy is vehicle-count aware", () => {
  assert.equal(bookingNotificationCopy("booking.collected", 1).title, "Automobilis paimtas")
  assert.equal(bookingNotificationCopy("booking.collected", 2).title, "Automobiliai paimti")
  assert.equal(bookingNotificationCopy("booking.delivered", 1).title, "Automobilis pristatytas")
  assert.equal(bookingNotificationCopy("booking.delivered", 2).title, "Automobiliai pristatyti")
  assert.equal(bookingNotificationCopy("booking.delivered", 2).body, "Patvirtinkite, kad gavote 2 automobilius.")
})

test("fixtures cover all required activity and preserve multi-location Booking context", () => {
  const notifications = listMockNotifications()
  const types = new Set(notifications.map(notification => notification.eventType))
  for (const type of ["offer.created", "offer.updated", "message.created", "booking.created", "booking.pickupScheduled", "booking.collected", "booking.inTransit", "booking.delivered", "booking.completed"]) assert.ok(types.has(type), `Missing ${type}`)
  const multi = notifications.find(notification => notification.entityId === "transport-multi-location-demo-001")
  assert.equal(multi.href, "/bookings/transport-multi-location-demo-001")
  for (const text of ["2 paėmimo vietos → Kaunas", "2 automobiliai", "Baltijos kelias", "900 €"]) assert.match(multi.body, new RegExp(text))
})

test("review fixture and filter selectors have safe defaults and explicit empty states", () => {
  assert.equal(notificationFixtureName("empty"), "empty")
  assert.equal(notificationFixtureName("unknown"), "default")
  assert.equal(notificationFilterName("unread"), "unread")
  assert.equal(notificationFilterName("unknown"), "all")
  assert.equal(listMockNotifications("empty").length, 0)
  assert.equal(unreadNotifications(listMockNotifications("all-read")).length, 0)
})
