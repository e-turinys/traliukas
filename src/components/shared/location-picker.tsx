"use client"

import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox"
import { Label } from "@/components/ui/label"
import { mockLocations } from "@/lib/mock/locations"
import type { LocationOption } from "@/lib/types/location"

type LocationPickerProps = {
  id: string
  label: string
  value: LocationOption | null
  onValueChange: (value: LocationOption | null) => void
  placeholder?: string
  invalid?: boolean
}

export function LocationPicker({
  id,
  label,
  value,
  onValueChange,
  placeholder = "Pasirinkite vietą",
  invalid = false,
}: LocationPickerProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>

      <Combobox
        items={mockLocations}
        value={value}
        onValueChange={onValueChange}
        itemToStringValue={(location) => location.label}
      >
        <ComboboxInput
          id={id}
          placeholder={placeholder}
          aria-invalid={invalid}
          showClear
        />

        <ComboboxContent>
          <ComboboxEmpty>Vieta nerasta.</ComboboxEmpty>

          <ComboboxList>
            {(location) => (
              <ComboboxItem key={location.id} value={location}>
                <div className="flex flex-col">
                  <span>{location.city}</span>
                  <span className="text-xs text-muted-foreground">
                    {location.country}
                  </span>
                </div>
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </div>
  )
}