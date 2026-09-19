import { useRef, useState } from "react"
import { ImagePlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { FieldError } from "./fields"
import { photoSelectionError } from "./logic"

export function VehiclePhotos({ id, files, onChange, externalError, marketplace = false }: { id: string; files: File[]; onChange: (files: File[]) => void; externalError?: string; marketplace?: boolean }) {
  const [error, setError] = useState<string>()
  const input = useRef<HTMLInputElement>(null)
  const issue = error ?? externalError
  return <div className={marketplace ? "space-y-3 border-t pt-4" : "space-y-3"}>
    <Label htmlFor={id}>Automobilio nuotraukos (neprivaloma)</Label>
    <p id={`${id}-hint`} className="text-sm text-muted-foreground">Iki 5 nuotraukų, po 10 MB. JPG, PNG, WebP arba HEIC. Nuotraukos tik pasirenkamos šiame puslapyje; jos dar neišsiųstos.</p>
    <Button type="button" variant="outline" className={marketplace ? "h-auto min-h-11 w-full px-4 py-3 whitespace-normal" : "min-h-11 w-full"} aria-describedby={`${id}-hint${issue ? ` ${id}-error` : ""}`} onClick={() => input.current?.click()}>{marketplace && <ImagePlus aria-hidden="true" />}Pasirinkti nuotraukas</Button>
    <input ref={input} id={id} type="file" multiple accept="image/jpeg,image/png,image/webp,image/heic,image/heif" hidden tabIndex={-1} aria-invalid={!!issue} aria-describedby={`${id}-hint${issue ? ` ${id}-error` : ""}`} onChange={e => {
      const selected = Array.from(e.target.files ?? [])
      const issue = photoSelectionError(selected, files.length)
      setError(issue)
      if (!issue) onChange([...files, ...selected])
      e.target.value = ""
    }} />
    <FieldError id={id} error={issue} />
    {files.length > 0 && <ul className="space-y-2">{files.map((file, index) => <li key={`${file.name}-${index}`} className="flex min-w-0 items-center justify-between gap-3 rounded-lg border px-3">
      <span className="min-w-0 break-all text-sm">{file.name}</span>
      <Button type="button" variant="ghost" className="min-h-11" aria-label={`Pašalinti nuotrauką ${file.name}`} onClick={() => { onChange(files.filter((_, i) => i !== index)); setError(undefined) }}>Pašalinti</Button>
    </li>)}</ul>}
  </div>
}
