"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { Menu } from "lucide-react"

import { Button, buttonVariants } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet"
import { PageContainer } from "@/components/layout/page-container"
import { LoginLink } from "@/components/layout/login-link"
import { cn } from "@/lib/utils"
import { createBrowserSupabaseClient } from "@/lib/supabase/client"
import { hasSupabaseEnvironment } from "@/lib/supabase/env"

const navigation = [
  {
    label: "Rasti vežėją",
    href: "/search",
  },
  {
    label: "Vežėjams",
    href: "/carrier",
  },
]

export function PublicHeader() {
  const pathname = usePathname()
  const router = useRouter()
  const [account, setAccount] = useState<"loading" | "anonymous" | "customer" | "carrier" | "unknown">(hasSupabaseEnvironment() ? "loading" : "anonymous")
  const [loggingOut, setLoggingOut] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!hasSupabaseEnvironment()) return
    const client = createBrowserSupabaseClient()
    let disposed = false
    let version = 0
    let timer: ReturnType<typeof setTimeout>
    async function refresh() {
      const current = ++version
      try {
        const { data, error } = await client.auth.getUser()
        if (disposed || current !== version) return
        if (!data.user) { setAccount(error && error.name !== "AuthSessionMissingError" ? "unknown" : "anonymous"); return }
        const carriers = await client.from("my_carriers").select("id").limit(1)
        if (!disposed && current === version) setAccount(carriers.error ? "unknown" : carriers.data.length ? "carrier" : "customer")
      } catch {
        if (!disposed && current === version) setAccount("unknown")
      }
    }
    void refresh()
    const { data: { subscription } } = client.auth.onAuthStateChange(event => {
      // Run Auth reads after the callback releases the client's Auth lock.
      ++version
      clearTimeout(timer)
      if (event === "SIGNED_OUT") setAccount("anonymous")
      else timer = setTimeout(() => void refresh(), 0)
    })
    window.addEventListener("focus", refresh)
    return () => { disposed = true; ++version; clearTimeout(timer); subscription.unsubscribe(); window.removeEventListener("focus", refresh) }
  }, [pathname])

  async function logout() {
    setLoggingOut(true); setError("")
    try {
      const { error } = await createBrowserSupabaseClient().auth.signOut({ scope: "local" })
      if (error) throw error
      router.replace("/")
      router.refresh()
      setLoggingOut(false)
    } catch {
      setError("Nepavyko atsijungti. Bandykite dar kartą.")
      setLoggingOut(false)
    }
  }

  function accountActions(mobile = false) {
    const className = cn(buttonVariants({ variant: "outline" }), "h-auto min-h-11 whitespace-normal px-4 py-2", mobile && "mt-4")
    if (account === "loading") return <span role="status" className="min-h-11 px-4 py-2 text-sm text-muted-foreground">Tikrinama paskyra…</span>
    if (account === "anonymous") return <LoginLink closeSheet={mobile} className={className}>Prisijungti</LoginLink>
    const link = <Link href={account === "carrier" ? "/carrier/bookings" : account === "customer" ? "/dashboard" : "/login"} className={className}>{account === "carrier" ? "Mano pervežimai" : account === "customer" ? "Mano užklausos" : "Mano paskyra"}</Link>
    return <>
      {mobile ? <SheetClose nativeButton={false} render={link} /> : link}
      <Button variant="ghost" className="h-auto min-h-11 whitespace-normal px-4 py-2" disabled={loggingOut} onClick={() => void logout()}>{loggingOut ? "Atsijungiama…" : "Atsijungti"}</Button>
      {error && <p role="alert" className="max-w-xs text-sm text-destructive">{error}</p>}
    </>
  }

  return (
    <header className="border-b bg-white">
      <PageContainer className="flex min-h-16 items-center justify-between gap-6 py-2">
        <Link
          href="/"
          className="rounded-md text-2xl font-semibold tracking-tight text-teal-700 outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
          aria-label="Parvezk.lt pradinis puslapis"
        >
          parvezk.lt
        </Link>

        <nav
          className="hidden items-center gap-6 md:flex"
          aria-label="Pagrindinė navigacija"
        >
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex min-h-11 items-center rounded-md text-sm font-medium text-muted-foreground transition-colors hover:text-teal-700 focus-visible:outline-2 focus-visible:outline-teal-600"
            >
              {item.label}
            </Link>
          ))}

          {accountActions()}
        </nav>

        <div className="md:hidden">
          <Sheet>
            <SheetTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-11"
                  aria-label="Atidaryti navigaciją"
                />
              }
            >
              <Menu />
            </SheetTrigger>

            <SheetContent side="right">
              <SheetHeader>
                <SheetTitle>parvezk.lt</SheetTitle>
              </SheetHeader>

              <nav
                className="mt-6 flex flex-col gap-2 px-4 pb-6"
                aria-label="Mobilioji navigacija"
              >
                {navigation.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      buttonVariants({ variant: "ghost" }),
                      "h-auto min-h-11 justify-start whitespace-normal px-4 py-3"
                    )}
                  >
                    {item.label}
                  </Link>
                ))}

                {accountActions(true)}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </PageContainer>
    </header>
  )
}
