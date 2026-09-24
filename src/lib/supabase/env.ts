/** Public values only. Never accept a service-role/secret key in this contract. */
export function parseSupabaseEnvironment(url: string | undefined, key: string | undefined) {
  if (!url || !key) throw new Error("Supabase URL and publishable key are required")
  const parsed = new URL(url)
  const local = ["localhost", "127.0.0.1", "[::1]"].includes(parsed.hostname)
  if ((parsed.protocol !== "https:" && !(local && parsed.protocol === "http:")) || parsed.username || parsed.password || parsed.search || parsed.hash || parsed.pathname !== "/") {
    throw new Error("Invalid Supabase URL")
  }
  if (!key.startsWith("sb_publishable_")) {
    // The local CLI may emit legacy anon JWTs. Decode only to reject privileged
    // configuration; this is NOT token authentication or signature validation.
    try {
      const payload = JSON.parse(atob(key.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")))
      if (payload.role !== "anon") throw new Error("Not an anon key")
    } catch {
      throw new Error("Use a publishable key or legacy anon key, never a secret/service-role key")
    }
  }
  return { url: parsed.origin, key, secureCookies: parsed.protocol === "https:" }
}

export function getSupabaseEnvironment() {
  return parseSupabaseEnvironment(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  )
}

export function hasSupabaseEnvironment() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)
}
