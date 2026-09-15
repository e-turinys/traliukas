import Image from "next/image"
import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { requestCategories } from "../create-request/model"
import { dateLabel } from "../search-query"
import { formatCountry } from "@/lib/format-country"
import type { RequestDetail } from "./model"

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
  const { route, vehicle } = request
  const rows = [
    ["Paėmimo vieta", route.from ? `${route.from.city}, ${formatCountry(route.from.country)}` : "—"],
    ["Pristatymo vieta", route.to ? `${route.to.city}, ${formatCountry(route.to.country)}` : "—"],
    ["Paėmimo laikas", dateLabel(route.date)],
    ["Kategorija", vehicle.category ? requestCategories[vehicle.category] : "—"],
    ["Markė ir modelis", `${vehicle.make} ${vehicle.model}`],
    ...(vehicle.year ? [["Metai", vehicle.year]] : []),
    ["Būklė", vehicle.condition === "running" ? "Važiuojantis" : "Nevažiuojantis"],
    ...(vehicle.condition === "non-running" ? [["Ar automobilis rieda?", { yes: "Taip", no: "Ne", unknown: "Nežinoma", "": "Nenurodyta" }[vehicle.rolls]]] : []),
  ]
  return <Card className="min-w-0"><CardContent className="space-y-5">
    <h2 className="text-xl font-semibold">Užklausos duomenys</h2>
    <dl className="grid gap-4 text-sm sm:grid-cols-2">{rows.map(([label, value]) => <div key={label} className="min-w-0 space-y-1"><dt className="text-muted-foreground">{label}</dt><dd className="break-words">{value}</dd></div>)}</dl>
    <div className="space-y-2 border-t pt-4"><h3 className="font-medium">Informacija vežėjui</h3><p className="whitespace-pre-wrap break-words text-sm">{request.notes || "Papildomos informacijos nėra."}</p></div>
    {request.photos.length > 0 && <div className="space-y-3"><h3 className="font-medium">Automobilio nuotraukos</h3><ul className="grid gap-4 sm:grid-cols-2">{request.photos.map((file, index) => <LocalPhoto key={`${file.name}-${index}`} file={file} />)}</ul></div>}
  </CardContent></Card>
}
