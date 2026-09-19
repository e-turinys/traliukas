import { LocationPicker } from "@/components/shared/location-picker"
import { DateWindowPicker } from "@/components/shared/date-window-picker"
import { FieldError, TextField } from "./fields"
import type { Errors, TransportRequestDraft } from "./model"

export function RouteStep({ draft, update, errors }: { draft: TransportRequestDraft; update: (value: Partial<TransportRequestDraft>) => void; errors: Errors }) {
  return <div className="space-y-6">
    <div className="grid gap-4 sm:grid-cols-2">
      {(["from", "to"] as const).map(key => <div key={key} className="min-w-0 space-y-2">
        <LocationPicker id={`request-${key}`} label={key === "from" ? "Paėmimo vieta" : "Pristatymo vieta"} required value={draft.route[key]} onValueChange={value => update({ route: { ...draft.route, [key]: value } })} invalid={!!errors[key]} describedBy={errors[key] ? `request-${key}-error` : undefined} />
        <FieldError id={`request-${key}`} error={errors[key]} />
      </div>)}
    </div>
    <p className="rounded-lg bg-secondary p-4 text-sm leading-relaxed text-secondary-foreground">Šios vietos bus pritaikytos visiems automobiliams. Jas galėsite pakeisti atskirai.</p>
    <div className="space-y-2">
      <DateWindowPicker id="request-date" label="Kada automobilį galima paimti?" value={draft.route.date} onValueChange={date => update({ route: { ...draft.route, date } })} invalid={!!errors.date} describedBy={errors.date ? "request-date-error" : "date-hint"} />
      <p id="date-hint" className="text-sm text-muted-foreground">Vienas paėmimo laikas visiems automobiliams. Jei datos dar nežinote, rinkitės „Bet kada“.</p>
      <FieldError id="request-date" error={errors.date} />
    </div>
    <fieldset className="space-y-4 border-t pt-5">
      <legend className="text-base font-medium">Tikslesnės vietos (neprivaloma)</legend>
      <p className="text-sm text-muted-foreground">Viešai bus matomos tik pasirinktos vietovės. Tikslūs adresai ir kontaktai vežėjams nebus viešai rodomi iki užsakymo patvirtinimo.</p>
      <TextField id="request-pickup" label="Tikslus paėmimo adresas ar detalės" value={draft.privateDetails.pickup} maxLength={500} onChange={e => update({ privateDetails: { ...draft.privateDetails, pickup: e.target.value } })} />
      <TextField id="request-delivery" label="Tikslus pristatymo adresas ar detalės" value={draft.privateDetails.delivery} maxLength={500} onChange={e => update({ privateDetails: { ...draft.privateDetails, delivery: e.target.value } })} />
    </fieldset>
  </div>
}
