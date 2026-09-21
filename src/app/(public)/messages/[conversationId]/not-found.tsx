import Link from "next/link"
import { Button } from "@/components/ui/button"
import { PageContainer } from "@/components/layout/page-container"

export default function ConversationNotFound() {
  return <div className="marketplace-theme bg-background text-foreground"><PageContainer className="py-12"><div className="mx-auto max-w-xl space-y-4 rounded-xl border bg-card p-6 text-center">
    <h1 className="text-3xl font-semibold tracking-tight">Pokalbis nerastas</h1>
    <p className="text-muted-foreground">Šis pokalbis neegzistuoja arba negali būti parodytas.</p>
    <Button nativeButton={false} render={<Link href="/messages" />} className="h-auto min-h-11 whitespace-normal py-3">Grįžti į pokalbius</Button>
  </div></PageContainer></div>
}
