import Link from "next/link"
import { ArrowRight, MessageSquare } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { formatCount } from "@/lib/format-count"
import type {
  DashboardAttentionItem,
  DashboardHistoryItem,
  DashboardRequestItem,
  DashboardTransportItem,
} from "./model"

const offerCount = (count: number) => formatCount(count, {
  one: "pasiūlymas", few: "pasiūlymai", other: "pasiūlymų",
})
const vehicleLabel = (count: number) => count === 1 ? "Automobilis" : "Automobiliai"

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="min-w-0 space-y-1"><dt className="text-muted-foreground">{label}</dt><dd className="break-words font-medium">{children}</dd></div>
}

function ItemHeader({ route, status }: { route: string; status: string }) {
  return <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
    <h3 data-slot="card-title" className="min-w-0 break-words text-xl leading-snug font-semibold">{route}</h3>
    <Badge variant="secondary" className="h-auto max-w-full whitespace-normal py-1">{status}</Badge>
  </CardHeader>
}

function DetailLink({ href, children }: { href: string; children: React.ReactNode }) {
  return <div className="flex border-t pt-4 sm:justify-end">
    <Button variant="outline" nativeButton={false} render={<Link href={href} />} className="h-auto min-h-11 w-full whitespace-normal py-3 sm:w-auto">
      {children}<ArrowRight aria-hidden="true" />
    </Button>
  </div>
}

export function AttentionCard({ item }: { item: DashboardAttentionItem }) {
  return <Card className="min-w-0 border border-primary/20 bg-card shadow-none ring-0 sm:py-6">
    <CardHeader>
      <p className="flex items-center gap-2 font-medium text-primary"><MessageSquare aria-hidden="true" className="size-4 shrink-0" />{item.updated ? "Atnaujintas pasiūlymas" : "Naujas pasiūlymas"}</p>
      <h3 data-slot="card-title" className="mt-2 break-words text-xl leading-snug font-semibold">{item.route}</h3>
      <p className="text-sm text-muted-foreground">{item.status}</p>
    </CardHeader>
    <CardContent className="space-y-4">
      <dl className="grid gap-3 text-sm sm:grid-cols-2">
        <Detail label={vehicleLabel(item.vehicleCount)}>{item.vehicle}</Detail>
        <Detail label="Laukia sprendimo">{offerCount(item.actionableOfferCount)}</Detail>
      </dl>
      <Button nativeButton={false} render={<Link href={`/requests/${encodeURIComponent(item.id)}`} />} className="h-auto min-h-11 w-full whitespace-normal py-3">
        Peržiūrėti pasiūlymus<ArrowRight aria-hidden="true" />
      </Button>
    </CardContent>
  </Card>
}

export function RequestCard({ item }: { item: DashboardRequestItem }) {
  return <Card className="min-w-0 border bg-card shadow-none ring-0 sm:py-6">
    <ItemHeader route={item.route} status={item.status} />
    <CardContent className="space-y-4">
      <dl className="grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
        <Detail label={vehicleLabel(item.vehicleCount)}>{item.vehicle}</Detail>
        <Detail label="Pageidaujamas paėmimas">{item.requestedDate}</Detail>
        <Detail label="Matomumas">{item.visibility}</Detail>
        <Detail label="Pasiūlymai">{item.offerCount ? offerCount(item.offerCount) : "Pasiūlymų dar nėra"}</Detail>
      </dl>
      <DetailLink href={`/requests/${encodeURIComponent(item.id)}`}>Peržiūrėti užklausą</DetailLink>
    </CardContent>
  </Card>
}

export function TransportCard({ item }: { item: DashboardTransportItem }) {
  return <Card className="min-w-0 border bg-card shadow-none ring-0 sm:py-6">
    <ItemHeader route={item.route} status={item.status} />
    <CardContent className="space-y-4">
      <dl className="grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
        <Detail label={vehicleLabel(item.vehicleCount)}>{item.vehicle}</Detail>
        <Detail label="Pasirinktas vežėjas">{item.carrier}</Detail>
        <Detail label="Paėmimas">{item.pickupDate}</Detail>
        <Detail label="Planuojamas pristatymas">{item.deliveryDate}</Detail>
      </dl>
      <DetailLink href={`/bookings/${encodeURIComponent(item.bookingId)}`}>Atidaryti pervežimą</DetailLink>
    </CardContent>
  </Card>
}

export function HistoryCard({ item }: { item: DashboardHistoryItem }) {
  return <Card className="min-w-0 border bg-card shadow-none ring-0 sm:py-6">
    <ItemHeader route={item.route} status={item.status} />
    <CardContent className="space-y-4">
      <dl className="grid gap-4 text-sm sm:grid-cols-3">
        <Detail label={vehicleLabel(item.vehicleCount)}>{item.vehicle}</Detail>
        <Detail label={item.dateLabel}>{item.date}</Detail>
        {item.carrier && <Detail label="Vežėjas">{item.carrier}</Detail>}
      </dl>
      <DetailLink href={`/requests/${encodeURIComponent(item.id)}`}>Peržiūrėti informaciją</DetailLink>
    </CardContent>
  </Card>
}
