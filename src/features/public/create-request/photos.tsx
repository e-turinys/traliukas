import { useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { FieldError } from "./fields"
import { photoSelectionError } from "./logic"

export function VehiclePhotos({ files, onChange }: { files: File[]; onChange: (files: File[]) => void }) {
  const [error, setError] = useState<string>()
  const input = useRef<HTMLInputElement>(null)
  return <div className="space-y-3">
    <Label htmlFor="request-photos">Automobilio nuotraukos (neprivaloma)</Label>
    <p id="photos-hint" className="text-sm text-muted-foreground">Iki 5 nuotraukų, po 10 MB. JPG, PNG, WebP arba HEIC. Nuotraukos tik pasirenkamos šiame puslapyje; jos dar neišsiųstos.</p>
    <Button type="button" variant="outline" className="min-h-11 w-full" aria-describedby={`photos-hint${error ? " request-photos-error" : ""}`} onClick={() => input.current?.click()}>Pasirinkti nuotraukas</Button>
    <input ref={input} id="request-photos" type="file" multiple accept="image/jpeg,image/png,image/webp,image/heic,image/heif" hidden tabIndex={-1} aria-invalid={!!error} aria-describedby={`photos-hint${error ? " request-photos-error" : ""}`} onChange={e => {
      const selected = Array.from(e.target.files ?? [])
      const issue = photoSelectionError(selected, files.length)
      setError(issue)
      if (!issue) onChange([...files, ...selected])
      e.target.value = ""
    }} />
    <FieldError id="request-photos" error={error} />
    {files.length > 0 && <ul className="space-y-2">{files.map((file, index) => <li key={`${file.name}-${index}`} className="flex min-w-0 items-center justify-between gap-3 rounded-lg border px-3">
      <span className="min-w-0 break-all text-sm">{file.name}</span>
      <Button type="button" variant="ghost" className="min-h-11" aria-label={`Pašalinti nuotrauką ${file.name}`} onClick={() => { onChange(files.filter((_, i) => i !== index)); setError(undefined) }}>Pašalinti</Button>
    </li>)}</ul>}
  </div>
}
