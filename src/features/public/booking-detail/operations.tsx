"use client"

import { useState, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import type { Booking, BookingPickup } from "@/lib/types/booking"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { commandClient, commandError } from "../marketplace-persistence/client"
import { vehicleName } from "../vehicle-summary"
import { bookingCommandResult } from "./logic"

const nextAction = {
  booked: { status: "pickup_scheduled", label: "Suplanuoti paėmimą" },
  pickup_scheduled: { status: "collected", label: "Pažymėti paėmimą" },
  collected: { status: "in_transit", label: "Pradėti vežimą" },
  in_transit: { status: "delivered", label: "Pažymėti pristatymą" },
} as const

export function BookingOperations({ booking, onSaved }: { booking: Booking; onSaved: (state: Pick<Booking, "status" | "statusVersion"> & { pickups?: BookingPickup[] }) => void }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [cancelling, setCancelling] = useState(false)
  const action = booking.viewer === "carrier" && booking.status in nextAction
    ? nextAction[booking.status as keyof typeof nextAction] : null
  const canCancel = booking.status === "booked" || booking.status === "pickup_scheduled"
  if (!booking.statusVersion) return null

  async function submit(event: FormEvent<HTMLFormElement>, cancel: boolean) {
    event.preventDefault()
    if (busy) return
    const form = new FormData(event.currentTarget)
    setBusy(true); setError("")
    try {
      const client = await commandClient()
      let pickups: BookingPickup[] | undefined
      if (!cancel && booking.status === "booked") {
        pickups = booking.vehicles.map(vehicle => ({
          vehicle_id: vehicle.id,
          street: String(form.get(`${vehicle.id}:street`)),
          contact_name: String(form.get(`${vehicle.id}:contact_name`)),
          contact_phone: String(form.get(`${vehicle.id}:contact_phone`)),
          scheduled_from: new Date(String(form.get(`${vehicle.id}:scheduled_from`))).toISOString(),
          scheduled_to: new Date(String(form.get(`${vehicle.id}:scheduled_to`))).toISOString(),
        }))
      }
      const result = cancel
        ? await client.rpc("cancel_booking", { p_booking_id: booking.id, p_expected_version: booking.statusVersion!, p_reason: String(form.get("reason")) })
        : await client.rpc("transition_booking", { p_booking_id: booking.id, p_expected_version: booking.statusVersion!, p_next_status: action!.status, ...(pickups ? { p_pickups: pickups } : {}) })
      if (result.error) throw result.error
      onSaved({ ...bookingCommandResult(result.data, booking.id), ...(pickups ? { pickups } : {}) })
      setCancelling(false)
      router.refresh()
    } catch (cause) { setError(commandError(cause)) }
    finally { setBusy(false) }
  }

  return <>
    {booking.pickups?.length ? <Card className="border py-0 shadow-none ring-0"><CardContent className="space-y-4 p-4 sm:p-6">
      <h2 className="text-xl font-semibold">Suderintas paėmimas</h2>
      <div className="grid gap-4 sm:grid-cols-2">{booking.pickups.map(pickup => <div key={pickup.vehicle_id} className="min-w-0 space-y-2 break-words rounded-lg border p-4 text-sm">
        <h3 className="font-semibold">{vehicleName(booking.vehicles.find(v => v.id === pickup.vehicle_id)!)}</h3>
        <p>{pickup.street}</p><p>{pickup.contact_name} · {pickup.contact_phone}</p>
        <p>{new Date(pickup.scheduled_from).toLocaleString("lt-LT", { timeZone: "UTC" })} – {new Date(pickup.scheduled_to).toLocaleString("lt-LT", { timeZone: "UTC" })} (UTC)</p>
      </div>)}</div>
    </CardContent></Card> : null}
    {action || canCancel ? <Card className="border py-0 shadow-none ring-0"><CardContent className="space-y-5 p-4 sm:p-6">
      <h2 className="text-xl font-semibold">Pervežimo valdymas</h2>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      {action && !cancelling && <form onSubmit={event => void submit(event, false)} className="space-y-5">
        {booking.status === "booked" ? <>
          <p className="text-sm text-muted-foreground">Įveskite suderintas kiekvieno automobilio paėmimo detales. Laikas pagal jūsų įrenginio laiko juostą.</p>
          <div className="grid gap-4 lg:grid-cols-2">{booking.vehicles.map(vehicle => <fieldset key={vehicle.id} disabled={busy} className="min-w-0 space-y-4 rounded-lg border p-4">
            <legend className="max-w-full px-1 font-medium break-words">{vehicleName(vehicle)} · {vehicle.pickupLocation?.city}</legend>
            <label className="block space-y-2 text-sm">Adresas<Input name={`${vehicle.id}:street`} required maxLength={300} autoComplete="off" /></label>
            <label className="block space-y-2 text-sm">Kontaktinis asmuo<Input name={`${vehicle.id}:contact_name`} required maxLength={150} autoComplete="off" /></label>
            <label className="block space-y-2 text-sm">Telefonas su šalies kodu<Input name={`${vehicle.id}:contact_phone`} type="tel" required pattern="\+[1-9][0-9]{1,14}" placeholder="+370…" autoComplete="off" /></label>
            <label className="block space-y-2 text-sm">Paėmimo pradžia<Input name={`${vehicle.id}:scheduled_from`} type="datetime-local" required /></label>
            <label className="block space-y-2 text-sm">Paėmimo pabaiga<Input name={`${vehicle.id}:scheduled_to`} type="datetime-local" required /></label>
          </fieldset>)}</div>
        </> : <p className="text-sm text-muted-foreground">Patvirtinkite tik įvykusį etapą. Būsena taikoma visiems {booking.vehicles.length} automobiliams.</p>}
        <Button type="submit" disabled={busy} className="h-auto min-h-11 whitespace-normal py-3">{busy ? "Saugoma…" : action.label}</Button>
      </form>}
      {canCancel && (cancelling ? <form onSubmit={event => void submit(event, true)} className="space-y-4 border-t pt-4">
        <p className="text-sm">Atšaukimas yra galutinis. Rezervuota maršruto talpa bus atlaisvinta, pokalbis liks tik skaitymui.</p>
        <label className="block space-y-2 text-sm">Atšaukimo priežastis<Input name="reason" required maxLength={2000} disabled={busy} /></label>
        <div className="flex flex-wrap gap-3"><Button type="submit" variant="destructive" disabled={busy}>Patvirtinti atšaukimą</Button><Button type="button" variant="outline" disabled={busy} onClick={() => setCancelling(false)}>Grįžti</Button></div>
      </form> : <Button variant="outline" disabled={busy} onClick={() => setCancelling(true)}>Atšaukti pervežimą</Button>)}
    </CardContent></Card> : null}
    {!canCancel && booking.status !== "completed" && booking.status !== "cancelled" && <p className="text-sm text-muted-foreground">Po paėmimo pervežimo atšaukti savarankiškai negalima. Dėl išimčių kreipkitės į pagalbą.</p>}
  </>
}
