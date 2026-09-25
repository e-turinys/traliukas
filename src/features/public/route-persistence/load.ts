import "server-only"
import { cache } from "react"
import type { Database } from "@/lib/supabase/database.types"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { hasSupabaseEnvironment } from "@/lib/supabase/env"
import { mockCarrierRoutes, findMockCarrierRoute } from "@/lib/mock/carrier-routes"
import { findMockCarrierProfile } from "@/lib/mock/carrier-profiles"
import { carrierProjection, isRouteId, routeProjection } from "./adapter"

export async function readPages<T>(query: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: unknown }>) {
  const rows: T[] = []
  for (let offset = 0; ; offset += 500) {
    const { data, error } = await query(offset, offset + 499)
    if (error || !data) throw new Error("Nepavyko įkelti maršrutų. Bandykite dar kartą.")
    rows.push(...data)
    if (data.length < 500) return rows
  }
}
export async function loadRoutes(options: { id?: string; carrierId?: string; owner?: boolean } = {}) {
  if (!hasSupabaseEnvironment()) return []
  const client = await createServerSupabaseClient()
  if (options.owner) {
    const { data, error } = await client.auth.getUser()
    if (error || !data.user) return []
  }
  const routes = await readPages((from,to) => {
    let query = client.from(options.owner ? "my_routes" : "public_routes").select("*").order("id").range(from,to)
    if (options.id) query = query.eq("id",options.id)
    if (options.carrierId) query = query.eq("carrier_id",options.carrierId)
    return query
  })
  if (!routes.length) return []
  const [places, carriers] = await Promise.all([
    readPages((from,to) => client.from("public_locations").select("*").order("id").range(from,to)),
    readPages((from,to) => client.from(options.owner ? "my_carriers" : "public_carriers").select("*").order("id").range(from,to)),
  ])
  const stops: Database["api"]["Views"]["public_route_stops"]["Row"][] = []
  for (let i=0; i<routes.length; i+=100) {
    const ids = routes.slice(i,i+100).map(r => r.id!)
    stops.push(...await readPages((from,to) => client.from(options.owner ? "my_route_stops" : "public_route_stops").select("*").in("route_id",ids).order("route_id").order("position").range(from,to)))
  }
  return routes.map(row => {
    const carrier = carriers.find(c => c.id === row.carrier_id)
    if (!carrier) throw new Error("Missing Carrier projection")
    return routeProjection(row,stops,places,carrierProjection(carrier))
  })
}
export async function loadSearchRoutes() {
  // No database-error fallback and no mixing real supply with demo carriers.
  return hasSupabaseEnvironment() ? loadRoutes() : mockCarrierRoutes
}
export const loadRoute = cache(async (id: string) => isRouteId(id)
  ? (await loadRoutes({id}))[0] ?? null : findMockCarrierRoute(id))
export const loadCarrier = cache(async (id: string) => {
  if (!isRouteId(id)) return findMockCarrierProfile(id)
  if (!hasSupabaseEnvironment()) return null
  const client = await createServerSupabaseClient()
  const {data,error} = await client.from("public_carriers").select("*").eq("id",id).maybeSingle()
  if (error) throw new Error("Unable to load Carrier")
  return data ? carrierProjection(data) : null
})
