"use client"

import { useRef, useState, type FormEvent } from "react"
import { ArrowLeft, ArrowRight, Check, Phone } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { formatDateRange } from "@/lib/format-date"
import { readDate } from "../search-query"
import { ContactStep } from "./contact-step"
import { RouteStep } from "./route-step"
import { VehicleStep } from "./vehicle-step"
import { createRequestDraft, targetIssue, switchToMarketplace, validateStep } from "./logic"
import type { Errors, Step, TransportRequestDraft } from "./model"

const steps = ["Maršrutas", "Automobiliai", "Papildoma informacija", "Kontaktai ir matomumas"]
const headings = ["Kur reikia pervežti automobilius?", "Kokius automobilius reikia pervežti?", "Papildoma informacija", "Kontaktai"]

export function CreateRequestWizard({ query, today }: { query: string; today: string }) {
  const reviewStep = new URLSearchParams(query).get("review")?.startsWith("multi-") ?? false
  const [draft, setDraft] = useState(() => createRequestDraft(new URLSearchParams(query)))
  const [step, setStep] = useState<Step>(reviewStep ? 2 : 1)
  const [errors, setErrors] = useState<Errors>({})
  // Future U01/U02 integration starts here; this state never means verified or published.
  const [handoff, setHandoff] = useState(false)
  const [prefillNotice, setPrefillNotice] = useState(() => readDate(new URLSearchParams(query)).invalid)
  const heading = useRef<HTMLHeadingElement>(null)
  const handoffHeading = useRef<HTMLHeadingElement>(null)
  const target = draft.target.route
  const issue = targetIssue(draft, today)

  function update(value: Partial<TransportRequestDraft>) {
    const next = { ...draft, ...value }
    if (value.route && !value.vehicles) {
      next.vehicles = draft.vehicles.map(vehicle => vehicle.usesDefaultRoute ? {
        ...vehicle, pickupLocation: value.route?.from ?? null, deliveryLocation: value.route?.to ?? null,
      } : vehicle)
    }
    setDraft(next)
    const nextErrors = validateStep(next, step, today)
    setErrors(current => Object.fromEntries(Object.keys(current)
      .filter(key => nextErrors[key as keyof Errors])
      .map(key => [key, nextErrors[key as keyof Errors]])))
    if (value.route && value.route.date !== draft.route.date) setPrefillNotice(false)
    setHandoff(false)
  }
  function focusHeading() { requestAnimationFrame(() => heading.current?.focus()) }
  function move(next: Step) { setStep(next); setErrors({}); setHandoff(false); focusHeading() }
  function showErrors(nextErrors: Errors) {
    setErrors(nextErrors)
    requestAnimationFrame(() => {
      const vehicleEntry = nextErrors.vehicles && Object.entries(nextErrors.vehicles).find(([, fields]) => Object.keys(fields).length)
      const vehicleField = vehicleEntry && Object.keys(vehicleEntry[1])[0]
      const element = vehicleEntry && vehicleField
        ? document.getElementById(`request-${vehicleEntry[0]}-${vehicleField}`)
        : document.getElementById(`request-${Object.keys(nextErrors)[0]}`)
      const input = element?.querySelector<HTMLElement>('[role="radio"],input,button')
      ;(input ?? element)?.focus()
    })
  }
  function submit(event: FormEvent) {
    event.preventDefault()
    const nextErrors = validateStep(draft, step, today)
    if (Object.keys(nextErrors).length) { showErrors(nextErrors); return }
    if (step < 4) { move((step + 1) as Step); return }
    // Revalidate the whole in-memory draft before the future phone verification boundary.
    for (const previous of [1, 2] as const) {
      const previousErrors = validateStep(draft, previous, today)
      if (Object.keys(previousErrors).length) { setStep(previous); showErrors(previousErrors); return }
    }
    setErrors({})
    setHandoff(true)
    requestAnimationFrame(() => handoffHeading.current?.focus())
  }

  return <div className="mx-auto max-w-3xl space-y-6 sm:space-y-8 [&_[data-slot=label]]:leading-snug">
    <header className="space-y-3">
      <p className="text-sm font-medium text-primary">Automobilių pervežimas</p>
      <h1 className="text-3xl leading-tight font-semibold tracking-tight sm:text-4xl">Pervežimo užklausa</h1>
      <p className="text-sm text-muted-foreground">Vienoje užklausoje galite nurodyti 1–10 automobilių su bendru pageidaujamu paėmimo laiku.</p>
      <p aria-live="polite" className="font-medium sm:sr-only">{step} iš 4 · {steps[step - 1]}</p>
      <Progress className="sm:hidden" value={step} max={4} aria-label="Užklausos žingsniai" aria-valuetext={`${step} iš 4: ${steps[step - 1]}`} />
      <ol aria-label="Užklausos žingsniai" className="hidden gap-4 pt-3 sm:grid sm:grid-cols-4">
        {steps.map((label, index) => <li key={label} aria-current={step === index + 1 ? "step" : undefined} className={`flex items-start gap-2 border-t-2 pt-3 text-sm ${step === index + 1 ? "border-primary font-semibold" : "border-border text-muted-foreground"}`}>
          <span aria-hidden="true" className={`flex size-6 shrink-0 items-center justify-center rounded-md ${index + 1 <= step ? "bg-secondary text-primary" : "bg-muted"}`}>{index + 1 < step ? <Check className="size-4" /> : index + 1}</span>
          <span>{label}{index + 1 < step && <span className="sr-only"> · Užbaigta</span>}</span>
        </li>)}
      </ol>
    </header>

    {draft.target.requested && <Card className="overflow-visible border border-primary/20 py-6 ring-0"><CardContent className="space-y-2 px-6">
      {target && <>
        <p className="font-medium">{draft.visibility === "targeted" ? "Pasiūlymo prašote iš" : "Užklausa vežėjui ir kitiems tinkamiems vežėjams:"} {target.carrier.name}</p>
        <p className="text-sm">{target.origin.city} → {target.destination.city}</p>
        <p className="text-sm text-muted-foreground">{formatDateRange(target.dateFrom, target.dateTo)}</p>
      </>}
      {issue && <div id="request-target" tabIndex={-1} aria-describedby="target-issue" className="space-y-3">
        <p id="target-issue" role="status" className="text-sm text-muted-foreground">{issue}</p>
        <Button type="button" variant="outline" className="h-auto min-h-11 w-full py-3 whitespace-normal" onClick={() => { setDraft(switchToMarketplace(draft)); setErrors({}); setHandoff(false) }}>Tęsti su kitais vežėjais</Button>
      </div>}
    </CardContent></Card>}

    <Card className="overflow-visible border py-6 ring-0"><CardContent className="space-y-6 px-4 sm:px-6">
      {handoff ? <section className="space-y-4" aria-labelledby="handoff-heading">
        <Phone aria-hidden="true" className="size-6 text-primary" />
        <h2 id="handoff-heading" ref={handoffHeading} tabIndex={-1} className="text-xl font-semibold">Kitas žingsnis – telefono patvirtinimas</h2>
        <p role="status" className="leading-relaxed">Prieš paskelbiant užklausą reikės patvirtinti telefono numerį. Telefono patvirtinimas kol kas nepasiekiamas. Užklausa nepaskelbta, patvirtinimo kodas neišsiųstas.</p>
        <p className="text-sm text-muted-foreground">Įvestus duomenis galite peržiūrėti ir keisti šiame puslapyje. Uždarius ar atnaujinus puslapį jie neišliks.</p>
        <Button type="button" variant="outline" className="h-auto min-h-11 w-full px-4 py-3 whitespace-normal" onClick={() => { setHandoff(false); focusHeading() }}>Grįžti prie užklausos</Button>
      </section> : <form noValidate onSubmit={submit} className="space-y-6">
        <h2 ref={heading} tabIndex={-1} className="text-xl leading-snug font-semibold tracking-tight sm:text-2xl">{headings[step - 1]}</h2>
        {step === 1 && <>
          {prefillNotice && <p role="status" className="text-sm text-muted-foreground">Nuorodoje nurodyta data netinkama. Pasirinkite datą arba „Bet kada“.</p>}
          <RouteStep draft={draft} update={update} errors={errors} />
        </>}
        {step === 2 && <VehicleStep draft={draft} update={update} errors={errors} />}
        {step === 3 && <div className="space-y-3">
          <Label htmlFor="request-notes">Informacija vežėjui (neprivaloma)</Label>
          <Textarea id="request-notes" className="bg-white p-3 text-base" rows={5} maxLength={2000} value={draft.notes} onChange={e => update({ notes: e.target.value })} aria-describedby="notes-hint notes-privacy" />
          <p id="notes-hint" className="text-sm text-muted-foreground">Pvz. automobilis aukciono aikštelėje, raktai vietoje, paėmimas galimas darbo dienomis.</p>
          <p id="notes-privacy" className="text-sm text-muted-foreground">Čia nerašykite telefono, el. pašto ar tikslaus adreso – jiems skirti atskiri laukai.</p>
        </div>}
        {step === 4 && <ContactStep draft={draft} update={update} errors={errors} onEdit={move} />}
        {errors.target && <p role="alert" className="text-sm text-destructive">{errors.target}</p>}
        <div className="flex flex-col-reverse gap-3 border-t pt-6 sm:flex-row sm:justify-between">
          {step > 1 && <Button type="button" variant="outline" className="h-auto min-h-11 px-6 py-3 whitespace-normal sm:w-auto" onClick={() => move((step - 1) as Step)}><ArrowLeft aria-hidden="true" />Atgal</Button>}
          <Button type="submit" className="h-auto min-h-11 min-w-0 w-full px-6 py-3 whitespace-normal sm:ml-auto sm:w-auto">{step === 4 ? "Tęsti telefono patvirtinimą" : "Toliau"}<ArrowRight aria-hidden="true" /></Button>
        </div>
      </form>}
    </CardContent></Card>
  </div>
}
