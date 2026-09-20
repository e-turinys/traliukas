import Image from "next/image"
import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { requestCategories } from "../create-request/model"
import { dateLabel } from "../search-query"
import { formatCountry } from "@/lib/format-country"
import type { RequestDetail } from "./model"
import { vehicleRouteLabel } from "../request-route-summary"

function LocalPhoto({ file }: { file: File }) {
  const [url, setUrl] = useState<string>()
  const [failed, setFailed] = useState(false)
  useEffect(() => {
    const reader = new FileReader()
    reader.onload = () => setUrl(String(reader.result))
    reader.onerror = () => setFailed(true)
    reader.readAsDataURL(file)
    return () => { reader.onload = null; reader.onerror = null; if (reader.readyState === FileReader.LOADING) reader.abort() }
  }, [file])
  return <li className="min-w-0 space-y-2">
    {url && !failed && <Image unoptimized src={url} width={320} height={200} alt={`Automobilio nuotrauka: ${file.name}`} onError={() => setFailed(true)} className="h-40 w-full rounded-lg object-contain" />}
    <p className="break-all text-sm">{file.name}</p>
  </li>
}

export function RequestDetails({ request }: { request: RequestDetail }) {
  const { route } = request
  const hasVehicleRouteOverride = request.vehicles.some(vehicle =>
    vehicle.pickupLocation?.id !== route.from?.id || vehicle.deliveryLocation?.id !== route.to?.id)
  const rows = [
    [hasVehicleRouteOverride ? "Numatytasis maršrutas" : "Pagrindinis maršrutas", route.from && route.to ? `${route.from.city}, ${formatCountry(route.from.country)} → ${route.to.city}, ${formatCountry(route.to.country)}` : "—"],
    ["Paėmimo laikas", dateLabel(route.date)],
  ]
  return <Card className="min-w-0 border py-0 shadow-none ring-0"><CardContent className="space-y-6 p-4 sm:p-6">
    <h2 className="text-xl font-semibold">Užklausos duomenys</h2>
    <dl className="grid gap-4 text-sm sm:grid-cols-2">{rows.map(([label, value]) => <div key={label} className="min-w-0 space-y-1"><dt className="text-muted-foreground">{label}</dt><dd className="break-words">{value}</dd></div>)}</dl>
    <section className="space-y-4 border-t pt-4" aria-labelledby="request-vehicles-heading">
      <h3 id="request-vehicles-heading" className="font-semibold">Automobiliai ({request.vehicles.length})</h3>
      <div className="space-y-4">{request.vehicles.map((vehicle, index) => <article key={vehicle.id} className="space-y-3 rounded-lg border bg-background p-4">
        <h4 className="font-medium">Automobilis {index + 1}: {vehicle.make} {vehicle.model}</h4>
        <p className="text-sm font-medium text-primary">{vehicleRouteLabel(vehicle)}</p>
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div><dt className="text-muted-foreground">Kategorija</dt><dd>{vehicle.category ? requestCategories[vehicle.category] : "—"}</dd></div>
          {vehicle.year && <div><dt className="text-muted-foreground">Metai</dt><dd>{vehicle.year}</dd></div>}
          <div><dt className="text-muted-foreground">Būklė</dt><dd>{vehicle.condition === "running" ? "Važiuojantis" : "Nevažiuojantis"}</dd></div>
          {vehicle.condition === "non-running" && <div><dt className="text-muted-foreground">Ar automobilis rieda?</dt><dd>{{ yes: "Taip", no: "Ne", unknown: "Nežinoma", "": "Nenurodyta" }[vehicle.rolls]}</dd></div>}
        </dl>
        {vehicle.photos.length > 0 && <div className="space-y-3"><h5 className="text-sm font-medium">Nuotraukos</h5><ul className="grid gap-4 sm:grid-cols-2">{vehicle.photos.map((file, photoIndex) => <LocalPhoto key={`${file.name}-${photoIndex}`} file={file} />)}</ul></div>}
      </article>)}</div>
    </section>
    <div className="space-y-2 border-t pt-4"><h3 className="font-medium">Informacija vežėjui</h3><p className="whitespace-pre-wrap break-words text-sm">{request.notes || "Papildomos informacijos nėra."}</p></div>
  </CardContent></Card>
}
