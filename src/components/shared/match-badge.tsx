import { Badge } from "@/components/ui/badge"
import type { MatchLevel } from "@/lib/types/carrier-route"

const labels: Record<MatchLevel, string> = {
  excellent: "Puikiai tinka",
  good: "Gerai tinka",
  possible: "Galimas variantas",
}

export function MatchBadge({ level }: { level: MatchLevel }) {
  return <Badge variant={level === "possible" ? "outline" : "secondary"}>{labels[level]}</Badge>
}
