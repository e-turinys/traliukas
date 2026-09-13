import { BadgeCheck, Star } from "lucide-react"
import type { CarrierRoute } from "@/lib/types/carrier-route"
import { formatCount } from "@/lib/format-count"

export function CarrierTrust({ carrier }: { carrier: CarrierRoute["carrier"] }) {
  return <div className="space-y-2 text-sm">
    {carrier.verification === "approved" && <p className="flex items-center gap-2"><BadgeCheck aria-hidden="true" className="size-4 shrink-0" />Patvirtintas vežėjas</p>}
    {carrier.reviewCount > 0 && carrier.rating !== null ? (
      <p className="flex items-center gap-2"><Star aria-hidden="true" className="size-4 shrink-0" /><span>{carrier.rating.toLocaleString("lt-LT")} · {formatCount(carrier.reviewCount, { one: "atsiliepimas", few: "atsiliepimai", other: "atsiliepimų" })}</span></p>
    ) : <p>Naujas vežėjas</p>}
    {carrier.completedTransports > 0 && <p className="text-muted-foreground">{formatCount(carrier.completedTransports, { one: "užbaigtas pervežimas", few: "užbaigti pervežimai", other: "užbaigtų pervežimų" })}</p>}
  </div>
}
