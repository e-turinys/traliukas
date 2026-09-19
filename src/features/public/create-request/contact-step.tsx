import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Choices, FieldError, TextField } from "./fields"
import { type Errors, type Step, type TransportRequestDraft } from "./model"
import { dateLabel } from "../search-query"
import { compactVehicleSummary, vehicleDisplayLine } from "../vehicle-summary"
import { requestRouteSummary, transportLocationLabel, vehicleRouteLabel } from "../request-route-summary"

export function visibilityLabel(draft: TransportRequestDraft) {
  const name = draft.target.route?.carrier.name
  if (!draft.target.requested) return "Tinkamiems vežėjams"
  if (!name) return "Pasirinktas vežėjas nepasiekiamas"
  return draft.visibility === "targeted" ? `Tik ${name}` : `${name} ir kitiems tinkamiems vežėjams`
}

export function ContactStep({ draft, update, errors, onEdit }: { draft: TransportRequestDraft; update: (value: Partial<TransportRequestDraft>) => void; errors: Errors; onEdit: (step: Step) => void }) {
  const carrier = draft.target.route?.carrier
  const routeSummary = requestRouteSummary(draft.vehicles)
  return <div className="space-y-6">
    <p className="rounded-lg bg-secondary p-4 text-sm leading-relaxed text-secondary-foreground">Kontaktai nėra vieši. Telefoną reikės patvirtinti prieš paskelbiant užklausą.</p>
    <TextField id="request-name" label="Vardas" autoComplete="given-name" required maxLength={100} value={draft.contact.name} onChange={e => update({ contact: { ...draft.contact, name: e.target.value } })} error={errors.name} />
    <TextField id="request-phone" label="Telefonas" type="tel" autoComplete="tel" placeholder="+370" required maxLength={24} value={draft.contact.phone} onChange={e => update({ contact: { ...draft.contact, phone: e.target.value } })} error={errors.phone} />
    <TextField id="request-email" label="El. paštas" type="email" autoComplete="email" required maxLength={254} value={draft.contact.email} onChange={e => update({ contact: { ...draft.contact, email: e.target.value } })} error={errors.email} />
    {draft.target.requested && carrier ? <Choices marketplace id="request-visibility" label="Kam siųsti užklausą?" value={draft.visibility} options={{ targeted: `Tik ${carrier.name}`, marketplace: `${carrier.name} ir kitiems tinkamiems vežėjams` }} onChange={visibility => update({ visibility: visibility as typeof draft.visibility })} /> : !draft.target.requested && <section className="space-y-2" aria-labelledby="visibility-heading">
      <h3 id="visibility-heading" className="font-medium">Kam bus matoma užklausa?</h3>
      <p className="text-sm text-muted-foreground">Paskelbtą užklausą matys tinkami vežėjai. Tikslūs adresai ir kontaktai jiems nebus viešai rodomi iki užsakymo patvirtinimo.</p>
    </section>}
    <section aria-labelledby="summary-heading" className="space-y-4 rounded-xl border bg-background p-4 sm:p-6">
      <h3 id="summary-heading" className="text-lg font-semibold">Jūsų užklausa</h3>
      <dl className="grid gap-4 text-sm sm:grid-cols-2">
        <div><dt className="text-muted-foreground">Maršrutas</dt><dd>{routeSummary.compact}{routeSummary.compact === "Kelių vietų pervežimas" && ` · ${transportLocationLabel(routeSummary.locationCount)}`}</dd></div>
        <div><dt className="text-muted-foreground">Paėmimo data</dt><dd>{dateLabel(draft.route.date)}</dd></div>
        <div><dt className="text-muted-foreground">Automobiliai</dt><dd className="break-words">{compactVehicleSummary(draft.vehicles)}</dd></div>
        <div><dt className="text-muted-foreground">Matomumas</dt><dd>{visibilityLabel(draft)}</dd></div>
      </dl>
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" className="h-auto min-h-11 px-3 py-2 whitespace-normal" onClick={() => onEdit(1)}>Keisti maršrutą ar datą</Button>
        <Button type="button" variant="outline" className="h-auto min-h-11 px-3 py-2 whitespace-normal" onClick={() => onEdit(2)}>Keisti automobilius</Button>
      </div>
      <ul className="divide-y border-y">
        {draft.vehicles.map((vehicle, index) => <li key={vehicle.id} className="space-y-1 py-4 text-sm">
          <p className="font-medium">{index + 1}. {vehicleDisplayLine(vehicle)}{vehicle.year && ` · ${vehicle.year}`}</p>
          <p className="text-primary">{vehicleRouteLabel(vehicle)}</p>
          <p className="text-muted-foreground">{vehicle.condition === "running" ? "Važiuojantis" : `Nevažiuojantis · ${vehicle.rolls === "yes" ? "Rieda" : vehicle.rolls === "no" ? "Nerieda" : "Ar rieda – nežinoma"}`}</p>
        </li>)}
      </ul>
      {draft.notes && <div className="space-y-2 text-sm"><p className="font-medium">Informacija vežėjui</p><p className="whitespace-pre-wrap break-words text-muted-foreground">{draft.notes}</p></div>}
      <Button type="button" variant="ghost" className="h-auto min-h-11 px-3 py-2 whitespace-normal" onClick={() => onEdit(3)}>{draft.notes ? "Keisti papildomą informaciją" : "Pridėti papildomos informacijos"}</Button>
    </section>
    <div className="space-y-2">
      <label className="flex min-h-11 cursor-pointer items-start gap-3 py-2 text-sm" htmlFor="request-terms">
        <input id="request-terms" type="checkbox" className="mt-0.5 size-5 shrink-0 accent-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring" required checked={draft.termsAccepted} onChange={e => update({ termsAccepted: e.target.checked })} aria-invalid={!!errors.terms} aria-describedby={`terms-links${errors.terms ? " request-terms-error" : ""}`} />
        <span>Susipažinau su platformos taisyklėmis ir privatumo politika bei sutinku su jų sąlygomis.</span>
      </label>
      <p id="terms-links" className="flex flex-wrap gap-x-4 text-sm">
        <Link href="/terms" target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center underline underline-offset-4">Taisyklės (naujame lange)</Link>
        <Link href="/privacy" target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center underline underline-offset-4">Privatumo politika (naujame lange)</Link>
      </p>
      <FieldError id="request-terms" error={errors.terms} />
    </div>
  </div>
}
