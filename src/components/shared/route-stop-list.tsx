import type { LocationOption } from "@/lib/types/location"
import { formatCountry } from "@/lib/format-country"

export function RouteStopList({ stops }: { stops: LocationOption[] }) {
  return <ol className="space-y-0">
    {stops.map((stop, index) => <li key={`${stop.id}-${index}`} className="group flex gap-4">
      <div aria-hidden="true" className="flex shrink-0 flex-col items-center">
        <span className={`flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${index === 0 || index === stops.length - 1 ? "bg-secondary text-primary" : "border bg-background text-muted-foreground"}`}>{index + 1}</span>
        {index < stops.length - 1 && <span className="my-2 w-px flex-1 bg-border" />}
      </div>
      <div className="min-w-0 space-y-1 pb-6 group-last:pb-0">
        <p className={index === 0 || index === stops.length - 1 ? "text-lg font-semibold" : "font-medium text-muted-foreground"}>{stop.city}</p>
        <p className="text-sm text-muted-foreground">{index === 0 ? "Maršruto pradžia" : index === stops.length - 1 ? "Maršruto pabaiga" : "Tarpinis sustojimas"} · {formatCountry(stop.country)}</p>
      </div>
    </li>)}
  </ol>
}
