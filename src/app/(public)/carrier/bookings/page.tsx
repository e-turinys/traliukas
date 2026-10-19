import Link from "next/link"
import { PageContainer } from "@/components/layout/page-container"
import { Button } from "@/components/ui/button"
import { marketplaceClient } from "@/features/public/marketplace-persistence/load"
import { bookingProjection } from "@/features/public/marketplace-persistence/adapter"
import { readPages } from "@/features/public/route-persistence/load"
import { bookingStatusLabel } from "@/features/public/booking-detail/logic"
import { requestRouteSummary } from "@/features/public/request-route-summary"
import { vehicleCountLabel } from "@/features/public/vehicle-summary"

export const dynamic = "force-dynamic"
export const metadata = { title: "Mano pervežimai", robots: { index: false, follow: false } }

export default async function CarrierBookingsPage({ searchParams }: {
  searchParams: Promise<{ tab?: string | string[] }>
}) {
  const { tab } = await searchParams
  const history = (Array.isArray(tab) ? tab[0] : tab) === "history"
  const client = await marketplaceClient()
  // Existing commitments remain visible when new-offer eligibility expires.
  // Participant RLS, live-session checks and command authorization still apply.
  const bookings = client ? (await readPages((a, b) => client.from("bookings").select("*")
    .eq("viewer_side", "carrier").order("created_at", { ascending: false }).order("id").range(a, b))).map(bookingProjection) : []
  const visibleBookings = bookings.filter(booking =>
    (booking.status === "completed" || booking.status === "cancelled") === history)
  return <PageContainer className="space-y-6 py-8">
    <Link href="/carrier/routes" className="inline-flex min-h-11 items-center text-sm underline">Grįžti į maršrutus</Link>
    <h1 className="text-3xl font-semibold">Mano pervežimai</h1>
    {!client ? <Button nativeButton={false} render={<Link href="/login?returnTo=%2Fcarrier%2Fbookings" />}>Prisijungti</Button> : <>
      <nav aria-label="Pervežimų skiltys" className="grid w-full grid-cols-2 gap-1 rounded-lg border bg-muted p-1 sm:w-fit">
        {[{ historic: false, label: "Aktyvūs pervežimai", href: "/carrier/bookings" }, { historic: true, label: "Istorija", href: "/carrier/bookings?tab=history" }].map(item => <Link key={item.href} href={item.href} aria-current={history === item.historic ? "page" : undefined} className={`flex min-h-11 items-center justify-center rounded-md px-3 py-2 text-center text-sm font-medium whitespace-normal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${history === item.historic ? "bg-background text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
          {item.label}
        </Link>)}
      </nav>
      {!visibleBookings.length ? <div className="space-y-2 rounded-xl border bg-card p-6">
        <h2 className="font-semibold">{history ? "Istorija tuščia" : "Aktyvių pervežimų nėra"}</h2>
        <p className="text-sm text-muted-foreground">{history ? "Čia matysite užbaigtus ir atšauktus pervežimus." : "Kai klientas priims jūsų pasiūlymą, pervežimą matysite čia."}</p>
      </div> : <ul className="grid gap-4 sm:grid-cols-2">
      {visibleBookings.map(booking => <li key={booking.id} className="min-w-0 space-y-3 rounded-xl border bg-card p-6">
        <p className="text-sm text-muted-foreground">{bookingStatusLabel(booking.status, booking.vehicles.length)}</p>
        <h2 className="break-words text-xl font-semibold">{requestRouteSummary(booking.vehicles).compact}</h2>
        <p>{vehicleCountLabel(booking.vehicles.length)}</p>
        <Button nativeButton={false} variant="outline" render={<Link href={`/bookings/${booking.id}`} />} className="min-h-11">Atidaryti pervežimą</Button>
      </li>)}
    </ul>}
    </>}
  </PageContainer>
}
