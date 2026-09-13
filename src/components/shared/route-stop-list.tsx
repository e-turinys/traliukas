import type { LocationOption } from "@/lib/types/location"
import { formatCountry } from "@/lib/format-country"

export function RouteStopList({ stops }: { stops: LocationOption[] }) {
  return <ol className="space-y-0">
    {stops.map((stop, index) => <li key={`${stop.id}-${index}`} className="relative flex gap-4 pb-6 last:pb-0">
      {index < stops.length - 1 && <span aria-hidden="true" className="absolute top-8 bottom-0 left-4 border-l" />}
      <span aria-hidden="true" className="relative flex size-8 shrink-0 items-center justify-center rounded-full border bg-background text-sm font-medium">{index + 1}</span>
      <div className="space-y-1">
        <p className="font-medium">{stop.city}</p>
        <p className="text-sm text-muted-foreground">{index === 0 ? "Maršruto pradžia" : index === stops.length - 1 ? "Maršruto pabaiga" : "Tarpinis sustojimas"} · {formatCountry(stop.country)}</p>
      </div>
    </li>)}
  </ol>
}
