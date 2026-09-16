import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function ConversationNotFound() {
  return <div className="mx-auto max-w-xl space-y-4 py-16 text-center">
    <h1 className="text-3xl font-semibold tracking-tight">Pokalbis nerastas</h1>
    <p className="text-muted-foreground">Šis pokalbis neegzistuoja arba negali būti parodytas.</p>
    <Button nativeButton={false} render={<Link href="/messages" />}>Grįžti į pokalbius</Button>
  </div>
}
