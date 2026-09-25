import "server-only"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { hasSupabaseEnvironment } from "@/lib/supabase/env"
import { CarrierSignIn } from "./sign-in"
import { readPages } from "@/features/public/route-persistence/load"
import { locationProjection } from "@/features/public/route-persistence/adapter"

export async function carrierAccess() {
  if (!hasSupabaseEnvironment()) return { allowed: false as const, message: "Vežėjo paskyra šiuo metu nepasiekiama." }
  const client = await createServerSupabaseClient()
  const { data: identity } = await client.auth.getUser()
  if (!identity.user) return { allowed: false as const, signIn: true }
  const [profile, carriers, legal] = await Promise.all([
    client.from("my_profile").select("account_status,beta_access").maybeSingle(),
    client.from("my_carriers").select("*"), client.from("my_carrier_private_details").select("carrier_id,legal_name,business_kind,registration_country"),
  ])
  if (profile.error || carriers.error || legal.error) throw new Error("Nepavyko patikrinti vežėjo prieigos.")
  const admitted = carriers.data?.filter(c => c.visibility === "published" && !c.suspended_at
    && legal.data?.some(l => l.carrier_id === c.id && l.legal_name && l.business_kind && l.registration_country)) ?? []
  if (profile.data?.account_status !== "active" || !profile.data.beta_access || admitted.length < 1) {
    return { allowed: false as const, message: "Maršrutus gali valdyti aktyvus vežėjo savininkas, gavęs prieigą prie uždaros beta versijos ir užpildęs vežėjo duomenis. Dėl prieigos kreipkitės į administratorių." }
  }
  const places = await readPages((from,to) => client.from("public_locations").select("*").order("slug").range(from,to))
  return { allowed: true as const, carrier: admitted[0], carriers: admitted, places: places.map(locationProjection) }
}
export function AccessMessage({ access }: { access: Awaited<ReturnType<typeof carrierAccess>> }) {
  return !access.allowed && access.signIn ? <CarrierSignIn /> : <p role="status">{!access.allowed && access.message}</p>
}
