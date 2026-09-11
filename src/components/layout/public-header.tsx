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
    <header className="border-b bg-background">
      <PageContainer className="flex h-16 items-center justify-between">
        <Link
          href="/"
          className="text-xl font-semibold tracking-tight"
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
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}

          <Link
            href="/login"
            className={buttonVariants({ variant: "outline" })}
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
                className="mt-8 flex flex-col gap-2"
                aria-label="Mobilioji navigacija"
              >
                {navigation.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      buttonVariants({ variant: "ghost" }),
                      "justify-start"
                    )}
                  >
                    {item.label}
                  </Link>
                ))}

                <Link
                  href="/login"
                  className={cn(
                    buttonVariants({ variant: "outline" }),
                    "mt-4"
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