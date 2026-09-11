import Link from "next/link"

import { PageContainer } from "@/components/layout/page-container"

const footerLinks = [
  {
    label: "Apie Parvezk.lt",
    href: "/about",
  },
  {
    label: "Vežėjams",
    href: "/carrier",
  },
  {
    label: "Pagalba",
    href: "/help",
  },
  {
    label: "Taisyklės",
    href: "/terms",
  },
  {
    label: "Privatumo politika",
    href: "/privacy",
  },
]

export function PublicFooter() {
  return (
    <footer className="border-t bg-background">
      <PageContainer className="py-10">
        <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
          <div>
            <Link
              href="/"
              className="text-lg font-semibold tracking-tight"
              aria-label="Parvezk.lt pradinis puslapis"
            >
              parvezk.lt
            </Link>

            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              Automobilių pervežimo marketplace, jungiantis klientus ir vežėjus.
            </p>
          </div>

          <nav
            className="flex flex-wrap gap-x-6 gap-y-3"
            aria-label="Apatinė navigacija"
          >
            {footerLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="mt-8 border-t pt-6 text-sm text-muted-foreground">
          © {new Date().getFullYear()} Parvezk.lt. Visos teisės saugomos.
        </div>
      </PageContainer>
    </footer>
  )
}