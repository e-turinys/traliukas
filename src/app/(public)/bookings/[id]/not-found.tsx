import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function BookingNotFound() {
  return <div className="mx-auto max-w-xl space-y-4 py-16 text-center">
    <h1 className="text-3xl font-semibold tracking-tight">Pervežimas nerastas</h1>
    <p className="text-muted-foreground">Šis pervežimas neegzistuoja arba negali būti parodytas.</p>
    <Button nativeButton={false} render={<Link href="/dashboard" />}>Grįžti į skydelį</Button>
  </div>
}
