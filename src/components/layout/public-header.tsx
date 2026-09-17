import Link from "next/link"
import { Menu } from "lucide-react"

import { Button, buttonVariants } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { PageContainer } from "@/components/layout/page-container"
import { cn } from "@/lib/utils"

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

          <Link
            href="/login"
            className={cn(buttonVariants({ variant: "outline" }), "h-auto min-h-11 whitespace-normal px-4 py-2")}
          >
            Prisijungti
          </Link>
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

                <Link
                  href="/login"
                  className={cn(
                    buttonVariants({ variant: "outline" }),
                    "mt-4 h-auto min-h-11 whitespace-normal py-3"
                  )}
                >
                  Prisijungti
                </Link>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </PageContainer>
    </header>
  )
}
