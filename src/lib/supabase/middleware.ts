import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"
import { getSupabaseEnvironment, hasSupabaseEnvironment } from "./env"

export async function updateSupabaseSession(request: NextRequest) {
  // The locked fixture application remains buildable without Supabase settings.
  // Any actual client use requires both values and fails closed if incomplete.
  if (!hasSupabaseEnvironment()) return NextResponse.next({ request })
  const { url, key, secureCookies } = getSupabaseEnvironment()
  let response = NextResponse.next({ request })
  const supabase = createServerClient(url, key, {
    db: { schema: "api" },
    cookieOptions: { path: "/", sameSite: "lax", secure: secureCookies },
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        const previousCookies = response.cookies.getAll()
        response = NextResponse.next({ request })
        previousCookies.forEach(cookie => response.cookies.set(cookie))
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
        Object.entries(headers).forEach(([name, value]) => response.headers.set(name, value))
      },
    },
  })
  // Verifies the JWT; this alone is not authorization for a domain mutation.
  await supabase.auth.getClaims()
  response.headers.set("Cache-Control", "private, no-store, max-age=0")
  response.headers.set("Pragma", "no-cache")
  response.headers.set("Expires", "0")
  return response
}
