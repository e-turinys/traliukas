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
    <Card className="overflow-visible border border-border py-6 shadow-sm ring-0">
      <CardContent className="px-4 sm:px-6">
        <form noValidate onSubmit={handleSubmit} aria-label={copy.search} className="space-y-4">
          <div className="grid items-start gap-4 md:grid-cols-2 xl:grid-cols-4">
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
            <div className="min-w-0 space-y-2 [&_button]:flex">
              <DateWindowPicker
                id={`${id}-date`} label={copy.date} value={date} onValueChange={setDate}
                invalid={submitted && !!errors.date}
                describedBy={submitted && errors.date ? `${id}-date-error` : undefined}
              />
              {submitted && errors.date && (
                <p id={`${id}-date-error`} role="alert" className="text-sm text-destructive">{errors.date}</p>
              )}
            </div>
            <div className="space-y-2">
              <span aria-hidden="true" className="hidden text-sm leading-none md:block">&nbsp;</span>
              <Button type="submit" disabled={!!errors.from || !!errors.to} className="h-auto min-h-11 w-full gap-2 whitespace-normal px-6 py-2 hover:bg-teal-800"><Search aria-hidden="true" />{copy.search}</Button>
            </div>
          </div>
          <div className="flex flex-col gap-3 border-t pt-4 md:flex-row md:items-center md:justify-between">
            <p id={`${id}-hint`} className="text-sm leading-relaxed text-muted-foreground">{copy.hint}</p>
            <Button type="button" variant="ghost" className="h-auto min-h-11 w-full whitespace-normal px-4 py-3 text-primary hover:text-primary md:w-auto" onClick={() => navigate("/request/new")}>{copy.offers}</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
