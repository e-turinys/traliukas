import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { findMockCarrierProfile } from "@/lib/mock/carrier-profiles"
import { mockCarrierRoutes } from "@/lib/mock/carrier-routes"
import { CarrierPublicProfile } from "@/features/public/carrier-profile"
import { activeCarrierRoutes, completedCarrierReviews } from "@/features/public/carrier-profile-context"

export async function generateMetadata({ params }: PageProps<"/carriers/[id]">): Promise<Metadata> {
  const { id } = await params
  const carrier = findMockCarrierProfile(id)
  if (!carrier) notFound()
  return { title: `${carrier.name} | Vežėjo profilis`, description: carrier.description }
}

export default async function CarrierPage({ params }: PageProps<"/carriers/[id]">) {
  const { id } = await params
  const carrier = findMockCarrierProfile(id)
  if (!carrier) notFound()
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Vilnius", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date())
  return <CarrierPublicProfile carrier={carrier} routes={activeCarrierRoutes(mockCarrierRoutes, id, today)} reviews={completedCarrierReviews(id)} />
}
