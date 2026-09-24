"use client"

import { createBrowserClient } from "@supabase/ssr"
import { getSupabaseEnvironment } from "./env"

export function createBrowserSupabaseClient() {
  const { url, key, secureCookies } = getSupabaseEnvironment()
  return createBrowserClient(url, key, {
    db: { schema: "api" },
    cookieOptions: { path: "/", sameSite: "lax", secure: secureCookies },
  })
}
