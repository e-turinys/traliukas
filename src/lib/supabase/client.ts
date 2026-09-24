"use client"

import { createBrowserClient } from "@supabase/ssr"
import type { Database } from "./database.types"
import { getSupabaseEnvironment } from "./env"

export function createBrowserSupabaseClient() {
  const { url, key, secureCookies } = getSupabaseEnvironment()
  return createBrowserClient<Database, "api">(url, key, {
    db: { schema: "api" },
    cookieOptions: { path: "/", sameSite: "lax", secure: secureCookies },
  })
}
