import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { findMockCarrierRoute } from "@/lib/mock/carrier-routes"
import { RouteDetail } from "@/features/public/route-detail"

export async function generateMetadata({ params }: PageProps<"/routes/[id]">): Promise<Metadata> {
  const { id } = await params
  const route = findMockCarrierRoute(id)
  if (!route) notFound()
  return { title: `${route.origin.city} → ${route.destination.city} | ${route.carrier.name}` }
}

export default async function RoutePage({ params }: PageProps<"/routes/[id]">) {
  const { id } = await params
  const route = findMockCarrierRoute(id)
  if (!route) notFound()
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Vilnius", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date())
  return <RouteDetail route={route} today={today} />
}
