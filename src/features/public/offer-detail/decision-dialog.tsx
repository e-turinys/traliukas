import { useRef, type RefObject } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { formatDateRange } from "@/lib/format-date"
import { formatEur } from "@/lib/format-money"
import type { RequestOffer } from "../request-detail/model"
import { vehicleTransportScope } from "../vehicle-summary"

export function OfferDecisionDialog({ open, onOpenChange, decision, offer, vehicleCount, onConfirm, finalFocus }: {
  open: boolean
  onOpenChange: (open: boolean) => void
  decision: "accept" | "decline"
  offer: RequestOffer
  vehicleCount: number
  onConfirm: () => void
  finalFocus?: RefObject<HTMLElement | null>
}) {
  const cancel = useRef<HTMLButtonElement>(null)
  const accepting = decision === "accept"
  return <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent role="alertdialog" showCloseButton={false} initialFocus={cancel} finalFocus={finalFocus}>
      <DialogHeader>
        <DialogTitle className="leading-snug">{accepting ? "Priimti pasiūlymą?" : "Atmesti pasiūlymą?"}</DialogTitle>
        <DialogDescription>{accepting
          ? `Priimate ${formatEur(offer.totalPriceEur)} pasiūlymą už ${vehicleTransportScope(vehicleCount)} pagal visus užklausoje nurodytus maršrutus. Pasirinkus šį vežėją, kiti pasiūlymai taptų nebepasirenkami.`
          : "Šioje demonstracijoje pasiūlymas bus atmestas tik šiame puslapyje."}</DialogDescription>
      </DialogHeader>
      <dl className="grid gap-3 rounded-lg bg-muted p-4 text-sm sm:grid-cols-2">
        <div className="min-w-0 sm:col-span-2"><dt className="text-muted-foreground">Vežėjas</dt><dd className="break-words font-medium">{offer.carrier.name}</dd></div>
        <div><dt className="text-muted-foreground">Visa pervežimo kaina</dt><dd className="font-medium">{formatEur(offer.totalPriceEur)}</dd></div>
        <div><dt className="text-muted-foreground">Paėmimas</dt><dd>{formatDateRange(offer.pickupDate)}</dd></div>
        <div><dt className="text-muted-foreground">Planuojamas pristatymas</dt><dd>{formatDateRange(offer.deliveryDate)}</dd></div>
        <div className="min-w-0"><dt className="text-muted-foreground">Apmokėjimas</dt><dd className="break-words">{offer.paymentTerms}</dd></div>
      </dl>
      <DialogFooter>
        <Button ref={cancel} variant="outline" className="h-auto min-h-11 py-3 whitespace-normal" onClick={() => onOpenChange(false)}>Atšaukti</Button>
        <Button variant={accepting ? "default" : "destructive"} className="h-auto min-h-11 py-3 whitespace-normal" onClick={onConfirm}>{accepting ? "Patvirtinti pasirinkimą" : "Patvirtinti atmetimą"}</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
}
