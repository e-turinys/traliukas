import { useEffect, useRef, useState } from "react"
import { LocationPicker } from "@/components/shared/location-picker"
import { DateWindowPicker } from "@/components/shared/date-window-picker"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Choices, FieldError } from "../create-request/fields"
import { VehiclePhotos } from "../create-request/photos"
import { requestCategories, type Errors } from "../create-request/model"
import { isMaterialEdit, validateRequestEdit } from "./logic"
import type { RequestDetail, RequestEdit } from "./model"
import { ConfirmRequestDialog } from "./confirm-dialog"

export function RequestEditSection({ request, today, onSave, onCancel }: {
  request: RequestDetail; today: string; onSave: (edit: RequestEdit, confirmed: boolean) => void; onCancel: () => void
}) {
  const [edit, setEdit] = useState<RequestEdit>({ route: request.route, vehicle: request.vehicle, notes: request.notes, photos: request.photos })
  const [errors, setErrors] = useState<Errors>({})
  const [confirm, setConfirm] = useState(false)
  const form = useRef<HTMLFormElement>(null)
  const heading = useRef<HTMLHeadingElement>(null)
  const save = useRef<HTMLButtonElement>(null)
  useEffect(() => { heading.current?.focus() }, [])
  const change = (patch: Partial<RequestEdit>) => { setEdit(current => ({ ...current, ...patch })); setErrors({}) }
  const setVehicle = (patch: Partial<RequestEdit["vehicle"]>) => change({ vehicle: { ...edit.vehicle, ...patch } })
  return <section className="min-w-0 rounded-xl border p-4 sm:p-6" aria-labelledby="edit-heading">
    <h2 id="edit-heading" ref={heading} tabIndex={-1} className="mb-5 text-xl font-semibold outline-none">Redaguoti užklausą</h2>
    <form ref={form} noValidate className="space-y-6" onSubmit={event => {
      event.preventDefault()
      const issues = validateRequestEdit(request, edit, today)
      setErrors(issues)
      if (Object.keys(issues).length) {
        requestAnimationFrame(() => form.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus())
      } else if (isMaterialEdit(request, edit)) setConfirm(true)
      else onSave(edit, false)
    }}>
      <div className="grid gap-4 sm:grid-cols-2">
        {(["from", "to"] as const).map(key => <div key={key} className="min-w-0 space-y-2">
          <LocationPicker id={`edit-${key}`} label={key === "from" ? "Paėmimo vieta" : "Pristatymo vieta"} required value={edit.route[key]} onValueChange={value => change({ route: { ...edit.route, [key]: value } })} invalid={!!errors[key]} describedBy={errors[key] ? `edit-${key}-error` : undefined} />
          <FieldError id={`edit-${key}`} error={errors[key]} />
        </div>)}
      </div>
      <div className="space-y-2">
        <DateWindowPicker id="edit-date" label="Kada automobilį galima paimti?" value={edit.route.date} onValueChange={date => change({ route: { ...edit.route, date } })} invalid={!!errors.date} describedBy={errors.date ? "edit-date-error" : undefined} />
        <FieldError id="edit-date" error={errors.date} />
      </div>
      <Choices id="edit-category" label="Transporto priemonės kategorija" value={edit.vehicle.category} options={requestCategories} onChange={category => setVehicle({ category: category as RequestEdit["vehicle"]["category"] })} error={errors.category} />
      <Choices id="edit-condition" label="Automobilio būklė" value={edit.vehicle.condition} options={{ running: "Važiuojantis", "non-running": "Nevažiuojantis" }} onChange={condition => setVehicle({ condition: condition as RequestEdit["vehicle"]["condition"] })} error={errors.condition} />
      {edit.vehicle.condition === "non-running" && <Choices id="edit-rolls" label="Ar automobilį galima laisvai užridenti / ar jis rieda?" value={edit.vehicle.rolls} options={{ yes: "Taip", no: "Ne", unknown: "Nežinau" }} onChange={rolls => setVehicle({ rolls: rolls as RequestEdit["vehicle"]["rolls"] })} error={errors.rolls} />}
      <div className="space-y-2">
        <Label htmlFor="edit-notes">Informacija vežėjui</Label>
        <Textarea id="edit-notes" value={edit.notes} maxLength={2000} onChange={e => change({ notes: e.target.value })} className="min-h-28 w-full" />
        <p className="text-sm text-muted-foreground">Pastabų ir nuotraukų pakeitimai pasiūlymų galiojimo nekeičia.</p>
      </div>
      <VehiclePhotos files={edit.photos} onChange={photos => change({ photos })} />
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button ref={save} type="submit" className="h-auto min-h-11 py-3 whitespace-normal">Išsaugoti pakeitimus</Button>
        <Button type="button" variant="outline" className="h-auto min-h-11 py-3 whitespace-normal" onClick={onCancel}>Atšaukti</Button>
      </div>
    </form>
    <ConfirmRequestDialog open={confirm} onOpenChange={setConfirm} title="Patvirtinti pakeitimus?" description="Pakeitus šiuos duomenis esami pasiūlymai nebegalios." action="Patvirtinti pakeitimus" finalFocus={save} onConfirm={() => onSave(edit, true)} />
  </section>
}
