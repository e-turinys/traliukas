"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { requestPhoneOtp, verifyPhoneOtp } from "@/lib/auth/otp"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

export function CarrierSignIn() {
  const router = useRouter()
  const [phone,setPhone] = useState("")
  const [token,setToken] = useState("")
  const [sent,setSent] = useState(false)
  const [busy,setBusy] = useState(false)
  const [error,setError] = useState("")
  async function submit() {
    if (busy) return
    setBusy(true); setError("")
    try {
      if (sent) { await verifyPhoneOtp(phone,token); router.refresh() }
      else { await requestPhoneOtp(phone); setSent(true) }
    } catch { setError("Nepavyko prisijungti. Patikrinkite numerį ar kodą ir bandykite dar kartą.") }
    finally { setBusy(false) }
  }
  return <form className="max-w-md space-y-4" onSubmit={e => {e.preventDefault(); void submit()}}>
    <p>Prisijunkite prie vežėjo paskyros.</p>
    <Label htmlFor="carrier-phone">Telefono numeris su šalies kodu</Label>
    <Input id="carrier-phone" type="tel" autoComplete="tel" placeholder="+370" required value={phone} disabled={busy || sent} onChange={e => setPhone(e.target.value)} />
    {sent && <><Label htmlFor="carrier-otp">Patvirtinimo kodas</Label><Input id="carrier-otp" autoComplete="one-time-code" inputMode="numeric" pattern="[0-9]{6}" required value={token} onChange={e => setToken(e.target.value)} /></>}
    <Button type="submit" className="min-h-11" disabled={busy}>{busy ? "Palaukite…" : sent ? "Prisijungti" : "Gauti kodą"}</Button>
    {sent && <Button type="button" variant="outline" disabled={busy} onClick={() => {setSent(false); setToken("")}}>Keisti numerį / siųsti dar kartą</Button>}
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
  </form>
}
