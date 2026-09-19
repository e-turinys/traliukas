import type { ComponentProps } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

export function FieldError({ id, error }: { id: string; error?: string }) {
  return error ? <p id={`${id}-error`} role="alert" className="text-sm text-destructive">{error}</p> : null
}

export function TextField({ id, label, error, ...props }: ComponentProps<typeof Input> & { id: string; label: string; error?: string }) {
  return <div className="min-w-0 space-y-2">
    <Label htmlFor={id}>{label}</Label>
    <Input {...props} id={id} className="min-h-11" aria-invalid={!!error} aria-describedby={error ? `${id}-error` : undefined} />
    <FieldError id={id} error={error} />
  </div>
}

export function Choices({ id, label, value, options, onChange, error, marketplace = false }: { id: string; label: string; value: string; options: Record<string, string>; onChange: (value: string) => void; error?: string; marketplace?: boolean }) {
  return <fieldset className="min-w-0 space-y-3">
    <legend id={`${id}-label`} className="text-sm font-medium">{label}</legend>
    <RadioGroup id={id} value={value} onValueChange={onChange} aria-labelledby={`${id}-label`} aria-required="true" aria-invalid={!!error} aria-describedby={error ? `${id}-error` : undefined} className={`grid gap-2 ${marketplace ? "sm:grid-cols-2" : ""}`}>
      {Object.entries(options).map(([key, text]) => <label key={key} className={`flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border p-3 text-sm has-[[data-checked]]:border-primary ${marketplace ? "bg-white has-[[data-checked]]:bg-secondary has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring" : ""}`}>
        <RadioGroupItem value={key} /><span>{text}</span>
      </label>)}
    </RadioGroup>
    <FieldError id={id} error={error} />
  </fieldset>
}
