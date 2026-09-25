import "server-only"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { hasSupabaseEnvironment } from "@/lib/supabase/env"
import { readPages } from "../route-persistence/load"
import { bookingProjection, historicalRequest, offerProjection, requestProjection } from "./adapter"
import type { MockConversationDetail } from "@/lib/mock/conversations"

export type PersistedConversationDetail = MockConversationDetail & { viewer: "customer" | "carrier"; persisted: true }
export async function marketplaceClient() {
  if (!hasSupabaseEnvironment()) return null
  const client = await createServerSupabaseClient()
  const { data,error } = await client.auth.getUser()
  return !error && data.user ? client : null
}
export async function loadCommercialData() {
  const client = await marketplaceClient()
  if (!client) return null
  const [offers,terms,carriers,conversations,bookings,places,requestTerms] = await Promise.all([
    readPages((a,b) => client.from("offers").select("*").order("id").range(a,b)),
    readPages((a,b) => client.from("offer_revisions").select("*").order("offer_id").order("version").range(a,b)),
    readPages((a,b) => client.from("commercial_carriers").select("*").order("id").range(a,b)),
    readPages((a,b) => client.from("conversations").select("*").order("last_message_at",{ascending:false}).order("id").range(a,b)),
    readPages((a,b) => client.from("bookings").select("*").order("id").range(a,b)),
    readPages((a,b) => client.from("public_locations").select("*").order("id").range(a,b)),
    readPages((a,b) => client.from("commercial_request_terms").select("*").order("request_id").order("version").range(a,b)),
  ])
  const projected = offers.map(o => {
    const c = carriers.find(c => c.id === o.carrier_id)
    if (!c) throw new Error("Missing commercial Carrier")
    return offerProjection(o,terms,c)
  })
  return { client,offers,terms,conversations,bookings,places,requestTerms,projected }
}
export async function loadRealRequest(id: string) {
  const data = await loadCommercialData()
  if (!data) return null
  const {data:row,error} = await data.client.from("my_requests").select("*").eq("id",id).maybeSingle()
  if (error) throw new Error("Nepavyko įkelti užklausos.")
  if (!row || row.status === "draft") return null
  const vehicles = await readPages((a,b) => data.client.from("request_vehicles").select("*").eq("request_id",id).order("position").range(a,b))
  const request = requestProjection(row,vehicles,data.places,data.projected.filter(o => o.requestId === id),data.bookings.find(b => b.request_id === id)?.id ?? undefined)
  return { request,conversations: data.conversations.filter(c => c.request_id === id).map(c => ({ id:c.id!,carrierId:c.carrier_id!,canSend:c.status === "active" })) }
}
export async function loadRealOffer(id: string) {
  const data = await loadCommercialData()
  if (!data) return null
  const offer = data.projected.find(o => o.id === id), row = data.offers.find(o => o.id === id)
  if (!offer || !row) return null
  const terms = data.requestTerms.find(t => t.request_id === offer.requestId && t.version === offer.requestVersion)
  if (!terms?.public_terms_snapshot) throw new Error("Missing historical Request terms")
  const bookingId = data.bookings.find(b => b.request_id === offer.requestId)?.id ?? undefined
  const request = historicalRequest(offer.requestId,offer.requestVersion,terms.public_terms_snapshot,data.places,[offer],bookingId)
  return { request,offer,conversation: data.conversations.find(c => c.id === row.conversation_id)!,viewer: row.viewer_side as "customer" | "carrier" }
}
export async function loadRealBooking(id: string) {
  const client = await marketplaceClient()
  if (!client) return null
  const {data,error} = await client.from("bookings").select("*").eq("id",id).maybeSingle()
  if (error) throw new Error("Nepavyko įkelti pervežimo.")
  return data ? bookingProjection(data) : null
}
export async function loadRealConversations(): Promise<PersistedConversationDetail[]> {
  const data = await loadCommercialData()
  if (!data) return []
  const [messages,reads] = await Promise.all([
    readPages((a,b) => data.client.from("messages").select("*").order("conversation_id").order("sequence").range(a,b)),
    readPages((a,b) => data.client.from("my_read_cursors").select("*").order("conversation_id").range(a,b)),
  ])
  return data.conversations.map(c => {
    const offer = data.projected.find(o => o.id === c.current_offer_id)!
    const terms = data.requestTerms.find(t => t.request_id === c.request_id && t.version === offer.requestVersion)
    if (!terms?.public_terms_snapshot) throw new Error("Missing Conversation context")
    const cursor = reads.find(r => r.conversation_id === c.id)
    return { persisted:true,viewer:c.viewer_side as "customer" | "carrier",
      conversation: { id:c.id!,requestId:c.request_id!,carrierId:c.carrier_id!,currentOfferId:c.current_offer_id!,bookingId:c.booking_id ?? undefined,
        status:c.status as "active" | "archived" | "completed",createdAt:c.created_at!,lastMessageAt:c.last_message_at! },offer,
      request:historicalRequest(c.request_id!,offer.requestVersion,terms.public_terms_snapshot,data.places,[offer],c.booking_id ?? undefined),
      messages:messages.filter(m => m.conversation_id === c.id).map(m => ({ id:m.id!,conversationId:c.id!,sequence:m.sequence!,type:m.kind as "user" | "system",
        senderType:m.sender_side as "customer" | "carrier" | "system",body:m.body!,createdAt:m.created_at!,readAt:m.sequence! <= (cursor?.last_read_sequence ?? 0) ? cursor?.updated_at ?? m.created_at! : undefined })) }
  })
}
export async function loadCarrierRequests(id?: string) {
  const client = await marketplaceClient()
  if (!client) return []
  const [rows,vehicles,places] = await Promise.all([
    readPages((a,b) => { let q=client.from("marketplace_requests").select("*").order("id").range(a,b); if(id) q=q.eq("id",id); return q }),
    readPages((a,b) => { let q=client.from("request_vehicles").select("*").order("request_id").order("position").range(a,b); if(id) q=q.eq("request_id",id); return q }),
    readPages((a,b) => client.from("public_locations").select("*").order("id").range(a,b)),
  ])
  return rows.map(r => requestProjection({...r,status:"active",created_at:r.published_at},vehicles.filter(v => v.request_id === r.id),places))
}
export async function loadDashboardRequests() {
  const client = await marketplaceClient()
  if (!client) return []
  const rows = await readPages((a,b) => client.from("my_requests").select("id").neq("status","draft").order("id").range(a,b))
  const requests = await Promise.all(rows.map(r => loadRealRequest(r.id!)))
  return requests.flatMap(r => r ? [r.request] : [])
}
