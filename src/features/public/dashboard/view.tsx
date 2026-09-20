"use client"

import Link from "next/link"
import { Check, Inbox, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AttentionCard, HistoryCard, RequestCard, TransportCard } from "./cards"
import type { DashboardViewModel } from "./model"

function TabEmpty({ children }: { children: React.ReactNode }) {
  return <Card className="border bg-card shadow-none ring-0"><CardContent className="py-4 text-center text-base text-muted-foreground">{children}</CardContent></Card>
}

function WholeDashboardEmpty() {
  return <Card className="border bg-card shadow-none ring-0 sm:py-6">
    <CardContent className="space-y-4 py-6">
      <Inbox aria-hidden="true" className="size-6 text-primary" />
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
    <header className="flex flex-col items-start gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="min-w-0 space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Mano užklausos ir pervežimai</h1>
        <p className="max-w-2xl text-muted-foreground">Peržiūrėkite užklausas, pasirinktus pervežimus ir ankstesnę veiklą.</p>
      </div>
      <Button nativeButton={false} render={<Link href="/request/new" />} className="h-auto min-h-11 w-full shrink-0 whitespace-normal py-3 sm:w-auto">
        <Plus aria-hidden="true" />Sukurti naują užklausą
      </Button>
    </header>

    {dashboard.attention.length > 0 && <section aria-labelledby="attention-heading" className="space-y-4">
      <div className="space-y-1">
        <h2 id="attention-heading" className="text-2xl font-semibold">Reikia dėmesio</h2>
        <p className="text-sm text-muted-foreground">Šios užklausos turi pasiūlymų, kuriuos galite peržiūrėti.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">{dashboard.attention.map(item => <AttentionCard key={item.id} item={item} />)}</div>
    </section>}
    {!dashboard.attention.length && <p className="flex items-center gap-3 text-sm text-muted-foreground"><Check aria-hidden="true" className="size-5 shrink-0 text-primary" />Šiuo metu nieko nereikia atlikti.</p>}

    {dashboard.empty ? <WholeDashboardEmpty /> : <Tabs defaultValue={dashboard.defaultTab} className="gap-5">
      <TabsList aria-label="Paskyros skiltys" className="grid h-auto w-full grid-cols-3 border bg-muted p-1 group-data-horizontal/tabs:h-auto sm:w-fit sm:min-w-md">
        <TabsTrigger value="requests" className="h-auto min-h-11 px-3 py-2 whitespace-normal after:hidden data-active:text-primary">Užklausos</TabsTrigger>
        <TabsTrigger value="transports" className="h-auto min-h-11 px-3 py-2 whitespace-normal after:hidden data-active:text-primary">Pervežimai</TabsTrigger>
        <TabsTrigger value="history" className="h-auto min-h-11 px-3 py-2 whitespace-normal after:hidden data-active:text-primary">Istorija</TabsTrigger>
      </TabsList>
      <TabsContent value="requests">
        <h2 className="sr-only">Aktyvios užklausos</h2>
        {dashboard.requests.length ? <div className="grid gap-4">{dashboard.requests.map(item => <RequestCard key={item.id} item={item} />)}</div> : <TabEmpty>Aktyvių užklausų nėra</TabEmpty>}
      </TabsContent>
      <TabsContent value="transports">
        <h2 className="sr-only">Aktyvūs pervežimai</h2>
        {dashboard.transports.length ? <div className="grid gap-4">{dashboard.transports.map(item => <TransportCard key={item.id} item={item} />)}</div> : <TabEmpty>Aktyvių pervežimų nėra</TabEmpty>}
      </TabsContent>
      <TabsContent value="history">
        <h2 className="sr-only">Istorija</h2>
        {dashboard.history.length ? <div className="grid gap-4">{dashboard.history.map(item => <HistoryCard key={item.id} item={item} />)}</div> : <TabEmpty>Istorija tuščia</TabEmpty>}
      </TabsContent>
    </Tabs>}
  </div>
}
