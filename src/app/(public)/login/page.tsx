import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { PageContainer } from "@/components/layout/page-container"
import { PhoneSignIn } from "@/features/public/sign-in/form"
import { safeAuthReturnPath } from "@/lib/auth/validation"
import { hasSupabaseEnvironment } from "@/lib/supabase/env"
import { createServerSupabaseClient } from "@/lib/supabase/server"

export const metadata: Metadata = { title: "Prisijungti", robots: { index: false, follow: false } }
export const dynamic = "force-dynamic"

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ returnTo?: string | string[] }> }) {
  const params = await searchParams
  const returnTo = safeAuthReturnPath(typeof params.returnTo === "string" ? params.returnTo : undefined)
  const configured = hasSupabaseEnvironment()
  if (configured) {
    const client = await createServerSupabaseClient()
    const { data, error } = await client.auth.getUser()
    if (!error && data.user) redirect(returnTo)
  }
  return <div className="marketplace-theme"><PageContainer className="space-y-6 py-8">
    <h1 className="text-3xl font-semibold">Prisijungti</h1>
    {configured ? <PhoneSignIn returnTo={returnTo} /> : <p role="status">Prisijungimas šiuo metu nepasiekiamas.</p>}
  </PageContainer></div>
}
