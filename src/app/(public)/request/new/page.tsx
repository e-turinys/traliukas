import type { Metadata } from "next"
import { PageContainer } from "@/components/layout/page-container"
import { CreateRequestWizard } from "@/features/public/create-request/wizard"

export const metadata: Metadata = { title: "Sukurti pervežimo užklausą" }

export default async function CreateRequestPage({ searchParams }: PageProps<"/request/new">) {
  const values = await searchParams
  const params = new URLSearchParams()
  // Only the public P01/P03 prefill contract crosses into the client wizard.
  for (const key of ["from", "to", "dateType", "date", "dateFrom", "dateTo", "dateFlexible", "dateOption", "visibility", "targetCarrier", "targetRoute", "review"]) {
    const value = values[key]
    if (typeof value === "string") params.set(key, value)
  }
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Vilnius", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date())
  return <div className="marketplace-theme bg-background text-foreground"><PageContainer className="py-6 sm:py-8 lg:pb-12"><CreateRequestWizard key={params.toString()} query={params.toString()} today={today} /></PageContainer></div>
}
