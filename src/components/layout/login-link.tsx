"use client"

import { Suspense, type ReactNode } from "react"
import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import { safeAuthReturnPath } from "@/lib/auth/validation"
import { SheetClose } from "@/components/ui/sheet"

type Props = { className: string; children: ReactNode; closeSheet?: boolean }

function SignInLink({ closeSheet, ...props }: Props & { href: string }) {
  return closeSheet ? <SheetClose nativeButton={false} render={<Link {...props} />} /> : <Link {...props} />
}

function ReturnLoginLink(props: Props) {
  const pathname = usePathname()
  const query = useSearchParams().toString()
  const returnTo = safeAuthReturnPath(`${pathname}${query ? `?${query}` : ""}`)
  return <SignInLink {...props} href={`/login?returnTo=${encodeURIComponent(returnTo)}`} />
}

export function LoginLink(props: Props) {
  return <Suspense fallback={<SignInLink {...props} href="/login" />}><ReturnLoginLink {...props} /></Suspense>
}
