"use client"

import { useId, useState, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import { Search } from "lucide-react"
import { LocationPicker } from "@/components/shared/location-picker"
import { DateWindowPicker } from "@/components/shared/date-window-picker"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import type { LocationOption } from "@/lib/types/location"
import type { DateWindowValue } from "@/lib/types/date-window"

const copy = {
  from: "Iš kur?",
  to: "Į kur?",
  date: "Kada?",
  search: "Rasti vežėją",
  offers: "Gauti vežėjų pasiūlymus",
  hint: "Pasirinkite paėmimo ir pristatymo vietas. Datos nurodyti nebūtina.",
  fromRequired: "Pasirinkite, iš kur reikia parvežti automobilį.",
  toRequired: "Pasirinkite, į kur reikia parvežti automobilį.",
  identical: "Išvykimo ir atvykimo vietos turi skirtis.",
  incompleteRange: "Pasirinkite intervalo pabaigą arba „Bet kada“.",
}

// Use local calendar fields: UTC conversion can shift the selected day.
function calendarDate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
}

function searchParams(from: LocationOption, to: LocationOption, date: DateWindowValue) {
  const params = new URLSearchParams({ from: from.id, to: to.id })
  if (date.type === "single" && date.date) {
    params.set("dateType", "single")
    params.set("date", calendarDate(date.date))
  } else if (date.type === "range" && date.from && date.to) {
    params.set("dateType", "range")
    params.set("dateFrom", calendarDate(date.from))
    params.set("dateTo", calendarDate(date.to))
  } else if (date.type === "flexible" && date.option) {
    params.set("dateType", "flexible")
    params.set("dateOption", date.option)
  }
  return params.toString()
}

export function HomeSearch() {
  const router = useRouter()
  const id = useId()
  const [from, setFrom] = useState<LocationOption | null>(null)
  const [to, setTo] = useState<LocationOption | null>(null)
  const [date, setDate] = useState<DateWindowValue>({ type: "anytime" })
  const [submitted, setSubmitted] = useState(false)
  const errors = {
    from: !from ? copy.fromRequired : undefined,
    to: !to ? copy.toRequired : from?.id === to.id ? copy.identical : undefined,
    date: date.type === "range" && date.from && !date.to ? copy.incompleteRange : undefined,
  }

  function navigate(destination: "/search" | "/request/new") {
    setSubmitted(true)
    const firstError = (["from", "to", "date"] as const).find((key) => errors[key])
    if (firstError) {
      document.getElementById(`${id}-${firstError}`)?.focus()
      return
    }
    if (from && to) router.push(`${destination}?${searchParams(from, to, date)}`)
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    navigate("/search")
  }

  return (
    <Card>
      <CardContent>
        <form noValidate onSubmit={handleSubmit} aria-label={copy.search} className="space-y-6">
          <p id={`${id}-hint`} className="text-sm text-muted-foreground">{copy.hint}</p>
          <div className="grid gap-5 md:grid-cols-3">
            {(["from", "to"] as const).map((key) => (
              <div key={key} className="min-w-0 space-y-2">
                <LocationPicker
                  id={`${id}-${key}`}
                  label={copy[key]}
                  value={key === "from" ? from : to}
                  onValueChange={key === "from" ? setFrom : setTo}
                  required
                  invalid={submitted && !!errors[key]}
                  describedBy={`${id}-hint${submitted && errors[key] ? ` ${id}-${key}-error` : ""}`}
                />
                {submitted && errors[key] && (
                  <p id={`${id}-${key}-error`} role="alert" className="text-sm text-destructive">{errors[key]}</p>
                )}
              </div>
            ))}
            <div className="min-w-0 space-y-2">
              <DateWindowPicker
                id={`${id}-date`} label={copy.date} value={date} onValueChange={setDate}
                invalid={submitted && !!errors.date}
                describedBy={submitted && errors.date ? `${id}-date-error` : undefined}
              />
              {submitted && errors.date && (
                <p id={`${id}-date-error`} role="alert" className="text-sm text-destructive">{errors.date}</p>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-3 md:flex-row">
            <Button type="submit" disabled={!!errors.from || !!errors.to} className="min-h-11 w-full px-5 md:w-auto"><Search aria-hidden="true" />{copy.search}</Button>
            <Button type="button" variant="outline" className="min-h-11 w-full px-5 md:w-auto" onClick={() => navigate("/request/new")}>{copy.offers}</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
