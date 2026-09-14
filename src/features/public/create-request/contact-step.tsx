import Link from "next/link"
import { Choices, FieldError, TextField } from "./fields"
import { requestCategories, type Errors, type TransportRequestDraft } from "./model"
import { dateLabel } from "../search-query"

export function visibilityLabel(draft: TransportRequestDraft) {
  const name = draft.target.route?.carrier.name
  if (!draft.target.requested) return "Tinkamiems vežėjams"
  if (!name) return "Pasirinktas vežėjas nepasiekiamas"
  return draft.visibility === "targeted" ? `Tik ${name}` : `${name} ir kitiems tinkamiems vežėjams`
}

export function ContactStep({ draft, update, errors }: { draft: TransportRequestDraft; update: (value: Partial<TransportRequestDraft>) => void; errors: Errors }) {
  const carrier = draft.target.route?.carrier
  return <div className="space-y-6">
    <p className="text-sm text-muted-foreground">Kontaktai nėra vieši. Telefoną reikės patvirtinti prieš paskelbiant užklausą.</p>
    <TextField id="request-name" label="Vardas" autoComplete="given-name" required maxLength={100} value={draft.contact.name} onChange={e => update({ contact: { ...draft.contact, name: e.target.value } })} error={errors.name} />
    <TextField id="request-phone" label="Telefonas" type="tel" autoComplete="tel" placeholder="+370" required maxLength={24} value={draft.contact.phone} onChange={e => update({ contact: { ...draft.contact, phone: e.target.value } })} error={errors.phone} />
    <TextField id="request-email" label="El. paštas" type="email" autoComplete="email" required maxLength={254} value={draft.contact.email} onChange={e => update({ contact: { ...draft.contact, email: e.target.value } })} error={errors.email} />
    {draft.target.requested && carrier ? <Choices id="request-visibility" label="Kam siųsti užklausą?" value={draft.visibility} options={{ targeted: `Tik ${carrier.name}`, marketplace: `${carrier.name} ir kitiems tinkamiems vežėjams` }} onChange={visibility => update({ visibility: visibility as typeof draft.visibility })} /> : !draft.target.requested && <section className="space-y-2" aria-labelledby="visibility-heading">
      <h3 id="visibility-heading" className="font-medium">Kam bus matoma užklausa?</h3>
      <p className="text-sm text-muted-foreground">Paskelbtą užklausą matys tinkami vežėjai. Tikslūs adresai ir kontaktai jiems nebus viešai rodomi iki užsakymo patvirtinimo.</p>
    </section>}
    <section aria-labelledby="summary-heading" className="space-y-3 rounded-lg bg-muted/40 p-4">
      <h3 id="summary-heading" className="font-medium">Jūsų užklausa</h3>
      <dl className="space-y-3 text-sm">
        <div><dt className="text-muted-foreground">Maršrutas</dt><dd>{draft.route.from?.city} → {draft.route.to?.city}</dd></div>
        <div><dt className="text-muted-foreground">Paėmimo data</dt><dd>{dateLabel(draft.route.date)}</dd></div>
        <div><dt className="text-muted-foreground">Automobilis</dt><dd className="break-words">{draft.vehicle.make} {draft.vehicle.model}{draft.vehicle.year && `, ${draft.vehicle.year}`} · {draft.vehicle.category && requestCategories[draft.vehicle.category]} · {draft.vehicle.condition === "running" ? "Važiuojantis" : "Nevažiuojantis"}</dd></div>
        <div><dt className="text-muted-foreground">Matomumas</dt><dd>{visibilityLabel(draft)}</dd></div>
      </dl>
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
