export function requireE164(value: string) {
  if (!/^\+[1-9]\d{1,14}$/.test(value)) throw new Error("Enter a phone number in E.164 format")
  return value
}

export function requireOtp(value: string) {
  if (!/^\d{6}$/.test(value)) throw new Error("Enter the six-digit code")
  return value
}

/** Only known app pages may receive a post-auth redirect. Never external URLs. */
export function safeAuthReturnPath(value: string | null | undefined) {
  if (!value?.startsWith("/") || value.startsWith("//") || /[\\\u0000-\u0020\u007f]/.test(value)) return "/"
  const pathname = value.split(/[?#]/, 1)[0]
  const pages = ["/", "/search", "/dashboard", "/request/new", "/carrier", "/carrier/routes", "/carrier/routes/new", "/carrier/requests", "/carrier/bookings", "/messages", "/notifications"]
  const detail = /^\/(?:offers|requests|routes|carriers|bookings|messages)\/[a-zA-Z0-9-]+$/.test(pathname)
    || /^\/carrier\/(?:routes|requests)\/[a-zA-Z0-9-]+(?:\/edit)?$/.test(pathname)
    || /^\/request\/[a-zA-Z0-9-]+\/published$/.test(pathname)
  return pages.includes(pathname) || detail ? value : "/"
}

/** Use before future cookie-authenticated HTTP mutations; do not trust Host. */
export function assertSameOrigin(origin: string | null, configuredOrigin: string, fetchSite?: string | null) {
  const canonical = new URL(configuredOrigin)
  if (canonical.origin !== configuredOrigin || origin !== configuredOrigin || fetchSite === "cross-site") {
    throw new Error("Invalid request origin")
  }
}
