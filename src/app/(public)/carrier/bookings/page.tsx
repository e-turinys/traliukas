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

export default async function CarrierBookingsPage() {
  const client = await marketplaceClient()
  // Existing commitments remain visible when new-offer eligibility expires.
  // Participant RLS, live-session checks and command authorization still apply.
  const bookings = client ? (await readPages((a, b) => client.from("bookings").select("*")
    .eq("viewer_side", "carrier").order("created_at", { ascending: false }).order("id").range(a, b))).map(bookingProjection) : []
  return <PageContainer className="space-y-6 py-8">
    <Link href="/carrier/routes" className="inline-flex min-h-11 items-center text-sm underline">Grįžti į maršrutus</Link>
    <h1 className="text-3xl font-semibold">Mano pervežimai</h1>
    {!client ? <Button nativeButton={false} render={<Link href="/login?returnTo=%2Fcarrier%2Fbookings" />}>Prisijungti</Button> : !bookings.length ? <p>Pervežimų dar nėra.</p> : <ul className="grid gap-4 sm:grid-cols-2">
      {bookings.map(booking => <li key={booking.id} className="min-w-0 space-y-3 rounded-xl border bg-card p-6">
        <p className="text-sm text-muted-foreground">{bookingStatusLabel(booking.status, booking.vehicles.length)}</p>
        <h2 className="break-words text-xl font-semibold">{requestRouteSummary(booking.vehicles).compact}</h2>
        <p>{vehicleCountLabel(booking.vehicles.length)}</p>
        <Button nativeButton={false} variant="outline" render={<Link href={`/bookings/${booking.id}`} />} className="min-h-11">Atidaryti pervežimą</Button>
      </li>)}
    </ul>}
  </PageContainer>
}
