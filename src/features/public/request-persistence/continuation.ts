import type { RequestPayload } from "./payload"

export type PhoneChallenge = "sms" | "phone_change"
type Identity = { phone?: string; phone_confirmed_at?: string } | null
export type PublicationDependencies = {
  identity: () => Promise<Identity>
  challenge: (phone: string, kind: PhoneChallenge) => Promise<void>
  verify: (phone: string, code: string, kind: PhoneChallenge) => Promise<void>
  publish: (payload: RequestPayload, key: string) => Promise<string>
}

/** In-tab continuation: never serializes private drafts/files to browser storage.
 * A network-uncertain publish always retries the same key and frozen payload. */
export function publicationContinuation(payload: RequestPayload, key: string, deps: PublicationDependencies) {
  let kind: PhoneChallenge | undefined
  let attempted = false
  let inFlight = false
  let publishedId: string | undefined
  const frozen = structuredClone(payload)
  async function exclusive<T>(work: () => Promise<T>): Promise<T> {
    if (inFlight) throw new Error("Palaukite, veiksmas vykdomas.")
    inFlight = true
    try { return await work() } finally { inFlight = false }
  }
  async function publish() {
    attempted = true
    publishedId ??= await deps.publish(frozen, key)
    return { id: publishedId }
  }
  return {
    get attempted() { return attempted },
    start: () => exclusive(async () => {
      if (attempted) return publish()
      const user = await deps.identity()
      const phone = user?.phone ? `+${user.phone.replace(/^\+/, "")}` : null
      if (phone === frozen.phone && user?.phone_confirmed_at) return publish()
      kind = user ? "phone_change" : "sms"
      await deps.challenge(frozen.phone, kind)
      return { challenge: kind }
    }),
    verify: (code: string) => exclusive(async () => {
      if (!kind) throw new Error("Pirmiausia paprašykite patvirtinimo kodo.")
      await deps.verify(frozen.phone, code, kind)
      return publish()
    }),
  }
}
