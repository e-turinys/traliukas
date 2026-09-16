import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { PageContainer } from "@/components/layout/page-container"
import { BookingDetailView } from "@/features/public/booking-detail/view"
import { serializeBooking } from "@/features/public/booking-detail/logic"
import { findMockBooking, listMockBookings } from "@/lib/mock/bookings"

export const metadata: Metadata = { title: "Pervežimo informacija", robots: { index: false, follow: false } }
export const dynamicParams = false

export function generateStaticParams() {
  return listMockBookings().map(booking => ({ id: booking.id }))
}

export default async function BookingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const booking = findMockBooking(id)
  if (!booking) notFound()
  return <PageContainer className="py-8 sm:py-12"><BookingDetailView key={id} initialBooking={serializeBooking(booking)} /></PageContainer>
}
