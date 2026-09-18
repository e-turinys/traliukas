import type { Metadata } from "next"
import { PageContainer } from "@/components/layout/page-container"
import { SearchResults } from "@/features/public/search-results"

export const metadata: Metadata = { title: "Vežėjų maršrutai" }

export default async function SearchPage({ searchParams }: PageProps<"/search">) {
  await searchParams
  // One date for server and hydration; flexible windows use the marketplace's Lithuanian calendar.
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Vilnius", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date())
  return <div className="marketplace-theme min-h-full bg-background text-foreground"><PageContainer className="py-8 sm:py-10"><SearchResults today={today} /></PageContainer></div>
}
