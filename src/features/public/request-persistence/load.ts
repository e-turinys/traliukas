import "server-only"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { hasSupabaseEnvironment } from "@/lib/supabase/env"
import { persistedRequestSummary } from "./summary"

export async function loadPublishedRequest(id: string) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id) || !hasSupabaseEnvironment()) return null
  const client = await createServerSupabaseClient()
  const { data: identity, error: identityError } = await client.auth.getUser()
  if (identityError || !identity.user) return null
  const { data: request, error } = await client.from("my_requests").select("*").eq("id", id).maybeSingle()
  if (error) throw new Error("Unable to load published request")
  if (!request || !request.published_at || request.status === "draft") return null
  const { data: vehicles, error: vehicleError } = await client.from("my_request_vehicles").select("*").eq("request_id", id).order("position")
  if (vehicleError || !vehicles) throw new Error("Unable to load request vehicles")
  const ids = [...new Set([request.default_pickup_location_id, request.default_delivery_location_id,
    ...vehicles.flatMap(v => [v.pickup_location_id, v.delivery_location_id])].filter((value): value is string => !!value))]
  const { data: places, error: placeError } = await client.from("public_locations").select("*").in("id", ids)
  if (placeError || !places) throw new Error("Unable to load request localities")
  return persistedRequestSummary(request, vehicles, places)
}
