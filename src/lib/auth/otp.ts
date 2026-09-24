"use client"

import { createBrowserSupabaseClient } from "../supabase/client"
import { requireE164, requireOtp } from "./validation"

/** OTP delivery is managed by Auth and its abuse controls. */
export async function requestPhoneOtp(phone: string, captchaToken?: string) {
  const { error } = await createBrowserSupabaseClient().auth.signInWithOtp({
    phone: requireE164(phone), options: { shouldCreateUser: true, captchaToken },
  })
  if (error) throw new Error("Unable to send a code. Try again later.")
}

export async function verifyPhoneOtp(phone: string, token: string) {
  const { error } = await createBrowserSupabaseClient().auth.verifyOtp({
    phone: requireE164(phone), token: requireOtp(token), type: "sms",
  })
  if (error) throw new Error("Unable to verify the code.")
}

/** Existing email-authenticated users must verify an attached phone, not sign
 * into another account. Auth handles identity conflicts without account merging. */
export async function requestPhoneChange(phone: string) {
  const client = createBrowserSupabaseClient()
  const { data, error: userError } = await client.auth.getUser()
  if (userError || !data.user) throw new Error("Sign in before changing your phone")
  const { error } = await client.auth.updateUser({ phone: requireE164(phone) })
  if (error) throw new Error("Unable to send a code. Try again later.")
}

export async function verifyPhoneChange(phone: string, token: string) {
  const { error } = await createBrowserSupabaseClient().auth.verifyOtp({
    phone: requireE164(phone), token: requireOtp(token), type: "phone_change",
  })
  if (error) throw new Error("Unable to verify the code.")
}
