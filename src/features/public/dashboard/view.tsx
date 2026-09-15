"use client"

import Link from "next/link"
import { Inbox } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AttentionCard, HistoryCard, RequestCard, TransportCard } from "./cards"
import type { DashboardViewModel } from "./model"

function TabEmpty({ children }: { children: React.ReactNode }) {
  return <Card className="bg-muted/20"><CardContent className="py-6 text-center text-muted-foreground">{children}</CardContent></Card>
}

function WholeDashboardEmpty() {
  return <Card className="max-w-xl">
    <CardContent className="space-y-4 py-6">
      <Inbox aria-hidden="true" className="size-7 text-muted-foreground" />
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Čia dar nieko nėra</h2>
        <p className="text-muted-foreground">Sukurkite pirmą pervežimo užklausą ir gaukite vežėjų pasiūlymus.</p>
      </div>
      <Button nativeButton={false} render={<Link href="/request/new" />} className="h-auto min-h-11 w-full whitespace-normal py-3 sm:w-auto">
        Sukurti užklausą
      </Button>
    </CardContent>
  </Card>
}

export function DashboardView({ dashboard }: { dashboard: DashboardViewModel }) {
  return <div className="mx-auto max-w-6xl space-y-8">
    <header className="flex flex-col items-start gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Mano užklausos ir pervežimai</h1>
        <p className="max-w-2xl text-muted-foreground">Peržiūrėkite užklausas, pasirinktus pervežimus ir ankstesnę veiklą.</p>
      </div>
      <Button nativeButton={false} render={<Link href="/request/new" />} className="h-auto min-h-11 w-full whitespace-normal py-3 sm:w-auto">
        Sukurti naują užklausą
      </Button>
    </header>

    {dashboard.attention.length > 0 && <section aria-labelledby="attention-heading" className="space-y-4">
      <div className="space-y-1">
        <h2 id="attention-heading" className="text-2xl font-semibold">Reikia dėmesio</h2>
        <p className="text-sm text-muted-foreground">Šios užklausos turi pasiūlymų, kuriuos galite peržiūrėti.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">{dashboard.attention.map(item => <AttentionCard key={item.id} item={item} />)}</div>
    </section>}

    {dashboard.empty ? <WholeDashboardEmpty /> : <Tabs defaultValue={dashboard.defaultTab} className="gap-5">
      <TabsList aria-label="Paskyros skiltys" className="grid h-auto min-h-11 w-full grid-cols-3 p-1 sm:w-fit sm:min-w-md">
        <TabsTrigger value="requests" className="min-h-11 px-2">Užklausos</TabsTrigger>
        <TabsTrigger value="transports" className="min-h-11 px-2">Pervežimai</TabsTrigger>
        <TabsTrigger value="history" className="min-h-11 px-2">Istorija</TabsTrigger>
      </TabsList>
      <TabsContent value="requests">
        <h2 className="sr-only">Aktyvios užklausos</h2>
        {dashboard.requests.length ? <div className="grid gap-4 md:grid-cols-2">{dashboard.requests.map(item => <RequestCard key={item.id} item={item} />)}</div> : <TabEmpty>Aktyvių užklausų nėra</TabEmpty>}
      </TabsContent>
      <TabsContent value="transports">
        <h2 className="sr-only">Aktyvūs pervežimai</h2>
        {dashboard.transports.length ? <div className="grid gap-4 md:grid-cols-2">{dashboard.transports.map(item => <TransportCard key={item.id} item={item} />)}</div> : <TabEmpty>Aktyvių pervežimų nėra</TabEmpty>}
      </TabsContent>
      <TabsContent value="history">
        <h2 className="sr-only">Istorija</h2>
        {dashboard.history.length ? <div className="grid gap-4 md:grid-cols-2">{dashboard.history.map(item => <HistoryCard key={item.id} item={item} />)}</div> : <TabEmpty>Istorija tuščia</TabEmpty>}
      </TabsContent>
    </Tabs>}
  </div>
}
