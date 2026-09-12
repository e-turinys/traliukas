"use client"

import { useId, useState, type FormEvent } from "react"
import { LocationPicker } from "@/components/shared/location-picker"
import { DateWindowPicker } from "@/components/shared/date-window-picker"
import { Button } from "@/components/ui/button"
import { dateError, readSearch, writeDate } from "./search-query"

export function SearchEditForm({ query, onSubmit }: { query: string; onSubmit: (params: URLSearchParams) => void }) {
  const initial = readSearch(new URLSearchParams(query))
  const [from, setFrom] = useState(initial.from)
  const [to, setTo] = useState(initial.to)
  const [date, setDate] = useState(initial.date)
  const [submitted, setSubmitted] = useState(false)
  const id = useId()
  const errors = {
    from: !from ? "Pasirinkite paėmimo vietą." : undefined,
    to: !to ? "Pasirinkite pristatymo vietą." : from?.id === to.id ? "Paėmimo ir pristatymo vietos turi skirtis." : undefined,
    date: dateError(date),
  }
  function submit(event: FormEvent) {
    event.preventDefault()
    setSubmitted(true)
    const first = (["from", "to", "date"] as const).find((key) => errors[key])
    if (first) { document.getElementById(`${id}-${first}`)?.focus(); return }
    if (!from || !to) return
    const params = new URLSearchParams(query)
    params.set("from", from.id)
    params.set("to", to.id)
    writeDate(params, date)
    onSubmit(params)
  }
  return <form onSubmit={submit} noValidate className="space-y-4">
    <p className="text-sm text-muted-foreground">Pasirinkite paėmimo ir pristatymo vietas. Datos nurodyti nebūtina.</p>
    <div className="grid gap-4 md:grid-cols-3">
      {(["from", "to"] as const).map((key) => <div key={key} className="min-w-0 space-y-2">
        <LocationPicker id={`${id}-${key}`} label={key === "from" ? "Iš kur?" : "Į kur?"} value={key === "from" ? from : to} onValueChange={key === "from" ? setFrom : setTo} required invalid={submitted && !!errors[key]} describedBy={submitted && errors[key] ? `${id}-${key}-error` : undefined} />
        {submitted && errors[key] && <p id={`${id}-${key}-error`} role="alert" className="text-sm text-destructive">{errors[key]}</p>}
      </div>)}
      <div className="space-y-2">
        <DateWindowPicker id={`${id}-date`} label="Kada?" value={date} onValueChange={setDate} invalid={submitted && !!errors.date} describedBy={submitted && errors.date ? `${id}-date-error` : undefined} />
        {submitted && errors.date && <p id={`${id}-date-error`} role="alert" className="text-sm text-destructive">{errors.date}</p>}
      </div>
    </div>
    <Button type="submit" disabled={!!errors.from || !!errors.to} className="min-h-11 w-full md:w-auto">Rasti vežėją</Button>
  </form>
}
