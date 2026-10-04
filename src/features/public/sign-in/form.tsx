"use client"

import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { requestPhoneOtp, verifyPhoneOtp } from "@/lib/auth/otp"
import { safeAuthReturnPath } from "@/lib/auth/validation"

export function PhoneSignIn({ returnTo }: { returnTo: string }) {
  const router = useRouter()
  const submitting = useRef(false)
  const [phone, setPhone] = useState("")
  const [token, setToken] = useState("")
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")

  async function submit() {
    if (submitting.current) return
    submitting.current = true; setBusy(true); setError("")
    try {
      if (sent) {
        await verifyPhoneOtp(phone, token)
        router.replace(safeAuthReturnPath(returnTo))
        router.refresh()
      } else {
        await requestPhoneOtp(phone)
        setSent(true)
      }
    } catch {
      setError(sent ? "Nepavyko patvirtinti kodo. Patikrinkite kodą ir bandykite dar kartą." : "Nepavyko išsiųsti kodo. Patikrinkite telefono numerį ir bandykite vėliau.")
    } finally {
      submitting.current = false; setBusy(false)
    }
  }

  return <form className="max-w-md space-y-4" onSubmit={event => { event.preventDefault(); void submit() }}>
    <p>Prisijunkite telefono numeriu. Slaptažodžio nereikia.</p>
    <Label htmlFor="login-phone">Telefono numeris su šalies kodu</Label>
    <Input id="login-phone" type="tel" autoComplete="tel" placeholder="+370" required value={phone} disabled={busy || sent} onChange={event => setPhone(event.target.value)} />
    {sent && <>
      <p role="status">Patvirtinimo kodas išsiųstas.</p>
      <Label htmlFor="login-otp">Patvirtinimo kodas</Label>
      <Input id="login-otp" autoComplete="one-time-code" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} required autoFocus disabled={busy} value={token} onChange={event => setToken(event.target.value)} />
    </>}
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    <Button type="submit" disabled={busy} className="min-h-11">{busy ? "Palaukite…" : sent ? "Prisijungti" : "Gauti kodą"}</Button>
    {sent && <Button type="button" variant="outline" disabled={busy} onClick={() => { setSent(false); setToken(""); setError("") }}>Keisti numerį / siųsti dar kartą</Button>}
  </form>
}
