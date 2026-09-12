"use client"

import { CalendarDays } from "lucide-react"
import { lt } from "react-day-picker/locale"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type {
  DateWindowValue,
  FlexibleDateOption,
} from "@/lib/types/date-window"

type DateWindowPickerProps = {
  id: string
  label: string
  value: DateWindowValue
  onValueChange: (value: DateWindowValue) => void
  invalid?: boolean
  describedBy?: string
}

const dateFormatter = new Intl.DateTimeFormat("lt-LT", {
  month: "short",
  day: "numeric",
})

function getDisplayValue(value: DateWindowValue) {
  switch (value.type) {
    case "single":
      return value.date ? dateFormatter.format(value.date) : "Pasirinkite datą"

    case "range":
      if (value.from && value.to) {
        return `${dateFormatter.format(value.from)} – ${dateFormatter.format(
          value.to
        )}`
      }

      if (value.from) {
        return `Nuo ${dateFormatter.format(value.from)}`
      }

      return "Pasirinkite intervalą"

    case "flexible":
      switch (value.option) {
        case "next-week":
          return "Artimiausia savaitė"
        case "next-two-weeks":
          return "Artimiausios 2 savaitės"
        case "this-month":
          return "Šį mėnesį"
        default:
          return "Lanksti data"
      }

    default:
      return "Bet kada"
  }
}

export function DateWindowPicker({
  id,
  label,
  value,
  onValueChange,
  invalid = false,
  describedBy,
}: DateWindowPickerProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>

      <Popover>
        <PopoverTrigger
          render={
            <Button
              id={id}
              type="button"
              aria-invalid={invalid}
              aria-describedby={describedBy}
              variant="outline"
              className="min-h-11 w-full justify-start font-normal"
            />
          }
        >
          <CalendarDays className="mr-2 size-4 text-muted-foreground" />
          {getDisplayValue(value)}
        </PopoverTrigger>

        <PopoverContent className="w-auto max-w-[calc(100vw-2rem)] p-4" align="start" aria-label={label}>
          <RadioGroup
            aria-label="Datos pasirinkimas"
            value={value.type}
            onValueChange={(nextType) => {
              switch (nextType) {
                case "single":
                  onValueChange({ type: "single" })
                  break
                case "range":
                  onValueChange({ type: "range" })
                  break
                case "flexible":
                  onValueChange({ type: "flexible" })
                  break
                default:
                  onValueChange({ type: "anytime" })
              }
            }}
            className="mb-4 grid gap-3"
          >
            <label className="flex cursor-pointer items-center gap-2">
              <RadioGroupItem value="anytime" />
              <span className="text-sm">Bet kada</span>
            </label>

            <label className="flex cursor-pointer items-center gap-2">
              <RadioGroupItem value="single" />
              <span className="text-sm">Konkreti data</span>
            </label>

            <label className="flex cursor-pointer items-center gap-2">
              <RadioGroupItem value="range" />
              <span className="text-sm">Datos intervalas</span>
            </label>

            <label className="flex cursor-pointer items-center gap-2">
              <RadioGroupItem value="flexible" />
              <span className="text-sm">Lanksti data</span>
            </label>
          </RadioGroup>

          {value.type === "single" && (
            <Calendar
              locale={lt}
              mode="single"
              selected={value.date}
              onSelect={(date) =>
                onValueChange({
                  type: "single",
                  date,
                })
              }
            />
          )}

          {value.type === "range" && (
            <Calendar
              locale={lt}
              mode="range"
              selected={{
                from: value.from,
                to: value.to,
              }}
              onSelect={(range) =>
                onValueChange({
                  type: "range",
                  from: range?.from,
                  to: range?.to,
                })
              }
            />
          )}

          {value.type === "flexible" && (
            <Select
              value={value.option}
              onValueChange={(option) =>
                onValueChange({
                  type: "flexible",
                  option: option as FlexibleDateOption,
                })
              }
            >
              <SelectTrigger className="w-full" aria-label="Lankstus laikotarpis">
                <SelectValue placeholder="Pasirinkite laikotarpį" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="next-week">
                  Artimiausia savaitė
                </SelectItem>
                <SelectItem value="next-two-weeks">
                  Artimiausios 2 savaitės
                </SelectItem>
                <SelectItem value="this-month">Šį mėnesį</SelectItem>
              </SelectContent>
            </Select>
          )}
        </PopoverContent>
      </Popover>
    </div>
  )
}
