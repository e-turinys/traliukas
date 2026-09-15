import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="min-w-0"><dt className="text-muted-foreground">{label}</dt><dd className="break-words">{children}</dd></div>
}

export function AttentionCard({ item }: { item: DashboardAttentionItem }) {
  return <Card className="min-w-0 border-primary/30 shadow-sm">
    <CardHeader>
      <div className="flex flex-wrap gap-2">
        <Badge>{item.updated ? "Atnaujintas pasiūlymas" : "Naujas pasiūlymas"}</Badge>
        <Badge variant="outline">{item.status}</Badge>
      </div>
      <CardTitle className="mt-2 break-words text-lg">{item.route}</CardTitle>
    </CardHeader>
    <CardContent className="space-y-4">
      <dl className="grid gap-3 text-sm sm:grid-cols-2">
        <Detail label="Automobilis">{item.vehicle}</Detail>
        <Detail label="Laukia sprendimo">{offerCount(item.actionableOfferCount)}</Detail>
      </dl>
      <Button nativeButton={false} render={<Link href={`/requests/${encodeURIComponent(item.id)}`} />} className="h-auto min-h-11 w-full whitespace-normal py-3">
        Peržiūrėti pasiūlymus
      </Button>
    </CardContent>
  </Card>
}

export function RequestCard({ item }: { item: DashboardRequestItem }) {
  return <Card className="min-w-0">
    <CardHeader>
      <Badge variant="secondary">{item.status}</Badge>
      <CardTitle className="mt-2 break-words text-lg">{item.route}</CardTitle>
    </CardHeader>
    <CardContent className="space-y-4">
      <dl className="grid gap-3 text-sm sm:grid-cols-2">
        <Detail label="Automobilis">{item.vehicle}</Detail>
        <Detail label="Pageidaujamas paėmimas">{item.requestedDate}</Detail>
        <Detail label="Matomumas">{item.visibility}</Detail>
        <Detail label="Pasiūlymai">{item.offerCount ? offerCount(item.offerCount) : "Pasiūlymų dar nėra"}</Detail>
      </dl>
      <Button variant="outline" nativeButton={false} render={<Link href={`/requests/${encodeURIComponent(item.id)}`} />} className="h-auto min-h-11 w-full whitespace-normal py-3">
        Peržiūrėti užklausą
      </Button>
    </CardContent>
  </Card>
}

export function TransportCard({ item }: { item: DashboardTransportItem }) {
  return <Card className="min-w-0">
    <CardHeader>
      <Badge>{item.status}</Badge>
      <CardTitle className="mt-2 break-words text-lg">{item.route}</CardTitle>
    </CardHeader>
    <CardContent className="space-y-4">
      <dl className="grid gap-3 text-sm sm:grid-cols-2">
        <Detail label="Automobilis">{item.vehicle}</Detail>
        <Detail label="Pasirinktas vežėjas">{item.carrier}</Detail>
        <Detail label="Paėmimas">{item.pickupDate}</Detail>
        <Detail label="Planuojamas pristatymas">{item.deliveryDate}</Detail>
      </dl>
      <Button nativeButton={false} render={<Link href={`/bookings/${encodeURIComponent(item.bookingId)}`} />} className="h-auto min-h-11 w-full whitespace-normal py-3">
        Atidaryti pervežimą
      </Button>
    </CardContent>
  </Card>
}

export function HistoryCard({ item }: { item: DashboardHistoryItem }) {
  return <Card className="min-w-0 bg-muted/20">
    <CardHeader>
      <Badge variant="secondary">{item.status}</Badge>
      <CardTitle className="mt-2 break-words text-lg">{item.route}</CardTitle>
    </CardHeader>
    <CardContent className="space-y-4">
      <dl className="grid gap-3 text-sm sm:grid-cols-2">
        <Detail label="Automobilis">{item.vehicle}</Detail>
        <Detail label={item.dateLabel}>{item.date}</Detail>
        {item.carrier && <Detail label="Vežėjas">{item.carrier}</Detail>}
      </dl>
      <Button variant="outline" nativeButton={false} render={<Link href={`/requests/${encodeURIComponent(item.id)}`} />} className="h-auto min-h-11 w-full whitespace-normal py-3">
        Peržiūrėti informaciją
      </Button>
    </CardContent>
  </Card>
}
