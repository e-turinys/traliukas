import "server-only"

import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { getSupabaseEnvironment } from "./env"

/** A new caller-scoped client for each render; middleware owns session refresh. */
export async function createServerSupabaseClient() {
  const cookieStore = await cookies()
  const { url, key, secureCookies } = getSupabaseEnvironment()
  return createServerClient(url, key, {
    db: { schema: "api" },
    cookieOptions: { path: "/", sameSite: "lax", secure: secureCookies },
    cookies: {
      getAll: () => cookieStore.getAll(),
      // Server Components cannot set cookies. Auth-changing operations use the
      // browser client; middleware refreshes and propagates cookies before render.
    },
    global: { fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }) },
  })
}
