"use client"
import { createBrowserSupabaseClient } from "@/lib/supabase/client"
export async function commandClient() {
  const client = createBrowserSupabaseClient()
  const {data,error} = await client.auth.getUser()
  if (error || !data.user) throw new Error("Prisijunkite iš naujo.")
  return client
}
export const commandError = (error: unknown) => error && typeof error === "object" && "code" in error && error.code === "42501"
  ? "Veiksmas neleidžiamas. Patikrinkite paskyros prieigą arba atnaujinkite puslapį."
  : "Nepavyko išsaugoti. Atnaujinkite puslapį ir patikrinkite naujausias sąlygas."
