"use client"

import { useId, useState, type FormEvent } from "react"
import { DateWindowPicker } from "@/components/shared/date-window-picker"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { vehicleCategoryLabels } from "@/lib/types/carrier-route"
import { dateError, readDate, readFilters, writeDate } from "./search-query"

export function SearchSelect({ label, value, options, onChange }: {
  label: string; value: string; options: { value: string; label: string }[]; onChange: (value: string) => void
}) {
  const id = useId()
  return <div className="min-w-0 space-y-2">
    <Label htmlFor={id}>{label}</Label>
    <Select value={value} onValueChange={(next) => { if (next !== null) onChange(next) }} items={options}>
      <SelectTrigger id={id} className="min-h-11 w-full whitespace-normal bg-card data-[size=default]:h-auto"><SelectValue className="line-clamp-none" /></SelectTrigger>
      <SelectContent className="marketplace-theme">{options.map((option) => <SelectItem key={option.value} value={option.value} className="min-h-11 [&>span]:shrink [&>span]:whitespace-normal">{option.label}</SelectItem>)}</SelectContent>
    </Select>
  </div>
}

export function SearchFilters({ query, apply }: { query: string; apply: (params: URLSearchParams) => void }) {
  const params = new URLSearchParams(query)
  const initial = readFilters(params)
  const [date, setDate] = useState(readDate(params).value)
  const [verified, setVerified] = useState(initial.verified)
  const [rating, setRating] = useState(initial.rating)
  const [vehicle, setVehicle] = useState<string>(initial.vehicle)
  const [nonRunning, setNonRunning] = useState(initial.nonRunning)
  const [submitted, setSubmitted] = useState(false)
  const id = useId()
  const error = dateError(date)
  function submit(event: FormEvent) {
    event.preventDefault()
    setSubmitted(true)
    if (error) { document.getElementById(`${id}-date`)?.focus(); return }
    writeDate(params, date)
    for (const [key, value] of Object.entries({ verified: verified ? "true" : "", rating: rating === "any" ? "" : rating, vehicle: vehicle === "any" ? "" : vehicle, nonRunning: nonRunning ? "true" : "" })) {
      if (value) params.set(key, value)
      else params.delete(key)
    }
    apply(params)
  }
  return <form onSubmit={submit} className="space-y-4">
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="space-y-2"><DateWindowPicker id={`${id}-date`} label="Data" value={date} onValueChange={setDate} invalid={submitted && !!error} describedBy={submitted && error ? `${id}-error` : undefined} />
        {submitted && error && <p id={`${id}-error`} role="alert" className="text-sm text-destructive">{error}</p>}
      </div>
      <SearchSelect label="Reitingas" value={rating} onChange={setRating} options={[{ value: "any", label: "Visi reitingai" }, { value: "4", label: "4 ir daugiau" }, { value: "4.5", label: "4,5 ir daugiau" }]} />
      <SearchSelect label="Transporto priemonės kategorija" value={vehicle} onChange={setVehicle} options={[{ value: "any", label: "Visos kategorijos" }, ...Object.entries(vehicleCategoryLabels).map(([value, label]) => ({ value, label }))]} />
    </div>
    <div className="flex flex-col gap-2 lg:flex-row lg:flex-wrap lg:gap-6">
      <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm"><input type="checkbox" checked={verified} onChange={(event) => setVerified(event.target.checked)} className="size-5 accent-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring" />Tik patvirtinti vežėjai</label>
      <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm"><input type="checkbox" checked={nonRunning} onChange={(event) => setNonRunning(event.target.checked)} className="size-5 accent-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring" />Gali vežti nevažiuojantį automobilį</label>
    </div>
    <div className="flex flex-col gap-2 sm:flex-row">
      <Button type="submit" className="h-auto min-h-11 whitespace-normal px-6 py-2 hover:bg-teal-800">Taikyti filtrus</Button>
      <Button type="button" variant="ghost" className="h-auto min-h-11 whitespace-normal px-4 py-2" onClick={() => {
        ["verified", "rating", "vehicle", "nonRunning"].forEach((key) => params.delete(key))
        writeDate(params, { type: "anytime" })
        apply(params)
      }}>Išvalyti filtrus</Button>
    </div>
  </form>
}
