export function requireE164(value: string) {
  if (!/^\+[1-9]\d{1,14}$/.test(value)) throw new Error("Enter a phone number in E.164 format")
  return value
}

export function requireOtp(value: string) {
  if (!/^\d{6}$/.test(value)) throw new Error("Enter the six-digit code")
  return value
}

/** Explicit destinations only. In-tab OTP normally needs no navigation. */
export function safeAuthReturnPath(value: string | null | undefined) {
  return value === "/request/new" || value === "/dashboard" ? value : "/"
}

/** Use before future cookie-authenticated HTTP mutations; do not trust Host. */
export function assertSameOrigin(origin: string | null, configuredOrigin: string, fetchSite?: string | null) {
  const canonical = new URL(configuredOrigin)
  if (canonical.origin !== configuredOrigin || origin !== configuredOrigin || fetchSite === "cross-site") {
    throw new Error("Invalid request origin")
  }
}
