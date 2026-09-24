"use client"

import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Phone } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createBrowserSupabaseClient } from "@/lib/supabase/client"
import { requestPhoneOtp, verifyPhoneOtp, requestPhoneChange, verifyPhoneChange } from "@/lib/auth/otp"
import type { TransportRequestDraft } from "../create-request/model"
import { requestPayload } from "./payload"
import { publicationContinuation } from "./continuation"

export function PhonePublish({ draft, onBack }: { draft: TransportRequestDraft; onBack: () => void }) {
  const router = useRouter()
  const flow = useRef<ReturnType<typeof publicationContinuation> | null>(null)
  const busyRef = useRef(false)
  const [busy, setBusy] = useState(false)
  const [code, setCode] = useState("")
  const [sent, setSent] = useState(false)
  const [error, setError] = useState("")
  const [attempted, setAttempted] = useState(false)

  function continuation() {
    if (!flow.current) {
      const payload = requestPayload(draft)
      const client = createBrowserSupabaseClient()
      flow.current = publicationContinuation(payload, crypto.randomUUID(), {
        identity: async () => {
          const { data, error } = await client.auth.getUser()
          if (error && error.name !== "AuthSessionMissingError") throw new Error("Nepavyko patikrinti sesijos. Bandykite dar kartą.")
          return data.user
        },
        challenge: (phone, kind) => kind === "sms" ? requestPhoneOtp(phone) : requestPhoneChange(phone),
        verify: (phone, token, kind) => kind === "sms" ? verifyPhoneOtp(phone, token) : verifyPhoneChange(phone, token),
        publish: async (value, key) => {
          const { data, error } = await client.rpc("publish_request", { p_payload: value, p_client_publish_key: key })
          if (error || !data) throw new Error(error?.code === "42501"
            ? "Paskelbti nepavyko. Patikrinkite telefono patvirtinimą ir paskyros prieigą prie uždaros beta versijos."
            : "Nepavyko patvirtinti paskelbimo. Bandykite dar kartą – pakartotinė užklausa nebus sukurta.")
          return data
        },
      })
    }
    return flow.current
  }
  async function run(verify: boolean) {
    if (busyRef.current) return
    busyRef.current = true; setBusy(true); setError("")
    try {
      const current = continuation()
      const result = await (verify ? current.verify(code) : current.start())
      if ("id" in result && result.id) router.push(`/request/${encodeURIComponent(result.id)}/published`)
      else setSent(true)
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Nepavyko paskelbti užklausos.")
    } finally {
      setAttempted(flow.current?.attempted ?? false)
      busyRef.current = false; setBusy(false)
    }
  }
  return <section className="space-y-4" aria-labelledby="handoff-heading">
    <Phone aria-hidden="true" className="size-6 text-primary" />
    <h2 id="handoff-heading" tabIndex={-1} className="text-xl font-semibold">Patvirtinkite kontaktus ir paskelbkite užklausą.</h2>
    <p className="leading-relaxed">Patvirtinkite telefono numerį {draft.contact.phone}. Įvesti užklausos duomenys išliks šiame puslapyje.</p>
    {sent && !attempted && <form className="space-y-3" onSubmit={event => { event.preventDefault(); void run(true) }}>
      <Label htmlFor="request-otp">Patvirtinimo kodas</Label>
      <Input id="request-otp" autoComplete="one-time-code" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} value={code} onChange={event => setCode(event.target.value)} required disabled={busy} />
      <Button type="submit" disabled={busy} className="h-auto min-h-11 w-full py-3 whitespace-normal">Patvirtinti ir paskelbti</Button>
    </form>}
    <Button type="button" variant={sent ? "outline" : "default"} disabled={busy} onClick={() => void run(false)} className="h-auto min-h-11 w-full py-3 whitespace-normal">
      {busy ? "Palaukite…" : attempted ? "Pakartoti paskelbimą" : sent ? "Siųsti kodą dar kartą" : "Tęsti ir paskelbti"}
    </Button>
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    <p role="status" className="text-sm text-muted-foreground">{attempted ? "Paskelbimo bandymas pradėtas. Jei ryšys nutrūko, pakartokite jį šiame puslapyje." : sent ? "Patvirtinimo kodas išsiųstas. Užklausa dar nepaskelbta." : "Užklausa dar nepaskelbta."}</p>
    <p className="text-sm text-muted-foreground">Uždarius ar atnaujinus puslapį nepaskelbti duomenys neišliks.</p>
    <Button type="button" variant="outline" disabled={busy || attempted} className="h-auto min-h-11 w-full px-4 py-3 whitespace-normal" onClick={onBack}>Grįžti prie užklausos</Button>
  </section>
}
