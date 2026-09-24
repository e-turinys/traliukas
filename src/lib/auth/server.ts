import "server-only"

import { createServerSupabaseClient } from "../supabase/server"

/** Identity only. Commands independently check current profile, beta admission,
 * membership and the live session inside the database transaction. */
export async function requireAuthenticatedUser() {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase.auth.getUser()
  if (error || !data.user) throw new Error("Not authorized")
  return { supabase, user: data.user }
}
